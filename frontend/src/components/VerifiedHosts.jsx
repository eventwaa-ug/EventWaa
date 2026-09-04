import { useContext } from "react";
import { EventContext } from "../context/EventContext";
import { BadgeCheck, Users } from "lucide-react";
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
        name: event.hostName || "EventWaa Host",
      });
    }
  });

  const hosts = Array.from(hostsMap.values());

  return (
    <section className="verified-hosts">
      <div className="verified-hosts-container">

        {/* =====================================================
            SECTION HEADER
        ===================================================== */}

        <div className="verified-hosts-header">

          <span className="verified-hosts-label">
            <BadgeCheck
              size={16}
              strokeWidth={2.2}
            />

            Verified organizers
          </span>

          <h2>
            Trusted hosts
          </h2>

          <p>
            Discover events from organizers verified by EventWaa.
          </p>

        </div>


        {/* =====================================================
            HOSTS
        ===================================================== */}

        <div className="hosts-grid">

          {hosts.length === 0 ? (

            <div className="no-hosts">

              <div className="no-hosts-icon">
                <Users
                  size={28}
                  strokeWidth={1.8}
                />
              </div>

              <h3>
                No verified hosts yet
              </h3>

              <p>
                Verified organizers will appear here as they join
                EventWaa.
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
                  {host.name.charAt(0).toUpperCase()}
                </div>


                {/* HOST INFORMATION */}

                <div className="host-info">

                  <h3>
                    {host.name}
                  </h3>

                  <span className="verified-badge">

                    <BadgeCheck
                      size={17}
                      strokeWidth={2.2}
                    />

                    Verified organizer

                  </span>

                </div>

              </div>

            ))

          )}

        </div>

      </div>
    </section>
  );
}

export default VerifiedHosts;