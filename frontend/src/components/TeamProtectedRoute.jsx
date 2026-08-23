import { Navigate, useLocation } from "react-router-dom";
function TeamProtectedRoute({ children }) {
    const location = useLocation();
    // ============================================================
    // TEAM AUTHENTICATION
    //
    // AdminTeamLogin.jsx stores:
    //
    // eventwaa_team_token
    // eventwaaTeamAccount
    // eventwaaTeamLoggedIn
    //
    // We keep all three so we do NOT break the existing system.
    // ============================================================
    const teamToken =
        localStorage.getItem(
            "eventwaa_team_token"
        );
    const teamAccount =
        localStorage.getItem(
            "eventwaaTeamAccount"
        );
    const teamLoggedIn =
        localStorage.getItem(
            "eventwaaTeamLoggedIn"
        );
    // ============================================================
    // DEBUG
    // ============================================================
    console.log(
        "TEAM PROTECTED ROUTE"
    );
    console.log(
        "Team logged in:",
        teamLoggedIn
    );
    console.log(
        "Team token exists:",
        Boolean(teamToken)
    );
    console.log(
        "Team account exists:",
        Boolean(teamAccount)
    );
    // ============================================================
    // NO TEAM AUTHENTICATION
    //
    // IMPORTANT:
    //
    // We now require the token as well.
    //
    // This does NOT change the existing login flow.
    // AdminTeamLogin.jsx already creates and stores the token.
    // ============================================================
    if (
        teamLoggedIn !== "true" ||
        !teamAccount ||
        !teamToken
    ) {
        console.log(
            "NO TEAM AUTHENTICATION → REDIRECTING TO TEAM LOGIN"
        );
        return (
            <Navigate
                to="/admin/team-login"
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    // ============================================================
    // VALIDATE TEAM ACCOUNT JSON
    // ============================================================
    let account;
    try {
        account =
            JSON.parse(
                teamAccount
            );
    } catch (error) {
        console.error(
            "INVALID TEAM ACCOUNT:",
            error
        );
        localStorage.removeItem(
            "eventwaaTeamAccount"
        );
        localStorage.removeItem(
            "eventwaaTeamLoggedIn"
        );
        localStorage.removeItem(
            "eventwaa_team_token"
        );
        return (
            <Navigate
                to="/admin/team-login"
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    // ============================================================
    // VALIDATE ACCOUNT
    // ============================================================
    if (
        !account ||
        !account.email
    ) {
        console.log(
            "INCOMPLETE TEAM ACCOUNT → REDIRECTING"
        );
        localStorage.removeItem(
            "eventwaaTeamAccount"
        );
        localStorage.removeItem(
            "eventwaaTeamLoggedIn"
        );
        localStorage.removeItem(
            "eventwaa_team_token"
        );
        return (
            <Navigate
                to="/admin/team-login"
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    // ============================================================
    // CHECK ACCOUNT STATUS
    //
    // We preserve your existing behaviour.
    // ============================================================
    if (
        account.status &&
        String(
            account.status
        ).toLowerCase() !== "active"
    ) {
        console.log(
            "TEAM ACCOUNT DISABLED"
        );
        localStorage.removeItem(
            "eventwaaTeamAccount"
        );
        localStorage.removeItem(
            "eventwaaTeamLoggedIn"
        );
        localStorage.removeItem(
            "eventwaa_team_token"
        );
        return (
            <Navigate
                to="/admin/team-login"
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    // ============================================================
    // AUTHENTICATED
    // ============================================================
    console.log(
        "TEAM AUTHENTICATED → ALLOWING ACCESS"
    );
    return children;
}
export default TeamProtectedRoute;