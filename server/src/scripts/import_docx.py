import os
import sys
import glob
import re
import shutil
import sqlite3
from datetime import datetime
import docx

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def clean_text(text):
    if not text:
        return ""
    # Replace non-breaking spaces and normalize whitespace
    return text.replace('\xa0', ' ').strip()

def clean_topic_title(raw_title, is_oral):
    t = clean_text(raw_title)
    # Remove trailing question counts e.g. (95 câu hỏi) or (22 CÂU)
    t = re.sub(r'\s*\(\s*\d+\s*(?:câu|câu\s*hỏi|CÂU|CÂU\s*HỎI)\s*\)', '', t, flags=re.IGNORECASE).strip()
    # Format Mục 1. -> Mục 1:
    t = re.sub(r'^(?:MỤC|Mục)\s+(\d+)\.?', r'Mục \1:', t)
    # Format oral topics
    if is_oral:
        t = re.sub(r'^(?:Chuyên đề|CHUYÊN ĐỀ)\s*\d*:\s*', '', t)
        t = re.sub(r'^(?:PHẦN|Phần)\s+[I|V|X|\d]+\.?\s*', '', t)
        t = re.sub(r'^(?:NGÂN HÀNG CÂU HỎI VẤN ĐÁP|Ngân hàng câu hỏi vấn đáp)\s*', '', t)
        t = clean_text(t)
        if t and not t.lower().startswith('vấn đáp'):
            t = f"Vấn đáp: {t}"
    return t

