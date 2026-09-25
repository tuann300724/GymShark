'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Dumbbell, MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

const QUICK_LINKS = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Gói tập', href: '/packages' },
  { name: 'Huấn luyện viên', href: '/trainers' },
  { name: 'Lịch tập', href: '/schedule' },
  { name: 'Blog', href: '/blog' },
  { name: 'Liên hệ', href: '/contact' },
];

const SERVICE_LINKS = [
  { name: 'Đăng ký hội viên', href: '/register' },
  { name: 'Đăng nhập', href: '/login' },
  { name: 'Về GymMaster', href: '/about' },
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
    <footer className="border-t border-line bg-ink">
      <div className="container-x py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-sm border border-neon/40 bg-surface text-neon">
                <Dumbbell className="size-[18px]" />
              </span>
              <span className="font-display text-xl font-bold uppercase leading-none tracking-wide text-chalk">
                GYM<span className="text-neon">MASTER</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Hệ thống phòng gym chuyên nghiệp với thiết bị hiện đại và đội ngũ huấn luyện viên giàu
              kinh nghiệm. Đồng hành cùng bạn sau mỗi buổi tập.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              {[
                { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
                { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                { Icon: Youtube, label: 'Youtube', href: 'https://youtube.com' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-sm border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon"
                  aria-label={label}
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="meta-label mb-4 !text-chalk">Liên kết nhanh</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-neon"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="meta-label mb-4 !text-chalk">Dịch vụ</h4>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-neon"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/packages"
                  className="text-sm text-muted transition-colors hover:text-neon"
                >
                  Gói tập & giá
                </Link>
              </li>
              <li>
                <Link
                  href="/schedule"
                  className="text-sm text-muted transition-colors hover:text-neon"
                >
                  Lịch lớp học
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="meta-label mb-4 !text-chalk">Liên hệ</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-neon" />
                <span className="text-muted">
                  {address}
                  {branch?.name ? ` (${branch.name})` : ''}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-neon" />
                <a href={`tel:${phone}`} className="text-muted transition-colors hover:text-neon">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-neon" />
                <a
                  href={`mailto:${email}`}
                  className="break-all text-muted transition-colors hover:text-neon"
                >
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} GymMaster Pro Fitness Center. Bảo lưu mọi quyền.
          </p>
          <p className="text-xs text-muted/70">Train hard. Stay consistent.</p>
        </div>
      </div>
    </footer>
  );
}
