#!/bin/bash
set -e -o pipefail

THISDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Working in `pwd`"

source $THISDIR/functions.sh

if [[ "x$REPO_NAME" == "x" ]]; then
    REPO_NAME=kontext
fi

THISSCRIPT=`basename "$0"`
minisep "$THISSCRIPT ($REPO_NAME)" 
start=`date +%s`

export FS=$THISDIR/..
export INSTALLDIR=/opt/kontext/bits
export INSTALLKONTEXT=/opt/kontext/installation
export INSTALLDATA=/opt/kontext/data
INSTALL_FROM_DEBS=true
export PORT=5000
if [[ "x$MYSQLUSER" == "x" ]]; then
    export MYSQLUSER=root
fi
if [[ "x$MYSQLPASS" == "x" ]]; then
    export MYSQLPASS=
fi

minisep "Creating install dir - $INSTALLDIR"
sudo mkdir -p $INSTALLDIR
sudo chown -R $USER:$USER $INSTALLDIR/..

# =========
# OS prereq

#prereqs from ../doc/INSTALL.md, libicu to prevent fatal error: unicode/utypes.h: No such file or directory
sudo apt-get install -y libxml2-dev libxslt-dev python-dev libicu-dev


if [[ -f $FS/apt-requirements.txt ]]; then
    minisep "apt-ing"
    sudo apt-get -qq update > /dev/null
    minisep "apt-ing $FS/apt-requirements.txt"
    xargs apt-get -q install -y < $FS/apt-requirements.txt
fi

if [[ -f $FS/requirements.txt ]]; then
    minisep "pip-ing"
    pip install -U --ignore-installed -r $FS/requirements.txt
fi


# =========
# prereq


# npm in normal repo is broken
# http://stackoverflow.com/questions/12913141/message-failed-to-fetch-from-registry-while-trying-to-install-any-module
# https://github.com/npm/npm/issues/4389
curl -sL https://deb.nodesource.com/setup_4.x | sudo bash -  > /dev/null
sudo apt-get install -y nodejs


################ bonito + manatee
# download deb files if we haven't already
if [[ "x$INSTALL_FROM_DEBS" == "xtrue" ]]; then
    cd $INSTALLDIR
    echo `pwd`
    ls -lah
    if [[ ! -d corpora.fi.muni.cz ]]; then 
        minisep "Installing manatee and others"
        # URL=http://corpora.fi.muni.cz/noske/deb/archive/1204
        URL=http://corpora.fi.muni.cz/noske/deb/1604
        for i in antlr3c finlib manatee-open; do
            wget -r --accept "*.deb" --level 1 $URL/$i
        done
        for p in libantlr3c_ finlib_ manatee-open_; do
            find corpora.fi.muni.cz/ -name "*$p*.deb" -exec bash -c 'echo "installing $0" && (sudo dpkg -i $0 || echo "install failed softly")' {} \;
        done
        sleep 5
        ls -lah /var/lib/dpkg/lock || true
        sh -c "sudo rm -rf /var/lib/dpkg/lock || true"
        sudo chmod 777 /var
        sudo chmod -R 777 /var/lib/
        ls -lah /var/lib/dpkg/lock || true
        #p=manatee-open-python_
        bash -c "sudo dpkg -i corpora.fi.muni.cz/noske/deb/archive/1204/manatee-open/manatee-open-python_2.130.6-1ubuntu1_amd64.deb || echo ???"
        #find corpora.fi.muni.cz/ -name "*$p*.deb" -exec bash -c 'echo "installing $0" && (sudo dpkg -i $0 || echo "install failed softly")' {} \;

    else
        echo "NOT RE-INSTALLING DEB FILES!"
    fi
else
    minisep "Creating dir structure"
    sudo mkdir -p $INSTALLDIR/nosketch/finlib
    sudo mkdir -p $INSTALLDIR/nosketch/manatee-open

    minisep "Installing finlib"
    cd $INSTALLDIR/nosketch/finlib
    VER=2.22.2
    PACKAGE=finlib-$VER
    FILE=$PACKAGE.tar.gz
    URL=https://dl.dropboxusercontent.com/u/79180955/$FILE
    install $FILE $PACKAGE $URL "tar xzf"


    minisep "Installing manatee"
    cd $INSTALLDIR/nosketch/manatee-open
    # package finlib will be used
    CONFIGUREPARAMS="CPPFLAGS=\"-I$INSTALLDIR/nosketch/finlib/$PACKAGE\" LDFLAGS=\"-L/usr/local/lib\""
    INSTALLPARAMS="DESTDIR=\"/\""
    VER=2.83.3
    PACKAGE=manatee-open-$VER
    FILE=$PACKAGE.tar.gz
    URL=https://dl.dropboxusercontent.com/u/79180955/$FILE
    install $FILE $PACKAGE $URL "tar xzf"
fi

# try but not output dir, output version
apt-get install -y mlocate
updatedb
locate manatee
echo PYTHONPATH=$PYTHONPATH
echo PATH=$PATH
python -c "import sys; print sys.path"

sep
python -c "import manatee; dir(manatee); print; print manatee.version()"
python -c "import _manatee; dir(_manatee); print; print _manatee.version()"
sep

# =========
# kontext-data

minisep "Creating data dir structure"
sudo mkdir -p /tmp/kontext-upload
sudo mkdir -p $INSTALLDATA/{subcorp,cache,registry}
sudo mkdir -p $INSTALLDATA/corpora/{conc,speech,vert}
sudo mkdir -p /var/local/corpora/{freqs-precalc,freqs-cache}

# =========
# kontext

# mysql should be already present!
mysql -u$MYSQLUSER -e 'CREATE DATABASE IF NOT EXISTS kontext-test;'


minisep "Using test configs"
if [[ ! -f $FS/conf/config.xml ]]; then
    ln -s $THISDIR/configs/test_config.xml $FS/conf/config.xml
fi
if [[ ! -f $FS/conf/corplist.xml ]]; then
    ln -s $THISDIR/configs/corplist.xml $FS/conf/corplist.xml
fi

minisep "Using beat provided sample configs"
cp $FS/conf/beatconfig.sample.py $FS/conf/beatconfig.py

if [[ ! -d $INSTALLKONTEXT ]]; then
    ln -s $FS $INSTALLKONTEXT
fi

mkdir -p /var/log/kontext

cd $INSTALLKONTEXT
npm install grunt-cli
npm install
./node_modules/.bin/grunt devel

# pm2 process manager
sudo npm install pm2 -g
minisep "starting kontext"
pm2 start public/app.py --interpreter=python --name "kontext" -- --address 0.0.0.0 --port $PORT
sleep 5
pm2 l

sep
end=`date +%s`
echo "Script $THISSCRIPT ($REPO_NAME) took $((end-start)) seconds"
info "Finished $THISSCRIPT" "$REPO_NAME"
sep
