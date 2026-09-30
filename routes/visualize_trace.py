#!/usr/bin/env python3
"""Emit Hiero visualizer steps for user Python code."""
import ast
import json
import re
import sys

MAX_STEPS = 2000


def fmt(v):
    if v is True:
        return "True"
    if v is False:
        return "False"
    if v is None:
        return "None"
    if isinstance(v, str):
        return json.dumps(v)
    if isinstance(v, (list, tuple)):
        if len(v) == 0:
            return "[]"
        if len(v) <= 8:
            return "[" + ", ".join(fmt(x) for x in v) + "]"
        return "[" + ", ".join(fmt(x) for x in v[:3]) + " and more]"
    if isinstance(v, dict):
        if not v:
            return "{}"
        if "truthy_count" in v and "falsy_count" in v:
            return f"{v.get('truthy_count', 0)} truthy and {v.get('falsy_count', 0)} falsy"
        items = list(v.items())[:3]
        inner = ", ".join(f"{fmt(k)}: {fmt(val)}" for k, val in items)
        return "{" + inner + "}"
    return str(v)


def jsonable(v, depth=0):
    if depth > 4:
        return fmt(v)
    if v is True or v is False or v is None:
        return v
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v
    if isinstance(v, (list, tuple)):
        return [jsonable(x, depth + 1) for x in list(v)[:30]]
    if isinstance(v, dict):
        return {str(k): jsonable(val, depth + 1) for k, val in list(v.items())[:20]}
    return fmt(v)


def strip_main(src):
    tree = ast.parse(src)
    keep = []
    for node in tree.body:
        if isinstance(node, ast.If):
            try:
                test = ast.unparse(node.test)
            except Exception:
                test = ""
            if "__name__" in test and "__main__" in test:
                continue
        if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef, ast.Import, ast.ImportFrom)):
            keep.append(node)
            continue
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) for t in node.targets):
            # Skip demo prints / bucket = TokenBucket(...) so stdout stays JSON-only
            continue
        if isinstance(node, ast.Expr):
            continue
        keep.append(node)
    return ast.Module(body=keep, type_ignores=[])


def first_fn(src):
    tree = ast.parse(src)
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            return node.name, node.lineno, getattr(node, "end_lineno", node.lineno)
        if isinstance(node, ast.ClassDef):
            for child in node.body:
                if isinstance(child, ast.FunctionDef) and child.name != "__init__":
                    return child.name, child.lineno, getattr(child, "end_lineno", child.lineno)
            return node.name, node.lineno, getattr(node, "end_lineno", node.lineno)
    return None, 1, 1


def first_class(src):
    tree = ast.parse(src)
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            return node.name, node.lineno, getattr(node, "end_lineno", node.lineno)
    return None, 1, 1


def literal_or_eval(text, ns=None):
    raw = str(text).strip()
    try:
        return ast.literal_eval(raw)
    except Exception:
        try:
            return eval(raw, {"__builtins__": {}}, ns or {})
        except Exception:
            return raw


def parse_token_bucket_demo(src, test_call):
    blob = (test_call or "").strip() or src
    ctor = re.search(r"TokenBucket\s*\(\s*([^,]+)\s*,\s*([^)]+)\)", blob)
    cap, rate = 5, 1
    if ctor:
        cap = literal_or_eval(ctor.group(1))
        rate = literal_or_eval(ctor.group(2))
    reqs = []
    for match in re.finditer(r"allow_request\s*\(\s*([^,]+)\s*,\s*([^,)]+)\s*\)", blob):
        asked = match.group(1).strip()
        when = match.group(2).strip()
        if asked == "self" or when in ("current_time", "tokens"):
            continue
        reqs.append((literal_or_eval(asked), literal_or_eval(when)))
    return cap, rate, reqs


def token_slots(tokens, capacity):
    cap = max(0, int(round(float(capacity))))
    filled = max(0, min(cap, int(round(float(tokens)))))
    values = (["●"] * filled) + (["○"] * (cap - filled))
    flags = ([True] * filled) + ([False] * (cap - filled))
    return values, flags


def run_python_snippet(ns, snippet):
    snippet = (snippet or "").strip()
    if not snippet:
        return None
    try:
        return eval(snippet, ns, ns)
    except SyntaxError:
        tree = ast.parse(snippet)
        body = tree.body
        if not body:
            return None
        if isinstance(body[-1], ast.Expr):
            exec(compile(ast.Module(body=body[:-1], type_ignores=[]), "<test>", "exec"), ns, ns)
            return eval(compile(ast.Expression(body[-1].value), "<test>", "eval"), ns, ns)
        exec(compile(tree, "<test>", "exec"), ns, ns)
        return None


def allow_request_line(src):
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == "allow_request":
            return node.lineno
    return 1


