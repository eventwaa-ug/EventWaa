import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  setMessage("");
  setError("");

  if (!email.trim()) {
    setError("Please enter your email address.");
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:5000/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.message || "Unable to process your request."
      );
      return;
    }

    setMessage(data.message);

    setTimeout(() => {
      navigate("/reset-password", {
        state: {
          email: email.trim().toLowerCase(),
        },
      });
    }, 1500);

  } catch (error) {

    console.error(
      "Forgot password error:",
      error
    );

    setError(
      "Unable to connect to the server. Please try again."
    );
  }
};
  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">

        <div className="forgot-password-icon">
          🔐
        </div>

        <h1>Forgot Password?</h1>

        <p className="forgot-password-description">
          Enter the email address connected to your EventWaa account.
          We'll send you a verification code to help you recover your account.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="forgot-error">
              {error}
            </div>
          )}

          {message && (
            <div className="forgot-success">
              {message}
            </div>
          )}

          <button type="submit" className="recover-button">
            Continue
          </button>

        </form>

        <div className="back-to-login">
          <Link to="/login">
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;