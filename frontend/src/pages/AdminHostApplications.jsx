import { useEffect, useState } from "react";
import {
    Search,
    ShieldCheck,
    User,
    Mail,
    Phone,
    MapPin,
    CalendarDays,
    FileCheck2,
    Image as ImageIcon,
    CheckCircle2,
    XCircle,
    Clock3,
    RefreshCcw,
    ExternalLink,
    BriefcaseBusiness,
    AlertCircle,
} from "lucide-react";
import "./AdminHostApplications.css";
/* ============================================================
   BACKEND
============================================================ */
const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";
/* ============================================================
   HOST APPLICATIONS
============================================================ */
function HostApplications() {
    /* ========================================================
       STATE
    ======================================================== */
    const [applications, setApplications] =
        useState([]);
    const [search, setSearch] =
        useState("");
    const [filter, setFilter] =
        useState("all");
    const [loading, setLoading] =
        useState(true);
    const [actionLoading, setActionLoading] =
        useState(null);
    const [error, setError] =
        useState("");
    /* ========================================================
       FETCH APPLICATIONS
    ======================================================== */
    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError("");
            const response =
                await fetch(
                    `${BACKEND_URL}/admin/host-applications`
                );
            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status}`
                );
            }
            const data =
                await response.json();
            setApplications(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (fetchError) {
            console.error(
                "HOST APPLICATION LOAD ERROR:",
                fetchError
            );
            setError(
                "Unable to load host applications. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };
    /* ========================================================
       INITIAL LOAD
    ======================================================== */
    useEffect(() => {
        fetchApplications();
    }, []);
    /* ========================================================
       FORMAT DATE
    ======================================================== */
    const formatDate = (timestamp) => {
        if (!timestamp) {
            return "Unknown";
        }
        let date;
        /*
         * Supports:
         * Unix timestamps
         * ISO date strings
         * JavaScript date values
         */
        if (
            typeof timestamp === "number"
        ) {
            /*
             * Existing backend appears
             * to use Unix seconds.
             */
            date =
                new Date(
                    timestamp * 1000
                );
        } else {
            date =
                new Date(timestamp);
        }
        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Unknown";
        }
        return date.toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short",
            }
        );
    };
    /* ========================================================
       DOCUMENT URL
    ======================================================== */
    const getDocumentUrl = (path) => {
        if (!path) {
            return "";
        }
        if (
            path.startsWith("http://") ||
            path.startsWith("https://")
        ) {
            return path;
        }
        return `${BACKEND_URL}/${String(path).replace(/^\/+/, "")}`;
    };
    /* ========================================================
       APPROVE APPLICATION
    ======================================================== */
    const approveApplication = async (id) => {
        try {
            setActionLoading(id);
            setError("");
            const response =
                await fetch(
                    `${BACKEND_URL}/host-applications/${id}/approve`,
                    {
                        method: "PUT",
                    }
                );
            const data =
                await response.json()
                    .catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to approve application."
                );
            }
            alert(
                "Host approved successfully!"
            );
            await fetchApplications();
        } catch (approveError) {
            console.error(
                "APPROVE HOST ERROR:",
                approveError
            );
            setError(
                approveError.message ||
                "Unable to approve this host."
            );
        } finally {
            setActionLoading(null);
        }
    };
    /* ========================================================
       REJECT APPLICATION
    ======================================================== */
    const rejectApplication = async (id) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to reject this host application?"
            );
        if (!confirmed) {
            return;
        }
        try {
            setActionLoading(id);
            setError("");
            const response =
                await fetch(
                    `${BACKEND_URL}/host-applications/${id}/reject`,
                    {
                        method: "PUT",
                    }
                );
            const data =
                await response.json()
                    .catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to reject application."
                );
            }
            alert(
                "Application rejected!"
            );
            await fetchApplications();
        } catch (rejectError) {
            console.error(
                "REJECT HOST ERROR:",
                rejectError
            );
            setError(
                rejectError.message ||
                "Unable to reject this host."
            );
        } finally {
            setActionLoading(null);
        }
    };
    /* ========================================================
       FILTER APPLICATIONS
    ======================================================== */
    const filteredApplications =
        applications.filter(
            (application) => {
                const fullName =
                    String(
                        application?.fullName ||
                        ""
                    );
                const email =
                    String(
                        application?.email ||
                        ""
                    );
                const searchValue =
                    search
                        .trim()
                        .toLowerCase();
                const matchesSearch =
                    !searchValue ||
                    fullName
                        .toLowerCase()
                        .includes(searchValue) ||
                    email
                        .toLowerCase()
                        .includes(searchValue);
                const matchesFilter =
                    filter === "all" ||
                    application?.status === filter;
                return (
                    matchesSearch &&
                    matchesFilter
                );
            }
        );
    /* ========================================================
       STATUS HELPERS
    ======================================================== */
    const getStatusLabel = (status) => {
        if (status === "approved") {
            return "Approved";
        }
        if (status === "rejected") {
            return "Rejected";
        }
        return "Pending Review";
    };
    const getStatusClass = (status) => {
        if (status === "approved") {
            return "approved";
        }
        if (status === "rejected") {
            return "rejected";
        }
        return "pending";
    };
    /* ========================================================
       STATUS ICON
    ======================================================== */
    const StatusIcon = ({ status }) => {
        if (status === "approved") {
            return (
                <CheckCircle2 size={16} />
            );
        }
        if (status === "rejected") {
            return (
                <XCircle size={16} />
            );
        }
        return (
            <Clock3 size={16} />
        );
    };
    /* ========================================================
       RENDER
    ======================================================== */
    return (
        <div className="host-review-page">
            {/* ==================================================
                PAGE HEADER
            ================================================== */}
            <div className="host-review-header">
                <div className="host-review-title-area">
                    <div className="host-review-title-icon">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <p className="host-review-eyebrow">
                            EVENTWAA ADMINISTRATION
                        </p>
                        <h1>
                            Host Applications
                        </h1>
                        <p className="host-review-subtitle">
                            Review host applications,
                            verify identity documents,
                            and manage organizer approval.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    className="host-review-refresh"
                    onClick={fetchApplications}
                    disabled={loading}
                >
                    <RefreshCcw
                        size={18}
                        className={
                            loading
                                ? "host-review-spin"
                                : ""
                        }
                    />
                    Refresh
                </button>
            </div>
            {/* ==================================================
                CONTROLS
            ================================================== */}
            <div className="application-controls">
                {/* SEARCH */}
                <div className="host-review-search">
                    <Search size={19} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />
                </div>
                {/* FILTER */}
                <div className="host-review-filter">
                    <select
                        value={filter}
                        onChange={(event) =>
                            setFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="all">
                            All Applications
                        </option>
                        <option value="pending">
                            Pending
                        </option>
                        <option value="approved">
                            Approved
                        </option>
                        <option value="rejected">
                            Rejected
                        </option>
                    </select>
                </div>
            </div>
            {/* ==================================================
                ERROR
            ================================================== */}
            {error && (
                <div
                    className="host-review-error"
                    role="alert"
                >
                    <AlertCircle size={20} />
                    <span>
                        {error}
                    </span>
                </div>
            )}
            {/* ==================================================
                LOADING
            ================================================== */}
            {loading && (
                <div className="host-review-loading">
                    <RefreshCcw
                        size={26}
                        className="host-review-spin"
                    />
                    <p>
                        Loading host applications...
                    </p>
                </div>
            )}
            {/* ==================================================
                EMPTY
            ================================================== */}
            {!loading &&
            applications.length === 0 && (
                <div className="host-review-empty">
                    <div className="host-review-empty-icon">
                        <BriefcaseBusiness
                            size={30}
                        />
                    </div>
                    <h2>
                        No host applications
                    </h2>
                    <p>
                        There are currently no host
                        applications to review.
                    </p>
                </div>
            )}
            {/* ==================================================
                NO FILTER RESULTS
            ================================================== */}
            {!loading &&
            applications.length > 0 &&
            filteredApplications.length === 0 && (
                <div className="host-review-empty">
                    <Search size={30} />
                    <h2>
                        No matching applications
                    </h2>
                    <p>
                        Try changing your search or
                        application status filter.
                    </p>
                </div>
            )}
            {/* ==================================================
                APPLICATIONS
            ================================================== */}
            {!loading &&
            filteredApplications.map(
                (application) => {
                    const status =
                        application?.status ||
                        "pending";
                    const isPending =
                        status === "pending";
                    const isProcessing =
                        actionLoading ===
                        application.id;
                    const idFront =
                        getDocumentUrl(
                            application?.idFront
                        );
                    const idBack =
                        getDocumentUrl(
                            application?.idBack
                        );
                    const proofImage =
                        getDocumentUrl(
                            application?.proofImage
                        );
                    return (
                        <article
                            className="application-card"
                            key={application.id}
                        >
                            {/* ==================================
                                APPLICATION HEADER
                            ================================== */}
                            <div className="application-card-header">
                                <div className="application-applicant">
                                    <div className="application-avatar">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h2>
                                            {
                                                application.fullName ||
                                                "Unnamed Applicant"
                                            }
                                        </h2>
                                        <span>
                                            Host Application
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={
                                        `status ${getStatusClass(
                                            status
                                        )}`
                                    }
                                >
                                    <StatusIcon
                                        status={status}
                                    />
                                    {
                                        getStatusLabel(
                                            status
                                        )
                                    }
                                </div>
                            </div>
                            {/* ==================================
                                APPLICANT INFORMATION
                            ================================== */}
                            <div className="application-information">
                                <div className="application-info-item">
                                    <Mail size={18} />
                                    <div>
                                        <span>
                                            Email
                                        </span>
                                        <strong>
                                            {
                                                application.email ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>
                                </div>
                                <div className="application-info-item">
                                    <Phone size={18} />
                                    <div>
                                        <span>
                                            Phone
                                        </span>
                                        <strong>
                                            {
                                                application.phone ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>
                                </div>
                                <div className="application-info-item">
                                    <MapPin size={18} />
                                    <div>
                                        <span>
                                            Location
                                        </span>
                                        <strong>
                                            {
                                                application.location ||
                                                "Not available"
                                            }
                                        </strong>
                                    </div>
                                </div>
                                <div className="application-info-item">
                                    <CalendarDays size={18} />
                                    <div>
                                        <span>
                                            Submitted
                                        </span>
                                        <strong>
                                            {
                                                formatDate(
                                                    application.submittedAt
                                                )
                                            }
                                        </strong>
                                    </div>
                                </div>
                                <div className="application-info-item">
                                    <BriefcaseBusiness
                                        size={18}
                                    />
                                    <div>
                                        <span>
                                            Previous Event Experience
                                        </span>
                                        <strong>
                                            {
                                                application.hasPreviousEvents ===
                                                "yes"
                                                    ? "Yes"
                                                    : "No"
                                            }
                                        </strong>
                                    </div>
                                </div>
                            </div>
                            {/* ==================================
                                DOCUMENT SECTION
                            ================================== */}
                            <div className="documents">
                                <div className="documents-heading">
                                    <div>
                                        <div className="documents-heading-icon">
                                            <FileCheck2
                                                size={19}
                                            />
                                        </div>
                                        <div>
                                            <h3>
                                                Verification Documents
                                            </h3>
                                            <p>
                                                Review the submitted
                                                identity and supporting
                                                documents.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* ==============================
                                    ID FRONT
                                ============================== */}
                                <div className="document-card">
                                    <div className="document-card-header">
                                        <div>
                                            <span className="document-type">
                                                IDENTITY DOCUMENT
                                            </span>
                                            <strong>
                                                ID Front
                                            </strong>
                                        </div>
                                        <ImageIcon
                                            size={19}
                                        />
                                    </div>
                                    {idFront ? (
                                        <a
                                            href={idFront}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="document-preview-link"
                                        >
                                            <img
                                                src={idFront}
                                                alt="Applicant ID front"
                                            />
                                            <span className="document-view">
                                                <ExternalLink
                                                    size={16}
                                                />
                                                Open Document
                                            </span>
                                        </a>
                                    ) : (
                                        <div className="document-missing">
                                            <AlertCircle
                                                size={22}
                                            />
                                            <span>
                                                ID front not provided
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* ==============================
                                    ID BACK
                                ============================== */}
                                <div className="document-card">
                                    <div className="document-card-header">
                                        <div>
                                            <span className="document-type">
                                                IDENTITY DOCUMENT
                                            </span>
                                            <strong>
                                                ID Back
                                            </strong>
                                        </div>
                                        <ImageIcon
                                            size={19}
                                        />
                                    </div>
                                    {idBack ? (
                                        <a
                                            href={idBack}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="document-preview-link"
                                        >
                                            <img
                                                src={idBack}
                                                alt="Applicant ID back"
                                            />
                                            <span className="document-view">
                                                <ExternalLink
                                                    size={16}
                                                />
                                                Open Document
                                            </span>
                                        </a>
                                    ) : (
                                        <div className="document-missing">
                                            <AlertCircle
                                                size={22}
                                            />
                                            <span>
                                                ID back not provided
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* ==============================
                                    PROOF IMAGE
                                ============================== */}
                                {proofImage && (
                                    <div className="document-card">
                                        <div className="document-card-header">
                                            <div>
                                                <span className="document-type">
                                                    SUPPORTING DOCUMENT
                                                </span>
                                                <strong>
                                                    Event Proof
                                                </strong>
                                            </div>
                                            <ImageIcon
                                                size={19}
                                            />
                                        </div>
                                        <a
                                            href={proofImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="document-preview-link"
                                        >
                                            <img
                                                src={proofImage}
                                                alt="Applicant event proof"
                                            />
                                            <span className="document-view">
                                                <ExternalLink
                                                    size={16}
                                                />
                                                Open Document
                                            </span>
                                        </a>
                                    </div>
                                )}
                            </div>
                            {/* ==================================
                                ACTIONS
                            ================================== */}
                            {isPending && (
                                <div className="actions">
                                    <button
                                        type="button"
                                        className="approve"
                                        onClick={() =>
                                            approveApplication(
                                                application.id
                                            )
                                        }
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <RefreshCcw
                                                size={18}
                                                className="host-review-spin"
                                            />
                                        ) : (
                                            <CheckCircle2
                                                size={18}
                                            />
                                        )}
                                        {
                                            isProcessing
                                                ? "Processing..."
                                                : "Approve Host"
                                        }
                                    </button>
                                    <button
                                        type="button"
                                        className="reject"
                                        onClick={() =>
                                            rejectApplication(
                                                application.id
                                            )
                                        }
                                        disabled={isProcessing}
                                    >
                                        <XCircle
                                            size={18}
                                        />
                                        Reject Application
                                    </button>
                                </div>
                            )}
                            {/* ==================================
                                COMPLETED APPLICATION
                            ================================== */}
                            {!isPending && (
                                <div
                                    className={
                                        `application-completed ${
                                            status
                                        }`
                                    }
                                >
                                    {status === "approved" ? (
                                        <CheckCircle2
                                            size={18}
                                        />
                                    ) : (
                                        <XCircle
                                            size={18}
                                        />
                                    )}
                                    <span>
                                        This application has been
                                        {status === "approved"
                                            ? " approved."
                                            : " rejected."
                                        }
                                    </span>
                                </div>
                            )}
                        </article>
                    );
                }
            )}
        </div>
    );
}
export default HostApplications;