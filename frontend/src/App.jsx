import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import AppLayout from './shared/components/layout/AppLayout';
import NotFoundPage from './shared/pages/NotFoundPage';

// Feature Pages
import { LoginPage } from './features/auth';
import { AdminDashboard, StaffDashboard } from './features/dashboard';
import { MembersPage, MemberProfile } from './features/members';
import { ProgramsPage } from './features/programs';
import { GroupsPage, GroupDetail } from './features/groups';
import { StaffPage, ProfilePage } from './features/staff';
import { AttendancePage, MarkAttendance } from './features/attendance';
import { FeePlansPage, FeeRecordsPage } from './features/fees';
import { PaymentsPage, ReceiptPage } from './features/payments';
import { AttendanceReport, CollectionReport, OutstandingReport } from './features/reports';
import { SettingsPage, ActivityLogsPage } from './features/settings';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRouter() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <StaffDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRouter />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="members/:id" element={<MemberProfile />} />
            <Route path="programs" element={<ProtectedRoute adminOnly><ProgramsPage /></ProtectedRoute>} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="staff" element={<ProtectedRoute adminOnly><StaffPage /></ProtectedRoute>} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance/mark/:sessionId" element={<MarkAttendance />} />
            <Route path="fee-plans" element={<ProtectedRoute adminOnly><FeePlansPage /></ProtectedRoute>} />
            <Route path="fee-records" element={<FeeRecordsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="payments/:id/receipt" element={<ReceiptPage />} />
            <Route path="reports/attendance" element={<ProtectedRoute adminOnly><AttendanceReport /></ProtectedRoute>} />
            <Route path="reports/collections" element={<ProtectedRoute adminOnly><CollectionReport /></ProtectedRoute>} />
            <Route path="reports/outstanding" element={<ProtectedRoute adminOnly><OutstandingReport /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
            <Route path="settings/logs" element={<ProtectedRoute adminOnly><ActivityLogsPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
