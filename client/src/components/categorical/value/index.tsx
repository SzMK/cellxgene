// @ts-expect-error ts-migrate(7016) FIXME: Try `npm install @types/react-redux` if it exists ... Remove this comment to see the full error message
import { connect } from "react-redux";
// @ts-expect-error ts-migrate(7016) FIXME: Try `npm install @types/react` if it exists or add... Remove this comment to see the full error message
import React from "react";
// @ts-expect-error ts-migrate(7016) FIXME: Try `npm install @types/d3` if it exists or add a ... Remove this comment to see the full error message
import * as d3 from "d3";

import {
  Button,
  Menu,
  MenuItem,
  Popover,
  Position,
  Icon,
  PopoverInteractionKind,
} from "@blueprintjs/core";
import * as globals from "../../../globals";
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '../categorical.css' or its cor... Remove this comment to see the full error message
import styles from "../categorical.css";
// @ts-expect-error ts-migrate(6142) FIXME: Module '../annoDialog' was resolved to '/Users/sba... Remove this comment to see the full error message
import AnnoDialog from "../annoDialog";
// @ts-expect-error ts-migrate(6142) FIXME: Module '../labelInput' was resolved to '/Users/sba... Remove this comment to see the full error message
import LabelInput from "../labelInput";
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../util/truncate' was resolved to '/Use... Remove this comment to see the full error message
import Truncate from "../../util/truncate";

import { AnnotationsHelpers } from "../../../util/stateManager";
// @ts-expect-error ts-migrate(6142) FIXME: Module '../labelUtil' was resolved to '/Users/sbad... Remove this comment to see the full error message
import { labelPrompt, isLabelErroneous } from "../labelUtil";
import actions from "../../../actions";
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../miniHistogram' was resolved to '/Use... Remove this comment to see the full error message
import MiniHistogram from "../../miniHistogram";
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../miniStackedBar' was resolved to '/Us... Remove this comment to see the full error message
import MiniStackedBar from "../../miniStackedBar";
import { CategoryCrossfilterContext } from "../categoryContext";

const VALUE_HEIGHT = 11;
const CHART_WIDTH = 100;

/* this is defined outside of the class so we can use it in connect() */
function _currentLabelAsString(ownProps: any) {
  const { label } = ownProps;
  // when called as a function, the String() constructor performs type conversion,
  // and returns a primitive string.
  return String(label);
}

type State = any;

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'state' implicitly has an 'any' type.
@connect((state, ownProps) => {
  const { pointDilation, categoricalSelection } = state;
  const { metadataField, categorySummary, categoryIndex } = ownProps;
  const isDilated =
    pointDilation.metadataField === metadataField &&
    pointDilation.categoryField === _currentLabelAsString(ownProps);

  const category = categoricalSelection[metadataField];
  const label = categorySummary.categoryValues[categoryIndex];
  const isSelected = category.get(label) ?? true;

  return {
    annotations: state.annotations,
    schema: state.annoMatrix?.schema,
    ontology: state.ontology,
    isDilated,
    isSelected,
    label,
  };
})
// @ts-expect-error ts-migrate(1219) FIXME: Experimental support for decorators is a feature t... Remove this comment to see the full error message
class CategoryValue extends React.Component<{}, State> {
  props: any;
  setState: any;
  state: any;
  constructor(props: {}) {
    super(props);
    this.state = {
      editedLabelText: this.currentLabelAsString(),
    };
  }

  componentDidUpdate(prevProps: {}) {
    const { metadataField, categoryIndex, categorySummary } = this.props;
    if (
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'metadataField' does not exist on type '{... Remove this comment to see the full error message
      prevProps.metadataField !== metadataField ||
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'categoryIndex' does not exist on type '{... Remove this comment to see the full error message
      prevProps.categoryIndex !== categoryIndex ||
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'categorySummary' does not exist on type ... Remove this comment to see the full error message
      prevProps.categorySummary !== categorySummary
    ) {
      // eslint-disable-next-line react/no-did-update-set-state --- adequately checked to prevent looping
      this.setState({
        editedLabelText: this.currentLabelAsString(),
      });
    }
  }

