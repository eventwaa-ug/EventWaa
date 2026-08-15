from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import time
import requests
import hashlib
import hmac
import uuid
import secrets


from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime, timedelta, timezone
from flask_mail import Mail, Message
from dotenv import load_dotenv
load_dotenv()
from werkzeug.utils import secure_filename
from werkzeug.security import (generate_password_hash, check_password_hash)



# ============================================================
# APP CONFIGURATION
# ============================================================


app = Flask(__name__)

# React frontend
CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    },
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)


# ============================================================
# EMAIL CONFIGURATION
# ============================================================

app.config["MAIL_SERVER"] = os.getenv("EMAIL_HOST", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.getenv("EMAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("EMAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("EMAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("EMAIL_USERNAME")
print("MAIL USERNAME:", app.config["MAIL_USERNAME"])
print("MAIL PASSWORD LOADED:", bool(app.config["MAIL_PASSWORD"]))

mail = Mail(app)

#password recovery email
def send_otp_email(receiver_email, otp):

    msg = Message(
        subject="Your EventWaa Password Recovery Code",
        sender=app.config["MAIL_DEFAULT_SENDER"],
        recipients=[receiver_email]
    )

    msg.body = f"""
Hello,

We received a request to reset the password for your EventWaa account.

Your verification code is:

{otp}

This code expires in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

For your security, never share this code with anyone.

--------------------------------------------------

EventWaa
Uganda's event discovery and ticketing platform

Email: eventwaa.ug@gmail.com
Phone: +256 767 261 206
Website: eventwaa.com
Location: Gulu, Uganda

--------------------------------------------------
"""

    mail.send(msg)

# ============================================================
# FLUTTERWAVE CONFIGURATION
# ============================================================

FLW_SECRET_KEY = os.getenv("FLW_SECRET_KEY", "").strip()

FLW_SECRET_HASH = os.getenv("FLW_SECRET_HASH", "").strip()

FLW_API_URL = "https://api.flutterwave.com/v3"


# ============================================================
# FILES
# ============================================================

HOST_APPLICATIONS_FILE = "host_applications.json"
ADMIN_SETTINGS_FILE = "admin_settings.json"

ATTENDANCE_FILE = "attendance.json"
MESSAGES_FILE = "messages.json"
HOST_WALLETS_FILE = "host_wallets.json"
NOTIFICATIONS_FILE = "notifications.json"
EVENT_REPORTS_FILE = "event_reports.json"
WALLET_FILE = "wallet.json"


# ============================================================
# ADMIN SETTINGS
# ============================================================

DEFAULT_ADMIN_SETTINGS = {

    # Platform
    "platformName": "EventWaa",

    # Platform logo
    "platformLogo": "",

    # Platform operation
    "maintenanceMode": False,

    # Users
    "allowRegistration": True,
    "emailVerification": False,

    # IMPORTANT:
    # Event approval is NOT part of EventWaa.
    "eventApproval": False,

    # Hosts
    "hostVerification": True,
    "communityHosts": False,
    "autoApproveHosts": False,

    # Revenue
    "commission": 10,

    # Payout delays
    "newHostPayout": 2,
    "verifiedHostPayout": 1,
    "trustedHostPayout": 0,

    # Currency
    "currency": "UGX",

    # Refunds
    "allowHostRefunds": True,
    "adminRefundApproval": False,
    "refundWindow": 7,

    # Notifications
    "bookingNotifications": True,
    "emailNotifications": True,

    # Security
    "twoFactor": False
}


def load_admin_settings():

    settings = DEFAULT_ADMIN_SETTINGS.copy()

    if os.path.exists(ADMIN_SETTINGS_FILE):

        try:

            with open(
                ADMIN_SETTINGS_FILE,
                "r",
                encoding="utf-8"
            ) as file:

                saved_settings = json.load(file)

                if isinstance(saved_settings, dict):
                    settings.update(saved_settings)

        except (json.JSONDecodeError, OSError):

            print("WARNING: Could not read admin_settings.json")

    return settings

# ============================================================
# PASSWORD RECOVERY HELPERS
# ============================================================

PASSWORD_RESETS_FILE = "password_resets.json"


def load_password_resets():

    return load_json_file(
        PASSWORD_RESETS_FILE,
        []
    )


def save_password_resets(resets):

    save_json_file(
        PASSWORD_RESETS_FILE,
        resets
    )


def generate_otp():

    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp):

    return hashlib.sha256(
        otp.encode("utf-8")
    ).hexdigest()


def generate_reset_token():

    return secrets.token_urlsafe(32)

#otp helper function
def generate_otp():
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp):
    return hashlib.sha256(
        otp.encode("utf-8")
    ).hexdigest()


def generate_reset_token():
    return secrets.token_urlsafe(32)

# ============================================================
# MAINTENANCE MODE
# ============================================================

@app.before_request
def check_maintenance_mode():
    # ---------------------------------------------------------
    # ALWAYS ALLOW CORS PREFLIGHT
    # ---------------------------------------------------------
    if request.method == "OPTIONS":
        return None
    # ---------------------------------------------------------
    # ROUTES THAT MUST WORK DURING MAINTENANCE
    # ---------------------------------------------------------
    allowed_routes = {
        "/",
        "/login",
        "/google-login",
        "/register",
        # Admin settings
        "/admin/settings",
        # Admin data
        "/events",
        "/users",
        # Host applications
        "/host-applications",
    }
    # ---------------------------------------------------------
    # ADMIN ROUTES
    #
    # Admin must ALWAYS be able to access the dashboard
    # and turn maintenance mode OFF.
    # ---------------------------------------------------------
    if request.path.startswith("/admin"):
        return None
    # ---------------------------------------------------------
    # ALLOW SPECIFIC API ROUTES
    # ---------------------------------------------------------
    if request.path in allowed_routes:
        return None
    # ---------------------------------------------------------
    # CHECK MAINTENANCE MODE
    # ---------------------------------------------------------
    settings = load_admin_settings()
    if settings.get("maintenanceMode", False):
        return jsonify({
            "success": False,
            "maintenance": True,
            "message":
                "EventWaa is currently under maintenance. "
                "Please try again later."
        }), 503
    return None

def save_admin_settings(settings):

    current_settings = DEFAULT_ADMIN_SETTINGS.copy()

    if isinstance(settings, dict):
        current_settings.update(settings)

    # Event approval is permanently disabled.
    current_settings["eventApproval"] = False

    with open(
        ADMIN_SETTINGS_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            current_settings,
            file,
            indent=4
        )

    return current_settings


REVIEWS_FILE = "reviews.json"

def load_reviews():

    if not os.path.exists(REVIEWS_FILE):

        return []

    try:

        with open(REVIEWS_FILE, "r", encoding="utf-8") as file:

            data = json.load(file)

        return data if isinstance(data, list) else []

    except (json.JSONDecodeError, OSError):

        return []

def save_reviews(reviews):

    with open(REVIEWS_FILE, "w", encoding="utf-8") as file:

        json.dump(

            reviews,

            file,

            indent=4,

            ensure_ascii=False
        )
@app.route("/reviews", methods=["GET"])
def get_reviews():

    reviews = load_reviews()

    # Newest reviews first
    reviews.sort(
        key=lambda review: review.get("createdAt", ""),
        reverse=True
    )

    return jsonify({
        "success": True,
        "reviews": reviews
    }), 200

@app.route("/reviews", methods=["POST"])
def create_review():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No review data provided."
        }), 400

    user_id = data.get("userId")
    user_name = data.get("userName")
    event_id = data.get("eventId")
    rating = data.get("rating")
    comment = data.get("comment")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "You must be logged in to leave a review."
        }), 401

    if not event_id:
        return jsonify({
            "success": False,
            "message": "Event information is missing."
        }), 400

    if not rating:
        return jsonify({
            "success": False,
            "message": "Please provide a rating."
        }), 400

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Invalid rating."
        }), 400

    if rating < 1 or rating > 5:
        return jsonify({
            "success": False,
            "message": "Rating must be between 1 and 5."
        }), 400

    if not comment or not comment.strip():
        return jsonify({
            "success": False,
            "message": "Please write a review."
        }), 400

    reviews = load_reviews()

    # Prevent duplicate reviews
    already_reviewed = any(
        str(review.get("userId")) == str(user_id)
        and str(review.get("eventId")) == str(event_id)
        for review in reviews
    )

    if already_reviewed:
        return jsonify({
            "success": False,
            "message": "You have already reviewed this event."
        }), 409

    # ---------------------------------------------------------
    # FIND EVENT
    # ---------------------------------------------------------

    events_file = "events.json"

    if not os.path.exists(events_file):
        return jsonify({
            "success": False,
            "message": "Events database not found."
        }), 500

    try:
        with open(events_file, "r", encoding="utf-8") as file:
            events = json.load(file)
    except (json.JSONDecodeError, OSError):
        return jsonify({
            "success": False,
            "message": "Unable to load events."
        }), 500

    event = next(
        (
            event
            for event in events
            if str(event.get("id")) == str(event_id)
        ),
        None
    )

    if not event:
        return jsonify({
            "success": False,
            "message": "Event not found."
        }), 404

    # ---------------------------------------------------------
    # CREATE REVIEW
    # ---------------------------------------------------------

    review = {
        "id": str(uuid.uuid4()),

        "userId": user_id,

        "userName": (
            user_name
            or "EventWaa User"
        ),

        "eventId": event_id,

        "eventTitle": (
            event.get("title")
            or "Event"
        ),

        "rating": rating,

        "comment": comment.strip(),

        "createdAt": datetime.utcnow().isoformat() + "Z"
    }

    reviews.append(review)

    save_reviews(reviews)

    return jsonify({
        "success": True,
        "message": "Review submitted successfully.",
        "review": review
    }), 201

# =========================================================
# PLATFORM STATISTICS
# =========================================================

@app.route("/platform-stats", methods=["GET"])
def get_platform_stats():

    try:

        # =====================================================
        # LOAD USERS
        # =====================================================

        users = []

        if os.path.exists("users.json"):

            with open(
                "users.json",
                "r",
                encoding="utf-8"
            ) as file:

                users = json.load(file)

            if not isinstance(users, list):
                users = []


        # =====================================================
        # LOAD EVENTS
        # =====================================================

        events = []

        if os.path.exists("events.json"):

            with open(
                "events.json",
                "r",
                encoding="utf-8"
            ) as file:

                events = json.load(file)

            if not isinstance(events, list):
                events = []


        # =====================================================
        # LOAD BOOKINGS
        # =====================================================

        bookings = []

        if os.path.exists("bookings.json"):

            with open(
                "bookings.json",
                "r",
                encoding="utf-8"
            ) as file:

                bookings = json.load(file)

            if not isinstance(bookings, list):
                bookings = []


        # =====================================================
        # LOAD REVIEWS
        # =====================================================

        reviews = load_reviews()


        # =====================================================
        # COUNT EVENTS
        # =====================================================

        events_count = len(events)


        # =====================================================
        # COUNT COMMUNITY MEMBERS
        # =====================================================

        users_count = len(users)


        # =====================================================
        # COUNT TICKETS BOOKED
        # =====================================================

        tickets_booked = 0

        for booking in bookings:

            status = str(
                booking.get("status", "confirmed")
            ).lower()

            refund_status = str(
                booking.get("refundStatus", "")
            ).lower()


            # Ignore invalid bookings

            if status in [
                "cancelled",
                "canceled",
                "failed",
                "rejected"
            ]:

                continue


            # Ignore refunded tickets

            if refund_status == "refunded":

                continue


            quantity = booking.get(
                "quantity",
                1
            )


            try:

                quantity = int(quantity)

            except (TypeError, ValueError):

                quantity = 1


            tickets_booked += quantity


        # =====================================================
        # CALCULATE AVERAGE RATING
        # =====================================================

        average_rating = 0


        if reviews:

            total_rating = 0
            valid_reviews = 0


            for review in reviews:

                try:

                    rating = float(
                        review.get("rating", 0)
                    )

                    if 1 <= rating <= 5:

                        total_rating += rating
                        valid_reviews += 1

                except (TypeError, ValueError):

                    continue


            if valid_reviews > 0:

                average_rating = round(
                    total_rating / valid_reviews,
                    1
                )


        # =====================================================
        # RESPONSE
        # =====================================================

        return jsonify({

            "success": True,

            "stats": {

                "events": events_count,

                "users": users_count,

                "tickets": tickets_booked,

                "averageRating": average_rating,

                "reviews": len(reviews)

            }

        }), 200


    except Exception as error:

        print(
            "PLATFORM STATS ERROR:",
            error
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to load platform statistics."

        }), 500

@app.route("/admin/upload-logo", methods=["POST"])
def upload_platform_logo():

    if "logo" not in request.files:
        return jsonify({
            "success": False,
            "message": "No logo uploaded"
        }), 400

    logo = request.files["logo"]

    if logo.filename == "":
        return jsonify({
            "success": False,
            "message": "No logo selected"
        }), 400

    upload_folder = "uploads/platform"
    os.makedirs(upload_folder, exist_ok=True)

    settings = load_admin_settings()

    # Delete old logo if it exists
    old_logo = settings.get("platformLogo")

    if old_logo and "/uploads/platform/" in old_logo:
        old_filename = old_logo.split("/uploads/platform/")[-1]
        old_path = os.path.join(upload_folder, old_filename)

        if os.path.exists(old_path):
            os.remove(old_path)

    filename = (
        f"platform_logo_{int(time.time())}_"
        f"{secure_filename(logo.filename)}"
    )

    filepath = os.path.join(upload_folder, filename)
    logo.save(filepath)

    logo_url = (
        f"{request.host_url}uploads/platform/{filename}"
    )

    settings["platformLogo"] = logo_url
    save_admin_settings(settings)

    return jsonify({
        "success": True,
        "logo": logo_url
    })



@app.route("/admin/remove-logo", methods=["DELETE"])
def remove_platform_logo():

    settings = load_admin_settings()

    logo = settings.get("platformLogo")

    if logo and "/uploads/platform/" in logo:

        upload_folder = "uploads/platform"
        filename = logo.split("/uploads/platform/")[-1]
        filepath = os.path.join(upload_folder, filename)

        if os.path.exists(filepath):
            os.remove(filepath)

    settings["platformLogo"] = ""
    save_admin_settings(settings)

    return jsonify({
        "success": True
    })

#fotgot password
# ============================================================
# FORGOT PASSWORD
# ============================================================

@app.route(
    "/forgot-password",
    methods=["POST"]
)
def forgot_password():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "success": False,
            "message": "Recovery data is required."
        }), 400


    email = str(
        data.get("email", "")
    ).strip().lower()


    if not email:

        return jsonify({
            "success": False,
            "message": "Email address is required."
        }), 400


    # Load existing users
    users = load_json_file(
        "users.json",
        []
    )


    # Find the account
    user = next(
        (
            existing_user
            for existing_user in users
            if str(
                existing_user.get("email", "")
            ).strip().lower() == email
        ),
        None
    )


    # IMPORTANT:
    # Don't reveal whether an email exists.
    if not user:

        return jsonify({
            "success": True,
            "message": (
                "If an account exists with this email, "
                "a recovery code has been sent."
            )
        }), 200


    # Google-only accounts cannot use password recovery
    if "password" not in user:

        return jsonify({
            "success": True,
            "message": (
                "If an account exists with this email, "
                "a recovery code has been sent."
            )
        }), 200


    # Generate OTP
    otp = generate_otp()


    # Hash OTP before storing
    otp_hash = hash_otp(
        otp
    )


    # Generate secure reset token
    reset_token = generate_reset_token()


    # Current time
    now = datetime.now(
        timezone.utc
    )


    # OTP expires in 10 minutes
    expires_at = now + timedelta(
        minutes=10
    )


    # Load previous recovery requests
    resets = load_password_resets()


    # Remove previous request for this email
    resets = [
        reset
        for reset in resets
        if str(
            reset.get("email", "")
        ).lower() != email
    ]


    # Create new recovery request
    reset_data = {

        "email": email,

        "otp_hash": otp_hash,

        "reset_token": reset_token,

        "otp_verified": False,

        "attempts": 0,

        "created_at": now.isoformat(),

        "expires_at": expires_at.isoformat()
    }


    resets.append(
        reset_data
    )


    save_password_resets(
        resets
    )


    # Send OTP email
    try:

        send_otp_email(
            email,
            otp
        )

    except Exception as error:

        import traceback

        print(
            "PASSWORD RECOVERY EMAIL ERROR:",
            repr(error)
        )

        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": "Unable to send the recovery email right now."
        }), 500


        # Remove failed recovery request
        resets = [
            reset
            for reset in resets
            if str(
                reset.get("email", "")
            ).lower() != email
        ]


        save_password_resets(
            resets
        )


        return jsonify({
            "success": False,
            "message": (
                "Unable to send the recovery email right now."
            )
        }), 500


    return jsonify({
        "success": True,
        "message": (
            "If an account exists with this email, "
            "a recovery code has been sent."
        )
    }), 200

# ============================================================
# VERIFY PASSWORD RESET OTP
# ============================================================

