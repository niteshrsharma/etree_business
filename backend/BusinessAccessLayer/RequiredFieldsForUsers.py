from typing import Optional, List, Dict
from fastapi import HTTPException
from backend.DatabaseAccessLayer.RequiredFieldsForUsers import RequiredFieldsForUsersDAL
from backend.Schemas.ResponseMessage import ResponseMessage
from backend.Entities.RequiredFieldsForUsers import RequiredFieldsForUsers

class RequiredFieldsForUsersBAL:
    def __init__(self):
        self.dal = RequiredFieldsForUsersDAL()

    async def create_field(
        self,
        role_id: int,
        field_name: str,
        field_type: str,
        is_required: bool = False,
        filled_by_role_id: int = None,
        editable_by_role_id: int = None,
        options: dict = None,
        validation: dict = None,
        display_order: int = None,
        is_active: bool = True
    ) -> ResponseMessage:
        if not field_name or not field_name.strip():
            raise HTTPException(status_code=400, detail="Field name cannot be empty")
        if not field_type or not field_type.strip():
            raise HTTPException(status_code=400, detail="Field type cannot be empty")

        new_field = await self.dal.create_required_field(
            role_id=role_id,
            field_name=field_name.strip(),
            field_type=field_type.strip(),
            is_required=is_required,
            filled_by_role_id=filled_by_role_id,
            editable_by_role_id=editable_by_role_id,
            options=options,
            validation=validation,
            display_order=display_order,
            is_active=is_active
        )

        if not new_field:
            raise HTTPException(
                status_code=409,
                detail=f"Field '{field_name}' already exists for role {role_id}"
            )

        return ResponseMessage(
            status="success",
            message=f"Field '{field_name}' created successfully for role {role_id}",
            data={"field_id": str(new_field.Id), "field_name": new_field.FieldName}
        )

    # ---------------- GET FIELDS ----------------
    async def get_fields_by_role(self, role_id: int) -> List[RequiredFieldsForUsers]:
        return await self.dal.get_fields_by_role(role_id)

    async def get_active_fields(self, role_id: Optional[int] = None) -> List[RequiredFieldsForUsers]:
        return await self.dal.get_active_fields(role_id)

    async def get_field_by_name(self, role_id: int, field_name: str) -> Optional[RequiredFieldsForUsers]:
        field = await self.dal.get_field_by_name(role_id, field_name)
        if not field:
            raise HTTPException(status_code=404, detail=f"Field '{field_name}' not found for role {role_id}")
        return field

    # ---------------- UPDATE FIELD ----------------
    async def update_field(
        self,
        field_id: int,
        field_name: Optional[str] = None,
        field_type: Optional[str] = None,
        is_required: Optional[bool] = None,
        filled_by_role_id: Optional[int] = None,
        editable_by_role_id: Optional[int] = None,
        options: Optional[Dict] = None,
        validation: Optional[Dict] = None,
        display_order: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> RequiredFieldsForUsers:
        field = await self.dal.get_by_id(field_id)
        if not field:
            raise HTTPException(status_code=404, detail=f"Field with id {field_id} not found")

        if field_name:
            field.FieldName = field_name.strip()
        if field_type:
            field.FieldType = field_type.strip()
        if is_required is not None:
            field.IsRequired = is_required
        if filled_by_role_id is not None:
            field.FilledByRoleId = filled_by_role_id
        if editable_by_role_id is not None:
            field.EditableByRoleId = editable_by_role_id
        if options is not None:
            field.Options = options
        if validation is not None:
            field.Validation = validation
        if display_order is not None:
            field.DisplayOrder = display_order
        if is_active is not None:
            field.IsActive = is_active

        return await self.dal.update(field)

    # ---------------- DELETE FIELD ----------------
    async def delete_field(self, field_id: int) -> ResponseMessage:
        deleted = await self.dal.delete_field(field_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Field with id {field_id} not found")
        return ResponseMessage(status="success", message=f"Field with id {field_id} deleted successfully")

    async def deactivate_field(self, field_id: int) -> ResponseMessage:
        deactivated = await self.dal.deactivate_field(field_id)
        if not deactivated:
            raise HTTPException(status_code=404, detail=f"Field with id {field_id} not found")

        return ResponseMessage(
            status="success",
            message=f"Field with id {field_id} has been deactivated successfully"
        )
    
    async def activate_field(self, field_id: int) -> ResponseMessage:
        activated = await self.dal.activate_field(field_id)
        if not activated:
            raise HTTPException(status_code=404, detail=f"Field with id {field_id} not found")

        return ResponseMessage(
            status="success",
            message=f"Field with id {field_id} has been activated successfully"
        )