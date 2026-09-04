import {
    useEffect,
    useState,
    useCallback,
    useRef
} from "react";
import {
    FiArrowLeft,
    FiCamera,
    FiCheckCircle,
    FiXCircle,
    FiRefreshCw,
    FiArrowRight,
    FiTrash2,
    FiCheck,
    FiClock
} from "react-icons/fi";
import {
    MdConfirmationNumber
} from "react-icons/md";
import {
    Scanner
} from "@yudiel/react-qr-scanner";
import "../styles/TicketScanner.css";
import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";
/* ============================================================
   BACKEND
============================================================ */
const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000";
/* ============================================================
   TICKET SCANNER
============================================================ */
function TicketScanner() {
    const {
        id
    } = useParams();
    const navigate =
        useNavigate();
    const location =
        useLocation();
    /* ============================================================
       SCANNER ROUTE TYPES
       REGULAR TEAM:
           /team-scanner/:id
       ADMIN TEAM:
           /admin/team-scanner/:id
       HOST:
           /scanner/:id
           /host/scan/:id
       ADMIN:
           /admin/scan/:id
    ============================================================ */
    const isAdminTeamScanner =
        location.pathname.startsWith(
            "/admin/team-scanner/"
        );
    const isRegularTeamScanner =
        location.pathname.startsWith(
            "/team-scanner/"
        );
    const isAnyTeamScanner =
        isAdminTeamScanner ||
        isRegularTeamScanner;
    const isAdminScanner =
        location.pathname.startsWith(
            "/admin/scan"
        );
    const isHostScanner =
        location.pathname.startsWith(
            "/scanner/"
        ) ||
        location.pathname.startsWith(
            "/host/scan"
        );
    /* ============================================================
       EVENT SELECTION ROUTE
       ADMIN TEAM → ADMIN TEAM DASHBOARD
       REGULAR TEAM → REGULAR TEAM DASHBOARD
       HOST → HOST DASHBOARD
       ADMIN → ADMIN SCANNER
    ============================================================ */
    const eventSelectionPath =
        isAdminTeamScanner
            ? "/admin/team-dashboard"
            : isRegularTeamScanner
                ? "/team-dashboard"
                : isHostScanner
                    ? "/dashboard"
                    : isAdminScanner
                        ? "/admin/scan"
                        : "/admin/scan";
    /* ============================================================
       SCANNER MODE LABEL
    ============================================================ */
    const scannerMode =
        isAdminTeamScanner
            ? "EVENTWAA ADMIN TEAM SCANNER"
            : isRegularTeamScanner
                ? "EVENTWAA TEAM SCANNER"
                : isAdminScanner
                    ? "ADMIN SCANNER"
                    : "HOST SCANNER";
    /* ============================================================
       EVENT-SPECIFIC SCANNER STATISTICS KEY
       ADMIN TEAM:
           eventwaa_admin_team_scanner_stats_ID
       REGULAR TEAM:
           eventwaa_team_scanner_stats_ID
       HOST:
           eventwaa_host_scanner_stats_ID
       ADMIN:
           eventwaa_admin_scanner_stats_ID
    ============================================================ */
    const scannerStatsKey =
        isAdminTeamScanner && id
            ? `eventwaa_admin_team_scanner_stats_${id}`
            : isRegularTeamScanner && id
                ? `eventwaa_team_scanner_stats_${id}`
                : isHostScanner && id
                    ? `eventwaa_host_scanner_stats_${id}`
                    : isAdminScanner && id
                        ? `eventwaa_admin_scanner_stats_${id}`
                        : "eventwaa_scanner_stats";
    /* ============================================================
       SCAN LOCK
       ONLY verifyTicket() controls this lock.
    ============================================================ */
    const scanLockRef =
        useRef(false);
    /* ============================================================
       STATE
    ============================================================ */
    const [
        result,
        setResult
    ] = useState("");
    const [
        message,
        setMessage
    ] = useState({});
    const [
        isScanning,
        setIsScanning
    ] = useState(true);
    const [
        checking,
        setChecking
    ] = useState(false);
    const [
        stats,
        setStats
    ] = useState({
        totalTickets: 0,
        totalEntriesUsed: 0,
        remainingEntries: 0,
        invalid: 0
    });
    /* ============================================================
       LOAD SAVED INVALID STATS
    ============================================================ */
    const getSavedStats =
        useCallback(
            () => {
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
                        JSON.parse(
                            saved
                        );
                    return {
                        invalid:
                            Number(
                                parsed?.invalid
                            ) || 0
                    };
                } catch (error) {
                    console.error(
                        "SCANNER STATS LOAD ERROR:",
                        error
                    );
                    return {
                        invalid: 0
                    };
                }
            },
            [
                scannerStatsKey
            ]
        );
    /* ============================================================
       SAVE INVALID STATS
    ============================================================ */
    const saveInvalidStats =
        useCallback(
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
                        "SCANNER STATS SAVE ERROR:",
                        error
                    );
                }
            },
            [
                scannerStatsKey
            ]
        );
    /* ============================================================
       LOAD SAVED INVALID STAT
    ============================================================ */
    useEffect(() => {
        const saved =
            getSavedStats();
        setStats(
            previous => ({
                ...previous,
                invalid:
                    saved.invalid
            })
        );
    }, [
        getSavedStats
    ]);
    /* ============================================================
       RECORD INVALID SCAN
    ============================================================ */
    const recordInvalidScan =
        useCallback(
            () => {
                setStats(
                    previous => {
                        const updatedInvalid =
                            Number(
                                previous.invalid ||
                                0
                            ) + 1;
                        saveInvalidStats(
                            updatedInvalid
                        );
                        return {
                            ...previous,
                            invalid:
                                updatedInvalid
                        };
                    }
                );
            },
            [
                saveInvalidStats
            ]
        );
    /* ============================================================
       CLEAR INVALID STATISTICS
    ============================================================ */
    const clearScanStatistics =
        () => {
            const confirmed =
                window.confirm(
                    "Clear the invalid scan statistics for this event?"
                );
            if (!confirmed) {
                return;
            }
            try {
                localStorage.setItem(
                    scannerStatsKey,
                    JSON.stringify({
                        invalid: 0
                    })
                );
            } catch (error) {
                console.error(
                    "CLEAR SCANNER STATS ERROR:",
                    error
                );
            }
            setStats(
                previous => ({
                    ...previous,
                    invalid: 0
                })
            );
        };
    /* ============================================================
       TEAM AUTH TOKEN
       ADMIN TEAM:
           eventwaa_admin_team_token
       REGULAR TEAM:
           eventwaa_team_token
    ============================================================ */
    const getTeamToken =
        () => {
            if (isAdminTeamScanner) {
                return (
                    localStorage.getItem(
                        "eventwaa_admin_team_token"
                    ) ||
                    sessionStorage.getItem(
                        "eventwaa_admin_team_token"
                    )
                );
            }
            if (isRegularTeamScanner) {
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
       LOAD EVENT ATTENDANCE
    ============================================================ */
    const loadAttendance =
        useCallback(
            async () => {
                if (!id) {
                    return;
                }
                try {
                    /* =================================================
                       PAID BOOKINGS
                    ================================================= */
                    const paidResponse =
                        await fetch(
                            `${BACKEND_URL}/bookings/event/${id}`
                        );
                    /* =================================================
                       FREE ATTENDANCE
                    ================================================= */
                    const freeResponse =
                        await fetch(
                            `${BACKEND_URL}/attendance/event/${id}`
                        );
                    if (
                        !paidResponse.ok &&
                        !freeResponse.ok
                    ) {
                        throw new Error(
                            "Unable to load event attendance."
                        );
                    }
                    let paidData = {};
                    let freeData = {};
                    try {
                        paidData =
                            await paidResponse.json();
                    } catch {
                        paidData = {};
                    }
                    try {
                        freeData =
                            await freeResponse.json();
                    } catch {
                        freeData = {};
                    }
                    /* =================================================
                       SAFE PAID BOOKINGS
                    ================================================= */
                    const safePaidBookings =
                        Array.isArray(
                            paidData
                        )
                            ? paidData
                            : Array.isArray(
                                paidData?.bookings
                            )
                                ? paidData.bookings
                                : [];
                    /* =================================================
                       CONVERT BOOKINGS TO INDIVIDUAL TICKETS
                    ================================================= */
                    const paidTickets =
                        safePaidBookings.flatMap(
                            booking => {
                                if (
                                    Array.isArray(
                                        booking?.tickets
                                    )
                                ) {
                                    return booking.tickets.map(
                                        ticket => ({
                                            ...ticket,
                                            eventId:
                                                ticket?.eventId ??
                                                booking?.eventId,
                                            eventTitle:
                                                ticket?.eventTitle ??
                                                booking?.eventTitle,
                                            buyer:
                                                ticket?.buyer ??
                                                booking?.buyer
                                        })
                                    );
                                }
                                return [];
                            }
                        );
                    /* =================================================
                       SAFE FREE PASSES
                    ================================================= */
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
                       PAID TOTALS
                    ================================================= */
                    const paidTicketCount =
                        paidTickets.length;
                    const paidEntriesUsed =
                        paidTickets.reduce(
                            (
                                total,
                                ticket
                            ) => {
                                return (
                                    total +
                                    (
                                        ticket?.checkedIn
                                            ? 1
                                            : 0
                                    )
                                );
                            },
                            0
                        );
                    const paidRemainingEntries =
                        paidTickets.reduce(
                            (
                                total,
                                ticket
                            ) => {
                                return (
                                    total +
                                    (
                                        ticket?.checkedIn
                                            ? 0
                                            : 1
                                    )
                                );
                            },
                            0
                        );
                    /* =================================================
                       FREE TOTALS
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
                                    (
                                        pass?.checkedIn
                                            ? 1
                                            : 0
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
                                return (
                                    total +
                                    (
                                        pass?.checkedIn
                                            ? 0
                                            : 1
                                    )
                                );
                            },
                            0
                        );
                    /* =================================================
                       FINAL TOTALS
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
                    setStats(
                        previous => ({
                            totalTickets,
                            totalEntriesUsed,
                            remainingEntries,
                            invalid:
                                previous.invalid
                        })
                    );
                } catch (error) {
                    console.error(
                        "ATTENDANCE LOAD ERROR:",
                        error
                    );
                }
            },
            [
                id
            ]
        );
    /* ============================================================
       LOAD ATTENDANCE WHEN EVENT CHANGES
    ============================================================ */
    useEffect(() => {
        loadAttendance();
    }, [
        loadAttendance
    ]);
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
    const resetScanner =
        () => {
            scanLockRef.current =
                false;
            setResult("");
            setMessage({});
            setChecking(false);
            setIsScanning(true);
        };
    /* ============================================================
       CHANGE EVENT
       ADMIN TEAM:
           /admin/team-dashboard
       REGULAR TEAM:
           /team-dashboard
       HOST:
           /dashboard
       ADMIN:
           /admin/scan
    ============================================================ */
    const changeEvent =
        () => {
            scanLockRef.current =
                false;
            /* =================================================
               ADMIN TEAM
            ================================================= */
            if (isAdminTeamScanner) {
                navigate(
                    "/admin/team-dashboard",
                    {
                        replace: true
                    }
                );
                return;
            }
            /* =================================================
               REGULAR TEAM
            ================================================= */
            if (isRegularTeamScanner) {
                navigate(
                    "/team-dashboard",
                    {
                        replace: true
                    }
                );
                return;
            }
            /* =================================================
               HOST
            ================================================= */
            if (isHostScanner) {
                navigate(
                    "/dashboard",
                    {
                        replace: true
                    }
                );
                return;
            }
            /* =================================================
               ADMIN
            ================================================= */
            if (isAdminScanner) {
                navigate(
                    "/admin/scan",
                    {
                        replace: true
                    }
                );
                return;
            }
            /* =================================================
               FALLBACK
            ================================================= */
            navigate(
                eventSelectionPath,
                {
                    replace: true
                }
            );
        };
    /* ============================================================
       VERIFY TICKET / PASS
       ONE SUCCESSFUL SCAN = ONE ENTRY
    ============================================================ */
    const verifyTicket =
        async (code) => {
            if (
                !code ||
                scanLockRef.current
            ) {
                return;
            }
            /* =====================================================
               LOCK ONLY HERE
            ===================================================== */
            scanLockRef.current =
                true;
            setResult(code);
            setChecking(true);
            setIsScanning(false);
            try {
                const headers = {
                    "Content-Type":
                        "application/json",
                    Accept:
                        "application/json"
                };
                /* =================================================
                   TEAM AUTHENTICATION
                   ADMIN TEAM AND REGULAR TEAM
                   USE DIFFERENT TOKENS.
                ================================================= */
                if (isAnyTeamScanner) {
                    const teamToken =
                        getTeamToken();
                    if (!teamToken) {
                        setMessage({
                            success:
                                false,
                            text:
                                isAdminTeamScanner
                                    ? "Admin Team authentication is missing. Please sign in again."
                                    : "Team authentication is missing. Please sign in again."
                        });
                        setChecking(false);
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
                        `${BACKEND_URL}/verify-entry/${encodeURIComponent(
                            code
                        )}`,
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
                   RESPONSE
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
                    setStats(
                        previous => ({
                            ...previous,
                            totalEntriesUsed:
                                previous.totalEntriesUsed +
                                1,
                            remainingEntries:
                                Math.max(
                                    previous.remainingEntries -
                                    1,
                                    0
                                )
                        })
                    );
                    /* =================================================
                       PAID TICKET
                    ================================================= */
                    if (
                        data.type === "paid"
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
                                ticketId:
                                    data.ticket
                                        ?.ticketId ||
                                    code
                            }
                        });
                    }
                    /* =================================================
                       FREE PASS
                    ================================================= */
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
                                ticketId:
                                    data.attendee
                                        ?.ticketId ||
                                    code
                            }
                        });
                    }
                    setIsScanning(false);
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
                            "Ticket could not be verified."
                    });
                    setIsScanning(false);
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
                setIsScanning(false);
            } finally {
                setChecking(false);
            }
        };
    /* ============================================================
       QR SCAN HANDLER
       verifyTicket() owns the lock.
    ============================================================ */
    const handleQrScan =
        (codes) => {
            if (
                !isScanning ||
                checking ||
                scanLockRef.current
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
                codes[0]?.rawValue;
            if (!rawValue) {
                return;
            }
            const cleanCode =
                String(
                    rawValue
                ).trim();
            if (!cleanCode) {
                return;
            }
            verifyTicket(
                cleanCode
            );
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
                    type="button"
                    className="scanner-back-btn"
                    onClick={
                        changeEvent
                    }
                >
                    <FiArrowLeft />
                    <span>
                        Change Event
                    </span>
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
                    <FiCamera />
                </div>
            </div>
            {/* ======================================================
                STATS
            ====================================================== */}
            <div className="scanner-stats">
                <div className="scanner-stat-card">
                    <span>
                        <MdConfirmationNumber />
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
                <div className="scanner-stat-card">
                    <span>
                        <FiCheck />
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
                        <FiClock />
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
                        <FiXCircle />
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
                STATS CONTROLS
            ====================================================== */}
            <div className="scanner-stats-controls">
                <button
                    type="button"
                    className="clear-scan-stats-btn"
                    onClick={
                        clearScanStatistics
                    }
                >
                    <FiTrash2 />
                    <span>
                        Clear scan statistics
                    </span>
                </button>
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
                                handleQrScan
                            }
                            onError={
                                error =>
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
                                Verifying ticket...
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
                    {/* =================================================
                        SCANNED CODE
                    ================================================= */}
                    <div className="scan-result-id">
                        <span>
                            Pass ID
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
                                <FiCheckCircle />
                            </div>
                            <h2>
                                VALID{" "}
                                {
                                    message.type === "free"
                                        ? "PASS"
                                        : "TICKET"
                                }
                            </h2>
                            <p>
                                Event:{" "}
                                <strong>
                                    {
                                        message.guest.event
                                    }
                                </strong>
                            </p>
                            <p>
                                Guest:{" "}
                                <strong>
                                    {
                                        message.guest.name
                                    }
                                </strong>
                            </p>
                            <p>
                                Email:{" "}
                                <strong>
                                    {
                                        message.guest.email
                                    }
                                </strong>
                            </p>
                            <p>
                                Type:{" "}
                                <strong>
                                    {
                                        message.guest.passType
                                    }
                                </strong>
                            </p>
                            <p>
                                Entry:{" "}
                                <strong>
                                    Accepted
                                </strong>
                            </p>
                            <p>
                                Time:{" "}
                                <strong>
                                    {
                                        message.guest.time ||
                                        "Just now"
                                    }
                                </strong>
                            </p>
                        </div>
                    ) : (
                        /* =================================================
                           INVALID
                        ================================================= */
                        <div className="invalid-ticket">
                            <div className="result-error-icon">
                                <FiXCircle />
                            </div>
                            <h2>
                                Entry Not Accepted
                            </h2>
                            <p>
                                {
                                    message.text
                                }
                            </p>
                        </div>
                    )}
                    {/* =================================================
                        ACTIONS
                    ================================================= */}
                    <div className="scanner-result-actions">
                        <button
                            type="button"
                            className="scan-next-btn"
                            onClick={
                                resetScanner
                            }
                        >
                            <FiRefreshCw />
                            <span>
                                Scan Next
                            </span>
                        </button>
                        <button
                            type="button"
                            className="change-event-result-btn"
                            onClick={
                                changeEvent
                            }
                        >
                            <FiArrowRight />
                            <span>
                                Change Event
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
export default TicketScanner;