@app.route(
    "/verify-otp",
    methods=["POST"]
)
def verify_otp():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "success": False,
            "message": "Verification data is required."
        }), 400


    email = str(
        data.get("email", "")
    ).strip().lower()

    otp = str(
        data.get("otp", "")
    ).strip()


    if not email or not otp:

        return jsonify({
            "success": False,
            "message": (
                "Email and verification code are required."
            )
        }), 400


    # OTP must contain exactly 6 digits
    if not otp.isdigit() or len(otp) != 6:

        return jsonify({
            "success": False,
            "message": (
                "Verification code must contain 6 digits."
            )
        }), 400


    # Load recovery requests
    resets = load_password_resets()


    # Find recovery request
    reset = next(
        (
            item
            for item in resets
            if str(
                item.get("email", "")
            ).strip().lower() == email
        ),
        None
    )


    if not reset:

        return jsonify({
            "success": False,
            "message": (
                "Invalid or expired verification code."
            )
        }), 400


    # Check number of attempts
    attempts = reset.get(
        "attempts",
        0
    )


    if attempts >= 5:

        # Delete the recovery request
        resets = [
            item
            for item in resets
            if str(
                item.get("email", "")
            ).strip().lower() != email
        ]


        save_password_resets(
            resets
        )


        return jsonify({
            "success": False,
            "message": (
                "Too many incorrect attempts. "
                "Please request a new code."
            )
        }), 429


    # Check expiration
    try:

        expires_at = datetime.fromisoformat(
            reset["expires_at"]
        )

    except (
        KeyError,
        ValueError,
        TypeError
    ):

        return jsonify({
            "success": False,
            "message": (
                "Invalid password recovery session."
            )
        }), 400


    if datetime.now(
        timezone.utc
    ) > expires_at:

        # Remove expired request
        resets = [
            item
            for item in resets
            if str(
                item.get("email", "")
            ).strip().lower() != email
        ]


        save_password_resets(
            resets
        )


        return jsonify({
            "success": False,
            "message": (
                "This verification code has expired. "
                "Please request a new one."
            )
        }), 400


    # Hash submitted OTP
    submitted_hash = hash_otp(
        otp
    )


    # Compare hashes securely
    if not secrets.compare_digest(
        submitted_hash,
        reset.get("otp_hash", "")
    ):

        reset["attempts"] = attempts + 1

        save_password_resets(
            resets
        )


        remaining_attempts = 5 - (
            attempts + 1
        )


        if remaining_attempts > 0:

            message = (
                f"Invalid verification code. "
                f"{remaining_attempts} attempts remaining."
            )

        else:

            message = (
                "Too many incorrect attempts. "
                "Please request a new code."
            )


        return jsonify({
            "success": False,
            "message": message
        }), 400


    # OTP is correct
    reset["otp_verified"] = True

    save_password_resets(
        resets
    )


    return jsonify({
        "success": True,
        "message": (
            "Verification successful."
        ),
        "resetToken": reset.get(
            "reset_token"
        )
    }), 200

# ============================================================
# RESET PASSWORD
# ============================================================

@app.route(
    "/reset-password",
    methods=["POST"]
)
def reset_password():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "success": False,
            "message": "Reset data is required."
        }), 400


    email = str(
        data.get("email", "")
    ).strip().lower()

    reset_token = str(
        data.get("resetToken", "")
    ).strip()

    new_password = data.get(
        "password"
    )


    # ------------------------------------------------------------
    # Basic validation
    # ------------------------------------------------------------

    if not email:

        return jsonify({
            "success": False,
            "message": "Email address is required."
        }), 400


    if not reset_token:

        return jsonify({
            "success": False,
            "message": "Invalid password reset session."
        }), 400


    if not new_password:

        return jsonify({
            "success": False,
            "message": "New password is required."
        }), 400


    # Password length validation
    if len(new_password) < 8:

        return jsonify({
            "success": False,
            "message": (
                "Your password must contain at least 8 characters."
            )
        }), 400


    # ------------------------------------------------------------
    # Load password recovery sessions
    # ------------------------------------------------------------

    resets = load_password_resets()


    # Find matching reset session
    reset = next(
        (
            item
            for item in resets
            if (
                str(
                    item.get("email", "")
                ).strip().lower() == email
                and
                str(
                    item.get("reset_token", "")
                ) == reset_token
            )
        ),
        None
    )


    if not reset:

        return jsonify({
            "success": False,
            "message": (
                "Invalid or expired password reset session."
            )
        }), 400


    # ------------------------------------------------------------
    # Make sure OTP was verified
    # ------------------------------------------------------------

    if not reset.get(
        "otp_verified",
        False
    ):

        return jsonify({
            "success": False,
            "message": (
                "Please verify your recovery code first."
            )
        }), 403


    # ------------------------------------------------------------
    # Check expiration
    # ------------------------------------------------------------

    try:

        expires_at = datetime.fromisoformat(
            reset["expires_at"]
        )

    except (
        KeyError,
        ValueError,
        TypeError
    ):

        return jsonify({
            "success": False,
            "message": (
                "Invalid password recovery session."
            )
        }), 400


    if datetime.now(
        timezone.utc
    ) > expires_at:

        # Delete expired reset session
        resets = [
            item
            for item in resets
            if item is not reset
        ]

        save_password_resets(
            resets
        )

        return jsonify({
            "success": False,
            "message": (
                "Your password reset session has expired. "
                "Please request a new code."
            )
        }), 400


    # ------------------------------------------------------------
    # Load users
    # ------------------------------------------------------------

    users = load_json_file(
        "users.json",
        []
    )


    # Find user
    user = next(
        (
            existing_user
            for existing_user in users
            if str(
                existing_user.get("email", "")
            ).strip().lower() == email
        ),
        None
    )


    if not user:

        return jsonify({
            "success": False,
            "message": (
                "Unable to reset this account."
            )
        }), 404


    # ------------------------------------------------------------
    # Make sure this is a password account
    # ------------------------------------------------------------

    if "password" not in user:

        return jsonify({
            "success": False,
            "message": (
                "This account uses Google Sign-in."
            )
        }), 400


    # ------------------------------------------------------------
    # Hash new password
    # ------------------------------------------------------------

    user["password"] = generate_password_hash(
        new_password
    )


    # ------------------------------------------------------------
    # Save updated user
    # ------------------------------------------------------------

    save_json_file(
        "users.json",
        users
    )


    # ------------------------------------------------------------
    # Delete used reset session
    # ------------------------------------------------------------

    resets = [
        item
        for item in resets
        if item is not reset
    ]


    save_password_resets(
        resets
    )


    # ------------------------------------------------------------
    # Success
    # ------------------------------------------------------------

    return jsonify({
        "success": True,
        "message": (
            "Your password has been reset successfully."
        )
    }), 200

# ============================================================
# MAINTENANCE MODE
# ============================================================

# Routes that should ALWAYS remain available
# while maintenance mode is enabled.
MAINTENANCE_ALLOWED_ROUTES = {
    "/",
    "/login",
    "/google-login",
    "/register",
    "/admin/settings",
}

@app.route("/admin/users", methods=["GET"])
def admin_get_users():
    return jsonify(
        load_json_file("users.json", [])
    )


@app.route("/admin/events", methods=["GET"])
def admin_get_events():
    return jsonify(
        load_json_file("events.json", [])
    )


@app.route("/admin/host-applications", methods=["GET"])
def admin_get_host_applications():
    return jsonify(
        load_applications()
    )

@app.before_request
def platform_maintenance_check():

    # Always allow OPTIONS requests.
    # This prevents CORS preflight errors.
    if request.method == "OPTIONS":
        return None

    settings = load_admin_settings()

    if not settings.get("maintenanceMode", False):
        return None

    # Admin routes remain available.
    if request.path.startswith("/admin"):
        return None

    # Static files/uploads remain available.
    if request.path.startswith("/uploads"):
        return None

    # Allow health/home route.
    if request.path in MAINTENANCE_ALLOWED_ROUTES:
        return None

    return jsonify({
        "success": False,
        "maintenanceMode": True,
        "message": "EventWaa is currently under maintenance. Please try again later."
    }), 503



# ============================================================
# HELPER FUNCTIONS
# ============================================================

def load_json_file(filename, default=None):

    if default is None:
        default = []

    if not os.path.exists(filename):
        return default

    try:

        with open(
            filename,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    except (json.JSONDecodeError, OSError):

        return default


def save_json_file(filename, data):

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=4
        )

# ============================================================
# PAYMENT FILE HELPERS
# ============================================================

PAYMENTS_FILE = "payments.json"


def load_payments():
    return load_json_file(
        PAYMENTS_FILE,
        []
    )


def save_payments(payments):
    save_json_file(
        PAYMENTS_FILE,
        payments
    )
# ============================================================
# VERIFY FLUTTERWAVE PAYMENT
# ============================================================

def generate_flw_tx_ref():
    return f"EVENTWAA-{uuid.uuid4().hex.upper()}"

@app.route(
    "/payments/verify/<transaction_id>",
    methods=["GET"]
)
def verify_payment(transaction_id):

    try:

        if not FLW_SECRET_KEY:

            return jsonify({
                "success": False,
                "message": (
                    "Flutterwave secret key "
                    "is not configured."
                )
            }), 500


        tx_ref = request.args.get(
            "tx_ref",
            ""
        ).strip()


        if not tx_ref:

            return jsonify({
                "success": False,
                "message": (
                    "Transaction reference "
                    "is required."
                )
            }), 400


        result, status_code = (
            process_verified_payment(
                transaction_id,
                tx_ref
            )
        )


        return jsonify(
            result
        ), status_code


    except Exception as e:

        print(
            "VERIFY PAYMENT ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to verify payment."

        }), 500

# ============================================================
# PROCESS VERIFIED FLUTTERWAVE PAYMENT
# ============================================================

def process_verified_payment(
    transaction_id,
    tx_ref
):

    payments = load_payments()

    # ========================================================
    # FIND PAYMENT BY TX REF
    # ========================================================

    payment = find_payment_by_tx_ref(
        payments,
        tx_ref
    )

    if not payment:

        return {
            "success": False,
            "message": (
                "Payment record not found."
            ),
            "code": "PAYMENT_NOT_FOUND"
        }, 404


    # ========================================================
    # DOUBLE-PAYMENT PROTECTION
    # ========================================================

    if payment.get(
        "processed",
        False
    ):

        return {
            "success": True,
            "message": (
                "Payment has already been "
                "processed."
            ),
            "alreadyProcessed": True,
            "bookingId": payment.get(
                "bookingId"
            ),
            "payment": payment
        }, 200


    # ========================================================
    # ALSO CHECK TRANSACTION ID
    # ========================================================

    existing_payment = (
        find_payment_by_transaction_id(
            payments,
            transaction_id
        )
    )


    if existing_payment:

        if existing_payment.get(
            "processed",
            False
        ):

            return {
                "success": True,
                "message": (
                    "This Flutterwave transaction "
                    "has already been processed."
                ),
                "alreadyProcessed": True,
                "bookingId":
                    existing_payment.get(
                        "bookingId"
                    ),
                "payment":
                    existing_payment
            }, 200


    # ========================================================
    # VERIFY WITH FLUTTERWAVE
    # ========================================================

    headers = {

        "Authorization":
            f"Bearer {FLW_SECRET_KEY}",

        "Content-Type":
            "application/json"

    }


    try:

        verification_response = requests.get(

            f"{FLW_API_URL}/transactions/"
            f"{transaction_id}/verify",

            headers=headers,

            timeout=30

        )

        verification_data = (
            verification_response.json()
        )

    except Exception as e:

        print(
            "FLUTTERWAVE VERIFICATION ERROR:",
            str(e)
        )

        return {
            "success": False,
            "message": (
                "Unable to verify payment "
                "with Flutterwave."
            )
        }, 502


    if (
        verification_response.status_code
        >= 400
    ):

        return {
            "success": False,
            "message": (
                verification_data.get(
                    "message"
                )
                or
                "Flutterwave verification failed."
            )
        }, 400


    flutterwave_payment = (
        verification_data.get(
            "data"
        )
        or {}
    )


    # ========================================================
    # CHECK FLUTTERWAVE STATUS
    # ========================================================

    flutterwave_status = (
        flutterwave_payment.get(
            "status"
        )
    )


    if flutterwave_status != "successful":

        payment["status"] = (
            flutterwave_status
            or
            "failed"
        )

        payment["transactionId"] = (
            transaction_id
        )

        save_payments(
            payments
        )

        return {
            "success": False,
            "message": (
                "Payment was not successful."
            ),
            "status":
                flutterwave_status
        }, 400


    # ========================================================
    # CHECK TX REF
    # ========================================================

    verified_tx_ref = str(
        flutterwave_payment.get(
            "tx_ref",
            ""
        )
    )


    if verified_tx_ref != str(
        payment.get(
            "txRef"
        )
    ):

        return {
            "success": False,
            "message": (
                "Transaction reference does "
                "not match EventWaa payment."
            )
        }, 400


    # ========================================================
    # CHECK CURRENCY
    # ========================================================

    verified_currency = str(
        flutterwave_payment.get(
            "currency",
            ""
        )
    ).upper()


    expected_currency = str(
        payment.get(
            "currency",
            "UGX"
        )
    ).upper()


    if verified_currency != expected_currency:

        return {
            "success": False,
            "message": (
                "Payment currency does "
                "not match expected currency."
            )
        }, 400


    # ========================================================
    # CHECK AMOUNT
    # ========================================================

    expected_amount = int(
        payment.get(
            "amount",
            0
        )
        or 0
    )


    paid_amount = int(
        float(
            flutterwave_payment.get(
                "amount",
                0
            )
            or 0
        )
    )


    if paid_amount < expected_amount:

        return {
            "success": False,
            "message": (
                "Payment amount is less "
                "than the required amount."
            ),
            "expectedAmount":
                expected_amount,
            "paidAmount":
                paid_amount
        }, 400


    # ========================================================
    # STORE TRANSACTION ID
    # ========================================================

    payment["transactionId"] = (
        transaction_id
    )

    payment["status"] = (
        "successful"
    )

    payment["paidAmount"] = (
        paid_amount
    )


    # ========================================================
    # LOAD EVENT
    # ========================================================

    events = load_json_file(
        "events.json",
        []
    )


    event = None

    for current_event in events:

        if str(
            current_event.get(
                "id"
            )
        ) == str(
            payment.get(
                "eventId"
            )
        ):

            event = current_event

            break


    if not event:

        return {
            "success": False,
            "message": (
                "Event associated with "
                "payment was not found."
            )
        }, 404


    # ========================================================
    # LOAD BOOKINGS
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )


    # ========================================================
    # EXTRA DUPLICATE PROTECTION
    #
    # Check whether this transaction already
    # appears on another booking.
    # ========================================================

    for existing_booking in bookings:

        if str(
            existing_booking.get(
                "transactionId",
                ""
            )
        ) == str(transaction_id):

            payment["processed"] = True

            payment["bookingId"] = (
                existing_booking.get(
                    "id"
                )
            )

            payment["processedAt"] = (
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )

            save_payments(
                payments
            )

            return {
                "success": True,
                "message": (
                    "Payment was already "
                    "converted into a booking."
                ),
                "alreadyProcessed": True,
                "bookingId":
                    existing_booking.get(
                        "id"
                    )
            }, 200


    # ========================================================
    # FIND TICKET
    # ========================================================

    ticket_type = str(
        payment.get(
            "ticketType",
            ""
        )
    ).strip()


    selected_ticket = None

    for ticket in event.get(
        "tickets",
        []
    ):

        if str(
            ticket.get(
                "name",
                ""
            )
        ).strip().lower() == ticket_type.lower():

            selected_ticket = ticket

            break


    if not selected_ticket:

        return {
            "success": False,
            "message": (
                "Ticket type no longer exists."
            )
        }, 404


    # ========================================================
    # CHECK INVENTORY AGAIN
    # ========================================================

    quantity = int(
        payment.get(
            "quantity",
            1
        )
        or 1
    )


    remaining = int(
        selected_ticket.get(
            "remaining",
            selected_ticket.get(
                "quantity",
                0
            )
        )
        or 0
    )


    if remaining < quantity:

        return {
            "success": False,
            "message": (
                "There are no longer enough "
                "tickets available."
            )
        }, 400


    # ========================================================
    # CREATE BOOKING ID
    # ========================================================

    next_booking_id = (
        max(
            [
                int(
                    booking.get(
                        "id",
                        0
                    )
                )
                for booking in bookings
                if str(
                    booking.get(
                        "id",
                        ""
                    )
                ).isdigit()
            ],
            default=0
        )
        + 1
    )


    # ========================================================
    # CREATE TICKET ID
    # ========================================================

    ticket_id = (
        f"EW-"
        f"{int(datetime.now().timestamp() * 1000)}"
        f"-"
        f"{next_booking_id}"
    )


    # ========================================================
    # CREATE BOOKING
    # ========================================================

    booking = {

        "id":
            next_booking_id,

        "eventId":
            event.get(
                "id"
            ),

        "eventTitle":
            event.get(
                "title",
                ""
            ),

        "buyer":
            payment.get(
                "buyer",
                {}
            ),

        "ticketType":
            ticket_type,

        "ticketPrice":
            int(
                payment.get(
                    "ticketPrice",
                    0
                )
                or 0
            ),

        "quantity":
            quantity,

        "subtotal":
            int(
                payment.get(
                    "subtotal",
                    0
                )
                or 0
            ),

        "serviceFee":
            int(
                payment.get(
                    "serviceFee",
                    0
                )
                or 0
            ),

        "serviceFeePercent":
            float(
                payment.get(
                    "serviceFeePercent",
                    5
                )
            ),

        "customerTotal":
            int(
                payment.get(
                    "amount",
                    0
                )
                or 0
            ),

        "totalPrice":
            int(
                payment.get(
                    "ticketPrice",
                    0
                )
                or 0
            )
            *
            quantity,

        "ticketId":
            ticket_id,

        "transactionId":
            transaction_id,

        "txRef":
            payment.get(
                "txRef"
            ),

        "checkedIn":
            False,

        "refundStatus":
            None,

        "createdAt":
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )

    }


    # ========================================================
    # ADD BOOKING
    # ========================================================

    bookings.append(
        booking
    )


    # ========================================================
    # UPDATE EVENT INVENTORY
    # ========================================================

    selected_ticket["remaining"] = (

        remaining
        -
        quantity

    )


    event["ticketsSold"] = (

        int(
            event.get(
                "ticketsSold",
                0
            )
            or 0
        )
        +
        quantity

    )


    # ========================================================
    # EVENT REVENUE
    #
    # Revenue is the customer ticket subtotal
    # plus the service fee already represented
    # by your existing EventWaa accounting.
    # ========================================================

    event["revenue"] = (

        int(
            event.get(
                "revenue",
                0
            )
            or 0
        )
        +
        int(
            payment.get(
                "amount",
                0
            )
            or 0
        )

    )


    # ========================================================
    # HOST WALLET
    #
    # 10% EventWaa commission
    # 90% host earning
    #
    # Service fee remains EventWaa money.
    # ========================================================

    wallets = load_host_wallets()


    host_id = event.get(
        "hostId"
    )


    try:

        host_id = int(
            host_id
        )

    except (
        TypeError,
        ValueError
    ):

        return {
            "success": False,
            "message": (
                "Event host ID is invalid."
            )
        }, 400


    host_wallet = None

    for wallet in wallets:

        try:

            wallet_host_id = int(
                wallet.get(
                    "hostId",
                    0
                )
            )

        except (
            TypeError,
            ValueError
        ):

            wallet_host_id = 0


        if wallet_host_id == host_id:

            host_wallet = wallet

            break


    if not host_wallet:

        host_wallet = {

            "hostId":
                host_id,

            "availableBalance":
                0,

            "pendingPayouts":
                0,

            "totalEarned":
                0,

            "totalWithdrawn":
                0,

            "withdrawals":
                [],

            "scheduledPayouts":
                [],

            "transactions":
                [],

            "refunds":
                0

        }

        wallets.append(
            host_wallet
        )


    # ========================================================
    # HOST COMMISSION
    # ========================================================

    ticket_subtotal = int(
        payment.get(
            "subtotal",
            0
        )
        or 0
    )


    commission_percent = 10.0


    commission = int(
        round(
            ticket_subtotal
            *
            commission_percent
            /
            100
        )
    )


    host_earning = (

        ticket_subtotal
        -
        commission

    )


    # ========================================================
    # ADD HOST PENDING PAYOUT
    # ========================================================

    host_wallet["pendingPayouts"] = (

        int(
            host_wallet.get(
                "pendingPayouts",
                0
            )
            or 0
        )
        +
        host_earning

    )


    host_wallet["totalEarned"] = (

        int(
            host_wallet.get(
                "totalEarned",
                0
            )
            or 0
        )
        +
        host_earning

    )


    host_wallet.setdefault(
        "transactions",
        []
    )


    host_wallet["transactions"].insert(

        0,

        {

            "type":
                "sale",

            "eventId":
                event.get(
                    "id"
                ),

            "eventTitle":
                event.get(
                    "title",
                    ""
                ),

            "amount":
                host_earning,

            "grossAmount":
                ticket_subtotal,

            "commission":
                commission,

            "commissionPercent":
                commission_percent,

            "serviceFee":
                int(
                    payment.get(
                        "serviceFee",
                        0
                    )
                    or 0
                ),

            "customerTotal":
                int(
                    payment.get(
                        "amount",
                        0
                    )
                    or 0
                ),

            "date":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        }

    )


    # ========================================================
    # MARK PAYMENT PROCESSED
    #
    # IMPORTANT:
    # This happens AFTER booking/event/wallet
    # changes have been prepared.
    # ========================================================

    payment["processed"] = True

    payment["bookingId"] = (
        next_booking_id
    )

    payment["processedAt"] = (
        datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )


    # ========================================================
    # SAVE EVERYTHING
    # ========================================================

    save_json_file(
        "bookings.json",
        bookings
    )

    save_json_file(
        "events.json",
        events
    )

    save_json_file(
        "host_wallets.json",
        wallets
    )

    save_payments(
        payments
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        "message":
            "Payment verified and booking created.",

        "alreadyProcessed":
            False,

        "booking":
            booking,

        "payment":
            payment,

        "money": {

            "ticketSubtotal":
                ticket_subtotal,

            "serviceFee":
                int(
                    payment.get(
                        "serviceFee",
                        0
                    )
                    or 0
                ),

            "customerPaid":
                paid_amount,

            "commission":
                commission,

            "hostEarning":
                host_earning

        }

    }, 200

