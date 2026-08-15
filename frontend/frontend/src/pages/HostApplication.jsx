import { useState } from "react";
import "./HostApplication.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


function HostApplication() {
    const navigate = useNavigate();
    const handleFileChange = (e) => {

    const file = e.target.files[0];

    setFormData({
        ...formData,
        proofImage: file
    });

};
    const {user} = useAuth();
    const [formData, setFormData] = useState({
        phone: "",
        location: "",
        previousEvents: "",
        hasPreviousEvents: "",
        proofImage: null

    });


    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });
    };

    const handleSubmit = (e) => {

    e.preventDefault();

    const hostData = {
        userId: user?.id || user?.email,
        fullName: user?.name || user?.displayName || "",
        email: user?.email,

        phone: formData.phone,
        location: formData.location,
        previousEvents: formData.previousEvents,
        hasPreviousEvents: formData.hasPreviousEvents,
        proofImage: formData.proofImage
    };

    console.log(hostData);
    console.log(formData.proofImage);
    sessionStorage.setItem(
        "hostApplication",
        JSON.stringify(hostData)
    );

    console.log(
        "Saved Host Data:",
        hostData
    );

    navigate("/host-verification", {
        state: {
            proofImage: formData.proofImage
        }
    });

};


    return (

        <div className="host-page">


            <div className="host-container">


                {/* Header */}

                <div className="host-header">
                    <h1>
                        Become an EventWaa Host
                    </h1>
                    <p className="main-text">
                        Join EventWaa and start creating unforgettable
                        experiences.
                    </p>
                    <p className="description">

                        Whether you are organizing concerts, picnics,
                        workshops, fundraisers, conferences, or community
                        events, EventWaa helps you reach more people and
                        manage your events professionally.

                    </p>
                </div>

                {/* Progress */}

                <div className="progress-section">
                    <h3>
                        Step 1 of 2
                    </h3>
                    <div className="progress-bar">
                        <div className="circle active">
                            1
                        </div>
                        <div className="line"></div>

                        <div className="circle">
                            2
                        </div>

                    </div>
                    <div className="progress-labels">
                        <span>
                            Application
                        </span>
                        <span>
                            Verification
                        </span>
                    </div>
                </div>

                {/* Benefits */}

                <div className="benefits">
                    <h2>
                        Why host with EventWaa?
                    </h2>
                    <div className="benefit-grid">
                        <div className="benefit-card">
                            🌍
                            <p>
                                Reach more people across Uganda
                            </p>
                        </div>

                        <div className="benefit-card">
                            🎟️
                            <p>
                                Sell tickets easily online
                            </p>
                        </div>

                        <div className="benefit-card">
                            🛡️
                            <p>
                                Trusted event verification system
                            </p>
                        </div>

                        <div className="benefit-card">
                            ⭐
                            <p>
                                Build your host reputation
                            </p>
                        </div>

                    </div>
                </div>

                {/* Form */}

                <form onSubmit={handleSubmit}>
                    <h2>
                        Your Information
                    </h2>
                    <label>
                        Phone Number
                    </label>
                    <input
                        type="text"
                        name="phone"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                    <label>
                        Location
                    </label>
                    <input

                        type="text"

                        name="location"

                        placeholder="Example: Gulu,Uganda"

                        value={formData.location}

                        onChange={handleChange}

                        required

                    />

                    <h2>
                        Hosting Details
                    </h2>

                    <label>
                    Have you organized an event before?
                    </label>

                    <select
                    name="hasPreviousEvents"
                    value={formData.hasPreviousEvents}
                    onChange={handleChange}
                    >

                    <option value="">
                    Select option
                    </option>

                    <option value="yes">
                    Yes
                    </option>

                    <option value="no">
                    No
                    </option>

                    </select>

                    {/*show upload only when a user selects YES */}
                    {
                    formData.hasPreviousEvents === "yes" && (
                    <>

                    <label>
                    Upload proof of previous event
                    </label>

                   <input
                        type="file"
                        name="proofImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                    />


                    </>

                    )
                    }

                    
                    {/* Process Info */}
                    <div className="process-box">
                        <h3>
                            ℹ️ Application Process
                        </h3>
                        <p>
                            1. Submit your application
                        </p>
                        <p>
                            2. EventWaa reviews your information
                        </p>
                        <p>
                            3. Complete identity verification after approval
                        </p>
                        <p>
                            4. Start creating and publishing events
                        </p>
                    </div>

                    <button type="submit">

                        🚀 Continue to Identity Verification

                    </button>

                    <p className="terms">

                        By applying, you agree to EventWaa's Host Guidelines
                        and Community Standards.
                    </p>

                </form>
            </div>
        </div>
    );

}


export default HostApplication;