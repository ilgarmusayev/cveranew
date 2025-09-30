import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getWorkingGeminiApiKey(): Promise<string | null> {
    try {
        // Find active Gemini API keys ordered by usage count (least used first)
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                service: 'gemini',
                active: true
            },
            orderBy: {
                usageCount: 'asc'
            }
        });

        if (!apiKey) {
            console.log('❌ No active Gemini API key found in database');
            return null;
        }

        // Update usage count
        await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: {
                usageCount: { increment: 1 },
                lastUsed: new Date()
            }
        });

        console.log(`✅ Using Gemini API key ID: ${apiKey.id}, Usage: ${apiKey.usageCount + 1}`);
        return apiKey.apiKey;

    } catch (error) {
        console.error('❌ Error fetching Gemini API key from database:', error);
        return null;
    }
}

export async function markApiKeyAsInactive(apiKey: string, error: string): Promise<void> {
    try {
        await prisma.apiKey.updateMany({
            where: {
                service: 'gemini',
                apiKey: apiKey
            },
            data: {
                active: false,
                lastUsed: new Date()
            }
        });
        console.log(`🚫 Marked API key as inactive due to: ${error}`);
    } catch (err) {
        console.error('❌ Error marking API key as inactive:', err);
    }
}