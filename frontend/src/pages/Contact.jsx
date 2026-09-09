import { useState } from "react";
import "./Contact.css";
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiClock,
  FiSend
} from "react-icons/fi";

function Contact() {

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

    <div className="contact-page">

      {/* HEADER */}

      <div className="contact-header">

        <span className="contact-eyebrow">
          EVENTWAA
        </span>

        <h1>
          Contact EventWaa
        </h1>

        <p>
          Have questions, need support, or want to partner with us?
          We are here to help.
        </p>

      </div>


      <div className="contact-container">


        {/* CONTACT FORM */}

        <div className="contact-form">

          <h2>
            <FiSend className="contact-title-icon" />
            Send Us A Message
          </h2>

          <form onSubmit={handleSubmit}>

            <div className="contact-field">

              <label htmlFor="contact-name">
                Your Name
              </label>

              <input
                id="contact-name"
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>


            <div className="contact-field">

              <label htmlFor="contact-email">
                Your Email
              </label>

              <input
                id="contact-email"
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />

            </div>


            <div className="contact-field">

              <label htmlFor="contact-subject">
                Subject
              </label>

              <input
                id="contact-subject"
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />

            </div>


            <div className="contact-field">

              <label htmlFor="contact-message">
                Message
              </label>

              <textarea
                id="contact-message"
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                required
              />

            </div>


            <button type="submit">

              <span>
                Send Message
              </span>

              <FiSend className="contact-button-icon" />

            </button>

          </form>

        </div>


        {/* CONTACT INFORMATION */}

        <div className="contact-info">

          <h2>
            Support Information
          </h2>


          <div className="info-card">

            <FiMapPin className="info-icon" />

            <div>

              <h3>
                Location
              </h3>

              <p>
                Gulu, Uganda
              </p>

            </div>

          </div>


          <div className="info-card">

            <FiMail className="info-icon" />

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


          <div className="info-card">

            <FiPhone className="info-icon" />

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


          <div className="info-card">

            <FiClock className="info-icon" />

            <div>

              <h3>
                Support Hours
              </h3>

              <p>
                Monday - Saturday
                <br />
                8:00 AM - 6:00 PM
              </p>

            </div>

          </div>


        </div>

      </div>

    </div>

  );

}

export default Contact;