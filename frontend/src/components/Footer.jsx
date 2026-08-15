import { Link } from "react-router-dom";
import "./Footer.css";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";

function Footer() {
  const { settings } = usePlatformSettings();

  return (
    <footer className="footer">

      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-brand">

          {settings.platformLogo ? (
            <img
              src={settings.platformLogo}
              alt={settings.platformName || "EventWaa"}
              className="footer-logo"
            />
          ) : (
            <h3>
              {settings.platformName || "EventWaa"}
            </h3>
          )}

          <p>
            Discover, create, and manage events
            across Uganda with EventWaa.
          </p>

        </div>


        {/* EXPLORE */}
        <div className="footer-links">

          <h3>
            Explore
          </h3>

          <Link to="/">
            Home
          </Link>

          <Link to="/events">
            Discover Events
          </Link>

          <Link to="/about">
            About EventWaa
          </Link>

        </div>


        {/* FOR HOSTS */}
        <div className="footer-links">

          <h3>
            For Hosts
          </h3>

          <Link to="/host-application">
            Become a Host
          </Link>

          <Link to="/support">
            Host Support
          </Link>

        </div>


        {/* SUPPORT */}
        <div className="footer-links">

          <h3>
            Support
          </h3>

          <Link to="/support">
            Support Center
          </Link>

          <Link to="/contact">
            Contact Us
          </Link>

          <Link to="/refund-policy">
            Refund Policy
          </Link>

          <a
            href="mailto:eventwaa.ug@gmail.com?subject=EventWaa%20Support%20Request"
            className="email-support-link"
          >
            📧 Email Support
          </a>

        </div>


        {/* LEGAL */}
        <div className="footer-links">

          <h3>
            Legal
          </h3>

          <Link to="/privacy-policy">
            Privacy Policy
          </Link>

          <Link to="/terms">
            Terms & Conditions
          </Link>

        </div>

      </div>


      {/* FOOTER BOTTOM */}

      <div className="footer-bottom">

        <p>
          © 2026 EventWaa. All rights reserved.
        </p>

        <div className="footer-bottom-links">

          <Link to="/privacy-policy">
            Privacy
          </Link>

          <Link to="/terms">
            Terms
          </Link>

          <Link to="/refund-policy">
            Refunds
          </Link>

        </div>

      </div>

    </footer>
  );
}

export default Footer;