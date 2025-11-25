from pydantic import BaseModel
from typing import List

class RoleRequest(BaseModel):
    name: str
    description: str = ""
    registration_allowed: bool = False
    registration_by_roles: List[int] = []