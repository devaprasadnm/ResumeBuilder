// ============================================
// Auto-Fill and Clear Functions
// ============================================
async function autofillFromPDF() {
    try {
        const response = await fetch('/api/resume-data');
        const data = await response.json();
        
        // Check if we have meaningful data from the API
        if (data.name && data.name !== 'N/A') {
            // Auto-fill personal information
            if (data.name) document.getElementById('fullName').value = data.name;
            if (data.email) document.getElementById('email').value = data.email;
            if (data.phone) document.getElementById('phone').value = data.phone;
            if (data.location) document.getElementById('location').value = data.location;
            if (data.linkedin) document.getElementById('linkedin').value = data.linkedin;
            if (data.github) document.getElementById('github').value = data.github;
            if (data.portfolio) document.getElementById('portfolio').value = data.portfolio;
            
            alert('✅ Resume data loaded! Please complete missing fields.');
            saveFormData();
        } else {
            // If no data or only template data, load sample data instead
            autoFillSampleData();
        }
    } catch (error) {
        console.error('Error loading resume data:', error);
        // Load sample data as fallback
        autoFillSampleData();
    }
}

// Handle PDF file upload and extraction
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('⚠️ Please upload a PDF file.');
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

        alert('✅ PDF extracted successfully! Form fields populated.');
        
        // Reset the file input so same file can be selected again
        document.getElementById('pdfUpload').value = '';
        saveFormData();
    } catch (error) {
        console.error('Error uploading PDF:', error);
        alert('❌ Error extracting PDF. Please ensure it\'s a valid resume PDF.');
        document.getElementById('pdfUpload').value = '';
    }
}

