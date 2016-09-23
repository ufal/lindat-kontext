# common functions that should can be `source`d to other scripts
# 

sep() {
    echo "------------------------"
}

minisep() {
    if [[ "x$1" != "x" ]]; then
        echo
        echo "  ==================== $1 ======================="
    else
        echo "  ====                                       ===="
    fi
}

microsep() {
    if [[ "x$1" != "x" ]]; then
        echo
        echo "  --- $1"
    else
        echo "  ---"
    fi
}

install() {
    FILE=$1
    PACKAGE=$2
    URL=$3
    UNPACK=$4
    
    minisep $PACKAGE

    if [ -f $FILE ]; then
       echo "File $FILE already exists - skipping."
    else
        wget --no-check-certificate  -nv $URL -O $FILE > /dev/null
    fi
    if [ ! -d $PACKAGE ]; then
        $UNPACK $FILE > /dev/null
    fi
    cd $PACKAGE
    echo "Installing from `pwd`"
    bash -c "$CONFIGUREPARAMS ./configure --with-pcre --prefix=/usr/local"
    make
    bash -c "sudo -E $INSTALLPARAMS make install"
    sudo ldconfig

    export CONFIGUREPARAMS=
    export INSTALLPARAMS=
}
