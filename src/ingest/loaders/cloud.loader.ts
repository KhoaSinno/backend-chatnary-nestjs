import { Injectable } from '@nestjs/common';
import { LlamaParseReader } from 'llama-cloud-services';

@Injectable()
export class CloudService {
  private reader: LlamaParseReader;

  constructor() {
    this.reader = new LlamaParseReader({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
      // The parsing tier. Options: fast, cost_effective, agentic, agentic_plus
      tier: 'cost_effective',
      // The version of the parsing tier to use. Use 'latest' for the most recent version
      version: 'latest',
      // Whether to use high resolution OCR (Slow)
      high_res_ocr: true,
      // Adaptive long table. LlamaParse will try to detect long table and adapt the output
      adaptive_long_table: true,
      // Whether to try to extract outlined tables
      outlined_table_extraction: true,
      // Whether to output tables as HTML in the markdown output
      output_tables_as_HTML: true,
      // The maximum number of pages to parse
      max_pages: 0,
      // Whether to use precise bounding box extraction (experimental)
      precise_bounding_box: true,
    });
  }
  // docx, pdf, ... to markdown
  async load(fileUrl: string) {
    const results = await this.reader.parse(fileUrl);

    //parse() returns an array of ParseResult objects
    for (const result of results) {
      console.log(`Job ID: ${result.job_id}`);
      console.log(`File: ${result.file_path}`);
      console.log(`Completed: ${result.is_completed}`);
      console.log(`Number of pages: ${result.pages.length}`);
      console.log('---');

      // Access individual pages
      for (const page of result.pages) {
        // The page object structure depends on the parsing configuration
        // It may contain: text, md, images, layout, structuredData, etc.
        if (page.text) console.log('Text:', page.text);
        if (page.md) console.log('Markdown:', page.md);
        if (page.json) console.log('JSON:', page.json);
      }
    }

    return results;
  }
}
