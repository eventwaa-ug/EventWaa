import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import { Link } from "react-router-dom";
import {
  Ticket,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import EventCard from "./EventCard";
import "./PaidEvents.css";
function PaidEvents() {
  const { events } = useContext(EventContext);
  const paidEvents = (events || [])
    .filter(
      (event) =>
        event.eventType !== "Free"
    )
    .slice(0, 6);
  return (
    <section className="paid-events">
      {/* ======================================================
          SECTION HEADER
      ====================================================== */}
      <div className="paid-section-header">
        <div className="paid-header-content">
          <span className="paid-badge">
            <Sparkles
              size={15}
              strokeWidth={2.2}
            />
            Premium
          </span>
          <h2>
            Paid events
          </h2>
          <p>
            Concerts, festivals, workshops, and
            memorable experiences worth attending.
          </p>
        </div>
        <Link
          to="/events?type=paid"
          className="paid-see-all"
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
      {paidEvents.length === 0 ? (
        <div className="paid-events-empty">
          <div className="paid-empty-icon">
            <Ticket
              size={28}
              strokeWidth={1.8}
            />
          </div>
          <h3>
            No paid events available
          </h3>
          <p>
            Check back soon for concerts,
            workshops, festivals, and more.
          </p>
          <Link
            to="/events"
            className="paid-browse-btn"
          >
            Browse events
            <ArrowRight
              size={16}
              strokeWidth={2.2}
            />
          </Link>
        </div>
      ) : (
        <div className="paid-events-slider">
          <div className="paid-events-track">
            {paidEvents.map(
              (event) => (
                <div
                  className="paid-event-slide"
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
export default PaidEvents;