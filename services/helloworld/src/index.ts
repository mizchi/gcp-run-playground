import dotenv from "dotenv";
import express from "express";
import path from "path";
import { Bigtable } from "@google-cloud/bigtable";
import { Instance as BigtableInstance } from "@google-cloud/bigtable/build/src/instance";

dotenv.config({
  path: path.join(__dirname, "../.env")
});
const {
  COLUMN_FAMILY_ID,
  COLUMN_QUALIFIER,
  INSTANCE_ID,
  TABLE_ID
} = process.env as any;

let _instance: BigtableInstance | null = null;
function getBigTableInstance(): BigtableInstance {
  if (_instance) {
    return _instance;
  }
  const bigtableClient = new Bigtable();
  const instance = bigtableClient.instance(INSTANCE_ID);
  _instance = instance;
  return instance;
}

const app = express();

if (!INSTANCE_ID) {
  throw new Error("Environment variables for INSTANCE_ID must be set!");
}

function getRowGreeting(row: any) {
  return row.data[COLUMN_FAMILY_ID][COLUMN_QUALIFIER][0].value;
}

async function runBigTable() {
  const instance = getBigTableInstance();
  const table = instance.table(TABLE_ID);

  try {
    // @ts-ignore
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
    // @ts-ignore
    await table.insert(rowsToInsert);

    const filter = [
      {
        column: {
          cellLimit: 1 // Only retrieve the most recent version of the cell.
        }
      }
    ];

    console.log("Reading a single row by row key");
    // @ts-ignore
    const [singleRow] = await table.row("greeting0").get({ filter });
    console.log(`${getRowGreeting(singleRow)}`);

    return JSON.stringify(singleRow);
  } catch (error) {
    console.error("Something went wrong:", error);
  }
}

app.get("/", (_req: any, res: any) => {
  console.log("Hello world received a request.");
  res.send(`Hello, xxx`);
});

app.get("/bt", async (_req: any, res: any) => {
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
