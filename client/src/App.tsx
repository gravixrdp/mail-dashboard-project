import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import DashboardLayoutSkeleton from "./components/DashboardLayoutSkeleton";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";

// Pages
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import Companies from "./pages/Companies";
import ComposeMail from "./pages/ComposeMail";
import Templates from "./pages/Templates";
import ResumeManager from "./pages/ResumeManager";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ActivityLogs from "./pages/ActivityLogs";

function ProtectedRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/applications" component={Applications} />
        <Route path="/companies" component={Companies} />
        <Route path="/compose" component={ComposeMail} />
        <Route path="/templates" component={Templates} />
        <Route path="/resumes" component={ResumeManager} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route path="/activity" component={ActivityLogs} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <ProtectedRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
