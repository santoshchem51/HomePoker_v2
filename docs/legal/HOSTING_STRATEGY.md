# Legal Documents Hosting Strategy for PokePot

**For:** Google Play Store Submission Requirements  
**Date:** August 17, 2025  
**Status:** Ready for Implementation

## Google Play Store Requirements

Google Play Store requires publicly accessible URLs for:
- ✅ **Privacy Policy** (mandatory)
- ✅ **Terms of Service** (recommended)

## Hosting Options

### Option 1: GitHub Pages (Recommended - Free)
**Advantages:**
- ✅ Free hosting
- ✅ Reliable (GitHub's infrastructure)
- ✅ Version control integration
- ✅ Easy to update via git commits
- ✅ Professional appearance

**Implementation:**
1. Create a `docs` branch or use `main` branch with GitHub Pages
2. Enable GitHub Pages in repository settings
3. Documents will be accessible at:
   - `https://[username].github.io/[repository]/legal/privacy-policy.html`
   - `https://[username].github.io/[repository]/legal/terms-of-service.html`

### Option 2: Static Site Hosting (Alternative)
**Services:** Netlify, Vercel, GitHub Pages
- Professional hosting platforms
- Easy deployment from git
- Custom domain support (optional)

### Option 3: Simple Web Hosting (Traditional)
**Services:** Any web hosting provider
- Upload HTML files to web server
- Point domain to hosted files
- More manual but fully controlled

## Implementation Plan

### Step 1: Convert Markdown to HTML
Convert the legal documents to HTML format for web hosting:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PokePot Privacy Policy</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
        }
        h1, h2, h3 { color: #333; }
        .effective-date { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <!-- Content from PRIVACY_POLICY.md -->
</body>
</html>
```

### Step 2: Set Up GitHub Pages
1. Go to repository Settings → Pages
2. Select source: Deploy from a branch
3. Choose branch: main
4. Choose folder: / (root) or /docs
5. Save settings

### Step 3: Upload HTML Files
Structure:
```
docs/
├── legal/
│   ├── privacy-policy.html
│   ├── terms-of-service.html
│   └── index.html (optional landing page)
```

### Step 4: Verify URLs
Test the publicly accessible URLs:
- Privacy Policy: `https://[username].github.io/[repo]/docs/legal/privacy-policy.html`
- Terms of Service: `https://[username].github.io/[repo]/docs/legal/terms-of-service.html`

## URL Format for Play Store

### Required URLs
You'll need to provide these URLs in the Google Play Console:

**Privacy Policy URL:**
`https://[your-github-username].github.io/HomePoker_v2/docs/legal/privacy-policy.html`

**Terms of Service URL (optional but recommended):**
`https://[your-github-username].github.io/HomePoker_v2/docs/legal/terms-of-service.html`

## Content Requirements

### Privacy Policy Must Include:
- ✅ Data collection practices
- ✅ Data usage and sharing
- ✅ User rights and controls
- ✅ Contact information
- ✅ Policy update procedures

### Terms of Service Must Include:
- ✅ Acceptable use policies
- ✅ User responsibilities
- ✅ Service limitations
- ✅ Liability disclaimers
- ✅ Dispute resolution

## Maintenance Plan

### Regular Updates
- Review legal documents quarterly
- Update when app features change
- Ensure compliance with new regulations
- Version control all changes through git

### Contact Information Updates
Before hosting, update placeholder contact information:
- [ ] Developer email address
- [ ] Support contact method
- [ ] Business name/entity
- [ ] Jurisdiction for legal disputes

## Implementation Checklist

### Pre-Hosting Tasks
- [ ] Replace placeholder contact information
- [ ] Review legal language for your jurisdiction
- [ ] Consider legal review (recommended for commercial apps)
- [ ] Convert Markdown to HTML format

### Hosting Setup
- [ ] Enable GitHub Pages for repository
- [ ] Upload HTML versions of legal documents
- [ ] Test URL accessibility
- [ ] Verify mobile-friendly display

### Play Store Integration
- [ ] Copy final URLs for Play Store submission
- [ ] Add URLs to Play Store Console
- [ ] Verify Google can access the URLs
- [ ] Test links from different devices/networks

## Alternative Quick Implementation

### Using GitHub's Markdown Rendering
GitHub automatically renders Markdown files as web pages:

**Direct Links (if repository is public):**
- Privacy Policy: `https://github.com/[username]/HomePoker_v2/blob/main/docs/legal/PRIVACY_POLICY.md`
- Terms of Service: `https://github.com/[username]/HomePoker_v2/blob/main/docs/legal/TERMS_OF_SERVICE.md`

**Pros:** No additional setup required
**Cons:** Less professional appearance, GitHub branding

## Contact Placeholder Updates Needed

Before hosting, update these placeholders in the legal documents:

```
[TO BE ADDED - Developer Email] → your-email@domain.com
[TO BE ADDED - Developer Name] → Your Name or Company Name
[TO BE SPECIFIED - Local Jurisdiction] → Your State/Country
```

## Ready for Implementation

All legal documents are created and ready for hosting. Choose your preferred hosting method and update the placeholder contact information to complete Phase 6.

**Estimated Time to Complete Hosting:** 30-60 minutes
**Cost:** Free (with GitHub Pages option)
**Maintenance:** Minimal (annual review recommended)