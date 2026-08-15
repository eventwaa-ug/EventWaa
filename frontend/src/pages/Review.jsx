import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Review.css";

const API_URL = "http://localhost:5000";

function Review() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const event = location.state?.event;
  const ticket = location.state?.ticket;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!event) {
    return (
      <div className="review-page">
        <div className="review-empty">
          <div className="review-empty-icon">⭐</div>
          <h2>Event not found</h2>
          <p>We couldn't find the event you want to review.</p>
          <button onClick={() => navigate("/tickets")}>Back to My Tickets</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Please log in before submitting a review.");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a review.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          eventId: event.id,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit review.");
      }

      alert("Thank you! Your review has been submitted successfully.");
      navigate("/tickets");
    } catch (err) {
      console.error("REVIEW ERROR:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-page">
      <div className="review-header">
        <button className="review-back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <h1>Leave a Review</h1>
          <p>Share your experience with other EventWaa users.</p>
        </div>
      </div>

      <div className="review-container">
        <div className="review-event-card">
          <div className="review-event-icon">🎉</div>
          <div className="review-event-info">
            <span>EVENT</span>
            <h2>{event.title}</h2>
            <p>📅 {event.date}</p>
            <p>📍 {event.venue}, {event.city}</p>
            {ticket?.ticketType && <p>🎟️ {ticket.ticketType}</p>}
          </div>
        </div>

        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form-header">
            <h2>How was your experience?</h2>
            <p>Your feedback helps attendees discover great events.</p>
          </div>

          <div className="review-field">
            <label>Your rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={star <= (hover || rating) ? "star active" : "star"}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="review-field">
            <label>Your review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the event, organization, venue, and your overall experience..."
              rows="6"
            />
          </div>

          {error && <div className="review-error">{error}</div>}

          <div className="review-actions">
            <button
              type="button"
              className="review-cancel-btn"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>

            <button type="submit" className="review-submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Review;