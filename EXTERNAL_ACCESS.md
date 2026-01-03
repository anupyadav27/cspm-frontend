# External Access - Onboarding API

## ✅ LoadBalancer Service Created

Your API is now accessible via a public URL!

## 🌐 API URL

```
http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com
```

## 📋 Available Endpoints

### Health Check
```
http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/api/v1/health
```

### API Documentation
```
http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/docs
```

### OpenAPI Specification
```
http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/openapi.json
```

## 🔍 Get the URL Anytime

```bash
kubectl get svc onboarding-api-lb -n threat-engine-engines \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## 🧪 Quick Test

```bash
# Health check
curl http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/api/v1/health

# List accounts
curl http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/api/v1/onboarding/accounts
```

## ⚙️ Service Details

- **Service Name:** `onboarding-api-lb`
- **Type:** `LoadBalancer`
- **Port:** `80` (HTTP)
- **Target Port:** `8000` (container port)
- **Load Balancer Type:** Network Load Balancer (NLB)

## 💰 Cost

- **Network Load Balancer:** ~$0.0225/hour (~$16/month)
- **Data Transfer:** Standard AWS pricing

## 🔒 Security Notes

⚠️ **Current Setup:**
- HTTP only (no HTTPS/TLS)
- Publicly accessible
- No authentication

**For Production:**
1. Set up HTTPS/TLS certificate
2. Add authentication/authorization
3. Consider using Ingress with ALB for more control
4. Add rate limiting
5. Use WAF for additional security

## 🔄 Update URL

If you need to get the URL again:

```bash
kubectl get svc onboarding-api-lb -n threat-engine-engines
```

## 🗑️ Remove LoadBalancer

If you want to remove external access:

```bash
kubectl delete svc onboarding-api-lb -n threat-engine-engines
```

This will stop the LoadBalancer and associated costs.

---

**Status:** ✅ Active
**Last Updated:** 2026-01-03

