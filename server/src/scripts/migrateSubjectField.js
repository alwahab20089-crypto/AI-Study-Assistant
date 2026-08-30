// Run once: node src/scripts/migrateSubjectField.js
// Converts the old free-text `subject` string field to null so it's safe
// to read as an ObjectId reference under the new Subject model.
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await mongoose.connection.collection("documents").updateMany(
    { subject: { $type: "string" } },
    { $set: { subject: null } }
  );

  console.log(`Migrated ${result.modifiedCount} document(s) to subject: null`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});