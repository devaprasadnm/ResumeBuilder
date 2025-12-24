// ============================================
// Toast Notification System
// ============================================
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;margin-left:1rem;font-size:1.2rem;">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// Auto-Fill and Clear Functions
// ============================================
async function fetchExistingResume() {
    try {
        console.log('Fetching resume data...');
        const response = await fetch('/api/resume-data');
        let data = await response.json();
        console.log('Received data:', data);
        
        // Handle double-encoded JSON if necessary
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
                console.log('Parsed string data:', data);
            } catch (e) {
                console.error('Failed to parse data string', e);
            }
        }

        // Handle wrapped data (e.g. { content: { ... } })
        if (data.content && typeof data.content === 'object') {
            console.log('Unwrapping data content');
            data = data.content;
        }
        
        // Check if we have meaningful data from the API
        if (data && Object.keys(data).length > 0) {
            let structuredData = data;

            // If data is in flat format (from PDF extraction or old format), convert to structured
            if (!data.personal && (data.name || data.email)) {
                console.log('Converting flat data to structured format');
                structuredData = {
                    personal: {
                        fullName: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        location: data.location || '',
                        linkedin: data.linkedin || '',
                        github: data.github || '',
                        portfolio: data.portfolio || ''
                    },
                    summary: data.summary || '',
                    skills: Array.isArray(data.skills) ? data.skills : [],
                    experience: Array.isArray(data.experience) ? data.experience : [],
                    education: Array.isArray(data.education) ? data.education : [],
                    projects: Array.isArray(data.projects) ? data.projects : [],
                    certifications: Array.isArray(data.certifications) ? data.certifications : []
                };
            }

            console.log('Populating form with:', structuredData);
            populateFormData(structuredData);
            
            // Verify if data was populated
            const nameVal = document.getElementById('fullName').value;
            if (nameVal) {
                showToast(`✅ Resume data loaded! (Name: ${nameVal})`, 'success');
            } else {
                showToast('⚠️ Data loaded but name is empty.', 'warning');
            }
            
            saveFormData(); // Sync to local storage
        } else {
            console.log('No data found');
            showToast('ℹ️ No saved resume found.', 'info');
        }
    } catch (error) {
        console.error('Error loading resume data:', error);
        showToast('Error loading resume data: ' + error.message, 'error');
    }
}

// Handle PDF file upload and extraction
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('⚠️ Please upload a PDF file.', 'warning');
        return;
    }

    // Create FormData and send to backend
    const formData = new FormData();
    formData.append('pdf', file);

    try {
        const response = await fetch('/upload-pdf', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to extract PDF data');
        }

        const data = await response.json();
        
        // Auto-fill personal information from extracted data
        if (data.name) document.getElementById('fullName').value = data.name;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.location) document.getElementById('location').value = data.location;
        if (data.linkedin) document.getElementById('linkedin').value = data.linkedin;
        if (data.github) document.getElementById('github').value = data.github;
        if (data.portfolio) document.getElementById('portfolio').value = data.portfolio;
        if (data.summary) document.getElementById('summary').value = data.summary;

        showToast('✅ PDF extracted successfully! Form fields populated.', 'success');
        
        // Reset the file input so same file can be selected again
        document.getElementById('pdfUpload').value = '';
        saveFormData();
    } catch (error) {
        console.error('Error uploading PDF:', error);
        showToast('❌ Error extracting PDF. Please ensure it\'s a valid resume PDF.', 'error');
        document.getElementById('pdfUpload').value = '';
    }
}


