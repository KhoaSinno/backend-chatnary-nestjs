export const CHUNK_SIZE = 1000; // recommended
export const CHUNK_OVERLAP = 200; // recommended

// Authorization

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  LIBRARIAN = 'LIBRARIAN',
  GUEST = 'GUEST',
}

export enum AccessLevelDoc {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED',
}
