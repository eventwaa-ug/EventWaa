import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/TeamEventView.css";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";

const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000";

function TeamEventView() {

    const { eventId } = useParams();
    const navigate = useNavigate();

    const { settings } =
        usePlatformSettings();

    const [event, setEvent] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /* ============================================================
       TEAM TOKEN
    ============================================================ */

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

    /* ============================================================
       MEDIA URL
    ============================================================ */

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
                : {}),
        };

    };

    /* ============================================================
       LOAD EVENT
    ============================================================ */

    const loadEvent = async () => {

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

            if (!eventId) {

                throw new Error(
                    "Event ID is missing."
                );

            }

            /*
             * Use the existing backend event
             * endpoint.
             *
             * This page is protected by the
             * Team Portal route, so it does
             * NOT use the normal public event
             * page.
             */

            const response =
                await fetch(
                    `${BACKEND_URL}/events/${encodeURIComponent(eventId)}`,
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

                localStorage.removeItem(
                    "eventwaa_team_token"
                );

                sessionStorage.removeItem(
                    "eventwaa_team_token"
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
                    "Unable to load this event."
                );

            }

            /*
             * Support different backend response
             * structures.
             */

            const loadedEvent =
                data?.event ||
                data?.data ||
                data;

            if (
                !loadedEvent ||
                typeof loadedEvent !== "object"
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
                eventError.message ||
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

    }, [eventId]);

    /* ============================================================
       EVENT HELPERS
    ============================================================ */

    const title =
        event?.title ||
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
        getMediaUrl(poster);

    const location =
        event?.venue ||
        event?.location ||
        event?.eventLocation ||
        "Location not provided";

    const date =
        event?.date ||
        event?.eventDate ||
        "";

    const time =
        event?.time ||
        event?.eventTime ||
        "";

    const organizer =
        event?.organizerName ||
        event?.hostName ||
        event?.host ||
        "Event Organizer";

    const ticketType =
        event?.ticketType ||
        "";

    const capacity =
        event?.capacity ??
        event?.totalTickets ??
        "";

    const ticketsSold =
        event?.ticketsSold ??
        0;

    const remaining =
        capacity !== ""
            ? Math.max(
                Number(capacity) -
                Number(ticketsSold),
                0
            )
            : "";

    const description =
        event?.description ||
        event?.details ||
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
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );

    };

    /* ============================================================
       BACK TO TEAM DASHBOARD
    ============================================================ */

    const goBack = () => {

        navigate(
            "/admin/team-dashboard"
        );

    };

    /* ============================================================
       SCAN THIS EVENT
    ============================================================ */

    const scanEvent = () => {

        if (!eventId) {
            return;
        }

        navigate(
            `/admin/team-scanner/${encodeURIComponent(eventId)}`
        );

    };

    /* ============================================================
       LOADING
    ============================================================ */

    if (loading) {

        return (

            <div className="team-event-view-page">

                <div className="team-event-view-loading">

                    <div className="team-event-view-spinner"></div>

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

    if (error || !event) {

        return (

            <div className="team-event-view-page">

                <div className="team-event-view-error">

                    <div className="team-event-error-icon">
                        !
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
                            onClick={loadEvent}
                        >
                            Try Again
                        </button>

                        <button
                            type="button"
                            onClick={goBack}
                        >
                            Back to Team Dashboard
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

                <button
                    type="button"
                    className="team-event-back-btn"
                    onClick={goBack}
                >
                    ← Team Dashboard
                </button>

                <div className="team-event-brand">

                    {settings?.platformLogo ? (

                        <img
                            src={getMediaUrl(
                                settings.platformLogo
                            )}
                            alt={
                                settings.platformName ||
                                "EventWaa"
                            }
                        />

                    ) : (

                        <div className="team-event-brand-fallback">
                            EW
                        </div>

                    )}

                    <div>

                        <strong>
                            {settings?.platformName ||
                                "EventWaa"}
                        </strong>

                        <span>
                            TEAM PORTAL
                        </span>

                    </div>

                </div>

            </header>


            {/* ====================================================
                MAIN
            ==================================================== */}

            <main className="team-event-view-content">

                <div className="team-event-view-eyebrow">
                    TEAM EVENT VIEW
                </div>


                <div className="team-event-view-layout">

                    {/* =================================================
                        FULL POSTER
                    ================================================= */}

                    <section className="team-event-poster-section">

                        <div className="team-event-full-poster">

                            {posterUrl ? (

                                <img
                                    src={posterUrl}
                                    alt={title}
                                    onError={(imageEvent) => {

                                        imageEvent.currentTarget.style.display =
                                            "none";

                                        imageEvent.currentTarget.parentElement.classList.add(
                                            "poster-failed"
                                        );

                                    }}
                                />

                            ) : (

                                <div className="team-event-poster-placeholder">

                                    <span>
                                        📅
                                    </span>

                                    <strong>
                                        {title}
                                    </strong>

                                </div>

                            )}

                        </div>

                    </section>


                    {/* =================================================
                        EVENT INFORMATION
                    ================================================= */}

                    <section className="team-event-information">

                        <span className="team-event-status">
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


                        <div className="team-event-details-grid">

                            {date && (

                                <div className="team-event-detail">

                                    <span>
                                        📅
                                    </span>

                                    <div>

                                        <small>
                                            DATE
                                        </small>

                                        <strong>
                                            {formatDate(
                                                date
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            )}


                            {time && (

                                <div className="team-event-detail">

                                    <span>
                                        🕐
                                    </span>

                                    <div>

                                        <small>
                                            TIME
                                        </small>

                                        <strong>
                                            {time}
                                        </strong>

                                    </div>

                                </div>

                            )}


                            <div className="team-event-detail">

                                <span>
                                    📍
                                </span>

                                <div>

                                    <small>
                                        LOCATION
                                    </small>

                                    <strong>
                                        {location}
                                    </strong>

                                </div>

                            </div>


                            {ticketType && (

                                <div className="team-event-detail">

                                    <span>
                                        🎫
                                    </span>

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

                        </div>


                        {/* =================================================
                            CAPACITY
                        ================================================= */}

                        <div className="team-event-capacity">

                            <div>

                                <span>
                                    Tickets Sold
                                </span>

                                <strong>
                                    {ticketsSold}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Capacity
                                </span>

                                <strong>
                                    {capacity !== ""
                                        ? capacity
                                        : "—"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Remaining
                                </span>

                                <strong>
                                    {remaining !== ""
                                        ? remaining
                                        : "—"}
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
                            onClick={scanEvent}
                        >
                            🎟️ Scan This Event →
                        </button>

                    </section>

                </div>

            </main>


            {/* ====================================================
                FOOTER
            ==================================================== */}

            <footer className="team-event-view-footer">

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

export default TeamEventView;