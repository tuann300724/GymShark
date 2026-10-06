import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard khởi động luồng Google OAuth (redirect sang Google + xử lý callback). */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
