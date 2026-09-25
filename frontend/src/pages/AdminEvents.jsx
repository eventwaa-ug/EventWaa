import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FiCalendar,
    FiCheck,
    FiEdit,
    FiSearch,
    FiShare2,
    FiStar,
    FiTrash2,
    FiXCircle,
} from "react-icons/fi";

import "./AdminEvents.css";


const BACKEND_URL =
    import.meta.env.VITE_API_BASE_URL || "";


function AdminEvents() {

    const navigate = useNavigate();


    /* ============================================================
       STATE
    ============================================================ */

    const [events, setEvents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [filter, setFilter] =
        useState("all");

    const [cancellingId, setCancellingId] =
        useState(null);


    /* ============================================================
       SAFE JSON RESPONSE
    ============================================================ */

    const parseResponse = async (
        response
    ) => {

        try {

            return await response.json();

        } catch {

            return {};

        }

    };


    /* ============================================================
       FETCH EVENTS
    ============================================================ */

    const fetchEvents = async () => {

        try {

            setLoading(true);
            setError("");


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/events`
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load events."
                );

            }


            setEvents(
                Array.isArray(data)
                    ? data
                    : Array.isArray(
                          data.events
                      )
                    ? data.events
                    : []
            );

        } catch (err) {

            console.error(
                "ADMIN EVENTS LOAD ERROR:",
                err
            );


            setError(
                err.message ||
                "Failed to load events."
            );

        } finally {

            setLoading(false);

        }

    };


    /* ============================================================
       INITIAL LOAD
    ============================================================ */

    useEffect(() => {

        fetchEvents();

    }, []);


    /* ============================================================
       SORT EVENTS
    ============================================================ */

    const sortedEvents = useMemo(() => {

        return [...events].sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a?.createdAt || 0
                    ).getTime();

                const dateB =
                    new Date(
                        b?.createdAt || 0
                    ).getTime();


                if (
                    Number.isFinite(dateA) &&
                    Number.isFinite(dateB) &&
                    dateA !== dateB
                ) {

                    return dateB - dateA;

                }


                const idA =
                    Number(
                        a?.id || 0
                    );

                const idB =
                    Number(
                        b?.id || 0
                    );


                return idB - idA;

            }
        );

    }, [events]);


    /* ============================================================
       FILTER EVENTS
    ============================================================ */

    const filteredEvents = useMemo(() => {

        const query =
            search
                .trim()
                .toLowerCase();


        return sortedEvents.filter(
            (event) => {

                const title =
                    String(
                        event?.title || ""
                    ).toLowerCase();


                const venue =
                    String(
                        event?.venue || ""
                    ).toLowerCase();


                const city =
                    String(
                        event?.city || ""
                    ).toLowerCase();


                const hostName =
                    String(
                        event?.hostName ||
                        event?.organizerName ||
                        ""
                    ).toLowerCase();


                const category =
                    String(
                        event?.category || ""
                    ).toLowerCase();


                const matchesSearch =
                    !query ||
                    title.includes(query) ||
                    venue.includes(query) ||
                    city.includes(query) ||
                    hostName.includes(query) ||
                    category.includes(query);


                if (!matchesSearch) {

                    return false;

                }


                const status =
                    String(
                        event?.status || ""
                    ).toLowerCase();


                const isCancelled =
                    status === "cancelled" ||
                    Boolean(
                        event?.cancelled
                    );


                const isFeatured =
                    Boolean(
                        event?.featured
                    );


                const tickets =
                    Array.isArray(
                        event?.tickets
                    )
                        ? event.tickets
                        : [];


                const isFree =
                    String(
                        event?.eventType || ""
                    ).toLowerCase() ===
                        "free" ||

                    (
                        tickets.length > 0 &&
                        tickets.every(
                            (ticket) =>
                                Number(
                                    ticket?.price || 0
                                ) === 0
                        )
                    );


                const isPaid =
                    !isFree;


                if (
                    filter ===
                    "featured"
                ) {

                    return isFeatured;

                }


                if (
                    filter ===
                    "free"
                ) {

                    return isFree;

                }


                if (
                    filter ===
                    "paid"
                ) {

                    return isPaid;

                }


                if (
                    filter ===
                    "cancelled"
                ) {

                    return isCancelled;

                }


                if (
                    filter ===
                    "active"
                ) {

                    return !isCancelled;

                }


                return true;

            }
        );

    }, [
        sortedEvents,
        search,
        filter,
    ]);


    /* ============================================================
       EVENT PRICE
    ============================================================ */

    const getEventPrice = (
        event
    ) => {

        const eventType =
            String(
                event?.eventType || ""
            ).toLowerCase();


        if (
            eventType === "free"
        ) {

            return "Free";

        }


        const tickets =
            Array.isArray(
                event?.tickets
            )
                ? event.tickets
                : [];


        if (
            tickets.length > 0
        ) {

            const prices =
                tickets
                    .map(
                        (ticket) =>
                            Number(
                                ticket?.price || 0
                            )
                    )
                    .filter(
                        (price) =>
                            Number.isFinite(
                                price
                            ) &&
                            price >= 0
                    );


            if (
                prices.length > 0
            ) {

                const minimum =
                    Math.min(
                        ...prices
                    );


                if (
                    minimum === 0
                ) {

                    return "Free";

                }


                return `UGX ${minimum.toLocaleString()}`;

            }

        }


        if (
            event?.price !==
                undefined &&
            event?.price !== null
        ) {

            const price =
                Number(
                    event.price || 0
                );


            if (
                !Number.isFinite(
                    price
                )
            ) {

                return "N/A";

            }


            if (
                price === 0
            ) {

                return "Free";

            }


            return `UGX ${price.toLocaleString()}`;

        }


        return "N/A";

    };


    /* ============================================================
       POSTER URL
    ============================================================ */

    const getPoster = (
        event
    ) => {

        const poster =
            event?.eventPoster ||
            event?.image ||
            event?.poster ||
            "";


        if (!poster) {

            return "";

        }


        const posterUrl =
            String(
                poster
            ).trim();


        if (!posterUrl) {

            return "";

        }


        if (
            posterUrl.startsWith(
                "http://"
            ) ||
            posterUrl.startsWith(
                "https://"
            )
        ) {

            return posterUrl;

        }


        const backend =
            BACKEND_URL.replace(
                /\/+$/,
                ""
            );


        if (
            posterUrl.startsWith("/")
        ) {

            return `${backend}${posterUrl}`;

        }


        return `${backend}/${posterUrl}`;

    };


    /* ============================================================
       EVENT DATE
    ============================================================ */

    const formatEventDate = (
        value
    ) => {

        if (!value) {

            return "N/A";

        }


        const date =
            new Date(value);


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
                year: "numeric",
                month: "short",
                day: "numeric",
            }
        );

    };


    /* ============================================================
       TICKET TOTAL
    ============================================================ */

    const getTicketCapacity = (
        event
    ) => {

        if (
            !Array.isArray(
                event?.tickets
            )
        ) {

            return "N/A";

        }


        const total =
            event.tickets.reduce(
                (
                    sum,
                    ticket
                ) => {

                    const quantity =
                        Number(
                            ticket?.quantity ??
                            ticket?.capacity ??
                            0
                        );


                    return (
                        sum +
                        (
                            Number.isFinite(
                                quantity
                            )
                                ? quantity
                                : 0
                        )
                    );

                },
                0
            );


        return total > 0
            ? total.toLocaleString()
            : "N/A";

    };


    /* ============================================================
       SOLD TICKETS
    ============================================================ */

    const getTicketsSold = (
        event
    ) => {

        const sold =
            Number(
                event?.ticketsSold || 0
            );


        if (
            !Number.isFinite(
                sold
            )
        ) {

            return "0";

        }


        return sold.toLocaleString();

    };


    /* ============================================================
       PUBLIC EVENT SHARE URL
    ============================================================ */

    const getShareUrl = (
        event
    ) => {

        const eventIdentifier =
            event?.slug ||
            event?.eventSlug ||
            event?.event_id ||
            event?.id;


        return `${window.location.origin}/events/${encodeURIComponent(
            eventIdentifier
        )}`;

    };


    /* ============================================================
       COPY EVENT LINK
       
       Fallback for browsers without native sharing.
    ============================================================ */

    const copyEventLink = async (
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

                const textArea =
                    document.createElement(
                        "textarea"
                    );


                textArea.value =
                    eventUrl;


                textArea.style.position =
                    "fixed";

                textArea.style.opacity =
                    "0";


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


    /* ============================================================
       SHARE EVENT
       
       Uses the same native EventWaa sharing behavior
       as EventDetails.jsx.
    ============================================================ */

    const handleShare = async (
        event
    ) => {

        const eventUrl =
            getShareUrl(
                event
            );


        const shareTitle =
            event?.title ||
            "EventWaa Event";


        const shareText =
            `Check out ${shareTitle} on EventWaa!`;


        /*
         * Native device/browser share sheet.
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
                 * User closed the native share
                 * sheet. This is not an error.
                 */

                if (
                    error?.name ===
                    "AbortError"
                ) {

                    return;

                }


                console.error(
                    "NATIVE EVENT SHARE ERROR:",
                    error
                );

            }

        }


        /*
         * Browser fallback.
         */

        await copyEventLink(
            eventUrl
        );

    };


    /* ============================================================
       FEATURE EVENT
    ============================================================ */

    const handleFeature = async (
        event
    ) => {

        const isCancelled =
            String(
                event?.status || ""
            ).toLowerCase() ===
                "cancelled" ||
            Boolean(
                event?.cancelled
            );


        if (
            isCancelled
        ) {

            return;

        }


        try {

            setError("");


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/events/${event.id}/feature`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to update featured status."
                );

            }


            setEvents(
                (currentEvents) =>
                    currentEvents.map(
                        (
                            currentEvent
                        ) =>
                            String(
                                currentEvent?.id
                            ) ===
                            String(
                                event?.id
                            )
                                ? {
                                      ...currentEvent,

                                      featured:
                                          data.featured ??
                                          !Boolean(
                                              currentEvent?.featured
                                          ),
                                  }
                                : currentEvent
                    )
            );

        } catch (err) {

            console.error(
                "FEATURE EVENT ERROR:",
                err
            );


            alert(
                err.message ||
                "Failed to update featured status."
            );

        }

    };


    /* ============================================================
       DELETE EVENT
    ============================================================ */

    const handleDelete = async (
        event
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${event?.title || "this event"}"?\n\nThis action is different from cancellation.`
            );


        if (!confirmed) {

            return;

        }


        try {

            setError("");


            const response =
                await fetch(
                    `${BACKEND_URL}/events/${event.id}`,
                    {
                        method: "DELETE",
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to delete event."
                );

            }


            setEvents(
                (currentEvents) =>
                    currentEvents.filter(
                        (
                            currentEvent
                        ) =>
                            String(
                                currentEvent?.id
                            ) !==
                            String(
                                event?.id
                            )
                    )
            );

        } catch (err) {

            console.error(
                "DELETE EVENT ERROR:",
                err
            );


            alert(
                err.message ||
                "Failed to delete event."
            );

        }

    };


    /* ============================================================
       CANCEL EVENT
    ============================================================ */

    const handleCancel = async (
        event
    ) => {

        const alreadyCancelled =
            String(
                event?.status || ""
            ).toLowerCase() ===
                "cancelled" ||
            Boolean(
                event?.cancelled
            );


        if (
            alreadyCancelled
        ) {

            return;

        }


        if (
            String(
                cancellingId
            ) ===
            String(
                event?.id
            )
        ) {

            return;

        }


        const firstConfirmation =
            window.confirm(
                `Cancel "${event?.title || "this event"}"?\n\nThis will cancel the event, invalidate its tickets/passes, and process eligible refunds.`
            );


        if (!firstConfirmation) {

            return;

        }


        const reasonInput =
            window.prompt(
                "Enter the reason for cancelling this event:",
                "Event cancelled by EventWaa administration."
            );


        if (
            reasonInput ===
            null
        ) {

            return;

        }


        const reason =
            reasonInput.trim();


        if (!reason) {

            alert(
                "A cancellation reason is required."
            );

            return;

        }


        const adminToken =
            localStorage.getItem(
                "eventwaa_admin_token"
            );


        if (!adminToken) {

            alert(
                "Your admin session has expired. Please log in again."
            );


            navigate(
                "/admin/login"
            );


            return;

        }


        try {

            setCancellingId(
                event.id
            );

            setError("");


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/events/${event.id}/cancel`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${adminToken}`,
                        },

                        body:
                            JSON.stringify({
                                cancellationReason:
                                    reason,
                            }),
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.refundError?.message ||
                    "Failed to cancel event."
                );

            }


            setEvents(
                (currentEvents) =>
                    currentEvents.map(
                        (
                            currentEvent
                        ) =>
                            String(
                                currentEvent?.id
                            ) ===
                            String(
                                event?.id
                            )
                                ? {
                                      ...currentEvent,

                                      status:
                                          "cancelled",

                                      cancelled:
                                          true,

                                      cancelledAt:
                                          new Date().toISOString(),

                                      cancelledBy:
                                          "admin",

                                      cancellationReason:
                                          reason,
                                  }
                                : currentEvent
                    )
            );


            alert(
                `Event cancelled successfully.\n\nPaid refunds processed: ${
                    Number(
                        data.processedRefunds ||
                        0
                    )
                }\nFree passes cancelled: ${
                    Number(
                        data.freeBookingsCancelled ||
                        0
                    )
                }`
            );

        } catch (err) {

            console.error(
                "CANCEL EVENT ERROR:",
                err
            );


            alert(
                err.message ||
                "Failed to cancel event."
            );

        } finally {

            setCancellingId(
                null
            );

        }

    };


    /* ============================================================
       LOADING
    ============================================================ */

    if (loading) {

        return (

            <div className="admin-events">

                <div className="admin-events-loading">

                    <div className="admin-events-spinner" />

                    <p>
                        Loading events...
                    </p>

                </div>

            </div>

        );

    }


    /* ============================================================
       PAGE
    ============================================================ */

    return (

        <div className="admin-events">


            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="admin-events-header">

                <div>

                    <h1>
                        Events
                    </h1>

                    <p>
                        Manage all EventWaa
                        events.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-events-create-btn"
                    onClick={() =>
                        navigate(
                            "/admin/events/create"
                        )
                    }
                >

                    + Create Event

                </button>

            </div>


            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (

                <div className="admin-events-error">

                    <FiXCircle />

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* ====================================================
                FILTER BAR
            ==================================================== */}

            <div className="admin-events-toolbar">

                <div className="admin-events-search">

                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                <div className="admin-events-filters">

                    <button
                        type="button"
                        className={
                            filter === "all"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter(
                                "all"
                            )
                        }
                    >
                        All
                    </button>


                    <button
                        type="button"
                        className={
                            filter === "active"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter(
                                "active"
                            )
                        }
                    >
                        Active
                    </button>


                    <button
                        type="button"
                        className={
                            filter === "featured"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter(
                                "featured"
                            )
                        }
                    >
                        Featured
                    </button>


                    <button
                        type="button"
                        className={
                            filter === "free"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter(
                                "free"
                            )
                        }
                    >
                        Free
                    </button>


                    <button
                        type="button"
                        className={
                            filter === "paid"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter(
                                "paid"
                            )
                        }
                    >
                        Paid
                    </button>


                    <button
                        type="button"
                        className={
                            filter === "cancelled"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter(
                                "cancelled"
                            )
                        }
                    >
                        Cancelled
                    </button>

                </div>

            </div>


            {/* ====================================================
                RESULT COUNT
            ==================================================== */}

            <div className="admin-events-count">

                {filteredEvents.length}{" "}

                event
                {filteredEvents.length !== 1
                    ? "s"
                    : ""}

            </div>


            {/* ====================================================
                EMPTY STATE
            ==================================================== */}

            {filteredEvents.length === 0 ? (

                <div className="admin-events-empty">

                    <FiCalendar />

                    <h3>
                        No events found
                    </h3>

                    <p>
                        {search
                            ? "Try a different search."
                            : "There are no events matching this filter."}
                    </p>

                </div>

            ) : (

                <div className="admin-events-grid">

                    {filteredEvents.map(
                        (event) => {

                            const poster =
                                getPoster(
                                    event
                                );


                            const isCancelled =
                                String(
                                    event?.status ||
                                    ""
                                ).toLowerCase() ===
                                    "cancelled" ||
                                Boolean(
                                    event?.cancelled
                                );


                            const isCancelling =
                                String(
                                    cancellingId
                                ) ===
                                String(
                                    event?.id
                                );


                            const hostName =
                                event?.hostName ||
                                event?.organizerName ||
                                "EventWaa";


                            const eventType =
                                String(
                                    event?.eventType ||
                                    ""
                                ).toLowerCase();


                            return (

                                <div
                                    className={
                                        `admin-event-card ${
                                            isCancelled
                                                ? "cancelled"
                                                : ""
                                        }`
                                    }
                                    key={
                                        event?.id
                                    }
                                >


                                    {/* =================================
                                        POSTER
                                    ================================= */}

                                    <div className="admin-poster-wrapper">

                                        {poster ? (

                                            <img
                                                src={
                                                    poster
                                                }
                                                alt={
                                                    event?.title ||
                                                    "Event poster"
                                                }
                                                className="admin-event-poster"
                                                onError={(
                                                    e
                                                ) => {

                                                    e.currentTarget.style.display =
                                                        "none";

                                                }}
                                            />

                                        ) : (

                                            <div className="admin-event-poster-placeholder">

                                                <FiCalendar />

                                            </div>

                                        )}


                                        <div className="event-type-overlay">

                                            {eventType ===
                                            "free"
                                                ? "FREE"
                                                : "PAID"}

                                        </div>


                                        {event?.featured && (

                                            <div className="featured-overlay">

                                                <FiStar />

                                                Featured

                                            </div>

                                        )}


                                        {isCancelled && (

                                            <div className="cancelled-overlay">

                                                CANCELLED

                                            </div>

                                        )}

                                    </div>


                                    {/* =================================
                                        CONTENT
                                    ================================= */}

                                    <div className="admin-event-card-content">


                                        <div className="admin-event-title-row">

                                            <div>

                                                <h2>

                                                    {event?.title ||
                                                        "Untitled Event"}

                                                </h2>

                                                <span className="admin-event-id">

                                                    ID:{" "}

                                                    {event?.id ??
                                                        "N/A"}

                                                </span>

                                            </div>


                                            {event?.adminEvent && (

                                                <span className="admin-official-badge">

                                                    EventWaa

                                                </span>

                                            )}

                                        </div>


                                        <div className="admin-event-details">


                                            <div>

                                                <strong>
                                                    Host
                                                </strong>

                                                <span>
                                                    {hostName}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Venue
                                                </strong>

                                                <span>
                                                    {event?.venue ||
                                                        "N/A"}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    City
                                                </strong>

                                                <span>
                                                    {event?.city ||
                                                        "N/A"}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Date
                                                </strong>

                                                <span>
                                                    {formatEventDate(
                                                        event?.date
                                                    )}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Category
                                                </strong>

                                                <span>
                                                    {event?.category ||
                                                        "N/A"}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Price
                                                </strong>

                                                <span>
                                                    {getEventPrice(
                                                        event
                                                    )}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Tickets
                                                </strong>

                                                <span>
                                                    {getTicketCapacity(
                                                        event
                                                    )}
                                                </span>

                                            </div>


                                            <div>

                                                <strong>
                                                    Sold
                                                </strong>

                                                <span>
                                                    {getTicketsSold(
                                                        event
                                                    )}
                                                </span>

                                            </div>

                                        </div>


                                        {/* =================================
                                            ACTIONS
                                        ================================= */}

                                        <div className="admin-event-actions">


                                            {/* EDIT */}

                                            <button
                                                type="button"
                                                className="edit-btn"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/events/edit/${event.id}`
                                                    )
                                                }
                                            >

                                                <FiEdit />

                                                Edit

                                            </button>


                                            {/* FEATURE */}

                                            <button
                                                type="button"
                                                className={
                                                    event?.featured
                                                        ? "feature-btn featured"
                                                        : "feature-btn"
                                                }
                                                onClick={() =>
                                                    handleFeature(
                                                        event
                                                    )
                                                }
                                                disabled={
                                                    isCancelled
                                                }
                                            >

                                                <FiStar />

                                                {event?.featured
                                                    ? "Featured"
                                                    : "Feature"}

                                            </button>


                                            {/* SHARE */}

                                            <button
                                                type="button"
                                                className="share-btn"
                                                onClick={() =>
                                                    handleShare(
                                                        event
                                                    )
                                                }
                                            >

                                                <FiShare2 />

                                                Share

                                            </button>


                                            {/* CANCEL */}

                                            {!isCancelled ? (

                                                <button
                                                    type="button"
                                                    className="cancel-btn"
                                                    onClick={() =>
                                                        handleCancel(
                                                            event
                                                        )
                                                    }
                                                    disabled={
                                                        isCancelling
                                                    }
                                                >

                                                    <FiXCircle />

                                                    {isCancelling
                                                        ? "Cancelling..."
                                                        : "Cancel"}

                                                </button>

                                            ) : (

                                                <button
                                                    type="button"
                                                    className="cancelled-btn"
                                                    disabled
                                                >

                                                    <FiCheck />

                                                    Cancelled

                                                </button>

                                            )}


                                            {/* DELETE */}

                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() =>
                                                    handleDelete(
                                                        event
                                                    )
                                                }
                                            >

                                                <FiTrash2 />

                                                Delete

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            );

                        }
                    )}

                </div>

            )}

        </div>

    );

}


export default AdminEvents;