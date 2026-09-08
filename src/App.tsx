import { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { ResourcePage } from '@/features/content/ResourcePage';
import {
  beforeAfterConfig,
  categoriesConfig,
  faqsConfig,
  processConfig,
  promisesConfig,
  servicesConfig,
  statsConfig,
  testimonialsConfig,
} from '@/features/content/resources';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { EnquiriesPage } from '@/features/enquiries/EnquiriesPage';
import { EstimatorPage } from '@/features/estimator/EstimatorPage';
import { MediaPage } from '@/features/media/MediaPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { TeamPage } from '@/features/users/TeamPage';
import type { Role } from '@/types';

/** Blocks a route until the session is known, then by role. */
function Protected({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, initialising, can } = useAuth();
  const location = useLocation();

  if (initialising) return <PageLoader label="Checking your session" />;

  if (!user) {
    // Remember where they were going so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && !can(role)) {
    // An editor landing on an admin-only URL gets the page they can use.
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { can } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        {/* Editors have no dashboard, so send them somewhere they can work. */}
        <Route
          index
          element={
            can('ADMIN') ? (
              <Protected role="ADMIN">
                <DashboardPage />
              </Protected>
            ) : (
              <Navigate to="/projects" replace />
            )
          }
        />

        <Route
          path="enquiries"
          element={
            <Protected role="ADMIN">
              <EnquiriesPage />
            </Protected>
          }
        />
        <Route
          path="enquiries/:id"
          element={
            <Protected role="ADMIN">
              <EnquiriesPage />
            </Protected>
          }
        />

        <Route path="projects" element={<ProjectsPage />} />
        <Route path="categories" element={<ResourcePage config={categoriesConfig} />} />
        <Route path="services" element={<ResourcePage config={servicesConfig} />} />
        <Route path="before-after" element={<ResourcePage config={beforeAfterConfig} />} />
        <Route path="stats" element={<ResourcePage config={statsConfig} />} />
        <Route path="process" element={<ResourcePage config={processConfig} />} />
        <Route path="promises" element={<ResourcePage config={promisesConfig} />} />
        <Route path="testimonials" element={<ResourcePage config={testimonialsConfig} />} />
        <Route path="faqs" element={<ResourcePage config={faqsConfig} />} />
        <Route path="media" element={<MediaPage />} />

        <Route
          path="estimator"
          element={
            <Protected role="ADMIN">
              <EstimatorPage />
            </Protected>
          }
        />
        <Route
          path="settings"
          element={
            <Protected role="ADMIN">
              <SettingsPage />
            </Protected>
          }
        />
        <Route
          path="team"
          element={
            <Protected role="SUPER_ADMIN">
              <TeamPage />
            </Protected>
          }
        />

        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
