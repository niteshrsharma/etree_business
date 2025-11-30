from backend.DatabaseAccessLayer.Base import BaseDAL
from backend.Entities.Permissions import Permissions
from backend.Entities.RolePermissions import RolePermissions
from backend.Entities.Roles import Roles
from sqlalchemy import select, delete


class RolePermissionsCombinedDAL(BaseDAL):
    """
    One DAL that handles:
        - Permissions table
        - RolePermissions table (many-to-many mapping)
    """
    def __init__(self):
        # The model does not matter for BaseDAL since we override all methods.
        super().__init__(RolePermissions)

    async def create_permission(self, table_name: str, method: str, description: str = None):
        """
        Adds a new permission to the Permissions table.
        """
        perm = Permissions(
            TableName=table_name.lower(),
            Method=method.lower(),
            Description=description
        )
        return await self.add(perm)

    async def get_permission_by_id(self, permission_id: int):
        return await self.get_by_id(permission_id)

    async def get_permission(self, table_name: str, method: str):
        """
        Fetch permission matching {table}.{method}
        """
        async with self.session_scope() as session:
            stmt = (
                select(Permissions)
                .where(
                    Permissions.TableName.ilike(table_name),
                    Permissions.Method.ilike(method)
                )
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_all_permissions(self):
        async with self.session_scope() as session:
            stmt = select(Permissions)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def role_has_permission(self, role_id: int, table_name: str, method: str) -> bool:
        """
        Returns True if the given role has {table}.{method} permission
        """
        async with self.session_scope() as session:
            stmt = (
                select(RolePermissions)
                .join(Permissions)
                .where(
                    RolePermissions.RoleId == role_id,
                    Permissions.TableName.ilike(table_name),
                    Permissions.Method.ilike(method)
                )
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none() is not None

    async def get_permissions_for_role(self, role_id: int):
        """
        Returns list of Permissions objects belonging to the role
        """
        async with self.session_scope() as session:
            stmt = (
                select(Permissions)
                .join(RolePermissions, Permissions.Id == RolePermissions.PermissionId)
                .where(RolePermissions.RoleId == role_id)
            )
            result = await session.execute(stmt)
            return result.scalars().all()

    async def add_permission_to_role(self, role_id: int, permission_id: int):
        """
        Assigns permission to a role. Prevents duplicates.
        """

        # Validate Role exists
        async with self.session_scope() as session:
            role = await session.get(Roles, role_id)
            if not role:
                raise ValueError(f"Role with id '{role_id}' does not exist")

        # Validate Permission exists
        async with self.session_scope() as session:
            perm = await session.get(Permissions, permission_id)
            if not perm:
                raise ValueError(f"Permission with id '{permission_id}' does not exist")

        # Check duplicate
        exists = await self.role_has_permission(role_id, perm.TableName, perm.Method)
        if exists:
            return False

        role_perm = RolePermissions(
            RoleId=role_id,
            PermissionId=permission_id
        )
        return await self.add(role_perm)

    async def remove_permission_from_role(self, role_id: int, permission_id: int):
        """
        Removes a permission from a role.
        """
        async with self.session_scope() as session:
            stmt = (
                delete(RolePermissions)
                .where(
                    RolePermissions.RoleId == role_id,
                    RolePermissions.PermissionId == permission_id
                )
                .returning(RolePermissions.RoleId)
            )
            result = await session.execute(stmt)
            return result.scalar_one_or_none() is not None

    async def clear_permissions_for_role(self, role_id: int):
        """
        Removes ALL permissions belonging to a role.
        """
        async with self.session_scope() as session:
            stmt = delete(RolePermissions).where(RolePermissions.RoleId == role_id)
            await session.execute(stmt)
        return True
