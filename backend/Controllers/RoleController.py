from fastapi import APIRouter, HTTPException, Depends
from backend.BusinessAccessLayer.Roles import RolesBAL
from backend.BusinessAccessLayer.Users import UsersBAL
from backend.Schemas.ResponseMessage import ResponseMessage
from fastapi.responses import JSONResponse
from backend.Schemas.Roles import RoleRequest

router = APIRouter()
roles_bal = RolesBAL()
users_bal = UsersBAL()


def role_to_dict(role):
    """Convert SQLAlchemy Roles object to dict"""
    return {
        "id": role.Id,
        "name": role.Name,
        "description": role.Description,
        "registration_allowed": role.RegistrationAllowed,
        "created_at": role.CreatedAt,
        "updated_at": role.UpdatedAt,
    }


@router.post("/", response_model=ResponseMessage)
async def create_role(
    role: RoleRequest,
    user=Depends(users_bal.is_valid_user('Super User', 'Admin'))
):
    try:
        role = await roles_bal.create_role(role.name, role.description, role.registration_allowed)
        return ResponseMessage(status="success", message="Role created", data=role_to_dict(role))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/by-name/{name}", response_model=ResponseMessage)
async def get_role_by_name(name: str, user=Depends(users_bal.is_user_authenticated())):
    try:
        role = await roles_bal.get_role_by_name(name)
        return ResponseMessage(status="success", message="Role fetched", data=role_to_dict(role))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{role_id}", response_model=ResponseMessage)
async def get_role(role_id: int, user=Depends(users_bal.is_user_authenticated())):
    try:
        role = await roles_bal.get_role(role_id)
        return ResponseMessage(status="success", message="Role fetched", data=role_to_dict(role))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=ResponseMessage)
async def get_all_roles(user=Depends(users_bal.is_user_authenticated())):
    roles = await roles_bal.get_all_roles()
    return ResponseMessage(status="success", message="Roles fetched", data=[role_to_dict(r) for r in roles])


@router.put("/{role_id}", response_model=ResponseMessage)
async def update_role(
    role_id: int, 
    role: RoleRequest,
    user=Depends(users_bal.is_valid_user('Super User', 'Admin'))
):
    try:
        updated_role = await roles_bal.update_role(role_id, role.name, role.description, role.registration_allowed)
        return ResponseMessage(status="success", message="Role updated", data=role_to_dict(updated_role))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{role_id}", response_model=ResponseMessage)
async def delete_role(role_id: int, user=Depends(users_bal.is_valid_user('Super User', 'Admin'))):
    try:
        await roles_bal.delete_role(role_id)
        return ResponseMessage(status="success", message="Role deleted")
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"status": "failed", "message": str(e)}
        )
@router.get("/signup-roles", response_model=ResponseMessage)
async def get_roles_for_signup():
    roles = await roles_bal.get_roles_for_signup()
    return ResponseMessage(status="success", message="Signup roles fetched", data=[role_to_dict(r) for r in roles])
