import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/Attendees.css";

function Attendees() {
  const { id } = useParams();

  const [attendees, setAttendees] = useState([]);
  const [event, setEvent] = useState(null);
  const [search, setSearch] = useState("");

  const [refundSettings, setRefundSettings] = useState({
    hostRefunds: true,
    autoRefundApproval: false,
  });

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
        alert(data.message || "Unable to check in attendee.");
        return;
      }

      // -------------------------------------------------------
      // UPDATE THE TICKET WITH THE BACKEND RESPONSE
      // -------------------------------------------------------

      setAttendees((prev) =>
        prev.map((item) =>
          item.id === ticket.id
            ? {
                ...item,
                ...data.ticket,

                // Keep the latest check-in count
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
      console.error("CHECK-IN ERROR:", error);

      alert(
        "Unable to check in attendee. Please try again."
      );
    }
  };

  // =========================================================
  // LOAD ATTENDEES
  // =========================================================

  useEffect(() => {
    const loadAttendees = async () => {
      try {
        // -----------------------------------------------------
        // EVENT DETAILS
        // -----------------------------------------------------

        const eventResponse = await fetch(
          `http://localhost:5000/events/${id}`
        );

        const eventData = await eventResponse.json();

        setEvent(eventData);

        // -----------------------------------------------------
        // REFUND SETTINGS
        // -----------------------------------------------------

        const refundResponse = await fetch(
          "http://localhost:5000/refund-settings"
        );

        const refundData = await refundResponse.json();

        setRefundSettings(refundData);

        // -----------------------------------------------------
        // ATTENDEES
        // -----------------------------------------------------

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
      }
    };

    loadAttendees();
  }, [id]);

  // =========================================================
  // HIDE REFUNDED TICKETS
  // =========================================================

  const activeAttendees = attendees.filter(
    (ticket) =>
      ticket.refundStatus !== "refunded"
  );

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredAttendees =
    activeAttendees.filter((person) => {
      const name =
        person.buyer?.name?.toLowerCase() ||
        person.name?.toLowerCase() ||
        "";

      const email =
        person.buyer?.email?.toLowerCase() ||
        person.email?.toLowerCase() ||
        "";

      const searchValue =
        search.toLowerCase();

      return (
        name.includes(searchValue) ||
        email.includes(searchValue)
      );
    });

  // =========================================================
  // STATS
  // =========================================================

  const totalAttendees =
    activeAttendees.length;

  // A ticket is considered "checked in"
  // once it has at least one entry.
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
          (checkedIn / totalAttendees) * 100
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
  // GET ENTRY COUNT
  // =========================================================

  const getEntryCount = (ticket) => {
    // Free passes remain one-time entry.
    if (event?.eventType === "Free") {
      return ticket.checkedIn ? 1 : 0;
    }

    return Number(
      ticket.checkInCount || 0
    );
  };

  // =========================================================
  // CHECK WHETHER MAXIMUM ENTRIES HAVE BEEN USED
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

  return (
    <div className="attendees-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="attendees-header">

        <div>
          <h1>
            👥 Event attendees
          </h1>

          {event?.title && (
            <p className="attendees-event-name">
              {event.title}
            </p>
          )}
        </div>

      </div>


      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="attendee-stats">

        <div className="attendee-stat-card">
          <h2>
            {totalAttendees}
          </h2>

          <p>
            🎟️ Active tickets
          </p>
        </div>


        <div className="attendee-stat-card">
          <h2>
            {checkedIn}
          </h2>

          <p>
            ✅ Checked in
          </p>
        </div>


        <div className="attendee-stat-card">
          <h2>
            {notCheckedIn}
          </h2>

          <p>
            ⏳ Pending
          </p>
        </div>


        <div className="attendee-stat-card">
          <h2>
            {attendanceRate}%
          </h2>

          <p>
            📊 Attendance rate
          </p>
        </div>

      </div>


      {/* =====================================================
          SEARCH
      ===================================================== */}

      <input
        className="attendee-search"
        type="text"
        placeholder="🔍 Search attendee..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />


      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {filteredAttendees.length === 0 ? (

        <div className="attendees-empty">

          <div className="empty-icon">
            👥
          </div>

          <h2>
            No attendees found
          </h2>

          <p>
            {search
              ? "Try a different name or email."
              : "There are currently no active attendees for this event."}
          </p>

        </div>

      ) : (

        <div className="attendees-list">

          {filteredAttendees.map(
            (ticket) => {

              const entryCount =
                getEntryCount(ticket);

              const maximumReached =
                hasReachedMaximumEntries(
                  ticket
                );

              return (

                <div
                  className="attendee-card"
                  key={ticket.id}
                >

                  {/* =================================================
                      ATTENDEE INFORMATION
                  ================================================= */}

                  <div className="attendee-info">

                    <h2>
                      👤{" "}
                      {ticket.buyer?.name ||
                        ticket.name ||
                        "Unknown attendee"}
                    </h2>

                    <p>
                      📧{" "}
                      {ticket.buyer?.email ||
                        ticket.email ||
                        "No email"}
                    </p>

                    <p>
                      🆔 Ticket ID:{" "}
                      {ticket.ticketId}
                    </p>


                    {/* =================================================
                        PAID TICKET
                    ================================================= */}

                    {event?.eventType !== "Free" ? (

                      <div className="ticket-entry-info">

                        <span className="ticket-count">

                          🎟️ Tickets:{" "}
                          {ticket.quantity || 1}

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

                          {maximumReached
                            ? "✅ 3/3 entries used"
                            : `🎫 ${entryCount}/3 entries used`}

                        </span>

                      </div>

                    ) : (

                      <p className="ticket-count">
                        ✅ Attendance pass
                      </p>

                    )}

                  </div>


                  {/* =================================================
                      STATUS / ACTIONS
                  ================================================= */}

                  <div className="attendee-status">

                    {/* -------------------------------------------------
                        PAID TICKET CHECK-IN
                    ------------------------------------------------- */}

                    {event?.eventType !== "Free" ? (

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
                            ✅ Check in
                            {entryCount > 0 &&
                              ` (${entryCount + 1}/3)`}
                          </button>

                        )}


                        {maximumReached && (

                          <div className="maximum-entry-badge">
                            ✅ Maximum entries reached
                          </div>

                        )}

                      </>

                    ) : (

                      /* -------------------------------------------------
                         FREE PASS
                      ------------------------------------------------- */

                      !ticket.checkedIn ? (

                        <button
                          className="checkin-btn"
                          onClick={() =>
                            checkInAttendee(
                              ticket
                            )
                          }
                        >
                          ✅ Check in
                        </button>

                      ) : (

                        <p className="checked">
                          ✅ Checked in
                        </p>

                      )

                    )}


                    {/* =================================================
                        REFUND
                    ================================================= */}

                    {refundSettings.hostRefunds &&
                      event?.eventType !== "Free" &&
                      !maximumReached &&
                      (ticket.refundStatus ===
                      "pending" ? (

                        <button
                          className="refund-btn pending"
                          disabled
                        >
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
                          Refund
                        </button>

                      ))}


                    {/* =================================================
                        STATUS
                    ================================================= */}

                    {event?.eventType !== "Free" ? (

                      maximumReached ? (

                        <p className="checked">
                          ✅ Fully checked in
                        </p>

                      ) : entryCount > 0 ? (

                        <p className="entry-status">
                          🎫 {entryCount}/3 entries used
                        </p>

                      ) : (

                        <p className="pending">
                          ⏳ Not checked in
                        </p>

                      )

                    ) : (

                      ticket.checkedIn ? (

                        <p className="checked">
                          ✅ Checked in
                        </p>

                      ) : (

                        <p className="pending">
                          ⏳ Not checked in
                        </p>

                      )

                    )}

                  </div>

                </div>

              );
            }
          )}

        </div>

      )}

    </div>
  );
}

export default Attendees;