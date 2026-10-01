import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiArrowRight,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiEdit3,
    FiHeart,
    FiMapPin,
    FiMessageCircle,
    FiSettings,
    FiUsers,
} from "react-icons/fi";

import "../styles/HostProfile.css";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

function HostProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [host, setHost] = useState(null);
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // IMAGE HELPERS
    // ============================================================

    const getImageUrl = (image, fallback = "/default-avatar.png") => {
        if (!image) {
            return fallback;
        }

        if (
            typeof image === "string" &&
            (image.startsWith("http://") ||
                image.startsWith("https://"))
        ) {
            return image;
        }

        if (image.startsWith("/")) {
            return `${BACKEND_URL}${image}`;
        }

        return `${BACKEND_URL}/${image}`;
    };

    const getEventImageUrl = (event) => {
        const image =
            event?.eventPoster ||
            event?.poster ||
            event?.image;

        return getImageUrl(image, "/default-event.jpg");
    };

    // ============================================================
    // LOAD HOST PROFILE
    // ============================================================

    useEffect(() => {
        let cancelled = false;

        const loadHostProfile = async () => {
            setLoading(true);
            setError("");

            try {
                // ------------------------------------------------
                // LOAD USERS
                // ------------------------------------------------

                const usersResponse = await fetch(
                    `${BACKEND_URL}/users`
                );

                if (!usersResponse.ok) {
                    throw new Error("Failed to load users.");
                }

                const usersData = await usersResponse.json();

                const users = Array.isArray(usersData)
                    ? usersData
                    : Array.isArray(usersData?.users)
                        ? usersData.users
                        : [];

                const foundHost = users.find(
                    (item) =>
                        String(item.id) === String(id)
                );

                if (cancelled) return;

                if (!foundHost) {
                    setHost(null);
                    setError("This host could not be found.");
                    setLoading(false);
                    return;
                }

                setHost(foundHost);

                // ------------------------------------------------
                // LOAD EVENTS
                // ------------------------------------------------

                try {
                    const eventsResponse = await fetch(
                        `${BACKEND_URL}/events`
                    );

                    if (eventsResponse.ok) {
                        const eventsData =
                            await eventsResponse.json();

                        const allEvents = Array.isArray(eventsData)
                            ? eventsData
                            : Array.isArray(eventsData?.events)
                                ? eventsData.events
                                : [];

                        const hostEvents = allEvents.filter(
                            (event) =>
                                String(event.hostId) === String(id)
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

                // ------------------------------------------------
                // LOAD BOOKINGS
                // ------------------------------------------------

                try {
                    const bookingsResponse = await fetch(
                        `${BACKEND_URL}/bookings`
                    );

                    if (bookingsResponse.ok) {
                        const bookingsData =
                            await bookingsResponse.json();

                        const allBookings = Array.isArray(
                            bookingsData
                        )
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

                // ------------------------------------------------
                // CHECK FOLLOWING STATUS
                // ------------------------------------------------

                if (user?.id) {
                    try {
                        const response = await fetch(
                            `${BACKEND_URL}/follow/check/${id}/${user.id}`
                        );

                        if (response.ok) {
                            const data =
                                await response.json();

                            if (!cancelled) {
                                setFollowing(
                                    Boolean(data.following)
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

                // ------------------------------------------------
                // LOAD FOLLOWERS
                // ------------------------------------------------

                try {
                    const followersResponse = await fetch(
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
            } catch (loadError) {
                console.error(
                    "HOST PROFILE ERROR:",
                    loadError
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
                <div
                    className="host-loading-spinner"
                    aria-hidden="true"
                />

                <h2>Loading host profile...</h2>

                <p>Please wait a moment.</p>
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
                    <FiAlertCircle aria-hidden="true" />
                </div>

                <h2>Host Not Found</h2>

                <p>
                    {error ||
                        "This host profile is no longer available."}
                </p>

                <button
                    type="button"
                    className="host-back-btn"
                    onClick={() => navigate(-1)}
                >
                    <FiArrowLeft aria-hidden="true" />
                    Go Back
                </button>
            </div>
        );
    }

    // ============================================================
    // PROFILE INFORMATION
    // ============================================================

    const isMyProfile =
        user &&
        String(user.id) === String(host.id);

    const isVerified =
        host.verifiedHost === true ||
        host.verifiedHost === "true";

    // ============================================================
    // TOTAL ATTENDEES
    // ============================================================

    const hostEventIds = new Set(
        events.map((event) => String(event.id))
    );

    const totalAttendees = bookings
        .filter((booking) =>
            hostEventIds.has(
                String(booking.eventId)
            )
        )
        .reduce(
            (total, booking) =>
                total +
                Number(booking.quantity || 0),
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
                    from: `/host/${id}`,
                },
            });

            return;
        }

        if (following) {
            return;
        }

        try {
            const response = await fetch(
                `${BACKEND_URL}/follow`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        hostId: Number(id),
                        userId: user.id,
                    }),
                }
            );

            const data = await response.json();

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

                    if (followersResponse.ok) {
                        const followersData =
                            await followersResponse.json();

                        setFollowers(
                            Number(
                                followersData?.count || 0
                            )
                        );
                    }
                } catch (countError) {
                    console.error(
                        "FOLLOWER COUNT ERROR:",
                        countError
                    );
                }
            }
        } catch (followError) {
            console.error(
                "FOLLOW ERROR:",
                followError
            );

            alert(
                followError.message ||
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
                    from: `/host/${id}`,
                },
            });

            return;
        }

        navigate(
            `/host/${id}/chat-with-host/${host.id}`
        );
    };

    // ============================================================
    // EVENT PRICE
    // ============================================================

    const getEventPrice = (event) => {
        if (
            event.eventType?.toLowerCase() ===
            "free"
        ) {
            return {
                text: "Free Entry",
                type: "free",
            };
        }

        if (
            Array.isArray(event.tickets) &&
            event.tickets.length > 0
        ) {
            const prices = event.tickets
                .map((ticket) =>
                    Number(ticket.price)
                )
                .filter(
                    (price) =>
                        Number.isFinite(price) &&
                        price > 0
                );

            if (prices.length > 0) {
                return {
                    text: `From UGX ${Math.min(
                        ...prices
                    ).toLocaleString()}`,
                    type: "paid",
                };
            }
        }

        const eventPrice = Number(
            event.price || 0
        );

        if (
            Number.isFinite(eventPrice) &&
            eventPrice > 0
        ) {
            return {
                text: `UGX ${eventPrice.toLocaleString()}`,
                type: "paid",
            };
        }

        return {
            text: "Price unavailable",
            type: "unknown",
        };
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <main className="host-profile">

            {/* ====================================================
                PROFILE HEADER
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
                            "Event host"
                        }
                        className="host-avatar"
                        onError={(event) => {
                            event.currentTarget.src =
                                "/default-avatar.png";
                        }}
                    />
                </div>

                <div className="host-name-row">
                    <h1>
                        {host.name ||
                            "Event Organizer"}
                    </h1>

                    {isVerified && (
                        <span className="verified-badge">
                            <FiCheckCircle
                                aria-hidden="true"
                            />
                            Verified Host
                        </span>
                    )}
                </div>

                <p className="host-organizer-name">
                    {host.organizerName ||
                        "Event Organizer"}
                </p>

                <p className="host-location">
                    <FiMapPin aria-hidden="true" />
                    <span>
                        {host.location ||
                            "Gulu, Uganda"}
                    </span>
                </p>

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
                                <FiSettings
                                    aria-hidden="true"
                                />
                                Manage Dashboard
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
                                <FiEdit3
                                    aria-hidden="true"
                                />
                                Edit Profile
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
                                onClick={handleFollow}
                                aria-pressed={following}
                            >
                                <FiHeart
                                    aria-hidden="true"
                                />

                                {following
                                    ? "Following"
                                    : "Follow"}
                            </button>

                            <button
                                type="button"
                                className="host-secondary-btn"
                                onClick={handleContact}
                            >
                                <FiMessageCircle
                                    aria-hidden="true"
                                />
                                Chat with Host
                            </button>
                        </>
                    )}
                </div>
            </section>

            {/* ====================================================
                ABOUT
            ==================================================== */}

            <section className="host-about">
                <div className="section-heading">
                    <span className="section-kicker">
                        About the host
                    </span>
                </div>

                <p>
                    {host.description ||
                        "Creating amazing experiences on EventWaa."}
                </p>
            </section>

            {/* ====================================================
                STATISTICS
            ==================================================== */}

            <section
                className="host-stats"
                aria-label="Host statistics"
            >
                <div className="host-stat-card">
                    <span className="host-stat-icon">
                        <FiCalendar
                            aria-hidden="true"
                        />
                    </span>

                    <div>
                        <h3>{events.length}</h3>
                        <p>Events</p>
                    </div>
                </div>

                <div className="host-stat-card">
                    <span className="host-stat-icon">
                        <FiUsers
                            aria-hidden="true"
                        />
                    </span>

                    <div>
                        <h3>{totalAttendees}</h3>
                        <p>Attendees</p>
                    </div>
                </div>

                <div className="host-stat-card">
                    <span className="host-stat-icon">
                        <FiHeart
                            aria-hidden="true"
                        />
                    </span>

                    <div>
                        <h3>{followers}</h3>
                        <p>Followers</p>
                    </div>
                </div>
            </section>

        
        </main>
    );
}

export default HostProfile;