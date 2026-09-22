import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      console.log("====================================");
      console.log("R&J AC BACKEND");
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Health: http://localhost:${PORT}/api/v1/health`
      );
      console.log("====================================");
    });

    server.on("error", (error) => {
      console.error("Server error:", error);
    });
  } catch (error) {
    console.error(
      "Failed to start R&J AC server:",
      error
    );

    process.exit(1);
  }
};

startServer();