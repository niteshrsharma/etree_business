from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from backend.BusinessAccessLayer.Users import UsersBAL
from backend.BusinessAccessLayer.UsersFieldData import UsersFieldDataBAL
from backend.BusinessAccessLayer.RequiredFieldsForUsers import RequiredFieldsForUsersBAL
from backend.Schemas.ResponseMessage import ResponseMessage
from backend.Schemas.Users import UserFieldValue
from backend.Utils.media import save_protected_file, read_protected_file, del_protected_file
import uuid
from backend.Schemas.Users import CreateUserModel
from backend.BusinessAccessLayer.Roles import RolesBAL

router = APIRouter()
users_bal = UsersBAL()
fields_bal = RequiredFieldsForUsersBAL()
roles_bal = RolesBAL()
user_fields_data_bal = UsersFieldDataBAL()

@router.post("/create-user", response_model=ResponseMessage)
async def create_user(
    response: Response,
    user_data: CreateUserModel,
    actor=Depends(users_bal.is_user_authenticated())
):
    # STEP 1 — Fetch the target role being assigned to the new user
    target_role = await roles_bal.get_role(user_data.role_id)
    if not target_role:
        raise HTTPException(
            status_code=404,
            detail="Target role does not exist"
        )

    actor_role_id = actor.RoleId
    actor_role_name = actor.Role.Name if actor.Role else None

    # STEP 2 — Super User / Admin can create any role
    if actor_role_name in ("Super User", "Admin"):
        pass  # always allowed

    else:
        if target_role.RegistrationAllowed:
            raise HTTPException(
                status_code=403,
                detail="Public signup is allowed for this role, use signup endpoint instead"
            )
        else:
            # STEP 4 — Check if actor’s role is listed in registration_by_roles
            allowed_roles = target_role.RegistrationByRoles or []

            if actor_role_id not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to create a user with this role"
                )

    # STEP 5 — Proceed with actual user creation
    new_user = await users_bal.create_user(
        user_data.full_name,
        user_data.email,
        user_data.password,
        user_data.role_id
    )

    return new_user

@router.get("/by-role/{role_id}", response_model=ResponseMessage)
async def get_users_by_role_id(
    role_id: int,
    actor=Depends(users_bal.is_user_authenticated())
):
    # Fetch target role
    target_role = await roles_bal.get_role(role_id)
    if not target_role:
        raise HTTPException(
            status_code=404,
            detail="Target role not found"
        )

    actor_role_id = actor.RoleId
    actor_role_name = actor.Role.Name if actor.Role else None

    # 1️⃣ SUPER USER / ADMIN → allowed, except Admin role should not be exposed
    if actor_role_name in ("Super User", "Admin"):
        if actor_role_name == "Admin":
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to view Admin users"
            )

        users = await users_bal.get_all_users(filters={"RoleId": role_id})
        return ResponseMessage(
            status="success",
            message="Users fetched successfully",
            data=users
        )

    # 2️⃣ NORMAL USER — must be explicitly allowed
    if target_role.RegistrationAllowed:
        raise HTTPException(
            status_code=403,
            detail="Public signup is allowed for this role; viewing users is restricted"
        )

    allowed_roles = target_role.RegistrationByRoles or []

    if actor_role_id not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view users of this role"
        )

    # Ensure normal users cannot see Admin role or their own role
    if target_role.Name == "Admin" or target_role.Id == actor_role_id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to view users of this role"
        )

    # 3️⃣ GET USERS
    users = await users_bal.get_all_users(filters={"RoleId": role_id})

    return ResponseMessage(
        status="success",
        message="Users fetched successfully",
        data=users
    )


@router.get("/me/fields", response_model=ResponseMessage)
async def get_my_fields(
    target_user_id: Optional[str] = Query(None),
    actor = Depends(users_bal.is_user_authenticated())
):
    target_id = target_user_id or str(actor.Id)

    # Fetch active fields + their filled values
    fields = await user_fields_data_bal.get_user_fields_with_values(
        actor_user=actor,
        target_user_id=target_id
    )

    return ResponseMessage(
        status="success",
        message="Fields fetched successfully",
        data=fields
    )


# Existing update route (modified to accept optional target_user_id)
@router.post("/me/fields/{field_id}", response_model=ResponseMessage)
async def update_my_field(
    field_id: int,
    body: UserFieldValue,
    target_user_id: Optional[str] = Query(None),
    actor=Depends(users_bal.is_user_authenticated())
):
    target_id = target_user_id or str(actor.Id)

    updated = await user_fields_data_bal.set_user_field_data(
        actor_user=actor,
        target_user_id=target_id,
        required_field_id=field_id,
        value=body.value
    )

    return ResponseMessage(
        status="success",
        message="Field updated successfully",
        data={
            "field_id": field_id,
            "value": updated.Value,
            "target_user_id": str(target_id)
        }
    )


