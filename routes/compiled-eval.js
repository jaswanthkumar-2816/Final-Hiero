'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { compiledCallToJs, transpileCLikeToJs } = require('./clike-to-js');

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: opts.cwd });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) { /* ignore */ }
      resolve({ ok: false, stdout, stderr: stderr || 'Timed out', code: 1 });
    }, opts.timeout || 8000);
    proc.stdout.on('data', (c) => { stdout += c; });
    proc.stderr.on('data', (c) => { stderr += c; });
    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: err.code === 'ENOENT' ? `${cmd} is not installed.` : err.message, code: 1 });
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout, stderr, code });
    });
    if (opts.input != null) {
      proc.stdin.write(opts.input);
      proc.stdin.end();
    }
  });
}

function wrapC(userCode, testCall) {
  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

${userCode}

int main(void) {
    printf("%d\\n", (int)(${testCall}));
    return 0;
}
`;
}

function wrapCpp(userCode, testCall) {
  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
    cout << (${testCall}) << endl;
    return 0;
}
`;
}

function wrapJava(userCode, testCall) {
  const hasClass = /class\s+Solution\b/.test(userCode);
  const body = hasClass ? userCode : `public class Solution {\n${userCode}\n}`;
  return `${body}

public class HieroEval {
    public static void main(String[] args) {
        System.out.println(Solution.${testCall});
    }
}
`;
}

function outputsMatch(actual, expected) {
  const a = String(actual ?? '').trim();
  const e = String(expected ?? '').trim();
  if (a === e) return true;
  if (a && e && Number(a) === Number(e) && !Number.isNaN(Number(a))) return true;
  return false;
}

async function evaluateCompiled(lang, userCode, testCases) {
  const cases = Array.isArray(testCases) ? testCases : [];
  const id = crypto.randomBytes(4).toString('hex');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `hiero-${lang}-${id}-`));
  const results = [];

  try {
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const name = tc.name || `Case ${i + 1}`;
      const caseNum = tc.case || i + 1;
      const call = String(tc.testCall || '').trim();
      if (!call) {
        results.push({ case: caseNum, name, passed: false, input: tc.input || '', expected: tc.expectedOutput || '', actual: null, error: 'Missing test call' });
        continue;
      }

      if (lang === 'java') {
        const src = wrapJava(userCode, call);
        const file = path.join(dir, 'HieroEval.java');
        fs.writeFileSync(file, src);
        const compiled = await runCmd('javac', ['HieroEval.java'], { cwd: dir });
        if (!compiled.ok) {
          results.push({
            case: caseNum, name, passed: false, input: tc.input || '', expected: tc.expectedOutput || '',
            actual: null, error: compiled.stderr.trim() || 'Java compile failed'
          });
          continue;
        }
        const ran = await runCmd('java', ['HieroEval'], { cwd: dir });
        const actual = ran.stdout.trim();
        const passed = ran.ok && outputsMatch(actual, tc.expectedOutput);
        results.push({
          case: caseNum, name, passed, input: tc.input || '', expected: tc.expectedOutput || '',
          actual, error: passed ? null : (ran.stderr.trim() || 'Output did not match expected value')
        });
        continue;
      }

      const isCpp = lang === 'cpp';
      const src = isCpp ? wrapCpp(userCode, call) : wrapC(userCode, call);
      const srcFile = path.join(dir, isCpp ? 'main.cpp' : 'main.c');
      const outFile = path.join(dir, 'a.out');
      fs.writeFileSync(srcFile, src);
      const compiled = await runCmd(isCpp ? 'g++' : 'gcc', [srcFile, '-O0', '-std=' + (isCpp ? 'c++17' : 'c11'), '-o', outFile]);
      if (!compiled.ok) {
        results.push({
          case: caseNum, name, passed: false, input: tc.input || '', expected: tc.expectedOutput || '',
          actual: null, error: compiled.stderr.trim() || 'Compile failed'
        });
        continue;
      }
      const ran = await runCmd(outFile, []);
      const actual = ran.stdout.trim();
      const passed = ran.ok && outputsMatch(actual, tc.expectedOutput);
      results.push({
        case: caseNum, name, passed, input: tc.input || '', expected: tc.expectedOutput || '',
        actual, error: passed ? null : (ran.stderr.trim() || 'Output did not match expected value')
      });
    }
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length || 1;
  const score = Math.round((passedTests / totalTests) * 10);
  return {
    success: true,
    score,
    passed: passedTests === totalTests && totalTests > 0,
    passedTests,
    totalTests,
    testResults: results
  };
}

function evaluateTranspiled(userCode, testCases, evaluateJavaScriptCode) {
  const js = transpileCLikeToJs(userCode);
  const mapped = (testCases || []).map((t) => Object.assign({}, t, { testCall: compiledCallToJs(t.testCall) }));
  return evaluateJavaScriptCode(js, mapped);
}

module.exports = { evaluateCompiled, evaluateTranspiled, compiledCallToJs, transpileCLikeToJs };
