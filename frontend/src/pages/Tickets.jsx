import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Tickets.css";

function Tickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tickets, setTickets] = useState([]);
  const [freePasses, setFreePasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // CHECK WHETHER EVENT HAS PASSED
  // ============================================================

  function hasEventPassed(dateString) {
    if (!dateString) return false;

    const eventDate = new Date(dateString);

    if (Number.isNaN(eventDate.getTime())) {
      return false;
    }

    return eventDate < new Date();
  }

  // ============================================================
  // LOAD TICKETS
  // ============================================================

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadTickets = async () => {
      try {
        setLoading(true);

        // ======================================================
        // PAID TICKETS
        // ======================================================

        const bookingsResponse = await fetch(
          "http://localhost:5000/bookings"
        );

        if (!bookingsResponse.ok) {
          throw new Error("Unable to load bookings.");
        }

        const bookingsData =
          await bookingsResponse.json();

        const myTickets = Array.isArray(bookingsData)
          ? bookingsData.filter(
              (ticket) =>
                ticket?.buyer?.email === user.email
            )
          : [];

        // ======================================================
        // FREE EVENT PASSES
        // ======================================================

        let myPasses = [];

        try {
          const attendanceResponse = await fetch(
            "http://localhost:5000/attendance"
          );

          if (attendanceResponse.ok) {
            const attendanceData =
              await attendanceResponse.json();

            myPasses = Array.isArray(attendanceData)
              ? attendanceData.filter(
                  (pass) =>
                    pass?.email === user.email
                )
              : [];
          }
        } catch (error) {
          console.error(
            "LOAD FREE PASSES ERROR:",
            error
          );
        }

        if (isMounted) {
          setTickets(myTickets);
          setFreePasses(myPasses);
        }

        console.log(
          "MY PAID TICKETS:",
          myTickets
        );

        console.log(
          "MY FREE PASSES:",
          myPasses
        );
      } catch (error) {
        console.error(
          "LOAD TICKETS ERROR:",
          error
        );

        if (isMounted) {
          setTickets([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {
    return (
      <div className="tickets-page">
        <div className="tickets-empty">
          <div className="empty-icon">🔐</div>

          <h2>Login Required</h2>

          <p>
            Please log in to view your tickets.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="tickets-page">
        <div className="tickets-loading">
          <div className="tickets-spinner"></div>

          <h2>Loading your tickets...</h2>

          <p>
            Please wait while we retrieve your tickets.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="tickets-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="tickets-header">

        <div>
          <span className="tickets-eyebrow">
            EVENTWAA
          </span>

          <h1>
            My Tickets
          </h1>

          <p>
            Your confirmed event tickets and passes.
          </p>
        </div>

        <div className="tickets-count">

          <span>
            {tickets.length}
          </span>

          <small>
            Paid Ticket
            {tickets.length !== 1 ? "s" : ""}
          </small>

        </div>

      </div>


      {/* ======================================================
          PAID TICKETS
      ====================================================== */}

      <section className="tickets-section">

        <div className="section-heading">

          <div>
            <h2>
              🎟️ Paid Tickets
            </h2>

            <p>
              Tickets purchased through EventWaa.
            </p>
          </div>

        </div>


        {tickets.length === 0 ? (

          <div className="tickets-empty-section">

            <div className="empty-icon">
              🎟️
            </div>

            <h3>
              No paid tickets yet
            </h3>

            <p>
              Once you purchase a ticket,
              it will appear here.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/events")
              }
            >
              Browse Events
            </button>

          </div>

        ) : (

          <div className="tickets-grid">

            {tickets.map((ticket) => {

              const eventDate =
                ticket.eventDate ||
                ticket.date;

              const eventHasPassed =
                hasEventPassed(eventDate);

              const isRefunded =
                ticket.refundStatus ===
                "refunded";

              const isRefundPending =
                ticket.refundStatus ===
                "pending";

              const amountPaid =
                Number(
                  ticket.customerTotal ??
                  ticket.totalPrice ??
                  0
                );

              return (

                <article
                  className={`ticket-card ${
                    isRefunded
                      ? "refunded-ticket"
                      : ""
                  }`}
                  key={
                    ticket.ticketId ||
                    ticket.id
                  }
                >

                  {/* ==================================================
                      CARD TOP
                  ================================================== */}

                  <div className="ticket-card-top">

                    <div className="ticket-event-icon">
                      🎟️
                    </div>

                    <div className="ticket-status">

                      {isRefunded ? (
                        <span className="status refunded">
                          Refunded
                        </span>
                      ) : isRefundPending ? (
                        <span className="status pending">
                          Refund Pending
                        </span>
                      ) : (
                        <span className="status confirmed">
                          ✓ Confirmed
                        </span>
                      )}

                    </div>

                  </div>


                  {/* ==================================================
                      EVENT
                  ================================================== */}

                  <div className="ticket-event">

                    <h2>
                      {ticket.eventTitle ||
                        "Event"}
                    </h2>

                    <div className="ticket-location">

                      {eventDate && (
                        <span>
                          📅 {eventDate}
                        </span>
                      )}

                      {(ticket.eventVenue ||
                        ticket.venue) && (
                        <span>
                          📍{" "}
                          {ticket.eventVenue ||
                            ticket.venue}
                        </span>
                      )}

                    </div>

                  </div>


                  {/* ==================================================
                      DETAILS
                  ================================================== */}

                  <div className="ticket-details">

                    <div className="ticket-detail">

                      <span>
                        Ticket Type
                      </span>

                      <strong>
                        {ticket.ticketType ||
                          "Regular"}
                      </strong>

                    </div>


                    <div className="ticket-detail">

                      <span>
                        Quantity
                      </span>

                      <strong>
                        {ticket.quantity || 1}
                      </strong>

                    </div>


                    <div className="ticket-detail">

                      <span>
                        Amount Paid
                      </span>

                      <strong>
                        UGX{" "}
                        {amountPaid.toLocaleString()}
                      </strong>

                    </div>


                    <div className="ticket-detail">

                      <span>
                        Ticket ID
                      </span>

                      <strong className="ticket-id">
                        {ticket.ticketId ||
                          "N/A"}
                      </strong>

                    </div>

                  </div>


                  {/* ==================================================
                      REFUND BANNERS
                  ================================================== */}

                  {isRefunded && (

                    <div className="refund-banner refunded-banner">
                      This ticket has been refunded
                      and is no longer valid.
                    </div>

                  )}


                  {isRefundPending && (

                    <div className="refund-banner pending-banner">
                      Your refund request is awaiting
                      approval.
                    </div>

                  )}


                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <div className="ticket-actions">

                    {isRefunded ? (

                      <button
                        className="view-ticket-btn disabled"
                        disabled
                      >
                        Ticket No Longer Valid
                      </button>

                    ) : (

                      <>

                        <Link
                          to={`/tickets/${ticket.ticketId}`}
                          className="view-ticket-btn"
                        >
                          🎟️ View Ticket
                        </Link>


                        {isRefundPending ? (

                          <button
                            className="refund-btn pending"
                            disabled
                          >
                            Refund Pending
                          </button>

                        ) : (

                          <button
                            type="button"
                            className="refund-btn"
                            onClick={() =>
                              navigate(
                                "/request-refund",
                                {
                                  state: {
                                    ticket
                                  }
                                }
                              )
                            }
                          >
                            ↩️ Request Refund
                          </button>

                        )}


                        {eventHasPassed && (

                          <button
                            type="button"
                            className="review-ticket-btn"
                            onClick={() =>
                              navigate(
                                "/review",
                                {
                                  state: {
                                    ticket,

                                    event: {
                                      id:
                                        ticket.eventId,

                                      title:
                                        ticket.eventTitle,

                                      date:
                                        ticket.eventDate ||
                                        ticket.date,

                                      venue:
                                        ticket.eventVenue ||
                                        ticket.venue,

                                      city:
                                        ticket.eventCity ||
                                        ticket.city
                                    }
                                  }
                                }
                              )
                            }
                          >
                            ⭐ Leave a Review
                          </button>

                        )}

                      </>

                    )}

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>


      {/* ======================================================
          FREE EVENTS
      ====================================================== */}

      <section className="tickets-section free-section">

        <div className="section-heading">

          <div>

            <h2>
              🎉 Free Event Passes
            </h2>

            <p>
              Your free event registrations.
            </p>

          </div>

        </div>


        {freePasses.length === 0 ? (

          <div className="tickets-empty-section small-empty">

            <div className="empty-icon">
              🎉
            </div>

            <h3>
              No free passes
            </h3>

            <p>
              Free event registrations will appear here.
            </p>

          </div>

        ) : (

          <div className="tickets-grid">

            {freePasses.map((pass) => (

              <article
                className="ticket-card free-ticket-card"
                key={pass.id}
              >

                <div className="ticket-card-top">

                  <div className="ticket-event-icon">
                    🎉
                  </div>

                  <span className="status confirmed">
                    ✓ Confirmed
                  </span>

                </div>


                <div className="ticket-event">

                  <h2>
                    {pass.eventTitle ||
                      "Free Event"}
                  </h2>

                </div>


                <div className="ticket-details">

                  <div className="ticket-detail">

                    <span>
                      Pass Type
                    </span>

                    <strong>
                      Free Attendance Pass
                    </strong>

                  </div>


                  <div className="ticket-detail">

                    <span>
                      Status
                    </span>

                    <strong>
                      Confirmed
                    </strong>

                  </div>

                </div>


                <div className="ticket-actions">

                  <Link
                    to={`/free-ticket/${pass.id}`}
                    className="view-ticket-btn"
                  >
                    🎟️ View Free Pass
                  </Link>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Tickets;