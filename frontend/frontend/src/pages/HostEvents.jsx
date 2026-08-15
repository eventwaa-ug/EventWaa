import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import "../styles/HostEvents.css";
function HostEvents() {
  const navigate = useNavigate();
  const { events, deleteEvent } = useContext(EventContext);
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  /*
   * Only show events created by the logged-in host.
   */
  const myEvents = useMemo(() => {
    return (events || []).filter(
      (event) =>
        event.hostEmail === user?.email
    );
  }, [events, user]);
  /*
   * Filter events by search and status.
   */
  const filteredEvents = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();
    return myEvents.filter((event) => {
      const matchesSearch =
        !searchValue ||
        event.title
          ?.toLowerCase()
          .includes(searchValue) ||
        event.venue
          ?.toLowerCase()
          .includes(searchValue) ||
        event.city
          ?.toLowerCase()
          .includes(searchValue) ||
        event.category
          ?.toLowerCase()
          .includes(searchValue);
      let matchesFilter = true;
      if (filter === "upcoming") {
        matchesFilter =
          getEventDate(event) >= new Date();
      }
      if (filter === "past") {
        matchesFilter =
          getEventDate(event) < new Date();
      }
      if (filter === "free") {
        matchesFilter =
          event.eventType === "Free";
      }
      if (filter === "paid") {
        matchesFilter =
          event.eventType !== "Free";
      }
      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [myEvents, search, filter]);
  /*
   * Sort upcoming events first.
   */
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) =>
        getEventDate(a) - getEventDate(b)
    );
  }, [filteredEvents]);
  /*
   * Find the next upcoming event.
   */
  const upcomingEvent = useMemo(() => {
    const upcoming = myEvents
      .filter(
        (event) =>
          getEventDate(event) >= new Date()
      )
      .sort(
        (a, b) =>
          getEventDate(a) -
          getEventDate(b)
      );
    return upcoming[0] || null;
  }, [myEvents]);
  const handleDelete = (event) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?`
    );
    if (!confirmed) return;
    deleteEvent(event.id);
  };
  const getSoldTickets = (event) => {
    return Number(
      event.ticketsSold || 0
    );
  };
  const getCapacity = (event) => {
    return Number(
      event.capacity || 0
    );
  };
  const getRemaining = (event) => {
    return Math.max(
      0,
      getCapacity(event) -
        getSoldTickets(event)
    );
  };
  const getCheckedIn = (event) => {
    /*
     * The EventContext/event object may contain
     * different attendance information depending
     * on your backend.
     *
     * We safely use checkedIn when available.
     */
    return Number(
      event.checkedIn || 0
    );
  };
  const getEventStatus = (event) => {
    const eventDate =
      getEventDate(event);
    if (event.status === "cancelled") {
      return {
        label: "Cancelled",
        className: "status-cancelled",
      };
    }
    if (eventDate < new Date()) {
      return {
        label: "Past",
        className: "status-past",
      };
    }
    return {
      label: "Upcoming",
      className: "status-upcoming",
    };
  };
  if (!user) {
    return (
      <div className="host-events-page">
        <div className="host-events-empty">
          <div className="host-events-empty-icon">
            🔐
          </div>
          <h2>Login Required</h2>
          <p>
            Please log in to view your events.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="host-events-page">
      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="host-events-header">
        <div>
          <span className="host-events-eyebrow">
            HOST MANAGEMENT
          </span>
          <h1>📅 My Events</h1>
          <p>
            Manage all the events you have
            created on EventWaa.
          </p>
        </div>
        <button
          className="create-host-event-btn"
          onClick={() =>
            navigate("/create-event")
          }
        >
          + Create Event
        </button>
      </div>
      {/* ==================================================
          SUMMARY
      ================================================== */}
      <div className="host-events-summary">
        <div className="host-event-summary-card">
          <span>📅</span>
          <div>
            <small>Total Events</small>
            <strong>
              {myEvents.length}
            </strong>
          </div>
        </div>
        <div className="host-event-summary-card">
          <span>🚀</span>
          <div>
            <small>Upcoming</small>
            <strong>
              {
                myEvents.filter(
                  event =>
                    getEventDate(event) >=
                    new Date()
                ).length
              }
            </strong>
          </div>
        </div>
        <div className="host-event-summary-card">
          <span>🎟️</span>
          <div>
            <small>Tickets Sold</small>
            <strong>
              {
                myEvents.reduce(
                  (total, event) =>
                    total +
                    getSoldTickets(event),
                  0
                )
              }
            </strong>
          </div>
        </div>
        <div className="host-event-summary-card">
          <span>💰</span>
          <div>
            <small>Total Revenue</small>
            <strong>
              UGX{" "}
              {myEvents
                .reduce(
                  (total, event) =>
                    total +
                    Number(
                      event.revenue || 0
                    ),
                  0
                )
                .toLocaleString()}
            </strong>
          </div>
        </div>
      </div>
      {/* ==================================================
          CURRENT / NEXT EVENT
      ================================================== */}
      {upcomingEvent && (
        <section className="current-event-section">
          <div className="current-event-heading">
            <div>
              <span>
                NEXT UPCOMING EVENT
              </span>
              <h2>
                Your Current Event
              </h2>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/attendees/${upcomingEvent.id}`
                )
              }
            >
              View Attendees
            </button>
          </div>
          <div className="current-event-card">
            <div className="current-event-info">
              <h2>
                {upcomingEvent.title}
              </h2>
              <p>
                📍{" "}
                {upcomingEvent.venue},{" "}
                {upcomingEvent.city}
              </p>
              <p>
                📅{" "}
                {upcomingEvent.date}
              </p>
              <p>
                ⏰{" "}
                {upcomingEvent.startTime}
                {" - "}
                {upcomingEvent.endTime}
              </p>
            </div>
            <div className="current-event-stats">
              <div>
                <strong>
                  {getSoldTickets(
                    upcomingEvent
                  )}
                </strong>
                <span>
                  Tickets Sold
                </span>
              </div>
              <div>
                <strong>
                  {getRemaining(
                    upcomingEvent
                  )}
                </strong>
                <span>
                  Remaining
                </span>
              </div>
              <div>
                <strong>
                  UGX{" "}
                  {Number(
                    upcomingEvent.revenue ||
                      0
                  ).toLocaleString()}
                </strong>
                <span>
                  Revenue
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* ==================================================
          SEARCH + FILTER
      ================================================== */}
      <div className="host-events-toolbar">
        <input
          type="text"
          placeholder="🔍 Search your events..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="all">
            All Events
          </option>
          <option value="upcoming">
            Upcoming
          </option>
          <option value="past">
            Past
          </option>
          <option value="free">
            Free Events
          </option>
          <option value="paid">
            Paid Events
          </option>
        </select>
      </div>
      {/* ==================================================
          EVENTS
      ================================================== */}
      <section className="all-host-events">
        <div className="all-host-events-heading">
          <div>
            <h2>
              All My Events
            </h2>
            <p>
              {sortedEvents.length} event
              {sortedEvents.length !== 1
                ? "s"
                : ""}
            </p>
          </div>
        </div>
        {sortedEvents.length === 0 ? (
          <div className="host-events-empty">
            <div className="host-events-empty-icon">
              📅
            </div>
            <h2>
              No Events Found
            </h2>
            <p>
              You don't have any events
              matching your search.
            </p>
            {myEvents.length === 0 && (
              <button
                onClick={() =>
                  navigate("/create-event")
                }
              >
                + Create Your First Event
              </button>
            )}
          </div>
        ) : (
          <div className="host-events-list">
            {sortedEvents.map((event) => {
              const status =
                getEventStatus(event);
              const sold =
                getSoldTickets(event);
              const capacity =
                getCapacity(event);
              const remaining =
                getRemaining(event);
              const checkedIn =
                getCheckedIn(event);
              const progress =
                capacity > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (sold /
                          capacity) *
                          100
                      )
                    )
                  : 0;
              return (
                <article
                  className="host-event-card"
                  key={event.id}
                >
                  {/* EVENT MAIN INFO */}
                  <div className="host-event-main">
                    <div className="host-event-title-row">
                      <div>
                        <span
                          className={`event-status ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <h3>
                          {event.title}
                        </h3>
                      </div>
                    </div>
                    <div className="host-event-meta">
                      <span>
                        📍{" "}
                        {event.venue ||
                          "Venue not set"}
                        {event.city
                          ? `, ${event.city}`
                          : ""}
                      </span>
                      <span>
                        📅{" "}
                        {event.date ||
                          "Date not set"}
                      </span>
                      <span>
                        ⏰{" "}
                        {event.startTime ||
                          "--"}
                        {" - "}
                        {event.endTime ||
                          "--"}
                      </span>
                      <span>
                        🏷️{" "}
                        {event.category ||
                          "General"}
                      </span>
                    </div>
                    <div className="host-event-type">
                      {event.eventType ===
                      "Free" ? (
                        <span className="free-badge">
                          🎉 Free Event
                        </span>
                      ) : (
                        <span className="paid-badge">
                          🎟️ Paid Event
                        </span>
                      )}
                    </div>
                  </div>
                  {/* PERFORMANCE */}
                  <div className="host-event-performance">
                    <div className="performance-item">
                      <span>
                        Tickets Sold
                      </span>
                      <strong>
                        {sold}
                      </strong>
                    </div>
                    <div className="performance-item">
                      <span>
                        Checked In
                      </span>
                      <strong>
                        {checkedIn}
                      </strong>
                    </div>
                    <div className="performance-item">
                      <span>
                        Remaining
                      </span>
                      <strong>
                        {remaining}
                      </strong>
                    </div>
                    <div className="performance-item">
                      <span>
                        Revenue
                      </span>
                      <strong>
                        UGX{" "}
                        {Number(
                          event.revenue ||
                            0
                        ).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  {/* PROGRESS */}
                  <div className="event-capacity">
                    <div className="capacity-header">
                      <span>
                        Ticket Capacity
                      </span>
                      <strong>
                        {sold} / {capacity}
                      </strong>
                    </div>
                    <div className="capacity-bar">
                      <div
                        className="capacity-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                  {/* ACTIONS */}
                  <div className="host-event-actions">
                    <button
                      className="view-event-btn"
                      onClick={() =>
                        navigate(
                          `/attendees/${event.id}`
                        )
                      }
                    >
                      👥 Attendees
                    </button>
                    <button
                      className="scan-event-btn"
                      onClick={() =>
                        navigate(
                          `/scanner/${event.id}`
                        )
                      }
                    >
                      🎟️ Scan
                    </button>
                    <button
                      className="edit-event-btn"
                      onClick={() =>
                        navigate(
                          "/create-event",
                          {
                            state: {
                              event,
                            },
                          }
                        )
                      }
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="duplicate-event-btn"
                      onClick={() =>
                        navigate(
                          "/create-event",
                          {
                            state: {
                              duplicateEvent:
                                event,
                            },
                          }
                        )
                      }
                    >
                      📋 Duplicate
                    </button>
                    <button
                      className="delete-event-btn"
                      onClick={() =>
                        handleDelete(event)
                      }
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
/*
 * Convert the event date into a Date object.
 *
 * Handles the common YYYY-MM-DD format.
 */
function getEventDate(event) {
  if (!event?.date) {
    return new Date(0);
  }
  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }
  return date;
}
export default HostEvents;