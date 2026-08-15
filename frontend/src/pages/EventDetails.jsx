import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import "./EventDetails.css";

function EventDetails() {
const { user } = useAuth();
const navigate = useNavigate();
const { id } = useParams();
const { events } = useContext(EventContext);

const [showReportForm, setShowReportForm] = useState(false);
const [reportData, setReportData] = useState({
    reason: "",
    description: ""
});
const event = events.find(
    item => Number(item.id) === Number(id)
);
if (!event) {
    return <h2>Event not found</h2>;
}
const BACKEND_URL = "http://localhost:5000";
const getImageUrl = () => {
    const image = event.eventPoster || event.image;
    if (!image) {
        return "/default-event.jpg";
    }
    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }
    return `${BACKEND_URL}${image}`;
};
const tickets = event.tickets || [
    {
        name: "Regular",
        price: event.price,
        quantity: 100
    }
];
const bookTicket = (ticket) => {
    if (!user) {
        alert("Please login before booking a ticket");
        navigate("/login", {
            state: {
                from: `/booking/${event.id}`
            }
        });
        return;
    }
    navigate(`/booking/${event.id}`, {
        state: {
            ticket
        }
    });
};
const submitReport = async () => {
    if (!reportData.reason || !reportData.description) {
        alert("Please complete the report form");
        return;
    }
    const report = {
        eventId: event.id,
        eventTitle: event.title,
        reportedBy: user?.email,
        reason: reportData.reason,
        description: reportData.description
    };
    try {
        const response = await fetch(
            `${BACKEND_URL}/event-reports`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(report)
            }
        );
        const data = await response.json();
        if (data.success) {
            alert("Report submitted successfully");
            setReportData({
                reason: "",
                description: ""
            });
            setShowReportForm(false);
        }
    } catch (error) {
        console.log(error);
        alert("Failed to submit report");
    }
};
return (
    <div className="event-details-page">
        <div className="event-hero">
            <img
                src={getImageUrl()}
                alt={event.title}
                className="event-image"
                onError={(e) => {
                    e.currentTarget.src = "/default-event.jpg";
                }}
            />
            <div className="event-hero-overlay">
                <span
                    className={`event-type-badge ${
                        event.eventType === "Free"
                            ? "free"
                            : "paid"
                    }`}
                >
                    {event.eventType === "Free"
                        ? "Free Event"
                        : "Paid Event"}
                </span>
                {event.verifiedHost && (
                    <span className="verified-badge">
                        ✓ Verified Host
                    </span>
                )}
            </div>
        </div>
        <div className="event-header">
            <h1>{event.title}</h1>
            <p className="event-description">
                {event.description}
            </p>
        </div>
        {event.eventType === "Free" ? (
            <div className="ticket-section free-event-section">
                <h2>Free event</h2>
                <p>This event is free to attend.</p>
                <button
                    className="book-btn free-btn"
                    onClick={() =>
                        navigate(`/free-attendance/${event.id}`)
                    }
                >
                    Confirm Attendance
                </button>
            </div>
        ) : (
            <div className="ticket-section">
                <h2>🎟️ Available Tickets</h2>
                {tickets.map((ticket, index) => (
                    <div className="ticket-card" key={index}>
                        <h3>{ticket.name}</h3>
                        <p>
                            Price: UGX {Number(ticket.price).toLocaleString()}
                        </p>
                        <p>
                            Remaining: {ticket.remaining ?? ticket.quantity}
                        </p>
                        <button
                            disabled={
                                (ticket.remaining ?? ticket.quantity) <= 0
                            }
                            className="book-btn"
                            onClick={() => bookTicket(ticket)}
                        >
                            {(ticket.remaining ?? ticket.quantity) <= 0
                                ? "Sold Out"
                                : `Book ${ticket.name}`}
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
);

}

export default EventDetails;