'use client';

import NotificationListView from '@/components/notifications/notification-list-view';

export default function TrainerNotificationsPage() {
  return (
    <NotificationListView
      pageTitle="Thông báo"
      pageDesc="Cập nhật về lịch dạy, hội viên phụ trách và hệ thống của bạn."
      queryPrefix="trainer"
      refreshExtra={['trainer-notif-badge']}
    />
  );
}
