#!/bin/sh

pwd=$(dirname $(realpath "$0"))

folder="$pwd/../data"
mkdir -p "$folder"

/usr/bin/sqlite3 "$folder/db" < "$pwd/schema.sql"
echo "Database generated in $folder"
