import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { PermissionService } from "../services/permissions";
import type {
  Permission,
  PermissionCreateInput,
  AssignPermissionInput,
} from "../services/permissions";
import { toast } from "react-hot-toast";

interface PermissionsContextType {
  permissions: Permission[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  refreshPermissions: () => Promise<void>;
  createPermission: (
    input: PermissionCreateInput
  ) => Promise<Permission | null>;

  assignPermission: (
    input: AssignPermissionInput
  ) => Promise<boolean>;

  removePermission: (
    roleId: number,
    permissionId: number
  ) => Promise<boolean>;

  getPermissionsForRole: (roleId: number) => Promise<Permission[]>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================
  // Load All Permissions
  // ============================================================

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await PermissionService.getAllPermissions();
      setPermissions(res.data || []);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  // ============================================================
  // Create Permission
  // ============================================================

  const createPermission = useCallback(
    async (input: PermissionCreateInput): Promise<Permission | null> => {
      try {
        const res = await PermissionService.createPermission(input);
        const newPermission = res.data;

        setPermissions((prev) => [...prev, newPermission]);
        toast.success("Permission created successfully");

        return newPermission;
      } catch (error: any) {
        console.error("Create permission error:", error);
        toast.error(error.response?.data?.detail || "Failed to create permission");
        return null;
      }
    },
    []
  );

  // ============================================================
  // Assign Permission to Role
  // ============================================================

  const assignPermission = useCallback(
    async (input: AssignPermissionInput): Promise<boolean> => {
      try {
        await PermissionService.assignPermission(input);
        toast.success("Permission assigned successfully");
        return true;
      } catch (error: any) {
        console.error("Assign permission error:", error);
        toast.error(error.response?.data?.detail || "Failed to assign permission");
        return false;
      }
    },
    []
  );

  // ============================================================
  // Remove Permission
  // ============================================================

  const removePermission = useCallback(
    async (roleId: number, permissionId: number): Promise<boolean> => {
      try {
        await PermissionService.removePermission(roleId, permissionId);
        toast.success("Permission removed successfully");
        return true;
      } catch (error: any) {
        console.error("Remove permission error:", error);
        toast.error(error.response?.data?.detail || "Failed to remove permission");
        return false;
      }
    },
    []
  );

  // ============================================================
  // Get Permissions for Role
  // ============================================================

  const getPermissionsForRole = useCallback(
    async (roleId: number): Promise<Permission[]> => {
      try {
        const res = await PermissionService.getPermissionsForRole(roleId);
        return res.data || [];
      } catch (error: any) {
        console.error("Failed to fetch permissions for role:", error);
        toast.error("Could not fetch role permissions");
        return [];
      }
    },
    []
  );

  // ============================================================
  // Provide Context
  // ============================================================

  const value = useMemo(
    () => ({
      permissions,
      isLoading,
      setIsLoading,
      refreshPermissions,
      createPermission,
      assignPermission,
      removePermission,
      getPermissionsForRole,
    }),
    [
      permissions,
      isLoading,
      refreshPermissions,
      createPermission,
      assignPermission,
      removePermission,
      getPermissionsForRole,
    ]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// ============================================================
// Hook for easy access
// ============================================================

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context)
    throw new Error(
      "usePermissions must be used within a PermissionsProvider"
    );
  return context;
};
