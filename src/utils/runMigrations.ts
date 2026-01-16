import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const runMigrations = async (): Promise<void> => {
  try {
    console.log("Running database migrations...");
    
    // Use sequelize-cli to run migrations
    const { stdout, stderr } = await execAsync("npx sequelize-cli db:migrate");
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr && !stderr.includes("warning")) {
      console.error(stderr);
    }
    
    console.log("Migrations completed successfully");
  } catch (error: any) {
    // If migrations are already up to date, that's fine
    if (error.stdout && error.stdout.includes("No migrations were executed")) {
      console.log("Database is already up to date");
      return;
    }
    console.error("Migration error:", error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
};

