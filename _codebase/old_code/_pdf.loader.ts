// import { Injectable } from '@nestjs/common';
// import pdfParse from 'pdf-parse';
// import * as fs from 'fs';

// // Type definitions for pdf.js objects
// interface TextItem {
//   str: string;
//   transform: number[];
// }

// interface TextContent {
//   items: TextItem[];
// }

// interface PageData {
//   pageNumber: number;
//   getTextContent(options?: {
//     normalizeWhitespace?: boolean;
//     disableCombineTextItems?: boolean;
//   }): Promise<TextContent>;
// }

// @Injectable()
// export class PdfService {
//   private pageTexts: Map<number, string> = new Map();

//   async load(filePath: string): Promise<{ page: number; text: string }[]> {
//     // Reset page texts for new document
//     this.pageTexts.clear();

//     // Read PDF file as buffer
//     const dataBuffer = fs.readFileSync(filePath);

//     // Parse PDF with pdf-parse
//     await pdfParse(dataBuffer, {
//       pagerender: (pageData: PageData) => this.renderPage(pageData),
//     });

//     // Convert Map to array sorted by page number
//     const result = Array.from(this.pageTexts.entries())
//       .sort((a, b) => a[0] - b[0])
//       .map(([pageNum, text]) => ({
//         page: pageNum,
//         text: text,
//       }));

//     return result;
//   }

//   private async renderPage(pageData: PageData): Promise<string> {
//     const render_options = {
//       normalizeWhitespace: false,
//       disableCombineTextItems: false,
//     };

//     const textContent = await pageData.getTextContent(render_options);
//     const strings = textContent.items.map((item) => item.str);
//     const pageText = strings.join(' ') + '\n';

//     // Store text by page number
//     this.pageTexts.set(pageData.pageNumber, pageText);

//     return pageText;
//   }
// }