# ============================================================
# FLUTTERWAVE TRANSACTION REFERENCE
# ============================================================

def generate_payment_reference(event_id, user_id):

    timestamp = int(
        datetime.now().timestamp() * 1000
    )

    return (
        f"EVENTWAA-"
        f"{event_id}-"
        f"{user_id}-"
        f"{timestamp}"
    )

#unique transaction reference generator
# ============================================================
# FIND PAYMENT BY TX REF
# ============================================================

def find_payment_by_tx_ref(
    payments,
    tx_ref
):

    for payment in payments:

        if str(
            payment.get("txRef", "")
        ) == str(tx_ref):

            return payment

    return None

#duplicate payment lookup
# ============================================================
# FIND PAYMENT BY FLUTTERWAVE TRANSACTION ID
# ============================================================

def find_payment_by_transaction_id(
    payments,
    transaction_id
):

    for payment in payments:

        if str(
            payment.get("transactionId", "")
        ) == str(transaction_id):

            return payment

    return None


# ============================================================
# HOST APPLICATIONS
# ============================================================

def load_applications():

    return load_json_file(
        HOST_APPLICATIONS_FILE,
        []
    )


def save_applications(applications):

    save_json_file(
        HOST_APPLICATIONS_FILE,
        applications
    )


# ============================================================
# ATTENDANCE
# ============================================================

def load_attendance():

    return load_json_file(
        ATTENDANCE_FILE,
        []
    )


def save_attendance(attendance):

    save_json_file(
        ATTENDANCE_FILE,
        attendance
    )


# ============================================================
# MESSAGES
# ============================================================

def load_messages():

    return load_json_file(
        MESSAGES_FILE,
        []
    )


def save_messages(messages):

    save_json_file(
        MESSAGES_FILE,
        messages
    )


# ============================================================
# HOST WALLETS
# ============================================================

def load_host_wallets():

    return load_json_file(
        HOST_WALLETS_FILE,
        []
    )


def save_host_wallets(wallets):

    save_json_file(
        HOST_WALLETS_FILE,
        wallets
    )


# ============================================================
# NOTIFICATIONS
# ============================================================

def load_notifications():

    return load_json_file(
        NOTIFICATIONS_FILE,
        []
    )


def save_notifications(notifications):

    save_json_file(
        NOTIFICATIONS_FILE,
        notifications
    )


# ============================================================
# EVENT REPORTS
# ============================================================

def load_event_reports():

    return load_json_file(
        EVENT_REPORTS_FILE,
        []
    )


def save_event_reports(reports):

    save_json_file(
        EVENT_REPORTS_FILE,
        reports
    )


# ============================================================
# WALLET
# ============================================================

def save_wallet(wallet):

    save_json_file(
        WALLET_FILE,
        wallet
    )


def load_wallet():

    if os.path.exists(WALLET_FILE):

        wallet = load_json_file(
            WALLET_FILE,
            {}
        )

        # Upgrade old wallet files.

        wallet.setdefault(
            "availableBalance",
            0
        )

        wallet.setdefault(
            "pendingPayouts",
            0
        )

        wallet.setdefault(
            "totalCommission",
            0
        )

        wallet.setdefault(
            "totalWithdrawn",
            0
        )

        wallet.setdefault(
            "withdrawals",
            []
        )

        save_wallet(wallet)

        return wallet

    wallet = {
        "availableBalance": 0,
        "pendingPayouts": 0,
        "totalCommission": 0,
        "totalWithdrawn": 0,
        "withdrawals": []
    }

    save_wallet(wallet)

    return wallet


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    settings = load_admin_settings()

    return jsonify({
        "success": True,
        "message": "Welcome to EventWaa Backend 🚀",
        "platformName": settings.get(
            "platformName",
            "EventWaa"
        ),
        "maintenanceMode": settings.get(
            "maintenanceMode",
            False
        )
    })


# ============================================================
# ADMIN SETTINGS
# ============================================================

@app.route(
    "/admin/settings",
    methods=["GET"]
)
def get_admin_settings():

    settings = load_admin_settings()

    return jsonify(settings)


@app.route(
    "/admin/settings",
    methods=["PUT"]
)
def update_admin_settings():

    data = request.get_json(
        silent=True
    )

    if not isinstance(data, dict):

        return jsonify({
            "success": False,
            "message": "Invalid settings data."
        }), 400

    settings = save_admin_settings(data)

    return jsonify({
        "success": True,
        "message": "Settings saved successfully.",
        "settings": settings
    })


# ============================================================
# REGISTER
# ============================================================

@app.route(
    "/register",
    methods=["POST"]
)
def register():

    settings = load_admin_settings()

    # Check registration setting.
    if not settings.get(
        "allowRegistration",
        True
    ):

        return jsonify({
            "success": False,
            "message": "New registrations are currently disabled."
        }), 403


    user = request.get_json(
        silent=True
    )

    if not user:

        return jsonify({
            "success": False,
            "message": "No registration data provided."
        }), 400


    email = user.get("email")

    if not email:

        return jsonify({
            "success": False,
            "message": "Email is required."
        }), 400


    users = load_json_file(
        "users.json",
        []
    )


    for existing_user in users:

        if (
            str(existing_user.get("email"))
            .lower()
            ==
            str(email).lower()
        ):

            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 409


    if "id" not in user:

        user["id"] = int(
            time.time() * 1000
        )


    if "password" in user:

        user["password"] = generate_password_hash(
            user["password"]
        )


    # New accounts are normal users.
    user.setdefault(
        "role",
        "user"
    )

    user.setdefault(
        "status",
        "active"
    )

    user.setdefault(
        "verifiedHost",
        False
    )

    user.setdefault(
        "hostMode",
        False
    )


    users.append(user)

    save_json_file(
        "users.json",
        users
    )


    return jsonify({
        "success": True,
        "message": "User registered successfully!"
    }), 201

# ============================================================
# FLUTTERWAVE INITIALIZE PAYMENT
# ============================================================

@app.route(
    "/payments/initialize",
    methods=["POST"]
)
def initialize_payment():

    try:

        if not FLW_SECRET_KEY:

            return jsonify({
                "success": False,
                "message": (
                    "Flutterwave secret key "
                    "is not configured."
                )
            }), 500


        data = request.get_json(
            silent=True
        ) or {}


        event_id = data.get(
            "eventId"
        )

        ticket_type = str(
            data.get(
                "ticketType",
                ""
            )
        ).strip()

        quantity = int(
            data.get(
                "quantity",
                1
            )
            or 1
        )


        buyer = data.get(
            "buyer"
        ) or {}


        buyer_name = str(
            buyer.get(
                "name",
                ""
            )
        ).strip()

        buyer_email = str(
            buyer.get(
                "email",
                ""
            )
        ).strip().lower()


        # ====================================================
        # VALIDATION
        # ====================================================

        if not event_id:

            return jsonify({
                "success": False,
                "message": "Event ID is required."
            }), 400


        if not ticket_type:

            return jsonify({
                "success": False,
                "message": "Ticket type is required."
            }), 400


        if quantity <= 0:

            return jsonify({
                "success": False,
                "message": (
                    "Ticket quantity must be "
                    "greater than zero."
                )
            }), 400


        if not buyer_name:

            return jsonify({
                "success": False,
                "message": "Buyer name is required."
            }), 400


        if not buyer_email:

            return jsonify({
                "success": False,
                "message": "Buyer email is required."
            }), 400


        # ====================================================
        # LOAD EVENT
        # ====================================================

        events = load_json_file(
            "events.json",
            []
        )


        event = None

        for current_event in events:

            if str(
                current_event.get("id")
            ) == str(event_id):

                event = current_event

                break


        if not event:

            return jsonify({
                "success": False,
                "message": "Event not found."
            }), 404


        # ====================================================
        # FIND TICKET TYPE
        # ====================================================

        selected_ticket = None

        for ticket in event.get(
            "tickets",
            []
        ):

            if str(
                ticket.get("name", "")
            ).strip().lower() == ticket_type.lower():

                selected_ticket = ticket

                break


        if not selected_ticket:

            return jsonify({
                "success": False,
                "message": (
                    "Selected ticket type "
                    "was not found."
                )
            }), 404


        # ====================================================
        # CHECK INVENTORY
        # ====================================================

        remaining = int(
            selected_ticket.get(
                "remaining",
                selected_ticket.get(
                    "quantity",
                    0
                )
            )
            or 0
        )


        if remaining < quantity:

            return jsonify({
                "success": False,
                "message": (
                    "Not enough tickets available."
                ),
                "remaining": remaining
            }), 400


        # ====================================================
        # CALCULATE PRICE SERVER-SIDE
        # ====================================================

        ticket_price = int(
            float(
                selected_ticket.get(
                    "price",
                    0
                )
                or 0
            )
        )


        subtotal = (
            ticket_price
            *
            quantity
        )


        # ====================================================
        # CUSTOMER SERVICE FEE
        # ====================================================

        service_fee_percent = 5.0

        service_fee = int(
            round(
                subtotal
                *
                service_fee_percent
                /
                100
            )
        )


        customer_total = (
            subtotal
            +
            service_fee
        )


        if customer_total <= 0:

            return jsonify({
                "success": False,
                "message": (
                    "Payment amount must "
                    "be greater than zero."
                )
            }), 400


        # ====================================================
        # GENERATE UNIQUE TX REF
        # ====================================================

        # We use the logged-in user's ID when supplied.
        user_id = data.get(
            "userId",
            buyer_email
        )


        tx_ref = generate_payment_reference(
            event_id,
            user_id
        )


        # ====================================================
        # CREATE PAYMENT RECORD
        # ====================================================

        payments = load_payments()


        payment_record = {

            "id": (
                max(
                    [
                        int(
                            p.get(
                                "id",
                                0
                            )
                        )
                        for p in payments
                        if str(
                            p.get(
                                "id",
                                ""
                            )
                        ).isdigit()
                    ],
                    default=0
                )
                + 1
            ),

            "txRef": tx_ref,

            "transactionId": None,

            "eventId": event_id,

            "eventTitle": event.get(
                "title",
                ""
            ),

            "ticketType": ticket_type,

            "quantity": quantity,

            "buyer": {

                "name": buyer_name,

                "email": buyer_email

            },

            "ticketPrice": ticket_price,

            "subtotal": subtotal,

            "serviceFee": service_fee,

            "serviceFeePercent":
                service_fee_percent,

            "amount": customer_total,

            "currency": "UGX",

            "status": "pending",

            "processed": False,

            "bookingId": None,

            "createdAt":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),

            "processedAt": None

        }


        payments.append(
            payment_record
        )


        save_payments(
            payments
        )


        # ====================================================
        # FLUTTERWAVE CHECKOUT
        # ====================================================

        payload = {

            "tx_ref": tx_ref,

            "amount": customer_total,

            "currency": "UGX",

            "redirect_url": (
                "http://localhost:5173/"
                "payment-success"
            ),

            "customer": {

                "email": buyer_email,

                "name": buyer_name

            },

            "customizations": {

                "title": "EventWaa",

                "description": (
                    f"Ticket for "
                    f"{event.get('title', 'Event')}"
                )

            },

            "meta": {

                "eventId": event_id,

                "ticketType": ticket_type,

                "quantity": quantity

            }

        }


        headers = {

            "Authorization":
                f"Bearer {FLW_SECRET_KEY}",

            "Content-Type":
                "application/json"

        }


        response = requests.post(

            f"{FLW_API_URL}/payments",

            headers=headers,

            json=payload,

            timeout=30

        )


        flutterwave_data = response.json()


        if (
            response.status_code >= 400
            or
            flutterwave_data.get("status")
            != "success"
        ):

            # Remove the unused pending
            # payment record if checkout
            # initialization failed.

            payments = load_payments()

            payments = [

                p

                for p in payments

                if p.get("txRef")
                != tx_ref

            ]

            save_payments(
                payments
            )


            return jsonify({

                "success": False,

                "message": (
                    flutterwave_data.get(
                        "message"
                    )
                    or
                    "Unable to initialize payment."
                )

            }), 400


        checkout_link = (
            flutterwave_data
            .get("data", {})
            .get("link")
        )


        if not checkout_link:

            return jsonify({

                "success": False,

                "message": (
                    "Flutterwave did not "
                    "return a checkout link."
                )

            }), 502


        # ====================================================
        # SUCCESS
        # ====================================================

        return jsonify({

            "success": True,

            "message":
                "Payment initialized successfully.",

            "payment": {

                "txRef": tx_ref,

                "amount":
                    customer_total,

                "currency":
                    "UGX",

                "checkoutLink":
                    checkout_link

            }

        }), 200


    except Exception as e:

        print(
            "FLUTTERWAVE INITIALIZE ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to initialize payment."

        }), 500

# ============================================================
# LOGIN
# ============================================================

