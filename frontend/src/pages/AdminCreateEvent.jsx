import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminCreateEvent.css";

function AdminCreateEvent() {
const navigate = useNavigate();

const [formData, setFormData] = useState({
title: "",
description: "",
venue: "",
city: "Gulu",
category: "Music",
date: "",
startTime: "",
endTime: "",
capacity: "",
contact: "",
eventType: "Paid",
featured: true,
poster: null,
});

const [tickets, setTickets] = useState([
{ name: "Regular", price: "", quantity: "" }
]);

function handleChange(e) {
const { name, value, type, checked, files } = e.target;

setFormData({
  ...formData,
  [name]:
    type === "checkbox"
      ? checked
      : type === "file"
      ? files[0]
      : value,
});

}

function handleTicketChange(index, field, value) {
const updated = [...tickets];
updated[index][field] = value;
setTickets(updated);
}

function addTicket() {
setTickets([
...tickets,
{ name: "", price: "", quantity: "" }
]);
}

function removeTicket(index) {
if (tickets.length === 1) return;
setTickets(tickets.filter((_, i) => i !== index));
}

async function handleSubmit(e) {
e.preventDefault();

const data = new FormData();
Object.keys(formData).forEach((key) => {
  if (key === "poster") {
    if (formData.poster) {
      data.append("poster", formData.poster);
    }
  } else {
    data.append(key, formData[key]);
  }
});
const ticketData =
  formData.eventType === "Free"
    ? [
        {
          name: "Free Entry",
          price: 0,
          quantity: Number(formData.capacity || 0),
          remaining: Number(formData.capacity || 0),
        },
      ]
    : tickets.map((ticket) => ({
        name: ticket.name,
        price: Number(ticket.price || 0),
        quantity: Number(ticket.quantity || 0),
        remaining: Number(ticket.quantity || 0),
      }));
data.append("tickets", JSON.stringify(ticketData));
data.append("organizerName", "EventWaa");
data.append("hostName", "EventWaa");
data.append("hostEmail", "admin@eventwaa.com");
data.append("verifiedHost", true);
try {
  const response = await fetch("http://localhost:5000/events", {
    method: "POST",
    body: data,
  });
  const result = await response.json();
  if (result.success) {
    alert("Official EventWaa event created successfully!");
    navigate("/admin/events");
  } else {
    alert(result.message || "Failed to create event.");
  }
} catch (error) {
  console.error(error);
  alert("Server error.");
}

}

return (
    <div className="admin-create-event-page">

      <h1>Create Official </h1>
      <h1>EventWaa Event</h1>
      <p>Publish official platform events, sponsored events, and featured events directly from the admin dashboard.</p>
      <form className="create-event-form" onSubmit={handleSubmit}>
        <div className="form-grid">
      <input
        type="text"
        name="title"
        placeholder="Event title"
        value={formData.title}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="venue"
        placeholder="Venue"
        value={formData.venue}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="city"
        placeholder="City"
        value={formData.city}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="category"
        placeholder="Category"
        value={formData.category}
        onChange={handleChange}
        required
      />
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />
      <input
        type="time"
        name="startTime"
        value={formData.startTime}
        onChange={handleChange}
        required
      />
      <input
        type="time"
        name="endTime"
        value={formData.endTime}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="capacity"
        placeholder="Capacity"
        value={formData.capacity}
        onChange={handleChange}
        required
      />
    </div>
    <textarea
      name="description"
      placeholder="Event description"
      value={formData.description}
      onChange={handleChange}
      rows="6"
      required
    />
    <div className="form-row">
      <select
        name="eventType"
        value={formData.eventType}
        onChange={handleChange}
      >
        <option value="Paid">Paid event</option>
        <option value="Free">Free event</option>
      </select>
      <input
        type="file"
        name="poster"
        accept="image/*"
        onChange={handleChange}
      />
    </div>
    {formData.eventType === "Paid" && (
      <div className="ticket-section">
        <div className="ticket-header">
          <h2>Ticket types</h2>
          <button type="button" onClick={addTicket}>
            + Add Ticket
          </button>
        </div>
        {tickets.map((ticket, index) => (
          <div className="ticket-row" key={index}>
            <input
              type="text"
              placeholder="Ticket name"
              value={ticket.name}
              onChange={(e) =>
                handleTicketChange(index, "name", e.target.value)
              }
            />
            <input
              type="number"
              placeholder="Price"
              value={ticket.price}
              onChange={(e) =>
                handleTicketChange(index, "price", e.target.value)
              }
            />
            <input
              type="number"
              placeholder="Quantity"
              value={ticket.quantity}
              onChange={(e) =>
                handleTicketChange(index, "quantity", e.target.value)
              }
            />
            <button
              type="button"
              className="remove-ticket-btn"
              onClick={() => removeTicket(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    )}
    <label className="featured-toggle">
      <input
        type="checkbox"
        name="featured"
        checked={formData.featured}
        onChange={handleChange}
      />
      Feature this event on the homepage
    </label>
    <div className="form-actions">
      <button
        type="button"
        onClick={() => navigate("/admin/events")}
      >
        Cancel
      </button>
      <button type="submit">
        Publish Event
      </button>
    </div>
  </form>
</div>

);
}

export default AdminCreateEvent;