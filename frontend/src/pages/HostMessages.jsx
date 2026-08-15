import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/HostMessages.css";


function HostMessages(){

    const { user } = useAuth();

    const navigate = useNavigate();


    const [messages,setMessages] = useState([]);




    const loadMessages = async()=>{


        if(!user) return;



        const response = await fetch(

            `http://localhost:5000/host-messages/${user.id}`

        );


        const data = await response.json();


        setMessages(data);


    };





    useEffect(()=>{


        loadMessages();



        const interval = setInterval(()=>{

            loadMessages();

        },3000);



        return ()=>clearInterval(interval);



    },[user]);








    const markAsRead = async(messageId)=>{


        await fetch(

            `http://localhost:5000/messages/read/${messageId}`,

            {
                method:"PUT"
            }

        );

    };







    const deleteMessage = async(messageId)=>{


        await fetch(

            `http://localhost:5000/messages/${messageId}`,

            {
                method:"DELETE"
            }

        );


        loadMessages();


    };


    const conversations = Object.values(

    messages.reduce((acc,message)=>{

        const key = message.conversationId;

        if(
            !acc[key] ||
            message.id > acc[key].id
        ){

            acc[key] = message;

        }

        return acc;

    },{})

);









    return(

        <div className="host-messages">


            <h1>
                Inbox
            </h1>



            {
                messages.length === 0 ?


                <p>
                    No messages yet.
                </p>


                :



                conversations.map(message=>(


                    <div

                    key={message.id}

                    className="message-card"

                    >



                        <div className="message-header">


                            <div>


                                <h3>
                                    {message.senderName}
                                </h3>


                            </div>



                            {
                                !message.read &&

                                <span className="unread-badge">

                                    New

                                </span>

                            }



                        </div>





                        <p className="message-text">

                            {message.message}

                        </p>





                        <small>

                            {message.createdAt}

                        </small>







                        <div className="message-actions">


                            <button

                            onClick={async()=>{


                                await markAsRead(message.id);


                                navigate(
                                `/host-chat/${message.senderId}`
                                );


                            }}

                            >

                                Open Chat

                            </button>





                            <button

                            className="delete-button"

                            onClick={()=>
                                deleteMessage(message.id)
                            }

                            >

                                Delete

                            </button>



                        </div>




                    </div>


                ))

            }



        </div>


    );


}



export default HostMessages;