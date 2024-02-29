export class RouteHandlingError {
    private _httpStatusCode: number;
    private _message: string;

    public constructor(httpStatusCode: number, message: string) {
        this._httpStatusCode = httpStatusCode;
        this._message = message;
    }

    public get httpStatus() {
        return this._httpStatusCode;
    }

    public get message() {
        return this._message;
    }
}

/**
 * This is a generic function to handle all exceptions that should be returned
 * in case and endpoint fails in a simple and consistent way.
 * @param ex - Exception that was received in the catch block
 * @param file - File where the exception happened
 * @param msg - Optional message to be used or appended to any message already part of the exception.
 * @returns - Instance of RouteHandlingError that is easy to use when returning an error.
 */
export function RouteErrorFormatter(ex: any, file: string, msg?: string): RouteHandlingError {
    let message = '';
    let httpStatus = 500;

    if (ex instanceof RouteHandlingError) {
        httpStatus = ex.httpStatus;
    }

    if (ex instanceof RouteHandlingError || ex instanceof Error) {
        if (msg !== undefined) {
            message = `${msg}, ` + ex.message;
        } else {
            message = ex.message;
        }
    } else if (msg !== undefined) {
        message = msg;
    }

    let idx = file.lastIndexOf('/');
    file = file.substring(idx + 1);
    message = `${file}: ${message}`;

    return new RouteHandlingError(httpStatus, message);
}
