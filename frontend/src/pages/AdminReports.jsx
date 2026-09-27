import { useEffect, useState } from "react";
import "./AdminReports.css";
import { adminFetch } from "../utils/adminAPI";

function AdminReports() {

    const [reports, setReports] = useState([]);

    useEffect(() => {

        loadReports();

    }, []);

    const loadReports = async () => {

        try {

            const data =
                await adminFetch(
                    "/admin/event-reports"
                );

            setReports(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.reports)
                        ? data.reports
                        : []
            );

        } catch (error) {

            console.error(
                "ADMIN REPORTS LOAD ERROR:",
                error
            );

            setReports([]);

        }

    };

    const dismissReport = async (id) => {

        try {

            await adminFetch(
                `/admin/event-reports/${id}/dismiss`,
                {
                    method: "PUT"
                }
            );

            setReports(
                reports.map(report =>
                    report.id === id
                        ? {
                            ...report,
                            status: "dismissed"
                        }
                        : report
                )
            );

        } catch (error) {

            console.error(
                "ADMIN REPORT DISMISS ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to dismiss report."
            );

        }

    };

    const deleteEvent = async (
        eventId,
        reportId
    ) => {

        try {

            await adminFetch(
                `/events/${eventId}`,
                {
                    method: "DELETE"
                }
            );

            await dismissReport(reportId);

            setReports(
                reports.filter(
                    report => report.id !== reportId
                )
            );

        } catch (error) {

            console.error(
                "ADMIN EVENT DELETE ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to delete event."
            );

        }

    };

    return (

        <div className="admin-reports">

            <h1>
                Event Reports
            </h1>

            {
                reports.length === 0 ?

                <p>
                    No reports yet.
                </p>

                :

                reports.map(report => (

                    <div
                        className="report-card"
                        key={report.id}
                    >

                        <h2>
                            {report.eventTitle}
                        </h2>

                        <p>
                            <strong>
                                Reason:
                            </strong>

                            {" "}

                            {report.reason}
                        </p>

                        <p>
                            <strong>
                                Reported by:
                            </strong>

                            {" "}

                            {report.reportedBy}
                        </p>

                        <p>
                            <strong>
                                Status:
                            </strong>

                            {" "}

                            {report.status}
                        </p>

                        {
                            report.status === "pending" &&

                            <div className="report-actions">

                                <button
                                    onClick={() =>
                                        deleteEvent(
                                            report.eventId,
                                            report.id
                                        )
                                    }
                                >
                                    Delete Event
                                </button>

                                <button
                                    onClick={() =>
                                        dismissReport(
                                            report.id
                                        )
                                    }
                                >
                                    Dismiss
                                </button>

                            </div>

                        }

                    </div>

                ))

            }

        </div>

    );

}

export default AdminReports;