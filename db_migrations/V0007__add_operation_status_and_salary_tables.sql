ALTER TABLE operations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'actual' CHECK (status IN ('planned','actual'));

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    department_id INT NOT NULL REFERENCES departments(id),
    name TEXT NOT NULL,
    position TEXT NOT NULL DEFAULT '',
    base_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
    bonus_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
    bonus_metric_key TEXT NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO departments (name) VALUES
('Руководство'), ('Отдел продаж'), ('Отдел сопровождения'), ('Маркетинг'), ('Бухгалтерия')
ON CONFLICT (name) DO NOTHING;
