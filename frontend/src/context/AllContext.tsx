// src/contexts/AllContext.tsx
import { useMemo } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { components as allComponents } from "../Config";
import type { ReactNode } from "react";

// Extend this if you add more contexts in the future
interface AllContextType {
  auth: ReturnType<typeof useAuth>;
  accessibleComponents: typeof allComponents;
}

export const AllProvider = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export const useAll = (): AllContextType => {
  const auth = useAuth();

  // Filter components based on user role
  const accessibleComponents = useMemo(
    () =>
      allComponents.filter(
        (item: { permissions: (string | null)[]; }) =>
          !item.permissions.length || (auth.user && item.permissions.includes(auth.user.role))
      ),
    [auth.user, allComponents]
  );

  return useMemo(() => ({ auth, accessibleComponents }), [auth, accessibleComponents]);
};
