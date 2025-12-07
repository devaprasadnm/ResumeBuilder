# ⚙️ Configuration & Customization Guide

## Overview

This guide explains how to customize the Resume Builder application for your specific needs.

## Styling Customization

### Changing Color Scheme

Edit `static/css/style.css` to modify the color scheme:

```css
/* Find these sections and modify the colors */

/* Primary gradient (header, buttons) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Primary text color */
color: #667eea;

/* Text on dark backgrounds */
color: white;
```

### Common Color Changes

**Blue Theme (Current)**
```css
#667eea (Primary Blue)
#764ba2 (Secondary Purple)
```

**Green Theme**
```css
#1dd1a1 (Primary Green)
#0984e3 (Secondary Blue)
```

**Orange Theme**
```css
#ff9800 (Primary Orange)
#f44336 (Secondary Red)
```

### Modifying Fonts

Edit the font-family in `static/css/style.css`:

```css
body {
    font-family: 'Your Font Name', sans-serif;
}
```

Available web-safe fonts:
- 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana'
- 'Arial', 'Helvetica'
- 'Georgia', 'Times New Roman'

Or use Google Fonts by adding:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
```

## Form Customization

### Adding New Form Fields

1. **Add the input in `templates/index.html`**:
```html
<section class="form-section">
    <h2 class="section-title">
        <span class="icon">🎯</span> New Section
    </h2>
    <input type="text" id="newField" placeholder="Description" class="form-input">
</section>
```

2. **Update `static/js/script.js` to collect the data**:
```javascript
function collectFormData() {
    const data = {
        // ... existing data ...
        newField: document.getElementById('newField').value
    };
    return data;
}
```

3. **Update resume template in `renderResumeTemplate()` function**:
```javascript
if (data.newField) {
    html += `<div class="resume-section">
                <div class="resume-section-title">New Section</div>
                <div class="resume-section-content">
                    ${escapeHtml(data.newField)}
                </div>
            </div>`;
}
```

### Adding Dynamic Sections

To add a new dynamic section (like experience, projects):

1. **Create the container in HTML**:
```html
<div id="newContainer" class="dynamic-container">
    <div class="new-item">
        <input type="text" placeholder="Field 1" class="form-input new-field1">
        <input type="text" placeholder="Field 2" class="form-input new-field2">
        <button type="button" class="btn-remove" onclick="removeNewItem(this)">✕</button>
    </div>
</div>
<button type="button" class="btn-add-section" onclick="addNewItem()">+ Add Item</button>
```

2. **Add JavaScript functions**:
```javascript
function addNewItem() {
    const container = document.getElementById('newContainer');
    const item = document.createElement('div');
    item.className = 'new-item';
    item.innerHTML = `
        <input type="text" placeholder="Field 1" class="form-input new-field1">
        <input type="text" placeholder="Field 2" class="form-input new-field2">
        <button type="button" class="btn-remove" onclick="removeNewItem(this)">✕</button>
    `;
    container.appendChild(item);
}

function removeNewItem(button) {
    button.parentElement.remove();
}
```

## Resume Template Customization

### Changing Resume Section Order

Edit the `renderResumeTemplate()` function in `static/js/script.js` to reorder sections:

```javascript
// Current order: Summary → Skills → Experience → Education → Projects → Certifications
// You can rearrange these sections
```

### Modifying Resume Styling

Edit the `.resume-*` classes in `static/css/style.css`:

```css
.resume-section-title {
    font-size: 1.2rem;  /* Adjust size */
    color: #667eea;      /* Change color */
    text-transform: uppercase;  /* uppercase, lowercase, capitalize */
}
```

## Backend Customization

### Adding Server-Side Storage

Edit `app.py` to add database integration:

```python
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resumes.db'
db = SQLAlchemy(app)

# Define Resume model
class Resume(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON)

@app.route('/save', methods=['POST'])
def save_resume():
    data = request.get_json()
    resume = Resume(data=data)
    db.session.add(resume)
    db.session.commit()
    return jsonify({'success': True})
```

### Adding Authentication

Implement user login to track multiple resumes:

```python
from flask_login import LoginManager, UserMixin

login_manager = LoginManager(app)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    resumes = db.relationship('Resume', backref='user')
```

## Local Storage Management

### Clear All Saved Data

Add this to `templates/index.html`:

```html
<button onclick="clearAllData()" class="btn-secondary">
    Clear Saved Data
</button>
```

Add to `static/js/script.js`:

```javascript
function clearAllData() {
    if (confirm('Are you sure? This will clear all saved form data.')) {
        localStorage.removeItem('resumeFormData');
        document.getElementById('resumeForm').reset();
        alert('All data cleared!');
    }
}
```

### Export Saved Data

```javascript
function exportFormData() {
    const saved = localStorage.getItem('resumeFormData');
    const blob = new Blob([saved], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume_data.json';
    a.click();
}
```

## PDF Customization

### Changing PDF Margins

Edit the `performPDFDownload()` function in `static/js/script.js`:

```javascript
const opt = {
    margin: 10,        // Change to adjust margins (in mm)
    filename: fileName,
    // ... rest of options
};
```

### Using Different PDF Library

Replace `html2pdf.js` with `jsPDF`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

## Responsive Breakpoints

Modify in `static/css/style.css`:

```css
@media (max-width: 768px) {
    /* Tablet styles */
}

@media (max-width: 480px) {
    /* Mobile styles */
}
```

Change breakpoints to:
- `1024px` - Large tablets
- `640px` - Small mobile phones
- `320px` - Very small screens

## Performance Optimization

### Minify CSS and JavaScript

```bash
# Install minifiers
npm install -g minifier

# Minify files
minify static/css/style.css > static/css/style.min.css
minify static/js/script.js > static/js/script.min.js
```

### Enable Caching

Add to `app.py`:

```python
@app.after_request
def add_cache_headers(response):
    response.headers['Cache-Control'] = 'max-age=3600'
    return response
```

## Accessibility Improvements

### Add ARIA Labels

```html
<input 
    type="text" 
    id="fullName" 
    placeholder="Full Name"
    aria-label="Full Name"
    class="form-input" 
    required>
```

### Add Keyboard Navigation

```javascript
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        // Add focus management
    }
});
```

## Environment Variables

Create `.env` file:

```
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///resumes.db
```

Load in `app.py`:

```python
from dotenv import load_dotenv
import os

load_dotenv()
app.secret_key = os.getenv('SECRET_KEY')
```

## Deployment

### For Production

1. **Update `app.py`**:
```python
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=8000)
```

2. **Use Gunicorn**:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

3. **Use Docker**:
```dockerfile
FROM python:3.9
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```

---

## Need Help?

- Check the main README.md for general information
- Review the code comments in each file
- Test changes in development mode first
- Use browser developer tools (F12) to debug

---

**Happy Customizing! 🎨**