function clearAllFields() {
    if (!confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
        return;
    }

    document.getElementById('resumeForm').reset();

    document.getElementById('skillsContainer').innerHTML = `
        <div class="entry-item">
            <input type="text" placeholder="Skill Category (e.g., Languages)" class="form-input skill-category">
            <input type="text" placeholder="Skills (comma-separated)" class="form-input skill-items">
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeSkill(this)">✕ Remove</button>
            </div>
        </div>
    `;

    document.getElementById('experienceContainer').innerHTML = `
        <div class="entry-item">
            <input type="text" placeholder="Company Name" class="form-input exp-company">
            <input type="text" placeholder="Job Title" class="form-input exp-title">
            <div class="form-grid-2">
                <input type="text" placeholder="Location" class="form-input exp-location">
                <input type="text" placeholder="Start Date (e.g., Jan 2020)" class="form-input exp-start">
                <input type="text" placeholder="End Date (e.g., Dec 2021)" class="form-input exp-end">
            </div>
            <textarea placeholder="Responsibilities & Achievements (one per line)" class="form-textarea exp-description" rows="3"></textarea>
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeExperience(this)">✕ Remove</button>
            </div>
        </div>
    `;

    document.getElementById('educationContainer').innerHTML = `
        <div class="entry-item">
            <input type="text" placeholder="Degree (e.g., Bachelor of Technology)" class="form-input edu-degree">
            <input type="text" placeholder="University/Institution" class="form-input edu-university">
            <div class="form-grid-2">
                <input type="text" placeholder="Graduation Year (e.g., 2023)" class="form-input edu-year">
                <input type="text" placeholder="CGPA/GPA" class="form-input edu-cgpa">
            </div>
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeEducation(this)">✕ Remove</button>
            </div>
        </div>
    `;

    document.getElementById('projectsContainer').innerHTML = `
        <div class="entry-item">
            <input type="text" placeholder="Project Title" class="form-input proj-title">
            <textarea placeholder="Project Description" class="form-textarea proj-description" rows="3"></textarea>
            <input type="text" placeholder="Tech Stack (comma-separated)" class="form-input proj-tech">
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeProject(this)">✕ Remove</button>
            </div>
        </div>
    `;

    document.getElementById('certificationsContainer').innerHTML = `
        <div class="entry-item">
            <input type="text" placeholder="Certification/Workshop Name" class="form-input cert-name">
            <input type="text" placeholder="Issuing Organization" class="form-input cert-org">
            <input type="text" placeholder="Date (e.g., Jan 2023)" class="form-input cert-date">
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeCertification(this)">✕ Remove</button>
            </div>
        </div>
    `;

    document.getElementById('resumePreview').innerHTML = '';
    document.getElementById('downloadBtn').classList.add('hidden');
    localStorage.removeItem('resumeFormData');
}

// ============================================
// Dynamic Form Management
// ============================================

function addSkill() {
    const container = document.getElementById('skillsContainer');
    const lastEntry = container.querySelector('.entry-item:last-child');
    if (lastEntry) {
        const category = lastEntry.querySelector('.skill-category')?.value.trim();
        const items = lastEntry.querySelector('.skill-items')?.value.trim();
        if (!category || !items) {
            showToast('⚠️ Please fill in the current skill entry before adding another.', 'warning');
            return;
        }
    }

    const skillItem = document.createElement('div');
    skillItem.className = 'entry-item';
    skillItem.innerHTML = `
        <input type="text" placeholder="Skill Category (e.g., Languages)" class="form-input skill-category">
        <input type="text" placeholder="Skills (comma-separated)" class="form-input skill-items">
        <div class="button-container">
            <button type="button" class="btn-remove" onclick="removeSkill(this)" title="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
    container.appendChild(skillItem);
}

function removeSkill(button) {
    const entry = button.closest('.entry-item');
    if (entry) entry.remove();
}

function addExperience() {
    const container = document.getElementById('experienceContainer');
    const lastEntry = container.querySelector('.entry-item:last-child');
    if (lastEntry) {
        const company = lastEntry.querySelector('.exp-company')?.value.trim();
        const title = lastEntry.querySelector('.exp-title')?.value.trim();
        const startDate = lastEntry.querySelector('.exp-start')?.value.trim();
        if (!company || !title || !startDate) {
            showToast('⚠️ Please complete the current experience entry before adding another.', 'warning');
            return;
        }
    }

    const expItem = document.createElement('div');
    expItem.className = 'entry-item';
    expItem.innerHTML = `
        <input type="text" placeholder="Company Name" class="form-input exp-company">
        <input type="text" placeholder="Job Title" class="form-input exp-title">
        <div class="form-grid-2">
            <input type="text" placeholder="Location" class="form-input exp-location">
            <input type="text" placeholder="Start Date (e.g., Jan 2020)" class="form-input exp-start">
            <input type="text" placeholder="End Date (e.g., Dec 2021)" class="form-input exp-end">
        </div>
        <textarea placeholder="Responsibilities & Achievements (one per line)" class="form-textarea exp-description" rows="3"></textarea>
        <div class="button-container">
            <button type="button" class="btn-remove" onclick="removeExperience(this)" title="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
    container.appendChild(expItem);
}

function removeExperience(button) {
    const entry = button.closest('.entry-item');
    if (entry) entry.remove();
}

