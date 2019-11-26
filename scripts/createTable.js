#!/usr/bin/env node
const dotenv = require("dotenv");
const Bigtable = require("@google-cloud/bigtable");

dotenv.config();

const { COLUMN_FAMILY_ID, INSTANCE_ID, TABLE_ID } = process.env;

if (!INSTANCE_ID) {
  throw new Error("Environment variables for INSTANCE_ID must be set!");
}

const bigtableClient = new Bigtable();

(async () => {
  try {
    const instance = bigtableClient.instance(INSTANCE_ID);
    const table = instance.table(TABLE_ID);
    const [tableExists] = await table.exists();
    if (!tableExists) {
      const options = {
        families: [
          {
            name: COLUMN_FAMILY_ID,
            rule: {
              versions: 1
            }
          }
        ]
      };
      await table.create(options);
      console.log("Table created");
    } else {
      console.log("Table already exists");
    }
  } catch (error) {
    console.error("Something went wrong:", error);
  }
})();
