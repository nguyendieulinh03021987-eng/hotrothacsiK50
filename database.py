import sqlite3
import os
from config import DATABASE_PATH

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create submissions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        gender TEXT NOT NULL,
        dob TEXT NOT NULL,
        pob TEXT NOT NULL,
        student_class TEXT NOT NULL,
        student_cohort TEXT NOT NULL,
        student_id TEXT,
        citizen_id TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        graduated_uni TEXT NOT NULL,
        major TEXT NOT NULL,
        graduation_grade TEXT NOT NULL,
        scholarship_group TEXT NOT NULL,
        scholarship_option TEXT NOT NULL,
        
        -- Self-evaluation checkboxes (0 for false, 1 for true)
        self_eval_gpa INTEGER DEFAULT 0,
        self_eval_award INTEGER DEFAULT 0,
        self_eval_valedictorian INTEGER DEFAULT 0,
        self_eval_thesis INTEGER DEFAULT 0,
        self_eval_nckh_level TEXT DEFAULT 'Không có',
        self_eval_nckh_prize TEXT DEFAULT 'Không có',
        self_eval_scopus INTEGER DEFAULT 0,
        self_eval_lecturer_program INTEGER DEFAULT 0,
        self_eval_english INTEGER DEFAULT 0,
        self_eval_english_details TEXT,
        self_eval_integrated_credits TEXT,
        
        notes TEXT,
        
        -- Paths to uploaded documents
        file_degree TEXT,
        file_nckh TEXT,
        file_valedictorian TEXT,
        file_english TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Migrate column if missing
    cursor.execute("PRAGMA table_info(submissions)")
    columns = [row['name'] for row in cursor.fetchall()]
    if 'self_eval_integrated_credits' not in columns:
        cursor.execute("ALTER TABLE submissions ADD COLUMN self_eval_integrated_credits TEXT")
        
    conn.commit()
    conn.close()

def save_submission(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = '''
    INSERT INTO submissions (
        fullname, gender, dob, pob, student_class, student_cohort, student_id, citizen_id,
        phone, email, graduated_uni, major, graduation_grade, scholarship_group, scholarship_option,
        self_eval_gpa, self_eval_award, self_eval_valedictorian, self_eval_thesis, 
        self_eval_nckh_level, self_eval_nckh_prize, self_eval_scopus, self_eval_lecturer_program,
        self_eval_english, self_eval_english_details, self_eval_integrated_credits, notes,
        file_degree, file_nckh, file_valedictorian, file_english
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
    )
    '''
    
    cursor.execute(query, (
        data['fullname'], data['gender'], data['dob'], data['pob'], data['student_class'], data['student_cohort'], data.get('student_id', ''), data['citizen_id'],
        data['phone'], data['email'], data['graduated_uni'], data['major'], data['graduation_grade'], data['scholarship_group'], data['scholarship_option'],
        data.get('self_eval_gpa', 0), data.get('self_eval_award', 0), data.get('self_eval_valedictorian', 0), data.get('self_eval_thesis', 0),
        data.get('self_eval_nckh_level', 'Không có'), data.get('self_eval_nckh_prize', 'Không có'), data.get('self_eval_scopus', 0), data.get('self_eval_lecturer_program', 0),
        data.get('self_eval_english', 0), data.get('self_eval_english_details', ''), data.get('self_eval_integrated_credits', ''), data.get('notes', ''),
        data.get('file_degree', ''), data.get('file_nckh', ''), data.get('file_valedictorian', ''), data.get('file_english', '')
    ))
    
    submission_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return submission_id

def get_all_submissions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM submissions ORDER BY created_at DESC')
    rows = cursor.fetchall()
    submissions = [dict(row) for row in rows]
    conn.close()
    return submissions

def get_submission_by_id(sub_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM submissions WHERE id = ?', (sub_id,))
    row = cursor.fetchone()
    submission = dict(row) if row else None
    conn.close()
    return submission