@app.route(
    "/login",
    methods=["POST"]
)
def login():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "success": False,
            "message": "Login data is required."
        }), 400


    email = data.get("email")
    password = data.get("password")


    users = load_json_file(
        "users.json",
        []
    )


    for user in users:

        if (
            str(user.get("email"))
            .lower()
            ==
            str(email).lower()
        ):

            if "password" not in user:

                return jsonify({
                    "success": False,
                    "message": "This account uses Google Sign-in."
                })


            try:

                password_valid = check_password_hash(
                    user["password"],
                    password
                )

            except Exception:

                password_valid = False


            if password_valid:

                # ACCOUNT STATUS
                if user.get(
                    "status"
                ) == "suspended":

                    return jsonify({
                        "success": False,
                        "message": "Your account has been suspended. Contact support."
                    }), 403


                safe_user = user.copy()

                safe_user.pop(
                    "password",
                    None
                )


                return jsonify({
                    "success": True,
                    "message": "Login successful!",
                    "user": safe_user
                })


    return jsonify({
        "success": False,
        "message": "Invalid email or password"
    }), 401



# ============================================================
# GOOGLE LOGIN
# ============================================================

@app.route(
    "/google-login",
    methods=["POST"]
)
def google_login():

    data = request.get_json(
        silent=True
    )

    if not data or not data.get("token"):

        return jsonify({
            "success": False,
            "message": "Google token is required."
        }), 400


    token = data["token"]


    try:

        google_user = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            "599126937366-3ahr3cnmf73mpsci0rdqvb3bmmg6hqb2.apps.googleusercontent.com"
        )


        email = google_user["email"]

        name = google_user.get(
            "name",
            email.split("@")[0]
        )


        users = load_json_file(
            "users.json",
            []
        )


        for user in users:

            if user.get("email") == email:

                # Check account status.
                if user.get(
                    "status"
                ) == "suspended":

                    return jsonify({
                        "success": False,
                        "message": "Your account has been suspended. Contact support."
                    }), 403


                safe_user = user.copy()

                safe_user.pop(
                    "password",
                    None
                )


                return jsonify({
                    "success": True,
                    "user": safe_user
                })


        # Create new Google account.
        new_user = {

            "id": int(
                time.time() * 1000
            ),

            "name": name,

            "email": email,

            "provider": "google",

            "role": "user",

            "status": "active",

            "verifiedHost": False,

            "hostMode": False
        }


        users.append(new_user)

        save_json_file(
            "users.json",
            users
        )


        return jsonify({
            "success": True,
            "user": new_user
        })


    except Exception as e:

        print(
            "GOOGLE ERROR:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


# ============================================================
# CREATE EVENT
# ============================================================

# ============================================================
# CREATE EVENT
# ============================================================

@app.route(
    "/events",
    methods=["POST"]
)
def create_event():

    settings = load_admin_settings()

    data = request.form.to_dict()

    # --------------------------------------------------------
    # TICKET TYPES
    # --------------------------------------------------------

    tickets = []

    tickets_raw = data.get(
        "tickets",
        ""
    )

    if tickets_raw:

        try:

            tickets = json.loads(
                tickets_raw
            )

            if not isinstance(
                tickets,
                list
            ):
                tickets = []

        except (
            json.JSONDecodeError,
            TypeError
        ):

            tickets = []

    # --------------------------------------------------------
    # HOST CHECK
    # --------------------------------------------------------

    try:

        host_id = int(
            data.get(
                "hostId",
                0
            )
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "success": False,
            "message": "Invalid host ID."
        }), 400

    users = load_json_file(
        "users.json",
        []
    )

    host = None

    for user in users:

        try:

            if int(
                user.get(
                    "id",
                    0
                )
            ) == host_id:

                host = user
                break

        except (
            ValueError,
            TypeError
        ):

            continue

    if not host:

        return jsonify({
            "success": False,
            "message": "Host account not found."
        }), 404

    # --------------------------------------------------------
    # EVENT TYPE
    # --------------------------------------------------------

    event_type = data.get(
        "eventType",
        "Paid"
    )

    is_paid_event = (
        str(event_type).lower()
        == "paid"
    )

    # --------------------------------------------------------
    # HOST VERIFICATION
    # --------------------------------------------------------

    host_verification_required = settings.get(
        "hostVerification",
        True
    )

    community_hosts_allowed = settings.get(
        "communityHosts",
        False
    )

    host_verified = bool(
        host.get(
            "verifiedHost",
            False
        )
    )

    host_is_community = bool(
        host.get(
            "communityHost",
            False
        )
    )

    if is_paid_event:

        if host_verification_required:

            if not host_verified:

                if not (
                    community_hosts_allowed
                    and host_is_community
                ):

                    return jsonify({
                        "success": False,
                        "message": (
                            "You must be a verified host "
                            "before creating paid events."
                        )
                    }), 403

    # --------------------------------------------------------
    # VALIDATE TICKETS FOR PAID EVENTS
    # --------------------------------------------------------

    if is_paid_event:

        cleaned_tickets = []

        for ticket in tickets:

            if not isinstance(
                ticket,
                dict
            ):
                continue

            name = str(
                ticket.get(
                    "name",
                    ""
                )
            ).strip()

            price = str(
                ticket.get(
                    "price",
                    ""
                )
            ).strip()

            quantity = str(
                ticket.get(
                    "quantity",
                    ""
                )
            ).strip()

            if not name:

                continue

            try:

                ticket_price = int(
                    float(price)
                )

                ticket_quantity = int(
                    float(quantity)
                )

            except (
                ValueError,
                TypeError
            ):

                return jsonify({
                    "success": False,
                    "message": (
                        f"Invalid ticket information "
                        f"for '{name}'."
                    )
                }), 400

            if ticket_price < 0:

                return jsonify({
                    "success": False,
                    "message": (
                        f"Ticket price for '{name}' "
                        "cannot be negative."
                    )
                }), 400

            if ticket_quantity <= 0:

                return jsonify({
                    "success": False,
                    "message": (
                        f"Ticket quantity for '{name}' "
                        "must be greater than zero."
                    )
                }), 400

            cleaned_tickets.append({
                "name": name,
                "price": str(ticket_price),
                "quantity": str(ticket_quantity)
            })

        if len(cleaned_tickets) == 0:

            return jsonify({
                "success": False,
                "message": (
                    "A paid event must have "
                    "at least one ticket type."
                )
            }), 400

        tickets = cleaned_tickets

    else:

        # Free events do not need paid ticket types.
        tickets = []

    # ========================================================
    # EVENT POSTER
    # ========================================================

    upload_folder = "uploads/events"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    poster_url = ""

    if "poster" in request.files:

        poster = request.files["poster"]

        if poster and poster.filename:

            filename = (
                f"{int(time.time() * 1000)}_"
                f"{secure_filename(poster.filename)}"
            )

            filepath = os.path.join(
                upload_folder,
                filename
            )

            poster.save(filepath)

            # Store ONLY the relative path.
            # EventCard will add the backend URL.
            poster_url = f"/uploads/events/{filename}"

    # --------------------------------------------------------
    # LOAD EVENTS
    # --------------------------------------------------------

    events = load_json_file(
        "events.json",
        []
    )

    # --------------------------------------------------------
    # GENERATE EVENT ID
    # --------------------------------------------------------

    if events:

        try:

            event_id = max(
                int(
                    event.get(
                        "id",
                        0
                    )
                )
                for event in events
            ) + 1

        except (
            ValueError,
            TypeError
        ):

            event_id = len(events) + 1

    else:

        event_id = 1

    # --------------------------------------------------------
    # CREATE EVENT
    # --------------------------------------------------------

    event = {

        "id": event_id,

        "title": data.get(
            "title",
            ""
        ),

        "description": data.get(
            "description",
            ""
        ),

        "venue": data.get(
            "venue",
            ""
        ),

        "city": data.get(
            "city",
            ""
        ),

        "category": data.get(
            "category",
            ""
        ),

        "date": data.get(
            "date",
            ""
        ),

        "startTime": data.get(
            "startTime",
            ""
        ),

        "endTime": data.get(
            "endTime",
            ""
        ),

        "capacity": data.get(
            "capacity",
            ""
        ),

        "contact": data.get(
            "contact",
            ""
        ),

        "eventType": event_type,

        "ticketType": (
            "Free"
            if str(event_type).lower() == "free"
            else "Paid"
        ),

        # ----------------------------------------------------
        # TICKET TYPES ARE NOW THE PRICE SOURCE
        # ----------------------------------------------------

        "tickets": tickets,

        "organizerName": data.get(
            "organizerName",
            ""
        ),

        "hostId": host_id,

        "hostName": data.get(
            "hostName",
            host.get(
                "name",
                ""
            )
        ),

        "hostEmail": data.get(
            "hostEmail",
            host.get(
                "email",
                ""
            )
        ),

        "verifiedHost": host_verified,

        "eventPoster": poster_url,

        "image": poster_url,

        "ticketsSold": 0,

        "revenue": 0,

        "status": "published",

        "featured": False
    }

    # --------------------------------------------------------
    # SAVE EVENT
    # --------------------------------------------------------

    events.append(
        event
    )

    save_json_file(
        "events.json",
        events
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return jsonify({
        "success": True,
        "message": "Event published successfully.",
        "event": event
    }), 201


# ============================================================
# GET ALL EVENTS
# ============================================================

@app.route(
    "/events",
    methods=["GET"]
)
def get_events():

    events = load_json_file(
        "events.json",
        []
    )

    return jsonify(
        events
    )


# ============================================================
# GET SINGLE EVENT
# ============================================================

@app.route(
    "/events/<int:event_id>",
    methods=["GET"]
)
def get_event(event_id):

    events = load_json_file(
        "events.json",
        []
    )

    for event in events:

        try:

            if int(
                event.get(
                    "id",
                    0
                )
            ) == event_id:

                return jsonify(
                    event
                )

        except (
            ValueError,
            TypeError
        ):

            continue

    return jsonify({
        "success": False,
        "message": "Event not found"
    }), 404


# ============================================================
# FEATURE / UNFEATURE EVENT
# ============================================================

@app.route(
    "/admin/events/<int:event_id>/feature",
    methods=["PUT"]
)
def toggle_featured_event(event_id):

    events = load_json_file(
        "events.json",
        []
    )

    updated_event = None

    for event in events:

        try:

            if int(
                event.get(
                    "id",
                    0
                )
            ) == event_id:

                event["featured"] = not bool(
                    event.get(
                        "featured",
                        False
                    )
                )

                updated_event = event

                break

        except (
            ValueError,
            TypeError
        ):

            continue

    if not updated_event:

        return jsonify({
            "success": False,
            "message": "Event not found"
        }), 404

    save_json_file(
        "events.json",
        events
    )

    return jsonify({
        "success": True,
        "event": updated_event
    })


# ============================================================
# UPDATE EVENT
# ============================================================

@app.route(
    "/events/<int:event_id>",
    methods=["PUT"]
)
def update_event(event_id):

    events = load_json_file(
        "events.json",
        []
    )

    data = request.get_json(
        silent=True
    ) or {}

    for event in events:

        try:

            if int(
                event.get(
                    "id",
                    0
                )
            ) != event_id:

                continue

        except (
            ValueError,
            TypeError
        ):

            continue

        # ----------------------------------------------------
        # REMOVE OLD EVENT-LEVEL PRICE
        # ----------------------------------------------------

        data.pop(
            "price",
            None
        )

        # ----------------------------------------------------
        # TICKET TYPES
        # ----------------------------------------------------

        if "tickets" in data:

            tickets = data.get(
                "tickets"
            )

            if not isinstance(
                tickets,
                list
            ):

                tickets = []

            cleaned_tickets = []

            for ticket in tickets:

                if not isinstance(
                    ticket,
                    dict
                ):
                    continue

                name = str(
                    ticket.get(
                        "name",
                        ""
                    )
                ).strip()

                price = str(
                    ticket.get(
                        "price",
                        ""
                    )
                ).strip()

                quantity = str(
                    ticket.get(
                        "quantity",
                        ""
                    )
                ).strip()

                if not name:
                    continue

                try:

                    ticket_price = int(
                        float(price)
                    )

                    ticket_quantity = int(
                        float(quantity)
                    )

                except (
                    ValueError,
                    TypeError
                ):

                    return jsonify({
                        "success": False,
                        "message": (
                            f"Invalid ticket information "
                            f"for '{name}'."
                        )
                    }), 400

                cleaned_tickets.append({
                    "name": name,
                    "price": str(ticket_price),
                    "quantity": str(ticket_quantity)
                })

            data["tickets"] = cleaned_tickets

        # ----------------------------------------------------
        # UPDATE
        # ----------------------------------------------------

        event.update(
            data
        )

        # ----------------------------------------------------
        # ENSURE EVENT HAS NO OLD PRICE FIELD
        # ----------------------------------------------------

        event.pop(
            "price",
            None
        )

        save_json_file(
            "events.json",
            events
        )

        return jsonify({
            "success": True,
            "message": "Event updated successfully.",
            "event": event
        })

    return jsonify({
        "success": False,
        "message": "Event not found"
    }), 404


# ============================================================
# DELETE EVENT
# ============================================================

@app.route(
    "/events/<int:event_id>",
    methods=["DELETE"]
)
def delete_event(event_id):

    events = load_json_file(
        "events.json",
        []
    )

    original_length = len(
        events
    )

    events = [
        event
        for event in events
        if int(
            event.get(
                "id",
                0
            )
        ) != event_id
    ]

    if len(events) == original_length:

        return jsonify({
            "success": False,
            "message": "Event not found"
        }), 404

    save_json_file(
        "events.json",
        events
    )

    return jsonify({
        "success": True,
        "message": "Event deleted successfully"
    })
# ============================================================
# UPLOADS
# ============================================================

@app.route(
    "/uploads/<path:filename>"
)
def uploaded_file(filename):

    return send_from_directory(
        "uploads",
        filename
    )
# ============================================================
# EVENT BOOKING COUNTER
# ============================================================

@app.route(
    "/events/<int:event_id>/book",
    methods=["PUT"]
)
def update_event_booking(event_id):

    events = load_json_file(
        "events.json",
        []
    )


    if not events:

        return jsonify({
            "success": False,
            "message": "No events found"
        }), 404


    data = request.get_json(
        silent=True
    ) or {}


    quantity = int(
        data.get(
            "quantity",
            1
        )
    )


    total_price = int(
        data.get(
            "totalPrice",
            0
        )
    )


    ticket_type = data.get(
        "ticketType"
    )


    for event in events:

        if int(
            event.get("id", 0)
        ) == event_id:

            # Check inventory BEFORE increasing counters.
            if "tickets" in event:

                for ticket in event["tickets"]:

                    if ticket.get("name") == ticket_type:

                        if "remaining" not in ticket:

                            ticket["remaining"] = int(
                                ticket.get(
                                    "quantity",
                                    0
                                )
                            )


                        if ticket["remaining"] < quantity:

                            return jsonify({
                                "success": False,
                                "message": (
                                    f"Only "
                                    f"{ticket['remaining']} "
                                    f"tickets remaining."
                                )
                            }), 400


                        ticket["remaining"] -= quantity

                        break


            event["ticketsSold"] = (
                int(
                    event.get(
                        "ticketsSold",
                        0
                    )
                )
                + quantity
            )


            event["revenue"] = (
                int(
                    event.get(
                        "revenue",
                        0
                    )
                )
                + total_price
            )


            save_json_file(
                "events.json",
                events
            )


            return jsonify({
                "success": True,
                "message": "Booking completed and inventory updated."
            })


    return jsonify({
        "success": False,
        "message": "Event not found"
    }), 404



# ============================================================
# BOOKINGS GET
# ============================================================

@app.route(
    "/bookings",
    methods=["GET"]
)
def get_bookings():

    return jsonify(
        load_json_file(
            "bookings.json",
            []
        )
    )

# ============================================================
# REFUND HELPERS
# ============================================================
def find_booking(booking_id):
    bookings = load_json_file("bookings.json", [])
    for booking in bookings:
        if str(booking.get("id")) == str(booking_id):
            return booking, bookings
    return None, bookings
def find_host_for_event(event):
    host_email = event.get("hostEmail")
    if not host_email:
        return None
    users = load_json_file("users.json", [])
    for user in users:
        if user.get("email") == host_email:
            return user
    return None
def find_host_wallet(host_id):
    wallets = load_host_wallets()
    for wallet in wallets:
        if str(wallet.get("hostId")) == str(host_id):
            return wallet, wallets
    return None, wallets
def refund_booking_money(booking, event):
    """
    Calculate the amount that should actually be refunded.

    Example:
    Ticket amount = UGX 10,000
    Refund fee = 20%
    Refund fee = UGX 2,000
    Customer receives = UGX 8,000
    """

    settings = load_admin_settings()

    original_amount = int(
        booking.get("totalPrice", 0)
    )

    refund_fee_percent = float(
        settings.get("refundFeePercent", 20)
    )

    # Protect against invalid admin settings
    if refund_fee_percent < 0:
        refund_fee_percent = 0

    if refund_fee_percent > 100:
        refund_fee_percent = 100

    refund_fee = round(
        original_amount * refund_fee_percent / 100
    )

    refund_amount = max(
        0,
        original_amount - refund_fee
    )

    return {
        "originalAmount": original_amount,
        "refundFeePercent": refund_fee_percent,
        "refundFee": refund_fee,
        "totalAmount": refund_amount
    }
# ============================================================
# REFUND SYSTEM
# ============================================================

# ------------------------------------------------------------
# CREATE REFUND REQUEST
# USER -> HOST
# ------------------------------------------------------------

@app.route("/refunds", methods=["POST"])
def create_refund():

    data = request.get_json(silent=True) or {}

    booking_id = data.get("bookingId")

    reason = data.get(
        "reason",
        "Customer requested a refund."
    )

    details = data.get(
        "details",
        ""
    )

    if not booking_id:

        return jsonify({
            "success": False,
            "message": "Booking ID is required."
        }), 400

    # ========================================================
    # LOAD BOOKINGS
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    booking = None

    for current_booking in bookings:

        if str(
            current_booking.get("id")
        ) == str(booking_id):

            booking = current_booking
            break

    if not booking:

        return jsonify({
            "success": False,
            "message": "Booking not found."
        }), 404

    # ========================================================
    # PREVENT DUPLICATE REFUNDS
    # ========================================================

    if booking.get("refundStatus") in [
        "pending",
        "refunded",
        "rejected"
    ]:

        return jsonify({
            "success": False,
            "message": (
                "This booking already has a refund request "
                "or has already been processed."
            )
        }), 400

    # ========================================================
    # ADMIN REFUND SETTINGS
    # ========================================================

    settings = load_admin_settings()

    # Admin controls whether hosts are allowed
    # to issue refunds.

    if not settings.get(
        "hostRefunds",
        True
    ):

        return jsonify({
            "success": False,
            "message": (
                "Host refunds are currently disabled."
            )
        }), 403

    # ========================================================
    # FIND EVENT
    # ========================================================

    events = load_json_file(
        "events.json",
        []
    )

    event = None

    for current_event in events:

        if str(
            current_event.get("id")
        ) == str(
            booking.get("eventId")
        ):

            event = current_event
            break

    if not event:

        return jsonify({
            "success": False,
            "message": "Event not found."
        }), 404

    # ========================================================
    # CHECK REFUND DEADLINE
    # CUSTOMER MUST REQUEST AT LEAST 5 DAYS BEFORE EVENT
    # ========================================================

    event_date = event.get("date")

    if not event_date:

        return jsonify({
            "success": False,
            "message": (
                "This event does not have a valid event date, "
                "so a refund cannot be requested."
            )
        }), 400

    try:

        event_datetime = datetime.strptime(
            event_date,
            "%Y-%m-%d"
        )

        days_until_event = (
            event_datetime.date()
            - datetime.now().date()
        ).days

        if days_until_event < 5:

            return jsonify({
                "success": False,
                "message": (
                    "Refund requests must be made "
                    "at least 5 days before the event."
                )
            }), 400

    except ValueError:

        return jsonify({
            "success": False,
            "message": (
                "The event has an invalid date format."
            )
        }), 400

    # ========================================================
    # DON'T ALLOW REFUND AFTER CHECK-IN
    # ========================================================

    if booking.get(
        "checkedIn",
        False
    ):

        return jsonify({
            "success": False,
            "message": (
                "Checked-in tickets cannot be refunded."
            )
        }), 400

    # ========================================================
    # QUANTITY
    # ========================================================

    quantity = int(
        booking.get(
            "quantity",
            1
        ) or 1
    )

    if quantity <= 0:
        quantity = 1

    # ========================================================
    # REFUND CALCULATION
    # ========================================================

    original_amount = int(
        booking.get(
            "totalPrice",
            0
        ) or 0
    )

    # Default refund fee = 20%
    refund_fee_percent = float(
        settings.get(
            "refundFeePercent",
            20
        )
    )

    refund_fee = round(
        original_amount
        * refund_fee_percent
        / 100
    )

    refund_amount = max(
        0,
        original_amount - refund_fee
    )

    # ========================================================
    # CREATE REFUND RECORD
    # ========================================================

    refunds = load_json_file(
        "refunds.json",
        []
    )

    refund_id = len(refunds) + 1

    refund = {

        "id": refund_id,

        "bookingId": booking.get(
            "id"
        ),

        "ticketId": booking.get(
            "ticketId"
        ),

        "eventId": booking.get(
            "eventId"
        ),

        "eventTitle": booking.get(
            "eventTitle",
            event.get("title")
        ),

        "buyer": booking.get(
            "buyer"
        ),

        "ticketType": booking.get(
            "ticketType"
        ),

        "quantity": quantity,

        # ORIGINAL PRICE
        "originalAmount": original_amount,

        # REFUND POLICY
        "refundFeePercent": refund_fee_percent,

        # MONEY KEPT AS REFUND FEE
        "refundFee": refund_fee,

        # MONEY CUSTOMER WILL RECEIVE
        "amount": refund_amount,

        "reason": reason,

        "details": details,

        # HOST MUST REVIEW
        "status": "pending",

        "createdAt": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    }

    refunds.append(
        refund
    )

    save_json_file(
        "refunds.json",
        refunds
    )

    # ========================================================
    # UPDATE BOOKING
    # ========================================================

    booking["refundStatus"] = "pending"

    booking["refundId"] = refund_id

    booking["refundRequestedAt"] = (
        refund["createdAt"]
    )

    save_json_file(
        "bookings.json",
        bookings
    )

    # ========================================================
    # NOTIFY HOST
    # ========================================================

    host_id = event.get(
        "hostId"
    )

    if host_id:

        create_notification(

            host_id,

            "New refund request",

            (
                f"A refund request of UGX "
                f"{refund['amount']:,} "
                f"was submitted for "
                f"{refund['eventTitle']}."
            ),

            "refund_request",

            "/host/refunds"

        )

    # ========================================================
    # RESPONSE
    # ========================================================

    return jsonify({

        "success": True,

        "message": (
            "Refund request submitted "
            "to the event host for review."
        ),

        "refund": refund

    }), 201

# ============================================================
# GET HOST REFUND REQUESTS
# ============================================================

# ============================================================
# HOST REFUNDS
# ============================================================

@app.route("/refunds/host", methods=["GET"])
def get_host_refunds():

    host_email = request.args.get(
        "email",
        ""
    ).strip().lower()

    if not host_email:
        return jsonify({
            "success": False,
            "message": "Host email is required.",
            "refunds": []
        }), 400

    refunds = load_json_file(
        "refunds.json",
        []
    )

    events = load_json_file(
        "events.json",
        []
    )

    host_refunds = []

    for refund in refunds:

        event_id = refund.get("eventId")

        refund_host_email = str(
            refund.get(
                "hostEmail",
                ""
            )
        ).strip().lower()

        if refund_host_email == host_email:
            host_refunds.append(refund)
            continue

        for event in events:

            if str(
                event.get("id")
            ) == str(event_id):

                event_host_email = str(
                    event.get(
                        "hostEmail",
                        ""
                    )
                ).strip().lower()

                if event_host_email == host_email:

                    refund["hostEmail"] = event_host_email
                    refund["hostId"] = event.get("hostId")
                    refund["hostName"] = event.get("hostName")

                    host_refunds.append(refund)

                break

    return jsonify({
        "success": True,
        "refunds": host_refunds
    }), 200


@app.route(
    "/refunds/<int:refund_id>/host-review",
    methods=["PUT"]
)
def host_review_refund(refund_id):
    data = request.get_json(
        silent=True
    ) or {}
    action = data.get("action")
    host_email = str(
        data.get("hostEmail", "")
    ).strip().lower()
    note = data.get(
        "note",
        ""
    )
    # ========================================================
    # VALIDATION
    # ========================================================
    if action not in [
        "approve",
        "reject"
    ]:
        return jsonify({
            "success": False,
            "message": "Action must be approve or reject."
        }), 400
    if not host_email:
        return jsonify({
            "success": False,
            "message": "Host email is required."
        }), 400
    # ========================================================
    # LOAD DATA
    # ========================================================
    refunds = load_json_file(
        "refunds.json",
        []
    )
    bookings = load_json_file(
        "bookings.json",
        []
    )
    events = load_json_file(
        "events.json",
        []
    )
    users = load_json_file(
        "users.json",
        []
    )
    host_wallets = load_host_wallets()

    settings = load_admin_settings ()
    # ========================================================
    # FIND REFUND
    # ========================================================
    refund = None
    for current_refund in refunds:
        try:
            current_id = int(
                current_refund.get(
                    "id",
                    0
                )
            )
        except (
            ValueError,
            TypeError
        ):
            current_id = 0
        if current_id == int(refund_id):
            refund = current_refund
            break
    if not refund:
        return jsonify({
            "success": False,
            "message": "Refund request not found."
        }), 404
    # ========================================================
    # ONLY PENDING REFUNDS
    # ========================================================
    if refund.get("status") != "pending":
        return jsonify({
            "success": False,
            "message": (
                "This refund has already been processed."
            )
        }), 400
    # ========================================================
    # FIND EVENT
    # ========================================================
    event = None
    for current_event in events:
        if str(
            current_event.get("id")
        ) == str(
            refund.get("eventId")
        ):
            event = current_event
            break
    if not event:
        return jsonify({
            "success": False,
            "message": "Event not found."
        }), 404
    # ========================================================
    # VERIFY HOST OWNS EVENT
    # ========================================================
    event_host_email = str(
        event.get(
            "hostEmail",
            ""
        )
    ).strip().lower()
    if event_host_email != host_email:
        return jsonify({
            "success": False,
            "message": (
                "You are not authorized to "
                "process this refund."
            )
        }), 403
    # ========================================================
    # FIND BOOKING
    # ========================================================
    booking = None
    for current_booking in bookings:
        if str(
            current_booking.get("id")
        ) == str(
            refund.get("bookingId")
        ):
            booking = current_booking
            break
    if not booking:
        return jsonify({
            "success": False,
            "message": (
                "Booking associated with refund "
                "was not found."
            )
        }), 404
    # ========================================================
    # CHECKED-IN TICKET
    # ========================================================
    if booking.get(
        "checkedIn",
        False
    ):
        return jsonify({
            "success": False,
            "message": (
                "Checked-in tickets cannot be refunded."
            )
        }), 400
    # ========================================================
    # REJECT REFUND
    # ========================================================
    if action == "reject":
        processed_at = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        refund["status"] = "rejected"
        refund["reviewedAt"] = processed_at
        refund["reviewedBy"] = host_email
        refund["reviewNote"] = (
            note
            or
            "Refund rejected by event host."
        )
        booking["refundStatus"] = "rejected"
        save_json_file(
            "refunds.json",
            refunds
        )
        save_json_file(
            "bookings.json",
            bookings
        )
        # ====================================================
        # NOTIFY CUSTOMER
        # ====================================================
        buyer = booking.get(
            "buyer"
        ) or {}
        buyer_id = buyer.get(
            "id"
        )
        if buyer_id:
            create_notification(
                buyer_id,
                "Refund rejected",
                (
                    f"Your refund request for "
                    f"{refund.get('eventTitle', 'the event')} "
                    f"was rejected by the event host."
                ),
                "refund_rejected",
                "/tickets"
            )
        return jsonify({
            "success": True,
            "message": (
                "Refund rejected successfully."
            ),
            "refund": refund
        }), 200
    # ========================================================
    # APPROVE REFUND
    # ========================================================

    money = refund_booking_money(
        booking,
        event
    )

    original_amount = int(
        money.get(
            "originalAmount",
            0
        )
    )

    # ========================================================
    # REFUND ACCOUNTING
    # ========================================================

    ticket_price = int(
        booking.get(
            "ticketPrice",
            0
        )
    )

    if ticket_price <= 0:

        return jsonify({
            "success": False,
            "message": "Invalid ticket price."
        }), 400

    # Original ticket value
    original_amount = ticket_price

    # Customer gets 80%
    refund_amount = int(
        ticket_price * 0.80
    )

    # EventWaa commission (10%)
    commission_amount = int(
        ticket_price
        * float(
            settings.get(
                "commission",
                10
            )
        )
        / 100
    )

    # Host originally earned
    host_original_earning = (
        ticket_price
        - commission_amount
    )

    # Host keeps after refund
    host_retained_amount = (
        host_original_earning
        - refund_amount
    )

    # Refund policy display
    refund_fee_percent = 20.0
    refund_fee = original_amount - refund_amount

    # ========================================================
    # GET HOST ID FROM EVENT
    # ========================================================
    host_id = event.get(
        "hostId"
    )
    if not host_id:
        return jsonify({
            "success": False,
            "message": "Event host ID is missing."
        }), 400
    try:
        host_id = int(
            host_id
        )
    except (
        TypeError,
        ValueError
    ):
        return jsonify({
            "success": False,
            "message": "Invalid event host ID."
        }), 400
    # ========================================================
    # FIND HOST WALLET
    # ========================================================

    wallets = load_host_wallets()

    host_wallet = None


    for current_wallet in wallets:

        try:

            wallet_host_id = int(
                current_wallet.get(
                    "hostId",
                    0
                )
            )

        except (
            TypeError,
            ValueError
        ):

            wallet_host_id = 0


        if wallet_host_id == host_id:

            host_wallet = current_wallet

            break


    if not host_wallet:

        return jsonify({

            "success": False,

            "message": (
                f"Host wallet not found for "
                f"host ID {host_id}."
            )

        }), 404
    
    # ========================================================
    # CREATE HOST WALLET IF MISSING
    # ========================================================
    if not host_wallet:
        host_wallet = {
            "hostId": host_id,
            "availableBalance": 0,
            "pendingPayouts": 0,
            "totalEarned": 0,
            "totalWithdrawn": 0,
            "withdrawals": [],
            "scheduledPayouts": [],
            "transactions": [],
            "refunds": 0
        }
        host_wallets.append(
            host_wallet
        )
    # ========================================================
    # HOST WALLET BALANCES
    # ========================================================
    available_balance = int(
        host_wallet.get(
            "availableBalance",
            0
        ) or 0
    )
    pending_balance = int(
        host_wallet.get(
            "pendingPayouts",
            0
        ) or 0
    )
    host_total_funds = (
        available_balance
        +
        pending_balance
    )
    # ========================================================
    # IMPORTANT
    #
    # The host should only be responsible for the money
    # that actually went to the host.
    #
    # Example:
    #
    # Ticket price       = 10,000
    # EventWaa commission = 1,000
    # Host receives      = 9,000
    # Service fee        = 500
    # Customer pays      = 10,500
    #
    # Therefore the host wallet should NOT be expected
    # to contain the full 10,500.
    #
    # For now we calculate the host-side refund portion
    # from the original ticket amount.
    # ========================================================
    ticket_amount = int(
        money.get(
            "originalAmount",
            booking.get(
                "ticketPrice",
                0
            )
        )
        or 0
    )
    settings = load_admin_settings()
    commission_percent = float(
        settings.get(
            "commission",
            10
        )
    )
    host_original_amount = int(
        ticket_amount
        -
        (
            ticket_amount
            * commission_percent
            / 100
        )
    )
    # ========================================================
    # HOST REFUND PORTION
    # ========================================================
    host_refund_amount = min(
        host_original_amount,
        refund_amount
    )
    # ========================================================
    # CHECK HOST HAS ENOUGH FUNDS
    # ========================================================
    if host_total_funds < host_refund_amount:
        return jsonify({
            "success": False,
            "message": (
                "The host does not have enough "
                "funds available to cover the "
                "host portion of this refund."
            ),
            "wallet": {
                "availableBalance":
                    available_balance,
                "pendingPayouts":
                    pending_balance,
                "totalFunds":
                    host_total_funds,
                "hostRefundRequired":
                    host_refund_amount
            }
        }), 400
    # ========================================================
    # DEDUCT HOST REFUND
    #
    # AVAILABLE FIRST
    # THEN PENDING
    # ========================================================
    remaining_refund = host_refund_amount
    available_used = min(
        available_balance,
        remaining_refund
    )
    host_wallet["availableBalance"] = (
        available_balance
        -
        available_used
    )
    remaining_refund -= available_used
    pending_used = 0
    if remaining_refund > 0:
        pending_used = min(
            pending_balance,
            remaining_refund
        )
        host_wallet["pendingPayouts"] = (
            pending_balance
            -
            pending_used
        )
        remaining_refund -= pending_used
    # ========================================================
    # SAFETY CHECK
    # ========================================================
    if remaining_refund > 0:
        return jsonify({
            "success": False,
            "message": (
                "Unable to complete refund because "
                "wallet funds changed."
            )
        }), 400
    # ========================================================
    # UPDATE HOST WALLET
    # ========================================================
    host_wallet["totalEarned"] = max(
        0,
        int(
            host_wallet.get(
                "totalEarned",
                0
            )
        )
        -
        host_refund_amount
    )
    host_wallet["refunds"] = (
        int(
            host_wallet.get(
                "refunds",
                0
            )
        )
        +
        host_refund_amount
    )
    # ========================================================
    # WALLET TRANSACTION
    # ========================================================
    host_wallet.setdefault(
        "transactions",
        []
    )
    processed_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    buyer = booking.get(
        "buyer"
    ) or {}
    host_wallet["transactions"].insert(
        0,
        {
            "type": "refund",
            "eventId": event.get(
                "id"
            ),
            "eventTitle": refund.get(
                "eventTitle",
                event.get("title")
            ),
            "amount": -host_refund_amount,
            "originalAmount":
                original_amount,
            "refundAmount":
                refund_amount,
            "hostRefundAmount":
                host_refund_amount,
            "availableUsed":
                available_used,
            "pendingUsed":
                pending_used,
            "refundFeePercent":
                refund_fee_percent,
            "refundFee":
                refund_fee,
            "date":
                processed_at,
            "description": (
                f"Refund issued to "
                f"{buyer.get('name', 'customer')}"
            )
        }
    )
    # ========================================================
    # SAVE HOST WALLET
    # ========================================================
    save_json_file(
        "host_wallets.json",
        host_wallets
    )
    # ========================================================
    # UPDATE REFUND
    # ========================================================
    refund["status"] = "refunded"
    refund["originalAmount"] = (
        original_amount
    )
    refund["refundFeePercent"] = (
        refund_fee_percent
    )
    refund["refundFee"] = (
        refund_fee
    )
    refund["amount"] = (
        refund_amount
    )
    refund["refundAmount"] = (
        refund_amount
    )
    refund["hostRefundAmount"] = (
        host_refund_amount
    )
    refund["processedBy"] = (
        host_email
    )
    refund["reviewedBy"] = (
        host_email
    )
    refund["processedAt"] = (
        processed_at
    )
    refund["reviewedAt"] = (
        processed_at
    )
    refund["reviewNote"] = (
        note
        or
        "Refund approved and processed "
        "by event host."
    )
    # ========================================================
    # UPDATE BOOKING
    # ========================================================
    booking["refundStatus"] = (
        "refunded"
    )
    booking["refundId"] = (
        refund_id
    )
    booking["refundedAt"] = (
        processed_at
    )
    booking["refundAmount"] = (
        refund_amount
    )
    booking["refundFee"] = (
        refund_fee
    )

    # ========================================================
    # RESTORE EVENT INVENTORY
    # ========================================================

    quantity = int(
        booking.get(
            "quantity",
            refund.get(
                "quantity",
                1
            )
        ) or 1
    )

    if quantity <= 0:
        quantity = 1

    for current_event in events:

        if str(
            current_event.get("id")
        ) == str(
            booking.get("eventId")
        ):

            # ----------------------------------------------------
            # REDUCE TICKETS SOLD
            # ----------------------------------------------------

            current_event["ticketsSold"] = max(
                0,
                int(
                    current_event.get(
                        "ticketsSold",
                        0
                    )
                ) - quantity
            )

            # ----------------------------------------------------
            # IMPORTANT:
            # EVENT REVENUE REPRESENTS THE HOST'S NET EARNINGS.
            # Therefore subtract ONLY THE CUSTOMER REFUND AMOUNT.
            #
            # Example:
            # Host earned 9,000
            # Refund = 8,000
            # Remaining host revenue = 1,000
            # ----------------------------------------------------

            current_event["revenue"] = max(
                0,
                int(
                    current_event.get(
                        "revenue",
                        0
                    )
                ) - refund_amount
            )

            # ----------------------------------------------------
            # RESTORE TICKET INVENTORY
            # ----------------------------------------------------

            ticket_type = booking.get(
                "ticketType"
            )

            for ticket in current_event.get(
                "tickets",
                []
            ):

                if str(
                    ticket.get(
                        "name",
                        ""
                    )
                ).strip().lower() == str(
                    ticket_type or ""
                ).strip().lower():

                    ticket["remaining"] = (
                        int(
                            ticket.get(
                                "remaining",
                                0
                            )
                        ) + quantity
                    )

                    break

        break



    # ========================================================
    # SAVE EVERYTHING
    # ========================================================
    save_json_file(
        "events.json",
        events
    )
    save_json_file(
        "bookings.json",
        bookings
    )
    save_json_file(
        "refunds.json",
        refunds
    )
    # ========================================================
    # NOTIFY CUSTOMER
    # ========================================================
    buyer_id = buyer.get(
        "id"
    )
    if buyer_id:
        create_notification(
            buyer_id,
            "Refund approved",
            (
                f"Your refund of UGX "
                f"{refund_amount:,} "
                f"for "
                f"{refund.get('eventTitle', 'the event')} "
                f"has been approved."
            ),
            "refund_approved",
            "/tickets"
        )
    # ========================================================
    # RESPONSE
    # ========================================================
    return jsonify({
        "success": True,
        "message": (
            f"Refund of UGX "
            f"{refund_amount:,} "
            f"issued successfully."
        ),
        "refund": refund,
        "money": {
            "originalAmount":
                original_amount,
            "refundFeePercent":
                refund_fee_percent,
            "refundFee":
                refund_fee,
            "refundAmount":
                refund_amount,
            "hostRefundAmount":
                host_refund_amount,
            "availableUsed":
                available_used,
            "pendingUsed":
                pending_used
        },
        "wallet": {
            "availableBalance":
                host_wallet.get(
                    "availableBalance",
                    0
                ),
            "pendingPayouts":
                host_wallet.get(
                    "pendingPayouts",
                    0
                )
        }
    }), 200


# ============================================================
# ADMIN — GET ALL REFUNDS
# ============================================================

@app.route(
    "/admin/refunds",
    methods=["GET"]
)
def get_admin_refunds():

    try:

        refunds = load_json_file(
            "refunds.json",
            []
        )

        return jsonify({
            "success": True,
            "refunds": refunds
        }), 200

    except Exception as e:

        print(
            "ADMIN REFUNDS ERROR:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": "Failed to load refunds."
        }), 500

