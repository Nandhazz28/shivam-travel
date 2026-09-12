const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export function parsePagination(query = {}) {
  let page = Number(query.page);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = Number(query.limit);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  limit = Math.min(limit, MAX_LIMIT);

  return { page, limit, skip: (page - 1) * limit };
}
