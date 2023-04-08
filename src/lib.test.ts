import { beforeEach, expect, test } from "@jest/globals";
import nixrt, { attrpath, attrset, EvalCtx, NixInt, Path } from "./lib";

let evalCtx: EvalCtx;

beforeEach(() => {
  evalCtx = testEvalCtx();
});

// Arithmetic:
test("unary '-' operator on integers", () => {
  const result = nixrt.neg(new NixInt(1n)) as NixInt;
  expect(result.number).toBe(-1);
});

test("unary '-' operator on floats", () => {
  expect(nixrt.neg(2.5)).toBe(-2.5);
});

test("unary '-' operator on non-numbers", () => {
  expect(() => nixrt.neg("a")).toThrow(nixrt.EvalException);
});

test("'+' operator on integers", () => {
  expect(
    (nixrt.add(evalCtx, new NixInt(1n), new NixInt(2n)) as NixInt).number
  ).toBe(3);
  expect(
    (
      nixrt.add(
        evalCtx,
        new NixInt(4611686018427387904n),
        new NixInt(4611686018427387904n)
      ) as NixInt
    ).int64
  ).toBe(-9223372036854775808n);
});

test("'+' operator on floats", () => {
  expect(nixrt.add(evalCtx, 1.0, 2.0)).toBe(3);
});

test("'+' operator on mixed integers and floats", () => {
  expect(nixrt.add(evalCtx, new NixInt(1n), 2.0)).toBe(3.0);
  expect(nixrt.add(evalCtx, 2.0, new NixInt(1n))).toBe(3.0);
});

test("'+' operator on mixed numbers and non-numbers", () => {
  expect(() => nixrt.add(evalCtx, "a", new NixInt(1n))).toThrow(
    nixrt.EvalException
  );
  expect(() => nixrt.add(evalCtx, new NixInt(1n), "a")).toThrow(
    nixrt.EvalException
  );
  expect(() => nixrt.add(evalCtx, 1, "a")).toThrow(nixrt.EvalException);
  expect(() => nixrt.add(evalCtx, "a", 1)).toThrow(nixrt.EvalException);
});

test("'+' operator on strings", () => {
  expect(nixrt.add(evalCtx, "a", "b")).toBe("ab");
});

test("'+' operator on paths and strings", () => {
  expect(nixrt.add(evalCtx, new Path("/"), "b")).toStrictEqual(new Path("/b"));
  expect(nixrt.add(evalCtx, new Path("/a"), "b")).toStrictEqual(
    new Path("/ab")
  );
  expect(nixrt.add(evalCtx, new Path("/"), "/")).toStrictEqual(new Path("/"));
  expect(nixrt.add(evalCtx, new Path("/"), ".")).toStrictEqual(new Path("/"));
  expect(nixrt.add(evalCtx, new Path("/"), "./a")).toStrictEqual(
    new Path("/a")
  );
});

test("'+' operator on paths", () => {
  expect(nixrt.add(evalCtx, new Path("/"), new Path("/a"))).toStrictEqual(
    new Path("/a")
  );
});

test("'-' operator on integers", () => {
  const result = nixrt.sub(new NixInt(1n), new NixInt(2n)) as NixInt;
  expect(result.number).toBe(-1);
});

test("'-' operator on floats", () => {
  expect(nixrt.sub(1.0, 2.0)).toBe(-1);
});

test("'-' operator on mixed integers and floats", () => {
  expect(nixrt.sub(new NixInt(1n), 2.0)).toBe(-1);
  expect(nixrt.sub(2.0, new NixInt(1n))).toBe(1);
});

test("'-' operator on non-numbers raises exceptions", () => {
  expect(() => nixrt.sub("foo", 1)).toThrow(nixrt.EvalException);
  expect(() => nixrt.mul(1, "foo")).toThrow(nixrt.EvalException);
});

test("'*' operator on integers", () => {
  const result = nixrt.mul(new NixInt(2n), new NixInt(3n)) as NixInt;
  expect(result.number).toBe(6);
});

test("'*' operator on floats", () => {
  expect(nixrt.mul(2.0, 3.5)).toBe(7);
});

test("'*' operator on mixed integers and floats", () => {
  expect(nixrt.mul(new NixInt(2n), 3.5)).toBe(7);
  expect(nixrt.mul(3.5, new NixInt(2n))).toBe(7);
});

