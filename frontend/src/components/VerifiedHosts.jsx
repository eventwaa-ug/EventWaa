import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import "./VerifiedHosts.css";

function VerifiedHosts() {

  const { events } = useContext(EventContext);

  // Store unique verified hosts
  const hostsMap = new Map();

  (events || []).forEach((event) => {

    // Only verified hosts with a valid host ID
    if (!event.verifiedHost || !event.hostId) {
      return;
    }

    // Prevent the same host from appearing multiple times
    if (!hostsMap.has(event.hostId)) {

      hostsMap.set(event.hostId, {
        hostId: event.hostId,
        name: event.hostName || "EventWaa Host"
      });

    }

  });

  const hosts = Array.from(hostsMap.values());


  return (

    <section className="verified-hosts">

      <div className="section-header">

        <h2>
          ⭐ Verified Hosts
        </h2>

        <p>
          Trusted organizers creating amazing experiences
        </p>

      </div>


      <div className="hosts-grid">

        {hosts.length === 0 ? (

          <div className="no-hosts">

            <div className="no-hosts-icon">
              ⭐
            </div>

            <h3>
              No verified hosts yet
            </h3>

            <p>
              Verified organizers will appear here.
            </p>

          </div>

        ) : (

          hosts.map((host) => (

            <div
              className="host-card"
              key={host.hostId}
            >

              {/* HOST AVATAR */}

              <div className="host-avatar">

                {host.name
                  ? host.name.charAt(0).toUpperCase()
                  : "⭐"}

              </div>


              {/* HOST NAME */}

              <h3>
                {host.name}
              </h3>


              {/* VERIFIED BADGE */}

              <span className="verified-badge">
                ✓ Verified Event Organizer
              </span>

            </div>

          ))

        )}

      </div>

    </section>

  );
}

export default VerifiedHosts;