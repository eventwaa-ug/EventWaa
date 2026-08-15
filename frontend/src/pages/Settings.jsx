import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Settings.css";


function Settings() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("account");

    const [hostMode, setHostMode] = useState(false);
    const [hostData, setHostData] = useState({
        organizerName:"",
        description:"",
        experience:"",
        eventTypes:[]
    });
    const [notifications, setNotifications] = useState({

    emailTickets: true,

    eventReminders: true,

    messages: true,

    pushNotifications: true,

    whatsappAlerts: false,

    marketingEmails: false

    });
    const [privacy, setPrivacy] = useState({

    profileVisibility: "Public",

    hideTickets: true,

    twoFactor: false

    });
    const handleHostChange =(e) => {
        setHostData({
            ...hostData,
            [e.target.name]: e.target.value
        });
    };
    const handleNotificationChange = (name) => {

    setNotifications({

        ...notifications,

        [name]: !notifications[name]

    });

    };
    const handlePrivacyChange = (name) => {

    setPrivacy({

        ...privacy,

        [name]: !privacy[name]

    });

    };


    



    const tabs = [
        {
            id:"account",
            name:"Account"
        },
        {
            id:"host",
            name:"Host Tools"
        },
        {
            id:"notifications",
            name:"Notifications"
        },
        {
            id:"privacy",
            name:"Privacy"
        },
        {
            id:"payments-support",
            name:"Payments & Support"
        },
    ];



    return (

        <div className="settings-page">


            <div className="settings-header">

                <img
                src="https://via.placeholder.com/100"
                alt="profile"
                />

                <h2>
                    {user?.name}
                </h2>

                <p>
                    EventWaa User
                </p>


                <div className="host-toggle">

                    <span>
                        Host Mode
                    </span>

                    <input

                    type="checkbox"

                    checked={hostMode}

                    onChange={() =>
                        setHostMode(!hostMode)
                    }

                    />

                </div>


            </div>




            <div className="settings-tabs">

                {tabs.map((tab)=>(

                    <button

                    key={tab.id}

                    className={
                        activeTab === tab.id
                        ?
                        "active-tab"
                        :
                        ""
                    }

                    onClick={() =>
                        setActiveTab(tab.id)
                    }

                    >

                    {tab.name}

                    </button>

                ))}


            </div>





            <div className="settings-content">


            {activeTab === "account" && (

                <div className="settings-card">

                    <h2>
                        Profile & Account Info
                    </h2>


                    <label>
                        Full Name
                    </label>

                    <input
                    value={user?.name || ""}
                    readOnly
                    />



                    <label>
                        Email
                    </label>

                    <input
                    value={user?.email || ""}
                    readOnly
                    />



                    <label>
                        Bio
                    </label>

                    <textarea
                    placeholder="Tell people about yourself"
                    />


                    <label>
                        Location
                    </label>

                    <input
                    placeholder="Gulu, Uganda"
                    />



                    <label>
                        Language
                    </label>

                    <select>

                        <option>
                            English
                        </option>

                        <option>
                            Acholi
                        </option>

                        <option>
                            Russian
                        </option>

                    </select>


                </div>

            )}





            {activeTab === "host" && (

                <div className="settings-card">

                <h2>
                🎤 Host / Organizer Tools
                </h2>



                {hostMode ? (

                <>

                <label>
                Organizer Name
                </label>

                <input

                name="organizerName"

                value={hostData.organizerName}

                onChange={handleHostChange}

                placeholder="Style Waa Creative House"

                />




                <label>
                Business Description
                </label>

                <textarea

                name="description"

                value={hostData.description}

                onChange={handleHostChange}

                placeholder="Tell people about your events"

                />




                <label>
                Years of Experience
                </label>

                <input

                type="number"

                name="experience"

                value={hostData.experience}

                onChange={handleHostChange}

                />




                <label>
                Event Types
                </label>


                <div className="event-types">


                <label>
                <input type="checkbox"/>
                Weddings
                </label>


                <label>
                <input type="checkbox"/>
                Concerts
                </label>


                <label>
                <input type="checkbox"/>
                Corporate Events
                </label>


                <label>
                <input type="checkbox"/>
                Festivals
                </label>


                <label>
                <input type="checkbox"/>
                Picnics
                </label>


                </div>




                <h3>
                Gallery & Portfolio
                </h3>

                <button className="secondary-btn">

                Upload Event Photos

                </button>





                <h3>Verification</h3>

                <div className="verification-box">

                {user?.verifiedHost ?  (
                    <>
                    <strong>✅ Verified Host</strong>

                    <p>Your host profile is live.</p>

                    <button
                        className="secondary-btn"
                        onClick={() => navigate(`/host/${user.id}`)}
                    >
                        View My Host Profile
                    </button>
                    </>
                ) : user?.hostApplicationStatus ==="pending" ? (
                    <>
                    <strong>⏳ Pending Verification</strong>

                    <p>Your verification application is under review.</p>
                    </>
                ) : (
                    <>
                    <strong>⚪ Not Verified</strong>

                    <p>
                        Become a verified host to build trust with attendees.
                    </p>

                    <button
                        className="secondary-btn"
                        onClick={() => navigate("/host-application")}
                    >
                        
                    </button>
                    </>
                )}

                </div>
                </>

                ) : (

                <p>
                    Enable Host Mode to access organizer tools.
                </p>

                )}

                </div>

                )}





            {activeTab === "notifications" && (

<div className="settings-card">

<h2>
🔔 Notifications & Preferences
</h2>


<div className="setting-row">

<span>
🎟️ New ticket alerts
</span>

<input

type="checkbox"

checked={notifications.emailTickets}

onChange={() =>
handleNotificationChange("emailTickets")
}

/>

</div>



<div className="setting-row">

<span>
📅 Event reminders
</span>

<input

type="checkbox"

checked={notifications.eventReminders}

onChange={() =>
handleNotificationChange("eventReminders")
}

/>

</div>



<div className="setting-row">

<span>
💬 New messages
</span>

<input

type="checkbox"

checked={notifications.messages}

onChange={() =>
handleNotificationChange("messages")
}

/>

</div>




<div className="setting-row">

<span>
📱 Push Notifications
</span>

<input

type="checkbox"

checked={notifications.pushNotifications}

onChange={() =>
handleNotificationChange("pushNotifications")
}

/>

</div>




<div className="setting-row">

<span>
📲 WhatsApp/SMS Alerts
</span>

<input

type="checkbox"

checked={notifications.whatsappAlerts}

onChange={() =>
handleNotificationChange("whatsappAlerts")
}

/>

</div>




<div className="setting-row">

<span>
📢 Marketing Emails
</span>

<input

type="checkbox"

checked={notifications.marketingEmails}

onChange={() =>
handleNotificationChange("marketingEmails")
}

/>

</div>


</div>

)}





            {activeTab === "privacy" && (

<div className="settings-card">

<h2>
🔒 Privacy & Security
</h2>



<label>
Who can see my profile?
</label>


<select

value={privacy.profileVisibility}

onChange={(e)=>

setPrivacy({

...privacy,

profileVisibility:e.target.value

})

}

>

<option>
Public
</option>

<option>
Friends Only
</option>

<option>
Private
</option>


</select>




<div className="setting-row">

<span>
🎟️ Hide my tickets from others
</span>


<input

type="checkbox"

checked={privacy.hideTickets}

onChange={() =>
handlePrivacyChange("hideTickets")
}

/>


</div>





<div className="setting-row">

<span>
🔐 Two-Factor Authentication
</span>


<input

type="checkbox"

checked={privacy.twoFactor}

onChange={() =>
handlePrivacyChange("twoFactor")
}

/>


</div>





<h3>
Security
</h3>


<button className="secondary-btn">

Change Password

</button>



<h3>
Your Data
</h3>


<button className="secondary-btn">

Download My Data

</button>




<div className="danger-zone">

<h3>
Danger Zone
</h3>


<button className="delete-account-btn">

Delete Account

</button>


</div>



</div>

)}





            {activeTab === "payments-support" && (

<div className="settings-card">


<h2>
💳 Payments & Support
</h2>



<h3>
Payment Methods
</h3>


<div className="payment-item">

<p>
📱 Mobile Money
</p>

<button className="secondary-btn">
Add Method
</button>

</div>



<div className="payment-item">

<p>
💳 Bank Card
</p>

<button className="secondary-btn">
Add Card
</button>

</div>





<h3>
Billing History
</h3>


<div className="history-box">

<p>
No purchases yet
</p>

</div>





<h3>
Refund Requests
</h3>


<p>
Track your ticket refund status here.
</p>





<h3>
Promo Codes
</h3>


<p>
View available discounts and offers.
</p>






<hr/>




<h3>
❓ Support
</h3>


<button className="secondary-btn">

Help Center

</button>



<button className="secondary-btn">

Contact EventWaa Team

</button>



<button className="secondary-btn">

Terms & Conditions

</button>



<button className="secondary-btn">

Privacy Policy

</button>





<hr/>





<h3>
Account Actions
</h3>


<button

className="logout-btn"

onClick={logout}

>

Logout

</button>



<button className="delete-account-btn">

Delete Account

</button>



</div>

)}


            </div>


        </div>

    );

}


export default Settings;