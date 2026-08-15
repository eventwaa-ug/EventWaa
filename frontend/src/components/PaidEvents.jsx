import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import EventCard from "./EventCard";
import "./PaidEvents.css";
import { Link } from "react-router-dom";


function PaidEvents(){

    const { events } = useContext(EventContext);


    const paidEvents = (events || []).filter(
        event =>
        event.eventType !== "Free"
    );


    return (

        <section className="paid-events">


            <div className="section-header-row">
  <div className="section-header">
    <span className="badge">Premium</span>
    <h2>Paid events</h2>
    <p>Concerts, festivals, workshops, and premium experiences</p>
  </div>

  <Link to="/events?type=paid" className="see-all-link">
    See all →
  </Link>
</div>



            <div className="events-grid">


            {
                paidEvents.length === 0 ?

                <p>
                    No paid events available.
                </p>


                :

                paidEvents.map(event => (

                    <EventCard

                    key={event.id}

                    event={event}

                    />

                ))

            }


            </div>


        </section>

    );


}


export default PaidEvents;