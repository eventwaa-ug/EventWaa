import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/UserMessages.css";


function UserMessages(){

    const { user } = useAuth();

    const navigate = useNavigate();

    const [conversations,setConversations] = useState([]);



    const loadMessages = async()=>{

        if(!user) return;


        const response = await fetch(
            `http://localhost:5000/messages/user/${user.id}`
        );


        const data = await response.json();


        const grouped = {};


        data.forEach(message=>{


            const key = message.conversationId;


            if(
                !grouped[key] ||
                message.id > grouped[key].id
            ){

                grouped[key] = message;

            }


        });


        setConversations(
            Object.values(grouped)
        );


    };



    useEffect(()=>{


        loadMessages();


        const interval = setInterval(()=>{

            loadMessages();

        },3000);



        return ()=>clearInterval(interval);



    },[user]);





    const openChat = (message)=>{


        const hostId =

        String(message.senderId)
        ===
        String(user.id)

        ?

        message.receiverId

        :

        message.senderId;



        navigate(
            `/host-chat/${hostId}`
        );


    };





    const deleteMessage = async(id)=>{


        await fetch(
            `http://localhost:5000/messages/${id}`,
            {
                method:"DELETE"
            }
        );


        setConversations(prev=>

            prev.filter(
                message =>
                message.id !== id
            )

        );


    };





    return(


        <div className="user-messages-page">


            <h1>
                💬 My Messages
            </h1>



            {
            conversations.length === 0 ?


            <p className="empty-message">
                No conversations yet.
            </p>



            :



            conversations.map(message=>(


            <div
            key={message.id}
            className="message-card"
            >



                <div className="message-avatar">

                    💬

                </div>





                <div className="message-content">



                    <div className="message-header">


                        <h3>

                        {
                        String(message.senderId)
                        ===
                        String(user.id)

                        ?

                        message.receiverName

                        :

                        message.senderName

                        }

                        </h3>



                        {
                        message.read === false &&

                        String(message.receiverId)
                        ===
                        String(user.id)

                        &&

                        <span className="new-badge">

                            New

                        </span>

                        }


                    </div>





                    <p>

                        {message.message}

                    </p>




                    <small>

                        {message.createdAt}

                    </small>





                    <div className="message-actions">


                        <button

                        className="open-chat-btn"

                        onClick={()=>
                            openChat(message)
                        }

                        >

                            💬 Open Chat

                        </button>





                        <button

                        className="delete-message-btn"

                        onClick={()=>
                            deleteMessage(message.id)
                        }

                        >

                            🗑️ Delete

                        </button>



                    </div>




                </div>



            </div>


            ))

            }



        </div>


    );

}


export default UserMessages;