export class NixInt {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}

export class EvaluationException extends Error {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
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
    return lhs.value + rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs + rhs.value;
  }
  return lhs + rhs;
}

export function sub(lhs: any, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.value - rhs.value);
    }
    return lhs.value - rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs - rhs.value;
  }
  return lhs - rhs;
}

export function mul(lhs: any, rhs: any): any {
  if (!isNixNumber(lhs) || !isNixNumber(rhs)) {
    throw new EvaluationException(
      `Cannot multiply '${typeof lhs}' and '${typeof rhs}'.`
    );
  }
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.value * rhs.value);
    }
    return lhs.value * rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs * rhs.value;
  }
  return lhs * rhs;
}

export function div(lhs: any, rhs: any): any {
  if (!isNixNumber(lhs) || !isNixNumber(rhs)) {
    throw new EvaluationException(
      `Cannot divide '${typeof lhs}' and '${typeof rhs}'.`
    );
  }
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(Math.floor(lhs.value / rhs.value));
    }
    return lhs.value / rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs / rhs.value;
  }
  return lhs / rhs;
}

function isNixNumber(object: any): boolean {
  return typeof object === "number" || object instanceof NixInt;
}

export default {
  add,
  div,
  EvaluationException,
  mul,
  neg,
  NixInt,
  sub,
};