test("'*' operator on non-numbers raises exceptions", () => {
  expect(() => nixrt.mul("foo", "bar")).toThrow(nixrt.EvalException);
  expect(() => nixrt.mul("foo", 1.5)).toThrow(nixrt.EvalException);
  expect(() => nixrt.mul("foo", new NixInt(1n))).toThrow(nixrt.EvalException);
});

test("'/' operator on integers", () => {
  const result = nixrt.div(new NixInt(5n), new NixInt(2n)) as NixInt;
  expect(result.number).toBe(2);
});

test("'/' operator on floats", () => {
  expect(nixrt.div(5.0, 2)).toBe(2.5);
});

test("'/' operator on mixed integers and floats", () => {
  expect(nixrt.div(new NixInt(5n), 2.0)).toBe(2.5);
  expect(nixrt.div(5.0, new NixInt(2n))).toBe(2.5);
});

test("'/' operator on non-numbers raises exceptions", () => {
  expect(() => nixrt.div("foo", "bar")).toThrow(nixrt.EvalException);
  expect(() => nixrt.div("foo", 1.5)).toThrow(nixrt.EvalException);
  expect(() => nixrt.div("foo", new NixInt(1n))).toThrow(nixrt.EvalException);
});

// Attrset:
test("attrset construction", () => {
  expect(attrset()).toStrictEqual(new Map());
  expect(attrset([attrpath("a"), 1])).toStrictEqual(new Map([["a", 1]]));
  expect(attrset([attrpath("a", "b"), 1])).toStrictEqual(
    new Map([["a", new Map([["b", 1]])]])
  );
});

test("attrsets ignore null attrs", () => {
  expect(attrset([attrpath(null, "a"), 1])).toStrictEqual(new Map());
  expect(attrset([attrpath(null), 1])).toStrictEqual(new Map());
  expect(attrset([attrpath("a", null), 1])).toStrictEqual(
    new Map([["a", new Map()]])
  );
});

test("attrset construction with repeated attrs throws", () => {
  expect(() => attrset([attrpath("a"), 1], [attrpath("a"), 1])).toThrow(
    nixrt.EvalException
  );
  expect(() => attrset([attrpath("a"), 1], [attrpath("a", "b"), 1])).toThrow(
    nixrt.EvalException
  );
});

test("attrset with non-string attrs throw", () => {
  expect(() => attrset([attrpath(1), 1])).toThrow(nixrt.EvalException);
});

test("'//' operator on attrsets", () => {
  expect(nixrt.update(attrset(), attrset())).toStrictEqual(new Map());
  expect(nixrt.update(attrset([attrpath("a"), 1]), attrset())).toStrictEqual(
    new Map([["a", 1]])
  );
  expect(
    nixrt.update(attrset([attrpath("a"), 1]), attrset([attrpath("b"), 2]))
  ).toStrictEqual(
    new Map([
      ["a", 1],
      ["b", 2],
    ])
  );
  expect(
    nixrt.update(attrset([attrpath("a"), 1]), attrset([attrpath("a"), 2]))
  ).toStrictEqual(new Map([["a", 2]]));
});

test("'//' operator on non-attrsets raises exceptions", () => {
  expect(() => nixrt.and(attrset(), 1)).toThrow(nixrt.EvalException);
  expect(() => nixrt.and(1, attrset())).toThrow(nixrt.EvalException);
});

test("'?' operator", () => {
  expect(nixrt.has(attrset(), attrpath("a"))).toBe(false);
  expect(nixrt.has(attrset([attrpath("a"), 1]), attrpath("a"))).toBe(true);
  expect(nixrt.has(attrset([attrpath("a"), 1]), attrpath("a", "b"))).toBe(
    false
  );
  expect(nixrt.has(attrset([attrpath("a", "b"), 1]), attrpath("a", "b"))).toBe(
    true
  );
});

test("'?' operator on other types returns false", () => {
  expect(nixrt.has(1, attrpath("a"))).toBe(false);
  expect(nixrt.has(1, attrpath("a"))).toBe(false);
});

