// Types:
export class EvalException extends Error {
  readonly message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }
}

export type Body = (evalCtx: EvalCtx) => NixType;

interface Scope {
  lookup(name: string): NixType | undefined;
}

class CompoundScope implements Scope {
  readonly childScope: Scope;
  readonly parent: Scope;

  constructor(parentScope: Scope, childScope: Scope) {
    this.childScope = childScope;
    this.parent = parentScope;
  }

  lookup(name: string): NixType | undefined {
    const value = this.childScope.lookup(name);
    if (value === undefined) return this.parent.lookup(name);
    return value;
  }
}

class GlobalScope implements Scope {
  lookup(name: string): NixType | undefined {
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

  withShadowingScope(lookupTable: Scope): EvalCtx {
    return new EvalCtx(
      this.scriptDir,
      new CompoundScope(this.shadowScope, lookupTable),
      this.nonShadowScope
    );
  }

  withNonShadowingScope(lookupTable: Scope): EvalCtx {
    return new EvalCtx(
      this.scriptDir,
      this.shadowScope,
      new CompoundScope(this.nonShadowScope, lookupTable)
    );
  }

  lookup(name: string): NixType {
    let value = this.shadowScope.lookup(name);
    if (value !== undefined) return value;
    value = this.nonShadowScope.lookup(name);
    if (value !== undefined) return value;
    throw new EvalException(`Could not find variable '${name}'.`);
  }
}

export abstract class NixType {
  /**
   * This method implements the `+` operator. It adds the `rhs` value to this value.
   */
  add(evalCtx: EvalCtx, rhs: NixType): NixType {
    // TODO: can we get rid of the EvalCtx? It's needed when joining paths. Maybe we can store
    // the required context needed by paths in themselves rather than passing it here?
    throw new EvalException(
      `Cannot add '${this.typeOf()}' to '${rhs.typeOf()}'.`
    );
  }

  and(rhs: any): NixBool {
    return _nixBoolFromJs(this.asBoolean() && rhs.asBoolean());
  }

  asBoolean(): boolean {
    throw new EvalException(
      `Value is '${this.typeOf()}' but a boolean was expected.`
    );
  }

  asString(): string {
    throw new EvalException(
      `Value is '${this.typeOf()}' but a string was expected.`
    );
  }

  div(rhs: NixType): NixInt | NixFloat {
    throw new EvalException(
      `Cannot divide '${this.typeOf()}' and '${rhs.typeOf()}'.`
    );
  }

  /**
   * This method implements the `==` operator. It compares the `rhs` value with this value for equality.
   */
  eq(rhs: NixType): NixBool {
    return FALSE;
  }

  has(attrPath: NixType[]): NixBool {
    return FALSE;
  }

  implication(rhs: NixType): NixBool {
    return _nixBoolFromJs(!this.asBoolean() || rhs.asBoolean());
  }

  invert(): NixBool {
    return _nixBoolFromJs(!this.asBoolean());
  }

  /**
   * This method implements the `<` operator. It checks whether the `rhs` value is lower than this value.
   */
  less(rhs: NixType): NixBool {
    throw new EvalException(
      `Cannot compare '${this.typeOf()}' with '${rhs.typeOf()}'.`
    );
  }

  lessEq(rhs: NixType): NixBool {
    return rhs.less(this).invert();
  }

  more(rhs: NixType): NixBool {
    return rhs.less(this);
  }

  moreEq(rhs: any): NixBool {
    return this.less(rhs).invert();
  }

  mul(rhs: NixType): NixInt | NixFloat {
    throw new EvalException(
      `Cannot multiply '${this.typeOf()}' and '${rhs.typeOf()}'.`
    );
  }

  neg(): NixInt | NixFloat {
    throw new EvalException(`Cannot negate '${this.typeOf()}'.`);
  }

  neq(rhs: NixType): NixBool {
    return this.eq(rhs).invert();
  }

  or(rhs: NixType): NixBool {
    return _nixBoolFromJs(this.asBoolean() || rhs.asBoolean());
  }

  select(attrPath: NixType[], defaultValue: NixType | undefined): NixType {
    throw new EvalException(`Cannot select attribute from '${this.typeOf()}'.`);
  }

