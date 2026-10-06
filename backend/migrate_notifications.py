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
# Load legacy notifications.json
# ---------------------------------------------------------

NOTIFICATIONS_FILE = os.path.join(BASE_DIR, "notifications.json")

with open(NOTIFICATIONS_FILE, "r", encoding="utf-8") as f:
    notifications = json.load(f)


# ---------------------------------------------------------
# Connect to PostgreSQL
# ---------------------------------------------------------

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        # -------------------------------------------------
        # Check existing notifications
        # -------------------------------------------------

        cur.execute("SELECT COUNT(*) FROM notifications")
        existing_count = cur.fetchone()[0]

        print(f"NOTIFICATIONS FOUND IN JSON: {len(notifications)}")
        print(
            f"EXISTING NOTIFICATIONS IN DATABASE: "
            f"{existing_count}"
        )

        migrated = 0
        skipped_existing = 0
        missing_users = 0

        # -------------------------------------------------
        # Migrate notifications
        # -------------------------------------------------

        for notification in notifications:

            legacy_id = notification.get("id")
            user_id = notification.get("userId")

            # -------------------------------------------------
            # Check whether this legacy notification ID already
            # exists in the destination.
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM notifications
                WHERE id = %s
                """,
                (legacy_id,)
            )

            existing = cur.fetchone()

            if existing:
                print(
                    f"SKIPPED EXISTING NOTIFICATION: "
                    f"{legacy_id}"
                )
                skipped_existing += 1
                continue

            # -------------------------------------------------
            # Verify user exists
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM users
                WHERE id = %s
                """,
                (user_id,)
            )

            user = cur.fetchone()

            if not user:
                print(
                    f"MISSING USER FOR NOTIFICATION "
                    f"{legacy_id}: {user_id}"
                )
                missing_users += 1
                continue

            # -------------------------------------------------
            # Parse createdAt
            # -------------------------------------------------

            created_at_raw = notification.get("createdAt")

            if created_at_raw:
                created_at = datetime.fromisoformat(
                    created_at_raw.replace("Z", "+00:00")
                )
            else:
                created_at = None

            # -------------------------------------------------
            # Preserve fields that don't have dedicated
            # destination columns.
            # -------------------------------------------------

            metadata = {
                "legacy_id": legacy_id,
                "legacy_source": "notifications.json",
                "link": notification.get("link"),
            }

            # -------------------------------------------------
            # Insert notification
            # -------------------------------------------------

            cur.execute(
                """
                INSERT INTO notifications (
                    id,
                    user_id,
                    event_id,
                    type,
                    title,
                    message,
                    is_read,
                    created_at,
                    metadata
                )
                VALUES (
                    %s,
                    %s,
                    NULL,
                    %s,
                    %s,
                    %s,
                    %s,
                    COALESCE(%s, NOW()),
                    %s
                )
                """,
                (
                    legacy_id,
                    user_id,
                    notification.get("type"),
                    notification.get("title"),
                    notification.get("message"),
                    bool(notification.get("read", False)),
                    created_at,
                    json.dumps(metadata),
                )
            )

            print(
                f"MIGRATED NOTIFICATION: {legacy_id}"
            )

            migrated += 1

        # -------------------------------------------------
        # Commit migration
        # -------------------------------------------------

        conn.commit()

        print()
        print("NOTIFICATIONS MIGRATION SUCCESSFUL")
        print(f"MIGRATED NOTIFICATIONS: {migrated}")
        print(f"SKIPPED EXISTING: {skipped_existing}")
        print(f"MISSING USERS: {missing_users}")

finally:
    conn.close()