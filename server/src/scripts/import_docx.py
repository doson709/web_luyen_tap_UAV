import os
import sys
import glob
import re
import sqlite3
import docx
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import Table
from docx.text.paragraph import Paragraph

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def clean_text(text):
    if not text:
        return ""
    # Replace non-breaking spaces and strip
    return text.replace('\xa0', ' ').strip()

def run_import():
    # Database path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_dir = os.path.dirname(os.path.dirname(script_dir))
    web_dir = os.path.dirname(server_dir)
    parent_dir = os.path.dirname(web_dir)
    db_path = os.path.join(server_dir, "data", "uav_practice.db")
    
    print(f"[Import] Database: {db_path}")
    print(f"[Import] Scanning docx files in: {parent_dir}")

    # Connect to SQLite
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Make sure tables exist
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
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    );
    """)

    # Seed programs
    programs = [
        ("HANG_A", "Chương trình Hạng A — Điều khiển UAV trong tầm nhìn (VLOS)", "A", "Huấn luyện điều khiển máy bay không người lái trong giới hạn quan sát trực tiếp (VLOS)"),
        ("HANG_B", "Chương trình Hạng B — Điều khiển UAV ngoài tầm nhìn (BVLOS)", "B", "Huấn luyện điều khiển máy bay không người lái vượt tầm nhìn trực quan (BVLOS)")
    ]
    cur.executemany("INSERT OR REPLACE INTO programs (id, name, code, description) VALUES (?, ?, ?, ?)", programs)

    # Find all 10 docx files matching Hạng A / Hạng B
    docx_paths = sorted(glob.glob(os.path.join(parent_dir, "Hạng *.docx")))
    print(f"[Import] Found {len(docx_paths)} syllabus docx files.")

    total_questions_imported = 0

    for docx_path in docx_paths:
        fname = os.path.basename(docx_path)
        print(f"\n---> Processing: {fname}")

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

        doc = docx.Document(docx_path)

        current_section = "Trắc nghiệm"
        current_topic_title = "Nội dung chung"
        topic_count = 0

        # Topic map for module
        topic_id_map = {}

        def get_or_create_topic(title):
            nonlocal topic_count
            clean_t = clean_text(title)
            # Remove trailing question counts e.g. (120 câu) or (7 câu)
            clean_t_short = re.sub(r"\s*\(\d+\s*câu\)", "", clean_t).strip()
            if not clean_t_short:
                clean_t_short = f"Chủ đề {topic_count + 1}"

            if clean_t_short in topic_id_map:
                return topic_id_map[clean_t_short]

            topic_count += 1
            t_id = f"{module_id}_T{topic_count}"
            cur.execute("""
                INSERT OR REPLACE INTO topics (id, module_id, title, order_num)
                VALUES (?, ?, ?, ?)
            """, (t_id, module_id, clean_t_short, topic_count))
            topic_id_map[clean_t_short] = t_id
            return t_id

        # Iterate body children sequentially
        for child in doc.element.body:
            if isinstance(child, CT_P):
                p = Paragraph(child, doc)
                p_text = clean_text(p.text)
                if not p_text:
                    continue

                if "NGÂN HÀNG CÂU HỎI TRẮC NGHIỆM" in p_text.upper():
                    current_section = "Trắc nghiệm"
                elif "NGÂN HÀNG CÂU HỎI VẤN ĐÁP" in p_text.upper():
                    current_section = "Vấn đáp"
                elif re.match(r"^\d+\.\s*Phần\s*\d+", p_text, re.IGNORECASE) or p_text.startswith("Phần "):
                    current_topic_title = p_text

            elif isinstance(child, CT_Tbl):
                tbl = Table(child, doc)
                if len(tbl.rows) < 2:
                    continue

                # Inspect header row to determine table type
                hdr_cells = [clean_text(c.text) for c in tbl.rows[0].cells]
                hdr_sub = [clean_text(c.text) for c in tbl.rows[1].cells] if len(tbl.rows) > 1 else []
                combined_hdr = " ".join(hdr_cells + hdr_sub).lower()

                current_topic_id = get_or_create_topic(current_topic_title)

                is_oral = "vấn đáp" in combined_hdr or "hướng dẫn trả lời" in combined_hdr or "tiêu chí đạt" in combined_hdr or current_section == "Vấn đáp"

                # Rows to skip: usually row 0 (group headers) and row 1 (column headers)
                start_row = 2 if len(tbl.rows) > 2 and ("mã id" in combined_hdr or "câu dẫn" in combined_hdr) else 1

                for r_idx in range(start_row, len(tbl.rows)):
                    row = tbl.rows[r_idx]
                    cells = [clean_text(c.text) for c in row.cells]
                    if not any(cells):
                        continue

                    # Filter out any duplicate header row inside the table
                    if "Mã ID" in cells[0] or "Câu dẫn" in " ".join(cells):
                        continue

                    if not is_oral:
                        # MCQ or True/False table
                        # Cols expected: [Mã ID, Đối tượng, Lĩnh vực, Bậc Bloom, Loại câu hỏi, Câu dẫn, Phương án A, B, C, D, Đáp án]
                        if len(cells) >= 6:
                            q_code = cells[0] if cells[0] else f"{module_id}_Q{total_questions_imported+1}"
                            target_role = cells[1] if len(cells) > 1 else ""
                            bloom_level = cells[3] if len(cells) > 3 else "Hiểu"
                            q_type_str = cells[4] if len(cells) > 4 else "Trắc nghiệm"
                            stem = cells[5] if len(cells) > 5 else ""

                            if not stem:
                                continue

                            opt_a = cells[6] if len(cells) > 6 else ""
                            opt_b = cells[7] if len(cells) > 7 else ""
                            opt_c = cells[8] if len(cells) > 8 else ""
                            opt_d = cells[9] if len(cells) > 9 else ""
                            correct_ans = cells[10] if len(cells) > 10 else ""

                            q_type = "true_false" if ("đúng" in q_type_str.lower() or "sai" in q_type_str.lower() or "đúng/sai" in q_type_str.lower()) else "mcq"

                            # If true/false and options are empty, provide standard options
                            if q_type == "true_false":
                                if not opt_a:
                                    opt_a = "Đúng"
                                if not opt_b:
                                    opt_b = "Sai"

                            # Initial helpful explanation based on question
                            explanation = f"Căn cứ theo giáo trình huấn luyện tiêu chuẩn {hang_str} ({module_title}). Đáp án chính xác là: {correct_ans}."

                            cur.execute("""
                                INSERT OR REPLACE INTO questions 
                                (code, topic_id, module_id, question_type, bloom_level, target_role, stem, option_a, option_b, option_c, option_d, correct_answer, explanation)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (q_code, current_topic_id, module_id, q_type, bloom_level, target_role, stem, opt_a, opt_b, opt_c, opt_d, correct_ans, explanation))
                            total_questions_imported += 1

                    else:
                        # Oral question table
                        # Cols expected: [Mã ID, Đối tượng, Lĩnh vực, Câu hỏi vấn đáp, Đáp án / Hướng dẫn trả lời, Tiêu chí đạt, Câu hỏi gợi mở]
                        if len(cells) >= 4:
                            q_code = cells[0] if cells[0] else f"{module_id}_V{total_questions_imported+1}"
                            target_role = cells[1] if len(cells) > 1 else ""
                            stem = cells[3] if len(cells) > 3 else ""
                            model_ans = cells[4] if len(cells) > 4 else ""
                            criteria = cells[5] if len(cells) > 5 else ""
                            followup = cells[6] if len(cells) > 6 else ""

                            if not stem:
                                continue

                            explanation = f"Hướng dẫn chấm điểm: {model_ans}" if model_ans else "Đáp án chuẩn theo tài liệu giảng dạy."

                            cur.execute("""
                                INSERT OR REPLACE INTO questions 
                                (code, topic_id, module_id, question_type, bloom_level, target_role, stem, correct_answer, passing_criteria, follow_up_question, explanation)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (q_code, current_topic_id, module_id, "oral", "Vận dụng", target_role, stem, model_ans, criteria, followup, explanation))
                            total_questions_imported += 1

    conn.commit()
    
    # Check total count in DB
    cur.execute("SELECT COUNT(*) FROM questions")
    q_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM modules")
    m_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM topics")
    t_count = cur.fetchone()[0]

    print("\n============================================")
    print(f"[Import Success] Done!")
    print(f"  -> Total Modules in DB:   {m_count}")
    print(f"  -> Total Topics in DB:    {t_count}")
    print(f"  -> Total Questions in DB: {q_count}")
    print("============================================")

    conn.close()

if __name__ == "__main__":
    run_import()
