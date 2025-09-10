/**
 * @file gulpfile.js
 * @description Build configuration for N8N PDF Parse node
 * @author AI Assistant
 * @date 2025-09-10
 * @modified 2025-09-10
 */

const { src, dest, parallel } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.{png,svg}')
		.pipe(dest('dist/nodes'));
}

exports.build = parallel(buildIcons);
exports['build:icons'] = buildIcons;
exports.default = parallel(buildIcons);