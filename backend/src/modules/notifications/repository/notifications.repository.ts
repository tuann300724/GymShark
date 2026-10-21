export interface NotificationRow {
  id: string;
  userId: string | null;
  memberId: string | null;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  link: string | null;
  referenceType: string | null;
  referenceId: string | null;
  data: any | null;
  createdAt: Date;
}

export interface NotificationRepository {
  create(input: any): Promise<string>;
  createMany(inputs: any[]): Promise<number>;
  findFirst(where: any): Promise<NotificationRow | null>;
  findMany(where: any, opts?: { take?: number }): Promise<NotificationRow[]>;
  count(where: any): Promise<number>;
  findOne(id: string): Promise<NotificationRow | null>;
  update(id: string, data: any): Promise<void>;
  updateMany(where: any, data: any): Promise<number>;
  delete(id: string): Promise<void>;
  adminList(query?: any): Promise<{ data: NotificationRow[]; total: number; unreadCount: number }>;
}

/** Alias giữ tương thích tên import trong service/module. */
export type NotificationsRepository = NotificationRepository;
