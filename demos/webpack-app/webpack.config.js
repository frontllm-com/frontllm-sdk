const path = require('path');

function bundle(entry) {
	return {
		entry,
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/
				},
				{
					test: /\.css$/i,
					use: ['style-loader', 'css-loader']
				},
				{
					test: /\.scss$/i,
					use: ['style-loader', 'css-loader', 'sass-loader']
				}
			]
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js']
		},
		output: {
			filename: `[name].js`,
			path: path.resolve(__dirname, 'public/build')
		}
	};
}

const bundles = [
	bundle({
		'codemirror-autocomplete': './src/codemirror-autocomplete.ts'
	}),
	bundle({
		'monaco-editor-autocomplete': './src/monaco-editor-autocomplete',
		'monaco-editor-worker': 'monaco-editor/esm/vs/editor/editor.worker.js'
	})
];

module.exports = bundles;