  // If coloring by and this isn't the colorAccessor and it isn't being edited
  get shouldRenderStackedBarOrHistogram() {
    const { colorAccessor, isColorBy, annotations } = this.props;

    return colorAccessor && !isColorBy && !annotations.isEditingLabelName;
  }

  handleDeleteValue = () => {
    const { dispatch, metadataField, label } = this.props;
    dispatch(actions.annotationDeleteLabelFromCategory(metadataField, label));
  };

  handleAddCurrentSelectionToThisLabel = () => {
    const { dispatch, metadataField, label } = this.props;
    dispatch(actions.annotationLabelCurrentSelection(metadataField, label));
  };

  handleEditValue = (e: any) => {
    const { dispatch, metadataField, label } = this.props;
    const { editedLabelText } = this.state;
    this.cancelEditMode();
    dispatch(
      actions.annotationRenameLabelInCategory(
        metadataField,
        label,
        editedLabelText
      )
    );
    e.preventDefault();
  };

  handleCreateArbitraryLabel = (txt: any) => {
    const { dispatch, metadataField, label } = this.props;
    this.cancelEditMode();
    dispatch(
      actions.annotationRenameLabelInCategory(metadataField, label, txt)
    );
  };

  labelNameError = (name: any) => {
    const { metadataField, ontology, schema } = this.props;
    if (name === this.currentLabelAsString()) return false;
    return isLabelErroneous(name, metadataField, ontology, schema);
  };

  instruction = (label: any) => {
    return labelPrompt(this.labelNameError(label), "New, unique label", ":");
  };

  activateEditLabelMode = () => {
    const { dispatch, metadataField, categoryIndex, label } = this.props;
    dispatch({
      type: "annotation: activate edit label mode",
      metadataField,
      categoryIndex,
      label,
    });
  };

  cancelEditMode = () => {
    const { dispatch, metadataField, categoryIndex, label } = this.props;
    this.setState({
      editedLabelText: this.currentLabelAsString(),
    });
    dispatch({
      type: "annotation: cancel edit label mode",
      metadataField,
      categoryIndex,
      label,
    });
  };

  toggleOff = () => {
    const {
      dispatch,
      metadataField,
      categoryIndex,
      categorySummary,
    } = this.props;
    const label = categorySummary.categoryValues[categoryIndex];
    dispatch(
      actions.selectCategoricalMetadataAction(
        "categorical metadata filter deselect",
        metadataField,
        categorySummary.allCategoryValues,
        label,
        false
      )
    );
  };

  shouldComponentUpdate = (nextProps: any, nextState: any) => {
    /*
    Checks to see if at least one of the following changed:
    * world state
    * the color accessor (what is currently being colored by)
    * if this catagorical value's selection status has changed
    * the crossfilter (ie, global selection state)

    If and only if true, update the component
    */
    const { props, state } = this;
    const { categoryIndex, categorySummary, isSelected } = props;
    const {
      categoryIndex: newCategoryIndex,
      categorySummary: newCategorySummary,
      isSelected: newIsSelected,
    } = nextProps;

    const label = categorySummary.categoryValues[categoryIndex];
    const newLabel = newCategorySummary.categoryValues[newCategoryIndex];
    const labelChanged = label !== newLabel;
    const valueSelectionChange = isSelected !== newIsSelected;

    const colorAccessorChange = props.colorAccessor !== nextProps.colorAccessor;
    const annotationsChange = props.annotations !== nextProps.annotations;
    const editingLabel = state.editedLabelText !== nextState.editedLabelText;
    const dilationChange = props.isDilated !== nextProps.isDilated;

    const count = categorySummary.categoryValueCounts[categoryIndex];
    const newCount = newCategorySummary.categoryValueCounts[newCategoryIndex];
    const countChanged = count !== newCount;

    return (
      labelChanged ||
      valueSelectionChange ||
      colorAccessorChange ||
      annotationsChange ||
      editingLabel ||
      dilationChange ||
      countChanged
    );
  };

