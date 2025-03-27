#!/bin/bash

export HALEX_DREAMAPI_KEY=change_it
export VDL_API_TOKEN_REQUEST_PARAMETERS_CLIENT_SECRET=change_it
export VDL_API_TOKEN_REQUEST_PARAMETERS_PASSWORD=change_it

APP_ENV=poc
APP_NAME=weather-information-collector
APP_VER=0.0.1-SNAPSHOT

APP_HOME=$(cd $(dirname ${BASH_SOURCE:-$0})/..; pwd)
JAR=${APP_HOME}/lib/${APP_NAME}-${APP_VER}.jar

cd ${APP_HOME}
java -jar ${JAR} --spring.profiles.active=${APP_ENV}
