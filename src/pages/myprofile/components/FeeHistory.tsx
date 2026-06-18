import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import { Receipt, IndianRupee, CalendarDays, TicketPercent, ReceiptText } from "lucide-react";
import { apiHeader, postData } from "@/utils/ApiHelper";
import {
  dateFirstFormat,
  getEncodedCookie,
  toasterrormsg,
} from "@/utils/reusable";
import type { ProfileFormData } from "./types";

// Format an amount in Indian Rupees (₹1,400.00).
const rupees = (amount: any) => {
  const n = Number(amount);
  return (Number.isNaN(n) ? 0 : n).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

type PaymentRecord = {
  paymenthistoryId: string;
  receiptNumber?: string;
  paymentDate?: string;
  transactionId?: string;
  discount?: number;
  tds?: number;
  paidAmount?: number;
  remarks?: string;
  course?: string;
  courseName?: string;
};

type FeeHistoryData = {
  list: PaymentRecord[];
  totalRecord: number;
  totalPaidAmount: number;
  totalDiscount: number;
  totalTds: number;
};

const emptyData: FeeHistoryData = {
  list: [],
  totalRecord: 0,
  totalPaidAmount: 0,
  totalDiscount: 0,
  totalTds: 0,
};

const FeeHistory = () => {
  const { getValues } = useFormContext<ProfileFormData>();
  const [data, setData] = useState<FeeHistoryData>(emptyData);
  const [loading, setLoading] = useState(true);

  const feeHistoryApiCall = async () => {
    setLoading(true);
    const traineeId = getEncodedCookie("traineeId");
    const traineecourseId = getValues("traineecourseId");
    const payload: Record<string, unknown> = {};
    if (traineeId) payload.traineeId = traineeId;
    if (traineecourseId) payload.traineecourseId = traineecourseId;

    const response: any = await postData(
      "private/trainee/paymenthistory/list",
      payload,
      apiHeader(false, 0),
    );
    if (
      String(response?.status) === "200" &&
      String(response.data?.status) === "200"
    ) {
      const d = response.data.data || {};
      setData({
        ...emptyData,
        ...d,
        list: Array.isArray(d) ? d : d.list || [],
      });
    } else {
      toasterrormsg(response?.data?.message || "Failed to load fee history");
    }
    setLoading(false);
  };

  useEffect(() => {
    feeHistoryApiCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { list: rows } = data;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-foreground/[0.05] animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-foreground/[0.05] animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-secondary" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">No payments yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your fee payment history will appear here once a payment is recorded.
        </p>
      </div>
    );
  }

  const summary = [
    { label: "Total Paid", value: data.totalPaidAmount, icon: IndianRupee, from: "from-primary", to: "to-primary-light" },
    { label: "Total Discount", value: data.totalDiscount, icon: TicketPercent, from: "from-emerald-400", to: "to-emerald-600" },
    { label: "Total TDS", value: data.totalTds, icon: ReceiptText, from: "from-amber-400", to: "to-amber-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summary.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="flex items-center gap-3 bg-white/[0.55] border border-white/[0.7] rounded-2xl px-4 py-3.5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-sm shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{rupees(s.value || 0)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.7]">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-white/[0.5] text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Receipt No.</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="px-4 py-3 font-semibold text-right">Discount</th>
              <th className="px-4 py-3 font-semibold text-right">TDS</th>
              <th className="px-4 py-3 font-semibold text-right">Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <motion.tr
                key={r.paymenthistoryId ?? idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="border-t border-foreground/[0.06] hover:bg-white/[0.4] transition-colors"
              >
                <td className="px-4 py-3 text-[13px] font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-muted-foreground">#</span>
                    {r.receiptNumber || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    {r.paymentDate ? dateFirstFormat(r.paymentDate) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground max-w-[260px] whitespace-normal break-words">
                  {r.courseName || r.course || "—"}
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground text-right">
                  {r.discount ? rupees(r.discount) : "—"}
                </td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground text-right">
                  {r.tds ? rupees(r.tds) : "—"}
                </td>
                <td className="px-4 py-3 text-[13px] font-bold text-foreground text-right">
                  {r.paidAmount != null ? rupees(r.paidAmount) : "—"}
                </td>
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white/[0.5] border-t border-foreground/[0.1] text-[13px] font-bold text-foreground">
              <td className="px-4 py-3" colSpan={3}>Total ({data.totalRecord})</td>
              <td className="px-4 py-3 text-right">{rupees(data.totalDiscount || 0)}</td>
              <td className="px-4 py-3 text-right">{rupees(data.totalTds || 0)}</td>
              <td className="px-4 py-3 text-right text-primary">{rupees(data.totalPaidAmount || 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default FeeHistory;
