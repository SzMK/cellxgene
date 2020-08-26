// @ts-expect-error ts-migrate(7016) FIXME: Try `npm install @types/react` if it exists or add... Remove this comment to see the full error message
import React from "react";
import { Colors } from "@blueprintjs/core";

import { AnnotationsHelpers } from "../../util/stateManager";

export function isLabelErroneous(label: any, metadataField: any, ontology: any, schema: any) {
  /*
    return false if this is a LEGAL/acceptable category name or NULL/empty string,
    or return an error type.
    */

  /* allow empty string */
  if (label === "") return false;

  /* check for label syntax errors, but allow terms in ontology */
  const termInOntology = ontology?.termSet.has(label) ?? false;
  const error = AnnotationsHelpers.annotationNameIsErroneous(label);
  if (error && !termInOntology) return error;

  /* disallow duplicates */
  const { obsByName } = schema.annotations;
  if (obsByName[metadataField].categories.indexOf(label) !== -1)
    return "duplicate";

  /* otherwise, no error */
  return false;
}

/* all other errors - map code to human error message */
const errorMessageMap = {
  "empty-string": "Blank names not allowed",
  duplicate: "Name must be unique",
  "trim-spaces": "Leading and trailing spaces not allowed",
  "illegal-characters":
    "Only alphanumeric and special characters (-_.) allowed",
  "multi-space-run": "Multiple consecutive spaces not allowed",
};

export function labelPrompt(err: any, prolog: any, epilog: any) {
  let errPrompt = null;
  if (err) {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    let errMsg = errorMessageMap[err] ?? "error";
    errMsg = errMsg[0].toLowerCase() + errMsg.slice(1);
    errPrompt = (
      // @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
      <span
        style={{
          marginTop: 7,
          color: Colors.ORANGE3,
        }}
      >
        {errMsg}
      {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
      </span>
    );
  }
  return (
    // @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
    <span>
      {prolog}
      {err ? " - " : null}
      {errPrompt}
      {epilog}
    {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
    </span>
  );
}
