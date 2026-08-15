import { useEffect, useState } from "react";
import "./AdminHostApplications.css";

function HostApplications() {

    const [applications, setApplications] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const fetchApplications = async () => {

        try {

            const response = await fetch(
                "http://localhost:5000/admin/host-applications"
            );

            const data = await response.json();

            setApplications(data);

        } catch(error){

            console.log(error);

        }

    };


    useEffect(() => {

        fetchApplications();

    }, []);



    const approveApplication = async (id) => {

        await fetch(
            `http://localhost:5000/host-applications/${id}/approve`,
            {
                method:"PUT"
            }
        );

        alert("Host approved successfully!");

        fetchApplications();

    };


    const rejectApplication = async (id) => {

        await fetch(
            `http://localhost:5000/host-applications/${id}/reject`,
            {
                method:"PUT"
            }
        );

        alert("Application rejected!");

        fetchApplications();

    };

    const filteredApplications = applications.filter((application)=>{

    const matchesSearch =
    application.fullName
    .toLowerCase()
    .includes(search.toLowerCase())
    ||
    application.email
    .toLowerCase()
    .includes(search.toLowerCase());


    const matchesFilter =
    filter === "all"
    ||
    application.status === filter;


    return matchesSearch && matchesFilter;

});
   const formatDate = (timestamp)=>{

    if(!timestamp) return "Unknown";

    const date = new Date(timestamp * 1000);

    return date.toLocaleString();

};



    return (

        <div className="host-review-page">

            <h1>
                Host Applications
            </h1>

            <div className="application-controls">

                <input

                type="text"

                placeholder="Search by name or email..."

                value={search}

                onChange={(e)=>setSearch(e.target.value)}

                />


                <select

                value={filter}

                onChange={(e)=>setFilter(e.target.value)}

                >

                <option value="all">
                All Applications
                </option>

                <option value="pending">
                Pending
                </option>

                <option value="approved">
                Approved
                </option>

                <option value="rejected">
                Rejected
                </option>


                </select>


                </div>


            {
                applications.length === 0 ?

                (
                    <p>
                        No host applications found.
                    </p>
                )

                :

                filteredApplications.map((application)=>(


                    <div 
                    className="application-card"
                    key={application.id}
                    >


                        <h2>
                            {application.fullName}
                        </h2>


                        <p>
                            Email: {application.email}
                        </p>

                        <p>
                            Submitted:
                            {" "}
                            {formatDate(application.submittedAt)}
                            </p>


                        <p>
                            Phone: {application.phone}
                        </p>


                        <p>
                            Location: {application.location}
                        </p>


                        <p>
                            Previous Events Experience:
                            {" "}
                            {application.hasPreviousEvents ==="yes"
                            ? "Yes"
                              :"No"}
                        </p>


                        <p>
                            Status:

                            {
                            application.status === "pending"
                            ?
                            " 🟡 Pending Review"
                            :
                            application.status === "approved"
                            ?
                            " 🟢 Approved"
                            :
                            " 🔴 Rejected"
                            }

                            </p>


                        <div className="documents">

                            <h3>
                                Documents
                            </h3>


                            <a
                                href={`http://localhost:5000/${application.idFront}`}
                                target="_blank"
                                rel="noreferrer"
                                >

                                <img

                                src={`http://localhost:5000/${application.idFront}`}

                                alt="ID Front"

                                />

                                </a>


                            <a
                                href={`http://localhost:5000/${application.idBack}`}
                                target="_blank"
                                rel="noreferrer"
                                >

                                <img

                                src={`http://localhost:5000/${application.idBack}`}

                                alt="ID Back"

                                />

                                </a>


                            {
                            application.proofImage &&

                            <a
                                href={`http://localhost:5000/${application.proofImage}`}
                                target="_blank"
                                rel="noreferrer"
                                >

                                <img

                                src={`http://localhost:5000/${application.proofImage}`}

                                alt="Event proof"

                                />

                                </a>

                            }


                        </div>



                        {
                        application.status === "pending" &&

                        <div className="actions">

                            <button
                            className="approve"
                            onClick={()=>
                            approveApplication(application.id)}
                            >
                                Approve
                            </button>


                            <button
                            className="reject"
                            onClick={()=>
                            rejectApplication(application.id)}
                            >
                                Reject
                            </button>

                        </div>

                        }


                    </div>


                ))

            }


        </div>

    );

}


export default HostApplications;