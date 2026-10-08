#!/usr/bin/env bash
# 自检计时 / 判分 / 自适应循环引擎。
# 做法：把 app/src 的引擎源码复制到工作区内的临时目录，把无扩展名的相对导入改成显式 .ts，
#       再用 Node 的类型剥离（--experimental-strip-types）直接运行测试。
set -euo pipefail
cd "$(dirname "$0")/.."

WORK=.build/engine-test
rm -rf "$WORK"
mkdir -p "$WORK"
cp app/src/types.ts app/src/lib/answers.ts app/src/lib/grading.ts \
   app/src/lib/timing.ts app/src/lib/adaptive.ts "$WORK/"
cp tools/engine_test.ts "$WORK/test.ts"

# Node ESM 需要显式扩展名
sed -i '' -E "s|from '\.\./types'|from './types.ts'|g; s|from '\./answers'|from './answers.ts'|g; s|from '\./grading'|from './grading.ts'|g" \
  "$WORK"/*.ts

node --experimental-strip-types "$WORK/test.ts"
