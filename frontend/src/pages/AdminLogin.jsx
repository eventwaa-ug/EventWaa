import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    ShieldCheck,
    LockKeyhole,
    ArrowLeft
} from "lucide-react";
import {
    FiLock
} from "react-icons/fi";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminLogin.css";

const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL;


// ============================================================
// ADMIN LOGIN 404 PAGE
// ============================================================

function AdminLoginNotFound() {

    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
                fontFamily:
                    "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                background: "#f7f8fa",
                color: "#17181c",
            }}
        >

            <div>

                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        margin: "0 auto 22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "18px",
                        background: "#fff4eb",
                        color: "#ff6b00",
                        border: "1px solid #ffdcca",
                    }}
                >
                    <FiLock size={28} />
                </div>


                <h1
                    style={{
                        margin: 0,
                        fontSize: "72px",
                        fontWeight: 800,
                        letterSpacing: "-3px",
                        lineHeight: 1,
                    }}
                >
                    404
                </h1>


                <h2
                    style={{
                        margin: "12px 0 10px",
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: 1.3,
                    }}
                >
                    Page Not Found
                </h2>


                <p
                    style={{
                        margin: 0,
                        color: "#737780",
                        fontSize: "15px",
                        lineHeight: 1.6,
                    }}
                >
                    The page you are looking for
                    does not exist.
                </p>


                <button
                    type="button"
                    onClick={() => navigate("/")}
                    style={{
                        marginTop: "24px",
                        minHeight: "44px",
                        padding: "0 18px",
                        border: "1px solid #e8e9ec",
                        borderRadius: "10px",
                        background: "#ffffff",
                        color: "#3f4248",
                        fontFamily: "inherit",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    Back to EventWaa
                </button>

            </div>

        </div>
    );
}


// ============================================================
// ADMIN LOGIN
// ============================================================

