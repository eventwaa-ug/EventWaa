import { Navigate, useLocation } from "react-router-dom";


function AdminProtectedRoute({ children }) {

    const location = useLocation();


    // =========================================================
    // GET ADMIN AUTHENTICATION TOKEN
    //
    // Check localStorage first for:
    // "Keep me signed in"
    //
    // Then check sessionStorage for:
    // normal session-only login.
    // =========================================================

    const adminToken =
        localStorage.getItem(
            "eventwaa_admin_token"
        ) ||
        sessionStorage.getItem(
            "eventwaa_admin_token"
        );


    // =========================================================
    // GET ADMIN INFORMATION
    //
    // Keep this synchronized with whichever storage
    // contains the admin token.
    // =========================================================

    const adminData =
        localStorage.getItem(
            "eventwaa_admin"
        ) ||
        sessionStorage.getItem(
            "eventwaa_admin"
        );


    // =========================================================
    // NO TOKEN
    //
    // The person is not logged in as admin.
    // Send them to the admin login page.
    // =========================================================

    if (!adminToken) {

        return (
            <Navigate
                to="/admin/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );

    }


    // =========================================================
    // CHECK ADMIN DATA
    // =========================================================

    if (!adminData) {

        localStorage.removeItem(
            "eventwaa_admin_token"
        );

        localStorage.removeItem(
            "eventwaa_admin"
        );

        sessionStorage.removeItem(
            "eventwaa_admin_token"
        );

        sessionStorage.removeItem(
            "eventwaa_admin"
        );


        return (
            <Navigate
                to="/admin/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );

    }


    // =========================================================
    // VALIDATE ADMIN DATA
    // =========================================================

    try {

        const admin = JSON.parse(
            adminData
        );


        if (
            !admin ||
            admin.role !== "admin"
        ) {

            // -----------------------------------------------
            // Clear BOTH possible storage locations
            // -----------------------------------------------

            localStorage.removeItem(
                "eventwaa_admin_token"
            );

            localStorage.removeItem(
                "eventwaa_admin"
            );

            sessionStorage.removeItem(
                "eventwaa_admin_token"
            );

            sessionStorage.removeItem(
                "eventwaa_admin"
            );


            return (
                <Navigate
                    to="/admin/login"
                    replace
                    state={{
                        from: location.pathname
                    }}
                />
            );

        }

    } catch (error) {

        console.error(
            "ADMIN AUTH DATA ERROR:",
            error
        );


        // -----------------------------------------------
        // Clear BOTH storage locations
        // -----------------------------------------------

        localStorage.removeItem(
            "eventwaa_admin_token"
        );

        localStorage.removeItem(
            "eventwaa_admin"
        );

        sessionStorage.removeItem(
            "eventwaa_admin_token"
        );

        sessionStorage.removeItem(
            "eventwaa_admin"
        );


        return (
            <Navigate
                to="/admin/login"
                replace
                state={{
                    from: location.pathname
                }}
            />

        );

    }


    // =========================================================
    // ADMIN IS AUTHENTICATED
    //
    // Allow access to the admin dashboard.
    // =========================================================

    return children;

}


export default AdminProtectedRoute;