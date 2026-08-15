import "./TrendingEvents.css";
import EventCard from "./EventCard";
import { useContext } from "react";
import { EventContext } from "../context/EventContext";

function TrendingEvents() {
  const {events} = useContext(EventContext);
  const trending = (events || []).slice(0, 3);

  return (
    <section className="trending-section">
      <div className="section-header">
        <div className="section-text">
        <p className="section-tag">🔥 POPULAR NOW</p>
        <h2>Trending This Week</h2>
        <p className="section-description">Discover the events everyone is talking about this week</p>
      </div>
      <button className="see-all"> 
        View All
      </button>
      </div>

      <div className="trending-grid">
        {trending.map((event) => (
          <EventCard
            key={event.id}
            event={event}
          />
        ))}
      </div>
    </section>
  );
}

export default TrendingEvents;