export const CHUNK_SIZE = 800; // recommended
export const CHUNK_OVERLAP = 150; // recommended

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
