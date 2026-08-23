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
   ADMIN AUTH
========================================================= */

import AdminLogin from "./pages/AdminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TeamProtectedRoute from "./components/TeamProtectedRoute";

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

import TicketLookup from "./pages/TicketLookup";

import TeamEventView from "./pages/TeamEventView";

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
import AdminTeamLogin from "./pages/AdminTeamLogin";
import AdminTeamDashboard from "./pages/AdminTeamDashboard";


/* =========================================================
   ADMIN PASSWORD RECOVERY
========================================================= */

import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminVerifyOtp from "./pages/AdminVerifyOtp";
import AdminResetPassword from "./pages/AdminResetPassword";

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
                    ADMIN LOGIN

                    PUBLIC

                    This route MUST NOT be protected because an
                    unauthenticated admin needs to reach it.
                ===================================================== */}

                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />


                {/* =====================================================
                    ADMIN PASSWORD RECOVERY

                    PUBLIC

                    These routes must remain accessible even when
                    the admin is not logged in.
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
                        element={<Tickets />}
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
                        HOST DASHBOARD LAYOUT
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

                    IMPORTANT:

                    ADMIN ROUTES ARE NO LONGER INSIDE THIS LAYOUT.

                    This keeps normal user authentication completely
                    separate from admin authentication.
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

                {/* =========================================================
                    EVENTWAA TEAM PORTAL

                    IMPORTANT:
                    These are NOT normal user routes.
                    They are NOT admin-management routes.

                    Team members use their own team authentication token.
                ========================================================= */}

                <Route
                    path="/admin/team-login"
                    element={<AdminTeamLogin />}
                />

                <Route
                    path="/admin/team-invitation"
                    element={<AdminTeamInvitation />}
                />

                <Route
                    path="/admin/team-dashboard"
                    element={
                        <TeamProtectedRoute>
                            <AdminTeamDashboard />
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

                <Route
                    path="/admin/team-lookup"
                    element={
                        <TeamProtectedRoute>
                            <TicketLookup />
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
                    PROTECTED ADMIN DASHBOARD

                    EVERYTHING UNDER /admin IS PROTECTED.

                    /admin
                    /admin/dashboard
                    /admin/events
                    /admin/create-event
                    /admin/users
                    etc.

                    If there is no valid admin authentication,
                    AdminProtectedRoute redirects to:

                    /admin/login
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

                    {/* =========
                       admin scan
                    =====================*/}
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