type Arguments<T> = T extends (...args: infer A) => any ? A : never

export type Class<T> = {
  new(...args: Arguments<T>[]): T;
};

