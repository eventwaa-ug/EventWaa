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
     BACKEND URL
  ========================================================= */

  const BACKEND_URL = "http://localhost:5000";

  /* =========================================================
     HOST EVENTS
  ========================================================= */

  const myEvents = (events || []).filter(
    (event) =>
      String(event.hostEmail || "").toLowerCase() ===
      String(user?.email || "").toLowerCase()
  );

  /* =========================================================
     CURRENT EVENT
  ========================================================= */

  const currentEvent =
    myEvents.length > 0
      ? [...myEvents].sort(
          (a, b) => Number(b.id) - Number(a.id)
        )[0]
      : null;

  /* =========================================================
     EVENT IMAGE
     
     THIS IS THE SAME LOGIC USED BY EventCard.jsx
  ========================================================= */

  const getImageUrl = () => {
    if (!currentEvent) {
      return "/default-event.jpg";
    }

    const image =
      currentEvent.eventPoster ||
      currentEvent.image;

    if (!image) {
      return "/default-event.jpg";
    }

    // Already a full URL
    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    // Relative path from backend
    return `${BACKEND_URL}${image}`;
  };

  /* =========================================================
     LOAD BOOKINGS
  ========================================================= */

  useEffect(() => {
    const loadDashboardData = async () => {
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
     ACTIVE BOOKING
  ========================================================= */

  const isActiveBooking = (booking) =>
    booking?.refundStatus !== "refunded";

  /* =========================================================
     HOST BOOKINGS
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
     GENERAL STATISTICS
  ========================================================= */

  const totalEvents =
    myEvents.length;

  const totalTicketsSold =
    hostBookings.length;

  const totalRevenue =
    myEvents.reduce(
      (total, event) =>
        total +
        Number(event.revenue || 0),
      0
    );

  const totalCapacity =
    myEvents.reduce(
      (total, event) =>
        total +
        Number(event.capacity || 0),
      0
    );

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
     CURRENT EVENT DATA
  ========================================================= */

  let soldTickets = 0;
  let checkedIn = 0;
  let ticketStats = [];

  if (currentEvent) {
    const currentEventBookings =
      bookings.filter(
        (booking) =>
          String(booking.eventId) ===
            String(currentEvent.id) &&
          isActiveBooking(booking)
      );

    soldTickets =
      currentEventBookings.length;

    checkedIn =
      checkedInTickets.filter(
        (ticket) =>
          String(ticket.eventId) ===
          String(currentEvent.id)
      ).length;

    ticketStats =
      (currentEvent.tickets || []).map(
        (ticket) => {
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

          const quantity =
            Number(ticket.quantity || 0);

          return {
            ...ticket,
            sold,
            remaining: Math.max(
              0,
              quantity - sold
            ),
          };
        }
      );
  }

  /* =========================================================
     REMAINING TICKETS
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
     STARTING PRICE
  ========================================================= */

  const ticketPrices =
    (currentEvent?.tickets || [])
      .map((ticket) =>
        Number(ticket.price || 0)
      )
      .filter(
        (price) => price > 0
      );

  const startingPrice =
    ticketPrices.length > 0
      ? Math.min(...ticketPrices)
      : Number(
          currentEvent?.price || 0
        );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="host-dashboard-layout">

      <HostSidebar />

      <main className="host-dashboard-content">

        {/* ===================================================
            WELCOME HEADER
        =================================================== */}

        <header className="dashboard-header">

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

            <button
              className="create-event-btn"
              onClick={() =>
                navigate("/create-event")
              }
            >
              + Create Event
            </button>


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

        </header>


        {/* ===================================================
            STATISTICS
        =================================================== */}

        <section className="stats-section">

          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon">
                📅
              </div>

              <div className="stat-content">

                <h2>
                  {totalEvents}
                </h2>

                <p>
                  Total Events
                </p>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                🎟️
              </div>

              <div className="stat-content">

                <h2>
                  {totalTicketsSold}
                </h2>

                <p>
                  Tickets Sold
                </p>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ✅
              </div>

              <div className="stat-content">

                <h2>
                  {checkedInCount}
                </h2>

                <p>
                  Checked In
                </p>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                👥
              </div>

              <div className="stat-content">

                <h2>
                  {totalCapacity.toLocaleString()}
                </h2>

                <p>
                  Total Capacity
                </p>

              </div>

            </div>


            <div className="stat-card revenue-stat">

              <div className="stat-icon">
                💰
              </div>

              <div className="stat-content">

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

          <div className="section-title">

            <div>

              <h2>
                Current Event
              </h2>

              <p>
                Your most recently created event.
              </p>

            </div>


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
              NO EVENT
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
               EVENT CARD
            ================================================= */

            <article className="dashboard-event-card">

              {/* =============================================
                  EVENT POSTER

                  THIS MATCHES EventCard.jsx
              ============================================= */}

              <div className="event-poster-wrapper">

                <img
                  src={getImageUrl()}
                  alt={
                    currentEvent.title ||
                    "Event poster"
                  }
                  className="event-poster"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/default-event.jpg";
                  }}
                />

                {/* EVENT TYPE */}

                <span
                  className={`event-type ${
                    currentEvent.eventType === "Free"
                      ? "free"
                      : "paid"
                  }`}
                >
                  {currentEvent.eventType === "Free"
                    ? "FREE"
                    : "PAID"}
                </span>


                {/* VERIFIED HOST */}

                {currentEvent.verifiedHost && (

                  <span className="verified-host">
                    ✅ Verified
                  </span>

                )}

              </div>


              {/* =============================================
                  EVENT BODY
              ============================================= */}

              <div className="event-main-info">

                <div className="event-card-header">

                  <div className="event-title-area">

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


                {/* ===========================================
                    EVENT DETAILS
                =========================================== */}

                <div className="event-details">

                  <p>
                    <span>📍</span>

                    <span>
                      {currentEvent.venue
                        ? `${currentEvent.venue}, `
                        : ""}

                      {currentEvent.city ||
                        currentEvent.location ||
                        "Location not specified"}
                    </span>

                  </p>


                  <p>

                    <span>📅</span>

                    <span>
                      {currentEvent.date ||
                        "Date not specified"}
                    </span>

                  </p>


                  <p>

                    <span>⏰</span>

                    <span>

                      {currentEvent.startTime ||
                        currentEvent.time ||
                        "Time not specified"}

                      {currentEvent.endTime
                        ? ` - ${currentEvent.endTime}`
                        : ""}

                    </span>

                  </p>


                  <p>

                    <span>🏷️</span>

                    <span>
                      {currentEvent.category ||
                        "Uncategorized"}
                    </span>

                  </p>


                  <p>

                    <span>
                      {currentEvent.eventType ===
                      "Free"
                        ? "🎉"
                        : "💰"}
                    </span>

                    <span>

                      {currentEvent.eventType ===
                      "Free"
                        ? "Free Event"
                        : `Starting Price: UGX ${startingPrice.toLocaleString()}`}

                    </span>

                  </p>


                  <p>

                    <span>👥</span>

                    <span>

                      Capacity:{" "}

                      {Number(
                        currentEvent.capacity || 0
                      ).toLocaleString()}

                    </span>

                  </p>

                </div>


                {/* ===========================================
                    PERFORMANCE
                =========================================== */}

                <div className="event-performance">

                  <div className="performance-card sold-card">

                    <div className="performance-icon">
                      🎟️
                    </div>

                    <div>

                      <span>
                        Tickets Sold
                      </span>

                      <strong>
                        {soldTickets}
                      </strong>

                    </div>

                  </div>


                  <div className="performance-card checked-card">

                    <div className="performance-icon">
                      ✅
                    </div>

                    <div>

                      <span>
                        Checked In
                      </span>

                      <strong>
                        {checkedIn}
                      </strong>

                    </div>

                  </div>


                  <div className="performance-card remaining-card">

                    <div className="performance-icon">
                      ⏳
                    </div>

                    <div>

                      <span>
                        Remaining
                      </span>

                      <strong>
                        {currentEventRemaining}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* ===========================================
                    TICKET TYPES
                =========================================== */}

                {ticketStats.length > 0 && (

                  <div className="ticket-breakdown-card">

                    <div className="ticket-breakdown-header">

                      <div>

                        <h4>
                          🎟️ Ticket Types
                        </h4>

                        <p>
                          Ticket sales breakdown
                        </p>

                      </div>

                    </div>


                    <div className="ticket-breakdown-grid">

                      {ticketStats.map(
                        (ticket, index) => (

                          <div
                            className="ticket-breakdown-item"
                            key={
                              ticket.name ||
                              index
                            }
                          >

                            <div className="ticket-type-header">

                              <strong>
                                {ticket.name ||
                                  "Ticket"}
                              </strong>

                            </div>


                            <div className="ticket-type-numbers">

                              <div>

                                <span>
                                  Sold
                                </span>

                                <strong>
                                  {ticket.sold}
                                </strong>

                              </div>


                              <div>

                                <span>
                                  Remaining
                                </span>

                                <strong>
                                  {ticket.remaining}
                                </strong>

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>


              {/* =============================================
                  ACTION BAR
              ============================================= */}

              <div className="event-actions">

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