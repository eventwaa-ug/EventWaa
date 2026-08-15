import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/HostChat.css";


function HostChat(){

    const { user } = useAuth();

    const { userId } = useParams();


    const [messages,setMessages] = useState([]);

    const [reply,setReply] = useState("");

    const messagesEndRef = useRef(null);



    const conversationId =
        Number(userId) < Number(user.id)
        ? `${userId}-${user.id}`
        : `${user.id}-${userId}`;



    // Auto scroll

    useEffect(()=>{

        if(messagesEndRef.current){

            messagesEndRef.current.scrollIntoView({
                behavior:"smooth"
            });

        }

    },[messages]);






    // Load messages

    const loadMessages = async()=>{

    if(!user) return;


    const response = await fetch(
        `http://localhost:5000/messages/${conversationId}`
    );


    const data = await response.json();


    setMessages(data);


    // Mark received messages as read
    for(const msg of data){

        if(
            String(msg.receiverId) === String(user.id)
            &&
            msg.read === false
        ){

            await fetch(
                `http://localhost:5000/messages/read/${msg.id}`,
                {
                    method:"PUT"
                }
            );

        }

    }

};




    useEffect(()=>{


        if(!user) return;


        loadMessages();



        const interval = setInterval(()=>{

            loadMessages();

        },3000);



        return ()=>clearInterval(interval);



    },[user,userId]);









    // Send host reply

    const sendReply = async()=>{


        if(!reply.trim()) return;



        await fetch(

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


                    receiverId:Number(userId),

                    receiverName:"Customer",


                    message:reply


                })


            }

        );



        setReply("");


        loadMessages();


    };

    const markConversationAsRead = async () => {

    const unreadMessages = messages.filter(
        msg =>
        String(msg.receiverId) === String(user.id)
        &&
        msg.read === false
    );


    for(const msg of unreadMessages){

        await fetch(
            `http://localhost:5000/messages/read/${msg.id}`,
            {
                method:"PUT"
            }
        );

    }

};








    return(

        <div className="host-chat-page">


            <div className="host-chat-container">



                <h2>
                    Customer Chat
                </h2>





                <div className="host-chat-messages">


                    {
                        messages.length === 0 ?

                        <p>
                            No messages yet.
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

                                "host-message"

                                :

                                "customer-message"

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






                <div className="host-chat-input">



                    <textarea


                    value={reply}


                    onChange={
                        (e)=>
                        setReply(e.target.value)
                    }


                    placeholder="Reply to customer..."


                    />




                    <button

                    onClick={sendReply}

                    >

                        Send

                    </button>



                </div>





            </div>



        </div>


    );


}



export default HostChat;