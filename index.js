const dotenv = require("dotenv");
const express = require("express");
const Bigtable = require("@google-cloud/bigtable");

dotenv.config();
const {
  COLUMN_FAMILY_ID,
  COLUMN_QUALIFIER,
  INSTANCE_ID,
  TABLE_ID
} = process.env;

const app = express();

if (!INSTANCE_ID) {
  throw new Error("Environment variables for INSTANCE_ID must be set!");
}

const bigtableClient = new Bigtable();
const instance = bigtableClient.instance(INSTANCE_ID);
const table = instance.table(TABLE_ID);

function getRowGreeting(row) {
  return row.data[COLUMN_FAMILY_ID][COLUMN_QUALIFIER][0].value;
}

async function runBigTable() {
  try {
    const [tableExists] = await table.exists();
    if (!tableExists) {
      throw new Error(`${TABLE_ID} does not exists`);
    }
    console.log("Write some greetings to the table");
    const rowsToInsert = [
      {
        key: `greeting0`,
        data: {
          [COLUMN_FAMILY_ID]: {
            [COLUMN_QUALIFIER]: {
              timestamp: new Date(),
              value: "Hello World:" + Date.now()
            }
          }
        }
      }
    ];
    await table.insert(rowsToInsert);

    const filter = [
      {
        column: {
          cellLimit: 1 // Only retrieve the most recent version of the cell.
        }
      }
    ];

    console.log("Reading a single row by row key");
    const [singleRow] = await table.row("greeting0").get({ filter });
    console.log(`${getRowGreeting(singleRow)}`);

    return JSON.stringify(singleRow);
  } catch (error) {
    console.error("Something went wrong:", error);
  }
}

app.get("/", (_req, res) => {
  console.log("Hello world received a request.");
  const target = process.env.TARGET || "World";
  res.send(`Hello ${target} with cloudbuild`);
});

app.get("/bt", async (_req, res) => {
  try {
    const ret = await runBigTable();
    res.json(ret);
  } catch (e) {
    res.status(404).send(e.message);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Hello world listening on port", port);
});
