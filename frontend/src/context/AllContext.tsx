// src/contexts/AllContext.tsx
import { useMemo } from "react";
import type { ReactNode } from "react";

import { AuthProvider, useAuth } from "./AuthContext";
import { RolesProvider, useRoles } from "./RolesContext";
import { RequiredFieldForUserProvider, useRequiredFieldsForUser } from "./RequiredFieldsForUsersContext";

import { UserProvider, useUser } from "./UserContext";

import { components as allComponents } from "../Config";

// Extend this if you add more contexts in the future
interface AllContextType {
  auth: ReturnType<typeof useAuth>;
  roles: ReturnType<typeof useRoles>;
  requiredFieldsForUser: ReturnType<typeof useRequiredFieldsForUser>;
  user: ReturnType<typeof useUser>;
  accessibleComponents: typeof allComponents;
}

export const AllProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <RolesProvider>
        <RequiredFieldForUserProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </RequiredFieldForUserProvider>
      </RolesProvider>
    </AuthProvider>
  );
};

export const useAll = (): AllContextType => {
  const auth = useAuth();
  const roles = useRoles();
  const requiredFieldsForUser = useRequiredFieldsForUser();
  const user = useUser(); // <-- Added here

  // Filter components based on user role
  const accessibleComponents = useMemo(
    () =>
      allComponents.filter(
        (item: { permissions: (string | null)[] }) =>
          !item.permissions.length ||
          (auth.user && item.permissions.includes(auth.user.role))
      ),
    [auth.user]
  );

  return useMemo(
    () => ({
      auth,
      roles,
      requiredFieldsForUser,
      user, // <-- added to final returned context
      accessibleComponents,
    }),
    [auth, roles, requiredFieldsForUser, user, accessibleComponents]
  );
};
