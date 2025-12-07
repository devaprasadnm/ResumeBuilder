# 🌐 Deployment Guide

This guide covers deploying the Resume Builder application to various hosting platforms.

## Local Development

### Running Locally

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run Flask app
python app.py

# 3. Access at http://localhost:5000
```

### Development Server Configuration

Default settings in `app.py`:
- **Host**: localhost (127.0.0.1)
- **Port**: 5000
- **Debug Mode**: Enabled (auto-reload on code changes)

---

## Heroku Deployment

### Prerequisites

- Heroku account (heroku.com)
- Heroku CLI installed
- Git repository initialized

### Steps

1. **Create Procfile**:
```
web: gunicorn app:app
```

2. **Update requirements.txt** (add gunicorn):
```bash
pip install gunicorn
pip freeze > requirements.txt
```

3. **Create runtime.txt**:
```
python-3.11.0
```

4. **Deploy to Heroku**:
```bash
heroku login
heroku create your-app-name
git push heroku main
```

5. **View logs**:
```bash
heroku logs --tail
```

### Environment Variables on Heroku

```bash
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=your-secret-key
```

---

## PythonAnywhere Deployment

### Prerequisites

- PythonAnywhere account (pythonanywhere.com)

### Steps

1. **Upload files** via web interface or git

2. **Create virtual environment**:
   - Web app → Add a new web app
   - Choose "Python 3.X and Flask"

3. **Configure WSGI file**:
   ```python
   import sys
   path = '/home/yourusername/myapp'
   sys.path.append(path)
   from app import app as application
   ```

4. **Set working directory**:
   - Web app → Source code → Set to your app folder

5. **Reload web app**

---

## AWS EC2 Deployment

### Prerequisites

- AWS account with EC2 instance
- Ubuntu 20.04 or similar Linux

### Setup Steps

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Python and dependencies
sudo apt install python3 python3-pip python3-venv git -y

# 3. Clone repository
git clone https://github.com/yourusername/ResumeBuilder.git
cd ResumeBuilder

# 4. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 5. Install Python dependencies
pip install -r requirements.txt
pip install gunicorn

# 6. Test run
python app.py

# 7. Create systemd service file
sudo nano /etc/systemd/system/resumebuilder.service
```

### Systemd Service File

```ini
[Unit]
Description=Resume Builder Flask App
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/ResumeBuilder
Environment="PATH=/home/ubuntu/ResumeBuilder/venv/bin"
ExecStart=/home/ubuntu/ResumeBuilder/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service

```bash
sudo systemctl enable resumebuilder
sudo systemctl start resumebuilder
sudo systemctl status resumebuilder
```

### Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo systemctl restart nginx
```

---

## Docker Deployment

### Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

ENV FLASK_APP=app.py

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
docker build -t resumebuilder .

# Run container
docker run -p 5000:5000 resumebuilder

# Or with docker-compose
docker-compose up -d
```

---

## Railway Deployment

### Steps

1. **Connect GitHub repository** to Railway.app
2. **Add environment variables**:
   - `FLASK_ENV=production`
   - `PYTHONUNBUFFERED=1`
3. **Railway auto-detects Flask app**
4. **Configure build command**: `pip install -r requirements.txt`
5. **Configure start command**: `gunicorn app:app`

---

## Render Deployment

### Steps

1. **Connect GitHub repository**
2. **Create new Web Service**
3. **Configure**:
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app:app`
   - Python version: 3.11
4. **Deploy**

---

## DigitalOcean App Platform

### Steps

1. **Connect GitHub repository**
2. **Configure app spec**:

```yaml
apps:
- name: resumebuilder
  services:
  - name: web
    github:
      repo: your-username/ResumeBuilder
      branch: main
    build_command: pip install -r requirements.txt
    run_command: gunicorn app:app
    http_port: 5000
```

3. **Deploy from console**

---

## SSL/HTTPS Setup

### With Let's Encrypt (AWS/Linux)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Update Nginx Config

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Performance Optimization for Production

### 1. Enable Compression

Add to `app.py`:
```python
from flask_compress import Compress
Compress(app)
```

### 2. Use CDN for Static Files

Upload `static/` folder to CloudFront or similar CDN and update URLs.

### 3. Database Connection Pooling

If using database:
```python
from sqlalchemy.pool import QueuePool
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'poolclass': QueuePool,
    'pool_size': 10,
    'pool_recycle': 3600,
}
```

### 4. Add Monitoring

```bash
pip install sentry-sdk
```

```python
import sentry_sdk
sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=0.1
)
```

---

## Maintenance

### Regular Backups

```bash
# Backup database (if applicable)
pg_dump mydb > backup.sql

# Backup user data
tar -czf resumebuilder-backup.tar.gz /path/to/app
```

### Update Dependencies

```bash
# Check for updates
pip list --outdated

# Update specific package
pip install --upgrade flask

# Update all
pip install --upgrade -r requirements.txt
```

### Monitor Logs

```bash
# Real-time logs
journalctl -u resumebuilder -f

# Or with Docker
docker logs -f resumebuilder
```

---

## Troubleshooting Deployment

### Issue: "Module not found"
**Solution**: Ensure all requirements are installed on server

### Issue: "Permission denied"
**Solution**: Check file permissions with `chmod 755`

### Issue: "Connection refused"
**Solution**: Check firewall and security groups allow traffic

### Issue: "Out of memory"
**Solution**: Increase server resources or optimize code

---

## Recommended Stack for Production

- **Framework**: Flask with Gunicorn
- **Web Server**: Nginx
- **Database**: PostgreSQL (if needed)
- **Caching**: Redis
- **Monitoring**: Sentry or New Relic
- **CDN**: CloudFront or similar
- **Hosting**: AWS, Azure, or DigitalOcean

---

## Cost Estimates (Monthly)

- **Heroku**: $7+ (starter dyno)
- **AWS EC2**: $5-20+ (t3.micro to t3.small)
- **DigitalOcean**: $5+ (basic droplet)
- **PythonAnywhere**: $5+ (premium account)
- **Railway**: Pay-as-you-go (usually $0-10)

---

**Happy Deploying! 🚀**
