set -e
set -x

git reset --hard origin/master
git pull origin master

if [ -e ./playwright ]; then
  cd playwright
  git reset --hard
  git pull origin master
else
  git clone --depth 1 git@github.com:microsoft/playwright.git
  cd playwright
fi

npm ci
npm run build
PWRUNNER_JSON_REPORT=../status.json PWTESTREPORT=1 npm run test -- --trial-run --reporter=json
cd ..
node postProcess.js > tests.html

if [ -z "$(git status --untracked-files=no --porcelain)" ]; then
  echo 'NO CHANGES'
  exit 0;
fi

git commit -am 'chore: update status.json'
git push origin master

echo 'PUSHED NEW STATUS!'
