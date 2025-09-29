# backend/Controllers/AuthController.py
from fastapi import APIRouter, Depends, Response , UploadFile , HTTPException
from backend.BusinessAccessLayer.Users import UsersBAL
from backend.Schemas.ResponseMessage import ResponseMessage
from backend.Schemas.Users import LoginUserModel

router = APIRouter()
users_bal = UsersBAL()


@router.post("/login", response_model=ResponseMessage)
async def login(response: Response, login_data: LoginUserModel):
    return await users_bal.login_user(response, login_data.email, login_data.password)


@router.post("/logout", response_model=ResponseMessage)
async def logout(response: Response):
    return await users_bal.logout_user(response)


@router.post("/otp/generate", response_model=ResponseMessage)
async def generate_otp(email: str):
    """
    Generate a one-time password (OTP) and send to user's email.
    """
    return await users_bal.generate_otp(email, 5)


@router.post("/otp/verify", response_model=ResponseMessage)
async def verify_otp(email: str, code: str, password: str):
    """
    Verify the OTP code sent to the user's email.
    """
    return await users_bal.verify_otp(email, code, password)


@router.get("/me", response_model=ResponseMessage)
async def get_current_user(user=Depends(users_bal.is_user_authenticated())):
    return ResponseMessage(
        status="success",
        message="Authenticated user fetched",
        data={
            "user_id": str(user.Id),
            "email": user.Email,
            "full_name": user.FullName,
            "role": user.Role.Name if user.Role else None,
            "profile_picture": user.ProfilePicture
        }
    )


@router.post("/me/profile-picture", response_model=ResponseMessage)
async def update_profile_picture(
    file: UploadFile,
    user=Depends(users_bal.is_user_authenticated())
):
    """
    Update the authenticated user's profile picture.
    Accepts JPEG, PNG, GIF, WEBP. Automatically resizes large images.
    """
    try:
        return await users_bal.updateProfilePicture(user.Id, file)
    except HTTPException as e:
        raise e
    except Exception as e:
        # Catch-all for unexpected errors
        raise HTTPException(
            status_code=500,
            detail=ResponseMessage(status="error", message=str(e)).dict()
        )