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

import * as util from '../../util';
import * as Immutable from 'immutable';
import {init as viewInit} from './view';
import RSVP from 'rsvp';
import * as React from 'react';
declare var $:any;
import {Kontext} from '../../types/common';
import {IPluginApi, PluginInterfaces} from '../../types/plugins';
import {StatefulModel} from '../../models/base';
import {ActionPayload} from '../../app/dispatcher';
import {TreeWidgetModel} from './model';

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
export function create_old(selectElm: HTMLElement, targetAction: string, pluginApi:IPluginApi,
                       options:Kontext.GeneralProps) {
    
}

export class CorplistPage  {

    private pluginApi:IPluginApi;

    private treeStore:TreeWidgetModel;

    private viewsLib:any;

    constructor(pluginApi:IPluginApi) {
        this.pluginApi = pluginApi;
        this.treeStore = new TreeWidgetModel(pluginApi, (corpusIdent: string) => {
            window.location.href = pluginApi.createActionUrl('first_form?corpname=' + corpusIdent);
        });
        this.viewsLib = viewInit(pluginApi.dispatcher(), pluginApi.getComponentHelpers(),
                this.treeStore);
    }


    createList(targetElm: HTMLElement, properties: any):React.ComponentClass<{}> {
        $('noscript').before('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">');
        $('#content').addClass('lindatCorparch-content');
        $('.corplist').addClass('lindatCorparch-section');

        return this.viewsLib.CorptreePageComponent
    }
}


export class Plugin {

    protected pluginApi:IPluginApi;

    constructor(pluginApi:IPluginApi) {
        this.pluginApi = pluginApi;
    }


    createWidget(targetAction:string, corpSel:PluginInterfaces.Corparch.ICorpSelection,
            options:Kontext.GeneralProps):React.ComponentClass<{}> {
    
        let treeStore = new TreeWidgetModel(this.pluginApi, (corpusIdent: string) => {
            window.location.href = this.pluginApi.createActionUrl(targetAction, [['corpname', corpusIdent]]);
        });
        let viewsLib = viewInit(
                this.pluginApi.dispatcher(), 
                this.pluginApi.getComponentHelpers(),
                treeStore
        );
        return viewsLib.CorptreeWidget;
    }

    initCorplistPageComponents():PluginInterfaces.Corparch.ICorplistPage {
        const cp = new CorplistPage(this.pluginApi);
        cp.createForm();

    }
}


const create:PluginInterfaces.Corparch.Factory = (pluginApi) => {
    return new Plugin(pluginApi);

    
}

export default create;