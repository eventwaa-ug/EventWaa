import { useState, useEffect} from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import "../styles/TicketScanner.css";
import { useParams } from "react-router-dom";

function TicketScanner() {

  const { id } = useParams();

  const [result, setResult] = useState("");
  const [message, setMessage] = useState({});
  const [isScanning, setIsScanning] = useState(true);

  useEffect(()=>{

    if(!id) return;


    const loadAttendance = async()=>{


        try{


            const paidResponse = await fetch(
                `http://localhost:5000/bookings/event/${id}`
            );


            const freeResponse = await fetch(
                `http://localhost:5000/attendance/event/${id}`
            );


            const paidTickets = await paidResponse.json();

            const freePasses = await freeResponse.json();



            const paidCount = paidTickets.reduce(

                (total,ticket)=>
                total + Number(ticket.quantity || 1),

                0

            );



            const checkedPaid = paidTickets.filter(

                ticket=>ticket.checkedIn === true

            ).length;



            const checkedFree = freePasses.filter(

                pass=>pass.checkedIn === true

            ).length;



            const total =
                paidCount + freePasses.length;



            const checked =
                checkedPaid + checkedFree;



            setStats({

                totalTickets: total,

                checkedIn: checked,

                remaining: total - checked,

                invalid:0

            });



        }catch(error){

            console.log(error);

        }


    };


    loadAttendance();


},[id]);

  const [stats, setStats] = useState({

    totalTickets:0,

    checkedIn:0,

    remaining:0,

    invalid:0

    });



  const resetScanner = () => {

    setResult("");

    setMessage({});

    setIsScanning(true);

  };



  const verifyTicket = async (code) => {

    setResult(code);


    setStats(prev => ({

      ...prev,

      total: prev.total + 1

    }));



    try {


      const response = await fetch(

        `http://localhost:5000/verify-entry/${code}`,

        {

          method:"PUT",

          headers:{

            "Content-Type":"application/json"

          },

          body:JSON.stringify({

            eventId:id

          })

        }

      );



      const data = await response.json();



      if(data.success){


        setStats(prev => ({

          ...prev,

          checkedIn: prev.checkedIn + 1

        }));



        if(data.type === "paid"){


          setMessage({

            success:true,

            type:"paid",

            guest:{

              name:data.ticket.buyer.name,

              email:data.ticket.buyer.email,

              event:data.ticket.eventTitle,

              passType:data.ticket.ticketType,

              time:data.ticket.checkedInAt

            }

          });



        }else{


          setMessage({

            success:true,

            type:"free",

            guest:{

              name:data.attendee.name,

              email:data.attendee.email,

              event:data.attendee.eventTitle,

              passType:"Free attendance pass",

              time:data.attendee.checkedInAt

            }

          });


        }



      }else{


        setStats(prev => ({

          ...prev,

          invalid: prev.invalid + 1

        }));


        setMessage({

          success:false,

          text:data.message

        });


      }



    }catch(error){


      console.log(error);


      setStats(prev => ({

        ...prev,

        invalid:prev.invalid + 1

      }));


      setMessage({

        success:false,

        text:"Server error"

      });


    }


  };




  return (

    <div className="scanner-page">


      <h1>
        EventWaa Ticket Scanner
      </h1>


      <p>
        Scan attendee QR code
      </p>



      <div className="scanner-stats">


        <div>

        <h3>
        🎟️ Total
        </h3>

        <strong>
        {stats.totalTickets}
        </strong>

        </div>


        <div>

        <h3>
        ✅ Checked In
        </h3>

        <strong>
        {stats.checkedIn}
        </strong>

        </div>


        <div>

        <h3>
        ⏳ Remaining
        </h3>

        <strong>
        {stats.remaining}
        </strong>

        </div>


        <div>

        <h3>
        ❌ Invalid
        </h3>

        <strong>
        {stats.invalid}
        </strong>

        </div>


      </div>




      {isScanning && (

      <div className="scanner-box">

        <Scanner

          onScan={(codes)=>{


            if(!isScanning) return;


            if(codes.length > 0){


              setIsScanning(false);


              verifyTicket(
                codes[0].rawValue
              );


            }


          }}


          onError={(error)=>console.log(error)}

        />

      </div>

      )}






      {result && (

      <div className="scan-result">


        <p>
          🆔 Pass ID:

          <strong>
            {result}
          </strong>

        </p>




        {message?.success ? (


        <div className="valid-ticket">


          <h2>

          ✅ VALID {message.type === "free" ? "PASS" : "TICKET"}

          </h2>




          <p>

          🎟️ Event:

          <strong>
            {message.guest.event}
          </strong>

          </p>




          <p>

          👤 Guest:

          <strong>
            {message.guest.name}
          </strong>

          </p>




          <p>

          📧 Email:

          <strong>
            {message.guest.email}
          </strong>

          </p>




          <p>

          🎫 Type:

          <strong>
            {message.guest.passType}
          </strong>

          </p>




          <p>

          ⏰ Time:

          <strong>
            {message.guest.time}
          </strong>

          </p>



        </div>



        ):(



        <div className="invalid-ticket">


          <h2>
            ❌ {message.text}
          </h2>


        </div>


        )}






        <button

        className="scan-next-btn"

        onClick={resetScanner}

        >

        🔄 Scan Next

        </button>




      </div>

      )}



    </div>

  );


}


export default TicketScanner;