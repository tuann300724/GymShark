"use client";

import React, { useCallback, useState } from "react";
import { FaceScanner } from "@/components/ui/face-scanner";
import { Loader2, CheckCircle2, AlertCircle, DoorOpen, DoorClosed } from "lucide-react";
import apiClient from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function FaceCheckinPage() {
  const [status, setStatus] = useState<"idle" | "checking" | "in" | "out" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [scanKey, setScanKey] = useState(0);

  const show = useCallback((s: typeof status, m: string) => {
    setStatus(s);
    setMsg(m);
  }, []);

  const handleCapture = useCallback(
    async (embedding: number[]) => {
      if (status === "checking") return;
      setStatus("checking");
      setMsg("Đang xác nhận khuôn mặt…");

      try {
        const curRes = await apiClient.get("/checkins/me/current");
        const isInside = !!curRes.data?.checkIn;

        if (isInside) {
          const outRes = await apiClient.post("/checkins/checkout");
          const name = outRes.data?.member?.fullName || outRes.data?.fullName || "";
          show("out", `✅ Check-out thành công — ${name || "Hội viên"}`);
        } else {
          const inRes = await apiClient.post("/checkins/face", { embedding });
          const name = inRes.data?.member?.fullName || inRes.data?.fullName || "";
          show("in", `✅ Check-in thành công — ${name || "Hội viên"}`);
        }
      } catch (e: any) {
        const m = e?.response?.data?.message || e?.message || "Không xác nhận được";
        show("error", `❌ ${m}`);
      } finally {
        setTimeout(() => setScanKey((k) => k + 1), 2200);
      }
    },
    [status, show]
  );

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--chalk)] flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl tracking-tight text-[var(--ink)] bg-[var(--neon)] inline-block px-4 py-2 mb-2">
          Quét mặt — Check In / Check Out
        </h1>
        <p className="text-[var(--muted)] text-sm mb-8">Nhìn thẳng vào camera. Hệ thống tự nhận diện và ghi nhận thời gian tập.</p>

        <div className={cn("rounded-2xl overflow-hidden border-2 border-[var(--line)] shadow-2xl bg-[var(--surface)]", status === "in" ? "ring-4 ring-emerald-500/30" : status === "out" ? "ring-4 ring-amber-500/30" : "")}>
          <FaceScanner
            key={scanKey}
            mode="verify"
            onCapture={handleCapture}
            onError={(msg) => show("error", `Camera: ${msg}`)}
          />
        </div>

        <div className="mt-6 min-h-[3.5rem] flex items-center gap-3 text-lg font-medium">
          {status === "idle" && <Loader2 className="w-6 h-6 animate-spin text-[var(--neon)]" />}
          {(status === "in" || status === "out") && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          {status === "error" && <AlertCircle className="w-6 h-6 text-rose-400" />}
          <span className={cn("transition-colors", status === "in" ? "text-emerald-300" : status === "out" ? "text-amber-300" : status === "error" ? "text-rose-300" : "text-[var(--chalk)]")}>
            {msg || (status === "checking" ? "Đang xử lý…" : "Sẵn sàng quét mặt")}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-3 flex items-center gap-3">
            <DoorClosed className="w-5 h-5 text-[var(--neon)]" />
            <div>
              <div className="text-[var(--muted)] text-xs">Vào phòng</div>
              <div className="font-semibold">Face Check-In</div>
            </div>
          </div>
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)] p-3 flex items-center gap-3">
            <DoorOpen className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[var(--muted)] text-xs">Ra phòng</div>
              <div className="font-semibold">Face Check-Out</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
