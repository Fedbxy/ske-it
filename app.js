import express from "express";
import dotenv from "dotenv";
import { connectToDatabase } from "./config/db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

import routes from "./routes/index.js";
import apiRoutes from "./routes/api.js";
import gameRoutes from "./routes/gameRoutes.js";
app.use("/", routes);
app.use("/api", apiRoutes);
app.use("/api/games", gameRoutes);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Ske-It server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });
