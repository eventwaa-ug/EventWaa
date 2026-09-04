import {
  useState,
  useRef
} from "react";
import {
  FiCamera,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiTrash2,
  FiArrowLeft,
  FiUser,
  FiMail,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiTag,
  FiHash
} from "react-icons/fi";
import { Scanner } from "@yudiel/react-qr-scanner";
import "./AdminTicketScanner.css";
import {
  useNavigate
} from "react-router-dom";
import {
  usePlatformSettings
} from "../context/PlatformSettingsContext.jsx";
const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";
function AdminTicketScanner() {
  const navigate = useNavigate();
  const { settings } =
    usePlatformSettings();
  /* ============================================================
     SCAN LOCK
  ============================================================ */
  const scanLockRef =
    useRef(false);
  /* ============================================================
     STATE
  ============================================================ */
  const [isScanning, setIsScanning] =
    useState(true);
  const [result, setResult] =
    useState("");
  const [message, setMessage] =
    useState(null);
  const [checking, setChecking] =
    useState(false);
  /* ============================================================
     SAVED STATS
  ============================================================ */
  const getSavedStats = () => {
    try {
      const saved =
        localStorage.getItem(
          "eventwaa_admin_scanner_stats"
        );
      if (!saved) {
        return {
          successful: 0,
          invalid: 0
        };
      }
      const parsed =
        JSON.parse(saved);
      return {
        successful:
          Number(
            parsed?.successful
          ) || 0,
        invalid:
          Number(
            parsed?.invalid
          ) || 0
      };
    } catch (error) {
      console.error(
        "ADMIN SCANNER STATS LOAD ERROR:",
        error
      );
      return {
        successful: 0,
        invalid: 0
      };
    }
  };
  const [stats, setStats] =
    useState(getSavedStats);
  /* ============================================================
     SAVE STATS
  ============================================================ */
  const saveStats =
    (newStats) => {
      try {
        localStorage.setItem(
          "eventwaa_admin_scanner_stats",
          JSON.stringify(
            newStats
          )
        );
      } catch (error) {
        console.error(
          "ADMIN SCANNER STATS SAVE ERROR:",
          error
        );
      }
    };
  /* ============================================================
     SUCCESSFUL SCAN
  ============================================================ */
  const recordSuccessfulScan =
    () => {
      setStats(prev => {
        const updated = {
          ...prev,
          successful:
            Number(
              prev.successful
            ) + 1
        };
        saveStats(updated);
        return updated;
      });
    };
  /* ============================================================
     INVALID SCAN
  ============================================================ */
  const recordInvalidScan =
    () => {
      setStats(prev => {
        const updated = {
          ...prev,
          invalid:
            Number(
              prev.invalid
            ) + 1
        };
        saveStats(updated);
        return updated;
      });
    };
  /* ============================================================
     CLEAR STATS
  ============================================================ */
  const clearStats =
    () => {
      const confirmed =
        window.confirm(
          "Clear the admin scanner statistics?"
        );
      if (!confirmed) {
        return;
      }
      const emptyStats = {
        successful: 0,
        invalid: 0
      };
      setStats(emptyStats);
      localStorage.setItem(
        "eventwaa_admin_scanner_stats",
        JSON.stringify(
          emptyStats
        )
      );
    };
  /* ============================================================
     RESET SCANNER
  ============================================================ */
  const scanNext =
    () => {
      scanLockRef.current =
        false;
      setResult("");
      setMessage(null);
      setChecking(false);
      setIsScanning(true);
    };
  /* ============================================================
     GET ADMIN TOKEN
     
     IMPORTANT:
     
     AdminLogin.jsx stores the token in either:
     
     localStorage:
         eventwaa_admin_token
     
     OR
     
     sessionStorage:
         eventwaa_admin_token
     
     depending on "Keep me signed in".
  ============================================================ */
  const getAdminToken = () => {
    return (
      localStorage.getItem(
        "eventwaa_admin_token"
      ) ||
      sessionStorage.getItem(
        "eventwaa_admin_token"
      )
    );
  };
  /* ============================================================
     VERIFY ENTRY
     
     IMPORTANT:
     
     ADMIN GLOBAL SCANNER:
     
     - Does NOT send eventId
     - Sends adminScan: true
     - Sends authenticated admin Bearer token
     
     Therefore the backend can verify tickets
     belonging to ANY EventWaa event.
  ============================================================ */
  const verifyEntry =
    async (code) => {
      if (
        !code ||
        scanLockRef.current
      ) {
        return;
      }
      /* ========================================================
         LOCK SCAN
      ======================================================== */
      scanLockRef.current =
        true;
      setChecking(true);
      setResult(code);
      setIsScanning(false);
      try {
        /* ======================================================
           GET ADMIN TOKEN
        ====================================================== */
        const adminToken =
          getAdminToken();
        /* ======================================================
           ADMIN AUTHENTICATION REQUIRED
        ====================================================== */
        if (!adminToken) {
          setMessage({
            success: false,
            text:
              "Admin authentication is missing. Please sign in again."
          });
          setChecking(false);
          setIsScanning(false);
          return;
        }
        /* ======================================================
           VERIFY ENTRY REQUEST
        ====================================================== */
        const response =
          await fetch(
            `${BACKEND_URL}/verify-entry/${encodeURIComponent(
              code
            )}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
                Authorization:
                  `Bearer ${adminToken}`
              },
              body:
                JSON.stringify({
                  /*
                   * IMPORTANT:
                   *
                   * Admin scanner is GLOBAL.
                   *
                   * We deliberately do NOT send eventId.
                   */
                  adminScan: true
                })
            }
          );
        /* ======================================================
           READ RESPONSE SAFELY
        ====================================================== */
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
          "ADMIN VERIFY ENTRY RESPONSE:",
          response.status,
          data
        );
        /* ======================================================
           SUCCESS
        ====================================================== */
        if (data.success) {
          recordSuccessfulScan();
          /* ====================================================
             PAID TICKET
          ==================================================== */
          if (
            data.type === "paid"
          ) {
            const ticket =
              data.ticket || {};
            setMessage({
              success: true,
              type: "paid",
              guest: {
                name:
                  ticket?.buyer?.name ||
                  "Unknown guest",
                email:
                  ticket?.buyer?.email ||
                  "Unknown email",
                event:
                  ticket?.eventTitle ||
                  "Unknown event",
                date:
                  ticket?.eventDate ||
                  "",
                time:
                  ticket?.eventTime ||
                  "",
                venue:
                  ticket?.eventVenue ||
                  "",
                city:
                  ticket?.eventCity ||
                  "",
                passType:
                  ticket?.ticketType ||
                  "Ticket",
                ticketId:
                  ticket?.ticketId ||
                  code,
                checkedInAt:
                  ticket?.checkedInAt ||
                  "Just now"
              }
            });
          }
          /* ====================================================
             FREE ATTENDANCE PASS
          ==================================================== */
          else {
            const attendee =
              data.attendee || {};
            setMessage({
              success: true,
              type: "free",
              guest: {
                name:
                  attendee?.name ||
                  "Unknown guest",
                email:
                  attendee?.email ||
                  "Unknown email",
                event:
                  attendee?.eventTitle ||
                  "Unknown event",
                date:
                  attendee?.eventDate ||
                  "",
                time:
                  attendee?.eventTime ||
                  "",
                venue:
                  attendee?.eventVenue ||
                  "",
                city:
                  attendee?.eventCity ||
                  "",
                passType:
                  "Free attendance pass",
                ticketId:
                  attendee?.ticketId ||
                  attendee?.passId ||
                  code,
                checkedInAt:
                  attendee?.checkedInAt ||
                  "Just now"
              }
            });
          }
          setIsScanning(false);
        }
        /* ======================================================
           INVALID
        ====================================================== */
        else {
          recordInvalidScan();
          setMessage({
            success: false,
            text:
              data.message ||
              "Ticket or pass could not be verified.",
            alreadyCheckedIn:
              data.alreadyCheckedIn ||
              false,
            refunded:
              data.refunded ||
              false,
            entryLimitReached:
              data.entryLimitReached ||
              false
          });
          setIsScanning(false);
        }
      } catch (error) {
        console.error(
          "ADMIN SCAN ERROR:",
          error
        );
        recordInvalidScan();
        setMessage({
          success: false,
          text:
            error.message ||
            "Unable to contact the EventWaa server. Please try again."
        });
        setIsScanning(false);
      } finally {
        setChecking(false);
      }
    };
  /* ============================================================
     QR SCAN HANDLER
     
     IMPORTANT:
     
     handleScan does NOT control the scan lock.
     
     verifyEntry() controls it.
  ============================================================ */
  const handleScan = (codes) => {
    if (
      !isScanning ||
      checking ||
      scanLockRef.current
    ) {
      return;
    }
    if (
      !codes ||
      codes.length === 0
    ) {
      return;
    }
    const rawValue =
      codes[0]?.rawValue;
    if (!rawValue) {
      return;
    }
    const cleanCode =
      String(rawValue).trim();
    if (!cleanCode) {
      return;
    }
    verifyEntry(cleanCode);
  };
  /* ============================================================
     BACK
  ============================================================ */
  const goBack =
    () => {
      navigate(
        "/admin"
      );
    };
  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="admin-scanner-page">
      {/* ======================================================
          TOP BAR
      ====================================================== */}
      <div className="admin-scanner-topbar">
        <button
          type="button"
          className="admin-scanner-back-btn"
          onClick={goBack}
        >
          <FiArrowLeft />
          <span>
            Back to Admin
          </span>
        </button>
        <span className="admin-scanner-mode">
          ADMIN GLOBAL SCANNER
        </span>
      </div>
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="admin-scanner-header">
        <div className="admin-scanner-brand">
          {settings?.platformLogo ? (
            <img
              src={
                settings.platformLogo
              }
              alt={
                settings.platformName ||
                "EventWaa"
              }
              className="admin-scanner-logo"
            />
          ) : (
            <div className="admin-scanner-logo-fallback">
              EW
            </div>
          )}
          <span className="admin-scanner-platform-name">
            {settings?.platformName ||
              "EventWaa"}
          </span>
        </div>
        <div className="admin-scanner-heading-row">
          <div>
            <span className="admin-scanner-eyebrow">
              ADMIN EVENT TOOLS
            </span>
            <h1>
              Event Scanner
            </h1>
            <p>
              Scan attendee tickets and free
              event passes from any event on
              the EventWaa platform.
            </p>
          </div>
          <div className="admin-scanner-camera-icon">
            <FiCamera />
          </div>
        </div>
      </div>
      {/* ======================================================
          STATS
      ====================================================== */}
      <div className="admin-scanner-stats">
        <div className="admin-scanner-stat">
          <div className="admin-scanner-stat-icon success">
            <FiCheckCircle />
          </div>
          <div>
            <strong>
              {stats.successful}
            </strong>
            <p>
              Successful entries
            </p>
          </div>
        </div>
        <div className="admin-scanner-stat">
          <div className="admin-scanner-stat-icon invalid">
            <FiXCircle />
          </div>
          <div>
            <strong>
              {stats.invalid}
            </strong>
            <p>
              Invalid scans
            </p>
          </div>
        </div>
      </div>
      {/* ======================================================
          CLEAR STATS
      ====================================================== */}
      <div className="admin-scanner-stats-controls">
        <button
          type="button"
          className="admin-scanner-clear-btn"
          onClick={clearStats}
        >
          <FiTrash2 />
          <span>
            Clear scan statistics
          </span>
        </button>
      </div>
      {/* ======================================================
          SCANNER
      ====================================================== */}
      {isScanning && (
        <div className="admin-scanner-container">
          <div className="scanner-instruction">
            <h2>
              Scan QR Code
            </h2>
            <p>
              Position the attendee's QR code
              inside the scanner.
            </p>
          </div>
          <div className="admin-scanner-box">
            <Scanner
              onScan={
                handleScan
              }
              onError={
                error =>
                  console.log(
                    "ADMIN QR SCANNER ERROR:",
                    error
                  )
              }
            />
          </div>
          {checking && (
            <div className="scanner-checking">
              <div className="checking-spinner"></div>
              <p>
                Verifying entry...
              </p>
            </div>
          )}
        </div>
      )}
      {/* ======================================================
          RESULT
      ====================================================== */}
      {result && message && (
        <div className="admin-scan-result">
          {/* ==================================================
              SCANNED CODE
          ================================================== */}
          <div className="scanned-code">
            <span>
              Scanned ticket / pass ID
            </span>
            <strong>
              {result}
            </strong>
          </div>
          {/* ==================================================
              VALID
          ================================================== */}
          {message.success ? (
            <div className="admin-valid-result">
              <div className="result-icon success">
                <FiCheckCircle />
              </div>
              <h2>
                VALID ENTRY
              </h2>
              <p className="result-subtitle">
                {message.type === "free"
                  ? "Free attendance pass"
                  : "Paid event ticket"}
              </p>
              <div className="guest-details">
                <div>
                  <span>
                    <FiUser />
                    Guest
                  </span>
                  <strong>
                    {
                      message.guest.name
                    }
                  </strong>
                </div>
                <div>
                  <span>
                    <FiMail />
                    Email
                  </span>
                  <strong>
                    {
                      message.guest.email
                    }
                  </strong>
                </div>
                <div>
                  <span>
                    <FiCalendar />
                    Event
                  </span>
                  <strong>
                    {
                      message.guest.event
                    }
                  </strong>
                </div>
                <div>
                  <span>
                    <FiTag />
                    Ticket / Pass
                  </span>
                  <strong>
                    {
                      message.guest.passType
                    }
                  </strong>
                </div>
                <div>
                  <span>
                    <FiHash />
                    Ticket ID
                  </span>
                  <strong>
                    {
                      message.guest.ticketId
                    }
                  </strong>
                </div>
                {message.guest.date && (
                  <div>
                    <span>
                      <FiCalendar />
                      Event date
                    </span>
                    <strong>
                      {
                        message.guest.date
                      }
                    </strong>
                  </div>
                )}
                {message.guest.venue && (
                  <div>
                    <span>
                      <FiMapPin />
                      Venue
                    </span>
                    <strong>
                      {
                        message.guest.venue
                      }
                    </strong>
                  </div>
                )}
                <div>
                  <span>
                    <FiClock />
                    Checked in
                  </span>
                  <strong>
                    {
                      message.guest.checkedInAt ||
                      "Just now"
                    }
                  </strong>
                </div>
              </div>
              <div className="admin-entry-accepted">
                <FiCheckCircle />
                <span>
                  Entry accepted
                </span>
              </div>
            </div>
          ) : (
            /* =================================================
               INVALID
            ================================================= */
            <div className="admin-invalid-result">
              <div className="result-icon invalid">
                <FiXCircle />
              </div>
              <h2>
                ENTRY NOT ACCEPTED
              </h2>
              <p>
                {
                  message.text
                }
              </p>
              {message.alreadyCheckedIn && (
                <div className="admin-warning-box">
                  This ticket or pass has already
                  been used.
                </div>
              )}
              {message.refunded && (
                <div className="admin-warning-box">
                  This ticket has been refunded
                  and is no longer valid.
                </div>
              )}
              {message.entryLimitReached && (
                <div className="admin-warning-box">
                  This ticket or pass has reached
                  its maximum entry limit.
                </div>
              )}
            </div>
          )}
          {/* ==================================================
              ACTIONS
          ================================================== */}
          <div className="admin-scanner-result-actions">
            <button
              type="button"
              className="admin-scan-next-btn"
              onClick={scanNext}
            >
              <FiRefreshCw />
              <span>
                Scan Next
              </span>
            </button>
            <button
              type="button"
              className="admin-scan-back-result-btn"
              onClick={goBack}
            >
              <FiArrowLeft />
              <span>
                Back to Admin
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminTicketScanner;