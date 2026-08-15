import { useNavigate, useLocation } from "react-router-dom";
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
                        onClick={() => selectCity(city)}
                    >

                        <span className="city-icon">
                            📍
                        </span>

                        {city}

                    </button>

                ))}

            </div>

        </section>

    );

}

export default CityChips;