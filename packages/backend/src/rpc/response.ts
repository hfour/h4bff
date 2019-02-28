import { Response } from 'express';

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
    const escapedFilename = encodeURIComponent(this.fileName);
    res.status(code);
    res.setHeader('Content-disposition', `attachment; filename*=UTF-8\'\'${escapedFilename}`);
    res.write(this.buffer, 'binary');
    res.end(null, 'binary');
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
    res.status(this.code).json({
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

export interface CustomResponse {
  sendToHTTPResponse(res: Response, code: number): void;
}

export function isCustomResponse(data: any): data is CustomResponse {
  return data != null && typeof data.sendToHTTPResponse === 'function';
}
