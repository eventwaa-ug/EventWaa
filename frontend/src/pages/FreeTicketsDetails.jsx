import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/TicketDetails.css";
import { QRCodeCanvas } from "qrcode.react";
    /* =========================================================
       BACKEND
    ========================================================= */

    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
function FreePassDetails() {

    const { attendanceId } = useParams();

    const [pass, setPass] = useState(null);


    useEffect(() => {

        fetch(`${BACKEND_URL}/attendance/${attendanceId}`)
            .then(res => res.json())
            .then(data => {

                setPass(data);

            });

    }, [attendanceId]);


    if (!pass) {

        return <h2>Free pass not found</h2>;

    }


    return (

        <div className="ticket-page">

            <div className="ticket-card">


                <h1>🎟️ EventWaa Free Pass</h1>


                <h2>{pass.eventTitle}</h2>


                <p>
                    <strong>Pass ID:</strong> {pass.ticketId}
                </p>


                <div className="qr-section">

                    <QRCodeCanvas
                        value={pass.ticketId}
                        size={180}
                    />

                </div>


                <p>
                    <strong>Attendee:</strong> {pass.name}
                </p>


                <p>
                    <strong>Email:</strong> {pass.email}
                </p>


                <p>
                    <strong>Pass Type:</strong> Free Attendance Pass
                </p>


                <p>
                    <strong>Status:</strong>{" "}
                    {pass.checkedIn 
                        ? "Already Checked In"
                        : "Valid"
                    }
                </p>


            </div>

        </div>

    );

}


export default FreePassDetails;