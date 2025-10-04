// src/contexts/RolesContext.tsx
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { roleService } from "../services/roles";
import type { Role } from "../services/roles";
import { toast } from "react-hot-toast";

interface RolesContextType {
  roles: Role[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refreshRoles: () => Promise<void>;
  getSignupRoles: () => Promise<Role[]>;
  createRole: (name: string, description?: string, registration_allowed?: boolean) => Promise<Role | null>;
  updateRole: (roleId: number, name?: string, description?: string, registration_allowed?: boolean) => Promise<Role | null>;
  deleteRole: (roleId: number) => Promise<boolean>;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export const RolesProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stable function to refresh all roles
  const refreshRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const allRoles = await roleService.getAllRoles();
      setRoles(allRoles);
    } catch (error) {
      console.error("Roles refresh error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch roles on mount
  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  // Stable function to get signup roles
  const getSignupRoles = useCallback(async (): Promise<Role[]> => {
    try {
      return await roleService.getRolesForSignup();
    } catch (error) {
      console.error("Signup roles fetch error:", error);
      return [];
    }
  }, []);

  // Stable function to create a role
  const createRole = useCallback(
    async (name: string, description?: string, registration_allowed: boolean = false): Promise<Role | null> => {
      try {
        const newRole = await roleService.createRole(name, description, registration_allowed);
        setRoles((prev) => [...prev, newRole]);
        toast.success("Role Created Successfully");
        return newRole;
      } catch (error: any) {
        console.error("Create role error:", error);
        toast.error(error.response.data.detail)
        return null;
      }
    },
    []
  );

  // Stable function to update a role
  const updateRole = useCallback(
    async (roleId: number, name?: string, description?: string, registration_allowed?: boolean): Promise<Role | null> => {
      try {
        const updatedRole = await roleService.updateRole(roleId, name, description, registration_allowed);
        setRoles((prev) => prev.map((r) => (r.id === roleId ? updatedRole : r)));
        toast.success("Role Updated Successfully");
        return updatedRole;
      } catch (error: any) {
        console.error("Update role error:", error);
        toast.error(error.response.data.message)
        return null;
      }
    },
    []
  );

  // Stable function to delete a role
  const deleteRole = useCallback(
    async (roleId: number): Promise<boolean> => {
      try {
        await roleService.deleteRole(roleId);
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
        toast.success("Role Deleted Successfully");
        return true;
      } catch (error: any) {
        console.error("Delete role error:", error);
        toast.error(error.response.data.message)
        return false;
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      roles,
      isLoading,
      setIsLoading,
      refreshRoles,
      getSignupRoles,
      createRole,
      updateRole,
      deleteRole,
    }),
    [roles, isLoading, refreshRoles, getSignupRoles, createRole, updateRole, deleteRole]
  );

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>;
};

// Hook to use RolesContext
export const useRoles = (): RolesContextType => {
  const context = useContext(RolesContext);
  if (!context) throw new Error("useRoles must be used within a RolesProvider");
  return context;
};
