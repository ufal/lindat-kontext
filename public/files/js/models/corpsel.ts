/*
 * Copyright (c) 2018 Charles University, Faculty of Arts,
 *                    Institute of the Czech National Corpus
 * Copyright (c) 2018 Tomas Machalek <tomas.machalek@gmail.com>
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

import * as Immutable from 'immutable';
import {Kontext} from '../types/common';
import {PluginInterfaces} from '../types/plugins';
import {PageModel} from '../app/main';
import { StatefulModel } from './base';
import { Action, IFullActionControl } from 'kombo';

/**
 * Fixed corpus, selectable subcorpus. This is used as an alternative to query model
 * on the 'first_form' page for pages where we still expect switching of (sub)corpus
 * but not for querying purposes.
 */
export class NonQueryCorpusSelectionModel extends StatefulModel implements PluginInterfaces.Corparch.ICorpSelection {

    private layoutModel:PageModel;

    private currentSubcorp:string;

    private origSubcorpName:string;

    private isForeignSubcorp:boolean;

    private availSubcorpora:Immutable.List<Kontext.SubcorpListItem>;

    private corpora:Immutable.List<string>;

    constructor({layoutModel, dispatcher, usesubcorp, origSubcorpName, foreignSubcorp, corpora, availSubcorpora=[]}:{
            layoutModel:PageModel;
            dispatcher:IFullActionControl;
            usesubcorp:string;
            origSubcorpName:string;
            foreignSubcorp:boolean;
            corpora:Array<string>;
            availSubcorpora:Array<Kontext.SubcorpListItem>}) {
        super(dispatcher);
        this.layoutModel = layoutModel;
        this.currentSubcorp = usesubcorp;
        this.origSubcorpName = origSubcorpName;
        this.isForeignSubcorp = foreignSubcorp;
        this.availSubcorpora = Immutable.List<Kontext.SubcorpListItem>(availSubcorpora);
        this.corpora = Immutable.List<string>(corpora);

        this.dispatcher.registerActionListener((action:Action) => {
            switch (action.name) {
                case 'QUERY_INPUT_SELECT_SUBCORP':
                    if (action.payload['pubName']) {
                        this.currentSubcorp = action.payload['pubName'];
                        this.origSubcorpName = action.payload['subcorp'];
                        this.isForeignSubcorp = action.payload['foreign'];

                    } else {
                        this.currentSubcorp = action.payload['subcorp'];
                        this.origSubcorpName = action.payload['subcorp'];
                        this.isForeignSubcorp = false;
                    }
                    const corpIdent = this.layoutModel.getCorpusIdent();
                    this.layoutModel.setConf<Kontext.FullCorpusIdent>(
                        'corpusIdent',
                        {
                            id: corpIdent.id,
                            name: corpIdent.name,
                            variant: corpIdent.variant,
                            usesubcorp: this.currentSubcorp,
                            origSubcorpName: this.origSubcorpName,
                            foreignSubcorp: this.isForeignSubcorp
                        }
                    );
                    this.emitChange();
                break;
            }
        });
    }

    getCurrentSubcorpus():string {
        return this.currentSubcorp;
    }

    getCurrentSubcorpusOrigName():string {
        return this.origSubcorpName;
    }

    getAvailableSubcorpora():Immutable.List<Kontext.SubcorpListItem> {
        return this.availSubcorpora;
    }

    getAvailableAlignedCorpora():Immutable.List<Kontext.AttrItem> {
        return Immutable.List<Kontext.AttrItem>();
    }

    getCorpora():Immutable.List<string> {
        return this.corpora;
    }

    getIsForeignSubcorpus():boolean {
        return this.isForeignSubcorp;
    }
}