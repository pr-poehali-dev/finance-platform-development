CREATE TABLE IF NOT EXISTS pnl_monthly (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    row_key TEXT NOT NULL,
    row_label TEXT NOT NULL,
    section TEXT NOT NULL,
    plan_amount NUMERIC(14,2),
    fact_amount NUMERIC(14,2),
    UNIQUE(year, month, row_key)
);

CREATE TABLE IF NOT EXISTS marketing_sources_monthly (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    source_name TEXT NOT NULL,
    plan_amount NUMERIC(14,2),
    fact_amount NUMERIC(14,2)
);

CREATE TABLE IF NOT EXISTS traffic_monthly (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    month INT,
    metric_key TEXT NOT NULL,
    metric_label TEXT NOT NULL,
    unit TEXT NOT NULL,
    plan_value NUMERIC(14,2),
    fact_value NUMERIC(14,2)
);
