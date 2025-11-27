import { Injectable } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService {
  async load(filePath: string) {
    const worker = await Tesseract.createWorker('vie');

    try {
      // Check if file is PDF
      const isPdf = filePath.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        // Convert PDF to images
        const tempDir = path.join(process.cwd(), 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const options = {
          density: 200,
          saveFilename: `ocr-${Date.now()}`,
          savePath: tempDir,
          format: 'png',
          width: 2000,
          height: 2000,
        };

        const convert = fromPath(filePath, options);

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

            const result = await worker.recognize(pageResult.path);
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
      } else {
        // Process image directly
        const result = await worker.recognize(filePath);
        return { text: result.data.text, confidence: result.data.confidence };
      }
    } catch (error) {
      console.log('OCR Error: ', error);
      throw error;
    } finally {
      await worker.terminate();
    }
  }
}
