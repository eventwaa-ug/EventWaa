import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

import {
  Ticket,
  CalendarDays,
  MapPin,
  RotateCcw,
  Star,
  PartyPopper,
  CheckCircle,
  LockKeyhole,
  Trash2,
  Clock,
} from "lucide-react";

import "./Tickets.css";

function Tickets() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [freePasses, setFreePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingBookingId, setDeletingBookingId] =
    useState(null);

  const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";


  // ============================================================
  // EVENT DATE
  // ============================================================

  function getEventDate(booking) {
    return (
      booking?.eventDate ||
      booking?.date ||
      booking?.event?.date ||
      null
    );
  }


  // ============================================================
  // CHECK WHETHER EVENT HAS PASSED
  // ============================================================

  function hasEventPassed(dateString) {
    if (!dateString) {
      return false;
    }

    const eventDate =
      new Date(dateString);

    if (
      Number.isNaN(
        eventDate.getTime()
      )
    ) {
      return false;
    }

    return eventDate < new Date();
  }


  // ============================================================
  // GET BOOKING ID
  // ============================================================

  function getBookingId(booking) {
    return (
      booking?.id ||
      booking?.bookingId ||
      booking?._id ||
      booking?.ticketId ||
      null
    );
  }


  // ============================================================
  // GET BOOKING TICKETS
  // ============================================================

  function getBookingTickets(booking) {
    if (
      Array.isArray(
        booking?.tickets
      ) &&
      booking.tickets.length > 0
    ) {
      return booking.tickets;
    }

    // Legacy single ticket support
    if (booking?.ticketId) {
      return [
        {
          ticketId:
            booking.ticketId,

          ticketType:
            booking.ticketType ||
            "Regular",

          checkedIn:
            booking.checkedIn ||
            false,

          checkedInAt:
            booking.checkedInAt ||
            null,

          refundStatus:
            booking.refundStatus ||
            "",
        },
      ];
    }

    return [];
  }


  // ============================================================
  // LOAD BOOKINGS
  // ============================================================

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setFreePasses([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadTickets =
      async () => {
        try {
          setLoading(true);

          // ====================================================
          // PAID BOOKINGS
          // ====================================================

          const bookingsResponse =
            await fetch(
              `${BACKEND_URL}/bookings`
            );

          if (
            !bookingsResponse.ok
          ) {
            throw new Error(
              "Unable to load bookings."
            );
          }

          const bookingsData =
            await bookingsResponse.json();

          let allBookings = [];

          if (
            Array.isArray(
              bookingsData
            )
          ) {
            allBookings =
              bookingsData;
          } else if (
            Array.isArray(
              bookingsData?.bookings
            )
          ) {
            allBookings =
              bookingsData.bookings;
          }


          // ====================================================
          // FIND USER BOOKINGS
          // ====================================================

          const myBookings =
            allBookings.filter(
              (booking) => {
                const buyerEmail =
                  booking?.buyer?.email ||
                  booking?.email ||
                  "";

                return (
                  String(
                    buyerEmail
                  )
                    .trim()
                    .toLowerCase() ===
                  String(
                    user.email
                  )
                    .trim()
                    .toLowerCase()
                );
              }
            );


          // ====================================================
          // FREE PASSES
          // ====================================================

          let myPasses = [];

          try {
            const attendanceResponse =
              await fetch(
                `${BACKEND_URL}/attendance`
              );

            if (
              attendanceResponse.ok
            ) {
              const attendanceData =
                await attendanceResponse.json();

              let allPasses = [];

              if (
                Array.isArray(
                  attendanceData
                )
              ) {
                allPasses =
                  attendanceData;
              } else if (
                Array.isArray(
                  attendanceData?.attendance
                )
              ) {
                allPasses =
                  attendanceData.attendance;
              } else if (
                Array.isArray(
                  attendanceData?.passes
                )
              ) {
                allPasses =
                  attendanceData.passes;
              }

              myPasses =
                allPasses.filter(
                  (pass) => {
                    const passEmail =
                      pass?.email ||
                      pass?.buyer?.email ||
                      "";

                    return (
                      String(
                        passEmail
                      )
                        .trim()
                        .toLowerCase() ===
                      String(
                        user.email
                      )
                        .trim()
                        .toLowerCase()
                    );
                  }
                );
            }
          } catch (error) {
            console.error(
              "LOAD FREE PASSES ERROR:",
              error
            );
          }


          if (
            isMounted
          ) {
            setBookings(
              myBookings
            );

            setFreePasses(
              myPasses
            );
          }


          console.log(
            "MY BOOKINGS:",
            myBookings
          );

        } catch (error) {

          console.error(
            "LOAD TICKETS ERROR:",
            error
          );

          if (
            isMounted
          ) {
            setBookings([]);
            setFreePasses([]);
          }

        } finally {

          if (
            isMounted
          ) {
            setLoading(false);
          }

        }
      };


    loadTickets();

    return () => {
      isMounted = false;
    };

  }, [
    user,
    BACKEND_URL,
  ]);


  // ============================================================
  // SORT BOOKINGS
  //
  // CURRENT / UPCOMING FIRST
  // PASSED LAST
  // ============================================================

  const sortedBookings =
    useMemo(() => {

      return [
        ...bookings,
      ].sort(
        (a, b) => {

          const aPassed =
            hasEventPassed(
              getEventDate(a)
            );

          const bPassed =
            hasEventPassed(
              getEventDate(b)
            );


          // Current first
          if (
            aPassed !==
            bPassed
          ) {
            return aPassed
              ? 1
              : -1;
          }


          const aDate =
            new Date(
              getEventDate(a) ||
              0
            ).getTime();

          const bDate =
            new Date(
              getEventDate(b) ||
              0
            ).getTime();


          // Passed:
          // newest passed event first

          if (
            aPassed &&
            bPassed
          ) {
            return (
              bDate -
              aDate
            );
          }


          // Upcoming:
          // nearest event first

          return (
            aDate -
            bDate
          );

        }
      );

    }, [
      bookings,
    ]);


  // ============================================================
  // DELETE PASSED BOOKING
  // ============================================================

  const deletePastBooking =
    async (booking) => {

      const bookingTickets =
        getBookingTickets(
          booking
        );

      if (
        bookingTickets.length === 0
      ) {
        return;
      }


      if (
        !hasEventPassed(
          getEventDate(
            booking
          )
        )
      ) {
        return;
      }


      const confirmed =
        window.confirm(
          "Delete this past booking and its tickets from My Tickets?"
        );

      if (
        !confirmed
      ) {
        return;
      }


      try {

        const bookingId =
          getBookingId(
            booking
          );

        setDeletingBookingId(
          bookingId
        );


        // Delete each individual ticket
        // because your backend already supports
        // deleting tickets by ticketId.

        for (
          const ticket of
          bookingTickets
        ) {

          if (
            !ticket?.ticketId
          ) {
            continue;
          }

          const response =
            await fetch(
              `${BACKEND_URL}/bookings/ticket/${encodeURIComponent(
                ticket.ticketId
              )}`,
              {
                method:
                  "DELETE",
              }
            );

          if (
            !response.ok
          ) {
            const data =
              await response
                .json()
                .catch(
                  () => ({})
                );

            throw new Error(
              data?.message ||
              "Unable to delete booking."
            );
          }

        }


        setBookings(
          (current) =>
            current.filter(
              (item) =>
                getBookingId(
                  item
                ) !==
                bookingId
            )
        );

      } catch (
        error
      ) {

        console.error(
          "DELETE BOOKING ERROR:",
          error
        );

        alert(
          error?.message ||
          "Unable to delete this booking."
        );

      } finally {

        setDeletingBookingId(
          null
        );

      }

    };


  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {
    return (
      <div className="tickets-page">

        <div className="tickets-empty">

          <div className="empty-icon">

            <LockKeyhole
              size={42}
              strokeWidth={2}
            />

          </div>

          <h2>
            Login Required
          </h2>

          <p>
            Please log in to view your tickets.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/login"
              )
            }
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

          <div className="tickets-spinner">
          </div>

          <h2>
            Loading your tickets...
          </h2>

          <p>
            Please wait while we retrieve
            your tickets.
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
            Your event bookings and passes.
          </p>

        </div>


        <div className="tickets-count">

          <span>
            {bookings.length}
          </span>

          <small>
            Booking
            {bookings.length !== 1
              ? "s"
              : ""}
          </small>

        </div>

      </div>


      {/* ======================================================
          PAID BOOKINGS
      ====================================================== */}

      <section className="tickets-section">

        <div className="section-heading">

          <div>

            <h2>

              <Ticket
                size={22}
                strokeWidth={2.2}
              />

              Paid Tickets

            </h2>

            <p>
              Each booking contains all
              tickets purchased together.
            </p>

          </div>

        </div>


        {sortedBookings.length === 0 ? (

          <div className="tickets-empty-section">

            <div className="empty-icon">

              <Ticket
                size={42}
                strokeWidth={2}
              />

            </div>

            <h3>
              No paid tickets yet
            </h3>

            <p>
              Once you purchase tickets,
              your booking will appear here.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/events"
                )
              }
            >
              Browse Events
            </button>

          </div>

        ) : (

          <div className="tickets-grid">

            {sortedBookings.map(
              (booking) => {

                const bookingTickets =
                  getBookingTickets(
                    booking
                  );

                const eventDate =
                  getEventDate(
                    booking
                  );

                const eventHasPassed =
                  hasEventPassed(
                    eventDate
                  );


                const bookingId =
                  getBookingId(
                    booking
                  );


                const firstTicket =
                  bookingTickets[0] ||
                  {};


                const quantity =
                  Number(
                    booking.quantity ||
                    bookingTickets.length ||
                    1
                  );


                const isRefunded =
                  String(
                    booking.refundStatus ||
                    ""
                  )
                    .toLowerCase() ===
                  "refunded";


                const isRefundPending =
                  String(
                    booking.refundStatus ||
                    ""
                  )
                    .toLowerCase() ===
                  "pending";


                const amountPaid =
                  Number(
                    booking.customerTotal ??
                    booking.totalPrice ??
                    0
                  );


                const usedTickets =
                  bookingTickets.filter(
                    (ticket) =>
                      ticket.checkedIn ===
                      true
                  ).length;


                return (

                  <article
                    className={`ticket-card ${
                      isRefunded
                        ? "refunded-ticket"
                        : ""
                    } ${
                      eventHasPassed
                        ? "past-ticket"
                        : "current-ticket"
                    }`}
                    key={
                      bookingId ||
                      firstTicket.ticketId
                    }
                  >


                    {/* ===============================
                        CARD TOP
                    =============================== */}

                    <div className="ticket-card-top">

                      <div className="ticket-event-icon">

                        <Ticket
                          size={25}
                          strokeWidth={2}
                        />

                      </div>


                      <div className="ticket-status">

                        {isRefunded ? (

                          <span className="status refunded">
                            Refunded
                          </span>

                        ) : eventHasPassed ? (

                          <span className="status passed">

                            <Clock
                              size={16}
                              strokeWidth={2.5}
                            />

                            Passed

                          </span>

                        ) : usedTickets >=
                          quantity ? (

                          <span className="status used">

                            <CheckCircle
                              size={16}
                              strokeWidth={2.5}
                            />

                            Used

                          </span>

                        ) : (

                          <span className="status confirmed">

                            <CheckCircle
                              size={16}
                              strokeWidth={2.5}
                            />

                            Confirmed

                          </span>

                        )}

                      </div>

                    </div>


                    {/* ===============================
                        EVENT
                    =============================== */}

                    <div className="ticket-event">

                      <h2>
                        {booking.eventTitle ||
                          "Event"}
                      </h2>


                      <div className="ticket-location">

                        {eventDate && (

                          <span>

                            <CalendarDays
                              size={16}
                              strokeWidth={2}
                            />

                            {eventDate}

                          </span>

                        )}


                        {(
                          booking.eventVenue ||
                          booking.venue
                        ) && (

                          <span>

                            <MapPin
                              size={16}
                              strokeWidth={2}
                            />

                            {booking.eventVenue ||
                              booking.venue}

                          </span>

                        )}

                      </div>

                    </div>


                    {/* ===============================
                        DETAILS
                    =============================== */}

                    <div className="ticket-details">


                      <div className="ticket-detail">

                        <span>
                          Ticket Type
                        </span>

                        <strong>
                          {firstTicket.ticketType ||
                            booking.ticketType ||
                            "Regular"}
                        </strong>

                      </div>


                      <div className="ticket-detail">

                        <span>
                          Tickets Purchased
                        </span>

                        <strong>
                          {quantity}
                        </strong>

                      </div>


                      <div className="ticket-detail">

                        <span>
                          Used Tickets
                        </span>

                        <strong>
                          {usedTickets} / {quantity}
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

                    </div>


                    {/* ===============================
                        PASSED BANNER
                    =============================== */}

                    {eventHasPassed &&
                      !isRefunded && (

                        <div className="refund-banner passed-banner">

                          This event has passed.
                          These tickets are no longer
                          valid for entry.

                        </div>

                      )}


                    {/* ===============================
                        REFUND BANNERS
                    =============================== */}

                    {isRefunded && (

                      <div className="refund-banner refunded-banner">

                        This booking has been refunded
                        and the tickets are no longer valid.

                      </div>

                    )}


                    {isRefundPending && (

                      <div className="refund-banner pending-banner">

                        Your refund request is awaiting
                        approval.

                      </div>

                    )}


                    {/* ===============================
                        ACTIONS
                    =============================== */}

                    <div className="ticket-actions">


                      {!eventHasPassed &&
                        !isRefunded && (

                          <Link
                            to={`/booking-ticket/${encodeURIComponent(
                              bookingId ||
                              firstTicket.ticketId
                            )}`}
                            className="view-ticket-btn"
                          >

                            <Ticket
                              size={17}
                              strokeWidth={2.3}
                            />

                            View Tickets

                          </Link>

                        )}


                      {eventHasPassed && (

                        <>

                          <button
                            type="button"
                            className="review-ticket-btn"
                            onClick={() =>
                              navigate(
                                `/review/${booking.eventId}`,
                                {
                                  state: {
                                    booking,

                                    event: {
                                      id:
                                        booking.eventId,

                                      title:
                                        booking.eventTitle,

                                      date:
                                        booking.eventDate ||
                                        booking.date,

                                      venue:
                                        booking.eventVenue ||
                                        booking.venue,

                                      city:
                                        booking.eventCity ||
                                        booking.city,

                                      eventPoster:
                                        booking.eventPoster ||
                                        booking.image,
                                    },
                                  },
                                }
                              )
                            }
                          >

                            <Star
                              size={17}
                              strokeWidth={2.2}
                            />

                            Leave a Review

                          </button>


                          <button
                            type="button"
                            className="delete-past-ticket-btn"
                            disabled={
                              deletingBookingId ===
                              bookingId
                            }
                            onClick={() =>
                              deletePastBooking(
                                booking
                              )
                            }
                          >

                            <Trash2
                              size={17}
                              strokeWidth={2.2}
                            />

                            {deletingBookingId ===
                            bookingId
                              ? "Deleting..."
                              : "Delete Booking"}

                          </button>

                        </>

                      )}


                      {!eventHasPassed &&
                        !isRefunded &&
                        (
                          isRefundPending
                            ? (
                              <button
                                type="button"
                                className="refund-btn pending"
                                disabled
                              >
                                Refund Pending
                              </button>
                            )
                            : (
                              <button
                                type="button"
                                className="refund-btn"
                                onClick={() =>
                                  navigate(
                                    "/request-refund",
                                    {
                                      state: {
                                        booking,
                                      },
                                    }
                                  )
                                }
                              >

                                <RotateCcw
                                  size={17}
                                  strokeWidth={2.2}
                                />

                                Request Refund

                              </button>
                            )
                        )}


                      {isRefunded && (

                        <button
                          type="button"
                          className="view-ticket-btn disabled"
                          disabled
                        >
                          Tickets No Longer Valid
                        </button>

                      )}

                    </div>

                  </article>

                );

              }
            )}

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

              <PartyPopper
                size={22}
                strokeWidth={2.2}
              />

              Free Event Passes

            </h2>

            <p>
              Your free event registrations.
            </p>

          </div>

        </div>


        {freePasses.length === 0 ? (

          <div className="tickets-empty-section small-empty">

            <div className="empty-icon">

              <PartyPopper
                size={42}
                strokeWidth={2}
              />

            </div>

            <h3>
              No free passes
            </h3>

            <p>
              Free event registrations will
              appear here.
            </p>

          </div>

        ) : (

          <div className="tickets-grid">

            {freePasses.map(
              (pass) => {

                const passDate =
                  pass.eventDate ||
                  pass.date;

                const passed =
                  hasEventPassed(
                    passDate
                  );

                return (

                  <article
                    className={`ticket-card free-ticket-card ${
                      passed
                        ? "past-ticket"
                        : "current-ticket"
                    }`}
                    key={
                      pass.id ||
                      pass.attendanceId ||
                      pass.ticketId
                    }
                  >

                    <div className="ticket-card-top">

                      <div className="ticket-event-icon">

                        <PartyPopper
                          size={25}
                          strokeWidth={2}
                        />

                      </div>


                      {passed ? (

                        <span className="status passed">

                          <Clock
                            size={16}
                            strokeWidth={2.5}
                          />

                          Passed

                        </span>

                      ) : (

                        <span className="status confirmed">

                          <CheckCircle
                            size={16}
                            strokeWidth={2.5}
                          />

                          Confirmed

                        </span>

                      )}

                    </div>


                    <div className="ticket-event">

                      <h2>
                        {pass.eventTitle ||
                          "Free Event"}
                      </h2>

                      <div className="ticket-location">

                        {passDate && (

                          <span>

                            <CalendarDays
                              size={16}
                            />

                            {passDate}

                          </span>

                        )}


                        {(
                          pass.eventVenue ||
                          pass.venue
                        ) && (

                          <span>

                            <MapPin
                              size={16}
                            />

                            {pass.eventVenue ||
                              pass.venue}

                          </span>

                        )}

                      </div>

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

                    </div>


                    <div className="ticket-actions">

                      <Link
                        to={`/free-ticket/${
                          pass.id ||
                          pass.attendanceId
                        }`}
                        className="view-ticket-btn"
                      >

                        <Ticket
                          size={17}
                          strokeWidth={2.3}
                        />

                        View Free Pass

                      </Link>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default Tickets;