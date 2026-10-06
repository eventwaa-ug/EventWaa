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
# Load legacy team_members.json
# ---------------------------------------------------------

TEAM_MEMBERS_FILE = os.path.join(BASE_DIR, "team_members.json")

with open(TEAM_MEMBERS_FILE, "r", encoding="utf-8") as f:
    team_members = json.load(f)


# ---------------------------------------------------------
# Connect to PostgreSQL
# ---------------------------------------------------------

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        # -------------------------------------------------
        # Check existing team members
        # -------------------------------------------------

        cur.execute("SELECT COUNT(*) FROM team_members")
        existing_count = cur.fetchone()[0]

        print(f"TEAM MEMBERS FOUND IN JSON: {len(team_members)}")
        print(
            f"EXISTING TEAM MEMBERS IN DATABASE: "
            f"{existing_count}"
        )

        # -------------------------------------------------
        # Determine next numeric ID
        # -------------------------------------------------

        cur.execute("SELECT COALESCE(MAX(id), 0) FROM team_members")
        next_id = cur.fetchone()[0] + 1

        migrated = 0
        skipped_existing = 0
        missing_owners = 0
        missing_members = 0

        # -------------------------------------------------
        # Migrate team members
        # -------------------------------------------------

        for member in team_members:

            legacy_id = member.get("id")
            owner_id = member.get("hostId")
            member_id = member.get("userId")

            # -------------------------------------------------
            # Check whether this legacy team member already
            # exists by owner/member combination.
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM team_members
                WHERE owner_id = %s
                  AND member_id = %s
                  AND email = %s
                """,
                (
                    owner_id,
                    member_id,
                    member.get("email"),
                )
            )

            existing = cur.fetchone()

            if existing:
                print(
                    f"SKIPPED EXISTING TEAM MEMBER: "
                    f"{legacy_id} → database ID {existing[0]}"
                )
                skipped_existing += 1
                continue

            # -------------------------------------------------
            # Verify owner exists
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM users
                WHERE id = %s
                """,
                (owner_id,)
            )

            owner = cur.fetchone()

            if not owner:
                print(
                    f"MISSING OWNER FOR TEAM MEMBER "
                    f"{legacy_id}: {owner_id}"
                )
                missing_owners += 1
                continue

            # -------------------------------------------------
            # Verify member exists
            # -------------------------------------------------

            cur.execute(
                """
                SELECT id
                FROM users
                WHERE id = %s
                """,
                (member_id,)
            )

            member_user = cur.fetchone()

            if not member_user:
                print(
                    f"MISSING MEMBER FOR TEAM MEMBER "
                    f"{legacy_id}: {member_id}"
                )
                missing_members += 1
                continue

            # -------------------------------------------------
            # Parse createdAt
            # -------------------------------------------------

            created_at_raw = member.get("createdAt")

            if created_at_raw:
                created_at = datetime.fromisoformat(
                    created_at_raw.replace("Z", "+00:00")
                )
            else:
                created_at = None

            # -------------------------------------------------
            # Preserve legacy fields that have no dedicated
            # destination columns.
            # -------------------------------------------------

            metadata = {
                "legacy_id": legacy_id,
                "legacy_source": "team_members.json",
                "team_account_id": member.get("teamAccountId"),
                "host_email": member.get("hostEmail"),
                "event_ids": member.get("eventIds", []),
                "event_id": member.get("eventId"),
                "event_title": member.get("eventTitle"),
            }

            # -------------------------------------------------
            # Insert team member
            # -------------------------------------------------

            cur.execute(
                """
                INSERT INTO team_members (
                    id,
                    owner_id,
                    member_id,
                    name,
                    email,
                    phone,
                    role,
                    team_type,
                    status,
                    invitation_token,
                    invitation_expires_at,
                    joined_at,
                    created_at,
                    updated_at,
                    metadata
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    NULL,
                    %s,
                    %s,
                    %s,
                    NULL,
                    NULL,
                    NULL,
                    COALESCE(%s, NOW()),
                    COALESCE(%s, NOW()),
                    %s
                )
                """,
                (
                    next_id,
                    owner_id,
                    member_id,
                    member.get("name"),
                    member.get("email"),
                    member.get("role"),
                    "host",
                    str(member.get("status", "active")).lower(),
                    created_at,
                    created_at,
                    json.dumps(metadata),
                )
            )

            print(
                f"MIGRATED TEAM MEMBER: "
                f"{next_id} (legacy {legacy_id})"
            )

            migrated += 1
            next_id += 1

        # -------------------------------------------------
        # Commit migration
        # -------------------------------------------------

        conn.commit()

        print()
        print("TEAM MEMBERS MIGRATION SUCCESSFUL")
        print(f"MIGRATED TEAM MEMBERS: {migrated}")
        print(f"SKIPPED EXISTING: {skipped_existing}")
        print(f"MISSING OWNERS: {missing_owners}")
        print(f"MISSING MEMBERS: {missing_members}")

finally:
    conn.close()