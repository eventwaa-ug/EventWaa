import { Link } from "react-router-dom";

import { useFavorites } from "../context/FavoritesContext";

import "./EventCard.css";

function EventCard({ event }) {

    // ============================================================

    // FAVORITES

    // ============================================================

    const {

        addFavorite,

        removeFavorite,

        isFavorite

    } = useFavorites();

    const favorite = isFavorite(event.id);

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

        if (

            image.startsWith("http://") ||

            image.startsWith("https://")

        ) {

            return image;

        }

        return `${BACKEND_URL}${image}`;

    };

    // ============================================================

    // EVENT PRICE

    // ============================================================

    const getEventPrice = () => {

        if (

            event.eventType?.toLowerCase() === "free" ||

            event.ticketType?.toLowerCase() === "free"

        ) {

            return "Free Entry";

        }

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

        if (Number(event.price) > 0) {

            return `UGX ${Number(event.price).toLocaleString()}`;

        }

        return "Price unavailable";

    };

    // ============================================================

    // FAVORITE TOGGLE

    // ============================================================

    const handleFavorite = (e) => {

        // Prevent clicking the heart from

        // triggering anything around the card.

        e.preventDefault();

        e.stopPropagation();

        if (favorite) {

            removeFavorite(event.id);

        } else {

            addFavorite(event);

        }

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

                    FAVORITE BUTTON

                ================================================= */}

                <button

                    type="button"

                    className={`favorite-button ${

                        favorite ? "favorite-active" : ""

                    }`}

                    onClick={handleFavorite}

                    aria-label={

                        favorite

                            ? "Remove from favorites"

                            : "Add to favorites"

                    }

                >

                    {favorite ? "❤️" : "♡"}

                </button>

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