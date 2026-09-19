import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiArrowRight,
  FiCalendar,
  FiCreditCard,
} from "react-icons/fi";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import "../styles/PaymentSuccess.css";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

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
      // ========================================================
      // GET PAYMENT PROVIDER
      // ========================================================

      const providerFromUrl =
        searchParams
          .get("provider")
          ?.toLowerCase()
          .trim();

      // ========================================================
      // GET OUR SAVED PAYMENT DATA
      // ========================================================

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

      // ========================================================
      // DETERMINE PROVIDER
      // ========================================================

      const provider =
        providerFromUrl ||
        pendingPayment?.provider ||
        "flutterwave";

      console.log(
        "PAYMENT PROVIDER:",
        provider
      );

      // ========================================================
      // PESAPAL
      // ========================================================

      if (provider === "pesapal") {
        await verifyPesapalPayment(
          pendingPayment
        );

        return;
      }

      // ========================================================
      // FLUTTERWAVE
      // ========================================================

      await verifyFlutterwavePayment(
        pendingPayment
      );

    } catch (error) {
      console.error(
        "PAYMENT VERIFICATION ERROR:",
        error
      );

      setStatus("failed");

      setMessage(
        error.message ||
          "Unable to verify your payment. Please try again."
      );
    }
  };

  // ==========================================================
  // FLUTTERWAVE VERIFICATION
  // ==========================================================

  const verifyFlutterwavePayment = async (
    pendingPayment
  ) => {
    // --------------------------------------------------------
    // GET FLUTTERWAVE REDIRECT PARAMETERS
    // --------------------------------------------------------

    const transactionId =
      searchParams.get(
        "transaction_id"
      );

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
    // ========================================================

    const verificationUrl =
      `${BACKEND_URL}/payments/verify/` +
      `${encodeURIComponent(transactionId)}` +
      `?tx_ref=${encodeURIComponent(txRef)}`;

    console.log(
      "VERIFYING FLUTTERWAVE PAYMENT:",
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
        "INVALID FLUTTERWAVE VERIFICATION RESPONSE:",
        error
      );

      setStatus("failed");

      setMessage(
        "The server returned an invalid verification response."
      );

      return;
    }

    console.log(
      "FLUTTERWAVE VERIFICATION RESULT:",
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
          "Flutterwave payment verification failed."
      );

      return;
    }

    // ========================================================
    // PAYMENT SUCCESSFUL
    // ========================================================

    handleSuccessfulVerification(
      result,
      "Flutterwave"
    );
  };

  // ==========================================================
  // PESAPAL VERIFICATION
  // ==========================================================

  const verifyPesapalPayment = async (
    pendingPayment
  ) => {
    // --------------------------------------------------------
    // GET PESAPAL REDIRECT PARAMETERS
    // --------------------------------------------------------

    const orderTrackingId =
      searchParams.get(
        "OrderTrackingId"
      ) ||
      searchParams.get(
        "orderTrackingId"
      ) ||
      searchParams.get(
        "order_tracking_id"
      ) ||
      pendingPayment?.pesapalOrderTrackingId;

    const merchantReference =
      searchParams.get(
        "OrderMerchantReference"
      ) ||
      searchParams.get(
        "orderMerchantReference"
      ) ||
      searchParams.get(
        "order_merchant_reference"
      ) ||
      pendingPayment?.pesapalMerchantReference;

    const pesapalStatus =
      searchParams.get("status");

    console.log(
      "PESAPAL REDIRECT:",
      {
        orderTrackingId,
        merchantReference,
        pesapalStatus,
      }
    );

    // --------------------------------------------------------
    // PesaPal FAILED/CANCELLED
    // --------------------------------------------------------

    if (
      pesapalStatus &&
      [
        "failed",
        "cancelled",
        "canceled",
        "reversed",
      ].includes(
        pesapalStatus.toLowerCase()
      )
    ) {
      setStatus("failed");

      setMessage(
        "PesaPal reports that the payment was not successful."
      );

      return;
    }

    // --------------------------------------------------------
    // WE NEED THE ORDER TRACKING ID
    // --------------------------------------------------------

    if (!orderTrackingId) {
      setStatus("failed");

      setMessage(
        "PesaPal did not return an order tracking ID."
      );

      return;
    }

    // ========================================================
    // CALL EVENTWAA PESAPAL VERIFICATION ENDPOINT
    // ========================================================

    const verificationUrl =
      `${BACKEND_URL}/payments/pesapal/verify/` +
      `${encodeURIComponent(orderTrackingId)}`;

    console.log(
      "VERIFYING PESAPAL PAYMENT:",
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
        "INVALID PESAPAL VERIFICATION RESPONSE:",
        error
      );

      setStatus("failed");

      setMessage(
        "The server returned an invalid verification response."
      );

      return;
    }

    console.log(
      "PESAPAL VERIFICATION RESULT:",
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
          "PesaPal payment verification failed."
      );

      return;
    }

    // ========================================================
    // PAYMENT SUCCESSFUL
    // ========================================================

    handleSuccessfulVerification(
      result,
      "PesaPal"
    );
  };

  // ==========================================================
  // COMMON SUCCESS HANDLER
  // ==========================================================

  const handleSuccessfulVerification = (
    result,
    providerName
  ) => {
    console.log(
      "SUCCESSFUL PAYMENT RESPONSE:",
      result
    );

    const returnedBooking =
      result?.booking || null;

    const returnedBookingId =
      result?.bookingId ||
      returnedBooking?.bookingId ||
      returnedBooking?.id ||
      returnedBooking?._id ||
      returnedBooking?.ticketId ||
      returnedBooking?.tickets?.[0]?.ticketId;

    const normalizedBooking = returnedBooking
      ? {
          ...returnedBooking,

          bookingId:
            returnedBooking.bookingId ||
            returnedBookingId,

          id:
            returnedBooking.id ||
            returnedBookingId,
        }
      : null;

    console.log(
      "NORMALIZED BOOKING:",
      normalizedBooking
    );

    console.log(
      "NORMALIZED BOOKING ID:",
      returnedBookingId
    );

    setBooking(
      normalizedBooking
    );

    setPayment(
      result?.payment || null
    );

    setStatus("success");

    setMessage(
      result?.message ||
        `${providerName} payment verified and booking created successfully.`
    );

    // --------------------------------------------------------
    // PAYMENT HAS NOW BEEN PROCESSED
    // --------------------------------------------------------

    sessionStorage.removeItem(
      "eventwaa_pending_payment"
    );
  };

  // ==========================================================
  // GO TO MY TICKETS
  // ==========================================================

  const handleViewTicket = () => {
    console.log(
      "PAYMENT SUCCESS — NAVIGATING TO MY TICKETS"
    );

    navigate("/tickets");
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
            We're verifying your payment securely.
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
            <FiXCircle />
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
            <FiArrowRight />
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
          <FiCheckCircle />
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
                <FiCalendar />
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
                <FiCreditCard />
                Quantity
              </span>

              <strong>
                {booking.quantity}
              </strong>

            </div>

            <div className="payment-detail-row">

              <span>
                <FiCheckCircle />
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
                <FiCreditCard />
                Ticket ID
              </span>

              <strong>
                {booking.ticketId ||
                  booking.tickets?.[0]?.ticketId ||
                  "Available in My Tickets"}
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
          >
            <FiCreditCard />
            View My Tickets
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              navigate("/events")
            }
          >
            <FiArrowRight />
            Browse More Events
          </button>

        </div>

      </div>

    </div>
  );
}

export default PaymentSuccess;