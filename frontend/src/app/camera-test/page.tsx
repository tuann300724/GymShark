'use client';

import React, { useEffect, useState } from 'react';

/** Trang chẩn đoán tạm — KHÔNG dùng trong production, sẽ xoá sau khi QA camera xong */
export default function CameraTestPage() {
  const [lines, setLines] = useState<string[]>(['...']);

  useEffect(() => {
    const run = async () => {
      const out: string[] = [];
      const md = navigator.mediaDevices;
      if (!md) {
        out.push('FAIL: navigator.mediaDevices undefined (không phải secure context?)');
        setLines(out);
        return;
      }
      try {
        const p = await md.getUserMedia({ audio: false, video: true });
        const t = p.getVideoTracks()[0];
        out.push(`DEFAULT OK → "${t.label}" ${JSON.stringify(t.getSettings())}`);
        p.getTracks().forEach((tr) => tr.stop());
      } catch (e) {
        out.push(`DEFAULT FAIL → ${(e as Error).name}: ${(e as Error).message}`);
      }
      try {
        const perm = await navigator.permissions.query({ name: 'camera' as PermissionName });
        out.push(`permission.state=${perm.state}`);
      } catch (e) {
        out.push(`permission query FAIL → ${(e as Error).message}`);
      }
      const devs = await md.enumerateDevices();
      const videos = devs.filter((d) => d.kind === 'videoinput');
      out.push(`videoinput=${videos.length}`);
      for (const d of videos) {
        out.push(`- id="${d.deviceId}" label="${d.label}"`);
        try {
          const s = await md.getUserMedia({ video: { deviceId: d.deviceId }, audio: false });
          const t = s.getVideoTracks()[0];
          out.push(`  OK → "${t.label}" ${JSON.stringify(t.getSettings())}`);
          s.getTracks().forEach((tr) => tr.stop());
        } catch (e) {
          out.push(`  FAIL → ${(e as Error).name}: ${(e as Error).message}`);
        }
      }
      setLines(out);
    };
    void run();
  }, []);

  return (
    <main className="min-h-screen bg-ink p-6 font-mono text-sm text-chalk">
      <h1 className="mb-4 font-sans text-lg font-semibold">CAMERA TEST (tạm)</h1>
      <pre className="whitespace-pre-wrap">{lines.join('\n')}</pre>
    </main>
  );
}
