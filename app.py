from flask import Flask, render_template, request, jsonify, make_response, session, redirect, url_for, flash
import os
import json
from functools import wraps
from fpdf import FPDF

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

app = Flask(__name__)
app.secret_key = 'your_secret_key_here_change_this_in_production' # Required for session
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Hardcoded credentials
ADMIN_EMAIL = "devaprasadmohan@gmail.com"
ADMIN_PASSWORD = "854719"

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Load resume data from PDF extraction
resume_data = {}
try:
    if os.path.exists('resume_data.json'):
        with open('resume_data.json', 'r') as f:
            resume_data = json.load(f)
except:
    pass

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password')
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return render_template('index.html', resume_data=resume_data)

@app.route('/api/resume-data')
@login_required
def get_resume_data():
    return jsonify(resume_data)

@app.route('/upload-pdf', methods=['POST'])
@login_required
def upload_pdf():
    """Handle PDF file upload and extract contact information"""
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    
    file = request.files['pdf']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'File must be a PDF'}), 400
    
    try:
        # Read PDF and extract text
        if PdfReader is None:
            return jsonify({'error': 'PDF processing not available. Install PyPDF2.'}), 500
        
        pdf_reader = PdfReader(file)
        text = ''
        
        # Extract text from all pages
        for page in pdf_reader.pages:
            text += page.extract_text() + '\n'
        
        # Parse the extracted text to find contact information
        extracted_data = parse_resume_text(text)

        # Cache the extracted data so it can be reused by the auto-fill endpoint
        global resume_data
        resume_data.update({key: value for key, value in extracted_data.items() if value})

        try:
            with open('resume_data.json', 'w', encoding='utf-8') as handle:
                json.dump(resume_data, handle, ensure_ascii=False, indent=2)
        except OSError as exc:  # Persisting is best effort
            app.logger.warning('Unable to persist resume data: %s', exc)

        return jsonify(extracted_data)
    
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500

def parse_resume_text(text):
    """Parse resume text and extract key information"""
    data = {
        'name': '',
        'email': '',
        'phone': '',
        'location': '',
        'linkedin': '',
        'github': '',
        'portfolio': '',
        'summary': ''
    }
    
    lines = text.split('\n')
    
    # Extract information from lines
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Email extraction
        if '@' in line and ('.' in line or 'gmail' in line.lower() or 'yahoo' in line.lower()):
            if not data['email']:
                data['email'] = line.split()[0] if ' ' in line else line
        
        # Phone extraction
        if ('+' in line or '-' in line) and any(c.isdigit() for c in line):
            if len(line) < 20 and any(c.isdigit() for c in line):
                if not data['phone']:
                    data['phone'] = line
        
        # LinkedIn extraction
        if 'linkedin' in line.lower():
            if not data['linkedin']:
                data['linkedin'] = line.strip()
        
        # GitHub extraction
        if 'github' in line.lower():
            if not data['github']:
                data['github'] = line.strip()
        
        # Portfolio extraction
        if 'portfolio' in line.lower() or 'website' in line.lower():
            if not data['portfolio']:
                data['portfolio'] = line.strip()
        
        # Try to extract name from first non-empty line if no name yet
        if not data['name'] and i < 5 and len(line) > 2 and len(line) < 100:
            if not any(c.isdigit() for c in line) and '@' not in line and '+' not in line:
                data['name'] = line
    
    return data

class PDF(FPDF):
    def header(self):
        pass  # We'll handle the header manually in the body to control data

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

    def section_title(self, title):
        self.ln(5)
        self.set_font('Arial', 'B', 14)
        self.set_text_color(35, 76, 106)  # Secondary Color
        self.cell(0, 10, title, 0, 1, 'L')
        self.set_draw_color(69, 104, 130)  # Accent Color
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(2)

    def chapter_body(self, body):
        self.set_font('Arial', '', 10)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 5, body)
        self.ln()

