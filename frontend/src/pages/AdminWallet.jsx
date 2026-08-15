import { useState, useEffect } from "react";
import "./AdminWallet.css";


function AdminWallet(){

    const [wallet, setWallet] = useState({
    availableBalance:0,
    pendingPayouts:0,
    totalCommission:0,
    totalWithdrawn:0,
    withdrawals:[]
});

useEffect(() => {
    loadWallet();
}, []);

async function loadWallet(){

    try{

        const response = await fetch(
            "http://localhost:5000/admin/wallet"
        );

        const data = await response.json();

        setWallet({
        availableBalance: data.availableBalance || 0,
        pendingPayouts: data.pendingPayouts || 0,
        totalCommission: data.totalCommission || 0,
        totalWithdrawn: data.totalWithdrawn || 0,
        withdrawals: data.withdrawals || []
    });

    }catch(error){

        console.log(error);

    }

}

    const [withdrawData, setWithdrawData] = useState({
        amount:"",
        method:"MTN Mobile Money",
        account:""
    });
     

    const handleChange = (e)=>{

        setWithdrawData({
            ...withdrawData,
            [e.target.name]:e.target.value
        });

    };

    const handleWithdraw = async()=>{

    if(!withdrawData.amount ||
       !withdrawData.method ||
       !withdrawData.account
    ){

        alert("Please complete all withdrawal details");
        return;

    }


    try{

        const response = await fetch(
            "http://localhost:5000/admin/wallet/withdraw",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify(withdrawData)
            }
        );


        const data = await response.json();


        if(data.success){

            alert("Withdrawal request submitted");

            setWallet(data.wallet);

            setWithdrawData({
                amount:"",
                method:"",
                account:""
            });

        }else{

            alert(data.message);

        }


    }catch(error){

        console.log(error);

    }

}

    return(

        <div className="wallet-page">

            <div className="wallet-header">
                <h1>Platform Wallet 💰</h1>
                <p>Manage EventWaa commission earnings and withdrawals.</p>
            </div>

            <div className="wallet-cards">

                <div className="wallet-card">
                    <h3>Available Balance</h3>
                    <h1>UGX {(wallet.availableBalance || 0).toLocaleString()}</h1>
                </div>

                <div className="wallet-card">
                    <h3>Pending Host Payouts</h3>
                    <h1>UGX {(wallet.pendingPayouts || 0).toLocaleString()}</h1>
                </div>

                <div className="wallet-card">
                    <h3>Total Commission Earned</h3>
                    <h1>UGX {(wallet.totalCommission || 0).toLocaleString()}</h1>
                </div>

                <div className="wallet-card">
                    <h3>Total Withdrawn</h3>
                    <h1>UGX {(wallet.totalWithdrawn || 0).toLocaleString()}</h1>
                </div>

            </div>

            <div className="withdraw-section">

                <h2>Withdraw Funds</h2>

                <label>Withdrawal Amount (UGX)</label>
                <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={withdrawData.amount}
                onChange={handleChange}
                />

                <label>Withdrawal Method</label>
                <select
                name="method"
                value={withdrawData.method}
                onChange={handleChange}
                >
                    <option value="">Select withdrawal method</option>
                    <option>MTN Mobile Money</option>
                    <option>Airtel Money</option>
                    <option>Bank Account</option>
                </select>

                <label>Phone Number / Account</label>
                <input
                type="text"
                name="account"
                placeholder="Enter phone number or account"
                value={withdrawData.account}
                onChange={handleChange}
                />

                <button
                className="withdraw-btn"
                onClick={handleWithdraw}
                >
                    Withdraw Funds
                </button>

            </div>

            <div className="history-section">

                <h2>Withdrawal History</h2>

                {wallet.withdrawals.map(item=>(

                    <div
                    className="history-row"
                    key={item.id}
                    >

                        <span>{item.date}</span>

                        <span>UGX {item.amount.toLocaleString()}</span>

                        <span className="status completed">
                            {item.status}
                        </span>

                    </div>

                ))}

            </div>

        </div>

    );

}

export default AdminWallet;