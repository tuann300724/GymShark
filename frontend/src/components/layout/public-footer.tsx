'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Flame, MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

const QUICK_LINKS = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Giới thiệu', href: '/about' },
  { name: 'Gói tập', href: '/packages' },
  { name: 'Huấn luyện viên', href: '/trainers' },
  { name: 'Lịch tập', href: '/schedule' },
  { name: 'Liên hệ', href: '/contact' },
];

const SERVICE_LINKS = [
  { name: 'Đăng ký hội viên', href: '/register' },
  { name: 'Đăng nhập', href: '/login' },
];

export function PublicFooter() {
  const { data: branches } = useQuery({
    queryKey: ['public-branches'],
    queryFn: publicApi.getBranches,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const branch = branches?.[0];
  const address = branch?.address || 'Khu Công nghệ Phần mềm, Đồng Nai';
  const phone = branch?.phone || '1900 1009';
  const email = branch?.email || 'lienhe@gymmaster.vn';

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <Flame className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="font-black tracking-tight text-white text-lg">
                  GYM<span className="text-emerald-500">MASTER</span>
                </p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Pro Fitness Center
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hệ thống phòng gym chuyên nghiệp với trang thiết bị hiện đại, đội ngũ huấn luyện viên giàu kinh
              nghiệm. Đồng hành cùng bạn trên mọi hành trình fitness.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Dịch vụ</h4>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/packages" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Gói tập & giá
                </Link>
              </li>
              <li>
                <Link href="/trainers" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Huấn luyện viên PT
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                  Lịch lớp học
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Liên hệ</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-slate-400">
                  {address || branch?.name || 'Hệ thống GymMaster Pro'}
                  {branch?.name ? ` (${branch.name})` : ''}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <a href={`tel:${phone}`} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <a href={`mailto:${email}`} className="text-slate-400 hover:text-emerald-400 transition-colors">
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} GymMaster Pro Fitness Center. Bảo lưu mọi quyền.
          </p>
          <p className="text-xs text-slate-600">Khỏe hơn mỗi ngày 💪</p>
        </div>
      </div>
    </footer>
  );
}