test("'.' operator", () => {
  expect(
    nixrt.select(attrset([attrpath("a"), 1]), attrpath("a"), undefined)
  ).toBe(1);
  expect(
    nixrt.select(
      attrset([attrpath("a", "b"), 1]),
      attrpath("a", "b"),
      undefined
    )
  ).toBe(1);
  expect(nixrt.select(attrset(), attrpath("a"), 1)).toBe(1);
  expect(
    nixrt.select(attrset([attrpath("a", "a"), 1]), attrpath("a", "b"), 1)
  ).toBe(1);

  expect(
    nixrt.select(
      nixrt.attrset([nixrt.attrpath("a"), 1], [nixrt.attrpath("b", "c"), 2]),
      nixrt.attrpath("a", "c"),
      5
    )
  ).toBe(5);
});

test("'//' operator throws when attrpath doesn't exist", () => {
  expect(() => nixrt.select(attrset(), attrpath("a"), undefined)).toThrow(
    nixrt.EvalException
  );
});

// Boolean:
test("'&&' operator on booleans", () => {
  expect(nixrt.and(true, false)).toBe(false);
  expect(nixrt.and(false, 1)).toBe(false); // emulates nix's behaviour
});

test("'&&' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.and(true, 1)).toThrow(nixrt.EvalException);
  expect(() => nixrt.and(1, true)).toThrow(nixrt.EvalException);
});

test("'->' operator on booleans", () => {
  expect(nixrt.implication(false, false)).toBe(true);
  expect(nixrt.implication(false, 1)).toBe(true); // emulates nix's behaviour
});

test("'->' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.implication(true, 1)).toThrow(nixrt.EvalException);
  expect(() => nixrt.implication(1, true)).toThrow(nixrt.EvalException);
});

test("'!' operator on booleans", () => {
  expect(nixrt.invert(false)).toBe(true);
});

test("'!' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.invert(1)).toThrow(nixrt.EvalException);
});

test("'||' operator on booleans", () => {
  expect(nixrt.or(true, false)).toBe(true);
  expect(nixrt.or(true, 1)).toBe(true); // emulates nix's behaviour
});

test("'||' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.or(false, 1)).toThrow(nixrt.EvalException);
  expect(() => nixrt.or(1, true)).toThrow(nixrt.EvalException);
});

// Comparison:
test("'==' operator on numbers", () => {
  expect(nixrt.eq(1, 2)).toBe(false);
  expect(nixrt.eq(1, 1)).toBe(true);
  expect(nixrt.eq(new NixInt(1n), new NixInt(2n))).toBe(false);
  expect(nixrt.eq(new NixInt(1n), new NixInt(1n))).toBe(true);
  expect(nixrt.eq(new NixInt(1n), 1.1)).toBe(false);
  expect(nixrt.eq(new NixInt(1n), 1.0)).toBe(true);
  expect(nixrt.eq(1.0, new NixInt(1n))).toBe(true);
});

test("'==' operator on booleans", () => {
  expect(nixrt.eq(true, false)).toBe(false);
  expect(nixrt.eq(true, true)).toBe(true);
});

test("'==' operator on strings", () => {
  expect(nixrt.eq("", "")).toBe(true);
  expect(nixrt.eq("a", "b")).toBe(false);
});

test("'==' operator on lists", () => {
  expect(nixrt.eq([], [])).toBe(true);
  expect(nixrt.eq([1], [1])).toBe(true);
  expect(nixrt.eq([[1]], [[1]])).toBe(true);
  expect(nixrt.eq([1], [2])).toBe(false);
  expect(nixrt.eq([new NixInt(1n)], [new NixInt(1n)])).toBe(true);
  expect(nixrt.eq([new NixInt(1n)], [new NixInt(2n)])).toBe(false);
});

test("'==' operator on nulls", () => {
  expect(nixrt.eq(null, null)).toBe(true);
  expect(nixrt.eq(null, 1)).toBe(false);
  expect(nixrt.eq("a", null)).toBe(false);
});

test("'==' operator on attrsets", () => {
  expect(nixrt.eq(new Map(), new Map())).toBe(true);
  expect(nixrt.eq(new Map(), new Map([["a", 1]]))).toBe(false);
  expect(nixrt.eq(new Map([["a", 1]]), new Map([["a", 2]]))).toBe(false);
});

test("'!=' operator on floats", () => {
  expect(nixrt.neq(1, 2)).toBe(true);
  expect(nixrt.neq(1, 1)).toBe(false);
});

