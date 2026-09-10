from flask import Flask, request, jsonify, send_from_directory, send_file, session
import os
import shutil
import zipfile
from werkzeug.utils import secure_filename
from datetime import datetime

# Import configuration and modules
import config
from database import init_db, save_submission, get_all_submissions, get_submission_by_id
from excel_generator import generate_excel_report

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = config.SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH

import unicodedata

# Helper to remove Vietnamese accents for safe ascii filenames
def remove_accents(input_str):
    if not input_str:
        return ""
    nfkd_form = unicodedata.normalize('NFD', input_str)
    only_ascii = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    return only_ascii.replace('Đ', 'D').replace('đ', 'd')

# Helper to check file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

# Ensure upload directory exists
os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)

# Initialize Database
init_db()

# Decorator to require admin login
def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- ROUTING FOR PAGES ---

@app.route('/')
def index():
    # Return index.html from static folder
    return send_file(os.path.join(config.BASE_DIR, 'static', 'index.html'))

@app.route('/admin')
def admin():
    # Return admin.html from static folder
    return send_file(os.path.join(config.BASE_DIR, 'static', 'admin.html'))

# --- API ENDPOINTS ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    password = data.get('password')
    if password == config.ADMIN_PASSWORD:
        session['admin_logged_in'] = True
        return jsonify({'success': True, 'message': 'Logged in successfully'})
    return jsonify({'success': False, 'message': 'Mật khẩu không chính xác'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/check-session', methods=['GET'])
def check_session():
    if session.get('admin_logged_in'):
        return jsonify({'success': True, 'logged_in': True})
    return jsonify({'success': True, 'logged_in': False})

@app.route('/api/submit', methods=['POST'])
def submit():
    try:
        # Form fields parsing
        fullname = request.form.get('fullname', '').strip()
        gender = request.form.get('gender', '').strip()
        dob = request.form.get('dob', '').strip()
        pob = request.form.get('pob', '').strip()
        student_class = request.form.get('student_class', '').strip()
        student_cohort = request.form.get('student_cohort', '').strip()
        student_id = request.form.get('student_id', '').strip()
        citizen_id = request.form.get('citizen_id', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        graduated_uni = request.form.get('graduated_uni', '').strip()
        major = request.form.get('major', '').strip()
        graduation_grade = request.form.get('graduation_grade', '').strip()
        if not graduation_grade:
            graduation_grade = request.form.get('eval_grade', 'Chưa chọn')
            
        scholarship_group = request.form.get('scholarship_group', '').strip()
        scholarship_option = request.form.get('scholarship_option', '').strip()
        
        # Self evaluation fields
        self_eval_gpa = 1 if request.form.get('self_eval_gpa') == 'true' else 0
        self_eval_award = 1 if request.form.get('self_eval_award') == 'true' else 0
        self_eval_valedictorian = 1 if request.form.get('self_eval_valedictorian') == 'true' else 0
        self_eval_thesis = 1 if request.form.get('self_eval_thesis') == 'true' else 0
        self_eval_nckh_level = request.form.get('self_eval_nckh_level', 'Không có')
        self_eval_nckh_prize = request.form.get('self_eval_nckh_prize', 'Không có')
        self_eval_scopus = 1 if request.form.get('self_eval_scopus') == 'true' else 0
        self_eval_lecturer_program = 1 if request.form.get('self_eval_lecturer_program') == 'true' else 0
        self_eval_english = 1 if request.form.get('self_eval_english') == 'true' else 0
        self_eval_english_details = request.form.get('self_eval_english_details', '')
        self_eval_integrated_credits = request.form.get('self_eval_integrated_credits', '').strip()
        notes = request.form.get('notes', '').strip()
        
        # Validate required fields (Removed graduation_grade from Step 1 required list)
        if not (fullname and gender and dob and pob and student_class and student_cohort and citizen_id and phone and email and graduated_uni and major and scholarship_group and scholarship_option):
            return jsonify({'success': False, 'message': 'Vui lòng điền đầy đủ các thông tin bắt buộc!'}), 400
            
        # Create student specific folder to save files
        # Folder format: "fullname_cccd" to keep it unique, removing accents to avoid charmap codec errors on Windows
        clean_fullname = remove_accents(fullname).replace(" ", "_")
        safe_name = secure_filename(clean_fullname) or "hoc_vien"
        student_folder_name = f"{safe_name}_{citizen_id}"
        student_upload_path = os.path.join(config.UPLOAD_FOLDER, student_folder_name)
        os.makedirs(student_upload_path, exist_ok=True)
        
        uploaded_files = {}
        file_keys = ['file_degree', 'file_nckh', 'file_valedictorian', 'file_english']
        
        for key in file_keys:
            if key in request.files:
                file = request.files[key]
                if file and file.filename != '':
                    if not allowed_file(file.filename):
                        return jsonify({'success': False, 'message': f'Định dạng file {file.filename} không được chấp nhận! (Chỉ nhận PDF, PNG, JPG)'}), 400
                    
                    # Generate safe unique filename
                    original_ext = file.filename.rsplit('.', 1)[1].lower()
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"{key}_{timestamp}.{original_ext}"
                    filepath = os.path.join(student_upload_path, filename)
                    file.save(filepath)
                    # Save relative path for easy serving
                    uploaded_files[key] = f"uploads/{student_folder_name}/{filename}"
                    
        # Construct db record dictionary
        submission_data = {
            'fullname': fullname, 'gender': gender, 'dob': dob, 'pob': pob,
            'student_class': student_class, 'student_cohort': student_cohort, 'student_id': student_id,
            'citizen_id': citizen_id, 'phone': phone, 'email': email,
            'graduated_uni': graduated_uni, 'major': major, 'graduation_grade': graduation_grade,
            'scholarship_group': scholarship_group, 'scholarship_option': scholarship_option,
            'self_eval_gpa': self_eval_gpa, 'self_eval_award': self_eval_award,
            'self_eval_valedictorian': self_eval_valedictorian, 'self_eval_thesis': self_eval_thesis,
            'self_eval_nckh_level': self_eval_nckh_level, 'self_eval_nckh_prize': self_eval_nckh_prize,
            'self_eval_scopus': self_eval_scopus, 'self_eval_lecturer_program': self_eval_lecturer_program,
            'self_eval_english': self_eval_english, 'self_eval_english_details': self_eval_english_details,
            'self_eval_integrated_credits': self_eval_integrated_credits,
            'notes': notes,
            'file_degree': uploaded_files.get('file_degree', ''),
            'file_nckh': uploaded_files.get('file_nckh', ''),
            'file_valedictorian': uploaded_files.get('file_valedictorian', ''),
            'file_english': uploaded_files.get('file_english', '')
        }
        
        # Save to SQLite
        submission_id = save_submission(submission_data)
        
        # Auto update Excel file in workspace
        try:
            all_subs = get_all_submissions()
            workspace_excel_path = os.path.join(config.BASE_DIR, 'Danh_Sach_Dang_Ky_Hoc_Bong.xlsx')
            generate_excel_report(all_subs, workspace_excel_path)
        except Exception as ex:
            print(f"Lỗi cập nhật Excel tự động: {ex}")
        
        return jsonify({
            'success': True,
            'message': 'Nộp đơn đăng ký thành công!',
            'submission_id': submission_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Có lỗi xảy ra: {str(e)}'}), 500

@app.route('/api/admin/submissions', methods=['GET'])
@admin_required
def admin_submissions():
    submissions = get_all_submissions()
    return jsonify({'success': True, 'submissions': submissions})

@app.route('/api/admin/download-file/<path:filename>', methods=['GET'])
@admin_required
def download_file(filename):
    # Ensure filepath is within upload folder
    filepath = os.path.join(config.BASE_DIR, 'uploads', filename)
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'message': 'Không tìm thấy file'}), 404
        
    directory = os.path.dirname(filepath)
    fname = os.path.basename(filepath)
    return send_from_directory(directory, fname, as_attachment=True)

@app.route('/api/admin/export', methods=['GET'])
@admin_required
def export_excel():
    submissions = get_all_submissions()
    
    # Save a copy in workspace for convenience
    workspace_excel_path = os.path.join(config.BASE_DIR, 'Danh_Sach_Dang_Ky_Hoc_Bong.xlsx')
    generate_excel_report(submissions, workspace_excel_path)
    
    # Send file to browser
    return send_file(workspace_excel_path, as_attachment=True, download_name='Danh_Sach_Dang_Ky_Hoc_Bong.xlsx')

@app.route('/api/admin/download-all', methods=['GET'])
@admin_required
def download_all_files():
    # Zip the uploads folder
    zip_path = os.path.join(config.BASE_DIR, 'tat_ca_minh_chung.zip')
    
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(config.UPLOAD_FOLDER):
            for file in files:
                file_path = os.path.join(root, file)
                # Keep directory structure inside ZIP
                arcname = os.path.relpath(file_path, config.UPLOAD_FOLDER)
                zip_file.write(file_path, arcname)
                
    return send_file(zip_path, as_attachment=True, download_name='tat_ca_minh_chung.zip')

if __name__ == '__main__':
    # Print launch info
    print(f"Starting server on http://localhost:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
