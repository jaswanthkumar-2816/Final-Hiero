const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');
const vm = require('vm');
const dotenv = require('dotenv');
const LANG_PACKS = require('./lang-packs');
const { detectCodingLanguage } = require('./clike-to-js');
const { evaluateCompiled, evaluateTranspiled } = require('./compiled-eval');

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

// ==========================================
// CURATED 9-PACK PROBLEM DATABASE
// ==========================================
const CURATED_PROBLEMS_BY_SKILL = {
  python: [
    // ── 3 EASY ──
    {
      id: 'py-easy-1',
      skill: 'Python',
      difficulty: 'easy',
      subTopic: 'Core Syntax & Truthiness',
      title: 'Count Truthy and Falsy Elements',
      description: 'Write a function `evaluate_truthy(val_list)` that accepts a list of values and returns a dictionary with two keys: `"truthy_count"` (number of truthy elements) and `"falsy_count"` (number of falsy elements).',
      hint: "Use bool(x) or truth value testing in Python. Falsy values include 0, None, False, '', [], and {}.",
      starterCode: `def evaluate_truthy(val_list):
    # Return a dictionary with 'truthy_count' and 'falsy_count'
    pass

if __name__ == '__main__':
    print(evaluate_truthy([0, 'Python', [], {}, 42, True]))`,
      testCases: [
        {
          case: 1,
          name: "Mixed Values Test",
          input: "[0, 'Python', [], {}, 42, True]",
          testCall: "evaluate_truthy([0, 'Python', [], {}, 42, True])",
          expectedOutput: "{'truthy_count': 3, 'falsy_count': 3}"
        },
        {
          case: 2,
          name: "All Falsy Test",
          input: "[False, None, 0, '', []]",
          testCall: "evaluate_truthy([False, None, 0, '', []])",
          expectedOutput: "{'truthy_count': 0, 'falsy_count': 5}"
        },
        {
          case: 3,
          name: "All Truthy Test",
          input: "[1, 2, 'hello', [1]]",
          testCall: "evaluate_truthy([1, 2, 'hello', [1]])",
          expectedOutput: "{'truthy_count': 4, 'falsy_count': 0}"
        }
      ],
      referenceSolution: `def evaluate_truthy(val_list):
    truthy = sum(1 for x in val_list if bool(x))
    return {"truthy_count": truthy, "falsy_count": len(val_list) - truthy}`
    },
    {
      id: 'py-easy-2',
      skill: 'Python',
      difficulty: 'easy',
      subTopic: 'Strings & Slicing',
      title: 'Reverse Words in a Sentence',
      description: 'Write a function `reverse_words(sentence)` that takes a string of words separated by single spaces and returns the sentence with each individual word reversed while preserving original word order.',
      hint: "Split the sentence by space using .split(' '), reverse each word with slicing [::-1], then join back with ' '.join(...).",
      starterCode: `def reverse_words(sentence):
    # Reverse each word in the sentence while preserving word order
    pass

if __name__ == '__main__':
    print(reverse_words('Hello World'))`,
      testCases: [
        {
          case: 1,
          name: "Basic Sentence Test",
          input: "'Hello World'",
          testCall: "reverse_words('Hello World')",
          expectedOutput: "'olleH dlroW'"
        },
        {
          case: 2,
          name: "Multi-Word Test",
          input: "'Python is awesome'",
          testCall: "reverse_words('Python is awesome')",
          expectedOutput: "'nohtyP si emosewa'"
        },
        {
          case: 3,
          name: "Single Word Test",
          input: "'code'",
          testCall: "reverse_words('code')",
          expectedOutput: "'edoc'"
        }
      ],
      referenceSolution: `def reverse_words(sentence):
    return ' '.join(word[::-1] for word in sentence.split(' '))`
    },
    {
      id: 'py-easy-3',
      skill: 'Python',
      difficulty: 'easy',
      subTopic: 'Dictionaries & Frequency',
      title: 'Character Frequency Map',
      description: 'Write a function `char_frequency(text)` that returns a dictionary mapping each lowercased alphanumeric character in `text` to its frequency count. Ignore spaces, punctuation, and special symbols.',
      hint: "Iterate through text, check if ch.isalnum(), convert with ch.lower(), and update the dictionary count.",
      starterCode: `def char_frequency(text):
    # Return dictionary of character frequencies for alphanumeric chars
    pass

if __name__ == '__main__':
    print(char_frequency('Hello World!'))`,
      testCases: [
        {
          case: 1,
          name: "Sentence with Punctuation",
          input: "'Hello World!'",
          testCall: "char_frequency('Hello World!')",
          expectedOutput: "{'h': 1, 'e': 1, 'l': 3, 'o': 2, 'w': 1, 'r': 1, 'd': 1}"
        },
        {
          case: 2,
          name: "Uniform Frequency Test",
          input: "'aabbcc'",
          testCall: "char_frequency('aabbcc')",
          expectedOutput: "{'a': 2, 'b': 2, 'c': 2}"
        },
        {
          case: 3,
          name: "Numeric & Spaces Test",
          input: "'123 12!'",
          testCall: "char_frequency('123 12!')",
          expectedOutput: "{'1': 2, '2': 2, '3': 1}"
        }
      ],
      referenceSolution: `def char_frequency(text):
    freq = {}
    for ch in text.lower():
        if ch.isalnum():
            freq[ch] = freq.get(ch, 0) + 1
    return freq`
    },

    // ── 3 MEDIUM ──
    {
      id: 'py-med-1',
      skill: 'Python',
      difficulty: 'medium',
      subTopic: 'Data Structures & Hash Maps',
      title: 'Two Sum Target Indices',
      description: 'Write a function `two_sum(nums, target)` that returns the 0-based indices `[i, j]` of the two numbers in `nums` that add up to `target`. Assume exactly one valid pair exists.',
      hint: "Use a dictionary to store complement values (`target - num`) and their indices as you iterate.",
      starterCode: `def two_sum(nums, target):
    # Return [index1, index2] such that nums[index1] + nums[index2] == target
    pass

if __name__ == '__main__':
    print(two_sum([2, 7, 11, 15], 9))`,
      testCases: [
        {
          case: 1,
          name: "Standard Pair Test",
          input: "nums=[2, 7, 11, 15], target=9",
          testCall: "two_sum([2, 7, 11, 15], 9)",
          expectedOutput: "[0, 1]"
        },
        {
          case: 2,
          name: "Non-adjacent Pair Test",
          input: "nums=[3, 2, 4], target=6",
          testCall: "two_sum([3, 2, 4], 6)",
          expectedOutput: "[1, 2]"
        },
        {
          case: 3,
          name: "Duplicate Values Test",
          input: "nums=[3, 3], target=6",
          testCall: "two_sum([3, 3], 6)",
          expectedOutput: "[0, 1]"
        }
      ],
      referenceSolution: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
    return []`
    },
    {
      id: 'py-med-2',
      skill: 'Python',
      difficulty: 'medium',
      subTopic: 'Recursion & Nested Dictionaries',
      title: 'Flatten Nested Dictionary',
      description: 'Write a function `flatten_dict(d, parent_key="", sep=".")` that flattens an arbitrarily deep nested dictionary into a flat dictionary where nested keys are joined by `sep`.',
      hint: "Use recursion: if the value is an instance of `dict`, recursively flatten it passing `f'{parent_key}{sep}{k}'` as the new key prefix.",
      starterCode: `def flatten_dict(d, parent_key='', sep='.'):
    # Return flattened single-level dictionary
    pass

if __name__ == '__main__':
    print(flatten_dict({'a': 1, 'b': {'c': 2, 'd': {'e': 3}}}))`,
      testCases: [
        {
          case: 1,
          name: "Deep Nested Dict Test",
          input: "{'a': 1, 'b': {'c': 2, 'd': {'e': 3}}}",
          testCall: "flatten_dict({'a': 1, 'b': {'c': 2, 'd': {'e': 3}}})",
          expectedOutput: "{'a': 1, 'b.c': 2, 'b.d.e': 3}"
        },
        {
          case: 2,
          name: "Two-Level Object Test",
          input: "{'user': {'name': 'Alice', 'age': 25}}",
          testCall: "flatten_dict({'user': {'name': 'Alice', 'age': 25}})",
          expectedOutput: "{'user.name': 'Alice', 'user.age': 25}"
        },
        {
          case: 3,
          name: "Flat Dict Boundary Test",
          input: "{'x': 10}",
          testCall: "flatten_dict({'x': 10})",
          expectedOutput: "{'x': 10}"
        }
      ],
      referenceSolution: `def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else str(k)
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)`
    },
    {
      id: 'py-med-3',
      skill: 'Python',
      difficulty: 'medium',
      subTopic: 'Algorithms & Grouping',
      title: 'Group Anagrams',
      description: 'Write a function `group_anagrams(words)` that takes a list of strings and groups all anagrams together into a list of sorted word lists. The outer list should be sorted by the first element of each group.',
      hint: "Use `tuple(sorted(word))` or `''.join(sorted(w))` as a dictionary key to group words.",
      starterCode: `from collections import defaultdict

def group_anagrams(words):
    # Group anagram words together
    pass

if __name__ == '__main__':
    print(group_anagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']))`,
      testCases: [
        {
          case: 1,
          name: "Standard Anagram Grouping",
          input: "['eat', 'tea', 'tan', 'ate', 'nat', 'bat']",
          testCall: "sorted([sorted(g) for g in group_anagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat'])])",
          expectedOutput: "[['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']]"
        },
        {
          case: 2,
          name: "Empty String Test",
          input: "['']",
          testCall: "group_anagrams([''])",
          expectedOutput: "[['']]"
        },
        {
          case: 3,
          name: "Single Character Test",
          input: "['a']",
          testCall: "group_anagrams(['a'])",
          expectedOutput: "[['a']]"
        }
      ],
      referenceSolution: `from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        key = ''.join(sorted(w))
        groups[key].append(w)
    return [sorted(g) for g in sorted(groups.values(), key=lambda g: sorted(g)[0])]`
    },

    // ── 3 HARD ──
    {
      id: 'py-hard-1',
      skill: 'Python',
      difficulty: 'hard',
      subTopic: 'System Design & Data Structures',
      title: 'LRU Cache Design',
      description: 'Implement an `LRUCache(capacity)` class with `get(key)` and `put(key, value)` methods. `get(key)` returns the value if key exists or -1 otherwise. `put(key, value)` updates or inserts the value; when the cache reaches capacity, evict the least recently used key in O(1) time.',
      hint: "Use `collections.OrderedDict` with `.move_to_end(key)` and `.popitem(last=False)` for O(1) operations.",
      starterCode: `class LRUCache:
    def __init__(self, capacity: int):
        # Initialize your cache
        pass

    def get(self, key: int) -> int:
        # Return value or -1
        pass

    def put(self, key: int, value: int) -> None:
        # Insert or update key, evicting LRU if over capacity
        pass`,
      testCases: [
        {
          case: 1,
          name: "Eviction & Access Order Test",
          input: "Capacity 2: put(1,1), put(2,2), get(1), put(3,3), get(2)",
          testCall: "c = LRUCache(2); c.put(1, 1); c.put(2, 2); g1 = c.get(1); c.put(3, 3); g2 = c.get(2); [g1, g2]",
          expectedOutput: "[1, -1]"
        },
        {
          case: 2,
          name: "Capacity 1 Immediate Eviction Test",
          input: "Capacity 1: put(10, 100), get(10)",
          testCall: "c = LRUCache(1); c.put(10, 100); c.get(10)",
          expectedOutput: "100"
        },
        {
          case: 3,
          name: "Value Update Without Eviction Test",
          input: "Capacity 2: put(1,1), put(1,10), get(1)",
          testCall: "c = LRUCache(2); c.put(1, 1); c.put(1, 10); c.get(1)",
          expectedOutput: "10"
        }
      ],
      referenceSolution: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`
    },
    {
      id: 'py-hard-2',
      skill: 'Python',
      difficulty: 'hard',
      subTopic: 'Heaps & Priority Queues',
      title: 'Merge K Sorted Streams',
      description: 'Write a function `merge_k_sorted(arrays)` that takes a list of `k` sorted integer arrays and merges them into a single sorted list in `O(N log k)` time using a min-heap.',
      hint: "Use Python's `heapq` module. Push the first element of each non-empty array into the heap along with its array index and element index.",
      starterCode: `import heapq

def merge_k_sorted(arrays):
    # Merge k sorted lists efficiently using a min-heap
    pass

if __name__ == '__main__':
    print(merge_k_sorted([[1, 4, 5], [1, 3, 4], [2, 6]]))`,
      testCases: [
        {
          case: 1,
          name: "Three Sorted Streams",
          input: "[[1, 4, 5], [1, 3, 4], [2, 6]]",
          testCall: "merge_k_sorted([[1, 4, 5], [1, 3, 4], [2, 6]])",
          expectedOutput: "[1, 1, 2, 3, 4, 4, 5, 6]"
        },
        {
          case: 2,
          name: "Streams with Empty Sublists",
          input: "[[], [1], [1, 2]]",
          testCall: "merge_k_sorted([[], [1], [1, 2]])",
          expectedOutput: "[1, 1, 2]"
        },
        {
          case: 3,
          name: "Empty Input Test",
          input: "[]",
          testCall: "merge_k_sorted([])",
          expectedOutput: "[]"
        }
      ],
      referenceSolution: `import heapq

def merge_k_sorted(arrays):
    heap = []
    for i, arr in enumerate(arrays):
        if arr:
            heapq.heappush(heap, (arr[0], i, 0))
    result = []
    while heap:
        val, arr_idx, elem_idx = heapq.heappop(heap)
        result.append(val)
        if elem_idx + 1 < len(arrays[arr_idx]):
            heapq.heappush(heap, (arrays[arr_idx][elem_idx + 1], arr_idx, elem_idx + 1))
    return result`
    },
    {
      id: 'py-hard-3',
      skill: 'Python',
      difficulty: 'hard',
      subTopic: 'Divide & Conquer · Merge Sort',
      title: 'Merge Sort a Large Array',
      description: 'Write `merge_sort(nums)` that returns a new list with the integers in non-decreasing order using classic merge sort: split the array in half, recursively sort each half, then merge the two sorted halves. Do not use `sorted()` or `.sort()`. The starter uses a 16-element array so Visualize My Code can show a full 4-level split/merge tree.',
      hint: 'If the list has 0 or 1 items, return a copy. Otherwise take mid = len(nums)//2, sort nums[:mid] and nums[mid:], then merge with two pointers into a new list.',
      starterCode: `def merge(left, right):
    merged = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    while i < len(left):
        merged.append(left[i])
        i += 1
    while j < len(right):
        merged.append(right[j])
        j += 1
    return merged

def merge_sort(nums):
    if nums is None:
        return []
    if len(nums) <= 1:
        return list(nums)
    mid = len(nums) // 2
    left = merge_sort(nums[:mid])
    right = merge_sort(nums[mid:])
    return merge(left, right)

if __name__ == '__main__':
    data = [38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25]
    print(merge_sort(data))`,
      testCases: [
        {
          case: 1,
          name: '16-element visualization array',
          input: '[38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25]',
          testCall: 'merge_sort([38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25])',
          expectedOutput: '[1, 3, 4, 7, 9, 10, 14, 19, 25, 27, 38, 43, 50, 62, 82, 91]'
        },
        {
          case: 2,
          name: 'Duplicates and negatives',
          input: '[5, -1, 5, 0, 12, -1, 8, 3]',
          testCall: 'merge_sort([5, -1, 5, 0, 12, -1, 8, 3])',
          expectedOutput: '[-1, -1, 0, 3, 5, 5, 8, 12]'
        },
        {
          case: 3,
          name: 'Already sorted and empty',
          input: '[] then [1, 2, 3]',
          testCall: '[merge_sort([]), merge_sort([1, 2, 3])]',
          expectedOutput: '[[], [1, 2, 3]]'
        }
      ],
      referenceSolution: `def merge(left, right):
    merged, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged

def merge_sort(nums):
    if not nums or len(nums) <= 1:
        return list(nums or [])
    mid = len(nums) // 2
    return merge(merge_sort(nums[:mid]), merge_sort(nums[mid:]))`
    }
  ],

  javascript: [
    // 3 Easy
    {
      id: 'js-easy-1',
      skill: 'JavaScript',
      difficulty: 'easy',
      subTopic: 'Array & Object Utilities',
      title: 'Array Chunking Utility',
      description: 'Write a function `chunkArray(array, size)` that splits an array into sub-arrays of maximum length `size`.',
      hint: 'Use a loop with array.slice(i, i + size).',
      starterCode: `function chunkArray(array, size) {\n    // Split array into chunks\n    const chunks = [];\n    for (let i = 0; i < array.length; i += size) {\n        chunks.push(array.slice(i, i + size));\n    }\n    return chunks;\n}`,
      testCases: [{ case: 1, name: "Even Chunk Test", input: "[1,2,3,4], 2", testCall: "JSON.stringify(chunkArray([1,2,3,4], 2))", expectedOutput: "[[1,2],[3,4]]" }],
      referenceSolution: `function chunkArray(array, size) { const c = []; for (let i = 0; i < array.length; i += size) c.push(array.slice(i, i + size)); return c; }`
    },
    {
      id: 'js-easy-2',
      skill: 'JavaScript',
      difficulty: 'easy',
      subTopic: 'String Manipulation',
      title: 'Title Case Formatter',
      description: 'Write a function `toTitleCase(str)` that capitalizes the first letter of each word and lowercases the rest.',
      hint: 'Split words by space, uppercase charAt(0), slice(1).toLowerCase(), then join.',
      starterCode: `function toTitleCase(str) {\n    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');\n}`,
      testCases: [{ case: 1, name: "Title Case Test", input: "'hIErO pLATfORM'", testCall: "toTitleCase('hIErO pLATfORM')", expectedOutput: "Hiero Platform" }],
      referenceSolution: `function toTitleCase(str) { return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); }`
    },
    {
      id: 'js-easy-3',
      skill: 'JavaScript',
      difficulty: 'easy',
      subTopic: 'Object Transformation',
      title: 'Invert Key-Value Object',
      description: 'Write a function `invertObject(obj)` that swaps keys and values in a simple dictionary.',
      hint: 'Use Object.entries(obj) and reduce into a new object.',
      starterCode: `function invertObject(obj) {\n    const res = {};\n    for (const [k, v] of Object.entries(obj)) res[v] = k;\n    return res;\n}`,
      testCases: [{ case: 1, name: "Invert Test", input: "{ a: '1', b: '2' }", testCall: "JSON.stringify(invertObject({ a: '1', b: '2' }))", expectedOutput: "{\"1\":\"a\",\"2\":\"b\"}" }],
      referenceSolution: `function invertObject(obj) { const res = {}; for (const [k, v] of Object.entries(obj)) res[v] = k; return res; }`
    },
    // 3 Medium
    {
      id: 'js-med-1',
      skill: 'JavaScript',
      difficulty: 'medium',
      subTopic: 'Async & Timing',
      title: 'Debounce Function Implementation',
      description: 'Write a function `debounce(fn, delay)` that returns a debounced version of `fn`.',
      hint: 'Use clearTimeout and setTimeout to delay function execution.',
      starterCode: `function debounce(fn, delay) {\n    let timer;\n    return function(...args) {\n        clearTimeout(timer);\n        timer = setTimeout(() => fn.apply(this, args), delay);\n    };\n}`,
      testCases: [{ case: 1, name: "Debounce Structure Test", input: "fn, 100", testCall: "typeof debounce(() => {}, 100)", expectedOutput: "function" }],
      referenceSolution: `function debounce(fn, delay) { let timer; return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); }; }`
    },
    {
      id: 'js-med-2',
      skill: 'JavaScript',
      difficulty: 'medium',
      subTopic: 'Deep Clone',
      title: 'Deep Object Clone',
      description: 'Write a function `deepClone(obj)` that deeply clones nested objects and arrays without mutating the original.',
      hint: 'Handle primitives, arrays, and objects recursively.',
      starterCode: `function deepClone(obj) {\n    if (obj === null || typeof obj !== 'object') return obj;\n    if (Array.isArray(obj)) return obj.map(deepClone);\n    const copy = {};\n    for (const k in obj) copy[k] = deepClone(obj[k]);\n    return copy;\n}`,
      testCases: [{ case: 1, name: "Nested Clone Test", input: "{ a: { b: 2 } }", testCall: "const o = { a: { b: 2 } }; const c = deepClone(o); c.a.b = 99; o.a.b", expectedOutput: "2" }],
      referenceSolution: `function deepClone(obj) { if (obj === null || typeof obj !== 'object') return obj; if (Array.isArray(obj)) return obj.map(deepClone); const copy = {}; for (const k in obj) copy[k] = deepClone(obj[k]); return copy; }`
    },
    {
      id: 'js-med-3',
      skill: 'JavaScript',
      difficulty: 'medium',
      subTopic: 'Functional Programming',
      title: 'Function Currying Engine',
      description: 'Write a function `curry(fn)` that transforms a multi-argument function into a curryable sequence of single-argument calls.',
      hint: 'Compare args.length with fn.length.',
      starterCode: `function curry(fn) {\n    return function curried(...args) {\n        if (args.length >= fn.length) return fn.apply(this, args);\n        return (...nextArgs) => curried.apply(this, args.concat(nextArgs));\n    };\n}`,
      testCases: [{ case: 1, name: "Curry Add Test", input: "add(a,b,c)", testCall: "const add = (a, b, c) => a + b + c; curry(add)(1)(2)(3)", expectedOutput: "6" }],
      referenceSolution: `function curry(fn) { return function curried(...args) { if (args.length >= fn.length) return fn.apply(this, args); return (...nextArgs) => curried.apply(this, args.concat(nextArgs)); }; }`
    },
    // 3 Hard
    {
      id: 'js-hard-1',
      skill: 'JavaScript',
      difficulty: 'hard',
      subTopic: 'Promises & Concurrency',
      title: 'Promise Concurrency Pool (pLimit)',
      description: 'Write a function `promisePool(functions, limit)` that executes an array of async functions with a maximum concurrency of `limit` and returns all resolved values in order.',
      hint: 'Track running count and index pointers with Promise.all.',
      starterCode: `async function promisePool(functions, limit) {\n    const results = [];\n    let index = 0;\n    async function worker() {\n        while (index < functions.length) {\n            const curr = index++;\n            results[curr] = await functions[curr]();\n        }\n    }\n    const workers = Array.from({ length: Math.min(limit, functions.length) }, worker);\n    await Promise.all(workers);\n    return results;\n}`,
      testCases: [{ case: 1, name: "Pool Resolution Test", input: "3 tasks, limit 2", testCall: "typeof promisePool", expectedOutput: "function" }],
      referenceSolution: `async function promisePool(functions, limit) { const results = []; let index = 0; async function worker() { while (index < functions.length) { const curr = index++; results[curr] = await functions[curr](); } } await Promise.all(Array.from({ length: Math.min(limit, functions.length) }, worker)); return results; }`
    },
    {
      id: 'js-hard-2',
      skill: 'JavaScript',
      difficulty: 'hard',
      subTopic: 'Virtual DOM & Diffing',
      title: 'Minimal DOM Tree Diff Algorithm',
      description: 'Write a function `diffNodes(oldTree, newTree)` that returns a minimal patch describing additions, removals, and attribute mutations between two virtual nodes.',
      hint: 'Compare node types, keys, and recursive children.',
      starterCode: `function diffNodes(oldNode, newNode) {\n    if (!oldNode) return { type: 'CREATE', node: newNode };\n    if (!newNode) return { type: 'REMOVE' };\n    if (oldNode.tag !== newNode.tag) return { type: 'REPLACE', node: newNode };\n    return { type: 'UPDATE', node: newNode };\n}`,
      testCases: [{ case: 1, name: "Diff Structure Test", input: "old, new", testCall: "diffNodes({ tag: 'div' }, { tag: 'span' }).type", expectedOutput: "REPLACE" }],
      referenceSolution: `function diffNodes(oldNode, newNode) { if (!oldNode) return { type: 'CREATE', node: newNode }; if (!newNode) return { type: 'REMOVE' }; if (oldNode.tag !== newNode.tag) return { type: 'REPLACE', node: newNode }; return { type: 'UPDATE', node: newNode }; }`
    },
    {
      id: 'js-hard-3',
      skill: 'JavaScript',
      difficulty: 'hard',
      subTopic: 'Divide & Conquer · Merge Sort',
      title: 'Merge Sort a Large Array',
      description: 'Write `mergeSort(nums)` that returns a new array sorted non-decreasing using split, recursive sort, and merge. Do not use `.sort()`. The 16-element starter is built so Visualize My Code can show a full 4-level split/merge tree.',
      hint: 'Base case: length <= 1. Split at mid, recurse, then two-pointer merge into a new array.',
      starterCode: `function merge(left, right) {
  const merged = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      merged.push(left[i]);
      i += 1;
    } else {
      merged.push(right[j]);
      j += 1;
    }
  }
  while (i < left.length) {
    merged.push(left[i]);
    i += 1;
  }
  while (j < right.length) {
    merged.push(right[j]);
    j += 1;
  }
  return merged;
}

function mergeSort(nums) {
  if (!nums || nums.length <= 1) return nums ? nums.slice() : [];
  const mid = Math.floor(nums.length / 2);
  const left = mergeSort(nums.slice(0, mid));
  const right = mergeSort(nums.slice(mid));
  return merge(left, right);
}

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25]));`,
      testCases: [
        { case: 1, name: '16-element visualization array', input: '[38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25]', testCall: 'JSON.stringify(mergeSort([38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25]))', expectedOutput: '[1,3,4,7,9,10,14,19,25,27,38,43,50,62,82,91]' },
        { case: 2, name: 'Duplicates and negatives', input: '[5, -1, 5, 0, 12, -1, 8, 3]', testCall: 'JSON.stringify(mergeSort([5, -1, 5, 0, 12, -1, 8, 3]))', expectedOutput: '[-1,-1,0,3,5,5,8,12]' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'JSON.stringify(mergeSort([]))', expectedOutput: '[]' }
      ],
      referenceSolution: `function merge(left, right) {
  const merged = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) merged.push(left[i++]);
    else merged.push(right[j++]);
  }
  return merged.concat(left.slice(i), right.slice(j));
}
function mergeSort(nums) {
  if (!nums || nums.length <= 1) return nums ? nums.slice() : [];
  const mid = Math.floor(nums.length / 2);
  return merge(mergeSort(nums.slice(0, mid)), mergeSort(nums.slice(mid)));
}`
    }
  ],
  git: [
    {
      id: 'git-easy-1',
      skill: 'Git',
      difficulty: 'easy',
      subTopic: 'Branch naming rules',
      title: 'Validate a Git branch name',
      description: 'Write a function `isValidBranchName(name)` that takes a string and returns true if it is a valid Git branch name. A valid name is not empty, has no spaces, does not contain `..`, and does not start with `-` or `/`.',
      hint: 'Reject empty strings first, then check the three illegal patterns.',
      starterCode: `function isValidBranchName(name) {\n  // return true if name is a valid Git branch\n}`,
      testCases: [
        { case: 1, name: 'Feature branch', input: 'feature/login', testCall: 'isValidBranchName("feature/login")', expectedOutput: 'true' },
        { case: 2, name: 'Empty name', input: '', testCall: 'isValidBranchName("")', expectedOutput: 'false' },
        { case: 3, name: 'Starts with dash', input: '-hotfix', testCall: 'isValidBranchName("-hotfix")', expectedOutput: 'false' }
      ],
      referenceSolution: `function isValidBranchName(name) {\n  if (!name || typeof name !== 'string') return false;\n  if (name.includes(' ') || name.includes('..')) return false;\n  if (name.startsWith('-') || name.startsWith('/')) return false;\n  return true;\n}`
    },
    {
      id: 'git-easy-2',
      skill: 'Git',
      difficulty: 'easy',
      subTopic: 'Short status codes',
      title: 'Parse git status --short',
      description: 'Write a function `parseShortStatus(line)` that takes one porcelain status line such as `"M  src/app.js"` and returns `{ code, path }`. `code` is the first two characters trimmed of spaces (use the XY letters only), `path` is the remainder trimmed. Empty line returns `{ code: "", path: "" }`.',
      hint: 'Take the first two characters as the code, then slice the rest as the path.',
      starterCode: `function parseShortStatus(line) {\n  // return { code, path }\n}`,
      testCases: [
        { case: 1, name: 'Modified file', input: 'M  src/app.js', testCall: 'parseShortStatus("M  src/app.js")', expectedOutput: '{"code":"M","path":"src/app.js"}' },
        { case: 2, name: 'Untracked file', input: '?? notes.txt', testCall: 'parseShortStatus("?? notes.txt")', expectedOutput: '{"code":"??","path":"notes.txt"}' },
        { case: 3, name: 'Empty line', input: '', testCall: 'parseShortStatus("")', expectedOutput: '{"code":"","path":""}' }
      ],
      referenceSolution: `function parseShortStatus(line) {\n  if (!line) return { code: '', path: '' };\n  const code = line.slice(0, 2).replace(/ /g, '');\n  const path = line.slice(2).trim();\n  return { code, path };\n}`
    },
    {
      id: 'git-easy-3',
      skill: 'Git',
      difficulty: 'easy',
      subTopic: 'gitignore matching',
      title: 'Match a simple gitignore rule',
      description: 'Write a function `isIgnored(filePath, pattern)` that returns true if `filePath` matches a simple gitignore `pattern`. Support exact names and a trailing `*` wildcard (e.g. `*.log` matches `error.log`). Empty pattern never matches.',
      hint: 'If the pattern ends with *, compare the suffix. Otherwise require an exact match.',
      starterCode: `function isIgnored(filePath, pattern) {\n  // return true if the path should be ignored\n}`,
      testCases: [
        { case: 1, name: 'Log wildcard', input: 'error.log / *.log', testCall: 'isIgnored("error.log", "*.log")', expectedOutput: 'true' },
        { case: 2, name: 'Exact node_modules', input: 'node_modules / node_modules', testCall: 'isIgnored("node_modules", "node_modules")', expectedOutput: 'true' },
        { case: 3, name: 'Empty pattern', input: 'app.js / ""', testCall: 'isIgnored("app.js", "")', expectedOutput: 'false' }
      ],
      referenceSolution: `function isIgnored(filePath, pattern) {\n  if (!pattern) return false;\n  if (pattern.endsWith('*')) return filePath.endsWith(pattern.slice(0, -1).replace(/^\\*/, '')) || filePath.endsWith(pattern.slice(1));\n  return filePath === pattern || filePath.endsWith('/' + pattern);\n}`
    },
    {
      id: 'git-med-1',
      skill: 'Git',
      difficulty: 'medium',
      subTopic: 'Merge conflict files',
      title: 'List files with conflict markers',
      description: 'Write a function `conflictedFiles(entries)` that takes an array of `{ file, content }` objects and returns the file names whose content contains `<<<<<<<`. Empty array returns `[]`.',
      hint: 'Filter entries whose content includes the start conflict marker.',
      starterCode: `function conflictedFiles(entries) {\n  // return file names that still have conflict markers\n}`,
      testCases: [
        { case: 1, name: 'One conflict', input: 'app.js conflicted', testCall: 'conflictedFiles([{file:"app.js",content:"<<<<<<< HEAD\\nx\\n>>>>>>> main"},{file:"ok.js",content:"const x=1"}])', expectedOutput: '["app.js"]' },
        { case: 2, name: 'No conflicts', input: 'clean files', testCall: 'conflictedFiles([{file:"a.js",content:"ok"}])', expectedOutput: '[]' },
        { case: 3, name: 'Empty list', input: '[]', testCall: 'conflictedFiles([])', expectedOutput: '[]' }
      ],
      referenceSolution: `function conflictedFiles(entries) {\n  return (entries || []).filter(e => String(e.content || '').includes('<<<<<<<')).map(e => e.file);\n}`
    },
    {
      id: 'git-med-2',
      skill: 'Git',
      difficulty: 'medium',
      subTopic: 'Conventional commits',
      title: 'Parse a conventional commit',
      description: 'Write a function `parseCommit(message)` that reads a first line like `feat(auth): add login` and returns `{ type, scope, subject }`. If there is no scope, `scope` is `null`. Empty message returns `{ type: "", scope: null, subject: "" }`.',
      hint: 'Use a regex like type(scope)?: subject',
      starterCode: `function parseCommit(message) {\n  // return { type, scope, subject }\n}`,
      testCases: [
        { case: 1, name: 'Feat with scope', input: 'feat(auth): add login', testCall: 'parseCommit("feat(auth): add login")', expectedOutput: '{"type":"feat","scope":"auth","subject":"add login"}' },
        { case: 2, name: 'Fix without scope', input: 'fix: null check', testCall: 'parseCommit("fix: null check")', expectedOutput: '{"type":"fix","scope":null,"subject":"null check"}' },
        { case: 3, name: 'Empty message', input: '', testCall: 'parseCommit("")', expectedOutput: '{"type":"","scope":null,"subject":""}' }
      ],
      referenceSolution: `function parseCommit(message) {\n  if (!message) return { type: '', scope: null, subject: '' };\n  const m = String(message).trim().match(/^([a-zA-Z]+)(?:\\(([a-zA-Z0-9_-]+)\\))?:\\s*(.+)$/);\n  if (!m) return { type: '', scope: null, subject: String(message).trim() };\n  return { type: m[1], scope: m[2] || null, subject: m[3] };\n}`
    },
    {
      id: 'git-med-3',
      skill: 'Git',
      difficulty: 'medium',
      subTopic: 'Diff --stat parsing',
      title: 'Parse a git diff --stat line',
      description: 'Write a function `parseDiffStat(line)` that turns `"src/app.js | 12 ++++----"` into `{ file, changes }` where `changes` is the integer before the plus/minus bars. A blank line returns `{ file: "", changes: 0 }`.',
      hint: 'Split on `|` and parse the first number in the right side.',
      starterCode: `function parseDiffStat(line) {\n  // return { file, changes }\n}`,
      testCases: [
        { case: 1, name: 'Normal stat', input: 'src/app.js | 12 ++++----', testCall: 'parseDiffStat("src/app.js | 12 ++++----")', expectedOutput: '{"file":"src/app.js","changes":12}' },
        { case: 2, name: 'Readme only plus', input: 'README.md | 3 +++', testCall: 'parseDiffStat("README.md | 3 +++")', expectedOutput: '{"file":"README.md","changes":3}' },
        { case: 3, name: 'Blank line', input: '', testCall: 'parseDiffStat("")', expectedOutput: '{"file":"","changes":0}' }
      ],
      referenceSolution: `function parseDiffStat(line) {\n  if (!line || !line.includes('|')) return { file: '', changes: 0 };\n  const [left, right] = line.split('|');\n  const n = parseInt(String(right).trim(), 10);\n  return { file: left.trim(), changes: Number.isFinite(n) ? n : 0 };\n}`
    },
    {
      id: 'git-hard-1',
      skill: 'Git',
      difficulty: 'hard',
      subTopic: 'Ours vs theirs resolve',
      title: 'Resolve a conflict hunk',
      description: 'Write a function `resolveConflict(text, side)` that replaces a `<<<<<<<` / `=======` / `>>>>>>>` hunk. If `side` is `"ours"` keep the first block; if `"theirs"` keep the second. If there is no marker, return the text unchanged. Empty text returns `""`.',
      hint: 'Split on the three markers and pick the block that matches side.',
      starterCode: `function resolveConflict(text, side) {\n  // return the resolved file text\n}`,
      testCases: [
        { case: 1, name: 'Keep ours', input: 'conflict ours', testCall: 'resolveConflict("a\\n<<<<<<< HEAD\\nOURS\\n=======\\nTHEIRS\\n>>>>>>> main\\nb", "ours")', expectedOutput: '"a\\nOURS\\nb"' },
        { case: 2, name: 'Keep theirs', input: 'conflict theirs', testCall: 'resolveConflict("<<<<<<< HEAD\\nOURS\\n=======\\nTHEIRS\\n>>>>>>> main", "theirs")', expectedOutput: '"THEIRS"' },
        { case: 3, name: 'Empty text', input: '', testCall: 'resolveConflict("", "ours")', expectedOutput: '""' }
      ],
      referenceSolution: `function resolveConflict(text, side) {\n  if (!text) return '';\n  if (!text.includes('<<<<<<<')) return text;\n  return text.replace(/<<<<<<<[^\\n]*\\n([\\s\\S]*?)=======\\n([\\s\\S]*?)>>>>>>>[^\\n]*/g, (_, ours, theirs) => (side === 'theirs' ? theirs : ours).replace(/\\n$/, ''));\n}`
    },
    {
      id: 'git-hard-2',
      skill: 'Git',
      difficulty: 'hard',
      subTopic: 'Reflog action parsing',
      title: 'Read the action from a reflog line',
      description: 'Write a function `reflogAction(line)` that reads a line like `abc123 HEAD@{0}: commit: fix login` and returns the action word after the colon (`commit`). If the line has no action, return `""`.',
      hint: 'Split on `: ` and take the first word of the second piece.',
      starterCode: `function reflogAction(line) {\n  // return commit | checkout | reset | ""\n}`,
      testCases: [
        { case: 1, name: 'Commit entry', input: 'abc123 HEAD@{0}: commit: fix login', testCall: 'reflogAction("abc123 HEAD@{0}: commit: fix login")', expectedOutput: '"commit"' },
        { case: 2, name: 'Checkout entry', input: 'def456 HEAD@{1}: checkout: moving from main to feat', testCall: 'reflogAction("def456 HEAD@{1}: checkout: moving from main to feat")', expectedOutput: '"checkout"' },
        { case: 3, name: 'Empty line', input: '', testCall: 'reflogAction("")', expectedOutput: '""' }
      ],
      referenceSolution: `function reflogAction(line) {\n  if (!line || !line.includes(': ')) return '';\n  const after = line.split(': ').slice(1)[0] || '';\n  return after.split(/\\s+/)[0] || '';\n}`
    },
    {
      id: 'git-hard-3',
      skill: 'Git',
      difficulty: 'hard',
      subTopic: 'Commit ancestry',
      title: 'Is this commit an ancestor?',
      description: 'Write a function `isAncestor(parents, ancestor, commit)` where `parents` is an object mapping a commit id to its parent id or `null`. Return true if `ancestor` appears while walking parents from `commit`. A missing commit or empty map returns false. A commit is an ancestor of itself.',
      hint: 'Walk parent pointers until you hit null or the ancestor.',
      starterCode: `function isAncestor(parents, ancestor, commit) {\n  // walk parents[commit] until null\n}`,
      testCases: [
        { case: 1, name: 'Direct parent', input: 'c2 -> c1', testCall: 'isAncestor({c2:"c1",c1:null}, "c1", "c2")', expectedOutput: 'true' },
        { case: 2, name: 'Same commit', input: 'c1 of c1', testCall: 'isAncestor({c1:null}, "c1", "c1")', expectedOutput: 'true' },
        { case: 3, name: 'Empty graph', input: '{}', testCall: 'isAncestor({}, "a", "b")', expectedOutput: 'false' }
      ],
      referenceSolution: `function isAncestor(parents, ancestor, commit) {\n  if (!parents || !commit) return false;\n  let cur = commit;\n  const seen = new Set();\n  while (cur && !seen.has(cur)) {\n    if (cur === ancestor) return true;\n    seen.add(cur);\n    cur = parents[cur];\n  }\n  return false;\n}`
    }
  ]
};

CURATED_PROBLEMS_BY_SKILL.c = LANG_PACKS.c;
CURATED_PROBLEMS_BY_SKILL.cpp = LANG_PACKS.cpp;
CURATED_PROBLEMS_BY_SKILL.java = LANG_PACKS.java;

// ==========================================
// HELPER: BUILD 9-PACK FOR ANY SKILL
// ==========================================
const PROBLEM_PACK_CACHE = new Map();
const PROBLEM_MODELS = [...new Set([
  process.env.AI_MODEL,
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b'
].filter(Boolean))];

function curatedPackFor(normSkill) {
  if (CURATED_PROBLEMS_BY_SKILL[normSkill]) return CURATED_PROBLEMS_BY_SKILL[normSkill];
  const aliases = {
    js: 'javascript', node: 'javascript', nodejs: 'javascript',
    py: 'python', python3: 'python', gitops: 'git',
    dsa: 'python', algorithms: 'python',
    c: 'c', clang: 'c', cpp: 'cpp', 'c++': 'cpp', cplusplus: 'cpp', java: 'java'
  };
  if (aliases[normSkill] && CURATED_PROBLEMS_BY_SKILL[aliases[normSkill]]) {
    return CURATED_PROBLEMS_BY_SKILL[aliases[normSkill]];
  }
  for (const key of Object.keys(CURATED_PROBLEMS_BY_SKILL)) {
    if (key.length >= 4 && (normSkill === key || normSkill.startsWith(key + ' ') || normSkill.includes(' ' + key))) {
      return CURATED_PROBLEMS_BY_SKILL[key];
    }
  }
  return null;
}

async function groqJsonObject(messages, timeoutMs = 25000) {
  let lastErr = null;
  for (const model of PROBLEM_MODELS) {
    for (const useFormat of [true, false]) {
      try {
        const body = { model, messages, temperature: 0.35 };
        if (useFormat) body.response_format = { type: 'json_object' };
        const completion = await axios.post('https://api.groq.com/openai/v1/chat/completions', body, {
          headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          timeout: timeoutMs
        });
        const raw = completion.data.choices?.[0]?.message?.content || '{}';
        const cleaned = String(raw).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        lastErr = e;
        const detail = e.response?.data?.error?.message || e.message;
        console.warn(`[Problems API] Groq ${model} json=${useFormat} failed: ${detail}`);
        if (e.response?.status === 429) break;
      }
    }
  }
  throw lastErr || new Error('Groq JSON generation failed');
}

function normalizeCodingLang(value) {
  const s = String(value || '').toLowerCase().trim();
  if (s === 'c++' || s === 'cpp' || s === 'cplusplus') return 'cpp';
  if (s === 'c' || s === 'clang') return 'c';
  if (s === 'js' || s === 'javascript') return 'javascript';
  if (s === 'python' || s === 'py' || s === 'python3') return 'python';
  if (s === 'java') return 'java';
  return '';
}

function packForCodingLang(lang, skillName) {
  const n = normalizeCodingLang(lang);
  if (!n) return null;
  if (n === 'javascript') {
    const skill = String(skillName || '').toLowerCase();
    if (skill.includes('git')) return CURATED_PROBLEMS_BY_SKILL.git;
    return CURATED_PROBLEMS_BY_SKILL.javascript;
  }
  return CURATED_PROBLEMS_BY_SKILL[n] || null;
}

function isDsaSkill(name) {
  return /\b(dsa|data.?struct|algorithm|sorting)\b/i.test(String(name || ''));
}

function mergeSortProblemForLang(lang, skillName) {
  const skill = skillName || 'DSA';
  if (lang === 'javascript') {
    const base = (CURATED_PROBLEMS_BY_SKILL.javascript || []).find((p) => p.id === 'js-hard-3');
    return base ? Object.assign({}, base, { skill, id: 'dsa-hard-mergesort' }) : null;
  }
  if (lang === 'java') {
    return {
      id: 'dsa-hard-mergesort',
      skill,
      difficulty: 'hard',
      subTopic: 'Divide & Conquer · Merge Sort',
      title: 'Merge Sort a Large Array',
      description: 'Write `mergeSort(nums)` that returns a new array sorted non-decreasing using split, recursive sort, and merge. Do not use `Arrays.sort`. The 16-element starter is built so Visualize My Code can show a full 4-level split/merge tree.',
      hint: 'If length <= 1 return nums. Split at mid, recurse, then two-pointer merge.',
      starterCode: `public class Solution {
    public static int[] merge(int[] left, int[] right) {
        int[] merged = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) merged[k++] = left[i++];
            else merged[k++] = right[j++];
        }
        while (i < left.length) merged[k++] = left[i++];
        while (j < right.length) merged[k++] = right[j++];
        return merged;
    }

    public static int[] mergeSort(int[] nums) {
        if (nums == null || nums.length <= 1) return nums;
        int mid = nums.length / 2;
        int[] left = new int[mid];
        int[] right = new int[nums.length - mid];
        for (int i = 0; i < mid; i++) left[i] = nums[i];
        for (int i = mid; i < nums.length; i++) right[i - mid] = nums[i];
        return merge(mergeSort(left), mergeSort(right));
    }
}`,
      testCases: [
        { case: 1, name: '16-element visualization array', input: '[38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25]', testCall: 'mergeSort(new int[]{38, 27, 43, 3, 9, 82, 10, 19, 50, 1, 62, 14, 7, 91, 4, 25})', expectedOutput: '[1, 3, 4, 7, 9, 10, 14, 19, 25, 27, 38, 43, 50, 62, 82, 91]' },
        { case: 2, name: 'Duplicates and negatives', input: '[5, -1, 5, 0, 12, -1, 8, 3]', testCall: 'mergeSort(new int[]{5, -1, 5, 0, 12, -1, 8, 3})', expectedOutput: '[-1, -1, 0, 3, 5, 5, 8, 12]' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'mergeSort(new int[]{})', expectedOutput: '[]' }
      ],
      referenceSolution: `public class Solution {
    public static int[] mergeSort(int[] nums) {
        if (nums == null || nums.length <= 1) return nums;
        int mid = nums.length / 2;
        int[] left = new int[mid];
        int[] right = new int[nums.length - mid];
        for (int i = 0; i < mid; i++) left[i] = nums[i];
        for (int i = mid; i < nums.length; i++) right[i - mid] = nums[i];
        return merge(mergeSort(left), mergeSort(right));
    }
    public static int[] merge(int[] left, int[] right) {
        int[] merged = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) merged[k++] = left[i++];
            else merged[k++] = right[j++];
        }
        while (i < left.length) merged[k++] = left[i++];
        while (j < right.length) merged[k++] = right[j++];
        return merged;
    }
}`
    };
  }
  const base = (CURATED_PROBLEMS_BY_SKILL.python || []).find((p) => p.id === 'py-hard-3');
  return base ? Object.assign({}, base, { skill, id: lang === 'python' ? 'py-hard-3' : 'dsa-hard-mergesort' }) : null;
}

function injectMergeSortForDsa(pack, lang, skillName) {
  if (!Array.isArray(pack)) return pack;
  const pinLang = ['python', 'javascript', 'java'].includes(String(lang || '').toLowerCase());
  if (!isDsaSkill(skillName) && !pinLang) return pack;
  const ms = mergeSortProblemForLang(lang || 'python', skillName);
  if (!ms) return pack;
  const next = pack.filter((p) => {
    const id = String(p.id || '');
    const title = String(p.title || '').toLowerCase();
    return id !== 'py-hard-3' && id !== 'js-hard-3' && id !== 'dsa-hard-mergesort'
      && !title.includes('merge sort a large array');
  });
  const hardIdx = next.findIndex((p) => String(p.difficulty || '').toLowerCase() === 'hard');
  if (hardIdx >= 0) next.splice(hardIdx, 0, ms);
  else next.push(ms);
  if (next.length > 9) {
    for (let i = next.length - 1; i >= 0 && next.length > 9; i--) {
      const p = next[i];
      if (String(p.difficulty || '').toLowerCase() !== 'hard') continue;
      if (p.id === ms.id || String(p.title || '') === ms.title) continue;
      next.splice(i, 1);
    }
  }
  return next;
}

async function get9PackForSkill(skillName, langName) {
  const normSkill = (skillName || 'Python').trim().toLowerCase();
  const normLang = normalizeCodingLang(langName) || normalizeCodingLang(normSkill);
  const cacheKey = `${normLang || 'auto'}::${normSkill}`;
  if (PROBLEM_PACK_CACHE.has(cacheKey)) return PROBLEM_PACK_CACHE.get(cacheKey);

  const langPack = packForCodingLang(normLang, skillName);
  if (langPack) {
    const pack = injectMergeSortForDsa(langPack, normLang, skillName);
    PROBLEM_PACK_CACHE.set(cacheKey, pack);
    return pack;
  }

  const curated = curatedPackFor(normSkill);
  if (curated) {
    const pack = injectMergeSortForDsa(curated, normLang || 'python', skillName);
    PROBLEM_PACK_CACHE.set(cacheKey, pack);
    return pack;
  }

  const isPythonic = normSkill.includes('data') || normSkill.includes('machine') || normSkill.includes('deep') || normSkill.includes('ai') || normSkill.includes('backend') || normSkill.includes('python');

  if (GROQ_API_KEY) {
    try {
      const prompt = `You are a senior curriculum designer creating coding practice problems for the skill "${skillName}", written in ${isPythonic ? 'Python' : 'JavaScript'}.

Generate exactly 9 ORIGINAL problems (not copied from LeetCode/HackerRank/any known source) across 3 difficulty tiers: 3 easy, 3 medium, 3 hard.

RULES (all mandatory):
1. All 9 problems must cover 9 DIFFERENT sub-topics within "${skillName}" — no two problems may test the same concept. List the sub-topic explicitly in "subTopic".
2. Difficulty must be real and progressive: easy = single concept, beginner-friendly; medium = combines 2 concepts or requires an edge case; hard = multi-step logic or a subtle trap a beginner would miss.
3. Every problem's "starterCode", "testCases[].testCall", and "referenceSolution" MUST use the exact same function name and parameter order — this is validated programmatically, so a mismatch breaks grading.
4. "testCases[].expectedOutput" must be the EXACT literal value the reference solution returns for that input — not a description. For Python, use Python literal syntax (e.g. {'a': 1}, [1, 2, 3], True). For JS, use JS literal syntax (e.g. {"a":1}, [1,2,3], true).
5. Include one edge-case test per problem (empty input, zero, negative number, or boundary value) in addition to the normal-case tests.
6. "description" must state the function name, input format, and output format explicitly — a beginner should never have to guess the expected shape.
7. "hint" must nudge toward the approach without revealing the full solution.
8. Avoid generic filler problems ("reverse a string", "check even/odd") unless "${skillName}" specifically requires that exact fundamental — prefer problems that test what someone using "${skillName}" on the job would actually need to know.
9. Prefer a named function (not only a class) so Hiero can visualize and grade the same entry point. IDs must be "${normSkill}-easy-1" style.

Return ONLY a valid JSON object, no markdown, no commentary, in this exact shape:
{
  "easy": [ { "id": "...", "skill": "${skillName}", "difficulty": "easy", "subTopic": "...", "title": "...", "description": "...", "hint": "...", "starterCode": "...", "testCases": [ { "case": 1, "name": "...", "input": "...", "testCall": "...", "expectedOutput": "..." } ], "referenceSolution": "..." }, ... (3 total) ],
  "medium": [ ... 3 total, same shape, "difficulty": "medium" ],
  "hard": [ ... 3 total, same shape, "difficulty": "hard" ]
}`;

      const parsed = await groqJsonObject([
        { role: 'system', content: 'You are a senior curriculum designer. Return valid JSON only. No markdown.' },
          { role: 'user', content: prompt }
      ]);

      if (parsed.easy?.length >= 3 && parsed.medium?.length >= 3 && parsed.hard?.length >= 3) {
        const fullList = [
          ...parsed.easy.slice(0, 3).map((p, idx) => ({ ...p, id: p.id || `${normSkill}-easy-${idx+1}`, difficulty: 'easy', skill: skillName })),
          ...parsed.medium.slice(0, 3).map((p, idx) => ({ ...p, id: p.id || `${normSkill}-med-${idx+1}`, difficulty: 'medium', skill: skillName })),
          ...parsed.hard.slice(0, 3).map((p, idx) => ({ ...p, id: p.id || `${normSkill}-hard-${idx+1}`, difficulty: 'hard', skill: skillName }))
        ];
        PROBLEM_PACK_CACHE.set(cacheKey, fullList);
        return fullList;
      }
    } catch (e) {
      console.warn(`[Problems API] Groq AI problem pack generation failed for ${skillName}:`, e.message);
    }
  }

  // 4. Guaranteed Deterministic Fallback 9-Pack (StarterCode + TestCases for any skill)
  const comment = isPythonic ? '#' : '//';
  const ext = isPythonic ? 'py' : 'js';

  return [
    // 3 Easy
    {
      id: `${normSkill}-easy-1`,
      skill: skillName,
      difficulty: 'easy',
      subTopic: `${skillName} Fundamentals`,
      title: `${skillName} Syntax & Structure Basics`,
      description: `Write a starter function \`solve_${normSkill}_basic(data)\` that validates and formats input items for ${skillName}.`,
      hint: `Check input types and handle null or empty values gracefully.`,
      starterCode: isPythonic ? `def solve_${normSkill.replace(/[^a-z0-9]/g, '_')}_basic(data):\n    # Return cleaned data list\n    return [x for x in data if x is not None]` : `function solve_${normSkill.replace(/[^a-z0-9]/g, '_')}_basic(data) {\n    return data.filter(x => x !== null && x !== undefined);\n}`,
      testCases: [{ case: 1, name: "Filter Valid Elements", input: "[1, None, 2, None]", testCall: `solve_${normSkill.replace(/[^a-z0-9]/g, '_')}_basic([1, None, 2, None])`, expectedOutput: "[1, 2]" }],
      referenceSolution: isPythonic ? `def solve_${normSkill.replace(/[^a-z0-9]/g, '_')}_basic(data):\n    return [x for x in data if x is not None]` : `function solve_${normSkill.replace(/[^a-z0-9]/g, '_')}_basic(data) { return data.filter(Boolean); }`
    },
    {
      id: `${normSkill}-easy-2`,
      skill: skillName,
      difficulty: 'easy',
      subTopic: `${skillName} Collections`,
      title: `${skillName} Aggregation & Statistics`,
      description: `Compute summary statistics (sum, min, max, average) for numerical ${skillName} metric feeds.`,
      hint: `Use built-in functions sum(), min(), max().`,
      starterCode: isPythonic ? `def compute_metrics(nums):\n    if not nums: return {}\n    return {'sum': sum(nums), 'min': min(nums), 'max': max(nums), 'avg': sum(nums)/len(nums)}` : `function compute_metrics(nums) {\n    if (!nums.length) return {};\n    const s = nums.reduce((a,b)=>a+b, 0);\n    return { sum: s, min: Math.min(...nums), max: Math.max(...nums), avg: s/nums.length };\n}`,
      testCases: [{ case: 1, name: "Positive Metrics Test", input: "[10, 20, 30]", testCall: `compute_metrics([10, 20, 30])`, expectedOutput: "{'sum': 60, 'min': 10, 'max': 30, 'avg': 20.0}" }],
      referenceSolution: isPythonic ? `def compute_metrics(nums):\n    return {'sum': sum(nums), 'min': min(nums), 'max': max(nums), 'avg': sum(nums)/len(nums)}` : `function compute_metrics(nums) { const s = nums.reduce((a,b)=>a+b,0); return { sum: s, min: Math.min(...nums), max: Math.max(...nums), avg: s/nums.length }; }`
    },
    {
      id: `${normSkill}-easy-3`,
      skill: skillName,
      difficulty: 'easy',
      subTopic: `${skillName} Validation`,
      title: `${skillName} Schema Validator`,
      description: `Validate that a payload dictionary contains required metadata fields for ${skillName} components.`,
      hint: `Check if all required keys are present in the target object.`,
      starterCode: isPythonic ? `def validate_schema(payload, required_keys=['id', 'name', 'status']):\n    return all(k in payload for k in required_keys)` : `function validate_schema(payload, requiredKeys = ['id', 'name', 'status']) {\n    return requiredKeys.every(k => k in payload);\n}`,
      testCases: [{ case: 1, name: "Valid Schema Check", input: "{ 'id': 1, 'name': 'node', 'status': 'ok' }", testCall: `validate_schema({'id': 1, 'name': 'node', 'status': 'ok'})`, expectedOutput: "True" }],
      referenceSolution: isPythonic ? `def validate_schema(payload, required_keys=['id', 'name', 'status']):\n    return all(k in payload for k in required_keys)` : `function validate_schema(p, keys = ['id', 'name', 'status']) { return keys.every(k => k in p); }`
    },

    // 3 Medium
    {
      id: `${normSkill}-med-1`,
      skill: skillName,
      difficulty: 'medium',
      subTopic: `${skillName} Pipelines`,
      title: `${skillName} Pipeline Batch Processor`,
      description: `Implement a batch transform worker for ${skillName} that groups data into batches of size N and executes transformation.`,
      hint: `Use chunking logic or generators to process streams efficiently.`,
      starterCode: isPythonic ? `def process_batches(items, batch_size=2):\n    return [items[i:i+batch_size] for i in range(0, len(items), batch_size)]` : `function process_batches(items, batchSize = 2) {\n    const b = [];\n    for (let i = 0; i < items.length; i += batchSize) b.push(items.slice(i, i + batchSize));\n    return b;\n}`,
      testCases: [{ case: 1, name: "Batching Even List", input: "[1,2,3,4], batch_size=2", testCall: `process_batches([1,2,3,4], 2)`, expectedOutput: "[[1, 2], [3, 4]]" }],
      referenceSolution: isPythonic ? `def process_batches(items, batch_size=2):\n    return [items[i:i+batch_size] for i in range(0, len(items), batch_size)]` : `function process_batches(items, s = 2) { const r = []; for(let i=0; i<items.length; i+=s) r.push(items.slice(i, i+s)); return r; }`
    },
    {
      id: `${normSkill}-med-2`,
      skill: skillName,
      difficulty: 'medium',
      subTopic: `${skillName} State & Cache`,
      title: `${skillName} State Synchronizer & Cache`,
      description: `Build a cached memoization wrapper for heavy ${skillName} operations to avoid recalculating results.`,
      hint: `Store arguments as cache keys in a dictionary or Map.`,
      starterCode: isPythonic ? `def create_memo_cache(fn):\n    cache = {}\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = fn(*args)\n        return cache[args]\n    return wrapper` : `function create_memo_cache(fn) {\n    const cache = new Map();\n    return function(...args) {\n        const key = JSON.stringify(args);\n        if (!cache.has(key)) cache.set(key, fn(...args));\n        return cache.get(key);\n    };\n}`,
      testCases: [{ case: 1, name: "Cache Hit Verification", input: "squared(4)", testCall: isPythonic ? "m = create_memo_cache(lambda x: x*x); [m(4), m(4)]" : "const m = create_memo_cache(x => x*x); [m(4), m(4)]", expectedOutput: "[16, 16]" }],
      referenceSolution: isPythonic ? `def create_memo_cache(fn):\n    cache = {}\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = fn(*args)\n        return cache[args]\n    return wrapper` : `function create_memo_cache(fn) { const c = new Map(); return (...a) => { const k = JSON.stringify(a); if(!c.has(k)) c.set(k, fn(...a)); return c.get(k); }; }`
    },
    {
      id: `${normSkill}-med-3`,
      skill: skillName,
      difficulty: 'medium',
      subTopic: `${skillName} Concurrency`,
      title: `${skillName} Event Dispatcher & Bus`,
      description: `Implement a lightweight event subscription broker that registers handlers and dispatches payloads.`,
      hint: `Use a dictionary mapping event names to lists of subscriber callbacks.`,
      starterCode: isPythonic ? `class EventBroker:\n    def __init__(self):\n        self.listeners = {}\n    def on(self, event, fn):\n        self.listeners.setdefault(event, []).append(fn)\n    def emit(self, event, data):\n        return [fn(data) for fn in self.listeners.get(event, [])]` : `class EventBroker {\n    constructor() { this.listeners = {}; }\n    on(e, fn) { (this.listeners[e] = this.listeners[e] || []).push(fn); }\n    emit(e, data) { return (this.listeners[e] || []).map(fn => fn(data)); }\n}`,
      testCases: [{ case: 1, name: "Event Emit Test", input: "on('ping', double), emit('ping', 5)", testCall: isPythonic ? "b = EventBroker(); b.on('p', lambda x: x*2); b.emit('p', 5)" : "const b = new EventBroker(); b.on('p', x => x*2); b.emit('p', 5)", expectedOutput: "[10]" }],
      referenceSolution: isPythonic ? `class EventBroker:\n    def __init__(self): self.listeners = {}\n    def on(self, e, fn): self.listeners.setdefault(e, []).append(fn)\n    def emit(self, e, data): return [fn(data) for fn in self.listeners.get(e, [])]` : `class EventBroker { constructor() { this.l = {}; } on(e, f) { (this.l[e] = this.l[e] || []).push(f); } emit(e, d) { return (this.l[e] || []).map(f => f(d)); } }`
    },

    // 3 Hard
    {
      id: `${normSkill}-hard-1`,
      skill: skillName,
      difficulty: 'hard',
      subTopic: `${skillName} Distributed Systems`,
      title: `Fault-Tolerant ${skillName} Circuit Breaker`,
      description: `Design a Circuit Breaker pattern with states 'CLOSED', 'OPEN', and 'HALF_OPEN' that trips after N consecutive errors.`,
      hint: `Track failure counts and timestamps to transition states automatically.`,
      starterCode: isPythonic ? `class CircuitBreaker:\n    def __init__(self, failure_threshold=3):\n        self.threshold = failure_threshold\n        self.failures = 0\n        self.state = 'CLOSED'\n    def record_failure(self):\n        self.failures += 1\n        if self.failures >= self.threshold:\n            self.state = 'OPEN'\n    def record_success(self):\n        self.failures = 0\n        self.state = 'CLOSED'` : `class CircuitBreaker {\n    constructor(threshold = 3) {\n        this.threshold = threshold;\n        this.failures = 0;\n        this.state = 'CLOSED';\n    }\n    recordFailure() {\n        this.failures++;\n        if (this.failures >= this.threshold) this.state = 'OPEN';\n    }\n    recordSuccess() {\n        this.failures = 0;\n        this.state = 'CLOSED';\n    }\n}`,
      testCases: [{ case: 1, name: "Trip Breaker State", input: "3 failures", testCall: isPythonic ? "cb = CircuitBreaker(2); cb.record_failure(); cb.record_failure(); cb.state" : "const cb = new CircuitBreaker(2); cb.recordFailure(); cb.recordFailure(); cb.state", expectedOutput: "'OPEN'" }],
      referenceSolution: isPythonic ? `class CircuitBreaker:\n    def __init__(self, failure_threshold=3):\n        self.threshold = failure_threshold\n        self.failures = 0\n        self.state = 'CLOSED'\n    def record_failure(self):\n        self.failures += 1\n        if self.failures >= self.threshold: self.state = 'OPEN'\n    def record_success(self):\n        self.failures = 0\n        self.state = 'CLOSED'` : `class CircuitBreaker { constructor(t=3) { this.t=t; this.f=0; this.state='CLOSED'; } recordFailure() { if(++this.f >= this.t) this.state='OPEN'; } recordSuccess() { this.f=0; this.state='CLOSED'; } }`
    },
    {
      id: `${normSkill}-hard-2`,
      skill: skillName,
      difficulty: 'hard',
      subTopic: `${skillName} Architecture`,
      title: `High-Throughput ${skillName} Rate Limiter`,
      description: `Implement sliding window rate limiting to enforce strict request budgets per minute for ${skillName} APIs.`,
      hint: `Remove timestamps older than the sliding window before counting current requests.`,
      starterCode: isPythonic ? `class SlidingRateLimiter:\n    def __init__(self, max_requests=5, window_sec=60):\n        self.max = max_requests\n        self.window = window_sec\n        self.timestamps = []\n    def allow(self, now):\n        self.timestamps = [t for t in self.timestamps if now - t < self.window]\n        if len(self.timestamps) < self.max:\n            self.timestamps.append(now)\n            return True\n        return False` : `class SlidingRateLimiter {\n    constructor(maxRequests = 5, windowSec = 60) {\n        this.max = maxRequests;\n        this.window = windowSec;\n        this.timestamps = [];\n    }\n    allow(now) {\n        this.timestamps = this.timestamps.filter(t => now - t < this.window);\n        if (this.timestamps.length < this.max) {\n            this.timestamps.push(now);\n            return true;\n        }\n        return false;\n    }\n}`,
      testCases: [{ case: 1, name: "Sliding Window Limit Test", input: "Limit 2: t=0, t=1, t=2", testCall: isPythonic ? "rl = SlidingRateLimiter(2, 10); [rl.allow(0), rl.allow(1), rl.allow(2)]" : "const rl = new SlidingRateLimiter(2, 10); [rl.allow(0), rl.allow(1), rl.allow(2)]", expectedOutput: "[True, True, False]" }],
      referenceSolution: isPythonic ? `class SlidingRateLimiter:\n    def __init__(self, max_requests=5, window_sec=60):\n        self.max = max_requests; self.window = window_sec; self.timestamps = []\n    def allow(self, now):\n        self.timestamps = [t for t in self.timestamps if now - t < self.window]\n        if len(self.timestamps) < self.max: self.timestamps.append(now); return True\n        return False` : `class SlidingRateLimiter { constructor(m=5, w=60) { this.max=m; this.window=w; this.ts=[]; } allow(now) { this.ts = this.ts.filter(t => now - t < this.window); if(this.ts.length < this.max) { this.ts.push(now); return true; } return false; } }`
    },
    {
      id: `${normSkill}-hard-3`,
      skill: skillName,
      difficulty: 'hard',
      subTopic: `${skillName} Engine & Optimization`,
      title: `Distributed Consensus & State Lock for ${skillName}`,
      description: `Implement a distributed lease lock manager with automatic expiration and ownership token verification.`,
      hint: `Store holder token and expiration timestamp; only release if token matches and lock is not expired.`,
      starterCode: isPythonic ? `class LeaseLock:\n    def __init__(self):\n        self.holder = None\n        self.expires_at = 0\n    def acquire(self, token, now, ttl=10):\n        if self.holder is None or now >= self.expires_at:\n            self.holder = token\n            self.expires_at = now + ttl\n            return True\n        return False\n    def release(self, token):\n        if self.holder == token:\n            self.holder = None\n            return True\n        return False` : `class LeaseLock {\n    constructor() { this.holder = null; this.expiresAt = 0; }\n    acquire(token, now, ttl = 10) {\n        if (!this.holder || now >= this.expiresAt) {\n            this.holder = token;\n            this.expiresAt = now + ttl;\n            return true;\n        }\n        return false;\n    }\n    release(token) {\n        if (this.holder === token) {\n            this.holder = null;\n            return true;\n        }\n        return false;\n    }\n}`,
      testCases: [{ case: 1, name: "Acquire and Release Lock", input: "acquire(A,0), acquire(B,2), release(A), acquire(B,3)", testCall: isPythonic ? "l = LeaseLock(); a1 = l.acquire('A', 0); a2 = l.acquire('B', 2); l.release('A'); a3 = l.acquire('B', 3); [a1, a2, a3]" : "const l = new LeaseLock(); const a1 = l.acquire('A', 0); const a2 = l.acquire('B', 2); l.release('A'); const a3 = l.acquire('B', 3); [a1, a2, a3]", expectedOutput: "[True, False, True]" }],
      referenceSolution: isPythonic ? `class LeaseLock:\n    def __init__(self): self.holder = None; self.expires_at = 0\n    def acquire(self, token, now, ttl=10):\n        if self.holder is None or now >= self.expires_at: self.holder = token; self.expires_at = now + ttl; return True\n        return False\n    def release(self, token):\n        if self.holder == token: self.holder = None; return True\n        return False` : `class LeaseLock { constructor() { this.holder = null; this.expiresAt = 0; } acquire(t, now, ttl=10) { if(!this.holder || now >= this.expiresAt) { this.holder = t; this.expiresAt = now + ttl; return true; } return false; } release(t) { if(this.holder === t) { this.holder = null; return true; } return false; } }`
    }
  ];
}

// Strip hidden reference solutions for public endpoints
function sanitizeProblemsForPublic(problemList) {
  return problemList.map(p => {
    const { referenceSolution, solution, ...safeProblem } = p;
    return safeProblem;
  });
}

// ==========================================
// ROUTES
// ==========================================

/**
 * 🎯 GET /api/problems/by-skill?skill=Python
 * Guaranteed to return exactly 9 problems (3 easy, 3 medium, 3 hard).
 * Never exposes the hidden reference answer.
 */
router.get('/by-skill', async (req, res) => {
  const skillQuery = req.query.skill || 'Python';
  const langQuery = req.query.lang || req.query.code || req.query.language || '';

  try {
    const allNine = await get9PackForSkill(skillQuery, langQuery);
    const sanitized = sanitizeProblemsForPublic(allNine);

    const easy = sanitized.filter(p => p.difficulty === 'easy').slice(0, 3);
    const medium = sanitized.filter(p => p.difficulty === 'medium').slice(0, 3);
    const hard = sanitized.filter(p => p.difficulty === 'hard').slice(0, 3);

    res.json({
      success: true,
      skill: skillQuery,
      count: sanitized.length,
      summary: {
        easy: easy.length,
        medium: medium.length,
        hard: hard.length,
        total: sanitized.length
      },
      problems: sanitized,
      grouped: {
        easy,
        medium,
        hard
      }
    });
  } catch (err) {
    console.error(`[Problems API] Error fetching 9-pack for ${skillQuery}:`, err);
    // Ultimate failsafe: return curated Python 9-pack
    const fallback = sanitizeProblemsForPublic(CURATED_PROBLEMS_BY_SKILL.python);
    res.json({
      success: true,
      skill: 'Python',
      count: 9,
      summary: { easy: 3, medium: 3, hard: 3, total: 9 },
      problems: fallback,
      grouped: {
        easy: fallback.filter(p => p.difficulty === 'easy'),
        medium: fallback.filter(p => p.difficulty === 'medium'),
        hard: fallback.filter(p => p.difficulty === 'hard')
      }
    });
  }
});

/**
 * 🎯 GET /api/problems (Filterable problem list)
 */
router.get('/', async (req, res) => {
  const { skill, difficulty } = req.query;

  if (skill) {
    const pack = await get9PackForSkill(skill);
    let filtered = sanitizeProblemsForPublic(pack);
    if (difficulty) {
      filtered = filtered.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
    }
    return res.json({
      success: true,
      skill,
      count: filtered.length,
      problems: filtered
    });
  }

  // If no skill specified, return default Python 9-pack
  const defaultPack = sanitizeProblemsForPublic(CURATED_PROBLEMS_BY_SKILL.python);
  res.json({
    success: true,
    count: defaultPack.length,
    problems: defaultPack
  });
});

/**
 * 🎯 GET /api/problems/:id (Get problem by ID)
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Search across all curated packs
  for (const pack of Object.values(CURATED_PROBLEMS_BY_SKILL)) {
    const found = pack.find(p => p.id === id || p.id.toLowerCase() === id.toLowerCase());
    if (found) {
      const sanitized = sanitizeProblemsForPublic([found])[0];
      return res.json({ success: true, problem: sanitized });
    }
  }

  // If not found in static packs, check fallback for python
  const pythonPack = CURATED_PROBLEMS_BY_SKILL.python;
  const foundPy = pythonPack.find(p => p.id.includes(id) || id.includes(p.id));
  if (foundPy) {
    return res.json({ success: true, problem: sanitizeProblemsForPublic([foundPy])[0] });
  }

  res.status(404).json({ success: false, message: `Problem with ID '${id}' not found.` });
});

// ==========================================
// EVALUATION ENGINE
// ==========================================

/**
 * Execute Python code against testCases safely in Python subprocess
 */
async function evaluatePythonCode(userCode, testCases) {
  const tempFileName = `py_eval_${crypto.randomBytes(4).toString('hex')}.py`;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);

  const testHarness = `
import sys
import json

# --- USER CODE START ---
${userCode}
# --- USER CODE END ---

test_cases = ${JSON.stringify(testCases || [])}
results = []

for idx, tc in enumerate(test_cases):
    c_num = tc.get('case', idx + 1)
    name = tc.get('name', f"Test Case {c_num}")
    call_expr = tc.get('testCall') or tc.get('input')
    expected_str = tc.get('expectedOutput', '')
    
    try:
        actual_val = eval(call_expr)
        
        # Format comparison
        actual_repr = repr(actual_val)
        actual_str = str(actual_val)
        
        # Check matching
        is_pass = False
        try:
            expected_eval = eval(expected_str)
            is_pass = (actual_val == expected_eval)
        except Exception:
            is_pass = (actual_repr == expected_str or actual_str == expected_str or expected_str in actual_str)
        
        results.append({
            "case": c_num,
            "name": name,
            "passed": bool(is_pass),
            "input": str(tc.get('input', '')),
            "expected": str(expected_str),
            "actual": actual_repr if actual_repr else actual_str,
            "error": None
        })
    except Exception as e:
        results.append({
            "case": c_num,
            "name": name,
            "passed": False,
            "input": str(tc.get('input', '')),
            "expected": str(expected_str),
            "actual": None,
            "error": str(e)
        })

print("__ORBIT_EVAL_JSON__" + json.dumps(results))
`;

  return new Promise((resolve) => {
    try {
      fs.writeFileSync(tempFilePath, testHarness, 'utf8');
      const proc = spawn('python3', [tempFilePath]);

      let stdout = '';
      let stderr = '';

      const timeout = setTimeout(() => {
        try { proc.kill(); } catch (e) {}
        resolve({ success: false, error: 'Execution timed out (10s limit)', testResults: [] });
      }, 10000);

      proc.on('error', (err) => {
        clearTimeout(timeout);
        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (e) {}
        resolve({
          success: false,
          score: 0,
          passed: false,
          error: err.code === 'ENOENT' ? 'Python 3 is not installed on this machine.' : err.message,
          testResults: []
        });
      });

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        clearTimeout(timeout);
        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (e) {}

        if (stdout.includes('__ORBIT_EVAL_JSON__')) {
          const jsonStr = stdout.split('__ORBIT_EVAL_JSON__')[1].trim();
          try {
            const results = JSON.parse(jsonStr);
            const passedCount = results.filter(r => r.passed).length;
            const totalCount = results.length;
            const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 10) : 0;
            return resolve({
              success: true,
              score,
              passed: score >= 8,
              passedTests: passedCount,
              totalTests: totalCount,
              testResults: results,
              rawOutput: stdout.split('__ORBIT_EVAL_JSON__')[0].trim()
            });
          } catch (e) {
            console.error('[Eval Engine] JSON parse failure:', e);
          }
        }

        // Subprocess exited with error
        resolve({
          success: false,
          score: 0,
          passed: false,
          passedTests: 0,
          totalTests: (testCases || []).length || 1,
          testResults: (testCases || []).map((tc, idx) => ({
            case: tc.case || idx + 1,
            name: tc.name || `Case ${idx + 1}`,
            passed: false,
            error: stderr.trim() || 'Execution runtime error'
          })),
          error: stderr.trim() || 'Code execution returned a non-zero exit code.'
        });
      });
    } catch (err) {
      resolve({ success: false, error: err.message, testResults: [] });
    }
  });
}

