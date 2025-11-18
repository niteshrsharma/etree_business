from pydantic import BaseModel, EmailStr, constr
from typing import Any, Optional, Dict, List

class CreateUserModel(BaseModel):
    full_name: constr(min_length=1, max_length=200)
    email: EmailStr
    password: constr(min_length=8) 
    role_id: int

# ---------------- Login User ----------------
class LoginUserModel(BaseModel):
    email: EmailStr
    password: str


class UserFieldResponse(BaseModel):
    field_id: int
    field_name: str
    field_type: str
    is_required: bool
    filled: bool
    value: Optional[Any]
    options: Optional[List[Dict]] = None
    validation: Optional[Dict] = None

    
class UserFieldValue(BaseModel):
    value: Any