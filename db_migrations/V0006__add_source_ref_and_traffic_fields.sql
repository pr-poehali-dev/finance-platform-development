ALTER TABLE operations ADD COLUMN IF NOT EXISTS source_ref TEXT UNIQUE;

INSERT INTO traffic_monthly (year, month, metric_key, metric_label, unit, plan_value, fact_value) VALUES
(2026,1,'contracts_bfl','Договоров БФЛ','count',NULL,1),
(2026,2,'contracts_bfl','Договоров БФЛ','count',NULL,4),
(2026,3,'contracts_bfl','Договоров БФЛ','count',NULL,1),
(2026,4,'contracts_bfl','Договоров БФЛ','count',NULL,2),
(2026,5,'contracts_bfl','Договоров БФЛ','count',5,3),
(2026,6,'contracts_bfl','Договоров БФЛ','count',0,15),
(2026,7,'contracts_bfl','Договоров БФЛ','count',0,0),

(2026,1,'contracts_vbfl','Договоров ВБФЛ','count',NULL,0),
(2026,2,'contracts_vbfl','Договоров ВБФЛ','count',NULL,0),
(2026,3,'contracts_vbfl','Договоров ВБФЛ','count',NULL,0),
(2026,4,'contracts_vbfl','Договоров ВБФЛ','count',NULL,0),
(2026,5,'contracts_vbfl','Договоров ВБФЛ','count',5,1),
(2026,6,'contracts_vbfl','Договоров ВБФЛ','count',0,1),
(2026,7,'contracts_vbfl','Договоров ВБФЛ','count',0,0),

(2026,1,'contracts_rd','Договоров РД','count',NULL,0),
(2026,2,'contracts_rd','Договоров РД','count',NULL,0),
(2026,3,'contracts_rd','Договоров РД','count',NULL,0),
(2026,4,'contracts_rd','Договоров РД','count',NULL,0),
(2026,5,'contracts_rd','Договоров РД','count',5,1),
(2026,6,'contracts_rd','Договоров РД','count',0,1),
(2026,7,'contracts_rd','Договоров РД','count',0,0),

(2026,1,'missed_call_pct','Недозвон','percent',NULL,0),
(2026,2,'missed_call_pct','Недозвон','percent',NULL,0),
(2026,3,'missed_call_pct','Недозвон','percent',NULL,0),
(2026,4,'missed_call_pct','Недозвон','percent',NULL,0),
(2026,5,'missed_call_pct','Недозвон','percent',NULL,0),
(2026,6,'missed_call_pct','Недозвон','percent',NULL,0),
(2026,7,'missed_call_pct','Недозвон','percent',NULL,0),

(2026,1,'low_quality_pct','Некачественные лиды','percent',NULL,0),
(2026,2,'low_quality_pct','Некачественные лиды','percent',NULL,0),
(2026,3,'low_quality_pct','Некачественные лиды','percent',NULL,0),
(2026,4,'low_quality_pct','Некачественные лиды','percent',NULL,0),
(2026,5,'low_quality_pct','Некачественные лиды','percent',NULL,0),
(2026,6,'low_quality_pct','Некачественные лиды','percent',NULL,0),
(2026,7,'low_quality_pct','Некачественные лиды','percent',NULL,0)
ON CONFLICT DO NOTHING;
