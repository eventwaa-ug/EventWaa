import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import {
  FiCalendar,
  FiPlus,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiTag,
  FiEdit3,
  FiCopy,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiCreditCard,
  FiChevronRight,
  FiEye,
  FiGrid,
} from "react-icons/fi";
import "../styles/HostEvents.css";
function HostEvents() {
  const navigate = useNavigate();
  const { events, deleteEvent } =
    useContext(EventContext);
  const { user } = useAuth();
  const [search, setSearch] =
    useState("");
  const [filter, setFilter] =
    useState("all");
  /*
   * ============================================================
   * ONLY SHOW EVENTS CREATED BY LOGGED-IN HOST
   * ============================================================
   */
  const myEvents = useMemo(() => {
    return (events || []).filter(
      (event) =>
        event.hostEmail === user?.email
    );
  }, [events, user]);
  /*
   * ============================================================
   * FILTER EVENTS
   * ============================================================
   */
  const filteredEvents = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();
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
   * ============================================================
   * SORT EVENTS
   * ============================================================
   */
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) =>
        getEventDate(a) -
        getEventDate(b)
    );
  }, [filteredEvents]);
  /*
   * ============================================================
   * NEXT UPCOMING EVENT
   * ============================================================
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
  /*
   * ============================================================
   * DELETE
   * ============================================================
   */
  const handleDelete = (event) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${event.title}"?`
      );
    if (!confirmed) return;
    deleteEvent(event.id);
  };
  /*
   * ============================================================
   * EVENT HELPERS
   * ============================================================
   */
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
    return Number(
      event.checkedIn || 0
    );
  };
  const getEventStatus = (event) => {
    const eventDate =
      getEventDate(event);
    if (
      event.status === "cancelled"
    ) {
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
  /*
   * ============================================================
   * IMAGE URL
   * ============================================================
   */
  const BACKEND_URL =
    "http://localhost:5000";
  const getImageUrl = (event) => {
    const image =
      event?.eventPoster ||
      event?.image;
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
  /*
   * ============================================================
   * LOGIN CHECK
   * ============================================================
   */
  if (!user) {
    return (
      <div className="host-events-page">
        <div className="host-events-empty">
          <div className="host-events-empty-icon">
            <FiCreditCard />
          </div>
          <h2>
            Login Required
          </h2>
          <p>
            Please log in to view your events.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="host-events-page">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="host-events-header">
        <div>
          <span className="host-events-eyebrow">
            HOST MANAGEMENT
          </span>
          <h1>
            <FiCalendar />
            My Events
          </h1>
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
          <FiPlus />
          Create Event
        </button>
      </div>
      {/* ======================================================
          SUMMARY
      ====================================================== */}
      <div className="host-events-summary">
        <div className="host-event-summary-card">
          <div className="summary-icon blue">
            <FiCalendar />
          </div>
          <div>
            <small>
              Total Events
            </small>
            <strong>
              {myEvents.length}
            </strong>
          </div>
        </div>
        <div className="host-event-summary-card">
          <div className="summary-icon orange">
            <FiClock />
          </div>
          <div>
            <small>
              Upcoming
            </small>
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
          <div className="summary-icon purple">
            <FiCreditCard />
          </div>
          <div>
            <small>
              Tickets Sold
            </small>
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
          <div className="summary-icon green">
            <FiCheckCircle />
          </div>
          <div>
            <small>
              Total Revenue
            </small>
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
      {/* ======================================================
          NEXT UPCOMING EVENT
      ====================================================== */}
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
              <FiUsers />
              View Attendees
              <FiChevronRight />
            </button>
          </div>
          <div className="current-event-card">
            {/* POSTER */}
            <div className="current-event-poster-wrapper">
              <img
                src={getImageUrl(
                  upcomingEvent
                )}
                alt={
                  upcomingEvent.title ||
                  "Event poster"
                }
                className="current-event-poster"
                onError={(e) => {
                  e.currentTarget.src =
                    "/default-event.jpg";
                }}
              />
            </div>
            {/* INFO */}
            <div className="current-event-info">
              <span className="current-event-label">
                UPCOMING
              </span>
              <h2>
                {upcomingEvent.title}
              </h2>
              <p>
                <FiMapPin />
                {upcomingEvent.venue},{" "}
                {upcomingEvent.city}
              </p>
              <p>
                <FiCalendar />
                {upcomingEvent.date}
              </p>
              <p>
                <FiClock />
                {upcomingEvent.startTime}
                {" - "}
                {upcomingEvent.endTime}
              </p>
            </div>
            {/* STATS */}
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
      {/* ======================================================
          SEARCH + FILTER
      ====================================================== */}
      <div className="host-events-toolbar">
        <div className="host-events-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search your events..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
        <div className="host-events-filter">
          <FiFilter />
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
      </div>
      {/* ======================================================
          ALL EVENTS
      ====================================================== */}
      <section className="all-host-events">
        <div className="all-host-events-heading">
          <div>
            <span className="section-eyebrow">
              EVENT LIBRARY
            </span>
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
          <div className="event-count-badge">
            <FiGrid />
            {sortedEvents.length}
          </div>
        </div>
        {sortedEvents.length === 0 ? (
          <div className="host-events-empty">
            <div className="host-events-empty-icon">
              <FiCalendar />
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
                  navigate(
                    "/create-event"
                  )
                }
              >
                <FiPlus />
                Create Your First Event
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
                  {/* =================================================
                      EVENT MAIN INFO
                  ================================================= */}
                  <div className="host-event-main">
                    {/* POSTER */}
                    <div className="host-event-poster-wrapper">
                      <img
                        src={getImageUrl(event)}
                        alt={
                          event.title ||
                          "Event poster"
                        }
                        className="host-event-poster"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/default-event.jpg";
                        }}
                      />
                    </div>
                    {/* TITLE */}
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
                    {/* META */}
                    <div className="host-event-meta">
                      <span>
                        <FiMapPin />
                        {event.venue ||
                          "Venue not set"}
                        {event.city
                          ? `, ${event.city}`
                          : ""}
                      </span>
                      <span>
                        <FiCalendar />
                        {event.date ||
                          "Date not set"}
                      </span>
                      <span>
                        <FiClock />
                        {event.startTime ||
                          "--"}
                        {" - "}
                        {event.endTime ||
                          "--"}
                      </span>
                      <span>
                        <FiTag />
                        {event.category ||
                          "General"}
                      </span>
                    </div>
                    {/* TYPE */}
                    <div className="host-event-type">
                      {event.eventType ===
                      "Free" ? (
                        <span className="free-badge">
                          Free Event
                        </span>
                      ) : (
                        <span className="paid-badge">
                          Paid Event
                        </span>
                      )}
                    </div>
                  </div>
                  {/* =================================================
                      PERFORMANCE
                  ================================================= */}
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
                  {/* =================================================
                      CAPACITY
                  ================================================= */}
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
                          width:
                            `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                  {/* =================================================
                      ACTIONS
                  ================================================= */}
                  <div className="host-event-actions">
                    <button
                      className="view-event-btn"
                      onClick={() =>
                        navigate(
                          `/attendees/${event.id}`
                        )
                      }
                    >
                      <FiUsers />
                      Attendees
                    </button>
                    <button
                      className="scan-event-btn"
                      onClick={() =>
                        navigate(
                          `/scanner/${event.id}`
                        )
                      }
                    >
                      <FiCheckCircle />
                      Scan
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
                      <FiEdit3 />
                      Edit
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
                      <FiCopy />
                      Duplicate
                    </button>
                    <button
                      className="delete-event-btn"
                      onClick={() =>
                        handleDelete(event)
                      }
                    >
                      <FiTrash2 />
                      Delete
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
 * ============================================================
 * EVENT DATE HELPER
 * ============================================================
 */
function getEventDate(event) {
  if (!event?.date) {
    return new Date(0);
  }
  const date =
    new Date(event.date);
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date(0);
  }
  return date;
}
export default HostEvents;