function addEducation() {
    const container = document.getElementById('educationContainer');
    const lastEntry = container.querySelector('.entry-item:last-child');
    if (lastEntry) {
        const degree = lastEntry.querySelector('.edu-degree')?.value.trim();
        const university = lastEntry.querySelector('.edu-university')?.value.trim();
        const year = lastEntry.querySelector('.edu-year')?.value.trim();
        if (!degree || !university || !year) {
            showToast('⚠️ Please complete the current education entry before adding another.', 'warning');
            return;
        }
    }

    const eduItem = document.createElement('div');
    eduItem.className = 'entry-item';
    eduItem.innerHTML = `
        <input type="text" placeholder="Degree (e.g., Bachelor of Technology)" class="form-input edu-degree">
        <input type="text" placeholder="University/Institution" class="form-input edu-university">
        <div class="form-grid-2">
            <input type="text" placeholder="Graduation Year (e.g., 2023)" class="form-input edu-year">
            <input type="text" placeholder="CGPA/GPA" class="form-input edu-cgpa">
        </div>
        <div class="button-container">
            <button type="button" class="btn-remove" onclick="removeEducation(this)" title="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
    container.appendChild(eduItem);
}

function removeEducation(button) {
    const entry = button.closest('.entry-item');
    if (entry) entry.remove();
}

function addProject() {
    const container = document.getElementById('projectsContainer');
    const lastEntry = container.querySelector('.entry-item:last-child');
    if (lastEntry) {
        const title = lastEntry.querySelector('.proj-title')?.value.trim();
        const description = lastEntry.querySelector('.proj-description')?.value.trim();
        if (!title || !description) {
            showToast('⚠️ Please complete the current project entry before adding another.', 'warning');
            return;
        }
    }

    const projItem = document.createElement('div');
    projItem.className = 'entry-item';
    projItem.innerHTML = `
        <input type="text" placeholder="Project Title" class="form-input proj-title">
        <textarea placeholder="Project Description" class="form-textarea proj-description" rows="3"></textarea>
        <input type="text" placeholder="Tech Stack (comma-separated)" class="form-input proj-tech">
        <div class="button-container">
            <button type="button" class="btn-remove" onclick="removeProject(this)" title="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
    container.appendChild(projItem);
}

function removeProject(button) {
    const entry = button.closest('.entry-item');
    if (entry) entry.remove();
}

