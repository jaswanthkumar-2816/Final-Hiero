const express = require('express');
const acorn = require('acorn');
const walk = require('acorn-walk');
const vm = require('vm');
const { spawn } = require('child_process');
const path = require('path');
const { transpileCLikeToJs, compiledCallToJs, detectCodingLanguage } = require('./clike-to-js');
const { runPythonVisualize: runPythonSettrace } = require('./visualize-python');
const { textToSpeech } = require('../services/deepgramService');
const axios = require('axios');

const router = express.Router();
const SPEAK_LANGS = {
  en: { name: 'English', tts: 'en-IN', script: 'English' },
  kn: { name: 'Kannada', tts: 'kn-IN', script: 'Kannada (ಕನ್ನಡ)' },
  hi: { name: 'Hindi', tts: 'hi-IN', script: 'Hindi Devanagari (हिन्दी)' },
  ta: { name: 'Tamil', tts: 'ta-IN', script: 'Tamil (தமிழ்)' },
  te: { name: 'Telugu', tts: 'te-IN', script: 'Telugu (తెలుగు)' }
};
const SPEAK_EXAMPLES = {
  kn: '50 is bigger than 40, so ಈ ಎರಡೂ swap ಆಗುತ್ತೆ.',
  hi: '50 is bigger than 40, so ये दोनों swap हो जाते हैं।',
  ta: '50 is bigger than 40, so இந்த இரண்டும் swap ஆகும்.',
  te: '50 is bigger than 40, so ఈ రెండూ swap అవుతాయి.'
};
const speakTranslateCache = new Map();
const speakAudioCache = new Map();

function normalizeSpeakLang(value) {
  const key = String(value || 'en').toLowerCase().slice(0, 2);
  return SPEAK_LANGS[key] ? key : 'en';
}

function scriptCounts(text) {
  const value = String(text || '');
  return {
    latin: (value.match(/[A-Za-z]/g) || []).length,
    native: (value.match(/[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF]/g) || []).length
  };
}

function looksLikeEnglish(text) {
  const { latin, native } = scriptCounts(text);
  return latin > 12 && native < 3;
}

function looksFullyNative(text) {
  const { latin, native } = scriptCounts(text);
  return native >= 10 && latin < 8;
}

function isCodeMixed(text) {
  const { latin, native } = scriptCounts(text);
  return latin >= 8 && native >= 3;
}

function pickTranslatedText(message) {
  const chunks = [message && message.content, message && message.reasoning]
    .flat()
    .map((part) => String(part || '').trim())
    .filter(Boolean);
  const cleaned = chunks.map((part) => part
    .replace(/\s+/g, ' ')
    .replace(/^["']+|["']+$/g, '')
    .replace(/^(Hindi|Kannada|Tamil|Telugu)\s*:\s*/i, '')
    .trim());
  return cleaned.find((part) => isCodeMixed(part))
    || cleaned.find((part) => part && !looksFullyNative(part) && !looksLikeEnglish(part))
    || cleaned[0]
    || '';
}

async function groqTranslate(text, lang) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return text;
  const spec = SPEAK_LANGS[lang];
  const models = [...new Set([
    'qwen/qwen3.8-27b',
    process.env.AI_MODEL,
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b'
  ].filter(Boolean))];
  let lastErr = null;
  let lastOut = '';
  for (const model of models) {
    try {
      const { data } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        temperature: 0.1,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content: `You are a friendly female coding tutor in India. Speak mixed English + ${spec.name}, NOT a full ${spec.name} translation. RULES: 1) Keep every number as English digits in the same order (50, 40). Never write ${spec.name} number words. 2) The first number from the English line must stay in 1st place — start the sentence with it. 3) Keep most words in English. Add only a few ${spec.name} words after the numbers. 4) Keep coding words in English (swap, array, index, loop). Write ${spec.name} words in ${spec.script}. One short sentence. Example: ${SPEAK_EXAMPLES[lang]}`
          },
          { role: 'user', content: text }
        ]
      }, {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        timeout: 10000
      });
      const out = pickTranslatedText(data.choices?.[0]?.message || {});
      if (out && isCodeMixed(out)) return out;
      if (out && !looksFullyNative(out)) lastOut = out;
      else if (out) lastOut = lastOut || out;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) console.warn('[visualize/translate]', lastErr.message);
  return lastOut || text;
}

const NATIVE_DIGIT_RANGES = [
  [0x0966, 0x096F],
  [0x0BE6, 0x0BEF],
  [0x0C66, 0x0C6F],
  [0x0CE6, 0x0CEF]
];

function asciiDigits(text) {
  return String(text || '').replace(/[\u0966-\u096F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF]/g, (ch) => {
    const code = ch.charCodeAt(0);
    for (const [start] of NATIVE_DIGIT_RANGES) {
      if (code >= start && code <= start + 9) return String(code - start);
    }
    return ch;
  });
}

function extractNumbers(text) {
  return asciiDigits(text).match(/-?\d+(?:\.\d+)?/g) || [];
}

function englishWordsForNumber(n) {
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return 'minus ' + englishWordsForNumber(-n);
  n = Math.trunc(n);
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + englishWordsForNumber(n % 100) : '');
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    return englishWordsForNumber(thousands) + ' thousand' + (rest ? ' ' + englishWordsForNumber(rest) : '');
  }
  return String(n);
}

function speakEnglishNumbers(text) {
  return asciiDigits(text).replace(/-?\d+(?:\.\d+)?/g, (raw) => {
    if (raw.includes('.')) {
      const [whole, frac] = raw.split('.');
      return englishWordsForNumber(Number(whole)) + ' point ' + frac.split('').map((d) => englishWordsForNumber(Number(d))).join(' ');
    }
    return englishWordsForNumber(Number(raw));
  });
}

function leadingNumberPhrase(original) {
  const text = String(original || '').trim();
  const nums = extractNumbers(text);
  if (!nums.length) return '';
  const escaped = nums.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const match = text.match(new RegExp('^-?\\d[\\s\\S]*?' + escaped[escaped.length - 1]));
  return (match ? match[0] : nums.join(', ')).replace(/[,\s]+$/, '').trim();
}

