# Smartcone

Smartcone is a Next.js application for transforming traditional plastic-cone football drills into EyeQ Smart Cone training sessions. The app collects prompts from coaches, sends them to an OpenAI-backed API with a shared system prompt, and stores both the conversational history and approved outputs in Firebase for fine-tuning datasets.

## Architecture at a glance
- **Frontend (Next.js Pages Router):** `pages/index.tsx` hosts the main UI where coaches submit drill descriptions, review AI responses, edit them inline, and download outputs or histories. Theme toggling hooks are defined in the page component to wrap the experience in light or dark styling modules.
- **API layer:** `pages/api/hello.ts` accepts POST requests from the UI, injects the v2 system message, calls OpenAI Chat Completions with the model selected in Firestore, and formats the response for display. `pages/api/system-message.ts` exposes the active system prompt to the browser when exporting datasets.
- **System prompt management:** `lib/systemMessage.ts` reads `config/system_message_v2.txt`, which defines the coaching persona, formatting requirements, and constraints that every request must follow.
- **Firebase integration:** `services/firebaseConfig.ts` configures the Firestore client. `services/openaiservice.tsx` reads the model name from the `Model` collection, records question/response history in `questionsResponses`, saves approved exercises to `GPT_Outputs`, and exports them as JSONL training pairs that include the system message.
- **Data & training assets:** `data/v2` holds paired plastic-cone inputs and EyeQ outputs, a manifest, and generated `train_v2.jsonl` / `sample_v2.jsonl` files. The build script `scripts/build_train_v2.js` regenerates these JSONL files with the system prompt while skipping holdout exercises listed in `data/v2/holdout_input_plastic/`.

## Data and information flow
1. **User prompt entry (browser):** Coaches type a plastic-cone drill into the form on `pages/index.tsx`.
2. **Model selection (Firestore):** `generateChatCompletion` fetches the chosen model name from the `Model` collection before sending the request.
3. **OpenAI request (API route):** The browser posts `{ input, model }` to `/api/hello`, which wraps the input with the system message and calls OpenAI.
4. **Response handling (browser):** The formatted response is rendered and appended to the in-memory history. Coaches can edit the response inline and optionally download it.
5. **Persistence (Firestore):** Every request/response pair is stored in `questionsResponses`. When a coach approves an answer, `saveFinalResponse` writes sanitized text fields (`inputPlastic`, `outputEyeQ`) to `GPT_Outputs` for fine-tuning.
6. **Dataset export (browser):** `getAllEntries` fetches all `GPT_Outputs`, pairs each item with the system message and a user prompt, then triggers a JSONL download suitable for fine-tuning.
7. **Offline dataset builds (Node):** Running `npm run build:train:v2` calls `scripts/build_train_v2.js` to merge curated input/output files into `data/v2/train_v2.jsonl` and a smaller `sample_v2.jsonl` preview.

## Running the app locally
1. Install dependencies from the `eyeq` directory:
   ```bash
   npm install
   ```
2. Add an `.env` file in `eyeq/` with your OpenAI key:
   ```bash
   VITE_OPENAI_API_KEY=sk-...
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 and enter a drill to see the EyeQ conversion.

Firebase credentials are embedded in `services/firebaseConfig.ts`; ensure the configured project contains the `Model`, `questionsResponses`, and `GPT_Outputs` collections expected by the app.

## Repository layout
- `eyeq/pages/` — Next.js pages for the UI and API routes.
- `eyeq/services/` — Firestore client setup and request/response helpers.
- `eyeq/lib/` — Shared utilities such as system prompt loading.
- `eyeq/config/` — System prompt text consumed by both runtime and dataset builders.
- `eyeq/data/` — Training inputs, outputs, holdouts, and generated JSONL files.
- `eyeq/scripts/` — Build tooling for dataset generation.
- `eyeq/docs/` — Specification for the v2 exercise converter.

## Updating fine-tuning data
- Add new plastic-cone drills to `data/v2/input_plastic/` and matching EyeQ outputs to `data/v2/output_eyeq/` using consistent file prefixes (e.g., `Exercise 05`).
- List any evaluation-only drills in `data/v2/holdout_input_plastic/` so they are skipped during builds.
- Run `npm run build:train:v2` to regenerate JSONL files with the current system prompt and datasets.

## Notes on constraints
The system prompt enforces British English, bans technical metadata (JSON, LED timings), and requires concise coach-facing sections. Ensure new data and API responses respect these constraints so the AI output stays aligned with EyeQ coaching goals.