function addCertification() {
    const container = document.getElementById('certificationsContainer');
    const lastEntry = container.querySelector('.entry-item:last-child');
    if (lastEntry) {
        const name = lastEntry.querySelector('.cert-name')?.value.trim();
        const organization = lastEntry.querySelector('.cert-org')?.value.trim();
        if (!name || !organization) {
            showToast('⚠️ Please complete the current certification entry before adding another.', 'warning');
            return;
        }
    }

    const certItem = document.createElement('div');
    certItem.className = 'entry-item';
    certItem.innerHTML = `
        <input type="text" placeholder="Certification/Workshop Name" class="form-input cert-name">
        <input type="text" placeholder="Issuing Organization" class="form-input cert-org">
        <div class="form-grid-2">
            <input type="text" placeholder="Date (e.g., Jan 2023)" class="form-input cert-date">
            <input type="url" placeholder="Certification Link (optional)" class="form-input cert-link">
        </div>
        <div class="button-container">
            <button type="button" class="btn-remove" onclick="removeCertification(this)" title="Remove">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
    container.appendChild(certItem);
}

function removeCertification(button) {
    const entry = button.closest('.entry-item');
    if (entry) entry.remove();
}

// ============================================
// Form Submission & Resume Generation
// ============================================

document.getElementById('resumeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    generateResume();
});

function collectFormData() {
    const data = {
        personal: {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            linkedin: document.getElementById('linkedin').value,
            github: document.getElementById('github').value,
            portfolio: document.getElementById('portfolio').value
        },
        summary: document.getElementById('summary').value,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: []
    };

    // Collect skills
    document.querySelectorAll('#skillsContainer .entry-item').forEach(item => {
        const category = item.querySelector('.skill-category').value;
        const items = item.querySelector('.skill-items').value;
        if (category && items) {
            data.skills.push({ category, items });
        }
    });

    // Collect experience
    document.querySelectorAll('#experienceContainer .entry-item').forEach(item => {
        const exp = {
            company: item.querySelector('.exp-company').value,
            title: item.querySelector('.exp-title').value,
            location: item.querySelector('.exp-location').value,
            startDate: item.querySelector('.exp-start').value,
            endDate: item.querySelector('.exp-end').value,
            description: item.querySelector('.exp-description').value
        };
        if (exp.company || exp.title) {
            data.experience.push(exp);
        }
    });

    // Collect education
    document.querySelectorAll('#educationContainer .entry-item').forEach(item => {
        const edu = {
            degree: item.querySelector('.edu-degree')?.value || '',
            university: item.querySelector('.edu-university')?.value || '',
            year: item.querySelector('.edu-year')?.value || '',
            cgpa: item.querySelector('.edu-cgpa')?.value || ''
        };
        if (edu.degree || edu.university) {
            data.education.push(edu);
        }
    });

    // Collect projects
    document.querySelectorAll('#projectsContainer .entry-item').forEach(item => {
        const proj = {
            title: item.querySelector('.proj-title').value,
            description: item.querySelector('.proj-description').value,
            techStack: item.querySelector('.proj-tech').value
        };
        if (proj.title) {
            data.projects.push(proj);
        }
    });

    // Collect certifications
    document.querySelectorAll('#certificationsContainer .entry-item').forEach(item => {
        const cert = {
            name: item.querySelector('.cert-name')?.value || '',
            organization: item.querySelector('.cert-org')?.value || '',
            date: item.querySelector('.cert-date')?.value || '',
            link: item.querySelector('.cert-link')?.value || ''
        };
        if (cert.name) {
            data.certifications.push(cert);
        }
    });

    return data;
}

function generateResume() {
    const data = collectFormData();

    if (!data.personal.fullName || !data.personal.email) {
        showToast('Please fill in at least Name and Email!', 'error');
        return;
    }

    const resumeHTML = renderResumeTemplate(data);
    document.getElementById('resumePreview').innerHTML = resumeHTML;

    // Store data globally for PDF export
    window.resumeData = data;

    // Show download button
    document.getElementById('downloadBtn').classList.remove('hidden');
    
    // Scroll to preview section
    document.querySelector('.preview-section').scrollIntoView({ behavior: 'smooth' });
}

function renderResumeTemplate(data) {
    const { personal, summary, skills, experience, education, projects, certifications } = data;

    // Colors matching PDF
    const colors = {
        primary: '#1B3C53',
        secondary: '#234C6A',
        accent: '#456882',
        text: '#323232',
        lightText: '#646464',
        white: '#FFFFFF'
    };

    let html = `<div style="font-family: Arial, sans-serif; color: ${colors.text}; line-height: 1.5;">`;

    // Header Section (Matching PDF: Dark background, white text)
    html += `<div style="background-color: ${colors.primary}; color: ${colors.white}; padding: 20px; text-align: center; margin-bottom: 20px; border-radius: 5px 5px 0 0;">
        <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">${escapeHtml(personal.fullName || 'Your Name')}</div>`;

    // Contact Information
    let contactParts = [];
    if (personal.email) contactParts.push(escapeHtml(personal.email));
    if (personal.phone) contactParts.push(escapeHtml(personal.phone));
    if (personal.location) contactParts.push(escapeHtml(personal.location));
    
    if (contactParts.length > 0) {
        html += `<div style="font-size: 14px; margin-bottom: 8px;">${contactParts.join(' | ')}</div>`;
    }

    // Links
    let linkParts = [];
    if (personal.linkedin) linkParts.push(`LinkedIn: ${escapeHtml(personal.linkedin)}`);
    if (personal.github) linkParts.push(`GitHub: ${escapeHtml(personal.github)}`);
    if (personal.portfolio) linkParts.push(`Portfolio: ${escapeHtml(personal.portfolio)}`);

    if (linkParts.length > 0) {
        html += `<div style="font-size: 12px;">${linkParts.join(' | ')}</div>`;
    }
    
    html += `</div>`; // End Header

    // Helper for Section Title
    const sectionTitle = (title) => `
        <div style="margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid ${colors.accent}; padding-bottom: 5px;">
            <span style="font-size: 16px; font-weight: bold; color: ${colors.secondary}; text-transform: uppercase;">${title}</span>
        </div>`;

    // Professional Summary
    if (summary) {
        html += sectionTitle('Professional Summary');
        html += `<div style="font-size: 14px; margin-bottom: 15px;">${escapeHtml(summary)}</div>`;
    }

    // Skills
    if (skills && skills.length > 0) {
        html += sectionTitle('Skills');
        skills.forEach(skill => {
            if (skill.category && skill.items) {
                html += `<div style="margin-bottom: 5px; font-size: 14px;">
                    <span style="font-weight: bold; color: ${colors.secondary};">${escapeHtml(skill.category)}:</span> 
                    <span>${escapeHtml(skill.items)}</span>
                </div>`;
            }
        });
    }

    // Experience
    if (experience && experience.length > 0) {
        html += sectionTitle('Experience');
        experience.forEach(exp => {
            html += `<div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div style="font-size: 15px; font-weight: bold; color: ${colors.primary};">${escapeHtml(exp.title)}</div>
                    <div style="font-size: 13px; font-style: italic; color: ${colors.lightText};">${escapeHtml(exp.startDate)} - ${escapeHtml(exp.endDate)}</div>
                </div>
                <div style="font-size: 14px; font-weight: bold; color: ${colors.secondary}; margin-bottom: 5px;">
                    ${escapeHtml(exp.company)} | ${escapeHtml(exp.location)}
                </div>`;
            
            if (exp.description) {
                html += `<div style="font-size: 13px; white-space: pre-line;">${escapeHtml(exp.description)}</div>`;
            }
            html += `</div>`;
        });
    }

    // Education
    if (education && education.length > 0) {
        html += sectionTitle('Education');
        education.forEach(edu => {
            html += `<div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div style="font-size: 15px; font-weight: bold; color: ${colors.primary};">${escapeHtml(edu.degree)}</div>
                    <div style="font-size: 13px; font-style: italic; color: ${colors.lightText};">${escapeHtml(edu.year)}</div>
                </div>
                <div style="font-size: 14px; color: ${colors.secondary};">${escapeHtml(edu.university)}</div>
                ${edu.cgpa ? `<div style="font-size: 13px; font-style: italic;">CGPA/GPA: ${escapeHtml(edu.cgpa)}</div>` : ''}
            </div>`;
        });
    }

    // Projects
    if (projects && projects.length > 0) {
        html += sectionTitle('Projects');
        projects.forEach(proj => {
            html += `<div style="margin-bottom: 15px;">
                <div style="font-size: 15px; font-weight: bold; color: ${colors.primary}; margin-bottom: 2px;">${escapeHtml(proj.title)}</div>
                ${proj.techStack ? `<div style="font-size: 13px; font-style: italic; color: ${colors.accent}; margin-bottom: 4px;">Tech Stack: ${escapeHtml(proj.techStack)}</div>` : ''}
                ${proj.description ? `<div style="font-size: 13px;">${escapeHtml(proj.description)}</div>` : ''}
            </div>`;
        });
    }

    // Certifications
    if (certifications && certifications.length > 0) {
        html += sectionTitle('Certifications');
        certifications.forEach(cert => {
            const certNameDisplay = cert.link ? `<a href="${cert.link}" style="color: ${colors.primary}; text-decoration: underline; cursor: pointer;">${escapeHtml(cert.name)}</a>` : `<span style="color: ${colors.primary};">${escapeHtml(cert.name)}</span>`;
            html += `<div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div style="font-size: 14px; font-weight: bold;">${certNameDisplay}</div>
                    <div style="font-size: 13px; font-style: italic; color: ${colors.lightText};">${escapeHtml(cert.date)}</div>
                </div>
                <div style="font-size: 13px; color: ${colors.secondary};">${escapeHtml(cert.organization)}</div>
            </div>`;
        });
    }

    html += `</div>`; // End Main Container
    return html;
}

