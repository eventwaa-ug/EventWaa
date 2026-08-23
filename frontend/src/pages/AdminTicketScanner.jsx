import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import "./AdminTicketScanner.css";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";

const API_BASE_URL = "http://localhost:5000";

function AdminTicketScanner() {

  const { settings } = usePlatformSettings();

  // ============================================================
  // LOAD SAVED SCANNER STATS
  // ============================================================

  const getSavedStats = () => {

    try {

      const saved =
        localStorage.getItem(
          "eventwaa_admin_scanner_stats"
        );

      if (!saved) {
        return {
          successful: 0,
          invalid: 0,
        };
      }

      const parsed =
        JSON.parse(saved);

      return {
        successful:
          Number(parsed.successful) || 0,

        invalid:
          Number(parsed.invalid) || 0,
      };

    } catch (error) {

      console.error(
        "SCANNER STATS LOAD ERROR:",
        error
      );

      return {
        successful: 0,
        invalid: 0,
      };

    }

  };


  // ============================================================
  // STATE
  // ============================================================

  const [isScanning, setIsScanning] =
    useState(true);

  const [result, setResult] =
    useState("");

  const [message, setMessage] =
    useState(null);

  const [checking, setChecking] =
    useState(false);

  const [stats, setStats] =
    useState(getSavedStats);


  // ============================================================
  // SAVE STATS
  // ============================================================

  const saveStats = (newStats) => {

    try {

      localStorage.setItem(
        "eventwaa_admin_scanner_stats",
        JSON.stringify(newStats)
      );

    } catch (error) {

      console.error(
        "SCANNER STATS SAVE ERROR:",
        error
      );

    }

  };


  // ============================================================
  // UPDATE SUCCESSFUL COUNT
  // ============================================================

  const recordSuccessfulScan = () => {

    setStats((prev) => {

      const updated = {
        ...prev,
        successful:
          prev.successful + 1,
      };

      saveStats(updated);

      return updated;

    });

  };


  // ============================================================
  // UPDATE INVALID COUNT
  // ============================================================

  const recordInvalidScan = () => {

    setStats((prev) => {

      const updated = {
        ...prev,
        invalid:
          prev.invalid + 1,
      };

      saveStats(updated);

      return updated;

    });

  };


  // ============================================================
  // VERIFY TICKET / FREE PASS
  // ============================================================

  const verifyEntry = async (code) => {

    if (!code || checking) {
      return;
    }

    setChecking(true);
    setResult(code);

    try {

      const response =
        await fetch(
          `${API_BASE_URL}/verify-entry/${encodeURIComponent(code)}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              adminScan: true,
            }),
          }
        );


      const data =
        await response.json();


      // ========================================================
      // SUCCESS
      // ========================================================

      if (data.success) {

        recordSuccessfulScan();


        const currentCount =
          Number(
            data.checkInCount || 0
          );


        const currentLimit =
          Number(
            data.checkInLimit || 3
          );


        if (data.type === "paid") {

          setMessage({

            success: true,

            type: "paid",

            guest: {

              name:
                data.ticket?.buyer?.name ||
                "Unknown",

              email:
                data.ticket?.buyer?.email ||
                "Unknown",

              event:
                data.ticket?.eventTitle ||
                "Unknown event",

              passType:
                data.ticket?.ticketType ||
                "Ticket",

              time:
                data.ticket?.checkedInAt ||
                "",

              entryNumber:
                currentCount,

              checkInLimit:
                currentLimit,

              remainingEntries:
                Math.max(
                  currentLimit -
                    currentCount,
                  0
                ),
            },
          });

        } else {

          setMessage({

            success: true,

            type: "free",

            guest: {

              name:
                data.attendee?.name ||
                "Unknown",

              email:
                data.attendee?.email ||
                "Unknown",

              event:
                data.attendee?.eventTitle ||
                "Unknown event",

              passType:
                "Free attendance pass",

              time:
                data.attendee?.checkedInAt ||
                "",

              entryNumber:
                currentCount,

              checkInLimit:
                currentLimit,

              remainingEntries:
                Math.max(
                  currentLimit -
                    currentCount,
                  0
                ),
            },
          });

        }


        setIsScanning(false);

      }


      // ========================================================
      // INVALID
      // ========================================================

      else {

        recordInvalidScan();


        setMessage({

          success: false,

          text:
            data.message ||
            "Ticket or pass could not be verified.",

          entryLimitReached:
            data.entryLimitReached ||
            false,

          checkInCount:
            data.checkInCount || 0,

          checkInLimit:
            data.checkInLimit || 3,
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
          "Unable to contact the EventWaa server. Please try again.",

      });


      setIsScanning(false);

    } finally {

      setChecking(false);

    }

  };


  // ============================================================
  // RESET / SCAN NEXT
  // ============================================================

  const scanNext = () => {

    setResult("");

    setMessage(null);

    setIsScanning(true);

  };


  // ============================================================
  // CLEAR DAILY STATS
  // ============================================================

  const clearStats = () => {

    const confirmed =
      window.confirm(
        "Clear the scanner statistics?"
      );

    if (!confirmed) {
      return;
    }


    const emptyStats = {
      successful: 0,
      invalid: 0,
    };


    setStats(emptyStats);


    localStorage.setItem(
      "eventwaa_admin_scanner_stats",
      JSON.stringify(emptyStats)
    );

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="admin-scanner-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-scanner-header">


        {/* PLATFORM BRAND */}
        <div className="admin-scanner-brand">

          {settings.platformLogo ? (

            <img
              src={settings.platformLogo}
              alt={
                settings.platformName ||
                "EventWaa"
              }
              className="admin-scanner-logo"
            />

          ) : (

            <h2 className="admin-scanner-platform-name">

              {settings.platformName ||
                "EventWaa"}

            </h2>

          )}

        </div>


        <span className="admin-scanner-eyebrow">
          ADMIN EVENT TOOLS
        </span>


        <h1>
          📷 Event Scanner
        </h1>


        <p>
          Scan attendee tickets and free event
          passes at the entrance.
        </p>

      </div>


      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="admin-scanner-stats">


        <div className="admin-scanner-stat">

          <span>
            ✅
          </span>


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

          <span>
            ❌
          </span>


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
          onClick={clearStats}
          className="admin-scanner-clear-btn"
        >
          Clear scan statistics
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

              onScan={(codes) => {

                if (
                  !codes ||
                  codes.length === 0 ||
                  checking
                ) {
                  return;
                }


                const scannedCode =
                  codes[0]?.rawValue;


                if (!scannedCode) {
                  return;
                }


                verifyEntry(
                  scannedCode
                );

              }}


              onError={(error) =>
                console.log(
                  "Scanner error:",
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


          {/* SCANNED CODE */}

          <div className="scanned-code">

            <span>
              Scanned code
            </span>

            <strong>
              {result}
            </strong>

          </div>


          {/* ==================================================
              SUCCESS
          ================================================== */}

          {message.success ? (

            <div className="admin-valid-result">


              <div className="result-icon">
                ✓
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
                    👤 Guest
                  </span>

                  <strong>
                    {message.guest.name}
                  </strong>

                </div>


                <div>

                  <span>
                    📧 Email
                  </span>

                  <strong>
                    {message.guest.email}
                  </strong>

                </div>


                <div>

                  <span>
                    🎉 Event
                  </span>

                  <strong>
                    {message.guest.event}
                  </strong>

                </div>


                <div>

                  <span>
                    🎫 Ticket / Pass
                  </span>

                  <strong>
                    {message.guest.passType}
                  </strong>

                </div>


                <div>

                  <span>
                    🔢 Entry
                  </span>

                  <strong>

                    {message.guest.entryNumber}

                    {" / "}

                    {message.guest.checkInLimit}

                  </strong>

                </div>


                <div>

                  <span>
                    ⏳ Remaining entries
                  </span>

                  <strong>
                    {message.guest.remainingEntries}
                  </strong>

                </div>


                <div>

                  <span>
                    ⏰ Checked in
                  </span>

                  <strong>
                    {message.guest.time ||
                      "Just now"}
                  </strong>

                </div>

              </div>

            </div>

          ) : (

            /* =================================================
               INVALID
            ================================================= */

            <div className="admin-invalid-result">


              <div className="result-icon">
                !
              </div>


              <h2>
                ENTRY NOT ACCEPTED
              </h2>


              <p>
                {message.text}
              </p>


              {message.entryLimitReached && (

                <div className="limit-warning">

                  This ticket or pass has already
                  reached its maximum entry limit.

                </div>

              )}

            </div>

          )}


          {/* ==================================================
              SCAN NEXT
          ================================================= */}

          <button
            className="admin-scan-next-btn"
            onClick={scanNext}
          >
            🔄 Scan Next
          </button>


        </div>

      )}

    </div>

  );

}


export default AdminTicketScanner;