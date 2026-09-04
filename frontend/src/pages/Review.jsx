import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  MapPin,
  Send,
  Star,
  Ticket,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "../styles/Review.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function Review() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const passedEvent = location.state?.event;
  const ticket = location.state?.ticket;

  const [event, setEvent] = useState(passedEvent || null);

  const [loadingEvent, setLoadingEvent] = useState(
    !passedEvent && !!ticket?.eventId
  );

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD ACTUAL EVENT
  //
  // This is important because Tickets.jsx only passes:
  //
  // id
  // title
  // date
  // venue
  // city
  //
  // It does NOT pass eventPoster.
  //
  // Therefore we retrieve the complete event from the backend.
  // ============================================================

  useEffect(() => {
    if (passedEvent) {
      setEvent(passedEvent);
      setLoadingEvent(false);
      return;
    }

    if (!ticket?.eventId) {
      setLoadingEvent(false);
      return;
    }

    let mounted = true;

    const loadEvent = async () => {
      try {
        setLoadingEvent(true);

        const response = await fetch(
          `${API_URL}/events/${ticket.eventId}`
        );

        if (!response.ok) {
          throw new Error("Unable to load event.");
        }

        const data = await response.json();

        const loadedEvent =
          data?.event ||
          data?.data ||
          data;

        if (mounted) {
          setEvent(loadedEvent);
        }
      } catch (err) {
        console.error(
          "REVIEW EVENT LOAD ERROR:",
          err
        );

        // --------------------------------------------------------
        // FALLBACK
        //
        // Even if the event endpoint fails, use the information
        // already supplied by Tickets.jsx.
        // --------------------------------------------------------

        if (mounted && ticket) {
          setEvent({
            id: ticket.eventId,
            title: ticket.eventTitle,
            date:
              ticket.eventDate ||
              ticket.date,
            venue:
              ticket.eventVenue ||
              ticket.venue,
            city:
              ticket.eventCity ||
              ticket.city,

            // Try poster information from the ticket too.
            eventPoster:
              ticket.eventPoster ||
              ticket.image,
            image:
              ticket.image ||
              ticket.eventPoster,
          });
        }
      } finally {
        if (mounted) {
          setLoadingEvent(false);
        }
      }
    };

    loadEvent();

    return () => {
      mounted = false;
    };
  }, [passedEvent, ticket]);

  // ============================================================
  // EVENT POSTER
  // ============================================================

  const getPosterUrl = () => {
    const poster =
      event?.eventPoster ||
      event?.image ||
      ticket?.eventPoster ||
      ticket?.image;

    if (!poster) {
      return "";
    }

    const imagePath = String(poster).trim();

    if (!imagePath) {
      return "";
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return `${API_URL}${imagePath}`;
    }

    return `${API_URL}/${imagePath}`;
  };

  const posterUrl = getPosterUrl();

  // ============================================================
  // SUBMIT REVIEW
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!user) {
      setError(
        "Please log in before submitting a review."
      );
      return;
    }

    if (!rating) {
      setError(
        "Please select a rating."
      );
      return;
    }

    if (!comment.trim()) {
      setError(
        "Please write a review."
      );
      return;
    }

    if (!event?.id) {
      setError(
        "We could not identify this event."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/reviews`,
        {
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
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit review."
        );
      }

      alert(
        "Thank you! Your review has been submitted successfully."
      );

      navigate("/tickets");
    } catch (err) {
      console.error(
        "REVIEW ERROR:",
        err
      );

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // EVENT NOT FOUND
  // ============================================================

  if (!event && !loadingEvent) {
    return (
      <div className="review-page">

        <div className="review-empty">

          <div className="review-empty-icon">
            <Ticket size={42} />
          </div>

          <h2>
            Event not found
          </h2>

          <p>
            We couldn't find the event you want
            to review.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/tickets")
            }
          >
            <ArrowLeft size={18} />
            Back to My Tickets
          </button>

        </div>

      </div>
    );
  }

  // ============================================================
  // LOADING EVENT
  // ============================================================

  if (loadingEvent) {
    return (
      <div className="review-page">

        <div className="review-loading">

          <div className="review-spinner"></div>

          <h2>
            Loading event...
          </h2>

          <p>
            Preparing your review page.
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // EVENT DATA
  // ============================================================

  const eventTitle =
    event?.title ||
    event?.eventTitle ||
    ticket?.eventTitle ||
    "EventWaa Event";

  const eventDate =
    event?.date ||
    event?.eventDate ||
    ticket?.eventDate ||
    ticket?.date ||
    "Date not available";

  const eventVenue =
    event?.venue ||
    event?.eventVenue ||
    ticket?.eventVenue ||
    ticket?.venue ||
    "Venue not available";

  const eventCity =
    event?.city ||
    event?.eventCity ||
    ticket?.eventCity ||
    ticket?.city ||
    "";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="review-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="review-header">

        <button
          type="button"
          className="review-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="review-header-text">

          <span className="review-eyebrow">
            EVENTWAA
          </span>

          <h1>
            Leave a Review
          </h1>

          <p>
            Share your experience with other
            EventWaa users.
          </p>

        </div>

      </div>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="review-container">


        {/* ====================================================
            EVENT CARD
        ==================================================== */}

        <div className="review-event-card">

          {/* ==================================================
              POSTER
          ================================================== */}

          <div className="review-poster-wrapper">

            {posterUrl ? (

              <img
                src={posterUrl}
                alt={eventTitle}
                className="review-event-poster"
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";

                  const fallback =
                    e.currentTarget
                      .parentElement
                      ?.querySelector(
                        ".review-poster-fallback"
                      );

                  if (fallback) {
                    fallback.style.display =
                      "flex";
                  }
                }}
              />

            ) : null}

            <div
              className="review-poster-fallback"
              style={{
                display: posterUrl
                  ? "none"
                  : "flex",
              }}
            >
              <Ticket size={38} />
            </div>

          </div>


          {/* ==================================================
              EVENT INFORMATION
          ================================================== */}

          <div className="review-event-info">

            <span className="review-event-label">
              EVENT
            </span>

            <h2>
              {eventTitle}
            </h2>


            <div className="review-event-meta">

              <div>
                <CalendarDays
                  size={18}
                  strokeWidth={2.2}
                />

                <span>
                  {eventDate}
                </span>
              </div>


              <div>
                <MapPin
                  size={18}
                  strokeWidth={2.2}
                />

                <span>
                  {eventVenue}
                  {eventCity
                    ? `, ${eventCity}`
                    : ""}
                </span>
              </div>


              {ticket?.ticketType && (

                <div>
                  <Ticket
                    size={18}
                    strokeWidth={2.2}
                  />

                  <span>
                    {ticket.ticketType}
                  </span>
                </div>

              )}

            </div>

          </div>

        </div>


        {/* ====================================================
            REVIEW FORM
        ==================================================== */}

        <form
          className="review-form"
          onSubmit={handleSubmit}
        >

          <div className="review-form-header">

            <div className="review-form-icon">
              <Star size={25} />
            </div>

            <div>

              <h2>
                How was your experience?
              </h2>

              <p>
                Your feedback helps attendees
                discover great events.
              </p>

            </div>

          </div>


          {/* ==================================================
              RATING
          ================================================== */}

          <div className="review-field">

            <label>
              Your rating
            </label>

            <div
              className="star-rating"
              aria-label="Event rating"
            >

              {[1, 2, 3, 4, 5].map(
                (star) => (

                  <button
                    type="button"
                    key={star}
                    className={`star ${
                      star <=
                      (hover || rating)
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setRating(star)
                    }
                    onMouseEnter={() =>
                      setHover(star)
                    }
                    onMouseLeave={() =>
                      setHover(0)
                    }
                    aria-label={`${star} star${
                      star > 1
                        ? "s"
                        : ""
                    }`}
                  >
                    <Star
                      size={38}
                      strokeWidth={2}
                      fill={
                        star <=
                        (hover || rating)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                )
              )}

            </div>

            {rating > 0 && (

              <div className="rating-selected">

                <CheckCircle
                  size={16}
                />

                <span>
                  {rating === 1 &&
                    "Poor experience"}

                  {rating === 2 &&
                    "Could be better"}

                  {rating === 3 &&
                    "It was okay"}

                  {rating === 4 &&
                    "Great experience"}

                  {rating === 5 &&
                    "Excellent experience"}

                </span>

              </div>

            )}

          </div>


          {/* ==================================================
              COMMENT
          ================================================== */}

          <div className="review-field">

            <label htmlFor="review-comment">
              Your review
            </label>

            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              placeholder="Tell us about the event, organization, venue, and your overall experience..."
              rows={7}
              maxLength={1000}
            />

            <div className="review-character-count">
              {comment.length}/1000
            </div>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="review-error">

              <span>!</span>

              <p>
                {error}
              </p>

            </div>

          )}


          {/* ==================================================
              REVIEWER
          ================================================== */}

          {user && (

            <div className="review-user">

              <div className="review-user-icon">
                <UserRound size={19} />
              </div>

              <div>

                <span>
                  Reviewing as
                </span>

                <strong>
                  {user.name ||
                    user.email}
                </strong>

              </div>

            </div>

          )}


          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="review-actions">

            <button
              type="button"
              className="review-cancel-btn"
              onClick={() =>
                navigate(-1)
              }
              disabled={submitting}
            >
              <ArrowLeft size={18} />

              Cancel
            </button>


            <button
              type="submit"
              className="review-submit-btn"
              disabled={submitting}
            >

              {submitting ? (

                <>
                  <span className="review-button-spinner"></span>

                  Submitting...
                </>

              ) : (

                <>
                  <Send size={18} />

                  Submit Review
                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default Review;