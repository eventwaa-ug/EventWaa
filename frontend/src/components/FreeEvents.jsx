import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import EventCard from "./EventCard";
import "./FreeEvents.css";
import { Link } from "react-router-dom";


function FreeEvents(){


const {events}=useContext(EventContext);



const freeEvents = (events || []).filter(
    event =>
    event.eventType === "Free"
);



return(

<section className="free-events">


<div className="section-header-row">
  <div className="section-header">
    <span className="badge">Free</span>
    <h2>Free events</h2>
    <p>Attend amazing events without paying an entrance fee</p>
  </div>

  <Link to="/events?type=free" className="see-all-link">
    See all →
  </Link>
</div>



<div className="events-grid">


{
freeEvents.length === 0 ?


<p>
No free events available.
</p>


:


freeEvents.map(event=>(

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


export default FreeEvents;