declare module 'react-native-html-to-pdf' {
  export interface PDFOptions {
    html: string;
    fileName: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
  }

  export interface PDFResult {
    filePath: string;
    base64?: string;
  }

  const RNHTMLtoPDF: {
    convert(options: PDFOptions): Promise<PDFResult>;
  };

  export default RNHTMLtoPDF;
}