test("'<' operator on numbers", () => {
  expect(nixrt.less(1, 2)).toBe(true);
  expect(nixrt.less(new NixInt(1n), new NixInt(2n))).toBe(true);
  expect(nixrt.less(new NixInt(1n), 2)).toBe(true);
  expect(nixrt.less(1, new NixInt(2n))).toBe(true);
});

test("'<' operator on mixed-types throws", () => {
  expect(() => nixrt.less(new NixInt(1n), true)).toThrow(nixrt.EvalException);
  expect(() => nixrt.less(true, new NixInt(1n))).toThrow(nixrt.EvalException);
  expect(() => nixrt.less(true, 1.0)).toThrow(nixrt.EvalException);
});

test("'<' operator on strings", () => {
  expect(nixrt.less("a", "b")).toBe(true);
  expect(nixrt.less("foo", "b")).toBe(false);
});

test("'<' operator on booleans throws", () => {
  expect(() => nixrt.less(false, true)).toThrow(nixrt.EvalException);
});

test("'<' operator on null vlaues throws", () => {
  expect(() => nixrt.less(null, null)).toThrow(nixrt.EvalException);
});

test("'<' operator lists", () => {
  expect(nixrt.less([], [])).toBe(false);
  expect(nixrt.less([], [1])).toBe(true);
  expect(nixrt.less([1], [])).toBe(false);
  expect(nixrt.less([1], [1, 2])).toBe(true);
  expect(nixrt.less([1, 2], [1])).toBe(false);
  expect(nixrt.less([1, 1], [1, 2])).toBe(true);
  expect(nixrt.less([1, true], [1])).toBe(false);
  expect(nixrt.less([new NixInt(1n)], [new NixInt(2n)])).toBe(true);

  // This reproduces nix's observed behaviour
  expect(nixrt.less([true], [true])).toBe(false);
  expect(nixrt.less([false], [false])).toBe(false);
  expect(nixrt.less([false, 1], [false, 2])).toBe(true);
  expect(nixrt.less([null], [null])).toBe(false);
});

test("'<' operator list invalid", () => {
  expect(() => nixrt.less([true], [1])).toThrow(nixrt.EvalException);
  expect(() => nixrt.less([true], [false])).toThrow(nixrt.EvalException);
});

test("'<=' operator", () => {
  expect(nixrt.less_eq(1, 0)).toBe(false);
  expect(nixrt.less_eq(1, 1)).toBe(true);
  expect(nixrt.less_eq(1, 2)).toBe(true);

  // This reproduces nix's observed behaviour
  expect(nixrt.less_eq([true], [true])).toBe(true);
  expect(nixrt.less_eq([null], [null])).toBe(true);
});

test("'>=' operator", () => {
  expect(nixrt.more_eq(1, 0)).toBe(true);
  expect(nixrt.more_eq(1, 1)).toBe(true);
  expect(nixrt.more_eq(1, 2)).toBe(false);

  // This reproduces nix's observed behaviour
  expect(nixrt.more_eq([true], [true])).toBe(true);
  expect(nixrt.more_eq([null], [null])).toBe(true);
});

test("'>' operator", () => {
  expect(nixrt.more(1, 0)).toBe(true);
  expect(nixrt.more(1, 1)).toBe(false);
  expect(nixrt.more(1, 2)).toBe(false);
});

// Lambda:
test("parameter lambda", () => {
  expect(
    nixrt.paramLambda(evalCtx, "foo", (evalCtx) => evalCtx.lookup("foo"))(42)
  ).toBe(42);
});

test("pattern lambda", () => {
  const arg = nixrt.attrset([nixrt.attrpath("a"), 1]);
  expect(
    nixrt.patternLambda(evalCtx, undefined, [["a", undefined]], (evalCtx) =>
      evalCtx.lookup("a")
    )(arg)
  ).toBe(1);
});

test("pattern lambda with default values", () => {
  const arg = nixrt.attrset();
  expect(
    nixrt.patternLambda(evalCtx, undefined, [["a", 1]], (evalCtx) =>
      evalCtx.lookup("a")
    )(arg)
  ).toBe(1);
});

