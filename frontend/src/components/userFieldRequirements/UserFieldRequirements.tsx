import styles from './UserFieldRequirement.module.css';
import { useEffect, useState, useRef } from "react";
import { useAll } from "../../context/AllContext";
import type { Role } from "../../services/roles";
import PopupUserFieldRequirementsAdd from "./popupUserFieldRequirementsAdd/PopupUserFieldRequirementsAdd";

export default function UserFieldRequirements() {
  const { roles, requiredFieldsForUser } = useAll();
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles.roles[0] || null);
  const [addFields, setAddFields] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);

  const popupRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (selectedRole) {
      requiredFieldsForUser.getFieldsByRole(selectedRole.id);
    }
  }, [selectedRole, requiredFieldsForUser.getFieldsByRole]);

  // Escape key closes popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddFields(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Click outside popup closes it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setAddFields(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      {addFields && (
        <div className={styles.popupWrapper} ref={popupRef}>
          <PopupUserFieldRequirementsAdd
            role={selectedRole}
            setAddFields={setAddFields}
            fieldId={ editingFieldId ?? undefined}
          />
        </div>
      )}


      <div className={styles.controls}>
        <select
          className={styles.select}
          value={selectedRole?.id || ""}
          onChange={(e) => {
            const role = roles.roles.find(r => r.id === Number(e.target.value)) || null;
            setSelectedRole(role);

          }}
        >
          <option value="">Please select a role</option>
          {roles.roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        <button
          className={styles.addButton}
          onClick={() => {setAddFields(!addFields); setEditingFieldId(null); }}
        >
          {addFields ? 'Cancel' : 'Add Field'}
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Field Type</th>
            <th>Required</th>
            <th>Active</th>
            <th>Filled By</th>
            <th>Editable By</th>
            <th>Edit</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requiredFieldsForUser.fields.map((field) => (
            <tr key={field.Id} className={styles.row}>
              <td>{field.FieldName}</td>
              <td>{field.FieldType}</td>
              <td>{field.IsRequired ? "Yes" : "No"}</td>
              <td>{field.IsActive ? "Yes" : "No"}</td>
              <td>{roles.roles.find(r => r.id === field.FilledByRoleId)?.name || "-"}</td>
              <td>{roles.roles.find(r => r.id === field.EditableByRoleId)?.name || "-"}</td>
              <td>
                <button
                  className={styles.editBtn}
                  onClick={() => {
                    setEditingFieldId(field.Id);
                    setAddFields(true);
                  }}
                >
                  Edit
                </button>
              </td>
              <td>
                <button
                  className={field.IsActive ? styles.deactivateBtn : styles.activateBtn}
                  onClick={() => {
                    if (field.IsActive) {
                      requiredFieldsForUser.deactivateField(field.Id);
                    } else {
                      requiredFieldsForUser.activateField(field.Id);
                    }
                  }}
                >
                  {field.IsActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
