import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * Global exception filter — thống nhất format lỗi trả về:
 * { statusCode, message, error, path, timestamp }
 *
 * - Giữ nguyên shape chuẩn của NestJS (HttpException / ValidationPipe) để FE không phải đổi.
 * - KHÔNG expose stack trace / thông tin database / secret ra ngoài.
 * - Lỗi 5xx được log chi tiết phía server (log file / console) và trả message thân thiện.
 * - Bản đồ lỗi Prisma KnownRequestError sang HTTP status phù hợp (P2002 -> 409, P2025 -> 404, P2003 -> 400).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Đã có lỗi xảy ra, vui lòng thử lại sau';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else {
        const r = body as Record<string, unknown>;
        message = (r.message as string | string[]) ?? exception.message;
        error = (r.error as string) ?? exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Dữ liệu đã tồn tại (vi phạm ràng buộc duy nhất)';
        error = 'Conflict';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy bản ghi yêu cầu';
        error = 'Not Found';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Dữ liệu tham chiếu không hợp lệ';
        error = 'Bad Request';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Dữ liệu gửi lên không hợp lệ';
      error = 'Bad Request';
    }

    // Chỉ log đầy đủ cho lỗi từ phía server (5xx); 4xx là lỗi client, không cần stack.
    if (status >= 500) {
      this.logger.error(
        `[${request.method} ${request.url}] ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Không gửi metadata nhạy cảm ra ngoài — chỉ các trường tiêu chuẩn.
    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}