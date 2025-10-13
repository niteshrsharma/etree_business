// src/contexts/AllContext.tsx
import { useMemo } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { components as allComponents } from "../Config";
import type { ReactNode } from "react";
import { RolesProvider, useRoles } from "./RolesContext";
import { RequiredFieldForUserProvider, useRequiredFieldsForUser } from "./RequiredFieldsForUsersContext";

// Extend this if you add more contexts in the future
interface AllContextType {
  auth: ReturnType<typeof useAuth>;
  roles: ReturnType<typeof useRoles>;
  requiredFieldsForUser: ReturnType<typeof useRequiredFieldsForUser>;
  accessibleComponents: typeof allComponents;
}

export const AllProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <RolesProvider>
        <RequiredFieldForUserProvider>
          {children}
        </RequiredFieldForUserProvider>
      </RolesProvider>
    </AuthProvider>
  );
};

export const useAll = (): AllContextType => {
  const auth = useAuth();
  const roles = useRoles();
  const requiredFieldsForUser = useRequiredFieldsForUser();

  // Filter components based on user role
  const accessibleComponents = useMemo(
    () =>
      allComponents.filter(
        (item: { permissions: (string | null)[] }) =>
          !item.permissions.length || (auth.user && item.permissions.includes(auth.user.role))
      ),
    [auth.user]
  );

  return useMemo(
    () => ({ auth, roles, requiredFieldsForUser, accessibleComponents }),
    [auth, roles, requiredFieldsForUser, accessibleComponents]
  );
};
