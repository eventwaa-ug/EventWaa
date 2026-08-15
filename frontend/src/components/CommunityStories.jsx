import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CommunityStories.css";

const API_URL = "http://localhost:5000";

function CommunityStories() {

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const loadReviews = async () => {

      try {

        const response = await fetch(
          `${API_URL}/reviews`
        );

        const data = await response.json();

        if (response.ok && data.success) {

          setReviews(
            Array.isArray(data.reviews)
              ? data.reviews
              : []
          );

        }

      } catch (error) {

        console.error(
          "COMMUNITY REVIEWS ERROR:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    loadReviews();

  }, []);


  /*
   * Don't show the section while reviews
   * are still being loaded.
   */
  if (loading) {
    return null;
  }


  /*
   * Don't show fake testimonials.
   * If nobody has reviewed an event yet,
   * the section simply won't appear.
   */
  if (reviews.length === 0) {
    return null;
  }


  /*
   * Show the newest 6 reviews on homepage.
   */
  const displayedReviews = reviews.slice(0, 6);


  const getInitial = (name) => {

    if (!name) return "E";

    return name
      .trim()
      .charAt(0)
      .toUpperCase();

  };


  const renderStars = (rating) => {

    const numericRating = Number(rating) || 0;

    return (
      <div className="stars" aria-label={`${numericRating} out of 5 stars`}>

        {[1, 2, 3, 4, 5].map((star) => (

          <span
            key={star}
            className={
              star <= numericRating
                ? "star active"
                : "star"
            }
          >
            ★
          </span>

        ))}

      </div>
    );

  };


  return (

    <section className="community">

      <div className="community-header">

        <span className="community-eyebrow">
          REAL EXPERIENCES
        </span>

        <h2>
          What Our Community Says
        </h2>

        <p>
          See what people who have actually used
          EventWaa have to say about their experience.
        </p>

      </div>


      <div className="community-grid">

        {displayedReviews.map((review) => (

          <article
            className="community-card"
            key={review.id}
          >

            {/* USER */}

            <div className="review-user">

              <div className="profile-circle">

                {getInitial(review.userName)}

              </div>

              <div className="review-user-info">

                <h3>
                  {review.userName || "EventWaa User"}
                </h3>

                <span>
                  Verified Event Attendee
                </span>

              </div>

            </div>


            {/* RATING */}

            {renderStars(review.rating)}


            {/* EVENT */}

            {review.eventTitle && (

              <div className="review-event">

                Attended:{" "}
                <strong>
                  {review.eventTitle}
                </strong>

              </div>

            )}


            {/* COMMENT */}

            <p className="review-comment">

              "{review.comment}"

            </p>

          </article>

        ))}

      </div>


      {/* VIEW ALL */}

      {reviews.length > 6 && (

        <div className="community-footer">

          <Link
            to="/reviews"
            className="view-reviews-btn"
          >
            View All Reviews →
          </Link>

        </div>

      )}

    </section>

  );

}


export default CommunityStories;