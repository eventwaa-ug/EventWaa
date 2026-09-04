import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Search,
    ArrowLeft,
    Ticket,
    User,
    CalendarDays,
    Clock,
    CheckCircle,
    XCircle,
    RotateCcw,
    ShieldCheck,
    AlertTriangle,
    ScanLine,
    CreditCard,
    Receipt,
    Hash,
    Mail,
    RefreshCcw,
} from "lucide-react";

import "./TicketLookup.css";

/* ============================================================
   BACKEND
============================================================ */

const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000";


/* ============================================================
   TICKET LOOKUP
============================================================ */

function TicketLookup() {

    const navigate = useNavigate();
    const location = useLocation();

    /* ========================================================
       PORTAL
    ======================================================== */

    const isAdminTeamLookup =
        location.pathname === "/admin/team-lookup" ||
        location.pathname.startsWith(
            "/admin/team-lookup/"
        );

    const isRegularTeamLookup =
        location.pathname === "/team-lookup" ||
        location.pathname.startsWith(
            "/team-lookup/"
        );

    const isMainAdminLookup =
        !isAdminTeamLookup &&
        !isRegularTeamLookup;


    const portalName =
        isMainAdminLookup
            ? "ADMIN PORTAL"
            : isAdminTeamLookup
                ? "ADMIN TEAM PORTAL"
                : "TEAM PORTAL";


    /* ========================================================
       SEARCH STATE
    ======================================================== */

    const [entryId, setEntryId] =
        useState("");

    const [ticket, setTicket] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    /* ========================================================
       MAIN ADMIN TOKEN
    ======================================================== */

    const getAdminToken = () => {

        return (
            localStorage.getItem(
                "eventwaa_admin_token"
            ) ||
            sessionStorage.getItem(
                "eventwaa_admin_token"
            )
        );

    };


    /* ========================================================
       REGULAR TEAM TOKEN
    ======================================================== */

    const getRegularTeamToken = () => {

        return (
            localStorage.getItem(
                "eventwaa_team_token"
            ) ||
            sessionStorage.getItem(
                "eventwaa_team_token"
            )
        );

    };


    /* ========================================================
       ADMIN TEAM TOKEN
    ======================================================== */

    const getAdminTeamToken = () => {

        return (
            localStorage.getItem(
                "eventwaa_admin_team_token"
            ) ||
            sessionStorage.getItem(
                "eventwaa_admin_team_token"
            )
        );

    };


    /* ========================================================
       AUTH HEADERS
    ======================================================== */

    const getAuthHeaders = () => {

        const headers = {
            Accept:
                "application/json",
        };


        /* ==================================================
           MAIN ADMIN
        ================================================== */

        if (isMainAdminLookup) {

            const adminToken =
                getAdminToken();

            if (adminToken) {

                headers.Authorization =
                    `Bearer ${adminToken}`;

            }

            return headers;

        }


        /* ==================================================
           ADMIN TEAM
        ================================================== */

        if (isAdminTeamLookup) {

            const adminTeamToken =
                getAdminTeamToken();

            if (adminTeamToken) {

                headers.Authorization =
                    `Bearer ${adminTeamToken}`;

            }

            return headers;

        }


        /* ==================================================
           REGULAR TEAM
        ================================================== */

        const regularTeamToken =
            getRegularTeamToken();

        if (regularTeamToken) {

            headers.Authorization =
                `Bearer ${regularTeamToken}`;

        }

        return headers;

    };


    /* ========================================================
       LOOKUP ENDPOINT
    ======================================================== */

    const getLookupEndpoint =
        (cleanId) => {

            /* ==================================================
               MAIN ADMIN
            ================================================== */

            if (isMainAdminLookup) {

                return (
                    `${BACKEND_URL}/ticket-lookup/${encodeURIComponent(
                        cleanId
                    )}`
                );

            }


            /* ==================================================
               ADMIN TEAM + REGULAR TEAM
            ================================================== */

            return (
                `${BACKEND_URL}/team/ticket-lookup/${encodeURIComponent(
                    cleanId
                )}`
            );

        };


    /* ========================================================
       LOOKUP
    ======================================================== */

    const handleLookup =
        async (event) => {

            event.preventDefault();

            setError("");
            setTicket(null);

            const cleanId =
                entryId.trim();

            if (!cleanId) {

                setError(
                    "Please enter a ticket or pass ID."
                );

                return;

            }


            /* ==================================================
               AUTH CHECK
            ================================================== */

            if (isMainAdminLookup) {

                const adminToken =
                    getAdminToken();

                if (!adminToken) {

                    console.warn(
                        "No EventWaa admin token found."
                    );

                }

            } else if (isAdminTeamLookup) {

                const adminTeamToken =
                    getAdminTeamToken();

                if (!adminTeamToken) {

                    setError(
                        "Admin Team authentication is missing. Please sign in again."
                    );

                    return;

                }

            } else {

                const regularTeamToken =
                    getRegularTeamToken();

                if (!regularTeamToken) {

                    setError(
                        "Team authentication is missing. Please sign in again."
                    );

                    return;

                }

            }


            try {

                setLoading(true);

                const response =
                    await fetch(
                        getLookupEndpoint(
                            cleanId
                        ),
                        {
                            method:
                                "GET",

                            headers:
                                getAuthHeaders(),
                        }
                    );


                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                let data = {};


                if (
                    contentType
                        .toLowerCase()
                        .includes(
                            "application/json"
                        )
                ) {

                    data =
                        await response.json();

                } else {

                    const text =
                        await response.text();

                    throw new Error(
                        text ||
                        `Server returned HTTP ${response.status}.`
                    );

                }


                console.log(
                    "EVENTWAA TICKET LOOKUP:",
                    response.status,
                    data
                );


                /* ==================================================
                   AUTH ERROR
                ================================================== */

                if (
                    response.status ===
                    401
                ) {

                    setError(
                        isMainAdminLookup
                            ? "Admin authentication is required. Please sign in again."
                            : isAdminTeamLookup
                                ? "Admin Team authentication has expired. Please sign in again."
                                : "Team authentication has expired. Please sign in again."
                    );

                    return;

                }


                /* ==================================================
                   FORBIDDEN
                ================================================== */

                if (
                    response.status ===
                    403
                ) {

                    setError(
                        data.message ||
                        "You are not authorized to look up this ticket."
                    );

                    return;

                }


                /* ==================================================
                   NOT FOUND / ERROR
                ================================================== */

                if (
                    !response.ok ||
                    !data.success
                ) {

                    setError(
                        data.message ||
                        "Ticket or pass could not be found."
                    );

                    return;

                }


                /* ==================================================
                   SUCCESS
                ================================================== */

                setTicket(data);

            } catch (lookupError) {

                console.error(
                    "TICKET LOOKUP ERROR:",
                    lookupError
                );

                setError(
                    lookupError.message ||
                    "Unable to connect to the EventWaa server."
                );

            } finally {

                setLoading(false);

            }

        };


    /* ========================================================
       CLEAR
    ======================================================== */

    const clearLookup = () => {

        setEntryId("");
        setTicket(null);
        setError("");

    };


    /* ========================================================
       BACK
    ======================================================== */

    const goBack = () => {

        /* ==================================================
           ADMIN TEAM
        ================================================== */

        if (isAdminTeamLookup) {

            navigate(
                "/admin/team-dashboard"
            );

            return;

        }


        /* ==================================================
           REGULAR TEAM
        ================================================== */

        if (isRegularTeamLookup) {

            navigate(
                "/team-dashboard"
            );

            return;

        }


        /* ==================================================
           MAIN ADMIN
        ================================================== */

        navigate(
            "/admin"
        );

    };


    /* ========================================================
       FORMAT DATE
    ======================================================== */

    const formatDateTime =
        (value) => {

            if (!value) {

                return "Not available";

            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return String(value);

            }

            return date.toLocaleString(
                undefined,
                {
                    dateStyle:
                        "medium",
                    timeStyle:
                        "short",
                }
            );

        };


    /* ========================================================
       SAFE DATA
    ======================================================== */

    const ticketData =
        ticket?.ticket || {};

    const buyer =
        ticketData?.buyer || {};

    const eventInformation =
        ticket?.event || {};


    /* ========================================================
       BASIC INFORMATION
    ======================================================== */

    const entryType =
        ticket?.type === "free"
            ? "FREE ATTENDANCE PASS"
            : "PAID TICKET";


    const entryBadge =
        ticket?.type === "free"
            ? "FREE PASS"
            : "PAID TICKET";


    const isValid =
        ticket?.valid === true;


    const isRefunded =
        String(
            ticketData?.refundStatus ||
            ""
        ).toLowerCase() ===
        "refunded";


    const checkedIn =
        ticketData?.checkedIn === true;


    const isAlreadyUsed =
        String(
            ticket?.status ||
            ""
        ).toLowerCase() ===
        "already used";


    /* ========================================================
       EVENT ID
    ======================================================== */

    const eventId =
        ticketData?.eventId ||
        eventInformation?.eventId ||
        eventInformation?.id;


    /* ========================================================
       STATUS
    ======================================================== */

    let statusLabel =
        ticket?.status ||
        "Valid";


    if (isRefunded) {

        statusLabel =
            "Refunded";

    } else if (checkedIn) {

        statusLabel =
            "Used";

    } else if (isValid) {

        statusLabel =
            "Valid";

    }


    /* ========================================================
       PAYMENT DATA
       Supports multiple existing field names.
    ======================================================== */

    const amount =
        ticketData?.totalPrice ??
        ticketData?.amount ??
        ticketData?.paidAmount ??
        ticket?.amount ??
        null;


    const currency =
        ticketData?.currency ||
        ticket?.currency ||
        "UGX";


    const transactionId =
        ticketData?.transactionId ||
        ticketData?.transaction_id ||
        "";


    const txRef =
        ticketData?.txRef ||
        ticketData?.tx_ref ||
        ticket?.txRef ||
        ticket?.tx_ref ||
        "";


    const paymentStatus =
        ticketData?.paymentStatus ||
        ticketData?.payment_status ||
        ticket?.paymentStatus ||
        ticket?.payment_status ||
        (
            ticket?.type === "free"
                ? "Free"
                : "Paid"
        );


    /* ========================================================
       TICKET ID
    ======================================================== */

    const displayTicketId =
        ticket?.entryId ||
        ticketData?.ticketId ||
        entryId;


    /* ========================================================
       EVENT TITLE
    ======================================================== */

    const eventTitle =
        ticketData?.eventTitle ||
        eventInformation?.eventTitle ||
        eventInformation?.title ||
        eventInformation?.name ||
        "Not available";


    /* ========================================================
       TICKET TYPE
    ======================================================== */

    const ticketType =
        ticketData?.ticketType ||
        ticketData?.type ||
        (
            ticket?.type === "free"
                ? "Free Attendance"
                : "Ticket"
        );


    /* ========================================================
       HOST
    ======================================================== */

    const hostName =
        ticketData?.hostName ||
        eventInformation?.hostName ||
        eventInformation?.organizerName ||
        "Not available";


    /* ========================================================
       LOCATION
    ======================================================== */

    const eventLocation =
        eventInformation?.location ||
        eventInformation?.venue ||
        ticketData?.location ||
        "Not available";


    /* ========================================================
       OPEN SCANNER
    ======================================================== */

    const openScanner = () => {

        if (!eventId) {

            setError(
                "This ticket does not contain an event ID, so the scanner cannot be opened for this event."
            );

            return;

        }


        /* ==================================================
           MAIN ADMIN
        ================================================== */

        if (isMainAdminLookup) {

            navigate(
                `/admin/scan/${encodeURIComponent(
                    eventId
                )}`
            );

            return;

        }


        /* ==================================================
           ADMIN TEAM
        ================================================== */

        if (isAdminTeamLookup) {

            navigate(
                `/admin/team-scanner/${encodeURIComponent(
                    eventId
                )}`
            );

            return;

        }


        /* ==================================================
           REGULAR TEAM
        ================================================== */

        navigate(
            `/team-scanner/${encodeURIComponent(
                eventId
            )}`
        );

    };


    /* ========================================================
       RENDER
    ======================================================== */

    return (

        <div className="ticket-lookup-page">

            {/* ==================================================
                TOP BAR
            ================================================== */}

            <header className="ticket-lookup-topbar">

                <button
                    type="button"
                    className="ticket-lookup-back-btn"
                    onClick={goBack}
                >
                    <ArrowLeft size={19} />

                    <span>
                        {isMainAdminLookup
                            ? "Admin Dashboard"
                            : isAdminTeamLookup
                                ? "Admin Team Dashboard"
                                : "Team Dashboard"}
                    </span>
                </button>


                <div className="ticket-lookup-topbar-title">

                    <ShieldCheck size={19} />

                    <span>
                        {portalName}
                    </span>

                </div>

            </header>


            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <section className="ticket-lookup-header">

                <div className="ticket-lookup-header-icon">

                    <Ticket size={30} />

                </div>

                <div>

                    <p className="ticket-lookup-eyebrow">
                        {isMainAdminLookup
                            ? "TICKET MANAGEMENT"
                            : isAdminTeamLookup
                                ? "ADMIN TEAM TICKET LOOKUP"
                                : "TEAM TICKET LOOKUP"}
                    </p>

                    <h1>
                        Ticket Management
                    </h1>

                    <p>
                        Search and review EventWaa
                        tickets and attendance passes.
                    </p>

                </div>

            </section>


            {/* ==================================================
                SEARCH CARD
            ================================================== */}

            <section className="ticket-lookup-search-card">

                <div className="ticket-lookup-search-heading">

                    <div>

                        <h2>
                            Find a Ticket or Pass
                        </h2>

                        <p>
                            Enter the Ticket ID or Pass ID
                            shown on the attendee's ticket.
                        </p>

                    </div>

                    <Search
                        size={28}
                        className="ticket-lookup-search-icon"
                    />

                </div>


                <form
                    onSubmit={handleLookup}
                    className="ticket-lookup-form"
                >

                    <div className="ticket-lookup-input-wrapper">

                        <Search size={21} />

                        <input
                            type="text"
                            value={entryId}
                            onChange={(event) =>
                                setEntryId(
                                    event.target.value
                                )
                            }
                            placeholder="e.g. EW-123456 or FREE-123456"
                            autoComplete="off"
                            disabled={loading}
                            spellCheck="false"
                        />

                    </div>


                    <button
                        type="submit"
                        className="ticket-lookup-search-btn"
                        disabled={loading}
                    >

                        {loading ? (
                            <RefreshCcw
                                size={19}
                                className="ticket-lookup-spin"
                            />
                        ) : (
                            <Search size={19} />
                        )}

                        {loading
                            ? "Searching..."
                            : "Search Ticket"}

                    </button>


                    {(ticket || error) && (

                        <button
                            type="button"
                            className="ticket-lookup-clear-btn"
                            onClick={clearLookup}
                            disabled={loading}
                        >
                            Clear
                        </button>

                    )}

                </form>


                {/* ERROR */}

                {error && (

                    <div
                        className="ticket-lookup-error"
                        role="alert"
                    >

                        <XCircle size={20} />

                        <span>
                            {error}
                        </span>

                    </div>

                )}

            </section>


            {/* ==================================================
                RESULT
            ================================================== */}

            {ticket && (

                <section className="ticket-lookup-result">

                    {/* ==================================================
                        STATUS
                    ================================================== */}

                    <div
                        className={
                            `ticket-lookup-status ${
                                isValid &&
                                !isRefunded &&
                                !checkedIn
                                    ? "is-valid"
                                    : "is-invalid"
                            }`
                        }
                    >

                        <div className="ticket-lookup-status-icon">

                            {isValid &&
                            !isRefunded &&
                            !checkedIn ? (

                                <CheckCircle size={30} />

                            ) : (

                                <XCircle size={30} />

                            )}

                        </div>


                        <div>

                            <span>
                                {entryType}
                            </span>

                            <h2>
                                {statusLabel}
                            </h2>

                        </div>

                    </div>


                    {/* ==================================================
                        ID
                    ================================================== */}

                    <div className="ticket-lookup-id-card">

                        <div>

                            <span>
                                Ticket / Pass ID
                            </span>

                            <strong>
                                {displayTicketId}
                            </strong>

                        </div>


                        <div className="ticket-lookup-id-badge">

                            <Ticket size={15} />

                            {entryBadge}

                        </div>

                    </div>


                    {/* ==================================================
                        MAIN INFORMATION
                    ================================================== */}

                    <div className="ticket-lookup-grid">

                        {/* =================================================
                            GUEST
                        ================================================= */}

                        <div className="ticket-lookup-info-card">

                            <div className="ticket-lookup-info-card-header">

                                <div className="ticket-lookup-card-icon">
                                    <User size={20} />
                                </div>

                                <h3>
                                    Guest Information
                                </h3>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Name
                                </span>

                                <strong>
                                    {buyer.name ||
                                        "Not available"}
                                </strong>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Email
                                </span>

                                <strong className="ticket-lookup-email">

                                    {buyer.email ||
                                        "Not available"}

                                </strong>

                            </div>

                        </div>


                        {/* =================================================
                            EVENT
                        ================================================= */}

                        <div className="ticket-lookup-info-card">

                            <div className="ticket-lookup-info-card-header">

                                <div className="ticket-lookup-card-icon">
                                    <CalendarDays size={20} />
                                </div>

                                <h3>
                                    Event Information
                                </h3>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Event
                                </span>

                                <strong>
                                    {eventTitle}
                                </strong>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Organizer
                                </span>

                                <strong>
                                    {hostName}
                                </strong>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Location
                                </span>

                                <strong>
                                    {eventLocation}
                                </strong>

                            </div>


                            {eventId && (

                                <div className="ticket-lookup-info-row">

                                    <span>
                                        Event ID
                                    </span>

                                    <strong>
                                        {eventId}
                                    </strong>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            TICKET
                        ================================================= */}

                        <div className="ticket-lookup-info-card">

                            <div className="ticket-lookup-info-card-header">

                                <div className="ticket-lookup-card-icon">
                                    <Ticket size={20} />
                                </div>

                                <h3>
                                    Ticket Information
                                </h3>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Ticket Type
                                </span>

                                <strong>
                                    {ticketType}
                                </strong>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {statusLabel}
                                </strong>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Check-in
                                </span>

                                <strong>
                                    {checkedIn
                                        ? "Checked In"
                                        : "Not Checked In"}
                                </strong>

                            </div>

                        </div>


                        {/* =================================================
                            PAYMENT
                        ================================================= */}

                        <div className="ticket-lookup-info-card">

                            <div className="ticket-lookup-info-card-header">

                                <div className="ticket-lookup-card-icon">
                                    <CreditCard size={20} />
                                </div>

                                <h3>
                                    Payment Information
                                </h3>

                            </div>


                            <div className="ticket-lookup-info-row">

                                <span>
                                    Payment Status
                                </span>

                                <strong>
                                    {paymentStatus}
                                </strong>

                            </div>


                            {amount !== null && (

                                <div className="ticket-lookup-info-row">

                                    <span>
                                        Amount
                                    </span>

                                    <strong>
                                        {amount}{" "}
                                        {currency}
                                    </strong>

                                </div>

                            )}


                            {transactionId && (

                                <div className="ticket-lookup-info-row">

                                    <span>
                                        Transaction ID
                                    </span>

                                    <strong className="ticket-lookup-long-value">
                                        {transactionId}
                                    </strong>

                                </div>

                            )}


                            {txRef && (

                                <div className="ticket-lookup-info-row">

                                    <span>
                                        Transaction Ref
                                    </span>

                                    <strong className="ticket-lookup-long-value">
                                        {txRef}
                                    </strong>

                                </div>

                            )}

                        </div>

                    </div>


                    {/* ==================================================
                        ENTRY STATUS
                    ================================================== */}

                    <div className="ticket-lookup-entry-card">

                        <div className="ticket-lookup-entry-header">

                            <div>

                                <h3>
                                    Entry Status
                                </h3>

                                <p>
                                    Ticket lookup is read-only.
                                    Searching a ticket does not
                                    check the guest in.
                                </p>

                            </div>

                            <Clock size={27} />

                        </div>


                        <div className="ticket-lookup-entry-stats">

                            <div className="ticket-lookup-entry-stat">

                                <span>
                                    Entry
                                </span>

                                <strong>
                                    {checkedIn
                                        ? "Used"
                                        : "Unused"}
                                </strong>

                            </div>


                            <div className="ticket-lookup-entry-stat">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {isRefunded
                                        ? "Refunded"
                                        : checkedIn ||
                                          isAlreadyUsed
                                            ? "Used"
                                            : "Valid"}
                                </strong>

                            </div>


                            <div className="ticket-lookup-entry-stat">

                                <span>
                                    Check-in
                                </span>

                                <strong>
                                    {checkedIn
                                        ? "Complete"
                                        : "Pending"}
                                </strong>

                            </div>

                        </div>


                        <div className="ticket-lookup-progress">

                            <div className="ticket-lookup-progress-label">

                                <span>
                                    Ticket usage
                                </span>

                                <strong>
                                    {checkedIn
                                        ? "1 / 1"
                                        : "0 / 1"}
                                </strong>

                            </div>


                            <div className="ticket-lookup-progress-track">

                                <div
                                    className="ticket-lookup-progress-fill"
                                    style={{
                                        width:
                                            checkedIn
                                                ? "100%"
                                                : "0%",
                                    }}
                                />

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        REFUND
                    ================================================== */}

                    {isRefunded && (

                        <div className="ticket-lookup-warning refunded">

                            <RotateCcw size={21} />

                            <div>

                                <strong>
                                    Ticket refunded
                                </strong>

                                <p>
                                    This ticket has been refunded
                                    and cannot be accepted for entry.
                                </p>

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        ALREADY USED
                    ================================================== */}

                    {checkedIn &&
                    !isRefunded && (

                        <div className="ticket-lookup-warning limit">

                            <AlertTriangle size={21} />

                            <div>

                                <strong>
                                    Ticket already used
                                </strong>

                                <p>
                                    This individual ticket has
                                    already been checked in and
                                    cannot be used for another entry.
                                </p>

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        LAST CHECK-IN
                    ================================================== */}

                    <div className="ticket-lookup-last-checkin">

                        <div className="ticket-lookup-card-icon">
                            <Clock size={20} />
                        </div>

                        <div>

                            <span>
                                Check-in Time
                            </span>

                            <strong>
                                {formatDateTime(
                                    ticketData.checkedInAt
                                )}
                            </strong>

                        </div>

                    </div>


                    {/* ==================================================
                        VERIFICATION
                    ================================================== */}

                    <div className="ticket-lookup-history-card">

                        <div className="ticket-lookup-history-header">

                            <div>

                                <h3>
                                    Ticket Verification
                                </h3>

                                <p>
                                    Current status of this individual
                                    ticket or attendance pass.
                                </p>

                            </div>

                            <ShieldCheck size={23} />

                        </div>


                        <div className="ticket-lookup-no-history">

                            {isRefunded ? (

                                <>
                                    <RotateCcw size={22} />

                                    <span>
                                        Ticket was refunded and
                                        is no longer valid.
                                    </span>
                                </>

                            ) : checkedIn ? (

                                <>
                                    <AlertTriangle size={22} />

                                    <span>
                                        Ticket has already been used.
                                    </span>
                                </>

                            ) : isValid ? (

                                <>
                                    <CheckCircle size={22} />

                                    <span>
                                        Ticket is valid and has not
                                        been used.
                                    </span>
                                </>

                            ) : (

                                <>
                                    <AlertTriangle size={22} />

                                    <span>
                                        Ticket is not currently valid.
                                    </span>

                                </>
                            )}

                        </div>

                    </div>


                    {/* ==================================================
                        ADMIN DETAILS
                    ================================================== */}

                    {isMainAdminLookup && (

                        <div className="ticket-lookup-admin-details">

                            <div className="ticket-lookup-admin-detail">

                                <Hash size={18} />

                                <div>

                                    <span>
                                        Ticket ID
                                    </span>

                                    <strong>
                                        {displayTicketId}
                                    </strong>

                                </div>

                            </div>


                            <div className="ticket-lookup-admin-detail">

                                <Mail size={18} />

                                <div>

                                    <span>
                                        Guest Email
                                    </span>

                                    <strong>
                                        {buyer.email ||
                                            "Not available"}
                                    </strong>

                                </div>

                            </div>


                            <div className="ticket-lookup-admin-detail">

                                <Receipt size={18} />

                                <div>

                                    <span>
                                        Payment
                                    </span>

                                    <strong>
                                        {paymentStatus}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        ACTIONS
                    ================================================== */}

                    <div className="ticket-lookup-actions">

                        <button
                            type="button"
                            className="ticket-lookup-scan-btn"
                            onClick={openScanner}
                            disabled={!eventId}
                        >

                            <ScanLine size={19} />

                            Open Scanner

                        </button>


                        <button
                            type="button"
                            className="ticket-lookup-new-btn"
                            onClick={clearLookup}
                        >

                            <Search size={18} />

                            Search Another Ticket

                        </button>

                    </div>

                </section>

            )}

        </div>

    );

}


export default TicketLookup;