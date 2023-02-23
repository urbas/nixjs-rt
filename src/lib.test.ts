import { expect, test } from "@jest/globals";
import nixrt, { NixInt } from "./lib";

// Arithmetic:
test("unary '-' operator on integers", () => {
  const result = nixrt.neg(new NixInt(1n)) as NixInt;
  expect(result.number).toBe(-1);
});

test("unary '-' operator on floats", () => {
  expect(nixrt.neg(2.5)).toBe(-2.5);
});

test("unary '-' operator on non-numbers", () => {
  expect(() => nixrt.neg("a")).toThrow(nixrt.EvaluationException);
});

test("'+' operator on integers", () => {
  expect((nixrt.add(new NixInt(1n), new NixInt(2n)) as NixInt).number).toBe(3);
  expect(
    (
      nixrt.add(
        new NixInt(4611686018427387904n),
        new NixInt(4611686018427387904n)
      ) as NixInt
    ).int64
  ).toBe(-9223372036854775808n);
});

test("'+' operator on floats", () => {
  expect(nixrt.add(1.0, 2.0)).toBe(3);
});

test("'+' operator on mixed integers and floats", () => {
  expect(nixrt.add(new NixInt(1n), 2.0)).toBe(3.0);
  expect(nixrt.add(2.0, new NixInt(1n))).toBe(3.0);
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
  expect(() => nixrt.sub("foo", 1)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.mul(1, "foo")).toThrow(nixrt.EvaluationException);
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
  expect(() => nixrt.mul("foo", "bar")).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.mul("foo", 1.5)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.mul("foo", new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
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
  expect(() => nixrt.div("foo", "bar")).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.div("foo", 1.5)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.div("foo", new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
});

// Boolean:
test("'&&' operator on booleans", () => {
  expect(nixrt.and(true, false)).toBe(false);
  expect(nixrt.and(false, 1)).toBe(false); // emulates nix's behaviour
});

test("'&&' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.and(true, 1)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.and(1, true)).toThrow(nixrt.EvaluationException);
});

test("'->' operator on booleans", () => {
  expect(nixrt.implication(false, false)).toBe(true);
  expect(nixrt.implication(false, 1)).toBe(true); // emulates nix's behaviour
});

test("'->' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.implication(true, 1)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.implication(1, true)).toThrow(nixrt.EvaluationException);
});

test("'!' operator on booleans", () => {
  expect(nixrt.invert(false)).toBe(true);
});

test("'!' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.invert(1)).toThrow(nixrt.EvaluationException);
});

test("'||' operator on booleans", () => {
  expect(nixrt.or(true, false)).toBe(true);
  expect(nixrt.or(true, 1)).toBe(true); // emulates nix's behaviour
});

test("'||' operator on non-booleans raises exceptions", () => {
  expect(() => nixrt.or(false, 1)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.or(1, true)).toThrow(nixrt.EvaluationException);
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
  expect(() => nixrt.less(new NixInt(1n), true)).toThrow(
    nixrt.EvaluationException
  );
  expect(() => nixrt.less(true, new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => nixrt.less(true, 1.0)).toThrow(nixrt.EvaluationException);
});

test("'<' operator on strings", () => {
  expect(nixrt.less("a", "b")).toBe(true);
  expect(nixrt.less("foo", "b")).toBe(false);
});

test("'<' operator on booleans throws", () => {
  expect(() => nixrt.less(false, true)).toThrow(nixrt.EvaluationException);
});

test("'<' operator on null vlaues throws", () => {
  expect(() => nixrt.less(null, null)).toThrow(nixrt.EvaluationException);
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
});

test("'<' operator list invalid", () => {
  expect(() => nixrt.less([true], [1])).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.less([true], [false])).toThrow(nixrt.EvaluationException);
});

test("'<=' operator", () => {
  expect(nixrt.less_eq(1, 0)).toBe(false);
  expect(nixrt.less_eq(1, 1)).toBe(true);
  expect(nixrt.less_eq(1, 2)).toBe(true);
});

test("'>=' operator", () => {
  expect(nixrt.more_eq(1, 0)).toBe(true);
  expect(nixrt.more_eq(1, 1)).toBe(true);
  expect(nixrt.more_eq(1, 2)).toBe(false);
});

test("'>' operator", () => {
  expect(nixrt.more(1, 0)).toBe(true);
  expect(nixrt.more(1, 1)).toBe(false);
  expect(nixrt.more(1, 2)).toBe(false);
});

// List:
test("list concatenation and", () => {
  const list_1 = [1];
  const list_2 = [2];
  expect(nixrt.concat(list_1, list_2)).toStrictEqual([1, 2]);
  // Here's we're verifying that neither of the operands is mutated.
  expect(list_1).toStrictEqual([1]);
  expect(list_2).toStrictEqual([2]);
});

test("concatenating non-lists raises an exception", () => {
  expect(() => nixrt.concat([], 1)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.concat(true, [])).toThrow(nixrt.EvaluationException);
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
  // TODO: cover other Nix types
});
