/**
 * @file PdfParse.node.ts
 * @description N8N node for parsing PDF files to text with advanced configuration options
 * @author AI Assistant
 * @date 2025-09-10
 * @modified 2025-09-10
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

export class PdfParse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF Parse',
		name: 'pdfParse',
		icon: 'file:pdf.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["source"]}}',
		description: 'Parse PDF files and extract text content with advanced options',
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
						displayName: 'Normalize Whitespace',
						name: 'normalizeWhitespace',
						type: 'boolean',
						default: true,
						description: 'Whether to normalize whitespace in extracted text',
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

				// Normalize whitespace if requested
				if (additionalOptions.normalizeWhitespace !== false) {
					extractedText = extractedText
						.replace(/\s+/g, ' ')
						.replace(/\n\s*\n/g, '\n')
						.trim();
				}

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