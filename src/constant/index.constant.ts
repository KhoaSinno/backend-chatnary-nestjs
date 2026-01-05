export const PARENT_CHUNK_SIZE = 3000;
export const PARENT_CHUNK_OVERLAP = 300;

export const CHILD_CHUNK_SIZE = 900;
export const CHILD_CHUNK_OVERLAP = 150;

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

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