def run_import():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_dir = os.path.dirname(os.path.dirname(script_dir))
    web_dir = os.path.dirname(server_dir)
    parent_dir = os.path.dirname(web_dir)
    db_path = os.path.join(server_dir, "data", "uav_practice.db")
    
    print(f"[Import] Database path: {db_path}")
    print(f"[Import] Docx source directory: {parent_dir}")

    # 1. Backup existing DB if it exists
    if os.path.exists(db_path):
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{db_path}.{ts}.bak"
        shutil.copy2(db_path, backup_path)
        print(f"[Import] Created backup at: {backup_path}")

    # 2. Connect to SQLite
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Enable foreign keys
    cur.execute("PRAGMA foreign_keys = ON;")

    # 3. Create tables if not exist
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
      sso_id TEXT UNIQUE,
      email TEXT,
      department TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      code TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_num INTEGER DEFAULT 0,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      topic_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      question_type TEXT NOT NULL,
      bloom_level TEXT,
      target_role TEXT,
      stem TEXT NOT NULL,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      passing_criteria TEXT,
      follow_up_question TEXT,
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      module_id TEXT,
      topic_id TEXT,
      title TEXT,
      mode TEXT DEFAULT 'practice',
      total_questions INTEGER DEFAULT 0,
      completed_questions INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS session_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
    """)

    # Clean old curriculum & questions (keeps users intact)
    print("[Import] Cleaning obsolete questions, topics, modules...")
    cur.execute("DELETE FROM session_answers;")
    cur.execute("DELETE FROM practice_sessions;")
    cur.execute("DELETE FROM questions;")
    cur.execute("DELETE FROM topics;")
    cur.execute("DELETE FROM modules;")

    # Seed programs
    programs = [
        ("HANG_A", "Chương trình Hạng A — Điều khiển UAV trong tầm nhìn (VLOS)", "A", "Huấn luyện điều khiển máy bay không người lái trong giới hạn quan sát trực tiếp (VLOS)"),
        ("HANG_B", "Chương trình Hạng B — Điều khiển UAV ngoài tầm nhìn (BVLOS)", "B", "Huấn luyện điều khiển máy bay không người lái vượt tầm nhìn trực quan (BVLOS)")
    ]
    cur.executemany("INSERT OR REPLACE INTO programs (id, name, code, description) VALUES (?, ?, ?, ?)", programs)

    # 4. Find all 5 docx files
    docx_paths = sorted(glob.glob(os.path.join(parent_dir, "Hạng *.docx")))
    print(f"[Import] Found {len(docx_paths)} docx files.")

    total_questions_imported = 0
    modules_imported = 0

    for docx_path in docx_paths:
        fname = os.path.basename(docx_path)
        print(f"\n=======================================================")
        print(f"--> Processing: {fname}")

        # Parse filename: Hạng A - Lý Thuyết - HP1 - Cơ sở pháp lý...
        m = re.match(r"(Hạng [AB])\s*-\s*(Lý Thuyết|Thực Hành)\s*-\s*(HP\d+)\s*-\s*(.+)\.docx", fname, re.IGNORECASE)
        if not m:
            print(f"  [Skip] Filename does not match expected pattern: {fname}")
            continue

        hang_str, category_str, hp_str, title_str = m.groups()
        program_id = "HANG_A" if "Hạng A" in hang_str else "HANG_B"
        cat_code = "LT" if "Lý Thuyết" in category_str else "TH"
        module_id = f"{program_id}_{cat_code}_{hp_str}"
        module_title = f"{hp_str}: {title_str.strip()}"
        order_num = int(re.search(r"\d+", hp_str).group()) if re.search(r"\d+", hp_str) else 1

        cur.execute("""
            INSERT OR REPLACE INTO modules (id, program_id, code, category, title, description, order_num)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (module_id, program_id, hp_str, category_str.strip(), module_title, f"Học phần {hp_str} {category_str} môn huấn luyện UAV", order_num))
        modules_imported += 1

        doc = docx.Document(docx_path)

        # Topic map for this module
        topic_map = {}
        topic_counter = 0

        def get_or_create_topic(raw_title, is_oral_topic=False):
            nonlocal topic_counter
            clean_t = clean_topic_title(raw_title, is_oral_topic)
            if not clean_t:
                clean_t = f"Chủ đề {topic_counter + 1}"

            if clean_t in topic_map:
                return topic_map[clean_t]

            topic_counter += 1
            t_id = f"{module_id}_T{topic_counter}"
            cur.execute("""
                INSERT OR REPLACE INTO topics (id, module_id, title, order_num)
                VALUES (?, ?, ?, ?)
            """, (t_id, module_id, clean_t, topic_counter))
            topic_map[clean_t] = t_id
            return t_id

        # Parsing state
        is_body = False
        is_oral = False
        cur_topic_title = "Nội dung chung"
        cur_topic_id = None
        current_q = None

        def save_current_question(q):
            nonlocal total_questions_imported
            if not q:
                return

            # Determine bloom level
            bloom = "Vận dụng" if q['type'] == 'oral' else ("Thông hiểu" if q['type'] == 'true_false' else "Hiểu")
            role = "Người điều khiển UAV"

            # Determine default explanation if empty
            explanation = q.get('explanation', '')
            if not explanation:
                if q['type'] == 'oral':
                    explanation = f"Tiêu chí đạt: {q.get('criteria', '')}\nHướng dẫn trả lời: {q.get('correct_answer', '')}"
                elif q['type'] == 'true_false':
                    explanation = f"Căn cứ giáo trình huấn luyện tiêu chuẩn {hang_str} ({module_title}). Nhận định trên là: {q['correct_answer']}."
                else:
                    explanation = f"Căn cứ giáo trình huấn luyện tiêu chuẩn {hang_str} ({module_title}). Phương án chính xác là: {q['correct_answer']}."

            cur.execute("""
                INSERT OR REPLACE INTO questions 
                (code, topic_id, module_id, question_type, bloom_level, target_role, stem, option_a, option_b, option_c, option_d, correct_answer, explanation, passing_criteria)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                q['code'],
                q['topic_id'],
                module_id,
                q['type'],
                bloom,
                role,
                q['stem'],
                q.get('opt_a', ''),
                q.get('opt_b', ''),
                q.get('opt_c', ''),
                q.get('opt_d', ''),
                q['correct_answer'],
                explanation,
                q.get('criteria', '')
            ))
            total_questions_imported += 1

        for p in doc.paragraphs:
            t = clean_text(p.text)
            if not t:
                continue

            # Detect start of actual document body (skips Table of Contents)
            if re.match(r'^MỤC\s+1\.', t):
                is_body = True
                cur_topic_title = t
                cur_topic_id = get_or_create_topic(cur_topic_title, is_oral_topic=False)
                continue

            if not is_body:
                continue

            # Check next MCQ sections
            if re.match(r'^MỤC\s+\d+\.', t):
                cur_topic_title = t
                cur_topic_id = get_or_create_topic(cur_topic_title, is_oral_topic=False)
                continue

            # Check oral section
            if re.match(r'^PHẦN\s+II\.', t):
                is_oral = True
                cur_topic_title = t
                continue

            # Check oral topic headings
            if is_oral and (re.match(r'^Chuyên đề\s*\d*:', t) or re.match(r'^CHUYÊN ĐỀ\s*\d*:', t)):
                cur_topic_title = t
                cur_topic_id = get_or_create_topic(cur_topic_title, is_oral_topic=True)
                continue

            # Check MCQ / True-False header: e.g. "Câu 1 [UAV-C-M1-001 - Gốc: Câu 1]: ..."
            m_mcq = re.match(r'^Câu\s+\d+\s*\[([^\]]+)\]\s*:\s*(.*)', t)
            if m_mcq:
                save_current_question(current_q)
                raw_code = clean_text(m_mcq.group(1))
                short_code = raw_code.split(' - ')[0].strip()
                stem = clean_text(m_mcq.group(2))
                current_q = {
                    'code': short_code,
                    'topic_id': cur_topic_id,
                    'type': 'mcq',
                    'stem': stem,
                    'opt_a': '',
                    'opt_b': '',
                    'opt_c': '',
                    'opt_d': '',
                    'correct_answer': '',
                    'explanation': '',
                    'criteria': ''
                }
                continue

            # Check Oral header: e.g. "Câu hỏi vấn đáp 1 [UAV-V-M1-002 - Module 1]: ..."
            m_oral = re.match(r'^Câu hỏi vấn đáp\s+\d+\s*\[([^\]]+)\]\s*:\s*(.*)', t)
            if m_oral:
                save_current_question(current_q)
                raw_code = clean_text(m_oral.group(1))
                short_code = raw_code.split(' - ')[0].strip()
                stem = clean_text(m_oral.group(2))
                current_q = {
                    'code': short_code,
                    'topic_id': cur_topic_id,
                    'type': 'oral',
                    'stem': stem,
                    'opt_a': '',
                    'opt_b': '',
                    'opt_c': '',
                    'opt_d': '',
                    'correct_answer': '',
                    'explanation': '',
                    'criteria': ''
                }
                continue

            if not current_q:
                continue

            # Process lines within the active question
            if current_q['type'] != 'oral':
                # Option A
                if re.match(r'^A\.\s+', t):
                    opt_val = re.sub(r'^[A-D]\.\s*', '', t)
                    opt_val = re.sub(r'^[A-D]\.\s*', '', opt_val).strip()
                    current_q['opt_a'] = opt_val
                # Option B
                elif re.match(r'^B\.\s+', t):
                    opt_val = re.sub(r'^[A-D]\.\s*', '', t)
                    opt_val = re.sub(r'^[A-D]\.\s*', '', opt_val).strip()
                    current_q['opt_b'] = opt_val
                # Option C
                elif re.match(r'^C\.\s+', t):
                    opt_val = re.sub(r'^[A-D]\.\s*', '', t)
                    opt_val = re.sub(r'^[A-D]\.\s*', '', opt_val).strip()
                    current_q['opt_c'] = opt_val
                # Option D
                elif re.match(r'^D\.\s+', t):
                    opt_val = re.sub(r'^[A-D]\.\s*', '', t)
                    opt_val = re.sub(r'^[A-D]\.\s*', '', opt_val).strip()
                    current_q['opt_d'] = opt_val
                # Answer line
                elif 'đáp án đúng' in t.lower():
                    ans_m = re.match(r'^[►\*\-]?\s*Đáp án đúng\s*:\s*(.*)', t, re.IGNORECASE)
                    if ans_m:
                        raw_ans = clean_text(ans_m.group(1))
                        if 'đúng' in raw_ans.lower():
                            current_q['type'] = 'true_false'
                            current_q['correct_answer'] = 'Đúng'
                            current_q['opt_a'] = 'Đúng'
                            current_q['opt_b'] = 'Sai'
                        elif 'sai' in raw_ans.lower():
                            current_q['type'] = 'true_false'
                            current_q['correct_answer'] = 'Sai'
                            current_q['opt_a'] = 'Đúng'
                            current_q['opt_b'] = 'Sai'
                        else:
                            # MCQ option letter
                            letter_m = re.match(r'^([A-D])\.', raw_ans)
                            if letter_m:
                                current_q['correct_answer'] = letter_m.group(1)
                            else:
                                current_q['correct_answer'] = raw_ans
                else:
                    # Multi-line stem continuation before options
                    if not current_q['opt_a'] and not current_q['correct_answer']:
                        current_q['stem'] += ' ' + t
            else:
                # Oral answer lines
                if 'hướng dẫn trả lời' in t.lower():
                    h_m = re.match(r'^[►\*\-]?\s*Hướng dẫn trả lời\s*:\s*(.*)', t, re.IGNORECASE)
                    if h_m:
                        current_q['correct_answer'] = clean_text(h_m.group(1))
                elif 'tiêu chí đạt' in t.lower():
                    c_m = re.match(r'^[►\*\-]?\s*Tiêu chí đạt\s*:\s*(.*)', t, re.IGNORECASE)
                    if c_m:
                        current_q['criteria'] = clean_text(c_m.group(1))
                else:
                    if current_q.get('criteria'):
                        current_q['criteria'] += ' ' + t
                    elif current_q.get('correct_answer'):
                        current_q['correct_answer'] += ' ' + t
                    elif not current_q.get('correct_answer'):
                        current_q['stem'] += ' ' + t

        # Save last question of the document
        save_current_question(current_q)

        # Print module summary
        cur.execute("SELECT COUNT(*) FROM questions WHERE module_id = ?", (module_id,))
        mod_q_count = cur.fetchone()[0]
        print(f"  -> Successfully imported {mod_q_count} questions for module {module_id}")

    conn.commit()

    # Re-index
    cur.execute("CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);")

    # Final DB Verification
    cur.execute("SELECT COUNT(*) FROM questions")
    total_q = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM modules")
    total_m = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM topics")
    total_t = cur.fetchone()[0]

    cur.execute("""
        SELECT question_type, COUNT(*) 
        FROM questions 
        GROUP BY question_type
    """)
    type_counts = dict(cur.fetchall())

    cur.execute("""
        SELECT m.id, m.title, COUNT(q.id)
        FROM modules m
        LEFT JOIN questions q ON q.module_id = m.id
        GROUP BY m.id
        ORDER BY m.program_id ASC, m.order_num ASC
    """)
    mod_stats = cur.fetchall()

    print("\n=======================================================")
    print(f"DATABASE IMPORT COMPLETED SUCCESSFULLY!")
    print(f"  • Total Modules:   {total_m}")
    print(f"  • Total Topics:    {total_t}")
    print(f"  • Total Questions: {total_q}")
    print(f"  • Question Breakdown: {type_counts}")
    print("-------------------------------------------------------")
    for m_id, m_title, q_cnt in mod_stats:
        print(f"  • [{q_cnt} câu] {m_id}: {m_title}")
    print("=======================================================\n")

    conn.close()

if __name__ == "__main__":
    run_import()
