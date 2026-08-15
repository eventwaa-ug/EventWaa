import { Outlet, Link } from "react-router-dom";
import "./AdminLayout.css";
import { useState } from "react";



function AdminLayout(){
    const [openMenu, setOpenMenu] = useState(false);

    return (

        <div className="admin-layout">


            <aside className={`admin-sidebar ${openMenu? "active": ""}`}>

                <h2>
                    EventWaa
                </h2>

                <p className="admin-title">
                    Admin Panel
                </p>


                <nav>

                    <Link to="/admin"
                    onClick={()=> setOpenMenu(false)}
                    >
                        🏠 Dashboard
                    </Link>


                    <Link to="/admin/users"
                    onClick={()=> setOpenMenu(false)}
                    >
                        👥 Users
                    </Link>


                    <Link to="/admin/events"
                    onClick={()=> setOpenMenu(false)}
                    >
                        🎉 Events
                    </Link>


                    <Link to="/admin/host-applications"
                    onClick={()=> setOpenMenu(false)}
                    >
                        🎤 Host Applications
                    </Link>


                    <Link to="/admin/revenue"
                    onClick={()=> setOpenMenu(false)}
                    >
                        💰 Revenue
                    </Link>

                    <Link to="/admin/refunds"
                    onClick={() => setOpenMenu(false)}
                    >
                        <span>↩️</span>
                        <span>Refunds</span>
                    </Link>

                    <Link to="/admin/reports"
                    onClick={() => setOpenMenu(false)}
                    >
                        <span></span>
                        <span>Reports</span>
                    </Link>


                    <Link to="/admin/settings"
                    onClick={()=> setOpenMenu(false)}
                    >
                        ⚙️ Settings
                    </Link>

                    <Link to="/admin/wallet"
                    onClick={()=> setOpenMenu(false)}
                    >
                        Wallet
                    </Link>


                </nav>


            </aside>



            <main className="admin-content">

                <button 
                className="menu-btn"
                onClick={()=>setOpenMenu(!openMenu)}
                >
                ☰
                </button>

                <Outlet />

            </main>


        </div>

    );

}


export default AdminLayout;