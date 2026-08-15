import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import ScrollControls from "../components/ScrollControls";

function MainLayout() {
    return (
        <>
            <Navbar />

            <Outlet />

            <ScrollControls />

            <footer />
        </>
    );
}

export default MainLayout;