import "./WhyChoose.css";
import { FaCompass, FaTicketAlt, FaUsers } from "react-icons/fa";

function WhyChoose() {
  return (
    <section className="why-section">

      <div className="why-header">
        <h2>Why Choose EventWaa?</h2>

        <p>
          Discover events, book instantly and connect with amazing people
          around you.
        </p>
      </div>

      <div className="why-grid">

        <div className="why-card">
          <div className="why-icon">
            <FaCompass />
          </div>

          <h3>Discover Events</h3>

          <p>
            Find concerts, workshops, sports, picnics and community events
            happening near you.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <FaTicketAlt />
          </div>

          <h3>Easy Booking</h3>

          <p>
            Reserve your ticket in seconds and receive instant confirmation.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <FaUsers />
          </div>

          <h3>Build Community</h3>

          <p>
            Meet new people, create memories and grow your network through
            shared experiences.
          </p>
        </div>

      </div>

    </section>
  );
}

export default WhyChoose;