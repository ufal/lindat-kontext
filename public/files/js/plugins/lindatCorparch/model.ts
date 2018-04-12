import { StatefulModel } from '../../models/base';
import { IPluginApi } from '../../types/plugins';
import * as Immutable from 'immutable';
import { ActionPayload } from '../../app/dispatcher';
import RSVP from 'rsvp';


export interface Node {
    active: boolean;
    name: string;
    ident?: string;
    corplist?: Immutable.List<Node>;
}

/**
 *
 */
export class TreeWidgetModel extends StatefulModel {

    static DispatchToken: string;

    protected pluginApi:IPluginApi;

    private data: Node;

    private permitted_corp: any; //Map<string, string>

    private idMap:Immutable.Map<string, Node>;

    private widgetId: number;

    private corpusClickHandler: (ident: string) => void;

    constructor(pluginApi:IPluginApi, corpusClickHandler: (ident: string) => void) {
        super(pluginApi.dispatcher());
        this.pluginApi = pluginApi;
        this.corpusClickHandler = corpusClickHandler;
        this.idMap = Immutable.Map<string, Node>();
        this.dispatcher.register(
            (payload:ActionPayload) => {
                switch (payload.actionType) {
                    case 'TREE_CORPARCH_SET_NODE_STATUS':
                        let item = this.idMap.get(payload.props['nodeId']);
                        item.active = !item.active;
                        this.notifyChangeListeners('TREE_CORPARCH_DATA_CHANGED');
                        break;
                    case 'TREE_CORPARCH_GET_DATA':
                        this.loadData().then(
                            (d) => this.notifyChangeListeners('TREE_CORPARCH_DATA_CHANGED'));
                        break;
                    case 'TREE_CORPARCH_LEAF_NODE_CLICKED':
                        this.corpusClickHandler(payload.props['ident']);
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

    getPermittedCorp():Immutable.Map<string, string> {
        return this.permitted_corp;
    }
}
