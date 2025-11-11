![FrontLLM](.github/cover.png)

# FrontLLM

[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Ffrontllm-com%2Ffrontllm-sdk%2Fbadge%3Fref%3Dmain&style=flat-square)](https://actions-badge.atrox.dev/frontllm-com/frontllm-sdk/goto?ref=main) [![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](/LICENSE) [![View this project on NPM](https://img.shields.io/npm/v/frontllm.svg?style=flat-square)](https://npmjs.org/package/frontllm)

FrontLLM is your safe front-end gateway to LLMs. Request LLM directly from your front-end code. No backend needed. FrontLLM supports rate limiting, usage tracking, and more. It works with any front-end framework, including React, Vue, and Angular.

📝 Check [our website](https://frontllm.com) for more details.

## 🚀 Installation

### NPM

To use FrontLLM in your project, you can install it via npm:

```bash
npm install frontllm
```

Now you can import the library and create an instance of the gateway with your specific gateway ID:

```js
import { frontLLM } from 'frontllm';
const gateway = frontLLM('<gateway_id>');
```

### CDN

To use FrontLLM via CDN, you can include the following script tag in your HTML file:

```html
<script src="https://cdn.jsdelivr.net/npm/frontllm@0.1.5/dist/index.umd.js"></script>
```

This will expose the `frontLLM` function globally, which you can use to create an instance of the gateway:

```html
<script>
  const gateway = frontLLM('<gateway_id>');
  // ...
</script>
```

## 💡 License

This project is released under the MIT license.
