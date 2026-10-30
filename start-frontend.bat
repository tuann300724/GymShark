@echo off
pushd "%~dp0frontend"
start "FrontendServer" cmd /k "npm run start"
