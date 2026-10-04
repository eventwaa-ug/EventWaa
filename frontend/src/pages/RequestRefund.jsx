import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiInfo,
  FiMapPin,
  FiRefreshCw,
  FiTag,
  FiUser,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../styles/RequestRefund.css";
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL;
function RequestRefund() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // ============================================================
  // REFUND TARGET
  //
  // New Tickets.jsx sends:
  // state: { ticket: booking }
  //
  // Keep booking fallback for compatibility.
  // ============================================================
  const ticket =
    location.state?.ticket ||
    location.state?.booking ||
    null;
  const [reason, setReason] =
    useState("");
  const [details, setDetails] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState("");
  // ============================================================
  // NO TICKET / BOOKING
  // ============================================================
  if (!ticket) {
    return (
      <div className="refund-page">
        <div className="refund-empty">
          <div className="refund-empty-icon">
          </div>
          <h2>
            Ticket not found
          </h2>
          <p>
            We couldn't find this ticket.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate("/tickets")
            }
          >
            Back to My Tickets
          </button>
        </div>
      </div>
    );
  }
  // ============================================================
  // EVENT DATE CHECK
  // ============================================================
  const eventDate =
    ticket.eventDate ||
    ticket.date;
  let eventHasPassed = false;
  if (eventDate) {
    const today = new Date();
    const eventDay =
      new Date(eventDate);
    if (
      !Number.isNaN(
        eventDay.getTime()
      )
    ) {
      eventHasPassed =
        eventDay < today;
    }
  }
  // ============================================================
  // TICKET / BOOKING STATUS
  // ============================================================
  const ticketStatus =
    String(
      ticket.status ||
        ticket.refundStatus ||
        "confirmed"
    ).toLowerCase();
  const refundStatus =
    String(
      ticket.refundStatus ||
        ""
    ).toLowerCase();
  const alreadyRefunded =
    ticketStatus === "refunded" ||
    refundStatus === "refunded";
  const pendingStatuses = [
    "refund_pending",
    "pending_refund",
    "pending",
    "provider_pending",
    "manual_review",
  ];
  const refundPending =
    pendingStatuses.includes(
      ticketStatus
    ) ||
    pendingStatuses.includes(
      refundStatus
    );
  // ============================================================
  // BOOKING ID
  //
  // Prefer the actual parent booking ID.
  //
  // Do NOT automatically use ticketId as bookingId.
  // ============================================================
  const bookingId =
    ticket.bookingId ||
    ticket.id ||
    ticket._id ||
    null;
  // ============================================================
  // AMOUNT
  // ============================================================
  const amountPaid = Number(
    ticket.customerTotal ??
      ticket.totalPrice ??
      ticket.amount ??
      ticket.price ??
      0
  );
  // ============================================================
  // SUBMIT REFUND
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!reason) {
      setError(
        "Please select a refund reason."
      );
      return;
    }
    if (!user?.id && !user?.email) {
      setError(
        "Please log in before requesting a refund."
      );
      return;
    }
    if (!bookingId) {
      setError(
        "Booking information is missing for this ticket."
      );
      return;
    }
    try {
      setSubmitting(true);
      const response =
        await fetch(
          `${BACKEND_URL}/refunds`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${localStorage.getItem("eventwaa_user_token") || ""}`,
            },
            body: JSON.stringify({
              bookingId,
              reason,
              details,
            }),
          }
        );
      const data =
        await response
          .json()
          .catch(() => ({}));
      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data?.message ||
            "Unable to submit refund request."
        );
      }
      alert(
        "Your refund request has been submitted successfully."
      );
      navigate("/tickets");
    } catch (error) {
      console.error(
        "REFUND REQUEST ERROR:",
        error
      );
      setError(
        error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };
  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="refund-page">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <header className="refund-header">
        <button
          className="refund-back-button"
          onClick={() =>
            navigate(-1)
          }
          type="button"
          disabled={submitting}
          aria-label="Go back"
        >
          X
        </button>
        <div className="refund-header-content">
          <div className="refund-eyebrow">
            <FiRefreshCw />
            Refund
          </div>
          <h1>
            Request a refund
          </h1>
          <p>
            Review your ticket and submit your request.
          </p>
        </div>
      </header>
      {/* ======================================================
          CONTENT
      ====================================================== */}
      <main className="refund-container">
        {/* ====================================================
            TICKET INFORMATION
        ==================================================== */}
        <section className="refund-ticket-card">
          <div className="refund-ticket-icon">
          </div>
          <div className="refund-ticket-info">
            <span className="refund-ticket-label">
              EVENT
            </span>
            <h2>
              {ticket.eventTitle ||
                ticket.title ||
                "Event"}
            </h2>
            <div className="refund-ticket-details">
              <div className="refund-detail">
                <FiCalendar />
                <span>
                  {ticket.eventDate ||
                    ticket.date ||
                    "Date unavailable"}
                </span>
              </div>
              <div className="refund-detail">
                <FiMapPin />
                <span>
                  {ticket.venue ||
                    ticket.eventVenue ||
                    ticket.location ||
                    "Venue unavailable"}
                </span>
              </div>
              <div className="refund-detail">
                <FiTag />
                <span>
                  {ticket.ticketType ||
                    "Regular"}
                </span>
              </div>
              <div className="refund-detail">
                <FiUser />
                <span>
                  {ticket.quantity ||
                    ticket.tickets?.length ||
                    1}{" "}
                  ticket(s)
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* ====================================================
            STATUS
        ==================================================== */}
        {alreadyRefunded && (
          <div className="refund-status refund-status-success">
            <div className="refund-status-icon">
              <FiCheckCircle />
            </div>
            <div>
              <strong>
                Already refunded
              </strong>
              <span>
                This ticket has already been refunded.
              </span>
            </div>
          </div>
        )}
        {refundPending && (
          <div className="refund-status refund-status-pending">
            <div className="refund-status-icon">
              <FiClock />
            </div>
            <div>
              <strong>
                Refund pending
              </strong>
              <span>
                Your refund request is being processed.
              </span>
            </div>
          </div>
        )}
        {eventHasPassed &&
          !alreadyRefunded &&
          !refundPending && (
            <div className="refund-status refund-status-warning">
              <div className="refund-status-icon">
                <FiAlertCircle />
              </div>
              <div>
                <strong>
                  Refund unavailable
                </strong>
                <span>
                  This event has already taken place.
                </span>
              </div>
            </div>
          )}
        {/* ====================================================
            FORM
        ==================================================== */}
        {!alreadyRefunded &&
          !refundPending &&
          !eventHasPassed && (
            <form
              className="refund-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="refund-form-header">
                <div>
                  <span className="refund-section-label">
                    REFUND REQUEST
                  </span>
                  <h2>
                    Tell us why
                  </h2>
                </div>
                <div className="refund-form-icon">
                  <FiRefreshCw />
                </div>
              </div>
              {/* =================================================
                  REASON
              ================================================= */}
              <div className="refund-field">
                <label htmlFor="refund-reason">
                  Reason
                </label>
                <select
                  id="refund-reason"
                  value={reason}
                  onChange={(e) =>
                    setReason(
                      e.target.value
                    )
                  }
                  disabled={submitting}
                >
                  <option value="">
                    Select a reason
                  </option>
                  <option value="Cannot attend">
                    I can no longer attend
                  </option>
                  <option value="Event changed">
                    Event details changed
                  </option>
                  <option value="Event cancelled">
                    Event was cancelled
                  </option>
                  <option value="Duplicate purchase">
                    I bought the ticket twice
                  </option>
                  <option value="Purchased by mistake">
                    Purchased by mistake
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>
              {/* =================================================
                  DETAILS
              ================================================= */}
              <div className="refund-field">
                <label htmlFor="refund-details">
                  <span>
                    Details
                  </span>
                  <small>
                    Optional
                  </small>
                </label>
                <textarea
                  id="refund-details"
                  value={details}
                  onChange={(e) =>
                    setDetails(
                      e.target.value
                    )
                  }
                  placeholder="Add any extra details..."
                  rows="4"
                  disabled={submitting}
                />
              </div>
              {/* =================================================
                  REFUND AMOUNT
              ================================================= */}
              <div className="refund-amount-card">
                <div className="refund-amount-top">
                  <div className="refund-amount-icon">
                    <FiCreditCard />
                  </div>
                  <div>
                    <span>
                      Amount paid
                    </span>
                    <strong>
                      UGX{" "}
                      {amountPaid.toLocaleString()}
                    </strong>
                  </div>
                </div>
                <div className="refund-amount-note">
                  <FiInfo />
                  <span>
                    Final refund amount is determined after review.
                  </span>
                </div>
              </div>
              {/* =================================================
                  ERROR
              ================================================= */}
              {error && (
                <div className="refund-error">
                  <FiAlertCircle />
                  <span>
                    {error}
                  </span>
                </div>
              )}
              {/* =================================================
                  ACTIONS
              ================================================= */}
              <div className="refund-actions">
                <button
                  type="button"
                  className="refund-cancel-btn"
                  onClick={() =>
                    navigate(-1)
                  }
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="refund-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className="refund-spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw />
                      Submit request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
      </main>
    </div>
  );
}
export default RequestRefund;