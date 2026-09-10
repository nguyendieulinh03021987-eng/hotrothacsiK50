document.addEventListener("DOMContentLoaded", () => {
    const loginPanel = document.getElementById("loginPanel");
    const dashboardPanel = document.getElementById("dashboardPanel");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginError = document.getElementById("loginError");
    const loginErrorMsg = document.getElementById("loginErrorMsg");

    const statTotal = document.getElementById("statTotal");
    const statGroup1 = document.getElementById("statGroup1");
    const statGroup2 = document.getElementById("statGroup2");

    const searchInput = document.getElementById("searchInput");
    const filterGroup = document.getElementById("filterGroup");
    const filterGrade = document.getElementById("filterGrade");
    const tableBody = document.getElementById("submissionsTableBody");
    const noDataMsg = document.getElementById("noDataMessage");

    const detailModal = document.getElementById("detailModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalStudentName = document.getElementById("modalStudentName");

    let allSubmissions = [];

    // Check login session
    fetch("/api/check-session")
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                showDashboard();
            } else {
                showLogin();
            }
        })
        .catch(() => showLogin());

    // Login Form Submit
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const passwordVal = document.getElementById("password").value;
        loginError.style.display = "none";

        fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: passwordVal })
        })
        .then(res => {
            if (!res.ok) throw new Error("Mật khẩu không hợp lệ!");
            return res.json();
        })
        .then(data => {
            if (data.success) {
                showDashboard();
            } else {
                showLoginError(data.message || "Mật khẩu không hợp lệ.");
            }
        })
        .catch(err => {
            showLoginError(err.message || "Đăng nhập thất bại.");
        });
    });

    function showLoginError(msg) {
        loginErrorMsg.textContent = msg;
        loginError.style.display = "flex";
    }

    // Logout
    logoutBtn.addEventListener("click", () => {
        fetch("/api/logout", { method: "POST" })
            .then(() => showLogin());
    });

    function showLogin() {
        loginPanel.style.display = "flex";
        dashboardPanel.style.display = "none";
        logoutBtn.style.display = "none";
        allSubmissions = [];
    }

    function showDashboard() {
        loginPanel.style.display = "none";
        dashboardPanel.style.display = "flex";
        logoutBtn.style.display = "block";
        document.getElementById("password").value = "";
        fetchSubmissions();
    }

    // Fetch Submissions List
    function fetchSubmissions() {
        fetch("/api/admin/submissions")
            .then(res => {
                if (res.status === 401) {
                    showLogin();
                    throw new Error("Phiên làm việc hết hạn");
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    allSubmissions = data.submissions || [];
                    updateStats();
                    renderTable();
                }
            })
            .catch(err => console.error(err));
    }

    function updateStats() {
        statTotal.textContent = allSubmissions.length;
        const g1 = allSubmissions.filter(s => s.scholarship_group === "Nhóm 1").length;
        const g2 = allSubmissions.filter(s => s.scholarship_group === "Nhóm 2").length;
        statGroup1.textContent = g1;
        statGroup2.textContent = g2;
    }

    function renderTable() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedGroup = filterGroup.value;
        const selectedGrade = filterGrade.value;

        const filtered = allSubmissions.filter(sub => {
            const matchesSearch = !query ||
                (sub.fullname && sub.fullname.toLowerCase().includes(query)) ||
                (sub.citizen_id && sub.citizen_id.includes(query)) ||
                (sub.student_id && sub.student_id.toLowerCase().includes(query)) ||
                (sub.student_class && sub.student_class.toLowerCase().includes(query)) ||
                (sub.major && sub.major.toLowerCase().includes(query)) ||
                (sub.graduated_uni && sub.graduated_uni.toLowerCase().includes(query));

            const matchesGroup = !selectedGroup || sub.scholarship_group === selectedGroup;
            const matchesGrade = !selectedGrade || sub.graduation_grade === selectedGrade;

            return matchesSearch && matchesGroup && matchesGrade;
        });

        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            noDataMsg.style.display = "block";
            return;
        }
        noDataMsg.style.display = "none";

        filtered.forEach((sub, idx) => {
            const tr = document.createElement("tr");
            const isGroup1 = sub.scholarship_group === 'Nhóm 1';
            const badgeBg = isGroup1 ? 'var(--cam-nhat)' : 'var(--la-nhat)';
            const badgeColor = isGroup1 ? 'var(--cam)' : 'var(--la-chu)';
            const badgeBorder = isGroup1 ? '#F5D5C2' : 'var(--la-vien)';

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
                <td style="font-weight: 700; color: var(--muc);">${escapeHtml(sub.fullname)}</td>
                <td>${escapeHtml(sub.student_id || '-')}</td>
                <td>${escapeHtml(sub.student_class)}</td>
                <td>${escapeHtml(sub.citizen_id)}</td>
                <td><span style="font-weight: 600; font-size: 12.5px; padding: 3px 10px; border-radius: var(--pill); background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">${escapeHtml(sub.scholarship_group)}</span></td>
                <td>${escapeHtml(sub.graduation_grade)}</td>
                <td style="text-align: center;">
                    <button class="nut-thao-tac view-btn" data-id="${sub.id}">Xem</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        document.querySelectorAll(".view-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const subId = btn.getAttribute("data-id");
                openDetailModal(subId);
            });
        });
    }

    searchInput.addEventListener("input", renderTable);
    filterGroup.addEventListener("change", renderTable);
    filterGrade.addEventListener("change", renderTable);

    // Modal popup management
    function openDetailModal(id) {
        const sub = allSubmissions.find(s => s.id == id);
        if (!sub) return;

        modalStudentName.textContent = `Hồ sơ: ${sub.fullname.toUpperCase()}`;

        document.getElementById("dFullname").textContent = sub.fullname;
        document.getElementById("dGender").textContent = sub.gender;
        document.getElementById("dDob").textContent = formatDate(sub.dob);
        document.getElementById("dPob").textContent = sub.pob;
        document.getElementById("dClass").textContent = sub.student_class;
        document.getElementById("dCohort").textContent = sub.student_cohort;
        document.getElementById("dStudentId").textContent = sub.student_id || "Chưa có";
        document.getElementById("dCitizenId").textContent = sub.citizen_id;
        document.getElementById("dPhone").textContent = sub.phone;
        document.getElementById("dEmail").textContent = sub.email;
        document.getElementById("dGradUni").textContent = sub.graduated_uni;
        document.getElementById("dMajor").textContent = sub.major;
        document.getElementById("dGradGrade").textContent = sub.graduation_grade;

        document.getElementById("dSchGroup").textContent = sub.scholarship_group;
        document.getElementById("dSchOption").textContent = sub.scholarship_option;

        const evalList = document.getElementById("dSelfEvalList");
        evalList.innerHTML = `
            ${renderChecklistItem("Tốt nghiệp Đại học đạt loại Xuất sắc hoặc Giỏi", sub.self_eval_gpa)}
            ${renderChecklistItem("Được vinh danh/tặng giấy khen trong Lễ tốt nghiệp", sub.self_eval_award)}
            ${renderChecklistItem("Là Thủ khoa chuyên ngành tốt nghiệp Đại học", sub.self_eval_valedictorian)}
            ${renderChecklistItem("Có thực hiện Khóa luận tốt nghiệp Đại học", sub.self_eval_thesis)}
            <div class="dong-tieu-chi" style="cursor: default;">
                <span style="font-size: 13.5px; color: var(--chu-thich);">Cấp đề tài NCKH cao nhất:</span>
                <strong style="color: var(--xanh); font-size: 13.5px; margin-left: auto;">${escapeHtml(sub.self_eval_nckh_level)}</strong>
            </div>
            <div class="dong-tieu-chi" style="cursor: default;">
                <span style="font-size: 13.5px; color: var(--chu-thich);">Cấp giải thưởng NCKH cao nhất:</span>
                <strong style="color: var(--xanh); font-size: 13.5px; margin-left: auto;">${escapeHtml(sub.self_eval_nckh_prize)}</strong>
            </div>
            ${renderChecklistItem("Tác giả chính bài báo khoa học WoS/Scopus", sub.self_eval_scopus)}
            ${renderChecklistItem("Được Khoa giới thiệu tham gia chương trình PT giảng viên", sub.self_eval_lecturer_program)}
            ${renderChecklistItem("Đạt chứng chỉ Tiếng Anh (Tối thiểu bậc 4/6)", sub.self_eval_english)}
        `;

        if (sub.self_eval_english && sub.self_eval_english_details) {
            evalList.innerHTML += `
                <div class="hop hop--xanh" style="margin-top: 4px;">
                    <span class="hop__dau">i</span>
                    <span>Chi tiết chứng chỉ: <strong>${escapeHtml(sub.self_eval_english_details)}</strong></span>
                </div>
            `;
        }

        document.getElementById("dNotes").textContent = sub.notes || "Không có ghi chú bổ sung.";

        const filesGrid = document.getElementById("dFilesGrid");
        filesGrid.innerHTML = `
            ${renderFileDownloadButton("Bằng tốt nghiệp & Bảng điểm", sub.file_degree)}
            ${renderFileDownloadButton("Minh chứng NCKH / Giải thưởng", sub.file_nckh)}
            ${renderFileDownloadButton("Minh chứng Thủ khoa", sub.file_valedictorian)}
            ${renderFileDownloadButton("Chứng chỉ Tiếng Anh", sub.file_english)}
        `;

        detailModal.classList.add("mo");
    }

    closeModalBtn.addEventListener("click", () => {
        detailModal.classList.remove("mo");
    });

    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) {
            detailModal.classList.remove("mo");
        }
    });

    function renderChecklistItem(label, checked) {
        const border = checked ? 'var(--la-vien)' : 'var(--vien-o)';
        const bg = checked ? 'var(--la-nhat)' : '#ffffff';
        const iconColor = checked ? 'var(--la-chu)' : 'var(--loi)';
        const iconChar = checked ? '✓' : '✕';

        return `
            <div class="dong-tieu-chi" style="border-color: ${border}; background: ${bg}; cursor: default;">
                <span style="color: ${iconColor}; font-weight: 700; font-size: 14px;">${iconChar}</span>
                <span style="font-size: 13.5px; font-weight: 500;">${label}</span>
            </div>
        `;
    }

    function renderFileDownloadButton(label, relativePath) {
        if (!relativePath) {
            return `
                <div style="background: var(--nen); padding: 12px 14px; border-radius: var(--bo); border: 1px dashed var(--vien-o); display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 12.5px; color: var(--chu-thich);">${label}</span>
                    <span style="font-size: 13px; color: var(--loi-chu); font-weight: 500;">Chưa nộp đính kèm</span>
                </div>
            `;
        }

        const cleanPath = relativePath.startsWith("uploads/") ? relativePath.replace("uploads/", "") : relativePath;
        const downloadUrl = `/api/admin/download-file/${cleanPath}`;

        return `
            <div style="background: var(--xanh-nhat); padding: 12px 14px; border-radius: var(--bo); border: 1px solid var(--xanh-vien); display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 12.5px; color: #2C5E85; font-weight: 500;">${label}</span>
                <a href="${downloadUrl}" class="nut nut--phu nut--nho" style="width: auto; align-self: flex-start;" download>
                    Tải tài liệu xuống
                </a>
            </div>
        `;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        } catch (e) {}
        return dateStr;
    }
});
