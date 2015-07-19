@%~d0
@cd %~dp0
@call "D:\Program Files\Microsoft.NET\SDK\v2.0\Bin\sdkvars.bat"
@PATH=C:\Windows\Microsoft.NET\Framework\v3.5;%PATH%
nmake register
pause
REM @"C:\Windows\System32\cmd.exe" /k