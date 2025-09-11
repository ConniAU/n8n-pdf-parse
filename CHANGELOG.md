# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-09-11

### Improved
- **Enhanced Text Formatting Options**: Added new text formatting modes optimized for AI processing
  - Raw mode now preserves all line breaks for better AI document recognition
  - Added minimal, structured, and compact formatting options
  - Default changed to "Raw" mode for optimal AI parsing
- **Better Line Break Preservation**: Improved handling of line breaks to maintain document structure
- **Intelligent Whitespace Handling**: More sophisticated whitespace normalization that preserves document layout

### Fixed
- Text parsing now properly preserves line breaks for AI to recognize document structure
- Purchase orders, invoices, and structured documents now maintain their layout

## [1.0.0] - 2025-09-10

### Added
- Initial release of N8N PDF Parse community node
- Support for parsing PDF files from binary data or URLs
- Advanced configuration options including:
  - Page range selection (start/end pages)
  - Maximum pages limit
  - Text normalization and whitespace cleanup
  - Metadata extraction
  - Page-by-page text splitting
- Comprehensive error handling with detailed error messages
- Built-in PDF file validation
- Performance statistics (text length, word count, page count)
- TypeScript implementation for type safety
- Full documentation with examples
- Support for multiple PDF versions (1.0 - 2.0)
- Network timeout handling for URL sources
- Configurable PDF.js version selection

### Features
- **Multiple Input Sources**: Support for both binary data and URL inputs
- **Advanced Parsing Options**: Fine-grained control over parsing behavior
- **Robust Error Handling**: Graceful error handling with "Continue on Fail" support
- **Performance Optimized**: Efficient parsing with optional page limits
- **Developer Friendly**: TypeScript definitions and comprehensive documentation
- **N8N Integration**: Full compatibility with N8N workflow automation platform

### Technical Details
- Uses `pdf-parse` library for reliable PDF text extraction
- Compatible with Node.js >= 18.0.0
- Full TypeScript support with type definitions
- Follows N8N community node best practices
- Comprehensive test coverage ready
- ESLint and Prettier configuration included

### Documentation
- Complete README with installation and usage instructions
- Example workflows for basic and advanced usage
- Troubleshooting guide for common issues
- API documentation with all parameters explained
- Performance considerations and best practices