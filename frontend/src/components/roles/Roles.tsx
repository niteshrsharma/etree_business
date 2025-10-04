import { useEffect, useState } from "react";
import { useAll } from "../../context/AllContext";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useLoader } from "../../common/Loader";

export default function Roles() {
    const { roles } = useAll();
    const showLoader = useLoader();
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        registration_allowed: false,
    });

    useEffect(() => {
        if (editingRoleId !== null) {
            const role = roles.roles.find((r) => r.id === editingRoleId);
            if (role) {
                setFormData({
                    name: role.name,
                    description: role.description || "",
                    registration_allowed: role.registration_allowed,
                });
            }
        } else {
            setFormData({ name: "", description: "", registration_allowed: false });
        }
    }, [editingRoleId, roles.roles]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        showLoader(true);
        try {
            if (editingRoleId !== null) {
                await roles.updateRole(
                    editingRoleId,
                    formData.name,
                    formData.description,
                    formData.registration_allowed
                );
                toast.success("Role updated successfully!");
            } else {
                await roles.createRole(
                    formData.name,
                    formData.description,
                    formData.registration_allowed
                );
                toast.success("Role created successfully!");
            }
            setEditingRoleId(null);
        } catch (err: any) {
            toast.error(err.message || "Error saving role");
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
            toast.success("Role deleted successfully!");
        } catch (err: any) {
            toast.error(err.message || "Error deleting role");
        } finally {
            showLoader(false);
        }
    };

    return (<>
        <h1 className="text-3xl font-bold text-gray-800 mb-6" style={{ padding: "21px" }}>Roles Management</h1>

        {/* Role Form */}
        <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 shadow-lg rounded-xl p-6 mb-8 flex flex-col md:flex-row md:items-end md:space-x-6 gap-4 transition-all duration-300"
        >
            <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    name="registration_allowed"
                    checked={formData.registration_allowed}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                />
                <span className="text-sm text-gray-700 font-medium">Registration Allowed</span>
            </div>
            <div className="flex gap-2">
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                    {editingRoleId !== null ? <FiEdit /> : <FiPlus />}
                    {editingRoleId !== null ? "Update Role" : "Add Role"}
                </button>
                {editingRoleId !== null && (
                    <button
                        type="button"
                        onClick={() => setEditingRoleId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>


        {/* Roles Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
            <table className="table-auto min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-gray-700 font-semibold uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-gray-700 font-semibold uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-center text-gray-700 font-semibold uppercase tracking-wider">Registration Allowed</th>
                        <th className="px-6 py-3 text-center text-gray-700 font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {roles.roles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-gray-800 font-medium">{role.name}</td>
                            <td className="px-6 py-4 text-gray-600">{role.description || "-"}</td>
                            <td className="px-6 py-4 text-center">{role.registration_allowed ? "✔️" : "❌"}</td>
                            <td className="px-6 py-4 flex justify-center gap-3">
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
