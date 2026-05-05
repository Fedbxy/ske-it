import express from "express";
const app = express();
const port = 3000;

app.use(express.static("public"));

app.set("view engine", "ejs");

import routes from "./routes/index.js";
app.use("/", routes);

import { getBookList } from "./controllers/bookController.js";
app.get("/books", getBookList);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
