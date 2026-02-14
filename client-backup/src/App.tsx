import { Switch, Route, Router, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuth } from "@/hooks/use-auth";
import { BottomTabs } from "@/components/bottom-tabs";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import HomePage from "@/pages/home";
import CalendarPage from "@/pages/calendar";
import InboxPage from "@/pages/inbox";
import ChatPage from "@/pages/chat";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import ListingDetailPage from "@/pages/listing-detail";
import NotificationsPage from "@/pages/notifications";
import ChannelsPage from "@/pages/channels";
import SettingsListingsPage from "@/pages/settings-listings";
import SettingsTemplatesPage from "@/pages/settings-templates";
import SettingsRemindersPage from "@/pages/settings-reminders";
import SettingsCleaningPage from "@/pages/settings-cleaning";
import SettingsMaintenancePage from "@/pages/settings-maintenance";
import SettingsAutomationPage from "@/pages/settings-automation";
import CommunityQuestionsPage from "@/pages/community-questions";
import SupportChatPage from "@/pages/support-chat";
import DevPortalPage from "@/pages/dev-portal";
import { AdminLayout } from "@/pages/admin/admin-layout";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminUsers from "@/pages/admin/admin-users";
import AdminChat from "@/pages/admin/admin-chat";
import AdminFinance from "@/pages/admin/admin-finance";
import AdminProviders from "@/pages/admin/admin-providers";
import AdminSettings from "@/pages/admin/admin-settings";
import AdminUserDetail from "@/pages/admin/admin-user-detail";
import AdminLogin from "@/pages/admin/admin-login";
import AdminCleaning from "@/pages/admin/admin-cleaning";
import ProviderPortal from "@/pages/provider-portal";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function AuthenticatedApp() {
  const { data: inboxData } = useQuery<Array<{ unreadCount: number }>>({
    queryKey: ["/api/inbox"],
  });

  const totalUnread =
    inboxData?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

  return (
    <div className="app-wrapper">
    <div className="app-shell safe-area-top">
      <div className="app-content">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/inbox" component={InboxPage} />
          <Route path="/chat/:id" component={ChatPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/listing/:id" component={ListingDetailPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/channels" component={ChannelsPage} />
          <Route path="/settings/listings" component={SettingsListingsPage} />
          <Route path="/settings/templates" component={SettingsTemplatesPage} />
          <Route path="/settings/reminders" component={SettingsRemindersPage} />
          <Route path="/settings/cleaning" component={SettingsCleaningPage} />
          <Route path="/settings/maintenance" component={SettingsMaintenancePage} />
          <Route path="/settings/automation" component={SettingsAutomationPage} />
          <Route path="/community-questions" component={CommunityQuestionsPage} />
          <Route path="/support-chat" component={SupportChatPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomTabs unreadCount={totalUnread} />
    </div>
    </div>
  );
}

function AdminApp() {
  const { data: adminCheck, isLoading: adminLoading, refetch } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/auth-check"],
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <AdminLogin onSuccess={() => {
        refetch();
      }} />
    );
  }

  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/users/:id" component={AdminUserDetail} />
        <Route path="/users" component={AdminUsers} />
        <Route path="/finance" component={AdminFinance} />
        <Route path="/providers" component={AdminProviders} />
        <Route path="/cleaning" component={AdminCleaning} />
        <Route path="/settings" component={AdminSettings} />
        <Route path="/chat" component={AdminChat} />
        <Route component={AdminDashboard} />
      </Switch>
    </AdminLayout>
  );
}

function ProviderApp() {
  return <ProviderPortal />;
}

function HostAppRouter() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="app-wrapper">
        <div className="app-shell items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    if (location === "/login") {
      return <LoginPage />;
    }
    if (location === "/signup") {
      return <SignupPage />;
    }
    return <LandingPage />;
  }

  if (location === "/login" || location === "/signup") {
    window.history.replaceState(null, "", "/hostapp");
    return <AuthenticatedApp />;
  }

  if (location.startsWith("/provider")) {
    return <ProviderApp />;
  }

  return <AuthenticatedApp />;
}

function RootRedirect() {
  useEffect(() => {
    window.location.replace("/hostapp");
  }, []);
  return null;
}

function AppRouter() {
  const rawPath = window.location.pathname;

  if (rawPath === "/dev-portal") {
    return <DevPortalPage />;
  }

  if (rawPath.startsWith("/admin")) {
    return (
      <Router base="/admin">
        <AdminApp />
      </Router>
    );
  }

  if (rawPath.startsWith("/hostapp")) {
    return (
      <Router base="/hostapp">
        <HostAppRouter />
      </Router>
    );
  }

  return <RootRedirect />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
