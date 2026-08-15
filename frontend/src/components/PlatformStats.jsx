import { useEffect, useState } from "react";
import {
  FaCalendarCheck,
  FaUsers,
  FaTicketAlt,
  FaStar
} from "react-icons/fa";

import "./PlatformStats.css";

const API_URL = "http://localhost:5000";

function PlatformStats() {

  const [stats, setStats] = useState({
    events: 0,
    members: 0,
    tickets: 0,
    rating: 0
  });

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const fetchStats = async () => {

      try {

        setLoading(true);


        // ==========================================
        // LOAD EVENTS
        // ==========================================

        const eventsResponse =
          await fetch(`${API_URL}/events`);

        const eventsData =
          await eventsResponse.json();


        // ==========================================
        // LOAD USERS
        // ==========================================

        const usersResponse =
          await fetch(`${API_URL}/users`);

        const usersData =
          await usersResponse.json();


        // ==========================================
        // LOAD BOOKINGS
        // ==========================================

        const bookingsResponse =
          await fetch(`${API_URL}/bookings`);

        const bookingsData =
          await bookingsResponse.json();


        // ==========================================
        // LOAD REVIEWS
        // ==========================================

        const reviewsResponse =
          await fetch(`${API_URL}/reviews`);

        const reviewsData =
          await reviewsResponse.json();


        // ==========================================
        // NORMALIZE DATA
        // ==========================================

        const events = Array.isArray(eventsData)
          ? eventsData
          : eventsData.events || [];


        const users = Array.isArray(usersData)
          ? usersData
          : usersData.users || [];


        const bookings = Array.isArray(bookingsData)
          ? bookingsData
          : bookingsData.bookings || [];


        const reviews = Array.isArray(reviewsData)
          ? reviewsData
          : reviewsData.reviews || [];


        // ==========================================
        // TOTAL EVENTS
        // ==========================================

        const totalEvents = events.length;


        // ==========================================
        // TOTAL COMMUNITY MEMBERS
        // ==========================================

        const totalMembers = users.length;


        // ==========================================
        // TOTAL TICKETS
        // ==========================================

        const totalTickets = bookings.reduce(
          (total, booking) => {

            const quantity =
              Number(booking.quantity) || 1;

            return total + quantity;

          },
          0
        );


        // ==========================================
        // AVERAGE RATING
        // ==========================================

        let averageRating = 0;


        if (reviews.length > 0) {

          const totalRating =
            reviews.reduce(
              (total, review) => {

                return (
                  total +
                  (Number(review.rating) || 0)
                );

              },
              0
            );


          averageRating =
            totalRating / reviews.length;

        }


        // ==========================================
        // UPDATE STATS
        // ==========================================

        setStats({

          events: totalEvents,

          members: totalMembers,

          tickets: totalTickets,

          rating: averageRating

        });


      } catch (error) {

        console.error(
          "PLATFORM STATS ERROR:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


    fetchStats();

  }, []);


  return (

    <section className="platform-stats">


      <div className="stats-header">

        <h2>
          Our Growing Community
        </h2>

        <p>
          Every event brings people together.
          Here's how our community is growing.
        </p>

      </div>


      <div className="stats-grid">


        {/* EVENTS */}

        <div className="stat-card">

          <span className="stat-icon">
            <FaCalendarCheck />
          </span>

          <h3>

            {loading
              ? "..."
              : stats.events}

          </h3>

          <p>
            Events Available
          </p>

        </div>


        {/* MEMBERS */}

        <div className="stat-card">

          <span className="stat-icon">
            <FaUsers />
          </span>

          <h3>

            {loading
              ? "..."
              : stats.members}

          </h3>

          <p>
            Community Members
          </p>

        </div>


        {/* TICKETS */}

        <div className="stat-card">

          <span className="stat-icon">
            <FaTicketAlt />
          </span>

          <h3>

            {loading
              ? "..."
              : stats.tickets}

          </h3>

          <p>
            Tickets Booked
          </p>

        </div>


        {/* RATING */}

        <div className="stat-card">

          <span className="stat-icon">
            <FaStar />
          </span>

          <h3>

            {loading
              ? "..."
              : stats.rating.toFixed(1)}

          </h3>

          <p>
            Average Rating
          </p>

        </div>


      </div>

    </section>

  );

}

export default PlatformStats;