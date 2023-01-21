export class NixInt {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}

// This is the implementation of the binary `+` operator in Nix.
export function add(lhs: any, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.value + rhs.value);
    }
  }
  return lhs;
}

export default {
  add: add,
  NixInt: NixInt,
};
