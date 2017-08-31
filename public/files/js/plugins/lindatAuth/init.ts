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
/// <reference path="../../../ts/declarations/rsvp.d.ts" />
/// <reference path="./aai.d.ts" />
/// <amd-dependency path="aai" />

import RSVP = require('vendor/rsvp');

export function create(pluginApi: Kontext.PluginApi): RSVP.Promise<Kontext.Plugin> {
    return new RSVP.Promise((resolve: (ans: Kontext.Plugin) => void, reject: (e: any) => void) => {
        let pluginConfig: any = pluginApi.getConf<any>('pluginData').auth;
        // pass our config to external aai.js
        if (!('aai' in window)) {
            throw new Error('Failed to find LINDAT/CLARIN AAI object. ' +
                'See https://github.com/ufal/lindat-aai-discovery for more details!');
        }
        let opts: AAI.AaiOptions = {};

        opts.metadataFeed = pluginConfig.metadataFeed;
        // if ever port is needed (eg. testing other tomcat) it should be in responseUrl and target
        opts.port = (window.location.port === '' ? '' : ':' + window.location.port);
        opts.host = window.location.protocol + '//' + window.location.hostname;
        opts.target = opts.host + opts.port + pluginConfig.login_url +
            encodeURIComponent(window.location.href);
        opts.serviceName = pluginConfig.service_name;
        opts.responseUrl = pluginConfig.response_url;
        opts.localauth =
            '<form method="post" action="' + pluginConfig.local_action + '"> ' +
            '<p>Sign in using your local account obtained from the LINDAT/CLARIN administrator.</p>' +
            '<p style="margin: 5px; color: #888" >' +
            '<input type="text" name="username" style="font-size: 160%; width: 100%" id="login" /> ' +
            '<label for="login">Username</label>' +
            '</p>' +
            '<p style="margin: 5px; color: #888" >' +
            '<input type="password" name="password" style="font-size: 160%; width: 100%" id="pass" />' +
            '<label for="pass">Password</label>' +
            '</p>' +
            '<p  style="" >' +
            '<input type="submit" style="margin: 20px 2px" name="submit" value="Sign in" />' +
            '</p>' +
            '</form>';
        ((window as any).aai as any).setup(opts);
        // ---
        resolve(null);
    });
}
