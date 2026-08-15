import { useContext } from "react";
import { Link } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import EventCard from "./EventCard";
import "./HappeningThisWeek.css";

function HappeningThisWeek() {
  const { events } = useContext(EventContext);

  // Today's date
  const today = new Date();

  // Remove the time from today's date
  today.setHours(0, 0, 0, 0);

  // Date 7 days from today
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const thisWeekEvents = (events || [])
    .filter((event) => {
      if (!event.date) {
        return false;
      }

      const eventDate = new Date(event.date);

      // Ignore invalid dates
      if (Number.isNaN(eventDate.getTime())) {
        return false;
      }

      // Remove time from event date
      eventDate.setHours(0, 0, 0, 0);

      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    })
    .slice(0, 4);

  return (
    <section className="week-events">

      <div className="section-header-row">

        <div className="section-header">

          <span className="badge">
            This week
          </span>

          <h2>
            Happening this week
          </h2>

          <p>
            Events you can attend in the next 7 days
          </p>

        </div>


        <Link
          to="/events?filter=this-week"
          className="see-all-link"
        >
          See all →
        </Link>

      </div>


      <div className="week-grid">

        {thisWeekEvents.length === 0 ? (

          <div className="no-week-events">

            <h3>
              No upcoming events this week
            </h3>

            <p>
              Check out all available events and find
              something exciting to attend.
            </p>

            <Link
              to="/events"
              className="view-all-btn"
            >
              Discover Events
            </Link>

          </div>

        ) : (

          thisWeekEvents.map((event) => (

            <EventCard
              key={event.id}
              event={event}
            />

          ))

        )}

      </div>


      {thisWeekEvents.length > 0 && (

        <div className="view-all">

          <Link
            to="/events"
            className="view-all-btn"
          >
            View all events
          </Link>

        </div>

      )}

    </section>
  );
}

export default HappeningThisWeek;