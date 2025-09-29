from pydantic import BaseModel
from typing import Optional, Any

class ResponseMessage(BaseModel):
    status: str
    message: str
    data: Optional[Any] = None
    model_config = {
        "from_attributes": True
    }