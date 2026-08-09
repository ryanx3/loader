import { INotification } from "./interfaces/notification.types";

export class NotificationService {
  constructor(private channels: Record<string, INotification<any>>) {}

  send<T>(channel: string, payload: T) {
    const handler = this.channels[channel];

    if (!handler) {
      throw new Error(`Channel ${channel} not supported`);
    }

    return handler.send(payload);
  }
}
