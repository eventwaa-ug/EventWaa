import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  Ticket,
  User,
  Mail,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  History,
  AlertTriangle,
} from "lucide-react";
import "./TicketLookup.css";
const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000";
function TicketLookup() {
  const navigate = useNavigate();
  // ============================================================
  // SEARCH
  // ============================================================
  const [entryId, setEntryId] =
    useState("");
  const [ticket, setTicket] =
    useState(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  // ============================================================
  // LOOKUP TICKET / PASS
  // ============================================================
  const handleLookup = async (event) => {
    event.preventDefault();
    setError("");
    setTicket(null);
    const cleanId =
      entryId.trim();
    if (!cleanId) {
      setError(
        "Please enter a ticket or pass ID."
      );
      return;
    }
    try {
      setLoading(true);
      const token =
        localStorage.getItem(
          "eventwaa_team_token"
        );
      const response =
        await fetch(
          `${BACKEND_URL}/team/ticket-lookup/${encodeURIComponent(
            cleanId
          )}`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`
                  }
                : {})
            }
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
        "TEAM TICKET LOOKUP:",
        response.status,
        data
      );
      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
          "Ticket or pass could not be found."
        );
        return;
      }
      setTicket(data);
    } catch (lookupError) {
      console.error(
        "TEAM TICKET LOOKUP ERROR:",
        lookupError
      );
      setError(
        lookupError.message ||
        "Unable to connect to the EventWaa server."
      );
    } finally {
      setLoading(false);
    }
  };
  // ============================================================
  // CLEAR SEARCH
  // ============================================================
  const clearLookup = () => {
    setEntryId("");
    setTicket(null);
    setError("");
  };
  // ============================================================
  // FORMAT DATE / TIME
  // ============================================================
  const formatDateTime = (value) => {
    if (!value) {
      return "Not available";
    }
    const date =
      new Date(value);
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }
    return date.toLocaleString();
  };
  // ============================================================
  // GET TICKET DATA
  // ============================================================
  const ticketData =
    ticket?.ticket || {};
  const buyer =
    ticketData?.buyer || {};
  const history =
    Array.isArray(
      ticketData?.checkInHistory
    )
      ? ticketData.checkInHistory
      : [];
  const checkInCount =
    Number(
      ticketData?.checkInCount || 0
    );
  const checkInLimit =
    Number(
      ticketData?.checkInLimit || 3
    );
  const remainingEntries =
    Math.max(
      Number(
        ticketData?.remainingEntries ??
        checkInLimit -
        checkInCount
      ),
      0
    );
  const isValid =
    ticket?.valid === true;
  const isRefunded =
    String(
      ticketData?.refundStatus ||
      ""
    ).toLowerCase() ===
    "refunded";
  const limitReached =
    checkInCount >=
    checkInLimit;
  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="ticket-lookup-page">
      {/* ======================================================
          TOP BAR
      ====================================================== */}
      <div className="ticket-lookup-topbar">
        <button
          type="button"
          className="ticket-lookup-back-btn"
          onClick={() =>
            navigate(
              "/admin/team-dashboard"
            )
          }
        >
          <ArrowLeft size={19} />
          <span>
            Team Dashboard
          </span>
        </button>
        <div className="ticket-lookup-topbar-title">
          <ShieldCheck size={19} />
          <span>
            TEAM PORTAL
          </span>
        </div>
      </div>
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="ticket-lookup-header">
        <div className="ticket-lookup-header-icon">
          <Search size={30} />
        </div>
        <div>
          <h1>
            Ticket Lookup
          </h1>
          <p>
            Search for a ticket or free attendance
            pass without checking the guest in.
          </p>
        </div>
      </div>
      {/* ======================================================
          SEARCH CARD
      ====================================================== */}
      <section className="ticket-lookup-search-card">
        <div className="ticket-lookup-search-heading">
          <div>
            <h2>
              Find Ticket / Pass
            </h2>
            <p>
              Enter the Ticket ID or Pass ID shown
              on the attendee's ticket.
            </p>
          </div>
          <Ticket
            size={28}
            className="ticket-lookup-search-icon"
          />
        </div>
        <form
          onSubmit={handleLookup}
          className="ticket-lookup-form"
        >
          <div className="ticket-lookup-input-wrapper">
            <Search size={21} />
            <input
              type="text"
              value={entryId}
              onChange={(event) =>
                setEntryId(
                  event.target.value
                )
              }
              placeholder="e.g. EW-123456 or FREE-123456"
              autoComplete="off"
              disabled={loading}
              spellCheck="false"
            />
          </div>
          <button
            type="submit"
            className="ticket-lookup-search-btn"
            disabled={loading}
          >
            <Search size={19} />
            {loading
              ? "Searching..."
              : "Search Ticket"}
          </button>
          {(ticket || error) && (
            <button
              type="button"
              className="ticket-lookup-clear-btn"
              onClick={clearLookup}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </form>
        {error && (
          <div
            className="ticket-lookup-error"
            role="alert"
          >
            <XCircle size={20} />
            <span>
              {error}
            </span>
          </div>
        )}
      </section>
      {/* ======================================================
          RESULT
      ====================================================== */}
      {ticket && (
        <section className="ticket-lookup-result">
          {/* ==================================================
              RESULT STATUS
          ================================================== */}
          <div
            className={
              `ticket-lookup-status ${
                isValid
                  ? "is-valid"
                  : "is-invalid"
              }`
            }
          >
            <div className="ticket-lookup-status-icon">
              {isValid ? (
                <CheckCircle size={30} />
              ) : (
                <XCircle size={30} />
              )}
            </div>
            <div>
              <span>
                {ticket.type === "free"
                  ? "FREE ATTENDANCE PASS"
                  : "PAID TICKET"}
              </span>
              <h2>
                {ticket.status ||
                  (isValid
                    ? "Valid"
                    : "Not Valid")}
              </h2>
            </div>
          </div>
          {/* ==================================================
              TICKET ID
          ================================================== */}
          <div className="ticket-lookup-id-card">
            <div>
              <span>
                Ticket / Pass ID
              </span>
              <strong>
                {ticket.entryId ||
                  ticketData.ticketId ||
                  entryId}
              </strong>
            </div>
            <div className="ticket-lookup-id-badge">
              {ticket.type === "free"
                ? "FREE PASS"
                : "PAID TICKET"}
            </div>
          </div>
          {/* ==================================================
              MAIN INFORMATION
          ================================================== */}
          <div className="ticket-lookup-grid">
            {/* =================================================
                GUEST
            ================================================= */}
            <div className="ticket-lookup-info-card">
              <div className="ticket-lookup-info-card-header">
                <div className="ticket-lookup-card-icon">
                  <User size={20} />
                </div>
                <h3>
                  Guest Information
                </h3>
              </div>
              <div className="ticket-lookup-info-row">
                <span>
                  Name
                </span>
                <strong>
                  {buyer.name ||
                    "Not available"}
                </strong>
              </div>
              <div className="ticket-lookup-info-row">
                <span>
                  Email
                </span>
                <strong className="ticket-lookup-email">
                  {buyer.email ||
                    "Not available"}
                </strong>
              </div>
            </div>
            {/* =================================================
                EVENT
            ================================================= */}
            <div className="ticket-lookup-info-card">
              <div className="ticket-lookup-info-card-header">
                <div className="ticket-lookup-card-icon">
                  <CalendarDays size={20} />
                </div>
                <h3>
                  Event Information
                </h3>
              </div>
              <div className="ticket-lookup-info-row">
                <span>
                  Event
                </span>
                <strong>
                  {ticketData.eventTitle ||
                    "Not available"}
                </strong>
              </div>
              <div className="ticket-lookup-info-row">
                <span>
                  Ticket Type
                </span>
                <strong>
                  {ticketData.ticketType ||
                    "Ticket"}
                </strong>
              </div>
            </div>
          </div>
          {/* ==================================================
              ENTRY SUMMARY
          ================================================== */}
          <div className="ticket-lookup-entry-card">
            <div className="ticket-lookup-entry-header">
              <div>
                <h3>
                  Entry Status
                </h3>
                <p>
                  This information is read-only.
                  Looking up a ticket does not check
                  the guest in.
                </p>
              </div>
              <History size={27} />
            </div>
            <div className="ticket-lookup-entry-stats">
              <div className="ticket-lookup-entry-stat">
                <span>
                  Entries Used
                </span>
                <strong>
                  {checkInCount}
                </strong>
              </div>
              <div className="ticket-lookup-entry-stat">
                <span>
                  Entry Limit
                </span>
                <strong>
                  {checkInLimit}
                </strong>
              </div>
              <div className="ticket-lookup-entry-stat">
                <span>
                  Remaining
                </span>
                <strong>
                  {remainingEntries}
                </strong>
              </div>
            </div>
            {/* =================================================
                PROGRESS
            ================================================= */}
            <div className="ticket-lookup-progress">
              <div className="ticket-lookup-progress-label">
                <span>
                  Entry usage
                </span>
                <strong>
                  {checkInCount} / {checkInLimit}
                </strong>
              </div>
              <div className="ticket-lookup-progress-track">
                <div
                  className="ticket-lookup-progress-fill"
                  style={{
                    width:
                      `${Math.min(
                        (
                          checkInCount /
                          Math.max(
                            checkInLimit,
                            1
                          )
                        ) * 100,
                        100
                      )}%`
                  }}
                />
              </div>
            </div>
          </div>
          {/* ==================================================
              WARNING
          ================================================== */}
          {isRefunded && (
            <div className="ticket-lookup-warning refunded">
              <RotateCcw size={21} />
              <div>
                <strong>
                  Ticket refunded
                </strong>
                <p>
                  This ticket has been refunded
                  and cannot be accepted for entry.
                </p>
              </div>
            </div>
          )}
          {limitReached &&
            !isRefunded && (
              <div className="ticket-lookup-warning limit">
                <AlertTriangle size={21} />
                <div>
                  <strong>
                    Entry limit reached
                  </strong>
                  <p>
                    This ticket/pass has already
                    used all {checkInLimit} allowed
                    entries.
                  </p>
                </div>
              </div>
          )}
          {/* ==================================================
              LAST CHECK-IN
          ================================================== */}
          <div className="ticket-lookup-last-checkin">
            <div className="ticket-lookup-card-icon">
              <Clock size={20} />
            </div>
            <div>
              <span>
                Last Check-in
              </span>
              <strong>
                {formatDateTime(
                  ticketData.checkedInAt
                )}
              </strong>
            </div>
          </div>
          {/* ==================================================
              CHECK-IN HISTORY
          ================================================== */}
          <div className="ticket-lookup-history-card">
            <div className="ticket-lookup-history-header">
              <div>
                <h3>
                  Check-in History
                </h3>
                <p>
                  Previous successful entries.
                </p>
              </div>
              <History size={23} />
            </div>
            {history.length > 0 ? (
              <div className="ticket-lookup-history-list">
                {history.map(
                  (entry, index) => (
                    <div
                      className="ticket-lookup-history-item"
                      key={
                        `${entry?.entryNumber || index}-${entry?.time || index}`
                      }
                    >
                      <div className="ticket-lookup-history-number">
                        {entry?.entryNumber ||
                          index + 1}
                      </div>
                      <div className="ticket-lookup-history-details">
                        <strong>
                          Entry{" "}
                          {entry?.entryNumber ||
                            index + 1}
                        </strong>
                        <span>
                          {formatDateTime(
                            entry?.time
                          )}
                        </span>
                      </div>
                      <CheckCircle
                        size={19}
                        className="ticket-lookup-history-check"
                      />
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="ticket-lookup-no-history">
                <Clock size={22} />
                <span>
                  No entries recorded yet.
                </span>
              </div>
            )}
          </div>
          {/* ==================================================
              SCANNER ACTION
          ================================================== */}
          <div className="ticket-lookup-actions">
            <button
              type="button"
              className="ticket-lookup-scan-btn"
              onClick={() =>
                navigate(
                  `/admin/team-scanner/${ticketData.eventId || ""}`
                )
              }
            >
              <Search size={19} />
              Open Scanner
            </button>
            <button
              type="button"
              className="ticket-lookup-new-btn"
              onClick={clearLookup}
            >
              Search Another Ticket
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
export default TicketLookup;