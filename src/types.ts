/**
 * Reusable types intended for use throughout the process go here.
 */

/**
 * type helper, extracts embedded array types
 */
export type Unpack<ArrType extends readonly unknown[]> =
  ArrType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Type helper, creates a type with the same keys as another type,
 * but all string type properties. This is the type of express query
 * parameters before they are coerced to appropriate types
 *
 * TODO: capture that these query parameters can be objects or
 * arrays.
 */
export type ToStringParams<T> = {
  [Property in keyof T]: string;
};
