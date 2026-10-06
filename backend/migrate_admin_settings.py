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
# Load legacy admin_settings.json
# ---------------------------------------------------------

SETTINGS_FILE = os.path.join(BASE_DIR, "admin_settings.json")

with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
    settings = json.load(f)


# ---------------------------------------------------------
# Connect to PostgreSQL
# ---------------------------------------------------------

conn = psycopg.connect(DATABASE_URL)

try:
    with conn.cursor() as cur:

        # -------------------------------------------------
        # Check existing settings
        # -------------------------------------------------

        cur.execute("SELECT COUNT(*) FROM admin_settings")
        existing_count = cur.fetchone()[0]

        print("ADMIN SETTINGS FOUND IN JSON: 1")
        print(
            f"EXISTING ADMIN SETTINGS IN DATABASE: "
            f"{existing_count}"
        )

        if existing_count > 0:
            raise RuntimeError(
                "admin_settings already contains data. "
                "Migration stopped to prevent duplicate settings."
            )

        # -------------------------------------------------
        # Preserve legacy settings that do not have their
        # own dedicated database columns.
        # -------------------------------------------------

        metadata = {
            "autoRefundApproval": settings.get(
                "autoRefundApproval"
            ),
            "legacy_source": "admin_settings.json"
        }

        # -------------------------------------------------
        # Use the current timestamp for created/updated_at
        # because admin_settings.json has no timestamps.
        # -------------------------------------------------

        now = datetime.now().astimezone()

        # -------------------------------------------------
        # Insert settings
        # -------------------------------------------------

        cur.execute(
            """
            INSERT INTO admin_settings (
                id,
                platform_name,
                platform_logo_url,
                platform_logo_path,
                maintenance_mode,
                allow_registration,
                host_verification,
                community_hosts,
                auto_approve_hosts,
                commission_percent,
                currency,
                host_refunds,
                two_factor_auth,
                created_at,
                updated_at,
                metadata,
                email_verification,
                event_approval,
                new_host_payout,
                verified_host_payout,
                trusted_host_payout,
                admin_refund_approval,
                refund_window,
                booking_notifications,
                email_notifications
            )
            VALUES (
                %s,
                %s,
                NULL,
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
                1,
                settings.get("platformName"),
                settings.get("platformLogo"),
                settings.get("maintenanceMode"),
                settings.get("allowRegistration"),
                settings.get("hostVerification"),
                settings.get("communityHosts"),
                settings.get("autoApproveHosts"),
                settings.get("commission"),
                settings.get("currency"),
                settings.get("hostRefunds"),
                settings.get("twoFactor"),
                now,
                now,
                json.dumps(metadata),
                settings.get("emailVerification"),
                settings.get("eventApproval"),
                settings.get("newHostPayout"),
                settings.get("verifiedHostPayout"),
                settings.get("trustedHostPayout"),
                settings.get("adminRefundApproval"),
                settings.get("refundWindow"),
                settings.get("bookingNotifications"),
                settings.get("emailNotifications"),
            )
        )

        conn.commit()

        print()
        print("ADMIN SETTINGS MIGRATION SUCCESSFUL")
        print("MIGRATED ADMIN SETTINGS: 1")

finally:
    conn.close()