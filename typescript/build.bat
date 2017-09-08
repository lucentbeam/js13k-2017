call python process-images.py
call tsc
call .\uglify.bat
CScript  zip.vbs  ..\build\  ..\build.zip