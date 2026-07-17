# Deployment Guide for TrueHuman Platform

This guide outlines the precise steps required to deploy the TrueHuman platform (Spring Boot backend + React frontend + PostgreSQL database) onto a single Google Cloud Compute Engine instance.

## 1. Environment Setup

Begin by spinning up a clean Ubuntu Compute Engine image on GCP. SSH into your instance and run the following commands to install required dependencies.

```bash
# Update package list and upgrade system
sudo apt-get update && sudo apt-get upgrade -y

# Install Git
sudo apt-get install -y git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin
```

Clone your repository to the machine:
```bash
git clone <YOUR_REPO_URL> truehuman
cd truehuman
```

## 2. Docker Compose Configuration
The repository includes a root `docker-compose.yml` boilerplate that integrates:
- **db**: PostgreSQL 15 image.
- **backend**: Spring Boot application mapping to port 8080.
- **frontend**: React SPA served by NGINX mapping to port 80.

To launch the stack, simply execute:
```bash
docker compose up -d --build
```
This will start the local database, the Spring Boot application (which auto-applies Flyway migrations), and the React application.

## 3. Cloud SQL Connection via VPC Peering (Production)

This project connects **Compute Engine instance `truehuman-1`** to **Cloud SQL instance `charley-home-0510`** over a Private IP using VPC Peering. No public IP or Cloud SQL Auth Proxy is required.

### Steps to enable the connection:

1. **Enable Private IP on Cloud SQL `charley-home-0510`:**
   - In GCP Console → **SQL** → `charley-home-0510` → **Connections** tab.
   - Under **Private IP**, enable it and select the **default** VPC network.
   - GCP will set up Private Service Connect / VPC Peering automatically.
   - Note the **Private IP address** shown after saving (e.g., `10.x.x.x`).

2. **Ensure the Compute Engine `truehuman-1` is on the same VPC:**
   - GCP Console → **Compute Engine** → `truehuman-1` → **Network interfaces** should show `default` network.

3. **Create the `.env` file on `truehuman-1`:**
   SSH into the instance and create a `.env` file in the project root using the template:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Fill in the actual values:
   ```env
   DB_HOST=<CLOUD_SQL_PRIVATE_IP>   # e.g. 10.42.0.3
   DB_PORT=5432
   DB_USER=<YOUR_DB_USERNAME>
   DB_PASSWORD=<YOUR_DB_PASSWORD>
   DB_NAME=truehuman
   ```

4. **Start the stack:**
   ```bash
   docker compose up -d --build
   ```
   Docker Compose will read the `.env` file automatically and inject the values into the backend container.

> [!NOTE]
> The local `db` (PostgreSQL container) service has been removed from `docker-compose.yml`. The backend now connects exclusively to Cloud SQL `charley-home-0510` via its Private IP.

## 4. Firewall Rules
To expose the web application while maintaining internal security, configure the GCP Firewall to allow traffic only on ports 80 and 443. Run the following command from the Google Cloud Shell (or your local environment authenticated via `gcloud`):

```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
    --action allow \
    --direction ingress \
    --rules tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server

# Allow HTTPS traffic
gcloud compute firewall-rules create allow-https \
    --action allow \
    --direction ingress \
    --rules tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags https-server
```

Then, ensure your Compute Engine instance is tagged with `http-server` and `https-server` in the GCP Console under instance details (Network Tags).

Your deployment is now accessible from the external IP of the Compute Engine instance.

## 5. Cloudflare Full / Full (Strict) SSL Setup

To encrypt traffic between Cloudflare and your GCE instance using **Full / Full (Strict)** SSL, follow these steps:

### A. Generate Cloudflare Origin CA Certificate
1. Log in to your Cloudflare Dashboard and select your domain.
2. Navigate to **SSL/TLS** > **Origin Server**.
3. Click **Create Certificate**.
4. Keep the default settings:
   - **Generate private key and CSR with Cloudflare** (Private key type: RSA 2048).
   - **Hostnames**: Ensure your domain (e.g., `yourdomain.com`) and wildcard (e.g., `*.yourdomain.com`) are listed.
   - **Certificate Validity**: Select your preferred duration (e.g., 15 years is recommended).
5. Click **Create**.
6. Cloudflare will display the **Origin Certificate** and the **Private Key**:
   - Copy the **Origin Certificate** text and save it on your GCE instance under the project directory as `certs/origin.crt`.
   - Copy the **Private Key** text and save it on your GCE instance under the project directory as `certs/origin.key`.
   
> [!WARNING]
> Keep the private key secure and never commit the `certs/` folder or private keys to version control. The root `.gitignore` has been pre-configured to ignore these files.

### B. Place the Certificates on GCE
Before running your Docker container, ensure the directory structure exists on GCE:
```bash
# In the root of your truehuman repository on the GCE instance
mkdir -p certs
nano certs/origin.crt # Paste the Origin Certificate here and save
nano certs/origin.key # Paste the Private Key here and save
chmod 600 certs/origin.key # Restrict permissions on the private key
```

### C. Spin up the Containers
Run Docker Compose. It will automatically mount the certificates and Nginx will load them:
```bash
docker compose up -d --build
```

### D. Configure Cloudflare SSL/TLS Mode
1. In the Cloudflare Dashboard, go to **SSL/TLS** > **Overview**.
2. Change the SSL/TLS encryption mode to **Full (strict)**.
3. (Optional) Under **SSL/TLS** > **Edge Certificates**, enable **Always Use HTTPS** to automatically redirect HTTP requests to HTTPS on Cloudflare's edge servers.

## 6. GitHub Actions CI/CD (Auto Deployment on Merge)

To automatically deploy the application to your GCE instance whenever code is merged or pushed to the `main` branch, follow these steps:

### A. Generate SSH Key Pair on GCE
1. SSH into your GCE instance.
2. Generate a new SSH key pair:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions_deploy -N ""
   ```
3. Add the public key to the authorized keys on GCE:
   ```bash
   cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
4. Output the private key and copy it:
   ```bash
   cat ~/.ssh/github_actions_deploy
   ```
   *(Keep this private key content safe, you will paste it into GitHub Secrets)*

### B. Configure GitHub Repository Secrets
Go to your repository on GitHub, navigate to **Settings** > **Secrets and variables** > **Actions**, click **New repository secret** and add the following 3 secrets:
1. **`GCE_SSH_IP`**: The external IP address of your GCE instance (`34.44.246.125`).
2. **`GCE_SSH_USER`**: Your SSH username on GCE (`Charley`).
3. **`GCE_SSH_PRIVATE_KEY`**: The content of the private key (`github_actions_deploy`) you copied in Step A (including the begin/end lines).

### C. Trigger Automated Deployment
Whenever you push to the `main` branch or merge a Pull Request into `main`, the GitHub Actions workflow will automatically run, connect to GCE, pull the changes, and rebuild/restart your Docker Compose services.


