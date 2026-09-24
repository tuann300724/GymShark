'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, ShieldCheck, User, Globe, Key, Database } from 'lucide-react';

export default function SettingsPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/profile');
      return res.data;
    },
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-500" />
          Cài Đặt Hệ Thống & Hồ Sơ (Settings)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Quản lý thông tin tài khoản đăng nhập, quyền hạn RBAC và cấu hình máy chủ REST API
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              Tài Khoản Đang Đăng Nhập
            </CardTitle>
            <CardDescription>Chi tiết danh tính và vai trò phân quyền</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white uppercase text-lg">
                {profile?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{profile?.fullName || 'Người dùng'}</p>
                <p className="text-slate-400">{profile?.email || 'Chưa đăng nhập'}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Vai trò RBAC:</span>
                <Badge variant="success" className="font-mono">
                  {profile?.role || 'Chưa xác định'}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Chi nhánh trực thuộc:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profile?.branch?.name || 'Tất cả chi nhánh'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Trạng thái tài khoản:</span>
                <Badge variant="success">{profile?.status || 'ACTIVE'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server & API Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-500" />
              Cấu Hình Máy Chủ & Tích Hợp
            </CardTitle>
            <CardDescription>Thông số kết nối hạ tầng Backend REST API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Backend REST API Endpoint
              </span>
              <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Swagger OpenAPI Documentation
              </span>
              <a
                href="http://localhost:3001/api/docs"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sky-500 font-bold hover:underline block"
              >
                http://localhost:3001/api/docs ↗
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Cơ sở dữ liệu
              </span>
              <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" /> PostgreSQL 16 + Prisma ORM
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