function expectedMatches(actual, expectedStr) {
  const expectedRaw = String(expectedStr ?? '').trim();
  if (expectedRaw === '') return actual === '' || actual == null;
  try {
    const expected = vm.runInNewContext(`(${expectedRaw})`, {}, { timeout: 200 });
    if (actual === expected) return true;
    if (typeof actual === 'object' || typeof expected === 'object') {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }
  } catch (_) {}
  if (String(actual) === expectedRaw) return true;
  try {
    return JSON.stringify(actual) === expectedRaw || JSON.stringify(actual) === JSON.stringify(JSON.parse(expectedRaw));
  } catch (_) {
    return false;
  }
}

function evaluateJavaScriptCode(userCode, testCases) {
  const cases = Array.isArray(testCases) ? testCases : [];
  const results = cases.map((tc, idx) => {
    const name = tc.name || `Case ${idx + 1}`;
    const caseNum = tc.case || idx + 1;
    try {
      const sandbox = { console: { log() {}, warn() {}, error() {} } };
      vm.createContext(sandbox);
      vm.runInContext(String(userCode || ''), sandbox, { timeout: 2000 });
      const actual = vm.runInContext(String(tc.testCall || ''), sandbox, { timeout: 2000 });
      const passed = expectedMatches(actual, tc.expectedOutput);
      let actualStr;
      try { actualStr = JSON.stringify(actual); } catch (_) { actualStr = String(actual); }
      return {
        case: caseNum,
        name,
        passed,
        input: tc.input || '',
        expected: tc.expectedOutput || '',
        actual: actualStr,
        error: passed ? null : 'Output did not match expected value'
      };
    } catch (err) {
      return {
        case: caseNum,
        name,
        passed: false,
        input: tc.input || '',
        expected: tc.expectedOutput || '',
        actual: null,
        error: err.message
      };
    }
  });
  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 10) : 0;
  return {
    success: true,
    score,
    passed: score >= 8,
    passedTests,
    totalTests,
    testResults: results
  };
}

