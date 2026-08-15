import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import HostLayout from "./layouts/HostLayout";
import AdminLayout from "./layouts/AdminLayout";

/* =========================================================
   MAIN / USER PAGES
========================================================= */

import Home from "./pages/home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import UserMessages from "./pages/UserMessages";

import Tickets from "./pages/Tickets";
import Favorites from "./pages/Favorites";
import UpcomingEvents from "./pages/UpcomingEvents";
import Settings from "./pages/Settings";

import Booking from "./pages/Booking";
import Review from "./pages/Review";

import FreeAttendance from "./pages/FreeAttendance";
import AttendancePass from "./pages/AttendancePass";
import FreeTicketDetails from "./pages/FreeTicketsDetails";

import TicketDetails from "./pages/TicketDetails";

/* =========================================================
   AUTH
========================================================= */

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* =========================================================
   HOST
========================================================= */

import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import HostEvents from "./pages/HostEvents";
import HostWallet from "./pages/HostWallet";
import HostRefunds from "./pages/HostRefunds";

import HostApplication from "./pages/HostApplication";
import HostVerification from "./pages/HostVerification";

import HostProfile from "./pages/HostProfile";
import EditHostProfile from "./pages/EditHostProfile";

import HostMessages from "./pages/HostMessages";
import ChatWithHost from "./pages/ChatWithHost";
import HostChat from "./pages/HostChat";

import TicketScanner from "./pages/TicketScanner";
import Attendees from "./pages/Attendees";

import RequestRefund from "./pages/RequestRefund";

/* =========================================================
   PAYMENTS
========================================================= */

import PaymentProcessing from "./pages/PaymentProcessing";
import PaymentSuccess from "./pages/PaymentSuccess";

/* =========================================================
   ADMIN
========================================================= */

import AdminHome from "./pages/AdminHome";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHostApplications from "./pages/AdminHostApplications";
import AdminEvents from "./pages/AdminEvents";
import AdminUsers from "./pages/AdminUsers";
import AdminRevenue from "./pages/AdminRevenue";
import AdminSettings from "./pages/AdminSettings";
import AdminWallet from "./pages/AdminWallet";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminNotifications from "./pages/AdminNotifications";
import AdminReports from "./pages/AdminReports";
import AdminCreateEvent from "./pages/AdminCreateEvent";
import AdminEditEvent from "./pages/AdminEditEvent";
import AdminRefunds from "./pages/AdminRefunds";

/* =========================================================
   PUBLIC INFORMATION PAGES
========================================================= */

import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ContactUs from "./pages/ContactUs";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";

/* =========================================================
   GUARDS
========================================================= */

import ProtectedRoute from "./components/ProtectedRoute";
import MaintenanceGuard from "./components/MaintenanceGuard";


