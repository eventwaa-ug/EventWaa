import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/AttendancePass.css";

function AttendancePass() {
  const { attendanceId } = useParams();

  const [pass, setPass] = useState(null);

  useEffect(() => {
    const loadPass = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/attendance/${attendanceId}`
        );

        const data = await response.json();

        setPass(data);
      } catch (error) {
        console.error(
          "ATTENDANCE PASS ERROR:",
          error
        );
      }
    };

    loadPass();
  }, [attendanceId]);

  // =========================================================
  // LOADING / NOT FOUND
  // =========================================================

  if (!pass) {
    return (
      <div className="attendance-pass-page">
        <div className="attendance-pass-card">
          <h2>
            Attendance pass not found
          </h2>

          <p>
            This free event pass could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-pass-page">

      <div className="attendance-pass-card">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="attendance-pass-header">

          <span className="attendance-pass-badge">
            FREE EVENT
          </span>

          <h1>
            Free Event Pass
          </h1>

          <h2>
            {pass.eventTitle}
          </h2>

        </div>


        {/* ===================================================
            PASS ID
        =================================================== */}

        <div className="attendance-pass-id">

          <span>
            Pass ID
          </span>

          <strong>
            {pass.passId}
          </strong>

        </div>


        {/* ===================================================
            QR CODE
        =================================================== */}

        <div className="attendance-qr-section">

          <div className="attendance-qr-wrapper">

            <QRCodeCanvas
              value={`FREE-${pass.passId}`}
              size={200}
              level="M"
            />

          </div>

          <p className="attendance-qr-instruction">
            Show this QR code at the entrance
          </p>

        </div>


        {/* ===================================================
            ATTENDEE INFORMATION
        =================================================== */}

        <div className="attendance-pass-details">

          <div className="attendance-detail">

            <span>
              Attendee
            </span>

            <strong>
              {pass.name}
            </strong>

          </div>


          <div className="attendance-detail">

            <span>
              Email
            </span>

            <strong>
              {pass.email}
            </strong>

          </div>

        </div>


        {/* ===================================================
            STATUS
        =================================================== */}

        <div className="attendance-pass-status">

          <span className="status-icon">
            ✓
          </span>

          <div>

            <strong>
              Valid free event pass
            </strong>

            <p>
              This pass is valid for entry to the event.
            </p>

          </div>

        </div>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="attendance-pass-footer">

          <span>
            EventWaa
          </span>

          <span>
            Free attendance
          </span>

        </div>

      </div>

    </div>
  );
}

export default AttendancePass;