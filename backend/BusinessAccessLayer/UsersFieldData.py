from typing import Any, List, Optional
from fastapi import HTTPException
from backend.Entities.UsersFieldData import UsersFieldData
from backend.DatabaseAccessLayer.UsersFieldData import UsersFieldDataDAL
from backend.DatabaseAccessLayer.RequiredFieldsForUsers import RequiredFieldsForUsersDAL
from backend.Entities.RequiredFieldsForUsers import RequiredFieldsForUsers
from backend.DatabaseAccessLayer.Users import UsersDAL
from backend.Schemas.ResponseMessage import ResponseMessage
from datetime import datetime
import uuid


class UsersFieldDataBAL:
    def __init__(self):
        self.dal = UsersFieldDataDAL()
        self.required_fields_dal = RequiredFieldsForUsersDAL()
        self.users_dal=UsersDAL()

    async def _validate_and_normalize_value(
        self,
        required_field: RequiredFieldsForUsers,
        value: Any
    ) -> dict:
        field_type = required_field.FieldType
        validation = required_field.Validation or {}
        options = required_field.Options or []

        result = {}

        if field_type == "text":
            if not isinstance(value, str):
                raise HTTPException(status_code=400, detail="Expected string for text field")
            min_len = validation.get("min_length")
            max_len = validation.get("max_length")
            if min_len is not None and len(value) < min_len:
                raise HTTPException(status_code=400, detail=f"Text too short, min length {min_len}")
            if max_len is not None and len(value) > max_len:
                raise HTTPException(status_code=400, detail=f"Text too long, max length {max_len}")
            result["data"] = value

        elif field_type == "number":
            if not isinstance(value, (int, float)):
                raise HTTPException(status_code=400, detail="Expected number for number field")
            min_val = validation.get("min_value")
            max_val = validation.get("max_value")
            if min_val is not None and value < min_val:
                raise HTTPException(status_code=400, detail=f"Number too small, min {min_val}")
            if max_val is not None and value > max_val:
                raise HTTPException(status_code=400, detail=f"Number too large, max {max_val}")
            result["data"] = value

        elif field_type == "date":
            if isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value)
                except Exception:
                    raise HTTPException(status_code=400, detail="Invalid date string")
            elif not isinstance(value, datetime):
                raise HTTPException(status_code=400, detail="Expected datetime object for date field")
            min_date = validation.get("min_date")
            max_date = validation.get("max_date")
            if min_date and value < datetime.fromisoformat(min_date):
                raise HTTPException(status_code=400, detail=f"Date too early, min {min_date}")
            if max_date and value > datetime.fromisoformat(max_date):
                raise HTTPException(status_code=400, detail=f"Date too late, max {max_date}")
            result["data"] = value.isoformat()

        elif field_type == "mcq":
            if value not in [opt["label"] for opt in options]:
                raise HTTPException(status_code=400, detail=f"Invalid option chosen for MCQ: {value}")
            result["data"] = value

        elif field_type == "msq":
            if not isinstance(value, list):
                raise HTTPException(status_code=400, detail="Expected list of options for MSQ")
            valid_options = [opt["label"] for opt in options]
            if not all(v in valid_options for v in value):
                raise HTTPException(status_code=400, detail="One or more invalid options for MSQ")
            result["data"] = value

        elif field_type == "document":
            if not isinstance(value, dict) or "name" not in value or "size_mb" not in value:
                raise HTTPException(status_code=400, detail="Document must be a dict with 'name' and 'size_mb'")
            allowed_exts = validation.get("allowed_extensions", [])
            max_size = validation.get("max_size_mb")
            if allowed_exts and not any(value["name"].endswith(ext) for ext in allowed_exts):
                raise HTTPException(status_code=400, detail=f"File extension not allowed, allowed: {allowed_exts}")
            if max_size is not None and value["size_mb"] > max_size:
                raise HTTPException(status_code=400, detail=f"File size exceeds max {max_size} MB")
            result["data"] = value

        else:
            raise HTTPException(status_code=400, detail=f"Unknown field type: {field_type}")

        return result

    async def get_user_fields_with_values(self, actor_user, target_user_id: str):
        """
        Returns all active required fields for the target user's role,
        plus the filled values (if any) and permission checks.
        """
        target_uuid = uuid.UUID(target_user_id)

        # 1. Load target user
        target_user = await self.users_dal.get_by_id(target_uuid)
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

        role_id = target_user.RoleId

        # 2. Load required fields for this role
        fields = await self.required_fields_dal.get_active_fields(role_id)

        # 3. Load existing data for this target user
        existing_data = await self.dal.get_all_by_user(target_uuid)
        data_map = {item.RequiredFieldId: item for item in existing_data}

        result = []

        for field in fields:
            existing = data_map.get(field.Id)
            value = None
            filled = False

            if existing:
                raw = existing.Value
                value = raw.get("data") if isinstance(raw, dict) and "data" in raw else raw
                filled = True

            result.append({
                "field_id": field.Id,
                "field_name": field.FieldName,
                "field_type": field.FieldType,
                "is_required": field.IsRequired,
                "filled": filled,
                "value": value,
                "options": field.Options,
                "validation": field.Validation,
            })

        return result
    
    # ---------------- CREATE OR UPDATE FIELD DATA ----------------
    async def set_user_field_data(
        self,
        actor_user,                 # user performing the action
        target_user_id: uuid.UUID,  # user whose data is being changed
        required_field_id: int,
        value: Any
    ) -> UsersFieldData:

        # STEP 1 — Ensure field exists
        required_field: RequiredFieldsForUsers = await self.required_fields_dal.get_by_id(required_field_id)
        if not required_field:
            raise HTTPException(404, f"Required field with id {required_field_id} not found")

        # STEP 2 — Ensure target user exists
        target_user = await self.users_dal.get_by_id(target_user_id)
        if not target_user:
            raise HTTPException(404, "Target user not found")

        # STEP 3 — High-level target permission
        actor_role_name = actor_user.Role.Name if actor_user.Role else None
        actor_role_id   = actor_user.RoleId
        is_self = str(actor_user.Id) == str(target_user_id)
        is_super = actor_role_name in ("Super User", "Admin")

        # If not self and not superuser → deny
        if not is_self and not is_super:
            raise HTTPException(403, "You are not allowed to modify this user's data")

        # STEP 4 — Check existing data (does user already have a value?)
        existing_data = await self.dal.get_by_user_and_field(target_user_id, required_field_id)

        # STEP 5 — Field-level permissions
        # ------------------------------
        # (A) FIRST FILL
        if existing_data is None:
            # Self-fill
            if is_self and not is_super:
                if required_field.FilledByRoleId != actor_role_id:
                    raise HTTPException(403, "You cannot fill this field")

            # Filling another user's field
            if not is_self and not is_super:
                if required_field.FilledByRoleId != actor_role_id:
                    raise HTTPException(403, "You cannot fill this field for this user")

        # ------------------------------
        # (B) EDITING EXISTING VALUE
        else:
            # No one can edit if EditableByRoleId is NULL — except super
            if required_field.EditableByRoleId is None and not is_super:
                raise HTTPException(403, "This field cannot be edited")

            # Self-edit
            if is_self and not is_super:
                if required_field.EditableByRoleId != actor_role_id:
                    raise HTTPException(403, "You do not have permission to edit this field")

            # Editing someone else's field
            if not is_self and not is_super:
                if required_field.EditableByRoleId != actor_role_id:
                    raise HTTPException(403, "You do not have permission to edit this user's field")

        # STEP 6 — Validate & normalize
        normalized = await self._validate_and_normalize_value(required_field, value)
        final_value = normalized["data"]

        # STEP 7 — Save to DB
        return await self.dal.create_or_update_user_field_data(
            user_id=target_user_id,
            required_field_id=required_field_id,
            value=final_value
        )

    # ---------------- GET FIELD DATA BY USER AND FIELD ----------------
    async def get_user_field_data(self, user_id: uuid.UUID, required_field_id: int) -> Optional[UsersFieldData]:
        return await self.dal.get_by_user_and_field(user_id, required_field_id)

    # ---------------- GET ALL FIELD DATA BY USER ----------------
    async def get_all_user_field_data(self, user_id: uuid.UUID) -> List[UsersFieldData]:
        return await self.dal.get_all_by_user(user_id)

    # ---------------- DELETE FIELD DATA ----------------
    async def delete_user_field_data(self, data_id: int) -> ResponseMessage:
        deleted = await self.dal.delete_user_field_data(data_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Field data with id {data_id} not found")
        return ResponseMessage(status="success", message=f"Field data with id {data_id} deleted successfully")
