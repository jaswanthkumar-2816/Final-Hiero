'use strict';

const { spawn } = require('child_process');
const path = require('path');

const RUNNER = path.join(__dirname, 'python_settrace.py');

function pickTestCall(testCases, code) {
  if (!Array.isArray(testCases) || !testCases[0]) return '';
  const t = testCases[0];
  const call = t.testCall || t.input;
  if (typeof call !== 'string' || !call.trim()) return '';
  const src = String(code || '');
  const defined = [...src.matchAll(/^\s*(?:def|class)\s+([A-Za-z_][\w]*)/gm)].map((m) => m[1]);
  if (!defined.length) return '';
  const trimmed = call.trim();
  return defined.some((name) => trimmed.includes(name)) ? trimmed : '';
}

function isSafePythonTest(src) {
  if (!src) return true;
  if (typeof src !== 'string') return false;
  if (src.length > 4000) return false;
  if (/\b(__import__|open\s*\(|exec\s*\(|eval\s*\(|subprocess|socket|os\.|sys\.)/.test(src)) return false;
  return true;
}

function runPythonVisualize(opts) {
  const {
    code,
    testCases,
    problemTitle,
    buildCaption,
    formatVal,
    translateError,
    timeoutMs = 3500
  } = opts;

  const testCall = pickTestCall(testCases, code);
  const payload = JSON.stringify({
    code,
    testCall: isSafePythonTest(testCall) ? testCall : '',
    title: problemTitle || ''
  });

  return new Promise((resolve) => {
    const proc = spawn('python3', [RUNNER], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) { /* ignore */ }
      resolve({
        success: false,
        errorType: 'runtime',
        line: 1,
        friendlyCaption: "This looks like it might be looping forever — want to double check the loop's condition?",
        rawError: 'Python visualizer timed out',
        language: 'python'
      });
    }, timeoutMs);

    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        errorType: 'runtime',
        line: 1,
        friendlyCaption: err.code === 'ENOENT'
          ? 'Python 3 is not installed on this machine.'
          : 'Something went wrong running Python. Want to try again?',
        rawError: err.message,
        language: 'python'
      });
    });
    proc.on('close', () => {
      clearTimeout(timer);
      let data;
      try {
        data = JSON.parse((stdout || '').trim() || '{}');
      } catch (_) {
        resolve({
          success: false,
          errorType: 'runtime',
          line: 1,
          friendlyCaption: 'I could not turn this into steps. Check the function and try again.',
          rawError: (stderr || stdout || 'empty python tracer output').slice(0, 240),
          language: 'python'
        });
        return;
      }

      if (data.success === false && data.errorType === 'syntax') {
        const fake = { name: 'SyntaxError', message: data.rawError || 'invalid syntax', loc: { line: data.line || 1 } };
        const friendly = translateError(fake, code);
        resolve({
          success: false,
          errorType: 'syntax',
          line: friendly.line || data.line || 1,
          friendlyCaption: friendly.friendly,
          rawError: data.rawError || friendly.raw,
          language: 'python'
        });
        return;
      }

      const events = Array.isArray(data.events) ? data.events : [];
      const dsType = data.dsType || 'trace';
      const kept = events.filter((event) => {
        if ((event.type || '') !== 'assign') return true;
        const name = String((event.payload || {}).variable || (event.payload || {}).name || '');
        if (/^(total_|pass_|tmp|temp)/i.test(name)) return false;
        if (/(comparisons|swaps|counter)$/i.test(name)) return false;
        return true;
      });
      const steps = kept.map((event, i) => {
        const payloadEvent = event.payload || {};
        const caption = buildCaption(event.type, payloadEvent, event.variables || {}, formatVal);
        return {
          stepNumber: i,
          type: event.type || 'assign',
          line: event.line || 1,
          caption,
          payload: payloadEvent,
          returnValue: event.returnValue != null ? event.returnValue : null,
          state: {
            variables: event.variables || {},
            dataStructure: event.dataStructure || { type: dsType, values: [], visited: [] },
            activeIndices: event.activeIndices || [],
            callStack: event.callStack || [],
            loop: event.loop || null
          }
        };
      });

      const runtimeFriendly = data.rawError && data.errorType !== 'syntax'
        ? translateError({ message: data.rawError }, code).friendly
        : null;

      resolve({
        success: true,
        dsType,
        initialData: data.initialData || [],
        totalSteps: steps.length,
        steps,
        isCorrect: Boolean(data.isCorrect),
        isInfiniteLoop: Boolean(data.isInfiniteLoop),
        runtimeError: runtimeFriendly,
        runtimeErrorLine: runtimeFriendly ? 1 : null,
        friendlyCaption: runtimeFriendly || (steps.length ? null : 'I could not turn this into steps. Check the function and try again.'),
        language: 'python'
      });
    });

    proc.stdin.write(payload);
    proc.stdin.end();
  });
}

module.exports = { runPythonVisualize };
