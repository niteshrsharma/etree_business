from backend.Entities.Roles import Roles
from backend.Entities.Users import Users
from backend.DatabaseAccessLayer.Base import BaseDAL
from sqlalchemy import select, func

class RolesDAL(BaseDAL):
    def __init__(self):
        super().__init__(Roles)

    async def create_role(self, name: str, description: str = None, registration_allowed: bool = False):
        existing_role = await self.get_role_by_name(name)
        if existing_role:
            return None
        new_role = Roles(Name=name, Description=description, RegistrationAllowed=registration_allowed)
        return await self.add(new_role)  # BaseDAL helper

    async def get_all_roles(self):
        return await self.get_all()

    async def update_role(self, role_id: int, name: str = None, description: str = None, registration_allowed: bool = None):
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

        if registration_allowed is not None:   # allow update if explicitly passed
            role.RegistrationAllowed = registration_allowed

        return await self.update(role)  # BaseDAL helper

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

