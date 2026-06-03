@echo off
cd /d "%~dp0"
echo [relay] building...
call npm run build
if errorlevel 1 (
  echo.
  echo [relay] 编译失败，未启动。请根据上方 TS 错误修复后重试。
  pause
  exit /b 1
)
echo [relay] starting on port 3456 (protocol v2, room 1001/2002)...
echo [relay] 验证: 浏览器打开 http://本机IP:3456/relay-info 应看到 JSON，而不是 Upgrade Required
node dist/index.js
pause
