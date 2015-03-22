@SET PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\;%PATH%

@REM output directory
@SET BUILD=build

@REM change exe to winexe to hide the console window
@SET TARGET=exe

@mkdir %BUILD%

csc.exe /target:%TARGET% /out:%BUILD%\main.exe lib\DxDLL.cs main.cs canvas.cs game.cs utils.cs && ^
copy /Y lib\*.dll %BUILD%\ && ^
%BUILD%\main.exe
