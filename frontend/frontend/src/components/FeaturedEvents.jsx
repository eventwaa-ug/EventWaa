import EventCard from "./EventCard";
import "./FeaturedEvents.css";
import { motion } from "framer-motion";
import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import { Link } from "react-router-dom";

function FeaturedEvents() {
  const { events } = useContext(EventContext);

  const now = new Date();

  const featuredEvents = (events || [])
    .filter((event) => {

      // Must be marked as featured
      if (event.featured !== true) {
        return false;
      }

      // Make sure the event has a valid date
      const eventDate = new Date(
        event.date || event.eventDate
      );

      // If date is invalid, don't show it
      if (Number.isNaN(eventDate.getTime())) {
        return false;
      }

      // Don't show events that already happened
      return eventDate >= now;
    })
    .slice(0, 3);

  return (
    <section className="featured-events">

      <div className="section-header-row">

        <div className="section-header">

          <span className="badge">
            ⭐ Featured
          </span>

          <h2>
            Featured Events
          </h2>

          <p>
            Don't miss these exciting events happening near you.
          </p>

        </div>


        <Link
          to="/events?featured=true"
          className="see-all-link"
        >
          See all →
        </Link>

      </div>


      <motion.div
        className="featured-grid"

        initial={{
          opacity: 0,
          y: 40
        }}

        whileInView={{
          opacity: 1,
          y: 0
        }}

        viewport={{
          once: true
        }}

        transition={{
          duration: 0.5
        }}
      >

        {featuredEvents.length === 0 ? (

          <div className="no-featured-events">

            <div className="no-featured-icon">
              ⭐
            </div>

            <h3>
              No featured events yet
            </h3>

            <p>
              Check back soon for exciting events
              selected by EventWaa.
            </p>

            <Link
              to="/events"
              className="browse-events-btn"
            >
              Browse All Events
            </Link>

          </div>

        ) : (

          featuredEvents.map((event) => (

            <EventCard
              key={event.id}
              event={event}
            />

          ))

        )}

      </motion.div>

    </section>
  );
}

export default FeaturedEvents;