import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useFormContext, Controller } from "react-hook-form";
import { format } from "date-fns";
import Select from "react-select";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import {
  User,
  Mail,
  Lock,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Camera,
  X,
  ChevronDown,
} from "lucide-react";
import {
  selectStyles,
  inputClass,
  labelClass,
  errorClass,
  iconClass,
} from "./styles";
import type { ProfileFormData } from "./types";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";
import { personalDetailsSchema } from "./schemas";

export type PersonalDetailsHandle = {
  save: () => Promise<boolean>;
};

type PersonalDetailsProps = {
  existingPictureUrl?: string;
  onSaved?: () => void;
};

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const prefixList = [
  { label: "Mr.", value: "Mr." },
  { label: "Ms.", value: "Ms." },
  { label: "Mrs.", value: "Mrs." },
];

const PersonalDetails = forwardRef<PersonalDetailsHandle, PersonalDetailsProps>(
  ({ existingPictureUrl, onSaved }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [prefixOpen, setPrefixOpen] = useState(false);
    const prefixRef = useRef<HTMLDivElement | null>(null);
    const methods = useFormContext<ProfileFormData>();
    const {
      register,
      control,
      formState: { errors },
    } = methods;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const submittedRef = useRef(false);
    const profilePhoto = methods.watch("profilePhoto") as File | null;
    const [photoObjectUrl, setPhotoObjectUrl] = useState<string | null>(null);
    useEffect(() => {
      if (!profilePhoto) {
        setPhotoObjectUrl(null);
        return;
      }
      const url = URL.createObjectURL(profilePhoto);
      setPhotoObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [profilePhoto]);

    useEffect(() => {
      const sub = methods.watch((_v, { name }) => {
        if (!name || !submittedRef.current) return;
        const values = methods.getValues();
        const hasTraineeId = !!(
          values.traineeId && String(values.traineeId).trim() !== ""
        );

        // Password & confirm-password are cross-dependent: changing either one
        // must re-validate BOTH fields, otherwise typing in "password" never
        // fires the "confirm password" validation.
        if (!hasTraineeId && (name === "password" || name === "confirmPassword")) {
          const pwd = (values.password || "").trim();
          const cpw = (values.confirmPassword || "").trim();

          // password field
          if (!pwd) {
            methods.setError("password", {
              type: "manual",
              message: "Please Enter Password",
            });
          } else {
            methods.clearErrors("password");
          }

          // confirm-password field
          if (pwd && !cpw) {
            methods.setError("confirmPassword", {
              type: "manual",
              message: "Please Enter Confirm Password",
            });
          } else if (pwd && cpw && pwd !== cpw) {
            methods.setError("confirmPassword", {
              type: "manual",
              message: "Password and Confirm Password didn't match",
            });
          } else {
            methods.clearErrors("confirmPassword");
          }
          return;
        }

        const result = personalDetailsSchema.safeParse(values);
        const issueMessage: string | undefined = result.success
          ? undefined
          : result.error.issues.find((i) => i.path[0] === name)?.message;

        if (issueMessage) {
          methods.setError(name as any, {
            type: "manual",
            message: issueMessage,
          });
        } else {
          methods.clearErrors(name as any);
        }
      });
      return () => sub.unsubscribe();
    }, [methods]);

    useImperativeHandle(
      ref,
      () => ({
        save: async () => {
          submittedRef.current = true;

          // The form has no zod resolver, so validate against the schema here.
          // This fires errors for every invalid field (including the cross-field
          // password / confirm-password rules) before any API call is made.
          const values = methods.getValues();
          const result = personalDetailsSchema.safeParse(values);

          methods.clearErrors();
          if (!result.success) {
            const seen = new Set<string>();
            result.error.issues.forEach((issue) => {
              const field = String(issue.path[0] ?? "");
              if (!field || seen.has(field)) return;
              seen.add(field);
              methods.setError(field as any, {
                type: "manual",
                message: issue.message,
              });
            });
            return false;
          }

          const v = methods.getValues();
          const param = new FormData();
          param.append("prefix", v.prefix);
          param.append("firstName", v.firstName);
          param.append("middleName", v.middleName ?? "");
          param.append("lastName", v.lastName);
          param.append("gender", v.gender);
          if (v.birthDate)
            param.append("birthDate", format(v.birthDate, "yyyy-MM-dd"));
          param.append("email", v.email);
          param.append("mobileNumber", v.mobile1);
          param.append("mobileNumber2", v.mobile2 ?? "");
          param.append("username", v.userName);
          if (v.password) param.append("password", v.password);
          if (v.profilePhoto instanceof File) {
            param.append("profilePicture", v.profilePhoto);
          }

          const response: any = await postData(
            "private/trainee/personaldetail/update",
            param,
            apiHeader(true, 2),
          );

          if (
            String(response?.status) === "200" &&
            String(response.data?.status) === "200"
          ) {
            toastsuccessmsg(response.data.message || "Profile updated");
            onSaved?.();
            return true;
          }
          toasterrormsg(response?.data?.message || "Something went wrong");
          return false;
        },
      }),
      [methods, onSaved],
    );

    return (
      <div className="space-y-4">
        {/* Profile Photo */}
        <div className="mb-2">
          <label className={labelClass}>Profile</label>
          <Controller
            name="profilePhoto"
            control={control}
            render={({ field }) => {
              const preview = photoObjectUrl || existingPictureUrl || null;
              return (
                <div className="relative w-24 h-24 group">
                  <div
                    className="w-24 h-24 rounded-full bg-foreground/[0.06] border-2 border-foreground/[0.1] flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-foreground/20" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      field.onChange(e.target.files?.[0] || null)
                    }
                  />
                  {field.value ? (
                    <button
                      type="button"
                      onClick={() => field.onChange(null)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-foreground/40 text-white rounded-full flex items-center justify-center text-xs hover:bg-foreground/60 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>
              First Name <span className="text-primary">*</span>
            </label>
            <div className="flex items-stretch bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] focus-within:border-primary/45 focus-within:bg-white/[0.65] focus-within:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200">
              <Controller
                name="prefix"
                control={control}
                render={({ field }) => (
                  <div ref={prefixRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setPrefixOpen((v) => !v)}
                      className="h-full flex items-center gap-1.5 pl-3 pr-2 py-2.5 text-sm text-foreground border-r border-foreground/[0.09] outline-none cursor-pointer min-w-[68px]"
                    >
                      <span
                        className={
                          field.value ? "text-foreground" : "text-foreground/40"
                        }
                      >
                        {field.value || "--"}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-foreground/40 transition-transform ${prefixOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {prefixOpen && (
                      <ul className="absolute top-[calc(100%+4px)] left-0 z-50 min-w-[88px] bg-white/95 backdrop-blur-[20px] border border-foreground/[0.09] rounded-[11px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden py-1">
                        {prefixList.map((p) => {
                          const selected = field.value === p.value;
                          return (
                            <li
                              key={p.value}
                              onClick={() => {
                                field.onChange(p.value);
                                setPrefixOpen(false);
                              }}
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${selected ? "bg-primary/10 text-foreground font-semibold" : "text-foreground hover:bg-primary/[0.06]"}`}
                            >
                              {p.label}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              />
              <input
                {...register("firstName")}
                placeholder="First Name"
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/55 outline-none rounded-r-[11px]"
              />
            </div>
            {(errors.prefix || errors.firstName) && (
              <p className={errorClass}>
                {
                  (errors.prefix?.message ||
                    errors.firstName?.message) as string
                }
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Middle Name <span className="text-primary">*</span></label>
            <div className="relative">
              <div className={iconClass}>
                <User className="w-4 h-4" />
              </div>
              <input
                {...register("middleName")}
                placeholder="Middle Name"
                className={inputClass}
              />
            </div>
              {errors.middleName && (
                <p className={errorClass}>{errors.middleName.message}</p>
              )}
          </div>
          <div>
            <label className={labelClass}>
              Last Name <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <div className={iconClass}>
                <User className="w-4 h-4" />
              </div>
              <input
                {...register("lastName")}
                placeholder="Last Name"
                className={inputClass}
              />
            </div>
            {errors.lastName && (
              <p className={errorClass}>{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>
              Gender <span className="text-primary">*</span>
            </label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={genderOptions}
                  placeholder="Select Gender"
                  styles={selectStyles}
                  value={
                    genderOptions.find((o) => o.value === field.value) || null
                  }
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
            {errors.gender && (
              <p className={errorClass}>{errors.gender.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Birth Date <span className="text-primary">*</span>
            </label>
            <Controller
              name="birthDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  format="dd-MM-yyyy"
                  maxDate={new Date()}
                  dayPlaceholder="dd"
                  monthPlaceholder="mm"
                  yearPlaceholder="yyyy"
                  clearIcon={null}
                  className="react-date-picker--custom"
                />
              )}
            />
            {errors.birthDate && (
              <p className={errorClass}>{errors.birthDate.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Email <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <div className={iconClass}>
                <Mail className="w-4 h-4" />
              </div>
              <input
                {...register("email")}
                placeholder="Ex: dhoni@gmail.com"
                type="email"
                className={inputClass}
              />
            </div>
            {errors.email && (
              <p className={errorClass}>{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>
              Mobile Number 1 <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <div className={iconClass}>
                <Phone className="w-4 h-4" />
              </div>
              <input
                {...register("mobile1")}
                placeholder="91 98765-43210"
                type="tel"
                className={inputClass}
              />
            </div>
            {errors.mobile1 && (
              <p className={errorClass}>{errors.mobile1.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Mobile Number 2</label>
            <div className="relative">
              <div className={iconClass}>
                <Phone className="w-4 h-4" />
              </div>
              <input
                {...register("mobile2")}
                placeholder="91 98765-43210"
                type="tel"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Credential */}
        <div className="border-t border-foreground/[0.08] pt-5 mt-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Credential
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                Username <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <div className={iconClass}>
                  <User className="w-4 h-4" />
                </div>
                <input
                  {...register("userName")}
                  placeholder="Username"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              {errors.userName && (
                <p className={errorClass}>{errors.userName.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <div className={iconClass}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  {...register("password", {
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                  placeholder="Leave blank to keep current"
                  type={showPassword ? "text" : "password"}
                  className={`${inputClass} !pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/55 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className={errorClass}>{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <div className={iconClass}>
                  <Shield className="w-4 h-4" />
                </div>
                <input
                  {...register("confirmPassword", {
                    validate: (value) =>
                      !methods.getValues("password") ||
                      value === methods.getValues("password") ||
                      "Passwords do not match",
                  })}
                  placeholder="Leave blank to keep current"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`${inputClass} !pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/55 transition-colors p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className={errorClass}>{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PersonalDetails.displayName = "PersonalDetails";

export default PersonalDetails;
