import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/PaymentProcessing.css";

function PaymentProcessing() {
  const navigate = useNavigate();
  const location = useLocation();

  const paymentData =
    location.state ||
    JSON.parse(
      sessionStorage.getItem(
        "eventwaa_pending_payment"
      ) || "null"
    );

  useEffect(() => {
    // --------------------------------------------------------
    // If there is no payment information, there is nothing
    // for this page to process.
    // --------------------------------------------------------

    if (!paymentData) {
      const timer = setTimeout(() => {
        navigate("/events");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [paymentData, navigate]);

  return (
    <div className="processing-page">

      <div className="processing-card">

        <div className="loader"></div>

        <h1>
          Processing Payment...
        </h1>

        <p>
          We're confirming your payment
          with Flutterwave.
        </p>

        <p>
          Please don't close this page.
        </p>

        {paymentData?.txRef && (
          <div className="processing-reference">

            <span>
              Transaction Reference
            </span>

            <strong>
              {paymentData.txRef}
            </strong>

          </div>
        )}

      </div>

    </div>
  );
}

export default PaymentProcessing;