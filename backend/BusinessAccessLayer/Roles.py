from backend.DatabaseAccessLayer.Roles import RolesDAL
from backend.DatabaseAccessLayer.RequiredFieldsForUsers import RequiredFieldsForUsersDAL

class RolesBAL:
    def __init__(self):
        self.roles_dal = RolesDAL()
        self.required_fields_for_users_dal = RequiredFieldsForUsersDAL()

    async def create_role(
        self,
        name: str,
        description: str = None,
        registration_allowed: bool = False,
        registration_by_roles: list[int] = None
    ):
        if not name or len(name.strip()) == 0:
            raise ValueError("Role name cannot be empty")

        return await self.roles_dal.create_role(
            name=name.strip(),
            description=description,
            registration_allowed=registration_allowed,
            registration_by_roles=registration_by_roles or []
        )

    async def get_role(self, role_id: int):
        role = await self.roles_dal.get_by_id(role_id)
        if not role:
            raise ValueError(f"Role with id {role_id} not found")
        return role

    async def get_role_by_name(self, name: str):
        role = await self.roles_dal.get_role_by_name(name)
        if not role:
            raise ValueError(f"Role '{name}' not found")
        return role

    async def get_all_roles(self):
        return await self.roles_dal.get_all_roles()

    async def update_role(
        self,
        role_id: int,
        name: str = None,
        description: str = None,
        registration_allowed: bool = None,
        registration_by_roles: list[int] = None
    ):
        if name is not None and len(name.strip()) == 0:
            raise ValueError("Role name cannot be empty")

        updated_role = await self.roles_dal.update_role(
            role_id=role_id,
            name=name,
            description=description,
            registration_allowed=registration_allowed,
            registration_by_roles=registration_by_roles
        )

        if not updated_role:
            raise ValueError(f"Role with id {role_id} not found")

        return updated_role

    async def delete_role(self, role_id: int):
        fields = await self.required_fields_for_users_dal.get_fields_by_role(role_id)
        if fields:
            raise ValueError(
                f"Cannot delete role: {len(fields)} field(s) reference this role."
            )

        deleted = await self.roles_dal.delete_role(role_id)
        if not deleted:
            raise ValueError(
                "Cannot delete role because it either has users assigned or does not exist"
            )
        return True

    async def get_roles_for_signup(self):
        return await self.roles_dal.get_roles_for_signup()
    
    async def get_roles_actor_can_create(self, actor_role_id: int):
        return await self.roles_dal.get_roles_actor_can_create(actor_role_id)

