from fastapi import APIRouter, Depends
from backend.BusinessAccessLayer.Permissions import PermissionsBAL
from backend.BusinessAccessLayer.Users import UsersBAL
from backend.Schemas.ResponseMessage import ResponseMessage
from backend.Schemas.Permissions import PermissionCreateRequest, AssignPermissionRequest

router = APIRouter(prefix="/permissions")
permissions_bal = PermissionsBAL()
users_bal = UsersBAL()


def permission_to_dict(p):
    return {
        "id": p.Id,
        "table_name": p.TableName,
        "method": p.Method,
        "description": p.Description,
        "created_at": p.CreatedAt,
        "updated_at": p.UpdatedAt,
    }


@router.post("/", response_model=ResponseMessage)
async def create_permission(
    body: PermissionCreateRequest,
    user=Depends(users_bal.is_valid_user("Super User", "Admin"))
):
    perm = await permissions_bal.create_permission(
        table_name=body.table_name,
        method=body.method,
        description=body.description
    )

    return ResponseMessage(
        status="success",
        message="Permission created",
        data=permission_to_dict(perm)
    )


@router.get("/", response_model=ResponseMessage)
async def get_all_permissions(
    user=Depends(users_bal.is_valid_user("Super User", "Admin"))
):
    perms = await permissions_bal.get_all_permissions()

    return ResponseMessage(
        status="success",
        message="Permissions fetched",
        data=[permission_to_dict(p) for p in perms]
    )


@router.post("/assign", response_model=ResponseMessage)
async def assign_permission(
    body: AssignPermissionRequest,
    user=Depends(users_bal.is_valid_user("Super User", "Admin"))
):
    await permissions_bal.assign_permission(
        role_id=body.role_id,
        permission_id=body.permission_id
    )

    return ResponseMessage(
        status="success",
        message="Permission assigned to role",
        data=None
    )


@router.delete("/remove/{role_id}/{permission_id}", response_model=ResponseMessage)
async def remove_permission(
    role_id: int,
    permission_id: int,
    user=Depends(users_bal.is_valid_user("Super User", "Admin"))
):
    await permissions_bal.remove_permission(role_id, permission_id)

    return ResponseMessage(
        status="success",
        message="Permission removed from role",
        data=None
    )


@router.get("/role/{role_id}", response_model=ResponseMessage)
async def get_permissions_for_role(
    role_id: int,
    user=Depends(users_bal.is_valid_user("Super User", "Admin"))
):
    perms = await permissions_bal.get_permissions_for_role(role_id)

    return ResponseMessage(
        status="success",
        message="Permissions for role fetched",
        data=[permission_to_dict(p) for p in perms]
    )
