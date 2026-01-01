export type Idable = string | number

export type SelectId<E, I extends Idable> = (entity: E) => I

export function defaultSelectId<E extends { id: I }, I = E['id']>(entity: E) {
  return entity.id
}
