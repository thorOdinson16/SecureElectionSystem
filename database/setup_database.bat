@echo off
echo ============================================
echo   Database Setup Script
echo ============================================
echo.
set /p DB_USER="Enter MySQL username (default: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASS="Enter MySQL password: "

echo.
echo Creating database and importing schema...
mysql -u %DB_USER% -p"%DB_PASS%" < schema.sql
mysql -u %DB_USER% -p"%DB_PASS%" SecureElectionDB < triggers.sql
mysql -u %DB_USER% -p"%DB_PASS%" SecureElectionDB < procedures.sql
mysql -u %DB_USER% -p"%DB_PASS%" SecureElectionDB < functions.sql
mysql -u %DB_USER% -p"%DB_PASS%" SecureElectionDB < sample_data.sql

if errorlevel 1 (
    echo [ERROR] Database setup failed!
    pause
    exit /b 1
)

echo [✓] Database setup complete!
echo.
pause