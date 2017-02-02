#!/bin/bash
set -e -o pipefail

if [[ "x$INSTANCE_TEST" == "xtrue" ]]; then
    curl -v http://localhost:$PORT/
    tail /opt/kontext/log/kontext.log || true
fi
