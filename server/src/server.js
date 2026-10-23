import dotenv from "dotenv";

// Load local defaults before evaluating application modules. Deployment-provided
// environment variables retain precedence over values in server/.env.
dotenv.config({
  path: new URL("../.env", import.meta.url),
  override: false,
  quiet: true,
});

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    const { default: app } = await import("./app.js");
    const { connectDatabase } = await import("./config/db.js");
    await connectDatabase();
    const { default: ReservationAttempt } = await import(
      "./models/ReservationAttempt.js"
    );
    const { default: MediaCleanupJob } = await import(
      "./models/MediaCleanupJob.js"
    );
    // Unique indexes must exist before accepting concurrent idempotent requests.
    const operationModels = await Promise.all(
      [
        "ServiceBooking",
        "ActivityLog",
        "NotificationJob",
        "NotificationAttempt",
        "NotificationWebhookEvent",
        "NotificationWorkerState",
        "Staff",
      ].map((name) => import(`./models/${name}.js`)),
    );
    await Promise.all([
      ReservationAttempt.init(),
      MediaCleanupJob.init(),
      ...operationModels.map(({ default: Model }) => Model.init()),
    ]);
    const { startRecoveryWorker } = await import(
      "./services/recoveryWorker.js"
    );
    const stopRecovery = startRecoveryWorker();

    const server = app.listen(PORT, () => {
      console.log("====================================");
      console.log("R&J AC BACKEND");
      console.log(`Server running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/v1/health`);
      console.log("====================================");
    });

    let closing = false;
    const shutdown = async () => {
      if (closing) return;
      closing = true;
      const deadline = setTimeout(() => process.exit(1), 120000);
      deadline.unref();
      await Promise.all([
        new Promise((resolve) => server.close(resolve)),
        stopRecovery(),
      ]);
      const { default: mongoose } = await import("mongoose");
      await mongoose.disconnect();
      clearTimeout(deadline);
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
    server.on("error", (error) => {
      console.error("Server error:", error);
    });
  } catch (error) {
    console.error("Failed to start R&J AC server:", error);

    process.exit(1);
  }
};

startServer();
