import { useState } from "react";
import { useAll } from "../../../context/AllContext";
import { backendUrl } from "../../../services/base";

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

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await auth.updateProfilePicture(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
      alert("Profile picture updated successfully!");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-100 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 md:w-96 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-center">Update Profile Picture</h2>

        {/* Current / Preview Image */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={previewUrl || currentProfileImage}
            alt="Profile"
            className="w-28 h-28 rounded-full mb-3 object-cover border-4 border-gray-200 shadow-sm"
          />
          <div className="flex gap-4 text-sm">
            <a
              href={currentProfileImage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 transition-colors"
            >
              View
            </a>
            <a
              href={currentProfileImage}
              download
              className="text-green-600 underline hover:text-green-800 transition-colors"
            >
              Download
            </a>
          </div>
        </div>

        {/* File Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4 border rounded px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
