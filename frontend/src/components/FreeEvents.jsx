import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import { Link } from "react-router-dom";
import { Ticket, ArrowRight } from "lucide-react";
import EventCard from "./EventCard";
import "./FreeEvents.css";
function FreeEvents() {
  const { events } = useContext(EventContext);
  const freeEvents = (events || [])
    .filter(
      (event) =>
        event.eventType === "Free"
    )
    .slice(0, 6);
  return (
    <section className="free-events">
      {/* ======================================================
          SECTION HEADER
      ====================================================== */}
      <div className="free-section-header">
        <div className="free-header-content">
          <span className="free-badge">
            <Ticket
              size={15}
              strokeWidth={2.2}
            />
            Free
          </span>
          <h2>
            Free events
          </h2>
          <p>
            Discover amazing experiences you can
            enjoy without an entrance fee.
          </p>
        </div>
        <Link
          to="/events?type=free"
          className="free-see-all"
        >
          See all
          <ArrowRight
            size={17}
            strokeWidth={2.2}
          />
        </Link>
      </div>
      {/* ======================================================
          EVENTS
      ====================================================== */}
      {freeEvents.length === 0 ? (
        <div className="free-events-empty">
          <div className="free-empty-icon">
            <Ticket
              size={28}
              strokeWidth={1.8}
            />
          </div>
          <h3>
            No free events available
          </h3>
          <p>
            Check back soon for free events
            and experiences near you.
          </p>
          <Link
            to="/events"
            className="free-browse-btn"
          >
            Browse events
            <ArrowRight
              size={16}
              strokeWidth={2.2}
            />
          </Link>
        </div>
      ) : (
        <div className="free-events-slider">
          <div className="free-events-track">
            {freeEvents.map(
              (event) => (
                <div
                  className="free-event-slide"
                  key={event.id}
                >
                  <EventCard
                    event={event}
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}
export default FreeEvents;