# Implement authentication

### Khi login

- return { accessToken, refreshToken, user }

### FE lưu

- AT vào memory / localStorage

- RT vào localStorage hoặc cookie httpOnly

### Khi request API

- FE gửi Bearer AT

- Nếu AT hết hạn → FE gọi refresh với RT

- BE kiểm tra RT → cấp token mới

# Implement citation

1. Cách parse citation trong câu trả lời
2. Cách render `[chunkIndex]`
3. Cách hover để show snippet
4. Cách click để mở PDF và highlight
5. Cách duy trì history citation
6. Bonus: code mẫu React + PDF.js + Tailwind

---

# 🎯 **I. FE NHẬN ĐƯỢC API GỒM 2 PHẦN**

### **1. Answer (có [chunkIndex])**

```json
"answer": "… suy luận dựa trên ngôn ngữ[0] … RLHF[0][2] … MoE[1] … tối ưu hóa[11]."
```

### **2. Citations[]**

```json
{
  "citations": [
    {
      "chunkIndex": 0,
      "snippet": "…",
      "text": "…",
      "page": 1,
      "fileId": "…",
      "fileUrl": "uploads/documents/...pdf",
      "startOffset": 0,
      "endOffset": 800
    },
    ...
  ]
}
```

---

# 🎯 **II. FE PHẢI IMPLEMENT 4 CHỨC NĂNG CHÍNH**

## 💡 **1. Parse answer → detect citation [chunkIndex] từ LLM**

Regex dùng chuẩn:

```js
const citationRegex = /\[(\d+)\]/g;
```

Bạn sẽ tách câu trả lời thành array of segments:

```js
function parseAnswer(text) {
  const parts = [];
  let lastIndex = 0;

  text.replace(citationRegex, (match, p1, offset) => {
    if (offset > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, offset) });
    }
    parts.push({ type: 'citation', chunkIndex: parseInt(p1) });
    lastIndex = offset + match.length;
  });

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}
```

Kết quả ví dụ:

```js
[
  { type: "text", content: "suy luận dựa trên ngôn ngữ" },
  { type: "citation", chunkIndex: 0 },
  { type: "text", content: " RLHF " },
  { type: "citation", chunkIndex: 0 },
  { type: "citation", chunkIndex: 2 },
  ...
]
```

---

## 💡 **2. Render answer với citation clickable**

Trong React:

```jsx
{parts.map((p, i) =>
  p.type === "text" ? (
    <span key={i}>{p.content}</span>
  ) : (
    <sup
      key={i}
      className="cursor-pointer text-blue-500 hover:text-blue-700"
      onMouseEnter={() => showTooltip(p.chunkIndex)}
      onMouseLeave={hideTooltip}
      onClick={() => openPDFHighlight(p.chunkIndex)}
    >
      [{p.chunkIndex}]
    </sup>
  )
)}
```

Lúc này FE đã render đẹp như NotebookLM.

---

# 🎯 **III. FE: Hover → show snippet của chunk**

Dựa vào chunkIndex trong citations[]:

```js
function getCitation(chunkIndex, citations) {
  return citations.find(c => c.chunkIndex === chunkIndex);
}
```

Khi hover:

```js
function showTooltip(chunkIndex) {
  const c = getCitation(chunkIndex, citations);

  setTooltip({
    visible: true,
    content: c.snippet,
    page: c.page,
    fileUrl: c.fileUrl
  });
}
```

Tooltip UI (Tailwind):

```jsx
<div className="absolute bg-white shadow-md p-3 rounded border w-64">
  <p className="text-sm">{tooltip.content}</p>
  <p className="text-xs text-gray-400">Page: {tooltip.page}</p>
</div>
```

---

# 🎯 **IV. FE: Click → mở PDF + highlight đúng đoạn**

Đây là phần quan trọng nhất.

## ✔ Dễ nhất: Mở Viewer route FE

Giả sử route:
`/viewer?file=<fileUrl>&page=<page>&start=<s>&end=<e>`

```js
function openPDFHighlight(chunkIndex) {
  const c = getCitation(chunkIndex, citations);

  const url =
    `/viewer?file=${encodeURIComponent(c.fileUrl)}` +
    `&page=${c.page}&start=${c.startOffset}&end=${c.endOffset}`;

  window.open(url, "_blank");
}
```

---

# 🎯 **V. FE Viewer: sử dụng PDF.js highlight đoạn text**

Trong trang `/viewer`:

### 1. Load PDF

```js
const pdf = await pdfjsLib.getDocument(fileUrl).promise;
const page = await pdf.getPage(pageIndex);
```

### 2. Render textLayer

```js
const textContent = await page.getTextContent();
```

### 3. Highlight theo offset

Bạn đã có `startOffset` và `endOffset`.

PDF.js chia text ra nhiều node → phải merge lại.

```js
function highlightChunk(textLayerDiv, start, end) {
  let currentOffset = 0;

  [...textLayerDiv.childNodes].forEach(node => {
    const length = node.textContent.length;

    const nodeStart = currentOffset;
    const nodeEnd = currentOffset + length;

    const overlap = Math.max(0, Math.min(end, nodeEnd) - Math.max(start, nodeStart));

    if (overlap > 0) {
      node.classList.add("bg-yellow-300");
    }

    currentOffset += length;
  });
}
```

---

# 🎯 **VI. Tóm tắt luồng FE**

```
User chat → BE trả answer + citations → FE parse → render [chunkIndex] → hover tooltip → click mở PDF → highlight chunk
```

Flow này giống **Google NotebookLM**, **ChatGPT Retrieval**, **Gemini Docs**.

---

# 🎯 **VII. FULL MINI EXAMPLE (React)**

```jsx
const Answer = ({ answer, citations }) => {
  const parts = parseAnswer(answer);
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="relative">
      {parts.map((p, i) =>
        p.type === "text" ? (
          <span key={i}>{p.content}</span>
        ) : (
          <sup
            key={i}
            className="mx-1 cursor-pointer text-blue-600 hover:text-blue-800"
            onMouseEnter={() => setTooltip(getCitation(p.chunkIndex, citations))}
            onMouseLeave={() => setTooltip(null)}
            onClick={() => openPDFHighlight(p.chunkIndex)}
          >
            [{p.chunkIndex}]
          </sup>
        )
      )}

      {tooltip && (
        <div className="absolute left-0 top-full mt-2 p-3 w-64 bg-white shadow rounded border z-50">
          <div className="text-sm">{tooltip.snippet}</div>
          <div className="text-xs text-gray-400">
            Page: {tooltip.page}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

# 🎉 **Bạn đã đạt 100% citation backend chuẩn – với FE guide này → bạn hoàn thiện citation UX giống NotebookLM 95–98%.**

Nếu bạn muốn:

✔ Tôi viết luôn **PDF.js viewer component**
✔ Tôi viết **custom hook `useCitationRenderer()`**
✔ Tôi viết **UI mẫu giống NotebookLM**
✔ Hoặc Feast-level optimization để tránh spam citation

Chỉ cần bảo tôi: **"Viết viewer PDF"** hoặc **"Viết UI NotebookLM"**.
