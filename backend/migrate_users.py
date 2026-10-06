import json
import os

import psycopg
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")


USERS_FILE = "users.json"


# ============================================================
# LOAD USERS.JSON
# ============================================================

if not os.path.exists(USERS_FILE):
    raise FileNotFoundError(f"{USERS_FILE} was not found")


with open(USERS_FILE, "r", encoding="utf-8") as f:
    users = json.load(f)


if not isinstance(users, list):
    raise RuntimeError("users.json must contain a list of users")


print(f"USERS FOUND IN JSON: {len(users)}")


# ============================================================
# BASIC VALIDATION
# ============================================================

expected_ids = {
    1784987628896,
    1786631683343,
    1788708801551,
}

actual_ids = {user.get("id") for user in users}

if actual_ids != expected_ids:
    raise RuntimeError(
        f"Unexpected user IDs.\n"
        f"Expected: {sorted(expected_ids)}\n"
        f"Found:    {sorted(actual_ids)}"
    )


for user in users:
    required_fields = ["id", "name", "email"]

    for field in required_fields:
        if not user.get(field):
            raise RuntimeError(
                f"User {user.get('id')} is missing required field: {field}"
            )


# ============================================================
# CONNECT TO SUPABASE
# ============================================================

print("Connecting to Supabase...")

with psycopg.connect(DATABASE_URL) as conn:

    with conn.cursor() as cur:

        # ----------------------------------------------------
        # SAFETY CHECK
        # ----------------------------------------------------

        cur.execute("SELECT COUNT(*) FROM users")
        existing_count = cur.fetchone()[0]

        print(f"EXISTING USERS IN DATABASE: {existing_count}")

        if existing_count != 0:
            raise RuntimeError(
                "Migration stopped: public.users is not empty."
            )

        # ----------------------------------------------------
        # INSERT USERS
        # ----------------------------------------------------

        for user in users:

            user_id = user["id"]
            name = user["name"]
            email = user["email"]

            password_hash = user.get("password")

            role = user.get("role", "customer")
            status = user.get("status", "active")

            verified_host = bool(user.get("verifiedHost", False))
            host_mode = bool(user.get("hostMode", False))

            host_application_status = user.get(
                "hostApplicationStatus"
            )

            google_account = (
                user.get("provider") == "google"
            )

            phone = user.get("contact")

            # Do not migrate the localhost profile URL.
            profile_photo = None

            cur.execute(
                """
                INSERT INTO users (
                    id,
                    name,
                    email,
                    phone,
                    profile_photo,
                    role,
                    status,
                    verified_host,
                    host_mode,
                    host_application_status,
                    google_account,
                    password_hash
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
                    %s
                )
                """,
                (
                    user_id,
                    name,
                    email,
                    phone,
                    profile_photo,
                    role,
                    status,
                    verified_host,
                    host_mode,
                    host_application_status,
                    google_account,
                    password_hash,
                ),
            )

            print(f"MIGRATED USER: {user_id} - {email}")


# ============================================================
# SUCCESS
# ============================================================

print()
print("========================================")
print("USERS MIGRATION SUCCESSFUL")
print("========================================")
print(f"MIGRATED USERS: {len(users)}")
print("users.json was not modified.")