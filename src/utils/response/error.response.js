export const errorResponse = ({ message, statusCode }) => {
  const error = new Error();

  error.statusCode = statusCode;
  error.message = typeof message === "string" ? message : message.message;

  throw error;
};

export const ConflictException = (message) => {
  return errorResponse({ message, statusCode: 409 });
};

export const NotFoundException = (message) => {
  return errorResponse({ message, statusCode: 404 });
};

export const BadRequestException = (message) => {
  return errorResponse({ message, statusCode: 400 });
};

export const UnauthorizedException = (message) => {
  return errorResponse({ message, statusCode: 401 });
};

export const ForbiddenException = (message) => {
  return errorResponse({ message, statusCode: 403 });
};

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.log({err});
  
  return res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: err.stack || undefined,
  });
};
