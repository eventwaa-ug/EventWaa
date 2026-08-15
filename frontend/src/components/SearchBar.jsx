import { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { EventContext } from "../context/EventContext";
import "./SearchBar.css";

function SearchBar() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { events } = useContext(EventContext);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];

    const query = search.toLowerCase();

    return (events || [])
      .filter((event) =>
        event.title?.toLowerCase().includes(query) ||
        event.venue?.toLowerCase().includes(query) ||
        event.city?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [search, events]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/events?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSuggestionClick = (event) => {
    navigate(`/events/${event.id}`);
    setSearch("");
  };

  return (
    <div className="search-container">
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search events, venues, cities, or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="submit">
          🔍
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((event) => (
            <div
              key={event.id}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(event)}
            >
              <strong>{event.title}</strong>
              <span>
                {event.venue}, {event.city}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;