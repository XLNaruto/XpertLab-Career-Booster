import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { Lock, CheckCircle2 } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { decryptUrlData, encryptUrlData, toAbsoluteUrl, toasterrormsg } from "@/utils/reusable";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { PersonalDetails, LocationDetails, GuardianDetails, EducationDetails, CourseDetails, Documents } from "./register";
import type { StepHandle } from "./register";
import type { RegisterFormData } from "./register";

const TOTAL_STEPS = 6;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const completedStepFromApi = (cs: any): number => {
  const order = [
    cs?.basicDetail,
    cs?.location,
    cs?.guardianDetail,
    cs?.educationDetail,
    cs?.courseDetail,
    cs?.documents,
  ];
  let n = 0;
  for (const v of order) {
    if (v) n++;
    else break;
  }
  return n;
};

const steps = [
  { num: 1, title: "Personal Details", desc: "Name, gender & contact" },
  { num: 2, title: "Location Details", desc: "State, city & address" },
  { num: 3, title: "Guardian Details", desc: "Parent/guardian info" },
  { num: 4, title: "Education Details", desc: "Academic background" },
  { num: 5, title: "Course Details", desc: "Course & batch selection" },
  { num: 6, title: "Documents", desc: "ID & document uploads" },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPayload: any = (() => {
    const raw = searchParams.get("data");
    if (!raw) return {};
    try {
      return decryptUrlData(raw) || {};
    } catch {
      return {};
    }
  })();
  const initialTraineeId = String(initialPayload.traineeId || "");
  const initialCompletedStep = clamp(parseInt(String(initialPayload.completedStep || "0"), 10) || 0, 0, TOTAL_STEPS);
  const initialStep = clamp(parseInt(String(initialPayload.step || "1"), 10) || 1, 1, TOTAL_STEPS);

  const [step, setStepState] = useState(initialStep);
  const [completedStep, setCompletedStep] = useState(initialCompletedStep);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const writeUrl = (nextStep: number, nextCompleted: number, traineeId?: string) => {
    const id = traineeId ?? methods.getValues("traineeId");
    const payload: Record<string, any> = { step: nextStep, completedStep: nextCompleted };
    if (id) payload.traineeId = id;
    setSearchParams({ data: encryptUrlData(payload) || "" }, { replace: true });
  };

  const goToStep = (n: number) => {
    const next = clamp(n, 1, TOTAL_STEPS);
    setStepState(next);
    writeUrl(next, completedStep);
  };

  const methods = useForm<RegisterFormData>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      traineeId: "",
      prefix: "Mr.", firstName: "", middleName: "", lastName: "",
      gender: "", birthDate: null, email: "",
      mobile1: "", mobile2: "",
      userName: "", password: "", confirmPassword: "",
      stateId: "", cityId: "", address: "",
      guardians: [{ traineeguardiandetailId: "", guardianType: "", relation: "", firstName: "", lastName: "", mobileNumber: "", mobileNumber2: "" }],
      educations: [{ traineeeducationdetailId: "", educationType: "", education: "", boardId: "", instituteId: "", passingYear: "", percentage: "", isCompleted: "0", document: "", url: "" }],
      traineecourseId: "", course: "", enrollmentType: "", traineeArea: "", batchDay: "", batchTime: "",
      joiningDate: null, hasLaptop: null, computerId: "",
      aadharNumber: "", documents: [],
    },
  });

  const personalRef = useRef<StepHandle | null>(null);
  const locationRef = useRef<StepHandle | null>(null);
  const guardianRef = useRef<StepHandle | null>(null);
  const educationRef = useRef<StepHandle | null>(null);
  const courseRef = useRef<StepHandle | null>(null);
  const documentsRef = useRef<StepHandle | null>(null);

  useEffect(() => {
    if (!initialTraineeId) return;
    methods.setValue("traineeId", initialTraineeId);

    (async () => {
      const response: any = await postData(
        "trainee/personaldetail/get",
        { traineeId: initialTraineeId },
        apiHeader(false, 0)
      );
      if (String(response?.status) === "200" && String(response.data?.status) === "200") {
        const data = response.data.data || {};
        const done = completedStepFromApi(data.completedStep);
        const nextCompleted = Math.max(initialCompletedStep, done);
        const cap = Math.min(nextCompleted + 1, TOTAL_STEPS);
        const desired = clamp(initialStep, 1, cap);
        setCompletedStep(nextCompleted);
        setStepState(desired);
        writeUrl(desired, nextCompleted, initialTraineeId);
      }
    })();
  }, []);

  const handleSaved = (savedTraineeId?: string) => {
    const nextCompleted = Math.max(completedStep, step);
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    setCompletedStep(nextCompleted);
    setStepState(nextStep);
    writeUrl(nextStep, nextCompleted, savedTraineeId);
  };

  const handleNext = async () => {
    if (step === 1) {
      setLoading(true);
      await personalRef.current?.save();
      setLoading(false);
      return;
    }
    if (step === 2) {
      setLoading(true);
      await locationRef.current?.save();
      setLoading(false);
      return;
    }
    if (step === 3) {
      setLoading(true);
      await guardianRef.current?.save();
      setLoading(false);
      return;
    }
    if (step === 4) {
      setLoading(true);
      await educationRef.current?.save();
      setLoading(false);
      return;
    }
    if (step === 5) {
      setLoading(true);
      await courseRef.current?.save();
      setLoading(false);
      return;
    }
    setCompletedStep((prev) => Math.max(prev, step));
    goToStep(step + 1);
  };

  const handleSidebarClick = (target: number) => {
    if (target <= completedStep + 1) {
      goToStep(target);
    } else {
      toasterrormsg("Please complete the current step first");
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    console.log(data);
    navigate("/dashboard");
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    await documentsRef.current?.save();
    setLoading(false);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen grid grid-cols-[320px_1fr]">
        {/* LEFT PANEL - Steps */}
        <div className="flex flex-col justify-between px-8 py-10 border-r border-foreground/[0.06] bg-white/[0.3] backdrop-blur-[20px]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link to="/" className="flex items-center gap-3 mb-10">
              <img src={toAbsoluteUrl("media/logo/xllogo.png")} alt="XpertLab Career Booster" className="w-[120px]" />
            </Link>
          </motion.div>

          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="font-serif text-2xl font-bold text-foreground mb-1"
            >
              Create Account
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
              className="text-[13px] text-muted-foreground mb-6"
            >
              Complete all steps to register
            </motion.p>

            <div className="flex flex-col gap-2">
              {steps.map((s, i) => {
                const locked = s.num > completedStep + 1;
                const isCompleted = s.num <= completedStep;
                return (
                  <motion.button
                    key={s.num}
                    type="button"
                    initial={{ opacity: 0, x: -25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 + i * 0.1, ease: "easeOut" }}
                    onClick={() => handleSidebarClick(s.num)}
                    disabled={locked}
                    aria-disabled={locked}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${step === s.num ? "bg-white/[0.7] border border-white/[0.9] shadow-[var(--shadow-sm)]" : isCompleted ? "bg-white/[0.3] border border-transparent" : "border border-transparent opacity-60"} ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s.num ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)]" : isCompleted ? "bg-green-500 text-white" : "bg-foreground/[0.08] text-muted-foreground"}`}>
                      {isCompleted ? "✓" : locked ? <Lock className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <div>
                      <div className={`text-[13px] font-semibold ${step === s.num || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</div>
                      <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-[11px] text-muted-foreground mt-6 text-center"
          >
            © 2013 - {new Date().getFullYear()} XpertLab Technologies Private Limited
          </motion.div>
        </div>

        {/* RIGHT PANEL - Form with Interactive BG */}
        <InteractiveBackground>
          <div className="flex items-start justify-center p-10 overflow-y-auto max-h-screen">
            <div className="w-full max-w-[800px] bg-white/[0.55] border border-white/[0.85] rounded-3xl p-10 backdrop-blur-[28px] shadow-[var(--shadow-lg),inset_0_1px_0_white] animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-10 h-[2px] bg-gradient-to-r from-primary to-primary-light rounded-full mx-auto mb-4" />
                <h2 className="font-serif text-[26px] font-bold text-foreground mb-1">{steps[step - 1].title}</h2>
                <p className="text-sm text-muted-foreground">Step {step} of 6</p>
                <div className="mt-4 h-1 bg-foreground/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }} />
                </div>
              </div>

              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                  {step === 1 ? (
                    <PersonalDetails ref={personalRef} onSaved={() => handleSaved(methods.getValues("traineeId"))} />
                  ) : step === 2 ? (
                    <LocationDetails ref={locationRef} onSaved={() => handleSaved()} />
                  ) : step === 3 ? (
                    <GuardianDetails ref={guardianRef} onSaved={() => handleSaved()} />
                  ) : step === 4 ? (
                    <EducationDetails ref={educationRef} onSaved={() => handleSaved()} />
                  ) : step === 5 ? (
                    <CourseDetails ref={courseRef} onSaved={() => handleSaved()} />
                  ) : step === 6 ? (
                    <Documents
                      ref={documentsRef}
                      onSaved={() => {
                        setCompletedStep(TOTAL_STEPS);
                        setShowSuccess(true);
                        setTimeout(() => navigate("/login"), 2800);
                      }}
                    />
                  ) : null}

                  {/* Buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => step === 1 ? navigate("/login") : goToStep(step - 1)}
                      className="flex-1 py-[14px] bg-white/[0.65] border border-foreground/[0.12] text-foreground rounded-[11px] text-sm font-semibold hover:bg-white/[0.85] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    {step < 6 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={loading}
                        className="flex-1 py-[14px] bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-[11px] text-[15px] font-bold shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : <>Save & Next <ChevronRight className="w-4 h-4" /></>}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={loading}
                        className="flex-1 py-[14px] bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-[11px] text-[15px] font-bold shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                    )}
                  </div>
                </form>
              </FormProvider>

              <p className="text-center text-[13px] text-muted-foreground mt-5">
                Already registered?{" "}
                <Link to="/login" className="text-primary font-semibold hover:opacity-80 transition-opacity">Sign In</Link>
              </p>
            </div>
          </div>
        </InteractiveBackground>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/15 via-white/40 to-primary-light/20 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative flex flex-col items-center gap-5 px-12 py-10 rounded-3xl bg-white/[0.7] border border-white/[0.9] shadow-[var(--shadow-lg)] backdrop-blur-[28px] text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, duration: 0.5, type: "spring", stiffness: 220, damping: 14 }}
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-[var(--shadow-primary)]"
              >
                <motion.span
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ delay: 0.35, duration: 1.1, repeat: Infinity, repeatDelay: 0.4 }}
                  className="absolute inset-0 rounded-full bg-primary/30"
                />
                <CheckCircle2 className="w-11 h-11 text-white relative" strokeWidth={2.4} />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="font-serif text-2xl font-bold text-foreground"
              >
                Registration Successful
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.45 }}
                className="text-sm text-muted-foreground max-w-xs"
              >
                Your account has been created. Redirecting you to sign in…
              </motion.p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.55, duration: 2.2, ease: "linear" }}
                className="h-1 rounded-full bg-gradient-to-r from-primary to-primary-light w-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Register;
