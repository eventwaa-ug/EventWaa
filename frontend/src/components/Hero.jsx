import "./Hero.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FaArrowRight, FaMicrophone } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { canCreateEvent } from "../utils/hostAccess";
function Hero({ handleExploreEvents }) {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    // ============================================================
    // REFRESH USER
    // ============================================================
    useEffect(() => {
        if (user) {
            refreshUser();
        }
    }, [user?.email]);
    // ============================================================
    // HOST EVENT
    // ============================================================
    const handleHostEvent = () => {
        if (!user) {
            navigate("/login", {
                state: {
                    from: "/host-application"
                }
            });
        }
        else if (user.verifiedHost) {
            navigate("/dashboard");
        }
        else {
            navigate("/host-application");
        }
    };
    // ============================================================
    // RENDER
    // ============================================================
    return (
        <motion.section
            className="hero"
            initial={{
                opacity: 0,
                y: 35
            }}
            animate={{
                opacity: 1,
                y: 0
            }}
            transition={{
                duration: 0.8,
                ease: "easeOut"
            }}
        >
            <div className="hero-content">
                {/* ==================================================
                    SMALL LABEL
                ================================================== */}
                <div className="hero-kicker">
                    <span className="hero-kicker-dot"></span>
                    Discover what's happening around you
                </div>
                {/* ==================================================
                    TITLE
                ================================================== */}
                <h1>
                    Discover.
                    <span> Connect.</span>
                    <span> Experience.</span>
                </h1>
                {/* ==================================================
                    DESCRIPTION
                ================================================== */}
                <p>
                    Find concerts, picnics, workshops,
                    sports events and unforgettable
                    experiences around you.
                </p>
                {/* ==================================================
                    BUTTONS
                ================================================== */}
                <div className="hero-button">
                    {/* ==================================================
                        EXPLORE
                    ================================================== */}
                    <button
                        className="primary-btn"
                        type="button"
                        onClick={handleExploreEvents}
                    >
                        <span>
                            Explore Events
                        </span>
                        <FaArrowRight
                            className="hero-button-icon"
                        />
                    </button>
                    {/* ==================================================
                        HOST
                    ================================================== */}
                    <button
                        className="secondary-btn"
                        type="button"
                        onClick={handleHostEvent}
                    >
                        <FaMicrophone
                            className="host-icon"
                        />
                        <span>
                            {
                                user?.verifiedHost
                                    ? "Host Dashboard"
                                    : "Become a Host"
                            }
                        </span>
                        <FaArrowRight
                            className="hero-button-icon"
                        />
                    </button>
                </div>
            </div>
        </motion.section>
    );
}
export default Hero;