#!/bin/bash
set -e -o pipefail

THISDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Working in `pwd`"
source $THISDIR/functions.sh

THISSCRIPT=`basename "$0"`
minisep "$THISSCRIPT ($REPO_NAME)" 
start=`date +%s`

export FS=$THISDIR/..
if [[ "x$INSTALLDATA" == "x" ]]; then
    export INSTALLDATA=/opt/kontext/data
fi
if [[ "x$PORT" == "x" ]]; then
    export PORT=5000
fi

# build
pm2 stop kontext
sleep 2

if sudo lsof -i :$PORT; then
    echo "STILL RUNNING!!!"
	# sudo lsof -i :$PORT | sed -e 's/ \+/ /g' | cut -d" " -f2 | tail -n +2 | xargs sudo kill -9
fi

cd $INSTALLDATA
EXAMPLEDATA=lindat-kontext-ovm
git clone https://github.com/ufal/$EXAMPLEDATA
ln -s $INSTALLDATA/$EXAMPLEDATA/registry/ovm_cs_w registry/ovm_cs_w
sed -i.bak 's/lindat\/kontext-data\/speech/kontext\/data\/corpora\/speech/g' registry/ovm_cs_w
sed -i.bak 's/lindat\/kontext-data/kontext\/data\/corpora/g' registry/ovm_cs_w
ln -s $INSTALLDATA/$EXAMPLEDATA/speech/OVM corpora/speech/OVM



sep
end=`date +%s`
echo "Script $THISSCRIPT ($REPO_NAME) took $((end-start)) seconds"
info "Finished $THISSCRIPT" "$REPO_NAME"
sep