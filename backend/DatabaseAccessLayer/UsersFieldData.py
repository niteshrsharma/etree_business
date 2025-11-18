from backend.Entities.UsersFieldData import UsersFieldData
from backend.DatabaseAccessLayer.Base import BaseDAL
from sqlalchemy import select, and_
from typing import Optional, List
import uuid


class UsersFieldDataDAL(BaseDAL):
    def __init__(self):
        super().__init__(UsersFieldData)

    async def create_or_update_user_field_data(
        self,
        user_id: uuid.UUID,
        required_field_id: int,
        value
    ) -> UsersFieldData:
        # Wrap value in {"data": ...}
        value_json = {"data": value}

        # Check if entry already exists
        existing_data = await self.get_by_user_and_field(user_id, required_field_id)

        if existing_data:
            existing_data.Value = value_json
            async with self.session_scope() as session:
                session.add(existing_data)
                await session.commit()
                await session.refresh(existing_data)
            return existing_data

        # Create new entry
        new_data = UsersFieldData(
            UserId=user_id,
            RequiredFieldId=required_field_id,
            Value=value_json
        )
        return await self.add(new_data)

    async def get_by_user_and_field(self, user_id: uuid.UUID, required_field_id: int) -> Optional[UsersFieldData]:
        stmt = select(UsersFieldData).where(
            and_(
                UsersFieldData.UserId == user_id,
                UsersFieldData.RequiredFieldId == required_field_id
            )
        )
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_all_by_user(self, user_id: uuid.UUID) -> List[UsersFieldData]:
        stmt = select(UsersFieldData).where(UsersFieldData.UserId == user_id)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalars().all()

    async def delete_user_field_data(self, data_id: int) -> bool:
        data = await self.get_by_id(data_id)
        if data:
            await self.delete(data)
            return True
        return False
