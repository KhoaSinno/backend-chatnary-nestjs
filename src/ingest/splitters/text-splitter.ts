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
  // Thứ tự ưu tiên: Ngắt đoạn đôi -> Đoạn đơn -> Câu -> Mệnh đề -> Từ
  private readonly SEPARATORS = [
    '\n\n',
    '\n',
    '. ',
    '? ',
    '! ',
    '; ',
    ': ', // Thêm dấu hai chấm
    ', ',
    ' ',
    '', // Fallback cuối cùng: cắt từng ký tự nếu không tìm thấy gì
  ];

  splitPdfPages(pages: { page: number; text: string }[]): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    let globalOffset = 0;
    let chunkIndex = 0;

    for (const p of pages) {
      const pageText = p.text;

      // Xử lý trang rỗng
      if (!pageText || pageText.length === 0) {
        continue; // Offset không đổi vì độ dài = 0
      }

      let localStart = 0;

      while (localStart < pageText.length) {
        // 1. Xác định điểm cắt lý tưởng (Hard Limit)
        let localEnd = Math.min(localStart + CHUNK_SIZE, pageText.length);

        // 2. Tìm điểm cắt ngữ nghĩa (Semantic Boundary)
        // Chỉ tìm nếu chưa hết văn bản
        if (localEnd < pageText.length) {
          const semanticEnd = this.findNearestSeparator(
            pageText,
            localStart,
            localEnd,
          );
          if (semanticEnd !== -1) {
            localEnd = semanticEnd;
          }
        }

        // 3. Lấy raw text
        const rawChunkText = pageText.slice(localStart, localEnd);

        // 4. XỬ LÝ TRIM VÀ OFFSET CHÍNH XÁC (QUAN TRỌNG)
        // Ta cần tìm vị trí thực của chữ cái đầu tiên và cuối cùng trong rawChunkText
        // để offset trả về KHÔNG bao gồm khoảng trắng thừa ở đầu/cuối.
        if (rawChunkText.trim().length > 0) {
          // Tính toán offset nội bộ để trim
          const startTrimDelta =
            rawChunkText.length - rawChunkText.trimStart().length;
          const endTrimDelta =
            rawChunkText.length - rawChunkText.trimEnd().length;

          const realStartOffset = globalOffset + localStart + startTrimDelta;
          const realEndOffset = globalOffset + localEnd - endTrimDelta;

          chunks.push({
            text: rawChunkText.trim(),
            page: p.page,
            chunkIndex: chunkIndex,
            startOffset: realStartOffset,
            endOffset: realEndOffset,
          });
          chunkIndex++;
        }

        // 5. Chuẩn bị cho vòng lặp sau (Overlap)
        if (localEnd >= pageText.length) {
          break;
        }

        // Tính overlap
        const idealNextStart = Math.max(localStart, localEnd - CHUNK_OVERLAP);

        // Tìm điểm bắt đầu "đẹp" cho chunk sau (tránh cắt giữa từ)
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

  /**
   * TỐI ƯU HIỆU NĂNG:
   * Không dùng slice() để tạo chuỗi con mới. Dùng lastIndexOf với tham số position.
   */
  private findNearestSeparator(
    text: string,
    start: number,
    limit: number,
  ): number {
    // Chỉ tìm ngược lại trong khoảng 40% cuối của chunk
    // Để đảm bảo chunk không bị quá ngắn (ví dụ chunk 1000 mà cắt ở ký tự thứ 10)
    const minSearchIndex = Math.max(
      start,
      limit - Math.floor(CHUNK_SIZE * 0.4),
    );

    for (const sep of this.SEPARATORS) {
      if (sep === '') return limit; // Fallback hard cut

      // Tìm separator cuối cùng xuất hiện TRƯỚC limit
      const lastIndex = text.lastIndexOf(sep, limit);

      // Quan trọng: lastIndex phải >= minSearchIndex để đảm bảo chunk đủ dài
      if (lastIndex !== -1 && lastIndex >= minSearchIndex) {
        // Cắt SAU separator (ví dụ sau dấu chấm)
        return lastIndex + sep.length;
      }
    }

    return -1; // Fallback
  }

  private findSmartNextStart(
    text: string,
    idealStart: number,
    previousEnd: number,
  ): number {
    if (idealStart <= 0) return 0;
    if (idealStart >= text.length) return text.length;

    // Nếu ngay tại idealStart đã là ký tự bắt đầu từ mới (trước đó là space) -> Tốt
    if (text[idealStart - 1] === ' ' || text[idealStart - 1] === '\n') {
      return idealStart;
    }

    // Nếu không, lùi lại tìm khoảng trắng gần nhất
    // Giới hạn lùi tối đa 50 ký tự để tránh chunk sau bị overlap quá nhiều (thừa thãi)
    const searchLimit = Math.max(0, idealStart - 50);

    // Tìm space hoặc newline gần nhất phía trước
    const lastSpace = text.lastIndexOf(' ', idealStart);
    const lastNewline = text.lastIndexOf('\n', idealStart);

    const bestStart = Math.max(lastSpace, lastNewline);

    if (bestStart !== -1 && bestStart >= searchLimit) {
      return bestStart + 1; // Bắt đầu sau dấu cách
    }

    // Nếu từ quá dài (dài hơn 50 ký tự không có dấu cách), đành cắt giữa từ
    return idealStart;
  }

  splitText(text: string): ChunkResult[] {
    const pages = [{ page: 1, text }];
    return this.splitPdfPages(pages);
  }
}
