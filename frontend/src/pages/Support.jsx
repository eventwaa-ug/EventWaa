import { Link } from "react-router-dom";
import "./Support.css";

function Support(){

  const supportTopics = [

    {
      icon:"🎟️",
      title:"Ticket Problems",
      text:"Having trouble receiving your ticket, QR code, or booking confirmation?"
    },

    {
      icon:"💳",
      title:"Payment Issues",
      text:"Problems with payments, failed transactions, or payment confirmations?"
    },

    {
      icon:"🎪",
      title:"Event Organizer Help",
      text:"Need help creating events, managing tickets, or becoming a verified host?"
    },

    {
      icon:"👤",
      title:"Account Problems",
      text:"Issues with login, profile updates, or account security?"
    }

  ];



  const faqs = [

    {
      question:"How do I buy a ticket on EventWaa?",
      answer:
      "Find an event you like, select your ticket type, complete payment, and your ticket will appear in your account."
    },


    {
      question:"How do I become an EventWaa host?",
      answer:
      "Create an account, submit a host application, complete verification, and wait for approval."
    },


    {
      question:"How do refunds work?",
      answer:
      "Refund requests are handled according to the EventWaa Refund Policy. Approved refunds depend on event conditions and payment status."
    },


    {
      question:"Can I contact an event organizer?",
      answer:
      "Yes. Event pages provide organizer contact information and messaging options where available."
    },


    {
      question:"Is my payment information safe?",
      answer:
      "Payments are processed through trusted payment providers. EventWaa does not store your card details."
    }

  ];



  return(

    <div className="support-page">


      <div className="support-header">

        <h1>
          EventWaa Support Center
        </h1>

        <p>
          Need help? Find answers or contact our support team.
        </p>

      </div>




      <section className="support-topics">


        {
          supportTopics.map((topic,index)=>(

            <div 
              className="support-card"
              key={index}
            >

              <div className="support-icon">
                {topic.icon}
              </div>

              <h3>
                {topic.title}
              </h3>

              <p>
                {topic.text}
              </p>


            </div>

          ))
        }


      </section>





      <section className="faq-section">


        <h2>
          Frequently Asked Questions
        </h2>



        <div className="faq-container">


          {
            faqs.map((faq,index)=>(

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





      <section className="support-contact">


        <h2>
          Still need help?
        </h2>


        <p>
          Our support team is ready to assist you.
        </p>


        <Link to="/contact">
          Contact EventWaa
        </Link>


      </section>



    </div>

  );

}


export default Support;