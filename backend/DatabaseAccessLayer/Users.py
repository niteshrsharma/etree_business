from backend.Entities.Users import Users
from backend.Entities.Roles import Roles
from backend.DatabaseAccessLayer.Base import BaseDAL
from sqlalchemy.orm import joinedload
from sqlalchemy import select

class UsersDAL(BaseDAL):
    def __init__(self):
        super().__init__(Users)

    async def create_user(self, full_name: str, email: str, password: str, role_id: int):
        # Check if email exists
        existing_user = await self.get_user_by_email(email)
        if existing_user:
            raise ValueError(f"User with email '{email}' already exists")

        # Ensure role exists
        async with self.session_scope() as session:
            role = await session.get(Roles, role_id)
            if not role:
                raise ValueError(f"Role with id '{role_id}' does not exist")

        new_user = Users(
            FullName=full_name,
            Email=email,
            Password=password,
            RoleId=role_id
        )
        return await self.add(new_user)  # BaseDAL helper

    async def get_user_by_id(self, user_id: int, active: bool = None):
        user = await self.get_by_id(user_id)  # BaseDAL helper
        if user and active is not None and user.IsActive != active:
            return None
        return user

    async def get_user_by_email(self, email: str, active: bool = None):
        stmt = select(Users).where(Users.Email == email)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
        if user and active is not None and user.IsActive != active:
            return None
        return user

    async def get_all_users(self, filters=None, active: bool = None):
        users = await self.get_all(filters)  # BaseDAL helper
        if active is not None:
            users = [u for u in users if u.IsActive == active]
        return users

    async def update_user(self, user_id: int, full_name: str = None, email: str = None,
                          password: str = None, role_id: int = None, profile_picture: str = None):
        user = await self.get_by_id(user_id)
        if not user:
            return None

        if email:
            existing_user = await self.get_user_by_email(email)
            if existing_user and existing_user.Id != user_id:
                raise ValueError("Email must be unique")
            user.Email = email

        if full_name:
            user.FullName = full_name
        if password:
            user.Password = password
        if role_id:
            async with self.session_scope() as session:
                role = await session.get(Roles, role_id)
                if not role:
                    raise ValueError(f"Role with id '{role_id}' does not exist")
            user.RoleId = role_id
        if profile_picture is not None:
            user.ProfilePicture = profile_picture

        return await self.update(user)  # BaseDAL helper

    async def delete_user(self, user_id: int):
        user = await self.get_by_id(user_id)
        if not user:
            return False
        await self.delete(user)  # BaseDAL helper
        return True

    async def get_user_with_role(self, user_id: int, active: bool = None):
        stmt = select(Users).options(joinedload(Users.Role)).where(Users.Id == user_id)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
        if user and active is not None and user.IsActive != active:
            return None
        return user
