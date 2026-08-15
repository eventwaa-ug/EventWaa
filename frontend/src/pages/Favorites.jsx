import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import "./Favorites.css";

function Favorites() {

    const {
        favorites,
        removeFavorite
    } = useFavorites();


    // ============================================================
    // BACKEND URL
    // ============================================================

    const BACKEND_URL = "http://localhost:5000";


    // ============================================================
    // EVENT IMAGE
    // ============================================================

    const getImageUrl = (event) => {

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

        // Backend relative path
        return `${BACKEND_URL}${image}`;
    };


    // ============================================================
    // EVENT PRICE
    // ============================================================

    const getEventPrice = (event) => {

        // Free event
        if (
            event.eventType?.toLowerCase() === "free" ||
            event.ticketType?.toLowerCase() === "free"
        ) {
            return "Free Entry";
        }


        // Ticket types
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


        // Older events
        if (Number(event.price) > 0) {

            return `UGX ${Number(
                event.price
            ).toLocaleString()}`;

        }


        return "Price unavailable";
    };


    // ============================================================
    // REMOVE FAVORITE
    // ============================================================

    const handleRemove = (id) => {

        removeFavorite(id);

    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="favorites-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="favorites-header">

                <div>

                    <span className="favorites-eyebrow">
                        YOUR EVENTS
                    </span>

                    <h1>
                        Favorite Events
                    </h1>

                    <p>
                        Events you've saved for later.
                    </p>

                </div>

                {favorites.length > 0 && (

                    <div className="favorites-count">

                        {favorites.length}{" "}
                        {favorites.length === 1
                            ? "Event"
                            : "Events"}

                    </div>

                )}

            </div>


            {/* ====================================================
                EMPTY STATE
            ==================================================== */}

            {favorites.length === 0 ? (

                <div className="empty-favorites">

                    <div className="empty-favorites-icon">
                        ♡
                    </div>

                    <h2>
                        No favorite events yet
                    </h2>

                    <p>
                        When you find an event you love,
                        tap the heart to save it here.
                    </p>

                    <Link
                        to="/events"
                        className="browse-events-btn"
                    >
                        Browse Events →
                    </Link>

                </div>

            ) : (

                /* ==================================================
                   FAVORITES GRID
                ================================================== */

                <div className="favorites-grid">

                    {favorites.map((event) => (

                        <article
                            className="favorite-card"
                            key={event.id}
                        >

                            {/* ====================================
                                EVENT IMAGE
                            ==================================== */}

                            <div className="favorite-image-wrapper">

                                <img
                                    src={getImageUrl(event)}
                                    alt={
                                        event.title ||
                                        "Event poster"
                                    }
                                    className="favorite-image"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            "/default-event.jpg";
                                    }}
                                />


                                {/* EVENT TYPE */}

                                <span
                                    className={`favorite-event-type ${
                                        event.eventType?.toLowerCase() ===
                                        "free"
                                            ? "free"
                                            : "paid"
                                    }`}
                                >

                                    {event.eventType?.toLowerCase() ===
                                    "free"
                                        ? "FREE"
                                        : "PAID"}

                                </span>


                                {/* VERIFIED HOST */}

                                {event.verifiedHost && (

                                    <span className="favorite-verified">

                                        ✅ Verified

                                    </span>

                                )}


                                {/* REMOVE FAVORITE */}

                                <button
                                    type="button"
                                    className="favorite-remove-button"
                                    onClick={() =>
                                        handleRemove(event.id)
                                    }
                                    aria-label="Remove from favorites"
                                >
                                    ❤️
                                </button>

                            </div>


                            {/* ====================================
                                EVENT CONTENT
                            ==================================== */}

                            <div className="favorite-info">

                                <h3>
                                    {event.title}
                                </h3>


                                <p className="favorite-location">

                                    📍{" "}

                                    {event.city ||
                                        event.location ||
                                        "Location not specified"}

                                </p>


                                <p className="favorite-date">

                                    📅{" "}

                                    {event.date ||
                                        "Date not specified"}

                                </p>


                                <p className="favorite-price">

                                    {getEventPrice(event)}

                                </p>


                                {/* ACTIONS */}

                                <div className="favorite-actions">

                                    <Link
                                        to={`/events/${event.id}`}
                                        className="details-btn"
                                    >
                                        View Tickets →
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemove(
                                                event.id
                                            )
                                        }
                                        className="remove-btn"
                                    >
                                        Remove
                                    </button>

                                </div>

                            </div>

                        </article>

                    ))}

                </div>

            )}

        </div>

    );
}

export default Favorites;