function forceEnglishNumbersFirst(original, mixed) {
  let out = asciiDigits(mixed || '').replace(/\s+/g, ' ').trim();
  const nums = extractNumbers(original);
  if (!nums.length) {
    return out.replace(/^[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\s,।.]+/, '').trim() || original;
  }
  const lead = leadingNumberPhrase(original) || nums.join(', ');
  if (!out.startsWith(nums[0])) {
    const tail = out
      .replace(new RegExp('^[\\s\\S]*?' + nums[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '')
      .replace(/^[\s,]+/, '')
      .replace(/^(so|then)\s+/i, '');
    out = tail ? `${lead}, ${tail}` : lead;
  }
  const outNums = extractNumbers(out);
  if (outNums.join(',') !== nums.join(',')) {
    let i = 0;
    out = out.replace(/-?\d+(?:\.\d+)?/g, () => (i < nums.length ? nums[i++] : ''));
    while (i < nums.length) {
      out += (out ? ', ' : '') + nums[i++];
    }
    if (!out.startsWith(nums[0])) out = `${lead}, ${out}`;
  }
  return out.replace(/\s+/g, ' ').replace(/^,\s*/, '').trim();
}

async function translateVisualizerCaption(text, lang) {
  if (lang === 'en') return text;
  const cacheKey = lang + ':' + text;
  if (speakTranslateCache.has(cacheKey)) return speakTranslateCache.get(cacheKey);
  let out = await groqTranslate(text, lang);
  if (!out || looksLikeEnglish(out) || looksFullyNative(out)) {
    try { out = await groqTranslate(text, lang); } catch (_) {}
  }
  out = forceEnglishNumbersFirst(text, out || text);
  if (looksFullyNative(out) || looksLikeEnglish(out)) {
    const tag = { kn: 'ಸರಿ', hi: 'ठीक है', ta: 'சரி', te: 'సరే' }[lang];
    out = `${String(text).replace(/\.$/, '')}, ${tag}.`;
  }
  speakTranslateCache.set(cacheKey, out);
  if (speakTranslateCache.size > 200) speakTranslateCache.delete(speakTranslateCache.keys().next().value);
  return out;
}

async function synthesizeVisualizerVoice(spoken, ttsLang) {
  if (ttsLang === 'en') {
    const englishVoices = ['aura-2-vesta-en', 'aura-2-andromeda-en', 'aura-2-cora-en'];
    for (const voice of englishVoices) {
      try {
        const buf = await textToSpeech(spoken, voice, { speed: 1.08 });
        if (buf && buf.length) return buf;
      } catch (err) {
        console.warn('[visualize/speak aura]', voice, err.message);
      }
    }
  }
  try {
    const neural = await neuralFemaleSpeak(spoken, ttsLang);
    if (neural && neural.length) return neural;
  } catch (err) {
    console.warn('[visualize/speak neural]', err.message);
  }
  if (ttsLang === 'en') {
    return textToSpeech(spoken, 'aura-asteria-en', { speed: 1.08 });
  }
  throw new Error('Female voice failed');
}

function neuralFemaleSpeak(text, lang) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [path.join(__dirname, 'neural_tts.py'), lang], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const chunks = [];
    const errChunks = [];
    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) {}
      reject(new Error('Female voice timed out'));
    }, 20000);
    proc.stdout.on('data', (chunk) => chunks.push(chunk));
    proc.stderr.on('data', (chunk) => errChunks.push(chunk));
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('close', () => {
      clearTimeout(timer);
      const buf = Buffer.concat(chunks);
      if (!buf.length) {
        return reject(new Error(Buffer.concat(errChunks).toString('utf8').trim() || 'Female voice failed'));
      }
      resolve(buf);
    });
    proc.stdin.write(text);
    proc.stdin.end();
  });
}

router.post('/speak', async (req, res) => {
  try {
    const text = String(req.body && req.body.text || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    const lang = normalizeSpeakLang(req.body && req.body.lang);
    if (!text) {
      return res.status(400).json({ success: false, error: 'Nothing to speak.' });
    }
    const cacheKey = lang + ':' + text;
    if (speakAudioCache.has(cacheKey)) {
      return res.json(speakAudioCache.get(cacheKey));
    }
    const spoken = await translateVisualizerCaption(text, lang);
    const ttsLang = lang !== 'en' && looksLikeEnglish(spoken) ? 'en' : lang;
    const voiceText = speakEnglishNumbers(spoken);
    let audio = null;
    try {
      const buf = await synthesizeVisualizerVoice(voiceText, ttsLang);
      if (buf && buf.length) audio = buf.toString('base64');
    } catch (ttsErr) {
      console.warn('[visualize/speak]', ttsErr.message);
    }
    const payload = {
      success: true,
      lang: ttsLang,
      text: spoken,
      ttsLang: SPEAK_LANGS[ttsLang].tts,
      audio
    };
    if (audio) {
      speakAudioCache.set(cacheKey, payload);
      if (speakAudioCache.size > 120) speakAudioCache.delete(speakAudioCache.keys().next().value);
    }
    return res.json(payload);
  } catch (err) {
    console.warn('[visualize/speak]', err.message);
    return res.status(500).json({ success: false, error: 'Could not generate voice.' });
  }
});

// Named timing guidelines and limits (ms)
const TIMEOUT_MS = 2000;
const MAX_STEPS = 2000;

/**
 * Friendly Error Translator
 * Turns raw JS error messages into clear, encouraging 1-sentence guidance for beginners.
 */
function translateError(err, code) {
  const msg = err.message || '';
  let line = 1;

  if (err.loc && err.loc.line) {
    line = err.loc.line;
  } else {
    const lineMatch = msg.match(/:([0-9]+):([0-9]+)/) || (err.stack && err.stack.match(/evalmachine\.<anonymous>:([0-9]+)/));
    if (lineMatch) line = parseInt(lineMatch[1], 10);
  }

  let shortError = 'an unexpected issue occurred';
  if (err.name === 'SyntaxError' || msg.includes('Unexpected') || msg.includes('Unterminated') || msg.includes('Missing')) {
    return {
      line,
      friendly: `There's a small typo somewhere — check line ${line}.`,
      raw: msg,
      type: 'syntax'
    };
  } else if (msg.includes('is not defined')) {
    const pyName = msg.match(/name ['"]([^'"]+)['"] is not defined/);
    const varName = pyName ? pyName[1] : (msg.split(' ')[0] || 'a variable');
    shortError = `${varName} hasn't been declared yet`;
  } else if (msg.includes('Cannot read properties of') || msg.includes('is undefined') || msg.includes('is null')) {
    shortError = 'an item was undefined when accessed';
  } else if (msg.includes('timed out') || msg.includes('Maximum step limit')) {
    return {
      line,
      friendly: "This looks like it might be looping forever — want to double check the loop's condition?",
      raw: msg,
      type: 'infinite-loop'
    };
  } else if (msg.includes('is not a function')) {
    shortError = 'a value was called like a function';
  } else if (msg.includes('import is not allowed')) {
    return {
      line,
      friendly: 'This visualizer can run common Python libraries like random and math, but that import is blocked.',
      raw: msg,
      type: 'runtime'
    };
  }

  return {
    line,
    friendly: `Something went wrong here: ${shortError}. Want to check this line?`,
    raw: msg,
    type: 'runtime'
  };
}

/**
 * Formats a value nicely for beginners (no raw syntax, max ~12 words)
 */
function formatVal(v) {
  if (v === null) return 'nothing';
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return `"${v}"`;
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.length <= 4) return `[${v.map(formatVal).join(', ')}]`;
    return `[${v.slice(0, 3).map(formatVal).join(', ')} and more]`;
  }
  if (typeof v === 'object') {
    try {
      if (Object.prototype.hasOwnProperty.call(v, 'truthy_count') && Object.prototype.hasOwnProperty.call(v, 'falsy_count')) {
        return `${v.truthy_count} truthy and ${v.falsy_count} falsy`;
      }
      const keys = Object.keys(v);
      if (keys.length === 0) return '{}';
      return `{${keys.slice(0, 2).join(', ')}}`;
    } catch {
      return 'an item';
    }
  }
  return String(v);
}

