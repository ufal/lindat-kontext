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

    private permittedCorpora:Immutable.List<string>;

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
        return RSVP.all([
            this.pluginApi.ajax<any>(
                'GET',
                this.pluginApi.createActionUrl('corpora/ajax_get_corptree_data'),
                {}
            ),
            this.pluginApi.ajax<any>(
                'GET',
                this.pluginApi.createActionUrl('corpora/ajax_get_permitted_corpora'),
                {}
            )
        ]).then(
            (data) => {
                const [corptreeData, permittedCorpora] = data;
                this.data = this.importTree(corptreeData);
                this.permittedCorpora = Immutable.List<string>(Object.keys(permittedCorpora));
            },
            (error) => {
                this.pluginApi.showMessage('error', error);
            }
        );
    }

    setData(data:any):void {
        // TODO
    }

    getData():Node {
        return this.data;
    }

    getPermittedCorpora():Immutable.List<string> {
        return this.permittedCorpora;
    }
}
