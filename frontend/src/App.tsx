import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { WorkspaceProvider } from './lib/workspace';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { EvidencePage } from './pages/evidence/EvidencePage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';

function Protected() {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected />}>
        <Route index element={<OverviewPage />} />
        <Route path="inventory" element={<PlaceholderPage id="inventory" />} />
        <Route path="frameworks" element={<PlaceholderPage id="frameworks" />} />
        <Route path="graph" element={<PlaceholderPage id="graph" />} />
        <Route path="risks" element={<PlaceholderPage id="risks" />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="deliverables" element={<PlaceholderPage id="deliverables" />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
