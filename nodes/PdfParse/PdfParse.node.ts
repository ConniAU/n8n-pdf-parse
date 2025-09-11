/**
 * @file PdfParse.node.ts
 * @description N8N node for parsing PDF files to text with enhanced AI-friendly formatting
 * @author AI Assistant
 * @date 2025-09-11
 * @modified 2025-09-11
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IBinaryKeyData,
	IDataObject,
	NodeConnectionType,
} from 'n8n-workflow';

import pdfParse from 'pdf-parse';

// Helper function for text formatting with improved layout detection
function formatText(text: string, formatting: string): string {
	switch (formatting) {
		case 'raw':
			// Keep original formatting - best for AI processing
			return text.replace(/\r\n/g, '\n');

		case 'smart':
			// Smart layout preservation with better spacing detection
			return text
				.replace(/\r\n/g, '\n') // Normalize line endings
				// Fix common PDF parsing issues where words run together
				.replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
				.replace(/(\d)([A-Za-z])/g, '$1 $2') // Add space between number and letter
				.replace(/([A-Za-z])(\d)/g, '$1 $2') // Add space between letter and number
				.replace(/([.!?])\s*\n/g, '$1\n\n') // Add paragraph breaks after sentences
				.replace(/\n{4,}/g, '\n\n\n') // Limit excessive line breaks
				.replace(/^\s+|\s+$/gm, '') // Trim each line
				// Improve specific purchase order formatting
				.replace(/PURCHASEORDERNO:/g, 'PURCHASE ORDER NO:')
				.replace(/([A-Z]{2,})\s*([A-Z]{2,})/g, '$1\n$2') // Split consecutive caps groups
				.replace(/(\d{2}\/\d{2}\/\d{4})/g, '\n$1') // Put dates on new lines
				.replace(/(IMPORTANT:)/g, '\n$1'); // Put important notices on new lines

		case 'structured':
			// Enhanced structured formatting for purchase orders and forms
			return text
				.replace(/\r\n/g, '\n')
				// Add spaces for run-together words
				.replace(/([a-z])([A-Z])/g, '$1 $2')
				.replace(/(\d)([A-Za-z])/g, '$1 $2')
				.replace(/([A-Za-z])(\d)/g, '$1 $2')
				// Better structure for addresses and contact info
				.replace(/(GPOBox\d+)/g, 'GPO Box $1')
				.replace(/([A-Z]{2,}\s[A-Z]{2,}\s\d+)/g, '\n$1') // State/postcode patterns
				.replace(/(www\.[^\s]+)/g, '\n$1') // Web addresses on new lines
				.replace(/([^\s]+@[^\s]+)/g, '\n$1') // Email addresses on new lines  
				.replace(/(\(\d{2}\)\s\d{4}\s\d{3,4})/g, '\n$1') // Phone numbers on new lines
				// Purchase order specific formatting
				.replace(/PURCHASEORDERNO:/g, 'PURCHASE ORDER NO:')
				.replace(/(GOODS OR SERVICE REQUIRED)/g, '\n\n$1\n')
				.replace(/(Total Order Value)/g, '\n$1')
				.replace(/(IMPORTANT:)/g, '\n\n$1')
				// Clean up extra spaces and line breaks
				.replace(/[ \t]+/g, ' ')
				.replace(/\n{3,}/g, '\n\n')
				.replace(/^\s+|\s+$/gm, '')
				.trim();

		case 'visual':
			// Universal visual layout mode - mimics human text selection behavior
			return text
				.replace(/\r\n/g, '\n')

				// 1. FUNDAMENTAL LAYOUT PATTERNS
				// Preserve spacing around punctuation that indicates structure
				.replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Sentence breaks with capitals
				.replace(/(:)\s*([A-Z])/g, '$1\n$2') // Colon followed by capitals (labels)

				// 2. WHITESPACE INTERPRETATION
				// Multiple spaces often indicate column separation in visual layout
				.replace(/(\S)\s{3,}(\S)/g, '$1\n$2') // 3+ spaces = new line
				.replace(/(\S)\s{2}(\S)/g, '$1  $2') // Preserve 2 spaces as intentional spacing

				// 3. CAPITALIZATION PATTERNS
				// All caps sections often represent headers or important sections
				.replace(/([a-z])\s*([A-Z]{3,}(?:\s+[A-Z]+)*)/g, '$1\n\n$2') // Transition to all caps
				.replace(/([A-Z]{3,}(?:\s+[A-Z]+)*)\s*([a-z])/g, '$1\n\n$2') // Transition from all caps

				// 4. COMMON SEPARATORS AND DELIMITERS
				// Colons often separate labels from values
				.replace(/([^:\n]+:)\s*([^\n]+)/g, '$1\n$2')
				// Dashes and underscores used as separators
				.replace(/[-_]{3,}/g, '\n$&\n') // Lines of dashes/underscores

				// 5. NUMERICAL PATTERNS
				// Numbers at start of line often indicate lists or items
				.replace(/([^\n])\s*(\d+\.?\s)/g, '$1\n$2') // Number lists
				.replace(/([^\n])\s*([a-z]\.\s)/gi, '$1\n$2') // Letter lists

				// 6. PARENTHESES AND BRACKETS
				// Often contain supplementary info that should be separated
				.replace(/([^\s])\s*(\([^)]+\))/g, '$1\n$2')
				.replace(/([^\s])\s*(\[[^\]]+\])/g, '$1\n$2')

				// 7. CONTACT INFORMATION PATTERNS (universal)
				// Email addresses (any domain)
				.replace(/(\S+@\S+\.\S+)/g, '\n$1')
				// URLs and websites (any format)
				.replace(/((?:https?:\/\/|www\.)\S+)/g, '\n$1')
				// Phone number patterns (international)
				.replace(/(\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g, '\n$1')

				// 8. ADDRESS AND LOCATION PATTERNS
				// Postal/ZIP codes (various international formats)
				.replace(/(\b\d{3,5}[-\s]?\d{0,4}\b)/g, ' $1') // Keep postal codes with context
				// Common address indicators
				.replace(/(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\s/gi, '$1\n')

				// 9. DATE AND TIME PATTERNS
				// Various date formats
				.replace(/(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/g, '\n$1')
				.replace(/(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})/g, '\n$1')
				// Time patterns
				.replace(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)/g, '\n$1')

				// 10. CURRENCY AND FINANCIAL (universal)
				// Any currency symbol followed by numbers
				.replace(/([\$€£¥₹₽¢₩₪₫₦₨₱₡₴₼][\d,]+\.?\d*)/g, '\n$1')
				// Percentage values
				.replace(/(\d+\.?\d*%)/g, ' $1')

				// 11. WORD BOUNDARY FIXES
				// Fix common PDF parsing artifacts where words run together
				.replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
				.replace(/(\d)([A-Za-z])/g, '$1 $2') // number+letter
				.replace(/([A-Za-z])(\d)/g, '$1 $2') // letter+number
				.replace(/([.,;])([A-Za-z])/g, '$1 $2') // punctuation+letter

				// 12. STRUCTURAL CLEANUP
				// Consolidate excessive whitespace while preserving intentional breaks
				.replace(/\n{4,}/g, '\n\n\n') // Max 3 consecutive line breaks
				.replace(/[ \t]+/g, ' ') // Consolidate spaces and tabs
				.replace(/^\s+|\s+$/gm, '') // Trim each line
				.replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up spaced empty lines
				.trim();

		case 'minimal':
			// Remove extra spaces but preserve all line breaks
			return text
				.replace(/\r\n/g, '\n')
				.replace(/[ \t]+/g, ' ')
				.replace(/^\s+|\s+$/gm, '');

		case 'compact':
			// Remove most whitespace for compact text
			return text
				.replace(/\s+/g, ' ')
				.replace(/\n\s*\n/g, '\n')
				.trim();

		default:
			return text;
	}
}

export class PdfParse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF Parse',
		name: 'pdfParse',
		icon: 'file:icon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["source"]}}',
		description: 'Parse PDF files and extract text content with enhanced AI-friendly formatting',
		defaults: {
			name: 'PDF Parse',
		},
		inputs: [{ displayName: '', type: NodeConnectionType.Main }],
		outputs: [{ displayName: '', type: NodeConnectionType.Main }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Parse PDF',
						value: 'parse',
						description: 'Extract text content from PDF file',
						action: 'Parse a PDF file',
					},
				],
				default: 'parse',
			},
			{
				displayName: 'PDF Source',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'Binary Data',
						value: 'binary',
						description: 'PDF file from binary data property',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'PDF file from URL',
					},
				],
				default: 'binary',
				description: 'Source of the PDF file to parse',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						source: ['binary'],
					},
				},
				description: 'Name of the binary property that contains the PDF file',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						source: ['url'],
					},
				},
				description: 'URL of the PDF file to parse',
			},
			{
				displayName: 'Output Property Name',
				name: 'outputProperty',
				type: 'string',
				default: 'text',
				description: 'Property name to store the extracted text',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Pages',
						name: 'maxPages',
						type: 'number',
						default: 0,
						description: 'Maximum number of pages to parse (0 = all pages)',
						typeOptions: {
							minValue: 0,
						},
					},
					{
						displayName: 'Page Range Start',
						name: 'pageRangeStart',
						type: 'number',
						default: 1,
						description: 'Starting page number (1-based)',
						typeOptions: {
							minValue: 1,
						},
					},
					{
						displayName: 'Page Range End',
						name: 'pageRangeEnd',
						type: 'number',
						default: 0,
						description: 'Ending page number (0 = last page)',
						typeOptions: {
							minValue: 0,
						},
					},
					{
						displayName: 'Text Formatting',
						name: 'textFormatting',
						type: 'options',
						options: [
							{
								name: 'Raw (Best for AI)',
								value: 'raw',
								description: 'Keep original formatting with all line breaks and spaces',
							},
							{
								name: 'Smart Layout',
								value: 'smart',
								description: 'Intelligent layout preservation with enhanced spacing',
							},
							{
								name: 'Minimal Cleanup',
								value: 'minimal',
								description: 'Remove extra spaces but keep line breaks',
							},
							{
								name: 'Visual Layout',
								value: 'visual',
								description: 'Universal layout preservation - replicates human text selection patterns for any content',
							},
							{
								name: 'Structured',
								value: 'structured',
								description: 'Clean formatting while preserving document structure',
							},
							{
								name: 'Compact',
								value: 'compact',
								description: 'Remove most whitespace for compact text',
							},
						],
						default: 'raw',
						description: 'Text formatting style for extracted content',
					},
					{
						displayName: 'Include Metadata',
						name: 'includeMetadata',
						type: 'boolean',
						default: false,
						description: 'Whether to include PDF metadata in the output',
					},
					{
						displayName: 'Split by Pages',
						name: 'splitByPages',
						type: 'boolean',
						default: false,
						description: 'Whether to split output by pages (returns array of page texts)',
					},
					{
						displayName: 'Version',
						name: 'version',
						type: 'string',
						default: 'v1.10.100',
						description: 'PDF.js version to use for parsing',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const source = this.getNodeParameter('source', i) as string;
				const outputProperty = this.getNodeParameter('outputProperty', i) as string;
				const additionalOptions = this.getNodeParameter('additionalOptions', i) as IDataObject;

				let pdfBuffer: Buffer;

				// Get PDF data based on source
				if (source === 'binary') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
					pdfBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
				} else if (source === 'url') {
					const url = this.getNodeParameter('url', i) as string;

					if (!url) {
						throw new NodeOperationError(this.getNode(), 'URL is required when source is set to URL', {
							itemIndex: i,
						});
					}

					// Validate URL format
					try {
						new URL(url);
					} catch {
						throw new NodeOperationError(this.getNode(), 'Invalid URL format', {
							itemIndex: i,
						});
					}

					// Fetch PDF from URL
					const response = await this.helpers.request({
						method: 'GET',
						url,
						encoding: null, // Important: get binary data
					});

					if (!response) {
						throw new NodeOperationError(this.getNode(), 'Failed to fetch PDF from URL', {
							itemIndex: i,
						});
					}

					pdfBuffer = Buffer.from(response);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown source: ${source}`, {
						itemIndex: i,
					});
				}

				// Validate PDF buffer
				if (!pdfBuffer || pdfBuffer.length === 0) {
					throw new NodeOperationError(this.getNode(), 'PDF file is empty or could not be read', {
						itemIndex: i,
					});
				}

				// Check if it's actually a PDF file
				const magic = pdfBuffer.subarray(0, 4).toString();
				if (magic !== '%PDF') {
					throw new NodeOperationError(this.getNode(), 'File does not appear to be a valid PDF', {
						itemIndex: i,
					});
				}

				// Prepare pdf-parse options
				const parseOptions: any = {
					version: additionalOptions.version || 'v1.10.100',
				};

				// Handle page range if specified
				if (additionalOptions.pageRangeStart || additionalOptions.pageRangeEnd) {
					const start = (additionalOptions.pageRangeStart as number) || 1;
					const end = additionalOptions.pageRangeEnd as number;

					parseOptions.pagerender = (pageData: any) => {
						const pageNum = pageData.pageIndex + 1;
						if (pageNum < start) return null;
						if (end && pageNum > end) return null;
						return pageData.getTextContent();
					};
				}

				// Handle max pages
				if (additionalOptions.maxPages && (additionalOptions.maxPages as number) > 0) {
					const maxPages = additionalOptions.maxPages as number;
					let pageCount = 0;

					parseOptions.pagerender = (pageData: any) => {
						pageCount++;
						if (pageCount > maxPages) return null;
						return pageData.getTextContent();
					};
				}

				// Parse PDF
				const pdfData = await pdfParse(pdfBuffer, parseOptions);

				let extractedText = pdfData.text;

				// Apply text formatting based on user preference
				const textFormatting = (additionalOptions.textFormatting as string) || 'raw';
				extractedText = formatText(extractedText, textFormatting);

				// Prepare output data
				const outputData: IDataObject = {
					...items[i].json,
				};

				if (additionalOptions.splitByPages) {
					// Split text by pages (approximate based on form feeds)
					const pages = extractedText.split(/\f/).filter((page: string) => page.trim().length > 0);
					outputData[outputProperty] = pages;
				} else {
					outputData[outputProperty] = extractedText;
				}

				// Include metadata if requested
				if (additionalOptions.includeMetadata) {
					outputData.pdfMetadata = {
						numPages: pdfData.numpages,
						info: pdfData.info,
						metadata: pdfData.metadata,
						version: pdfData.version,
					};
				} else {
					// Always include page count as it's useful
					outputData.numPages = pdfData.numpages;
				}

				// Add statistics
				outputData.pdfStats = {
					textLength: extractedText.length,
					wordCount: extractedText.split(/\s+/).filter((word: string) => word.length > 0).length,
					pageCount: pdfData.numpages,
				};

				returnData.push({
					json: outputData,
					binary: items[i].binary,
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							...items[i].json,
							error: error instanceof Error ? error.message : String(error),
						},
						binary: items[i].binary,
					});
					continue;
				}

				const errorMessage = error instanceof Error ? error.message : String(error);
				throw new NodeOperationError(this.getNode(), errorMessage, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}