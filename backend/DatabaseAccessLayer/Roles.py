from backend.Entities.Roles import Roles
from backend.Entities.Users import Users
from backend.DatabaseAccessLayer.Base import BaseDAL
from sqlalchemy import select, func

class RolesDAL(BaseDAL):
    def __init__(self):
        super().__init__(Roles)

    async def create_role(
        self,
        name: str,
        description: str = None,
        registration_allowed: bool = False,
        registration_by_roles: list[int] = None
    ):
        existing_role = await self.get_role_by_name(name)
        if existing_role:
            return None

        new_role = Roles(
            Name=name,
            Description=description,
            RegistrationAllowed=registration_allowed,
            RegistrationByRoles=registration_by_roles or []  # NEW FIELD
        )
        return await self.add(new_role)

    async def get_all_roles(self):
        return await self.get_all()

    async def update_role(
        self,
        role_id: int,
        name: str = None,
        description: str = None,
        registration_allowed: bool = None,
        registration_by_roles: list[int] = None  # NEW PARAM
    ):
        role = await self.get_by_id(role_id)
        if not role:
            return None

        if name:
            existing_role = await self.get_role_by_name(name)
            if existing_role and existing_role.Id != role_id:
                raise ValueError("Role name must be unique")
            role.Name = name

        if description is not None:
            role.Description = description

        if registration_allowed is not None:
            role.RegistrationAllowed = registration_allowed

        if registration_by_roles is not None:
            role.RegistrationByRoles = registration_by_roles

        return await self.update(role)

    async def delete_role(self, role_id: int):
        # Check if users exist for this role
        stmt = select(func.count()).select_from(Users).where(Users.RoleId == role_id)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            user_count = result.scalar_one()

        if user_count > 0:
            return False

        role = await self.get_by_id(role_id)
        if role:
            await self.delete(role) 
            return True
        return False

    async def get_role_by_name(self, name: str):
        stmt = select(Roles).where(Roles.Name == name)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
        
    async def get_roles_for_signup(self):
        stmt = select(Roles).where(Roles.RegistrationAllowed == True)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalars().all()

    async def get_roles_actor_can_create(self, actor_role_id: int):
        """
        Returns all roles the actor can create.

        Rules:
        - SUPER USER:
            * Can create ALL roles (including Admin, including their own)
        - ADMIN:
            * Can create all roles EXCEPT:
                - Super User
                - Their own role (Admin)
        - NORMAL USER:
            * Can create roles where actor_role_id ∈ RegistrationByRoles
            * Cannot create Admin
            * Cannot create their own role
        """

        async with self.session_scope() as session:

            # 1️⃣ Fetch actor role
            actor_stmt = select(Roles).where(Roles.Id == actor_role_id)
            actor_result = await session.execute(actor_stmt)
            actor_role = actor_result.scalar_one_or_none()

            if not actor_role:
                return []

            actor_role_name = actor_role.Name

            # Fetch Super User & Admin IDs
            super_stmt = select(Roles).where(Roles.Name == "Super User")
            super_role = (await session.execute(super_stmt)).scalar_one_or_none()
            super_role_id = super_role.Id if super_role else None

            admin_stmt = select(Roles).where(Roles.Name == "Admin")
            admin_role = (await session.execute(admin_stmt)).scalar_one_or_none()
            admin_role_id = admin_role.Id if admin_role else None

            # 2️⃣ SUPER USER → full access (no exclusions)
            if actor_role_name == "Super User":
                stmt = select(Roles)  # SUPER USER sees all
                result = await session.execute(stmt)
                return result.scalars().all()

            # 3️⃣ ADMIN → can create all EXCEPT Super User & own role
            if actor_role_name == "Admin":
                stmt = select(Roles)

                # Exclude Super User
                if super_role_id:
                    stmt = stmt.where(Roles.Id != super_role_id)

                # Exclude their own role
                stmt = stmt.where(Roles.Id != actor_role_id)

                result = await session.execute(stmt)
                return result.scalars().all()

            # 4️⃣ NORMAL USERS → Only roles they are allowed to create
            stmt = select(Roles).where(
                Roles.RegistrationByRoles.contains([actor_role_id]),
                Roles.Id != actor_role_id  # cannot create own role
            )

            # Exclude Admin always
            if admin_role_id:
                stmt = stmt.where(Roles.Id != admin_role_id)

            result = await session.execute(stmt)
            return result.scalars().all()
