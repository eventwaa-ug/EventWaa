import { useEffect, useState } from "react";
import "./AdminRevenue.css";

function AdminRevenue(){

    const [revenue,setRevenue] = useState({
        totalRevenue:0,
        ticketsSold:0,
        averageTicket:0,
        events:[]
    });


    useEffect(()=>{

        loadRevenue();

    },[]);



    async function loadRevenue(){

        try{

            const response = await fetch(
                "http://localhost:5000/admin/revenue"
            );


            const data = await response.json();

            setRevenue(data);


        }catch(error){

            console.log(error);

        }

    }



    return(

        <div className="admin-revenue">

            <h1>
                Revenue Management 💰
            </h1>


            <div className="revenue-cards">


                <div className="revenue-card">

                    <h3>
                        Total Revenue
                    </h3>

                    <h1>
                        UGX {revenue.totalRevenue}
                    </h1>

                </div>



                <div className="revenue-card">

                    <h3>
                        Tickets Sold
                    </h3>

                    <h1>
                        {revenue.ticketsSold}
                    </h1>

                </div>



                <div className="revenue-card">

                    <h3>
                        Average Ticket
                    </h3>

                    <h1>
                        UGX {revenue.averageTicket}
                    </h1>

                </div>


            </div>



            <div className="event-revenue">


                <h2>
                    Revenue By Event
                </h2>


                {
                    revenue.events.length === 0 ?

                    <p>
                        No revenue data yet
                    </p>

                    :

                    revenue.events.map(event=>(

                        <div 
                        className="revenue-row"
                        key={event.id}
                        >

                            <h3>
                                {event.title}
                            </h3>

                            <p>
                                Tickets: {event.ticketsSold}
                            </p>

                            <p>
                                Revenue: UGX {event.revenue}
                            </p>


                        </div>

                    ))
                }


            </div>


        </div>

    );

}


export default AdminRevenue;