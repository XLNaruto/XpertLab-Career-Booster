import { useFormContext } from "react-hook-form";
import { FileText, CheckCircle, Eye, Info } from "lucide-react";
import DocumentLightbox from "@/components/DocumentLightbox";
import { inputClass, labelClass, errorClass, iconClass } from "./styles";
import type { ProfileFormData, TraineeDocument } from "./types";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { apiHeader, postData } from "@/utils/ApiHelper";
import { toasterrormsg, toastsuccessmsg } from "@/utils/reusable";
import { documentsSchema } from "./schemas";

export type DocumentDetailsHandle = {
  save: () => Promise<boolean>;
};

type DocumentDetailsProps = {
  onSaved?: () => void;
};

const isImage = (path: string) => /\.(jpe?g|png|gif|webp|bmp)$/i.test(path);

type MasterDocument = {
  traineedocumentId: string;
  name: string;
  isCompulsory: number | boolean;
};

const Documents = forwardRef<DocumentDetailsHandle, DocumentDetailsProps>(
  ({ onSaved }, ref) => {
    const methods = useFormContext<ProfileFormData>();
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
        "private/trainee/documentdetail/list",
        param,
        apiHeader(false, 2),
      );
      if (
        String(response?.status) === "200" &&
        String(response.data?.status) === "200"
      ) {
        const data = response.data.data || {};
        const docs = Array.isArray(data)
          ? data
          : data.list || data.documents || [];
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
      if (
        traineeId &&
        masterList.length &&
        fetchedForRef.current !== traineeId
      ) {
        fetchedForRef.current = traineeId;
        documentDetailListApiCall(traineeId, masterList);
      }
    }, [traineeId, masterList]);

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
            "private/trainee/documentdetail/save",
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
        <div className="flex items-start gap-2.5 rounded-xl border border-secondary/20 bg-secondary/[0.06] px-4 py-3">
          <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-foreground/70 leading-relaxed">
            To change your documents, please contact the Trainee Head.
          </p>
        </div>
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
              readOnly
              className={`${inputClass} bg-foreground/[0.04] cursor-not-allowed`}
            />
          </div>
          {errors.aadharNumber && (
            <p className={errorClass}>
              {errors.aadharNumber.message as string}
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Documents</label>
          <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch">
            {documents.map((doc, idx) => {
                if (!doc) return null;
              const isCompulsory:any =
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
                          onClick={() => setPreviewUrl(doc.url || doc.document)}
                          className="w-full h-24 object-cover rounded-lg border border-foreground/[0.06] cursor-zoom-in"
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
                      <div className="mt-auto">
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(doc.url || doc.document)}
                          disabled={!doc.url && !doc.document}
                          className="w-full py-1.5 text-[12px] font-semibold rounded-lg bg-white/70 border border-foreground/[0.1] text-foreground/80 hover:bg-white transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full border-2 border-dashed border-foreground/[0.1] rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                      <FileText className="w-6 h-6 text-foreground/20" />
                      <div className="text-[13px] font-semibold text-foreground/40">
                        Not Uploaded
                      </div>
                    </div>
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
  },
);

export default Documents;
