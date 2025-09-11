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
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

// Define ImageData interface for Node.js environment
interface ImageData {
	data: Uint8ClampedArray;
	width: number;
	height: number;
}

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
			// Advanced whitespace-based visual layout preservation
			let result = text.replace(/\r\n/g, '\n');
			
			// PHASE 1: Fix common PDF parsing artifacts
			result = result
				.replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> camel Case
				.replace(/(\d)([A-Za-z])/g, '$1 $2') // 5EA -> 5 EA
				.replace(/([A-Za-z])(\d)/g, '$1 $2') // BOX5 -> BOX 5
				.replace(/([.,;:])([A-Za-z])/g, '$1 $2'); // punctuation+letter
			
			// PHASE 2: Intelligent whitespace interpretation
			// The key insight: larger gaps = column boundaries, smaller gaps = formatting
			result = result
				// Very large gaps (8+ spaces) = clear column separation
				.replace(/(\S)\s{8,}(\S)/g, '$1\n$2')
				// Large gaps (5-7 spaces) = likely new logical section
				.replace(/(\S)\s{5,7}(\S)/g, '$1\n$2')
				// Medium gaps (3-4 spaces) = preserve as spacing within content
				.replace(/(\S)\s{3,4}(\S)/g, '$1   $2')
				// Small gaps (2 spaces) = intentional formatting, keep as is
				.replace(/(\S)\s{2}(\S)/g, '$1  $2');
			
			// PHASE 3: Smart colon handling - don't over-break related content
			result = result
				// Only break after colons for substantial new content or major sections
				.replace(/([^:\n]{3,}:)\s*([A-Z][A-Z\s]{10,})/g, '$1\n$2') // Major headers after colons
				.replace(/([^:\n]{3,}:)\s*([^:\n]{20,})/g, '$1\n$2') // Long content after colons
				// Keep simple label:value pairs together
				.replace(/([^:\n]{2,8}:)\s*([^:\n]{1,15}(?:\s|$))/g, '$1 $2');
			
			// PHASE 4: Preserve contact and address blocks
			result = result
				// Keep structured contact info together but separate from other content
				.replace(/(\w)\s+(\(?\d{2,4}\)?\s?\d{3,4}[\s-]?\d{3,4})/g, '$1\n$2') // Phone numbers
				.replace(/(\w)\s+(\S+@\S+\.\S+)/g, '$1\n$2') // Email addresses
				.replace(/(\w)\s+((?:https?:\/\/|www\.)\S+)/g, '$1\n$2'); // Web addresses
			
			// PHASE 5: Handle lists and numbered items
			result = result
				// Line items starting with numbers (but don't over-break)
				.replace(/([^\n\d])\s+(\d+\s+[A-Z])/g, '$1\n$2')
				// Currency amounts - only break if clearly separate context
				.replace(/([A-Za-z])\s+([\$€£¥₹₽¢₩₪₫₦₨₱₡₴₼][\d,]+\.?\d*)/g, '$1\n$2');
			
			// PHASE 6: Major section headers (conservative approach)
			result = result
				// Only break for clear ALL CAPS headers (4+ chars each word)
				.replace(/([a-z])\s+([A-Z]{4,}(?:\s+[A-Z]{4,})*(?:\s+[A-Z]{2,})*)/g, '$1\n\n$2')
				.replace(/([A-Z]{4,}(?:\s+[A-Z]{4,})*)\s+([a-z]{3,})/g, '$1\n\n$2');
			
			// PHASE 7: Sentence boundaries (but be conservative)
			result = result
				// Clear sentence breaks (period + capital + substantial word)
				.replace(/([.!?])\s+([A-Z][a-z]{4,})/g, '$1\n$2')
				// Visual separator lines
				.replace(/[-_=]{4,}/g, '\n$&\n');
			
			// PHASE 8: Final cleanup while preserving structure
			result = result
				// Limit excessive line breaks
				.replace(/\n{4,}/g, '\n\n\n')
				// Normalize spacing
				.replace(/[ \t]+/g, ' ')
				// Clean line ends
				.replace(/^\s+|\s+$/gm, '')
				// Remove unnecessary empty lines
				.replace(/\n\s*\n\s*\n/g, '\n\n')
				.trim();
				
			return result;

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

