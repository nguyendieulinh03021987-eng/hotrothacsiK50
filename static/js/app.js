document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("scholarshipForm");
    const submitBtn = document.getElementById("submitBtn");
    const successCard = document.getElementById("successCard");

    const loiForm = document.getElementById("loiForm");
    const loiFormNoiDung = document.getElementById("loiFormNoiDung");
    const stickyStepBar = document.getElementById("stickyStepBar");

    // Sticky Step Nav Bar click navigation & scroll observer
    const stepNavBtns = document.querySelectorAll("#stickyStepBar .nut-buoc-dinh");
    stepNavBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute("data-step-target");
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
                setActiveNav(targetId);
            }
        });
    });

    function setActiveNav(targetId) {
        stepNavBtns.forEach(btn => {
            if (btn.getAttribute("data-step-target") === targetId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }

    // Scroll listener to update active step in sticky bar as user scrolls
    const stepBlocks = document.querySelectorAll(".khoi-buoc");
    window.addEventListener("scroll", () => {
        let currentStepId = "step-1";
        const scrollPos = window.scrollY + 180;

        stepBlocks.forEach(block => {
            if (scrollPos >= block.offsetTop) {
                currentStepId = block.id;
            }
        });
        setActiveNav(currentStepId);
    });

    // Section II Checkbox Card Selection Handler:
    // Multi-select WITHIN the same discount level group (e.g. 2.1.1 & 2.1.3), mutually exclusive BETWEEN level groups (2.1 vs 2.2 vs 2.3 vs 2.4)
    const scholarshipGroupInput = document.getElementById("scholarship_group");
    let activeLevelGroup = null;

    document.querySelectorAll("#step-2 .the-chon").forEach(card => {
        card.addEventListener("click", (e) => {
            const checkbox = card.querySelector("input[type='checkbox']");
            if (!checkbox) return;

            const cardGroup = checkbox.getAttribute("data-group");

            // If user clicks a checkbox in a DIFFERENT level group than currently selected:
            // Uncheck all checkboxes in other groups!
            if (activeLevelGroup && activeLevelGroup !== cardGroup) {
                document.querySelectorAll("#step-2 input[name='scholarship_option']:checked").forEach(otherCb => {
                    if (otherCb.getAttribute("data-group") !== cardGroup) {
                        otherCb.checked = false;
                        const otherCard = otherCb.closest(".the-chon");
                        if (otherCard) otherCard.classList.remove("chon");
                    }
                });
            }

            if (e.target !== checkbox && e.target.tagName !== "LABEL") {
                checkbox.checked = !checkbox.checked;
            }

            if (checkbox.checked) {
                card.classList.add("chon");
                activeLevelGroup = cardGroup;
            } else {
                card.classList.remove("chon");
                // Check if any checkboxes in this group are still checked
                const stillCheckedInGroup = document.querySelectorAll(`#step-2 input[data-group="${cardGroup}"]:checked`);
                if (stillCheckedInGroup.length === 0) {
                    activeLevelGroup = null;
                }
            }

            updateScholarshipGroup();
        });
    });

    function updateScholarshipGroup() {
        const checkedBoxes = document.querySelectorAll("#step-2 input[name='scholarship_option']:checked");
        if (checkedBoxes.length === 0) {
            if (scholarshipGroupInput) scholarshipGroupInput.value = "";
            activeLevelGroup = null;
            return;
        }
        const firstGroup = checkedBoxes[0].getAttribute("data-group");
        activeLevelGroup = firstGroup;
        if (scholarshipGroupInput) {
            scholarshipGroupInput.value = firstGroup;
        }
    }

    // English Details conditional panel handler
    const evalEnglishYes = document.getElementById("eval_english_yes");
    const evalEnglishNo = document.getElementById("eval_english_no");
    const englishDetailsPanel = document.getElementById("english_details_panel");
    const englishType = document.getElementById("english_type");
    const englishScore = document.getElementById("english_score");
    const englishHidden = document.getElementById("self_eval_english_details");
    const chkEnglish = document.getElementById("self_eval_english");

    evalEnglishYes.addEventListener("change", () => {
        englishDetailsPanel.style.display = "flex";
        chkEnglish.checked = true;
    });

    evalEnglishNo.addEventListener("change", () => {
        englishDetailsPanel.style.display = "none";
        chkEnglish.checked = false;
        englishType.value = "";
        englishScore.value = "";
        englishHidden.value = "";
    });

    // Single Merged PDF File Selection Handler
    const fileDegreeInput = document.getElementById("file_degree");
    const filenameDisplay = document.querySelector(".filename-display");

    fileDegreeInput.addEventListener("change", () => {
        const file = fileDegreeInput.files[0];
        if (file) {
            if (!file.name.toLowerCase().endsWith(".pdf")) {
                showFormError("Vui lòng gộp tất cả minh chứng và chọn duy nhất file có định dạng PDF (.pdf)!");
                fileDegreeInput.value = "";
                filenameDisplay.textContent = "";
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                showFormError(`Dung lượng file PDF ${file.name} vượt quá 20MB! Vui lòng nén file nhỏ hơn.`);
                fileDegreeInput.value = "";
                filenameDisplay.textContent = "";
                return;
            }
            clearFormError();
            filenameDisplay.textContent = `Đã chọn file PDF: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        }
    });

    // Form Submission Handler
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (validateForm()) {
            submitForm();
        }
    });

    // Full 4-Step Form Validation
    function validateForm() {
        clearFormError();

        // 1. Validate Bước 1: Thông tin cá nhân
        const requiredFields = [
            { id: "fullname", label: "Họ và tên" },
            { id: "gender", label: "Giới tính" },
            { id: "dob", label: "Ngày sinh" },
            { id: "pob", label: "Nơi sinh" },
            { id: "student_class", label: "Lớp học Thạc sĩ" },
            { id: "student_cohort", label: "Khóa tuyển sinh" },
            { id: "citizen_id", label: "Số CCCD" },
            { id: "phone", label: "Số điện thoại" },
            { id: "email", label: "Địa chỉ Email" },
            { id: "graduated_uni", label: "Trường Đại học đã tốt nghiệp" },
            { id: "major", label: "Ngành tốt nghiệp Đại học" }
        ];

        for (let field of requiredFields) {
            const el = document.getElementById(field.id);
            if (!el || !el.value || el.value.trim() === "") {
                showFieldError(el, `[Bước 1] Vui lòng nhập/chọn thông tin "${field.label}".`);
                return false;
            }
            clearFieldError(el);
        }

        const emailEl = document.getElementById("email");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailEl.value.trim())) {
            showFieldError(emailEl, "[Bước 1] Địa chỉ email không đúng định dạng.");
            return false;
        }

        const cccdEl = document.getElementById("citizen_id");
        const cccdRegex = /^\d{9}$|^\d{12}$/;
        if (!cccdRegex.test(cccdEl.value.trim())) {
            showFieldError(cccdEl, "[Bước 1] Số CCCD phải gồm 9 hoặc 12 chữ số.");
            return false;
        }

        const phoneEl = document.getElementById("phone");
        const phoneRegex = /^\d{9,11}$/;
        if (!phoneRegex.test(phoneEl.value.trim())) {
            showFieldError(phoneEl, "[Bước 1] Số điện thoại liên hệ phải từ 9 đến 11 chữ số.");
            return false;
        }

        // 2. Validate Bước 2: Đối tượng xét miễn học phí (Cho phép chọn nhiều checkbox trong cùng 1 mức)
        const checkedBoxes = document.querySelectorAll("#step-2 input[name='scholarship_option']:checked");
        if (checkedBoxes.length === 0) {
            showSectionError("step-2", "[Bước 2] Vui lòng tích chọn ít nhất 01 đối tượng xét miễn học phí phù hợp.");
            return false;
        }
        updateScholarshipGroup();

        const selectedOptionValues = Array.from(checkedBoxes).map(cb => cb.value);
        const has25Percent = selectedOptionValues.some(v => v.includes("2.4.1") || v.includes("25%"));

        // 3. Validate Bước 3: Tự đánh giá thành tích & điều kiện
        const integratedCreditsEl = document.getElementById("self_eval_integrated_credits");
        if (has25Percent && (!integratedCreditsEl.value || integratedCreditsEl.value.trim() === "")) {
            showFieldError(integratedCreditsEl, "[Bước 3 - Mục 10] Học viên đăng ký mức miễn 25% vui lòng nhập rõ số tín chỉ & tên các môn học đã tích lũy.");
            return false;
        }

        if (evalEnglishYes.checked) {
            if (!englishType.value.trim() || !englishScore.value.trim()) {
                showFieldError(englishType, "[Bước 3 - Mục 9] Vui lòng điền loại chứng chỉ và điểm số/bậc tiếng Anh.");
                return false;
            }
            englishHidden.value = `${englishType.value.trim()} - ${englishScore.value.trim()}`;
        }

        // Map Table Radios to Hidden Checkbox States for Backend API
        const evalAwardRadio = document.querySelector("input[name='eval_award']:checked");
        document.getElementById("self_eval_award").checked = evalAwardRadio && evalAwardRadio.value === "Có";

        const evalValedictorianRadio = document.querySelector("input[name='eval_valedictorian']:checked");
        document.getElementById("self_eval_valedictorian").checked = evalValedictorianRadio && evalValedictorianRadio.value === "Có";

        const evalThesisRadio = document.querySelector("input[name='eval_thesis']:checked");
        document.getElementById("self_eval_thesis").checked = evalThesisRadio && evalThesisRadio.value === "Có";

        const evalScopusRadio = document.querySelector("input[name='eval_scopus']:checked");
        document.getElementById("self_eval_scopus").checked = evalScopusRadio && evalScopusRadio.value === "Có";

        const evalLecturerRadio = document.querySelector("input[name='eval_lecturer']:checked");
        document.getElementById("self_eval_lecturer_program").checked = evalLecturerRadio && evalLecturerRadio.value === "Có";

        // Map grade radio if selected
        const evalGradeRadio = document.querySelector("input[name='eval_grade']:checked");
        const gradGradeEl = document.getElementById("graduation_grade");
        if (evalGradeRadio && gradGradeEl) {
            gradGradeEl.value = evalGradeRadio.value;
        }

        // 4. Validate Bước 4: Tải 01 file PDF gộp duy nhất & Cam kết danh dự
        if (!fileDegreeInput.files || fileDegreeInput.files.length === 0) {
            showSectionError("step-4", "[Bước 4] Vui lòng tải lên 01 file PDF gộp toàn bộ hồ sơ minh chứng.");
            return false;
        }

        const commitment = document.getElementById("commitment");
        if (!commitment.checked) {
            showFieldError(commitment, "[Bước 4] Bạn phải tích chọn đồng ý với Cam kết danh dự trước khi nộp đơn.");
            return false;
        }

        return true;
    }

    function showFieldError(element, msg) {
        element.focus();
        element.setAttribute("aria-invalid", "true");
        showFormError(msg);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function showSectionError(sectionId, msg) {
        const sec = document.getElementById(sectionId);
        if (sec) {
            sec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        showFormError(msg);
    }

    function clearFieldError(element) {
        element.removeAttribute("aria-invalid");
    }

    function showFormError(msg) {
        loiFormNoiDung.textContent = msg;
        loiForm.style.display = "flex";
        loiForm.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function clearFormError() {
        loiForm.style.display = "none";
        loiFormNoiDung.textContent = "";
    }

    // Submit form via AJAX
    function submitForm() {
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang tải dữ liệu và lưu hồ sơ...";

        const formData = new FormData(form);
        
        // Combine multiple checked options from Step 2 into a single string joined by '; '
        const checkedOptions = Array.from(document.querySelectorAll("#step-2 input[name='scholarship_option']:checked")).map(cb => cb.value);
        formData.set("scholarship_option", checkedOptions.join("; "));

        formData.set("self_eval_gpa", "true");
        formData.set("self_eval_award", document.getElementById("self_eval_award").checked ? "true" : "false");
        formData.set("self_eval_valedictorian", document.getElementById("self_eval_valedictorian").checked ? "true" : "false");
        formData.set("self_eval_thesis", document.getElementById("self_eval_thesis").checked ? "true" : "false");
        formData.set("self_eval_scopus", document.getElementById("self_eval_scopus").checked ? "true" : "false");
        formData.set("self_eval_lecturer_program", document.getElementById("self_eval_lecturer_program").checked ? "true" : "false");
        formData.set("self_eval_english", chkEnglish.checked ? "true" : "false");

        const uploadCard = document.querySelector(".the-upload--gop-pdf");
        const progressBar = uploadCard.querySelector(".thanh-tien-trinh-upload");
        const progressFill = uploadCard.querySelector(".ruot-tien-trinh-upload");
        if (progressBar) progressBar.style.display = "block";

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/submit", true);

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                if (progressFill) progressFill.style.width = `${percent}%`;
                submitBtn.textContent = `Đang tải file PDF minh chứng (${percent}%)...`;
            }
        });

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                const res = JSON.parse(xhr.responseText);
                if (res.success) {
                    form.style.display = "none";
                    stickyStepBar.style.display = "none";
                    successCard.style.display = "flex";
                    successCard.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                    showFormError(`Lỗi: ${res.message}`);
                    resetSubmitButton();
                }
            } else {
                let msg = "Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại.";
                try {
                    const res = JSON.parse(xhr.responseText);
                    if (res.message) msg = res.message;
                } catch(e) {}
                showFormError(msg);
                resetSubmitButton();
            }
        };

        xhr.onerror = function() {
            showFormError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.");
            resetSubmitButton();
        };

        xhr.send(formData);
    }

    function resetSubmitButton() {
        submitBtn.disabled = false;
        submitBtn.textContent = "Nộp đơn đề nghị xét miễn học phí";
        const progressBar = document.querySelector(".thanh-tien-trinh-upload");
        if (progressBar) progressBar.style.display = "none";
        const progressFill = document.querySelector(".ruot-tien-trinh-upload");
        if (progressFill) progressFill.style.width = "0%";
    }

    // Success Screen reset
    document.getElementById("reloadBtn").addEventListener("click", () => {
        form.reset();
        filenameDisplay.textContent = "";
        englishDetailsPanel.style.display = "none";
        document.querySelectorAll("#step-2 .the-chon").forEach(c => c.classList.remove("chon"));

        clearFormError();
        form.style.display = "block";
        stickyStepBar.style.display = "block";
        successCard.style.display = "none";
        resetSubmitButton();

        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});
