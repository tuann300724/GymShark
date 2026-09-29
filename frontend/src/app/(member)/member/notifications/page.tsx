'use client';

import NotificationListView from '@/components/notifications/notification-list-view';

export default function MemberNotificationsPage() {
  return (
    <NotificationListView
      pageTitle="Thông báo"
      pageDesc="Cập nhật về hội viên, thanh toán và lịch tập của bạn."
      queryPrefix="member"
      refreshExtra={['member-notif-badge']}
    />
  );
}
