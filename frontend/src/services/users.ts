// src/api/users.tsx
import { api } from "./base";
import type { ResponseMessage } from "./base";

// Types
export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  profile_picture?: string | null;
}

// AuthService object
export const AuthService = {
  login: async (email: string, password: string): Promise<ResponseMessage> => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },

  logout: async (): Promise<ResponseMessage> => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  generateOtp: async (email: string): Promise<ResponseMessage> => {
    const res = await api.post("/auth/otp/generate", null, { params: { email } });
    return res.data;
  },

  verifyOtp: async (email: string, code: string, password: string): Promise<ResponseMessage> => {
    const res = await api.post("/auth/otp/verify", null, { params: { email, code, password } });
    return res.data;
  },

  getCurrentUser: async (): Promise<ResponseMessage<User>> => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  updateProfilePicture: async (file: File): Promise<ResponseMessage> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/auth/me/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

// Types
export interface UserField {
  Id: number;
  RoleId: number;
  FieldName: string;
  FieldType: string;
  IsRequired: boolean;
  FilledByRoleId: number;
  EditableByRoleId?: number | null;
  Options?: {
    label: string;
    is_correct: boolean | null;
  }[];
  Validation?: Record<string, any>;
  DisplayOrder?: number | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}



export interface FieldCreateInput {
  role_id: number;
  field_name: string;
  field_type: string;
  is_required?: boolean;
  filled_by_role_id?: number;
  editable_by_role_id?: number;
  options?: {
    label: string;
    is_correct: boolean | null;
  }[];
  validation?: Record<string, any>;
  display_order?: number;
  is_active?: boolean;
}

export interface FieldUpdateInput {
  field_name?: string;
  field_type?: string;
  is_required?: boolean;
  filled_by_role_id?: number;
  editable_by_role_id?: number;
  options?: {
    label: string;
    is_correct: boolean | null;
  }[];
  validation?: Record<string, any>;
  display_order?: number;
  is_active?: boolean;
}

export const UserFieldRequirementsService = {
  // Create a new field
  createField: async (field: FieldCreateInput): Promise<ResponseMessage> => {
    // Only send properties that are defined
    const payload = Object.fromEntries(
      Object.entries(field).filter(([_, v]) => v !== undefined)
    );
    const res = await api.post("/user-required-fields/", payload);
    return res.data;
  },

  // Update a field
  updateField: async (fieldId: number, fieldUpdate: FieldUpdateInput): Promise<ResponseMessage> => {
    // Only send properties that are defined
    const payload = Object.fromEntries(
      Object.entries(fieldUpdate).filter(([_, v]) => v !== undefined)
    );
    const res = await api.put(`/user-required-fields/${fieldId}`, payload);
    return res.data;
  },

  // Delete a field
  deleteField: async (fieldId: number): Promise<ResponseMessage> => {
    const res = await api.delete(`/user-required-fields/${fieldId}`);
    return res.data;
  },

  // Deactivate a field
  deactivateField: async (fieldId: number): Promise<ResponseMessage> => {
    const res = await api.patch(`/user-required-fields/${fieldId}/deactivate`);
    return res.data;
  },

  activateField: async (fieldId: number): Promise<ResponseMessage> => {
    const res = await api.patch(`/user-required-fields/${fieldId}/activate`);
    return res.data;
  },

  // Get all user-required-fields for a role
  getFieldsByRole: async (roleId: number): Promise<ResponseMessage<UserField[]>> => {
    const res = await api.get(`/user-required-fields/role/${roleId}`);
    return res.data;
  },

  // Get active user-required-fields, optionally filtered by role
  getActiveFields: async (roleId?: number): Promise<ResponseMessage<UserField[]>> => {
    const res = await api.get("/user-required-fields/active", { params: { role_id: roleId } });
    return res.data;
  },

  // Get field by name for a role
  getFieldByName: async (roleId: number, fieldName: string): Promise<ResponseMessage<UserField>> => {
    const res = await api.get(`/user-required-fields/role/${roleId}/name/${fieldName}`);
    return res.data;
  },

  // Get allowed field types
  getFieldTypes: async (): Promise<ResponseMessage<string[]>> => {
    const res = await api.get("/user-required-fields/field-types");
    return { status: "success", message: "Field types fetched", data: res.data.data };
  },

  // Get validators by field type
  getValidatorsByType: async (fieldType: string): Promise<ResponseMessage<Record<string, any>>> => {
    const res = await api.get(`/user-required-fields/validators-by-type/${fieldType}`);
    return { status: "success", message: `Validators fetched for ${fieldType}`, data: res.data.data };
  }
};
