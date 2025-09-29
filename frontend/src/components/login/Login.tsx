// src/components/login/Login.tsx
import { useEffect, useState, useCallback } from "react";
import { useAll } from "../../context/AllContext";
import { AuthService } from "../../services/users";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLoader } from "../../common/Loader";
import styles from './Login.module.css';

export default function Login() {
  const { auth } = useAll();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [message, setMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const loader = useLoader();

  // Update loader based on all loading states
  useEffect(() => {
    loader(auth.isLoading || forgotLoading || resetLoading);
  }, [auth.isLoading, forgotLoading, resetLoading, loader]);

  const handleLogin = async () => {
    try {
      await auth.login(email, password);
      navigate("/");
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    }
  };

  const handleForgot = async () => {
    setForgotLoading(true);
    try {
      const res = await AuthService.generateOtp(email);
      if (res.status === "success") {
        setForgotMode(false);
        setResetMode(true);
        setMessage("OTP sent to your email");
      } else {
        setMessage(res.message);
      }
    } catch (err: any) {
      setMessage(err.message || "Failed to generate OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReset = async () => {
    setResetLoading(true);
    try {
      const res = await AuthService.verifyOtp(email, otp, newPassword);
      if (res.status === "success") {
        setMessage("Password reset successfully. Please login.");
        setResetMode(false);
      } else {
        setMessage(res.message);
      }
    } catch (err: any) {
      setMessage(err.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Enter key press for current mode
  const handleEnterKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!forgotMode && !resetMode) handleLogin();
        else if (forgotMode) handleForgot();
        else if (resetMode) handleReset();
      }
    },
    [forgotMode, resetMode, email, password, otp, newPassword]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, [handleEnterKey]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-6 rounded shadow-lg"
        id={styles.cont}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          {forgotMode ? "Forgot Password" : resetMode ? "Reset Password" : "Login"}
        </h2>
        {message && <p className="text-red-500 mb-4">{message}</p>}

        {/* LOGIN */}
        {!forgotMode && !resetMode && (
          <>
            <input
              type="email"
              placeholder="Email"
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded mb-2 transition-colors"
            >
              Login
            </button>
            <div className="flex justify-between w-full" id={styles.links}>
              <button
                onClick={() => setForgotMode(true)}
                className="text-sm text-blue-500 underline"
              >
                Forgot Password?
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="text-sm text-blue-500 underline"
              >
                Create a new account?
              </button>
            </div>


          </>
        )}

        {/* FORGOT PASSWORD */}
        {forgotMode && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleForgot}
              className={`w-full p-2 rounded mb-2 transition-colors ${
                forgotLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={forgotLoading}
            >
              {forgotLoading ? "Sending OTP..." : "Send OTP"}
            </button>
            <button
              onClick={() => setForgotMode(false)}
              className="text-sm text-gray-500 underline"
            >
              Back to Login
            </button>
          </>
        )}

        {/* RESET PASSWORD */}
        {resetMode && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={handleReset}
              className={`w-full p-2 rounded mb-2 transition-colors ${
                resetLoading
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
              disabled={resetLoading}
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              onClick={() => setResetMode(false)}
              className="text-sm text-gray-500 underline"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
