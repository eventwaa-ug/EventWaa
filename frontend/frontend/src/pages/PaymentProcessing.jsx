import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/PaymentProcessing.css";

function PaymentProcessing() {
    const navigate = useNavigate();
    const location = useLocation();

    const booking = location.state;

    useEffect(() => {

        const timer = setTimeout(() => {

            navigate("/payment-success", {
                state: booking
            });

        }, 3000);

        return () => clearTimeout(timer);

    }, []);

    return (
        <div className="processing-page">

            <div className="processing-card">

                <div className="loader"></div>

                <h1>Processing Payment...</h1>

                <p>Connecting to Flutterwave...</p>

                <p>Please don't close this page.</p>

            </div>

        </div>
    );
}

export default PaymentProcessing;