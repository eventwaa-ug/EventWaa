import { useEffect, useState } from "react";
import {
useSearchParams,
useNavigate,
} from "react-router-dom";

import {
Eye,
EyeOff,
CheckCircle,
AlertCircle,
ArrowRight,
} from "lucide-react";

import "./AdminTeamInvitation.css";

import {
usePlatformSettings,
} from "../context/PlatformSettingsContext.jsx";

/* ============================================================
BACKEND URL
============================================================ */

const BACKEND_URL =
import.meta.env.VITE_API_BASE_URL ||
import.meta.env.VITE_API_URL ||
"http://192.168.100.63:5000";

function AdminTeamInvitation() {

const [searchParams] =
useSearchParams();

const navigate =
useNavigate();

const { settings } =
usePlatformSettings();

/* ============================================================
INVITATION TOKEN
============================================================ */

const token =
searchParams.get("token");

/* ============================================================
STATE
============================================================ */

const [member, setMember] =
useState(null);

const [password, setPassword] =
useState("");

const [confirmPassword, setConfirmPassword] =
useState("");

const [showPassword, setShowPassword] =
useState(false);

const [
showConfirmPassword,
setShowConfirmPassword,
] =
useState(false);

const [loading, setLoading] =
useState(true);

const [saving, setSaving] =
useState(false);

const [error, setError] =
useState("");

const [success, setSuccess] =
useState("");

/* ============================================================
PLATFORM BRAND
============================================================ */

const platformName =
settings?.platformName ||
"EventWaa";

const platformLogo =
settings?.platformLogo || "";

/* ============================================================
VALIDATE INVITATION
============================================================ */

useEffect(() => {

let cancelled = false;
const validateInvitation =
  async () => {
    setLoading(true);
    setError("");
    /* --------------------------------------------------------
       TOKEN CHECK
    -------------------------------------------------------- */
    if (!token) {
      if (!cancelled) {
        setError(
          "No invitation token was provided."
        );
        setLoading(false);
      }
      return;
    }
    try {
      console.log(
        "========================================"
      );
      console.log(
        "VALIDATING ADMIN TEAM INVITATION"
      );
      console.log(
        "BACKEND:",
        BACKEND_URL
      );
      console.log(
        "TOKEN EXISTS:",
        Boolean(token)
      );
      console.log(
        "========================================"
      );
      const response =
        await fetch(
          `${BACKEND_URL}/admin/team-invitation/${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
            },
          }
        );
      let data = null;
      try {
        data =
          await response.json();
      } catch {
        data = null;
      }
      console.log(
        "ADMIN TEAM INVITATION RESPONSE:",
        response.status,
        data
      );
      if (!response.ok) {
        throw new Error(
          data?.message ||
          "This invitation is invalid or expired."
        );
      }
      if (!data?.member) {
        throw new Error(
          "The invitation was found, but team member information is missing."
        );
      }
      if (!cancelled) {
        setMember(
          data.member
        );
        setError("");
      }
    } catch (validationError) {
      console.error(
        "ADMIN TEAM INVITATION VALIDATION ERROR:",
        validationError
      );
      if (!cancelled) {
        setMember(null);
        setError(
          validationError?.message ||
          "Unable to validate this invitation. Please try again."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };
validateInvitation();
return () => {
  cancelled = true;
};

}, [token]);

/* ============================================================
ACCEPT INVITATION
============================================================ */

const handleSubmit =
async (event) => {

  event.preventDefault();
  setError("");
  setSuccess("");
  /* --------------------------------------------------------
     TOKEN CHECK
  -------------------------------------------------------- */
  if (!token) {
    setError(
      "This invitation link is missing its security token."
    );
    return;
  }
  /* --------------------------------------------------------
     PASSWORD VALIDATION
  -------------------------------------------------------- */
  if (password.length < 8) {
    setError(
      "Password must be at least 8 characters."
    );
    return;
  }
  if (
    password !==
    confirmPassword
  ) {
    setError(
      "Passwords do not match."
    );
    return;
  }
  try {
    setSaving(true);
    console.log(
      "========================================"
    );
    console.log(
      "ACCEPTING ADMIN TEAM INVITATION"
    );
    console.log(
      "BACKEND:",
      BACKEND_URL
    );
    console.log(
      "========================================"
    );
    const response =
      await fetch(
        `${BACKEND_URL}/admin/team-invitation`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body:
            JSON.stringify({
              token,
              password,
            }),
        }
      );
    let data = null;
    try {
      data =
        await response.json();
    } catch {
      data = null;
    }
    console.log(
      "ADMIN TEAM INVITATION ACCEPT RESPONSE:",
      response.status,
      data
    );
    if (!response.ok) {
      throw new Error(
        data?.message ||
        "Unable to create your team account."
      );
    }
    /* --------------------------------------------------------
       SUCCESS
    -------------------------------------------------------- */
    setSuccess(
      data?.message ||
      "Your EventWaa team account has been created successfully."
    );
    setPassword("");
    setConfirmPassword("");
    /* ========================================================
       IMPORTANT
       ADMIN TEAM MEMBERS MUST GO TO:
       /admin/team-login
       NOT:
       /admin/login
    ======================================================== */
    setTimeout(() => {
      navigate(
        "/admin/team-login",
        {
          replace: true,
        }
      );
    }, 1800);
  } catch (submitError) {
    console.error(
      "ADMIN TEAM INVITATION ACCEPT ERROR:",
      submitError
    );
    setError(
      submitError?.message ||
      "Unable to create your team account. Please try again."
    );
  } finally {
    setSaving(false);
  }
};

/* ============================================================
LOADING SCREEN
============================================================ */

if (loading) {

return (
  <div className="team-invitation-page">
    <div className="team-invitation-card">
      <div className="team-invitation-brand">
        {platformLogo ? (
          <img
            src={platformLogo}
            alt={platformName}
            className="team-invitation-logo"
          />
        ) : (
          <div className="team-invitation-brand-name">
            {platformName}
          </div>
        )}
      </div>
      <div className="team-invitation-loading">
        <div className="team-invitation-spinner" />
        <h2>
          Checking invitation...
        </h2>
        <p>
          Please wait while we verify your invitation.
        </p>
      </div>
    </div>
  </div>
);

}

/* ============================================================
INVALID INVITATION
============================================================ */

if (
error &&
!member
) {

return (
  <div className="team-invitation-page">
    <div className="team-invitation-card">
      <div className="team-invitation-brand">
        {platformLogo ? (
          <img
            src={platformLogo}
            alt={platformName}
            className="team-invitation-logo"
          />
        ) : (
          <div className="team-invitation-brand-name">
            {platformName}
          </div>
        )}
      </div>
      <div className="team-invitation-error-icon">
        <AlertCircle
          size={38}
        />
      </div>
      <span className="team-invitation-eyebrow">
        TEAM INVITATION
      </span>
      <h1>
        Invitation unavailable
      </h1>
      <p className="team-invitation-error">
        {error}
      </p>
      <div className="team-invitation-help">
        <strong>
          What happened?
        </strong>
        <span>
          The invitation could not be verified.
          It may have expired, already been accepted,
          or the EventWaa server may not be reachable.
        </span>
      </div>
      <button
        type="button"
        className="team-invitation-primary-btn"
        onClick={() =>
          window.location.reload()
        }
      >
        Try Again
      </button>
      <button
        type="button"
        className="team-invitation-secondary-btn"
        onClick={() =>
          navigate("/")
        }
      >
        Go to {platformName}
      </button>
    </div>
  </div>
);

}

/* ============================================================
MAIN INVITATION
============================================================ */

return (

<div className="team-invitation-page">
  <div className="team-invitation-card">
    {/* ======================================================
        BRAND
    ====================================================== */}
    <div className="team-invitation-brand">
      {platformLogo ? (
        <img
          src={platformLogo}
          alt={platformName}
          className="team-invitation-logo"
        />
      ) : (
        <div className="team-invitation-brand-name">
          {platformName}
        </div>
      )}
    </div>
    {/* ======================================================
        ICON
    ====================================================== */}
    <div className="team-invitation-welcome-icon">
      👋
    </div>
    <span className="team-invitation-eyebrow">
      TEAM INVITATION
    </span>
    <h1>
      Welcome to the team
    </h1>
    <p className="team-invitation-intro">
      Hi{" "}
      <strong>
        {member?.name || "there"}
      </strong>
      , you've been invited to join the{" "}
      {platformName} team.
    </p>
    {/* ======================================================
        MEMBER DETAILS
    ====================================================== */}
    <div className="team-invitation-details">
      <div>
        <span>
          EMAIL
        </span>
        <strong>
          {member?.email ||
            "Not available"}
        </strong>
      </div>
      <div>
        <span>
          ROLE
        </span>
        <strong>
          {member?.role ||
            "Team member"}
        </strong>
      </div>
      {member?.host && (
        <div>
          <span>
            HOST
          </span>
          <strong>
            {member.host}
          </strong>
        </div>
      )}
      {member?.event && (
        <div>
          <span>
            EVENT
          </span>
          <strong>
            {member.event}
          </strong>
        </div>
      )}
    </div>
    {/* ======================================================
        FORM
    ====================================================== */}
    <form
      onSubmit={handleSubmit}
      className="team-invitation-form"
    >
      {/* ==================================================
          PASSWORD
      ================================================== */}
      <div className="team-invitation-field">
        <label>
          Create password
        </label>
        <div className="team-invitation-password">
          <input
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
            placeholder="At least 8 characters"
            disabled={saving}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="team-invitation-eye"
            onClick={() =>
              setShowPassword(
                (previous) =>
                  !previous
              )
            }
            disabled={saving}
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
      {/* ==================================================
          CONFIRM PASSWORD
      ================================================== */}
      <div className="team-invitation-field">
        <label>
          Confirm password
        </label>
        <div className="team-invitation-password">
          <input
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            placeholder="Enter password again"
            disabled={saving}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="team-invitation-eye"
            onClick={() =>
              setShowConfirmPassword(
                (previous) =>
                  !previous
              )
            }
            disabled={saving}
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
      {/* ==================================================
          ERROR
      ================================================== */}
      {error && (
        <div className="team-invitation-message error">
          <AlertCircle
            size={20}
          />
          <span>
            {error}
          </span>
        </div>
      )}
      {/* ==================================================
          SUCCESS
      ================================================== */}
      {success && (
        <div className="team-invitation-message success">
          <CheckCircle
            size={20}
          />
          <span>
            {success}
          </span>
        </div>
      )}
      {/* ==================================================
          SUBMIT
      ================================================== */}
      <button
        type="submit"
        className="team-invitation-submit"
        disabled={saving}
      >
        {saving ? (
          <>
            <span className="team-button-spinner" />
            Creating account...
          </>
        ) : (
          <>
            Accept Invitation
            <ArrowRight
              size={19}
            />
          </>
        )}
      </button>
    </form>
    {/* ======================================================
        FOOTER
    ====================================================== */}
    <div className="team-invitation-footer">
      🔒 Your password is securely encrypted.
    </div>
  </div>
</div>

);

}

export default AdminTeamInvitation;