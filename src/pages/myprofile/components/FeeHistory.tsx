import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import {
  Receipt,
  IndianRupee,
  CalendarDays,
  TicketPercent,
  ReceiptText,
  BookOpen,
  ChevronRight,
  Clock,
} from "lucide-react";
import { apiHeader, postData } from "@/utils/ApiHelper";
import {
  dateFirstFormat,
  getEncodedCookie,
  toasterrormsg,
} from "@/utils/reusable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ProfileFormData } from "./types";

// Format a day count into months / weeks / days (e.g. 90 → "3 month 6 day").
const formatDuration = (totalDays: number): string => {
  const days = Math.max(0, Math.round(totalDays || 0));
  if (days === 0) return "0 day";
  const months = Math.floor(days / 28);
  const weeks = Math.floor((days % 28) / 7);
  const remDays = days % 7;
  const parts: string[] = [];
  if (months) parts.push(`${months} month`);
  if (weeks) parts.push(`${weeks} week`);
  if (remDays) parts.push(`${remDays} day`);
  return parts.join(" ");
};

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
};

type CourseFeeGroup = {
  traineecourseId: string;
  course?: string;
  duration?: number;
  list: PaymentRecord[];
  totalRecord: number;
  totalPaidAmount: number;
  totalDiscount: number;
  totalTds: number;
  fees: number;
  pendingFees: number;
};

const FeeHistory = () => {
  const { getValues } = useFormContext<ProfileFormData>();
  const [groups, setGroups] = useState<CourseFeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CourseFeeGroup | null>(null);

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
      const d = response.data.data;
      const list = Array.isArray(d) ? d : Array.isArray(d?.list) ? d.list : [];
      setGroups(list as CourseFeeGroup[]);
    } else {
      toasterrormsg(response?.data?.message || "Failed to load fee history");
    }
    setLoading(false);
  };

  useEffect(() => {
    feeHistoryApiCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-foreground/[0.05] animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-foreground/[0.05] animate-pulse" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
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

  // Aggregate totals across all courses for the top summary cards.
  const totals = groups.reduce(
    (acc, g) => ({
      paid: acc.paid + (g.totalPaidAmount || 0),
      discount: acc.discount + (g.totalDiscount || 0),
      tds: acc.tds + (g.totalTds || 0),
    }),
    { paid: 0, discount: 0, tds: 0 },
  );

  const summary = [
    { label: "Total Paid", value: totals.paid, icon: IndianRupee, from: "from-primary", to: "to-primary-light" },
    { label: "Total Discount", value: totals.discount, icon: TicketPercent, from: "from-emerald-400", to: "to-emerald-600" },
    { label: "Total TDS", value: totals.tds, icon: ReceiptText, from: "from-amber-400", to: "to-amber-600" },
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

      {/* Course list — click a course to view its payment history */}
      <div className="space-y-3">
        {groups.map((g, idx) => {
          const paidPct = g.fees
            ? Math.min(100, Math.round((g.totalPaidAmount / g.fees) * 100))
            : 0;
          return (
            <motion.button
              key={g.traineecourseId ?? idx}
              type="button"
              onClick={() => setSelected(g)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="w-full text-left bg-white/[0.55] border border-white/[0.7] rounded-2xl p-4 hover:bg-white/[0.75] hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">
                      {g.course || "—"}
                      {g.duration != null && (
                        <span className="font-normal text-muted-foreground">
                          {" "}({formatDuration(g.duration)})
                        </span>
                      )}
                    </p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-auto group-hover:translate-x-0.5 group-hover:text-primary transition-transform" />
                  </div>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                    <Receipt className="w-3.5 h-3.5" />
                    {g.totalRecord} payment{g.totalRecord === 1 ? "" : "s"}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-foreground/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>

                  {/* Per-course figures */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white/[0.6] py-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Fees</p>
                      <p className="text-[13px] font-bold text-foreground">{rupees(g.fees || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/[0.08] py-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Paid</p>
                      <p className="text-[13px] font-bold text-emerald-600">{rupees(g.totalPaidAmount || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/[0.08] py-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
                      <p className="text-[13px] font-bold text-amber-600">{rupees(g.pendingFees || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Payment history modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-6">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              <span className="truncate">{selected?.course}</span>
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {selected?.duration != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(selected.duration)}
                </span>
              )}
              <span>Total Fees: {rupees(selected?.fees || 0)}</span>
              <span className="text-emerald-600">Paid: {rupees(selected?.totalPaidAmount || 0)}</span>
              <span className="text-amber-600">Pending: {rupees(selected?.pendingFees || 0)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-foreground/[0.08]">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="sticky top-0 z-10 bg-gray-200 px-3 py-2.5 font-semibold">Sr No.</th>
                  <th className="sticky top-0 z-10 bg-gray-200 px-3 py-2.5 font-semibold">Date</th>
                  <th className="sticky top-0 z-10 bg-gray-200 px-3 py-2.5 font-semibold text-right">Discount</th>
                  <th className="sticky top-0 z-10 bg-gray-200 px-3 py-2.5 font-semibold text-right">TDS</th>
                  <th className="sticky top-0 z-10 bg-gray-200 px-3 py-2.5 font-semibold text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {selected?.list?.map((r, idx) => (
                  <tr
                    key={r.paymenthistoryId ?? idx}
                    className="border-t border-foreground/[0.06] hover:bg-foreground/[0.02] transition-colors"
                  >
                    <td className="px-3 py-2.5 text-[13px] font-semibold text-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        {r.paymentDate ? dateFirstFormat(r.paymentDate) : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-muted-foreground text-right">
                      {r.discount ? rupees(r.discount) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-muted-foreground text-right">
                      {r.tds ? rupees(r.tds) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-bold text-foreground text-right">
                      {r.paidAmount != null ? rupees(r.paidAmount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-[13px] font-bold text-foreground">
                  <td className="sticky bottom-0 z-10 bg-gray-200 border-t border-foreground/[0.1] px-3 py-2.5" colSpan={2}>Total ({selected?.totalRecord || 0})</td>
                  <td className="sticky bottom-0 z-10 bg-gray-200 border-t border-foreground/[0.1] px-3 py-2.5 text-right">{rupees(selected?.totalDiscount || 0)}</td>
                  <td className="sticky bottom-0 z-10 bg-gray-200 border-t border-foreground/[0.1] px-3 py-2.5 text-right">{rupees(selected?.totalTds || 0)}</td>
                  <td className="sticky bottom-0 z-10 bg-gray-200 border-t border-foreground/[0.1] px-3 py-2.5 text-right text-emerald-600">{rupees(selected?.totalPaidAmount || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeHistory;
