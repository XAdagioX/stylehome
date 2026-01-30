#!/bin/bash
# Style Homes VPS Deployment Script
# Run this script on the VPS server as 'deploy' user
# Usage: bash deploy-vps.sh

set -e  # Exit on error

echo "=========================================="
echo "Style Homes VPS Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or deploy user
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please run as 'deploy' user, not root${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${GREEN}Step 2: Installing required packages...${NC}"
sudo apt install -y \
    openjdk-17-jdk \
    maven \
    postgresql \
    postgresql-contrib \
    nginx \
    git \
    curl \
    ufw \
    certbot \
    python3-certbot-nginx

# Verify installations
echo -e "${GREEN}Verifying installations...${NC}"
java -version
mvn -version
psql --version
nginx -v

echo -e "${GREEN}Step 3: Setting up PostgreSQL...${NC}"
# Generate random password for database user
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE stylehomes;
CREATE USER stylehomes_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE stylehomes TO stylehomes_user;
\q
EOF

echo -e "${YELLOW}Database password: $DB_PASSWORD${NC}"
echo -e "${YELLOW}Save this password! It will be needed for .env file${NC}"

echo -e "${GREEN}Step 4: Creating directories...${NC}"
sudo mkdir -p /var/www/stylehomes
sudo mkdir -p /opt/stylehomes
sudo chown -R $USER:$USER /var/www/stylehomes
sudo chown -R $USER:$USER /opt/stylehomes

echo -e "${GREEN}Step 5: Cloning repository...${NC}"
cd /tmp
if [ -d "stylehome-wix-clone" ]; then
    echo "Repository exists, pulling latest changes..."
    cd stylehome-wix-clone
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/LargoScript/stylehome-wix-clone.git
    cd stylehome-wix-clone
fi

echo -e "${GREEN}Step 6: Building frontend...${NC}"
# Files are in repository root, not in stylehome_new/
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

npm install
npm run build

echo -e "${GREEN}Copying frontend to /var/www/stylehomes...${NC}"
sudo cp -r dist/* /var/www/stylehomes/
sudo chown -R www-data:www-data /var/www/stylehomes

echo -e "${GREEN}Step 7: Building backend...${NC}"
cd backend
mvn clean package -DskipTests

echo -e "${GREEN}Copying backend JAR...${NC}"
sudo cp target/stylehome-backend-1.0.0.jar /opt/stylehomes/
sudo chown www-data:www-data /opt/stylehomes/stylehome-backend-1.0.0.jar

echo -e "${GREEN}Step 8: Creating .env file...${NC}"
cat > /tmp/stylehomes.env <<ENVFILE
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/stylehomes
SPRING_DATASOURCE_USERNAME=stylehomes_user
SPRING_DATASOURCE_PASSWORD=$DB_PASSWORD

# Email (UPDATE THESE!)
MAIL_HOST=smtp.mail.me.com
MAIL_PORT=587
MAIL_USERNAME=chaikataras@icloud.com
MAIL_PASSWORD=YOUR_APP_SPECIFIC_PASSWORD_HERE
MAIL_FROM=chaikataras@icloud.com
ADMIN_EMAIL=chaikataras@icloud.com

# CORS (UPDATE WITH YOUR DOMAIN!)
CORS_ORIGINS=https://stylehomesusa.com,https://www.stylehomesusa.com

# Server
PORT=8080
SPRING_PROFILES_ACTIVE=prod
ENVFILE

sudo mv /tmp/stylehomes.env /opt/stylehomes/.env
sudo chown www-data:www-data /opt/stylehomes/.env
sudo chmod 600 /opt/stylehomes/.env

echo -e "${YELLOW}IMPORTANT: Edit /opt/stylehomes/.env and update:${NC}"
echo -e "${YELLOW}  - MAIL_PASSWORD (iCloud App-Specific Password)${NC}"
echo -e "${YELLOW}  - CORS_ORIGINS (your actual domain)${NC}"

echo -e "${GREEN}Step 9: Creating systemd service...${NC}"
sudo tee /etc/systemd/system/stylehomes.service > /dev/null <<SERVICEFILE
[Unit]
Description=Style Homes Backend
After=syslog.target network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/stylehomes
EnvironmentFile=/opt/stylehomes/.env
ExecStart=/usr/bin/java -jar /opt/stylehomes/stylehome-backend-1.0.0.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEFILE

sudo systemctl daemon-reload
sudo systemctl enable stylehomes

echo -e "${GREEN}Step 10: Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/stylehomes > /dev/null <<NGINXCONF
server {
    listen 80;
    server_name _;  # Replace with your domain: stylehomesusa.com www.stylehomesusa.com
    
    # Frontend (static files)
    root /var/www/stylehomes;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|svg|mp4|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # For file uploads (photos)
        client_max_body_size 50M;
    }
    
    # Clean URLs: /kitchen-renovation → kitchen-renovation.html, then SPA fallback
    location / {
        try_files \$uri \$uri.html \$uri/ /index.html;
    }
}
NGINXCONF

sudo ln -sf /etc/nginx/sites-available/stylehomes /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo -e "${GREEN}Step 11: Configuring firewall...${NC}"
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

echo -e "${GREEN}Step 12: Testing Nginx configuration...${NC}"
sudo nginx -t

echo -e "${GREEN}Step 13: Starting services...${NC}"
sudo systemctl start stylehomes
sudo systemctl reload nginx

echo -e "${GREEN}Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if sudo systemctl is-active --quiet stylehomes; then
    echo -e "${GREEN}✓ Backend service is running${NC}"
else
    echo -e "${RED}✗ Backend service failed to start${NC}"
    echo -e "${YELLOW}Check logs: sudo journalctl -u stylehomes -n 50${NC}"
fi

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx failed to start${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed!"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit /opt/stylehomes/.env and update email settings"
echo "2. Update Nginx config with your domain name"
echo "3. Get SSL certificate: sudo certbot --nginx -d yourdomain.com"
echo "4. Check backend logs: sudo journalctl -u stylehomes -f"
echo "5. Test API: curl http://localhost:8080/api/consultations"
echo ""
echo -e "${YELLOW}Database password saved in: /opt/stylehomes/.env${NC}"
echo ""
