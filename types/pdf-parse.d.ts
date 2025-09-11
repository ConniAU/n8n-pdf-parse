declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    PDFFormatVersion?: string;
    [key: string]: any;
  }

  interface PDFMetadata {
    [key: string]: any;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata | null;
    version: string;
    text: string;
  }

  interface PDFParseOptions {
    pagerender?: (pageData: any) => any;
    version?: string;
    max?: number;
    [key: string]: any;
  }

  function pdfParse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFData>;

  export = pdfParse;
}