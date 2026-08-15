import { useState } from "react";
import "./Contact.css";

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

    alert("Your message has been sent. EventWaa will get back to you soon!");

    setFormData({
      name:"",
      email:"",
      subject:"",
      message:""
    });

  };


  return (

    <div className="contact-page">

      <div className="contact-header">

        <h1>Contact EventWaa</h1>

        <p>
          Have questions, need support, or want to partner with us?
          We are here to help.
        </p>

      </div>


      <div className="contact-container">


        {/* Contact Form */}

        <div className="contact-form">

          <h2>Send Us A Message</h2>


          <form onSubmit={handleSubmit}>


            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />


            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
            />


            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />


            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              rows="6"
              required
            />


            <button type="submit">
              Send Message
            </button>


          </form>


        </div>



        {/* Contact Information */}

        <div className="contact-info">


          <h2>Support Information</h2>


          <div className="info-card">

            <h3>📍 Location</h3>

            <p>
              Gulu, Uganda
            </p>

          </div>



          <div className="info-card">

            <h3>📧 Email</h3>

            <p>
              eventwaa.ug@gmail.com
            </p>

          </div>



          <div className="info-card">

            <h3>📞 Phone</h3>

            <p>
              +256 767 261 206
            </p>

          </div>


          <div className="info-card">

            <h3>🕒 Support Hours</h3>

            <p>
              Monday - Saturday
              <br/>
              8:00 AM - 6:00 PM
            </p>

          </div>



        </div>


      </div>


    </div>

  );

}


export default Contact;