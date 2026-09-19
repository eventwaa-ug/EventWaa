import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authServices";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";
import { GoogleLogin } from "@react-oauth/google";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
/* ============================================================
   BACKEND API URL
============================================================ */
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
/* ============================================================
   LOGIN PAGE
============================================================ */
function Login() {
    const { settings } = usePlatformSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    /* ========================================================
       FORM STATE
    ======================================================== */
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] =
        useState(false);
    const [error, setError] =
        useState("");
    const [loading, setLoading] =
        useState(false);
    /* ========================================================
       HANDLE INPUT CHANGES
    ======================================================== */
    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };
    /* ========================================================
       EMAIL / PASSWORD LOGIN
    ======================================================== */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response =
                await loginUser(formData);
            if (response.user) {
                login(
                    response.user,
                    response.token
                );
                const redirect =
                    location.state?.from?.pathname ||
                    "/";
                navigate(redirect);
            } else {
                setError(
                    response.message ||
                    "Invalid email or password"
                );
            }
        } catch (err) {
            console.error(
                "Login error:",
                err
            );
            setError(
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };
    /* ========================================================
       GOOGLE LOGIN
    ======================================================== */
    const handleGoogleSuccess =
        async (credentialResponse) => {
            try {
                setError("");
                if (!BACKEND_URL) {
                    console.error(
                        "VITE_API_BASE_URL is not configured."
                    );
                    setError(
                        "Login service is not configured. Please try again later."
                    );
                    return;
                }
                const response =
                    await fetch(
                        `${BACKEND_URL}/google-login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                token:
                                    credentialResponse.credential,
                            }),
                        }
                    );
                const data =
                    await response.json();
                console.log(
                    "Google Login Response:",
                    data
                );
                if (
                    response.ok &&
                    data.success
                ) {
                    login(
                        data.user,
                        data.token
                    );
                    navigate("/");
                } else {
                    setError(
                        data.message ||
                        "Google login failed. Please try again."
                    );
                }
            } catch (error) {
                console.error(
                    "Google login error:",
                    error
                );
                setError(
                    "Google login failed. Please try again."
                );
            }
        };
    /* ========================================================
       GOOGLE LOGIN ERROR
    ======================================================== */
    const handleGoogleError = () => {
        console.error(
            "Google Login Failed"
        );
        setError(
            "Google login failed. Please try again."
        );
    };
    /* ========================================================
       PAGE
    ======================================================== */
    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* ==================================================
                    BRAND
                ================================================== */}
                <div className="auth-brand">
                    {settings.platformLogo ? (
                        <img
                            src={
                                settings.platformLogo
                            }
                            alt={
                                settings.platformName
                            }
                            className="auth-logo"
                        />
                    ) : (
                        <h1>
                            {
                                settings.platformName
                            }
                        </h1>
                    )}
                    <p>
                        Welcome back. Sign in to continue.
                    </p>
                    <br />
                    <br />
                </div>
                {/* ==================================================
                    ERROR MESSAGE
                ================================================== */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                {/* ==================================================
                    LOGIN FORM
                ================================================== */}
                <form
                    onSubmit={handleSubmit}
                >
                    <input
                        type="email"
                        name="email"
                        placeholder="Email address"
                        value={
                            formData.email
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />
                    {/* ==================================================
                        PASSWORD
                    ================================================== */}
                    <div className="password-wrapper">
                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            name="password"
                            placeholder="Password"
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />
                        <span
                            className="password-toggle"
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                        >
                            {showPassword ? (
                                <EyeOff
                                    size={20}
                                />
                            ) : (
                                <Eye
                                    size={20}
                                />
                            )}
                        </span>
                    </div>
                    {/* ==================================================
                        LOGIN BUTTON
                    ================================================== */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-button"
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>
                </form>
                {/* ==================================================
                    FORGOT PASSWORD
                ================================================== */}
                <div className="forgot-password">
                    <Link
                        to="/forgot-password"
                        className="forgot-password-link"
                    >
                        Forgot Password?
                    </Link>
                </div>
                {/* ==================================================
                    DIVIDER
                ================================================== */}
                <div className="divider">
                    OR
                </div>
                {/* ==================================================
                    GOOGLE LOGIN
                ================================================== */}
                <div className="google-login">
                    <GoogleLogin
                        onSuccess={
                            handleGoogleSuccess
                        }
                        onError={
                            handleGoogleError
                        }
                    />
                </div>
                {/* ==================================================
                    REGISTER
                ================================================== */}
                <p className="switch-auth">
                    Don't have an account?
                    <span
                        onClick={() =>
                            navigate(
                                "/register"
                            )
                        }
                    >
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
}
export default Login;