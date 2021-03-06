import { Ref, useState } from "react";
import { hyperStyled } from "@macrostrat/hyper";
import {
  Button,
  NumericInput,
  InputGroup,
  TextArea,
  Spinner,
  FormGroup,
  Card,
  Drawer,
  Collapse,
} from "@blueprintjs/core";
import styles from "../comp.module.scss";
import { ColumnForm, ColumnGroupI } from "~/types";
import { ItemSuggest } from "../suggest";
import { RefI } from "~/types";
import pg, { usePostgrest } from "~/db";
import { RefEditor } from "../ref/ref-editor";
import { SubmitButton } from "..";
import { LngLatMap } from "./map";
import {
  Point,
  Pub,
  PublicationFinder,
} from "deps/ui-components/packages/form-components/src";
import { ModelEditor, useModelEditor } from "@macrostrat/ui-components";

const h = hyperStyled(styles);

interface Model {
  model: ColumnForm;
  actions: any;
  hasChanges: () => boolean;
}

interface RefDataI {
  value: string;
  data: RefI;
}

function formPubSelectText(ref: RefI) {
  const title = ref.ref?.length > 50 ? ref.ref.slice(0, 50) + "..." : ref.ref;

  return `${ref?.author}(${ref?.pub_year})-${title}`;
}

function ColumnRef() {
  const [open, setOpen] = useState(false);
  const [newRefOpen, setNewRefOpen] = useState(false);

  const { model, actions }: Model = useModelEditor();
  const refs: RefI[] = usePostgrest(
    pg.from("refs").select("id, pub_year, author, ref, doi, url")
  );

  if (!refs) return h(Spinner);

  const onClick = () => {
    setOpen(!open);
  };

  const onChange = (item: RefDataI) => {
    actions.updateState({ model: { ref: { $set: item.data } } });
  };

  const onPubFinderClick = async (e: Pub) => {
    const newRef: RefI = {
      ref: e.title,
      pub_year: e.year,
      author: e.author,
      doi: e.doi,
      url: e.link,
    };
    const { data, error } = await pg.from("refs").insert([newRef]);
    if (!error) {
      actions.updateState({ model: { ref: { $set: data[0] } } });
    }
    setOpen(false);
    setNewRefOpen(false);
  };

  // have the ref suggest as well as option to create new ref.
  return h("div", [
    h(ItemSuggest, {
      items: refs.map((ref) => {
        return { value: formPubSelectText(ref), data: ref };
      }),
      initialSelected: {
        value: model.ref ? formPubSelectText(model.ref) : "",
        data: model.ref || {},
      },
      onChange,
    }),
    h(Button, { onClick, icon: "plus" }),
    h(
      Drawer,
      {
        usePortal: true,
        isOpen: open,
        onClose: () => setOpen(false),
        title: "Add a new reference",
      },
      [
        h(
          "div",
          {
            style: {
              padding: "5px",
              display: "flex",
              flexDirection: "column",
            },
          },
          [
            h("div", [
              h("h3", { style: { marginBottom: 0 } }, [
                "Search for a Publication",
              ]),
              h(PublicationFinder, {
                onClick: onPubFinderClick,
              }),
            ]),
            h("div", [
              h(
                Button,
                {
                  minimal: true,
                  fill: true,
                  onClick: () => setNewRefOpen(!newRefOpen),
                },
                ["+ Can't find the paper, add it's details +"]
              ),
              h(Collapse, { isOpen: newRefOpen }, [h(NewRef)]),
            ]),
          ]
        ),
      ]
    ),
  ]);
}

function NewRef() {
  const { model, actions, hasChanges }: Model = useModelEditor();

  const persistChanges = async (e: RefI, c: Partial<RefI>) => {
    console.log("persistChanges!!");
    // would need to post ref to back as new ref first
    const { data, error } = await pg.from("refs").insert([e]);
    if (!error) {
      actions.updateState({ model: { ref: { $set: data[0] } } });
    }

    return e;
  };
  //@ts-ignore
  return h(RefEditor, { model: model.ref || {}, persistChanges });
}

function isDisabled(model: ColumnForm) {
  if (typeof model.col_name == "undefined") return true;
  if (typeof model.lat == "undefined" || typeof model.lng == "undefined")
    return true;
  if (typeof model.ref == "undefined") return false;
  return false;
}

function ColumnEdit({ curColGroup }: { curColGroup: Partial<ColumnGroupI> }) {
  const { model, actions, hasChanges }: Model = useModelEditor();

  const updateColumn = (field: string, e: any) => {
    actions.updateState({ model: { [field]: { $set: e } } });
  };

  const setCoords = (p: Point) => {
    const [long, lat] = p.geometry.coordinates;
    actions.updateState({
      model: { lng: { $set: long }, lat: { $set: lat } },
    });
  };

  return h(Card, [
    h("div.col-editor-container", [
      h("div.left", [
        h("h4", ["Column Group: ", curColGroup.col_group]),
        h("div", [
          h(
            FormGroup,
            { label: h("h4", { style: { margin: 0 } }, ["Column Name"]) },
            [
              h(InputGroup, {
                style: { width: "200px" },
                defaultValue: model.col_name || undefined,
                onChange: (e) => updateColumn("col_name", e.target.value),
              }),
            ]
          ),
        ]),
        h("div", [
          h(
            FormGroup,
            { label: h("h4", { style: { margin: 0 } }, ["Column Number"]) },
            [
              h(NumericInput, {
                style: { width: "200px" },
                defaultValue: model.col_number || undefined,
                onValueChange: (e) => updateColumn("col_number", e),
              }),
            ]
          ),
        ]),
        h("div", [
          h("td", [
            h("div", [
              h("h4", { style: { marginBottom: 0 } }, ["Notes"]),
              h(TextArea, {
                style: { width: "400px", height: "150px" },
                value: model.notes,
                onChange: (e) => updateColumn("notes", e.target.value),
              }),
            ]),
            h("div", [
              h("h4", { style: { marginBottom: 0 } }, [
                "Ref: ",
                model.ref?.ref ?? "",
              ]),
              h(ColumnRef),
            ]),
          ]),
        ]),
      ]),
      h("div.right", [
        h(Card, { style: { minWidth: "600px" }, elevation: 1 }, [
          h(LngLatMap, {
            longitude: model.lng ?? 0,
            latitude: model.lat ?? 0,
            onChange: (p: Point) => setCoords(p),
          }),
        ]),
      ]),
    ]),
    h(SubmitButton, { disabled: isDisabled(model) }),
  ]);
}

interface ColumnEditorProps {
  model: ColumnForm | {};
  curColGroup: Partial<ColumnGroupI>;
  persistChanges: (e: ColumnForm, c: Partial<ColumnForm>) => ColumnForm;
}

export function ColumnEditor(props: ColumnEditorProps) {
  return h(
    ModelEditor,
    {
      model: props.model,
      persistChanges: props.persistChanges,
      isEditing: true,
      canEdit: true,
    },
    [
      h(ColumnEdit, {
        curColGroup: props.curColGroup,
      }),
    ]
  );
}
