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
# Load legacy reviews.json
# ---------------------------------------------------------

REVIEWS_FILE = os.path.join(BASE_DIR, "reviews.json")

with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
    reviews = json.load(f)


# ---------------------------------------------------------
# Connect to PostgreSQL
# ---------------------------------------------------------

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        # -------------------------------------------------
        # Check existing reviews
        # -------------------------------------------------

        cur.execute("SELECT COUNT(*) FROM reviews")
        existing_count = cur.fetchone()[0]

        print(f"REVIEWS FOUND IN JSON: {len(reviews)}")
        print(f"EXISTING REVIEWS IN DATABASE: {existing_count}")

        # -------------------------------------------------
        # Determine next numeric database ID
        # -------------------------------------------------

        cur.execute("SELECT COALESCE(MAX(id), 0) FROM reviews")
        next_id = cur.fetchone()[0] + 1

        migrated = 0
        skipped_existing = 0
        missing_users = 0
        missing_events = 0

        # -------------------------------------------------
        # Migrate reviews
        # -------------------------------------------------

        for review in reviews:

            legacy_id = review.get("id")
            user_id = review.get("userId")
            event_id = review.get("eventId")

            # -------------------------------------------------
            # Because the destination uses bigint IDs and the
            # legacy review uses a UUID, check for an existing
            # review using its stable business relationship.
            #
            # For this legacy dataset there is one review per
            # user/event combination.
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM reviews
                WHERE user_id = %s
                  AND event_id = %s
                """,
                (user_id, event_id)
            )

            existing = cur.fetchone()

            if existing:
                print(
                    f"SKIPPED EXISTING REVIEW: "
                    f"user {user_id}, event {event_id} "
                    f"→ database ID {existing[0]}"
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
                    f"MISSING USER FOR REVIEW {legacy_id}: "
                    f"{user_id}"
                )
                missing_users += 1
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
                    f"MISSING EVENT FOR REVIEW {legacy_id}: "
                    f"{event_id}"
                )
                missing_events += 1
                continue

            # -------------------------------------------------
            # Parse createdAt
            # -------------------------------------------------

            created_at_raw = review.get("createdAt")

            if created_at_raw:
                created_at = datetime.fromisoformat(
                    created_at_raw.replace("Z", "+00:00")
                )
            else:
                created_at = None

            # -------------------------------------------------
            # Insert review
            # -------------------------------------------------

            cur.execute(
                """
                INSERT INTO reviews (
                    id,
                    user_id,
                    event_id,
                    user_name,
                    event_title,
                    rating,
                    comment,
                    created_at
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    COALESCE(%s, NOW())
                )
                """,
                (
                    next_id,
                    user_id,
                    event_id,
                    review.get("userName"),
                    review.get("eventTitle"),
                    review.get("rating"),
                    review.get("comment"),
                    created_at,
                )
            )

            print(
                f"MIGRATED REVIEW: "
                f"{next_id} "
                f"(legacy {legacy_id})"
            )

            migrated += 1
            next_id += 1

        # -------------------------------------------------
        # Commit migration
        # -------------------------------------------------

        conn.commit()

        print()
        print("REVIEWS MIGRATION SUCCESSFUL")
        print(f"MIGRATED REVIEWS: {migrated}")
        print(f"SKIPPED EXISTING: {skipped_existing}")
        print(f"MISSING USERS: {missing_users}")
        print(f"MISSING EVENTS: {missing_events}")

finally:
    conn.close()