import { expect, test } from "@jest/globals";
import nixrt, { NixInt } from "./lib";

test("negative NixInt(1) equals to NixInt(-1)", () => {
  const result = nixrt.neg(new NixInt(1)) as NixInt;
  expect(result.value).toBe(-1);
});

test("adds two NixInts", () => {
  const result = nixrt.add(new NixInt(1), new NixInt(2)) as NixInt;
  expect(result.value).toBe(3);
});

test("adds two floats", () => {
  const result = nixrt.add(1.0, 2.0) as number;
  expect(result).toBe(3);
});

test("subtracts two NixInts", () => {
  const result = nixrt.sub(new NixInt(1), new NixInt(2)) as NixInt;
  expect(result.value).toBe(-1);
});

test("subtracts two floats", () => {
  const result = nixrt.sub(1.0, 2.0) as number;
  expect(result).toBe(-1);
});

test("multiplies two NixInts", () => {
  const result = nixrt.mul(new NixInt(2), new NixInt(3)) as NixInt;
  expect(result.value).toBe(6);
});

test("multiplies two floats", () => {
  const result = nixrt.mul(2.0, 3.5) as number;
  expect(result).toBe(7);
});

test("divides two NixInts", () => {
  const result = nixrt.div(new NixInt(5), new NixInt(2)) as NixInt;
  expect(result.value).toBe(2);
});

test("divides two floats", () => {
  const result = nixrt.div(5.0, 2) as number;
  expect(result).toBe(2.5);
});
