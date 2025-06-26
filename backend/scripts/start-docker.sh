#!/bin/bash

echo "Starting Docker Compose..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 3

echo "Running populate-gcs script..."
node scripts/population/populate-gcs.js

echo "All tasks completed."
