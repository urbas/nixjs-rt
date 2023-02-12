// Types:
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
  if (!isNumber(operand)) {
    throw new EvaluationException(`Cannot negate '${typeOf(operand)}'.`);
  }
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

export function sub(lhs: any, rhs: any): number | NixInt {
  if (!isNumber(lhs) || !isNumber(lhs)) {
    throw new EvaluationException(
      `Cannot subtract '${typeOf(lhs)}' and '${typeOf(rhs)}'.`
    );
  }
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

export function mul(lhs: any, rhs: any): number | NixInt {
  if (!isNumber(lhs) || !isNumber(rhs)) {
    throw new EvaluationException(
      `Cannot multiply '${typeOf(lhs)}' and '${typeOf(rhs)}'.`
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

export function div(lhs: any, rhs: any): number | NixInt {
  if (!isNumber(lhs) || !isNumber(rhs)) {
    throw new EvaluationException(
      `Cannot divide '${typeOf(lhs)}' and '${typeOf(rhs)}'.`
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

// Boolean:
export function and(lhs: any, rhs: any): boolean {
  return asBooleanOperand(lhs) && asBooleanOperand(rhs);
}

export function implication(lhs: any, rhs: any): boolean {
  return !asBooleanOperand(lhs) || asBooleanOperand(rhs);
}

export function invert(operand: any): boolean {
  return !asBooleanOperand(operand);
}

export function or(lhs: any, rhs: any): boolean {
  return asBooleanOperand(lhs) || asBooleanOperand(rhs);
}

function asBooleanOperand(operand: any): boolean {
  if (typeof operand !== "boolean") {
    throw new EvaluationException(
      `Value is '${typeOf(operand)}' but a boolean was expected.`
    );
  }
  return operand;
}

// List:
export function concat(lhs: any, rhs: any): any {
  if (!Array.isArray(lhs) || !Array.isArray(rhs)) {
    throw new EvaluationException(
      `Cannot concatenate '${typeOf(lhs)}' and '${typeOf(rhs)}'.`
    );
  }
  return lhs.concat(rhs);
}

// Type functions:
export function typeOf(object: any): string {
  if (object === null) {
    return "null";
  }
  if (object instanceof NixInt) {
    return "int";
  }
  if (Array.isArray(object)) {
    return "list";
  }
  const object_type = typeof object;
  switch (object_type) {
    case "boolean":
      return "bool";
    case "number":
      return "float";
    default:
      return object_type;
  }
}

function isNumber(object: any): boolean {
  return typeof object === "number" || object instanceof NixInt;
}

export default {
  // Types:
  EvaluationException,
  NixInt,

  // Arithmetic:
  add,
  div,
  mul,
  neg,
  sub,

  // Boolean,
  and,
  implication,
  invert,
  or,

  // List,
  concat,

  // Type functions:
  typeOf,
};
