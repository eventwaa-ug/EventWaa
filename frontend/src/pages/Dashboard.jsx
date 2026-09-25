import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { useContext, useEffect, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import HostSidebar from "../components/HostSidebar";

import {
  CalendarDays,
  Ticket,
  CheckCircle2,
  Users,
  Wallet,
  MessageCircle,
  Plus,
  MapPin,
  Clock3,
  Tag,
  Gift,
  BadgeCheck,
  Hourglass,
  Pencil,
  Copy,
  ScanLine,
  Trash2,
  ArrowRight,
  Share2,
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();

  const { events, deleteEvent } =
    useContext(EventContext);

  const { user } = useAuth();

  /* =========================================================
     BACKEND URL
  ========================================================= */

  const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL;

  /* =========================================================
     DASHBOARD STATE
  ========================================================= */

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [bookings, setBookings] =
    useState([]);

  const [checkedInTickets, setCheckedInTickets] =
    useState([]);

  const [cancellingEvent, setCancellingEvent] =
    useState(false);

  /* =========================================================
     SHARE STATE
  ========================================================= */

  const [shareMessage, setShareMessage] =
    useState("");

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
     EVENT DATE
  ========================================================= */

  const getEventDate = (event) => {
    if (!event) return null;

    const rawDate =
      event.date ||
      event.eventDate ||
      event.startDate;

    if (!rawDate) {
      return null;
    }

    /*
     * If the backend already provides a full
     * date/time value, use it directly.
     */
    if (
      typeof rawDate === "string" &&
      rawDate.includes("T")
    ) {
      const directDate = new Date(rawDate);

      if (!Number.isNaN(directDate.getTime())) {
        return directDate;
      }
    }

    let dateString =
      String(rawDate).trim();

    /*
     * Support DD/MM/YYYY if returned.
     */
    const slashMatch =
      dateString.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );

    if (slashMatch) {
      const [, day, month, year] =
        slashMatch;

      dateString =
        `${year}-${month.padStart(
          2,
          "0"
        )}-${day.padStart(
          2,
          "0"
        )}`;
    }

    /*
     * Use event start time where available.
     */
    const rawTime =
      event.startTime ||
      event.time ||
      "00:00";

    let timeString =
      String(rawTime).trim();

    /*
     * Convert 12-hour time to 24-hour time.
     */
    const twelveHourMatch =
      timeString.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
      );

    if (twelveHourMatch) {
      let hour =
        Number(twelveHourMatch[1]);

      const minute =
        twelveHourMatch[2];

      const period =
        twelveHourMatch[3].toUpperCase();

      if (
        period === "PM" &&
        hour !== 12
      ) {
        hour += 12;
      }

      if (
        period === "AM" &&
        hour === 12
      ) {
        hour = 0;
      }

      timeString =
        `${String(hour).padStart(
          2,
          "0"
        )}:${minute}`;
    }

    const combinedDate =
      new Date(
        `${dateString}T${timeString}`
      );

    if (
      !Number.isNaN(
        combinedDate.getTime()
      )
    ) {
      return combinedDate;
    }

    /*
     * Final fallback.
     */
    const fallbackDate =
      new Date(rawDate);

    if (
      !Number.isNaN(
        fallbackDate.getTime()
      )
    ) {
      return fallbackDate;
    }

    return null;
  };

  /* =========================================================
     EVENT STATUS
  ========================================================= */

  const isCancelled =
    String(
      currentEvent?.status || ""
    ).toLowerCase() ===
    "cancelled";

  const isPastEvent = (() => {
    if (!currentEvent) {
      return false;
    }

    const eventDate =
      getEventDate(currentEvent);

    if (!eventDate) {
      return false;
    }

    return eventDate < new Date();
  })();

  /* =========================================================
     EVENT IMAGE
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

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${BACKEND_URL}${image}`;
  };

  /* =========================================================
     LOAD BOOKINGS
  ========================================================= */

  useEffect(() => {
    const loadDashboardData =
      async () => {
        try {
          const bookingsResponse =
            await fetch(
              `${BACKEND_URL}/bookings`
            );

          if (
            !bookingsResponse.ok
          ) {
            throw new Error(
              `Bookings request failed: ${bookingsResponse.status}`
            );
          }

          const bookingsData =
            await bookingsResponse.json();

          setBookings(
            Array.isArray(
              bookingsData
            )
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
          const checkedInResponse =
            await fetch(
              `${BACKEND_URL}/bookings/checked-in`
            );

          if (
            !checkedInResponse.ok
          ) {
            throw new Error(
              `Checked-in request failed: ${checkedInResponse.status}`
            );
          }

          const checkedInData =
            await checkedInResponse.json();

          setCheckedInTickets(
            Array.isArray(
              checkedInData
            )
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
  }, [BACKEND_URL]);

  /* =========================================================
     UNREAD MESSAGES
  ========================================================= */

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadUnread =
      async () => {
        try {
          const response =
            await fetch(
              `${BACKEND_URL}/messages/unread/${user.id}`
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          setUnreadCount(
            Number(
              data?.unread || 0
            )
          );
        } catch (error) {
          console.error(
            "UNREAD MESSAGE ERROR:",
            error
          );
        }
      };

    loadUnread();

    const interval =
      setInterval(
        loadUnread,
        3000
      );

    return () =>
      clearInterval(interval);
  }, [user, BACKEND_URL]);

  /* =========================================================
     ACTIVE BOOKING
  ========================================================= */

  const isActiveBooking =
    (booking) =>
      booking?.refundStatus !==
      "refunded";

  /* =========================================================
     CANCEL EVENT
  ========================================================= */

  const handleCancelEvent =
    async () => {
      if (!currentEvent) {
        return;
      }

      /*
       * Already cancelled.
       */
      if (isCancelled) {
        return;
      }

      /*
       * Past events cannot be cancelled.
       */
      if (isPastEvent) {
        window.alert(
          "Past events cannot be cancelled."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to cancel "${currentEvent.title}"?\n\n` +
            `This will cancel the event and process eligible ` +
            `refunds for customers.\n\n` +
            `Cancelled tickets will no longer be valid.\n\n` +
            `This action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      if (!user?.email) {
        window.alert(
          "Your account email could not be found. Please log in again and try again."
        );

        return;
      }

      setCancellingEvent(true);

      try {
        const response =
          await fetch(
            `${BACKEND_URL}/events/${currentEvent.id}/cancel`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                hostEmail:
                  user.email,

                reason:
                  "Event cancelled by host",
              }),
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch (error) {
          console.error(
            "CANCEL EVENT RESPONSE ERROR:",
            error
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to cancel the event."
          );
        }

        window.alert(
          data?.message ||
            "Event cancelled successfully."
        );

        /*
         * Reload so EventContext receives
         * the updated cancelled status.
         */
        window.location.reload();
      } catch (error) {
        console.error(
          "EVENT CANCELLATION ERROR:",
          error
        );

        window.alert(
          error?.message ||
            "Something went wrong while cancelling the event."
        );

        setCancellingEvent(false);
      }
    };

  /* =========================================================
     SHARE MESSAGE
  ========================================================= */

  const showShareMessage =
    (message) => {
      setShareMessage(message);

      setTimeout(() => {
        setShareMessage("");
      }, 3000);
    };

  /* =========================================================
     COPY EVENT URL
  ========================================================= */

  const copyEventUrl =
    async (eventUrl) => {
      /*
       * Modern clipboard API.
       */
      try {
        if (
          navigator.clipboard &&
          typeof navigator.clipboard.writeText ===
            "function"
        ) {
          await navigator.clipboard.writeText(
            eventUrl
          );

          showShareMessage(
            "Event link copied to clipboard."
          );

          return true;
        }
      } catch (error) {
        console.error(
          "MODERN CLIPBOARD ERROR:",
          error
        );
      }

      /*
       * Older browser fallback.
       */
      try {
        const textArea =
          document.createElement(
            "textarea"
          );

        textArea.value =
          eventUrl;

        textArea.setAttribute(
          "readonly",
          ""
        );

        textArea.style.position =
          "fixed";

        textArea.style.opacity =
          "0";

        textArea.style.pointerEvents =
          "none";

        document.body.appendChild(
          textArea
        );

        textArea.focus();
        textArea.select();

        const copied =
          document.execCommand(
            "copy"
          );

        document.body.removeChild(
          textArea
        );

        if (copied) {
          showShareMessage(
            "Event link copied to clipboard."
          );

          return true;
        }
      } catch (error) {
        console.error(
          "LEGACY CLIPBOARD ERROR:",
          error
        );
      }

      return false;
    };

  /* =========================================================
     SHARE EVENT
  ========================================================= */

  const handleShareEvent =
    async () => {
      if (!currentEvent) {
        return;
      }

      /*
       * Cancelled events should not be shared
       * from the Host Dashboard.
       */
      if (isCancelled) {
        return;
      }

      /*
       * Prefer the event slug.
       *
       * Numeric ID remains the fallback so
       * older events continue to work.
       */
      const eventIdentifier =
        currentEvent.slug ||
        currentEvent.eventSlug ||
        currentEvent.id;

      if (
        eventIdentifier ===
        undefined ||
        eventIdentifier ===
        null ||
        String(
          eventIdentifier
        ).trim() === ""
      ) {
        showShareMessage(
          "Unable to create the event link."
        );

        return;
      }

      /*
       * Generate the public EventWaa URL.
       */
      const eventUrl =
        `${window.location.origin}/events/${encodeURIComponent(
          String(eventIdentifier)
        )}`;

      const shareTitle =
        currentEvent.title ||
        "EventWaa Event";

      const shareText =
        `Check out ${shareTitle} on EventWaa.`;

      /*
       * Native Web Share API.
       *
       * This opens the phone's native
       * sharing sheet on supported devices.
       */
      if (
        navigator.share &&
        typeof navigator.share ===
          "function"
      ) {
        try {
          await navigator.share({
            title:
              shareTitle,

            text:
              shareText,

            url:
              eventUrl,
          });

          return;
        } catch (error) {
          /*
           * The user closed/cancelled
           * the native share sheet.
           */
          if (
            error?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "NATIVE SHARE ERROR:",
            error
          );

          /*
           * Continue to clipboard
           * fallback if native sharing
           * failed for another reason.
           */
        }
      }

      /*
       * Clipboard fallback.
       */
      const copied =
        await copyEventUrl(
          eventUrl
        );

      /*
       * If clipboard copying is not
       * available, show the URL so
       * the user can manually copy it.
       */
      if (!copied) {
        showShareMessage(
          `Share this event: ${eventUrl}`
        );
      }
    };

  /* =========================================================
     HOST BOOKINGS
  ========================================================= */

  const hostBookings =
    bookings.filter(
      (booking) => {
        const belongsToHost =
          myEvents.some(
            (event) =>
              String(event.id) ===
              String(
                booking.eventId
              )
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
        Number(
          event.revenue || 0
        ),
      0
    );

  const totalCapacity =
    myEvents.reduce(
      (total, event) =>
        total +
        Number(
          event.capacity || 0
        ),
      0
    );

  const checkedInCount =
    checkedInTickets.filter(
      (ticket) =>
        myEvents.some(
          (event) =>
            String(event.id) ===
            String(
              ticket.eventId
            )
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
          String(
            booking.eventId
          ) ===
            String(
              currentEvent.id
            ) &&
          isActiveBooking(booking)
      );

    soldTickets =
      currentEventBookings.length;

    checkedIn =
      checkedInTickets.filter(
        (ticket) =>
          String(
            ticket.eventId
          ) ===
          String(
            currentEvent.id
          )
      ).length;

    ticketStats =
      (
        currentEvent.tickets ||
        []
      ).map(
        (ticket) => {
          const sold =
            currentEventBookings.filter(
              (booking) =>
                String(
                  booking.ticketType ||
                    ""
                ).toLowerCase() ===
                String(
                  ticket.name ||
                    ""
                ).toLowerCase()
            ).length;

          const quantity =
            Number(
              ticket.quantity || 0
            );

          return {
            ...ticket,

            sold,

            remaining:
              Math.max(
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
            currentEvent.capacity ||
              0
          ) - soldTickets
        )
      : 0;

  /* =========================================================
     STARTING PRICE
  ========================================================= */

  const ticketPrices =
    (
      currentEvent?.tickets ||
      []
    )
      .map((ticket) =>
        Number(
          ticket.price || 0
        )
      )
      .filter(
        (price) => price > 0
      );

  const startingPrice =
    ticketPrices.length > 0
      ? Math.min(
          ...ticketPrices
        )
      : Number(
          currentEvent?.price ||
            0
        );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="host-dashboard-layout">

      <HostSidebar />

      <main className="host-dashboard-content">

        {/* ===================================================
            SHARE TOAST
        =================================================== */}

        {shareMessage && (
          <div
            className="share-toast"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              size={18}
            />

            <span>
              {shareMessage}
            </span>
          </div>
        )}

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
                {user?.name ||
                  "Organizer"}
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
                navigate(
                  "/create-event"
                )
              }
            >
              <Plus
                size={19}
                strokeWidth={2.5}
              />

              <span>
                Create Event
              </span>
            </button>

            <button
              className="inbox-btn"
              onClick={() =>
                navigate(
                  "/host-messages"
                )
              }
            >
              <MessageCircle
                size={19}
              />

              <span>
                Inbox
              </span>

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

            <div className="stat-card events-stat">

              <div className="stat-icon">
                <CalendarDays />
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


            <div className="stat-card tickets-stat">

              <div className="stat-icon">
                <Ticket />
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


            <div className="stat-card checked-stat">

              <div className="stat-icon">
                <CheckCircle2 />
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


            <div className="stat-card capacity-stat">

              <div className="stat-icon">
                <Users />
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
                <Wallet />
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
                navigate(
                  "/host-events"
                )
              }
            >
              <span>
                View All Events
              </span>

              <ArrowRight
                size={17}
              />

            </button>

          </div>


          {/* =================================================
              NO EVENT
          ================================================= */}

          {!currentEvent ? (

            <div className="empty-events">

              <div className="empty-events-icon">
                <CalendarDays />
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
                  navigate(
                    "/create-event"
                  )
                }
              >
                <Plus size={19} />

                <span>
                  Create Event
                </span>

              </button>

            </div>

          ) : (

            <article className="dashboard-event-card">

              {/* =============================================
                  EVENT POSTER
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

                <span
                  className={`event-type ${
                    currentEvent.eventType ===
                    "Free"
                      ? "free"
                      : "paid"
                  }`}
                >
                  {currentEvent.eventType ===
                  "Free"
                    ? "FREE"
                    : "PAID"}
                </span>

                {currentEvent.verifiedHost && (
                  <span className="verified-host">

                    <BadgeCheck
                      size={15}
                    />

                    Verified

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
                          : currentEvent.status ===
                            "cancelled"
                          ? "event-status cancelled"
                          : "event-status"
                      }
                    >
                      {isCancelled
                        ? "Cancelled"
                        : currentEvent.status ||
                          "Published"}
                    </span>

                  </div>

                </div>


                {/* EVENT DETAILS */}

                <div className="event-details">

                  <p>

                    <MapPin />

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

                    <CalendarDays />

                    <span>
                      {currentEvent.date ||
                        "Date not specified"}
                    </span>

                  </p>


                  <p>

                    <Clock3 />

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

                    <Tag />

                    <span>
                      {currentEvent.category ||
                        "Uncategorized"}
                    </span>

                  </p>


                  <p>

                    {currentEvent.eventType ===
                    "Free" ? (
                      <Gift />
                    ) : (
                      <Wallet />
                    )}

                    <span>

                      {currentEvent.eventType ===
                      "Free"
                        ? "Free Event"
                        : `Starting Price: UGX ${startingPrice.toLocaleString()}`}

                    </span>

                  </p>


                  <p>

                    <Users />

                    <span>

                      Capacity:{" "}
                      {Number(
                        currentEvent.capacity ||
                          0
                      ).toLocaleString()}

                    </span>

                  </p>

                </div>


                {/* PERFORMANCE */}

                <div className="event-performance">

                  <div className="performance-card sold-card">

                    <div className="performance-icon">
                      <Ticket />
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
                      <CheckCircle2 />
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
                      <Hourglass />
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


                {/* TICKET TYPES */}

                {ticketStats.length > 0 && (

                  <div className="ticket-breakdown-card">

                    <div className="ticket-breakdown-header">

                      <div>

                        <h4>

                          <Ticket
                            size={19}
                          />

                          Ticket Types

                        </h4>

                        <p>
                          Ticket sales breakdown
                        </p>

                      </div>

                    </div>


                    <div className="ticket-breakdown-grid">

                      {ticketStats.map(
                        (
                          ticket,
                          index
                        ) => (

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

                {/* EDIT */}

                <button
                  className="edit-btn"
                  onClick={() =>
                    navigate(
                      "/create-event",
                      {
                        state: {
                          event:
                            currentEvent,
                        },
                      }
                    )
                  }
                  disabled={isCancelled}
                  title={
                    isCancelled
                      ? "Cancelled events cannot be edited."
                      : "Edit event"
                  }
                >

                  <Pencil
                    size={17}
                  />

                  <span>
                    Edit
                  </span>

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
                            currentEvent,
                        },
                      }
                    )
                  }
                  disabled={isCancelled}
                  title={
                    isCancelled
                      ? "Cancelled events cannot be duplicated."
                      : "Duplicate event"
                  }
                >

                  <Copy
                    size={17}
                  />

                  <span>
                    Duplicate
                  </span>

                </button>


                {/* SCAN */}

                <button
                  className="scan-btn"
                  onClick={() =>
                    navigate(
                      `/scanner/${currentEvent.id}`
                    )
                  }
                  disabled={isCancelled}
                  title={
                    isCancelled
                      ? "Tickets for cancelled events cannot be scanned."
                      : "Scan tickets"
                  }
                >

                  <ScanLine
                    size={17}
                  />

                  <span>
                    Scan Tickets
                  </span>

                </button>


                {/* ATTENDEES */}

                <button
                  className="attendees-btn"
                  onClick={() =>
                    navigate(
                      `/attendees/${currentEvent.id}`
                    )
                  }
                  disabled={isCancelled}
                  title={
                    isCancelled
                      ? "Attendee management is unavailable for cancelled events."
                      : "View attendees"
                  }
                >

                  <Users
                    size={17}
                  />

                  <span>
                    View Attendees
                  </span>

                </button>


                {/* SHARE */}

                <button
                  className="share-btn"
                  onClick={
                    handleShareEvent
                  }
                  disabled={
                    isCancelled
                  }
                  title={
                    isCancelled
                      ? "Cancelled events cannot be shared."
                      : "Share event"
                  }
                >

                  <Share2
                    size={17}
                  />

                  <span>
                    Share
                  </span>

                </button>


                {/* =================================================
                    CANCEL EVENT

                    IMPORTANT:
                    Only show Cancel Event when:
                    1. There is an event
                    2. The event is NOT cancelled
                    3. The event has NOT passed
                ================================================= */}

                {!isCancelled &&
                  !isPastEvent && (

                    <button
                      className="cancel-event-btn"
                      onClick={
                        handleCancelEvent
                      }
                      disabled={
                        cancellingEvent
                      }
                      title="Cancel event"
                    >

                      <Trash2
                        size={17}
                      />

                      <span>
                        {cancellingEvent
                          ? "Cancelling..."
                          : "Cancel Event"}
                      </span>

                    </button>

                  )}


                {/* DELETE */}

                <button
                  className="delete-btn"
                  onClick={() =>
                    deleteEvent(
                      currentEvent.id
                    )
                  }
                >

                  <Trash2
                    size={17}
                  />

                  <span>
                    Delete
                  </span>

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