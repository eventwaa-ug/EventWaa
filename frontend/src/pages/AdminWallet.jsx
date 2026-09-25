import { useEffect, useState } from "react";
import "./AdminWallet.css";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
/* =========================================================
   BACKEND
========================================================= */
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
/* =========================================================
   HELPERS
========================================================= */
const formatUGX = (value) => {
    const amount = Number(value || 0);
    return `UGX ${amount.toLocaleString()}`;
};
/* =========================================================
   DEFAULT WALLET
========================================================= */
const DEFAULT_WALLET = {
    availableBalance: 0,
    pendingPayouts: 0,
    totalCommission: 0,
    totalServiceFees: 0,
    totalRevenue: 0,
    totalWithdrawn: 0,
    withdrawals: [],
    transactions: [],
};
/* =========================================================
   COMPONENT
========================================================= */
function AdminWallet() {
    const [wallet, setWallet] = useState(
        DEFAULT_WALLET
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [withdrawData, setWithdrawData] = useState({
        amount: "",
        method: "MTN Mobile Money",
        account: "",
    });
    /* =====================================================
       LOAD WALLET
    ===================================================== */
    useEffect(() => {
        loadWallet();
    }, []);
    async function loadWallet() {
        try {
            setLoading(true);
            setError("");
            const response = await fetch(
                `${BACKEND_URL}/admin/wallet`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );
            const data = await response.json();
            console.log(
                "ADMIN WALLET RESPONSE:",
                data
            );
            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Unable to load platform wallet."
                );
            }
            setWallet({
                availableBalance:
                    Number(
                        data?.availableBalance || 0
                    ),
                pendingPayouts:
                    Number(
                        data?.pendingPayouts || 0
                    ),
                totalCommission:
                    Number(
                        data?.totalCommission || 0
                    ),
                totalServiceFees:
                    Number(
                        data?.totalServiceFees || 0
                    ),
                totalRevenue:
                    Number(
                        data?.totalRevenue || 0
                    ),
                totalWithdrawn:
                    Number(
                        data?.totalWithdrawn || 0
                    ),
                withdrawals:
                    Array.isArray(
                        data?.withdrawals
                    )
                        ? data.withdrawals
                        : [],
                transactions:
                    Array.isArray(
                        data?.transactions
                    )
                        ? data.transactions
                        : [],
            });
        } catch (error) {
            console.error(
                "ADMIN WALLET ERROR:",
                error
            );
            setError(
                error.message ||
                "Unable to load platform wallet."
            );
        } finally {
            setLoading(false);
        }
    }
    /* =====================================================
       INPUT CHANGE
    ===================================================== */
    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;
        setWithdrawData(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };
    /* =====================================================
       WITHDRAW
    ===================================================== */
    const handleWithdraw = async () => {
        if (
            !withdrawData.amount ||
            !withdrawData.method ||
            !withdrawData.account
        ) {
            alert(
                "Please complete all withdrawal details."
            );
            return;
        }
        const amount = Number(
            withdrawData.amount
        );
        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            alert(
                "Please enter a valid withdrawal amount."
            );
            return;
        }
        try {
            const response = await fetch(
                `${BACKEND_URL}/admin/wallet/withdraw`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json",
                    },
                    body: JSON.stringify({
                        amount,
                        method:
                            withdrawData.method,
                        account:
                            withdrawData.account,
                    }),
                }
            );
            const data =
                await response.json();
            console.log(
                "ADMIN WITHDRAW RESPONSE:",
                data
            );
            if (
                !response.ok ||
                !data.success
            ) {
                alert(
                    data?.message ||
                    "Withdrawal request failed."
                );
                return;
            }
            alert(
                "Withdrawal request submitted successfully."
            );
            if (data.wallet) {
                setWallet({
                    availableBalance:
                        Number(
                            data.wallet
                                .availableBalance || 0
                        ),
                    pendingPayouts:
                        Number(
                            data.wallet
                                .pendingPayouts || 0
                        ),
                    totalCommission:
                        Number(
                            data.wallet
                                .totalCommission || 0
                        ),
                    totalServiceFees:
                        Number(
                            data.wallet
                                .totalServiceFees || 0
                        ),
                    totalRevenue:
                        Number(
                            data.wallet
                                .totalRevenue || 0
                        ),
                    totalWithdrawn:
                        Number(
                            data.wallet
                                .totalWithdrawn || 0
                        ),
                    withdrawals:
                        Array.isArray(
                            data.wallet.withdrawals
                        )
                            ? data.wallet.withdrawals
                            : [],
                    transactions:
                        Array.isArray(
                            data.wallet.transactions
                        )
                            ? data.wallet.transactions
                            : [],
                });
            } else {
                await loadWallet();
            }
            setWithdrawData({
                amount: "",
                method: "MTN Mobile Money",
                account: "",
            });
        } catch (error) {
            console.error(
                "ADMIN WITHDRAW ERROR:",
                error
            );
            alert(
                "Unable to submit withdrawal request."
            );
        }
    };
    /* =====================================================
       LOADING
    ===================================================== */
    if (loading) {
        return (
            <div className="wallet-page">
                <div className="wallet-header">
                    <h1>
                        Platform Wallet
                        <MdOutlineAccountBalanceWallet
                            style={{
                                verticalAlign:
                                    "middle",
                                marginLeft:
                                    "8px",
                            }}
                        />
                    </h1>
                    <p>
                        Loading platform wallet...
                    </p>
                </div>
            </div>
        );
    }
    /* =====================================================
       ERROR
    ===================================================== */
    if (error) {
        return (
            <div className="wallet-page">
                <div className="wallet-header">
                    <h1>
                        Platform Wallet
                        <MdOutlineAccountBalanceWallet
                            style={{
                                verticalAlign:
                                    "middle",
                                marginLeft:
                                    "8px",
                            }}
                        />
                    </h1>
                    <p>
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={loadWallet}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    /* =====================================================
       RENDER
    ===================================================== */
    return (
        <div className="wallet-page">
            {/* =================================================
                HEADER
            ================================================= */}
            <div className="wallet-header">
                <h1>
                    Platform Wallet
                    <MdOutlineAccountBalanceWallet
                        style={{
                            verticalAlign:
                                "middle",
                            marginLeft:
                                "8px",
                        }}
                    />
                </h1>
                <p>
                    Manage EventWaa commission
                    earnings and withdrawals.
                </p>
            </div>
            {/* =================================================
                WALLET CARDS
            ================================================= */}
            <div className="wallet-cards">
                <div className="wallet-card">
                    <h3>
                        Available Balance
                    </h3>
                    <h1>
                        {formatUGX(
                            wallet.availableBalance
                        )}
                    </h1>
                </div>
                <div className="wallet-card">
                    <h3>
                        Pending Host Payouts
                    </h3>
                    <h1>
                        {formatUGX(
                            wallet.pendingPayouts
                        )}
                    </h1>
                </div>
                <div className="wallet-card">
                    <h3>
                        Total Commission Earned
                    </h3>
                    <h1>
                        {formatUGX(
                            wallet.totalCommission
                        )}
                    </h1>
                </div>
                <div className="wallet-card">
                    <h3>
                        Total Withdrawn
                    </h3>
                    <h1>
                        {formatUGX(
                            wallet.totalWithdrawn
                        )}
                    </h1>
                </div>
            </div>
            {/* =================================================
                ADDITIONAL REVENUE INFORMATION
            ================================================= */}
            <div className="wallet-cards">
                <div className="wallet-card">
                    <h3>
                        Total Service Fees
                    </h3>
                    <h1>
                        {formatUGX(
                            wallet.totalServiceFees
                        )}
                    </h1>
                </div>
                <div className="wallet-card">
                    <h3>
                        Total Platform Revenue
                    </h3>
                    <h1>
                        {formatUGX(
                            wallet.totalRevenue
                        )}
                    </h1>
                </div>
            </div>
            {/* =================================================
                WITHDRAW
            ================================================= */}
            <div className="withdraw-section">
                <h2>
                    Withdraw Funds
                </h2>
                <label>
                    Withdrawal Amount (UGX)
                </label>
                <input
                    type="number"
                    name="amount"
                    min="0"
                    placeholder="Enter amount"
                    value={
                        withdrawData.amount
                    }
                    onChange={
                        handleChange
                    }
                />
                <label>
                    Withdrawal Method
                </label>
                <select
                    name="method"
                    value={
                        withdrawData.method
                    }
                    onChange={
                        handleChange
                    }
                >
                    <option value="">
                        Select withdrawal method
                    </option>
                    <option value="MTN Mobile Money">
                        MTN Mobile Money
                    </option>
                    <option value="Airtel Money">
                        Airtel Money
                    </option>
                    <option value="Bank Account">
                        Bank Account
                    </option>
                </select>
                <label>
                    Phone Number / Account
                </label>
                <input
                    type="text"
                    name="account"
                    placeholder="Enter phone number or account"
                    value={
                        withdrawData.account
                    }
                    onChange={
                        handleChange
                    }
                />
                <button
                    className="withdraw-btn"
                    type="button"
                    onClick={
                        handleWithdraw
                    }
                >
                    Withdraw Funds
                </button>
            </div>
            {/* =================================================
                WITHDRAWAL HISTORY
            ================================================= */}
            <div className="history-section">
                <h2>
                    Withdrawal History
                </h2>
                {wallet.withdrawals.length === 0 ? (
                    <p>
                        No withdrawals yet.
                    </p>
                ) : (
                    wallet.withdrawals.map(
                        (item, index) => (
                            <div
                                className="history-row"
                                key={
                                    item.id ||
                                    `withdrawal-${index}`
                                }
                            >
                                <span>
                                    {
                                        item.date ||
                                        "—"
                                    }
                                </span>
                                <span>
                                    {formatUGX(
                                        item.amount
                                    )}
                                </span>
                                <span className="status completed">
                                    {
                                        item.status ||
                                        "Pending"
                                    }
                                </span>
                            </div>
                        )
                    )
                )}
            </div>
            {/* =================================================
                PLATFORM TRANSACTIONS
            ================================================= */}
            <div className="history-section">
                <h2>
                    Platform Transactions
                </h2>
                {wallet.transactions.length === 0 ? (
                    <p>
                        No platform transactions yet.
                    </p>
                ) : (
                    wallet.transactions.map(
                        (item, index) => (
                            <div
                                className="history-row"
                                key={
                                    item.transactionId ||
                                    item.txRef ||
                                    `transaction-${index}`
                                }
                            >
                                <span>
                                    <strong>
                                        {
                                            item.eventTitle ||
                                            "Event sale"
                                        }
                                    </strong>
                                    <br />
                                    <small>
                                        {
                                            item.paymentProvider ||
                                            "Payment"
                                        }
                                    </small>
                                </span>
                                <span>
                                    {formatUGX(
                                        item.amount
                                    )}
                                </span>
                                <span>
                                    Commission:
                                    <br />
                                    {formatUGX(
                                        item.commission
                                    )}
                                </span>
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
}
export default AdminWallet;