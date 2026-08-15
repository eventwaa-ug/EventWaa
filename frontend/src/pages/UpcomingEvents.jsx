import { useContext, useEffect, useState } from "react";
import { EventContext } from "../context/EventContext";
import { AuthContext } from "../context/AuthContext";
import "../styles/UpcomingEvents.css";


function UpcomingEvents(){

    const {events} = useContext(EventContext);
    const {user} = useContext(AuthContext);

    const [tickets,setTickets] = useState([]);



    // Get user's bookings

    useEffect(()=>{

        if(user){

            fetch("http://localhost:5000/bookings")

            .then(res=>res.json())

            .then(data=>{


                const myTickets = data.filter(

                    booking =>

                    booking.buyer?.email === user.email

                );


                setTickets(myTickets);


            })

            .catch(error=>{

                console.log(error);

            });

        }


    },[user]);





    // Events created by user
    const today = new Data();

    const hostedEvents = events.filter(

        event =>

        event.organizer?.email === user?.email

    );



    return(

        <div className="upcoming-page">


            <h1>
                📅 Upcoming Events
            </h1>



            <section>


            <h2>
                🎤 My Hosted Events
            </h2>


            {
                hostedEvents.length === 0 ?

                <p className="empty-message">
                No up coming hosted events yet.
                </p>


                :

                hostedEvents.map(event=>(


                    <div
                    className="upcoming-card"
                    key={event.id}
                    >

                    <h3>
                    {event.title}
                    </h3>


                    <p>
                    📍 {event.venue}, {event.city}
                    </p>


                    <p>
                    📅 {event.date}
                    </p>


                    <p>
                    ⏰ {event.startTime} - {event.endTime}
                    </p>


                    <p>
                    🎟️ Tickets Sold:
                    {event.ticketsSold || 0}
                    </p>


                    <span className="event-status">
                    {event.status}
                    </span>


                    </div>


                ))

            }


            </section>

            <section>
            <h2>
                🎟️ My Tickets
            </h2>

            {
                tickets.length === 0 ?

                <p className="empty-message">
                No tickets booked yet.
                </p>

                :

                tickets.map(ticket=>(

                    <div
                    className="upcoming-card"
                    key={ticket.id}
                    >
                    <h3>
                    {ticket.event?.title}
                    </h3>
                    <p>
                    🎫 Ticket Type:
                    {ticket.ticketType}
                    </p>
                    <p>
                    💰 Paid:
                    UGX {ticket.amount}
                    </p>
                    <span className="event-status">
                    Confirmed
                    </span>
                    </div>
                ))
            }
            </section>

        </div>
    );
}

export default UpcomingEvents;