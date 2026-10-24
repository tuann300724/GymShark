"use client";

import React, { useCallback, useState } from "react";
import { FaceScanner } from "@/components/ui/face-scanner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function AdminFaceScanPage() {
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [scanKey, setScanKey] = useState(0);

  const handleCapture = useCallback(async (embedding: number[]) => {
    if (status === "checking") return;
    setStatus("checking");
    setMsg("Đang quét khuôn mặt 1:N…");
    try {
      const res = await apiClient.post("/checkins/face-scan", { embedding });
      const name = res.data?.member?.fullName || res.data?.fullName || "";
      setStatus("done");
      setMsg(`✅ Đã nhận diện — ${name || "Hội viên"}`);
    } catch (e: any) {
      const m = e?.response?.data?.message || e?.message || "Không nhận diện được";
      setStatus("error");
      setMsg(`❌ ${m}`);
    } finally {
      setTimeout(() => setScanKey((k) => k + 1), 2500);
    }
  }, [status]);

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--chalk)] flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-tight text-[var(--ink)] bg-[var(--neon)] inline-block px-4 py-2 mb-2">Quét mặt lễ tân — 1:N</h1>
        <p className="text-[var(--muted)] text-sm mb-6">Nhìn vào camera — hệ thống tự nhận diện hội viên và ghi nhận check-in.</p>
        <div className={cn("rounded-2xl overflow-hidden border-2 border-[var(--line)] shadow-2xl bg-[var(--surface)]", status === "done" ? "ring-4 ring-emerald-500/30" : status === "error" ? "ring-4 ring-rose-500/30" : "")}>
          <FaceScanner key={scanKey} mode="verify" onCapture={handleCapture} onError={(m) => { setStatus("error"); setMsg(`Camera: ${m}`); }} />
        </div>
        <div className="mt-6 min-h-[3rem] flex items-center gap-3 text-lg font-medium">
          {status === "idle" && <Loader2 className="w-6 h-6 animate-spin text-[var(--neon)]" />}
          {status === "done" && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          {status === "error" && <AlertCircle className="w-6 h-6 text-rose-400" />}
          <span className={cn("transition-colors", status === "done" ? "text-emerald-300" : status === "error" ? "text-rose-300" : "text-[var(--chalk)]")}>{msg || (status === "checking" ? "Đang nhận diện…" : "Sẵn sàng quét")}</span>
        </div>
      </div>
    </main>
  );
}
