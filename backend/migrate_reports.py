import os
import json
import psycopg
from dotenv import load_dotenv
from datetime import datetime

# ---------------------------------------------------------
# Load environment variables from backend/.env
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")


# ---------------------------------------------------------
# Load legacy event_reports.json
# ---------------------------------------------------------

REPORTS_FILE = os.path.join(BASE_DIR, "event_reports.json")

with open(REPORTS_FILE, "r", encoding="utf-8") as f:
    reports = json.load(f)


# ---------------------------------------------------------
# Connect to PostgreSQL
# ---------------------------------------------------------

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        # -------------------------------------------------
        # Check existing reports
        # -------------------------------------------------

        cur.execute("SELECT COUNT(*) FROM event_reports")
        existing_count = cur.fetchone()[0]

        print(f"EVENT REPORTS FOUND IN JSON: {len(reports)}")
        print(
            f"EXISTING EVENT REPORTS IN DATABASE: "
            f"{existing_count}"
        )

        migrated = 0
        skipped_existing = 0
        missing_events = 0
        missing_reporters = 0

        # -------------------------------------------------
        # Migrate reports
        # -------------------------------------------------

        for report in reports:

            legacy_id = report.get("id")
            event_id = report.get("eventId")
            reporter_email = report.get("reportedBy")

            # -------------------------------------------------
            # Check whether the legacy report already exists
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM event_reports
                WHERE id = %s
                """,
                (legacy_id,)
            )

            existing = cur.fetchone()

            if existing:
                print(
                    f"SKIPPED EXISTING EVENT REPORT: "
                    f"{legacy_id}"
                )
                skipped_existing += 1
                continue

            # -------------------------------------------------
            # Verify event exists
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM events
                WHERE id = %s
                """,
                (event_id,)
            )

            event = cur.fetchone()

            if not event:
                print(
                    f"MISSING EVENT FOR REPORT "
                    f"{legacy_id}: {event_id}"
                )
                missing_events += 1
                continue

            # -------------------------------------------------
            # Resolve reporter by email
            # -------------------------------------------------

            reporter_id = None

            if reporter_email:
                cur.execute(
                    """
                    SELECT id
                    FROM users
                    WHERE LOWER(email) = LOWER(%s)
                    """,
                    (reporter_email,)
                )

                reporter = cur.fetchone()

                if reporter:
                    reporter_id = reporter[0]
                else:
                    print(
                        f"MISSING REPORTER FOR REPORT "
                        f"{legacy_id}: {reporter_email}"
                    )
                    missing_reporters += 1
                    continue

            # -------------------------------------------------
            # Parse createdAt
            # -------------------------------------------------

            created_at_raw = report.get("createdAt")

            if created_at_raw:
                created_at = datetime.fromisoformat(
                    created_at_raw.replace("Z", "+00:00")
                )
            else:
                created_at = None

            # -------------------------------------------------
            # Preserve legacy fields without dedicated columns
            # -------------------------------------------------

            metadata = {
                "legacy_id": legacy_id,
                "legacy_source": "event_reports.json",
                "event_title": report.get("eventTitle"),
                "reported_by": reporter_email,
            }

            # -------------------------------------------------
            # Insert report
            # -------------------------------------------------

            cur.execute(
                """
                INSERT INTO event_reports (
                    id,
                    event_id,
                    reporter_id,
                    reason,
                    description,
                    status,
                    reviewed_by,
                    reviewed_at,
                    resolution,
                    created_at,
                    metadata
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    NULL,
                    NULL,
                    NULL,
                    COALESCE(%s, NOW()),
                    %s
                )
                """,
                (
                    legacy_id,
                    event_id,
                    reporter_id,
                    report.get("reason"),
                    report.get("description"),
                    report.get("status", "pending"),
                    created_at,
                    json.dumps(metadata),
                )
            )

            print(
                f"MIGRATED EVENT REPORT: {legacy_id}"
            )

            migrated += 1

        # -------------------------------------------------
        # Commit migration
        # -------------------------------------------------

        conn.commit()

        print()
        print("EVENT REPORTS MIGRATION SUCCESSFUL")
        print(f"MIGRATED REPORTS: {migrated}")
        print(f"SKIPPED EXISTING: {skipped_existing}")
        print(f"MISSING EVENTS: {missing_events}")
        print(f"MISSING REPORTERS: {missing_reporters}")

finally:
    conn.close()
    