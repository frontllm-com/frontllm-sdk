import { EditorView, basicSetup } from 'codemirror';
import { nextEditPrediction } from '@marimo-team/codemirror-ai';
import { CreateBaseChatCompletionRequest, CreateNonStreamingChatCompletionResponse } from 'frontllm';
import { Demo, Stopwatch } from './common';

const demo = new Demo();

const START_TEXT = `This is FrontLLM demo of code autocompletion using CodeMirror.

You can try the code autocompletion feature by typing some text and pausing for a moment.

# Demo Section

This is a sample section.`;

function createRequest(oldText: string): CreateBaseChatCompletionRequest {
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
\`\`\`ts
<|USER_CONTENT_START|>hello<|user_cursor_is_here|><|USER_CONTENT_END|>
\`\`\`

Correct response:
\`\`\`ts
<|USER_CONTENT_START|>hello<|user_cursor_is_here|>world!<|USER_CONTENT_END|>
\`\`\`
`
			},
			{
				role: 'user',
				content: `Please complete this text:\n<|USER_CONTENT_START|>${oldText}<|USER_CONTENT_END|>`
			}
		]
	};
}

function extractResponse(response: CreateNonStreamingChatCompletionResponse): string | null {
	const content = response.choices[0].message.content;
	const startPos = content.indexOf('<|USER_CONTENT_START|>');
	const endPos = content.indexOf('<|USER_CONTENT_END|>');
	if (startPos === -1 || endPos === -1 || endPos <= startPos) {
		return null;
	}
	return content.slice(startPos + '<|USER_CONTENT_START|>'.length, endPos);
}

let abortController: AbortController | null = null;

function main() {
	const parent = document.getElementById('placeholder') as HTMLElement;

	new EditorView({
		doc: START_TEXT,
		parent,
		extensions: [
			basicSetup,
			nextEditPrediction({
				fetchFn: async state => {
					if (abortController) {
						abortController.abort();
					}

					const stopwatch = new Stopwatch();
					demo.trace('info', 'Requesting FrontLLM server...');

					const { from, to } = state.selection.main;
					const text = state.doc.toString();
					const oldText = text.slice(0, from) + '<|user_cursor_is_here|>' + text.slice(from);
					const request = createRequest(oldText);
					abortController = new AbortController();

					try {
						const response = await demo.gateway.complete(request, {
							timeout: 10_000,
							abortSignal: abortController.signal
						});
						const newText = extractResponse(response) ?? oldText;
						console.log(extractResponse(response))
						demo.trace(
							'success',
							`Received autocomplete response, ${response.usage.total_tokens} tokens used, in ${stopwatch.stop()}s`
						);

						return {
							oldText,
							newText,
							from,
							to
						};
					} catch (e) {
						demo.trace('error', `Autocomplete request failed: ${(e as Error).message}`);
						return {
							oldText,
							newText: oldText,
							from,
							to
						};
					} finally {
						abortController = null;
					}
				},

				delay: 500,
				acceptOnClick: true,
				defaultKeymap: true,
				showAcceptReject: true,
				onEdit: (oldDoc, newDoc, from, to, insert) => {
					console.log('Edit tracked:', { oldDoc, newDoc, from, to, insert });
				}
			})
		]
	});
}

main();
