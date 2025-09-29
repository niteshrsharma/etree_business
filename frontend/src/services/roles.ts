// src/api/roles.ts
import { api } from "./base";

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseMessage<T = any> {
  status: string;
  message: string;
  data: T;
}

class RoleService {
  // Create a new role
  async createRole(name: string, description?: string): Promise<Role> {
    const response = await api.post<ResponseMessage<Role>>("/roles/", { name, description });
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
  async updateRole(roleId: number, name?: string, description?: string): Promise<Role> {
    const response = await api.put<ResponseMessage<Role>>(`/roles/${roleId}`, { name, description });
    return response.data.data;
  }

  // Delete a role
  async deleteRole(roleId: number): Promise<void> {
    await api.delete<ResponseMessage>(`/roles/${roleId}`);
  }
}

export const roleService = new RoleService();
