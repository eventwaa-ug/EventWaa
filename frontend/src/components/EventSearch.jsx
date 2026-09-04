import {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  EventContext,
} from "../context/EventContext";

import {
  useNavigate,
} from "react-router-dom";

import {
  Search,
  MapPin,
  ArrowRight,
} from "lucide-react";

import "./EventSearch.css";


function EventSearch() {

  const { events } =
    useContext(EventContext);

  const navigate =
    useNavigate();


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    suggestions,
    setSuggestions,
  ] = useState([]);


  // ============================================================
  // SEARCH SUGGESTIONS
  // ============================================================

  useEffect(() => {

    const value =
      search.trim().toLowerCase();


    if (!value) {

      setSuggestions([]);

      return;

    }


    const results =
      (events || [])
        .filter((event) => {

          const searchableText = [

            event?.title,

            event?.city,

            event?.location,

            event?.venue,

            event?.category,

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return searchableText.includes(
            value
          );

        })
        .slice(0, 5);


    setSuggestions(results);

  }, [
    search,
    events,
  ]);


  // ============================================================
  // SEARCH
  // ============================================================

  const performSearch = () => {

    const value =
      search.trim();


    if (!value) {
      return;
    }


    navigate(
      `/events?search=${encodeURIComponent(
        value
      )}`
    );


    setSuggestions([]);

  };


  // ============================================================
  // ENTER
  // ============================================================

  const handleEnter = (event) => {

    if (
      event.key === "Enter"
    ) {

      performSearch();

    }

  };


  // ============================================================
  // OPEN EVENT
  // ============================================================

  const openEvent = (event) => {

    navigate(
      `/events/${event.id}`
    );


    setSearch("");

    setSuggestions([]);

  };


  return (

    <div className="event-search-wrapper">


      {/* ======================================================
          SEARCH BAR
      ====================================================== */}

      <div
        className={`search-box ${
          search.trim()
            ? "has-search"
            : ""
        }`}
      >

        {/* LEFT SEARCH ICON */}

        <Search
          className="search-main-icon"
          size={21}
          strokeWidth={2}
          aria-hidden="true"
        />


        {/* INPUT */}

        <input
          type="text"
          value={search}
          placeholder="Search events, cities, venues..."
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          onKeyDown={
            handleEnter
          }
          aria-label="Search events"
        />


        {/* SEARCH BUTTON */}

        <button
          type="button"
          className="search-submit"
          onClick={
            performSearch
          }
          aria-label="Search"
        >

          <Search
            size={19}
            strokeWidth={2.4}
          />

          <span>
            Search
          </span>

        </button>

      </div>


      {/* ======================================================
          SUGGESTIONS
      ====================================================== */}

      {suggestions.length > 0 && (

        <div className="search-results">


          <div className="search-results-heading">

            <span>
              Events
            </span>

          </div>


          {suggestions.map(
            (event) => (

              <button
                type="button"
                className="search-item"
                key={event.id}
                onClick={() =>
                  openEvent(event)
                }
              >


                {/* EVENT SEARCH ICON */}

                <div className="search-item-icon">

                  <Search
                    size={18}
                    strokeWidth={2}
                  />

                </div>


                {/* EVENT INFORMATION */}

                <div className="search-item-content">

                  <strong>
                    {event.title ||
                      "Untitled Event"}
                  </strong>


                  {(event.city ||
                    event.location ||
                    event.venue) && (

                    <span className="search-item-location">

                      <MapPin
                        size={14}
                        strokeWidth={2}
                      />

                      <span>
                        {event.city ||
                          event.location ||
                          event.venue}
                      </span>

                    </span>

                  )}

                </div>


                {/* ARROW */}

                <ArrowRight
                  className="search-item-arrow"
                  size={17}
                  strokeWidth={2}
                />

              </button>

            )
          )}

        </div>

      )}

    </div>

  );

}


export default EventSearch;