#!/bin/bash


# One Script to Rule Them All
#
# This is the configuration script for the project
# it will evolve over time


# Make the script agnostic to the project root
PROJECT_ROOT=$(pwd)


# ##########################
# ### Configuration & Envs ###
# 
# Nothing in here for now
#
# ##########################



# ##########################
# ### Database config ###
#
# Start the database and generate the types
# then copy the types to the shared package
# TODO - make this work regardless of the state of the DB, will work but should do a db reset ngl

yarn workspace database install
yarn workspace database start
yarn workspace database types-gen
yarn workspace database types-copy
# ##########################



# ##########################
# ### Deps install ###
#
# Install the dependencies in the packages

yarn install

# Start with shared since its a dependency of the other packages
yarn workspace @stealth-town/shared install
yarn workspace @stealth-town/shared config:dev
yarn workspace @stealth-town/shared build

yarn workspace server install
# yarn workspace server build

yarn workspace app install
# yarn workspace app build

# No need to provide parent dir
yarn workspace trade-engine install
# yarn workspace trade-engine build

# ##########################








