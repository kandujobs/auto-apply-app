# Supabase Custom Domain Setup for Kandu Jobs

## 🎯 **Goal**
Configure `auth.kandujobs.com` as the custom domain for Supabase Auth to replace the default `xipjxcktpzanmhfrkbrm.supabase.co` domain.

## 📋 **Prerequisites**
- Supabase project with Auth enabled
- Domain ownership of `kandujobs.com`
- Access to DNS management for your domain

## 🔧 **Step-by-Step Setup**

### **1. Supabase Dashboard Configuration**

#### **1.1 Navigate to Auth Settings**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**

#### **1.2 Configure Custom Domain**
1. Find the **"Custom Domains"** section
2. Click **"Add Custom Domain"**
3. Enter: `auth.kandujobs.com`
4. Save the configuration

#### **1.3 Update Site URL**
1. In the same settings page, find **"Site URL"**
2. Update to: `https://app.kandujobs.com`
3. Save changes

### **2. DNS Configuration**

#### **2.1 Add CNAME Record**
Add this CNAME record to your DNS provider:

```
Type: CNAME
Name: auth
Value: xipjxcktpzanmhfrkbrm.supabase.co
TTL: 3600 (or default)
```

#### **2.2 Verify DNS Propagation**
- Use tools like [whatsmydns.net](https://whatsmydns.net) to check propagation
- Wait 24-48 hours for full propagation

### **3. Environment Variables**

#### **3.1 Update Frontend Environment**
```bash
# .env.local or production environment
VITE_SUPABASE_URL=https://auth.kandujobs.com
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### **3.2 Update Backend Environment**
```bash
# .env or production environment
SUPABASE_URL=https://auth.kandujobs.com
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **4. Google OAuth Configuration**

#### **4.1 Update Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Update **Authorized redirect URIs**:
   - Add: `https://auth.kandujobs.com/auth/v1/callback`
   - Remove: `https://xipjxcktpzanmhfrkbrm.supabase.co/auth/v1/callback`

#### **4.2 Update Supabase OAuth Settings**
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Click on **Google** provider
3. Update **Redirect URL** to: `https://auth.kandujobs.com/auth/v1/callback`

### **5. Testing**

#### **5.1 Test Custom Domain**
```bash
# Test DNS resolution
nslookup auth.kandujobs.com

# Test HTTPS connection
curl -I https://auth.kandujobs.com
```

#### **5.2 Test OAuth Flow**
1. Clear browser cache and cookies
2. Try signing in with Google
3. Verify the OAuth popup shows `auth.kandujobs.com`
4. Verify successful redirect and authentication

## 🚨 **Important Notes**

### **SSL Certificate**
- Supabase automatically provisions SSL certificates for custom domains
- Ensure your DNS is properly configured before testing

### **Caching**
- Browser cache may need to be cleared
- CDN cache may take time to update

### **Fallback**
- Keep the original Supabase URL as fallback during transition
- Monitor for any authentication issues

## 🔍 **Troubleshooting**

### **Common Issues**

#### **DNS Not Propagated**
- Wait 24-48 hours
- Check with multiple DNS lookup tools
- Verify CNAME record is correct

#### **SSL Certificate Issues**
- Wait for Supabase to provision SSL
- Check if DNS is fully propagated
- Contact Supabase support if issues persist

#### **OAuth Redirect Errors**
- Verify Google Cloud Console redirect URIs
- Check Supabase OAuth provider settings
- Ensure no trailing slashes in URLs

### **Support Resources**
- [Supabase Custom Domains Documentation](https://supabase.com/docs/guides/auth/auth-custom-domains)
- [Supabase Discord Community](https://discord.supabase.com)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

## ✅ **Verification Checklist**

- [ ] Custom domain added in Supabase Dashboard
- [ ] DNS CNAME record configured
- [ ] Environment variables updated
- [ ] Google OAuth redirect URIs updated
- [ ] SSL certificate provisioned
- [ ] OAuth flow tested successfully
- [ ] No authentication errors in production

## 🎉 **Expected Result**

After successful setup:
- Google OAuth popup will show `auth.kandujobs.com` instead of `xipjxcktpzanmhfrkbrm.supabase.co`
- All authentication flows will use the custom domain
- Better branding and user trust
- Consistent domain experience across your application