function formatValPython(v) {
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.length <= 4) return `[${v.map(formatValPython).join(', ')}]`;
    return `[${v.slice(0, 3).map(formatValPython).join(', ')} and more]`;
  }
  return formatVal(v);
}

function niceVarName(name) {
  return String(name || 'this value').replace(/_/g, ' ');
}

function spokenValue(val, show) {
  if (Array.isArray(val)) {
    if (val.length > 8) return val.slice(0, 8).map((item) => show(item)).join(', ') + ', and more';
    return val.map((item) => show(item)).join(', ');
  }
  return show(val);
}

function explainVisualizerStep(step, prev, fmt) {
  const show = typeof fmt === 'function' ? fmt : formatVal;
  const type = step.type;
  const p = step.payload || step.data || {};
  const indices = (step.state && step.state.activeIndices) || p.indices || [];
  const ds = (step.state && step.state.dataStructure) || {};
  const prevType = prev && prev.type;
  const prevPayload = prev ? (prev.payload || prev.data || {}) : {};

  switch (type) {
    case 'compare': {
      const a = show(p.valA);
      const b = show(p.valB);
      if (p.op === '>') {
        return p.result
          ? `${a} is bigger than ${b}, so they are out of order.`
          : `${a} is not bigger than ${b}, so they can stay.`;
      }
      if (p.op === '<') {
        return p.result
          ? `${a} is smaller than ${b}, so we take this path.`
          : `${a} is not smaller than ${b}, so we skip.`;
      }
      if (p.op === '===' || p.op === '==') {
        return p.result ? `${a} and ${b} match.` : `${a} and ${b} are different.`;
      }
      if (p.op === '!==' || p.op === '!=') {
        return p.result ? `${a} and ${b} are different.` : `${a} and ${b} are the same.`;
      }
      if (p.op === '>=') return p.result ? `${a} is at least ${b}.` : `${a} is less than ${b}.`;
      if (p.op === '<=') return p.result ? `${a} is at most ${b}.` : `${a} is greater than ${b}.`;
      if (p.op === 'includes') return p.result ? `${a} contains ${b}.` : `${a} does not contain ${b}.`;
      return `We compare ${a} and ${b}.`;
    }

    case 'swap': {
      return `${show(p.valA)} and ${show(p.valB)} swap, and the larger one slides right.`;
    }

    case 'assign': {
      const name = p.variable || p.name || '';
      const arr = Array.isArray(p.val) ? p.val : ds.values;
      if (Array.isArray(indices) && indices.length >= 2) {
        const left = Array.isArray(arr) ? arr[indices[0]] : null;
        const right = Array.isArray(arr) ? arr[indices[1]] : null;
        if (left != null && right != null) {
          return `${show(left)} and ${show(right)} swap. The bigger number slides right.`;
        }
        return `Those two neighbors swap places.`;
      }
      if (Array.isArray(p.val) && /arr|nums|list|numbers|data|values/i.test(name)) {
        return `${spokenValue(p.val, show)} is the array now.`;
      }
      if (name === 'n' || name === 'length' || name === 'size') {
        return `There are ${show(p.val)} items to walk through.`;
      }
      if (/swap/i.test(name)) {
        return p.val ? 'A swap happened, so this pass is still needed.' : 'No swaps yet on this pass.';
      }
      if (name === 'i') return `Start pass ${Number(p.val) + 1} from the left.`;
      if (name === 'j' || name === 'k') return `Look at index ${show(p.val)} and its neighbor.`;
      return `Set ${niceVarName(name)} to ${spokenValue(p.val, show)}.`;
    }

    case 'loop-iter': {
      const name = p.varName;
      const val = p.varVal;
      if (name === 'i') return `Pass ${Number(val) + 1}: bubble the next largest value to the right.`;
      if (name === 'j') return `Check the pair starting at index ${show(val)}.`;
      if (name && val !== undefined && val !== null) {
        return `Next, ${niceVarName(name)} is ${show(val)}, so we look at that item.`;
      }
      return `We start another round of the loop.`;
    }

    case 'branch': {
      if (p.valA !== undefined && p.valB !== undefined && p.op) {
        const compared = explainVisualizerStep({ type: 'compare', payload: p, data: p }, prev, fmt);
        if (p.op === '>' || p.op === '<') {
          return p.taken ? `${compared} We swap them.` : `${compared} We leave them.`;
        }
        return compared;
      }
      if (p.negatedName && /swap/i.test(String(p.negatedName))) {
        return p.taken
          ? 'No swaps this pass, so the array is already in order.'
          : 'A swap happened, so another pass is needed.';
      }
      if (prevType === 'compare') {
        return p.taken
          ? 'So we enter this block and act on it.'
          : 'So we skip this block and keep going.';
      }
      return p.taken
        ? 'This condition is true, so we follow this path.'
        : 'This condition is false, so we skip it.';
    }

    case 'call': {
      const fn = niceVarName(p.functionName || p.fnName || 'the function');
      const args = Array.isArray(p.args) && p.args.length
        ? p.args.map((arg) => spokenValue(arg, show)).join(', ')
        : '';
      if (args) return `${args}. ${fn} starts now.`;
      return `${fn} starts now, with the current input.`;
    }

    case 'return': {
      const fn = niceVarName(p.functionName || p.fnName || 'The function');
      const val = spokenValue(p.value !== undefined ? p.value : p.val, show);
      return `${val} is returned. ${fn} finishes.`;
    }

    case 'traversal': {
      return `Move to the next node, ${show(p.value !== undefined ? p.value : p.nodeId)}.`;
    }

    case 'stack-push':
      return `Push ${show(p.val)} onto the stack.`;
    case 'stack-pop':
      return `Pop ${show(p.val)} off the stack.`;
    case 'queue-enqueue':
      return `Add ${show(p.val)} to the back of the queue.`;
    case 'queue-dequeue':
      return `Take ${show(p.val)} from the front of the queue.`;
    default:
      return p.caption || 'Now the next line runs.';
  }
}

