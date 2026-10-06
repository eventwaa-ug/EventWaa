import os
import json
from pathlib import Path
import psycopg
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
# ---------------------------------------------------------
# FIND LEGACY BOOKINGS.JSON
# ---------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
matches = list(BACKEND_DIR.rglob("bookings.json"))
if not matches:
    raise FileNotFoundError(
        "Could not find bookings.json inside the backend directory."
    )
if len(matches) > 1:
    print("Multiple bookings.json files found:")
    for path in matches:
        print(f" - {path}")
    raise RuntimeError(
        "More than one bookings.json file was found. "
        "Please keep only the correct legacy bookings.json."
    )
BOOKINGS_FILE = matches[0]
print(f"Using legacy bookings file: {BOOKINGS_FILE}")
# ---------------------------------------------------------
# LOAD LEGACY BOOKINGS
# ---------------------------------------------------------
with open(BOOKINGS_FILE, "r", encoding="utf-8") as f:
    legacy_bookings = json.load(f)
if not isinstance(legacy_bookings, list):
    raise RuntimeError("bookings.json does not contain a list.")
print(f"LEGACY BOOKINGS FOUND: {len(legacy_bookings)}")
# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------
def get_value(data, *keys, default=None):
    for key in keys:
        if key in data:
            return data[key]
    return default
# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------
conn = psycopg.connect(DATABASE_URL)
try:
    with conn.cursor() as cur:
        # -------------------------------------------------
        # CHECK EXISTING CHECK-INS
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM check_ins
        """)
        existing_check_ins = cur.fetchone()[0]
        print(
            f"EXISTING CHECK-INS IN DATABASE: "
            f"{existing_check_ins}"
        )
        # -------------------------------------------------
        # DETERMINE NEXT CHECK-IN ID
        # -------------------------------------------------
        cur.execute("""
            SELECT COALESCE(MAX(id), 0)
            FROM check_ins
        """)
        next_check_in_id = cur.fetchone()[0] + 1
        migrated = 0
        skipped_not_checked_in = 0
        skipped_existing = 0
        missing_tickets = 0
        # -------------------------------------------------
        # PROCESS BOOKINGS
        # -------------------------------------------------
        for legacy_booking in legacy_bookings:
            legacy_booking_id = get_value(
                legacy_booking,
                "id"
            )
            legacy_tx_ref = get_value(
                legacy_booking,
                "txRef",
                "tx_ref"
            )
            legacy_tickets = get_value(
                legacy_booking,
                "tickets",
                default=[]
            )
            if not legacy_tickets:
                continue
            # -------------------------------------------------
            # RESOLVE DATABASE BOOKING
            # -------------------------------------------------
            db_booking = None
            if legacy_tx_ref:
                cur.execute("""
                    SELECT
                        id,
                        event_id
                    FROM bookings
                    WHERE tx_ref = %s
                    LIMIT 1
                """, (legacy_tx_ref,))
                db_booking = cur.fetchone()
            if db_booking is None and legacy_booking_id is not None:
                cur.execute("""
                    SELECT
                        id,
                        event_id
                    FROM bookings
                    WHERE id = %s
                    LIMIT 1
                """, (legacy_booking_id,))
                db_booking = cur.fetchone()
            if db_booking is None:
                print(
                    f"BOOKING NOT FOUND: "
                    f"legacy booking {legacy_booking_id}"
                )
                continue
            db_booking_id, event_id = db_booking
            # -------------------------------------------------
            # PROCESS TICKETS
            # -------------------------------------------------
            for legacy_ticket in legacy_tickets:
                ticket_identifier = get_value(
                    legacy_ticket,
                    "ticketId",
                    "ticket_id",
                    "id"
                )
                if not ticket_identifier:
                    continue
                # -------------------------------------------------
                # ONLY MIGRATE ACTUAL CHECK-INS
                # -------------------------------------------------
                checked_in = bool(
                    get_value(
                        legacy_ticket,
                        "checkedIn",
                        "checked_in",
                        default=False
                    )
                )
                if not checked_in:
                    skipped_not_checked_in += 1
                    continue
                # -------------------------------------------------
                # FIND CURRENT DATABASE TICKET
                # -------------------------------------------------
                cur.execute("""
                    SELECT
                        id,
                        event_id
                    FROM tickets
                    WHERE ticket_id = %s
                    LIMIT 1
                """, (str(ticket_identifier),))
                db_ticket = cur.fetchone()
                if db_ticket is None:
                    print(
                        f"TICKET NOT FOUND: "
                        f"{ticket_identifier}"
                    )
                    missing_tickets += 1
                    continue
                db_ticket_id, ticket_event_id = db_ticket
                # -------------------------------------------------
                # CHECK IF CHECK-IN ALREADY EXISTS
                # -------------------------------------------------
                cur.execute("""
                    SELECT id
                    FROM check_ins
                    WHERE ticket_id = %s
                    LIMIT 1
                """, (db_ticket_id,))
                existing = cur.fetchone()
                if existing:
                    print(
                        f"SKIPPING EXISTING CHECK-IN: "
                        f"{ticket_identifier}"
                    )
                    skipped_existing += 1
                    continue
                # -------------------------------------------------
                # CHECK-IN TIMESTAMP
                # -------------------------------------------------
                checked_in_at = get_value(
                    legacy_ticket,
                    "checkedInAt",
                    "checked_in_at"
                )
                if checked_in_at is None:
                    checked_in_at = get_value(
                        legacy_booking,
                        "updatedAt",
                        "updated_at",
                        "createdAt",
                        "created_at"
                    )
                # -------------------------------------------------
                # PRESERVE LEGACY DATA
                # -------------------------------------------------
                metadata = {
                    "source": "legacy_bookings.json",
                    "legacy_booking_id": legacy_booking_id,
                    "legacy_ticket_id": ticket_identifier,
                    "legacy_checked_in": True,
                    "legacy_check_in_count": get_value(
                        legacy_ticket,
                        "checkInCount",
                        "check_in_count"
                    ),
                    "legacy_check_in_limit": get_value(
                        legacy_ticket,
                        "checkInLimit",
                        "check_in_limit"
                    ),
                    "legacy_checked_in_at": checked_in_at
                }
                # -------------------------------------------------
                # INSERT CHECK-IN
                # -------------------------------------------------
                cur.execute("""
                    INSERT INTO check_ins (
                        id,
                        event_id,
                        ticket_id,
                        attendance_pass_id,
                        checked_in_by,
                        checked_in_at,
                        method,
                        device_id,
                        metadata
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        NULL,
                        NULL,
                        %s::timestamptz,
                        %s,
                        NULL,
                        %s::jsonb
                    )
                """, (
                    next_check_in_id,
                    ticket_event_id or event_id,
                    db_ticket_id,
                    checked_in_at,
                    "legacy_migration",
                    json.dumps(metadata)
                ))
                print(
                    f"MIGRATED CHECK-IN: "
                    f"{ticket_identifier} "
                    f"(database ticket {db_ticket_id})"
                )
                next_check_in_id += 1
                migrated += 1
        # -------------------------------------------------
        # COMMIT
        # -------------------------------------------------
        conn.commit()
        print("")
        print("===== CHECK-INS MIGRATION SUCCESSFUL =====")
        print(
            f"LEGACY BOOKINGS FOUND: "
            f"{len(legacy_bookings)}"
        )
        print(
            f"MIGRATED CHECK-INS: "
            f"{migrated}"
        )
        print(
            f"SKIPPED NOT CHECKED IN: "
            f"{skipped_not_checked_in}"
        )
        print(
            f"SKIPPED EXISTING: "
            f"{skipped_existing}"
        )
        print(
            f"MISSING TICKETS: "
            f"{missing_tickets}"
        )
finally:
    conn.close()