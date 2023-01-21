import { expect, test } from "@jest/globals";
import { add, NixInt } from "./lib";

test("adds 1 + 2 to equal 3", () => {
  const result = add(new NixInt(1), new NixInt(2)) as NixInt;
  expect(result.value).toBe(3);
});
