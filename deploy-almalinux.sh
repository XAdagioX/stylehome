#!/bin/bash
# Style Homes VPS Deployment Script for AlmaLinux/RHEL/CentOS
# Run this script on the VPS server as 'deploy' user
# Usage: bash deploy-almalinux.sh

set -e  # Exit on error

echo "=========================================="
echo "Style Homes VPS Deployment Script"
echo "AlmaLinux / RHEL / CentOS Edition"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or deploy user
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please run as 'deploy' user, not root${NC}"
    echo -e "${YELLOW}Use: su - deploy${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
sudo dnf update -y

echo -e "${GREEN}Step 2: Installing required packages...${NC}"

# Install EPEL repository (for additional packages)
sudo dnf install -y epel-release

# Install Java 17
sudo dnf install -y java-17-openjdk java-17-openjdk-devel

# Install Maven
sudo dnf install -y maven

# Install PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib

# Install Nginx
sudo dnf install -y nginx

# Install other tools
sudo dnf install -y git curl firewalld certbot python3-certbot-nginx

# Install Node.js 18 (via NodeSource)
echo -e "${GREEN}Installing Node.js 18...${NC}"
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verify installations
echo -e "${GREEN}Verifying installations...${NC}"
java -version
mvn -version
node -v
npm -v
psql --version
nginx -v

echo -e "${GREEN}Step 3: Initializing PostgreSQL...${NC}"
# Initialize PostgreSQL if not already done
if [ ! -f /var/lib/pgsql/data/PG_VERSION ]; then
    sudo postgresql-setup --initdb
fi

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Generate random password for database user
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE stylehomes;
CREATE USER stylehomes_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE stylehomes TO stylehomes_user;
ALTER DATABASE stylehomes OWNER TO stylehomes_user;
\q
EOF

# Configure PostgreSQL to allow password authentication
sudo sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo sed -i 's/peer/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo systemctl restart postgresql

echo -e "${YELLOW}Database password: $DB_PASSWORD${NC}"
echo -e "${YELLOW}Save this password! It will be needed for .env file${NC}"

echo -e "${GREEN}Step 4: Creating directories...${NC}"
sudo mkdir -p /var/www/stylehomes
sudo mkdir -p /opt/stylehomes
sudo chown -R $USER:$USER /var/www/stylehomes
sudo chown -R $USER:$USER /opt/stylehomes

echo -e "${GREEN}Step 5: Setting up project from repository...${NC}"
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
npm install
npm run build

echo -e "${GREEN}Copying frontend to /var/www/stylehomes...${NC}"
sudo cp -r dist/* /var/www/stylehomes/
sudo chown -R nginx:nginx /var/www/stylehomes
sudo chmod -R 755 /var/www/stylehomes

echo -e "${GREEN}Step 7: Building backend...${NC}"
cd backend
mvn clean package -DskipTests

echo -e "${GREEN}Copying backend JAR...${NC}"
sudo cp target/stylehome-backend-1.0.0.jar /opt/stylehomes/
sudo chown root:root /opt/stylehomes/stylehome-backend-1.0.0.jar

echo -e "${GREEN}Step 8: Creating .env file...${NC}"
cat > /tmp/stylehomes.env <<ENVFILE
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/stylehomes
SPRING_DATASOURCE_USERNAME=stylehomes_user
SPRING_DATASOURCE_PASSWORD=$DB_PASSWORD

# Email (UPDATE THESE!)
MAIL_HOST=smtp.mail.me.com
MAIL_PORT=587
MAIL_USERNAME=stylehomesusa@icloud.com
MAIL_PASSWORD=YOUR_APP_SPECIFIC_PASSWORD_HERE
MAIL_FROM=stylehomesusa@icloud.com
ADMIN_EMAIL=stylehomesusa@icloud.com

# CORS (UPDATE WITH YOUR DOMAIN!)
CORS_ORIGINS=https://stylehomesusa.com,https://www.stylehomesusa.com

# Server
PORT=8080
SPRING_PROFILES_ACTIVE=prod
ENVFILE

sudo mv /tmp/stylehomes.env /opt/stylehomes/.env
sudo chown root:root /opt/stylehomes/.env
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
User=root
Group=root
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
sudo tee /etc/nginx/conf.d/stylehomes.conf > /dev/null <<NGINXCONF
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
        proxy_pass http://127.0.0.1:8080;
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

# Remove default nginx config if exists
sudo rm -f /etc/nginx/conf.d/default.conf

echo -e "${GREEN}Step 11: Configuring SELinux for Nginx proxy...${NC}"
# Allow Nginx to connect to network (for proxy to backend)
sudo setsebool -P httpd_can_network_connect 1

echo -e "${GREEN}Step 12: Configuring firewall...${NC}"
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

echo -e "${GREEN}Step 13: Testing Nginx configuration...${NC}"
sudo nginx -t

echo -e "${GREEN}Step 14: Starting services...${NC}"
sudo systemctl start stylehomes
sudo systemctl start nginx
sudo systemctl enable nginx

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

# Test API
echo -e "${GREEN}Testing API...${NC}"
sleep 2
curl -s http://localhost:8080/api/consultations > /dev/null && echo -e "${GREEN}✓ API is responding${NC}" || echo -e "${YELLOW}⚠ API not responding yet (may need more time)${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment completed!"
echo "==========================================${NC}"
echo ""
echo -e "Server IP: $(hostname -I | awk '{print $1}')"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit /opt/stylehomes/.env and update email settings:"
echo "   sudo nano /opt/stylehomes/.env"
echo ""
echo "2. Update Nginx config with your domain name:"
echo "   sudo nano /etc/nginx/conf.d/stylehomes.conf"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "3. Get SSL certificate (after DNS is configured):"
echo "   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
echo "4. Check backend logs:"
echo "   sudo journalctl -u stylehomes -f"
echo ""
echo "5. Test the site:"
echo "   curl http://localhost"
echo "   Open in browser: http://$(hostname -I | awk '{print $1}')"
echo ""
echo -e "${YELLOW}Database password saved in: /opt/stylehomes/.env${NC}"
echo ""