  /**
   * This method implements the `-` operator. It subtracts the `rhs` value from this value.
   */
  sub(rhs: NixType): NixInt | NixFloat {
    throw new EvalException(
      `Cannot subtract '${this.typeOf()}' and '${rhs.typeOf()}'.`
    );
  }

  /**
   * Converts this Nix value into a JavaScript value.
   */
  abstract toJs(): any;

  /**
   * If this nix value is lazy this method computes the value stored
   * by the lazy value and returns it. Otherwise this method returns
   * the value itself.
   */
  toStrict(): NixType {
    return this;
  }

  /**
   * Returns a human-readable name of the type of this type.
   */
  abstract typeOf(): string;

  /**
   * Returns a new attrset whose attributes are a union of this attrset and the right-hand-side attrset.
   * The values are taken from the right-hand-side attrset or from this attrset. Values from the
   * right-hand-side attrset override values from this attrset.
   */
  update(rhs: NixType): Attrset {
    throw new EvalException(
      `Cannot merge '${this.typeOf()}' with '${rhs.typeOf()}'. Can only merge attrset with attrset.`
    );
  }
}

export class NixBool extends NixType {
  readonly value: boolean;

  constructor(value: boolean) {
    super();
    this.value = value;
  }

  override asBoolean(): boolean {
    return this.value;
  }

  typeOf(): string {
    return "bool";
  }

  toJs(): boolean {
    return this.value;
  }

  override eq(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (!(rhs instanceof NixBool)) {
      return FALSE;
    }
    return _nixBoolFromJs(this.value === rhs.value);
  }
}

export abstract class Attrset extends NixType implements Scope {
  override eq(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (!(rhs instanceof Attrset)) {
      return FALSE;
    }
    if (this.size() !== rhs.size()) {
      return FALSE;
    }
    for (const key of this.keys()) {
      if (!this.lookup(key).eq(rhs.lookup(key)).toJs()) {
        return FALSE;
      }
    }
    return TRUE;
  }

  /**
   * Returns raw lazy values without evaluating them.
   * Keys of this attrset will be strictly evaluated before this method returns.
   * @param attrName the attribute name (the key) for which to fetch the value.
   * @returns the value or the lazy placeholder of the value, or `undefined`, if the
   * attribute doesn't exist.
   */
  get(attrName: NixType): undefined | NixType {
    attrName = attrName.toStrict();
    if (!(attrName instanceof NixString)) {
      throw new EvalException(
        `Attribute name must be a string but '${attrName.typeOf()}' given.`
      );
    }
    return this.lookup(attrName.value);
  }

  /**
   * Same as the `get(attrName: NixType)` function, but the `attrName` parameter is
   * a JavaScript string.
   */
  lookup(attrName: string): NixType {
    return this.underlyingMap().get(attrName);
  }

  override has(attrPath: NixType[]): NixBool {
    let foundValue: NixType = this;
    for (const attrName of attrPath) {
      // It could be that the given value is still lazy. If we want to check
      // if the value is an attrset, we need to evaluate the Lazy value.
      foundValue = foundValue.toStrict();
      if (!(foundValue instanceof Attrset)) {
        return FALSE;
      }
      // We're using `get` here instead of `_strictSelect` because we're not
      // interested in the value of the attribute but only whether the attribute
      // exists or not. So, no need to evaluate the attribute value.
      foundValue = foundValue.get(attrName);
    }
    return _nixBoolFromJs(foundValue !== undefined);
  }

  /**
   * Returns an iterable of attribute names. The keys of this attrset will
   * all be strictly evaluated before this method returns the iterable.
   * Note that values will remain unevaluated (unless they are used in attribute
   * names).
   * @returns an iterable of attribute names in this attrset.
   */
  keys(): Iterable<string> {
    return this.underlyingMap().keys();
  }

  override select(
    attrPath: NixType[],
    defaultValue: NixType | undefined
  ): NixType {
    let curAttrset: Attrset = this;
    const nestingDepth = attrPath.length - 1;
    for (let nestingLevel = 0; nestingLevel < nestingDepth; nestingLevel++) {
      const attrName = attrPath[nestingLevel];
      let nestedValue = curAttrset.get(attrName);
      if (nestedValue === undefined) {
        return defaultValue;
      }
      let nestedAttrset = nestedValue.toStrict();
      if (!(nestedAttrset instanceof Attrset)) {
        return defaultValue;
      }
      curAttrset = nestedAttrset;
    }

    let value = curAttrset.get(attrPath[nestingDepth]);

    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new EvalException(`Attribute '${attrPath}' is missing.`);
      }
      return defaultValue;
    }

