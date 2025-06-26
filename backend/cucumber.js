const worldParameters = {
  PORT: '3000',
  PG_HOST: 'localhost',
  PG_USER: 'postgres',
  PG_PASSWORD: 'postgres',
  PG_DATABASE: 'postgres',
  PG_PORT: 5432
};

module.exports = {
  default: [
    'tests/integration/features',
    '--require-module ts-node/register',
    '--require tests/integration/stepDefinitions/*.ts',
    `--tags 'not @ignore'`,
    `--world-parameters '${JSON.stringify(worldParameters)}'`,
    `--force-exit`
  ].join(' ')
};
