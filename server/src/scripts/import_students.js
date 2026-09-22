const db = require('../config/db');
const bcrypt = require('bcryptjs');

const studentsData = [
  {
    tt: '01',
    full_name: 'Lê Trường Giang',
    phone: '0971002406',
    department: 'Xí nghiệp Lưới điện Cao thế An Giang',
    unit: 'Công ty Điện lực An Giang',
    email: 'gianglt.ag@evnspc.vn'
  },
  {
    tt: '02',
    full_name: 'Nguyễn Tri Anh Khoa',
    phone: '0972248000',
    department: 'Xí nghiệp Lưới điện Cao thế An Giang',
    unit: 'Công ty Điện lực An Giang',
    email: 'khoanta.ag@evnspc.vn'
  },
  {
    tt: '03',
    full_name: 'Võ Minh Luân',
    phone: '0939192936',
    department: 'Tổ Thao tác lưu động - Xí nghiệp Lưới điện Cao thế Cà Mau',
    unit: 'Công ty Điện lực Cà mau',
    email: 'vominhluanctcm@gmail.com'
  },
  {
    tt: '04',
    full_name: 'Lê Chí Thành',
    phone: '0988653526',
    department: 'Xí nghiệp Lưới điện Cao thế Cà Mau',
    unit: 'Công ty Điện lực Cà mau',
    email: 'lechithanh300979@gmail.com'
  },
  {
    tt: '05',
    full_name: 'Trương Hồng Hiệp',
    phone: '0849999112',
    department: 'Xí nghiệp Lưới điện Cao thế Tp.Cần Thơ',
    unit: 'Công Ty Điện Lực Thành Phố Cần Thơ',
    email: 'hiepth.st@evnspc.vn'
  },
  {
    tt: '06',
    full_name: 'Trương Văn Lợi',
    phone: '0898437884',
    department: 'Xí nghiệp Lưới điện Cao thế Tp.Cần Thơ',
    unit: 'Công Ty Điện Lực Thành Phố Cần Thơ',
    email: 'truongvanloi522@gmail.com'
  },
  {
    tt: '07',
    full_name: 'Nguyễn Đức Sơn',
    phone: '0919280875',
    department: 'Xí nghiệp Lưới điện Cao thế Tp.Cần Thơ',
    unit: 'Công Ty Điện Lực Thành Phố Cần Thơ',
    email: 'n.duc.son.ct@gmail.com'
  },
  {
    tt: '08',
    full_name: 'Nguyễn Phú Duân',
    phone: '0911414942',
    department: 'Xí nghiệp Lưới điện Cao thế Đồng Tháp',
    unit: 'Công ty Điện lực Đồng Tháp',
    email: 'nguyenphuduankad3.ts18@gmail.com'
  },
  {
    tt: '09',
    full_name: 'Nguyễn Hữu Tính',
    phone: '0325855768',
    department: 'Xí nghiệp Lưới điện Cao thế Đồng Tháp',
    unit: 'Công ty Điện lực Đồng Tháp',
    email: 'nguyenhuutinh5768@gmail.com'
  },
  {
    tt: '10',
    full_name: 'Nguyễn Ngọc Trung Lưu',
    phone: '0972062064',
    department: 'Xí nghiệp Lưới điện Cao thế Lâm Đồng',
    unit: 'Công ty Điện lực Lâm Đồng',
    email: 'luunnt.ld@evnspc.vn'
  },
  {
    tt: '11',
    full_name: 'Nguyễn Quốc Sinh',
    phone: '0386069680',
    department: 'Xí nghiệp Lưới điện Cao thế Lâm Đồng',
    unit: 'Công ty Điện lực Lâm Đồng',
    email: 'sinhnq.ld@evnspc.vn'
  },
  {
    tt: '12',
    full_name: 'Hoàng Văn Thái',
    phone: '0899350405',
    department: 'Xí nghiệp Lưới điện Cao thế Lâm Đồng',
    unit: 'Công ty Điện lực Lâm Đồng',
    email: 'thaihv.ld@evnspc.vn'
  },
  {
    tt: '13',
    full_name: 'Cù Khắc Phương Thành',
    phone: '0776666977',
    department: 'Xí nghiệp Lưới điện Cao thế Tây Ninh (cơ sở 2)',
    unit: 'Công ty Điện lực Tây Ninh',
    email: 'cuthanh3897@gmail.com'
  },
  {
    tt: '14',
    full_name: 'Đặng Võ Ninh',
    phone: '0937645660',
    department: 'Xí nghiệp Lưới điện Cao thế Tây Ninh',
    unit: 'Công ty Điện lực Tây Ninh',
    email: 'ninhvo17021997@gmail.com'
  },
  {
    tt: '15',
    full_name: 'Tô Minh Kha',
    phone: '0947991117',
    department: 'Xí nghiệp Lưới điện Cao thế Vĩnh Long',
    unit: 'Công ty Điện lực Vĩnh Long',
    email: 'tominhkha123@gmail.com'
  },
  {
    tt: '16',
    full_name: 'Phan Tấn Khánh',
    phone: '0939883919',
    department: 'Xí nghiệp Lưới điện Cao thế Vĩnh Long',
    unit: 'Công ty Điện lực Vĩnh Long',
    email: 'khanhpt.vl@evnspc.vn'
  },
  {
    tt: '17',
    full_name: 'Nguyễn Thành Nhân',
    phone: '0343187090',
    department: 'Xí nghiệp Lưới điện Cao thế Vĩnh Long',
    unit: 'Công ty Điện lực Vĩnh Long',
    email: 'nguyenthanhnhan1092@gmail.com'
  },
  {
    tt: '18',
    full_name: 'Trần Phan Huy',
    phone: '0949669378',
    department: 'Xí nghiệp Lưới điện Cao thế Đồng Nai',
    unit: 'Công ty Điện lực Đồng Nai',
    email: 'huyrua040882@gmail.com'
  },
  {
    tt: '19',
    full_name: 'Nguyễn Đức Viết',
    phone: '0986644468',
    department: 'Xí nghiệp Lưới điện Cao thế Đồng Nai',
    unit: 'Công ty Điện lực Đồng Nai',
    email: 'vietnd.dn@evnspc.vn'
  },
  {
    tt: '20',
    full_name: 'Phạm Văn Chung',
    phone: '0907779219',
    department: 'Đội khảo sát',
    unit: 'Công ty Tư vấn Điện miền Nam',
    email: 'chungpv.pec@evnspc.com'
  },
  {
    tt: '21',
    full_name: 'Lê Cao Thanh Trí',
    phone: '0908693963',
    department: 'Đội khảo sát',
    unit: 'Công ty Tư vấn Điện miền Nam',
    email: 'trilct.pec@evnspc.vn'
  },
  {
    tt: '22',
    full_name: 'Nguyễn Ngọc Thoại',
    phone: '0932000699',
    department: 'Đội khảo sát',
    unit: 'Công ty Tư vấn Điện miền Nam',
    email: 'thoai250480@gmail.com'
  },
  {
    tt: '23',
    full_name: 'Phạm Hoàng Toán',
    phone: '0969870214',
    department: 'Đội khảo sát',
    unit: 'Công ty Tư vấn Điện miền Nam',
    email: 'toanph181295@gmail.com'
  }
];

