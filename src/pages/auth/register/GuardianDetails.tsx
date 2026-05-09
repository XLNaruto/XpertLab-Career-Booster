import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import Select from "react-select";
import { User, Users, Phone } from "lucide-react";
import { selectStyles, inputClass, labelClass, errorClass, iconClass } from "./styles";
import type { RegisterFormData } from "./types";

const guardianTypeOptions = [
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Guardian", label: "Guardian" },
];

const GuardianDetails = () => {
  const { register, control, formState: { errors } } = useFormContext<RegisterFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "guardians" });

  return (
    <div className="space-y-5">
      {fields.map((field, idx) => (
        <div key={field.id} className="bg-white/[0.4] border border-foreground/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Guardian {idx + 1}</h3>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(idx)} className="text-xs text-primary font-semibold hover:opacity-70">Remove</button>
            )}
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Guardian Type <span className="text-primary">*</span></label>
                <Controller
                  name={`guardians.${idx}.type`}
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={guardianTypeOptions}
                      placeholder="Select"
                      styles={selectStyles}
                      value={guardianTypeOptions.find(o => o.value === field.value) || null}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
                {errors.guardians?.[idx]?.type && <p className={errorClass}>{errors.guardians[idx].type?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Relation <span className="text-primary">*</span></label>
                <div className="relative">
                  <div className={iconClass}><Users className="w-4 h-4" /></div>
                  <input {...register(`guardians.${idx}.relation`, { required: "Required" })} placeholder="Relation" className={inputClass} />
                </div>
                {errors.guardians?.[idx]?.relation && <p className={errorClass}>{errors.guardians[idx].relation?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>First Name <span className="text-primary">*</span></label>
                <div className="relative">
                  <div className={iconClass}><User className="w-4 h-4" /></div>
                  <input {...register(`guardians.${idx}.firstName`, { required: "Required" })} placeholder="First Name" className={inputClass} />
                </div>
                {errors.guardians?.[idx]?.firstName && <p className={errorClass}>{errors.guardians[idx].firstName?.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Last Name <span className="text-primary">*</span></label>
                <div className="relative">
                  <div className={iconClass}><User className="w-4 h-4" /></div>
                  <input {...register(`guardians.${idx}.lastName`, { required: "Required" })} placeholder="Last Name" className={inputClass} />
                </div>
                {errors.guardians?.[idx]?.lastName && <p className={errorClass}>{errors.guardians[idx].lastName?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Mobile Number 1 <span className="text-primary">*</span></label>
                <div className="relative">
                  <div className={iconClass}><Phone className="w-4 h-4" /></div>
                  <input {...register(`guardians.${idx}.mobile1`, { required: "Required" })} placeholder="91 98765-43210" type="tel" className={inputClass} />
                </div>
                {errors.guardians?.[idx]?.mobile1 && <p className={errorClass}>{errors.guardians[idx].mobile1?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Mobile Number 2</label>
                <div className="relative">
                  <div className={iconClass}><Phone className="w-4 h-4" /></div>
                  <input {...register(`guardians.${idx}.mobile2`)} placeholder="91 98765-43210" type="tel" className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => append({ type: "", relation: "", firstName: "", lastName: "", mobile1: "", mobile2: "" })} className="text-sm font-semibold text-primary hover:opacity-70 transition-opacity">
        + Add More
      </button>
    </div>
  );
};

export default GuardianDetails;
