/*
 * Copyright (c) 2016 Institute of the Czech National Corpus
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * dated June, 1991.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import React from 'vendor/react';


export function init(dispatcher, mixins, treeStore) {

    // --------------------------------- <TreeNode /> --------------------------

    let TreeNode = React.createClass({

        mixins : mixins,
        
        render : function () {
            return (
                <div className="node">
                    <div className="corpus-wrapper-inner">
                        {this.props.name}
                        <ItemList name={this.props.name} corplist={this.props.corplist} />
                    </div>
                </div>
            );
        }
    });

    // --------------------------------- <SubTreeNode /> --------------------------

    let SubTreeNode = React.createClass({

        mixins : mixins,
 
        _clickHandler : function () {
            dispatcher.dispatch({
                actionType: 'TREE_CORPARCH_SET_NODE_STATUS',
                props: {
                    nodeId: this.props.ident
                }
            });
        },

        getInitialState : function () {
            return {active: false};
        },

        _getStateGlyph : function () {
            let glyph = this.props.active ? 'glyphicon glyphicon-minus-sign icon toggle-plus' : 'glyphicon glyphicon-plus-sign icon toggle-plus';
            return glyph;
        },
        _getStateDisplay : function () {
            let display = this.props.active ? {display:"block"} : {display: "none"};
            return display;
        },
        render : function () {
            return (
                <div className="corpora-set-header toggle-below clickable">
                    <a onClick={this._clickHandler}>
                        <div className="corpus-details">Multiple corpora
                        </div>                
                        <div className="subnode" style={{background: '#79ff4d'}}>
                            <span className={this._getStateGlyph()}> </span>
                            {this.props.name}
                        </div>
                    </a>
                    <div className="to-toggle" style={this._getStateDisplay()}>
                        <ItemList name={this.props.name} corplist={this.props.corplist} />
                    </div>
                </div>
            );
        }
    });

    // -------------------------------- <TreeLeaf /> -------------------------------

    let TreeLeaf = React.createClass({

        _clickHandler : function () {
            dispatcher.dispatch({
                actionType: 'TREE_CORPARCH_LEAF_NODE_CLICKED',
                props: {
                    ident: this.props.ident
                }
            });
        },

        render : function () {
            return <div className="leaf"><a onClick={this._clickHandler}>{this.props.name}<div>{this.props.size}</div></a></div>;
        }
    });

    // -------------------------------- <ItemList /> -------------------------------

    let ItemList = React.createClass({

        _renderChildren : function () {
            return this.props.corplist.map((item, i) => {
                //console.log(item['name'], item['corplist'], item['level']);
                if (item['corplist'].size > 0 ) {
                    if ( item['level'] === 'outer' ) {
                        return <TreeNode key={i} name={item['name']} ident={item['ident']}
                                        corplist={item['corplist']} active={item['active']} />;
                    }
                    else {
                        return <SubTreeNode key={i} name={item['name']} ident={item['ident']}
                                        corplist={item['corplist']} active={item['active']} />;
                    }
                } else {
                    return <TreeLeaf key={i} name={item['name']} ident={item['ident']} size={item['size']}/>;
                }
            });
        },

        render : function () {
            return (
                <div className={this.props.htmlClass}>
                    {this._renderChildren()}
                </div>
            );
        }
    });

    // -------------------------------- <CorptreeWidget /> -------------------------------

    let CorptreeWidget = React.createClass({

        //_buttonClickHandler : function () {
        //    if (!this.state.active && !this.state.data) {
        //        dispatcher.dispatch({
        //            actionType: 'TREE_CORPARCH_GET_DATA',
        //            props: {}
        //        });

        //    } else {
        //        this.setState({active: !this.state.active, data: this.state.data});
        //    }
        //},

        _changeListener : function (store, action) {
            if (action === 'TREE_CORPARCH_DATA_CHANGED') {
                this.setState({
                    active: true,
                    data: store.getData()
                });
            }
        },

        getInitialState : function () {
            return {active: false, data: null};
        },

        componentDidMount : function () {
            treeStore.addChangeListener(this._changeListener);
        },

        componentWillUnmount : function () {
            treeStore.removeChangeListener(this._changeListener);
        },

        render : function () {
            return (
                <div className="corp-tree-widget">
                    {this.state.active ? <ItemList htmlClass="corp-tree"
                        corplist={this.state.data['corplist']} /> : null}
                </div>
            );
        }
    });

    // ----------------------- <CorptreePageComponent /> -----------------

    let CorptreePageComponent = React.createClass({

        _changeListener : function (store, action) {
            if (action === 'TREE_CORPARCH_DATA_CHANGED') {
                this.setState({
                    data: store.getData()
                });
            }
        },

        getInitialState : function () {
            return {data: null};
        },

        componentDidMount : function () {
            treeStore.addChangeListener(this._changeListener);
            dispatcher.dispatch({
                actionType: 'TREE_CORPARCH_GET_DATA',
                props: {}
            });
        },

        componentWillUnmount : function () {
            treeStore.removeChangeListener(this._changeListener);
        },

        render : function () {
            return (
                <div className="corp-tree-component">
                    <ItemList htmlClass="corp-tree"
                            corplist={this.state.data ? this.state.data['corplist'] : []} />
                </div>
            );
        }
    });

    return {
        CorptreeWidget: CorptreeWidget,
        CorptreePageComponent: CorptreePageComponent
    };
}