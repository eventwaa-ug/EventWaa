import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    LockKeyhole,
    ShieldCheck
} from "lucide-react";
import "../styles/AdminResetPassword.css";

function AdminResetPassword() {

    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    const email = sessionStorage.getItem(
        "eventwaa_admin_recovery_email"
    );

    const resetToken = sessionStorage.getItem(
        "eventwaa_admin_reset_token"
    );


    // =========================================================
    // CHECK RECOVERY SESSION
    // =========================================================

    if (!email || !resetToken) {

        return (

            <div className="admin-reset-page">

                <main className="admin-reset-card">

                    <div className="admin-reset-icon">
                        <LockKeyhole size={28} />
                    </div>

                    <h1>
                        Recovery session expired
                    </h1>

                    <p>
                        Please start the admin password recovery
                        process again.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/forgot-password"
                            )
                        }
                    >
                        Start recovery again
                    </button>

                </main>

            </div>

        );

    }


    // =========================================================
    // PASSWORD VALIDATION
    // =========================================================

    const validatePassword = () => {

        if (password.length < 8) {

            return (
                "Your password must contain at least 8 characters."
            );

        }


        if (password !== confirmPassword) {

            return (
                "Your passwords do not match."
            );

        }


        return null;

    };


    // =========================================================
    // RESET PASSWORD
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        const validationError =
            validatePassword();


        if (validationError) {

            setError(
                validationError
            );

            return;
        }


        try {

            setLoading(true);


            const response = await fetch(
                "http://localhost:5000/admin/reset-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        email,

                        resetToken,

                        password

                    })
                }
            );


            const data = await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to reset your password."
                );

            }


            setSuccess(
                "Your administrator password has been reset successfully."
            );


            // =================================================
            // DELETE RECOVERY DATA
            // =================================================

            sessionStorage.removeItem(
                "eventwaa_admin_recovery_email"
            );

            sessionStorage.removeItem(
                "eventwaa_admin_reset_token"
            );


            // =================================================
            // RETURN TO LOGIN
            // =================================================

            setTimeout(() => {

                navigate(
                    "/admin/login",
                    {
                        replace: true,
                        state: {
                            passwordReset: true
                        }
                    }
                );

            }, 1000);


        } catch (error) {

            console.error(
                "ADMIN PASSWORD RESET ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to reset your administrator password."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="admin-reset-page">


            {/* BACK */}

            <button
                type="button"
                className="admin-reset-back"
                onClick={() =>
                    navigate(
                        "/admin/verify-otp"
                    )
                }
            >

                <ArrowLeft size={18} />

                <span>
                    Back to verification
                </span>

            </button>


            <main className="admin-reset-card">


                {/* ICON */}

                <div className="admin-reset-icon">

                    <LockKeyhole size={28} />

                </div>


                {/* HEADER */}

                <div className="admin-reset-header">

                    <span className="admin-reset-eyebrow">
                        NEW ADMIN PASSWORD
                    </span>

                    <h1>
                        Create a new password
                    </h1>

                    <p>
                        Choose a strong password for your
                        EventWaa administrator account.
                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div
                        className="admin-reset-alert admin-reset-error"
                        role="alert"
                    >

                        <strong>
                            Unable to reset password
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* SUCCESS */}

                {success && (

                    <div
                        className="admin-reset-alert admin-reset-success"
                        role="status"
                    >

                        <strong>
                            Password updated
                        </strong>

                        <span>
                            {success}
                        </span>

                    </div>

                )}


                <form
                    className="admin-reset-form"
                    onSubmit={handleSubmit}
                >


                    {/* NEW PASSWORD */}

                    <div className="admin-reset-input-group">

                        <label htmlFor="admin-new-password">
                            New password
                        </label>


                        <div className="admin-reset-password-wrapper">

                            <input
                                id="admin-new-password"
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
                                placeholder="Enter your new password"
                                autoComplete="new-password"
                                disabled={loading}
                                required
                            />


                            <button
                                type="button"
                                className="admin-reset-password-toggle"
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


                    {/* CONFIRM PASSWORD */}

                    <div className="admin-reset-input-group">

                        <label htmlFor="admin-confirm-password">
                            Confirm new password
                        </label>


                        <div className="admin-reset-password-wrapper">

                            <input
                                id="admin-confirm-password"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(
                                        e.target.value
                                    )
                                }
                                placeholder="Confirm your new password"
                                autoComplete="new-password"
                                disabled={loading}
                                required
                            />


                            <button
                                type="button"
                                className="admin-reset-password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                                disabled={loading}
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >

                                {showConfirmPassword ? (

                                    <EyeOff size={20} />

                                ) : (

                                    <Eye size={20} />

                                )}

                            </button>

                        </div>

                    </div>


                    {/* PASSWORD REQUIREMENT */}

                    <div className="admin-reset-security">

                        <ShieldCheck size={19} />

                        <div>

                            <strong>
                                Password requirement
                            </strong>

                            <span>
                                Your password must contain at least
                                8 characters.
                            </span>

                        </div>

                    </div>


                    {/* BUTTON */}

                    <button
                        type="submit"
                        className="admin-reset-button"
                        disabled={loading}
                    >

                        {loading ? (

                            <>
                                <span className="admin-reset-spinner"></span>

                                <span>
                                    Updating password...
                                </span>
                            </>

                        ) : (

                            <>
                                <LockKeyhole size={19} />

                                <span>
                                    Reset admin password
                                </span>
                            </>

                        )}

                    </button>


                </form>


                <div className="admin-reset-footer">

                    <ShieldCheck size={16} />

                    <span>
                        Secure EventWaa Administration
                    </span>

                </div>


            </main>

        </div>

    );

}

export default AdminResetPassword;