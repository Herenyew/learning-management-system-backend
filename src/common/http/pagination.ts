import { Request } from 'express';
import { config } from '../../config/index.js';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

/**
 * Parses and validates page/pageSize query params from an incoming
 * request. Clamps pageSize to config.pagination.maxPageSize so a
 * caller can't request an unbounded result set (e.g. ?pageSize=999999).
 *
 * Usage in a controller:
 *   const { page, pageSize, skip, take } = parsePagination(req);
 */
export function parsePagination(req: Request): PaginationParams {
  const rawPage = parseInt(req.query.page as string, 10);
  const rawPageSize = parseInt(req.query.pageSize as string, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : config.pagination.defaultPage;

  const requestedSize = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? rawPageSize
    : config.pagination.defaultPageSize;

  const pageSize = Math.min(requestedSize, config.pagination.maxPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Builds the `pagination` block used in every list-endpoint response,
 * per the API Design Standards (section 19.10):
 *
 *   { success: true, data: [...], pagination: { page, pageSize, totalRecords, totalPages } }
 *
 * Usage in a service, after fetching both the page of rows and the
 * total count:
 *   return { data, pagination: buildPaginationMeta(page, pageSize, totalRecords) };
 */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalRecords: number
): PaginationMeta {
  return {
    page,
    pageSize,
    totalRecords,
    totalPages: pageSize > 0 ? Math.ceil(totalRecords / pageSize) : 0,
  };
}