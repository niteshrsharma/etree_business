from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime
from backend.Utils.helpers import allowed_user_field_types, allowed_validators_per_type_serializable


class OptionSchema(BaseModel):
    label: str
    is_correct: Optional[bool] = None

    @field_validator("is_correct", mode="before")
    def normalize_is_correct(cls, v):
        """Ensure is_correct is either True, False, or None."""
        if v in ("null", "None", "", None):
            return None
        if isinstance(v, bool):
            return v
        raise ValueError("'is_correct' must be True, False, or None")


class FieldCreateSchema(BaseModel):
    role_id: int
    field_name: str
    field_type: str
    is_required: bool = False
    filled_by_role_id: Optional[int] = None
    editable_by_role_id: Optional[int] = None
    options: Optional[List[OptionSchema]] = None
    validation: Optional[Dict[str, Any]] = None
    display_order: Optional[int] = None
    is_active: bool = True

    @field_validator("field_name")
    def validate_field_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Field name cannot be empty")
        return v.strip()

    @field_validator("field_type")
    def validate_field_type(cls, v):
        if v not in allowed_user_field_types:
            raise ValueError(f"Field type must be one of {allowed_user_field_types}")
        return v

    @model_validator(mode="after")
    def validate_options_and_validation(cls, values):
        field_type = values.field_type
        options = values.options
        validation = values.validation or {}

        # --- MCQ/MSQ Options Validation ---
        if field_type in ("mcq", "msq"):
            if not options or len(options) == 0:
                raise ValueError(f"Options are required for '{field_type}' fields")
        else:
            if options is not None:
                raise ValueError("Options can only be provided for 'mcq' or 'msq' fields")

        # --- Validation Key Type Check ---
        allowed_keys = allowed_validators_per_type_serializable.get(field_type, {})

        if field_type == "document":
            missing_keys = [k for k in allowed_keys if k not in validation]
            if missing_keys:
                raise ValueError(f"All validation keys are required for 'document'. Missing: {missing_keys}")
        
        for key, val in validation.items():
            if key not in allowed_keys:
                raise ValueError(f"Validation key '{key}' is not allowed for field type '{field_type}'")

            expected_type = allowed_keys[key]
            if expected_type == "list[str]":
                if not isinstance(val, list) or not all(isinstance(i, str) for i in val):
                    raise ValueError(f"Validation key '{key}' must be a list of strings for '{field_type}'")
            elif expected_type == "int":
                if not isinstance(val, int):
                    raise ValueError(f"Validation key '{key}' must be an integer for '{field_type}'")
            elif expected_type == "number":
                if not isinstance(val, (int, float)):
                    raise ValueError(f"Validation key '{key}' must be a number for '{field_type}'")
            elif expected_type == "date":
                if isinstance(val, str):
                    try:
                        val = datetime.fromisoformat(val)
                        validation[key] = val
                    except Exception:
                        raise ValueError(f"Validation key '{key}' must be a datetime for '{field_type}'")
                elif not isinstance(val, datetime):
                    raise ValueError(f"Validation key '{key}' must be a datetime for '{field_type}'")

        return values


class FieldUpdateSchema(BaseModel):
    field_name: Optional[str] = None
    field_type: Optional[str] = None
    is_required: Optional[bool] = None
    filled_by_role_id: Optional[int] = None
    editable_by_role_id: Optional[int] = None
    options: Optional[List[OptionSchema]] = None
    validation: Optional[Dict[str, Any]] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator("field_name")
    def validate_field_name(cls, v):
        if v and not v.strip():
            raise ValueError("Field name cannot be empty")
        return v.strip() if v else v

    @field_validator("field_type")
    def validate_field_type(cls, v):
        if v and v not in allowed_user_field_types:
            raise ValueError(f"Field type must be one of {allowed_user_field_types}")
        return v

    @model_validator(mode="after")
    def validate_options_and_validation(cls, values):
        field_type = getattr(values, "field_type", None)
        options = getattr(values, "options", None)
        validation = getattr(values, "validation", {}) or {}

        # --- MCQ/MSQ Options Validation ---
        if field_type in ("mcq", "msq"):
            if options is not None and len(options) == 0:
                raise ValueError(f"Options cannot be an empty list for '{field_type}' fields")
        elif options is not None:
            raise ValueError("Options can only be provided for 'mcq' or 'msq' fields")

        # --- Validation Key Type Check ---
        allowed_keys = allowed_validators_per_type_serializable.get(field_type, {})

        if field_type == "document" and validation is not None:
            missing_keys = [k for k in allowed_keys if k not in validation]
            if missing_keys:
                raise ValueError(f"All validation keys are required for 'document'. Missing: {missing_keys}")
        
        for key, val in validation.items():
            if key not in allowed_keys:
                raise ValueError(f"Validation key '{key}' is not allowed for field type '{field_type}'")

            expected_type = allowed_keys[key]
            if expected_type == "list[str]":
                if not isinstance(val, list) or not all(isinstance(i, str) for i in val):
                    raise ValueError(f"Validation key '{key}' must be a list of strings for '{field_type}'")
            elif expected_type == "int":
                if not isinstance(val, int):
                    raise ValueError(f"Validation key '{key}' must be an integer for '{field_type}'")
            elif expected_type == "number":
                if not isinstance(val, (int, float)):
                    raise ValueError(f"Validation key '{key}' must be a number for '{field_type}'")
            elif expected_type == "date":
                if isinstance(val, str):
                    try:
                        val = datetime.fromisoformat(val)
                        validation[key] = val
                    except Exception:
                        raise ValueError(f"Validation key '{key}' must be a datetime for '{field_type}'")
                elif not isinstance(val, datetime):
                    raise ValueError(f"Validation key '{key}' must be a datetime for '{field_type}'")

        return values


class RequiredFieldResponse(BaseModel):
    Id: int
    RoleId: int
    FieldName: str
    FieldType: str
    IsRequired: bool
    FilledByRoleId: int
    EditableByRoleId: Optional[int] = None
    Options: Optional[List[OptionSchema]] = None  # ✅ Aligned casing
    Validation: Optional[Dict[str, Any]] = None
    DisplayOrder: Optional[int] = None
    IsActive: bool
    CreatedAt: datetime
    UpdatedAt: datetime

    model_config = {
        "from_attributes": True
    }
