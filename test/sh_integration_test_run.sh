#!/bin/bash

# -------------------------------------------------------------------------------------
# sh_integration_test_run.sh

#
# NAME
#     sh_integration_test_run.sh
#
# USAGE
#
#   Direct execution:
#
#     ./sh_integration_test_run.sh [OPTIONS]
#
#   Execution via npm:
#
#     npm run test-integration -- [-- OPTIONS]
#
#   cleaup:
#     npm run test-integration-clear
#   or
#     npm run test-integration -- -c
#
# DESCRIPTION
#     Command line utility to perform graphql server's integration-test.
#
#     The integration-test command creates a docker-compose environment with three servers:
#
#     gql_postgres
#     gql_science_db_graphql_server
#     gql_ncbi_sim_srv
#
#     The default behavior performs the following actions:
#
#         0) Checks the local testing environment (./docker/integration_test_run) and performs an initial setup the first time the command is run.
#         1) Stops and removes Docker containers with docker-compose down command. It also removes Docker images (--rmi) and volumes (-v) created in previous runs.
#         2) Removes any previously generated code located on the project's testing environment: ./docker/integration_test_run.
#         3) Generates the code using the test models located on the project's test directory: ./test/integration_test_models.
#         4) Creates and starts containers with docker-compose up command.
#         5) Execcutes integration tests.
#         6) Do a cleanup as described on steps 1) and 2) (use -k option to skip this step).
#
#     The options are as follows:
#
#     -b, --branch
#
#         This option changes the testing branch of the zendro server instances. Changing the branch is a permanent side effect.
#
#         It can be used alone to execute the default script, or in conjunction with -s or -T.
#
#         The default branch is set to "master". When running tests for the first time, make sure this option is set to the desired branch.
#
#     -c, --cleanup
#
#         This option performs the following actions:
#
#         1) Stops and removes Docker containers with docker-compose down command, also removes Docker images (--rmi) and named or anonymous volumes (-v).
#         2) Removes the testing environment server instances: ./docker/integration_test_run/{graphql-server,servers}.
#
#     -C, --softCleanup
#
#         This option performs the following actions:
#
#         1) Stops and removes Docker containers and volumes with docker-compose down command.
#         2) Removes any previously generated code located on the testing environment server instances: ./docker/integration_test_run/servers.
#
#     -g, --generate-code
#
#         This option performs the following actions:
#
#         1) Stop and removes containers with docker-compose down command (without removing images).
#         2) Removes any previously generated code located on the testing environment server instances: ./docker/integration_test_run/servers.
#         3) Re-generates the code from the test models located on current project's local directory: ./test/integration_test_models. The code is generated on local directory: ./docker/integration_test_run.
#         4) Creates and start containers with docker-compose up command.
#
#     -h, --help
#
#         Display this help and exit.
#
#     -k, --keep-running
#
#         This option skips the cleanup step at the end of the integration-test-suite and keeps the Docker containers running.
#
#         It can be used alone, or in conjunction with the options -t or -T.
#
#         If this option is not specified, then, by default, the cleanup step is performed at the end of the tests (see -c option).
#
#     -r, --restart-containers
#
#         This option performs the following actions:
#
#         1) Stop and removes containers with docker-compose down command (without removing images).
#         2) Creates and start containers with docker-compose up command.
#
#         Because the containers that manages the test-suite's databases do not use docker named volumes, but transient ones, the databases will be re-initialized by this command, too.
#
#     -s, --setup
#
#         This option performs the following actions:
#
#         1) Clones the graphql-server repository, optionally switching to the specified "-b BRANCH".
#         2) Uses the cloned repository to create the server instances necessary for the integration tests.
#
#     -t, --run-test-only
#
#         This option performs the following actions:
#
#         1) Stops and removes containers with docker-compose down command (without removing images).
#         2) Creates and starts containers with docker-compose up command.
#         3) Excecutes integration tests. The code should exists, otherwise the integration tests are not executed.
#
#         If option -k is also specified, then cleanup step is skipped at the end of the integration-test-suite, otherwise, the cleanup step is performed at the end of the tests (see -c option).
#
#     -T, --generate-code-and-run-tests
#
#         This option performs the following actions:
#
#         1) Stops and removes containers with docker-compose down command (without removing images).
#         2) Removes any previously generated code located on current project's local directory: ./docker/integration_test_run.
#         3) Re-generates the code from the test models located on current project's local directory: ./test/integration_test_models. The code is generated on local directory: ./docker/integration_test_run.
#         4) Creates and starts containers with docker-compose up command.
#         5) Excecutes integration tests. The code should exists, otherwise the integration tests are not executed.
#
#         If option -k is also specified, then cleanup step is skipped at the end of the integration-test-suite, otherwise, the cleanup step is performed at the end of the tests (see -c option).
#
# EXAMPLES
#     Command line utility to perform graphql server's integration-test.
#
#     To see full test-integration info:
#     $ npm run test-integration -- -h
#
#     To run default behavior (cleanup-genCode-doTests-cleanup):
#     $ npm run test-integration
#
#     To run default behavior but skip final cleanup (cleanup-genCode-doTests):
#     $ npm run test-integration -- -k
#
#     To restart containers:
#     $ npm run test-integration -- -r
#
#     To generate code:
#     $ npm run test-integration -- -g
#
#     To do the tests only and keep the containers running at end:
#     $ npm run test-integration -- -t -k
#
#     To generate code and do the tests, removing all Docker images at end:
#     $ npm run test-integration -- -T
#
#     To do a full clean up (removes containers, images and code):
#     $ npm run test-integration -- -c
#
#     To setup a new testing environment
#     $ npm run test-integration -- -s [BRANCH]
#
#     To do a soft clean up (removes containers, volumes and code, but preserves images):
#     $ npm run test-integration -- -C
#

