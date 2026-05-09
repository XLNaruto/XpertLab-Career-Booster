import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { motion } from "motion/react";
import AnimatedBackground from "@/components/AnimatedBackground";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { toAbsoluteUrl } from "@/utils/reusable";
import { PersonalDetails, LocationDetails, GuardianDetails, EducationDetails, CourseDetails, Documents } from "./register";
import type { RegisterFormData } from "./register";

const steps = [
  { num: 1, title: "Personal Details", desc: "Name, gender & contact" },
  { num: 2, title: "Location Details", desc: "State, city & address" },
  { num: 3, title: "Guardian Details", desc: "Parent/guardian info" },
  { num: 4, title: "Education Details", desc: "Academic background" },
  { num: 5, title: "Course Details", desc: "Course & batch selection" },
  { num: 6, title: "Documents", desc: "ID & document uploads" },
];

const stepComponents: Record<number, React.FC> = {
  1: PersonalDetails,
  2: LocationDetails,
  3: GuardianDetails,
  4: EducationDetails,
  5: CourseDetails,
  6: Documents,
};

const Register = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const methods = useForm<RegisterFormData>({
    defaultValues: {
      firstName: "", middleName: "", lastName: "",
      gender: "", birthDate: null, email: "",
      mobile1: "", mobile2: "",
      userName: "", password: "", confirmPassword: "",
      state: "", city: "", address: "",
      guardians: [{ type: "", relation: "", firstName: "", lastName: "", mobile1: "", mobile2: "" }],
      educations: [{ educationType: "", education: "", board: "", institute: "", passingYear: null, academicYear: null, percentage: "", educationCompleted: true, educationDocument: null }],
      course: "", traineeArea: "", batchDay: "", batchTime: "",
      joiningDate: null, device: "", computer: "",
      aadharNumber: "", documents: [null, null, null],
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log(data);
    navigate("/dashboard");
  };

  const StepComponent = stepComponents[step];

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
              {steps.map((s, i) => (
                <motion.button
                  key={s.num}
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.1, ease: "easeOut" }}
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${step === s.num ? "bg-white/[0.7] border border-white/[0.9] shadow-[var(--shadow-sm)]" : step > s.num ? "bg-white/[0.3] border border-transparent" : "border border-transparent opacity-60"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s.num ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-primary)]" : step > s.num ? "bg-green-500 text-white" : "bg-foreground/[0.08] text-muted-foreground"}`}>
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <div>
                    <div className={`text-[13px] font-semibold ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</div>
                    <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                  </div>
                </motion.button>
              ))}
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
                  <StepComponent />

                  {/* Buttons */}
                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => step === 1 ? navigate("/login") : setStep(step - 1)}
                      className="flex-1 py-[14px] bg-white/[0.65] border border-foreground/[0.12] text-foreground rounded-[11px] text-sm font-semibold hover:bg-white/[0.85] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    {step < 6 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        className="flex-1 py-[14px] bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-[11px] text-[15px] font-bold shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Save & Next <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex-1 py-[14px] bg-gradient-to-br from-primary to-primary-light text-primary-foreground rounded-[11px] text-[15px] font-bold shadow-[var(--shadow-primary)] hover:shadow-[0_12px_36px_hsl(342_80%_53%/0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Save
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
    </>
  );
};

export default Register;