# ============================================================
# CREATE BOOKING
# ============================================================

@app.route(
    "/bookings",
    methods=["POST"]
)
def create_booking():

    data = request.get_json(
        silent=True
    ) or {}


    # --------------------------------------------------------
    # LOAD DATA
    # --------------------------------------------------------

    bookings = load_json_file(
        "bookings.json",
        []
    )

    events = load_json_file(
        "events.json",
        []
    )


    # --------------------------------------------------------
    # VALIDATE QUANTITY
    # --------------------------------------------------------

    try:

        quantity = int(
            data.get(
                "quantity",
                1
            )
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "success": False,
            "message": "Invalid ticket quantity."
        }), 400


    if quantity <= 0:

        return jsonify({
            "success": False,
            "message": "Invalid ticket quantity."
        }), 400


    # --------------------------------------------------------
    # FIND EVENT
    # --------------------------------------------------------

    event = None

    for current_event in events:

        if str(
            current_event.get("id")
        ) == str(
            data.get("eventId")
        ):

            event = current_event

            break


    if not event:

        return jsonify({
            "success": False,
            "message": "Event not found."
        }), 404


    # --------------------------------------------------------
    # FIND TICKET TYPE
    # --------------------------------------------------------

    ticket_type = data.get(
        "ticketType"
    )

    selected_ticket = None

    for ticket in event.get(
        "tickets",
        []
    ):

        if str(
            ticket.get("name", "")
        ).strip().lower() == str(
            ticket_type or ""
        ).strip().lower():

            selected_ticket = ticket

            break


    if not selected_ticket:

        return jsonify({
            "success": False,
            "message": "Selected ticket type not found."
        }), 404


    # --------------------------------------------------------
    # CALCULATE TICKET PRICE FROM SERVER
    #
    # NEVER TRUST THE FRONTEND TOTAL
    # --------------------------------------------------------

    try:

        ticket_price = int(
            float(
                selected_ticket.get(
                    "price",
                    0
                )
            )
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "success": False,
            "message": "Invalid ticket price."
        }), 400


    if ticket_price < 0:

        return jsonify({
            "success": False,
            "message": "Invalid ticket price."
        }), 400


    subtotal = (
        ticket_price
        *
        quantity
    )


    # ========================================================
    # SERVICE FEE
    # ========================================================

    service_fee_percent = 5.0

    service_fee = int(
        subtotal
        *
        service_fee_percent
        /
        100
    )


    customer_total = (
        subtotal
        +
        service_fee
    )


    # ========================================================
    # EVENTWAA COMMISSION
    #
    # 10% OF TICKET PRICE
    # ========================================================

    settings = load_admin_settings()

    commission_percent = float(
        settings.get(
            "commission",
            10
        )
    )


    commission = int(
        subtotal
        *
        commission_percent
        /
        100
    )


    # ========================================================
    # HOST EARNING
    # ========================================================

    host_amount = (
        subtotal
        -
        commission
    )


    # ========================================================
    # CHECK INVENTORY
    # ========================================================

    if "remaining" not in selected_ticket:

        selected_ticket["remaining"] = int(
            selected_ticket.get(
                "quantity",
                0
            )
        )


    remaining = int(
        selected_ticket.get(
            "remaining",
            0
        )
    )


    if remaining < quantity:

        return jsonify({
            "success": False,
            "message": (
                f"Only {remaining} "
                f"tickets remaining."
            )
        }), 400


    # ========================================================
    # PREVENT DUPLICATE PAYMENT / BOOKING
    # ========================================================

    incoming_ticket_id = str(
        data.get(
            "ticketId",
            ""
        )
    ).strip()


    if incoming_ticket_id:

        for existing_booking in bookings:

            existing_ticket_id = str(
                existing_booking.get(
                    "ticketId",
                    ""
                )
            ).strip()


            if (
                existing_ticket_id
                == incoming_ticket_id
            ):

                return jsonify({

                    "success": False,

                    "duplicate": True,

                    "message": (
                        "This payment has already "
                        "been processed."
                    ),

                    "tickets": [
                        existing_booking
                    ]

                }), 409


    # ========================================================
    # HOST ID
    # ========================================================

    host_id = event.get(
        "hostId"
    )


    if not host_id:

        return jsonify({
            "success": False,
            "message": "Event host ID is missing."
        }), 400


    try:

        host_id = int(
            host_id
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "success": False,
            "message": "Invalid event host ID."
        }), 400


    # ========================================================
    # EVENTWAA WALLET
    # ========================================================

    wallet = load_wallet()


    wallet["availableBalance"] = (
        int(
            wallet.get(
                "availableBalance",
                0
            )
        )
        +
        commission
        +
        service_fee
    )


    wallet["totalCommission"] = (
        int(
            wallet.get(
                "totalCommission",
                0
            )
        )
        +
        commission
    )


    wallet["totalServiceFees"] = (
        int(
            wallet.get(
                "totalServiceFees",
                0
            )
        )
        +
        service_fee
    )


    save_wallet(
        wallet
    )


    # ========================================================
    # HOST WALLET
    # ========================================================

    wallets = load_host_wallets()

    host_wallet = None


    for current_wallet in wallets:

        try:

            wallet_host_id = int(
                current_wallet.get(
                    "hostId",
                    0
                )
            )

        except (
            ValueError,
            TypeError
        ):

            wallet_host_id = 0


        if wallet_host_id == host_id:

            host_wallet = current_wallet

            break


    # --------------------------------------------------------
    # CREATE HOST WALLET
    # --------------------------------------------------------

    if not host_wallet:

        host_wallet = {

            "hostId": host_id,

            "availableBalance": 0,

            "pendingPayouts": 0,

            "totalEarned": 0,

            "totalWithdrawn": 0,

            "withdrawals": [],

            "scheduledPayouts": [],

            "transactions": [],

            "refunds": 0

        }


        wallets.append(
            host_wallet
        )


    # ========================================================
    # HOST PAYOUT DELAY
    # ========================================================

    host_email = event.get(
        "hostEmail"
    )


    users = load_json_file(
        "users.json",
        []
    )


    host_user = None


    if host_email:

        for current_user in users:

            if str(
                current_user.get(
                    "email",
                    ""
                )
            ).strip().lower() == str(
                host_email
            ).strip().lower():

                host_user = current_user

                break


    if host_user and host_user.get(
        "trustedHost",
        False
    ):

        payout_delay = int(
            settings.get(
                "trustedHostPayout",
                0
            )
        )

    elif host_user and host_user.get(
        "verifiedHost",
        False
    ):

        payout_delay = int(
            settings.get(
                "verifiedHostPayout",
                1
            )
        )

    else:

        payout_delay = int(
            settings.get(
                "newHostPayout",
                2
            )
        )


    # ========================================================
    # ADD HOST EARNING
    # ========================================================

    if payout_delay > 0:

        host_wallet.setdefault(
            "scheduledPayouts",
            []
        )


        host_wallet["scheduledPayouts"].append({

            "amount": host_amount,

            "availableAt": (
                datetime.now().timestamp()
                +
                (
                    payout_delay
                    *
                    24
                    *
                    60
                    *
                    60
                )
            ),

            "createdAt":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        })


        host_wallet["pendingPayouts"] = (
            int(
                host_wallet.get(
                    "pendingPayouts",
                    0
                )
            )
            +
            host_amount
        )

    else:

        host_wallet["availableBalance"] = (
            int(
                host_wallet.get(
                    "availableBalance",
                    0
                )
            )
            +
            host_amount
        )


    host_wallet["totalEarned"] = (
        int(
            host_wallet.get(
                "totalEarned",
                0
            )
        )
        +
        host_amount
    )


    # ========================================================
    # HOST TRANSACTION
    # ========================================================

    host_wallet.setdefault(
        "transactions",
        []
    )


    host_wallet["transactions"].insert(
        0,
        {

            "type": "sale",

            "eventId":
                event.get("id"),

            "eventTitle":
                event.get("title"),

            "amount":
                host_amount,

            "grossAmount":
                subtotal,

            "commission":
                commission,

            "commissionPercent":
                commission_percent,

            "serviceFee":
                service_fee,

            "customerTotal":
                customer_total,

            "date":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        }
    )


    save_host_wallets(
        wallets
    )


    # ========================================================
    # UPDATE INVENTORY
    # ========================================================

    selected_ticket["remaining"] = (
        remaining
        -
        quantity
    )


    event["ticketsSold"] = (
        int(
            event.get(
                "ticketsSold",
                0
            )
        )
        +
        quantity
    )


    # ========================================================
    # IMPORTANT:
    # EVENT REVENUE = HOST EARNING
    #
    # NOT customer total.
    # NOT subtotal.
    # NOT service fee.
    # ========================================================

    event["revenue"] = (
        int(
            event.get(
                "revenue",
                0
            )
        )
        +
        host_amount
    )


    # ========================================================
    # CREATE INDIVIDUAL TICKETS
    # ========================================================

    created_tickets = []


    for i in range(quantity):

        ticket_number = (
            len(bookings)
            +
            i
            +
            1
        )


        ticket = {

            "id":
                ticket_number,

            "eventId":
                data.get("eventId"),

            "eventTitle":
                event.get("title"),

            "buyer":
                data.get("buyer"),

            "ticketType":
                ticket_type,

            "ticketPrice":
                ticket_price,

            "subtotal":
                ticket_price,

            "serviceFee":
                service_fee
                / quantity,

            "serviceFeePercent":
                service_fee_percent,

            "customerTotal":
                (
                    customer_total
                    // quantity
                ),

            # Host/event accounting amount
            "totalPrice":
                ticket_price,

            "ticketId":
                (
                    f"{incoming_ticket_id}-"
                    f"{i + 1}"
                ),

            "checkedIn":
                False,

            "refundStatus":
                None,

            "createdAt":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        }


        bookings.append(
            ticket
        )


        created_tickets.append(
            ticket
        )


    # ========================================================
    # SAVE
    # ========================================================

    save_json_file(
        "events.json",
        events
    )


    save_json_file(
        "bookings.json",
        bookings
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return jsonify({

        "success": True,

        "message":
            "Booking completed successfully.",

        "tickets":
            created_tickets,

        "event":
            event,

        "payment": {

            "subtotal":
                subtotal,

            "serviceFee":
                service_fee,

            "serviceFeePercent":
                service_fee_percent,

            "customerTotal":
                customer_total,

            "commission":
                commission,

            "hostAmount":
                host_amount

        }

    }), 201


# ============================================================
# ATTENDANCE
# ============================================================

@app.route(
    "/attendance",
    methods=["POST"]
)
def create_attendance():

    data = request.get_json(
        silent=True
    ) or {}


    attendance = load_attendance()


    record = {

        "id": len(attendance) + 1,

        "eventId": data.get(
            "eventId"
        ),

        "eventTitle": data.get(
            "eventTitle"
        ),

        "name": data.get(
            "name"
        ),

        "email": data.get(
            "email"
        ),

        "passId": (
            f"FW{int(time.time()*1000)}"
        ),

        "ticketId": (
            f"FREE-FW{int(time.time()*1000)}"
        ),

        "checkedIn": False,

        "createdAt": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    }


    attendance.append(record)

    save_attendance(
        attendance
    )


    events = load_json_file(
        "events.json",
        []
    )


    for event in events:

        if str(
            event.get("id")
        ) == str(
            data.get("eventId")
        ):

            event["attendees"] = (
                int(
                    event.get(
                        "attendees",
                        0
                    )
                )
                + 1
            )

            break


    save_json_file(
        "events.json",
        events
    )


    return jsonify({
        "success": True,
        "attendance": record
    })


# ============================================================
# GET ATTENDANCE
# ============================================================

@app.route(
    "/attendance",
    methods=["GET"]
)
def get_attendance():

    return jsonify(
        load_attendance()
    )


@app.route(
    "/attendance/event/<int:event_id>",
    methods=["GET"]
)
def get_free_event_attendees(event_id):

    attendance = load_attendance()


    attendees = [

        person
        for person in attendance

        if str(
            person.get("eventId")
        ) == str(event_id)

    ]


    return jsonify(attendees)


@app.route(
    "/attendance/<int:attendance_id>",
    methods=["GET"]
)
def get_attendance_pass(attendance_id):

    attendance = load_attendance()


    for person in attendance:

        if int(
            person.get("id", 0)
        ) == attendance_id:

            return jsonify(person)


    return jsonify({
        "success": False,
        "message": "Attendance pass not found"
    }), 404


# ============================================================
# VERIFY ENTRY
# ============================================================

@app.route(
    "/verify-entry/<entry_id>",
    methods=["PUT"]
)
def verify_entry(entry_id):

    # --------------------------------------------------------
    # FREE EVENT PASS
    # --------------------------------------------------------

    if str(
        entry_id
    ).startswith("FREE-"):

        pass_id = str(
            entry_id
        ).replace(
            "FREE-",
            ""
        )


        attendance = load_attendance()


        for person in attendance:

            if str(
                person.get("passId")
            ) == str(pass_id):

                if person.get(
                    "checkedIn",
                    False
                ):

                    return jsonify({
                        "success": False,
                        "message": "Pass already used"
                    })


                person["checkedIn"] = True

                person["checkedInAt"] = datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )


                save_attendance(
                    attendance
                )


                return jsonify({

                    "success": True,

                    "type": "free",

                    "attendee": person

                })


        return jsonify({
            "success": False,
            "message": "Attendance pass not found"
        })


    # --------------------------------------------------------
    # PAID TICKET
    # --------------------------------------------------------

    data = request.get_json(
        silent=True
    ) or {}


    event_id = data.get(
        "eventId"
    )


    bookings = load_json_file(
        "bookings.json",
        []
    )


    for ticket in bookings:

        if (

            str(
                ticket.get("ticketId")
            )
            ==
            str(entry_id)

            and

            str(
                ticket.get("eventId")
            )
            ==
            str(event_id)

        ):

            if ticket.get(
                "checkedIn",
                False
            ):

                return jsonify({
                    "success": False,
                    "message": "Ticket already used"
                })


            ticket["checkedIn"] = True

            ticket["checkedInAt"] = datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )


            save_json_file(
                "bookings.json",
                bookings
            )


            return jsonify({

                "success": True,

                "type": "paid",

                "ticket": ticket

            })


    return jsonify({
        "success": False,
        "message": "Ticket not found"
    })


