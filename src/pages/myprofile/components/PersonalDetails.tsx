import { useRef, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { User, Mail, Lock, Phone, Shield, Eye, EyeOff, Camera, X } from "lucide-react";
import { selectStyles, inputClass, labelClass, errorClass, iconClass } from "./styles";
import type { ProfileFormData } from "./types";

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const PersonalDetails = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, control, formState: { errors } } = useFormContext<ProfileFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* Profile Photo */}
      <div className="mb-2">
        <label className={labelClass}>Profile</label>
        <Controller
          name="profilePhoto"
          control={control}
          render={({ field }) => {
            const preview = field.value ? URL.createObjectURL(field.value) : null;
            return (
              <div className="relative w-24 h-24 group">
                <div
                  className="w-24 h-24 rounded-full bg-foreground/[0.06] border-2 border-foreground/[0.1] flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {preview ? (
                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-foreground/20" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => field.onChange(e.target.files?.[0] || null)}
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
          <label className={labelClass}>First Name <span className="text-primary">*</span></label>
          <div className="relative">
            <div className={iconClass}><User className="w-4 h-4" /></div>
            <input {...register("firstName", { required: "First name is required" })} placeholder="First Name" className={inputClass} />
          </div>
          {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Middle Name</label>
          <div className="relative">
            <div className={iconClass}><User className="w-4 h-4" /></div>
            <input {...register("middleName")} placeholder="Middle Name" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Last Name <span className="text-primary">*</span></label>
          <div className="relative">
            <div className={iconClass}><User className="w-4 h-4" /></div>
            <input {...register("lastName", { required: "Last name is required" })} placeholder="Last Name" className={inputClass} />
          </div>
          {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Gender <span className="text-primary">*</span></label>
          <Controller
            name="gender"
            control={control}
            rules={{ required: "Gender is required" }}
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
          {errors.gender && <p className={errorClass}>{errors.gender.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Birth Date <span className="text-primary">*</span></label>
          <Controller
            name="birthDate"
            control={control}
            rules={{ required: "Birth date is required" }}
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
          {errors.birthDate && <p className={errorClass}>{errors.birthDate.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Email <span className="text-primary">*</span></label>
          <div className="relative">
            <div className={iconClass}><Mail className="w-4 h-4" /></div>
            <input {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} placeholder="Ex: dhoni@gmail.com" type="email" className={inputClass} />
          </div>
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Mobile Number 1 <span className="text-primary">*</span></label>
          <div className="relative">
            <div className={iconClass}><Phone className="w-4 h-4" /></div>
            <input {...register("mobile1", { required: "Mobile number is required" })} placeholder="91 98765-43210" type="tel" className={inputClass} />
          </div>
          {errors.mobile1 && <p className={errorClass}>{errors.mobile1.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Mobile Number 2</label>
          <div className="relative">
            <div className={iconClass}><Phone className="w-4 h-4" /></div>
            <input {...register("mobile2")} placeholder="91 98765-43210" type="tel" className={inputClass} />
          </div>
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
              <input {...register("userName", { required: "Username is required" })} placeholder="Username" className={inputClass} />
            </div>
            {errors.userName && <p className={errorClass}>{errors.userName.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Password <span className="text-primary">*</span></label>
            <div className="relative">
              <div className={iconClass}><Lock className="w-4 h-4" /></div>
              <input {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })} placeholder="Password" type={showPassword ? "text" : "password"} className={`${inputClass} !pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/55 transition-colors p-1">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Confirm Password <span className="text-primary">*</span></label>
            <div className="relative">
              <div className={iconClass}><Shield className="w-4 h-4" /></div>
              <input {...register("confirmPassword", { required: "Confirm password is required" })} placeholder="Confirm Password" type={showConfirmPassword ? "text" : "password"} className={`${inputClass} !pr-10`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground/55 transition-colors p-1">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
