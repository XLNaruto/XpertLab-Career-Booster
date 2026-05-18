import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";
import DatePicker from "react-date-picker";
import moment from "moment";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { selectStyles, labelClass, errorClass } from "./styles";
import { courseDetailsSchema } from "./schemas";
import type { RegisterFormData } from "./types";
import type { StepHandle } from "./PersonalDetails";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";

type Option = { value: string; label: string };

type CourseDetailsProps = {
  onSaved?: () => void;
};

const enrollmentTypeOptions: Option[] = [
  { value: "TRAINING", label: "Training" },
  { value: "CERTIFICATE", label: "Certificate" },
];

const deviceAvailabilityOptions = [
  { value: 0, label: "Computer" },
  { value: 1, label: "Laptop" },
];

const CourseDetails = forwardRef<StepHandle, CourseDetailsProps>(
  ({ onSaved }, ref) => {
    const methods = useFormContext<RegisterFormData>();
    const {
      control,
      formState: { errors },
    } = methods;

    const [courseList, setCourseList] = useState<Option[]>([]);
    const [traineeAreaList, setTraineeAreaList] = useState<Option[]>([]);
    const [batchDayList, setBatchDayList] = useState<Option[]>([]);
    const [batchTimeList, setBatchTimeList] = useState<Option[]>([]);
    const [computerList, setComputerList] = useState<Option[]>([]);
    const submittedRef = useRef(false);
    const fetchedForRef = useRef<string>("");

    const traineeId = methods.watch("traineeId");
    const hasLaptop = methods.watch("hasLaptop");

    const courseListApiCall = async () => {
      const response: any = await postData(
        "master/course/list",
        {},
        apiHeader(false, 0),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const opt: Option[] = (response.data.data?.list || []).map(
          (val: any) => ({
            value: String(val.coursedurationId),
            label: `${val.courseName} (${val.duration} days)`,
          }),
        );
        setCourseList(opt);
      } else {
        toasterrormsg(response?.data?.message || "Something went wrong");
      }
    };

    const batchDayListApiCall = async () => {
      const response: any = await postData(
        "master/batch/list",
        {},
        apiHeader(false, 0),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const opt: Option[] = (response.data.data?.list || []).map(
          (val: any) => {
            const startDay = val.startDay
              ? val.startDay.charAt(0) + val.startDay.slice(1).toLowerCase()
              : "";
            const endDay = val.endDay
              ? val.endDay.charAt(0) + val.endDay.slice(1).toLowerCase()
              : "";
            const range =
              startDay && endDay ? `${startDay} - ${endDay}` : startDay || endDay;
            return { value: String(val.batchId), label: range };
          },
        );
        setBatchDayList(opt);
      } else {
        toasterrormsg(response?.data?.message || "Something went wrong");
      }
    };

    const batchTimeListApiCall = async () => {
      const response: any = await postData(
        "master/timing/list",
        {},
        apiHeader(false, 0),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const opt: Option[] = (response.data.data?.list || []).map(
          (val: any) => {
            const from = moment(val.from, "HH:mm:ss").format("hh:mm A");
            const to = moment(val.to, "HH:mm:ss").format("hh:mm A");
            return { value: String(val.timingId), label: `${from} - ${to}` };
          },
        );
        setBatchTimeList(opt);
      } else {
        toasterrormsg(response?.data?.message || "Something went wrong");
      }
    };

    const traineeAreaListApiCall = async () => {
      const response: any = await postData(
        "master/area/list",
        {},
        apiHeader(false, 0),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const opt: Option[] = (response.data.data?.list || []).map(
          (val: any) => ({
            value: String(val.traineeareaId),
            label: val.name,
          }),
        );
        setTraineeAreaList(opt);
      } else {
        toasterrormsg(response?.data?.message || "Something went wrong");
      }
    };

    const computerListApiCall = async () => {
      const response: any = await postData(
        "master/computer/list",
        {},
        apiHeader(false, 0),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const opt: Option[] = (response.data.data?.list || []).map(
          (val: any) => ({ value: String(val.computerId), label: val.computer }),
        );
        setComputerList(opt);
      } else {
        toasterrormsg(response?.data?.message || "Something went wrong");
      }
    };

    useEffect(() => {
      courseListApiCall();
      traineeAreaListApiCall();
      batchDayListApiCall();
      batchTimeListApiCall();
      computerListApiCall();
    }, []);

    const traineeCourseDetailApiCall = async (id: string) => {
      const param = { traineeId: id };
      const response: any = await postData(
        "trainee/coursedetail/getLatest",
        param,
        apiHeader(false, 0),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const data = response.data.data || {};
        methods.reset({
          ...methods.getValues(),
          traineecourseId: data.traineecourseId ? String(data.traineecourseId) : "",
          course: data.coursedurationId ? String(data.coursedurationId) : "",
          enrollmentType: data.enrollmentType || "",
          traineeArea: data.traineeareaId ? String(data.traineeareaId) : "",
          batchDay: data.batchId ? String(data.batchId) : "",
          batchTime: data.timingId ? String(data.timingId) : "",
          joiningDate: data.startDate ? new Date(data.startDate) : null,
          hasLaptop:
            data.hasLaptop === true || data.hasLaptop === 1
              ? 1
              : data.hasLaptop === false || data.hasLaptop === 0
              ? 0
              : null,
          computerId: data.computerId ? String(data.computerId) : "",
        });
      }
    };

    useEffect(() => {
      if (traineeId && fetchedForRef.current !== traineeId) {
        fetchedForRef.current = traineeId;
        traineeCourseDetailApiCall(traineeId);
      }
    }, [traineeId]);

    useEffect(() => {
      const sub = methods.watch((_v, { name }) => {
        if (!name || !submittedRef.current) return;
        if (
          ![
            "course",
            "enrollmentType",
            "traineeArea",
            "batchDay",
            "batchTime",
            "joiningDate",
            "hasLaptop",
            "computerId",
          ].includes(name)
        )
          return;
        const result = courseDetailsSchema.safeParse(methods.getValues());
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
          const result = courseDetailsSchema.safeParse(values);
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
            traineecourseId: values.traineecourseId || 0,
            coursedurationId: v.course,
            enrollmentType: v.enrollmentType,
            traineeareaId: v.traineeArea,
            batchId: v.batchDay,
            timingId: v.batchTime,
            startDate: v.joiningDate,
            hasLaptop: v.hasLaptop,
            computerId: v.hasLaptop === 0 ? v.computerId : "",
          };

          const response: any = await postData(
            "trainee/coursedetail/save",
            payload,
            apiHeader(false, 0),
          );

          if (
            String(response?.status) === "200" &&
            String(response.data?.status) === "200"
          ) {
            const savedId = response.data.data?.traineecourseId;
            if (savedId) methods.setValue("traineecourseId", String(savedId));
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
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>
              Course <span className="text-primary">*</span>
            </label>
            <Controller
              name="course"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={courseList}
                  placeholder="Select Course"
                  styles={selectStyles}
                  value={courseList.find((o) => o.value === field.value) || null}
                  onChange={(opt: any) => field.onChange(opt?.value || "")}
                />
              )}
            />
            {errors.course && (
              <p className={errorClass}>{errors.course.message as string}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Enrollment Type <span className="text-primary">*</span>
            </label>
            <Controller
              name="enrollmentType"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={enrollmentTypeOptions}
                  placeholder="Select Enrollment Type"
                  styles={selectStyles}
                  value={
                    enrollmentTypeOptions.find((o) => o.value === field.value) ||
                    null
                  }
                  onChange={(opt: any) => field.onChange(opt?.value || "")}
                />
              )}
            />
            {errors.enrollmentType && (
              <p className={errorClass}>
                {errors.enrollmentType.message as string}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Trainee Area <span className="text-primary">*</span>
            </label>
            <Controller
              name="traineeArea"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={traineeAreaList}
                  placeholder="Trainee Area"
                  styles={selectStyles}
                  value={
                    traineeAreaList.find((o) => o.value === field.value) ||
                    null
                  }
                  onChange={(opt: any) => field.onChange(opt?.value || "")}
                />
              )}
            />
            {errors.traineeArea && (
              <p className={errorClass}>
                {errors.traineeArea.message as string}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Batch Day <span className="text-primary">*</span>
            </label>
            <Controller
              name="batchDay"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={batchDayList}
                  placeholder="Select Batch Day"
                  styles={selectStyles}
                  value={
                    batchDayList.find((o) => o.value === field.value) || null
                  }
                  onChange={(opt: any) => field.onChange(opt?.value || "")}
                />
              )}
            />
            {errors.batchDay && (
              <p className={errorClass}>{errors.batchDay.message as string}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Batch Time <span className="text-primary">*</span>
            </label>
            <Controller
              name="batchTime"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={batchTimeList}
                  placeholder="Select Batch Time"
                  styles={selectStyles}
                  value={
                    batchTimeList.find((o) => o.value === field.value) || null
                  }
                  onChange={(opt: any) => field.onChange(opt?.value || "")}
                />
              )}
            />
            {errors.batchTime && (
              <p className={errorClass}>{errors.batchTime.message as string}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Joining Date <span className="text-primary">*</span>
            </label>
            <Controller
              name="joiningDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  format="dd-MM-yyyy"
                  dayPlaceholder="dd"
                  monthPlaceholder="mm"
                  yearPlaceholder="yyyy"
                  clearIcon={null}
                  className="react-date-picker--custom"
                />
              )}
            />
            {errors.joiningDate && (
              <p className={errorClass}>
                {errors.joiningDate.message as string}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Device Availability <span className="text-primary">*</span>
            </label>
            <Controller
              name="hasLaptop"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={deviceAvailabilityOptions}
                  placeholder="Select Device"
                  styles={selectStyles}
                  value={
                    deviceAvailabilityOptions.find(
                      (o) => o.value === field.value,
                    ) || null
                  }
                  onChange={(opt: any) => {
                    const v = opt ? opt.value : null;
                    field.onChange(v);
                    if (v !== 0) methods.setValue("computerId", "");
                  }}
                />
              )}
            />
            {errors.hasLaptop && (
              <p className={errorClass}>
                {errors.hasLaptop.message as string}
              </p>
            )}
          </div>
          {hasLaptop === 0 && (
            <div>
              <label className={labelClass}>
                Computer <span className="text-primary">*</span>
              </label>
              <Controller
                name="computerId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={computerList}
                    placeholder="Select Computer"
                    styles={selectStyles}
                    value={
                      computerList.find((o) => o.value === field.value) || null
                    }
                    onChange={(opt: any) => field.onChange(opt?.value || "")}
                  />
                )}
              />
              {errors.computerId && (
                <p className={errorClass}>
                  {errors.computerId.message as string}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

CourseDetails.displayName = "CourseDetails";

export default CourseDetails;
