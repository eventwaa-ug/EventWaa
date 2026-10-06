import os
import psycopg
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")
conn = psycopg.connect(DATABASE_URL)
try:
    with conn.cursor() as cur:
        print("===== TICKET VERIFICATION =====")
        # -------------------------------------------------
        # 1. TOTAL TICKETS
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets
        """)
        total_tickets = cur.fetchone()[0]
        print(f"TOTAL TICKETS: {total_tickets}")
        print("")
        # -------------------------------------------------
        # 2. TICKET DETAILS + RELATIONSHIPS
        # -------------------------------------------------
        cur.execute("""
            SELECT
                t.id,
                t.ticket_id,
                t.booking_id,
                t.event_id,
                t.ticket_type_id,
                t.price,
                t.valid,
                t.cancelled,
                t.checked_in,
                t.check_in_count,
                t.check_in_limit,
                b.owner_user_id,
                b.tx_ref
            FROM tickets t
            LEFT JOIN bookings b
                ON b.id = t.booking_id
            ORDER BY t.id
        """)
        tickets = cur.fetchall()
        for row in tickets:
            (
                ticket_db_id,
                ticket_id,
                booking_id,
                event_id,
                ticket_type_id,
                price,
                valid,
                cancelled,
                checked_in,
                check_in_count,
                check_in_limit,
                owner_user_id,
                tx_ref
            ) = row
            print(
                f"TICKET {ticket_db_id} | "
                f"{ticket_id} | "
                f"BOOKING {booking_id} | "
                f"EVENT {event_id} | "
                f"TICKET TYPE {ticket_type_id} | "
                f"PRICE {price} | "
                f"VALID {valid} | "
                f"CANCELLED {cancelled} | "
                f"CHECKED IN {checked_in} | "
                f"COUNT {check_in_count} | "
                f"LIMIT {check_in_limit}"
            )
            print(
                f"    USER: {owner_user_id} | "
                f"TX_REF: {tx_ref}"
            )
        print("")
        # -------------------------------------------------
        # 3. BROKEN BOOKING LINKS
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets t
            LEFT JOIN bookings b
                ON b.id = t.booking_id
            WHERE b.id IS NULL
        """)
        broken_booking_links = cur.fetchone()[0]
        # -------------------------------------------------
        # 4. BROKEN EVENT LINKS
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets t
            LEFT JOIN events e
                ON e.id = t.event_id
            WHERE e.id IS NULL
        """)
        broken_event_links = cur.fetchone()[0]
        # -------------------------------------------------
        # 5. BROKEN TICKET TYPE LINKS
        #
        # ticket_type_id is nullable, so NULL is valid.
        # We only count non-null IDs that don't exist.
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets t
            LEFT JOIN event_ticket_types ett
                ON ett.id = t.ticket_type_id
            WHERE t.ticket_type_id IS NOT NULL
              AND ett.id IS NULL
        """)
        broken_ticket_type_links = cur.fetchone()[0]
        # -------------------------------------------------
        # 6. BROKEN USER LINKS THROUGH BOOKING
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets t
            JOIN bookings b
                ON b.id = t.booking_id
            LEFT JOIN users u
                ON u.id = b.owner_user_id
            WHERE u.id IS NULL
        """)
        broken_user_links = cur.fetchone()[0]
        # -------------------------------------------------
        # 7. CHECK-IN LIMIT VALIDATION
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets
            WHERE check_in_limit <> 1
        """)
        invalid_check_in_limits = cur.fetchone()[0]
        # -------------------------------------------------
        # 8. CHECK-IN COUNT VALIDATION
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM tickets
            WHERE check_in_count < 0
               OR check_in_count > check_in_limit
        """)
        invalid_check_in_counts = cur.fetchone()[0]
        # -------------------------------------------------
        # 9. DUPLICATE TICKET IDS
        # -------------------------------------------------
        cur.execute("""
            SELECT COUNT(*)
            FROM (
                SELECT ticket_id
                FROM tickets
                GROUP BY ticket_id
                HAVING COUNT(*) > 1
            ) duplicates
        """)
        duplicate_ticket_ids = cur.fetchone()[0]
        # -------------------------------------------------
        # FINAL RESULTS
        # -------------------------------------------------
        print("===== TICKET RELATIONSHIP CHECK =====")
        print(
            f"BROKEN BOOKING LINKS: "
            f"{broken_booking_links}"
        )
        print(
            f"BROKEN EVENT LINKS: "
            f"{broken_event_links}"
        )
        print(
            f"BROKEN TICKET TYPE LINKS: "
            f"{broken_ticket_type_links}"
        )
        print(
            f"BROKEN USER LINKS: "
            f"{broken_user_links}"
        )
        print(
            f"INVALID CHECK-IN LIMITS: "
            f"{invalid_check_in_limits}"
        )
        print(
            f"INVALID CHECK-IN COUNTS: "
            f"{invalid_check_in_counts}"
        )
        print(
            f"DUPLICATE TICKET IDS: "
            f"{duplicate_ticket_ids}"
        )
finally:
    conn.close()