ALTER TABLE traffic_monthly ADD CONSTRAINT traffic_monthly_year_month_key_unique UNIQUE (year, month, metric_key);
