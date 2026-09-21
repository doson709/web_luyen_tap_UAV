@echo off
chcp 65001 > nul
title HE THONG LUYEN TAP VA CHUA DE UAV - TRINH CHIEU ZOOM
echo ====================================================================
echo        HE THONG LUYEN TAP VA CHUA DE THI UAV (CHUYEN ZOOM)
echo                    Phuc vu Giang Day va Sat Hach
echo ====================================================================
echo.
echo [1/2] Dang kiem tra va khoi dong may chu backend...
start http://localhost:5000
echo.
echo [2/2] Dang chay he thong tai dia chi: http://localhost:5000
echo Nhan Ctrl+C neu muon dung chuong trinh.
echo ====================================================================
node server/src/server.js
pause
