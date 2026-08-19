import { useEffect, useState } from "react";
import "./AdminWithdrawals.css";
import { adminFetch } from "../utils/adminAPI";

function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);

    // ============================================================
    // LOAD WITHDRAWALS
    // ============================================================

    const loadWithdrawals = async () => {

        try {

            const adminToken = localStorage.getItem(
                "eventwaa_admin_token"
            );


            if (!adminToken) {

                throw new Error(
                    "Admin session not found."
                );

            }


            const response = await fetch(
                "http://localhost:5000/admin/host-withdrawals",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${adminToken}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load withdrawals."
                );

            }


            setWithdrawals(
                Array.isArray(data)
                    ? data
                    : []
            );


        } catch (error) {

            console.error(
                "LOAD WITHDRAWALS ERROR:",
                error
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        loadWithdrawals();
    }, []);

    // ============================================================
    // APPROVE WITHDRAWAL
    // ============================================================

    const approveWithdrawal = async (
        hostId,
        withdrawalId
    ) => {
        const actionKey =
            `${hostId}-${withdrawalId}`;

        try {
            setActionId(actionKey);

            const response = await fetch(
                `http://localhost:5000/admin/host-withdrawals/approve/${hostId}/${withdrawalId}`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to approve withdrawal."
                );
            }

            console.log(
                "Flutterwave transfer started:",
                data.transferId
            );

            await loadWithdrawals();

        } catch (error) {

            console.error(
                "APPROVE WITHDRAWAL ERROR:",
                error
            );

            alert(
                error.message ||
                "Unable to approve withdrawal."
            );

        } finally {
            setActionId(null);
        }
    };

    // ============================================================
    // CHECK PROCESSING WITHDRAWAL STATUS
    // ============================================================

    const checkWithdrawalStatus = async (
        hostId,
        withdrawalId
    ) => {

        const actionKey =
            `${hostId}-${withdrawalId}`;


        try {

            setActionId(actionKey);


            const adminToken = localStorage.getItem(
                "eventwaa_admin_token"
            );


            if (!adminToken) {

                throw new Error(
                    "Admin session not found."
                );

            }


            const response = await fetch(

                `http://localhost:5000/admin/host-withdrawals/transfer-status/${hostId}/${withdrawalId}`,

                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${adminToken}`,

                        "Content-Type":
                            "application/json"
                    }
                }

            );


            const data = await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to check withdrawal status."
                );

            }


            console.log(
                "Withdrawal status:",
                data.status
            );


            await loadWithdrawals();


        } catch (error) {

            console.error(
                "CHECK WITHDRAWAL STATUS ERROR:",
                error
            );


            alert(
                error.message ||
                "Unable to check withdrawal status."
            );


        } finally {

            setActionId(null);

        }

    };

    // ============================================================
    // FILTER
    // ============================================================

    const filteredWithdrawals =
        withdrawals.filter(
            (withdrawal) => {

                if (
                    filter === "all"
                ) {
                    return true;
                }

                return (
                    String(
                        withdrawal.status ||
                        ""
                    ).toLowerCase()
                    ===
                    filter
                );
            }
        );

    // ============================================================
    // STATUS LABEL
    // ============================================================

    const getStatusLabel = (
        status
    ) => {

        const normalized =
            String(
                status || ""
            ).toLowerCase();

        switch (normalized) {

            case "pending":
                return "Pending";

            case "processing":
                return "Processing";

            case "completed":
                return "Completed";

            case "failed":
                return "Failed";

            default:
                return status || "Unknown";
        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (
            <div className="admin-withdrawals-page">

                <div className="withdrawals-loading">
                    Loading withdrawal requests...
                </div>

            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="admin-withdrawals-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="withdrawals-page-header">

                <div>

                    <h1>
                        💰 Host Withdrawals
                    </h1>

                    <p>
                        Review and manage host payout requests.
                    </p>

                </div>

                <button
                    className="refresh-withdrawals-btn"
                    onClick={loadWithdrawals}
                    disabled={actionId !== null}
                >
                    ↻ Refresh
                </button>

            </div>


            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="withdrawal-filters">

                <button
                    className={
                        filter === "all"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("all")
                    }
                >
                    All
                    <span>
                        {withdrawals.length}
                    </span>
                </button>


                <button
                    className={
                        filter === "pending"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("pending")
                    }
                >
                    Pending
                    <span>
                        {
                            withdrawals.filter(
                                w =>
                                    w.status ===
                                    "pending"
                            ).length
                        }
                    </span>
                </button>


                <button
                    className={
                        filter === "processing"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("processing")
                    }
                >
                    Processing
                    <span>
                        {
                            withdrawals.filter(
                                w =>
                                    w.status ===
                                    "processing"
                            ).length
                        }
                    </span>
                </button>


                <button
                    className={
                        filter === "completed"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("completed")
                    }
                >
                    Completed
                    <span>
                        {
                            withdrawals.filter(
                                w =>
                                    w.status ===
                                    "completed"
                            ).length
                        }
                    </span>
                </button>


                <button
                    className={
                        filter === "failed"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("failed")
                    }
                >
                    Failed
                    <span>
                        {
                            withdrawals.filter(
                                w =>
                                    w.status ===
                                    "failed"
                            ).length
                        }
                    </span>
                </button>

            </div>


            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {filteredWithdrawals.length === 0 ? (

                <div className="withdrawals-empty">

                    <div className="empty-icon">
                        💸
                    </div>

                    <h2>
                        No withdrawal requests
                    </h2>

                    <p>
                        There are no withdrawals in this category.
                    </p>

                </div>

            ) : (

                <div className="withdrawals-list">

                    {filteredWithdrawals.map(
                        (withdrawal) => {

                            const status =
                                String(
                                    withdrawal.status ||
                                    ""
                                ).toLowerCase();

                            const actionKey =
                                `${withdrawal.hostId}-${withdrawal.id}`;

                            const isLoading =
                                actionId === actionKey;

                            return (

                                <div
                                    className="withdrawal-card"
                                    key={actionKey}
                                >

                                    {/* ============================
                                        HEADER
                                    ============================ */}

                                    <div className="withdrawal-header">

                                        <div className="host-info">

                                            <div className="host-avatar">
                                                {
                                                    (
                                                        withdrawal.hostName ||
                                                        "H"
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()
                                                }
                                            </div>

                                            <div>

                                                <h3>
                                                    {
                                                        withdrawal.hostName ||
                                                        "Unknown Host"
                                                    }
                                                </h3>

                                                <p>
                                                    {
                                                        withdrawal.hostEmail ||
                                                        ""
                                                    }
                                                </p>

                                            </div>

                                        </div>


                                        <span
                                            className={
                                                `status ${status}`
                                            }
                                        >
                                            <span className="status-dot">
                                            </span>

                                            {
                                                getStatusLabel(
                                                    status
                                                )
                                            }
                                        </span>

                                    </div>


                                    {/* ============================
                                        DETAILS
                                    ============================ */}

                                    <div className="withdrawal-details">

                                        <div className="detail-item">

                                            <span>
                                                Amount
                                            </span>

                                            <strong className="withdrawal-amount">
                                                UGX{" "}
                                                {Number(
                                                    withdrawal.amount ||
                                                    0
                                                ).toLocaleString()}
                                            </strong>

                                        </div>


                                        <div className="detail-item">

                                            <span>
                                                Method
                                            </span>

                                            <strong>
                                                {
                                                    withdrawal.method ||
                                                    "—"
                                                }
                                            </strong>

                                        </div>


                                        <div className="detail-item">

                                            <span>
                                                Account
                                            </span>

                                            <strong>
                                                {
                                                    withdrawal.account ||
                                                    "—"
                                                }
                                            </strong>

                                        </div>


                                        <div className="detail-item">

                                            <span>
                                                Requested
                                            </span>

                                            <strong>
                                                {
                                                    withdrawal.date ||
                                                    "—"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    {/* ============================
                                        PROCESSING INFORMATION
                                    ============================ */}

                                    {status === "processing" && (

                                        <div className="processing-box">

                                            <div className="processing-icon">
                                                ⏳
                                            </div>

                                            <div>

                                                <strong>
                                                    Payment is processing
                                                </strong>

                                                <p>
                                                    Flutterwave is processing
                                                    this payout. You can check
                                                    the transfer status if the
                                                    webhook has not arrived.
                                                </p>

                                            </div>

                                        </div>

                                    )}


                                    {/* ============================
                                        FAILED INFORMATION
                                    ============================ */}

                                    {status === "failed" && (

                                        <div className="failed-box">

                                            <strong>
                                                ⚠️ Payment failed
                                            </strong>

                                            <p>
                                                The payout could not be
                                                completed. The host's funds
                                                should have been returned
                                                to their available balance.
                                            </p>

                                        </div>

                                    )}


                                    {/* ============================
                                        ACTIONS
                                    ============================ */}

                                    <div className="withdrawal-actions">

                                        {status === "pending" && (

                                            <button
                                                className="approve-btn"
                                                disabled={
                                                    isLoading
                                                }
                                                onClick={() =>
                                                    approveWithdrawal(
                                                        withdrawal.hostId,
                                                        withdrawal.id
                                                    )
                                                }
                                            >

                                                {isLoading
                                                    ? "Starting Payment..."
                                                    : "Approve Payment"
                                                }

                                            </button>

                                        )}


                                        {status === "processing" && (

                                            <button
                                                className="check-status-btn"
                                                disabled={
                                                    isLoading
                                                }
                                                onClick={() =>
                                                    checkWithdrawalStatus(
                                                        withdrawal.hostId,
                                                        withdrawal.id
                                                    )
                                                }
                                            >

                                                {isLoading
                                                    ? "Checking..."
                                                    : "↻ Check Payment Status"
                                                }

                                            </button>

                                        )}


                                        {status === "completed" && (

                                            <div className="completed-message">
                                                ✓ Payment completed
                                            </div>

                                        )}


                                        {status === "failed" && (

                                            <div className="failed-message">
                                                Payment failed
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

export default AdminWithdrawals;