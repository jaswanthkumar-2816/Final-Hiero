#!/usr/bin/env python3
"""Sandboxed line-by-line Python tracer for Hiero Visualize My Code."""
import ast
import contextlib
import io
import json
import re
import sys

MAX_STEPS = 2000
USER_FILE = "<hiero_user>"
TEST_FILE = "<hiero_test>"

try:
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
    resource.setrlimit(resource.RLIMIT_NOFILE, (16, 16))
    try:
        resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
    except (ValueError, OSError):
        pass
except Exception:
    pass

ALLOWED_MODULES = {
    "math", "json", "itertools", "collections", "functools", "heapq",
    "copy", "re", "datetime", "statistics", "decimal", "fractions", "string",
    "random", "typing", "bisect", "array", "operator", "enum", "dataclasses",
}

_real_import = __import__


def safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = str(name).split(".")[0]
    if root not in ALLOWED_MODULES:
        raise ImportError("That import is not allowed in the visualizer.")
    return _real_import(name, globals, locals, fromlist, level)


SAFE_BUILTINS = {
    "abs": abs, "all": all, "any": any, "bool": bool, "chr": chr, "dict": dict,
    "divmod": divmod, "enumerate": enumerate, "filter": filter, "float": float,
    "format": format, "frozenset": frozenset, "getattr": getattr, "hasattr": hasattr,
    "hash": hash, "int": int, "isinstance": isinstance, "issubclass": issubclass,
    "iter": iter, "len": len, "list": list, "map": map, "max": max, "min": min,
    "next": next, "object": object, "ord": ord, "pow": pow, "print": print,
    "property": property, "range": range, "repr": repr, "reversed": reversed,
    "round": round, "set": set, "setattr": setattr, "slice": slice, "sorted": sorted,
    "staticmethod": staticmethod, "classmethod": classmethod, "str": str, "sum": sum,
    "super": super, "tuple": tuple, "type": type, "zip": zip, "vars": vars,
    "True": True, "False": False, "None": None,
    "Exception": Exception, "ValueError": ValueError, "TypeError": TypeError,
    "KeyError": KeyError, "IndexError": IndexError, "StopIteration": StopIteration,
    "ZeroDivisionError": ZeroDivisionError, "RuntimeError": RuntimeError,
    "AttributeError": AttributeError, "NameError": NameError,
    "__import__": safe_import,
    "__build_class__": __build_class__,
}


def jsonable(value, depth=0):
    if depth > 10:
        return repr(value)[:80]
    if value is True or value is False or value is None:
        return value
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value if len(value) < 200 else value[:197] + "..."
    if isinstance(value, (list, tuple)):
        return [jsonable(item, depth + 1) for item in list(value)[:40]]
    if isinstance(value, dict):
        out = {}
        for i, (key, item) in enumerate(value.items()):
            if i >= 20:
                break
            out[str(key)] = jsonable(item, depth + 1)
        return out
    if isinstance(value, set):
        return [jsonable(item, depth + 1) for item in list(value)[:40]]
    cls = getattr(getattr(value, "__class__", None), "__name__", "object")
    if cls == "function":
        return getattr(value, "__name__", "function")
    raw_dict = getattr(value, "__dict__", None)
    if isinstance(raw_dict, dict) and raw_dict:
        return jsonable(raw_dict, depth + 1)
    return repr(value)[:80]


def is_tree_shape(v):
    return isinstance(v, dict) and ("left" in v or "right" in v) and ("val" in v or "value" in v or "data" in v)


def is_tree_obj(v):
    d = getattr(v, "__dict__", None)
    if not isinstance(d, dict):
        return False
    return ("left" in d or "right" in d) and ("val" in d or "value" in d or "data" in d)


def is_adj_map(v):
    if not isinstance(v, dict) or not v or is_tree_shape(v):
        return False
    return all(isinstance(item, list) for item in v.values())


def flatten_tree_vals(node, out=None):
    if out is None:
        out = []
    if not isinstance(node, dict):
        return out
    val = node.get("val", node.get("value", node.get("data")))
    if val is not None:
        out.append(val)
    if isinstance(node.get("left"), dict):
        flatten_tree_vals(node["left"], out)
    if isinstance(node.get("right"), dict):
        flatten_tree_vals(node["right"], out)
    return out


