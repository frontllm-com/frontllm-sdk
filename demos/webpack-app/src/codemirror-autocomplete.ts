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
				content:
					'You are a code completion assistant and your task is to analyze user edits and then rewrite the marked region, taking into account the cursor location. ' +
					'The cursor will be indicated by the special token <|user_cursor_is_here|>. The content of user will begin with <|user_edit_start|> and end with <|user_edit_end|>. ' +
					'Please suggest code only AFTER the <|user_cursor_is_here|> token. Please return the full user content between <|user_edit_start|> and <|user_edit_end|> with your suggestions incorporated. ' +
					'Please preserve all indentation and formatting and the <|user_cursor_is_here|> token in the same location as in the original content. Please add suggestions ONLY after the <|user_cursor_is_here|> token.'
			},
			{
				role: 'user',
				content: `Please complete this text:\n<|user_edit_start|>${oldText}<|user_edit_end|>`
			}
		]
	};
}

function extractResponse(response: CreateNonStreamingChatCompletionResponse): string | null {
	const content = response.choices[0].message.content;
	const startPos = content.indexOf('<|user_edit_start|>');
	const endPos = content.indexOf('<|user_edit_end|>');
	if (startPos === -1 || endPos === -1 || endPos <= startPos) {
		return null;
	}
	return content.slice(startPos + '<|user_edit_start|>'.length, endPos);
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
