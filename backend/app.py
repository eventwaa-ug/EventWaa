from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import json
import os
import time
import requests
import hashlib
import hmac
import uuid
import secrets
#print(secrets.token_urlsafe(32))
import qrcode
from io import BytesIO

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timedelta, timezone
from flask_mail import Mail, Message
from dotenv import load_dotenv
load_dotenv()
from werkzeug.utils import secure_filename
from functools import wraps

from itsdangerous import (
    URLSafeTimedSerializer,
    BadSignature,
    SignatureExpired
)

from werkzeug.security import (
    check_password_hash,
    generate_password_hash
)

# ============================================================
# APP CONFIGURATION
# ============================================================


app = Flask(
    __name__,
    static_folder="uploads"
    )

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

# ============================================================
# EVENTWAA ADMIN PASSWORD RECOVERY EMAIL
#
# Sends the administrator the OTP used to verify a
# password-reset request.
#
# IMPORTANT:
# - The OTP is never stored as plain text.
# - Only the hashed OTP is stored in the recovery record.
# - The plain OTP is sent only to the administrator's email.
# ============================================================
def send_admin_otp_email(
    receiver_email,
    otp
):
    try:
        # ====================================================
        # CREATE EMAIL MESSAGE
        # ====================================================
        msg = Message(
            subject=(
                "EventWaa Admin Password Recovery Code"
            ),
            sender=app.config[
                "MAIL_DEFAULT_SENDER"
            ],
            recipients=[
                receiver_email
            ]
        )
        # ====================================================
        # EMAIL BODY
        # ====================================================
        msg.body = f"""
EventWaa Admin Security
A password reset was requested for your
EventWaa administrator account.
Your verification code is:
{otp}
This code expires in 10 minutes.
If you did not request this password reset,
please secure your administrator account immediately.
For your security:
• Never share this code.
• EventWaa staff will never ask for your OTP.
• If you did not request this reset, change your
  administrator password after securing your account.
--------------------------------------------------
EventWaa
Secure Administration Portal
Email: eventwaa.ug@gmail.com
Website: eventwaa.com
Location: Gulu, Uganda
--------------------------------------------------
"""
        # ====================================================
        # SEND EMAIL
        # ====================================================
        mail.send(
            msg
        )
        print(
            "EVENTWAA ADMIN OTP EMAIL SENT:",
            receiver_email
        )
        return {
            "success": True,
            "message":
                "Admin recovery email sent successfully."
        }
    except Exception as e:
        print(
            "EVENTWAA ADMIN OTP EMAIL ERROR:",
            str(e)
        )
        return {
            "success": False,
            "message":
                str(e)
        }

# ============================================================
# FLASK SECRET KEY
# ============================================================

app.config["SECRET_KEY"] = os.getenv(
    "SECRET_KEY",
    "eventwaa-development-secret-key-change-this"
)

# ============================================================
# EVENTWAA TICKET EMAIL
# ============================================================

def send_ticket_email(booking):
    """
    Sends a booking confirmation email containing:

    - Event details
    - Ticket type
    - Quantity
    - Amount paid
    - Ticket ID
    - QR code
    - Link to the EventWaa ticket
    """

    try:

        # ====================================================
        # BUYER INFORMATION
        # ====================================================

        buyer = booking.get(
            "buyer",
            {}
        ) or {}

        buyer_name = str(
            buyer.get(
                "name",
                "Guest"
            )
        ).strip()

        buyer_email = str(
            buyer.get(
                "email",
                ""
            )
        ).strip()


        if not buyer_email:

            print(
                "TICKET EMAIL ERROR: Buyer email is missing."
            )

            return {
                "success": False,
                "message": "Buyer email is missing."
            }


        # ====================================================
        # TICKET INFORMATION
        # ====================================================

        ticket_id = str(
            booking.get(
                "ticketId",
                ""
            )
        ).strip()

        event_title = (
            booking.get(
                "eventTitle"
            )
            or
            "EventWaa Event"
        )

        ticket_type = (
            booking.get(
                "ticketType"
            )
            or
            "Regular"
        )

        quantity = int(
            booking.get(
                "quantity",
                1
            )
            or 1
        )

        amount_paid = int(
            booking.get(
                "customerTotal",
                0
            )
            or 0
        )


        # ====================================================
        # EVENT INFORMATION
        # ====================================================

        event_date = (
            booking.get(
                "eventDate"
            )
            or
            ""
        )

        event_time = (
            booking.get(
                "eventTime"
            )
            or
            ""
        )

        event_venue = (
            booking.get(
                "eventVenue"
            )
            or
            ""
        )

        event_city = (
            booking.get(
                "eventCity"
            )
            or
            ""
        )


        # ====================================================
        # TICKET PAGE
        # ====================================================

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173"
        ).rstrip("/")


        ticket_url = (
            f"{frontend_url}"
            f"/ticket/{ticket_id}"
        )


        # ====================================================
        # GENERATE QR CODE
        #
        # IMPORTANT:
        # The QR contains the SAME ticket ID that
        # TicketDetails.jsx and the scanner use.
        # ====================================================

        qr = qrcode.QRCode(

            version=1,

            error_correction=
                qrcode.constants.ERROR_CORRECT_H,

            box_size=10,

            border=4

        )


        qr.add_data(
            ticket_id
        )

        qr.make(
            fit=True
        )


        qr_image = qr.make_image(
            fill_color="black",
            back_color="white"
        )


        qr_buffer = BytesIO()


        qr_image.save(
            qr_buffer,
            format="PNG"
        )


        qr_buffer.seek(0)


        qr_bytes = qr_buffer.getvalue()


        # ====================================================
        # FORMAT AMOUNT
        # ====================================================

        formatted_amount = (
            f"UGX {amount_paid:,}"
        )


        # ====================================================
        # OPTIONAL EVENT DETAILS
        # ====================================================

        date_html = ""

        if event_date:

            date_html = f"""
                <div class="detail">
                    <span class="detail-label">
                        DATE
                    </span>

                    <span class="detail-value">
                        {event_date}
                    </span>
                </div>
            """


        time_html = ""

        if event_time:

            time_html = f"""
                <div class="detail">
                    <span class="detail-label">
                        TIME
                    </span>

                    <span class="detail-value">
                        {event_time}
                    </span>
                </div>
            """


        location_html = ""

        if event_venue:

            location_text = event_venue

            if event_city:

                location_text += (
                    f", {event_city}"
                )


            location_html = f"""
                <div class="detail">
                    <span class="detail-label">
                        VENUE
                    </span>

                    <span class="detail-value">
                        {location_text}
                    </span>
                </div>
            """


        # ====================================================
        # HTML EMAIL
        # ====================================================

        html_body = f"""
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    EventWaa Ticket
</title>

<style>

body {{
    margin: 0;
    padding: 0;
    background: #f4f6f8;
    font-family:
        Arial,
        Helvetica,
        sans-serif;
    color: #172033;
}}

.wrapper {{
    width: 100%;
    padding: 35px 15px;
    box-sizing: border-box;
}}

.card {{
    max-width: 620px;
    margin: auto;
    background: #ffffff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow:
        0 8px 30px
        rgba(0, 0, 0, 0.08);
}}

.header {{
    background: #111827;
    color: #ffffff;
    text-align: center;
    padding: 30px 20px;
}}

.logo {{
    font-size: 30px;
    font-weight: 800;
}}

.tagline {{
    margin-top: 7px;
    font-size: 13px;
    opacity: 0.75;
}}

.content {{
    padding: 35px 30px;
}}

.success {{
    text-align: center;
    margin-bottom: 30px;
}}

.success-icon {{
    width: 58px;
    height: 58px;
    line-height: 58px;
    margin: auto;
    border-radius: 50%;
    background: #e9f8ef;
    color: #16a34a;
    font-size: 30px;
    font-weight: bold;
}}

.success h1 {{
    margin:
        15px 0 8px;
    font-size: 26px;
}}

.success p {{
    margin: 0;
    color: #667085;
    font-size: 15px;
}}

.event-box {{
    background: #f8fafc;
    border-radius: 14px;
    padding: 22px;
    margin-bottom: 25px;
}}

.event-title {{
    margin:
        0 0 18px;
    font-size: 21px;
    font-weight: 700;
}}

.detail {{
    padding: 11px 0;
    border-bottom:
        1px solid #e5e7eb;
}}

.detail:last-child {{
    border-bottom: none;
}}

.detail-label {{
    display: block;
    font-size: 11px;
    color: #667085;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}}

.detail-value {{
    font-size: 15px;
    font-weight: 600;
}}

.ticket-box {{
    text-align: center;
    border:
        1px dashed #d0d5dd;
    border-radius: 14px;
    padding: 25px 20px;
}}

.ticket-heading {{
    margin: 0 0 15px;
    font-size: 14px;
    font-weight: 700;
}}

.qr {{
    display: block;
    width: 220px;
    max-width: 100%;
    height: auto;
    margin:
        0 auto 18px;
}}

.ticket-id-label {{
    color: #667085;
    font-size: 11px;
    margin-bottom: 5px;
}}

.ticket-id {{
    font-family: monospace;
    font-size: 14px;
    font-weight: 700;
    word-break: break-all;
}}

.button {{
    display: inline-block;
    margin-top: 20px;
    padding:
        14px 24px;
    border-radius: 10px;
    background: #111827;
    color: #ffffff !important;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
}}

.note {{
    margin-top: 25px;
    color: #667085;
    font-size: 13px;
    line-height: 1.6;
}}

.footer {{
    padding: 22px 20px;
    background: #f8fafc;
    text-align: center;
    color: #667085;
    font-size: 12px;
}}

.footer strong {{
    color: #172033;
}}

</style>

</head>


<body>

<div class="wrapper">

<div class="card">


    <!-- HEADER -->

    <div class="header">

        <div class="logo">
            EventWaa
        </div>

        <div class="tagline">
            Discover. Book. Experience.
        </div>

    </div>


    <!-- CONTENT -->

    <div class="content">


        <!-- SUCCESS -->

        <div class="success">

            <div class="success-icon">
                ✓
            </div>

            <h1>
                Booking Confirmed!
            </h1>

            <p>
                Hi {buyer_name},
                your EventWaa ticket is ready.
            </p>

        </div>


        <!-- EVENT -->

        <div class="event-box">

            <div class="event-title">
                {event_title}
            </div>


            <div class="detail">

                <span class="detail-label">
                    TICKET TYPE
                </span>

                <span class="detail-value">
                    {ticket_type}
                </span>

            </div>


            <div class="detail">

                <span class="detail-label">
                    QUANTITY
                </span>

                <span class="detail-value">
                    {quantity}
                </span>

            </div>


            <div class="detail">

                <span class="detail-label">
                    AMOUNT PAID
                </span>

                <span class="detail-value">
                    {formatted_amount}
                </span>

            </div>


            {date_html}

            {time_html}

            {location_html}

        </div>


        <!-- QR -->

        <div class="ticket-box">

            <p class="ticket-heading">
                YOUR EVENTWAA TICKET
            </p>


            <img
                src="cid:eventwaa-ticket-qr"
                class="qr"
                alt="EventWaa Ticket QR Code"
            />


            <div class="ticket-id-label">
                TICKET ID
            </div>


            <div class="ticket-id">
                {ticket_id}
            </div>


            <a
                href="{ticket_url}"
                class="button"
            >
                View My Ticket
            </a>

        </div>


        <p class="note">

            Please keep this email safe.
            Present the QR code at the event
            entrance for verification.

            You can also access your ticket
            anytime from your EventWaa account.

        </p>


    </div>


    <!-- FOOTER -->

    <div class="footer">

        <strong>
            EventWaa
        </strong>

        <br>

        Discover. Book. Experience.

    </div>


</div>

</div>

</body>

</html>
"""


        # ====================================================
        # CREATE FLASK-MAIL MESSAGE
        # ====================================================

        message = Message(

            subject=(
                f"Your EventWaa Ticket — "
                f"{event_title}"
            ),

            recipients=[
                buyer_email
            ]

        )


        # ====================================================
        # PLAIN TEXT VERSION
        # ====================================================

        message.body = f"""
Hi {buyer_name},

Your booking has been confirmed!

EVENT
{event_title}

TICKET TYPE
{ticket_type}

QUANTITY
{quantity}

AMOUNT PAID
{formatted_amount}

TICKET ID
{ticket_id}

View your ticket:
{ticket_url}

Please present your QR code at the event entrance.

Thank you for using EventWaa.

Discover. Book. Experience.
"""


        # ====================================================
        # HTML VERSION
        # ====================================================

        message.html = html_body


        # ====================================================
        # ATTACH QR CODE
        # ====================================================

        message.attach(

            "eventwaa-ticket-qr.png",

            "image",

            qr_bytes,

            headers=[
                (
                    "Content-ID",
                    "<eventwaa-ticket-qr>"
                ),

                (
                    "Content-Disposition",
                    "inline"
                )
            ]

        )


        # ====================================================
        # SEND
        # ====================================================

        mail.send(
            message
        )


        print(
            "EVENTWAA TICKET EMAIL SENT:",
            buyer_email
        )


        return {
            "success": True,
            "message":
                "Ticket email sent successfully."
        }


    except Exception as e:

        print(
            "EVENTWAA TICKET EMAIL ERROR:",
            str(e)
        )


        return {
            "success": False,
            "message": str(e)
        }

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
# EVENTWAA TEAM MEMBER INVITATION EMAIL
# ============================================================
def send_team_invitation_email(
    receiver_email,
    member_name,
    temporary_password,
    role,
    assigned_events
):
    try:
        # ====================================================
        # FRONTEND URL
        # ====================================================
        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173"
        ).rstrip("/")
        team_login_url = (
            f"{frontend_url}/team-login"
        )
        # ====================================================
        # ASSIGNED EVENTS
        # ====================================================
        events_html = ""
        events_text = ""
        if assigned_events:
            for event in assigned_events:
                event_title = (
                    event.get("title")
                    or event.get("eventTitle")
                    or "Untitled Event"
                )
                event_date = (
                    event.get("date")
                    or event.get("eventDate")
                    or ""
                )
                event_location = (
                    event.get("location")
                    or event.get("venue")
                    or event.get("eventVenue")
                    or ""
                )
                details_html = ""
                if event_date:
                    details_html += f"""
                        <div class="event-detail">
                            📅 {event_date}
                        </div>
                    """
                if event_location:
                    details_html += f"""
                        <div class="event-detail">
                            📍 {event_location}
                        </div>
                    """
                events_html += f"""
                    <div class="event-card">
                        <div class="event-title">
                            {event_title}
                        </div>
                        {details_html}
                    </div>
                """
                events_text += (
                    f"- {event_title}"
                )
                if event_date:
                    events_text += (
                        f" | {event_date}"
                    )
                if event_location:
                    events_text += (
                        f" | {event_location}"
                    )
                events_text += "\n"
        else:
            events_html = """
                <div class="event-card">
                    <div class="event-title">
                        No specific events assigned yet
                    </div>
                    <div class="event-detail">
                        Your host may assign events to you later.
                    </div>
                </div>
            """
            events_text = (
                "No specific events assigned yet.\n"
            )
        # ====================================================
        # HTML EMAIL
        # ====================================================
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>
<title>EventWaa Team Invitation</title>
<style>
body {{
    margin: 0;
    padding: 0;
    background: #f4f6f8;
    font-family: Arial, Helvetica, sans-serif;
    color: #172033;
}}
.wrapper {{
    width: 100%;
    padding: 35px 15px;
    box-sizing: border-box;
}}
.card {{
    max-width: 620px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}}
.header {{
    background: #111827;
    color: #ffffff;
    text-align: center;
    padding: 32px 20px;
}}
.logo {{
    font-size: 30px;
    font-weight: 800;
}}
.tagline {{
    margin-top: 7px;
    font-size: 13px;
    opacity: 0.75;
}}
.content {{
    padding: 35px 30px;
}}
.welcome {{
    text-align: center;
    margin-bottom: 28px;
}}
.welcome-icon {{
    width: 58px;
    height: 58px;
    line-height: 58px;
    margin: 0 auto;
    border-radius: 50%;
    background: #eef2ff;
    font-size: 27px;
}}
.welcome h1 {{
    margin: 15px 0 8px;
    font-size: 26px;
}}
.welcome p {{
    margin: 0;
    color: #667085;
    font-size: 15px;
    line-height: 1.6;
}}
.message {{
    font-size: 15px;
    line-height: 1.7;
    color: #475467;
    margin-bottom: 25px;
}}
.account-box {{
    background: #f8fafc;
    border-radius: 14px;
    padding: 22px;
    margin-bottom: 25px;
}}
.account-title {{
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 18px;
}}
.detail {{
    padding: 11px 0;
    border-bottom: 1px solid #e5e7eb;
}}
.detail:last-child {{
    border-bottom: none;
}}
.label {{
    display: block;
    font-size: 11px;
    color: #667085;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
}}
.value {{
    font-size: 15px;
    font-weight: 600;
    word-break: break-word;
}}
.password {{
    display: inline-block;
    margin-top: 3px;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    font-family: monospace;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
    word-break: break-all;
}}
.events {{
    margin-bottom: 25px;
}}
.events h3 {{
    margin: 0 0 15px;
    font-size: 17px;
}}
.event-card {{
    background: #f8fafc;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 9px;
}}
.event-title {{
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 5px;
}}
.event-detail {{
    color: #667085;
    font-size: 12px;
    line-height: 1.6;
}}
.button-wrapper {{
    text-align: center;
    margin: 30px 0;
}}
.button {{
    display: inline-block;
    padding: 14px 25px;
    border-radius: 10px;
    background: #111827;
    color: #ffffff !important;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
}}
.security {{
    background: #fff7ed;
    border-radius: 12px;
    padding: 16px;
    color: #9a3412;
    font-size: 13px;
    line-height: 1.6;
}}
.note {{
    margin-top: 25px;
    color: #667085;
    font-size: 13px;
    line-height: 1.6;
}}
.footer {{
    padding: 22px 20px;
    background: #f8fafc;
    text-align: center;
    color: #667085;
    font-size: 12px;
}}
.footer strong {{
    color: #172033;
}}
@media (max-width: 600px) {{
    .wrapper {{
        padding: 15px 8px;
    }}
    .content {{
        padding: 28px 20px;
    }}
    .welcome h1 {{
        font-size: 23px;
    }}
}}
</style>
</head>
<body>
<div class="wrapper">
<div class="card">
    <div class="header">
        <div class="logo">
            EventWaa
        </div>
        <div class="tagline">
            Discover. Book. Experience.
        </div>
    </div>
    <div class="content">
        <div class="welcome">
            <div class="welcome-icon">
                👥
            </div>
            <h1>
                You're Invited to a Team
            </h1>
            <p>
                Welcome to the EventWaa team,
                {member_name}.
            </p>
        </div>
        <div class="message">
            You have been added as a team member
            on EventWaa. You can use the login
            details below to access your team account
            and help manage event check-ins.
        </div>
        <div class="account-box">
            <div class="account-title">
                Your Team Login
            </div>
            <div class="detail">
                <span class="label">
                    EMAIL
                </span>
                <span class="value">
                    {receiver_email}
                </span>
            </div>
            <div class="detail">
                <span class="label">
                    ROLE
                </span>
                <span class="value">
                    {role}
                </span>
            </div>
            <div class="detail">
                <span class="label">
                    TEMPORARY PASSWORD
                </span>
                <span class="password">
                    {temporary_password}
                </span>
            </div>
        </div>
        <div class="events">
            <h3>
                Your Assigned Events
            </h3>
            {events_html}
        </div>
        <div class="button-wrapper">
            <a
                href="{team_login_url}"
                class="button"
            >
                Open Team Login
            </a>
        </div>
        <div class="security">
            <strong>
                🔐 Keep your login details private.
            </strong>
            <br>
            This temporary password was generated
            specifically for your EventWaa team account.
            Do not share your login credentials with
            anyone else.
        </div>
        <p class="note">
            If you were not expecting this invitation,
            please contact the EventWaa host who added
            you to their team.
        </p>
    </div>
    <div class="footer">
        <strong>
            EventWaa
        </strong>
        <br>
        Discover. Book. Experience.
        <br><br>
        Uganda's event discovery and ticketing platform
    </div>
</div>
</div>
</body>
</html>
"""
        # ====================================================
        # CREATE MESSAGE
        # ====================================================
        message = Message(
            subject="You're invited to an EventWaa team",
            sender=app.config["MAIL_DEFAULT_SENDER"],
            recipients=[receiver_email]
        )
        # ====================================================
        # PLAIN TEXT VERSION
        # ====================================================
        message.body = f"""
Hello {member_name},
You have been invited to join an EventWaa event team.
YOUR TEAM ACCOUNT
-----------------
Email:
{receiver_email}
Role:
{role}
Temporary password:
{temporary_password}
ASSIGNED EVENTS
---------------
{events_text}
TEAM LOGIN
----------
{team_login_url}
IMPORTANT
---------
Keep your login details private.
This is a temporary password generated specifically
for your EventWaa team account.
If you were not expecting this invitation,
please contact the EventWaa host who added you.
--------------------------------------------------
EventWaa
Discover. Book. Experience.
Uganda's event discovery and ticketing platform
"""
        # ====================================================
        # HTML VERSION
        # ====================================================
        message.html = html_body
        # ====================================================
        # SEND
        # ====================================================
        mail.send(message)
        return {
            "success": True,
            "message":
                "Team invitation email sent successfully."
        }
    except Exception as e:
        print(
            "EVENTWAA TEAM INVITATION EMAIL ERROR:",
            str(e)
        )
        return {
            "success": False,
            "message":
                "Unable to send the team invitation email."
        }

# ============================================================
# ADMIN LOGIN SECURITY
# ============================================================

admin_failed_login_attempts = 0


# ============================================================
# FLUTTERWAVE CONFIGURATION
# ============================================================

FLW_PUBLIC_KEY = os.getenv(
    "FLW_PUBLIC_KEY",
    ""
).strip()

FLW_SECRET_KEY = os.getenv(
    "FLW_SECRET_KEY",
    ""
).strip()

print(
    "FLW SECRET KEY LOADED:",
    bool(FLW_SECRET_KEY)
)

print(
    "FLW SECRET KEY LENGTH:",
    len(FLW_SECRET_KEY)
)


FLW_SECRET_HASH = os.getenv(
    "FLW_SECRET_HASH",
    ""
).strip()

FLW_ENCRYPTION_KEY = os.getenv(
    "FLW_ENCRYPTION_KEY",
    ""
).strip()

FLW_API_URL = (
    "https://api.flutterwave.com/v3"
)


# ============================================================
# PESAPAL CONFIGURATION
# ============================================================

PESAPAL_CONSUMER_KEY = os.getenv(
    "PESAPAL_CONSUMER_KEY",
    ""
).strip()

PESAPAL_CONSUMER_SECRET = os.getenv(
    "PESAPAL_CONSUMER_SECRET",
    ""
).strip()

# Sandbox by default.
# Change to https://pay.pesapal.com/v3 for production.
PESAPAL_BASE_URL = os.getenv(
    "PESAPAL_BASE_URL",
    "https://cybqa.pesapal.com/pesapalv3"
).rstrip("/")

PESAPAL_IPN_ID = os.getenv(
    "PESAPAL_IPN_ID",
    ""
).strip()

PESAPAL_CALLBACK_URL = os.getenv(
    "PESAPAL_CALLBACK_URL",
    ""
).strip()

PESAPAL_CANCELLATION_URL = os.getenv(
    "PESAPAL_CANCELLATION_URL",
    ""
).strip()

# Frontend URL used after PesaPal redirects the customer back.
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
).rstrip("/")

# ============================================================
# EVENTWAA ADMIN AUTHENTICATION
# ============================================================

ADMIN_EMAIL = os.getenv(
    "ADMIN_EMAIL",
    ""
).strip().lower()


ADMIN_PASSWORD_HASH = os.getenv(
    "ADMIN_PASSWORD_HASH",
    ""
).strip()


ADMIN_AUTH_SECRET = os.getenv(
    "ADMIN_AUTH_SECRET",
    ""
).strip()


# ============================================================
# ADMIN AUTH TOKEN
# ============================================================

def get_admin_token_serializer():

    if not ADMIN_AUTH_SECRET:

        raise RuntimeError(
            "ADMIN_AUTH_SECRET is not configured."
        )

    return URLSafeTimedSerializer(
        ADMIN_AUTH_SECRET,
        salt="eventwaa-admin-auth"
    )

# ============================================================
# ADMIN TEAM TOKEN AUTHENTICATION
#
# IMPORTANT:
# This is SEPARATE from admin authentication.
#
# Team members MUST NOT receive the admin token.
# ============================================================

TEAM_TOKEN_MAX_AGE = 60 * 60 * 24


def get_team_token_serializer():

    # --------------------------------------------------------
    # Prefer a dedicated team secret.
    #
    # If TEAM_AUTH_SECRET is not configured yet, fall back
    # to ADMIN_AUTH_SECRET so the system still works locally.
    # --------------------------------------------------------

    team_secret = (
        os.getenv(
            "TEAM_AUTH_SECRET",
            ""
        ).strip()
        or
        str(
            ADMIN_AUTH_SECRET
        ).strip()
    )

    if not team_secret:

        raise RuntimeError(
            "TEAM_AUTH_SECRET is not configured."
        )

    return URLSafeTimedSerializer(
        team_secret,
        salt="eventwaa-team-auth"
    )



# ============================================================
# ADMIN OR TEAM AUTHENTICATION
#
# Allows:
# - EventWaa Admin
# - EventWaa Admin Team Members
# - EventWaa Host Team Members
#
# Does NOT allow:
# - Normal users
# - Normal hosts
# - Unauthenticated requests
# ============================================================

def verify_admin_or_team_token():

    auth_header = request.headers.get(
        "Authorization",
        ""
    ).strip()

    if not auth_header.startswith(
        "Bearer "
    ):

        return None

    token = auth_header.replace(
        "Bearer ",
        "",
        1
    ).strip()

    if not token:

        return None

    # ========================================================
    # TRY MAIN ADMIN TOKEN
    # ========================================================

    try:

        admin_user = verify_admin_token(
            token
        )

        if admin_user:

            return {
                "role": "admin",
                "user": admin_user
            }

    except Exception as error:

        print(
            "ADMIN TOKEN CHECK FAILED:",
            error
        )

    # ========================================================
    # TRY ADMIN TEAM TOKEN
    # ========================================================

    try:

        admin_team_user = verify_admin_team_token(
            token
        )

        if admin_team_user:

            return {
                "role": "team",
                "user": admin_team_user
            }

    except Exception as error:

        print(
            "ADMIN TEAM TOKEN CHECK FAILED:",
            error
        )

    # ========================================================
    # TRY HOST TEAM TOKEN
    # ========================================================

    try:

        host_team_user = verify_team_token(
            token
        )

        if host_team_user:

            return {
                "role": "team",
                "user": host_team_user
            }

    except Exception as error:

        print(
            "HOST TEAM TOKEN CHECK FAILED:",
            error
        )

    # ========================================================
    # INVALID TOKEN
    # ========================================================

    return None

# ============================================================
# NORMAL USER / HOST AUTHENTICATION
# ============================================================

USER_TOKEN_MAX_AGE = 60 * 60 * 24


def get_user_token_serializer():

    secret = os.getenv(
        "USER_AUTH_SECRET"
    )

    if not secret:
        secret = os.getenv(
            "ADMIN_AUTH_SECRET"
        )

    if not secret:
        raise RuntimeError(
            "USER_AUTH_SECRET or ADMIN_AUTH_SECRET is not configured."
        )

    return URLSafeTimedSerializer(
        secret,
        salt="eventwaa-user-auth"
    )


def create_user_token(user):

    serializer = get_user_token_serializer()

    return serializer.dumps({
        "role": "user",
        "userId": user.get("id"),
        "email": str(
            user.get("email", "")
        ).strip().lower()
    })


def verify_user_token(token):

    if not token:
        return None

    try:

        serializer = get_user_token_serializer()

        data = serializer.loads(
            token,
            max_age=USER_TOKEN_MAX_AGE
        )

    except Exception:

        return None

    if not isinstance(data, dict):
        return None

    if data.get("role") != "user":
        return None

    email = str(
        data.get("email", "")
    ).strip().lower()

    if not email:
        return None

    users = load_json_file(
        "users.json",
        []
    )

    if not isinstance(users, list):
        return None

    matched_user = None

    for user in users:

        if not isinstance(user, dict):
            continue

        if (
            str(
                user.get("email", "")
            ).strip().lower()
            == email
        ):

            matched_user = user
            break

    if not matched_user:
        return None

    # --------------------------------------------------------
    # ACCOUNT STATUS
    # --------------------------------------------------------

    if matched_user.get(
        "status"
    ) == "suspended":

        return None

    # --------------------------------------------------------
    # TOKEN USER ID CHECK
    # --------------------------------------------------------

    token_user_id = data.get(
        "userId"
    )

    stored_user_id = matched_user.get(
        "id"
    )

    if (
        token_user_id is not None
        and stored_user_id is not None
        and str(token_user_id)
        != str(stored_user_id)
    ):

        return None

    # --------------------------------------------------------
    # RETURN VERIFIED USER
    # --------------------------------------------------------

    safe_user = matched_user.copy()

    safe_user.pop(
        "password",
        None
    )

    safe_user["hostId"] = matched_user.get(
        "id"
    )

    return safe_user


def get_bearer_token():

    authorization = request.headers.get(
        "Authorization",
        ""
    ).strip()

    if not authorization:
        return None

    if not authorization.lower().startswith(
        "bearer "
    ):

        return None

    return authorization[7:].strip()


def verify_user_request():

    token = get_bearer_token()

    if not token:
        return None

    return verify_user_token(
        token
    )


def host_required(function):

    @wraps(function)
    def decorated_function(*args, **kwargs):

        user = verify_user_request()

        if not user:

            return jsonify({
                "success": False,
                "message": "Authentication required."
            }), 401

        # ----------------------------------------------------
        # NORMAL HOST CHECK
        # ----------------------------------------------------

        is_host = (
            user.get("hostMode") is True
            or user.get("verifiedHost") is True
            or str(
                user.get("hostMode", "")
            ).lower() == "true"
            or str(
                user.get("verifiedHost", "")
            ).lower() == "true"
        )

        if not is_host:

            return jsonify({
                "success": False,
                "message": "Host access required."
            }), 403

        return function(
            user,
            *args,
            **kwargs
        )

    decorated_function.__name__ = function.__name__

    return decorated_function

# ============================================================
# CREATE TEAM TOKEN
#
# Supports BOTH:
#
#   HOST TEAM
#       teamType = "host"
#
#   ADMIN TEAM
#       teamType = "admin"
#
# The token source is stored inside the signed token so the
# backend knows exactly which team system must verify it.
# ============================================================

def create_team_token(
    email,
    member_id=None,
    name=None,
    team_type="host"
):

    try:

        # ====================================================
        # SUPPORT WHOLE ACCOUNT DICTIONARY
        # ====================================================

        if isinstance(email, dict):

            account = email

            email = (
                account.get("email", "")
                or ""
            )

            if member_id is None:

                member_id = (
                    account.get(
                        "memberId",
                        account.get(
                            "memberid",
                            account.get(
                                "id",
                                ""
                            )
                        )
                    )
                )

            if name is None:

                name = (
                    account.get("name", "")
                    or ""
                )

            # ------------------------------------------------
            # IF ACCOUNT ALREADY SPECIFIES TEAM TYPE
            # ------------------------------------------------

            if account.get("teamType"):

                team_type = account.get(
                    "teamType"
                )

        # ====================================================
        # NORMALIZE TEAM TYPE
        # ====================================================

        normalized_team_type = str(
            team_type or "host"
        ).strip().lower()

        if normalized_team_type not in (
            "host",
            "admin"
        ):

            print(
                "CREATE TEAM TOKEN ERROR: "
                "INVALID TEAM TYPE:",
                normalized_team_type
            )

            return None

        # ====================================================
        # NORMALIZE EMAIL
        # ====================================================

        normalized_email = str(
            email or ""
        ).strip().lower()

        if not normalized_email:

            print(
                "CREATE TEAM TOKEN ERROR: "
                "TEAM EMAIL IS EMPTY."
            )

            return None

        # ====================================================
        # NORMALIZE MEMBER ID
        # ====================================================

        normalized_member_id = str(
            member_id or ""
        ).strip()

        # ====================================================
        # NORMALIZE NAME
        # ====================================================

        normalized_name = str(
            name or ""
        ).strip()

        # ====================================================
        # TOKEN SERIALIZER
        # ====================================================

        serializer = (
            get_team_token_serializer()
        )

        # ====================================================
        # TOKEN PAYLOAD
        # ====================================================

        payload = {

            "role":
                "team",

            "teamType":
                normalized_team_type,

            "email":
                normalized_email,

            "memberId":
                normalized_member_id,

            "name":
                normalized_name

        }

        # ====================================================
        # DEBUG
        # ====================================================

        print(
            "TEAM TOKEN PAYLOAD:",
            {
                "role":
                    payload["role"],

                "teamType":
                    payload["teamType"],

                "email":
                    payload["email"],

                "memberId":
                    payload["memberId"],

                "name":
                    payload["name"]
            }
        )

        # ====================================================
        # CREATE TOKEN
        # ====================================================

        token = serializer.dumps(
            payload
        )

        print(
            "TEAM TOKEN CREATED:",
            bool(token)
        )

        return token

    except Exception as e:

        print(
            "CREATE TEAM TOKEN ERROR:",
            str(e)
        )

        return None


# ============================================================
# VERIFY HOST TEAM TOKEN
#
# Host Team:
#
#     users.json
#     team_members.json
#
# Admin Team tokens are rejected here.
# ============================================================

def verify_team_token(token):

    if not token:
        return None

    try:

        serializer = (
            get_team_token_serializer()
        )

        data = serializer.loads(
            token,
            max_age=TEAM_TOKEN_MAX_AGE
        )

        if not isinstance(
            data,
            dict
        ):

            return None

        # ====================================================
        # ROLE
        # ====================================================

        if str(
            data.get(
                "role",
                ""
            )
        ).strip().lower() != "team":

            return None

        # ====================================================
        # TEAM TYPE
        # ====================================================

        team_type = str(
            data.get(
                "teamType",
                ""
            )
        ).strip().lower()

        if team_type != "host":

            print(
                "HOST TEAM TOKEN REJECTED: "
                "TOKEN IS NOT HOST TEAM."
            )

            return None

        # ====================================================
        # EMAIL
        # ====================================================

        token_email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()

        if not token_email:

            return None

        print(
            "HOST TEAM TOKEN EMAIL:",
            token_email
        )

        # ====================================================
        # USERS
        # ====================================================

        users = load_json_file(
            "users.json",
            []
        )

        if not isinstance(
            users,
            list
        ):

            users = []

        account = None

        for user in users:

            if not isinstance(
                user,
                dict
            ):

                continue

            user_email = str(
                user.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            if user_email != token_email:
                continue

            user_role = str(
                user.get(
                    "role",
                    ""
                ) or ""
            ).strip().lower()

            if user_role != "team":

                print(
                    "HOST TEAM TOKEN REJECTED: "
                    "USER IS NOT HOST TEAM:",
                    token_email
                )

                return None

            account = user

            break

        if account is None:

            print(
                "HOST TEAM TOKEN REJECTED: "
                "ACCOUNT NOT FOUND:",
                token_email
            )

            return None

        # ====================================================
        # USER STATUS
        # ====================================================

        if str(
            account.get(
                "status",
                "active"
            ) or "active"
        ).strip().lower() != "active":

            return None

        # ====================================================
        # FIND HOST TEAM MEMBER
        # ====================================================

        host_team_member = (
            find_host_team_member_by_identity(
                account
            )
        )

        if host_team_member is None:

            print(
                "HOST TEAM TOKEN REJECTED: "
                "HOST TEAM MEMBER NOT FOUND:",
                token_email
            )

            return None

        # ====================================================
        # MEMBER STATUS
        # ====================================================

        if str(
            host_team_member.get(
                "status",
                "Active"
            ) or "Active"
        ).strip().lower() != "active":

            return None

        # ====================================================
        # MEMBER ID
        # ====================================================

        token_member_id = str(
            data.get(
                "memberId",
                ""
            ) or ""
        ).strip()

        stored_member_id = str(
            host_team_member.get(
                "id",
                ""
            ) or ""
        ).strip()

        stored_user_id = str(
            host_team_member.get(
                "userId",
                ""
            ) or ""
        ).strip()

        if token_member_id:

            if token_member_id not in (
                stored_member_id,
                stored_user_id
            ):

                print(
                    "HOST TEAM TOKEN REJECTED: "
                    "MEMBER ID MISMATCH."
                )

                return None

        # ====================================================
        # BUILD VERIFIED ACCOUNT
        # ====================================================

        verified_account = dict(
            account
        )

        verified_account[
            "teamType"
        ] = "host"

        verified_account[
            "memberId"
        ] = host_team_member.get(
            "id",
            ""
        )

        verified_account[
            "hostId"
        ] = host_team_member.get(
            "hostId",
            ""
        )

        verified_account[
            "hostEmail"
        ] = host_team_member.get(
            "hostEmail",
            ""
        )

        verified_account[
            "teamMember"
        ] = True

        verified_account[
            "adminTeamMember"
        ] = False

        verified_account[
            "eventIds"
        ] = host_team_member.get(
            "eventIds",
            []
        )

        verified_account[
            "eventId"
        ] = host_team_member.get(
            "eventId"
        )

        verified_account[
            "eventTitle"
        ] = host_team_member.get(
            "eventTitle",
            ""
        )

        verified_account[
            "teamMemberRecord"
        ] = host_team_member

        print(
            "HOST TEAM TOKEN VERIFIED:",
            token_email
        )

        return verified_account

    except Exception as e:

        print(
            "HOST TEAM TOKEN VERIFICATION ERROR:",
            str(e)
        )

        return None


# ============================================================
# PESAPAL AUTHENTICATION
# ============================================================

def get_pesapal_token():

    if not PESAPAL_CONSUMER_KEY:
        raise RuntimeError(
            "PesaPal consumer key is not configured."
        )

    if not PESAPAL_CONSUMER_SECRET:
        raise RuntimeError(
            "PesaPal consumer secret is not configured."
        )

    url = (
        f"{PESAPAL_BASE_URL}"
        "/api/Auth/RequestToken"
    )

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    payload = {
        "consumer_key":
            PESAPAL_CONSUMER_KEY,

        "consumer_secret":
            PESAPAL_CONSUMER_SECRET
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=30
    )

    try:

        data = response.json()

    except Exception:

        data = {}

    print(
        "PESAPAL AUTH STATUS:",
        response.status_code
    )

    print(
        "PESAPAL AUTH RESPONSE:",
        data
    )   

    if response.status_code >= 400:

        print(
            "PESAPAL AUTH ERROR:",
            response.status_code,
            data
        )

        raise RuntimeError(
            data.get("message")
            or
            "Unable to authenticate with PesaPal."
        )

    token = data.get("token")

    if not token:

        raise RuntimeError(
            "PesaPal authentication token was not returned."
        )

    return token


@app.route("/payments/pesapal/test-auth", methods=["GET"])
def test_pesapal_auth():

    try:

        token = get_pesapal_token()

        return jsonify({
            "success": True,
            "message": "PesaPal sandbox authentication successful.",
            "tokenReceived": bool(token)
        }), 200

    except Exception as e:

        print(
            "PESAPAL TEST AUTH ERROR:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ============================================================
# PESAPAL SUBMIT ORDER
# ============================================================

def submit_pesapal_order(
    payment,
    buyer_phone=""
):

    if not PESAPAL_IPN_ID:

        raise RuntimeError(
            "PesaPal IPN ID is not configured."
        )

    if not PESAPAL_CALLBACK_URL:

        raise RuntimeError(
            "PesaPal callback URL is not configured."
        )

    token = get_pesapal_token()

    payment_id = payment.get(
        "id"
    )

    timestamp = int(
        datetime.now().timestamp() * 1000
    )

    # PesaPal merchant reference must be unique
    # and safe for PesaPal.
    merchant_reference = (
        f"EWPP-{payment_id}-{timestamp}"
    )

    buyer = payment.get(
        "buyer",
        {}
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

    name_parts = buyer_name.split()

    first_name = (
        name_parts[0]
        if name_parts
        else "EventWaa"
    )

    last_name = (
        " ".join(name_parts[1:])
        if len(name_parts) > 1
        else "Customer"
    )

    phone = str(
        buyer_phone
        or
        buyer.get(
            "phone",
            ""
        )
        or
        ""
    ).strip()

    payload = {

        "id":
            merchant_reference,

        "currency":
            str(
                payment.get(
                    "currency",
                    "UGX"
                )
            ).upper(),

        "amount":
            float(
                payment.get(
                    "amount",
                    0
                )
                or 0
            ),

        "description":
            (
                "EventWaa ticket - "
                f"{payment.get('eventTitle', 'Event')}"
            ),

        "callback_url":
            PESAPAL_CALLBACK_URL,

        "notification_id":
            PESAPAL_IPN_ID,

        "billing_address": {

            "email_address":
                buyer_email,

            "phone_number":
                phone,

            "country_code":
                "UG",

            "first_name":
                first_name,

            "middle_name":
                "",

            "last_name":
                last_name,

            "line_1":
                "",

            "line_2":
                "",

            "city":
                "",

            "state":
                "",

            "postal_code":
                "",

            "zip_code":
                ""
        }
    }

    url = (
        f"{PESAPAL_BASE_URL}"
        "/api/Transactions/SubmitOrderRequest"
    )

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization":
            f"Bearer {token}"
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=30
    )

    try:
        data = response.json()
    except Exception:
        data = {}

    if response.status_code >= 400:

        print(
            "PESAPAL ORDER ERROR:",
            response.status_code,
            data
        )

        raise RuntimeError(
            data.get("message")
            or
            "PesaPal order creation failed."
        )

    order_tracking_id = data.get(
        "order_tracking_id"
    )

    redirect_url = data.get(
        "redirect_url"
    )

    if not order_tracking_id:

        raise RuntimeError(
            "PesaPal did not return an order tracking ID."
        )

    if not redirect_url:

        raise RuntimeError(
            "PesaPal did not return a checkout URL."
        )

    return {
        "merchant_reference":
            merchant_reference,

        "order_tracking_id":
            order_tracking_id,

        "redirect_url":
            redirect_url
    }


# ============================================================
# PESAPAL TRANSACTION STATUS
# ============================================================

def get_pesapal_transaction_status(
    order_tracking_id
):

    token = get_pesapal_token()

    url = (
        f"{PESAPAL_BASE_URL}"
        "/api/Transactions/GetTransactionStatus"
    )

    headers = {
        "Accept": "application/json",
        "Authorization":
            f"Bearer {token}"
    }

    response = requests.get(
        url,
        headers=headers,
        params={
            "orderTrackingId":
                order_tracking_id
        },
        timeout=30
    )

    try:
        data = response.json()
    except Exception:
        data = {}

    if response.status_code >= 400:

        print(
            "PESAPAL STATUS ERROR:",
            response.status_code,
            data
        )

        raise RuntimeError(
            data.get("message")
            or
            "Unable to verify PesaPal transaction."
        )

    return data

# ============================================================
# VERIFY ADMIN TEAM TOKEN
#
# Admin Team:
#
#     team_accounts.json
#     admin_team_members.json
#
# IMPORTANT:
# Admin Team accounts are stored in the shared
# team_accounts.json file.
#
# Admin Team member records remain in:
#
#     admin_team_members.json
#
# Completely separate from Host Team authentication.
# ============================================================

def verify_admin_team_token(token):

    if not token:
        return None

    try:

        serializer = (
            get_team_token_serializer()
        )

        data = serializer.loads(
            token,
            max_age=TEAM_TOKEN_MAX_AGE
        )

        if not isinstance(
            data,
            dict
        ):

            return None

        # ====================================================
        # ROLE
        # ====================================================

        if str(
            data.get(
                "role",
                ""
            )
        ).strip().lower() != "team":

            return None

        # ====================================================
        # TEAM TYPE
        # ====================================================

        team_type = str(
            data.get(
                "teamType",
                ""
            )
        ).strip().lower()

        if team_type != "admin":

            print(
                "ADMIN TEAM TOKEN REJECTED: "
                "TOKEN IS NOT ADMIN TEAM."
            )

            return None

        # ====================================================
        # EMAIL
        # ====================================================

        token_email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()

        if not token_email:

            return None

        print(
            "ADMIN TEAM TOKEN EMAIL:",
            token_email
        )

        # ====================================================
        # TEAM ACCOUNTS
        #
        # Admin Team accounts are stored in:
        #
        #     team_accounts.json
        #
        # DO NOT use admin_team_accounts.json here.
        # ====================================================

        team_accounts = (
            load_json_file(
                "team_accounts.json",
                []
            )
        )

        if not isinstance(
            team_accounts,
            list
        ):

            team_accounts = []

        account = None

        for item in team_accounts:

            if not isinstance(
                item,
                dict
            ):

                continue

            item_email = str(
                item.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            if item_email == token_email:

                account = item

                break

        # ====================================================
        # ACCOUNT NOT FOUND
        # ====================================================

        if account is None:

            print(
                "ADMIN TEAM TOKEN REJECTED: "
                "ACCOUNT NOT FOUND:",
                token_email
            )

            return None

        # ====================================================
        # ACCOUNT STATUS
        # ====================================================

        if str(
            account.get(
                "status",
                "Active"
            ) or "Active"
        ).strip().lower() != "active":

            print(
                "ADMIN TEAM TOKEN REJECTED: "
                "ACCOUNT INACTIVE:",
                token_email
            )

            return None

        # ====================================================
        # MEMBER ID
        # ====================================================

        token_member_id = str(
            data.get(
                "memberId",
                ""
            ) or ""
        ).strip()

        stored_member_id = str(
            account.get(
                "memberId",
                account.get(
                    "id",
                    ""
                )
            )
            or ""
        ).strip()

        if token_member_id:

            if (
                stored_member_id
                and
                token_member_id
                !=
                stored_member_id
            ):

                print(
                    "ADMIN TEAM TOKEN REJECTED: "
                    "MEMBER ID MISMATCH."
                )

                print(
                    "TOKEN MEMBER ID:",
                    token_member_id
                )

                print(
                    "ACCOUNT MEMBER ID:",
                    stored_member_id
                )

                return None

        # ====================================================
        # LOAD ADMIN MEMBER RECORD
        #
        # This remains separate from team_accounts.json.
        # ====================================================

        admin_members = (
            load_admin_team_members()
        )

        current_member = None

        for member in admin_members:

            if not isinstance(
                member,
                dict
            ):

                continue

            member_id = str(
                member.get(
                    "id",
                    ""
                ) or ""
            ).strip()

            member_member_id = str(
                member.get(
                    "memberId",
                    ""
                ) or ""
            ).strip()

            member_email = str(
                member.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            # ------------------------------------------------
            # MATCH BY TOKEN MEMBER ID
            # ------------------------------------------------

            if (
                token_member_id
                and
                token_member_id
                in (
                    member_id,
                    member_member_id
                )
            ):

                current_member = member

                break

            # ------------------------------------------------
            # FALLBACK MATCH BY EMAIL
            # ------------------------------------------------

            if (
                member_email
                and
                member_email
                ==
                token_email
            ):

                current_member = member

                break

        # ====================================================
        # MEMBER STATUS
        # ====================================================

        if isinstance(
            current_member,
            dict
        ):

            if str(
                current_member.get(
                    "status",
                    "Active"
                ) or "Active"
            ).strip().lower() != "active":

                print(
                    "ADMIN TEAM TOKEN REJECTED: "
                    "MEMBER INACTIVE:",
                    token_email
                )

                return None

        # ====================================================
        # BUILD VERIFIED ACCOUNT
        # ====================================================

        verified_account = dict(
            account
        )

        verified_account[
            "teamType"
        ] = "admin"

        verified_account[
            "teamMember"
        ] = True

        verified_account[
            "adminTeamMember"
        ] = True

        verified_account[
            "teamMemberRecord"
        ] = current_member

        # ====================================================
        # USE MEMBER ID FROM ACTUAL ADMIN MEMBER RECORD
        # ====================================================

        if isinstance(
            current_member,
            dict
        ):

            verified_account[
                "memberId"
            ] = (
                current_member.get(
                    "id"
                )
                or
                current_member.get(
                    "memberId"
                )
            )

            verified_account[
                "role"
            ] = current_member.get(
                "role",
                verified_account.get(
                    "role",
                    "Scanner"
                )
            )

        # ====================================================
        # VERIFIED
        # ====================================================

        print(
            "ADMIN TEAM TOKEN VERIFIED:",
            token_email
        )

        print(
            "ADMIN TEAM MEMBER:",
            verified_account.get(
                "memberId"
            )
        )

        return verified_account

    except Exception as e:

        print(
            "ADMIN TEAM TOKEN VERIFICATION ERROR:",
            str(e)
        )

        return None
    
# ============================================================
# TEAM REQUIRED
#
# Supports BOTH:
#
#     Host Team
#     Admin Team
#
# The token decides which authentication system is used.
# ============================================================

def team_required(function):

    @wraps(function)
    def decorated(
        *args,
        **kwargs
    ):

        # ====================================================
        # AUTHORIZATION HEADER
        # ====================================================

        authorization = request.headers.get(
            "Authorization",
            ""
        ).strip()

        if not authorization:

            return jsonify({

                "success": False,

                "message":
                    "Team authentication required."

            }), 401

        if not authorization.startswith(
            "Bearer "
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid team authorization."

            }), 401

        token = authorization[
            len("Bearer "):
        ].strip()

        if not token:

            return jsonify({

                "success": False,

                "message":
                    "Team authentication required."

            }), 401

        # ====================================================
        # DECODE TEAM TYPE
        # ====================================================

        try:

            serializer = (
                get_team_token_serializer()
            )

            token_data = serializer.loads(
                token,
                max_age=TEAM_TOKEN_MAX_AGE
            )

        except Exception:

            return jsonify({

                "success": False,

                "message":
                    "Team session is invalid or expired."

            }), 401

        if not isinstance(
            token_data,
            dict
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid team session."

            }), 401

        team_type = str(
            token_data.get(
                "teamType",
                ""
            )
        ).strip().lower()

        # ====================================================
        # ADMIN TEAM
        # ====================================================

        if team_type == "admin":

            account = verify_admin_team_token(
                token
            )

        # ====================================================
        # HOST TEAM
        # ====================================================

        elif team_type == "host":

            account = verify_team_token(
                token
            )

        # ====================================================
        # UNKNOWN TEAM TYPE
        # ====================================================

        else:

            print(
                "TEAM AUTH REJECTED: "
                "UNKNOWN TEAM TYPE:",
                team_type
            )

            return jsonify({

                "success": False,

                "message":
                    "Invalid team account type."

            }), 401

        # ====================================================
        # INVALID ACCOUNT
        # ====================================================

        if account is None:

            return jsonify({

                "success": False,

                "message":
                    "Team session is invalid or expired."

            }), 401

        if not isinstance(
            account,
            dict
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid team account."

            }), 401

        # ====================================================
        # STATUS
        # ====================================================

        account_status = str(
            account.get(
                "status",
                "active"
            ) or "active"
        ).strip().lower()

        if account_status != "active":

            return jsonify({

                "success": False,

                "message":
                    "Your team account has been disabled."

            }), 403

        # ====================================================
        # SUCCESS
        # ====================================================

        return function(
            account,
            *args,
            **kwargs
        )

    return decorated

# ============================================================
# TEAM DASHBOARD
#
# TEAM ONLY
#
# GET /team/dashboard
#
# This endpoint is used ONLY by logged-in EventWaa team
# members.
#
# It does NOT use @admin_required.
#
# It uses @team_required, which verifies:
#
# Authorization: Bearer <eventwaa_team_token>
#
# The authenticated CURRENT team account is passed into
# this route as "account".
#
# The dashboard receives:
#
# - Current team account
# - Admin assigned event
# - Real event information
# - Event poster
# - All EventWaa events
# - Assignment information
# - Assignment history
#
# IMPORTANT:
#
# Team members are NOT allowed to assign themselves to events.
# Assignment is controlled ONLY from AdminTeamMembers.jsx.
# ============================================================
@app.route(
    "/team/dashboard",
    methods=["GET"]
)
@team_required
def get_team_dashboard(account):
    try:
        # ====================================================
        # SAFETY
        # ====================================================
        if not isinstance(
            account,
            dict
        ):
            return jsonify({
                "success": False,
                "message":
                    "Invalid team account."
            }), 401
        # ====================================================
        # LOAD EVENTS
        # ====================================================
        try:
            events = load_events()
        except Exception as event_error:
            print(
                "TEAM DASHBOARD EVENTS LOAD ERROR:",
                str(event_error)
            )
            events = []
        if not isinstance(
            events,
            list
        ):
            events = []
        # ====================================================
        # NORMALIZE ACCOUNT VALUES
        # ====================================================
        account_id = str(
            account.get(
                "id",
                ""
            ) or ""
        ).strip()
        member_id = str(
            account.get(
                "memberId",
                account.get(
                    "memberid",
                    ""
                )
            ) or ""
        ).strip()
        email = str(
            account.get(
                "email",
                ""
            ) or ""
        ).strip().lower()
        name = str(
            account.get(
                "name",
                "Team Member"
            ) or "Team Member"
        ).strip()
        role = str(
            account.get(
                "role",
                "Event Staff"
            ) or "Event Staff"
        ).strip()
        status = str(
            account.get(
                "status",
                "Active"
            ) or "Active"
        ).strip()
        # ====================================================
        # FIND CURRENT TEAM MEMBER RECORD
        #
        # The team account and admin team-member record may
        # use different IDs depending on when the account was
        # created.
        #
        # Therefore we support:
        #
        # 1. memberId
        # 2. id
        # 3. email
        # ====================================================
        current_member = None
        try:
            team_members = (
                load_admin_team_members()
            )
        except Exception as member_error:
            print(
                "TEAM DASHBOARD MEMBER LOAD ERROR:",
                str(member_error)
            )
            team_members = []
        if not isinstance(
            team_members,
            list
        ):
            team_members = []
        # ====================================================
        # FIND MEMBER
        # ====================================================
        for member in team_members:
            if not isinstance(
                member,
                dict
            ):
                continue
            stored_member_id = str(
                member.get(
                    "memberId",
                    member.get(
                        "memberid",
                        ""
                    )
                ) or ""
            ).strip()
            stored_id = str(
                member.get(
                    "id",
                    ""
                ) or ""
            ).strip()
            stored_email = str(
                member.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()
            # -----------------------------------------------
            # MEMBER ID
            # -----------------------------------------------
            if (
                member_id
                and
                stored_member_id
                and
                member_id
                ==
                stored_member_id
            ):
                current_member = member
                break
            # -----------------------------------------------
            # ACCOUNT ID
            # -----------------------------------------------
            if (
                account_id
                and
                stored_id
                and
                account_id
                ==
                stored_id
            ):
                current_member = member
                break
            # -----------------------------------------------
            # EMAIL
            # -----------------------------------------------
            if (
                email
                and
                stored_email
                and
                email
                ==
                stored_email
            ):
                current_member = member
                break
        # ====================================================
        # HELPER
        # ====================================================
        def clean_string(
            value
        ):
            return str(
                value or ""
            ).strip()
        # ====================================================
        # GET ASSIGNMENTS
        # ====================================================
        assignments = []
        assignment_history = []
        if isinstance(
            current_member,
            dict
        ):
            raw_assignments = (
                current_member.get(
                    "assignments",
                    []
                )
            )
            if isinstance(
                raw_assignments,
                list
            ):
                assignments = [
                    item
                    for item in raw_assignments
                    if isinstance(
                        item,
                        dict
                    )
                ]
            raw_history = (
                current_member.get(
                    "assignmentHistory",
                    current_member.get(
                        "previousAssignments",
                        []
                    )
                )
            )
            if isinstance(
                raw_history,
                list
            ):
                assignment_history = [
                    item
                    for item in raw_history
                    if isinstance(
                        item,
                        dict
                    )
                ]
        # ====================================================
        # FIND ACTIVE ASSIGNMENT
        # ====================================================
        current_assignment = None
        for assignment in assignments:
            assignment_status = clean_string(
                assignment.get(
                    "status",
                    ""
                )
            ).lower()
            if (
                assignment_status
                ==
                "active"
            ):
                current_assignment = assignment
                break
        # ====================================================
        # CURRENT EVENT VALUES
        # ====================================================
        current_event_id = ""
        current_event_name = ""
        current_host_id = ""
        current_host_name = ""
        # ====================================================
        # PRIMARY SOURCE:
        #
        # CURRENT ACTIVE ASSIGNMENT
        # ====================================================
        if current_assignment:
            current_event_id = clean_string(
                current_assignment.get(
                    "eventId",
                    ""
                )
            )
            current_event_name = clean_string(
                current_assignment.get(
                    "eventName",
                    current_assignment.get(
                        "event",
                        ""
                    )
                )
            )
            current_host_id = clean_string(
                current_assignment.get(
                    "hostId",
                    ""
                )
            )
            current_host_name = clean_string(
                current_assignment.get(
                    "hostName",
                    current_assignment.get(
                        "host",
                        ""
                    )
                )
            )
            role = clean_string(
                current_assignment.get(
                    "role",
                    role
                )
            ) or role
        # ====================================================
        # FALLBACK:
        #
        # LEGACY TEAM MEMBER ASSIGNMENT
        # ====================================================
        if isinstance(
            current_member,
            dict
        ):
            if not current_event_id:
                current_event_id = clean_string(
                    current_member.get(
                        "eventId",
                        ""
                    )
                )
            if not current_event_name:
                current_event_name = clean_string(
                    current_member.get(
                        "event",
                        ""
                    )
                )
            if not current_host_id:
                current_host_id = clean_string(
                    current_member.get(
                        "hostId",
                        ""
                    )
                )
            if not current_host_name:
                current_host_name = clean_string(
                    current_member.get(
                        "host",
                        ""
                    )
                )
        # ====================================================
        # FALLBACK:
        #
        # TEAM ACCOUNT ASSIGNMENT
        # ====================================================
        if not current_event_id:
            current_event_id = clean_string(
                account.get(
                    "eventId",
                    ""
                )
            )
        if not current_event_name:
            current_event_name = clean_string(
                account.get(
                    "event",
                    ""
                )
            )
        if not current_host_id:
            current_host_id = clean_string(
                account.get(
                    "hostId",
                    ""
                )
            )
        if not current_host_name:
            current_host_name = clean_string(
                account.get(
                    "host",
                    ""
                )
            )
        # ====================================================
        # RESOLVE CURRENT EVENT
        #
        # IMPORTANT:
        #
        # We resolve the actual event from events.json so the
        # frontend gets the real poster and event information.
        # ====================================================
        assigned_event = None
        for event in events:
            if not isinstance(
                event,
                dict
            ):
                continue
            event_id = clean_string(
                event.get(
                    "id",
                    ""
                )
            )
            event_name = clean_string(
                event.get(
                    "title",
                    event.get(
                        "name",
                        ""
                    )
                )
            )
            # -----------------------------------------------
            # EVENT ID MATCH
            # -----------------------------------------------
            if (
                current_event_id
                and
                event_id
                and
                current_event_id
                ==
                event_id
            ):
                assigned_event = event
                break
            # -----------------------------------------------
            # EVENT NAME MATCH
            # -----------------------------------------------
            if (
                not assigned_event
                and
                current_event_name
                and
                event_name
                and
                current_event_name.lower()
                ==
                event_name.lower()
            ):
                assigned_event = event
                break
        # ====================================================
        # BUILD EVENT OBJECT
        # ====================================================
        assigned_event_data = None
        if isinstance(
            assigned_event,
            dict
        ):
            assigned_event_data = {
                "id":
                    assigned_event.get(
                        "id",
                        ""
                    ),
                "title":
                    assigned_event.get(
                        "title",
                        assigned_event.get(
                            "name",
                            current_event_name
                        )
                    ),
                "name":
                    assigned_event.get(
                        "name",
                        assigned_event.get(
                            "title",
                            current_event_name
                        )
                    ),
                "description":
                    assigned_event.get(
                        "description",
                        ""
                    ),
                "date":
                    assigned_event.get(
                        "date",
                        ""
                    ),
                "time":
                    assigned_event.get(
                        "time",
                        ""
                    ),
                "venue":
                    assigned_event.get(
                        "venue",
                        assigned_event.get(
                            "location",
                            ""
                        )
                    ),
                "location":
                    assigned_event.get(
                        "location",
                        assigned_event.get(
                            "venue",
                            ""
                        )
                    ),
                "eventPoster":
                    assigned_event.get(
                        "eventPoster",
                        assigned_event.get(
                            "poster",
                            assigned_event.get(
                                "image",
                                assigned_event.get(
                                    "imageUrl",
                                    ""
                                )
                            )
                        )
                    ),
                "host":
                    assigned_event.get(
                        "hostName",
                        assigned_event.get(
                            "host",
                            current_host_name
                        )
                    ),
                "hostId":
                    assigned_event.get(
                        "hostId",
                        current_host_id
                    ),
                "status":
                    assigned_event.get(
                        "status",
                        ""
                    ),
                "capacity":
                    assigned_event.get(
                        "capacity",
                        0
                    ),
                "ticketsSold":
                    assigned_event.get(
                        "ticketsSold",
                        0
                    )
            }
        elif (
            current_event_name
            or
            current_event_id
        ):
            # ------------------------------------------------
            # EVENT MAY HAVE BEEN REMOVED / FINISHED
            #
            # Keep the assignment visible rather than
            # pretending there is no assignment.
            # ------------------------------------------------
            assigned_event_data = {
                "id":
                    current_event_id,
                "title":
                    current_event_name
                    or
                    "Assigned Event",
                "name":
                    current_event_name
                    or
                    "Assigned Event",
                "description":
                    "",
                "date":
                    "",
                "time":
                    "",
                "venue":
                    "",
                "location":
                    "",
                "eventPoster":
                    "",
                "host":
                    current_host_name,
                "hostId":
                    current_host_id,
                "status":
                    "Assigned",
                "capacity":
                    0,
                "ticketsSold":
                    0
            }
        # ====================================================
        # ALL EVENTS
        #
        # Team members can VIEW events.
        #
        # They cannot create, edit, approve, delete or assign.
        # ====================================================
        visible_events = []
        for event in events:
            if not isinstance(
                event,
                dict
            ):
                continue
            visible_events.append({
                "id":
                    event.get(
                        "id",
                        ""
                    ),
                "title":
                    event.get(
                        "title",
                        event.get(
                            "name",
                            "Untitled Event"
                        )
                    ),
                "name":
                    event.get(
                        "name",
                        event.get(
                            "title",
                            "Untitled Event"
                        )
                    ),
                "description":
                    event.get(
                        "description",
                        ""
                    ),
                "date":
                    event.get(
                        "date",
                        ""
                    ),
                "time":
                    event.get(
                        "time",
                        ""
                    ),
                "venue":
                    event.get(
                        "venue",
                        event.get(
                            "location",
                            ""
                        )
                    ),
                "location":
                    event.get(
                        "location",
                        event.get(
                            "venue",
                            ""
                        )
                    ),
                "eventPoster":
                    event.get(
                        "eventPoster",
                        event.get(
                            "poster",
                            event.get(
                                "image",
                                event.get(
                                    "imageUrl",
                                    ""
                                )
                            )
                        )
                    ),
                "host":
                    event.get(
                        "hostName",
                        event.get(
                            "host",
                            ""
                        )
                    ),
                "hostId":
                    event.get(
                        "hostId",
                        ""
                    ),
                "status":
                    event.get(
                        "status",
                        ""
                    ),
                "capacity":
                    event.get(
                        "capacity",
                        0
                    ),
                "ticketsSold":
                    event.get(
                        "ticketsSold",
                        0
                    ),
                "featured":
                    event.get(
                        "featured",
                        False
                    )
            })
        # ====================================================
        # CURRENT EVENT FIRST
        # ====================================================
        if assigned_event_data:
            assigned_id = clean_string(
                assigned_event_data.get(
                    "id",
                    ""
                )
            )
            assigned_name = clean_string(
                assigned_event_data.get(
                    "title",
                    ""
                )
            )
            def is_assigned_event(
                event
            ):
                event_id = clean_string(
                    event.get(
                        "id",
                        ""
                    )
                )
                event_name = clean_string(
                    event.get(
                        "title",
                        ""
                    )
                )
                return (
                    (
                        assigned_id
                        and
                        event_id
                        ==
                        assigned_id
                    )
                    or
                    (
                        assigned_name
                        and
                        event_name.lower()
                        ==
                        assigned_name.lower()
                    )
                )
            visible_events.sort(
                key=lambda event:
                    0
                    if is_assigned_event(
                        event
                    )
                    else 1
            )
        # ====================================================
        # TEAM ACCOUNT RESPONSE
        # ====================================================
        safe_account = {
            "id":
                account.get(
                    "id",
                    ""
                ),
            "memberId":
                account.get(
                    "memberId",
                    account.get(
                        "memberid",
                        member_id
                    )
                ),
            "name":
                name,
            "email":
                email,
            "role":
                role,
            "status":
                status,
            "host":
                current_host_name,
            "hostId":
                current_host_id,
            "event":
                current_event_name,
            "eventId":
                current_event_id
        }
        # ====================================================
        # RESPONSE
        # ====================================================
        return jsonify({
            "success":
                True,
            "account":
                safe_account,
            "assignedEvent":
                assigned_event_data,
            "events":
                visible_events,
            "assignment":
                current_assignment,
            "assignments":
                assignments,
            "assignmentHistory":
                assignment_history,
            "message":
                "Team dashboard loaded successfully."
        }), 200
    except Exception as e:
        print(
            "TEAM DASHBOARD ERROR:",
            str(e)
        )
        return jsonify({
            "success":
                False,
            "message":
                "Unable to load the team dashboard."
        }), 500



# ============================================================
# CREATE ADMIN TOKEN
# ============================================================

def create_admin_token():

    serializer = get_admin_token_serializer()

    return serializer.dumps({
        "role": "admin",
        "email": ADMIN_EMAIL
    })


# ============================================================
# ADMIN REQUIRED
# ============================================================

def admin_required(function):

    @wraps(function)
    def decorated(*args, **kwargs):

        # ----------------------------------------------------
        # READ AUTHORIZATION HEADER
        # ----------------------------------------------------

        authorization = request.headers.get(
            "Authorization",
            ""
        ).strip()


        # ----------------------------------------------------
        # CHECK HEADER
        # ----------------------------------------------------

        if not authorization:

            return jsonify({

                "success": False,

                "message":
                    "Admin authentication required."

            }), 401


        # ----------------------------------------------------
        # EXPECT:
        #
        # Authorization: Bearer <token>
        # ----------------------------------------------------

        if not authorization.startswith(
            "Bearer "
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid admin authorization."

            }), 401


        token = authorization[
            len("Bearer "):
        ].strip()


        # ----------------------------------------------------
        # VERIFY TOKEN
        # ----------------------------------------------------

        if not verify_admin_token(token):

            return jsonify({

                "success": False,

                "message":
                    "Admin session is invalid or expired."

            }), 401


        # ----------------------------------------------------
        # AUTHENTICATED ADMIN
        # ----------------------------------------------------

        return function(
            *args,
            **kwargs
        )


    return decorated

# ============================================================
# EVENTWAA TICKET ACTOR IDENTIFICATION
#
# Identifies the authenticated account as one of:
#
# - host
# - host_team
# - admin
# - admin_team
#
# IMPORTANT:
#
# This function does NOT trust actorType sent by the frontend.
# The backend determines the actor from the authenticated
# account and the actual stored records.
# ============================================================


def get_ticket_actor(
    authenticated_user
):
    """
    Determine which EventWaa account type is making
    the ticket-management request.

    Returns:

    {
        "actorType": "host",
        "account": {...}
    }

    OR:

    {
        "actorType": "host_team",
        "account": {...}
    }

    OR:

    {
        "actorType": "admin",
        "account": {...}
    }

    OR:

    {
        "actorType": "admin_team",
        "account": {...}
    }

    OR None
    """

    # ========================================================
    # VALIDATION
    # ========================================================

    if not isinstance(
        authenticated_user,
        dict
    ):

        return None


    # ========================================================
    # EXPLICIT ACTOR TYPE
    #
    # If our authentication layer already knows the actor
    # type, use it.
    # ========================================================

    actor_type = str(
        authenticated_user.get(
            "_actorType",
            authenticated_user.get(
                "actorType",
                ""
            )
        )
        or
        ""
    ).strip().lower()


    # ========================================================
    # ADMIN
    # ========================================================

    if actor_type == "admin":

        return {

            "actorType":
                "admin",

            "account":
                authenticated_user

        }


    # ========================================================
    # HOST
    # ========================================================

    if actor_type == "host":

        return {

            "actorType":
                "host",

            "account":
                authenticated_user

        }


    # ========================================================
    # ADMIN TEAM
    #
    # Search the REAL admin team records.
    # ========================================================

    admin_team_member = (
        find_admin_team_member_by_identity(
            authenticated_user
        )
    )


    if admin_team_member:

        status = str(
            admin_team_member.get(
                "status",
                ""
            )
            or
            ""
        ).strip().lower()


        if status == "active":

            return {

                "actorType":
                    "admin_team",

                "account":
                    admin_team_member

            }


    # ========================================================
    # HOST TEAM
    #
    # Search the REAL host team records.
    # ========================================================

    host_team_member = (
        find_host_team_member_by_identity(
            authenticated_user
        )
    )


    if host_team_member:

        status = str(
            host_team_member.get(
                "status",
                ""
            )
            or
            ""
        ).strip().lower()


        if status == "active":

            return {

                "actorType":
                    "host_team",

                "account":
                    host_team_member

            }


    # ========================================================
    # NO VALID ACTOR
    # ========================================================

    return None

# ============================================================
# REQUIRE TICKET EVENT ACCESS
#
# Used by ticket-management endpoints.
#
# This performs:
#
# 1. Authentication
# 2. Actor identification
# 3. Event lookup
# 4. Permission verification
#
# Returns:
#
# {
#     "allowed": True,
#     "actor": {...},
#     "event": {...}
# }
#
# OR:
#
# {
#     "allowed": False,
#     "response": (... Flask response ...)
# }
# ============================================================


def require_ticket_event_access(
    event_id,
    authenticated_user
):

    # ========================================================
    # IDENTIFY ACTOR
    # ========================================================

    actor = get_ticket_actor(
        authenticated_user
    )


    if actor is None:

        return {

            "allowed":
                False,

            "response":
                (
                    jsonify({

                        "success":
                            False,

                        "message":
                            "Ticket authentication is required."

                    }),
                    401
                )

        }


    # ========================================================
    # FIND EVENT
    # ========================================================

    event = find_event_by_id(
        event_id
    )


    if event is None:

        return {

            "allowed":
                False,

            "response":
                (
                    jsonify({

                        "success":
                            False,

                        "message":
                            "Event not found."

                    }),
                    404
                )

        }


    # ========================================================
    # ACTOR
    # ========================================================

    actor_type = actor.get(
        "actorType"
    )

    account = actor.get(
        "account"
    )


    # ========================================================
    # ADMIN
    #
    # Admin can manage tickets for every event.
    # ========================================================

    if actor_type == "admin":

        return {

            "allowed":
                True,

            "actor":
                actor,

            "event":
                event

        }


    # ========================================================
    # HOST
    #
    # Host can only manage tickets belonging to their
    # own events.
    # ========================================================

    if actor_type == "host":

        if not host_owns_event(
            account,
            event
        ):

            return {

                "allowed":
                    False,

                "response":
                    (
                        jsonify({

                            "success":
                                False,

                            "message":
                                (
                                    "You can only manage "
                                    "tickets for your own events."
                                )

                        }),
                        403
                    )

            }


        return {

            "allowed":
                True,

            "actor":
                actor,

            "event":
                event

        }


    # ========================================================
    # HOST TEAM
    #
    # Host Team can only access events assigned to them.
    # ========================================================

    if actor_type == "host_team":

        if not host_team_can_access_event(
            account,
            event_id
        ):

            return {

                "allowed":
                    False,

                "response":
                    (
                        jsonify({

                            "success":
                                False,

                            "message":
                                (
                                    "You are not assigned "
                                    "to this event."
                                )

                        }),
                        403
                    )

            }


        return {

            "allowed":
                True,

            "actor":
                actor,

            "event":
                event

        }


    # ========================================================
    # ADMIN TEAM
    #
    # Admin Team can only access the event currently assigned
    # to them.
    # ========================================================

    if actor_type == "admin_team":

        if not admin_team_can_access_event(
            account,
            event_id
        ):

            return {

                "allowed":
                    False,

                "response":
                    (
                        jsonify({

                            "success":
                                False,

                            "message":
                                (
                                    "You are not currently "
                                    "assigned to this event."
                                )

                        }),
                        403
                    )

            }


        return {

            "allowed":
                True,

            "actor":
                actor,

            "event":
                event

        }


    # ========================================================
    # UNKNOWN ACTOR
    # ========================================================

    return {

        "allowed":
            False,

        "response":
            (
                jsonify({

                    "success":
                        False,

                    "message":
                        "This account cannot manage tickets."

                }),
                403
            )

    }

# ============================================================
# GET EVENT TICKETS
#
# GET /tickets/event/<event_id>
#
# CURRENT ACCESS:
#
# - Admin → all events
#
# Team/Host access will be connected through their existing
# authentication systems without creating duplicate helpers.
# ============================================================

@app.route(
    "/tickets/event/<event_id>",
    methods=["GET"]
)
def get_event_tickets(event_id):

    # ========================================================
    # READ AUTHORIZATION
    # ========================================================

    authorization = request.headers.get(
        "Authorization",
        ""
    ).strip()

    if not authorization.startswith(
        "Bearer "
    ):

        return jsonify({
            "success": False,
            "message":
                "Authentication required."
        }), 401

    token = authorization[
        len("Bearer "):
    ].strip()

    if not token:

        return jsonify({
            "success": False,
            "message":
                "Authentication required."
        }), 401

    # ========================================================
    # ADMIN AUTHENTICATION
    # ========================================================

    admin_account = None

    try:

        admin_account = verify_admin_token(
            token
        )

    except Exception as error:

        print(
            "TICKET ADMIN AUTH CHECK:",
            error
        )

    # ========================================================
    # ADMIN ACCESS
    #
    # Admin can view tickets for ANY event.
    # ========================================================

    if admin_account:

        actor_type = "admin"

    else:

        # ====================================================
        # TEAM AUTHENTICATION
        #
        # This uses the EXISTING team authentication system.
        # ====================================================

        team_account = None

        try:

            team_account = verify_team_token(
                token
            )

        except Exception as error:

            print(
                "TICKET TEAM AUTH CHECK:",
                error
            )

        if team_account:

            return jsonify({
                "success": False,
                "message":
                    (
                        "Team ticket access is not connected "
                        "to this endpoint yet."
                    )
            }), 403

        # ====================================================
        # AUTHENTICATION FAILED
        # ====================================================

        return jsonify({
            "success": False,
            "message":
                "Your session is invalid or expired."
        }), 401

    # ========================================================
    # FIND EVENT
    # ========================================================

    event = find_event_by_id(
        event_id
    )

    if event is None:

        return jsonify({
            "success": False,
            "message":
                "Event not found."
        }), 404

    # ========================================================
    # LOAD BOOKINGS
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    if not isinstance(
        bookings,
        list
    ):

        bookings = []

    # ========================================================
    # FILTER EVENT TICKETS
    # ========================================================

    event_tickets = []

    target_event_id = str(
        event_id
    ).strip()

    for booking in bookings:

        if not isinstance(
            booking,
            dict
        ):
            continue

        booking_event_id = str(
            booking.get(
                "eventId",
                ""
            )
        ).strip()

        if (
            booking_event_id
            !=
            target_event_id
        ):
            continue

        # ====================================================
        # SAFE TICKET
        #
        # Never expose sensitive payment information.
        # ====================================================

        event_tickets.append({

            "ticketId":
                booking.get(
                    "ticketId"
                ),

            "eventId":
                booking.get(
                    "eventId"
                ),

            "eventTitle":
                booking.get(
                    "eventTitle",
                    event.get(
                        "title",
                        event.get(
                            "eventTitle",
                            ""
                        )
                    )
                ),

            "buyer":
                booking.get(
                    "buyer",
                    {}
                ),

            "ticketType":
                booking.get(
                    "ticketType",
                    "Regular"
                ),

            "quantity":
                booking.get(
                    "quantity",
                    1
                ),

            "totalPrice":
                booking.get(
                    "totalPrice",
                    0
                ),

            "status":
                booking.get(
                    "status",
                    "valid"
                ),

            "checkedIn":
                booking.get(
                    "checkedIn",
                    False
                ),

            "checkedInAt":
                booking.get(
                    "checkedInAt"
                ),

            "createdAt":
                booking.get(
                    "createdAt"
                )

        })

    # ========================================================
    # RESPONSE
    # ========================================================

    return jsonify({

        "success":
            True,

        "event": {

            "id":
                event.get(
                    "id"
                ),

            "title":
                event.get(
                    "title",
                    event.get(
                        "eventTitle",
                        "Untitled Event"
                    )
                ),

            "date":
                event.get(
                    "date",
                    ""
                ),

            "location":
                event.get(
                    "location",
                    ""
                )

        },

        "tickets":
            event_tickets,

        "total":
            len(
                event_tickets
            )

    }), 200

# ============================================================
# EVENTWAA TICKET ACCESS CONTROL
#
# FOUR ACTOR TYPES:
#
# 1. HOST
# 2. HOST TEAM
# 3. ADMIN
# 4. ADMIN TEAM
#
# IMPORTANT:
#
# The backend is the source of truth.
#
# The frontend must NEVER be trusted to decide whether a user
# can access or manage a ticket.
# ============================================================


# ============================================================
# FIND EVENT
# ============================================================

def find_event_by_id(event_id):

    if event_id is None:
        return None

    events = load_json_file(
        "events.json",
        []
    )

    target_id = str(
        event_id
    ).strip()

    for event in events:

        if not isinstance(
            event,
            dict
        ):
            continue

        current_id = str(
            event.get(
                "id",
                ""
            )
        ).strip()

        if current_id == target_id:

            return event

    return None


# ============================================================
# FIND HOST TEAM MEMBER
# ============================================================

def find_host_team_member_by_identity(
    user
):

    if not isinstance(
        user,
        dict
    ):

        return None

    team_members = (
        load_team_members()
    )

    if not isinstance(
        team_members,
        list
    ):

        return None

    user_id = str(
        user.get(
            "id",
            ""
        )
        or
        ""
    ).strip()

    member_id = str(
        user.get(
            "memberId",
            ""
        )
        or
        ""
    ).strip()

    email = str(
        user.get(
            "email",
            ""
        )
        or
        ""
    ).strip().lower()

    for member in team_members:

        if not isinstance(
            member,
            dict
        ):

            continue

        current_member_id = str(
            member.get(
                "id",
                ""
            )
            or
            ""
        ).strip()

        current_user_id = str(
            member.get(
                "userId",
                ""
            )
            or
            ""
        ).strip()

        current_email = str(
            member.get(
                "email",
                ""
            )
            or
            ""
        ).strip().lower()

        # ----------------------------------------------------
        # MEMBER ID
        # ----------------------------------------------------

        if (
            member_id
            and
            current_member_id
            ==
            member_id
        ):

            return member

        # ----------------------------------------------------
        # USER ID
        # ----------------------------------------------------

        if (
            user_id
            and
            current_user_id
            ==
            user_id
        ):

            return member

        # ----------------------------------------------------
        # EMAIL
        # ----------------------------------------------------

        if (
            email
            and
            current_email
            ==
            email
        ):

            return member

    return None


# ============================================================
# HOST TEAM EVENT ACCESS
#
# Host Team uses:
#
# eventIds
#
# Example:
#
# "eventIds": ["3"]
# ============================================================

def host_team_can_access_event(
    member,
    event_id
):

    if not isinstance(
        member,
        dict
    ):

        return False

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    status = str(
        member.get(
            "status",
            ""
        )
        or
        ""
    ).strip().lower()

    if status != "active":

        return False

    # --------------------------------------------------------
    # EVENT ID
    # --------------------------------------------------------

    target_event_id = str(
        event_id
    ).strip()

    if not target_event_id:

        return False

    # --------------------------------------------------------
    # PRIMARY EVENT ASSIGNMENTS
    # --------------------------------------------------------

    event_ids = member.get(
        "eventIds",
        []
    )

    if isinstance(
        event_ids,
        list
    ):

        for assigned_event_id in event_ids:

            if (
                str(
                    assigned_event_id
                ).strip()
                ==
                target_event_id
            ):

                return True

    # --------------------------------------------------------
    # LEGACY EVENT ID
    # --------------------------------------------------------

    legacy_event_id = str(
        member.get(
            "eventId",
            ""
        )
        or
        ""
    ).strip()

    if (
        legacy_event_id
        and
        legacy_event_id
        ==
        target_event_id
    ):

        return True

    return False


# ============================================================
# ADMIN TEAM MEMBER LOOKUP
# ============================================================

def find_admin_team_member_by_identity(
    user
):

    if not isinstance(
        user,
        dict
    ):

        return None

    members = (
        load_admin_team_members()
    )

    if not isinstance(
        members,
        list
    ):

        return None

    user_id = str(
        user.get(
            "id",
            ""
        )
        or
        ""
    ).strip()

    member_id = str(
        user.get(
            "memberId",
            ""
        )
        or
        ""
    ).strip()

    email = str(
        user.get(
            "email",
            ""
        )
        or
        ""
    ).strip().lower()

    for member in members:

        if not isinstance(
            member,
            dict
        ):

            continue

        current_id = str(
            member.get(
                "id",
                ""
            )
            or
            ""
        ).strip()

        current_email = str(
            member.get(
                "email",
                ""
            )
            or
            ""
        ).strip().lower()

        if (
            member_id
            and
            current_id
            ==
            member_id
        ):

            return member

        if (
            user_id
            and
            current_id
            ==
            user_id
        ):

            return member

        if (
            email
            and
            current_email
            ==
            email
        ):

            return member

    return None


# ============================================================
# ADMIN TEAM EVENT ACCESS
#
# Admin Team does NOT use eventIds.
#
# It uses:
#
# currentAssignment.eventId
# ============================================================

def admin_team_can_access_event(
    member,
    event_id
):

    if not isinstance(
        member,
        dict
    ):

        return False

    # --------------------------------------------------------
    # MEMBER STATUS
    # --------------------------------------------------------

    member_status = str(
        member.get(
            "status",
            ""
        )
        or
        ""
    ).strip().lower()

    if member_status != "active":

        return False

    # --------------------------------------------------------
    # CURRENT ASSIGNMENT
    # --------------------------------------------------------

    assignment = member.get(
        "currentAssignment"
    )

    if not isinstance(
        assignment,
        dict
    ):

        return False

    # --------------------------------------------------------
    # ASSIGNMENT STATUS
    # --------------------------------------------------------

    assignment_status = str(
        assignment.get(
            "status",
            ""
        )
        or
        ""
    ).strip().lower()

    if assignment_status != "active":

        return False

    # --------------------------------------------------------
    # ASSIGNED EVENT
    # --------------------------------------------------------

    assigned_event_id = str(
        assignment.get(
            "eventId",
            ""
        )
        or
        ""
    ).strip()

    requested_event_id = str(
        event_id
    ).strip()

    return (
        assigned_event_id
        ==
        requested_event_id
    )


# ============================================================
# ADMIN TEAM ROLE
# ============================================================

def get_admin_team_role(
    member
):

    if not isinstance(
        member,
        dict
    ):

        return ""

    return str(
        member.get(
            "role",
            ""
        )
        or
        ""
    ).strip().lower()


# ============================================================
# CAN ADMIN TEAM SCAN?
#
# Scanner
# Event Staff
# Manager
# ============================================================

def admin_team_can_scan(
    member
):

    if not isinstance(
        member,
        dict
    ):

        return False

    role = get_admin_team_role(
        member
    )

    return role in {
        "scanner",
        "event staff",
        "manager"
    }


# ============================================================
# CAN HOST TEAM SCAN?
# ============================================================

def host_team_can_scan(
    member
):

    if not isinstance(
        member,
        dict
    ):

        return False

    status = str(
        member.get(
            "status",
            ""
        )
        or
        ""
    ).strip().lower()

    if status != "active":

        return False

    role = str(
        member.get(
            "role",
            ""
        )
        or
        ""
    ).strip().lower()

    return role in {
        "scanner",
        "event staff",
        "manager"
    }


# ============================================================
# CHECK TICKET EVENT ACCESS
#
# This is the MAIN permission function.
#
# Returns:
#
# {
#     "allowed": True / False,
#     "actorType": "...",
#     "account": {...},
#     "event": {...},
#     "message": "..."
# }
# ============================================================

def check_ticket_event_access(
    event_id,
    actor
):

    result = {

        "allowed":
            False,

        "actorType":
            None,

        "account":
            None,

        "event":
            None,

        "message":
            "You do not have permission to access this event."
    }

    # ========================================================
    # FIND EVENT
    # ========================================================

    event = find_event_by_id(
        event_id
    )

    if event is None:

        result["message"] = (
            "Event not found."
        )

        return result

    result["event"] = event

    # ========================================================
    # VALIDATE ACTOR
    # ========================================================

    if not isinstance(
        actor,
        dict
    ):

        result["message"] = (
            "Authentication is required."
        )

        return result

    actor_type = str(
        actor.get(
            "_actorType",
            actor.get(
                "actorType",
                ""
            )
        )
        or
        ""
    ).strip().lower()

    # ========================================================
    # HOST
    # ========================================================

    if actor_type == "host":

        if host_owns_event(
            actor,
            event
        ):

            result["allowed"] = True

            result["actorType"] = (
                "host"
            )

            result["account"] = (
                actor
            )

            result["message"] = (
                "Access granted."
            )

        else:

            result["message"] = (
                "You can only manage "
                "tickets for your own events."
            )

        return result

    # ========================================================
    # HOST TEAM
    # ========================================================

    if actor_type == "host_team":

        member = (
            find_host_team_member_by_identity(
                actor
            )
        )

        if member is None:

            result["message"] = (
                "Host team member account not found."
            )

            return result

        if not host_team_can_access_event(
            member,
            event_id
        ):

            result["message"] = (
                "You are not assigned "
                "to this event."
            )

            return result

        result["allowed"] = True

        result["actorType"] = (
            "host_team"
        )

        result["account"] = (
            member
        )

        result["message"] = (
            "Access granted."
        )

        return result

    # ========================================================
    # ADMIN
    # ========================================================

    if actor_type == "admin":

        result["allowed"] = True

        result["actorType"] = (
            "admin"
        )

        result["account"] = (
            actor
        )

        result["message"] = (
            "Access granted."
        )

        return result

    # ========================================================
    # ADMIN TEAM
    # ========================================================

    if actor_type == "admin_team":

        member = (
            find_admin_team_member_by_identity(
                actor
            )
        )

        if member is None:

            result["message"] = (
                "Admin team member account not found."
            )

            return result

        if not admin_team_can_access_event(
            member,
            event_id
        ):

            result["message"] = (
                "You are not currently assigned "
                "to this event."
            )

            return result

        result["allowed"] = True

        result["actorType"] = (
            "admin_team"
        )

        result["account"] = (
            member
        )

        result["message"] = (
            "Access granted."
        )

        return result

    # ========================================================
    # UNKNOWN ACTOR
    # ========================================================

    result["message"] = (
        "This account type cannot manage tickets."
    )

    return result

# ============================================================
# ADMIN TEAM MEMBERS + INVITATIONS
# ============================================================

# IMPORTANT:
# This section contains the SINGLE source of truth for:
#
# - Admin team members
# - Team member creation
# - Team member status
# - Team member removal
# - Team member invitations
# - Invitation validation
# - Invitation acceptance
# - Team account creation
#
# DO NOT add another copy of these routes/functions elsewhere.
# ============================================================


# ============================================================
# ADMIN TEAM MEMBERS STORAGE
# ============================================================

ADMIN_TEAM_MEMBERS_FILE = "admin_team_members.json"

TEAM_ACCOUNTS_FILE = "admin_team_accounts.json"


# ============================================================
# FRONTEND URL
# ============================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
).rstrip("/")


# ============================================================
# ENSURE ADMIN TEAM MEMBERS FILE EXISTS
# ============================================================

def ensure_admin_team_members_file():

    if not os.path.exists(
        ADMIN_TEAM_MEMBERS_FILE
    ):

        with open(
            ADMIN_TEAM_MEMBERS_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                [],
                file,
                indent=4,
                ensure_ascii=False
            )




# ============================================================
# LOAD ADMIN TEAM MEMBERS
# ============================================================

def load_admin_team_members():

    ensure_admin_team_members_file()

    try:

        with open(
            ADMIN_TEAM_MEMBERS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)


        if not isinstance(
            data,
            list
        ):

            return []


        return data


    except Exception as e:

        print(
            "ADMIN TEAM MEMBERS LOAD ERROR:",
            str(e)
        )

        return []


# ============================================================
# LOAD EVENTS
# ============================================================

def load_events():

    try:

        if not os.path.exists(
            "events.json"
        ):
            return []

        with open(
            "events.json",
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

            if isinstance(data, list):
                return data

            return []

    except (
        FileNotFoundError,
        json.JSONDecodeError,
        OSError
    ) as e:

        print(
            "LOAD EVENTS ERROR:",
            str(e)
        )

        return []

# ============================================================
# AUTO-COMPLETE FINISHED TEAM MEMBER ASSIGNMENTS
#
# PURPOSE:
#
# Keeps the canonical assignment system consistent.
#
# CANONICAL CURRENT ASSIGNMENT:
#   member["currentAssignment"]
#
# ASSIGNMENT RECORDS:
#   member["assignments"]
#
# HISTORY:
#   member["assignmentHistory"]
#
# LEGACY COMPATIBILITY:
#   member["event"]
#   member["host"]
#   member["eventId"]
#   member["hostId"]
#
# IMPORTANT:
# The canonical assignment is used first.
# Older members without currentAssignment are supported
# through assignments[] and legacy event/eventId fields.
# ============================================================

def auto_complete_finished_team_assignments():

    try:

        members = load_admin_team_members()
        events = load_events()

        now = datetime.now()

        changed = False

        # ====================================================
        # BUILD EVENT LOOKUP
        # ====================================================

        event_lookup = {}

        if isinstance(events, list):

            for event in events:

                if not isinstance(event, dict):
                    continue

                event_id = str(
                    event.get("id", "")
                    or event.get("_id", "")
                    or event.get("eventId", "")
                    or ""
                ).strip()

                event_title = str(
                    event.get("title", "")
                    or event.get("eventTitle", "")
                    or event.get("name", "")
                    or ""
                ).strip()

                if event_id:
                    event_lookup[event_id] = event

                if event_title:
                    event_lookup[
                        event_title.lower()
                    ] = event

        # ====================================================
        # CHECK TEAM MEMBERS
        # ====================================================

        for member in members:

            if not isinstance(member, dict):
                continue

            # =================================================
            # ENSURE ASSIGNMENTS STRUCTURE
            # =================================================

            assignments = member.get(
                "assignments",
                []
            )

            if not isinstance(
                assignments,
                list
            ):

                assignments = []

                member[
                    "assignments"
                ] = assignments

                changed = True

            # =================================================
            # ENSURE HISTORY STRUCTURE
            # =================================================

            assignment_history = member.get(
                "assignmentHistory",
                []
            )

            if not isinstance(
                assignment_history,
                list
            ):

                assignment_history = []

                member[
                    "assignmentHistory"
                ] = assignment_history

                changed = True

            # =================================================
            # GET CANONICAL CURRENT ASSIGNMENT
            #
            # This checks:
            #
            # 1. currentAssignment
            # 2. active/upcoming assignments[]
            # =================================================

            current_assignment = (
                get_current_team_assignment(
                    member
                )
            )

            # =================================================
            # LEGACY FALLBACK
            #
            # Supports older members that only have:
            #
            # event / host / eventId / hostId
            # =================================================

            if current_assignment is None:

                legacy_event = str(
                    member.get(
                        "event",
                        ""
                    ) or ""
                ).strip()

                legacy_host = str(
                    member.get(
                        "host",
                        ""
                    ) or ""
                ).strip()

                legacy_event_id = str(
                    member.get(
                        "eventId",
                        ""
                    ) or ""
                ).strip()

                legacy_host_id = str(
                    member.get(
                        "hostId",
                        ""
                    ) or ""
                ).strip()

                if (
                    legacy_event
                    or
                    legacy_event_id
                ):

                    current_assignment = {

                        "id":
                            (
                                f"legacy_"
                                f"{member.get('id', 'member')}_"
                                f"{int(datetime.now().timestamp() * 1000)}"
                            ),

                        "eventId":
                            legacy_event_id,

                        "eventName":
                            legacy_event,

                        "event":
                            legacy_event,

                        "hostId":
                            legacy_host_id,

                        "hostName":
                            legacy_host,

                        "host":
                            legacy_host,

                        "role":
                            member.get(
                                "role",
                                ""
                            ),

                        "status":
                            "Active",

                        "assignedAt":
                            member.get(
                                "assignmentStartedAt",
                                member.get(
                                    "updatedAt",
                                    member.get(
                                        "createdAt",
                                        ""
                                    )
                                )
                            )

                    }

            # =================================================
            # NO CURRENT ASSIGNMENT
            # =================================================

            if not isinstance(
                current_assignment,
                dict
            ):

                continue

            # =================================================
            # READ ASSIGNMENT INFORMATION
            # =================================================

            current_event_id = str(
                current_assignment.get(
                    "eventId",
                    ""
                )
                or
                ""
            ).strip()

            current_event_name = str(
                current_assignment.get(
                    "eventName",
                    current_assignment.get(
                        "event",
                        ""
                    )
                )
                or
                ""
            ).strip()

            current_host_id = str(
                current_assignment.get(
                    "hostId",
                    ""
                )
                or
                ""
            ).strip()

            current_host_name = str(
                current_assignment.get(
                    "hostName",
                    current_assignment.get(
                        "host",
                        ""
                    )
                )
                or
                ""
            ).strip()

            # =================================================
            # FIND EVENT
            #
            # Prefer event ID.
            # Fall back to event name.
            # =================================================

            event_data = None

            if current_event_id:

                event_data = event_lookup.get(
                    current_event_id
                )

            if (
                event_data is None
                and
                current_event_name
            ):

                event_data = event_lookup.get(
                    current_event_name
                )

            if (
                event_data is None
                and
                current_event_name
            ):

                event_data = event_lookup.get(
                    current_event_name.lower()
                )

            # =================================================
            # EVENT DOES NOT EXIST
            #
            # Do not erase the assignment.
            # =================================================

            if event_data is None:

                print(
                    "ASSIGNED EVENT NOT FOUND:",
                    member.get(
                        "name",
                        ""
                    ),
                    "->",
                    current_event_name
                )

                continue

            # =================================================
            # READ EVENT DATE / TIME
            # =================================================

            event_date = (
                event_data.get(
                    "date"
                )
                or
                event_data.get(
                    "eventDate"
                )
                or
                event_data.get(
                    "startDate"
                )
                or
                ""
            )

            event_time = (
                event_data.get(
                    "time"
                )
                or
                event_data.get(
                    "eventTime"
                )
                or
                event_data.get(
                    "startTime"
                )
                or
                ""
            )

            event_date = str(
                event_date or ""
            ).strip()

            event_time = str(
                event_time or ""
            ).strip()

            # =================================================
            # BUILD EVENT DATETIME
            # =================================================

            event_datetime = None

            datetime_value = (
                event_data.get(
                    "startDateTime"
                )
                or
                event_data.get(
                    "start_datetime"
                )
                or
                event_data.get(
                    "datetime"
                )
            )

            # -------------------------------------------------
            # COMPLETE DATETIME
            # -------------------------------------------------

            if datetime_value:

                try:

                    event_datetime = (
                        datetime.fromisoformat(
                            str(
                                datetime_value
                            ).replace(
                                "Z",
                                ""
                            )
                        )
                    )

                except (
                    ValueError,
                    TypeError
                ):

                    event_datetime = None

            # -------------------------------------------------
            # DATE + TIME
            # -------------------------------------------------

            if event_datetime is None:

                if event_date:

                    if event_time:

                        date_time_string = (
                            f"{event_date} {event_time}"
                        )

                    else:

                        date_time_string = (
                            event_date
                        )

                    possible_formats = [

                        "%Y-%m-%d %H:%M",

                        "%Y-%m-%d %H:%M:%S",

                        "%Y-%m-%d %I:%M %p",

                        "%Y-%m-%d",

                        "%d/%m/%Y %H:%M",

                        "%d/%m/%Y %H:%M:%S",

                        "%d/%m/%Y %I:%M %p",

                        "%d/%m/%Y",

                        "%d-%m-%Y %H:%M",

                        "%d-%m-%Y %H:%M:%S",

                        "%d-%m-%Y %I:%M %p",

                        "%d-%m-%Y"

                    ]

                    for date_format in possible_formats:

                        try:

                            event_datetime = (
                                datetime.strptime(
                                    date_time_string,
                                    date_format
                                )
                            )

                            break

                        except ValueError:

                            continue

            # =================================================
            # COULD NOT PARSE EVENT DATE
            # =================================================

            if event_datetime is None:

                print(
                    "TEAM ASSIGNMENT DATE COULD NOT BE PARSED:",
                    member.get(
                        "name",
                        ""
                    ),
                    current_event_name,
                    event_date,
                    event_time
                )

                continue

            # =================================================
            # EVENT STILL ACTIVE
            #
            # Synchronize legacy fields with the canonical
            # current assignment.
            # =================================================

            if event_datetime >= now:

                assignment_changed = False

                # ---------------------------------------------
                # Make sure currentAssignment exists
                # ---------------------------------------------

                existing_current = member.get(
                    "currentAssignment"
                )

                if not isinstance(
                    existing_current,
                    dict
                ):

                    member[
                        "currentAssignment"
                    ] = current_assignment

                    changed = True

                # ---------------------------------------------
                # Keep legacy event fields synchronized
                # ---------------------------------------------

                if (
                    member.get(
                        "event",
                        ""
                    )
                    !=
                    current_event_name
                ):

                    member[
                        "event"
                    ] = current_event_name

                    assignment_changed = True

                if (
                    member.get(
                        "host",
                        ""
                    )
                    !=
                    current_host_name
                ):

                    member[
                        "host"
                    ] = current_host_name

                    assignment_changed = True

                if current_event_id:

                    if (
                        member.get(
                            "eventId",
                            ""
                        )
                        !=
                        current_event_id
                    ):

                        member[
                            "eventId"
                        ] = current_event_id

                        assignment_changed = True

                if current_host_id:

                    if (
                        member.get(
                            "hostId",
                            ""
                        )
                        !=
                        current_host_id
                    ):

                        member[
                            "hostId"
                        ] = current_host_id

                        assignment_changed = True

                if assignment_changed:

                    member[
                        "updatedAt"
                    ] = now.isoformat()

                    changed = True

                continue

            # =================================================
            # EVENT HAS FINISHED
            # =================================================

            assignment_id = str(
                current_assignment.get(
                    "id",
                    ""
                )
                or
                ""
            ).strip()

            # =================================================
            # CHECK WHETHER HISTORY ALREADY EXISTS
            #
            # Prevent duplicate completion history.
            # =================================================

            already_completed = False

            for history in assignment_history:

                if not isinstance(
                    history,
                    dict
                ):
                    continue

                history_event_id = str(
                    history.get(
                        "eventId",
                        ""
                    )
                    or
                    ""
                ).strip()

                history_event_name = str(
                    history.get(
                        "eventName",
                        history.get(
                            "event",
                            ""
                        )
                    )
                    or
                    ""
                ).strip()

                history_assignment_id = str(
                    history.get(
                        "assignmentId",
                        history.get(
                            "id",
                            ""
                        )
                    )
                    or
                    ""
                ).strip()

                if (
                    assignment_id
                    and
                    history_assignment_id
                    and
                    assignment_id
                    ==
                    history_assignment_id
                ):

                    already_completed = True
                    break

                if (
                    current_event_id
                    and
                    history_event_id
                    and
                    current_event_id
                    ==
                    history_event_id
                    and
                    str(
                        history.get(
                            "status",
                            ""
                        )
                    ).lower()
                    ==
                    "completed"
                ):

                    already_completed = True
                    break

                if (
                    current_event_name
                    and
                    history_event_name
                    and
                    current_event_name.lower()
                    ==
                    history_event_name.lower()
                    and
                    str(
                        history.get(
                            "status",
                            ""
                        )
                    ).lower()
                    ==
                    "completed"
                ):

                    already_completed = True
                    break

            # =================================================
            # CREATE HISTORY ONLY ONCE
            # =================================================

            if not already_completed:

                previous_assignment = {

                    "id":
                        (
                            assignment_id
                            or
                            (
                                f"{member.get('id', 'member')}-"
                                f"{int(datetime.now().timestamp() * 1000)}"
                            )
                        ),

                    "assignmentId":
                        assignment_id,

                    "eventId":
                        current_event_id,

                    "event":
                        current_event_name,

                    "eventName":
                        current_event_name,

                    "hostId":
                        current_host_id,

                    "host":
                        current_host_name,

                    "hostName":
                        current_host_name,

                    "role":
                        current_assignment.get(
                            "role",
                            member.get(
                                "role",
                                ""
                            )
                        ),

                    "assignedAt":
                        current_assignment.get(
                            "assignedAt",
                            member.get(
                                "assignmentStartedAt",
                                member.get(
                                    "updatedAt",
                                    member.get(
                                        "createdAt",
                                        ""
                                    )
                                )
                            )
                        ),

                    "endedAt":
                        now.isoformat(),

                    "completedAt":
                        now.isoformat(),

                    "reason":
                        "Event completed",

                    "status":
                        "Completed"

                }

                assignment_history.append(
                    previous_assignment
                )

                member[
                    "assignmentHistory"
                ] = assignment_history

                changed = True

            # =================================================
            # CLOSE THE MATCHING ASSIGNMENT RECORD
            # =================================================

            assignment_closed = False

            for assignment in assignments:

                if not isinstance(
                    assignment,
                    dict
                ):
                    continue

                assignment_id_value = str(
                    assignment.get(
                        "id",
                        ""
                    )
                    or
                    ""
                ).strip()

                assignment_event_id = str(
                    assignment.get(
                        "eventId",
                        ""
                    )
                    or
                    ""
                ).strip()

                assignment_event_name = str(
                    assignment.get(
                        "eventName",
                        assignment.get(
                            "event",
                            ""
                        )
                    )
                    or
                    ""
                ).strip()

                status = str(
                    assignment.get(
                        "status",
                        ""
                    )
                    or
                    ""
                ).strip().lower()

                matches = False

                if (
                    assignment_id
                    and
                    assignment_id_value
                    and
                    assignment_id
                    ==
                    assignment_id_value
                ):

                    matches = True

                elif (
                    current_event_id
                    and
                    assignment_event_id
                    and
                    current_event_id
                    ==
                    assignment_event_id
                    and
                    status
                    in {
                        "active",
                        "upcoming"
                    }
                ):

                    matches = True

                elif (
                    current_event_name
                    and
                    assignment_event_name
                    and
                    current_event_name.lower()
                    ==
                    assignment_event_name.lower()
                    and
                    status
                    in {
                        "active",
                        "upcoming"
                    }
                ):

                    matches = True

                if not matches:
                    continue

                assignment[
                    "status"
                ] = "Completed"

                assignment[
                    "completedAt"
                ] = now.isoformat()

                assignment[
                    "unassignedAt"
                ] = now.isoformat()

                assignment_closed = True

                changed = True

            # =================================================
            # CLEAR CANONICAL CURRENT ASSIGNMENT
            # =================================================

            if isinstance(
                member.get(
                    "currentAssignment"
                ),
                dict
            ):

                current_member_assignment = (
                    member.get(
                        "currentAssignment"
                    )
                )

                current_member_assignment[
                    "status"
                ] = "Completed"

                current_member_assignment[
                    "completedAt"
                ] = now.isoformat()

                current_member_assignment[
                    "unassignedAt"
                ] = now.isoformat()

                member[
                    "currentAssignment"
                ] = None

                changed = True

            # =================================================
            # CLEAR LEGACY CURRENT ASSIGNMENT
            # =================================================

            if (
                member.get(
                    "event",
                    ""
                )
                or
                member.get(
                    "host",
                    ""
                )
                or
                member.get(
                    "eventId",
                    ""
                )
                or
                member.get(
                    "hostId",
                    ""
                )
            ):

                member[
                    "event"
                ] = ""

                member[
                    "host"
                ] = ""

                member[
                    "eventId"
                ] = ""

                member[
                    "hostId"
                ] = ""

                member[
                    "assignmentStartedAt"
                ] = ""

                member[
                    "updatedAt"
                ] = now.isoformat()

                changed = True

            print(
                "TEAM MEMBER ASSIGNMENT AUTO-COMPLETED:",
                member.get(
                    "name",
                    ""
                ),
                "->",
                current_event_name
            )

        # ====================================================
        # SAVE ONLY WHEN SOMETHING CHANGED
        # ====================================================

        if changed:

            save_admin_team_members(
                members
            )

        return members

    except Exception as e:

        print(
            "AUTO COMPLETE TEAM ASSIGNMENTS ERROR:",
            str(e)
        )

        # Never break the team dashboard if automatic cleanup
        # encounters an unexpected problem.

        return load_admin_team_members()
    
# ============================================================
# SAVE ADMIN TEAM MEMBERS
# ============================================================

def save_admin_team_members(
    members
):

    ensure_admin_team_members_file()

    with open(
        ADMIN_TEAM_MEMBERS_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            members,
            file,
            indent=4,
            ensure_ascii=False
        )

# ============================================================
# TEAM MEMBER ASSIGNMENT HELPERS
# ============================================================

def ensure_team_member_assignments(member):
    """
    Makes sure every team member has an assignments list.

    This is intentionally backwards-compatible with existing
    team members that were created before assignments existed.
    """

    if not isinstance(member, dict):
        return member

    if not isinstance(member.get("assignments"), list):
        member["assignments"] = []

    return member


def get_team_member_assignment(member, assignment_id):
    """
    Find one assignment belonging to a team member.
    """

    ensure_team_member_assignments(member)

    for assignment in member["assignments"]:

        if str(
            assignment.get("id", "")
        ) == str(assignment_id):

            return assignment

    return None


def get_active_team_member_assignments(member):
    """
    Return assignments that are currently active or upcoming.
    """

    ensure_team_member_assignments(member)

    active_statuses = {
        "Upcoming",
        "Active"
    }

    return [
        assignment
        for assignment in member["assignments"]
        if assignment.get("status") in active_statuses
    ]


def get_completed_team_member_assignments(member):
    """
    Return completed assignments.
    """

    ensure_team_member_assignments(member)

    return [
        assignment
        for assignment in member["assignments"]
        if assignment.get("status") == "Completed"
    ]

# ============================================================
# GENERATE TEAM MEMBER ID
# ============================================================

def generate_team_member_id(
    members
):

    existing_ids = []

    for member in members:

        try:

            existing_ids.append(
                int(
                    member.get(
                        "id",
                        0
                    )
                )
            )

        except (
            ValueError,
            TypeError
        ):

            continue


    if existing_ids:

        return max(
            existing_ids
        ) + 1


    return 1


# ============================================================
# FIND TEAM MEMBER BY ID
# ============================================================

def find_admin_team_member_by_id(
    member_id
):

    members = load_admin_team_members()

    try:

        requested_id = int(
            member_id
        )

    except (
        ValueError,
        TypeError
    ):

        return None


    for member in members:

        try:

            current_id = int(
                member.get(
                    "id",
                    0
                )
            )

        except (
            ValueError,
            TypeError
        ):

            continue


        if current_id == requested_id:

            return member


    return None


# ============================================================
# FIND TEAM MEMBER BY EMAIL
# ============================================================

def find_admin_team_member_by_email(
    email
):

    normalized_email = str(
        email or ""
    ).strip().lower()


    if not normalized_email:

        return None


    members = load_admin_team_members()


    for member in members:

        member_email = str(
            member.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        if (
            member_email ==
            normalized_email
        ):

            return member


    return None


# ============================================================
# UPDATE TEAM MEMBER RECORD
# ============================================================

def update_admin_team_member_record(
    member_id,
    updates
):

    members = load_admin_team_members()


    try:

        requested_id = int(
            member_id
        )

    except (
        ValueError,
        TypeError
    ):

        return None


    for member in members:

        try:

            current_id = int(
                member.get(
                    "id",
                    0
                )
            )

        except (
            ValueError,
            TypeError
        ):

            continue


        if current_id == requested_id:

            member.update(
                updates
            )


            save_admin_team_members(
                members
            )


            return member


    return None


# ============================================================
# ADMIN INVITATION TOKEN SERIALIZER
# ============================================================

from itsdangerous import URLSafeTimedSerializer


def get_admin_invitation_serializer():

    secret_key = app.config.get(
        "SECRET_KEY"
    )


    if not secret_key:

        raise RuntimeError(
            "Flask SECRET_KEY is not configured."
        )


    return URLSafeTimedSerializer(
        secret_key,
        salt="eventwaa-admin-team-invitation"
    )


# ============================================================
# CREATE ADMIN TEAM INVITATION TOKEN
# ============================================================

def create_admin_team_invitation_token(
    member_id,
    email
):

    serializer = (
        get_admin_invitation_serializer()
    )


    return serializer.dumps({

        "member_id":
            int(member_id),

        "email":
            str(email)
            .strip()
            .lower(),

        "purpose":
            "admin_team_invitation"

    })


# ============================================================
# VERIFY ADMIN TEAM INVITATION TOKEN
#
# Invitation lifetime:
# 48 hours
# ============================================================

def verify_admin_team_invitation_token(
    token,
    max_age=172800
):

    if not token:

        return None


    try:

        serializer = (
            get_admin_invitation_serializer()
        )


        data = serializer.loads(
            token,
            max_age=max_age
        )


        if not isinstance(
            data,
            dict
        ):

            return None


        if (
            data.get(
                "purpose"
            )
            !=
            "admin_team_invitation"
        ):

            return None


        return data


    except Exception as e:

        print(
            "ADMIN TEAM INVITATION TOKEN ERROR:",
            str(e)
        )

        return None


# ============================================================
# CREATE INVITATION LINK
# ============================================================

def create_admin_team_invitation_link(
    token
):

    return (
        f"{FRONTEND_URL}"
        f"/admin/team-invitation"
        f"?token={token}"
    )


# ============================================================
# HOST TEAM ACCOUNTS STORAGE
# ============================================================
TEAM_ACCOUNTS_FILE = "team_accounts.json"
# ============================================================
# ADMIN TEAM ACCOUNTS STORAGE
# ============================================================
ADMIN_TEAM_ACCOUNTS_FILE = "admin_team_accounts.json"
# ============================================================
# ENSURE HOST TEAM ACCOUNTS FILE EXISTS
# ============================================================
def ensure_team_accounts_file():
    if not os.path.exists(
        TEAM_ACCOUNTS_FILE
    ):
        with open(
            TEAM_ACCOUNTS_FILE,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump(
                [],
                file,
                indent=4,
                ensure_ascii=False
            )
# ============================================================
# LOAD HOST TEAM ACCOUNTS
# ============================================================
def load_team_accounts():
    ensure_team_accounts_file()
    try:
        with open(
            TEAM_ACCOUNTS_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            data = json.load(file)
        if not isinstance(
            data,
            list
        ):
            return []
        return data
    except Exception as e:
        print(
            "HOST TEAM ACCOUNTS LOAD ERROR:",
            str(e)
        )
        return []
# ============================================================
# SAVE HOST TEAM ACCOUNTS
# ============================================================
def save_team_accounts(
    accounts
):
    ensure_team_accounts_file()
    with open(
        TEAM_ACCOUNTS_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            accounts,
            file,
            indent=4,
            ensure_ascii=False
        )


# ============================================================
# ADMIN TOKEN VERIFICATION
#
# IMPORTANT:
# This is the ONLY admin token verification function
# used by this section.
#
# Do NOT define another verify_admin_token()
# below this section.
# ============================================================

def verify_admin_token(
    token
):

    if not token:

        return False


    try:

        serializer = (
            get_admin_token_serializer()
        )


        data = serializer.loads(
            token
        )


        if not isinstance(
            data,
            dict
        ):

            return False


        if (
            data.get("role")
            !=
            "admin"
        ):

            return False


        token_email = str(
            data.get(
                "email",
                ""
            )
        ).strip().lower()


        admin_email = str(
            ADMIN_EMAIL
        ).strip().lower()


        if (
            token_email
            !=
            admin_email
        ):

            return False


        return True


    except Exception as e:

        print(
            "ADMIN TOKEN VERIFICATION ERROR:",
            str(e)
        )

        return False


# ============================================================
# ADMIN REQUIRED DECORATOR
# ============================================================

def admin_required(
    function
):

    @wraps(function)
    def decorated_function(
        *args,
        **kwargs
    ):

        authorization = request.headers.get(
            "Authorization",
            ""
        ).strip()


        if not authorization.startswith(
            "Bearer "
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "Admin authentication required."

            }), 401


        token = authorization[
            len("Bearer "):
        ].strip()


        if not verify_admin_token(
            token
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid or expired admin session."

            }), 401


        return function(
            *args,
            **kwargs
        )


    return decorated_function


# ============================================================
# GET ALL TEAM MEMBERS
#
# ADMIN ONLY
#
# GET /admin/team-members
#
# Automatically completes assignments for events that have
# already finished before returning the current team members.
# ============================================================

@app.route(
    "/admin/team-members",
    methods=["GET"]
)
@admin_required
def get_admin_team_members():

    try:

        # ====================================================
        # LOAD + UPDATE TEAM MEMBERS
        # ====================================================

        members = (
            auto_complete_finished_team_assignments()
        )

        # ====================================================
        # SAFETY
        # ====================================================

        if not isinstance(
            members,
            list
        ):

            members = []

        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "members": members,

            "count": len(members)

        }), 200

    except Exception as e:

        print(
            "GET ADMIN TEAM MEMBERS ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "members": [],

            "message":
                "Unable to load team members."

        }), 500


# ============================================================
# GET CURRENT TEAM ACCOUNT
#
# GET /admin/team-account
#
# Uses TEAM token.
# Does NOT use admin_required.
# ============================================================

@app.route(
    "/admin/team-account",
    methods=["GET"]
)
@team_required
def get_current_team_account(
    account
):

    try:

        team_members = (
            auto_complete_finished_team_assignments()
        )

        current_member = None

        account_id = str(
            account.get(
                "id",
                ""
            ) or ""
        ).strip()

        account_member_id = str(
            account.get(
                "memberId",
                ""
            ) or ""
        ).strip()

        account_email = str(
            account.get(
                "email",
                ""
            ) or ""
        ).strip().lower()

        for member in team_members:

            if not isinstance(
                member,
                dict
            ):
                continue

            member_id = str(
                member.get(
                    "id",
                    ""
                ) or ""
            ).strip()

            member_member_id = str(
                member.get(
                    "memberId",
                    ""
                ) or ""
            ).strip()

            member_email = str(
                member.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            if (
                account_member_id
                and
                member_member_id
                and
                account_member_id
                ==
                member_member_id
            ):

                current_member = member
                break

            if (
                account_id
                and
                member_id
                and
                account_id
                ==
                member_id
            ):

                current_member = member
                break

            if (
                account_email
                and
                member_email
                and
                account_email
                ==
                member_email
            ):

                current_member = member
                break

        # ====================================================
        # START WITH ACCOUNT DATA
        # ====================================================

        safe_account = {

            "id":
                account.get(
                    "id"
                ),

            "memberId":
                account.get(
                    "memberId"
                ),

            "name":
                account.get(
                    "name",
                    ""
                ),

            "email":
                account.get(
                    "email",
                    ""
                ),

            "role":
                account.get(
                    "role",
                    "Event Staff"
                ),

            "host":
                account.get(
                    "host",
                    ""
                ),

            "hostId":
                account.get(
                    "hostId",
                    ""
                ),

            "event":
                account.get(
                    "event",
                    ""
                ),

            "eventId":
                account.get(
                    "eventId",
                    ""
                ),

            "status":
                account.get(
                    "status",
                    "Active"
                )

        }

        # ====================================================
        # OVERRIDE WITH CURRENT MEMBER
        # ====================================================

        if isinstance(
            current_member,
            dict
        ):

            for key in [
                "id",
                "memberId",
                "name",
                "email",
                "role",
                "host",
                "hostId",
                "event",
                "eventId",
                "status"
            ]:

                if (
                    key in current_member
                    and
                    current_member.get(
                        key
                    ) not in [
                        None,
                        ""
                    ]
                ):

                    safe_account[key] = (
                        current_member.get(
                            key
                        )
                    )

        # ====================================================
        # ASSIGNMENTS
        # ====================================================

        assignments = []

        assignment_history = []

        if isinstance(
            current_member,
            dict
        ):

            if isinstance(
                current_member.get(
                    "assignments",
                    []
                ),
                list
            ):

                assignments = (
                    current_member.get(
                        "assignments",
                        []
                    )
                )

            assignment_history = (
                current_member.get(
                    "assignmentHistory",
                    current_member.get(
                        "previousAssignments",
                        []
                    )
                )
            )

            if not isinstance(
                assignment_history,
                list
            ):

                assignment_history = []

        # ====================================================
        # FIND ACTIVE ASSIGNMENT
        # ====================================================

        current_assignment = None

        for assignment in assignments:

            if not isinstance(
                assignment,
                dict
            ):
                continue

            status = str(
                assignment.get(
                    "status",
                    ""
                ) or ""
            ).strip().lower()

            if status == "active":

                current_assignment = (
                    assignment
                )

                break

        # ====================================================
        # LEGACY FALLBACK
        # ====================================================

        if (
            current_assignment is None
            and
            (
                safe_account.get("event")
                or
                safe_account.get("eventId")
            )
        ):

            current_assignment = {

                "eventId":
                    safe_account.get(
                        "eventId",
                        ""
                    ),

                "eventName":
                    safe_account.get(
                        "event",
                        ""
                    ),

                "hostId":
                    safe_account.get(
                        "hostId",
                        ""
                    ),

                "hostName":
                    safe_account.get(
                        "host",
                        ""
                    ),

                "role":
                    safe_account.get(
                        "role",
                        "Event Staff"
                    ),

                "status":
                    "Active"

            }

        # ====================================================
        # FINAL ACCOUNT
        # ====================================================

        safe_account[
            "currentAssignment"
        ] = current_assignment

        safe_account[
            "assignments"
        ] = assignments

        safe_account[
            "assignmentHistory"
        ] = assignment_history

        return jsonify({

            "success": True,

            "account":
                safe_account

        }), 200

    except Exception as e:

        print(
            "GET TEAM ACCOUNT ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to load your team account."

        }), 500




# ============================================================
# CREATE ADMIN TEAM MEMBER
#
# SAFE TEAM MEMBER CREATION + EVENT REASSIGNMENT SUPPORT
#
# IMPORTANT:
# - A team account belongs to the TEAM MEMBER.
# - An event assignment belongs to the EVENT.
# - Past event assignments must never prevent future
#   assignments.
# - Existing accepted accounts are NEVER deleted here.
# ============================================================
@app.route(
    "/admin/team-members",
    methods=["POST"]
)
@admin_required
def create_admin_team_member():
    try:
        data = request.get_json(
            silent=True
        ) or {}
        # ====================================================
        # READ DATA
        # ====================================================
        name = str(
            data.get(
                "name",
                ""
            ) or ""
        ).strip()
        email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()
        host = str(
            data.get(
                "host",
                ""
            ) or ""
        ).strip()
        event = str(
            data.get(
                "event",
                ""
            ) or ""
        ).strip()
        role = str(
            data.get(
                "role",
                ""
            ) or ""
        ).strip()
        # ====================================================
        # VALIDATION
        # ====================================================
        if not name:
            return jsonify({
                "success": False,
                "message": "Team member name is required."
            }), 400
        if not email:
            return jsonify({
                "success": False,
                "message": "Team member email is required."
            }), 400
        allowed_roles = [
            "Scanner",
            "Event Staff",
            "Manager"
        ]
        if role not in allowed_roles:
            return jsonify({
                "success": False,
                "message": "Invalid team member role."
            }), 400
        # ====================================================
        # LOAD EXISTING MEMBERS
        # ====================================================
        members = load_admin_team_members()
        # ====================================================
        # CHECK DUPLICATE ACTIVE ASSIGNMENT
        #
        # IMPORTANT:
        #
        # We only block the same email + same EVENT when
        # that assignment is currently active.
        #
        # A completed/past assignment does NOT block the
        # member from being assigned again.
        # ====================================================
        normalized_event = event.lower()
        for existing_member in members:
            existing_email = str(
                existing_member.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()
            if existing_email != email:
                continue
            # ------------------------------------------------
            # CURRENT EVENT
            # ------------------------------------------------
            existing_current_event = str(
                existing_member.get(
                    "event",
                    ""
                ) or ""
            ).strip().lower()
            if (
                normalized_event
                and
                existing_current_event
                ==
                normalized_event
            ):
                return jsonify({
                    "success": False,
                    "message":
                        "This team member is already assigned to this event."
                }), 409
            # ------------------------------------------------
            # CHECK ASSIGNMENT HISTORY
            # ------------------------------------------------
            assignments = (
                existing_member.get(
                    "assignments",
                    []
                )
            )
            if not isinstance(
                assignments,
                list
            ):
                assignments = []
            for assignment in assignments:
                assignment_event = str(
                    assignment.get(
                        "event",
                        ""
                    ) or ""
                ).strip().lower()
                assignment_status = str(
                    assignment.get(
                        "status",
                        ""
                    ) or ""
                ).strip().lower()
                # Only an active assignment blocks
                # another assignment to the same event.
                if (
                    assignment_event
                    ==
                    normalized_event
                    and
                    assignment_status
                    ==
                    "active"
                ):
                    return jsonify({
                        "success": False,
                        "message":
                            "This team member is already assigned to this event."
                    }), 409
        # ====================================================
        # GENERATE MEMBER ID
        # ====================================================
        member_id = (
            generate_team_member_id(
                members
            )
        )
        # ====================================================
        # CREATE INITIAL ASSIGNMENT
        # ====================================================
        assignments = []
        if event:
            assignments.append({
                "event":
                    event,
                "host":
                    host,
                "assignedAt":
                    datetime.now().isoformat(),
                "unassignedAt":
                    None,
                "status":
                    "Active"
            })
        # ====================================================
        # CREATE MEMBER
        # ====================================================
        member = {
            "id":
                member_id,
            "name":
                name,
            "email":
                email,
            "host":
                host,
            "event":
                event,
            "role":
                role,
            "status":
                "Active",
            "invitationStatus":
                "Not Sent",
            "invitationSentAt":
                None,
            "invitationExpiresAt":
                None,
            "invitationAcceptedAt":
                None,
            "accountCreated":
                False,
            "assignments":
                assignments,
            "createdAt":
                datetime.now().isoformat(),
            "updatedAt":
                datetime.now().isoformat()
        }
        # ====================================================
        # SAVE MEMBER
        # ====================================================
        members.append(
            member
        )
        save_admin_team_members(
            members
        )
        # ====================================================
        # SUCCESS
        # ====================================================
        return jsonify({
            "success":
                True,
            "message":
                "Team member added successfully.",
            "member":
                member
        }), 201
    except Exception as e:
        print(
            "CREATE ADMIN TEAM MEMBER ERROR:",
            str(e)
        )
        return jsonify({
            "success":
                False,
            "message":
                "Unable to create team member."
        }), 500
    

# ============================================================
# UPDATE TEAM MEMBER STATUS
# ============================================================

@app.route(
    "/admin/team-members/<int:member_id>",
    methods=["PUT"]
)
@admin_required
def update_admin_team_member(
    member_id
):

    try:

        data = request.get_json(
            silent=True
        ) or {}


        status = str(
            data.get(
                "status",
                ""
            ) or ""
        ).strip()


        if status not in [
            "Active",
            "Disabled"
        ]:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid team member status."

            }), 400


        member = (
            find_admin_team_member_by_id(
                member_id
            )
        )


        if member is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Team member not found."

            }), 404


        updated_member = (
            update_admin_team_member_record(

                member_id,

                {

                    "status":
                        status,

                    "updatedAt":
                        datetime.now().isoformat()

                }

            )
        )


        return jsonify({

            "success":
                True,

            "message":
                f"Team member {status.lower()} successfully.",

            "member":
                updated_member

        }), 200


    except Exception as e:

        print(
            "UPDATE ADMIN TEAM MEMBER ERROR:",
            str(e)
        )


        return jsonify({

            "success":
                False,

            "message":
                "Unable to update team member."

        }), 500


# ============================================================
# DELETE TEAM MEMBER
#
# IMPORTANT:
# When a team member is deleted, their associated team account
# is also removed.
#
# This allows the same email to be invited again later as a
# completely fresh team account.
# ============================================================

@app.route(
    "/admin/team-members/<int:member_id>",
    methods=["DELETE"]
)
@admin_required
def delete_admin_team_member(
    member_id
):

    try:

        # ====================================================
        # LOAD TEAM MEMBERS
        # ====================================================

        members = (
            load_admin_team_members()
        )


        # ====================================================
        # FIND MEMBER
        # ====================================================

        member_to_delete = None

        remaining_members = []


        for member in members:

            try:

                current_id = int(
                    member.get(
                        "id",
                        0
                    )
                )

            except (
                ValueError,
                TypeError
            ):

                current_id = 0


            if current_id == int(
                member_id
            ):

                member_to_delete = member

            else:

                remaining_members.append(
                    member
                )


        # ====================================================
        # MEMBER NOT FOUND
        # ====================================================

        if member_to_delete is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Team member not found."

            }), 404


        # ====================================================
        # GET MEMBER EMAIL
        # ====================================================

        member_email = str(
            member_to_delete.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        # ====================================================
        # REMOVE TEAM MEMBER
        # ====================================================

        save_admin_team_members(
            remaining_members
        )


        # ====================================================
        # REVOKE ASSOCIATED TEAM ACCOUNT
        #
        # The team account belongs to this team member.
        #
        # Removing the team member should therefore also
        # remove their ability to log in.
        # ====================================================

        team_accounts = (
            load_team_accounts()
        )


        remaining_accounts = []

        removed_account = False


        for account in team_accounts:

            account_member_id = (
                account.get(
                    "memberId"
                )
            )


            account_email = str(
                account.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()


            same_member = False

            same_email = False


            # ------------------------------------------------
            # Match by member ID
            # ------------------------------------------------

            try:

                same_member = (
                    int(account_member_id)
                    ==
                    int(member_id)
                )

            except (
                ValueError,
                TypeError
            ):

                same_member = False


            # ------------------------------------------------
            # Match by email as an additional safeguard
            # ------------------------------------------------

            if (
                member_email
                and
                account_email
                ==
                member_email
            ):

                same_email = True


            # ------------------------------------------------
            # Remove associated account
            # ------------------------------------------------

            if (
                same_member
                or
                same_email
            ):

                removed_account = True

                print(
                    "ADMIN TEAM ACCOUNT REVOKED:",
                    account_email
                )

                continue


            remaining_accounts.append(
                account
            )


        # ====================================================
        # SAVE TEAM ACCOUNTS
        # ====================================================

        if removed_account:

            save_team_accounts(
                remaining_accounts
            )


        # ====================================================
        # SUCCESS
        # ====================================================

        return jsonify({

            "success":
                True,

            "message":
                "Team member removed successfully.",

            "teamAccountRevoked":
                removed_account

        }), 200


    except Exception as e:

        print(
            "DELETE ADMIN TEAM MEMBER ERROR:",
            str(e)
        )


        return jsonify({

            "success":
                False,

            "message":
                "Unable to remove team member."

        }), 500


# ============================================================
# SEND ADMIN TEAM MEMBER INVITATION
# ============================================================

@app.route(
    "/admin/team-members/<int:member_id>/invite",
    methods=["POST"]
)
@admin_required
def send_admin_team_member_invitation(
    member_id
):

    try:

        # ----------------------------------------------------
        # FIND MEMBER
        # ----------------------------------------------------

        member = (
            find_admin_team_member_by_id(
                member_id
            )
        )


        if member is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Team member not found."

            }), 404


        # ----------------------------------------------------
        # EMAIL
        # ----------------------------------------------------

        email = str(
            member.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        if not email:

            return jsonify({

                "success":
                    False,

                "message":
                    "This team member has no email address."

            }), 400


        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        if (
            member.get(
                "status"
            )
            ==
            "Disabled"
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "Cannot invite a disabled team member."

            }), 400


        # ----------------------------------------------------
        # CHECK EXISTING ACCOUNT
        # ----------------------------------------------------

        team_accounts = (
            load_team_accounts()
        )


        for account in team_accounts:

            existing_email = str(
                account.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()


            if existing_email == email:

                return jsonify({

                    "success":
                        False,

                    "message":
                        "A team account already exists for this email."

                }), 409


        # ----------------------------------------------------
        # CREATE TOKEN
        # ----------------------------------------------------

        token = (
            create_admin_team_invitation_token(
                member.get("id"),
                email
            )
        )


        # ----------------------------------------------------
        # CREATE LINK
        # ----------------------------------------------------

        invitation_link = (
            create_admin_team_invitation_link(
                token
            )
        )


        # ----------------------------------------------------
        # INVITATION DATES
        # ----------------------------------------------------

        now = datetime.now()

        expires_at = (
            now
            +
            timedelta(
                hours=48
            )
        )


        # ----------------------------------------------------
        # UPDATE MEMBER
        # ----------------------------------------------------

        updated_member = (
            update_admin_team_member_record(

                member.get("id"),

                {

                    "invitationStatus":
                        "Pending",

                    "invitationSentAt":
                        now.isoformat(),

                    "invitationExpiresAt":
                        expires_at.isoformat(),

                    "accountCreated":
                        False

                }

            )
        )


        if updated_member is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Unable to update team member invitation status."

            }), 500


        # ----------------------------------------------------
        # EMAIL CONTENT
        # ----------------------------------------------------

        member_name = (
            member.get(
                "name",
                "there"
            )
        )


        member_role = (
            member.get(
                "role",
                "Team Member"
            )
        )


        member_host = (
            member.get(
                "host"
            )
            or
            "Not assigned"
        )


        member_event = (
            member.get(
                "event"
            )
            or
            "Not assigned"
        )


        subject = (
            "You're invited to join the EventWaa Team"
        )


        html_body = f"""
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>
                EventWaa Team Invitation
            </title>

        </head>

        <body
            style="
                margin:0;
                padding:0;
                background:#f5f6fa;
                font-family:Arial,Helvetica,sans-serif;
                color:#222;
            "
        >

            <div
                style="
                    max-width:600px;
                    margin:40px auto;
                    background:#ffffff;
                    border-radius:16px;
                    overflow:hidden;
                    box-shadow:0 8px 30px rgba(0,0,0,0.08);
                "
            >

                <div
                    style="
                        padding:30px;
                        background:#6c3df4;
                        color:#ffffff;
                    "
                >

                    <h1
                        style="
                            margin:0 0 8px;
                            font-size:28px;
                        "
                    >
                        EventWaa
                    </h1>

                    <p
                        style="
                            margin:0;
                            font-size:15px;
                            opacity:0.9;
                        "
                    >
                        Team Invitation
                    </p>

                </div>


                <div
                    style="
                        padding:30px;
                    "
                >

                    <p>
                        Hello {member_name},
                    </p>


                    <p>
                        You have been invited to join the
                        <strong>EventWaa team</strong>.
                    </p>


                    <div
                        style="
                            margin:24px 0;
                            padding:20px;
                            background:#f7f5ff;
                            border-radius:12px;
                        "
                    >

                        <p>
                            <strong>Role:</strong>
                            {member_role}
                        </p>

                        <p>
                            <strong>Host:</strong>
                            {member_host}
                        </p>

                        <p>
                            <strong>Event:</strong>
                            {member_event}
                        </p>

                    </div>


                    <p>
                        Accept your invitation to create your
                        EventWaa team account and access the
                        team features assigned to you.
                    </p>


                    <div
                        style="
                            margin:30px 0;
                            text-align:center;
                        "
                    >

                        <a
                            href="{invitation_link}"
                            style="
                                display:inline-block;
                                background:#6c3df4;
                                color:#ffffff;
                                text-decoration:none;
                                padding:15px 26px;
                                border-radius:10px;
                                font-weight:bold;
                            "
                        >
                            Accept Team Invitation
                        </a>

                    </div>


                    <p
                        style="
                            color:#777;
                            font-size:13px;
                            line-height:1.6;
                        "
                    >
                        This invitation expires in
                        <strong>48 hours</strong>.
                    </p>


                    <p
                        style="
                            color:#777;
                            font-size:13px;
                            line-height:1.6;
                        "
                    >
                        If you were not expecting this invitation,
                        you can safely ignore this email.
                    </p>

                </div>

            </div>

        </body>

        </html>
        """


        # ============================================================
        # SEND INVITATION EMAIL
        # ============================================================

        try:

            print("==============================================")
            print("ADMIN TEAM INVITATION EMAIL")
            print("==============================================")
            print("TO:", email)
            print("FROM:", app.config.get("MAIL_DEFAULT_SENDER"))
            print("MAIL SERVER:", app.config.get("MAIL_SERVER"))
            print("MAIL PORT:", app.config.get("MAIL_PORT"))
            print("MAIL USE TLS:", app.config.get("MAIL_USE_TLS"))
            print("MAIL USE SSL:", app.config.get("MAIL_USE_SSL"))
            print("MAIL USERNAME:", app.config.get("MAIL_USERNAME"))
            print("==============================================")

            msg = Message(
                subject=subject,
                sender=app.config.get(
                    "MAIL_DEFAULT_SENDER"
                ) or app.config.get(
                    "MAIL_USERNAME"
                ),
                recipients=[
                    email
                ],
                html=html_body
            )

            mail.send(msg)

            print(
                "ADMIN TEAM INVITATION EMAIL SENT SUCCESSFULLY TO:",
                email
            )

        except Exception as email_error:

            print("==============================================")
            print("ADMIN TEAM INVITATION EMAIL FAILED")
            print("RECIPIENT:", email)
            print(
                "ERROR TYPE:",
                type(email_error).__name__
            )
            print(
                "ERROR:",
                str(email_error)
            )
            print("==============================================")

            return jsonify({
                "success": False,
                "message":
                    "Team member was created, but the invitation email could not be sent.",
                "emailError":
                    str(email_error)
            }), 500


        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        return jsonify({

            "success":
                True,

            "message":
                "Team invitation sent successfully.",

            "member":
                updated_member

        }), 200


    except Exception as e:

        print(
            "SEND ADMIN TEAM INVITATION ERROR:",
            str(e)
        )


        return jsonify({

            "success":
                False,

            "message":
                f"Unable to send team invitation: {str(e)}"

        }), 500


# ============================================================
# VALIDATE ADMIN TEAM INVITATION
#
# Frontend uses:
#
# GET /admin/team-invitation/<token>
# ============================================================

@app.route(
    "/admin/team-invitation/<token>",
    methods=["GET"]
)
def validate_admin_team_invitation(
    token
):

    try:

        # ----------------------------------------------------
        # VERIFY TOKEN
        # ----------------------------------------------------

        invitation_data = (
            verify_admin_team_invitation_token(
                token
            )
        )


        if not invitation_data:

            return jsonify({

                "success":
                    False,

                "message":
                    "This invitation is invalid or has expired."

            }), 400


        # ----------------------------------------------------
        # GET MEMBER DATA
        # ----------------------------------------------------

        member_id = (
            invitation_data.get(
                "member_id"
            )
        )


        email = str(
            invitation_data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        member = (
            find_admin_team_member_by_id(
                member_id
            )
        )


        if member is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Team member could not be found."

            }), 404


        # ----------------------------------------------------
        # VERIFY EMAIL
        # ----------------------------------------------------

        member_email = str(
            member.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        if member_email != email:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invitation email does not match the team member."

            }), 400


        # ----------------------------------------------------
        # CHECK ACCEPTED
        # ----------------------------------------------------

        if (
            member.get(
                "invitationStatus"
            )
            ==
            "Accepted"
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "This invitation has already been accepted."

            }), 409


        # ----------------------------------------------------
        # CHECK DISABLED
        # ----------------------------------------------------

        if (
            member.get(
                "status"
            )
            ==
            "Disabled"
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "This team member account is disabled."

            }), 403


        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        return jsonify({

            "success":
                True,

            "member": {

                "name":
                    member.get(
                        "name",
                        ""
                    ),

                "email":
                    member_email,

                "role":
                    member.get(
                        "role",
                        ""
                    ),

                "host":
                    member.get(
                        "host",
                        ""
                    ),

                "event":
                    member.get(
                        "event",
                        ""
                    )

            }

        }), 200


    except Exception as e:

        print(
            "VALIDATE ADMIN TEAM INVITATION ERROR:",
            str(e)
        )


        return jsonify({

            "success":
                False,

            "message":
                "Unable to validate invitation."

        }), 500


# ============================================================
# ACCEPT ADMIN TEAM INVITATION
#
# Frontend sends:
#
# POST /admin/team-invitation
#
# JSON:
# {
#     "token": "...",
#     "password": "..."
# }
# ============================================================

@app.route(
    "/admin/team-invitation",
    methods=["POST"]
)
def accept_admin_team_invitation():

    try:

        data = request.get_json(
            silent=True
        ) or {}


        token = str(
            data.get(
                "token",
                ""
            ) or ""
        ).strip()


        password = str(
            data.get(
                "password",
                ""
            ) or ""
        )


        # ----------------------------------------------------
        # VALIDATE TOKEN
        # ----------------------------------------------------

        if not token:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invitation token is required."

            }), 400


        invitation_data = (
            verify_admin_team_invitation_token(
                token
            )
        )


        if not invitation_data:

            return jsonify({

                "success":
                    False,

                "message":
                    "This invitation is invalid or has expired."

            }), 400


        # ----------------------------------------------------
        # VALIDATE PASSWORD
        # ----------------------------------------------------

        if len(password) < 8:

            return jsonify({

                "success":
                    False,

                "message":
                    "Password must be at least 8 characters."

            }), 400


        # ----------------------------------------------------
        # INVITATION DATA
        # ----------------------------------------------------

        member_id = (
            invitation_data.get(
                "member_id"
            )
        )


        invited_email = str(
            invitation_data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        # ----------------------------------------------------
        # FIND MEMBER
        # ----------------------------------------------------

        member = (
            find_admin_team_member_by_id(
                member_id
            )
        )


        if member is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Team member account could not be found."

            }), 404


        # ----------------------------------------------------
        # VERIFY EMAIL
        # ----------------------------------------------------

        member_email = str(
            member.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        if member_email != invited_email:

            return jsonify({

                "success":
                    False,

                "message":
                    "Invitation email does not match the team member."

            }), 400


        # ----------------------------------------------------
        # CHECK ACCEPTED
        # ----------------------------------------------------

        if (
            member.get(
                "invitationStatus"
            )
            ==
            "Accepted"
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "This invitation has already been accepted."

            }), 409


        # ----------------------------------------------------
        # CHECK DISABLED
        # ----------------------------------------------------

        if (
            member.get(
                "status"
            )
            ==
            "Disabled"
        ):

            return jsonify({

                "success":
                    False,

                "message":
                    "This team member account is disabled."

            }), 403


        # ----------------------------------------------------
        # LOAD TEAM ACCOUNTS
        # ----------------------------------------------------

        team_accounts = (
            load_team_accounts()
        )


        # ----------------------------------------------------
        # CHECK EXISTING TEAM ACCOUNT
        # ----------------------------------------------------

        for account in team_accounts:

            existing_email = str(
                account.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()


            if existing_email == member_email:

                return jsonify({

                    "success":
                        False,

                    "message":
                        "A team account already exists for this email."

                }), 409


        # ----------------------------------------------------
        # HASH PASSWORD
        # ----------------------------------------------------

        password_hash = (
            generate_password_hash(
                password
            )
        )


        # ----------------------------------------------------
        # CREATE TEAM ACCOUNT
        # ----------------------------------------------------

        account = {

            "id":
                f"TEAM-{member_id}",

            "memberId":
                int(member_id),

            "name":
                member.get(
                    "name",
                    ""
                ),

            "email":
                member_email,

            "password":
                password_hash,

            "role":
                member.get(
                    "role",
                    "Event Staff"
                ),

            "host":
                member.get(
                    "host",
                    ""
                ),

            "event":
                member.get(
                    "event",
                    ""
                ),

            "status":
                "Active",

            "createdAt":
                datetime.now().isoformat()

        }


        # ----------------------------------------------------
        # SAVE TEAM ACCOUNT
        # ----------------------------------------------------

        team_accounts.append(
            account
        )


        save_team_accounts(
            team_accounts
        )


        # ----------------------------------------------------
        # MARK INVITATION ACCEPTED
        # ----------------------------------------------------

        updated_member = (
            update_admin_team_member_record(

                member_id,

                {

                    "invitationStatus":
                        "Accepted",

                    "accountCreated":
                        True,

                    "invitationAcceptedAt":
                        datetime.now().isoformat()

                }

            )
        )


        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        return jsonify({

            "success":
                True,

            "message":
                "Team account created successfully.",

            "account": {

                "id":
                    account["id"],

                "name":
                    account["name"],

                "email":
                    account["email"],

                "role":
                    account["role"],

                "host":
                    account["host"],

                "event":
                    account["event"]

            },

            "member":
                updated_member

        }), 201


    except Exception as e:

        print(
            "ACCEPT ADMIN TEAM INVITATION ERROR:",
            str(e)
        )


        return jsonify({

            "success":
                False,

            "message":
                f"Unable to create team account: {str(e)}"

        }), 500

# ============================================================
# ADMIN TEAM MEMBER ASSIGNMENT SYSTEM
#
# CANONICAL CURRENT ASSIGNMENT:
#
# member["currentAssignment"]
#
# {
#     "id": "...",
#     "eventId": "...",
#     "eventName": "...",
#     "hostId": "...",
#     "hostName": "...",
#     "role": "...",
#     "status": "Active",
#     "assignedAt": "...",
#     "completedAt": None
# }
#
# BACKWARD COMPATIBILITY:
#
# member["event"]
# member["host"]
# member["assignments"]
# member["assignmentHistory"]
#
# The team account itself is NEVER deleted.
# Only the current event assignment changes.
# ============================================================
# ============================================================
# HELPER:
# FIND ADMIN TEAM MEMBER
# ============================================================
def find_admin_team_member(
    members,
    member_id
):
    for index, member in enumerate(members):
        try:
            existing_id = int(
                member.get(
                    "id",
                    0
                )
            )
        except (
            ValueError,
            TypeError
        ):
            existing_id = 0
        if existing_id == member_id:
            return member, index
    return None, None
# ============================================================
# HELPER:
# NORMALIZE STATUS
# ============================================================
def normalize_team_member_status(
    status
):
    return str(
        status or ""
    ).strip().lower()

# ============================================================
# HELPER:
# GET CURRENT ASSIGNMENT
#
# Supports older accounts that may not yet have
# currentAssignment.
# ============================================================
def get_current_team_assignment(
    member
):
    current = member.get(
        "currentAssignment"
    )
    if isinstance(
        current,
        dict
    ):
        current_event_id = str(
            current.get(
                "eventId",
                ""
            ) or ""
        ).strip()
        current_event_name = str(
            current.get(
                "eventName",
                ""
            ) or ""
        ).strip()
        if (
            current_event_id
            or
            current_event_name
        ):
            return current
    # --------------------------------------------------------
    # FALLBACK TO ASSIGNMENTS
    # --------------------------------------------------------
    assignments = member.get(
        "assignments",
        []
    )
    if isinstance(
        assignments,
        list
    ):
        # Check newest active/upcoming assignment first
        for assignment in reversed(
            assignments
        ):
            if not isinstance(
                assignment,
                dict
            ):
                continue
            status = str(
                assignment.get(
                    "status",
                    ""
                ) or ""
            ).strip().lower()
            if status in {
                "active",
                "upcoming"
            }:
                return assignment
    return None

# ============================================================
# CANONICAL ASSIGN / REASSIGN ROUTE
#
# FRONTEND SHOULD USE THIS:
#
# PUT
# /admin/team-members/<member_id>/assign
#
# Expected JSON:
#
# {
#     "eventId": "...",
#     "eventName": "...",
#     "hostId": "...",
#     "hostName": "...",
#     "role": "Scanner"
# }
#
# host / event are also accepted for backwards compatibility.
# ============================================================
@app.route(
    "/admin/team-members/<int:member_id>/assign",
    methods=["PUT"]
)
@admin_required
def assign_admin_team_member(
    member_id
):
    try:
        data = request.get_json(
            silent=True
        ) or {}
        # ====================================================
        # READ DATA
        # ====================================================
        event_id = str(
            data.get(
                "eventId",
                ""
            ) or ""
        ).strip()
        event_name = str(
            data.get(
                "eventName",
                data.get(
                    "event",
                    ""
                )
            ) or ""
        ).strip()
        host_id = str(
            data.get(
                "hostId",
                ""
            ) or ""
        ).strip()
        host_name = str(
            data.get(
                "hostName",
                data.get(
                    "host",
                    ""
                )
            ) or ""
        ).strip()
        role = str(
            data.get(
                "role",
                ""
            ) or ""
        ).strip()
        # ====================================================
        # VALIDATION
        # ====================================================
        if not event_id:
            return jsonify({
                "success":
                    False,
                "message":
                    "Event ID is required."
            }), 400
        if not event_name:
            return jsonify({
                "success":
                    False,
                "message":
                    "Event name is required."
            }), 400
        allowed_roles = {
            "Scanner",
            "Event Staff",
            "Manager"
        }
        if role not in allowed_roles:
            return jsonify({
                "success":
                    False,
                "message":
                    "Invalid team member role."
            }), 400
        # ====================================================
        # LOAD MEMBERS
        # ====================================================
        members = (
            load_admin_team_members()
        )
        # ====================================================
        # FIND MEMBER
        # ====================================================
        member, member_index = (
            find_admin_team_member(
                members,
                member_id
            )
        )
        if member is None:
            return jsonify({
                "success":
                    False,
                "message":
                    "Team member not found."
            }), 404
        # ====================================================
        # CHECK MEMBER STATUS
        # ====================================================
        member_status = (
            normalize_team_member_status(
                member.get(
                    "status",
                    "Active"
                )
            )
        )
        if member_status != "active":
            return jsonify({
                "success":
                    False,
                "message":
                    (
                        "Disabled team members "
                        "cannot be assigned to events."
                    )
            }), 400
        # ====================================================
        # CURRENT ASSIGNMENT
        # ====================================================
        current_assignment = (
            get_current_team_assignment(
                member
            )
        )
        # ====================================================
        # NORMALIZE CURRENT EVENT ID
        # ====================================================
        current_event_id = ""
        if isinstance(
            current_assignment,
            dict
        ):
            current_event_id = str(
                current_assignment.get(
                    "eventId",
                    ""
                ) or ""
            ).strip()
        # ====================================================
        # SAME ACTIVE EVENT
        # ====================================================
        if (
            current_event_id
            and
            current_event_id
            ==
            event_id
        ):
            return jsonify({
                "success":
                    False,
                "message":
                    (
                        "This team member is already "
                        "assigned to this event."
                    )
            }), 409
        # ====================================================
        # CURRENT TIME
        # ====================================================
        now = datetime.now().isoformat()
        # ====================================================
        # MAKE SURE ASSIGNMENTS EXISTS
        # ====================================================
        assignments = member.get(
            "assignments",
            []
        )
        if not isinstance(
            assignments,
            list
        ):
            assignments = []
        # ====================================================
        # MAKE SURE HISTORY EXISTS
        # ====================================================
        assignment_history = (
            member.get(
                "assignmentHistory",
                []
            )
        )
        if not isinstance(
            assignment_history,
            list
        ):
            assignment_history = []
        # ====================================================
        # CLOSE PREVIOUS CURRENT ASSIGNMENT
        # ====================================================
        if isinstance(
            current_assignment,
            dict
        ):
            previous_event_id = str(
                current_assignment.get(
                    "eventId",
                    ""
                ) or ""
            ).strip()
            previous_event_name = str(
                current_assignment.get(
                    "eventName",
                    ""
                ) or ""
            ).strip()
            previous_host_id = str(
                current_assignment.get(
                    "hostId",
                    ""
                ) or ""
            ).strip()
            previous_host_name = str(
                current_assignment.get(
                    "hostName",
                    ""
                ) or ""
            ).strip()
            previous_role = str(
                current_assignment.get(
                    "role",
                    member.get(
                        "role",
                        ""
                    )
                ) or ""
            ).strip()
            previous_assigned_at = (
                current_assignment.get(
                    "assignedAt",
                    member.get(
                        "assignmentStartedAt",
                        member.get(
                            "updatedAt",
                            ""
                        )
                    )
                )
            )
            previous_history = {
                "id":
                    current_assignment.get(
                        "id",
                        (
                            f"assignment_"
                            f"{member_id}_"
                            f"{int(datetime.now().timestamp() * 1000)}"
                        )
                    ),
                "eventId":
                    previous_event_id,
                "event":
                    previous_event_name,
                "eventName":
                    previous_event_name,
                "hostId":
                    previous_host_id,
                "host":
                    previous_host_name,
                "hostName":
                    previous_host_name,
                "role":
                    previous_role,
                "assignedAt":
                    previous_assigned_at,
                "endedAt":
                    now,
                "completedAt":
                    now,
                "status":
                    "Completed",
                "reason":
                    "Reassigned"
            }
            assignment_history.append(
                previous_history
            )
            # ------------------------------------------------
            # ALSO CLOSE MATCHING ASSIGNMENT RECORD
            # ------------------------------------------------
            for assignment in assignments:
                if not isinstance(
                    assignment,
                    dict
                ):
                    continue
                assignment_id = str(
                    assignment.get(
                        "id",
                        ""
                    ) or ""
                ).strip()
                current_id = str(
                    current_assignment.get(
                        "id",
                        ""
                    ) or ""
                ).strip()
                assignment_event_id = str(
                    assignment.get(
                        "eventId",
                        ""
                    ) or ""
                ).strip()
                if (
                    (
                        assignment_id
                        and
                        current_id
                        and
                        assignment_id
                        ==
                        current_id
                    )
                    or
                    (
                        assignment_event_id
                        and
                        previous_event_id
                        and
                        assignment_event_id
                        ==
                        previous_event_id
                        and
                        str(
                            assignment.get(
                                "status",
                                ""
                            )
                        ).lower()
                        in {
                            "active",
                            "upcoming"
                        }
                    )
                ):
                    assignment[
                        "status"
                    ] = "Completed"
                    assignment[
                        "completedAt"
                    ] = now
                    assignment[
                        "unassignedAt"
                    ] = now
        # ====================================================
        # CREATE NEW ASSIGNMENT ID
        # ====================================================
        assignment_id = (
            f"assignment_"
            f"{member_id}_"
            f"{int(datetime.now().timestamp() * 1000)}"
        )
        # ====================================================
        # CREATE NEW CURRENT ASSIGNMENT
        # ====================================================
        new_assignment = {
            "id":
                assignment_id,
            "eventId":
                event_id,
            "eventName":
                event_name,
            "hostId":
                host_id,
            "hostName":
                host_name,
            "role":
                role,
            "status":
                "Active",
            "assignedAt":
                now,
            "completedAt":
                None,
            "unassignedAt":
                None
        }
        # ====================================================
        # ADD TO ASSIGNMENTS
        # ====================================================
        assignments.append(
            new_assignment.copy()
        )
        # ====================================================
        # SET CURRENT ASSIGNMENT
        # ====================================================
        member[
            "currentAssignment"
        ] = new_assignment
        # ====================================================
        # BACKWARD COMPATIBILITY
        # ====================================================
        member[
            "event"
        ] = event_name
        member[
            "host"
        ] = host_name
        member[
            "eventId"
        ] = event_id
        member[
            "hostId"
        ] = host_id
        member[
            "role"
        ] = role
        member[
            "assignmentStartedAt"
        ] = now
        member[
            "updatedAt"
        ] = now
        # ====================================================
        # SAVE ASSIGNMENTS
        # ====================================================
        member[
            "assignments"
        ] = assignments
        member[
            "assignmentHistory"
        ] = assignment_history
        # ====================================================
        # SAVE MEMBER
        # ====================================================
        members[
            member_index
        ] = member
        save_admin_team_members(
            members
        )
        # ====================================================
        # LOG
        # ====================================================
        print(
            "ADMIN TEAM MEMBER ASSIGNED:",
            member.get(
                "name",
                ""
            ),
            "EVENT ID:",
            event_id,
            "EVENT:",
            event_name,
            "ROLE:",
            role
        )
        # ====================================================
        # RETURN COMPLETE MEMBER
        #
        # IMPORTANT:
        # The frontend can immediately replace its member
        # state with this response.
        # NO LOGOUT / LOGIN REQUIRED.
        # ====================================================
        return jsonify({
            "success":
                True,
            "message":
                (
                    "Team member reassigned successfully."
                    if current_assignment
                    else
                    "Team member assigned successfully."
                ),
            "member":
                member,
            "currentAssignment":
                new_assignment,
            "assignment":
                new_assignment
        }), 200
    except Exception as e:
        print(
            "ASSIGN ADMIN TEAM MEMBER ERROR:",
            str(e)
        )
        return jsonify({
            "success":
                False,
            "message":
                "Unable to assign team member to event."
        }), 500
# ============================================================
# GET CURRENT TEAM MEMBER ASSIGNMENT
#
# GET
# /admin/team-members/<member_id>/current-assignment
#
# Useful for refreshing a single team member without logging
# out and back in.
# ============================================================
@app.route(
    "/admin/team-members/<int:member_id>/current-assignment",
    methods=["GET"]
)
@admin_required
def get_admin_team_member_current_assignment(
    member_id
):
    try:
        members = (
            load_admin_team_members()
        )
        member, member_index = (
            find_admin_team_member(
                members,
                member_id
            )
        )
        if member is None:
            return jsonify({
                "success":
                    False,
                "message":
                    "Team member not found."
            }), 404
        current_assignment = (
            get_current_team_assignment(
                member
            )
        )
        return jsonify({
            "success":
                True,
            "member":
                member,
            "currentAssignment":
                current_assignment
        }), 200
    except Exception as e:
        print(
            "GET CURRENT TEAM ASSIGNMENT ERROR:",
            str(e)
        )
        return jsonify({
            "success":
                False,
            "message":
                "Unable to load current assignment."
        }), 500
# ============================================================
# COMPLETE CURRENT ASSIGNMENT
#
# OPTIONAL BUT RECOMMENDED
#
# POST
# /admin/team-members/<member_id>/complete-assignment
# ============================================================
@app.route(
    "/admin/team-members/<int:member_id>/complete-assignment",
    methods=["POST"]
)
@admin_required
def complete_admin_team_member_assignment(
    member_id
):
    try:
        members = (
            load_admin_team_members()
        )
        member, member_index = (
            find_admin_team_member(
                members,
                member_id
            )
        )
        if member is None:
            return jsonify({
                "success":
                    False,
                "message":
                    "Team member not found."
            }), 404
        current_assignment = (
            get_current_team_assignment(
                member
            )
        )
        if not isinstance(
            current_assignment,
            dict
        ):
            return jsonify({
                "success":
                    False,
                "message":
                    "This team member has no current assignment."
            }), 404
        now = datetime.now().isoformat()
        # ====================================================
        # MOVE CURRENT TO HISTORY
        # ====================================================
        assignment_history = (
            member.get(
                "assignmentHistory",
                []
            )
        )
        if not isinstance(
            assignment_history,
            list
        ):
            assignment_history = []
        completed_assignment = (
            current_assignment.copy()
        )
        completed_assignment[
            "status"
        ] = "Completed"
        completed_assignment[
            "completedAt"
        ] = now
        completed_assignment[
            "endedAt"
        ] = now
        assignment_history.append(
            completed_assignment
        )
        # ====================================================
        # CLOSE ASSIGNMENT RECORD
        # ====================================================
        assignments = member.get(
            "assignments",
            []
        )
        if not isinstance(
            assignments,
            list
        ):
            assignments = []
        current_assignment_id = str(
            current_assignment.get(
                "id",
                ""
            ) or ""
        ).strip()
        for assignment in assignments:
            if not isinstance(
                assignment,
                dict
            ):
                continue
            assignment_id = str(
                assignment.get(
                    "id",
                    ""
                ) or ""
            ).strip()
            if (
                assignment_id
                ==
                current_assignment_id
            ):
                assignment[
                    "status"
                ] = "Completed"
                assignment[
                    "completedAt"
                ] = now
                assignment[
                    "unassignedAt"
                ] = now
        # ====================================================
        # CLEAR CURRENT ASSIGNMENT
        # ====================================================
        member[
            "currentAssignment"
        ] = None
        member[
            "event"
        ] = ""
        member[
            "eventId"
        ] = ""
        member[
            "host"
        ] = ""
        member[
            "hostId"
        ] = ""
        member[
            "assignmentStartedAt"
        ] = None
        member[
            "updatedAt"
        ] = now
        member[
            "assignments"
        ] = assignments
        member[
            "assignmentHistory"
        ] = assignment_history
        # ====================================================
        # SAVE
        # ====================================================
        members[
            member_index
        ] = member
        save_admin_team_members(
            members
        )
        return jsonify({
            "success":
                True,
            "message":
                "Current assignment completed successfully.",
            "member":
                member,
            "currentAssignment":
                None
        }), 200
    except Exception as e:
        print(
            "COMPLETE TEAM ASSIGNMENT ERROR:",
            str(e)
        )
        return jsonify({
            "success":
                False,
            "message":
                "Unable to complete team member assignment."
        }), 500

# ============================================================
# ADMIN TEAM LOGIN
#
# POST /admin/team-login
#
# Team members created through an accepted invitation
# use this endpoint to sign in.
# ============================================================

@app.route(
    "/admin/team-login",
    methods=["POST"]
)
def admin_team_login():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        # ====================================================
        # READ LOGIN DATA
        # ====================================================

        email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()

        password = str(
            data.get(
                "password",
                ""
            ) or ""
        )

        # ====================================================
        # VALIDATION
        # ====================================================

        if not email:

            return jsonify({

                "success": False,

                "message":
                    "Email address is required."

            }), 400

        if not password:

            return jsonify({

                "success": False,

                "message":
                    "Password is required."

            }), 400

        # ====================================================
        # LOAD TEAM ACCOUNTS
        #
        # Both Admin Team and Host Team login accounts are stored
        # in team_accounts.json.
        #
        # Admin Team member records remain in:
        #   admin_team_members.json
        #
        # Host Team member records remain in:
        #   team_members.json
        # ====================================================

        team_accounts = load_json_file(
            "team_accounts.json",
            []
        )

        if not isinstance(team_accounts, list):
            team_accounts = []

        account = None

        for team_account in team_accounts:

            if not isinstance(
                team_account,
                dict
            ):
                continue

            account_email = str(
                team_account.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            if account_email == email:

                account = team_account

                break

        # ====================================================
        # ACCOUNT NOT FOUND
        # ====================================================

        if account is None:

            print(
                "ADMIN TEAM LOGIN FAILED: ACCOUNT NOT FOUND:",
                email
            )

            print(
                "TEAM ACCOUNTS LOADED:",
                len(team_accounts)
            )

            print(
                "TEAM ACCOUNT EMAILS:",
                [
                    item.get("email")
                    for item in team_accounts
                    if isinstance(item, dict)
                ]
            )

            return jsonify({

                "success": False,

                "message":
                    "Invalid email or password."

            }), 401

        # ====================================================
        # ACCOUNT STATUS
        # ====================================================

        account_status = str(
            account.get(
                "status",
                "Active"
            ) or "Active"
        ).strip()

        if account_status.lower() != "active":

            return jsonify({

                "success": False,

                "message":
                    "Your team account has been disabled. Please contact the administrator."

            }), 403

        # ====================================================
        # PASSWORD
        # ====================================================

        stored_password = str(
            account.get(
                "password",
                ""
            ) or ""
        )

        if not stored_password:

            return jsonify({

                "success": False,

                "message":
                    "This team account has not been configured correctly."

            }), 500

        stored_password = account.get("password", "")

        print("ADMIN TEAM PASSWORD CHECK")
        print("LOGIN EMAIL:", email)
        print("PASSWORD ENTERED:", bool(password))
        print("STORED PASSWORD EXISTS:", bool(stored_password))
        print("STORED PASSWORD PREFIX:", str(stored_password)[:20])

        if not stored_password:
            print("ADMIN TEAM LOGIN FAILED: NO STORED PASSWORD")

            return jsonify({
                "success": False,
                "message": "Admin team account has no password configured."
            }), 500


        password_valid = check_password_hash(
            stored_password,
            password
        )

        print("ADMIN TEAM PASSWORD VALID:", password_valid)

        if not password_valid:
            print("ADMIN TEAM LOGIN FAILED: PASSWORD MISMATCH")

            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        # ====================================================
        # LOAD CURRENT MEMBER
        # ====================================================

        current_member = None

        try:

            team_members = (
                load_admin_team_members()
            )

            account_id = str(
                account.get(
                    "id",
                    ""
                ) or ""
            ).strip()

            account_member_id = str(
                account.get(
                    "memberId",
                    ""
                ) or ""
            ).strip()

            account_email = str(
                account.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            for member in team_members:

                if not isinstance(
                    member,
                    dict
                ):
                    continue

                member_id = str(
                    member.get(
                        "id",
                        ""
                    ) or ""
                ).strip()

                member_member_id = str(
                    member.get(
                        "memberId",
                        ""
                    ) or ""
                ).strip()

                member_email = str(
                    member.get(
                        "email",
                        ""
                    ) or ""
                ).strip().lower()

                # MEMBER ID
                if (
                    account_member_id
                    and
                    member_member_id
                    and
                    account_member_id
                    ==
                    member_member_id
                ):

                    current_member = member
                    break

                # ACCOUNT ID
                if (
                    account_id
                    and
                    member_id
                    and
                    account_id
                    ==
                    member_id
                ):

                    current_member = member
                    break

                # EMAIL
                if (
                    account_email
                    and
                    member_email
                    and
                    account_email
                    ==
                    member_email
                ):

                    current_member = member
                    break

        except Exception as assignment_error:

            print(
                "TEAM CURRENT MEMBER LOOKUP ERROR:",
                str(assignment_error)
            )

            current_member = None

        # ====================================================
        # FIND ACTIVE ASSIGNMENT
        # ====================================================

        current_assignment = None

        assignments = []

        assignment_history = []

        if isinstance(
            current_member,
            dict
        ):

            raw_assignments = (
                current_member.get(
                    "assignments",
                    []
                )
            )

            if isinstance(
                raw_assignments,
                list
            ):

                assignments = (
                    raw_assignments
                )

                # --------------------------------------------
                # FIND ACTIVE ASSIGNMENT
                # --------------------------------------------

                for assignment in assignments:

                    if not isinstance(
                        assignment,
                        dict
                    ):
                        continue

                    status = str(
                        assignment.get(
                            "status",
                            ""
                        ) or ""
                    ).strip().lower()

                    if status == "active":

                        current_assignment = (
                            assignment
                        )

                        break

            raw_history = (
                current_member.get(
                    "assignmentHistory",
                    current_member.get(
                        "previousAssignments",
                        []
                    )
                )
            )

            if isinstance(
                raw_history,
                list
            ):

                assignment_history = (
                    raw_history
                )

        # ====================================================
        # FALLBACK LEGACY ASSIGNMENT
        #
        # Your current data already has:
        #
        # event = Eventwaa test
        # host  = Eventwaa
        #
        # Therefore we preserve it as the current assignment
        # if the assignments array is empty.
        # ====================================================

        current_event = ""

        current_host = ""

        current_event_id = ""

        current_host_id = ""

        current_role = str(
            account.get(
                "role",
                "Event Staff"
            ) or "Event Staff"
        ).strip()

        if current_assignment:

            current_event = str(
                current_assignment.get(
                    "eventName",
                    current_assignment.get(
                        "event",
                        ""
                    )
                ) or ""
            ).strip()

            current_event_id = str(
                current_assignment.get(
                    "eventId",
                    ""
                ) or ""
            ).strip()

            current_host = str(
                current_assignment.get(
                    "hostName",
                    current_assignment.get(
                        "host",
                        ""
                    )
                ) or ""
            ).strip()

            current_host_id = str(
                current_assignment.get(
                    "hostId",
                    ""
                ) or ""
            ).strip()

            current_role = str(
                current_assignment.get(
                    "role",
                    current_role
                ) or current_role
            ).strip()

        elif isinstance(
            current_member,
            dict
        ):

            current_event = str(
                current_member.get(
                    "event",
                    ""
                ) or ""
            ).strip()

            current_event_id = str(
                current_member.get(
                    "eventId",
                    ""
                ) or ""
            ).strip()

            current_host = str(
                current_member.get(
                    "host",
                    ""
                ) or ""
            ).strip()

            current_host_id = str(
                current_member.get(
                    "hostId",
                    ""
                ) or ""
            ).strip()

            current_role = str(
                current_member.get(
                    "role",
                    current_role
                ) or current_role
            ).strip()

        # ====================================================
        # ACCOUNT FALLBACK
        # ====================================================

        if not current_event:

            current_event = str(
                account.get(
                    "event",
                    ""
                ) or ""
            ).strip()

        if not current_event_id:

            current_event_id = str(
                account.get(
                    "eventId",
                    ""
                ) or ""
            ).strip()

        if not current_host:

            current_host = str(
                account.get(
                    "host",
                    ""
                ) or ""
            ).strip()

        if not current_host_id:

            current_host_id = str(
                account.get(
                    "hostId",
                    ""
                ) or ""
            ).strip()

        # ====================================================
        # BUILD CURRENT ASSIGNMENT FROM LEGACY DATA
        # ====================================================

        if (
            current_assignment is None
            and
            (
                current_event
                or
                current_event_id
            )
        ):

            current_assignment = {

                "eventId":
                    current_event_id,

                "eventName":
                    current_event,

                "hostId":
                    current_host_id,

                "hostName":
                    current_host,

                "role":
                    current_role,

                "status":
                    "Active"

            }

        # ====================================================
        # SAFE ACCOUNT
        # ====================================================

        safe_account = {

            "id":
                account.get(
                    "id"
                ),

            "memberId":
                account.get(
                    "memberId"
                )
                or (
                    current_member.get(
                        "memberId"
                    )
                    if isinstance(
                        current_member,
                        dict
                    )
                    else None
                ),

            "name":
                account.get(
                    "name",
                    ""
                ),

            "email":
                account.get(
                    "email",
                    ""
                ),

            "role":
                current_role,

            "host":
                current_host,

            "hostId":
                current_host_id,

            "event":
                current_event,

            "eventId":
                current_event_id,

            "status":
                account.get(
                    "status",
                    "Active"
                ),

            "currentAssignment":
                current_assignment,

            "assignments":
                assignments,

            "assignmentHistory":
                assignment_history

        }

        # ====================================================
        # CREATE ADMIN TEAM SESSION TOKEN
        # ====================================================

        admin_member_id = None

        if isinstance(
            current_member,
            dict
        ):

            admin_member_id = (
                current_member.get(
                    "id"
                )
                or
                current_member.get(
                    "memberId"
                )
            )

        if not admin_member_id:

            admin_member_id = (
                account.get(
                    "memberId"
                )
                or
                account.get(
                    "id"
                )
            )

        token = create_team_token(
            account,
            member_id=admin_member_id,
            name=account.get(
                "name",
                ""
            ),
            team_type="admin"
        )

        # ====================================================
        # DEBUG
        # ====================================================

        print(
            "ADMIN TEAM LOGIN SUCCESSFUL:",
            email
        )

        print(
            "TEAM CURRENT ASSIGNMENT:",
            current_event or "NONE"
        )

        print(
            "TEAM CURRENT HOST:",
            current_host or "NONE"
        )

        print(
            "TEAM TOKEN CREATED:",
            bool(token)
        )

        # ====================================================
        # SUCCESS
        # ====================================================

        return jsonify({

            "success": True,

            "message":
                "Team login successful.",

            "token":
                token,

            "account":
                safe_account

        }), 200

    except Exception as e:

        print(
            "ADMIN TEAM LOGIN ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to sign in to the team account."

        }), 500

# ============================================================
# TOGGLE TEAM MEMBER STATUS
# ============================================================

@app.route(
    "/admin/team-members/<int:member_id>/status",
    methods=["PATCH"]
)
@admin_required
def toggle_admin_team_member_status(
    member_id
):

    try:

        members = load_admin_team_members()


        member = next(
            (
                item
                for item in members
                if str(
                    item.get(
                        "id",
                        ""
                    )
                ) == str(member_id)
            ),
            None
        )


        if not member:

            return jsonify({

                "success": False,

                "message":
                    "Team member not found."

            }), 404


        # ----------------------------------------------------
        # TOGGLE STATUS
        # ----------------------------------------------------

        if member.get("status") == "Active":

            member["status"] = "Disabled"

        else:

            member["status"] = "Active"


        member[
            "updatedAt"
        ] = datetime.now().isoformat()


        save_admin_team_members(
            members
        )


        return jsonify({

            "success": True,

            "message":
                "Team member status updated.",

            "member":
                member

        }), 200


    except Exception as e:

        print(
            "TOGGLE TEAM MEMBER STATUS ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to update team member."

        }), 500



# ============================================================
# ADMIN PASSWORD STORAGE
# ============================================================

ADMIN_PASSWORD_FILE = "admin_auth.json"


# ============================================================
# GET CURRENT ADMIN PASSWORD HASH
# ============================================================

def get_current_admin_password_hash():

    try:

        if os.path.exists(
            ADMIN_PASSWORD_FILE
        ):

            admin_data = load_json_file(
                ADMIN_PASSWORD_FILE,
                {}
            )

            saved_hash = str(
                admin_data.get(
                    "password_hash",
                    ""
                ) or ""
            ).strip()

            if saved_hash:

                return saved_hash

    except Exception as error:

        print(
            "ADMIN PASSWORD FILE ERROR:",
            str(error)
        )

    return ADMIN_PASSWORD_HASH


# ============================================================
# SAVE ADMIN PASSWORD HASH
# ============================================================

def save_admin_password_hash(
    password_hash
):

    save_json_file(
        ADMIN_PASSWORD_FILE,
        {
            "password_hash":
                password_hash,

            "updated_at":
                datetime.now(
                    timezone.utc
                ).isoformat()
        }
    )

# ============================================================
# ADMIN LOGIN
# ============================================================

@app.route(
    "/admin/login",
    methods=["POST"]
)
def admin_login():

    global admin_failed_login_attempts

    try:

        data = request.get_json(
            silent=True
        ) or {}

        email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()

        password = str(
            data.get(
                "password",
                ""
            ) or ""
        )

        # ====================================================
        # CHECK ADMIN CONFIGURATION
        # ====================================================

        if not ADMIN_EMAIL:

            return jsonify({

                "success": False,

                "message":
                    "Admin authentication is not configured."

            }), 500


        if not ADMIN_PASSWORD_HASH:

            return jsonify({

                "success": False,

                "message":
                    "Admin authentication is not configured."

            }), 500


        if not ADMIN_AUTH_SECRET:

            print(
                "ADMIN LOGIN ERROR: "
                "ADMIN_AUTH_SECRET is not configured."
            )

            return jsonify({

                "success": False,

                "message":
                    "Admin authentication is not configured."

            }), 500


        # ====================================================
        # VALIDATE INPUT
        # ====================================================

        if not email or not password:

            return jsonify({

                "success": False,

                "message":
                    "Email and password are required."

            }), 400


        # ====================================================
        # CHECK EMAIL
        # ====================================================

        email_matches_admin = (
            email == ADMIN_EMAIL
        )

        # ====================================================
        # INVALID EMAIL
        #
        # We deliberately use the same generic message.
        # This prevents revealing whether an email belongs
        # to the admin account.
        # ====================================================

        if not email_matches_admin:

            print(
                "ADMIN LOGIN: "
                "Invalid email attempt."
            )

            return jsonify({

                "success": False,

                "message":
                    "Invalid admin credentials."

            }), 401


        # ====================================================
        # CHECK PASSWORD
        # ====================================================

        current_admin_password_hash = (
            get_current_admin_password_hash()
        )

        password_valid = check_password_hash(
            current_admin_password_hash,
            password
        )


        # ====================================================
        # FAILED ADMIN LOGIN
        # ====================================================

        if not password_valid:

            admin_failed_login_attempts += 1

            current_attempt = (
                admin_failed_login_attempts
            )

            print(
                "ADMIN LOGIN FAILED:",
                current_attempt
            )


            # =================================================
            # SECURITY ALERT AFTER 2 FAILED ATTEMPTS
            # =================================================

            if current_attempt == 2:

                try:

                    # -----------------------------------------
                    # REQUEST INFORMATION
                    # -----------------------------------------

                    ip_address = (
                        request.headers.get(
                            "X-Forwarded-For",
                            request.remote_addr
                        )
                    )

                    user_agent = (
                        request.headers.get(
                            "User-Agent",
                            "Unknown device"
                        )
                    )

                    # -----------------------------------------
                    # SECURITY EMAIL
                    # -----------------------------------------

                    msg = Message(

                        subject=(
                            "🚨 EventWaa Admin Security Alert "
                            "— 2 Failed Login Attempts"
                        ),

                        recipients=[
                            ADMIN_EMAIL
                        ]

                    )

                    msg.body = f"""
EventWaa Admin Security Alert

Two unsuccessful login attempts were detected
on the EventWaa administrator account.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIME
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

IP ADDRESS
{ip_address}

ATTEMPTED EMAIL
{email}

BROWSER / DEVICE
{user_agent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If these login attempts were made by you,
you can safely ignore this message.

If you did NOT attempt to sign in:

• Change your admin password immediately.
• Check your admin account activity.
• Do not share your admin credentials.
• Review your server and deployment security.

This is an automated security notification
from EventWaa.

EventWaa Security System
"""

                    # -----------------------------------------
                    # SEND EMAIL
                    # -----------------------------------------

                    mail.send(msg)

                    print(
                        "ADMIN SECURITY ALERT EMAIL SENT."
                    )

                except Exception as email_error:

                    print(
                        "ADMIN SECURITY EMAIL ERROR:",
                        str(email_error)
                    )


            # =================================================
            # RESPONSE
            # =================================================

            return jsonify({

                "success": False,

                "message":
                    "Invalid admin credentials."

            }), 401


        # ====================================================
        # SUCCESSFUL ADMIN LOGIN
        #
        # Reset failed attempts.
        # ====================================================

        admin_failed_login_attempts = 0


        # ====================================================
        # CREATE SESSION TOKEN
        # ====================================================

        token = create_admin_token()


        # ====================================================
        # SUCCESS
        # ====================================================

        return jsonify({

            "success": True,

            "message":
                "Admin login successful.",

            "token":
                token,

            "admin": {

                "email":
                    ADMIN_EMAIL,

                "role":
                    "admin"

            }

        }), 200


    except Exception as e:

        print(
            "ADMIN LOGIN ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to login as admin."

        }), 500

        

# ============================================================
# FLUTTERWAVE CREDENTIAL TEST
# ============================================================

@app.route(
    "/payments/flutterwave-test",
    methods=["GET"]
)
def flutterwave_test():

    return jsonify({

        "success": True,

        "publicKeyLoaded":
            bool(FLW_PUBLIC_KEY),

        "secretKeyLoaded":
            bool(FLW_SECRET_KEY),

        "secretHashLoaded":
            bool(FLW_SECRET_HASH),

        "encryptionKeyLoaded":
            bool(FLW_ENCRYPTION_KEY)

    }), 200

# ============================================================
# ADMIN FORGOT PASSWORD
# ============================================================

@app.route(
    "/admin/forgot-password",
    methods=["POST"]
)
def admin_forgot_password():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        if not email:

            return jsonify({

                "success": False,

                "message":
                    "Admin email address is required."

            }), 400


        # ====================================================
        # GENERIC RESPONSE
        #
        # We deliberately do not reveal whether the supplied
        # email is the administrator email.
        # ====================================================

        generic_message = (
            "If this is the registered administrator email, "
            "a recovery code has been sent."
        )


        # ====================================================
        # EMAIL DOES NOT MATCH ADMIN
        # ====================================================

        if email != ADMIN_EMAIL.lower():

            print(
                "ADMIN PASSWORD RECOVERY: "
                "Unknown email request."
            )

            return jsonify({

                "success": True,

                "message":
                    generic_message

            }), 200


        # ====================================================
        # GENERATE OTP
        # ====================================================

        otp = generate_otp()


        # ====================================================
        # HASH OTP
        # ====================================================

        otp_hash = hash_otp(
            otp
        )


        # ====================================================
        # GENERATE RESET TOKEN
        # ====================================================

        reset_token = generate_reset_token()


        # ====================================================
        # EXPIRATION
        # ====================================================

        now = datetime.now(
            timezone.utc
        )

        expires_at = now + timedelta(
            minutes=10
        )


        # ====================================================
        # LOAD PREVIOUS ADMIN RECOVERY REQUESTS
        # ====================================================

        resets = load_admin_password_resets()


        # Remove previous request

        resets = [

            reset

            for reset in resets

            if str(
                reset.get(
                    "email",
                    ""
                )
            ).strip().lower() != email

        ]


        # ====================================================
        # CREATE RECOVERY SESSION
        # ====================================================

        reset_data = {

            "email":
                email,

            "otp_hash":
                otp_hash,

            "reset_token":
                reset_token,

            "otp_verified":
                False,

            "attempts":
                0,

            "created_at":
                now.isoformat(),

            "expires_at":
                expires_at.isoformat()

        }


        resets.append(
            reset_data
        )


        save_admin_password_resets(
            resets
        )


        # ====================================================
        # SEND EMAIL
        # ====================================================

        email_result = send_admin_otp_email(
            email,
            otp
        )

        if not email_result.get(
            "success",
            False
        ):

            print(
                "ADMIN PASSWORD RECOVERY EMAIL ERROR:",
                email_result.get(
                    "message",
                    "Unknown email error."
                )
            )

            # Remove failed recovery request

            resets = [

                reset

                for reset in resets

                if reset is not reset_data

            ]

            save_admin_password_resets(
                resets
            )

            return jsonify({

                "success": False,

                "message":
                    "Unable to send the recovery email right now."

            }), 500


        print(
            "ADMIN PASSWORD RECOVERY OTP SENT."
        )

        return jsonify({

            "success": True,

            "message":
                generic_message

        }), 200


    except Exception as error:

        print(
            "ADMIN FORGOT PASSWORD ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to process the password recovery request."

        }), 500

# ============================================================
# ADMIN PASSWORD RECOVERY STORAGE
# ============================================================
ADMIN_PASSWORD_RESETS_FILE = (
    "admin_password_resets.json"
)
# ============================================================
# LOAD ADMIN PASSWORD RESET SESSIONS
# ============================================================
def load_admin_password_resets():
    try:
        data = load_json_file(
            ADMIN_PASSWORD_RESETS_FILE,
            []
        )
        if not isinstance(data, list):
            return []
        return data
    except Exception as error:
        print(
            "LOAD ADMIN PASSWORD RESETS ERROR:",
            str(error)
        )
        return []
# ============================================================
# SAVE ADMIN PASSWORD RESET SESSIONS
# ============================================================
def save_admin_password_resets(resets):
    try:
        if not isinstance(
            resets,
            list
        ):
            resets = []
        save_json_file(
            ADMIN_PASSWORD_RESETS_FILE,
            resets
        )
    except Exception as error:
        print(
            "SAVE ADMIN PASSWORD RESETS ERROR:",
            str(error)
        )
        raise # ============================================================
# ADMIN PASSWORD RECOVERY STORAGE
# ============================================================
ADMIN_PASSWORD_RESETS_FILE = (
    "admin_password_resets.json"
)
# ============================================================
# LOAD ADMIN PASSWORD RESET SESSIONS
# ============================================================
def load_admin_password_resets():
    try:
        data = load_json_file(
            ADMIN_PASSWORD_RESETS_FILE,
            []
        )
        if not isinstance(data, list):
            return []
        return data
    except Exception as error:
        print(
            "LOAD ADMIN PASSWORD RESETS ERROR:",
            str(error)
        )
        return []
# ============================================================
# SAVE ADMIN PASSWORD RESET SESSIONS
# ============================================================
def save_admin_password_resets(resets):
    try:
        if not isinstance(
            resets,
            list
        ):
            resets = []
        save_json_file(
            ADMIN_PASSWORD_RESETS_FILE,
            resets
        )
    except Exception as error:
        print(
            "SAVE ADMIN PASSWORD RESETS ERROR:",
            str(error)
        )
        raise

# ============================================================
# VERIFY ADMIN PASSWORD RESET OTP
# ============================================================

@app.route(
    "/admin/verify-otp",
    methods=["POST"]
)
def verify_admin_otp():

    try:

        data = request.get_json(
            silent=True
        ) or {}


        email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        otp = str(
            data.get(
                "otp",
                ""
            ) or ""
        ).strip()


        if not email or not otp:

            return jsonify({

                "success": False,

                "message":
                    "Admin email and verification code are required."

            }), 400


        # ====================================================
        # OTP FORMAT
        # ====================================================

        if not otp.isdigit() or len(otp) != 6:

            return jsonify({

                "success": False,

                "message":
                    "Verification code must contain 6 digits."

            }), 400


        # ====================================================
        # ADMIN EMAIL CHECK
        # ====================================================

        if email != ADMIN_EMAIL.lower():

            return jsonify({

                "success": False,

                "message":
                    "Invalid or expired verification code."

            }), 400


        # ====================================================
        # LOAD RECOVERY SESSION
        # ====================================================

        resets = load_admin_password_resets()


        reset = next(

            (
                item

                for item in resets

                if str(
                    item.get(
                        "email",
                        ""
                    )
                ).strip().lower() == email

            ),

            None

        )


        if not reset:

            return jsonify({

                "success": False,

                "message":
                    "Invalid or expired verification code."

            }), 400


        # ====================================================
        # ATTEMPT LIMIT
        # ====================================================

        attempts = int(
            reset.get(
                "attempts",
                0
            )
        )


        if attempts >= 5:

            resets = [

                item

                for item in resets

                if item is not reset

            ]


            save_admin_password_resets(
                resets
            )


            return jsonify({

                "success": False,

                "message":
                    "Too many incorrect attempts. "
                    "Please request a new code."

            }), 429


        # ====================================================
        # CHECK EXPIRATION
        # ====================================================

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

                "message":
                    "Invalid password recovery session."

            }), 400


        if datetime.now(
            timezone.utc
        ) > expires_at:

            resets = [

                item

                for item in resets

                if item is not reset

            ]


            save_admin_password_resets(
                resets
            )


            return jsonify({

                "success": False,

                "message":
                    "This verification code has expired. "
                    "Please request a new code."

            }), 400


        # ====================================================
        # VERIFY OTP
        # ====================================================

        submitted_hash = hash_otp(
            otp
        )


        if not secrets.compare_digest(

            submitted_hash,

            reset.get(
                "otp_hash",
                ""
            )

        ):

            reset["attempts"] = attempts + 1


            save_admin_password_resets(
                resets
            )


            remaining_attempts = (
                5 - (attempts + 1)
            )


            if remaining_attempts > 0:

                message = (
                    "Invalid verification code. "
                    f"{remaining_attempts} attempts remaining."
                )

            else:

                message = (
                    "Too many incorrect attempts. "
                    "Please request a new code."
                )


            return jsonify({

                "success": False,

                "message":
                    message

            }), 400


        # ====================================================
        # OTP VERIFIED
        # ====================================================

        reset["otp_verified"] = True


        save_admin_password_resets(
            resets
        )


        return jsonify({

            "success": True,

            "message":
                "Verification successful.",

            "resetToken":
                reset.get(
                    "reset_token"
                )

        }), 200


    except Exception as error:

        print(
            "ADMIN OTP VERIFICATION ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to verify the recovery code."

        }), 500

# ============================================================
# RESET ADMIN PASSWORD
# ============================================================

@app.route(
    "/admin/reset-password",
    methods=["POST"]
)
def admin_reset_password():

    try:

        data = request.get_json(
            silent=True
        ) or {}


        email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        reset_token = str(
            data.get(
                "resetToken",
                ""
            ) or ""
        ).strip()


        new_password = str(
            data.get(
                "password",
                ""
            ) or ""
        )


        # ====================================================
        # VALIDATION
        # ====================================================

        if not email:

            return jsonify({

                "success": False,

                "message":
                    "Admin email address is required."

            }), 400


        if email != ADMIN_EMAIL.lower():

            return jsonify({

                "success": False,

                "message":
                    "Invalid password reset session."

            }), 400


        if not reset_token:

            return jsonify({

                "success": False,

                "message":
                    "Invalid password reset session."

            }), 400


        if not new_password:

            return jsonify({

                "success": False,

                "message":
                    "New password is required."

            }), 400


        # ====================================================
        # PASSWORD LENGTH
        # ====================================================

        if len(new_password) < 8:

            return jsonify({

                "success": False,

                "message":
                    "Your password must contain at least "
                    "8 characters."

            }), 400


        # ====================================================
        # LOAD RESET SESSION
        # ====================================================

        resets = load_admin_password_resets()


        reset = next(

            (

                item

                for item in resets

                if (

                    str(
                        item.get(
                            "email",
                            ""
                        )
                    ).strip().lower() == email

                    and

                    str(
                        item.get(
                            "reset_token",
                            ""
                        )
                    ) == reset_token

                )

            ),

            None

        )


        if not reset:

            return jsonify({

                "success": False,

                "message":
                    "Invalid or expired password reset session."

            }), 400


        # ====================================================
        # OTP MUST HAVE BEEN VERIFIED
        # ====================================================

        if not reset.get(
            "otp_verified",
            False
        ):

            return jsonify({

                "success": False,

                "message":
                    "Please verify your recovery code first."

            }), 403


        # ====================================================
        # CHECK EXPIRATION
        # ====================================================

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

                "message":
                    "Invalid password recovery session."

            }), 400


        if datetime.now(
            timezone.utc
        ) > expires_at:

            resets = [

                item

                for item in resets

                if item is not reset

            ]


            save_admin_password_resets(
                resets
            )


            return jsonify({

                "success": False,

                "message":
                    "Your password reset session has expired. "
                    "Please request a new code."

            }), 400


        # ====================================================
        # HASH NEW ADMIN PASSWORD
        # ====================================================

        new_password_hash = generate_password_hash(
            new_password
        )


        # ====================================================
        # SAVE NEW PASSWORD
        # ====================================================

        save_admin_password_hash(
            new_password_hash
        )


        # ====================================================
        # DELETE USED RESET SESSION
        # ====================================================

        resets = [

            item

            for item in resets

            if item is not reset

        ]


        save_admin_password_resets(
            resets
        )


        # ====================================================
        # SUCCESS
        # ====================================================

        print(
            "ADMIN PASSWORD RESET SUCCESSFUL."
        )


        return jsonify({

            "success": True,

            "message":
                "Your admin password has been reset successfully."

        }), 200


    except Exception as error:

        print(
            "ADMIN RESET PASSWORD ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to reset the admin password."

        }), 500

# ============================================================
# FLUTTERWAVE API CONNECTION TEST
# ============================================================

@app.route(
    "/payments/flutterwave-api-test",
    methods=["GET"]
)
def flutterwave_api_test():

    try:

        if not FLW_SECRET_KEY:

            return jsonify({

                "success": False,

                "message":
                    "Flutterwave secret key is not configured."

            }), 500


        headers = {

            "Authorization":
                f"Bearer {FLW_SECRET_KEY}",

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"

        }


        response = requests.get(

            f"{FLW_API_URL}/customers",

            headers=headers,

            params={
                "page": 1,
                "size": 10
            },

            timeout=30

        )


        try:

            flutterwave_data = (
                response.json()
            )

        except Exception:

            flutterwave_data = {

                "message":
                    response.text

            }


        print(
            "FLUTTERWAVE API TEST:",
            response.status_code
        )


        if response.status_code >= 400:

            return jsonify({

                "success": False,

                "statusCode":
                    response.status_code,

                "message":
                    flutterwave_data.get(
                        "message",
                        "Flutterwave API request failed."
                    )

            }), response.status_code


        return jsonify({

            "success": True,

            "message":
                "EventWaa successfully connected to Flutterwave.",

            "flutterwaveStatus":
                flutterwave_data.get(
                    "status"
                )

        }), 200


    except Exception as e:

        print(
            "FLUTTERWAVE API TEST ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to connect to Flutterwave."

        }), 500


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

# ============================================================
# UPLOAD USER / HOST PROFILE PHOTO
# ============================================================

@app.route("/users/<int:user_id>/upload-image", methods=["POST"])
def upload_user_image(user_id):

    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "No image uploaded"
        }), 400

    image = request.files["image"]

    if image.filename == "":
        return jsonify({
            "success": False,
            "message": "No image selected"
        }), 400

    upload_folder = "uploads/hosts"
    os.makedirs(upload_folder, exist_ok=True)

    filename = (
        f"host_{user_id}_{int(time.time())}_"
        f"{secure_filename(image.filename)}"
    )

    filepath = os.path.join(upload_folder, filename)
    image.save(filepath)

    image_url = (
        f"{request.host_url}uploads/hosts/{filename}"
    )

    users = load_json_file("users.json", [])

    for user in users:
        if int(user.get("id", 0)) == user_id:
            user["image"] = image_url
            save_json_file("users.json", users)

            safe_user = user.copy()
            safe_user.pop("password", None)

            return jsonify({
                "success": True,
                "image": image_url,
                "user": safe_user
            })

    return jsonify({
        "success": False,
        "message": "User not found"
    }), 404

@app.route("/users/<int:user_id>/profile-photo", methods=["POST"])
def upload_profile_photo(user_id):

    if "photo" not in request.files:
        return jsonify({
            "success": False,
            "message": "No profile photo uploaded"
        }), 400

    photo = request.files["photo"]

    if photo.filename == "":
        return jsonify({
            "success": False,
            "message": "No photo selected"
        }), 400

    users = load_json_file(
        "users.json",
        []
    )

    user = None

    for item in users:

        if int(item.get("id", 0)) == user_id:
            user = item
            break

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    # --------------------------------------------------------
    # CREATE PROFILE UPLOAD FOLDER
    # --------------------------------------------------------

    upload_folder = "uploads/profiles"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    # --------------------------------------------------------
    # DELETE OLD PROFILE PHOTO
    # --------------------------------------------------------

    old_photo = user.get("profilePhoto")

    if old_photo and "/uploads/profiles/" in old_photo:

        old_filename = old_photo.split(
            "/uploads/profiles/"
        )[-1]

        old_path = os.path.join(
            upload_folder,
            old_filename
        )

        if os.path.exists(old_path):
            os.remove(old_path)

    # --------------------------------------------------------
    # CREATE NEW FILE NAME
    # --------------------------------------------------------

    filename = (
        f"profile_{user_id}_"
        f"{int(time.time())}_"
        f"{secure_filename(photo.filename)}"
    )

    filepath = os.path.join(
        upload_folder,
        filename
    )

    photo.save(filepath)

    # --------------------------------------------------------
    # CREATE PUBLIC URL
    # --------------------------------------------------------

    photo_url = (
        f"{request.host_url}"
        f"uploads/profiles/{filename}"
    )

    # --------------------------------------------------------
    # SAVE PROFILE PHOTO TO USER
    # --------------------------------------------------------

    user["profilePhoto"] = photo_url

    save_json_file(
        "users.json",
        users
    )

    # --------------------------------------------------------
    # NEVER RETURN PASSWORD
    # --------------------------------------------------------

    safe_user = user.copy()

    safe_user.pop(
        "password",
        None
    )

    return jsonify({
        "success": True,
        "message": "Profile photo uploaded successfully",
        "user": safe_user
    })

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

# ============================================================
# SEND EVENTWAA BOOKING CONFIRMATION EMAIL
#
# Supports:
#
# - One booking confirmation
# - Multiple tickets
# - One QR code per ticket
# - One email containing all tickets
#
# Expected booking structure:
#
# {
#     "buyer": {...},
#     "eventTitle": "...",
#     "ticketType": "...",
#     "quantity": 5,
#     "customerTotal": 50000,
#     "tickets": [
#         {
#             "ticketId": "EW-...",
#         },
#         ...
#     ]
# }
# ============================================================

def send_ticket_email(booking):

    try:

        # ====================================================
        # BUYER INFORMATION
        # ====================================================

        buyer = (
            booking.get("buyer", {})
            or {}
        )

        buyer_name = str(
            buyer.get(
                "name",
                "Guest"
            )
        ).strip()

        buyer_email = str(
            buyer.get(
                "email",
                ""
            )
        ).strip()


        if not buyer_email:

            print(
                "TICKET EMAIL ERROR: Buyer email is missing."
            )

            return {
                "success": False,
                "message":
                    "Buyer email is missing."
            }


        # ====================================================
        # BOOKING INFORMATION
        # ====================================================

        event_title = (
            booking.get(
                "eventTitle"
            )
            or
            "EventWaa Event"
        )


        ticket_type = (
            booking.get(
                "ticketType"
            )
            or
            "Regular"
        )


        quantity = int(
            booking.get(
                "quantity",
                1
            )
            or 1
        )


        amount_paid = int(
            booking.get(
                "customerTotal",
                booking.get(
                    "totalPrice",
                    0
                )
            )
            or 0
        )


        # ====================================================
        # EVENT INFORMATION
        # ====================================================

        event_date = (
            booking.get(
                "eventDate",
                ""
            )
            or ""
        )


        event_time = (
            booking.get(
                "eventTime",
                ""
            )
            or ""
        )


        event_venue = (
            booking.get(
                "eventVenue",
                ""
            )
            or ""
        )


        event_city = (
            booking.get(
                "eventCity",
                ""
            )
            or ""
        )


        # ====================================================
        # TICKETS
        #
        # The new preferred structure is:
        #
        # "tickets": [
        #     {"ticketId": "..."},
        #     {"ticketId": "..."}
        # ]
        #
        # This fallback also supports old single-ticket bookings.
        # ====================================================

        tickets = (
            booking.get(
                "tickets",
                []
            )
            or []
        )


        # ----------------------------------------------------
        # BACKWARD COMPATIBILITY
        #
        # If this is an old booking with only one ticketId,
        # convert it into a tickets list.
        # ----------------------------------------------------

        if not tickets:

            old_ticket_id = str(
                booking.get(
                    "ticketId",
                    ""
                )
            ).strip()


            if old_ticket_id:

                tickets = [
                    {
                        "ticketId":
                            old_ticket_id
                    }
                ]


        # ----------------------------------------------------
        # SAFETY CHECK
        # ----------------------------------------------------

        if not tickets:

            print(
                "TICKET EMAIL ERROR: No tickets found."
            )

            return {
                "success": False,
                "message":
                    "No tickets found."
            }


        # ====================================================
        # FRONTEND URL
        # ====================================================

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173"
        ).rstrip("/")


        # ====================================================
        # FORMAT AMOUNT
        # ====================================================

        formatted_amount = (
            f"UGX {amount_paid:,}"
        )


        # ====================================================
        # EVENT DATE HTML
        # ====================================================

        date_html = ""

        if event_date:

            date_html = f"""
            <div class="detail">

                <span class="detail-label">
                    DATE
                </span>

                <span class="detail-value">
                    {event_date}
                </span>

            </div>
            """


        # ====================================================
        # EVENT TIME HTML
        # ====================================================

        time_html = ""

        if event_time:

            time_html = f"""
            <div class="detail">

                <span class="detail-label">
                    TIME
                </span>

                <span class="detail-value">
                    {event_time}
                </span>

            </div>
            """


        # ====================================================
        # EVENT LOCATION HTML
        # ====================================================

        location_html = ""

        if event_venue:

            location_text = (
                event_venue
            )


            if event_city:

                location_text += (
                    f", {event_city}"
                )


            location_html = f"""
            <div class="detail">

                <span class="detail-label">
                    VENUE
                </span>

                <span class="detail-value">
                    {location_text}
                </span>

            </div>
            """


        # ====================================================
        # GENERATE ALL TICKET QR CODES
        # ====================================================

        tickets_html = ""

        attachments = []


        for index, ticket in enumerate(
            tickets,
            start=1
        ):

            # ------------------------------------------------
            # TICKET ID
            # ------------------------------------------------

            ticket_id = str(
                ticket.get(
                    "ticketId",
                    ""
                )
            ).strip()


            if not ticket_id:

                continue


            # ------------------------------------------------
            # TICKET URL
            # ------------------------------------------------

            ticket_url = (
                f"{frontend_url}"
                f"/ticket/{ticket_id}"
            )


            # ------------------------------------------------
            # QR CODE
            # ------------------------------------------------

            qr = qrcode.QRCode(

                version=1,

                error_correction=
                    qrcode.constants.ERROR_CORRECT_H,

                box_size=10,

                border=4

            )


            qr.add_data(
                ticket_id
            )


            qr.make(
                fit=True
            )


            qr_image = qr.make_image(

                fill_color="black",

                back_color="white"

            )


            qr_buffer = BytesIO()


            qr_image.save(

                qr_buffer,

                format="PNG"

            )


            qr_buffer.seek(0)


            qr_bytes = (
                qr_buffer.getvalue()
            )


            # ------------------------------------------------
            # UNIQUE CONTENT ID
            #
            # Each QR image must have its own CID.
            # ------------------------------------------------

            qr_cid = (
                f"eventwaa-ticket-qr-{index}"
            )


            # ------------------------------------------------
            # STORE ATTACHMENT
            # ------------------------------------------------

            attachments.append(

                {
                    "filename":
                        f"eventwaa-ticket-{index}.png",

                    "qr_bytes":
                        qr_bytes,

                    "cid":
                        qr_cid
                }

            )


            # ------------------------------------------------
            # TICKET HTML
            # ------------------------------------------------

            tickets_html += f"""

            <div class="ticket-box">

                <div class="ticket-number">

                    TICKET {index} OF {len(tickets)}

                </div>


                <img
                    src="cid:{qr_cid}"
                    class="qr"
                    alt="EventWaa Ticket QR Code"
                />


                <div class="ticket-id-label">

                    TICKET ID

                </div>


                <div class="ticket-id">

                    {ticket_id}

                </div>


                <a
                    href="{ticket_url}"
                    class="button"
                >

                    View Ticket

                </a>

            </div>

            """


        # ====================================================
        # HTML EMAIL
        # ====================================================

        html_body = f"""

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    EventWaa Booking Confirmation
</title>


<style>

body {{
    margin: 0;
    padding: 0;

    background: #f4f6f8;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #172033;
}}


.wrapper {{
    width: 100%;

    padding: 35px 15px;

    box-sizing: border-box;
}}


.card {{
    max-width: 620px;

    margin: auto;

    background: #ffffff;

    border-radius: 18px;

    overflow: hidden;

    box-shadow:
        0 8px 30px
        rgba(0, 0, 0, 0.08);
}}


.header {{
    background: #111827;

    color: #ffffff;

    text-align: center;

    padding: 30px 20px;
}}


.logo {{
    font-size: 30px;

    font-weight: 800;
}}


.tagline {{
    margin-top: 7px;

    font-size: 13px;

    opacity: 0.75;
}}


.content {{
    padding: 35px 30px;
}}


.success {{
    text-align: center;

    margin-bottom: 30px;
}}


.success-icon {{
    width: 58px;

    height: 58px;

    line-height: 58px;

    margin: auto;

    border-radius: 50%;

    background: #e9f8ef;

    color: #16a34a;

    font-size: 30px;

    font-weight: bold;
}}


.success h1 {{
    margin:
        15px 0 8px;

    font-size: 26px;
}}


.success p {{
    margin: 0;

    color: #667085;

    font-size: 15px;
}}


.event-box {{
    background: #f8fafc;

    border-radius: 14px;

    padding: 22px;

    margin-bottom: 25px;
}}


.event-title {{
    margin:
        0 0 18px;

    font-size: 21px;

    font-weight: 700;
}}


.detail {{
    padding: 11px 0;

    border-bottom:
        1px solid #e5e7eb;
}}


.detail:last-child {{
    border-bottom: none;
}}


.detail-label {{
    display: block;

    font-size: 11px;

    color: #667085;

    letter-spacing: 0.5px;

    margin-bottom: 4px;
}}


.detail-value {{
    font-size: 15px;

    font-weight: 600;
}}


.ticket-box {{
    text-align: center;

    border:
        1px dashed #d0d5dd;

    border-radius: 14px;

    padding: 25px 20px;

    margin-top: 20px;
}}


.ticket-number {{
    margin-bottom: 15px;

    font-size: 12px;

    font-weight: 800;

    color: #667085;

    letter-spacing: 1px;
}}


.qr {{
    display: block;

    width: 220px;

    max-width: 100%;

    height: auto;

    margin:
        0 auto 18px;
}}


.ticket-id-label {{
    color: #667085;

    font-size: 11px;

    margin-bottom: 5px;
}}


.ticket-id {{
    font-family: monospace;

    font-size: 14px;

    font-weight: 700;

    word-break: break-all;
}}


.button {{
    display: inline-block;

    margin-top: 20px;

    padding:
        14px 24px;

    border-radius: 10px;

    background: #111827;

    color: #ffffff !important;

    text-decoration: none;

    font-weight: 700;

    font-size: 14px;
}}


.note {{
    margin-top: 25px;

    color: #667085;

    font-size: 13px;

    line-height: 1.6;
}}


.footer {{
    padding: 22px 20px;

    background: #f8fafc;

    text-align: center;

    color: #667085;

    font-size: 12px;
}}


.footer strong {{
    color: #172033;
}}

</style>

</head>


<body>

<div class="wrapper">

<div class="card">


    <!-- HEADER -->

    <div class="header">

        <div class="logo">

            EventWaa

        </div>


        <div class="tagline">

            Discover. Book. Experience.

        </div>

    </div>


    <!-- CONTENT -->

    <div class="content">


        <!-- SUCCESS -->

        <div class="success">

            <div class="success-icon">

                ✓

            </div>


            <h1>

                Booking Confirmed!

            </h1>


            <p>

                Hi {buyer_name},

                your {len(tickets)}
                EventWaa ticket{"s" if len(tickets) != 1 else ""}
                {"are" if len(tickets) != 1 else "is"}
                ready.

            </p>

        </div>


        <!-- EVENT DETAILS -->

        <div class="event-box">

            <div class="event-title">

                {event_title}

            </div>


            <div class="detail">

                <span class="detail-label">

                    TICKET TYPE

                </span>


                <span class="detail-value">

                    {ticket_type}

                </span>

            </div>


            <div class="detail">

                <span class="detail-label">

                    QUANTITY

                </span>


                <span class="detail-value">

                    {len(tickets)}

                </span>

            </div>


            <div class="detail">

                <span class="detail-label">

                    AMOUNT PAID

                </span>


                <span class="detail-value">

                    {formatted_amount}

                </span>

            </div>


            {date_html}

            {time_html}

            {location_html}

        </div>


        <!-- ALL TICKETS -->

        {tickets_html}


        <!-- NOTE -->

        <p class="note">

            Please keep this email safe.

            Each QR code represents one entry.

            Present the correct QR code for each
            person entering the event.

            You can also access your tickets
            from your EventWaa account.

        </p>


    </div>


    <!-- FOOTER -->

    <div class="footer">

        <strong>

            EventWaa

        </strong>

        <br>

        Discover. Book. Experience.

    </div>


</div>

</div>

</body>

</html>

"""


        # ====================================================
        # CREATE EMAIL MESSAGE
        # ====================================================

        message = Message(

            subject=(
                f"Your EventWaa Booking — "
                f"{event_title}"
            ),

            recipients=[
                buyer_email
            ]

        )


        # ====================================================
        # PLAIN TEXT EMAIL
        # ====================================================

        ticket_list_text = ""


        for index, ticket in enumerate(
            tickets,
            start=1
        ):

            ticket_id = str(
                ticket.get(
                    "ticketId",
                    ""
                )
            ).strip()


            if ticket_id:

                ticket_url = (
                    f"{frontend_url}"
                    f"/ticket/{ticket_id}"
                )


                ticket_list_text += f"""

TICKET {index}
Ticket ID: {ticket_id}
View Ticket: {ticket_url}

"""


        message.body = f"""

Hi {buyer_name},

Your EventWaa booking has been confirmed!

EVENT
{event_title}

TICKET TYPE
{ticket_type}

QUANTITY
{len(tickets)}

AMOUNT PAID
{formatted_amount}

YOUR TICKETS

{ticket_list_text}

Please present the correct QR code
for each person entering the event.

Thank you for using EventWaa.

Discover. Book. Experience.

"""


        # ====================================================
        # HTML EMAIL
        # ====================================================

        message.html = (
            html_body
        )


        # ====================================================
        # ATTACH ALL QR CODES
        # ====================================================

        for attachment in attachments:

            message.attach(

                attachment[
                    "filename"
                ],

                "image/png",

                attachment[
                    "qr_bytes"
                ],

                headers=[

                    (
                        "Content-ID",

                        f"<{attachment['cid']}>"

                    ),

                    (
                        "Content-Disposition",

                        "inline"

                    )

                ]

            )


        # ====================================================
        # SEND EMAIL
        # ====================================================

        mail.send(
            message
        )


        print(

            "EVENTWAA BOOKING EMAIL SENT:",

            buyer_email

        )


        return {

            "success": True,

            "message":
                "Booking confirmation email sent successfully."

        }


    except Exception as e:

        print(

            "EVENTWAA TICKET EMAIL ERROR:",

            str(e)

        )


        return {

            "success": False,

            "message":
                str(e)

        }

# ============================================================
# VERIFY FLUTTERWAVE PAYMENT
# ============================================================

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
#
# IMPORTANT:
#
# Flutterwave verification happens here.
#
# Once Flutterwave confirms the payment, the payment is sent
# to the SAME EventWaa fulfillment engine used by PesaPal.
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
    #
    # IMPORTANT:
    # If this payment was already processed, return the
    # original booking as well.
    #
    # This prevents PaymentSuccess.jsx from receiving only
    # bookingId without the actual booking object.
    # ========================================================
    if payment.get(
        "processed",
        False
    ):
        booking = None
        booking_id = payment.get(
            "bookingId"
        )
        if booking_id is not None:
            bookings = load_json_file(
                "bookings.json",
                []
            )
            for existing_booking in bookings:
                if str(
                    existing_booking.get(
                        "id",
                        ""
                    )
                ) == str(
                    booking_id
                ):
                    booking = (
                        existing_booking
                    )
                    break
        return {
            "success": True,
            "message": (
                "Payment has already been "
                "processed."
            ),
            "alreadyProcessed": True,
            "bookingId": booking_id,
            "booking": booking,
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
            booking = None
            booking_id = (
                existing_payment.get(
                    "bookingId"
                )
            )
            if booking_id is not None:
                bookings = load_json_file(
                    "bookings.json",
                    []
                )
                for existing_booking in bookings:
                    if str(
                        existing_booking.get(
                            "id",
                            ""
                        )
                    ) == str(
                        booking_id
                    ):
                        booking = (
                            existing_booking
                        )
                        break
            return {
                "success": True,
                "message": (
                    "This Flutterwave transaction "
                    "has already been processed."
                ),
                "alreadyProcessed": True,
                "bookingId": booking_id,
                "booking": booking,
                "payment": existing_payment
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
        try:
            verification_data = (
                verification_response.json()
            )
        except Exception:
            verification_data = {}
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
        payment["provider"] = (
            payment.get(
                "provider",
                "flutterwave"
            )
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
    try:
        paid_amount = int(
            float(
                flutterwave_payment.get(
                    "amount",
                    0
                )
                or 0
            )
        )
    except (
        TypeError,
        ValueError
    ):
        paid_amount = 0
    if paid_amount != expected_amount:
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
    # SEND VERIFIED PAYMENT TO COMMON EVENTWAA PROCESSOR
    # ========================================================
    payment["provider"] = "flutterwave"
    result, status_code = (
        complete_verified_eventwaa_payment(
            payment=payment,
            payments=payments,
            transaction_id=transaction_id,
            provider="flutterwave",
            paid_amount=paid_amount
        )
    )
    return result, status_code


# ============================================================
# COMMON EVENTWAA PAYMENT FULFILLMENT
#
# THIS FUNCTION IS SHARED BY:
#
# Flutterwave
# PesaPal
#
# It is responsible for:
#
# - duplicate protection
# - booking creation
# - individual ticket generation
# - inventory
# - event revenue
# - host wallet
# - EventWaa wallet
# - payment completion
# - saving JSON files
#
# PROVIDER-SPECIFIC VERIFICATION MUST HAPPEN BEFORE THIS
# FUNCTION IS CALLED.
# ============================================================

def complete_verified_eventwaa_payment(
    payment,
    payments,
    transaction_id,
    provider,
    paid_amount
):

    now = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    provider = str(
        provider
        or
        ""
    ).strip().lower()

    # ========================================================
    # BASIC PROVIDER VALIDATION
    # ========================================================

    if provider not in (
        "flutterwave",
        "pesapal"
    ):

        return {
            "success": False,
            "message":
                "Unsupported payment provider."
        }, 400

    # ========================================================
    # FIND PAYMENT AGAIN
    #
    # Important because this function can be called from:
    #
    # - Flutterwave verification
    # - PesaPal callback
    # - PesaPal IPN
    #
    # We always work against the payment stored in JSON.
    # ========================================================

    tx_ref = str(
        payment.get(
            "txRef",
            ""
        )
    )

    stored_payment = find_payment_by_tx_ref(
        payments,
        tx_ref
    )

    if not stored_payment:

        return {
            "success": False,
            "message":
                "Payment record no longer exists.",
            "code":
                "PAYMENT_NOT_FOUND"
        }, 404

    payment = stored_payment

    # ========================================================
    # FINAL DOUBLE-PAYMENT PROTECTION
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
            "bookingId":
                payment.get(
                    "bookingId"
                ),
            "payment":
                payment
        }, 200

    # ========================================================
    # PROVIDER TRANSACTION ID
    #
    # For Flutterwave this is the Flutterwave transaction ID.
    #
    # For PesaPal this will be the PesaPal
    # order tracking ID.
    # ========================================================

    transaction_id = str(
        transaction_id
    ).strip()

    # ========================================================
    # CHECK TRANSACTION ID AGAINST PAYMENTS
    # ========================================================

    existing_payment = (
        find_payment_by_transaction_id(
            payments,
            transaction_id
        )
    )

    if existing_payment:

        if (
            str(
                existing_payment.get(
                    "txRef",
                    ""
                )
            )
            ==
            str(
                payment.get(
                    "txRef",
                    ""
                )
            )
            and
            existing_payment.get(
                "processed",
                False
            )
        ):

            return {
                "success": True,
                "message": (
                    "This payment has already "
                    "been processed."
                ),
                "alreadyProcessed": True,
                "bookingId":
                    existing_payment.get(
                        "bookingId"
                    ),
                "payment":
                    existing_payment
            }, 200

        # A transaction ID belonging to a different
        # EventWaa payment is suspicious and must not
        # be reused.

        if str(
            existing_payment.get(
                "txRef",
                ""
            )
        ) != str(
            payment.get(
                "txRef",
                ""
            )
        ):

            return {
                "success": False,
                "message": (
                    "Payment transaction ID "
                    "is already associated with "
                    "another EventWaa payment."
                ),
                "code":
                    "TRANSACTION_ALREADY_USED"
            }, 409

    # ========================================================
    # LOAD EVENT
    # ========================================================

    events = load_json_file(
        "events.json",
        []
    )

    if not isinstance(
        events,
        list
    ):

        events = []

    event = None

    for current_event in events:

        if not isinstance(
            current_event,
            dict
        ):

            continue

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
    # BLOCK PAYMENT FULFILLMENT FOR CANCELLED EVENTS
    #
    # IMPORTANT:
    #
    # A customer may have started payment while the event
    # was active. The host can then cancel the event before
    # the payment is verified.
    #
    # Never create a booking or ticket for that cancelled
    # event.
    # ========================================================

    if str(
        event.get(
            "status",
            ""
        )
    ).strip().lower() == "cancelled":

        payment["status"] = (
            "event_cancelled"
        )

        payment["eventCancelled"] = True

        payment["eventCancelledAt"] = (
            now
        )

        payment["bookingCreated"] = False

        save_payments(
            payments
        )

        return {

            "success": False,

            "message": (
                "This event has been cancelled. "
                "The payment cannot be converted "
                "into a booking."
            ),

            "code":
                "EVENT_CANCELLED",

            "eventCancelled":
                True,

            "bookingCreated":
                False,

            "paymentNeedsRefund":
                True,

            "transactionId":
                transaction_id,

            "txRef":
                payment.get(
                    "txRef"
                ),

            "provider":
                provider,

            "amount":
                paid_amount

        }, 409

    # ========================================================
    # LOAD BOOKINGS
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    if not isinstance(
        bookings,
        list
    ):

        bookings = []

    # ========================================================
    # EXTRA DUPLICATE PROTECTION
    #
    # Check whether this provider transaction is already
    # attached to a booking.
    # ========================================================

    for existing_booking in bookings:

        existing_transaction_id = str(
            existing_booking.get(
                "transactionId",
                ""
            )
        )

        if existing_transaction_id == transaction_id:

            payment["processed"] = True

            payment["bookingId"] = (
                existing_booking.get(
                    "id"
                )
            )

            payment["processedAt"] = (
                now
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

    if quantity < 1:

        return {
            "success": False,
            "message":
                "Invalid ticket quantity."
        }, 400

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
    # CHECK VERIFIED AMOUNT
    # ========================================================

    expected_amount = int(
        payment.get(
            "amount",
            0
        )
        or 0
    )

    try:

        paid_amount = int(
            float(
                paid_amount
                or 0
            )
        )

    except (
        TypeError,
        ValueError
    ):

        paid_amount = 0

    if paid_amount != expected_amount:

        return {
            "success": False,
            "message": (
                "Verified payment amount does "
                "not match the EventWaa payment."
            ),
            "expectedAmount":
                expected_amount,
            "paidAmount":
                paid_amount
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
    # CREATE INDIVIDUAL TICKETS
    #
    # ONE PAYMENT
    #       ↓
    # ONE BOOKING
    #       ↓
    # QUANTITY INDIVIDUAL TICKETS
    #
    # ONE INDIVIDUAL TICKET = ONE ENTRY
    # ========================================================

    tickets = []

    ticket_timestamp = int(
        datetime.now().timestamp() * 1000
    )

    for ticket_number in range(
        1,
        quantity + 1
    ):

        ticket_id = (
            f"EW-"
            f"{ticket_timestamp}"
            f"-"
            f"{next_booking_id}"
            f"-"
            f"{ticket_number}"
        )

        individual_ticket = {

            "ticketId":
                ticket_id,

            "ticketNumber":
                ticket_number,

            "ticketType":
                ticket_type,

            "checkedIn":
                False,

            "checkedInAt":
                None,

            # ONE TICKET = ONE ENTRY
            "checkInCount":
                0,

            "checkInLimit":
                1,

            "checkInHistory":
                [],

            "refundStatus":
                None,

            "createdAt":
                now

        }

        tickets.append(
            individual_ticket
        )

    # ========================================================
    # CREATE BOOKING
    # ========================================================

    booking = {

        "id":
            next_booking_id,

        # ====================================================
        # EVENT INFORMATION
        # ====================================================

        "eventId":
            event.get(
                "id"
            ),

        "eventTitle":
            event.get(
                "title",
                ""
            ),

        "eventDate":
            event.get(
                "date",
                ""
            ),

        "eventTime":
            (
                f"{event.get('startTime', '')}"
                f" - "
                f"{event.get('endTime', '')}"
            ).strip(" -"),

        "eventVenue":
            event.get(
                "venue",
                ""
            ),

        "eventCity":
            event.get(
                "city",
                ""
            ),

        # ====================================================
        # BUYER
        # ====================================================

        "buyer":
            payment.get(
                "buyer",
                {}
            ),

        # ====================================================
        # PURCHASE DETAILS
        # ====================================================

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

        # ====================================================
        # PAYMENT INFORMATION
        # ====================================================

        "transactionId":
            transaction_id,

        "txRef":
            payment.get(
                "txRef"
            ),

        "paymentProvider":
            provider,

        # ====================================================
        # INDIVIDUAL TICKETS
        # ====================================================

        "tickets":
            tickets,

        # ====================================================
        # REFUND STATUS
        # ====================================================

        "refundStatus":
            None,

        # ====================================================
        # EMAIL STATUS
        # ====================================================

        "emailSent":
            False,

        "emailSentAt":
            None,

        "emailError":
            None,

        # ====================================================
        # CREATED TIME
        # ====================================================

        "createdAt":
            now
    }

    # ========================================================
    # ADD BOOKING
    # ========================================================

    bookings.append(
        booking
    )

    # ========================================================
    # CALCULATE TICKET SUBTOTAL
    # ========================================================

    ticket_subtotal = int(
        payment.get(
            "subtotal",
            0
        )
        or 0
    )

    if ticket_subtotal <= 0:

        return {
            "success": False,
            "message":
                "Invalid ticket subtotal."
        }, 400

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

    event["revenue"] = (
        int(
            event.get(
                "revenue",
                0
            )
            or 0
        )
        +
        ticket_subtotal
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
    # EVENTWAA ADMIN WALLET
    # ========================================================

    admin_wallet = load_wallet()

    service_fee_amount = int(
        payment.get(
            "serviceFee",
            0
        )
        or 0
    )

    # EventWaa keeps:
    #
    # commission + service fee

    eventwaa_earning = (
        commission
        +
        service_fee_amount
    )

    # ========================================================
    # UPDATE EVENTWAA AVAILABLE BALANCE
    # ========================================================

    admin_wallet["availableBalance"] = (

        int(
            admin_wallet.get(
                "availableBalance",
                0
            )
            or 0
        )
        +
        eventwaa_earning
    )

    # ========================================================
    # TOTAL COMMISSION
    # ========================================================

    admin_wallet["totalCommission"] = (

        int(
            admin_wallet.get(
                "totalCommission",
                0
            )
            or 0
        )
        +
        commission
    )

    # ========================================================
    # TOTAL SERVICE FEES
    # ========================================================

    admin_wallet["totalServiceFees"] = (

        int(
            admin_wallet.get(
                "totalServiceFees",
                0
            )
            or 0
        )
        +
        service_fee_amount
    )

    # ========================================================
    # TOTAL EVENTWAA REVENUE
    # ========================================================

    admin_wallet["totalRevenue"] = (

        int(
            admin_wallet.get(
                "totalRevenue",
                0
            )
            or 0
        )
        +
        eventwaa_earning
    )

    # ========================================================
    # EVENTWAA TRANSACTION HISTORY
    # ========================================================

    admin_wallet.setdefault(
        "transactions",
        []
    )

    admin_wallet["transactions"].insert(

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

            "transactionId":
                transaction_id,

            "txRef":
                payment.get(
                    "txRef"
                ),

            "paymentProvider":
                provider,

            "ticketSubtotal":
                ticket_subtotal,

            "commission":
                commission,

            "commissionPercent":
                commission_percent,

            "serviceFee":
                service_fee_amount,

            "amount":
                eventwaa_earning,

            "customerPaid":
                int(
                    payment.get(
                        "amount",
                        0
                    )
                    or 0
                ),

            "date":
                now

        }
    )

    save_wallet(
        admin_wallet
    )

    # ========================================================
    # ADD HOST AVAILABLE BALANCE
    # ========================================================

    host_wallet["availableBalance"] = (

        int(
            host_wallet.get(
                "availableBalance",
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

    # ========================================================
    # SAVE HOST WALLET
    # ========================================================

    save_host_wallets(
        wallets
    )

    # ========================================================
    # MARK PAYMENT PROCESSED
    # ========================================================

    payment["processed"] = True

    payment["bookingId"] = (
        next_booking_id
    )

    payment["processedAt"] = (
        now
    )

    payment["status"] = (
        "successful"
    )

    payment["transactionId"] = (
        transaction_id
    )

    payment["paidAmount"] = (
        paid_amount
    )

    payment["provider"] = (
        provider
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

    save_host_wallets(
        wallets
    )

    save_payments(
        payments
    )

    # ========================================================
    # FINAL SUCCESS RESPONSE
    # ========================================================

    return {

        "success":
            True,

        "message":
            "Payment verified and booking created successfully.",

        "alreadyProcessed":
            False,

        "bookingId":
            next_booking_id,

        "transactionId":
            transaction_id,

        "txRef":
            payment.get(
                "txRef"
            ),

        "provider":
            provider,

        "amount":
            paid_amount,

        "currency":
            payment.get(
                "currency",
                "UGX"
            ),

        "booking":
            booking

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
# EVENTWAA ADMIN WALLET
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

        # Upgrade older wallet files safely.

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
            "totalServiceFees",
            0
        )

        wallet.setdefault(
            "totalRevenue",
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

        wallet.setdefault(
            "transactions",
            []
        )

        save_wallet(wallet)

        return wallet


    # ========================================================
    # CREATE NEW EVENTWAA WALLET
    # ========================================================

    wallet = {

        "availableBalance": 0,

        "pendingPayouts": 0,

        "totalCommission": 0,

        "totalServiceFees": 0,

        "totalRevenue": 0,

        "totalWithdrawn": 0,

        "withdrawals": [],

        "transactions": []

    }

    save_wallet(wallet)

    return wallet


# ============================================================
# FLUTTERWAVE WEBHOOK
# ============================================================
@app.route(
    "/flutterwave/webhook",
    methods=["POST"]
)
def flutterwave_webhook():
    try:
        # ====================================================
        # CHECK SECRET HASH
        #
        # Flutterwave sends the configured webhook secret
        # in the "verif-hash" request header.
        # ====================================================
        if not FLW_SECRET_HASH:
            print(
                "FLUTTERWAVE WEBHOOK ERROR: "
                "Secret hash is not configured."
            )
            return jsonify({
                "success": False,
                "message": (
                    "Webhook secret hash "
                    "is not configured."
                )
            }), 500
        received_hash = request.headers.get(
            "verif-hash",
            ""
        ).strip()
        if not received_hash:
            print(
                "FLUTTERWAVE WEBHOOK REJECTED: "
                "Missing verif-hash."
            )
            return jsonify({
                "success": False,
                "message": "Unauthorized."
            }), 401
        if received_hash != FLW_SECRET_HASH:
            print(
                "FLUTTERWAVE WEBHOOK REJECTED: "
                "Invalid secret hash."
            )
            return jsonify({
                "success": False,
                "message": "Unauthorized."
            }), 401
        # ====================================================
        # READ WEBHOOK PAYLOAD
        # ====================================================
        data = request.get_json(
            silent=True
        ) or {}
        print(
            "FLUTTERWAVE WEBHOOK RECEIVED:",
            data
        )
        # ====================================================
        # GET EVENT INFORMATION
        # ====================================================
        webhook_type = data.get(
            "type",
            ""
        )
        webhook_id = data.get(
            "id"
        )
        transaction_data = data.get(
            "data"
        ) or {}
        # ====================================================
        # GET TRANSACTION ID
        # ====================================================
        transaction_id = (
            transaction_data.get(
                "id"
            )
        )
        # ====================================================
        # LOG BASIC WEBHOOK INFORMATION
        # ====================================================
        print(
            "FLUTTERWAVE WEBHOOK:",
            {
                "webhookId": webhook_id,
                "type": webhook_type,
                "transactionId": transaction_id
            }
        )
        # ====================================================
        # NOTHING TO PROCESS
        # ====================================================
        if not transaction_id:
            print(
                "FLUTTERWAVE WEBHOOK: "
                "No transaction ID found."
            )
            # We still acknowledge the webhook.
            # Flutterwave expects a 200 response when
            # the notification has been received.
            return jsonify({
                "success": True,
                "message": (
                    "Webhook received."
                )
            }), 200
        # ====================================================
        # FIND EVENT TYPE
        # ====================================================
        # We are primarily interested in completed
        # payment notifications.
        #
        # Do NOT create the booking directly from the
        # webhook payload.
        #
        # Our existing verification function already:
        #
        # 1. Verifies the transaction with Flutterwave
        # 2. Checks status
        # 3. Checks tx_ref
        # 4. Checks currency
        # 5. Checks amount
        # 6. Prevents duplicate processing
        # 7. Creates the booking
        #
        # ====================================================
        if webhook_type not in [
            "charge.completed",
            "charge.completed.v3"
        ]:
            print(
                "FLUTTERWAVE WEBHOOK: "
                "Event type does not require "
                "payment processing:",
                webhook_type
            )
            return jsonify({
                "success": True,
                "message": (
                    "Webhook received."
                )
            }), 200
        # ====================================================
        # FIND PAYMENT RECORD
        # ====================================================
        payments = load_payments()
        existing_payment = (
            find_payment_by_transaction_id(
                payments,
                transaction_id
            )
        )
        # ====================================================
        # ALREADY PROCESSED
        # ====================================================
        if existing_payment:
            if existing_payment.get(
                "processed",
                False
            ):
                print(
                    "FLUTTERWAVE WEBHOOK: "
                    "Transaction already processed:",
                    transaction_id
                )
                return jsonify({
                    "success": True,
                    "message": (
                        "Transaction already "
                        "processed."
                    ),
                    "alreadyProcessed": True
                }), 200
        # ====================================================
        # FIND PAYMENT USING TX REF
        # ====================================================
        webhook_tx_ref = str(
            transaction_data.get(
                "tx_ref",
                ""
            )
        ).strip()
        if not existing_payment and webhook_tx_ref:
            existing_payment = (
                find_payment_by_tx_ref(
                    payments,
                    webhook_tx_ref
                )
            )
        # ====================================================
        # PAYMENT NOT FOUND
        # ====================================================
        if not existing_payment:
            print(
                "FLUTTERWAVE WEBHOOK: "
                "No matching EventWaa payment found.",
                {
                    "transactionId":
                        transaction_id,
                    "txRef":
                        webhook_tx_ref
                }
            )
            # Do not create anything.
            #
            # The transaction may have been created
            # outside EventWaa, or the notification may
            # have arrived before our local payment record
            # could be found.
            #
            # We acknowledge receipt instead of repeatedly
            # receiving the same webhook.
            return jsonify({
                "success": True,
                "message": (
                    "Webhook received, but no "
                    "matching EventWaa payment "
                    "was found."
                )
            }), 200
        # ====================================================
        # GET EVENTWAA TX REF
        # ====================================================
        eventwaa_tx_ref = str(
            existing_payment.get(
                "txRef",
                ""
            )
        ).strip()
        if not eventwaa_tx_ref:
            print(
                "FLUTTERWAVE WEBHOOK: "
                "Payment record has no tx_ref."
            )
            return jsonify({
                "success": True,
                "message": (
                    "Webhook received."
                )
            }), 200
        # ====================================================
        # VERIFY THE TRANSACTION
        #
        # IMPORTANT:
        #
        # Never trust the webhook payload alone.
        #
        # We call the same verification logic already
        # used by PaymentSuccess.jsx.
        #
        # This gives us the existing:
        #
        # - status check
        # - tx_ref check
        # - currency check
        # - amount check
        # - duplicate protection
        # - booking creation
        # - ticket creation
        # - wallet update
        #
        # ====================================================
        result, status_code = (
            process_verified_payment(
                transaction_id,
                eventwaa_tx_ref
            )
        )
        # ====================================================
        # WEBHOOK RESULT
        # ====================================================
        print(
            "FLUTTERWAVE WEBHOOK PROCESS RESULT:",
            {
                "transactionId":
                    transaction_id,
                "txRef":
                    eventwaa_tx_ref,
                "statusCode":
                    status_code,
                "result":
                    result
            }
        )
        # ====================================================
        # IMPORTANT
        #
        # Flutterwave expects a successful HTTP response
        # when the webhook has been received.
        #
        # We therefore acknowledge the webhook after our
        # processing attempt.
        # ====================================================
        return jsonify({
            "success": True,
            "message": (
                "Flutterwave webhook received."
            ),
            "processed": (
                result.get(
                    "success",
                    False
                )
                if isinstance(
                    result,
                    dict
                )
                else False
            )
        }), 200
    except Exception as e:
        print(
            "FLUTTERWAVE WEBHOOK ERROR:",
            str(e)
        )
        # We return 500 for genuine server errors so the
        # webhook can be retried according to the Flutterwave
        # webhook configuration.
        return jsonify({
            "success": False,
            "message": (
                "Unable to process "
                "Flutterwave webhook."
            )
        }), 500

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
# HOST TEAM MEMBERS
#
# EventWaa Host Team system
#
# Team members:
# - Have their own account
# - Are connected to a host
# - Can be assigned to specific events
# - Can be enabled / disabled
# - Can later use the secure team scanner
#
# Files:
# - users.json
# - team_members.json
# - team_sessions.json
# ============================================================


# ============================================================
# TEAM MEMBER FILES
# ============================================================

TEAM_MEMBERS_FILE = "team_members.json"
TEAM_SESSIONS_FILE = "team_sessions.json"


# ============================================================
# HELPERS
# ============================================================

def load_team_members():

    return load_json_file(
        TEAM_MEMBERS_FILE,
        []
    )


def save_team_members(team_members):

    save_json_file(
        TEAM_MEMBERS_FILE,
        team_members
    )


def load_team_sessions():

    return load_json_file(
        TEAM_SESSIONS_FILE,
        []
    )


def save_team_sessions(sessions):

    save_json_file(
        TEAM_SESSIONS_FILE,
        sessions
    )


# ============================================================
# FIND USER
# ============================================================

def find_user_by_id(user_id):

    users = load_json_file(
        "users.json",
        []
    )

    for user in users:

        if str(
            user.get("id")
        ) == str(user_id):

            return user

    return None


# ============================================================
# FIND USER BY EMAIL
# ============================================================

def find_user_by_email(email):

    users = load_json_file(
        "users.json",
        []
    )

    for user in users:

        if (
            str(
                user.get("email", "")
            ).strip().lower()
            ==
            str(email or "").strip().lower()
        ):

            return user

    return None


# ============================================================
# FIND EVENT
# ============================================================

def find_event_by_id(event_id):

    events = load_json_file(
        "events.json",
        []
    )

    for event in events:

        if str(
            event.get("id")
        ) == str(event_id):

            return event

    return None


# ============================================================
# CHECK WHETHER HOST OWNS EVENT
# ============================================================

def host_owns_event(host, event):

    if not host or not event:
        return False


    host_id = str(
        host.get("id", "")
    )

    host_email = str(
        host.get("email", "")
    ).strip().lower()


    event_host_id = str(
        event.get("hostId", "")
    )

    event_host_email = str(
        event.get("hostEmail", "")
    ).strip().lower()


    # --------------------------------------------------------
    # PRIMARY CHECK
    # --------------------------------------------------------

    if (
        host_id
        and
        event_host_id
        and
        host_id == event_host_id
    ):

        return True


    # --------------------------------------------------------
    # FALLBACK CHECK
    # --------------------------------------------------------

    if (
        host_email
        and
        event_host_email
        and
        host_email == event_host_email
    ):

        return True


    return False


# ============================================================
# SAFE TEAM MEMBER
# ============================================================

def safe_team_member(member):

    safe = member.copy()

    safe.pop(
        "password",
        None
    )

    return safe


# ============================================================
# GET HOST TEAM
# ============================================================

@app.route(
    "/host/team-members",
    methods=["GET"]
)
def get_host_team_members():

    host_id = request.args.get(
        "hostId"
    )

    host_email = request.args.get(
        "hostEmail"
    )


    if not host_id and not host_email:

        return jsonify({

            "success": False,

            "message":
                "Host identification is required."

        }), 400


    host = None


    if host_id:

        host = find_user_by_id(
            host_id
        )


    if not host and host_email:

        host = find_user_by_email(
            host_email
        )


    if not host:

        return jsonify({

            "success": False,

            "message":
                "Host account not found."

        }), 404


    team_members =  load_team_members()
       


    host_members = []


    for member in team_members:

        if (
            str(
                member.get("hostId", "")
            )
            ==
            str(
                host.get("id", "")
            )
        ):

            host_members.append(
                safe_team_member(member)
            )


    return jsonify({

        "success": True,

        "members":
            host_members

    }), 200


# ============================================================
# GET HOST EVENTS
#
# Used by Host Team page to populate
# the event assignment dropdown.
# ============================================================

@app.route(
    "/host/team-events",
    methods=["GET"]
)
def get_host_team_events():

    host_id = request.args.get(
        "hostId"
    )

    host_email = request.args.get(
        "hostEmail"
    )


    if not host_id and not host_email:

        return jsonify({

            "success": False,

            "message":
                "Host identification is required."

        }), 400


    host = None


    if host_id:

        host = find_user_by_id(
            host_id
        )


    if not host and host_email:

        host = find_user_by_email(
            host_email
        )


    if not host:

        return jsonify({

            "success": False,

            "message":
                "Host account not found."

        }), 404


    events = load_json_file(
        "events.json",
        []
    )


    host_events = []


    for event in events:

        if host_owns_event(
            host,
            event
        ):

            host_events.append({

                "id":
                    event.get("id"),

                "title":
                    event.get(
                        "title",
                        event.get(
                            "eventTitle",
                            "Untitled Event"
                        )
                    ),

                "eventPoster":
                    event.get(
                        "eventPoster",
                        ""
                    ),

                "date":
                    event.get(
                        "date",
                        ""
                    ),

                "location":
                    event.get(
                        "location",
                        ""
                    )

            })


    return jsonify({

        "success": True,

        "events":
            host_events

    }), 200


# ============================================================
# ADD HOST TEAM MEMBER
#
# POST /host/team-members
#
# HOST TEAM FLOW:
#
# Host
#   ↓
# Add team member
#   ↓
# Generate temporary password
#   ↓
# Create login account
#   ↓
# Save account to TEAM_ACCOUNTS_FILE
#   ↓
# Create host team-member assignment
#   ↓
# Send login email
#
# IMPORTANT:
#
# team_members.json
#     = host assignment / event access
#
# admin_team_accounts.json
#     = actual team login accounts
#
# The plaintext temporary password is NEVER stored.
# ============================================================

@app.route(
    "/host/team-members",
    methods=["POST"]
)
def add_host_team_member():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        # ====================================================
        # HOST IDENTIFICATION
        # ====================================================

        host_id = data.get(
            "hostId"
        )

        host_email = str(
            data.get(
                "hostEmail",
                ""
            ) or ""
        ).strip().lower()

        # ====================================================
        # MEMBER INFORMATION
        # ====================================================

        name = str(
            data.get(
                "name",
                ""
            ) or ""
        ).strip()

        email = str(
            data.get(
                "email",
                ""
            ) or ""
        ).strip().lower()

        role = str(
            data.get(
                "role",
                "Scanner"
            ) or "Scanner"
        ).strip()

        # ====================================================
        # EVENT IDS
        # ====================================================

        incoming_event_ids = data.get(
            "eventIds"
        )

        if incoming_event_ids is None:

            old_event_id = data.get(
                "eventId"
            )

            if old_event_id:

                incoming_event_ids = [
                    old_event_id
                ]

            else:

                incoming_event_ids = []

        if not isinstance(
            incoming_event_ids,
            list
        ):

            incoming_event_ids = [
                incoming_event_ids
            ]

        # ====================================================
        # CLEAN EVENT IDS
        # ====================================================

        event_ids = []

        for event_id in incoming_event_ids:

            if event_id is None:
                continue

            event_id = str(
                event_id
            ).strip()

            if (
                event_id
                and
                event_id not in event_ids
            ):

                event_ids.append(
                    event_id
                )

        # ====================================================
        # VALIDATION
        # ====================================================

        if not name:

            return jsonify({

                "success": False,

                "message":
                    "Team member name is required."

            }), 400

        if not email:

            return jsonify({

                "success": False,

                "message":
                    "Team member email is required."

            }), 400

        if not host_id and not host_email:

            return jsonify({

                "success": False,

                "message":
                    "Host identification is required."

            }), 400

        # ====================================================
        # FIND HOST
        # ====================================================

        host = None

        if host_id:

            host = find_user_by_id(
                host_id
            )

        if not host and host_email:

            host = find_user_by_email(
                host_email
            )

        if not host:

            return jsonify({

                "success": False,

                "message":
                    "Host account not found."

            }), 404

        # ====================================================
        # LOAD EVENTS
        # ====================================================

        events = load_json_file(
            "events.json",
            []
        )

        if not isinstance(
            events,
            list
        ):

            events = []

        assigned_events = []

        # ====================================================
        # VALIDATE EVENTS
        #
        # Host may only assign their own events.
        # ====================================================

        for event_id in event_ids:

            event = None

            for item in events:

                if not isinstance(
                    item,
                    dict
                ):
                    continue

                if str(
                    item.get("id", "")
                ).strip() == str(
                    event_id
                ).strip():

                    event = item

                    break

            if not event:

                return jsonify({

                    "success": False,

                    "message":
                        f"Selected event {event_id} was not found."

                }), 404

            if not host_owns_event(
                host,
                event
            ):

                return jsonify({

                    "success": False,

                    "message":
                        "You can only assign team members to your own events."

                }), 403

            assigned_events.append(
                event
            )

        # ====================================================
        # LOAD HOST TEAM MEMBERS
        # ====================================================

        team_members = load_team_members()

        if not isinstance(
            team_members,
            list
        ):

            team_members = []

        # ====================================================
        # CHECK EXISTING HOST TEAM MEMBER
        # ====================================================

        host_id_string = str(
            host.get(
                "id",
                ""
            ) or ""
        ).strip()

        for member in team_members:

            if not isinstance(
                member,
                dict
            ):
                continue

            member_host_id = str(
                member.get(
                    "hostId",
                    ""
                ) or ""
            ).strip()

            member_email = str(
                member.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            if (
                member_host_id
                ==
                host_id_string
                and
                member_email
                ==
                email
            ):

                return jsonify({

                    "success": False,

                    "message":
                        "This person is already on your team."

                }), 409

        # ====================================================
        # LOAD TEAM ACCOUNTS
        #
        # THIS IS THE IMPORTANT PART.
        #
        # The actual login account is stored here.
        # ====================================================

        team_accounts = load_team_accounts()

        if not isinstance(
            team_accounts,
            list
        ):

            team_accounts = []

        # ====================================================
        # CHECK EXISTING TEAM ACCOUNT
        # ====================================================

        existing_team_account = None

        for account in team_accounts:

            if not isinstance(
                account,
                dict
            ):
                continue

            account_email = str(
                account.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()

            if account_email == email:

                existing_team_account = account

                break

        # ====================================================
        # IMPORTANT:
        #
        # A team account already belonging to another
        # team member cannot be silently reused.
        # ====================================================

        if existing_team_account:

            return jsonify({

                "success": False,

                "message":
                    "A team account already exists for this email."

            }), 409

        # ====================================================
        # GENERATE TEMPORARY PASSWORD
        # ====================================================

        generated_password = (
            secrets.token_urlsafe(8)
        )

        if not generated_password:

            return jsonify({

                "success": False,

                "message":
                    "Unable to generate team member password."

            }), 500

        # ====================================================
        # CREATE TEAM ACCOUNT ID
        # ====================================================

        account_id = (
            f"TEAM-{int(time.time() * 1000)}"
        )

        # ====================================================
        # CREATE USER ID
        #
        # Used to connect the account to users.json.
        # ====================================================

        user_id = int(
            time.time() * 1000
        )

        # ====================================================
        # CREATE HASHED PASSWORD
        # ====================================================

        password_hash = (
            generate_password_hash(
                generated_password
            )
        )

        # ====================================================
        # CREATE TEAM ACCOUNT
        #
        # Plaintext password is NEVER stored.
        # ====================================================

        team_account = {

            "id":
                account_id,

            "memberId":
                account_id,

            "userId":
                user_id,

            "name":
                name,

            "email":
                email,

            "password":
                password_hash,

            "role":
                role,

            "host":
                host.get(
                    "name",
                    ""
                ),

            "hostId":
                host.get(
                    "id"
                ),

            "hostEmail":
                host.get(
                    "email",
                    host_email
                ),

            "event":
                (
                    assigned_events[0].get(
                        "title",
                        assigned_events[0].get(
                            "eventTitle",
                            ""
                        )
                    )
                    if assigned_events
                    else ""
                ),

            "eventId":
                (
                    assigned_events[0].get(
                        "id"
                    )
                    if assigned_events
                    else None
                ),

            "eventIds":
                event_ids,

            "status":
                "Active",

            "teamMember":
                True,

            "createdAt":
                datetime.now().isoformat()

        }

        # ====================================================
        # SAVE TEAM ACCOUNT
        # ====================================================

        team_accounts.append(
            team_account
        )

        save_team_accounts(
            team_accounts
        )

        # ====================================================
        # CREATE / UPDATE USERS.JSON
        #
        # This keeps the general user identity available,
        # but the team login password is controlled by the
        # team account above.
        # ====================================================

        users = load_json_file(
            "users.json",
            []
        )

        if not isinstance(
            users,
            list
        ):

            users = []

        user_record = {

            "id":
                user_id,

            "name":
                name,

            "email":
                email,

            "password":
                password_hash,

            "role":
                "team",

            "status":
                "active",

            "verifiedHost":
                False,

            "hostMode":
                False,

            "teamMember":
                True,

            "teamAccountId":
                account_id

        }

        users.append(
            user_record
        )

        save_json_file(
            "users.json",
            users
        )

        # ====================================================
        # BACKWARDS COMPATIBILITY
        # ====================================================

        first_event = (
            assigned_events[0]
            if assigned_events
            else None
        )

        event_title = ""

        if first_event:

            event_title = (
                first_event.get(
                    "title"
                )
                or
                first_event.get(
                    "eventTitle",
                    ""
                )
            )

        # ====================================================
        # CREATE HOST TEAM MEMBER RECORD
        # ====================================================

        member_id = (
            f"TEAM-{int(time.time() * 1000)}"
        )

        new_member = {

            "id":
                member_id,

            "userId":
                user_id,

            "teamAccountId":
                account_id,

            "hostId":
                host.get(
                    "id"
                ),

            "hostEmail":
                host.get(
                    "email",
                    host_email
                ),

            "name":
                name,

            "email":
                email,

            "role":
                role,

            # SOURCE OF TRUTH
            "eventIds":
                event_ids,

            # BACKWARDS COMPATIBILITY
            "eventId":
                first_event.get(
                    "id"
                )
                if first_event
                else None,

            "eventTitle":
                event_title,

            "status":
                "Active",

            "createdAt":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        }

        # ====================================================
        # SAVE HOST TEAM MEMBER
        # ====================================================

        team_members.append(
            new_member
        )

        save_team_members(
            team_members
        )

        # ====================================================
        # SEND INVITATION EMAIL
        # ====================================================

        print(
            "==================================================="
        )

        print(
            "EVENTWAA: ABOUT TO SEND TEAM INVITATION"
        )

        print(
            "EMAIL:",
            email
        )

        print(
            "NAME:",
            name
        )

        print(
            "ROLE:",
            role
        )

        print(
            "GENERATED PASSWORD EXISTS:",
            bool(
                generated_password
            )
        )

        print(
            "ASSIGNED EVENTS:",
            len(
                assigned_events
            )
        )

        print(
            "TEAM ACCOUNT ID:",
            account_id
        )

        print(
            "==================================================="
        )

        email_result = (
            send_team_invitation_email(

                receiver_email=
                    email,

                member_name=
                    name,

                temporary_password=
                    generated_password,

                role=
                    role,

                assigned_events=
                    assigned_events

            )
        )

        # ====================================================
        # EMAIL RESULT
        # ====================================================

        print(
            "==================================================="
        )

        print(
            "EVENTWAA: TEAM INVITATION RESULT"
        )

        print(
            "EMAIL RESULT:",
            email_result
        )

        print(
            "==================================================="
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        response = {

            "success":
                True,

            "message":
                "Team member added successfully.",

            "member":
                safe_team_member(
                    new_member
                ),

            "emailSent":
                bool(
                    email_result
                    and
                    email_result.get(
                        "success"
                    )
                )

        }

        # ====================================================
        # EMAIL FAILURE
        #
        # Account/member remain created so we don't lose
        # the team member. The response clearly tells the
        # frontend that email failed.
        # ====================================================

        if not email_result or not email_result.get(
            "success"
        ):

            response[
                "emailError"
            ] = (
                email_result.get(
                    "message"
                )
                if email_result
                else
                "Unable to send team invitation email."
            )

            response[
                "message"
            ] = (
                "Team member was added, "
                "but the invitation email could not be sent."
            )

        else:

            response[
                "message"
            ] = (
                "Team member added successfully. "
                "Invitation email sent."
            )

        return jsonify(
            response
        ), 201

    except Exception as e:

        print(
            "==================================================="
        )

        print(
            "ADD HOST TEAM MEMBER ERROR:"
        )

        print(
            type(e).__name__,
            str(e)
        )

        print(
            "==================================================="
        )

        return jsonify({

            "success":
                False,

            "message":
                "Unable to add team member."

        }), 500

# ============================================================
# UPDATE TEAM MEMBER
#
# Supports:
# - Enable / disable
# - Change role
# - Assign multiple events
# - Remove all event assignments
# ============================================================

@app.route(
    "/host/team-members/<member_id>",
    methods=["PUT"]
)
def update_host_team_member(member_id):

    data = request.get_json(
        silent=True
    ) or {}


    host_id = data.get(
        "hostId"
    )

    host_email = data.get(
        "hostEmail"
    )


    # ========================================================
    # FIND HOST
    # ========================================================

    host = None


    if host_id:

        host = find_user_by_id(
            host_id
        )


    if not host and host_email:

        host = find_user_by_email(
            host_email
        )


    if not host:

        return jsonify({

            "success": False,

            "message":
                "Host account not found."

        }), 404


    # ========================================================
    # LOAD TEAM
    # ========================================================

    team_members = load_team_members()


    member = None


    for item in team_members:

        if str(
            item.get("id")
        ) == str(member_id):

            member = item

            break


    if not member:

        return jsonify({

            "success": False,

            "message":
                "Team member not found."

        }), 404


    # ========================================================
    # OWNERSHIP
    # ========================================================

    if (
        str(
            member.get("hostId")
        )
        !=
        str(
            host.get("id")
        )
    ):

        return jsonify({

            "success": False,

            "message":
                "You do not have permission to modify this team member."

        }), 403


    # ========================================================
    # STATUS
    # ========================================================

    if "status" in data:

        new_status = str(
            data.get(
                "status"
            )
        ).strip()


        if new_status not in [
            "Active",
            "Disabled"
        ]:

            return jsonify({

                "success": False,

                "message":
                    "Invalid team member status."

            }), 400


        member["status"] = new_status


    # ========================================================
    # ROLE
    # ========================================================

    if "role" in data:

        member["role"] = str(
            data.get(
                "role"
            )
        ).strip()


    # ========================================================
    # MULTIPLE EVENT ASSIGNMENT
    # ========================================================

    if "eventIds" in data:

        incoming_event_ids = data.get(
            "eventIds"
        )


        if not isinstance(
            incoming_event_ids,
            list
        ):

            return jsonify({

                "success": False,

                "message":
                    "eventIds must be a list."

            }), 400


        # ----------------------------------------------------
        # Clean IDs
        # ----------------------------------------------------

        event_ids = []


        for event_id in incoming_event_ids:

            if event_id is None:
                continue

            event_id = str(
                event_id
            ).strip()


            if (
                event_id
                and
                event_id not in event_ids
            ):

                event_ids.append(
                    event_id
                )


        # ----------------------------------------------------
        # Load events
        # ----------------------------------------------------

        events = load_json_file(
            "events.json",
            []
        )


        assigned_events = []


        # ----------------------------------------------------
        # Verify every event belongs to this host
        # ----------------------------------------------------

        for event_id in event_ids:

            event = None


            for item in events:

                if str(
                    item.get("id")
                ) == str(event_id):

                    event = item

                    break


            if not event:

                return jsonify({

                    "success": False,

                    "message":
                        f"Event {event_id} was not found."

                }), 404


            if not host_owns_event(
                host,
                event
            ):

                return jsonify({

                    "success": False,

                    "message":
                        "You can only assign your team to your own events."

                }), 403


            assigned_events.append(
                event
            )


        # ----------------------------------------------------
        # SAVE NEW ASSIGNMENTS
        # ----------------------------------------------------

        member["eventIds"] = event_ids


        # ----------------------------------------------------
        # Keep old fields compatible
        # ----------------------------------------------------

        if assigned_events:

            first_event = assigned_events[0]


            member["eventId"] = (
                first_event.get("id")
            )


            member["eventTitle"] = (
                first_event.get(
                    "title",
                    first_event.get(
                        "eventTitle",
                        ""
                    )
                )
            )

        else:

            member["eventId"] = None

            member["eventTitle"] = (
                "No events assigned"
            )


    # ========================================================
    # BACKWARDS COMPATIBILITY
    #
    # If an older frontend sends eventId instead of eventIds,
    # convert it automatically.
    # ========================================================

    elif "eventId" in data:

        event_id = data.get(
            "eventId"
        )


        if event_id:

            events = load_json_file(
                "events.json",
                []
            )


            event = None


            for item in events:

                if str(
                    item.get("id")
                ) == str(event_id):

                    event = item

                    break


            if not event:

                return jsonify({

                    "success": False,

                    "message":
                        "Selected event was not found."

                }), 404


            if not host_owns_event(
                host,
                event
            ):

                return jsonify({

                    "success": False,

                    "message":
                        "You can only assign your team to your own events."

                }), 403


            member["eventIds"] = [
                event.get("id")
            ]


            member["eventId"] = (
                event.get("id")
            )


            member["eventTitle"] = (
                event.get(
                    "title",
                    event.get(
                        "eventTitle",
                        ""
                    )
                )
            )

        else:

            member["eventIds"] = []

            member["eventId"] = None

            member["eventTitle"] = (
                "No events assigned"
            )


    # ========================================================
    # SAVE
    # ========================================================

    save_team_members(
        team_members
    )


    return jsonify({

        "success": True,

        "message":
            "Team member updated successfully.",

        "member":
            safe_team_member(
                member
            )

    }), 200

# ============================================================
# REMOVE TEAM MEMBER
# ============================================================

@app.route(
    "/host/team-members/<member_id>",
    methods=["DELETE"]
)
def remove_host_team_member(
    member_id
):

    data = request.get_json(
        silent=True
    ) or {}


    host_id = data.get(
        "hostId"
    )

    host_email = data.get(
        "hostEmail"
    )


    host = None


    if host_id:

        host = find_user_by_id(
            host_id
        )


    if not host and host_email:

        host = find_user_by_email(
            host_email
        )


    if not host:

        return jsonify({

            "success": False,

            "message":
                "Host account not found."

        }), 404


    team_members = load_team_members()


    target = None


    for member in team_members:

        if str(
            member.get("id")
        ) == str(member_id):

            target = member

            break


    if not target:

        return jsonify({

            "success": False,

            "message":
                "Team member not found."

        }), 404


    if (
        str(
            target.get("hostId")
        )
        !=
        str(
            host.get("id")
        )
    ):

        return jsonify({

            "success": False,

            "message":
                "You do not have permission to remove this team member."

        }), 403


    team_members = [

        member

        for member in team_members

        if str(
            member.get("id")
        )
        !=
        str(member_id)

    ]


    save_team_members(
        team_members
    )


    return jsonify({

        "success": True,

        "message":
            "Team member removed successfully."

    }), 200


# ============================================================
# TEAM MEMBER LOGIN
#
# Separate from normal user / host / admin login.
#
# Authentication:
# - users.json
# - role must be "team"
# - password must be valid
# - team_members.json record must exist
#
# Creates:
# - secure team session token
# ============================================================

@app.route(
    "/team-login",
    methods=["POST"]
)
def team_login():

    data = request.get_json(
        silent=True
    ) or {}


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    password = data.get(
        "password"
    )


    # ========================================================
    # VALIDATION
    # ========================================================

    if not email or not password:

        return jsonify({

            "success": False,

            "message":
                "Email and password are required."

        }), 400


    # ========================================================
    # FIND USER
    # ========================================================

    user = find_user_by_email(
        email
    )


    print(
        "TEAM LOGIN EMAIL:",
        email
    )

    print(
        "TEAM LOGIN USER FOUND:",
        bool(user)
    )


    if not user:

        print(
            "TEAM LOGIN FAILED: USER NOT FOUND"
        )

        return jsonify({

            "success": False,

            "message":
                "Team account not found for this email."

        }), 401


    # ========================================================
    # DEBUG USER ROLE
    # ========================================================

    print(
        "TEAM LOGIN USER ID:",
        user.get("id")
    )

    print(
        "TEAM LOGIN USER ROLE:",
        user.get("role")
    )

    print(
        "TEAM LOGIN USER STATUS:",
        user.get("status")
    )


    # ========================================================
    # ROLE
    # ========================================================

    if str(
        user.get(
            "role",
            ""
        )
    ).strip().lower() != "team":

        print(
            "TEAM LOGIN FAILED: USER ROLE IS NOT TEAM"
        )

        return jsonify({

            "success": False,

            "message":
                "This account is not configured as a team member account."

        }), 403


    # ========================================================
    # USER STATUS
    # ========================================================

    if str(
        user.get(
            "status",
            ""
        )
    ).strip().lower() == "suspended":

        return jsonify({

            "success": False,

            "message":
                "This account has been suspended."

        }), 403


    # ========================================================
    # PASSWORD
    # ========================================================

    stored_password = user.get(
        "password",
        ""
    )


    if not stored_password:

        print(
            "TEAM LOGIN FAILED: NO PASSWORD HASH"
        )

        return jsonify({

            "success": False,

            "message":
                "This team account does not have a valid password."

        }), 401


    try:

        password_valid = check_password_hash(
            stored_password,
            password
        )

    except Exception as error:

        print(
            "TEAM PASSWORD CHECK ERROR:",
            error
        )

        password_valid = False


    if not password_valid:

        print(
            "TEAM LOGIN FAILED: PASSWORD DOES NOT MATCH"
        )

        return jsonify({

            "success": False,

            "message":
                "The team password is incorrect."

        }), 401


    print(
        "TEAM PASSWORD VALID"
    )


    # ========================================================
    # FIND TEAM MEMBER RECORD
    # ========================================================

    team_members = load_team_members()

    member = None


    for item in team_members:

        if (
            str(
                item.get("userId")
            )
            ==
            str(
                user.get("id")
            )
        ):

            member = item

            break


    if not member:

        print(
            "TEAM LOGIN FAILED: TEAM MEMBER RECORD NOT FOUND"
        )

        return jsonify({

            "success": False,

            "message":
                "Team membership record not found."

        }), 403


    print(
        "TEAM MEMBER RECORD FOUND:",
        member.get("id")
    )


    # ========================================================
    # TEAM MEMBER STATUS
    # ========================================================

    member_status = str(
        member.get(
            "status",
            ""
        )
    ).strip().lower()


    if member_status != "active":

        print(
            "TEAM LOGIN FAILED: TEAM MEMBER DISABLED"
        )

        return jsonify({

            "success": False,

            "message":
                "Your team account has been disabled."

        }), 403


    # ========================================================
    # CREATE HOST TEAM SESSION TOKEN
    # ========================================================

    token = create_team_token(
        user,
        member_id=member.get(
            "id"
        ),
        name=user.get(
            "name",
            ""
        ),
        team_type="host"
    )

    if not token:

        print(
            "TEAM LOGIN FAILED: "
            "COULD NOT CREATE TEAM TOKEN"
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to create team session."

        }), 500


    # ========================================================
    # RESPONSE
    # ========================================================

    return jsonify({

        "success": True,

        "message":
            "Team login successful.",

        "token":
            token,

        "user": {

            "id":
                user.get("id"),

            "name":
                user.get("name"),

            "email":
                user.get("email"),

            "role":
                "team"

        },

        "teamMember":
            safe_team_member(
                member
            )

    }), 200

# ============================================================
# VERIFY TEAM TOKEN
#
# Used by secure team-only endpoints.
# ============================================================

def get_team_session():

    authorization =  request.headers.get(
                "Authorization",
                ""
            )
    
    
    if not authorization.startswith(
        "Bearer "
    ):

        return None


    token =  authorization.replace(
                "Bearer ",
                "",
                1
            ).strip()


    if not token:

        return None


    sessions =  load_team_sessions()


    for session in sessions:

        if (
            session.get("token")
            ==
            token
        ):

            return session


    return None


# ============================================================
# GET TEAM MEMBER ASSIGNED EVENTS
#
# Authentication is handled by team_required().
#
# Supports:
#     Host Team
#     Admin Team
#
# The authenticated token/memberId is the source of truth.
# ============================================================

@app.route(
    "/team/events",
    methods=["GET"]
)
@team_required
def get_team_assigned_events(account):

    try:

        # ====================================================
        # VALIDATE AUTHENTICATED ACCOUNT
        # ====================================================

        if not isinstance(
            account,
            dict
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid team account."

            }), 401


        # ====================================================
        # GET AUTHENTICATED MEMBER ID
        # ====================================================

        member_id = str(

            account.get(
                "memberId",
                account.get(
                    "memberid",
                    ""
                )
            ) or ""

        ).strip()


        if not member_id:

            return jsonify({

                "success": False,

                "message":
                    "Team member assignment could not be determined."

            }), 404


        # ====================================================
        # GET TEAM TYPE
        # ====================================================

        team_type = str(

            account.get(
                "teamType",
                ""
            ) or ""

        ).strip().lower()


        print(
            "TEAM EVENTS REQUEST:",
            account.get(
                "email",
                ""
            )
        )

        print(
            "TEAM EVENTS MEMBER ID:",
            member_id
        )

        print(
            "TEAM EVENTS TYPE:",
            team_type
        )


        # ====================================================
        # FIND CURRENT TEAM MEMBER
        # ====================================================

        team_member_record = None


        # ====================================================
        # HOST TEAM
        # ====================================================

        if team_type == "host":

            team_members = (
                load_team_members()
            )


            if not isinstance(
                team_members,
                list
            ):

                team_members = []


            for member in team_members:

                if not isinstance(
                    member,
                    dict
                ):

                    continue


                current_member_id = str(

                    member.get(
                        "id",
                        member.get(
                            "memberId",
                            member.get(
                                "memberid",
                                ""
                            )
                        )
                    ) or ""

                ).strip()


                if (
                    current_member_id
                    ==
                    member_id
                ):

                    team_member_record = member

                    break


        # ====================================================
        # ADMIN TEAM
        # ====================================================

        elif team_type == "admin":

            team_members = (
                load_admin_team_members()
            )


            if not isinstance(
                team_members,
                list
            ):

                team_members = []


            for member in team_members:

                if not isinstance(
                    member,
                    dict
                ):

                    continue


                current_member_id = str(

                    member.get(
                        "id",
                        member.get(
                            "memberId",
                            member.get(
                                "memberid",
                                ""
                            )
                        )
                    ) or ""

                ).strip()


                if (
                    current_member_id
                    ==
                    member_id
                ):

                    team_member_record = member

                    break


        # ====================================================
        # FALLBACK:
        #
        # Some records may have matching email but different
        # legacy ID structures.
        # ====================================================

        if team_member_record is None:

            account_email = str(

                account.get(
                    "email",
                    ""
                ) or ""

            ).strip().lower()


            if account_email:


                # --------------------------------------------
                # LOAD HOST TEAM MEMBERS IF NEEDED
                # --------------------------------------------

                if team_type != "admin":

                    team_members = (
                        load_team_members()
                    )


                    if isinstance(
                        team_members,
                        list
                    ):

                        for member in team_members:

                            if not isinstance(
                                member,
                                dict
                            ):

                                continue


                            member_email = str(

                                member.get(
                                    "email",
                                    ""
                                ) or ""

                            ).strip().lower()


                            if (
                                member_email
                                ==
                                account_email
                            ):

                                team_member_record = member

                                break


                # --------------------------------------------
                # LOAD ADMIN TEAM MEMBERS IF NEEDED
                # --------------------------------------------

                if team_member_record is None:

                    admin_members = (
                        load_admin_team_members()
                    )


                    if isinstance(
                        admin_members,
                        list
                    ):

                        for member in admin_members:

                            if not isinstance(
                                member,
                                dict
                            ):

                                continue


                            member_email = str(

                                member.get(
                                    "email",
                                    ""
                                ) or ""

                            ).strip().lower()


                            if (
                                member_email
                                ==
                                account_email
                            ):

                                team_member_record = member

                                break


        # ====================================================
        # TEAM MEMBER NOT FOUND
        # ====================================================

        if not isinstance(
            team_member_record,
            dict
        ):

            print(
                "TEAM EVENTS MEMBER NOT FOUND:",
                member_id
            )


            return jsonify({

                "success": False,

                "message":
                    "Team member could not be found."

            }), 404


        # ====================================================
        # CHECK STATUS
        # ====================================================

        member_status = str(

            team_member_record.get(
                "status",
                "Active"
            ) or "Active"

        ).strip().lower()


        if member_status != "active":

            return jsonify({

                "success": False,

                "message":
                    "This team account has been disabled."

            }), 403


        # ====================================================
        # GET EVENT IDS
        # ====================================================

        event_ids = (
            team_member_record.get(
                "eventIds"
            )
        )


        if not isinstance(
            event_ids,
            list
        ):

            event_ids = []


        normalized_event_ids = []


        for event_id in event_ids:

            if event_id is None:

                continue


            event_id = str(
                event_id
            ).strip()


            if (
                event_id
                and
                event_id
                not in normalized_event_ids
            ):

                normalized_event_ids.append(
                    event_id
                )


        # ====================================================
        # BACKWARDS COMPATIBILITY
        # ====================================================

        if not normalized_event_ids:

            old_event_id = str(

                team_member_record.get(
                    "eventId",
                    ""
                ) or ""

            ).strip()


            if old_event_id:

                normalized_event_ids.append(
                    old_event_id
                )


        print(
            "TEAM ASSIGNED EVENT IDS:",
            normalized_event_ids
        )


        # ====================================================
        # NO EVENTS
        # ====================================================

        if not normalized_event_ids:

            return jsonify({

                "success": True,

                "events": []

            }), 200


        # ====================================================
        # LOAD EVENTS
        # ====================================================

        events = load_json_file(

            "events.json",

            []

        )


        if not isinstance(
            events,
            list
        ):

            events = []


        assigned_events = []


        # ====================================================
        # FIND ASSIGNED EVENTS
        # ====================================================

        for event in events:

            if not isinstance(
                event,
                dict
            ):

                continue


            event_id = str(

                event.get(
                    "id",
                    ""
                ) or ""

            ).strip()


            if (
                event_id
                not in normalized_event_ids
            ):

                continue


            assigned_events.append({

                "id":
                    event.get(
                        "id"
                    ),

                "title":
                    event.get(
                        "title",
                        event.get(
                            "eventTitle",
                            "Untitled Event"
                        )
                    ),

                "eventTitle":
                    event.get(
                        "eventTitle",
                        event.get(
                            "title",
                            "Untitled Event"
                        )
                    ),

                "eventPoster":
                    event.get(
                        "eventPoster",
                        ""
                    ),

                "poster":
                    event.get(
                        "poster",
                        ""
                    ),

                "image":
                    event.get(
                        "image",
                        ""
                    ),

                "date":
                    event.get(
                        "date",
                        event.get(
                            "eventDate",
                            event.get(
                                "startDate",
                                ""
                            )
                        )
                    ),

                "eventDate":
                    event.get(
                        "eventDate",
                        ""
                    ),

                "startDate":
                    event.get(
                        "startDate",
                        ""
                    ),

                "time":
                    event.get(
                        "time",
                        ""
                    ),

                "location":
                    event.get(
                        "location",
                        ""
                    )

            })


        # ====================================================
        # DEBUG
        # ====================================================

        print(
            "TEAM EVENTS FOUND:",
            len(
                assigned_events
            )
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "events":
                assigned_events

        }), 200


    except Exception as e:

        print(
            "TEAM EVENTS ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to load assigned events."

        }), 500



# ============================================================
# TEAM SESSION CHECK
#
# GET /team-session
#
# IMPORTANT:
#
# This endpoint uses the NEW team authentication system.
#
# The frontend sends:
#
# Authorization: Bearer <team-token>
#
# team_required() verifies the token and passes the
# CURRENT team account into this route.
#
# Therefore we do NOT use:
#
# get_team_session()
#
# here anymore.
# ============================================================
@app.route(
    "/team-session",
    methods=["GET"]
)
@team_required
def team_session(account):
    try:
        # ====================================================
        # ACCOUNT VALIDATION
        # ====================================================
        if not isinstance(
            account,
            dict
        ):
            return jsonify({
                "success": False,
                "message":
                    "Invalid team account."
            }), 401
        # ====================================================
        # GET MEMBER ID
        #
        # The team account created during invitation contains:
        #
        # memberId
        #
        # We also support legacy:
        #
        # memberid
        # ====================================================
        member_id = (
            account.get(
                "memberId"
            )
            or
            account.get(
                "memberid"
            )
        )
        if member_id is None:
            return jsonify({
                "success": False,
                "message":
                    "Team member assignment could not be determined."
            }), 404
        # ====================================================
        # LOAD CURRENT TEAM MEMBERS
        # ====================================================
        team_members = (
            load_team_members()
        )
        if not isinstance(
            team_members,
            list
        ):
            team_members = []
        # ====================================================
        # FIND CURRENT TEAM MEMBER
        # ====================================================
        member = None
        for item in team_members:
            if not isinstance(
                item,
                dict
            ):
                continue
            item_id = str(
                item.get(
                    "id",
                    ""
                ) or ""
            ).strip()
            item_member_id = str(
                item.get(
                    "memberId",
                    item.get(
                        "memberid",
                        ""
                    )
                ) or ""
            ).strip()
            account_member_id = str(
                member_id
            ).strip()
            # ------------------------------------------------
            # PRIMARY MATCH
            # ------------------------------------------------
            if (
                item_id
                and
                item_id
                ==
                account_member_id
            ):
                member = item
                break
            # ------------------------------------------------
            # FALLBACK MEMBER ID
            # ------------------------------------------------
            if (
                item_member_id
                and
                item_member_id
                ==
                account_member_id
            ):
                member = item
                break
            # ------------------------------------------------
            # FALLBACK EMAIL
            # ------------------------------------------------
            account_email = str(
                account.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()
            member_email = str(
                item.get(
                    "email",
                    ""
                ) or ""
            ).strip().lower()
            if (
                account_email
                and
                member_email
                and
                account_email
                ==
                member_email
            ):
                member = item
                break
        # ====================================================
        # MEMBER NOT FOUND
        # ====================================================
        if member is None:
            return jsonify({
                "success": False,
                "message":
                    "Team member no longer exists."
            }), 404
        # ====================================================
        # CHECK MEMBER STATUS
        #
        # This is an additional check against the current
        # team-member record.
        #
        # verify_team_token() already checks the team account
        # status.
        #
        # This check also protects against the team-member
        # record itself being disabled.
        # ====================================================
        member_status = str(
            member.get(
                "status",
                "Active"
            ) or "Active"
        ).strip().lower()
        if member_status != "active":
            return jsonify({
                "success": False,
                "message":
                    "This team account has been disabled."
            }), 403
        # ====================================================
        # SAFE MEMBER
        # ====================================================
        safe_member = (
            safe_team_member(
                member
            )
        )
        # ====================================================
        # MAKE SURE PASSWORD IS NEVER RETURNED
        # ====================================================
        if isinstance(
            safe_member,
            dict
        ):
            safe_member.pop(
                "password",
                None
            )
        # ====================================================
        # SYNCHRONIZE ACCOUNT INFORMATION
        #
        # The account is the authenticated source.
        #
        # These fields make the frontend session consistent
        # with the actual team account.
        # ====================================================
        if not safe_member.get(
            "email"
        ):
            safe_member["email"] = (
                account.get(
                    "email",
                    ""
                )
            )
        if not safe_member.get(
            "name"
        ):
            safe_member["name"] = (
                account.get(
                    "name",
                    ""
                )
            )
        if not safe_member.get(
            "role"
        ):
            safe_member["role"] = (
                account.get(
                    "role",
                    "Event Staff"
                )
            )
        # ====================================================
        # SUCCESS
        # ====================================================
        return jsonify({
            "success": True,
            "teamMember":
                safe_member
        }), 200
    except Exception as e:
        print(
            "TEAM SESSION ERROR:",
            str(e)
        )
        return jsonify({
            "success": False,
            "message":
                "Unable to load team session."
        }), 500

# ============================================================
# INITIALIZE PESAPAL PAYMENT
# ============================================================

@app.route(
    "/payments/pesapal/initialize",
    methods=["POST"]
)
def initialize_pesapal_payment():

    try:

        if not PESAPAL_CONSUMER_KEY:

            return jsonify({
                "success": False,
                "message":
                    "PesaPal consumer key is not configured."
            }), 500

        if not PESAPAL_CONSUMER_SECRET:

            return jsonify({
                "success": False,
                "message":
                    "PesaPal consumer secret is not configured."
            }), 500

        if not PESAPAL_IPN_ID:

            return jsonify({
                "success": False,
                "message":
                    "PesaPal IPN is not configured yet."
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

        buyer_phone = str(
            buyer.get(
                "phone",
                ""
            )
            or
            data.get(
                "phone",
                ""
            )
        ).strip()

        # ====================================================
        # BASIC VALIDATION
        # ====================================================

        if not event_id:

            return jsonify({
                "success": False,
                "message":
                    "Event ID is required."
            }), 400

        if not ticket_type:

            return jsonify({
                "success": False,
                "message":
                    "Ticket type is required."
            }), 400

        if quantity < 1:

            return jsonify({
                "success": False,
                "message":
                    "Quantity must be at least 1."
            }), 400

        if not buyer_name:

            return jsonify({
                "success": False,
                "message":
                    "Buyer name is required."
            }), 400

        if not buyer_email:

            return jsonify({
                "success": False,
                "message":
                    "Buyer email is required."
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
                "message":
                    "Event not found."
            }), 404

        # ====================================================
        # FIND TICKET
        # ====================================================

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

            return jsonify({
                "success": False,
                "message":
                    "Ticket type not found."
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
                "message":
                    "There are not enough tickets available."
            }), 400

        # ====================================================
        # CALCULATE PAYMENT
        # ====================================================

        ticket_price = int(
            selected_ticket.get(
                "price",
                0
            )
            or 0
        )

        subtotal = (
            ticket_price *
            quantity
        )

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
            subtotal +
            service_fee
        )

        # ====================================================
        # GENERATE EVENTWAA PAYMENT REFERENCE
        # ====================================================

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

        next_payment_id = max(
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
        ) + 1

        payment_record = {

            "id":
                next_payment_id,

            "provider":
                "pesapal",

            "txRef":
                tx_ref,

            "transactionId":
                None,

            "pesapalOrderTrackingId":
                None,

            "pesapalMerchantReference":
                None,

            "eventId":
                event_id,

            "eventTitle":
                event.get(
                    "title",
                    ""
                ),

            "ticketType":
                ticket_type,

            "quantity":
                quantity,

            "buyer": {

                "name":
                    buyer_name,

                "email":
                    buyer_email,

                "phone":
                    buyer_phone
            },

            "ticketPrice":
                ticket_price,

            "subtotal":
                subtotal,

            "serviceFee":
                service_fee,

            "serviceFeePercent":
                service_fee_percent,

            "amount":
                customer_total,

            "currency":
                "UGX",

            "status":
                "pending",

            "processed":
                False,

            "bookingId":
                None,

            "createdAt":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),

            "processedAt":
                None
        }

        payments.append(
            payment_record
        )

        save_payments(
            payments
        )

        # ====================================================
        # CREATE PESAPAL ORDER
        # ====================================================

        try:

            pesapal_order = submit_pesapal_order(
                payment_record,
                buyer_phone
            )

        except Exception as e:

            print(
                "PESAPAL INITIALIZATION ERROR:",
                str(e)
            )

            # Remove the pending payment because
            # no PesaPal order was successfully created.

            payments = [
                p
                for p in payments
                if str(
                    p.get("txRef", "")
                ) != str(tx_ref)
            ]

            save_payments(
                payments
            )

            return jsonify({
                "success": False,
                "message":
                    "Unable to initialize PesaPal payment.",
                "error":
                    str(e)
            }), 502

        # ====================================================
        # STORE PESAPAL IDs
        # ====================================================

        for payment in payments:

            if str(
                payment.get("txRef", "")
            ) == str(tx_ref):

                payment[
                    "pesapalOrderTrackingId"
                ] = pesapal_order[
                    "order_tracking_id"
                ]

                payment[
                    "pesapalMerchantReference"
                ] = pesapal_order[
                    "merchant_reference"
                ]

                break

        save_payments(
            payments
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success":
                True,

            "message":
                "PesaPal payment initialized successfully.",

            "payment": {

                "provider":
                    "pesapal",

                "txRef":
                    tx_ref,

                "amount":
                    customer_total,

                "currency":
                    "UGX",

                "checkoutLink":
                    pesapal_order[
                        "redirect_url"
                    ],

                "orderTrackingId":
                    pesapal_order[
                        "order_tracking_id"
                    ]
            }

        }), 200

    except Exception as e:

        print(
            "PESAPAL INITIALIZE ERROR:",
            str(e)
        )

        return jsonify({

            "success":
                False,

            "message":
                "Unable to initialize PesaPal payment."

        }), 500


# ============================================================
# VERIFY PESAPAL PAYMENT
# ============================================================

@app.route(
    "/payments/pesapal/verify/<order_tracking_id>",
    methods=["GET"]
)
def verify_pesapal_payment(
    order_tracking_id
):

    try:

        order_tracking_id = str(
            order_tracking_id
        ).strip()

        if not order_tracking_id:

            return jsonify({
                "success": False,
                "message":
                    "PesaPal order tracking ID is required."
            }), 400

        payments = load_payments()

        payment = None

        for current_payment in payments:

            if str(
                current_payment.get(
                    "pesapalOrderTrackingId",
                    ""
                )
            ) == order_tracking_id:

                payment = current_payment
                break

        if not payment:

            return jsonify({
                "success": False,
                "message":
                    "PesaPal payment record not found.",
                "code":
                    "PAYMENT_NOT_FOUND"
            }), 404

        if payment.get(
            "processed",
            False
        ):

            return jsonify({

                "success":
                    True,

                "message":
                    "Payment has already been processed.",

                "alreadyProcessed":
                    True,

                "bookingId":
                    payment.get(
                        "bookingId"
                    ),

                "payment":
                    payment

            }), 200

        # ====================================================
        # ASK PESAPAL FOR THE REAL STATUS
        # ====================================================

        try:

            pesapal_payment = (
                get_pesapal_transaction_status(
                    order_tracking_id
                )
            )

        except Exception as e:

            print(
                "PESAPAL VERIFICATION ERROR:",
                str(e)
            )

            return jsonify({

                "success":
                    False,

                "message":
                    "Unable to verify payment with PesaPal."

            }), 502

        # ====================================================
        # PESAPAL STATUS
        #
        # 1 = COMPLETED
        # 2 = FAILED
        # 3 = REVERSED
        # ====================================================

        status_code = pesapal_payment.get(
            "status_code"
        )

        if str(
            status_code
        ) != "1":

            payment["status"] = (
                pesapal_payment.get(
                    "payment_status_description"
                )
                or
                (
                    "failed"
                    if str(status_code) == "2"
                    else "pending"
                )
            )

            payment[
                "pesapalStatusCode"
            ] = status_code

            save_payments(
                payments
            )

            return jsonify({

                "success":
                    False,

                "message":
                    "PesaPal payment has not completed.",

                "status":
                    pesapal_payment.get(
                        "payment_status_description"
                    ),

                "statusCode":
                    status_code

            }), 400

        # ====================================================
        # CHECK MERCHANT REFERENCE
        # ====================================================

        verified_reference = str(
            pesapal_payment.get(
                "merchant_reference",
                ""
            )
        )

        expected_reference = str(
            payment.get(
                "pesapalMerchantReference",
                ""
            )
        )

        if verified_reference != expected_reference:

            return jsonify({

                "success":
                    False,

                "message":
                    "PesaPal merchant reference does not match EventWaa payment."

            }), 400

        # ====================================================
        # CHECK CURRENCY
        # ====================================================

        verified_currency = str(
            pesapal_payment.get(
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

            return jsonify({

                "success":
                    False,

                "message":
                    "Payment currency does not match expected currency."

            }), 400

        # ====================================================
        # CHECK AMOUNT
        # ====================================================

        expected_amount = int(
            payment.get(
                "amount",
                0
            )
            or 0
        )

        paid_amount = int(
            float(
                pesapal_payment.get(
                    "amount",
                    0
                )
                or 0
            )
        )

        if paid_amount != expected_amount:

            return jsonify({

                "success":
                    False,

                "message":
                    "Payment amount does not match the required amount.",

                "expectedAmount":
                    expected_amount,

                "paidAmount":
                    paid_amount

            }), 400

        # ====================================================
        # COMMON EVENTWAA FULFILLMENT
        # ====================================================

        result, fulfillment_status = (
            complete_verified_eventwaa_payment(
                payment=payment,
                payments=payments,
                transaction_id=order_tracking_id,
                provider="pesapal",
                paid_amount=paid_amount
            )
        )

        return jsonify(
            result
        ), fulfillment_status

    except Exception as e:

        print(
            "PESAPAL VERIFY PAYMENT ERROR:",
            str(e)
        )

        return jsonify({

            "success":
                False,

            "message":
                "Unable to verify PesaPal payment."

        }), 500

# ============================================================
# PESAPAL CALLBACK
#
# PesaPal redirects the customer here after checkout.
#
# IMPORTANT:
# The callback itself is NOT trusted as proof of payment.
# We query PesaPal again and only fulfill if the transaction
# is actually completed.
# ============================================================

@app.route(
    "/payments/pesapal/callback",
    methods=["GET"]
)
def pesapal_callback():

    try:

        order_tracking_id = str(
            request.args.get(
                "OrderTrackingId",
                ""
            )
        ).strip()

        order_merchant_reference = str(
            request.args.get(
                "OrderMerchantReference",
                ""
            )
        ).strip()

        # ====================================================
        # CHECK REQUIRED ID
        # ====================================================

        if not order_tracking_id:

            return redirect(
                f"{FRONTEND_URL}"
                "/payment-success"
                "?provider=pesapal"
                "&status=failed"
            )

        # ====================================================
        # FIND EVENTWAA PAYMENT
        # ====================================================

        payments = load_payments()

        payment = None

        for current_payment in payments:

            if str(
                current_payment.get(
                    "pesapalOrderTrackingId",
                    ""
                )
            ) == order_tracking_id:

                payment = current_payment

                break

        if not payment:

            print(
                "PESAPAL CALLBACK: PAYMENT NOT FOUND",
                order_tracking_id
            )

            return redirect(
                f"{FRONTEND_URL}"
                "/payment-success"
                "?provider=pesapal"
                "&status=failed"
            )

        # ====================================================
        # IF ALREADY PROCESSED
        # ====================================================

        if payment.get(
            "processed",
            False
        ):

            return redirect(
                f"{FRONTEND_URL}"
                "/payment-success"
                "?provider=pesapal"
                "&status=successful"
                f"&tx_ref={payment.get('txRef', '')}"
                f"&bookingId={payment.get('bookingId', '')}"
            )

        # ====================================================
        # OPTIONAL MERCHANT REFERENCE CHECK
        #
        # If PesaPal supplied one, make sure it belongs to
        # this EventWaa payment.
        # ====================================================

        expected_reference = str(
            payment.get(
                "pesapalMerchantReference",
                ""
            )
        )

        if (
            order_merchant_reference
            and
            expected_reference
            and
            order_merchant_reference
            !=
            expected_reference
        ):

            print(
                "PESAPAL CALLBACK: MERCHANT REFERENCE MISMATCH"
            )

            return redirect(
                f"{FRONTEND_URL}"
                "/payment-success"
                "?provider=pesapal"
                "&status=failed"
            )

        # ====================================================
        # QUERY PESAPAL
        # ====================================================

        try:

            pesapal_payment = (
                get_pesapal_transaction_status(
                    order_tracking_id
                )
            )

        except Exception as e:

            print(
                "PESAPAL CALLBACK STATUS ERROR:",
                str(e)
            )

            return redirect(
                f"{FRONTEND_URL}"
                "/payment-success"
                "?provider=pesapal"
                "&status=pending"
                f"&orderTrackingId={order_tracking_id}"
            )

        # ====================================================
        # READ STATUS
        # ====================================================

        status_code = pesapal_payment.get(
            "status_code"
        )

        # ====================================================
        # PAYMENT COMPLETED
        # ====================================================

        if str(
            status_code
        ) == "1":

            verified_reference = str(
                pesapal_payment.get(
                    "merchant_reference",
                    ""
                )
            )

            if (
                expected_reference
                and
                verified_reference
                !=
                expected_reference
            ):

                print(
                    "PESAPAL CALLBACK: VERIFIED REFERENCE MISMATCH"
                )

                return redirect(
                    f"{FRONTEND_URL}"
                    "/payment-success"
                    "?provider=pesapal"
                    "&status=failed"
                )

            # =================================================
            # VERIFY CURRENCY
            # =================================================

            verified_currency = str(
                pesapal_payment.get(
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

                print(
                    "PESAPAL CALLBACK: CURRENCY MISMATCH"
                )

                return redirect(
                    f"{FRONTEND_URL}"
                    "/payment-success"
                    "?provider=pesapal"
                    "&status=failed"
                )

            # =================================================
            # VERIFY AMOUNT
            # =================================================

            expected_amount = int(
                payment.get(
                    "amount",
                    0
                )
                or 0
            )

            try:

                paid_amount = int(
                    float(
                        pesapal_payment.get(
                            "amount",
                            0
                        )
                        or 0
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                paid_amount = 0

            if paid_amount != expected_amount:

                print(
                    "PESAPAL CALLBACK: AMOUNT MISMATCH"
                )

                return redirect(
                    f"{FRONTEND_URL}"
                    "/payment-success"
                    "?provider=pesapal"
                    "&status=failed"
                )

            # =================================================
            # FULFILL PAYMENT
            # =================================================

            result, fulfillment_status = (
                complete_verified_eventwaa_payment(

                    payment=payment,

                    payments=payments,

                    transaction_id=order_tracking_id,

                    provider="pesapal",

                    paid_amount=paid_amount

                )
            )

            if (
                fulfillment_status >= 200
                and
                fulfillment_status < 300
            ):

                booking_id = (
                    result.get(
                        "bookingId",
                        ""
                    )
                )

                tx_ref = str(
                    payment.get(
                        "txRef",
                        ""
                    )
                )

                return redirect(
                    f"{FRONTEND_URL}"
                    "/payment-success"
                    "?provider=pesapal"
                    "&status=successful"
                    f"&tx_ref={tx_ref}"
                    f"&bookingId={booking_id}"
                )

            print(
                "PESAPAL CALLBACK FULFILLMENT FAILED:",
                result
            )

            return redirect(
                f"{FRONTEND_URL}"
                "/payment-success"
                "?provider=pesapal"
                "&status=pending"
                f"&orderTrackingId={order_tracking_id}"
            )

        # ====================================================
        # PAYMENT FAILED
        # ====================================================

        if str(
            status_code
        ) in (
            "2",
            "3"
        ):

            payment["status"] = (
                pesapal_payment.get(
                    "payment_status_description"
                )
                or
                "failed"
            )

            payment[
                "pesapalStatusCode"
            ] = status_code

            save_payments(
                payments
            )

            return redirect(
                f"{FRONTEND_URL}"
                "/payment-success"
                "?provider=pesapal"
                "&status=failed"
            )

        # ====================================================
        # PAYMENT STILL PENDING
        # ====================================================

        payment["status"] = (
            pesapal_payment.get(
                "payment_status_description"
            )
            or
            "pending"
        )

        payment[
            "pesapalStatusCode"
        ] = status_code

        save_payments(
            payments
        )

        return redirect(
            f"{FRONTEND_URL}"
            "/payment-success"
            "?provider=pesapal"
            "&status=pending"
            f"&orderTrackingId={order_tracking_id}"
        )

    except Exception as e:

        print(
            "PESAPAL CALLBACK ERROR:",
            str(e)
        )

        return redirect(
            f"{FRONTEND_URL}"
            "/payment-success"
            "?provider=pesapal"
            "&status=pending"
        )

# ============================================================
# PESAPAL IPN
#
# PesaPal calls this endpoint when the payment status changes.
#
# We NEVER trust the notification itself.
# We query PesaPal using the OrderTrackingId.
# ============================================================

@app.route(
    "/payments/pesapal/ipn",
    methods=["POST", "GET"]
)
def pesapal_ipn():

    try:

        # ====================================================
        # PesaPal can send these values in the request.
        # Support both JSON and query/form data so the endpoint
        # remains tolerant during sandbox testing.
        # ====================================================

        data = request.get_json(
            silent=True
        ) or {}

        order_tracking_id = str(
            data.get(
                "OrderTrackingId"
            )
            or
            request.values.get(
                "OrderTrackingId",
                ""
            )
            or
            ""
        ).strip()

        order_merchant_reference = str(
            data.get(
                "OrderMerchantReference"
            )
            or
            request.values.get(
                "OrderMerchantReference",
                ""
            )
            or
            ""
        ).strip()

        if not order_tracking_id:

            print(
                "PESAPAL IPN: ORDER TRACKING ID MISSING"
            )

            return jsonify({

                "orderNotificationType":
                    "IPNCHANGE",

                "orderTrackingId":
                    "",

                "orderMerchantReference":
                    order_merchant_reference,

                "status":
                    500

            }), 500

        # ====================================================
        # FIND EVENTWAA PAYMENT
        # ====================================================

        payments = load_payments()

        payment = None

        for current_payment in payments:

            if str(
                current_payment.get(
                    "pesapalOrderTrackingId",
                    ""
                )
            ) == order_tracking_id:

                payment = current_payment

                break

        if not payment:

            print(
                "PESAPAL IPN: PAYMENT NOT FOUND:",
                order_tracking_id
            )

            return jsonify({

                "orderNotificationType":
                    "IPNCHANGE",

                "orderTrackingId":
                    order_tracking_id,

                "orderMerchantReference":
                    order_merchant_reference,

                "status":
                    500

            }), 500

        # ====================================================
        # ALREADY PROCESSED
        #
        # IPNs can be repeated.
        # ====================================================

        if payment.get(
            "processed",
            False
        ):

            return jsonify({

                "orderNotificationType":
                    "IPNCHANGE",

                "orderTrackingId":
                    order_tracking_id,

                "orderMerchantReference":
                    payment.get(
                        "pesapalMerchantReference",
                        order_merchant_reference
                    ),

                "status":
                    200

            }), 200

        # ====================================================
        # CHECK MERCHANT REFERENCE IF PROVIDED
        # ====================================================

        expected_reference = str(
            payment.get(
                "pesapalMerchantReference",
                ""
            )
        )

        if (
            order_merchant_reference
            and
            expected_reference
            and
            order_merchant_reference
            !=
            expected_reference
        ):

            print(
                "PESAPAL IPN: MERCHANT REFERENCE MISMATCH"
            )

            return jsonify({

                "orderNotificationType":
                    "IPNCHANGE",

                "orderTrackingId":
                    order_tracking_id,

                "orderMerchantReference":
                    order_merchant_reference,

                "status":
                    500

            }), 500

        # ====================================================
        # QUERY PESAPAL FOR REAL STATUS
        # ====================================================

        try:

            pesapal_payment = (
                get_pesapal_transaction_status(
                    order_tracking_id
                )
            )

        except Exception as e:

            print(
                "PESAPAL IPN STATUS ERROR:",
                str(e)
            )

            return jsonify({

                "orderNotificationType":
                    "IPNCHANGE",

                "orderTrackingId":
                    order_tracking_id,

                "orderMerchantReference":
                    order_merchant_reference,

                "status":
                    500

            }), 500

        # ====================================================
        # STATUS CODE
        # ====================================================

        status_code = pesapal_payment.get(
            "status_code"
        )

        # ====================================================
        # COMPLETED
        # ====================================================

        if str(
            status_code
        ) == "1":

            # =================================================
            # CHECK MERCHANT REFERENCE
            # =================================================

            verified_reference = str(
                pesapal_payment.get(
                    "merchant_reference",
                    ""
                )
            )

            if (
                expected_reference
                and
                verified_reference
                !=
                expected_reference
            ):

                print(
                    "PESAPAL IPN: VERIFIED REFERENCE MISMATCH"
                )

                return jsonify({

                    "orderNotificationType":
                        "IPNCHANGE",

                    "orderTrackingId":
                        order_tracking_id,

                    "orderMerchantReference":
                        order_merchant_reference,

                    "status":
                        500

                }), 500

            # =================================================
            # CHECK CURRENCY
            # =================================================

            verified_currency = str(
                pesapal_payment.get(
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

                print(
                    "PESAPAL IPN: CURRENCY MISMATCH"
                )

                return jsonify({

                    "orderNotificationType":
                        "IPNCHANGE",

                    "orderTrackingId":
                        order_tracking_id,

                    "orderMerchantReference":
                        order_merchant_reference,

                    "status":
                        500

                }), 500

            # =================================================
            # CHECK AMOUNT
            # =================================================

            expected_amount = int(
                payment.get(
                    "amount",
                    0
                )
                or 0
            )

            try:

                paid_amount = int(
                    float(
                        pesapal_payment.get(
                            "amount",
                            0
                        )
                        or 0
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                paid_amount = 0

            if paid_amount != expected_amount:

                print(
                    "PESAPAL IPN: AMOUNT MISMATCH"
                )

                return jsonify({

                    "orderNotificationType":
                        "IPNCHANGE",

                    "orderTrackingId":
                        order_tracking_id,

                    "orderMerchantReference":
                        order_merchant_reference,

                    "status":
                        500

                }), 500

            # =================================================
            # FULFILL EVENTWAA PAYMENT
            # =================================================

            result, fulfillment_status = (
                complete_verified_eventwaa_payment(

                    payment=payment,

                    payments=payments,

                    transaction_id=order_tracking_id,

                    provider="pesapal",

                    paid_amount=paid_amount

                )
            )

            if not (
                fulfillment_status >= 200
                and
                fulfillment_status < 300
            ):

                print(
                    "PESAPAL IPN FULFILLMENT FAILED:",
                    result
                )

                return jsonify({

                    "orderNotificationType":
                        "IPNCHANGE",

                    "orderTrackingId":
                        order_tracking_id,

                    "orderMerchantReference":
                        order_merchant_reference,

                    "status":
                        500

                }), 500

        # ====================================================
        # FAILED / REVERSED
        # ====================================================

        elif str(
            status_code
        ) in (
            "2",
            "3"
        ):

            payment["status"] = (
                pesapal_payment.get(
                    "payment_status_description"
                )
                or
                "failed"
            )

            payment[
                "pesapalStatusCode"
            ] = status_code

            save_payments(
                payments
            )

        # ====================================================
        # PENDING
        # ====================================================

        else:

            payment["status"] = (
                pesapal_payment.get(
                    "payment_status_description"
                )
                or
                "pending"
            )

            payment[
                "pesapalStatusCode"
            ] = status_code

            save_payments(
                payments
            )

        # ====================================================
        # ACKNOWLEDGE IPN
        #
        # PesaPal expects HTTP 200 when the notification has
        # been successfully received/handled.
        # ====================================================

        return jsonify({

            "orderNotificationType":
                "IPNCHANGE",

            "orderTrackingId":
                order_tracking_id,

            "orderMerchantReference":
                payment.get(
                    "pesapalMerchantReference",
                    order_merchant_reference
                ),

            "status":
                200

        }), 200

    except Exception as e:

        print(
            "PESAPAL IPN ERROR:",
            str(e)
        )

        return jsonify({

            "orderNotificationType":
                "IPNCHANGE",

            "orderTrackingId":
                "",

            "orderMerchantReference":
                "",

            "status":
                500

        }), 500

# ============================================================
# FLUTTERWAVE INITIALIZE PAYMENT
# ============================================================

@app.route(
    "/payments/initialize",
    methods=["POST"]
)
def initialize_payment():

    try:

        # ====================================================
        # CHECK FLUTTERWAVE CONFIGURATION
        # ====================================================

        if not FLW_SECRET_KEY:

            return jsonify({
                "success": False,
                "message":
                    "Flutterwave secret key is not configured."
            }), 500


        # ====================================================
        # READ REQUEST
        # ====================================================

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
                "message":
                    "Ticket quantity must be greater than zero."
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
                ticket.get(
                    "name",
                    ""
                )
            ).strip().lower() == ticket_type.lower():

                selected_ticket = ticket

                break


        if not selected_ticket:

            return jsonify({
                "success": False,
                "message":
                    "Selected ticket type was not found."
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

                "message":
                    "Not enough tickets available.",

                "remaining":
                    remaining

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
        # EVENTWAA SERVICE FEE
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

                "message":
                    "Payment amount must be greater than zero."

            }), 400


        # ====================================================
        # GENERATE UNIQUE TRANSACTION REFERENCE
        # ====================================================

        user_id = data.get(
            "userId",
            buyer_email
        )


        tx_ref = generate_payment_reference(
            event_id,
            user_id
        )


        # ====================================================
        # LOAD PAYMENTS
        # ====================================================

        payments = load_payments()


        # ====================================================
        # CREATE EVENTWAA PAYMENT RECORD
        # ====================================================

        next_payment_id = (
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
        )


        payment_record = {

            "id":
                next_payment_id,

            "txRef":
                tx_ref,

            "transactionId":
                None,

            "eventId":
                event_id,

            "eventTitle":
                event.get(
                    "title",
                    ""
                ),

            "ticketType":
                ticket_type,

            "quantity":
                quantity,

            "buyer": {

                "name":
                    buyer_name,

                "email":
                    buyer_email

            },

            "ticketPrice":
                ticket_price,

            "subtotal":
                subtotal,

            "serviceFee":
                service_fee,

            "serviceFeePercent":
                service_fee_percent,

            "amount":
                customer_total,

            "currency":
                "UGX",

            "status":
                "pending",

            "processed":
                False,

            "bookingId":
                None,

            "createdAt":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),

            "processedAt":
                None

        }


        payments.append(
            payment_record
        )


        save_payments(
            payments
        )


        # ====================================================
        # FLUTTERWAVE STANDARD CHECKOUT
        # ====================================================

        payload = {

            "tx_ref":
                tx_ref,

            "amount":
                customer_total,

            "currency":
                "UGX",

            "redirect_url":
                f"{FRONTEND_URL}/payment-success",

            "customer": {

                "email":
                    buyer_email,

                "name":
                    buyer_name

            },

            "customizations": {

                "title":
                    "EventWaa",

                "description":
                    (
                        f"Ticket for "
                        f"{event.get('title', 'Event')}"
                    )

            },

            "meta": {

                "eventId":
                    event_id,

                "ticketType":
                    ticket_type,

                "quantity":
                    quantity

            }

        }


        # ====================================================
        # AUTHENTICATE WITH SECRET KEY
        # ====================================================

        headers = {

            "Authorization":
                f"Bearer {FLW_SECRET_KEY}",

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"

        }


        # ====================================================
        # SEND PAYMENT REQUEST
        # ====================================================

        response = requests.post(

            f"{FLW_API_URL}/payments",

            headers=headers,

            json=payload,

            timeout=30

        )


        try:

            flutterwave_data = (
                response.json()
            )

        except Exception:

            flutterwave_data = {}


        print(
            "FLUTTERWAVE INITIALIZE STATUS:",
            response.status_code
        )
        print(
                        "FLUTTERWAVE INITIALIZE RESPONSE:",
                        flutterwave_data
                    )
        


        # ====================================================
        # HANDLE FLUTTERWAVE ERROR
        # ====================================================

        if (
            response.status_code >= 400
            or
            flutterwave_data.get(
                "status"
            ) != "success"
        ):

            print(
                "FLUTTERWAVE INITIALIZE RESPONSE:",
                flutterwave_data
            )


            # Remove pending payment record

            payments = load_payments()

            payments = [

                p

                for p in payments

                if p.get(
                    "txRef"
                ) != tx_ref

            ]

            save_payments(
                payments
            )


            return jsonify({

                "success": False,

                "message":
                    (
                        flutterwave_data.get(
                            "message"
                        )
                        or
                        "Unable to initialize payment."
                    )

            }), 400


        # ====================================================
        # GET CHECKOUT LINK
        # ====================================================

        checkout_link = (

            flutterwave_data
            .get(
                "data",
                {}
            )
            .get(
                "link"
            )

        )


        if not checkout_link:

            # Remove pending payment

            payments = load_payments()

            payments = [

                p

                for p in payments

                if p.get(
                    "txRef"
                ) != tx_ref

            ]

            save_payments(
                payments
            )


            return jsonify({

                "success": False,

                "message":
                    (
                        "Flutterwave did not "
                        "return a checkout link."
                    )

            }), 502


        # ====================================================
        # SUCCESS
        # ====================================================

        return jsonify({

            "success":
                True,

            "message":
                "Payment initialized successfully.",

            "payment": {

                "txRef":
                    tx_ref,

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

            "success":
                False,

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


                user_token = create_user_token(
                    safe_user
                )

                return jsonify({
                    "success": True,
                    "message": "Login successful!",
                    "user": safe_user,
                    "token": user_token
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
    ) or {}

    if not data.get("token"):

        return jsonify({
            "success": False,
            "message": "Google token is required."
        }), 400

    token = data["token"]

    try:

        # ====================================================
        # VERIFY GOOGLE TOKEN
        # ====================================================

        google_user = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            "599126937366-3ahr3cnmf73mpsci0rdqvb3bmmg6hqb2.apps.googleusercontent.com"
        )

        # ====================================================
        # GET GOOGLE USER INFORMATION
        # ====================================================

        email = str(
            google_user.get(
                "email",
                ""
            )
        ).strip().lower()

        name = str(
            google_user.get(
                "name",
                email.split("@")[0]
            )
        ).strip()

        if not email:

            return jsonify({
                "success": False,
                "message": "Google account email could not be verified."
            }), 400

        # ====================================================
        # LOAD USERS
        # ====================================================

        users = load_json_file(
            "users.json",
            []
        )

        # ====================================================
        # CHECK EXISTING USER
        # ====================================================

        for user in users:

            if str(
                user.get(
                    "email",
                    ""
                )
            ).strip().lower() == email:

                # --------------------------------------------
                # CHECK ACCOUNT STATUS
                # --------------------------------------------

                if user.get(
                    "status"
                ) == "suspended":

                    return jsonify({
                        "success": False,
                        "message": (
                            "Your account has been suspended. "
                            "Contact support."
                        )
                    }), 403

                # --------------------------------------------
                # REMOVE PASSWORD BEFORE SENDING TO FRONTEND
                # --------------------------------------------

                safe_user = user.copy()

                safe_user.pop(
                    "password",
                    None
                )

                user_token = create_user_token(
                    safe_user
                )

                return jsonify({
                    "success": True,
                    "user": safe_user,
                    "token": user_token
                }), 200

        # ====================================================
        # CREATE NEW GOOGLE ACCOUNT
        # ====================================================

        new_user = {

            "id":
                int(
                    time.time() * 1000
                ),

            "name":
                name,

            "email":
                email,

            "provider":
                "google",

            "role":
                "user",

            "status":
                "active",

            "verifiedHost":
                False,

            "hostMode":
                False

        }

        users.append(
            new_user
        )

        save_json_file(
            "users.json",
            users
        )

        # ====================================================
        # RETURN NEW USER
        # ====================================================

        user_token = create_user_token(
            new_user
        )

        return jsonify({
            "success": True,
            "user": new_user,
            "token": user_token
        }), 200

    except Exception as e:

        print(
            "GOOGLE LOGIN ERROR:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message": "Unable to authenticate with Google."
        }), 400


# ============================================================
# CREATE EVENT
#
# Supports:
# - Normal verified/community hosts
# - Official EventWaa admin events
#
# ADMIN EVENTS:
# adminEvent=true
#
# Admin-created events do NOT require a host account.
# They are automatically:
# - owned by EventWaa
# - verified
# - published
# ============================================================

@app.route(
    "/events",
    methods=["POST"]
)
def create_event():

    settings = load_admin_settings()

    data = request.form.to_dict()

    # ========================================================
    # CHECK IF THIS IS AN OFFICIAL EVENTWAA EVENT
    # ========================================================

    is_admin_event = (
        str(
            data.get(
                "adminEvent",
                ""
            )
        ).lower()
        == "true"
    )

    # ========================================================
    # TICKET TYPES
    # ========================================================

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

            return jsonify({
                "success": False,
                "message": "Invalid ticket data."
            }), 400

    # ========================================================
    # EVENT TYPE
    # ========================================================

    event_type = data.get(
        "eventType",
        "Paid"
    )

    is_paid_event = (
        str(event_type).lower()
        == "paid"
    )

    # ========================================================
    # HOST INFORMATION
    #
    # ADMIN EVENT:
    # No real host account is required.
    #
    # NORMAL EVENT:
    # Existing host verification system remains unchanged.
    # ========================================================

    if is_admin_event:

        host_id = 0

        host_name = "EventWaa"

        host_email = "admin@eventwaa.com"

        host_verified = True

    else:

        # ----------------------------------------------------
        # NORMAL HOST
        # ----------------------------------------------------

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

        host_name = data.get(
            "hostName",
            host.get(
                "name",
                ""
            )
        )

        host_email = data.get(
            "hostEmail",
            host.get(
                "email",
                ""
            )
        )

        host_verified = bool(
            host.get(
                "verifiedHost",
                False
            )
        )

        # ----------------------------------------------------
        # HOST VERIFICATION
        # ----------------------------------------------------

        host_verification_required = settings.get(
            "hostVerification",
            True
        )

        community_hosts_allowed = settings.get(
            "communityHosts",
            False
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

    # ========================================================
    # VALIDATE TICKETS
    # ========================================================

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

                "name":
                    name,

                "price":
                    str(ticket_price),

                "quantity":
                    str(ticket_quantity),

                "remaining":
                    str(ticket_quantity)

            })

        if not cleaned_tickets:

            return jsonify({
                "success": False,
                "message": (
                    "A paid event must have "
                    "at least one ticket type."
                )
            }), 400

        tickets = cleaned_tickets

    else:

        # ----------------------------------------------------
        # FREE EVENT
        # ----------------------------------------------------

        capacity_value = data.get(
            "capacity",
            0
        )

        try:

            free_quantity = int(
                float(
                    capacity_value
                )
            )

        except (
            ValueError,
            TypeError
        ):

            free_quantity = 0

        tickets = [{
            "name": "Free Entry",
            "price": "0",
            "quantity": str(
                free_quantity
            ),
            "remaining": free_quantity
        }]

    # ========================================================
    # POSTER UPLOAD
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

            poster.save(
                filepath
            )

            poster_url = (
                f"/uploads/events/{filename}"
            )

    # ========================================================
    # LOAD EVENTS
    # ========================================================

    events = load_json_file(
        "events.json",
        []
    )

    # ========================================================
    # GENERATE EVENT ID
    # ========================================================

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

    # ========================================================
    # FEATURED
    # ========================================================

    featured_value = (
        str(
            data.get(
                "featured",
                "false"
            )
        ).lower()
        == "true"
    )

    # ========================================================
    # CREATE EVENT
    # ========================================================

    event = {

        "id":
            event_id,

        "title":
            data.get(
                "title",
                ""
            ),

        "description":
            data.get(
                "description",
                ""
            ),

        "venue":
            data.get(
                "venue",
                ""
            ),

        "city":
            data.get(
                "city",
                ""
            ),

        "category":
            data.get(
                "category",
                ""
            ),

        "date":
            data.get(
                "date",
                ""
            ),

        "startTime":
            data.get(
                "startTime",
                ""
            ),

        "endTime":
            data.get(
                "endTime",
                ""
            ),

        "capacity":
            data.get(
                "capacity",
                ""
            ),

        "contact":
            data.get(
                "contact",
                ""
            ),

        "eventType":
            event_type,

        "ticketType":
            (
                "Free"
                if str(event_type).lower() == "free"
                else "Paid"
            ),

        "tickets":
            tickets,

        "organizerName":
            (
                "EventWaa"
                if is_admin_event
                else data.get(
                    "organizerName",
                    ""
                )
            ),

        "hostId":
            host_id,

        "hostName":
            host_name,

        "hostEmail":
            host_email,

        "verifiedHost":
            host_verified,

        "adminEvent":
            is_admin_event,

        "eventPoster":
            poster_url,

        "image":
            poster_url,

        "ticketsSold":
            0,

        "revenue":
            0,

        "attendees":
            0,

        "status":
            "published",

        "featured":
            featured_value,

        "createdAt":
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )

    }

    # ========================================================
    # SAVE
    # ========================================================

    events.append(
        event
    )

    save_json_file(
        "events.json",
        events
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return jsonify({

        "success":
            True,

        "message":
            (
                "Official EventWaa event "
                "published successfully."
                if is_admin_event
                else
                "Event published successfully."
            ),

        "event":
            event

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
#
# Supports:
# - Normal event information
# - Ticket types
# - Existing poster
# - New poster upload
#
# IMPORTANT:
# If no new poster is uploaded, the existing poster is kept.
#
# If a new poster is uploaded, it replaces the poster URL
# stored on the event.
# ============================================================

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

    # ========================================================
    # FIND EVENT
    # ========================================================

    event = None

    for existing_event in events:

        try:

            if int(
                existing_event.get(
                    "id",
                    0
                )
            ) == event_id:

                event = existing_event
                break

        except (
            ValueError,
            TypeError
        ):

            continue

    if not event:

        return jsonify({
            "success": False,
            "message": "Event not found."
        }), 404

    # ========================================================
    # READ FORM DATA
    #
    # Edit requests use multipart/form-data because a poster
    # may be uploaded.
    # ========================================================

    data = request.form.to_dict()

    # ========================================================
    # EXISTING IMPORTANT EVENT DATA
    #
    # These values must NOT accidentally disappear when an
    # event is edited.
    # ========================================================

    existing_tickets_sold = event.get(
        "ticketsSold",
        0
    )

    existing_revenue = event.get(
        "revenue",
        0
    )

    existing_checked_in = event.get(
        "checkedIn",
        0
    )

    existing_status = event.get(
        "status",
        "published"
    )

    existing_featured = event.get(
        "featured",
        False
    )

    existing_host_id = event.get(
        "hostId",
        ""
    )

    existing_host_name = event.get(
        "hostName",
        ""
    )

    existing_host_email = event.get(
        "hostEmail",
        ""
    )

    existing_verified_host = event.get(
        "verifiedHost",
        False
    )

    existing_poster = (
        event.get("eventPoster")
        or event.get("image")
        or ""
    )

    # ========================================================
    # BASIC EVENT FIELDS
    # ========================================================

    editable_fields = [
        "title",
        "description",
        "venue",
        "city",
        "category",
        "date",
        "startTime",
        "endTime",
        "capacity",
        "contact",
        "eventType",
        "organizerName"
    ]

    for field in editable_fields:

        if field in data:

            event[field] = data.get(
                field,
                ""
            )

    # ========================================================
    # EVENT TYPE
    # ========================================================

    event_type = str(
        data.get(
            "eventType",
            event.get(
                "eventType",
                "Paid"
            )
        )
    ).strip()

    event["eventType"] = event_type

    # Keep the existing ticketType compatibility field.
    event["ticketType"] = (
        "Free"
        if event_type.lower() == "free"
        else "Paid"
    )

    # ========================================================
    # TICKET TYPES
    #
    # IMPORTANT:
    # Existing ticket inventory is preserved when editing.
    #
    # For each ticket type:
    #
    # already_sold =
    #     old_quantity - old_remaining
    #
    # new_remaining =
    #     new_quantity - already_sold
    #
    # This prevents a host from reducing ticket capacity below
    # the number of tickets already sold.
    # ========================================================

    if "tickets" in data:

        tickets_raw = data.get(
            "tickets",
            ""
        )

        try:

            tickets = json.loads(
                tickets_raw
            )

        except (
            json.JSONDecodeError,
            TypeError
        ):

            return jsonify({
                "success": False,
                "message": "Invalid ticket data."
            }), 400

        if not isinstance(
            tickets,
            list
        ):

            tickets = []

        # --------------------------------------------------------
        # FREE EVENT
        # --------------------------------------------------------

        if event_type.lower() == "free":

            capacity_value = data.get(
                "capacity",
                event.get(
                    "capacity",
                    0
                )
            )

            try:

                free_quantity = int(
                    float(
                        capacity_value
                    )
                )

            except (
                ValueError,
                TypeError
            ):

                free_quantity = 0

            tickets = [{
                "name": "Free Entry",
                "price": "0",
                "quantity": str(
                    free_quantity
                ),
                "remaining": str(
                    free_quantity
                )
            }]

        # --------------------------------------------------------
        # PAID EVENT
        # --------------------------------------------------------

        else:

            cleaned_tickets = []

            # Existing ticket types from the event
            existing_tickets = event.get(
                "tickets",
                []
            )

            if not isinstance(
                existing_tickets,
                list
            ):

                existing_tickets = []

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

                # ------------------------------------------------
                # PRICE + QUANTITY
                # ------------------------------------------------

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

                # ------------------------------------------------
                # PRICE VALIDATION
                # ------------------------------------------------

                if ticket_price < 0:

                    return jsonify({
                        "success": False,
                        "message": (
                            f"Ticket price for '{name}' "
                            "cannot be negative."
                        )
                    }), 400

                # ------------------------------------------------
                # QUANTITY VALIDATION
                # ------------------------------------------------

                if ticket_quantity <= 0:

                    return jsonify({
                        "success": False,
                        "message": (
                            f"Ticket quantity for '{name}' "
                            "must be greater than zero."
                        )
                    }), 400

                # ------------------------------------------------
                # FIND OLD TICKET TYPE
                # ------------------------------------------------

                existing_ticket = None

                for old_ticket in existing_tickets:

                    if not isinstance(
                        old_ticket,
                        dict
                    ):

                        continue

                    old_name = str(
                        old_ticket.get(
                            "name",
                            ""
                        )
                    ).strip().lower()

                    if old_name == name.lower():

                        existing_ticket = old_ticket

                        break

                # ------------------------------------------------
                # CALCULATE ALREADY SOLD
                # ------------------------------------------------

                already_sold = 0

                if existing_ticket:

                    try:

                        old_quantity = int(
                            float(
                                existing_ticket.get(
                                    "quantity",
                                    0
                                )
                            )
                        )

                    except (
                        ValueError,
                        TypeError
                    ):

                        old_quantity = 0

                    try:

                        old_remaining = int(
                            float(
                                existing_ticket.get(
                                    "remaining",
                                    old_quantity
                                )
                            )
                        )

                    except (
                        ValueError,
                        TypeError
                    ):

                        old_remaining = old_quantity

                    already_sold = (
                        old_quantity -
                        old_remaining
                    )

                    # Never allow negative sold count.

                    if already_sold < 0:

                        already_sold = 0

                # ------------------------------------------------
                # PROTECT SOLD TICKETS
                # ------------------------------------------------

                if (
                    ticket_quantity
                    <
                    already_sold
                ):

                    return jsonify({
                        "success": False,
                        "message": (
                            f"Ticket quantity for '{name}' "
                            f"cannot be less than the "
                            f"{already_sold} tickets "
                            "already sold."
                        )
                    }), 400

                # ------------------------------------------------
                # CALCULATE REMAINING
                # ------------------------------------------------

                new_remaining = (
                    ticket_quantity -
                    already_sold
                )

                # ------------------------------------------------
                # SAVE TICKET
                # ------------------------------------------------

                cleaned_tickets.append({

                    "name":
                        name,

                    "price":
                        str(
                            ticket_price
                        ),

                    "quantity":
                        str(
                            ticket_quantity
                        ),

                    "remaining":
                        str(
                            new_remaining
                        )

                })

            if not cleaned_tickets:

                return jsonify({
                    "success": False,
                    "message": (
                        "A paid event must have "
                        "at least one ticket type."
                    )
                }), 400

            tickets = cleaned_tickets

        # --------------------------------------------------------
        # SAVE TICKETS
        # --------------------------------------------------------

        event["tickets"] = tickets

    else:

        # --------------------------------------------------------
        # NO TICKET DATA SENT
        #
        # Preserve the existing ticket structure exactly.
        # --------------------------------------------------------

        event["tickets"] = event.get(
            "tickets",
            []
        )

    # ========================================================
    # POSTER
    #
    # IMPORTANT:
    # Only replace the existing poster if a NEW file was
    # actually uploaded.
    #
    # If the host edits the event without selecting a poster,
    # the old poster remains.
    # ========================================================

    upload_folder = "uploads/events"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

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

            poster.save(
                filepath
            )

            poster_url = (
                f"/uploads/events/{filename}"
            )

            event["eventPoster"] = poster_url
            event["image"] = poster_url

        else:

            # No new file selected.
            # Keep the old poster.
            event["eventPoster"] = existing_poster
            event["image"] = existing_poster

    else:

        # No poster field/file.
        # Preserve existing poster.
        event["eventPoster"] = existing_poster
        event["image"] = existing_poster

    # ========================================================
    # PRESERVE IMPORTANT EVENT ACCOUNTING DATA
    # ========================================================

    event["ticketsSold"] = existing_tickets_sold

    event["revenue"] = existing_revenue

    event["checkedIn"] = existing_checked_in

    # ========================================================
    # PRESERVE EVENT STATUS
    # ========================================================

    event["status"] = existing_status

    event["featured"] = existing_featured

    # ========================================================
    # PRESERVE HOST INFORMATION
    # ========================================================

    event["hostId"] = existing_host_id

    event["hostName"] = existing_host_name

    event["hostEmail"] = existing_host_email

    event["verifiedHost"] = existing_verified_host

    # ========================================================
    # REMOVE OLD EVENT-LEVEL PRICE
    #
    # Ticket prices now live inside event["tickets"].
    # ========================================================

    event.pop(
        "price",
        None
    )

    # ========================================================
    # SAVE
    # ========================================================

    save_json_file(
        "events.json",
        events
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return jsonify({
        "success": True,
        "message": "Event updated successfully.",
        "event": event
    })


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
        os.path.join(
            app.root_path,
            "uploads",
        ),
        
        filename
    )
# ============================================================
# EVENT BOOKING COUNTER
# ============================================================

# ============================================================
# CHECK EVENT BOOKING / TICKET AVAILABILITY
#
# IMPORTANT:
# This route ONLY checks whether the requested tickets
# are available.
#
# It does NOT:
# - decrease ticket inventory
# - increase ticketsSold
# - increase event revenue
# - create a booking
# - update host wallet
# - update EventWaa wallet
#
# Those actions happen ONLY after Flutterwave payment
# has been successfully verified inside
# process_verified_payment().
# ============================================================

@app.route(
    "/events/<int:event_id>/book",
    methods=["PUT"]
)
def update_event_booking(event_id):

    try:

        # ====================================================
        # LOAD EVENTS
        # ====================================================

        events = load_json_file(
            "events.json",
            []
        )

        if not events:

            return jsonify({
                "success": False,
                "message": "No events found."
            }), 404


        # ====================================================
        # READ REQUEST DATA
        # ====================================================

        data = request.get_json(
            silent=True
        ) or {}


        # ====================================================
        # QUANTITY
        # ====================================================

        try:

            quantity = int(
                data.get(
                    "quantity",
                    1
                )
            )

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "success": False,
                "message": "Invalid ticket quantity."
            }), 400


        if quantity <= 0:

            return jsonify({
                "success": False,
                "message": (
                    "Ticket quantity must be "
                    "greater than zero."
                )
            }), 400


        # ====================================================
        # TICKET TYPE
        # ====================================================

        ticket_type = str(
            data.get(
                "ticketType",
                ""
            )
        ).strip()


        if not ticket_type:

            return jsonify({
                "success": False,
                "message": "Ticket type is required."
            }), 400


        # ====================================================
        # FIND EVENT
        # ====================================================

        event = None

        for current_event in events:

            if str(
                current_event.get(
                    "id",
                    ""
                )
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

        tickets = event.get(
            "tickets",
            []
        )


        if not isinstance(
            tickets,
            list
        ):

            return jsonify({
                "success": False,
                "message": (
                    "This event has no valid "
                    "ticket inventory."
                )
            }), 400


        selected_ticket = None


        for ticket in tickets:

            if str(
                ticket.get(
                    "name",
                    ""
                )
            ).strip().lower() == ticket_type.lower():

                selected_ticket = ticket

                break


        if not selected_ticket:

            return jsonify({
                "success": False,
                "message": (
                    "The selected ticket type "
                    "was not found."
                )
            }), 404


        # ====================================================
        # GET REMAINING TICKETS
        # ====================================================

        try:

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

        except (
            TypeError,
            ValueError
        ):

            remaining = 0


        # ====================================================
        # CHECK INVENTORY
        #
        # IMPORTANT:
        # We DO NOT decrease remaining here.
        #
        # Payment must be successful first.
        # ====================================================

        if remaining < quantity:

            return jsonify({
                "success": False,
                "message": (
                    f"Only {remaining} "
                    f"tickets remaining."
                ),
                "remaining": remaining
            }), 400


        # ====================================================
        # GET TICKET PRICE
        # ====================================================

        try:

            ticket_price = int(
                float(
                    selected_ticket.get(
                        "price",
                        0
                    )
                    or 0
                )
            )

        except (
            TypeError,
            ValueError
        ):

            ticket_price = 0


        # ====================================================
        # SUCCESS
        #
        # Nothing is permanently changed here.
        #
        # process_verified_payment() will perform the
        # actual inventory/accounting update after
        # Flutterwave confirms payment.
        # ====================================================

        return jsonify({

            "success": True,

            "message":
                "Tickets are available.",

            "eventId":
                event_id,

            "ticketType":
                ticket_type,

            "quantity":
                quantity,

            "ticketPrice":
                ticket_price,

            "remaining":
                remaining

        }), 200


    except Exception as e:

        print(
            "UPDATE EVENT BOOKING ERROR:",
            repr(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to check ticket availability."

        }), 500


# ============================================================
# CANCEL EVENT
#
# Host cancellation:
# - Cancels the event without deleting it
# - Ignores the normal refund window
# - Gives full ticket-subtotal refunds
# - Charges NO refund fee
# - Reverses host earnings
# - Reverses EventWaa commission/service-fee accounting
# - Invalidates all affected tickets
# - Preserves cancellation/refund history
# ============================================================

@app.route("/events/<int:event_id>/cancel", methods=["POST"])
def cancel_event(event_id):

    data = request.get_json() or {}

    host_email = str(
        data.get("hostEmail", "")
    ).strip().lower()

    cancellation_reason = str(
        data.get(
            "reason",
            "Event cancelled by host"
        )
    ).strip()

    if not cancellation_reason:
        cancellation_reason = "Event cancelled by host"

    # ========================================================
    # LOAD DATA
    # ========================================================

    events = load_json_file("events.json", [])
    bookings = load_json_file("bookings.json", [])
    refunds = load_json_file("refunds.json", [])
    host_wallets = load_json_file("host_wallets.json", [])
    users = load_json_file("users.json", [])

    admin_wallet = load_json_file(
        "wallet.json",
        {
            "availableBalance": 0,
            "totalCommission": 0,
            "totalServiceFees": 0,
            "totalRevenue": 0,
            "transactions": []
        }
    )

    # ========================================================
    # FIND EVENT
    # ========================================================

    event = next(
        (
            e for e in events
            if str(e.get("id")) == str(event_id)
        ),
        None
    )

    if not event:
        return {
            "success": False,
            "message": "Event not found."
        }, 404

    # ========================================================
    # HOST AUTHORIZATION
    # ========================================================

    event_host_email = str(
        event.get("hostEmail", "")
    ).strip().lower()

    if not host_email:
        return {
            "success": False,
            "message": "Host email is required."
        }, 400

    if host_email != event_host_email:
        return {
            "success": False,
            "message": "You are not authorized to cancel this event."
        }, 403

    # ========================================================
    # ALREADY CANCELLED
    # ========================================================

    if str(event.get("status", "")).lower() == "cancelled":

        return {
            "success": True,
            "message": "Event is already cancelled.",
            "event": event
        }, 200

    # ========================================================
    # FIND BOOKINGS FOR THIS EVENT
    # ========================================================

    event_bookings = [
        booking
        for booking in bookings
        if str(booking.get("eventId")) == str(event_id)
    ]

    # ========================================================
    # IDENTIFY BOOKINGS THAT STILL NEED REFUNDING
    # ========================================================

    refundable_bookings = []

    already_refunded = 0

    for booking in event_bookings:

        refund_status = str(
            booking.get("refundStatus", "")
        ).lower()

        if refund_status == "refunded":
            already_refunded += 1
            continue

        refundable_bookings.append(booking)

    # ========================================================
    # PRE-CHECK WALLET FUNDS
    #
    # We do this BEFORE changing the event status.
    # This protects against cancelling an event halfway through
    # because the host wallet cannot cover the refunds.
    # ========================================================

    settings = load_admin_settings()

    commission_percent = float(
        settings.get("commission", 10) or 0
    )

    commission_percent = max(
        0,
        min(100, commission_percent)
    )

    total_host_refund_required = 0
    total_platform_reversal_required = 0

    for booking in refundable_bookings:

        original_amount = int(
            float(
                booking.get(
                    "subtotal",
                    booking.get("ticketPrice", 0)
                ) or 0
            )
        )

        if original_amount <= 0:
            continue

        host_original_amount = int(
            round(
                original_amount
                -
                (
                    original_amount
                    * commission_percent
                    / 100
                )
            )
        )

        service_fee = int(
            round(
                float(
                    booking.get(
                        "serviceFee",
                        0
                    ) or 0
                )
            )
        )

        total_host_refund_required += host_original_amount

        total_platform_reversal_required += (
            original_amount
            - host_original_amount
            + service_fee
        )

    # ========================================================
    # FIND HOST WALLET
    # ========================================================

    host_id = event.get("hostId")

    host_wallet = next(
        (
            wallet for wallet in host_wallets
            if str(wallet.get("hostId")) == str(host_id)
        ),
        None
    )

    # If the event has paid bookings, the host wallet must exist.
    if total_host_refund_required > 0 and not host_wallet:

        return {
            "success": False,
            "message": (
                "The host wallet could not be found. "
                "The event was not cancelled."
            )
        }, 400

    # ========================================================
    # CHECK HOST WALLET TOTAL FUNDS
    # ========================================================

    if host_wallet:

        available_balance = float(
            host_wallet.get(
                "availableBalance",
                0
            ) or 0
        )

        pending_payouts = float(
            host_wallet.get(
                "pendingPayouts",
                0
            ) or 0
        )

        host_total_available = (
            available_balance
            + pending_payouts
        )

        if (
            total_host_refund_required
            > host_total_available
        ):

            return {
                "success": False,
                "message": (
                    "The host wallet does not have enough "
                    "funds to process all event cancellation "
                    "refunds. The event was not cancelled."
                ),
                "required": total_host_refund_required,
                "available": host_total_available
            }, 400

    # ========================================================
    # CHECK EVENTWAA WALLET
    # ========================================================

    platform_available = float(
        admin_wallet.get(
            "availableBalance",
            0
        ) or 0
    )

    if (
        total_platform_reversal_required
        > platform_available
    ):

        return {
            "success": False,
            "message": (
                "EventWaa does not currently have enough "
                "platform balance to reverse the fees for "
                "this cancellation. The event was not cancelled."
            ),
            "required": total_platform_reversal_required,
            "available": platform_available
        }, 400

    # ========================================================
    # PROCESS REFUNDS
    # ========================================================

    processed_refunds = 0
    total_refunded = 0
    free_bookings_cancelled = 0

    for booking in refundable_bookings:

        original_amount = int(
            float(
                booking.get(
                    "subtotal",
                    booking.get("ticketPrice", 0)
                ) or 0
            )
        )

        # ====================================================
        # FREE BOOKING
        #
        # No money needs to move, but the ticket must become
        # invalid because the event has been cancelled.
        # ====================================================

        if original_amount <= 0:

            refund_ids = [
                int(r.get("id"))
                for r in refunds
                if str(r.get("id", "")).isdigit()
            ]

            next_refund_id = (
                max(refund_ids) + 1
                if refund_ids
                else 1
            )

            zero_refund = {
                "id": next_refund_id,
                "bookingId": booking.get("id"),
                "eventId": event.get("id"),
                "eventTitle": event.get("title"),
                "buyer": booking.get("buyer"),
                "quantity": booking.get("quantity", 0),
                "originalAmount": 0,
                "refundFeePercent": 0,
                "refundFee": 0,
                "amount": 0,
                "refundAmount": 0,
                "hostRefundAmount": 0,
                "hostId": host_id,
                "hostEmail": event_host_email,
                "source": "event_cancellation",
                "status": "refunded",
                "reason": cancellation_reason,
                "requestedAt": datetime.now().isoformat(),
                "processedAt": datetime.now().isoformat(),
                "reviewedAt": datetime.now().isoformat(),
                "processedBy": host_email,
                "reviewedBy": host_email,
                "cancellation": True
            }

            refunds.append(zero_refund)

            booking["refundStatus"] = "refunded"
            booking["refundId"] = next_refund_id
            booking["refundAmount"] = 0
            booking["refundFee"] = 0
            booking["refundFeePercent"] = 0
            booking["refundedAt"] = datetime.now().isoformat()

            for ticket in booking.get("tickets", []):

                ticket["refundStatus"] = "refunded"
                ticket["refundedAt"] = datetime.now().isoformat()

            free_bookings_cancelled += 1

            try:
                create_notification(
                    booking.get("buyer"),
                    "Event cancelled",
                    (
                        f"{event.get('title', 'Your event')} "
                        f"has been cancelled. "
                        f"Your free ticket is no longer valid."
                    ),
                    "refund"
                )
            except Exception:
                pass

            continue

        # ====================================================
        # FIND EXISTING PENDING REFUND
        #
        # If the customer already requested a refund, we reuse
        # that refund record and convert it into a cancellation
        # refund.
        # ====================================================

        existing_refund = next(
            (
                r for r in refunds
                if str(r.get("bookingId"))
                == str(booking.get("id"))
                and str(r.get("status", "")).lower()
                == "pending"
            ),
            None
        )

        if existing_refund:

            refund = existing_refund

            refund["source"] = "event_cancellation"
            refund["reason"] = cancellation_reason
            refund["refundFeePercent"] = 0
            refund["refundFee"] = 0
            refund["amount"] = original_amount
            refund["refundAmount"] = original_amount
            refund["cancellation"] = True
            refund["requestedAt"] = (
                refund.get(
                    "requestedAt",
                    datetime.now().isoformat()
                )
            )

        else:

            refund_ids = [
                int(r.get("id"))
                for r in refunds
                if str(r.get("id", "")).isdigit()
            ]

            next_refund_id = (
                max(refund_ids) + 1
                if refund_ids
                else 1
            )

            refund = {
                "id": next_refund_id,
                "bookingId": booking.get("id"),
                "eventId": event.get("id"),
                "eventTitle": event.get("title"),
                "buyer": booking.get("buyer"),
                "quantity": booking.get("quantity", 0),
                "originalAmount": original_amount,
                "refundFeePercent": 0,
                "refundFee": 0,
                "amount": original_amount,
                "refundAmount": original_amount,
                "hostId": host_id,
                "hostEmail": event_host_email,
                "source": "event_cancellation",
                "status": "pending",
                "reason": cancellation_reason,
                "requestedAt": datetime.now().isoformat(),
                "cancellation": True
            }

            refunds.append(refund)

        # Save the refund before the processor loads refunds.json.
        save_json_file(
            "refunds.json",
            refunds
        )

        # ====================================================
        # PROCESS USING THE SAME SHARED REFUND ENGINE
        # ====================================================

        result, status_code = process_eventwaa_refund(

            refund=refund,

            booking=booking,

            event=event,

            cancellation=True,

            processed_by=host_email

        )

        if status_code >= 400:

            return {
                "success": False,
                "message": (
                    "A cancellation refund could not be "
                    "processed. The event was not marked "
                    "as cancelled."
                ),
                "refundError": result
            }, status_code

        processed_refunds += 1

        total_refunded += original_amount

    # ========================================================
    # MARK EVENT CANCELLED
    # ========================================================

    now = datetime.now().isoformat()

    event["status"] = "cancelled"
    event["cancelled"] = True
    event["cancelledAt"] = now
    event["cancelledBy"] = host_email
    event["cancellationReason"] = cancellation_reason

    # ========================================================
    # SAVE ALL DATA
    # ========================================================

    save_json_file(
        "bookings.json",
        bookings
    )

    save_json_file(
        "refunds.json",
        refunds
    )

    save_json_file(
        "events.json",
        events
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "success": True,
        "message": "Event cancelled successfully.",
        "eventId": event_id,
        "eventStatus": "cancelled",
        "processedRefunds": processed_refunds,
        "freeBookingsCancelled": free_bookings_cancelled,
        "alreadyRefunded": already_refunded,
        "totalRefunded": total_refunded,
        "refundFee": 0,
        "cancellation": True
    }, 200

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

    # Hosts must be allowed to issue/process refunds.
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
    #
    # DEFAULT = 5 DAYS
    #
    # ADMIN CAN CHANGE THIS USING:
    # settings["refundWindow"]
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

        refund_window = int(
            settings.get(
                "refundWindow",
                5
            )
        )

        # Prevent an invalid negative setting.
        if refund_window < 0:
            refund_window = 0

        if days_until_event < refund_window:

            return jsonify({
                "success": False,
                "message": (
                    "Refund requests must be made "
                    f"at least {refund_window} "
                    "days before the event."
                )
            }), 400

    except (
        ValueError,
        TypeError
    ):

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

    try:

        quantity = int(
            booking.get(
                "quantity",
                1
            ) or 1
        )

    except (
        ValueError,
        TypeError
    ):

        quantity = 1

    if quantity <= 0:
        quantity = 1

    # ========================================================
    # REFUND CALCULATION
    #
    # IMPORTANT:
    #
    # booking["subtotal"] = ticket amount
    # booking["serviceFee"] = EventWaa service fee
    # booking["totalPrice"] = host/event accounting amount
    #
    # Therefore the customer refund is based on SUBTOTAL.
    # ========================================================

    try:

        original_amount = int(
            float(
                booking.get(
                    "subtotal",
                    0
                ) or 0
            )
        )

    except (
        ValueError,
        TypeError
    ):

        original_amount = 0

    if original_amount <= 0:

        return jsonify({
            "success": False,
            "message": (
                "This booking does not have a valid "
                "refundable ticket amount."
            )
        }), 400

    # ========================================================
    # REFUND FEE
    #
    # DEFAULT = 20%
    # ADMIN CONTROLLED
    # ========================================================

    try:

        refund_fee_percent = float(
            settings.get(
                "refundFeePercent",
                20
            )
        )

    except (
        ValueError,
        TypeError
    ):

        refund_fee_percent = 20

    # Keep the setting within a safe range.
    refund_fee_percent = max(
        0,
        min(
            100,
            refund_fee_percent
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
    # LOAD REFUNDS
    # ========================================================

    refunds = load_json_file(
        "refunds.json",
        []
    )

    # ========================================================
    # SAFE REFUND ID
    # ========================================================

    existing_ids = []

    for existing_refund in refunds:

        try:

            existing_ids.append(
                int(
                    existing_refund.get(
                        "id",
                        0
                    )
                )
            )

        except (
            ValueError,
            TypeError
        ):

            continue

    refund_id = (
        max(existing_ids)
        + 1
        if existing_ids
        else 1
    )

    # ========================================================
    # HOST INFORMATION
    #
    # Store this now so the refund record remains
    # self-contained.
    # ========================================================

    host_id = event.get(
        "hostId"
    )

    host_email = event.get(
        "hostEmail"
    )

    host_name = event.get(
        "hostName",
        event.get(
            "host",
            ""
        )
    )

    # ========================================================
    # CREATE REFUND RECORD
    # ========================================================

    created_at = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

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

        "hostId": host_id,

        "hostEmail": host_email,

        "hostName": host_name,

        "buyer": booking.get(
            "buyer"
        ),

        "ticketType": booking.get(
            "ticketType"
        ),

        "quantity": quantity,

        # ====================================================
        # ORIGINAL REFUNDABLE TICKET AMOUNT
        # ====================================================

        "originalAmount": original_amount,

        # ====================================================
        # REFUND POLICY
        # ====================================================

        "refundFeePercent": refund_fee_percent,

        "refundFee": refund_fee,

        "amount": refund_amount,

        # ====================================================
        # SOURCE
        # ====================================================

        "source": "customer_request",

        # ====================================================
        # CUSTOMER REQUEST
        # ====================================================

        "reason": reason,

        "details": details,

        # ====================================================
        # HOST REVIEW
        # ====================================================

        "status": "pending",

        "createdAt": created_at
    }

    # ========================================================
    # SAVE NEW REFUND REQUEST
    # ========================================================

    refunds.append(
        refund
    )

    save_json_file(
        "refunds.json",
        refunds
    )

    # ========================================================
    # AUTOMATIC REFUND APPROVAL
    #
    # If enabled in Admin Settings, the refund is processed
    # immediately using the SAME processor used by host
    # approval.
    #
    # This prevents separate accounting logic for:
    # - automatic refunds
    # - host-approved refunds
    # - event-cancellation refunds
    # ========================================================

    auto_refund_approval = bool(
        settings.get(
            "autoRefundApproval",
            False
        )
    )

    if auto_refund_approval:

        result, status_code = process_eventwaa_refund(

            refund=refund,

            booking=booking,

            event=event,

            cancellation=False,

            processed_by="system"

        )

        return result, status_code

    # ========================================================
    # NORMAL MANUAL REVIEW FLOW
    # ========================================================

    create_notification(
        host_email,
        "New refund request",
        (
            f"A refund request has been submitted for "
            f"{event.get('title', 'your event')}."
        ),
        "refund"
    )

    return {
        "success": True,
        "message": (
            "Refund request submitted and is "
            "waiting for host approval."
        ),
        "autoApproved": False,
        "refund": refund
    }, 201


# ============================================================
# REFUND HELPERS
# ============================================================

def refund_booking_money(
    booking,
    event,
    cancellation=False
):

    settings = load_admin_settings()

    # ========================================================
    # CUSTOMER REFUND IS BASED ON TICKET SUBTOTAL
    #
    # NOT:
    # - service fee
    # - customer total
    # - host accounting totalPrice
    # ========================================================

    try:

        original_amount = int(
            float(
                booking.get(
                    "subtotal",
                    booking.get(
                        "ticketPrice",
                        0
                    )
                )
                or 0
            )
        )

    except (
        ValueError,
        TypeError
    ):

        original_amount = 0

    if original_amount < 0:
        original_amount = 0

    # ========================================================
    # REFUND FEE
    #
    # Normal customer-requested refund:
    #     Use Admin refundFeePercent.
    #
    # Host cancellation:
    #     No customer refund penalty.
    # ========================================================

    if cancellation:

        refund_fee_percent = 0

    else:

        try:

            refund_fee_percent = float(
                settings.get(
                    "refundFeePercent",
                    20
                )
            )

        except (
            ValueError,
            TypeError
        ):

            refund_fee_percent = 20

    # Safety
    refund_fee_percent = max(
        0,
        min(
            100,
            refund_fee_percent
        )
    )

    # ========================================================
    # CALCULATE REFUND
    # ========================================================

    refund_fee = int(
        round(
            original_amount
            * refund_fee_percent
            / 100
        )
    )

    refund_amount = max(
        0,
        original_amount - refund_fee
    )

    # ========================================================
    # RETURN CONSISTENT REFUND DATA
    # ========================================================

    return {

        "originalAmount":
            original_amount,

        "refundFeePercent":
            refund_fee_percent,

        "refundFee":
            refund_fee,

        "refundAmount":
            refund_amount,

        # Keep this temporarily for compatibility with
        # existing code that may already read totalAmount.
        "totalAmount":
            refund_amount,

        "cancellation":
            bool(cancellation)
    }




# ============================================================
# COMMON REFUND PROCESSOR
#
# SHARED BY:
# - Host-approved customer refunds
# - Automatically approved refunds
# - Event cancellation refunds
#
# cancellation=False:
#     Normal customer refund.
#     Admin refund fee applies.
#
# cancellation=True:
#     Host/event cancellation.
#     Customer receives the full ticket subtotal.
#     No refund fee.
#
# IMPORTANT:
# This function performs EventWaa's INTERNAL accounting.
# Actual Flutterwave/PesaPal money reversal is separate.
# ============================================================

def process_eventwaa_refund(
    refund,
    booking,
    event,
    cancellation=False,
    processed_by=""
):

    now = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    settings = load_admin_settings()

    # ========================================================
    # BASIC VALIDATION
    # ========================================================

    if not booking:
        return {
            "success": False,
            "message": "Booking not found."
        }, 404

    if not event:
        return {
            "success": False,
            "message": "Event not found."
        }, 404

    current_refund_status = str(
        refund.get(
            "status",
            ""
        )
    ).strip().lower()

    if current_refund_status == "refunded":
        return {
            "success": True,
            "message": "Refund has already been processed.",
            "alreadyProcessed": True,
            "refund": refund
        }, 200

    if current_refund_status not in (
        "pending",
        "approved"
    ):
        return {
            "success": False,
            "message": (
                "This refund cannot be processed "
                "from its current status."
            )
        }, 400

    # ========================================================
    # DO NOT REFUND CHECKED-IN TICKETS
    #
    # Event cancellation is still allowed to refund them.
    # The host cancelled the event, so the customer should
    # not lose their money because they had already checked in.
    # ========================================================

    if (
        not cancellation
        and booking.get(
            "checkedIn",
            False
        )
    ):

        return {
            "success": False,
            "message": (
                "Checked-in tickets cannot be refunded."
            )
        }, 400

    # ========================================================
    # LOAD FILES
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    events = load_json_file(
        "events.json",
        []
    )

    refunds = load_json_file(
        "refunds.json",
        []
    )

    host_wallets = load_host_wallets()

    admin_wallet = load_wallet()

    # ========================================================
    # FIND THE CURRENT STORED BOOKING
    # ========================================================

    booking_id = booking.get(
        "id"
    )

    stored_booking = None

    for current_booking in bookings:

        if str(
            current_booking.get(
                "id"
            )
        ) == str(
            booking_id
        ):

            stored_booking = current_booking

            break

    if not stored_booking:

        return {
            "success": False,
            "message": "Booking no longer exists."
        }, 404

    booking = stored_booking

    # ========================================================
    # FINAL DUPLICATE PROTECTION
    # ========================================================

    if str(
        booking.get(
            "refundStatus",
            ""
        )
    ).lower() == "refunded":

        refund["status"] = "refunded"

        return {
            "success": True,
            "message": "Booking has already been refunded.",
            "alreadyProcessed": True,
            "refund": refund
        }, 200

    # ========================================================
    # CALCULATE REFUND
    # ========================================================

    money = refund_booking_money(
        booking,
        event,
        cancellation=cancellation
    )

    original_amount = int(
        money.get(
            "originalAmount",
            0
        )
        or 0
    )

    refund_fee_percent = float(
        money.get(
            "refundFeePercent",
            0
        )
        or 0
    )

    refund_fee = int(
        money.get(
            "refundFee",
            0
        )
        or 0
    )

    refund_amount = int(
        money.get(
            "refundAmount",
            money.get(
                "totalAmount",
                0
            )
        )
        or 0
    )

    if original_amount <= 0:
        return {
            "success": False,
            "message": (
                "This booking does not contain "
                "a refundable ticket amount."
            )
        }, 400

    if refund_amount <= 0:
        return {
            "success": False,
            "message": (
                "Calculated refund amount is invalid."
            )
        }, 400

    # ========================================================
    # HOST ACCOUNTING
    #
    # Normal customer refund:
    # Host refund is limited to the host's original net share.
    #
    # Event cancellation:
    # Customer receives the full ticket subtotal.
    # The host contributes the original host earning.
    # EventWaa's commission is also reversed below.
    # ========================================================

    try:

        host_id = int(
            event.get(
                "hostId"
            )
        )

    except (
        TypeError,
        ValueError
    ):

        return {
            "success": False,
            "message": "Event host ID is invalid."
        }, 400

    commission_percent = float(
        settings.get(
            "commission",
            10
        )
        or 0
    )

    if commission_percent < 0:
        commission_percent = 0

    if commission_percent > 100:
        commission_percent = 100

    host_original_amount = int(
        round(
            original_amount
            -
            (
                original_amount
                *
                commission_percent
                /
                100
            )
        )
    )

    if cancellation:

        host_refund_amount = host_original_amount

        # The platform's original commission must also be
        # reversed because the customer receives the entire
        # ticket subtotal.
        platform_commission_reversal = (
            original_amount
            -
            host_original_amount
        )

    else:

        host_refund_amount = min(
            host_original_amount,
            refund_amount
        )

        # Normal refunds retain EventWaa's commission.
        platform_commission_reversal = 0

    # ========================================================
    # FIND HOST WALLET
    # ========================================================

    host_wallet = None

    for wallet in host_wallets:

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

        return {
            "success": False,
            "message": (
                "Host wallet was not found."
            )
        }, 404

    available_balance = int(
        host_wallet.get(
            "availableBalance",
            0
        )
        or 0
    )

    pending_balance = int(
        host_wallet.get(
            "pendingPayouts",
            0
        )
        or 0
    )

    host_total_funds = (
        available_balance
        +
        pending_balance
    )

    if host_total_funds < host_refund_amount:

        return {
            "success": False,
            "message": (
                "The host does not have enough "
                "funds to process this refund."
            ),
            "required":
                host_refund_amount,
            "available":
                host_total_funds
        }, 400

    # ========================================================
    # DEDUCT HOST FUNDS
    #
    # Available funds are used first.
    # Remaining amount comes from pending payouts.
    # ========================================================

    available_used = min(
        available_balance,
        host_refund_amount
    )

    remaining_host_refund = (
        host_refund_amount
        -
        available_used
    )

    pending_used = min(
        pending_balance,
        remaining_host_refund
    )

    remaining_host_refund -= pending_used

    if remaining_host_refund > 0:

        return {
            "success": False,
            "message": (
                "Unable to reconcile the host "
                "wallet for this refund."
            )
        }, 400

    host_wallet["availableBalance"] = max(
        0,
        available_balance
        -
        available_used
    )

    host_wallet["pendingPayouts"] = max(
        0,
        pending_balance
        -
        pending_used
    )

    host_wallet["totalEarned"] = max(
        0,
        int(
            host_wallet.get(
                "totalEarned",
                0
            )
            or 0
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
            or 0
        )
        +
        host_refund_amount
    )

    # ========================================================
    # IMPORTANT:
    # REDUCE SCHEDULED PAYOUTS TOO
    #
    # pendingPayouts is only the aggregate number.
    # scheduledPayouts contains the actual future payout
    # records, so the same refunded money must not become
    # available later.
    #
    # Your current scheduled payout records do not contain
    # booking IDs, so we reconcile by payout amount.
    # ========================================================

    if pending_used > 0:

        amount_to_remove = pending_used

        scheduled_payouts = host_wallet.setdefault(
            "scheduledPayouts",
            []
        )

        for payout in scheduled_payouts:

            if amount_to_remove <= 0:
                break

            payout_amount = int(
                payout.get(
                    "amount",
                    0
                )
                or 0
            )

            if payout_amount <= 0:
                continue

            deduction = min(
                payout_amount,
                amount_to_remove
            )

            payout["amount"] = (
                payout_amount
                -
                deduction
            )

            amount_to_remove -= deduction

        # Remove empty scheduled payouts.
        host_wallet["scheduledPayouts"] = [
            payout
            for payout in scheduled_payouts
            if int(
                payout.get(
                    "amount",
                    0
                )
                or 0
            ) > 0
        ]

        if amount_to_remove > 0:

            return {
                "success": False,
                "message": (
                    "Pending refund could not be fully "
                    "matched against scheduled payouts."
                )
            }, 400

    # ========================================================
    # HOST REFUND TRANSACTION
    # ========================================================

    host_wallet.setdefault(
        "transactions",
        []
    )

    host_wallet["transactions"].insert(

        0,

        {

            "type":
                "refund",

            "eventId":
                event.get(
                    "id"
                ),

            "eventTitle":
                event.get(
                    "title",
                    ""
                ),

            "bookingId":
                booking.get(
                    "id"
                ),

            "amount":
                -host_refund_amount,

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

            "cancellation":
                bool(cancellation),

            "date":
                now,

            "description":
                (
                    "Event cancellation refund"
                    if cancellation
                    else
                    "Customer refund"
                )

        }
    )

    # ========================================================
    # EVENTWAA PLATFORM WALLET
    #
    # Normal refund:
    # - Commission remains with EventWaa.
    # - Refund fee remains with EventWaa.
    #
    # Cancellation:
    # - Commission must be reversed.
    # - Service fee must also be reversed because the
    #   customer receives the full ticket subtotal, not
    #   the original service fee.
    #
    # Therefore cancellation reverses the original
    # EventWaa commission + service fee.
    # ========================================================

    if cancellation:

        original_service_fee = int(
            booking.get(
                "serviceFee",
                0
            )
            or 0
        )

        platform_reversal = (
            platform_commission_reversal
            +
            original_service_fee
        )

        admin_available = int(
            admin_wallet.get(
                "availableBalance",
                0
            )
            or 0
        )

        if admin_available < platform_reversal:

            return {
                "success": False,
                "message": (
                    "EventWaa does not have enough "
                    "available balance to reverse "
                    "the platform earnings."
                ),
                "required":
                    platform_reversal,
                "available":
                    admin_available
            }, 400

        admin_wallet["availableBalance"] = (
            admin_available
            -
            platform_reversal
        )

        admin_wallet["totalCommission"] = max(
            0,
            int(
                admin_wallet.get(
                    "totalCommission",
                    0
                )
                or 0
            )
            -
            platform_commission_reversal
        )

        admin_wallet["totalServiceFees"] = max(
            0,
            int(
                admin_wallet.get(
                    "totalServiceFees",
                    0
                )
                or 0
            )
            -
            original_service_fee
        )

        admin_wallet["totalRevenue"] = max(
            0,
            int(
                admin_wallet.get(
                    "totalRevenue",
                    0
                )
                or 0
            )
            -
            platform_reversal
        )

        admin_wallet.setdefault(
            "transactions",
            []
        )

        admin_wallet["transactions"].insert(

            0,

            {

                "type":
                    "event_cancellation_refund",

                "eventId":
                    event.get(
                        "id"
                    ),

                "eventTitle":
                    event.get(
                        "title",
                        ""
                    ),

                "bookingId":
                    booking.get(
                        "id"
                    ),

                "amount":
                    -platform_reversal,

                "commissionReversed":
                    platform_commission_reversal,

                "serviceFeeReversed":
                    original_service_fee,

                "date":
                    now

            }
        )

    # ========================================================
    # UPDATE BOOKING
    # ========================================================

    booking["refundStatus"] = "refunded"

    booking["refundId"] = (
        refund.get(
            "id"
        )
    )

    booking["refundedAt"] = now

    booking["refundAmount"] = (
        refund_amount
    )

    booking["refundFee"] = (
        refund_fee
    )

    booking["refundFeePercent"] = (
        refund_fee_percent
    )

    # ========================================================
    # INVALIDATE INDIVIDUAL TICKETS
    #
    # One refunded ticket must not remain usable.
    # ========================================================

    if isinstance(
        booking.get(
            "tickets"
        ),
        list
    ):

        for ticket in booking["tickets"]:

            ticket["refundStatus"] = "refunded"

            ticket["refundedAt"] = now

    # ========================================================
    # UPDATE REFUND RECORD
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

    refund["availableUsed"] = (
        available_used
    )

    refund["pendingUsed"] = (
        pending_used
    )

    refund["cancellation"] = (
        bool(cancellation)
    )

    refund["source"] = (
        "event_cancellation"
        if cancellation
        else
        refund.get(
            "source",
            "customer_request"
        )
    )

    refund["processedAt"] = now

    refund["reviewedAt"] = now

    if processed_by:

        refund["processedBy"] = (
            processed_by
        )

        refund["reviewedBy"] = (
            processed_by
        )

    # ========================================================
    # UPDATE EVENT
    #
    # IMPORTANT:
    # The verified-payment fulfillment function stores
    # event.revenue as GROSS ticket subtotal.
    #
    # We therefore reverse the ticket subtotal here.
    # ========================================================

    event_id = event.get(
        "id"
    )

    stored_event = None

    for current_event in events:

        if str(
            current_event.get(
                "id"
            )
        ) == str(
            event_id
        ):

            stored_event = current_event

            break

    if stored_event:

        quantity = int(
            booking.get(
                "quantity",
                1
            )
            or 1
        )

        stored_event["ticketsSold"] = max(
            0,
            int(
                stored_event.get(
                    "ticketsSold",
                    0
                )
                or 0
            )
            -
            quantity
        )

        stored_event["revenue"] = max(
            0,
            int(
                stored_event.get(
                    "revenue",
                    0
                )
                or 0
            )
            -
            original_amount
        )

        # Return tickets to inventory.
        for ticket_type in stored_event.get(
            "tickets",
            []
        ):

            if str(
                ticket_type.get(
                    "name",
                    ""
                )
            ).strip().lower() == str(
                booking.get(
                    "ticketType",
                    ""
                )
            ).strip().lower():

                ticket_type["remaining"] = (

                    int(
                        ticket_type.get(
                            "remaining",
                            0
                        )
                        or 0
                    )
                    +
                    quantity

                )

                break

    # ========================================================
    # SAVE ALL ACCOUNTING CHANGES
    # ========================================================

    save_host_wallets(
        host_wallets
    )

    save_wallet(
        admin_wallet
    )

    save_json_file(
        "bookings.json",
        bookings
    )

    save_json_file(
        "events.json",
        events
    )

    save_json_file(
        "refunds.json",
        refunds
    )

    # ========================================================
    # CUSTOMER NOTIFICATION
    # ========================================================

    buyer = booking.get(
        "buyer",
        {}
    )

    buyer_email = ""

    if isinstance(
        buyer,
        dict
    ):

        buyer_email = str(
            buyer.get(
                "email",
                ""
            )
        ).strip()

    buyer_name = ""

    if isinstance(
        buyer,
        dict
    ):

        buyer_name = str(
            buyer.get(
                "name",
                ""
            )
        ).strip()

    try:

        create_notification(

            buyer_email,

            "Refund processed",

            (
                f"Your refund of "
                f"{refund_amount:,} UGX for "
                f"{event.get('title', 'your event')} "
                f"has been processed."
            ),

            "refund"

        )

    except Exception:

        # Notification failure must not undo the
        # completed financial/accounting operation.
        pass

    # ========================================================
    # SUCCESS
    # ========================================================

    return {

        "success":
            True,

        "message":
            (
                "Event cancellation refund processed successfully."
                if cancellation
                else
                "Refund processed successfully."
            ),

        "alreadyProcessed":
            False,

        "refund":
            refund,

        "money":
            {

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

                "platformReversal":
                    (
                        platform_commission_reversal
                        +
                        int(
                            booking.get(
                                "serviceFee",
                                0
                            )
                            or 0
                        )
                        if cancellation
                        else 0
                    )

            },

        "wallet":
            {

                "hostAvailableBalance":
                    host_wallet.get(
                        "availableBalance",
                        0
                    ),

                "hostPendingPayouts":
                    host_wallet.get(
                        "pendingPayouts",
                        0
                    )

            }

    }, 200

# ============================================================
# HOST REVIEW REFUND
#
# Hosts can:
# - approve a pending refund
# - reject a pending refund
#
# APPROVAL IS DELEGATED TO:
#     process_eventwaa_refund()
#
# This keeps all refund accounting in one place.
# ============================================================

@app.route(
    "/refunds/<int:refund_id>/host-review",
    methods=["PUT"]
)
def host_review_refund(refund_id):

    data = request.get_json(
        silent=True
    ) or {}

    action = str(
        data.get(
            "action",
            ""
        )
    ).strip().lower()

    host_email = str(
        data.get(
            "hostEmail",
            ""
        )
    ).strip().lower()

    note = str(
        data.get(
            "note",
            ""
        )
    ).strip()

    # ========================================================
    # VALIDATE REQUEST
    # ========================================================

    if action not in (
        "approve",
        "reject"
    ):

        return {
            "success": False,
            "message": (
                "Action must be approve or reject."
            )
        }, 400

    if not host_email:

        return {
            "success": False,
            "message": (
                "Host email is required."
            )
        }, 400

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

    # ========================================================
    # FIND REFUND
    # ========================================================

    refund = None

    for current_refund in refunds:

        try:

            current_refund_id = int(
                current_refund.get(
                    "id",
                    0
                )
            )

        except (
            TypeError,
            ValueError
        ):

            current_refund_id = 0

        if current_refund_id == refund_id:

            refund = current_refund

            break

    if not refund:

        return {
            "success": False,
            "message": "Refund request not found."
        }, 404

    # ========================================================
    # ONLY PENDING REFUNDS CAN BE REVIEWED
    # ========================================================

    refund_status = str(
        refund.get(
            "status",
            ""
        )
    ).strip().lower()

    if refund_status != "pending":

        if refund_status == "refunded":

            return {
                "success": True,
                "message": (
                    "This refund has already been processed."
                ),
                "alreadyProcessed": True,
                "refund": refund
            }, 200

        return {
            "success": False,
            "message": (
                "This refund is no longer pending."
            ),
            "status": refund_status
        }, 400

    # ========================================================
    # FIND EVENT
    # ========================================================

    event = None

    for current_event in events:

        if str(
            current_event.get(
                "id"
            )
        ) == str(
            refund.get(
                "eventId"
            )
        ):

            event = current_event

            break

    if not event:

        return {
            "success": False,
            "message": (
                "The event associated with "
                "this refund was not found."
            )
        }, 404

    # ========================================================
    # VERIFY HOST
    #
    # The host must own the event associated with the refund.
    # ========================================================

    event_host_email = str(
        event.get(
            "hostEmail",
            ""
        )
    ).strip().lower()

    if (
        not event_host_email
        or
        event_host_email != host_email
    ):

        return {
            "success": False,
            "message": (
                "You are not authorized to review "
                "this refund request."
            )
        }, 403

    # ========================================================
    # FIND BOOKING
    # ========================================================

    booking = None

    for current_booking in bookings:

        if str(
            current_booking.get(
                "id"
            )
        ) == str(
            refund.get(
                "bookingId"
            )
        ):

            booking = current_booking

            break

    if not booking:

        return {
            "success": False,
            "message": (
                "The booking associated with "
                "this refund was not found."
            )
        }, 404

    # ========================================================
    # REJECT REFUND
    #
    # Rejection does not touch wallets, inventory,
    # revenue, or tickets.
    # ========================================================

    if action == "reject":

        refund["status"] = "rejected"

        refund["reviewedAt"] = (
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        refund["processedAt"] = None

        refund["reviewedBy"] = (
            host_email
        )

        refund["processedBy"] = (
            host_email
        )

        refund["reviewNote"] = (
            note
        )

        booking["refundStatus"] = (
            "rejected"
        )

        booking["refundRejectedAt"] = (
            refund["reviewedAt"]
        )

        booking["refundReviewNote"] = (
            note
        )

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
            "buyer",
            {}
        )

        buyer_email = ""

        if isinstance(
            buyer,
            dict
        ):

            buyer_email = str(
                buyer.get(
                    "email",
                    ""
                )
            ).strip()

        if buyer_email:

            try:

                create_notification(

                    buyer_email,

                    "Refund request rejected",

                    (
                        f"Your refund request for "
                        f"{event.get('title', 'your event')} "
                        f"was rejected by the host."
                    ),

                    "refund"

                )

            except Exception:

                pass

        return {

            "success":
                True,

            "message":
                "Refund request rejected.",

            "refund":
                refund

        }, 200

    # ========================================================
    # APPROVE REFUND
    #
    # ALL FINANCIAL PROCESSING NOW HAPPENS IN THE
    # COMMON REFUND PROCESSOR.
    # ========================================================

    result, status_code = process_eventwaa_refund(

        refund=refund,

        booking=booking,

        event=event,

        cancellation=False,

        processed_by=host_email

    )

    # ========================================================
    # ADD HOST REVIEW NOTE
    #
    # The processor has already saved the refund.
    # We update the note and save once more.
    # ========================================================

    if (
        status_code == 200
        and
        isinstance(
            result,
            dict
        )
        and
        result.get(
            "success"
        )
    ):

        refund["reviewNote"] = (
            note
        )

        refund["reviewedBy"] = (
            host_email
        )

        refund["processedBy"] = (
            host_email
        )

        refund["reviewedAt"] = (
            refund.get(
                "reviewedAt"
            )
            or
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )

        save_json_file(
            "refunds.json",
            refunds
        )

    # ========================================================
    # RETURN PROCESSOR RESULT
    # ========================================================

    return result, status_code


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
    methods=["GET", "POST"]
)
def create_booking():
    if request.method == "GET":

        bookings = load_json_file(
            "bookings.json",
            []
        )

        return jsonify({
            "success": True,
            "bookings": bookings
        }), 200

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

    # ============================================================
    # BLOCK BOOKINGS FOR CANCELLED EVENTS
    # ============================================================

    if str(event.get("status", "")).lower() == "cancelled":

        return {
            "success": False,
            "message": (
                "This event has been cancelled. "
                "New bookings are no longer available."
            ),
            "eventCancelled": True
        }, 400

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
# DELETE INDIVIDUAL PAST TICKET
#
# IMPORTANT:
#
# This deletes ONLY ONE individual ticket.
#
# If a booking contains:
#
# booking
#   tickets:
#       Ticket 1
#       Ticket 2
#       Ticket 3
#       Ticket 4
#       Ticket 5
#
# and the user deletes Ticket 3,
# only Ticket 3 is removed.
#
# The other 4 tickets remain.
#
# ONLY PAST EVENTS SHOULD BE DELETED.
# ============================================================

@app.route(
    "/bookings/ticket/<ticket_id>",
    methods=["DELETE"]
)
def delete_past_ticket(ticket_id):

    bookings = load_json_file(
        "bookings.json",
        []
    )

    if not isinstance(
        bookings,
        list
    ):
        bookings = []

    ticket_id = str(
        ticket_id or ""
    ).strip()

    if not ticket_id:
        return jsonify({
            "success": False,
            "message": "Ticket ID is required."
        }), 400

    found_ticket = None
    parent_booking = None

    # ========================================================
    # FIND INDIVIDUAL TICKET
    # ========================================================

    for booking in bookings:

        if not isinstance(
            booking,
            dict
        ):
            continue

        booking_tickets = booking.get(
            "tickets",
            []
        )

        if not isinstance(
            booking_tickets,
            list
        ):
            continue

        for individual_ticket in booking_tickets:

            if not isinstance(
                individual_ticket,
                dict
            ):
                continue

            existing_ticket_id = str(
                individual_ticket.get(
                    "ticketId",
                    ""
                )
            ).strip()

            if (
                existing_ticket_id
                == ticket_id
            ):

                found_ticket = (
                    individual_ticket
                )

                parent_booking = booking

                break

        if found_ticket:
            break

    # ========================================================
    # LEGACY SINGLE TICKET
    # ========================================================

    if not found_ticket:

        for booking in bookings:

            if not isinstance(
                booking,
                dict
            ):
                continue

            existing_ticket_id = str(
                booking.get(
                    "ticketId",
                    ""
                )
            ).strip()

            if (
                existing_ticket_id
                == ticket_id
            ):

                found_ticket = booking
                parent_booking = booking

                break

    # ========================================================
    # NOT FOUND
    # ========================================================

    if not found_ticket:

        return jsonify({
            "success": False,
            "message": "Ticket not found."
        }), 404

    # ========================================================
    # DETERMINE EVENT DATE
    # ========================================================

    event_date = (
        parent_booking.get(
            "eventDate"
        )
        or
        parent_booking.get(
            "date"
        )
        or
        found_ticket.get(
            "eventDate"
        )
        or
        found_ticket.get(
            "date"
        )
    )

    # ========================================================
    # REQUIRE EVENT DATE
    # ========================================================

    if not event_date:

        return jsonify({
            "success": False,
            "message": (
                "This ticket cannot be deleted "
                "because the event date could not "
                "be determined."
            )
        }), 400

    # ========================================================
    # CHECK EVENT HAS PASSED
    # ========================================================

    try:

        event_datetime = datetime.fromisoformat(
            str(event_date).replace(
                "Z",
                ""
            )
        )

    except ValueError:

        return jsonify({
            "success": False,
            "message": (
                "This ticket cannot be deleted "
                "because the event date is invalid."
            )
        }), 400

    if event_datetime >= datetime.now():

        return jsonify({
            "success": False,
            "message": (
                "Only tickets for past events "
                "can be deleted."
            )
        }), 400

    # ========================================================
    # DO NOT DELETE REFUNDED TICKET THROUGH THIS ROUTE
    #
    # Refund handling remains separate.
    # ========================================================

    refund_status = str(
        found_ticket.get(
            "refundStatus",
            ""
        )
        or ""
    ).strip().lower()

    if refund_status == "refunded":

        return jsonify({
            "success": False,
            "message": (
                "Refunded tickets cannot be "
                "deleted from this endpoint."
            )
        }), 400

    # ========================================================
    # NEW INDIVIDUAL TICKET STRUCTURE
    # ========================================================

    booking_tickets = parent_booking.get(
        "tickets"
    )

    if isinstance(
        booking_tickets,
        list
    ):

        original_length = len(
            booking_tickets
        )

        parent_booking["tickets"] = [

            individual_ticket

            for individual_ticket
            in booking_tickets

            if str(
                individual_ticket.get(
                    "ticketId",
                    ""
                )
            ).strip()
            !=
            ticket_id

        ]

        # ====================================================
        # SAFETY CHECK
        # ====================================================

        if len(
            parent_booking["tickets"]
        ) == original_length:

            return jsonify({
                "success": False,
                "message": "Ticket could not be deleted."
            }), 404

        # ====================================================
        # SAVE
        # ====================================================

        save_json_file(
            "bookings.json",
            bookings
        )

        return jsonify({

            "success": True,

            "message":
                "Past ticket deleted successfully.",

            "ticketId":
                ticket_id

        }), 200

    # ========================================================
    # LEGACY BOOKING
    #
    # If this old booking represents only one ticket,
    # remove the booking.
    # ========================================================

    try:

        bookings.remove(
            parent_booking
        )

    except ValueError:

        return jsonify({
            "success": False,
            "message": "Ticket could not be deleted."
        }), 404

    save_json_file(
        "bookings.json",
        bookings
    )

    return jsonify({

        "success": True,

        "message":
            "Past ticket deleted successfully.",

        "ticketId":
            ticket_id

    }), 200

# ============================================================
# ATTENDANCE
#
# FREE ATTENDANCE PASS
#
# One free pass = one attendee = one entry.
# A used pass cannot be used again.
# Cancelled events cannot accept new free attendance.
# ============================================================

@app.route(
    "/attendance",
    methods=["POST"]
)
def create_attendance():

    data = request.get_json(
        silent=True
    ) or {}


    # ========================================================
    # GET EVENT ID
    # ========================================================

    event_id = data.get(
        "eventId"
    )


    # ========================================================
    # LOAD EVENTS
    # ========================================================

    events = load_json_file(
        "events.json",
        []
    )

    if not isinstance(
        events,
        list
    ):

        events = []


    # ========================================================
    # FIND EVENT
    # ========================================================

    event = None

    for current_event in events:

        if not isinstance(
            current_event,
            dict
        ):

            continue

        if str(
            current_event.get("id", "")
        ).strip() == str(
            event_id or ""
        ).strip():

            event = current_event

            break


    # ========================================================
    # EVENT MUST EXIST
    # ========================================================

    if not event:

        return jsonify({

            "success":
                False,

            "message":
                "Event not found."

        }), 404


    # ========================================================
    # BLOCK FREE ATTENDANCE FOR CANCELLED EVENTS
    # ========================================================

    if str(
        event.get("status", "")
    ).strip().lower() == "cancelled":

        return jsonify({

            "success":
                False,

            "message": (
                "This event has been cancelled. "
                "Free attendance registration is no longer available."
            ),

            "eventCancelled":
                True

        }), 400


    # ========================================================
    # LOAD ATTENDANCE
    # ========================================================

    attendance = load_attendance()


    if not isinstance(
        attendance,
        list
    ):

        attendance = []


    # ========================================================
    # GENERATE ONE PASS ID
    # ========================================================

    pass_id = (
        f"FW{int(time.time() * 1000)}"
    )


    ticket_id = (
        f"FREE-{pass_id}"
    )


    # ========================================================
    # CREATE ATTENDANCE RECORD
    #
    # ONE FREE PASS = ONE ENTRY
    # ========================================================

    record = {

        "id":
            len(attendance) + 1,

        "eventId":
            event_id,

        "eventTitle":
            event.get(
                "title",
                data.get(
                    "eventTitle"
                )
            ),

        "name":
            data.get(
                "name"
            ),

        "email":
            data.get(
                "email"
            ),

        # ----------------------------------------------------
        # PASS IDENTIFIERS
        # ----------------------------------------------------

        "passId":
            pass_id,

        "ticketId":
            ticket_id,

        # ----------------------------------------------------
        # ENTRY TRACKING
        #
        # One pass can only be successfully checked in once.
        # ----------------------------------------------------

        "checkedIn":
            False,

        "checkInCount":
            0,

        "checkInLimit":
            1,

        "checkInHistory":
            [],

        # ----------------------------------------------------
        # CREATED TIME
        # ----------------------------------------------------

        "createdAt":
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )

    }


    # ========================================================
    # SAVE ATTENDANCE
    # ========================================================

    attendance.append(
        record
    )


    save_attendance(
        attendance
    )


    # ========================================================
    # UPDATE EVENT ATTENDEE COUNT
    # ========================================================

    event["attendees"] = (

        int(
            event.get(
                "attendees",
                0
            )
        )
        +
        1

    )


    save_json_file(
        "events.json",
        events
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return jsonify({

        "success":
            True,

        "attendance":
            record

    }), 201


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


# ============================================================
# GET ATTENDEES FOR EVENT
# ============================================================

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


    return jsonify(
        attendees
    )


# ============================================================
# GET ONE ATTENDANCE PASS
# ============================================================

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

            return jsonify(
                person
            )


    return jsonify({

        "success":
            False,

        "message":
            "Attendance pass not found"

    }), 404


# ============================================================
# VERIFY ENTRY
#
# Supports:
# - Main EventWaa Admin: scans any event
# - Host Team: scans assigned host events only
# - Admin Team: scans assigned admin-team events only
#
# IMPORTANT:
# One individual ticket/pass = one entry.
# ============================================================

@app.route(
    "/verify-entry/<entry_id>",
    methods=["PUT"]
)
def verify_entry(entry_id):

    data = request.get_json(
        silent=True
    ) or {}

    event_id = str(
        data.get("eventId", "")
        or ""
    ).strip()

    admin_scan = bool(
        data.get("adminScan", False)
    )

    # ========================================================
    # AUTHENTICATION
    # ========================================================

    auth_user = verify_admin_or_team_token()

    if not auth_user:

        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    role = str(
        auth_user.get("role", "")
        or ""
    ).strip().lower()

    user = auth_user.get(
        "user",
        {}
    )

    if not isinstance(user, dict):

        return jsonify({
            "success": False,
            "message": "Invalid authenticated account."
        }), 401

    team_type = str(
        user.get("teamType", "")
        or ""
    ).strip().lower()

    # ========================================================
    # MAIN ADMIN
    #
    # Main admin may scan tickets from ANY event.
    # ========================================================

    is_main_admin = (
        role == "admin"
    )

    # ========================================================
    # TEAM AUTHENTICATION
    # ========================================================

    is_host_team = (
        role == "team"
        and team_type == "host"
    )

    is_admin_team = (
        role == "team"
        and team_type == "admin"
    )

    if role == "team":

        if not (
            is_host_team
            or
            is_admin_team
        ):

            return jsonify({
                "success": False,
                "message": "Invalid team account."
            }), 403

    # ========================================================
    # ADMIN SCAN FLAG
    #
    # Only the MAIN ADMIN may use adminScan=True.
    # ========================================================

    if admin_scan and not is_main_admin:

        return jsonify({
            "success": False,
            "message":
                "Only the main EventWaa admin "
                "may perform a global scan."
        }), 403

    # ========================================================
    # EVENT ID
    #
    # Main admin may scan globally.
    # Team scanners must provide an event.
    # ========================================================

    if not is_main_admin and not event_id:

        return jsonify({
            "success": False,
            "message":
                "Event ID is required for team scanning."
        }), 400

    # ========================================================
    # LOAD EVENTS
    # ========================================================

    events = load_json_file(
        "events.json",
        []
    )

    if not isinstance(events, list):

        events = []

    selected_event = None

    if event_id:

        for event in events:

            if not isinstance(event, dict):

                continue

            stored_event_id = str(
                event.get("id", "")
                or event.get("eventId", "")
                or ""
            ).strip()

            if stored_event_id == event_id:

                selected_event = event

                break

        if selected_event is None:

            return jsonify({
                "success": False,
                "message": "Event not found."
            }), 404

    # ========================================================
    # TEAM EVENT AUTHORIZATION
    #
    # Main admin: global access.
    # Host team: assigned host events.
    # Admin team: assigned admin-team events.
    # ========================================================

    if not is_main_admin:

        allowed_event_ids = []

        # ----------------------------------------------------
        # HOST TEAM ASSIGNMENTS
        # ----------------------------------------------------

        if is_host_team:

            raw_event_ids = user.get(
                "eventIds",
                []
            )

            if isinstance(
                raw_event_ids,
                list
            ):

                allowed_event_ids.extend(
                    raw_event_ids
                )

            single_event_id = user.get(
                "eventId"
            )

            if single_event_id:

                allowed_event_ids.append(
                    single_event_id
                )

            # Also support the verified member record.
            member_record = user.get(
                "teamMemberRecord",
                {}
            )

            if isinstance(
                member_record,
                dict
            ):

                member_event_ids = (
                    member_record.get(
                        "eventIds",
                        []
                    )
                )

                if isinstance(
                    member_event_ids,
                    list
                ):

                    allowed_event_ids.extend(
                        member_event_ids
                    )

                member_event_id = (
                    member_record.get(
                        "eventId"
                    )
                )

                if member_event_id:

                    allowed_event_ids.append(
                        member_event_id
                    )

        # ----------------------------------------------------
        # ADMIN TEAM ASSIGNMENTS
        #
        # Uses the actual admin-team member record.
        # ----------------------------------------------------

        elif is_admin_team:

            member_record = user.get(
                "teamMemberRecord",
                {}
            )

            if isinstance(
                member_record,
                dict
            ):

                raw_event_ids = (
                    member_record.get(
                        "eventIds",
                        []
                    )
                )

                if isinstance(
                    raw_event_ids,
                    list
                ):

                    allowed_event_ids.extend(
                        raw_event_ids
                    )

                single_event_id = (
                    member_record.get(
                        "eventId"
                    )
                )

                if single_event_id:

                    allowed_event_ids.append(
                        single_event_id
                    )

            # Also support assignments copied directly
            # onto the verified account.
            raw_event_ids = user.get(
                "eventIds",
                []
            )

            if isinstance(
                raw_event_ids,
                list
            ):

                allowed_event_ids.extend(
                    raw_event_ids
                )

            single_event_id = user.get(
                "eventId"
            )

            if single_event_id:

                allowed_event_ids.append(
                    single_event_id
                )

        # ----------------------------------------------------
        # NORMALIZE ASSIGNMENT IDS
        # ----------------------------------------------------

        normalized_allowed_ids = {
            str(item).strip()
            for item in allowed_event_ids
            if item is not None
            and str(item).strip()
        }

        if event_id not in normalized_allowed_ids:

            return jsonify({
                "success": False,
                "message":
                    "You are not assigned to this event."
            }), 403

    # ========================================================
    # NORMALIZE ENTRY ID
    # ========================================================

    normalized_entry_id = str(
        entry_id or ""
    ).strip()

    if not normalized_entry_id:

        return jsonify({
            "success": False,
            "message": "Entry ID is required."
        }), 400

    current_time = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    # ========================================================
    # SEARCH PAID INDIVIDUAL TICKETS
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    if not isinstance(bookings, list):

        bookings = []

    found_ticket = None
    found_booking = None
    found_event_id = ""

    for booking in bookings:

        if not isinstance(booking, dict):

            continue

        booking_event_id = str(
            booking.get("eventId", "")
            or ""
        ).strip()

        tickets = booking.get(
            "tickets",
            []
        )

        if not isinstance(tickets, list):

            continue

        for ticket in tickets:

            if not isinstance(ticket, dict):

                continue

            ticket_id = str(
                ticket.get("ticketId", "")
                or ""
            ).strip()

            if ticket_id != normalized_entry_id:

                continue

            found_ticket = ticket
            found_booking = booking
            found_event_id = booking_event_id

            break

        if found_ticket is not None:

            break

    # ========================================================
    # SEARCH FREE ATTENDANCE PASSES
    # ========================================================

    found_attendee = None
    attendance = []

    if found_ticket is None:

        attendance = load_json_file(
            "attendance.json",
            []
        )

        if not isinstance(
            attendance,
            list
        ):

            attendance = []

        for attendee in attendance:

            if not isinstance(
                attendee,
                dict
            ):

                continue

            attendee_ticket_id = str(
                attendee.get("ticketId", "")
                or ""
            ).strip()

            attendee_pass_id = str(
                attendee.get("passId", "")
                or ""
            ).strip()

            possible_ids = {
                attendee_ticket_id,
                attendee_pass_id,
                f"FREE-{attendee_pass_id}"
            }

            if normalized_entry_id not in possible_ids:

                continue

            found_attendee = attendee

            found_event_id = str(
                attendee.get("eventId", "")
                or ""
            ).strip()

            break

    # ========================================================
    # ENTRY NOT FOUND
    # ========================================================

    if (
        found_ticket is None
        and
        found_attendee is None
    ):

        return jsonify({
            "success": False,
            "message": "Ticket or attendance pass not found."
        }), 404

    # ========================================================
    # EVENT MATCHING
    #
    # Main admin may scan globally.
    # Team scanners must match the selected event.
    # ========================================================

    if not is_main_admin:

        if found_event_id != event_id:

            return jsonify({
                "success": False,
                "message":
                    "This entry does not belong "
                    "to this event."
            }), 403

    # ========================================================
    # CANCELLED EVENT CHECK
    #
    # Cancelled events cannot accept any entry.
    # ========================================================

    if selected_event is not None:

        if str(
            selected_event.get("status", "")
        ).strip().lower() == "cancelled":

            return jsonify({

                "success": False,

                "message":
                    "This event has been cancelled. "
                    "Entry is no longer allowed.",

                "eventCancelled": True

            }), 400

    # ========================================================
    # REFUND CHECK
    # ========================================================

    if found_ticket is not None:

        refund_status = str(
            found_ticket.get(
                "refundStatus",
                found_booking.get(
                    "refundStatus",
                    ""
                ) if isinstance(
                    found_booking,
                    dict
                ) else ""
            )
            or ""
        ).strip().lower()

        if refund_status in (
            "refunded",
            "approved",
            "completed"
        ):

            return jsonify({
                "success": False,
                "message":
                    "This ticket has been refunded."
            }), 400

    else:

        refund_status = str(
            found_attendee.get(
                "refundStatus",
                ""
            )
            or ""
        ).strip().lower()

        if refund_status in (
            "refunded",
            "approved",
            "completed"
        ):

            return jsonify({
                "success": False,
                "message":
                    "This attendance pass has been refunded."
            }), 400

    # ========================================================
    # ALREADY CHECKED IN
    # ========================================================

    if found_ticket is not None:

        if found_ticket.get(
            "checkedIn",
            False
        ):

            return jsonify({
                "success": False,
                "message":
                    "This ticket has already been used."
            }), 400

    else:

        if found_attendee.get(
            "checkedIn",
            False
        ):

            return jsonify({
                "success": False,
                "message":
                    "This attendance pass has already been used."
            }), 400

    # ========================================================
    # MARK ONE ENTRY AS USED
    # ========================================================

    if found_ticket is not None:

        found_ticket["checkedIn"] = True

        found_ticket["checkedInAt"] = (
            current_time
        )

        save_json_file(
            "bookings.json",
            bookings
        )

        event_title = str(
            found_booking.get(
                "eventTitle",
                found_booking.get(
                    "title",
                    ""
                )
            )
            or ""
        ).strip()

        buyer = found_ticket.get(
            "buyer",
            found_booking.get(
                "buyer",
                {}
            )
        )

        if not isinstance(
            buyer,
            dict
        ):

            buyer = {}

        return jsonify({
            "success": True,
            "message": "Ticket verified successfully.",
            "type": "paid",
            "entryId": normalized_entry_id,
            "event": {
                "eventId": found_event_id,
                "eventTitle": event_title
            },
            "ticket": {
                "ticketId": normalized_entry_id,
                "eventId": found_event_id,
                "eventTitle": event_title,
                "ticketType": found_ticket.get(
                    "ticketType",
                    "Paid ticket"
                ),
                "buyer": buyer,
                "checkedIn": True,
                "checkedInAt": current_time
            }
        }), 200

    # ========================================================
    # MARK FREE PASS AS USED
    # ========================================================

    found_attendee["checkedIn"] = True

    found_attendee["checkedInAt"] = (
        current_time
    )

    save_json_file(
        "attendance.json",
        attendance
    )

    event_title = str(
        found_attendee.get(
            "eventTitle",
            ""
        )
        or ""
    ).strip()

    buyer = {
        "name": found_attendee.get(
            "name",
            ""
        ),
        "email": found_attendee.get(
            "email",
            ""
        )
    }

    return jsonify({
        "success": True,
        "message":
            "Attendance pass verified successfully.",
        "type": "free",
        "entryId": normalized_entry_id,
        "event": {
            "eventId": found_event_id,
            "eventTitle": event_title
        },
        "attendee": {
            "ticketId": normalized_entry_id,
            "eventId": found_event_id,
            "eventTitle": event_title,
            "ticketType": "Free attendance pass",
            "buyer": buyer,
            "checkedIn": True,
            "checkedInAt": current_time
        }
    }), 200

# ============================================================
# GET TEAM MEMBER ACCESSIBLE EVENT IDS
#
# Shared by:
#   - Admin Team
#   - Host Team
#
# Uses the authenticated team account as the source of truth.
#
# Supports:
#   - Current eventIds[]
#   - Legacy eventId
#   - Admin Team assignments[]
#   - Admin Team event name -> events.json ID resolution
#
# IMPORTANT:
#   - Read-only
#   - Does NOT modify assignments
#   - Does NOT modify tickets
#   - Does NOT modify check-in status
# ============================================================

def get_team_accessible_event_ids(account):

    if not isinstance(account, dict):
        return None, "Invalid team account."


    # ========================================================
    # GET AUTHENTICATED MEMBER ID
    # ========================================================

    member_id = str(
        account.get(
            "memberId",
            account.get(
                "memberid",
                ""
            )
        ) or ""
    ).strip()


    if not member_id:
        return None, "Team member assignment could not be determined."


    # ========================================================
    # GET TEAM TYPE
    # ========================================================

    team_type = str(
        account.get(
            "teamType",
            ""
        ) or ""
    ).strip().lower()


    # ========================================================
    # LOAD EVENTS
    #
    # Needed because Admin Team assignments currently store
    # the event name instead of eventId.
    # ========================================================

    events = load_events()

    if not isinstance(events, list):
        events = []


    # ========================================================
    # FIND TEAM MEMBER RECORD
    # ========================================================

    team_member_record = None
    team_members = []


    # ========================================================
    # HOST TEAM
    # ========================================================

    if team_type == "host":

        team_members = load_team_members()

        if not isinstance(team_members, list):
            team_members = []


    # ========================================================
    # ADMIN TEAM
    # ========================================================

    elif team_type == "admin":

        team_members = load_admin_team_members()

        if not isinstance(team_members, list):
            team_members = []


    # ========================================================
    # IF TEAM TYPE IS MISSING
    #
    # Some existing team_accounts.json records do not contain
    # teamType. In that case, identify the member by checking
    # Admin Team first, then Host Team.
    # ========================================================

    else:

        admin_members = load_admin_team_members()

        if not isinstance(admin_members, list):
            admin_members = []


        host_members = load_team_members()

        if not isinstance(host_members, list):
            host_members = []


        # ----------------------------------------------------
        # Try Admin Team first
        # ----------------------------------------------------

        for member in admin_members:

            if not isinstance(member, dict):
                continue


            current_member_id = str(
                member.get(
                    "id",
                    member.get(
                        "memberId",
                        member.get(
                            "memberid",
                            ""
                        )
                    )
                ) or ""
            ).strip()


            if current_member_id == member_id:

                team_member_record = member
                team_type = "admin"

                break


        # ----------------------------------------------------
        # Try Host Team if Admin Team was not found
        # ----------------------------------------------------

        if team_member_record is None:

            for member in host_members:

                if not isinstance(member, dict):
                    continue


                current_member_id = str(
                    member.get(
                        "id",
                        member.get(
                            "memberId",
                            member.get(
                                "memberid",
                                ""
                            )
                        )
                    ) or ""
                ).strip()


                if current_member_id == member_id:

                    team_member_record = member
                    team_type = "host"

                    break


        # ----------------------------------------------------
        # Use the correct member list from here
        # ----------------------------------------------------

        if team_type == "admin":

            team_members = admin_members

        elif team_type == "host":

            team_members = host_members

        else:

            return None, "Invalid team account type."


    # ========================================================
    # FIND MEMBER BY MEMBER ID
    # ========================================================

    if team_member_record is None:

        for member in team_members:

            if not isinstance(member, dict):
                continue


            current_member_id = str(
                member.get(
                    "id",
                    member.get(
                        "memberId",
                        member.get(
                            "memberid",
                            ""
                        )
                    )
                ) or ""
            ).strip()


            if current_member_id == member_id:

                team_member_record = member

                break


    # ========================================================
    # EMAIL FALLBACK
    # ========================================================

    if team_member_record is None:

        account_email = str(
            account.get(
                "email",
                ""
            ) or ""
        ).strip().lower()


        if account_email:

            for member in team_members:

                if not isinstance(member, dict):
                    continue


                member_email = str(
                    member.get(
                        "email",
                        ""
                    ) or ""
                ).strip().lower()


                if (
                    member_email
                    and
                    member_email == account_email
                ):

                    team_member_record = member

                    break


    # ========================================================
    # MEMBER NOT FOUND
    # ========================================================

    if not isinstance(team_member_record, dict):

        return None, "Team member could not be found."


    # ========================================================
    # CHECK MEMBER STATUS
    # ========================================================

    member_status = str(
        team_member_record.get(
            "status",
            "Active"
        ) or "Active"
    ).strip().lower()


    if member_status != "active":

        return None, "This team account has been disabled."


    # ========================================================
    # GET EVENT IDS
    #
    # Works for Host Team and any Admin Team records that
    # already contain eventIds[].
    # ========================================================

    event_ids = team_member_record.get(
        "eventIds"
    )


    if not isinstance(event_ids, list):

        event_ids = []


    normalized_event_ids = []


    for event_id in event_ids:

        if event_id is None:
            continue


        event_id = str(
            event_id
        ).strip()


        if (
            event_id
            and
            event_id not in normalized_event_ids
        ):

            normalized_event_ids.append(
                event_id
            )


    # ========================================================
    # LEGACY EVENT ID SUPPORT
    # ========================================================

    old_event_id = str(
        team_member_record.get(
            "eventId",
            ""
        ) or ""
    ).strip()


    if (
        old_event_id
        and
        old_event_id not in normalized_event_ids
    ):

        normalized_event_ids.append(
            old_event_id
        )


    # ========================================================
    # ADMIN TEAM ASSIGNMENT SUPPORT
    #
    # Current Admin Team structure:
    #
    # "assignments": [
    #     {
    #         "event": "siaka festival",
    #         "host": "steward christo",
    #         "status": "Active",
    #         "unassignedAt": null
    #     }
    # ]
    #
    # Resolve the event name against events.json.
    # ========================================================

    if team_type == "admin":

        assignments = team_member_record.get(
            "assignments",
            []
        )


        if not isinstance(assignments, list):

            assignments = []


        for assignment in assignments:

            if not isinstance(assignment, dict):
                continue


            assignment_status = str(
                assignment.get(
                    "status",
                    "Active"
                ) or "Active"
            ).strip().lower()


            # Only current active assignments count.
            if assignment_status != "active":
                continue


            unassigned_at = assignment.get(
                "unassignedAt"
            )


            if unassigned_at not in (
                None,
                "",
                False
            ):
                continue


            # ------------------------------------------------
            # First support assignment.eventId if available
            # ------------------------------------------------

            assignment_event_id = str(
                assignment.get(
                    "eventId",
                    ""
                ) or ""
            ).strip()


            if (
                assignment_event_id
                and
                assignment_event_id not in normalized_event_ids
            ):

                normalized_event_ids.append(
                    assignment_event_id
                )

                continue


            # ------------------------------------------------
            # Current structure stores the EVENT NAME
            # ------------------------------------------------

            assignment_event_name = str(
                assignment.get(
                    "event",
                    ""
                ) or ""
            ).strip().lower()


            if not assignment_event_name:
                continue


            # ------------------------------------------------
            # Resolve event name against events.json
            # ------------------------------------------------

            for event in events:

                if not isinstance(event, dict):
                    continue


                event_id = str(
                    event.get(
                        "id",
                        ""
                    ) or ""
                ).strip()


                if not event_id:
                    continue


                event_title = str(
                    event.get(
                        "title",
                        ""
                    ) or ""
                ).strip().lower()


                event_name = str(
                    event.get(
                        "name",
                        ""
                    ) or ""
                ).strip().lower()


                if (
                    assignment_event_name == event_title
                    or
                    assignment_event_name == event_name
                ):

                    if event_id not in normalized_event_ids:

                        normalized_event_ids.append(
                            event_id
                        )

                    break


    # ========================================================
    # ADMIN TEAM LEGACY CURRENT EVENT
    #
    # Your current admin_team_members.json also contains:
    #
    # "event": "siaka festival"
    #
    # Support that field as a fallback.
    # ========================================================

    if team_type == "admin":

        current_event_name = str(
            team_member_record.get(
                "event",
                ""
            ) or ""
        ).strip().lower()


        if current_event_name:

            for event in events:

                if not isinstance(event, dict):
                    continue


                event_id = str(
                    event.get(
                        "id",
                        ""
                    ) or ""
                ).strip()


                if not event_id:
                    continue


                event_title = str(
                    event.get(
                        "title",
                        ""
                    ) or ""
                ).strip().lower()


                event_name = str(
                    event.get(
                        "name",
                        ""
                    ) or ""
                ).strip().lower()


                if (
                    current_event_name == event_title
                    or
                    current_event_name == event_name
                ):

                    if event_id not in normalized_event_ids:

                        normalized_event_ids.append(
                            event_id
                        )

                    break


    # ========================================================
    # FINAL RESULT
    # ========================================================

    return normalized_event_ids, None

# ============================================================
# TEAM TICKET / PASS LOOKUP
#
# READ-ONLY LOOKUP
#
# ONE INDIVIDUAL TICKET / PASS = ONE ENTRY
#
# IMPORTANT:
#
# This endpoint DOES NOT:
# - check in a ticket
# - modify check-in status
# - modify bookings
# - modify attendance
#
# It ONLY retrieves ticket/pass information.
#
# SECURITY:
#
# Host Team:
#   Can only access tickets from assigned event(s).
#
# Admin Team:
#   Can only access tickets from assigned event(s).
#
# Used by:
#   /admin/team-lookup
#   /team-lookup
# ============================================================

@app.route(
    "/team/ticket-lookup/<entry_id>",
    methods=["GET"]
)
@team_required
def team_ticket_lookup(account, entry_id):

    try:

        # ====================================================
        # GET TEAM ACCESSIBLE EVENTS
        # ====================================================

        allowed_event_ids, access_error = (
            get_team_accessible_event_ids(
                account
            )
        )


        if access_error:

            return jsonify({

                "success": False,

                "message":
                    access_error

            }), 403


        # ====================================================
        # NO ASSIGNED EVENTS
        # ====================================================

        if not allowed_event_ids:

            return jsonify({

                "success": False,

                "message":
                    "You are not assigned to any events."

            }), 403


        # ====================================================
        # CLEAN ENTRY ID
        # ====================================================

        entry_id = str(
            entry_id or ""
        ).strip()


        if not entry_id:

            return jsonify({

                "success": False,

                "message":
                    "Ticket or pass ID is required."

            }), 400


        # ====================================================
        # LOAD EVENTS
        # ====================================================

        events = load_json_file(
            "events.json",
            []
        )


        if not isinstance(
            events,
            list
        ):

            events = []


        # ====================================================
        # EVENT INFORMATION HELPER
        # ====================================================

        def get_event_information(event_id):

            matched_event = None


            for existing_event in events:

                if not isinstance(
                    existing_event,
                    dict
                ):

                    continue


                if str(
                    existing_event.get(
                        "id",
                        ""
                    )
                ) == str(event_id):

                    matched_event = existing_event

                    break


            # ------------------------------------------------
            # EVENT NOT FOUND
            # ------------------------------------------------

            if not matched_event:

                return {

                    "eventId":
                        event_id,

                    "eventTitle":
                        "",

                    "adminEvent":
                        False,

                    "hostId":
                        "",

                    "hostName":
                        "",

                    "hostEmail":
                        "",

                    "verifiedHost":
                        False

                }


            # ------------------------------------------------
            # ADMIN EVENT
            # ------------------------------------------------

            is_admin_event = (

                str(
                    matched_event.get(
                        "adminEvent",
                        False
                    )
                ).lower()
                == "true"

                or

                matched_event.get(
                    "adminEvent",
                    False
                ) is True

            )


            return {

                "eventId":
                    matched_event.get(
                        "id",
                        event_id
                    ),

                "eventTitle":
                    matched_event.get(
                        "title",
                        ""
                    ),

                "adminEvent":
                    is_admin_event,

                "hostId":
                    matched_event.get(
                        "hostId",
                        ""
                    ),

                "hostName":
                    (
                        "EventWaa"
                        if is_admin_event
                        else
                        matched_event.get(
                            "hostName",
                            ""
                        )
                    ),

                "hostEmail":
                    matched_event.get(
                        "hostEmail",
                        ""
                    ),

                "verifiedHost":
                    bool(
                        matched_event.get(
                            "verifiedHost",
                            False
                        )
                    )

            }


        # ====================================================
        # FREE ATTENDANCE PASS
        # ====================================================

        if entry_id.startswith("FREE-"):

            attendance = load_attendance()

            person = None


            # ------------------------------------------------
            # FIND PASS
            # ------------------------------------------------

            for attendee in attendance:

                if not isinstance(
                    attendee,
                    dict
                ):

                    continue


                ticket_id = str(

                    attendee.get(
                        "ticketId",
                        ""
                    )

                ).strip()


                pass_id = str(

                    attendee.get(
                        "passId",
                        ""
                    )

                ).strip()


                if ticket_id == entry_id:

                    person = attendee

                    break


                if (
                    f"FREE-{pass_id}"
                    ==
                    entry_id
                ):

                    person = attendee

                    break


            # ------------------------------------------------
            # NOT FOUND
            # ------------------------------------------------

            if not person:

                return jsonify({

                    "success": False,

                    "message":
                        "Attendance pass not found."

                }), 404


            # =================================================
            # EVENT ID
            # =================================================

            event_id = str(

                person.get(
                    "eventId",
                    ""
                ) or ""

            ).strip()


            # =================================================
            # SECURITY CHECK
            #
            # Team member MUST be assigned to this event.
            # =================================================

            if event_id not in allowed_event_ids:

                return jsonify({

                    "success": False,

                    "message":
                        "You are not authorized to access this ticket."

                }), 403


            # =================================================
            # EVENT INFORMATION
            # =================================================

            event_info = get_event_information(
                event_id
            )


            # =================================================
            # CHECK-IN STATUS
            # =================================================

            checked_in = bool(

                person.get(
                    "checkedIn",
                    False
                )

            )


            # =================================================
            # REFUND STATUS
            # =================================================

            refund_status = str(

                person.get(
                    "refundStatus",
                    ""
                )
                or ""

            ).strip().lower()


            # =================================================
            # VALIDITY
            # =================================================

            valid = True

            status = "Valid"


            if refund_status == "refunded":

                valid = False

                status = "Refunded"


            elif checked_in:

                valid = False

                status = "Already used"


            # =================================================
            # RETURN READ-ONLY INFORMATION
            # =================================================

            return jsonify({

                "success":
                    True,

                "type":
                    "free",

                "status":
                    status,

                "valid":
                    valid,

                "entryId":
                    entry_id,

                "event":
                    event_info,

                "ticket": {

                    "ticketId":
                        entry_id,

                    "eventId":
                        person.get(
                            "eventId"
                        ),

                    "eventTitle":
                        person.get(
                            "eventTitle",
                            event_info.get(
                                "eventTitle",
                                ""
                            )
                        ),

                    "ticketType":
                        "Free attendance pass",

                    "buyer": {

                        "name":
                            person.get(
                                "name",
                                ""
                            ),

                        "email":
                            person.get(
                                "email",
                                ""
                            )

                    },

                    "checkedIn":
                        checked_in,

                    "checkedInAt":
                        person.get(
                            "checkedInAt"
                        ),

                    "refundStatus":
                        person.get(
                            "refundStatus"
                        )

                }

            }), 200


        # ====================================================
        # PAID TICKET
        # ====================================================

        bookings = load_json_file(
            "bookings.json",
            []
        )


        if not isinstance(
            bookings,
            list
        ):

            bookings = []


        # ====================================================
        # FIND INDIVIDUAL TICKET
        #
        # booking["tickets"] contains
        # individual generated tickets.
        # ====================================================

        ticket = None

        parent_booking = None


        for booking in bookings:

            if not isinstance(
                booking,
                dict
            ):

                continue


            booking_tickets = booking.get(
                "tickets",
                []
            )


            if not isinstance(
                booking_tickets,
                list
            ):

                continue


            for individual_ticket in booking_tickets:

                if not isinstance(
                    individual_ticket,
                    dict
                ):

                    continue


                if (

                    str(

                        individual_ticket.get(
                            "ticketId",
                            ""
                        )

                    ).strip()

                    ==

                    entry_id

                ):

                    ticket = individual_ticket

                    parent_booking = booking

                    break


            if ticket:

                break


        # ====================================================
        # NOT FOUND
        # ====================================================

        if not ticket:

            return jsonify({

                "success":
                    False,

                "message":
                    "Ticket not found."

            }), 404


        # ====================================================
        # EVENT ID
        # ====================================================

        event_id = str(

            parent_booking.get(
                "eventId",
                ""
            ) or ""

        ).strip()


        # ====================================================
        # SECURITY CHECK
        #
        # Team member MUST be assigned to this event.
        # ====================================================

        if event_id not in allowed_event_ids:

            return jsonify({

                "success": False,

                "message":
                    "You are not authorized to access this ticket."

            }), 403


        # ====================================================
        # EVENT INFORMATION
        # ====================================================

        event_info = get_event_information(
            event_id
        )


        # ====================================================
        # CHECK-IN STATUS
        # ====================================================

        checked_in = bool(

            ticket.get(
                "checkedIn",
                False
            )

        )


        # ====================================================
        # REFUND STATUS
        # ====================================================

        refund_status = str(

            ticket.get(
                "refundStatus",
                parent_booking.get(
                    "refundStatus",
                    ""
                )
            )
            or ""

        ).strip().lower()


        # ====================================================
        # VALIDITY
        # ====================================================

        valid = True

        status = "Valid"


        if refund_status == "refunded":

            valid = False

            status = "Refunded"


        elif checked_in:

            valid = False

            status = "Already used"


        # ====================================================
        # BUYER INFORMATION
        #
        # Individual ticket may not contain buyer data,
        # therefore fall back to parent booking.
        # ====================================================

        buyer = ticket.get(

            "buyer",

            parent_booking.get(
                "buyer",
                {}
            )

        )


        if not isinstance(
            buyer,
            dict
        ):

            buyer = {}


        # ====================================================
        # RETURN READ-ONLY INFORMATION
        # ====================================================

        return jsonify({

            "success":
                True,

            "type":
                "paid",

            "status":
                status,

            "valid":
                valid,

            "entryId":
                entry_id,

            "event":
                event_info,

            "ticket": {

                "ticketId":
                    ticket.get(
                        "ticketId"
                    ),

                "eventId":
                    parent_booking.get(
                        "eventId"
                    ),

                "eventTitle":
                    ticket.get(
                        "eventTitle",
                        parent_booking.get(
                            "eventTitle",
                            event_info.get(
                                "eventTitle",
                                ""
                            )
                        )
                    ),

                "ticketType":
                    ticket.get(
                        "ticketType",
                        parent_booking.get(
                            "ticketType",
                            "Ticket"
                        )
                    ),

                "buyer": {

                    "name":
                        buyer.get(
                            "name",
                            ""
                        ),

                    "email":
                        buyer.get(
                            "email",
                            ""
                        )

                },

                "checkedIn":
                    checked_in,

                "checkedInAt":
                    ticket.get(
                        "checkedInAt"
                    ),

                "refundStatus":
                    ticket.get(
                        "refundStatus"
                    )

            }

        }), 200


    except Exception as e:

        print(
            "TEAM TICKET LOOKUP ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to look up this ticket."

        }), 500

# ============================================================
# TEAM TICKET / PASS SEARCH
#
# USED BY:
#   - Admin Team
#   - Host Team
#
# SEARCH BY:
#   - Ticket ID
#   - Pass ID
#   - Attendee name
#   - Attendee email
#
# SECURITY:
#   Only tickets belonging to the authenticated member's
#   assigned event(s) are returned.
#
# READ-ONLY:
#   This endpoint NEVER checks in a ticket.
# ============================================================

@app.route(
    "/team/ticket-lookup",
    methods=["GET"]
)
@team_required
def team_ticket_search(account):

    try:

        # ====================================================
        # GET ACCESSIBLE EVENTS
        # ====================================================

        allowed_event_ids, access_error = (
            get_team_accessible_event_ids(
                account
            )
        )

        if access_error:

            return jsonify({

                "success": False,

                "message":
                    access_error

            }), 403


        # ====================================================
        # NO ASSIGNED EVENTS
        # ====================================================

        if not allowed_event_ids:

            return jsonify({

                "success": True,

                "count": 0,

                "results": []

            }), 200


        # ====================================================
        # SEARCH VALUE
        # ====================================================

        search = str(

            request.args.get(
                "search",
                ""
            ) or ""

        ).strip()


        if not search:

            return jsonify({

                "success": False,

                "message":
                    "Search value is required."

            }), 400


        search_lower = search.lower()


        # ====================================================
        # LOAD DATA
        # ====================================================

        events = load_json_file(
            "events.json",
            []
        )

        if not isinstance(
            events,
            list
        ):

            events = []


        bookings = load_json_file(
            "bookings.json",
            []
        )

        if not isinstance(
            bookings,
            list
        ):

            bookings = []


        attendance = load_attendance()

        if not isinstance(
            attendance,
            list
        ):

            attendance = []


        # ====================================================
        # BUILD EVENT MAP
        # ====================================================

        event_map = {}


        for event in events:

            if not isinstance(
                event,
                dict
            ):

                continue


            event_id = str(

                event.get(
                    "id",
                    ""
                ) or ""

            ).strip()


            if not event_id:

                continue


            if event_id not in allowed_event_ids:

                continue


            event_map[event_id] = event


        # ====================================================
        # SEARCH MATCH HELPER
        # ====================================================

        def matches_search(
            ticket_id="",
            pass_id="",
            name="",
            email=""
        ):

            values = [

                str(
                    ticket_id or ""
                ).strip().lower(),

                str(
                    pass_id or ""
                ).strip().lower(),

                str(
                    name or ""
                ).strip().lower(),

                str(
                    email or ""
                ).strip().lower()

            ]


            return any(

                search_lower in value

                for value in values

                if value

            )


        # ====================================================
        # RESULTS
        # ====================================================

        results = []


        # ====================================================
        # FREE ATTENDANCE PASSES
        # ====================================================

        for person in attendance:

            if not isinstance(
                person,
                dict
            ):

                continue


            event_id = str(

                person.get(
                    "eventId",
                    ""
                ) or ""

            ).strip()


            # ------------------------------------------------
            # SECURITY:
            # ONLY ASSIGNED EVENTS
            # ------------------------------------------------

            if event_id not in event_map:

                continue


            ticket_id = str(

                person.get(
                    "ticketId",
                    ""
                ) or ""

            ).strip()


            pass_id = str(

                person.get(
                    "passId",
                    ""
                ) or ""

            ).strip()


            attendee_name = str(

                person.get(
                    "name",
                    person.get(
                        "attendeeName",
                        person.get(
                            "buyerName",
                            ""
                        )
                    )
                ) or ""

            ).strip()


            attendee_email = str(

                person.get(
                    "email",
                    person.get(
                        "attendeeEmail",
                        person.get(
                            "buyerEmail",
                            ""
                        )
                    )
                ) or ""

            ).strip()


            # ------------------------------------------------
            # MATCH
            # ------------------------------------------------

            if not matches_search(

                ticket_id=ticket_id,

                pass_id=pass_id,

                name=attendee_name,

                email=attendee_email

            ):

                continue


            event = event_map[event_id]


            checked_in = bool(

                person.get(
                    "checkedIn",
                    False
                )

            )


            refund_status = str(

                person.get(
                    "refundStatus",
                    ""
                ) or ""

            ).strip().lower()


            if refund_status == "refunded":

                status = "Refunded"


            elif checked_in:

                status = "Already used"


            else:

                status = "Valid"


            results.append({

                "entryId":

                    ticket_id

                    or (

                        f"FREE-{pass_id}"

                        if pass_id

                        else ""

                    ),

                "type":
                    "free",

                "status":
                    status,

                "valid":
                    (
                        not checked_in
                        and
                        refund_status != "refunded"
                    ),

                "event": {

                    "eventId":
                        event_id,

                    "eventTitle":
                        event.get(
                            "title",
                            event.get(
                                "eventTitle",
                                "Untitled Event"
                            )
                        )

                },

                "ticket": {

                    "ticketId":
                        ticket_id
                        or (
                            f"FREE-{pass_id}"
                            if pass_id
                            else ""
                        ),

                    "passId":
                        pass_id,

                    "ticketType":
                        "Free attendance pass",

                    "buyer": {

                        "name":
                            attendee_name,

                        "email":
                            attendee_email

                    },

                    "checkedIn":
                        checked_in,

                    "checkedInAt":
                        person.get(
                            "checkedInAt"
                        ),

                    "refundStatus":
                        person.get(
                            "refundStatus"
                        )

                }

            })


        # ====================================================
        # PAID BOOKINGS
        # ====================================================

        for booking in bookings:

            if not isinstance(
                booking,
                dict
            ):

                continue


            event_id = str(

                booking.get(
                    "eventId",
                    ""
                ) or ""

            ).strip()


            # ------------------------------------------------
            # SECURITY:
            # ONLY ASSIGNED EVENTS
            # ------------------------------------------------

            if event_id not in event_map:

                continue


            event = event_map[event_id]


            booking_buyer = booking.get(
                "buyer",
                {}
            )


            if not isinstance(
                booking_buyer,
                dict
            ):

                booking_buyer = {}


            booking_name = str(

                booking_buyer.get(
                    "name",
                    booking.get(
                        "name",
                        ""
                    )
                ) or ""

            ).strip()


            booking_email = str(

                booking_buyer.get(
                    "email",
                    booking.get(
                        "email",
                        ""
                    )
                ) or ""

            ).strip()


            tickets = booking.get(
                "tickets",
                []
            )


            if not isinstance(
                tickets,
                list
            ):

                continue


            # =================================================
            # INDIVIDUAL TICKETS
            # =================================================

            for ticket in tickets:

                if not isinstance(
                    ticket,
                    dict
                ):

                    continue


                ticket_id = str(

                    ticket.get(
                        "ticketId",
                        ""
                    ) or ""

                ).strip()


                ticket_buyer = ticket.get(
                    "buyer",
                    {}
                )


                if not isinstance(
                    ticket_buyer,
                    dict
                ):

                    ticket_buyer = {}


                attendee_name = str(

                    ticket_buyer.get(
                        "name",
                        ticket.get(
                            "name",
                            booking_name
                        )
                    )
                    or
                    booking_name

                ).strip()


                attendee_email = str(

                    ticket_buyer.get(
                        "email",
                        ticket.get(
                            "email",
                            booking_email
                        )
                    )
                    or
                    booking_email

                ).strip()


                # ------------------------------------------------
                # MATCH
                # ------------------------------------------------

                if not matches_search(

                    ticket_id=ticket_id,

                    name=attendee_name,

                    email=attendee_email

                ):

                    continue


                checked_in = bool(

                    ticket.get(
                        "checkedIn",
                        False
                    )

                )


                refund_status = str(

                    ticket.get(
                        "refundStatus",
                        booking.get(
                            "refundStatus",
                            ""
                        )
                    ) or ""

                ).strip().lower()


                if refund_status == "refunded":

                    status = "Refunded"


                elif checked_in:

                    status = "Already used"


                else:

                    status = "Valid"


                results.append({

                    "entryId":
                        ticket_id,

                    "type":
                        "paid",

                    "status":
                        status,

                    "valid":
                        (
                            not checked_in
                            and
                            refund_status != "refunded"
                        ),

                    "event": {

                        "eventId":
                            event_id,

                        "eventTitle":
                            event.get(
                                "title",
                                event.get(
                                    "eventTitle",
                                    "Untitled Event"
                                )
                            )

                    },

                    "ticket": {

                        "ticketId":
                            ticket_id,

                        "ticketType":
                            ticket.get(
                                "ticketType",
                                booking.get(
                                    "ticketType",
                                    "Ticket"
                                )
                            ),

                        "buyer": {

                            "name":
                                attendee_name,

                            "email":
                                attendee_email

                        },

                        "checkedIn":
                            checked_in,

                        "checkedInAt":
                            ticket.get(
                                "checkedInAt"
                            ),

                        "refundStatus":
                            ticket.get(
                                "refundStatus",
                                booking.get(
                                    "refundStatus"
                                )
                            )

                    }

                })


        # ====================================================
        # NO RESULTS
        # ====================================================

        if not results:

            return jsonify({

                "success": False,

                "message":
                    "No matching ticket or attendee was found.",

                "results": []

            }), 404


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success":
                True,

            "count":
                len(results),

            "results":
                results

        }), 200


    except Exception as e:

        print(
            "TEAM TICKET SEARCH ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to search tickets."

        }), 500

# ============================================================
# ADMIN TICKET / PASS SEARCH
#
# SEARCH BY:
# - Ticket ID
# - Pass ID
# - Attendee name
# - Attendee email
#
# SEARCH SCOPE:
# - All platform events
# - Admin-created events
# - Host-created events
# - Paid individual tickets
# - Free attendance passes
#
# READ-ONLY
#
# DOES NOT:
# - Check in tickets
# - Modify bookings
# - Modify attendance
# - Modify check-in status
# ============================================================

@app.route(
    "/ticket-lookup",
    methods=["GET"]
)
def admin_ticket_search():

    # ========================================================
    # AUTHENTICATION
    # ========================================================

    auth_user = verify_admin_or_team_token()

    if not auth_user:

        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    # ========================================================
    # SEARCH TERM
    # ========================================================

    search = request.args.get(
        "search",
        ""
    )

    search = str(
        search or ""
    ).strip()

    if not search:

        return jsonify({
            "success": False,
            "message":
                "Please enter a ticket ID, pass ID, attendee name, or email."
        }), 400

    search_lower = search.lower()

    # ========================================================
    # LOAD EVENTS
    # ========================================================

    events = load_json_file(
        "events.json",
        []
    )

    if not isinstance(
        events,
        list
    ):

        events = []

    # ========================================================
    # EVENT INFORMATION
    # ========================================================

    event_map = {}

    for event in events:

        if not isinstance(
            event,
            dict
        ):
            continue

        event_id = str(
            event.get(
                "id",
                ""
            )
        ).strip()

        if not event_id:
            continue

        is_admin_event = (
            event.get(
                "adminEvent",
                False
            ) is True
            or
            str(
                event.get(
                    "adminEvent",
                    False
                )
            ).lower()
            == "true"
        )

        event_map[event_id] = {
            "eventId": event.get(
                "id",
                event_id
            ),

            "eventTitle": event.get(
                "title",
                ""
            ),

            "adminEvent": is_admin_event,

            "hostId": event.get(
                "hostId",
                ""
            ),

            "hostName": (
                "EventWaa"
                if is_admin_event
                else
                event.get(
                    "hostName",
                    ""
                )
            ),

            "hostEmail": event.get(
                "hostEmail",
                ""
            ),

            "verifiedHost": bool(
                event.get(
                    "verifiedHost",
                    False
                )
            )
        }

    # ========================================================
    # RESULTS
    # ========================================================

    results = []

    # ========================================================
    # FREE ATTENDANCE PASSES
    # ========================================================

    attendance = load_attendance()

    if not isinstance(
        attendance,
        list
    ):

        attendance = []

    for attendee in attendance:

        if not isinstance(
            attendee,
            dict
        ):
            continue

        event_id = str(
            attendee.get(
                "eventId",
                ""
            )
        ).strip()

        event_info = event_map.get(
            event_id
        )

        if not event_info:
            continue

        attendee_name = str(
            attendee.get(
                "name",
                ""
            )
        ).strip()

        attendee_email = str(
            attendee.get(
                "email",
                ""
            )
        ).strip()

        ticket_id = str(
            attendee.get(
                "ticketId",
                ""
            )
        ).strip()

        pass_id = str(
            attendee.get(
                "passId",
                ""
            )
        ).strip()

        free_entry_id = ticket_id

        if not free_entry_id and pass_id:

            free_entry_id = (
                f"FREE-{pass_id}"
            )

        matches = (
            search_lower in attendee_name.lower()
            or
            search_lower in attendee_email.lower()
            or
            search_lower in ticket_id.lower()
            or
            search_lower in pass_id.lower()
            or
            search_lower in free_entry_id.lower()
        )

        if not matches:
            continue

        checked_in = bool(
            attendee.get(
                "checkedIn",
                False
            )
        )

        refund_status = str(
            attendee.get(
                "refundStatus",
                ""
            ) or ""
        ).strip().lower()

        valid = True
        status = "Valid"

        if refund_status == "refunded":

            valid = False
            status = "Refunded"

        elif checked_in:

            valid = False
            status = "Already used"

        results.append({

            "type": "free",

            "status": status,

            "valid": valid,

            "entryId": free_entry_id,

            "event": event_info,

            "ticket": {

                "ticketId": free_entry_id,

                "eventId": attendee.get(
                    "eventId"
                ),

                "eventTitle": attendee.get(
                    "eventTitle",
                    event_info.get(
                        "eventTitle",
                        ""
                    )
                ),

                "ticketType":
                    "Free attendance pass",

                "buyer": {

                    "name": attendee_name,

                    "email": attendee_email

                },

                "checkedIn": checked_in,

                "checkedInAt": attendee.get(
                    "checkedInAt"
                ),

                "refundStatus": attendee.get(
                    "refundStatus"
                )

            }

        })

    # ========================================================
    # PAID INDIVIDUAL TICKETS
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    if not isinstance(
        bookings,
        list
    ):

        bookings = []

    for booking in bookings:

        if not isinstance(
            booking,
            dict
        ):
            continue

        event_id = str(
            booking.get(
                "eventId",
                ""
            )
        ).strip()

        event_info = event_map.get(
            event_id
        )

        if not event_info:
            continue

        booking_buyer = booking.get(
            "buyer",
            {}
        )

        if not isinstance(
            booking_buyer,
            dict
        ):

            booking_buyer = {}

        booking_name = str(
            booking_buyer.get(
                "name",
                ""
            )
        ).strip()

        booking_email = str(
            booking_buyer.get(
                "email",
                ""
            )
        ).strip()

        booking_tickets = booking.get(
            "tickets",
            []
        )

        if not isinstance(
            booking_tickets,
            list
        ):

            booking_tickets = []

        for individual_ticket in booking_tickets:

            if not isinstance(
                individual_ticket,
                dict
            ):
                continue

            ticket_buyer = individual_ticket.get(
                "buyer",
                booking_buyer
            )

            if not isinstance(
                ticket_buyer,
                dict
            ):

                ticket_buyer = booking_buyer

            ticket_name = str(
                ticket_buyer.get(
                    "name",
                    booking_name
                )
            ).strip()

            ticket_email = str(
                ticket_buyer.get(
                    "email",
                    booking_email
                )
            ).strip()

            ticket_id = str(
                individual_ticket.get(
                    "ticketId",
                    ""
                )
            ).strip()

            matches = (
                search_lower in ticket_name.lower()
                or
                search_lower in ticket_email.lower()
                or
                search_lower in ticket_id.lower()
                or
                search_lower in booking_name.lower()
                or
                search_lower in booking_email.lower()
            )

            if not matches:
                continue

            checked_in = bool(
                individual_ticket.get(
                    "checkedIn",
                    False
                )
            )

            refund_status = str(
                individual_ticket.get(
                    "refundStatus",
                    booking.get(
                        "refundStatus",
                        ""
                    )
                ) or ""
            ).strip().lower()

            valid = True
            status = "Valid"

            if refund_status == "refunded":

                valid = False
                status = "Refunded"

            elif checked_in:

                valid = False
                status = "Already used"

            results.append({

                "type": "paid",

                "status": status,

                "valid": valid,

                "entryId": ticket_id,

                "event": event_info,

                "ticket": {

                    "ticketId": ticket_id,

                    "eventId": event_id,

                    "eventTitle": individual_ticket.get(
                        "eventTitle",
                        booking.get(
                            "eventTitle",
                            event_info.get(
                                "eventTitle",
                                ""
                            )
                        )
                    ),

                    "ticketType": individual_ticket.get(
                        "ticketType",
                        booking.get(
                            "ticketType",
                            "Ticket"
                        )
                    ),

                    "buyer": {

                        "name": ticket_name,

                        "email": ticket_email

                    },

                    "checkedIn": checked_in,

                    "checkedInAt": individual_ticket.get(
                        "checkedInAt"
                    ),

                    "refundStatus": individual_ticket.get(
                        "refundStatus"
                    )

                }

            })

    # ========================================================
    # NO RESULTS
    # ========================================================

    if not results:

        return jsonify({
            "success": False,
            "message":
                "No matching ticket or attendee was found."
        }), 404

    # ========================================================
    # RETURN RESULTS
    # ========================================================

    return jsonify({

        "success": True,

        "count": len(
            results
        ),

        "results": results

    }), 200


# ============================================================
# HOST TICKET / PASS LOOKUP
#
# READ-ONLY
#
# ONE INDIVIDUAL TICKET / PASS = ONE ENTRY
#
# SUPPORTED SEARCH:
# - Exact ticket / pass ID
# - Attendee name
# - Attendee email
#
# IMPORTANT:
#
# This endpoint DOES NOT:
# - check in a ticket
# - modify check-in status
# - modify bookings
# - modify attendance
#
# It ONLY retrieves ticket/pass information.
#
# Only the authenticated Host who owns the event
# can retrieve its tickets.
# ============================================================


@app.route(
    "/host/ticket-lookup/<entry_id>",
    methods=["GET"]
)
@host_required
def host_ticket_lookup(user, entry_id):

    entry_id = str(
        entry_id or ""
    ).strip()

    if not entry_id:

        return jsonify({
            "success": False,
            "message":
                "Ticket or pass ID is required."
        }), 400

    events = load_json_file(
        "events.json",
        []
    )

    if not isinstance(events, list):
        events = []

    # ========================================================
    # AUTHENTICATED HOST ID
    # ========================================================

    authenticated_host_id = user.get(
        "id"
    )

    if authenticated_host_id is None:

        return jsonify({
            "success": False,
            "message": "Host identity could not be verified."
        }), 403

    # ========================================================
    # FIND EVENT OWNED BY THIS HOST
    # ========================================================

    def get_owned_event(event_id):

        for existing_event in events:

            if not isinstance(
                existing_event,
                dict
            ):
                continue

            if str(
                existing_event.get(
                    "id",
                    ""
                )
            ) != str(event_id):

                continue

            # ------------------------------------------------
            # ADMIN EVENTS DO NOT BELONG TO NORMAL HOSTS
            # ------------------------------------------------

            is_admin_event = (
                existing_event.get(
                    "adminEvent",
                    False
                ) is True
                or
                str(
                    existing_event.get(
                        "adminEvent",
                        False
                    )
                ).lower()
                == "true"
            )

            if is_admin_event:
                return None

            # ------------------------------------------------
            # OWNERSHIP CHECK
            # ------------------------------------------------

            event_host_id = existing_event.get(
                "hostId"
            )

            if (
                event_host_id is None
                or
                str(event_host_id)
                != str(authenticated_host_id)
            ):

                return None

            return existing_event

        return None

    # ========================================================
    # BUILD EVENT RESPONSE
    # ========================================================

    def build_event_response(event, event_id):

        return {
            "eventId": event.get(
                "id",
                event_id
            ),

            "eventTitle": event.get(
                "title",
                ""
            ),

            "adminEvent": False,

            "hostId": event.get(
                "hostId"
            ),

            "hostName": event.get(
                "hostName",
                ""
            ),

            "hostEmail": event.get(
                "hostEmail",
                ""
            ),

            "verifiedHost": bool(
                event.get(
                    "verifiedHost",
                    False
                )
            )
        }

    # ========================================================
    # BUILD STATUS
    # ========================================================

    def get_ticket_status(
        checked_in,
        refund_status
    ):

        checked_in = bool(
            checked_in
        )

        refund_status = str(
            refund_status or ""
        ).strip().lower()

        valid = True
        status = "Valid"

        if refund_status == "refunded":

            valid = False
            status = "Refunded"

        elif checked_in:

            valid = False
            status = "Already used"

        return (
            valid,
            status,
            checked_in,
            refund_status
        )

    # ========================================================
    # FREE ATTENDANCE PASS
    #
    # Exact ID lookup remains supported.
    # ========================================================

    if entry_id.upper().startswith(
        "FREE-"
    ):

        attendance = load_attendance()

        if not isinstance(
            attendance,
            list
        ):

            attendance = []

        person = None

        for attendee in attendance:

            if not isinstance(
                attendee,
                dict
            ):
                continue

            ticket_id = str(
                attendee.get(
                    "ticketId",
                    ""
                )
            ).strip()

            pass_id = str(
                attendee.get(
                    "passId",
                    ""
                )
            ).strip()

            if ticket_id == entry_id:

                person = attendee
                break

            if (
                pass_id
                and
                f"FREE-{pass_id}" == entry_id
            ):

                person = attendee
                break

        if not person:

            return jsonify({
                "success": False,
                "message":
                    "Attendance pass not found."
            }), 404

        event_id = person.get(
            "eventId"
        )

        event = get_owned_event(
            event_id
        )

        if not event:

            return jsonify({
                "success": False,
                "message":
                    "You do not have access to this event."
            }), 403

        (
            valid,
            status,
            checked_in,
            refund_status
        ) = get_ticket_status(
            person.get(
                "checkedIn",
                False
            ),
            person.get(
                "refundStatus",
                ""
            )
        )

        return jsonify({

            "success": True,

            "type": "free",

            "status": status,

            "valid": valid,

            "entryId": entry_id,

            "event": build_event_response(
                event,
                event_id
            ),

            "ticket": {

                "ticketId": entry_id,

                "eventId": person.get(
                    "eventId"
                ),

                "eventTitle": person.get(
                    "eventTitle",
                    event.get(
                        "title",
                        ""
                    )
                ),

                "ticketType":
                    "Free attendance pass",

                "buyer": {

                    "name": person.get(
                        "name",
                        ""
                    ),

                    "email": person.get(
                        "email",
                        ""
                    )

                },

                "checkedIn": checked_in,

                "checkedInAt": person.get(
                    "checkedInAt"
                ),

                "refundStatus": person.get(
                    "refundStatus"
                )

            }

        }), 200

    # ========================================================
    # PAID TICKET — EXACT ID LOOKUP
    #
    # This preserves the existing behavior.
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    if not isinstance(
        bookings,
        list
    ):

        bookings = []

    ticket = None
    parent_booking = None

    for booking in bookings:

        if not isinstance(
            booking,
            dict
        ):
            continue

        booking_tickets = booking.get(
            "tickets",
            []
        )

        if not isinstance(
            booking_tickets,
            list
        ):
            continue

        for individual_ticket in booking_tickets:

            if not isinstance(
                individual_ticket,
                dict
            ):
                continue

            if str(
                individual_ticket.get(
                    "ticketId",
                    ""
                )
            ).strip() == entry_id:

                ticket = individual_ticket

                parent_booking = booking

                break

        if ticket:
            break

    if not ticket:

        return jsonify({
            "success": False,
            "message":
                "Ticket not found."
        }), 404

    event_id = parent_booking.get(
        "eventId"
    )

    event = get_owned_event(
        event_id
    )

    if not event:

        return jsonify({
            "success": False,
            "message":
                "You do not have access to this event."
        }), 403

    checked_in = bool(
        ticket.get(
            "checkedIn",
            False
        )
    )

    refund_status = str(
        ticket.get(
            "refundStatus",
            parent_booking.get(
                "refundStatus",
                ""
            )
        ) or ""
    ).strip().lower()

    (
        valid,
        status,
        checked_in,
        refund_status
    ) = get_ticket_status(
        checked_in,
        refund_status
    )

    buyer = ticket.get(
        "buyer",
        parent_booking.get(
            "buyer",
            {}
        )
    )

    if not isinstance(
        buyer,
        dict
    ):

        buyer = {}

    return jsonify({

        "success": True,

        "type": "paid",

        "status": status,

        "valid": valid,

        "entryId": entry_id,

        "event": build_event_response(
            event,
            event_id
        ),

        "ticket": {

            "ticketId": ticket.get(
                "ticketId"
            ),

            "eventId": parent_booking.get(
                "eventId"
            ),

            "eventTitle": ticket.get(
                "eventTitle",
                parent_booking.get(
                    "eventTitle",
                    event.get(
                        "title",
                        ""
                    )
                )
            ),

            "ticketType": ticket.get(
                "ticketType",
                parent_booking.get(
                    "ticketType",
                    "Ticket"
                )
            ),

            "buyer": {

                "name": buyer.get(
                    "name",
                    ""
                ),

                "email": buyer.get(
                    "email",
                    ""
                )

            },

            "checkedIn": checked_in,

            "checkedInAt": ticket.get(
                "checkedInAt"
            ),

            "refundStatus": ticket.get(
                "refundStatus"
            )

        }

    }), 200


# ============================================================
# HOST TICKET / PASS SEARCH
#
# SEARCH BY:
# - Attendee name
# - Attendee email
# - Ticket ID
#
# READ-ONLY
#
# ONLY RETURNS TICKETS FROM EVENTS OWNED BY
# THE AUTHENTICATED HOST.
# ============================================================


@app.route(
    "/host/ticket-lookup",
    methods=["GET"]
)
@host_required
def host_ticket_search(user):

    search = request.args.get(
        "search",
        ""
    )

    search = str(
        search or ""
    ).strip()

    if not search:

        return jsonify({
            "success": False,
            "message":
                "Please enter a ticket ID, attendee name, or email."
        }), 400

    search_lower = search.lower()

    events = load_json_file(
        "events.json",
        []
    )

    if not isinstance(
        events,
        list
    ):

        events = []

    authenticated_host_id = user.get(
        "id"
    )

    if authenticated_host_id is None:

        return jsonify({
            "success": False,
            "message":
                "Host identity could not be verified."
        }), 403

    # ========================================================
    # ONLY KEEP EVENTS OWNED BY AUTHENTICATED HOST
    # ========================================================

    owned_events = {}

    for event in events:

        if not isinstance(
            event,
            dict
        ):
            continue

        is_admin_event = (
            event.get(
                "adminEvent",
                False
            ) is True
            or
            str(
                event.get(
                    "adminEvent",
                    False
                )
            ).lower()
            == "true"
        )

        if is_admin_event:
            continue

        event_host_id = event.get(
            "hostId"
        )

        if (
            event_host_id is None
            or
            str(event_host_id)
            != str(authenticated_host_id)
        ):
            continue

        event_key = str(
            event.get(
                "id",
                ""
            )
        )

        if event_key:
            owned_events[event_key] = event

    # ========================================================
    # RESULTS
    # ========================================================

    results = []

    # ========================================================
    # FREE ATTENDANCE
    # ========================================================

    attendance = load_attendance()

    if not isinstance(
        attendance,
        list
    ):

        attendance = []

    for attendee in attendance:

        if not isinstance(
            attendee,
            dict
        ):
            continue

        event_id = str(
            attendee.get(
                "eventId",
                ""
            )
        )

        event = owned_events.get(
            event_id
        )

        if not event:
            continue

        attendee_name = str(
            attendee.get(
                "name",
                ""
            )
        ).strip()

        attendee_email = str(
            attendee.get(
                "email",
                ""
            )
        ).strip()

        ticket_id = str(
            attendee.get(
                "ticketId",
                ""
            )
        ).strip()

        pass_id = str(
            attendee.get(
                "passId",
                ""
            )
        ).strip()

        free_entry_id = ticket_id

        if (
            not free_entry_id
            and pass_id
        ):
            free_entry_id = (
                f"FREE-{pass_id}"
            )

        # ----------------------------------------------------
        # MATCH NAME / EMAIL / TICKET ID
        # ----------------------------------------------------

        matches = (
            search_lower in attendee_name.lower()
            or
            search_lower in attendee_email.lower()
            or
            search_lower in ticket_id.lower()
            or
            search_lower in pass_id.lower()
            or
            search_lower in free_entry_id.lower()
        )

        if not matches:
            continue

        checked_in = bool(
            attendee.get(
                "checkedIn",
                False
            )
        )

        refund_status = str(
            attendee.get(
                "refundStatus",
                ""
            ) or ""
        ).strip().lower()

        valid = True
        status = "Valid"

        if refund_status == "refunded":

            valid = False
            status = "Refunded"

        elif checked_in:

            valid = False
            status = "Already used"

        results.append({

            "type": "free",

            "status": status,

            "valid": valid,

            "entryId": free_entry_id,

            "event": {
                "eventId": event.get(
                    "id",
                    event_id
                ),
                "eventTitle": event.get(
                    "title",
                    ""
                ),
                "adminEvent": False,
                "hostId": event.get(
                    "hostId"
                ),
                "hostName": event.get(
                    "hostName",
                    ""
                ),
                "hostEmail": event.get(
                    "hostEmail",
                    ""
                ),
                "verifiedHost": bool(
                    event.get(
                        "verifiedHost",
                        False
                    )
                )
            },

            "ticket": {

                "ticketId": free_entry_id,

                "eventId": attendee.get(
                    "eventId"
                ),

                "eventTitle": attendee.get(
                    "eventTitle",
                    event.get(
                        "title",
                        ""
                    )
                ),

                "ticketType":
                    "Free attendance pass",

                "buyer": {

                    "name": attendee_name,

                    "email": attendee_email

                },

                "checkedIn": checked_in,

                "checkedInAt": attendee.get(
                    "checkedInAt"
                ),

                "refundStatus": attendee.get(
                    "refundStatus"
                )

            }

        })

    # ========================================================
    # PAID BOOKINGS
    # ========================================================

    bookings = load_json_file(
        "bookings.json",
        []
    )

    if not isinstance(
        bookings,
        list
    ):

        bookings = []

    for booking in bookings:

        if not isinstance(
            booking,
            dict
        ):
            continue

        event_id = str(
            booking.get(
                "eventId",
                ""
            )
        )

        event = owned_events.get(
            event_id
        )

        if not event:
            continue

        booking_buyer = booking.get(
            "buyer",
            {}
        )

        if not isinstance(
            booking_buyer,
            dict
        ):

            booking_buyer = {}

        booking_name = str(
            booking_buyer.get(
                "name",
                ""
            )
        ).strip()

        booking_email = str(
            booking_buyer.get(
                "email",
                ""
            )
        ).strip()

        booking_tickets = booking.get(
            "tickets",
            []
        )

        if not isinstance(
            booking_tickets,
            list
        ):

            booking_tickets = []

        for individual_ticket in booking_tickets:

            if not isinstance(
                individual_ticket,
                dict
            ):
                continue

            ticket_buyer = individual_ticket.get(
                "buyer",
                booking_buyer
            )

            if not isinstance(
                ticket_buyer,
                dict
            ):

                ticket_buyer = booking_buyer

            ticket_name = str(
                ticket_buyer.get(
                    "name",
                    booking_name
                )
            ).strip()

            ticket_email = str(
                ticket_buyer.get(
                    "email",
                    booking_email
                )
            ).strip()

            ticket_id = str(
                individual_ticket.get(
                    "ticketId",
                    ""
                )
            ).strip()

            # ------------------------------------------------
            # MATCH
            # ------------------------------------------------

            matches = (
                search_lower in ticket_name.lower()
                or
                search_lower in ticket_email.lower()
                or
                search_lower in ticket_id.lower()
                or
                search_lower in booking_name.lower()
                or
                search_lower in booking_email.lower()
            )

            if not matches:
                continue

            checked_in = bool(
                individual_ticket.get(
                    "checkedIn",
                    False
                )
            )

            refund_status = str(
                individual_ticket.get(
                    "refundStatus",
                    booking.get(
                        "refundStatus",
                        ""
                    )
                ) or ""
            ).strip().lower()

            valid = True
            status = "Valid"

            if refund_status == "refunded":

                valid = False
                status = "Refunded"

            elif checked_in:

                valid = False
                status = "Already used"

            results.append({

                "type": "paid",

                "status": status,

                "valid": valid,

                "entryId": ticket_id,

                "event": {
                    "eventId": event.get(
                        "id",
                        event_id
                    ),
                    "eventTitle": event.get(
                        "title",
                        ""
                    ),
                    "adminEvent": False,
                    "hostId": event.get(
                        "hostId"
                    ),
                    "hostName": event.get(
                        "hostName",
                        ""
                    ),
                    "hostEmail": event.get(
                        "hostEmail",
                        ""
                    ),
                    "verifiedHost": bool(
                        event.get(
                            "verifiedHost",
                            False
                        )
                    )
                },

                "ticket": {

                    "ticketId": individual_ticket.get(
                        "ticketId"
                    ),

                    "eventId": event_id,

                    "eventTitle": individual_ticket.get(
                        "eventTitle",
                        booking.get(
                            "eventTitle",
                            event.get(
                                "title",
                                ""
                            )
                        )
                    ),

                    "ticketType": individual_ticket.get(
                        "ticketType",
                        booking.get(
                            "ticketType",
                            "Ticket"
                        )
                    ),

                    "buyer": {

                        "name": ticket_name,

                        "email": ticket_email

                    },

                    "checkedIn": checked_in,

                    "checkedInAt": individual_ticket.get(
                        "checkedInAt"
                    ),

                    "refundStatus": individual_ticket.get(
                        "refundStatus"
                    )

                }

            })

    # ========================================================
    # NO RESULTS
    # ========================================================

    if not results:

        return jsonify({
            "success": False,
            "message":
                "No matching ticket or attendee was found."
        }), 404

    # ========================================================
    # RETURN RESULTS
    # ========================================================

    return jsonify({

        "success": True,

        "count": len(
            results
        ),

        "results": results

    }), 200


# ============================================================
# CHECK TICKET
#
# ONE INDIVIDUAL TICKET = ONE ENTRY
#
# This endpoint checks an individual generated ticket.
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
    # ========================================================
    # LOAD BOOKINGS
    # ========================================================
    bookings = load_json_file(
        "bookings.json",
        []
    )
    # ========================================================
    # FIND INDIVIDUAL TICKET
    # ========================================================
    ticket = None
    parent_booking = None
    for booking in bookings:
        booking_tickets = booking.get(
            "tickets",
            []
        )
        if not isinstance(
            booking_tickets,
            list
        ):
            continue
        for individual_ticket in booking_tickets:
            if not isinstance(
                individual_ticket,
                dict
            ):
                continue
            if (
                str(
                    individual_ticket.get(
                        "ticketId",
                        ""
                    )
                )
                ==
                str(ticket_id)
            ):
                ticket = individual_ticket
                parent_booking = booking
                break
        if ticket:
            break
    # ========================================================
    # TICKET DOES NOT EXIST
    # ========================================================
    if not ticket:
        return jsonify({
            "success":
                False,
            "message":
                "Ticket not found."
        }), 404
    # ========================================================
    # CHECK EVENT
    # ========================================================
    if event_id is not None:
        if str(
            parent_booking.get(
                "eventId"
            )
        ) != str(event_id):
            return jsonify({
                "success":
                    False,
                "message":
                    "This ticket does not belong to this event."
            }), 403
    # ========================================================
    # REFUNDED TICKET
    # ========================================================
    refund_status = str(
        ticket.get(
            "refundStatus",
            parent_booking.get(
                "refundStatus",
                ""
            )
        )
        or ""
    ).strip().lower()
    if refund_status == "refunded":
        return jsonify({
            "success":
                False,
            "message":
                "This ticket has been refunded and is no longer valid.",
            "refunded":
                True
        }), 400
    # ========================================================
    # ALREADY CHECKED IN
    # ========================================================
    if ticket.get(
        "checkedIn",
        False
    ):
        return jsonify({
            "success":
                False,
            "message":
                "Ticket already used.",
            "alreadyCheckedIn":
                True,
            "ticket":
                ticket
        }), 400
    # ========================================================
    # CHECK IN INDIVIDUAL TICKET
    # ========================================================
    current_time = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    ticket["checkedIn"] = True
    ticket["checkedInAt"] = (
        current_time
    )
    # ========================================================
    # SAVE BOOKING
    # ========================================================
    save_json_file(
        "bookings.json",
        bookings
    )
    # ========================================================
    # SUCCESS
    # ========================================================
    return jsonify({
        "success":
            True,
        "message":
            "Ticket verified successfully.",
        "ticket":
            ticket
    }), 200


# ============================================================
# CHECKED-IN TICKETS
#
# Returns individual tickets that have been used.
#
# ONE INDIVIDUAL TICKET = ONE ENTRY
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
    checked_in = []
    # ========================================================
    # LOOP THROUGH BOOKINGS
    # ========================================================
    for booking in bookings:
        booking_tickets = booking.get(
            "tickets",
            []
        )
        if not isinstance(
            booking_tickets,
            list
        ):
            continue
        # ====================================================
        # LOOP THROUGH INDIVIDUAL TICKETS
        # ====================================================
        for ticket in booking_tickets:
            if not isinstance(
                ticket,
                dict
            ):
                continue
            if ticket.get(
                "checkedIn",
                False
            ):
                checked_in.append({
                    **ticket,
                    "bookingId":
                        booking.get(
                            "id"
                        ),
                    "eventId":
                        booking.get(
                            "eventId"
                        ),
                    "eventTitle":
                        ticket.get(
                            "eventTitle",
                            booking.get(
                                "eventTitle",
                                ""
                            )
                        )
                })
    # ========================================================
    # RETURN INDIVIDUAL CHECKED-IN TICKETS
    # ========================================================
    return jsonify(
        checked_in
    ), 200

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
# FLUTTERWAVE TRANSFER / PAYOUT HELPER
# ============================================================

def create_flutterwave_transfer(
    amount,
    method,
    account,
    beneficiary_name="EventWaa Host",
    reference=None
):

    if not FLW_SECRET_KEY:

        return {
            "success": False,
            "message":
                "Flutterwave secret key is not configured."
        }


    amount = int(amount or 0)


    if amount <= 0:

        return {
            "success": False,
            "message":
                "Transfer amount must be greater than zero."
        }


    method = str(
        method or ""
    ).strip()


    account = str(
        account or ""
    ).strip()


    if not account:

        return {
            "success": False,
            "message":
                "Recipient account is required."
        }


    # ========================================================
    # GENERATE UNIQUE TRANSFER REFERENCE
    # ========================================================

    if not reference:

        reference = (
            f"EVENTWAA-PAYOUT-"
            f"{int(datetime.now().timestamp() * 1000)}"
        )


    # ========================================================
    # DETERMINE FLUTTERWAVE DESTINATION
    # ========================================================

    normalized_method = method.lower()


    if normalized_method == "mtn mobile money":

        account_bank = "MTN"


    elif normalized_method == "airtel mobile money":

        account_bank = "AIRTEL"


    elif normalized_method == "bank account":

        return {
            "success": False,
            "message":
                (
                    "Bank withdrawals require the "
                    "Flutterwave Uganda bank code and "
                    "beneficiary details. Configure the "
                    "bank code before enabling bank payouts."
                )
        }


    else:

        return {
            "success": False,
            "message":
                "Unsupported withdrawal method."
        }


    # ========================================================
    # FLUTTERWAVE TRANSFER PAYLOAD
    #
    # Uganda mobile money:
    # MTN / AIRTEL
    #
    # Flutterwave uses the account number as the
    # recipient mobile-money number.
    # ========================================================

    payload = {

        "account_bank":
            account_bank,

        "account_number":
            account,

        "amount":
            amount,

        "currency":
            "UGX",

        "beneficiary_name":
            beneficiary_name,

        "reference":
            reference,

        "narration":
            "EventWaa host withdrawal",

        "meta": {

            "platform":
                "EventWaa",

            "withdrawalReference":
                reference

        }

    }


    headers = {

        "Authorization":
            f"Bearer {FLW_SECRET_KEY}",

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    }


    # ========================================================
    # SEND TRANSFER TO FLUTTERWAVE
    # ========================================================

    try:

        response = requests.post(

            f"{FLW_API_URL}/transfers",

            headers=headers,

            json=payload,

            timeout=30

        )

    except Exception as e:

        print(
            "FLUTTERWAVE TRANSFER ERROR:",
            str(e)
        )

        return {

            "success": False,

            "message":
                "Unable to connect to Flutterwave."

        }


    try:

        flutterwave_data = response.json()

    except Exception:

        flutterwave_data = {}


    print(
        "FLUTTERWAVE TRANSFER STATUS:",
        response.status_code
    )

    print(
        "FLUTTERWAVE TRANSFER RESPONSE:",
        flutterwave_data
    )


    # ========================================================
    # HANDLE FLUTTERWAVE ERROR
    # ========================================================

    if (

        response.status_code >= 400

        or

        flutterwave_data.get(
            "status"
        ) != "success"

    ):

        return {

            "success": False,

            "message":
                (
                    flutterwave_data.get(
                        "message"
                    )
                    or
                    "Flutterwave transfer failed."
                ),

            "flutterwave":
                flutterwave_data

        }


    transfer_data = (

        flutterwave_data.get(
            "data"
        )
        or {}

    )


    transfer_id = transfer_data.get(
        "id"
    )


    transfer_status = str(

        transfer_data.get(
            "status",
            "PENDING"
        )

    ).upper()


    transfer_fee = float(

        transfer_data.get(
            "fee",
            0
        )
        or 0

    )


    return {

        "success":
            True,

        "transferId":
            transfer_id,

        "reference":
            transfer_data.get(
                "reference",
                reference
            ),

        "status":
            transfer_status,

        "fee":
            transfer_fee,

        "amount":
            amount,

        "flutterwave":
            flutterwave_data

    }

# ============================================================
# CHECK FLUTTERWAVE TRANSFER STATUS
# ============================================================

def get_flutterwave_transfer(
    transfer_id
):

    if not FLW_SECRET_KEY:

        return {

            "success": False,

            "message":
                "Flutterwave secret key is not configured."

        }


    if not transfer_id:

        return {

            "success": False,

            "message":
                "Flutterwave transfer ID is required."

        }


    headers = {

        "Authorization":
            f"Bearer {FLW_SECRET_KEY}",

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    }


    try:

        response = requests.get(

            f"{FLW_API_URL}/transfers/"
            f"{transfer_id}",

            headers=headers,

            timeout=30

        )

        data = response.json()

    except Exception as e:

        print(
            "FLUTTERWAVE TRANSFER STATUS ERROR:",
            str(e)
        )

        return {

            "success": False,

            "message":
                "Unable to check Flutterwave transfer."

        }


    if response.status_code >= 400:

        return {

            "success": False,

            "message":
                (
                    data.get(
                        "message"
                    )
                    or
                    "Unable to retrieve transfer status."
                )

        }


    transfer = (

        data.get(
            "data"
        )
        or {}

    )


    return {

        "success":
            True,

        "status":
            str(
                transfer.get(
                    "status",
                    ""
                )
            ).upper(),

        "transfer":
            transfer

    }


# ============================================================
# HOST WITHDRAW
#
# FLOW:
#
# availableBalance
#       ↓
# withdrawal requested
#       ↓
# availableBalance decreases
# pendingPayouts increases
#       ↓
# withdrawal = pending
#
# IMPORTANT:
# Money is reserved BEFORE admin approval so the host
# cannot request the same money twice.
# ============================================================

@app.route(
    "/host/wallet/withdraw/<int:host_id>",
    methods=["POST"]
)
def host_withdraw(host_id):

    try:

        data = request.get_json(
            silent=True
        ) or {}


        # ====================================================
        # READ REQUEST DATA
        # ====================================================

        try:

            amount = int(
                data.get(
                    "amount",
                    0
                )
                or 0
            )

        except (
            TypeError,
            ValueError
        ):

            amount = 0


        method = str(
            data.get(
                "method",
                ""
            )
            or ""
        ).strip()


        account = str(
            data.get(
                "account",
                ""
            )
            or ""
        ).strip()


        # ====================================================
        # VALIDATE AMOUNT
        # ====================================================

        if amount <= 0:

            return jsonify({

                "success":
                    False,

                "message":
                    "Enter a valid withdrawal amount."

            }), 400


        # ====================================================
        # VALIDATE METHOD
        # ====================================================

        allowed_methods = {

            "MTN Mobile Money",

            "Airtel Mobile Money",

            "Bank Account"

        }


        if method not in allowed_methods:

            return jsonify({

                "success":
                    False,

                "message":
                    "Unsupported withdrawal method."

            }), 400


        # ====================================================
        # VALIDATE ACCOUNT
        # ====================================================

        if not account:

            return jsonify({

                "success":
                    False,

                "message":
                    "Withdrawal account is required."

            }), 400


        # ====================================================
        # LOAD HOST WALLETS
        # ====================================================

        wallets = load_host_wallets()


        # ====================================================
        # FIND HOST WALLET
        # ====================================================

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


            if wallet_host_id != host_id:

                continue


            # =================================================
            # READ AVAILABLE BALANCE
            # =================================================

            available_balance = int(

                wallet.get(
                    "availableBalance",
                    0
                )
                or 0

            )


            # =================================================
            # CHECK SUFFICIENT BALANCE
            # =================================================

            if amount > available_balance:

                return jsonify({

                    "success":
                        False,

                    "message":
                        "Insufficient balance."

                }), 400


            # =================================================
            # GENERATE WITHDRAWAL ID
            #
            # Keep the existing ID system for now so we don't
            # break existing wallet transactions.
            # =================================================

            existing_withdrawals = (
                wallet.get(
                    "withdrawals",
                    []
                )
                or []
            )


            withdrawal = {

                "id":
                    len(
                        existing_withdrawals
                    ) + 1,

                "amount":
                    amount,

                "method":
                    method,

                "account":
                    account,

                "status":
                    "pending",

                "date":
                    datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )

            }


            # =================================================
            # RESERVE THE MONEY
            #
            # availableBalance → pendingPayouts
            # =================================================

            wallet["availableBalance"] = (

                available_balance
                -
                amount

            )


            wallet["pendingPayouts"] = (

                int(
                    wallet.get(
                        "pendingPayouts",
                        0
                    )
                    or 0
                )
                +
                amount

            )


            # =================================================
            # ADD WITHDRAWAL
            # =================================================

            wallet.setdefault(
                "withdrawals",
                []
            ).append(
                withdrawal
            )


            # =================================================
            # ADD WALLET TRANSACTION
            # =================================================

            wallet.setdefault(
                "transactions",
                []
            ).append({

                "id":
                    f"withdrawal_{withdrawal['id']}",

                "type":
                    "withdrawal",

                "description":
                    "Withdrawal request",

                "amount":
                    -amount,

                "method":
                    method,

                "date":
                    withdrawal["date"],

                "status":
                    "pending"

            })


            # =================================================
            # SAVE WALLET
            # =================================================

            save_host_wallets(
                wallets
            )


            # =================================================
            # NOTIFY HOST
            # =================================================

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


            # =================================================
            # NOTIFY ADMIN
            # =================================================

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


            # =================================================
            # RESPONSE
            # =================================================

            return jsonify({

                "success":
                    True,

                "message":
                    "Withdrawal request submitted.",

                "wallet":
                    wallet

            }), 200


        # ====================================================
        # HOST WALLET NOT FOUND
        # ====================================================

        return jsonify({

            "success":
                False,

            "message":
                "Host wallet not found."

        }), 404


    except Exception as e:

        print(
            "HOST WITHDRAW ERROR:",
            str(e)
        )

        return jsonify({

            "success":
                False,

            "message":
                "Unable to process withdrawal."

        }), 500


# ============================================================
# ADMIN WALLET
# ============================================================

@app.route(
    "/admin/wallet",
    methods=["GET"]
)
@admin_required
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
@admin_required
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
@admin_required
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
                    user.get(
                        "id",
                        0
                    )
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

                "id":
                    withdrawal.get(
                        "id"
                    ),

                "hostId":
                    wallet.get(
                        "hostId"
                    ),

                "hostName":
                    (
                        host.get(
                            "name",
                            "Unknown Host"
                        )
                        if host
                        else
                        "Unknown Host"
                    ),

                "hostEmail":
                    (
                        host.get(
                            "email",
                            ""
                        )
                        if host
                        else
                        ""
                    ),

                "amount":
                    withdrawal.get(
                        "amount",
                        0
                    ),

                "method":
                    withdrawal.get(
                        "method"
                    ),

                "account":
                    withdrawal.get(
                        "account"
                    ),

                "status":
                    withdrawal.get(
                        "status"
                    ),

                # =================================================
                # FLUTTERWAVE TRANSFER ID
                #
                # EventWaa uses transferId consistently.
                # =================================================

                "transferId":
                    withdrawal.get(
                        "transferId"
                    ),

                "transferReference":
                    withdrawal.get(
                        "transferReference"
                    ),

                "flutterwaveStatus":
                    withdrawal.get(
                        "flutterwaveStatus"
                    ),

                "date":
                    withdrawal.get(
                        "date"
                    )

            })


    withdrawals.sort(

        key=lambda x:
            x.get(
                "date",
                ""
            ),

        reverse=True

    )


    return jsonify(
        withdrawals
    )


# ============================================================
# GET FLUTTERWAVE TRANSFER STATUS
# ============================================================

def get_flutterwave_transfer_status(
    transfer_id
):

    if not FLW_SECRET_KEY:

        return {
            "success": False,
            "message": (
                "Flutterwave secret key "
                "is not configured."
            )
        }


    if not transfer_id:

        return {
            "success": False,
            "message": "Transfer ID is required."
        }


    headers = {

        "Authorization":
            f"Bearer {FLW_SECRET_KEY}",

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    }


    try:

        response = requests.get(

            f"{FLW_API_URL}/transfers/"
            f"{transfer_id}",

            headers=headers,

            timeout=30

        )


        try:

            response_data = response.json()

        except Exception:

            response_data = {}


        print(
            "FLUTTERWAVE TRANSFER STATUS:",
            response.status_code
        )

        print(
            "FLUTTERWAVE TRANSFER RESPONSE:",
            response_data
        )


    except Exception as e:

        print(
            "TRANSFER STATUS ERROR:",
            str(e)
        )

        return {

            "success": False,

            "message":
                "Unable to check transfer status."

        }


    if response.status_code >= 400:

        return {

            "success": False,

            "message":
                (
                    response_data.get(
                        "message"
                    )
                    or
                    "Unable to get transfer status."
                ),

            "flutterwave":
                response_data

        }


    transfer = (
        response_data.get(
            "data"
        )
        or {}
    )


    return {

        "success":
            True,

        "status":
            str(
                transfer.get(
                    "status",
                    ""
                )
            ).upper(),

        "transfer":
            transfer,

        "flutterwave":
            response_data

    }


# ============================================================
# FINALIZE HOST WITHDRAWAL
#
# SUCCESSFUL:
#   pendingPayouts decreases
#   totalWithdrawn increases
#   withdrawal becomes completed
#   transaction becomes completed
#
# FAILED:
#   pendingPayouts decreases
#   availableBalance is restored
#   withdrawal becomes failed
#   transaction becomes failed
#
# IMPORTANT:
#   accountingFinalized prevents the webhook and the manual
#   status-check route from processing the same withdrawal twice.
# ============================================================

def finalize_host_withdrawal(
    host_id,
    withdrawal_id,
    final_status,
    flutterwave_transfer_id=None,
    flutterwave_reference=None,
    flutterwave_response=None
):

    wallets = load_host_wallets()


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


        if wallet_host_id != int(
            host_id
        ):

            continue


        for withdrawal in wallet.get(
            "withdrawals",
            []
        ):

            try:

                current_id = int(
                    withdrawal.get(
                        "id",
                        0
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                current_id = 0


            if current_id != int(
                withdrawal_id
            ):

                continue


            # =================================================
            # PROTECT AGAINST DOUBLE FINALIZATION
            # =================================================

            if withdrawal.get(
                "accountingFinalized",
                False
            ):

                return {

                    "success":
                        True,

                    "alreadyFinalized":
                        True,

                    "status":
                        withdrawal.get(
                            "status"
                        ),

                    "withdrawal":
                        withdrawal

                }


            # =================================================
            # SECOND SAFETY CHECK
            # =================================================

            if withdrawal.get(
                "status"
            ) in (
                "completed",
                "failed"
            ):

                withdrawal[
                    "accountingFinalized"
                ] = True


                save_host_wallets(
                    wallets
                )


                return {

                    "success":
                        True,

                    "alreadyFinalized":
                        True,

                    "status":
                        withdrawal.get(
                            "status"
                        ),

                    "withdrawal":
                        withdrawal

                }


            # =================================================
            # GET AMOUNT
            # =================================================

            amount = int(

                withdrawal.get(
                    "amount",
                    0
                )
                or 0

            )


            if amount <= 0:

                return {

                    "success":
                        False,

                    "message":
                        "Invalid withdrawal amount."

                }


            # =================================================
            # STORE FLUTTERWAVE INFORMATION
            # =================================================

            if flutterwave_transfer_id:

                withdrawal[
                    "flutterwaveTransferId"
                ] = flutterwave_transfer_id


            if flutterwave_reference:

                withdrawal[
                    "flutterwaveReference"
                ] = flutterwave_reference


            if flutterwave_response:

                withdrawal[
                    "flutterwaveResponse"
                ] = flutterwave_response


            # =================================================
            # SUCCESSFUL
            # =================================================

            if final_status == "successful":

                withdrawal["status"] = (
                    "completed"
                )


                withdrawal["completedAt"] = (
                    datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                )


                # ---------------------------------------------
                # REMOVE FROM PENDING PAYOUTS
                # ---------------------------------------------

                wallet["pendingPayouts"] = max(

                    0,

                    int(
                        wallet.get(
                            "pendingPayouts",
                            0
                        )
                        or 0
                    )
                    -
                    amount

                )


                # ---------------------------------------------
                # ADD TO TOTAL WITHDRAWN
                # ---------------------------------------------

                wallet["totalWithdrawn"] = (

                    int(
                        wallet.get(
                            "totalWithdrawn",
                            0
                        )
                        or 0
                    )
                    +
                    amount

                )


                # ---------------------------------------------
                # UPDATE TRANSACTION
                # ---------------------------------------------

                transaction_found = False


                for transaction in wallet.get(
                    "transactions",
                    []
                ):

                    if str(
                        transaction.get(
                            "id",
                            ""
                        )
                    ) == str(
                        f"withdrawal_{withdrawal_id}"
                    ):

                        transaction["status"] = (
                            "completed"
                        )

                        transaction[
                            "completedAt"
                        ] = datetime.now().strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )


                        transaction[
                            "flutterwaveTransferId"
                        ] = withdrawal.get(
                            "flutterwaveTransferId"
                        )


                        transaction_found = True

                        break


                # ---------------------------------------------
                # MARK ACCOUNTING FINALIZED
                # ---------------------------------------------

                withdrawal[
                    "accountingFinalized"
                ] = True


                # ---------------------------------------------
                # SAVE
                # ---------------------------------------------

                save_host_wallets(
                    wallets
                )


                # ---------------------------------------------
                # NOTIFY HOST
                # ---------------------------------------------

                create_notification(

                    host_id,

                    "Withdrawal Completed",

                    (
                        f"Your UGX "
                        f"{amount:,} withdrawal "
                        f"has been successfully "
                        f"processed."
                    ),

                    "withdrawal_completed",

                    "/host-wallet"

                )


                return {

                    "success":
                        True,

                    "status":
                        "completed",

                    "withdrawal":
                        withdrawal,

                    "wallet":
                        wallet

                }


            # =================================================
            # FAILED
            # =================================================

            if final_status == "failed":

                withdrawal["status"] = (
                    "failed"
                )


                withdrawal["failedAt"] = (
                    datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                )


                # ---------------------------------------------
                # REMOVE FROM PENDING PAYOUTS
                # ---------------------------------------------

                wallet["pendingPayouts"] = max(

                    0,

                    int(
                        wallet.get(
                            "pendingPayouts",
                            0
                        )
                        or 0
                    )
                    -
                    amount

                )


                # ---------------------------------------------
                # RETURN RESERVED MONEY
                # ---------------------------------------------

                wallet["availableBalance"] = (

                    int(
                        wallet.get(
                            "availableBalance",
                            0
                        )
                        or 0
                    )
                    +
                    amount

                )


                # ---------------------------------------------
                # UPDATE TRANSACTION
                # ---------------------------------------------

                for transaction in wallet.get(
                    "transactions",
                    []
                ):

                    if str(
                        transaction.get(
                            "id",
                            ""
                        )
                    ) == str(
                        f"withdrawal_{withdrawal_id}"
                    ):

                        transaction["status"] = (
                            "failed"
                        )

                        transaction[
                            "failedAt"
                        ] = datetime.now().strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )


                        transaction[
                            "flutterwaveTransferId"
                        ] = withdrawal.get(
                            "flutterwaveTransferId"
                        )

                        break


                # ---------------------------------------------
                # MARK ACCOUNTING FINALIZED
                # ---------------------------------------------

                withdrawal[
                    "accountingFinalized"
                ] = True


                # ---------------------------------------------
                # SAVE
                # ---------------------------------------------

                save_host_wallets(
                    wallets
                )


                # ---------------------------------------------
                # NOTIFY HOST
                # ---------------------------------------------

                create_notification(

                    host_id,

                    "Withdrawal Failed",

                    (
                        f"Your UGX "
                        f"{amount:,} withdrawal "
                        f"could not be completed. "
                        f"The money has been returned "
                        f"to your available balance."
                    ),

                    "withdrawal_failed",

                    "/host-wallet"

                )


                return {

                    "success":
                        True,

                    "status":
                        "failed",

                    "withdrawal":
                        withdrawal,

                    "wallet":
                        wallet

                }


            # =================================================
            # UNKNOWN FINAL STATUS
            # =================================================

            return {

                "success":
                    False,

                "message":
                    "Invalid withdrawal final status."

            }


    # ========================================================
    # WITHDRAWAL NOT FOUND
    # ========================================================

    return {

        "success":
            False,

        "message":
            "Withdrawal not found."

    }

# ============================================================
# INITIATE FLUTTERWAVE HOST WITHDRAWAL
# ============================================================

def initiate_host_flutterwave_transfer(
    withdrawal,
    host_id,
    withdrawal_id,
    host_name=""
):

    if not FLW_SECRET_KEY:

        return {
            "success": False,
            "message":
                "Flutterwave secret key is not configured."
        }


    amount = int(
        withdrawal.get(
            "amount",
            0
        )
        or 0
    )


    method = str(
        withdrawal.get(
            "method",
            ""
        )
        or ""
    ).strip()


    account = str(
        withdrawal.get(
            "account",
            ""
        )
        or ""
    ).strip()


    if amount <= 0:

        return {
            "success": False,
            "message":
                "Invalid withdrawal amount."
        }


    if not account:

        return {
            "success": False,
            "message":
                "Withdrawal account is missing."
        }


    # ========================================================
    # UNIQUE MERCHANT REFERENCE
    # ========================================================

    reference = (
        f"EVENTWAA-WD-"
        f"{host_id}-"
        f"{withdrawal_id}"
    )


    # ========================================================
    # DETERMINE MOBILE MONEY NETWORK
    # ========================================================

    method_upper = method.upper()


    network = None


    if "MTN" in method_upper:

        network = "MTN"


    elif "AIRTEL" in method_upper:

        network = "AIRTEL"


    # ========================================================
    # FLUTTERWAVE V3 TRANSFER PAYLOAD
    #
    # For Uganda mobile money, Flutterwave's v3
    # transfer API uses account_bank + account_number.
    #
    # The exact operator/bank code must correspond
    # to the Flutterwave configuration for the account.
    # ========================================================

    if network:

        # IMPORTANT:
        #
        # We don't guess the Flutterwave operator code here.
        #
        # These should come from your EventWaa configuration
        # once the live Flutterwave payout account is confirmed.

        if network == "MTN":
            account_bank = "MTN"
        else:
            account_bank = "AIRTEL"


        payload = {

            "account_bank":
                account_bank,

            "account_number":
                account,

            "amount":
                amount,

            "currency":
                "UGX",

            "beneficiary_name":
                host_name or "EventWaa Host",

            "reference":
                reference,

            "narration":
                (
                    f"EventWaa host payout "
                    f"{withdrawal_id}"
                )

        }


    else:

        # ====================================================
        # BANK TRANSFER
        # ====================================================
        #
        # Your current withdrawal form only stores:
        #
        # account = account number
        #
        # A real Uganda bank transfer also requires the
        # beneficiary bank code.
        #
        # Therefore we intentionally DO NOT guess it.
        # ====================================================

        bank_code = str(
            withdrawal.get(
                "bankCode",
                ""
            )
            or ""
        ).strip()


        if not bank_code:

            return {
                "success": False,
                "message": (
                    "Bank code is required "
                    "for bank withdrawals."
                )
            }


        payload = {

            "account_bank":
                bank_code,

            "account_number":
                account,

            "amount":
                amount,

            "currency":
                "UGX",

            "beneficiary_name":
                host_name or "EventWaa Host",

            "reference":
                reference,

            "narration":
                (
                    f"EventWaa host payout "
                    f"{withdrawal_id}"
                )

        }


    # ========================================================
    # FLUTTERWAVE REQUEST
    # ========================================================

    headers = {

        "Authorization":
            f"Bearer {FLW_SECRET_KEY}",

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    }


    try:

        response = requests.post(

            f"{FLW_API_URL}/transfers",

            headers=headers,

            json=payload,

            timeout=30

        )

    except Exception as e:

        print(
            "FLUTTERWAVE TRANSFER ERROR:",
            str(e)
        )

        return {
            "success": False,
            "message":
                "Unable to connect to Flutterwave."
        }


    try:

        flutterwave_data = (
            response.json()
        )

    except Exception:

        flutterwave_data = {}


    print(
        "FLUTTERWAVE TRANSFER STATUS:",
        response.status_code
    )

    print(
        "FLUTTERWAVE TRANSFER RESPONSE:",
        flutterwave_data
    )


    # ========================================================
    # HANDLE FLUTTERWAVE ERROR
    # ========================================================

    if (
        response.status_code >= 400
        or
        flutterwave_data.get("status")
        != "success"
    ):

        return {

            "success": False,

            "message":
                (
                    flutterwave_data.get(
                        "message"
                    )
                    or
                    "Flutterwave transfer failed."
                ),

            "reference":
                reference,

            "flutterwave":
                flutterwave_data

        }


    # ========================================================
    # GET TRANSFER DATA
    # ========================================================

    transfer = (
        flutterwave_data.get(
            "data"
        )
        or {}
    )


    transfer_id = transfer.get(
        "id"
    )


    flutterwave_status = str(

        transfer.get(
            "status",
            "NEW"
        )

    ).upper()


    # ========================================================
    # RETURN TRANSFER INFORMATION
    # ========================================================

    return {

        "success":
            True,

        "transferId":
            transfer_id,

        "reference":
            reference,

        "flutterwaveStatus":
            flutterwave_status,

        "transfer":
            transfer

    }



# ============================================================
# APPROVE HOST WITHDRAWAL
#
# FLOW:
#
# pending
#    ↓
# admin approves
#    ↓
# Flutterwave transfer created
#    ↓
# processing
#    ↓
# webhook OR manual status check
#    ↓
# completed OR failed
#
# IMPORTANT:
# We DO NOT mark the withdrawal completed here.
# We DO NOT increase totalWithdrawn here.
# ============================================================

@app.route(
    "/admin/host-withdrawals/approve/<int:host_id>/<int:withdrawal_id>",
    methods=["PUT"]
)
@admin_required
def approve_host_withdrawal(
    host_id,
    withdrawal_id
):

    try:

        wallets = load_host_wallets()

        users = load_json_file(
            "users.json",
            []
        )


        # ====================================================
        # FIND HOST
        # ====================================================

        host = next(

            (
                user

                for user in users

                if int(
                    user.get(
                        "id",
                        0
                    )
                )
                ==
                host_id

            ),

            None

        )


        if not host:

            return jsonify({

                "success":
                    False,

                "message":
                    "Host not found."

            }), 404


        host_name = host.get(
            "name",
            "EventWaa Host"
        )


        # ====================================================
        # FIND HOST WALLET
        # ====================================================

        for wallet in wallets:

            if int(
                wallet.get(
                    "hostId",
                    0
                )
            ) != host_id:

                continue


            # =================================================
            # FIND WITHDRAWAL
            # =================================================

            for withdrawal in wallet.get(
                "withdrawals",
                []
            ):

                if int(
                    withdrawal.get(
                        "id",
                        0
                    )
                ) != withdrawal_id:

                    continue


                # =============================================
                # ONLY PENDING WITHDRAWALS CAN BE APPROVED
                # =============================================

                if withdrawal.get(
                    "status"
                ) != "pending":

                    return jsonify({

                        "success":
                            False,

                        "message":
                            (
                                "This withdrawal "
                                "has already been processed."
                            ),

                        "status":
                            withdrawal.get(
                                "status"
                            )

                    }), 400


                # =============================================
                # GET AMOUNT
                # =============================================

                amount = int(

                    withdrawal.get(
                        "amount",
                        0
                    )

                    or 0

                )


                if amount <= 0:

                    return jsonify({

                        "success":
                            False,

                        "message":
                            "Invalid withdrawal amount."

                    }), 400


                # =============================================
                # ENSURE PENDING PAYOUT EXISTS
                # =============================================

                pending_payouts = int(

                    wallet.get(
                        "pendingPayouts",
                        0
                    )

                    or 0

                )


                if pending_payouts < amount:

                    return jsonify({

                        "success":
                            False,

                        "message":
                            (
                                "Wallet pending payout "
                                "balance is inconsistent."
                            )

                    }), 400


                # =============================================
                # PREVENT DUPLICATE TRANSFER
                #
                # IMPORTANT:
                # We now use ONLY flutterwaveTransferId.
                # =============================================

                if withdrawal.get(
                    "flutterwaveTransferId"
                ):

                    return jsonify({

                        "success":
                            False,

                        "message":
                            (
                                "Flutterwave transfer "
                                "already exists."
                            ),

                        "flutterwaveTransferId":
                            withdrawal.get(
                                "flutterwaveTransferId"
                            )

                    }), 409


                # =============================================
                # INITIATE FLUTTERWAVE TRANSFER
                # =============================================

                transfer_result = (
                    initiate_host_flutterwave_transfer(

                        withdrawal,

                        host_id,

                        withdrawal_id,

                        host_name

                    )
                )


                if not transfer_result.get(
                    "success",
                    False
                ):

                    return jsonify({

                        "success":
                            False,

                        "message":
                            transfer_result.get(
                                "message",
                                "Unable to initiate payout."
                            )

                    }), 400


                # =============================================
                # GET FLUTTERWAVE TRANSFER ID
                # =============================================

                flutterwave_transfer_id = (
                    transfer_result.get(
                        "transferId"
                    )
                )


                if not flutterwave_transfer_id:

                    return jsonify({

                        "success":
                            False,

                        "message":
                            (
                                "Flutterwave did not "
                                "return a transfer ID."
                            )

                    }), 502


                # =============================================
                # STORE FLUTTERWAVE DETAILS
                #
                # ONE STANDARD FIELD:
                #
                # flutterwaveTransferId
                # =============================================

                withdrawal[
                    "flutterwaveTransferId"
                ] = flutterwave_transfer_id


                withdrawal[
                    "transferReference"
                ] = (

                    transfer_result.get(
                        "reference"
                    )

                )


                withdrawal[
                    "flutterwaveStatus"
                ] = (

                    transfer_result.get(
                        "status"
                    )

                )


                # =============================================
                # PROCESSING
                # =============================================

                withdrawal["status"] = (
                    "processing"
                )


                withdrawal["approvedAt"] = (
                    datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                )


                # =============================================
                # UPDATE WALLET TRANSACTION
                # =============================================

                for transaction in wallet.get(
                    "transactions",
                    []
                ):

                    if str(
                        transaction.get(
                            "id",
                            ""
                        )
                    ) == str(
                        f"withdrawal_{withdrawal_id}"
                    ):

                        transaction["status"] = (
                            "processing"
                        )

                        # IMPORTANT:
                        # Use the SAME field name here.
                        transaction["flutterwaveTransferId"]= (
                            withdrawal.get(
                                "flutterwaveTransferId"
                            )
                        )


                        transaction[
                            "approvedAt"
                        ] = withdrawal.get(
                            "approvedAt"
                        )

                        break


                # =============================================
                # SAVE WALLET
                # =============================================

                save_host_wallets(
                    wallets
                )


                # =============================================
                # NOTIFY HOST
                # =============================================

                create_notification(

                    host_id,

                    "Withdrawal Processing",

                    (
                        f"Your UGX "
                        f"{amount:,} withdrawal "
                        f"is now being processed."
                    ),

                    "withdrawal_processing",

                    "/host-wallet"

                )


                # =============================================
                # RESPONSE
                # =============================================

                return jsonify({

                    "success":
                        True,

                    "message":
                        (
                            "Withdrawal approved and "
                            "Flutterwave transfer initiated."
                        ),

                    "status":
                        "processing",

                    "flutterwaveTransferId":
                        flutterwave_transfer_id,

                    "withdrawal":
                        withdrawal,

                    "wallet":
                        wallet

                }), 200


        # ====================================================
        # WITHDRAWAL NOT FOUND
        # ====================================================

        return jsonify({

            "success":
                False,

            "message":
                "Withdrawal not found."

        }), 404


    except Exception as e:

        print(
            "APPROVE HOST WITHDRAWAL ERROR:",
            str(e)
        )

        return jsonify({

            "success":
                False,

            "message":
                "Unable to approve withdrawal."

        }), 500


# ============================================================
# FLUTTERWAVE TRANSFER STATUS FALLBACK
#
# Used when the Flutterwave webhook has not arrived yet.
# It checks the actual transfer status directly from
# Flutterwave.
# ============================================================

@app.route(
    "/admin/host-withdrawals/transfer-status/<int:host_id>/<int:withdrawal_id>",
    methods=["GET"]
)
@admin_required
def get_host_withdrawal_transfer_status(
    host_id,
    withdrawal_id
):

    try:

        # ====================================================
        # CHECK FLUTTERWAVE SECRET KEY
        # ====================================================

        if not FLW_SECRET_KEY:

            return jsonify({
                "success": False,
                "message":
                    "Flutterwave secret key is not configured."
            }), 500


        # ====================================================
        # LOAD HOST WALLETS
        # ====================================================

        wallets = load_host_wallets()


        target_wallet = None
        target_withdrawal = None


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


            if wallet_host_id != host_id:
                continue


            target_wallet = wallet


            for withdrawal in wallet.get(
                "withdrawals",
                []
            ):

                try:

                    current_withdrawal_id = int(
                        withdrawal.get(
                            "id",
                            0
                        )
                    )

                except (
                    TypeError,
                    ValueError
                ):

                    current_withdrawal_id = 0


                if current_withdrawal_id == withdrawal_id:

                    target_withdrawal = withdrawal

                    break


            break


        # ====================================================
        # WITHDRAWAL NOT FOUND
        # ====================================================

        if not target_wallet or not target_withdrawal:

            return jsonify({

                "success": False,

                "message":
                    "Withdrawal not found."

            }), 404


        # ====================================================
        # CHECK TRANSFER ID
        # ====================================================

        transfer_id = (
            target_withdrawal.get(
                "flutterwaveTransferId"
            )
        )


        if not transfer_id:

            return jsonify({

                "success": False,

                "message":
                    "This withdrawal has no Flutterwave transfer ID.",

                "status":
                    target_withdrawal.get(
                        "status",
                        "pending"
                    )

            }), 200


        # ====================================================
        # ASK FLUTTERWAVE FOR CURRENT STATUS
        # ====================================================

        headers = {

            "Authorization":
                f"Bearer {FLW_SECRET_KEY}",

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"

        }


        response = requests.get(

            f"{FLW_API_URL}/transfers/"
            f"{transfer_id}",

            headers=headers,

            timeout=30

        )


        try:

            flutterwave_data = (
                response.json()
            )

        except Exception:

            flutterwave_data = {}


        print(
            "FLUTTERWAVE TRANSFER STATUS:",
            response.status_code
        )

        print(
            "FLUTTERWAVE TRANSFER RESPONSE:",
            flutterwave_data
        )


        # ====================================================
        # FLUTTERWAVE ERROR
        # ====================================================

        if response.status_code >= 400:

            return jsonify({

                "success": False,

                "message":
                    (
                        flutterwave_data.get(
                            "message"
                        )
                        or
                        "Unable to retrieve transfer status."
                    ),

                "status":
                    target_withdrawal.get(
                        "status",
                        "processing"
                    )

            }), 502


        # ====================================================
        # GET TRANSFER DATA
        # ====================================================

        transfer_data = (
            flutterwave_data.get(
                "data"
            )
            or {}
        )


        flutterwave_status = str(
            transfer_data.get(
                "status",
                ""
            )
        ).strip().lower()


        # ====================================================
        # MAP FLUTTERWAVE STATUS TO EVENTWAA STATUS
        # ====================================================

        if flutterwave_status in (
            "successful",
            "success",
            "completed"
        ):

            eventwaa_status = "completed"


        elif flutterwave_status in (
            "failed",
            "cancelled",
            "canceled"
        ):

            eventwaa_status = "failed"


        else:

            eventwaa_status = "processing"


        # ====================================================
        # UPDATE WITHDRAWAL STATUS
        # ====================================================

        target_withdrawal["status"] = (
            eventwaa_status
        )


        target_withdrawal["flutterwaveStatus"] = (
            flutterwave_status
        )


        target_withdrawal["lastCheckedAt"] = (
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        )


        # ====================================================
        # FINALIZE SUCCESSFUL WITHDRAWAL
        #
        # IMPORTANT:
        # Only finalize totalWithdrawn when the transfer
        # is actually successful.
        # ====================================================

        if eventwaa_status == "completed":

            if not target_withdrawal.get(
                "accountingFinalized",
                False
            ):

                amount = int(
                    target_withdrawal.get(
                        "amount",
                        0
                    )
                    or 0
                )


                target_wallet["pendingPayouts"] = max(

                    0,

                    int(
                        target_wallet.get(
                            "pendingPayouts",
                            0
                        )
                        or 0
                    )
                    -
                    amount

                )


                target_wallet["totalWithdrawn"] = (

                    int(
                        target_wallet.get(
                            "totalWithdrawn",
                            0
                        )
                        or 0
                    )
                    +
                    amount

                )


                target_withdrawal[
                    "accountingFinalized"
                ] = True


                target_withdrawal[
                    "reviewedAt"
                ] = datetime.now().strftime(
                    "%Y-%m-%d"
                )


                create_notification(

                    host_id,

                    "Withdrawal Completed",

                    (
                        f"Your UGX "
                        f"{amount:,} withdrawal "
                        f"has been completed."
                    ),

                    "withdrawal_completed",

                    "/host-wallet"

                )


        # ====================================================
        # FAILED TRANSFER
        #
        # Return the amount from pending back to
        # available balance.
        # ====================================================

        elif eventwaa_status == "failed":

            if not target_withdrawal.get(
                "accountingFinalized",
                False
            ):

                amount = int(
                    target_withdrawal.get(
                        "amount",
                        0
                    )
                    or 0
                )


                target_wallet["pendingPayouts"] = max(

                    0,

                    int(
                        target_wallet.get(
                            "pendingPayouts",
                            0
                        )
                        or 0
                    )
                    -
                    amount

                )


                target_wallet["availableBalance"] = (

                    int(
                        target_wallet.get(
                            "availableBalance",
                            0
                        )
                        or 0
                    )
                    +
                    amount

                )


                target_withdrawal[
                    "accountingFinalized"
                ] = True


                target_withdrawal[
                    "failureReason"
                ] = (
                    flutterwave_data.get(
                        "message"
                    )
                    or
                    transfer_data.get(
                        "complete_message"
                    )
                    or
                    "Flutterwave transfer failed."
                )


                create_notification(

                    host_id,

                    "Withdrawal Failed",

                    (
                        f"Your UGX "
                        f"{amount:,} withdrawal "
                        f"could not be completed. "
                        f"The funds have been returned "
                        f"to your available balance."
                    ),

                    "withdrawal_failed",

                    "/host-wallet"

                )


        # ====================================================
        # SAVE
        # ====================================================

        save_host_wallets(
            wallets
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "success": True,

            "withdrawalId":
                withdrawal_id,

            "hostId":
                host_id,

            "transferId":
                transfer_id,

            "status":
                eventwaa_status,

            "flutterwaveStatus":
                flutterwave_status,

            "withdrawal":
                target_withdrawal

        }), 200


    except Exception as e:

        print(
            "TRANSFER STATUS FALLBACK ERROR:",
            str(e)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to check transfer status."

        }), 500

# ============================================================
# FLUTTERWAVE TRANSFER WEBHOOK
# ============================================================

@app.route(
    "/flutterwave/transfer-webhook",
    methods=["POST"]
)
def flutterwave_transfer_webhook():

    try:

        # ====================================================
        # READ WEBHOOK
        # ====================================================

        data = request.get_json(
            silent=True
        ) or {}


        print(
            "FLUTTERWAVE TRANSFER WEBHOOK:",
            data
        )


        # ====================================================
        # VERIFY WEBHOOK SECRET HASH
        #
        # Flutterwave sends the webhook secret hash in
        # the request headers.
        # ====================================================

        webhook_hash = request.headers.get(
            "verif-hash",
            ""
        ).strip()


        if (
            FLW_SECRET_HASH
            and
            webhook_hash != FLW_SECRET_HASH
        ):

            print(
                "INVALID FLUTTERWAVE WEBHOOK HASH"
            )

            return jsonify({

                "success":
                    False,

                "message":
                    "Invalid webhook signature."

            }), 401


        # ====================================================
        # GET EVENT TYPE
        # ====================================================

        event_type = str(
            data.get(
                "event.type",
                data.get(
                    "type",
                    ""
                )
            )
        ).lower()


        # Flutterwave transfer webhook data may be contained
        # inside "data".
        transfer = (
            data.get(
                "data"
            )
            or {}
        )


        # ====================================================
        # TRANSFER ID
        # ====================================================

        transfer_id = (

            transfer.get(
                "id"
            )

            or

            transfer.get(
                "transfer_id"
            )

        )


        if not transfer_id:

            print(
                "TRANSFER WEBHOOK WITHOUT TRANSFER ID"
            )

            return jsonify({

                "success":
                    True,

                "message":
                    "Webhook received."

            }), 200


        # ====================================================
        # TRANSFER STATUS
        # ====================================================

        transfer_status = str(

            transfer.get(
                "status",
                ""
            )

        ).upper()


        # ====================================================
        # FIND HOST WITHDRAWAL
        # ====================================================

        wallets = load_host_wallets()


        matched_host_id = None
        matched_withdrawal_id = None


        for wallet in wallets:

            for withdrawal in wallet.get(
                "withdrawals",
                []
            ):

                saved_transfer_id = str(

                    withdrawal.get(
                        "flutterwaveTransferId",
                        ""
                    )

                )


                if saved_transfer_id == str(
                    transfer_id
                ):

                    matched_host_id = int(
                        wallet.get(
                            "hostId",
                            0
                        )
                    )

                    matched_withdrawal_id = int(
                        withdrawal.get(
                            "id",
                            0
                        )
                    )

                    break


            if matched_host_id is not None:

                break


        # ====================================================
        # UNKNOWN TRANSFER
        # ====================================================

        if matched_host_id is None:

            print(
                "UNKNOWN FLUTTERWAVE TRANSFER:",
                transfer_id
            )

            return jsonify({

                "success":
                    True,

                "message":
                    "Transfer not associated with EventWaa."

            }), 200


        # ====================================================
        # SUCCESSFUL
        # ====================================================

        if transfer_status == "SUCCESSFUL":

            result = finalize_host_withdrawal(

                matched_host_id,

                matched_withdrawal_id,

                "successful",

                flutterwave_transfer_id=
                    transfer_id,

                flutterwave_reference=
                    transfer.get(
                        "reference"
                    ),

                flutterwave_response=
                    data

            )

            return jsonify(
                result
            ), 200


        # ====================================================
        # FAILED
        # ====================================================

        if transfer_status == "FAILED":

            result = finalize_host_withdrawal(

                matched_host_id,

                matched_withdrawal_id,

                "failed",

                flutterwave_transfer_id=
                    transfer_id,

                flutterwave_reference=
                    transfer.get(
                        "reference"
                    ),

                flutterwave_response=
                    data

            )

            return jsonify(
                result
            ), 200


        # ====================================================
        # PENDING / NEW / PROCESSING
        # ====================================================

        # Do NOT alter wallet balances.
        #
        # The money remains reserved in pendingPayouts.

        return jsonify({

            "success":
                True,

            "message":
                "Transfer still processing.",

            "status":
                transfer_status

        }), 200


    except Exception as e:

        print(
            "FLUTTERWAVE TRANSFER WEBHOOK ERROR:",
            str(e)
        )

        return jsonify({

            "success":
                False,

            "message":
                "Webhook processing failed."

        }), 500

# ============================================================
# VERIFY HOST FLUTTERWAVE WITHDRAWAL
#
# This endpoint checks the actual Flutterwave transfer.
#
# PROCESS:
#
# processing
#      ↓
# Flutterwave GET /transfers/<id>
#      ↓
# SUCCESSFUL
#      ↓
# completed
#
# OR
#
# FAILED
#      ↓
# failed
#      ↓
# return money to availableBalance
# ============================================================

@app.route(
    "/admin/host-withdrawals/verify/<int:host_id>/<int:withdrawal_id>",
    methods=["PUT"]
)
@admin_required
def verify_host_withdrawal(
    host_id,
    withdrawal_id
):

    try:

        # ====================================================
        # CHECK FLUTTERWAVE CONFIGURATION
        # ====================================================

        if not FLW_SECRET_KEY:

            return jsonify({

                "success": False,

                "message":
                    "Flutterwave secret key is not configured."

            }), 500


        # ====================================================
        # LOAD HOST WALLETS
        # ====================================================

        wallets = load_host_wallets()


        # ====================================================
        # FIND HOST WALLET
        # ====================================================

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

            return jsonify({

                "success": False,

                "message":
                    "Host wallet not found."

            }), 404


        # ====================================================
        # FIND WITHDRAWAL
        # ====================================================

        withdrawal = None

        for item in host_wallet.get(
            "withdrawals",
            []
        ):

            try:

                item_id = int(
                    item.get(
                        "id",
                        0
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                item_id = 0


            if item_id == withdrawal_id:

                withdrawal = item

                break


        if not withdrawal:

            return jsonify({

                "success": False,

                "message":
                    "Withdrawal not found."

            }), 404


        # ====================================================
        # CHECK CURRENT STATUS
        # ====================================================

        current_status = str(
            withdrawal.get(
                "status",
                ""
            )
        ).lower()


        if current_status == "completed":

            return jsonify({

                "success": True,

                "message":
                    "Withdrawal is already completed.",

                "alreadyProcessed":
                    True,

                "withdrawal":
                    withdrawal

            }), 200


        if current_status != "processing":

            return jsonify({

                "success": False,

                "message":
                    (
                        "This withdrawal is not currently "
                        "being processed."
                    ),

                "status":
                    current_status

            }), 400


        # ====================================================
        # GET FLUTTERWAVE TRANSFER ID
        # ====================================================

        transfer_id = withdrawal.get(
            "transferId"
        )


        if not transfer_id:

            return jsonify({

                "success": False,

                "message":
                    (
                        "Flutterwave transfer ID "
                        "is missing."
                    )

            }), 400


        # ====================================================
        # QUERY FLUTTERWAVE
        #
        # Flutterwave provides:
        #
        # GET /v3/transfers/{id}
        #
        # to retrieve the actual transfer status.
        # ====================================================

        headers = {

            "Authorization":
                f"Bearer {FLW_SECRET_KEY}",

            "Content-Type":
                "application/json"

        }


        try:

            verification_response = requests.get(

                f"{FLW_API_URL}/transfers/"
                f"{transfer_id}",

                headers=headers,

                timeout=30

            )

            verification_data = (
                verification_response.json()
            )

        except Exception as e:

            print(
                "FLUTTERWAVE TRANSFER VERIFY ERROR:",
                str(e)
            )

            return jsonify({

                "success": False,

                "message":
                    (
                        "Unable to verify the "
                        "Flutterwave transfer."
                    )

            }), 502


        # ====================================================
        # FLUTTERWAVE API ERROR
        # ====================================================

        if verification_response.status_code >= 400:

            return jsonify({

                "success": False,

                "message":
                    (
                        verification_data.get(
                            "message"
                        )
                        or
                        "Flutterwave transfer verification failed."
                    ),

                "flutterwave":
                    verification_data

            }), 400


        # ====================================================
        # GET TRANSFER DATA
        # ====================================================

        transfer = (
            verification_data.get(
                "data"
            )
            or {}
        )


        flutterwave_status = str(
            transfer.get(
                "status",
                ""
            )
        ).upper()


        # ====================================================
        # STORE LATEST FLUTTERWAVE STATUS
        # ====================================================

        withdrawal["flutterwaveStatus"] = (
            flutterwave_status
        )


        # ====================================================
        # TRANSFER STILL PROCESSING
        # ====================================================

        if flutterwave_status in (
            "NEW",
            "PENDING"
        ):

            withdrawal["status"] = (
                "processing"
            )

            save_host_wallets(
                wallets
            )

            return jsonify({

                "success": True,

                "message":
                    (
                        "Flutterwave is still "
                        "processing the withdrawal."
                    ),

                "status":
                    "processing",

                "withdrawal":
                    withdrawal

            }), 200


        # ====================================================
        # TRANSFER FAILED
        # ====================================================

        if flutterwave_status in (
            "FAILED",
            "CANCELLED"
        ):

            amount = int(
                withdrawal.get(
                    "amount",
                    0
                )
                or 0
            )


            # ----------------------------------------------
            # RETURN MONEY TO AVAILABLE BALANCE
            # ----------------------------------------------

            host_wallet["availableBalance"] = (

                int(
                    host_wallet.get(
                        "availableBalance",
                        0
                    )
                    or 0
                )
                +
                amount

            )


            # ----------------------------------------------
            # REMOVE FROM PENDING
            # ----------------------------------------------

            host_wallet["pendingPayouts"] = max(

                0,

                int(
                    host_wallet.get(
                        "pendingPayouts",
                        0
                    )
                    or 0
                )
                -
                amount

            )


            # ----------------------------------------------
            # MARK WITHDRAWAL FAILED
            # ----------------------------------------------

            withdrawal["status"] = (
                "failed"
            )

            withdrawal["failedAt"] = (
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )

            withdrawal["failureReason"] = (

                transfer.get(
                    "complete_message"
                )
                or
                transfer.get(
                    "message"
                )
                or
                "Flutterwave transfer failed."

            )


            # ----------------------------------------------
            # WALLET TRANSACTION
            # ----------------------------------------------

            host_wallet.setdefault(
                "transactions",
                []
            ).append({

                "id":
                    (
                        f"withdrawal_failed_"
                        f"{withdrawal_id}"
                    ),

                "type":
                    "withdrawal_failed",

                "description":
                    "Withdrawal failed - funds returned",

                "amount":
                    amount,

                "method":
                    withdrawal.get(
                        "method"
                    ),

                "date":
                    datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),

                "status":
                    "failed"

            })


            save_host_wallets(
                wallets
            )


            # ----------------------------------------------
            # NOTIFY HOST
            # ----------------------------------------------

            create_notification(

                host_id,

                "Withdrawal Failed",

                (
                    f"Your UGX {amount:,} "
                    f"withdrawal could not be completed. "
                    f"The money has been returned "
                    f"to your available balance."
                ),

                "withdrawal_failed",

                "/host-wallet"

            )


            return jsonify({

                "success": False,

                "message":
                    (
                        "Flutterwave transfer failed. "
                        "Funds have been returned "
                        "to the host wallet."
                    ),

                "status":
                    "failed",

                "withdrawal":
                    withdrawal

            }), 400


        # ====================================================
        # SUCCESSFUL TRANSFER
        # ====================================================

        if flutterwave_status == "SUCCESSFUL":

            amount = int(
                withdrawal.get(
                    "amount",
                    0
                )
                or 0
            )


            # ----------------------------------------------
            # REMOVE FROM PENDING PAYOUTS
            # ----------------------------------------------

            host_wallet["pendingPayouts"] = max(

                0,

                int(
                    host_wallet.get(
                        "pendingPayouts",
                        0
                    )
                    or 0
                )
                -
                amount

            )


            # ----------------------------------------------
            # ADD TO TOTAL WITHDRAWN
            # ----------------------------------------------

            host_wallet["totalWithdrawn"] = (

                int(
                    host_wallet.get(
                        "totalWithdrawn",
                        0
                    )
                    or 0
                )
                +
                amount

            )


            # ----------------------------------------------
            # MARK WITHDRAWAL COMPLETED
            # ----------------------------------------------

            withdrawal["status"] = (
                "completed"
            )

            withdrawal["completedAt"] = (
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )


            # ----------------------------------------------
            # STORE PROOF IF AVAILABLE
            # ----------------------------------------------

            if transfer.get(
                "payment_information"
            ):

                withdrawal["paymentProof"] = (
                    transfer.get(
                        "payment_information",
                        {}
                    ).get(
                        "proof"
                    )
                )


            # ----------------------------------------------
            # UPDATE WALLET TRANSACTION
            # ----------------------------------------------

            withdrawal_transaction_id = (
                f"withdrawal_{withdrawal_id}"
            )


            transaction_found = False


            for transaction in host_wallet.get(
                "transactions",
                []
            ):

                if str(
                    transaction.get(
                        "id"
                    )
                ) == withdrawal_transaction_id:

                    transaction["status"] = (
                        "completed"
                    )

                    transaction["completedAt"] = (
                        datetime.now().strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                    )

                    transaction_found = True

                    break


            # ----------------------------------------------
            # SAFETY:
            # CREATE TRANSACTION IF MISSING
            # ----------------------------------------------

            if not transaction_found:

                host_wallet.setdefault(
                    "transactions",
                    []
                ).append({

                    "id":
                        withdrawal_transaction_id,

                    "type":
                        "withdrawal",

                    "description":
                        "Withdrawal completed",

                    "amount":
                        -amount,

                    "method":
                        withdrawal.get(
                            "method"
                        ),

                    "date":
                        withdrawal.get(
                            "date"
                        ),

                    "completedAt":
                        datetime.now().strftime(
                            "%Y-%m-%d %H:%M:%S"
                        ),

                    "status":
                        "completed"

                })


            # ----------------------------------------------
            # SAVE WALLET
            # ----------------------------------------------

            save_host_wallets(
                wallets
            )


            # ----------------------------------------------
            # NOTIFY HOST
            # ----------------------------------------------

            create_notification(

                host_id,

                "Withdrawal Completed",

                (
                    f"Your UGX {amount:,} "
                    f"withdrawal has been successfully "
                    f"sent to your {withdrawal.get('method')}."
                ),

                "withdrawal_completed",

                "/host-wallet"

            )


            return jsonify({

                "success": True,

                "message":
                    (
                        "Flutterwave confirmed the "
                        "withdrawal successfully."
                    ),

                "status":
                    "completed",

                "withdrawal":
                    withdrawal

            }), 200


        # ====================================================
        # UNKNOWN FLUTTERWAVE STATUS
        # ====================================================

        save_host_wallets(
            wallets
        )


        return jsonify({

            "success": False,

            "message":
                (
                    "Unknown Flutterwave transfer status."
                ),

            "status":
                flutterwave_status,

            "withdrawal":
                withdrawal

        }), 400


    except Exception as e:

        print(
            "VERIFY HOST WITHDRAWAL ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to verify withdrawal."

        }), 500


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
    print("==========================================")
    print(" EventWaa Backend Starting...")
    print("==========================================")
    print("Settings:", load_admin_settings())

    port = int(os.environ.get("PORT", 5000))
    # Railway provides ports automatically, use 5000 locally.
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )