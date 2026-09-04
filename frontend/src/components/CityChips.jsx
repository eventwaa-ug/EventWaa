import { useLocation, useNavigate } from "react-router-dom";
import {
    MapPin,
    ChevronRight
} from "lucide-react";
import "./CityChips.css";
function CityChips() {
    const navigate = useNavigate();
    const location = useLocation();
    const cities = [
        "Gulu",
        "Kampala",
        "Lira",
        "Arua",
        "Adjumani",
        "Jinja",
        "Mbarara"
    ];
    const params = new URLSearchParams(
        location.search
    );
    const activeCity = params.get("city");
    const selectCity = (city) => {
        const newParams = new URLSearchParams(
            location.search
        );
        if (activeCity === city) {
            newParams.delete("city");
        } else {
            newParams.set("city", city);
        }
        navigate(
            `/events?${newParams.toString()}`
        );
    };
    /*
     * Don't show the More button on /events
     * because the user is already on the
     * complete event discovery/search page.
     */
    const isEventsPage =
        location.pathname === "/events";
    return (
        <section className="city-chips-section">
            <div className="city-chips-header">
                <h2>
                    Explore Events by City
                </h2>
                <p>
                    Find events happening across Uganda
                </p>
            </div>
            <div className="city-chips-wrapper">
                <div className="city-chips">
                    {cities.map((city) => (
                        <button
                            key={city}
                            type="button"
                            className={
                                activeCity === city
                                    ? "city-chip active"
                                    : "city-chip"
                            }
                            onClick={() =>
                                selectCity(city)
                            }
                        >
                            <MapPin
                                className="city-chip-icon"
                                size={16}
                                strokeWidth={2.2}
                            />
                            <span>
                                {city}
                            </span>
                        </button>
                    ))}
                </div>
                {/* =================================================
                    MORE
                    Hidden on /events
                    Visible on desktop + mobile elsewhere
                ================================================= */}
                {!isEventsPage && (
                    <button
                        type="button"
                        className="city-more-button"
                        onClick={() =>
                            navigate("/events")
                        }
                    >
                        <span>
                            More
                        </span>
                        <ChevronRight
                            size={17}
                            strokeWidth={2.3}
                        />
                    </button>
                )}
            </div>
        </section>
    );
}
export default CityChips;