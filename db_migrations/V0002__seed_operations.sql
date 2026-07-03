INSERT INTO operations (op_date, name, category, op_type, amount) VALUES
(current_date - INTERVAL '2 day', 'Оплата от ООО «Ветер»', 'Продажи', 'income', 480000),
(current_date - INTERVAL '1 day', 'Аренда офиса', 'Помещение', 'expense', 120000),
(current_date, 'Подписка Битрикс24', 'Софт', 'expense', 24000),
(current_date + INTERVAL '1 day', 'Оплата от ИП Смирнов', 'Услуги', 'income', 215000),
(current_date + INTERVAL '3 day', 'Зарплата команды', 'ФОТ', 'expense', 680000),
(current_date + INTERVAL '5 day', 'Рекламный бюджет', 'Маркетинг', 'expense', 95000),
(current_date + INTERVAL '7 day', 'Оплата от ООО «Каскад»', 'Продажи', 'income', 360000),
(current_date + INTERVAL '10 day', 'Налоги', 'Налоги', 'expense', 210000);
