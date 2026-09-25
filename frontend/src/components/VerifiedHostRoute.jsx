import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function VerifiedHostRoute({ children }) {
    const { user } = useAuth();

    // ============================================================
    // USER MUST BE LOGGED IN
    // ============================================================

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // ============================================================
    // USER MUST BE A VERIFIED HOST
    // ============================================================

    if (user.verifiedHost !== true) {
        return (
            <Navigate
                to="/host-application"
                replace
            />
        );
    }

    // ============================================================
    // VERIFIED HOST
    // ============================================================

    return children;
}

export default VerifiedHostRoute;