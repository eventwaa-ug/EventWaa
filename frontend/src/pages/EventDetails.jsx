import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";

import {
    User,
    Share2,
    CheckCircle,
    MapPin,
    CalendarDays,
    Clock,
    Users,
    Phone,
    Tag,
    X,
    Ticket,
    ShieldCheck,
    Flag,
} from "lucide-react";

import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";

import "./EventDetails.css";


function EventDetails() {

    const { user } = useAuth();

    const navigate = useNavigate();

    const { id } = useParams();

    const { events } =
        useContext(EventContext);


    /* ============================================================
       STATE
    ============================================================ */

    const [showReportForm, setShowReportForm] =
        useState(false);

    const [reportData, setReportData] =
        useState({
            reason: "",
            description: "",
        });

    const [submittingReport, setSubmittingReport] =
        useState(false);


    /* ============================================================
       BACKEND
    ============================================================ */

    const BACKEND_URL =
        import.meta.env.VITE_API_BASE_URL || "";


    /* ============================================================
       FIND EVENT
    ============================================================ */

    const event =
        (events || []).find(
            (item) =>
                Number(item?.id) === Number(id)
        );


    /* ============================================================
       EVENT NOT FOUND
    ============================================================ */

    if (!event) {

        return (

            <div className="event-not-found">

                <div className="event-not-found-icon">

                    <Ticket size={34} />

                </div>

                <h2>
                    Event not found
                </h2>

                <p>
                    This event may have been removed
                    or is no longer available.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/events")
                    }
                >
                    Browse Events
                </button>

            </div>

        );

    }


    /* ============================================================
       EVENT STATUS
    ============================================================ */

    const isCancelled =
        String(event.status || "").toLowerCase() ===
        "cancelled";


    /* ============================================================
       IMAGE URL
    ============================================================ */

    const getImageUrl = () => {

        const image =
            event.eventPoster ||
            event.image ||
            event.poster;

        if (!image) {
            return "/default-event.jpg";
        }

        const imageUrl =
            String(image).trim();

        if (!imageUrl) {
            return "/default-event.jpg";
        }

        if (
            imageUrl.startsWith("http://") ||
            imageUrl.startsWith("https://")
        ) {
            return imageUrl;
        }

        const backend =
            BACKEND_URL.replace(/\/+$/, "");

        if (imageUrl.startsWith("/")) {
            return `${backend}${imageUrl}`;
        }

        return `${backend}/${imageUrl}`;

    };


    /* ============================================================
       TICKETS
    ============================================================ */

    const tickets =
        Array.isArray(event.tickets) &&
        event.tickets.length > 0

            ? event.tickets

            : [
                {
                    name: "Regular",
                    price: event.price || 0,
                    quantity:
                        event.capacity || 100,
                },
            ];


    /* ============================================================
       BOOK TICKET
    ============================================================ */

    const bookTicket = (ticket) => {

        if (isCancelled) {

            alert(
                "This event has been cancelled and tickets are no longer available."
            );

            return;

        }


        if (!user) {

            alert(
                "Please login before booking a ticket."
            );

            navigate(
                "/login",
                {
                    state: {
                        from:
                            `/booking/${event.id}`,
                    },
                }
            );

            return;

        }


        navigate(
            `/booking/${event.id}`,
            {
                state: {
                    ticket,
                },
            }
        );

    };


    /* ============================================================
       VIEW HOST
    ============================================================ */

    const viewHost = () => {

        if (!event.hostId) {

            alert(
                "Host information is not available for this event."
            );

            return;

        }

        navigate(
            `/host/${encodeURIComponent(
                event.hostId
            )}`
        );

    };


    /* ============================================================
       SHARE EVENT
       
       Uses the device/browser native share sheet.
       
       Falls back to copying the public EventWaa event link
       when navigator.share is unavailable.
    ============================================================ */

    const getShareUrl = () => {

        const origin =
            window.location.origin;

        /*
         * Keep the public EventWaa event route
         * consistent instead of sharing a temporary
         * or environment-specific URL.
         *
         * If the event has a slug, use it.
         * Otherwise use the event ID.
         */

        const eventIdentifier =
            event.slug ||
            event.eventSlug ||
            event.event_id ||
            event.id;

        return `${origin}/events/${encodeURIComponent(
            eventIdentifier
        )}`;

    };


    const copyShareLink = async (
        eventUrl
    ) => {

        try {

            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                await navigator.clipboard.writeText(
                    eventUrl
                );

            } else {

                /*
                 * Fallback for browsers where the
                 * Clipboard API is unavailable.
                 */

                const textArea =
                    document.createElement(
                        "textarea"
                    );

                textArea.value =
                    eventUrl;

                textArea.style.position =
                    "fixed";

                textArea.style.opacity = "0";

                document.body.appendChild(
                    textArea
                );

                textArea.focus();
                textArea.select();

                document.execCommand(
                    "copy"
                );

                document.body.removeChild(
                    textArea
                );

            }

            alert(
                "Event link copied successfully!"
            );

        } catch (error) {

            console.error(
                "COPY EVENT LINK ERROR:",
                error
            );

            alert(
                "Unable to copy the event link."
            );

        }

    };


    const handleShare = async () => {

        const eventUrl =
            getShareUrl();

        const shareTitle =
            event.title ||
            "EventWaa Event";

        const shareText =
            `Check out ${shareTitle} on EventWaa!`;

        /*
         * Native device/browser share.
         */

        if (
            typeof navigator.share ===
            "function"
        ) {

            try {

                await navigator.share({
                    title:
                        shareTitle,

                    text:
                        shareText,

                    url:
                        eventUrl,
                });

                return;

            } catch (error) {

                /*
                 * AbortError means the user closed
                 * the share sheet without sharing.
                 *
                 * Do not show an error in that case.
                 */

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    return;
                }

                console.error(
                    "NATIVE SHARE ERROR:",
                    error
                );

            }

        }

        /*
         * Fallback for browsers/devices without
         * native Web Share support.
         */

        await copyShareLink(
            eventUrl
        );

    };


    /* ============================================================
       REPORT
    ============================================================ */

    const submitReport = async () => {

        if (!user) {

            alert(
                "Please login before reporting an event."
            );

            navigate(
                "/login",
                {
                    state: {
                        from:
                            `/events/${event.id}`,
                    },
                }
            );

            return;

        }


        if (
            !reportData.reason ||
            !reportData.description.trim()
        ) {

            alert(
                "Please complete the report form."
            );

            return;

        }


        const report = {

            eventId:
                event.id,

            eventTitle:
                event.title,

            reportedBy:
                user?.email || "",

            reason:
                reportData.reason,

            description:
                reportData.description.trim(),

        };


        try {

            setSubmittingReport(true);


            const response =
                await fetch(
                    `${BACKEND_URL}/event-reports`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                report
                            ),
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Failed to submit report."
                );

            }


            alert(
                "Report submitted successfully."
            );


            setReportData({
                reason: "",
                description: "",
            });


            setShowReportForm(
                false
            );


        } catch (error) {

            console.error(
                "EVENT REPORT ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to submit report."
            );

        } finally {

            setSubmittingReport(
                false
            );

        }

    };


    /* ============================================================
       FORMAT DATE
    ============================================================ */

    const formatDate = (value) => {

        if (!value) {
            return "Date not available";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        );

    };


    /* ============================================================
       FORMAT PRICE
    ============================================================ */

    const formatPrice = (price) => {

        const amount =
            Number(price || 0);

        return Number.isFinite(amount)
            ? amount.toLocaleString()
            : "0";

    };


    /* ============================================================
       EVENT TYPE
    ============================================================ */

    const isFreeEvent =
        String(
            event.eventType || ""
        ).toLowerCase() ===
        "free";


    /* ============================================================
       RENDER
    ============================================================ */

    return (

        <div
            className={`event-details-page ${
                isCancelled
                    ? "event-details-cancelled"
                    : ""
            }`}
        >

            {/* =====================================================
                POSTER
            ===================================================== */}

            <section className="event-hero">

                <div className="event-poster-container">

                    <img
                        src={getImageUrl()}
                        alt={
                            event.title ||
                            "Event poster"
                        }
                        className="event-image"
                        onError={(e) => {

                            if (
                                e.currentTarget.src.includes(
                                    "default-event.jpg"
                                )
                            ) {
                                return;
                            }

                            e.currentTarget.src =
                                "/default-event.jpg";

                        }}
                    />

                </div>


                {/* =================================================
                    BADGES
                ================================================= */}

                <div className="event-hero-overlay">

                    {isCancelled ? (

                        <span className="event-type-badge cancelled">

                            Event Cancelled

                        </span>

                    ) : (

                        <span
                            className={`event-type-badge ${
                                isFreeEvent
                                    ? "free"
                                    : "paid"
                            }`}
                        >

                            {isFreeEvent
                                ? "Free Event"
                                : "Paid Event"}

                        </span>

                    )}


                    {event.verifiedHost && (

                        <span className="verified-badge">

                            <ShieldCheck
                                size={16}
                            />

                            Verified Host

                        </span>

                    )}

                </div>

            </section>


            {/* =====================================================
                EVENT HEADER
            ===================================================== */}

            <section className="event-header">

                <div className="event-title-row">

                    <div>

                        <h1>
                            {event.title}
                        </h1>

                        {event.organizerName && (

                            <p className="event-organizer-name">

                                Organized by{" "}

                                <strong>
                                    {
                                        event.organizerName
                                    }
                                </strong>

                            </p>

                        )}

                    </div>

                </div>


                {/* =================================================
                    CANCELLED NOTICE
                ================================================= */}

                {isCancelled && (

                    <div className="event-cancelled-notice">

                        <div className="event-cancelled-notice-icon">

                            <X size={22} />

                        </div>

                        <div>

                            <strong>
                                This event has been cancelled
                            </strong>

                            <p>
                                Ticket purchases and
                                attendance reservations
                                are no longer available.
                            </p>

                            {event.cancellationReason && (

                                <p className="event-cancellation-reason">

                                    <strong>
                                        Reason:
                                    </strong>{" "}

                                    {
                                        event.cancellationReason
                                    }

                                </p>

                            )}

                        </div>

                    </div>

                )}


                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                {event.description && (

                    <p className="event-description">

                        {event.description}

                    </p>

                )}


                {/* =================================================
                    ACTION BAR
                ================================================= */}

                <div className="event-action-bar">

                    {/* =============================================
                        VIEW HOST
                    ============================================= */}

                    <button
                        type="button"
                        className="event-action-btn organizer-btn"
                        onClick={viewHost}
                    >

                        <User size={18} />

                        <span>
                            View Host
                        </span>

                    </button>


                    {/* =============================================
                        SHARE
                    ============================================= */}

                    <button
                        type="button"
                        className="event-action-btn share-btn"
                        onClick={handleShare}
                    >

                        <Share2 size={18} />

                        <span>
                            Share
                        </span>

                    </button>


                    {/* =============================================
                        REPORT
                    ============================================= */}

                    <button
                        type="button"
                        className="event-action-btn report-btn"
                        onClick={() =>
                            setShowReportForm(
                                true
                            )
                        }
                    >

                        <Flag
                            size={18}
                        />

                        <span>
                            Report
                        </span>

                    </button>

                </div>


                {/* =================================================
                    EVENT INFORMATION
                ================================================= */}

                <div className="event-meta">

                    {/* =============================================
                        VENUE
                    ============================================= */}

                    {event.venue && (

                        <div className="event-meta-item">

                            <MapPin
                                size={19}
                            />

                            <div>

                                <span>
                                    Venue
                                </span>

                                <strong>
                                    {event.venue}
                                </strong>

                            </div>

                        </div>

                    )}


                    {/* =============================================
                        CITY
                    ============================================= */}

                    {event.city && (

                        <div className="event-meta-item">

                            <MapPin
                                size={19}
                            />

                            <div>

                                <span>
                                    City
                                </span>

                                <strong>
                                    {event.city}
                                </strong>

                            </div>

                        </div>

                    )}


                    {/* =============================================
                        DATE
                    ============================================= */}

                    {event.date && (

                        <div className="event-meta-item">

                            <CalendarDays
                                size={19}
                            />

                            <div>

                                <span>
                                    Date
                                </span>

                                <strong>
                                    {formatDate(
                                        event.date
                                    )}
                                </strong>

                            </div>

                        </div>

                    )}


                    {/* =============================================
                        TIME
                    ============================================= */}

                    {(event.startTime ||
                        event.endTime) && (

                        <div className="event-meta-item">

                            <Clock
                                size={19}
                            />

                            <div>

                                <span>
                                    Time
                                </span>

                                <strong>

                                    {event.startTime ||
                                        "Time not set"}

                                    {event.endTime &&
                                        ` – ${event.endTime}`}

                                </strong>

                            </div>

                        </div>

                    )}


                    {/* =============================================
                        CATEGORY
                    ============================================= */}

                    {event.category && (

                        <div className="event-meta-item">

                            <Tag
                                size={19}
                            />

                            <div>

                                <span>
                                    Category
                                </span>

                                <strong>
                                    {event.category}
                                </strong>

                            </div>

                        </div>

                    )}


                    {/* =============================================
                        CAPACITY
                    ============================================= */}

                    {event.capacity && (

                        <div className="event-meta-item">

                            <Users
                                size={19}
                            />

                            <div>

                                <span>
                                    Capacity
                                </span>

                                <strong>
                                    {Number(
                                        event.capacity
                                    ).toLocaleString()}{" "}
                                    guests
                                </strong>

                            </div>

                        </div>

                    )}


                    {/* =============================================
                        CONTACT
                    ============================================= */}

                    {event.contact && (

                        <div className="event-meta-item">

                            <Phone
                                size={19}
                            />

                            <div>

                                <span>
                                    Contact
                                </span>

                                <strong>
                                    {event.contact}
                                </strong>

                            </div>

                        </div>

                    )}

                </div>

            </section>


            {/* =====================================================
                TICKET SECTION
            ===================================================== */}

            {isCancelled ? (

                <section className="ticket-section cancelled-event-section">

                    <div className="section-heading">

                        <div className="section-heading-icon">

                            <X size={22} />

                        </div>

                        <div>

                            <h2>
                                Event Cancelled
                            </h2>

                            <p>
                                Ticket purchases and
                                attendance reservations
                                are unavailable.
                            </p>

                        </div>

                    </div>


                    <div className="cancelled-event-card">

                        <strong>
                            This event is no longer
                            accepting bookings.
                        </strong>

                        <p>
                            If you previously purchased
                            a ticket, please check your
                            EventWaa notifications for
                            refund information.
                        </p>

                    </div>

                </section>

            ) : isFreeEvent ? (

                <section className="ticket-section free-event-section">

                    <div className="section-heading">

                        <div className="section-heading-icon">

                            <CheckCircle
                                size={22}
                            />

                        </div>

                        <div>

                            <h2>
                                Free Event
                            </h2>

                            <p>
                                This event is free to attend.
                            </p>

                        </div>

                    </div>


                    <div className="free-event-card">

                        <div>

                            <h3>
                                Confirm your attendance
                            </h3>

                            <p>
                                Reserve your attendance
                                and receive your free
                                attendance pass.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="book-btn free-btn"
                            onClick={() =>
                                navigate(
                                    `/free-attendance/${event.id}`
                                )
                            }
                        >

                            Confirm Attendance

                        </button>

                    </div>

                </section>

            ) : (

                <section className="ticket-section">

                    <div className="section-heading">

                        <div className="section-heading-icon">

                            <Ticket
                                size={22}
                            />

                        </div>

                        <div>

                            <h2>
                                Available Tickets
                            </h2>

                            <p>
                                Choose your ticket type
                                and book your place.
                            </p>

                        </div>

                    </div>


                    <div className="ticket-list">

                        {tickets.map(
                            (
                                ticket,
                                index
                            ) => {

                                const remaining =
                                    Number(
                                        ticket.remaining ??
                                        ticket.quantity ??
                                        0
                                    );

                                const soldOut =
                                    remaining <= 0;


                                return (

                                    <div
                                        className="ticket-card"
                                        key={
                                            ticket.id ||
                                            ticket.ticketId ||
                                            `${ticket.name || "ticket"}-${index}`
                                        }
                                    >

                                        <div className="ticket-card-top">

                                            <div>

                                                <span className="ticket-label">
                                                    Ticket
                                                </span>

                                                <h3>
                                                    {ticket.name ||
                                                        "Regular"}
                                                </h3>

                                            </div>


                                            <div className="ticket-price">

                                                <span>
                                                    UGX
                                                </span>

                                                {formatPrice(
                                                    ticket.price
                                                )}

                                            </div>

                                        </div>


                                        <div className="ticket-availability">

                                            <span>
                                                Available
                                            </span>

                                            <strong
                                                className={
                                                    soldOut
                                                        ? "sold-out-text"
                                                        : ""
                                                }
                                            >
                                                {soldOut
                                                    ? "Sold Out"
                                                    : `${remaining.toLocaleString()} remaining`}
                                            </strong>

                                        </div>


                                        <button
                                            type="button"
                                            disabled={
                                                soldOut
                                            }
                                            className="book-btn"
                                            onClick={() =>
                                                bookTicket(
                                                    ticket
                                                )
                                            }
                                        >

                                            {soldOut
                                                ? "Sold Out"
                                                : `Book ${
                                                      ticket.name ||
                                                      "Ticket"
                                                  }`}

                                        </button>

                                    </div>

                                );

                            }
                        )}

                    </div>

                </section>

            )}


            {/* =====================================================
                HOST INFORMATION
            ===================================================== */}

            <section className="organizer-section">

                <div className="organizer-info">

                    <div className="organizer-info-content">

                        <div className="organizer-icon">

                            <User
                                size={23}
                            />

                        </div>


                        <div>

                            <span className="organizer-label">
                                EVENT HOST
                            </span>

                            <strong>
                                {event.organizerName ||
                                    event.hostName ||
                                    "EventWaa Host"}
                            </strong>

                            {event.verifiedHost && (

                                <div className="organizer-verified">

                                    <CheckCircle
                                        size={16}
                                    />

                                    Verified Host

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </section>


            {/* =====================================================
                REPORT MODAL
            ===================================================== */}

            {showReportForm && (

                <div
                    className="event-report-overlay"
                    onClick={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {

                            setShowReportForm(
                                false
                            );

                        }

                    }}
                >

                    <div className="event-report-modal">

                        <div className="event-report-header">

                            <div>

                                <h2>
                                    Report Event
                                </h2>

                                <p>
                                    Tell us what is wrong
                                    with this event.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="event-report-close"
                                onClick={() =>
                                    setShowReportForm(
                                        false
                                    )
                                }
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <div className="event-report-form">

                            <label htmlFor="report-reason">
                                Reason
                            </label>

                            <select
                                id="report-reason"
                                value={
                                    reportData.reason
                                }
                                onChange={(e) =>
                                    setReportData(
                                        (previous) => ({
                                            ...previous,
                                            reason:
                                                e.target.value,
                                        })
                                    )
                                }
                            >

                                <option value="">
                                    Select a reason
                                </option>

                                <option value="Fake event">
                                    Fake event
                                </option>

                                <option value="Scam or fraud">
                                    Scam or fraud
                                </option>

                                <option value="Incorrect information">
                                    Incorrect information
                                </option>

                                <option value="Inappropriate content">
                                    Inappropriate content
                                </option>

                                <option value="Event no longer exists">
                                    Event no longer exists
                                </option>

                                <option value="Other">
                                    Other
                                </option>

                            </select>


                            <label htmlFor="report-description">
                                Description
                            </label>

                            <textarea
                                id="report-description"
                                value={
                                    reportData.description
                                }
                                onChange={(e) =>
                                    setReportData(
                                        (previous) => ({
                                            ...previous,
                                            description:
                                                e.target.value,
                                        })
                                    )
                                }
                                placeholder="Please explain the problem..."
                            />


                            <button
                                type="button"
                                className="submit-report-btn"
                                disabled={
                                    submittingReport
                                }
                                onClick={
                                    submitReport
                                }
                            >

                                {submittingReport
                                    ? "Submitting..."
                                    : "Submit Report"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default EventDetails;