from pydantic_settings import BaseSettings
import databases
from pydantic import AnyHttpUrl
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    JWT_TOKEN_EXPIRE_MINUTES: int
    PORT: int
    COOKIE_SECURE: bool = False  

    AZURE_COMMUNICATION_CONNECTION_STRING: str
    AZURE_COMMUNICATION_SENDER: str
    SUPER_USER_EMAIL: str

    COOKIE_NAME: str = "access_token"
    COOKIE_HTTPONLY: bool = True
    COOKIE_SAMESITE: str = "lax"
    ALLOWED_ORIGINS_FOR_DEV: List[AnyHttpUrl] = []
    ALLOWED_ORIGINS_FOR_PROD: List[AnyHttpUrl] = []
    IS_DEVMODE: bool

    class Config:
        env_file = "backend/.env"
        env_file_encoding = "utf-8"

settings = Settings()

settings.COOKIE_SECURE = not settings.IS_DEVMODE

database = databases.Database(settings.DATABASE_URL)
