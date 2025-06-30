#!/bin/bash
cd /home/kavia/workspace/code-generation/noteease-95477-d7db1b04/notetaker_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

