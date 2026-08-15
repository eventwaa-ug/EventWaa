import { useEffect, useState } from "react";
import "./../styles/HostWallet.css";
import { useAuth } from "../context/AuthContext";
const API_URL = "http://localhost:5000";
function HostWallet() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState({
        availableBalance: 0,
        pendingPayouts: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        withdrawals: [],
        transactions: []
    });
    const [earnings, setEarnings] = useState({
        totalSales: 0,
        commission: 0,
        hostEarnings: 0
    });
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("Mobile Money");
    const [account, setAccount] = useState("");
    const [message, setMessage] = useState("");
    /*
    ============================================================
    LOAD WALLET
    ============================================================
    */
    const loadWallet = async () => {
        if (!user?.id) return;
        try {
            const response = await fetch(
                `${API_URL}/host/wallet/${user.id}`
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load wallet."
                );
            }
            setWallet({
                availableBalance: Number(
                    data.availableBalance || 0
                ),
                pendingPayouts: Number(
                    data.pendingPayouts || 0
                ),
                totalEarned: Number(
                    data.totalEarned || 0
                ),
                totalWithdrawn: Number(
                    data.totalWithdrawn || 0
                ),
                withdrawals: Array.isArray(
                    data.withdrawals
                )
                    ? data.withdrawals
                    : [],
                transactions: Array.isArray(
                    data.transactions
                )
                    ? data.transactions
                    : []
            });
        } catch (error) {
            console.error(
                "WALLET LOAD ERROR:",
                error
            );
        }
    };
    /*
    ============================================================
    LOAD WALLET WHEN USER IS AVAILABLE
    ALSO REFRESH WHEN WINDOW GETS FOCUS
    AND EVERY 30 SECONDS
    ============================================================
    */
    useEffect(() => {
        if (!user?.id) return;
        loadWallet();
        const handleFocus = () => {
            loadWallet();
        };
        window.addEventListener(
            "focus",
            handleFocus
        );
        const interval = setInterval(() => {
            loadWallet();
        }, 30000);
        return () => {
            window.removeEventListener(
                "focus",
                handleFocus
            );
            clearInterval(interval);
        };
    }, [user]);
    /*
    ============================================================
    LOAD HOST EARNINGS
    ============================================================
    */
    useEffect(() => {
        if (!user?.id) return;
        const loadEarnings = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/host/earnings/${user.id}`
                );
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to load earnings."
                    );
                }
                setEarnings({
                    totalSales: Number(
                        data.totalSales || 0
                    ),
                    commission: Number(
                        data.commission || 0
                    ),
                    hostEarnings: Number(
                        data.hostEarnings || 0
                    )
                });
            } catch (error) {
                console.error(
                    "EARNINGS LOAD ERROR:",
                    error
                );
            }
        };
        loadEarnings();
    }, [user]);
    /*
    ============================================================
    REQUEST WITHDRAWAL
    ============================================================
    */
    const requestWithdrawal = async () => {
        if (!amount || !account) {
            setMessage(
                "Please fill all fields."
            );
            return;
        }
        if (!user?.id) {
            setMessage(
                "Please log in again."
            );
            return;
        }
        try {
            const response = await fetch(
                `${API_URL}/host/wallet/withdraw/${user.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        amount: Number(amount),
                        method,
                        account
                    })
                }
            );
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Withdrawal request failed."
                );
            }
            setMessage(
                "Withdrawal request sent. Waiting for admin approval."
            );
            setAmount("");
            setAccount("");
            // Immediately refresh wallet
            await loadWallet();
        } catch (error) {
            console.error(
                "WITHDRAWAL ERROR:",
                error
            );
            setMessage(
                error.message ||
                "Unable to request withdrawal."
            );
        }
    };
    /*
    ============================================================
    RENDER
    ============================================================
    */
    return (
        <div className="host-wallet-page">
            {/* ==================================================
                HEADER
            ================================================== */}
            <div className="host-wallet-header">
                <h1>
                    Host Wallet 💰
                </h1>
                <p>
                    Manage your EventWaa event earnings.
                </p>
            </div>
            {/* ==================================================
                WALLET SUMMARY
            ================================================== */}
            <div className="host-wallet-cards">
                <div className="host-wallet-card">
                    <h3>
                        Available Balance
                    </h3>
                    <h2>
                        UGX{" "}
                        {wallet.availableBalance.toLocaleString()}
                    </h2>
                </div>
                <div className="host-wallet-card">
                    <h3>
                        Pending Payout
                    </h3>
                    <h2>
                        UGX{" "}
                        {wallet.pendingPayouts.toLocaleString()}
                    </h2>
                </div>
                <div className="host-wallet-card">
                    <h3>
                        Total Earned
                    </h3>
                    <h2>
                        UGX{" "}
                        {wallet.totalEarned.toLocaleString()}
                    </h2>
                </div>
                <div className="host-wallet-card">
                    <h3>
                        Total Withdrawn
                    </h3>
                    <h2>
                        UGX{" "}
                        {wallet.totalWithdrawn.toLocaleString()}
                    </h2>
                </div>
            </div>
            {/* ==================================================
                WITHDRAW
            ================================================== */}
            <div className="host-withdraw-section">
                <h2>
                    Withdraw Earnings
                </h2>
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) =>
                        setAmount(e.target.value)
                    }
                />
                <select
                    value={method}
                    onChange={(e) =>
                        setMethod(e.target.value)
                    }
                >
                    <option value="">
                        Choose a payment method
                    </option>
                    <option value="MTN Mobile Money">
                        MTN Mobile Money
                    </option>
                    <option value="Airtel Mobile Money">
                        Airtel Mobile Money
                    </option>
                    <option value="Bank Account">
                        Bank Account
                    </option>
                </select>
                <input
                    type="text"
                    placeholder="Account Number"
                    value={account}
                    onChange={(e) =>
                        setAccount(e.target.value)
                    }
                />
                <button
                    onClick={requestWithdrawal}
                >
                    Request Withdrawal
                </button>
                {message && (
                    <p className="wallet-message">
                        {message}
                    </p>
                )}
            </div>
            {/* ==================================================
                EARNINGS BREAKDOWN
            ================================================== */}
            <div className="earnings-card">
                <h2>
                    💰 Earnings Breakdown
                </h2>
                <p>
                    🎟️ Total Ticket Sales:
                    <strong>
                        UGX{" "}
                        {earnings.totalSales.toLocaleString()}
                    </strong>
                </p>
                <p>
                    🏦 EventWaa Commission:
                    <strong>
                        UGX{" "}
                        {earnings.commission.toLocaleString()}
                    </strong>
                </p>
                <p>
                    👤 Your Earnings:
                    <strong>
                        UGX{" "}
                        {earnings.hostEarnings.toLocaleString()}
                    </strong>
                </p>
            </div>
            {/* ==================================================
                TRANSACTION HISTORY
            ================================================== */}
            <div className="wallet-transactions">
                <h2>
                    Transaction History
                </h2>
                {wallet.transactions.length === 0 ? (
                    <p>
                        No transactions yet.
                    </p>
                ) : (
                    wallet.transactions.map(
                        (item, index) => (
                            <div
                                className="wallet-transaction-row"
                                key={
                                    item.id ||
                                    index
                                }
                            >
                                <div className="transaction-info">
                                    <strong>
                                        {
                                            item.eventTitle ||
                                            item.description ||
                                            "Wallet transaction"
                                        }
                                    </strong>
                                    <span>
                                        {item.date || "—"}
                                    </span>
                                </div>
                                <div
                                    className={`transaction-amount ${
                                        Number(item.amount) < 0
                                            ? "expense"
                                            : "income"
                                    }`}
                                >
                                    {Number(item.amount) < 0
                                        ? "-"
                                        : "+"}
                                    UGX{" "}
                                    {Math.abs(
                                        Number(
                                            item.amount || 0
                                        )
                                    ).toLocaleString()}
                                </div>
                            </div>
                        )
                    )
                )}
            </div>
            {/* ==================================================
                WITHDRAWAL HISTORY
            ================================================== */}
            <div className="host-history">
                <h2>
                    Withdrawal History
                </h2>
                {wallet.withdrawals.length === 0 ? (
                    <p>
                        No withdrawal requests yet.
                    </p>
                ) : (
                    wallet.withdrawals.map(
                        (item) => (
                            <div
                                className="host-history-row"
                                key={item.id}
                            >
                                <span>
                                    {item.date}
                                </span>
                                <span>
                                    UGX{" "}
                                    {Number(
                                        item.amount || 0
                                    ).toLocaleString()}
                                </span>
                                <span
                                    className={
                                        item.status ===
                                        "completed"
                                            ? "completed"
                                            : "pending"
                                    }
                                >
                                    {item.status}
                                </span>
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
}
export default HostWallet;