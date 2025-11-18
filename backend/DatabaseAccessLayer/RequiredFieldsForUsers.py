from backend.Entities.RequiredFieldsForUsers import RequiredFieldsForUsers
from backend.DatabaseAccessLayer.Base import BaseDAL
from sqlalchemy import select, and_
from datetime import datetime

class RequiredFieldsForUsersDAL(BaseDAL):
    def __init__(self):
        super().__init__(RequiredFieldsForUsers)

    async def create_required_field(
        self,
        role_id: int,
        field_name: str,
        field_type: str,
        is_required: bool = True,
        filled_by_role_id: int = None,
        editable_by_role_id: int = None,
        options: dict = None,
        validation: dict = None,
        display_order: int = None,
        is_active: bool = True
    ):
        existing_field = await self.get_field_by_name(role_id, field_name)
        if existing_field:
            return None

        if validation:
            for key, val in validation.items():
                if isinstance(val, datetime):
                    validation[key] = val.isoformat()

        new_field = RequiredFieldsForUsers(
            RoleId=role_id,
            FieldName=field_name,
            FieldType=field_type,
            IsRequired=is_required,
            FilledByRoleId=filled_by_role_id if filled_by_role_id is not None else role_id,
            EditableByRoleId=editable_by_role_id if editable_by_role_id is not None else role_id,
            Options=options,
            Validation=validation,
            DisplayOrder=display_order,
            IsActive=is_active
        )

        return await self.add(new_field) 

    async def get_fields_by_role(self, role_id: int):
        stmt = select(RequiredFieldsForUsers).where(RequiredFieldsForUsers.RoleId == role_id)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalars().all()
        
    async def get_field_by_name(self, role_id: int, field_name: str):
        stmt = select(RequiredFieldsForUsers).where(
            and_(
                RequiredFieldsForUsers.RoleId == role_id,
                RequiredFieldsForUsers.FieldName == field_name
            )
        )
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    async def get_active_fields(self, role_id: int = None):
        stmt = select(RequiredFieldsForUsers).where(RequiredFieldsForUsers.IsActive.is_(True))
        if role_id is not None:
            stmt = stmt.where(RequiredFieldsForUsers.RoleId == role_id)
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalars().all()

    async def delete_field(self, field_id: int):
        field = await self.get_by_id(field_id)
        if field:
            await self.delete(field)
            return True
        return False

    async def deactivate_field(self, field_id: int) -> bool:
        field = await self.get_by_id(field_id)
        if not field:
            return False  # Field not found

        field.IsActive = False
        async with self.session_scope() as session:
            session.add(field)
            await session.commit()
            await session.refresh(field)

        return True
    
    async def activate_field(self, field_id: int) -> bool:
        field = await self.get_by_id(field_id)
        if not field:
            return False  # Field not found

        field.IsActive = True
        async with self.session_scope() as session:
            session.add(field)
            await session.commit()
            await session.refresh(field)

        return True