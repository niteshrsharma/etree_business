import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { toast } from "react-hot-toast";
import { UserService } from "../services/users";
import type { UserFieldResponse } from "../services/users";
import { useAuth } from "./AuthContext";

interface UserContextType {
  fields: UserFieldResponse[];
  isLoading: boolean;

  loadFields: (target_user_id?: string) => Promise<void>;

  updateField: (
    fieldId: number,
    value: any,
    target_user_id?: string
  ) => Promise<void>;

  uploadDocument: (
    fieldId: number,
    file: File,
    target_user_id?: string
  ) => Promise<void>;

  downloadDocument: (
    fieldId: number,
    target_user_id?: string
  ) => Promise<Blob | void>;

  deleteDocument: (
    fieldId: number,
    target_user_id?: string
  ) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); 
  const [fields, setFields] = useState<UserFieldResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFields = async (target_user_id?: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const res = await UserService.getMyFields(target_user_id);
      if (res.status === "success") {
        setFields(res.data || []);
      }
    } catch {
      toast.error("Failed to load user fields");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = async (
    fieldId: number,
    value: any,
    target_user_id?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await UserService.updateMyField(
        fieldId,
        value,
        target_user_id
      );
      if (res.status === "success") {
        toast.success("Field updated");
        await loadFields(target_user_id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update field");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (
    fieldId: number,
    file: File,
    target_user_id?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await UserService.uploadFieldDocument(
        fieldId,
        file,
        target_user_id
      );
      if (res.status === "success") {
        toast.success("File uploaded");
        await loadFields(target_user_id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to upload file");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocument = async (
    fieldId: number,
    target_user_id?: string
  ) => {
    try {
      const data = await UserService.downloadFieldDocument(
        fieldId,
        target_user_id
      );

      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `file_${fieldId}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to download file");
    }
  };

  const deleteDocument = async (
    fieldId: number,
    target_user_id?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await UserService.deleteFieldDocument(
        fieldId,
        target_user_id
      );
      if (res.status === "success") {
        toast.success("File deleted");
        await loadFields(target_user_id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete file");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadFields();
  }, [user]);

  const value = useMemo(
    () => ({
      fields,
      isLoading,
      loadFields,
      updateField,
      uploadDocument,
      downloadDocument,
      deleteDocument,
    }),
    [fields, isLoading]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx)
    throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
};
