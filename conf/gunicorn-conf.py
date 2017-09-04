import multiprocessing
import os

port = os.environ.get('PORT', 5000)

workers = multiprocessing.cpu_count() * 2 + 1
bind = "127.0.0.1:" + str(port)
timeout = 300
accesslog = "/var/log/gunicorn.log"
errorlog = "/var/log/gunicorn-error.log"
