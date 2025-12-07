import PyPDF2
import json

# Extract text from PDF
pdf_path = "Devaprasad_Resume_Updated.pdf"
text_data = {}

try:
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text = page.extract_text()
            
            # Extract key information
            lines = text.split('\n')
            
            # Parse resume content
            if page_num == 0:  # First page usually has contact info
                # Extract name (first line)
                if lines:
                    text_data['name'] = lines[0].strip() if lines[0].strip() else 'N/A'
                
                # Look for contact information
                for line in lines:
                    if '@' in line:
                        text_data['email'] = line.strip()
                    if 'linkedin' in line.lower():
                        text_data['linkedin'] = line.strip()
                    if 'github' in line.lower():
                        text_data['github'] = line.strip()
                    if '+' in line and any(c.isdigit() for c in line):
                        if 'phone' not in text_data:
                            text_data['phone'] = line.strip()
    
    # Save as JSON for easy access
    with open('resume_data.json', 'w') as f:
        json.dump(text_data, f, indent=2)
    
    print("PDF extraction complete!")
    print(json.dumps(text_data, indent=2))

except Exception as e:
    print(f"Error: {e}")
    print("PyPDF2 might not be installed. Using sample data instead.")
    
    # Create sample data
    sample_data = {
        "name": "Devaprasad N M",
        "phone": "+91-9019956637",
        "email": "devaprasadnm@gmail.com",
        "location": "Bangalore, India",
        "linkedin": "https://www.linkedin.com/in/devaprasad-n-m/",
        "github": "https://github.com/devaprasadnm",
        "portfolio": "https://devaprasadnm.vercel.app/"
    }
    
    with open('resume_data.json', 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    print(json.dumps(sample_data, indent=2))
