import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from "lucide-react";

import { usePlatformSettings } from "../context/PlatformSettingsContext";

import "./TeamLogin.css";


/* ============================================================
   BACKEND
============================================================ */

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";


/* ============================================================
   TEAM LOGIN
============================================================ */

function TeamLogin() {

  const navigate = useNavigate();

  /* ==========================================================
     PLATFORM SETTINGS
  ========================================================== */

  const { settings } =
    usePlatformSettings();


  const platformName =
    settings?.platformName ||
    "EventWaa";


  const platformLogo =
    settings?.platformLogo ||
    "";


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

  const handleLogin = async (event) => {

    event.preventDefault();

    setError("");


    /* ----------------------------------------------------------
       VALIDATION
    ---------------------------------------------------------- */

    if (
      !email.trim() ||
      !password
    ) {

      setError(
        "Please enter your email and password."
      );

      return;

    }


    try {

      setLoading(true);


      /* --------------------------------------------------------
         LOGIN REQUEST
      -------------------------------------------------------- */

      const response =
        await fetch(
          `${BACKEND_URL}/team-login`,
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


      /* --------------------------------------------------------
         SAFE RESPONSE PARSING
      -------------------------------------------------------- */

      let data = {};

      try {

        data =
          await response.json();

      } catch {

        data = {};

      }


      /* --------------------------------------------------------
         LOGIN ERROR
      -------------------------------------------------------- */

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Unable to sign in."
        );

      }


      /* ========================================================
         SAVE TEAM TOKEN
      ======================================================== */

      if (data.token) {

        localStorage.setItem(
          "eventwaa_team_token",
          data.token
        );

      }


      /* ========================================================
         SAVE TEAM USER
      ======================================================== */

      localStorage.setItem(
        "eventwaa_team_user",
        JSON.stringify(
          data.user || {}
        )
      );


      /* ========================================================
         SAVE TEAM MEMBER
      ======================================================== */

      localStorage.setItem(
        "eventwaa_team_member",
        JSON.stringify(
          data.teamMember || {}
        )
      );


      /* ========================================================
         COMPATIBILITY WITH EXISTING TEAM GUARD
      ======================================================== */

      localStorage.setItem(
        "eventwaaTeamAccount",
        JSON.stringify(
          data.teamMember ||
          data.user ||
          {}
        )
      );


      localStorage.setItem(
        "eventwaaTeamLoggedIn",
        "true"
      );


      /* ========================================================
         GO TO TEAM DASHBOARD
      ======================================================== */

      navigate(
        "/team-dashboard",
        {
          replace: true,
        }
      );


    } catch (err) {

      console.error(
        "TEAM LOGIN ERROR:",
        err
      );


      setError(
        err.message ||
        "Unable to connect to EventWaa."
      );


    } finally {

      setLoading(false);

    }

  };


  /* ============================================================
     RENDER
  ============================================================ */

  return (

    <div className="team-login-page">

      <div className="team-login-card">


        {/* =====================================================
            BRAND
        ===================================================== */}

        <div className="team-login-brand">

          <div className="team-login-logo">

            {platformLogo ? (

              <img
                src={platformLogo}
                alt={`${platformName} logo`}
                className="team-login-platform-logo"
              />

            ) : (

              <ShieldCheck
                size={30}
              />

            )}

          </div>


          <div>

            <h1>
              {platformName}
            </h1>

            <span>
              Team Portal
            </span>

          </div>

        </div>


        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="team-login-heading">

          <h2>
            Team Member Login
          </h2>

          <p>
            Sign in to access your assigned
            events and ticket scanner.
          </p>

        </div>


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div
            className="team-login-error"
            role="alert"
          >

            <AlertCircle
              size={20}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          className="team-login-form"
          onSubmit={handleLogin}
        >


          {/* ===================================================
              EMAIL
          =================================================== */}

          <div className="team-login-field">

            <label>
              Email address
            </label>


            <div className="team-login-input-wrapper">

              <Mail
                size={20}
              />


              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />

            </div>

          </div>


          {/* ===================================================
              PASSWORD
          =================================================== */}

          <div className="team-login-field">

            <label>
              Password
            </label>


            <div className="team-login-input-wrapper">

              <Lock
                size={20}
              />


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
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />


              <button
                type="button"
                className="team-login-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
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


          {/* ===================================================
              LOGIN BUTTON
          =================================================== */}

          <button
            type="submit"
            className="team-login-submit"
            disabled={loading}
          >

            {loading ? (

              <>

                <span className="team-login-spinner" />

                Signing in...

              </>

            ) : (

              <>

                <LogIn
                  size={20}
                />

                Sign In

              </>

            )}

          </button>

        </form>


        {/* =====================================================
            SECURITY NOTE
        ===================================================== */}

        <div className="team-login-security">

          <ShieldCheck
            size={19}
          />

          <p>
            Your account only gives you access to
            the events assigned to you by your host.
          </p>

        </div>


      </div>

    </div>

  );

}


export default TeamLogin;