const { Pool } = require('pg');

// Configuration for the PostgreSQL database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
});

const TABLES = {
    userTypes: `
        CREATE TABLE IF NOT EXISTS userTypes (
            userTypeId SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL
        );
    `,
};

const INITIAL_DATA = {
    userTypes: [
        ['resident'],
        ['representative'],
        ['administration'],
        ['lawyer'],
        ['appraiser'],
        ['inspector'],
        ['entrepreneur'],
    ],
};

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Create tables
        for (const [tableName, createQuery] of Object.entries(TABLES)) {
            await client.query(createQuery);
            console.log(`Table "${tableName}" ensured.`);
        }

        // Insert initial data
        for (const [tableName, rows] of Object.entries(INITIAL_DATA)) {
            for (const row of rows) {
                const placeholders = row.map((_, idx) => `$${idx + 1}`).join(', ');
                const insertQuery = `INSERT INTO ${tableName} (name) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
                await client.query(insertQuery, row);
            }
            console.log(`Data inserted into "${tableName}".`);
        }

        console.log("Database initialization complete.");
    } catch (err) {
        console.error("Error initializing database:", err.message);
    } finally {
        client.release();
        pool.end();
    }
}

initializeDatabase();
