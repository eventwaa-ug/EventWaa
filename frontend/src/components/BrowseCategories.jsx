import { useNavigate } from "react-router-dom";
import "./BrowseCategories.css";

function BrowseCategories() {

  const navigate = useNavigate();

  const categories = [
    {
      name: "Music",
      icon: "🎵",
      description: "Concerts, festivals and live performances"
    },

    {
      name: "Sports",
      icon: "⚽",
      description: "Matches, tournaments and fitness events"
    },

    {
      name: "Culture",
      icon: "🎭",
      description: "Traditional events and celebrations"
    },

    {
      name: "Business",
      icon: "💼",
      description: "Networking and business events"
    },

    {
      name: "Food",
      icon: "🍔",
      description: "Food experiences and gatherings"
    },

    {
      name: "Workshop",
      icon: "🎨",
      description: "Learning and creative sessions"
    }
  ];



  const handleCategoryClick = (category) => {

    navigate(
      `/events?category=${encodeURIComponent(category)}`
    );

  };



  return (

    <section className="browse-categories">

      <div className="section-header">

        <span className="badge">
          Explore
        </span>

        <h2>
          Browse by Category
        </h2>

        <p>
          Find experiences that match your interests
        </p>

      </div>



      <div className="category-grid">

        {categories.map((category) => (

          <button
            key={category.name}
            className="category-card"
            onClick={() => handleCategoryClick(category.name)}
          >

            <div className="category-icon">
              {category.icon}
            </div>

            <h3>
              {category.name}
            </h3>

            <p>
              {category.description}
            </p>

            <span className="category-arrow">
              Explore →
            </span>

          </button>

        ))}

      </div>

    </section>

  );
}

export default BrowseCategories;