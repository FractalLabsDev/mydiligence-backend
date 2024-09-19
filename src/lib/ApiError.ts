import HttpStatusCodes from 'http-status-codes';

export default class APIError extends Error {
  // status code
  status: number;

  constructor(
    message = 'Unknown Error',
    status = HttpStatusCodes.INTERNAL_SERVER_ERROR,
  ) {
    super(message);

    this.status = status;
  }
}
