const rounded = (value) => Number.isFinite(value) ? Number(value.toPrecision(6)) : null

export function getCatalogValidationRows(objects) {
  return objects.map((object) => ({
    id: object.id,
    name: object.nameKo,
    distancePc: rounded(object.distancePc),
    actualXpc: rounded(object.actualCartesian?.x),
    actualYpc: rounded(object.actualCartesian?.y),
    actualZpc: rounded(object.actualCartesian?.z),
    renderX: rounded(object.renderPosition?.x),
    renderY: rounded(object.renderPosition?.y),
    renderZ: rounded(object.renderPosition?.z),
    source: object.sourceName,
  }))
}

export function logCatalogValidation(objects) {
  if (!import.meta.env?.DEV) return
  console.table(getCatalogValidationRows(objects))
}
