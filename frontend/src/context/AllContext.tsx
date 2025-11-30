// src/contexts/AllContext.tsx
import { useMemo } from "react";
import type { ReactNode } from "react";

import { AuthProvider, useAuth } from "./AuthContext";
import { RolesProvider, useRoles } from "./RolesContext";
import { RequiredFieldForUserProvider, useRequiredFieldsForUser } from "./RequiredFieldsForUsersContext";
import { UserProvider, useUser } from "./UserContext";

import { PermissionsProvider, usePermissions } from "./PermissionContext";

import { components as allComponents } from "../Config";

// Extend this if you add more contexts in the future
interface AllContextType {
  auth: ReturnType<typeof useAuth>;
  roles: ReturnType<typeof useRoles>;
  requiredFieldsForUser: ReturnType<typeof useRequiredFieldsForUser>;
  user: ReturnType<typeof useUser>;
  permissions: ReturnType<typeof usePermissions>;   // ⭐ Added
  accessibleComponents: typeof allComponents;
}

export const AllProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <RolesProvider>
        <PermissionsProvider> {/* ⭐ New */}
          <RequiredFieldForUserProvider>
            <UserProvider>
              {children}
            </UserProvider>
          </RequiredFieldForUserProvider>
        </PermissionsProvider>
      </RolesProvider>
    </AuthProvider>
  );
};

export const useAll = (): AllContextType => {
  const auth = useAuth();
  const roles = useRoles();
  const requiredFieldsForUser = useRequiredFieldsForUser();
  const user = useUser();
  const permissions = usePermissions(); // ⭐ Added

  // Filter components based on user role (unchanged)
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
      user,
      permissions,
      accessibleComponents,
    }),
    [auth, roles, requiredFieldsForUser, user, permissions, accessibleComponents]
  );
};