// Auto-fill with sample data from screenshots
function autoFillSampleData() {
    // Personal Information
    document.getElementById('fullName').value = 'Devaprasad N M';
    document.getElementById('email').value = 'devaprasadnm@gmail.com';
    document.getElementById('phone').value = '+91-9019956637';
    document.getElementById('location').value = 'Kannur, Kerala';
    document.getElementById('linkedin').value = 'https://www.linkedin.com/in/devaprasad-n-m/';
    document.getElementById('github').value = 'https://github.com/devaprasadnm';
    document.getElementById('portfolio').value = 'https://devaprasadnm.vercel.app/';
    
    // Professional Summary
    document.getElementById('summary').value = 'Backend Developer with 2+ years of experience in designing and optimizing Spring Boot microservices, REST APIs, and MySQL databases. Skilled in integrating backend systems with React/Angular frontends and implementing security best practices. Adept at Agile delivery, with proven success in improving system performance and scalability.';
    
    // Clear existing skills and add new ones
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';
    
    const skillsData = [
        { category: 'Programming Languages', items: 'Java, Python, JavaScript, HTML, CSS, C' },
        { category: 'Frameworks & Libraries', items: 'Spring Boot, React, Angular, Django' },
        { category: 'Databases', items: 'MySQL (optimization), MongoDB' },
        { category: 'Tools & IDEs', items: 'Git, Postman, IntelliJ, Eclipse, Maven' },
        { category: 'Backend Expertise', items: 'REST API design, Microservices architecture, Backend integration, JWT/OAuth2 Security' },
        { category: 'Development Practices', items: 'Agile (Scrum), Code review processes, Problem solving' }
    ];
    
    skillsData.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.className = 'entry-item';
        skillItem.innerHTML = `
            <input type="text" class="form-input skill-category" placeholder="Skill Category" value="${skill.category}">
            <input type="text" class="form-input skill-items" placeholder="Skills (comma-separated)" value="${skill.items}">
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeSkill(this)">✕ Remove</button>
            </div>
        `;
        skillsContainer.appendChild(skillItem);
    });
    
    // Clear and add experience
    const expContainer = document.getElementById('experienceContainer');
    expContainer.innerHTML = '';
    
    const experienceData = [
        {
            title: 'Developer',
            company: 'Tata Consultancy Services (TCS)',
            location: 'Kochi, India',
            startDate: 'Jan 2023',
            endDate: 'Present',
            description: 'Built and optimized Spring Boot microservices in Java for enterprise-grade systems, improving API response times by 25% and handling 10K+ daily API requests.\nDesigned and deployed secure REST APIs with JWT/OAuth2 authentication, reducing unauthorized access incidents by 30%.\nIntegrated backend services with React and Angular applications, ensuring seamless data flow and reducing frontend-backend defects by 20%.\nEnhanced MySQL database performance with query optimization and indexing, cutting query execution times by 40%.\nDelivered 100% of sprint commitments in Agile teams through active participation in sprint planning, daily stand-ups, and retrospectives.'
        },
        {
            title: 'Intern',
            company: 'Tata Consultancy Services (TCS)',
            location: 'Kochi, India',
            startDate: 'Jul 2022',
            endDate: 'Dec 2022',
            description: 'Developed backend modules in Java + Spring Boot, gaining hands-on experience in microservices architecture.\nBuilt and tested REST API endpoints for CRUD operations, improving data retrieval efficiency by 15%.\nAssisted in frontend integration with Angular, reducing API call failures by 10%.\nParticipated in code reviews, testing, and documentation, ensuring 95% defect-free delivery in assigned modules.'
        }
    ];
    
    experienceData.forEach(exp => {
        const expItem = document.createElement('div');
        expItem.className = 'entry-item';
        expItem.innerHTML = `
            <input type="text" class="form-input exp-company" placeholder="Company Name" value="${exp.company}">
            <input type="text" class="form-input exp-title" placeholder="Job Title" value="${exp.title}">
            <div class="form-grid-2">
                <input type="text" class="form-input exp-location" placeholder="Location" value="${exp.location}">
                <input type="text" class="form-input exp-start" placeholder="Start Date" value="${exp.startDate}">
                <input type="text" class="form-input exp-end" placeholder="End Date" value="${exp.endDate}">
            </div>
            <textarea class="form-textarea exp-description" placeholder="Responsibilities & Achievements">${exp.description}</textarea>
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeExperience(this)">✕ Remove</button>
            </div>
        `;
        expContainer.appendChild(expItem);
    });
    
    // Clear and add education
    const eduContainer = document.getElementById('educationContainer');
    eduContainer.innerHTML = '';
    
    const eduData = {
        degree: 'B.E. in Computer Science',
        university: 'Cochin University of Science and Technology (CUSAT)',
        year: '2019 – 2023',
        cgpa: '9.01/10'
    };
    
    const eduItem = document.createElement('div');
    eduItem.className = 'entry-item';
    eduItem.innerHTML = `
        <input type="text" class="form-input edu-degree" placeholder="Degree" value="${eduData.degree}">
        <input type="text" class="form-input edu-university" placeholder="University/Institution" value="${eduData.university}">
        <div class="form-grid-2">
            <input type="text" class="form-input edu-year" placeholder="Graduation Year" value="${eduData.year}">
            <input type="text" class="form-input edu-cgpa" placeholder="CGPA/GPA" value="${eduData.cgpa}">
        </div>
        <div class="button-container">
            <button type="button" class="remove-btn" onclick="removeEducation(this)">✕ Remove</button>
        </div>
    `;
    eduContainer.appendChild(eduItem);
    
    // Clear and add projects
    const projContainer = document.getElementById('projectsContainer');
    projContainer.innerHTML = '';
    
    const projectsData = [
        {
            title: 'Automatic Helmet Detection',
            description: 'Object detection model using YOLO + OpenCV for traffic safety.'
        },
        {
            title: 'Student Management System',
            description: 'Django-based web app deployed at ICREP, CUSAT.'
        },
        {
            title: 'Blood Bank Web App',
            description: 'Django + Bootstrap platform to manage emergency blood donor database.'
        }
    ];
    
    projectsData.forEach(proj => {
        const projItem = document.createElement('div');
        projItem.className = 'entry-item';
        projItem.innerHTML = `
            <input type="text" class="form-input proj-title" placeholder="Project Title" value="${proj.title}">
            <textarea class="form-textarea proj-description" placeholder="Project Description">${proj.description}</textarea>
            <input type="text" class="form-input proj-tech" placeholder="Tech Stack">
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeProject(this)">✕ Remove</button>
            </div>
        `;
        projContainer.appendChild(projItem);
    });
    
    // Clear and add certifications
    const certContainer = document.getElementById('certificationsContainer');
    certContainer.innerHTML = '';
    
    const certificationsData = [
        { name: 'Architecting with Google Compute Engine', org: 'Coursera' },
        { name: 'What is Data Science', org: 'IBM' },
        { name: 'Spoken Tutorial (Python)', org: 'IIT Bombay' },
        { name: 'Computer Vision Workshop', org: 'Shape AI (Microsoft & AWS)' }
    ];
    
    certificationsData.forEach(cert => {
        const certItem = document.createElement('div');
        certItem.className = 'entry-item';
        certItem.innerHTML = `
            <input type="text" class="form-input cert-name" placeholder="Certification Name" value="${cert.name}">
            <input type="text" class="form-input cert-org" placeholder="Organization" value="${cert.org}">
            <input type="text" class="form-input cert-date" placeholder="Date">
            <div class="button-container">
                <button type="button" class="remove-btn" onclick="removeCertification(this)">✕ Remove</button>
            </div>
        `;
        certContainer.appendChild(certItem);
    });
    
    saveFormData();
    alert('✅ Sample data loaded! You can now generate and download your resume.');
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
            alert('⚠️ Please fill in the current skill entry before adding another.');
            return;
        }
    }

    const skillItem = document.createElement('div');
    skillItem.className = 'entry-item';
    skillItem.innerHTML = `
        <input type="text" placeholder="Skill Category (e.g., Languages)" class="form-input skill-category">
        <input type="text" placeholder="Skills (comma-separated)" class="form-input skill-items">
        <div class="button-container">
            <button type="button" class="remove-btn" onclick="removeSkill(this)">✕ Remove</button>
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
            alert('⚠️ Please complete the current experience entry before adding another.');
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
            <button type="button" class="remove-btn" onclick="removeExperience(this)">✕ Remove</button>
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
            alert('⚠️ Please complete the current education entry before adding another.');
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
            <button type="button" class="remove-btn" onclick="removeEducation(this)">✕ Remove</button>
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
            alert('⚠️ Please complete the current project entry before adding another.');
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
            <button type="button" class="remove-btn" onclick="removeProject(this)">✕ Remove</button>
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
            alert('⚠️ Please complete the current certification entry before adding another.');
            return;
        }
    }

    const certItem = document.createElement('div');
    certItem.className = 'entry-item';
    certItem.innerHTML = `
        <input type="text" placeholder="Certification/Workshop Name" class="form-input cert-name">
        <input type="text" placeholder="Issuing Organization" class="form-input cert-org">
        <input type="text" placeholder="Date (e.g., Jan 2023)" class="form-input cert-date">
        <div class="button-container">
            <button type="button" class="remove-btn" onclick="removeCertification(this)">✕ Remove</button>
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
            degree: item.querySelector('.edu-degree').value,
            university: item.querySelector('.edu-university').value,
            year: item.querySelector('.edu-year').value,
            cgpa: item.querySelector('.edu-cgpa').value
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
            name: item.querySelector('.cert-name').value,
            organization: item.querySelector('.cert-org').value,
            date: item.querySelector('.cert-date').value
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
        alert('Please fill in at least Name and Email!');
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

    let html = ``;

    // Header with Name
    html += `<div style="text-align: center; margin-bottom: 15px;">
        <div style="font-size: 28px; font-weight: bold; color: #1B3C53; margin-bottom: 8px;">${escapeHtml(personal.fullName)}</div>
    </div>`;

    // Contact Information
    let contactParts = [];
    if (personal.email) contactParts.push(`<a href="mailto:${personal.email}" style="color: #234C6A; text-decoration: none;">${escapeHtml(personal.email)}</a>`);
    if (personal.phone) contactParts.push(escapeHtml(personal.phone));
    if (personal.location) contactParts.push(escapeHtml(personal.location));
    if (personal.linkedin) contactParts.push(`<a href="${personal.linkedin}" style="color: #234C6A; text-decoration: none;">LinkedIn</a>`);
    if (personal.github) contactParts.push(`<a href="${personal.github}" style="color: #234C6A; text-decoration: none;">GitHub</a>`);
    if (personal.portfolio) contactParts.push(`<a href="${personal.portfolio}" style="color: #234C6A; text-decoration: none;">Portfolio</a>`);

    if (contactParts.length > 0) {
        html += `<div style="text-align: center; font-size: 13px; margin-bottom: 15px; color: #234C6A;">
            ${contactParts.join(' • ')}
        </div>`;
    }

    // Professional Summary
    if (summary) {
        html += `<div style="margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold; color: #234C6A; margin-bottom: 6px;">Summary</div>
            <div style="font-size: 12px; line-height: 1.6; color: #1B3C53;">${escapeHtml(summary)}</div>
        </div>`;
    }

    // Professional Experience
    if (experience.length > 0) {
        html += `<div style="margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold; color: #234C6A; margin-bottom: 8px;">Professional Experience</div>`;
        experience.forEach(exp => {
            html += `<div style="margin-bottom: 10px;">
                <div style="font-weight: bold; color: #1B3C53;">${escapeHtml(exp.title)}</div>
                <div style="color: #234C6A; font-size: 12px;">${escapeHtml(exp.company)}${exp.location ? ' — ' + escapeHtml(exp.location) : ''}</div>
                <div style="color: rgba(27, 60, 83, 0.75); font-size: 11px; margin-bottom: 4px;">${escapeHtml(exp.startDate)}${exp.endDate ? ' - ' + escapeHtml(exp.endDate) : ''}</div>`;
            if (exp.description) {
                const points = exp.description.split('\n').filter(p => p.trim());
                html += `<ul style="margin: 4px 0; padding-left: 20px; font-size: 12px; color: #1B3C53;">`;
                points.forEach(point => {
                    html += `<li style="margin: 2px 0;">${escapeHtml(point.trim())}</li>`;
                });
                html += `</ul>`;
            }
            html += `</div>`;
        });
        html += `</div>`;
    }

    // Education
    if (education.length > 0) {
        html += `<div style="margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold; color: #234C6A; margin-bottom: 8px;">Education</div>`;
        education.forEach(edu => {
            html += `<div style="margin-bottom: 8px;">
                <div style="font-weight: bold; color: #1B3C53;">${escapeHtml(edu.degree)}${edu.university ? ' — ' + escapeHtml(edu.university) : ''}</div>
                <div style="color: rgba(27, 60, 83, 0.8); font-size: 12px;">${escapeHtml(edu.year)}${edu.cgpa ? ' | CGPA: ' + escapeHtml(edu.cgpa) : ''}</div>
            </div>`;
        });
        html += `</div>`;
    }

    // Technical Skills
    if (skills.length > 0) {
        html += `<div style="margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold; color: #234C6A; margin-bottom: 8px;">Technical Skills</div>`;
        skills.forEach(skill => {
            html += `<div style="margin-bottom: 6px; font-size: 12px; color: #1B3C53;">
                <strong style="color: #234C6A;">${escapeHtml(skill.category)}:</strong>
                <span style="color: #1B3C53;"> ${escapeHtml(skill.items)}</span>
            </div>`;
        });
        html += `</div>`;
    }

    // Projects
    if (projects.length > 0) {
        html += `<div style="margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold; color: #234C6A; margin-bottom: 8px;">Projects</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #1B3C53;">`;
        projects.forEach(proj => {
            let projText = escapeHtml(proj.title);
            if (proj.description) {
                projText += ' — ' + escapeHtml(proj.description);
            }
            html += `<li style="margin: 3px 0;">${projText}</li>`;
        });
        html += `</ul></div>`;
    }

    // Certifications
    if (certifications.length > 0) {
        html += `<div style="margin-bottom: 15px;">
            <div style="font-size: 14px; font-weight: bold; color: #234C6A; margin-bottom: 8px;">Certifications</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #1B3C53;">`;
        certifications.forEach(cert => {
            html += `<li style="margin: 3px 0;">${escapeHtml(cert.name)}${cert.organization ? ' — ' + escapeHtml(cert.organization) : ''}</li>`;
        });
        html += `</ul></div>`;
    }

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
    const originalText = btn.innerText;
    btn.innerText = '⏳ Generating PDF...';
    btn.disabled = true;

    fetch('/generate-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const safeName = (data.personal?.fullName || 'Resume').trim() || 'Resume';
        a.download = `${safeName.replace(/\s+/g, '_')}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        btn.innerText = originalText;
        btn.disabled = false;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to generate PDF. Please try again.');
        btn.innerText = originalText;
        btn.disabled = false;
    });
}

// ============================================
// Form Validation & Local Storage
// ============================================

// Save form data to localStorage periodically
function saveFormData() {
    const data = collectFormData();
    localStorage.setItem('resumeFormData', JSON.stringify(data));
}

// Load form data from localStorage
function loadFormData() {
    const saved = localStorage.getItem('resumeFormData');
    if (saved) {
        const data = JSON.parse(saved);
        populateFormData(data);
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
                    <button type="button" class="remove-btn" onclick="removeExperience(this)">✕ Remove</button>
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
                    <button type="button" class="remove-btn" onclick="removeExperience(this)">✕ Remove</button>
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
                    <button type="button" class="remove-btn" onclick="removeEducation(this)">✕ Remove</button>
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
                    <button type="button" class="remove-btn" onclick="removeEducation(this)">✕ Remove</button>
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
                    <button type="button" class="remove-btn" onclick="removeProject(this)">✕ Remove</button>
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
                    <button type="button" class="remove-btn" onclick="removeProject(this)">✕ Remove</button>
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
                <input type="text" placeholder="Certification/Workshop Name" class="form-input cert-name" value="${escapeHtml(cert.name || '')}">
                <input type="text" placeholder="Issuing Organization" class="form-input cert-org" value="${escapeHtml(cert.organization || '')}">
                <input type="text" placeholder="Date (e.g., Jan 2023)" class="form-input cert-date" value="${escapeHtml(cert.date || '')}">
                <div class="button-container">
                    <button type="button" class="remove-btn" onclick="removeCertification(this)">✕ Remove</button>
                </div>
            `;
            certContainer.appendChild(item);
        });
    } else {
        certContainer.innerHTML = `
            <div class="entry-item">
                <input type="text" placeholder="Certification/Workshop Name" class="form-input cert-name">
                <input type="text" placeholder="Issuing Organization" class="form-input cert-org">
                <input type="text" placeholder="Date (e.g., Jan 2023)" class="form-input cert-date">
                <div class="button-container">
                    <button type="button" class="remove-btn" onclick="removeCertification(this)">✕ Remove</button>
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
