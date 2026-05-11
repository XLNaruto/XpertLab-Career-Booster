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
    const submittedRef = useRef(false);
    const fetchedForRef = useRef<string>("");

    const traineeId = methods.watch("traineeId");
    const stateId = methods.watch("stateId");

    const stateListApiCall = async () => {
      var response: any = await postData(
        "master/state/list",
        {},
        apiHeader(false, 0),
      );

      if (
        String(response?.status) == "200" &&
        String(response.data?.status) == "200"
      ) {
        var data = response.data.data;
        var opt: any = [];
        data.list.map((val: any) => {
          opt.push({ value: val.stateId, label: val.name });
        });
        setStateList(opt);
      } else {
        toasterrormsg(response.data.message);
      }
    };

    useEffect(() => {
      stateListApiCall();
    }, []);

    const cityListApiCall = async (stateId: string) => {
      if (!stateId) {
        setCityList([]);
        return;
      }
      const param = {
        stateId: stateId,
      };
      var response: any = await postData(
        "master/city/list",
        param,
        apiHeader(false, 0),
      );

      if (
        String(response?.status) == "200" &&
        String(response.data?.status) == "200"
      ) {
        var data = response.data.data;
        var opt: any = [];
        data.list.map((val: any) => {
          opt.push({ value: val.cityId, label: val.name });
        });
        setCityList(opt);
      } else {
        toasterrormsg(response.data.message);
      }
    };

    useEffect(() => {
      cityListApiCall(stateId);
    }, [stateId]);

    // fetch existing location details
    const traineeLocationDetailApiCall = async (id: string) => {
      const param = { traineeId: id };
      const response: any = await postData(
        "trainee/personaldetail/get",
        param,
        apiHeader(false, 0),
      );

      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const data = response.data.data || {};
        if (data.stateId) await cityListApiCall(String(data.stateId));
        methods.reset({
          ...methods.getValues(),
          stateId: data.stateId ? String(data.stateId) : "",
          cityId: data.cityId ? String(data.cityId) : "",
          address: data.address || "",
        });
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
        if (!["stateId", "cityId", "address"].includes(name)) return;
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
          };

          const response: any = await postData(
            "trainee/personaldetail/saveLocation",
            payload,
            apiHeader(false, 0),
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
      <div className="space-y-4">
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
                  value={stateList.find((o) => o.value === field.value) || null}
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
                  value={cityList.find((o) => o.value === field.value) || null}
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
    );
  },
);

LocationDetails.displayName = "LocationDetails";

export default LocationDetails;