/**
 * AI Code Grader Fallback using Groq LLM
 */
async function gradeWithAI(userCode, problem, testCases) {
  if (!GROQ_API_KEY) {
    return {
      score: 5,
      feedback: "Code submitted and analyzed. Ensure all edge cases and boundary conditions are handled."
    };
  }

  try {
    const prompt = `You are an automated code assessment grader.
Evaluate this student's solution to the following problem on a strict integer scale of 0 to 10 (where 0 is empty/completely broken, 10 is flawless).

Problem: ${problem.title || 'Coding Practice'}
Description: ${problem.description || ''}
Test Cases Required: ${JSON.stringify(testCases || [])}
Official Solution Reference: ${problem.referenceSolution || ''}

Student's Submitted Code:
\`\`\`
${userCode}
\`\`\`

Return strictly a JSON object with:
{
  "score": integer (0 to 10),
  "feedback": "1-2 sentence constructive review of their approach, syntax, and logic",
  "passedTests": integer (estimated passed test count),
  "totalTests": ${testCases?.length || 3}
}`;

    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are a code evaluator. Return strict JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 8000
    });

    const parsed = JSON.parse(res.data.choices?.[0]?.message?.content || '{}');
    const score = Math.max(0, Math.min(10, parseInt(parsed.score, 10) || 0));
    return {
      score,
      feedback: parsed.feedback || `Solution evaluated: ${score}/10.`,
      passedTests: parsed.passedTests || (score >= 7 ? 2 : (score >= 4 ? 1 : 0)),
      totalTests: parsed.totalTests || (testCases?.length || 3)
    };
  } catch (err) {
    console.warn('[Problems API] AI evaluation fallback failed:', err.message);
    return {
      score: 6,
      feedback: "Code submitted. Review the official answer to inspect optimal design patterns."
    };
  }
}

