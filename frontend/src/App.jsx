import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from './context/AuthContext';
import { usePushNotifications } from './hooks/usePushNotifications';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OAuth2Callback from './pages/auth/OAuth2Callback';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserDashboard from './pages/dashboard/UserDashboard';
import TechnicianDashboard from './pages/dashboard/TechnicianDashboard';

// Feature Pages
import FacilitiesPage from './pages/facilities/FacilitiesPage';
import BookingsPage from './pages/bookings/BookingsPage';
import MyBookingsPage from './pages/bookings/MyBookingsPage';
import QRCheckInPage from './pages/bookings/QRCheckInPage';
import TicketsPage from './pages/tickets/TicketsPage';
import MyTicketsPage from './pages/tickets/MyTicketsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import UsersPage from './pages/users/UsersPage';
import ProfilePage from './pages/profile/ProfilePage';
import CampusMapPage from './pages/map/CampusMapPage';
import ChatPage from './pages/chat/ChatPage';
import NoticesPage from './pages/notices/NoticesPage';

import { App as AntdApp } from 'antd';

function App() {
  return (
    <AntdApp>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            <Route path="/oauth2/callback/microsoft" element={<OAuth2Callback />} />

            {/* Protected Routes with Dashboard Layout */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<DashboardContent />} />
              <Route path="/chat" element={<ChatPage />} />

              {/* Admin Routes */}

            {/* Admin Routes */}
            <Route path="/facilities" element={
              <ProtectedRoute roles={['ADMIN', 'USER', 'TECHNICIAN']}>
                <FacilitiesPage />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute roles={['ADMIN']}>
                <BookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/bookings/qr-check-in" element={
              <ProtectedRoute roles={['ADMIN', 'TECHNICIAN']}>
                <QRCheckInPage />
              </ProtectedRoute>
            } />
            <Route path="/tickets" element={
              <ProtectedRoute roles={['ADMIN', 'TECHNICIAN']}>
                <TicketsPage />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute roles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            } />

              {/* User Routes */}
              <Route path="/my-bookings" element={
                <ProtectedRoute roles={['ADMIN', 'USER']}>
                  <MyBookingsPage />
                </ProtectedRoute>
              } />
              <Route path="/my-tickets" element={
                <ProtectedRoute roles={['ADMIN', 'USER']}>
                  <MyTicketsPage />
                </ProtectedRoute>
              } />

              {/* Shared Routes */}
              <Route path="/notifications" element={
                <ProtectedRoute roles={['ADMIN', 'USER', 'TECHNICIAN']}>
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              <Route path="/notices" element={
                <ProtectedRoute roles={['ADMIN', 'USER', 'TECHNICIAN']}>
                  <NoticesPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute roles={['ADMIN', 'USER', 'TECHNICIAN']}>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/map" element={
                <ProtectedRoute roles={['ADMIN', 'USER', 'TECHNICIAN']}>
                  <CampusMapPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </AntdApp>
  );
}

// Dashboard Content Component - renders different dashboard based on role
const DashboardContent = () => {
  const { isAdmin, isTechnician, isAuthenticated } = useAuth();

// 🔔 Register / listen for push notifications for every authenticated user
  console.log('🔔 PUSH DEBUG: App DashboardContent calling usePushNotifications, isAuthenticated:', isAuthenticated);
  usePushNotifications(isAuthenticated);

  if (isAdmin) {
    return <AdminDashboard />;
  } else if (isTechnician) {
    return <TechnicianDashboard />;
  } else {
    return <UserDashboard />;
  }
};

export default App;

