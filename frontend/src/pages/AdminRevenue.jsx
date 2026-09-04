import { useEffect, useState } from "react";
import {
    BarChart3,
    Ticket,
    Wallet,
    TrendingUp,
    CalendarDays,
    RefreshCcw,
    AlertCircle,
    Receipt,
} from "lucide-react";
import "./AdminRevenue.css";
/* ============================================================
   BACKEND
============================================================ */
const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";
/* ============================================================
   ADMIN REVENUE
============================================================ */
function AdminRevenue() {
    /* ========================================================
       STATE
    ======================================================== */
    const [revenue, setRevenue] =
        useState({
            totalRevenue: 0,
            ticketsSold: 0,
            averageTicket: 0,
            events: [],
        });
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");
    /* ========================================================
       LOAD REVENUE
    ======================================================== */
    async function loadRevenue() {
        try {
            setLoading(true);
            setError("");
            const response =
                await fetch(
                    `${BACKEND_URL}/admin/revenue`
                );
            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status}`
                );
            }
            const data =
                await response.json();
            setRevenue({
                totalRevenue:
                    Number(
                        data?.totalRevenue
                    ) || 0,
                ticketsSold:
                    Number(
                        data?.ticketsSold
                    ) || 0,
                averageTicket:
                    Number(
                        data?.averageTicket
                    ) || 0,
                events:
                    Array.isArray(
                        data?.events
                    )
                        ? data.events
                        : [],
            });
        } catch (loadError) {
            console.error(
                "ADMIN REVENUE LOAD ERROR:",
                loadError
            );
            setError(
                "Unable to load revenue data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }
    /* ========================================================
       INITIAL LOAD
    ======================================================== */
    useEffect(() => {
        loadRevenue();
    }, []);
    /* ========================================================
       FORMAT MONEY
    ======================================================== */
    const formatMoney = (value) => {
        const amount =
            Number(value) || 0;
        return new Intl.NumberFormat(
            "en-UG",
            {
                maximumFractionDigits: 0,
            }
        ).format(amount);
    };
    /* ========================================================
       FORMAT NUMBER
    ======================================================== */
    const formatNumber = (value) => {
        return new Intl.NumberFormat(
            "en-UG"
        ).format(
            Number(value) || 0
        );
    };
    /* ========================================================
       RENDER
    ======================================================== */
    return (
        <div className="admin-revenue">
            {/* ==================================================
                PAGE HEADER
            ================================================== */}
            <header className="admin-revenue-header">
                <div className="admin-revenue-title-area">
                    <div className="admin-revenue-title-icon">
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <p className="admin-revenue-eyebrow">
                            EVENTWAA ADMINISTRATION
                        </p>
                        <h1>
                            Revenue & Reports
                        </h1>
                        <p className="admin-revenue-subtitle">
                            Monitor platform revenue,
                            ticket sales and event performance.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className="admin-revenue-refresh"
                    onClick={loadRevenue}
                    disabled={loading}
                >
                    <RefreshCcw
                        size={18}
                        className={
                            loading
                                ? "admin-revenue-spin"
                                : ""
                        }
                    />
                    Refresh
                </button>
            </header>
            {/* ==================================================
                ERROR
            ================================================== */}
            {error && (
                <div
                    className="admin-revenue-error"
                    role="alert"
                >
                    <AlertCircle size={20} />
                    <span>
                        {error}
                    </span>
                </div>
            )}
            {/* ==================================================
                OVERVIEW HEADING
            ================================================== */}
            <div className="admin-revenue-section-heading">
                <div>
                    <h2>
                        Revenue Overview
                    </h2>
                    <p>
                        Current financial activity across EventWaa.
                    </p>
                </div>
            </div>
            {/* ==================================================
                REVENUE CARDS
            ================================================== */}
            <div className="revenue-cards">
                {/* =================================================
                    TOTAL REVENUE
                ================================================= */}
                <div className="revenue-card revenue-card-primary">
                    <div className="revenue-card-top">
                        <div className="revenue-card-icon">
                            <Wallet size={24} />
                        </div>
                        <span>
                            TOTAL REVENUE
                        </span>
                    </div>
                    <div className="revenue-card-value">
                        <small>
                            UGX
                        </small>
                        <strong>
                            {formatMoney(
                                revenue.totalRevenue
                            )}
                        </strong>
                    </div>
                    <p>
                        Total ticket revenue generated
                    </p>
                </div>
                {/* =================================================
                    TICKETS SOLD
                ================================================= */}
                <div className="revenue-card">
                    <div className="revenue-card-top">
                        <div className="revenue-card-icon">
                            <Ticket size={24} />
                        </div>
                        <span>
                            TICKETS SOLD
                        </span>
                    </div>
                    <div className="revenue-card-value">
                        <strong>
                            {formatNumber(
                                revenue.ticketsSold
                            )}
                        </strong>
                    </div>
                    <p>
                        Paid tickets sold across events
                    </p>
                </div>
                {/* =================================================
                    AVERAGE TICKET
                ================================================= */}
                <div className="revenue-card">
                    <div className="revenue-card-top">
                        <div className="revenue-card-icon">
                            <TrendingUp size={24} />
                        </div>
                        <span>
                            AVERAGE TICKET
                        </span>
                    </div>
                    <div className="revenue-card-value">
                        <small>
                            UGX
                        </small>
                        <strong>
                            {formatMoney(
                                revenue.averageTicket
                            )}
                        </strong>
                    </div>
                    <p>
                        Average revenue per ticket
                    </p>
                </div>
            </div>
            {/* ==================================================
                EVENT REVENUE
            ================================================== */}
            <section className="event-revenue">
                {/* =================================================
                    SECTION HEADER
                ================================================= */}
                <div className="event-revenue-header">
                    <div>
                        <div className="event-revenue-heading-row">
                            <div className="event-revenue-icon">
                                <CalendarDays size={21} />
                            </div>
                            <h2>
                                Revenue By Event
                            </h2>
                        </div>
                        <p>
                            Revenue and ticket performance
                            for each EventWaa event.
                        </p>
                    </div>
                    <div className="event-revenue-count">
                        <Receipt size={17} />
                        <span>
                            {formatNumber(
                                revenue.events.length
                            )}{" "}
                            {revenue.events.length === 1
                                ? "Event"
                                : "Events"}
                        </span>
                    </div>
                </div>
                {/* =================================================
                    LOADING
                ================================================= */}
                {loading && (
                    <div className="admin-revenue-loading">
                        <RefreshCcw
                            size={25}
                            className="admin-revenue-spin"
                        />
                        <p>
                            Loading revenue data...
                        </p>
                    </div>
                )}
                {/* =================================================
                    EMPTY
                ================================================= */}
                {!loading &&
                revenue.events.length === 0 && (
                    <div className="admin-revenue-empty">
                        <div className="admin-revenue-empty-icon">
                            <BarChart3 size={28} />
                        </div>
                        <h3>
                            No revenue data yet
                        </h3>
                        <p>
                            Revenue information will appear
                            here when ticket sales are recorded.
                        </p>
                    </div>
                )}
                {/* =================================================
                    EVENT TABLE
                ================================================= */}
                {!loading &&
                revenue.events.length > 0 && (
                    <div className="revenue-table-wrapper">
                        <div className="revenue-table-header">
                            <span>
                                EVENT
                            </span>
                            <span>
                                TICKETS SOLD
                            </span>
                            <span>
                                REVENUE
                            </span>
                        </div>
                        {revenue.events.map(
                            (event, index) => (
                                <div
                                    className="revenue-row"
                                    key={
                                        event?.id ||
                                        `event-${index}`
                                    }
                                >
                                    {/* EVENT */}
                                    <div className="revenue-event-name">
                                        <div className="revenue-event-icon">
                                            <CalendarDays
                                                size={19}
                                            />
                                        </div>
                                        <div>
                                            <h3>
                                                {
                                                    event?.title ||
                                                    event?.name ||
                                                    "Untitled Event"
                                                }
                                            </h3>
                                            {event?.id && (
                                                <span>
                                                    Event ID:{" "}
                                                    {event.id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* TICKETS */}
                                    <div className="revenue-ticket-count">
                                        <Ticket size={17} />
                                        <strong>
                                            {formatNumber(
                                                event?.ticketsSold
                                            )}
                                        </strong>
                                    </div>
                                    {/* REVENUE */}
                                    <div className="revenue-event-amount">
                                        <span>
                                            UGX
                                        </span>
                                        <strong>
                                            {formatMoney(
                                                event?.revenue
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
export default AdminRevenue;