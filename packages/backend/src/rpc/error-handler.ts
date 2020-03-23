import { AppSingleton } from '@h4bff/core';

type jsonErrorResponse = { code: number; message: string; data?: any };
type errorHandler = (e: Error) => jsonErrorResponse;

/**
 * Singleton for adding error handlers used in `RPCDispatcher.call()`
 */
export class RPCErrorHandlers extends AppSingleton {
  private errorHandlers: errorHandler[] = [];

  /**
   * Function that can test Error object, and if it should handle it - returns code and message
   * @param handler function that accepts `Error` to test
   * @returns optionally `{ code: number; message: string; data?: any }`
   */
  addErrorHandler(handler: errorHandler) {
    this.errorHandlers.push(handler);
  }

  /**
   * Cycles through all registered handlers and executes them.
   * @returns the result of the first handler that returns `{ code: number; message: string; data?: any }`
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
