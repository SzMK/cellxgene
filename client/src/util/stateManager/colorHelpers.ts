/*
Helper functions for the embedded graph colors
*/
// @ts-expect-error ts-migrate(7016) FIXME: Try `npm install @types/d3` if it exists or add a ... Remove this comment to see the full error message
import * as d3 from "d3";
// @ts-expect-error ts-migrate(7016) FIXME: Try `npm install @types/d3-scale-chromatic` if it ... Remove this comment to see the full error message
import { interpolateRainbow, interpolateCool } from "d3-scale-chromatic";
import memoize from "memoize-one";
import * as globals from "../../globals";
import parseRGB from "../parseRGB";
import { range } from "../range";

/*
given a color mode & accessor, generate an annoMatrix query that will
fulfill it
*/
export function createColorQuery(colorMode: any, colorByAccessor: any, schema: any) {
  if (!colorMode || !colorByAccessor || !schema) return null;
  switch (colorMode) {
    case "color by categorical metadata":
    case "color by continuous metadata": {
      return ["obs", colorByAccessor];
    }
    case "color by expression": {
      const varIndex = schema?.annotations?.var?.index;
      if (!varIndex) return null;
      return [
        "X",
        {
          field: "var",
          column: varIndex,
          value: colorByAccessor,
        },
      ];
    }
    default: {
      return null;
    }
  }
}

function _defaultColors(nObs: any) {
  const defaultCellColor = parseRGB(globals.defaultCellColor);
  return {
    rgb: new Array(nObs).fill(defaultCellColor),
    scale: undefined,
  };
}
const defaultColors = memoize(_defaultColors);

/*
create colors scale and RGB array and return as object. Parameters:
  * colorMode - categorical, etc.
  * colorByAccessor - the annotation label name
  * colorByDataframe - the actual color-by data
  * schema - the entire schema
  * userColors - optional user color table
Returns:
  {
    scale: color scale
    rgb: cell to color mapping
  }
*/
function _createColorTable(
  colorMode: any,
  colorByAccessor: any,
  colorByData: any,
  schema: any,
  userColors = null
) {
  switch (colorMode) {
    case "color by categorical metadata": {
      const data = colorByData.col(colorByAccessor).asArray();
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      if (userColors && colorByAccessor in userColors) {
        return createUserColors(data, colorByAccessor, userColors);
      }
      return createColorsByCategoricalMetadata(data, colorByAccessor, schema);
    }
    case "color by continuous metadata": {
      const col = colorByData.col(colorByAccessor);
      const { min, max } = col.summarize();
      return createColorsByContinuousMetadata(col.asArray(), min, max);
    }
    case "color by expression": {
      const col = colorByData.icol(0);
      const { min, max } = col.summarize();
      return createColorsByContinuousMetadata(col.asArray(), min, max);
    }
    default: {
      return defaultColors(schema.dataframe.nObs);
    }
  }
}
export const createColorTable = memoize(_createColorTable);

export function loadUserColorConfig(userColors: any) {
  const convertedUserColors = {};
  Object.keys(userColors).forEach((category) => {
    // We cannot iterate over keys without sorting
    // because we handle categorical values in alphabetical order __ignoring case__
    //  while Object.keys() _usually_ is ordered alphabetically where all upper characters are less than lowercase (A, B, C, a, b, c)
    const [colors, scaleMap] = Object.keys(userColors[category])
      .sort((a, b) => {
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a === b) return 0;
        if (a > b) return 1;
        return -1;
      })
      .reduce(
        (acc, label, i) => {
          const color = parseRGB(userColors[category][label]);
          // @ts-expect-error ts-migrate(7053) FIXME: No index signature with a parameter of type 'strin... Remove this comment to see the full error message
          acc[0][label] = color;
          // @ts-expect-error ts-migrate(7053) FIXME: No index signature with a parameter of type 'numbe... Remove this comment to see the full error message
          acc[1][i] = d3.rgb(255 * color[0], 255 * color[1], 255 * color[2]);
          return acc;
        },
        [{}, {}]
      );
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const scale = (i: any) => scaleMap[i];
    // @ts-expect-error ts-migrate(7053) FIXME: No index signature with a parameter of type 'strin... Remove this comment to see the full error message
    convertedUserColors[category] = { colors, scale };
  });
  return convertedUserColors;
}

function _createUserColors(data: any, colorAccessor: any, userColors: any) {
  const { colors, scale } = userColors[colorAccessor];
  const rgb = createRgbArray(data, colors);
  return { rgb, scale };
}
const createUserColors = memoize(_createUserColors);

function _createColorsByCategoricalMetadata(data: any, colorAccessor: any, schema: any) {
  const { categories } = schema.annotations.obsByName[colorAccessor];

  const scale = d3
    .scaleSequential(interpolateRainbow)
    .domain([0, categories.length]);

  /* pre-create colors - much faster than doing it for each obs */
  const colors = categories.reduce((acc: any, cat: any, idx: any) => {
    acc[cat] = parseRGB(scale(idx));
    return acc;
  }, {});

  const rgb = createRgbArray(data, colors);
  return { rgb, scale };
}
const createColorsByCategoricalMetadata = memoize(
  _createColorsByCategoricalMetadata
);

function createRgbArray(data: any, colors: any) {
  const rgb = new Array(data.length);
  for (let i = 0, len = data.length; i < len; i += 1) {
    const label = data[i];
    rgb[i] = colors[label];
  }
  return rgb;
}

function _createColorsByContinuousMetadata(data: any, min: any, max: any) {
  const colorBins = 100;
  const scale = d3
    .scaleQuantile()
    .domain([min, max])
    .range(range(colorBins - 1, -1, -1));

  /* pre-create colors - much faster than doing it for each obs */
  const colors = new Array(colorBins);
  for (let i = 0; i < colorBins; i += 1) {
    colors[i] = parseRGB(interpolateCool(i / colorBins));
  }

  const nonFiniteColor = parseRGB(globals.nonFiniteCellColor);
  const rgb = new Array(data.length);
  for (let i = 0, len = data.length; i < len; i += 1) {
    const val = data[i];
    if (Number.isFinite(val)) {
      const c = scale(val);
      rgb[i] = colors[c];
    } else {
      rgb[i] = nonFiniteColor;
    }
  }
  return { rgb, scale };
}
export const createColorsByContinuousMetadata = memoize(
  _createColorsByContinuousMetadata
);
