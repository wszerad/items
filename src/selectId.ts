export type StrOrNum = string | number

export type SelectId<E> = (entity: E) => StrOrNum

export function defaultSelectId<E extends { id: I }, I = E['id']>(entity: E) {
  return entity.id
}
