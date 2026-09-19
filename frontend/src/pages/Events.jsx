import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import EventCard from "../components/EventCard";
import CityChips from "../components/CityChips";
import "./Events.css";
const EVENTS_PER_PAGE = 12;
function Events() {
    const { events } = useContext(EventContext);
    const location = useLocation();
    const navigate = useNavigate();
    // ============================================================
    // URL PARAMETERS
    // ============================================================
    const params = new URLSearchParams(location.search);
    const type =
        params.get("type");
    const featured =
        params.get("featured");
    const filter =
        params.get("filter");
    const category =
        params.get("category");
    const city =
        params.get("city");
    const search =
        params.get("search")?.toLowerCase() || "";
    // ============================================================
    // SEARCH INPUT
    // ============================================================
    const [searchInput, setSearchInput] =
        useState(search);
    // ============================================================
    // PAGINATION
    // ============================================================
    const [currentPage, setCurrentPage] =
        useState(1);
    // ============================================================
    // KEEP SEARCH INPUT IN SYNC WITH URL
    // ============================================================
    useEffect(() => {
        setSearchInput(search);
    }, [search]);
    // ============================================================
    // RESET TO PAGE 1 WHEN FILTERS / SEARCH CHANGE
    // ============================================================
    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        city,
        featured,
        type,
        category,
        filter
    ]);
    // ============================================================
    // HANDLE SEARCH
    //
    // IMPORTANT:
    // Search changes REPLACE the current /events URL.
    //
    // This means:
    //
    // Home
    //   ↓
    // Events
    //   ↓
    // Search
    //
    // Back still goes directly to Home.
    // ============================================================
    const handleSearch = (value) => {
        setSearchInput(value);
        const newParams =
            new URLSearchParams(
                location.search
            );
        if (value.trim()) {
            newParams.set(
                "search",
                value.trim()
            );
        } else {
            newParams.delete(
                "search"
            );
        }
        const queryString =
            newParams.toString();
        navigate(
            queryString
                ? `/events?${queryString}`
                : "/events",
            {
                replace: true
            }
        );
    };
    // ============================================================
    // FILTER EVENTS
    // ============================================================
    const filteredEvents = useMemo(() => {
        let result = [
            ...(events || [])
        ];
        // ========================================================
        // REMOVE CANCELLED EVENTS
        //
        // Cancelled events should not appear on the public
        // EventWaa event discovery page.
        // ========================================================
        result = result.filter(
            (event) => {
                const status =
                    String(
                        event.status || ""
                    ).toLowerCase();
                return status !== "cancelled";
            }
        );
        // ========================================================
        // ONLY SHOW PUBLISHED EVENTS
        //
        // Draft/unpublished events should not be publicly
        // discoverable.
        // ========================================================
        result = result.filter((event) => {
            const status =
                String(
                    event.status || ""
                ).toLowerCase();
            return (
                status === "published" ||
                status === "active" ||
                !event.status
            );
        });
        // ========================================================
        // SEARCH
        // ========================================================
        if (search) {
            result = result.filter(
                (event) => {
                    const searchable = `
                        ${event.title || ""}
                        ${event.description || ""}
                        ${event.venue || ""}
                        ${event.city || ""}
                        ${event.location || ""}
                        ${event.category || ""}
                    `.toLowerCase();
                    return searchable.includes(
                        search
                    );
                }
            );
        }
        // ========================================================
        // CITY
        // ========================================================
        if (city) {
            result = result.filter(
                (event) =>
                    event.city?.toLowerCase()
                    ===
                    city.toLowerCase()
            );
        }
        // ========================================================
        // FEATURED
        // ========================================================
        if (featured === "true") {
            result = result.filter(
                (event) =>
                    event.featured === true
            );
        }
        // ========================================================
        // FREE / PAID
        // ========================================================
        if (type) {
            result = result.filter(
                (event) =>
                    String(
                        event.eventType || ""
                    ).toLowerCase()
                    ===
                    type.toLowerCase()
            );
        }
        // ========================================================
        // CATEGORY
        // ========================================================
        if (category) {
            result = result.filter(
                (event) =>
                    event.category?.toLowerCase()
                    ===
                    category.toLowerCase()
            );
        }
        // ========================================================
        // THIS WEEK
        // ========================================================
        if (filter === "this-week") {
            const today =
                new Date();
            today.setHours(
                0,
                0,
                0,
                0
            );
            const nextWeek =
                new Date(today);
            nextWeek.setDate(
                today.getDate() + 7
            );
            result = result.filter(
                (event) => {
                    const eventDate =
                        new Date(
                            event.date
                        );
                    if (
                        Number.isNaN(
                            eventDate.getTime()
                        )
                    ) {
                        return false;
                    }
                    eventDate.setHours(
                        0,
                        0,
                        0,
                        0
                    );
                    return (
                        eventDate >= today &&
                        eventDate <= nextWeek
                    );
                }
            );
        }
        return result;
    }, [
        events,
        search,
        city,
        featured,
        type,
        category,
        filter
    ]);
    // ============================================================
    // PAGINATION CALCULATIONS
    // ============================================================
    const totalEvents =
        filteredEvents.length;
    const totalPages =
        Math.ceil(
            totalEvents /
            EVENTS_PER_PAGE
        );
    // ============================================================
    // SAFETY:
    // IF FILTERING REDUCES THE NUMBER OF PAGES,
    // NEVER STAY ON AN INVALID PAGE.
    // ============================================================
    useEffect(() => {
        if (
            totalPages > 0 &&
            currentPage > totalPages
        ) {
            setCurrentPage(totalPages);
        }
        if (
            totalPages === 0 &&
            currentPage !== 1
        ) {
            setCurrentPage(1);
        }
    }, [
        totalPages,
        currentPage
    ]);
    // ============================================================
    // EVENTS FOR CURRENT PAGE
    // ============================================================
    const startIndex =
        (currentPage - 1) *
        EVENTS_PER_PAGE;
    const endIndex =
        startIndex +
        EVENTS_PER_PAGE;
    const paginatedEvents =
        filteredEvents.slice(
            startIndex,
            endIndex
        );
    // ============================================================
    // PAGINATION NAVIGATION
    // ============================================================
    const goToPage = (page) => {
        if (
            page < 1 ||
            page > totalPages ||
            page === currentPage
        ) {
            return;
        }
        setCurrentPage(page);
        // Bring the user back to the beginning
        // of the event results after changing page.
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };
    // ============================================================
    // BUILD PAGE NUMBERS
    //
    // Keeps pagination clean when there are many pages.
    //
    // Example:
    // 1 2 3 ... 16 17
    // ============================================================
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from(
                {
                    length: totalPages
                },
                (_, index) =>
                    index + 1
            );
        }
        const pages = [];
        pages.push(1);
        if (currentPage > 4) {
            pages.push("left-ellipsis");
        }
        const start =
            Math.max(
                2,
                currentPage - 1
            );
        const end =
            Math.min(
                totalPages - 1,
                currentPage + 1
            );
        for (
            let page = start;
            page <= end;
            page++
        ) {
            pages.push(page);
        }
        if (
            currentPage <
            totalPages - 3
        ) {
            pages.push("right-ellipsis");
        }
        pages.push(totalPages);
        return pages;
    };
    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="events-page">
            {/* ====================================================
                HEADER
            ==================================================== */}
            <div className="events-header">
                <h1>
                    {
                        search
                            ? `Results for "${search}"`
                            : "Explore Events"
                    }
                </h1>
                <p>
                    {filteredEvents.length}{" "}
                    {filteredEvents.length === 1
                        ? "event"
                        : "events"}{" "}
                    found
                </p>
            </div>
            {/* ====================================================
                SEARCH
            ==================================================== */}
            <div className="events-search">
                <input
                    type="text"
                    placeholder="Search events, cities, venues..."
                    value={searchInput}
                    onChange={(e) =>
                        handleSearch(
                            e.target.value
                        )
                    }
                />
            </div>
            {/* ====================================================
                CITIES
            ==================================================== */}
            <CityChips />
            {/* ====================================================
                FILTERS
            ==================================================== */}
            <div className="sticky-filters">
                <Link
                    to="/events"
                    replace
                    className={
                        !type &&
                        !filter &&
                        !category &&
                        !city &&
                        !featured &&
                        !search
                            ? "filter-chip active"
                            : "filter-chip"
                    }
                >
                    All
                </Link>
                <Link
                    to="/events?filter=this-week"
                    replace
                    className={
                        filter === "this-week"
                            ? "filter-chip active"
                            : "filter-chip"
                    }
                >
                    This Week
                </Link>
                <Link
                    to="/events?type=Free"
                    replace
                    className={
                        type?.toLowerCase()
                            === "free"
                            ? "filter-chip active"
                            : "filter-chip"
                    }
                >
                    Free
                </Link>
                <Link
                    to="/events?type=Paid"
                    replace
                    className={
                        type?.toLowerCase()
                            === "paid"
                            ? "filter-chip active"
                            : "filter-chip"
                    }
                >
                    Paid
                </Link>
                <Link
                    to="/events?category=Music"
                    replace
                    className={
                        category?.toLowerCase()
                            === "music"
                            ? "filter-chip active"
                            : "filter-chip"
                    }
                >
                    Music
                </Link>
                <Link
                    to="/events?category=Sports"
                    replace
                    className={
                        category?.toLowerCase()
                            === "sports"
                            ? "filter-chip active"
                            : "filter-chip"
                    }
                >
                    Sports
                </Link>
                <Link
                    to="/events?category=Business"
                    replace
                    className={
                        category?.toLowerCase()
                            === "business"
                            ? "filter-chip active"
                            : "filter-chip"
                    }
                >
                    Business
                </Link>
            </div>
            {/* ====================================================
                EVENTS
            ==================================================== */}
            <div className="events-grid">
                {filteredEvents.length === 0 ? (
                    <div className="no-events-found">
                        <h2>
                            No events found
                        </h2>
                        <p>
                            We couldn't find any events
                            matching your search or filters.
                        </p>
                        <Link
                            to="/events"
                            replace
                            className="clear-events-filters"
                        >
                            Clear Filters
                        </Link>
                    </div>
                ) : (
                    paginatedEvents.map(
                        (event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                            />
                        )
                    )
                )}
            </div>
            {/* ====================================================
                PAGINATION
                Only displayed when more than one page exists.
            ==================================================== */}
            {totalPages > 1 && (
                <div
                    className="events-pagination"
                    aria-label="Events pagination"
                >
                    {/* PREVIOUS */}
                    <button
                        type="button"
                        className="pagination-btn pagination-prev"
                        onClick={() =>
                            goToPage(
                                currentPage - 1
                            )
                        }
                        disabled={
                            currentPage === 1
                        }
                        aria-label="Previous page"
                    >
                        <span aria-hidden="true">
                            ←
                        </span>
                        <span>
                            Previous
                        </span>
                    </button>
                    {/* PAGE NUMBERS */}
                    <div
                        className="pagination-pages"
                    >
                        {getPageNumbers().map(
                            (page, index) => {
                                if (
                                    page ===
                                    "left-ellipsis" ||
                                    page ===
                                    "right-ellipsis"
                                ) {
                                    return (
                                        <span
                                            key={`${page}-${index}`}
                                            className="pagination-ellipsis"
                                        >
                                            …
                                        </span>
                                    );
                                }
                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        className={
                                            page ===
                                            currentPage
                                                ? "pagination-btn active"
                                                : "pagination-btn"
                                        }
                                        onClick={() =>
                                            goToPage(
                                                page
                                            )
                                        }
                                        aria-current={
                                            page ===
                                            currentPage
                                                ? "page"
                                                : undefined
                                        }
                                        aria-label={`Page ${page}`}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                        )}
                    </div>
                    {/* NEXT */}
                    <button
                        type="button"
                        className="pagination-btn pagination-next"
                        onClick={() =>
                            goToPage(
                                currentPage + 1
                            )
                        }
                        disabled={
                            currentPage ===
                            totalPages
                        }
                        aria-label="Next page"
                    >
                        <span>
                            Next
                        </span>
                        <span aria-hidden="true">
                            →
                        </span>
                    </button>
                    {/* ====================================================
                        PAGINATION INFO
                    ==================================================== */}
                    <div className="pagination-info">
                        Showing{" "}
                        {startIndex + 1}–
                        {Math.min(
                            endIndex,
                            totalEvents
                        )}{" "}
                        of{" "}
                        {totalEvents} events
                    </div>
                </div>
            )}
        </div>
    );
}
export default Events;