def pick_tree(variables, frame=None):
    prefer = ("root", "node", "tree", "head", "curr", "current")
    for key in prefer:
        val = (variables or {}).get(key)
        if is_tree_shape(val):
            return val
    for val in (variables or {}).values():
        if is_tree_shape(val):
            return val
    if frame:
        for val in (frame.f_locals or {}).values():
            if is_tree_obj(val):
                return jsonable(val)
    return None


def pick_graph(variables, frame=None):
    prefer = ("graph", "adj", "adj_list", "edges")
    blobs = [variables or {}]
    if frame:
        gdict = {}
        for key, val in (frame.f_globals or {}).items():
            if str(key).startswith("_") or key == "__builtins__":
                continue
            gdict[str(key)] = jsonable(val)
        blobs.append(gdict)
    for blob in blobs:
        for key in prefer:
            val = blob.get(key)
            if is_adj_map(val):
                return val
        for val in blob.values():
            if is_adj_map(val):
                return val
    return None


def clean_locals(raw):
    skip = {"__builtins__", "__name__", "__package__", "__loader__", "__spec__", "__doc__", "__annotations__"}
    locals_out = {}
    self_dict = None
    for key, val in (raw or {}).items():
        if key in skip or (key.startswith("_") and key != "_"):
            continue
        if key == "self":
            maybe = getattr(val, "__dict__", None)
            if isinstance(maybe, dict):
                self_dict = maybe
            continue
        if callable(val) and not isinstance(val, (type,)):
            continue
        if isinstance(val, type):
            continue
        locals_out[str(key)] = jsonable(val)
    out = {}
    if isinstance(self_dict, dict):
        for sk, sv in self_dict.items():
            if str(sk).startswith("_"):
                continue
            out["self." + str(sk)] = jsonable(sv)
    out.update(locals_out)
    return out


def index_ast(tree):
    by_line = {}

    def add(node, kind):
        line = getattr(node, "lineno", None)
        if not line:
            return
        by_line.setdefault(line, []).append((kind, node))

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            add(node, "fn")
        elif isinstance(node, ast.ClassDef):
            add(node, "class")
        elif isinstance(node, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
            add(node, "assign")
        elif isinstance(node, ast.If):
            add(node, "if")
        elif isinstance(node, (ast.For, ast.AsyncFor, ast.While)):
            add(node, "loop")
        elif isinstance(node, ast.Compare):
            add(node, "compare")
        elif isinstance(node, ast.Return):
            add(node, "return")
        elif isinstance(node, ast.Call):
            add(node, "call-expr")
    return by_line


def subscript_index(node, frame):
    if not isinstance(node, ast.Subscript):
        return None
    inner = node.slice.value if isinstance(node.slice, ast.Index) else node.slice
    val = eval_node(inner, frame)
    try:
        return int(val)
    except Exception:
        return None


def assign_active_indices(node, frame):
    target = None
    if isinstance(node, ast.Assign) and node.targets:
        target = node.targets[0]
    elif isinstance(node, ast.AnnAssign):
        target = node.target
    elif isinstance(node, ast.AugAssign):
        target = node.target
    if target is None:
        return []
    targets = list(target.elts) if isinstance(target, ast.Tuple) else [target]
    indices = []
    for elt in targets:
        idx = subscript_index(elt, frame)
        if idx is not None:
            indices.append(idx)
    return indices


def assign_name(node):
    target = None
    if isinstance(node, ast.Assign) and node.targets:
        target = node.targets[0]
    elif isinstance(node, ast.AnnAssign):
        target = node.target
    elif isinstance(node, ast.AugAssign):
        target = node.target
    if isinstance(target, ast.Name):
        return target.id, False
    if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name):
        if target.value.id == "self":
            return target.attr, True
        return target.attr, False
    if isinstance(target, ast.Subscript) and isinstance(target.value, ast.Name):
        return target.value.id, False
    if isinstance(target, ast.Tuple):
        for elt in target.elts:
            if isinstance(elt, ast.Subscript) and isinstance(elt.value, ast.Name):
                return elt.value.id, False
            if isinstance(elt, ast.Name):
                return elt.id, False
    return None, False


def loop_target(node):
    if isinstance(node, (ast.For, ast.AsyncFor)) and isinstance(node.target, ast.Name):
        return node.target.id
    return None


