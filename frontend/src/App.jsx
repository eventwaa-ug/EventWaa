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
import VerifiedHostRoute from "./components/VerifiedHostRoute";

function App() {
    return (
        <MaintenanceGuard>
            <Routes>

                {/* =====================================================
                    TEAM MEMBER LOGIN
                ===================================================== */}
                <Route
                    path="/team-login"
                    element={<TeamLogin />}
                />

                {/* =====================================================
                    ADMIN TEAM MEMBER LOGIN
                ===================================================== */}
                <Route
                    path="/admin/team-login"
                    element={<AdminTeamLogin />}
                />

                {/* =====================================================
                    ADMIN TEAM INVITATION
                ===================================================== */}
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
                        PUBLIC
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
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        NOTIFICATIONS
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="notifications"
                        element={
                            <ProtectedRoute>
                                <Notifications />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        USER MESSAGES
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="messages"
                        element={
                            <ProtectedRoute>
                                <UserMessages />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        MY TICKETS
                        PROTECTED
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
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="favorites"
                        element={
                            <ProtectedRoute>
                                <Favorites />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        UPCOMING EVENTS
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="upcoming"
                        element={
                            <ProtectedRoute>
                                <UpcomingEvents />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        SETTINGS
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        USER / HOST CHAT
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="host/:id/chat-with-host/:hostId"
                        element={
                            <ProtectedRoute>
                                <ChatWithHost />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="host-chat/:userId"
                        element={
                            <ProtectedRoute>
                                <HostChat />
                            </ProtectedRoute>
                        }
                    />

                    {/* =================================================
                        FREE EVENT ATTENDANCE
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="free-attendance/:id"
                        element={
                            <ProtectedRoute>
                                <FreeAttendance />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="attendance-pass/:attendanceId"
                        element={
                            <ProtectedRoute>
                                <AttendancePass />
                            </ProtectedRoute>
                        }
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
                        PROTECTED
                    ================================================= */}
                    <Route
                        path="host-messages"
                        element={
                            <VerifiedHostRoute>
                                <HostMessages />
                            </VerifiedHostRoute>
                        }
                    />

                    {/* =================================================
                        HOST LAYOUT
                    ================================================= */}
                    <Route element={<HostLayout />}>

                        {/* HOST DASHBOARD */}
                        <Route
                            path="dashboard"
                            element={
                                <VerifiedHostRoute>
                                    <Dashboard />
                                </VerifiedHostRoute>
                            }
                        />

                        {/* CREATE EVENT */}
                        <Route
                            path="create-event"
                            element={
                                <VerifiedHostRoute>
                                    <CreateEvent />
                                </VerifiedHostRoute>
                            }
                        />

                        {/* HOST TEAM MEMBERS */}
                        <Route
                            path="team-members"
                            element={
                                <VerifiedHostRoute>
                                    <HostTeamMembers />
                                </VerifiedHostRoute>
                            }
                        />

                        {/* HOST WALLET */}
                        <Route
                            path="host-wallet"
                            element={
                                <VerifiedHostRoute>
                                    <HostWallet />
                                </VerifiedHostRoute>
                            }
                        />

                        {/* HOST EVENTS */}
                        <Route
                            path="host-events"
                            element={
                                <VerifiedHostRoute>
                                    <HostEvents />
                                </VerifiedHostRoute>
                            }
                        />

                        {/* HOST REFUNDS */}
                        <Route
                            path="host-refunds"
                            element={
                                <VerifiedHostRoute>
                                    <HostRefunds />
                                </VerifiedHostRoute>
                            }
                        />
                    </Route>
                </Route>

                {/* =====================================================
                    NORMAL USER AUTH / SPECIAL PAGES
                ===================================================== */}
                <Route element={<AuthLayout />}>

                    {/* LOGIN */}
                    <Route
                        path="login"
                        element={<Login />}
                    />

                    {/* REGISTER */}
                    <Route
                        path="register"
                        element={<Register />}
                    />

                    {/* BOOKING */}
                    <Route
                        path="booking/:id"
                        element={
                            <ProtectedRoute>
                                <Booking />
                            </ProtectedRoute>
                        }
                    />

                    {/* REVIEW */}
                    <Route
                        path="review/:eventId"
                        element={
                            <ProtectedRoute>
                                <Review />
                            </ProtectedRoute>
                        }
                    />

                    {/* TICKET DETAILS */}
                    <Route
                        path="tickets/:ticketId"
                        element={
                            <ProtectedRoute>
                                <TicketDetails />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/booking-ticket/:bookingId"
                        element={
                            <ProtectedRoute>
                                <TicketDetails />
                            </ProtectedRoute>
                        }
                    />

                    {/* FREE TICKET DETAILS */}
                    <Route
                        path="free-ticket/:attendanceId"
                        element={
                            <ProtectedRoute>
                                <FreeTicketDetails />
                            </ProtectedRoute>
                        }
                    />

                    {/* TICKET SCANNER */}
                    <Route
                        path="scanner/:id"
                        element={
                            <ProtectedRoute>
                                <TicketScanner />
                            </ProtectedRoute>
                        }
                    />

                    {/* ATTENDEES */}
                    <Route
                        path="attendees/:id"
                        element={
                            <ProtectedRoute>
                                <Attendees />
                            </ProtectedRoute>
                        }
                    />

                    {/* PAYMENT PROCESSING */}
                    <Route
                        path="payment-processing"
                        element={
                            <ProtectedRoute>
                                <PaymentProcessing />
                            </ProtectedRoute>
                        }
                    />

                    {/* PAYMENT SUCCESS */}
                    <Route
                        path="payment-success"
                        element={<PaymentSuccess />}
                    />

                    {/* HOST APPLICATION */}
                    <Route
                        path="host-application"
                        element={
                            <ProtectedRoute>
                                <HostApplication />
                            </ProtectedRoute>
                        }
                    />

                    {/* HOST PROFILE */}
                    <Route
                        path="edit-host-profile"
                        element={
                            <ProtectedRoute>
                                <EditHostProfile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="host-verification"
                        element={
                            <ProtectedRoute>
                                <HostVerification />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="host/:id"
                        element={<HostProfile />}
                    />

                    {/* REFUNDS */}
                    <Route
                        path="request-refund"
                        element={
                            <ProtectedRoute>
                                <RequestRefund />
                            </ProtectedRoute>
                        }
                    />

                    {/* USER PASSWORD RECOVERY */}
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
                    EVENTWAA TEAM MEMBER PORTAL
                ===================================================== */}

                {/* TEAM DASHBOARD */}
                <Route
                    path="/team-dashboard"
                    element={
                        <TeamProtectedRoute>
                            <TeamMemberDashboard />
                        </TeamProtectedRoute>
                    }
                />

                {/* ADMIN TEAM DASHBOARD */}
                <Route
                    path="/admin/team-dashboard"
                    element={
                        <TeamProtectedRoute>
                            <AdminTeamDashboard />
                        </TeamProtectedRoute>
                    }
                />

                {/* TEAM EVENT */}
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

                {/* TEAM SCANNER */}
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

                {/* TEAM TICKET LOOKUP */}
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

                {/* HOST TICKET LOOKUP */}
                <Route
                    path="/host-ticket-lookup"
                    element={
                        <ProtectedRoute>
                            <TicketLookup />
                        </ProtectedRoute>
                    }
                />

                {/* =====================================================
                    ADMIN PORTAL
                ===================================================== */}
                <Route
                    path="/admin"
                    element={
                        <AdminProtectedRoute>
                            <AdminLayout />
                        </AdminProtectedRoute>
                    }
                >
                    {/* ADMIN HOME */}
                    <Route
                        index
                        element={<AdminHome />}
                    />

                    {/* TICKET LOOKUP */}
                    <Route
                        path="ticket-lookup"
                        element={<TicketLookup />}
                    />

                    {/* HOST APPLICATIONS */}
                    <Route
                        path="host-applications"
                        element={<AdminHostApplications />}
                    />

                    {/* EVENTS */}
                    <Route
                        path="events"
                        element={<AdminEvents />}
                    />

                    {/* USERS */}
                    <Route
                        path="users"
                        element={<AdminUsers />}
                    />

                    {/* TEAM MEMBERS */}
                    <Route
                        path="team-members"
                        element={<AdminTeamMembers />}
                    />

                    {/* REVENUE */}
                    <Route
                        path="revenue"
                        element={<AdminRevenue />}
                    />

                    {/* SETTINGS */}
                    <Route
                        path="settings"
                        element={<AdminSettings />}
                    />

                    {/* WALLET */}
                    <Route
                        path="wallet"
                        element={<AdminWallet />}
                    />

                    {/* WITHDRAWALS */}
                    <Route
                        path="withdrawals"
                        element={<AdminWithdrawals />}
                    />

                    {/* NOTIFICATIONS */}
                    <Route
                        path="notifications"
                        element={<AdminNotifications />}
                    />

                    {/* REPORTS */}
                    <Route
                        path="reports"
                        element={<AdminReports />}
                    />

                    {/* REFUNDS */}
                    <Route
                        path="refunds"
                        element={<AdminRefunds />}
                    />

                    {/* EDIT EVENT */}
                    <Route
                        path="events/edit/:id"
                        element={<AdminEditEvent />}
                    />

                    {/* ADMIN SCANNER */}
                    <Route
                        path="scan/:id"
                        element={<AdminTicketScanner />}
                    />

                    <Route
                        path="scan"
                        element={<AdminScan />}
                    />

                    {/* CREATE EVENT */}
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