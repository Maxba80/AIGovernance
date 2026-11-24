import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { WorkspaceProvider } from './lib/workspace';
import { AppShell } from './components/layout/AppShell';
import { Card } from './components/ui/Card';
import { SkeletonRows } from './components/ui/Feedback';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { EvidencePage } from './pages/evidence/EvidencePage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { SystemDetailPage } from './pages/inventory/SystemDetailPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { FrameworksPage } from './pages/frameworks/FrameworksPage';
import { AssessmentEditorPage } from './pages/assessments/AssessmentEditorPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';

// React Flow is only needed on the graph page: load it on demand.
const GraphPage = lazy(() => import('./pages/graph/GraphPage').then((m) => ({ default: m.GraphPage })));

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
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/:id" element={<SystemDetailPage />} />
        <Route path="frameworks" element={<Navigate to="/frameworks/eu-ai-act" replace />} />
        <Route path="frameworks/:fid" element={<FrameworksPage />} />
        <Route path="assessments/:id" element={<AssessmentEditorPage />} />
        <Route
          path="graph"
          element={
            <Suspense
              fallback={
                <Card>
                  <SkeletonRows rows={8} />
                </Card>
              }
            >
              <GraphPage />
            </Suspense>
          }
        />
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
