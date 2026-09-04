import EventCard from "./EventCard";
import "./FeaturedEvents.css";

import { motion } from "framer-motion";
import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import { Link } from "react-router-dom";

import {
  Star,
  ArrowRight,
  CalendarX,
} from "lucide-react";


function FeaturedEvents() {

  const { events } =
    useContext(EventContext);


  const now =
    new Date();


  const featuredEvents =
    (events || [])
      .filter((event) => {

        // Must be marked as featured
        if (
          event.featured !== true
        ) {
          return false;
        }


        // Get event date
        const eventDate =
          new Date(
            event.date ||
            event.eventDate
          );


        // Ignore invalid dates
        if (
          Number.isNaN(
            eventDate.getTime()
          )
        ) {
          return false;
        }


        // Only upcoming events
        return eventDate >= now;

      })
      .slice(0, 3);


  return (

    <section className="featured-events">


      {/* ======================================================
          SECTION HEADER
      ====================================================== */}

      <div className="section-header-row">


        <div className="section-header">


          <span className="featured-badge">

            <Star
              size={15}
              strokeWidth={2.3}
              fill="currentColor"
            />

            Featured

          </span>


          <h2>
            Featured Events
          </h2>


          <p>
            Discover standout experiences
            happening near you.
          </p>


        </div>


        <Link
          to="/events?featured=true"
          className="see-all-link"
        >

          <span>
            See all events
          </span>

          <ArrowRight
            size={17}
            strokeWidth={2.2}
          />

        </Link>


      </div>



      {/* ======================================================
          EVENTS
      ====================================================== */}

      <motion.div
        className="featured-grid"

        initial={{
          opacity: 0,
          y: 24,
        }}

        whileInView={{
          opacity: 1,
          y: 0,
        }}

        viewport={{
          once: true,
          amount: 0.15,
        }}

        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >


        {featuredEvents.length === 0 ? (

          <div className="no-featured-events">


            <div className="no-featured-icon">

              <CalendarX
                size={34}
                strokeWidth={1.8}
              />

            </div>


            <h3>
              No featured events yet
            </h3>


            <p>
              Check back soon for exciting
              experiences selected by EventWaa.
            </p>


            <Link
              to="/events"
              className="browse-events-btn"
            >

              Browse all events

              <ArrowRight
                size={17}
                strokeWidth={2.2}
              />

            </Link>


          </div>

        ) : (

          featuredEvents.map(
            (event) => (

              <div
                className="featured-event-item"
                key={event.id}
              >

                <EventCard
                  event={event}
                />

              </div>

            )
          )

        )}


      </motion.div>


    </section>

  );

}


export default FeaturedEvents;