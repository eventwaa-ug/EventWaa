import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
    useLocation
} from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    MapPin,
    Ticket,
    Users,
    ScanLine,
    ShieldCheck,
    AlertCircle,
    RefreshCw,
    Building2,
} from "lucide-react";
import "../styles/TeamEventView.css";
import {
    usePlatformSettings
} from "../context/PlatformSettingsContext.jsx";
const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000";
function TeamEventView() {
    const {
        eventId
    } = useParams();
    const navigate =
        useNavigate();
    const location =
        useLocation();
    const {
        settings
    } = usePlatformSettings();
    const [
        event,
        setEvent
    ] = useState(null);
    const [
        loading,
        setLoading
    ] = useState(true);
    const [
        error,
        setError
    ] = useState("");
    /* ============================================================
       PORTAL TYPE
       REGULAR TEAM:
           /team-event/:eventId
       ADMIN TEAM:
           /admin/team-event/:eventId
    ============================================================ */
    const isAdminTeamEvent =
        location.pathname.startsWith(
            "/admin/team-event/"
        );
    const isRegularTeamEvent =
        location.pathname.startsWith(
            "/team-event/"
        );
    /* ============================================================
       TEAM TOKEN
       ADMIN TEAM:
           eventwaa_admin_team_token
       REGULAR TEAM:
           eventwaa_team_token
    ============================================================ */
    const getTeamToken = () => {
        if (isAdminTeamEvent) {
            return (
                localStorage.getItem(
                    "eventwaa_admin_team_token"
                ) ||
                sessionStorage.getItem(
                    "eventwaa_admin_team_token"
                )
            );
        }
        if (isRegularTeamEvent) {
            return (
                localStorage.getItem(
                    "eventwaa_team_token"
                ) ||
                sessionStorage.getItem(
                    "eventwaa_team_token"
                )
            );
        }
        return null;
    };
    /* ============================================================
       MEDIA URL
    ============================================================ */
    const getMediaUrl = (value) => {
        if (!value) {
            return "";
        }
        const url =
            String(value).trim();
        if (!url) {
            return "";
        }
        if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("data:") ||
            url.startsWith("blob:")
        ) {
            return url;
        }
        if (url.startsWith("/")) {
            return `${BACKEND_URL}${url}`;
        }
        return `${BACKEND_URL}/${url}`;
    };
    /* ============================================================
       AUTH HEADERS
    ============================================================ */
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
                : {})
        };
    };
    /* ============================================================
       LOGIN PATH
    ============================================================ */
    const teamLoginPath =
        isAdminTeamEvent
            ? "/admin/team-login"
            : "/team-login";
    /* ============================================================
       LOAD EVENT
    ============================================================ */
    const loadEvent = async () => {
        try {
            setLoading(true);
            setError("");
            const token =
                getTeamToken();
            /* ====================================================
               NO TOKEN
            ==================================================== */
            if (!token) {
                navigate(
                    teamLoginPath,
                    {
                        replace: true,
                    }
                );
                return;
            }
            /* ====================================================
               EVENT ID CHECK
            ==================================================== */
            if (!eventId) {
                throw new Error(
                    "Event ID is missing."
                );
            }
            /*
             * The team member is allowed to view the event
             * through the protected team route.
             */
            const response =
                await fetch(
                    `${BACKEND_URL}/events/${encodeURIComponent(
                        eventId
                    )}`,
                    {
                        method:
                            "GET",
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
                "TEAM EVENT RESPONSE:",
                response.status,
                data
            );
            /* ====================================================
               SESSION EXPIRED
            ==================================================== */
            if (
                response.status === 401 ||
                response.status === 403
            ) {
                if (isAdminTeamEvent) {
                    localStorage.removeItem(
                        "eventwaa_admin_team_token"
                    );
                    sessionStorage.removeItem(
                        "eventwaa_admin_team_token"
                    );
                } else {
                    localStorage.removeItem(
                        "eventwaa_team_token"
                    );
                    sessionStorage.removeItem(
                        "eventwaa_team_token"
                    );
                }
                navigate(
                    teamLoginPath,
                    {
                        replace: true,
                    }
                );
                return;
            }
            /* ====================================================
               OTHER ERROR
            ==================================================== */
            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Unable to load this event."
                );
            }
            /*
             * Support all common backend response shapes:
             *
             * { event: {...} }
             * { data: {...} }
             * {...event fields...}
             */
            const loadedEvent =
                data?.event ||
                data?.data?.event ||
                data?.data ||
                data;
            if (
                !loadedEvent ||
                typeof loadedEvent !== "object" ||
                Array.isArray(loadedEvent)
            ) {
                throw new Error(
                    "Event information was not found."
                );
            }
            setEvent(
                loadedEvent
            );
        } catch (eventError) {
            console.error(
                "TEAM EVENT LOAD ERROR:",
                eventError
            );
            setError(
                eventError?.message ||
                    "Unable to load this event."
            );
        } finally {
            setLoading(false);
        }
    };
    /* ============================================================
       INITIAL LOAD
    ============================================================ */
    useEffect(() => {
        loadEvent();
    }, [
        eventId,
        isAdminTeamEvent
    ]);
    /* ============================================================
       EVENT HELPERS
    ============================================================ */
    const title =
        event?.title ||
        event?.eventTitle ||
        event?.name ||
        "Untitled Event";
    const poster =
        event?.eventPoster ||
        event?.poster ||
        event?.image ||
        event?.imageUrl ||
        event?.posterUrl ||
        "";
    const posterUrl =
        getMediaUrl(
            poster
        );
    const locationName =
        event?.venue ||
        event?.location ||
        event?.eventLocation ||
        event?.venueName ||
        "Location not provided";
    const date =
        event?.date ||
        event?.eventDate ||
        event?.startDate ||
        "";
    const time =
        event?.time ||
        event?.eventTime ||
        event?.startTime ||
        "";
    const organizer =
        event?.organizerName ||
        event?.hostName ||
        event?.organizer ||
        event?.host ||
        "Event Organizer";
    const ticketType =
        event?.ticketType ||
        "";
    const capacity =
        event?.capacity ??
        event?.totalTickets ??
        event?.ticketsAvailable ??
        "";
    const ticketsSold =
        Number(
            event?.ticketsSold ?? 0
        );
    const remaining =
        capacity !== ""
            ? Math.max(
                  Number(capacity) -
                      ticketsSold,
                  0
              )
            : "";
    const description =
        event?.description ||
        event?.details ||
        event?.about ||
        "No event description provided.";
    /* ============================================================
       FORMAT DATE
    ============================================================ */
    const formatDate = (value) => {
        if (!value) {
            return "";
        }
        const parsed =
            new Date(value);
        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return String(value);
        }
        return parsed.toLocaleDateString(
            undefined,
            {
                weekday:
                    "long",
                day:
                    "numeric",
                month:
                    "long",
                year:
                    "numeric",
            }
        );
    };
    /* ============================================================
       FORMAT TIME
    ============================================================ */
    const formatTime = (value) => {
        if (!value) {
            return "";
        }
        const parsed =
            new Date(value);
        /*
         * If the backend gives us a full ISO date/time,
         * format it nicely.
         */
        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {
            return parsed.toLocaleTimeString(
                undefined,
                {
                    hour:
                        "2-digit",
                    minute:
                        "2-digit",
                }
            );
        }
        /*
         * If the backend gives us something like
         * "18:30", keep it exactly as supplied.
         */
        return String(value);
    };
    /* ============================================================
       BACK TO CORRECT TEAM DASHBOARD
       ADMIN TEAM:
           /admin/team-dashboard
       REGULAR TEAM:
           /team-dashboard
    ============================================================ */
    const goBack = () => {
        if (isAdminTeamEvent) {
            navigate(
                "/admin/team-dashboard"
            );
            return;
        }
        navigate(
            "/team-dashboard"
        );
    };
    /* ============================================================
       SCAN THIS EVENT
       ADMIN TEAM:
           /admin/team-scanner/:eventId
       REGULAR TEAM:
           /team-scanner/:eventId
    ============================================================ */
    const scanEvent = () => {
        if (!eventId) {
            return;
        }
        if (isAdminTeamEvent) {
            navigate(
                `/admin/team-scanner/${encodeURIComponent(
                    eventId
                )}`
            );
            return;
        }
        navigate(
            `/team-scanner/${encodeURIComponent(
                eventId
            )}`
        );
    };
    /* ============================================================
       LOADING
    ============================================================ */
    if (loading) {
        return (
            <div className="team-event-view-page">
                <div className="team-event-view-loading">
                    <div className="team-event-view-spinner" />
                    <h2>
                        Loading Event
                    </h2>
                    <p>
                        Getting event information...
                    </p>
                </div>
            </div>
        );
    }
    /* ============================================================
       ERROR
    ============================================================ */
    if (
        error ||
        !event
    ) {
        return (
            <div className="team-event-view-page">
                <div className="team-event-view-error">
                    <div className="team-event-error-icon">
                        <AlertCircle
                            size={30}
                        />
                    </div>
                    <h2>
                        Unable to Load Event
                    </h2>
                    <p>
                        {error ||
                            "Event information is unavailable."}
                    </p>
                    <div className="team-event-error-actions">
                        <button
                            type="button"
                            onClick={
                                loadEvent
                            }
                        >
                            <RefreshCw
                                size={18}
                            />
                            Try Again
                        </button>
                        <button
                            type="button"
                            onClick={
                                goBack
                            }
                        >
                            <ArrowLeft
                                size={18}
                            />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    /* ============================================================
       RENDER
    ============================================================ */
    return (
        <div className="team-event-view-page">
            {/* ====================================================
                HEADER
            ==================================================== */}
            <header className="team-event-view-header">
                <div className="team-event-view-header-inner">
                    <button
                        type="button"
                        className="team-event-back-btn"
                        onClick={
                            goBack
                        }
                    >
                        <ArrowLeft
                            size={19}
                        />
                        <span>
                            Team Dashboard
                        </span>
                    </button>
                    <div className="team-event-brand">
                        {settings?.platformLogo ? (
                            <img
                                src={
                                    getMediaUrl(
                                        settings.platformLogo
                                    )
                                }
                                alt={
                                    settings?.platformName ||
                                    "EventWaa"
                                }
                                onError={
                                    (imageEvent) => {
                                        imageEvent
                                            .currentTarget
                                            .style
                                            .display =
                                            "none";
                                    }
                                }
                            />
                        ) : (
                            <div className="team-event-brand-fallback">
                                EW
                            </div>
                        )}
                        <div className="team-event-brand-text">
                            <strong>
                                {
                                    settings?.platformName ||
                                    "EventWaa"
                                }
                            </strong>
                            <span>
                                TEAM PORTAL
                            </span>
                        </div>
                    </div>
                </div>
            </header>
            {/* ====================================================
                MAIN
            ==================================================== */}
            <main className="team-event-view-content">
                <div className="team-event-view-eyebrow">
                    <ShieldCheck
                        size={16}
                    />
                    <span>
                        AUTHORIZED TEAM EVENT
                    </span>
                </div>
                <div className="team-event-view-layout">
                    {/* =================================================
                        FULL EVENT POSTER
                    ================================================= */}
                    <section className="team-event-poster-section">
                        <div className="team-event-full-poster">
                            {posterUrl ? (
                                <img
                                    src={
                                        posterUrl
                                    }
                                    alt={
                                        title
                                    }
                                    onError={
                                        (imageEvent) => {
                                            imageEvent
                                                .currentTarget
                                                .style
                                                .display =
                                                "none";
                                            imageEvent
                                                .currentTarget
                                                .parentElement
                                                .classList
                                                .add(
                                                    "poster-failed"
                                                );
                                        }
                                    }
                                />
                            ) : (
                                <div className="team-event-poster-placeholder">
                                    <CalendarDays
                                        size={48}
                                    />
                                    <strong>
                                        {title}
                                    </strong>
                                    <span>
                                        Event poster unavailable
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>
                    {/* =================================================
                        EVENT INFORMATION
                    ================================================= */}
                    <section className="team-event-information">
                        <span className="team-event-status">
                            <CheckIcon />
                            EVENT INFORMATION
                        </span>
                        <h1>
                            {title}
                        </h1>
                        <p className="team-event-organizer">
                            Organized by{" "}
                            <strong>
                                {organizer}
                            </strong>
                        </p>
                        {/* =================================================
                            EVENT DETAILS
                        ================================================= */}
                        <div className="team-event-details-grid">
                            {date && (
                                <div className="team-event-detail">
                                    <div className="team-event-detail-icon">
                                        <CalendarDays
                                            size={20}
                                        />
                                    </div>
                                    <div>
                                        <small>
                                            DATE
                                        </small>
                                        <strong>
                                            {
                                                formatDate(
                                                    date
                                                )
                                            }
                                        </strong>
                                    </div>
                                </div>
                            )}
                            {time && (
                                <div className="team-event-detail">
                                    <div className="team-event-detail-icon">
                                        <Clock3
                                            size={20}
                                        />
                                    </div>
                                    <div>
                                        <small>
                                            TIME
                                        </small>
                                        <strong>
                                            {
                                                formatTime(
                                                    time
                                                )
                                            }
                                        </strong>
                                    </div>
                                </div>
                            )}
                            <div className="team-event-detail">
                                <div className="team-event-detail-icon">
                                    <MapPin
                                        size={20}
                                    />
                                </div>
                                <div>
                                    <small>
                                        LOCATION
                                    </small>
                                    <strong>
                                        {locationName}
                                    </strong>
                                </div>
                            </div>
                            {ticketType && (
                                <div className="team-event-detail">
                                    <div className="team-event-detail-icon">
                                        <Ticket
                                            size={20}
                                        />
                                    </div>
                                    <div>
                                        <small>
                                            TICKET TYPE
                                        </small>
                                        <strong>
                                            {ticketType}
                                        </strong>
                                    </div>
                                </div>
                            )}
                            <div className="team-event-detail">
                                <div className="team-event-detail-icon">
                                    <Building2
                                        size={20}
                                    />
                                </div>
                                <div>
                                    <small>
                                        ORGANIZER
                                    </small>
                                    <strong>
                                        {organizer}
                                    </strong>
                                </div>
                            </div>
                        </div>
                        {/* =================================================
                            TICKET STATISTICS
                        ================================================= */}
                        <div className="team-event-capacity">
                            <div>
                                <span>
                                    <Ticket
                                        size={17}
                                    />
                                    Tickets Sold
                                </span>
                                <strong>
                                    {ticketsSold}
                                </strong>
                            </div>
                            <div>
                                <span>
                                    <Users
                                        size={17}
                                    />
                                    Capacity
                                </span>
                                <strong>
                                    {
                                        capacity !== ""
                                            ? capacity
                                            : "—"
                                    }
                                </strong>
                            </div>
                            <div>
                                <span>
                                    <Users
                                        size={17}
                                    />
                                    Remaining
                                </span>
                                <strong>
                                    {
                                        remaining !== ""
                                            ? remaining
                                            : "—"
                                    }
                                </strong>
                            </div>
                        </div>
                        {/* =================================================
                            DESCRIPTION
                        ================================================= */}
                        <div className="team-event-description">
                            <h2>
                                About This Event
                            </h2>
                            <p>
                                {description}
                            </p>
                        </div>
                        {/* =================================================
                            SCAN BUTTON
                        ================================================= */}
                        <button
                            type="button"
                            className="team-event-scan-btn"
                            onClick={
                                scanEvent
                            }
                        >
                            <ScanLine
                                size={21}
                            />
                            <span>
                                Scan This Event
                            </span>
                            <span className="team-event-scan-arrow">
                                →
                            </span>
                        </button>
                    </section>
                </div>
            </main>
            {/* ====================================================
                FOOTER
            ==================================================== */}
            <footer className="team-event-view-footer">
                <span>
                    {
                        settings?.platformName ||
                        "EventWaa"
                    }{" "}
                    Team Portal
                </span>
                <span>
                    Authorized team member access only.
                </span>
            </footer>
        </div>
    );
}
/* ============================================================
   SMALL INTERNAL ICON
============================================================ */
function CheckIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
export default TeamEventView;