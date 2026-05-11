#!/bin/bash

mkdir -p audits

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT="audits/full-audit-$TIMESTAMP.txt"

{
echo "==================================="
echo "EASYTUTOR FULL SYSTEM AUDIT"
echo "Generated: $(date)"
echo "==================================="

echo -e "\n\n## GIT STATUS ##\n"
git status

echo -e "\n\n## TYPESCRIPT CHECK ##\n"
npx tsc --noEmit

echo -e "\n\n## ESLINT ##\n"
npx eslint .

echo -e "\n\n## TESTS ##\n"
npm test

echo -e "\n\n## CIRCULAR DEPENDENCIES ##\n"
npx madge --circular --extensions ts,tsx .

echo -e "\n\n## DEPENDENCY GRAPH ##\n"
npx madge --json --extensions ts,tsx .

echo -e "\n\n## EXPO DIAGNOSTICS ##\n"
npx expo-doctor

echo -e "\n\n## OUTDATED PACKAGES ##\n"
npm outdated

echo -e "\n\n## SECURITY AUDIT ##\n"
npm audit

echo -e "\n\n==================================="
echo "AUDIT COMPLETE"
echo "==================================="

} > "$OUTPUT" 2>&1

echo "Audit saved to: $OUTPUT"
