from pydantic import BaseModel
from typing import Optional


class PermissionCreateRequest(BaseModel):
    table_name: str
    method: str
    description: Optional[str] = None


class AssignPermissionRequest(BaseModel):
    role_id: int
    permission_id: int
