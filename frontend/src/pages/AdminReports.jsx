import { useEffect, useState } from "react";
import "./AdminReports.css";
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
function AdminReports(){

    const [reports, setReports] = useState([]);


    useEffect(()=>{

        fetch(`${BACKEND_URL}/admin/event-reports`)
        .then(res => res.json())
        .then(data => {

            setReports(data);

        });

    },[]);



    const dismissReport = async(id)=>{


        await fetch(
            `${BACKEND_URL}/admin/event-reports/${id}/dismiss`,
            {
                method:"PUT"
            }
        );


        setReports(
            reports.map(report =>
                report.id === id
                ?
                {
                    ...report,
                    status:"dismissed"
                }
                :
                report
            )
        );

    };



    const deleteEvent = async(eventId, reportId)=>{


        await fetch(
            `${BACKEND_URL}/events/${eventId}`,
            {
                method:"DELETE"
            }
        );


        await dismissReport(reportId);


        setReports(
            reports.filter(
                report => report.id !== reportId
            )
        );

    };



    return(

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

                reports.map(report=>(

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
                                onClick={()=>
                                    deleteEvent(
                                        report.eventId,
                                        report.id
                                    )
                                }
                                >
                                    Delete Event
                                </button>



                                <button
                                onClick={()=>
                                    dismissReport(report.id)
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