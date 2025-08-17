# GitHub Pages Setup Instructions for PokePot Legal Documents

## Current Status
✅ HTML versions of legal documents created:
- `privacy-policy.html` - Professional privacy policy
- `terms-of-service.html` - Complete terms of service
- `index.html` - Landing page for legal documents

## GitHub Pages Setup Steps

### Step 1: Enable GitHub Pages
1. Go to your repository: `https://github.com/santoshchem51/HomePoker_v2`
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **Deploy from a branch**
5. Choose branch: **main**
6. Choose folder: **/ (root)** or **/docs** (either works)
7. Click **Save**

### Step 2: Wait for Deployment
- GitHub will automatically build and deploy the site
- This usually takes 2-10 minutes
- You'll get a green checkmark when it's ready

### Step 3: Access Your Legal Documents
Once deployed, your legal documents will be available at:

**Base URL:** `https://santoshchem51.github.io/HomePoker_v2/docs/legal/`

**Specific URLs for Google Play Store:**
- **Privacy Policy:** `https://santoshchem51.github.io/HomePoker_v2/docs/legal/privacy-policy.html`
- **Terms of Service:** `https://santoshchem51.github.io/HomePoker_v2/docs/legal/terms-of-service.html`
- **Legal Index:** `https://santoshchem51.github.io/HomePoker_v2/docs/legal/index.html`

## Required Updates Before Going Live

### Update Contact Information
Before enabling GitHub Pages, you need to update these placeholders in both HTML files:

```html
<!-- In privacy-policy.html and terms-of-service.html -->
[TO BE ADDED - Developer Email] → your-email@domain.com
[TO BE ADDED - Developer Name] → Your Name or Company Name
[TO BE SPECIFIED - Local Jurisdiction] → Your State/Country
```

### Search and Replace Needed
1. **Developer Email**: Replace with your actual email
2. **Developer Name**: Replace with your name or company
3. **Legal Jurisdiction**: Specify your state/country for legal disputes

## Testing Your URLs

### Step 1: Test Accessibility
After GitHub Pages is live, test these URLs:
- Open each URL in different browsers
- Test on mobile devices
- Verify pages load properly

### Step 2: Google Play Store Validation
- Google Play Console will check if the URLs are accessible
- URLs must be publicly available (no authentication required)
- Pages should load quickly and be mobile-friendly

## Alternative Hosting Options

If you prefer not to use GitHub Pages:

### Option 1: Netlify (Free)
1. Create account at netlify.com
2. Connect your GitHub repository
3. Deploy the `docs/legal/` folder
4. Get your custom URL

### Option 2: Vercel (Free)
1. Create account at vercel.com
2. Connect your GitHub repository
3. Deploy automatically
4. Get your custom URL

### Option 3: Traditional Web Hosting
- Upload HTML files to any web hosting service
- Point your domain to the hosted files

## For Google Play Store Submission

### Required Information
When setting up your app in Google Play Console, you'll need:

1. **Privacy Policy URL** (required):
   `https://santoshchem51.github.io/HomePoker_v2/docs/legal/privacy-policy.html`

2. **Terms of Service URL** (optional but recommended):
   `https://santoshchem51.github.io/HomePoker_v2/docs/legal/terms-of-service.html`

### Data Safety Section
Use the information from `APP_PERMISSIONS.md` to fill out Google Play's Data Safety section:
- No data collected or shared
- All data stays on user device
- Minimal permissions (storage, optional microphone)

## Maintenance

### Regular Updates
- Review legal documents quarterly
- Update when app features change
- Ensure compliance with new regulations
- Version control all changes through git

### URL Stability
- Once you provide URLs to Google Play Store, keep them stable
- If you need to change URLs, update the Play Store listing
- Consider redirects if moving to a different hosting service

## Ready to Deploy Checklist

Before enabling GitHub Pages:
- [ ] Update contact information in HTML files
- [ ] Review legal language for your jurisdiction
- [ ] Test HTML files locally if possible
- [ ] Commit and push all changes
- [ ] Enable GitHub Pages in repository settings
- [ ] Wait for deployment to complete
- [ ] Test all URLs are accessible
- [ ] Copy final URLs for Google Play Store

**Estimated Setup Time:** 15-30 minutes
**Cost:** Free with GitHub Pages
**Maintenance:** Annual review recommended