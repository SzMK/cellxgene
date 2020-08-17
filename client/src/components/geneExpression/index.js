/* rc slider https://www.npmjs.com/package/rc-slider */

import React from "react";
import _ from "lodash";
import { connect } from "react-redux";
import emoji from "react-easy-emoji";
import { Button } from "@blueprintjs/core";
import HistogramBrush from "../brushableHistogram";
import * as globals from "../../globals";
import GeneSet from "./geneSet";

import testGeneSets from "./test_data";

@connect((state) => {
  return {
    userDefinedGenes: state.controls.userDefinedGenes,
    differential: state.differential,
    genesets: state.genesets,
  };
})
class GeneExpression extends React.Component {
  renderTestGeneSets = () => {
    const sets = [];

    _.forEach(testGeneSets, (setGenes, setName) => {
      sets.push(
        <GeneSet key={setName} setGenes={setGenes} setName={setName} />
      );
    });

    return sets;
  };

  handleActivateCreateGenesetMode = () => {
    const { dispatch } = this.props;
    dispatch({ type: "geneset: activate add new geneset mode" });
  };

  render() {
    const { userDefinedGenes, differential } = this.props;
    const geneSetsFeatureEnabledTODO = true;
    console.log("genesets", this.props);
    return (
      <div
        style={{
          borderBottom: `1px solid ${globals.lighterGrey}`,
        }}
      >
        <div>
          {geneSetsFeatureEnabledTODO ? (
            <div>
              <Button
                data-testid="open-create-geneset-dialog"
                onClick={this.handleActivateCreateGenesetMode}
                intent="none"
              >
                <span
                  style={{
                    marginRight: 4,
                    position: "relative",
                    top: 1,
                    left: -1,
                  }}
                >
                  {emoji("🧬")}
                </span>
                Create new <strong>geneset</strong>
              </Button>
            </div>
          ) : null}
          {/* <AddGenes /> */}
          {userDefinedGenes.length > 0
            ? _.map(userDefinedGenes, (geneName, index) => {
                return (
                  <HistogramBrush
                    key={geneName}
                    field={geneName}
                    zebra={index % 2 === 0}
                    isUserDefined
                  />
                );
              })
            : null}
        </div>
        <div>
          {differential.diffExp
            ? _.map(differential.diffExp, (value, index) => {
                return (
                  <HistogramBrush
                    key={value[0]}
                    field={value[0]}
                    zebra={index % 2 === 0}
                    isDiffExp
                    logFoldChange={value[1]}
                    pval={value[2]}
                    pvalAdj={value[3]}
                  />
                );
              })
            : null}
        </div>
        <div>{this.renderTestGeneSets()}</div>
      </div>
    );
  }
}

export default GeneExpression;
