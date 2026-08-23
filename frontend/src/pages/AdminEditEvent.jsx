import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminCreateEvent.css";

const API_BASE_URL = "http://localhost:5000";

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
    capacity: "",
    contact: "",
    eventType: "Paid",
  });

  const [tickets, setTickets] = useState([]);

  const [existingPoster, setExistingPoster] =
    useState("");

  const [poster, setPoster] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // ============================================================
  // LOAD EVENT
  // ============================================================

  useEffect(() => {
    fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/events/${id}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load event."
        );
      }

      const data =
        await response.json();

      // ========================================================
      // BASIC EVENT DATA
      // ========================================================

      setFormData({
        title: data.title || "",
        description:
          data.description || "",
        venue: data.venue || "",
        city: data.city || "",
        category:
          data.category || "",
        date: data.date || "",
        startTime:
          data.startTime || "",
        endTime:
          data.endTime || "",
        capacity:
          data.capacity || "",
        contact:
          data.contact || "",
        eventType:
          data.eventType ||
          "Paid",
      });

      // ========================================================
      // TICKET TYPES
      // ========================================================

      if (
        Array.isArray(data.tickets)
      ) {
        setTickets(
          data.tickets.map(
            (ticket) => ({
              name:
                ticket.name || "",
              price:
                ticket.price ?? "",
              quantity:
                ticket.quantity ?? "",
              remaining:
                ticket.remaining ??
                ticket.quantity ??
                "",
            })
          )
        );
      } else {
        setTickets([]);
      }

      // ========================================================
      // EXISTING POSTER
      // ========================================================

      const posterPath =
        data.eventPoster ||
        data.image ||
        "";

      if (posterPath) {
        if (
          posterPath.startsWith(
            "http://"
          ) ||
          posterPath.startsWith(
            "https://"
          )
        ) {
          setExistingPoster(
            posterPath
          );
        } else if (
          posterPath.startsWith("/")
        ) {
          setExistingPoster(
            `${API_BASE_URL}${posterPath}`
          );
        } else {
          setExistingPoster(
            `${API_BASE_URL}/${posterPath}`
          );
        }
      } else {
        setExistingPoster("");
      }

    } catch (error) {
      console.error(error);

      alert(
        "Unable to load this event."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // BASIC FIELD CHANGE
  // ============================================================

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ============================================================
  // POSTER CHANGE
  // ============================================================

  function handlePosterChange(e) {
    const file =
      e.target.files?.[0] ||
      null;

    setPoster(file);
  }

  // ============================================================
  // TICKET CHANGE
  // ============================================================

  function handleTicketChange(
    index,
    field,
    value
  ) {
    setTickets((previous) => {

      const updated = [
        ...previous,
      ];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  }

  // ============================================================
  // ADD TICKET
  // ============================================================

  function addTicket() {
    setTickets((previous) => [
      ...previous,
      {
        name: "",
        price: "",
        quantity: "",
        remaining: "",
      },
    ]);
  }

  // ============================================================
  // REMOVE TICKET
  // ============================================================

  function removeTicket(index) {
    if (tickets.length === 1) {
      return;
    }

    setTickets((previous) =>
      previous.filter(
        (_, i) => i !== index
      )
    );
  }

  // ============================================================
  // REMOVE EXISTING POSTER PREVIEW
  //
  // This only removes it from the edit form.
  // The backend keeps the existing poster unless a new
  // poster is uploaded.
  // ============================================================

  function clearPosterPreview() {
    setExistingPoster("");
    setPoster(null);
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) {
      return;
    }

    // ========================================================
    // PAID EVENT VALIDATION
    // ========================================================

    if (
      formData.eventType ===
      "Paid"
    ) {
      if (tickets.length === 0) {
        alert(
          "A paid event must have at least one ticket type."
        );

        return;
      }

      for (
        let i = 0;
        i < tickets.length;
        i++
      ) {
        const ticket =
          tickets[i];

        if (
          !String(
            ticket.name || ""
          ).trim()
        ) {
          alert(
            `Please enter a name for ticket ${i + 1}.`
          );

          return;
        }

        const price =
          Number(
            ticket.price
          );

        const quantity =
          Number(
            ticket.quantity
          );

        if (
          Number.isNaN(
            price
          ) ||
          price < 0
        ) {
          alert(
            `Invalid price for ticket ${i + 1}.`
          );

          return;
        }

        if (
          Number.isNaN(
            quantity
          ) ||
          quantity <= 0
        ) {
          alert(
            `Invalid quantity for ticket ${i + 1}.`
          );

          return;
        }
      }
    }

    try {
      setSaving(true);

      // ======================================================
      // FORM DATA
      //
      // Flask uses request.form and request.files.
      // Therefore JSON is NOT used here.
      // ======================================================

      const data =
        new FormData();

      Object.entries(
        formData
      ).forEach(
        ([key, value]) => {
          data.append(
            key,
            value ?? ""
          );
        }
      );

      // ======================================================
      // TICKETS
      // ======================================================

      const ticketData =
        formData.eventType ===
        "Free"
          ? []
          : tickets.map(
              (ticket) => ({
                name: String(
                  ticket.name || ""
                ).trim(),

                price: Number(
                  ticket.price || 0
                ),

                quantity: Number(
                  ticket.quantity || 0
                ),

                // Preserve current inventory information.
                remaining:
                  ticket.remaining !==
                    undefined &&
                  ticket.remaining !==
                    ""
                    ? Number(
                        ticket.remaining
                      )
                    : Number(
                        ticket.quantity ||
                          0
                      ),
              })
            );

      data.append(
        "tickets",
        JSON.stringify(
          ticketData
        )
      );

      // ======================================================
      // POSTER
      // ======================================================

      if (poster) {
        data.append(
          "poster",
          poster
        );
      }

      // ======================================================
      // SAVE
      // ======================================================

      const response =
        await fetch(
          `${API_BASE_URL}/events/${id}`,
          {
            method: "PUT",
            body: data,
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to update event."
        );
      }

      alert(
        "Event updated successfully."
      );

      navigate(
        "/admin/events"
      );

    } catch (error) {
      console.error(
        "Update event error:",
        error
      );

      alert(
        error.message ||
          "Unable to update event."
      );

    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-create-event">
        <div className="create-header">

          <h1>
            Loading Event...
          </h1>

          <p>
            Please wait while the
            event information loads.
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="admin-create-event">

      <div className="create-header">

        <h1>
          Edit Event
        </h1>

        <p>
          Update the event information,
          ticket types and poster.
        </p>

      </div>

      <form
        className="create-event-form"
        onSubmit={handleSubmit}
      >

        {/* ====================================================
            BASIC EVENT INFORMATION
            ==================================================== */}

        <div className="form-grid">

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={
              handleChange
            }
            placeholder="Event title"
            required
          />

          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={
              handleChange
            }
            placeholder="Venue"
            required
          />

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={
              handleChange
            }
            placeholder="City"
            required
          />

          <input
            type="text"
            name="category"
            value={
              formData.category
            }
            onChange={
              handleChange
            }
            placeholder="Category"
            required
          />

          <input
            type="date"
            name="date"
            value={
              formData.date
            }
            onChange={
              handleChange
            }
            required
          />

          <input
            type="time"
            name="startTime"
            value={
              formData.startTime
            }
            onChange={
              handleChange
            }
            required
          />

          <input
            type="time"
            name="endTime"
            value={
              formData.endTime
            }
            onChange={
              handleChange
            }
            required
          />

          <input
            type="number"
            name="capacity"
            value={
              formData.capacity
            }
            onChange={
              handleChange
            }
            placeholder="Capacity"
            min="1"
            required
          />

        </div>

        {/* ====================================================
            DESCRIPTION
            ==================================================== */}

        <textarea
          name="description"
          value={
            formData.description
          }
          onChange={
            handleChange
          }
          placeholder="Event description"
          rows="6"
          required
        />

        {/* ====================================================
            EVENT TYPE
            ==================================================== */}

        <div className="form-row">

          <select
            name="eventType"
            value={
              formData.eventType
            }
            onChange={
              handleChange
            }
          >

            <option value="Paid">
              Paid event
            </option>

            <option value="Free">
              Free event
            </option>

          </select>

          <input
            type="text"
            name="contact"
            value={
              formData.contact
            }
            onChange={
              handleChange
            }
            placeholder="Contact information"
          />

        </div>

        {/* ====================================================
            POSTER
            ==================================================== */}

        <div className="edit-poster-section">

          <div className="edit-section-heading">

            <h2>
              Event Poster
            </h2>

            <p>
              Upload a new poster or
              keep the existing one.
            </p>

          </div>

          {existingPoster && (
            <div className="existing-poster-wrapper">

              <img
                src={existingPoster}
                alt="Current event poster"
                className="existing-event-poster"
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";
                }}
              />

              <button
                type="button"
                className="remove-poster-btn"
                onClick={
                  clearPosterPreview
                }
              >
                Remove current poster
              </button>

            </div>
          )}

          <input
            type="file"
            name="poster"
            accept="image/*"
            onChange={
              handlePosterChange
            }
          />

          {poster && (
            <p className="selected-poster-name">
              New poster selected:{" "}
              <strong>
                {poster.name}
              </strong>
            </p>
          )}

        </div>

        {/* ====================================================
            TICKET TYPES
            ==================================================== */}

        {formData.eventType ===
          "Paid" && (

          <div className="ticket-section">

            <div className="ticket-header">

              <div>
                <h2>
                  Ticket Types
                </h2>

                <p>
                  Manage the ticket
                  types and prices
                  for this event.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addTicket
                }
              >
                + Add Ticket
              </button>

            </div>

            {tickets.map(
              (
                ticket,
                index
              ) => (

                <div
                  className="ticket-row"
                  key={index}
                >

                  <input
                    type="text"
                    placeholder="Ticket name"
                    value={
                      ticket.name
                    }
                    onChange={(e) =>
                      handleTicketChange(
                        index,
                        "name",
                        e.target.value
                      )
                    }
                  />

                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    value={
                      ticket.price
                    }
                    onChange={(e) =>
                      handleTicketChange(
                        index,
                        "price",
                        e.target.value
                      )
                    }
                  />

                  <input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    value={
                      ticket.quantity
                    }
                    onChange={(e) =>
                      handleTicketChange(
                        index,
                        "quantity",
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="remove-ticket-btn"
                    onClick={() =>
                      removeTicket(
                        index
                      )
                    }
                  >
                    Remove
                  </button>

                </div>

              )
            )}

          </div>

        )}

        {/* ====================================================
            ACTIONS
            ==================================================== */}

        <div className="form-actions">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/events"
              )
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default AdminEditEvent;