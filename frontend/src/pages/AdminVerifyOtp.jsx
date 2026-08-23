import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ShieldCheck,
    KeyRound
} from "lucide-react";
import "../styles/AdminVerifyOtp.css";

function AdminVerifyOtp() {

    const navigate = useNavigate();

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        ""
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const inputRefs = useRef([]);


    const email = sessionStorage.getItem(
        "eventwaa_admin_recovery_email"
    );


    // =========================================================
    // PROTECT OTP PAGE
    // =========================================================

    if (!email) {

        return (

            <div className="admin-otp-page">

                <main className="admin-otp-card">

                    <div className="admin-otp-icon">
                        <KeyRound size={28} />
                    </div>

                    <h1>
                        Recovery session not found
                    </h1>

                    <p>
                        Please request a new admin password
                        recovery code.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/forgot-password"
                            )
                        }
                    >
                        Request new code
                    </button>

                </main>

            </div>

        );

    }


    // =========================================================
    // OTP INPUT
    // =========================================================

    const handleOtpChange = (index, value) => {

        const digit = value
            .replace(/\D/g, "")
            .slice(-1);


        const newOtp = [...otp];

        newOtp[index] = digit;

        setOtp(newOtp);


        if (
            digit &&
            index < 5
        ) {

            inputRefs.current[
                index + 1
            ]?.focus();

        }

    };


    // =========================================================
    // BACKSPACE
    // =========================================================

    const handleKeyDown = (index, e) => {

        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {

            inputRefs.current[
                index - 1
            ]?.focus();

        }

    };


    // =========================================================
    // VERIFY OTP
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        const code = otp.join("");


        if (code.length !== 6) {

            setError(
                "Please enter the complete 6-digit verification code."
            );

            return;
        }


        try {

            setLoading(true);


            const response = await fetch(
                "http://localhost:5000/admin/verify-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        otp: code
                    })
                }
            );


            const data = await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Invalid verification code."
                );
            }


            if (!data.resetToken) {

                throw new Error(
                    "The recovery session is incomplete."
                );
            }


            // =================================================
            // STORE RESET TOKEN TEMPORARILY
            // =================================================

            sessionStorage.setItem(
                "eventwaa_admin_reset_token",
                data.resetToken
            );


            setSuccess(
                "Verification successful. You can now create a new password."
            );


            setTimeout(() => {

                navigate(
                    "/admin/reset-password"
                );

            }, 600);


        } catch (error) {

            console.error(
                "ADMIN OTP ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to verify the recovery code."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="admin-otp-page">


            {/* BACK */}

            <button
                type="button"
                className="admin-otp-back"
                onClick={() =>
                    navigate(
                        "/admin/forgot-password"
                    )
                }
            >

                <ArrowLeft size={18} />

                <span>
                    Back
                </span>

            </button>


            <main className="admin-otp-card">


                {/* ICON */}

                <div className="admin-otp-icon">

                    <KeyRound size={28} />

                </div>


                {/* HEADER */}

                <div className="admin-otp-header">

                    <span className="admin-otp-eyebrow">
                        VERIFY YOUR IDENTITY
                    </span>

                    <h1>
                        Check your email
                    </h1>

                    <p>
                        We sent a 6-digit recovery code to
                        your administrator email address.
                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div
                        className="admin-otp-alert admin-otp-error"
                        role="alert"
                    >

                        <strong>
                            Verification unsuccessful
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* SUCCESS */}

                {success && (

                    <div
                        className="admin-otp-alert admin-otp-success"
                        role="status"
                    >

                        <strong>
                            Verified
                        </strong>

                        <span>
                            {success}
                        </span>

                    </div>

                )}


                <form
                    onSubmit={handleSubmit}
                    className="admin-otp-form"
                >


                    <label>
                        Verification code
                    </label>


                    <div className="admin-otp-inputs">

                        {otp.map((digit, index) => (

                            <input
                                key={index}
                                ref={(element) => {
                                    inputRefs.current[
                                        index
                                    ] = element;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) =>
                                    handleOtpChange(
                                        index,
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(
                                        index,
                                        e
                                    )
                                }
                                disabled={loading}
                                aria-label={
                                    `Verification digit ${index + 1}`
                                }
                            />

                        ))}

                    </div>


                    <button
                        type="submit"
                        className="admin-otp-button"
                        disabled={loading}
                    >

                        {loading ? (

                            <>
                                <span className="admin-otp-spinner"></span>

                                <span>
                                    Verifying...
                                </span>
                            </>

                        ) : (

                            <>
                                <ShieldCheck size={19} />

                                <span>
                                    Verify code
                                </span>
                            </>

                        )}

                    </button>


                </form>


                <div className="admin-otp-footer">

                    <ShieldCheck size={16} />

                    <span>
                        Your verification code expires in 10 minutes.
                    </span>

                </div>


            </main>

        </div>

    );

}

export default AdminVerifyOtp;