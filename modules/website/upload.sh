#!/bin/bash
set -e
cd beaconApp
echo -e "{\n \"apiBaseUrl\": \"${2}\",\n \"login\": ${3}\n}" > src/assets/config.json
mkdir -p src/environments
# dev
echo -e "export const environment = {\n production: false, \n cloudfront_url: \"${4}\",\n okta: {\n  url: \"https://${6}\",\n  clientId: \"${7}\"\n }\n};" > src/environments/environment.ts
# prod
echo -e "export const environment = {\n production: true, \n cloudfront_url: \"${4}\",\n okta: {\n  url: \"https://${6}\",\n  clientId: \"${7}\"\n }\n};" > src/environments/environment.prod.ts
# pnpm install
pnpm install
node_modules/.bin/ng build --configuration production --subresource-integrity
# upload
cd dist/beaconApp/browser
aws s3 sync --region "${5}" . "s3://${1}" --delete
