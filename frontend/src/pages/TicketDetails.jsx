import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { usePlatformSettings } from "../context/PlatformSettingsContext";
import "../styles/TicketDetails.css";

const API_URL = "http://localhost:5000";

function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const { settings } = usePlatformSettings();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD TICKET
  // ============================================================

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/bookings`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load ticket."
          );
        }

        const data = await response.json();

        const foundTicket = data.find(
          (booking) =>
            String(booking.ticketId) ===
            String(ticketId)
        );

        if (!foundTicket) {
          setError("Ticket not found.");
          setTicket(null);
          return;
        }

        setTicket(foundTicket);
      } catch (error) {
        console.error(
          "Ticket loading error:",
          error
        );

        setError(
          "Unable to load this ticket."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  // ============================================================
  // PLATFORM LOGO URL
  // ============================================================

  const getLogoUrl = () => {
    const logo = settings?.platformLogo;

    if (!logo) {
      return "";
    }

    const imagePath = String(logo).trim();

    if (!imagePath) {
      return "";
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return `${API_URL}${imagePath}`;
    }

    return `${API_URL}/${imagePath}`;
  };

  const platformLogo = getLogoUrl();

  const platformName =
    settings?.platformName ||
    "EventWaa";

  // ============================================================
  // DOWNLOAD TICKET
  // ============================================================

  const downloadTicket = () => {
    window.print();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="ticket-state">
        <div className="ticket-loader"></div>

        <h2>
          Loading your ticket...
        </h2>

        <p>
          Please wait while EventWaa
          retrieves your ticket.
        </p>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !ticket) {
    return (
      <div className="ticket-state">
        <div className="ticket-state-icon">
          🎟️
        </div>

        <h2>
          Ticket not found
        </h2>

        <p>
          {error ||
            "We couldn't find this ticket."}
        </p>

        <button
          className="back-ticket-btn"
          onClick={() =>
            navigate("/profile")
          }
        >
          Back to Profile
        </button>
      </div>
    );
  }

  // ============================================================
  // REFUND STATUS
  // ============================================================

  const isRefunded =
    ticket.refundStatus === "refunded";

  const isPendingRefund =
    ticket.refundStatus === "pending";

  // ============================================================
  // QR VALUE
  // ============================================================

  const qrValue =
    String(ticket.ticketId);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="ticket-page">

      <div className="ticket-wrapper">

        {/* ======================================================
            TOP ACTIONS
        ====================================================== */}

        <div className="ticket-actions">

          <button
            className="back-btn"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Back
          </button>

          <button
            className="download-btn"
            onClick={downloadTicket}
          >
            📥 Download Ticket
          </button>

        </div>


        {/* ======================================================
            TICKET
        ====================================================== */}

        <div
          className={`ticket-card ${
            isRefunded
              ? "refunded-ticket"
              : ""
          }`}
          id="eventwaa-ticket"
        >

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="ticket-header">

            <div className="platform-brand">

              {platformLogo ? (

                <img
                  src={platformLogo}
                  alt={platformName}
                  className="platform-logo"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />

              ) : (

                <div className="platform-logo-fallback">
                  EW
                </div>

              )}

              <div className="platform-name">
                {platformName}
              </div>

            </div>


            <div className="ticket-label">
              EVENT TICKET
            </div>

          </div>


          {/* ====================================================
              EVENT POSTER
          ==================================================== */}

          <div className="ticket-event">

            <div className="ticket-event-info">

              <span className="ticket-eyebrow">
                YOUR EVENT
              </span>

              <h1>
                {ticket.eventTitle ||
                  "EventWaa Event"}
              </h1>

              <div className="ticket-meta">

                {ticket.eventVenue && (
                  <span>
                    📍 {ticket.eventVenue}
                  </span>
                )}

                {ticket.eventDate && (
                  <span>
                    📅 {ticket.eventDate}
                  </span>
                )}

              </div>

            </div>

          </div>


          {/* ====================================================
              PERFORATION
          ==================================================== */}

          <div className="ticket-perforation">

            <span></span>

            <div></div>

            <span></span>

          </div>


          {/* ====================================================
              TICKET BODY
          ==================================================== */}

          <div className="ticket-body">

            {/* LEFT SIDE */}

            <div className="ticket-information">

              <div className="ticket-info-grid">

                <div className="ticket-info-item">

                  <span>
                    ATTENDEE
                  </span>

                  <strong>
                    {ticket.buyer?.name ||
                      "Guest"}
                  </strong>

                </div>


                <div className="ticket-info-item">

                  <span>
                    TICKET TYPE
                  </span>

                  <strong>
                    {ticket.ticketType ||
                      "Regular"}
                  </strong>

                </div>


                <div className="ticket-info-item">

                  <span>
                    QUANTITY
                  </span>

                  <strong>
                    {ticket.quantity ||
                      1}
                  </strong>

                </div>


                <div className="ticket-info-item">

                  <span>
                    AMOUNT PAID
                  </span>

                  <strong>
                    UGX{" "}
                    {Number(
                      ticket.totalPrice ||
                        0
                    ).toLocaleString()}
                  </strong>

                </div>

              </div>


              {/* EMAIL */}

              <div className="ticket-email">

                <span>
                  EMAIL
                </span>

                <strong>
                  {ticket.buyer?.email ||
                    "Not available"}
                </strong>

              </div>


              {/* TICKET ID */}

              <div className="ticket-id-box">

                <span>
                  TICKET ID
                </span>

                <strong>
                  {ticket.ticketId}
                </strong>

              </div>


              {/* STATUS */}

              <div className="ticket-status">

                {isRefunded ? (

                  <div className="status refunded">

                    <span>
                      ❌
                    </span>

                    <div>
                      <strong>
                        Ticket Refunded
                      </strong>

                      <p>
                        This ticket is no longer
                        valid for event entry.
                      </p>
                    </div>

                  </div>

                ) : isPendingRefund ? (

                  <div className="status pending">

                    <span>
                      ⏳
                    </span>

                    <div>
                      <strong>
                        Refund Pending
                      </strong>

                      <p>
                        Your refund request is
                        awaiting approval.
                      </p>
                    </div>

                  </div>

                ) : (

                  <div className="status valid">

                    <span>
                      ✓
                    </span>

                    <div>
                      <strong>
                        Valid Ticket
                      </strong>

                      <p>
                        Present this QR code at
                        the event entrance.
                      </p>
                    </div>

                  </div>

                )}

              </div>

            </div>


            {/* ==================================================
                QR CODE
                ================================================== */}

            <div className="ticket-qr-section">

              {isRefunded ? (

                <div className="qr-disabled">

                  <span>
                    ❌
                  </span>

                  <p>
                    QR Code<br />
                    Invalid
                  </p>

                </div>

              ) : (

                <>

                  <div className="qr-container">

                    <QRCodeCanvas
                      value={qrValue}
                      size={190}
                      bgColor="#ffffff"
                      fgColor="#111827"
                      level="H"
                      includeMargin={true}
                    />

                  </div>

                  <p className="qr-caption">
                    Scan at entrance
                  </p>

                </>

              )}

            </div>

          </div>


          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="ticket-footer">

            <div>
              <strong>
                {platformName}
              </strong>

              <span>
                Discover. Book. Experience.
              </span>
            </div>

            <span>
              Ticket #{ticket.ticketId}
            </span>

          </div>

        </div>


        {/* ======================================================
            DOWNLOAD NOTE
        ====================================================== */}

        <p className="ticket-download-note">

          📄 Use <strong>Download Ticket</strong>{" "}
          to save or print your EventWaa ticket.

        </p>

      </div>

    </div>
  );
}

export default TicketDetails;