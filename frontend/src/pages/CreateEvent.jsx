import { EventContext } from "../context/EventContext";
import { AuthContext } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import "../styles/CreateEvent.css";

function CreateEvent() {

    const { user } = useContext(AuthContext);

    const { updateEvent } =
        useContext(EventContext);

    const location = useLocation();

    const navigate = useNavigate();

    const editingEvent =
        location.state?.event;

    const duplicateEvent =
        location.state?.duplicateEvent;

    const BACKEND_URL =
        "http://localhost:5000";

    // ============================================================
    // OPTIONS
    // ============================================================

    const cityOptions = [
        { value: "gulu", label: "Gulu" },
        { value: "kampala", label: "Kampala" },
        { value: "lira", label: "Lira" },
        { value: "jinja", label: "Jinja" },
        { value: "mbarara", label: "Mbarara" },
        { value: "mbale", label: "Mbale" },
        { value: "fort-portal", label: "Fort Portal" }
    ];

    const categoryOptions = [
        { value: "concert", label: "Concert" },
        { value: "festival", label: "Festival" },
        { value: "pool-party", label: "Pool Party" },
        { value: "club-night", label: "Club Night" },
        { value: "comedy", label: "Comedy" },
        { value: "workshop", label: "Workshop" },
        { value: "sports", label: "Sports" }
    ];

    // ============================================================
    // STATE
    // ============================================================

    const [selectedCity, setSelectedCity] =
        useState(null);

    const [selectedCategory, setSelectedCategory] =
        useState(null);

    const [tickets, setTickets] = useState([
        {
            name: "Regular",
            price: "",
            quantity: ""
        }
    ]);

    const [eventData, setEventData] = useState({
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

        poster: "",

        organizerName: "",

        hostId: user?.id || "",
        hostName: user?.name || "",
        hostEmail: user?.email || "",
        verifiedHost:
            user?.verifiedHost || false
    });

    const [submitting, setSubmitting] =
        useState(false);

    // ============================================================
    // LOAD EDIT / DUPLICATE DATA
    // ============================================================

    useEffect(() => {

        // ========================================================
        // EDIT EVENT
        // ========================================================

        if (editingEvent) {

            setEventData({
                ...editingEvent,

                poster:
                    editingEvent.eventPoster ||
                    editingEvent.image ||
                    ""
            });

            setTickets(
                Array.isArray(
                    editingEvent.tickets
                ) &&
                editingEvent.tickets.length > 0

                    ? editingEvent.tickets.map(
                        (ticket) => ({
                            name:
                                ticket.name || "",
                            price:
                                ticket.price ?? "",
                            quantity:
                                ticket.quantity ?? ""
                        })
                    )

                    : [
                        {
                            name: "Regular",
                            price: "",
                            quantity: ""
                        }
                    ]
            );

            setSelectedCity(
                editingEvent.city
                    ? {
                        value:
                            editingEvent.city
                                .toLowerCase(),
                        label:
                            editingEvent.city
                    }
                    : null
            );

            setSelectedCategory(
                editingEvent.category
                    ? {
                        value:
                            editingEvent.category
                                .toLowerCase(),
                        label:
                            editingEvent.category
                    }
                    : null
            );

            return;
        }

        // ========================================================
        // DUPLICATE EVENT
        // ========================================================

        if (duplicateEvent) {

            setEventData({

                ...duplicateEvent,

                id: undefined,

                title:
                    `${duplicateEvent.title} (Copy)`,

                date: "",

                // New duplicate should NOT reuse the old
                // poster automatically.
                poster: "",

                eventPoster: "",
                image: "",

                featured: false,

                ticketsSold: 0,

                revenue: 0,

                checkedIn: 0,

                status: "published",

                hostId:
                    user?.id || "",

                hostName:
                    user?.name || "",

                hostEmail:
                    user?.email || "",

                verifiedHost:
                    user?.verifiedHost || false
            });

            setTickets(
                Array.isArray(
                    duplicateEvent.tickets
                ) &&
                duplicateEvent.tickets.length > 0

                    ? duplicateEvent.tickets.map(
                        (ticket) => ({
                            name:
                                ticket.name || "",
                            price:
                                ticket.price ?? "",
                            quantity:
                                ticket.quantity ?? ""
                        })
                    )

                    : [
                        {
                            name: "Regular",
                            price: "",
                            quantity: ""
                        }
                    ]
            );

            setSelectedCity(
                duplicateEvent.city
                    ? {
                        value:
                            duplicateEvent.city
                                .toLowerCase(),
                        label:
                            duplicateEvent.city
                    }
                    : null
            );

            setSelectedCategory(
                duplicateEvent.category
                    ? {
                        value:
                            duplicateEvent.category
                                .toLowerCase(),
                        label:
                            duplicateEvent.category
                    }
                    : null
            );
        }

    }, [
        editingEvent,
        duplicateEvent,
        user
    ]);

    // ============================================================
    // HANDLE EVENT INPUT
    // ============================================================

    const handleChange = (e) => {

        setEventData((previous) => ({
            ...previous,
            [e.target.name]:
                e.target.value
        }));
    };

    // ============================================================
    // POSTER UPLOAD
    // ============================================================

    const handlePosterUpload = (e) => {

        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }

        // Store the actual File object.
        setEventData((previous) => ({
            ...previous,
            poster: file
        }));
    };

    // ============================================================
    // GET POSTER PREVIEW
    // ============================================================

    const getPosterPreview = () => {

        if (!eventData.poster) {
            return "";
        }

        // --------------------------------------------------------
        // NEW FILE
        // --------------------------------------------------------

        if (
            eventData.poster instanceof File
        ) {

            return URL.createObjectURL(
                eventData.poster
            );
        }

        // --------------------------------------------------------
        // EXISTING URL / PATH
        // --------------------------------------------------------

        if (
            typeof eventData.poster === "string"
        ) {

            if (
                eventData.poster.startsWith(
                    "http://"
                ) ||
                eventData.poster.startsWith(
                    "https://"
                )
            ) {

                return eventData.poster;
            }

            return `${BACKEND_URL}${eventData.poster}`;
        }

        return "";
    };

    // ============================================================
    // TICKETS
    // ============================================================

    const handleTicketChange = (
        index,
        field,
        value
    ) => {

        setTickets((previous) =>
            previous.map(
                (ticket, ticketIndex) =>
                    ticketIndex === index
                        ? {
                            ...ticket,
                            [field]: value
                        }
                        : ticket
            )
        );
    };

    const addTicket = () => {

        setTickets((previous) => [
            ...previous,

            {
                name: "",
                price: "",
                quantity: ""
            }
        ]);
    };

    const removeTicket = (index) => {

        setTickets((previous) =>
            previous.filter(
                (_, ticketIndex) =>
                    ticketIndex !== index
            )
        );
    };

    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (submitting) {
            return;
        }

        try {

            setSubmitting(true);

            // ====================================================
            // EDIT EVENT
            // ====================================================

            if (editingEvent) {

                const formData =
                    new FormData();

                // ------------------------------------------------
                // EVENT FIELDS
                // ------------------------------------------------

                formData.append(
                    "title",
                    eventData.title || ""
                );

                formData.append(
                    "description",
                    eventData.description || ""
                );

                formData.append(
                    "venue",
                    eventData.venue || ""
                );

                formData.append(
                    "city",
                    eventData.city || ""
                );

                formData.append(
                    "category",
                    eventData.category || ""
                );

                formData.append(
                    "date",
                    eventData.date || ""
                );

                formData.append(
                    "startTime",
                    eventData.startTime || ""
                );

                formData.append(
                    "endTime",
                    eventData.endTime || ""
                );

                formData.append(
                    "capacity",
                    eventData.capacity || ""
                );

                formData.append(
                    "contact",
                    eventData.contact || ""
                );

                formData.append(
                    "eventType",
                    eventData.eventType || "Paid"
                );

                formData.append(
                    "organizerName",
                    eventData.organizerName || ""
                );

                // ------------------------------------------------
                // TICKETS
                // ------------------------------------------------

                formData.append(
                    "tickets",
                    JSON.stringify(
                        eventData.eventType === "Paid"
                            ? tickets
                            : []
                    )
                );

                // ------------------------------------------------
                // NEW POSTER
                //
                // Only send a poster when the host selected
                // a NEW File.
                // ------------------------------------------------

                if (
                    eventData.poster instanceof File
                ) {

                    formData.append(
                        "poster",
                        eventData.poster
                    );
                }

                // ------------------------------------------------
                // UPDATE EVENT
                // ------------------------------------------------

                const response =
                    await fetch(
                        `${BACKEND_URL}/events/${editingEvent.id}`,
                        {
                            method: "PUT",
                            body: formData
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

                // ------------------------------------------------
                // UPDATE REACT EVENT STATE
                // ------------------------------------------------

                updateEvent(
                    result.event
                );

                alert(
                    "Event updated successfully!"
                );

                navigate(
                    "/dashboard"
                );

                return;
            }

            // ====================================================
            // CREATE / DUPLICATE EVENT
            // ====================================================

            const formData =
                new FormData();

            // ----------------------------------------------------
            // EVENT DATA
            // ----------------------------------------------------

            Object.keys(eventData).forEach(
                (key) => {

                    // poster is handled separately
                    if (key === "poster") {
                        return;
                    }

                    // Never send old event-level price
                    if (key === "price") {
                        return;
                    }

                    formData.append(
                        key,
                        eventData[key] ?? ""
                    );
                }
            );

            // ----------------------------------------------------
            // POSTER
            // ----------------------------------------------------

            if (
                eventData.poster instanceof File
            ) {

                formData.append(
                    "poster",
                    eventData.poster
                );
            }

            // ----------------------------------------------------
            // TICKETS
            // ----------------------------------------------------

            formData.append(
                "tickets",
                JSON.stringify(
                    eventData.eventType === "Paid"
                        ? tickets
                        : []
                )
            );

            // ----------------------------------------------------
            // HOST INFORMATION
            // ----------------------------------------------------

            formData.set(
                "hostId",
                user?.id || ""
            );

            formData.set(
                "hostName",
                user?.name || ""
            );

            formData.set(
                "hostEmail",
                user?.email || ""
            );

            formData.set(
                "verifiedHost",
                String(
                    user?.verifiedHost ||
                    false
                )
            );

            // ----------------------------------------------------
            // CREATE EVENT
            // ----------------------------------------------------

            const response =
                await fetch(
                    `${BACKEND_URL}/events`,
                    {
                        method: "POST",
                        body: formData
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
                    "Failed to create event."
                );
            }

            // ----------------------------------------------------
            // UPDATE FRONTEND STATE
            // ----------------------------------------------------

            if (result.event) {

                updateEvent(
                    result.event
                );
            }

            alert(
                duplicateEvent
                    ? "Event duplicated successfully!"
                    : "Event published successfully!"
            );

            navigate(
                "/dashboard"
            );

        } catch (error) {

            console.error(
                "CREATE / UPDATE EVENT ERROR:",
                error
            );

            alert(
                error.message ||
                "Something went wrong while saving the event."
            );

        } finally {

            setSubmitting(false);
        }
    };

    // ============================================================
    // POSTER PREVIEW URL
    // ============================================================

    const posterPreview =
        getPosterPreview();

    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="create-event-page">

            <h1>

                {editingEvent
                    ? "Edit Event"
                    : duplicateEvent
                        ? "Duplicate Event"
                        : "Create a New Event"}

            </h1>

            <p>
                {editingEvent
                    ? "Update your event details below."
                    : "Fill in the details below to publish your event."}
            </p>

            <form
                className="create-event-form"
                onSubmit={handleSubmit}
            >

                {/* =================================================
                    TITLE
                ================================================= */}

                <div className="form-group">

                    <label>
                        Event Title
                    </label>

                    <input
                        name="title"
                        value={
                            eventData.title
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </div>

                {/* =================================================
                    POSTER
                ================================================= */}

                <div className="form-group">

                    <label>
                        Event Poster
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={
                            handlePosterUpload
                        }
                    />

                    {posterPreview && (

                        <div className="poster-preview-container">

                            <img
                                src={
                                    posterPreview
                                }
                                alt={
                                    eventData.title ||
                                    "Event Poster Preview"
                                }
                                className="poster-preview"
                                onError={(e) => {

                                    e.currentTarget.src =
                                        "/default-event.jpg";

                                }}
                            />

                        </div>

                    )}

                </div>

                {/* =================================================
                    VENUE
                ================================================= */}

                <div className="form-group">

                    <label>
                        Venue
                    </label>

                    <input
                        name="venue"
                        value={
                            eventData.venue
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                {/* =================================================
                    ORGANIZER
                ================================================= */}

                <div className="form-group">

                    <label>
                        Event Organizer
                    </label>

                    <input
                        name="organizerName"
                        placeholder="Example: Watwero Dance Company"
                        value={
                            eventData.organizerName
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                {/* =================================================
                    DATE
                ================================================= */}

                <div className="form-group">

                    <label>
                        Date
                    </label>

                    <input
                        type="date"
                        name="date"
                        value={
                            eventData.date
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </div>

                {/* =================================================
                    START TIME
                ================================================= */}

                <div className="form-group">

                    <label>
                        Start Time
                    </label>

                    <input
                        name="startTime"
                        value={
                            eventData.startTime
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                {/* =================================================
                    END TIME
                ================================================= */}

                <div className="form-group">

                    <label>
                        End Time
                    </label>

                    <input
                        name="endTime"
                        value={
                            eventData.endTime
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                {/* =================================================
                    CATEGORY
                ================================================= */}

                <div className="form-group">

                    <label>
                        Category
                    </label>

                    <CreatableSelect
                        options={
                            categoryOptions
                        }
                        value={
                            selectedCategory
                        }
                        onChange={(
                            option
                        ) => {

                            setSelectedCategory(
                                option
                            );

                            setEventData(
                                (previous) => ({
                                    ...previous,
                                    category:
                                        option?.label ||
                                        ""
                                })
                            );

                        }}
                    />

                </div>

                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <div className="form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        name="description"
                        value={
                            eventData.description
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                {/* =================================================
                    CAPACITY
                ================================================= */}

                <div className="form-group">

                    <label>
                        Capacity
                    </label>

                    <input
                        type="number"
                        name="capacity"
                        min="1"
                        value={
                            eventData.capacity
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                {/* =================================================
                    CONTACT
                ================================================= */}

                <div className="form-group">

                    <label>
                        Contact
                    </label>

                    <input
                        name="contact"
                        value={
                            eventData.contact
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>

                {/* =================================================
                    CITY
                ================================================= */}

                <div className="form-group">

                    <label>
                        City
                    </label>

                    <CreatableSelect
                        options={
                            cityOptions
                        }
                        value={
                            selectedCity
                        }
                        onChange={(
                            option
                        ) => {

                            setSelectedCity(
                                option
                            );

                            setEventData(
                                (previous) => ({
                                    ...previous,
                                    city:
                                        option?.label ||
                                        ""
                                })
                            );

                        }}
                    />

                </div>

                {/* =================================================
                    EVENT TYPE
                ================================================= */}

                <div className="form-group">

                    <label>
                        Event Type
                    </label>

                    <select
                        value={
                            eventData.eventType
                        }
                        onChange={(e) =>
                            setEventData(
                                (previous) => ({
                                    ...previous,
                                    eventType:
                                        e.target.value
                                })
                            )
                        }
                    >

                        <option value="Paid">
                            Paid Event
                        </option>

                        <option value="Free">
                            Free Event
                        </option>

                    </select>

                </div>

                {/* =================================================
                    FREE EVENT
                ================================================= */}

                {eventData.eventType ===
                    "Free" && (

                    <div className="free-event-info">

                        <p>
                            ✅ This is a free event.
                            Guests will confirm
                            attendance instead of
                            buying tickets.
                        </p>

                    </div>

                )}

                {/* =================================================
                    PAID EVENT / TICKETS
                ================================================= */}

                {eventData.eventType ===
                    "Paid" && (

                    <div className="form-group">

                        <h3>
                            🎟️ Ticket Options
                        </h3>

                        {tickets.map(
                            (
                                ticket,
                                index
                            ) => (

                                <div
                                    className="ticket-builder"
                                    key={index}
                                >

                                    <input
                                        type="text"
                                        placeholder="Ticket Name"
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
                                        required
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Price UGX"
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
                                        required
                                    />

                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Available Quantity"
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
                                        required
                                    />

                                    {tickets.length >
                                        1 && (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeTicket(
                                                    index
                                                )
                                            }
                                        >
                                            Remove
                                        </button>

                                    )}

                                </div>

                            )
                        )}

                        <button
                            type="button"
                            onClick={
                                addTicket
                            }
                        >
                            + Add Ticket Type
                        </button>

                    </div>

                )}

                {/* =================================================
                    SUBMIT
                ================================================= */}

                <button
                    type="submit"
                    className="publish-btn"
                    disabled={
                        submitting
                    }
                >

                    {submitting

                        ? "Saving..."

                        : editingEvent

                            ? "Update Event"

                            : duplicateEvent

                                ? "Publish Duplicate"

                                : "Publish Event"}

                </button>

            </form>

        </div>
    );
}

export default CreateEvent;