# ============================================================
# CHECK TICKET
# ============================================================

@app.route(
    "/check-ticket/<ticket_id>",
    methods=["PUT"]
)
def check_ticket(ticket_id):
    data = request.get_json(
        silent=True
    ) or {}
    event_id = data.get(
        "eventId"
    )
    bookings = load_json_file(
        "bookings.json",
        []
    )
    # --------------------------------------------------------
    # FIND TICKET
    # --------------------------------------------------------
    ticket = None
    for booking in bookings:
        if str(
            booking.get("ticketId")
        ) == str(ticket_id):
            ticket = booking
            break
    # --------------------------------------------------------
    # TICKET DOES NOT EXIST
    # --------------------------------------------------------
    if not ticket:
        return jsonify({
            "success": False,
            "message": "Ticket not found."
        }), 404
    # --------------------------------------------------------
    # CHECK EVENT
    # --------------------------------------------------------
    if str(
        ticket.get("eventId")
    ) != str(event_id):
        return jsonify({
            "success": False,
            "message": "This ticket does not belong to this event."
        }), 403
    # --------------------------------------------------------
    # REFUNDED TICKET
    # --------------------------------------------------------
    if ticket.get(
        "refundStatus"
    ) == "refunded":
        return jsonify({
            "success": False,
            "message": (
                "This ticket has been refunded "
                "and is no longer valid."
            ),
            "refunded": True
        }), 400
    # --------------------------------------------------------
    # ALREADY CHECKED IN
    # --------------------------------------------------------
    if ticket.get(
        "checkedIn",
        False
    ):
        return jsonify({
            "success": False,
            "message": "Ticket already used.",
            "alreadyCheckedIn": True
        }), 400
    # --------------------------------------------------------
    # CHECK IN TICKET
    # --------------------------------------------------------
    ticket["checkedIn"] = True
    ticket["checkedInAt"] = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    save_json_file(
        "bookings.json",
        bookings
    )
    return jsonify({
        "success": True,
        "message": "Ticket verified successfully.",
        "ticket": ticket
    }), 200


