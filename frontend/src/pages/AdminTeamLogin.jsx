import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
import "./AdminTeamLogin.css";
/* ============================================================
   BACKEND
============================================================ */
const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";
/* ============================================================
   ADMIN TEAM LOGIN
============================================================ */
function AdminTeamLogin() {
  const { settings } =
    usePlatformSettings();
  const navigate =
    useNavigate();
  /* ==========================================================
     FORM STATE
  ========================================================== */
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  /* ============================================================
     LOGIN
  ============================================================ */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    /* ----------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------- */
    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }
    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }
    try {
      setLoading(true);
      /* ========================================================
         ADMIN TEAM LOGIN
      ======================================================== */
      const response =
        await fetch(
          `${BACKEND_URL}/admin/team-login`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              email:
                email
                  .trim()
                  .toLowerCase(),
              password:
                password,
            }),
          }
        );
      /* ========================================================
         SAFE RESPONSE PARSING
      ======================================================== */
      const contentType =
        response.headers.get(
          "content-type"
        ) || "";
      let data = {};
      if (
        contentType
          .toLowerCase()
          .includes(
            "application/json"
          )
      ) {
        data =
          await response.json();
      } else {
        const text =
          await response.text();
        throw new Error(
          text ||
          `Server returned HTTP ${response.status}.`
        );
      }
      console.log(
        "ADMIN TEAM LOGIN RESPONSE:",
        response.status,
        data
      );
      /* ========================================================
         LOGIN FAILED
      ======================================================== */
      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
          "Invalid email or password."
        );
        return;
      }
      /* ========================================================
         TOKEN + ACCOUNT REQUIRED
      ======================================================== */
      if (
        !data.token ||
        !data.account
      ) {
        console.error(
          "ADMIN TEAM LOGIN: INCOMPLETE RESPONSE",
          data
        );
        setError(
          "Team authentication response is incomplete."
        );
        return;
      }
      /* ========================================================
         VERIFY ADMIN TEAM ACCOUNT
      ======================================================== */
      if (
        data.account.teamType &&
        String(
          data.account.teamType
        ).toLowerCase() !== "admin"
      ) {
        console.error(
          "ADMIN TEAM LOGIN: WRONG TEAM TYPE",
          data.account
        );
        setError(
          "This account is not configured as an admin team account."
        );
        return;
      }
      /* ========================================================
         SAVE ADMIN TEAM TOKEN
         IMPORTANT:
         This is intentionally different from
         the regular Team token.
         REGULAR:
         eventwaa_team_token
         ADMIN:
         eventwaa_admin_team_token
      ======================================================== */
      localStorage.setItem(
        "eventwaa_admin_team_token",
        data.token
      );
      /* ========================================================
         SAVE ADMIN TEAM MEMBER
      ======================================================== */
      localStorage.setItem(
        "eventwaa_admin_team_member",
        JSON.stringify(
          data.teamMember ||
          data.account ||
          {}
        )
      );
      /* ========================================================
         SAVE ADMIN TEAM ACCOUNT
         IMPORTANT:
         This is intentionally different from
         eventwaaTeamAccount.
      ======================================================== */
      localStorage.setItem(
        "eventwaaAdminTeamAccount",
        JSON.stringify(
          {
            ...data.account,
            teamType:
              "admin",
            adminTeamMember:
              true,
            teamMember:
              true,
          }
        )
      );
      /* ========================================================
         ADMIN TEAM LOGIN STATE
      ======================================================== */
      localStorage.setItem(
        "eventwaaAdminTeamLoggedIn",
        "true"
      );
      /* ========================================================
         DEBUG
      ======================================================== */
      console.log(
        "ADMIN TEAM LOGIN SUCCESSFUL"
      );
      console.log(
        "ADMIN TEAM ACCOUNT:",
        data.account
      );
      console.log(
        "ADMIN TEAM REDIRECT: /admin/team-dashboard"
      );
      /* ========================================================
         REDIRECT
      ======================================================== */
      navigate(
        "/admin/team-dashboard",
        {
          replace: true,
        }
      );
    } catch (loginError) {
      console.error(
        "ADMIN TEAM LOGIN ERROR:",
        loginError
      );
      setError(
        loginError.message ||
        "Unable to connect to the EventWaa server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="admin-team-login-page">
      <div className="admin-team-login-card">
        {/* ==================================================
            BRAND
        ================================================== */}
        <div className="admin-team-login-brand">
          {settings.platformLogo && (
            <img
              src={settings.platformLogo}
              alt={
                settings.platformName ||
                "EventWaa"
              }
              className="admin-team-login-logo"
            />
          )}
          <h1>
            {settings.platformName ||
              "EventWaa"}
          </h1>
          <span>
            TEAM PORTAL
          </span>
        </div>
        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="admin-team-login-header">
          <h2>
            Welcome back
          </h2>
          <p>
            Sign in to access your{" "}
            {settings.platformName ||
              "EventWaa"}{" "}
            team account.
          </p>
        </div>
        {/* ==================================================
            ERROR
        ================================================== */}
        {error && (
          <div
            className="admin-team-login-error"
            role="alert"
          >
            {error}
          </div>
        )}
        {/* ==================================================
            FORM
        ================================================== */}
        <form
          onSubmit={handleSubmit}
          className="admin-team-login-form"
        >
          {/* ==================================================
              EMAIL
          ================================================== */}
          <div className="admin-team-login-field">
            <label htmlFor="team-email">
              Email address
            </label>
            <input
              id="team-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email address"
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>
          {/* ==================================================
              PASSWORD
          ================================================== */}
          <div className="admin-team-login-field">
            <label htmlFor="team-password">
              Password
            </label>
            <div className="admin-team-password-wrapper">
              <input
                id="team-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="admin-team-password-toggle"
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
                title={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={21}
                    strokeWidth={2}
                  />
                ) : (
                  <Eye
                    size={21}
                    strokeWidth={2}
                  />
                )}
              </button>
            </div>
          </div>
          {/* ==================================================
              SUBMIT
          ================================================== */}
          <button
            type="submit"
            className="admin-team-login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in to Team Portal"}
          </button>
        </form>
        {/* ==================================================
            FOOTER
        ================================================== */}
        <div className="admin-team-login-footer">
          <p>
            {settings.platformName ||
              "EventWaa"}{" "}
            Team Portal
          </p>
          <span>
            Authorized team members only.
          </span>
        </div>
      </div>
    </div>
  );
}
export default AdminTeamLogin;