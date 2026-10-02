import { useEffect, useState } from "react";
import {
    Megaphone,
    Send,
    Bell,
    Users,
    Clock3,
    CheckCircle2,
    AlertCircle,
    RefreshCcw,
} from "lucide-react";
import { adminFetch } from "../utils/adminAPI";
import "../styles/AdminAnnouncements.css";

function AdminAnnouncements() {

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");

    const [announcements, setAnnouncements] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    /* ============================================================
       LOAD ANNOUNCEMENT HISTORY
    ============================================================ */

    const loadAnnouncements = async () => {

        try {

            setLoadingHistory(true);
            setError("");

            const data = await adminFetch(
                "/admin/announcements"
            );

            setAnnouncements(
                Array.isArray(data?.announcements)
                    ? data.announcements
                    : []
            );

        } catch (error) {

            console.error(
                "ANNOUNCEMENTS LOAD ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to load announcements."
            );

        } finally {

            setLoadingHistory(false);

        }
    };

    /* ============================================================
       LOAD PAGE
    ============================================================ */

    useEffect(() => {

        loadAnnouncements();

    }, []);

    /* ============================================================
       SEND ANNOUNCEMENT
    ============================================================ */

    const handleSubmit = async (event) => {

        event.preventDefault();

        setSuccess("");
        setError("");

        const cleanTitle = title.trim();
        const cleanMessage = message.trim();

        /* --------------------------------------------------------
           VALIDATION
        -------------------------------------------------------- */

        if (!cleanTitle) {

            setError(
                "Please enter an announcement title."
            );

            return;
        }

        if (!cleanMessage) {

            setError(
                "Please enter an announcement message."
            );

            return;
        }

        if (cleanTitle.length > 120) {

            setError(
                "The announcement title cannot exceed 120 characters."
            );

            return;
        }

        if (cleanMessage.length > 2000) {

            setError(
                "The announcement message cannot exceed 2000 characters."
            );

            return;
        }

        /* --------------------------------------------------------
           SEND
        -------------------------------------------------------- */

        try {

            setLoading(true);

            const data = await adminFetch(
                "/admin/announcements",
                {
                    method: "POST",
                    body: JSON.stringify({
                        title: cleanTitle,
                        message: cleanMessage,
                        audience: "all_hosts",
                    }),
                }
            );

            setSuccess(
                data?.message ||
                "Announcement sent successfully."
            );

            setTitle("");
            setMessage("");

            await loadAnnouncements();

        } catch (error) {

            console.error(
                "ANNOUNCEMENT SEND ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to send announcement."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="admin-announcements">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="admin-announcements-header">

                <div>

                    <div className="admin-announcements-eyebrow">

                        <Megaphone size={16} />

                        Admin Communication

                    </div>

                    <h1>
                        Announcements
                    </h1>

                    <p>
                        Send important updates and announcements
                        directly to EventWaa hosts.
                    </p>

                </div>

                <div className="admin-announcements-header-icon">

                    <Megaphone size={25} />

                </div>

            </div>

            {/* =====================================================
                ALERTS
            ===================================================== */}

            {success && (

                <div className="announcement-alert success">

                    <CheckCircle2 size={19} />

                    <span>
                        {success}
                    </span>

                </div>

            )}

            {error && (

                <div className="announcement-alert error">

                    <AlertCircle size={19} />

                    <span>
                        {error}
                    </span>

                </div>

            )}

            {/* =====================================================
                CREATE ANNOUNCEMENT
            ===================================================== */}

            <section className="announcement-compose-card">

                <div className="announcement-section-heading">

                    <div className="announcement-section-icon">

                        <Send size={19} />

                    </div>

                    <div>

                        <h2>
                            Create Announcement
                        </h2>

                        <p>
                            This announcement will appear in the
                            notification inbox of all active hosts.
                        </p>

                    </div>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="announcement-form"
                >

                    {/* =================================================
                        TITLE
                    ================================================= */}

                    <div className="announcement-field">

                        <label htmlFor="announcement-title">
                            Title
                        </label>

                        <input
                            id="announcement-title"
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            placeholder="e.g. Important EventWaa Update"
                            maxLength={120}
                        />

                        <div className="announcement-character-count">

                            {title.length}/120

                        </div>

                    </div>

                    {/* =================================================
                        MESSAGE
                    ================================================= */}

                    <div className="announcement-field">

                        <label htmlFor="announcement-message">
                            Message
                        </label>

                        <textarea
                            id="announcement-message"
                            value={message}
                            onChange={(event) =>
                                setMessage(
                                    event.target.value
                                )
                            }
                            placeholder="Write your announcement here..."
                            rows={7}
                            maxLength={2000}
                        />

                        <div className="announcement-character-count">

                            {message.length}/2000

                        </div>

                    </div>

                    {/* =================================================
                        AUDIENCE
                    ================================================= */}

                    <div className="announcement-audience">

                        <div className="announcement-audience-icon">

                            <Users size={19} />

                        </div>

                        <div>

                            <strong>
                                Audience
                            </strong>

                            <span>
                                All active EventWaa hosts
                            </span>

                        </div>

                    </div>

                    {/* =================================================
                        SUBMIT
                    ================================================= */}

                    <button
                        type="submit"
                        className="announcement-send-button"
                        disabled={loading}
                    >

                        {loading ? (

                            <>
                                <RefreshCcw
                                    size={18}
                                    className="announcement-spinner"
                                />

                                Sending...
                            </>

                        ) : (

                            <>
                                <Send size={18} />

                                Send Announcement
                            </>

                        )}

                    </button>

                </form>

            </section>

            {/* =====================================================
                ANNOUNCEMENT HISTORY
            ===================================================== */}

            <section className="announcement-history-card">

                <div className="announcement-section-heading">

                    <div className="announcement-section-icon">

                        <Bell size={19} />

                    </div>

                    <div>

                        <h2>
                            Announcement History
                        </h2>

                        <p>
                            Previous announcements sent to hosts.
                        </p>

                    </div>

                </div>

                {/* =================================================
                    LOADING
                ================================================= */}

                {loadingHistory ? (

                    <div className="announcement-empty-state">

                        <RefreshCcw
                            size={22}
                            className="announcement-spinner"
                        />

                        <span>
                            Loading announcements...
                        </span>

                    </div>

                ) : announcements.length === 0 ? (

                    /* =============================================
                       EMPTY
                    ============================================= */

                    <div className="announcement-empty-state">

                        <Megaphone size={24} />

                        <span>
                            No announcements have been sent yet.
                        </span>

                    </div>

                ) : (

                    /* =============================================
                       HISTORY
                    ============================================= */

                    <div className="announcement-list">

                        {announcements.map(
                            (announcement) => (

                                <article
                                    key={announcement.id}
                                    className="announcement-item"
                                >

                                    <div className="announcement-item-top">

                                        <div className="announcement-item-icon">

                                            <Megaphone
                                                size={18}
                                            />

                                        </div>

                                        <div className="announcement-item-content">

                                            <h3>
                                                {announcement.title}
                                            </h3>

                                            <p>
                                                {announcement.message}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="announcement-item-meta">

                                        <span>

                                            <Users size={14} />

                                            {announcement.recipientCount ?? 0}

                                            {" "}

                                            hosts

                                        </span>

                                        <span>

                                            <Clock3 size={14} />

                                            {announcement.createdAt ||
                                                "Unknown date"}

                                        </span>

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

export default AdminAnnouncements;