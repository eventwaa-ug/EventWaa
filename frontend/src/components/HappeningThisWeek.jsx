import { useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import EventCard from "./EventCard";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./HappeningThisWeek.css";

function HappeningThisWeek() {
  const { events } = useContext(EventContext);

  const sliderRef = useRef(null);

  // ============================================================
  // TODAY
  // ============================================================

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  // ============================================================
  // NEXT 7 DAYS
  // ============================================================

  const nextWeek = new Date(
    today
  );

  nextWeek.setDate(
    nextWeek.getDate() + 7
  );


  // ============================================================
  // THIS WEEK EVENTS
  // ============================================================

  const thisWeekEvents = (
    events || []
  )
    .filter((event) => {

      if (!event?.date) {
        return false;
      }

      const eventDate =
        new Date(
          event.date
        );

      if (
        Number.isNaN(
          eventDate.getTime()
        )
      ) {
        return false;
      }

      eventDate.setHours(
        0,
        0,
        0,
        0
      );

      return (
        eventDate >= today &&
        eventDate <= nextWeek
      );

    })
    .sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    )
    .slice(0, 6);


  // ============================================================
  // SLIDER CONTROLS
  // ============================================================

  const scrollSlider = (
    direction
  ) => {

    if (
      !sliderRef.current
    ) {
      return;
    }

    const amount =
      sliderRef.current
        .clientWidth * 0.72;

    sliderRef.current.scrollBy({
      left:
        direction === "next"
          ? amount
          : -amount,
      behavior: "smooth",
    });

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <section className="week-events">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="week-section-header">


        <div className="week-heading-content">

          <div className="week-heading-top">

            <span className="week-badge">

              <CalendarDays
                size={15}
                strokeWidth={2.2}
              />

              This week

            </span>

          </div>


          <h2>
            Happening this week
          </h2>


          <p>
            Events you can attend in the
            next 7 days.
          </p>

        </div>


        <div className="week-header-actions">

          {thisWeekEvents.length > 0 && (

            <div className="week-slider-controls">

              <button
                type="button"
                className="week-slider-btn"
                aria-label="Previous events"
                onClick={() =>
                  scrollSlider("prev")
                }
              >

                <ChevronLeft
                  size={20}
                  strokeWidth={2.3}
                />

              </button>


              <button
                type="button"
                className="week-slider-btn"
                aria-label="Next events"
                onClick={() =>
                  scrollSlider("next")
                }
              >

                <ChevronRight
                  size={20}
                  strokeWidth={2.3}
                />

              </button>

            </div>

          )}


          <Link
            to="/events?filter=this-week"
            className="week-see-all"
          >
            See all
            <ChevronRight
              size={17}
              strokeWidth={2.3}
            />
          </Link>

        </div>

      </div>


      {/* ======================================================
          EVENTS
      ====================================================== */}

      {thisWeekEvents.length === 0 ? (

        <div className="no-week-events">

          <div className="no-week-icon">

            <CalendarDays
              size={30}
              strokeWidth={2}
            />

          </div>


          <h3>
            No upcoming events this week
          </h3>


          <p>
            Check out all available events
            and find something exciting to attend.
          </p>


          <Link
            to="/events"
            className="view-all-btn"
          >
            Discover Events
          </Link>

        </div>

      ) : (

        <div
          className="week-slider"
          ref={sliderRef}
        >

          <div className="week-grid">

            {thisWeekEvents.map(
              (event) => (

                <div
                  className="week-event-card"
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


      {/* ======================================================
          BOTTOM VIEW ALL
      ====================================================== */}

      {thisWeekEvents.length > 0 && (

        <div className="week-view-all">

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