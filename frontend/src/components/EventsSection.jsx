import EventCard from "./EventCard";
import "./EventsSection.css";

function EventsSection({ title, subtitle, events, layout }) {
    
  return (
    <section className="events-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button className="see-all-btn">
            See All
        </button>
      </div>

      <div className={layout === "scroll"? "events-scroll":"events-grid"}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
          />
        ))}
      </div>
    </section>
  );
}

export default EventsSection;