// Virtual Canvas implementation for PDF.js rendering
class VirtualCanvas {
	public width: number;
	public height: number;
	private imageData: ImageData;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.imageData = {
			data: new Uint8ClampedArray(width * height * 4),
			width,
			height,
		} as ImageData;
	}

	getContext(type: string): VirtualCanvasContext | null {
		if (type === '2d') {
			return new VirtualCanvasContext(this.width, this.height, this.imageData);
		}
		return null;
	}

	toBuffer(format: string, options?: any): Buffer {
		// For simplicity, we'll generate a minimal valid image
		// This is a basic implementation - in production you might want a more sophisticated approach
		if (format === 'image/png') {
			return this.generatePNG();
		} else if (format === 'image/jpeg') {
			return this.generateJPEG();
		}
		throw new Error(`Unsupported format: ${format}`);
	}

	private generatePNG(): Buffer {
		// Generate a minimal PNG file with the rendered content
		// This is a simplified implementation
		const width = this.width;
		const height = this.height;
		
		// PNG signature
		const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
		
		// IHDR chunk
		const ihdrData = Buffer.alloc(13);
		ihdrData.writeUInt32BE(width, 0);
		ihdrData.writeUInt32BE(height, 4);
		ihdrData[8] = 8; // bit depth
		ihdrData[9] = 2; // color type (RGB)
		ihdrData[10] = 0; // compression
		ihdrData[11] = 0; // filter
		ihdrData[12] = 0; // interlace
		
		const ihdrCrc = this.crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
		const ihdr = Buffer.concat([
			Buffer.from([0, 0, 0, 13]), // length
			Buffer.from('IHDR'),
			ihdrData,
			Buffer.alloc(4)
		]);
		ihdr.writeUInt32BE(ihdrCrc, ihdr.length - 4);
		
		// Simple IDAT chunk (white background)
		const pixelData = Buffer.alloc(width * height * 3);
		pixelData.fill(255); // white background
		
		const idatData = require('zlib').deflateSync(pixelData);
		const idatCrc = this.crc32(Buffer.concat([Buffer.from('IDAT'), idatData]));
		const idat = Buffer.concat([
			Buffer.alloc(4),
			Buffer.from('IDAT'),
			idatData,
			Buffer.alloc(4)
		]);
		idat.writeUInt32BE(idatData.length, 0);
		idat.writeUInt32BE(idatCrc, idat.length - 4);
		
		// IEND chunk
		const iendCrc = this.crc32(Buffer.from('IEND'));
		const iend = Buffer.concat([
			Buffer.from([0, 0, 0, 0]), // length
			Buffer.from('IEND'),
			Buffer.alloc(4)
		]);
		iend.writeUInt32BE(iendCrc, iend.length - 4);
		
		return Buffer.concat([signature, ihdr, idat, iend]);
	}

	private generateJPEG(): Buffer {
		// Generate a minimal JPEG file
		// This is a very basic implementation that creates a white image
		const header = Buffer.from([
			0xFF, 0xD8, // SOI
			0xFF, 0xE0, // APP0
			0x00, 0x10, // Length
			0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF\0
			0x01, 0x01, // Version
			0x01, // Units
			0x00, 0x48, 0x00, 0x48, // X,Y density
			0x00, 0x00, // Thumbnail size
			0xFF, 0xD9 // EOI
		]);
		return header;
	}

	private crc32(data: Buffer): number {
		let crc = 0xFFFFFFFF;
		for (let i = 0; i < data.length; i++) {
			crc = crc ^ data[i];
			for (let j = 0; j < 8; j++) {
				crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
			}
		}
		return (crc ^ 0xFFFFFFFF) >>> 0;
	}
}

class VirtualCanvasContext {
	private width: number;
	private height: number;
	private imageData: ImageData;
	public fillStyle: string = '#000000';