    return value;
  }

  /**
   * The number of keys in this attrset.
   */
  size(): number {
    return this.underlyingMap().size;
  }

  typeOf(): string {
    return "set";
  }

  /**
   * Returns a copy of this attrset as a strict (fully-evaluated) JavaScript Map.
   */
  toJs(): Map<string, any> {
    let jsMap = new Map();
    for (const key of this.keys()) {
      let value = this.lookup(key).toJs();
      jsMap.set(key, value);
    }
    return jsMap;
  }

  /**
   * Returns the underlying JS Map fully populated with strict keys (values will remain untouched, i.e. lazy).
   * This should return the actual backing map of this attrset, not a copy.
   */
  abstract underlyingMap(): Map<string, NixType>;

  override update(rhs: NixType): Attrset {
    rhs = rhs.toStrict();
    if (!(rhs instanceof Attrset)) {
      return super.update(rhs);
    }
    let mergedMap = new Map(this.underlyingMap());
    for (const attr of rhs.keys()) {
      mergedMap.set(attr, rhs.lookup(attr));
    }
    return new StrictAttrset(mergedMap);
  }
}

export class StrictAttrset extends Attrset {
  readonly map: Map<string, NixType>;

  constructor(map: Map<string, NixType>) {
    super();
    this.map = map;
  }

  underlyingMap(): Map<string, NixType> {
    return this.map;
  }
}

export const EMPTY_ATTRSET = new StrictAttrset(new Map());

class AttrsetBuilder {
  entries: [attrPath: Body[], value: Body][];
  evalCtx: EvalCtx;
  // The final map into which this builder will insert fully-evaluated
  // attrnames and their corresponding values.
  map: Map<string, NixType>;
  // The index of entry to be processed when building the attrset.
  pendingEntryIdx: number = 0;

  constructor(
    evalCtx: EvalCtx,
    isRecursive: boolean,
    entries: [attrPath: Body[], value: Body][]
  ) {
    this.entries = entries;
    this.evalCtx = isRecursive ? evalCtx.withShadowingScope(this) : evalCtx;
  }

  lookup(attrName: string): NixType {
    return this.build().get(attrName);
  }

  build(): Map<string, NixType> {
    // This method is re-entrant. This means that at any point while
    // evaluating this method, this method might be called again. So,
    // every re-entrant call must make some progress or detect
    // infinite recursion.
    let map = this.underlyingMap();
    while (this.pendingEntryIdx < this.entries.length) {
      const currentEntryIdx = this.pendingEntryIdx++;
      const [attrPath, value] = this.entries[currentEntryIdx];
      if (attrPath.length === 0) {
        throw new EvalException(
          "Cannot add an undefined attribute name to the attrset."
        );
      }
      const attrName = attrPath[0](this.evalCtx).toStrict();

      // It turns out `null` attrnames are ignored by nix.
      if (attrName === NULL) {
        continue;
      }

      const attrNameStr = attrName.asString();
      const existingValue = map.get(attrNameStr);
      let newValue = new Lazy(
        this.evalCtx,
        existingValue === undefined
          ? (ctx) => entryToValue(ctx, attrPath.slice(1), value)
          : (ctx) =>
              buildAttrset(
                ctx,
                attrNameStr,
                existingValue,
                entryToValue(ctx, attrPath.slice(1), value)
              )
      );
      map.set(attrNameStr, newValue);
    }
    return map;
  }

  underlyingMap(): Map<string, NixType> {
    if (this.map === undefined) {
      this.map = new Map();
    }
    return this.map;
  }
}

export class LazyAttrset extends Attrset {
  attrsetBuilder: AttrsetBuilder;
  map: Map<string, NixType>;

  constructor(
    evalCtx: EvalCtx,
    isRecursive: boolean,
    entries: [attrPath: Body[], value: Body][]
  ) {
    super();
    this.attrsetBuilder = new AttrsetBuilder(evalCtx, isRecursive, entries);
  }

  underlyingMap(): Map<string, NixType> {
    if (this.map === undefined) {
      this.map = this.attrsetBuilder.build();
      this.attrsetBuilder = undefined;
    }
    return this.map;
  }
}

