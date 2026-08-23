import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import "../styles/TicketScanner.css";
import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";

const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000";

function TicketScanner() {

    const { id } = useParams();

    const navigate =
        useNavigate();

    const location =
        useLocation();


    /* ============================================================
       SCANNER MODE
       ============================================================ */

    const isAdminScanner =
        location.pathname.startsWith(
            "/admin/scan"
        );

    const isHostScanner =
        location.pathname.startsWith(
            "/host/scan"
        );

    const isTeamScanner =
        location.pathname.startsWith(
            "/admin/team-scanner"
        );


    /* ============================================================
       EVENT SELECTION ROUTE
       ============================================================ */

    const eventSelectionPath =
        isTeamScanner
            ? "/admin/team-lookup"
            : isHostScanner
                ? "/host/scan"
                : "/admin/scan";


    /* ============================================================
       SCANNER MODE LABEL
       ============================================================ */

    const scannerMode =
        isTeamScanner
            ? "EVENTWAA TEAM SCANNER"
            : isAdminScanner
                ? "ADMIN SCANNER"
                : "HOST SCANNER";


    /* ============================================================
       EVENT-SPECIFIC STORAGE KEY
       ============================================================ */

    const scannerStatsKey =
        isTeamScanner && id
            ? `eventwaa_team_scanner_stats_${id}`
            : "eventwaa_scanner_stats";


    /* ============================================================
       LOAD SAVED INVALID COUNT
       ============================================================ */

    const getSavedStats = () => {

        try {

            const saved =
                localStorage.getItem(
                    scannerStatsKey
                );

            if (!saved) {

                return {
                    invalid: 0
                };

            }

            const parsed =
                JSON.parse(saved);

            return {

                invalid:
                    Number(
                        parsed?.invalid
                    ) || 0

            };

        } catch (error) {

            console.error(
                "TEAM SCANNER STATS LOAD ERROR:",
                error
            );

            return {
                invalid: 0
            };

        }

    };


    /* ============================================================
       STATE
       ============================================================ */

    const [result, setResult] =
        useState("");

    const [message, setMessage] =
        useState({});

    const [isScanning, setIsScanning] =
        useState(true);

    const [checking, setChecking] =
        useState(false);

    const [stats, setStats] =
        useState({
            totalTickets: 0,
            totalEntriesUsed: 0,
            remainingEntries: 0,
            invalid: 0
        });


    /* ============================================================
       LOAD SAVED INVALID STATS
       ============================================================ */

    useEffect(() => {

        const saved =
            getSavedStats();

        setStats(prev => ({

            ...prev,

            invalid:
                saved.invalid

        }));

    }, [
        id,
        scannerStatsKey
    ]);


    /* ============================================================
       SAVE INVALID STATS
       ============================================================ */

    const saveInvalidStats =
        (invalidCount) => {

            try {

                localStorage.setItem(

                    scannerStatsKey,

                    JSON.stringify({

                        invalid:
                            invalidCount

                    })

                );

            } catch (error) {

                console.error(
                    "TEAM SCANNER STATS SAVE ERROR:",
                    error
                );

            }

        };


    /* ============================================================
       RECORD INVALID SCAN
       ============================================================ */

    const recordInvalidScan = () => {

        setStats(prev => {

            const updatedInvalid =
                Number(
                    prev.invalid || 0
                ) + 1;

            saveInvalidStats(
                updatedInvalid
            );

            return {

                ...prev,

                invalid:
                    updatedInvalid

            };

        });

    };

    /* ============================================================
   CLEAR SCAN STATISTICS
   ============================================================ */

    const clearScanStatistics = () => {

        const confirmed = window.confirm(
            "Clear the invalid scan statistics for this event?"
        );

        if (!confirmed) {
            return;
        }

        const emptyStats = {
            invalid: 0
        };

        try {

            localStorage.setItem(
                scannerStatsKey,
                JSON.stringify(emptyStats)
            );

        } catch (error) {

            console.error(
                "CLEAR SCANNER STATS ERROR:",
                error
            );

        }

        setStats(prev => ({
            ...prev,
            invalid: 0
        }));

    };


    /* ============================================================
       TEAM AUTH TOKEN
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
       LOAD EVENT ATTENDANCE
       ============================================================ */

    const loadAttendance =
        async () => {

            if (!id) {
                return;
            }

            try {

                const paidResponse =
                    await fetch(
                        `${BACKEND_URL}/bookings/event/${id}`
                    );


                const freeResponse =
                    await fetch(
                        `${BACKEND_URL}/attendance/event/${id}`
                    );


                const paidData =
                    await paidResponse.json();


                const freeData =
                    await freeResponse.json();


                const safePaidTickets =
                    Array.isArray(
                        paidData
                    )
                        ? paidData
                        : Array.isArray(
                            paidData?.bookings
                        )
                            ? paidData.bookings
                            : [];


                const safeFreePasses =
                    Array.isArray(
                        freeData
                    )
                        ? freeData
                        : Array.isArray(
                            freeData?.attendance
                        )
                            ? freeData.attendance
                            : [];


                /* =================================================
                   PAID TICKETS
                   ================================================= */

                const paidTicketCount =
                    safePaidTickets.length;


                const paidEntriesUsed =
                    safePaidTickets.reduce(
                        (
                            total,
                            ticket
                        ) => {

                            return (
                                total +
                                Number(
                                    ticket?.checkInCount ||
                                    0
                                )
                            );

                        },
                        0
                    );


                const paidRemainingEntries =
                    safePaidTickets.reduce(
                        (
                            total,
                            ticket
                        ) => {

                            const limit =
                                Number(
                                    ticket?.checkInLimit ||
                                    3
                                );


                            const used =
                                Number(
                                    ticket?.checkInCount ||
                                    0
                                );


                            return (
                                total +
                                Math.max(
                                    limit -
                                    used,
                                    0
                                )
                            );

                        },
                        0
                    );


                /* =================================================
                   FREE PASSES
                   ================================================= */

                const freePassCount =
                    safeFreePasses.length;


                const freeEntriesUsed =
                    safeFreePasses.reduce(
                        (
                            total,
                            pass
                        ) => {

                            return (
                                total +
                                Number(
                                    pass?.checkInCount ||
                                    0
                                )
                            );

                        },
                        0
                    );


                const freeRemainingEntries =
                    safeFreePasses.reduce(
                        (
                            total,
                            pass
                        ) => {

                            const limit =
                                Number(
                                    pass?.checkInLimit ||
                                    3
                                );


                            const used =
                                Number(
                                    pass?.checkInCount ||
                                    0
                                );


                            return (
                                total +
                                Math.max(
                                    limit -
                                    used,
                                    0
                                )
                            );

                        },
                        0
                    );


                /* =================================================
                   TOTALS
                   ================================================= */

                const totalTickets =
                    paidTicketCount +
                    freePassCount;


                const totalEntriesUsed =
                    paidEntriesUsed +
                    freeEntriesUsed;


                const remainingEntries =
                    paidRemainingEntries +
                    freeRemainingEntries;


                /*
                 * IMPORTANT:
                 *
                 * Do NOT overwrite invalid here.
                 *
                 * Invalid is stored separately in
                 * event-specific localStorage.
                 */

                setStats(prev => ({

                    totalTickets,

                    totalEntriesUsed,

                    remainingEntries,

                    invalid:
                        prev.invalid

                }));


            } catch (error) {

                console.error(
                    "ATTENDANCE LOAD ERROR:",
                    error
                );

            }

        };


    /* ============================================================
       LOAD ATTENDANCE WHEN EVENT CHANGES
       ============================================================ */

    useEffect(() => {

        loadAttendance();

    }, [id]);


    /* ============================================================
       REFRESH BACKEND ATTENDANCE
       ============================================================ */

    const refreshAttendance =
        async () => {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        150
                    )
            );

            await loadAttendance();

        };


    /* ============================================================
       RESET SCANNER
       ============================================================ */

    const resetScanner = () => {

        setResult("");

        setMessage({});

        setChecking(false);

        setIsScanning(true);

    };


    /* ============================================================
       CHANGE EVENT
       ============================================================ */

    const changeEvent = () => {

        /*
         * TEAM ALWAYS RETURNS TO TEAM LOOKUP.
         *
         * It must NEVER enter the admin scanner.
         */

        if (isTeamScanner) {

            navigate(
                "/admin/team-lookup"
            );

            return;

        }


        if (isHostScanner) {

            navigate(
                "/host/scan"
            );

            return;

        }


        navigate(
            "/admin/scan"
        );

    };


    /* ============================================================
       VERIFY TICKET / PASS
       ============================================================ */

    const verifyTicket =
        async (code) => {

            if (
                !code ||
                checking
            ) {

                return;

            }


            setResult(code);

            setChecking(true);


            try {

                const headers = {

                    "Content-Type":
                        "application/json",

                    Accept:
                        "application/json"

                };


                /* =================================================
                   TEAM AUTHENTICATION
                   ================================================= */

                if (isTeamScanner) {

                    const teamToken =
                        getTeamToken();


                    if (!teamToken) {

                        setMessage({

                            success:
                                false,

                            text:
                                "Team authentication is missing. Please sign in again."

                        });

                        setIsScanning(
                            false
                        );

                        return;

                    }


                    headers.Authorization =
                        `Bearer ${teamToken}`;

                }


                /* =================================================
                   VERIFY ENTRY
                   ================================================= */

                const response =
                    await fetch(

                        `${BACKEND_URL}/verify-entry/${encodeURIComponent(code)}`,

                        {

                            method:
                                "PUT",

                            headers,

                            body:
                                JSON.stringify({

                                    eventId:
                                        id

                                })

                        }

                    );


                /* =================================================
                   READ RESPONSE
                   ================================================= */

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
                    "VERIFY ENTRY RESPONSE:",
                    response.status,
                    data
                );


                /* =================================================
                   SUCCESS
                   ================================================= */

                if (data.success) {

                    const currentCount =
                        Number(
                            data.checkInCount ||
                            0
                        );


                    const currentLimit =
                        Number(
                            data.checkInLimit ||
                            3
                        );


                    /*
                     * Update immediately for a fast UI response.
                     *
                     * Then refresh from backend below.
                     */

                    setStats(prev => ({

                        ...prev,

                        totalEntriesUsed:
                            prev.totalEntriesUsed +
                            1,

                        remainingEntries:
                            Math.max(
                                prev.remainingEntries -
                                1,
                                0

                            )

                    }));


                    /* =============================================
                       PAID TICKET
                       ============================================= */

                    if (
                        data.type ===
                        "paid"
                    ) {

                        setMessage({

                            success:
                                true,

                            type:
                                "paid",

                            guest: {

                                name:
                                    data.ticket
                                        ?.buyer
                                        ?.name ||
                                    "Unknown",

                                email:
                                    data.ticket
                                        ?.buyer
                                        ?.email ||
                                    "Unknown",

                                event:
                                    data.ticket
                                        ?.eventTitle ||
                                    "Unknown event",

                                passType:
                                    data.ticket
                                        ?.ticketType ||
                                    "Ticket",

                                time:
                                    data.ticket
                                        ?.checkedInAt ||
                                    "",

                                entryNumber:
                                    currentCount,

                                checkInLimit:
                                    currentLimit,

                                remainingEntries:
                                    Math.max(
                                        currentLimit -
                                        currentCount,
                                        0
                                    )

                            }

                        });

                    }


                    /* =============================================
                       FREE PASS
                       ============================================= */

                    else {

                        setMessage({

                            success:
                                true,

                            type:
                                "free",

                            guest: {

                                name:
                                    data.attendee
                                        ?.name ||
                                    "Unknown",

                                email:
                                    data.attendee
                                        ?.email ||
                                    "Unknown",

                                event:
                                    data.attendee
                                        ?.eventTitle ||
                                    "Unknown event",

                                passType:
                                    "Free attendance pass",

                                time:
                                    data.attendee
                                        ?.checkedInAt ||
                                    "",

                                entryNumber:
                                    currentCount,

                                checkInLimit:
                                    currentLimit,

                                remainingEntries:
                                    Math.max(
                                        currentLimit -
                                        currentCount,
                                        0
                                    )

                            }

                        });

                    }


                    setIsScanning(
                        false
                    );


                    /*
                     * BACKEND IS THE SOURCE OF TRUTH.
                     *
                     * Recalculate all ticket/entry values
                     * after the successful scan.
                     */

                    await refreshAttendance();

                }


                /* =================================================
                   INVALID
                   ================================================= */

                else {

                    recordInvalidScan();


                    setMessage({

                        success:
                            false,

                        text:
                            data.message ||
                            "Ticket could not be verified.",

                        entryLimitReached:
                            data.entryLimitReached ||
                            false,

                        checkInCount:
                            data.checkInCount ||
                            0,

                        checkInLimit:
                            data.checkInLimit ||
                            3

                    });


                    setIsScanning(
                        false
                    );

                }


            } catch (error) {

                console.error(
                    "VERIFY ENTRY ERROR:",
                    error
                );


                recordInvalidScan();


                setMessage({

                    success:
                        false,

                    text:
                        error.message ||
                        "Unable to contact the EventWaa server. Please try again."

                });


                setIsScanning(
                    false
                );

            } finally {

                setChecking(
                    false
                );

            }

        };


    /* ============================================================
       RENDER
       ============================================================ */

    return (

        <div className="scanner-page">


            {/* ======================================================
                TOP BAR
            ====================================================== */}

            <div className="scanner-topbar">

                <button
                    className="scanner-back-btn"
                    onClick={
                        changeEvent
                    }
                >
                    ← Change Event
                </button>


                <span className="scanner-mode">
                    {scannerMode}
                </span>

            </div>


            {/* ======================================================
                HEADER
            ====================================================== */}

            <div className="scanner-header">

                <div>

                    <h1>
                        EventWaa Ticket Scanner
                    </h1>

                    <p>
                        Scan attendee QR code
                    </p>

                </div>


                <div className="scanner-camera-icon">
                    📷
                </div>

            </div>


            {/* ======================================================
                STATS
            ====================================================== */}

            <div className="scanner-stats">


                <div className="scanner-stat-card">

                    <span>
                        🎟️
                    </span>

                    <div>

                        <h3>
                            Tickets / Passes
                        </h3>

                        <strong>
                            {stats.totalTickets}
                        </strong>

                    </div>

                </div>

                {/* ======================================================
                    CLEAR SCAN STATISTICS
                ====================================================== */}

                <div className="scanner-stats-controls">

                    <button
                        type="button"
                        className="clear-scan-stats-btn"
                        onClick={clearScanStatistics}
                    >
                        🗑️ Clear scan statistics
                    </button>

                </div>


                <div className="scanner-stat-card">

                    <span>
                        ✅
                    </span>

                    <div>

                        <h3>
                            Entries Used
                        </h3>

                        <strong>
                            {stats.totalEntriesUsed}
                        </strong>

                    </div>

                </div>


                <div className="scanner-stat-card">

                    <span>
                        ⏳
                    </span>

                    <div>

                        <h3>
                            Entries Remaining
                        </h3>

                        <strong>
                            {stats.remainingEntries}
                        </strong>

                    </div>

                </div>


                <div className="scanner-stat-card">

                    <span>
                        ❌
                    </span>

                    <div>

                        <h3>
                            Invalid
                        </h3>

                        <strong>
                            {stats.invalid}
                        </strong>

                    </div>

                </div>


            </div>


            {/* ======================================================
                SCANNER
            ====================================================== */}

            {isScanning && (

                <div className="scanner-section">


                    <div className="scanner-instruction">

                        <h2>
                            Scan Ticket
                        </h2>

                        <p>
                            Place the attendee's QR code
                            inside the scanner.
                        </p>

                    </div>


                    <div className="scanner-box">

                        <Scanner

                            onScan={
                                (codes) => {

                                    if (
                                        !isScanning ||
                                        checking
                                    ) {

                                        return;

                                    }


                                    if (
                                        !codes ||
                                        codes.length === 0
                                    ) {

                                        return;

                                    }


                                    const rawValue =
                                        codes[0]
                                            ?.rawValue;


                                    if (
                                        !rawValue
                                    ) {

                                        return;

                                    }


                                    setIsScanning(
                                        false
                                    );


                                    verifyTicket(
                                        rawValue
                                    );

                                }
                            }


                            onError={
                                (error) =>
                                    console.log(
                                        "QR SCANNER ERROR:",
                                        error
                                    )
                            }

                        />

                    </div>


                    {checking && (

                        <div className="scanner-checking">

                            <div className="checking-spinner"></div>

                            <p>
                                Verifying entry...
                            </p>

                        </div>

                    )}

                </div>

            )}


            {/* ======================================================
                RESULT
            ====================================================== */}

            {result && (

                <div className="scan-result">


                    <div className="scan-result-id">

                        <span>
                            🆔 Pass ID
                        </span>

                        <strong>
                            {result}
                        </strong>

                    </div>


                    {/* =================================================
                        VALID
                    ================================================= */}

                    {message?.success ? (

                        <div className="valid-ticket">


                            <div className="result-success-icon">
                                ✓
                            </div>


                            <h2>
                                VALID{" "}
                                {message.type ===
                                "free"
                                    ? "PASS"
                                    : "TICKET"}
                            </h2>


                            <p>
                                🎟️ Event:{" "}
                                <strong>
                                    {
                                        message.guest.event
                                    }
                                </strong>
                            </p>


                            <p>
                                👤 Guest:{" "}
                                <strong>
                                    {
                                        message.guest.name
                                    }
                                </strong>
                            </p>


                            <p>
                                📧 Email:{" "}
                                <strong>
                                    {
                                        message.guest.email
                                    }
                                </strong>
                            </p>


                            <p>
                                🎫 Type:{" "}
                                <strong>
                                    {
                                        message.guest.passType
                                    }
                                </strong>
                            </p>


                            <p>
                                🔢 Entry:{" "}

                                <strong>

                                    {
                                        message.guest.entryNumber
                                    }

                                    {" / "}

                                    {
                                        message.guest.checkInLimit
                                    }

                                </strong>

                            </p>


                            <p>
                                ⏳ Entries remaining:{" "}

                                <strong>
                                    {
                                        message.guest.remainingEntries
                                    }
                                </strong>

                            </p>


                            <p>
                                ⏰ Time:{" "}

                                <strong>
                                    {
                                        message.guest.time ||
                                        "Just now"
                                    }
                                </strong>

                            </p>


                        </div>

                    ) : (

                        /* =============================================
                           INVALID
                        ============================================= */

                        <div className="invalid-ticket">


                            <div className="result-error-icon">
                                !
                            </div>


                            <h2>
                                Entry Not Accepted
                            </h2>


                            <p>
                                {
                                    message.text
                                }
                            </p>


                            {message.entryLimitReached && (

                                <div className="limit-warning">

                                    This ticket/pass has
                                    already reached its
                                    maximum of 3 entries.

                                </div>

                            )}


                        </div>

                    )}


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="scanner-result-actions">


                        <button
                            className="scan-next-btn"
                            onClick={
                                resetScanner
                            }
                        >
                            🔄 Scan Next
                        </button>


                        <button
                            className="change-event-result-btn"
                            onClick={
                                changeEvent
                            }
                        >
                            ↔️ Change Event
                        </button>


                    </div>


                </div>

            )}

        </div>

    );

}

export default TicketScanner;