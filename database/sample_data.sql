-- Sample data for testing

USE personal_finance;

-- Insert sample transactions
INSERT INTO transactions (title, amount, type, category_id, description, transaction_date) VALUES
('Gaji Bulanan Oktober', 5000000, 'income', 1, 'Gaji bulan Oktober 2024', '2024-10-01'),
('Bonus Kinerja', 1000000, 'income', 2, 'Bonus kinerja Q3 2024', '2024-10-05'),
('Makan Siang', 50000, 'expense', 6, 'Makan siang di restoran', '2024-10-02'),
('Isi Bensin', 100000, 'expense', 7, 'Isi bensin motor', '2024-10-03'),
('Belanja Bulanan', 800000, 'expense', 8, 'Belanja kebutuhan bulanan di supermarket', '2024-10-04'),
('Nonton Bioskop', 75000, 'expense', 9, 'Tiket nonton film di bioskop', '2024-10-06'),
('Bayar Listrik', 200000, 'expense', 10, 'Pembayaran tagihan listrik', '2024-10-07'),
('Freelance Project', 2000000, 'income', 4, 'Pembayaran project freelance web development', '2024-10-08'),
('Beli Buku', 150000, 'expense', 12, 'Pembelian buku programming', '2024-10-09'),
('Tabungan Bulanan', 1500000, 'expense', 13, 'Transfer ke rekening tabungan', '2024-10-10'),

-- September data for monthly report testing
('Gaji Bulanan September', 5000000, 'income', 1, 'Gaji bulan September 2024', '2024-09-01'),
('Makan Siang', 45000, 'expense', 6, 'Makan siang di kantin', '2024-09-15'),
('Isi Bensin', 95000, 'expense', 7, 'Isi bensin motor', '2024-09-20'),
('Belanja Bulanan', 750000, 'expense', 8, 'Belanja kebutuhan bulanan', '2024-09-25'),
('Tabungan Bulanan', 1500000, 'expense', 13, 'Transfer ke rekening tabungan', '2024-09-30');