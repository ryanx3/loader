export interface INotification<T> {
  send(payload: T): Promise<void>;
}
