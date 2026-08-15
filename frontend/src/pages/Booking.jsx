import { useParams, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import "../styles/Booking.css";

const API_URL = "http://localhost:5000";

function Booking() {
  const [processing, setProcessing] = useState(false);

  const { id } = useParams();
  const location = useLocation();

  const { events } = useContext(EventContext);
  const { user } = useAuth();

  const selectedTicket = location.state?.ticket;

  const event = events.find(
    (item) => Number(item.id) === Number(id)
  );

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");

  if (!user) {
    return (
      <div className="booking-message">
        <h2>Please Login to book a ticket</h2>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="booking-message">
        <h2>Event not found</h2>
      </div>
    );
  }

  if (!selectedTicket) {
    return (
      <div className="booking-message">
        <h2>Please select a ticket type</h2>
      </div>
    );
  }

  const SERVICE_FEE_PERCENT = 5;

  const subtotal = Number(selectedTicket.price || 0) * quantity;
  const serviceFee = Math.round((subtotal * SERVICE_FEE_PERCENT) / 100);
  const totalPrice = subtotal + serviceFee;

  const getPosterUrl = (event) => {
    const poster =
      event?.eventPoster ||
      event?.image ||
      event?.poster ||
      "";

    if (!poster) {
      return "/event-placeholder.jpg";
    }

    const imagePath = String(poster).trim();

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return API_URL + imagePath;
    }

    return API_URL + "/" + imagePath;
  };

  const eventImage = getPosterUrl(event);

  const handlePayment = async () => {
    if (processing) return;

    setProcessing(true);

    try {
      const response = await fetch(
        API_URL + "/payments/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: event.id,
            ticketType: selectedTicket.name,
            quantity,
            userId: user.id,
            buyer: {
              name: user.name,
              email: user.email,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.message ||
            "Unable to initialize payment."
        );
        return;
      }

      const checkoutLink =
        result.payment?.checkoutLink;

      if (!checkoutLink) {
        alert(
          "Flutterwave checkout link was not returned."
        );
        return;
      }

      sessionStorage.setItem(
        "eventwaa_pending_payment",
        JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          ticket: selectedTicket,
          quantity,
          totalPrice:
            result.payment?.amount || totalPrice,
          txRef: result.payment?.txRef,
        })
      );

      window.location.href = checkoutLink;
    } catch (error) {
      console.error(
        "PAYMENT INITIALIZATION ERROR:",
        error
      );
      alert(
        "Unable to start payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-card">
        <div className="booking-event-image">
          <img
            src={eventImage}
            alt={event.title}
            onError={(e) => {
              e.currentTarget.src =
                "/event-placeholder.jpg";
            }}
          />
        </div>

        <div className="booking-event-info">
          <span className="booking-label">
            BOOKING
          </span>

          <h1>{event.title}</h1>

          <div className="event-meta">
            <p>
              📍 {event.venue}, {event.city}
            </p>
            <p>📅 {event.date}</p>
            <p>
              ⏰ {event.startTime} - {event.endTime}
            </p>
          </div>
        </div>

        <hr />

        <h2>🛒 Order Summary</h2>

        <div className="selected-ticket-box">
          <div>
            <span>Ticket</span>
            <strong>{selectedTicket.name}</strong>
          </div>

          <strong>
            UGX{" "}
            {Number(
              selectedTicket.price
            ).toLocaleString()}
          </strong>
        </div>

        <div className="summary-row quantity-row">
          <span>Quantity</span>

          <div className="quantity-controls">
            <button
              type="button"
              disabled={processing}
              onClick={() =>
                setQuantity((q) =>
                  Math.max(1, q - 1)
                )
              }
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              disabled={processing}
              onClick={() =>
                setQuantity((q) => q + 1)
              }
            >
              +
            </button>
          </div>
        </div>

        <div className="summary-row">
          <span>Subtotal</span>

          <strong>
            UGX {subtotal.toLocaleString()}
          </strong>
        </div>

        <div className="summary-row">
          <span>
            Service Fee ({SERVICE_FEE_PERCENT}%)
          </span>

          <strong>
            UGX {serviceFee.toLocaleString()}
          </strong>
        </div>

        <hr />

        <div className="summary-row total-row">
          <span>Total</span>

          <strong>
            UGX {totalPrice.toLocaleString()}
          </strong>
        </div>

        <hr />

        <h2>💳 Payment Method</h2>

        <div className="payment-options">
          <label>
            <input
              type="radio"
              name="payment"
              value="mtn"
              checked={paymentMethod === "mtn"}
              disabled={processing}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
            />
            <span>MTN Mobile Money</span>
          </label>

          <label>
            <input
              type="radio"
              name="payment"
              value="airtel"
              checked={
                paymentMethod === "airtel"
              }
              disabled={processing}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
            />
            <span>Airtel Money</span>
          </label>

          <label>
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === "card"}
              disabled={processing}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
            />
            <span>Visa / Mastercard</span>
          </label>
        </div>

        {paymentMethod !== "card" && (
          <div className="phone-section">
            <label>Phone Number</label>

            <input
              type="tel"
              placeholder="+256 7XX XXX XXX"
              value={phoneNumber}
              disabled={processing}
              onChange={(e) =>
                setPhoneNumber(
                  e.target.value
                )
              }
            />
          </div>
        )}

        <button
          className="pay-btn"
          onClick={handlePayment}
          disabled={processing}
        >
          {processing
            ? "Starting Payment..."
            : "Continue to Payment • UGX " +
              totalPrice.toLocaleString()}
        </button>

        <p className="secure-payment">
          🔒 Secure payment powered by EventWaa
        </p>
      </div>
    </div>
  );
}

export default Booking;