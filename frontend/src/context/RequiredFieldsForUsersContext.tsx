// src/contexts/RequiredFieldForUserContext.tsx
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "react-hot-toast";
import { useLoader } from "../common/Loader";
import { UserFieldRequirementsService } from "../services/users";
import type { UserField, FieldCreateInput, FieldUpdateInput } from '../services/users'
import type { ResponseMessage } from "../services/base";

interface RequiredFieldForUserContextType {
  fields: UserField[];
  getFieldsByRole: (roleId: number) => Promise<void>;
  getActiveFields: (roleId?: number) => Promise<void>;
  createField: (field: FieldCreateInput) => Promise<void>;
  updateField: (fieldId: number, field: FieldUpdateInput) => Promise<void>;
  deleteField: (fieldId: number) => Promise<void>;
  deactivateField: (fieldId: number) => Promise<void>;
  activateField: (fieldId: number) => Promise<void>;
  getFieldByName: (roleId: number, fieldName: string) => Promise<UserField | undefined>;
  getFieldTypes: () => Promise<string[]>;
  getValidatorsByType: (fieldType: string) => Promise<Record<string, any>>;
}

// Create Context
const RequiredFieldForUserContext = createContext<RequiredFieldForUserContextType | undefined>(undefined);

// Provider Component
export const RequiredFieldForUserProvider = ({ children }: { children: ReactNode }) => {
  const [fields, setFields] = useState<UserField[]>([]);
  const showLoader = useLoader();

  const getFieldsByRole = useCallback(async (roleId: number) => {
    try {
      showLoader(true);
      const res: ResponseMessage<UserField[]> = await UserFieldRequirementsService.getFieldsByRole(roleId);
      if (res.status === "success" && res.data) setFields(res.data);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch fields by role");
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const getActiveFields = useCallback(async (roleId?: number) => {
    try {
      showLoader(true);
      const res: ResponseMessage<UserField[]> = await UserFieldRequirementsService.getActiveFields(roleId);
      if (res.status === "success" && res.data) setFields(res.data);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch active fields");
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const createField = useCallback(async (field: FieldCreateInput) => {
    try {
      showLoader(true);
      const res: ResponseMessage = await UserFieldRequirementsService.createField(field);
      if (res.status === "success") toast.success(res.message);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to create field");
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const updateField = useCallback(async (fieldId: number, field: FieldUpdateInput) => {
    try {
      showLoader(true);
      const res: ResponseMessage = await UserFieldRequirementsService.updateField(fieldId, field);
      if (res.status === "success") toast.success(res.message);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to update field");
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const deleteField = useCallback(async (fieldId: number) => {
    try {
      showLoader(true);
      const res: ResponseMessage = await UserFieldRequirementsService.deleteField(fieldId);
      if (res.status === "success") toast.success(res.message);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete field");
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const deactivateField = useCallback(async (fieldId: number) => {
    try {
      showLoader(true);
      const res: ResponseMessage = await UserFieldRequirementsService.deactivateField(fieldId);
      if (res.status === "success") toast.success(res.message);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate field");
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const activateField = useCallback(async (fieldId: number) => {
    try {
      showLoader(true);
      const res: ResponseMessage = await UserFieldRequirementsService.activateField(fieldId);
      if (res.status === "success") toast.success(res.message);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to activate field");
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const getFieldByName = useCallback(async (roleId: number, fieldName: string) => {
    try {
      showLoader(true);
      const res: ResponseMessage<UserField> = await UserFieldRequirementsService.getFieldByName(roleId, fieldName);
      if (res.status === "success") return res.data;
      toast.error(res.message);
      return undefined;
    } catch (err: any) {
      toast.error(err.message || "Failed to get field by name");
      return undefined;
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const getFieldTypes = useCallback(async (): Promise<string[]> => {
    try {
      showLoader(true);
      const res: ResponseMessage<string[]> = await UserFieldRequirementsService.getFieldTypes();
      if (res.status === "success" && Array.isArray(res.data)) return res.data;
      return [];
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch field types");
      return [];
    } finally {
      showLoader(false);
    }
  }, [showLoader]);


  const getValidatorsByType = useCallback(async (fieldType: string) => {
    try {
      showLoader(true);
      const res: ResponseMessage<Record<string, any>> = await UserFieldRequirementsService.getValidatorsByType(fieldType);
      if (res.status === "success" && res.data) return res.data;
      toast.error(res.message);
      return {};
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch validators");
      return {};
    } finally {
      showLoader(false);
    }
  }, [showLoader]);

  const value: RequiredFieldForUserContextType = {
    fields,
    getFieldsByRole,
    getActiveFields,
    createField,
    updateField,
    deleteField,
    deactivateField,
    activateField,
    getFieldByName,
    getFieldTypes,
    getValidatorsByType
  };

  return (
    <RequiredFieldForUserContext.Provider value={value}>
      {children}
    </RequiredFieldForUserContext.Provider>
  );
};

export const useRequiredFieldsForUser = (): RequiredFieldForUserContextType => {
  const context = useContext(RequiredFieldForUserContext);
  if (!context) throw new Error("useRequiredFields must be used within RequiredFieldForUserProvider");
  return context;
};
