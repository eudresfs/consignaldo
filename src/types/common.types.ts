export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ErrorResponse {
  message: string;
  code: string;
  details?: any;
} 