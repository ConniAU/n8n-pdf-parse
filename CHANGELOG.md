# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-11

### 🧠 **Revolutionary Whitespace-Intelligent Parser**
- **Advanced Layout Analysis**: Multi-phase whitespace interpretation that distinguishes between column boundaries (large gaps) vs formatting (small gaps)
- **Logical Grouping Preservation**: Keeps related content together instead of over-breaking into separate lines
- **Context-Aware Breaking**: Smart colon handling that only breaks for major sections, not simple label:value pairs
- **Conservative Approach**: Avoids excessive line breaking while maintaining document structure

### 🎯 **Key Improvements Over Previous Versions**
- **Whitespace Intelligence**: 8+ spaces = column breaks, 5-7 = sections, 3-4 = preserved spacing, 2 = intentional formatting
- **Contact Block Preservation**: Addresses, phone numbers, emails kept in logical groupings
- **Better List Handling**: Line items and numbered content preserved as coherent blocks
- **Reduced Over-Breaking**: Eliminates unnecessary separation of related information

### 🔧 **Technical Enhancements**
- **Phase-Based Processing**: 8-phase analysis for optimal text structure preservation
- **Pattern Recognition**: Distinguishes between structural vs decorative whitespace
- **Content-Agnostic**: Works with any document type without hardcoded assumptions

## [1.1.1] - 2025-09-11

### 🚀 **Universal Document Layout Recognition**
- **New Visual Layout Mode**: Adaptive formatting that works with any document type - invoices, contracts, reports, statements
- **Intelligent Pattern Detection**: Automatically recognizes headers, contact info, financial data, dates, and table structures
- **Enhanced AI Processing**: Visual mode mimics manual text selection for superior AI understanding across document types
- **Universal Field Recognition**: Supports multiple currencies, date formats, postal codes, and business document patterns

### 🔧 **Improved Formatting Intelligence**
- **Multi-Language Support**: Handles various international formats (US, UK, AU postal codes, multiple currencies)
- **Adaptive Structure Preservation**: Maintains document hierarchy regardless of layout complexity
- **Better Word Separation**: Fixes run-together words that commonly occur in PDF parsing
- **Context-Aware Spacing**: Preserves logical document flow for optimal AI processing

## [1.1.0] - 2025-09-11

### 🚀 **Enhanced AI-Optimized PDF Parsing** 
- **Improved Text Formatting**: Enhanced the existing pdf-parse engine with better AI-friendly formatting
- **Better Line Break Preservation**: Raw mode now preserves all line breaks for superior AI document understanding
- **Enhanced Document Structure Recognition**: Purchase orders, invoices, and forms maintain proper layout

### 🆕 **New Features**
- **Raw Mode (Default)**: Preserves all original formatting for optimal AI processing
- **Smart Layout Mode**: Intelligent text spacing and paragraph detection
- **Enhanced Formatting Options**: 6 distinct formatting modes for different use cases
- **Better Error Handling**: More detailed error messages and validation

### 🔧 **Improved**
- **AI-Optimized Output**: Default "Raw" mode maintains document structure for AI understanding
- **Purchase Order Recognition**: Your PO example will now preserve line breaks properly
- **Table and Form Support**: Better handling of structured documents
- **Flexible Formatting**: Choose between raw, smart, minimal, structured, or compact modes

### 🛠 **Technical Improvements**
- Enhanced pdf-parse with intelligent text processing
- Improved TypeScript type definitions
- Better error handling and validation
- Optimized for AI/LLM document processing workflows

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