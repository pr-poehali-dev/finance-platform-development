CREATE TABLE IF NOT EXISTS operations (
    id BIGSERIAL PRIMARY KEY,
    op_date DATE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    op_type TEXT NOT NULL CHECK (op_type IN ('income','expense')),
    amount NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operations_date ON operations(op_date);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('start_balance', '500000')
ON CONFLICT (key) DO NOTHING;
