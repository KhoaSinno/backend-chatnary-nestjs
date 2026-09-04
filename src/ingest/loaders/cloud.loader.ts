import { Injectable } from '@nestjs/common';
import { LlamaParseReader } from 'llama-cloud-services';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudService {
  private reader: LlamaParseReader;

  constructor(private configService: ConfigService) {
    this.reader = new LlamaParseReader({
      apiKey: this.configService.get<string>('LLAMA_CLOUD_API_KEY'),
      tier: 'cost_effective',
      version: 'latest',
      high_res_ocr: true,
      adaptive_long_table: true,
      outlined_table_extraction: true,
      output_tables_as_HTML: true,
      precise_bounding_box: true,
    });
  }
  // docx, pdf, ... to markdown
  async load(fileUrl: string) {
    const results = await this.reader.parse(fileUrl);
    return results;
  }
}
