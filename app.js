const express = require("express");
const app = express();
const path = require("path");
const sql = require("mssql");
const tasks = require("./routes/tasks");
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  options: {
    encrypt: false,
    useUTC: true,
  },
};

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("Task Manager App");
});

app.use("/api/v1/tasks", tasks);

sql
  .connect(config)
  .then(() => {
    console.log("Connected to MSSQL database");

    app.post("/api/v1/insertData", async (req, res) => {
      try {
        const { book, author } = req.body;

        if (!book || !author) {
          return res
            .status(400)
            .json({
              error:
                "Both 'book' and 'author' are required in the request body.",
            });
        }

        const pool = await sql.connect(config);

        const result = await pool
          .request()
          .input("book", sql.VarChar(50), book)
          .input("author", sql.VarChar(50), author)
          .query(
            "INSERT INTO TestDB.dbo.TestTable (book, author) VALUES (@book, @author)"
          );

        res.status(201).json({ message: "Data inserted successfully." });
      } catch (error) {
        console.error("Error inserting data into the database:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/api/v1/getData", async (req, res) => {
      try {
        const pool = await sql.connect(config);
        const result = await pool
          .request()
          .query("SELECT * FROM TestDB.dbo.TestTable");

        const data = result.recordset;

        res.json(data);
      } catch (error) {
        console.error("Error querying database:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    const port = 3000;
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MSSQL database:", err);
  });

sql.on("error", (err) => {
  console.error("MSSQL error:", err);
});
