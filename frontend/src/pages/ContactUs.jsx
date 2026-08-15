import "../styles/LegalPages.css";

function ContactUs() {
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


      {/* CONTACT INFORMATION */}
      <section className="legal-section">

        <h2>
          Contact Information
        </h2>

        <p>
          <strong>Platform:</strong> EventWaa
          <br />

          <strong>Location:</strong> Gulu, Uganda
          <br />

          <strong>Email:</strong>{" "}
          <a href="mailto:eventwaa.ug@gmail.com">
            eventwaa.ug@gmail.com
          </a>
          <br />

          <strong>Phone:</strong>{" "}
          <a href="tel:+256767261206">
            +256 767 261 206
          </a>
        </p>

      </section>


      {/* SUPPORT */}
      <section className="legal-section">

        <h2>
          Need Support?
        </h2>

        <p>
          If you are experiencing problems with your account,
          tickets, payments, refunds, or an event, our support
          team is available to assist you.
        </p>

        <p>
          For general support, visit our{" "}
          <a href="/support">
            Support Center
          </a>
          .
        </p>

        <p>
          You can also send us a message through our{" "}
          <a href="/contact">
            Contact Form
          </a>
          .
        </p>

      </section>


      {/* ATTENDEE SUPPORT */}
      <section className="legal-section">

        <h2>
          Attendee Support
        </h2>

        <p>
          Need help with a ticket, booking, payment, QR code,
          or attending an event? Contact our support team and
          provide your booking or ticket information where
          applicable so we can assist you more quickly.
        </p>

      </section>


      {/* ORGANIZER SUPPORT */}
      <section className="legal-section">

        <h2>
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


      {/* SUPPORT HOURS */}
      <section className="legal-section">

        <h2>
          Support Hours
        </h2>

        <p>
          <strong>Monday – Saturday</strong>
          <br />
          8:00 AM – 6:00 PM
        </p>

        <p>
          We aim to respond to support requests as quickly
          as possible during our support hours.
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

        <p>
          📧{" "}
          <a href="mailto:eventwaa.ug@gmail.com">
            eventwaa.ug@gmail.com
          </a>
          <br />

          📞{" "}
          <a href="tel:+256767261206">
            +256 767 261 206
          </a>
        </p>

      </section>

    </div>
  );
}

export default ContactUs;