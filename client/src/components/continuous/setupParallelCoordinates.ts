/*****************************************
******************************************
      Setup SVG & Canvas elements
******************************************
******************************************/
// jshint esversion: 6
// @ts-expect-error ts-migrate(7016) FIXME: Try `npm install @types/d3` if it exists or add a ... Remove this comment to see the full error message
import * as d3 from "d3";

const setupParallelCoordinates = (width: any, height: any, margin: any) => {
  const container = d3.select("#parcoords");

  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const canvas = container
    .append("canvas")
    .attr("width", width * devicePixelRatio)
    .attr("height", height * devicePixelRatio)
    .style("width", `${width}px`)
    .style("height", `${height}px`)
    .style("margin-top", `${margin.top}px`)
    .style("margin-left", `${margin.left}px`);

  const ctx = canvas.node().getContext("2d");
  ctx.globalCompositeOperation = "darken";
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 1.5;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  return {
    svg,
    ctx,
  };
};

export default setupParallelCoordinates;
