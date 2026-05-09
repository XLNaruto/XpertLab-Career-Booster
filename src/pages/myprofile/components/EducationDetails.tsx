import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import Select from "react-select";
import DatePicker from "react-date-picker";
import { FileUploader } from "react-drag-drop-files";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { GraduationCap, BookOpen, Upload, CheckCircle, X } from "lucide-react";
import { selectStyles, inputClass, labelClass, errorClass, iconClass } from "./styles";
import type { ProfileFormData } from "./types";

const fileTypes = ["JPG", "PNG", "PDF"];

const educationTypeOptions = [
  { value: "School", label: "School" },
  { value: "College", label: "College" },
  { value: "University", label: "University" },
];

const boardOptions = [
  { value: "CBSE", label: "CBSE" },
  { value: "GSEB", label: "GSEB" },
  { value: "ICSE", label: "ICSE" },
];

const instituteOptions = [
  { value: "Institute A", label: "Institute A" },
  { value: "Institute B", label: "Institute B" },
];

const EducationDetails = () => {
  const { register, control, formState: { errors } } = useFormContext<ProfileFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "educations" });

  return (
    <div className="space-y-5">
      {fields.map((field, idx) => (
        <div key={field.id} className="bg-white/[0.4] border border-foreground/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Education {idx + 1}</h3>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(idx)} className="text-xs text-primary font-semibold hover:opacity-70">Remove</button>
            )}
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Education Type <span className="text-primary">*</span></label>
                <Controller
                  name={`educations.${idx}.educationType`}
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={educationTypeOptions}
                      placeholder="Select Education Type"
                      styles={selectStyles}
                      value={educationTypeOptions.find(o => o.value === field.value) || null}
                      onChange={(opt: any) => field.onChange(opt?.value)}
                    />
                  )}
                />
                {errors.educations?.[idx]?.educationType && <p className={errorClass}>{errors.educations[idx].educationType?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Education <span className="text-primary">*</span></label>
                <div className="relative">
                  <div className={iconClass}><GraduationCap className="w-4 h-4" /></div>
                  <input {...register(`educations.${idx}.education`, { required: "Required" })} placeholder="Education" className={inputClass} />
                </div>
                {errors.educations?.[idx]?.education && <p className={errorClass}>{errors.educations[idx].education?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Board / University <span className="text-primary">*</span></label>
                <Controller
                  name={`educations.${idx}.board`}
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={boardOptions}
                      placeholder="Select"
                      styles={selectStyles}
                      value={boardOptions.find(o => o.value === field.value) || null}
                      onChange={(opt: any) => field.onChange(opt?.value)}
                    />
                  )}
                />
                {errors.educations?.[idx]?.board && <p className={errorClass}>{errors.educations[idx].board?.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Institute <span className="text-primary">*</span></label>
                <Controller
                  name={`educations.${idx}.institute`}
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={instituteOptions}
                      placeholder="Select Institute"
                      styles={selectStyles}
                      value={instituteOptions.find(o => o.value === field.value) || null}
                      onChange={(opt: any) => field.onChange(opt?.value)}
                    />
                  )}
                />
                {errors.educations?.[idx]?.institute && <p className={errorClass}>{errors.educations[idx].institute?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Passing Year <span className="text-primary">*</span></label>
                <Controller
                  name={`educations.${idx}.passingYear`}
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      format="MM-yyyy"
                      maxDetail="year"
                      monthPlaceholder="mm"
                      yearPlaceholder="yyyy"
                      clearIcon={null}
                      className="react-date-picker--custom"
                    />
                  )}
                />
                {errors.educations?.[idx]?.passingYear && <p className={errorClass}>{errors.educations[idx].passingYear?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Academic Year <span className="text-primary">*</span></label>
                <Controller
                  name={`educations.${idx}.academicYear`}
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      format="MM-yyyy"
                      maxDetail="year"
                      monthPlaceholder="mm"
                      yearPlaceholder="yyyy"
                      clearIcon={null}
                      className="react-date-picker--custom"
                    />
                  )}
                />
                {errors.educations?.[idx]?.academicYear && <p className={errorClass}>{errors.educations[idx].academicYear?.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-end">
              <div>
                <label className={labelClass}>Percentage (%) <span className="text-primary">*</span></label>
                <div className="relative">
                  <div className={iconClass}><BookOpen className="w-4 h-4" /></div>
                  <input {...register(`educations.${idx}.percentage`, { required: "Required" })} placeholder="Percentage (%)" className={inputClass} />
                </div>
                {errors.educations?.[idx]?.percentage && <p className={errorClass}>{errors.educations[idx].percentage?.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Education Completed</label>
                <Controller
                  name={`educations.${idx}.educationCompleted`}
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative w-11 h-6 rounded-full transition-colors" style={{ backgroundColor: field.value ? 'hsl(342 80% 53%)' : 'hsl(var(--foreground) / 0.1)' }}>
                        <input type="checkbox" className="peer sr-only" checked={field.value} onChange={field.onChange} />
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${field.value ? "translate-x-5" : ""}`} />
                      </div>
                      <span className="text-sm text-muted-foreground">{field.value ? "Yes" : "No"}</span>
                    </label>
                  )}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Document <span className="text-primary">*</span></label>
              <Controller
                name={`educations.${idx}.educationDocument`}
                control={control}
                rules={{ required: "Document is required" }}
                render={({ field }) => (
                  <FileUploader
                    handleChange={(file: File) => field.onChange(file)}
                    name={`educationDocument-${idx}`}
                    types={fileTypes}
                    dropMessageStyle={{ display: "none" }}
                    hoverTitle=" "
                  >
                    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      field.value
                        ? "border-green-400/40 bg-green-50/30"
                        : "border-foreground/[0.1] hover:border-primary/30 hover:bg-primary/[0.02]"
                    }`}>
                      {field.value ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div className="text-[13px] font-semibold text-foreground/70 text-center truncate max-w-full px-2">
                            {field.value.name}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); field.onChange(null); }}
                            className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-foreground/20" />
                          <div className="text-[13px] font-semibold text-foreground/50">Upload Document</div>
                          <div className="text-[11px] text-muted-foreground">Drag & Drop or choose files</div>
                        </>
                      )}
                    </div>
                  </FileUploader>
                )}
              />
              {errors.educations?.[idx]?.educationDocument && <p className={errorClass}>{errors.educations[idx].educationDocument?.message}</p>}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ educationType: "", education: "", board: "", institute: "", passingYear: null, academicYear: null, percentage: "", educationCompleted: true, educationDocument: null })}
        className="text-sm font-semibold text-primary hover:opacity-70 transition-opacity"
      >
        + Add More
      </button>
    </div>
  );
};

export default EducationDetails;
