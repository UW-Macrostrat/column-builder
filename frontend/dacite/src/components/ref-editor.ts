import { hyperStyled } from "@macrostrat/hyper";
import { Table } from "../index";
import {
  Button,
  NumericInput,
  TextArea,
  InputGroup,
} from "@blueprintjs/core";
import {
  ModelEditor,
  useModelEditor,
  ModelEditButton,
  //@ts-ignore
} from "@macrostrat/ui-components/lib/esm";
import styles from "./comp.module.scss";
import { RefI } from "../types";

const h = hyperStyled(styles);

interface Model {
  model: RefI;
  actions: any;
  hasChanges: () => boolean;
}

function RefEdit() {
  const { model, actions, hasChanges }: Model = useModelEditor();
  //author: text, year: numeric (validation), ref:textArea, doi:text, url:text

  const updateRef = (field: string, e: any) => {
    actions.updateState({ model: { [field]: { $set: e } } });
  };

  return h("div", [
    h(Table, { interactive: false }, [
      h("tbody", [
        h("tr", [
          h("td", [h("h4", ["Author"])]),
          h("td", [
            h(InputGroup, {
              style: { width: "200px" },
              defaultValue: model.author || undefined,
              onChange: (e) => updateRef("author", e.target.value),
            }),
          ]),
          h("td", [h("h4", ["Pub Year"])]),
          h("td", [
            h(NumericInput, {
              style: { width: "200px" },
              defaultValue: model.pub_year || undefined,
              onValueChange: (e) => updateRef("pub_year", e),
            }),
          ]),
        ]),
        h("tr", [
          h("td", [h("h4.strat-name", "Ref ")]),
          h("td", { colSpan: 3 }, [
            h(TextArea, { onChange: (e) => updateRef("ref", e.target.value) }),
          ]),
        ]),
        h("tr", [
          h("td", [h("h4", ["DOI"])]),
          h("td", [
            h(InputGroup, {
              style: { width: "200px" },
              defaultValue: model.doi || undefined,
              onChange: (e) => updateRef("doi", e.target.value),
            }),
          ]),
          h("td", [h("h4", ["URL"])]),
          h("td", [
            h(InputGroup, {
              style: { width: "200px" },
              defaultValue: model.url || undefined,
              onChange: (e) => updateRef("url", e.target.value),
            }),
          ]),
        ]),
      ]),
    ]),
    h(
      Button,
      {
        intent: "success",
        disabled: !hasChanges(),
        onClick: () => actions.persistChanges(),
      },
      ["Submit"]
    ),
  ]);
}

interface RefEditorProps {
  model: RefI | {};
  persistChanges: (e: RefI, c: Partial<RefI>) => RefI;
}

export function RefEditor(props: RefEditorProps) {
  return h(
    ModelEditor,
    {
      model: props.model,
      persistChanges: props.persistChanges,
      isEditing: true,
      canEdit: true,
    },
    [h(RefEdit)]
  );
}
