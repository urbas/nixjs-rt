import { expect, test } from "@jest/globals";
import nixrt, {
  NixAttrSet,
  NixBool,
  NixFloat,
  NixInt,
  NixList,
  NixNull,
  NixString,
} from "./lib";

// Arithmetic:
test("negative NixInt(1) equals to NixInt(-1)", () => {
  expect(new NixInt(1n).neg().number).toBe(-1);
});

test("negative float", () => {
  expect(new NixFloat(2.5).neg().number).toBe(-2.5);
});

test("negative non-number", () => {
  expect(() => new NixString("a").neg()).toThrow(nixrt.EvaluationException);
});

test("adds two NixInts", () => {
  expect(new NixInt(1n).add(new NixInt(2n)).number).toBe(3);
  expect(
    (
      new NixInt(4611686018427387904n).add(
        new NixInt(4611686018427387904n)
      ) as NixInt
    ).int64
  ).toBe(-9223372036854775808n);
});

test("adds two floats", () => {
  expect(new NixFloat(0.5).add(new NixFloat(2.5)).number).toBe(3);
});

test("adds a NixInt and a float", () => {
  expect(new NixInt(1n).add(new NixFloat(2.5)).number).toBe(3.5);
  expect(new NixFloat(2.5).add(new NixInt(1n)).number).toBe(3.5);
});

test("adds two strings", () => {
  expect(new NixString("a").add(new NixString("a")).value).toBe("aa");
});

test("subtracts two NixInts", () => {
  expect(new NixInt(1n).sub(new NixInt(2n)).number).toBe(-1);
  expect(
    (
      new NixInt(-4611686018427387904n).sub(
        new NixInt(4611686018427387905n)
      ) as NixInt
    ).int64
  ).toBe(9223372036854775807n);
});

test("subtracts two floats", () => {
  expect(new NixFloat(2.5).sub(new NixFloat(2.0)).number).toBe(0.5);
});

test("subtracts a NixInt and a float", () => {
  expect(new NixInt(1n).sub(new NixFloat(2.5)).number).toBe(-1.5);
  expect(new NixFloat(2.5).sub(new NixInt(1n)).number).toBe(1.5);
});

