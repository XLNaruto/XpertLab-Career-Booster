import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import Select from "react-select";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { User, Users } from "lucide-react";
import { selectStyles, inputClass, labelClass, errorClass, iconClass } from "./styles";
import { guardianDetailsSchema } from "./schemas";
import type { RegisterFormData } from "./types";
import type { StepHandle } from "./PersonalDetails";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";

type Option = { value: string; label: string };

type GuardianDetailsProps = {
  onSaved?: () => void;
};

const phoneInputContainerClass = "phone-input--custom";

const GuardianDetails = forwardRef<StepHandle, GuardianDetailsProps>(({ onSaved }, ref) => {
  const methods = useFormContext<RegisterFormData>();
  const { register, control, formState: { errors }, watch } = methods;
  const { fields, append, remove, replace } = useFieldArray({ control, name: "guardians" });

  const submittedRef = useRef(false);
  const fetchedForRef = useRef<string>("");

  const [guardianTypeList] = useState<Option[]>([
    { label: "Family", value: "FAMILY" },
    { label: "Other", value: "OTHER" },
  ]);
  const [relationList, setRelationList] = useState<Option[]>([]);

  const traineeId = methods.watch("traineeId");
  const guardiansWatch = watch("guardians");

  const relationListApiCall = async () => {
    var response: any = await postData("trainee/guardiandetail/relationList", {}, apiHeader(false, 0));

    if (
      String(response?.status) == "200" &&
      String(response.data?.status) == "200"
    ) {
      var data = response.data.data;
      var opt: any = [];
      (data?.FAMILY ?? []).map((val: any) => {
        opt.push({ value: val.value, label: val.label });
      });
      setRelationList(opt);
    } else {
      toasterrormsg(response.data.message);
    }
  };

  useEffect(() => {
    relationListApiCall();
  }, []);

  const guardianListApiCall = async (id: string) => {
    const param = { traineeId: id };
    var response: any = await postData("trainee/guardiandetail/list", param, apiHeader(false, 0));

    if (
      String(response?.status) == "200" &&
      String(response.data?.status) == "200"
    ) {
      var data = response.data?.data;
      const list: any[] = data ?? [];
      if (list.length) {
        replace(
          list.map((g: any) => ({
            traineeguardiandetailId: String(g.traineeguardiandetailId ?? ""),
            guardianType: g.guardianType ?? "",
            relation: g.relation ?? "",
            firstName: g.firstName ?? "",
            lastName: g.lastName ?? "",
            mobileNumber: g.mobileNumber ?? "",
            mobileNumber2: g.mobileNumber2 ?? "",
          })),
        );
      }
    } else {
      toasterrormsg(response.data.message);
    }
  };

  useEffect(() => {
    if (traineeId && fetchedForRef.current !== traineeId) {
      fetchedForRef.current = traineeId;
      guardianListApiCall(traineeId);
    }
  }, [traineeId]);

  // revalidate on change after first submit
  useEffect(() => {
    const sub = methods.watch((_v, { name }) => {
      if (!name || !submittedRef.current) return;
      if (!name.startsWith("guardians")) return;
      const result = guardianDetailsSchema.safeParse({ guardians: methods.getValues("guardians") });
      const issue = result.success ? undefined : result.error.issues.find((i) => i.path.join(".") === name);
      if (issue) {
        methods.setError(name as any, { type: "manual", message: issue.message });
      } else {
        methods.clearErrors(name as any);
      }
    });
    return () => sub.unsubscribe();
  }, [methods]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      submittedRef.current = true;
      const guardians = methods.getValues("guardians");
      const result = guardianDetailsSchema.safeParse({ guardians });
      if (!result.success) {
        methods.clearErrors();
        result.error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          methods.setError(path as any, { type: "manual", message: issue.message });
        });
        return false;
      }

      const payload = {
        guardian: result.data.guardians.map((g) => ({
          traineeId: methods.getValues("traineeId"),
          traineeguardiandetailId: g.traineeguardiandetailId || undefined,
          guardianType: g.guardianType,
          relation: g.relation,
          firstName: g.firstName,
          lastName: g.lastName,
          mobileNumber: g.mobileNumber,
          mobileNumber2: g.mobileNumber2,
        })),
      };

      var response: any = await postData("trainee/guardiandetail/save", payload, apiHeader(false, 0));

      if (
        String(response?.status) == "200" &&
        String(response.data?.status) == "200"
      ) {
        toastsuccessmsg(response.data.message);
        onSaved?.();
        return true;
      }
      toasterrormsg(response?.data?.message || "Something went wrong");
      return false;
    },
  }), [methods, onSaved]);

  return (
    <div className="space-y-5">
      {fields.map((field, idx) => {
        const currentType = guardiansWatch?.[idx]?.guardianType;
        const isFamily = currentType === "FAMILY";
        const guardianErrors = (errors.guardians as any)?.[idx];
        return (
          <div key={field.id} className="bg-white/[0.4] border border-foreground/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Guardian {idx + 1}</h3>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(idx)} className="text-xs text-primary font-semibold hover:opacity-70">Remove</button>
              )}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Guardian Type <span className="text-primary">*</span></label>
                  <Controller
                    name={`guardians.${idx}.guardianType`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={guardianTypeList}
                        placeholder="Select"
                        styles={selectStyles}
                        value={guardianTypeList.find(o => o.value === field.value) || null}
                        onChange={(opt: any) => {
                          field.onChange(opt?.value || "");
                          methods.setValue(`guardians.${idx}.relation`, "");
                        }}
                      />
                    )}
                  />
                  {guardianErrors?.guardianType && (
                    <p className={errorClass}>{guardianErrors.guardianType.message as string}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{isFamily ? "Relation" : "Position"} <span className="text-primary">*</span></label>
                  {isFamily ? (
                    <Controller
                      name={`guardians.${idx}.relation`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={relationList}
                          placeholder="Select Relation"
                          styles={selectStyles}
                          value={relationList.find(o => o.value === field.value) || null}
                          onChange={(opt: any) => field.onChange(opt?.value || "")}
                        />
                      )}
                    />
                  ) : (
                    <div className="relative">
                      <div className={iconClass}><Users className="w-4 h-4" /></div>
                      <input
                        {...register(`guardians.${idx}.relation`)}
                        placeholder="Enter Position"
                        className={inputClass}
                        disabled={!currentType}
                      />
                    </div>
                  )}
                  {guardianErrors?.relation && (
                    <p className={errorClass}>{guardianErrors.relation.message as string}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name <span className="text-primary">*</span></label>
                  <div className="relative">
                    <div className={iconClass}><User className="w-4 h-4" /></div>
                    <input {...register(`guardians.${idx}.firstName`)} placeholder="First Name" className={inputClass} />
                  </div>
                  {guardianErrors?.firstName && (
                    <p className={errorClass}>{guardianErrors.firstName.message as string}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Last Name <span className="text-primary">*</span></label>
                  <div className="relative">
                    <div className={iconClass}><User className="w-4 h-4" /></div>
                    <input {...register(`guardians.${idx}.lastName`)} placeholder="Last Name" className={inputClass} />
                  </div>
                  {guardianErrors?.lastName && (
                    <p className={errorClass}>{guardianErrors.lastName.message as string}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Mobile Number 1 <span className="text-primary">*</span></label>
                  <Controller
                    name={`guardians.${idx}.mobileNumber`}
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        country="in"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        enableSearch
                        disableCountryCode
                        placeholder="98765 43210"
                        containerClass={phoneInputContainerClass}
                        inputProps={{ name: field.name }}
                      />
                    )}
                  />
                  {guardianErrors?.mobileNumber && (
                    <p className={errorClass}>{guardianErrors.mobileNumber.message as string}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Mobile Number 2</label>
                  <Controller
                    name={`guardians.${idx}.mobileNumber2`}
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        country="in"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        enableSearch
                        disableCountryCode
                        placeholder="98765 43210"
                        containerClass={phoneInputContainerClass}
                        inputProps={{ name: field.name }}
                      />
                    )}
                  />
                  {guardianErrors?.mobileNumber2 && (
                    <p className={errorClass}>{guardianErrors.mobileNumber2.message as string}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => append({ traineeguardiandetailId: "", guardianType: "", relation: "", firstName: "", lastName: "", mobileNumber: "", mobileNumber2: "" })}
        className="text-sm font-semibold text-primary hover:opacity-70 transition-opacity"
      >
        + Add More
      </button>
    </div>
  );
});

GuardianDetails.displayName = "GuardianDetails";

export default GuardianDetails;
