INSERT INTO marketing_sources_monthly (year, month, source_name, plan_amount, fact_amount) VALUES
(2026,4,'Родион РФ',90000,90000),
(2026,5,'Родион РФ',80000,80000),
(2026,6,'Родион РФ',197400,197400),
(2026,7,'Родион РФ',250000,42450),
(2026,5,'Алион',190000,190000),
(2026,6,'Алион',0,0),
(2026,6,'Артур Вк',115000,75000),
(2026,5,'Николай ОП',50000,50000),
(2026,6,'Николай ОП',110000,110000),
(2026,7,'Николай ОП',20000,0);

INSERT INTO traffic_monthly (year, month, metric_key, metric_label, unit, plan_value, fact_value) VALUES
(2026,1,'leads','Количество лидов','count',NULL,19),
(2026,2,'leads','Количество лидов','count',NULL,8),
(2026,3,'leads','Количество лидов','count',NULL,26),
(2026,4,'leads','Количество лидов','count',NULL,30),
(2026,5,'leads','Количество лидов','count',350,293),
(2026,6,'leads','Количество лидов','count',400,370),
(2026,7,'leads','Количество лидов','count',NULL,0),

(2026,1,'consultations','Количество консультаций','count',NULL,3),
(2026,2,'consultations','Количество консультаций','count',NULL,3),
(2026,3,'consultations','Количество консультаций','count',NULL,2),
(2026,4,'consultations','Количество консультаций','count',NULL,3),
(2026,5,'consultations','Количество консультаций','count',122,11),
(2026,6,'consultations','Количество консультаций','count',NULL,65),
(2026,7,'consultations','Количество консультаций','count',NULL,0),

(2026,1,'conv_lead_to_consult','Конверсия лид→консультация','percent',NULL,16),
(2026,2,'conv_lead_to_consult','Конверсия лид→консультация','percent',NULL,38),
(2026,3,'conv_lead_to_consult','Конверсия лид→консультация','percent',NULL,8),
(2026,4,'conv_lead_to_consult','Конверсия лид→консультация','percent',NULL,10),
(2026,5,'conv_lead_to_consult','Конверсия лид→консультация','percent',35,4),
(2026,6,'conv_lead_to_consult','Конверсия лид→консультация','percent',NULL,18),

(2026,1,'conv_lead_to_pay','Конверсия лид→оплата','percent',NULL,5),
(2026,2,'conv_lead_to_pay','Конверсия лид→оплата','percent',NULL,50),
(2026,3,'conv_lead_to_pay','Конверсия лид→оплата','percent',NULL,4),
(2026,4,'conv_lead_to_pay','Конверсия лид→оплата','percent',NULL,7),
(2026,5,'conv_lead_to_pay','Конверсия лид→оплата','percent',NULL,2),
(2026,6,'conv_lead_to_pay','Конверсия лид→оплата','percent',NULL,5),

(2026,1,'conv_consult_to_pay','Конверсия консультация→оплата','percent',NULL,33),
(2026,2,'conv_consult_to_pay','Конверсия консультация→оплата','percent',NULL,133),
(2026,3,'conv_consult_to_pay','Конверсия консультация→оплата','percent',NULL,50),
(2026,4,'conv_consult_to_pay','Конверсия консультация→оплата','percent',NULL,67),
(2026,5,'conv_consult_to_pay','Конверсия консультация→оплата','percent',NULL,45),
(2026,6,'conv_consult_to_pay','Конверсия консультация→оплата','percent',NULL,26),

(2026,4,'lead_cost','Средняя стоимость лида','money',NULL,3000),
(2026,5,'lead_cost','Средняя стоимость лида','money',NULL,1092),
(2026,6,'lead_cost','Средняя стоимость лида','money',NULL,1034),

(2026,4,'contract_cost','Стоимость договора','money',NULL,45000),
(2026,5,'contract_cost','Стоимость договора','money',NULL,35000),
(2026,6,'contract_cost','Стоимость договора','money',NULL,64000),
(2026,7,'contract_cost','Стоимость договора','money',NULL,22494),

(2026,NULL,'active_clients','Действующих клиентов в ОС','count',NULL,26),
(2026,NULL,'avg_check','Средний чек','money',NULL,23268),
(2026,NULL,'contracts_total','Кол-во договоров общее','count',NULL,60);
