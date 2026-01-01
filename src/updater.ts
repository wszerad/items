export type UpdateFn<E> = (entity: E) => E
export type Updater<E, I> = UpdateFn<E> | Partial<E>

export function update<E, I>(entity: E, updater: Updater<E, I>) {
  return { ...entity, ...(typeof updater === 'function' ? updater(entity) : updater) }
}
