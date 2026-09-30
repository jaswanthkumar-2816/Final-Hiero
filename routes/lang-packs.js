'use strict';

function problem(lang, id, difficulty, extra) {
  return Object.assign({
    id: `${lang}-${id}`,
    skill: extra.skill,
    difficulty,
    subTopic: extra.subTopic,
    title: extra.title,
    description: extra.description,
    hint: extra.hint,
    starterCode: extra.starter,
    testCases: extra.tests,
    referenceSolution: extra.ref
  }, extra.meta || {});
}

const C_PACK = [
  problem('c', 'easy-1', 'easy', {
    skill: 'C',
    subTopic: 'Arrays & Counting',
    title: 'Count Zeros in an Array',
    description: 'Write a function `count_zeros(arr, n)` that returns how many zeros are in the first `n` elements of `arr`.',
    hint: 'Loop from 0 to n-1 and increment a counter when arr[i] == 0.',
    starter: `int count_zeros(int arr[], int n) {
    // return how many zeros
    return 0;
}`,
    ref: `int count_zeros(int arr[], int n) {
    int c = 0;
    for (int i = 0; i < n; i++) if (arr[i] == 0) c++;
    return c;
}`,
    tests: [
      { case: 1, name: 'Mixed', input: '[0, 1, 0, 2, 0]', testCall: 'count_zeros((int[]){0, 1, 0, 2, 0}, 5)', expectedOutput: '3' },
      { case: 2, name: 'None', input: '[1, 2, 3]', testCall: 'count_zeros((int[]){1, 2, 3}, 3)', expectedOutput: '0' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'count_zeros((int[]){0}, 0)', expectedOutput: '0' }
    ]
  }),
  problem('c', 'easy-2', 'easy', {
    skill: 'C',
    subTopic: 'Array Maximum',
    title: 'Find the Maximum Value',
    description: 'Write `max_value(arr, n)` that returns the largest integer in the first `n` elements. If `n` is 0, return 0.',
    hint: 'Start with arr[0] and replace it whenever you see a bigger value.',
    starter: `int max_value(int arr[], int n) {
    return 0;
}`,
    ref: `int max_value(int arr[], int n) {
    if (n <= 0) return 0;
    int m = arr[0];
    for (int i = 1; i < n; i++) if (arr[i] > m) m = arr[i];
    return m;
}`,
    tests: [
      { case: 1, name: 'Typical', input: '[3, 7, 2, 9, 1]', testCall: 'max_value((int[]){3, 7, 2, 9, 1}, 5)', expectedOutput: '9' },
      { case: 2, name: 'Negatives', input: '[-4, -1, -9]', testCall: 'max_value((int[]){-4, -1, -9}, 3)', expectedOutput: '-1' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'max_value((int[]){0}, 0)', expectedOutput: '0' }
    ]
  }),
  problem('c', 'easy-3', 'easy', {
    skill: 'C',
    subTopic: 'Array Sum',
    title: 'Sum the Array',
    description: 'Write `sum_array(arr, n)` that returns the sum of the first `n` integers.',
    hint: 'Add arr[i] into a running total.',
    starter: `int sum_array(int arr[], int n) {
    return 0;
}`,
    ref: `int sum_array(int arr[], int n) {
    int s = 0;
    for (int i = 0; i < n; i++) s += arr[i];
    return s;
}`,
    tests: [
      { case: 1, name: 'Typical', input: '[1, 2, 3, 4]', testCall: 'sum_array((int[]){1, 2, 3, 4}, 4)', expectedOutput: '10' },
      { case: 2, name: 'Negatives', input: '[5, -2, -3]', testCall: 'sum_array((int[]){5, -2, -3}, 3)', expectedOutput: '0' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'sum_array((int[]){0}, 0)', expectedOutput: '0' }
    ]
  }),
  problem('c', 'medium-1', 'medium', {
    skill: 'C',
    subTopic: 'Two Sum Check',
    title: 'Does a Two-Sum Pair Exist?',
    description: 'Write `two_sum_exists(arr, n, target)` that returns 1 if two different indices add up to `target`, otherwise 0.',
    hint: 'Try every pair i < j and check arr[i] + arr[j] == target.',
    starter: `int two_sum_exists(int arr[], int n, int target) {
    return 0;
}`,
    ref: `int two_sum_exists(int arr[], int n, int target) {
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (arr[i] + arr[j] == target) return 1;
    return 0;
}`,
    tests: [
      { case: 1, name: 'Found', input: '[2, 7, 11, 15] target 9', testCall: 'two_sum_exists((int[]){2, 7, 11, 15}, 4, 9)', expectedOutput: '1' },
      { case: 2, name: 'Missing', input: '[1, 2, 3] target 7', testCall: 'two_sum_exists((int[]){1, 2, 3}, 3, 7)', expectedOutput: '0' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'two_sum_exists((int[]){0}, 0, 1)', expectedOutput: '0' }
    ]
  }),
  problem('c', 'medium-2', 'medium', {
    skill: 'C',
    subTopic: 'Strings',
    title: 'Is This a Palindrome?',
    description: 'Write `is_palindrome(s)` that returns 1 if `s` reads the same forwards and backwards, otherwise 0. Empty string is a palindrome.',
    hint: 'Compare s[left] and s[right] and walk inward.',
    starter: `#include <string.h>

int is_palindrome(const char *s) {
    return 0;
}`,
    ref: `#include <string.h>

int is_palindrome(const char *s) {
    if (!s) return 1;
    int i = 0, j = (int)strlen(s) - 1;
    while (i < j) {
        if (s[i] != s[j]) return 0;
        i++; j--;
    }
    return 1;
}`,
    tests: [
      { case: 1, name: 'Yes', input: 'abba', testCall: 'is_palindrome("abba")', expectedOutput: '1' },
      { case: 2, name: 'No', input: 'orbit', testCall: 'is_palindrome("orbit")', expectedOutput: '0' },
      { case: 3, name: 'Empty', input: '', testCall: 'is_palindrome("")', expectedOutput: '1' }
    ]
  }),
  problem('c', 'medium-3', 'medium', {
    skill: 'C',
    subTopic: 'Even Numbers',
    title: 'Sum of Even Values',
    description: 'Write `sum_even(arr, n)` that returns the sum of every even number in the first `n` elements.',
    hint: 'A number is even when arr[i] % 2 == 0.',
    starter: `int sum_even(int arr[], int n) {
    return 0;
}`,
    ref: `int sum_even(int arr[], int n) {
    int s = 0;
    for (int i = 0; i < n; i++) if (arr[i] % 2 == 0) s += arr[i];
    return s;
}`,
    tests: [
      { case: 1, name: 'Mixed', input: '[1, 2, 3, 4, 6]', testCall: 'sum_even((int[]){1, 2, 3, 4, 6}, 5)', expectedOutput: '12' },
      { case: 2, name: 'All odd', input: '[1, 3, 5]', testCall: 'sum_even((int[]){1, 3, 5}, 3)', expectedOutput: '0' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'sum_even((int[]){0}, 0)', expectedOutput: '0' }
    ]
  }),
  problem('c', 'hard-1', 'hard', {
    skill: 'C',
    subTopic: 'Duplicates',
    title: 'First Duplicate Value',
    description: 'Write `first_duplicate(arr, n)` that returns the first value that appears twice when reading left to right. If every value is unique, return -1.',
    hint: 'Keep a seen flag per value, or scan previous items when you visit each index.',
    starter: `int first_duplicate(int arr[], int n) {
    return -1;
}`,
    ref: `int first_duplicate(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) if (arr[j] == arr[i]) return arr[i];
    }
    return -1;
}`,
    tests: [
      { case: 1, name: 'Found', input: '[2, 5, 1, 5, 3]', testCall: 'first_duplicate((int[]){2, 5, 1, 5, 3}, 5)', expectedOutput: '5' },
      { case: 2, name: 'Unique', input: '[1, 2, 3]', testCall: 'first_duplicate((int[]){1, 2, 3}, 3)', expectedOutput: '-1' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'first_duplicate((int[]){0}, 0)', expectedOutput: '-1' }
    ]
  }),
  problem('c', 'hard-2', 'hard', {
    skill: 'C',
    subTopic: 'Missing Number',
    title: 'Find the Missing Number',
    description: 'Write `missing_number(arr, n)` where `arr` contains `n` distinct integers from 1 to n+1 with one value missing. Return the missing value. Empty array means 1 is missing.',
    hint: 'Expected sum of 1..n+1 is (n+1)*(n+2)/2. Subtract the actual sum.',
    starter: `int missing_number(int arr[], int n) {
    return 1;
}`,
    ref: `int missing_number(int arr[], int n) {
    int expect = (n + 1) * (n + 2) / 2;
    int got = 0;
    for (int i = 0; i < n; i++) got += arr[i];
    return expect - got;
}`,
    tests: [
      { case: 1, name: 'Typical', input: '[1, 2, 4, 5]', testCall: 'missing_number((int[]){1, 2, 4, 5}, 4)', expectedOutput: '3' },
      { case: 2, name: 'Last missing', input: '[1, 2, 3]', testCall: 'missing_number((int[]){1, 2, 3}, 3)', expectedOutput: '4' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'missing_number((int[]){0}, 0)', expectedOutput: '1' }
    ]
  }),
  problem('c', 'hard-3', 'hard', {
    skill: 'C',
    subTopic: 'Runs',
    title: 'Longest Equal Run',
    description: 'Write `longest_run(arr, n)` that returns the longest streak of the same value in a row. Empty array returns 0.',
    hint: 'Track the current streak and the best streak while you walk the array.',
    starter: `int longest_run(int arr[], int n) {
    return 0;
}`,
    ref: `int longest_run(int arr[], int n) {
    if (n <= 0) return 0;
    int best = 1, cur = 1;
    for (int i = 1; i < n; i++) {
        if (arr[i] == arr[i - 1]) cur++;
        else cur = 1;
        if (cur > best) best = cur;
    }
    return best;
}`,
    tests: [
      { case: 1, name: 'Typical', input: '[1, 1, 2, 2, 2, 1]', testCall: 'longest_run((int[]){1, 1, 2, 2, 2, 1}, 6)', expectedOutput: '3' },
      { case: 2, name: 'All unique', input: '[4, 5, 6]', testCall: 'longest_run((int[]){4, 5, 6}, 3)', expectedOutput: '1' },
      { case: 3, name: 'Empty', input: '[]', testCall: 'longest_run((int[]){0}, 0)', expectedOutput: '0' }
    ]
  })
];

