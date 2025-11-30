// src/api/permissions.ts
import { api } from "./base";
import type { ResponseMessage } from "./base";


export interface Permission {
  id: number;
  table_name: string;
  method: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionCreateInput {
  table_name: string;
  method: string;
  description?: string;
}

export interface AssignPermissionInput {
  role_id: number;
  permission_id: number;
}

export const PermissionService = {
  // Create a new permission
  createPermission: async (
    payload: PermissionCreateInput
  ): Promise<ResponseMessage<Permission>> => {
    const res = await api.post("/role-permissions/permissions/", payload);
    return res.data;
  },

  // Get all permissions
  getAllPermissions: async (): Promise<ResponseMessage<Permission[]>> => {
    const res = await api.get("/role-permissions/permissions/");
    return res.data;
  },

  // Assign permission to role
  assignPermission: async (
    payload: AssignPermissionInput
  ): Promise<ResponseMessage> => {
    const res = await api.post("/role-permissions/permissions/assign", payload);
    return res.data;
  },

  // Remove permission from role
  removePermission: async (
    roleId: number,
    permissionId: number
  ): Promise<ResponseMessage> => {
    const res = await api.delete(
      `/role-permissions/permissions/remove/${roleId}/${permissionId}`
    );
    return res.data;
  },

  // Get permissions for a role
  getPermissionsForRole: async (
    roleId: number
  ): Promise<ResponseMessage<Permission[]>> => {
    const res = await api.get(`/role-permissions/permissions/role/${roleId}`);
    return res.data;
  }
};