@app.route('/generate-pdf', methods=['POST'])
@login_required
def generate_pdf():
    data = request.json
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Colors
    primary_color = (27, 60, 83)
    secondary_color = (35, 76, 106)
    accent_color = (69, 104, 130)

    # Header Section
    pdf.set_fill_color(*primary_color)
    # Draw a larger rectangle to accommodate potential wrapping
    pdf.rect(0, 0, 210, 50, 'F')
    
    pdf.set_y(10)
    pdf.set_font('Arial', 'B', 24)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, data.get('personal', {}).get('fullName', 'Your Name'), 0, 1, 'C')
    
    pdf.set_font('Arial', '', 10)
    contact_info = []
    p = data.get('personal', {})
    if p.get('email'): contact_info.append(p['email'])
    if p.get('phone'): contact_info.append(p['phone'])
    if p.get('location'): contact_info.append(p['location'])
    
    # Use multi_cell for contact info to prevent truncation
    pdf.multi_cell(0, 6, ' | '.join(contact_info), 0, 'C')
    
    links = []
    if p.get('linkedin'): links.append(f"LinkedIn: {p['linkedin']}")
    if p.get('github'): links.append(f"GitHub: {p['github']}")
    if p.get('portfolio'): links.append(f"Portfolio: {p['portfolio']}")
    
    if links:
        pdf.set_font('Arial', '', 9) # Slightly smaller font for links
        # Use multi_cell to wrap long lines of links
        pdf.multi_cell(0, 6, ' | '.join(links), 0, 'C')

    # Reset Y to ensure content starts after the header background
    pdf.set_y(55)

    # Summary
    if data.get('summary'):
        pdf.section_title('Professional Summary')
        pdf.set_font('Arial', '', 10)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(0, 5, data['summary'])

    # Skills
    if data.get('skills'):
        pdf.section_title('Skills')
        for skill in data['skills']:
            if skill.get('category') and skill.get('items'):
                pdf.set_font('Arial', 'B', 10)
                pdf.set_text_color(*secondary_color)
                pdf.write(5, f"{skill['category']}: ")
                pdf.set_font('Arial', '', 10)
                pdf.set_text_color(0, 0, 0)
                pdf.write(5, skill['items'])
                pdf.ln(6)

    # Experience
    if data.get('experience'):
        pdf.section_title('Experience')
        for exp in data['experience']:
            pdf.set_font('Arial', 'B', 11)
            pdf.set_text_color(*primary_color)
            pdf.cell(130, 6, exp.get('title', ''), 0, 0)
            pdf.set_font('Arial', 'I', 10)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 6, f"{exp.get('startDate', '')} - {exp.get('endDate', '')}", 0, 1, 'R')
            
            pdf.set_font('Arial', 'B', 10)
            pdf.set_text_color(*secondary_color)
            pdf.cell(0, 5, f"{exp.get('company', '')} | {exp.get('location', '')}", 0, 1)
            
            if exp.get('description'):
                pdf.set_font('Arial', '', 10)
                pdf.set_text_color(50, 50, 50)
                pdf.multi_cell(0, 5, exp['description'])
            pdf.ln(3)

    # Education
    if data.get('education'):
        pdf.section_title('Education')
        for edu in data['education']:
            pdf.set_font('Arial', 'B', 11)
            pdf.set_text_color(*primary_color)
            pdf.cell(140, 6, edu.get('degree', ''), 0, 0)
            pdf.set_font('Arial', 'I', 10)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 6, edu.get('year', ''), 0, 1, 'R')
            
            pdf.set_font('Arial', '', 10)
            pdf.set_text_color(*secondary_color)
            pdf.cell(0, 5, edu.get('university', ''), 0, 1)
            if edu.get('cgpa'):
                pdf.set_font('Arial', 'I', 9)
                pdf.cell(0, 5, f"CGPA/GPA: {edu['cgpa']}", 0, 1)
            pdf.ln(2)

    # Projects
    if data.get('projects'):
        pdf.section_title('Projects')
        for proj in data['projects']:
            pdf.set_font('Arial', 'B', 11)
            pdf.set_text_color(*primary_color)
            pdf.cell(0, 6, proj.get('title', ''), 0, 1)
            
            if proj.get('techStack'):
                pdf.set_font('Arial', 'I', 9)
                pdf.set_text_color(*accent_color)
                pdf.cell(0, 5, f"Tech Stack: {proj['techStack']}", 0, 1)
            
            if proj.get('description'):
                pdf.set_font('Arial', '', 10)
                pdf.set_text_color(50, 50, 50)
                pdf.multi_cell(0, 5, proj['description'])
            pdf.ln(3)

    # Certifications
    if data.get('certifications'):
        pdf.section_title('Certifications')
        for cert in data['certifications']:
            pdf.set_font('Arial', 'B', 10)
            pdf.set_text_color(*primary_color)
            pdf.cell(140, 5, cert.get('name', ''), 0, 0)
            pdf.set_font('Arial', 'I', 9)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(0, 5, cert.get('date', ''), 0, 1, 'R')
            
            pdf.set_font('Arial', '', 9)
            pdf.set_text_color(*secondary_color)
            pdf.cell(0, 5, cert.get('organization', ''), 0, 1)
            pdf.ln(2)

    response = make_response(pdf.output(dest='S').encode('latin-1'))
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=resume.pdf'
    return response

@app.route('/preview', methods=['POST'])
@login_required
def preview():
    data = request.get_json()
    return jsonify(data)

@app.route('/resume')
@login_required
def resume():
    return render_template('resume.html')

if __name__ == '__main__':
    app.run(debug=True)
