import crypto from 'crypto';

interface EpointConfig {
  publicKey: string;
  privateKey: string;
  apiUrl: string;
  checkoutUrl: string;
  webhookSecret: string;
  developmentMode: boolean;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  successRedirectUrl?: string;
  errorRedirectUrl?: string;
  resultUrl?: string;
  customerEmail?: string;
  customerName?: string;
  language?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  message?: string;
  error?: string;
}

class EpointService {
  private config: EpointConfig;

  constructor() {
    this.config = {
      publicKey: process.env.EPOINT_PUBLIC_KEY || '',
      privateKey: process.env.EPOINT_PRIVATE_KEY || '',
      apiUrl: 'https://epoint.az/api/1/request',
      checkoutUrl: 'https://epoint.az/api/1/checkout',
      webhookSecret: process.env.EPOINT_WEBHOOK_SECRET || '',
      developmentMode: process.env.EPOINT_DEVELOPMENT_MODE === 'true'
    };
    
    console.log('Epoint Configuration Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      hasPublicKey: !!this.config.publicKey && this.config.publicKey !== 'your-real-public-key',
      hasPrivateKey: !!this.config.privateKey,
      publicKeyLength: this.config.publicKey.length,
      privateKeyLength: this.config.privateKey.length,
      publicKeyValue: this.config.publicKey ? `${this.config.publicKey.substring(0, 3)}...` : 'MISSING',
      privateKeyValue: this.config.privateKey ? `${this.config.privateKey.substring(0, 3)}...` : 'MISSING',
      apiUrl: this.config.apiUrl,
      checkoutUrl: this.config.checkoutUrl,
      developmentMode: this.config.developmentMode,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('EPOINT'))
    });
  }

  /**
   * Create payment using Epoint.az API according to official documentation
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Development mode - simulate payment for testing
      if (this.config.developmentMode) {
        const simulatedTransactionId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          success: true,
          paymentUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?transactionId=${simulatedTransactionId}&orderId=${request.orderId}&development=true`,
          transactionId: simulatedTransactionId,
          message: 'Development mode - Payment simulation created successfully'
        };
      }

      // Check if credentials are properly configured
      if (!this.config.publicKey || this.config.publicKey === 'your-real-public-key') {
        return {
          success: false,
          error: 'Epoint.az public key konfiqurasiya edilməyib. .env.local faylında EPOINT_PUBLIC_KEY dəyərini həqiqi public key ilə əvəz edin.'
        };
      }

      if (!this.config.privateKey) {
        return {
          success: false,
          error: 'Epoint.az private key konfiqurasiya edilməyib. .env.local faylında EPOINT_PRIVATE_KEY dəyərini əlavə edin.'
        };
      }

      // Prepare payment data according to Epoint.az documentation
      const paymentData = {
        public_key: this.config.publicKey,
        amount: request.amount.toString(),
        currency: request.currency,
        language: request.language || 'az',
        order_id: request.orderId,
        description: request.description || 'CVera Payment',
        success_redirect_url: request.successRedirectUrl,
        error_redirect_url: request.errorRedirectUrl
      };

      // Filter out undefined values
      const filteredData = Object.fromEntries(
        Object.entries(paymentData).filter(([_, value]) => value !== undefined && value !== '')
      );

      // Create data parameter (base64 encoded JSON)
      const dataString = JSON.stringify(filteredData);
      const data = Buffer.from(dataString).toString('base64');

      // Create signature according to documentation: base64_encode(sha1(private_key + data + private_key))
      // Try different signature methods based on Epoint.az variations
      const signatureString = this.config.privateKey + data + this.config.privateKey;
      
      // Method 1: Standard SHA1 with base64
      const signature1 = crypto
        .createHash('sha1')
        .update(signatureString, 'utf8')
        .digest('base64');

      // Method 2: SHA1 hex then base64
      const signature2 = Buffer.from(
        crypto.createHash('sha1').update(signatureString, 'utf8').digest('hex')
      ).toString('base64');

      // Method 3: MD5 for legacy compatibility
      const signature3 = crypto
        .createHash('md5')
        .update(signatureString, 'utf8')
        .digest('base64');

      console.log('Epoint Signature Debug:', {
        dataString: dataString,
        data: data,
        privateKeyLength: this.config.privateKey.length,
        signatureStringLength: signatureString.length,
        signature1: signature1,
        signature2: signature2,
        signature3: signature3,
        url: this.config.apiUrl
      });

      // Use primary signature method
      const signature = signature1;

      // Send request to Epoint.az API
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: data,
          signature: signature
        }).toString()
      });

      const responseText = await response.text();
      
      console.log('Epoint API Response:', {
        status: response.status,
        ok: response.ok,
        body: responseText.substring(0, 500)
      });

      // Try to parse JSON response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse Epoint response as JSON:', error);
        return {
          success: false,
          error: `Epoint API cavabı JSON formatında deyil. Status: ${response.status}`
        };
      }

      // Check response according to documentation
      if (response.ok && result.redirect_url) {
        return {
          success: true,
          paymentUrl: result.redirect_url,
          transactionId: request.orderId,
          message: 'Payment URL yaradıldı uğurla'
        };
      } else {
        return {
          success: false,
          error: result.message || result.error || `Epoint API xətası: ${response.status}`
        };
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: `Şəbəkə xətası: ${error instanceof Error ? error.message : 'Payment creation failed'}`
      };
    }
  }

  /**
   * Get payment status from Epoint.az
   */
  async getPaymentStatus(transactionId: string): Promise<any> {
    try {
      const paymentData = {
        public_key: this.config.publicKey,
        order_id: transactionId
      };

      const dataString = JSON.stringify(paymentData);
      const data = Buffer.from(dataString).toString('base64');
      
      const signatureString = this.config.privateKey + data + this.config.privateKey;
      const signature = crypto
        .createHash('sha1')
        .update(signatureString, 'utf8')
        .digest('base64');

      const response = await fetch('https://epoint.az/api/1/get-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: data,
          signature: signature
        }).toString()
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          status: result.status,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.message || 'Status yoxlanması uğursuz oldu'
        };
      }
    } catch (error) {
      console.error('Payment status error:', error);
      return {
        success: false,
        error: 'Status yoxlanması xətası'
      };
    }
  }

  /**
   * Verify webhook signature from Epoint.az
   */
  verifyWebhookSignature(data: string, receivedSignature: string): boolean {
    try {
      const signatureString = this.config.privateKey + data + this.config.privateKey;
      const expectedSignature = crypto
        .createHash('sha1')
        .update(signatureString, 'utf8')
        .digest('base64');
      
      return expectedSignature === receivedSignature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Parse webhook data from Epoint.az
   */
  parseWebhookData(data: string): any {
    try {
      const decodedData = Buffer.from(data, 'base64').toString('utf8');
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Webhook data parsing error:', error);
      return null;
    }
  }

  /**
   * Create checkout form URL for direct redirect
   */
  createCheckoutFormUrl(request: PaymentRequest): string {
    const paymentData = {
      public_key: this.config.publicKey,
      amount: request.amount.toString(),
      currency: request.currency,
      language: request.language || 'az',
      order_id: request.orderId,
      description: request.description || 'CVera Payment',
      success_redirect_url: request.successRedirectUrl,
      error_redirect_url: request.errorRedirectUrl
    };

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(paymentData).filter(([_, value]) => value !== undefined && value !== '')
    );

    const dataString = JSON.stringify(filteredData);
    const data = Buffer.from(dataString).toString('base64');
    
    const signatureString = this.config.privateKey + data + this.config.privateKey;
    const signature = crypto
      .createHash('sha1')
      .update(signatureString, 'utf8')
      .digest('base64');

    const params = new URLSearchParams({
      data: data,
      signature: signature
    });

    return `${this.config.checkoutUrl}?${params.toString()}`;
  }
}

// Export singleton instance
const epointService = new EpointService();
export default epointService;
