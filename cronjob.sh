set -e
set -x

git reset --hard origin/master
git pull origin master

if [ -e ./playwright ]; then
  cd playwright
  git pull origin master
  npm i
  cd ..
else
  git clone --depth 1 git@github.com:microsoft/playwright.git
  cd playwright
  npm i
  cd ..
fi

node generateStatus.js > ./status.json

if [ -z "$(git status --untracked-files=no --porcelain)" ]; then
  echo 'NO CHANGES'
  exit 0;
fi

git commit -am 'chore: update status.json'
git push origin master

echo 'PUSHED NEW STATUS!'

