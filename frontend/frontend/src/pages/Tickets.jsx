import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./Tickets.css";

function Tickets() {

  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [freePasses, setFreePasses] = useState([]);


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

    if (!user) return;


    // ==========================================================
    // PAID TICKETS
    // ==========================================================

    fetch("http://localhost:5000/bookings")

      .then((res) => res.json())

      .then((data) => {

        const myTickets = Array.isArray(data)
          ? data.filter(
              (ticket) =>
                ticket.buyer?.email === user.email
            )
          : [];

        setTickets(myTickets);

      })

      .catch((error) => {

        console.error(
          "LOAD TICKETS ERROR:",
          error
        );

      });


    // ==========================================================
    // FREE EVENT PASSES
    // ==========================================================

    fetch("http://localhost:5000/attendance")

      .then((res) => res.json())

      .then((data) => {

        const myPasses = Array.isArray(data)
          ? data.filter(
              (pass) =>
                pass.email === user.email
            )
          : [];

        setFreePasses(myPasses);

      })

      .catch((error) => {

        console.error(
          "LOAD FREE PASSES ERROR:",
          error
        );

      });

  }, [user]);


  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {

    return (

      <div className="tickets-page">

        <div className="tickets-empty">

          <h2>
            🔐 Login Required
          </h2>

          <p>
            Please log in to view your tickets.
          </p>

          <button
            onClick={() => navigate("/login")}
          >
            Login
          </button>

        </div>

      </div>

    );

  }


  return (

    <div className="tickets-page">

      <h1>
        🎟️ My Tickets
      </h1>


      {/* ======================================================
          PAID TICKETS
      ====================================================== */}

      <section>

        <h2>
          💳 Paid Tickets
        </h2>


        {tickets.length === 0 ? (

          <p>
            No paid tickets yet.
          </p>

        ) : (

          tickets.map((ticket) => {

            const eventDate =
              ticket.eventDate ||
              ticket.date;

            const eventHasPassed =
              hasEventPassed(eventDate);


            const isRefunded =
              ticket.refundStatus === "refunded";

            const isRefundPending =
              ticket.refundStatus === "pending";


            return (

              <div
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

                {/* EVENT */}

                <h2>
                  {ticket.eventTitle ||
                    "Event"}
                </h2>


                {/* DATE */}

                {eventDate && (

                  <p>

                    <strong>
                      Date:
                    </strong>{" "}

                    {eventDate}

                  </p>

                )}


                {/* VENUE */}

                {ticket.venue && (

                  <p>

                    <strong>
                      Venue:
                    </strong>{" "}

                    {ticket.venue}

                  </p>

                )}


                {/* TICKET TYPE */}

                <p>

                  <strong>
                    Ticket Type:
                  </strong>{" "}

                  {ticket.ticketType ||
                    "Regular"}

                </p>


                {/* QUANTITY */}

                <p>

                  <strong>
                    Quantity:
                  </strong>{" "}

                  {ticket.quantity || 1}

                </p>


                {/* AMOUNT */}

                <p>

                  <strong>
                    Amount Paid:
                  </strong>{" "}

                  UGX{" "}

                  {Number(
                    ticket.totalPrice || 0
                  ).toLocaleString()}

                </p>


                {/* STATUS */}

                <p>

                  <strong>
                    Status:
                  </strong>{" "}

                  {isRefunded
                    ? "Refunded"
                    : isRefundPending
                    ? "Refund pending"
                    : ticket.status ||
                      "Confirmed"}

                </p>


                {/* =================================================
                    REFUND BANNERS
                ================================================= */}

                {isRefunded && (

                  <div className="refund-banner">

                    Refunded

                  </div>

                )}


                {isRefundPending && (

                  <div className="refund-banner pending">

                    Refund pending approval

                  </div>

                )}


                {/* =================================================
                    REFUNDED TICKET
                ================================================= */}

                {isRefunded ? (

                  <button
                    className="view-ticket-btn disabled"
                    disabled
                  >
                    Ticket no longer valid
                  </button>

                ) : (

                  <>

                    {/* VIEW TICKET */}

                    <Link
                      to={`/tickets/${ticket.ticketId}`}
                      className="view-ticket-btn"
                    >
                      🎟️ View Ticket
                    </Link>


                    {/* =================================================
                        REFUND
                    ================================================= */}

                    {isRefundPending ? (

                      <button
                        className="refund-btn pending"
                        disabled
                      >
                        Refund pending approval
                      </button>

                    ) : (

                      <button
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


                    {/* =================================================
                        REVIEW
                    ================================================= */}

                    {eventHasPassed && (

                      <button
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
                                    ticket.venue,

                                  city:
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

            );

          })

        )}

      </section>


      {/* ======================================================
          FREE EVENTS
      ====================================================== */}

      <section>

        <h2>
          🎉 Free Event Passes
        </h2>


        {freePasses.length === 0 ? (

          <p>
            No free event passes yet.
          </p>

        ) : (

          freePasses.map((pass) => (

            <div
              className="ticket-card"
              key={pass.id}
            >

              <h2>
                {pass.eventTitle ||
                  "Free Event"}
              </h2>


              <p>

                <strong>
                  Pass Type:
                </strong>{" "}

                Free Attendance Pass

              </p>


              <p>

                <strong>
                  Status:
                </strong>{" "}

                Confirmed

              </p>


              <Link
                to={`/free-ticket/${pass.id}`}
                className="view-ticket-btn"
              >
                🎟️ View Free Pass
              </Link>

            </div>

          ))

        )}

      </section>

    </div>

  );

}

export default Tickets;