import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/HostTeamMembers.css";

function HostTeamMembers() {
    const navigate = useNavigate();
    const { user } = useAuth();

    /*
     * ============================================================
     * API BASE URL
     * ============================================================
     *
     * If VITE_API_URL exists, use it.
     *
     * Otherwise use the local Flask backend.
     *
     * Example .env:
     *
     * VITE_API_URL=http://127.0.0.1:5000
     *
     */

    const API_BASE =
        import.meta.env.VITE_API_URL ||
        "http://127.0.0.1:5000";


    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    const [members, setMembers] = useState([]);

    const [events, setEvents] = useState([]);

    const [loading, setLoading] = useState(true);

    const [eventsLoading, setEventsLoading] =
        useState(true);

    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] =
        useState("");

    const [showAddMember, setShowAddMember] =
        useState(false);

    const [showPasswordModal, setShowPasswordModal] =
        useState(false);

    const [temporaryPassword, setTemporaryPassword] =
        useState("");

    const [addedMemberName, setAddedMemberName] =
        useState("");

    const [memberName, setMemberName] =
        useState("");

    const [memberEmail, setMemberEmail] =
        useState("");

    const [selectedEvent, setSelectedEvent] =
        useState("");

    const [formError, setFormError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");


    /*
     * ============================================================
     * HOST IDENTIFICATION
     * ============================================================
     */

    const hostId =
        user?.id ||
        user?._id ||
        user?.userId ||
        "";

    const hostEmail =
        user?.email ||
        "";


    /*
     * ============================================================
     * AUTH CHECK
     * ============================================================
     */

    const hasHostIdentity =
        Boolean(
            hostId ||
            hostEmail
        );


    /*
     * ============================================================
     * FETCH TEAM MEMBERS
     * ============================================================
     */

    const loadMembers = async () => {
        if (!hasHostIdentity) {
            setLoading(false);
            return;
        }

        try {
            setError("");

            const params =
                new URLSearchParams();

            if (hostId) {
                params.append(
                    "hostId",
                    hostId
                );
            }

            if (hostEmail) {
                params.append(
                    "hostEmail",
                    hostEmail
                );
            }

            const response =
                await fetch(
                    `${API_BASE}/host/team-members?${params.toString()}`
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load team members."
                );
            }

            setMembers(
                Array.isArray(data.members)
                    ? data.members
                    : []
            );

        } catch (err) {

            console.error(
                "HOST TEAM MEMBERS LOAD ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load your team members."
            );

        } finally {

            setLoading(false);
        }
    };


    /*
     * ============================================================
     * FETCH HOST EVENTS
     * ============================================================
     */

    const loadEvents = async () => {
        if (!hasHostIdentity) {
            setEventsLoading(false);
            return;
        }

        try {

            setEventsLoading(true);

            const params =
                new URLSearchParams();

            if (hostId) {
                params.append(
                    "hostId",
                    hostId
                );
            }

            if (hostEmail) {
                params.append(
                    "hostEmail",
                    hostEmail
                );
            }

            const response =
                await fetch(
                    `${API_BASE}/host/team-events?${params.toString()}`
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load events."
                );
            }

            setEvents(
                Array.isArray(data.events)
                    ? data.events
                    : []
            );

        } catch (err) {

            console.error(
                "HOST TEAM EVENTS LOAD ERROR:",
                err
            );

            setFormError(
                err.message ||
                "Unable to load your events."
            );

        } finally {

            setEventsLoading(false);
        }
    };


    /*
     * ============================================================
     * INITIAL LOAD
     * ============================================================
     */

    useEffect(() => {

        loadMembers();
        loadEvents();

    }, [
        hostId,
        hostEmail
    ]);


    /*
     * ============================================================
     * STATISTICS
     * ============================================================
     */

    const activeMembers =
        useMemo(
            () =>
                members.filter(
                    (member) =>
                        member.status ===
                        "Active"
                ),
            [members]
        );


    const disabledMembers =
        useMemo(
            () =>
                members.filter(
                    (member) =>
                        member.status ===
                        "Disabled"
                ),
            [members]
        );


    const assignedEventIds =
        useMemo(() => {

            return new Set(
                members
                    .map(
                        (member) =>
                            member.eventId
                    )
                    .filter(Boolean)
                    .map(String)
            );

        }, [members]);


    /*
     * ============================================================
     * RESET FORM
     * ============================================================
     */

    const resetForm = () => {

        setMemberName("");
        setMemberEmail("");
        setSelectedEvent("");
        setFormError("");
    };


    /*
     * ============================================================
     * OPEN ADD MODAL
     * ============================================================
     */

    const openAddMember = () => {

        resetForm();

        setShowAddMember(true);
    };


    /*
     * ============================================================
     * CLOSE ADD MODAL
     * ============================================================
     */

    const closeAddMember = () => {

        if (actionLoading) {
            return;
        }

        setShowAddMember(false);

        resetForm();
    };


    /*
     * ============================================================
     * ADD SCANNER
     * ============================================================
     */

    const handleAddMember = async (e) => {

        e.preventDefault();

        setFormError("");
        setSuccessMessage("");

        const cleanName =
            memberName.trim();

        const cleanEmail =
            memberEmail.trim().toLowerCase();


        /*
         * VALIDATION
         */

        if (!cleanName) {

            setFormError(
                "Please enter the scanner's full name."
            );

            return;
        }


        if (!cleanEmail) {

            setFormError(
                "Please enter the scanner's email address."
            );

            return;
        }


        if (!selectedEvent) {

            setFormError(
                "Please assign this scanner to an event."
            );

            return;
        }


        if (!hasHostIdentity) {

            setFormError(
                "Your host account could not be identified."
            );

            return;
        }


        try {

            setActionLoading("add");

            const response =
                await fetch(
                    `${API_BASE}/host/team-members`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                hostId:
                                    hostId || null,

                                hostEmail:
                                    hostEmail || null,

                                name:
                                    cleanName,

                                email:
                                    cleanEmail,

                                role:
                                    "Scanner",

                                eventId:
                                    selectedEvent

                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to add scanner."
                );
            }


            /*
             * Add returned member immediately.
             */

            if (data.member) {

                setMembers(
                    (previous) => [
                        ...previous,
                        data.member
                    ]
                );
            }


            /*
             * NEW ACCOUNT
             *
             * Backend only returns temporaryPassword
             * when a brand-new users.json account
             * was created.
             */

            if (data.temporaryPassword) {

                setTemporaryPassword(
                    data.temporaryPassword
                );

                setAddedMemberName(
                    cleanName
                );

                setShowPasswordModal(true);

            } else {

                setSuccessMessage(
                    "Scanner added successfully."
                );
            }


            setShowAddMember(false);

            resetForm();


            /*
             * Reload from backend so UI is
             * always synchronized with JSON.
             */

            await loadMembers();

        } catch (err) {

            console.error(
                "ADD TEAM MEMBER ERROR:",
                err
            );

            setFormError(
                err.message ||
                "Unable to add scanner."
            );

        } finally {

            setActionLoading("");
        }
    };


    /*
     * ============================================================
     * TOGGLE STATUS
     * ============================================================
     */

    const toggleMemberStatus =
        async (member) => {

            if (!hasHostIdentity) {
                return;
            }

            const newStatus =
                member.status === "Active"
                    ? "Disabled"
                    : "Active";


            try {

                setActionLoading(
                    `status-${member.id}`
                );


                const response =
                    await fetch(
                        `${API_BASE}/host/team-members/${encodeURIComponent(
                            member.id
                        )}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    hostId:
                                        hostId || null,

                                    hostEmail:
                                        hostEmail || null,

                                    status:
                                        newStatus

                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Unable to update scanner."
                    );
                }


                setMembers(
                    (previous) =>
                        previous.map(
                            (item) =>
                                item.id ===
                                member.id
                                    ? {
                                        ...item,
                                        ...(data.member ||
                                            {
                                                status:
                                                    newStatus
                                            })
                                    }
                                    : item
                        )
                );


                setSuccessMessage(
                    newStatus === "Active"
                        ? `${member.name} has been enabled.`
                        : `${member.name} has been disabled.`
                );


            } catch (err) {

                console.error(
                    "UPDATE TEAM MEMBER ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to update scanner."
                );

            } finally {

                setActionLoading("");
            }
        };


    /*
     * ============================================================
     * REMOVE MEMBER
     * ============================================================
     */

    const handleRemoveMember =
        async (member) => {

            const confirmed =
                window.confirm(
                    `Are you sure you want to remove ${member.name} from your team?`
                );


            if (!confirmed) {
                return;
            }


            try {

                setActionLoading(
                    `remove-${member.id}`
                );


                const response =
                    await fetch(
                        `${API_BASE}/host/team-members/${encodeURIComponent(
                            member.id
                        )}`,
                        {
                            method: "DELETE",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    hostId:
                                        hostId || null,

                                    hostEmail:
                                        hostEmail || null

                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Unable to remove scanner."
                    );
                }


                setMembers(
                    (previous) =>
                        previous.filter(
                            (item) =>
                                item.id !==
                                member.id
                        )
                );


                setSuccessMessage(
                    `${member.name} was removed from your team.`
                );


            } catch (err) {

                console.error(
                    "REMOVE TEAM MEMBER ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to remove scanner."
                );

            } finally {

                setActionLoading("");
            }
        };


    /*
     * ============================================================
     * CLOSE PASSWORD MODAL
     * ============================================================
     */

    const closePasswordModal = () => {

        setShowPasswordModal(false);

        setTemporaryPassword("");

        setAddedMemberName("");
    };


    /*
     * ============================================================
     * COPY TEMPORARY PASSWORD
     * ============================================================
     */

    const copyTemporaryPassword = async () => {

        try {

            await navigator.clipboard.writeText(
                temporaryPassword
            );

            setSuccessMessage(
                "Temporary password copied."
            );

        } catch (err) {

            console.error(
                "COPY PASSWORD ERROR:",
                err
            );
        }
    };


    /*
     * ============================================================
     * EVENT NAME
     * ============================================================
     */

    const getEventName = (member) => {

        if (member.eventTitle) {
            return member.eventTitle;
        }

        if (member.eventId) {

            const event =
                events.find(
                    (item) =>
                        String(item.id) ===
                        String(member.eventId)
                );

            if (event) {
                return event.title;
            }
        }

        return "No event assigned";
    };


    /*
     * ============================================================
     * AVATAR LETTERS
     * ============================================================
     */

    const getInitials = (name) => {

        if (!name) {
            return "SC";
        }

        const parts =
            name.trim().split(/\s+/);

        if (parts.length === 1) {

            return parts[0]
                .charAt(0)
                .toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1]
                .charAt(0)
        ).toUpperCase();
    };


    /*
     * ============================================================
     * RENDER
     * ============================================================
     */

    return (
        <div className="host-team-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <header className="host-team-header">

                <div className="host-team-header-content">

                    <button
                        className="host-team-back"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Dashboard
                    </button>

                    <div className="host-team-title-wrap">

                        <span className="host-team-eyebrow">
                            EVENT OPERATIONS
                        </span>

                        <h1>
                            Team Members
                        </h1>

                        <p>
                            Manage the scanners helping
                            you check in guests at your events.
                        </p>

                    </div>

                </div>


                <button
                    className="host-team-add-button"
                    onClick={openAddMember}
                >
                    <span>+</span>
                    Add Scanner
                </button>

            </header>


            {/* ====================================================
                MESSAGES
            ==================================================== */}

            {error && (

                <div className="host-team-alert error">

                    <span>!</span>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>
            )}


            {successMessage && (

                <div className="host-team-alert success">

                    <span>✓</span>

                    <p>
                        {successMessage}
                    </p>

                    <button
                        onClick={() =>
                            setSuccessMessage("")
                        }
                    >
                        ×
                    </button>

                </div>
            )}


            {/* ====================================================
                INFORMATION CARD
            ==================================================== */}

            <section className="host-team-info">

                <div className="host-team-info-icon">
                    🎟
                </div>

                <div>

                    <h3>
                        Scanner access only
                    </h3>

                    <p>
                        Team members can sign in to their
                        own EventWaa account and access the
                        scanner for the event assigned to them.
                        They do not have access to your wallet,
                        withdrawals, or private host information.
                    </p>

                </div>

            </section>


            {/* ====================================================
                STATISTICS
            ==================================================== */}

            <section className="host-team-stats">

                <div className="host-team-stat">

                    <div className="host-team-stat-icon">
                        👥
                    </div>

                    <div>

                        <strong>
                            {loading
                                ? "—"
                                : members.length}
                        </strong>

                        <small>
                            Team Members
                        </small>

                    </div>

                </div>


                <div className="host-team-stat">

                    <div className="host-team-stat-icon active">
                        ●
                    </div>

                    <div>

                        <strong>
                            {loading
                                ? "—"
                                : activeMembers.length}
                        </strong>

                        <small>
                            Active Scanners
                        </small>

                    </div>

                </div>


                <div className="host-team-stat">

                    <div className="host-team-stat-icon disabled">
                        ◌
                    </div>

                    <div>

                        <strong>
                            {loading
                                ? "—"
                                : disabledMembers.length}
                        </strong>

                        <small>
                            Disabled
                        </small>

                    </div>

                </div>


                <div className="host-team-stat">

                    <div className="host-team-stat-icon event">
                        📅
                    </div>

                    <div>

                        <strong>
                            {eventsLoading
                                ? "—"
                                : assignedEventIds.size}
                        </strong>

                        <small>
                            Assigned Events
                        </small>

                    </div>

                </div>

            </section>


            {/* ====================================================
                SCAN STATISTICS
            ==================================================== */}

            <section className="host-team-scan-section">

                <div className="host-team-scan-heading">

                    <div>

                        <span className="host-team-eyebrow">
                            SCANNER ACTIVITY
                        </span>

                        <h2>
                            Scan Statistics
                        </h2>

                        <p>
                            Exact ticket scanning data will appear
                            here as your team uses the secure scanner.
                        </p>

                    </div>

                    <div className="host-team-live-badge">
                        <span></span>
                        Live scanner data
                    </div>

                </div>


                <div className="host-team-scan-grid">

                    <div className="host-team-scan-card">

                        <span className="scan-card-icon">
                            🎟
                        </span>

                        <strong>
                            —
                        </strong>

                        <span>
                            Total Scanned
                        </span>

                        <small>
                            Awaiting scanner records
                        </small>

                    </div>


                    <div className="host-team-scan-card">

                        <span className="scan-card-icon">
                            ✓
                        </span>

                        <strong>
                            —
                        </strong>

                        <span>
                            Successful
                        </span>

                        <small>
                            Awaiting scanner records
                        </small>

                    </div>


                    <div className="host-team-scan-card">

                        <span className="scan-card-icon">
                            !
                        </span>

                        <strong>
                            —
                        </strong>

                        <span>
                            Invalid
                        </span>

                        <small>
                            Awaiting scanner records
                        </small>

                    </div>


                    <div className="host-team-scan-card">

                        <span className="scan-card-icon">
                            ◷
                        </span>

                        <strong>
                            —
                        </strong>

                        <span>
                            Today's Scans
                        </span>

                        <small>
                            Awaiting scanner records
                        </small>

                    </div>

                </div>

            </section>


            {/* ====================================================
                TEAM SECTION
            ==================================================== */}

            <section className="host-team-members-section">

                <div className="host-team-section-heading">

                    <div>

                        <span className="host-team-eyebrow">
                            YOUR STAFF
                        </span>

                        <h2>
                            Your Team
                        </h2>

                        <p>
                            Manage scanner access and event
                            assignments.
                        </p>

                    </div>

                    <span className="host-team-count">
                        {members.length}{" "}
                        {members.length === 1
                            ? "member"
                            : "members"}
                    </span>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (

                    <div className="host-team-loading">

                        <div className="host-team-spinner"></div>

                        <p>
                            Loading your team...
                        </p>

                    </div>

                ) : members.length === 0 ? (

                    /* =============================================
                       EMPTY STATE
                    ============================================= */

                    <div className="host-team-empty">

                        <div className="host-team-empty-icon">
                            🎟
                        </div>

                        <h3>
                            No scanners yet
                        </h3>

                        <p>
                            Add a team member and assign them
                            to one of your events so they can
                            help check in guests.
                        </p>

                        <button
                            onClick={openAddMember}
                        >
                            + Add Your First Scanner
                        </button>

                    </div>

                ) : (

                    /* =============================================
                       TEAM LIST
                    ============================================= */

                    <div className="host-team-list">

                        {members.map(
                            (member) => {

                                const isUpdating =
                                    actionLoading ===
                                    `status-${member.id}`;

                                const isRemoving =
                                    actionLoading ===
                                    `remove-${member.id}`;


                                return (

                                    <article
                                        className="host-team-member-card"
                                        key={member.id}
                                    >

                                        <div className="host-team-member-main">

                                            <div className="host-team-avatar">

                                                {getInitials(
                                                    member.name
                                                )}

                                            </div>


                                            <div className="host-team-member-details">

                                                <div className="host-team-name-row">

                                                    <h3>
                                                        {member.name}
                                                    </h3>

                                                    <span className="host-team-role-badge">
                                                        🎟 Scanner
                                                    </span>

                                                </div>


                                                <p className="host-team-email">
                                                    {member.email}
                                                </p>


                                                <div className="host-team-member-meta">

                                                    <span>
                                                        <b>
                                                            Event
                                                        </b>

                                                        <span>
                                                            {getEventName(
                                                                member
                                                            )}
                                                        </span>
                                                    </span>

                                                </div>

                                            </div>

                                        </div>


                                        <div className="host-team-member-actions">

                                            <span
                                                className={`host-team-status ${
                                                    member.status ===
                                                    "Active"
                                                        ? "active"
                                                        : "disabled"
                                                }`}
                                            >
                                                <span>
                                                    ●
                                                </span>

                                                {member.status}
                                            </span>


                                            <button
                                                className="host-team-status-button"
                                                onClick={() =>
                                                    toggleMemberStatus(
                                                        member
                                                    )
                                                }
                                                disabled={
                                                    isUpdating ||
                                                    isRemoving
                                                }
                                            >
                                                {isUpdating
                                                    ? "Updating..."
                                                    : member.status ===
                                                      "Active"
                                                    ? "Disable"
                                                    : "Enable"}
                                            </button>


                                            <button
                                                className="host-team-remove-button"
                                                onClick={() =>
                                                    handleRemoveMember(
                                                        member
                                                    )
                                                }
                                                disabled={
                                                    isUpdating ||
                                                    isRemoving
                                                }
                                            >
                                                {isRemoving
                                                    ? "Removing..."
                                                    : "Remove"}
                                            </button>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>
                )}

            </section>


            {/* ====================================================
                ADD SCANNER MODAL
            ==================================================== */}

            {showAddMember && (

                <div
                    className="host-team-modal-overlay"
                    onClick={closeAddMember}
                >

                    <div
                        className="host-team-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="host-team-modal-header">

                            <div>

                                <span className="host-team-eyebrow">
                                    TEAM ACCESS
                                </span>

                                <h2>
                                    Add Scanner
                                </h2>

                                <p>
                                    Give someone secure scanner
                                    access to one of your events.
                                </p>

                            </div>


                            <button
                                className="host-team-modal-close"
                                onClick={closeAddMember}
                                disabled={
                                    actionLoading ===
                                    "add"
                                }
                            >
                                ×
                            </button>

                        </div>


                        {formError && (

                            <div className="host-team-form-error">

                                <span>!</span>

                                {formError}

                            </div>

                        )}


                        <form
                            onSubmit={
                                handleAddMember
                            }
                            className="host-team-form"
                        >

                            <div className="host-team-form-group">

                                <label>
                                    Full name
                                </label>

                                <input
                                    type="text"
                                    value={
                                        memberName
                                    }
                                    onChange={(e) =>
                                        setMemberName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter scanner's full name"
                                    autoComplete="name"
                                    disabled={
                                        actionLoading ===
                                        "add"
                                    }
                                    required
                                />

                            </div>


                            <div className="host-team-form-group">

                                <label>
                                    Email address
                                </label>

                                <input
                                    type="email"
                                    value={
                                        memberEmail
                                    }
                                    onChange={(e) =>
                                        setMemberEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter scanner's email"
                                    autoComplete="email"
                                    disabled={
                                        actionLoading ===
                                        "add"
                                    }
                                    required
                                />

                            </div>


                            <div className="host-team-form-group">

                                <label>
                                    Access role
                                </label>

                                <div className="host-team-role-display">

                                    <span>
                                        🎟
                                    </span>

                                    <div>

                                        <strong>
                                            Scanner
                                        </strong>

                                        <small>
                                            Can scan tickets for
                                            the assigned event.
                                        </small>

                                    </div>

                                    <span className="host-team-fixed-badge">
                                        Fixed
                                    </span>

                                </div>

                            </div>


                            <div className="host-team-form-group">

                                <label>
                                    Assign event
                                    <span>
                                        *
                                    </span>
                                </label>

                                <select
                                    value={
                                        selectedEvent
                                    }
                                    onChange={(e) =>
                                        setSelectedEvent(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        eventsLoading ||
                                        actionLoading ===
                                            "add"
                                    }
                                    required
                                >

                                    <option value="">
                                        {eventsLoading
                                            ? "Loading your events..."
                                            : events.length === 0
                                            ? "No events available"
                                            : "Select an event"}
                                    </option>


                                    {events.map(
                                        (event) => (

                                            <option
                                                key={
                                                    event.id
                                                }
                                                value={
                                                    event.id
                                                }
                                            >
                                                {
                                                    event.title
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                                {events.length === 0 &&
                                    !eventsLoading && (

                                        <small className="host-team-field-help">
                                            You need to have an
                                            event assigned to your
                                            host account before you
                                            can add a scanner.
                                        </small>
                                    )}

                            </div>


                            <div className="host-team-permission-box">

                                <div className="host-team-permission-icon">
                                    🔐
                                </div>

                                <div>

                                    <strong>
                                        Secure scanner access
                                    </strong>

                                    <p>
                                        This account will only be
                                        able to use the EventWaa
                                        scanner for its assigned
                                        event. It will not have
                                        access to your wallet,
                                        withdrawals, or host
                                        controls.
                                    </p>

                                </div>

                            </div>


                            <div className="host-team-form-actions">

                                <button
                                    type="button"
                                    className="host-team-cancel-button"
                                    onClick={
                                        closeAddMember
                                    }
                                    disabled={
                                        actionLoading ===
                                        "add"
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="host-team-submit-button"
                                    disabled={
                                        actionLoading ===
                                            "add" ||
                                        events.length === 0
                                    }
                                >
                                    {actionLoading ===
                                    "add"
                                        ? "Adding Scanner..."
                                        : "Add Scanner"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* ====================================================
                TEMPORARY PASSWORD MODAL
            ==================================================== */}

            {showPasswordModal && (

                <div className="host-team-modal-overlay">

                    <div className="host-team-password-modal">

                        <div className="host-team-password-icon">
                            ✓
                        </div>

                        <span className="host-team-eyebrow">
                            ACCOUNT CREATED
                        </span>

                        <h2>
                            Scanner added successfully
                        </h2>

                        <p>
                            A new EventWaa scanner account was
                            created for{" "}
                            <strong>
                                {addedMemberName}
                            </strong>.
                        </p>


                        <div className="host-team-password-warning">

                            <strong>
                                Temporary password
                            </strong>

                            <p>
                                Give this password securely to
                                the team member. They will use
                                their email and this password to
                                access their scanner account.
                            </p>

                            <div className="host-team-password-value">

                                <code>
                                    {temporaryPassword}
                                </code>

                                <button
                                    onClick={
                                        copyTemporaryPassword
                                    }
                                >
                                    Copy
                                </button>

                            </div>

                        </div>


                        <div className="host-team-password-note">

                            <span>
                                🔒
                            </span>

                            <p>
                                This password is shown here because
                                this is the only time the backend
                                returns the temporary password.
                                Store it securely.
                            </p>

                        </div>


                        <button
                            className="host-team-password-close"
                            onClick={
                                closePasswordModal
                            }
                        >
                            Done
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

export default HostTeamMembers;