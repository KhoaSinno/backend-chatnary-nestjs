# 🧪 Postman Test Plan - BRAC Retrieval Features

> **Base URL:** `http://localhost:8080/api/v1`

---

## 📋 Prerequisites Setup

### Step 1: Create 3 Test Users

You need 3 users to test role-based access:

| User       | Role in Project | Purpose                      |
| ---------- | --------------- | ---------------------------- |
| **User A** | OWNER           | Creates and owns the project |
| **User B** | EDITOR          | Can edit but cannot delete   |
| **User C** | VIEWER          | Can only view and chat       |

### Step 2: Get JWT Tokens

Login for each user and save their tokens:

```
POST /auth/login
Body: { "email": "userA@test.com", "password": "xxx" }
→ Save accessToken as {{TOKEN_OWNER}}

POST /auth/login
Body: { "email": "userB@test.com", "password": "xxx" }
→ Save accessToken as {{TOKEN_EDITOR}}

POST /auth/login
Body: { "email": "userC@test.com", "password": "xxx" }
→ Save accessToken as {{TOKEN_VIEWER}}
```

### Step 3: Create a Test Project (as OWNER)

```
POST /project
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body: {
  "name": "Test RBAC Project",
  "description": "Testing role-based access"
}
→ Save response.id as {{PROJECT_ID}}
```

### Step 4: Upload Test Documents (as OWNER)

```
POST /document/upload/files
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body (form-data):
  - files: [upload 2-3 PDF files]
  - data: {"projectId": "{{PROJECT_ID}}"}
→ Save document IDs as {{DOC_ID_1}}, {{DOC_ID_2}}, {{DOC_ID_3}}
```

### Step 5: Invite Members

```
POST /project/{{PROJECT_ID}}/members
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body: { "email": "userB@test.com", "roleProject": "EDITOR" }

POST /project/{{PROJECT_ID}}/members
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body: { "email": "userC@test.com", "roleProject": "VIEWER" }
```

---

## 🔐 FEATURE 1: RBAC Testing

### Test 1.1: VIEWER Cannot Add Documents ❌

```http
POST /project/{{PROJECT_ID}}/documents
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
Body: { "documentIds": ["{{DOC_ID_1}}"] }
```

**Expected:** `403 Forbidden` - "Quyền hạn không đủ (Cần Editor)"

---

### Test 1.2: VIEWER Cannot Remove Documents ❌

```http
DELETE /project/{{PROJECT_ID}}/documents/unlink
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
Body: { "documentIds": ["{{DOC_ID_1}}"] }
```

**Expected:** `403 Forbidden`

---

### Test 1.3: VIEWER Cannot Toggle Document Selection ❌

```http
PATCH /project/{{PROJECT_ID}}/documents/{{DOC_ID_1}}/toggle
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
```

**Expected:** `403 Forbidden`

---

### Test 1.4: VIEWER Cannot Invite Members ❌

```http
POST /project/{{PROJECT_ID}}/members
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
Body: { "email": "random@test.com", "roleProject": "VIEWER" }
```

**Expected:** `403 Forbidden`

---

### Test 1.5: VIEWER Cannot Update Project ❌

```http
PATCH /project/{{PROJECT_ID}}
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
Body: { "name": "Hacked Project Name" }
```

**Expected:** `403 Forbidden`

---

### Test 1.6: VIEWER Cannot Delete Project ❌

```http
DELETE /project/{{PROJECT_ID}}
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
```

**Expected:** `403 Forbidden`

---

### Test 1.7: EDITOR Cannot Delete Project ❌

```http
DELETE /project/{{PROJECT_ID}}
Headers: Authorization: Bearer {{TOKEN_EDITOR}}
```

**Expected:** `403 Forbidden` - "Chỉ chủ sở hữu mới được thực hiện"

---

### Test 1.8: VIEWER CAN View Project Documents ✅

```http
GET /project/{{PROJECT_ID}}/documents
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
```

**Expected:** `200 OK` - Returns list of documents with `isSelected` field

---

### Test 1.9: VIEWER CAN View Project Chats ✅

```http
GET /project/{{PROJECT_ID}}/chats
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
```

**Expected:** `200 OK`

---

### Test 1.10: VIEWER CAN Chat in Project ✅

```http
POST /project/{{PROJECT_ID}}/chats/messages
Headers: Authorization: Bearer {{TOKEN_VIEWER}}
Body: { "message": "What is this document about?" }
```

**Expected:** `200 OK` - Returns AI response

---

### Test 1.11: EDITOR CAN Toggle Documents ✅

```http
PATCH /project/{{PROJECT_ID}}/documents/{{DOC_ID_1}}/toggle
Headers: Authorization: Bearer {{TOKEN_EDITOR}}
```

**Expected:** `200 OK` - `isSelected` value flipped

---

### Test 1.12: EDITOR CAN Update Project ✅

```http
PATCH /project/{{PROJECT_ID}}
Headers: Authorization: Bearer {{TOKEN_EDITOR}}
Body: { "name": "Updated by Editor" }
```

**Expected:** `200 OK`

---

### Test 1.13: OWNER CAN Delete Project ✅

```http
DELETE /project/{{PROJECT_ID}}
Headers: Authorization: Bearer {{TOKEN_OWNER}}
```

**Expected:** `200 OK` - Project deleted

---

## 🔄 FEATURE 2: Smart Context (Toggle Selection) Testing

> **Goal:** Test that AI only reads documents where `isSelected = true`

### Step 2.0: Setup Fresh Project

Create a new project and upload 2 documents for this test.

---

### Test 2.1: Verify All Documents are Selected by Default

