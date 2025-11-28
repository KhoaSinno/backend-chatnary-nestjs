import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private worker: Tesseract.Worker;

  async onModuleInit() {
    this.worker = await Tesseract.createWorker('vie');
  }
  // Handle
  async load(filePath: string) {
    try {
      // Check if file is PDF
      const isPdf = filePath.toLowerCase().endsWith('.pdf');
      // --- CASE 1: Non-PDF files (images) ---
      if (!isPdf) {
        const result = await this.worker.recognize(filePath);
        return { text: result.data.text, confidence: result.data.confidence };
      }

      // --- CASE 2: PDF files ---
      // -- Get pageNumber --
      const pdfBuffet = fs.readFileSync(filePath);
      const pdfInfo = await pdf(pdfBuffet);
      const pageCount = pdfInfo.numpages;

      if (!pageCount || pageCount === 0) return { text: '' };

      // Create: "uploads/temp" if not exists
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // List pages: convert(1) => page 1
      const convert = fromPath(filePath, {
        density: 130, // DPI 130 - 300
        saveFilename: `ocr-${Date.now()}`, // Temporary filename
        savePath: tempDir,
        format: 'png', // Better quality
        width: 1200, // To upscale img
        height: 1200, // To upscale img
      });

      // Process all pages
      let allText = '';
      let pageNum = 1;

      while (true) {
        try {
          const pageResult = await convert(pageNum, {
            responseType: 'image',
          });

          if (!pageResult.path) {
            break;
          }

          const result = await this.worker.recognize(pageResult.path);
          allText += result.data.text + '\n';

          // Clean up temp image
          fs.unlinkSync(pageResult.path);
          pageNum++;
        } catch {
          // No more pages
          break;
        }
      }

      return { text: allText, confidence: 0 };
    } catch (error) {
      console.log('OCR Error: ', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }
}
