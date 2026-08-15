import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/RequestRefund.css";
function RequestRefund() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const ticket = location.state?.ticket;
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    /* ============================================================
       NO TICKET
    ============================================================ */
    if (!ticket) {
        return (
            <div className="refund-page">
                <div className="refund-empty">
                    <div className="refund-empty-icon">
                        🎟️
                    </div>
                    <h2>
                        Ticket not found
                    </h2>
                    <p>
                        We couldn't find the ticket you want
                        to refund.
                    </p>
                    <button
                        onClick={() => navigate("/tickets")}
                    >
                        Back to My Tickets
                    </button>
                </div>
            </div>
        );
    }
    /* ============================================================
       EVENT DATE CHECK
    ============================================================ */
    const eventDate = ticket.eventDate || ticket.date;
    let eventHasPassed = false;
    if (eventDate) {
        const today = new Date();
        const eventDay = new Date(eventDate);
        eventHasPassed = eventDay < today;
    }
    /* ============================================================
       TICKET STATUS
    ============================================================ */
    const ticketStatus =
        String(ticket.status || "confirmed").toLowerCase();
    const alreadyRefunded =
        ticketStatus === "refunded";
    const refundPending =
        ticketStatus === "refund_pending" ||
        ticketStatus === "pending_refund";
    /* ============================================================
       SUBMIT REFUND
    ============================================================ */
    const handleSubmit = async (e) => {
e.preventDefault();
setError("");

if (!reason) {
    setError("Please select a refund reason.");
    return;
}
if (!user?.id && !user?.email) {
    setError(
        "Please log in before requesting a refund."
    );
    return;
}
const bookingId =
    ticket.bookingId ||
    ticket.id;
if (!bookingId) {
    setError(
        "Booking information is missing for this ticket."
    );
    return;
}
try {
    setSubmitting(true);
    const response = await fetch(
        "http://localhost:5000/refunds",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                bookingId,
                reason,
                details,
            }),
        }
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(
            data?.message ||
            "Unable to submit refund request."
        );
    }
    alert(
        "Your refund request has been submitted successfully."
    );
    navigate("/tickets");
} catch (error) {
    console.error(
        "REFUND REQUEST ERROR:",
        error
    );
    setError(
        error.message ||
        "Something went wrong. Please try again."
    );
} finally {
    setSubmitting(false);
}

};
    /* ============================================================
       RENDER
    ============================================================ */
    return (
        <div className="refund-page">
            {/* ====================================================
                HEADER
            ==================================================== */}
            <div className="refund-header">
                <button
                    className="refund-back-button"
                    onClick={() => navigate(-1)}
                >
                    ←
                </button>
                <div>
                    <h1>
                        Request Refund
                    </h1>
                    <p>
                        Submit a refund request for your ticket.
                    </p>
                </div>
            </div>
            {/* ====================================================
                CONTENT
            ==================================================== */}
            <div className="refund-container">
                {/* =================================================
                    TICKET INFORMATION
                ================================================= */}
                <div className="refund-ticket-card">
                    <div className="refund-ticket-icon">
                        🎟️
                    </div>
                    <div className="refund-ticket-info">
                        <span>
                            EVENT
                        </span>
                        <h2>
                            {ticket.eventTitle ||
                                ticket.title ||
                                "Event"}
                        </h2>
                        <div className="refund-ticket-details">
                            <p>
                                📅{" "}
                                {ticket.eventDate ||
                                    ticket.date ||
                                    "Date unavailable"}
                            </p>
                            <p>
                                📍{" "}
                                {ticket.venue ||
                                    ticket.location ||
                                    "Venue unavailable"}
                            </p>
                            <p>
                                🎟️{" "}
                                {ticket.ticketType ||
                                    "Regular"}
                            </p>
                            <p>
                                👥{" "}
                                {ticket.quantity || 1}
                                {" "}
                                ticket(s)
                            </p>
                        </div>
                    </div>
                </div>
                {/* =================================================
                    REFUND STATUS WARNINGS
                ================================================= */}
                {alreadyRefunded && (
                    <div className="refund-warning success">
                        <strong>
                            This ticket has already been refunded.
                        </strong>
                    </div>
                )}
                {refundPending && (
                    <div className="refund-warning pending">
                        <strong>
                            Refund request already submitted.
                        </strong>
                        <span>
                            Your request is currently waiting
                            for review.
                        </span>
                    </div>
                )}
                {eventHasPassed &&
                    !alreadyRefunded &&
                    !refundPending && (
                        <div className="refund-warning">
                            <strong>
                                Refund unavailable
                            </strong>
                            <span>
                                This event has already taken place.
                            </span>
                        </div>
                    )}
                {/* =================================================
                    FORM
                ================================================= */}
                {!alreadyRefunded &&
                    !refundPending &&
                    !eventHasPassed && (
                        <form
                            className="refund-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="refund-form-header">
                                <h2>
                                    Why are you requesting
                                    a refund?
                                </h2>
                                <p>
                                    Select the reason that best
                                    describes your request.
                                </p>
                            </div>
                            {/* =================================================
                                REASON
                            ================================================= */}
                            <div className="refund-field">
                                <label>
                                    Refund reason
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) =>
                                        setReason(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Select a reason
                                    </option>
                                    <option value="Cannot attend">
                                        I can no longer attend
                                    </option>
                                    <option value="Event changed">
                                        Event details changed
                                    </option>
                                    <option value="Event cancelled">
                                        Event was cancelled
                                    </option>
                                    <option value="Duplicate purchase">
                                        I bought the ticket twice
                                    </option>
                                    <option value="Purchased by mistake">
                                        Purchased by mistake
                                    </option>
                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </div>
                            {/* =================================================
                                DETAILS
                            ================================================= */}
                            <div className="refund-field">
                                <label>
                                    Additional details
                                    <span>
                                        Optional
                                    </span>
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) =>
                                        setDetails(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Tell us anything else that may help with your refund request..."
                                    rows="5"
                                />
                            </div>
                            {/* =================================================
                                REFUND AMOUNT
                            ================================================= */}
                            <div className="refund-amount-card">
                            <span>Amount paid</span>
                            <strong>
                                UGX {Number(
                                ticket.totalPrice ||
                                ticket.amount ||
                                ticket.price ||
                                0
                                ).toLocaleString()}
                            </strong>

                            <hr />

                            <div className="refund-policy">
                                <p>
                                <strong>Refund policy</strong>
                                </p>
                                <p>• Refund requests must be made at least 5 days before the event.</p>
                                <p>• A 20% refund processing fee will be deducted.</p>
                                <p>• You will receive 80% of the ticket amount if approved.</p>
                            </div>
                            </div>
                            {/* =================================================
                                ERROR
                            ================================================= */}
                            {error && (
                                <div className="refund-error">
                                    {error}
                                </div>
                            )}
                            {/* =================================================
                                ACTIONS
                            ================================================= */}
                            <div className="refund-actions">
                                <button
                                    type="button"
                                    className="refund-cancel-btn"
                                    onClick={() =>
                                        navigate(-1)
                                    }
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="refund-submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "Submitting..."
                                        : "Submit Refund Request"}
                                </button>
                            </div>
                        </form>
                    )}
            </div>
        </div>
    );
}
export default RequestRefund;