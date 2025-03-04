export class HttpException extends Error {
  message: string;
  errorCode: ErrorCode;
  statusCode: number;
  details: any;

  constructor(errorCode: ErrorCode, statusCode: number, deteails: any = null) {
    super("");
    this.message = ErrorMessage[`M_${errorCode}` as keyof typeof ErrorMessage] || "Unknown error occurred";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = deteails;
  }
}

export enum ErrorCode {
  GENERAL_EXCEPTION_100 = 1000,
  INVALID_DATA_400 = 4000,
  UNAUTHORIZED_ACCESS_401 = 4001,
  ALREADY_EXIST_403 = 4003,
  FAILED_REFRESH_TOKEN_403 = 4033,
  NOT_FOUND_404 = 4004,
  UNAUTHORIZED_401,
}

export enum ErrorMessage {
  M_1000 = "Something goes Wrong. Try again",
  M_4000 = "Invalid data",
  M_4001 = "Unauthorized access",
  M_4003 = "This credentials alreasy exist",
  M_4033 = "Refresh token is invalid or not exist",
  M_4004 = "This credentials not exist",
}
