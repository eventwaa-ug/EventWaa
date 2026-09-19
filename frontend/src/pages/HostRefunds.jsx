import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiCornerUpLeft,
  FiDollarSign,
  FiLock,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../styles/HostRefunds.css";
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
function HostRefunds() {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  // ============================================================
  // FILTER
  // ============================================================
  const [activeFilter, setActiveFilter] = useState("all");
  // ============================================================
  // LOAD HOST REFUNDS
  // ============================================================
  const loadRefunds = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `${BACKEND_URL}/refunds/host?email=${encodeURIComponent(
          user.email
        )}`
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load refunds."
        );
      }
      setRefunds(
        Array.isArray(data.refunds)
          ? data.refunds
          : []
      );
    } catch (err) {
      console.error("HOST REFUNDS ERROR:", err);
      setError(
        err.message ||
          "Unable to load refund requests."
      );
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };
  // ============================================================
  // LOAD WHEN HOST LOGS IN
  // ============================================================
  useEffect(() => {
    loadRefunds();
  }, [user?.email]);
  // ============================================================
  // HOST APPROVE / REJECT REFUND
  // ============================================================
  const reviewRefund = async (refund, action) => {
    const originalAmount = Number(
      refund.originalAmount ??
        refund.amount ??
        0
    );
    const refundAmount = Number(
      refund.refundAmount ??
        refund.amount ??
        0
    );
    const isCancellation =
      refund.cancellation === true ||
      refund.source === "event_cancellation";
    const fee = Number(
      refund.refundFee ??
        (isCancellation
          ? 0
          : Math.max(
              0,
              originalAmount - refundAmount
            ))
    );
    if (action === "approve") {
      const confirmed = window.confirm(
        `Approve this refund?\n\n` +
          `Customer: ${
            refund.buyer?.name ||
            "Customer"
          }\n\n` +
          `Original amount: UGX ${originalAmount.toLocaleString()}\n` +
          `Refund fee: UGX ${fee.toLocaleString()}\n` +
          `Customer receives: UGX ${refundAmount.toLocaleString()}\n\n` +
          `${
            isCancellation
              ? "This is an event cancellation refund. No normal refund fee will be charged.\n\n"
              : ""
          }` +
          `This action will process the refund.`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        `Reject this refund request from ${
          refund.buyer?.name ||
          "this customer"
        }?`
      );
      if (!confirmed) return;
    }
    try {
      setProcessingId(refund.id);
      setError("");
      const response = await fetch(
        `${BACKEND_URL}/refunds/${refund.id}/host-review`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            hostEmail: user.email,
            note:
              action === "approve"
                ? "Refund approved by event host."
                : "Refund rejected by event host.",
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to process refund."
        );
      }
      if (action === "approve") {
        const responseRefund =
          data.refund || {};
        const finalRefundAmount = Number(
          data.refundAmount ??
            data.money?.refundAmount ??
            responseRefund.refundAmount ??
            responseRefund.amount ??
            refundAmount ??
            0
        );
        const finalRefundFee = Number(
          data.refundFee ??
            data.money?.refundFee ??
            responseRefund.refundFee ??
            fee ??
            0
        );
        alert(
          `Refund completed successfully.\n\n` +
            `Customer receives: UGX ${finalRefundAmount.toLocaleString()}\n` +
            `Refund fee: UGX ${finalRefundFee.toLocaleString()}`
        );
      } else {
        alert(
          data.message ||
            "Refund rejected successfully."
        );
      }
      await loadRefunds();
    } catch (err) {
      console.error(
        "HOST REFUND REVIEW ERROR:",
        err
      );
      alert(
        err.message ||
          "Unable to process refund."
      );
    } finally {
      setProcessingId(null);
    }
  };
  // ============================================================
  // FORMAT AMOUNT
  // ============================================================
  const formatAmount = (amount) => {
    return `UGX ${Number(
      amount || 0
    ).toLocaleString()}`;
  };
  // ============================================================
  // FORMAT DATE
  // ============================================================
  const formatDate = (date) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }
    return parsedDate.toLocaleString();
  };
  // ============================================================
  // COUNTS
  // ============================================================
  const pendingRefunds = refunds.filter(
    (refund) =>
      refund.status === "pending"
  );
  const completedRefunds = refunds.filter(
    (refund) =>
      refund.status === "refunded"
  );
  const rejectedRefunds = refunds.filter(
    (refund) =>
      refund.status === "rejected"
  );
  // ============================================================
  // TOTAL REFUNDED
  // ============================================================
  const totalRefunded =
    completedRefunds.reduce(
      (total, refund) =>
        total +
        Number(
          refund.refundAmount ??
            refund.amount ??
            0
        ),
      0
    );
  // ============================================================
  // FILTERED REFUNDS
  // ============================================================
  const filteredRefunds =
    activeFilter === "all"
      ? refunds
      : refunds.filter(
          (refund) =>
            refund.status ===
            activeFilter
        );
  // ============================================================
  // LOGIN CHECK
  // ============================================================
  if (!user) {
    return (
      <div className="host-refunds-page">
        <div className="refund-empty">
          <div className="empty-icon">
            <FiLock aria-hidden="true" />
          </div>
          <h2>Login Required</h2>
          <p>
            Please log in to access
            your refund management page.
          </p>
        </div>
      </div>
    );
  }
  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="host-refunds-page">
        <div className="refund-loading">
          <div className="refund-spinner"></div>
          <h2>Loading refunds...</h2>
          <p>
            Please wait while we retrieve
            your refund requests.
          </p>
        </div>
      </div>
    );
  }
  // ============================================================
  // PAGE
  // ============================================================
  return (
    <div className="host-refunds-page">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="refunds-header">
        <div>
          <span className="refunds-eyebrow">
            HOST MANAGEMENT
          </span>
          <h1>
            <FiCornerUpLeft
              className="refund-title-icon"
              aria-hidden="true"
            />
            Refunds
          </h1>
          <p>
            Review refund requests from
            customers who booked your events.
          </p>
        </div>
        <button
          type="button"
          className="refresh-refunds-btn"
          onClick={loadRefunds}
          disabled={loading}
        >
          <FiRefreshCw
            aria-hidden="true"
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {/* ======================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="refund-error">
          <FiAlertTriangle
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}
      {/* ======================================================
          SUMMARY
      ====================================================== */}
      <div className="refund-summary-grid">
        <div className="refund-summary-card">
          <div className="summary-icon">
            <FiClipboard aria-hidden="true" />
          </div>
          <div>
            <span>Total Requests</span>
            <strong>
              {refunds.length}
            </strong>
          </div>
        </div>
        <div className="refund-summary-card">
          <div className="summary-icon pending-icon">
            <FiClock aria-hidden="true" />
          </div>
          <div>
            <span>Pending</span>
            <strong>
              {pendingRefunds.length}
            </strong>
          </div>
        </div>
        <div className="refund-summary-card">
          <div className="summary-icon completed-icon">
            <FiCheckCircle
              aria-hidden="true"
            />
          </div>
          <div>
            <span>Refunded</span>
            <strong>
              {completedRefunds.length}
            </strong>
          </div>
        </div>
        <div className="refund-summary-card">
          <div className="summary-icon money-icon">
            <FiDollarSign
              aria-hidden="true"
            />
          </div>
          <div>
            <span>Total Refunded</span>
            <strong>
              {formatAmount(
                totalRefunded
              )}
            </strong>
          </div>
        </div>
      </div>
      {/* ======================================================
          FILTERS
      ====================================================== */}
      <div className="refund-filters">
        <button
          type="button"
          className={
            activeFilter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("all")
          }
        >
          <FiCornerUpLeft
            aria-hidden="true"
          />
          All
          <span>
            {refunds.length}
          </span>
        </button>
        <button
          type="button"
          className={
            activeFilter === "pending"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("pending")
          }
        >
          <FiClock
            aria-hidden="true"
          />
          Pending
          <span>
            {pendingRefunds.length}
          </span>
        </button>
        <button
          type="button"
          className={
            activeFilter === "refunded"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("refunded")
          }
        >
          <FiCheckCircle
            aria-hidden="true"
          />
          Refunded
          <span>
            {completedRefunds.length}
          </span>
        </button>
        <button
          type="button"
          className={
            activeFilter === "rejected"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("rejected")
          }
        >
          <FiX
            aria-hidden="true"
          />
          Rejected
          <span>
            {rejectedRefunds.length}
          </span>
        </button>
      </div>
      {/* ======================================================
          FILTER TITLE
      ====================================================== */}
      <div className="refund-section-header">
        <div>
          <h2>
            {activeFilter === "all"
              ? "All Refunds"
              : activeFilter === "pending"
              ? "Pending Refunds"
              : activeFilter === "refunded"
              ? "Completed Refunds"
              : "Rejected Refunds"}
          </h2>
          <p>
            Refunds related to your events.
          </p>
        </div>
        <span className="refund-count">
          {filteredRefunds.length} request
          {filteredRefunds.length !== 1
            ? "s"
            : ""}
        </span>
      </div>
      {/* ======================================================
          REFUND LIST
      ====================================================== */}
      {filteredRefunds.length === 0 ? (
        <div className="refund-empty">
          <div className="empty-icon">
            <FiCornerUpLeft
              aria-hidden="true"
            />
          </div>
          <h2>
            No Refund Requests
          </h2>
          <p>
            You don't currently have
            any refund requests in
            this category.
          </p>
        </div>
      ) : (
        <div className="refund-list">
          {filteredRefunds.map(
            (refund) => {
              const isPending =
                refund.status ===
                "pending";
              const isCompleted =
                refund.status ===
                "refunded";
              const isRejected =
                refund.status ===
                "rejected";
              const isProcessing =
                processingId ===
                refund.id;
              const isCancellation =
                refund.cancellation === true ||
                refund.source ===
                  "event_cancellation";
              const originalAmount =
                Number(
                  refund.originalAmount ??
                    refund.amount ??
                    0
                );
              const refundAmount =
                Number(
                  refund.refundAmount ??
                    refund.amount ??
                    0
                );
              const refundFee =
                Number(
                  refund.refundFee ??
                    (isCancellation
                      ? 0
                      : Math.max(
                          0,
                          originalAmount -
                            refundAmount
                        ))
                );
              const refundFeePercent =
                isCancellation
                  ? 0
                  : Number(
                      refund.refundFeePercent ??
                        20
                    );
              return (
                <div
                  className="refund-card"
                  key={refund.id}
                >
                  {/* ==================================================
                      TOP
                  ================================================== */}
                  <div className="refund-card-top">
                    <div>
                      <span className="refund-id">
                        Refund #{refund.id}
                      </span>
                      <h3>
                        {refund.eventTitle ||
                          "Event"}
                      </h3>
                    </div>
                    <span
                      className={`refund-status ${
                        isPending
                          ? "status-pending"
                          : isCompleted
                          ? "status-completed"
                          : isRejected
                          ? "status-rejected"
                          : "status-default"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <FiClock
                            aria-hidden="true"
                          />
                          Pending Review
                        </>
                      ) : isCompleted ? (
                        <>
                          <FiCheckCircle
                            aria-hidden="true"
                          />
                          Refunded
                        </>
                      ) : isRejected ? (
                        <>
                          <FiX
                            aria-hidden="true"
                          />
                          Rejected
                        </>
                      ) : (
                        refund.status ||
                        "Requested"
                      )}
                    </span>
                  </div>
                  {/* ==================================================
                      DETAILS
                  ================================================== */}
                  <div className="refund-details">
                    <div className="refund-detail">
                      <span>
                        Customer
                      </span>
                      <strong>
                        {refund.buyer?.name ||
                          "Unknown customer"}
                      </strong>
                    </div>
                    <div className="refund-detail">
                      <span>
                        Email
                      </span>
                      <strong>
                        {refund.buyer?.email ||
                          "—"}
                      </strong>
                    </div>
                    <div className="refund-detail">
                      <span>
                        Original Amount
                      </span>
                      <strong>
                        {formatAmount(
                          originalAmount
                        )}
                      </strong>
                    </div>
                    <div className="refund-detail">
                      <span>
                        Refund Fee
                      </span>
                      <strong>
                        {refundFeePercent}%
                        {" "}
                        ({formatAmount(
                          refundFee
                        )})
                      </strong>
                    </div>
                    <div className="refund-detail">
                      <span>
                        Customer Receives
                      </span>
                      <strong className="refund-amount">
                        {formatAmount(
                          refundAmount
                        )}
                      </strong>
                    </div>
                    <div className="refund-detail">
                      <span>
                        Requested
                      </span>
                      <strong>
                        {formatDate(
                          refund.createdAt
                        )}
                      </strong>
                    </div>
                  </div>
                  {/* ==================================================
                      CANCELLATION NOTICE
                  ================================================== */}
                  {isCancellation && (
                    <div className="refund-cancellation-notice">
                      <FiAlertTriangle
                        aria-hidden="true"
                      />
                      <div>
                        <strong>
                          Event Cancellation Refund
                        </strong>
                        <p>
                          This refund was created
                          because the event was
                          cancelled. No normal
                          customer refund fee applies.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* ==================================================
                      REASON
                  ================================================== */}
                  <div className="refund-reason">
                    <span>Reason</span>
                    <p>
                      {refund.reason ||
                        "Customer requested a refund."}
                    </p>
                    {refund.details && (
                      <>
                        <span>
                          Additional Details
                        </span>
                        <p>
                          {refund.details}
                        </p>
                      </>
                    )}
                  </div>
                  {/* ==================================================
                      ACTIONS
                  ================================================== */}
                  <div className="refund-actions">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          className="approve-refund-btn"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            reviewRefund(
                              refund,
                              "approve"
                            )
                          }
                        >
                          <FiCheck
                            aria-hidden="true"
                          />
                          {isProcessing
                            ? "Processing..."
                            : "Approve Refund"}
                        </button>
                        <button
                          type="button"
                          className="reject-refund-btn"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            reviewRefund(
                              refund,
                              "reject"
                            )
                          }
                        >
                          <FiX
                            aria-hidden="true"
                          />
                          {isProcessing
                            ? "Processing..."
                            : "Reject Refund"}
                        </button>
                      </>
                    ) : isCompleted ? (
                      <div className="completed-message">
                        <FiCheckCircle
                          aria-hidden="true"
                        />
                        Refund completed
                      </div>
                    ) : isRejected ? (
                      <div className="rejected-message">
                        <FiX
                          aria-hidden="true"
                        />
                        <div>
                          <span>
                            Refund rejected
                          </span>
                          {refund.reviewNote && (
                            <small>
                              {refund.reviewNote}
                            </small>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pending-message">
                        Refund status:
                        {" "}
                        {refund.status ||
                          "Unknown"}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
export default HostRefunds;