import {
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";

import {
    FiCalendar,
    FiPlus,
    FiUsers,
    FiCheckCircle,
    FiClock,
    FiMapPin,
    FiTag,
    FiEdit3,
    FiCopy,
    FiTrash2,
    FiSearch,
    FiFilter,
    FiCreditCard,
    FiChevronRight,
    FiGrid,
    FiXCircle,
    FiChevronLeft,
} from "react-icons/fi";

import "../styles/HostEvents.css";

const EVENTS_PER_PAGE = 12;

function HostEvents() {
    const navigate = useNavigate();

    const { events, deleteEvent } = useContext(EventContext);
    const { user } = useAuth();

    const BACKEND_URL =
        import.meta.env.VITE_API_BASE_URL || "";

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [sortBy, setSortBy] = useState("soonest");
    const [currentPage, setCurrentPage] = useState(1);
    const [cancellingEventId, setCancellingEventId] =
        useState(null);

    /*
     * =========================================================
     * MY EVENTS
     * =========================================================
     */

    const myEvents = useMemo(() => {
        if (!user?.email) return [];

        return (events || []).filter(
            (event) =>
                String(event?.hostEmail || "").toLowerCase() ===
                String(user.email).toLowerCase()
        );
    }, [events, user?.email]);

    /*
     * =========================================================
     * HELPERS
     * =========================================================
     */

    const getEventDate = (event) => {
        if (!event) return null;

        const rawDate =
            event.date ||
            event.eventDate ||
            event.startDate;

        if (!rawDate) return null;

        let date = new Date(rawDate);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        /*
         * If a separate event time exists, apply it.
         */
        if (event.time) {
            const timeParts = String(event.time).split(":");

            const hours = Number(timeParts[0]);
            const minutes = Number(timeParts[1]);

            date.setHours(
                Number.isFinite(hours) ? hours : 0,
                Number.isFinite(minutes) ? minutes : 0,
                0,
                0
            );
        }

        return date;
    };

    const getSold = (event) => {
        const value =
            event?.ticketsSold ??
            event?.sold ??
            event?.bookingsCount ??
            0;

        const number = Number(value);

        return Number.isFinite(number) ? number : 0;
    };

    const getCapacity = (event) => {
        const value =
            event?.capacity ??
            event?.ticketCapacity ??
            event?.totalTickets ??
            0;

        const number = Number(value);

        return Number.isFinite(number) ? number : 0;
    };

    const getRemaining = (event) => {
        const capacity = getCapacity(event);
        const sold = getSold(event);

        if (capacity <= 0) return 0;

        return Math.max(capacity - sold, 0);
    };

    const getCheckedIn = (event) => {
        const value =
            event?.checkedIn ??
            event?.checkedInCount ??
            event?.attendanceCount ??
            0;

        const number = Number(value);

        return Number.isFinite(number) ? number : 0;
    };

    const getRevenue = (event) => {
        const value =
            event?.revenue ??
            event?.totalRevenue ??
            0;

        const number = Number(value);

        return Number.isFinite(number) ? number : 0;
    };

    const getPrice = (event) => {
        const number = Number(event?.price ?? 0);

        return Number.isFinite(number) ? number : 0;
    };

    const isCancelled = (event) => {
        return (
            String(event?.status || "").toLowerCase() ===
            "cancelled"
        );
    };

    const getStatus = (event, now = new Date()) => {
        if (isCancelled(event)) {
            return {
                label: "Cancelled",
                className: "status-cancelled",
            };
        }

        const eventDate = getEventDate(event);

        if (eventDate && eventDate < now) {
            return {
                label: "Past",
                className: "status-past",
            };
        }

        return {
            label: "Upcoming",
            className: "status-upcoming",
        };
    };

    const formatDate = (event) => {
        const date = getEventDate(event);

        if (!date) {
            return "Date not set";
        }

        return date.toLocaleDateString("en-UG", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (event) => {
        if (!event?.time) {
            return "Time not set";
        }

        const [hoursRaw, minutesRaw] =
            String(event.time).split(":");

        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);

        if (
            !Number.isFinite(hours) ||
            !Number.isFinite(minutes)
        ) {
            return "Time not set";
        }

        const date = new Date();

        date.setHours(
            hours,
            minutes,
            0,
            0
        );

        return date.toLocaleTimeString("en-UG", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount) => {
        const number = Number(amount || 0);

        return `UGX ${
            Number.isFinite(number)
                ? number.toLocaleString()
                : "0"
        }`;
    };

    const getImageUrl = (image) => {
        if (!image) return "";

        const imageUrl = String(image).trim();

        if (!imageUrl) return "";

        /*
         * Already a complete URL.
         */
        if (
            imageUrl.startsWith("http://") ||
            imageUrl.startsWith("https://")
        ) {
            return imageUrl;
        }

        /*
         * Backend-hosted relative image.
         */
        const backend = BACKEND_URL.replace(/\/+$/, "");

        if (imageUrl.startsWith("/")) {
            return `${backend}${imageUrl}`;
        }

        return `${backend}/${imageUrl}`;
    };

    /*
     * =========================================================
     * FILTER + SEARCH + SORT
     * =========================================================
     */

    const filteredEvents = useMemo(() => {
        const now = new Date();

        let result = [...myEvents];

        /*
         * SEARCH
         */
        const query = search.trim().toLowerCase();

        if (query) {
            result = result.filter((event) => {
                const searchableValues = [
                    event?.title,
                    event?.venue,
                    event?.location,
                    event?.city,
                    event?.category,
                ];

                return searchableValues.some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(query)
                );
            });
        }

        /*
         * FILTER
         */
        result = result.filter((event) => {
            const date = getEventDate(event);
            const cancelled = isCancelled(event);

            switch (filter) {
                case "upcoming":
                    return (
                        !cancelled &&
                        date &&
                        date >= now
                    );

                case "past":
                    return (
                        !cancelled &&
                        date &&
                        date < now
                    );

                case "free":
                    return (
                        getPrice(event) === 0 &&
                        !cancelled
                    );

                case "paid":
                    return (
                        getPrice(event) > 0 &&
                        !cancelled
                    );

                case "cancelled":
                    return cancelled;

                case "all":
                default:
                    return true;
            }
        });

        /*
         * SORT
         */
        result.sort((a, b) => {
            const dateA =
                getEventDate(a)?.getTime() ?? 0;

            const dateB =
                getEventDate(b)?.getTime() ?? 0;

            switch (sortBy) {
                case "newest":
                    return dateB - dateA;

                case "oldest":
                    return dateA - dateB;

                case "mostSold":
                    return getSold(b) - getSold(a);

                case "highestRevenue":
                    return (
                        getRevenue(b) -
                        getRevenue(a)
                    );

                case "soonest":
                default:
                    return dateA - dateB;
            }
        });

        return result;
    }, [
        myEvents,
        search,
        filter,
        sortBy,
    ]);

    /*
     * =========================================================
     * RESET PAGINATION
     * =========================================================
     */

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filter, sortBy]);

    /*
     * =========================================================
     * PAGINATION
     * =========================================================
     */

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredEvents.length /
                EVENTS_PER_PAGE
        )
    );

    const safeCurrentPage = Math.min(
        currentPage,
        totalPages
    );

    const startIndex =
        (safeCurrentPage - 1) *
        EVENTS_PER_PAGE;

    const paginatedEvents =
        filteredEvents.slice(
            startIndex,
            startIndex + EVENTS_PER_PAGE
        );

    const goToPage = (page) => {
        if (
            page < 1 ||
            page > totalPages
        ) {
            return;
        }

        setCurrentPage(page);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /*
     * =========================================================
     * NEXT UPCOMING EVENT
     * =========================================================
     */

    const upcomingEvent = useMemo(() => {
        const now = new Date();

        return (
            myEvents
                .filter((event) => {
                    const date =
                        getEventDate(event);

                    return (
                        !isCancelled(event) &&
                        date &&
                        date >= now
                    );
                })
                .sort((a, b) => {
                    const dateA =
                        getEventDate(a);

                    const dateB =
                        getEventDate(b);

                    return (
                        dateA.getTime() -
                        dateB.getTime()
                    );
                })[0] || null
        );
    }, [myEvents]);

    /*
     * =========================================================
     * DELETE
     * =========================================================
     */

    const handleDelete = async (event) => {
        if (!event?.id) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${event.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await deleteEvent(event.id);
        } catch (error) {
            console.error(
                "Failed to delete event:",
                error
            );

            alert(
                "Failed to delete event. Please try again."
            );
        }
    };

    /*
     * =========================================================
     * CANCEL
     * =========================================================
     */

    const handleCancel = async (event) => {
        if (!event?.id) return;

        if (isCancelled(event)) {
            return;
        }

        const eventDate =
            getEventDate(event);

        if (
            eventDate &&
            eventDate < new Date()
        ) {
            alert(
                "Past events cannot be cancelled."
            );
            return;
        }

        const confirmed = window.confirm(
            `Cancel "${event.title}"?\n\nThis will cancel the event, invalidate its tickets/passes, and process the applicable refunds.`
        );

        if (!confirmed) return;

        if (!user?.email) {
            alert(
                "Your host session could not be verified. Please log in again."
            );
            return;
        }

        setCancellingEventId(event.id);

        try {
            const response = await fetch(
                `${BACKEND_URL}/events/${event.id}/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        hostEmail:
                            user.email,
                    }),
                }
            );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        data?.error ||
                        "Failed to cancel event."
                );
            }

            alert(
                data?.message ||
                    "Event cancelled successfully."
            );

            /*
             * Reload so EventContext receives
             * the updated event status and all
             * cancellation/refund data.
             */
            window.location.reload();
        } catch (error) {
            console.error(
                "Failed to cancel event:",
                error
            );

            alert(
                error?.message ||
                    "Failed to cancel event. Please try again."
            );
        } finally {
            setCancellingEventId(null);
        }
    };

    /*
     * =========================================================
     * SUMMARY
     * =========================================================
     */

    const totalEvents =
        myEvents.length;

    const upcomingCount = myEvents.filter(
        (event) => {
            const date =
                getEventDate(event);

            return (
                !isCancelled(event) &&
                date &&
                date >= new Date()
            );
        }
    ).length;

    const totalTicketsSold =
        myEvents.reduce(
            (total, event) =>
                total + getSold(event),
            0
        );

    const totalRevenue =
        myEvents.reduce(
            (total, event) =>
                total + getRevenue(event),
            0
        );

    /*
     * =========================================================
     * PAGE NUMBERS
     * =========================================================
     */

    const pageNumbers = Array.from(
        { length: totalPages },
        (_, index) => index + 1
    );

    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <div className="host-events-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="host-events-header">
                <div>
                    <span className="host-events-eyebrow">
                        HOST DASHBOARD
                    </span>

                    <h1>
                        <FiCalendar />
                        My Events
                    </h1>

                    <p>
                        Manage your events, track
                        attendance, tickets, revenue
                        and event activity.
                    </p>
                </div>

                <button
                    type="button"
                    className="create-host-event-btn"
                    onClick={() =>
                        navigate("/create-event")
                    }
                >
                    <FiPlus />
                    Create Event
                </button>
            </header>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="host-events-summary">

                <div className="host-event-summary-card">
                    <span>
                        <FiGrid />
                    </span>

                    <div>
                        <small>
                            Total Events
                        </small>

                        <strong>
                            {totalEvents}
                        </strong>
                    </div>
                </div>

                <div className="host-event-summary-card">
                    <span>
                        <FiClock />
                    </span>

                    <div>
                        <small>
                            Upcoming
                        </small>

                        <strong>
                            {upcomingCount}
                        </strong>
                    </div>
                </div>

                <div className="host-event-summary-card">
                    <span>
                        <FiUsers />
                    </span>

                    <div>
                        <small>
                            Tickets Sold
                        </small>

                        <strong>
                            {totalTicketsSold}
                        </strong>
                    </div>
                </div>

                <div className="host-event-summary-card">
                    <span>
                        <FiCreditCard />
                    </span>

                    <div>
                        <small>
                            Total Revenue
                        </small>

                        <strong>
                            {formatCurrency(
                                totalRevenue
                            )}
                        </strong>
                    </div>
                </div>

            </section>

            {/* =================================================
                NEXT UPCOMING EVENT
            ================================================= */}

            {upcomingEvent && (
                <section className="current-event-section">

                    <div className="current-event-heading">
                        <div>
                            <span>
                                NEXT UPCOMING EVENT
                            </span>

                            <h2>
                                Keep an eye on what's next
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/attendees/${upcomingEvent.id}`
                                )
                            }
                        >
                            View Attendees
                            <FiChevronRight />
                        </button>
                    </div>

                    <div className="current-event-card">

                        <div className="current-event-poster-wrapper">
                            {upcomingEvent.image ? (
                                <img
                                    src={getImageUrl(
                                        upcomingEvent.image
                                    )}
                                    alt={
                                        upcomingEvent.title ||
                                        "Event poster"
                                    }
                                    className="current-event-poster"
                                />
                            ) : (
                                <FiCalendar
                                    size={50}
                                />
                            )}
                        </div>

                        <div className="current-event-info">

                            <h2>
                                {upcomingEvent.title}
                            </h2>

                            <p>
                                <FiCalendar />
                                {formatDate(
                                    upcomingEvent
                                )}
                            </p>

                            <p>
                                <FiClock />
                                {formatTime(
                                    upcomingEvent
                                )}
                            </p>

                            <p>
                                <FiMapPin />
                                {upcomingEvent.venue ||
                                    upcomingEvent.location ||
                                    "Venue not set"}
                            </p>

                            {upcomingEvent.category && (
                                <p>
                                    <FiTag />
                                    {
                                        upcomingEvent.category
                                    }
                                </p>
                            )}

                        </div>

                        <div className="current-event-stats">

                            <div>
                                <strong>
                                    {getSold(
                                        upcomingEvent
                                    )}
                                </strong>

                                <span>
                                    Tickets Sold
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {getCheckedIn(
                                        upcomingEvent
                                    )}
                                </strong>

                                <span>
                                    Checked In
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {getRemaining(
                                        upcomingEvent
                                    )}
                                </strong>

                                <span>
                                    Remaining
                                </span>
                            </div>

                        </div>

                    </div>
                </section>
            )}

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <section className="host-events-toolbar">

                <div className="host-events-search">
                    <FiSearch />

                    <input
                        type="text"
                        placeholder="Search your events..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />
                </div>

                <div className="host-events-filter">
                    <FiFilter />

                    <select
                        value={filter}
                        onChange={(event) =>
                            setFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            All Events
                        </option>

                        <option value="upcoming">
                            Upcoming
                        </option>

                        <option value="past">
                            Past
                        </option>

                        <option value="free">
                            Free Events
                        </option>

                        <option value="paid">
                            Paid Events
                        </option>

                        <option value="cancelled">
                            Cancelled
                        </option>
                    </select>
                </div>

                <div className="host-events-sort">
                    <select
                        value={sortBy}
                        onChange={(event) =>
                            setSortBy(
                                event.target.value
                            )
                        }
                    >
                        <option value="soonest">
                            Soonest First
                        </option>

                        <option value="newest">
                            Newest First
                        </option>

                        <option value="oldest">
                            Oldest First
                        </option>

                        <option value="mostSold">
                            Most Tickets Sold
                        </option>

                        <option value="highestRevenue">
                            Highest Revenue
                        </option>
                    </select>
                </div>

            </section>

            {/* =================================================
                ALL EVENTS
            ================================================= */}

            <section className="all-host-events">

                <div className="all-host-events-heading">

                    <div>
                        <h2>
                            All My Events
                        </h2>

                        <p>
                            {filteredEvents.length ===
                            0
                                ? "No events found."
                                : `Showing ${
                                      startIndex + 1
                                  }–${Math.min(
                                      startIndex +
                                          EVENTS_PER_PAGE,
                                      filteredEvents.length
                                  )} of ${
                                      filteredEvents.length
                                  } events`}
                        </p>
                    </div>

                    <span className="events-page-count">
                        Page {safeCurrentPage} of{" "}
                        {totalPages}
                    </span>

                </div>

                {paginatedEvents.length === 0 ? (
                    <div className="host-events-empty">

                        <div className="host-events-empty-icon">
                            <FiCalendar />
                        </div>

                        <h2>
                            {search ||
                            filter !== "all"
                                ? "No matching events"
                                : "You haven't created any events yet"}
                        </h2>

                        <p>
                            {search ||
                            filter !== "all"
                                ? "Try changing your search or filter."
                                : "Create your first event and start building your audience."}
                        </p>

                        {!search &&
                            filter === "all" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/create-event"
                                        )
                                    }
                                >
                                    <FiPlus />
                                    Create Your First
                                    Event
                                </button>
                            )}

                    </div>
                ) : (
                    <div className="host-events-list">

                        {paginatedEvents.map(
                            (event) => {
                                const status =
                                    getStatus(
                                        event
                                    );

                                const sold =
                                    getSold(
                                        event
                                    );

                                const capacity =
                                    getCapacity(
                                        event
                                    );

                                const checkedIn =
                                    getCheckedIn(
                                        event
                                    );

                                const remaining =
                                    getRemaining(
                                        event
                                    );

                                const capacityPercentage =
                                    capacity > 0
                                        ? Math.min(
                                              (sold /
                                                  capacity) *
                                                  100,
                                              100
                                          )
                                        : 0;

                                const cancelled =
                                    isCancelled(
                                        event
                                    );

                                const isPast =
                                    status.label ===
                                    "Past";

                                const canCancel =
                                    !cancelled &&
                                    !isPast;

                                return (
                                    <article
                                        className={`host-event-card ${
                                            cancelled
                                                ? "host-event-card-cancelled"
                                                : ""
                                        }`}
                                        key={event.id}
                                    >

                                        {/* POSTER */}

                                        <div className="host-event-poster-wrapper">

                                            {event.image ? (
                                                <img
                                                    src={getImageUrl(
                                                        event.image
                                                    )}
                                                    alt={
                                                        event.title ||
                                                        "Event poster"
                                                    }
                                                    className="host-event-poster"
                                                />
                                            ) : (
                                                <FiCalendar
                                                    size={
                                                        48
                                                    }
                                                />
                                            )}

                                            {cancelled && (
                                                <div className="cancelled-poster-overlay">
                                                    <FiXCircle />

                                                    <span>
                                                        Event
                                                        Cancelled
                                                    </span>
                                                </div>
                                            )}

                                        </div>

                                        {/* TITLE */}

                                        <div className="host-event-title-row">

                                            <div>
                                                <span
                                                    className={`event-status ${status.className}`}
                                                >
                                                    {
                                                        status.label
                                                    }
                                                </span>

                                                <h3>
                                                    {
                                                        event.title
                                                    }
                                                </h3>
                                            </div>

                                        </div>

                                        {/* META */}

                                        <div className="host-event-meta">

                                            <span>
                                                <FiCalendar />
                                                {formatDate(
                                                    event
                                                )}
                                            </span>

                                            <span>
                                                <FiClock />
                                                {formatTime(
                                                    event
                                                )}
                                            </span>

                                            <span>
                                                <FiMapPin />
                                                {event.venue ||
                                                    event.location ||
                                                    "Venue not set"}
                                            </span>

                                            {event.category && (
                                                <span>
                                                    <FiTag />
                                                    {
                                                        event.category
                                                    }
                                                </span>
                                            )}

                                        </div>

                                        {/* TYPE */}

                                        <div className="host-event-type">

                                            {getPrice(
                                                event
                                            ) === 0 ? (
                                                <span className="free-badge">
                                                    Free Event
                                                </span>
                                            ) : (
                                                <span className="paid-badge">
                                                    Paid •{" "}
                                                    {formatCurrency(
                                                        getPrice(
                                                            event
                                                        )
                                                    )}
                                                </span>
                                            )}

                                        </div>

                                        {/* PERFORMANCE */}

                                        <div className="host-event-performance">

                                            <div className="performance-item">
                                                <span>
                                                    Tickets
                                                    Sold
                                                </span>

                                                <strong>
                                                    {sold}
                                                </strong>
                                            </div>

                                            <div className="performance-item">
                                                <span>
                                                    Checked
                                                    In
                                                </span>

                                                <strong>
                                                    {
                                                        checkedIn
                                                    }
                                                </strong>
                                            </div>

                                            <div className="performance-item">
                                                <span>
                                                    Remaining
                                                </span>

                                                <strong>
                                                    {capacity
                                                        ? remaining
                                                        : "—"}
                                                </strong>
                                            </div>

                                            <div className="performance-item">
                                                <span>
                                                    Revenue
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        getRevenue(
                                                            event
                                                        )
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                        {/* CAPACITY */}

                                        {!cancelled && (
                                            <div className="event-capacity">

                                                <div className="capacity-header">

                                                    <span>
                                                        Ticket
                                                        Capacity
                                                    </span>

                                                    <strong>
                                                        {capacity
                                                            ? `${sold} / ${capacity}`
                                                            : `${sold} sold`}
                                                    </strong>

                                                </div>

                                                <div className="capacity-bar">
                                                    <div
                                                        className="capacity-fill"
                                                        style={{
                                                            width: `${capacityPercentage}%`,
                                                        }}
                                                    />
                                                </div>

                                            </div>
                                        )}

                                        {/* ACTIONS */}

                                        <div className="host-event-actions">

                                            <button
                                                type="button"
                                                className="view-event-btn"
                                                onClick={() =>
                                                    navigate(
                                                        `/attendees/${event.id}`
                                                    )
                                                }
                                            >
                                                <FiUsers />
                                                Attendees
                                            </button>

                                            {!cancelled && (
                                                <button
                                                    type="button"
                                                    className="scan-event-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/scanner/${event.id}`
                                                        )
                                                    }
                                                >
                                                    <FiCheckCircle />
                                                    Scan
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="edit-event-btn"
                                                onClick={() =>
                                                    navigate(
                                                        "/create-event",
                                                        {
                                                            state: {
                                                                event,
                                                            },
                                                        }
                                                    )
                                                }
                                                disabled={
                                                    cancelled
                                                }
                                            >
                                                <FiEdit3 />
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="duplicate-event-btn"
                                                onClick={() =>
                                                    navigate(
                                                        "/create-event",
                                                        {
                                                            state: {
                                                                duplicateEvent:
                                                                    event,
                                                            },
                                                        }
                                                    )
                                                }
                                            >
                                                <FiCopy />
                                                Duplicate
                                            </button>

                                            {canCancel && (
                                                <button
                                                    type="button"
                                                    className="cancel-event-btn"
                                                    onClick={() =>
                                                        handleCancel(
                                                            event
                                                        )
                                                    }
                                                    disabled={
                                                        cancellingEventId ===
                                                        event.id
                                                    }
                                                >
                                                    <FiXCircle />

                                                    {cancellingEventId ===
                                                    event.id
                                                        ? "Cancelling..."
                                                        : "Cancel"}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="delete-event-btn"
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

                                    </article>
                                );
                            }
                        )}

                    </div>
                )}

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {filteredEvents.length >
                    EVENTS_PER_PAGE && (
                    <div className="host-events-pagination">

                        <button
                            type="button"
                            className="pagination-arrow"
                            disabled={
                                safeCurrentPage ===
                                1
                            }
                            onClick={() =>
                                goToPage(
                                    safeCurrentPage -
                                        1
                                )
                            }
                            aria-label="Previous page"
                        >
                            <FiChevronLeft />
                        </button>

                        <div className="pagination-pages">

                            {pageNumbers.map(
                                (page) => (
                                    <button
                                        type="button"
                                        key={page}
                                        className={
                                            page ===
                                            safeCurrentPage
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            goToPage(
                                                page
                                            )
                                        }
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                        </div>

                        <button
                            type="button"
                            className="pagination-arrow"
                            disabled={
                                safeCurrentPage ===
                                totalPages
                            }
                            onClick={() =>
                                goToPage(
                                    safeCurrentPage +
                                        1
                                )
                            }
                            aria-label="Next page"
                        >
                            <FiChevronRight />
                        </button>

                    </div>
                )}

            </section>

        </div>
    );
}

export default HostEvents;