function buildCaption(type, payload, variables, fmt) {
  return explainVisualizerStep({
    type,
    payload,
    data: payload,
    state: { variables: variables || {}, activeIndices: (payload && payload.indices) || [] }
  }, null, fmt);
}

function polishVisualizerCaptions(steps, fmt) {
  if (!Array.isArray(steps)) return steps;
  for (let i = 0; i < steps.length; i++) {
    steps[i].caption = explainVisualizerStep(steps[i], i ? steps[i - 1] : null, fmt);
  }
  return steps;
}

function isSafeCallExpr(src) {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim().replace(/;+\s*$/, '');
  return /^[A-Za-z_$][\w$]*\s*\([\s\S]*\)$/.test(trimmed);
}

function paramName(node) {
  if (!node) return '';
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'AssignmentPattern' && node.left && node.left.type === 'Identifier') return node.left.name;
  if (node.type === 'RestElement' && node.argument && node.argument.type === 'Identifier') return node.argument.name;
  return '';
}

function findEntryFunction(ast) {
  let found = null;
  walk.simple(ast, {
    FunctionDeclaration(node) {
      if (!found && node.id) found = { name: node.id.name, params: node.params || [] };
    }
  });
  if (found) return found;
  walk.simple(ast, {
    VariableDeclarator(node) {
      if (found) return;
      if (node.id && node.id.type === 'Identifier' && node.init &&
          (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression')) {
        found = { name: node.id.name, params: node.init.params || [] };
      }
    },
    AssignmentExpression(node) {
      if (found) return;
      if (node.left && node.left.type === 'Identifier' && node.right &&
          (node.right.type === 'FunctionExpression' || node.right.type === 'ArrowFunctionExpression')) {
        found = { name: node.left.name, params: node.right.params || [] };
      }
    }
  });
  return found || { name: null, params: [] };
}

function looksLikeStringProblem(fnName, paramNames, problemTitle) {
  const text = `${fnName || ''} ${paramNames.join(' ')} ${problemTitle || ''}`.toLowerCase();
  return /name|str|string|path|line|pattern|text|word|branch|file|msg|key|valid|git|status|ignore|parse/.test(text);
}

function testCallFnName(testCall) {
  const m = String(testCall || '').trim().match(/^([A-Za-z_$][\w$]*)\s*\(/);
  return m ? m[1] : '';
}

function inferSampleArgs(fnName, paramNames, problemTitle) {
  const fnText = `${fnName || ''} ${paramNames.join(' ')}`.toLowerCase();
  const text = `${fnText} ${problemTitle || ''}`.toLowerCase();
  const count = paramNames.length || 1;

  if (/truthy|falsy/.test(text)) {
    return [[0, 'Python', [], {}, 42, true]];
  }
  if (/sort/.test(fnText) || paramNames.some((p) => /arr|nums|list|items|values/.test(p))) {
    return [[5, 1, 4, 2, 8]];
  }
  if (/two.?sum/.test(fnText)) return [[2, 7, 11, 15], 9];

  if (/conflict|entries/.test(text)) {
    return [[{ file: 'app.js', content: '<<<<<<< HEAD\nx\n>>>>>>> main' }, { file: 'ok.js', content: 'const x=1' }]];
  }
  if (/ignor/.test(text) && count >= 2) return ['error.log', '*.log'];
  if (/status|porcelain/.test(text)) return ['M  src/app.js'];
  if (/branch|valid/.test(text)) return ['feature/login'];
  if (looksLikeStringProblem(fnName, paramNames, problemTitle)) {
    if (count >= 2) return ['hello', 'he'];
    return ['feature/login'];
  }
  if (/sort/.test(text)) return [[5, 1, 4, 2, 8]];
  if (/two sum|twosum/.test(text)) return [[2, 7, 11, 15], 9];
  if (/binary|search/.test(text)) return [[1, 3, 5, 7, 9, 11], 7];
  if (/reverse|palindrome/.test(text)) return [[1, 2, 3, 4, 5]];
  if (/fib|factorial/.test(text)) return [5];
  if (/tree|bst/.test(text)) {
    return [{ val: 10, left: { val: 5, left: null, right: null }, right: { val: 15, left: null, right: null } }];
  }
  if (/\blist\b/.test(text) && !/valid/.test(text)) {
    return [{ val: 1, next: { val: 2, next: { val: 3, next: null } } }];
  }
  if (paramNames.some(p => /arr|nums|list|items|values/.test(p))) return [[5, 1, 4, 2, 8]];
  return [[4, 2, 7, 1, 9]];
}

function valuesEqual(actual, expected) {
  if (expected === undefined) return false;
  if (JSON.stringify(actual) === JSON.stringify(expected)) return true;
  if (typeof expected === 'string') {
    try {
      const parsed = JSON.parse(expected);
      if (JSON.stringify(actual) === JSON.stringify(parsed)) return true;
    } catch (_) { /* keep comparing as text */ }
    return String(actual) === expected;
  }
  return String(actual) === String(expected);
}

function callArgsExpression(node) {
  if (node.type === 'ArrowFunctionExpression') {
    const names = (node.params || []).map(p => {
      const n = paramName(p);
      return n ? n : 'undefined';
    });
    return `[${names.join(', ')}]`;
  }
  return 'Array.from(typeof arguments !== "undefined" ? arguments : [])';
}

function buildStaticStorySteps(ast, userCode, dsType) {
  const steps = [];
  const add = (type, line, caption, extra) => {
    steps.push({
      stepNumber: steps.length,
      line: line || 1,
      type,
      data: extra || {},
      caption,
      returnValue: null,
      state: {
        variables: {},
        dataStructure: { type: dsType, values: [], visited: [] },
        activeIndices: [],
        callStack: [],
        loop: null
      }
    });
  };
  walk.simple(ast, {
    FunctionDeclaration(node) {
      add('call', node.loc.start.line, `${node.id ? node.id.name : 'This function'} is ready to run.`);
    },
    IfStatement(node) {
      add('branch', node.loc.start.line, 'Checking this condition next.');
    },
    ForStatement(node) {
      add('loop-iter', node.loc.start.line, 'Walking through this loop.');
    },
    WhileStatement(node) {
      add('loop-iter', node.loc.start.line, 'Walking through this loop.');
    },
    ReturnStatement(node) {
      add('return', node.loc.start.line, 'The function is about to return a value.');
    }
  });
  if (steps.length === 0) {
    const lineCount = Math.max(1, userCode.split('\n').length);
    add('call', 1, 'Walking through your code, line by line.');
    if (lineCount > 1) add('assign', Math.min(lineCount, 3), 'Moving through the next lines.');
  }
  return steps;
}

/**
 * Infer primary data structure type from problem metadata & AST
 */
function detectDataStructure(ast, testArgs, userCode, problemTitle = '', problemType = '') {
  const metaText = `${problemTitle} ${problemType}`.toLowerCase();

  if (metaText.includes('linked list') || metaText.includes('linkedlist')) return 'linked-list';
  if (metaText.includes('binary tree') || metaText.includes(' bst ') || metaText.includes('tree')) return 'tree';
  if (metaText.includes('graph') || metaText.includes('dfs') || metaText.includes('bfs')) return 'graph';
  if (metaText.includes('stack')) return 'stack';
  if (metaText.includes('queue')) return 'queue';

  let hasTreeProps = false;
  let hasLinkedListProps = false;
  let hasStackOps = false;
  let hasQueueOps = false;
  let hasGraphProps = false;

  if (userCode.includes('.left') && userCode.includes('.right')) hasTreeProps = true;
  if (userCode.includes('.next') && !userCode.includes('.next()')) hasLinkedListProps = true;
  if (userCode.includes('adj') || userCode.includes('graph') || userCode.includes('visited')) hasGraphProps = true;

  if (userCode.includes('.push(') && userCode.includes('.pop(')) hasStackOps = true;
  if (userCode.includes('.push(') && userCode.includes('.shift(')) hasQueueOps = true;

  if (hasTreeProps) return 'tree';
  if (hasLinkedListProps) return 'linked-list';
  if (hasGraphProps) return 'graph';
  if (hasStackOps) return 'stack';
  if (hasQueueOps) return 'queue';

  // Check if first arg or code is array
  if (Array.isArray(testArgs) && (testArgs.length === 0 || Array.isArray(testArgs[0]) || typeof testArgs[0] === 'number')) {
    if (userCode.includes('[') && userCode.includes(']')) return 'array';
  }

  if (userCode.includes('[') || userCode.includes('arr') || userCode.includes('nums')) {
    return 'array';
  }

  // Fallback to execution-trace-only mode (variables panel + line highlight, no special visual)
  return 'trace';
}

function cloneJson(v) {
  try { return JSON.parse(JSON.stringify(v)); } catch (_) { return null; }
}

function isTreeLike(v) {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v) && ('left' in v || 'right' in v));
}

