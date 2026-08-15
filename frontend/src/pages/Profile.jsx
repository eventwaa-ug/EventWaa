import {useEffect, useState } from "react";
import "../styles/Profile.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canCreateEvent } from "../utils/hostAccess";

function Profile() {
  const navigate = useNavigate();
  const {user, logout, refreshUser} = useAuth();
  const [tickets, setTickets] = useState([]);
  const [unreadmessages, setUnreadMessages] = useState(0);

  useEffect(() => {

  if(!user) return;


  const loadUnreadMessages = async () => {

    const response = await fetch(
      `http://localhost:5000/messages/unread/${user.id}`
    );

    const data = await response.json();

    setUnreadMessages(data.unread);

  };


  loadUnreadMessages();


  const interval = setInterval(() => {

    loadUnreadMessages();

  }, 3000);


  return () => clearInterval(interval);


}, [user]);

useEffect(()  =>{
  if(user){
    refreshUser();
  }
},[user]);
    
  return (
    <div className="profile-page">

  <div className="profile-header">

    <img
      src="https://via.placeholder.com/120"
      alt="Profile"
      className="profile-image"
    />

    <h2>{user?.name}</h2>

    <p>{user?.email}</p>

  </div>

  <div className="profile-menu">

    <div className="menu-item" 
    onClick={() => navigate("/tickets")}
    >
      <span>🎟️ My Tickets</span>
      <span>›</span>
    </div>

    <div className="menu-item" 
    onClick={() => navigate("/favorites")}
    >
      <span>💚 My Favorites</span>
      <span>›</span>
    </div>

    <div className="menu-item">
    <li onClick={() => navigate("/messages")}>
      <span>
    💬 Messages
      </span>
    {
      unreadmessages > 0 &&
      <span className="notification-count">
        {unreadmessages}
      </span>
    }
    </li>
    </div>

    <div 
className="menu-item"
onClick={() => {
    if(user?.verifiedHost || user?.role ==="host"){
        navigate("/dashboard");
    }else{
        navigate("/host-application");
    }
}}
>

<span>
{
user?.verifiedHost
?
"🎤 Host Dashboard"
:
" 🎤 Become a Host"
}
</span>

<span>›</span>

</div>
    <div className="menu-item"
    onClick={() => navigate("/upcoming")}
    >
      <span>📅 Upcoming Events</span>
      <span>›</span>
    </div>

    <div className="menu-item"
    onClick={() => navigate("/settings")}
    >
      <span>⚙️ Settings</span>
      <span>›</span>
    </div>

    <div className="menu-item logout" 
    onClick={() => {
        logout();
        navigate("/login")
    }}
    >
      <span>🚪 Logout</span>
      <span>›</span>
    </div>

  </div>

</div>
  );
}

export default Profile;