import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ExtractedContent {
  text: string;
  wordCount: number;
  fileName: string;
  fileType: string;
}

class ContentExtractor {
  async extractFromFile(file: File): Promise<ExtractedContent> {
    try {
      let text = '';

      switch (file.type) {
        case 'application/pdf':
          text = await this.extractFromPDF(file);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          text = await this.extractFromWord(file);
          break;
        case 'text/plain':
          text = await this.extractFromText(file);
          break;
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          text = await this.extractFromExcel(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type || file.name.split('.').pop()}`);
      }

      const trimmed = text.trim();

      return {
        text: trimmed,
        wordCount: trimmed.split(/\s+/).filter((word) => word.length > 0).length,
        fileName: file.name,
        fileType: file.type,
      };
    } catch (error) {
      console.error('Content extraction error:', error);
      throw new Error(`Failed to extract content from ${file.name}`);
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        pages.push(pageText);
      }

      return pages.join('\n\n').replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractFromWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  private async extractFromText(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error('Failed to read text file');
    }
  }

  private async extractFromExcel(file: File): Promise<string> {
    try {
      const text = await file.text();
      return text.replace(/[^\w\s.,!?;:-]/gi, ' ').replace(/\s+/g, ' ');
    } catch (error) {
      console.error('Excel extraction error:', error);
      throw new Error('Failed to extract text from Excel file');
    }
  }
}

export const contentExtractor = new ContentExtractor();
