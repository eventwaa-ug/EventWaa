import { useContext, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import EventCard from "../components/EventCard";
import CityChips from "../components/CityChips";
import "./Events.css";


function Events() {


    const { events } = useContext(EventContext);


    const location = useLocation();

    const navigate = useNavigate();



    const params = new URLSearchParams(
        location.search
    );



    const type = params.get("type");

    const featured = params.get("featured");

    const filter = params.get("filter");

    const category = params.get("category");

    const city = params.get("city");


    const search = 
    params.get("search")?.toLowerCase() || "";





    const [searchInput,setSearchInput] = useState(
        search
    );






    const handleSearch = (value)=>{


        setSearchInput(value);



        const newParams = new URLSearchParams(
            location.search
        );



        if(value.trim()){


            newParams.set(
                "search",
                value
            );


        }else{


            newParams.delete(
                "search"
            );


        }



        navigate(
            `/events?${newParams.toString()}`
        );


    };








    const filteredEvents = useMemo(()=>{


        let result = [
            ...(events || [])
        ];





        // SEARCH


        if(search){


            result = result.filter(event=>{


                const searchable = `

                ${event.title || ""}

                ${event.description || ""}

                ${event.venue || ""}

                ${event.city || ""}

                ${event.location || ""}

                ${event.category || ""}

                `.toLowerCase();



                return searchable.includes(search);


            });


        }







        // CITY


        if(city){


            result = result.filter(event=>

                event.city?.toLowerCase()
                ===
                city.toLowerCase()

            );


        }








        // FEATURED


        if(featured === "true"){


            result = result.filter(event=>

                event.featured === true

            );


        }








        // FREE / PAID


        if(type){


            result = result.filter(event=>

                event.eventType === type

            );


        }








        // CATEGORY


        if(category){


            result = result.filter(event=>

                event.category?.toLowerCase()
                ===
                category.toLowerCase()

            );


        }








        // THIS WEEK


        if(filter === "this-week"){



            const today = new Date();



            const nextWeek = new Date();



            nextWeek.setDate(
                today.getDate()+7
            );




            result = result.filter(event=>{


                const eventDate =
                new Date(event.date);



                return (

                    eventDate >= today &&

                    eventDate <= nextWeek

                );


            });


        }






        return result;



    },[

        events,

        search,

        city,

        featured,

        type,

        category,

        filter

    ]);








return (

<div className="events-page">





<div className="events-header">


<h1>


{

search

?

`Results for "${search}"`

:

"Explore Events"

}


</h1>



<p>

{filteredEvents.length}

{" "}

events found

</p>



</div>







{/* SEARCH */}



<div className="events-search">


<input


type="text"


placeholder="Search events, cities, venues..."


value={searchInput}


onChange={(e)=>

handleSearch(e.target.value)

}


/>



</div>







{/* CITIES */}



<CityChips />









{/* FILTERS */}



<div className="sticky-filters">



<Link

to="/events"

className="filter-chip"

>

All

</Link>





<Link

to="/events?filter=this-week"

className="filter-chip"

>

This Week

</Link>






<Link

to="/events?type=Free"

className="filter-chip"

>

Free

</Link>







<Link

to="/events?type=Paid"

className="filter-chip"

>

Paid

</Link>








<Link

to="/events?category=Music"

className="filter-chip"

>

Music

</Link>








<Link

to="/events?category=Sports"

className="filter-chip"

>

Sports

</Link>





<Link

to="/events?category=Business"

className="filter-chip"

>

Business

</Link>







</div>









{/* EVENTS */}



<div className="events-grid">



{

filteredEvents.length === 0 ?



<h2>

No events found

</h2>



:



filteredEvents.map(event=>(


<EventCard

key={event.id}

event={event}

/>


))


}



</div>






</div>


);


}



export default Events;