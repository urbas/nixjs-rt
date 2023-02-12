import { expect, test } from "@jest/globals";
import nixrt, { NixInt } from "./lib";

test("negative NixInt(1) equals to NixInt(-1)", () => {
  const result = nixrt.neg(new NixInt(1)) as NixInt;
  expect(result.value).toBe(-1);
});

test("negative float", () => {
  expect(nixrt.neg(2.5)).toBe(-2.5);
});

test("adds two NixInts", () => {
  const result = nixrt.add(new NixInt(1), new NixInt(2)) as NixInt;
  expect(result.value).toBe(3);
});

test("adds two floats", () => {
  expect(nixrt.add(1.0, 2.0)).toBe(3);
});

test("adds a NixInt and a float", () => {
  expect(nixrt.add(new NixInt(1), 2.0)).toBe(3.0);
  expect(nixrt.add(2.0, new NixInt(1))).toBe(3.0);
});

test("subtracts two NixInts", () => {
  const result = nixrt.sub(new NixInt(1), new NixInt(2)) as NixInt;
  expect(result.value).toBe(-1);
});

test("subtracts two floats", () => {
  expect(nixrt.sub(1.0, 2.0)).toBe(-1);
});

test("subtracts a NixInt and a float", () => {
  expect(nixrt.sub(new NixInt(1), 2.0)).toBe(-1);
  expect(nixrt.sub(2.0, new NixInt(1))).toBe(1);
});

test("subtracting non-numbers raises an exception", () => {
  expect(() => nixrt.sub("foo", 1)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.mul(1, "foo")).toThrow(nixrt.EvaluationException);
});

test("multiplies two NixInts", () => {
  const result = nixrt.mul(new NixInt(2), new NixInt(3)) as NixInt;
  expect(result.value).toBe(6);
});

test("multiplies two floats", () => {
  expect(nixrt.mul(2.0, 3.5)).toBe(7);
});

test("multiplies a NixInt and a float", () => {
  expect(nixrt.mul(new NixInt(2), 3.5)).toBe(7);
  expect(nixrt.mul(3.5, new NixInt(2))).toBe(7);
});

test("divides two NixInts", () => {
  const result = nixrt.div(new NixInt(5), new NixInt(2)) as NixInt;
  expect(result.value).toBe(2);
});

test("divides two floats", () => {
  expect(nixrt.div(5.0, 2)).toBe(2.5);
});

test("divides a NixInt and a float", () => {
  expect(nixrt.div(new NixInt(5), 2.0)).toBe(2.5);
  expect(nixrt.div(5.0, new NixInt(2))).toBe(2.5);
});

test("multiplying non-numbers raises an exception", () => {
  expect(() => nixrt.mul("foo", "bar")).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.mul("foo", 1.5)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.mul("foo", new NixInt(1))).toThrow(
    nixrt.EvaluationException
  );
});

test("dividing non-numbers raises an exception", () => {
  expect(() => nixrt.div("foo", "bar")).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.div("foo", 1.5)).toThrow(nixrt.EvaluationException);
  expect(() => nixrt.div("foo", new NixInt(1))).toThrow(
    nixrt.EvaluationException
  );
});

test("typeOf", () => {
  expect(nixrt.typeOf(new NixInt(1))).toBe("int");
  expect(nixrt.typeOf(5.0)).toBe("float");
  expect(nixrt.typeOf("a")).toBe("string");
  expect(nixrt.typeOf(true)).toBe("bool");
  expect(nixrt.typeOf(null)).toBe("null");
  expect(nixrt.typeOf([1, 2])).toBe("list");
  // TODO: cover other Nix types
});
