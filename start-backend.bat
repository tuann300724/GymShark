@echo off
pushd "%~dp0backend"
start "BackendAPI" cmd /k "npm run start:dev"
