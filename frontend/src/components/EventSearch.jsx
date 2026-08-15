import { useContext, useEffect, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useNavigate } from "react-router-dom";
import "./EventSearch.css";


function EventSearch(){

    const { events } = useContext(EventContext);

    const navigate = useNavigate();


    const [search,setSearch] = useState("");

    const [suggestions,setSuggestions] = useState([]);



    useEffect(()=>{


        if(!search.trim()){

            setSuggestions([]);

            return;

        }



        const value = search.toLowerCase();



        const results = (events || [])

        .filter(event=>{


            const data = `

            ${event.title || ""}

            ${event.city || ""}

            ${event.location || ""}

            ${event.venue || ""}

            ${event.category || ""}

            `.toLowerCase();



            return data.includes(value);


        })


        .slice(0,5);



        setSuggestions(results);



    },[search,events]);







    const handleEnter = (e)=>{


        if(e.key === "Enter"){


            if(search.trim()){


                navigate(
                    `/events?search=${search}`
                );


                setSuggestions([]);


            }


        }


    };







    const openEvent = (event)=>{


        navigate(
            `/events/${event.id}`
        );


        setSearch("");

        setSuggestions([]);


    };






return (

<div className="event-search-wrapper">


<div className="search-box">


<span>
🔍
</span>



<input

type="text"

placeholder="Search events, cities, venues..."

value={search}

onChange={(e)=>
setSearch(e.target.value)
}

onKeyDown={handleEnter}

/>



</div>





{
suggestions.length > 0 && (

<div className="search-results">


{
suggestions.map(event=>(


<div

key={event.id}

className="search-item"

onClick={()=>
openEvent(event)
}

>


<h4>

{event.title}

</h4>


<p>

📍 {event.city || event.location}

</p>


</div>


))


}


</div>

)

}



</div>


);


}


export default EventSearch;