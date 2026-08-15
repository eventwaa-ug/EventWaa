import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HostVerification.css";
import { createHostApplication } from "../services/hostServices";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

function HostVerification() {

    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();

    const [submitted, setSubmitted] = useState(false);

    const hostApplication = JSON.parse(
        sessionStorage.getItem("hostApplication")
    ) || {};

    const proofImage = location.state?.proofImage || null;


    useEffect(() => {

    if(!user) return;


    const checkApplication = async () => {

        const response = await fetch(
            "http://localhost:5000/host-applications"
        );

        const applications = await response.json();


        const myApplication = applications.find(
            app =>
            String(app.userId) === String(user.id)
        );


        if(myApplication){

            if(myApplication.status === "pending"){

                setSubmitted(true);

            }


            if(myApplication.status === "approved"){

                navigate("/dashboard");

            }

        }

    };


    checkApplication();


    const interval = setInterval(
        checkApplication,
        3000
    );


    return () => clearInterval(interval);


}, [user, navigate]);

    const [formData, setFormData] = useState({
        fullLegalName: "",
        dateOfBirth: "",
        country: "Uganda",
        idNumber: "",
        idFront: null,
        idBack: null,
        agree: false
    });

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });

    };

    const handleFileChange = (e) => {

        const { name, files } = e.target;

        setFormData({
            ...formData,
            [name]: files[0]
        });

    };

    const handleSubmit = async (e) => {

    e.preventDefault();


    if(!formData.agree){

        alert("Please agree to the terms before submitting.");

        return;
    }


    const submission = new FormData();

    // Step 1 data
    submission.append(
        "userId",
        hostApplication.userId
    );
    submission.append(
        "fullName",
        hostApplication.fullName
    );
    submission.append(
        "email",
        hostApplication.email
    );
    submission.append(
        "phone",
        hostApplication.phone
    );
    submission.append(
        "location",
        hostApplication.location
    );
    submission.append(
    "hasPreviousEvents",
    hostApplication.hasPreviousEvents
);


    // Step 2 data
    submission.append(
        "fullLegalName",
        formData.fullLegalName
    );
    submission.append(
        "dateOfBirth",
        formData.dateOfBirth
    );

    submission.append(
        "country",
        formData.country
    );

    submission.append(
        "idNumber",
        formData.idNumber
    );
    submission.append(
        "idFront",
        formData.idFront
    );
    submission.append(
        "idBack",
        formData.idBack
    );
    if(proofImage){
        submission.append(
            "proofImage",
            proofImage
        );
    }
    try {
        console.log("Proof Image:", formData.proofImage);

for (const pair of submission.entries()) {
    console.log(pair[0], pair[1]);
}
        const result = await createHostApplication(
            submission
        );
        console.log(result);
        sessionStorage.removeItem(
            "hostApplication"
        );
        setSubmitted(true);
       
        navigate("/host-verification");
    } catch(error){
        console.log(error);
        alert(
            "Something went wrong"
        );
    }
};

if(submitted){

    return (

        <div className="verification-page">

            <div className="verification-card">

                <h1>
                    ⏳ Application Under Review
                </h1>

                <p>
                    Your host application has been submitted successfully.
                </p>

                <p>
                    EventWaa is reviewing your information.
                </p>

                <h3>
                    Status: Pending
                </h3>

                <p>
                    You will be notified within an hour.
                </p>

            </div>

        </div>

    );

}

    return (

        <div className="verification-page">
            <div className="verification-card">
                <div className="stepper">
                    <div className="step completed">
                        ✓ Step 1
                    </div>
                    <div className="step active">
                        Step 2
                    </div>
                </div>
                <h1>Verify Your Identity</h1>
                <p>
                    Complete this final step before your host application
                    can be reviewed.
                </p>
                <form onSubmit={handleSubmit}>
                    <label>Full Legal Name</label>
                    <input
                        type="text"
                        name="fullLegalName"
                        value={formData.fullLegalName}
                        onChange={handleChange}
                        required
                    />
                    <label>Date of Birth</label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                    />
                    <label>Country</label>

                    <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                    />
                    <label>National ID / Passport Number</label>

                    <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleChange}
                        required
                    />
                    <label>Upload ID Front</label>

                    <input
                        type="file"
                        name="idFront"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                    />

                    <label>Upload ID Back</label>

                    <input
                        type="file"
                        name="idBack"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                    />

                    <label className="checkbox">

                        <input
                            type="checkbox"
                            name="agree"
                            checked={formData.agree}
                            onChange={handleChange}
                        />

                        I confirm that all the information provided is accurate.

                    </label>

                    <button type="submit">
                        Submit For Review
                    </button>

                </form>

            </div>

        </div>

    );

}

export default HostVerification;