import json
import os
from datetime import datetime

import psycopg
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")


# ============================================================
# HELPERS
# ============================================================

def parse_date(value):
    if not value:
        return None

    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_time(value):
    if not value:
        return None

    return datetime.strptime(value, "%H:%M").time()


def parse_capacity(value):
    if value in (None, ""):
        return None

    return int(value)


def parse_datetime(value):
    if not value:
        return None

    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")


# ============================================================
# LOAD EVENTS JSON
# ============================================================

with open("events.json", "r", encoding="utf-8") as file:
    events = json.load(file)


print("EVENTS FOUND IN JSON:", len(events))
print("EVENT IDS:", [event.get("id") for event in events])


# ============================================================
# CONNECT TO SUPABASE
# ============================================================

print("Connecting to Supabase...")

with psycopg.connect(DATABASE_URL) as conn:

    with conn.cursor() as cur:

        # ----------------------------------------------------
        # SAFETY CHECK
        # ----------------------------------------------------

        cur.execute("SELECT COUNT(*) FROM events")
        existing_events = cur.fetchone()[0]

        print("EXISTING EVENTS IN DATABASE:", existing_events)

        if existing_events > 0:
            raise RuntimeError(
                "Migration stopped: the events table already contains data."
            )

        # ----------------------------------------------------
        # VERIFY HOST USERS
        # ----------------------------------------------------

        cur.execute("SELECT id FROM users")
        existing_user_ids = {row[0] for row in cur.fetchall()}

        # ----------------------------------------------------
        # MIGRATE EVENTS
        # ----------------------------------------------------

        migrated = 0

        for event in events:

            event_id = event.get("id")

            if event_id is None:
                raise RuntimeError("Event is missing its ID.")

            # ------------------------------------------------
            # HOST MAPPING
            #
            # Official EventWaa events use hostId = 0.
            # They do NOT have a real user host.
            # Therefore host_id becomes NULL.
            # ------------------------------------------------

            host_id = event.get("hostId")

            if event.get("adminEvent") is True:
                host_id = None

            elif host_id in (None, 0):
                raise RuntimeError(
                    f"Event {event_id} is not an admin event but has "
                    f"an invalid hostId: {host_id}"
                )

            elif host_id not in existing_user_ids:
                raise RuntimeError(
                    f"Event {event_id} references user {host_id}, "
                    "but that user does not exist in the database."
                )

            # ------------------------------------------------
            # DATE / TIME / CAPACITY
            # ------------------------------------------------

            event_date = parse_date(event.get("date"))
            start_time = parse_time(event.get("startTime"))
            end_time = parse_time(event.get("endTime"))
            capacity = parse_capacity(event.get("capacity"))

            # ------------------------------------------------
            # CREATED TIMESTAMP
            # ------------------------------------------------

            created_at = parse_datetime(event.get("createdAt"))

            if created_at is None:
                raise RuntimeError(
                    f"Event {event_id} is missing createdAt."
                )

            # ------------------------------------------------
            # IMAGE / POSTER
            # ------------------------------------------------

            event_poster = (
                event.get("eventPoster")
                or event.get("image")
                or None
            )

            # ------------------------------------------------
            # INSERT
            # ------------------------------------------------

            cur.execute(
                """
                INSERT INTO events (
                    id,
                    host_id,
                    title,
                    description,
                    venue,
                    city,
                    location,
                    category,
                    date,
                    start_time,
                    end_time,
                    capacity,
                    contact,
                    event_type,
                    ticket_type,
                    organizer_name,
                    event_poster,
                    status,
                    featured,
                    admin_event,
                    verified_host,
                    created_at,
                    updated_at
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    event_id,
                    host_id,
                    event.get("title"),
                    event.get("description") or None,
                    event.get("venue") or None,
                    event.get("city") or None,
                    None,
                    event.get("category") or None,
                    event_date,
                    start_time,
                    end_time,
                    capacity,
                    event.get("contact") or None,
                    event.get("eventType") or None,
                    event.get("ticketType") or None,
                    event.get("organizerName") or None,
                    event_poster,
                    event.get("status") or "active",
                    bool(event.get("featured", False)),
                    bool(event.get("adminEvent", False)),
                    bool(event.get("verifiedHost", False)),
                    created_at,
                    created_at
                )
            )

            migrated += 1

            print(
                f"MIGRATED EVENT: {event_id} - "
                f"{event.get('title')}"
            )

    conn.commit()


# ============================================================
# SUCCESS
# ============================================================

print()
print("========================================")
print("EVENTS MIGRATION SUCCESSFUL")
print("========================================")
print("MIGRATED EVENTS:", migrated)
print("events.json was not modified.")