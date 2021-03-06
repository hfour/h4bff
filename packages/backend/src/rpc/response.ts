import { Response } from 'express';
import * as contentDisposition from 'content-disposition';

export interface IRPCFileResult {
  fileName: string;
  buffer: Buffer;
}

export interface IRPCErrorLikeResult {
  code: number;
  message: string;
  result?: any;
}

/**
 * Used for describing RPC calls which return a file (for example, DownloadDocx, DownloadPDF)
 */
export class RPCFileResult implements CustomResponse, IRPCFileResult {
  constructor(public fileName: string, public buffer: Buffer) {}

  sendToHTTPResponse(res: Response, code: number) {
    res.status(code);
    res.setHeader('Content-disposition', contentDisposition(this.fileName));
    res.write(this.buffer, 'binary');
    res.end(null, 'binary');
    return res;
  }
}

/**
 * Used to return an error to callers, but doesn't actually result in error semantics
 * on the backend.
 */
export class ErrorLikeResult implements CustomResponse, IRPCErrorLikeResult {
  constructor(public code: number, public message: string, public result: any = null) {}

  sendToHTTPResponse(res: Response, _code: number) {
    // We're ignoring the success code sent here, and sending the code from the object.
    return res.status(this.code).json({
      code: this.code,
      result: this.result,
      error: {
        code: this.code,
        message: this.message,
      },
      backendError: false,
    });
  }
}

/**
 * Represents custom response.
 */
export interface CustomResponse {
  sendToHTTPResponse(res: Response, code: number): void;
}

/**
 * Checks if a given response implements the {@link CustomResponse} interface.
 */
export function isCustomResponse(data: any): data is CustomResponse {
  return data != null && typeof data.sendToHTTPResponse === 'function';
}
