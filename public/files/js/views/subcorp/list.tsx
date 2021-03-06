/*
 * Copyright (c) 2016 Charles University, Faculty of Arts,
 *                    Institute of the Czech National Corpus
 * Copyright (c) 2016 Tomas Machalek <tomas.machalek@gmail.com>
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

import * as React from 'react';
import * as Immutable from 'immutable';
import {IActionDispatcher} from 'kombo';
import {Kontext} from '../../types/common';
import {SubcorpListModel, SubcListFilter, SortKey, UnfinishedSubcorp, SubcorpListItem} from '../../models/subcorp/list';
import { CoreViews } from '../../types/coreViews';
import { Subscription } from 'rxjs';


export interface SubcorpListProps {

}

export interface ListViews {
    SubcorpList:React.ComponentClass<SubcorpListProps>;
}

export function init(dispatcher:IActionDispatcher, he:Kontext.ComponentHelpers,
            subcorpLinesModel:SubcorpListModel) {

    const layoutViews = he.getLayoutViews();

    // ------------------------ <TrUnfinishedLine /> --------------------------

    const TrUnfinishedLine:React.SFC<{
        item:UnfinishedSubcorp;

    }> = (props) => {

        return (
            <tr>
                <td>
                    {props.item.name}
                </td>
                <td className="processing">
                    {props.item.failed ?
                        he.translate('subclist__failed_item') :
                        he.translate('global__processing')
                    }
                </td>
                <td className="num">{he.formatDate(props.item.created, 1)}</td>
                <td />
                <td />
                <td />
            </tr>
        );
    };

    // ------------------------ <PublishCheckbox /> -----------------------------

    const PublishCheckbox:React.SFC<{
        value:boolean;
        onChange:()=>void;

    }> = (props) => {
        return <input type="checkbox" checked={props.value} onChange={props.onChange} />;
    };

    // ------------------------ <DeleteButton /> -----------------------------

    const DeleteButton:React.SFC<{
        rowIdx:number;
        subcname:string;

    }> = (props) => {

        const handleSubmit = () => {
            if (window.confirm(he.translate('subclist__subc_delete_confirm_{subc}', {subc: props.subcname}))) {
                dispatcher.dispatch({
                    name: 'SUBCORP_LIST_DELETE_SUBCORPUS',
                    payload: {
                        rowIdx: props.rowIdx
                    }
                });
            }
        };

        return <layoutViews.DelItemIcon className="delete-subc"
                    title={he.translate('subclist__delete_subcorp')}
                    onClick={handleSubmit} />;
    }

    // ------------------------ <TrDataLine /> --------------------------

    const TrDataLine:React.SFC<{
        idx:number;
        item:SubcorpListItem;
        publishCheckboxHandle:(idx:number)=>void;
        actionButtonHandle:(idx:number)=>void;

    }> = (props) => {

        const renderLabel = () => {
            const item = props.item;
            if (!item.deleted) {
                const title = he.translate('subclist__search_in_subc');
                const href = he.createActionLink(
                    'first_form',
                    [
                        ['corpname', item.corpname],
                        ['usesubcorp', item.usesubcorp]
                    ]
                );
                return <a title={title} href={href}>{item.name}</a>;

            } else {
                return <span>{props.item.name}</span>;
            }
        };

        return (
            <tr>
                <td>
                    {renderLabel()}
                </td>
                <td className="num">
                {   props.item.size ? he.formatNumber(props.item.size) : '-'}
                </td>
                <td>
                    {he.formatDate(props.item.created, 1)}
                </td>
                <td>
                    {props.item.deleted ?
                        null :
                        <PublishCheckbox value={props.item.published}
                                onChange={()=>props.publishCheckboxHandle(props.idx)} />
                    }
                </td>
                <td className="action-link">
                    {props.item.cql ?
                        <a onClick={()=>props.actionButtonHandle(props.idx)}
                                title={he.translate('subclist__click_to_access_the_backup')}>{'\u2713'}</a> :
                        null
                    }
                </td>
                <td>
                    {!props.item.deleted ?
                        <DeleteButton rowIdx={props.idx} subcname={props.item.usesubcorp} /> :
                        null
                    }
                </td>
            </tr>
        );
    };

    // ------------------------ <ThSortable /> --------------------------

    const ThSortable:React.SFC<{
        ident:string;
        sortKey:SortKey;
        label:string;

    }> = (props) => {

        const renderSortFlag = () => {
            if (props.sortKey) {
                if (props.sortKey.reverse) {
                    return <img className="sort-flag" src={he.createStaticUrl('img/sort_desc.svg')} />;

                } else {
                    return <img className="sort-flag" src={he.createStaticUrl('img/sort_asc.svg')} />;
                }

            } else {
                return null;
            }
        };

        const handleSortClick = () => {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_SORT_LINES',
                payload: {
                    colName: props.ident,
                    reverse: props.sortKey ? !props.sortKey.reverse : false
                }
            });
        };

        const getTitle = () => {
            if (props.sortKey) {
                return he.translate('global__sorted_click_change');
            }
            return he.translate('global__click_to_sort');
        };

        return (
            <th>
                <a onClick={handleSortClick} title={getTitle()}>
                    {props.label}
                    {renderSortFlag()}
                </a>
            </th>
        );
    };

    // ------------------------ <DataTable /> --------------------------

    class DataTable extends React.Component<{
        actionButtonHandle:(action:string, idx:number)=>void;
    },
    {
        lines:Immutable.List<SubcorpListItem>;
        sortKey:SortKey;
        unfinished:Immutable.List<UnfinishedSubcorp>;
    }> {

        private modelSubscription:Subscription;

        constructor(props) {
            super(props);
            this._handleModelChange = this._handleModelChange.bind(this);
            this._handlePublishCheckbox = this._handlePublishCheckbox.bind(this);
            this.state = this._fetchModelState();
        }

        _fetchModelState() {
            return {
                lines: subcorpLinesModel.getLines(),
                sortKey: subcorpLinesModel.getSortKey(),
                unfinished: subcorpLinesModel.getUnfinished()
            }
        }

        _handleModelChange() {
            this.setState(this._fetchModelState());
        }

        componentDidMount() {
            this.modelSubscription = subcorpLinesModel.addListener(this._handleModelChange);
        }

        componentWillUnmount() {
            this.modelSubscription.unsubscribe();
        }

        _exportSortKey(name) {
            if (name === this.state.sortKey.name) {
                return this.state.sortKey;
            }
            return null;
        }

        _handlePublishCheckbox(corpname:string, subcname:string):void {
            if (window.confirm(he.translate('subclist__publish_warning'))) {
                dispatcher.dispatch({
                    name: 'SUBCORP_LIST_PUBLISH_ITEM',
                    payload: {
                        corpname: corpname,
                        subcname: subcname
                    }
                });
            }
        }

        render() {
            return (
                <table className="data">
                    <tbody>
                        <tr>
                            <ThSortable ident="name" sortKey={this._exportSortKey('name')} label={he.translate('subclist__col_name')} />
                            <ThSortable ident="size" sortKey={this._exportSortKey('size')} label={he.translate('subclist__col_size')} />
                            <ThSortable ident="created" sortKey={this._exportSortKey('created')} label={he.translate('subclist__col_created')} />
                            <th>{he.translate('subclist__col_published')}</th>
                            <th>{he.translate('subclist__col_backed_up')}</th>
                            <th />
                        </tr>
                        {this.state.unfinished.map(item => <TrUnfinishedLine key={`${item.name}:${item.created}`} item={item} /> )}
                        {this.state.lines.map((item, i) => (
                            <TrDataLine key={`${i}:${item.name}`} idx={i} item={item}
                                    actionButtonHandle={this.props.actionButtonHandle.bind(null, 'reuse')}
                                    publishCheckboxHandle={this.props.actionButtonHandle.bind(null, 'pub')} />
                        ))}
                    </tbody>
                </table>
            );
        }
    }

    // ------------------------ <FilterForm /> --------------------------

    const FilterForm:React.SFC<{
        filter:SubcListFilter;
        relatedCorpora:Immutable.List<string>;
        usesSubcRestore:boolean;

    }> = (props) => {

        const handleShowDeleted = () => {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_UPDATE_FILTER',
                payload: {
                    corpname: props.filter['corpname'],
                    show_deleted: !props.filter['show_deleted']
                }
            });
        };

        const handleCorpusSelection = (evt) => {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_UPDATE_FILTER',
                payload: {
                    corpname: evt.target.value,
                    show_deleted: props.filter['show_deleted']
                }
            });
        };

        return (
            <form className="filter">
                <fieldset>
                    <legend>{he.translate('subclist__filter_heading')}</legend>
                    <div>
                        <label htmlFor="inp_YT2rx">{he.translate('global__corpus')}: </label>
                        <select id="inp_YT2rx" value={props.filter.corpname}
                                    onChange={handleCorpusSelection}>
                                <option value="">--</option>
                                {props.relatedCorpora.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                    </div>
                    {props.usesSubcRestore ?
                        <div>
                            <label htmlFor="inp_EDPtb">{he.translate('subclist__show_deleted')}:</label>
                            <input id="inp_EDPtb" type="checkbox" onChange={handleShowDeleted} checked={props.filter['show_deleted']} />
                        </div> :
                        null
                    }
                </fieldset>
            </form>
        );
    };

    // ------------------------ <FormActionTemplate /> --------------------------

    const FormActionTemplate:React.SFC<{}> = (props) => {

        return (
            <form className="subc-action">
                <fieldset>
                    <legend>
                        <img src={he.createStaticUrl('img/collapse.svg')} alt="action form" />
                    </legend>
                    {props.children}
                </fieldset>
            </form>
        );
    };

    // ------------------------ <FormActionReuse /> --------------------------

    class FormActionReuse extends React.Component<{
        idx:number;
        data:SubcorpListItem;
    },
    {
        newName:string;
        newCql:string;
    }> {

        constructor(props) {
            super(props);
            this._handleSubmit = this._handleSubmit.bind(this);
            this._handleNameChange = this._handleNameChange.bind(this);
            this._handleCqlChange = this._handleCqlChange.bind(this);
            this.state = {
                newName: this.props.data.usesubcorp + ' (' + he.translate('global__copy') + ')',
                newCql: this.props.data.cql
            };
        }

        _handleSubmit() {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_REUSE_QUERY',
                payload: {
                    idx: this.props.idx,
                    newName: this.state.newName,
                    newCql: this.state.newCql
                }
            });
        }

        _handleNameChange(evt) {
            const newState = he.cloneState(this.state);
            newState.newName = evt.target.value;
            this.setState(newState);
        }

        _handleCqlChange(evt) {
            const newState = he.cloneState(this.state);
            newState.newCql = evt.target.value;
            this.setState(newState);
        }

        render() {
            return (
                <FormActionTemplate>
                    <div>
                        <label htmlFor="inp_0sAoz">{he.translate('global__name')}:</label>
                        <input id="inp_0sAoz" type="text" style={{width: '20em'}}
                                defaultValue={this.state.newName}
                                onChange={this._handleNameChange} />

                    </div>
                    <div>
                        <label htmlFor="inp_zBuJi">{he.translate('global__cql_query')}:</label>
                        <textarea id="inp_zBuJi" defaultValue={this.props.data.cql}
                                onChange={this._handleCqlChange} rows={4} />
                    </div>
                    <p>
                        <img src={he.createStaticUrl('img/warning-icon.svg')}
                                alt={he.translate('global__warning')}
                                style={{width: '1em', marginRight: '0.4em', verticalAlign: 'middle'}} />
                        {he.translate('subclist__reuse_query_warn')}
                    </p>
                    <div>
                        <button type="button" className="default-button"
                            onClick={this._handleSubmit}>{he.translate('subcform__create_subcorpus')}</button>
                    </div>
                </FormActionTemplate>
            );
        }
    }

    // ------------------------ <FormActionWipe /> --------------------------

    const FormActionWipe:React.SFC<{
        idx:number;

    }> = (props) => {

        const handleSubmit = () => {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_WIPE_SUBCORPUS',
                payload: {
                    idx: props.idx
                }
            });
        };

        return (
            <FormActionTemplate>
                <p>{he.translate('subclist__info_subc_will_be_wiped')}</p>
                <button type="button" className="default-button"
                        onClick={handleSubmit}>
                    {he.translate('global__confirm')}
                </button>
            </FormActionTemplate>
        );
    };


    // ------------------------ <FormActionRestore /> --------------------------

    const FormActionRestore:React.SFC<{
        idx:number;

    }> = (props) => {

        const handleSubmit = () => {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_RESTORE_SUBCORPUS',
                payload: {
                    idx: props.idx
                }
            });
        };

        return (
            <FormActionTemplate>
                <p>{he.translate('subclist__info_subc_will_be_restored')}</p>
                <button type="button" className="default-button"
                        onClick={handleSubmit}>
                    {he.translate('global__confirm')}
                </button>
            </FormActionTemplate>
        );
    };

    // ------------------------ <PublishSubmitButton /> --------------------------

    const PublishSubmitButton:React.SFC<{
        published:boolean;
        onSubmit:()=>void;

    }> = (props) => {
        return <button type="button" className="default-button"
                onClick={props.onSubmit}>
            {props.published ?
                he.translate('subclist__update_public_desc_btn') :
                he.translate('subclist__publish_now_btn')
            }
        </button>;
    };


    // ------------------------ <PublishingTab /> --------------------------

    class PublishingTab extends React.PureComponent<{
        rowIdx:number;
        description:string;
        published:boolean;

    }> {

        constructor(props) {
            super(props);
            this.handleSubmitPublish = this.handleSubmitPublish.bind(this);
            this.handleTextAreaChange = this.handleTextAreaChange.bind(this);
            this.handleSubmitUpdateDesc = this.handleSubmitUpdateDesc.bind(this);
        }

        private handleSubmitPublish() {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_PUBLISH_SUBCORPUS',
                payload: {
                    rowIdx: this.props.rowIdx,
                    description: this.props.description
                }
            });
        }

        private handleSubmitUpdateDesc() {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_PUBLIC_DESCRIPTION_SUBMIT',
                payload: {
                    rowIdx: this.props.rowIdx
                }
            });
        }

        private handleTextAreaChange(evt:React.ChangeEvent<HTMLTextAreaElement>) {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_UPDATE_PUBLIC_DESCRIPTION',
                payload: {
                    rowIdx: this.props.rowIdx,
                    description: evt.target.value
                }
            });
        }

        render() {
            return <FormActionTemplate>
                <label htmlFor="inp_3IDJH">{he.translate('subcform__public_description')}:</label>
                <textarea id="inp_3IDJH" cols={60} rows={10}
                        onChange={this.handleTextAreaChange}
                        value={this.props.description || ''} />
                <p className="note">({he.translate('global__markdown_supported')})</p>
                <p style={{width: '40em'}}>
                    <img src={he.createStaticUrl('img/warning-icon.svg')}
                        alt="warning-icon.svg" style={{width: '1.3em', verticalAlign: 'middle', marginRight: '0.3em'}} />
                    {
                        this.props.published ?
                            he.translate('subclist__ex_post_desc_update_warning') :
                            he.translate('subclist__ex_post_publish_warning')
                    }
                </p>
                <div>
                    <PublishSubmitButton onSubmit={this.props.published ? this.handleSubmitUpdateDesc :
                                            this.handleSubmitPublish} published={this.props.published} />
                </div>
            </FormActionTemplate>
        }
    };


    // ------------------------ <ActionBox /> --------------------------

    class ActionBox extends React.PureComponent<{
        idx:number;
        action:string;
        data:SubcorpListItem;
        modelIsBusy:boolean;
        onCloseClick:()=>void;

    }> {

        constructor(props) {
            super(props);
            this.handleActionSelect = this.handleActionSelect.bind(this);
        }

        handleActionSelect(action) {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_SET_ACTION_BOX_TYPE',
                payload: {value: action}
            });
        }

        render() {
            let items = Immutable.List<{id:string, label:string}>();
            let children = Immutable.List();
            if (!this.props.data.deleted) {
                items = items.push({id: 'pub', label: he.translate('subclist__public_access_btn')});
                children = children.push(<PublishingTab key="publish" published={this.props.data.published} description={this.props.data.description} rowIdx={this.props.idx} />)
            }
            if (!!this.props.data.cql) {
                items = items.push({id: 'reuse', label: he.translate('subclist__action_reuse')})
                children = children.push(<FormActionReuse key="action-reuse" idx={this.props.idx} data={this.props.data} />);
            }
            if (!!this.props.data.cql && this.props.data.deleted) {
                items = items.push(
                    {id: 'restore', label: he.translate('subclist__action_restore')},
                    {id: 'wipe', label: he.translate('subclist__action_wipe')}
                )
                children = children.push(<FormActionRestore key="restore" idx={this.props.idx}  />, <FormActionWipe key="wipe" idx={this.props.idx} />);
            }

            return (
                <layoutViews.ModalOverlay onCloseKey={this.props.onCloseClick}>
                    <layoutViews.CloseableFrame onCloseClick={this.props.onCloseClick}
                            customClass="subcorp-actions"
                            autoWidth={CoreViews.AutoWidth.WIDE}
                            label={he.translate('subclist__subc_actions_{subc}', {subc: this.props.data.name})}>
                        <div>
                            <layoutViews.TabView
                                    className="ActionMenu"
                                    callback={this.handleActionSelect}
                                    items={items} >
                                {children.toArray()}
                            </layoutViews.TabView>
                            <div className="loader-wrapper">
                                {this.props.modelIsBusy ? <layoutViews.AjaxLoaderBarImage /> : null}
                            </div>
                        </div>
                    </layoutViews.CloseableFrame>
                </layoutViews.ModalOverlay>
            )
        }
    }


    // ------------------------ <SubcorpList /> --------------------------

    class SubcorpList extends React.Component<SubcorpListProps, {
        filter:SubcListFilter;
        relatedCorpora:Immutable.List<string>;
        actionBoxVisible:number;
        actionBoxData:SubcorpListItem;
        actionBoxname:string;
        modelIsBusy:boolean;
        usesSubcRestore:boolean;
        actionBoxActionType:string;

    }> {

        private modelSubscription:Subscription;

        constructor(props) {
            super(props);
            this._modelChangeListener = this._modelChangeListener.bind(this);
            this._handleActionButton = this._handleActionButton.bind(this);
            this._handleActionsClose = this._handleActionsClose.bind(this);
            this.state = this._fetchModelState();
        }

        _fetchModelState() {
            const visibleRow = subcorpLinesModel.getActionBoxVisibleRow();
            return {
                filter: subcorpLinesModel.getFilter(),
                relatedCorpora: subcorpLinesModel.getRelatedCorpora(),
                actionBoxVisible: visibleRow,
                actionBoxData: visibleRow > -1 ? subcorpLinesModel.getRow(visibleRow) : null,
                actionBoxname: subcorpLinesModel.getActionBoxActionType(),
                modelIsBusy: subcorpLinesModel.getIsBusy(),
                usesSubcRestore: subcorpLinesModel.getUsesSubcRestore(),
                actionBoxActionType: subcorpLinesModel.getActionBoxActionType()
            };
        }

        _modelChangeListener() {
            this.setState(this._fetchModelState());
        }

        componentDidMount() {
            this.modelSubscription = subcorpLinesModel.addListener(this._modelChangeListener);
        }

        componentWillUnmount() {
            this.modelSubscription.unsubscribe();
        }

        _handleActionButton(action:string, idx:number) {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_SHOW_ACTION_WINDOW',
                payload: {
                    value: idx,
                    action: action
                }
            });
        }

        _handleActionsClose() {
            dispatcher.dispatch({
                name: 'SUBCORP_LIST_HIDE_ACTION_WINDOW',
                payload: {}
            });
        }

        render() {
            return (
                <div className="SubcorpList">
                    <section className="inner">
                        <FilterForm filter={this.state.filter} relatedCorpora={this.state.relatedCorpora}
                                usesSubcRestore={this.state.usesSubcRestore} />
                    </section>
                    {this.state.actionBoxVisible > -1
                        ? <ActionBox onCloseClick={this._handleActionsClose}
                                idx={this.state.actionBoxVisible}
                                data={this.state.actionBoxData}
                                action={this.state.actionBoxActionType}
                                modelIsBusy={this.state.modelIsBusy} />
                        : null}
                    <DataTable actionButtonHandle={this._handleActionButton} />
                </div>
            );
        }
    }

    return {
        SubcorpList: SubcorpList
    };
}