export class NixFloat extends NixType {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  override add(evalCtx: EvalCtx, rhs: NixType): NixType {
    rhs = rhs.toStrict();
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.value + rhs.value);
    }
    if (rhs instanceof NixInt) {
      return new NixFloat(this.value + rhs.number);
    }
    return super.add(evalCtx, rhs);
  }

  override div(rhs: NixType): NixInt | NixFloat {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return new NixFloat(this.value / rhs.number);
    }
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.value / rhs.value);
    }
    return super.div(rhs);
  }

  override eq(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return _nixBoolFromJs(this.value === rhs.number);
    }
    if (rhs instanceof NixFloat) {
      return _nixBoolFromJs(this.value === rhs.value);
    }
    return FALSE;
  }

  override less(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return _nixBoolFromJs(this.value < rhs.number);
    }
    if (rhs instanceof NixFloat) {
      return _nixBoolFromJs(this.value < rhs.value);
    }
    return super.less(rhs);
  }

  override mul(rhs: NixType): NixFloat | NixInt {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return new NixFloat(this.value * rhs.number);
    }
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.value * rhs.value);
    }
    return super.mul(rhs);
  }

  override neg(): NixFloat | NixInt {
    return new NixFloat(-this.value);
  }

  override sub(rhs: NixType): NixInt | NixFloat {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return new NixFloat(this.value - rhs.number);
    }
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.value - rhs.value);
    }
    return super.sub(rhs);
  }

  toJs(): any {
    return this.value;
  }

  typeOf(): string {
    return "float";
  }
}

export class NixInt extends NixType {
  readonly value: BigInt64Array;

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

  override add(evalCtx: EvalCtx, rhs: NixType): NixType {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return new NixInt(this.int64 + rhs.int64);
    }
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.number + rhs.value);
    }
    return super.add(evalCtx, rhs);
  }

  override div(rhs: NixType): NixInt | NixFloat {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return new NixInt(this.int64 / rhs.int64);
    }
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.number / rhs.value);
    }
    return super.div(rhs);
  }

  override eq(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return _nixBoolFromJs(this.int64 === rhs.int64);
    }
    if (rhs instanceof NixFloat) {
      return _nixBoolFromJs(this.number === rhs.value);
    }
    return super.eq(rhs);
  }

  override less(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return _nixBoolFromJs(this.int64 < rhs.int64);
    }
    if (rhs instanceof NixFloat) {
      return _nixBoolFromJs(this.number < rhs.value);
    }
    return super.less(rhs);
  }

  override mul(rhs: NixType): NixInt | NixFloat {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return new NixInt(this.int64 * rhs.int64);
    }
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.number * rhs.value);
    }
    return super.mul(rhs);
  }

  override neg(): NixInt | NixFloat {
    return new NixInt(-this.int64);
  }

  override sub(rhs: NixType): NixInt | NixFloat {
    rhs = rhs.toStrict();
    if (rhs instanceof NixInt) {
      return new NixInt(this.int64 - rhs.int64);
    }
    if (rhs instanceof NixFloat) {
      return new NixFloat(this.number - rhs.value);
    }
    return super.sub(rhs);
  }

  toJs(): bigint {
    return this.int64;
  }

  typeOf(): string {
    return "int";
  }
}

export class NixList extends NixType {
  readonly values: NixType[];

  constructor(values: NixType[]) {
    super();
    this.values = values;
  }

  override eq(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (!(rhs instanceof NixList)) {
      return FALSE;
    }
    if (this.values.length !== rhs.values.length) {
      return FALSE;
    }
    for (let idx = 0; idx < this.values.length; idx++) {
      if (!this.values[idx].eq(rhs.values[idx]).toJs()) {
        return FALSE;
      }
    }
    return TRUE;
  }

