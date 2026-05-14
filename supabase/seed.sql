-- Optional: run after schema.sql to load sample data.

insert into units (number, floor, unit_type, size_sqft, monthly_fee, status) values
  ('101', 1, '1br',    650,  1200.00, 'occupied'),
  ('102', 1, '2br',    900,  1600.00, 'occupied'),
  ('103', 1, 'studio', 450,   950.00, 'vacant'),
  ('201', 2, '2br',    950,  1700.00, 'occupied'),
  ('202', 2, '3br',   1200,  2100.00, 'vacant'),
  ('301', 3, '3br',   1250,  2200.00, 'occupied');

insert into residents (unit_id, first_name, last_name, email, phone, move_in_date, status) values
  (1, 'Alice',  'Johnson', 'alice@example.com', '555-1001', '2023-01-15', 'active'),
  (2, 'Bob',    'Smith',   'bob@example.com',   '555-1002', '2022-06-01', 'active'),
  (4, 'Carol',  'Davis',   'carol@example.com', '555-1003', '2023-09-01', 'active'),
  (6, 'David',  'Martinez','david@example.com', '555-1004', '2021-03-20', 'active');

insert into payments (resident_id, payment_type, amount, due_date, paid_date, status) values
  (1, 'monthly_fee', 1200.00, current_date,                       current_date - 5,  'paid'),
  (1, 'monthly_fee', 1200.00, current_date - interval '1 month',  current_date - 35, 'paid'),
  (2, 'monthly_fee', 1600.00, current_date,                       null,              'pending'),
  (2, 'late_fee',      50.00, current_date - 10,                  null,              'overdue'),
  (3, 'monthly_fee', 1700.00, current_date,                       current_date - 2,  'paid'),
  (4, 'monthly_fee', 2200.00, current_date,                       null,              'pending'),
  (4, 'special_assessment', 500.00, current_date + 15,            null,              'pending');
