const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

async function main() {
    try {
        await client.connect();
        console.log("Connected to MongoDB ✅");

        // Create or use a database
        const db = client.db("myDatabase");

        // Create or use a collection
        const users = db.collection("users");

        console.log("Database and Collection ready ✅");
    } catch (err) {
        console.error(err);
    } finally {
        // Don't close yet if you want to perform operations
        // await client.close();
    }
}

main();