  override less(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (!(rhs instanceof NixList)) {
      return super.less(rhs);
    }

    const minLen = Math.min(this.values.length, rhs.values.length);
    for (let idx = 0; idx < minLen; idx++) {
      const currentLhs = this.values[idx];
      const currentRhs = rhs.values[idx];
      // This special-casing for booleans and nulls replicates nix's behaviour. Some examples:
      // - nix evaluates this: `[true] < [true] == false` rather than trowing an exception,
      // - the same for `[false] < [false] == false`, and
      // - the same for `[null] < [null] == false`.
      if (
        (currentLhs === TRUE && currentRhs === TRUE) ||
        (currentLhs === FALSE && currentRhs === FALSE)
      ) {
        continue;
      }
      if (currentLhs === NULL && currentRhs === NULL) {
        continue;
      }
      if (currentLhs.less(currentRhs).toJs()) {
        return TRUE;
      }
    }
    return _nixBoolFromJs(this.values.length < rhs.values.length);
  }

  toJs(): NixType[] {
    return this.values;
  }

  typeOf(): string {
    return "list";
  }
}

export class NixNull extends NixType {
  override eq(rhs: NixType): NixBool {
    return _nixBoolFromJs(rhs.toStrict() instanceof NixNull);
  }

  toJs(): boolean {
    return null;
  }

  typeOf(): string {
    return "null";
  }
}

export const NULL = new NixNull();
export const TRUE = new NixBool(true);
export const FALSE = new NixBool(false);

export class NixString extends NixType {
  readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  override add(evalCtx: EvalCtx, rhs: NixType): NixType {
    rhs = rhs.toStrict();
    if (rhs instanceof NixString) {
      return new NixString(this.value + rhs.value);
    }
    return super.add(evalCtx, rhs);
  }

  override asString(): string {
    return this.value;
  }

  override eq(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (!(rhs instanceof NixString)) {
      return FALSE;
    }
    return _nixBoolFromJs(this.value === rhs.value);
  }

  override less(rhs: NixType): NixBool {
    rhs = rhs.toStrict();
    if (!(rhs instanceof NixString)) {
      return super.less(rhs);
    }
    return _nixBoolFromJs(this.value < rhs.value);
  }

  toJs(): string {
    return this.value;
  }

  typeOf(): string {
    return "string";
  }
}

export class Path extends NixType {
  readonly path: string;

  constructor(path: string) {
    super();
    this.path = path;
  }

  override add(evalCtx: EvalCtx, rhs: NixType): NixType {
    rhs = rhs.toStrict();
    if (rhs instanceof Path) {
      return toPath(evalCtx, joinPaths(this.path, rhs.path));
    }
    if (rhs instanceof NixString) {
      return toPath(evalCtx, this.path + rhs.value);
    }
    return this;
  }

  toJs() {
    return this.path;
  }

  typeOf(): string {
    return "path";
  }
}

export class Lazy extends NixType {
  body: Body;
  evalCtx: EvalCtx;
  value: NixType;

  constructor(evalCtx: EvalCtx, body: Body) {
    super();
    this.body = body;
    this.evalCtx = evalCtx;
  }

  override add(evalCtx: EvalCtx, rhs: NixType): NixType {
    return this.toStrict().add(evalCtx, rhs);
  }

  override asBoolean(): boolean {
    return this.toStrict().asBoolean();
  }

  override asString(): string {
    return this.toStrict().asString();
  }

  override div(rhs: NixType): NixInt | NixFloat {
    return this.toStrict().div(rhs);
  }

  override eq(rhs: NixType): NixBool {
    return this.toStrict().eq(rhs);
  }

  override less(rhs: NixType): NixBool {
    return this.toStrict().less(rhs);
  }

  override update(rhs: NixType): Attrset {
    return this.toStrict().update(rhs);
  }

  override mul(rhs: NixType): NixInt | NixFloat {
    return this.toStrict().mul(rhs);
  }

  override neg(): NixInt | NixFloat {
    return this.toStrict().neg();
  }

  override neq(rhs: NixType): NixBool {
    return this.toStrict().neq(rhs);
  }

  override select(
    attrPath: NixType[],
    defaultValue: NixType | undefined
  ): NixType {
    return this.toStrict().select(attrPath, defaultValue);
  }

  override sub(rhs: NixType): NixInt | NixFloat {
    return this.toStrict().sub(rhs);
  }

  toJs() {
    return this.toStrict().toJs();
  }

  override toStrict(): NixType {
    if (this.value === undefined) {
      this.value = this.body(this.evalCtx);
      // Now that we have evaluated this lazy value already, we don't have to do it again.
      // This means we can let go of the `body` and the `evalCtx` so they can be garbage-collected.
      this.body = undefined;
      this.evalCtx = undefined;

      // Let's flatten any nested lazy values.
      this.value = this.value.toStrict();
    }
    return this.value;
  }

