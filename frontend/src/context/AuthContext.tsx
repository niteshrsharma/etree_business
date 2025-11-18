// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { AuthService } from "../services/users";
import type { CreateUser, User } from "../services/users";
import { roleService } from "../services/roles";
import type { Role } from "../services/roles";
import { toast } from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  roles: Role[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  signup: (user: CreateUser) => Promise<void>;
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
        toast.success("Logged in successfully");
      } else {
        throw new Error(res.message);
      }
    }catch(err: any){
      toast.error(err.response.data.detail.message)
    } 
    finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: CreateUser) => {
    setIsLoading(true);
    try {
      const res = await AuthService.signup(userData);

      if (res.status === "success") {
        toast.success("Account created successfully!");

        // After signup, automatically log the user in (optional but common)
        await login(userData.email, userData.password);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      // Handle backend-style error structure
      if (err?.response?.data?.detail?.message) {
        toast.error(err.response.data.detail.message);
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error("Signup failed. Please try again.");
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
    () => ({ user, roles, signup, isLoading,setIsLoading, login, logout, refreshUser, updateProfilePicture }),
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
