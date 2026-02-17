import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ProtectedRouteWithProfile } from './components/ProtectedRouteWithProfile'
import { OfflineIndicator } from './components/OfflineIndicator'
import { TenantProvider } from './contexts/TenantContext.tsx'
import { Login } from './pages/Login'
import { Registration } from './pages/Registration'
import { Dashboard } from './pages/Dashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminUserList } from './pages/AdminUserList'
import { AdminPinRequests } from './pages/AdminPinRequests'
import { InspectionStart } from './pages/InspectionStart'
import { InspectionWizard } from './pages/InspectionWizard'
import { InspectionSummary } from './pages/InspectionSummary'
import { InspectionHistory } from './pages/InspectionHistory'
import { InspectionConfig } from './pages/InspectionConfig'

function App() {
  return (
    <ErrorBoundary>
      <TenantProvider>
        <OfflineIndicator />
        <Router>
          <Routes>
            {/* Tenant-based routes */}
            <Route path="/:tenant/login" element={<Login />} />
            <Route
              path="/:tenant/registration"
              element={
                <ProtectedRoute>
                  <Registration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:tenant"
              element={
                <ProtectedRouteWithProfile>
                  <Dashboard />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/:tenant/dashboard"
              element={
                <ProtectedRouteWithProfile>
                  <Dashboard />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/:tenant/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:tenant/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUserList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/:tenant/admin/pin-requests"
              element={
                <ProtectedRoute>
                  <AdminPinRequests />
                </ProtectedRoute>
              }
            />

            {/* Tenant inspection routes */}
            <Route
              path="/:tenant/inspect"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionStart />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/:tenant/inspect/:id"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionWizard />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/:tenant/inspect/:id/summary"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionSummary />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/:tenant/inspections"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionHistory />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/:tenant/config"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionConfig />
                </ProtectedRouteWithProfile>
              }
            />

            {/* Root routes (default tenant) */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/registration"
              element={
                <ProtectedRoute>
                  <Registration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRouteWithProfile>
                  <Dashboard />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUserList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pin-requests"
              element={
                <ProtectedRoute>
                  <AdminPinRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspect"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionStart />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/inspect/:id"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionWizard />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/inspect/:id/summary"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionSummary />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/inspections"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionHistory />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/config"
              element={
                <ProtectedRouteWithProfile>
                  <InspectionConfig />
                </ProtectedRouteWithProfile>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRouteWithProfile>
                  <Dashboard />
                </ProtectedRouteWithProfile>
              }
            />
          </Routes>
        </Router>
      </TenantProvider>
    </ErrorBoundary>
  )
}

export default App
