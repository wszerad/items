export type UpdateFn<E> = (entity: E) => E
export type Updater<I, E> = UpdateFn<E> | Partial<E>

export function update<I, E>(entity: E, updater: Updater<I, E>) {
  return { ...entity, ...(typeof updater === 'function' ? updater(entity) : updater) }
}
