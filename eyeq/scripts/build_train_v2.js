/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SYSTEM_MESSAGE_PATH = path.join(ROOT, 'config', 'system_message_v2.txt');
const INPUT_DIR = path.join(ROOT, 'data', 'v2', 'input_plastic');
const OUTPUT_DIR = path.join(ROOT, 'data', 'v2', 'output_eyeq');
const HOLDOUT_DIR = path.join(ROOT, 'data', 'v2', 'holdout_input_plastic');
const TRAIN_JSONL_PATH = path.join(ROOT, 'data', 'v2', 'train_v2.jsonl');
const SAMPLE_JSONL_PATH = path.join(ROOT, 'data', 'v2', 'sample_v2.jsonl');
const SAMPLE_SIZE = 2;

function readSystemMessage() {
  if (!fs.existsSync(SYSTEM_MESSAGE_PATH)) {
    throw new Error(`System message file not found at ${SYSTEM_MESSAGE_PATH}`);
  }
  return fs.readFileSync(SYSTEM_MESSAGE_PATH, 'utf8').trim();
}

function getBaseId(filename) {
  return filename
    .replace(/\.txt$/i, '')
    .replace(/\s+INPUT$/i, '')
    .trim();
}

function listHoldoutIds() {
  if (!fs.existsSync(HOLDOUT_DIR)) return new Set();
  const holdoutFiles = fs.readdirSync(HOLDOUT_DIR).filter((file) => file.toLowerCase().endsWith('.txt'));
  return new Set(holdoutFiles.map(getBaseId));
}

function findMatchingOutput(baseId) {
  const candidates = [
    `${baseId} OUTPUT.txt`,
    `${baseId} OUTPUT EYEQ.txt`,
    `${baseId} OUTPUT_EYEQ.txt`
  ];

  for (const candidate of candidates) {
    const target = path.join(OUTPUT_DIR, candidate);
    if (fs.existsSync(target)) return target;
  }

  throw new Error(`No output file found for ${baseId}. Expected one of: ${candidates.join(', ')}`);
}

function buildUserPrompt(inputText) {
  return [
    'Convert the following plastic-cone exercise into an EyeQ smart cone exercise.',
    'Use this structure: Title, Setup, How it plays, Coaching focus, Progressions.',
    'Plastic-cone exercise:',
    inputText.trim()
  ].join('\n');
}

function loadExamples() {
  const holdouts = listHoldoutIds();
  const inputs = fs.readdirSync(INPUT_DIR).filter((file) => file.toLowerCase().endsWith('.txt'));
  inputs.sort();

  return inputs
    .map((filename) => {
      const baseId = getBaseId(filename);
      if (holdouts.has(baseId)) return null;

      const inputPath = path.join(INPUT_DIR, filename);
      const outputPath = findMatchingOutput(baseId);
      const inputText = fs.readFileSync(inputPath, 'utf8').trim();
      const outputText = fs.readFileSync(outputPath, 'utf8').trim();

      return { baseId, inputText, outputText };
    })
    .filter(Boolean);
}

function writeJsonl(examples, systemMessage, targetPath) {
  const lines = examples.map(({ inputText, outputText }) => {
    const json = {
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: buildUserPrompt(inputText) },
        { role: 'assistant', content: outputText }
      ]
    };
    return JSON.stringify(json);
  });

  fs.writeFileSync(targetPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${lines.length} rows to ${targetPath}`);
}

function run() {
  const systemMessage = readSystemMessage();
  const examples = loadExamples();

  if (examples.length === 0) {
    throw new Error('No training examples found. Add pairs to data/v2/input_plastic and data/v2/output_eyeq.');
  }

  writeJsonl(examples, systemMessage, TRAIN_JSONL_PATH);
  writeJsonl(examples.slice(0, SAMPLE_SIZE), systemMessage, SAMPLE_JSONL_PATH);
}

run();