  toggleOn = () => {
    const {
      dispatch,
      metadataField,
      categoryIndex,
      categorySummary,
    } = this.props;
    const label = categorySummary.categoryValues[categoryIndex];
    dispatch(
      actions.selectCategoricalMetadataAction(
        "categorical metadata filter select",
        metadataField,
        categorySummary.allCategoryValues,
        label,
        true
      )
    );
  };

  handleMouseEnter = () => {
    const { dispatch, metadataField, categoryIndex, label } = this.props;
    dispatch({
      type: "category value mouse hover start",
      metadataField,
      categoryIndex,
      label,
    });
  };

  handleMouseExit = () => {
    const { dispatch, metadataField, categoryIndex, label } = this.props;
    dispatch({
      type: "category value mouse hover end",
      metadataField,
      categoryIndex,
      label,
    });
  };

  handleTextChange = (text: any) => {
    this.setState({ editedLabelText: text });
  };

  handleChoice = (e: any) => {
    /* Blueprint Suggest format */
    this.setState({ editedLabelText: e.target });
  };

  createHistogramBins = (
    metadataField: any,
    categoryData: any,
    colorAccessor: any,
    colorData: any,
    categoryValue: any,
    width: any,
    height: any
  ) => {
    /*
      Knowing that colorScale is based off continuous data,
      createHistogramBins fetches the continuous data in relation to the cells relevant to the category value.
      It then separates that data into 50 bins for drawing the mini-histogram
    */
    const groupBy = categoryData.col(metadataField);
    const col = colorData.icol(0);
    const range = col.summarize();

    const histogramMap = col.histogram(
      50,
      [range.min, range.max],
      groupBy
    ); /* Because the signature changes we really need different names for histogram to differentiate signatures  */

    const bins = histogramMap.has(categoryValue)
      ? histogramMap.get(categoryValue)
      : new Array(50).fill(0);

    const xScale = d3.scaleLinear().domain([0, bins.length]).range([0, width]);

    const largestBin = Math.max(...bins);

    const yScale = d3.scaleLinear().domain([0, largestBin]).range([0, height]);

    return {
      xScale,
      yScale,
      bins,
    };
  };

  createStackedGraphBins = (
    metadataField: any,
    categoryData: any,
    colorAccessor: any,
    colorData: any,
    categoryValue: any,
    colorTable: any,
    schema: any,
    width: any
  ) => {
    /*
      Knowing that the color scale is based off of categorical data,
      createOccupancyStack obtains a map showing the number if cells per colored value
      Using the colorScale a stack of colored bars is drawn representing the map
     */
    const groupBy = categoryData.col(metadataField);
    const occupancyMap = colorData
      .col(colorAccessor)
      .histogramCategorical(groupBy);

    const occupancy = occupancyMap.get(categoryValue);

    if (occupancy && occupancy.size > 0) {
      // not all categories have occupancy, so occupancy may be undefined.
      const scale = d3
        .scaleLinear()
        /* get all the keys d[1] as an array, then find the sum */
        .domain([0, d3.sum(Array.from(occupancy.values()))])
        .range([0, width]);
      const categories =
        schema.annotations.obsByName[colorAccessor]?.categories;

      const dfColumn = colorData.col(colorAccessor);
      const categoryValues = dfColumn.summarizeCategorical().categories;

      return {
        domainValues: categoryValues,
        scale,
        domain: categories,
        occupancy,
      };
    }
    return null;
  };

  currentLabelAsString() {
    return _currentLabelAsString(this.props);
  }

