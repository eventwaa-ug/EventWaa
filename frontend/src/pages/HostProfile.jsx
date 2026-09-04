import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/HostProfile.css";
import { useAuth } from "../context/AuthContext";

function HostProfile() {

    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useAuth();

    const BACKEND_URL = "http://localhost:5000";

    // ============================================================
    // STATE
    // ============================================================

    const [host, setHost] = useState(null);
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // IMAGE URL
    // ============================================================

    const getImageUrl = (image) => {

        if (!image) {
            return "/default-avatar.png";
        }

        if (
            typeof image === "string" &&
            (
                image.startsWith("http://") ||
                image.startsWith("https://")
            )
        ) {
            return image;
        }

        return `${BACKEND_URL}${image}`;
    };

    // ============================================================
    // EVENT POSTER URL
    // ============================================================

    const getEventImageUrl = (event) => {

        const image =
            event?.eventPoster ||
            event?.poster ||
            event?.image;

        if (!image) {
            return "/default-event.jpg";
        }

        if (
            typeof image === "string" &&
            (
                image.startsWith("http://") ||
                image.startsWith("https://")
            )
        ) {
            return image;
        }

        return `${BACKEND_URL}${image}`;
    };

    // ============================================================
    // LOAD HOST
    // ============================================================

    useEffect(() => {

        let cancelled = false;

        const loadHostProfile = async () => {

            setLoading(true);
            setError("");

            try {

                // =================================================
                // GET USERS
                // =================================================

                const usersResponse =
                    await fetch(
                        `${BACKEND_URL}/users`
                    );

                if (!usersResponse.ok) {
                    throw new Error(
                        "Failed to load users."
                    );
                }

                const usersData =
                    await usersResponse.json();

                // =================================================
                // SUPPORT BOTH:
                //
                // [users]
                //
                // AND
                //
                // { users: [...] }
                // =================================================

                const users =
                    Array.isArray(usersData)
                        ? usersData
                        : Array.isArray(usersData?.users)
                            ? usersData.users
                            : [];

                const foundHost =
                    users.find(
                        (item) =>
                            String(item.id) ===
                            String(id)
                    );

                if (cancelled) {
                    return;
                }

                if (!foundHost) {

                    setHost(null);
                    setLoading(false);
                    setError(
                        "This host could not be found."
                    );

                    return;
                }

                setHost(foundHost);

                // =================================================
                // LOAD EVENTS
                // =================================================

                try {

                    const eventsResponse =
                        await fetch(
                            `${BACKEND_URL}/events`
                        );

                    if (eventsResponse.ok) {

                        const eventsData =
                            await eventsResponse.json();

                        const allEvents =
                            Array.isArray(eventsData)
                                ? eventsData
                                : Array.isArray(
                                    eventsData?.events
                                )
                                    ? eventsData.events
                                    : [];

                        const hostEvents =
                            allEvents.filter(
                                (event) =>
                                    String(
                                        event.hostId
                                    ) === String(id)
                            );

                        if (!cancelled) {
                            setEvents(hostEvents);
                        }
                    }

                } catch (eventsError) {

                    console.error(
                        "HOST EVENTS ERROR:",
                        eventsError
                    );

                    if (!cancelled) {
                        setEvents([]);
                    }
                }

                // =================================================
                // LOAD BOOKINGS
                // =================================================

                try {

                    const bookingsResponse =
                        await fetch(
                            `${BACKEND_URL}/bookings`
                        );

                    if (bookingsResponse.ok) {

                        const bookingsData =
                            await bookingsResponse.json();

                        const allBookings =
                            Array.isArray(bookingsData)
                                ? bookingsData
                                : Array.isArray(
                                    bookingsData?.bookings
                                )
                                    ? bookingsData.bookings
                                    : [];

                        if (!cancelled) {
                            setBookings(allBookings);
                        }
                    }

                } catch (bookingError) {

                    console.error(
                        "BOOKINGS ERROR:",
                        bookingError
                    );

                    if (!cancelled) {
                        setBookings([]);
                    }
                }

                // =================================================
                // FOLLOWING STATUS
                // =================================================

                if (user?.id) {

                    try {

                        const response =
                            await fetch(
                                `${BACKEND_URL}/follow/check/${id}/${user.id}`
                            );

                        if (response.ok) {

                            const data =
                                await response.json();

                            if (!cancelled) {

                                setFollowing(
                                    Boolean(
                                        data.following
                                    )
                                );
                            }
                        }

                    } catch (followError) {

                        console.error(
                            "FOLLOW CHECK ERROR:",
                            followError
                        );
                    }
                }

                // =================================================
                // FOLLOWERS
                // =================================================

                try {

                    const followersResponse =
                        await fetch(
                            `${BACKEND_URL}/followers/${id}`
                        );

                    if (followersResponse.ok) {

                        const followersData =
                            await followersResponse.json();

                        if (!cancelled) {

                            setFollowers(
                                Number(
                                    followersData?.count || 0
                                )
                            );
                        }
                    }

                } catch (followersError) {

                    console.error(
                        "FOLLOWERS ERROR:",
                        followersError
                    );

                    if (!cancelled) {
                        setFollowers(0);
                    }
                }

                if (!cancelled) {
                    setLoading(false);
                }

            } catch (error) {

                console.error(
                    "HOST PROFILE ERROR:",
                    error
                );

                if (!cancelled) {

                    setError(
                        "Unable to load this host profile."
                    );

                    setLoading(false);
                }
            }
        };

        loadHostProfile();

        return () => {
            cancelled = true;
        };

    }, [id, user?.id]);

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <div className="host-profile-state">

                <div className="host-loading-spinner"></div>

                <h2>
                    Loading host profile...
                </h2>

                <p>
                    Please wait a moment.
                </p>

            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error || !host) {

        return (
            <div className="host-profile-state">

                <div className="host-error-icon">
                    !
                </div>

                <h2>
                    Host Not Found
                </h2>

                <p>
                    {error ||
                        "This host profile is no longer available."}
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    Go Back
                </button>

            </div>
        );
    }

    // ============================================================
    // MY PROFILE
    // ============================================================

    const isMyProfile =
        user &&
        String(user.id) ===
        String(host.id);

    // ============================================================
    // TOTAL ATTENDEES
    // ============================================================

    const hostEventIds =
        new Set(
            events.map(
                (event) =>
                    String(event.id)
            )
        );

    const totalAttendees =
        bookings
            .filter((booking) =>
                hostEventIds.has(
                    String(booking.eventId)
                )
            )
            .reduce(
                (total, booking) =>
                    total +
                    Number(
                        booking.quantity || 0
                    ),
                0
            );

    // ============================================================
    // FOLLOW HOST
    // ============================================================

    const handleFollow = async () => {

        if (!user) {

            alert(
                "Please login to follow this host."
            );

            navigate("/login", {
                state: {
                    from: `/host/${id}`
                }
            });

            return;
        }

        if (following) {
            return;
        }

        try {

            const response =
                await fetch(
                    `${BACKEND_URL}/follow`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            hostId:
                                Number(id),

                            userId:
                                user.id

                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to follow host."
                );
            }

            if (data.success) {

                setFollowing(true);

                try {

                    const followersResponse =
                        await fetch(
                            `${BACKEND_URL}/followers/${id}`
                        );

                    if (
                        followersResponse.ok
                    ) {

                        const followersData =
                            await followersResponse.json();

                        setFollowers(
                            Number(
                                followersData?.count ||
                                0
                            )
                        );
                    }

                } catch (error) {

                    console.error(
                        "FOLLOWER COUNT ERROR:",
                        error
                    );
                }
            }

        } catch (error) {

            console.error(
                "FOLLOW ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to follow host."
            );
        }
    };

    // ============================================================
    // CONTACT HOST
    // ============================================================

    const handleContact = () => {

        if (!user) {

            navigate("/login", {
                state: {
                    from: `/host/${id}`
                }
            });

            return;
        }

        navigate(
            `/host/${id}/chat-with-host/${host.id}`
        );
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="host-profile">

            {/* ====================================================
                HOST HEADER
            ==================================================== */}

            <section className="host-cover">

                <div className="host-avatar-wrapper">

                    <img
                        src={getImageUrl(
                            host.image ||
                            host.profileImage ||
                            host.avatar
                        )}
                        alt={
                            host.name ||
                            "Host"
                        }
                        className="host-avatar"
                        onError={(e) => {

                            e.currentTarget.src =
                                "/default-avatar.png";

                        }}
                    />

                </div>

                {/* =================================================
                    HOST NAME
                ================================================= */}

                <div className="host-name-row">

                    <h1>
                        {host.name ||
                            "Event Organizer"}
                    </h1>

                    {(
                        host.verifiedHost === true ||
                        host.verifiedHost === "true"
                    ) && (

                        <span className="verified-badge">

                            <span>
                                ✓
                            </span>

                            Verified Host

                        </span>

                    )}

                </div>

                {/* =================================================
                    ORGANIZER NAME
                ================================================= */}

                <h3>
                    {host.organizerName ||
                        "Event Organizer"}
                </h3>

                {/* =================================================
                    LOCATION
                ================================================= */}

                <p className="host-location">

                    📍{" "}

                    {host.location ||
                        "Gulu, Uganda"}

                </p>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="host-actions">

                    {isMyProfile ? (

                        <>

                            <button
                                type="button"
                                className="host-primary-btn"
                                onClick={() =>
                                    navigate(
                                        "/dashboard"
                                    )
                                }
                            >
                                ⚙️ Manage Dashboard
                            </button>

                            <button
                                type="button"
                                className="host-secondary-btn"
                                onClick={() =>
                                    navigate(
                                        "/edit-host-profile"
                                    )
                                }
                            >
                                ✏️ Edit Profile
                            </button>

                        </>

                    ) : (

                        <>

                            <button
                                type="button"
                                className={
                                    following
                                        ? "host-following-btn"
                                        : "host-primary-btn"
                                }
                                onClick={
                                    handleFollow
                                }
                            >

                                {following
                                    ? "❤️ Following"
                                    : "🤍 Follow"}

                            </button>

                            <button
                                type="button"
                                className="host-secondary-btn"
                                onClick={
                                    handleContact
                                }
                            >
                                💬 Chat with Host
                            </button>

                        </>

                    )}

                </div>

            </section>

            {/* ====================================================
                ABOUT
            ==================================================== */}

            <section className="host-about">

                <h2>
                    About
                </h2>

                <p>

                    {host.description ||
                        "Creating amazing experiences on EventWaa."}

                </p>

            </section>

            {/* ====================================================
                STATISTICS
            ==================================================== */}

            <section className="host-stats">

                <div className="host-stat-card">

                    <span className="host-stat-icon">
                        📅
                    </span>

                    <h3>
                        {events.length}
                    </h3>

                    <p>
                        Events Hosted
                    </p>

                </div>

                <div className="host-stat-card">

                    <span className="host-stat-icon">
                        👥
                    </span>

                    <h3>
                        {totalAttendees}
                    </h3>

                    <p>
                        Attendees
                    </p>

                </div>

                <div className="host-stat-card">

                    <span className="host-stat-icon">
                        ❤️
                    </span>

                    <h3>
                        {followers}
                    </h3>

                    <p>
                        Followers
                    </p>

                </div>

            </section>

            {/* ====================================================
                EVENTS
            ==================================================== */}

            <section className="host-events">

                <div className="host-events-header">

                    <div>

                        <h2>
                            Upcoming Events
                        </h2>

                        <p>
                            Events hosted by{" "}
                            {host.organizerName ||
                                host.name}
                        </p>

                    </div>

                    <span className="host-event-count">

                        {events.length}{" "}
                        {events.length === 1
                            ? "Event"
                            : "Events"}

                    </span>

                </div>

                {/* =================================================
                    NO EVENTS
                ================================================= */}

                {events.length === 0 ? (

                    <div className="no-host-events">

                        <div>
                            📅
                        </div>

                        <h3>
                            No upcoming events
                        </h3>

                        <p>
                            This host has no published
                            events at the moment.
                        </p>

                    </div>

                ) : (

                    <div className="host-event-list">

                        {events.map(
                            (event) => (

                                <article
                                    className="public-event-card"
                                    key={event.id}
                                >

                                    <img
                                        src={getEventImageUrl(
                                            event
                                        )}
                                        alt={
                                            event.title ||
                                            "Event"
                                        }
                                        onError={(e) => {

                                            e.currentTarget.src =
                                                "/default-event.jpg";

                                        }}
                                    />

                                    <div className="public-event-content">

                                        <div className="public-event-top">

                                            <h3>
                                                {event.title}
                                            </h3>

                                            {(
                                                event.verifiedHost ===
                                                    true ||
                                                event.verifiedHost ===
                                                    "true"
                                            ) && (

                                                <span>
                                                    ✓ Verified
                                                </span>

                                            )}

                                        </div>

                                        <p>
                                            📍{" "}
                                            {event.venue ||
                                                "Venue TBA"}
                                            {event.city
                                                ? `, ${event.city}`
                                                : ""}
                                        </p>

                                        <p>
                                            📅{" "}
                                            {event.date ||
                                                "Date TBA"}
                                        </p>

                                        {event.startTime && (

                                            <p>
                                                🕒{" "}
                                                {event.startTime}

                                                {event.endTime
                                                    ? ` - ${event.endTime}`
                                                    : ""}
                                            </p>

                                        )}

                                        <p className="host-event-price">

                                            {event.eventType?.toLowerCase() ===
                                                "free"

                                                ? "Free Entry"

                                                : Array.isArray(
                                                    event.tickets
                                                ) &&
                                                  event.tickets.length > 0

                                                    ? `From UGX ${Math.min(
                                                        ...event.tickets
                                                            .map(
                                                                (ticket) =>
                                                                    Number(
                                                                        ticket.price
                                                                    )
                                                            )
                                                            .filter(
                                                                (price) =>
                                                                    price > 0
                                                            )
                                                    ).toLocaleString()}`

                                                    : Number(
                                                        event.price || 0
                                                    ) > 0

                                                        ? `UGX ${Number(
                                                            event.price
                                                        ).toLocaleString()}`

                                                        : "Price unavailable"}

                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/events/${event.id}`
                                                )
                                            }
                                        >
                                            View Event →
                                        </button>

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>

        </div>
    );
}

export default HostProfile;