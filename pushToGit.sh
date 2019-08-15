#!/usr/local/env bash

set -e;

git add ./modules_frontend_backend
git add ./public
git add ./src        
git add ./link_modules.sh
git add ./pushToGit.sh
git add ./server.js
git add ./startServer.sh

git commit -m "bashed update"

git remote rm origin

git remote add origin "https://github.com/MrSoir/d1miniServerBackendFrontend.git"

git push -u origin master
