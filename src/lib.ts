// Types:
export class NixInt {
  value: BigInt64Array;

  constructor(value: bigint) {
    this.value = new BigInt64Array(1);
    this.value[0] = value;
  }

  get number(): number {
    return Number(this.value[0]);
  }

  get int64(): bigint {
    return this.value[0];
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
    return new NixInt(-operand.value[0]);
  }
  return -operand;
}

export function add(lhs: any, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.int64 + rhs.int64);
    }
    return lhs.number + rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs + rhs.number;
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
      return new NixInt(lhs.int64 - rhs.int64);
    }
    return lhs.number - rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs - rhs.number;
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
      return new NixInt(lhs.int64 * rhs.int64);
    }
    return lhs.number * rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs * rhs.number;
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
      return new NixInt(lhs.int64 / rhs.int64);
    }
    return lhs.number / rhs;
  }
  if (rhs instanceof NixInt) {
    return lhs / rhs.number;
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

// Comparison:
export function eq(lhs: any, rhs: any): boolean {
  switch (typeof lhs) {
    case "number":
      if (typeof rhs === "number") {
        return lhs === rhs;
      } else if (rhs instanceof NixInt) {
        return lhs === rhs.number;
      }
      return false;
    case "object":
      return _object_eq(lhs, rhs);
    default:
      return lhs === rhs;
  }
}

function _object_eq(lhs: Object, rhs: any): boolean {
  if (lhs instanceof Map) {
    return rhs instanceof Map && _attrsets_eq(lhs, rhs);
  }
  if (Array.isArray(lhs)) {
    return Array.isArray(rhs) && _arrays_eq(lhs, rhs);
  }
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return lhs.int64 === rhs.int64;
    }
    return lhs.number === rhs;
  }
  return lhs === rhs;
}

function _arrays_eq(lhs: Array<any>, rhs: Array<any>): boolean {
  if (lhs.length !== rhs.length) {
    return false;
  }
  for (let idx = 0; idx < lhs.length; idx++) {
    if (!eq(lhs[idx], rhs[idx])) {
      return false;
    }
  }
  return true;
}

function _attrsets_eq(lhs: Map<string, any>, rhs: Map<string, any>): boolean {
  if (lhs.size !== rhs.size) {
    return false;
  }
  for (const key of lhs.keys()) {
    if (!eq(lhs.get(key), rhs.get(key))) {
      return false;
    }
  }
  return true;
}

export function neq(lhs: any, rhs: any): boolean {
  return !eq(lhs, rhs);
}

export function less(lhs: any, rhs: any): boolean {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return lhs.value < rhs.value;
    }
    if (typeof rhs !== "number") {
      _throwLessThanTypeError(lhs, rhs);
    }
    return lhs.value < rhs;
  }
  if (rhs instanceof NixInt) {
    if (typeof lhs !== "number") {
      _throwLessThanTypeError(lhs, rhs);
    }
    return lhs < rhs.value;
  }
  if (typeof lhs !== typeof rhs || lhs === null || rhs === null) {
    _throwLessThanTypeError(lhs, rhs);
  }
  return _equalTypesLess(lhs, rhs);
}

export function less_eq(lhs: any, rhs: any): boolean {
  return !less(rhs, lhs);
}

export function more(lhs: any, rhs: any): boolean {
  return less(rhs, lhs);
}

export function more_eq(lhs: any, rhs: any): boolean {
  return !less(lhs, rhs);
}

function _equalTypesLess(lhs: any, rhs: any): boolean {
  switch (typeof lhs) {
    case "object":
      if (Array.isArray(lhs)) {
        return _listLess(lhs, rhs);
      }
      _throwLessThanTypeError(lhs, rhs);
    case "boolean":
      _throwLessThanTypeError(lhs, rhs);
    default:
      return lhs < rhs;
  }
}

function _listLess(lhs: Array<any>, rhs: Array<any>): boolean {
  const minLen = Math.min(lhs.length, rhs.length);
  for (let idx = 0; idx < minLen; idx++) {
    const currentLhs = lhs[idx];
    const currentRhs = rhs[idx];
    if (less(currentLhs, currentRhs)) {
      return true;
    }
  }
  return lhs.length < rhs.length;
}

function _throwLessThanTypeError(lhs: any, rhs: any): void {
  throw new EvaluationException(
    `Cannot compare '${typeOf(lhs)}' with '${typeOf(rhs)}'.`
  );
}

// List:
export function concat(lhs: any, rhs: any): Array<any> {
  if (!Array.isArray(lhs) || !Array.isArray(rhs)) {
    throw new EvaluationException(
      `Cannot concatenate '${typeOf(lhs)}' and '${typeOf(rhs)}'.`
    );
  }
  return lhs.concat(rhs);
}

// Type functions:
export function typeOf(object: any): string {
  const object_type = typeof object;
  switch (object_type) {
    case "boolean":
      return "bool";
    case "number":
      return "float";
    case "object":
      if (object === null) {
        return "null";
      }
      if (object instanceof Map) {
        return "set";
      }
      if (object instanceof NixInt) {
        return "int";
      }
      if (Array.isArray(object)) {
        return "list";
      }
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

  // Comparison,
  eq,
  more_eq,
  more,
  less_eq,
  less,
  neq,

  // List,
  concat,

  // Type functions:
  typeOf,
};