# ============================================================
# CHECKED-IN TICKETS
# ============================================================

@app.route(
    "/bookings/checked-in",
    methods=["GET"]
)
def get_checked_in():

    bookings = load_json_file(
        "bookings.json",
        []
    )


    checked_in = [

        ticket
        for ticket in bookings

        if ticket.get(
            "checkedIn"
        ) is True

    ]


    return jsonify(
        checked_in
    )


# ============================================================
# HOST APPLICATION
# ============================================================

@app.route(
    "/host-applications",
    methods=["POST"]
)
def create_host_application():

    settings = load_admin_settings()


    # If community hosts are disabled, normal host
    # applications are still allowed for verification.
    # This setting controls temporary community hosting,
    # not verified hosting.


    data = request.form


    upload_folder = "uploads"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )


    def save_image(field_name):

        if field_name not in request.files:
            return None


        image = request.files[
            field_name
        ]


        if image.filename == "":
            return None


        filename = (
            f"{int(time.time()*1000)}_"
            f"{secure_filename(image.filename)}"
        )


        filepath = os.path.join(
            upload_folder,
            filename
        )


        image.save(
            filepath
        )


        return filepath.replace(
            "\\",
            "/"
        )


    applications = load_applications()


    application = {

        "id": int(
            time.time() * 1000
        ),

        "userId": data.get(
            "userId"
        ),

        "fullName": data.get(
            "fullName"
        ),

        "email": data.get(
            "email"
        ),

        "phone": data.get(
            "phone"
        ),

        "location": data.get(
            "location"
        ),

        "hasPreviousEvents": data.get(
            "hasPreviousEvents"
        ),

        "fullLegalName": data.get(
            "fullLegalName"
        ),

        "dateOfBirth": data.get(
            "dateOfBirth"
        ),

        "country": data.get(
            "country"
        ),

        "idNumber": data.get(
            "idNumber"
        ),

        "idFront": save_image(
            "idFront"
        ),

        "idBack": save_image(
            "idBack"
        ),

        "proofImage": save_image(
            "proofImage"
        ),

        "status": "pending",

        "submittedAt": int(
            time.time()
        )

    }


    # ========================================================
    # AUTO APPROVE HOSTS
    # ========================================================

    if settings.get(
        "autoApproveHosts",
        False
    ):

        application["status"] = "approved"


    applications.append(
        application
    )


    save_applications(
        applications
    )


    if application["status"] == "approved":

        users = load_json_file(
            "users.json",
            []
        )


        for user in users:

            if str(
                user.get("email")
            ).lower() == str(
                application.get("email")
            ).lower():

                user["role"] = "host"

                user["verifiedHost"] = True

                user["hostMode"] = True

                user["hostApplicationStatus"] = "approved"

                break


        save_json_file(
            "users.json",
            users
        )


        create_notification(

            application.get(
                "userId"
            ),

            "Host application approved",

            "Congratulations! You are now a verified EventWaa host.",

            "host_approval",

            "/dashboard"

        )


    else:

        create_notification(

            "admin",

            "New Host Application",

            (
                f"{application.get('fullName')} "
                f"submitted a host application."
            ),

            "host_application",

            "/admin/hosts"

        )


    return jsonify({

        "success": True,

        "message": (
            "Host application approved successfully."
            if application["status"] == "approved"
            else
            "Host application submitted successfully."
        ),

        "status": application["status"]

    })


# ============================================================
# GET HOST APPLICATIONS
# ============================================================

@app.route(
    "/host-applications",
    methods=["GET"]
)
def get_host_applications():

    applications = load_applications()

    print(
        "PRINT HOST APPLICATIONS:",
        applications
    )


    return jsonify(
        applications
    )


# ============================================================
# APPROVE HOST
# ============================================================

@app.route(
    "/host-applications/<int:application_id>/approve",
    methods=["PUT"]
)
def approve_host(application_id):

    applications = load_applications()

    users = load_json_file(
        "users.json",
        []
    )


    approved_email = None

    approved_user_id = None


    for application in applications:

        if int(
            application.get("id", 0)
        ) == application_id:

            application["status"] = "approved"

            approved_email = application.get(
                "email"
            )

            approved_user_id = application.get(
                "userId"
            )

            break


    if not approved_email:

        return jsonify({
            "success": False,
            "message": "Host application not found."
        }), 404


    for user in users:

        if str(
            user.get("email")
        ).lower() == str(
            approved_email
        ).lower():

            user["role"] = "host"

            user["verifiedHost"] = True

            user["hostMode"] = True

            user["hostApplicationStatus"] = "approved"

            break


    save_applications(
        applications
    )


    save_json_file(
        "users.json",
        users
    )


    create_notification(

        approved_user_id,

        "Host application approved",

        "Congratulations! You are now a verified EventWaa host.",

        "host_approval",

        "/dashboard"

    )


    # Mark admin host notification as read.
    notifications = load_notifications()


    for notification in notifications:

        if (

            str(
                notification.get("userId")
            ) == "admin"

            and

            notification.get("type")
            == "host_application"

            and

            notification.get("read")
            is False

        ):

            notification["read"] = True

            notification["reviewedAt"] = datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )

            break


    save_notifications(
        notifications
    )


    return jsonify({

        "success": True,

        "message": "Host approved successfully"

    })


# ============================================================
# REJECT HOST
# ============================================================

@app.route(
    "/host-applications/<int:application_id>/reject",
    methods=["PUT"]
)
def reject_host(application_id):

    applications = load_applications()

    users = load_json_file(
        "users.json",
        []
    )


    found = False


    for application in applications:

        if int(
            application.get("id", 0)
        ) == application_id:

            found = True

            application["status"] = "rejected"


            email = application.get(
                "email"
            )


            for user in users:

                if str(
                    user.get("email")
                ).lower() == str(
                    email
                ).lower():

                    user["hostApplicationStatus"] = "rejected"

                    create_notification(

                        user.get("id"),

                        "Host application update",

                        "Your host application was not approved. Please review your details and apply again.",

                        "host_rejection",

                        "/host-application"

                    )

                    break


            break


    if not found:

        return jsonify({
            "success": False,
            "message": "Application not found"
        }), 404


    save_applications(
        applications
    )


    save_json_file(
        "users.json",
        users
    )


    return jsonify({
        "success": True,
        "message": "Application rejected"
    })


# ============================================================
# NOTIFICATIONS
# ============================================================

def create_notification(
    user_id,
    title,
    message,
    notification_type,
    link
):

    notifications = load_notifications()


    # Merge unread message notifications.
    if notification_type == "message":

        for notification in notifications:

            if (

                str(
                    notification.get("userId")
                )
                ==
                str(user_id)

                and

                notification.get("type")
                == "message"

                and

                notification.get("link")
                == link

                and

                notification.get("read")
                is False

            ):

                notification["message"] = message

                notification["createdAt"] = datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )


                save_notifications(
                    notifications
                )

                return


    notification = {

        "id": len(
            notifications
        ) + 1,

        "userId": user_id,

        "title": title,

        "message": message,

        "type": notification_type,

        "link": link,

        "read": False,

        "createdAt": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    }


    notifications.append(
        notification
    )


    save_notifications(
        notifications
    )


# ============================================================
# GET USER NOTIFICATIONS
# ============================================================

@app.route(
    "/notifications/<user_id>",
    methods=["GET"]
)
def get_notifications(user_id):

    notifications = load_notifications()


    user_notifications = [

        notification

        for notification in notifications

        if str(
            notification.get("userId")
        ) == str(user_id)

    ]


    user_notifications.sort(
        key=lambda x: x.get("id", 0),
        reverse=True
    )


    return jsonify(
        user_notifications
    )


# ============================================================
# ADMIN NOTIFICATIONS
# ============================================================

@app.route(
    "/admin/notifications",
    methods=["GET"]
)
def get_admin_notifications():

    notifications = load_notifications()


    admin_notifications = [

        notification

        for notification in notifications

        if str(
            notification.get("userId")
        ) == "admin"

    ]


    admin_notifications.sort(
        key=lambda x: x.get("id", 0),
        reverse=True
    )


    return jsonify(
        admin_notifications
    )


# ============================================================
# MARK NOTIFICATION READ
# ============================================================

@app.route(
    "/notifications/read/<int:notification_id>",
    methods=["PUT"]
)
def mark_notification_read(notification_id):

    notifications = load_notifications()


    for notification in notifications:

        if int(
            notification.get("id", 0)
        ) == notification_id:

            notification["read"] = True

            break


    save_notifications(
        notifications
    )


    return jsonify({
        "success": True
    })


# ============================================================
# UNREAD NOTIFICATIONS
# ============================================================

@app.route(
    "/notifications/unread/<user_id>",
    methods=["GET"]
)
def unread_notifications(user_id):

    notifications = load_notifications()


    unread = len([

        notification

        for notification in notifications

        if (

            str(
                notification.get("userId")
            )
            ==
            str(user_id)

            and

            notification.get("read")
            is False

        )

    ])


    return jsonify({
        "unread": unread
    })


# ============================================================
# DELETE NOTIFICATION
# ============================================================

@app.route(
    "/notifications/<int:notification_id>",
    methods=["DELETE"]
)
def delete_notification(notification_id):

    notifications = load_notifications()


    notifications = [

        notification

        for notification in notifications

        if int(
            notification.get("id", 0)
        ) != notification_id

    ]


    save_notifications(
        notifications
    )


    return jsonify({
        "success": True
    })


# ============================================================
# HOST WALLETS
# ============================================================

@app.route(
    "/host/wallet/<int:host_id>",
    methods=["GET"]
)
def get_host_wallet(host_id):

    wallets = load_host_wallets()


    for wallet in wallets:

        if int(
            wallet.get("hostId", 0)
        ) == host_id:
            wallet.setdefault(
                "transactions",
                []
            )
            wallet.setdefault(
                "withdrawals",
                []
            )
            wallet.setdefault(
                "scheduledPayouts",
                []
            )

            return jsonify(wallet)


    new_wallet = {

        "hostId": host_id,

        "availableBalance": 0,

        "pendingPayouts": 0,

        "totalEarned": 0,

        "totalWithdrawn": 0,

        "withdrawals": [],

        "scheduledPayouts": [],

        "transactions": []

    }


    wallets.append(
        new_wallet
    )


    save_host_wallets(
        wallets
    )


    return jsonify(
        new_wallet
    )


# ============================================================
# HOST WITHDRAW
# ============================================================

@app.route(
    "/host/wallet/withdraw/<int:host_id>",
    methods=["POST"]
)
def host_withdraw(host_id):

    data = request.get_json(
        silent=True
    ) or {}


    amount = int(
        data.get(
            "amount",
            0
        )
    )


    method = data.get(
        "method"
    )


    account = data.get(
        "account"
    )


    wallets = load_host_wallets()


    for wallet in wallets:

        if int(
            wallet.get("hostId", 0)
        ) == host_id:

            if amount <= 0:

                return jsonify({
                    "success": False,
                    "message": "Enter a valid amount"
                }), 400


            if amount > wallet.get(
                "availableBalance",
                0
            ):

                return jsonify({
                    "success": False,
                    "message": "Insufficient balance"
                }), 400


            withdrawal = {

                "id": len(
                    wallet.get(
                        "withdrawals",
                        []
                    )
                ) + 1,

                "amount": amount,

                "method": method,

                "account": account,

                "status": "pending",

                "date": datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

            }


            wallet["availableBalance"] -= amount

            wallet["pendingPayouts"] = (
                wallet.get(
                    "pendingPayouts",
                    0
                )
                + amount
            )


            wallet.setdefault(
                "withdrawals",
                []
            ).append(
                withdrawal
            )

            #add wallet transaction
            wallet.setdefault(
                "transactions",
                []
            ).append({

                "id": f"withdrawal_{withdrawal['id']}",

                "type": "withdrawal",

                "description": "Withdrawal request",

                "amount": -amount,

                "method": method,

                "date": withdrawal["date"],

                "status": "pending"

            })


            save_host_wallets(
                wallets
            )


            create_notification(

                host_id,

                "Withdrawal Request Submitted",

                (
                    f"Your withdrawal request "
                    f"of UGX {amount:,} "
                    f"has been submitted."
                ),

                "withdrawal",

                "/host-wallet"

            )


            create_notification(

                "admin",

                "New Withdrawal Request",

                (
                    f"A host requested "
                    f"UGX {amount:,} withdrawal."
                ),

                "admin_withdrawal",

                "/admin/withdrawals"

            )


            return jsonify({
                "success": True,
                "wallet": wallet
            })


    return jsonify({
        "success": False,
        "message": "Host wallet not found"
    }), 404


# ============================================================
# ADMIN WALLET
# ============================================================

@app.route(
    "/admin/wallet",
    methods=["GET"]
)
def get_wallet():

    return jsonify(
        load_wallet()
    )


# ============================================================
# ADMIN WALLET WITHDRAW
# ============================================================

@app.route(
    "/admin/wallet/withdraw",
    methods=["POST"]
)
def withdraw_wallet():

    data = request.get_json(
        silent=True
    ) or {}


    amount = int(
        data.get(
            "amount",
            0
        )
    )


    method = data.get(
        "method"
    )


    account = data.get(
        "account"
    )


    wallet = load_wallet()


    if amount <= 0:

        return jsonify({
            "success": False,
            "message": "Enter a valid amount"
        }), 400


    if amount > wallet.get(
        "availableBalance",
        0
    ):

        return jsonify({
            "success": False,
            "message": "Insufficient balance"
        }), 400


    withdrawal = {

        "id": len(
            wallet.get(
                "withdrawals",
                []
            )
        ) + 1,

        "amount": amount,

        "method": method,

        "account": account,

        "status": "completed",

        "date": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    }


    wallet["availableBalance"] -= amount

    wallet["totalWithdrawn"] = (
        wallet.get(
            "totalWithdrawn",
            0
        )
        + amount
    )


    wallet.setdefault(
        "withdrawals",
        []
    ).append(
        withdrawal
    )


    save_wallet(
        wallet
    )


    return jsonify({

        "success": True,

        "message": "Withdrawal request submitted",

        "wallet": wallet

    })

