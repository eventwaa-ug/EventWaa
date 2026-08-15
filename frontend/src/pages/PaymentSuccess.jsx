import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/PaymentSuccess.css";

const API_URL = "http://localhost:5000";

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState(
    "Confirming your payment..."
  );

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  // ==========================================================
  // VERIFY PAYMENT
  // ==========================================================

  const verifyPayment = async () => {
    try {
      // --------------------------------------------------------
      // GET FLUTTERWAVE REDIRECT PARAMETERS
      // --------------------------------------------------------

      const transactionId =
        searchParams.get("transaction_id");

      const flutterwaveTxRef =
        searchParams.get("tx_ref");

      const transactionStatus =
        searchParams.get("status");

      console.log(
        "FLUTTERWAVE REDIRECT:",
        {
          transactionId,
          flutterwaveTxRef,
          transactionStatus,
        }
      );

      // --------------------------------------------------------
      // GET OUR SAVED PAYMENT DATA
      // --------------------------------------------------------

      const pendingPaymentRaw =
        sessionStorage.getItem(
          "eventwaa_pending_payment"
        );

      let pendingPayment = null;

      if (pendingPaymentRaw) {
        try {
          pendingPayment =
            JSON.parse(pendingPaymentRaw);
        } catch (error) {
          console.error(
            "INVALID PENDING PAYMENT DATA:",
            error
          );
        }
      }

      console.log(
        "EVENTWAA PENDING PAYMENT:",
        pendingPayment
      );

      // --------------------------------------------------------
      // WE NEED A TRANSACTION ID
      // --------------------------------------------------------

      if (!transactionId) {
        setStatus("failed");

        setMessage(
          "Flutterwave did not return a transaction ID."
        );

        return;
      }

      // --------------------------------------------------------
      // DETERMINE TX REF
      //
      // Prefer the tx_ref returned by Flutterwave.
      //
      // If it is not present, use the txRef we saved
      // before redirecting to Flutterwave.
      // --------------------------------------------------------

      const txRef =
        flutterwaveTxRef ||
        pendingPayment?.txRef;

      if (!txRef) {
        setStatus("failed");

        setMessage(
          "Transaction reference could not be found."
        );

        return;
      }

      // --------------------------------------------------------
      // CHECK FLUTTERWAVE REDIRECT STATUS
      //
      // This is only an early indication.
      //
      // The backend still performs the REAL verification
      // directly with Flutterwave.
      // --------------------------------------------------------

      if (
        transactionStatus &&
        transactionStatus.toLowerCase() !==
          "successful"
      ) {
        setStatus("failed");

        setMessage(
          "Flutterwave reports that the payment was not successful."
        );

        return;
      }

      // ========================================================
      // CALL EVENTWAA BACKEND
      //
      // GET:
      //
      // /payments/verify/<transaction_id>?tx_ref=<tx_ref>
      // ========================================================

      const verificationUrl =
        `${API_URL}/payments/verify/` +
        `${encodeURIComponent(transactionId)}` +
        `?tx_ref=${encodeURIComponent(txRef)}`;

      console.log(
        "VERIFYING PAYMENT:",
        verificationUrl
      );

      const response = await fetch(
        verificationUrl,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      // --------------------------------------------------------
      // READ SERVER RESPONSE
      // --------------------------------------------------------

      let result;

      try {
        result = await response.json();
      } catch (error) {
        console.error(
          "INVALID VERIFICATION RESPONSE:",
          error
        );

        setStatus("failed");

        setMessage(
          "The server returned an invalid verification response."
        );

        return;
      }

      console.log(
        "PAYMENT VERIFICATION RESULT:",
        result
      );

      // ========================================================
      // VERIFICATION FAILED
      // ========================================================

      if (
        !response.ok ||
        !result.success
      ) {
        setStatus("failed");

        setMessage(
          result.message ||
            "Payment verification failed."
        );

        return;
      }

      // ========================================================
      // PAYMENT SUCCESSFUL
      // ========================================================

      setBooking(
        result.booking || null
      );

      setPayment(
        result.payment || null
      );

      setStatus("success");

      setMessage(
        result.message ||
          "Payment verified and booking created successfully."
      );

      // --------------------------------------------------------
      // PAYMENT HAS NOW BEEN PROCESSED
      //
      // Remove the temporary frontend payment data.
      // --------------------------------------------------------

      sessionStorage.removeItem(
        "eventwaa_pending_payment"
      );

    } catch (error) {
      console.error(
        "PAYMENT VERIFICATION ERROR:",
        error
      );

      setStatus("failed");

      setMessage(
        "Unable to verify your payment. Please try again."
      );
    }
  };

  // ==========================================================
  // GO TO TICKET
  // ==========================================================

  const handleViewTicket = () => {
    if (!booking) return;

    navigate("/tickets", {
      state: {
        booking,
      },
    });
  };

  // ==========================================================
  // PROCESSING
  // ==========================================================

  if (status === "processing") {
    return (
      <div className="payment-success-page">

        <div className="payment-success-card">

          <div className="payment-loader"></div>

          <h1>
            Confirming Payment...
          </h1>

          <p>
            We're verifying your payment
            with Flutterwave.
          </p>

          <p>
            Please don't close this page.
          </p>

        </div>

      </div>
    );
  }

  // ==========================================================
  // FAILED
  // ==========================================================

  if (status === "failed") {
    return (
      <div className="payment-success-page">

        <div className="payment-success-card payment-failed">

          <div className="payment-status-icon">
            ✕
          </div>

          <h1>
            Payment Not Confirmed
          </h1>

          <p>
            {message}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/events")
            }
          >
            Back to Events
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // SUCCESS
  // ==========================================================

  return (
    <div className="payment-success-page">

      <div className="payment-success-card">

        <div className="payment-status-icon">
          ✓
        </div>

        <h1>
          Payment Successful!
        </h1>

        <p>
          {message}
        </p>

        {/* ====================================================
            BOOKING INFORMATION
        ==================================================== */}

        {booking && (
          <div className="payment-booking-details">

            <div className="payment-detail-row">

              <span>
                Event
              </span>

              <strong>
                {booking.eventTitle}
              </strong>

            </div>

            <div className="payment-detail-row">

              <span>
                Ticket
              </span>

              <strong>
                {booking.ticketType}
              </strong>

            </div>

            <div className="payment-detail-row">

              <span>
                Quantity
              </span>

              <strong>
                {booking.quantity}
              </strong>

            </div>

            <div className="payment-detail-row">

              <span>
                Total Paid
              </span>

              <strong>
                UGX{" "}
                {Number(
                  booking.customerTotal ||
                    booking.totalPrice ||
                    0
                ).toLocaleString()}
              </strong>

            </div>

            <div className="payment-detail-row">

              <span>
                Ticket ID
              </span>

              <strong>
                {booking.ticketId}
              </strong>

            </div>

          </div>
        )}

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="payment-success-actions">

          <button
            type="button"
            onClick={handleViewTicket}
            disabled={!booking}
          >
            View My Ticket
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              navigate("/events")
            }
          >
            Browse More Events
          </button>

        </div>

      </div>

    </div>
  );
}

export default PaymentSuccess;