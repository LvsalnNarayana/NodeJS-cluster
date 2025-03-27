import cluster from "cluster";
import os from "os";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const numCPUs = os.cpus().length;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running.`);

  // Fork workers equal to the number of CPU cores.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for dying workers and fork a new one if needed.
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Spawning a new worker.`);
    cluster.fork();
  });
} else {
  // Worker processes run the Express server.
  const app = express();
  const port = 3000;

  // Set up EJS as the view engine.
  app.set("view engine", "ejs");
  app.set("views", join(__dirname, "views"));

  // Define the root route to render the index view.
  app.get("/", (req, res) => {
    // Pass the worker's process ID to the view.
    res.render("index", { workerId: process.pid });
  });

  app.listen(port, () => {
    console.log(
      `Worker ${process.pid} started, server running at http://localhost:${port}`
    );
  });
}
