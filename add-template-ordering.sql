-- Add ordering fields to Template table
ALTER TABLE "Template" ADD COLUMN "order" INTEGER DEFAULT 0;
ALTER TABLE "Template" ADD COLUMN "isActive" BOOLEAN DEFAULT true;

-- Create index for ordering
CREATE INDEX "Template_order_idx" ON "Template"("order");

-- Set initial order values for existing templates
UPDATE "Template" SET "order" = 1 WHERE name = 'Basic Template';
UPDATE "Template" SET "order" = 2 WHERE name = 'Resumonk Bold';
UPDATE "Template" SET "order" = 3 WHERE name = 'Modern Creative';
UPDATE "Template" SET "order" = 4 WHERE name = 'Executive Premium';

-- Set all existing templates as active
UPDATE "Template" SET "isActive" = true;
