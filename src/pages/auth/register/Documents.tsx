import { useFormContext, Controller } from "react-hook-form";
import { FileUploader } from "react-drag-drop-files";
import { FileText, Upload, CheckCircle, X } from "lucide-react";
import { inputClass, labelClass, errorClass, iconClass } from "./styles";
import type { RegisterFormData } from "./types";

const fileTypes = ["JPG", "PNG", "PDF"];

const Documents = () => {
  const { register, control, formState: { errors } } = useFormContext<RegisterFormData>();

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Aadhar Card Number <span className="text-primary">*</span></label>
        <div className="relative">
          <div className={iconClass}><FileText className="w-4 h-4" /></div>
          <input {...register("aadharNumber", { required: "Aadhar number is required" })} placeholder="Ex: 1234 5678 9012" className={inputClass} />
        </div>
        {errors.aadharNumber && <p className={errorClass}>{errors.aadharNumber.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Documents <span className="text-primary">*</span></label>
        <div className="grid grid-cols-3 gap-3">
          {([0, 1, 2] as const).map((idx) => (
            <Controller
              key={idx}
              name={`documents.${idx}`}
              control={control}
              render={({ field }) => (
                <FileUploader
                  handleChange={(file: File) => field.onChange(file)}
                  name={`document-${idx}`}
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Documents;
