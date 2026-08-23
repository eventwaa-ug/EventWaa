import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Mail,
    ShieldCheck,
    LockKeyhole
} from "lucide-react";
import "../styles/AdminForgotPassword.css";

function AdminForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================================
    // HANDLE PASSWORD RECOVERY REQUEST
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        if (!email.trim()) {

            setError(
                "Please enter your administrator email address."
            );

            return;
        }


        try {

            setLoading(true);


            const response = await fetch(
                "http://localhost:5000/admin/forgot-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email.trim()
                    })
                }
            );


            let data = {};

            try {

                data = await response.json();

            } catch (jsonError) {

                console.error(
                    "ADMIN RECOVERY RESPONSE ERROR:",
                    jsonError
                );

                throw new Error(
                    "The server returned an invalid response."
                );
            }


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to process your recovery request."
                );
            }


            setSuccess(
                data.message ||
                "If this is the registered administrator email, a recovery code has been sent."
            );


            // =================================================
            // SAVE EMAIL FOR OTP SCREEN
            // =================================================

            sessionStorage.setItem(
                "eventwaa_admin_recovery_email",
                email.trim().toLowerCase()
            );


            // =================================================
            // MOVE TO OTP SCREEN
            // =================================================

            setTimeout(() => {

                navigate(
                    "/admin/verify-otp"
                );

            }, 700);


        } catch (error) {

            console.error(
                "ADMIN FORGOT PASSWORD ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to process your recovery request."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="admin-recovery-page">

            {/* BACKGROUND */}

            <div className="admin-recovery-glow admin-recovery-glow-one"></div>

            <div className="admin-recovery-glow admin-recovery-glow-two"></div>


            {/* BACK TO LOGIN */}

            <button
                type="button"
                className="admin-recovery-back"
                onClick={() =>
                    navigate("/admin/login")
                }
            >

                <ArrowLeft size={18} />

                <span>
                    Back to Admin Login
                </span>

            </button>


            {/* CARD */}

            <main className="admin-recovery-card">


                {/* ICON */}

                <div className="admin-recovery-icon">

                    <LockKeyhole size={28} />

                </div>


                {/* HEADER */}

                <div className="admin-recovery-header">

                    <span className="admin-recovery-eyebrow">
                        SECURE ADMIN RECOVERY
                    </span>

                    <h1>
                        Forgot your password?
                    </h1>

                    <p>
                        Enter your administrator email address
                        and we'll send you a secure verification
                        code.
                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div
                        className="admin-recovery-alert admin-recovery-error"
                        role="alert"
                    >

                        <div className="admin-recovery-alert-icon">
                            !
                        </div>

                        <div>

                            <strong>
                                Unable to continue
                            </strong>

                            <span>
                                {error}
                            </span>

                        </div>

                    </div>

                )}


                {/* SUCCESS */}

                {success && (

                    <div
                        className="admin-recovery-alert admin-recovery-success"
                        role="status"
                    >

                        <div className="admin-recovery-alert-icon">
                            ✓
                        </div>

                        <div>

                            <strong>
                                Recovery request sent
                            </strong>

                            <span>
                                {success}
                            </span>

                        </div>

                    </div>

                )}


                {/* FORM */}

                <form
                    className="admin-recovery-form"
                    onSubmit={handleSubmit}
                >


                    <div className="admin-recovery-input-group">

                        <label htmlFor="admin-recovery-email">
                            Administrator email
                        </label>


                        <div className="admin-recovery-input-wrapper">

                            <Mail
                                size={20}
                                className="admin-recovery-input-icon"
                            />

                            <input
                                id="admin-recovery-email"
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your admin email"
                                autoComplete="email"
                                disabled={loading}
                                required
                            />

                        </div>

                    </div>


                    {/* SECURITY NOTICE */}

                    <div className="admin-recovery-security">

                        <ShieldCheck size={19} />

                        <p>
                            For security, we don't reveal whether
                            an email belongs to an administrator
                            account.
                        </p>

                    </div>


                    {/* BUTTON */}

                    <button
                        type="submit"
                        className="admin-recovery-button"
                        disabled={loading}
                    >

                        {loading ? (

                            <>

                                <span className="admin-recovery-spinner"></span>

                                <span>
                                    Sending code...
                                </span>

                            </>

                        ) : (

                            <>

                                <Mail size={19} />

                                <span>
                                    Send recovery code
                                </span>

                            </>

                        )}

                    </button>


                </form>


                {/* FOOTER */}

                <div className="admin-recovery-footer">

                    <ShieldCheck size={16} />

                    <span>
                        Secure EventWaa Administration
                    </span>

                </div>


            </main>

        </div>

    );

}

export default AdminForgotPassword;