function isAdjMap(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || isTreeLike(v)) return false;
  const vals = Object.values(v);
  return vals.length > 0 && vals.every((item) => Array.isArray(item));
}

function pickTreeSnapshot(variables, activeArray, sampleArgs) {
  const prefer = ['root', 'node', 'tree', 'head', 'curr', 'current'];
  for (const key of prefer) {
    if (isTreeLike(variables && variables[key])) return cloneJson(variables[key]);
  }
  for (const val of Object.values(variables || {})) {
    if (isTreeLike(val)) return cloneJson(val);
  }
  if (Array.isArray(activeArray) && isTreeLike(activeArray[0])) return cloneJson(activeArray[0]);
  if (Array.isArray(sampleArgs) && isTreeLike(sampleArgs[0])) return cloneJson(sampleArgs[0]);
  return null;
}

function pickGraphSnapshot(variables) {
  const prefer = ['graph', 'adj', 'adjList', 'adj_list'];
  for (const key of prefer) {
    if (isAdjMap(variables && variables[key])) return cloneJson(variables[key]);
  }
  for (const val of Object.values(variables || {})) {
    if (isAdjMap(val)) return cloneJson(val);
  }
  return null;
}

function flattenTreeValues(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  const val = node.val !== undefined ? node.val : (node.value !== undefined ? node.value : node.data);
  if (val !== undefined && val !== null) out.push(val);
  if (node.left) flattenTreeValues(node.left, out);
  if (node.right) flattenTreeValues(node.right, out);
  return out;
}

/**
 * Instrument user code with Acorn AST
 */
