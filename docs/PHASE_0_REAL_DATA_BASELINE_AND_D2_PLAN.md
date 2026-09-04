# Phase 0 — Real-data Baseline and D2 Secure File Delivery Plan

**Repository:** backend-chatnary-nestjs  
**Audience:** fresher developer, reviewer, and implementation owner  
**Created:** 2026-09-04  
**Status:** Ready for review. D2 is planned only; do not implement it until this document is approved.

## 1. Why this phase exists

This project is being migrated from frontend runtime mock data to the live NestJS API. The initial work fixed authentication, projects, document upload, queue ingestion, and a first document-access slice. It also exposed a security problem: files stored under uploads are currently served by a public static route.

Phase 0 freezes the known system state and defines the next safe slice, D2: authenticated file preview/download. A developer must read this document before changing document controllers, response interceptor, static-serving configuration, or frontend document viewer code.

## 2. Scope and non-goals

### In scope

1. Record the old real-data migration plan and actual progress.
2. Define the D2 HTTP contract for a protected document file.
3. Define backend authorization, path safety, binary response, frontend blob preview, test, rollback, and release gates.
4. Remove public static serving only after the new contract is proved.

### Explicitly out of scope

- Chat migration and SSE.
- Full-text document search.
- OCR/parser quality improvements.
- Changing the database schema.
- Replacing the current token strategy.
- UI redesign.

These are later phases. Do not mix them into the D2 pull request.

## 3. Current verified baseline

| Domain | State | Evidence |
| --- | --- | --- |
| Backend branch | main is source of truth | local main contains current fixes; old dev was fast-forwarded locally to main |
| Auth | Live login/register/refresh/logout; browser identity is no longer fake | BE validation tests and FE build |
| Projects | Live create/list/update/delete with server-derived user ID | project DTO regression test; manual project creation |
| Upload | FE sends multipart field files plus JSON field data; BE returns documents and job IDs | document controller regression test |
| Ingest | BullMQ job, parser and PGVector run; max_pages zero bug fixed; empty chunks become ERROR | tested PDF completed with 38 chunks |
| Document access D1 | project owner/editor may upload; update is owner-managed; metadata is parsed and DTO-validated | commit 439aacf; 8 suites / 15 tests; Nest build |
| Preview/download | Not implemented securely; FE viewer is temporarily disabled | BE has no protected binary route |
| File storage | Files are stored below uploads/documents | multer disk storage |
| Static exposure | App currently serves the whole uploads directory at /uploads | app.module static-serving configuration |
| Redis | Development works but emits volatile-lru warning | must become noeviction before production queue acceptance |

### Commits already present

| Commit | Purpose | Notes |
| --- | --- | --- |
| 6101a76 | auth/project contract hardening | earlier verified baseline |
| 439aacf | document upload access and ingest status | D1 was implemented before this Phase 0 document existed |

D1 was implemented prematurely. Treat 439aacf as the checkpoint before D2, not as approval to continue D2 automatically.

## 4. Original migration plan, retained in order

The original plan remains valid. Each numbered item is a separately reviewable phase.

| Phase | Objective | Current state |
| --- | --- | --- |
| 0 | Freeze contracts, validate entrypoints, document risk | this document completes the missing planning record |
| 1 | One FE HTTP client, response-envelope decoder and wire mappers | partial implementation exists |
| 2 | Replace auth fake identity with live auth | implemented; needs automated browser coverage |
| 3 | Replace project mocks with live project API | implemented; needs expanded permission coverage |
| 4 | Replace document mocks with upload/list/delete and ingest state | in progress: D1 done, D2/D3/D4 remaining |
| 5 | Replace Chat list/history/messages mock data | planned; block on backend history contract repair |
| 6 | Remove runtime mocks and add CI quality gates | planned |

The detailed cross-repository migration runbook also exists in the frontend repository. This BE document is the authoritative planning record for the current backend security slice.

## 5. D2 problem statement

