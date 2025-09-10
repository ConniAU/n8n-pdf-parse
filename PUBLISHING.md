# Publishing Guide

This guide explains how to publish the N8N PDF Parse community node to npm and install it in your N8N instance.

## Prerequisites

- Node.js >= 18.0.0
- npm account with publishing permissions
- Access to your N8N instance (self-hosted)

## Building for Production

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Verify the build:
```bash
ls -la dist/
```

You should see:
- `dist/index.js` and `dist/index.d.ts`
- `dist/nodes/PdfParse/PdfParse.node.js` and type definitions
- `dist/nodes/PdfParse/pdf.svg` icon

## Publishing to npm

### First-time Setup

1. Login to npm:
```bash
npm login
```

2. Update package.json with your information:
```json
{
  "name": "n8n-nodes-pdf-parse",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/n8n-nodes-pdf-parse.git"
  }
}
```

### Publishing Process

1. Ensure you're on the main branch with clean working directory:
```bash
git status
```

2. Update version if needed:
```bash
npm version patch  # or minor/major
```

3. Build and publish:
```bash
npm run build
npm publish
```

### Publishing Checklist

- [ ] All tests pass
- [ ] Documentation is up to date
- [ ] Version number is updated
- [ ] Build completes without errors
- [ ] Package.json has correct metadata
- [ ] Repository URL is correct
- [ ] README is comprehensive

## Installing in N8N

### Method 1: Global Installation

1. Install the package globally:
```bash
npm install -g n8n-nodes-pdf-parse
```

2. Set environment variable:
```bash
export N8N_NODES_INCLUDE=["n8n-nodes-pdf-parse"]
```

3. Restart N8N:
```bash
n8n
```

### Method 2: Local Installation (Recommended for Self-hosted)

1. Navigate to your N8N installation directory:
```bash
cd ~/.n8n
```

2. Create custom nodes directory if it doesn't exist:
```bash
mkdir -p custom
cd custom
```

3. Install the package:
```bash
npm install n8n-nodes-pdf-parse
```

4. Configure N8N to load custom nodes by setting environment variable:
```bash
export N8N_NODES_INCLUDE=["n8n-nodes-pdf-parse"]
```

5. Restart N8N.

### Method 3: Docker Installation

Add to your Docker environment:

```dockerfile
ENV N8N_NODES_INCLUDE=["n8n-nodes-pdf-parse"]
RUN npm install -g n8n-nodes-pdf-parse
```

Or for docker-compose:

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    environment:
      - N8N_NODES_INCLUDE=["n8n-nodes-pdf-parse"]
    volumes:
      - n8n_data:/home/node/.n8n
    command: /bin/sh -c "npm install -g n8n-nodes-pdf-parse && n8n start"
```

## Verification

1. Start N8N and log into the interface
2. Create a new workflow
3. Search for "PDF Parse" in the node palette
4. The node should appear under the "Transform" category
5. Add the node and verify all parameters are available

## Troubleshooting

### Node Not Appearing

1. Check N8N logs for loading errors:
```bash
n8n start --log-level debug
```

2. Verify the package is installed:
```bash
npm list n8n-nodes-pdf-parse
```

3. Check environment variables:
```bash
echo $N8N_NODES_INCLUDE
```

### Permission Issues

If you encounter permission errors during npm install:

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

### Build Issues

If the build fails:

1. Clean and reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Check TypeScript version compatibility:
```bash
npx tsc --version
```

## Version Management

### Semantic Versioning

- **Patch** (1.0.1): Bug fixes, minor improvements
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

### Release Process

1. Update CHANGELOG.md with new version details
2. Run tests and ensure all pass
3. Update version: `npm version [patch|minor|major]`
4. Build: `npm run build`
5. Publish: `npm publish`
6. Tag release: `git tag v1.0.1`
7. Push changes: `git push && git push --tags`

## Support

For issues related to:
- **Installation**: Check N8N community forums
- **Bugs**: Create GitHub issue
- **Features**: Create GitHub issue with feature request template

## License

This package is published under the MIT License. See LICENSE file for details.