import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useLocation
} from "react-router-dom";

import "../styles/PaymentSuccess.css";


const API_URL =
  "http://localhost:5000";


function PaymentSuccess() {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  // ============================================================
  // STATE
  // ============================================================

  const [status, setStatus] =
    useState("verifying");

  const [message, setMessage] =
    useState(
      "Verifying your payment..."
    );

  const [booking, setBooking] =
    useState(null);


  // ============================================================
  // VERIFY PAYMENT
  // ============================================================

  useEffect(() => {

    const verifyPayment = async () => {

      try {

        // ======================================================
        // FLUTTERWAVE RETURNS THESE IN THE URL
        // ======================================================

        const params =
          new URLSearchParams(
            location.search
          );


        const transactionId =
          params.get(
            "transaction_id"
          );


        const txRef =
          params.get(
            "tx_ref"
          );


        const flutterwaveStatus =
          params.get(
            "status"
          );


        console.log(
          "FLUTTERWAVE RETURN:",
          {
            transactionId,
            txRef,
            flutterwaveStatus
          }
        );


        // ======================================================
        // CHECK REQUIRED VALUES
        // ======================================================

        if (!transactionId) {

          setStatus("failed");

          setMessage(
            "No Flutterwave transaction was returned."
          );

          return;

        }


        if (!txRef) {

          setStatus("failed");

          setMessage(
            "Payment reference is missing."
          );

          return;

        }


        // ======================================================
        // CUSTOMER DID NOT COMPLETE PAYMENT
        // ======================================================

        if (
          flutterwaveStatus &&
          flutterwaveStatus !== "successful"
        ) {

          setStatus("failed");

          setMessage(
            "The payment was not completed."
          );

          return;

        }


        // ======================================================
        // VERIFY WITH OUR BACKEND
        //
        // IMPORTANT:
        // The frontend NEVER decides whether
        // payment succeeded.
        //
        // Backend verifies directly with Flutterwave.
        // ======================================================

        const response =
          await fetch(

            `${API_URL}/payments/verify/` +
            `${encodeURIComponent(transactionId)}` +
            `?tx_ref=${encodeURIComponent(txRef)}`,

            {
              method: "GET"
            }

          );


        const data =
          await response.json();


        console.log(
          "PAYMENT VERIFICATION:",
          data
        );


        // ======================================================
        // VERIFICATION FAILED
        // ======================================================

        if (
          !response.ok ||
          !data.success
        ) {

          setStatus("failed");

          setMessage(
            data.message ||
            "Payment verification failed."
          );

          return;

        }


        // ======================================================
        // PAYMENT ALREADY PROCESSED
        //
        // This is NOT an error.
        //
        // It means the customer refreshed,
        // returned twice, or Flutterwave called
        // the verification again.
        // ======================================================

        if (
          data.alreadyProcessed
        ) {

          setStatus("success");

          setMessage(
            "Your payment was already processed successfully."
          );

        } else {

          setStatus("success");

          setMessage(
            "Your payment was verified successfully."
          );

        }


        // ======================================================
        // SAVE BOOKING FOR DISPLAY
        // ======================================================

        if (data.booking) {

          setBooking(
            data.booking
          );

        }


        // ======================================================
        // CLEAR TEMPORARY PAYMENT DATA
        // ======================================================

        sessionStorage.removeItem(
          "eventwaa_pending_payment"
        );


        // ======================================================
        // GO TO TICKETS
        // ======================================================

        setTimeout(() => {

          navigate(
            "/tickets"
          );

        }, 2500);


      } catch (error) {

        console.error(
          "PAYMENT VERIFICATION ERROR:",
          error
        );


        setStatus("failed");

        setMessage(
          "Unable to verify your payment. Please contact EventWaa support."
        );

      }

    };


    verifyPayment();

  }, [
    location.search,
    navigate
  ]);


  // ============================================================
  // VERIFYING
  // ============================================================

  if (
    status === "verifying"
  ) {

    return (

      <div className="payment-success-page">

        <div className="success-card">

          <div className="success-circle">

            <div className="success-check">
              ⏳
            </div>

          </div>


          <h1>
            Verifying Payment...
          </h1>


          <p className="success-message">
            Please wait while EventWaa
            confirms your payment with
            Flutterwave.
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // FAILED
  // ============================================================

  if (
    status === "failed"
  ) {

    return (

      <div className="payment-success-page">

        <div className="success-card">

          <div className="success-circle">

            <div className="success-check">
              ✕
            </div>

          </div>


          <h1>
            Payment Not Confirmed
          </h1>


          <p className="success-message">
            {message}
          </p>


          <div className="redirect-section">

            <button
              className="pay-btn"
              onClick={() =>
                navigate(-1)
              }
            >
              Go Back
            </button>

          </div>

        </div>

      </div>

    );

  }


  // ============================================================
  // SUCCESS
  // ============================================================

  return (

    <div className="payment-success-page">

      <div className="success-card">


        <div className="success-circle">

          <div className="success-check">
            ✓
          </div>

        </div>


        <h1>
          Payment Successful!
        </h1>


        <p className="success-message">

          {message}

        </p>


        {booking && (

          <div className="booking-summary">

            <h2>
              Booking Confirmed
            </h2>


            <div className="summary-row">

              <span>
                Event
              </span>

              <strong>
                {booking.eventTitle}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Ticket
              </span>

              <strong>
                {booking.ticketType}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Quantity
              </span>

              <strong>
                {booking.quantity}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Ticket ID
              </span>

              <strong>
                {booking.ticketId}
              </strong>

            </div>

          </div>

        )}


        <div className="redirect-section">

          <div className="progress-ring">

            <div className="progress-fill"></div>

          </div>


          <p className="redirect-text">
            Opening My Tickets...
          </p>

        </div>


      </div>

    </div>

  );

}


export default PaymentSuccess;