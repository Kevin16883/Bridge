import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import ProviderDashboard from "@/pages/provider-dashboard-real";
import PerformerDashboard from "@/pages/performer-dashboard";
import CreateDemand from "@/pages/create-demand";
import ProjectDetail from "@/pages/project-detail";
import TaskDetail from "@/pages/task-detail";
import TaskSubmissions from "@/pages/task-submissions";
import Tasks from "@/pages/tasks";
import Community from "@/pages/community";
import AskQuestion from "@/pages/ask-question";
import QuestionDetail from "@/pages/question-detail";
import UserProfile from "@/pages/profile";
import Applications from "@/pages/applications";
import Messages from "@/pages/messages";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/provider-dashboard" component={ProviderDashboard} />
      <ProtectedRoute path="/performer-dashboard" component={PerformerDashboard} />
      <ProtectedRoute path="/create-demand" component={CreateDemand} />
      <ProtectedRoute path="/projects/:projectId" component={ProjectDetail} />
      <ProtectedRoute path="/projects/:projectId/tasks/:taskId/submissions" component={TaskSubmissions} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/tasks/:id" component={TaskDetail} />
      <ProtectedRoute path="/community" component={Community} />
      <ProtectedRoute path="/community/ask" component={AskQuestion} />
      <ProtectedRoute path="/community/questions/:id" component={QuestionDetail} />
      <ProtectedRoute path="/users/:userId" component={UserProfile} />
      <ProtectedRoute path="/applications" component={Applications} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/profile" component={UserProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
