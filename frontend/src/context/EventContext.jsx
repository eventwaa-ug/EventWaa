import { createContext, useEffect, useState } from "react";

export const EventContext = createContext();


export function EventProvider({ children }) {

  const [events, setEvents] = useState([]);
  useEffect(() => {
    fetchEvents();
}, []);


const fetchEvents = async () => {
  try {
    const response = await fetch("http://localhost:5000/events");
    const data = await response.json();

    // Maintenance mode
    if (response.status === 503 && (data.maintenanceMode || data.maintenance)) {
      setEvents([]);
      return;
    }

    // Other errors
    if (!response.ok) {
      setEvents([]);
      return;
    }

    setEvents(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Network error fetching events", error);
    setEvents([]);
  }
};

  // Add new event
  const addEvent = (newEvent) => {
    setEvents((prevEvents) => [
      ...prevEvents,
      newEvent
    ]);
  };


  // Delete event
  const deleteEvent = async (id) => {

    await fetch(
        `http://localhost:5000/events/${id}`,
        {
            method: "DELETE"
        }
    );


    setEvents((prevEvents) =>
        prevEvents.filter(
            (event) => event.id !== id
        )
    );

};

  // update event
  const updateEvent = (updatedEvent) => {
  setEvents((prevEvents) =>
    prevEvents.map((event) =>
      event.id === updatedEvent.id
        ? updatedEvent
        : event
    )
  );
};




  return (
    <EventContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent
      }}
    >
      {children}
    </EventContext.Provider>
  );
}