function importStudents() {
  console.log('--- BẮT ĐẦU IMPORT HỌC VIÊN TỔNG CÔNG TY ĐIỆN LỰC MIỀN NAM ---');

  // Find or create class
  let targetClass = db.prepare('SELECT * FROM classes WHERE name LIKE ?').get('%Tổng công ty điện lực Miền Nam%');
  if (!targetClass) {
    const res = db.prepare('INSERT INTO classes (name, description) VALUES (?, ?)').run(
      'Tổng công ty điện lực Miền Nam',
      'Lớp Đào tạo, sát hạch cấp giấy phép điều khiển phương tiện bay'
    );
    targetClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(res.lastInsertRowid);
  }

  console.log(`Đã chọn Lớp học ID ${targetClass.id}: "${targetClass.name}"`);

  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('123456', salt);

  let insertedCount = 0;
  let updatedCount = 0;

  const insertStmt = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, phone, department, unit, email, role, class_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE users 
    SET full_name = ?, phone = ?, department = ?, unit = ?, email = ?, class_id = ?
    WHERE id = ?
  `);

  for (const s of studentsData) {
    const username = s.phone.trim();
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ? OR (email = ? AND email IS NOT NULL)').get(username, s.phone.trim(), s.email.trim());

    if (existing) {
      updateStmt.run(s.full_name, s.phone, s.department, s.unit, s.email, targetClass.id, existing.id);
      updatedCount++;
    } else {
      insertStmt.run(username, defaultPasswordHash, s.full_name, s.phone, s.department, s.unit, s.email, targetClass.id);
      insertedCount++;
    }
  }

  console.log(`Hoàn thành! Thêm mới: ${insertedCount}, Cập nhật: ${updatedCount}, Tổng danh sách: ${studentsData.length}`);
}

importStudents();
