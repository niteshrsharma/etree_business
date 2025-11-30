import { useState, useEffect } from "react";
import styles from "./Permission.module.css";
import { useAll } from "../../context/AllContext";

export default function Permission() {
  const { roles } = useAll();
  const {
    permissions: permissionsCtx
  } = useAll();

  const {
    permissions: allPermissions,
    createPermission,
    assignPermission,
    removePermission,
    getPermissionsForRole,
  } = permissionsCtx;

  const { roles: allRoles } = roles;

  // Form state
  const [tableName, setTableName] = useState("");
  const [method, setMethod] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);

  // Load permissions for selected role
  useEffect(() => {
    if (!selectedRole) return;
    (async () => {
      const perms = await getPermissionsForRole(selectedRole);
      setRolePermissions(perms);
    })();
  }, [selectedRole, getPermissionsForRole]);

  // Create permission
  const handleCreatePermission = async () => {
    if (!tableName || !method) return;

    await createPermission({
      table_name: tableName,
      method,
      description,
    });

    setTableName("");
    setMethod("");
    setDescription("");
  };

  // Assign permission to selected role
  const handleAssign = async (permissionId: number) => {
    if (!selectedRole) return;

    await assignPermission({
      role_id: selectedRole,
      permission_id: permissionId
    });

    const refreshed = await getPermissionsForRole(selectedRole);
    setRolePermissions(refreshed);
  };

  // Remove permission from selected role
  const handleRemove = async (permissionId: number) => {
    if (!selectedRole) return;

    await removePermission(selectedRole, permissionId);

    const refreshed = await getPermissionsForRole(selectedRole);
    setRolePermissions(refreshed);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Permission Management</h1>

      {/* Create Permission */}
      <section className={styles.section}>
        <h2>Create Permission</h2>

        <div className={styles.form}>
          <input
            type="text"
            placeholder="table_name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
          />

          <input
            type="text"
            placeholder="method (select / insert / update / delete)"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />

          <input
            type="text"
            placeholder="description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button className={styles.button} onClick={handleCreatePermission}>
            Create Permission
          </button>
        </div>
      </section>

      {/* Assign Permissions to Role */}
      <section className={styles.section}>
        <h2>Assign Permissions to Role</h2>

        <select
          className={styles.select}
          value={selectedRole ?? ""}
          onChange={(e) => setSelectedRole(Number(e.target.value))}
        >
          <option value="">Select Role</option>
          {allRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        {selectedRole && (
          <div className={styles.permissionsGrid}>
            {/* All Permissions */}
            <div className={styles.column}>
              <h3>All Permissions</h3>
              {allPermissions.map((p) => (
                <div key={p.id} className={styles.permissionRow}>
                  <span>
                    {p.table_name}.{p.method}
                  </span>
                  <button
                    onClick={() => handleAssign(p.id)}
                    className={styles.assignButton}
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>

            {/* Role Permissions */}
            <div className={styles.column}>
              <h3>Permissions for Role</h3>
              {rolePermissions.map((p) => (
                <div key={p.id} className={styles.permissionRow}>
                  <span>
                    {p.table_name}.{p.method}
                  </span>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
