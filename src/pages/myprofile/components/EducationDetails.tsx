import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import Select from "react-select";
import DatePicker from "react-date-picker";
import { FileUploader } from "react-drag-drop-files";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import {
  GraduationCap,
  BookOpen,
  Upload,
  CheckCircle,
  X,
  Trash2,
  Download,
} from "lucide-react";
import {
  selectStyles,
  inputClass,
  labelClass,
  errorClass,
  iconClass,
} from "./styles";
import type { ProfileFormData } from "./types";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { educationDetailsSchema } from "./schemas";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";
import { apiHeader, postData } from "@/utils/ApiHelper";

export type EducationDetailsHandle = {
  save: () => Promise<boolean>;
};

type EducationDetailsProps = {
  onSaved?: () => void;
};

type Option = { value: string; label: string };

const educationTypeList: Option[] = [
  { value: "SSC", label: "SSC" },
  { value: "HSC", label: "HSC" },
  { value: "DIPLOMA", label: "Diploma" },
  { value: "BACHELOR DEGREE", label: "Bachelor Degree" },
  { value: "MASTER DEGREE", label: "Master Degree" },
  { value: "PHD", label: "PhD" },
];
const FILE_TYPES = ["JPG", "JPEG", "PNG", "GIF", "PDF"];

// Year-month is stored and sent as "YYYY-MM". fromApiYearMonth also accepts legacy "M-YYYY".
const fromApiYearMonth = (v: string) => {
  if (!v) return "";
  if (/^\d{4}-\d{2}$/.test(v)) return v;
  const [m, y] = v.split("-");
  if (!y || !m) return "";
  return `${y}-${String(parseInt(m, 10)).padStart(2, "0")}`;
};

const stringToDate = (v: string): Date | null => {
  if (!v) return null;
  const [y, m] = v.split("-");
  if (!y || !m) return null;
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
};

const dateToString = (d: Date | null): string => {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const EducationDetails = forwardRef<
  EducationDetailsHandle,
  EducationDetailsProps
>(({ onSaved }, ref) => {
  const methods = useFormContext<ProfileFormData>();
  const {
    control,
    formState: { errors },
    watch,
  } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "educations",
  });

  const submittedRef = useRef(false);
  const fetchedForRef = useRef<string>("");

  const [boardList, setBoardList] = useState<Option[]>([]);
  const [instituteList, setInstituteList] = useState<Option[]>([]);

  const traineeId = methods.watch("traineeId");
  const educationsWatch = watch("educations");

  const boardListApiCall = async () => {
    var response: any = await postData(
      "master/board/list",
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
        opt.push({ value: String(val.boardId), label: val.name });
      });
      setBoardList(opt);
    } else {
      toasterrormsg(response.data.message);
    }
  };

  const instituteListApiCall = async () => {
    var response: any = await postData(
      "master/institute/list",
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
        opt.push({ value: String(val.instituteId), label: val.name });
      });
      setInstituteList(opt);
    } else {
      toasterrormsg(response.data.message);
    }
  };

  useEffect(() => {
    boardListApiCall();
    instituteListApiCall();
  }, []);

  const educationListApiCall = async (id: string) => {
    const param = { traineeId: id };
    var response: any = await postData(
      "private/trainee/educationdetail/list",
      param,
      apiHeader(false, 0),
    );

    if (
      String(response?.status) == "200" &&
      String(response.data?.status) == "200"
    ) {
      var data = response.data?.data;
      const list: any[] = data ?? [];
      if (list.length > 0) {
        const filterData = list.map((item: any) => ({
          traineeeducationdetailId: String(item.traineeeducationdetailId ?? ""),
          educationType: item.educationType ?? "",
          passingYear: fromApiYearMonth(item.passingYear ?? ""),
          academicYear: fromApiYearMonth(item.academicYear ?? ""),
          education: item.education ?? "",
          boardId: item.boardId ? String(item.boardId) : "",
          instituteId: item.instituteId ? String(item.instituteId) : "",
          percentage: item.percentage != null ? String(item.percentage) : "",
          isCompleted: String(item.isCompleted ?? "0"),
          document: item.document ?? "",
          url: item.url ?? "",
        }));
        methods.setValue("educations", filterData);
      }
    } else {
      toasterrormsg(response.data.message);
    }
  };

  useEffect(() => {
    if (traineeId && fetchedForRef.current !== traineeId) {
      fetchedForRef.current = traineeId;
      educationListApiCall(traineeId);
    }
  }, [traineeId]);

  const handleDocumentChange = async (file: File, index: number) => {
    if (!file) return;
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      toasterrormsg("Invalid file type. Please upload only image or pdf.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toasterrormsg("File size should not exceed 1MB.");
      return;
    }

    const param = new FormData();
    param.append("document", file);
    var response: any = await postData(
      "private/trainee/educationdetail/uploadDocument",
      param,
      apiHeader(true, 2),
    );

    if (
      String(response?.status) == "200" &&
      String(response.data?.status) == "200"
    ) {
      var data = response.data.data;
      methods.setValue(`educations.${index}.document`, data?.document ?? "");
      methods.setValue(
        `educations.${index}.url`,
        data?.url ?? data?.document ?? "",
      );
    } else {
      toasterrormsg(response.data.message);
    }
  };

  const handleRemoveField = (index: number) => {
    if (index === 0) return;
    remove(index);
  };

  const resetRowOnTypeChange = (index: number) => {
    methods.setValue(`educations.${index}.passingYear`, "");
    methods.setValue(`educations.${index}.academicYear`, "");
    methods.setValue(`educations.${index}.education`, "");
    methods.setValue(`educations.${index}.boardId`, "");
    methods.setValue(`educations.${index}.instituteId`, "");
    methods.setValue(`educations.${index}.percentage`, "");
    methods.setValue(`educations.${index}.isCompleted`, "0");
    methods.setValue(`educations.${index}.document`, "");
    methods.setValue(`educations.${index}.url`, "");
  };

  const resetRowOnPursuingChange = (index: number) => {
    methods.setValue(`educations.${index}.passingYear`, "");
    methods.setValue(`educations.${index}.academicYear`, "");
    methods.setValue(`educations.${index}.percentage`, "");
    methods.setValue(`educations.${index}.document`, "");
    methods.setValue(`educations.${index}.url`, "");
  };

  useEffect(() => {
    const sub = methods.watch((_v, { name }) => {
      if (!name || !submittedRef.current) return;
      if (!name.startsWith("educations")) return;
      const result = educationDetailsSchema.safeParse({
        educations: methods.getValues("educations"),
      });
      const issue = result.success
        ? undefined
        : result.error.issues.find((i) => i.path.join(".") === name);
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
        const educations = methods.getValues("educations");
        const result = educationDetailsSchema.safeParse({ educations });
        if (!result.success) {
          methods.clearErrors();
          result.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            methods.setError(path as any, {
              type: "manual",
              message: issue.message,
            });
          });
          return false;
        }

        const payload = {
          education: result.data.educations.map((e) => ({
            traineeId: methods.getValues("traineeId"),
            traineeeducationdetailId: e.traineeeducationdetailId || undefined,
            educationType: e.educationType,
            passingYear: e.passingYear,
            academicYear: e.academicYear,
            education: e.education,
            boardId: e.boardId,
            instituteId: e.instituteId,
            percentage: e.isCompleted === "1" ? e.percentage : "0",
            isCompleted: e.isCompleted,
            document: e.document,
          })),
        };

        var response: any = await postData(
          "private/trainee/educationdetail/save",
          payload,
          apiHeader(false, 0),
        );

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
    }),
    [methods, onSaved],
  );

  return (
    <div className="space-y-5">
      {fields.map((field, idx) => {
        const row = educationsWatch?.[idx];
        const isCompleted = row?.isCompleted === "1";
        const isSscOrHsc =
          row?.educationType === "SSC" || row?.educationType === "HSC";
        const eduErrors = (errors.educations as any)?.[idx];
        return (
          <div
            key={field.id}
            className="bg-white/[0.4] border border-foreground/[0.06] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Education {idx + 1}
              </h3>
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField(idx)}
                  className="text-xs text-primary font-semibold hover:opacity-70 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>
                    Education Type <span className="text-primary">*</span>
                  </label>
                  <Controller
                    name={`educations.${idx}.educationType`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={educationTypeList}
                        placeholder="Select Education Type"
                        styles={selectStyles}
                        value={
                          educationTypeList.find(
                            (o) => o.value === field.value,
                          ) || null
                        }
                        onChange={(opt: any) => {
                          field.onChange(opt?.value || "");
                          resetRowOnTypeChange(idx);
                        }}
                      />
                    )}
                  />
                  {eduErrors?.educationType && (
                    <p className={errorClass}>
                      {eduErrors.educationType.message as string}
                    </p>
                  )}
                </div>
                {!isSscOrHsc && (
                  <div>
                    <label className={labelClass}>
                      Education <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <div className={iconClass}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <Controller
                        name={`educations.${idx}.education`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            placeholder="Education"
                            className={inputClass}
                          />
                        )}
                      />
                    </div>
                    {eduErrors?.education && (
                      <p className={errorClass}>
                        {eduErrors.education.message as string}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className={labelClass}>
                    Board / University <span className="text-primary">*</span>
                  </label>
                  <Controller
                    name={`educations.${idx}.boardId`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={boardList}
                        placeholder="Select Board / University"
                        styles={selectStyles}
                        value={
                          boardList.find((o) => o.value === field.value) || null
                        }
                        onChange={(opt: any) =>
                          field.onChange(opt?.value || "")
                        }
                      />
                    )}
                  />
                  {eduErrors?.boardId && (
                    <p className={errorClass}>
                      {eduErrors.boardId.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    Institute <span className="text-primary">*</span>
                  </label>
                  <Controller
                    name={`educations.${idx}.instituteId`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={instituteList}
                        placeholder="Select Institute"
                        styles={selectStyles}
                        value={
                          instituteList.find((o) => o.value === field.value) ||
                          null
                        }
                        onChange={(opt: any) =>
                          field.onChange(opt?.value || "")
                        }
                      />
                    )}
                  />
                  {eduErrors?.instituteId && (
                    <p className={errorClass}>
                      {eduErrors.instituteId.message as string}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Education Completed</label>
                  <Controller
                    name={`educations.${idx}.isCompleted`}
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          className="relative w-11 h-6 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              field.value === "1"
                                ? "hsl(342 80% 53%)"
                                : "hsl(var(--foreground) / 0.1)",
                          }}
                        >
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={field.value === "1"}
                            onChange={(e) => {
                              field.onChange(e.target.checked ? "1" : "0");
                              resetRowOnPursuingChange(idx);
                            }}
                          />
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${field.value === "1" ? "translate-x-5" : ""}`}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {field.value === "1" ? "Yes" : "No"}
                        </span>
                      </label>
                    )}
                  />
                </div>
                {isCompleted ? (
                  <div>
                    <label className={labelClass}>
                      Passing Year <span className="text-primary">*</span>
                    </label>
                    <Controller
                      name={`educations.${idx}.passingYear`}
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={stringToDate(field.value)}
                          onChange={(val: any) =>
                            field.onChange(dateToString(val))
                          }
                          format="MM-yyyy"
                          maxDetail="year"
                          monthPlaceholder="mm"
                          yearPlaceholder="yyyy"
                          clearIcon={null}
                          maxDate={new Date()}
                          className="react-date-picker--custom"
                        />
                      )}
                    />
                    {eduErrors?.passingYear && (
                      <p className={errorClass}>
                        {eduErrors.passingYear.message as string}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>
                      Academic Year <span className="text-primary">*</span>
                    </label>
                    <Controller
                      name={`educations.${idx}.academicYear`}
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={stringToDate(field.value)}
                          onChange={(val: any) =>
                            field.onChange(dateToString(val))
                          }
                          format="MM-yyyy"
                          maxDetail="year"
                          monthPlaceholder="mm"
                          yearPlaceholder="yyyy"
                          clearIcon={null}
                          maxDate={new Date()}
                          className="react-date-picker--custom"
                        />
                      )}
                    />
                    {eduErrors?.academicYear && (
                      <p className={errorClass}>
                        {eduErrors.academicYear.message as string}
                      </p>
                    )}
                  </div>
                )}
                {isCompleted && (
                  <div>
                    <label className={labelClass}>
                      Percentage (%) <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <div className={iconClass}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <Controller
                        name={`educations.${idx}.percentage`}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            placeholder="Percentage (%)"
                            className={inputClass}
                          />
                        )}
                      />
                    </div>
                    {eduErrors?.percentage && (
                      <p className={errorClass}>
                        {eduErrors.percentage.message as string}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {isCompleted && (
                <div>
                  <label className={labelClass}>
                    Document <span className="text-primary">*</span>
                  </label>
                  <FileUploader
                    multiple={false}
                    types={FILE_TYPES}
                    handleChange={(file: File) =>
                      handleDocumentChange(file, idx)
                    }
                    dropMessageStyle={{ display: "none" }}
                    hoverTitle=" "
                    classes="w-full"
                  >
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        row?.document
                          ? "border-green-400/40 bg-green-50/30"
                          : "border-foreground/[0.1] hover:border-primary/30 hover:bg-primary/[0.02]"
                      }`}
                    >
                      {row?.document ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div className="text-[13px] font-semibold text-foreground/70 text-center truncate max-w-full px-2">
                            {row.document.split("/").pop() || row.document}
                          </div>
                          <div className="flex items-center gap-3">
                            {row?.url && (
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                              >
                                <Download className="w-3 h-3" /> Download
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                methods.setValue(
                                  `educations.${idx}.document`,
                                  "",
                                );
                                methods.setValue(`educations.${idx}.url`, "");
                              }}
                              className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                            >
                              <X className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-foreground/20" />
                          <div className="text-[13px] font-semibold text-foreground/50">
                            Upload Document
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Drag &amp; Drop or choose files
                          </div>
                        </>
                      )}
                    </div>
                  </FileUploader>
                  {eduErrors?.document && (
                    <p className={errorClass}>
                      {eduErrors.document.message as string}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() =>
          append({
            traineeeducationdetailId: "",
            educationType: "",
            education: "",
            boardId: "",
            instituteId: "",
            passingYear: "",
            academicYear: "",
            percentage: "",
            isCompleted: "0",
            document: "",
            url: "",
          })
        }
        className="text-sm font-semibold text-primary hover:opacity-70 transition-opacity"
      >
        + Add More
      </button>
    </div>
  );
});

EducationDetails.displayName = "EducationDetails";

export default EducationDetails;