```http
GET /project/{{PROJECT_ID}}/documents
Headers: Authorization: Bearer {{TOKEN_OWNER}}
```

**Expected:** All documents have `isSelected: true`

---

### Test 2.2: Chat with All Documents Active

```http
POST /project/{{PROJECT_ID}}/chats/messages
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body: { "message": "Summarize all uploaded documents" }
```

**Expected:** AI response includes information from ALL documents

---

### Test 2.3: Toggle OFF Document 1

```http
PATCH /project/{{PROJECT_ID}}/documents/{{DOC_ID_1}}/toggle
Headers: Authorization: Bearer {{TOKEN_EDITOR}}
```

**Expected:** `isSelected: false` for DOC_ID_1

---

### Test 2.4: Verify Document 1 is Deselected

```http
GET /project/{{PROJECT_ID}}/documents
Headers: Authorization: Bearer {{TOKEN_OWNER}}
```

**Expected:** DOC_ID_1 has `isSelected: false`, DOC_ID_2 has `isSelected: true`

---

### Test 2.5: Chat with Document 1 OFF 🔥 (Critical Test)

```http
POST /project/{{PROJECT_ID}}/chats/messages
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body: { "message": "What information is in my documents?" }
```

**Expected:**

- AI response should NOT include content from Document 1
- AI response should ONLY include content from Document 2
- Citations should only reference Document 2

---

### Test 2.6: Toggle OFF All Documents

```http
PATCH /project/{{PROJECT_ID}}/documents/{{DOC_ID_2}}/toggle
Headers: Authorization: Bearer {{TOKEN_EDITOR}}
```

**Expected:** `isSelected: false` for DOC_ID_2

---

### Test 2.7: Chat with NO Documents Selected 🔥 (Edge Case)

```http
POST /project/{{PROJECT_ID}}/chats/messages
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body: { "message": "What is in my documents?" }
```

**Expected:**

- Empty response OR "No documents selected" message
- No citations returned
- **Should NOT search vector store** (performance optimization)

---

### Test 2.8: Toggle Document 1 Back ON

```http
PATCH /project/{{PROJECT_ID}}/documents/{{DOC_ID_1}}/toggle
Headers: Authorization: Bearer {{TOKEN_EDITOR}}
```

**Expected:** `isSelected: true` for DOC_ID_1

---

### Test 2.9: Verify Context is Restored

```http
POST /project/{{PROJECT_ID}}/chats/messages
Headers: Authorization: Bearer {{TOKEN_OWNER}}
Body: { "message": "Summarize Document 1" }
```

**Expected:** AI response includes content from Document 1 again

---

## 📊 Test Summary Checklist

### RBAC Tests

| #    | Test                  | Role   | Action         | Expected |
| ---- | --------------------- | ------ | -------------- | -------- |
| 1.1  | VIEWER add docs       | VIEWER | POST docs      | ❌ 403   |
| 1.2  | VIEWER remove docs    | VIEWER | DELETE docs    | ❌ 403   |
| 1.3  | VIEWER toggle docs    | VIEWER | PATCH toggle   | ❌ 403   |
| 1.4  | VIEWER invite         | VIEWER | POST members   | ❌ 403   |
| 1.5  | VIEWER update project | VIEWER | PATCH project  | ❌ 403   |
| 1.6  | VIEWER delete project | VIEWER | DELETE project | ❌ 403   |
| 1.7  | EDITOR delete project | EDITOR | DELETE project | ❌ 403   |
| 1.8  | VIEWER view docs      | VIEWER | GET docs       | ✅ 200   |
| 1.9  | VIEWER view chats     | VIEWER | GET chats      | ✅ 200   |
| 1.10 | VIEWER chat           | VIEWER | POST chat      | ✅ 200   |
| 1.11 | EDITOR toggle docs    | EDITOR | PATCH toggle   | ✅ 200   |
| 1.12 | EDITOR update project | EDITOR | PATCH project  | ✅ 200   |
| 1.13 | OWNER delete project  | OWNER  | DELETE project | ✅ 200   |

### Smart Context Tests

| #   | Test          | Docs Active      | Expected AI Behavior |
| --- | ------------- | ---------------- | -------------------- |
| 2.2 | All docs ON   | Doc1 ✅, Doc2 ✅ | Reads both docs      |
| 2.5 | Doc1 OFF      | Doc1 ❌, Doc2 ✅ | Reads only Doc2      |
| 2.7 | All docs OFF  | Doc1 ❌, Doc2 ❌ | Empty/No citations   |
| 2.9 | Doc1 restored | Doc1 ✅, Doc2 ❌ | Reads only Doc1      |

---

## 💡 Pro Tips for Postman

1. **Use Environment Variables:**
   - `{{BASE_URL}}` = `http://localhost:8080/api/v1`
   - `{{TOKEN_OWNER}}`, `{{TOKEN_EDITOR}}`, `{{TOKEN_VIEWER}}`
   - `{{PROJECT_ID}}`, `{{DOC_ID_1}}`, `{{DOC_ID_2}}`

2. **Use Pre-request Script for Auto-token:**

   ```javascript
   // Automatically refresh token if expired
   if (pm.environment.get('tokenExpiry') < Date.now()) {
     // Call refresh endpoint
   }
   ```

3. **Use Tests Tab for Assertions:**

   ```javascript
   pm.test('Should be forbidden', function () {
     pm.response.to.have.status(403);
     pm.expect(pm.response.json().message).to.include('quyền');
   });
   ```

4. **Create Collection Runner:**
   - Run all RBAC tests in sequence
   - Export results for documentation

---

Good luck testing! 🚀
