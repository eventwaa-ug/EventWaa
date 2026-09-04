import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  QRCodeCanvas,
} from "qrcode.react";

import {
  ArrowLeft,
  Download,
  CalendarDays,
  MapPin,
  Clock3,
  Globe,
  Ticket as TicketIcon,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

import {
  usePlatformSettings,
} from "../context/PlatformSettingsContext";

import "../styles/TicketDetails.css";


function TicketDetails() {

  const {
    bookingId,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    settings,
  } =
    usePlatformSettings();


  const [
    booking,
    setBooking,
  ] =
    useState(null);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  // ============================================================
  // BACKEND
  // ============================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";


  // ============================================================
  // LOAD BOOKING
  // ============================================================

  useEffect(() => {

    let isMounted =
      true;


    const fetchBooking =
      async () => {

        try {

          setLoading(
            true
          );

          setError(
            ""
          );


          if (
            !bookingId
          ) {
            throw new Error(
              "No booking ID was provided."
            );
          }


          const requestedBookingId =
            String(
              bookingId
            ).trim();


          const response =
            await fetch(
              `${API_URL}/bookings`
            );


          if (
            !response.ok
          ) {
            throw new Error(
              `Unable to load booking. Server returned ${response.status}.`
            );
          }


          const data =
            await response.json();


          const bookings =
            Array.isArray(
              data
            )
              ? data
              : Array.isArray(
                  data?.bookings
                )
              ? data.bookings
              : [];


          let foundBooking =
            null;


          for (
            const item of
            bookings
          ) {

            if (
              !item ||
              typeof item !==
                "object"
            ) {
              continue;
            }


            const currentBookingId =
              String(
                item.id ||
                item.bookingId ||
                item._id ||
                item.ticketId ||
                ""
              ).trim();


            if (
              currentBookingId ===
              requestedBookingId
            ) {

              foundBooking =
                item;

              break;

            }

          }


          if (
            !foundBooking
          ) {

            if (
              isMounted
            ) {

              setBooking(
                null
              );

              setError(
                "Booking not found."
              );

            }

            return;

          }


          if (
            isMounted
          ) {

            setBooking(
              foundBooking
            );

          }


          console.log(
            "BOOKING DETAILS:",
            foundBooking
          );

        } catch (
          err
        ) {

          console.error(
            "BOOKING DETAILS LOAD ERROR:",
            err
          );


          if (
            isMounted
          ) {

            setBooking(
              null
            );

            setError(
              err?.message ||
              "Unable to load this booking."
            );

          }

        } finally {

          if (
            isMounted
          ) {

            setLoading(
              false
            );

          }

        }

      };


    fetchBooking();


    return () => {

      isMounted =
        false;

    };

  }, [
    bookingId,
    API_URL,
  ]);


  // ============================================================
  // PLATFORM LOGO
  // ============================================================

  const getLogoUrl =
    () => {

      const logo =
        settings?.platformLogo;


      if (
        !logo
      ) {
        return "";
      }


      const imagePath =
        String(
          logo
        ).trim();


      if (
        !imagePath
      ) {
        return "";
      }


      if (
        imagePath.startsWith(
          "http://"
        ) ||
        imagePath.startsWith(
          "https://"
        )
      ) {

        return imagePath;

      }


      if (
        imagePath.startsWith(
          "/"
        )
      ) {

        return `${API_URL}${imagePath}`;

      }


      return `${API_URL}/${imagePath}`;

    };


  const platformLogo =
    getLogoUrl();


  const platformName =
    settings?.platformName ||
    "EventWaa";


  // ============================================================
  // DOWNLOAD
  // ============================================================

  const downloadTicket =
    () => {

      window.print();

    };


  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading
  ) {

    return (

      <div className="ticket-state">

        <div className="ticket-loader">
        </div>

        <h2>
          Loading your tickets...
        </h2>

        <p>
          Please wait while EventWaa retrieves
          your booking.
        </p>

      </div>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (
    error ||
    !booking
  ) {

    return (

      <div className="ticket-state">

        <div className="ticket-state-icon">

          <TicketIcon
            size={42}
            strokeWidth={2}
          />

        </div>


        <h2>
          Booking not found
        </h2>


        <p>
          {error ||
            "We couldn't find this booking."}
        </p>


        <button
          className="back-ticket-btn"
          type="button"
          onClick={() =>
            navigate(
              "/tickets"
            )
          }
        >
          Back to My Tickets
        </button>

      </div>

    );

  }


  // ============================================================
  // BOOKING TICKETS
  // ============================================================

  let bookingTickets =
    Array.isArray(
      booking.tickets
    )
      ? booking.tickets
      : [];


  // Legacy support
  if (
    bookingTickets.length ===
      0 &&
    booking.ticketId
  ) {

    bookingTickets = [
      {
        ticketId:
          booking.ticketId,

        ticketType:
          booking.ticketType ||
          "Regular",

        checkedIn:
          booking.checkedIn ||
          false,

        refundStatus:
          booking.refundStatus ||
          "",
      },
    ];

  }


  // ============================================================
  // BUYER
  // ============================================================

  const buyer =
    booking.buyer &&
    typeof booking.buyer ===
      "object"
      ? booking.buyer
      : {};


  // ============================================================
  // EVENT DATE
  // ============================================================

  const eventDate =
    booking.eventDate ||
    booking.date ||
    "";


  // ============================================================
  // EVENT PASSED
  // ============================================================

  let eventHasPassed =
    false;


  if (
    eventDate
  ) {

    const parsedDate =
      new Date(
        eventDate
      );


    if (
      !Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      eventHasPassed =
        parsedDate <
        new Date();

    }

  }


  // ============================================================
  // QUANTITY
  // ============================================================

  const quantity =
    Number(
      booking.quantity ||
      bookingTickets.length ||
      1
    );


  // ============================================================
  // TOTAL AMOUNT
  // ============================================================

  const totalAmount =
    Number(
      booking.customerTotal ??
      booking.totalPrice ??
      0
    );


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="ticket-page">

      <div className="ticket-wrapper">


        {/* ======================================================
            TOP ACTIONS
        ====================================================== */}

        <div className="ticket-actions">

          <button
            className="back-btn"
            type="button"
            onClick={() =>
              navigate(
                -1
              )
            }
          >

            <ArrowLeft
              size={17}
              strokeWidth={2.3}
            />

            Back

          </button>


          <button
            className="download-btn"
            type="button"
            onClick={
              downloadTicket
            }
          >

            <Download
              size={17}
              strokeWidth={2.3}
            />

            Download Tickets

          </button>

        </div>


        {/* ======================================================
            BOOKING CARD
        ====================================================== */}

        <div
          className="ticket-card"
          id="eventwaa-ticket"
        >


          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="ticket-header">

            <div className="platform-brand">

              {platformLogo ? (

                <img
                  src={platformLogo}
                  alt={platformName}
                  className="platform-logo"
                  onError={(event) => {

                    event.currentTarget.style.display =
                      "none";

                  }}
                />

              ) : (

                <div className="platform-logo-fallback">
                  EW
                </div>

              )}


              <div className="platform-name">
                {platformName}
              </div>

            </div>


            <div className="ticket-label">
              BOOKING CONFIRMATION
            </div>

          </div>


          {/* ====================================================
              EVENT
          ==================================================== */}

          <div className="ticket-event">

            <div className="ticket-event-info">

              <span className="ticket-eyebrow">
                YOUR EVENT
              </span>


              <h1>
                {booking.eventTitle ||
                  "EventWaa Event"}
              </h1>


              <div className="ticket-meta">


                {(
                  booking.eventVenue ||
                  booking.venue
                ) && (

                  <span>

                    <MapPin
                      size={16}
                      strokeWidth={2}
                    />

                    {booking.eventVenue ||
                      booking.venue}

                  </span>

                )}


                {eventDate && (

                  <span>

                    <CalendarDays
                      size={16}
                      strokeWidth={2}
                    />

                    {eventDate}

                  </span>

                )}


                {(
                  booking.eventTime ||
                  booking.time
                ) && (

                  <span>

                    <Clock3
                      size={16}
                      strokeWidth={2}
                    />

                    {booking.eventTime ||
                      booking.time}

                  </span>

                )}


                {(
                  booking.eventCity ||
                  booking.city
                ) && (

                  <span>

                    <Globe
                      size={16}
                      strokeWidth={2}
                    />

                    {booking.eventCity ||
                      booking.city}

                  </span>

                )}

              </div>

            </div>

          </div>


          {/* ====================================================
              PERFORATION
          ==================================================== */}

          <div className="ticket-perforation">

            <span>
            </span>

            <div>
            </div>

            <span>
            </span>

          </div>


          {/* ====================================================
              BOOKING INFORMATION
          ==================================================== */}

          <div className="ticket-body">

            <div className="ticket-information">


              <div className="ticket-info-grid">


                <div className="ticket-info-item">

                  <span>
                    BOOKED BY
                  </span>

                  <strong>
                    {buyer.name ||
                      booking.name ||
                      "Guest"}
                  </strong>

                </div>


                <div className="ticket-info-item">

                  <span>
                    TICKET TYPE
                  </span>

                  <strong>
                    {bookingTickets[0]?.ticketType ||
                      booking.ticketType ||
                      "Regular"}
                  </strong>

                </div>


                <div className="ticket-info-item">

                  <span>
                    TICKETS
                  </span>

                  <strong>
                    {quantity}
                  </strong>

                </div>


                <div className="ticket-info-item">

                  <span>
                    AMOUNT PAID
                  </span>

                  <strong>
                    UGX{" "}
                    {totalAmount.toLocaleString()}
                  </strong>

                </div>

              </div>


              <div className="ticket-email">

                <span>
                  EMAIL
                </span>

                <strong>
                  {buyer.email ||
                    booking.email ||
                    "Not available"}
                </strong>

              </div>


              <div className="ticket-status">

                <div className={
                  eventHasPassed
                    ? "status pending"
                    : "status valid"
                }>

                  {eventHasPassed ? (

                    <Clock
                      size={25}
                      strokeWidth={2.2}
                    />

                  ) : (

                    <CheckCircle
                      size={25}
                      strokeWidth={2.2}
                    />

                  )}


                  <div>

                    <strong>

                      {eventHasPassed
                        ? "Event Passed"
                        : "Booking Confirmed"}

                    </strong>


                    <p>

                      {eventHasPassed
                        ? "This event has already taken place."
                        : `Your booking includes ${quantity} individual ticket${
                            quantity !== 1
                              ? "s"
                              : ""
                          }.`}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* ====================================================
              INDIVIDUAL TICKETS
          ==================================================== */}

          <div className="booking-tickets-section">


            <div className="booking-tickets-heading">

              <TicketIcon
                size={22}
              />

              <div>

                <h2>
                  Your Tickets
                </h2>

                <p>
                  Each QR code represents one
                  individual event entry.
                </p>

              </div>

            </div>


            <div className="booking-tickets-grid">


              {bookingTickets.map(
                (
                  individualTicket,
                  index
                ) => {

                  const qrValue =
                    String(
                      individualTicket.ticketId ||
                      ""
                    ).trim();


                  const isCheckedIn =
                    individualTicket.checkedIn ===
                    true;


                  const refundStatus =
                    String(
                      individualTicket.refundStatus ||
                      booking.refundStatus ||
                      ""
                    )
                      .trim()
                      .toLowerCase();


                  const isRefunded =
                    refundStatus ===
                    "refunded";


                  return (

                    <div
                      className={`individual-ticket ${
                        isCheckedIn
                          ? "individual-ticket-used"
                          : ""
                      } ${
                        isRefunded
                          ? "individual-ticket-refunded"
                          : ""
                      }`}
                      key={
                        qrValue ||
                        index
                      }
                    >


                      <div className="individual-ticket-top">

                        <strong>
                          Ticket{" "}
                          {index + 1}
                        </strong>


                        {isRefunded ? (

                          <span className="status refunded">
                            Refunded
                          </span>

                        ) : isCheckedIn ? (

                          <span className="status used">
                            Used
                          </span>

                        ) : eventHasPassed ? (

                          <span className="status passed">
                            Passed
                          </span>

                        ) : (

                          <span className="status confirmed">
                            Confirmed
                          </span>

                        )}

                      </div>


                      <div className="individual-ticket-type">

                        {individualTicket.ticketType ||
                          booking.ticketType ||
                          "Regular"}

                      </div>


                      {isRefunded ? (

                        <div className="qr-disabled">

                          <XCircle
                            size={42}
                          />

                          <p>
                            Ticket Invalid
                          </p>

                        </div>

                      ) : (

                        <div className="individual-qr">

                          <QRCodeCanvas
                            value={
                              qrValue
                            }
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#111827"
                            level="H"
                            includeMargin={true}
                          />

                        </div>

                      )}


                      <div className="individual-ticket-id">

                        <span>
                          TICKET ID
                        </span>

                        <strong>
                          {qrValue ||
                            "N/A"}
                        </strong>

                      </div>


                      <p className="individual-ticket-caption">

                        {isRefunded
                          ? "This ticket is no longer valid."
                          : isCheckedIn
                          ? "This ticket has already been used."
                          : eventHasPassed
                          ? "This event has already passed."
                          : "Scan this QR code at the event entrance."}

                      </p>

                    </div>

                  );

                }
              )}

            </div>

          </div>


          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="ticket-footer">

            <div>

              <strong>
                {platformName}
              </strong>

              <span>
                Discover. Book. Experience.
              </span>

            </div>


            <span>
              {quantity} Ticket
              {quantity !== 1
                ? "s"
                : ""}
            </span>

          </div>

        </div>


        <p className="ticket-download-note">

          Use{" "}

          <strong>
            Download Tickets
          </strong>

          {" "}

          to save or print your EventWaa
          booking confirmation.

        </p>

      </div>

    </div>

  );

}


export default TicketDetails;