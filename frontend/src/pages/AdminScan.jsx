import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Search,
  X,
  CalendarDays,
  Ticket,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCcw,
  Star,
} from "lucide-react";
import "./AdminScan.css";
import { adminFetch } from "../utils/adminAPI";

/* ============================================================
   BACKEND
============================================================ */

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL;


/* ============================================================
   ADMIN SCAN
============================================================ */

function AdminScan() {

  const navigate = useNavigate();


  /* ==========================================================
     STATE
  ========================================================== */

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* ==========================================================
     LOAD EVENTS
  ========================================================== */

  useEffect(() => {
    loadEvents();
  }, []);


  async function loadEvents() {

    try {

      setLoading(true);
      setError("");

      const data =
        await adminFetch(
          "/admin/events"
        );

      if (Array.isArray(data)) {

        setEvents(data);

      } else if (
        Array.isArray(data?.events)
      ) {

        setEvents(data.events);

      } else {

        setEvents([]);

      }

    } catch (loadError) {

      console.error(
        "ADMIN SCAN EVENTS ERROR:",
        loadError
      );

      setError(
        loadError?.message ||
        "Unable to load events. Please try again."
      );

    } finally {

      setLoading(false);

    }

  }


  /* ==========================================================
     POSTER URL
  ========================================================== */

  function getPosterUrl(event) {

    const poster =
      event?.eventPoster ||
      event?.image ||
      event?.poster ||
      "";

    if (!poster) {
      return "";
    }

    const imagePath =
      String(poster).trim();

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

      return `${BACKEND_URL}${imagePath}`;

    }

    return `${BACKEND_URL}/${imagePath}`;

  }


  /* ==========================================================
     PRICE
  ========================================================== */

  function getPrice(event) {

    const eventType =
      String(
        event?.eventType || ""
      ).toLowerCase();

    if (eventType === "free") {
      return "Free";
    }

    const tickets =
      Array.isArray(event?.tickets)
        ? event.tickets
        : [];

    if (tickets.length > 0) {

      const prices =
        tickets
          .map((ticket) =>
            Number(ticket?.price)
          )
          .filter(
            (price) =>
              !Number.isNaN(price)
          );

      if (prices.length > 0) {

        const lowestPrice =
          Math.min(...prices);

        if (lowestPrice === 0) {
          return "Free";
        }

        return (
          `From UGX ${lowestPrice.toLocaleString()}`
        );

      }

    }

    const price =
      Number(event?.price);

    if (
      !Number.isNaN(price) &&
      price > 0
    ) {

      return (
        `UGX ${price.toLocaleString()}`
      );

    }

    return "Free";

  }


  /* ==========================================================
     TOTAL TICKETS
  ========================================================== */

  function getTotalTickets(event) {

    if (
      Array.isArray(event?.tickets) &&
      event.tickets.length > 0
    ) {

      return event.tickets.reduce(
        (total, ticket) =>
          total +
          Number(
            ticket?.quantity || 0
          ),
        0
      );

    }

    return Number(
      event?.capacity || 0
    );

  }


  /* ==========================================================
     TICKETS SOLD
  ========================================================== */

  function getTicketsSold(event) {

    return Number(
      event?.ticketsSold ||
      event?.attendees ||
      0
    );

  }


  /* ==========================================================
     FILTER EVENTS
  ========================================================== */

  const filteredEvents =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();

      return events.filter(
        (event) => {

          const title =
            String(
              event?.title || ""
            ).toLowerCase();

          const venue =
            String(
              event?.venue || ""
            ).toLowerCase();

          const city =
            String(
              event?.city || ""
            ).toLowerCase();

          const category =
            String(
              event?.category || ""
            ).toLowerCase();

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

          if (filter === "all") {
            return true;
          }

          if (filter === "paid") {

            return (
              String(
                event?.eventType || ""
              ).toLowerCase() ===
              "paid"
            );

          }

          if (filter === "free") {

            return (
              String(
                event?.eventType || ""
              ).toLowerCase() ===
              "free"
            );

          }

          if (filter === "featured") {

            return (
              event?.featured === true
            );

          }

          if (filter === "admin") {

            return (
              event?.adminEvent === true
            );

          }

          if (filter === "host") {

            return (
              event?.adminEvent !== true
            );

          }

          return true;

        }
      );

    }, [
      events,
      search,
      filter,
    ]);


  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading) {

    return (

      <div className="admin-scan-page">

        <div className="admin-scan-state">

          <div
            className="admin-scan-spinner"
            aria-hidden="true"
          />

          <h2>
            Loading Events
          </h2>

          <p>
            Preparing events for ticket
            scanning...
          </p>

        </div>

      </div>

    );

  }


  /* ==========================================================
     ERROR STATE
  ========================================================== */

  if (error) {

    return (

      <div className="admin-scan-page">

        <div
          className="
            admin-scan-state
            admin-scan-error
          "
          role="alert"
        >

          <div className="admin-scan-state-icon">

            <AlertCircle
              aria-hidden="true"
            />

          </div>

          <h2>
            Unable to Load Events
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="admin-scan-retry"
            onClick={loadEvents}
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  /* ==========================================================
     RENDER
  ========================================================== */

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
            Select an event to open its
            ticket scanner and manage
            attendee entry.
          </p>

        </div>

        <div
          className="admin-scan-header-icon"
          aria-hidden="true"
        >

          <Camera />

        </div>

      </div>


      {/* ======================================================
          SEARCH + FILTER
      ====================================================== */}

      <div className="admin-scan-controls">

        <div className="admin-scan-search">

          <Search
            aria-hidden="true"
          />

          <input
            type="text"
            value={search}
            placeholder="Search events, venue, city, host..."
            aria-label="Search events"
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (

            <button
              type="button"
              className="clear-search-btn"
              aria-label="Clear search"
              onClick={() =>
                setSearch("")
              }
            >

              <X
                aria-hidden="true"
              />

            </button>

          )}

        </div>


        <select
          value={filter}
          onChange={(event) =>
            setFilter(
              event.target.value
            )
          }
          className="admin-scan-filter"
          aria-label="Filter events"
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
          </strong>

          {" "}of{" "}

          <strong>
            {events.length}
          </strong>

          {" "}events

        </div>

        {(search || filter !== "all") && (

          <button
            type="button"
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
          NO EVENTS
      ====================================================== */}

      {filteredEvents.length === 0 ? (

        <div className="admin-scan-state">

          <div
            className="admin-scan-state-icon"
            aria-hidden="true"
          >

            <Search />

          </div>

          <h2>
            No Events Found
          </h2>

          <p>
            No events match your current
            search or filter.
          </p>

          <button
            type="button"
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

        /* ====================================================
           EVENT GRID
        ==================================================== */

        <div className="admin-scan-grid">

          {filteredEvents.map(
            (event) => {

              const posterUrl =
                getPosterUrl(event);

              const totalTickets =
                getTotalTickets(event);

              const ticketsSold =
                getTicketsSold(event);

              const remaining =
                Math.max(
                  totalTickets -
                  ticketsSold,
                  0
                );


              const eventType =
                String(
                  event?.eventType || ""
                ).toLowerCase();

              const isFree =
                eventType === "free";


              return (

                <article
                  className="admin-scan-event-card"
                  key={event.id}
                >


                  {/* ==========================================
                      POSTER
                  ========================================== */}

                  <div className="admin-scan-poster">

                    {posterUrl ? (

                      <img
                        src={posterUrl}
                        alt={
                          event?.title ||
                          "Event poster"
                        }
                        onError={(event) => {

                          event.currentTarget.style.display =
                            "none";

                          const fallback =
                            event.currentTarget
                              .parentElement
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
                      className="
                        admin-scan-poster-fallback
                      "
                      style={{
                        display:
                          posterUrl
                            ? "none"
                            : "flex",
                      }}
                    >

                      <span>
                        <CalendarDays
                          aria-hidden="true"
                        />
                      </span>

                      <strong>
                        EventWaa
                      </strong>

                      <small>
                        No poster available
                      </small>

                    </div>


                    {event?.featured && (

                      <span className="admin-scan-featured">

                        <Star
                          aria-hidden="true"
                        />

                        Featured

                      </span>

                    )}

                  </div>


                  {/* ==========================================
                      CARD CONTENT
                  ========================================== */}

                  <div className="admin-scan-card-content">


                    {/* ========================================
                        EVENT HEADING
                    ======================================== */}

                    <div className="admin-scan-event-heading">

                      <div>

                        <h2>
                          {event?.title ||
                            "Untitled Event"}
                        </h2>

                        <p>
                          Event #{event?.id}
                        </p>

                      </div>


                      <span
                        className={
                          isFree
                            ? "event-type free"
                            : "event-type paid"
                        }
                      >

                        {isFree
                          ? "FREE"
                          : "PAID"}

                      </span>

                    </div>


                    {/* ========================================
                        EVENT INFORMATION
                    ======================================== */}

                    <div className="admin-scan-info">

                      <div>

                        <span>
                          Host
                        </span>

                        <strong>
                          {event?.hostName ||
                            event?.organizerName ||
                            "EventWaa"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Venue
                        </span>

                        <strong>
                          {event?.venue ||
                            "Not specified"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Date
                        </span>

                        <strong>
                          {event?.date ||
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


                    {/* ========================================
                        ATTENDANCE
                    ======================================== */}

                    <div className="admin-scan-attendance">


                      <div>

                        <span>

                          <Ticket
                            aria-hidden="true"
                          />

                          Tickets

                        </span>

                        <strong>
                          {totalTickets.toLocaleString()}
                        </strong>

                      </div>


                      <div>

                        <span>

                          <CheckCircle2
                            aria-hidden="true"
                          />

                          Sold / Used

                        </span>

                        <strong>
                          {ticketsSold.toLocaleString()}
                        </strong>

                      </div>


                      <div>

                        <span>

                          <Clock3
                            aria-hidden="true"
                          />

                          Remaining

                        </span>

                        <strong>
                          {remaining.toLocaleString()}
                        </strong>

                      </div>

                    </div>


                    {/* ========================================
                        SCAN BUTTON
                    ======================================== */}

                    <button
                      type="button"
                      className="select-event-scan-btn"
                      onClick={() =>
                        navigate(
                          `/admin/scan/${event.id}`
                        )
                      }
                    >

                      <Camera
                        aria-hidden="true"
                      />

                      Scan This Event

                    </button>

                  </div>

                </article>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


export default AdminScan;