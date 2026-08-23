import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminScan.css";

const API_BASE_URL = "http://localhost:5000";

function AdminScan() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD EVENTS
  // ============================================================

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/events`
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load events (${response.status})`
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setEvents(data);
      } else if (Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error(
        "ADMIN SCAN EVENTS ERROR:",
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
  // POSTER URL
  // ============================================================

  function getPosterUrl(event) {
    const poster =
      event?.eventPoster ||
      event?.image ||
      event?.poster ||
      "";

    if (!poster) {
      return "";
    }

    const imagePath = String(poster).trim();

    if (!imagePath) {
      return "";
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return `${API_BASE_URL}${imagePath}`;
    }

    return `${API_BASE_URL}/${imagePath}`;
  }

  // ============================================================
  // PRICE
  // ============================================================

  function getPrice(event) {
    if (
      String(event?.eventType || "").toLowerCase() ===
      "free"
    ) {
      return "Free";
    }

    const tickets = Array.isArray(event?.tickets)
      ? event.tickets
      : [];

    if (tickets.length > 0) {
      const prices = tickets
        .map((ticket) => Number(ticket?.price))
        .filter((price) => !Number.isNaN(price));

      if (prices.length > 0) {
        const lowestPrice = Math.min(...prices);

        if (lowestPrice === 0) {
          return "Free";
        }

        return `From UGX ${lowestPrice.toLocaleString()}`;
      }
    }

    const price = Number(event?.price);

    if (!Number.isNaN(price) && price > 0) {
      return `UGX ${price.toLocaleString()}`;
    }

    return "Free";
  }

  // ============================================================
  // TICKET TOTAL
  // ============================================================

  function getTotalTickets(event) {
    if (
      Array.isArray(event?.tickets) &&
      event.tickets.length > 0
    ) {
      return event.tickets.reduce(
        (total, ticket) =>
          total +
          Number(ticket?.quantity || 0),
        0
      );
    }

    return Number(event?.capacity || 0);
  }

  // ============================================================
  // TICKETS SOLD
  // ============================================================

  function getTicketsSold(event) {
    return Number(
      event?.ticketsSold ||
      event?.attendees ||
      0
    );
  }

  // ============================================================
  // FILTER EVENTS
  // ============================================================

  const filteredEvents = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return events.filter((event) => {
      const title =
        String(event?.title || "").toLowerCase();

      const venue =
        String(event?.venue || "").toLowerCase();

      const city =
        String(event?.city || "").toLowerCase();

      const category =
        String(event?.category || "").toLowerCase();

      const host =
        String(
          event?.hostName ||
          event?.organizerName ||
          ""
        ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        venue.includes(searchValue) ||
        city.includes(searchValue) ||
        category.includes(searchValue) ||
        host.includes(searchValue);

      if (!matchesSearch) {
        return false;
      }

      // --------------------------------------------------------
      // ALL
      // --------------------------------------------------------

      if (filter === "all") {
        return true;
      }

      // --------------------------------------------------------
      // PAID
      // --------------------------------------------------------

      if (filter === "paid") {
        return (
          String(event?.eventType || "").toLowerCase() ===
          "paid"
        );
      }

      // --------------------------------------------------------
      // FREE
      // --------------------------------------------------------

      if (filter === "free") {
        return (
          String(event?.eventType || "").toLowerCase() ===
          "free"
        );
      }

      // --------------------------------------------------------
      // FEATURED
      // --------------------------------------------------------

      if (filter === "featured") {
        return event?.featured === true;
      }

      // --------------------------------------------------------
      // ADMIN EVENTS
      // --------------------------------------------------------

      if (filter === "admin") {
        return event?.adminEvent === true;
      }

      // --------------------------------------------------------
      // HOST EVENTS
      // --------------------------------------------------------

      if (filter === "host") {
        return event?.adminEvent !== true;
      }

      return true;
    });
  }, [events, search, filter]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-scan-page">
        <div className="admin-scan-state">
          <div className="admin-scan-spinner"></div>

          <h2>Loading Events</h2>

          <p>
            Preparing events for ticket scanning...
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
      <div className="admin-scan-page">
        <div className="admin-scan-state admin-scan-error">
          <div className="admin-scan-state-icon">
            ⚠️
          </div>

          <h2>Unable to Load Events</h2>

          <p>{error}</p>

          <button
            className="admin-scan-retry"
            onClick={loadEvents}
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
    <div className="admin-scan-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="admin-scan-header">

        <div className="admin-scan-header-text">

          <span className="admin-scan-eyebrow">
            EVENTWAA ADMIN
          </span>

          <h1>
            Scan Tickets
          </h1>

          <p>
            Select an event to open its ticket
            scanner and manage attendee entry.
          </p>

        </div>

        <div className="admin-scan-header-icon">
          📷
        </div>

      </div>


      {/* ======================================================
          SEARCH + FILTER
          ====================================================== */}

      <div className="admin-scan-controls">

        <div className="admin-scan-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search events, venue, city, host..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}

        </div>


        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className="admin-scan-filter"
        >

          <option value="all">
            All Events
          </option>

          <option value="paid">
            Paid Events
          </option>

          <option value="free">
            Free Events
          </option>

          <option value="featured">
            Featured Events
          </option>

          <option value="admin">
            EventWaa Events
          </option>

          <option value="host">
            Host Events
          </option>

        </select>

      </div>


      {/* ======================================================
          RESULTS BAR
          ====================================================== */}

      <div className="admin-scan-results">

        <div>
          Showing{" "}
          <strong>
            {filteredEvents.length}
          </strong>{" "}
          of{" "}
          <strong>
            {events.length}
          </strong>{" "}
          events
        </div>

        {(search || filter !== "all") && (
          <button
            className="clear-filters-btn"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Clear filters
          </button>
        )}

      </div>


      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {filteredEvents.length === 0 ? (

        <div className="admin-scan-state">

          <div className="admin-scan-state-icon">
            🔎
          </div>

          <h2>
            No Events Found
          </h2>

          <p>
            No events match your current
            search or filter.
          </p>

          <button
            className="admin-scan-retry"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Show All Events
          </button>

        </div>

      ) : (

        <div className="admin-scan-grid">

          {filteredEvents.map((event) => {

            const posterUrl =
              getPosterUrl(event);

            const totalTickets =
              getTotalTickets(event);

            const ticketsSold =
              getTicketsSold(event);

            const remaining =
              Math.max(
                totalTickets - ticketsSold,
                0
              );

            return (

              <div
                className="admin-scan-event-card"
                key={event.id}
              >

                {/* ==================================================
                    POSTER
                    ================================================== */}

                <div className="admin-scan-poster">

                  {posterUrl ? (

                    <img
                      src={posterUrl}
                      alt={
                        event.title ||
                        "Event poster"
                      }
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";

                        const fallback =
                          e.currentTarget.parentElement
                            ?.querySelector(
                              ".admin-scan-poster-fallback"
                            );

                        if (fallback) {
                          fallback.style.display =
                            "flex";
                        }
                      }}
                    />

                  ) : null}


                  <div
                    className="admin-scan-poster-fallback"
                    style={{
                      display: posterUrl
                        ? "none"
                        : "flex"
                    }}
                  >
                    <span>📅</span>

                    <strong>
                      EventWaa
                    </strong>

                    <small>
                      No poster available
                    </small>
                  </div>


                  {event.featured && (
                    <span className="admin-scan-featured">
                      ★ Featured
                    </span>
                  )}

                </div>


                {/* ==================================================
                    EVENT INFORMATION
                    ================================================== */}

                <div className="admin-scan-card-content">

                  <div className="admin-scan-event-heading">

                    <div>

                      <h2>
                        {event.title ||
                          "Untitled Event"}
                      </h2>

                      <p>
                        Event #{event.id}
                      </p>

                    </div>

                    <span
                      className={
                        String(
                          event.eventType || ""
                        ).toLowerCase() ===
                        "free"
                          ? "event-type free"
                          : "event-type paid"
                      }
                    >
                      {String(
                        event.eventType || ""
                      ).toLowerCase() === "free"
                        ? "FREE"
                        : "PAID"}
                    </span>

                  </div>


                  <div className="admin-scan-info">

                    <div>
                      <span>
                        Host
                      </span>

                      <strong>
                        {event.hostName ||
                          event.organizerName ||
                          "EventWaa"}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Venue
                      </span>

                      <strong>
                        {event.venue ||
                          "Not specified"}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Date
                      </span>

                      <strong>
                        {event.date ||
                          "Not specified"}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Price
                      </span>

                      <strong>
                        {getPrice(event)}
                      </strong>
                    </div>

                  </div>


                  {/* ==================================================
                      ATTENDANCE
                      ================================================== */}

                  <div className="admin-scan-attendance">

                    <div>
                      <span>
                        🎟️ Tickets
                      </span>

                      <strong>
                        {totalTickets.toLocaleString()}
                      </strong>
                    </div>


                    <div>
                      <span>
                        ✅ Sold / Used
                      </span>

                      <strong>
                        {ticketsSold.toLocaleString()}
                      </strong>
                    </div>


                    <div>
                      <span>
                        ⏳ Remaining
                      </span>

                      <strong>
                        {remaining.toLocaleString()}
                      </strong>
                    </div>

                  </div>


                  {/* ==================================================
                      SELECT BUTTON
                      ================================================== */}

                  <button
                    className="select-event-scan-btn"
                    onClick={() =>
                      navigate(
                        `/admin/scan/${event.id}`
                      )
                    }
                  >
                    📷 Scan This Event
                  </button>

                </div>

              </div>

            );
          })}

        </div>

      )}

    </div>
  );
}

export default AdminScan;