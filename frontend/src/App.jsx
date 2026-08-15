import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

import Tickets from './pages/Tickets';
import UpcomingEvents from './pages/UpcomingEvents';
import PaymentProcessing from './pages/PaymentProcessing';
import Profile from "./pages/Profile";
import Dashboard from './pages/Dashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import Home from './pages/home';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import CreateEvent from "./pages/CreateEvent";
import ProtectedRoute from './components/ProtectedRoute';
import MaintenanceGuard from './components/MaintenanceGuard';
import RequestRefund from './pages/RequestRefund';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Booking from './pages/Booking';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import TicketDetails from './pages/TicketDetails';
import TicketScanner from './pages/TicketScanner';
import Attendees from './pages/Attendees';
import HostApplication from "./pages/HostApplication";
import HostVerification from './pages/HostVerification';
import HostWallet from './pages/HostWallet';
import FreeAttendance from './pages/FreeAttendance';
import AttendancePass from './pages/AttendancePass';
import FreeTicketDetails from './pages/FreeTicketsDetails';
import Review from "./pages/Review";

import AdminHostApplications from './pages/AdminHostApplications';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import AdminLayout from './layouts/AdminLayout';
import AdminEvents from './pages/AdminEvents';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import AdminWallet from './pages/AdminWallet';
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminNotifications from './pages/AdminNotifications';
import AdminReports from "./pages/AdminReports";
import AdminCreateEvent from './pages/AdminCreateEvent';
import AdminEditEvent from './pages/AdminEditEvent';
import AdminRefunds from './pages/AdminRefunds';

import HostProfile from './pages/HostProfile';
import EditHostProfile from './pages/EditHostProfile';
import HostMessages from './pages/HostMessages';
import UserMessages from './pages/UserMessages';
import ChatWithHost from './pages/ChatWithHost';
import HostChat from './pages/HostChat';
import Notifications from './pages/Notifications';
import AdminRevenue from './pages/AdminRevenue';
import HostRefunds from './pages/HostRefunds';
import HostEvents from './pages/HostEvents';
import HostLayout from './layouts/HostLayout';


import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ContactUs from "./pages/ContactUs";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";


function App() {
  return (
    <MaintenanceGuard>

      <Routes>

        {/* =========================
            MAIN WEBSITE
        ========================= */}

        <Route path='/' element={<MainLayout />}>

          <Route index element={<Home />} />

          <Route path='events' element={<Events />} />

          <Route
            path="/events/:id"
            element={<EventDetails />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/messages"
            element={<UserMessages />}
          />

          <Route
            path="/host/:id/chat-with-host/:hostId"
            element={<ChatWithHost />}
          />

          <Route
            path="/host-chat/:userId"
            element={<HostChat />}
          />

          <Route
            path="/free-attendance/:id"
            element={<FreeAttendance />}
          />

          <Route
            path="/attendance-pass/:attendanceId"
            element={<AttendancePass />}
          />

          {/* PUBLIC PAGES */}

          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy />}
          />

          <Route
            path="/terms"
            element={<TermsConditions />}
          />

          <Route
            path="/refund-policy"
            element={<RefundPolicy />}
          />

          <Route
            path="/contact-us"
            element={<ContactUs />}
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="/support"
            element={<Support />}
          />

          {/* HOST MESSAGES */}

          <Route
            path="/host-messages"
            element={
              <ProtectedRoute>
                <HostMessages />
              </ProtectedRoute>
            }
          />

          {/* HOST DASHBOARD */}
        <Route element={<HostLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-event"
            element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/host-wallet"
            element={
              <ProtectedRoute>
                <HostWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host-events"
            element={
              <ProtectedRoute>
                <HostEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host-refunds"
            element={
            <ProtectedRoute>
              <HostRefunds />
              </ProtectedRoute>
            }
          />
  
        </Route>
      </Route>

        {/* =========================
            AUTH / USER PAGES
        ========================= */}

        <Route element={<AuthLayout />}>

          <Route
            path="login"
            element={<Login />}
          />

          <Route
            path="register"
            element={<Register />}
          />

          <Route
            path="booking/:id"
            element={<Booking />}
          />

          <Route
            path="/review/:eventId"
            element={<Review />}
          />

          <Route
            path="/tickets"
            element={<Tickets />}
          />

          <Route
            path="/favorites"
            element={<Favorites />}
          />

          <Route
            path="/upcoming"
            element={<UpcomingEvents />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          <Route
            path="/tickets/:ticketId"
            element={<TicketDetails />}
          />

          <Route
            path="/free-ticket/:attendanceId"
            element={<FreeTicketDetails />}
          />

          <Route
            path="/scanner/:id"
            element={<TicketScanner />}
          />

          <Route
            path="/attendees/:id"
            element={<Attendees />}
          />

          <Route
            path="/payment-processing/"
            element={<PaymentProcessing />}
          />

          <Route
            path="/payment-success/"
            element={<PaymentSuccess />}
          />

          <Route
            path="/host-application/"
            element={<HostApplication />}
          />

          <Route
            path="/edit-host-profile"
            element={<EditHostProfile />}
          />

          <Route
            path="/host-verification/"
            element={<HostVerification />}
          />

          <Route
            path="/host/:id"
            element={<HostProfile />}
          />

          <Route
            path="/request-refund"
            element={<RequestRefund />}
          />

          <Route
            path="/forgot-password"
            element ={<ForgotPassword/>} 
            
          />

          <Route
            path="/reset-password"
            element ={<ResetPassword/>} 
            
          />

          {/* =========================
              ADMIN DASHBOARD
          ========================= */}

          <Route
            path="/admin"
            element={<AdminLayout />}
          >

            <Route
              index
              element={<AdminHome />}
            />

            <Route
              path="host-applications"
              element={<AdminHostApplications />}
            />

            <Route
              path="events"
              element={<AdminEvents />}
            />

            <Route
              path="users"
              element={<AdminUsers />}
            />

            <Route
              path="revenue"
              element={<AdminRevenue />}
            />

            <Route
              path="settings"
              element={<AdminSettings />}
            />

            <Route
              path="wallet"
              element={<AdminWallet />}
            />

            <Route
              path="withdrawals"
              element={<AdminWithdrawals />}
            />

            <Route
              path="notifications"
              element={<AdminNotifications />}
            />

            <Route
              path="reports"
              element={<AdminReports />}
            />

            <Route
              path="refunds"
              element={<AdminRefunds />}
            />

            <Route
              path="events/edit/:id"
              element={<AdminEditEvent />}
            />

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