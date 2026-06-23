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

const locationFields: Array<keyof ProfileFormData> = [
  "stateId",
  "cityId",
  "address",
  "permanentStateId",
  "permanentCityId",
  "permanentAddress",
];

const LocationDetails = forwardRef<LocationDetailsHandle, LocationDetailsProps>(
  ({ onSaved }, ref) => {
    const methods = useFormContext<ProfileFormData>();
    const { register, control, formState: { errors } } = methods;

    const [stateList, setStateList] = useState<Option[]>([]);
    const [cityList, setCityList] = useState<Option[]>([]);
    const [permanentCityList, setPermanentCityList] = useState<Option[]>([]);
    // Whether permanent address mirrors the current address.
    const [sameAsCurrent, setSameAsCurrent] = useState(false);
    const lastStateRef = useRef<string>("");
    const lastPermanentStateRef = useRef<string>("");
    const initializedRef = useRef(false);

    const stateValue = methods.watch("stateId");
    const cityValue = methods.watch("cityId");
    const addressValue = methods.watch("address");
    const permanentStateValue = methods.watch("permanentStateId");

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

    // Load cities for a given state. `setList` lets us reuse this for both the
    // current and permanent city dropdowns.
    const cityListApiCall = async (
      stateId: string,
      setList: (opt: Option[]) => void,
    ) => {
      if (!stateId) {
        setList([]);
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
        setList(opt);
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
        cityListApiCall(stateValue, setCityList);
      } else if (!stateValue) {
        setCityList([]);
      }
    }, [stateValue]);

    useEffect(() => {
      if (permanentStateValue && permanentStateValue !== lastPermanentStateRef.current) {
        lastPermanentStateRef.current = permanentStateValue;
        cityListApiCall(permanentStateValue, setPermanentCityList);
      } else if (!permanentStateValue) {
        setPermanentCityList([]);
      }
    }, [permanentStateValue]);

    // Once the form has values loaded, pre-tick the box if the saved permanent
    // address already matches the current address.
    useEffect(() => {
      if (initializedRef.current) return;
      if (!stateValue && !permanentStateValue) return;
      initializedRef.current = true;
      if (
        permanentStateValue &&
        permanentStateValue === stateValue &&
        methods.getValues("permanentCityId") === cityValue &&
        methods.getValues("permanentAddress") === addressValue
      ) {
        setSameAsCurrent(true);
      }
    }, [stateValue, permanentStateValue, cityValue, addressValue, methods]);

    // While "same as current" is ticked, keep the permanent address mirroring
    // the current address as the trainee edits it.
    useEffect(() => {
      if (!sameAsCurrent) return;
      methods.setValue("permanentStateId", stateValue || "");
      methods.setValue("permanentCityId", cityValue || "");
      methods.setValue("permanentAddress", addressValue || "");
      methods.clearErrors(["permanentStateId", "permanentCityId", "permanentAddress"]);
    }, [sameAsCurrent, stateValue, cityValue, addressValue, methods]);

    const handleSameAsCurrent = (checked: boolean) => {
      setSameAsCurrent(checked);
      if (checked) {
        methods.setValue("permanentStateId", stateValue || "");
        methods.setValue("permanentCityId", cityValue || "");
        methods.setValue("permanentAddress", addressValue || "");
        methods.clearErrors(["permanentStateId", "permanentCityId", "permanentAddress"]);
      }
    };

    useImperativeHandle(ref, () => ({
      save: async () => {
        const valid = await methods.trigger(locationFields);
        if (!valid) return false;

        const v = methods.getValues();

        const payload = {
          stateId: v.stateId,
          cityId: v.cityId,
          address: v.address,
          permanentStateId: v.permanentStateId,
          permanentCityId: v.permanentCityId,
          permanentAddress: v.permanentAddress,
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
      <div className="space-y-6">
        {/* CURRENT ADDRESS */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Current Address</h3>
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
              className="w-full py-3 px-4 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/55 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200 resize-none"
            />
            {errors.address && <p className={errorClass}>{errors.address.message}</p>}
          </div>
        </div>

        {/* PERMANENT ADDRESS */}
        <div className="space-y-4 border-t border-foreground/[0.08] pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">Permanent Address</h3>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameAsCurrent}
                onChange={(e) => handleSameAsCurrent(e.target.checked)}
                className="h-4 w-4 rounded border-foreground/30 text-primary accent-primary cursor-pointer"
              />
              Same as current address
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>State <span className="text-primary">*</span></label>
              <Controller
                name="permanentStateId"
                control={control}
                rules={{ required: "State is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={stateList}
                    placeholder="Select State"
                    styles={selectStyles}
                    isDisabled={sameAsCurrent}
                    value={stateList.find((o) => o.value == field.value) || null}
                    onChange={(opt: any) => {
                      field.onChange(opt?.value || "");
                      methods.setValue("permanentCityId", "");
                    }}
                  />
                )}
              />
              {errors.permanentStateId && <p className={errorClass}>{errors.permanentStateId.message}</p>}
            </div>
            <div>
              <label className={labelClass}>City <span className="text-primary">*</span></label>
              <Controller
                name="permanentCityId"
                control={control}
                rules={{ required: "City is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={permanentCityList}
                    placeholder="Select City"
                    styles={selectStyles}
                    isDisabled={sameAsCurrent || !permanentStateValue}
                    value={permanentCityList.find((o) => o.value == field.value) || null}
                    onChange={(opt: any) => field.onChange(opt?.value || "")}
                  />
                )}
              />
              {errors.permanentCityId && <p className={errorClass}>{errors.permanentCityId.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Address <span className="text-primary">*</span></label>
            <textarea
              {...register("permanentAddress", { required: "Address is required" })}
              disabled={sameAsCurrent}
              placeholder="Enter your full address"
              rows={4}
              className="w-full py-3 px-4 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/55 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {errors.permanentAddress && <p className={errorClass}>{errors.permanentAddress.message}</p>}
          </div>
        </div>
      </div>
    );
  }
);

LocationDetails.displayName = "LocationDetails";

export default LocationDetails;
