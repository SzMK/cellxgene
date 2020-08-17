// jshint esversion: 6
/* rc slider https://www.npmjs.com/package/rc-slider */

import React from "react";
import _ from "lodash";
import { connect } from "react-redux";
import { Icon } from "@blueprintjs/core";
import * as globals from "../../globals";
import actions from "../../actions";
import Gene from "./gene";
import { memoize } from "../../util/dataframe/util";
import Truncate from "../util/truncate";

@connect((state) => {
  return {
    world: state.world,
    userDefinedGenes: state.controls.userDefinedGenes,
    userDefinedGenesLoading: state.controls.userDefinedGenesLoading,
  };
})
class GeneSet extends React.Component {
  _memoGenesToUpper = memoize(this._genesToUpper, (arr) => arr);

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      haveFetched: false,
    };
  }

  _genesToUpper = (listGenes) => {
    // Has to be a Map to preserve index
    const upperGenes = new Map();
    for (let i = 0, { length } = listGenes; i < length; i += 1) {
      upperGenes.set(listGenes[i].toUpperCase(), i);
    }

    return upperGenes;
  };

  fetchGenes = () => {
    const { world, dispatch, setGenes } = this.props;
    const varIndexName = world.schema.annotations.var.index;

    const worldGenes = world.varAnnotations.col(varIndexName).asArray();

    const upperGenes = this._genesToUpper(setGenes);
    const upperWorldGenes = this._memoGenesToUpper(worldGenes);

    dispatch({ type: "bulk user defined gene start" });

    Promise.all(
      [...upperGenes.keys()].map((upperGene) => {
        /* Unlike bulk add... with gene sets this test needs to be within the set... */
        // if (upperUserDefinedGenes.get(upperGene) !== undefined) {
        //   return keepAroundErrorToast(`${upperGene} already exists`);
        // }

        const indexOfGene = upperWorldGenes.get(upperGene);

        if (indexOfGene === undefined) {
          console.log("found a gene that doesn't appear to be a valid name");
          // return;
          // keepAroundErrorToast(
          //   `${
          //     genes[upperGenes.get(upperGene)]
          //   } doesn't appear to be a valid gene name.`
          // );
        }
        return dispatch(
          actions.requestUserDefinedGene(worldGenes[indexOfGene])
        );
      })
    ).then(
      () => dispatch({ type: "bulk user defined gene complete" }),
      () => dispatch({ type: "bulk user defined gene error" })
    );

    this.setState({ haveFetched: true });
    return undefined;
  };

  onGenesetMenuClick = () => {
    const { isOpen, haveFetched } = this.state;
    this.setState({ isOpen: !isOpen });
    if (!haveFetched) {
      // this.fetchGenes(); TODO
    }
  };

  render() {
    const { setName, setGenes } = this.props;
    const { isOpen } = this.state;
    // console.log("geneSet setGenes variable: ", setGenes);
    return (
      <div>
        <span
          role="menuitem"
          tabIndex="0"
          data-testclass="geneset-expand"
          data-testid={`${setName}:geneset-expand`}
          onKeyPress={/* todo */ () => {}}
          style={{
            cursor: "pointer",
          }}
          onClick={this.onGenesetMenuClick}
        >
          <Truncate>
            <span
              style={{
                maxWidth: globals.leftSidebarWidth - 150,
              }}
              data-testid={`${setName}:geneset-label`}
            >
              {setName}
            </span>
          </Truncate>
          <Icon
            data-testclass={
              isOpen
                ? "geneset-expand-is-expanded"
                : "geneset-expand-is-not-expanded"
            }
            icon={isOpen ? "caret-down" : "caret-right"}
            iconSize={14}
          />
        </span>

        {isOpen
          ? _.map(setGenes, (gene) => {
              return <Gene key={gene} gene={gene} />;
            })
          : null}
      </div>
    );
  }
}

export default GeneSet;