def token_bucket_story(cls, cap, rate, requests, src):
    bucket = cls(cap, rate)
    line = allow_request_line(src)
    tokens_now = getattr(bucket, "tokens", cap)
    values, flags = token_slots(tokens_now, cap)
    steps = [make_step(
        0, "call", 1,
        f"TokenBucket starts with {fmt(tokens_now)} of {fmt(cap)} tokens.",
        values, flags, list(range(len(values))), [],
        {"capacity": cap, "refill_rate": rate, "tokens": tokens_now, "time": getattr(bucket, "last_time", 0)},
    )]
    answers = []
    for need, when in requests:
        ok = bucket.allow_request(need, when)
        answers.append(bool(ok))
        tokens_now = getattr(bucket, "tokens", tokens_now)
        values, flags = token_slots(tokens_now, cap)
        if ok:
            cap_txt = f"At time {fmt(when)}, {fmt(need)} tokens are allowed. {fmt(tokens_now)} left."
        else:
            cap_txt = f"At time {fmt(when)}, {fmt(need)} tokens are denied. {fmt(tokens_now)} left."
        steps.append(make_step(
            len(steps), "compare" if ok else "branch", line, cap_txt,
            values, flags, list(range(len(values))),
            list(range(min(int(round(float(need))), len(values)))),
            {
                "capacity": cap,
                "tokens": tokens_now,
                "asked": need,
                "time": when,
                "allowed": bool(ok),
            },
            ret=bool(ok),
        ))
    steps.append(make_step(
        len(steps), "return", line,
        f"allow_request results: {fmt(answers)}.",
        values, flags, list(range(len(values))), [],
        {"results": answers, "tokens": getattr(bucket, "tokens", tokens_now)},
        ret=answers,
    ))
    return steps, answers


def looks_token_bucket(src, test_call, title, class_name):
    blob = f"{src} {test_call or ''} {title or ''} {class_name or ''}".lower()
    return "tokenbucket" in blob.replace("_", "") or ("token" in blob and "bucket" in blob)


def looks_truthy_problem(fn_name, test_call, title):
    blob = f"{fn_name or ''} {test_call or ''} {title or ''}".lower()
    return "truthy" in blob or "falsy" in blob


def make_step(n, typ, line, caption, values, flags, visited, active, variables, ret=None):
    return {
        "stepNumber": n,
        "line": line or 1,
        "type": typ,
        "data": {},
        "caption": caption,
        "returnValue": jsonable(ret) if ret is not None else None,
        "state": {
            "variables": {str(k): jsonable(v) for k, v in (variables or {}).items()},
            "dataStructure": {
                "type": "array",
                "values": values,
                "visited": visited,
                "flags": flags,
            },
            "activeIndices": active,
            "callStack": [],
            "loop": None,
        },
    }


def truthy_story(fn_name, items, result, fn_line=1, ret_line=1):
    labels = [fmt(x) for x in items]
    flags = [bool(x) for x in items]
    steps = []
    steps.append(make_step(
        0, "call", fn_line,
        f"{fn_name} starts with {fmt(items)}.",
        labels, flags, [], [],
        {"val_list": labels},
    ))
    truthy = 0
    falsy = 0
    visited = []
    for i, x in enumerate(items):
        if bool(x):
            truthy += 1
            cap = f"{fmt(x)} is truthy — truthy_count is {truthy}."
        else:
            falsy += 1
            cap = f"{fmt(x)} is falsy — falsy_count is {falsy}."
        visited = visited + [i]
        steps.append(make_step(
            len(steps), "compare", max(fn_line, 1), cap,
            labels, flags, visited, [i],
            {"truthy_count": truthy, "falsy_count": falsy, "current": fmt(x)},
        ))
        if len(steps) >= MAX_STEPS:
            break
    steps.append(make_step(
        len(steps), "return", ret_line,
        f"{fn_name} is done and returns {fmt(result)}.",
        labels, flags, list(range(len(items))), [],
        result if isinstance(result, dict) else {"result": result},
        ret=result,
    ))
    return steps


def eval_expected(expected):
    if expected is None:
        return None
    if not isinstance(expected, str):
        return expected
    try:
        return eval(expected, {"__builtins__": {"True": True, "False": False, "None": None}}, {})
    except Exception:
        return expected


def check_correct(result, expected, items):
    exp = eval_expected(expected)
    if exp is not None:
        try:
            return result == exp
        except Exception:
            return str(result) == str(expected)
    if isinstance(result, dict) and isinstance(items, list) and "truthy_count" in result:
        truthy = sum(1 for x in items if x)
        return result.get("truthy_count") == truthy and result.get("falsy_count") == len(items) - truthy
    return False


def generic_steps(fn_name, items, result, fn_line, ret_line):
    labels = [fmt(x) for x in items] if isinstance(items, list) else []
    flags = [bool(x) for x in items] if isinstance(items, list) else []
    steps = [make_step(
        0, "call", fn_line,
        f"{fn_name} starts with {fmt(items) if items is not None else 'no inputs'}.",
        labels, flags, [], [],
        {"input": jsonable(items)} if items is not None else {},
    )]
    if isinstance(items, list):
        for i, x in enumerate(items):
            steps.append(make_step(
                len(steps), "loop-iter", fn_line,
                f"Looking at {fmt(x)}.",
                labels, flags, list(range(i + 1)), [i],
                {"current": fmt(x), "index": i},
            ))
    steps.append(make_step(
        len(steps), "return", ret_line,
        f"{fn_name} is done and returns {fmt(result)}.",
        labels, flags, list(range(len(labels))), [],
        result if isinstance(result, dict) else {"result": result},
        ret=result,
    ))
    return steps


