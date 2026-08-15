import { Outlet } from "react-router-dom";
import HostSidebar from "../components/HostSidebar";
import "../styles/HostLayout.css";
function HostLayout() {
  return (
    <div className="host-layout">
      <HostSidebar />
      <main className="host-layout-content">
        <Outlet />
      </main>
    </div>
  );
}
export default HostLayout;