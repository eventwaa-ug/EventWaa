import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/Attendees.css";
function Attendees() {
  const { id } = useParams();
  const [attendees, setAttendees] = useState([]);
  const [event, setEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [refundSettings, setRefundSettings] = useState({
    hostRefunds: true,
    autoRefundApproval: false,
  });
  const checkInAttendee = async (ticket) => {
    const response = await fetch(
      `http://localhost:5000/check-ticket/${ticket.ticketId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: id,
        }),
      }
    );
    const data = await response.json();
    if (data.success) {
      alert("Attendee checked in successfully");
      setAttendees((prev) =>
        prev.map((item) =>
          item.id === ticket.id
            ? {
                ...item,
                checkedIn: true,
              }
            : item
        )
      );
    } else {
      alert(data.message);
    }
  };
  useEffect(() => {
    const loadAttendees = async () => {
      try {
        // Event details
        const eventResponse = await fetch(
          `http://localhost:5000/events/${id}`
        );
        const eventData = await eventResponse.json();
        setEvent(eventData);
        // Refund settings
        const refundResponse = await fetch(
          "http://localhost:5000/refund-settings"
        );
        const refundData = await refundResponse.json();
        setRefundSettings(refundData);
        // Attendees
        let response;
        if (eventData.eventType === "Free") {
          response = await fetch(
            `http://localhost:5000/attendance/event/${id}`
          );
        } else {
          response = await fetch(
            `http://localhost:5000/bookings/event/${id}`
          );
        }
        const data = await response.json();
        setAttendees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.log(error);
      }
    };
    loadAttendees();
  }, [id]);
  // Hide refunded tickets from active attendees
  const activeAttendees = attendees.filter(
    (ticket) => ticket.refundStatus !== "refunded"
  );
  const filteredAttendees = activeAttendees.filter((person) => {
    const name =
      person.buyer?.name?.toLowerCase() ||
      person.name?.toLowerCase() ||
      "";
    const email =
      person.buyer?.email?.toLowerCase() ||
      person.email?.toLowerCase() ||
      "";
    return (
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase())
    );
  });
  const totalAttendees = activeAttendees.length;
  const checkedIn = activeAttendees.filter(
    (ticket) => ticket.checkedIn
  ).length;
  const notCheckedIn = totalAttendees - checkedIn;
  const attendanceRate =
    totalAttendees > 0
      ? Math.round((checkedIn / totalAttendees) * 100)
      : 0;
  const requestRefund = async (bookingId) => {
    const confirmed = window.confirm(
      "Issue a refund for this booking?"
    );
    if (!confirmed) return;
    try {
      const response = await fetch(
        "http://localhost:5000/refunds",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            reason: "Refund issued by host",
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to request refund"
        );
      }
      alert(result.message);
      setAttendees((prev) =>
        prev.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                refundStatus: result.refund.status,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };
  return (
    <div className="attendees-page">
      <h1>👥 Event attendees</h1>
      <div className="attendee-stats">
        <div className="attendee-stat-card">
          <h2>{totalAttendees}</h2>
          <p>🎟️ Active tickets</p>
        </div>
        <div className="attendee-stat-card">
          <h2>{checkedIn}</h2>
          <p>✅ Checked in</p>
        </div>
        <div className="attendee-stat-card">
          <h2>{notCheckedIn}</h2>
          <p>⏳ Pending</p>
        </div>
        <div className="attendee-stat-card">
          <h2>{attendanceRate}%</h2>
          <p>📊 Attendance rate</p>
        </div>
      </div>
      <input
        className="attendee-search"
        type="text"
        placeholder="🔍 Search attendee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filteredAttendees.length === 0 ? (
        <p>No attendees found.</p>
      ) : (
        filteredAttendees.map((ticket) => (
          <div
            className="attendee-card"
            key={ticket.id}
          >
            <div className="attendee-info">
              <h2>
                👤 {ticket.buyer?.name || ticket.name}
              </h2>
              <p>
                📧 {ticket.buyer?.email || ticket.email}
              </p>
              <p>
                🆔 Ticket ID: {ticket.ticketId}
              </p>
              {event?.eventType === "Free" ? (
                <p className="ticket-count">
                  ✅ Attendance confirmed
                </p>
              ) : (
                <p className="ticket-count">
                  🎟️ Tickets: {ticket.quantity || 1}
                </p>
              )}
            </div>
            <div className="attendee-status">
              {!ticket.checkedIn && (
                <button
                  className="checkin-btn"
                  onClick={() => checkInAttendee(ticket)}
                >
                  ✅ Check in
                </button>
              )}
              {refundSettings.hostRefunds &&
                event?.eventType !== "Free" &&
                !ticket.checkedIn &&
                (ticket.refundStatus === "pending" ? (
                <button
                    className="refund-btn pending"
                    disabled
                >
                    Pending approval
                </button>
                ) : (
                <button
                    className="refund-btn"
                    onClick={() => requestRefund(ticket.id)}
                >
                    Refund
                </button>
                ))}
              {ticket.checkedIn ? (
                <p className="checked">
                  ✅ Checked in
                </p>
              ) : (
                <p className="pending">
                  ⏳ Not checked in
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
export default Attendees;