#!/bin/zsh

VERSION=$(jq -r .version manifest.json)

zip -r "jxck-reader-mode-${VERSION}.zip" . \
  -x '.git/*' \
  -x 'node_modules/*' \
  -x 'README.md' \
  -x '.gitignore' \
  -x '.hintrc' \
  -x 'package.json' \
  -x 'package-lock.json' \
  -x '*.zip' \
  -x 'zip.sh'
