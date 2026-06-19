import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";
import { selectStyles, labelClass, errorClass } from "./styles";
import { locationDetailsSchema } from "./schemas";
import type { RegisterFormData } from "./types";
import type { StepHandle } from "./PersonalDetails";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";

type Option = { value: string; label: string };

type LocationDetailsProps = {
  onSaved?: () => void;
};

// Fields that drive validation / revalidation for this step.
const locationFields = [
  "stateId",
  "cityId",
  "address",
  "permanentStateId",
  "permanentCityId",
  "permanentAddress",
] as const;

const LocationDetails = forwardRef<StepHandle, LocationDetailsProps>(
  ({ onSaved }, ref) => {
    const methods = useFormContext<RegisterFormData>();
    const {
      register,
      control,
      formState: { errors },
    } = methods;

    const [stateList, setStateList] = useState<Option[]>([]);
    const [cityList, setCityList] = useState<Option[]>([]);
    const [permanentCityList, setPermanentCityList] = useState<Option[]>([]);
    // Whether permanent address mirrors the current address.
    const [sameAsCurrent, setSameAsCurrent] = useState(false);
    const submittedRef = useRef(false);
    const fetchedForRef = useRef<string>("");

    const traineeId = methods.watch("traineeId");
    const stateId = methods.watch("stateId");
    const cityId = methods.watch("cityId");
    const address = methods.watch("address");
    const permanentStateId = methods.watch("permanentStateId");

    const stateListApiCall = async () => {
      var response: any = await postData(
        "master/state/list",
        {},
        apiHeader(false, 2),
      );

      if (
        String(response?.status) == "200" &&
        String(response.data?.status) == "200"
      ) {
        var data = response.data.data;
        var opt: any = [];
        data.list.map((val: any) => {
          opt.push({ value: String(val.stateId), label: val.name });
        });
        setStateList(opt);
      } else {
        toasterrormsg(response.data.message);
      }
    };

    useEffect(() => {
      stateListApiCall();
    }, []);

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
      const param = {
        stateId: stateId,
      };
      var response: any = await postData(
        "master/city/list",
        param,
        apiHeader(false, 2),
      );

      if (
        String(response?.status) == "200" &&
        String(response.data?.status) == "200"
      ) {
        var data = response.data.data;
        var opt: any = [];
        data.list.map((val: any) => {
          opt.push({ value: String(val.cityId), label: val.name });
        });
        setList(opt);
      } else {
        toasterrormsg(response.data.message);
      }
    };

    useEffect(() => {
      cityListApiCall(stateId, setCityList);
    }, [stateId]);

    useEffect(() => {
      cityListApiCall(permanentStateId, setPermanentCityList);
    }, [permanentStateId]);

    // While "same as current" is ticked, keep the permanent address mirroring
    // the current address as the trainee edits it.
    useEffect(() => {
      if (!sameAsCurrent) return;
      methods.setValue("permanentStateId", stateId || "");
      methods.setValue("permanentCityId", cityId || "");
      methods.setValue("permanentAddress", address || "");
      if (submittedRef.current) {
        methods.clearErrors([
          "permanentStateId",
          "permanentCityId",
          "permanentAddress",
        ]);
      }
    }, [sameAsCurrent, stateId, cityId, address, methods]);

    // fetch existing location details
    const traineeLocationDetailApiCall = async (id: string) => {
      const param = { traineeId: id };
      const response: any = await postData(
        "trainee/personaldetail/get",
        param,
        apiHeader(false, 2),
      );

      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const data = response.data.data || {};
        if (data.stateId)
          await cityListApiCall(String(data.stateId), setCityList);
        if (data.permanentStateId)
          await cityListApiCall(
            String(data.permanentStateId),
            setPermanentCityList,
          );
        const curState = data.stateId ? String(data.stateId) : "";
        const curCity = data.cityId ? String(data.cityId) : "";
        const curAddress = data.address || "";
        const permState = data.permanentStateId
          ? String(data.permanentStateId)
          : "";
        const permCity = data.permanentCityId
          ? String(data.permanentCityId)
          : "";
        const permAddress = data.permanentAddress || "";
        methods.reset({
          ...methods.getValues(),
          stateId: curState,
          cityId: curCity,
          address: curAddress,
          permanentStateId: permState,
          permanentCityId: permCity,
          permanentAddress: permAddress,
        });
        // If saved permanent address matches the current one, pre-tick the box.
        if (
          permState &&
          permState === curState &&
          permCity === curCity &&
          permAddress === curAddress
        ) {
          setSameAsCurrent(true);
        }
      } else {
        toasterrormsg(response?.data?.message || "Something went wrong");
      }
    };

    useEffect(() => {
      if (traineeId && fetchedForRef.current !== traineeId) {
        fetchedForRef.current = traineeId;
        traineeLocationDetailApiCall(traineeId);
      }
    }, [traineeId]);

    // revalidate on change after first submit
    useEffect(() => {
      const sub = methods.watch((_v, { name }) => {
        if (!name || !submittedRef.current) return;
        if (!locationFields.includes(name as any)) return;
        const result = locationDetailsSchema.safeParse(methods.getValues());
        const issue = result.success
          ? undefined
          : result.error.issues.find((i) => i.path[0] === name);
        if (issue) {
          methods.setError(name as any, {
            type: "manual",
            message: issue.message,
          });
        } else {
          methods.clearErrors(name as any);
        }
      });
      return () => sub.unsubscribe();
    }, [methods]);

    // Toggle the "permanent same as current" checkbox.
    const handleSameAsCurrent = (checked: boolean) => {
      setSameAsCurrent(checked);
      if (checked) {
        methods.setValue("permanentStateId", stateId || "");
        methods.setValue("permanentCityId", cityId || "");
        methods.setValue("permanentAddress", address || "");
        methods.clearErrors([
          "permanentStateId",
          "permanentCityId",
          "permanentAddress",
        ]);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        save: async () => {
          submittedRef.current = true;
          const values = methods.getValues();
          const result = locationDetailsSchema.safeParse(values);
          if (!result.success) {
            methods.clearErrors();
            result.error.issues.forEach((issue) => {
              const field = issue.path[0] as keyof RegisterFormData;
              if (field)
                methods.setError(field as any, {
                  type: "manual",
                  message: issue.message,
                });
            });
            return false;
          }

          const v = result.data;
          const payload = {
            traineeId: values.traineeId,
            stateId: v.stateId,
            cityId: v.cityId,
            address: v.address,
            permanentStateId: v.permanentStateId,
            permanentCityId: v.permanentCityId,
            permanentAddress: v.permanentAddress,
          };

          const response: any = await postData(
            "trainee/personaldetail/saveLocation",
            payload,
            apiHeader(false, 2),
          );

          if (
            String(response?.status) === "200" &&
            String(response.data?.status) === "200"
          ) {
            toastsuccessmsg(response.data.message);
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
      <div className="space-y-6">
        {/* CURRENT ADDRESS */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Current Address
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                State <span className="text-primary">*</span>
              </label>
              <Controller
                name="stateId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={stateList}
                    placeholder="Select State"
                    styles={selectStyles}
                    value={
                      stateList.find((o) => o.value === field.value) || null
                    }
                    onChange={(opt: any) => {
                      field.onChange(opt?.value || "");
                      methods.setValue("cityId", "");
                    }}
                  />
                )}
              />
              {errors.stateId && (
                <p className={errorClass}>{errors.stateId.message as string}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                City <span className="text-primary">*</span>
              </label>
              <Controller
                name="cityId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={cityList}
                    placeholder="Select City"
                    styles={selectStyles}
                    isDisabled={!stateId}
                    value={
                      cityList.find((o) => o.value === field.value) || null
                    }
                    onChange={(opt: any) => field.onChange(opt?.value || "")}
                  />
                )}
              />
              {errors.cityId && (
                <p className={errorClass}>{errors.cityId.message as string}</p>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Address <span className="text-primary">*</span>
            </label>
            <textarea
              {...register("address")}
              placeholder="Enter your full address"
              rows={4}
              className="w-full py-3 px-4 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200 resize-none"
            />
            {errors.address && (
              <p className={errorClass}>{errors.address.message as string}</p>
            )}
          </div>
        </div>

        {/* PERMANENT ADDRESS */}
        <div className="space-y-4 border-t border-foreground/[0.08] pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">
              Permanent Address
            </h3>
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
              <label className={labelClass}>
                State <span className="text-primary">*</span>
              </label>
              <Controller
                name="permanentStateId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={stateList}
                    placeholder="Select State"
                    styles={selectStyles}
                    isDisabled={sameAsCurrent}
                    value={
                      stateList.find((o) => o.value === field.value) || null
                    }
                    onChange={(opt: any) => {
                      field.onChange(opt?.value || "");
                      methods.setValue("permanentCityId", "");
                    }}
                  />
                )}
              />
              {errors.permanentStateId && (
                <p className={errorClass}>
                  {errors.permanentStateId.message as string}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                City <span className="text-primary">*</span>
              </label>
              <Controller
                name="permanentCityId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={permanentCityList}
                    placeholder="Select City"
                    styles={selectStyles}
                    isDisabled={sameAsCurrent || !permanentStateId}
                    value={
                      permanentCityList.find((o) => o.value === field.value) ||
                      null
                    }
                    onChange={(opt: any) => field.onChange(opt?.value || "")}
                  />
                )}
              />
              {errors.permanentCityId && (
                <p className={errorClass}>
                  {errors.permanentCityId.message as string}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Address <span className="text-primary">*</span>
            </label>
            <textarea
              {...register("permanentAddress")}
              disabled={sameAsCurrent}
              placeholder="Enter your full address"
              rows={4}
              className="w-full py-3 px-4 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {errors.permanentAddress && (
              <p className={errorClass}>
                {errors.permanentAddress.message as string}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
);

LocationDetails.displayName = "LocationDetails";

export default LocationDetails;
