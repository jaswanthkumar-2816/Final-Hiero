const express = require('express');
const acorn = require('acorn');
const walk = require('acorn-walk');
const vm = require('vm');

const router = express.Router();

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
    const varName = msg.split(' ')[0] || 'a variable';
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
    if (v.length === 0) return 'an empty list';
    if (v.length <= 4) return `[${v.join(', ')}]`;
    return `[${v.slice(0, 3).join(', ')} and more]`;
  }
  if (typeof v === 'object') {
    try {
      const keys = Object.keys(v);
      if (keys.length === 0) return 'an empty item';
      return `item with ${keys.slice(0, 2).join(', ')}`;
    } catch {
      return 'an item';
    }
  }
  return String(v);
}

/**
 * Generate a friendly plain-English caption for an event.
 * Maximum ~12 words, conversational, no raw code syntax.
 */
function buildCaption(type, payload, variables) {
  switch (type) {
    case 'compare': {
      const { valA, valB, op, result } = payload;
      const a = formatVal(valA);
      const b = formatVal(valB);
      if (op === '>') {
        return `Comparing ${a} and ${b} — is ${a} bigger than ${b}?`;
      }
      if (op === '<') {
        return `Comparing ${a} and ${b} — is ${a} smaller than ${b}?`;
      }
      if (op === '===' || op === '==') {
        return `Comparing ${a} and ${b} — are they equal?`;
      }
      if (op === '!==' || op === '!=') {
        return `Comparing ${a} and ${b} — are they different?`;
      }
      if (op === '>=') {
        return `Comparing ${a} and ${b} — is ${a} at least ${b}?`;
      }
      if (op === '<=') {
        return `Comparing ${a} and ${b} — is ${a} at most ${b}?`;
      }
      return `Comparing ${a} and ${b}.`;
    }

    case 'swap': {
      const a = formatVal(payload.valA);
      const b = formatVal(payload.valB);
      return `Yep! ${a} is bigger, so we swap them.`;
    }

    case 'assign': {
      const val = formatVal(payload.val);
      const varName = payload.variable || payload.name || 'it';
      return `We store ${val} in ${varName}.`;
    }

    case 'loop-iter': {
      const n = payload.current || 1;
      return `Starting round ${n} of the loop.`;
    }

    case 'branch': {
      const { taken, conditionStr } = payload;
      const cond = conditionStr ? conditionStr.replace(/[{}()]/g, '') : 'the check';
      return taken
        ? `Since ${cond} is true, we go into this block.`
        : `Since ${cond} is false, we skip this block.`;
    }

    case 'call': {
      const fn = payload.functionName || payload.fnName || 'the function';
      const args = Array.isArray(payload.args) && payload.args.length > 0
        ? payload.args.map(formatVal).join(', ')
        : 'no inputs';
      return `We call ${fn} with ${args}.`;
    }

    case 'return': {
      const fn = payload.functionName || payload.fnName || 'The function';
      const val = formatVal(payload.value !== undefined ? payload.value : payload.val);
      return `${fn} finishes and hands back ${val}.`;
    }

    case 'traversal': {
      const val = formatVal(payload.value !== undefined ? payload.value : payload.nodeId);
      return `We move to the next node: ${val}.`;
    }

    case 'stack-push': {
      const val = formatVal(payload.val);
      return `Pushing ${val} onto the top of the stack.`;
    }

    case 'stack-pop': {
      const val = formatVal(payload.val);
      return `Popping ${val} off the top of the stack.`;
    }

    case 'queue-enqueue': {
      const val = formatVal(payload.val);
      return `Adding ${val} to the back of the queue.`;
    }

    case 'queue-dequeue': {
      const val = formatVal(payload.val);
      return `Removing ${val} from the front of the queue.`;
    }

    default:
      return payload.caption || 'Moving to the next step.';
  }
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

/**
 * Instrument user code with Acorn AST
 */
function instrumentCode(userCode) {
  const ast = acorn.parse(userCode, { ecmaVersion: 2022, locations: true, ranges: true });
  const patches = [];

  let fnName = null;
  walk.simple(ast, {
    FunctionDeclaration(node) {
      if (!fnName && node.id) fnName = node.id.name;
    }
  });

  let loopCounter = 0;

  walk.ancestor(ast, {
    FunctionDeclaration(node) {
      const name = node.id ? node.id.name : 'anonymous';
      const line = node.loc.start.line;
      if (node.body && node.body.type === 'BlockStatement') {
        patches.push({
          start: node.body.start + 1,
          end: node.body.start + 1,
          text: `\n__onCall('${name}', Array.from(arguments), ${line});\n`
        });
      }
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
        end: node.test.end,
        text: `__branch(${testStr}, ${line}, ${safeCondStr})`
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
      // Intercept array push, pop, shift, unshift
      if (node.callee && node.callee.type === 'MemberExpression' && node.callee.property && !node.callee.computed) {
        const method = node.callee.property.name;
        if (['push', 'pop', 'shift', 'unshift'].includes(method)) {
          const objStr = userCode.slice(node.callee.object.start, node.callee.object.end);
          const argsStr = node.arguments.map(a => userCode.slice(a.start, a.end)).join(', ');
          const line = node.loc.start.line;
          patches.push({
            start: node.start,
            end: node.end,
            text: `__arrMutate(${objStr}, '${method}', [${argsStr}], ${line}, ${JSON.stringify(objStr)})`
          });
        }
      }
    },
    ReturnStatement(node) {
      const line = node.loc.start.line;
      if (node.argument) {
        const argStr = userCode.slice(node.argument.start, node.argument.end);
        patches.push({
          start: node.argument.start,
          end: node.argument.end,
          text: `__ret(${argStr}, ${line}, '${fnName || 'handleLogic'}')`
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

  // Sort descending by start position to safely replace
  patches.sort((a, b) => b.start - a.start || a.end - b.end);

  let instrumented = userCode;
  const applied = [];
  for (const p of patches) {
    const overlaps = applied.some(a => !(p.end <= a.start || p.start >= a.end));
    if (!overlaps) {
      instrumented = instrumented.slice(0, p.start) + p.text + instrumented.slice(p.end);
      applied.push(p);
    }
  }

  return { instrumented, fnName, ast };
}

/**
 * POST /api/visualize
 * Executes user JavaScript code with AST event instrumentation and VM sandboxing.
 */
router.post('/', async (req, res) => {
  const { code, problemTitle, problemType, testCases } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please provide some code to visualize.'
    });
  }

  try {
    // 1. AST Parsing & Instrumentation
    let instrumented, fnName, ast;
    try {
      const parsed = instrumentCode(code);
      instrumented = parsed.instrumented;
      fnName = parsed.fnName;
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
    let fnParamCount = 1;
    if (fnName) {
      walk.simple(ast, {
        FunctionDeclaration(node) {
          if (node.id && node.id.name === fnName) {
            fnParamCount = node.params.length;
          }
        }
      });
    }

    let sampleArgs = null;
    let expectedOutput = null;

    if (Array.isArray(testCases) && testCases.length > 0) {
      const t = testCases[0];
      expectedOutput = t.expected;
      if (t.input !== undefined) {
        if (fnParamCount === 1) {
          sampleArgs = [t.input];
        } else if (Array.isArray(t.input)) {
          sampleArgs = t.input;
        } else {
          sampleArgs = [t.input];
        }
      }
    }

    if (!sampleArgs) {
      const lower = ((problemTitle || '') + ' ' + (fnName || '')).toLowerCase();
      if (lower.includes('sort')) {
        sampleArgs = [[5, 1, 4, 2, 8]];
      } else if (lower.includes('two sum') || lower.includes('twosum')) {
        sampleArgs = [[2, 7, 11, 15], 9];
      } else if (lower.includes('binary') || lower.includes('search')) {
        sampleArgs = [[1, 3, 5, 7, 9, 11], 7];
      } else if (lower.includes('reverse') || lower.includes('palindrome')) {
        sampleArgs = [[1, 2, 3, 4, 5]];
      } else if (lower.includes('fib') || lower.includes('factorial')) {
        sampleArgs = [5];
      } else if (lower.includes('tree') || lower.includes('bst')) {
        sampleArgs = [{ val: 10, left: { val: 5, left: null, right: null }, right: { val: 15, left: null, right: null } }];
      } else if (lower.includes('list')) {
        sampleArgs = [{ val: 1, next: { val: 2, next: { val: 3, next: null } } }];
      } else {
        sampleArgs = [[4, 2, 7, 1, 9]];
      }
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
      const stateSnapshot = {
        variables: { ...variables },
        dataStructure: {
          type: dsType,
          values: [...activeArray],
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

      console: { log: () => {}, error: () => {}, warn: () => {} },
      Math, parseInt, parseFloat, Array, Object, String, Number, Boolean, Set, Map
    };

    // 4. Execution invocation code
    let invocation = '';
    if (fnName) {
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

    // Baseline Step 0 (so playback can sit paused waiting for user)
    if (steps.length > 0 && steps[0].type !== 'call') {
      steps.unshift({
        stepNumber: 0,
        line: 1,
        type: 'initial',
        data: { initialValues },
        caption: `Ready to run! Starting with data: [${initialValues.join(', ')}]`,
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

    // Evaluate solution correctness
    let isCorrect = false;
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      if (lastStep.type === 'return') {
        if (expectedOutput !== undefined) {
          isCorrect = JSON.stringify(lastStep.returnValue) === JSON.stringify(expectedOutput);
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
