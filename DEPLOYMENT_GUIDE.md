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
For a production deployment, rather than running a local PostgreSQL container, you should connect to a Google Cloud SQL instance over Private IP using VPC peering to avoid external bandwidth latency fees.

1. **Create a Cloud SQL Instance:** Create a PostgreSQL instance in the same region as your Compute Engine.
2. **Enable Private IP:** Under the "Connections" tab of the Cloud SQL instance, disable Public IP and enable Private IP. Select the default network (or your custom VPC network). Google Cloud will prompt you to set up Private Service Connect (VPC Peering).
3. **Configure the Instance:** Apply the database name (`truehuman`), username, and password.
4. **Update the Application Environment:** Update the `docker-compose.yml` backend service environment variables:
   ```yaml
   environment:
     - DB_HOST=<CLOUD_SQL_PRIVATE_IP>
     - DB_PORT=5432
     - DB_USER=<USERNAME>
     - DB_PASSWORD=<PASSWORD>
     - DB_NAME=truehuman
   ```
   *Make sure you remove the `depends_on: db` directive and the local `db` service definition when using Cloud SQL.*

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
