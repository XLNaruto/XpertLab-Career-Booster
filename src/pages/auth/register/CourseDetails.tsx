import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { selectStyles, labelClass, errorClass } from "./styles";
import type { RegisterFormData } from "./types";

const courseOptions = [
  { value: "Web Development", label: "Web Development" },
  { value: "App Development", label: "App Development" },
  { value: "Data Science", label: "Data Science" },
];

const traineeAreaOptions = [
  { value: "Online", label: "Online" },
  { value: "Offline", label: "Offline" },
];

const batchDayOptions = [
  { value: "Monday-Friday", label: "Monday-Friday" },
  { value: "Saturday-Sunday", label: "Saturday-Sunday" },
];

const batchTimeOptions = [
  { value: "9:00 AM - 12:00 PM", label: "9:00 AM - 12:00 PM" },
  { value: "2:00 PM - 5:00 PM", label: "2:00 PM - 5:00 PM" },
  { value: "6:00 PM - 9:00 PM", label: "6:00 PM - 9:00 PM" },
];

const deviceOptions = [
  { value: "Computer", label: "Computer" },
  { value: "Laptop", label: "Laptop" },
];

const computerOptions = [
  { value: "Desktop PC", label: "Desktop PC" },
  { value: "All-in-One", label: "All-in-One" },
  { value: "Mini PC", label: "Mini PC" },
  { value: "Workstation", label: "Workstation" },
];

const CourseDetails = () => {
  const { control, watch, formState: { errors } } = useFormContext<RegisterFormData>();
  const device = watch("device");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Course <span className="text-primary">*</span></label>
          <Controller
            name="course"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Select
                {...field}
                options={courseOptions}
                placeholder="Select Course"
                styles={selectStyles}
                value={courseOptions.find(o => o.value === field.value) || null}
                onChange={(opt:any) => field.onChange(opt?.value)}
              />
            )}
          />
          {errors.course && <p className={errorClass}>{errors.course.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Trainee Area</label>
          <Controller
            name="traineeArea"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={traineeAreaOptions}
                placeholder="Trainee Area"
                styles={selectStyles}
                value={traineeAreaOptions.find(o => o.value === field.value) || null}
                onChange={(opt:any) => field.onChange(opt?.value)}
              />
            )}
          />
        </div>
        <div>
          <label className={labelClass}>Batch Day <span className="text-primary">*</span></label>
          <Controller
            name="batchDay"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Select
                {...field}
                options={batchDayOptions}
                placeholder="Select Batch Day"
                styles={selectStyles}
                value={batchDayOptions.find(o => o.value === field.value) || null}
                onChange={(opt:any) => field.onChange(opt?.value)}
              />
            )}
          />
          {errors.batchDay && <p className={errorClass}>{errors.batchDay.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelClass}>Batch Time <span className="text-primary">*</span></label>
          <Controller
            name="batchTime"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Select
                {...field}
                options={batchTimeOptions}
                placeholder="Select Batch Time"
                styles={selectStyles}
                value={batchTimeOptions.find(o => o.value === field.value) || null}
                onChange={(opt:any) => field.onChange(opt?.value)}
              />
            )}
          />
          {errors.batchTime && <p className={errorClass}>{errors.batchTime.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Joining Date <span className="text-primary">*</span></label>
          <Controller
            name="joiningDate"
            control={control}
            rules={{ required: "Required" }}
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
          {errors.joiningDate && <p className={errorClass}>{errors.joiningDate.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Device Availability <span className="text-primary">*</span></label>
          <Controller
            name="device"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Select
                {...field}
                options={deviceOptions}
                placeholder="Select Device"
                styles={selectStyles}
                value={deviceOptions.find(o => o.value === field.value) || null}
                onChange={(opt: any) => field.onChange(opt?.value)}
              />
            )}
          />
          {errors.device && <p className={errorClass}>{errors.device.message}</p>}
        </div>
      </div>

      {device === "Computer" && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Computer <span className="text-primary">*</span></label>
            <Controller
              name="computer"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={computerOptions}
                  placeholder="Select Computer"
                  styles={selectStyles}
                  value={computerOptions.find(o => o.value === field.value) || null}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
            {errors.computer && <p className={errorClass}>{errors.computer.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;
