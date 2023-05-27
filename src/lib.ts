// Types:
export class EvalException extends Error {
  readonly message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }
}

export type Body = (evalCtx: EvalCtx) => any;
export type Attrset = Map<string, any>;

interface Scope {
  lookup(name: string): any;
}

class InnerScope implements Scope {
  readonly lookupTable: Attrset;
  readonly parent: Scope;

  constructor(parentScope: Scope, lookupTable: Attrset) {
    this.lookupTable = lookupTable;
    this.parent = parentScope;
  }

  lookup(name: string) {
    const value = _strictSelect(this.lookupTable, name);
    if (value === undefined) return this.parent.lookup(name);
    return value;
  }
}

class GlobalScope implements Scope {
  lookup(name: string) {
    return undefined;
  }
}

export class EvalCtx implements Scope {
  /**
   * The absolute resolved path of the directory of the script that's currently being executed.
   */
  readonly scriptDir: string;
  readonly shadowScope: Scope;
  readonly nonShadowScope: Scope;

  constructor(
    scriptDir: string,
    shadowScope: Scope | undefined = undefined,
    nonShadowScope: Scope | undefined = undefined
  ) {
    this.scriptDir = scriptDir;
    this.shadowScope =
      shadowScope === undefined ? new GlobalScope() : shadowScope;
    this.nonShadowScope =
      nonShadowScope === undefined ? new GlobalScope() : nonShadowScope;
  }

  withShadowingScope(lookupTable: Attrset): EvalCtx {
    return new EvalCtx(
      this.scriptDir,
      new InnerScope(this.shadowScope, lookupTable),
      this.nonShadowScope
    );
  }

  withNonShadowingScope(lookupTable: Attrset): EvalCtx {
    return new EvalCtx(
      this.scriptDir,
      this.shadowScope,
      new InnerScope(this.nonShadowScope, lookupTable)
    );
  }

  lookup(name: string) {
    let value = this.shadowScope.lookup(name);
    if (value !== undefined) return value;
    value = this.nonShadowScope.lookup(name);
    if (value !== undefined) return value;
    throw new EvalException(`Could not find variable '${name}'.`);
  }
}

export abstract class NixType {
  abstract typeOf(): string;
}

export class NixInt extends NixType {
  readonly value: BigInt64Array;

  constructor(value: bigint) {
    super();
    this.value = new BigInt64Array(1);
    this.value[0] = value;
  }

  typeOf(): string {
    return "int";
  }

  get number(): number {
    return Number(this.value[0]);
  }

  get int64(): bigint {
    return this.value[0];
  }
}

export class Path extends NixType {
  readonly path: string;

  constructor(path: string) {
    super();
    this.path = path;
  }

  typeOf(): string {
    return "path";
  }
}

export class Lazy {
  body: Body;
  evalCtx: EvalCtx;
  value: any;

  constructor(evalCtx: EvalCtx, body: Body) {
    this.body = body;
    this.evalCtx = evalCtx;
  }

  getValue(): any {
    if (this.value === undefined) {
      this.value = this.body(this.evalCtx);
      // Now that we have evaluated this lazy value already, we don't have to do it again.
      // This means we can let go of the `body` and the `evalCtx` so they can be garbage-collected.
      this.body = undefined;
      this.evalCtx = undefined;
    }
    return this.value;
  }
}

// Arithmetic:
export function neg(operand: any): any {
  if (!isNumber(operand)) {
    throw new EvalException(`Cannot negate '${typeOf(operand)}'.`);
  }
  if (operand instanceof NixInt) {
    return new NixInt(-operand.value[0]);
  }
  return -operand;
}

export function add(evalCtx: EvalCtx, lhs: any, rhs: any): any {
  switch (typeof lhs) {
    case "number":
      if (typeof rhs === "number") return lhs + rhs;
      if (rhs instanceof NixInt) return lhs + rhs.number;
      throw new EvalException(illegalAddMsg(lhs, rhs));
    case "string":
      if (typeof rhs === "string") return lhs + rhs;
      // TODO: allow coercing 'Path' to string
      throw new EvalException(illegalAddMsg(lhs, rhs));
    case "object":
      return addObjectWith(evalCtx, lhs, rhs);
  }
  throw new EvalException(illegalAddMsg(lhs, rhs));
}

