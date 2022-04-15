import pg, {
  UnitsView,
  useTableSelect,
  tableInsert,
  tableUpdate,
  EnvironUnit,
  LithUnit,
  UnitEditorModel,
} from "../../src";
import {
  conductChangeSet,
  detectDeletionsAndAdditions,
} from "../../src/components/helpers";

export function getUnitData(unit_id: number) {
  console.log(unit_id);
  const units: UnitsView[] = useTableSelect({
    tableName: "units_view",
    match: { id: unit_id },
    limit: 1,
  });

  const envs: EnvironUnit[] = useTableSelect({
    tableName: "environ_unit",
    match: { unit_id: unit_id },
  });

  const liths: LithUnit[] = useTableSelect({
    tableName: "lith_unit",
    match: { unit_id: unit_id },
  });

  return { units, envs, liths };
}

/* 
handles insertions and deletions for
the one to many relationship between units and envs/liths
*/
async function handleCollections(
  table: string,
  column: string,
  unit_id: number,
  collection: EnvironUnit[] | LithUnit[],
  collectionChanges: EnvironUnit[] | LithUnit[]
) {
  const { deletions, additions } = detectDeletionsAndAdditions(
    collection,
    collectionChanges
  );

  if (additions.length > 0) {
    const inserts = additions.map((i) => {
      return { unit_id, environ_id: i };
    });
    const { data, error } = await tableInsert({
      tableName: table,
      row: inserts,
    });
  }
  if (deletions.length > 0) {
    const { data, error } = await pg
      .from(table)
      .delete()
      .in(column, deletions)
      .match({ unit_id });
  }
}

/* 
Function to handle changes to Units! This is a bit complicated because of the 
one to many relationship between a unit and environments and lithologies. We need to
conduct a small algorithm to figure out if any envs or liths with either deleted 
or added and then handle those changes
*/
export async function persistUnitChanges(
  unit: UnitsView,
  envs: EnvironUnit[],
  liths: LithUnit[],
  updatedModel: UnitEditorModel,
  changeSet: Partial<UnitEditorModel>
) {
  if (changeSet.unit) {
    const changes = conductChangeSet(unit, changeSet.unit);
    const { data, error } = await tableUpdate({
      tableName: "units",
      changes,
      id: unit.id,
    });
  }

  if (changeSet.envs) {
    await handleCollections(
      "unit_environs",
      "environ_id",
      unit.id,
      envs,
      changeSet.envs
    );
  }
  if (changeSet.liths) {
    await handleCollections(
      "unit_liths",
      "lith_id",
      unit.id,
      liths,
      changeSet.liths
    );
  }
  return updatedModel;
}
