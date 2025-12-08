const path = require("path");

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.resolve(__dirname, "database.db"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, "migrations"),
    },
    seeds: {
      directory: path.resolve(__dirname, "seeds"),
    },
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: path.resolve(__dirname, "database.db"), // Use a more robust solution for production
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, "migrations"),
    },
  },
};