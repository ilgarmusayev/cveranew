# 🔑 Multi-API Key Management System

## 📋 Sistemin Təsviri

Bu sistem API key overload problemlərinin qarşısını almaq üçün çoxlu API key-lər istifadə edir və smart rotation təmin edir.

## 🚀 Setup

### 1. API Key-ləri Əlavə Et

```bash
# add-multiple-gemini-keys.js faylını düzəlt
# GEMINI_API_KEYS array-də öz key-lərini əlavə et:

const GEMINI_API_KEYS = [
  {
    name: 'Gemini Primary API Key',
    apiKey: 'AIzaSyA...your-actual-key-here',
    priority: 1,
    dailyLimit: 1000
  },
  // 3-4 daha key əlavə et...
];

# Script-i işə sal
node add-multiple-gemini-keys.js
```

### 2. API Key Status Yoxla

```bash
node check-api-key-status.js
```

## 🔄 Smart Rotation Logic

### **Automatic Selection:**
```typescript
// Ən yaxşı key-i seç (priority, usage, success rate əsasında)
const apiKeyInfo = await getBestApiKey('gemini');
const client = new GeminiV1Client(apiKeyInfo.apiKey, apiKeyInfo.id);
```

### **Overload Detection:**
- HTTP 429 (Too Many Requests)
- Response-da "quota", "limit", "overload" 
- Automatic key rotation baş verir

### **Fallback Chain:**
```
Primary Key (Priority 1) 
    ↓ (overload)
Secondary Key (Priority 2)
    ↓ (overload)  
Tertiary Key (Priority 3)
    ↓ (overload)
Backup Key (Priority 4)
```

## 📊 Key Selection Algorithm

### **Scoring System:**
```typescript
score = 100 - priority;           // Lower priority = Higher score
score += recentSuccess ? 20 : 0;  // Bonus for success
score -= recentFailure ? 30 : 0;  // Penalty for failure  
score -= usageRatio * 50;         // Penalty for high usage
score += recentlyUnused ? 10 : 0; // Bonus for fresh key
```

### **Usage Tracking:**
- Daily usage counter
- Success/failure history
- Last used timestamp
- Total request count

## 🛡️ Error Handling

### **Overload Errors:**
- Key temporarily deactivated
- Auto-reactivation after 1 hour
- Immediate switch to next key

### **Auth Errors:**
- Key marked for review
- Priority lowered to 999
- Manual intervention required

## 🔧 Updated AI Routes

### **Translation Route:**
```typescript
// Automatic key rotation
const geminiV1 = new GeminiV1Client(apiKey, apiKeyId);
try {
  result = await geminiV1.generateContent('gemini-2.5-flash', prompt);
} catch (error) {
  // Auto-retry with next key if overload
}
```

### **All AI Routes Support:**
- ✅ AI CV Translation
- ✅ AI Professional Summary
- ✅ AI Skills Generation  
- ✅ Cover Letter Generation
- ✅ AI Skills Suggestion
- ✅ LinkedIn Import AI

## 📈 Performance Benefits

### **Before:**
- Single API key
- Manual intervention needed
- Service downtime on overload
- No usage analytics

### **After:**
- 3-4 API keys per service
- Automatic failover
- Zero downtime
- Comprehensive monitoring
- Smart load balancing

## 🎯 Monitoring

### **Real-time Status:**
```bash
# Key health check
node check-api-key-status.js

# Shows:
# - Active/inactive keys
# - Usage percentages  
# - Success/failure rates
# - Last used timestamps
# - System health score
```

### **Database Tracking:**
- Daily usage reset (automatic)
- Request success/failure logging
- Performance analytics
- Cost optimization data

## 🚨 Alerts

### **Warning Conditions:**
- Key usage > 80% of daily limit
- Multiple recent failures
- Less than 50% keys healthy
- All keys in service exhausted

### **Auto-Recovery:**
- Overloaded keys reactivated after cooldown
- Failed requests auto-retry with next key
- Smart prioritization based on success rate

## 💡 Best Practices

1. **Key Distribution:** Spread requests across multiple keys
2. **Monitor Usage:** Check status regularly
3. **Set Limits:** Configure realistic daily limits
4. **Backup Keys:** Always have backup keys ready
5. **Health Checks:** Monitor system health score

Bu sistem API overload problemlərini həll edir və yüksək availability təmin edir! 🎉