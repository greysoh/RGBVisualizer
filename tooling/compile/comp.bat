@echo off
cd ..\..
deno run --allow-read --allow-write tooling\engine2lvly\index.js project.json Y
del Oscilloscope.zip 
del out.zip
powershell Compress-Archive * ..\out.zip
move ..\out.zip out.zip