/**
 * 🎯 POST /api/problems/evaluate-solution
 *
 * Requirements:
 * 1. Scores 0–10 based on userSolution + problem testCases.
 * 2. Empty / blank answer = strictly 0 score.
 * 3. Hides official reference answer until after submit (returned NOW).
 */
router.post('/evaluate-solution', async (req, res) => {
  try {
  const { skill = 'Python', problemId, problemTitle, userSolution, language, testCases } = req.body;
  const codingLang = detectCodingLanguage(userSolution, language);

  // 1. Locate the Problem & Reference Solution
  const fullPack = await get9PackForSkill(skill, codingLang || language);
  let problem = null;

  if (problemId) {
    problem = fullPack.find(p => p.id === problemId || p.id.toLowerCase() === problemId.toLowerCase());
  }
  if (!problem && problemTitle) {
    problem = fullPack.find(p => p.title.toLowerCase().includes(problemTitle.toLowerCase()) || problemTitle.toLowerCase().includes(p.title.toLowerCase()));
  }
  if (!problem && problemId) {
    for (const pack of Object.values(CURATED_PROBLEMS_BY_SKILL)) {
      problem = pack.find(p => p.id === problemId || p.id.toLowerCase() === String(problemId).toLowerCase());
      if (problem) break;
    }
  }
  if (!problem) {
    problem = fullPack[0] || {
      id: problemId || 'py-easy-1',
      title: problemTitle || 'Coding Practice',
      testCases: testCases || [],
      referenceSolution: '# Solution reference\npass'
    };
  }

  const activeTestCases = (testCases && testCases.length > 0) ? testCases : (problem.testCases || []);
  const officialAnswer = problem.referenceSolution || problem.solution || "Official solution not available.";

  // 2. Strict Empty / Blank Code Check -> Score: 0
  if (!userSolution || !userSolution.trim()) {
    return res.json({
      success: true,
      score: 0,
      maxScore: 10,
      passed: false,
      passedTests: 0,
      totalTests: activeTestCases.length || 3,
      testResults: activeTestCases.map((tc, idx) => ({
        case: tc.case || idx + 1,
        name: tc.name || `Test ${idx + 1}`,
        passed: false,
        input: tc.input || '',
        expected: tc.expectedOutput || '',
        actual: 'No code submitted',
        error: 'Empty solution'
      })),
      feedback: 'Empty submission. Please write your code before submitting to receive a score.',
      officialAnswer: officialAnswer,
      referenceSolution: officialAnswer
    });
  }

  // 3. Execution-Based Evaluation
  const codeHint = String(userSolution || '');
  const looksLikeJs = /function\s|=>|const\s|let\s/.test(codeHint) && !/#include|public\s+class/.test(codeHint);
  const looksLikePy = /^\s*(def |import |class )/m.test(codeHint) && !/\bpublic\s+class\b/.test(codeHint);
  const isPython = codingLang === 'python' || language === 'python' || (!language && looksLikePy && !looksLikeJs) || (!language && !looksLikeJs && (skill.toLowerCase().includes('python') || skill.toLowerCase().includes('data') || skill.toLowerCase().includes('learning')));

  if (activeTestCases.length > 0 && (codingLang === 'c' || codingLang === 'cpp' || codingLang === 'java')) {
    let evalResult;
    if (codingLang === 'java') {
      try {
        evalResult = await evaluateCompiled('java', userSolution, activeTestCases);
        const javaBroken = (evalResult.testResults || []).some((r) => /Unable to locate a Java Runtime|javac is not installed|not found/i.test(String(r.error || '')));
        if (javaBroken) evalResult = evaluateTranspiled(userSolution, activeTestCases, evaluateJavaScriptCode);
      } catch (e) {
        evalResult = evaluateTranspiled(userSolution, activeTestCases, evaluateJavaScriptCode);
      }
    } else {
      evalResult = await evaluateCompiled(codingLang, userSolution, activeTestCases);
    }
    let feedback = '';
    if (evalResult.score === 10) feedback = 'Outstanding! All test cases passed with 100% accuracy.';
    else if (evalResult.score >= 7) feedback = `Good job! Passed ${evalResult.passedTests}/${evalResult.totalTests} tests. Check failing edge cases.`;
    else feedback = `Passed ${evalResult.passedTests}/${evalResult.totalTests} tests. Review the official answer below to fix logic gaps.`;
    return res.json({
      success: true,
      score: evalResult.score,
      maxScore: 10,
      passed: evalResult.passed,
      passedTests: evalResult.passedTests,
      totalTests: evalResult.totalTests,
      testResults: evalResult.testResults,
      feedback,
      officialAnswer: officialAnswer,
      referenceSolution: officialAnswer
    });
  }

  if (activeTestCases.length > 0 && (looksLikeJs || (!isPython && !looksLikePy))) {
    const evalResult = evaluateJavaScriptCode(userSolution, activeTestCases);
    let feedback = '';
    if (evalResult.score === 10) feedback = 'Outstanding! All test cases passed with 100% accuracy.';
    else if (evalResult.score >= 7) feedback = `Good job! Passed ${evalResult.passedTests}/${evalResult.totalTests} tests. Check failing edge cases.`;
    else feedback = `Passed ${evalResult.passedTests}/${evalResult.totalTests} tests. Review the official answer below to fix logic gaps.`;
    return res.json({
      success: true,
      score: evalResult.score,
      maxScore: 10,
      passed: evalResult.passed,
      passedTests: evalResult.passedTests,
      totalTests: evalResult.totalTests,
      testResults: evalResult.testResults,
      feedback,
      officialAnswer: officialAnswer,
      referenceSolution: officialAnswer
    });
  }

  if (isPython && activeTestCases.length > 0) {
    const evalResult = await evaluatePythonCode(userSolution, activeTestCases);

    if (evalResult.success) {
      let feedback = "";
      if (evalResult.score === 10) {
        feedback = "Outstanding! All test cases passed with 100% accuracy.";
      } else if (evalResult.score >= 7) {
        feedback = `Good job! Passed ${evalResult.passedTests}/${evalResult.totalTests} tests. Check failing edge cases.`;
      } else {
        feedback = `Passed ${evalResult.passedTests}/${evalResult.totalTests} tests. Review the official answer below to fix logic gaps.`;
      }

      return res.json({
        success: true,
        score: evalResult.score,
        maxScore: 10,
        passed: evalResult.score >= 8,
        passedTests: evalResult.passedTests,
        totalTests: evalResult.totalTests,
        testResults: evalResult.testResults,
        feedback,
        officialAnswer: officialAnswer,
        referenceSolution: officialAnswer
      });
    }
  }

  // 4. AI-Graded Evaluation (For syntax errors, non-Python languages, or abstract cases)
  const aiResult = await gradeWithAI(userSolution, problem, activeTestCases);

  const testResults = activeTestCases.map((tc, idx) => ({
    case: tc.case || idx + 1,
    name: tc.name || `Case ${idx + 1}`,
    passed: idx < (aiResult.passedTests || 0),
    input: tc.input || '',
    expected: tc.expectedOutput || '',
    actual: idx < (aiResult.passedTests || 0) ? tc.expectedOutput : 'Mismatch / logic error',
    error: null
  }));

  res.json({
    success: true,
    score: aiResult.score,
    maxScore: 10,
    passed: aiResult.score >= 8,
    passedTests: aiResult.passedTests || 0,
    totalTests: activeTestCases.length || 3,
    testResults,
    feedback: aiResult.feedback,
    officialAnswer: officialAnswer,
    referenceSolution: officialAnswer
  });
  } catch (err) {
    console.error('[Problems API] evaluate-solution failed:', err.message);
    res.status(200).json({
      success: false,
      score: 0,
      maxScore: 10,
      passed: false,
      passedTests: 0,
      totalTests: 0,
      testResults: [],
      feedback: 'Could not evaluate this solution. Check the function name matches the problem, then submit again.',
      officialAnswer: '',
      referenceSolution: ''
    });
  }
});

router.get9PackForSkill = get9PackForSkill;
router.CURATED_PROBLEMS_BY_SKILL = CURATED_PROBLEMS_BY_SKILL;
module.exports = router;