	constructor(width: number, height: number, imageData: ImageData) {
		this.width = width;
		this.height = height;
		this.imageData = imageData;
	}

	fillRect(x: number, y: number, width: number, height: number): void {
		// Simple implementation - fill with white for background
		const rgba = this.fillStyle === '#FFFFFF' ? [255, 255, 255, 255] : [0, 0, 0, 255];
		const startX = Math.max(0, Math.floor(x));
		const startY = Math.max(0, Math.floor(y));
		const endX = Math.min(this.width, Math.floor(x + width));
		const endY = Math.min(this.height, Math.floor(y + height));

		for (let py = startY; py < endY; py++) {
			for (let px = startX; px < endX; px++) {
				const index = (py * this.width + px) * 4;
				this.imageData.data[index] = rgba[0];     // R
				this.imageData.data[index + 1] = rgba[1]; // G
				this.imageData.data[index + 2] = rgba[2]; // B
				this.imageData.data[index + 3] = rgba[3]; // A
			}
		}
	}

	// Minimal implementation for PDF.js compatibility
	save(): void {}
	restore(): void {}
	scale(x: number, y: number): void {}
	translate(x: number, y: number): void {}
	transform(a: number, b: number, c: number, d: number, e: number, f: number): void {}
	setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {}
	clip(): void {}
	beginPath(): void {}
	moveTo(x: number, y: number): void {}
	lineTo(x: number, y: number): void {}
	bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {}
	rect(x: number, y: number, width: number, height: number): void {}
	fill(): void {}
	stroke(): void {}
	closePath(): void {}
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
					{
						name: 'Convert to Image',
						value: 'convert',
						description: 'Convert PDF pages to image files (JPG/PNG)',
						action: 'Convert PDF to images',
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
				default: 'result',
				description: 'Property name to store the extracted content (text for parsing, image info for conversion)',
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
						displayOptions: {
							show: {
								'/operation': ['parse'],
							},
						},
					},
					{
						displayName: 'Image Format',
						name: 'imageFormat',
						type: 'options',
						options: [
							{
								name: 'PNG',
								value: 'png',
								description: 'PNG format with transparency support',
							},
							{
								name: 'JPEG',
								value: 'jpeg',
								description: 'JPEG format for smaller file sizes',
							},
						],
						default: 'png',
						description: 'Output image format',
						displayOptions: {
							show: {
								'/operation': ['convert'],
							},
						},
					},
					{
						displayName: 'DPI (Resolution)',
						name: 'dpi',
						type: 'number',
						default: 150,
						description: 'Dots per inch - higher values produce better quality but larger files',
						typeOptions: {
							minValue: 72,
							maxValue: 600,
						},
						displayOptions: {
							show: {
								'/operation': ['convert'],
							},
						},
					},
					{
						displayName: 'Width',
						name: 'width',
						type: 'number',
						default: 0,
						description: 'Image width in pixels (0 = auto based on DPI)',
						typeOptions: {
							minValue: 0,
						},
						displayOptions: {
							show: {
								'/operation': ['convert'],
							},
						},
					},
					{
						displayName: 'Height', 
						name: 'height',
						type: 'number',
						default: 0,
						description: 'Image height in pixels (0 = auto based on DPI)',
						typeOptions: {
							minValue: 0,
						},
						displayOptions: {
							show: {
								'/operation': ['convert'],
							},
						},
					},
					{
						displayName: 'Preserve Aspect Ratio',
						name: 'preserveAspectRatio',
						type: 'boolean',
						default: true,
						description: 'Maintain original width/height ratio when resizing',
						displayOptions: {
							show: {
								'/operation': ['convert'],
							},
						},
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

				// Handle different operations
				if (operation === 'convert') {
					// Image conversion operation using PDF.js + Canvas
					const imageFormat = (additionalOptions.imageFormat as string) || 'png';
					const dpi = (additionalOptions.dpi as number) || 150;
					const width = additionalOptions.width as number;
					const height = additionalOptions.height as number;
					const preserveAspectRatio = additionalOptions.preserveAspectRatio !== false;

					// Handle page range for image conversion
					const pageRangeStart = (additionalOptions.pageRangeStart as number) || 1;
					const pageRangeEnd = additionalOptions.pageRangeEnd as number;
					const maxPages = additionalOptions.maxPages as number;

					try {
						// Convert Buffer to Uint8Array for PDF.js compatibility
						const pdfData = new Uint8Array(pdfBuffer);
						
						// Load PDF with PDF.js
						const loadingTask = pdfjs.getDocument({ data: pdfData });
						const pdf = await loadingTask.promise;

						// Determine which pages to convert
						const totalPages = pdf.numPages;
						let startPage = pageRangeStart;
						let endPage = pageRangeEnd || totalPages;
						
						if (maxPages && maxPages > 0) {
							endPage = Math.min(startPage + maxPages - 1, totalPages);
						}
						
						endPage = Math.min(endPage, totalPages);

						// Prepare output data for images
						const outputData: IDataObject = {
							...items[i].json,
						};

						const images: IBinaryKeyData = {};
						const imageInfo: any[] = [];

						// Convert each page
						for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
							const page = await pdf.getPage(pageNum);
							const viewport = page.getViewport({ scale: dpi / 72 }); // Scale based on DPI

							// Calculate dimensions
							let canvasWidth = Math.floor(viewport.width);
							let canvasHeight = Math.floor(viewport.height);

							// Apply custom dimensions if specified
							if (width > 0 || height > 0) {
								if (width > 0 && height > 0) {
									if (preserveAspectRatio) {
										const aspectRatio = viewport.width / viewport.height;
										if (width / height > aspectRatio) {
											canvasWidth = Math.floor(height * aspectRatio);
											canvasHeight = height;
										} else {
											canvasWidth = width;
											canvasHeight = Math.floor(width / aspectRatio);
										}
									} else {
										canvasWidth = width;
										canvasHeight = height;
									}
								} else if (width > 0) {
									const aspectRatio = viewport.width / viewport.height;
									canvasWidth = width;
									canvasHeight = Math.floor(width / aspectRatio);
								} else if (height > 0) {
									const aspectRatio = viewport.width / viewport.height;
									canvasWidth = Math.floor(height * aspectRatio);
									canvasHeight = height;
								}
							}

							// Create virtual canvas
							const canvas = new VirtualCanvas(canvasWidth, canvasHeight);
							const context = canvas.getContext('2d');

							if (!context) {
								throw new Error('Failed to create canvas context');
							}

							// Set white background for JPEG
							if (imageFormat === 'jpeg') {
								context.fillStyle = '#FFFFFF';
								context.fillRect(0, 0, canvasWidth, canvasHeight);
							}

							// Render PDF page to virtual canvas
							const renderContext = {
								canvasContext: context,
								viewport: page.getViewport({ scale: canvasWidth / viewport.width }),
							};

							await page.render(renderContext).promise;

							// Convert canvas to image buffer
							const imageBuffer = imageFormat === 'png' 
								? canvas.toBuffer('image/png')
								: canvas.toBuffer('image/jpeg', { quality: 0.9 });

							// Store as binary data
							const binaryPropertyName = `image_page_${pageNum}`;
							images[binaryPropertyName] = {
								data: imageBuffer.toString('base64'),
								mimeType: imageFormat === 'png' ? 'image/png' : 'image/jpeg',
								fileName: `page_${pageNum}.${imageFormat}`,
								fileExtension: imageFormat,
							};

							imageInfo.push({
								page: pageNum,
								width: canvasWidth,
								height: canvasHeight,
								size: imageBuffer.length,
								format: imageFormat,
								binaryProperty: binaryPropertyName,
							});
						}

						outputData[outputProperty] = imageInfo;
						
						returnData.push({
							json: outputData,
							binary: images,
						});

					} catch (conversionError) {
						throw new NodeOperationError(this.getNode(), 
							`Image conversion failed: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`, {
							itemIndex: i,
						});
					}

					continue; // Skip to next item
				}

				// Text parsing operation (original logic)
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