# ============================================================
# MESSAGING SYSTEM
# ============================================================

@app.route(
    "/messages",
    methods=["POST"]
)
def send_message():

    data = request.get_json(
        silent=True
    ) or {}


    messages = load_messages()


    receiver_id = (
        data.get("receiverId")
        or
        data.get("hostId")
    )


    if not receiver_id:

        return jsonify({
            "success": False,
            "message": "receiverId is required."
        }), 400


    new_message = {

        "id": len(messages) + 1,

        "conversationId": data.get(
            "conversationId"
        ),

        "senderId": data.get(
            "senderId"
        ),

        "senderName": data.get(
            "senderName"
        ),

        "senderRole": data.get(
            "senderRole"
        ),

        "receiverId": receiver_id,

        "receiverName": data.get(
            "receiverName"
        ),

        "hostId": data.get(
            "hostId"
        ),

        "message": data.get(
            "message"
        ),

        "read": False,

        "createdAt": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    }


    messages.append(
        new_message
    )


    save_messages(
        messages
    )


    create_notification(

        receiver_id,

        "New Message",

        (
            f"{data.get('senderName', 'Someone')} "
            f"sent you a message."
        ),

        "message",

        f"/host-chat/{data.get('senderId')}"

    )


    return jsonify({

        "success": True,

        "message": new_message

    }), 201


# ============================================================
# GET CONVERSATION
# ============================================================

@app.route(
    "/messages/<conversation_id>",
    methods=["GET"]
)
def get_messages(conversation_id):

    messages = load_messages()


    conversation = [

        msg

        for msg in messages

        if str(
            msg.get("conversationId")
        )
        ==
        str(conversation_id)

    ]


    return jsonify(
        conversation
    )


# ============================================================
# HOST INBOX
# ============================================================

@app.route(
    "/host-messages/<host_id>",
    methods=["GET"]
)
def host_messages(host_id):

    messages = load_messages()


    inbox = []


    for msg in messages:

        receiver = msg.get(
            "receiverId"
        )

        host = msg.get(
            "hostId"
        )


        if (

            str(receiver)
            ==
            str(host_id)

            or

            str(host)
            ==
            str(host_id)

        ):

            inbox.append(msg)


    return jsonify(
        inbox
    )


# ============================================================
# USER MESSAGES
# ============================================================

@app.route(
    "/messages/user/<user_id>",
    methods=["GET"]
)
def user_messages(user_id):

    messages = load_messages()


    user_messages_list = []


    for msg in messages:

        if (

            str(
                msg.get("senderId")
            )
            ==
            str(user_id)

            or

            str(
                msg.get("receiverId")
            )
            ==
            str(user_id)

            or

            str(
                msg.get("hostId")
            )
            ==
            str(user_id)

        ):

            user_messages_list.append(
                msg
            )


    return jsonify(
        user_messages_list
    )


# ============================================================
# UNREAD MESSAGE COUNT
# ============================================================

@app.route(
    "/messages/unread/<user_id>",
    methods=["GET"]
)
def unread_messages(user_id):

    messages = load_messages()


    count = len([

        msg

        for msg in messages

        if (

            str(
                msg.get("receiverId")
            )
            ==
            str(user_id)

            and

            msg.get("read")
            is False

        )

    ])


    return jsonify({
        "unread": count
    })


# ============================================================
# MARK MESSAGE READ
# ============================================================

@app.route(
    "/messages/read/<int:message_id>",
    methods=["PUT"]
)
def mark_message_read(message_id):

    messages = load_messages()


    for msg in messages:

        if int(
            msg.get("id", 0)
        ) == message_id:

            msg["read"] = True

            break


    save_messages(
        messages
    )


    return jsonify({
        "success": True
    })


# ============================================================
# DELETE MESSAGE
# ============================================================

@app.route(
    "/messages/<int:message_id>",
    methods=["DELETE"]
)
def delete_message(message_id):

    messages = load_messages()


    messages = [

        msg

        for msg in messages

        if int(
            msg.get("id", 0)
        ) != message_id

    ]


    save_messages(
        messages
    )


    return jsonify({
        "success": True
    })


# ============================================================
# FOLLOWERS
# ============================================================

@app.route(
    "/followers/<int:host_id>",
    methods=["GET"]
)
def get_followers(host_id):

    follows = load_json_file(
        "follows.json",
        []
    )


    followers = [

        follow

        for follow in follows

        if str(
            follow.get("hostId")
        )
        ==
        str(host_id)

    ]


    return jsonify({
        "count": len(followers)
    })


# ============================================================
# USERS
# ============================================================

@app.route(
    "/users",
    methods=["GET"]
)
def get_users():

    return jsonify(
        load_json_file(
            "users.json",
            []
        )
    )


# ============================================================
# UPDATE USER PROFILE BY EMAIL
# ============================================================

@app.route(
    "/users/<email>",
    methods=["PUT"]
)
def update_user(email):

    updated_data = request.get_json(
        silent=True
    ) or {}


    users = load_json_file(
        "users.json",
        []
    )


    for user in users:

        if str(
            user.get("email")
        ).lower() == str(
            email
        ).lower():

            if "name" in updated_data:

                user["name"] = updated_data[
                    "name"
                ]


            save_json_file(
                "users.json",
                users
            )


            return jsonify({
                "success": True,
                "message": "Profile updated successfully"
            })


    return jsonify({
        "success": False,
        "message": "User not found"
    }), 404


# ============================================================
# UPDATE HOST PROFILE
# ============================================================

@app.route(
    "/users/<int:user_id>",
    methods=["PUT"]
)
def update_host_profile(user_id):

    users = load_json_file(
        "users.json",
        []
    )


    data = request.get_json(
        silent=True
    ) or {}


    for user in users:

        if int(
            user.get("id", 0)
        ) == user_id:

            user.update(data)


            save_json_file(
                "users.json",
                users
            )


            safe_user = user.copy()

            safe_user.pop(
                "password",
                None
            )


            return jsonify({

                "success": True,

                "user": safe_user

            })


    return jsonify({
        "success": False,
        "message": "User not found"
    }), 404


# ============================================================
# ADMIN USER UPDATE
# ============================================================

@app.route(
    "/admin/users/<int:user_id>",
    methods=["PUT"]
)
def admin_update_user(user_id):

    data = request.get_json(
        silent=True
    ) or {}


    users = load_json_file(
        "users.json",
        []
    )


    updated_user = None


    for user in users:

        if int(
            user.get("id", 0)
        ) == user_id:

            # ROLE
            if "role" in data:

                user["role"] = data[
                    "role"
                ]


                if data["role"] == "host":

                    user["verifiedHost"] = True

                    user["hostMode"] = True

                    user["hostApplicationStatus"] = "approved"


                elif data["role"] == "user":

                    user["verifiedHost"] = False

                    user["hostMode"] = False


            # STATUS
            if "status" in data:

                user["status"] = data[
                    "status"
                ]


            updated_user = user

            break


    if not updated_user:

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404


    save_json_file(
        "users.json",
        users
    )


    safe_user = updated_user.copy()

    safe_user.pop(
        "password",
        None
    )


    return jsonify({

        "success": True,

        "message": "User updated",

        "user": safe_user

    })


# ============================================================
# ADMIN STATS
# ============================================================

@app.route(
    "/admin/stats",
    methods=["GET"]
)
def admin_stats():

    users = load_json_file(
        "users.json",
        []
    )


    events = load_json_file(
        "events.json",
        []
    )


    applications = load_applications()


    bookings = load_json_file(
        "bookings.json",
        []
    )


    total_revenue = sum(

        int(
            ticket.get(
                "totalPrice",
                0
            )
        )

        for ticket in bookings

    )


    tickets_sold = sum(

        int(
            ticket.get(
                "quantity",
                1
            )
        )

        for ticket in bookings

    )


    return jsonify({

        "users": len(users),

        "events": len(events),

        "pendingHosts": len([

            application

            for application in applications

            if application.get("status")
            == "pending"

        ]),

        "verifiedHosts": len([

            user

            for user in users

            if user.get(
                "verifiedHost"
            )

        ]),

        "ticketsSold": tickets_sold,

        "revenue": total_revenue

    })


# ============================================================
# ADMIN REVENUE
# ============================================================

@app.route(
    "/admin/revenue",
    methods=["GET"]
)
def admin_revenue():

    bookings = load_json_file(
        "bookings.json",
        []
    )


    events = load_json_file(
        "events.json",
        []
    )


    total_revenue = sum(

        int(
            ticket.get(
                "totalPrice",
                0
            )
        )

        for ticket in bookings

    )


    tickets_sold = sum(

        int(
            ticket.get(
                "quantity",
                1
            )
        )

        for ticket in bookings

    )


    average_ticket = 0


    if tickets_sold > 0:

        average_ticket = (
            total_revenue
            //
            tickets_sold
        )


    event_data = []


    for event in events:

        event_data.append({

            "id": event.get(
                "id"
            ),

            "title": event.get(
                "title"
            ),

            "ticketsSold": event.get(
                "ticketsSold",
                0
            ),

            "revenue": event.get(
                "revenue",
                0
            )

        })


    return jsonify({

        "totalRevenue": total_revenue,

        "ticketsSold": tickets_sold,

        "averageTicket": average_ticket,

        "events": event_data

    })


# ============================================================
# EVENT REPORTS
# ============================================================

@app.route(
    "/event-reports",
    methods=["POST"]
)
def create_event_report():

    data = request.get_json(
        silent=True
    ) or {}


    reports = load_event_reports()


    report = {

        "id": len(reports) + 1,

        "eventId": data.get(
            "eventId"
        ),

        "eventTitle": data.get(
            "eventTitle"
        ),

        "reason": data.get(
            "reason"
        ),

        "reportedBy": data.get(
            "reportedBy"
        ),

        "status": "pending",

        "createdAt": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    }


    reports.append(
        report
    )


    save_event_reports(
        reports
    )


    create_notification(

        "admin",

        "Event Report",

        (
            f"{data.get('eventTitle')} "
            f"has been reported."
        ),

        "event_report",

        "/admin/reports"

    )


    return jsonify({

        "success": True,

        "message": "Event reported successfully"

    })


@app.route(
    "/admin/event-reports",
    methods=["GET"]
)
def get_event_reports():

    reports = load_event_reports()


    reports.sort(
        key=lambda x: x.get("id", 0),
        reverse=True
    )


    return jsonify(
        reports
    )


@app.route(
    "/admin/event-reports/<int:report_id>/dismiss",
    methods=["PUT"]
)
def dismiss_event_report(report_id):

    reports = load_event_reports()


    for report in reports:

        if int(
            report.get("id", 0)
        ) == report_id:

            report["status"] = "dismissed"

            break


    save_event_reports(
        reports
    )


    return jsonify({
        "success": True,
        "message": "Report dismissed"
    })


# ============================================================
# HOST EARNINGS
# ============================================================

@app.route(
    "/host/earnings/<int:host_id>",
    methods=["GET"]
)
def host_earnings(host_id):

    bookings = load_json_file(
        "bookings.json",
        []
    )


    events = load_json_file(
        "events.json",
        []
    )


    settings = load_admin_settings()


    commission_percent = float(
        settings.get(
            "commission",
            10
        )
    )


    total_sales = 0

    commission = 0

    host_earnings_total = 0


    for booking in bookings:

        event = next(

            (
                event

                for event in events

                if int(
                    event.get("id", 0)
                )
                ==
                int(
                    booking.get("eventId", 0)
                )

            ),

            None

        )


        if (

            event

            and

            int(
                event.get("hostId", 0)
            )
            ==
            host_id

        ):

            amount = int(
                booking.get(
                    "totalPrice",
                    0
                )
            )


            booking_commission = int(
                amount
                * commission_percent
                / 100
            )


            total_sales += amount

            commission += booking_commission

            host_earnings_total += (
                amount
                -
                booking_commission
            )


    return jsonify({

        "totalSales": total_sales,

        "commission": commission,

        "commissionRate": commission_percent,

        "hostEarnings": host_earnings_total

    })


# ============================================================
# ADMIN HOST WITHDRAWALS
# ============================================================

@app.route(
    "/admin/host-withdrawals",
    methods=["GET"]
)
def admin_host_withdrawals():

    wallets = load_host_wallets()

    users = load_json_file(
        "users.json",
        []
    )


    withdrawals = []


    for wallet in wallets:

        host = next(

            (
                user

                for user in users

                if int(
                    user.get("id", 0)
                )
                ==
                int(
                    wallet.get(
                        "hostId",
                        0
                    )
                )

            ),

            None

        )


        for withdrawal in wallet.get(
            "withdrawals",
            []
        ):

            withdrawals.append({

                "id": withdrawal.get(
                    "id"
                ),

                "hostId": wallet.get(
                    "hostId"
                ),

                "hostName": (
                    host.get(
                        "name",
                        "Unknown Host"
                    )
                    if host
                    else
                    "Unknown Host"
                ),

                "hostEmail": (
                    host.get(
                        "email",
                        ""
                    )
                    if host
                    else
                    ""
                ),

                "amount": withdrawal.get(
                    "amount",
                    0
                ),

                "method": withdrawal.get(
                    "method"
                ),

                "account": withdrawal.get(
                    "account"
                ),

                "status": withdrawal.get(
                    "status"
                ),

                "date": withdrawal.get(
                    "date"
                )

            })


    withdrawals.sort(
        key=lambda x: x.get(
            "date",
            ""
        ),
        reverse=True
    )


    return jsonify(
        withdrawals
    )


# ============================================================
# APPROVE HOST WITHDRAWAL
# ============================================================

@app.route(
    "/admin/host-withdrawals/approve/<int:host_id>/<int:withdrawal_id>",
    methods=["PUT"]
)
def approve_host_withdrawal(
    host_id,
    withdrawal_id
):

    wallets = load_host_wallets()


    for wallet in wallets:

        if int(
            wallet.get("hostId", 0)
        ) == host_id:

            for withdrawal in wallet.get(
                "withdrawals",
                []
            ):

                if (

                    int(
                        withdrawal.get("id", 0)
                    )
                    ==
                    withdrawal_id

                    and

                    withdrawal.get("status")
                    ==
                    "pending"

                ):

                    withdrawal["status"] = "completed"

                    withdrawal["reviewedAt"] = datetime.now().strftime(
                        "%Y-%m-%d"
                    )


                    amount = int(
                        withdrawal.get(
                            "amount",
                            0
                        )
                    )


                    wallet["pendingPayouts"] = max(

                        0,

                        int(
                            wallet.get(
                                "pendingPayouts",
                                0
                            )
                        )
                        -
                        amount

                    )


                    wallet["totalWithdrawn"] = (

                        int(
                            wallet.get(
                                "totalWithdrawn",
                                0
                            )
                        )
                        +
                        amount

                    )


                    save_host_wallets(
                        wallets
                    )


                    create_notification(

                        host_id,

                        "Withdrawal Approved",

                        (
                            f"Your UGX "
                            f"{amount:,} withdrawal "
                            f"has been approved."
                        ),

                        "withdrawal_approved",

                        "/host-wallet"

                    )


                    return jsonify({

                        "success": True,

                        "wallet": wallet

                    })


    return jsonify({

        "success": False,

        "message": "Withdrawal not found"

    }), 404


# ============================================================
# REFUND SETTINGS CHECK
# ============================================================

@app.route(
    "/refund-settings",
    methods=["GET"]
)
def get_refund_settings():

    settings = load_admin_settings()


    return jsonify({

        "hostRefunds": settings.get(
            "hostRefunds",
            True
        ),

        "autoRefundApproval": settings.get(
            "autoRefundApproval",
            False
        ),

        "refundWindow": settings.get(
            "refundWindow",
            7
        )

    })


# ============================================================
# EMAIL REMINDER
# ============================================================

def send_event_reminder_email(
    email,
    name,
    event
):

    settings = load_admin_settings()


    if not settings.get(
        "emailNotifications",
        True
    ):

        return


    msg = Message(

        "EventWaa Event Reminder",

        sender="YOUR_EMAIL@gmail.com",

        recipients=[email]

    )


    msg.body = f"""

Hello {name},

This is a reminder that your event is tomorrow.

Event:
{event.get('title')}

Date:
{event.get('date')}

Time:
{event.get('startTime')}

Venue:
{event.get('venue')}

Thank you for using EventWaa.

"""


    try:

        mail.send(msg)

    except Exception as e:

        print(
            "EMAIL ERROR:",
            repr(e)
        )


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({

        "success": False,

        "message": "Route not found",

        "path": request.path

    }), 404


@app.errorhandler(405)
def method_not_allowed(error):

    return jsonify({

        "success": False,

        "message": "Method not allowed",

        "path": request.path

    }), 405


@app.errorhandler(500)
def server_error(error):

    print(
        "SERVER ERROR:",
        repr(error)
    )


    return jsonify({

        "success": False,

        "message": "Internal server error"

    }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print(
        "=========================================="
    )

    print(
        " EventWaa Backend Starting..."
    )

    print(
        "=========================================="
    )

    print(
        "Settings:",
        load_admin_settings()
    )

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )

app = app
