import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, LockKeyhole, ArrowLeft } from "lucide-react";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
import "../styles/AdminLogin.css";

function AdminLogin() {
    const navigate = useNavigate();

    const { settings } = usePlatformSettings();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [keepSignedIn, setKeepSignedIn] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    // =========================================================
    // HANDLE LOGIN
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (!email.trim() || !password) {

            setError(
                "Please enter your admin email and password."
            );

            return;
        }


        try {

            setLoading(true);


            // -------------------------------------------------
            // ADMIN LOGIN REQUEST
            // -------------------------------------------------

            const response = await fetch(
                "http://localhost:5000/admin/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email.trim(),
                        password: password
                    })
                }
            );


            // -------------------------------------------------
            // SAFELY READ RESPONSE
            // -------------------------------------------------

            let data = {};

            try {

                data = await response.json();

            } catch (jsonError) {

                console.error(
                    "ADMIN LOGIN RESPONSE ERROR:",
                    jsonError
                );

                throw new Error(
                    "The server returned an invalid response."
                );
            }


            // -------------------------------------------------
            // LOGIN FAILED
            // -------------------------------------------------

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Invalid admin credentials."
                );
            }


            // -------------------------------------------------
            // LOGIN SUCCESSFUL
            // -------------------------------------------------

            if (!data.token || !data.admin) {

                throw new Error(
                    "Admin authentication response is incomplete."
                );
            }


            // -------------------------------------------------
            // STORE ADMIN TOKEN
            // -------------------------------------------------
            if (keepSignedIn) {

                localStorage.setItem(
                    "eventwaa_admin_token",
                    data.token
                );

                sessionStorage.removeItem(
                    "eventwaa_admin_token"
                );

            } else {

                sessionStorage.setItem(
                    "eventwaa_admin_token",
                    data.token
                );

                localStorage.removeItem(
                    "eventwaa_admin_token"
                );

            }


            // -------------------------------------------------
            // STORE ADMIN INFORMATION
            // -------------------------------------------------

            if (keepSignedIn) {

                localStorage.setItem(
                    "eventwaa_admin",
                    JSON.stringify(data.admin)
                );

                sessionStorage.removeItem(
                    "eventwaa_admin"
                );

            } else {

                sessionStorage.setItem(
                    "eventwaa_admin",
                    JSON.stringify(data.admin)
                );

                localStorage.removeItem(
                    "eventwaa_admin"
                );

            }

            // -------------------------------------------------
            // SUCCESS MESSAGE
            // -------------------------------------------------

            setSuccess(
                "Authentication successful. Opening admin dashboard..."
            );


            // -------------------------------------------------
            // GO TO ADMIN DASHBOARD
            // -------------------------------------------------

            setTimeout(() => {

                navigate("/admin");

            }, 500);


        } catch (error) {

            console.error(
                "ADMIN LOGIN ERROR:",
                error
            );


            setError(
                error.message ||
                "Unable to sign in. Please try again."
            );


        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // BACK TO WEBSITE
    // =========================================================

    const handleBackToWebsite = () => {

        navigate("/");

    };


    // =========================================================
    // PLATFORM NAME
    // =========================================================

    const platformName =
        settings?.platformName ||
        "EventWaa";


    // =========================================================
    // PLATFORM LOGO
    // =========================================================

    const platformLogo =
        settings?.platformLogo || "";


    return (

        <div className="admin-login-page">


            {/* =================================================
                BACKGROUND DECORATION
            ================================================= */}

            <div className="admin-background-glow admin-glow-one"></div>

            <div className="admin-background-glow admin-glow-two"></div>


            {/* =================================================
                BACK TO WEBSITE
            ================================================= */}

            <button
                type="button"
                className="admin-back-button"
                onClick={handleBackToWebsite}
            >

                <ArrowLeft size={17} />

                <span>
                    Back to EventWaa
                </span>

            </button>


            {/* =================================================
                MAIN CONTAINER
            ================================================= */}

            <main className="admin-login-container">


                {/* =================================================
                    LEFT BRANDING PANEL
                ================================================= */}

                <section className="admin-brand-panel">


                    <div className="admin-brand-content">


                        {/* PLATFORM LOGO */}

                        <div className="admin-logo-wrapper">

                            {platformLogo ? (

                                <img
                                    src={platformLogo}
                                    alt={platformName}
                                    className="admin-platform-logo"
                                />

                            ) : (

                                <div className="admin-text-logo">

                                    {platformName}

                                </div>

                            )}

                        </div>


                        {/* BRAND TITLE */}

                        <span className="admin-eyebrow">
                            ADMINISTRATION PORTAL
                        </span>


                        <h1>
                            Manage EventWaa
                            <br />
                            with confidence.
                        </h1>


                        <p className="admin-brand-description">

                            Securely manage events, hosts, users,
                            payments, withdrawals and the entire
                            EventWaa platform from one place.

                        </p>
                         

                        {/* SECURITY FEATURES */}

                        <div className="admin-security-features">


                            <div className="admin-security-feature">

                                <div className="security-feature-icon">

                                    <ShieldCheck size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Protected access
                                    </strong>

                                    <span>
                                        Admin-only dashboard access
                                    </span>

                                </div>

                            </div>


                            <div className="admin-security-feature">

                                <div className="security-feature-icon">

                                    <LockKeyhole size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Secure authentication
                                    </strong>

                                    <span>
                                        Your admin credentials stay protected
                                    </span>

                                </div>

                            </div>


                        </div>


                    </div>


                    {/* BRAND PANEL FOOTER */}

                    <div className="admin-brand-footer">

                        <span>
                            © {new Date().getFullYear()} {platformName}
                        </span>

                        <span>
                            Secure Administration
                        </span>

                    </div>


                </section>



                {/* =================================================
                    LOGIN PANEL
                ================================================= */}

                <section className="admin-login-panel">


                    <div className="admin-login-card">


                        {/* LOGIN HEADER */}

                        <div className="admin-login-header">


                            <div className="admin-mobile-logo">

                                {platformLogo ? (

                                    <img
                                        src={platformLogo}
                                        alt={platformName}
                                    />

                                ) : (

                                    <span>
                                        {platformName}
                                    </span>

                                )}

                            </div>


                            <div className="admin-login-icon">

                                <LockKeyhole size={23} />

                            </div>


                            <span className="admin-form-eyebrow">
                                SECURE ADMIN ACCESS
                            </span>


                            <h2>
                                Welcome back
                            </h2>


                            <p>
                                Sign in to access your EventWaa
                                administration dashboard.
                            </p>


                        </div>


                        {/* =================================================
                            ERROR MESSAGE
                        ================================================= */}

                        {error && (

                            <div
                                className="admin-login-alert admin-error-alert"
                                role="alert"
                            >

                                <div className="alert-icon">
                                    !
                                </div>

                                <div>

                                    <strong>
                                        Sign-in unsuccessful
                                    </strong>

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            SUCCESS MESSAGE
                        ================================================= */}

                        {success && (

                            <div
                                className="admin-login-alert admin-success-alert"
                                role="status"
                            >

                                <div className="alert-icon">
                                    ✓
                                </div>

                                <div>

                                    <strong>
                                        Access granted
                                    </strong>

                                    <span>
                                        {success}
                                    </span>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            LOGIN FORM
                        ================================================= */}

                        <form
                            className="admin-login-form"
                            onSubmit={handleSubmit}
                        >


                            {/* EMAIL */}

                            <div className="admin-input-group">

                                <label htmlFor="admin-email">
                                    Admin email
                                </label>

                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    placeholder="Enter your admin email"
                                    autoComplete="username"
                                    disabled={loading}
                                    required
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="admin-input-group">

                                <div className="admin-password-label-row">

                                    <label htmlFor="admin-password">
                                        Password
                                    </label>

                                </div>


                                <div className="admin-password-wrapper">

                                    <input
                                        id="admin-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter your admin password"
                                        autoComplete="current-password"
                                        disabled={loading}
                                        required
                                    />


                                    {/* FISH EYE */}

                                    <button
                                        type="button"
                                        className="admin-password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        disabled={loading}
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >

                                        {showPassword ? (

                                            <EyeOff size={20} />

                                        ) : (

                                            <Eye size={20} />

                                        )}

                                    </button>

                                </div>

                            </div>


                            {/* =================================================
                                KEEP ME SIGNED IN
                            ================================================= */}

                            <div className="admin-remember-row">

                                <label
                                    htmlFor="admin-remember"
                                    className="admin-remember-label"
                                >

                                    <input
                                        id="admin-remember"
                                        type="checkbox"
                                        checked={keepSignedIn}
                                        onChange={(e) =>
                                            setKeepSignedIn(e.target.checked)
                                        }
                                        disabled={loading}
                                    />

                                    <span>
                                        Keep me signed in
                                    </span>

                                </label>

                                <span className="admin-remember-help">
                                    On this device
                                </span>

                            </div>


                            {/* SECURITY NOTICE */}

                            <div className="admin-security-notice">

                                <ShieldCheck size={18} />

                                <p>

                                    This area is restricted to
                                    authorized EventWaa administrators.
                                    Failed access attempts may be
                                    monitored for security.

                                </p>

                            </div>


                            {/* LOGIN BUTTON */}

                            <button
                                type="submit"
                                className="admin-login-button"
                                disabled={loading}
                            >

                                {loading ? (

                                    <>

                                        <span className="admin-button-spinner"></span>

                                        <span>
                                            Authenticating...
                                        </span>

                                    </>

                                ) : (

                                    <>

                                        <LockKeyhole size={18} />

                                        <span>
                                            Sign in to Admin
                                        </span>

                                    </>

                                )}

                            </button>


                        </form>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="admin-login-footer">

                            <span>
                                🔒 Secure EventWaa Administration
                            </span>

                        </div>


                    </div>


                </section>


            </main>

        </div>

    );

}


export default AdminLogin;