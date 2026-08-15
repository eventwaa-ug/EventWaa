import { useParams, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import "../styles/Booking.css";

const API_URL = "http://localhost:5000";

function Booking() {
  const { id } = useParams();
  const location = useLocation();

  const { events } = useContext(EventContext);
  const { user } = useAuth();

  const selectedTicket = location.state?.ticket;

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  const event = events.find(
    (item) => Number(item.id) === Number(id)
  );

  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  if (!user) {
    return (
      <div className="booking-message">
        <h2>Please Login to book a ticket</h2>
      </div>
    );
  }

  // ==========================================================
  // EVENT CHECK
  // ==========================================================

  if (!event) {
    return (
      <div className="booking-message">
        <h2>Event not found</h2>
      </div>
    );
  }

  // ==========================================================
  // TICKET CHECK
  // ==========================================================

  if (!selectedTicket) {
    return (
      <div className="booking-message">
        <h2>Please select a ticket type</h2>
      </div>
    );
  }

  // ==========================================================
  // PRICE CALCULATION
  //
  // This is for DISPLAY only.
  //
  // The backend calculates the real amount again.
  // ==========================================================

  const SERVICE_FEE_PERCENT = 5;

  const ticketPrice = Number(
    selectedTicket.price || 0
  );

  const subtotal = ticketPrice * quantity;

  const serviceFee = Math.round(
    (subtotal * SERVICE_FEE_PERCENT) / 100
  );

  const totalPrice = subtotal + serviceFee;

  // ==========================================================
  // POSTER
  // ==========================================================

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

  // ==========================================================
  // QUANTITY
  // ==========================================================

  const maxQuantity = Number(
    selectedTicket.remaining ??
      selectedTicket.quantity ??
      event.capacity ??
      1
  );

  const decreaseQuantity = () => {
    if (processing) return;

    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  };

  const increaseQuantity = () => {
    if (processing) return;

    setQuantity((current) =>
      Math.min(
        Math.max(1, maxQuantity),
        current + 1
      )
    );
  };

  // ==========================================================
  // START FLUTTERWAVE PAYMENT
  // ==========================================================

  const handlePayment = async () => {
    if (processing) return;

    // --------------------------------------------------------
    // Basic validation
    // --------------------------------------------------------

    if (!quantity || quantity < 1) {
      alert("Please select at least one ticket.");
      return;
    }

    if (
      maxQuantity > 0 &&
      quantity > maxQuantity
    ) {
      alert(
        `Only ${maxQuantity} ticket${
          maxQuantity === 1 ? "" : "s"
        } available.`
      );
      return;
    }

    if (
      paymentMethod !== "card" &&
      !phoneNumber.trim()
    ) {
      alert(
        "Please enter your phone number."
      );
      return;
    }

    setProcessing(true);

    try {
      // ------------------------------------------------------
      // Ask backend to initialize payment
      //
      // IMPORTANT:
      // We do NOT create the booking here.
      // ------------------------------------------------------

      const response = await fetch(
        `${API_URL}/payments/initialize`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            eventId: event.id,

            ticketType:
              selectedTicket.name,

            quantity,

            userId: user.id,

            buyer: {
              name: user.name,
              email: user.email,
            },

            paymentMethod,

            phoneNumber:
              paymentMethod === "card"
                ? ""
                : phoneNumber.trim(),
          }),
        }
      );

      // ------------------------------------------------------
      // Safely read response
      // ------------------------------------------------------

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      // ------------------------------------------------------
      // Backend rejected initialization
      // ------------------------------------------------------

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.message ||
            "Unable to initialize payment."
        );

        return;
      }

      // ------------------------------------------------------
      // Flutterwave checkout URL
      // ------------------------------------------------------

      const checkoutLink =
        result.payment?.checkoutLink;

      if (!checkoutLink) {
        alert(
          "Flutterwave checkout link was not returned."
        );

        return;
      }

      // ======================================================
      // STORE PAYMENT INFORMATION
      //
      // PaymentSuccess will use this after Flutterwave
      // redirects the customer back.
      // ======================================================

      sessionStorage.setItem(
        "eventwaa_pending_payment",
        JSON.stringify({
          eventId: event.id,

          eventTitle: event.title,

          ticket: {
            name: selectedTicket.name,

            price: ticketPrice,
          },

          quantity,

          subtotal:
            result.payment?.subtotal ??
            subtotal,

          serviceFee:
            result.payment?.serviceFee ??
            serviceFee,

          totalPrice:
            result.payment?.amount ??
            totalPrice,

          currency:
            result.payment?.currency ||
            "UGX",

          txRef:
            result.payment?.txRef,

          paymentMethod,

          phoneNumber:
            paymentMethod === "card"
              ? ""
              : phoneNumber.trim(),

          buyer: {
            name: user.name,
            email: user.email,
          },
        })
      );

      // ======================================================
      // REDIRECT TO FLUTTERWAVE
      // ======================================================

      window.location.href = checkoutLink;

    } catch (error) {
      console.error(
        "PAYMENT INITIALIZATION ERROR:",
        error
      );

      alert(
        error.message ||
          "Unable to start payment. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="booking-page">

      <div className="booking-card">

        {/* ==================================================
            EVENT IMAGE
        ================================================== */}

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

        {/* ==================================================
            EVENT INFORMATION
        ================================================== */}

        <div className="booking-event-info">

          <span className="booking-label">
            BOOKING
          </span>

          <h1>
            {event.title}
          </h1>

          <div className="event-meta">

            <p>
              📍 {event.venue},{" "}
              {event.city}
            </p>

            <p>
              📅 {event.date}
            </p>

            <p>
              ⏰ {event.startTime} -{" "}
              {event.endTime}
            </p>

          </div>

        </div>

        <hr />

        {/* ==================================================
            ORDER SUMMARY
        ================================================== */}

        <h2>
          🛒 Order Summary
        </h2>

        <div className="selected-ticket-box">

          <div>
            <span>
              Ticket
            </span>

            <strong>
              {selectedTicket.name}
            </strong>
          </div>

          <strong>
            UGX{" "}
            {ticketPrice.toLocaleString()}
          </strong>

        </div>

        {/* ==================================================
            QUANTITY
        ================================================== */}

        <div className="summary-row quantity-row">

          <span>
            Quantity
          </span>

          <div className="quantity-controls">

            <button
              type="button"
              disabled={
                processing ||
                quantity <= 1
              }
              onClick={
                decreaseQuantity
              }
            >
              −
            </button>

            <span>
              {quantity}
            </span>

            <button
              type="button"
              disabled={
                processing ||
                quantity >= maxQuantity
              }
              onClick={
                increaseQuantity
              }
            >
              +
            </button>

          </div>

        </div>

        {/* ==================================================
            SUBTOTAL
        ================================================== */}

        <div className="summary-row">

          <span>
            Subtotal
          </span>

          <strong>
            UGX{" "}
            {subtotal.toLocaleString()}
          </strong>

        </div>

        {/* ==================================================
            SERVICE FEE
        ================================================== */}

        <div className="summary-row">

          <span>
            Service Fee (
            {SERVICE_FEE_PERCENT}%)
          </span>

          <strong>
            UGX{" "}
            {serviceFee.toLocaleString()}
          </strong>

        </div>

        <hr />

        {/* ==================================================
            TOTAL
        ================================================== */}

        <div className="summary-row total-row">

          <span>
            Total
          </span>

          <strong>
            UGX{" "}
            {totalPrice.toLocaleString()}
          </strong>

        </div>

        <hr />

        {/* ==================================================
            PAYMENT METHOD
        ================================================== */}

        <h2>
          💳 Payment Method
        </h2>

        <div className="payment-options">

          <label>

            <input
              type="radio"
              name="payment"
              value="mtn"
              checked={
                paymentMethod === "mtn"
              }
              disabled={processing}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
            />

            <span>
              MTN Mobile Money
            </span>

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

            <span>
              Airtel Money
            </span>

          </label>

          <label>

            <input
              type="radio"
              name="payment"
              value="card"
              checked={
                paymentMethod === "card"
              }
              disabled={processing}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
            />

            <span>
              Visa / Mastercard
            </span>

          </label>

        </div>

        {/* ==================================================
            PHONE NUMBER
        ================================================== */}

        {paymentMethod !== "card" && (

          <div className="phone-section">

            <label>
              Phone Number
            </label>

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

        {/* ==================================================
            PAYMENT BUTTON
        ================================================== */}

        <button
          className="pay-btn"
          onClick={handlePayment}
          disabled={processing}
        >

          {processing
            ? "Starting Payment..."
            : `Continue to Payment • UGX ${totalPrice.toLocaleString()}`}

        </button>

        <p className="secure-payment">
          🔒 Secure payment powered by EventWaa
        </p>

      </div>

    </div>
  );
}

export default Booking;