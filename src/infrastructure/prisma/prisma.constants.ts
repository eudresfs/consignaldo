// src/infrastructure/prisma/prisma.constants.ts
export const PRISMA_ERRORS = {
    UNIQUE_CONSTRAINT: 'P2002',
    FOREIGN_KEY_CONSTRAINT: 'P2003',
    REQUIRED_RELATION: 'P2014',
    RECORD_NOT_FOUND: 'P2025',
  } as const;