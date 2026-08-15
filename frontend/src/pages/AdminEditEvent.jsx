import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminCreateEvent.css";

function AdminEditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    city: "",
    category: "",
    date: "",
    startTime: "",
    endTime: "",
    price: "",
    capacity: "",
    contact: "",
    eventType: "Paid"
  });

  useEffect(() => {
    fetchEvent();
  }, []);

  async function fetchEvent() {
    try {
      const response = await fetch(`http://localhost:5000/events/${id}`);
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.log(error);
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await fetch(`http://localhost:5000/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    alert("Event updated successfully");
    navigate("/admin/events");
  }

  return (
    <div className="admin-create-event">
      <div className="create-header">
        <h1>Edit Event</h1>
        <p>Update the event information.</p>
      </div>

      <form className="create-event-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Event title"
          required
        />

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Event description"
          rows="5"
        />

        <input
          type="text"
          name="venue"
          value={formData.venue}
          onChange={handleChange}
          placeholder="Venue"
        />

        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="City"
        />

        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Category"
        />

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />

        <div className="time-grid">
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
          />

          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
          />
        </div>

        <select
          name="eventType"
          value={formData.eventType}
          onChange={handleChange}
        >
          <option value="Paid">Paid Event</option>
          <option value="Free">Free Event</option>
        </select>

        {formData.eventType === "Paid" && (
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Ticket price"
          />
        )}

        <input
          type="number"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          placeholder="Capacity"
        />

        <input
          type="text"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          placeholder="Contact information"
        />

        <button type="submit" className="publish-btn">
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default AdminEditEvent;