// Types:
export class EvaluationException extends Error {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }
}

export abstract class NixType {
  // Arithmetic Operators
  add(other: NixType): NixType {
    throw new EvaluationException(
      `Cannot add '${this.typeOf()}' and '${other.typeOf()}'.`
    );
  }

  and(other: NixType): NixBool {
    throw new EvaluationException(
      `Cannot apply logical 'and' on '${this.typeOf()}' and '${other.typeOf()}'.`
    );
  }

  div(other: NixType): NixType {
    throw new EvaluationException(
      `Cannot divide '${this.typeOf()}' and '${other.typeOf()}'.`
    );
  }

  abstract eq(other: NixType): NixBool;

  impl(other: NixType): NixBool {
    throw new EvaluationException(
      `Cannot apply logical implication on '${this.typeOf()}' and '${other.typeOf()}'.`
    );
  }

  mul(other: NixType): NixType {
    throw new EvaluationException(
      `Cannot multiply '${this.typeOf()}' and '${other.typeOf()}'.`
    );
  }

  neg(): NixType {
    throw new EvaluationException(`Cannot negate '${this.typeOf()}'.`);
  }

  not(): NixType {
    throw new EvaluationException(
      `Cannot apply logical 'not' on '${this.typeOf()}'.`
    );
  }

  or(other: NixType): NixBool {
    throw new EvaluationException(
      `Cannot apply logical 'or' on '${this.typeOf()}' and '${other.typeOf()}'.`
    );
  }

  sub(other: NixType): NixType {
    throw new EvaluationException(
      `Cannot subtract '${this.typeOf()}' and '${other.typeOf()}'.`
    );
  }

  // Builtins
  abstract typeOf(): string;
}

export class NixAttrSet extends NixType {
  value: Map<string, NixType>;

  static EMPTY = new NixAttrSet(new Map());

  constructor(value: Map<string, NixType>) {
    super();
    this.value = value;
  }

  eq(other: NixType): NixBool {
    throw new Error("Method not implemented.");
  }

  typeOf(): string {
    return "set";
  }
}

export class NixBool extends NixType {
  value: boolean;

  static TRUE = new NixBool(true);
  static FALSE = new NixBool(false);

  constructor(value: boolean) {
    super();
    this.value = value;
  }

  and(other: NixType): NixBool {
    if (!this.value) {
      return this;
    }
    if (other instanceof NixBool) {
      return other;
    }
    super.and(other);
  }

  eq(other: NixType): NixBool {
    if (other instanceof NixBool) {
      return NixBool.from(this.value === other.value);
    }
    return NixBool.FALSE;
  }

  static from(js_bool: boolean): NixBool {
    return js_bool ? NixBool.TRUE : NixBool.FALSE;
  }

  impl(other: NixType): NixBool {
    if (!this.value) {
      return NixBool.TRUE;
    }
    if (other instanceof NixBool) {
      return other;
    }
    super.impl(other);
  }

  not(): NixBool {
    return NixBool.from(!this.value);
  }

  or(other: NixType): NixBool {
    if (this.value) {
      return this;
    }
    if (other instanceof NixBool) {
      return other;
    }
    super.and(other);
  }

  typeOf(): string {
    return "bool";
  }
}

export abstract class NixNumber extends NixType {
  abstract get number(): number;
}

export class NixFloat extends NixNumber {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  get number(): number {
    return this.value;
  }

  add(other: NixType): NixFloat {
    if (other instanceof NixNumber) {
      return new NixFloat(this.value + other.number);
    }
    super.add(other);
  }

  div(other: NixType): NixFloat {
    if (other instanceof NixNumber) {
      return new NixFloat(this.value / other.number);
    }
    super.div(other);
  }

  eq(other: NixType): NixBool {
    if (other instanceof NixNumber) {
      return NixBool.from(this.value === other.number);
    }
    return NixBool.FALSE;
  }

  mul(other: NixType): NixFloat {
    if (other instanceof NixNumber) {
      return new NixFloat(this.value * other.number);
    }
    super.mul(other);
  }

  neg(): NixFloat {
    return new NixFloat(-this.value);
  }

  sub(other: NixType): NixFloat {
    if (other instanceof NixNumber) {
      return new NixFloat(this.value - other.number);
    }
    super.sub(other);
  }

  typeOf(): string {
    return "float";
  }
}

export class NixInt extends NixNumber {
  value: BigInt64Array;

  constructor(value: bigint) {
    super();
    this.value = new BigInt64Array(1);
    this.value[0] = value;
  }

  get number(): number {
    return Number(this.value[0]);
  }

  get int64(): bigint {
    return this.value[0];
  }

  add(other: NixType): NixNumber {
    if (other instanceof NixFloat) {
      return new NixFloat(this.number + other.number);
    }
    if (other instanceof NixInt) {
      return new NixInt(this.int64 + other.int64);
    }
    super.add(other);
  }

  div(other: NixType): NixNumber {
    if (other instanceof NixFloat) {
      return new NixFloat(this.number / other.number);
    }
    if (other instanceof NixInt) {
      return new NixInt(this.int64 / other.int64);
    }
    super.div(other);
  }

  eq(other: NixType): NixBool {
    if (!(other instanceof NixNumber)) {
      return NixBool.FALSE;
    }
    if (other instanceof NixInt) {
      return NixBool.from(this.int64 === other.int64);
    }
    if (other instanceof NixFloat) {
      return NixBool.from(this.number === other.number);
    }
    throw new Error("Unreachable");
  }

  mul(other: NixType): NixNumber {
    if (other instanceof NixFloat) {
      return new NixFloat(this.number * other.number);
    }
    if (other instanceof NixInt) {
      return new NixInt(this.int64 * other.int64);
    }
    super.mul(other);
  }

  neg(): NixInt {
    return new NixInt(-this.value[0]);
  }

  sub(other: NixType): NixNumber {
    if (other instanceof NixFloat) {
      return new NixFloat(this.number - other.number);
    }
    if (other instanceof NixInt) {
      return new NixInt(this.int64 - other.int64);
    }
    super.sub(other);
  }

  typeOf(): string {
    return "int";
  }
}

export class NixList extends NixType {
  value: NixType[];

  static EMPTY = new NixList([]);

  constructor(value: NixType[]) {
    super();
    this.value = value;
  }

  eq(other: NixType): NixBool {
    if (!(other instanceof NixList)) {
      return NixBool.FALSE;
    }
    if (this.value.length !== other.value.length) {
      return NixBool.FALSE;
    }
    const len = this.value.length;
    for (let idx = 0; idx < len; idx++) {
      if (!this.value[idx].eq(other.value[idx]).value) {
        return NixBool.FALSE;
      }
    }
    return NixBool.TRUE;
  }

  typeOf(): string {
    return "list";
  }
}

export class NixNull extends NixType {
  static NULL = new NixNull();

  eq(other: NixType): NixBool {
    return NixBool.from(other instanceof NixNull);
  }

  typeOf(): string {
    return "null";
  }
}

export class NixString extends NixType {
  value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  add(other: NixType): NixString {
    if (other instanceof NixString) {
      return new NixString(this.value + other.value);
    }
    super.add(other);
  }

  eq(other: NixType): NixBool {
    if (other instanceof NixString) {
      return NixBool.from(this.value === other.value);
    }
    return NixBool.FALSE;
  }

  typeOf(): string {
    return "string";
  }
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

export default {
  // Types:
  EvaluationException,
  NixAttrSet,
  NixBool,
  NixFloat,
  NixInt,
  NixList,
  NixNull,
  NixNumber,
  NixString,
  NixType,

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
