import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp
} from "lucide-react";
import "./ScrollControls.css";
function ScrollControls() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTop, setShowTop] = useState(false);
  /*
    ============================================================
    PAGE HISTORY
    We track real pages ourselves instead of using:
        navigate(-1)
    This prevents query/filter changes from becoming
    Back-button history entries.
  */
  const pageHistoryRef = useRef([]);
  const previousPathRef = useRef(
    location.pathname
  );
  /*
    ============================================================
    PAGE GROUP
    Query parameters do NOT create a new page.
  */
  const getPageKey = (pathname) => {
    return pathname;
  };
  /*
    ============================================================
    TRACK REAL PAGE CHANGES
    ============================================================
  */
  useEffect(() => {
    const currentPath =
      location.pathname;
    const previousPath =
      previousPathRef.current;
    /*
      First page load.
    */
    if (
      pageHistoryRef.current.length === 0
    ) {
      pageHistoryRef.current = [
        currentPath
      ];
      previousPathRef.current =
        currentPath;
      return;
    }
    /*
      Ignore query-string changes.
    */
    if (
      getPageKey(currentPath) ===
      getPageKey(previousPath)
    ) {
      return;
    }
    /*
      A REAL PAGE changed.
      Add the previous page to custom history.
    */
    pageHistoryRef.current.push(
      previousPath
    );
    previousPathRef.current =
      currentPath;
  }, [location.pathname]);
  /*
    ============================================================
    HOME PAGE
    ============================================================
  */
  const isHomePage =
    location.pathname === "/" ||
    location.pathname === "";
  /*
    ============================================================
    SHOW UP ARROW ONLY AT THE BOTTOM
    ============================================================
  */
  useEffect(() => {
    /*
      Reset the button whenever the user
      navigates to another page.
    */
    setShowTop(false);
    const handleScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;
      const viewportHeight =
        window.innerHeight;
      const documentHeight =
        document.documentElement.scrollHeight;
      /*
        Small tolerance prevents the button
        from failing to appear because of
        fractional pixels on some devices.
      */
      const distanceFromBottom =
        documentHeight -
        (scrollTop + viewportHeight);
      /*
        Show only when the user has reached
        the bottom of the page.
      */
      setShowTop(
        distanceFromBottom <= 10
      );
    };
    /*
      Check initial position.
    */
    handleScroll();
    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true
      }
    );
    window.addEventListener(
      "resize",
      handleScroll
    );
    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
      window.removeEventListener(
        "resize",
        handleScroll
      );
    };
  }, [location.pathname]);
  /*
    ============================================================
    BACK TO TOP
    ============================================================
  */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  /*
    ============================================================
    GO BACK
    ============================================================
  */
  const goBack = () => {
    const history =
      pageHistoryRef.current;
    /*
      Remove the current page's previous
      history entry and navigate to it.
    */
    if (history.length > 1) {
      const previousPage =
        history.pop();
      /*
        Update the current page reference
        before navigating.
      */
      previousPathRef.current =
        previousPage;
      navigate(previousPage);
      return;
    }
    /*
      No custom history available.
      Safely return Home.
    */
    navigate("/");
  };
  /*
    ============================================================
    RENDER
    ============================================================
  */
  return (
    <>
      {/* ======================================================
          BACK BUTTON
          Hidden only on Home
      ====================================================== */}
      {!isHomePage && (
        <button
          type="button"
          className="scroll-back-button"
          onClick={goBack}
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft
            size={19}
            strokeWidth={2}
          />
        </button>
      )}
      {/* ======================================================
          BACK TO TOP
          Appears only at the bottom
      ====================================================== */}
      {showTop && (
        <button
          type="button"
          className="scroll-top-button"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp
            size={20}
            strokeWidth={2.2}
          />
        </button>
      )}
    </>
  );
}
export default ScrollControls;