# exit on first error
set -e

#
# Constants
#
DOCKER_SERVICES=(
  gql_postgres
  gql_science_db_graphql_server
  gql_ncbi_sim_srv
)
TARGET_BRANCH=master
TARGET_DIR="./docker/integration_test_run"
INSTANCE_DIRS=(
  "servers/instance1"
  "servers/instance2"
)
TEST_MODELS_INSTANCE1="./test/integration_test_models_instance1"
TEST_MODELS_INSTANCE2="./test/integration_test_models_instance2"
MANPAGE="./man/sh_integration_test_run.man"
SERVER_CHECK_WAIT_TIME=60
DO_DEFAULT=true
KEEP_RUNNING=false
NUM_ARGS=$#
RED='\033[0;31m'
LGREEN='\033[1;32m'
YEL='\033[1;33m'
LGRAY='\033[38;5;242m'
NC='\033[0m'

#
# Functions
#

#
# Function: checkGqlServer()
#
# Check if Zendro GraphQL servers respond to requests.
#
checkGqlServer() {

  host="localhost:${1}/graphql"

  logTask msg "Testing GraphQL server connection @ $host"

  elapsedTime=0
  until curl "$host" > /dev/null 2>&1
  do

    # Exit with error code 1
    if [ $elapsedTime == $SERVER_CHECK_WAIT_TIME ]; then

      logTask error "zendro graphql web server does not start, the wait time limit was reached (${SERVER_CHECK_WAIT_TIME}s)"
      return 1

    fi

    # Wait 2s and rety
    sleep 2
    elapsedTime=$(expr $elapsedTime + 2)
  done

  return 0

}

#
# Function: checkWorkspace()
#
# Check if graphql-server instance folders exist.
#
checkWorkspace() {

  logTask begin "Check graphql-server instances"

  FAIL=false

  for instance in ${INSTANCE_DIRS[@]}; do

    instance_name=$(basename $instance)

    if [[ ! -d "$TARGET_DIR/$instance" ]]; then

      FAIL=true
      logTask error "Server directory: ${RED}${instance_name}${NC} does not exist!"
    else
      logTask msg "${instance_name} exists"
    fi

  done

  if [[ $FAIL == true ]]; then
    logTask quit "One or more server instances were not installed. Please use ${YEL}-s${NC} or execute a full test run with ${YEL}-k${NC} before using this command."
    exit 0
  fi

  logTask end "Instances check"
}

#
# Function: consumeArgs()
#
# Shift the remaining arguments on $# list, and sets the flag KEEP_RUNNING=true if
# argument -k or --keep-running is found.
#
consumeArgs() {

  while [[ $NUM_ARGS -gt 0 ]]
  do
      a="$1"

      case $a in
        -k|--keep-running)

          # set flag
          KEEP_RUNNING=true

          logTask begin "Keep containers running at end: $KEEP_RUNNING"

          # Remove last argument
          shift
          let "NUM_ARGS--"
        ;;

        *)
          logTask msg "Discarding option: ${RED}$a${NC}"

          # Remove last argument
          shift
          let "NUM_ARGS--"
        ;;
      esac
  done
}

#
# Function: deleteDockerSetup()
#
# Removes docker containers, images, and volumes.
#
deleteDockerSetup() {

  logTask begin "Removing docker setup"

  docker-compose -f ./docker/docker-compose-test.yml down -v --rmi all

  logTask end "Removed docker setup"

}

#
# Function: deleteGenCode()
#
# Delete generated code.
#
deleteGenCode() {

  logTask begin "Removing generated code"

  # Change to workspace root
  cd $TARGET_DIR

  # Remove generated files
  bash scripts/clean-workspace.sh

  # Change to project root
  cd - 1>/dev/null

  logTask end "All code removed"

}

