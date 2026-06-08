import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";
import { selectStyles, labelClass, errorClass } from "./styles";
import type { ProfileFormData } from "./types";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";

export type LocationDetailsHandle = {
  save: () => Promise<boolean>;
};

type LocationDetailsProps = {
  onSaved?: () => void;
};

type Option = { value: string; label: string };

const locationFields: Array<keyof ProfileFormData> = ["stateId", "cityId", "address"];

const LocationDetails = forwardRef<LocationDetailsHandle, LocationDetailsProps>(
  ({ onSaved }, ref) => {
    const methods = useFormContext<ProfileFormData>();
    const { register, control, formState: { errors } } = methods;

    const [stateList, setStateList] = useState<Option[]>([]);
    const [cityList, setCityList] = useState<Option[]>([]);
    const lastStateRef = useRef<string>("");

    const stateValue = methods.watch("stateId");

    const stateListApiCall = async () => {
      const response: any = await postData("master/state/list", {}, apiHeader(false, 2));
      if (String(response?.status) === "200" && String(response.data?.status) === "200") {
        const opt: Option[] = (response.data.data?.list || []).map((val: any) => ({
          value: String(val.stateId),
          label: val.name,
        }));
        setStateList(opt);
      } else {
        toasterrormsg(response?.data?.message || "Failed to load states");
      }
    };

    const cityListApiCall = async (stateId: string) => {
      if (!stateId) {
        setCityList([]);
        return;
      }
      const response: any = await postData(
        "master/city/list",
        { stateId },
        apiHeader(false, 2)
      );
      if (String(response?.status) === "200" && String(response.data?.status) === "200") {
        const opt: Option[] = (response.data.data?.list || []).map((val: any) => ({
          value: String(val.cityId),
          label: val.name,
        }));
        setCityList(opt);
      } else {
        toasterrormsg(response?.data?.message || "Failed to load cities");
      }
    };

    useEffect(() => {
      stateListApiCall();
    }, []);

    useEffect(() => {
      if (stateValue && stateValue !== lastStateRef.current) {
        lastStateRef.current = stateValue;
        cityListApiCall(stateValue);
      } else if (!stateValue) {
        setCityList([]);
      }
    }, [stateValue]);

    useImperativeHandle(ref, () => ({
      save: async () => {
        const valid = await methods.trigger(locationFields);
        if (!valid) return false;

        const v = methods.getValues();
        
        const payload = {
          stateId: v.stateId,
          cityId: v.cityId,
          address: v.address,
        };

        const response: any = await postData(
          "private/trainee/personaldetail/saveLocation",
          payload,
          apiHeader(false, 2)
        );

        if (String(response?.status) === "200" && String(response.data?.status) === "200") {
          toastsuccessmsg(response.data.message || "Location saved");
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
            <label className={labelClass}>State <span className="text-primary">*</span></label>
            <Controller
              name="stateId"
              control={control}
              rules={{ required: "State is required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={stateList}
                  placeholder="Select State"
                  styles={selectStyles}
                  value={stateList.find((o) => o.value == field.value) || null}
                  onChange={(opt: any) => {
                    field.onChange(opt?.value || "");
                    methods.setValue("cityId", "");
                  }}
                />
              )}
            />
            {errors.stateId && <p className={errorClass}>{errors.stateId.message}</p>}
          </div>
          <div>
            <label className={labelClass}>City <span className="text-primary">*</span></label>
            <Controller
              name="cityId"
              control={control}
              rules={{ required: "City is required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={cityList}
                  placeholder="Select City"
                  styles={selectStyles}
                  isDisabled={!stateValue}
                  value={cityList.find((o) => o.value == field.value) || null}
                  onChange={(opt: any) => field.onChange(opt?.value || "")}
                />
              )}
            />
            {errors.cityId && <p className={errorClass}>{errors.cityId.message}</p>}
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
  }
);

LocationDetails.displayName = "LocationDetails";

export default LocationDetails;
