import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/HostProfile.css";
import { useAuth } from "../context/AuthContext";


function HostProfile(){

    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useAuth();

    const [host,setHost] = useState(null);
    const [events,setEvents] = useState([]);
    const [bookings,setBookings] = useState([]);

    const [followers,setFollowers] = useState(0);
    const [following,setFollowing] = useState(false);


    useEffect(()=>{

        fetch("http://localhost:5000/users")
        .then(res=>res.json())
        .then(users=>{

            const foundHost = users.find(
                user =>
                String(user.id) === String(id)
            );

            setHost(foundHost);

            if(foundHost){

                fetch("http://localhost:5000/events")
                .then(res=>res.json())
                .then(data=>{

                    const hostEvents = data.filter(
                        event =>
                        String(event.hostId)
                        ===
                        String(id)
                    );


                    setEvents(hostEvents);

                });

                fetch("http://localhost:5000/bookings")
                .then(res=>res.json())
                .then(data=>{

                    setBookings(data);

                });

                if(user){

                fetch(
                `http://localhost:5000/follow/check/${id}/${user.id}`
                )

                .then(res=>res.json())

                .then(data=>{

                    setFollowing(data.following);

                });

                fetch(
                    `http://localhost:5000/followers/${id}`
                )
                .then(res => res.json())
                .then(data => {

                    setFollowers(data.count);

                });

                }

            }
        });

    },[id,user]);


    if(!host){

        return <h2>Page Not Found...</h2>;

    }


    const isMyProfile =
    user &&
    String(user.id)
    ===
    String(host.id);

    const totalAttendees =
    bookings
    .filter(ticket=>

        events.some(
            event =>
            event.id === ticket.eventId
        )

    )
    .reduce(
        (total,ticket)=>
        total +
        Number(ticket.quantity || 0),
        0
    );


    const handleFollow = async()=>{

    if(!user){

        alert("Please login to follow this host");


        navigate("/login",{
            state:{
                from:`/host/${id}`
            }
        });


        return;

    }


    const response = await fetch(
        "http://localhost:5000/follow",
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                hostId:Number(id),

                userId:user.id

            })

        }
    );


    const data = await response.json();


    if(data.success){

        setFollowing(true);
        fetch(
            `http://localhost:5000/followers/${id}`
        )
        .then(res => res.json())
        .then(data => {

            setFollowers(data.count);

        });

    }

};

    const handleContact = ()=>{


        alert(
            "Contact Host feature coming soon"
        );


    };

return (

<div className="host-profile">

<div className="host-cover">

<img
src={host.image || "/default-avatar.png"}
alt="host"
className="host-avatar"
/>


<div className="host-name-row">


<h1>
{host.name}
</h1>

{
(host.verifiedHost === true ||
host.verifiedHost === "true")

&&

<span className="verified-badge">

✅ Verified Host

</span>

}


</div>


<h3>
{host.organizerName ||
"Event Organizer"}
</h3>

<p>
{host.location ||
"Gulu, Uganda"}
</p>


<div className="host-actions">


{
isMyProfile ?

<>

<button
onClick={()=>navigate("/dashboard")}
>
⚙️ Manage Dashboard
</button>


<button
onClick={()=>navigate("/edit-host-profile")}
>
✏️ Edit Profile
</button>


</>


:

<>

<button
onClick={handleFollow}
>

{
following
?
"❤️ Following"
:
"🤍 Follow"
}

</button>

<button
onClick={() =>
    navigate(`chat-with-host/${host.id}`)
}
>

💬 Chat with Host

</button>


</>


}

</div>

</div>


<div className="host-about">


<h2>
About
</h2>

<p>

{
host.description ||
"Creating amazing experiences on EventWaa."
}

</p>


</div>


<div className="host-stats">


<div>

<h3>
{events.length}
</h3>

<p>
📅 Events Hosted
</p>

</div>



<div>

<h3>
{totalAttendees}
</h3>

<p>
👥 Attendees
</p>

</div>




<div>

<h3>
{followers}
</h3>


<p>
❤️ Followers
</p>


</div>



</div>







<div className="host-events">


<h2>
Upcoming Events
</h2>




{

events.length === 0

?

<p>
No upcoming events
</p>


:


events.map(event=>(


<div
className="public-event-card"
key={event.id}
>


<img

src={
event.eventPoster ||
"https://via.placeholder.com/300"
}

alt={event.title}

/>



<div>


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
UGX {event.price}
</p>



<button

onClick={()=>
navigate(`/events/${event.id}`)
}

>

View Event

</button>

</div>

</div>

))

}

</div>


</div>


);


}


export default HostProfile;