import { Injectable } from '@nestjs/common';
import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constant/index.constant.js';

export type ChunkResult = {
  text: string;
  page: number;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
};

@Injectable()
export class TextSplitterService {
  // Ưu tiên các dấu phân cách theo thứ tự: Đoạn văn -> Xuống dòng -> Kết câu -> Dấu phẩy -> Khoảng trắng
  private readonly SEPARATORS = [
    '\n\n',
    '\n',
    '. ',
    '? ',
    '! ',
    '; ',
    ', ',
    ' ',
  ];

  splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    let globalOffset = 0;
    let chunkIndex = 0;

    for (const p of pages) {
      // Lưu ý: Không trim() toàn bộ pageText ngay đầu vì sẽ làm lệch offset nếu đầu trang có khoảng trắng
      // Nếu bắt buộc trim, hãy cộng số lượng ký tự bị trim vào globalOffset
      const pageText = p.text;

      if (!pageText || pageText.trim().length === 0) {
        globalOffset += pageText.length;
        continue;
      }

      let localStart = 0;

      while (localStart < pageText.length) {
        // 1. Xác định điểm cắt lý tưởng (Hard limit)
        let localEnd = Math.min(localStart + CHUNK_SIZE, pageText.length);

        // 2. Nếu chưa hết văn bản, hãy tìm điểm cắt ngữ nghĩa (Semantic Boundary)
        if (localEnd < pageText.length) {
          const semanticEnd = this.findNearestSeparator(
            pageText,
            localStart,
            localEnd,
          );
          if (semanticEnd > localStart) {
            // Nếu tìm thấy điểm ngắt hợp lý, dùng nó.
            // Nếu không (văn bản quá dài không có dấu ngắt), buộc phải dùng hard limit (localEnd cũ)
            localEnd = semanticEnd;
          }
        }

        const chunkText = pageText.slice(localStart, localEnd);

        // Bỏ qua chunk rỗng hoặc chỉ toàn khoảng trắng
        if (chunkText.trim().length > 0) {
          chunks.push({
            text: chunkText.trim(), // Trim text lưu vào DB cho đẹp
            page: p.page,
            chunkIndex: chunkIndex,
            // Start/End Offset giữ nguyên theo raw text để highlight chính xác
            startOffset: globalOffset + localStart,
            endOffset: globalOffset + localEnd,
          });
          chunkIndex++;
        }

        // 3. Tính toán localStart cho vòng lặp tiếp theo (xử lý Overlap thông minh)
        if (localEnd >= pageText.length) {
          break; // Đã hết trang
        }

        // Muốn overlap khoảng K ký tự, ta lùi từ localEnd về K ký tự
        const idealNextStart = Math.max(localStart, localEnd - CHUNK_OVERLAP);

        // Nhưng nextStart cũng không được cắt giữa từ. Hãy tìm khoảng trắng gần nhất để bắt đầu.
        // Ta tìm dấu cách gần nhất VỀ PHÍA TRƯỚC (hoặc giữ nguyên nếu may mắn trúng boundary)
        localStart = this.findSmartNextStart(
          pageText,
          idealNextStart,
          localEnd,
        );
      }

      globalOffset += pageText.length;
    }

    return chunks;
  }

  // Helper: Tìm dấu phân cách tốt nhất bằng cách nhìn ngược từ vị trí limit
  private findNearestSeparator(
    text: string,
    start: number,
    limit: number,
  ): number {
    const searchRange = Math.floor(CHUNK_SIZE * 0.4); // Chỉ tìm ngược lại trong khoảng 40% cuối của chunk để tránh chunk quá ngắn
    const minSearchIndex = Math.max(start, limit - searchRange);

    const substringToCheck = text.slice(minSearchIndex, limit);

    for (const sep of this.SEPARATORS) {
      const lastIndex = substringToCheck.lastIndexOf(sep);
      if (lastIndex !== -1) {
        // lastIndexOf trả về index trong substring, cần + minSearchIndex để ra index gốc
        // Cộng thêm độ dài separator để cắt SAU dấu câu (ví dụ sau dấu chấm)
        return minSearchIndex + lastIndex + sep.length;
      }
    }

    // Nếu không tìm thấy dấu phân cách nào (ví dụ 1 chuỗi hex dài ngoằng), trả về -1 để fallback về hard cut
    return -1;
  }

  // Helper: Tìm điểm bắt đầu cho chunk sau sao cho không bị giữa từ
  private findSmartNextStart(
    text: string,
    idealStart: number,
    previousEnd: number,
  ): number {
    if (idealStart <= 0) return 0;

    // Nếu idealStart đang nằm ngay sau dấu cách hoặc xuống dòng -> tốt
    if ([' ', '\n'].includes(text[idealStart - 1])) {
      return idealStart;
    }

    // Nếu không, tìm khoảng trắng gần nhất PHÍA TRƯỚC idealStart
    // (Để đảm bảo overlap đủ rộng, ta lùi lại đầu từ hiện tại)
    const lastSpace = text.lastIndexOf(' ', idealStart);
    const lastNewline = text.lastIndexOf('\n', idealStart);

    const safeStart = Math.max(lastSpace, lastNewline);

    // Nếu tìm thấy và nó không quá xa (không lùi quá chunk size), dùng nó.
    // +1 để bắt đầu sau dấu cách
    if (safeStart !== -1 && safeStart < previousEnd) {
      return safeStart + 1;
    }

    return idealStart; // Fallback
  }

  splitText(text: string): ChunkResult[] {
    const pages = [{ page: 1, text }];
    return this.splitPdfPages(pages);
  }
}

// Old code

// import { Injectable } from '@nestjs/common';
// // import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
// import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constant/index.constant.js';
// export type ChunkResult = {
//   text: string;
//   page: number;
//   chunkIndex: number;
//   startOffset: number;
//   endOffset: number;
// };

// @Injectable()
// export class TextSplitterService {
//   // splitter = new RecursiveCharacterTextSplitter({
//   //   chunkSize: 1000,
//   //   chunkOverlap: 200,
//   // });

//   // async splitText(text: string) {
//   //   return this.splitter.splitText(text);
//   // }

//   splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
//     const chunks: ChunkResult[] = [];
//     let globalOffset = 0;
//     let chunkIndex = 0;

//     for (const p of pages) {
//       const pageText = p.text.trim();
//       if (!pageText) {
//         continue;
//       }

//       let localStart = 0;

//       while (localStart < pageText.length) {
//         const end = Math.min(localStart + CHUNK_SIZE, pageText.length);
//         const chunkText = pageText.slice(localStart, end);

//         const chunk: ChunkResult = {
//           text: chunkText,
//           page: p.page,
//           chunkIndex: chunkIndex,
//           startOffset: globalOffset + localStart,
//           endOffset: globalOffset + end,
//         };

//         chunks.push(chunk);
//         chunkIndex++;

//         // next chunk start
//         localStart += CHUNK_SIZE - CHUNK_OVERLAP;
//       }

//       globalOffset += pageText.length;
//     }

//     return chunks;
//   }

//   // If user sends plain text instead of PDF
//   splitText(text: string): ChunkResult[] {
//     const pages = [{ page: 1, text }];
//     return this.splitPdfPages(pages);
//   }
// }