function AdminLogin() {

    const navigate = useNavigate();

    // ========================================================
    // AUTH
    // ========================================================

    const { user } = useAuth();

    const { settings } =
        usePlatformSettings();


    // ========================================================
    // FORM STATE
    // ========================================================

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [keepSignedIn, setKeepSignedIn] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ========================================================
    // NORMAL USER ACCESS CHECK
    // ========================================================

    const isLoggedInUser =
        Boolean(user);

    const isAdmin =
        user?.role === "admin";


    /*
     * IMPORTANT:
     *
     * A normal EventWaa user, buyer, host or verified host
     * should not be shown the admin login form.
     *
     * All hooks have already been called above, so this
     * conditional return does not violate React's Rules
     * of Hooks.
     */

    if (
        isLoggedInUser &&
        !isAdmin
    ) {
        return (
            <AdminLoginNotFound />
        );
    }


    // ========================================================
    // HANDLE LOGIN
    // ========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        // ----------------------------------------------------
        // BASIC VALIDATION
        // ----------------------------------------------------

        if (
            !email.trim() ||
            !password
        ) {

            setError(
                "Please enter your admin email and password."
            );

            return;
        }


        try {

            setLoading(true);


            // ------------------------------------------------
            // ADMIN LOGIN REQUEST
            // ------------------------------------------------

            const response =
                await fetch(
                    `${BACKEND_URL}/admin/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email:
                                email.trim(),

                            password:
                                password
                        })
                    }
                );


            // ------------------------------------------------
            // SAFELY READ RESPONSE
            // ------------------------------------------------

            let data = {};

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                console.error(
                    "ADMIN LOGIN RESPONSE ERROR:",
                    jsonError
                );

                throw new Error(
                    "The server returned an invalid response."
                );
            }


            // ------------------------------------------------
            // LOGIN FAILED
            // ------------------------------------------------

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Invalid admin credentials."
                );
            }


            // ------------------------------------------------
            // LOGIN SUCCESSFUL
            // ------------------------------------------------

            if (
                !data.token ||
                !data.admin
            ) {

                throw new Error(
                    "Admin authentication response is incomplete."
                );
            }


            // ------------------------------------------------
            // STORE ADMIN TOKEN
            // ------------------------------------------------

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


            // ------------------------------------------------
            // STORE ADMIN INFORMATION
            // ------------------------------------------------

            if (keepSignedIn) {

                localStorage.setItem(
                    "eventwaa_admin",
                    JSON.stringify(
                        data.admin
                    )
                );

                sessionStorage.removeItem(
                    "eventwaa_admin"
                );

            } else {

                sessionStorage.setItem(
                    "eventwaa_admin",
                    JSON.stringify(
                        data.admin
                    )
                );

                localStorage.removeItem(
                    "eventwaa_admin"
                );
            }


            // ------------------------------------------------
            // SUCCESS MESSAGE
            // ------------------------------------------------

            setSuccess(
                "Authentication successful. Opening admin dashboard..."
            );


            // ------------------------------------------------
            // GO TO ADMIN DASHBOARD
            // ------------------------------------------------

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


    // ========================================================
    // BACK TO WEBSITE
    // ========================================================

    const handleBackToWebsite = () => {

        navigate("/");

    };


    // ========================================================
    // PLATFORM NAME
    // ========================================================

    const platformName =
        settings?.platformName ||
        "EventWaa";


    // ========================================================
    // PLATFORM LOGO
    // ========================================================

    const platformLogo =
        settings?.platformLogo ||
        "";


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="admin-login-page">


            {/* =================================================
                BACKGROUND DECORATION
            ================================================= */}

            <div
                className="
                    admin-background-glow
                    admin-glow-one
                "
            />

            <div
                className="
                    admin-background-glow
                    admin-glow-two
                "
            />


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

            <main
                className="
                    admin-login-container
                "
            >


                {/* =================================================
                    LEFT BRANDING PANEL
                ================================================= */}

                <section
                    className="
                        admin-brand-panel
                    "
                >

                    <div
                        className="
                            admin-brand-content
                        "
                    >


                        {/* PLATFORM LOGO */}

                        <div
                            className="
                                admin-logo-wrapper
                            "
                        >

                            {platformLogo ? (

                                <img
                                    src={platformLogo}
                                    alt={platformName}
                                    className="
                                        admin-platform-logo
                                    "
                                />

                            ) : (

                                <div
                                    className="
                                        admin-text-logo
                                    "
                                >
                                    {platformName}
                                </div>

                            )}

                        </div>


                        {/* BRAND TITLE */}

                        <span
                            className="
                                admin-eyebrow
                            "
                        >
                            ADMINISTRATION PORTAL
                        </span>


                        <h1>
                            Manage EventWaa
                            <br />
                            with confidence.
                        </h1>


                        <p
                            className="
                                admin-brand-description
                            "
                        >
                            Securely manage events, hosts, users,
                            payments, withdrawals and the entire
                            EventWaa platform from one place.
                        </p>


                        {/* SECURITY FEATURES */}

                        <div
                            className="
                                admin-security-features
                            "
                        >


                            <div
                                className="
                                    admin-security-feature
                                "
                            >

                                <div
                                    className="
                                        security-feature-icon
                                    "
                                >

                                    <ShieldCheck
                                        size={20}
                                    />

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


                            <div
                                className="
                                    admin-security-feature
                                "
                            >

                                <div
                                    className="
                                        security-feature-icon
                                    "
                                >

                                    <LockKeyhole
                                        size={20}
                                    />

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

                    <div
                        className="
                            admin-brand-footer
                        "
                    >

                        <span>
                            ©️ {new Date().getFullYear()}{" "}
                            {platformName}
                        </span>

                        <span>
                            Secure Administration
                        </span>

                    </div>

                </section>


                {/* =================================================
                    LOGIN PANEL
                ================================================= */}

                <section
                    className="
                        admin-login-panel
                    "
                >

                    <div
                        className="
                            admin-login-card
                        "
                    >


                        {/* LOGIN HEADER */}

                        <div
                            className="
                                admin-login-header
                            "
                        >


                            <div
                                className="
                                    admin-mobile-logo
                                "
                            >

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


                            <div
                                className="
                                    admin-login-icon
                                "
                            >

                                <LockKeyhole
                                    size={23}
                                />

                            </div>


                            <span
                                className="
                                    admin-form-eyebrow
                                "
                            >
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
                                className="
                                    admin-login-alert
                                    admin-error-alert
                                "
                                role="alert"
                            >

                                <div
                                    className="
                                        alert-icon
                                    "
                                >
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
                                className="
                                    admin-login-alert
                                    admin-success-alert
                                "
                                role="status"
                            >

                                <div
                                    className="
                                        alert-icon
                                    "
                                >
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
                            className="
                                admin-login-form
                            "
                            onSubmit={handleSubmit}
                        >


                            {/* EMAIL */}

                            <div
                                className="
                                    admin-input-group
                                "
                            >

                                <label
                                    htmlFor="admin-email"
                                >
                                    Admin email
                                </label>

                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your admin email"
                                    autoComplete="username"
                                    disabled={loading}
                                    required
                                />

                            </div>


                            {/* PASSWORD */}

                            <div
                                className="
                                    admin-input-group
                                "
                            >

                                <div
                                    className="
                                        admin-password-label-row
                                    "
                                >

                                    <label
                                        htmlFor="admin-password"
                                    >
                                        Password
                                    </label>

                                </div>


                                <div
                                    className="
                                        admin-password-wrapper
                                    "
                                >

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


                                    {/* PASSWORD VISIBILITY */}

                                    <button
                                        type="button"
                                        className="
                                            admin-password-toggle
                                        "
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

                                            <EyeOff
                                                size={20}
                                            />

                                        ) : (

                                            <Eye
                                                size={20}
                                            />

                                        )}

                                    </button>

                                </div>

                            </div>


                            {/* FORGOT PASSWORD */}

                            <div
                                className="
                                    admin-forgot-password
                                "
                            >

                                <Link
                                    to="/admin/forgot-password"
                                >
                                    Forgot admin password?
                                </Link>

                            </div>


                            {/* =================================================
                                KEEP ME SIGNED IN
                            ================================================= */}

                            <div
                                className="
                                    admin-remember-row
                                "
                            >

                                <label
                                    htmlFor="admin-remember"
                                    className="
                                        admin-remember-label
                                    "
                                >

                                    <input
                                        id="admin-remember"
                                        type="checkbox"
                                        checked={
                                            keepSignedIn
                                        }
                                        onChange={(e) =>
                                            setKeepSignedIn(
                                                e.target.checked
                                            )
                                        }
                                        disabled={loading}
                                    />

                                    <span>
                                        Keep me signed in
                                    </span>

                                </label>

                                <span
                                    className="
                                        admin-remember-help
                                    "
                                >
                                    On this device
                                </span>

                            </div>


                            {/* SECURITY NOTICE */}

                            <div
                                className="
                                    admin-security-notice
                                "
                            >

                                <ShieldCheck
                                    size={18}
                                />

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
                                className="
                                    admin-login-button
                                "
                                disabled={loading}
                            >

                                {loading ? (

                                    <>

                                        <span
                                            className="
                                                admin-button-spinner
                                            "
                                        />

                                        <span>
                                            Authenticating...
                                        </span>

                                    </>

                                ) : (

                                    <>

                                        <LockKeyhole
                                            size={18}
                                        />

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

                        <div
                            className="
                                admin-login-footer
                            "
                        >

                            <span>
                                <FiLock size={28} /> Secure EventWaa Administration
                            </span>

                        </div>


                    </div>

                </section>

            </main>

        </div>
    );
}


export default AdminLogin;