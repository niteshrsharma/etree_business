from fastapi import HTTPException
from backend.DatabaseAccessLayer.RolePermissionsCombinedDal import RolePermissionsCombinedDAL
from backend.Entities.Permissions import Permissions


class PermissionsBAL:

    def __init__(self):
        self.dal = RolePermissionsCombinedDAL()

    async def check_permission(self, user, table_name: str, method: str):
        """
        Public reusable permission checker.
        BALs can call this freely to enforce {table}.{method} rules.
        """
        allowed = await self.dal.role_has_permission(
            user.RoleId,
            table_name,
            method
        )

        if not allowed:
            raise HTTPException(
                status_code=403,
                detail=f"You do not have permission to {method} {table_name}"
            )

    # ============================================================
    # PERMISSIONS CRUD
    # ============================================================

    async def create_permission(self, table_name: str, method: str, description: str = None) -> Permissions:
        return await self.dal.create_permission(table_name, method, description)

    async def get_all_permissions(self):
        return await self.dal.get_all_permissions()

    # ============================================================
    # ROLE PERMISSION MAPPING
    # ============================================================

    async def assign_permission(self, role_id: int, permission_id: int):
        success = await self.dal.add_permission_to_role(role_id, permission_id)
        if not success:
            raise HTTPException(400, "Permission already assigned to role")
        return True

    async def remove_permission(self, role_id: int, permission_id: int):
        removed = await self.dal.remove_permission_from_role(role_id, permission_id)
        if not removed:
            raise HTTPException(404, "Role-permission mapping not found")
        return True

    async def get_permissions_for_role(self, role_id: int):
        return await self.dal.get_permissions_for_role(role_id)
