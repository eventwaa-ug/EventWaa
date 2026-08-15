import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { EventContext } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import "./FreeAttendance.css";

function FreeAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events } = useContext(EventContext);

  const event = events.find(e => Number(e.id) === Number(id));
  const [loading, setLoading] = useState(false);

  if (!event) {
    return <h2>Event not found</h2>;
  }

  const confirmAttendance = async () => {
    if (!user) {
      alert("Please login first");
      navigate("/login", {
        state: { from: `/free-attendance/${id}` }
      });
      return;
    }

    setLoading(true);

    const response = await fetch("http://localhost:5000/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventId: event.id,
        eventTitle: event.title,
        name: user.name,
        email: user.email
      })
    });

    const data = await response.json();

    setLoading(false);

    if (data.success) {
      alert("Attendance confirmed!");
      navigate(`/attendance-pass/${data.attendance.id}`);
    } else {
      alert("Failed to confirm attendance");
    }
  };

  return (
    <div className="free-attendance-page">
      <div className="attendance-card">
        <h1>Free event attendance</h1>
        <h2>{event.title}</h2>

        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Venue:</strong> {event.venue}</p>

        <p>
          Confirm your attendance for this free event. You will receive a QR attendance pass.
        </p>

        <button
          className="confirm-btn"
          onClick={confirmAttendance}
          disabled={loading}
        >
          {loading ? "Confirming..." : "Confirm attendance"}
        </button>
      </div>
    </div>
  );
}

export default FreeAttendance;