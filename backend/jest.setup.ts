
process.env.PASSOWRD_HASH = "secret";
process.env.SALT_ROUNDS = "10";

// Database configuration for tests
process.env.DB_TYPE = "sqlite";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USERNAME = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_DATABASE = ":memory:"; // Use in-memory SQLite for tests

// JWT configuration for tests
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1h";

// App configuration for tests
process.env.APP_PORT = "3000";
process.env.NODE_ENV = "test";

process.env.PASSOWRD_HASH = 'secret';
process.env.SALT_ROUNDS = '10';
process.env.DISABLE_AUTH = 'true';

