# N8N PDF Parse Node

A robust N8N community node for parsing PDF files and extracting text content with advanced configuration options.

## Features

- 🤖 **AI-Optimized Text Extraction**: Enhanced pdf-parse engine with superior AI-friendly formatting
- 🖼️ **PDF to Image Conversion**: Zero native dependencies - pure JavaScript PDF to PNG/JPEG conversion
- ✅ **Raw Mode (Default)**: Preserves all line breaks and document structure for optimal AI processing
- ✅ **Multiple Formatting Options**: Raw, Smart, Minimal, Structured, Visual, and Compact modes
- ✅ **Perfect for Document Analysis**: Purchase orders, invoices, forms, and tables maintain layout
- ✅ **Enhanced Line Break Preservation**: Keeps document structure intact for LLM processing
- ✅ **Dual Operations**: Text parsing and image conversion in one node
- ✅ **Multiple Input Sources**: Binary data and URL sources
- ✅ **Advanced Options**: Page ranges, DPI control, custom dimensions, format selection
- ✅ **Comprehensive Output**: Text, images, metadata, and statistics
- ✅ **Robust Error Handling**: Detailed validation and graceful failure handling
- ✅ **TypeScript**: Full type safety and IntelliSense support

## Installation

### Option 1: Install via npm (Recommended)

```bash
npm install n8n-nodes-pdf-parse
```

### Option 2: Manual Installation

