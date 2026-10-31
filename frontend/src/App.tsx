import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/AppLayout";

import AIConsultant from "./pages/AIConsultant";
import Dashboard from "./pages/Dashboard";
import InstagramAudit from "./pages/InstagramAudit";
import InstagramAuditReport from "./pages/InstagramAuditReport";
import Landing from "./pages/Landing";
import LinkedInAudit from "./pages/LinkedInAudit";
import LinkedInAuditReport from "./pages/LinkedInAuditReport";
import Login from "./pages/Login";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeAnalyzerReport from "./pages/ResumeAnalyzerReport";
import ContentStrategy from "./pages/ContentStrategy";
import ContentStrategyReport from "./pages/ContentStrategyReport";
import GoalPlanner from "./pages/GoalPlanner";
import GoalPlannerReport from "./pages/GoalPlannerReport";
import Reports from "./pages/Reports";
import SubscriptionPage from "./pages/SubscriptionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={<Landing />}
        />

        {/* Login Page */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />

        {/* AI Consultant */}
        <Route
          path="/ai-consultant"
          element={
            <AppLayout>
              <AIConsultant />
            </AppLayout>
          }
        />

        {/* Instagram Audit */}
        <Route
          path="/instagram-audit"
          element={
            <AppLayout>
              <InstagramAudit />
            </AppLayout>
          }
        />

        <Route
          path="/instagram-audit/report/:reportId"
          element={
            <AppLayout>
              <InstagramAuditReport />
            </AppLayout>
          }
        />

        {/* LinkedIn Audit */}
        <Route
          path="/linkedin-audit"
          element={
            <AppLayout>
              <LinkedInAudit />
            </AppLayout>
          }
        />

        <Route
          path="/linkedin-audit/report/:reportId"
          element={
            <AppLayout>
              <LinkedInAuditReport />
            </AppLayout>
          }
        />

        {/* Resume Analyzer */}
        <Route
          path="/resume-analyzer"
          element={
            <AppLayout>
              <ResumeAnalyzer />
            </AppLayout>
          }
        />

        <Route
          path="/resume-analyzer/report/:reportId"
          element={
            <AppLayout>
              <ResumeAnalyzerReport />
            </AppLayout>
          }
        />

        {/* Content Strategy */}
        <Route
          path="/content-strategy"
          element={
            <AppLayout>
              <ContentStrategy />
            </AppLayout>
          }
        />

        <Route
          path="/content-strategy/report/:reportId"
          element={
            <AppLayout>
              <ContentStrategyReport />
            </AppLayout>
          }
        />

        {/* Goal Planner */}
        <Route
          path="/goal-planner"
          element={
            <AppLayout>
              <GoalPlanner />
            </AppLayout>
          }
        />

        <Route
          path="/goal-planner/report/:reportId"
          element={
            <AppLayout>
              <GoalPlannerReport />
            </AppLayout>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <AppLayout>
              <Reports />
            </AppLayout>
          }
        />

        {/* Subscription */}
        <Route
          path="/subscription"
          element={
            <AppLayout>
              <SubscriptionPage />
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;