import { useEffect, useState } from "react";
import "./AdminHome.css";
import { useNavigate } from "react-router-dom";

function AdminHome() {
    const navigate =useNavigate();

    const [stats, setStats] = useState({
        users: 0,
        events: 0,
        pendingHosts: 0,
        verifiedHosts: 0,
        ticketsSold: 0,
        revenue: 0
    });


    useEffect(() => {

        loadDashboard();

    }, []);


    async function loadDashboard(){

    try{

        const response = await fetch(
            "http://localhost:5000/admin/stats"
        );


        const data = await response.json();


        setStats(data);


    }catch(error){

        console.log(error);

    }

}


    return (

        <div className="admin-home">


            <div className="dashboard-header">

                <h1>
                    Welcome back, Admin 👋
                </h1>

                <p>
                    Manage EventWaa events, hosts and users.
                </p>

            </div>



            <div className="dashboard-cards">


                <div className="dashboard-card">

                    <span>👥</span>

                    <h3>
                        Total Users
                    </h3>

                    <h1>
                        {stats.users}
                    </h1>

                </div>



                <div className="dashboard-card">

                    <span>🎉</span>

                    <h3>
                        Total Events
                    </h3>

                    <h1>
                        {stats.events}
                    </h1>

                </div>



                <div className="dashboard-card">

                    <span>⏳</span>

                    <h3>
                        Pending Hosts
                    </h3>

                    <h1>
                        {stats.pendingHosts}
                    </h1>

                </div>



                <div className="dashboard-card">

                    <span>✅</span>

                    <h3>
                        Verified Hosts
                    </h3>

                    <h1>
                        {stats.verifiedHosts}
                    </h1>

                </div>

                <div className="dashboard-card">

                    <span>🎟️</span>

                    <h3>
                        Tickets Sold
                    </h3>

                    <h1>
                        {stats.ticketsSold}
                    </h1>

                </div>


                <div className="dashboard-card">

                    <span>💰</span>

                    <h3>
                        Revenue
                    </h3>

                    <h1>
                        UGX {stats.revenue}
                    </h1>

                </div>



            </div>



            <div className="dashboard-sections">


                <div className="activity-box">

                    <h2>
                        Recent Activity
                    </h2>

                    <p>
                        📝 New host applications
                    </p>

                    <p>
                        🎟️ Ticket sales activity
                    </p>

                    <p>
                        👤 New users joining
                    </p>


                </div>



                <div className="quick-box">

                    <h2>
                        Quick Actions
                    </h2>


                    <button onClick={() =>navigate("/admin/host-applications")}>
                        Review Hosts
                    </button>


                    <button>
                        Manage Events
                    </button>


                    <button>
                        View Users
                    </button>


                </div>


            </div>


        </div>

    );

}


export default AdminHome;