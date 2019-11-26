const dotenv = require("dotenv");
const Bigtable = require("@google-cloud/bigtable");

dotenv.config();

const {
  COLUMN_FAMILY_ID,
  COLUMN_QUALIFIER,
  INSTANCE_ID,
  TABLE_ID
} = process.env;

console.log(process.env);

if (!INSTANCE_ID) {
  throw new Error("Environment variables for INSTANCE_ID must be set!");
}

const bigtableClient = new Bigtable();

(async () => {
  const getRowGreeting = row => {
    return row.data[COLUMN_FAMILY_ID][COLUMN_QUALIFIER][0].value;
  };

  try {
    const instance = bigtableClient.instance(INSTANCE_ID);

    const table = instance.table(TABLE_ID);
    const [tableExists] = await table.exists();
    if (!tableExists) {
      console.log(`Creating table ${TABLE_ID}`);
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
    }

    console.log("Write some greetings to the table");
    const rowsToInsert = [
      {
        key: `greeting0`,
        data: {
          [COLUMN_FAMILY_ID]: {
            [COLUMN_QUALIFIER]: {
              timestamp: new Date(),
              value: "Hello World:" + Date.now().toString()
            }
          }
        }
      }
    ];
    await table.insert(rowsToInsert);

    console.log("Reading a single row by row key");
    const [singleRow] = await table.row("greeting0").get({
      filter: {
        column: {
          cellLimit: 1 // Only retrieve the most recent version of the cell.
        }
      }
    });
    console.log(`\tRead: ${getRowGreeting(singleRow)}`);

    // console.log("Reading the entire table");
    // const [allRows] = await table.getRows({ filter });
    // for (const row of allRows) {
    //   console.log(`\tRead: ${getRowGreeting(row)}`);
    // }

    // console.log("Delete the table");
    // await table.delete();
  } catch (error) {
    console.error("Something went wrong:", error);
  }
})();
