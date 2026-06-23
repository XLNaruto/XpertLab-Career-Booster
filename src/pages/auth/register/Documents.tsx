import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import { FileUploader } from "react-drag-drop-files";
import { FileText, Upload, CheckCircle, X, Eye } from "lucide-react";
import { inputClass, labelClass, errorClass, iconClass } from "./styles";
import { documentsSchema } from "./schemas";
import type { RegisterFormData, TraineeDocument } from "./types";
import type { StepHandle } from "./PersonalDetails";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";
import DocumentLightbox from "@/components/DocumentLightbox";

const fileTypes = ["JPG", "JPEG", "PNG", "PDF"];

const isImage = (path: string) => /\.(jpe?g|png|gif|webp|bmp)$/i.test(path);

type MasterDocument = {
  traineedocumentId: string;
  name: string;
  isCompulsory: number | boolean;
};

type DocumentsProps = {
  onSaved?: () => void;
};

const Documents = forwardRef<StepHandle, DocumentsProps>(({ onSaved }, ref) => {
  const methods = useFormContext<RegisterFormData>();
  const {
    register,
    formState: { errors },
  } = methods;

  const submittedRef = useRef(false);
  const fetchedForRef = useRef<string>("");

  const [masterList, setMasterList] = useState<MasterDocument[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const traineeId = methods.watch("traineeId");
  const documents = methods.watch("documents") || [];

  const buildInitialDocuments = (
    list: MasterDocument[],
    existing: TraineeDocument[] = [],
  ): TraineeDocument[] =>
    list.map((m) => {
      const found = existing.find(
        (d) => String(d.traineedocumentId) === String(m.traineedocumentId),
      );
      return {
        traineedocumentId: String(m.traineedocumentId),
        name: m.name,
        isCompulsory: m.isCompulsory,
        document: found?.document || "",
        url: found?.url || "",
      };
    });

  const traineeDocumentListApiCall = async (): Promise<MasterDocument[]> => {
    const response: any = await postData(
      "master/traineedocument/list",
      {},
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const list = response.data.data?.list || [];
      const mapped: MasterDocument[] = list.map((val: any) => ({
        traineedocumentId: String(val.traineedocumentId),
        name: val.name,
        isCompulsory: val.isCompulsory,
      }));
      setMasterList(mapped);
      return mapped;
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
      return [];
    }
  };

  const documentDetailListApiCall = async (
    id: string,
    list: MasterDocument[],
  ) => {
    const param = { traineeId: id };
    const response: any = await postData(
      "trainee/documentdetail/list",
      param,
      apiHeader(false, 2),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const data = response.data.data || {};
      const docs = Array.isArray(data) ? data : data.list || data.documents || [];
      const existing: TraineeDocument[] = (docs || []).map((d: any) => ({
        traineedocumentId: String(d.traineedocumentId),
        name: d.name || "",
        isCompulsory: d.isCompulsory ?? 0,
        document: d.document || "",
        url: d.url || d.document || "",
      }));
      methods.setValue("documents", buildInitialDocuments(list, existing));
      if (data.aadharcardNumber || data.aadharNumber) {
        methods.setValue(
          "aadharNumber",
          String(data.aadharcardNumber || data.aadharNumber || ""),
        );
      }
    } else {
      methods.setValue("documents", buildInitialDocuments(list, []));
    }
  };

  useEffect(() => {
    (async () => {
      const list = await traineeDocumentListApiCall();
      if (!traineeId) {
        methods.setValue("documents", buildInitialDocuments(list, []));
      }
    })();
  }, []);

  useEffect(() => {
    if (traineeId && masterList.length && fetchedForRef.current !== traineeId) {
      fetchedForRef.current = traineeId;
      documentDetailListApiCall(traineeId, masterList);
    }
  }, [traineeId, masterList]);

  const handleDocumentChange = async (file: File, index: number) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toasterrormsg("Invalid file type. Please upload only image or PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toasterrormsg("File size should not exceed 5MB.");
      return;
    }

    const param = new FormData();
    // param.append("path", "document/");
    param.append("document", file);
    const response: any = await postData(
      "trainee/documentdetail/uploadDocument",
      param,
      apiHeader(true, 2),
    );

    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const data = response.data.data;
      const current = methods.getValues(`documents.${index}`);
      methods.setValue(`documents.${index}`, {
        ...current,
        document: data?.uploadedPath || data?.document || "",
        url: data?.url || data?.uploadedPath || "",
      });
    } else {
      toasterrormsg(response?.data?.message || "Something went wrong");
    }
  };

  const handleRemoveDocument = (index: number) => {
    const current = methods.getValues(`documents.${index}`);
    methods.setValue(`documents.${index}`, {
      ...current,
      document: "",
      url: "",
    });
  };

  useEffect(() => {
    const sub = methods.watch((_v, { name }) => {
      if (!name || !submittedRef.current) return;
      if (name !== "aadharNumber" && !name.startsWith("documents")) return;
      const result = documentsSchema.safeParse({
        aadharNumber: methods.getValues("aadharNumber"),
        documents: methods.getValues("documents"),
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
        const values = {
          aadharNumber: methods.getValues("aadharNumber"),
          documents: methods.getValues("documents"),
        };
        const result = documentsSchema.safeParse(values);
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
          traineeId: methods.getValues("traineeId"),
          aadharcardNumber: result.data.aadharNumber,
          documents: result.data.documents
            .filter((d) => !!d.document)
            .map((d) => ({
              traineedocumentId: d.traineedocumentId,
              document: d.document,
            })),
        };

        const response: any = await postData(
          "trainee/documentdetail/save",
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

  const docErrors = errors.documents as any;

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>
          Aadhar Card Number <span className="text-primary">*</span>
        </label>
        <div className="relative">
          <div className={iconClass}>
            <FileText className="w-4 h-4" />
          </div>
          <input
            {...register("aadharNumber")}
            placeholder="Ex: 123456789012"
            inputMode="numeric"
            maxLength={12}
            onInput={(e) => {
              const t = e.target as HTMLInputElement;
              t.value = t.value.replace(/\D/g, "").slice(0, 12);
            }}
            className={inputClass}
          />
        </div>
        {errors.aadharNumber && (
          <p className={errorClass}>
            {errors.aadharNumber.message as string}
          </p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          Documents
          <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">(Allowed: JPG, JPEG, PNG, PDF · max 5MB)</span>
        </label>
        <div className="grid grid-cols-3 gap-3 items-stretch">
          {documents.map((doc, idx) => {
            const isCompulsory =
              doc.isCompulsory === true ||
              doc.isCompulsory === 1 ||
              String(doc.isCompulsory) === "1";
            const fieldErr = docErrors?.[idx]?.document?.message as
              | string
              | undefined;
            return (
              <div key={doc.traineedocumentId || idx} className="flex flex-col">
                <div className="text-[12px] font-semibold mb-1 text-foreground/70">
                  {doc.name}
                  {isCompulsory && <span className="text-primary"> *</span>}
                </div>
                {doc.document ? (
                  <div className="flex-1 border-2 border-green-400/40 bg-green-50/30 rounded-xl p-3 flex flex-col gap-2">
                    {isImage(doc.document) ? (
                      <img
                        src={doc.url || doc.document}
                        alt={doc.name}
                        className="w-full h-24 object-cover rounded-lg border border-foreground/[0.06]"
                      />
                    ) : (
                      <div className="w-full h-24 rounded-lg border border-foreground/[0.06] bg-white/60 flex flex-col items-center justify-center gap-1">
                        <FileText className="w-7 h-7 text-foreground/40" />
                        <span className="text-[10px] uppercase tracking-wide text-foreground/50 font-semibold">
                          {(doc.document.split(".").pop() || "FILE").toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 min-h-[18px]">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <div className="text-[12px] font-semibold text-foreground/70 truncate">
                        {doc.document.split("/").pop()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(doc.url || doc.document)}
                        disabled={!doc.url && !doc.document}
                        className="py-1.5 text-[12px] font-semibold rounded-lg bg-white/70 border border-foreground/[0.1] text-foreground/80 hover:bg-white transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(idx)}
                        className="py-1.5 text-[12px] font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-all flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <FileUploader
                    handleChange={(file: File) => handleDocumentChange(file, idx)}
                    onTypeError={() =>
                      toasterrormsg("This file type is not allowed. Allowed: JPG, JPEG, PNG, PDF")
                    }
                    name={`document-${idx}`}
                    types={fileTypes}
                    dropMessageStyle={{ display: "none" }}
                    hoverTitle=" "
                    classes="h-full"
                  >
                    <div className="h-full border-2 border-dashed border-foreground/[0.1] hover:border-primary/30 hover:bg-primary/[0.02] rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer">
                      <Upload className="w-6 h-6 text-foreground/20" />
                      <div className="text-[13px] font-semibold text-foreground/50">
                        Upload Document
                      </div>
                      <div className="text-[11px] text-muted-foreground text-center">
                        Drag & Drop or choose files
                      </div>
                    </div>
                  </FileUploader>
                )}
                {fieldErr && <p className={errorClass}>{fieldErr}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <DocumentLightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
});

Documents.displayName = "Documents";

export default Documents;
