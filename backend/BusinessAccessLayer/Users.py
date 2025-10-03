import asyncio
import string
from io import BytesIO
from PIL import Image
from typing import Optional
from fastapi import Response, HTTPException, status, Cookie, UploadFile
from datetime import timedelta
import secrets

from backend.DatabaseAccessLayer.Users import UsersDAL
from backend.DatabaseAccessLayer.Roles import RolesDAL
from backend.DatabaseAccessLayer.Otps import OtpsDAL
from backend.Utils.helpers import pwd_context, verify_password, validate_password_format, create_access_token, verify_token
from backend.Utils.mailer import send_email_async
from backend.Utils.media import save_media, del_media
from backend.config import settings
from backend.Schemas.ResponseMessage import ResponseMessage


class UsersBAL:
    def __init__(self):
        self.users_dal = UsersDAL()
        self.roles_dal = RolesDAL()
        self.otps_dal = OtpsDAL()

    # ---------------- CREATE USER ----------------
    async def create_user(self, full_name: str, email: str, password: str, role_id: int):
        if not full_name or not full_name.strip():
            raise ValueError("Full name cannot be empty")
        if not email or "@" not in email:
            raise ValueError("Invalid email address")

        validate_password_format(password)
        hashed_password = pwd_context.hash(password)

        role = await self.roles_dal.get_by_id(role_id)
        if not role:
            raise ValueError(f"Role with id {role_id} does not exist")

        user = await self.users_dal.create_user(
            full_name.strip(),
            email.strip().lower(),
            hashed_password,
            role_id
        )

        # Send welcome email async
        await send_email_async(
                to_address=user.Email,
                subject="Welcome to the Platform",
                plain_text=(
                    f"Hello {user.FullName},\n\n"
                    f"Your account has been created with the role: {role.Name}.\n"
                    f"Your password is: {password}\n\n"
                    "Please keep it safe and change it after logging in."
                )
            )

        return ResponseMessage(
            status="success",
            message=f"User '{user.FullName}' created successfully.",
            data={
                "user_id": str(user.Id),
                "email": user.Email,
                "full_name": user.FullName,
                "role": role.Name
            }
        )

    # ---------------- GET USER ----------------
    async def get_user(self, user_id: str, active: bool = None):
        user = await self.users_dal.get_user_by_id(user_id, active=active)
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        return user

    async def get_user_by_email(self, email: str, active: bool = None):
        user = await self.users_dal.get_user_by_email(email.strip().lower(), active=active)
        if not user:
            raise ValueError(f"User with email {email} not found")
        return user

    async def get_all_users(self, filters=None, active: bool = None):
        return await self.users_dal.get_all_users(filters=filters, active=active)

    # ---------------- UPDATE USER ----------------
    async def update_user(
        self, 
        user_id: str, 
        full_name: str = None, 
        email: str = None,
        password: str = None, 
        role_id: int = None, 
        profile_picture: str = None
    ):
        # 1. Validate email
        if email:
            email = email.strip().lower()
            if "@" not in email:
                raise ValueError("Invalid email address")

        # 2. Hash password if provided
        hashed_password = None
        if password:
            validate_password_format(password)
            hashed_password = pwd_context.hash(password)

        # 3. Validate role
        if role_id:
            role = await self.roles_dal.get_by_id(role_id)
            if not role:
                raise ValueError(f"Role with id {role_id} does not exist")

        # 4. Update user via DAL
        updated_user = await self.users_dal.update_user(
            user_id=user_id,
            full_name=full_name,
            email=email,
            password=hashed_password,
            role_id=role_id,
            profile_picture=profile_picture
        )

        if not updated_user:
            raise ValueError(f"User with id {user_id} not found")

        return updated_user


    # ---------------- DEACTIVATE USER ----------------
    async def deactivate_user(self, user_id: str) -> ResponseMessage:
        user = await self.users_dal.get_user_by_id(user_id)
        if not user:
            raise ValueError(f"User with id {user_id} not found")

        user.IsActive = False
        self.users_dal.session.commit()
        self.users_dal.session.refresh(user)

        return ResponseMessage(
            status="success",
            message=f"User '{user.FullName}' has been deactivated.",
            data={
                "user_id": str(user.Id),
                "email": user.Email,
                "full_name": user.FullName
            }
        )

    # ---------------- DELETE USER ----------------
    async def delete_user(self, user_id: str):
        deleted = await self.users_dal.delete_user(user_id)
        if not deleted:
            raise ValueError(f"User with id {user_id} not found")
        return True

    # ---------------- LOGIN ----------------
    async def login_user(self, response: Response, email: str, password: str) -> ResponseMessage:
        user = await self.users_dal.get_user_by_email(email.strip().lower(), True)
        if not user or not verify_password(password, user.Password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=ResponseMessage(status="error", message="Invalid credentials or account is not active").dict()
            )

        if not user.IsActive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ResponseMessage(status="error", message="User account is not active").dict()
            )

        access_token_expires = timedelta(minutes=settings.JWT_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": str(user.Id)}, expires_delta=access_token_expires)

        response.set_cookie(
            key=settings.COOKIE_NAME,
            value=access_token,
            httponly=settings.COOKIE_HTTPONLY,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.JWT_TOKEN_EXPIRE_MINUTES * 60,
        )

        return ResponseMessage(
            status="success",
            message="Login successful",
            data={"email": user.Email, "full_name": user.FullName}
        )

    # ---------------- LOGOUT ----------------
    async def logout_user(self, response: Response) -> ResponseMessage:
        response.delete_cookie(key=settings.COOKIE_NAME)
        return ResponseMessage(status="success", message="Logged out successfully")

    # ---------------- AUTH DEPENDENCIES ----------------
    @staticmethod
    def is_valid_user(*allowed_roles: str):
        async def role_checker(token: Optional[str] = Cookie(None, alias=settings.COOKIE_NAME)):
            if not token:
                raise HTTPException(
                    status_code=401,
                    detail=ResponseMessage(status="error", message="Not authenticated").dict()
                )
            try:
                user_id = verify_token(token)
            except Exception:
                raise HTTPException(
                    status_code=401,
                    detail=ResponseMessage(status="error", message="Invalid authentication token").dict()
                )

            user_dal = UsersDAL()
            user = await user_dal.get_user_with_role(user_id, active=True)
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail=ResponseMessage(status="error", message="User not found").dict()
                )

            if not user.IsActive:
                raise HTTPException(
                    status_code=403,
                    detail=ResponseMessage(status="error", message="Inactive user").dict()
                )

            if allowed_roles and user.Role and user.Role.Name not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail=ResponseMessage(status="error", message="Insufficient permissions").dict()
                )
            return user
        return role_checker

    @staticmethod
    def is_user_authenticated():
        async def auth_checker(token: Optional[str] = Cookie(None, alias=settings.COOKIE_NAME)):
            if not token:
                raise HTTPException(
                    status_code=401,
                    detail=ResponseMessage(status="error", message="Not authenticated").dict()
                )
            try:
                user_id = verify_token(token)
            except Exception:
                raise HTTPException(
                    status_code=401,
                    detail=ResponseMessage(status="error", message="Invalid authentication token").dict()
                )
            user_dal = UsersDAL()
            user = await user_dal.get_user_with_role(user_id, active=True)
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail=ResponseMessage(status="error", message="User not found").dict()
                )
            if not user.IsActive:
                raise HTTPException(
                    status_code=403,
                    detail=ResponseMessage(status="error", message="Inactive user").dict()
                )
            return user
        return auth_checker

    # ---------------- OTP ----------------
    async def generate_otp(self, email: str, expires_in_minutes: int = 5) -> ResponseMessage:
        user = await self.users_dal.get_user_by_email(email.strip().lower())
        if not user:
            raise HTTPException(status_code=404, detail=ResponseMessage(status="error", message="User not found").dict())

        code = ''.join(secrets.choice(string.digits) for _ in range(6))
        await self.otps_dal.create_otp(user.Id, code, expires_in_minutes)

        await send_email_async(
            to_address=user.Email,
            subject="Your OTP Code",
            plain_text=f"Hello {user.FullName},\n\nYour OTP code is: {code}\nIt expires in {expires_in_minutes} minutes."
        )

        return ResponseMessage(status="success", message=f"OTP generated for {email}")

    async def verify_otp(self, email: str, code: str, password: str) -> ResponseMessage:
        user = await self.users_dal.get_user_by_email(email.strip().lower())
        if not user:
            raise HTTPException(status_code=404, detail=ResponseMessage(status="error", message="User not found").dict())

        otp_record = await self.otps_dal.get_valid_otp(user.Id, code)
        if not otp_record:
            return ResponseMessage(status="error", message="Invalid or expired OTP")

        try:
            validate_password_format(password)
            hashed_password = pwd_context.hash(password)
            await self.users_dal.update_user(user.Id, password=hashed_password)
        except Exception as e:
            raise HTTPException(status_code=500, detail=ResponseMessage(status="error", message=f"Error saving password: {str(e)}").dict())

        await self.otps_dal.mark_otp_used(otp_record.Id)

        return ResponseMessage(
            status="success",
            message="OTP verified successfully",
            data={"email": user.Email, "full_name": user.FullName}
        )

    # ---------------- PROFILE PICTURE ----------------
    async def updateProfilePicture(self, user_id: str, file: UploadFile) -> ResponseMessage:
        # 1. Validate MIME type
        if file.content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
            raise HTTPException(
                status_code=400,
                detail=ResponseMessage(
                    status="error",
                    message="Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed."
                ).dict()
            )

        # 2. Read file bytes
        try:
            file_bytes = await file.read()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=ResponseMessage(
                    status="error",
                    message="Failed to read uploaded file."
                ).dict()
            )

        # 3. Validate image using Pillow
        try:
            image = Image.open(BytesIO(file_bytes))
            image.verify()  # check if image is valid
            image_format = image.format.lower()
            if image_format not in ["jpeg", "png", "gif", "webp"]:
                raise HTTPException(
                    status_code=400,
                    detail=ResponseMessage(
                        status="error",
                        message="Invalid image content."
                    ).dict()
                )
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=ResponseMessage(
                    status="error",
                    message="Uploaded file is not a valid image."
                ).dict()
            )

        # 4. Resize if necessary
        try:
            image = Image.open(BytesIO(file_bytes))  # reopen after verify
            if max(image.size) > 512:
                image.thumbnail((512, 512))
                buffer = BytesIO()
                image.save(buffer, format=image.format or "PNG", quality=85, optimize=True)
                file_bytes = buffer.getvalue()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=ResponseMessage(
                    status="error",
                    message="Failed to process image."
                ).dict()
            )

        # 5. Fetch user
        user = await self.users_dal.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=ResponseMessage(
                    status="error",
                    message="User not found."
                ).dict()
            )

        # 6. Delete old profile picture
        if user.ProfilePicture:
            old_filename = user.ProfilePicture.split("/")[-1]
            try:
                await del_media(old_filename)
            except Exception as e:
                print("photo exception", e)
                print(f"Warning: Failed to delete old profile picture {old_filename}")

        # 7. Save new profile picture
        new_file_url = await save_media(file_bytes, mime_type=file.content_type)
        await self.users_dal.update_user(user_id, profile_picture=new_file_url)

        # 8. Return standardized response
        return ResponseMessage(
            status="success",
            message="Profile picture updated successfully",
            data={"profile_picture_url": new_file_url}
        )
