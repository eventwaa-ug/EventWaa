import { Navigate, useLocation } from "react-router-dom";
/* ============================================================
   TEAM PROTECTED ROUTE
   This guard supports TWO completely separate Team portals:
   REGULAR TEAM
   /team-...
   
   ADMIN TEAM
   /admin/team-...
   IMPORTANT:
   Their authentication storage is intentionally separate.
============================================================ */
function TeamProtectedRoute({ children }) {
    const location = useLocation();
    /* ============================================================
       DETERMINE WHICH TEAM PORTAL IS BEING USED
    ============================================================ */
    const isAdminTeamRoute =
        location.pathname.startsWith("/admin/team");
    /* ============================================================
       SELECT THE CORRECT STORAGE KEYS
       ADMIN TEAM:
       eventwaa_admin_team_token
       eventwaaAdminTeamAccount
       eventwaaAdminTeamLoggedIn
       REGULAR TEAM:
       eventwaa_team_token
       eventwaaTeamAccount
       eventwaaTeamLoggedIn
    ============================================================ */
    const tokenKey =
        isAdminTeamRoute
            ? "eventwaa_admin_team_token"
            : "eventwaa_team_token";
    const accountKey =
        isAdminTeamRoute
            ? "eventwaaAdminTeamAccount"
            : "eventwaaTeamAccount";
    const loggedInKey =
        isAdminTeamRoute
            ? "eventwaaAdminTeamLoggedIn"
            : "eventwaaTeamLoggedIn";
    /* ============================================================
       CORRECT LOGIN PAGE
    ============================================================ */
    const loginPath =
        isAdminTeamRoute
            ? "/admin/team-login"
            : "/team-login";
    /* ============================================================
       READ TOKEN
       Check localStorage first, then sessionStorage.
    ============================================================ */
    const teamToken =
        localStorage.getItem(tokenKey) ||
        sessionStorage.getItem(tokenKey);
    /* ============================================================
       READ ACCOUNT
    ============================================================ */
    const teamAccount =
        localStorage.getItem(accountKey) ||
        sessionStorage.getItem(accountKey);
    /* ============================================================
       READ LOGIN STATE
    ============================================================ */
    const teamLoggedIn =
        localStorage.getItem(loggedInKey) ||
        sessionStorage.getItem(loggedInKey);
    /* ============================================================
       DEBUG
    ============================================================ */
    console.log(
        "TEAM PROTECTED ROUTE:",
        {
            pathname:
                location.pathname,
            isAdminTeamRoute,
            tokenKey,
            accountKey,
            loggedInKey,
            hasToken:
                Boolean(teamToken),
            hasAccount:
                Boolean(teamAccount),
            loggedIn:
                teamLoggedIn,
        }
    );
    /* ============================================================
       HELPER — CLEAR ONLY THE CURRENT TEAM PORTAL
       IMPORTANT:
       If Admin Team is being logged out/rejected, we DO NOT
       touch Regular Team storage.
       If Regular Team is being logged out/rejected, we DO NOT
       touch Admin Team storage.
    ============================================================ */
    const clearCurrentTeamSession = () => {
        localStorage.removeItem(
            tokenKey
        );
        localStorage.removeItem(
            accountKey
        );
        localStorage.removeItem(
            loggedInKey
        );
        sessionStorage.removeItem(
            tokenKey
        );
        sessionStorage.removeItem(
            accountKey
        );
        sessionStorage.removeItem(
            loggedInKey
        );
    };
    /* ============================================================
       NO TEAM AUTHENTICATION
    ============================================================ */
    if (
        teamLoggedIn !== "true" ||
        !teamAccount ||
        !teamToken
    ) {
        console.log(
            "NO TEAM AUTHENTICATION → REDIRECTING TO:",
            loginPath
        );
        return (
            <Navigate
                to={loginPath}
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    /* ============================================================
       PARSE TEAM ACCOUNT
    ============================================================ */
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
        clearCurrentTeamSession();
        return (
            <Navigate
                to={loginPath}
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    /* ============================================================
       VALIDATE ACCOUNT OBJECT
    ============================================================ */
    if (
        !account ||
        !account.email
    ) {
        console.log(
            "INCOMPLETE TEAM ACCOUNT → REDIRECTING TO:",
            loginPath
        );
        clearCurrentTeamSession();
        return (
            <Navigate
                to={loginPath}
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    /* ============================================================
       VALIDATE TEAM TYPE
       ADMIN TEAM route:
       teamType must be "admin" when supplied.
       REGULAR TEAM route:
       teamType must be "host" when supplied.
       We only enforce this when teamType exists so older
       existing sessions without teamType remain compatible.
    ============================================================ */
    const accountTeamType =
        account.teamType
            ? String(
                account.teamType
            ).toLowerCase()
            : "";
    if (
        isAdminTeamRoute &&
        accountTeamType &&
        accountTeamType !== "admin"
    ) {
        console.error(
            "WRONG TEAM TYPE FOR ADMIN TEAM ROUTE:",
            accountTeamType
        );
        clearCurrentTeamSession();
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
    if (
        !isAdminTeamRoute &&
        accountTeamType &&
        accountTeamType !== "host"
    ) {
        console.error(
            "WRONG TEAM TYPE FOR REGULAR TEAM ROUTE:",
            accountTeamType
        );
        clearCurrentTeamSession();
        return (
            <Navigate
                to="/team-login"
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    /* ============================================================
       CHECK ACCOUNT STATUS
    ============================================================ */
    if (
        account.status &&
        String(
            account.status
        ).toLowerCase() !== "active"
    ) {
        console.log(
            "TEAM ACCOUNT DISABLED → REDIRECTING TO:",
            loginPath
        );
        clearCurrentTeamSession();
        return (
            <Navigate
                to={loginPath}
                replace
                state={{
                    from:
                        location.pathname
                }}
            />
        );
    }
    /* ============================================================
       AUTHENTICATED
    ============================================================ */
    console.log(
        isAdminTeamRoute
            ? "ADMIN TEAM AUTHENTICATED → ALLOWING ACCESS"
            : "REGULAR TEAM AUTHENTICATED → ALLOWING ACCESS"
    );
    return children;
}
export default TeamProtectedRoute;