@echo off
echo 正在为所有云函数安装 wx-server-sdk ...
cd /d "%~dp0api"
call npm install --production
cd /d "%~dp0admin"
call npm install --production
cd /d "%~dp0init-db"
call npm install --production
cd /d "%~dp0cron-news"
call npm install --production
echo.
echo 完成！请在微信开发者工具中：
echo 右键 api -^> 上传并部署：所有文件
echo 右键 admin -^> 上传并部署：所有文件
echo 右键 init-db -^> 上传并部署：所有文件
pause
