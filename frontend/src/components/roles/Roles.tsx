import { useEffect, useRef, useState } from "react";
import { useAll } from "../../context/AllContext";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import { useLoader } from "../../common/Loader";
import styles from "./Roles.module.css";

export default function Roles() {
    const { roles } = useAll();
    const showLoader = useLoader();
    const [isRegistrationBy, setRegistrationBy] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        registration_allowed: false,
        registration_by_roles: [] as number[],
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setRegistrationBy(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on ESC key
    useEffect(() => {
        function handleEsc(event: KeyboardEvent) {
            if (event.key === "Escape") setRegistrationBy(false);
        }
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);


    // Load selected role when editing
    useEffect(() => {
        if (editingRoleId !== null) {
            const role = roles.roles.find((r) => r.id === editingRoleId);
            if (role) {
                setFormData({
                    name: role.name,
                    description: role.description || "",
                    registration_allowed: role.registration_allowed,
                    registration_by_roles: role.registration_by_roles ?? [],
                });
            }
        } else {
            setFormData({
                name: "",
                description: "",
                registration_allowed: false,
                registration_by_roles: [],
            });
        }
    }, [editingRoleId, roles.roles]);

    // Fetch all roles on component mount
    useEffect(() => {
        const fetchRoles = async () => {
            showLoader(true);
            try {
                await roles.refreshRoles();
            } finally {
                showLoader(false);
            }
        };
        fetchRoles();
    }, [roles.refreshRoles, showLoader]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = type === "checkbox" && (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Handle "Allow Selected Roles to Register" checkboxes
    const toggleRoleSelection = (roleId: number) => {
        setFormData((prev) => {
            const exists = prev.registration_by_roles.includes(roleId);
            return {
                ...prev,
                registration_by_roles: exists
                    ? prev.registration_by_roles.filter((id) => id !== roleId)
                    : [...prev.registration_by_roles, roleId],
            };
        });
    };

    // Create or update role
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        showLoader(true);

        try {
            if (editingRoleId !== null) {
                await roles.updateRole(
                    editingRoleId,
                    formData.name,
                    formData.description,
                    formData.registration_allowed,
                    formData.registration_by_roles
                );
            } else {
                await roles.createRole(
                    formData.name,
                    formData.description,
                    formData.registration_allowed,
                    formData.registration_by_roles
                );
            }
            setEditingRoleId(null);
        } catch (err: any) {
            console.log(err.message || "Error saving role");
        } finally {
            showLoader(false);
        }
    };

    const handleEdit = (roleId: number) => setEditingRoleId(roleId);

    const handleDelete = async (roleId: number) => {
        if (!confirm("Are you sure you want to delete this role?")) return;
        showLoader(true);

        try {
            await roles.deleteRole(roleId);
        } catch (err: any) {
            console.log(err.message || "Error deleting role");
        } finally {
            showLoader(false);
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6" style={{ padding: "21px" }}>
                Roles Management
            </h1>

            {/* Role Form */}
            <form onSubmit={handleSubmit} className={styles.formCont}>
                <div>
                    <label>Role Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.checkboxRow}>
                    <input
                        type="checkbox"
                        name="registration_allowed"
                        checked={formData.registration_allowed}
                        onChange={handleChange}
                    />
                    <span>Registration Allowed (Public Signup)</span>
                </div>

                {/* Show role selection only when registration is NOT allowed */}
                {!formData.registration_allowed && (
                    <div className={styles.rolesSelection} onClick={() => setRegistrationBy(!isRegistrationBy)}>
                        <label>Allowed Roles</label>
                        {isRegistrationBy &&
                            <div className={styles.registrationAllowed} ref={dropdownRef}>
                                {roles.roles.map((role) => (
                                    <label key={role.id} className={styles.checkboxItem} onClick={(e)=>{e.stopPropagation()}}>
                                        <input
                                            type="checkbox"
                                            checked={formData.registration_by_roles.includes(role.id)}
                                            onChange={() => toggleRoleSelection(role.id)}
                                        />
                                        {role.name}
                                    </label>
                                ))}
                            </div>
                        }
                    </div>
                )}

                <button type="submit">
                    {editingRoleId !== null ? <FiEdit /> : <FiPlus />}
                    {editingRoleId !== null ? "Update Role" : "Add Role"}
                </button>

                {editingRoleId !== null && (
                    <button type="button" onClick={() => setEditingRoleId(null)}>
                        Cancel
                    </button>
                )}
            </form>

            {/* Roles Table */}
            <div
                className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg"
                style={{ padding: "20px" }}
            >
                <table className="table-auto min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-gray-700 font-semibold uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-gray-700 font-semibold uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-center text-gray-700 font-semibold uppercase tracking-wider">
                                Allow Signup
                            </th>
                            <th className="px-6 py-3 text-center text-gray-700 font-semibold uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {roles.roles.map((role) => (
                            <tr
                                key={role.id}
                                className="hover:bg-gray-50 transition-colors"
                                id={styles.tableRow}
                            >
                                <td className="px-6 py-4 text-gray-800 font-medium">{role.name}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    {role.description || "-"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {role.registration_allowed ? "✔️" : "❌"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleEdit(role.id)}
                                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        <FiEdit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
