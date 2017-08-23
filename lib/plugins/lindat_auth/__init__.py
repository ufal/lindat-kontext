# coding=utf-8
"""
    Authentication and authorization based on Federated login (Shibboleth) and
    limited local user support.

    This auth is not generic enough to be called ShibbolethAuth because it uses
    specific database backed etc.

"""
import logging
import os
import plugins
from plugins.abstract.auth import AbstractSemiInternalAuth
from plugins.abstract import PluginException

_logger = logging.getLogger(__name__)


def _get_non_empty_header(ftor, *args):
    for header in args:
        val = ftor(header)
        if val is None or 0 == len(val):
            continue
        return val
    return None


class ShibbolethAuth(AbstractSemiInternalAuth):
    """
        A custom Shibboleth authentication module.
    """
    ID_KEYS = ('HTTP_EPPN', 'HTTP_PERSISTENT_ID', 'HTTP_MAIL')

    def get_user_info(self, user_id):
        raise NotImplementedError()

    def __init__(self, public_corplist, db, sessions, conf):
        """

        Arguments:
            public_corplist -- default public corpora list
            db_provider -- default database
            sessions -- a session plugin
        """
        anonymous_id = int(conf['anonymous_user_id'])
        super(ShibbolethAuth, self).__init__(anonymous_id=anonymous_id)
        self._db = db
        self._sessions = sessions
        self._public_corplist = public_corplist

    def validate_user(self, plugin_api, username, password):
        """
            A dictionary with user properties or empty dict
        """
        if username is not None and username != '':
            raise NotImplementedError()

        username = _get_non_empty_header(plugin_api.getenv, *ShibbolethAuth.ID_KEYS)
        if username is None:
            return self.anonymous_user()

        firstname = _get_non_empty_header(
            plugin_api.getenv, 'HTTP_GIVENNAME')
        surname = _get_non_empty_header(
            plugin_api.getenv, 'HTTP_SN')
        displayname = _get_non_empty_header(
            plugin_api.getenv, 'HTTP_DISPLAYNAME', 'HTTP_CN')

        # this will work most of the times but very likely not
        # always (no unification in what IdPs are sending)
        if not firstname and not surname:
            names = displayname.split()
            firstname = u" ".join(names[:-1])
            surname = names[-1]
        firstname = firstname or ""
        surname = surname or ""

        return dict(id=0xff, user='Authenticated', fullname=u'%s %s' % (firstname, surname))

    def logout(self, session):
        self._sessions.delete(session)
        session.clear()

    def permitted_corpora(self, user_id):
        # TODO(jm) based on user_id
        return self._public_corplist

    def is_administrator(self, user_id):
        # TODO(jm)
        return False

    def logout_hook(self, plugin_api):
        plugin_api.redirect('%sfirst_form' % (plugin_api.root_url,))


def _load_corplist(corptree_path):
    """
        This auth relies on a list of corpora in a file
        from which we get the public ones. At the moment,
        all corpora in that file are considered public.

        Private can be added via user database.
    """
    from plugins.tree_corparch import CorptreeParser
    _, metadata = CorptreeParser().parse_xml_tree(corptree_path)
    return dict((k, k) for k in metadata.keys())


@plugins.inject('sessions')
def create_instance(conf, sessions):
    auth_conf = conf.get('plugins', 'auth')
    corparch_conf = conf.get('plugins', 'corparch')
    corplist_file = corparch_conf['file']
    if not os.path.exists(corplist_file):
        raise PluginException("Corplist file [%s] in lindat_auth does not exist!" % corplist_file)
    public_corplist = _load_corplist(corplist_file)

    # db plugin is not generic enough (should it be?) to inject and use
    # a different shard/database/table here, do it manually
    from plugins.redis_db import RedisDb
    db_conf = conf.get('plugins', 'db')
    db_conf["id"] = auth_conf['lindat:auth_db_shard']
    db = RedisDb(db_conf)

    return ShibbolethAuth(
        public_corplist=public_corplist, db=db, sessions=sessions, conf=auth_conf
    )
