import json
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

with open("events.json", "r", encoding="utf-8") as f:
    events = json.load(f)

print("===== EVENT TICKET TYPES MIGRATION =====")
print(f"EVENTS FOUND IN JSON: {len(events)}")

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        # Check existing ticket types first
        cur.execute("SELECT COUNT(*) AS count FROM event_ticket_types")
        existing_count = cur.fetchone()[0]

        print(f"EXISTING TICKET TYPES IN DATABASE: {existing_count}")

        migrated = 0

        for event in events:
            event_id = int(event["id"])
            event_title = event.get("title", "")
            tickets = event.get("tickets", [])

            print(f"\nEVENT {event_id}: {event_title}")
            print(f"TICKET TYPES FOUND: {len(tickets)}")

            # Make sure the parent event already exists
            cur.execute(
                "SELECT id FROM events WHERE id = %s",
                (event_id,)
            )

            if cur.fetchone() is None:
                raise RuntimeError(
                    f"Event {event_id} does not exist in PostgreSQL"
                )

            for ticket in tickets:
                name = ticket.get("name") or ticket.get("type") or "Regular"

                price = ticket.get("price", 0)
                quantity = ticket.get("quantity", 0)
                remaining = ticket.get("remaining", quantity)

                cur.execute(
                    """
                    INSERT INTO event_ticket_types (
                        event_id,
                        name,
                        price,
                        quantity,
                        remaining,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s
                    )
                    RETURNING id
                    """,
                    (
                        event_id,
                        name,
                        price,
                        quantity,
                        remaining,
                        event.get("createdAt"),
                        event.get("updatedAt") or event.get("createdAt")
                    )
                )

                new_id = cur.fetchone()[0]

                print(
                    f"MIGRATED TICKET TYPE: "
                    f"{new_id} - Event {event_id} - {name} - "
                    f"UGX {price} - quantity {quantity} - remaining {remaining}"
                )

                migrated += 1

        conn.commit()

        print("\nEVENT TICKET TYPES MIGRATION SUCCESSFUL")
        print(f"MIGRATED TICKET TYPES: {migrated}")

finally:
    conn.close()
