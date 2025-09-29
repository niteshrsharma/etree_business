from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class CreateUserModel(BaseModel):
    full_name: constr(min_length=1, max_length=200)
    email: EmailStr
    password: constr(min_length=8)  # you can enforce stronger constraints in helper
    role_id: int
    profile_picture: Optional[str] = None  # optional field

# ---------------- Login User ----------------
class LoginUserModel(BaseModel):
    email: EmailStr
    password: str
