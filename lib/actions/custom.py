from controller import exposed
from kontext import Kontext


class Custom(Kontext):
    def __init__(self, request, ui_lang):
        """
        arguments:
        request -- Werkzeug's request object
        ui_lang -- a language code in which current action's result will be presented
        """
        super(Custom, self).__init__(request=request, ui_lang=ui_lang)

    def get_mapping_url_prefix(self):
        return '/custom/'

    @exposed(return_type='json')
    def my_test(self, request):
        return 'This works'
