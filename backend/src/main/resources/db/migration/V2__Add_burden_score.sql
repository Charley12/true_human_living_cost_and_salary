ALTER TABLE burdens ADD COLUMN calculated_score DECIMAL(10, 2);
ALTER TABLE daily_stats ADD COLUMN average_burden_score DECIMAL(10, 2) DEFAULT 0;
