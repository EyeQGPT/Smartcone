# EyeQ Exercise Converter v2

## Purpose
Version 2 of the EyeQ exercise converter focuses purely on understanding plastic-cone football drills and redesigning them as EyeQ Smart Cone experiences. The model should capture the spirit of the original exercise, then amplify scanning, visual information gathering, and player decision-making using light cues. LED pattern JSON, node timings, and device-level details are intentionally out of scope.

## Input format (plastic drills)
All plastic-cone exercises must use this fixed structure so the model always sees a consistent layout:

1. **Title**
2. **Age group / phase**
3. **Objective**
4. **Setup**
5. **How it plays / rules**
6. **Coaching focus**
7. **Progressions** (optional)

Store inputs for training under `data/v2/input_plastic/`. Hold-out examples for evaluation live in `data/v2/holdout_input_plastic/` and must be excluded from training builds.

## Output format (EyeQ drills)
Model responses must follow this coach-facing structure:

1. **Title**
2. **Setup**
3. **How it plays**
4. **Coaching focus (key cues)**
5. **Progressions** (optional)

Store the cleaned EyeQ drills under `data/v2/output_eyeq/`. Remove any references to JSON, pattern code, durations, or other implementation details.

## System message
The v2 system prompt lives in `config/system_message_v2.txt`. It defines the model role, reinforces that the job is a redesign (not search-and-replace), and bans JSON/pattern talk. All training examples and runtime requests should reuse this message verbatim. The prompt now asks for the simplified output structure (Title, Setup, How it plays, Coaching focus, Progressions).

## Training data and manifests
- Training pairs: matching files in `data/v2/input_plastic/` and `data/v2/output_eyeq/` using the same exercise prefix (e.g., `Exercise 01`).
- Hold-out inputs: files in `data/v2/holdout_input_plastic/` are reserved for evaluation and are ignored by the JSONL builder.
- Manifest: `data/v2/dataset_manifest_v2.json` lists which exercises are included in training and which are held out.

## JSONL builder
Use `npm run build:train:v2` to generate two files:
- `data/v2/train_v2.jsonl` — one training example per line with messages `[system, user, assistant]`.
- `data/v2/sample_v2.jsonl` — a small preview subset for manual review.

The builder pulls the system message from `config/system_message_v2.txt`, assembles user prompts with clear conversion instructions, and pairs each plastic input with its EyeQ output while skipping hold-out IDs.

## Firebase and runtime alignment
The app and Firebase schema should store human-readable text fields such as `inputPlastic` and `outputEyeQ` rather than JSON pattern data. Backend calls must send the v2 system message and the plastic exercise text as the user prompt. Responses should be treated as structured text matching the EyeQ output template—no parsing for JSON is required. Reads should tolerate legacy fields, but writes should only populate the text fields needed for v2.

## Evaluation workflow
- Keep 5–10 plastic exercises in `data/v2/holdout_input_plastic/` for testing.
- After fine-tuning, send these hold-outs to the v2 model, log prompts/responses, and judge whether the redesign preserves the original idea instead of rewording it.
- Use the findings to add targeted training pairs (e.g., a `v2.1` patch) rather than rebuilding the entire dataset.
