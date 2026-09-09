import { Link } from "react-router-dom";
import {
  FiCreditCard,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiArrowRight,
  FiHelpCircle
} from "react-icons/fi";
import "./Support.css";

function Support() {

  const supportTopics = [

    {
      icon: FiCreditCard,
      title: "Ticket Problems",
      text: "Having trouble receiving your ticket, QR code, or booking confirmation?"
    },

    {
      icon: FiDollarSign,
      title: "Payment Issues",
      text: "Problems with payments, failed transactions, or payment confirmations?"
    },

    {
      icon: FiCalendar,
      title: "Event Organizer Help",
      text: "Need help creating events, managing tickets, or becoming a verified host?"
    },

    {
      icon: FiUser,
      title: "Account Problems",
      text: "Issues with login, profile updates, or account security?"
    }

  ];


  const faqs = [

    {
      question: "How do I buy a ticket on EventWaa?",
      answer:
        "Find an event you like, select your ticket type, complete payment, and your ticket will appear in your account."
    },


    {
      question: "How do I become an EventWaa host?",
      answer:
        "Create an account, submit a host application, complete verification, and wait for approval."
    },


    {
      question: "How do refunds work?",
      answer:
        "Refund requests are handled according to the EventWaa Refund Policy. Approved refunds depend on event conditions and payment status."
    },


    {
      question: "Can I contact an event organizer?",
      answer:
        "Yes. Event pages provide organizer contact information and messaging options where available."
    },


    {
      question: "Is my payment information safe?",
      answer:
        "Payments are processed through trusted payment providers. EventWaa does not store your card details."
    }

  ];


  return (

    <div className="support-page">


      {/* HEADER */}

      <div className="support-header">

        <span className="support-eyebrow">
          EVENTWAA
        </span>

        <h1>
          Support Center
        </h1>

        <p>
          Need help? Find answers or contact our support team.
        </p>

      </div>


      {/* SUPPORT TOPICS */}

      <section className="support-topics">

        {
          supportTopics.map((topic, index) => {

            const Icon = topic.icon;

            return (

              <div
                className="support-card"
                key={index}
              >

                <div className="support-icon">

                  <Icon />

                </div>

                <h3>
                  {topic.title}
                </h3>

                <p>
                  {topic.text}
                </p>

              </div>

            );

          })
        }

      </section>


      {/* FAQ */}

      <section className="faq-section">

        <h2>

          <FiHelpCircle className="faq-title-icon" />

          Frequently Asked Questions

        </h2>


        <div className="faq-container">

          {
            faqs.map((faq, index) => (

              <div
                className="faq-card"
                key={index}
              >

                <h3>
                  {faq.question}
                </h3>

                <p>
                  {faq.answer}
                </p>

              </div>

            ))
          }

        </div>

      </section>


      {/* CONTACT */}

      <section className="support-contact">

        <h2>
          Still need help?
        </h2>

        <p>
          Our support team is ready to assist you.
        </p>

        <Link to="/contact">

          <span>
            Contact EventWaa
          </span>

          <FiArrowRight />

        </Link>

      </section>


    </div>

  );

}


export default Support;