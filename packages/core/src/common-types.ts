/**
 * @internal
 */
export type ClassFactory<U, T> = (u: U) => T;

/**
 * @internal
 */
export type ClassConstructor<U, T> = { new (u: U): T };

/**
 * @internal
 */
export type ConstructorOrFactory<U, T> = ClassFactory<U, T> | ClassConstructor<U, T>;

/**
 * @internal
 */
export type PublicInterface<T> = { [K in keyof T]: T[K] };
