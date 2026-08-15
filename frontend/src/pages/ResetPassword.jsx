import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/ResetPassword.css";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetToken, setResetToken] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Your recovery session has expired. Please request a new password reset."
      );
      return;
    }

    // Step 1: Verify OTP
    if (!otpVerified) {
      if (!otp.trim()) {
        setError("Please enter the verification code.");
        return;
      }

      if (!/^\d{6}$/.test(otp)) {
        setError("The verification code must contain 6 digits.");
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          "http://127.0.0.1:5000/verify-otp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              otp,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Invalid verification code.");
          return;
        }

        setResetToken(data.resetToken);
        setOtpVerified(true);
        setMessage(
          "Code verified. You can now create a new password."
        );
      } catch (error) {
        console.error("OTP verification error:", error);
        setError(
          "Unable to connect to the server. Please try again."
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // Step 2: Validate new password
    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setError(
        "Your password reset session is invalid. Please request a new code."
      );
      return;
    }

    // Step 3: Reset password
    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            resetToken,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to reset your password."
        );
        return;
      }

      setMessage(
        "Password reset successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Please return to the password recovery page."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:5000/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to resend the verification code."
        );
        return;
      }

      setOtp("");
      setResetToken("");
      setOtpVerified(false);

      setMessage(
        "If an account exists with this email, a new recovery code has been sent."
      );
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <div className="reset-password-icon">🔐</div>

        <h1>Reset Password</h1>

        <p className="reset-description">
          {otpVerified
            ? "Your email has been verified. Create a new password for your EventWaa account."
            : "Enter the 6-digit verification code sent to your email to continue."}
        </p>

        {email && (
          <div className="recovery-email">
            Code sent to <strong>{email}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
              autoComplete="one-time-code"
              disabled={otpVerified || loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={!otpVerified || loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!otpVerified || loading}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={
                  showConfirmPassword ? "text" : "password"
                }
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
                disabled={!otpVerified || loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                disabled={!otpVerified || loading}
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {error && <div className="reset-error">{error}</div>}
          {message && (
            <div className="reset-success">{message}</div>
          )}

          <button
            type="submit"
            className="reset-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : otpVerified
              ? "Reset Password"
              : "Verify Code"}
          </button>
        </form>

        {!otpVerified && (
          <div className="resend-section">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              className="resend-button"
              onClick={handleResendCode}
              disabled={loading}
            >
              Resend Code
            </button>
          </div>
        )}

        <div className="back-to-login">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;