import { RPCDispatcher } from './dispatcher';
import { AppSingleton } from 'core';

type RequestListener = (req: RPCDispatcher, error: Error | null) => PromiseLike<void>;

export class RPCEvents extends AppSingleton {
  private listeners: RequestListener[] = [];

  onRequestComplete(listener: RequestListener) {
    this.listeners.push(listener);
  }

  requestComplete: RequestListener = (req, err) => {
    return Promise.all(this.listeners.map(l => l(req, err))).then(() => void 0);
  };
}
