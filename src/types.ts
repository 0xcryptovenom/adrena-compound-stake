export type Mutable<Type> = {
  -readonly [Key in keyof Type]: Mutable<Type[Key]>;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type Class<T> = new (...args: any[]) => T;

// biome-ignore lint/complexity/noUselessTypeConstraint: <explanation>
// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type Compute<A extends any> = A extends Function
  ? A
  : { [K in keyof A]: A[K] } & unknown;
