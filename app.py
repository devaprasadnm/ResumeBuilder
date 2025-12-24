from flask import Flask, render_template, request, jsonify, make_response, session, redirect, url_for, flash
import os
import json
from functools import wraps
from fpdf import FPDF
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your_secret_key_here_change_this_in_production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("Warning: Supabase credentials not found. Auth and storage will not work.")

def get_supabase():
    """Get a Supabase client authenticated with the user's token if available."""
    token = session.get('access_token')
    if token and SUPABASE_URL and SUPABASE_KEY:
        return create_client(
            SUPABASE_URL, 
            SUPABASE_KEY, 
            options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
        )
    return supabase

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not supabase:
            flash("Supabase not configured.")
            return render_template('signup.html')

        try:
            response = supabase.auth.sign_up({"email": email, "password": password})
            if response.user:
                flash("Signup successful! Please check your email to confirm, or login if auto-confirmed.", "success")
                return redirect(url_for('login'))
            else:
                flash("Signup failed.", "error")
        except Exception as e:
            flash(str(e), "error")
            
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not supabase:
            flash("Supabase not configured.", "error")
            return render_template('login.html')

        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if response.user:
                session['user'] = response.user.id
                session['access_token'] = response.session.access_token
                session['email'] = response.user.email
                return redirect(url_for('index'))
        except Exception as e:
            flash(str(e), "error")
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    if supabase:
        try:
            supabase.auth.sign_out()
        except:
            pass
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    # Fetch user data from Supabase
    user_id = session.get('user')
    resume_data = {}
    db = get_supabase()
    
    if db and user_id:
        try:
            response = db.table('resumes').select('data').eq('user_id', user_id).execute()
            if response.data and len(response.data) > 0:
                resume_data = response.data[0]['data']
        except Exception as e:
            print(f"Error fetching resume: {e}")

    return render_template('index.html', resume_data=resume_data)

@app.route('/api/save-resume', methods=['POST'])
@login_required
def save_resume():
    user_id = session.get('user')
    data = request.json
    db = get_supabase()
    
    if not db or not user_id:
        return jsonify({'error': 'Database not connected'}), 500

    try:
        # Check if record exists
        existing = db.table('resumes').select('id').eq('user_id', user_id).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update
            db.table('resumes').update({'data': data, 'updated_at': 'now()'}).eq('user_id', user_id).execute()
        else:
            # Insert
            db.table('resumes').insert({'user_id': user_id, 'data': data}).execute()
            
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error saving resume: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/resume-data')
@login_required
def get_resume_data():
    # This endpoint might be redundant if we pass data in index(), but keeping for compatibility
    user_id = session.get('user')
    resume_data = {}
    db = get_supabase()
    if db and user_id:
        try:
            response = db.table('resumes').select('data').eq('user_id', user_id).execute()
            if response.data:
                resume_data = response.data[0]['data']
        except:
            pass
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

        # Do not use global state or file system for user data
        # Just return the extracted data to the frontend
        
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