function App() {
  return (
    <MaintenanceGuard>

      <Routes>

        {/* =====================================================
            MAIN WEBSITE
        ===================================================== */}

        <Route path="/" element={<MainLayout />}>

          {/* ---------------------------------------------------
              HOME
          --------------------------------------------------- */}

          <Route
            index
            element={<Home />}
          />

          {/* ---------------------------------------------------
              EVENTS
          --------------------------------------------------- */}

          <Route
            path="events"
            element={<Events />}
          />

          <Route
            path="events/:id"
            element={<EventDetails />}
          />

          {/* ---------------------------------------------------
              PROFILE
          --------------------------------------------------- */}

          <Route
            path="profile"
            element={<Profile />}
          />

          {/* ---------------------------------------------------
              NOTIFICATIONS
          --------------------------------------------------- */}

          <Route
            path="notifications"
            element={<Notifications />}
          />

          {/* ---------------------------------------------------
              USER MESSAGES
          --------------------------------------------------- */}

          <Route
            path="messages"
            element={<UserMessages />}
          />

          {/* ---------------------------------------------------
              MY TICKETS
              
              MOVED HERE FROM AUTH LAYOUT
              SO IT GETS NAVBAR + SCROLL CONTROLS
          --------------------------------------------------- */}

          <Route
            path="tickets"
            element={<Tickets />}
          />

          {/* ---------------------------------------------------
              FAVORITES
              
              MOVED HERE FROM AUTH LAYOUT
          --------------------------------------------------- */}

          <Route
            path="favorites"
            element={<Favorites />}
          />

          {/* ---------------------------------------------------
              UPCOMING EVENTS
              
              MOVED HERE FROM AUTH LAYOUT
          --------------------------------------------------- */}

          <Route
            path="upcoming"
            element={<UpcomingEvents />}
          />

          {/* ---------------------------------------------------
              SETTINGS
              
              MOVED HERE FROM AUTH LAYOUT
          --------------------------------------------------- */}

          <Route
            path="settings"
            element={<Settings />}
          />

          {/* ---------------------------------------------------
              HOST / USER CHAT
          --------------------------------------------------- */}

          <Route
            path="host/:id/chat-with-host/:hostId"
            element={<ChatWithHost />}
          />

          <Route
            path="host-chat/:userId"
            element={<HostChat />}
          />

          {/* ---------------------------------------------------
              FREE EVENT ATTENDANCE
          --------------------------------------------------- */}

          <Route
            path="free-attendance/:id"
            element={<FreeAttendance />}
          />

          <Route
            path="attendance-pass/:attendanceId"
            element={<AttendancePass />}
          />

          {/* ---------------------------------------------------
              PUBLIC INFORMATION PAGES
          --------------------------------------------------- */}

          <Route
            path="privacy-policy"
            element={<PrivacyPolicy />}
          />

          <Route
            path="terms"
            element={<TermsConditions />}
          />

          <Route
            path="refund-policy"
            element={<RefundPolicy />}
          />

          <Route
            path="contact-us"
            element={<ContactUs />}
          />

          <Route
            path="about"
            element={<About />}
          />

          <Route
            path="contact"
            element={<Contact />}
          />

          <Route
            path="support"
            element={<Support />}
          />

          {/* =================================================
              HOST MESSAGES
          ================================================= */}

          <Route
            path="host-messages"
            element={
              <ProtectedRoute>
                <HostMessages />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              HOST DASHBOARD
              
              KEEPING YOUR EXISTING HOST LAYOUT
          ================================================= */}

          <Route element={<HostLayout />}>

            {/* -------------------------------------------------
                HOST DASHBOARD
            ------------------------------------------------- */}

            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* -------------------------------------------------
                CREATE / EDIT EVENT
            ------------------------------------------------- */}

            <Route
              path="create-event"
              element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />

            {/* -------------------------------------------------
                HOST WALLET
            ------------------------------------------------- */}

            <Route
              path="host-wallet"
              element={
                <ProtectedRoute>
                  <HostWallet />
                </ProtectedRoute>
              }
            />

            {/* -------------------------------------------------
                HOST EVENTS
            ------------------------------------------------- */}

            <Route
              path="host-events"
              element={
                <ProtectedRoute>
                  <HostEvents />
                </ProtectedRoute>
              }
            />

            {/* -------------------------------------------------
                HOST REFUNDS
            ------------------------------------------------- */}

            <Route
              path="host-refunds"
              element={
                <ProtectedRoute>
                  <HostRefunds />
                </ProtectedRoute>
              }
            />

          </Route>

        </Route>


        {/* =====================================================
            AUTH / SPECIAL USER PAGES
        ===================================================== */}

        <Route element={<AuthLayout />}>

          {/* ---------------------------------------------------
              LOGIN
          --------------------------------------------------- */}

          <Route
            path="login"
            element={<Login />}
          />

          {/* ---------------------------------------------------
              REGISTER
          --------------------------------------------------- */}

          <Route
            path="register"
            element={<Register />}
          />

          {/* ---------------------------------------------------
              BOOKING
              
              LEFT HERE TO PRESERVE YOUR PAYMENT FLOW
          --------------------------------------------------- */}

          <Route
            path="booking/:id"
            element={<Booking />}
          />

          {/* ---------------------------------------------------
              REVIEW
          --------------------------------------------------- */}

          <Route
            path="review/:eventId"
            element={<Review />}
          />

          {/* ---------------------------------------------------
              TICKET DETAILS
          --------------------------------------------------- */}

          <Route
            path="tickets/:ticketId"
            element={<TicketDetails />}
          />

          {/* ---------------------------------------------------
              FREE TICKET DETAILS
          --------------------------------------------------- */}

          <Route
            path="free-ticket/:attendanceId"
            element={<FreeTicketDetails />}
          />

          {/* ---------------------------------------------------
              TICKET SCANNER
          --------------------------------------------------- */}

          <Route
            path="scanner/:id"
            element={<TicketScanner />}
          />

          {/* ---------------------------------------------------
              ATTENDEES
          --------------------------------------------------- */}

          <Route
            path="attendees/:id"
            element={<Attendees />}
          />

          {/* ---------------------------------------------------
              PAYMENT PROCESSING
          --------------------------------------------------- */}

          <Route
            path="payment-processing/"
            element={<PaymentProcessing />}
          />

          {/* ---------------------------------------------------
              PAYMENT SUCCESS
          --------------------------------------------------- */}

          <Route
            path="payment-success/"
            element={<PaymentSuccess />}
          />

          {/* ---------------------------------------------------
              HOST APPLICATION
          --------------------------------------------------- */}

          <Route
            path="host-application/"
            element={<HostApplication />}
          />

          {/* ---------------------------------------------------
              HOST PROFILE
          --------------------------------------------------- */}

          <Route
            path="edit-host-profile"
            element={<EditHostProfile />}
          />

          <Route
            path="host-verification/"
            element={<HostVerification />}
          />

          <Route
            path="host/:id"
            element={<HostProfile />}
          />

          {/* ---------------------------------------------------
              REFUNDS
          --------------------------------------------------- */}

          <Route
            path="request-refund"
            element={<RequestRefund />}
          />

          {/* ---------------------------------------------------
              PASSWORD RECOVERY
          --------------------------------------------------- */}

          <Route
            path="forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="reset-password"
            element={<ResetPassword />}
          />


          {/* =================================================
              ADMIN DASHBOARD
          ================================================= */}

          <Route
            path="admin"
            element={<AdminLayout />}
          >

            {/* -------------------------------------------------
                ADMIN HOME
            ------------------------------------------------- */}

            <Route
              index
              element={<AdminHome />}
            />

            {/* -------------------------------------------------
                HOST APPLICATIONS
            ------------------------------------------------- */}

            <Route
              path="host-applications"
              element={<AdminHostApplications />}
            />

            {/* -------------------------------------------------
                EVENTS
            ------------------------------------------------- */}

            <Route
              path="events"
              element={<AdminEvents />}
            />

            {/* -------------------------------------------------
                USERS
            ------------------------------------------------- */}

            <Route
              path="users"
              element={<AdminUsers />}
            />

            {/* -------------------------------------------------
                REVENUE
            ------------------------------------------------- */}

            <Route
              path="revenue"
              element={<AdminRevenue />}
            />

            {/* -------------------------------------------------
                SETTINGS
            ------------------------------------------------- */}

            <Route
              path="settings"
              element={<AdminSettings />}
            />

            {/* -------------------------------------------------
                WALLET
            ------------------------------------------------- */}

            <Route
              path="wallet"
              element={<AdminWallet />}
            />

            {/* -------------------------------------------------
                WITHDRAWALS
            ------------------------------------------------- */}

            <Route
              path="withdrawals"
              element={<AdminWithdrawals />}
            />

            {/* -------------------------------------------------
                NOTIFICATIONS
            ------------------------------------------------- */}

            <Route
              path="notifications"
              element={<AdminNotifications />}
            />

            {/* -------------------------------------------------
                REPORTS
            ------------------------------------------------- */}

            <Route
              path="reports"
              element={<AdminReports />}
            />

            {/* -------------------------------------------------
                REFUNDS
            ------------------------------------------------- */}

            <Route
              path="refunds"
              element={<AdminRefunds />}
            />

            {/* -------------------------------------------------
                EDIT EVENT
            ------------------------------------------------- */}

            <Route
              path="events/edit/:id"
              element={<AdminEditEvent />}
            />

            {/* -------------------------------------------------
                CREATE EVENT
            ------------------------------------------------- */}

            <Route
              path="create-event"
              element={<AdminCreateEvent />}
            />

          </Route>

        </Route>

      </Routes>

    </MaintenanceGuard>
  );
}

export default App;