import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/ChatWithHost.css";


function ChatWithHost(){

    const { hostId } = useParams();

    const navigate = useNavigate();

    const { user } = useAuth();


    const [host, setHost] = useState(null);

    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState([]);

    const messagesEndRef = useRef(null);



    const conversationId =
        Number(user?.id) < Number(hostId)
        ? `${user?.id}-${hostId}`
        : `${hostId}-${user?.id}`;




    // Auto scroll
    useEffect(()=>{

        if(messagesEndRef.current){

            messagesEndRef.current.scrollIntoView({
                behavior:"smooth"
            });

        }

    },[messages]);





    // Load host details

    useEffect(()=>{


        fetch("http://localhost:5000/users")

        .then(res=>res.json())

        .then(users=>{


            const foundHost = users.find(
                item =>
                String(item.id) === String(hostId)
            );


            setHost(foundHost);


        });


    },[hostId]);






    // Load messages

    const loadMessages = async()=>{


        if(!user) return;


        const response = await fetch(

            `http://localhost:5000/messages/${conversationId}`

        );


        const data = await response.json();


        setMessages(data);


    };





    useEffect(()=>{


        if(!user) return;


        loadMessages();



        const interval = setInterval(()=>{

            loadMessages();

        },3000);



        return ()=>clearInterval(interval);



    },[user, hostId]);







    // Send message

    const sendMessage = async()=>{


        if(!user){

            alert("Please login first");

            navigate("/login");

            return;

        }



        if(!message.trim()){

            return;

        }



        try{


            const response = await fetch(

                "http://localhost:5000/messages",

                {

                    method:"POST",


                    headers:{

                        "Content-Type":"application/json"

                    },


                    body:JSON.stringify({

                    conversationId,

                    senderId:user.id,

                    senderName:user.name,

                    senderRole:"customer",

                    receiverId:Number(hostId),

                    receiverName:host?.name,

                    hostId:Number(hostId),

                    message:message

                })

                }

            );



            const data = await response.json();



            console.log(
                "MESSAGE RESPONSE:",
                data
            );



            if(data.success){


                setMessage("");

                loadMessages();


            }



        }catch(error){


            console.log(
                "SEND MESSAGE ERROR:",
                error
            );


        }



    };







    if(!host){

        return (

            <h2>
                Loading host...
            </h2>

        );

    }







    return (

        <div className="chat-page">


            <div className="chat-container">



                <div className="chat-header">


                    <h2>
                        {host.name}
                    </h2>



                    {
                        host.verifiedHost &&

                        <span className="verified">

                            ✅ Verified Host

                        </span>

                    }


                </div>






                <div className="messages-area">



                    {
                        messages.length === 0 ?


                        <p className="empty-chat">

                            Start conversation with {host.name}

                        </p>



                        :



                        messages.map(msg=>(



                            <div

                            key={msg.id}


                            className={

                                String(msg.senderId)
                                ===
                                String(user.id)

                                ?

                                "chat-bubble mine"

                                :

                                "chat-bubble"

                            }


                            >



                                <p>

                                    {msg.message}

                                </p>



                                <small>

                                    {msg.createdAt}

                                </small>



                            </div>



                        ))

                    }



                    <div ref={messagesEndRef}></div>



                </div>







                <div className="chat-input">



                    <textarea


                    value={message}


                    onChange={
                        (e)=>
                        setMessage(e.target.value)
                    }


                    placeholder="Type your message..."


                    />




                    <button

                    onClick={sendMessage}

                    >

                        Send

                    </button>



                </div>




            </div>



        </div>

    );

}



export default ChatWithHost;