Today a browser can reach files through a public static path under /uploads. That bypasses:

- JWT authentication;
- project membership authorization;
- document ownership/public-access rules;
- audit/control over download behavior;
- safe disposition and content headers.

The frontend must never use raw stored paths. It must request a protected document resource with a bearer token, receive bytes, and render a temporary object URL locally.

## 6. D2 target design

### 6.1 One binary interface

Use a single endpoint:

~~~text
GET /api/v1/document/:documentId/file?disposition=inline|attachment
Authorization: Bearer <access token>
~~~

Do not create two independently implemented endpoints called preview and download. Disposition changes delivery behavior; authorization and file lookup remain identical.

| Input | Result |
| --- | --- |
| valid ID, authorized reader, inline | 200 binary response and inline content disposition |
| valid ID, authorized reader, attachment | 200 binary response and attachment content disposition |
| bad disposition | 400 |
| malformed/missing document ID | 400 |
| document absent | 404 |
| caller cannot read document | 404 resource-hiding response, selected for this route |
| DB record exists but physical file missing | 404 safe response; server log includes document ID only |
| resolved path outside upload root | 404 safe response and security log |

The endpoint returns bytes, not JSON. Therefore it does not use the success response envelope.

### 6.2 Access decision

Reuse DocumentAccessService.assertCanReadDocument. Its contract is:

~~~ts
assertCanReadDocument(userId: string, documentId: string): Promise<Document>
~~~

It permits:

- document owner;
- public document;
- member of a project linked to the document.

The file module must call it before resolving or opening a path. The controller never accepts userId from the URL or request body.

### 6.3 Safe path decision

The only trusted source of a physical path is Document.filePath from the database after access succeeds.

Algorithm:

1. Define uploadRoot as path.resolve(process.cwd(), "uploads", "documents").
2. Resolve candidatePath from uploadRoot and the database path.
3. Reject if candidatePath is not inside uploadRoot after resolution.
4. Use fs.stat to confirm an ordinary readable file.
5. Create a read stream only after checks pass.

Do not concatenate untrusted URL strings. Do not use document.originalName as a disk path.

### 6.4 Binary response decision

The document module returns a small value object:

~~~ts
type DocumentFile = {
  stream: Readable;
  mimeType: string;
  filename: string;
  size: number;
}
~~~

The controller maps it to StreamableFile and sets:

~~~text
Content-Type: stored MIME type, or application/octet-stream
Content-Length: stored stat size
Content-Disposition: inline or attachment with safe encoded filename
X-Content-Type-Options: nosniff
Cache-Control: private, no-store
~~~

The global ResponseInterceptor currently wraps ordinary controller results as JSON. Before adding this route, update it to pass StreamableFile through unchanged. Add a focused regression test for this behavior so binary routes never accidentally receive a JSON envelope.

### 6.5 Frontend delivery decision

The FE does not put an access token into iframe src, image src, query parameters, or localStorage-derived URLs.

1. Add getDocumentBlob(documentId, disposition) to the API client.
2. It uses fetch with Authorization Bearer header.
3. It checks non-2xx response and extracts the safe JSON error body if present.
4. It returns a Blob for 200 response. It bypasses the JSON-envelope decoder.
5. DocumentViewer creates URL.createObjectURL(blob) after selected document has status processed.
6. The viewer revokes the object URL when selection changes or component unmounts.
7. PDF uses the object URL in iframe. Other types use an attachment fetch and a temporary anchor download.
8. The UI has loading, error/retry, unsupported-format and success states.

## 7. D2 implementation sequence

Each step is a separate commit unless a reviewer explicitly requests a squash.

### Step D2.0 — Discovery and red tests

1. Search both repositories for /uploads, /preview, /download and getDocumentPreviewUrl/getDocumentDownloadUrl.
2. Record every live caller in this document's implementation log.
3. Add tests before production changes:
   - DocumentAccessService read behavior is used by file delivery.
   - missing file returns 404;
   - outsider gets resource-hiding 404;
   - inline/attachment set correct disposition;
   - StreamableFile bypasses JSON envelope.