def main():
    payload = json.load(sys.stdin)
    code = payload.get("code") or ""
    test_call = (payload.get("testCall") or "").strip()
    expected = payload.get("expected")
    title = payload.get("title") or ""

    try:
        tree = strip_main(code)
    except SyntaxError as err:
        line = err.lineno or 1
        print(json.dumps({
            "success": False,
            "errorType": "syntax",
            "line": line,
            "friendlyCaption": f"There's a small typo somewhere — check line {line}.",
            "rawError": err.msg or str(err),
        }))
        return

    fn_name, fn_line, ret_line = first_fn(code)
    class_name, class_line, _ = first_class(code)
    ns = {}
    try:
        exec(compile(tree, "<user>", "exec"), ns, ns)
    except Exception as err:
        print(json.dumps({
            "success": False,
            "errorType": "runtime",
            "line": 1,
            "friendlyCaption": f"Something went wrong here: {err}. Want to check this line?",
            "rawError": str(err),
        }))
        return

    if looks_token_bucket(code, test_call, title, class_name):
        cls = ns.get(class_name) if class_name and class_name in ns else ns.get("TokenBucket")
        cap, rate, reqs = parse_token_bucket_demo(code, test_call)
        if cls and reqs:
            try:
                steps, answers = token_bucket_story(cls, cap, rate, reqs, code)
                expected_val = eval_expected(expected)
                is_correct = False
                if expected_val is not None:
                    is_correct = answers == expected_val or str(answers) == str(expected)
                else:
                    is_correct = True
                print(json.dumps({
                    "success": True,
                    "dsType": "array",
                    "initialData": token_slots(cap, cap)[0],
                    "totalSteps": len(steps),
                    "steps": steps,
                    "isCorrect": is_correct,
                    "isInfiniteLoop": False,
                    "runtimeError": None,
                    "runtimeErrorLine": None,
                    "friendlyCaption": "Nice work — that's correct! 🎉" if is_correct else None,
                }))
                return
            except Exception as err:
                runtime_error = str(err)
                print(json.dumps({
                    "success": True,
                    "dsType": "trace",
                    "initialData": [],
                    "totalSteps": 0,
                    "steps": [],
                    "isCorrect": False,
                    "isInfiniteLoop": False,
                    "runtimeError": f"Something went wrong here: {runtime_error}. Want to check this line?",
                    "runtimeErrorLine": 1,
                    "friendlyCaption": f"Something went wrong here: {runtime_error}. Want to check this line?",
                }))
                return

    if not test_call:
        if fn_name and looks_truthy_problem(fn_name, "", title):
            test_call = f"{fn_name}([0, 'Python', [], {{}}, 42, True])"
        elif class_name:
            test_call = ""
        elif fn_name:
            test_call = f"{fn_name}()"

    items = None
    try:
        call_ast = ast.parse(test_call, mode="eval")
        if isinstance(call_ast.body, ast.Call) and call_ast.body.args:
            items = eval(compile(ast.Expression(call_ast.body.args[0]), "<arg>", "eval"), ns, ns)
    except Exception:
        items = None

    result = None
    runtime_error = None
    try:
        result = run_python_snippet(ns, test_call) if test_call else None
    except Exception as err:
        runtime_error = str(err)

    if runtime_error and items is None:
        print(json.dumps({
            "success": True,
            "dsType": "trace",
            "initialData": [],
            "totalSteps": 0,
            "steps": [],
            "isCorrect": False,
            "isInfiniteLoop": False,
            "runtimeError": f"Something went wrong here: {runtime_error}. Want to check this line?",
            "runtimeErrorLine": 1,
            "friendlyCaption": f"Something went wrong here: {runtime_error}. Want to check this line?",
        }))
        return

    label = fn_name or "the function"
    if looks_truthy_problem(fn_name, test_call, title) and isinstance(items, list):
        steps = truthy_story(label, items, result, fn_line, ret_line)
        ds_type = "array"
        initial = [fmt(x) for x in items]
    else:
        steps = generic_steps(label, items, result, fn_line, ret_line)
        ds_type = "array" if isinstance(items, list) else "trace"
        initial = [fmt(x) for x in items] if isinstance(items, list) else []

    print(json.dumps({
        "success": True,
        "dsType": ds_type,
        "initialData": initial,
        "totalSteps": len(steps),
        "steps": steps,
        "isCorrect": False if runtime_error else check_correct(result, expected, items),
        "isInfiniteLoop": False,
        "runtimeError": (
            f"Something went wrong here: {runtime_error}. Want to check this line?"
            if runtime_error else None
        ),
        "runtimeErrorLine": 1 if runtime_error else None,
        "friendlyCaption": None if runtime_error else (
            "Nice work — that's correct! 🎉" if check_correct(result, expected, items) else None
        ),
    }))


if __name__ == "__main__":
    main()
