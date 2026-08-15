import { Link } from "react-router-dom";
import "./EventCard.css";

function EventCard({ event }) {

    // ============================================================
    // BACKEND URL
    // ============================================================

    const BACKEND_URL = "http://localhost:5000";


    // ============================================================
    // EVENT IMAGE
    // ============================================================

    const getImageUrl = () => {

        const image =
            event.eventPoster ||
            event.image;

        if (!image) {
            return "/default-event.jpg";
        }

        // Already a full URL
        if (
            image.startsWith("http://") ||
            image.startsWith("https://")
        ) {
            return image;
        }

        // Relative path from backend
        return `${BACKEND_URL}${image}`;
    };


    // ============================================================
    // EVENT PRICE
    // ============================================================

    const getEventPrice = () => {

        // Free event
        if (
            event.eventType?.toLowerCase() === "free" ||
            event.ticketType?.toLowerCase() === "free"
        ) {
            return "Free Entry";
        }

        // Use ticket types
        if (
            Array.isArray(event.tickets) &&
            event.tickets.length > 0
        ) {

            const prices = event.tickets

                .map(ticket => Number(ticket.price))

                .filter(price => price > 0);

            if (prices.length > 0) {

                const lowestPrice =
                    Math.min(...prices);

                return `From UGX ${lowestPrice.toLocaleString()}`;
            }
        }

        // Older events fallback
        if (Number(event.price) > 0) {
            return `UGX ${Number(event.price).toLocaleString()}`;
        }

        return "Price unavailable";
    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="event-card">

            {/* ====================================================
                EVENT IMAGE
            ==================================================== */}

            <div className="event-image-wrapper">

                <img
                    src={getImageUrl()}
                    alt={event.title || "Event poster"}
                    className="event-image"
                    onError={(e) => {
                        e.currentTarget.src =
                            "/default-event.jpg";
                    }}
                />

                {/* =================================================
                    EVENT TYPE
                ================================================= */}

                <span
                    className={`event-type ${
                        event.eventType === "Free"
                            ? "free"
                            : "paid"
                    }`}
                >

                    {event.eventType === "Free"
                        ? "FREE"
                        : "PAID"}

                </span>

                {/* =================================================
                    VERIFIED HOST
                ================================================= */}

                {event.verifiedHost && (

                    <span className="verified-host">

                        ✅ Verified

                    </span>

                )}

            </div>


            {/* ====================================================
                EVENT CONTENT
            ==================================================== */}

            <div className="event-card-content">

                <h3>
                    {event.title}
                </h3>

                <p className="event-location">

                    📍 {event.city || event.location}

                </p>

                <p className="event-date">

                    📅 {event.date}

                </p>

                <p className="event-price">

                    {getEventPrice()}

                </p>

                {/* =================================================
                    VIEW DETAILS
                ================================================= */}

                <Link
                    to={`/events/${event.id}`}
                    className="view-details-btn"
                >

                    View Tickets →

                </Link>

            </div>

        </div>

    );
}

export default EventCard;