def eval_node(node, frame):
    try:
        return eval(compile(ast.Expression(node), USER_FILE, "eval"), frame.f_globals, frame.f_locals)
    except Exception:
        return None


def pick_list(variables):
    for key, val in variables.items():
        if isinstance(val, list):
            return key, val
    return None, []


def compare_payload(node, frame):
    if not isinstance(node, ast.Compare) or not node.ops:
        return {}
    left = eval_node(node.left, frame)
    right = eval_node(node.comparators[0], frame)
    op = node.ops[0]
    op_map = {
        ast.Eq: "==", ast.NotEq: "!=", ast.Lt: "<", ast.LtE: "<=",
        ast.Gt: ">", ast.GtE: ">=", ast.Is: "==", ast.IsNot: "!=",
        ast.In: "includes", ast.NotIn: "!=",
    }
    symbol = op_map.get(type(op), "==")
    try:
        result = eval_node(node, frame)
    except Exception:
        result = None
    return {"valA": jsonable(left), "valB": jsonable(right), "op": symbol, "result": result}


def definition_only(tree):
    keep = []
    for node in tree.body:
        if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef, ast.Import, ast.ImportFrom)):
            keep.append(node)
    return ast.Module(body=keep, type_ignores=[])


def defined_names(tree):
    names = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            names.add(node.name)
    return names


def test_call_matches(tree, test_call):
    if not test_call:
        return False
    names = defined_names(tree)
    if not names:
        return False
    return any(name in test_call for name in names)


def is_print_call(node):
    return isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print"


