import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminEvents.css";

const API_BASE_URL = "http://localhost:5000";

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ============================================================
  // LOAD EVENTS
  // ============================================================

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/events`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load events (${response.status})`
        );
      }

      const data = await response.json();

      let loadedEvents = [];

      if (Array.isArray(data)) {
        loadedEvents = data;
      } else if (Array.isArray(data.events)) {
        loadedEvents = data.events;
      }

      // ========================================================
      // NEWEST EVENTS FIRST
      //
      // createdAt is preferred.
      // If an older event does not have createdAt,
      // its ID is used as a fallback.
      // ========================================================

      loadedEvents.sort((a, b) => {
        const dateA = a?.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b?.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        if (
          dateA &&
          dateB &&
          dateA !== dateB
        ) {
          return dateB - dateA;
        }

        return (
          Number(b?.id || 0) -
          Number(a?.id || 0)
        );
      });

      setEvents(loadedEvents);
    } catch (error) {
      console.error(
        "Failed to load admin events:",
        error
      );

      setError(
        "Unable to load events. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CHECK WHETHER EVENT IS FREE
  // ============================================================

  const isFreeEvent = (event) => {
    return (
      String(
        event?.eventType || ""
      ).toLowerCase() === "free"
    );
  };

  // ============================================================
  // GET TICKET TYPES
  // ============================================================

  const getTickets = (event) => {
    return Array.isArray(event?.tickets)
      ? event.tickets
      : [];
  };

  // ============================================================
  // GET LOWEST TICKET PRICE
  //
  // Used for displaying:
  // "From UGX 20,000"
  //
  // For multiple ticket types we show the cheapest one.
  // ============================================================

  const getLowestTicketPrice = (event) => {
    const tickets = getTickets(event);

    const prices = tickets
      .map((ticket) =>
        Number(
          ticket?.price || 0
        )
      )
      .filter(
        (price) =>
          !Number.isNaN(price) &&
          price >= 0
      );

    if (prices.length === 0) {
      return null;
    }

    return Math.min(...prices);
  };

  // ============================================================
  // GET PRICE DISPLAY
  // ============================================================

  const getPriceDisplay = (event) => {
    // ----------------------------------------------------------
    // FREE EVENT
    // ----------------------------------------------------------

    if (isFreeEvent(event)) {
      return "Free";
    }

    // ----------------------------------------------------------
    // PAID EVENT
    // ----------------------------------------------------------

    const lowestPrice =
      getLowestTicketPrice(event);

    if (
      lowestPrice !== null
    ) {
      if (getTickets(event).length > 1) {
        return `From UGX ${lowestPrice.toLocaleString()}`;
      }

      return `UGX ${lowestPrice.toLocaleString()}`;
    }

    // ----------------------------------------------------------
    // OLD EVENTS COMPATIBILITY
    //
    // If an older event still has event.price,
    // display it rather than incorrectly calling it Free.
    // ----------------------------------------------------------

    const oldPrice =
      event?.price;

    if (
      oldPrice !== undefined &&
      oldPrice !== null &&
      String(oldPrice).trim() !== "" &&
      Number(oldPrice) >= 0
    ) {
      return `UGX ${Number(
        oldPrice
      ).toLocaleString()}`;
    }

    return "Paid";
  };

  // ============================================================
  // GET EVENT TYPE
  // ============================================================

  const getEventTypeDisplay = (event) => {
    if (isFreeEvent(event)) {
      return "Free Event";
    }

    return "Paid Event";
  };

  // ============================================================
  // IMAGE URL
  // ============================================================

  const getPosterUrl = (event) => {
    const poster =
      event?.eventPoster ||
      event?.image ||
      event?.poster ||
      "";

    if (!poster) {
      return null;
    }

    const imagePath =
      String(poster).trim();

    if (!imagePath) {
      return null;
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (
      imagePath.startsWith("/")
    ) {
      return `${API_BASE_URL}${imagePath}`;
    }

    return `${API_BASE_URL}/${imagePath}`;
  };

  // ============================================================
  // IMAGE FALLBACK
  // ============================================================

  const handleImageError = (event) => {
    event.currentTarget.style.display =
      "none";

    const fallback =
      event.currentTarget.parentElement?.querySelector(
        ".poster-fallback"
      );

    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  // ============================================================
  // FEATURE / UNFEATURE
  // ============================================================

  async function toggleFeatured(id) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/events/${id}/feature`,
        {
          method: "PUT",
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to update featured status."
        );
      }

      await fetchEvents();
    } catch (error) {
      console.error(
        "Feature event error:",
        error
      );

      alert(
        error.message ||
          "Unable to update the featured status."
      );
    }
  }

  // ============================================================
  // DELETE EVENT
  // ============================================================

  async function deleteEvent(id) {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this event?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/events/${id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to delete event."
        );
      }

      await fetchEvents();
    } catch (error) {
      console.error(
        "Delete event error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete this event."
      );
    }
  }

  // ============================================================
  // FILTER EVENTS
  // ============================================================

  const filteredEvents = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !searchValue ||
        String(
          event?.title || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          event?.venue || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          event?.city || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          event?.category || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          event?.hostName || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          event?.organizerName || ""
        )
          .toLowerCase()
          .includes(searchValue);

      if (!matchesSearch) {
        return false;
      }

      // --------------------------------------------------------
      // FEATURED
      // --------------------------------------------------------

      if (
        filter === "featured"
      ) {
        return (
          event?.featured === true
        );
      }

      // --------------------------------------------------------
      // FREE
      // --------------------------------------------------------

      if (
        filter === "free"
      ) {
        return isFreeEvent(event);
      }

      // --------------------------------------------------------
      // PAID
      // --------------------------------------------------------

      if (
        filter === "paid"
      ) {
        return !isFreeEvent(event);
      }

      return true;
    });
  }, [
    events,
    search,
    filter,
  ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-events-page">
        <div className="admin-events-state">

          <div className="admin-loading-spinner"></div>

          <h2>
            Loading events...
          </h2>

          <p>
            Please wait while EventWaa
            loads the events.
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="admin-events-page">
        <div className="admin-events-state error-state">

          <div className="state-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Events
          </h2>

          <p>
            {error}
          </p>

          <button
            className="retry-events-btn"
            onClick={fetchEvents}
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-events-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="events-header">

        <div>
          <span className="admin-events-eyebrow">
            EVENTWAA ADMIN
          </span>

          <h1>
            Event Management
          </h1>

          <p>
            Monitor, search, filter, create,
            feature and manage all events
            on EventWaa.
          </p>
        </div>

        <button
          className="create-event-btn"
          onClick={() =>
            navigate(
              "/admin/create-event"
            )
          }
        >
          + Create Event
        </button>

      </div>

      {/* ======================================================
          CONTROLS
      ====================================================== */}

      <div className="event-controls">

        <div className="event-search-wrapper">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search events, venue, city, host..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="event-search"
          />

        </div>

        <select
          value={filter}
          onChange={(e) =>
            setFilter(
              e.target.value
            )
          }
          className="event-filter"
        >
          <option value="all">
            All Events
          </option>

          <option value="featured">
            Featured Events
          </option>

          <option value="free">
            Free Events
          </option>

          <option value="paid">
            Paid Events
          </option>
        </select>

      </div>

      {/* ======================================================
          RESULTS COUNT
      ====================================================== */}

      <div className="events-results-bar">

        <span>
          Showing{" "}
          <strong>
            {filteredEvents.length}
          </strong>{" "}
          of{" "}
          <strong>
            {events.length}
          </strong>{" "}
          events
        </span>

      </div>

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {filteredEvents.length === 0 ? (

        <div className="admin-events-state">

          <div className="state-icon">
            📅
          </div>

          <h2>
            No Events Found
          </h2>

          <p>
            No events match your current
            search or filter.
          </p>

          {events.length === 0 && (
            <button
              className="create-event-btn"
              onClick={() =>
                navigate(
                  "/admin/create-event"
                )
              }
            >
              + Create Event
            </button>
          )}

        </div>

      ) : (

        <div className="admin-events-grid">

          {filteredEvents.map(
            (event) => {

              const posterUrl =
                getPosterUrl(event);

              const eventType =
                getEventTypeDisplay(
                  event
                );

              const priceDisplay =
                getPriceDisplay(
                  event
                );

              const tickets =
                getTickets(event);

              return (
                <div
                  className="event-admin-card"
                  key={event.id}
                >

                  {/* ==========================================
                      POSTER
                      ========================================== */}

                  <div className="admin-poster-wrapper">

                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={
                          event.title ||
                          "Event poster"
                        }
                        className="admin-event-poster"
                        onError={
                          handleImageError
                        }
                      />
                    ) : null}

                    <div
                      className="poster-fallback"
                      style={{
                        display:
                          posterUrl
                            ? "none"
                            : "flex",
                      }}
                    >
                      <span>
                        📅
                      </span>

                      <strong>
                        EventWaa
                      </strong>

                      <small>
                        No poster available
                      </small>
                    </div>

                    {/* EVENT TYPE */}

                    <span
                      className={`event-type-overlay ${
                        isFreeEvent(event)
                          ? "free"
                          : "paid"
                      }`}
                    >
                      {eventType}
                    </span>

                    {/* FEATURED */}

                    {event.featured && (
                      <span className="featured-overlay-badge">
                        ★ Featured
                      </span>
                    )}

                  </div>

                  {/* ==========================================
                      CONTENT
                      ========================================== */}

                  <div className="event-admin-content">

                    <div className="event-title-row">

                      <div>

                        <h2>
                          {event.title ||
                            "Untitled Event"}
                        </h2>

                        <span className="event-id">
                          Event #{event.id}
                        </span>

                      </div>

                    </div>

                    {/* ========================================
                        EVENT INFO
                        ======================================== */}

                    <div className="event-info-list">

                      <p>
                        <strong>
                          Host
                        </strong>

                        <span>
                          {event.hostName ||
                            event.organizerName ||
                            "EventWaa"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Venue
                        </strong>

                        <span>
                          {event.venue ||
                            "Not specified"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          City
                        </strong>

                        <span>
                          {event.city ||
                            "Not specified"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Date
                        </strong>

                        <span>
                          {event.date ||
                            "Not specified"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Category
                        </strong>

                        <span>
                          {event.category ||
                            "General"}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Type
                        </strong>

                        <span>
                          {eventType}
                        </span>
                      </p>

                      <p>
                        <strong>
                          Price
                        </strong>

                        <span>
                          {priceDisplay}
                        </span>
                      </p>

                      {/* ======================================
                          TICKET TYPES
                          ====================================== */}

                      {!isFreeEvent(event) &&
                        tickets.length > 0 && (
                          <p>
                            <strong>
                              Tickets
                            </strong>

                            <span>
                              {tickets.length}{" "}
                              type
                              {tickets.length !==
                              1
                                ? "s"
                                : ""}
                            </span>
                          </p>
                        )}

                      <p>
                        <strong>
                          Tickets Sold
                        </strong>

                        <span>
                          {Number(
                            event.ticketsSold ||
                              0
                          ).toLocaleString()}
                        </span>
                      </p>

                    </div>

                    {/* ========================================
                        ACTIONS
                        ======================================== */}

                    <div className="event-admin-actions">

                      <button
                        className="edit-event-btn"
                        onClick={() =>
                          navigate(
                            `/admin/events/edit/${event.id}`
                          )
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="feature-event-btn"
                        onClick={() =>
                          toggleFeatured(
                            event.id
                          )
                        }
                      >
                        {event.featured
                          ? "★ Featured"
                          : "☆ Feature"}
                      </button>

                      <button
                        className="delete-event-btn"
                        onClick={() =>
                          deleteEvent(
                            event.id
                          )
                        }
                      >
                        🗑️ Delete
                      </button>

                    </div>

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

export default AdminEvents;