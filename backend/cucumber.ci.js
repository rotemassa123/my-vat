const worldParameters = {
  PORT: '3000',
  PG_HOST: 'postgres',
  PG_USER: 'postgres',
  PG_PASSWORD: 'postgres',
  PG_DATABASE: 'postgres',
  PG_PORT: 5432
};

module.exports = {
  default: [
    'test/integration/features',
    '--require-module ts-node/register',
    '--require test/integration/stepDefinitions/*.ts',
    `--tags 'not @ignore'`,
    `--world-parameters '${JSON.stringify(worldParameters)}'`,
    `--force-exit`
  ].join(' ')
};
