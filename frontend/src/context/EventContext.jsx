import { createContext, useEffect, useState } from "react";

export const EventContext = createContext();

export function EventProvider({ children }) {

    const [events, setEvents] = useState([]);

    // ============================================================
    // LOAD EVENTS
    // ============================================================

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {

        try {

            const response = await fetch(
                "http://localhost:5000/events"
            );

            const data = await response.json();

            // ====================================================
            // MAINTENANCE MODE
            // ====================================================

            if (
                response.status === 503 &&
                (
                    data.maintenanceMode ||
                    data.maintenance
                )
            ) {

                setEvents([]);

                return;
            }

            // ====================================================
            // OTHER ERRORS
            // ====================================================

            if (!response.ok) {

                setEvents([]);

                return;
            }

            setEvents(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {

            console.error(
                "Network error fetching events",
                error
            );

            setEvents([]);
        }
    };


    // ============================================================
    // ADD EVENT
    // ============================================================

    const addEvent = (newEvent) => {

        setEvents((previousEvents) => [

            ...previousEvents,

            newEvent

        ]);
    };


    // ============================================================
    // DELETE EVENT
    // ============================================================

    const deleteEvent = async (id) => {

        try {

            const response = await fetch(
                `http://localhost:5000/events/${id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {

                console.error(
                    "Failed to delete event."
                );

                return;
            }

            setEvents((previousEvents) =>
                previousEvents.filter(
                    (event) =>
                        Number(event.id) !== Number(id)
                )
            );

        } catch (error) {

            console.error(
                "Delete event error:",
                error
            );
        }
    };


    // ============================================================
    // UPDATE EVENT
    // ============================================================

    const updateEvent = (updatedEvent) => {

        if (!updatedEvent) {
            return;
        }

        setEvents((previousEvents) =>

            previousEvents.map((event) =>

                Number(event.id) ===
                Number(updatedEvent.id)

                    ? {
                        ...event,
                        ...updatedEvent
                    }

                    : event
            )
        );
    };


    // ============================================================
    // PROVIDER
    // ============================================================

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