#
# Function: deleteServerSetup()
#
# Delete testing environment.
#
deleteServerSetup() {

  logTask begin "Removing Zendro instances"

  # Remove workspace modules and server instances
  rm -rf $TARGET_DIR/{graphql-server,servers}

  logTask end "Zendro instances deleted"

}

#
# Function: doTests()
#
# Run integration tests using mocha.
#
doTests() {

  logTask begin "Starting mocha tests"

  mocha ./test/mocha_integration_test.js

  logTask end "Mocha tests"

}

#
# Function: genCode()
#
# Generate code.
#
genCode() {

  logTask begin "Generating code"

  TARGET_DIR_INSTANCE1="${TARGET_DIR}/${INSTANCE_DIRS[0]}"
  TARGET_DIR_INSTANCE2="${TARGET_DIR}/${INSTANCE_DIRS[1]}"

  # Generate code
  node ./index.js -f ${TEST_MODELS_INSTANCE1} -o ${TARGET_DIR_INSTANCE1}
  node ./index.js -f ${TEST_MODELS_INSTANCE2} -o ${TARGET_DIR_INSTANCE2}

  # Patch the resolver for web-server
  # patch -V never ${TARGET_DIR_INSTANCE1}/resolvers/aminoacidsequence.js ./docker/ncbi_sim_srv/amino_acid_sequence_resolver.patch
  patch -V never ${TARGET_DIR_INSTANCE1}/models/generic/aminoacidsequence.js ./docker/ncbi_sim_srv/model_aminoacidsequence.patch
  # Add monkey-patching validation with AJV
  patch -V never ${TARGET_DIR_INSTANCE1}/validations/individual.js ./test/integration_test_misc/individual_validate.patch
  # Add patch for model webservice (generic) association
  # patch -V never ${TARGET_DIR_INSTANCE1}/models/transcript_count.js ./docker/ncbi_sim_srv/model_transcript_count.patch

  # Add patch for sql model accession validation
  patch -V never ${TARGET_DIR_INSTANCE1}/validations/accession.js ./test/integration_test_misc/accession_validate_instance1.patch

  logTask end "Code generated on ${TARGET_DIR_INSTANCE1} and ${TARGET_DIR_INSTANCE2}"

}

#
# Function: logTask()
#
# Logs a task begin or end message to stdout.
#
# USAGE:
#
#   $ logTask <mode> "<task message>"
#
# <mode> = begin | check | end | msg | quit
#
logTask() {

  case $1 in
    begin)
      echo -e "\n${LGRAY}@@ ----------------------------${NC}"
      echo -e "${LGRAY}@@ $2...${NC}"
    ;;
    check)
      echo -e "@@ $2 ... ${LGREEN}done${NC}"
    ;;
    end)
      echo -e "@@ $2 ... ${LGREEN}done${NC}"
      echo -e "${LGRAY}---------------------------- @@${NC}\n"
    ;;
    error)
      echo -e "!!${RED}ERROR${NC}: $2"
    ;;
    msg)
      echo -e "@@ $2"
    ;;
    quit)
      echo -e "@@ $2 ... ${YEL}exit${NC}"
    ;;
  esac

}

#
# Function: man()
#
# Show man page of this script.
#
man() {
  # Show
  more ${MANPAGE}
}

#
# Function: restartContainers()
#
# Downs and ups containers
#
restartContainers() {

  logTask begin "Restarting containers"

  # Soft down
  docker-compose -f ./docker/docker-compose-test.yml down
  logTask check "Containers down"

  # Up
  docker-compose -f ./docker/docker-compose-test.yml up -d
  logTask check "Containers up"

  # List
  docker-compose -f ./docker/docker-compose-test.yml ps

  logTask end "Containers restarted"

}

#
# Function: resetDockerSetup()
#
# Stops docker-compose testing environment, removes containers and volumes.
#
resetDockerSetup() {

  logTask begin "Removing docker containers and volumes"

  docker-compose -f ./docker/docker-compose-test.yml down -v

  logTask end "Containers down"

}

#
# Function: setupTestingEnvironment
#
# Clones and initializes a two-server environment workspace.
#
setupTestingEnvironment() {

  # Remove any existing setup
  deleteServerSetup

  logTask begin "Cloning main Zendro server"

  # Declare main server path
  MAIN_SERVER="${TARGET_DIR}/graphql-server"

  # Clone graphql-server and checkout the feature branch
  git clone \
    --branch $TARGET_BRANCH \
    https://github.com/Zendro-dev/graphql-server.git \
    $MAIN_SERVER

  # Force "node-jq" to use the docke image "jq"
  export NODE_JQ_SKIP_INSTALL_BINARY=true

  # Install module dependencies
  npm install --prefix $MAIN_SERVER

  logTask end "Installed Zendro server"

  # Copy graphql-server instances
  logTask begin "Creating Zendro instances"

  for instance in ${INSTANCE_DIRS[@]}; do

    mkdir -p $TARGET_DIR/servers
    cp -r $MAIN_SERVER ${TARGET_DIR}/${instance}

  done

  logTask end "Zendro instances created"

}