function cppFromC(p) {
  const starter = `#include <vector>\nusing namespace std;\n\n` + p.starterCode
    .replace(/int (\w+)\(int arr\[\], int n/g, 'int $1(const vector<int>& arr')
    .replace(/const char \*s/g, 'const string& s')
    .replace(/int n\) \{\n    \/\/ return how many zeros\n    return 0;\n}/, ') {\n    return 0;\n}')
    .replace(/int n\) \{\n    return 0;\n}/g, ') {\n    return 0;\n}')
    .replace(/int n\) \{\n    return -1;\n}/, ') {\n    return -1;\n}')
    .replace(/int n\) \{\n    return 1;\n}/, ') {\n    return 1;\n}')
    .replace(/, int target\)/, ', int target)');

  const ref = `#include <vector>\n#include <string>\nusing namespace std;\n\n` + p.referenceSolution
    .replace(/#include <string.h>\s*/g, '')
    .replace(/int (\w+)\(int arr\[\], int n/g, 'int $1(const vector<int>& arr')
    .replace(/const char \*s/g, 'const string& s')
    .replace(/\(int\)strlen\(s\)/g, '(int)s.size()')
    .replace(/\bn\b/g, 'arr.size()')
    .replace(/arr\.size\(\) \+ 1\) \* \(arr\.size\(\) \+ 2\)/g, '(int)(arr.size() + 1) * (int)(arr.size() + 2)');

  const tests = p.testCases.map((t) => {
    const call = t.testCall
      .replace(/count_zeros\(\(int\[\]\)\{([^}]+)\},\s*\d+\)/, 'count_zeros(vector<int>{$1})')
      .replace(/max_value\(\(int\[\]\)\{([^}]+)\},\s*\d+\)/, 'max_value(vector<int>{$1})')
      .replace(/sum_array\(\(int\[\]\)\{([^}]+)\},\s*\d+\)/, 'sum_array(vector<int>{$1})')
      .replace(/two_sum_exists\(\(int\[\]\)\{([^}]+)\},\s*\d+,\s*(\d+)\)/, 'two_sum_exists(vector<int>{$1}, $2)')
      .replace(/sum_even\(\(int\[\]\)\{([^}]+)\},\s*\d+\)/, 'sum_even(vector<int>{$1})')
      .replace(/first_duplicate\(\(int\[\]\)\{([^}]+)\},\s*\d+\)/, 'first_duplicate(vector<int>{$1})')
      .replace(/missing_number\(\(int\[\]\)\{([^}]+)\},\s*\d+\)/, 'missing_number(vector<int>{$1})')
      .replace(/longest_run\(\(int\[\]\)\{([^}]+)\},\s*\d+\)/, 'longest_run(vector<int>{$1})')
      .replace(/is_palindrome\(/, 'is_palindrome(')
      .replace(/\(int\[\]\)\{0\},\s*0/g, 'vector<int>{}');
    return Object.assign({}, t, { testCall: call });
  });

  return Object.assign({}, p, {
    id: p.id.replace(/^c-/, 'cpp-'),
    skill: 'C++',
    starterCode: p.id.includes('easy-1')
      ? `#include <vector>\nusing namespace std;\n\nint count_zeros(const vector<int>& arr) {\n    return 0;\n}`
      : p.id.includes('easy-2')
        ? `#include <vector>\nusing namespace std;\n\nint max_value(const vector<int>& arr) {\n    return 0;\n}`
        : p.id.includes('easy-3')
          ? `#include <vector>\nusing namespace std;\n\nint sum_array(const vector<int>& arr) {\n    return 0;\n}`
          : p.id.includes('medium-1')
            ? `#include <vector>\nusing namespace std;\n\nint two_sum_exists(const vector<int>& arr, int target) {\n    return 0;\n}`
            : p.id.includes('medium-2')
              ? `#include <string>\nusing namespace std;\n\nint is_palindrome(const string& s) {\n    return 0;\n}`
              : p.id.includes('medium-3')
                ? `#include <vector>\nusing namespace std;\n\nint sum_even(const vector<int>& arr) {\n    return 0;\n}`
                : p.id.includes('hard-1')
                  ? `#include <vector>\nusing namespace std;\n\nint first_duplicate(const vector<int>& arr) {\n    return -1;\n}`
                  : p.id.includes('hard-2')
                    ? `#include <vector>\nusing namespace std;\n\nint missing_number(const vector<int>& arr) {\n    return 1;\n}`
                    : `#include <vector>\nusing namespace std;\n\nint longest_run(const vector<int>& arr) {\n    return 0;\n}`,
    referenceSolution: ref,
    testCases: tests,
    description: p.description
      .replace(/`count_zeros\(arr, n\)` that returns how many zeros are in the first `n` elements of `arr`/, '`count_zeros(arr)` that returns how many zeros are in `arr`')
      .replace(/`max_value\(arr, n\)` that returns the largest integer in the first `n` elements. If `n` is 0, return 0/, '`max_value(arr)` that returns the largest integer in `arr`. Empty array returns 0')
      .replace(/`sum_array\(arr, n\)` that returns the sum of the first `n` integers/, '`sum_array(arr)` that returns the sum of every integer in `arr`')
      .replace(/`two_sum_exists\(arr, n, target\)`/, '`two_sum_exists(arr, target)`')
      .replace(/`sum_even\(arr, n\)` that returns the sum of every even number in the first `n` elements/, '`sum_even(arr)` that returns the sum of every even number')
      .replace(/`first_duplicate\(arr, n\)`/, '`first_duplicate(arr)`')
      .replace(/`missing_number\(arr, n\)` where `arr` contains `n` distinct integers from 1 to n\+1/, '`missing_number(arr)` where `arr` contains n distinct integers from 1 to n+1')
      .replace(/`longest_run\(arr, n\)`/, '`longest_run(arr)`')
  });
}

