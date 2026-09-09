import { useState } from "react";
import "../styles/LegalPages.css";
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiClock,
  FiSend,
  FiHelpCircle,
  FiUsers,
  FiBriefcase,
  FiArrowRight
} from "react-icons/fi";
function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact message:", formData);
    alert(
      "Your message has been sent. EventWaa will get back to you soon!"
    );
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
  };
  return (
    <div className="legal-page">
      {/* HEADER */}
      <div className="legal-header">
        <span className="legal-eyebrow">
          EVENTWAA
        </span>
        <h1>
          Contact EventWaa
        </h1>
        <p>
          We are here to help event organizers, attendees,
          and partners create better event experiences.
        </p>
      </div>
      {/* CONTACT FORM */}
      <section className="legal-section">
        <h2>
          <FiSend className="legal-icon" />
          Send Us a Message
        </h2>
        <p>
          Have a question, need support, or want to work
          with EventWaa? Send us a message and our team
          will get back to you.
        </p>
        <form
          className="contact-form"
          onSubmit={handleSubmit}
        >
          <div className="contact-form-group">
            <label htmlFor="name">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="contact-form-group">
            <label htmlFor="email">
              Your Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="contact-form-group">
            <label htmlFor="subject">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              placeholder="What can we help you with?"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>
          <div className="contact-form-group">
            <label htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Write your message here..."
              value={formData.message}
              onChange={handleChange}
              rows="6"
              required
            />
          </div>
          <button
            type="submit"
            className="contact-submit"
          >
            <span>
              Send Message
            </span>
            <FiSend />
          </button>
        </form>
      </section>
      {/* CONTACT INFORMATION */}
      <section className="legal-section">
        <h2>
          Contact Information
        </h2>
        <div className="contact-info-grid">
          <div className="contact-info-card">
            <FiMapPin className="contact-info-icon" />
            <div>
              <h3>
                Location
              </h3>
              <p>
                Gulu, Uganda
              </p>
            </div>
          </div>
          <div className="contact-info-card">
            <FiMail className="contact-info-icon" />
            <div>
              <h3>
                Email
              </h3>
              <p>
                <a href="mailto:eventwaa.ug@gmail.com">
                  eventwaa.ug@gmail.com
                </a>
              </p>
            </div>
          </div>
          <div className="contact-info-card">
            <FiPhone className="contact-info-icon" />
            <div>
              <h3>
                Phone
              </h3>
              <p>
                <a href="tel:+256767261206">
                  +256 767 261 206
                </a>
              </p>
            </div>
          </div>
          <div className="contact-info-card">
            <FiClock className="contact-info-icon" />
            <div>
              <h3>
                Support Hours
              </h3>
              <p>
                Monday – Saturday
                <br />
                8:00 AM – 6:00 PM
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* ABOUT */}
      <section className="legal-section">
        <h2>
          About EventWaa
        </h2>
        <p>
          EventWaa is a digital event platform that helps people
          discover, create, manage, and attend events across Uganda.
          We connect event organizers with attendees through
          event discovery, ticketing, communication, and event
          management tools.
        </p>
      </section>
      {/* ATTENDEE SUPPORT */}
      <section className="legal-section">
        <h2>
          <FiHelpCircle className="legal-icon" />
          Attendee Support
        </h2>
        <p>
          Need help with a ticket, booking, payment, QR code,
          or attending an event? Contact our support team and
          provide your booking or ticket information where
          applicable so we can assist you more quickly.
        </p>
        <p>
          You can also visit our{" "}
          <a href="/support">
            Support Center
            <FiArrowRight className="inline-icon" />
          </a>
          .
        </p>
      </section>
      {/* ORGANIZER SUPPORT */}
      <section className="legal-section">
        <h2>
          <FiUsers className="legal-icon" />
          Organizer Support
        </h2>
        <p>
          Event organizers can contact us for assistance with
          creating events, managing tickets, handling bookings,
          understanding refunds, and using EventWaa's host tools.
        </p>
      </section>
      {/* PARTNERSHIPS */}
      <section className="legal-section">
        <h2>
          <FiBriefcase className="legal-icon" />
          Partnerships
        </h2>
        <p>
          We are open to working with event organizers,
          businesses, schools, communities, venues, brands,
          and other organizations interested in building
          better event experiences in Uganda.
        </p>
        <p>
          For partnership enquiries, contact us at{" "}
          <a href="mailto:eventwaa.ug@gmail.com">
            eventwaa.ug@gmail.com
          </a>
          .
        </p>
      </section>
      {/* IMPORTANT NOTICE */}
      <section className="legal-section">
        <h2>
          Important Notice
        </h2>
        <p>
          EventWaa is a platform that connects event hosts
          and attendees. Event-specific matters such as
          cancellations, ticket availability, event changes,
          and certain refund decisions may depend on the
          event organizer's policies.
        </p>
        <p>
          For urgent assistance, please contact EventWaa
          support directly.
        </p>
      </section>
      {/* FINAL CONTACT */}
      <section className="legal-section">
        <h2>
          We're Here to Help
        </h2>
        <p>
          Have a question or need assistance?
        </p>
        <p className="final-contact">
          <FiMail />
          <a href="mailto:eventwaa.ug@gmail.com">
            eventwaa.ug@gmail.com
          </a>
        </p>
        <p className="final-contact">
          <FiPhone />
          <a href="tel:+256767261206">
            +256 767 261 206
          </a>
        </p>
      </section>
    </div>
  );
}
export default ContactUs;
