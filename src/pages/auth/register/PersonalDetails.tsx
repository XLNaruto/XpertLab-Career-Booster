import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { format } from "date-fns";
import Select from "react-select";
import DatePicker from "react-date-picker";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { User, Mail, Lock, Shield, Eye, EyeOff, ChevronDown } from "lucide-react";
import { selectStyles, inputClass, labelClass, errorClass, iconClass } from "./styles";
import { personalDetailsSchema } from "./schemas";
import type { RegisterFormData } from "./types";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";
import moment from "moment";

export type StepHandle = {
  save: () => Promise<boolean>;
};

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const phoneInputContainerClass = "phone-input--custom";

type PersonalDetailsProps = {
  onSaved?: () => void;
};

const PersonalDetails = forwardRef<StepHandle, PersonalDetailsProps>(({ onSaved }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [prefixList] = useState([
    { label: "Mr.", value: "Mr." },
    { label: "Ms.", value: "Ms." },
    { label: "Mrs.", value: "Mrs." },
  ]);
  const prefixRef = useRef<HTMLDivElement | null>(null);
  const submittedRef = useRef(false);
  const methods = useFormContext<RegisterFormData>();
  const { register, control, formState: { errors } } = methods;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (prefixRef.current && !prefixRef.current.contains(e.target as Node)) {
        setPrefixOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const sub = methods.watch((_v, { name }) => {
      if (!name || !submittedRef.current) return;
      const result = personalDetailsSchema.safeParse(methods.getValues());
      const issue = result.success ? undefined : result.error.issues.find((i) => i.path[0] === name);
      if (issue) {
        methods.setError(name as any, { type: "manual", message: issue.message });
      } else {
        methods.clearErrors(name as any);
      }
    });
    return () => sub.unsubscribe();
  }, [methods]);

  const traineeId = methods.watch("traineeId");
  const fetchedForRef = useRef<string>("");

  const traineePersonalDetailApiCall = async (id: string) => {
    const param = { traineeId: id };
    const response: any = await postData("trainee/personaldetail/get", param, apiHeader(false, 0));

    if (String(response?.status) === "200" && String(response.data?.status) === "200") {
      const data = response.data.data || {};
      methods.reset({
        ...methods.getValues(),
        traineeId: String(data.traineeId ?? id),
        prefix: data.prefix || "Mr.",
        firstName: data.firstName || "",
        middleName: data.middleName || "",
        lastName: data.lastName || "",
        gender: data.gender || "",
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        email: data.email || "",
        mobile1: data.mobileNumber || "",
        mobile2: data.mobileNumber2 || "",
        userName: data.username || "",
        password: "",
        confirmPassword: "",
      });
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    if (traineeId && fetchedForRef.current !== traineeId) {
      fetchedForRef.current = traineeId;
      traineePersonalDetailApiCall(traineeId);
    }
  }, [traineeId]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      submittedRef.current = true;
      const values = methods.getValues();
      const result = personalDetailsSchema.safeParse(values);
      if (!result.success) {
        methods.clearErrors();
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof RegisterFormData;
          if (field) methods.setError(field as any, { type: "manual", message: issue.message });
        });
        return false;
      }

      const v = result.data;
      const param = new FormData();
      if (values.traineeId) param.append("traineeId", values.traineeId);
      param.append("prefix", v.prefix);
      param.append("firstName", v.firstName);
      param.append("middleName", v.middleName ?? "");
      param.append("lastName", v.lastName);
      param.append("gender", v.gender);
      param.append("birthDate", format(v.birthDate, "yyyy-MM-dd"));
      param.append("email", v.email);
      param.append("mobileNumber", v.mobile1);
      param.append("username", v.userName);
      param.append("password", v.password);

      const response: any = await postData("trainee/personaldetail/save", param, apiHeader(true, 0));

      console.log("useImperativeHandle+++++++++",response);
      
      if (String(response?.status) === "200" && String(response.data?.status) === "200") {
        const data = response.data.data;
        if (data?.traineeId) methods.setValue("traineeId", String(data.traineeId));
        toastsuccessmsg(response.data.message);
        onSaved?.();
        return true;
      }
      toasterrormsg(response?.data?.message || "Something went wrong");
      return false;
    },
  }), [methods, onSaved]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>First Name <span className="text-primary">*</span></label>
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
                    <span className={field.value ? "text-foreground" : "text-foreground/40"}>
                      {field.value || "--"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform ${prefixOpen ? "rotate-180" : ""}`} />
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
              placeholder="Ex. Mahendrasingh"
              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/20 outline-none rounded-r-[11px]"
            />
          </div>
          {(errors.prefix || errors.firstName) && (
            <p className={errorClass}>{(errors.prefix?.message || errors.firstName?.message) as string}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Middle Name <span className="text-primary">*</span></label>
          <div className="relative">
            <div className={iconClass}><User className="w-4 h-4" /></div>
            <input {...register("middleName")} placeholder="Ex. Pansingh" className={inputClass} />
          </div>
          {errors.middleName && <p className={errorClass}>{errors.middleName.message as string}</p>}
        </div>
        <div>
          <label className={labelClass}>Last Name <span className="text-primary">*</span></label>
          <div className="relative">
            <div className={iconClass}><User className="w-4 h-4" /></div>
            <input {...register("lastName")} placeholder="Ex. Dhoni" className={inputClass} />
          </div>
          {errors.lastName && <p className={errorClass}>{errors.lastName.message as string}</p>}
        </div>
        <div>
          <label className={labelClass}>Gender <span className="text-primary">*</span></label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={genderOptions}
                placeholder="Select Gender"
                styles={selectStyles}
                value={genderOptions.find(o => o.value === field.value) || null}
                onChange={(opt:any) => field.onChange(opt?.value)}
              />
            )}
          />
          {errors.gender && <p className={errorClass}>{errors.gender.message as string}</p>}
        </div>
        <div>
          <label className={labelClass}>Birth Date <span className="text-primary">*</span></label>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={(val) => field.onChange(val)}
                format="dd-MM-yyyy"
                maxDate={moment().subtract(12, "years").toDate()}
                dayPlaceholder="dd"
                monthPlaceholder="mm"
                yearPlaceholder="yyyy"
                clearIcon={null}
                className="react-date-picker--custom"
              />
            )}
          />
          {errors.birthDate && <p className={errorClass}>{errors.birthDate.message as string}</p>}
        </div>
        <div>
          <label className={labelClass}>Email <span className="text-primary">*</span></label>
          <div className="relative">
            <div className={iconClass}><Mail className="w-4 h-4" /></div>
            <input {...register("email")} placeholder="Ex. dhoni@gmail.com" type="email" className={inputClass} />
          </div>
          {errors.email && <p className={errorClass}>{errors.email.message as string}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Mobile Number 1 <span className="text-primary">*</span></label>
          <Controller
            name="mobile1"
            control={control}
            render={({ field }) => (
              <PhoneInput
                country="in"
                onlyCountries={["in"]}
                disableDropdown
                disableCountryCode
                value={field.value}
                onChange={(v) => field.onChange(v)}
                placeholder="Ex. 98765 43210"
                containerClass={phoneInputContainerClass}
                inputProps={{ name: field.name }}
              />
            )}
          />
          {errors.mobile1 && <p className={errorClass}>{errors.mobile1.message as string}</p>}
        </div>
        <div>
          <label className={labelClass}>Mobile Number 2</label>
          <Controller
            name="mobile2"
            control={control}
            render={({ field }) => (
              <PhoneInput
                country="in"
                onlyCountries={["in"]}
                disableDropdown
                disableCountryCode
                value={field.value}
                onChange={(v) => field.onChange(v)}
                placeholder="Ex. 98765 43210"
                containerClass={phoneInputContainerClass}
                inputProps={{ name: field.name }}
              />
            )}
          />
          {errors.mobile2 && <p className={errorClass}>{errors.mobile2.message as string}</p>}
        </div>
      </div>

      {/* Credential */}
      <div className="border-t border-foreground/[0.08] pt-5 mt-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Credential</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Username <span className="text-primary">*</span></label>
            <div className="relative">
              <div className={iconClass}><User className="w-4 h-4" /></div>
              <input {...register("userName")} placeholder="Ex. mahidhoni7" className={inputClass} />
            </div>
            {errors.userName && <p className={errorClass}>{errors.userName.message as string}</p>}
          </div>
          <div>
            <label className={labelClass}>Password <span className="text-primary">*</span></label>
            <div className="relative">
              <div className={iconClass}><Lock className="w-4 h-4" /></div>
              <input {...register("password")} placeholder="Ex. ••••••••" type={showPassword ? "text" : "password"} className={`${inputClass} !pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/55 transition-colors p-1">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className={errorClass}>{errors.password.message as string}</p>}
          </div>
          <div>
            <label className={labelClass}>Confirm Password <span className="text-primary">*</span></label>
            <div className="relative">
              <div className={iconClass}><Shield className="w-4 h-4" /></div>
              <input {...register("confirmPassword")} placeholder="Ex. ••••••••" type={showConfirmPassword ? "text" : "password"} className={`${inputClass} !pr-10`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/55 transition-colors p-1">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message as string}</p>}
          </div>
        </div>
      </div>
    </div>
  );
});

PersonalDetails.displayName = "PersonalDetails";

export default PersonalDetails;
