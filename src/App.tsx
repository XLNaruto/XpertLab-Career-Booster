import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/welcome/Welcome";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import ExerciseList from "./pages/exercise/ExerciseTechnologyList";
import SubExerciseList from "./pages/exercise/ExerciseList";
import ExerciseDetail from "./pages/exercise/ExerciseDetail";
import Feedback from "./pages/feedeback/Feedback";
import Exam from "./pages/exam/Exam";
import ExamDetail from "./pages/exam/ExamDetail";
import ExamResult from "./pages/exam/ExamResult";
import MyProfile from "./pages/myprofile/MyProfile";
import NotFound from "./pages/error/NotFound";
import MainLayout from "./components/layout/MainLayout";
import { PrivateRoute, PublicRoute } from "./components/auth/RouteGuards";

const { BASE_URL } = import.meta.env;
const queryClient = new QueryClient();

// console.log = console.warn = console.error = () => {};

const App = () => (

    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={BASE_URL}>
          <Routes>
            <Route element={<PublicRoute />}>
            <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/exercises" element={<Navigate to="/exercises/technology" replace />} />
              <Route path="/exercises/technology" element={<ExerciseList />} />
              <Route path="/exercises/list" element={<SubExerciseList />} />
              <Route path="/exercises/details" element={<ExerciseDetail />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/exam" element={<Exam />} />
              <Route path="/exam/details" element={<ExamDetail />} />
              <Route path="/exam/result" element={<ExamResult />} />
              <Route path="/profile" element={<MyProfile />} />
            </Route>
          </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
)




export default App;
