#!/usr/bin/bash
cd /belgiumwheelers
nodemon -x 'node /belgiumwheelers/view/main.mjs || touch /belgiumwheelers/view/main.mjs' >>/belgiumwheelers/logs 2>>/belgiumwheelers/errors