import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShieldCheck,
    LogOut,
    Ticket,
    ScanLine,
    Search,
    CalendarDays,
    MapPin,
    Clock,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    UserCircle,
    RefreshCw,
    Eye,
} from "lucide-react";
import "./TeamMemberDashboard.css";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";

/* ============================================================
   BACKEND
============================================================ */

const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000";


/* ============================================================
   TEAM MEMBER DASHBOARD
============================================================ */

function TeamMemberDashboard() {

    const navigate = useNavigate();

    const { settings } =
        usePlatformSettings();


    /* ==========================================================
       STATE
    ========================================================== */

    const [teamMember, setTeamMember] =
        useState(null);

    const [events, setEvents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadingEvents, setLoadingEvents] =
        useState(false);

    const [error, setError] =
        useState("");

    const [searchTerm, setSearchTerm] =
        useState("");


    /* ==========================================================
       TEAM TOKEN
    ========================================================== */

    const getTeamToken = () => {

        return (
            localStorage.getItem(
                "eventwaa_team_token"
            ) ||
            sessionStorage.getItem(
                "eventwaa_team_token"
            )
        );

    };


    /* ==========================================================
       STORED TEAM MEMBER
    ========================================================== */

    const getStoredTeamMember = () => {

        const stored =
            localStorage.getItem(
                "eventwaa_team_member"
            );

        if (!stored) {
            return null;
        }

        try {

            return JSON.parse(
                stored
            );

        } catch (error) {

            console.error(
                "INVALID STORED TEAM MEMBER:",
                error
            );

            return null;

        }

    };


    /* ==========================================================
       AUTH HEADERS
    ========================================================== */

    const getAuthHeaders = () => {

        const token =
            getTeamToken();

        return {
            Accept:
                "application/json",

            ...(token
                ? {
                    Authorization:
                        `Bearer ${token}`,
                }
                : {}),
        };

    };


    /* ==========================================================
       MEDIA URL
    ========================================================== */

    const getMediaUrl = (url) => {

        if (!url) {
            return "";
        }

        const value =
            String(url).trim();

        if (!value) {
            return "";
        }

        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("data:") ||
            value.startsWith("blob:")
        ) {
            return value;
        }

        if (value.startsWith("/")) {
            return `${BACKEND_URL}${value}`;
        }

        return `${BACKEND_URL}/${value}`;

    };


    /* ==========================================================
       CLEAR TEAM SESSION
    ========================================================== */

    const clearTeamSession = () => {

        localStorage.removeItem(
            "eventwaa_team_token"
        );

        sessionStorage.removeItem(
            "eventwaa_team_token"
        );

        localStorage.removeItem(
            "eventwaa_team_user"
        );

        localStorage.removeItem(
            "eventwaa_team_member"
        );

        localStorage.removeItem(
            "eventwaaTeamAccount"
        );

        localStorage.removeItem(
            "eventwaaTeamLoggedIn"
        );

    };


    /* ==========================================================
       LOGOUT
    ========================================================== */

    const handleLogout = () => {

        clearTeamSession();

        navigate(
            "/team-login",
            {
                replace: true,
            }
        );

    };


    /* ==========================================================
       LOAD TEAM SESSION
    ========================================================== */

    const loadTeamSession = async () => {

        const token =
            getTeamToken();


        /* ------------------------------------------------------
           NO TOKEN
        ------------------------------------------------------ */

        if (!token) {

            console.log(
                "NO TEAM TOKEN → /team-login"
            );

            navigate(
                "/team-login",
                {
                    replace: true,
                }
            );

            return null;

        }


        try {

            const response =
                await fetch(
                    `${BACKEND_URL}/team-session`,
                    {
                        method: "GET",
                        headers:
                            getAuthHeaders(),
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            console.log(
                "TEAM SESSION RESPONSE:",
                response.status,
                data
            );


            /* --------------------------------------------------
               SESSION ENDPOINT NOT FOUND
            -------------------------------------------------- */

            if (
                response.status === 404
            ) {

                console.warn(
                    "TEAM SESSION ENDPOINT NOT FOUND. USING STORED TEAM MEMBER."
                );

                const storedMember =
                    getStoredTeamMember();

                if (storedMember) {

                    setTeamMember(
                        storedMember
                    );

                    return storedMember;

                }

            }


            /* --------------------------------------------------
               INVALID SESSION
            -------------------------------------------------- */

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Your team session has expired."
                );

            }


            /* --------------------------------------------------
               VALID SESSION
            -------------------------------------------------- */

            const member =
                data.teamMember ||
                data.team_member ||
                data.member ||
                data.user ||
                null;


            if (!member) {

                throw new Error(
                    "Team member information was not returned."
                );

            }


            setTeamMember(
                member
            );


            /* --------------------------------------------------
               KEEP LOCAL STORAGE SYNCHRONIZED
            -------------------------------------------------- */

            localStorage.setItem(
                "eventwaa_team_member",
                JSON.stringify(
                    member
                )
            );


            return member;

        } catch (err) {

            console.error(
                "TEAM SESSION ERROR:",
                err
            );


            /* --------------------------------------------------
               EXISTING LOCAL FALLBACK
            -------------------------------------------------- */

            const storedMember =
                getStoredTeamMember();


            if (
                storedMember &&
                getTeamToken()
            ) {

                console.warn(
                    "USING STORED TEAM SESSION"
                );

                setTeamMember(
                    storedMember
                );

                return storedMember;

            }


            clearTeamSession();


            navigate(
                "/team-login",
                {
                    replace: true,
                }
            );


            return null;

        }

    };


    /* ==========================================================
       EVENT ID
    ========================================================== */

    const getEventId = (event) => {

        if (!event) {
            return null;
        }

        return (
            event?.id ??
            event?._id ??
            event?.eventId ??
            event?.event_id ??
            event?.eventID ??
            null
        );

    };


    /* ==========================================================
       EVENT TITLE
    ========================================================== */

    const getEventTitle = (event) => {

        return (
            event?.title ||
            event?.eventTitle ||
            event?.name ||
            "Untitled Event"
        );

    };


    /* ==========================================================
       EVENT DATE
    ========================================================== */

    const getEventDate = (event) => {

        return (
            event?.date ||
            event?.eventDate ||
            event?.startDate ||
            event?.start_date
        );

    };


    /* ==========================================================
       EVENT IMAGE
    ========================================================== */

    const getEventImage = (event) => {

        return (
            event?.eventPoster ||
            event?.poster ||
            event?.image ||
            event?.imageUrl ||
            event?.posterUrl ||
            event?.eventImage ||
            ""
        );

    };


    /* ==========================================================
       ASSIGNED EVENT IDS
       
       Supports the different assignment structures that may
       already exist in the backend.
    ========================================================== */

    const getAssignedEventIds = (member) => {

        if (!member) {
            return [];
        }


        const ids = [];


        /* ------------------------------------------------------
           DIRECT ARRAY
        ------------------------------------------------------ */

        if (
            Array.isArray(
                member.eventIds
            )
        ) {

            member.eventIds.forEach(
                (id) => {

                    if (
                        id !== null &&
                        id !== undefined
                    ) {

                        if (
                            typeof id === "object"
                        ) {

                            const objectId =
                                getEventId(id);

                            if (objectId) {

                                ids.push(
                                    String(
                                        objectId
                                    )
                                );

                            }

                        } else {

                            ids.push(
                                String(id)
                            );

                        }

                    }

                }
            );

        }


        /* ------------------------------------------------------
           SINGLE EVENT ID
        ------------------------------------------------------ */

        const singleEventId =
            member.eventId ??
            member.event_id ??
            member.assignedEventId ??
            member.assigned_event_id;


        if (
            singleEventId !== null &&
            singleEventId !== undefined &&
            singleEventId !== ""
        ) {

            if (
                typeof singleEventId === "object"
            ) {

                const objectId =
                    getEventId(
                        singleEventId
                    );

                if (objectId) {

                    ids.push(
                        String(objectId)
                    );

                }

            } else {

                ids.push(
                    String(
                        singleEventId
                    )
                );

            }

        }


        /* ------------------------------------------------------
           ASSIGNED EVENTS ARRAY
        ------------------------------------------------------ */

        const assignedCollections = [
            member.assignedEvents,
            member.assigned_events,
            member.events,
        ];


        assignedCollections.forEach(
            (collection) => {

                if (
                    !Array.isArray(
                        collection
                    )
                ) {
                    return;
                }


                collection.forEach(
                    (item) => {

                        if (
                            item === null ||
                            item === undefined
                        ) {
                            return;
                        }


                        if (
                            typeof item === "object"
                        ) {

                            const objectId =
                                getEventId(
                                    item
                                );

                            if (
                                objectId !== null &&
                                objectId !== undefined
                            ) {

                                ids.push(
                                    String(
                                        objectId
                                    )
                                );

                            }

                        } else {

                            ids.push(
                                String(item)
                            );

                        }

                    }
                );

            }
        );


        /* ------------------------------------------------------
           REMOVE DUPLICATES
        ------------------------------------------------------ */

        return [
            ...new Set(
                ids.filter(
                    Boolean
                )
            ),
        ];

    };


    /* ==========================================================
       LOAD ASSIGNED EVENTS
    ========================================================== */

    const loadAssignedEvents = async (
        member
    ) => {

        if (!member) {
            return;
        }


        try {

            setLoadingEvents(true);

            setError("");


            /* --------------------------------------------------
               ASSIGNED EVENT IDS
            -------------------------------------------------- */

            const assignedIds =
                getAssignedEventIds(
                    member
                );


            console.log(
                "TEAM MEMBER:",
                member
            );

            console.log(
                "TEAM ASSIGNED EVENT IDS:",
                assignedIds
            );


            /* --------------------------------------------------
               TEAM EVENT ENDPOINT
            -------------------------------------------------- */

            const response =
                await fetch(
                    `${BACKEND_URL}/team/events`,
                    {
                        method: "GET",
                        headers:
                            getAuthHeaders(),
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            console.log(
                "TEAM EVENTS RESPONSE:",
                response.status,
                data
            );


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load your assigned events."
                );

            }


            const returnedEvents =
                Array.isArray(
                    data.events
                )
                    ? data.events
                    : Array.isArray(
                        data.assignedEvents
                    )
                        ? data.assignedEvents
                        : Array.isArray(
                            data.assigned_events
                        )
                            ? data.assigned_events
                            : [];


            console.log(
                "TEAM RETURNED EVENTS:",
                returnedEvents
            );


            /* --------------------------------------------------
               IMPORTANT:
               
               /team/events is an authenticated backend endpoint.
               
               If the backend has already returned the member's
               authorized events, we should not hide them merely
               because the local assignment representation uses a
               different field name.
            -------------------------------------------------- */

            let authorizedEvents =
                returnedEvents;


            /* --------------------------------------------------
               FRONTEND SAFETY FILTER
               
               If we know the member's assigned IDs, compare them.
               If no IDs were exposed in the member object, trust
               the authenticated /team/events endpoint.
            -------------------------------------------------- */

            if (
                assignedIds.length > 0
            ) {

                const filtered =
                    returnedEvents.filter(
                        (event) => {

                            const eventId =
                                getEventId(
                                    event
                                );


                            if (
                                eventId === null ||
                                eventId === undefined
                            ) {

                                return false;

                            }


                            return assignedIds.includes(
                                String(
                                    eventId
                                )
                            );

                        }
                    );


                /*
                 * If the backend returned events but the frontend
                 * representation of the member uses a different
                 * assignment ID format, don't incorrectly hide
                 * every event.
                 */

                if (
                    filtered.length > 0
                ) {

                    authorizedEvents =
                        filtered;

                } else if (
                    returnedEvents.length > 0
                ) {

                    console.warn(
                        "TEAM EVENT ID MISMATCH. USING AUTHORIZED EVENTS RETURNED BY BACKEND."
                    );

                    authorizedEvents =
                        returnedEvents;

                } else {

                    authorizedEvents = [];

                }

            }


            setEvents(
                authorizedEvents
            );

        } catch (err) {

            console.error(
                "LOAD TEAM EVENTS ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load your assigned events."
            );

        } finally {

            setLoadingEvents(false);

        }

    };


    /* ==========================================================
       INITIAL LOAD
    ========================================================== */

    useEffect(() => {

        let mounted = true;


        const initializeDashboard =
            async () => {

                if (!mounted) {
                    return;
                }


                setLoading(true);


                const member =
                    await loadTeamSession();


                if (
                    member &&
                    mounted
                ) {

                    await loadAssignedEvents(
                        member
                    );

                }


                if (mounted) {

                    setLoading(false);

                }

            };


        initializeDashboard();


        return () => {

            mounted = false;

        };

    }, []);


    /* ==========================================================
       REFRESH
    ========================================================== */

    const refreshDashboard =
        async () => {

            if (!teamMember) {
                return;
            }

            await loadAssignedEvents(
                teamMember
            );

        };


    /* ==========================================================
       OPEN TICKET LOOKUP
    ========================================================== */

    const openTicketLookup =
        () => {

            navigate(
                "/team-lookup"
            );

        };


    /* ==========================================================
       OPEN TEAM SCANNER
    ========================================================== */

    const openScanner =
        (eventId) => {

            if (!eventId) {
                return;
            }

            navigate(
                `/team-scanner/${encodeURIComponent(
                    eventId
                )}`
            );

        };


    /* ==========================================================
       OPEN EVENT DETAILS
    ========================================================== */

    const openEvent =
        (eventId) => {

            if (!eventId) {
                return;
            }

            navigate(
                `/team-event/${encodeURIComponent(
                    eventId
                )}`
            );

        };


    /* ==========================================================
       EVENT SEARCH
    ========================================================== */

    const filteredEvents =
        useMemo(() => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();


            if (!search) {
                return events;
            }


            return events.filter(
                (event) => {

                    const title =
                        String(
                            getEventTitle(
                                event
                            )
                        ).toLowerCase();


                    const location =
                        String(
                            event?.location ||
                            event?.venue ||
                            event?.eventLocation ||
                            ""
                        ).toLowerCase();


                    return (
                        title.includes(
                            search
                        ) ||
                        location.includes(
                            search
                        )
                    );

                }
            );

        }, [
            events,
            searchTerm,
        ]);


    /* ==========================================================
       FORMAT DATE
    ========================================================== */

    const formatDate =
        (value) => {

            if (!value) {
                return "Date not available";
            }


            const date =
                new Date(
                    value
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return String(
                    value
                );

            }


            return date.toLocaleDateString(
                undefined,
                {
                    weekday:
                        "short",
                    day:
                        "numeric",
                    month:
                        "short",
                    year:
                        "numeric",
                }
            );

        };


    /* ==========================================================
       FORMAT TIME
    ========================================================== */

    const formatTime =
        (value) => {

            if (!value) {
                return "";
            }


            const stringValue =
                String(value).trim();


            if (
                /^\d{1,2}:\d{2}/.test(
                    stringValue
                )
            ) {

                return stringValue;

            }


            const date =
                new Date(
                    value
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return stringValue;

            }


            return date.toLocaleTimeString(
                undefined,
                {
                    hour:
                        "2-digit",
                    minute:
                        "2-digit",
                }
            );

        };


    /* ==========================================================
       LOADING
    ========================================================== */

    if (loading) {

        return (

            <div className="team-dashboard-loading-page">

                <div className="team-dashboard-loading-card">

                    <div className="team-dashboard-loading-icon">

                        <RefreshCw
                            size={30}
                        />

                    </div>

                    <h2>
                        Loading Team Member Dashboard
                    </h2>

                    <p>
                        Checking your secure team session...
                    </p>

                </div>

            </div>

        );

    }


    /* ==========================================================
       RENDER
    ========================================================== */

    return (

        <div className="team-dashboard-page">


            {/* ======================================================
                HEADER
            ====================================================== */}

            <header className="team-dashboard-header">

                <div className="team-dashboard-header-inner">


                    {/* BRAND */}

                    <div className="team-dashboard-brand">

                        <div className="team-dashboard-brand-logo">

                            {settings?.platformLogo ? (

                                <img
                                    src={getMediaUrl(
                                        settings.platformLogo
                                    )}
                                    alt={
                                        settings?.platformName ||
                                        "EventWaa"
                                    }
                                />

                            ) : (

                                <div className="team-dashboard-brand-icon">

                                    <ShieldCheck
                                        size={25}
                                    />

                                </div>

                            )}

                        </div>


                        <div className="team-dashboard-brand-text">

                            <strong>
                                {settings?.platformName ||
                                    "EventWaa"}
                            </strong>

                            <span>
                                Team Member Portal
                            </span>

                        </div>

                    </div>


                    {/* USER AREA */}

                    <div className="team-dashboard-user-area">

                        <div className="team-dashboard-user">

                            <div className="team-dashboard-user-avatar">

                                {teamMember?.name
                                    ?.charAt(0)
                                    .toUpperCase() ||
                                    "T"}

                            </div>


                            <div className="team-dashboard-user-info">

                                <strong>
                                    {teamMember?.name ||
                                        "Team Member"}
                                </strong>

                                <span>
                                    {teamMember?.role ||
                                        "Team Member"}
                                </span>

                            </div>

                        </div>


                        <button
                            type="button"
                            className="team-dashboard-logout"
                            onClick={
                                handleLogout
                            }
                        >

                            <LogOut
                                size={18}
                            />

                            <span>
                                Logout
                            </span>

                        </button>

                    </div>

                </div>

            </header>


            {/* ======================================================
                MAIN
            ====================================================== */}

            <main className="team-dashboard-main">


                {/* ====================================================
                    WELCOME
                ==================================================== */}

                <section className="team-dashboard-welcome">

                    <div>

                        <span className="team-dashboard-eyebrow">
                            TEAM MEMBER DASHBOARD
                        </span>

                        <h1>
                            Welcome,{" "}
                            {teamMember?.name ||
                                "Team Member"}
                        </h1>

                        <p>
                            Manage your assigned events,
                            scan tickets, and look up guest
                            passes from one secure place.
                        </p>

                    </div>


                    <div className="team-dashboard-security">

                        <ShieldCheck
                            size={21}
                        />

                        <div>

                            <strong>
                                Secure Team Access
                            </strong>

                            <span>
                                Limited to your assigned events
                            </span>

                        </div>

                    </div>

                </section>


                {/* ====================================================
                    ERROR
                ==================================================== */}

                {error && (

                    <div className="team-dashboard-alert">

                        <AlertCircle
                            size={21}
                        />

                        <div>

                            <strong>
                                Something went wrong
                            </strong>

                            <p>
                                {error}
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={
                                refreshDashboard
                            }
                        >

                            <RefreshCw
                                size={17}
                            />

                            Retry

                        </button>

                    </div>

                )}


                {/* ====================================================
                    QUICK ACTIONS
                ==================================================== */}

                <section className="team-dashboard-actions-section">

                    <div className="team-dashboard-section-heading">

                        <div>

                            <h2>
                                Quick Actions
                            </h2>

                            <p>
                                Tools you can use during event operations.
                            </p>

                        </div>

                    </div>


                    <div className="team-dashboard-action-grid">


                        {/* SCANNER */}

                        <button
                            type="button"
                            className="team-dashboard-action-card"
                            onClick={() => {

                                if (
                                    events.length === 1
                                ) {

                                    openScanner(
                                        getEventId(
                                            events[0]
                                        )
                                    );

                                } else {

                                    document
                                        .getElementById(
                                            "team-assigned-events"
                                        )
                                        ?.scrollIntoView({
                                            behavior:
                                                "smooth",
                                        });

                                }

                            }}
                        >

                            <div className="team-dashboard-action-icon scanner">

                                <ScanLine
                                    size={27}
                                />

                            </div>


                            <div className="team-dashboard-action-content">

                                <strong>
                                    Scan Tickets
                                </strong>

                                <span>
                                    Open the secure scanner for an assigned event.
                                </span>

                            </div>


                            <ChevronRight
                                size={21}
                                className="team-dashboard-action-arrow"
                            />

                        </button>


                        {/* LOOKUP */}

                        <button
                            type="button"
                            className="team-dashboard-action-card"
                            onClick={
                                openTicketLookup
                            }
                        >

                            <div className="team-dashboard-action-icon lookup">

                                <Search
                                    size={27}
                                />

                            </div>


                            <div className="team-dashboard-action-content">

                                <strong>
                                    Lookup Ticket
                                </strong>

                                <span>
                                    Check ticket details without checking the guest in.
                                </span>

                            </div>


                            <ChevronRight
                                size={21}
                                className="team-dashboard-action-arrow"
                            />

                        </button>

                    </div>

                </section>


                {/* ====================================================
                    STATISTICS
                ==================================================== */}

                <section className="team-dashboard-stats">


                    <div className="team-dashboard-stat-card">

                        <div className="team-dashboard-stat-icon green">

                            <CalendarDays
                                size={23}
                            />

                        </div>

                        <div>

                            <strong>
                                {events.length}
                            </strong>

                            <span>
                                Assigned Events
                            </span>

                        </div>

                    </div>


                    <div className="team-dashboard-stat-card">

                        <div className="team-dashboard-stat-icon dark">

                            <ScanLine
                                size={23}
                            />

                        </div>

                        <div>

                            <strong>
                                Scanner
                            </strong>

                            <span>
                                Access Level
                            </span>

                        </div>

                    </div>


                    <div className="team-dashboard-stat-card">

                        <div className="team-dashboard-stat-icon green">

                            <ShieldCheck
                                size={23}
                            />

                        </div>

                        <div>

                            <strong>
                                {String(
                                    teamMember?.status ||
                                    "Active"
                                )}
                            </strong>

                            <span>
                                Account Status
                            </span>

                        </div>

                    </div>


                    <div className="team-dashboard-stat-card">

                        <div className="team-dashboard-stat-icon neutral">

                            <UserCircle
                                size={23}
                            />

                        </div>

                        <div>

                            <strong>
                                Team
                            </strong>

                            <span>
                                Account Type
                            </span>

                        </div>

                    </div>

                </section>


                {/* ====================================================
                    ASSIGNED EVENTS
                ==================================================== */}

                <section
                    id="team-assigned-events"
                    className="team-dashboard-events-section"
                >


                    <div className="team-dashboard-section-heading">

                        <div>

                            <h2>
                                My Assigned Events
                            </h2>

                            <p>
                                These are the events your host has
                                authorized you to work on.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="team-dashboard-refresh-button"
                            onClick={
                                refreshDashboard
                            }
                            disabled={
                                loadingEvents
                            }
                        >

                            <RefreshCw
                                size={17}
                                className={
                                    loadingEvents
                                        ? "team-dashboard-refresh-spin"
                                        : ""
                                }
                            />

                            Refresh

                        </button>

                    </div>


                    {/* SEARCH */}

                    {events.length > 0 && (

                        <div className="team-dashboard-event-search">

                            <Search
                                size={20}
                            />

                            <input
                                type="text"
                                placeholder="Search your assigned events..."
                                value={
                                    searchTerm
                                }
                                onChange={(event) =>
                                    setSearchTerm(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    )}


                    {/* LOADING EVENTS */}

                    {loadingEvents ? (

                        <div className="team-dashboard-events-loading">

                            <div className="team-dashboard-spinner" />

                            <p>
                                Loading your assigned events...
                            </p>

                        </div>

                    ) : filteredEvents.length === 0 ? (

                        <div className="team-dashboard-empty">

                            <div className="team-dashboard-empty-icon">

                                <CalendarDays
                                    size={31}
                                />

                            </div>

                            <h3>

                                {events.length === 0
                                    ? "No Events Assigned"
                                    : "No Matching Events"}

                            </h3>

                            <p>

                                {events.length === 0
                                    ? "Your host has not assigned any events to you yet."
                                    : "Try a different event name or location."}

                            </p>

                        </div>

                    ) : (

                        <div className="team-dashboard-event-grid">

                            {filteredEvents.map(
                                (event, index) => {

                                    const eventId =
                                        getEventId(
                                            event
                                        ) ||
                                        `team-event-${index}`;

                                    const eventDate =
                                        getEventDate(
                                            event
                                        );

                                    const eventImage =
                                        getEventImage(
                                            event
                                        );

                                    const imageUrl =
                                        getMediaUrl(
                                            eventImage
                                        );


                                    return (

                                        <article
                                            className="team-dashboard-event-card"
                                            key={
                                                String(
                                                    eventId
                                                )
                                            }
                                        >


                                            {/* EVENT POSTER */}

                                            <div className="team-dashboard-event-image">

                                                {imageUrl ? (

                                                    <img
                                                        src={
                                                            imageUrl
                                                        }
                                                        alt={
                                                            getEventTitle(
                                                                event
                                                            )
                                                        }
                                                        onError={(imageEvent) => {

                                                            imageEvent.currentTarget.style.display =
                                                                "none";

                                                            imageEvent.currentTarget.parentElement.classList.add(
                                                                "team-dashboard-poster-failed"
                                                            );

                                                        }}
                                                    />

                                                ) : (

                                                    <div className="team-dashboard-event-image-placeholder">

                                                        <CalendarDays
                                                            size={38}
                                                        />

                                                        <span>
                                                            Event Poster
                                                        </span>

                                                    </div>

                                                )}


                                                <span className="team-dashboard-assigned-badge">

                                                    <CheckCircle
                                                        size={14}
                                                    />

                                                    Assigned

                                                </span>

                                            </div>


                                            {/* EVENT CONTENT */}

                                            <div className="team-dashboard-event-content">

                                                <h3>
                                                    {getEventTitle(
                                                        event
                                                    )}
                                                </h3>


                                                <div className="team-dashboard-event-detail">

                                                    <CalendarDays
                                                        size={17}
                                                    />

                                                    <span>
                                                        {formatDate(
                                                            eventDate
                                                        )}
                                                    </span>

                                                </div>


                                                {(event.time ||
                                                    event.eventTime ||
                                                    event.startTime) && (

                                                    <div className="team-dashboard-event-detail">

                                                        <Clock
                                                            size={17}
                                                        />

                                                        <span>
                                                            {formatTime(
                                                                event.time ||
                                                                event.eventTime ||
                                                                event.startTime
                                                            )}
                                                        </span>

                                                    </div>

                                                )}


                                                {(event.location ||
                                                    event.venue ||
                                                    event.eventLocation) && (

                                                    <div className="team-dashboard-event-detail">

                                                        <MapPin
                                                            size={17}
                                                        />

                                                        <span>
                                                            {event.location ||
                                                                event.venue ||
                                                                event.eventLocation}
                                                        </span>

                                                    </div>

                                                )}


                                                <div className="team-dashboard-event-divider" />


                                                {/* EVENT ACTIONS */}

                                                <div className="team-dashboard-event-actions">


                                                    {/* VIEW DETAILS */}

                                                    <button
                                                        type="button"
                                                        className="team-dashboard-view-button"
                                                        onClick={() =>
                                                            openEvent(
                                                                getEventId(
                                                                    event
                                                                )
                                                            )
                                                        }
                                                    >

                                                        <Eye
                                                            size={18}
                                                        />

                                                        View Details

                                                    </button>


                                                    {/* SCAN */}

                                                    <button
                                                        type="button"
                                                        className="team-dashboard-scan-button"
                                                        onClick={() =>
                                                            openScanner(
                                                                getEventId(
                                                                    event
                                                                )
                                                            )
                                                        }
                                                    >

                                                        <ScanLine
                                                            size={18}
                                                        />

                                                        Scan Tickets

                                                    </button>


                                                    {/* LOOKUP */}

                                                    <button
                                                        type="button"
                                                        className="team-dashboard-lookup-button"
                                                        onClick={
                                                            openTicketLookup
                                                        }
                                                    >

                                                        <Ticket
                                                            size={18}
                                                        />

                                                        Lookup

                                                    </button>

                                                </div>

                                            </div>

                                        </article>

                                    );

                                }
                            )}

                        </div>

                    )}

                </section>


                {/* ====================================================
                    ACCESS INFORMATION
                ==================================================== */}

                <section className="team-dashboard-access-card">


                    <div className="team-dashboard-access-icon">

                        <ShieldCheck
                            size={28}
                        />

                    </div>


                    <div className="team-dashboard-access-content">

                        <h3>
                            Your Team Access
                        </h3>

                        <p>
                            Your account is limited to the event
                            operations assigned by your host.
                            You can scan tickets and use ticket
                            lookup, but you cannot access the host's
                            private financial or administrative information.
                        </p>


                        <div className="team-dashboard-access-list">

                            <span>

                                <CheckCircle
                                    size={17}
                                />

                                Assigned event access

                            </span>


                            <span>

                                <CheckCircle
                                    size={17}
                                />

                                Ticket scanning

                            </span>


                            <span>

                                <CheckCircle
                                    size={17}
                                />

                                Ticket lookup

                            </span>


                            <span>

                                <CheckCircle
                                    size={17}
                                />

                                Secure team session

                            </span>

                        </div>

                    </div>

                </section>


                {/* ====================================================
                    FOOTER
                ==================================================== */}

                <footer className="team-dashboard-footer">

                    <span>
                        {settings?.platformName ||
                            "EventWaa"}{" "}
                        Team Member Portal
                    </span>

                    <span>
                        Secure event operations
                    </span>

                </footer>

            </main>

        </div>

    );

}


export default TeamMemberDashboard;