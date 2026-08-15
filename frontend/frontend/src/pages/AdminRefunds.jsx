import { useEffect, useState } from "react";
import "./AdminRefunds.css";

const API_URL = "http://127.0.0.1:5000";

function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // FILTER
  // ============================================================

  const [activeFilter, setActiveFilter] = useState("all");

  // ============================================================
  // LOAD REFUNDS
  // ============================================================

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/refunds`
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

    } catch (error) {
      console.error(
        "Failed to load refunds:",
        error
      );

      setError(
        error.message ||
          "Unable to load refund requests."
      );

      setRefunds([]);

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD ON PAGE OPEN
  // ============================================================

  useEffect(() => {
    loadRefunds();
  }, []);

  // ============================================================
  // FORMAT MONEY
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
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-refunds">

        <div className="admin-refunds-loading">

          <div className="refund-spinner"></div>

          <h2>
            Loading refunds...
          </h2>

          <p>
            Please wait while refund
            records are retrieved.
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="admin-refunds">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="refunds-header">

        <div>

          <span className="refunds-eyebrow">
            ADMIN MONITORING
          </span>

          <h1>
            Refunds
          </h1>

          <p>
            Monitor refund requests and
            refund activity across EventWaa.
          </p>

        </div>

        <button
          className="refresh-refunds-btn"
          onClick={loadRefunds}
        >
          🔄 Refresh
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="refund-error">
          ⚠️ {error}
        </div>
      )}

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="refund-summary">

        <div className="summary-card">

          <span>
            Total Requests
          </span>

          <strong>
            {refunds.length}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Pending
          </span>

          <strong>
            {pendingRefunds.length}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Refunded
          </span>

          <strong>
            {completedRefunds.length}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Rejected
          </span>

          <strong>
            {rejectedRefunds.length}
          </strong>

        </div>

        <div className="summary-card">

          <span>
            Total Refunded
          </span>

          <strong>
            {formatAmount(
              totalRefunded
            )}
          </strong>

        </div>

      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="refund-filters">

        <button
          className={
            activeFilter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("all")
          }
        >
          All
          <span>
            {refunds.length}
          </span>
        </button>

        <button
          className={
            activeFilter === "pending"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("pending")
          }
        >
          Pending
          <span>
            {pendingRefunds.length}
          </span>
        </button>

        <button
          className={
            activeFilter === "refunded"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("refunded")
          }
        >
          Refunded
          <span>
            {completedRefunds.length}
          </span>
        </button>

        <button
          className={
            activeFilter === "rejected"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveFilter("rejected")
          }
        >
          Rejected
          <span>
            {rejectedRefunds.length}
          </span>
        </button>

      </div>

      {/* ======================================================
          CURRENT FILTER
      ====================================================== */}

      <div className="refund-filter-heading">

        <h2>
          {activeFilter === "all"
            ? "All Refunds"
            : activeFilter === "pending"
            ? "Pending Refunds"
            : activeFilter === "refunded"
            ? "Completed Refunds"
            : "Rejected Refunds"}
        </h2>

        <span>
          {filteredRefunds.length} record
          {filteredRefunds.length !== 1
            ? "s"
            : ""}
        </span>

      </div>

      {/* ======================================================
          REFUND LIST
      ====================================================== */}

      {filteredRefunds.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            ↩️
          </div>

          <h2>
            No Refund Requests
          </h2>

          <p>
            There are no refunds in this
            category.
          </p>

        </div>

      ) : (

        <div className="refunds-list">

          {filteredRefunds.map(
            (refund) => {

              const isPending =
                refund.status === "pending";

              const isRefunded =
                refund.status === "refunded";

              const isRejected =
                refund.status === "rejected";

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
                    Math.max(
                      0,
                      originalAmount -
                        refundAmount
                    )
                );

              return (
                <div
                  key={refund.id}
                  className="refund-card"
                >

                  {/* TOP */}

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
                          ? "pending"
                          : isRefunded
                          ? "refunded"
                          : isRejected
                          ? "rejected"
                          : "default"
                      }`}
                    >

                      {isPending
                        ? "⏳ Pending Host Review"
                        : isRefunded
                        ? "✅ Refunded"
                        : isRejected
                        ? "❌ Rejected"
                        : refund.status ||
                          "Unknown"}

                    </span>

                  </div>

                  {/* DETAILS */}

                  <div className="refund-details">

                    <div>

                      <span>
                        Customer
                      </span>

                      <strong>
                        {refund.buyer?.name ||
                          "Unknown"}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Email
                      </span>

                      <strong>
                        {refund.buyer?.email ||
                          "—"}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Original Amount
                      </span>

                      <strong>
                        {formatAmount(
                          originalAmount
                        )}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Refund Fee
                      </span>

                      <strong>
                        {refund.refundFeePercent ??
                          20}
                        %
                        {" "}
                        ({formatAmount(
                          refundFee
                        )})
                      </strong>

                    </div>

                    <div>

                      <span>
                        Customer Receives
                      </span>

                      <strong className="refund-amount">
                        {formatAmount(
                          refundAmount
                        )}
                      </strong>

                    </div>

                    <div>

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

                  {/* REASON */}

                  <div className="refund-reason">

                    <span>
                      Reason
                    </span>

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

                  {/* ADMIN INFORMATION */}

                  <div className="admin-refund-note">

                    {isPending && (
                      <>
                        <strong>
                          👤 Host Action Required
                        </strong>

                        <p>
                          This refund is waiting
                          for the event host to
                          approve or reject it.
                        </p>
                      </>
                    )}

                    {isRefunded && (
                      <>
                        <strong>
                          ✅ Refund Completed
                        </strong>

                        <p>
                          This refund was processed
                          by the event host.
                        </p>

                        {refund.processedBy && (
                          <small>
                            Processed by:{" "}
                            {refund.processedBy}
                          </small>
                        )}
                      </>
                    )}

                    {isRejected && (
                      <>
                        <strong>
                          ❌ Refund Rejected
                        </strong>

                        <p>
                          This refund was rejected
                          by the event host.
                        </p>

                        {refund.reviewNote && (
                          <small>
                            Note:{" "}
                            {refund.reviewNote}
                          </small>
                        )}
                      </>
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

export default AdminRefunds;