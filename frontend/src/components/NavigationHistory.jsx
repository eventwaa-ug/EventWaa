import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";


function NavigationHistory() {

  const location = useLocation();

  const historyRef = useRef([]);


  useEffect(() => {

    const currentPath =
      location.pathname;


    if (
      historyRef.current.length === 0
    ) {

      historyRef.current = [
        currentPath
      ];

      window.__eventwaaNavigationHistory =
        historyRef.current;

      return;

    }


    const lastPath =
      historyRef.current[
        historyRef.current.length - 1
      ];


    /*
      Ignore query-string changes.

      /events
      /events?city=Gulu
      /events?category=Music

      are all treated as /events.
    */

    if (
      lastPath === currentPath
    ) {

      return;

    }


    historyRef.current = [
      ...historyRef.current,
      currentPath
    ];


    window.__eventwaaNavigationHistory =
      historyRef.current;


  }, [
    location.pathname
  ]);


  return null;

}


export default NavigationHistory;