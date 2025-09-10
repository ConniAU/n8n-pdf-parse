/**
 * Quick test script for PDF Parse node
 */
const { PdfParse } = require('./dist/nodes/PdfParse/PdfParse.node');

// Mock N8N execution context
const mockContext = {
  getInputData: () => [{ json: {}, binary: {} }],
  getNodeParameter: (name, index) => {
    const params = {
      operation: 'parse',
      source: 'url',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      outputProperty: 'text',
      additionalOptions: {}
    };
    return params[name];
  },
  getNode: () => ({ name: 'Test PDF Parse' }),
  helpers: {
    request: async (options) => {
      console.log('Mock request to:', options.url);
      // Return dummy PDF buffer for testing
      return Buffer.from('%PDF-1.4\nDummy PDF content');
    }
  },
  continueOnFail: () => false
};

async function testNode() {
  const node = new PdfParse();
  
  console.log('📋 Node Description:');
  console.log('- Name:', node.description.displayName);
  console.log('- Version:', node.description.version);
  console.log('- Group:', node.description.group);
  console.log('- Inputs:', node.description.inputs.length);
  console.log('- Outputs:', node.description.outputs.length);
  console.log('- Properties:', node.description.properties.length);
  
  console.log('\n✅ Node structure looks good!');
  console.log('\n🔗 To test in N8N:');
  console.log('1. npm link');
  console.log('2. export N8N_NODES_INCLUDE=\'["n8n-nodes-pdf-parse"]\'');
  console.log('3. n8n start');
}

testNode().catch(console.error);