import { useEffect, useState } from "react";
import './AdminWithdrawals.css';

function AdminWithdrawals() {

const [withdrawals, setWithdrawals] = useState([]);
const [filter, setFilter] = useState("all");
const loadWithdrawals = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/admin/host-withdrawals"
        );
        const data = await response.json();
        setWithdrawals(data);
    } catch (error) {
        console.log(error);
    }
};
useEffect(() => {
    loadWithdrawals();
}, []);
const approveWithdrawal = async (hostId, withdrawalId) => {
    try {
        await fetch(
            `http://localhost:5000/admin/host-withdrawals/approve/${hostId}/${withdrawalId}`,
            {
                method: "PUT"
            }
        );
        loadWithdrawals();
    } catch (error) {
        console.log(error);
    }
};
const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    if (filter === "all") return true;
    return withdrawal.status === filter;
});
return (
    <div className="admin-withdrawals-page">
        <h1>💰 Host Withdrawal Requests</h1>
        <div className="withdrawal-filters">
            <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
            >
                All
            </button>
            <button
                className={filter === "pending" ? "active" : ""}
                onClick={() => setFilter("pending")}
            >
                Pending
            </button>
            <button
                className={filter === "completed" ? "active" : ""}
                onClick={() => setFilter("completed")}
            >
                Approved
            </button>
        </div>
        {filteredWithdrawals.length === 0 ? (
            <p>No withdrawal requests.</p>
        ) : (
            filteredWithdrawals.map((withdrawal) => (
                <div
                    className="withdrawal-card"
                    key={`${withdrawal.hostId}-${withdrawal.id}`}
                >
                    <div className="withdrawal-header">
                        <div>
                            <h3>{withdrawal.hostName}</h3>
                            <p>{withdrawal.hostEmail}</p>
                        </div>
                        <span className={`status ${withdrawal.status}`}>
                            {withdrawal.status}
                        </span>
                    </div>
                    <div className="withdrawal-details">
                        <p>
                            Amount:
                            <strong>
                                UGX {withdrawal.amount.toLocaleString()}
                            </strong>
                        </p>
                        <p>
                            Method: {withdrawal.method}
                        </p>
                        <p>
                            Account: {withdrawal.account}
                        </p>
                        <p>
                            Requested: {withdrawal.date}
                        </p>
                    </div>
                    {withdrawal.status === "pending" && (
                        <button
                            className="approve-btn"
                            onClick={() =>
                                approveWithdrawal(
                                    withdrawal.hostId,
                                    withdrawal.id
                                )
                            }
                        >
                            Approve Payment
                        </button>
                    )}
                </div>
            ))
        )}
    </div>
);

}

export default AdminWithdrawals;