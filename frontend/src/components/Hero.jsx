import "./Hero.css";
import {motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { canCreateEvent } from "../utils/hostAccess";

function Hero( {handleExploreEvents}) {
    const navigate = useNavigate();

const { user, refreshUser } = useAuth();

useEffect(()=>{
    if(user){
        refreshUser();
    }
},[user?.email]);


const handleHostEvent = () => {

    if(!user){

        navigate("/login", {
            state:{
                from:"/host-application"
            }
        });

    }
    else if(user.verifiedHost){

        navigate("/dashboard");

    }
    else{

        navigate("/host-application");

    }


};
    
    return (
        <motion.section 
        className="hero"
        initial={{opacity:0, y: 40}}
        animate={{opacity:1, y: 0}}
        transition={{duration: 0.8}}  
        >
            <div className="hero-content">
                <h1>
                    Discover.
                    <span> Connect.</span>
                    <span> Experience.</span>
                </h1>

                <p>
                    Finds concerts, picnics, workshop,
                    sports events and unforgettable
                    experiences around you.
                </p>

                <div className="hero-button">
                    <button className="primary-btn"
                    onClick={handleExploreEvents}>
                        Explore Events
                    </button>

                    <button 
                    className="secondary-btn" 
                    onClick={handleHostEvent}
                    >
                        <span>
                        {
                        user?.verifiedHost
                        ?
                        "🎤 Host Dashboard"
                        :
                        "🚀 Become a Host"
                        }
                        </span>

                        <span>›</span>
                                
                    </button>
                </div>
            </div>
        </motion.section>
    );
}
export default Hero;