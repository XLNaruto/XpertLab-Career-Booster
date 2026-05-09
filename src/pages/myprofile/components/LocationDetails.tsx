import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";
import { selectStyles, labelClass, errorClass } from "./styles";
import type { ProfileFormData } from "./types";

const stateOptions = [
  { value: "Gujarat", label: "Gujarat" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Delhi", label: "Delhi" },
];

const cityOptions = [
  { value: "Ahmedabad", label: "Ahmedabad" },
  { value: "Surat", label: "Surat" },
  { value: "Vadodara", label: "Vadodara" },
  { value: "Rajkot", label: "Rajkot" },
];

const LocationDetails = () => {
  const { register, control, formState: { errors } } = useFormContext<ProfileFormData>();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>State <span className="text-primary">*</span></label>
          <Controller
            name="state"
            control={control}
            rules={{ required: "State is required" }}
            render={({ field }) => (
              <Select
                {...field}
                options={stateOptions}
                placeholder="Select State"
                styles={selectStyles}
                value={stateOptions.find(o => o.value === field.value) || null}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
          {errors.state && <p className={errorClass}>{errors.state.message}</p>}
        </div>
        <div>
          <label className={labelClass}>City <span className="text-primary">*</span></label>
          <Controller
            name="city"
            control={control}
            rules={{ required: "City is required" }}
            render={({ field }) => (
              <Select
                {...field}
                options={cityOptions}
                placeholder="Select City"
                styles={selectStyles}
                value={cityOptions.find(o => o.value === field.value) || null}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>
      </div>
      <div>
        <label className={labelClass}>Address <span className="text-primary">*</span></label>
        <textarea
          {...register("address", { required: "Address is required" })}
          placeholder="Enter your full address"
          rows={4}
          className="w-full py-3 px-4 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200 resize-none"
        />
        {errors.address && <p className={errorClass}>{errors.address.message}</p>}
      </div>
    </div>
  );
};

export default LocationDetails;
