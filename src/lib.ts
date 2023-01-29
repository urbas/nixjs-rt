export class NixInt {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}

// Arithmetic:
export function neg(operand: any): any {
  if (operand instanceof NixInt) {
    return new NixInt(-operand.value);
  }
  return -operand;
}

export function add(lhs: any, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.value + rhs.value);
    }
  }
  return lhs + rhs;
}

export function sub(lhs: any, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.value - rhs.value);
    }
  }
  return lhs - rhs;
}

export function mul(lhs: any, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.value * rhs.value);
    }
  }
  return lhs * rhs;
}

export function div(lhs: any, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(Math.floor(lhs.value / rhs.value));
    }
  }
  return lhs / rhs;
}

export default {
  add,
  div,
  mul,
  neg,
  NixInt,
  sub,
};
