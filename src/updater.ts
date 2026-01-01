export type UpdateFn<E> = (entity: E) => E
export type Updater<E> = UpdateFn<E> | Partial<E>

export function update<E>(entity: E, updater: Updater<E>) {
  return { ...entity, ...(typeof updater === 'function' ? updater(entity) : updater) }
}
