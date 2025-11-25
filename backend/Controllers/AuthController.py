# backend/Controllers/AuthController.py
from fastapi import APIRouter, Depends, Response , UploadFile , HTTPException
from backend.BusinessAccessLayer.Users import UsersBAL
from backend.BusinessAccessLayer.Roles import RolesBAL
from backend.Schemas.ResponseMessage import ResponseMessage
from backend.Schemas.Users import LoginUserModel, CreateUserModel

router = APIRouter()
users_bal = UsersBAL()
roles_bal=RolesBAL()


@router.post("/signup", response_model=ResponseMessage)
async def signup(response: Response, signup_data: CreateUserModel):
    try:
        # Fetch roles allowed for signup
        roles_for_signup = await roles_bal.get_roles_for_signup()
        allowed_role_ids = {r.Id for r in roles_for_signup}

        # Validate role
        if signup_data.role_id not in allowed_role_ids:
            raise HTTPException(
                status_code=403,
                detail={
                    "status": "error",
                    "message": "Given role does not have permission to signup",
                    "data": None
                }
            )

        # Attempt to create user
        result = await users_bal.create_user(
            signup_data.full_name,
            signup_data.email,
            signup_data.password,
            signup_data.role_id
        )

        return result

    except ValueError as e:
        # For custom backend validation errors like password rules
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": str(e),
                "data": None
            }
        )

    except HTTPException:
        # Re-raise HTTPExceptions (like role permission error above)
        raise

    except Exception as e:
        # Catch-all fallback
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": "An unexpected error occurred",
                "data": str(e)
            }
        )


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