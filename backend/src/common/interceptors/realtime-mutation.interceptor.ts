import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Request } from "express";
import { Observable, tap } from "rxjs";

@Injectable()
export class RealtimeMutationInterceptor implements NestInterceptor {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method))
      return next.handle();

    const routePath = request.route?.path;
    const resource =
      typeof routePath === "string"
        ? `${request.baseUrl}${routePath}`
        : "unknown";
    if (/\/auth\/(login|refresh|logout)$/i.test(resource)) return next.handle();

    let emitted = false;
    const emitMutation = () => {
      if (emitted) return;
      emitted = true;
      this.eventEmitter.emit("realtime.mutation.completed", {
        method,
        resource,
        occurredAt: new Date().toISOString(),
      });
    };

    return next.handle().pipe(
      tap({
        next: emitMutation,
        complete: emitMutation,
      }),
    );
  }
}
