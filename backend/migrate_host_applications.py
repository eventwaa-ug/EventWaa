import json
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

with open("host_applications.json", "r", encoding="utf-8") as f:
    applications = json.load(f)

print("===== HOST APPLICATIONS MIGRATION =====")
print(f"APPLICATIONS FOUND IN JSON: {len(applications)}")

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        cur.execute("SELECT COUNT(*) FROM host_applications")
        existing_count = cur.fetchone()[0]

        print(f"EXISTING HOST APPLICATIONS IN DATABASE: {existing_count}")

        migrated = 0

        for application in applications:

            application_id = int(application["id"])
            legacy_user_id = application.get("userId")

            user_id = None

            if legacy_user_id:
                cur.execute(
                    "SELECT id FROM users WHERE id = %s",
                    (int(legacy_user_id),)
                )

                user = cur.fetchone()

                if user:
                    user_id = int(legacy_user_id)
                else:
                    print(
                        f"USER NOT FOUND FOR APPLICATION {application_id}: "
                        f"{legacy_user_id} - preserving application with user_id=NULL"
                    )

            submitted_at = application.get("submittedAt")

            if submitted_at:
                submitted_at = float(submitted_at)

            metadata = {
                "legacy_user_id": legacy_user_id,
                "location": application.get("location"),
                "has_previous_events": application.get("hasPreviousEvents"),
                "full_legal_name": application.get("fullLegalName"),
                "date_of_birth": application.get("dateOfBirth"),
                "country": application.get("country"),
                "id_number": application.get("idNumber"),
                "id_front": application.get("idFront"),
                "id_back": application.get("idBack"),
                "proof_image": application.get("proofImage")
            }

            cur.execute(
                """
                INSERT INTO host_applications (
                    id,
                    user_id,
                    name,
                    email,
                    phone,
                    organization_name,
                    organization_type,
                    reason,
                    experience,
                    status,
                    reviewed_at,
                    rejection_reason,
                    created_at,
                    updated_at,
                    metadata
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    to_timestamp(%s),
                    to_timestamp(%s),
                    %s
                )
                RETURNING id
                """,
                (
                    application_id,
                    user_id,
                    application.get("name"),
                    application.get("email"),
                    application.get("phone"),
                    application.get("organizationName"),
                    application.get("organizationType"),
                    application.get("reason"),
                    application.get("experience"),
                    application.get("status", "pending"),
                    None,
                    None,
                    submitted_at,
                    submitted_at,
                    json.dumps(metadata)
                )
            )

            print(
                f"MIGRATED HOST APPLICATION: "
                f"{application_id} - {application.get('name')}"
            )

            migrated += 1

        conn.commit()

        print("\nHOST APPLICATIONS MIGRATION SUCCESSFUL")
        print(f"MIGRATED APPLICATIONS: {migrated}")

finally:
    conn.close()
