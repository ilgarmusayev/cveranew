import { prisma } from '@/lib/prisma';


export interface APIKeyData {
  id: string;
  service: string;
  apiKey: string;
  active: boolean;
  dailyLimit: number;
  dailyUsage: number;
  lastReset: Date;
  priority: number;
  usageCount: number;
  lastUsed?: Date | null;
  lastResult?: string | null;
}

export class APIKeyManager {

  // Aktiv API key-i əldə et
  static async getActiveAPIKey(serviceName: string): Promise<APIKeyData | null> {
    try {
      const apiKeyData = await prisma.apiKey.findFirst({
        where: {
          service: serviceName,
          active: true
        },
        orderBy: {
          priority: 'asc'
        }
      });

      if (!apiKeyData) {
        console.error(`❌ ${serviceName} üçün aktiv API key tapılmadı`);
        return null;
      }

      // Daily limit yoxlaması
      if (await this.isDailyLimitExceeded(apiKeyData.id)) {
        console.error(`❌ ${serviceName} üçün günlük limit aşılıb`);
        return null;
      }

      return apiKeyData as APIKeyData;
    } catch (error) {
      console.error(`❌ API key əldə edilərkən xəta:`, error);
      return null;
    }
  }

  // ScrapingDog LinkedIn API çağırışı
  static async callScrapingDogLinkedIn(linkId: string): Promise<any> {
    try {
      const apiData = await this.getActiveAPIKey('scrapingdog_linkedin');
      if (!apiData) {
        throw new Error('ScrapingDog API key mövcud deyil və ya aktiv deyil');
      }

      console.log(`🔄 ScrapingDog API çağırışı: ${linkId}`);

      const axios = require('axios');
      const url = 'https://api.scrapingdog.com/linkedin';
      const params = {
        api_key: apiData.apiKey,
        type: 'profile',
        linkId: linkId,
        premium: 'false',
      };

      const response = await axios.get(url, { params });

      if (response.status === 200) {
        // İstifadə sayğacını artır
        await this.incrementUsage(apiData.id);
        console.log(`✅ ScrapingDog API uğurla çağırıldı: ${linkId}`);
        return response.data;
      } else {
        throw new Error(`API cavabı uğursuz: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ScrapingDog API xətası:`, error);
      throw error;
    }
  }

  // RapidAPI LinkedIn çağırışı
  static async callRapidAPILinkedIn(profileUrl: string): Promise<any> {
    try {
      const apiData = await this.getActiveAPIKey('rapidapi_linkedin');
      if (!apiData) {
        throw new Error('RapidAPI key mövcud deyil və ya aktiv deyil');
      }

      console.log(`🔄 RapidAPI çağırışı: ${profileUrl}`);

      const axios = require('axios');
      const url = 'https://linkedin-api.rapidapi.com/profile';
      const response = await axios.get(url, {
        headers: {
          'X-RapidAPI-Key': apiData.apiKey,
          'X-RapidAPI-Host': 'linkedin-api.rapidapi.com'
        },
        params: {
          url: profileUrl
        }
      });

      if (response.status === 200) {
        await this.incrementUsage(apiData.id);
        console.log(`✅ RapidAPI uğurla çağırıldı: ${profileUrl}`);
        return response.data;
      } else {
        throw new Error(`RapidAPI cavabı uğursuz: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ RapidAPI xətası:`, error);
      throw error;
    }
  }

  // İstifadə sayğacını artır
  private static async incrementUsage(apiKeyId: string): Promise<void> {
    try {
      await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          dailyUsage: {
            increment: 1
          },
          usageCount: {
            increment: 1
          },
          lastUsed: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`❌ İstifadə sayğacı artırılarkən xəta:`, error);
    }
  }

  // Günlük limit yoxlaması
  private static async isDailyLimitExceeded(apiKeyId: string): Promise<boolean> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId }
      });

      if (!apiKey || !apiKey.dailyLimit) return false;

      // Əgər tarixi dəyişibsə, sayğacı sıfırla
      const today = new Date().toDateString();
      const lastReset = new Date(apiKey.lastReset).toDateString();

      if (today !== lastReset) {
        await prisma.apiKey.update({
          where: { id: apiKeyId },
          data: {
            dailyUsage: 0,
            lastReset: new Date()
          }
        });
        return false;
      }

      return apiKey.dailyUsage >= apiKey.dailyLimit;
    } catch (error) {
      console.error(`❌ Günlük limit yoxlanılarkən xəta:`, error);
      return true; // Güvənlik üçün limit aşılmış kimi qəbul et
    }
  }

  // Admin: Bütün API key-ləri əldə et
  static async getAllAPIKeys(): Promise<APIKeyData[]> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        orderBy: { service: 'asc' }
      });
      return apiKeys as APIKeyData[];
    } catch (error) {
      console.error(`❌ API key-lər əldə edilərkən xəta:`, error);
      return [];
    }
  }

  // Admin: API key yenilə
  static async updateAPIKey(
    id: string,
    updates: Partial<Omit<APIKeyData, 'id' | 'lastReset'>>
  ): Promise<boolean> {
    try {
      await prisma.apiKey.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
      console.log(`✅ API key yeniləndi: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ API key yenilənərkən xəta:`, error);
      return false;
    }
  }

  // Admin: Yeni API key əlavə et
  static async addAPIKey(apiKeyData: Omit<APIKeyData, 'id' | 'lastReset' | 'dailyUsage' | 'usageCount' | 'lastUsed'>): Promise<boolean> {
    try {
      await prisma.apiKey.create({
        data: {
          ...apiKeyData,
          dailyUsage: 0,
          usageCount: 0,
          lastReset: new Date()
        }
      });
      console.log(`✅ Yeni API key əlavə edildi: ${apiKeyData.service}`);
      return true;
    } catch (error) {
      console.error(`❌ API key əlavə edilərkən xəta:`, error);
      return false;
    }
  }

  // Admin: API key sil
  static async deleteAPIKey(id: string): Promise<boolean> {
    try {
      await prisma.apiKey.delete({
        where: { id }
      });
      console.log(`✅ API key silindi: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ API key silinərkən xəta:`, error);
      return false;
    }
  }

  // İstatistikalar
  static async getAPIStats(): Promise<any> {
    try {
      const stats = await prisma.apiKey.findMany({
        select: {
          service: true,
          dailyUsage: true,
          dailyLimit: true,
          active: true,
          lastReset: true
        }
      });

      return stats.map(stat => ({
        service: stat.service,
        usagePercent: stat.dailyLimit ? (stat.dailyUsage / stat.dailyLimit * 100) : 0,
        dailyUsage: stat.dailyUsage,
        dailyLimit: stat.dailyLimit,
        active: stat.active,
        lastReset: stat.lastReset
      }));
    } catch (error) {
      console.error(`❌ API statistikalar əldə edilərkən xəta:`, error);
      return [];
    }
  }
}
