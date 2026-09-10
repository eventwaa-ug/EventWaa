import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiShoppingCart,
  FiCreditCard,
  FiPhone,
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiArrowRight,
  FiLock,
} from "react-icons/fi";
import "../styles/Booking.css";
const API_URL = "https://eventwaa-production-7fbb.up.railway.app";
function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  // DISPLAY ONLY.
  //
  // Backend calculates and validates the real amount.
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
  // SAVE PENDING PAYMENT
  //
  // Used by PaymentSuccess after the provider redirects
  // the customer back to EventWaa.
  // ==========================================================
  const savePendingPayment = ({
    provider,
    payment,
  }) => {
    sessionStorage.setItem(
      "eventwaa_pending_payment",
      JSON.stringify({
        provider,
        eventId: event.id,
        eventTitle: event.title,
        ticket: {
          name: selectedTicket.name,
          price: ticketPrice,
        },
        quantity,
        subtotal:
          payment?.subtotal ??
          subtotal,
        serviceFee:
          payment?.serviceFee ??
          serviceFee,
        totalPrice:
          payment?.amount ??
          totalPrice,
        currency:
          payment?.currency ||
          "UGX",
        txRef:
          payment?.txRef ||
          "",
        // PesaPal-specific information
        pesapalOrderTrackingId:
          payment?.orderTrackingId ||
          payment?.pesapalOrderTrackingId ||
          "",
        pesapalMerchantReference:
          payment?.merchantReference ||
          payment?.pesapalMerchantReference ||
          "",
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
  };
  // ==========================================================
  // START FLUTTERWAVE PAYMENT
  // ==========================================================
  const initializeFlutterwave = async () => {
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
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(
        "The Flutterwave server returned an invalid response."
      );
    }
    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          "Unable to initialize Flutterwave payment."
      );
    }
    const checkoutLink =
      result.payment?.checkoutLink;
    if (!checkoutLink) {
      throw new Error(
        "Flutterwave checkout link was not returned."
      );
    }
    return {
      provider: "flutterwave",
      payment:
        result.payment,
      checkoutLink,
    };
  };
  // ==========================================================
  // START PESAPAL PAYMENT
  // ==========================================================
  const initializePesapal = async () => {
    const response = await fetch(
      `${API_URL}/payments/pesapal/initialize`,
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
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(
        "The PesaPal server returned an invalid response."
      );
    }
    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          "Unable to initialize PesaPal payment."
      );
    }
    const checkoutLink =
      result.payment?.checkoutLink;
    if (!checkoutLink) {
      throw new Error(
        "PesaPal checkout link was not returned."
      );
    }
    return {
      provider: "pesapal",
      payment:
        result.payment,
      checkoutLink,
    };
  };
  // ==========================================================
  // HANDLE PAYMENT
  //
  // Flutterwave is PRIMARY.
  //
  // PesaPal is FALLBACK ONLY if Flutterwave initialization
  // fails before the customer is redirected to checkout.
  // ==========================================================
  const handlePayment = async () => {
    if (processing) return;
    // --------------------------------------------------------
    // Basic validation
    // --------------------------------------------------------
    if (!quantity || quantity < 1) {
      alert(
        "Please select at least one ticket."
      );
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
    let paymentResult = null;
    try {
      // ======================================================
      // 1. TRY FLUTTERWAVE FIRST
      // ======================================================
      try {
        paymentResult =
          await initializeFlutterwave();
        console.log(
          "PAYMENT PROVIDER: FLUTTERWAVE"
        );
      } catch (flutterwaveError) {
        // ----------------------------------------------------
        // Flutterwave failed BEFORE checkout.
        //
        // Safe to try PesaPal because the customer has not
        // been redirected to Flutterwave.
        // ----------------------------------------------------
        console.warn(
          "FLUTTERWAVE INITIALIZATION FAILED. TRYING PESAPAL:",
          flutterwaveError
        );
        try {
          paymentResult =
            await initializePesapal();
          console.log(
            "PAYMENT PROVIDER: PESAPAL FALLBACK"
          );
        } catch (pesapalError) {
          console.error(
            "PESAPAL FALLBACK ALSO FAILED:",
            pesapalError
          );
          throw new Error(
            `Payment could not be started. Flutterwave: ${
              flutterwaveError.message ||
              "initialization failed"
            }. PesaPal fallback: ${
              pesapalError.message ||
              "initialization failed"
            }.`
          );
        }
      }
      // ======================================================
      // 2. VERIFY CHECKOUT RESULT
      // ======================================================
      if (
        !paymentResult ||
        !paymentResult.checkoutLink
      ) {
        throw new Error(
          "No payment checkout link was returned."
        );
      }
      // ======================================================
      // 3. SAVE PROVIDER INFORMATION
      //
      // PaymentSuccess will use this to determine whether
      // Flutterwave or PesaPal needs to be verified.
      // ======================================================
      savePendingPayment({
        provider:
          paymentResult.provider,
        payment:
          paymentResult.payment,
      });
      // ======================================================
      // 4. REDIRECT TO THE SELECTED PAYMENT PROVIDER
      // ======================================================
      window.location.href =
        paymentResult.checkoutLink;
    } catch (error) {
      console.error(
        "PAYMENT INITIALIZATION ERROR:",
        error
      );
      alert(
        error.message ||
          "Unable to start payment. Please try again."
      );
      setProcessing(false);
    }
  };
  // ==========================================================
  // UI
  // ==========================================================
  return (
    <div className="booking-page">
      <div className="booking-card">
        <button
          type="button"
          className="booking-back-btn"
          onClick={() => navigate(-1)}
          disabled={processing}
        >
          <FiArrowRight aria-hidden="true" />
          <span> Back </span>
        </button>
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
              <FiMapPin aria-hidden="true" />
              <span>
                {event.venue},{" "}
                {event.city}
              </span>
            </p>
            <p>
              <FiCalendar aria-hidden="true" />
              <span>
                {event.date}
              </span>
            </p>
            <p>
              <FiClock aria-hidden="true" />
              <span>
                {event.startTime} -{" "}
                {event.endTime}
              </span>
            </p>
          </div>
        </div>
        <hr />
        {/* ==================================================
            ORDER SUMMARY
        ================================================== */}
        <h2>
          <FiShoppingCart aria-hidden="true" />
          <span>Order Summary</span>
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
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || processing}
              aria-label="Decrease quantity"
            >
              <span className="quantity-symbol">−</span>
            </button>

            <span className="quantity-value">{quantity}</span>

            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              disabled={processing}
              aria-label="Increase quantity"
            >
              <span className="quantity-symbol">+</span>
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
          <FiCreditCard aria-hidden="true" />
          <span>Payment Method</span>
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
              <FiPhone aria-hidden="true" />
              <span>Phone Number</span>
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
          <span>
            {processing
              ? "Starting Payment..."
              : `Continue to Payment • UGX ${totalPrice.toLocaleString()}`}
          </span>
          {!processing && (
            <FiArrowRight aria-hidden="true" />
          )}
        </button>
        <p className="secure-payment">
          <FiLock aria-hidden="true" />
          <span>
            Secure payment powered by EventWaa
          </span>
        </p>
      </div>
    </div>
  );
}
export default Booking;