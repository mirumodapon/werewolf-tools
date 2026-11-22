/** The same keys as `T` with string leaves: what a translation has to provide. */
export type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> }
