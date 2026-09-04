import { useNavigate } from "react-router-dom";
import {
  Music2,
  Trophy,
  Drama,
  BriefcaseBusiness,
  Utensils,
  Palette,
  ArrowUpRight,
} from "lucide-react";
import "./BrowseCategories.css";
function BrowseCategories() {
  const navigate = useNavigate();
  const categories = [
    {
      name: "Music",
      icon: Music2,
      description:
        "Concerts, festivals and live performances",
    },
    {
      name: "Sports",
      icon: Trophy,
      description:
        "Matches, tournaments and fitness events",
    },
    {
      name: "Culture",
      icon: Drama,
      description:
        "Traditional events and celebrations",
    },
    {
      name: "Business",
      icon: BriefcaseBusiness,
      description:
        "Networking and business events",
    },
    {
      name: "Food",
      icon: Utensils,
      description:
        "Food experiences and gatherings",
    },
    {
      name: "Workshop",
      icon: Palette,
      description:
        "Learning and creative sessions",
    },
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
        {categories.map((category) => {
          const Icon =
            category.icon;
          return (
            <button
              key={category.name}
              type="button"
              className="category-card"
              onClick={() =>
                handleCategoryClick(
                  category.name
                )
              }
            >
              <div className="category-icon">
                <Icon
                  size={22}
                  strokeWidth={1.9}
                />
              </div>
              <div className="category-content">
                <h3>
                  {category.name}
                </h3>
                <p>
                  {category.description}
                </p>
              </div>
              <span className="category-arrow">
                <ArrowUpRight
                  size={17}
                  strokeWidth={2}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
export default BrowseCategories;