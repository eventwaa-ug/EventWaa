import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiBarChart2,
  FiSearch,
  FiMail,
  FiCreditCard,
  FiHash,
  FiRefreshCw,
  FiXCircle,
  FiRotateCcw,
  FiShield,
} from "react-icons/fi";
import "../styles/Attendees.css";
function Attendees() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState([]);
  const [event, setEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refundSettings, setRefundSettings] = useState({
    hostRefunds: true,
    autoRefundApproval: false,
  });
  // =========================================================
  // LOAD ATTENDEES
  // =========================================================
  const loadAttendees = async () => {
    try {
      setLoading(true);
      // -------------------------------------------------------
      // EVENT
      // -------------------------------------------------------
      const eventResponse = await fetch(
        `http://localhost:5000/events/${id}`
      );
      const eventData = await eventResponse.json();
      setEvent(eventData);
      // -------------------------------------------------------
      // REFUND SETTINGS
      // -------------------------------------------------------
      const refundResponse = await fetch(
        "http://localhost:5000/refund-settings"
      );
      const refundData = await refundResponse.json();
      setRefundSettings(refundData);
      // -------------------------------------------------------
      // ATTENDEES
      // -------------------------------------------------------
      let response;
      if (eventData.eventType === "Free") {
        response = await fetch(
          `http://localhost:5000/attendance/event/${id}`
        );
      } else {
        response = await fetch(
          `http://localhost:5000/bookings/event/${id}`
        );
      }
      const data = await response.json();
      setAttendees(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "LOAD ATTENDEES ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAttendees();
  }, [id]);
  // =========================================================
  // CHECK IN ATTENDEE
  // =========================================================
  const checkInAttendee = async (ticket) => {
    try {
      const response = await fetch(
        `http://localhost:5000/check-ticket/${ticket.ticketId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: id,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Unable to check in attendee."
        );
        return;
      }
      setAttendees((prev) =>
        prev.map((item) =>
          item.id === ticket.id
            ? {
                ...item,
                ...data.ticket,
                checkInCount:
                  data.ticket?.checkInCount ??
                  item.checkInCount ??
                  0,
              }
            : item
        )
      );
      const count =
        data.ticket?.checkInCount ??
        ticket.checkInCount ??
        0;
      if (count >= 3) {
        alert(
          "Attendee checked in successfully. This ticket has now reached the maximum of 3 entries."
        );
      } else {
        alert(
          `Attendee checked in successfully. Entry ${count} of 3 used.`
        );
      }
    } catch (error) {
      console.error(
        "CHECK-IN ERROR:",
        error
      );
      alert(
        "Unable to check in attendee. Please try again."
      );
    }
  };
  // =========================================================
  // HIDE REFUNDED TICKETS
  // =========================================================
  const activeAttendees = useMemo(() => {
    return attendees.filter(
      (ticket) =>
        ticket.refundStatus !== "refunded"
    );
  }, [attendees]);
  // =========================================================
  // SEARCH
  // =========================================================
  const filteredAttendees = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();
    return activeAttendees.filter(
      (person) => {
        const name =
          person.buyer?.name?.toLowerCase() ||
          person.name?.toLowerCase() ||
          "";
        const email =
          person.buyer?.email?.toLowerCase() ||
          person.email?.toLowerCase() ||
          "";
        const ticketId =
          person.ticketId
            ?.toLowerCase() ||
          "";
        return (
          name.includes(searchValue) ||
          email.includes(searchValue) ||
          ticketId.includes(searchValue)
        );
      }
    );
  }, [activeAttendees, search]);
  // =========================================================
  // STATS
  // =========================================================
  const totalAttendees =
    activeAttendees.length;
  const checkedIn =
    activeAttendees.filter((ticket) => {
      if (event?.eventType === "Free") {
        return ticket.checkedIn === true;
      }
      return (
        Number(ticket.checkInCount || 0) > 0
      );
    }).length;
  const notCheckedIn =
    totalAttendees - checkedIn;
  const attendanceRate =
    totalAttendees > 0
      ? Math.round(
          (checkedIn /
            totalAttendees) *
            100
        )
      : 0;
  // =========================================================
  // REFUND
  // =========================================================
  const requestRefund = async (bookingId) => {
    const confirmed = window.confirm(
      "Issue a refund for this booking?"
    );
    if (!confirmed) return;
    try {
      const response = await fetch(
        "http://localhost:5000/refunds",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            reason: "Refund issued by host",
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to request refund"
        );
      }
      alert(result.message);
      setAttendees((prev) =>
        prev.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                refundStatus:
                  result.refund.status,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "REFUND ERROR:",
        error
      );
      alert(error.message);
    }
  };
  // =========================================================
  // ENTRY COUNT
  // =========================================================
  const getEntryCount = (ticket) => {
    if (event?.eventType === "Free") {
      return ticket.checkedIn ? 1 : 0;
    }
    return Number(
      ticket.checkInCount || 0
    );
  };
  // =========================================================
  // MAXIMUM ENTRIES
  // =========================================================
  const hasReachedMaximumEntries = (
    ticket
  ) => {
    if (event?.eventType === "Free") {
      return ticket.checkedIn === true;
    }
    return (
      getEntryCount(ticket) >= 3
    );
  };
  // =========================================================
  // REFRESH
  // =========================================================
  const handleRefresh = () => {
    loadAttendees();
  };
  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="attendees-page">
      {/* =====================================================
          TOP NAV
      ===================================================== */}
      <div className="attendees-topbar">
        <button
          className="attendees-back-btn"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft />
          <span>Back</span>
        </button>
        <button
          className="attendees-refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh attendees"
        >
          <FiRefreshCw
            className={
              loading
                ? "refresh-spinning"
                : ""
            }
          />
          <span>Refresh</span>
        </button>
      </div>
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="attendees-header">
        <div className="attendees-title-area">
          <div className="attendees-title-icon">
            <FiUsers />
          </div>
          <div>
            <span className="attendees-eyebrow">
              EVENT MANAGEMENT
            </span>
            <h1>
              Event attendees
            </h1>
            {event?.title && (
              <p className="attendees-event-name">
                {event.title}
              </p>
            )}
          </div>
        </div>
        {event?.eventType && (
          <div
            className={`event-type-badge ${
              event.eventType === "Free"
                ? "free-event"
                : "paid-event"
            }`}
          >
            {event.eventType === "Free"
              ? "Free Event"
              : "Paid Event"}
          </div>
        )}
      </header>
      {/* =====================================================
          STATS
      ===================================================== */}
      <section className="attendee-stats">
        <div className="attendee-stat-card">
          <div className="stat-icon blue">
            <FiCreditCard />
          </div>
          <div className="stat-content">
            <span>
              Active tickets
            </span>
            <strong>
              {totalAttendees}
            </strong>
          </div>
        </div>
        <div className="attendee-stat-card">
          <div className="stat-icon green">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <span>
              Checked in
            </span>
            <strong>
              {checkedIn}
            </strong>
          </div>
        </div>
        <div className="attendee-stat-card">
          <div className="stat-icon orange">
            <FiClock />
          </div>
          <div className="stat-content">
            <span>
              Pending
            </span>
            <strong>
              {notCheckedIn}
            </strong>
          </div>
        </div>
        <div className="attendee-stat-card">
          <div className="stat-icon purple">
            <FiBarChart2 />
          </div>
          <div className="stat-content">
            <span>
              Attendance rate
            </span>
            <strong>
              {attendanceRate}%
            </strong>
          </div>
        </div>
      </section>
      {/* =====================================================
          SEARCH / CONTROLS
      ===================================================== */}
      <div className="attendees-controls">
        <div className="attendee-search-wrapper">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email or ticket ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
          {search && (
            <button
              className="clear-search-btn"
              onClick={() =>
                setSearch("")
              }
              type="button"
            >
              <FiXCircle />
            </button>
          )}
        </div>
        <div className="attendee-results">
          {search
            ? `${filteredAttendees.length} result${
                filteredAttendees.length !== 1
                  ? "s"
                  : ""
              }`
            : `${totalAttendees} attendee${
                totalAttendees !== 1
                  ? "s"
                  : ""
              }`}
        </div>
      </div>
      {/* =====================================================
          EMPTY / LOADING
      ===================================================== */}
      {loading ? (
        <div className="attendees-empty">
          <div className="loading-spinner">
            <FiRefreshCw />
          </div>
          <h2>
            Loading attendees...
          </h2>
          <p>
            Please wait while we load the
            attendee list.
          </p>
        </div>
      ) : filteredAttendees.length === 0 ? (
        <div className="attendees-empty">
          <div className="empty-icon">
            <FiUsers />
          </div>
          <h2>
            No attendees found
          </h2>
          <p>
            {search
              ? "Try a different name, email or ticket ID."
              : "There are currently no active attendees for this event."}
          </p>
          {search && (
            <button
              className="clear-empty-btn"
              onClick={() =>
                setSearch("")
              }
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        /* ===================================================
           ATTENDEE LIST
        =================================================== */
        <section className="attendees-section">
          <div className="attendees-section-header">
            <div>
              <span className="section-eyebrow">
                ATTENDEE LIST
              </span>
              <h2>
                Registered attendees
              </h2>
            </div>
            <span className="attendee-count-badge">
              {filteredAttendees.length}
            </span>
          </div>
          <div className="attendees-list">
            {filteredAttendees.map(
              (ticket) => {
                const entryCount =
                  getEntryCount(ticket);
                const maximumReached =
                  hasReachedMaximumEntries(
                    ticket
                  );
                const attendeeName =
                  ticket.buyer?.name ||
                  ticket.name ||
                  "Unknown attendee";
                const attendeeEmail =
                  ticket.buyer?.email ||
                  ticket.email ||
                  "No email";
                return (
                  <article
                    className="attendee-card"
                    key={ticket.id}
                  >
                    {/* =================================================
                        AVATAR / INFO
                    ================================================= */}
                    <div className="attendee-main">
                      <div className="attendee-avatar">
                        {attendeeName
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="attendee-info">
                        <div className="attendee-name-row">
                          <h2>
                            {attendeeName}
                          </h2>
                          {event?.eventType !==
                            "Free" &&
                            maximumReached && (
                              <span className="fully-used-badge">
                                <FiCheckCircle />
                                Complete
                              </span>
                            )}
                        </div>
                        <p className="attendee-email">
                          <FiMail />
                          {attendeeEmail}
                        </p>
                        <p className="attendee-ticket-id">
                          <FiHash />
                          <span>
                            {ticket.ticketId ||
                              "No ticket ID"}
                          </span>
                        </p>
                        {/* =================================================
                            TICKET DETAILS
                        ================================================= */}
                        <div className="ticket-entry-info">
                          {event?.eventType !==
                            "Free" ? (
                            <>
                              <span className="ticket-count">
                                <FiCreditCard />
                                Tickets:{" "}
                                {ticket.quantity ||
                                  1}
                              </span>
                              <span
                                className={`entry-count ${
                                  maximumReached
                                    ? "entry-complete"
                                    : entryCount > 0
                                    ? "entry-progress"
                                    : "entry-unused"
                                }`}
                              >
                                {maximumReached ? (
                                  <>
                                    <FiCheckCircle />
                                    3/3 entries used
                                  </>
                                ) : (
                                  <>
                                    <FiRotateCcw />
                                    {entryCount}/3
                                    entries used
                                  </>
                                )}
                              </span>
                            </>
                          ) : (
                            <span className="ticket-count free-pass">
                              <FiShield />
                              Attendance pass
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* =================================================
                        STATUS / ACTIONS
                    ================================================= */}
                    <div className="attendee-status">
                      {/* -----------------------------------------------
                          PAID TICKET
                      ----------------------------------------------- */}
                      {event?.eventType !==
                        "Free" ? (
                        <>
                          {!maximumReached && (
                            <button
                              className="checkin-btn"
                              onClick={() =>
                                checkInAttendee(
                                  ticket
                                )
                              }
                            >
                              <FiCheckCircle />
                              <span>
                                Check in
                                {entryCount >
                                  0 &&
                                  ` (${
                                    entryCount +
                                    1
                                  }/3)`}
                              </span>
                            </button>
                          )}
                          {maximumReached && (
                            <div className="maximum-entry-badge">
                              <FiCheckCircle />
                              Maximum entries reached
                            </div>
                          )}
                        </>
                      ) : (
                        /* -----------------------------------------------
                           FREE PASS
                        ----------------------------------------------- */
                        !ticket.checkedIn ? (
                          <button
                            className="checkin-btn"
                            onClick={() =>
                              checkInAttendee(
                                ticket
                              )
                            }
                          >
                            <FiCheckCircle />
                            <span>
                              Check in
                            </span>
                          </button>
                        ) : (
                          <div className="checked">
                            <FiCheckCircle />
                            Checked in
                          </div>
                        )
                      )}
                      {/* =================================================
                          REFUND
                      ================================================= */}
                      {refundSettings.hostRefunds &&
                        event?.eventType !==
                          "Free" &&
                        !maximumReached &&
                        (
                          ticket.refundStatus ===
                          "pending" ? (
                            <button
                              className="refund-btn pending"
                              disabled
                            >
                              <FiClock />
                              Pending approval
                            </button>
                          ) : (
                            <button
                              className="refund-btn"
                              onClick={() =>
                                requestRefund(
                                  ticket.id
                                )
                              }
                            >
                              <FiRotateCcw />
                              Refund
                            </button>
                          )
                        )}
                      {/* =================================================
                          STATUS
                      ================================================= */}
                      {event?.eventType !==
                        "Free" ? (
                        maximumReached ? (
                          <p className="status-message checked">
                            <FiCheckCircle />
                            Fully checked in
                          </p>
                        ) : entryCount > 0 ? (
                          <p className="status-message entry-status">
                            <FiCreditCard />
                            {entryCount}/3 entries used
                          </p>
                        ) : (
                          <p className="status-message pending">
                            <FiClock />
                            Not checked in
                          </p>
                        )
                      ) : (
                        ticket.checkedIn ? (
                          <p className="status-message checked">
                            <FiCheckCircle />
                            Checked in
                          </p>
                        ) : (
                          <p className="status-message pending">
                            <FiClock />
                            Not checked in
                          </p>
                        )
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      )}
    </div>
  );
}
export default Attendees;