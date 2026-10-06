import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  provider: 'GOOGLE';
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

/**
 * Strategy Google OAuth 2.0 — chỉ lấy email + họ tên + ảnh đại diện
 * (scope `email profile`, không xin quyền nhạy cảm nên không cần Google xét duyệt).
 *
 * Nếu thiếu GOOGLE_CLIENT_ID/SECRET (máy chưa cấu hình) thì strategy vẫn khởi tạo
 * với giá trị giả + warn log để app không crash — luồng /auth/google sẽ lỗi rõ
 * lúc chạy thay vì sập cả backend lúc boot.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET')?.trim();

    if (!clientID || !clientSecret || clientID === 'CHANGE_ME') {
      Logger.warn(
        'Chưa cấu hình GOOGLE_CLIENT_ID/SECRET — đăng nhập Google sẽ báo lỗi cho tới khi thêm key.',
        GoogleStrategy.name,
      );
    }

    super({
      clientID: clientID && clientID !== 'CHANGE_ME' ? clientID : 'missing-client-id',
      clientSecret: clientSecret && clientSecret !== 'CHANGE_ME' ? clientSecret : 'missing-client-secret',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL')?.trim() ||
        'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile?.emails?.[0]?.value?.toLowerCase?.() || '';
    const result: GoogleProfile = {
      provider: 'GOOGLE',
      providerId: profile?.id || '',
      email,
      fullName:
        profile?.displayName ||
        [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(' ') ||
        email,
      avatarUrl: profile?.photos?.[0]?.value,
    };
    done(null, result);
  }
}
