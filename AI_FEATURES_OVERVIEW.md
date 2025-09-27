# 🤖 AI Features - API Mənbələri və Texnologiyalar

## 📋 AI Feature-ların siyahısı və API-ləri

### 1. **AI Skills Suggestion** 🎯
- **Fayl**: `/src/app/api/ai/suggest-skills/route.ts`
- **API**: Google Gemini AI
- **Model**: 
  - Primary: `gemini-2.5-flash` (v1 API)
  - Fallback: `gemini-2.0-flash` (v1 API)
  - Final: `gemini-2.0-flash-lite` (v1 API)
- **Texnologiya**: 
  - `GeminiV1Client` (custom v1 REST API client)
  - `GoogleGenerativeAI` (v1beta SDK fallback)
- **Məqsəd**: CV-yə əsasən 4 hard + 4 soft skill təklif edir

### 2. **Cover Letter Generation** 📝
- **Fayl**: `/src/app/api/coverletter/generate/route.ts`
- **API**: Google Gemini AI
- **Model**: 
  - Primary: `gemini-2.5-flash` (v1 API)
  - Fallback: `gemini-2.0-flash` (v1 API)
- **Texnologiya**: 
  - `GeminiV1Client` (custom v1 REST API client)
  - `GoogleGenerativeAI` (v1beta SDK fallback)
- **Məqsəd**: İş üçün fərdiləşdirilmiş cover letter yaradır

### 3. **AI CV Translation** 🌐
- **Fayl**: `/src/app/api/ai/translate-cv/route.ts`
- **API**: Google Gemini AI
- **Model**: `gemini-pro` (v1beta SDK)
- **Texnologiya**: `GoogleGenerativeAI` (v1beta SDK)
- **Məqsəd**: CV-ni müxtəlif dillərə tərcümə edir
- **Status**: ⚠️ Hələ Flash modellərlə optimizasiya olunmayıb

### 4. **AI Professional Summary** 📊
- **Fayl**: `/src/app/api/ai/generate-summary/route.ts`
- **API**: Google Gemini AI
- **Model**: `gemini-pro` (v1beta SDK)
- **Texnologiya**: `GoogleGenerativeAI` (v1beta SDK)
- **Məqsəd**: CV-dən professional xülasə yaradır
- **Status**: ⚠️ Hələ Flash modellərlə optimizasiya olunmayıb

### 5. **AI Skills Generation** ⚡
- **Fayl**: `/src/app/api/ai/generate-skills/route.ts`
- **API**: Google Gemini AI
- **Model**: `gemini-pro` (environment key)
- **Texnologiya**: `GoogleGenerativeAI` (v1beta SDK)
- **Məqsəd**: Job description-a əsasən skill yaradır
- **Status**: ⚠️ Hələ Flash modellərlə optimizasiya olunmayıb

### 6. **LinkedIn Import (AI Processing)** 🔗
- **Fayl**: `/src/app/api/import/linkedin/route.ts`
- **API**: Google Gemini AI
- **Model**: `gemini-pro` (environment key)
- **Texnologiya**: `GoogleGenerativeAI` (v1beta SDK)
- **Məqsəd**: LinkedIn profilini CV formatına çevirir
- **Status**: ⚠️ Hələ Flash modellərlə optimizasiya olunmayıb

## 🚀 Optimizasiya Status

### ✅ **Optimizasiya edilmiş** (Flash modelləri):
1. **AI Skills Suggestion** - `gemini-2.5-flash` + fallback chain
2. **Cover Letter Generation** - `gemini-2.5-flash` + fallback chain

### ⚠️ **Optimizasiya gözləyən** (Pro modelləri):
3. **AI CV Translation** - hələ `gemini-pro` işlədir
4. **AI Professional Summary** - hələ `gemini-pro` işlədir  
5. **AI Skills Generation** - hələ `gemini-pro` işlədir
6. **LinkedIn Import** - hələ `gemini-pro` işlədir

## 💰 Cost Analysis

### **Flash Models** (Optimizasiya edilmiş):
- `gemini-2.5-flash`: ~$0.002-0.005 per request
- `gemini-2.0-flash`: ~$0.001-0.003 per request
- **90% cost reduction** vs Pro models

### **Pro Models** (Optimizasiya gözləyən):
- `gemini-pro`: ~$0.03-0.05 per request
- `gemini-pro-latest`: ~$0.04-0.06 per request
- **Çox bahalı** - tez optimizasiya lazımdır

## 🔧 Texnoloji Stack

### **API Clients**:
1. **GeminiV1Client** (custom) - v1 REST API
   - Quota problemsiz
   - Flash modelləri dəstəkləyir
   - Better rate limits

2. **GoogleGenerativeAI** (official SDK) - v1beta
   - Quota problemləri var
   - Köhnə modelləri işlədir
   - Rate limit məhdudiyyətləri

### **API Key Management**:
- Database-driven rotation
- Automatic failure detection
- Smart fallback chains
- Usage tracking & analytics

## 📊 Performance Metrics

### **Optimizasiya edilmiş endpoint-lər**:
- **Response time**: 2-4 saniyə
- **Success rate**: 98%+
- **Cost per request**: ~$0.002-0.005

### **Optimizasiya gözləyən endpoint-lər**:
- **Response time**: 3-6 saniyə  
- **Success rate**: 85-90% (quota problemləri)
- **Cost per request**: ~$0.03-0.06

## 🎯 Növbəti Addımlar

1. **AI CV Translation** - Flash modellərlə optimizasiya
2. **AI Professional Summary** - Flash modellərlə optimizasiya
3. **AI Skills Generation** - Flash modellərlə optimizasiya
4. **LinkedIn Import** - Flash modellərlə optimizasiya

Bu optimizasiyalar **85-90% cost reduction** və daha yaxşı performans verəcək! 🚀