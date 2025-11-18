import { useEffect, useState } from "react";
import { useAll } from "../../context/AllContext";
import { useLoader } from "../../common/Loader";
import { toast } from "react-hot-toast";
import styles from "./Signup.module.css";
import type { Role } from "../../services/roles";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    const { auth, roles } = useAll();
    const showLoader = useLoader();
    const navigate = useNavigate();

    const [signupRoles, setSignupRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role_id: "",
    });

    /** Load roles that are allowed for signup */
    useEffect(() => {
        const fetchRoles = async () => {
            showLoader(true);
            try {
                const res = await roles.getSignupRoles();
                setSignupRoles(res);
            } catch {
                toast.error("Unable to load roles");
            } finally {
                showLoader(false);
            }
        };
        fetchRoles();
    }, [roles, showLoader]);

    /** Handle field update */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /** Submit form */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.role_id) {
            toast.error("Please select a role");
            return;
        }

        showLoader(true);
        try {
            await auth.signup({
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                role_id: Number(formData.role_id)
            });

        } catch (err) {
            toast.error("Signup failed");
        } finally {
            showLoader(false);
        }
    };

    return (
        <>
            <h1 className={styles.title}>Create Your Account</h1>

            <form onSubmit={handleSubmit} className={styles.formCont}>
                <div className={styles.field}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimum 8 characters"
                        required
                    />
                </div>

                <div className={styles.field}>
                    <label>Select Role</label>
                    <select name="role_id" value={formData.role_id} onChange={handleChange} required>
                        <option value="">-- choose a role --</option>
                        {signupRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className={styles.submitBtn}>
                    Sign Up
                </button>

                <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => navigate("/login")}
                >
                    Already have an account? Log in
                </button>
            </form>
        </>
    );
}
