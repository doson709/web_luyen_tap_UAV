// Seed học viên từ danh sách lớp UAV (23 học viên).
// username = tên không dấu viết liền, password = số điện thoại, role = student.
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const students = [
  ['Lê Trường Giang',        '0971002406', 'gianglt.ag@evnspc.vn',              'Công ty Điện lực An Giang'],
  ['Nguyễn Trí Anh Khoa',    '0972248000', 'khoanta.ag@evnspc.vn',              'Công ty Điện lực An Giang'],
  ['Võ Minh Luân',           '0939192936', 'vominhluanctcm@gmail.com',          'Công ty Điện lực Cà Mau'],
  ['Lê Chí Thành',           '0988653526', 'lechithanh300979@gmail.com',        'Công ty Điện lực Cà Mau'],
  ['Trương Hồng Hiệp',       '0849999112', 'hiepth.st@evnspc.vn',               'Công ty Điện lực Thành phố Cần Thơ'],
  ['Trương Văn Lợi',         '0898437884', 'truongvanloi522@gmail.com',         'Công ty Điện lực Thành phố Cần Thơ'],
  ['Nguyễn Đức Sơn',         '0919280875', 'n.duc.son.ct@gmail.com',            'Công ty Điện lực Thành phố Cần Thơ'],
  ['Nguyễn Phú Duân',        '0911414942', 'nguyenphuduankad3.ts18@gmail.com',  'Công ty Điện lực Đồng Tháp'],
  ['Nguyễn Hữu Tính',        '0325855768', 'nguyenhuutinh5768@gmail.com',       'Công ty Điện lực Đồng Tháp'],
  ['Nguyễn Ngọc Trung Lưu',  '0972062064', 'luunnt.ld@evnspc.vn',               'Công ty Điện lực Lâm Đồng'],
  ['Nguyễn Quốc Sinh',       '0386069680', 'sinhnq.ld@evnspc.vn',               'Công ty Điện lực Lâm Đồng'],
  ['Hoàng Văn Thái',         '0899350405', 'thaihv.ld@evnspc.vn',               'Công ty Điện lực Lâm Đồng'],
  ['Cù Khắc Phương Thành',   '0776666977', 'cuthanh3897@gmail.com',             'Công ty Điện lực Tây Ninh'],
  ['Đặng Võ Ninh',           '0937645660', 'ninhvo17021997@gmail.com',          'Công ty Điện lực Tây Ninh'],
  ['Tô Minh Kha',            '0947991117', 'tominhkha123@gmail.com',            'Công ty Điện lực Vĩnh Long'],
  ['Phan Tấn Khánh',         '0939883919', 'khanhpt.vl@evnspc.vn',              'Công ty Điện lực Vĩnh Long'],
  ['Nguyễn Thành Nhân',      '0343187090', 'nguyenthanhnhan1092@gmail.com',     'Công ty Điện lực Vĩnh Long'],
  ['Trần Phan Huy',          '0949669378', 'huyrua040882@gmail.com',            'Công ty Điện lực Đồng Nai'],
  ['Nguyễn Đức Viết',        '0986644468', 'vietnd.dn@evnspc.vn',               'Công ty Điện lực Đồng Nai'],
  ['Phạm Văn Chung',         '09077792196','chungpv.pec@evnspc.com',            'Công ty Tư vấn Điện miền Nam'],
  ['Lê Cao Thanh Trí',       '0908693963', 'trilct.pec@evnspc.vn',              'Công ty Tư vấn Điện miền Nam'],
  ['Nguyễn Ngọc Thoại',      '0932000699', 'thoai250480@gmail.com',             'Công ty Tư vấn Điện miền Nam'],
  ['Phạm Hoàng Toán',        '0969870214', 'toanph181295@gmail.com',            'Công ty Tư vấn Điện miền Nam'],
];

function stripVietnamese(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, '')
    .toLowerCase();
}

const existsStmt = db.prepare('SELECT id FROM users WHERE username = ?');
const insertStmt = db.prepare(`
  INSERT INTO users (username, password_hash, full_name, role, email, department)
  VALUES (?, ?, ?, 'student', ?, ?)
`);

let inserted = 0;
let skipped = 0;
const rows = [];

const tx = db.transaction(() => {
  for (const [name, phone, email, unit] of students) {
    const username = stripVietnamese(name);
    if (existsStmt.get(username)) {
      skipped++;
      console.log(`[SKIP] ${username} (đã tồn tại)`);
      continue;
    }
    const hash = bcrypt.hashSync(phone, bcrypt.genSaltSync(10));
    insertStmt.run(username, hash, name, email, unit);
    inserted++;
    rows.push([username, phone, name]);
  }
});
tx();

console.log(`\nĐã thêm ${inserted} học viên, bỏ qua ${skipped} (trùng username).`);
console.log('\nusername | mật khẩu | họ tên');
for (const [u, p, n] of rows) {
  console.log(`${u} | ${p} | ${n}`);
}
