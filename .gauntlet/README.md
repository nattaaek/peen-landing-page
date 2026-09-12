# Web parity quality checks

The web app uses Node's built-in TypeScript test runner; no test package was added.
Run `npm ci --prefix web-app`, then `npm test --prefix web-app` and `npm run build --prefix web-app`.
CI runs the tests before the production build on Node22.

The acceptance contract is in `features/web-parity-acceptance.feature` with its manual QA procedure.
Local Uncle Bob role handoffs and generated quality evidence are ignored. The current run adapted the standard skill scripts for the nested web-app package and Node test runner; no product behavior is encoded in those scripts.
Full hosted acceptance needs an authenticated Peen account and is separate from unit/build success.