def main():
    payload = json.load(sys.stdin)
    code = payload.get("code") or ""
    test_call = (payload.get("testCall") or "").strip()

    try:
        tree = ast.parse(code)
    except SyntaxError as err:
        print(json.dumps({
            "success": False,
            "errorType": "syntax",
            "line": err.lineno or 1,
            "rawError": err.msg or str(err),
        }))
        return

    by_line = index_ast(tree)
    events = []
    call_stack = []
    loop_counts = {}
    src_l = code.lower()
    if ".left" in code and ".right" in code:
        ds_type = "tree"
    elif re.search(r'(?<![a-z_])(adj(_list)?|graph|bfs|dfs)(?![a-z_])', src_l):
        ds_type = "graph"
    else:
        ds_type = "trace"
    initial = []
    last_return = None

    pending = [None]

    def snapshot(kind, line, frame, extra=None, return_value=None):
        extra = extra or {}
        variables = clean_locals(frame.f_locals if frame else {})
        values = []
        tree_snap = pick_tree(variables, frame)
        graph_snap = pick_graph(variables, frame)
        for key, val in (frame.f_locals if frame else {}).items():
            if key.startswith("_"):
                continue
            if isinstance(val, list) and not is_tree_obj(val):
                values = jsonable(val)
                break
        nonlocal ds_type, initial
        if tree_snap:
            ds_type = "tree"
            values = flatten_tree_vals(tree_snap)
            if not initial:
                initial = list(values)
        elif graph_snap:
            ds_type = "graph"
            values = list(graph_snap.keys())
            if not initial:
                initial = list(values)
        elif values:
            if ds_type not in ("tree", "graph"):
                ds_type = "array"
            if not initial:
                initial = list(values) if isinstance(values, list) else []
        active = []
        loop = None
        if extra.get("indices"):
            try:
                active = [int(i) for i in extra["indices"]]
            except Exception:
                active = []
        elif extra.get("loopIndex") is not None:
            try:
                active = [int(extra["loopIndex"])]
            except Exception:
                active = []
        elif extra.get("varName") and frame and extra.get("varName") in frame.f_locals:
            val = frame.f_locals.get(extra["varName"])
            list_name = None
            for key, raw in frame.f_locals.items():
                if isinstance(raw, list) and not key.startswith("_"):
                    list_name = key
                    try:
                        active = [raw.index(val)]
                    except Exception:
                        active = []
                    break
        if extra.get("current"):
            loop = {"current": extra["current"], "total": extra.get("total")}
        if extra.get("fromSelf") and extra.get("attr") and frame:
            obj = frame.f_locals.get("self")
            if obj is not None:
                extra["val"] = jsonable(getattr(obj, extra["attr"], None))
        elif extra.get("variable") and extra.get("variable") in variables:
            extra["val"] = variables[extra["variable"]]
        if extra.get("varName") and extra.get("varName") in variables:
            extra["varVal"] = variables[extra["varName"]]
        return {
            "type": kind,
            "line": line or 1,
            "payload": extra,
            "variables": variables,
            "dataStructure": {
                "type": ds_type,
                "values": values if values else [],
                "tree": tree_snap,
                "graph": graph_snap,
                "visited": extra.get("visited") or [],
            },
            "activeIndices": active,
            "callStack": list(call_stack),
            "loop": loop,
            "returnValue": jsonable(return_value) if return_value is not None else None,
        }

    def flush_pending(frame=None):
        event = pending[0]
        if not event:
            return
        extra = event.get("payload") or {}
        if frame is not None:
            event["variables"] = clean_locals(frame.f_locals)
            if extra.get("fromSelf") and extra.get("attr"):
                obj = frame.f_locals.get("self")
                if obj is not None:
                    extra["val"] = jsonable(getattr(obj, extra["attr"], None))
            elif extra.get("variable") and extra["variable"] in event["variables"]:
                extra["val"] = event["variables"][extra["variable"]]
            if extra.get("varName") and extra["varName"] in event["variables"]:
                extra["varVal"] = event["variables"][extra["varName"]]
            elif event.get("type") == "loop-iter":
                for kind, node in by_line.get(event.get("line"), []):
                    if kind == "loop":
                        target = loop_target(node)
                        if target and target in event["variables"]:
                            extra["varName"] = target
                            extra["varVal"] = event["variables"][target]
                        break
                values = []
                for key, val in frame.f_locals.items():
                    if not str(key).startswith("_") and isinstance(val, list):
                        values = jsonable(val)
                        break
                if values:
                    event["dataStructure"]["values"] = values
            tree_snap = pick_tree(event["variables"], frame)
            graph_snap = pick_graph(event["variables"], frame)
            if tree_snap:
                event["dataStructure"]["type"] = "tree"
                event["dataStructure"]["tree"] = tree_snap
                event["dataStructure"]["values"] = flatten_tree_vals(tree_snap)
            elif graph_snap:
                event["dataStructure"]["type"] = "graph"
                event["dataStructure"]["graph"] = graph_snap
                event["dataStructure"]["values"] = list(graph_snap.keys())
        events.append(event)
        pending[0] = None

    def queue_event(kind, line, frame, extra=None, return_value=None):
        if len(events) + (1 if pending[0] else 0) >= MAX_STEPS:
            raise RuntimeError("Maximum step limit reached (likely infinite loop).")
        if kind in ("call", "return"):
            flush_pending(frame)
            events.append(snapshot(kind, line, frame, extra, return_value))
            return
        flush_pending(frame)
        pending[0] = snapshot(kind, line, frame, extra, return_value)

    skip_frames = {"<genexpr>", "<listcomp>", "<dictcomp>", "<setcomp>", "<lambda>"}
    class_names = {node.name for node in tree.body if isinstance(node, ast.ClassDef)}

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != USER_FILE:
            return tracer
        if event not in ("call", "line", "return"):
            return tracer
        name = frame.f_code.co_name
        if name in skip_frames or name in class_names:
            return tracer
        if name == "<module>":
            if event == "return":
                flush_pending(frame)
            # Skip bottom-of-file setup so the story starts at the function.
            if defined_names(tree) or event in ("call", "return"):
                return tracer
        line = frame.f_lineno
        nodes = by_line.get(line, [])
        kinds = {kind for kind, _ in nodes}

        if event == "call":
            call_stack.append(name)
            args = []
            for arg_name in frame.f_code.co_varnames[:frame.f_code.co_argcount]:
                if arg_name == "self":
                    continue
                if arg_name in frame.f_locals:
                    args.append(jsonable(frame.f_locals[arg_name]))
            queue_event("call", line, frame, {"functionName": name, "fnName": name, "args": args})
            return tracer

        if event == "return":
            if name == "<module>":
                flush_pending(frame)
                return tracer
            if call_stack:
                call_stack.pop()
            nonlocal last_return
            last_return = arg
            queue_event("return", line, frame, {
                "functionName": name,
                "fnName": name,
                "value": jsonable(arg),
                "val": jsonable(arg),
            }, return_value=arg)
            return tracer

        extra = {}
        kind = "assign"
        if "class" in kinds or "fn" in kinds:
            flush_pending(frame)
            return tracer
        if "loop" in kinds:
            kind = "loop-iter"
            for k, node in nodes:
                if k == "loop":
                    target = loop_target(node)
                    if target and target in frame.f_locals:
                        extra["varName"] = target
                        extra["varVal"] = jsonable(frame.f_locals[target])
                    key = "%s:%s" % (frame.f_code.co_name, line)
                    loop_counts[key] = loop_counts.get(key, 0) + 1
                    extra["current"] = loop_counts[key]
                    if target in ("i", "idx", "index") and target in frame.f_locals:
                        extra["loopIndex"] = frame.f_locals.get(target)
                    break
        elif "if" in kinds:
            kind = "branch"
            for k, node in nodes:
                if k == "if":
                    extra["taken"] = bool(eval_node(node.test, frame))
                    test = node.test
                    if isinstance(test, ast.UnaryOp) and isinstance(test.op, ast.Not) and isinstance(test.operand, ast.Name):
                        extra["negatedName"] = test.operand.id
                        extra["negatedVal"] = jsonable(frame.f_locals.get(test.operand.id))
                    elif isinstance(test, ast.Compare):
                        extra.update(compare_payload(test, frame))
                    break
        elif "compare" in kinds:
            kind = "compare"
            for k, node in nodes:
                if k == "compare":
                    extra.update(compare_payload(node, frame))
                    break
        elif "assign" in kinds:
            kind = "assign"
            for k, node in nodes:
                if k == "assign":
                    name, from_self = assign_name(node)
                    if name:
                        extra["attr"] = name
                        extra["fromSelf"] = from_self
                        extra["variable"] = ("self." + name) if from_self else name
                        extra["name"] = extra["variable"]
                        if from_self:
                            obj = frame.f_locals.get("self")
                            if obj is not None:
                                extra["val"] = jsonable(getattr(obj, name, None))
                        elif name in frame.f_locals:
                            extra["val"] = jsonable(frame.f_locals.get(name))
                    indices = assign_active_indices(node, frame)
                    if indices:
                        extra["indices"] = indices
                    break
        elif "return" in kinds:
            flush_pending(frame)
            return tracer
        elif "call-expr" in kinds and all(is_print_call(node) for kind, node in nodes if kind == "call-expr"):
            flush_pending(frame)
            return tracer
        else:
            changed = [key for key in frame.f_locals.keys() if not str(key).startswith("_")]
            if changed:
                last = changed[-1]
                extra["variable"] = last
                extra["name"] = last
                extra["val"] = jsonable(frame.f_locals.get(last))

        if kind == "loop-iter":
            lists = [val for key, val in frame.f_locals.items() if not str(key).startswith("_") and isinstance(val, list)]
            if lists and extra.get("current") and extra["current"] > len(lists[0]):
                return tracer

        if kind == "assign" and not extra.get("variable"):
            flush_pending(frame)
            return tracer

        queue_event(kind, line, frame, extra)
        return tracer

    ns = {"__builtins__": SAFE_BUILTINS, "__name__": "__main__"}
    sink = io.StringIO()
    runtime_error = None
    infinite = False
    try:
        sys.settrace(tracer)
        with contextlib.redirect_stdout(sink):
            if test_call_matches(tree, test_call):
                exec(compile(definition_only(tree), USER_FILE, "exec"), ns, ns)
                try:
                    eval(compile(test_call, TEST_FILE, "eval"), ns, ns)
                except SyntaxError:
                    exec(compile(test_call, TEST_FILE, "exec"), ns, ns)
            else:
                exec(compile(tree, USER_FILE, "exec"), ns, ns)
    except RuntimeError as err:
        runtime_error = str(err)
        infinite = "Maximum step" in str(err)
    except Exception as err:
        runtime_error = str(err)
    finally:
        sys.settrace(None)
        flush_pending()

    print(json.dumps({
        "success": True,
        "events": events,
        "dsType": ds_type,
        "initialData": initial,
        "lastReturn": jsonable(last_return),
        "isInfiniteLoop": infinite,
        "errorType": "infinite-loop" if infinite else ("runtime" if runtime_error else None),
        "rawError": runtime_error,
    }))


if __name__ == "__main__":
    main()
