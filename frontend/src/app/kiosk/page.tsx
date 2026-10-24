"use client";

import React, { useCallback, useState } from "react";
import { FaceScanner } from "@/components/ui/face-scanner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "@/lib/axios";
import { cn } from "@/lib/utils";

export default function KioskFacePage() {
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [memberInfo, setMemberInfo] = useState<{ name: string; code: string } | null>(null);
  const [scanKey, setScanKey] = useState(0);

  const handleCapture = useCallback(async (embedding: number[]) => {
    if (status === "checking") return;
    setStatus("checking");
    setMsg("Đang nhận diện khuôn mặt 1:N…");
    try {
      const res = await apiClient.post("/checkins/face-scan", { embedding });
      const info = {
        name: res.data?.data?.member?.fullName || res.data?.member?.fullName || res.data?.fullName || "",
        code: res.data?.data?.member?.code || res.data?.member?.code || res.data?.code || "",
      };
      setMemberInfo(info);
      setStatus("done");
      setMsg(`✅ Check-in thành công — anh ${info.name || "Hội viên"}`);
    } catch (eIn: any) {
      const inMsg = eIn?.response?.data?.message || "";
      if (inMsg && inMsg.includes("trong phòng")) {
        try {
          const outRes = await apiClient.post("/checkins/face-checkout", { embedding });
          const infoOut = {
            name: outRes.data?.data?.member?.fullName || outRes.data?.member?.fullName || outRes.data?.fullName || "",
            code: outRes.data?.data?.member?.code || outRes.data?.member?.code || outRes.data?.code || "",
          };
          setMemberInfo(infoOut);
          setStatus("done");
          setMsg(`✅ Check-out thành công — anh ${infoOut.name || "Hội viên"}`);
          return;
        } catch (eOut: any) {
          const outMsg = eOut?.response?.data?.message || eOut?.message || "Không nhận diện được";
          setStatus("error");
          setMsg(`❌ ${outMsg}`);
          return;
        }
      }
      const m = eIn?.response?.data?.message || eIn?.message || "Không nhận diện được";
      setStatus("error");
      setMsg(`❌ ${m}`);
    } finally {
      setTimeout(() => {
        setScanKey((k) => k + 1);
        setStatus("idle");
        setMsg("");
        setMemberInfo(null);
      }, 3000);
    }
  }, [status]);

  return (
    <main className="min-h-[100dvh] bg-[#0B0D0F] text-[var(--chalk)] flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl text-center mb-6">
        <h1 className="font-[family-name:var(--font-heading)] text-5xl md:text-7xl tracking-tighter text-neutral-200 drop-shadow-lg mb-2">QUÉT MẶT</h1>
        <p className="text-neutral-400 text-base md:text-lg">Nhìn thẳng vào camera — hệ thống tự nhận diện hội viên và ghi nhận</p>
      </div>

      <div className={cn("w-full max-w-3xl rounded-3xl overflow-hidden border-2 border-neutral-700 shadow-[0_0_80px_-20px_#B7FF00] bg-[#141618]", status === "done" ? "ring-4 ring-emerald-500/30" : status === "error" ? "ring-4 ring-rose-500/30" : "")}>
        <FaceScanner
          key={scanKey}
          mode="verify"
          onCapture={handleCapture}
          onError={(m) => { setStatus("error"); setMsg(`Camera: ${m}`); }}
        />
      </div>

      <div className="mt-6 min-h-[3.5rem] flex items-center justify-center gap-3 text-xl font-bold">
        {status === "idle" && <Loader2 className="w-7 h-7 animate-spin text-[#B7FF00]" />}
        {status === "done" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
        {status === "error" && <AlertCircle className="w-8 h-8 text-rose-400" />}
        <span className={cn("text-center", status === "done" ? "text-emerald-300" : status === "error" ? "text-rose-300" : "text-neutral-200")}>{msg || (status === "checking" ? "Đang nhận diện…" : "Sẵn sàng quét")}</span>
      </div>

      {memberInfo && (
        <div className="mt-4 w-full max-w-md rounded-2xl bg-gradient-to-br from-[#1a1c1f] to-[#0B0D0F] border border-neutral-700 px-6 py-5 text-center shadow-2xl">
          <div className="text-neutral-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Hội viên nhận diện</div>
          <div className="font-[family-name:var(--font-heading)] text-5xl md:text-6xl text-[#B7FF00] leading-none mb-1">{memberInfo.name}</div>
          <div className="text-neutral-300 text-lg font-mono">{memberInfo.code}</div>
        </div>
      )}
    </main>
  );
}
