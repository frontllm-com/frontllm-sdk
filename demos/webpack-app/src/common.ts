import { FrontLLM, frontLLM } from 'frontllm';

const DEMO_GATEWAY_ID = '9e9f272cddec364af8c24a84';

export class Demo {
	private readonly debugBar: HTMLElement;
	private readonly tracer: HTMLElement;
	private readonly gatewayIdInput: HTMLInputElement;

	public gateway: FrontLLM;

	public constructor() {
		this.debugBar = document.getElementById('debug-bar')!;
		this.tracer = document.getElementById('tracer')!;
		this.gatewayIdInput = document.getElementById('gateway-id-input') as HTMLInputElement;
		this.gatewayIdInput.addEventListener('input', () => (this.gateway = this.createGateway()), false);

		this.gateway = this.createGateway();

		this.tracer.innerText = '⌛ Waiting for user action...';
	}

	public trace(type: 'error' | 'success' | 'info', message: string) {
		let emoji = '📀';
		if (type === 'error') {
			emoji = '❌';
		} else if (type === 'success') {
			emoji = '✅';
		}
		this.tracer.innerText = `${emoji} ${message}`;
		this.debugBar.className = type;
	}

	private createGateway(): FrontLLM {
		let gatewayId = this.gatewayIdInput.value.trim();
		if (!gatewayId) {
			gatewayId = DEMO_GATEWAY_ID;
		}
		return frontLLM(gatewayId, {
			timeout: 10_000
		});
	}
}

export class Stopwatch {
	private startTime = Date.now();

	public stop(): string {
		return ((Date.now() - this.startTime) / 1000).toFixed(2);
	}
}