test("pattern lambda with missing parameter", () => {
  let innerCtx = evalCtx.withShadowingScope(
    nixrt.attrset([nixrt.attrpath("a"), 1])
  );
  expect(() =>
    nixrt.patternLambda(innerCtx, undefined, [["a", undefined]], (evalCtx) =>
      evalCtx.lookup("a")
    )(nixrt.attrset())
  ).toThrow(nixrt.EvalException);
});

test("pattern lambda with arguments binding", () => {
  const arg = nixrt.attrset([nixrt.attrpath("a"), 1]);
  expect(
    nixrt.patternLambda(evalCtx, "args", [["a", undefined]], (evalCtx) =>
      nixrt.select(evalCtx.lookup("args"), nixrt.attrpath("a"), undefined)
    )(arg)
  ).toBe(1);
});

// List:
test("'++' operator", () => {
  const list_1 = [1];
  const list_2 = [2];
  expect(nixrt.concat(list_1, list_2)).toStrictEqual([1, 2]);
  // Here's we're verifying that neither of the operands is mutated.
  expect(list_1).toStrictEqual([1]);
  expect(list_2).toStrictEqual([2]);
});

test("'++' operator on non-lists raises exceptions", () => {
  expect(() => nixrt.concat([], 1)).toThrow(nixrt.EvalException);
  expect(() => nixrt.concat(true, [])).toThrow(nixrt.EvalException);
});

// Path:
test("toPath on absolute paths", () => {
  expect(nixrt.toPath(evalCtx, "/a")).toStrictEqual(new Path("/a"));
  expect(nixrt.toPath(evalCtx, "/./a/../b")).toStrictEqual(new Path("/b"));
  expect(nixrt.toPath(evalCtx, "//./a//..///b/")).toStrictEqual(new Path("/b"));
});

test("toPath transforms relative paths with 'joinPaths'", () => {
  expect(nixrt.toPath(evalCtx, "a")).toStrictEqual(new Path("/test_base/a"));
});

// Scope:
test("variable not in global scope", () => {
  expect(() => evalCtx.lookup("foo")).toThrow(nixrt.EvalException);
});

test("variable in shadowing scope", () => {
  expect(evalCtx.withShadowingScope(new Map([["foo", 1]])).lookup("foo")).toBe(
    1
  );
});

// String:
test("string interpolation on non-stringy values raises exceptions", () => {
  expect(() => nixrt.interpolate(1)).toThrow(nixrt.EvalException);
  expect(() => nixrt.interpolate(true)).toThrow(nixrt.EvalException);
});

// Type functions:
test("typeOf", () => {
  expect(nixrt.typeOf(new NixInt(1n))).toBe("int");
  expect(nixrt.typeOf(5.0)).toBe("float");
  expect(nixrt.typeOf("a")).toBe("string");
  expect(nixrt.typeOf(true)).toBe("bool");
  expect(nixrt.typeOf(null)).toBe("null");
  expect(nixrt.typeOf([1, 2])).toBe("list");
  expect(nixrt.typeOf(new Map())).toBe("set");
  expect(nixrt.typeOf(new Path("/"))).toBe("path");
  // TODO: cover other Nix types
});

// With:
test("'with' expression puts attrs into scope", () => {
  const namespace = nixrt.attrset([nixrt.attrpath("a"), 1]);
  expect(
    nixrt.withExpr(evalCtx, namespace, (evalCtx) => evalCtx.lookup("a"))
  ).toBe(1);
});

test("'with' expression does not shadow variables", () => {
  const namespace = nixrt.attrset([nixrt.attrpath("a"), 1]);
  let outerCtx = evalCtx.withShadowingScope(
    nixrt.attrset([nixrt.attrpath("a"), 2])
  );
  expect(
    nixrt.withExpr(outerCtx, namespace, (evalCtx) => evalCtx.lookup("a"))
  ).toBe(2);
});

test("'with' expressions shadow themselves", () => {
  const outerNamespace = nixrt.attrset([nixrt.attrpath("a"), 1]);
  const innerNamespace = nixrt.attrset([nixrt.attrpath("a"), 2]);
  const innerExpr = (evalCtx) =>
    nixrt.withExpr(evalCtx, innerNamespace, (evalCtx) => evalCtx.lookup("a"));
  expect(nixrt.withExpr(evalCtx, outerNamespace, innerExpr)).toBe(2);
});

function testEvalCtx() {
  return new EvalCtx("/test_base");
}
