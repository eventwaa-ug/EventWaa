import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/TicketDetails.css";

function AttendancePass() {
  const { attendanceId } = useParams();
  const [pass, setPass] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/attendance/${attendanceId}`)
      .then(res => res.json())
      .then(data => setPass(data))
      .catch(err => console.log(err));
  }, [attendanceId]);

  if (!pass) {
    return <h2>Attendance pass not found</h2>;
  }

  return (
    <div className="ticket-page">
      <div className="ticket-card">
        <h1>Free event pass</h1>
        <h2>{pass.eventTitle}</h2>

        <p><strong>Pass ID:</strong> {pass.passId}</p>

        <div className="qr-section">
          <QRCodeCanvas
            value={`FREE-${pass.passId}`}
            size={180}
          />
        </div>

        <p><strong>Attendee:</strong> {pass.name}</p>
        <p><strong>Email:</strong> {pass.email}</p>

        <p className="valid">Valid free event pass</p>
      </div>
    </div>
  );
}

export default AttendancePass;