test("subtracting non-numbers raises an exception", () => {
  expect(() => new NixString("a").sub(new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixInt(1n).sub(new NixString("a"))).toThrow(
    nixrt.EvaluationException
  );
});

test("multiplies two NixInts", () => {
  expect(new NixInt(2n).mul(new NixInt(3n)).number).toBe(6);
});

test("multiplies two floats", () => {
  expect(new NixFloat(2.0).mul(new NixFloat(3.5)).number).toBe(7);
});

test("multiplies a NixInt and a float", () => {
  expect(new NixInt(2n).mul(new NixFloat(3.5)).number).toBe(7);
  expect(new NixFloat(3.5).mul(new NixInt(2n)).number).toBe(7);
});

test("multiplying non-numbers raises an exception", () => {
  expect(() => new NixString("a").mul(new NixString("a"))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixString("a").mul(new NixFloat(2.5))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixFloat(2.5).mul(new NixString("a"))).toThrow(
    nixrt.EvaluationException
  );
});

test("divides two NixInts", () => {
  expect(new NixInt(5n).div(new NixInt(2n)).number).toBe(2);
});

test("divides two floats", () => {
  expect(new NixFloat(5).div(new NixFloat(2)).number).toBe(2.5);
});

test("divides a NixInt and a float", () => {
  expect(new NixInt(5n).div(new NixFloat(2)).number).toBe(2.5);
  expect(new NixFloat(5).div(new NixInt(2n)).number).toBe(2.5);
});

test("dividing non-numbers raises an exception", () => {
  expect(() => new NixString("a").div(new NixString("a"))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixString("a").div(new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixString("a").div(new NixFloat(1))).toThrow(
    nixrt.EvaluationException
  );
});

// Boolean:
test("boolean and", () => {
  expect(NixBool.TRUE.and(NixBool.FALSE).value).toBe(false);
  expect(NixBool.TRUE.and(NixBool.TRUE).value).toBe(true);
  expect(NixBool.FALSE.and(new NixInt(1n)).value).toBe(false);
});

test("boolean and with non-booleans raises an exception", () => {
  expect(() => NixBool.TRUE.and(new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixInt(1n).and(NixBool.TRUE)).toThrow(
    nixrt.EvaluationException
  );
});

test("boolean implication", () => {
  expect(NixBool.FALSE.impl(NixBool.FALSE).value).toBe(true);
  expect(NixBool.FALSE.impl(NixBool.TRUE).value).toBe(true);
  expect(NixBool.TRUE.impl(NixBool.FALSE).value).toBe(false);
  expect(NixBool.TRUE.impl(NixBool.TRUE).value).toBe(true);
  expect(NixBool.FALSE.impl(new NixInt(1n)).value).toBe(true);
});

test("boolean impl with non-booleans raises an exception", () => {
  expect(() => NixBool.TRUE.impl(new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixInt(1n).impl(NixBool.TRUE)).toThrow(
    nixrt.EvaluationException
  );
});

test("boolean negation", () => {
  expect(NixBool.TRUE.not().value).toBe(false);
  expect(NixBool.FALSE.not().value).toBe(true);
});

test("boolean negation with non-booleans raises an exception", () => {
  expect(() => new NixInt(1n).not()).toThrow(nixrt.EvaluationException);
});

test("boolean or", () => {
  expect(NixBool.FALSE.or(NixBool.FALSE).value).toBe(false);
  expect(NixBool.FALSE.or(NixBool.TRUE).value).toBe(true);
  expect(NixBool.TRUE.or(NixBool.FALSE).value).toBe(true);
  expect(NixBool.TRUE.or(NixBool.TRUE).value).toBe(true);
  expect(NixBool.TRUE.or(new NixInt(1n)).value).toBe(true);
});

test("boolean or with non-booleans raises an exception", () => {
  expect(() => NixBool.FALSE.or(new NixInt(1n))).toThrow(
    nixrt.EvaluationException
  );
  expect(() => new NixInt(1n).or(NixBool.TRUE)).toThrow(
    nixrt.EvaluationException
  );
});

// Comparison:
test("'==' operator on numbers", () => {
  expect(new NixInt(1n).eq(new NixInt(1n)).value).toBe(true);
  expect(new NixInt(1n).eq(new NixInt(2n)).value).toBe(false);
  expect(new NixInt(1n).eq(new NixFloat(1)).value).toBe(true);
  expect(new NixInt(1n).eq(new NixFloat(1.1)).value).toBe(false);
  expect(new NixFloat(1).eq(new NixInt(1n)).value).toBe(true);
  expect(new NixFloat(1.1).eq(new NixInt(1n)).value).toBe(false);
  expect(new NixFloat(1).eq(new NixFloat(1.1)).value).toBe(false);
  expect(new NixFloat(1.1).eq(new NixFloat(1.1)).value).toBe(true);
  expect(new NixInt(1n).eq(new NixString("a")).value).toBe(false);
  expect(new NixFloat(1).eq(new NixString("a")).value).toBe(false);
});

test("'==' operator on booleans", () => {
  expect(NixBool.TRUE.eq(NixBool.TRUE).value).toBe(true);
  expect(NixBool.TRUE.eq(NixBool.FALSE).value).toBe(false);
});

test("'==' operator on strings", () => {
  expect(new NixString("").eq(new NixString("")).value).toBe(true);
  expect(new NixString("a").eq(new NixString("b")).value).toBe(false);
  expect(new NixString("a").eq(new NixInt(1n)).value).toBe(false);
});

test("'==' operator on lists", () => {
  expect(new NixList([]).eq(NixList.EMPTY).value).toBe(true);
  expect(new NixList([]).eq(NixBool.TRUE).value).toBe(false);
  expect(NixList.EMPTY.eq(new NixList([new NixInt(1n)])).value).toBe(false);
  expect(
    new NixList([new NixInt(1n)]).eq(new NixList([new NixInt(2n)])).value
  ).toBe(false);
  expect(
    new NixList([new NixInt(1n)]).eq(new NixList([new NixInt(1n)])).value
  ).toBe(true);
  expect(
    new NixList([new NixList([new NixInt(1n)])]).eq(
      new NixList([new NixList([new NixInt(1n)])])
    ).value
  ).toBe(true);
});

test("'==' operator on nulls", () => {
  expect(NixNull.NULL.eq(NixNull.NULL).value).toBe(true);
  expect(NixNull.NULL.eq(new NixInt(1n)).value).toBe(false);
  expect(new NixString("a").eq(NixNull.NULL).value).toBe(false);
});

test("'==' operator on attrsets", () => {
  expect(nixrt.eq(new Map(), new Map())).toBe(true);
  expect(nixrt.eq(new Map(), new Map([["a", 1]]))).toBe(false);
  expect(nixrt.eq(new Map([["a", 1]]), new Map([["a", 2]]))).toBe(false);
});

test("'!=' operator", () => {
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
  expect(new NixInt(1n).typeOf()).toBe("int");
  expect(new NixFloat(5.0).typeOf()).toBe("float");
  expect(new NixString("a").typeOf()).toBe("string");
  expect(NixBool.TRUE.typeOf()).toBe("bool");
  expect(NixNull.NULL.typeOf()).toBe("null");
  expect(new NixList([NixBool.TRUE, new NixInt(1n)]).typeOf()).toBe("list");
  expect(NixAttrSet.EMPTY.typeOf()).toBe("set");
  // TODO: cover other Nix types
});
