import { Navigate, useLocation } from "react-router-dom";


function AdminProtectedRoute({ children }) {
    const location = useLocation();


    /* =========================================================
       READ ADMIN TOKEN
    ========================================================= */

    const localToken =
        localStorage.getItem(
            "eventwaa_admin_token"
        );

    const sessionToken =
        sessionStorage.getItem(
            "eventwaa_admin_token"
        );


    const adminToken =
        localToken || sessionToken;


    /* =========================================================
       READ ADMIN INFORMATION
    ========================================================= */

    const localAdmin =
        localStorage.getItem(
            "eventwaa_admin"
        );

    const sessionAdmin =
        sessionStorage.getItem(
            "eventwaa_admin"
        );


    const adminData =
        localAdmin || sessionAdmin;


    /* =========================================================
       DEBUG
       
       Remove these console logs later if you want.
    ========================================================= */

    console.log(
        "ADMIN PROTECTED ROUTE"
    );

    console.log(
        "Admin token exists:",
        Boolean(adminToken)
    );

    console.log(
        "Admin data exists:",
        Boolean(adminData)
    );


    /* =========================================================
       NO ADMIN TOKEN
       
       This is the most important check.

       If there is NO admin token, the user MUST NOT
       see AdminHome.
    ========================================================= */

    if (!adminToken) {

        console.log(
            "NO ADMIN TOKEN → REDIRECTING TO ADMIN LOGIN"
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


    /* =========================================================
       NO ADMIN DATA
    ========================================================= */

    if (!adminData) {

        console.log(
            "ADMIN TOKEN EXISTS BUT ADMIN DATA IS MISSING"
        );


        // Clear invalid session

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


    /* =========================================================
       VALIDATE ADMIN DATA
    ========================================================= */

    let admin;

    try {

        admin = JSON.parse(
            adminData
        );

    } catch (error) {

        console.error(
            "INVALID ADMIN DATA:",
            error
        );


        // Clear corrupted authentication

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


    /* =========================================================
       VALIDATE ADMIN ROLE
    ========================================================= */

    if (
        !admin ||
        admin.role !== "admin"
    ) {

        console.log(
            "INVALID ADMIN ROLE → REDIRECTING"
        );


        // Clear invalid authentication

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


    /* =========================================================
       ADMIN AUTHENTICATED
    ========================================================= */

    console.log(
        "ADMIN AUTHENTICATED → ALLOWING ACCESS"
    );


    return children;

}


export default AdminProtectedRoute;