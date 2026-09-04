import { Link } from "react-router-dom";

import {
    CheckCircle,
    MapPin,
    CalendarDays,
    Ticket
} from "lucide-react";

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

        // --------------------------------------------------------
        // FREE EVENT
        // --------------------------------------------------------

        if (
            event.eventType?.toLowerCase() === "free" ||
            event.ticketType?.toLowerCase() === "free"
        ) {
            return "Free Entry";
        }


        // --------------------------------------------------------
        // TICKET TYPES
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // LEGACY EVENT PRICE
        // --------------------------------------------------------

        if (Number(event.price) > 0) {

            return `UGX ${Number(
                event.price
            ).toLocaleString()}`;
        }


        return "Price unavailable";
    };


    // ============================================================
    // FAVORITE TOGGLE
    // ============================================================

    const handleFavorite = (e) => {

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
                EVENT POSTER
            ==================================================== */}

            <div className="event-image-wrapper">

                <img
                    src={getImageUrl()}
                    alt={
                        event.title ||
                        "Event poster"
                    }
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
                        favorite
                            ? "favorite-active"
                            : ""
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
                        event.eventType?.toLowerCase() === "free"
                            ? "free"
                            : "paid"
                    }`}
                >

                    {event.eventType?.toLowerCase() === "free"
                        ? "FREE"
                        : "PAID"}

                </span>


                {/* =================================================
                    VERIFIED HOST
                ================================================= */}

                {event.verifiedHost && (

                    <span className="verified-host">

                        <CheckCircle
                            size={15}
                            strokeWidth={2.5}
                        />

                        Verified

                    </span>

                )}

            </div>


            {/* ====================================================
                EVENT CONTENT
            ==================================================== */}

            <div className="event-card-content">


                {/* =================================================
                    TITLE
                ================================================= */}

                <h3>
                    {event.title}
                </h3>


                {/* =================================================
                    LOCATION
                ================================================= */}

                <p className="event-location">

                    <MapPin
                        size={17}
                        strokeWidth={2}
                    />

                    <span>
                        {event.city ||
                            event.location ||
                            "Location not specified"}
                    </span>

                </p>


                {/* =================================================
                    DATE
                ================================================= */}

                <p className="event-date">

                    <CalendarDays
                        size={17}
                        strokeWidth={2}
                    />

                    <span>
                        {event.date ||
                            "Date not specified"}
                    </span>

                </p>


                {/* =================================================
                    PRICE
                ================================================= */}

                <p className="event-price">

                    {getEventPrice()}

                </p>


                {/* =================================================
                    VIEW TICKETS
                ================================================= */}

                <Link
                    to={`/events/${event.id}`}
                    className="view-details-btn"
                >

                    <Ticket
                        size={17}
                        strokeWidth={2.3}
                    />

                    <span>
                        View Tickets
                    </span>

                    <span className="view-arrow">
                        →
                    </span>

                </Link>


            </div>

        </div>

    );
}


export default EventCard;