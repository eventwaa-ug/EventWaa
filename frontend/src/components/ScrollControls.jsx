import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ScrollControls.css";

function ScrollControls() {

    const navigate = useNavigate();

    const [showTop, setShowTop] = useState(false);
    const [canGoBack, setCanGoBack] = useState(false);


    // ============================================================
    // CHECK SCROLL + BROWSER HISTORY
    // ============================================================

    useEffect(() => {

        const handleScroll = () => {

            setShowTop(window.scrollY > 400);

        };


        // Browser history

        setCanGoBack(window.history.length > 1);


        window.addEventListener(
            "scroll",
            handleScroll
        );


        return () => {

            window.removeEventListener(
                "scroll",
                handleScroll
            );

        };

    }, []);


    // ============================================================
    // BACK TO TOP
    // ============================================================

    const scrollToTop = () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


    // ============================================================
    // GO BACK
    // ============================================================

    const goBack = () => {

        if (window.history.length > 1) {

            navigate(-1);

        }

    };


    return (

        <div className="scroll-controls">

            {/* ====================================================
                BACK BUTTON
            ==================================================== */}

            {canGoBack && (

                <button
                    type="button"
                    className="scroll-back-button"
                    onClick={goBack}
                    aria-label="Go back"
                    title="Go back"
                >
                    ←
                </button>

            )}


            {/* ====================================================
                BACK TO TOP
            ==================================================== */}

            {showTop && (

                <button
                    type="button"
                    className="scroll-top-button"
                    onClick={scrollToTop}
                    aria-label="Back to top"
                    title="Back to top"
                >
                    ↑
                </button>

            )}

        </div>

    );

}

export default ScrollControls;