  isAddCurrentSelectionDisabled(crossfilter: any, category: any, value: any) {
    /*
    disable "add current selection to label", if one of the following is true:
    1. no cells are selected
    2. all currently selected cells already have this label, on this category
    */
    const { categoryData } = this.props;

    // 1. no cells selected?
    if (crossfilter.countSelected() === 0) {
      return true;
    }
    // 2. all selected cells already have the label
    const mask = crossfilter.allSelectedMask();
    if (
      AnnotationsHelpers.allHaveLabelByMask(categoryData, category, value, mask)
    ) {
      return true;
    }
    // else, don't disable
    return false;
  }

  renderMiniStackedBar = () => {
    const {
      colorAccessor,
      metadataField,
      categoryData,
      colorData,
      colorTable,
      schema,
      label,
    } = this.props;
    const isColorBy = metadataField === colorAccessor;

    if (
      !this.shouldRenderStackedBarOrHistogram ||
      !AnnotationsHelpers.isCategoricalAnnotation(schema, colorAccessor) ||
      isColorBy
    ) {
      return null;
    }

    const { domainValues, scale, domain, occupancy } =
      this.createStackedGraphBins(
        metadataField,
        categoryData,
        colorAccessor,
        colorData,
        label,
        colorTable,
        schema,
        CHART_WIDTH
      ) ?? {};

    if (!domainValues || !scale || !domain || !occupancy) {
      return null;
    }

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <MiniStackedBar
        /* eslint-disable react/jsx-props-no-spreading -- Disable unneeded on next release of eslint-config-airbnb */
        {...{
          colorTable,
          domainValues,
          scale,
          domain,
          occupancy,
        }}
        /* eslint-enable react/jsx-props-no-spreading -- enable */
        height={VALUE_HEIGHT}
        width={CHART_WIDTH}
      />
    );
  };

  renderMiniHistogram = () => {
    const {
      colorAccessor,
      metadataField,
      colorData,
      categoryData,
      colorTable,
      schema,
      label,
    } = this.props;
    const colorScale = colorTable?.scale;

    if (
      !this.shouldRenderStackedBarOrHistogram ||
      !AnnotationsHelpers.isContinuousAnnotation(schema, colorAccessor)
    ) {
      return null;
    }

    const { xScale, yScale, bins } =
      this.createHistogramBins(
        metadataField,
        categoryData,
        colorAccessor,
        colorData,
        label,
        CHART_WIDTH,
        VALUE_HEIGHT
      ) ?? {}; // if createHistogramBins returns empty object assign null to deconstructed

    if (!xScale || !yScale || !bins) return null;

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <MiniHistogram
        /* eslint-disable react/jsx-props-no-spreading -- Disable unneeded on next release of eslint-config-airbnb */
        {...{
          colorScale,
          xScale,
          yScale,
          bins,
        }}
        /* eslint-enable react/jsx-props-no-spreading -- enable */
        obsOrVarContinuousFieldDisplayName={colorAccessor}
        domainLabel={label}
        height={VALUE_HEIGHT}
        width={CHART_WIDTH}
      />
    );
  };

  render() {
    const {
      metadataField,
      categoryIndex,
      colorAccessor,
      colorTable,
      isUserAnno,
      annotations,
      ontology,
      isDilated,
      isSelected,
      categorySummary,
      label,
    } = this.props;
    const colorScale = colorTable?.scale;
    const ontologyEnabled = ontology?.enabled ?? false;

    const { editedLabelText } = this.state;

    const count = categorySummary.categoryValueCounts[categoryIndex];
    const displayString = this.currentLabelAsString();

    /* this is the color scale, so add swatches below */
    const isColorBy = metadataField === colorAccessor;
    const { categoryValueIndices } = categorySummary;

    const editModeActive =
      isUserAnno &&
      annotations.labelEditable.category === metadataField &&
      annotations.isEditingLabelName &&
      annotations.labelEditable.label === categoryIndex;

    const valueToggleLabel = `value-toggle-checkbox-${metadataField}-${displayString}`;

    const LEFT_MARGIN = 60;
    const CHECKBOX = 26;
    const CELL_NUMBER = 50;
    const ANNO_MENU = 26;
    const LABEL_MARGIN = 16;
    const CHART_MARGIN = 24;

    const otherElementsWidth =
      LEFT_MARGIN +
      CHECKBOX +
      CELL_NUMBER +
      LABEL_MARGIN +
      (isUserAnno ? ANNO_MENU : 0);

    const labelWidth =
      colorAccessor && !isColorBy
        ? globals.leftSidebarWidth -
          otherElementsWidth -
          CHART_WIDTH -
          CHART_MARGIN
        : globals.leftSidebarWidth - otherElementsWidth;

    return (
      // @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
      <div
        className={
          /* This code is to change the styles on centroid label hover is causing over-rendering */
          `${styles.value}${isDilated ? ` ${styles.hover}` : ""}`
        }
        data-testclass="categorical-row"
        style={{
          padding: "4px 0px 4px 7px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "2px",
          borderRadius: "2px",
        }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseExit}
      >
        {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
        <div
          style={{
            margin: 0,
            padding: 0,
            userSelect: "none",
            width: globals.leftSidebarWidth - 145,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
          <div style={{ display: "flex", alignItems: "baseline" }}>
            {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
            <label
              htmlFor={valueToggleLabel}
              className="bp3-control bp3-checkbox"
              style={{ margin: 0 }}
            >
              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
              <input
                id={valueToggleLabel}
                onChange={isSelected ? this.toggleOff : this.toggleOn}
                data-testclass="categorical-value-select"
                data-testid={`categorical-value-select-${metadataField}-${displayString}`}
                checked={isSelected}
                type="checkbox"
              />
              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
              <span
                className="bp3-control-indicator"
                onMouseEnter={this.handleMouseExit}
                onMouseLeave={this.handleMouseEnter}
              />
            {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
            </label>
            {/* @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message */}
            <Truncate>
              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
              <span
                data-testid={`categorical-value-${metadataField}-${displayString}`}
                data-testclass="categorical-value"
                style={{
                  width: labelWidth,
                  color:
                    displayString === globals.unassignedCategoryLabel
                      ? "#ababab"
                      : "black",
                  fontStyle:
                    displayString === globals.unassignedCategoryLabel
                      ? "italic"
                      : "normal",
                  display: "inline-block",
                  overflow: "hidden",
                  lineHeight: "1.1em",
                  height: "1.1em",
                  verticalAlign: "middle",
                  marginRight: LABEL_MARGIN,
                }}
              >
                {displayString}
              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
              </span>
            </Truncate>
            {editModeActive ? (
              // @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
              <div>
                {/* @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message */}
                <AnnoDialog
                  isActive={editModeActive}
                  inputProps={{
                    "data-testid": `${metadataField}:edit-label-name-dialog`,
                  }}
                  primaryButtonProps={{
                    "data-testid": `${metadataField}:${displayString}:submit-label-edit`,
                  }}
                  title="Edit label"
                  instruction={this.instruction(editedLabelText)}
                  cancelTooltipContent="Close this dialog without editing label text."
                  primaryButtonText="Change label text"
                  text={editedLabelText}
                  categoryToDuplicate={null}
                  validationError={this.labelNameError(editedLabelText)}
                  handleSubmit={this.handleEditValue}
                  handleCancel={this.cancelEditMode}
                  annoInput={
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <LabelInput
                      label={editedLabelText}
                      labelSuggestions={ontologyEnabled ? ontology.terms : null}
                      onChange={this.handleTextChange}
                      onSelect={this.handleTextChange}
                      inputProps={{
                        "data-testid": `${metadataField}:${displayString}:edit-label-name`,
                        leftIcon: "tag",
                        intent: "none",
                        autoFocus: true,
                      }}
                    />
                  }
                  annoSelect={null}
                />
              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
              </div>
            ) : null}
          {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
          </div>
          {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
          <span style={{ flexShrink: 0 }}>
            {this.renderMiniStackedBar()}
            {this.renderMiniHistogram()}
          {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
          </span>
        {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
        </div>
        {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
        <div>
          {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
          <span>
            {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
            <span
              data-testclass="categorical-value-count"
              data-testid={`categorical-value-count-${metadataField}-${displayString}`}
              style={{
                color:
                  displayString === globals.unassignedCategoryLabel
                    ? "#ababab"
                    : "black",
                fontStyle:
                  displayString === globals.unassignedCategoryLabel
                    ? "italic"
                    : "auto",
              }}
            >
              {count}
            {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
            </span>

            {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
            <svg
              display={isColorBy && categoryValueIndices ? "auto" : "none"}
              style={{
                marginLeft: 5,
                width: VALUE_HEIGHT,
                height: VALUE_HEIGHT,
                backgroundColor:
                  isColorBy && categoryValueIndices
                    ? colorScale(categoryValueIndices.get(label))
                    : "inherit",
              }}
            />
            {isUserAnno ? (
              // @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
              <span
                onMouseEnter={this.handleMouseExit}
                onMouseLeave={this.handleMouseEnter}
              >
                {/* @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message */}
                <Popover
                  interactionKind={PopoverInteractionKind.HOVER}
                  boundary="window"
                  position={Position.RIGHT_TOP}
                  content={
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Menu>
                      {/* @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message */}
                      <CategoryCrossfilterContext.Consumer>
                        {/* @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message */}
                        {(crossfilter: any) => <MenuItem
                          icon="plus"
                          data-testclass="handleAddCurrentSelectionToThisLabel"
                          data-testid={`${metadataField}:${displayString}:add-current-selection-to-this-label`}
                          onClick={this.handleAddCurrentSelectionToThisLabel}
                          text={
                            // @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span>
                              Re-label currently selected cells as
                              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
                              <span
                                style={{
                                  fontStyle:
                                    displayString ===
                                    globals.unassignedCategoryLabel
                                      ? "italic"
                                      : "auto",
                                }}
                              >
                                {` ${displayString}`}
                              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
                              </span>
                            {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
                            </span>
                          }
                          disabled={this.isAddCurrentSelectionDisabled(
                            crossfilter,
                            metadataField,
                            label
                          )}
                        />}
                      </CategoryCrossfilterContext.Consumer>
                      {displayString !== globals.unassignedCategoryLabel ? (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <MenuItem
                          icon="edit"
                          text="Edit this label's name"
                          data-testclass="handleEditValue"
                          data-testid={`${metadataField}:${displayString}:edit-label`}
                          onClick={this.activateEditLabelMode}
                          disabled={annotations.isEditingLabelName}
                        />
                      ) : null}
                      {displayString !== globals.unassignedCategoryLabel ? (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <MenuItem
                          icon="delete"
                          intent="danger"
                          data-testclass="handleDeleteValue"
                          data-testid={`${metadataField}:${displayString}:delete-label`}
                          onClick={this.handleDeleteValue}
                          text={`Delete this label, and reassign all cells to type '${globals.unassignedCategoryLabel}'`}
                        />
                      ) : null}
                    </Menu>
                  }
                >
                  {/* @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message */}
                  <Button
                    style={{
                      marginLeft: 2,
                      position: "relative",
                      top: -1,
                      minHeight: 16,
                    }}
                    data-testclass="seeActions"
                    data-testid={`${metadataField}:${displayString}:see-actions`}
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    icon={<Icon icon="more" iconSize={10} />}
                    small
                    minimal
                  />
                </Popover>
              {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
              </span>
            ) : null}
          {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
          </span>
        {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
        </div>
      {/* @ts-expect-error ts-migrate(7026) FIXME: JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message */}
      </div>
    );
  }
}

export default CategoryValue;
