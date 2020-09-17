import { AppSingleton } from '@h4bff/core';

export type ErrorResponse = { code: number; message: string; data?: any };
export type ErrorHandler = (e: Error) => ErrorResponse | undefined;

/**
 * RPC error handler container. Keeps all registered error handlers for RPC calls.
 */
export class RPCErrorHandlers extends AppSingleton {
  private errorHandlers: ErrorHandler[] = [];

  /**
   * Registers new error handler in a stack like order.
   *
   * @param handler function that accepts and test {@link Error} object. Return {@link ErrorResponse} if it handles the {@link Error} and `undefined` otherwise
   * @returns {@link ErrorResponse} or {undefined}
   */
  addErrorHandler(handler: ErrorHandler) {
    this.errorHandlers.unshift(handler);
  }

  /**
   * Iterates over all registered handlers in a stack-like order and executes them. Stops at the first handler that can handle the error. Returns {undefined} if no handler is able to handle the error.
   *
   * @returns {@link ErrorResponse} or {undefined}
   */
  handle(error: Error) {
    for (let handler of this.errorHandlers) {
      let handled = handler(error);
      if (handled) {
        return handled;
      }
    }
  }
}
