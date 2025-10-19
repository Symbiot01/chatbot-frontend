# DigitalOcean App Platform Deployment Guide

This guide will help you deploy your Next.js chatbot UI to DigitalOcean App Platform.

## Prerequisites

- DigitalOcean account
- GitHub/GitLab repository with your code
- Backend API deployed and accessible

## Pre-Deployment Setup

### 1. Environment Variables

Your app requires the following environment variables:

- `NEXT_PUBLIC_API_URL`: The URL of your backend API (e.g., `https://your-api.ondigitalocean.app`)

### 2. Backend API Requirements

Ensure your backend API:
- Is deployed and accessible via HTTPS
- Has CORS configured to allow your frontend domain
- Is running on the expected endpoints as defined in `src/lib/api-client.ts`

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Prepare for DigitalOcean App Platform deployment"
   git push origin main
   ```

2. **Verify your repository** contains:
   - `Dockerfile`
   - `next.config.ts` (with `output: 'standalone'`)
   - `.dockerignore`
   - All source code

### Step 2: Create App on DigitalOcean

1. **Go to DigitalOcean App Platform**:
   - Visit [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"

2. **Connect Repository**:
   - Choose "GitHub" or "GitLab"
   - Select your repository
   - Choose the branch (usually `main` or `master`)

3. **Configure App**:
   - **App Name**: `chatbot-ui` (or your preferred name)
   - **Type**: Web Service
   - **Source Directory**: `/` (root directory)
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3000`

### Step 3: Configure Environment Variables

In the App Platform dashboard:

1. Go to **Settings** → **App-Level Environment Variables**
2. Add the following variables:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend-api.com` | Your backend API URL |
   | `NODE_ENV` | `production` | Node environment |

### Step 4: Configure Resources

1. **Choose Plan**:
   - **Basic Plan**: $5/month (512MB RAM, 1 vCPU)
   - **Professional Plan**: $12/month (1GB RAM, 1 vCPU) - Recommended

2. **Scaling**:
   - **Min Instances**: 1
   - **Max Instances**: 3 (adjust based on traffic)

### Step 5: Deploy

1. **Review Configuration**:
   - Verify all settings are correct
   - Check environment variables

2. **Deploy**:
   - Click "Create Resources"
   - Wait for deployment (5-10 minutes)

3. **Monitor Deployment**:
   - Check the "Activity" tab for build logs
   - Verify the app is running in the "Runtime Logs"

## Post-Deployment

### 1. Verify Deployment

1. **Check App URL**:
   - Your app will be available at `https://your-app-name.ondigitalocean.app`
   - Test the main functionality

2. **Test API Connection**:
   - Verify the frontend can connect to your backend
   - Check browser console for any errors

### 2. Custom Domain (Optional)

1. **Add Domain**:
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**:
   - DigitalOcean automatically provides SSL certificates
   - No additional configuration needed

### 3. Monitoring and Logs

1. **View Logs**:
   - Go to **Runtime Logs** tab
   - Monitor application performance

2. **Metrics**:
   - Check **Metrics** tab for performance data
   - Monitor CPU, memory, and request metrics

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in the Activity tab
   - Verify all dependencies are in `package.json`
   - Ensure `next.config.ts` is properly configured

2. **Runtime Errors**:
   - Check runtime logs
   - Verify environment variables are set correctly
   - Ensure backend API is accessible

3. **API Connection Issues**:
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check CORS configuration on backend
   - Ensure backend is using HTTPS

### Debug Commands

```bash
# Test build locally
npm run build

# Test Docker build
npm run docker:build
npm run docker:run

# Check TypeScript
npm run type-check

# Fix linting issues
npm run lint:fix
```

## Performance Optimization

### 1. App Platform Settings

- **Enable CDN**: For static assets
- **Enable HTTP/2**: For better performance
- **Configure Caching**: For API responses

### 2. Next.js Optimizations

- **Image Optimization**: Configured in `next.config.ts`
- **Compression**: Enabled by default
- **Static Generation**: Where possible

## Security Considerations

1. **Environment Variables**:
   - Never commit sensitive data to repository
   - Use App Platform's environment variable system

2. **Headers**:
   - Security headers are configured in `next.config.ts`
   - X-Frame-Options, X-Content-Type-Options, etc.

3. **HTTPS**:
   - Automatically enabled by DigitalOcean
   - No additional configuration needed

## Scaling

### Automatic Scaling

- App Platform automatically scales based on traffic
- Configure min/max instances based on expected load

### Manual Scaling

1. Go to **Settings** → **App-Level Settings**
2. Adjust **Instance Count**
3. Save changes

## Cost Management

### Basic Plan ($5/month)
- 512MB RAM
- 1 vCPU
- 1GB storage
- 100GB bandwidth

### Professional Plan ($12/month)
- 1GB RAM
- 1 vCPU
- 1GB storage
- 100GB bandwidth
- Better performance

### Additional Costs
- Custom domains: Free
- SSL certificates: Free
- Additional bandwidth: $0.02/GB

## Maintenance

### Regular Tasks

1. **Monitor Performance**:
   - Check metrics regularly
   - Review logs for errors

2. **Update Dependencies**:
   - Keep packages updated
   - Test updates in staging first

3. **Backup**:
   - Code is backed up in Git
   - App Platform handles infrastructure backups

## Support

- **DigitalOcean Documentation**: [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- **Next.js Documentation**: [Next.js Deployment](https://nextjs.org/docs/deployment)
- **Community Support**: DigitalOcean Community Forums

## Example Configuration

Here's a complete example of your app configuration:

```yaml
# App Platform YAML (if using YAML config)
name: chatbot-ui
services:
- name: web
  source_dir: /
  github:
    repo: your-username/chatbot-ui
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: https://your-backend-api.com
  - key: NODE_ENV
    value: production
```

---

**Note**: This deployment guide assumes you have a working Next.js application with a backend API. Make sure your backend is deployed and accessible before deploying the frontend.
