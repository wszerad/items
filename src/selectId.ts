export type SelectId<I, E> = (entity: E) => I

export function defaultSelectId<I, E extends { id: I }>(entity: E) {
  return entity.id
}
