import { PaginatedResult } from '../../types/common.types';

export interface IBaseRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(page?: number, limit?: number): Promise<PaginatedResult<T>>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
} 