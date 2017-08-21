from controller import exposed
import actions.custom


def create_lindat_status_action(commit):
    @exposed(return_type='json')
    def lindat_status(controller, request):
        return {'commit': commit}

    return lindat_status


class LindatStatus(object):
    def __init__(self, commit):
        self._commit = commit

    def export_actions(self):
        return {actions.custom.Custom: [create_lindat_status_action(self._commit)]}

def create_instance(settings):
    import subprocess
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"]).strip()
    return LindatStatus(commit)
