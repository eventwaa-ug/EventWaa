import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { useContext, useEffect, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import HostSidebar from "../components/HostSidebar";

function Dashboard() {

  const navigate = useNavigate();

  const { events, deleteEvent } = useContext(EventContext);
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  const [bookings, setBookings] = useState([]);

  const [checkedInTickets, setCheckedInTickets] = useState([]);


  /* =========================================================
     FIND ALL EVENTS BELONGING TO THIS HOST
  ========================================================= */

  const myEvents = (events || []).filter(
    (event) =>
      String(event.hostEmail || "").toLowerCase() ===
      String(user?.email || "").toLowerCase()
  );


  /* =========================================================
     FIND CURRENT EVENT
     
     The newest event is treated as the current event.
  ========================================================= */

  const currentEvent =
    myEvents.length > 0
      ? [...myEvents].sort(
          (a, b) => Number(b.id) - Number(a.id)
        )[0]
      : null;


  /* =========================================================
     LOAD BOOKINGS + CHECKED-IN TICKETS
  ========================================================= */

  useEffect(() => {

    const loadDashboardData = async () => {

      /* -------------------------------------------------------
         LOAD BOOKINGS
      ------------------------------------------------------- */

      try {

        const bookingsResponse = await fetch(
          "http://localhost:5000/bookings"
        );

        if (!bookingsResponse.ok) {

          throw new Error(
            `Bookings request failed: ${bookingsResponse.status}`
          );

        }

        const bookingsData =
          await bookingsResponse.json();

        setBookings(
          Array.isArray(bookingsData)
            ? bookingsData
            : []
        );

      } catch (error) {

        console.error(
          "BOOKINGS LOAD ERROR:",
          error
        );

        setBookings([]);

      }


      /* -------------------------------------------------------
         LOAD CHECKED-IN TICKETS
      ------------------------------------------------------- */

      try {

        const checkedInResponse = await fetch(
          "http://localhost:5000/bookings/checked-in"
        );

        if (!checkedInResponse.ok) {

          throw new Error(
            `Checked-in request failed: ${checkedInResponse.status}`
          );

        }

        const checkedInData =
          await checkedInResponse.json();

        setCheckedInTickets(
          Array.isArray(checkedInData)
            ? checkedInData
            : []
        );

      } catch (error) {

        console.error(
          "CHECKED-IN LOAD ERROR:",
          error
        );

        setCheckedInTickets([]);

      }

    };


    loadDashboardData();

  }, []);


  /* =========================================================
     UNREAD MESSAGES
  ========================================================= */

  useEffect(() => {

    if (!user?.id) return;


    const loadUnread = async () => {

      try {

        const response = await fetch(
          `http://localhost:5000/messages/unread/${user.id}`
        );


        if (!response.ok) return;


        const data = await response.json();


        setUnreadCount(
          Number(data?.unread || 0)
        );


      } catch (error) {

        console.error(
          "UNREAD MESSAGE ERROR:",
          error
        );

      }

    };


    loadUnread();


    const interval = setInterval(
      loadUnread,
      3000
    );


    return () =>
      clearInterval(interval);

  }, [user]);


  /* =========================================================
     HELPER
     
     A booking object represents ONE actual ticket because
     /bookings creates an individual booking for every ticket.
     
     Refunded tickets should no longer count as sold.
  ========================================================= */

  const isActiveBooking = (booking) => {

    return (
      booking?.refundStatus !== "refunded"
    );

  };


  /* =========================================================
     HOST BOOKINGS
     
     Only bookings belonging to this host's events.
  ========================================================= */

  const hostBookings = bookings.filter(
    (booking) => {

      const belongsToHost = myEvents.some(
        (event) =>
          String(event.id) ===
          String(booking.eventId)
      );

      return (
        belongsToHost &&
        isActiveBooking(booking)
      );

    }
  );


  /* =========================================================
     DASHBOARD STATISTICS
  ========================================================= */

  const totalEvents =
    myEvents.length;


  /* ---------------------------------------------------------
     TICKETS SOLD
     
     IMPORTANT:
     Each object in bookings.json represents ONE ticket.
     
     DO NOT use:
     
     booking.quantity
     
     because your backend creates individual ticket records.
  --------------------------------------------------------- */

  const totalTicketsSold =
    hostBookings.length;


  /* ---------------------------------------------------------
     REVENUE
     
     Revenue comes from the event records because your backend
     updates event.revenue after booking/payment processing.
  --------------------------------------------------------- */

  const totalRevenue =
    myEvents.reduce(
      (total, event) =>
        total +
        Number(event.revenue || 0),
      0
    );


  /* ---------------------------------------------------------
     CAPACITY
  --------------------------------------------------------- */

  const totalCapacity =
    myEvents.reduce(
      (total, event) =>
        total +
        Number(event.capacity || 0),
      0
    );


  /* ---------------------------------------------------------
     CHECKED-IN COUNT
     
     Only count checked-in tickets belonging to this host.
  --------------------------------------------------------- */

  const checkedInCount =
    checkedInTickets.filter(
      (ticket) =>
        myEvents.some(
          (event) =>
            String(event.id) ===
            String(ticket.eventId)
        )
    ).length;


  /* =========================================================
     CURRENT EVENT CALCULATIONS
  ========================================================= */

  let soldTickets = 0;

  let checkedIn = 0;

  let ticketStats = [];


  if (currentEvent) {

    /* -------------------------------------------------------
       BOOKINGS FOR CURRENT EVENT
    ------------------------------------------------------- */

    const currentEventBookings =
      bookings.filter(
        (booking) =>
          String(booking.eventId) ===
            String(currentEvent.id) &&
          isActiveBooking(booking)
      );


    /* -------------------------------------------------------
       TOTAL TICKETS SOLD FOR CURRENT EVENT
       
       Every booking record = one ticket.
    ------------------------------------------------------- */

    soldTickets =
      currentEventBookings.length;


    /* -------------------------------------------------------
       CHECKED-IN TICKETS
    ------------------------------------------------------- */

    checkedIn =
      checkedInTickets.filter(
        (ticket) =>
          String(ticket.eventId) ===
          String(currentEvent.id)
      ).length;


    /* -------------------------------------------------------
       TICKET TYPES
    ------------------------------------------------------- */

    ticketStats =
      (currentEvent.tickets || []).map(
        (ticket) => {

          /* -----------------------------------------------
             Count actual booking records for this ticket
             type.
          ------------------------------------------------ */

          const sold =
            currentEventBookings.filter(
              (booking) =>
                String(
                  booking.ticketType || ""
                ).toLowerCase() ===
                String(
                  ticket.name || ""
                ).toLowerCase()
            ).length;


          /* -----------------------------------------------
             Original ticket quantity
          ------------------------------------------------ */

          const originalQuantity =
            Number(
              ticket.quantity || 0
            );


          /* -----------------------------------------------
             Remaining
             
             We calculate this from actual bookings instead
             of relying only on the JSON remaining field.
          ------------------------------------------------ */

          const remaining =
            Math.max(
              0,
              originalQuantity - sold
            );


          return {

            ...ticket,

            sold,

            remaining

          };

        }
      );

  }


  /* =========================================================
     CURRENT EVENT REMAINING
  ========================================================= */

  const currentEventRemaining =
    currentEvent
      ? Math.max(
          0,
          Number(
            currentEvent.capacity || 0
          ) - soldTickets
        )
      : 0;


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="host-dashboard-layout">


      {/* =====================================================
          HOST SIDEBAR / HAMBURGER
      ===================================================== */}

      <HostSidebar />


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="host-dashboard-content">


        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="dashboard-header">


          <div className="dashboard-welcome">

            <div className="welcome-heading">

              <span>
                Welcome back,
              </span>

              <strong>
                {user?.name || "Organizer"} 👋
              </strong>

            </div>


            <p>

              Manage your events and track
              their performance.

            </p>

          </div>


          <div className="dashboard-header-actions">


            {/* CREATE EVENT */}

            <button

              className="create-event-btn"

              onClick={() =>
                navigate("/create-event")
              }

            >

              + Create Event

            </button>


            {/* INBOX */}

            <button

              className="inbox-btn"

              onClick={() =>
                navigate("/host-messages")
              }

            >

              💬 Inbox


              {unreadCount > 0 && (

                <span className="inbox-badge">

                  {unreadCount}

                </span>

              )}

            </button>


          </div>

        </div>


        {/* ===================================================
            STATISTICS
        =================================================== */}

        <section className="stats-section">


          <div className="stats-grid">


            {/* TOTAL EVENTS */}

            <div className="stat-card">

              <span className="stat-icon">
                📅
              </span>

              <div>

                <h2>
                  {totalEvents}
                </h2>

                <p>
                  Total Events
                </p>

              </div>

            </div>


            {/* TICKETS SOLD */}

            <div className="stat-card">

              <span className="stat-icon">
                🎟️
              </span>

              <div>

                <h2>
                  {totalTicketsSold}
                </h2>

                <p>
                  Tickets Sold
                </p>

              </div>

            </div>


            {/* CHECKED IN */}

            <div className="stat-card">

              <span className="stat-icon">
                ✅
              </span>

              <div>

                <h2>
                  {checkedInCount}
                </h2>

                <p>
                  Checked In
                </p>

              </div>

            </div>


            {/* CAPACITY */}

            <div className="stat-card">

              <span className="stat-icon">
                👥
              </span>

              <div>

                <h2>
                  {totalCapacity.toLocaleString()}
                </h2>

                <p>
                  Total Capacity
                </p>

              </div>

            </div>


            {/* REVENUE */}

            <div className="stat-card revenue-stat">

              <span className="stat-icon">
                💰
              </span>

              <div>

                <h2>

                  UGX{" "}

                  {totalRevenue.toLocaleString()}

                </h2>

                <p>
                  Revenue
                </p>

              </div>

            </div>


          </div>

        </section>


        {/* ===================================================
            CURRENT EVENT
        =================================================== */}

        <section className="my-events">


          {/* SECTION HEADER */}

          <div className="section-title">


            <div>

              <h2>
                Current Event
              </h2>

              <p>
                Your most recently created event.
              </p>

            </div>


            {/* VIEW ALL */}

            <button

              className="view-all-events-btn"

              onClick={() =>
                navigate("/host-events")
              }

            >

              View All Events →

            </button>


          </div>


          {/* =================================================
              NO EVENTS
          ================================================= */}

          {!currentEvent ? (

            <div className="empty-events">


              <div className="empty-events-icon">
                📅
              </div>


              <h3>
                No events published yet
              </h3>


              <p>

                Create your first event
                and start selling tickets.

              </p>


              <button

                className="create-event-btn"

                onClick={() =>
                  navigate("/create-event")
                }

              >

                + Create Event

              </button>


            </div>

          ) : (


            /* =================================================
               CURRENT EVENT CARD
            ================================================= */

            <article

              className="dashboard-event-card"

              key={currentEvent.id}

            >


              {/* =============================================
                  EVENT INFORMATION
              ============================================= */}

              <div className="event-main-info">


                <div className="event-card-header">


                  <div>


                    <h3>
                      {currentEvent.title}
                    </h3>


                    <span

                      className={
                        currentEvent.status ===
                        "published"

                          ? "event-status published"

                          : "event-status"
                      }

                    >

                      {currentEvent.status ||
                        "Published"}

                    </span>


                  </div>


                </div>


                {/* EVENT DETAILS */}

                <div className="event-details">


                  <p>

                    📍{" "}

                    {currentEvent.venue
                      ? `${currentEvent.venue}, `
                      : ""}

                    {currentEvent.city ||
                      currentEvent.location ||
                      "Location not specified"}

                  </p>


                  <p>

                    📅{" "}

                    {currentEvent.date ||
                      "Date not specified"}

                  </p>


                  <p>

                    ⏰{" "}

                    {currentEvent.startTime ||
                      currentEvent.time ||
                      "Time not specified"}

                    {currentEvent.endTime
                      ? ` - ${currentEvent.endTime}`
                      : ""}

                  </p>


                  <p>

                    🏷️{" "}

                    {currentEvent.category ||
                      "Uncategorized"}

                  </p>


                  {currentEvent.eventType ===
                  "Free" ? (

                    <p>

                      🎉 Free Event

                    </p>

                  ) : (

                    <p>

                      💰 Starting Price:{" "}

                      UGX{" "}

                      {currentEvent.tickets?.length > 0

                        ? Math.min(
                            ...currentEvent.tickets
                              .map(
                                (ticket) =>
                                  Number(
                                    ticket.price || 0
                                  )
                              )
                              .filter(
                                (price) =>
                                  price > 0
                              )
                          ).toLocaleString()

                        : Number(
                            currentEvent.price || 0
                          ).toLocaleString()}

                    </p>

                  )}


                  <p>

                    👥 Capacity:{" "}

                    {Number(
                      currentEvent.capacity || 0
                    ).toLocaleString()}

                  </p>


                </div>


                {/* =========================================
                    EVENT PERFORMANCE
                ========================================= */}

                <div className="event-performance">


                  <div>

                    <span>
                      🎟️ Tickets Sold
                    </span>

                    <strong>
                      {soldTickets}
                    </strong>

                  </div>


                  <div>

                    <span>
                      ✅ Checked In
                    </span>

                    <strong>
                      {checkedIn}
                    </strong>

                  </div>


                  <div>

                    <span>
                      ⏳ Remaining
                    </span>

                    <strong>
                      {currentEventRemaining}
                    </strong>

                  </div>


                </div>


                {/* =========================================
                    TICKET BREAKDOWN
                ========================================= */}

                {ticketStats.length > 0 && (

                  <div className="ticket-breakdown-card">


                    <h4>
                      🎟️ Ticket Types
                    </h4>


                    <div className="ticket-breakdown-grid">


                      {ticketStats.map(
                        (ticket) => (

                          <div

                            key={ticket.name}

                            className="ticket-breakdown-item"

                          >

                            <strong>
                              {ticket.name}
                            </strong>


                            <span>

                              Sold:{" "}

                              {ticket.sold}

                            </span>


                            <span>

                              Remaining:{" "}

                              {ticket.remaining}

                            </span>


                          </div>

                        )
                      )}


                    </div>

                  </div>

                )}


              </div>


              {/* =============================================
                  EVENT ACTIONS
              ============================================= */}

              <div className="event-actions">


                {/* EDIT */}

                <button

                  className="edit-btn"

                  onClick={() =>
                    navigate(
                      "/create-event",
                      {
                        state: {
                          event: currentEvent
                        }
                      }
                    )
                  }

                >

                  ✏️ Edit

                </button>


                {/* DUPLICATE */}

                <button

                  className="duplicate-btn"

                  onClick={() =>
                    navigate(
                      "/create-event",
                      {
                        state: {
                          duplicateEvent:
                            currentEvent
                        }
                      }
                    )
                  }

                >

                  📋 Duplicate

                </button>


                {/* SCAN */}

                <button

                  className="scan-btn"

                  onClick={() =>
                    navigate(
                      `/scanner/${currentEvent.id}`
                    )
                  }

                >

                  🎟️ Scan Tickets

                </button>


                {/* ATTENDEES */}

                <button

                  className="attendees-btn"

                  onClick={() =>
                    navigate(
                      `/attendees/${currentEvent.id}`
                    )
                  }

                >

                  👥 View Attendees

                </button>


                {/* DELETE */}

                <button

                  className="delete-btn"

                  onClick={() =>
                    deleteEvent(
                      currentEvent.id
                    )
                  }

                >

                  🗑️ Delete

                </button>


              </div>


            </article>

          )}


        </section>


      </main>

    </div>

  );

}


export default Dashboard;