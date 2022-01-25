import h from "@macrostrat/hyper";
import pg, { usePostgrest, Row, UnitsView } from "../src";
import { useRouter } from "next/router";
import { Spinner } from "@blueprintjs/core";

function Units() {
  const router = useRouter();
  const { project_id, col_id, section_id } = router.query;
  const units: UnitsView[] = usePostgrest(
    pg
      .from("units_view")
      .select()
      .match({ section_id: section_id, col_id: col_id })
  );
  console.log(units);
  const headers = [
    "ID",
    "Strat Name",
    "Bottom Interval",
    "Top Interval",
    "Color",
    "Thickness",
  ];
  const onClick = (unit: UnitsView) => {
    console.log("edit", unit);
  };
  if (!units) return h(Spinner);
  return h("div", [
    h("h3", ["Units"]),
    h("div.table-container", [
      h(
        "table.bp3-html-table .bp3-html-table-bordered .bp3-interactive",
        { style: { width: "100%" } },
        [
          h("thead", [
            h("tr", [
              headers.map((head, i) => {
                return h("th", { key: i }, [head]);
              }),
            ]),
          ]),
          h("tbody", [
            units.map((unit, i) => {
              return h(Row, { key: i, onClick: () => onClick(unit) }, [
                h("td", [unit.id]),
                h("td", [unit.strat_name]),
                h("td", [unit.name_fo]),
                h("td", [unit.name_lo]),
                h("td", { style: { backgroundColor: unit.color } }, [
                  unit.color,
                ]),
                h("td", [`${unit.min_thick} - ${unit.max_thick}`]),
              ]);
            }),
          ]),
        ]
      ),
    ]),
  ]);
}

export default Units;