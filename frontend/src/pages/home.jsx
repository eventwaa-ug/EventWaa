import Hero from "../components/Hero";
import "./Home.css";
import Footer from "../components/Footer";

import FeaturedEvents from "../components/FeaturedEvents";
import PlatformStats from "../components/PlatformStats";
import WhyChoose from "../components/WhyChoose";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import HappeningThisWeek from "../components/HappeningThisWeek";
import FreeEvents from "../components/FreeEvents";
import PaidEvents from "../components/PaidEvents";

import EventSearch from "../components/EventSearch";
import CityChips from "../components/CityChips";

import VerifiedHosts from "../components/VerifiedHosts";
import BrowseCategories from "../components/BrowseCategories";

import CommunityStories from "../components/CommunityStories";


function Home() {

  const navigate = useNavigate();

  const { user } = useAuth();


  const handleExploreEvents = () => {

    navigate("/events");

  };


  const handleHostEvent = () => {

    if (user) {

      navigate("/dashboard");

    } else {

      navigate("/login");

    }

  };


  return (

    <>

      {/* HERO */}

      <Hero
        handleHostEvent={handleHostEvent}
        handleExploreEvents={handleExploreEvents}
      />


      {/* SEARCH */}

      <EventSearch />


      {/* CITIES */}

      <CityChips />


      {/* CATEGORIES */}

      <BrowseCategories />


      {/* FEATURED EVENTS */}

      <FeaturedEvents />


      {/* THIS WEEK */}

      <HappeningThisWeek />


      {/* FREE EVENTS */}

      <FreeEvents />


      {/* PAID EVENTS */}

      <PaidEvents />


      {/* VERIFIED HOSTS */}

      <VerifiedHosts />

      /*........
      {/* PLATFORM STATS */}

      <PlatformStats />
      */


      {/* WHY EVENTWAA */}

      <WhyChoose />


      {/* REAL COMMUNITY REVIEWS */}

      <CommunityStories />


      {/* FOOTER */}

      <Footer />

    </>

  );

}


export default Home;