function escapeHtml(text) {
    const value = text == null ? '' : String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return value.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// Modal Management
// ============================================

function closeModal() {
    const modal = document.getElementById('resumeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('resumeModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
};

// ============================================
// PDF Export (using Python FPDF backend)
// ============================================

function downloadPDF() {
    const data = collectFormData();
    const btn = document.getElementById('downloadBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '⏳ Generating PDF...';
    btn.disabled = true;

    fetch('/generate-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(async response => {
        if (response.headers.get('content-type')?.includes('application/json')) {
            const err = await response.json();
            throw new Error(err.error || 'Server error');
        }
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
    })
    .then(blob => {
        if (blob.size === 0) {
            throw new Error('Generated PDF is empty');
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const safeName = (data.personal?.fullName || 'Resume').trim() || 'Resume';
        a.download = `${safeName.replace(/\s+/g, '_')}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        btn.innerHTML = originalContent;
        btn.disabled = false;
    })
    .catch(error => {
        console.error('Error:', error);
        showToast(error.message || 'Failed to generate PDF. Please try again.', 'error');
        btn.innerHTML = originalContent;
        btn.disabled = false;
    });
}

// ============================================
// Form Validation & Local Storage
// ============================================

// Save form data to localStorage periodically
function saveFormData() {
    const data = collectFormData();
    // Attach ownership to the data
    const storageData = {
        owner: window.currentUserEmail,
        content: data
    };
    localStorage.setItem('resumeFormData', JSON.stringify(storageData));
    saveToCloud(data);
}

let saveTimeout;
function saveToCloud(data) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        fetch('/api/save-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (response.ok) {
                console.log('Saved to cloud');
            }
        }).catch(err => console.error('Error saving to cloud', err));
    }, 2000);
}

// Load form data from localStorage
function loadFormData() {
    // Check if we have server-side data injected into the page
    // This is the most reliable source for the logged-in user
    if (window.serverResumeData && Object.keys(window.serverResumeData).length > 0) {
        console.log('Loading data from server...');
        populateFormData(window.serverResumeData);
        // Update local storage to match server data
        const storageData = {
            owner: window.currentUserEmail,
            content: window.serverResumeData
        };
        localStorage.setItem('resumeFormData', JSON.stringify(storageData));
        return;
    }

    // Fallback to local storage if no server data
    const saved = localStorage.getItem('resumeFormData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            
            // Check if the saved data belongs to the current user
            // Handle both old format (direct data) and new format (wrapped with owner)
            let dataToLoad = null;

            if (parsed.owner && parsed.content) {
                // New format
                if (parsed.owner === window.currentUserEmail) {
                    dataToLoad = parsed.content;
                } else {
                    console.log('Ignoring local storage data from different user:', parsed.owner);
                    localStorage.removeItem('resumeFormData'); // Clear mismatching data
                }
            } else {
                // Old format (no owner) - risky, but we can try to infer or just clear it
                console.log('Clearing legacy local storage data without owner info');
                localStorage.removeItem('resumeFormData');
            }

            if (dataToLoad) {
                populateFormData(dataToLoad);
                showToast('Restored unsaved changes from local storage', 'info');
            }
        } catch (e) {
            console.error('Error parsing local storage:', e);
            localStorage.removeItem('resumeFormData');
        }
    }
}

function populateFormData(data) {
    // Personal info
    document.getElementById('fullName').value = data.personal?.fullName || '';
    document.getElementById('email').value = data.personal?.email || '';
    document.getElementById('phone').value = data.personal?.phone || '';
    document.getElementById('location').value = data.personal?.location || '';
    document.getElementById('linkedin').value = data.personal?.linkedin || '';
    document.getElementById('github').value = data.personal?.github || '';
    document.getElementById('portfolio').value = data.personal?.portfolio || '';
    document.getElementById('summary').value = data.summary || '';

    // Skills
    const skillContainer = document.getElementById('skillsContainer');
    skillContainer.innerHTML = '';
    if (Array.isArray(data.skills) && data.skills.length > 0) {
        data.skills.forEach(skill => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <input type="text" placeholder="Skill Category (e.g., Languages)" class="form-input skill-category" value="${escapeHtml(skill.category || '')}">
                <input type="text" placeholder="Skills (comma-separated)" class="form-input skill-items" value="${escapeHtml(skill.items || '')}">
                <div class="button-container">
                    <button type="button" class="remove-btn" onclick="removeSkill(this)">✕ Remove</button>
                </div>
            `;
            skillContainer.appendChild(item);
        });
    } else {
        skillContainer.innerHTML = `
            <div class="entry-item">
                <input type="text" placeholder="Skill Category (e.g., Languages)" class="form-input skill-category">
                <input type="text" placeholder="Skills (comma-separated)" class="form-input skill-items">
                <div class="button-container">
                    <button type="button" class="remove-btn" onclick="removeSkill(this)">✕ Remove</button>
                </div>
            </div>
        `;
    }

    // Experience
    const expContainer = document.getElementById('experienceContainer');
    expContainer.innerHTML = '';
    if (Array.isArray(data.experience) && data.experience.length > 0) {
        data.experience.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <input type="text" placeholder="Company Name" class="form-input exp-company" value="${escapeHtml(exp.company || '')}">
                <input type="text" placeholder="Job Title" class="form-input exp-title" value="${escapeHtml(exp.title || '')}">
                <div class="form-grid-2">
                    <input type="text" placeholder="Location" class="form-input exp-location" value="${escapeHtml(exp.location || '')}">
                    <input type="text" placeholder="Start Date (e.g., Jan 2020)" class="form-input exp-start" value="${escapeHtml(exp.startDate || '')}">
                    <input type="text" placeholder="End Date (e.g., Dec 2021)" class="form-input exp-end" value="${escapeHtml(exp.endDate || '')}">
                </div>
                <textarea placeholder="Responsibilities & Achievements (one per line)" class="form-textarea exp-description" rows="3">${escapeHtml(exp.description || '')}</textarea>
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeExperience(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            expContainer.appendChild(item);
        });
    } else {
        expContainer.innerHTML = `
            <div class="entry-item">
                <input type="text" placeholder="Company Name" class="form-input exp-company">
                <input type="text" placeholder="Job Title" class="form-input exp-title">
                <div class="form-grid-2">
                    <input type="text" placeholder="Location" class="form-input exp-location">
                    <input type="text" placeholder="Start Date (e.g., Jan 2020)" class="form-input exp-start">
                    <input type="text" placeholder="End Date (e.g., Dec 2021)" class="form-input exp-end">
                </div>
                <textarea placeholder="Responsibilities & Achievements (one per line)" class="form-textarea exp-description" rows="3"></textarea>
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeExperience(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `;
    }

    // Education
    const eduContainer = document.getElementById('educationContainer');
    eduContainer.innerHTML = '';
    if (Array.isArray(data.education) && data.education.length > 0) {
        data.education.forEach(edu => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <input type="text" placeholder="Degree (e.g., Bachelor of Technology)" class="form-input edu-degree" value="${escapeHtml(edu.degree || '')}">
                <input type="text" placeholder="University/Institution" class="form-input edu-university" value="${escapeHtml(edu.university || '')}">
                <div class="form-grid-2">
                    <input type="text" placeholder="Graduation Year (e.g., 2023)" class="form-input edu-year" value="${escapeHtml(edu.year || '')}">
                    <input type="text" placeholder="CGPA/GPA" class="form-input edu-cgpa" value="${escapeHtml(edu.cgpa || '')}">
                </div>
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeEducation(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            eduContainer.appendChild(item);
        });
    } else {
        eduContainer.innerHTML = `
            <div class="entry-item">
                <input type="text" placeholder="Degree (e.g., Bachelor of Technology)" class="form-input edu-degree">
                <input type="text" placeholder="University/Institution" class="form-input edu-university">
                <div class="form-grid-2">
                    <input type="text" placeholder="Graduation Year (e.g., 2023)" class="form-input edu-year">
                    <input type="text" placeholder="CGPA/GPA" class="form-input edu-cgpa">
                </div>
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeEducation(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `;
    }

    // Projects
    const projContainer = document.getElementById('projectsContainer');
    projContainer.innerHTML = '';
    if (Array.isArray(data.projects) && data.projects.length > 0) {
        data.projects.forEach(proj => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <input type="text" placeholder="Project Title" class="form-input proj-title" value="${escapeHtml(proj.title || '')}">
                <textarea placeholder="Project Description" class="form-textarea proj-description" rows="3">${escapeHtml(proj.description || '')}</textarea>
                <input type="text" placeholder="Tech Stack (comma-separated)" class="form-input proj-tech" value="${escapeHtml(proj.techStack || '')}">
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeProject(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            projContainer.appendChild(item);
        });
    } else {
        projContainer.innerHTML = `
            <div class="entry-item">
                <input type="text" placeholder="Project Title" class="form-input proj-title">
                <textarea placeholder="Project Description" class="form-textarea proj-description" rows="3"></textarea>
                <input type="text" placeholder="Tech Stack (comma-separated)" class="form-input proj-tech">
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeProject(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `;
    }

    // Certifications
    const certContainer = document.getElementById('certificationsContainer');
    certContainer.innerHTML = '';
    if (Array.isArray(data.certifications) && data.certifications.length > 0) {
        data.certifications.forEach(cert => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <div class="form-grid-2">
                    <input type="text" placeholder="Certification/Workshop Name" class="form-input cert-name" value="${escapeHtml(cert.name || '')}">
                    <input type="text" placeholder="Issuing Organization" class="form-input cert-org" value="${escapeHtml(cert.organization || '')}">
                </div>
                <div class="form-grid-2">
                    <input type="text" placeholder="Date (e.g., Jan 2023)" class="form-input cert-date" value="${escapeHtml(cert.date || '')}">
                    <input type="url" placeholder="Certification Link (optional)" class="form-input cert-link" value="${escapeHtml(cert.link || '')}">
                </div>
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeCertification(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            certContainer.appendChild(item);
        });
    } else {
        certContainer.innerHTML = `
            <div class="entry-item">
                <div class="form-grid-2">
                    <input type="text" placeholder="Certification/Workshop Name" class="form-input cert-name">
                    <input type="text" placeholder="Issuing Organization" class="form-input cert-org">
                </div>
                <div class="form-grid-2">
                    <input type="text" placeholder="Date (e.g., Jan 2023)" class="form-input cert-date">
                    <input type="url" placeholder="Certification Link (optional)" class="form-input cert-link">
                </div>
                <div class="button-container">
                    <button type="button" class="btn-remove" onclick="removeCertification(this)" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `;
    }
}

// Load form data on page load
document.addEventListener('DOMContentLoaded', loadFormData);

// Save form data periodically
setInterval(saveFormData, 10000); // Every 10 seconds

// Save on form input
document.getElementById('resumeForm').addEventListener('input', saveFormData);

// ============================================
// Job Description Analysis
// ============================================

function handleJDUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('jdFileName').textContent = file.name;
    }
}

