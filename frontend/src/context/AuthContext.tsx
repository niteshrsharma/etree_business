// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { AuthService } from "../services/users";
import type { User } from "../services/users";
import { roleService } from "../services/roles";
import type { Role } from "../services/roles";

interface AuthContextType {
  user: User | null;
  roles: Role[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfilePicture: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true); // new loading state

  // Fetch current user and roles on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const userRes = await AuthService.getCurrentUser();
        if (userRes.status === "success" && userRes.data) {
          setUser(userRes.data);
          console.log("refreshUser - user:", userRes.data);
        }

        const rolesRes = await roleService.getAllRoles();
        setRoles(rolesRes);
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await AuthService.login(email, password);
      if (res.status === "success") {
        await refreshUser();
      } else {
        throw new Error(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const res = await AuthService.logout();
      if (res.status === "success") {
        setUser(null);
      } else {
        throw new Error(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const res = await AuthService.getCurrentUser();
      if (res.status === "success") setUser(res.data || null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfilePicture = async (file: File) => {
    setIsLoading(true);
    try {
      const res = await AuthService.updateProfilePicture(file);
      if (res.status === "success" && user) {
        setUser({ ...user, profile_picture: res.data?.profile_picture_url });
      } else {
        throw new Error(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, roles, isLoading,setIsLoading, login, logout, refreshUser, updateProfilePicture }),
    [user, roles, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
