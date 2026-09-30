'use strict';

function compiledCallToJs(testCall) {
  return String(testCall || '')
    .replace(/new\s+int\s*\[\s*\]\s*\{([^}]*)\}/g, '[$1]')
    .replace(/\(\s*int\s*\[\s*\]\s*\)\s*\{([^}]*)\}/g, '[$1]')
    .replace(/vector\s*<\s*int\s*>\s*\{([^}]*)\}/g, '[$1]')
    .replace(/std::vector\s*<\s*int\s*>\s*\{([^}]*)\}/g, '[$1]');
}

function transpileCLikeToJs(code) {
  let s = String(code || '');
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/#include[^\n]*/g, '');
  s = s.replace(/using\s+namespace\s+std\s*;/g, '');
  s = s.replace(/package\s+[\w.]+;/g, '');
  s = s.replace(/\bpublic\s+class\s+\w+\s*\{/, '');
  s = s.replace(/\b(public|private|protected|static|final|override)\s+/g, '');
  s = s.replace(/const\s+vector\s*<\s*int\s*>\s*&\s*(\w+)/g, '$1');
  s = s.replace(/const\s+std::vector\s*<\s*int\s*>\s*&\s*(\w+)/g, '$1');
  s = s.replace(/const\s+string\s*&\s*(\w+)/g, '$1');
  s = s.replace(/const\s+std::string\s*&\s*(\w+)/g, '$1');
  s = s.replace(/const\s+char\s*\*\s*(\w+)/g, '$1');
  s = s.replace(/\b(int|long|float|double|char|boolean|bool|void|size_t|string|String|auto)\s+(\w+)\s*\(/g, 'function $2(');
  s = s.replace(/\bint\s+(\w+)\s*\[\s*\]/g, '$1');
  s = s.replace(/\bint\[\s*\]\s+(\w+)/g, '$1');
  s = s.replace(/\bString\s+(\w+)/g, '$1');
  s = s.replace(/\bfor\s*\(\s*(int|let)\s+/g, 'for (let ');
  s = s.replace(/\b(int|long|float|double|boolean|bool|char|string|String)\s+(\w+)\s*=/g, 'let $2 =');
  s = s.replace(/\b(int|long|float|double|boolean|bool|char)\s+(\w+)\s*;/g, 'let $2;');
  s = s.replace(/(\w+)\.length\(\)/g, '$1.length');
  s = s.replace(/(\w+)\.size\(\)/g, '$1.length');
  s = s.replace(/(\w+)\.charAt\(([^)]+)\)/g, '$1[$2]');
  s = s.replace(/\bstrlen\s*\(\s*(\w+)\s*\)/g, '$1.length');
  s = s.replace(/System\.out\.println\([^;]*\);/g, '');
  s = s.replace(/std::cout[\s\S]*?;/g, '');
  s = s.replace(/cout\s*<<[\s\S]*?;/g, '');
  s = s.replace(/printf\([^;]*\);/g, '');
  s = s.replace(/\bnullptr\b/g, 'null');
  s = s.replace(/\bNULL\b/g, 'null');
  s = s.replace(/\n\}\s*$/, '\n');
  return s.trim();
}

function detectCodingLanguage(code, language) {
  const lang = String(language || '').toLowerCase().trim();
  if (lang === 'c++' || lang === 'cpp' || lang === 'cplusplus') return 'cpp';
  if (lang === 'c' || lang === 'clang') return 'c';
  if (lang === 'java') return 'java';
  if (lang === 'python' || lang === 'py' || lang === 'python3') return 'python';
  if (lang === 'javascript' || lang === 'js') return 'javascript';

  const src = String(code || '');
  if (/^\s*def\s+/m.test(src) && !/\bfunction\b/.test(src)) return 'python';
  if (/#include\s*<iostream>|std::|using namespace/.test(src)) return 'cpp';
  if (/#include\s*<stdio|#include\s*<stdlib|\bint\s+\w+\s*\(\s*int\s+\w+\s*\[/.test(src)) return 'c';
  if (/\bpublic\s+class\b|System\.out|\bstatic\s+int\s+\w+\s*\(\s*int\[\]/.test(src)) return 'java';
  if (/\bfunction\b|=>|const\s+|let\s+/.test(src)) return 'javascript';
  return 'javascript';
}

module.exports = { compiledCallToJs, transpileCLikeToJs, detectCodingLanguage };
