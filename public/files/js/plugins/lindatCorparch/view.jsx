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
                <div className="node" id={this.props.name}>
                        <div className="header">
                        {this.props.name}
                        </div>
                        <div className="wrapper-inner">
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
                        <div className="subnode">
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
        getInitialState: function () {
            return {hover: false};
        },

        _mouseOver: function () {
            this.setState({hover: true});

        },

        _mouseOut: function () {
            this.setState({hover: false});
        },
        
        _myColor: function() {
            if (this.state.hover) {
                return "#d8eff7";
            }
            //return "green";
        },
        
        _clickHandler : function () {
            dispatcher.dispatch({
                actionType: 'TREE_CORPARCH_LEAF_NODE_CLICKED',
                props: {
                    ident: this.props.ident
                }
            });
        },

        render : function () {
            //return <div className="leaf"><a onClick={this._clickHandler}>{this.props.name}<div>{this.props.size}</div></a></div>;
            return <div className="leaf" style={{background: this._myColor()}} data-features={this.props.features} data-lang={this.props.language}>
                    <div className="row">
                        <div className="corpus-details col-xs-4">
                        Features:&nbsp;
                            <span className="corpus-details-info corplist-search clickable underline-hover" data-search="features">
                                {this.props.features}
                            </span>
                        Language(s):&nbsp;
                            <span className="corpus-details-info corplist-search clickable underline-hover" data-search="language">
                                {this.props.language}
                            </span>
                        </div>
                    </div>
                    <div className="row">
                        <a className="corpus-main-info col-xs-9 col-md-10" onMouseOver={this._mouseOver} onMouseOut={this._mouseOut} onClick={this._clickHandler} title={"Search in " + this.props.name}>
                            <div className="row">
                                <div className="col-xs-3 tokens">
                                    Size
                                    <div className="corpus-details-info">
                                        {this.props.size + " positions"}
                                    </div>
                                </div>
                                <div className="col-xs-9 details">
                                    <h3 className="title">
                                        {this.props.name}
                                    </h3>
                                    <div className="desc">
                                        {this.props.description}
                                        
                                    </div>
                                </div>
                            </div>
                        </a>
                        <div className="col-xs-3 col-md-2 actions text-right">
                            <a href={this.props.repo} className="md-transparent" title={"Download " + this.props.name}>
                                <span className="glyphicon glyphicon-save"></span>
                            </a>
                        </div>
                    </div>
            </div>;
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
                    return <TreeLeaf key={i} name={item['name']} ident={item['ident']} 
                                     size={item['formatted_size']} features={item['features']} 
                                     language={item['language']} description={item['description']} repo={item['repo']}/>;
                }
            });
        },

        render : function () {
            //console.log('Here\'s the name: ', this.props);
            return (
                <div className={this.props.htmlClass}>
                    {this._renderChildren()}
                </div>
            );
        }
    });
    
    // -------------------------------- <ItemListSorted /> -------------------------------

    let ItemListSorted = React.createClass({
        getInitialState: function () {
            return {htmlClass: "corp-tree-sorted"};
        },

        _renderChildren : function () {
            return this.props.corplist.map((item, i) => {
                 
                    return <TreeLeaf key={i} name={item['name']} ident={item['ident']} 
                                     size={item['formatted_size']} features={item['features']} 
                                     language={item['language']} description={item['description']} repo={item['repo']}/>;
            });
        },

        render : function () {
            return (
                <div className={this.props.htmlClass}>
                    <div className="wrapper-inner-sorted">
                        {this._renderChildren()}
                    </div>
                </div>
            );
        }
    });

    // -------------------------------- <CorptreeWidget /> -------------------------------

    let CorptreeWidget = React.createClass({

        _buttonClickHandler : function () {
            if (!this.state.active && !this.state.data) {
                dispatcher.dispatch({
                    actionType: 'TREE_CORPARCH_GET_DATA',
                    props: {}
                });

            } else {
                this.setState({active: !this.state.active, data: this.state.data});
            }
        },

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
                    <button className="switch" type="button" onClick={this._buttonClickHandler}>{this.props.currentCorpus}</button>
                    <input type="hidden" name="corpname" value={this.props.corpname} />
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
            return {data: null, sorted: false};
        },
        
        _bySize : function () {
            if (this.state.sorted) {
                return "none";
            }
            return "inline";
        },
        
        _byDefault : function () {
            if (this.state.sorted) {
                return "inline";
            }
            return "none";
        },
        
        _sortClickHandler : function() {
            this.setState({sorted: !this.state.sorted});
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
                    <div className="row tab-nav">
                        <div className="col-xs-9">
                            <ul className="nav nav-tabs">
                                <li role="presentation">
                                    <a href="#LINDAT monolingual corpora" title="Jump to group LINDAT monolingual corpora">LINDAT monolingual corpora</a>
                                </li>
                                <li role="presentation">
                                    <a href="#LINDAT parallel corpora" title="Jump to group LINDAT parallel corpora">LINDAT parallel corpora</a>
                                </li>
                                <li role="presentation">
                                    <a href="#LINDAT speech corpora" title="Jump to group LINDAT speech corpora">LINDAT speech corpora</a>
                                </li>
                            </ul>
                        </div>
                        <div className="col-xs-3 clickable btnlike">
                            <span className="glyphicon glyphicon-sort-by-attributes" style={{marginRight: 0.5 + 'em'}}></span>
                            <span id="for-corpus-list-sizes" className="corplist-tabs" title="Show by size" style={{display: this._bySize()}} onClick={this._sortClickHandler}>Show by size</span>
                            <span id="for-corpus-list-default" className="corplist-tabs" title="Show by category" style={{display: this._byDefault()}} onClick={this._sortClickHandler}>Show by category</span>
                        </div>
                    </div>
                    <div style={{display: this._bySize()}}>
                        <ItemList htmlClass="corp-tree" 
                            corplist={this.state.data ? this.state.data['corplist'] : []} />
                    </div>
                    <div style={{display: this._byDefault()}}>
                        <ItemListSorted htmlClass="corp-tree-sorted"
                                  corplist={this.state.data ? this.state.data['sort_corplist'] : []} />
                    </div>
                </div>
            );
        }
    });

    return {
        CorptreeWidget: CorptreeWidget,
        CorptreePageComponent: CorptreePageComponent
    };
}