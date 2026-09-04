import { useEffect, useMemo, useState } from "react";
import {
    FiCheck,
    FiFolder,
    FiInfo,
    FiMail,
    FiMapPin,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiShield,
    FiTag,
    FiUserX,
    FiUsers,
    FiX
} from "react-icons/fi";
import "../styles/AdminTeamMembers.css";

function AdminTeamMembers() {

    /* =========================================================
       BACKEND
    ========================================================= */

    const BACKEND_URL = "http://localhost:5000";


    /* =========================================================
       STATE
    ========================================================= */

    const [members, setMembers] = useState([]);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [roleFilter, setRoleFilter] =
        useState("All");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [invitingMemberId, setInvitingMemberId] =
        useState(null);

    const [assigningMemberId, setAssigningMemberId] =
        useState(null);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    /* =========================================================
       ADD MEMBER MODAL
    ========================================================= */

    const [showAddModal, setShowAddModal] =
        useState(false);


    const [newMember, setNewMember] = useState({
        name: "",
        email: "",
        host: "",
        event: "",
        role: "Scanner",
        status: "Active"
    });


    /* =========================================================
       ASSIGN / REASSIGN MODAL
    ========================================================= */

    const [showAssignmentModal, setShowAssignmentModal] =
        useState(false);


    const [assignmentMember, setAssignmentMember] =
        useState(null);


    const [assignmentForm, setAssignmentForm] =
        useState({
            host: "",
            event: ""
        });


    /* =========================================================
       ADMIN AUTH TOKEN
    ========================================================= */

    const getAdminToken = () => {

        return (
            localStorage.getItem(
                "eventwaa_admin_token"
            ) ||
            sessionStorage.getItem(
                "eventwaa_admin_token"
            )
        );

    };


    /* =========================================================
       AUTH HEADERS
    ========================================================= */

    const getAuthHeaders = () => {

        const token =
            getAdminToken();

        return {
            "Content-Type":
                "application/json",

            ...(token
                ? {
                    Authorization:
                        `Bearer ${token}`
                }
                : {})
        };

    };


    /* =========================================================
       LOAD TEAM MEMBERS
    ========================================================= */

    const loadTeamMembers = async () => {

        try {

            setLoading(true);

            setError("");

            const response =
                await fetch(
                    `${BACKEND_URL}/admin/team-members`,
                    {
                        method: "GET",
                        headers:
                            getAuthHeaders()
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load team members."
                );

            }


            const loadedMembers =
                Array.isArray(data)
                    ? data
                    : Array.isArray(
                        data.members
                    )
                        ? data.members
                        : [];


            setMembers(
                loadedMembers
            );

        } catch (loadError) {

            console.error(
                "ADMIN TEAM MEMBERS LOAD ERROR:",
                loadError
            );

            setError(
                loadError.message ||
                "Unable to load team members."
            );

        } finally {

            setLoading(false);

        }

    };


    /* =========================================================
       LOAD ON PAGE OPEN
    ========================================================= */

    useEffect(() => {

        loadTeamMembers();

    }, []);


    /* =========================================================
       SUCCESS MESSAGE
    ========================================================= */

    const showSuccessMessage = (
        message
    ) => {

        setSuccess(message);

        setTimeout(() => {

            setSuccess("");

        }, 5000);

    };


    /* =========================================================
       FILTER MEMBERS
    ========================================================= */

    const filteredMembers =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();


            return members.filter(
                (member) => {

                    const name =
                        String(
                            member.name || ""
                        ).toLowerCase();


                    const email =
                        String(
                            member.email || ""
                        ).toLowerCase();


                    const host =
                        String(
                            member.host || ""
                        ).toLowerCase();


                    const event =
                        String(
                            member.event || ""
                        ).toLowerCase();


                    const matchesSearch =
                        !searchValue ||
                        name.includes(
                            searchValue
                        ) ||
                        email.includes(
                            searchValue
                        ) ||
                        host.includes(
                            searchValue
                        ) ||
                        event.includes(
                            searchValue
                        );


                    const matchesStatus =
                        statusFilter ===
                            "All" ||
                        member.status ===
                            statusFilter;


                    const matchesRole =
                        roleFilter ===
                            "All" ||
                        member.role ===
                            roleFilter;


                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesRole
                    );

                }
            );

        }, [
            members,
            search,
            statusFilter,
            roleFilter
        ]);


    /* =========================================================
       STATISTICS
    ========================================================= */

    const totalMembers =
        members.length;


    const activeMembers =
        members.filter(
            (member) =>
                member.status ===
                "Active"
        ).length;


    const scannerMembers =
        members.filter(
            (member) =>
                member.role ===
                "Scanner"
        ).length;


    const disabledMembers =
        members.filter(
            (member) =>
                member.status ===
                "Disabled"
        ).length;


    /* =========================================================
       ADD MEMBER INPUT
    ========================================================= */

    const handleNewMemberChange = (
        field,
        value
    ) => {

        setNewMember(
            (previous) => ({
                ...previous,
                [field]: value
            })
        );

    };


    /* =========================================================
       RESET ADD MEMBER FORM
    ========================================================= */

    const resetAddMemberForm = () => {

        setNewMember({

            name: "",
            email: "",
            host: "",
            event: "",
            role: "Scanner",
            status: "Active"

        });

    };


    /* =========================================================
       OPEN ADD MEMBER
    ========================================================= */

    const openAddMember = () => {

        setError("");

        setSuccess("");

        resetAddMemberForm();

        setShowAddModal(true);

    };


    /* =========================================================
       CLOSE ADD MEMBER
    ========================================================= */

    const closeAddMember = () => {

        if (saving) return;

        setShowAddModal(false);

        resetAddMemberForm();

    };


    /* =========================================================
       ADD TEAM MEMBER
    ========================================================= */

    const handleAddMember = async (
        e
    ) => {

        e.preventDefault();

        setError("");

        setSuccess("");


        const name =
            newMember.name.trim();


        const email =
            newMember.email
                .trim()
                .toLowerCase();


        const host =
            newMember.host.trim();


        const event =
            newMember.event.trim();


        if (!name || !email) {

            setError(
                "Team member name and email are required."
            );

            return;

        }


        try {

            setSaving(true);


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/team-members`,
                    {
                        method: "POST",

                        headers:
                            getAuthHeaders(),

                        body:
                            JSON.stringify({

                                name,

                                email,

                                host,

                                event,

                                role:
                                    newMember.role,

                                status:
                                    "Active"

                            })
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to add team member."
                );

            }


            const createdMember =
                data.member;


            if (createdMember) {

                setMembers(
                    (previous) => [
                        ...previous,
                        createdMember
                    ]
                );

            } else {

                await loadTeamMembers();

            }


            setShowAddModal(false);

            resetAddMemberForm();


            showSuccessMessage(
                "Team member added successfully. You can now send their invitation."
            );

        } catch (addError) {

            console.error(
                "ADD ADMIN TEAM MEMBER ERROR:",
                addError
            );

            setError(
                addError.message ||
                "Unable to add team member."
            );

        } finally {

            setSaving(false);

        }

    };


    /* =========================================================
       OPEN ASSIGNMENT MODAL
       =========================================================
       
       IMPORTANT:
       This works for both:
       
       1. First assignment
       2. Reassignment after an event has passed
       
       Previous assignment history is NOT deleted.
    ========================================================= */

    const openAssignmentModal = (
        member
    ) => {

        setError("");

        setSuccess("");


        setAssignmentMember(
            member
        );


        setAssignmentForm({

            host:
                member.host || "",

            event:
                ""

        });


        setShowAssignmentModal(
            true
        );

    };


    /* =========================================================
       CLOSE ASSIGNMENT MODAL
    ========================================================= */

    const closeAssignmentModal = () => {

        if (assigningMemberId) {
            return;
        }


        setShowAssignmentModal(
            false
        );


        setAssignmentMember(
            null
        );


        setAssignmentForm({

            host: "",
            event: ""

        });

    };


    /* =========================================================
       ASSIGNMENT INPUT
    ========================================================= */

    const handleAssignmentChange = (
        field,
        value
    ) => {

        setAssignmentForm(
            (previous) => ({
                ...previous,
                [field]: value
            })
        );

    };


    /* =========================================================
       ASSIGN / REASSIGN EVENT
       ========================================================= */

    const handleAssignEvent = async (
        e
    ) => {

        e.preventDefault();


        if (
            !assignmentMember ||
            !assignmentMember.id
        ) {

            setError(
                "Unable to identify this team member."
            );

            return;

        }


        const event =
            assignmentForm.event
                .trim();


        const host =
            assignmentForm.host
                .trim();


        if (!event) {

            setError(
                "Please enter the event this team member should be assigned to."
            );

            return;

        }


        try {

            setAssigningMemberId(
                assignmentMember.id
            );


            setError("");

            setSuccess("");


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/team-members/${assignmentMember.id}/assign`,
                    {
                        method: "PUT",

                        headers:
                            getAuthHeaders(),

                        body:
                            JSON.stringify({

                                host,

                                event

                            })
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to assign team member."
                );

            }


            const updatedMember =
                data.member;


            setMembers(
                (previous) =>
                    previous.map(
                        (item) => {

                            if (
                                String(item.id) !==
                                String(
                                    assignmentMember.id
                                )
                            ) {

                                return item;

                            }


                            return (
                                updatedMember ||
                                {
                                    ...item,

                                    host,

                                    event

                                }
                            );

                        }
                    )
            );


            setShowAssignmentModal(
                false
            );


            setAssignmentMember(
                null
            );


            setAssignmentForm({

                host: "",
                event: ""

            });


            showSuccessMessage(
                updatedMember?.previousAssignment
                    ? "Team member reassigned successfully. Previous assignment was preserved in their history."
                    : "Team member assigned to the event successfully."
            );


        } catch (assignmentError) {

            console.error(
                "ASSIGN TEAM MEMBER ERROR:",
                assignmentError
            );


            setError(
                assignmentError.message ||
                "Unable to assign team member."
            );

        } finally {

            setAssigningMemberId(
                null
            );

        }

    };


    /* =========================================================
       SEND TEAM MEMBER INVITATION
    ========================================================= */

    const sendInvitation = async (
        member
    ) => {

        if (!member || !member.id) {

            setError(
                "Unable to identify this team member."
            );

            return;

        }


        if (!member.email) {

            setError(
                "This team member does not have an email address."
            );

            return;

        }


        if (
            member.status ===
            "Disabled"
        ) {

            setError(
                "Disabled team members cannot receive invitations."
            );

            return;

        }


        if (
            member.invitationStatus ===
            "Accepted"
        ) {

            setError(
                "This team member has already accepted the invitation."
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Send an EventWaa team invitation to ${member.email}?`
            );


        if (!confirmed) return;


        try {

            setInvitingMemberId(
                member.id
            );


            setError("");

            setSuccess("");


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/team-members/${member.id}/invite`,
                    {
                        method: "POST",

                        headers:
                            getAuthHeaders()
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to send team invitation."
                );

            }


            const updatedMember =
                data.member;


            setMembers(
                (previous) =>
                    previous.map(
                        (item) => {

                            if (
                                String(item.id) !==
                                String(member.id)
                            ) {

                                return item;

                            }


                            return (
                                updatedMember ||
                                {
                                    ...item,

                                    invitationStatus:
                                        "Pending",

                                    invitationSentAt:
                                        new Date().toISOString()

                                }
                            );

                        }
                    )
            );


            showSuccessMessage(
                `Invitation sent successfully to ${member.email}.`
            );


        } catch (inviteError) {

            console.error(
                "SEND TEAM INVITATION ERROR:",
                inviteError
            );


            setError(
                inviteError.message ||
                "Unable to send team invitation."
            );

        } finally {

            setInvitingMemberId(
                null
            );

        }

    };


    /* =========================================================
       TOGGLE MEMBER STATUS
    ========================================================= */

    const toggleMemberStatus = async (
        member
    ) => {

        const newStatus =
            member.status === "Active"
                ? "Disabled"
                : "Active";


        try {

            setError("");

            setSuccess("");


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/team-members/${member.id}`,
                    {
                        method: "PUT",

                        headers:
                            getAuthHeaders(),

                        body:
                            JSON.stringify({

                                status:
                                    newStatus

                            })
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Unable to ${
                        newStatus === "Active"
                            ? "enable"
                            : "disable"
                    } team member.`
                );

            }


            const updatedMember =
                data.member;


            setMembers(
                (previous) =>
                    previous.map(
                        (item) => {

                            if (
                                String(item.id) !==
                                String(member.id)
                            ) {

                                return item;

                            }


                            return (
                                updatedMember ||
                                {
                                    ...item,

                                    status:
                                        newStatus

                                }
                            );

                        }
                    )
            );


            showSuccessMessage(
                `Team member ${
                    newStatus === "Active"
                        ? "enabled"
                        : "disabled"
                } successfully.`
            );


        } catch (toggleError) {

            console.error(
                "TEAM MEMBER STATUS ERROR:",
                toggleError
            );


            setError(
                toggleError.message ||
                "Unable to update team member."
            );

        }

    };


    /* =========================================================
       REMOVE MEMBER
    ========================================================= */

    const removeMember = async (
        member
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to remove ${member.name || "this team member"}?`
            );


        if (!confirmed) return;


        try {

            setError("");

            setSuccess("");


            const response =
                await fetch(
                    `${BACKEND_URL}/admin/team-members/${member.id}`,
                    {
                        method: "DELETE",

                        headers:
                            getAuthHeaders()
                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to remove team member."
                );

            }


            setMembers(
                (previous) =>
                    previous.filter(
                        (item) =>
                            String(item.id) !==
                            String(member.id)
                    )
            );


            showSuccessMessage(
                "Team member removed successfully."
            );


        } catch (removeError) {

            console.error(
                "REMOVE TEAM MEMBER ERROR:",
                removeError
            );


            setError(
                removeError.message ||
                "Unable to remove team member."
            );

        }

    };


    /* =========================================================
       INVITATION UI
    ========================================================= */

    const renderInvitationAction = (
        member
    ) => {

        const invitationStatus =
            member.invitationStatus ||
            "";


        if (
            invitationStatus ===
            "Accepted"
        ) {

            return (
                <span className="admin-team-invitation accepted">
                    <FiCheck aria-hidden="true" />
                    Accepted
                </span>
            );

        }


        if (
            invitationStatus ===
            "Pending"
        ) {

            return (
                <button
                    type="button"
                    className="admin-team-invite-btn pending"
                    onClick={() =>
                        sendInvitation(
                            member
                        )
                    }
                    disabled={
                        invitingMemberId ===
                            member.id ||
                        member.status ===
                            "Disabled"
                    }
                >
                    {invitingMemberId ===
                    member.id ? (
                        <>
                            <span className="admin-team-button-spinner"></span>
                            Sending...
                        </>
                    ) : (
                        <>
                            <FiMail aria-hidden="true" />
                            Send Invitation
                        </>
                    )}
                </button>
            );

        }


        return (
            <button
                type="button"
                className="admin-team-invite-btn"
                onClick={() =>
                    sendInvitation(
                        member
                    )
                }
                disabled={
                    invitingMemberId ===
                        member.id ||
                    member.status ===
                        "Disabled"
                }
            >
                {invitingMemberId ===
                member.id ? (
                    <>
                        <span className="admin-team-button-spinner"></span>
                        Sending...
                    </>
                ) : (
                    <>
                        <FiMail aria-hidden="true" />
                        Send Invitation
                    </>
                )}
            </button>
        );

    };


    /* =========================================================
       CURRENT ASSIGNMENT DISPLAY
    ========================================================= */

    const renderCurrentAssignment = (
        member
    ) => {

        const event =
            String(
                member.event || ""
            ).trim();


        const host =
            String(
                member.host || ""
            ).trim();


        if (!event && !host) {

            return (
                <div className="admin-team-no-assignment">

                    <span>
                        No event assigned
                    </span>

                    <small>
                        Ready for assignment
                    </small>

                </div>
            );

        }


        return (
            <div className="admin-team-current-assignment">

                <span className="admin-team-assignment-label">
                    CURRENT ASSIGNMENT
                </span>


                <strong>
                    {event || "Event not specified"}
                </strong>


                {host && (
                    <small>
                        Host: {host}
                    </small>
                )}

            </div>
        );

    };


    /* =========================================================
       PREVIOUS ASSIGNMENT HISTORY
    ========================================================= */

    const getAssignmentHistory = (
        member
    ) => {

        if (!member) {
            return [];
        }

        /* =====================================================
           PRIMARY HISTORY SOURCE
           ===================================================== */

        if (
            Array.isArray(
                member.assignmentHistory
            )
        ) {

            return member.assignmentHistory.filter(
                (assignment) =>
                    assignment &&
                    typeof assignment === "object"
            );

        }

        /* =====================================================
           BACKWARD COMPATIBILITY
           ===================================================== */

        if (
            Array.isArray(
                member.previousAssignments
            )
        ) {

            return member.previousAssignments.filter(
                (assignment) =>
                    assignment &&
                    typeof assignment === "object"
            );

        }

        /* =====================================================
           NO HISTORY
           ===================================================== */

        return [];

    };

    const renderAssignmentHistory = (member) => {
    const history = getAssignmentHistory(member);
    /* =====================================================
       SHOW ONLY THE 5 MOST RECENT ASSIGNMENTS
       ===================================================== */
    /* =====================================================
   SHOW MOST RECENT ASSIGNMENTS FIRST
   ===================================================== */

    const orderedHistory = [...history].reverse();

    const visibleHistory = orderedHistory.slice(0, 5);

    const remainingHistory = orderedHistory.slice(5);
    /* =====================================================
       DATE FORMATTER
       ===================================================== */
    const formatDate = (date) => {
        if (!date) {
            return "";
        }
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }
        return parsedDate.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };
    /* =====================================================
       RENDER ONE HISTORY ITEM
       ===================================================== */
    const renderHistoryItem = (assignment, index, totalItems) => {
        const event =
            assignment.event ||
            assignment.eventName ||
            "Unknown event";
        const host =
            assignment.host ||
            assignment.hostName ||
            "";
        const assignedAt =
            assignment.assignedAt ||
            assignment.createdAt ||
            "";
        const endedAt =
            assignment.endedAt ||
            assignment.unassignedAt ||
            "";
        return (
            <div
                className="admin-team-history-item"
                key={
                    assignment.id ||
                    `${member.id}-history-${index}`
                }
            >
                {/* =================================================
                   TIMELINE
                   ================================================= */}
                <div className="admin-team-history-timeline">
                    <span className="admin-team-history-dot">
                        <FiCheck aria-hidden="true" />
                    </span>
                    {index < totalItems - 1 && (
                        <span className="admin-team-history-line"></span>
                    )}
                </div>
                {/* =================================================
                   CONTENT
                   ================================================= */}
                <div className="admin-team-history-content">
                    {/* EVENT */}
                    <div className="admin-team-history-event-row">
                        <strong>
                            {event}
                        </strong>
                        <span className="admin-team-history-completed">
                            Completed
                        </span>
                    </div>
                    {/* HOST */}
                    {host && (
                        <div className="admin-team-history-host">
                            <span>
                                Host
                            </span>
                            <strong>
                                {host}
                            </strong>
                        </div>
                    )}
                    {/* DATES */}
                    <div className="admin-team-history-dates">
                        {assignedAt && (
                            <span>
                                <small>
                                    Assigned
                                </small>
                                {formatDate(assignedAt)}
                            </span>
                        )}
                        {endedAt && (
                            <span>
                                <small>
                                    Ended
                                </small>
                                {formatDate(endedAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    /* =====================================================
       EMPTY HISTORY
       ===================================================== */
    if (!history.length) {
        return (
            <div className="admin-team-history">
                <div className="admin-team-history-header">
                    <div>
                        <span className="admin-team-history-eyebrow">
                            ASSIGNMENT HISTORY
                        </span>
                        <h4>
                            Previous Events
                        </h4>
                    </div>
                    <span className="admin-team-history-count">
                        0
                    </span>
                </div>
                <div className="admin-team-history-empty">
                    <div className="admin-team-history-empty-icon">
                        <FiFolder aria-hidden="true" />
                    </div>
                    <div>
                        <strong>
                            No previous assignments
                        </strong>
                        <p>
                            This team member has not worked
                            on another event yet.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    /* =====================================================
       MAIN HISTORY
       ===================================================== */
    return (
        <div className="admin-team-history">
            {/* =================================================
               HISTORY HEADER
               ================================================= */}
            <div className="admin-team-history-header">
                <div>
                    <span className="admin-team-history-eyebrow">
                        ASSIGNMENT HISTORY
                    </span>
                    <h4>
                        Previous Events
                    </h4>
                </div>
                <span className="admin-team-history-count">
                    {history.length}
                </span>
            </div>
            {/* =================================================
               LATEST 5 EVENTS
               ================================================= */}
            <div className="admin-team-history-list">
                {visibleHistory.map(
                    (assignment, index) =>
                        renderHistoryItem(
                            assignment,
                            index,
                            visibleHistory.length
                        )
                )}
            </div>
            {/* =================================================
               VIEW ALL
               ONLY APPEARS WHEN THERE ARE MORE THAN 5
               ================================================= */}
            {remainingHistory.length > 0 && (
                <details className="admin-team-history-more">
                    <summary className="admin-team-history-more-button">
                        <span>
                            View all {history.length} assignments
                        </span>
                        <span className="admin-team-history-more-arrow">
                            ↓
                        </span>
                    </summary>
                    {/* =================================================
                       REMAINING HISTORY
                       ================================================= */}
                    <div className="admin-team-history-list admin-team-history-full-list">
                        {remainingHistory.map(
                            (assignment, index) =>
                                renderHistoryItem(
                                    assignment,
                                    index + 5,
                                    history.length
                                )
                        )}
                    </div>
                </details>
            )}
        </div>
    );
};

    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <div className="admin-team-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="admin-team-header">

                <div>

                    <span className="admin-team-eyebrow">
                        PLATFORM MANAGEMENT
                    </span>

                    <h1>
                        Team Members
                    </h1>

                    <p>
                        Monitor and manage team members
                        across the EventWaa platform.
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-add-member-btn"
                    onClick={openAddMember}
                >
                    <FiPlus aria-hidden="true" />
                    Add Team Member
                </button>

            </header>


            {/* =====================================================
                ALERTS
            ===================================================== */}

            {error && (

                <div
                    className="admin-team-alert admin-team-error"
                    role="alert"
                >

                    <strong>
                        Something went wrong
                    </strong>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <FiX aria-hidden="true" />
                    </button>

                </div>

            )}


            {success && (

                <div
                    className="admin-team-alert admin-team-success"
                    role="status"
                >

                    <strong>
                        Success
                    </strong>

                    <span>
                        {success}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        <FiX aria-hidden="true" />
                    </button>

                </div>

            )}


            {/* =====================================================
                STATS
            ===================================================== */}

            <section className="admin-team-stats">

                <div className="admin-team-stat-card">

                

                <div className="admin-team-stat-icon">
                    <FiUsers aria-hidden="true" />
                </div>



                    <div>

                        <strong>
                            {totalMembers}
                        </strong>

                        <span>
                            Total Members
                        </span>

                    </div>

                </div>


                <div className="admin-team-stat-card">

                    <div className="admin-team-stat-icon">
                        <FiCheck aria-hidden="true" />
                    </div>

                    <div>

                        <strong>
                            {activeMembers}
                        </strong>

                        <span>
                            Active
                        </span>

                    </div>

                </div>


                <div className="admin-team-stat-card">

                    <div className="admin-team-stat-icon">
                        <FiTag aria-hidden="true" />
                    </div>

                    <div>

                        <strong>
                            {scannerMembers}
                        </strong>

                        <span>
                            Scanners
                        </span>

                    </div>

                </div>


                <div className="admin-team-stat-card">

                    <div className="admin-team-stat-icon">
                        <FiUserX aria-hidden="true" />
                    </div>

                    <div>

                        <strong>
                            {disabledMembers}
                        </strong>

                        <span>
                            Disabled
                        </span>

                    </div>

                </div>

            </section>


            {/* =====================================================
                TEAM MEMBERS PANEL
            ===================================================== */}

            <section className="admin-team-panel">

                <div className="admin-team-panel-header">

                    <div>

                        <h2>
                            All Team Members
                        </h2>

                        <p>
                            Search and manage platform
                            team-member access.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="admin-panel-add-btn"
                        onClick={openAddMember}
                    >
                        <FiPlus aria-hidden="true" />
                        Add Member
                    </button>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="admin-team-filters">

                    <div className="admin-team-search">
                        <FiSearch aria-hidden="true" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search members, hosts or events..."
                        />
                    </div>


                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Status
                        </option>

                        <option value="Active">
                            Active
                        </option>

                        <option value="Disabled">
                            Disabled
                        </option>

                    </select>


                    <select
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Roles
                        </option>

                        <option value="Scanner">
                            Scanner
                        </option>

                        <option value="Event Staff">
                            Event Staff
                        </option>

                        <option value="Manager">
                            Manager
                        </option>

                    </select>

                </div>


                {/* =================================================
                    RESULT COUNT
                ================================================= */}

                <div className="admin-team-result-count">

                    Showing{" "}

                    <strong>
                        {filteredMembers.length}
                    </strong>{" "}

                    team members

                </div>


                {/* =================================================
                    LOADING / EMPTY / MEMBERS
                ================================================= */}

                {loading ? (

                    <div className="admin-team-loading">

                        <div className="admin-team-spinner"></div>

                        <p>
                            Loading team members...
                        </p>

                    </div>

                ) : filteredMembers.length === 0 ? (

                    <div className="admin-team-empty">

                        <div className="admin-team-empty-icon">
                            <FiUsers aria-hidden="true" />
                        </div>

                        <h3>
                            No team members found
                        </h3>

                        <p>

                            {members.length === 0

                                ? "Add your first team member to get started."

                                : "Try changing your search or filters."

                            }

                        </p>


                        {members.length === 0 && (

                            <button
                                type="button"
                                className="admin-empty-add-btn"
                                onClick={openAddMember}
                            >
                                + Add Team Member
                            </button>

                        )}

                    </div>

                ) : (

                    <div className="admin-team-list">

                        {filteredMembers.map(
                            (member) => (

                                <article
                                    className="admin-team-member"
                                    key={member.id}
                                >

                                    {/* =================================
                                        PERSON
                                    ================================= */}

                                    <div className="admin-team-member-person">

                                        <div className="admin-team-avatar">

                                            {String(
                                                member.name ||
                                                "T"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}

                                        </div>


                                        <div>

                                            <h3>
                                                {member.name ||
                                                    "Unnamed Member"}
                                            </h3>

                                            <p>
                                                {member.email ||
                                                    "No email provided"}
                                            </p>

                                        </div>

                                    </div>


                                    {/* =================================
                                        INFORMATION
                                    ================================= */}

                                    <div className="admin-team-member-info">

                                        <div>

                                            <span>
                                                ROLE
                                            </span>

                                            <strong>
                                                {member.role ||
                                                    "—"}
                                            </strong>

                                        </div>


                                        <div className="admin-team-assignment-column">

                                            {renderCurrentAssignment(
                                                member
                                            )}

                                        </div>

                                    </div>


                                    {/* =================================
                                        ACTIONS
                                    ================================= */}

                                    <div className="admin-team-member-actions">

                                        <div className="admin-team-action-top">

                                            <span
                                                className={`admin-team-status ${
                                                    member.status ===
                                                    "Active"
                                                        ? "active"
                                                        : "disabled"
                                                }`}
                                            >

                                                ●{" "}

                                                {member.status ||
                                                    "Disabled"}

                                            </span>


                                            {renderInvitationAction(
                                                member
                                            )}

                                        </div>


                                        <div className="admin-team-action-bottom">

                                            <button
                                                type="button"
                                                className="admin-team-assign-action"
                                                onClick={() =>
                                                    openAssignmentModal(
                                                        member
                                                    )
                                                }
                                                disabled={
                                                    member.status ===
                                                    "Disabled"
                                                }
                                            >

                                                {member.event
                                                    ? "Reassign Event"
                                                    : "Assign Event"}

                                            </button>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleMemberStatus(
                                                        member
                                                    )
                                                }
                                            >

                                                {member.status ===
                                                "Active"
                                                    ? "Disable"
                                                    : "Enable"}

                                            </button>


                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() =>
                                                    removeMember(
                                                        member
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    </div>


                                    {/* =================================
                                        PREVIOUS ASSIGNMENT HISTORY
                                    ================================= */}

                                    <div className="admin-team-history-wrapper">

                                        {renderAssignmentHistory(
                                            member
                                        )}

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>


            {/* =====================================================
                ADD TEAM MEMBER MODAL
            ===================================================== */}

            {showAddModal && (

                <div
                    className="admin-team-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {

                            closeAddMember();

                        }

                    }}
                >

                    <div
                        className="admin-team-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-team-member-title"
                    >

                        <div className="admin-team-modal-header">

                            <div>

                                <span>
                                    TEAM MANAGEMENT
                                </span>

                                <h2 id="add-team-member-title">
                                    Add Team Member
                                </h2>

                                <p>
                                    Give a trusted team member
                                    access to EventWaa event operations.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="admin-team-modal-close"
                                onClick={closeAddMember}
                                disabled={saving}
                                aria-label="Close"
                            >
                                <FiX aria-hidden="true" />
                            </button>

                        </div>


                        <form
                            className="admin-team-form"
                            onSubmit={
                                handleAddMember
                            }
                        >

                            <div className="admin-team-form-grid">

                                <div className="admin-team-form-group">

                                    <label htmlFor="team-member-name">
                                        Full name
                                    </label>

                                    <input
                                        id="team-member-name"
                                        type="text"
                                        value={
                                            newMember.name
                                        }
                                        onChange={(e) =>
                                            handleNewMemberChange(
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter full name"
                                        disabled={saving}
                                        required
                                    />

                                </div>


                                <div className="admin-team-form-group">

                                    <label htmlFor="team-member-email">
                                        Email address
                                    </label>

                                    <input
                                        id="team-member-email"
                                        type="email"
                                        value={
                                            newMember.email
                                        }
                                        onChange={(e) =>
                                            handleNewMemberChange(
                                                "email",
                                                e.target.value
                                            )
                                        }
                                        placeholder="member@example.com"
                                        disabled={saving}
                                        required
                                    />

                                </div>


                                <div className="admin-team-form-group">

                                    <label htmlFor="team-member-role">
                                        Role
                                    </label>

                                    <select
                                        id="team-member-role"
                                        value={
                                            newMember.role
                                        }
                                        onChange={(e) =>
                                            handleNewMemberChange(
                                                "role",
                                                e.target.value
                                            )
                                        }
                                        disabled={saving}
                                    >

                                        <option value="Scanner">
                                            Scanner
                                        </option>

                                        <option value="Event Staff">
                                            Event Staff
                                        </option>

                                        <option value="Manager">
                                            Manager
                                        </option>

                                    </select>

                                </div>


                                <div className="admin-team-form-group">

                                    <label htmlFor="team-member-host">

                                        Host

                                        <span>
                                            Optional
                                        </span>

                                    </label>

                                    <input
                                        id="team-member-host"
                                        type="text"
                                        value={
                                            newMember.host
                                        }
                                        onChange={(e) =>
                                            handleNewMemberChange(
                                                "host",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Host name"
                                        disabled={saving}
                                    />

                                </div>


                                <div className="admin-team-form-group admin-team-form-full">

                                    <label htmlFor="team-member-event">

                                        Event

                                        <span>
                                            Optional
                                        </span>

                                    </label>

                                    <input
                                        id="team-member-event"
                                        type="text"
                                        value={
                                            newMember.event
                                        }
                                        onChange={(e) =>
                                            handleNewMemberChange(
                                                "event",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Event assigned to this member"
                                        disabled={saving}
                                    />

                                </div>

                            </div>


                            <div className="admin-team-form-notice">
                                <FiShield aria-hidden="true" />
                                <p>
                                    Team members are added as

                                    <strong>
                                        {" "}Active{" "}
                                    </strong>

                                    by default. After saving,
                                    use

                                    <strong>
                                        {" "}Send Invitation
                                    </strong>

                                    to email the team member their
                                    account setup link.
                                </p>
                            </div>


                            <div className="admin-team-form-actions">

                                <button
                                    type="button"
                                    className="admin-team-cancel-btn"
                                    onClick={
                                        closeAddMember
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="admin-team-submit-btn"
                                    disabled={saving}
                                >

                                    {saving ? (

                                        <>

                                            <span className="admin-team-button-spinner"></span>

                                            Adding Member...

                                        </>

                                    ) : (

                                        <>
                                            + Add Team Member
                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}
            {/* =====================================================
                ASSIGN / REASSIGN EVENT MODAL
            ===================================================== */}

            {showAssignmentModal && assignmentMember && (

                <div
                    className="admin-team-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {

                            closeAssignmentModal();

                        }

                    }}
                >

                    <div
                        className="admin-team-modal admin-team-assignment-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="assignment-modal-title"
                    >

                        {/* =========================================
                            MODAL HEADER
                        ========================================= */}

                        <div className="admin-team-modal-header">

                            <div>

                                <span>
                                    EVENT ASSIGNMENT
                                </span>

                                <h2 id="assignment-modal-title">

                                    {assignmentMember.event
                                        ? "Reassign Event"
                                        : "Assign Event"}

                                </h2>

                                <p>

                                    {assignmentMember.event

                                        ? `Move ${assignmentMember.name} to another EventWaa event. Their previous assignment will remain in their history.`

                                        : `Assign ${assignmentMember.name} to an EventWaa event.`

                                    }

                                </p>

                            </div>


                            <button
                                type="button"
                                className="admin-team-modal-close"
                                onClick={
                                    closeAssignmentModal
                                }
                                disabled={
                                    !!assigningMemberId
                                }
                                aria-label="Close"
                            >
                                <FiX aria-hidden="true" />
                            </button>

                        </div>


                        {/* =========================================
                            CURRENT ASSIGNMENT
                        ========================================= */}

                        {assignmentMember.event && (

                            <div className="admin-team-assignment-current-box">

                                <div className="admin-team-assignment-current-icon">
                                    📍
                                </div>

                                <div>

                                    <span>
                                        CURRENT EVENT
                                    </span>

                                    <strong>
                                        {assignmentMember.event}
                                    </strong>

                                    {assignmentMember.host && (

                                        <small>
                                            Host:{" "}
                                            {assignmentMember.host}
                                        </small>

                                    )}

                                </div>

                            </div>

                        )}


                        {/* =========================================
                            PREVIOUS HISTORY
                        ========================================= */}

                        {getAssignmentHistory(
                            assignmentMember
                        ).length > 0 && (

                            <div className="admin-team-assignment-history-preview">

                                <div className="admin-team-assignment-history-preview-header">

                                    <div>

                                        <span>
                                            ASSIGNMENT HISTORY
                                        </span>

                                        <strong>
                                            Previous Events
                                        </strong>

                                    </div>

                                    <b>
                                        {
                                            getAssignmentHistory(
                                                assignmentMember
                                            ).length
                                        }
                                    </b>

                                </div>


                                <div className="admin-team-assignment-history-preview-list">

                                    {getAssignmentHistory(
                                        assignmentMember
                                    )
                                        .slice(
                                            0,
                                            3
                                        )
                                        .map(
                                            (
                                                assignment,
                                                index
                                            ) => (

                                                <div
                                                    className="admin-team-assignment-history-preview-item"
                                                    key={
                                                        assignment.id ||
                                                        `${assignmentMember.id}-preview-${index}`
                                                    }
                                                >

                                                    <span>
                                                        ✓
                                                    </span>

                                                    <div>

                                                        <strong>
                                                            {
                                                                assignment.event ||
                                                                assignment.eventName ||
                                                                "Previous Event"
                                                            }
                                                        </strong>

                                                        {(
                                                            assignment.host ||
                                                            assignment.hostName
                                                        ) && (

                                                            <small>
                                                                Host:{" "}
                                                                {
                                                                    assignment.host ||
                                                                    assignment.hostName
                                                                }
                                                            </small>

                                                        )}

                                                    </div>

                                                </div>

                                            )
                                        )}

                                </div>


                                {getAssignmentHistory(
                                    assignmentMember
                                ).length > 3 && (

                                    <small className="admin-team-history-more">

                                        +
                                        {
                                            getAssignmentHistory(
                                                assignmentMember
                                            ).length - 3
                                        }{" "}
                                        more previous assignment
                                        {
                                            getAssignmentHistory(
                                                assignmentMember
                                            ).length - 3 === 1
                                                ? ""
                                                : "s"
                                        }

                                    </small>

                                )}

                            </div>

                        )}


                        {/* =========================================
                            ASSIGNMENT FORM
                        ========================================= */}

                        <form
                            className="admin-team-form"
                            onSubmit={
                                handleAssignEvent
                            }
                        >

                            <div className="admin-team-form-grid">

                                {/* =================================
                                    HOST
                                ================================= */}

                                <div className="admin-team-form-group">

                                    <label htmlFor="assignment-host">

                                        Host

                                        <span>
                                            Optional
                                        </span>

                                    </label>

                                    <input
                                        id="assignment-host"
                                        type="text"
                                        value={
                                            assignmentForm.host
                                        }
                                        onChange={(e) =>
                                            handleAssignmentChange(
                                                "host",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter host name"
                                        disabled={
                                            !!assigningMemberId
                                        }
                                    />

                                </div>


                                {/* =================================
                                    EVENT
                                ================================= */}

                                <div className="admin-team-form-group">

                                    <label htmlFor="assignment-event">

                                        Event

                                        <span>
                                            Required
                                        </span>

                                    </label>

                                    <input
                                        id="assignment-event"
                                        type="text"
                                        value={
                                            assignmentForm.event
                                        }
                                        onChange={(e) =>
                                            handleAssignmentChange(
                                                "event",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter new event name"
                                        disabled={
                                            !!assigningMemberId
                                        }
                                        required
                                        autoFocus
                                    />

                                </div>

                            </div>


                            {/* =====================================
                                IMPORTANT NOTICE
                            ===================================== */}

                            <div className="admin-team-assignment-notice">
                                <FiRefreshCw aria-hidden="true" />
                                <div>
                                    <strong>
                                        Reassignment keeps the history
                                    </strong>

                                    <p>

                                        The team member's current
                                        assignment will be moved into
                                        their previous assignment
                                        history. Their new event will
                                        become the current assignment.

                                    </p>

                                </div>
                            </div>


                            {/* =====================================
                                EVENT PASSED NOTICE
                            ===================================== */}

                            {assignmentMember.event && (

                                <div className="admin-team-reassignment-help">
                                    <FiInfo aria-hidden="true" />
                                    <p>
                                        <strong>
                                            Events are not permanent
                                            assignments.
                                        </strong>

                                        {" "}

                                        Once an event has passed,
                                        you can assign this same team
                                        member to another event without
                                        creating another team account.

                                    </p>
                                </div>

                            )}


                            {/* =====================================
                                ACTION BUTTONS
                            ===================================== */}

                            <div className="admin-team-form-actions">

                                <button
                                    type="button"
                                    className="admin-team-cancel-btn"
                                    onClick={
                                        closeAssignmentModal
                                    }
                                    disabled={
                                        !!assigningMemberId
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="admin-team-submit-btn"
                                    disabled={
                                        !!assigningMemberId ||
                                        !assignmentForm.event.trim()
                                    }
                                >

                                    {assigningMemberId ? (

                                        <>

                                            <span className="admin-team-button-spinner"></span>

                                            {assignmentMember.event
                                                ? "Reassigning..."
                                                : "Assigning..."}

                                        </>

                                    ) : (

                                        <>

                                            {assignmentMember.event
                                                ? "↻ Reassign Event"
                                                : "+ Assign Event"}

                                        </>

                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


        </div>

    );

}


export default AdminTeamMembers;