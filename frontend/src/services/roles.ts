// src/api/roles.ts
import { api } from "./base";
import type { ResponseMessage } from "./base";

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  registration_allowed: boolean;
  registration_by_roles: number[];
  created_at: string;
  updated_at: string;
}

class RoleService {
  // Create a new role
  async createRole(name: string, description?: string, registration_allowed: boolean = false, registration_by_roles: number[]=[]): Promise<Role> {
    const response = await api.post<ResponseMessage<Role>>("/roles/", { name, description, registration_allowed, registration_by_roles });
    return response.data.data;
  }

  // Get roles the actor is allowed to create
  async getCreatableRoles(): Promise<Role[]> {
    const response = await api.get<ResponseMessage<Role[]>>("/roles/creatable");
    return response.data.data;
  }


  // Get a role by ID
  async getRole(roleId: number): Promise<Role> {
    const response = await api.get<ResponseMessage<Role>>(`/roles/${roleId}`);
    return response.data.data;
  }

  // Get a role by name
  async getRoleByName(name: string): Promise<Role> {
    const response = await api.get<ResponseMessage<Role>>(`/roles/by-name/${encodeURIComponent(name)}`);
    return response.data.data;
  }

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    const response = await api.get<ResponseMessage<Role[]>>("/roles/");
    return response.data.data;
  }

  // Update a role
  async updateRole(
    roleId: number,
    name?: string,
    description?: string,
    registration_allowed?: boolean,
    registration_by_roles?: number[]
  ): Promise<Role> {
    const response = await api.put<ResponseMessage<Role>>(`/roles/${roleId}`, { name, description, registration_allowed, registration_by_roles });
    return response.data.data;
  }

  // Delete a role
  async deleteRole(roleId: number): Promise<void> {
    await api.delete<ResponseMessage>(`/roles/${roleId}`);
  }

  // Get roles allowed for signup
  async getRolesForSignup(): Promise<Role[]> {
    const response = await api.get<ResponseMessage<Role[]>>("/roles/signup-roles");
    return response.data.data;
  }
}

export const roleService = new RoleService();
