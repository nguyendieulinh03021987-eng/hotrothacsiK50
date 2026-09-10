import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
import os

def format_dob(dob_str):
    if not dob_str:
        return ""
    dob_str = str(dob_str).strip()
    if '-' in dob_str:
        parts = dob_str.split('-')
        if len(parts) == 3 and len(parts[0]) == 4:  # YYYY-MM-DD -> dd/mm/yyyy
            return f"{parts[2]}/{parts[1]}/{parts[0]}"
    elif '/' in dob_str:
        parts = dob_str.split('/')
        if len(parts) == 3 and len(parts[0]) == 4:  # YYYY/MM/DD -> dd/mm/yyyy
            return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return dob_str

def generate_excel_report(submissions, output_path):
    if not submissions:
        # Create an empty template if no submissions
        df = pd.DataFrame(columns=[
            "STT", "Họ và tên", "Giới tính", "Ngày sinh", "Nơi sinh", 
            "Lớp", "Khóa", "Mã học viên", "Số CCCD", "Điện thoại", "Email",
            "Tốt nghiệp trường", "Ngành tốt nghiệp",
            "Mức miễn học phí", "Chi tiết loại học bổng đăng ký",
            "Xếp loại tốt nghiệp", "Được vinh danh lễ tốt nghiệp", "Thủ khoa chuyên ngành",
            "Có Khóa luận tốt nghiệp", "Đề tài NCKH cao nhất", "Giải thưởng NCKH cao nhất",
            "Bài báo WoS/Scopus", "Phát triển Giảng viên Khoa giới thiệu", "Chứng chỉ Tiếng Anh >= 4/6",
            "Chi tiết Tiếng Anh", "Tín chỉ & môn tích lũy CN-TS (mức 25%)", "Ghi chú/Minh chứng bổ sung", "Thời gian nộp"
        ])
    else:
        # Map values to Vietnamese display strings
        data_list = []
        for idx, sub in enumerate(submissions, 1):
            grad_grade = sub.get("graduation_grade") or ""
            if not grad_grade or grad_grade == "Chưa chọn":
                # Fallback to eval_gpa if present
                grad_grade = "Xuất sắc" if sub.get("self_eval_gpa") else ""

            data_list.append({
                "STT": idx,
                "Họ và tên": sub.get("fullname"),
                "Giới tính": sub.get("gender"),
                "Ngày sinh": format_dob(sub.get("dob")),
                "Nơi sinh": sub.get("pob"),
                "Lớp": sub.get("student_class"),
                "Khóa": sub.get("student_cohort"),
                "Mã học viên": sub.get("student_id"),
                "Số CCCD": sub.get("citizen_id"),
                "Điện thoại": sub.get("phone"),
                "Email": sub.get("email"),
                "Tốt nghiệp trường": sub.get("graduated_uni"),
                "Ngành tốt nghiệp": sub.get("major"),
                "Mức miễn học phí": sub.get("scholarship_group"),
                "Chi tiết loại học bổng đăng ký": sub.get("scholarship_option"),
                "Xếp loại tốt nghiệp": grad_grade,
                "Được vinh danh lễ tốt nghiệp": "Có" if sub.get("self_eval_award") else "Không",
                "Thủ khoa chuyên ngành": "Có" if sub.get("self_eval_valedictorian") else "Không",
                "Có Khóa luận tốt nghiệp": "Có" if sub.get("self_eval_thesis") else "Không",
                "Đề tài NCKH cao nhất": sub.get("self_eval_nckh_level"),
                "Giải thưởng NCKH cao nhất": sub.get("self_eval_nckh_prize"),
                "Bài báo WoS/Scopus": "Có" if sub.get("self_eval_scopus") else "Không",
                "Phát triển Giảng viên Khoa giới thiệu": "Có" if sub.get("self_eval_lecturer_program") else "Không",
                "Chứng chỉ Tiếng Anh >= 4/6": "Có" if sub.get("self_eval_english") else "Không",
                "Chi tiết Tiếng Anh": sub.get("self_eval_english_details"),
                "Tín chỉ & môn tích lũy CN-TS (mức 25%)": sub.get("self_eval_integrated_credits", ""),
                "Ghi chú/Minh chứng bổ sung": sub.get("notes"),
                "Thời gian nộp": sub.get("created_at")
            })
        df = pd.DataFrame(data_list)
        
    try:
        df.to_excel(output_path, index=False, sheet_name="Danh sách đăng ký")
    except PermissionError:
        # If file is open in Excel, write to fallback file name
        base, ext = os.path.splitext(output_path)
        output_path = f"{base}_temp{ext}"
        df.to_excel(output_path, index=False, sheet_name="Danh sách đăng ký")
    
    # Beautify with openpyxl
    wb = openpyxl.load_workbook(output_path)
    ws = wb.active
    
    # Styles
    font_family = "Times New Roman" # standard for Vietnamese university documents
    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid") # Dark blue
    header_font = Font(name=font_family, size=11, bold=True, color="FFFFFF")
    data_font = Font(name=font_family, size=11)
    
    thin_side = Side(border_style="thin", color="D3D3D3")
    border_style = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
    
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)
    
    # Set header styles
    ws.row_dimensions[1].height = 28
    for col_idx in range(1, len(df.columns) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = border_style
        
    # Set data styles
    for row_idx in range(2, ws.max_row + 1):
        ws.row_dimensions[row_idx].height = 22
        for col_idx in range(1, len(df.columns) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = data_font
            cell.border = border_style
            
            # Alignments
            col_name = df.columns[col_idx - 1]
            if col_name in ["STT", "Giới tính", "Ngày sinh", "Lớp", "Khóa", "Mã học viên", "Số CCCD", "Điện thoại", "Xếp loại tốt nghiệp", "Được vinh danh lễ tốt nghiệp", "Thủ khoa chuyên ngành", "Có Khóa luận tốt nghiệp", "Bài báo WoS/Scopus", "Phát triển Giảng viên Khoa giới thiệu", "Chứng chỉ Tiếng Anh >= 4/6", "Thời gian nộp"]:
                cell.alignment = center_align
            else:
                cell.alignment = left_align
                
    # Auto-fit columns
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        
        # Don't make notes or options columns excessively wide
        col_name = col[0].value
        if col_name in ["Chi tiết loại học bổng đăng ký", "Ghi chú/Minh chứng bổ sung", "Tín chỉ & môn tích lũy CN-TS (mức 25%)"]:
            ws.column_dimensions[col_letter].width = 32
            continue
            
        for cell in col:
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        # Limit min/max column width
        ws.column_dimensions[col_letter].width = max(max_len + 3, 10)
        
    wb.save(output_path)
    wb.close()
