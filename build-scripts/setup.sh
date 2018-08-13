#!/bin/bash
set -e -o pipefail
set -o xtrace
set -o verbose

THISDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Working in `pwd`"
source ${THISDIR}/functions.sh

if [[ "x$REPO_NAME" == "x" ]]; then
    REPO_NAME=kontext
fi

THISSCRIPT=`basename "$0"`
minisep "$THISSCRIPT ($REPO_NAME)" 
start=`date +%s`

# =======

cd $THISDIR
echo "Setting up default configuration, registry and data"
source ./setup_defaults.sh

# build either from sources, packages or using docker
if [[ "x$BUILDBACKEND" == "xbuild" ]]; then
    minisep "Starting kontext natively"
    cd $THISDIR
    ./run_build.sh
fi

if [[ "x$BUILDBACKEND" == "xdocker" ]]; then
    minisep "Starting kontext in docker"
    date

    IMAGE=registry.gitlab.com/misutka/docker-kontext-base:v2.158.8
    time docker pull $IMAGE
    docker run --name kontext -d -p ${PORT}:5000 --rm \
        -v $FS:/opt/kontext/log/ \
        -v $FS:/opt/kontext/installation \
        -v $TESTCORPORA:/opt/lindat/lindat-test-corpora \
        -v $MANATEE_REGISTRY_PATH:/opt/kontext/data/registry \
        $IMAGE
    DOCKERIP=`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' kontext`
    echo "Using IP: $DOCKERIP"
    docker logs -f kontext &
    # sleep 180
    URL="http://$DOCKERIP:${PORT}/"
    echo "Waiting for $URL..."
    wget --retry-connrefused --tries=30 -q --wait=10 --spider $URL
    
    date
fi


sep
end=`date +%s`
echo "Script $THISSCRIPT ($REPO_NAME) took $((end-start)) seconds"
sep
