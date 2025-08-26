-- Schema for the Automation Rules feature

CREATE TABLE "automation_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "regex" TEXT NOT NULL,
  "linkTemplate" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "automation_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create an index for faster lookups of rules by user
CREATE INDEX "automation_rules_userId_idx" ON "automation_rules"("userId");