# Upload a document for a document-type field
@router.post("/me/fields/{field_id}/upload", response_model=ResponseMessage)
async def upload_field_file(
    field_id: int,
    file: UploadFile = File(...),
    target_user_id: Optional[str] = Query(None),
    actor=Depends(users_bal.is_user_authenticated())
):
    # Determine target
    target_id = target_user_id or str(actor.Id)

    # Validate field exists and is of type 'document'
    required_field = await fields_bal.dal.get_by_id(field_id)
    if not required_field:
        raise HTTPException(status_code=404, detail="Field not found")
    if required_field.FieldType != "document":
        raise HTTPException(status_code=400, detail="Field is not a document type")

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file")

    # Validate extension and size against field.Validation (if present)
    validation = required_field.Validation or {}
    allowed_exts = validation.get("allowed_extensions", [])
    max_size_mb = validation.get("max_size_mb", None)

    # Extension check
    filename = file.filename or ""
    _, ext = (filename.rsplit(".", 1) + [""])[:2]
    ext = f".{ext}" if ext else ""
    if allowed_exts and ext.lower() not in [e.lower() for e in allowed_exts]:
        raise HTTPException(status_code=400, detail=f"File extension not allowed. Allowed: {allowed_exts}")

    # Size check
    size_mb = len(file_bytes) / (1024 * 1024)
    if max_size_mb is not None and size_mb > float(max_size_mb):
        raise HTTPException(status_code=400, detail=f"File size exceeds maximum of {max_size_mb} MB")

    # Save protected file
    stored_name, _ = await save_protected_file(file_bytes, file.content_type)

    # Save field value (we store only { "name": stored_name, "size_mb": size_mb })
    final_value = {"name": stored_name, "size_mb": round(size_mb, 4)}
    updated = await user_fields_data_bal.set_user_field_data(
        actor_user=actor,
        target_user_id=target_id,
        required_field_id=field_id,
        value=final_value
    )

    return ResponseMessage(
        status="success",
        message="File uploaded and field updated",
        data={"field_id": field_id, "value": updated.Value}
    )


# Download a protected file (permission-checked)
@router.get("/me/fields/{field_id}/download")
async def download_field_file(
    field_id: int,
    target_user_id: Optional[str] = Query(None),
    actor=Depends(users_bal.is_user_authenticated())
):
    target_id = target_user_id or str(actor.Id)

    required_field = await fields_bal.dal.get_by_id(field_id)
    if not required_field:
        raise HTTPException(status_code=404, detail="Field not found")

    # get current value for target
    existing_data = await user_fields_data_bal.dal.get_by_user_and_field(uuid.UUID(target_id), field_id)
    if not existing_data:
        raise HTTPException(status_code=404, detail="No file uploaded for this field")

    # File info expected to be { "name": "<stored_filename>", "size_mb": ... }
    file_info = existing_data.Value.get("data") if isinstance(existing_data.Value, dict) else existing_data.Value
    stored_name = file_info.get("name") if isinstance(file_info, dict) else None
    if not stored_name:
        raise HTTPException(status_code=404, detail="Stored file not found in record")

    # Permission: allow if actor role id equals FilledByRoleId or EditableByRoleId,
    # or actor is Super User/Admin (role name)
    actor_role_name = actor.Role.Name if actor.Role else None
    allowed = False
    if actor.RoleId == required_field.FilledByRoleId or (required_field.EditableByRoleId and actor.RoleId == required_field.EditableByRoleId):
        allowed = True
    if actor_role_name in ("Super User", "Admin"):
        allowed = True
    if not allowed:
        raise HTTPException(status_code=403, detail="You do not have permission to download this file")

    # Read file bytes and stream
    try:
        data = await read_protected_file(stored_name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Protected file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

    # Guess MIME
    import mimetypes
    mime_type = mimetypes.guess_type(stored_name)[0] or "application/octet-stream"

    return StreamingResponse(iter([data]), media_type=mime_type,
                             headers={"Content-Disposition": f"attachment; filename={stored_name}"})

# Delete stored file for a field
@router.delete("/me/fields/{field_id}/file", response_model=ResponseMessage)
async def delete_field_file(
    field_id: int,
    target_user_id: Optional[str] = Query(None),
    actor=Depends(users_bal.is_user_authenticated())
):
    target_id = target_user_id or str(actor.Id)

    required_field = await fields_bal.dal.get_by_id(field_id)
    if not required_field:
        raise HTTPException(status_code=404, detail="Field not found")

    existing_data = await user_fields_data_bal.dal.get_by_user_and_field(target_id, field_id)
    if not existing_data:
        raise HTTPException(status_code=404, detail="No file uploaded for this field")

    file_info = existing_data.Value.get("data") if isinstance(existing_data.Value, dict) else existing_data.Value
    stored_name = file_info.get("name") if isinstance(file_info, dict) else None
    if not stored_name:
        raise HTTPException(status_code=404, detail="Stored file not found in record")

    # Permission check (same as download)
    actor_role_name = actor.Role.Name if actor.Role else None
    allowed = False
    if actor.RoleId == required_field.FilledByRoleId or (required_field.EditableByRoleId and actor.RoleId == required_field.EditableByRoleId):
        allowed = True
    if actor_role_name in ("Super User", "Admin"):
        allowed = True
    if not allowed:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this file")

    # Delete file from disk
    await del_protected_file(stored_name)

    # Clear the field (set to null or empty depending on requirement).
    # Here we'll delete the user field record entirely.
    await user_fields_data_bal.dal.delete_user_field_data(existing_data.Id)

    return ResponseMessage(status="success", message="File deleted")
