from pydantic import BaseModel
from datetime import datetime, timedelta, timezone, date
from typing import Optional, Dict, Any, List
from jose import JWTError, jwt
from typing import Any
from fastapi import HTTPException
from passlib.context import CryptContext
from backend.config import settings
import secrets
import re
import string



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_random_password(length: int = 12) -> str:
    password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$'
    if length < 8:
            raise ValueError("Password length must be at least 8 characters")

    all_chars = string.ascii_letters + string.digits + string.punctuation
    while True:
            Password = ''.join(secrets.choice(all_chars) for _ in range(length))
            if re.match(password_regex, Password):
                return Password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def validate_password_format(Password: str):
    if not re.search(r'[A-Z]', Password):
        raise ValueError("Must contain at least one uppercase letter")
    if not re.search(r'[a-z]', Password):
        raise ValueError("Must contain at least one lowercase letter")
    if not re.search(r'\d', Password):
        raise ValueError("Must contain at least one number")
    if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', Password):
        raise ValueError("Must contain at least one special character")
    return Password


allowed_user_field_types=["text", "mcq", "msq", "date", "number", "document"]

allowed_validators_per_type_serializable = {
    "text": {"min_length": "number", "max_length": "number"},
    "number": {"min_value": "number", "max_value": "number"},
    "date": {"min_date": "date", "max_date": "date"},
    "document": {"allowed_extensions": "list[str]", "max_size_mb": "number"}
}
