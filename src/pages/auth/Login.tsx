import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import AnimatedBackground from "@/components/AnimatedBackground";
import InteractiveBackground from "@/components/InteractiveBackground";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { encryptUrlData, setEncodedCookie, toasterrormsg, toastsuccessmsg, toAbsoluteUrl } from "@/utils/reusable";
import { apiHeader, postData } from "@/utils/ApiHelper";

interface LoginFormData {
  username: string;
  password: string;
}

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Card 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const cardRotateX = useTransform(smoothY, [0, 800], [4, -4]);
  const cardRotateY = useTransform(smoothX, [0, 800], [-4, 4]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const param = {
        username: data.username,
        password: data.password,
      };
      const response: any = await postData("trainee/auth/login", param, apiHeader(false,0));

      const body = response?.data || {};
      const resData = body.data || {};
      const isOk =
        String(response?.status) === "200" && String(body.status) === "200";

      // The backend returns the trainee's completedStep both on a successful
      // login (status 200, fully registered) and on an "incomplete
      // registration" rejection (e.g. status 400, no token). Either way, if we
      // have a traineeId + completedStep we can decide where to send them.
      if (resData.traineeId && resData.completedStep) {
        // Registration steps, in the same order the Register flow expects.
        const cs = resData.completedStep;
        const order = [
          cs.basicDetail,
          cs.location,
          cs.guardianDetail,
          cs.educationDetail,
          cs.courseDetail,
          cs.documents,
        ];
        const allComplete = order.every(Boolean);

        if (allComplete && isOk) {
          // Fully registered → log in: store credentials and go to dashboard.
          if (resData.token) setEncodedCookie("token", resData.token);
          setEncodedCookie("traineeId", resData.traineeId);
          navigate("/dashboard");
          toastsuccessmsg(body.message || "Login successful");
        } else {
          // Registration incomplete → do NOT store the id/token. Resume the
          // register flow at the first incomplete step (traineeId travels in
          // the encrypted URL payload, exactly like the register flow uses).
          let completed = 0;
          for (const v of order) {
            if (v) completed++;
            else break;
          }
          const nextStep = Math.min(completed + 1, order.length);
          navigate(
            `/register?data=${encryptUrlData({
              traineeId: String(resData.traineeId),
              completedStep: completed,
              step: nextStep,
            })}`,
          );
          toastsuccessmsg(body.message || "Please complete your registration");
        }
      } else if (isOk && resData.traineeId) {
        // Logged in but no step info → treat as fully registered.
        if (resData.token) setEncodedCookie("token", resData.token);
        setEncodedCookie("traineeId", resData.traineeId);
        navigate("/dashboard");
        toastsuccessmsg(body.message || "Login successful");
      } else {
        toasterrormsg(body.message || "Invalid credentials");
      }
    } catch (error: any) {
      toasterrormsg(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen grid grid-cols-2">
        {/* LEFT PANEL */}
        <div className="flex flex-col justify-between px-[60px] py-12 border-r border-foreground/[0.06] relative overflow-hidden">
          {/* Glow effects */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute -top-[100px] -left-[100px] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,hsl(342_80%_53%/0.1),transparent_70%)] pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="absolute -bottom-[80px] -right-[80px] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,hsl(207_65%_50%/0.07),transparent_70%)] pointer-events-none"
          />

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link to="/" className="flex items-center gap-3.5 relative z-10">
              <img src={toAbsoluteUrl("media/logo/xllogo.png")} alt="XpertLab Career Booster" className="w-[130px]" />
            </Link>
          </motion.div>

          {/* Center content */}
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="font-serif text-[54px] font-bold leading-[1.1] mb-4"
            >
              <span className="text-foreground">Welcome</span>
              <br />
              <span className="text-foreground">back to your</span>&nbsp;
              <em className="not-italic bg-gradient-to-br from-primary to-primary-mid bg-clip-text text-transparent font-serif italic">
                learning hub
              </em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-[15px] text-muted-foreground leading-[1.7] mb-9 font-light"
            >
              Access your personalized dashboard, track attendance, and continue
              your exercises from where you left off.
            </motion.p>

            <div className="flex flex-col gap-3.5">
              {[
                {
                  icon: "📊",
                  title: "Live Attendance Tracking",
                  desc: "Monitor daily presence with smart calendar insights",
                  bg: "rgba(231,39,111,0.12)",
                },
                {
                  icon: "💻",
                  title: "Hands-on Exercises",
                  desc: "Practice with real-world coding tasks reviewed by mentors",
                  bg: "rgba(41,145,214,0.12)",
                },
                {
                  icon: "🧠",
                  title: "Skill Development Journey",
                  desc: "Build and improve your skills step by step with guided practice",
                  bg: "rgba(78,203,127,0.12)",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 + i * 0.12, ease: "easeOut" }}
                  className="flex items-start gap-3.5"
                >
                  <div
                    className="w-9 h-9 flex-shrink-0 rounded-[9px] flex items-center justify-center text-[15px]"
                    style={{ background: f.bg }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {f.title}
                    </div>
                    <div className="text-[12.5px] text-muted-foreground">
                      {f.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex items-center gap-5 text-xs text-muted-foreground relative z-10"
          >
            <span>
              © 2013 - {new Date().getFullYear()} XpertLab Technologies Private Limited
            </span>
          </motion.div>
        </div>

        {/* RIGHT PANEL - Interactive */}
        <InteractiveBackground>
          <div
            className="flex items-center justify-center p-12 min-h-screen"
            style={{ perspective: "1200px" }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              mouseX.set(e.clientX - rect.left);
              mouseY.set(e.clientY - rect.top);
            }}
          >
            <motion.div
              style={{
                rotateX: cardRotateX,
                rotateY: cardRotateY,
                transformStyle: "preserve-3d",
              }}
              className="w-full max-w-[550px] bg-white/[0.55] border border-white/[0.85] rounded-3xl p-11 backdrop-blur-[28px] shadow-[var(--shadow-lg),inset_0_1px_0_white] animate-slide-up"
            >
              {/* Header */}
              <div className="text-center mb-9">
                <div className="w-10 h-[2px] bg-gradient-to-r from-primary to-primary-light rounded-full mx-auto mb-5" />
                <h2 className="font-serif text-[32px] font-bold text-foreground mb-1.5">
                  Sign In
                </h2>
                <p className="text-sm text-muted-foreground font-light">
                  Enter your credentials to continue
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-[18px] mb-6">
                <div>
                  <label className="block text-[12.5px] font-semibold text-foreground/65 tracking-[0.5px] uppercase mb-2">
                    User Name <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Enter your username"
                      {...register("username", { required: "Username is required" })}
                      className="w-full py-3.5 pl-11 pr-4 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-primary mt-1.5">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-foreground/65 tracking-[0.5px] uppercase mb-2">
                    Password <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password", { required: "Password is required" })}
                      className="w-full py-3.5 pl-11 pr-11 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/55 transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-primary mt-1.5">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[14.5px] bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-[11px] text-[15px] font-bold shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? "Signing In..." : <>Sign In &nbsp;→</>}
                </button>
              </form>

              <p className="text-center text-[13.5px] text-muted-foreground mt-5">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:opacity-80 transition-opacity"
                >
                  Create Account
                </Link>
              </p>
            </motion.div>
          </div>
        </InteractiveBackground>
      </div>
    </>
  );
};

export default Login;
