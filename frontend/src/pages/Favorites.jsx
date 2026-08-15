import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import "./Favorites.css";

function Favorites() {

    const {
        favorites,
        removeFavorite
    } = useFavorites();

    return (
        <div className="favorites-page">

            <h1>Favorite Events</h1>

            {favorites.length === 0 ? (

                <p>No favorite events yet.</p>

            ) : (

                favorites.map((event) => (

                    <div
                        className="favorite-card"
                        key={event.id}
                    >

                        <img
                            src={event.image}
                            alt={event.title}
                        />

                        <div className="favorite-info">

                            <h3>{event.title}</h3>

                            <p>{event.date}</p>

                            <p>{event.location}</p>

                            <p>UGX {event.price}</p>

                            <div className="favorite-actions">

                                <Link
                                    to={`/events/${event.id}`}
                                    className="details-btn"
                                >
                                    View Details
                                </Link>

                                <button
                                    onClick={() => removeFavorite(event.id)}
                                    className="remove-btn"
                                >
                                    Remove
                                </button>

                            </div>

                        </div>

                    </div>

                ))

            )}

        </div>
    );
}

export default Favorites;