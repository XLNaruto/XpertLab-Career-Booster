import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getEncodedCookie, toAbsoluteUrl } from "@/utils/reusable";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { clearCookies } from "@/utils/CookieComponent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Exercises", path: "/exercises" },
  { label: "Exam", path: "/exam" },
  { label: "Feedback", path: "/feedback" },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const headerShadow = useTransform(scrollY, [0, 50], [0, 1]);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", profilePicture: "" });
  // Whether the trainee has already submitted feedback. While unknown we keep
  // it false so the option is hidden until we confirm it is still pending.
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(true);
  // Whether the trainee has any exams. Hidden until the list confirms at least
  // one exam is assigned.
  const [hasExams, setHasExams] = useState(false);

  const handleLogout = () => {
    clearCookies();
    setLogoutOpen(false);
    navigate("/login");
  };

  const fetchProfile = async () => {
    const traineeId = getEncodedCookie("traineeId");
    if (!traineeId) return;
    const response: any = await postData(
      "private/trainee/personaldetail/get",
      { traineeId },
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const data = response.data.data || {};
      setProfile({
        firstName: data.firstName || "",
        profilePicture: data.profilePicture || "",
      });
    }
  };

  // Fetch feedback status globally so the nav can hide the option once the
  // trainee has submitted. Re-checked on route changes so it updates right
  // after a submission without a full reload.
  const fetchFeedbackStatus = async () => {
    const response: any = await postData(
      "private/trainee/feedback/questions",
      {},
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      setFeedbackSubmitted(!!response.data.data?.isFeedbackSubmitted);
    }
  };

  // Fetch the exam list so the nav can hide the Exam option when the trainee
  // has no exams assigned. Re-checked on route changes.
  const fetchExamStatus = async () => {
    const response: any = await postData(
      "private/trainee/exam/list",
      {},
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const d = response.data.data || {};
      const exams = Array.isArray(d) ? d : d.list || [];
      setHasExams(exams.length > 0);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchFeedbackStatus();
    fetchExamStatus();
  }, [location.pathname]);

  const visibleNavItems = navItems.filter((item) => {
    if (item.path === "/feedback") return !feedbackSubmitted;
    if (item.path === "/exam") return hasExams && feedbackSubmitted;
    return true;
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const initial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : "";

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* TOP NAV */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="sticky top-0 z-50 flex items-center justify-between px-10 py-5 backdrop-blur-[20px] border-b border-white/[0.15]"
          style={{
            boxShadow: useTransform(headerShadow, (v) => `0 4px 30px rgba(0,0,0,${v * 0.08})`),
          }}
        >
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Link to="/dashboard">
              <motion.img
                src={toAbsoluteUrl("/media/logo/xllogo.png")}
                alt="Logo"
                className="h-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-1 bg-white/[0.5] border border-white/[0.85] rounded-xl px-1.5 py-1 backdrop-blur-[20px] shadow-[var(--shadow-sm)] overflow-hidden"
          >
            {visibleNavItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.path}
                className="relative"
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.07, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-5 py-2 rounded-lg text-[13.5px] font-medium z-[1] ${isActive(item.path) ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.5] transition-colors duration-200"}`}
                >
                  {isActive(item.path) && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-[var(--shadow-primary)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {item.label}
                </motion.div>
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Link to="/profile">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-white shadow-[var(--shadow-sm)] flex items-center justify-center text-sm font-bold text-primary hover:ring-2 hover:ring-primary/30 transition-all overflow-hidden"
              >
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.firstName || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </motion.div>
            </Link>
            <motion.div
              onClick={() => setLogoutOpen(true)}
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.5] transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </motion.nav>

        {/* PAGE CONTENT */}
        {/* Expose the feedback status refresher so pages (e.g. Feedback) can
            update the nav right after a submission. */}
        <Outlet context={{ refreshFeedbackStatus: fetchFeedbackStatus }} />
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your dashboard, exercises and progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-gradient-to-br from-primary to-primary-light text-primary-foreground hover:opacity-90"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MainLayout;
