from pydantic import BaseModel

class RoleRequest(BaseModel):
    name: str
    description: str = ""
    registration_allowed: bool = False