function javaPack() {
  return [
    {
      id: 'java-easy-1', skill: 'Java', difficulty: 'easy', subTopic: 'Arrays & Counting',
      title: 'Count Zeros in an Array',
      description: 'Write `countZeros(arr)` that returns how many zeros are in the array.',
      hint: 'Loop the array and increment a counter when arr[i] == 0.',
      starterCode: `public class Solution {
    public static int countZeros(int[] arr) {
        return 0;
    }
}`,
      referenceSolution: `public class Solution {
    public static int countZeros(int[] arr) {
        int c = 0;
        for (int v : arr) if (v == 0) c++;
        return c;
    }
}`,
      testCases: [
        { case: 1, name: 'Mixed', input: '[0, 1, 0, 2, 0]', testCall: 'countZeros(new int[]{0, 1, 0, 2, 0})', expectedOutput: '3' },
        { case: 2, name: 'None', input: '[1, 2, 3]', testCall: 'countZeros(new int[]{1, 2, 3})', expectedOutput: '0' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'countZeros(new int[]{})', expectedOutput: '0' }
      ]
    },
    {
      id: 'java-easy-2', skill: 'Java', difficulty: 'easy', subTopic: 'Array Maximum',
      title: 'Find the Maximum Value',
      description: 'Write `maxValue(arr)` that returns the largest integer. Empty array returns 0.',
      hint: 'Start with arr[0] and replace it whenever you see a bigger value.',
      starterCode: `public class Solution {
    public static int maxValue(int[] arr) {
        return 0;
    }
}`,
      referenceSolution: `public class Solution {
    public static int maxValue(int[] arr) {
        if (arr.length == 0) return 0;
        int m = arr[0];
        for (int i = 1; i < arr.length; i++) if (arr[i] > m) m = arr[i];
        return m;
    }
}`,
      testCases: [
        { case: 1, name: 'Typical', input: '[3, 7, 2, 9, 1]', testCall: 'maxValue(new int[]{3, 7, 2, 9, 1})', expectedOutput: '9' },
        { case: 2, name: 'Negatives', input: '[-4, -1, -9]', testCall: 'maxValue(new int[]{-4, -1, -9})', expectedOutput: '-1' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'maxValue(new int[]{})', expectedOutput: '0' }
      ]
    },
    {
      id: 'java-easy-3', skill: 'Java', difficulty: 'easy', subTopic: 'Array Sum',
      title: 'Sum the Array',
      description: 'Write `sumArray(arr)` that returns the sum of every integer.',
      hint: 'Add each value into a running total.',
      starterCode: `public class Solution {
    public static int sumArray(int[] arr) {
        return 0;
    }
}`,
      referenceSolution: `public class Solution {
    public static int sumArray(int[] arr) {
        int s = 0;
        for (int v : arr) s += v;
        return s;
    }
}`,
      testCases: [
        { case: 1, name: 'Typical', input: '[1, 2, 3, 4]', testCall: 'sumArray(new int[]{1, 2, 3, 4})', expectedOutput: '10' },
        { case: 2, name: 'Negatives', input: '[5, -2, -3]', testCall: 'sumArray(new int[]{5, -2, -3})', expectedOutput: '0' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'sumArray(new int[]{})', expectedOutput: '0' }
      ]
    },
    {
      id: 'java-medium-1', skill: 'Java', difficulty: 'medium', subTopic: 'Two Sum Check',
      title: 'Does a Two-Sum Pair Exist?',
      description: 'Write `twoSumExists(arr, target)` that returns 1 if two different indices add up to target, otherwise 0.',
      hint: 'Try every pair i < j.',
      starterCode: `public class Solution {
    public static int twoSumExists(int[] arr, int target) {
        return 0;
    }
}`,
      referenceSolution: `public class Solution {
    public static int twoSumExists(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++)
            for (int j = i + 1; j < arr.length; j++)
                if (arr[i] + arr[j] == target) return 1;
        return 0;
    }
}`,
      testCases: [
        { case: 1, name: 'Found', input: '[2, 7, 11, 15] target 9', testCall: 'twoSumExists(new int[]{2, 7, 11, 15}, 9)', expectedOutput: '1' },
        { case: 2, name: 'Missing', input: '[1, 2, 3] target 7', testCall: 'twoSumExists(new int[]{1, 2, 3}, 7)', expectedOutput: '0' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'twoSumExists(new int[]{}, 1)', expectedOutput: '0' }
      ]
    },
    {
      id: 'java-medium-2', skill: 'Java', difficulty: 'medium', subTopic: 'Strings',
      title: 'Is This a Palindrome?',
      description: 'Write `isPalindrome(s)` that returns 1 if s is a palindrome, otherwise 0. Empty string returns 1.',
      hint: 'Compare characters from both ends.',
      starterCode: `public class Solution {
    public static int isPalindrome(String s) {
        return 0;
    }
}`,
      referenceSolution: `public class Solution {
    public static int isPalindrome(String s) {
        if (s == null) return 1;
        int i = 0, j = s.length() - 1;
        while (i < j) {
            if (s.charAt(i) != s.charAt(j)) return 0;
            i++; j--;
        }
        return 1;
    }
}`,
      testCases: [
        { case: 1, name: 'Yes', input: 'abba', testCall: 'isPalindrome("abba")', expectedOutput: '1' },
        { case: 2, name: 'No', input: 'orbit', testCall: 'isPalindrome("orbit")', expectedOutput: '0' },
        { case: 3, name: 'Empty', input: '', testCall: 'isPalindrome("")', expectedOutput: '1' }
      ]
    },
    {
      id: 'java-medium-3', skill: 'Java', difficulty: 'medium', subTopic: 'Even Numbers',
      title: 'Sum of Even Values',
      description: 'Write `sumEven(arr)` that returns the sum of every even number.',
      hint: 'A number is even when arr[i] % 2 == 0.',
      starterCode: `public class Solution {
    public static int sumEven(int[] arr) {
        return 0;
    }
}`,
      referenceSolution: `public class Solution {
    public static int sumEven(int[] arr) {
        int s = 0;
        for (int v : arr) if (v % 2 == 0) s += v;
        return s;
    }
}`,
      testCases: [
        { case: 1, name: 'Mixed', input: '[1, 2, 3, 4, 6]', testCall: 'sumEven(new int[]{1, 2, 3, 4, 6})', expectedOutput: '12' },
        { case: 2, name: 'All odd', input: '[1, 3, 5]', testCall: 'sumEven(new int[]{1, 3, 5})', expectedOutput: '0' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'sumEven(new int[]{})', expectedOutput: '0' }
      ]
    },
    {
      id: 'java-hard-1', skill: 'Java', difficulty: 'hard', subTopic: 'Duplicates',
      title: 'First Duplicate Value',
      description: 'Write `firstDuplicate(arr)` that returns the first value that appears twice left to right, or -1 if all unique.',
      hint: 'Scan previous items when you visit each index.',
      starterCode: `public class Solution {
    public static int firstDuplicate(int[] arr) {
        return -1;
    }
}`,
      referenceSolution: `public class Solution {
    public static int firstDuplicate(int[] arr) {
        for (int i = 0; i < arr.length; i++)
            for (int j = 0; j < i; j++)
                if (arr[j] == arr[i]) return arr[i];
        return -1;
    }
}`,
      testCases: [
        { case: 1, name: 'Found', input: '[2, 5, 1, 5, 3]', testCall: 'firstDuplicate(new int[]{2, 5, 1, 5, 3})', expectedOutput: '5' },
        { case: 2, name: 'Unique', input: '[1, 2, 3]', testCall: 'firstDuplicate(new int[]{1, 2, 3})', expectedOutput: '-1' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'firstDuplicate(new int[]{})', expectedOutput: '-1' }
      ]
    },
    {
      id: 'java-hard-2', skill: 'Java', difficulty: 'hard', subTopic: 'Missing Number',
      title: 'Find the Missing Number',
      description: 'Write `missingNumber(arr)` where arr has n distinct integers from 1 to n+1 with one missing. Return the missing value.',
      hint: 'Expected sum of 1..n+1 minus the actual sum.',
      starterCode: `public class Solution {
    public static int missingNumber(int[] arr) {
        return 1;
    }
}`,
      referenceSolution: `public class Solution {
    public static int missingNumber(int[] arr) {
        int n = arr.length;
        int expect = (n + 1) * (n + 2) / 2;
        int got = 0;
        for (int v : arr) got += v;
        return expect - got;
    }
}`,
      testCases: [
        { case: 1, name: 'Typical', input: '[1, 2, 4, 5]', testCall: 'missingNumber(new int[]{1, 2, 4, 5})', expectedOutput: '3' },
        { case: 2, name: 'Last missing', input: '[1, 2, 3]', testCall: 'missingNumber(new int[]{1, 2, 3})', expectedOutput: '4' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'missingNumber(new int[]{})', expectedOutput: '1' }
      ]
    },
    {
      id: 'java-hard-3', skill: 'Java', difficulty: 'hard', subTopic: 'Runs',
      title: 'Longest Equal Run',
      description: 'Write `longestRun(arr)` that returns the longest streak of the same value. Empty array returns 0.',
      hint: 'Track the current streak and the best streak.',
      starterCode: `public class Solution {
    public static int longestRun(int[] arr) {
        return 0;
    }
}`,
      referenceSolution: `public class Solution {
    public static int longestRun(int[] arr) {
        if (arr.length == 0) return 0;
        int best = 1, cur = 1;
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] == arr[i - 1]) cur++;
            else cur = 1;
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
      testCases: [
        { case: 1, name: 'Typical', input: '[1, 1, 2, 2, 2, 1]', testCall: 'longestRun(new int[]{1, 1, 2, 2, 2, 1})', expectedOutput: '3' },
        { case: 2, name: 'All unique', input: '[4, 5, 6]', testCall: 'longestRun(new int[]{4, 5, 6})', expectedOutput: '1' },
        { case: 3, name: 'Empty', input: '[]', testCall: 'longestRun(new int[]{})', expectedOutput: '0' }
      ]
    }
  ];
}

const CPP_PACK = C_PACK.map(cppFromC);

module.exports = {
  c: C_PACK,
  cpp: CPP_PACK,
  java: javaPack()
};
