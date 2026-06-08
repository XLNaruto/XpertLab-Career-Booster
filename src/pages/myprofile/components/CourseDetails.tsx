import { useFormContext } from "react-hook-form";
import { labelClass } from "./styles";
import type { ProfileFormData } from "./types";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg } from "@/utils/reusable";
import moment from "moment";

export type CourseDetailsHandle = {
  save: () => Promise<boolean>;
};

type CourseDetailsProps = {
  onSaved?: () => void;
};

type Option = { value: string; label: string };

const enrollmentTypeOptions: Option[] = [
  { value: "TRAINING", label: "Training" },
  { value: "CERTIFICATE_ONLY", label: "Certificate" },
];

const deviceAvailabilityOptions = [
  { value: 0, label: "Computer" },
  { value: 1, label: "Laptop" },
];

const valueClass =
  "w-full py-2.5 px-3.5 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground min-h-[40px] flex items-center";

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <label className={labelClass}>{label}</label>
    <div className={valueClass}>{value || "—"}</div>
  </div>
);

const CourseDetails = forwardRef<CourseDetailsHandle, CourseDetailsProps>(
  (_props, ref) => {
    const methods = useFormContext<ProfileFormData>();

    const [courseList, setCourseList] = useState<Option[]>([]);
    const [traineeAreaList, setTraineeAreaList] = useState<Option[]>([]);
    const [batchDayList, setBatchDayList] = useState<Option[]>([]);
    const [batchTimeList, setBatchTimeList] = useState<Option[]>([]);
    const [computerList, setComputerList] = useState<Option[]>([]);
    const fetchedForRef = useRef<string>("");

    const traineeId = methods.watch("traineeId");
    const values = methods.watch();

    const courseListApiCall = async () => {
      const response: any = await postData(
        "master/course/list",
        {},
        apiHeader(false, 2),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const opt: Option[] = (response.data.data?.list || []).map(
          (val: any) => ({
            value: String(val.coursedurationId),
            label: val.courseName,
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
        apiHeader(false, 2),
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
              startDay && endDay
                ? `${startDay} - ${endDay}`
                : startDay || endDay;
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
        apiHeader(false, 2),
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
        apiHeader(false, 2),
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
        apiHeader(false, 2),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const opt: Option[] = (response.data.data?.list || []).map(
          (val: any) => ({
            value: String(val.computerId),
            label: val.computer,
          }),
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
        "private/trainee/coursedetail/list",
        param,
        apiHeader(false, 2),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const data = response.data?.data?.[0] || {};
        methods.reset({
          ...methods.getValues(),
          traineecourseId: data.traineecourseId
            ? String(data.traineecourseId)
            : "",
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

    // Read-only view: nothing to persist, navigation proceeds without saving.
    useImperativeHandle(ref, () => ({ save: async () => true }), []);

    const courseLabel =
      courseList.find((o) => o.value === values.course)?.label || "";
    const enrollmentLabel =
      enrollmentTypeOptions.find((o) => o.value === values.enrollmentType)
        ?.label || "";
    const traineeAreaLabel =
      traineeAreaList.find((o) => o.value === values.traineeArea)?.label || "";
    const batchDayLabel =
      batchDayList.find((o) => o.value === values.batchDay)?.label || "";
    const batchTimeLabel =
      batchTimeList.find((o) => o.value === values.batchTime)?.label || "";
    const joiningDateLabel = values.joiningDate
      ? moment(values.joiningDate).format("DD-MM-YYYY")
      : "";
    const deviceLabel =
      deviceAvailabilityOptions.find((o) => o.value === values.hasLaptop)
        ?.label || "";
    const computerLabel =
      computerList.find((o) => o.value === values.computerId)?.label || "";

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <ReadOnlyField label="Course" value={courseLabel} />
          <ReadOnlyField label="Enrollment Type" value={enrollmentLabel} />
          <ReadOnlyField label="Trainee Area" value={traineeAreaLabel} />
          <ReadOnlyField label="Batch Day" value={batchDayLabel} />
          <ReadOnlyField label="Batch Time" value={batchTimeLabel} />
          <ReadOnlyField label="Joining Date" value={joiningDateLabel} />
          <ReadOnlyField label="Device Availability" value={deviceLabel} />
          {values.hasLaptop === 0 && (
            <ReadOnlyField label="Computer" value={computerLabel} />
          )}
        </div>
      </div>
    );
  },
);

export default CourseDetails;
