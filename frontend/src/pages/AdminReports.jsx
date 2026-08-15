import { useEffect, useState } from "react";
import "./AdminReports.css";

function AdminReports(){

    const [reports, setReports] = useState([]);


    useEffect(()=>{

        fetch("http://localhost:5000/admin/event-reports")
        .then(res => res.json())
        .then(data => {

            setReports(data);

        });

    },[]);



    const dismissReport = async(id)=>{


        await fetch(
            `http://localhost:5000/admin/event-reports/${id}/dismiss`,
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
            `http://localhost:5000/events/${eventId}`,
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