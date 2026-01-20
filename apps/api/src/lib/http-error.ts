export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

/** Foreign and missing ids both return 404. */
export function notFound(resource: string): HttpError {
  return new HttpError(404, 'NOT_FOUND', `${resource} not found`)
}

export function badRequest(code: string, message: string): HttpError {
  return new HttpError(400, code, message)
}

export function conflict(code: string, message: string): HttpError {
  return new HttpError(409, code, message)
}

export function unprocessable(code: string, message: string): HttpError {
  return new HttpError(422, code, message)
}
