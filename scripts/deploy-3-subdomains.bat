@echo off
echo =======================================================
echo Deploying 3 Interconnected Subdomains to Vercel
echo =======================================================

echo.
echo 1. Deploying Captive Portal (captive-portal-app.vercel.app)...
cmd /c copy /y vercel.portal.json vercel.json
cmd /c npx vercel --prod --name captive-portal-app --yes

echo.
echo 2. Deploying POS Management Dashboard (pos-dashboard-app.vercel.app)...
cmd /c copy /y vercel.pos.json vercel.json
cmd /c npx vercel --prod --name pos-dashboard-app --yes

echo.
echo 3. Deploying Kitchen Display System (kds-dashboard-app.vercel.app)...
cmd /c copy /y vercel.kds.json vercel.json
cmd /c npx vercel --prod --name kds-dashboard-app --yes

echo.
echo =======================================================
echo All 3 Dedicated Subdomains Deployed Successfully!
echo =======================================================
