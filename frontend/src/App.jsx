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
   NORMAL USER AUTH
========================================================= */
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
/* =========================================================
   ADMIN AUTH
========================================================= */
import AdminLogin from "./pages/AdminLogin";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminVerifyOtp from "./pages/AdminVerifyOtp";
import AdminResetPassword from "./pages/AdminResetPassword";
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
import HostTeamMembers from "./pages/HostTeamMembers";
/* =========================================================
   TEAM MEMBER PORTAL
========================================================= */

import TeamLogin from "./pages/TeamLogin";
import AdminTeamLogin from "./pages/AdminTeamLogin";
import TeamMemberDashboard from "./pages/TeamMemberDashboard";
import AdminTeamDashboard from "./pages/AdminTeamDashboard";
import TeamEventView from "./pages/TeamEventView";
import TicketLookup from "./pages/TicketLookup";
import TeamProtectedRoute from "./components/TeamProtectedRoute";
/* =========================================================
   PAYMENTS
========================================================= */
import PaymentProcessing from "./pages/PaymentProcessing";
import PaymentSuccess from "./pages/PaymentSuccess";
/* =========================================================
   ADMIN PAGES
========================================================= */
import AdminHome from "./pages/AdminHome";
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
import AdminTicketScanner from "./pages/AdminTicketScanner";
import AdminScan from "./pages/AdminScan";
import AdminTeamMembers from "./pages/AdminTeamMembers";
import AdminTeamInvitation from "./pages/AdminTeamInvitation";
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
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import MaintenanceGuard from "./components/MaintenanceGuard";
function App() {
    return (
        <MaintenanceGuard>
            <Routes>
                {/* =====================================================
                    TEAM MEMBER LOGIN
                    =====================================================
                    PUBLIC
                    IMPORTANT:
                    This route is completely independent.
                    Team members do NOT need:
                    - Host login
                    - Normal user login
                    - Admin login
                    to reach the team login page.
                ===================================================== */}
                <Route
                    path="/team-login"
                    element={<TeamLogin />}
                />

                {/* =====================================================
                    ADMIN TEAM MEMBER LOGIN
                    =====================================================
                    ALIAS
                    This points to the same TeamLogin component.
                    It is also PUBLIC because a team member must
                    be able to reach login without being authenticated.
                ===================================================== */}
                <Route
                    path="/admin/team-login"
                    element={<AdminTeamLogin />}
                />
                {/* =================================================
                        ADMIN TEAM INVITATION
                    ================================================= */}
                    <Route
                        path="/admin/team-invitation"
                        element={<AdminTeamInvitation />}
                    />

                {/* =====================================================
                    ADMIN LOGIN
                    ===================================================== */}
                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />
                {/* =====================================================
                    ADMIN PASSWORD RECOVERY
                ===================================================== */}
                <Route
                    path="/admin/forgot-password"
                    element={<AdminForgotPassword />}
                />
                <Route
                    path="/admin/verify-otp"
                    element={<AdminVerifyOtp />}
                />
                <Route
                    path="/admin/reset-password"
                    element={<AdminResetPassword />}
                />
                {/* =====================================================
                    MAIN WEBSITE
                ===================================================== */}
                <Route
                    path="/"
                    element={<MainLayout />}
                >
                    {/* =================================================
                        HOME
                    ================================================= */}
                    <Route
                        index
                        element={<Home />}
                    />
                    {/* =================================================
                        EVENTS
                    ================================================= */}
                    <Route
                        path="events"
                        element={<Events />}
                    />
                    <Route
                        path="events/:id"
                        element={<EventDetails />}
                    />
                    {/* =================================================
                        PROFILE
                    ================================================= */}
                    <Route
                        path="profile"
                        element={<Profile />}
                    />
                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}
                    <Route
                        path="notifications"
                        element={<Notifications />}
                    />
                    {/* =================================================
                        USER MESSAGES
                    ================================================= */}
                    <Route
                        path="messages"
                        element={<UserMessages />}
                    />
                    {/* =================================================
                        MY TICKETS
                    ================================================= */}
                    <Route
                        path="tickets"
                        element={
                            <ProtectedRoute>
                                <Tickets />
                            </ProtectedRoute>
                        }
                    />
                    {/* =================================================
                        FAVORITES
                    ================================================= */}
                    <Route
                        path="favorites"
                        element={<Favorites />}
                    />
                    {/* =================================================
                        UPCOMING EVENTS
                    ================================================= */}
                    <Route
                        path="upcoming"
                        element={<UpcomingEvents />}
                    />
                    {/* =================================================
                        SETTINGS
                    ================================================= */}
                    <Route
                        path="settings"
                        element={<Settings />}
                    />
                    {/* =================================================
                        USER / HOST CHAT
                    ================================================= */}
                    <Route
                        path="host/:id/chat-with-host/:hostId"
                        element={<ChatWithHost />}
                    />
                    <Route
                        path="host-chat/:userId"
                        element={<HostChat />}
                    />
                    {/* =================================================
                        FREE EVENT ATTENDANCE
                    ================================================= */}
                    <Route
                        path="free-attendance/:id"
                        element={<FreeAttendance />}
                    />
                    <Route
                        path="attendance-pass/:attendanceId"
                        element={<AttendancePass />}
                    />
                    {/* =================================================
                        PUBLIC INFORMATION
                    ================================================= */}
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
                        HOST LAYOUT
                    ================================================= */}
                    <Route
                        element={<HostLayout />}
                    >
                        {/* ---------------------------------------------
                            HOST DASHBOARD
                        --------------------------------------------- */}
                        <Route
                            path="dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        {/* ---------------------------------------------
                            CREATE EVENT
                        --------------------------------------------- */}
                        <Route
                            path="create-event"
                            element={
                                <ProtectedRoute>
                                    <CreateEvent />
                                </ProtectedRoute>
                            }
                        />
                        {/* ---------------------------------------------
                            HOST TEAM MEMBERS
                        --------------------------------------------- */}
                        <Route
                            path="team-members"
                            element={
                                <ProtectedRoute>
                                    <HostTeamMembers />
                                </ProtectedRoute>
                            }
                        />
                        {/* ---------------------------------------------
                            HOST WALLET
                        --------------------------------------------- */}
                        <Route
                            path="host-wallet"
                            element={
                                <ProtectedRoute>
                                    <HostWallet />
                                </ProtectedRoute>
                            }
                        />
                        {/* ---------------------------------------------
                            HOST EVENTS
                        --------------------------------------------- */}
                        <Route
                            path="host-events"
                            element={
                                <ProtectedRoute>
                                    <HostEvents />
                                </ProtectedRoute>
                            }
                        />
                        {/* ---------------------------------------------
                            HOST REFUNDS
                        --------------------------------------------- */}
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
                    NORMAL USER AUTH / SPECIAL PAGES
                ===================================================== */}
                <Route
                    element={<AuthLayout />}
                >
                    {/* -------------------------------------------------
                        USER LOGIN
                    ------------------------------------------------- */}
                    <Route
                        path="login"
                        element={<Login />}
                    />
                    {/* -------------------------------------------------
                        USER REGISTER
                    ------------------------------------------------- */}
                    <Route
                        path="register"
                        element={<Register />}
                    />
                    {/* -------------------------------------------------
                        BOOKING
                    ------------------------------------------------- */}
                    <Route
                        path="booking/:id"
                        element={<Booking />}
                    />
                    {/* -------------------------------------------------
                        REVIEW
                    ------------------------------------------------- */}
                    <Route
                        path="review/:eventId"
                        element={<Review />}
                    />
                    {/* -------------------------------------------------
                        TICKET DETAILS
                    ------------------------------------------------- */}
                    <Route
                        path="tickets/:ticketId"
                        element={<TicketDetails />}
                    />
                    <Route
                    path="/booking-ticket/:bookingId"
                    element={<TicketDetails />}
                    />

                    {/* -------------------------------------------------
                        FREE TICKET DETAILS
                    ------------------------------------------------- */}
                    <Route
                        path="free-ticket/:attendanceId"
                        element={<FreeTicketDetails />}
                    />
                    {/* -------------------------------------------------
                        TICKET SCANNER
                    ------------------------------------------------- */}
                    <Route
                        path="scanner/:id"
                        element={<TicketScanner />}
                    />
                    {/* -------------------------------------------------
                        ATTENDEES
                    ------------------------------------------------- */}
                    <Route
                        path="attendees/:id"
                        element={<Attendees />}
                    />
                    {/* -------------------------------------------------
                        PAYMENT PROCESSING
                    ------------------------------------------------- */}
                    <Route
                        path="payment-processing"
                        element={<PaymentProcessing />}
                    />
                    {/* -------------------------------------------------
                        PAYMENT SUCCESS
                    ------------------------------------------------- */}
                    <Route
                        path="payment-success"
                        element={<PaymentSuccess />}
                    />
                    {/* -------------------------------------------------
                        HOST APPLICATION
                    ------------------------------------------------- */}
                    <Route
                        path="host-application"
                        element={<HostApplication />}
                    />
                    {/* -------------------------------------------------
                        HOST PROFILE
                    ------------------------------------------------- */}
                    <Route
                        path="edit-host-profile"
                        element={<EditHostProfile />}
                    />
                    <Route
                        path="host-verification"
                        element={<HostVerification />}
                    />
                    <Route
                        path="host/:id"
                        element={<HostProfile />}
                    />
                    {/* -------------------------------------------------
                        REFUNDS
                    ------------------------------------------------- */}
                    <Route
                        path="request-refund"
                        element={<RequestRefund />}
                    />
                    {/* -------------------------------------------------
                        USER PASSWORD RECOVERY
                    ------------------------------------------------- */}
                    <Route
                        path="forgot-password"
                        element={<ForgotPassword />}
                    />
                    <Route
                        path="reset-password"
                        element={<ResetPassword />}
                    />
                </Route>
                {/* =====================================================
                    =====================================================
                    EVENTWAA TEAM MEMBER PORTAL
                    =====================================================
                    Existing routes preserved.
                    Team authentication uses:
                    eventwaa_team_token
                ===================================================== */}
                {/* =====================================================
                    TEAM DASHBOARD
                ===================================================== */}
                <Route
                    path="/team-dashboard"
                    element={
                        <TeamProtectedRoute>
                            <TeamMemberDashboard />
                        </TeamProtectedRoute>
                    }
                />
                {/* =====================================================
                    ADMIN TEAM DASHBOARD
                    =====================================================
                    ALIAS
                    Same dashboard component and same team protection.
                    This is NOT inside the AdminProtectedRoute because
                    a team member is NOT an administrator.
                ===================================================== */}
                <Route
                    path="/admin/team-dashboard"
                    element={
                        <TeamProtectedRoute>
                            <AdminTeamDashboard />
                        </TeamProtectedRoute>
                    }
                />
                {/* =====================================================
                    TEAM EVENT
                ===================================================== */}
                <Route
                    path="/team-event/:eventId"
                    element={
                        <TeamProtectedRoute>
                            <TeamEventView />
                        </TeamProtectedRoute>
                    }
                />

                <Route
                    path="/admin/team-event/:eventId"
                    element={
                        <TeamProtectedRoute>
                            <TeamEventView />
                        </TeamProtectedRoute>
                    }
                />

                {/* =====================================================
                    TEAM SCANNER
                ===================================================== */}
                <Route
                    path="/team-scanner/:id"
                    element={
                        <TeamProtectedRoute>
                            <TicketScanner />
                        </TeamProtectedRoute>
                    }
                />

                <Route
                    path="/admin/team-scanner/:id"
                    element={
                        <TeamProtectedRoute>
                            <TicketScanner />
                        </TeamProtectedRoute>
                    }
                />

                {/* =====================================================
                    TEAM TICKET LOOKUP
                ===================================================== */}
                <Route
                    path="/team-lookup"
                    element={
                        <TeamProtectedRoute>
                            <TicketLookup />
                        </TeamProtectedRoute>
                    }
                />

                <Route
                    path="/admin/team-lookup"
                    element={
                        <TeamProtectedRoute>
                            <TicketLookup />
                        </TeamProtectedRoute>
                    }
                />

                {/* =====================================================
                    HOST TICKET LOOKUP
                ===================================================== */}
                <Route
                    path="/host-ticket-lookup"
                    element={
                        <ProtectedRoute>
                            <TicketLookup />
                        </ProtectedRoute>
                    }
                />

                {/* =====================================================
                    =====================================================
                    ADMIN PORTAL
                    =====================================================
                ===================================================== */}
                <Route
                    path="/admin"
                    element={
                        <AdminProtectedRoute>
                            <AdminLayout />
                        </AdminProtectedRoute>
                    }
                >
                    {/* =================================================
                        ADMIN HOME
                    ================================================= */}
                    <Route
                        index
                        element={<AdminHome />}
                    />
                    
                    <Route
                        path="ticket-lookup"
                        element={<TicketLookup />}
                    />


                    {/* =================================================
                        HOST APPLICATIONS
                    ================================================= */}
                    <Route
                        path="host-applications"
                        element={<AdminHostApplications />}
                    />
                    {/* =================================================
                        EVENTS
                    ================================================= */}
                    <Route
                        path="events"
                        element={<AdminEvents />}
                    />
                    {/* =================================================
                        USERS
                    ================================================= */}
                    <Route
                        path="users"
                        element={<AdminUsers />}
                    />
                    {/* =================================================
                        TEAM MEMBERS
                    ================================================= */}
                    <Route
                        path="team-members"
                        element={<AdminTeamMembers />}
                    />
                    {/* =================================================
                        REVENUE
                    ================================================= */}
                    <Route
                        path="revenue"
                        element={<AdminRevenue />}
                    />
                    {/* =================================================
                        SETTINGS
                    ================================================= */}
                    <Route
                        path="settings"
                        element={<AdminSettings />}
                    />
                    {/* =================================================
                        WALLET
                    ================================================= */}
                    <Route
                        path="wallet"
                        element={<AdminWallet />}
                    />
                    {/* =================================================
                        WITHDRAWALS
                    ================================================= */}
                    <Route
                        path="withdrawals"
                        element={<AdminWithdrawals />}
                    />
                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}
                    <Route
                        path="notifications"
                        element={<AdminNotifications />}
                    />
                    {/* =================================================
                        REPORTS
                    ================================================= */}
                    <Route
                        path="reports"
                        element={<AdminReports />}
                    />
                    {/* =================================================
                        REFUNDS
                    ================================================= */}
                    <Route
                        path="refunds"
                        element={<AdminRefunds />}
                    />
                    {/* =================================================
                        EDIT EVENT
                    ================================================= */}
                    <Route
                        path="events/edit/:id"
                        element={<AdminEditEvent />}
                    />
                    {/* =================================================
                        ADMIN SCANNER
                    ================================================= */}
                    <Route
                        path="scan/:id"
                        element={<AdminTicketScanner />}
                    />
                    <Route
                        path="scan"
                        element={<AdminScan />}
                    />
                    {/* =================================================
                        CREATE EVENT
                    ================================================= */}
                    <Route
                        path="create-event"
                        element={<AdminCreateEvent />}
                    />
                    
                </Route>
            </Routes>
        </MaintenanceGuard>
    );
}
export default App;