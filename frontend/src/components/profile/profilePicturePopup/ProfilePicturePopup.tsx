import { useState } from "react";
import { useAll } from "../../../context/AllContext";
import { backendUrl } from "../../../services/base";
import styles from '../ProfilePicture.module.css';
import { toast } from "react-hot-toast";

export default function ProfilePicturePopup({ onClose }: { onClose: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { auth } = useAll();

  if (!auth.user) return null;

  const currentProfileImage = auth.user.profile_picture
    ? `${backendUrl}${auth.user.profile_picture}`
    : `${backendUrl}/media/default.png`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const downloadPic=async ()=>{
    try {
      const response = await fetch(currentProfileImage, { mode: "cors", credentials: "include" });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "profile.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await auth.updateProfilePicture(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Profile picture updated successfully')
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to updated profile picture')
    } finally {
      setUploading(false);
    }
  };

  return (
      <div>
        <h2 className={styles.heading}>Update Profile Picture</h2>

        {/* Current / Preview Image */}
        <div>
          <img
            src={previewUrl || currentProfileImage}
            alt="Profile"
            className={styles.popupImage}
            onClick={downloadPic}
          />
        </div>
        <div className={styles.inputCont}>
        {/* File Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
            selectedFile && !uploading
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-blue-300 cursor-not-allowed"
          } mb-3`}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        </div>

        {/* Cancel Button */}
        <button
        className={styles.close}
          onClick={onClose}
        >
          Cancel
        </button>
    </div>
  );
}
