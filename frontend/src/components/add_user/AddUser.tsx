import { useEffect, useState } from "react";
import { useAll } from "../../context/AllContext";
import styles from "./AddUser.module.css";
import { backendUrl } from "../../services/base";
import UpdateUserData from "../updateUserData/UpdateUserData";

export default function AddUser() {
    const { roles, user } = useAll();

    const [creatableRoles, setCreatableRoles] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [showEditor, setShowEditor] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);  // 👈 UPDATED

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
        role_id: 0 as number,
    });

    // Generate random password (8 chars)
    const generatePassword = () => {
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const special = "!@#$%^&*";

        let pwd = "";
        pwd += upper[Math.floor(Math.random() * upper.length)];
        pwd += lower[Math.floor(Math.random() * lower.length)];
        pwd += numbers[Math.floor(Math.random() * numbers.length)];
        pwd += special[Math.floor(Math.random() * special.length)];

        const all = upper + lower + numbers + special;
        for (let i = pwd.length; i < 8; i++) {
            pwd += all[Math.floor(Math.random() * all.length)];
        }

        return pwd
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("");
    };

    // Load creatable roles on mount
    useEffect(() => {
        const load = async () => {
            const r = await roles.getCreatableRoles();
            setCreatableRoles(r);

            if (r.length > 0) {
                const firstRole = r[0];

                setForm((prev) => ({
                    ...prev,
                    role_id: firstRole.id,
                    password: generatePassword(),
                }));

                loadUsersOfRole(firstRole.id);
            }
        };
        load();
    }, []);

    // Fetch users for selected role
    const loadUsersOfRole = async (roleId: number) => {
        try {
            const res = await user.getUsersByRole(roleId) as any;

            if (res?.status === "success") {
                setUsersList(res.data || []);
            }
        } catch (err) {
            console.log("Failed to load users", err);
        }
    };

    // When role changes → update users + regenerate password
    const handleRoleChange = (e: any) => {
        const newId = Number(e.target.value);

        setForm((prev) => ({
            ...prev,
            role_id: newId,
            password: generatePassword(),
        }));

        loadUsersOfRole(newId);
    };

    // Create new user
    const createUser = async () => {
        const result = await user.createUser(form);

        if (result?.status === "success") {
            setForm((prev) => ({
                ...prev,
                full_name: "",
                email: "",
                password: generatePassword(),
            }));

            loadUsersOfRole(form.role_id);
        }
    };

    return (
        <>
            {/* EDITOR MODAL */}
            {showEditor && selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setShowEditor(false)}>

                    <div
                        className={styles.modalBox}
                        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                    >
                        <button
                            className={styles.closeBtn}
                            onClick={() => setShowEditor(false)}
                        >
                            ✕
                        </button>

                        <div className={styles.modalContent}>
                            <UpdateUserData user={selectedUser} />
                        </div>
                    </div>

                </div>
            )}


            <div className={styles.container}>
                <h1 className={styles.heading}>Create New User</h1>

                {/* --- ROLE SELECT --- */}
                <div className={styles.roleSelectWrapper}>
                    <select
                        value={form.role_id}
                        className={styles.select}
                        onChange={handleRoleChange}
                    >
                        {creatableRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* --- FORM --- */}
                <div className={styles.formRow}>
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={form.full_name}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, full_name: e.target.value }))
                        }
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, email: e.target.value }))
                        }
                    />

                    <input
                        type="text"
                        value={form.password}
                        readOnly
                        className={styles.passwordField}
                    />

                    <button className={styles.createBtn} onClick={createUser}>
                        Create
                    </button>
                </div>

                {/* --- USERS TABLE --- */}
                <h2 className={styles.subHeading}>Users Under This Role</h2>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Profile</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map((u) => (
                            <tr key={u.user_id}>
                                <td>
                                    <img
                                        src={
                                            u?.profile_picture
                                                ? `${backendUrl}${u.profile_picture}`
                                                : `${backendUrl}/media/default.png`
                                        }
                                        alt="Profile"
                                        className={styles.avatar}
                                    />
                                </td>
                                <td>{u.full_name}</td>
                                <td>{u.email}</td>
                                <td>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => {
                                            setSelectedUser(u); // 👈 store whole user
                                            setShowEditor(true);
                                        }}
                                    >
                                        Edit
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