def sanitize_text(text):
    if not text:
        return ""
    replacements = {
        '\u2013': '-',
        '\u2014': '--',
        '\u2018': "'",
        '\u2019': "'",
        '\u201c': '"',
        '\u201d': '"',
        '\u2022': '*',
        '\u2026': '...',
        '\u00a0': ' '
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    # Final safety net: encode to latin-1, replacing errors with '?'
    return text.encode('latin-1', 'replace').decode('latin-1')

def recursive_sanitize(obj):
    if isinstance(obj, dict):
        return {k: recursive_sanitize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [recursive_sanitize(i) for i in obj]
    elif isinstance(obj, str):
        return sanitize_text(obj)
    else:
        return obj

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
    try:
        data = request.json
        
        # Save data to database before generating PDF
        user_id = session.get('user')
        db = get_supabase()
        if db and user_id:
            try:
                # Check if record exists
                existing = db.table('resumes').select('id').eq('user_id', user_id).execute()
                
                if existing.data and len(existing.data) > 0:
                    # Update
                    db.table('resumes').update({'data': data, 'updated_at': 'now()'}).eq('user_id', user_id).execute()
                else:
                    # Insert
                    db.table('resumes').insert({'user_id': user_id, 'data': data}).execute()
            except Exception as e:
                print(f"Error saving resume during generation: {e}")

        # Sanitize data to prevent UnicodeEncodeError
        data = recursive_sanitize(data)
        
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
        pdf.set_x(10) # Ensure we start from left margin
        pdf.multi_cell(190, 6, ' | '.join(contact_info), align='C')
        
        links = []
        if p.get('linkedin'): links.append(f"LinkedIn: {p['linkedin']}")
        if p.get('github'): links.append(f"GitHub: {p['github']}")
        if p.get('portfolio'): links.append(f"Portfolio: {p['portfolio']}")
        
        if links:
            pdf.set_font('Arial', '', 9) # Slightly smaller font for links
            # Use multi_cell to wrap long lines of links
            pdf.set_x(10) # Ensure we start from left margin
            pdf.multi_cell(190, 6, ' | '.join(links), align='C')

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
                
                # Add clickable link if URL is provided
                cert_name = cert.get('name', '')
                cert_link = cert.get('link', '').strip()
                
                if cert_link and (cert_link.startswith('http://') or cert_link.startswith('https://')):
                    # Add as clickable link
                    pdf.cell(140, 5, cert_name, 0, 0, link=cert_link)
                else:
                    # Add as regular text
                    pdf.cell(140, 5, cert_name, 0, 0)
                
                pdf.set_font('Arial', 'I', 9)
                pdf.set_text_color(100, 100, 100)
                pdf.cell(0, 5, cert.get('date', ''), 0, 1, 'R')
                
                pdf.set_font('Arial', '', 9)
                pdf.set_text_color(*secondary_color)
                pdf.cell(0, 5, cert.get('organization', ''), 0, 1)
                pdf.ln(2)

        # Output PDF
        try:
            # Try fpdf2 style first (returns bytearray)
            pdf_content = pdf.output()
            if isinstance(pdf_content, str):
                # Fallback for older fpdf (returns string)
                pdf_content = pdf_content.encode('latin-1')
            elif isinstance(pdf_content, bytearray):
                pdf_content = bytes(pdf_content)
        except TypeError:
            # Fallback if arguments are required (older versions)
            pdf_content = pdf.output(dest='S').encode('latin-1')

        response = make_response(bytes(pdf_content))
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = 'attachment; filename=resume.pdf'
        return response

    except Exception as e:
        print(f"PDF Generation Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/preview', methods=['POST'])
@login_required
def preview():
    data = request.get_json()
    return jsonify(data)

@app.route('/resume')
@login_required
def resume():
    return render_template('resume.html')

@app.route('/analyze-jd', methods=['POST'])
@login_required
def analyze_jd():
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured'}), 500

    jd_text = request.form.get('jd_text')
    jd_file = request.files.get('jd_file')

    text_to_analyze = ""

    if jd_file and jd_file.filename.lower().endswith('.pdf'):
        if PdfReader is None:
            return jsonify({'error': 'PDF processing not available. Install PyPDF2.'}), 500
        try:
            pdf_reader = PdfReader(jd_file)
            for page in pdf_reader.pages:
                text_to_analyze += page.extract_text() + '\n'
        except Exception as e:
            return jsonify({'error': f'Error reading PDF: {str(e)}'}), 500
    elif jd_text:
        text_to_analyze = jd_text
    else:
        return jsonify({'error': 'No Job Description provided'}), 400

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        Analyze the following Job Description and extract the following information in JSON format:
        1. "summary": You are an expert resume strategist and career writer. Your task is to generate a concise, ATS-friendly professional summary tailored to the Job Description (JD) provided.
        2. "skills": A list of key technical and soft skills mentioned or required.
        3. "experience": The years of experience required (e.g., "3+ years", "5-7 years").
        4. "recruiter_email": Extract any recruiter or HR email address mentioned in the JD. If none found, return null.
        5. "company_name": The name of the company hiring.
        6. "job_title": The job title/position being advertised.

        Job Description:
        {text_to_analyze[:10000]} 
        """

        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        # Clean up markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return jsonify(json.loads(response_text))

    except Exception as e:
        return jsonify({'error': f'Gemini Error: {str(e)}'}), 500


@app.route('/generate-cover-letter', methods=['POST'])
@login_required
def generate_cover_letter():
    if not GEMINI_API_KEY:
        return jsonify({'error': 'Gemini API key not configured'}), 500

    data = request.json
    job_title = data.get('job_title', 'the position')
    company_name = data.get('company_name', 'your company')
    jd_summary = data.get('jd_summary', '')
    user_name = data.get('user_name', '')
    user_email = data.get('user_email', '')
    user_phone = data.get('user_phone', '')
    user_skills = data.get('user_skills', '')
    user_experience = data.get('user_experience', '')
    user_summary = data.get('user_summary', '')

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are a professional career coach and cover letter expert. Write a compelling, personalized cover letter for a job application.

        Job Details:
        - Position: {job_title}
        - Company: {company_name}
        - Job Requirements Summary: {jd_summary}

        Candidate Details:
        - Name: {user_name}
        - Email: {user_email}
        - Phone: {user_phone}
        - Key Skills: {user_skills}
        - Professional Summary: {user_summary}
        - Experience Highlights: {user_experience}

        Requirements:
        1. Write a professional, engaging cover letter (3-4 paragraphs)
        2. Highlight how the candidate's skills match the job requirements
        3. Show enthusiasm for the role and company
        4. Keep it concise but impactful
        5. Do NOT include placeholders like [Your Name] - use the actual provided details
        6. End with a professional closing

        Return ONLY the cover letter text, no additional formatting or explanations.
        """

        response = model.generate_content(prompt)
        cover_letter = response.text.strip()
        
        # Generate email subject
        subject = f"Application for {job_title} Position - {user_name}"
        
        return jsonify({
            'cover_letter': cover_letter,
            'subject': subject
        })

    except Exception as e:
        return jsonify({'error': f'Error generating cover letter: {str(e)}'}), 500

# This is already in your code at `/api/resume-data` endpoint
def fetch_resume_from_db(user_id):
    db = get_supabase()
    response = db.table('resumes').select('data').eq('user_id', user_id).execute()
    return response.data[0]['data'] if response.data else None


if __name__ == '__main__':
    app.run(debug=True)
