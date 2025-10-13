import { useState, useRef, useEffect } from "react";
import { useAll } from "../../context/AllContext";
import { backendUrl } from '../../services/base';
import ProfilePicturePopup from "./profilePicturePopup/ProfilePicturePopup";
import styles from './ProfilePicture.module.css';
export default function Profile() {
    const { auth } = useAll();
    const [isProfilePicturePopup, setProfilePicturePopup] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    const profileImage = auth.user?.profile_picture
        ? `${backendUrl}${auth.user.profile_picture}`
        : `${backendUrl}/media/default.png`;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setProfilePicturePopup(false);
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
            setProfilePicturePopup(false);
            }
        }
        if (isProfilePicturePopup) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfilePicturePopup]);


    return (
        <>
            <div className="bg-[var(--secondary-color)] shadow-md flex flex-col md:flex-row items-center  md:items-start gap-6" style={{ padding: "9px" }}>
                <div className="flex-shrink-0" style={{ cursor: "pointer" }}>
                    <img
                        src={profileImage}
                        alt={auth.user?.full_name}
                        className="w-21 h-21 md:w-21 md:h-21 rounded-full border-4 border-gray-200 shadow-md object-cover"
                        onClick={() => setProfilePicturePopup(!isProfilePicturePopup)}
                    />
                </div>
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-2xl md:text-3xl font-semibold text-[var(--primary-color)]">{auth.user?.full_name || "Anonymous User"}</h1>
                    <p className="text-md md:text-lg text-[var(--muted-color)] mt-1">{auth.user?.role || "Role not set"}</p>
                    <p className="text-sm md:text-md text-[var(--muted-color)] mt-2">{auth.user?.email || "No email provided"}</p>
                </div>
            </div>

            {
                isProfilePicturePopup &&
                    <div ref={popupRef} className={styles.PopUpCont}>
                        <ProfilePicturePopup onClose={() => setProfilePicturePopup(false)} />
                    </div>
            }

        </>
    );
}
