#!/usr/local/env bash

set -e;

# staticfunctions:
cd ./modules_frontend_backend/StaticFunctions
npm link

cd ../../
npm link staticfunctions


#---------------------------------------------


# staticfunctions:
cd ./modules_frontend_backend/ServerStaticFunctions
npm link

cd ../../
npm link serverstaticfunctions


#---------------------------------------------


# irrigationentry:
cd ./modules_frontend_backend/IrrigationEntry
npm link

cd ../../
npm link irrigationentry
