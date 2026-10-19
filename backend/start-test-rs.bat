@echo off
echo Starting MongoDB on port 27018 as replica set rs0...
start /b "" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --replSet rs0 --port 27018 --dbpath test-rs-data > test-rs.log 2>&1
echo MongoDB started in background. Check test-rs.log for details.
