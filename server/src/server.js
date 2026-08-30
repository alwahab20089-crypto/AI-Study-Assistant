import "dotenv/config";

import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import app from "./app.js";
import connectDB from "./config/db.js";
import { preloadEmbeddingModel } from "./services/embeddingService.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await preloadEmbeddingModel();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();