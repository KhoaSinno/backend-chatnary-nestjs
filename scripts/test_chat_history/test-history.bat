@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul

echo ═══════════════════════════════════════════════════════════════════════════
echo           CHAT HISTORY TEST - Windows Batch Script
echo           %date% %time%
echo ═══════════════════════════════════════════════════════════════════════════

set TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NzdhMzY4ZS1hYmZlLTRhMzgtYWRiZS00NjI1Y2NlOGQ1MDAiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjcwNjU3NjUsImV4cCI6MTc2NzA3NDc2NX0.fWHNiQp-A4Ducrq9dNCqH9s03RWPR_vYza7UdZOHGDU
set BASE_URL=http://localhost:8080/api/v1/chat/global
set CHATID=

:: Output files
set LOG_FILE=test-history-results.txt
set JSON_FILE=test-history-output.json

echo. > %LOG_FILE%
echo [ > %JSON_FILE%

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo TEST 1/5: Hoi ve entropy va IG
echo ─────────────────────────────────────────────────────────────────────────────

curl -s -X POST "%BASE_URL%" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"message\": \"entropy la gi, trinh bay chi tiet cho toi\"}" ^
  -o response1.json

:: Extract chatId using PowerShell
for /f "delims=" %%i in ('powershell -Command "(Get-Content response1.json | ConvertFrom-Json).data.chatId"') do set CHATID=%%i
echo ChatId: %CHATID%

:: Display answer
echo.
echo ANSWER:
powershell -Command "(Get-Content response1.json | ConvertFrom-Json).data.answer"
echo.

:: Append to log
type response1.json >> %LOG_FILE%
echo , >> %JSON_FILE%
type response1.json >> %JSON_FILE%

timeout /t 3 /nobreak > nul

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo TEST 2/5: Hoi vi du ve entropy (history test)
echo ─────────────────────────────────────────────────────────────────────────────

curl -s -X POST "%BASE_URL%?chatId=%CHATID%" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"message\": \"cho toi vi du cu the ve cach tinh entropy nay\"}" ^
  -o response2.json

echo.
echo ANSWER (should remember context about entropy):
powershell -Command "(Get-Content response2.json | ConvertFrom-Json).data.answer"
echo.

type response2.json >> %LOG_FILE%
echo , >> %JSON_FILE%
type response2.json >> %JSON_FILE%

timeout /t 3 /nobreak > nul

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo TEST 3/5: Hoi ve gradient descent (new topic but same chat)
echo ─────────────────────────────────────────────────────────────────────────────

curl -s -X POST "%BASE_URL%?chatId=%CHATID%" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"message\": \"gradient descent la gi, no khac voi entropy o tren nhu the nao\"}" ^
  -o response3.json

echo.
echo ANSWER (should know about entropy from history):
powershell -Command "(Get-Content response3.json | ConvertFrom-Json).data.answer"
echo.

type response3.json >> %LOG_FILE%
echo , >> %JSON_FILE%
type response3.json >> %JSON_FILE%

timeout /t 3 /nobreak > nul

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo TEST 4/5: Hoi ve Transformer architecture
echo ─────────────────────────────────────────────────────────────────────────────

curl -s -X POST "%BASE_URL%?chatId=%CHATID%" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"message\": \"Transformer architecture la gi, attention mechanism hoat dong ra sao\"}" ^
  -o response4.json

echo.
echo ANSWER:
powershell -Command "(Get-Content response4.json | ConvertFrom-Json).data.answer"
echo.

type response4.json >> %LOG_FILE%
echo , >> %JSON_FILE%
type response4.json >> %JSON_FILE%

timeout /t 3 /nobreak > nul

echo.
echo ─────────────────────────────────────────────────────────────────────────────
echo TEST 5/5: Tom tat tat ca (history summary test)
echo ─────────────────────────────────────────────────────────────────────────────

curl -s -X POST "%BASE_URL%?chatId=%CHATID%" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"message\": \"tom tat lai tat ca nhung gi da hoi o tren\"}" ^
  -o response5.json

echo.
echo ANSWER (should summarize all previous topics):
powershell -Command "(Get-Content response5.json | ConvertFrom-Json).data.answer"
echo.

type response5.json >> %LOG_FILE%
echo ] >> %JSON_FILE%
type response5.json >> %JSON_FILE%

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo TEST COMPLETE
echo ═══════════════════════════════════════════════════════════════════════════
echo ChatId used: %CHATID%
echo Results saved to: %LOG_FILE%
echo.

:: Cleanup temp files
del response1.json response2.json response3.json response4.json response5.json 2>nul

pause
