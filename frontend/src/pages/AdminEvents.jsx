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

      /*
       * Some APIs return the array directly.
       * Others return { events: [...] }.
       *
       * We support both.
       */

      if (Array.isArray(data)) {
        setEvents(data);
      } else if (Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
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

    const imagePath = String(poster).trim();

    if (!imagePath) {
      return null;
    }

    /*
     * Already a complete URL.
     *
     * Example:
     * https://example.com/image.jpg
     */

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    /*
     * If Flask already returned:
     *
     * /uploads/events/image.jpg
     *
     * attach localhost:5000.
     */

    if (imagePath.startsWith("/")) {
      return `${API_BASE_URL}${imagePath}`;
    }

    /*
     * If backend stored:
     *
     * uploads/events/image.jpg
     *
     * add the missing slash.
     */

    return `${API_BASE_URL}/${imagePath}`;
  };

  // ============================================================
  // IMAGE FALLBACK
  // ============================================================

  const handleImageError = (event) => {
    /*
     * Prevent the browser from repeatedly
     * trying to load a broken image.
     */

    event.currentTarget.style.display = "none";

    const fallback =
      event.currentTarget.parentElement?.querySelector(
        ".poster-fallback"
      );

    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  // ============================================================
  // FEATURE EVENT
  // ============================================================

  async function toggleFeatured(id) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/events/${id}/feature`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error(
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
        "Unable to update the featured status."
      );
    }
  }

  // ============================================================
  // DELETE EVENT
  // ============================================================

  async function deleteEvent(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/events/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
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
          .includes(searchValue) ||
        event.hostName
          ?.toLowerCase()
          .includes(searchValue);

      if (!matchesSearch) {
        return false;
      }

      // --------------------------------------------------------
      // FEATURED
      // --------------------------------------------------------

      if (filter === "featured") {
        return event.featured === true;
      }

      // --------------------------------------------------------
      // FREE
      // --------------------------------------------------------

      if (filter === "free") {
        return (
          event.eventType === "Free" ||
          !event.price ||
          event.price === 0 ||
          event.price === "0" ||
          event.price === "Free"
        );
      }

      // --------------------------------------------------------
      // PAID
      // --------------------------------------------------------

      if (filter === "paid") {
        return !(
          event.eventType === "Free" ||
          !event.price ||
          event.price === 0 ||
          event.price === "0" ||
          event.price === "Free"
        );
      }

      return true;
    });
  }, [events, search, filter]);

  // ============================================================
  // PRICE DISPLAY
  // ============================================================

  const getPriceDisplay = (event) => {
    if (
      event.eventType === "Free" ||
      !event.price ||
      event.price === 0 ||
      event.price === "0" ||
      event.price === "Free"
    ) {
      return "Free";
    }

    const price = Number(event.price);

    if (Number.isNaN(price)) {
      return event.price;
    }

    return `UGX ${price.toLocaleString()}`;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-events-page">
        <div className="admin-events-state">
          <div className="admin-loading-spinner"></div>

          <h2>Loading events...</h2>

          <p>
            Please wait while EventWaa loads
            the events.
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

          <p>{error}</p>

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
            navigate("/admin/create-event")
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
              setSearch(e.target.value)
            }
            className="event-search"
          />

        </div>


        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
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

        /* ====================================================
           EVENT GRID
           ==================================================== */

        <div className="admin-events-grid">

          {filteredEvents.map((event) => {

            const posterUrl =
              getPosterUrl(event);

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


                  {/* FALLBACK */}

                  <div
                    className="poster-fallback"
                    style={{
                      display: posterUrl
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


                  {/* EVENT INFO */}

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
                        Price
                      </strong>

                      <span>
                        {getPriceDisplay(event)}
                      </span>
                    </p>


                    <p>
                      <strong>
                        Tickets Sold
                      </strong>

                      <span>
                        {Number(
                          event.ticketsSold || 0
                        ).toLocaleString()}
                      </span>
                    </p>

                  </div>


                  {/* ACTIONS */}

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
          })}

        </div>

      )}

    </div>
  );
}

export default AdminEvents;