from typing import Optional, List, Any
from fastapi import APIRouter, Query, Depends
from backend.BusinessAccessLayer.RequiredFieldsForUsers import RequiredFieldsForUsersBAL
from backend.BusinessAccessLayer.Users import UsersBAL
from backend.Schemas.ResponseMessage import ResponseMessage
from backend.Schemas.RequiredFieldsForUsers import (
    FieldCreateSchema,
    FieldUpdateSchema,
    RequiredFieldResponse
)
from backend.Utils.helpers import allowed_user_field_types, allowed_validators_per_type_serializable

router = APIRouter()
bal = RequiredFieldsForUsersBAL()
users_bal = UsersBAL()


# Create a new field
@router.post("/", response_model=ResponseMessage)
async def create_field(field: FieldCreateSchema, user=Depends(users_bal.is_valid_user('Super User', 'Admin'))):
    result = await bal.create_field(**field.dict())
    return ResponseMessage(status="success", message="Field created", data=result)


# Get the list of allowed user field types.
@router.get("/field-types", response_model=ResponseMessage)
def get_field_types():
    return ResponseMessage(status="success", message="Allowed field types fetched", data=allowed_user_field_types)


# Get validators by field type
@router.get("/validators-by-type/{field_type}", response_model=ResponseMessage)
def get_validators_by_type(field_type: str):
    if field_type not in allowed_user_field_types:
        return ResponseMessage(
            status="error",
            message=f"Invalid field type '{field_type}'. Allowed types: {allowed_user_field_types}",
            data=None
        )
    validators = allowed_validators_per_type_serializable.get(field_type, {})
    return ResponseMessage(status="success", message=f"Validators for '{field_type}' fetched", data=validators)


# Get all fields for a role
@router.get("/role/{role_id}", response_model=ResponseMessage)
async def get_fields_by_role(role_id: int):
    fields = await bal.get_fields_by_role(role_id)
    data = [RequiredFieldResponse.from_orm(f) for f in fields]
    return ResponseMessage(status="success", message=f"Fields for role {role_id} fetched", data=data)


# Get all active fields (optionally filtered by role)
@router.get("/active", response_model=ResponseMessage)
async def get_active_fields(role_id: Optional[int] = Query(None)):
    fields = await bal.get_active_fields(role_id)
    return ResponseMessage(status="success", message="Active fields fetched", data=fields)


# Get field by name for a role
@router.get("/role/{role_id}/name/{field_name}", response_model=ResponseMessage)
async def get_field_by_name(role_id: int, field_name: str):
    field = await bal.get_field_by_name(role_id, field_name)
    return ResponseMessage(status="success", message=f"Field '{field_name}' fetched", data=field)


# Update a field
@router.put("/{field_id}", response_model=ResponseMessage)
async def update_field(field_id: int, field_update: FieldUpdateSchema, user=Depends(users_bal.is_valid_user('Super User', 'Admin'))):
    updated_field = await bal.update_field(field_id, **field_update.dict(exclude_unset=True))
    return ResponseMessage(status="success", message=f"Field {field_id} updated", data=updated_field)


# Delete a field
@router.delete("/{field_id}", response_model=ResponseMessage)
async def delete_field(field_id: int, user=Depends(users_bal.is_valid_user('Super User', 'Admin'))):
    result = await bal.delete_field(field_id)
    return ResponseMessage(status="success", message=f"Field {field_id} deleted", data=result)


# Deactivate a field
@router.patch("/{field_id}/deactivate", response_model=ResponseMessage)
async def deactivate_field(field_id: int, user=Depends(users_bal.is_valid_user('Super User', 'Admin'))):
    result = await bal.deactivate_field(field_id)
    return ResponseMessage(status="success", message=f"Field {field_id} deactivated", data=result)


@router.patch("/{field_id}/activate", response_model=ResponseMessage)
async def activate_field(field_id: int, user=Depends(users_bal.is_valid_user('Super User', 'Admin'))):
    result = await bal.activate_field(field_id)
    return ResponseMessage(status="success", message=f"Field {field_id} activated", data=result)