function addObjectWith(evalCtx: EvalCtx, lhs: object, rhs: any): any {
  if (lhs instanceof NixInt) {
    if (rhs instanceof NixInt) {
      return new NixInt(lhs.int64 + rhs.int64);
    }
    if (!isNumber(rhs)) {
      throw new EvalException(illegalAddMsg(lhs, rhs));
    }
    return lhs.number + rhs;
  }
  if (lhs instanceof Path) {
    if (typeof rhs === "string") return toPath(evalCtx, lhs.path + rhs);
    if (rhs instanceof Path)
      return toPath(evalCtx, joinPaths(lhs.path, rhs.path));
  }
  throw new EvalException(illegalAddMsg(lhs, rhs));
}

function illegalAddMsg(lhs: any, rhs: any) {
  return `Cannot add '${typeOf(lhs)}' to '${typeOf(rhs)}'.`;
}

export function sub(lhs: any, rhs: any): number | NixInt {
  if (!isNumber(lhs) || !isNumber(lhs)) {
    throw new EvalException(
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
    throw new EvalException(
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
    throw new EvalException(
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

// Attrset:
export function attrpath(...attrs: any[]): string[] {
  const invalidAttrSegment = attrs.find(
    (attrSegment) => attrSegment !== null && typeof attrSegment !== "string"
  );
  if (invalidAttrSegment !== undefined) {
    throw new EvalException(
      `Attribute name is of type '${typeOf(
        invalidAttrSegment
      )}' but a string was expected.`
    );
  }
  return attrs;
}

export function attrset(
  evalCtx: EvalCtx,
  entries: [string[], Body][]
): Attrset {
  return _buildAttrset(evalCtx, new Map(), entries);
}

// TODO: make it optional for attrset to be recursive.
export function recursiveAttrset(
  evalCtx: EvalCtx,
  entries: [string[], Body][]
): Attrset {
  const newAttrset = new Map();
  const innerCtx = evalCtx.withShadowingScope(newAttrset);
  return _buildAttrset(innerCtx, newAttrset, entries);
}

function _buildAttrset(
  evalCtx: EvalCtx,
  newAttrset: Attrset,
  entries: [string[], Body][]
): Attrset {
  for (const [attrpath, value] of entries) {
    _setAttrpath(newAttrset, attrpath, new Lazy(evalCtx, value));
  }
  return newAttrset;
}

export function has(theAttrset: any, attrPath: string[]): boolean {
  let foundValue = theAttrset;
  for (const attr of attrPath) {
    if (!(foundValue instanceof Map)) {
      return false;
    }
    // We're using `get` here instead of `_strictSelect` because we're not
    // interested in the value of the attribute but only whether the attribute
    // exists or not. So, no need to evaluate the attribute value.
    foundValue = foundValue.get(attr);
  }
  return foundValue !== undefined;
}

export function select(
  theAttrset: any,
  attrPath: string[],
  defaultValue: any | undefined
): any {
  const nestingDepth = attrPath.length - 1;
  for (let nestingLevel = 0; nestingLevel < nestingDepth; nestingLevel++) {
    const attr = attrPath[nestingLevel];
    // TODO: we should use `_strictSelect` here.
    let nestedMap = theAttrset.get(attr);
    if (!(nestedMap instanceof Map)) {
      theAttrset = undefined;
      break;
    }
    theAttrset = nestedMap;
  }

  let value = _strictSelect(theAttrset, attrPath[nestingDepth]);

  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new EvalException(`Attribute '${attrPath}' is missing.`);
    }
    return defaultValue;
  }

  return value;
}

function _strictSelect(theAttrset: Attrset, attrName: string): any {
  let foundValue = undefined;
  if (theAttrset !== undefined) {
    foundValue = theAttrset.get(attrName);
  }

  if (foundValue === undefined) {
    return undefined;
  }

  if (foundValue instanceof Lazy) {
    const strictValue = foundValue.getValue();
    theAttrset.set(attrName, strictValue);
    return strictValue;
  }

  return foundValue;
}

export function update(lhs: any, rhs: any): Attrset {
  if (!(lhs instanceof Map) || !(rhs instanceof Map)) {
    throw new EvalException(
      `Cannot apply operator '//' on '${typeOf(lhs)}' and '${typeOf(rhs)}'.`
    );
  }

  const resultMap = new Map(lhs);
  for (const entry of rhs) {
    resultMap.set(entry[0], entry[1]);
  }
  return resultMap;
}

function _setAttrpath(newAttrset: Attrset, attrpath: string[], value: any) {
  const nestingDepth = attrpath.length - 1;
  for (let nestingLevel = 0; nestingLevel < nestingDepth; nestingLevel++) {
    const attr = attrpath[nestingLevel];
    if (attr === null) {
      return;
    }
    // TODO: Using `_strictSelect` here is a  from nix's behaviour.
    // Nix currently throws an error while evaluating the following:
    //   { a = builtins.trace "Evaluated" {}; a.b = 1; }
    //   error: attribute 'a.b' already defined at
    // In similar vein, `nix` throws evaluating this expression:
    //   let c = {}; in { a = c; a.b = 1; }
    // We should reproduce this here.
    let nestedMap = _strictSelect(newAttrset, attr);
    if (nestedMap === undefined) {
      nestedMap = new Map<string, any>();
      newAttrset.set(attr, nestedMap);
    } else if (!(nestedMap instanceof Map)) {
      throw new EvalException(
        `Attribute '${attr}' is already defined and is not a attrset. Cannot set '${
          attrpath[nestingLevel + 1]
        }' inside.`
      );
    }
    newAttrset = nestedMap;
  }

  const lastAttr = attrpath[nestingDepth];
  if (lastAttr === null) {
    return;
  }
  if (newAttrset.has(lastAttr)) {
    throw new EvalException(`Attribute '${lastAttr}' already defined.`);
  }
  newAttrset.set(lastAttr, value);
}

// Boolean:
export function and(lhs: any, rhs: any): boolean {
  return asBoolean(lhs) && asBoolean(rhs);
}

export function implication(lhs: any, rhs: any): boolean {
  return !asBoolean(lhs) || asBoolean(rhs);
}

export function invert(operand: any): boolean {
  return !asBoolean(operand);
}

export function or(lhs: any, rhs: any): boolean {
  return asBoolean(lhs) || asBoolean(rhs);
}

export function asBoolean(operand: any): boolean {
  if (typeof operand !== "boolean") {
    throw new EvalException(
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

function _attrsets_eq(lhs: Attrset, rhs: Attrset): boolean {
  if (lhs.size !== rhs.size) {
    return false;
  }
  for (const key of lhs.keys()) {
    // TODO: We should likely use `_strictSelect` here.
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
  if (lhs === null || rhs === null) {
    _throwLessThanTypeError(lhs, rhs);
  }

  const lhsType = typeof lhs;
  const rhsType = typeof rhs;
  if (lhsType === rhsType) {
    return _equalTypesLess(lhs, rhs);
  }

  return _numberLess(lhs, rhs);
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
      return _numberLess(lhs, rhs);
    case "boolean":
      _throwLessThanTypeError(lhs, rhs);
    default:
      return lhs < rhs;
  }
}

function _numberLess(lhs: any, rhs: any): boolean {
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

  _throwLessThanTypeError(lhs, rhs);
}

function _listLess(lhs: Array<any>, rhs: Array<any>): boolean {
  const minLen = Math.min(lhs.length, rhs.length);
  for (let idx = 0; idx < minLen; idx++) {
    const currentLhs = lhs[idx];
    const currentRhs = rhs[idx];
    // This special-casing for booleans and nulls replicates nix's behaviour. Some examples:
    // - nix evaluates this: `[true] < [true] == false` rather than trowing an exception,
    // - the same for `[false] < [false] == false`, and
    // - the same for `[null] < [null] == false`.
    if (
      (currentLhs === true && currentRhs === true) ||
      (currentLhs === false && currentRhs === false)
    ) {
      continue;
    }
    if (currentLhs === null && currentRhs === null) {
      continue;
    }
    if (less(currentLhs, currentRhs)) {
      return true;
    }
  }
  return lhs.length < rhs.length;
}

function _throwLessThanTypeError(lhs: any, rhs: any): void {
  throw new EvalException(
    `Cannot compare '${typeOf(lhs)}' with '${typeOf(rhs)}'.`
  );
}

// Lambda:
export function paramLambda(
  evalCtx: EvalCtx,
  paramName: string,
  body: Body
): any {
  return (param) => {
    let paramScope = new Map();
    paramScope.set(paramName, param);
    return letIn(evalCtx, paramScope, body);
  };
}

export function patternLambda(
  evalCtx: EvalCtx,
  argsBind: string | undefined,
  patterns: [[string, any]],
  body: Body
): any {
  return (param: Attrset) => {
    let paramScope = new Map();
    for (const [paramName, defaultValue] of patterns) {
      // We are using `get` here instead of `_strictSelect` because we're adding the
      // parameter to the function's scope. The parameter might be unused inside function.
      let paramValue = param.get(paramName);
      if (paramValue === undefined) {
        if (defaultValue === undefined) {
          throw new EvalException(
            `Function called without required argument '${paramName}'.`
          );
        }
        paramValue = defaultValue;
      }
      paramScope.set(paramName, paramValue);
    }
    if (argsBind !== undefined) {
      paramScope.set(argsBind, param);
    }
    return letIn(evalCtx, paramScope, body);
  };
}

// Let in:
export function letIn(evalCtx: EvalCtx, attrs: Attrset, body: Body): any {
  return body(evalCtx.withShadowingScope(attrs));
}

// List:
export function concat(lhs: any, rhs: any): Array<any> {
  if (!Array.isArray(lhs) || !Array.isArray(rhs)) {
    throw new EvalException(
      `Cannot concatenate '${typeOf(lhs)}' and '${typeOf(rhs)}'.`
    );
  }
  return lhs.concat(rhs);
}

// Path:
export function toPath(evalCtx: EvalCtx, path: string): Path {
  if (!isAbsolutePath(path)) {
    path = joinPaths(evalCtx.scriptDir, path);
  }
  return new Path(normalizePath(path));
}

// String:
export function interpolate(value: any): string {
  if (typeof value !== "string") {
    throw new EvalException(`Cannot coerce '${typeOf(value)}' to a string.`);
  }
  return value;
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
      if (Array.isArray(object)) {
        return "list";
      }
      if (object instanceof NixType) {
        return object.typeOf();
      }
    default:
      return object_type;
  }
}

// Utilities:
export function toStrict(value: any): any {
  if (value instanceof Map) {
    return toStrictAttrset(value);
  }
  return value;
}

export function toStrictAttrset(theAttrset: Attrset): Attrset {
  for (const key of theAttrset.keys()) {
    const value = _strictSelect(theAttrset, key);
    toStrict(value);
  }
  return theAttrset;
}

function isNumber(object: any): boolean {
  return typeof object === "number" || object instanceof NixInt;
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith("/");
}

function joinPaths(abs_base: string, path: string): string {
  return `${abs_base}/${path}`;
}

function normalizePath(path: string): string {
  let segments = path.split("/");
  let normalizedSegments = new Array();
  for (const segment of segments) {
    switch (segment) {
      case "":
        break;
      case ".":
        break;
      case "..":
        normalizedSegments.pop();
        break;
      default:
        normalizedSegments.push(segment);
        break;
    }
  }
  return (isAbsolutePath(path) ? "/" : "") + normalizedSegments.join("/");
}

// With:
export function withExpr(
  evalCtx: EvalCtx,
  namespace: Attrset,
  body: Body
): any {
  return body(evalCtx.withNonShadowingScope(namespace));
}

export default {
  // Types:
  EvalCtx,
  EvalException,
  Lazy,
  NixInt,
  Path,

  // Arithmetic:
  add,
  div,
  mul,
  neg,
  sub,

  // Attrset:
  attrpath,
  attrset,
  has,
  recursiveAttrset,
  select,
  update,

  // Boolean:
  and,
  asBoolean,
  implication,
  invert,
  or,

  // Comparison:
  eq,
  more_eq,
  more,
  less_eq,
  less,
  neq,

  // Lambda:
  paramLambda,
  patternLambda,

  // Let in:
  letIn,

  // List:
  concat,

  // Path:
  toPath,

  // String:
  interpolate,

  // Type functions:
  typeOf,

  // Utilies:
  toStrict,
  toStrictAttrset,

  // With:
  withExpr,
};