async function analyzeJD() {
    const jdText = document.getElementById('jdText').value;
    const jdFile = document.getElementById('jdPdfUpload').files[0];
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (!jdText && !jdFile) {
        showToast(' Please provide a Job Description (Text or PDF).', 'warning');
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';

    const formData = new FormData();
    if (jdText) formData.append('jd_text', jdText);
    if (jdFile) formData.append('jd_file', jdFile);

    try {
        const response = await fetch('/analyze-jd', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }

        displayJDSuggestions(data);
        showToast(' Analysis complete!', 'success');

    } catch (error) {
        console.error('Error analyzing JD:', error);
        showToast(' Error: ' + error.message, 'error');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze & Suggest';
    }
}

function displayJDSuggestions(data) {
    const resultsDiv = document.getElementById('jdResults');
    resultsDiv.style.display = 'block';

    // Summary
    document.getElementById('suggestedSummary').value = data.summary || 'No summary generated.';

    // Experience
    document.getElementById('suggestedExperience').value = data.experience || 'Not specified.';

    // Store job details for cover letter
    document.getElementById('extractedJobTitle').value = data.job_title || '';
    document.getElementById('extractedCompanyName').value = data.company_name || '';

    // Show cover letter section
    const coverLetterSection = document.getElementById('coverLetterSection');
    coverLetterSection.style.display = 'block';

    // Pre-fill recruiter email if found
    if (data.recruiter_email) {
        document.getElementById('recruiterEmail').value = data.recruiter_email;
    }

    // Skills
    const skillsContainer = document.getElementById('suggestedSkills');
    skillsContainer.innerHTML = '';
    if (data.skills && Array.isArray(data.skills)) {
        data.skills.forEach(skill => {
            const badge = document.createElement('span');
            badge.className = 'skill-badge';
            badge.style.cssText = 'background: #e0e7ff; color: #4f46e5; padding: 4px 8px; border-radius: 4px; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 4px; margin-right: 5px; margin-bottom: 5px;';
            badge.innerHTML = `
                ${skill}
                <button onclick="appendSuggestedSkill('${skill.replace(/'/g, "\\'")}')" style="border: none; background: none; cursor: pointer; color: #4f46e5; font-weight: bold;" title="Add to Skills">+</button>
            `;
            skillsContainer.appendChild(badge);
        });
    }
}

function applySummary() {
    const summary = document.getElementById('suggestedSummary').value;
    if (summary) {
        document.getElementById('summary').value = summary;
        showToast('Summary updated!', 'success');
        saveFormData();
    }
}

function appendSuggestedSkill(skill) {
    // Try to find the first skill input field
    const skillsInput = document.querySelector('.skill-items');
    
    if (!skillsInput) {
        showToast('Please add a skill section first.', 'warning');
        return;
    }

    const currentSkills = skillsInput.value;
    
    // Simple duplicate check
    if (currentSkills.toLowerCase().includes(skill.toLowerCase())) {
        showToast('Skill already exists in the first category!', 'info');
        return;
    }

    if (currentSkills) {
        skillsInput.value = currentSkills + ', ' + skill;
    } else {
        skillsInput.value = skill;
    }
    showToast('Added "' + skill + '"', 'success');
    saveFormData();
}

// ============================================
// Cover Letter Generation
// ============================================

async function generateCoverLetter() {
    const btn = document.getElementById('generateCoverLetterBtn');
    const originalText = btn.textContent;
    
    // Collect user data from form
    const userName = document.getElementById('fullName').value;
    const userEmail = document.getElementById('email').value;
    const userPhone = document.getElementById('phone').value;
    const userSummary = document.getElementById('summary').value;
    
    // Collect skills
    let userSkills = [];
    document.querySelectorAll('#skillsContainer .entry-item').forEach(item => {
        const items = item.querySelector('.skill-items')?.value;
        if (items) userSkills.push(items);
    });
    
    // Collect experience highlights
    let userExperience = [];
    document.querySelectorAll('#experienceContainer .entry-item').forEach(item => {
        const title = item.querySelector('.exp-title')?.value;
        const company = item.querySelector('.exp-company')?.value;
        if (title && company) userExperience.push(`${title} at ${company}`);
    });

    // Get job details from JD analysis
    const jobTitle = document.getElementById('extractedJobTitle').value || 'the position';
    const companyName = document.getElementById('extractedCompanyName').value || 'your company';
    const jdSummary = document.getElementById('suggestedSummary').value;

    if (!userName) {
        showToast('Please fill in your name in Personal Information first.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
        const response = await fetch('/generate-cover-letter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                job_title: jobTitle,
                company_name: companyName,
                jd_summary: jdSummary,
                user_name: userName,
                user_email: userEmail,
                user_phone: userPhone,
                user_skills: userSkills.join(', '),
                user_experience: userExperience.join('; '),
                user_summary: userSummary
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate cover letter');
        }

        // Display the cover letter
        document.getElementById('emailSubject').value = data.subject;
        document.getElementById('coverLetterText').value = data.cover_letter;
        document.getElementById('coverLetterContent').style.display = 'block';
        
        showToast('Cover letter generated!', 'success');

    } catch (error) {
        console.error('Error generating cover letter:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function openMailto() {
    const recruiterEmail = document.getElementById('recruiterEmail').value;
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('coverLetterText').value;

    if (!recruiterEmail) {
        showToast('Please enter the recruiter email address.', 'warning');
        return;
    }

    // Create mailto link
    const mailtoLink = `mailto:${encodeURIComponent(recruiterEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open in new window/tab (will trigger email client)
    window.location.href = mailtoLink;
    
    showToast('Opening email client...', 'info');
}

function copyCoverLetter() {
    const coverLetter = document.getElementById('coverLetterText').value;
    
    if (!coverLetter) {
        showToast('No cover letter to copy.', 'warning');
        return;
    }

    navigator.clipboard.writeText(coverLetter).then(() => {
        showToast('Cover letter copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy. Please select and copy manually.', 'error');
    });
}

