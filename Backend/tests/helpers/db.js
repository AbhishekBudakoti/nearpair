const mongoose = require("mongoose");

// Tests run against a dedicated local database (find_a_partner_test), never
// against the dev database, so it's always safe to wipe between tests.
const connect = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URL);
    }
};

const clearDatabase = async () => {
    const { collections } = mongoose.connection;
    await Promise.all(
        Object.values(collections).map((collection) => collection.deleteMany({}))
    );
};

const closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
};

module.exports = { connect, clearDatabase, closeDatabase };
