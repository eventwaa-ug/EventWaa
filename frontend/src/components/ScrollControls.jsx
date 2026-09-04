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
    Example:
        /events
        /events?city=Gulu
        /events?filter=this-week
        /events?category=Music
    All belong to:
        /events
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
      Example:
        /events
        /events?city=Gulu
      pathname is still /events,
      so nothing is added.
    */
    if (
      getPageKey(currentPath) ===
      getPageKey(previousPath)
    ) {
      return;
    }
    /*
      A REAL PAGE changed.
      Add the previous page to our
      custom history.
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
    BACK TO TOP VISIBILITY
    ============================================================
  */
  useEffect(() => {
    if (isHomePage) {
      setShowTop(false);
      return;
    }
    const handleScroll = () => {
      setShowTop(
        window.scrollY > 400
      );
    };
    handleScroll();
    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true
      }
    );
    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [
    location.pathname,
    isHomePage
  ]);
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
          Hidden on Home
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
            size={22}
            strokeWidth={2.2}
          />
        </button>
      )}
      {/* ======================================================
          BACK TO TOP
          Hidden on Home
      ====================================================== */}
      {!isHomePage && showTop && (
        <button
          type="button"
          className="scroll-top-button"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp
            size={22}
            strokeWidth={2.2}
          />
        </button>
      )}
    </>
  );
}
export default ScrollControls;