4. Run each new test and record the red reason.

Deliverable: no source behavior change beyond test fixtures.

### Step D2.1 — Backend file module

Files expected to change:

| File | Change |
| --- | --- |
| src/document/document.service.ts or dedicated document-file.service.ts | file lookup, root validation, stat/read stream |
| src/document/document.controller.ts | GET :documentId/file route before generic GET :id |
| src/document/document-access.service.ts | reuse only; extend test only if a real missing authorization case appears |
| src/response.interceptor.ts | pass StreamableFile without JSON wrapping |
| src/document/document.module.ts | register any focused file module/provider |
| src/document/*.spec.ts | controller/service/interceptor regression tests |

Implementation rules:

1. Prefer a dedicated DocumentFileService if adding filesystem behavior would make DocumentService hard to understand. Its external interface is getFile(userId, documentId).
2. Use constructor injection for fs/path adapter only if tests need to fake filesystem; otherwise use Node promises with a narrow local adapter.
3. Throw Nest HTTP exceptions. Do not throw raw Error.
4. The controller receives documentId and disposition, invokes one module, and sets response headers. It does not query Prisma or create paths.
5. Place static route-like :documentId/file before :id to make route intent clear.

### Step D2.2 — Frontend blob viewer

Files expected to change:

| File | Change |
| --- | --- |
| src/lib/api.ts | specialized binary fetch function |
| src/components/document/DocumentViewer.tsx | object URL lifecycle, preview/download UI |
| document viewer test or API mapper test | blob success/error and URL cleanup where test harness permits |
| API_INTEGRATION_PHASES.md | record contract and verification evidence |

Implementation rules:

1. Do not restore old direct preview/download URL methods.
2. Do not render iframe until blob fetch succeeds.
3. Abort obsolete fetches when selected document changes.
4. Preserve document list/upload behavior already running on live API.
5. Use user-facing Vietnamese error copy without HTTP internals.

### Step D2.3 — Remove public static serving

This happens only after D2.1 and D2.2 pass browser smoke tests.

1. Confirm no first-party caller uses /uploads.
2. Remove ServeStaticModule configuration exposing uploads from app.module.
3. Add a test or manual probe proving old /uploads/... no longer serves document bytes.
4. Re-run upload, parser, preview, download and delete flow.
5. Deploy/restart only after the new file endpoint serves existing database records.

Never remove static serving before the protected endpoint works; it would break access to existing files without a rollback path.

## 8. Test matrix

| Scenario | BE automated test | FE/manual test | Expected |
| --- | --- | --- | --- |
| owner inline PDF | controller/service test | select processed PDF | 200 and preview |
| viewer inline PDF | access test | shared project viewer | 200 and preview |
| outsider | access/controller test | second account | 404, no bytes |
| private direct doc owner | service test | library screen when available | 200 |
| public doc | service test | permitted public screen | 200 |
| missing DB row | controller test | direct request | 404 |
| missing physical file | service test | direct request | 404 safe error |
| traversal-like DB path | service test | fixture only | 404 and no external read |
| attachment | controller test | download action | correct filename and bytes |
| legacy public URL | probe/manual test | request /uploads/... | 404 after removal |
| response envelope | interceptor test | DevTools response body | raw bytes, not JSON |

## 9. Browser smoke procedure

1. Start Redis with noeviction policy, PostgreSQL, backend and frontend.
2. Login as project owner.
3. Create/select a project and upload a small readable PDF.
4. Wait for status DONE.
5. Select the document: preview loads once; DevTools request has Authorization and calls /document/:id/file.
6. Download file; filename and contents match uploaded file.
7. Login as viewer: preview/download succeeds but upload/delete controls fail safely.
8. Login as outsider: document request returns 404 and no file is displayed.
9. Hard refresh after every account switch. Confirm browser makes no /uploads, /preview or old /download request.

## 10. Rollback

| Failure point | Safe rollback |
| --- | --- |
| D2.1 backend endpoint fails tests | revert only D2.1 commit; keep existing static serving temporarily |
| D2.2 FE blob viewer fails | revert only FE D2.2 commit; static route remains until replacement is corrected |
| static removal breaks an unknown consumer | revert static-removal commit only; investigate callers before retry |
| authorization rejects valid member | retain protected endpoint, fix access regression with a test; do not make files public |

Rollback never means disabling authorization or adding a public token-bearing URL.

## 11. D2 definition of done

- [ ] All D2 automated tests pass.
- [ ] Backend Nest build and full Jest suite pass.
- [ ] Frontend typecheck and production build pass.
- [ ] Owner and project viewer can preview/download.
- [ ] Outsider receives consistent 404 without bytes.
- [ ] Physical path never appears in JSON response or browser URL.
- [ ] No request uses legacy preview/download URLs.
- [ ] Static /uploads serving is removed only after all above checks pass.
- [ ] API_INTEGRATION_PHASES.md is updated with commit hashes and manual evidence.

## 12. Next phase after D2

Only after D2 is complete, begin D3: return ingest result as named data containing chunks and true pageCount; store true page count instead of vector chunk count. Chat remains blocked until its message-history endpoint returns ChatMessage rows rather than a Chat record.

## 13. Implementation record — 2026-09-04

### D2 completed in code

- `GET /api/v1/document/:id/file?disposition=inline|attachment` now checks document access, validates that the stored path remains under `uploads/documents`, and streams bytes with safe content headers.
- `DocumentViewer` requests an authenticated blob for PDF preview and download. It exposes loading, retry, and Vietnamese error states; object URLs are revoked during cleanup.
- The global response interceptor leaves `StreamableFile` responses unwrapped.
- Public `ServeStaticModule` exposure of `/uploads` has been removed.
- Automated evidence: BE full Jest suite passes (11 suites, 23 tests) and Nest build passes; FE type-check and production build pass.
- Runtime evidence: BE booted from commit `ad718c0` and mapped `GET /api/v1/document/:id/file`; a real legacy `uploads/documents/*` path returned `404`, while the new file route returned `401` without a JWT.
- HTTP smoke evidence: a temporary owner-owned text fixture was created and removed in a `finally` block. Owner inline and attachment requests both returned `200` with exact bytes and safe headers; the seed outsider received `404`; the fixture's legacy `/uploads/documents/*` URL returned `404`.
- Viewer smoke evidence: a separate temporary fixture made the seed user a project `VIEWER` for the duration of the probe only. Both owner and viewer received `200` with exact bytes; the temporary membership, document relation, record, and file were removed afterward.
- Browser smoke evidence: the local seed owner signed in through FE, opened a processed temporary PDF from Documents, and the viewer created an iframe backed by a `blob:` URL. The download control was initially absent in the successful preview branch; it was fixed by placing it in the document header, then verified visible in the browser. The in-app browser does not render PDF blob content, but the protected inline and attachment routes had already been verified against exact bytes; the temporary UI fixture was removed afterward.

### D2 browser verification completed

The browser smoke test verified the authenticated document UI and its protected blob preview path. The separate HTTP probes cover owner, project viewer, outsider, and legacy-static authorization outcomes. Re-run the smoke procedure in section 9 after any change to authentication, document access, or the binary-response contract.

### D3 completed in code

- `IngestService.ingestDocument` returns `{ chunks, pageCount }` rather than returning a bare chunk array.
- `pageCount` counts parser pages with non-empty text; chunk count remains the worker return value and embedding metric.
- `IngestProcessor` persists the parser page count and logs both values.
- FE maps `errorMessage` and `pageCount`, so failed processing is explainable and processed documents show their page count.
- Regression tests cover two parser pages producing five chunks and verify that database `pageCount` is `2`, not `5`.
