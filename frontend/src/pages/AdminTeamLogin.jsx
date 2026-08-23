import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
import "./AdminTeamLogin.css";

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";

function AdminTeamLogin() {

  const { settings } =
    usePlatformSettings();

  const navigate =
    useNavigate();

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

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");

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

      const response = await fetch(
        `${BACKEND_URL}/admin/team-login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json"
          },

          body: JSON.stringify({

            email:
              email
                .trim()
                .toLowerCase(),

            password

          })
        }
      );

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

      // ======================================================
      // TOKEN IS NOW REQUIRED
      // ======================================================

      if (
        !data.token ||
        !data.account
      ) {

        setError(
          "Team authentication response is incomplete."
        );

        return;
      }

      // ======================================================
      // STORE TEAM TOKEN
      // ======================================================

      localStorage.setItem(
        "eventwaa_team_token",
        data.token
      );

      // ======================================================
      // STORE TEAM ACCOUNT
      // ======================================================

      localStorage.setItem(
        "eventwaaTeamAccount",
        JSON.stringify(
          data.account
        )
      );

      localStorage.setItem(
        "eventwaaTeamLoggedIn",
        "true"
      );

      // ======================================================
      // REDIRECT
      // ======================================================

      navigate(
        "/admin/team-dashboard"
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

  return (

    <div className="admin-team-login-page">

      <div className="admin-team-login-card">

        <div className="admin-team-login-brand">

          {settings.platformLogo ? (

            <img
              src={settings.platformLogo}
              alt={
                settings.platformName ||
                "EventWaa"
              }
              className="admin-team-login-logo"
            />

          ) : (

            <h1>
              {settings.platformName ||
                "EventWaa"}
            </h1>

          )}

          <span>
            TEAM PORTAL
          </span>

        </div>

        <div className="admin-team-login-header">

          <h2>
            Welcome back
          </h2>

          <p>
            Sign in to access your EventWaa
            team account.
          </p>

        </div>

        {error && (

          <div
            className="admin-team-login-error"
            role="alert"
          >

            {error}

          </div>

        )}

        <form
          onSubmit={handleSubmit}
          className="admin-team-login-form"
        >

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
              >

                {showPassword ? (
                  <EyeOff size={21} />
                ) : (
                  <Eye size={21} />
                )}

              </button>

            </div>

          </div>

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

        <div className="admin-team-login-footer">

          <p>
            EventWaa Team Portal
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