#!/bin/bash

pwd=$(dirname $(realpath "$0"))

folder="$pwd/../keys"
mkdir -p "$folder"

cert="$folder/nohackgenda.crt"
key="$folder/nohackgenda.key"

if [[ -f "$cert" && -f "$key" ]]; then
    echo "Certificate already found"
else
    subj=""
    if [[ -n $CERTIFICATE_C ]];then
        subj+="/C=$CERTIFICATE_C"
    fi
    if [[ -n $CERTIFICATE_ST ]];then
        subj+="/ST=$CERTIFICATE_ST"
    fi
    if [[ -n $CERTIFICATE_L ]];then
        subj+="/L=$CERTIFICATE_L"
    fi
    if [[ -n $CERTIFICATE_O ]];then
        subj+="/O=$CERTIFICATE_O"
    fi
    if [[ -n $CERTIFICATE_CN ]];then
        subj+="/CN=$CERTIFICATE_CN"
    fi

    if [[ -z $subj ]];then
        openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out $cert -keyout $key -subj "/O=nohackgenda" 2>> /dev/null
    else
        openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out $cert -keyout $key -subj $subj 2>> /dev/null
    fi
    echo "Certificates generated in $folder"
fi


