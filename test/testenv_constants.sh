#!/usr/bin/env bash

# DIRECTORIES
# TEST_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
TEST_DIR="$(dirname $(readlink -f ${BASH_SOURCE[0]}))"
ROOT_DIR="$(dirname ${TEST_DIR})"
ENV_DIR="${TEST_DIR}/integration_test_env"

GRAPHQL_SERVER_BRANCH=master
GRAPHQL_SERVER_1="${ENV_DIR}/gql_science_db_graphql_server1"
GRAPHQL_SERVER_2="${ENV_DIR}/gql_science_db_graphql_server2"

GRAPHQL_SERVER_1_URL="localhost:3000/graphql"
GRAPHQL_SERVER_2_URL="localhost:3030/graphql"
SERVER_CHECK_WAIT_TIME=60

# TERMINAL OUTPUT
RED='\033[0;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
GRAY='\033[38;5;242m'
NC='\033[0m'

DOUBLE_SEP="=================================================================="
SINGLE_SEP="------------------------------------------------------------------"
