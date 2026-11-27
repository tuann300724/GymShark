import type { Prisma, PrismaClient } from "@prisma/client";

/** Ảnh đại diện dạng data URL (đã nén ở trình duyệt) */
export const AVATAR_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
/** ~300KB dữ liệu ảnh sau base64 — ảnh đại diện nén cạnh dài ≤ 512px thường chỉ 30–80KB */
export const MAX_AVATAR_DATA_URL_LENGTH = 400_000;

export const isAvatarDataUrl = (value: unknown): value is string =>
  typeof value === "string" && AVATAR_DATA_URL_PATTERN.test(value);

/** Gốc URL công khai của backend (ảnh đại diện được nhúng từ frontend khác origin) */
const backendBase = () =>
  (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`).replace(
    /\/$/,
    "",
  );

/**
 * Lưu ảnh đại diện tải lên vào UserAvatar và trả về URL ngắn để gán User.avatarUrl.
 * `?v=` đổi theo mỗi lần lưu để trình duyệt không dùng ảnh cache cũ.
 */
export async function saveUserAvatar(
  db: PrismaClient | Prisma.TransactionClient,
  userId: string,
  dataUrl: string,
): Promise<string> {
  await db.userAvatar.upsert({
    where: { userId },
    create: { userId, dataUrl },
    update: { dataUrl },
  });
  return `${backendBase()}/api/public/avatars/${encodeURIComponent(userId)}?v=${Date.now()}`;
}