  typeOf(): string {
    return this.toStrict().typeOf();
  }
}

// Attrset:
export function attrset(evalCtx: EvalCtx, entries: [Body[], Body][]): Attrset {
  return new LazyAttrset(evalCtx, false, entries);
}

export function recAttrset(
  evalCtx: EvalCtx,
  entries: [Body[], Body][]
): Attrset {
  return new LazyAttrset(evalCtx, true, entries);
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
    return letIn(evalCtx, new StrictAttrset(paramScope), body);
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
      let paramValue = param.lookup(paramName);
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
    return letIn(evalCtx, new StrictAttrset(paramScope), body);
  };
}

// Let in:
export function letIn(evalCtx: EvalCtx, attrs: Attrset, body: Body): NixType {
  return body(evalCtx.withShadowingScope(attrs));
}

// List:
export function concat(lhs: any, rhs: any): Array<any> {
  if (!Array.isArray(lhs) || !Array.isArray(rhs)) {
    throw new EvalException(
      `Cannot concatenate '${lhs.typeOf()}' and '${rhs.typeOf()}'.`
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

// Utilities:
export function recursiveStrict(value: NixType): NixType {
  if (value instanceof Attrset) {
    return recursiveStrictAttrset(value);
  }
  return value;
}

export function recursiveStrictAttrset(theAttrset: Attrset): Attrset {
  for (const key of theAttrset.keys()) {
    const value = theAttrset.lookup(key).toStrict();
    recursiveStrict(value);
  }
  return theAttrset;
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

function entryToValue(ctx: EvalCtx, attrPath: Body[], value: Body): NixType {
  if (attrPath.length === 0) {
    return new Lazy(ctx, value);
  }

  let attrName = attrPath[0](ctx).toStrict();

  // It turns out `null` attrnames are ignored by nix.
  if (attrName === NULL) {
    return EMPTY_ATTRSET;
  }

  let map = new Map();
  map.set(
    attrName.asString(),
    new Lazy(ctx, (ctx) => entryToValue(ctx, attrPath.slice(1), value))
  );
  return new StrictAttrset(map);
}

function buildAttrset(
  ctx: EvalCtx,
  attrName: string,
  lhsAttrset: NixType,
  rhsAttrset: NixType
): Attrset {
  lhsAttrset = lhsAttrset.toStrict();
  if (!(lhsAttrset instanceof Attrset)) {
    throw new EvalException(`Attribute '${attrName}' already defined.`);
  }
  rhsAttrset = rhsAttrset.toStrict();
  if (!(rhsAttrset instanceof Attrset)) {
    throw new EvalException(`Attribute '${attrName}' already defined.`);
  }

  let mergedMap = new Map(lhsAttrset.underlyingMap());
  for (const nestedAttrName of rhsAttrset.keys()) {
    let existingValue = mergedMap.get(nestedAttrName);
    let mergedNestedValue = rhsAttrset.lookup(nestedAttrName);
    if (existingValue !== undefined) {
      mergedNestedValue = new Lazy(ctx, (ctx) =>
        buildAttrset(
          ctx,
          `${attrName}.${nestedAttrName}`,
          existingValue,
          mergedNestedValue
        )
      );
    }
    mergedMap.set(nestedAttrName, mergedNestedValue);
  }
  return new StrictAttrset(mergedMap);
}

function _nixBoolFromJs(value: boolean): NixBool {
  return value ? TRUE : FALSE;
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
  // Constants:
  EMPTY_ATTRSET,
  FALSE,
  NULL,
  TRUE,

  // Types:
  Attrset,
  EvalCtx,
  EvalException,
  Lazy,
  LazyAttrset,
  NixBool,
  NixFloat,
  NixInt,
  NixList,
  NixNull,
  NixString,
  Path,
  StrictAttrset,

  // Attrset:
  attrset,
  recAttrset,

  // Lambda:
  paramLambda,
  patternLambda,

  // Let in:
  letIn,

  // List:
  concat,

  // Path:
  toPath,

  // Utilies:
  toStrict: recursiveStrict,
  toStrictAttrset: recursiveStrictAttrset,

  // With:
  withExpr,
};
