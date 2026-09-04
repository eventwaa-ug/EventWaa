import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ScanLine,
    Search,
    MapPin,
    CalendarDays,
    Clock3,
    LogOut,
    ChevronRight,
    CheckCircle2,
    ClipboardList,
    CircleCheck,
    History,
    ShieldCheck,
    TicketCheck,
    AlertCircle,
    RotateCw,
    CalendarX2,
} from "lucide-react";
import "../styles/AdminTeamDashboard.css";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000";
/*
|--------------------------------------------------------------------------
| TEAM PORTAL ROUTES
|--------------------------------------------------------------------------
*/
const TEAM_LOOKUP_ROUTE = "/admin/team-lookup";
function AdminTeamDashboard() {
    const navigate = useNavigate();
    const { settings } =
        usePlatformSettings();
    /* =========================================================
       STATE
    ========================================================= */
    const [dashboard, setDashboard] =
        useState(null);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");
    const [loggingOut, setLoggingOut] =
        useState(false);
    /* =========================================================
       ADMIN TEAM TOKEN
       
       IMPORTANT:
       Admin Team has its OWN token.
       Regular Team:
       eventwaa_team_token
       Admin Team:
       eventwaa_admin_team_token
    ========================================================= */
    const getTeamToken = () => {
        return (
            localStorage.getItem(
                "eventwaa_admin_team_token"
            ) ||
            sessionStorage.getItem(
                "eventwaa_admin_team_token"
            )
        );
    };
    /* =========================================================
       AUTH HEADERS
    ========================================================= */
    const getAuthHeaders = () => {
        const token =
            getTeamToken();
        return {
            "Content-Type":
                "application/json",
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
    /* =========================================================
       NORMALIZE MEDIA URL
    ========================================================= */
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
        if (
            value.startsWith("/")
        ) {
            return `${BACKEND_URL}${value}`;
        }
        return `${BACKEND_URL}/${value}`;
    };
    /* =========================================================
       LOGOUT
       
       IMPORTANT:
       ONLY ADMIN TEAM SESSION IS REMOVED.
       Regular Team session remains untouched.
    ========================================================= */
    const handleLogout = () => {
        setLoggingOut(true);
        /* -----------------------------------------------------
           LOCAL STORAGE
        ----------------------------------------------------- */
        localStorage.removeItem(
            "eventwaa_admin_team_token"
        );
        localStorage.removeItem(
            "eventwaa_admin_team_member"
        );
        localStorage.removeItem(
            "eventwaaAdminTeamAccount"
        );
        localStorage.removeItem(
            "eventwaaAdminTeamLoggedIn"
        );
        /* -----------------------------------------------------
           SESSION STORAGE
        ----------------------------------------------------- */
        sessionStorage.removeItem(
            "eventwaa_admin_team_token"
        );
        sessionStorage.removeItem(
            "eventwaa_admin_team_member"
        );
        sessionStorage.removeItem(
            "eventwaaAdminTeamAccount"
        );
        sessionStorage.removeItem(
            "eventwaaAdminTeamLoggedIn"
        );
        navigate(
            "/admin/team-login",
            {
                replace: true,
            }
        );
    };
    /* =========================================================
       LOAD TEAM DASHBOARD
    ========================================================= */
    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");
            const token =
                getTeamToken();
            if (!token) {
                navigate(
                    "/admin/team-login",
                    {
                        replace: true,
                    }
                );
                return;
            }
            const response =
                await fetch(
                    `${BACKEND_URL}/team/dashboard`,
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
                "ADMIN TEAM DASHBOARD RESPONSE:",
                response.status,
                data
            );
            /* =================================================
               INVALID ADMIN TEAM SESSION
            ================================================= */
            if (
                response.status === 401 ||
                response.status === 403
            ) {
                /* ------------------------------------------------
                   REMOVE ONLY ADMIN TEAM SESSION
                ------------------------------------------------ */
                localStorage.removeItem(
                    "eventwaa_admin_team_token"
                );
                localStorage.removeItem(
                    "eventwaa_admin_team_member"
                );
                localStorage.removeItem(
                    "eventwaaAdminTeamAccount"
                );
                localStorage.removeItem(
                    "eventwaaAdminTeamLoggedIn"
                );
                sessionStorage.removeItem(
                    "eventwaa_admin_team_token"
                );
                sessionStorage.removeItem(
                    "eventwaa_admin_team_member"
                );
                sessionStorage.removeItem(
                    "eventwaaAdminTeamAccount"
                );
                sessionStorage.removeItem(
                    "eventwaaAdminTeamLoggedIn"
                );
                navigate(
                    "/admin/team-login",
                    {
                        replace: true,
                    }
                );
                return;
            }
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load your team dashboard."
                );
            }
            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load your team dashboard."
                );
            }
            setDashboard(data);
        } catch (dashboardError) {
            console.error(
                "ADMIN TEAM DASHBOARD LOAD ERROR:",
                dashboardError
            );
            setError(
                dashboardError.message ||
                "Unable to load your team dashboard."
            );
        } finally {
            setLoading(false);
        }
    };
    /* =========================================================
       INITIAL LOAD
    ========================================================= */
    useEffect(() => {
        loadDashboard();
    }, []);
    /* =========================================================
       ACCOUNT
    ========================================================= */
    const account =
        dashboard?.account || {};
    const assignedEvent =
        dashboard?.assignedEvent ||
        null;
    const allEvents =
        Array.isArray(
            dashboard?.events
        )
            ? dashboard.events
            : [];
    const assignments =
        Array.isArray(
            dashboard?.assignments
        )
            ? dashboard.assignments
            : [];
    const assignmentHistory =
        Array.isArray(
            dashboard?.assignmentHistory
        )
            ? dashboard.assignmentHistory
            : [];
    /* =========================================================
       HELPERS
    ========================================================= */
    const getInitial = (name) => {
        return String(
            name || "T"
        )
            .charAt(0)
            .toUpperCase();
    };
    /* =========================================================
       GET EVENT POSTER
    ========================================================= */
    const getPoster = (event) => {
        if (!event) {
            return "";
        }
        const poster =
            event.eventPoster ||
            event.poster ||
            event.image ||
            event.imageUrl ||
            event.posterUrl ||
            "";
        return getMediaUrl(
            poster
        );
    };
    /* =========================================================
       EVENT TITLE
    ========================================================= */
    const getEventTitle = (event) => {
        return (
            event?.title ||
            event?.name ||
            "Untitled Event"
        );
    };
    /* =========================================================
       FORMAT DATE
    ========================================================= */
    const formatDate = (date) => {
        if (!date) {
            return "";
        }
        const parsed =
            new Date(date);
        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return String(date);
        }
        return parsed.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    };
    /* =========================================================
       FORMAT TIME
    ========================================================= */
    const formatTime = (time) => {
        if (!time) {
            return "";
        }
        return String(time);
    };
    /* =========================================================
       EVENT LOCATION
    ========================================================= */
    const getEventLocation = (event) => {
        return (
            event?.venue ||
            event?.location ||
            event?.eventLocation ||
            "Location not provided"
        );
    };
    /* =========================================================
       CHECK ASSIGNED EVENT
    ========================================================= */
    const isAssignedEvent = (event) => {
        if (
            !assignedEvent ||
            !event
        ) {
            return false;
        }
        const assignedId =
            String(
                assignedEvent.id ||
                assignedEvent.eventId ||
                ""
            ).trim();
        const eventId =
            String(
                event.id ||
                event.eventId ||
                ""
            ).trim();
        if (
            assignedId &&
            eventId &&
            assignedId === eventId
        ) {
            return true;
        }
        return (
            getEventTitle(
                assignedEvent
            ).toLowerCase() ===
            getEventTitle(
                event
            ).toLowerCase()
        );
    };
    /* =========================================================
       OTHER EVENTS
    ========================================================= */
    const otherEvents = useMemo(() => {
        return allEvents.filter(
            (event) =>
                !isAssignedEvent(
                    event
                )
        );
    }, [
        allEvents,
        assignedEvent,
    ]);
    /* =========================================================
       OPERATION ACTIVITY
    ========================================================= */
    const activity = useMemo(() => {
        const items = [];
        assignments.forEach(
            (assignment, index) => {
                if (
                    !assignment ||
                    typeof assignment !==
                    "object"
                ) {
                    return;
                }
                items.push({
                    id:
                        assignment.id ||
                        `assignment-${index}`,
                    type:
                        String(
                            assignment.status ||
                            ""
                        ).toLowerCase() ===
                        "active"
                            ? "Current assignment"
                            : "Assignment",
                    event:
                        assignment.eventName ||
                        assignment.event ||
                        "Event",
                    host:
                        assignment.hostName ||
                        assignment.host ||
                        "",
                    date:
                        assignment.assignedAt ||
                        assignment.createdAt ||
                        "",
                });
            }
        );
        assignmentHistory.forEach(
            (
                assignment,
                index
            ) => {
                if (
                    !assignment ||
                    typeof assignment !==
                    "object"
                ) {
                    return;
                }
                items.push({
                    id:
                        assignment.id ||
                        `history-${index}`,
                    type:
                        "Completed assignment",
                    event:
                        assignment.eventName ||
                        assignment.event ||
                        "Previous Event",
                    host:
                        assignment.hostName ||
                        assignment.host ||
                        "",
                    date:
                        assignment.endedAt ||
                        assignment.unassignedAt ||
                        assignment.assignedAt ||
                        assignment.createdAt ||
                        "",
                });
            }
        );
        return items
            .sort(
                (a, b) => {
                    const first =
                        new Date(
                            a.date || 0
                        ).getTime();
                    const second =
                        new Date(
                            b.date || 0
                        ).getTime();
                    return second - first;
                }
            )
            .slice(0, 8);
    }, [
        assignments,
        assignmentHistory,
    ]);
    /* =========================================================
       QUICK ACTIONS
    ========================================================= */
    const openScanner = () => {
        const eventId =
            assignedEvent?.id ||
            assignedEvent?.eventId;
        if (!eventId) {
            alert(
                "No event has been assigned to you yet."
            );
            return;
        }
        navigate(
            `/admin/team-scanner/${eventId}`
        );
    };
    const openTicketLookup = () => {
        navigate(
            TEAM_LOOKUP_ROUTE
        );
    };
    /* ============================================================
       OPEN TEAM EVENT VIEW
    ============================================================ */
    const openEvent = (event) => {
        const eventId =
            event?.id ||
            event?.eventId;
        if (!eventId) {
            console.warn(
                "TEAM EVENT VIEW: Missing event ID",
                event
            );
            return;
        }
        navigate(
            `/admin/team-event/${encodeURIComponent(eventId)}`
        );
    };
    /* =========================================================
       LOADING
    ========================================================= */
    if (loading) {
        return (
            <div className="team-portal-page">
                <div className="team-portal-loading">
                    <div className="team-portal-spinner">
                        <div></div>
                    </div>
                    <h2>
                        Loading Team Portal
                    </h2>
                    <p>
                        Getting your assigned
                        events and operations.
                    </p>
                </div>
            </div>
        );
    }
    /* =========================================================
       RENDER
    ========================================================= */
    return (
        <div className="team-portal-page">
            {/* =================================================
                HEADER
            ================================================= */}
            <header className="team-portal-header">
                {/* PLATFORM BRAND */}
                <div className="team-portal-brand">
                    <div className="team-portal-brand-logo">
                        {settings?.platformLogo ? (
                            <img
                                src={getMediaUrl(
                                    settings.platformLogo
                                )}
                                alt={
                                    settings.platformName ||
                                    "EventWaa"
                                }
                                className="team-portal-platform-logo"
                            />
                        ) : (
                            <span>
                                EW
                            </span>
                        )}
                    </div>
                    <div className="team-portal-brand-text">
                        <strong>
                            {settings?.platformName ||
                                "EventWaa"}
                        </strong>
                        <span>
                            TEAM PORTAL
                        </span>
                    </div>
                </div>
                {/* TEAM USER */}
                <div className="team-portal-header-right">
                    <div className="team-portal-user">
                        <div className="team-portal-avatar">
                            {getInitial(
                                account.name
                            )}
                        </div>
                        <div>
                            <strong>
                                {account.name ||
                                    "Team Member"}
                            </strong>
                            <span>
                                {account.role ||
                                    "Event Staff"}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="team-portal-logout"
                        onClick={
                            handleLogout
                        }
                        disabled={
                            loggingOut
                        }
                    >
                        <LogOut
                            size={16}
                            strokeWidth={2}
                        />
                        <span>
                            {loggingOut
                                ? "Logging out..."
                                : "Logout"}
                        </span>
                    </button>
                </div>
            </header>
            <main className="team-portal-content">
                {/* =================================================
                    ERROR
                ================================================= */}
                {error && (
                    <div className="team-portal-error">
                        <div className="team-error-icon">
                            <AlertCircle
                                size={20}
                            />
                        </div>
                        <div>
                            <strong>
                                Something went wrong
                            </strong>
                            <span>
                                {error}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={
                                loadDashboard
                            }
                        >
                            <RotateCw
                                size={15}
                            />
                            <span>
                                Try Again
                            </span>
                        </button>
                    </div>
                )}
                {/* =================================================
                    WELCOME
                ================================================= */}
                <section className="team-portal-welcome">
                    <div>
                        <span className="team-portal-eyebrow">
                            TEAM OPERATIONS
                        </span>
                        <h1>
                            Welcome,{" "}
                            {account.name ||
                                "Team Member"}
                        </h1>
                        <p>
                            Your EventWaa operations
                            workspace. Scan tickets,
                            look up tickets and view
                            event information.
                        </p>
                    </div>
                    <div className="team-portal-role-badge">
                        <span>
                            YOUR ROLE
                        </span>
                        <strong>
                            <ShieldCheck
                                size={15}
                            />
                            {account.role ||
                                "Event Staff"}
                        </strong>
                    </div>
                </section>
                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}
                <section className="team-portal-actions">
                    <button
                        type="button"
                        className="team-action-card scanner"
                        onClick={openScanner}
                    >
                        <div className="team-action-icon">
                            <ScanLine
                                size={24}
                                strokeWidth={2}
                            />
                        </div>
                        <div>
                            <strong>
                                Scan Tickets
                            </strong>
                            <span>
                                Scan tickets for your assigned event
                            </span>
                        </div>
                        <b>
                            <ChevronRight
                                size={20}
                            />
                        </b>
                    </button>
                    <button
                        type="button"
                        className="team-action-card lookup"
                        onClick={
                            openTicketLookup
                        }
                    >
                        <div className="team-action-icon">
                            <Search
                                size={23}
                                strokeWidth={2}
                            />
                        </div>
                        <div>
                            <strong>
                                Lookup Ticket
                            </strong>
                            <span>
                                Find a ticket by
                                ticket ID
                            </span>
                        </div>
                        <b>
                            <ChevronRight
                                size={20}
                            />
                        </b>
                    </button>
                </section>
                {/* =================================================
                    ASSIGNED EVENT
                ================================================= */}
                <section className="team-portal-section">
                    <div className="team-section-heading">
                        <div>
                            <span>
                                ADMIN ASSIGNMENT
                            </span>
                            <h2>
                                Your Assigned Event
                            </h2>
                            <p>
                                This event was assigned
                                to you by an EventWaa
                                administrator.
                            </p>
                        </div>
                        <span className="team-assigned-badge">
                            {assignedEvent
                                ? "Assigned"
                                : "No Assignment"}
                        </span>
                    </div>
                    {!assignedEvent ? (
                        <div className="team-no-assignment">
                            <div className="team-empty-icon">
                                <CalendarX2
                                    size={28}
                                />
                            </div>
                            <h3>
                                No event assigned yet
                            </h3>
                            <p>
                                Your administrator has
                                not assigned you to an
                                event yet.
                            </p>
                        </div>
                    ) : (
                        <article
                            className="team-assigned-event"
                            onClick={() =>
                                openEvent(
                                    assignedEvent
                                )
                            }
                        >
                            <div className="team-assigned-event-poster">
                                {getPoster(
                                    assignedEvent
                                ) ? (
                                    <img
                                        src={getPoster(
                                            assignedEvent
                                        )}
                                        alt={
                                            getEventTitle(
                                                assignedEvent
                                            )
                                        }
                                        className="team-full-poster"
                                        onError={(
                                            imageEvent
                                        ) => {
                                            imageEvent
                                                .currentTarget
                                                .style
                                                .display =
                                                "none";
                                        }}
                                    />
                                ) : (
                                    <div className="team-poster-placeholder">
                                        <CalendarDays
                                            size={46}
                                            strokeWidth={1.5}
                                        />
                                        <small>
                                            EventWaa
                                        </small>
                                    </div>
                                )}
                                <span className="team-poster-label">
                                    YOUR EVENT
                                </span>
                            </div>
                            <div className="team-assigned-event-body">
                                <span className="team-event-status">
                                    <CircleCheck
                                        size={14}
                                    />
                                    Assigned to you
                                </span>
                                <h3>
                                    {getEventTitle(
                                        assignedEvent
                                    )}
                                </h3>
                                <div className="team-event-meta">
                                    {assignedEvent.date && (
                                        <span>
                                            <CalendarDays
                                                size={14}
                                            />
                                            {formatDate(
                                                assignedEvent.date
                                            )}
                                        </span>
                                    )}
                                    {assignedEvent.time && (
                                        <span>
                                            <Clock3
                                                size={14}
                                            />
                                            {formatTime(
                                                assignedEvent.time
                                            )}
                                        </span>
                                    )}
                                    <span>
                                        <MapPin
                                            size={14}
                                        />
                                        {getEventLocation(
                                            assignedEvent
                                        )}
                                    </span>
                                </div>
                                {(
                                    assignedEvent.host ||
                                    account.host
                                ) && (
                                    <p className="team-event-host">
                                        Host:{" "}
                                        <strong>
                                            {assignedEvent.host ||
                                                account.host}
                                        </strong>
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        const eventId =
                                            assignedEvent?.id ||
                                            assignedEvent?.eventId;
                                        if (!eventId) {
                                            alert(
                                                "This event does not have a valid event ID."
                                            );
                                            return;
                                        }
                                        navigate(
                                            `/admin/team-scanner/${eventId}`
                                        );
                                    }}
                                >
                                    <ScanLine
                                        size={17}
                                    />
                                    <span>
                                        Scan Event
                                    </span>
                                    <ChevronRight
                                        size={17}
                                    />
                                </button>
                            </div>
                        </article>
                    )}
                </section>
                {/* =================================================
                    SUMMARY
                ================================================= */}
                <section className="team-summary-grid">
                    <div className="team-summary-card">
                        <div className="team-summary-icon">
                            <TicketCheck
                                size={19}
                            />
                        </div>
                        <div>
                            <span>
                                CHECK-IN
                            </span>
                            <strong>
                                Ready
                            </strong>
                            <p>
                                Use the scanner to
                                check guests in.
                            </p>
                        </div>
                    </div>
                    <div className="team-summary-card">
                        <div className="team-summary-icon">
                            <MapPin
                                size={19}
                            />
                        </div>
                        <div>
                            <span>
                                ASSIGNED EVENT
                            </span>
                            <strong>
                                {assignedEvent
                                    ? "1"
                                    : "0"}
                            </strong>
                            <p>
                                Current admin
                                assignment.
                            </p>
                        </div>
                    </div>
                    <div className="team-summary-card">
                        <div className="team-summary-icon">
                            <ClipboardList
                                size={19}
                            />
                        </div>
                        <div>
                            <span>
                                EVENTS TO VIEW
                            </span>
                            <strong>
                                {allEvents.length}
                            </strong>
                            <p>
                                Events available
                                to view.
                            </p>
                        </div>
                    </div>
                    <div className="team-summary-card">
                        <div className="team-summary-icon">
                            <History
                                size={19}
                            />
                        </div>
                        <div>
                            <span>
                                ACTIVITY
                            </span>
                            <strong>
                                {activity.length}
                            </strong>
                            <p>
                                Recorded team
                                operations.
                            </p>
                        </div>
                    </div>
                </section>
                {/* =================================================
                    ALL EVENTS
                ================================================= */}
                <section className="team-portal-section">
                    <div className="team-section-heading">
                        <div>
                            <span>
                                EVENTWAA EVENTS
                            </span>
                            <h2>
                                View Events
                            </h2>
                            <p>
                                View event information
                                and posters across the
                                platform.
                            </p>
                        </div>
                        <span className="team-event-count">
                            {allEvents.length}{" "}
                            {allEvents.length === 1
                                ? "event"
                                : "events"}
                        </span>
                    </div>
                    {allEvents.length === 0 ? (
                        <div className="team-no-events">
                            <CalendarX2
                                size={28}
                            />
                            <span>
                                No events are available
                                right now.
                            </span>
                        </div>
                    ) : (
                        <div className="team-events-grid">
                            {allEvents.map(
                                (event) => (
                                    <article
                                        className={`team-event-card ${
                                            isAssignedEvent(
                                                event
                                            )
                                                ? "assigned"
                                                : ""
                                        }`}
                                        key={
                                            event.id ||
                                            event.eventId ||
                                            getEventTitle(
                                                event
                                            )
                                        }
                                        onClick={() =>
                                            openEvent(
                                                event
                                            )
                                        }
                                    >
                                        <div className="team-event-card-poster">
                                            {getPoster(
                                                event
                                            ) ? (
                                                <img
                                                    src={getPoster(
                                                        event
                                                    )}
                                                    alt={
                                                        getEventTitle(
                                                            event
                                                        )
                                                    }
                                                    className="team-full-poster"
                                                    onError={(
                                                        imageEvent
                                                    ) => {
                                                        imageEvent
                                                            .currentTarget
                                                            .style
                                                            .display =
                                                            "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="team-event-card-placeholder">
                                                    <CalendarDays
                                                        size={42}
                                                        strokeWidth={1.5}
                                                    />
                                                </div>
                                            )}
                                            {isAssignedEvent(
                                                event
                                            ) && (
                                                <span>
                                                    YOUR EVENT
                                                </span>
                                            )}
                                        </div>
                                        <div className="team-event-card-body">
                                            <h3>
                                                {getEventTitle(
                                                    event
                                                )}
                                            </h3>
                                            <p>
                                                <MapPin
                                                    size={14}
                                                />
                                                {getEventLocation(
                                                    event
                                                )}
                                            </p>
                                            {event.date && (
                                                <small>
                                                    <CalendarDays
                                                        size={13}
                                                    />
                                                    {formatDate(
                                                        event.date
                                                    )}
                                                </small>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(
                                                    clickEvent
                                                ) => {
                                                    clickEvent.stopPropagation();
                                                    openEvent(
                                                        event
                                                    );
                                                }}
                                            >
                                                <span>
                                                    View Event
                                                </span>
                                                <ChevronRight
                                                    size={16}
                                                />
                                            </button>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>
                {/* =================================================
                    ACTIVITY
                ================================================= */}
                <section className="team-portal-section">
                    <div className="team-section-heading">
                        <div>
                            <span>
                                YOUR ACTIVITY
                            </span>
                            <h2>
                                Operation Activity
                            </h2>
                            <p>
                                Your current and previous
                                EventWaa assignments.
                            </p>
                        </div>
                    </div>
                    {activity.length === 0 ? (
                        <div className="team-no-activity">
                            <div className="team-empty-icon">
                                <History
                                    size={28}
                                />
                            </div>
                            <h3>
                                No activity yet
                            </h3>
                            <p>
                                Your team activity will
                                appear here as assignments
                                are recorded.
                            </p>
                        </div>
                    ) : (
                        <div className="team-activity-list">
                            {activity.map(
                                (item) => (
                                    <div
                                        className="team-activity-row"
                                        key={
                                            item.id
                                        }
                                    >
                                        <div className="team-activity-icon">
                                            <CheckCircle2
                                                size={17}
                                            />
                                        </div>
                                        <div className="team-activity-content">
                                            <strong>
                                                {item.type}
                                            </strong>
                                            <span>
                                                {item.event}
                                            </span>
                                            {item.host && (
                                                <small>
                                                    Host:{" "}
                                                    {item.host}
                                                </small>
                                            )}
                                        </div>
                                        <time>
                                            {formatDate(
                                                item.date
                                            ) ||
                                                "—"}
                                        </time>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>
            </main>
            {/* =================================================
                FOOTER
            ================================================= */}
            <footer className="team-portal-footer">
                <span>
                    {settings?.platformName ||
                        "EventWaa"}{" "}
                    Team Portal
                </span>
                <span>
                    Authorized team member access only.
                </span>
            </footer>
        </div>
    );
}
export default AdminTeamDashboard;