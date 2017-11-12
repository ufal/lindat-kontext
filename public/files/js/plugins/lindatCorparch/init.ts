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

/// <reference path="../../types/common.d.ts" />
/// <reference path="../../types/plugins/corparch.ts" />
/// <reference path="./view.d.ts" />
/// <reference path="../../../ts/declarations/immutable.d.ts" />
/// <reference path="../../../ts/declarations/flux.d.ts" />
/// <reference path="../../../ts/declarations/jquery.d.ts" />
/// <reference path="../../../ts/declarations/rsvp.d.ts" />

import util = require('../../util');
import Immutable = require('vendor/immutable');
import $ = require('jquery');
import {init as viewInit} from './view';
import RSVP = require('vendor/rsvp');

export interface Node {
    active: boolean;
    name: string;
    ident?: string;
    corplist?: Immutable.List<Node>;
}

/**
 *
 */
export class TreeWidgetStore extends util.SimplePageStore {

    static DispatchToken: string;

    protected pluginApi: Kontext.PluginApi;

    private data: Node;

    private permitted_corp: any; //Map<string, string>

    private idMap: Immutable.Map<string, Node>;

    private widgetId: number;

    private corpusClickHandler: (ident: string) => void;

    constructor(pluginApi: Kontext.PluginApi, corpusClickHandler: (ident: string) => void) {
        super(pluginApi.dispatcher());
        this.pluginApi = pluginApi;
        this.corpusClickHandler = corpusClickHandler;
        let self = this;
        this.idMap = Immutable.Map<string, Node>();
        this.dispatcher.register(
            function(payload: Kontext.DispatcherPayload) {
                switch (payload.actionType) {
                    case 'TREE_CORPARCH_SET_NODE_STATUS':
                        let item = self.idMap.get(payload.props['nodeId']);
                        item.active = !item.active;
                        self.notifyChangeListeners('TREE_CORPARCH_DATA_CHANGED');
                        break;
                    case 'TREE_CORPARCH_GET_DATA':
                        self.loadData().then(
                            (d) => self.notifyChangeListeners('TREE_CORPARCH_DATA_CHANGED'));
                        break;
                    case 'TREE_CORPARCH_LEAF_NODE_CLICKED':
                        self.corpusClickHandler(payload.props['ident']);
                        break;
                    case 'TREE_CORPARCH_SEARCH':
                        break;
                }
            }
        );
    }

    private importTree(rootNode: any, nodeId: string= 'a') {
        rootNode['active'] = false;
        if (rootNode['corplist']) {
            rootNode['ident'] = nodeId;
            this.idMap = this.idMap.set(nodeId, rootNode);
            rootNode['corplist'] = Immutable.List(
                rootNode['corplist'].map((node, i) => this.importTree(node, nodeId + '.' + String(i)))
            );

        } else {
            rootNode['corplist'] = Immutable.List([]);
        }
        return rootNode;
    }

    dumpNode(rootNode: Node): void {
        if (rootNode['corplist']) {
            rootNode['corplist'].forEach((item) => this.dumpNode(item));
        }
    }

    loadData() {
        let corptree_data_prom: RSVP.Promise<any> = this.pluginApi.ajax<any>(
            'GET',
            this.pluginApi.createActionUrl('corpora/ajax_get_corptree_data'),
            {},
            { contentType : 'application/x-www-form-urlencoded' }
        );
        let permitted_corp_prom: RSVP.Promise<any> = this.pluginApi.ajax<any>(
            'GET',
            this.pluginApi.createActionUrl('corpora/ajax_get_permitted_corpora'),
            {},
            { contentType : 'application/x-www-form-urlencoded' }
        );
        return RSVP.all([corptree_data_prom, permitted_corp_prom]).then(
            (data) => {
                let corptree_data = data[0];
                let permitted_corp = data[1];
                if (!corptree_data.contains_errors && !permitted_corp.contains_errors) {
                    this.data = this.importTree(corptree_data);
                    this.permitted_corp = {};
                    for (let canonical_corpus_id in permitted_corp){
                        if (permitted_corp.hasOwnProperty(canonical_corpus_id) &&
                            typeof permitted_corp[canonical_corpus_id] === 'string'){
                            this.permitted_corp[canonical_corpus_id] = permitted_corp[canonical_corpus_id];
                        }
                    }
                } else {
                    let errored = corptree_data.contains_errors ? corptree_data : permitted_corp;
                    this.pluginApi.showMessage('error', errored.messages.join('\n'));
                }
            },
            (error) => {
                this.pluginApi.showMessage('error', error);
            }
        );
    }

    getData(): Node {
        return this.data;
    }

    getPermittedCorp(): Immutable.Map<string, string> {
        return this.permitted_corp;
    }
}

/**
 * Creates a corplist widget which is a box containing two tabs
 *  1) user's favorite items
 *  2) corpus search tool
 *
 * @param selectElm A HTML SELECT element for default (= non JS) corpus selection we want to be replaced by this widget
 * @param pluginApi
 * @param targetAction An action KonText will follow once user clicks a tree item
 * @param options A configuration for the widget
 */
export function create(selectElm: HTMLElement, targetAction: string, pluginApi: Kontext.QueryPagePluginApi,
                       options: CorpusArchive.Options) {
    let widgetWrapper = window.document.createElement('div');
    $(widgetWrapper).addClass('corp-tree-wrapper');
    $(selectElm).replaceWith(widgetWrapper);

    let treeStore = new TreeWidgetStore(pluginApi, (corpusIdent: string) => {
        window.location.href = pluginApi.createActionUrl(targetAction, [['corpname', corpusIdent]]);
    });
    let viewsLib = viewInit(pluginApi.dispatcher(), pluginApi.exportMixins(),
            treeStore);
    pluginApi.renderReactComponent(
        viewsLib.CorptreeWidget,
        widgetWrapper,
        {
            currentCorpus: pluginApi.getConf<string>('humanCorpname'),
            corpname: pluginApi.getConf<string>('corpname'),
        }
    );
}

export class CorplistPage implements Customized.CorplistPage {

    private pluginApi: Kontext.PluginApi;

    private treeStore: TreeWidgetStore;

    private viewsLib: any;

    constructor(pluginApi: Kontext.PluginApi) {
        this.pluginApi = pluginApi;
        this.treeStore = new TreeWidgetStore(pluginApi, (corpusIdent: string) => {
            window.location.href = pluginApi.createActionUrl('first_form?corpname=' + corpusIdent);
        });
        this.viewsLib = viewInit(pluginApi.dispatcher(), pluginApi.exportMixins(),
                this.treeStore);
    }

    createForm(targetElm: HTMLElement, properties: any): void {}

    createList(targetElm: HTMLElement, properties: any): void {
        $('noscript').before('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">');
        $('#content').addClass('lindatCorparch-content');
        $('.corplist').addClass('lindatCorparch-section');

        let wrapper = window.document.createElement('div');
        $('section.corplist').append(wrapper);
        this.pluginApi.renderReactComponent(
            this.viewsLib.CorptreePageComponent,
            wrapper,
            {
                currentCorpus: this.pluginApi.getConf<string>('humanCorpname'),
                context: $('body'),
            }
        );
    }
}

export function initCorplistPageComponents(pluginApi: Kontext.PluginApi): Customized.CorplistPage {
    return new CorplistPage(pluginApi);
}