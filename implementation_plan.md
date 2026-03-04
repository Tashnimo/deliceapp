# Implementation Plan: Chatbot Optimization for Cloudflare & Compatibility

This plan aims to make the chatbot fully portable (works on any domain), secure (no API keys in frontend), and robust (better error handling and browser compatibility).

## User Review Required

> [!IMPORTANT]
> **Cloudflare Workers Secrets**: After deployment, the user must add the `HF_API_KEY` as a secret in the Cloudflare Worker dashboard or via Wrangler.
> **Deployment**: The `_worker.js` file is the standard for Cloudflare Pages. I will consolidate the logic there.

## Proposed Changes

### Cloudflare Worker
A unified worker will handle both static assets (if on Pages) and the AI API proxy.

#### [MODIFY] [_worker.js](file:///c:/Users/TOU/Documents/Delice%20cake%20site/_worker.js)
- Implement a robust proxy for `/api/chat`.
- Use `env.HF_API_KEY` instead of a hardcoded string.
- Add proper CORS headers for the proxy route.
- Handle Hugging Face "loading" states and other errors gracefully.

#### [DELETE] [worker.js](file:///c:/Users/TOU/Documents/Delice%20cake%20site/worker.js)
- Remove this file as it's redundant/confusing if using `_worker.js`.

---

### Frontend
Refactor `script.js` to be cleaner and more portable.

#### [MODIFY] [script.js](file:///c:/Users/TOU/Documents/Delice%20cake%20site/script.js)
- Change `HF_API_URL` to a relative path `/api/chat`. This ensures it works on whatever domain the site is hosted on.
- Remove hardcoded `HF_API_KEY`.
- Improve `generateAIResponse` with better error handling.

---

### Documentation

#### [MODIFY] [GUIDE_REPLICATION_DELICE_CAKE.md](file:///c:/Users/TOU/Documents/Delice%20cake%20site/GUIDE_REPLICATION_DELICE_CAKE.md)
- Add instructions on how to set the `HF_API_KEY` secret in Cloudflare.

## Verification Plan

### Manual Verification
1.  **Local Check**: Verify that `script.js` no longer contains the API key.
2.  **Logic Review**: Ensure the relative path `/api/chat` correctly maps to the Worker's route.
3.  **Browser Check**: Verify cross-browser compatibility.