#
# Function: upContainers()
#
# Up docker containers.
#
upContainers() {

  logTask begin "Starting up containers"

  # Up
  docker-compose -f ./docker/docker-compose-test.yml up -d --no-recreate

  # List
  docker-compose -f ./docker/docker-compose-test.yml ps

  logTask end "Containers up"

}

#
# Function: waitForGql()
#
# Waits for GraphQL Server to start, for a maximum amount of SERVER_CHECK_WAIT_TIME seconds.
#
waitForGql() {

  logTask begin "Waiting for GraphQL servers to start"

  hosts=(3000 3030)
  pids=( )

  for h in ${hosts[@]}; do

    checkGqlServer $h &
    pids+="$! "

  done

  # Wait until Zendro GraphQL servers are up and running
  for id in ${pids[@]}; do

    wait $id || exit 0

  done

  logTask end "GraphQL servers are up!"

}

#
# Main
#
if [ $# -gt 0 ]; then
    # Process comand line arguments.
    while [[ $NUM_ARGS -gt 0 ]]
    do
        key="$1"

        case $key in
            -b|--branch)

              shift
              let "NUM_ARGS--"

              TARGET_BRANCH=$1

              if [[ -z $TARGET_BRANCH || $TARGET_BRANCH =~ ^-|^-- ]]; then
                logTask quit "-b requires a value: ... ${key} ${RED}<BRANCH>${NC} $@"
                exit 0
              fi

              logTask msg "setting test environment branch to: $TARGET_BRANCH"

              # Forcefully checkout instances to the specified branch
              cd $TARGET_DIR
              bash scripts/checkout-branch.sh $TARGET_BRANCH
              cd - 1>/dev/null

              shift
              let "NUM_ARGS--"
            ;;

            -k|--keep-running)
              # Set flag
              KEEP_RUNNING=true
              # Msg
              logTask msg "keep containers running at end: $KEEP_RUNNING"

              # Past argument
              shift
              let "NUM_ARGS--"
            ;;

            -h|--help)
              # show man page
              man

              # Done
              exit 0
            ;;

            -s|--setup)

              # Setup testing environment
              setupTestingEnvironment

              # Done
              exit 0
            ;;

            -r|--restart-containers)
              # Restart containers
              restartContainers

              # Done
              exit 0
            ;;

            -g|--generate-code)
              # Check server instances
              checkWorkspace
              # Remove previously generated code
              deleteGenCode
              # Run code generator
              genCode

              # Done
              exit 0
            ;;

            -t|--run-tests-only)
              # Check workspace folders
              checkWorkspace
              # Restart containers
              upContainers
              # Wait for graphql servers
              waitForGql
              # Do the tests
              doTests

              # Past argument
              shift
              let "NUM_ARGS--"

              # Consume remaining arguments
              consumeArgs $@

              # Clear flag
              DO_DEFAULT=false
            ;;

            -T|--generate-code-and-run-tests)
              # Reset containers and volumes
              resetDockerSetup
              # Re-generate code
              deleteGenCode
              genCode
              # Up containers
              upContainers
              # Wait for graphql servers
              waitForGql
              # Do the tests
              doTests

              # Past argument
              shift
              let "NUM_ARGS--"

              # Consume remaining arguments
              consumeArgs $@

              # Clear flag
              DO_DEFAULT=false
            ;;

            -c|--cleanup)
              # Docker cleanup
              deleteDockerSetup
              # Testing environment cleanup
              deleteServerSetup
              # Done
              exit 0
            ;;

            -C|--soft-cleanup)
              # Reset containers and volumes
              resetDockerSetup
              # Remove generated code
              deleteGenCode
              # Done
              exit 0
            ;;

            *)
              # Msg
              logTask quit "Bad option: ... ${RED}$key${NC} ... ${YEL}exit${NC}"
              exit 0
            ;;
        esac
    done
fi

#
# Default
#
if [ $DO_DEFAULT = true ]; then

  # Default run: no arguments #

  # Docker cleanup
  deleteDockerSetup

  # Reset testing environment
  setupTestingEnvironment

  # Generate code
  genCode

  # Ups containers
  upContainers

  # Wait for graphql servers
  waitForGql

  # Do the tests
  doTests

fi

#
# Last cleanup
#
if [ $KEEP_RUNNING = false ]; then

  logTask msg "Doing final cleanup"

  # Docker cleanup
  deleteDockerSetup

  # Testing environment cleanup
  deleteServerSetup

else

  # List containers
  docker-compose -f ./docker/docker-compose-test.yml ps

  logTask end "Keep containers running"

fi
