// Define common types for API responses and requests
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  details?: string;
  status?: number;
};

// Define a type for error handling
export type ErrorWithMessage = {
  message: string;
};

// Helper function to handle errors
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Helper function to get error message
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
} 