1. Navigate to your N8N installation directory
2. Go to the `~/.n8n/custom` directory (create if it doesn't exist)
3. Clone or download this repository
4. Install dependencies and build:

```bash
cd n8n-nodes-pdf-parse
npm install
npm run build
```

### Option 3: Global Installation

```bash
npm install -g n8n-nodes-pdf-parse
```

After installation, restart your N8N instance to load the new node.

## Configuration

### Environment Variables

For self-hosted N8N instances, you can set these environment variables:

```bash
# Allow community nodes
N8N_NODES_INCLUDE=["n8n-nodes-pdf-parse"]

# Or allow all community nodes
N8N_NODES_EXCLUDE=[]
```

## Usage

### Basic Usage

1. Add the "PDF Parse" node to your workflow
2. Connect it to a node that provides PDF data (e.g., HTTP Request, File Read)
3. Configure the source type (Binary Data or URL)
4. Set the binary property name or URL
5. Configure additional options as needed

### Node Parameters

#### Required Parameters

- **Operation**: Choose between "Parse PDF" or "Convert to Image"
- **PDF Source**: Choose between "Binary Data" or "URL"
- **Binary Property**: Name of the binary property containing the PDF (when using binary data)
- **URL**: URL of the PDF file to parse (when using URL source)

#### Optional Parameters

- **Output Property Name**: Property name to store the result (default: "result")
- **Max Pages**: Maximum number of pages to process (0 = all pages)
- **Page Range Start**: Starting page number (1-based)
- **Page Range End**: Ending page number (0 = last page)

#### Text Parsing Options (Parse PDF Operation)
- **Text Formatting**: Choose formatting style:
  - **Raw (Best for AI)**: Preserves all line breaks and document structure
  - **Smart Layout**: Intelligent layout preservation with enhanced spacing
  - **Visual Layout**: Universal layout preservation - replicates human text selection patterns
  - **Minimal Cleanup**: Removes extra spaces but keeps line breaks
  - **Structured**: Cleans formatting while preserving structure
  - **Compact**: Removes most whitespace for compact text
- **Include Metadata**: Include PDF metadata in output
- **Split by Pages**: Return text split by pages as an array
- **Version**: PDF.js version to use for parsing

#### Image Conversion Options (Convert to Image Operation)
- **Image Format**: Choose between PNG or JPEG output
  - **PNG**: Better quality, transparency support, larger files
  - **JPEG**: Smaller files, no transparency, good for photos
- **DPI (Resolution)**: 72-600 dots per inch (default: 150)
  - Higher DPI = better quality but larger files
  - 72 DPI = screen resolution, 300 DPI = print quality
- **Width**: Custom width in pixels (0 = auto based on DPI)
- **Height**: Custom height in pixels (0 = auto based on DPI) 
- **Preserve Aspect Ratio**: Maintain original proportions when resizing (default: true)

### Example Workflows

#### Example 1: Parse PDF from URL

```json
{
  "nodes": [
    {
      "parameters": {
        "operation": "parse",
        "source": "url",
        "url": "https://example.com/document.pdf",
        "outputProperty": "extractedText",
        "additionalOptions": {
          "normalizeWhitespace": true,
          "includeMetadata": true
        }
      },
      "name": "PDF Parse",
      "type": "n8n-nodes-pdf-parse.pdfParse"
    }
  ]
}
```

#### Example 2: Parse PDF from Binary Data

```json
{
  "nodes": [
    {
      "parameters": {
        "operation": "parse",
        "source": "binary",
        "binaryPropertyName": "data",
        "outputProperty": "pdfText",
        "additionalOptions": {
          "maxPages": 10,
          "splitByPages": true
        }
      },
      "name": "PDF Parse",
      "type": "n8n-nodes-pdf-parse.pdfParse"
    }
  ]
}
```

#### Example 3: Parse Specific Page Range

```json
{
  "nodes": [
    {
      "parameters": {
        "operation": "parse",
        "source": "binary",
        "binaryPropertyName": "document",
        "additionalOptions": {
          "pageRangeStart": 5,
          "pageRangeEnd": 15,
          "normalizeWhitespace": true
        }
      },
      "name": "PDF Parse",
      "type": "n8n-nodes-pdf-parse.pdfParse"
    }
  ]
}
```

## Output Format

### Standard Output

```json
{
  "text": "Extracted PDF text content...",
  "numPages": 25,
  "pdfStats": {
    "textLength": 15420,
    "wordCount": 2156,
    "pageCount": 25
  }
}
```

### With Metadata

```json
{
  "text": "Extracted PDF text content...",
  "numPages": 25,
  "pdfMetadata": {
    "numPages": 25,
    "info": {
      "Title": "Document Title",
      "Author": "Document Author",
      "Creator": "PDF Creator",
      "Producer": "PDF Producer",
      "CreationDate": "D:20231201120000Z",
      "ModDate": "D:20231201120000Z"
    },
    "metadata": "Additional metadata...",
    "version": "1.7"
  },
  "pdfStats": {
    "textLength": 15420,
    "wordCount": 2156,
    "pageCount": 25
  }
}
```

### Split by Pages

```json
{
  "text": [
    "Page 1 text content...",
    "Page 2 text content...",
    "Page 3 text content..."
  ],
  "numPages": 3,
  "pdfStats": {
    "textLength": 2340,
    "wordCount": 456,
    "pageCount": 3
  }
}
```

## Error Handling

The node includes comprehensive error handling:

- **Invalid PDF files**: Validates PDF magic number
- **Network errors**: Handles URL fetch failures
- **Empty files**: Detects and reports empty PDF files
- **Invalid URLs**: Validates URL format
- **Missing properties**: Validates required parameters

When "Continue on Fail" is enabled, errors are added to the output data:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Supported PDF Features

- ✅ Text extraction from standard PDFs
- ✅ Multi-page documents
- ✅ Password-protected PDFs (basic support)
- ✅ Various PDF versions (1.0 - 2.0)
- ✅ Embedded fonts and text encoding
- ⚠️ OCR for scanned documents (not supported - text-based PDFs only)
- ⚠️ Complex layouts with tables/forms (basic support)

## Performance Considerations

- **Large PDFs**: Use page range options to limit processing
- **Memory usage**: Large PDFs may require more memory
- **Processing time**: Scales with document size and complexity
- **Network timeouts**: URLs should be accessible and responsive

## Dependencies

- `pdf-parse`: Enhanced PDF parsing library with AI-optimized text extraction
- `pdfjs-dist`: Mozilla's PDF.js library for reliable PDF processing and image generation
- `n8n-workflow`: N8N workflow types and utilities

**Zero Native Dependencies**: Unlike other PDF processing libraries, this node is 100% pure JavaScript with no native modules, binary compilation, or external system dependencies. Works instantly on all platforms without Canvas native modules, GraphicsMagick, ImageMagick, or Ghostscript.

## Development

### Setup

```bash
git clone https://github.com/ConniAU/n8n-pdf-parse.git
cd n8n-nodes-pdf-parse
npm install
```

### Build

```bash
npm run build
```

### Lint and Format

```bash
npm run lint
npm run format
```

### Test

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Node not appearing in N8N**
   - Ensure the package is properly installed
   - Restart N8N after installation
   - Check N8N logs for loading errors

2. **"Invalid PDF" errors**
   - Verify the file is actually a PDF
   - Check if the PDF is corrupted
   - Try with a different PDF file

3. **Memory issues with large PDFs**
   - Use page range options to limit processing
   - Increase Node.js memory limit: `--max-old-space-size=4096`

4. **Network timeout errors**
   - Check URL accessibility
   - Verify network connectivity
   - Consider downloading the file first

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
N8N_LOG_LEVEL=debug
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### Version 1.0.0
- Initial release
- PDF text extraction with pdf-parse
- Support for binary data and URL sources
- Advanced parsing options
- Comprehensive error handling
- TypeScript implementation

## Support

For issues, questions, or contributions:

- GitHub Issues: [https://github.com/ConniAU/n8n-pdf-parse/issues](https://github.com/ConniAU/n8n-pdf-parse/issues)
- N8N Community: [https://community.n8n.io](https://community.n8n.io)

## Acknowledgments

- Built with [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- Designed for [N8N](https://n8n.io) workflow automation
- Inspired by the N8N community's needs for PDF processing