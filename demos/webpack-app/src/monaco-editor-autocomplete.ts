import { CreateBaseChatCompletionRequest, CreateNonStreamingChatCompletionResponse } from 'frontllm';
import * as monaco from 'monaco-editor';
import { registerCompletion } from 'monacopilot';
import { Demo, Stopwatch } from './common';

const demo = new Demo();

const START_TEXT = `This is FrontLLM demo of code autocompletion using Monaco Editor.

You can try the code autocompletion feature by typing some text and pausing for a moment.

# Demo Section

This is a sample section.`;

let abortController: AbortController | null = null;

window.MonacoEnvironment = {
	getWorkerUrl: () => {
		return './build/monaco-editor-worker.js';
	}
};

function createRequest(before: string, after: string): CreateBaseChatCompletionRequest {
	return {
		messages: [
			{
				role: 'system',
				content: `You are a code completion assistant. Your job is to rewrite the marked region of user content, respecting the cursor location.

#### 🔍 Markers:
- Editable content is wrapped in:
  \`<|USER_CONTENT_START|>\`
  ...
  \`<|USER_CONTENT_END|>\`

- The cursor is marked using the **exact token**:
  \`<|user_cursor_is_here|>\`

#### 🚫 Forbidden actions (do **NOT** do these):
1. ❌ **Do NOT move, delete, replace, or duplicate** the \`<|user_cursor_is_here|>\` token.
2. ❌ Do NOT add any text **before or on the same line as** the cursor.
3. ❌ Do NOT change or reformat any text **before** the cursor.

If any of these are violated: **return the content exactly as-is**, unchanged.

#### ✅ What you MUST do:
- Add code suggestions *only after* the \`<|user_cursor_is_here|>\` token.
- Preserve all formatting, indentation, line breaks, and spacing.
- Return only the content between \`<|USER_CONTENT_START|>\` and \`<|USER_CONTENT_END|>\` with your changes.

#### 🧱 Example:

User input:
\`\`\`
<|USER_CONTENT_START|>hello<|user_cursor_is_here|><|USER_CONTENT_END|>
\`\`\`

Correct response:
\`\`\`
<|USER_CONTENT_START|>hello<|user_cursor_is_here|>world!<|USER_CONTENT_END|>
\`\`\`
`
			},
			{
				role: 'user',
				content: `Please complete this text:\n<|USER_CONTENT_START|>${before}<|user_cursor_is_here|>${after}<|USER_CONTENT_END|>`
			}
		]
	};
}

function extractResponse(response: CreateNonStreamingChatCompletionResponse): string | null {
	const content = response.choices[0].message.content;
	const cursorPos = content.indexOf('<|user_cursor_is_here|>');
	const endPos = content.indexOf('<|USER_CONTENT_END|>');
	if (cursorPos === -1 || endPos === -1 || endPos <= cursorPos) {
		return null;
	}
	return content.substring(cursorPos + '<|user_cursor_is_here|>'.length, endPos);
}

function main() {
	const placeholder = document.getElementById('placeholder') as HTMLElement;
	const editor = monaco.editor.create(placeholder, {
		value: START_TEXT,
		language: 'markdown'
	});

	registerCompletion(monaco, editor, {
		language: 'markdown',

		requestHandler: async params => {
			if (abortController) {
				abortController.abort();
			}

			try {
				const request = createRequest(
					params.body.completionMetadata.textBeforeCursor,
					params.body.completionMetadata.textAfterCursor
				);
				abortController = new AbortController();

				const stopwatch = new Stopwatch();
				demo.trace('info', 'Requesting FrontLLM server...');

				const response = await demo.gateway.complete(request, {
					timeout: 10_000,
					abortSignal: abortController.signal
				});
				const completion = extractResponse(response);

				demo.trace(
					'success',
					`Received autocomplete response, ${response.usage.total_tokens} tokens used, in ${stopwatch.stop()}s`
				);
				return {
					completion
				};
			} catch (e) {
				demo.trace('error', `Autocomplete request failed: ${(e as Error).message}`);
				return {
					completion: null
				};
			} finally {
				abortController = null;
			}
		}
	});
}

main();