function instrumentCode(userCode) {
  const ast = acorn.parse(userCode, { ecmaVersion: 2022, locations: true, ranges: true });
  const patches = [];
  const entry = findEntryFunction(ast);
  const fnName = entry.name;
  const fnParams = entry.params;

  let loopCounter = 0;

  const patchFnEntry = (node, name) => {
    const line = node.loc.start.line;
    const argsExpr = callArgsExpression(node);
    if (node.body && node.body.type === 'BlockStatement') {
      patches.push({
        start: node.body.start + 1,
        end: node.body.start + 1,
        text: `\n__onCall('${name}', ${argsExpr}, ${line});\n`
      });
    } else if (node.body && node.type === 'ArrowFunctionExpression') {
      const bodyStr = userCode.slice(node.body.start, node.body.end);
      patches.push({
        start: node.body.start,
        end: node.body.end,
        text: `(__onCall('${name}', ${argsExpr}, ${line}), __ret(${bodyStr}, ${line}, '${name}'))`
      });
    }
  };

  walk.ancestor(ast, {
    FunctionDeclaration(node) {
      const name = node.id ? node.id.name : 'anonymous';
      patchFnEntry(node, name);
    },
    FunctionExpression(node, ancestors) {
      let name = node.id ? node.id.name : fnName || 'anonymous';
      const parent = ancestors[ancestors.length - 2];
      if (parent && parent.type === 'VariableDeclarator' && parent.id && parent.id.type === 'Identifier') {
        name = parent.id.name;
      }
      patchFnEntry(node, name);
    },
    ArrowFunctionExpression(node, ancestors) {
      let name = fnName || 'anonymous';
      const parent = ancestors[ancestors.length - 2];
      if (parent && parent.type === 'VariableDeclarator' && parent.id && parent.id.type === 'Identifier') {
        name = parent.id.name;
      } else if (parent && parent.type === 'AssignmentExpression' && parent.left && parent.left.type === 'Identifier') {
        name = parent.left.name;
      }
      patchFnEntry(node, name);
    },
    BinaryExpression(node, ancestors) {
      const parent = ancestors[ancestors.length - 2];
      const isLoopTest = parent && (parent.type === 'ForStatement' || parent.type === 'WhileStatement') && parent.test === node;
      if (!isLoopTest && ['<', '>', '<=', '>=', '===', '==', '!==', '!='].includes(node.operator)) {
        const leftStr = userCode.slice(node.left.start, node.left.end);
        const rightStr = userCode.slice(node.right.start, node.right.end);
        const line = node.loc.start.line;

        let indexExpr = '[]';
        const leftIsMember = node.left.type === 'MemberExpression' && node.left.computed;
        const rightIsMember = node.right.type === 'MemberExpression' && node.right.computed;

        if (leftIsMember && rightIsMember) {
          const lProp = userCode.slice(node.left.property.start, node.left.property.end);
          const rProp = userCode.slice(node.right.property.start, node.right.property.end);
          indexExpr = `[${lProp}, ${rProp}]`;
        } else if (leftIsMember) {
          const lProp = userCode.slice(node.left.property.start, node.left.property.end);
          indexExpr = `[${lProp}]`;
        } else if (rightIsMember) {
          const rProp = userCode.slice(node.right.property.start, node.right.property.end);
          indexExpr = `[${rProp}]`;
        }

        patches.push({
          start: node.start,
          end: node.end,
          text: `__cmp(${leftStr}, ${rightStr}, '${node.operator}', ${line}, ${indexExpr})`
        });
      }
    },
    IfStatement(node) {
      const line = node.loc.start.line;
      const testStr = userCode.slice(node.test.start, node.test.end);
      const safeCondStr = JSON.stringify(testStr.replace(/["']/g, '').trim());
      patches.push({
        start: node.test.start,
        end: node.test.start,
        text: `__branch(`
      });
      patches.push({
        start: node.test.end,
        end: node.test.end,
        text: `, ${line}, ${safeCondStr})`
      });
    },
    ForStatement(node) {
      loopCounter++;
      const id = loopCounter;
      const line = node.loc.start.line;
      let varName = '';
      if (node.init && node.init.declarations && node.init.declarations[0] && node.init.declarations[0].id) {
        varName = node.init.declarations[0].id.name;
      }
      if (node.body.type === 'BlockStatement') {
        patches.push({
          start: node.body.start + 1,
          end: node.body.start + 1,
          text: `\n__loopIter(${id}, ${line}, '${varName}', typeof ${varName || 'undefined'} !== 'undefined' ? ${varName} : null);\n`
        });
      }
    },
    WhileStatement(node) {
      loopCounter++;
      const id = loopCounter;
      const line = node.loc.start.line;
      if (node.body.type === 'BlockStatement') {
        patches.push({
          start: node.body.start + 1,
          end: node.body.start + 1,
          text: `\n__loopIter(${id}, ${line});\n`
        });
      }
    },
    VariableDeclarator(node, ancestors) {
      const parent = ancestors[ancestors.length - 2];
      const grandParent = ancestors[ancestors.length - 3];
      const isForInit = (parent && parent.type === 'VariableDeclaration') &&
                        (grandParent && (grandParent.type === 'ForStatement' || grandParent.type === 'ForInStatement' || grandParent.type === 'ForOfStatement') && grandParent.init === parent);
      if (!isForInit && node.id && node.id.type === 'Identifier' && node.init) {
        const name = node.id.name;
        const line = node.loc.start.line;
        const initStr = userCode.slice(node.init.start, node.init.end);
        patches.push({
          start: node.init.start,
          end: node.init.end,
          text: `__assignVar('${name}', ${initStr}, ${line})`
        });
      }
    },
    AssignmentExpression(node) {
      const line = node.loc.start.line;
      if (node.left.type === 'MemberExpression') {
        const objStr = userCode.slice(node.left.object.start, node.left.object.end);
        const propStr = node.left.computed
          ? userCode.slice(node.left.property.start, node.left.property.end)
          : JSON.stringify(node.left.property.name);
        const rightStr = userCode.slice(node.right.start, node.right.end);

        patches.push({
          start: node.start,
          end: node.end,
          text: `__assignMember(${objStr}, ${propStr}, ${rightStr}, ${line}, ${JSON.stringify(objStr)}, ${node.left.computed})`
        });
      } else if (node.left.type === 'Identifier') {
        const name = node.left.name;
        const rightStr = userCode.slice(node.right.start, node.right.end);
        patches.push({
          start: node.start,
          end: node.end,
          text: `(${name} = __assignVar('${name}', ${rightStr}, ${line}))`
        });
      }
    },
    CallExpression(node) {
      if (node.callee && node.callee.type === 'MemberExpression' && node.callee.property && !node.callee.computed) {
        const method = node.callee.property.name;
        const objStr = userCode.slice(node.callee.object.start, node.callee.object.end);
        const argsStr = node.arguments.map(a => userCode.slice(a.start, a.end)).join(', ');
        const line = node.loc.start.line;
        if (['push', 'pop', 'shift', 'unshift'].includes(method)) {
          patches.push({
            start: node.start,
            end: node.end,
            text: `__arrMutate(${objStr}, '${method}', [${argsStr}], ${line}, ${JSON.stringify(objStr)})`
          });
        } else if (['includes', 'startsWith', 'endsWith', 'indexOf'].includes(method)) {
          patches.push({
            start: node.start,
            end: node.end,
            text: `__strCheck(${objStr}, '${method}', [${argsStr}], ${line})`
          });
        }
      }
    },
    ReturnStatement(node) {
      const line = node.loc.start.line;
      if (node.argument) {
        patches.push({
          start: node.argument.start,
          end: node.argument.start,
          text: `__ret(`
        });
        patches.push({
          start: node.argument.end,
          end: node.argument.end,
          text: `, ${line}, '${fnName || 'handleLogic'}')`
        });
      } else {
        patches.push({
          start: node.start,
          end: node.end,
          text: `return __ret(undefined, ${line}, '${fnName || 'handleLogic'}');`
        });
      }
    }
  });

  // Apply from the end of the source. At the same start, wider replacements
  // go first so zero-width wraps (__ret(, __branch() do not shift later slices.
  patches.sort((a, b) => b.start - a.start || b.end - a.end);

  let instrumented = userCode;
  const applied = [];
  for (const p of patches) {
    const overlaps = applied.some(a => !(p.end <= a.start || p.start >= a.end));
    if (!overlaps) {
      instrumented = instrumented.slice(0, p.start) + p.text + instrumented.slice(p.end);
      applied.push(p);
    }
  }

  return { instrumented, fnName, fnParams, ast };
}

function looksLikePython(code, language) {
  const lang = String(language || '').toLowerCase();
  if (lang.startsWith('py')) return true;
  return /^\s*def\s+/m.test(code) && !/\bfunction\b/.test(code) && !/=>/.test(code);
}

function runPythonVisualize(code, testCases, problemTitle) {
  return runPythonSettrace({
    code,
    testCases,
    problemTitle,
    buildCaption,
    formatVal: formatValPython,
    translateError,
    timeoutMs: TIMEOUT_MS + 1500
  });
}

/**
 * POST /api/visualize
 * Executes user JavaScript or Python and returns story steps for the theater.
 */
router.post('/', async (req, res) => {
  let { code, problemTitle, problemType, testCases, language } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please provide some code to visualize.'
    });
  }

  try {
    if (String(language || '').toLowerCase() === 'python' || looksLikePython(code, language)) {
      const py = await runPythonVisualize(code, testCases, problemTitle);
      if (Array.isArray(py.steps)) polishVisualizerCaptions(py.steps, formatValPython);
      return res.json(py);
    }

    const codingLang = detectCodingLanguage(code, language);
    if (codingLang === 'c' || codingLang === 'cpp' || codingLang === 'java') {
      code = transpileCLikeToJs(code);
      testCases = (Array.isArray(testCases) ? testCases : []).map((t) => Object.assign({}, t, {
        testCall: compiledCallToJs(t.testCall)
      }));
    }

    // 1. AST Parsing & Instrumentation
    let instrumented, fnName, fnParams, ast;
    try {
      const parsed = instrumentCode(code);
      instrumented = parsed.instrumented;
      fnName = parsed.fnName;
      fnParams = parsed.fnParams || [];
      ast = parsed.ast;
    } catch (parseErr) {
      const friendlyErr = translateError(parseErr, code);
      return res.json({
        success: false,
        errorType: 'syntax',
        line: friendlyErr.line,
        friendlyCaption: friendlyErr.friendly,
        rawError: friendlyErr.raw
      });
    }

    // 2. Prepare Sample Arguments / Test Cases
    const paramNames = (fnParams || []).map(paramName).filter(Boolean);
    const fnParamCount = paramNames.length || 1;

    let sampleArgs = null;
    let expectedOutput = null;
    let invocationOverride = null;

    if (Array.isArray(testCases) && testCases.length > 0) {
      const t = testCases[0];
      const callFn = testCallFnName(t.testCall);
      const callMatches = !fnName || !callFn || callFn === fnName;
      if (callMatches) {
        expectedOutput = t.expected !== undefined ? t.expected : t.expectedOutput;
      }
      if (callMatches && t.testCall && isSafeCallExpr(t.testCall)) {
        invocationOverride = t.testCall.trim().replace(/;+\s*$/, '');
      }
      if (callMatches && t.input !== undefined) {
        if (fnParamCount === 1) {
          sampleArgs = [t.input];
        } else if (Array.isArray(t.input)) {
          sampleArgs = t.input;
        } else if (!invocationOverride) {
          sampleArgs = [t.input];
        }
      }
    }

    if (!sampleArgs) {
      sampleArgs = inferSampleArgs(fnName, paramNames, problemTitle);
    }

    let initialValues = [];
    if (Array.isArray(sampleArgs[0])) {
      initialValues = [...sampleArgs[0]];
    } else if (Array.isArray(sampleArgs)) {
      initialValues = [...sampleArgs];
    }

    const dsType = detectDataStructure(ast, sampleArgs, code, problemTitle, problemType);

    // 3. VM Sandbox Setup
    const steps = [];
    const variables = {};
    const callStack = [];
    let loopCounts = {};
    let pendingSwap = null;
    let activeArray = [...initialValues];
    let visitedNodes = [];
    let isInfiniteLoop = false;

    const emitStep = (type, payload) => {
      if (steps.length >= MAX_STEPS) {
        isInfiniteLoop = true;
        throw new Error('Maximum step limit reached (likely infinite loop).');
      }

      const activeIndices = payload.indices || [];
      const caption = buildCaption(type, payload, variables);

      // Structure state snapshot
      const treeSnap = dsType === 'tree' ? pickTreeSnapshot(variables, activeArray, sampleArgs) : null;
      const graphSnap = dsType === 'graph' ? pickGraphSnapshot(variables) : null;
      const dsValues = treeSnap || graphSnap
        ? (treeSnap ? flattenTreeValues(treeSnap) : Object.keys(graphSnap))
        : [...activeArray];

      const stateSnapshot = {
        variables: { ...variables },
        dataStructure: {
          type: dsType,
          values: dsValues,
          tree: treeSnap,
          graph: graphSnap,
          visited: [...visitedNodes]
        },
        activeIndices,
        callStack: [...callStack],
        loop: payload.loop || null
      };

      steps.push({
        stepNumber: steps.length,
        line: payload.line || 1,
        type,
        data: { ...payload },
        caption,
        returnValue: payload.val !== undefined ? payload.val : (payload.value !== undefined ? payload.value : null),
        state: stateSnapshot
      });
    };

    const sandbox = {
      __onCall(name, args, line) {
        const frame = `${name}(${args.map(formatVal).join(', ')})`;
        callStack.push(frame);
        emitStep('call', { functionName: name, fnName: name, args, line });
      },

      __cmp(a, b, op, line, passedIndices) {
        let res;
        switch (op) {
          case '<': res = a < b; break;
          case '>': res = a > b; break;
          case '<=': res = a <= b; break;
          case '>=': res = a >= b; break;
          case '===': res = a === b; break;
          case '==': res = a == b; break;
          case '!==': res = a !== b; break;
          case '!=': res = a != b; break;
          default: res = false;
        }

        const indices = Array.isArray(passedIndices) ? passedIndices.map(Number).filter(n => !isNaN(n)) : [];
        emitStep('compare', { line, valA: a, valB: b, op, result: res, indices });
        return res;
      },

      __branch(cond, line, conditionStr) {
        const taken = Boolean(cond);
        emitStep('branch', { line, taken, conditionStr });
        return cond;
      },

      __loopIter(id, line, varName, varVal) {
        loopCounts[id] = (loopCounts[id] || 0) + 1;
        const cur = loopCounts[id];
        if (varName && varVal !== null) {
          variables[varName] = varVal;
        }
        emitStep('loop-iter', {
          line,
          current: cur,
          varName,
          varVal,
          loop: { current: cur, loopId: id }
        });
      },

      __assignVar(name, val, line) {
        variables[name] = val;
        emitStep('assign', { variable: name, name, val, line });
        return val;
      },

      __assignMember(obj, prop, val, line, objName, isComputed) {
        if (obj === undefined || obj === null) {
          throw new TypeError(`Cannot set properties of ${obj} (setting '${prop}')`);
        }
        const oldVal = obj[prop];
        obj[prop] = val;

        const numIdx = Number(prop);
        if (Array.isArray(obj) && !isNaN(numIdx)) {
          activeArray[numIdx] = val;
          // In-place swap detection
          if (pendingSwap && pendingSwap.arr === objName && Math.abs(pendingSwap.idx - numIdx) <= 2) {
            const i1 = Math.min(pendingSwap.idx, numIdx);
            const i2 = Math.max(pendingSwap.idx, numIdx);
            emitStep('swap', {
              line,
              valA: pendingSwap.val,
              valB: oldVal,
              indices: [i1, i2]
            });
            pendingSwap = null;
          } else {
            pendingSwap = { arr: objName, idx: numIdx, val, oldVal };
            emitStep('assign', {
              variable: `${objName}[${numIdx}]`,
              name: `${objName}[${numIdx}]`,
              val,
              index: numIdx,
              line,
              indices: [numIdx]
            });
          }
        } else {
          // Object property mutation (e.g. node.next, node.left)
          if (prop === 'next' || prop === 'left' || prop === 'right') {
            const nextVal = val ? (val.val !== undefined ? val.val : 'node') : 'null';
            visitedNodes.push(String(nextVal));
            emitStep('traversal', { line, nodeId: nextVal, value: nextVal, property: prop });
          } else {
            emitStep('assign', {
              variable: `${objName}.${prop}`,
              name: `${objName}.${prop}`,
              val,
              line
            });
          }
        }
        return val;
      },

      __arrMutate(arr, method, args, line, arrName) {
        let retVal;
        if (method === 'push') {
          retVal = arr.push(...args);
          activeArray = [...arr];
          const val = args[0];
          emitStep(dsType === 'queue' ? 'queue-enqueue' : 'stack-push', { line, val, arrName });
        } else if (method === 'pop') {
          retVal = arr.pop();
          activeArray = [...arr];
          emitStep('stack-pop', { line, val: retVal, arrName });
        } else if (method === 'shift') {
          retVal = arr.shift();
          activeArray = [...arr];
          emitStep('queue-dequeue', { line, val: retVal, arrName });
        } else if (method === 'unshift') {
          retVal = arr.unshift(...args);
          activeArray = [...arr];
          emitStep('assign', { line, val: args[0], variable: `${arrName}[0]` });
        }
        return retVal;
      },

      __ret(val, line, functionName) {
        emitStep('return', { functionName, fnName: functionName, value: val, val, line });
        if (callStack.length > 0) callStack.pop();
        return val;
      },

      __strCheck(obj, method, args, line) {
        if (obj == null || typeof obj[method] !== 'function') {
          throw new TypeError(`${method} is not a function`);
        }
        const retVal = obj[method](...args);
        emitStep('compare', {
          line,
          valA: obj,
          valB: args[0],
          op: method,
          result: typeof retVal === 'number' ? retVal >= 0 : Boolean(retVal)
        });
        return retVal;
      },

      console: { log: () => {}, error: () => {}, warn: () => {} },
      Math, parseInt, parseFloat, Array, Object, String, Number, Boolean, Set, Map, JSON, RegExp, Date, Error
    };

    // 4. Execution invocation code
    let invocation = '';
    if (invocationOverride) {
      invocation = `\n${invocationOverride};\n`;
    } else if (fnName) {
      invocation = `\n${fnName}(${sampleArgs.map(arg => JSON.stringify(arg)).join(', ')});\n`;
    }

    const script = new vm.Script(`
      ${instrumented}
      ${invocation}
    `);

    const context = vm.createContext(sandbox);

    let runtimeError = null;
    try {
      script.runInContext(context, { timeout: TIMEOUT_MS });
    } catch (runErr) {
      runtimeError = translateError(runErr, code);
      if (runtimeError.type === 'infinite-loop') {
        isInfiniteLoop = true;
      }
    }

    // If the function was never invoked (arrow/const, missing call), tell a static story
    if (steps.length === 0 && !runtimeError) {
      const staticSteps = buildStaticStorySteps(ast, code, dsType);
      staticSteps.forEach(s => steps.push(s));
    }

    // Baseline Step 0 (so playback can sit paused waiting for user)
    if (steps.length > 0 && steps[0].type !== 'call') {
      const startLabel = Array.isArray(initialValues) && initialValues.length
        ? `Starting with data: [${initialValues.join(', ')}]`
        : (sampleArgs.length ? `Starting with ${sampleArgs.map(formatVal).join(', ')}.` : 'Ready to run!');
      steps.unshift({
        stepNumber: 0,
        line: 1,
        type: 'initial',
        data: { initialValues },
        caption: startLabel,
        returnValue: null,
        state: {
          variables: {},
          dataStructure: { type: dsType, values: [...initialValues], visited: [] },
          activeIndices: [],
          callStack: fnName ? [fnName] : [],
          loop: null
        }
      });
    }

    // Re-index steps
    steps.forEach((s, i) => { s.stepNumber = i; });
    polishVisualizerCaptions(steps);

    // Evaluate solution correctness
    let isCorrect = false;
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      if (lastStep.type === 'return') {
        if (expectedOutput !== undefined && expectedOutput !== null) {
          isCorrect = valuesEqual(lastStep.returnValue, expectedOutput);
        } else if (dsType === 'array' && activeArray.length > 1) {
          isCorrect = activeArray.every((v, i) => i === 0 || activeArray[i - 1] <= v);
        }
      }
    }

    return res.json({
      success: true,
      dsType,
      initialData: initialValues,
      totalSteps: steps.length,
      steps,
      isCorrect,
      isInfiniteLoop,
      runtimeError: runtimeError ? runtimeError.friendly : null,
      runtimeErrorLine: runtimeError ? runtimeError.line : null,
      friendlyCaption: runtimeError ? runtimeError.friendly : (isCorrect ? "Nice work — that's correct! 🎉" : null)
    });

  } catch (err) {
    const friendlyErr = translateError(err, code);
    return res.json({
      success: false,
      errorType: 'runtime',
      line: friendlyErr.line,
      friendlyCaption: friendlyErr.friendly,
      rawError: friendlyErr.raw
    });
  }
});

module.exports = router;
