import crypto from 'crypto';

interface EpointConfig {
  publicKey: string;
  privateKey: string;
  apiUrl: string;
  webhookSecret: string;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  successRedirectUrl: string;
  errorRedirectUrl: string;
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

interface CardRegistrationRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  customerEmail: string;
}

interface CardRegistrationResponse {
  success: boolean;
  cardToken?: string;
  message?: string;
  error?: string;
}

interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
}

interface RefundResponse {
  success: boolean;
  refundId?: string;
  message?: string;
  error?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transactionId?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

interface SplitPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  recipients: {
    merchantId: string;
    amount: number;
  }[];
  successRedirectUrl: string;
  errorRedirectUrl: string;
}

interface PreAuthRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  cardToken: string;
}

interface WalletPaymentRequest {
  walletId: string;
  amount: number;
  currency: string;
  orderId: string;
  description: string;
}

interface InvoiceRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail: string;
  customerName: string;
  dueDate?: string;
}

interface InvoiceResponse {
  success: boolean;
  invoiceId?: string;
  invoiceUrl?: string;
  message?: string;
  error?: string;
}

class EpointService {
  private config: EpointConfig;

  constructor() {
    this.config = {
      publicKey: process.env.EPOINT_MERCHANT_ID || '',
      privateKey: process.env.EPOINT_SECRET_KEY || '',
      apiUrl: process.env.EPOINT_API_URL || 'https://epoint.az/api/1',
      webhookSecret: process.env.EPOINT_WEBHOOK_SECRET || ''
    };
  }

  /**
   * 1. Əsas ödəniş yaratmaq (checkout/payment)
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        amount: request.amount,
        currency: request.currency,
        language: request.language || 'az',
        order_id: request.orderId,
        description: request.description,
        success_redirect_url: request.successRedirectUrl,
        error_redirect_url: request.errorRedirectUrl,
        result_url: request.resultUrl,
        customer_email: request.customerEmail,
        customer_name: request.customerName
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/checkout/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          paymentUrl: result.checkout_url,
          transactionId: result.transaction_id,
          message: 'Payment created successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Payment creation failed'
        };
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: 'Payment creation failed'
      };
    }
  }

  /**
   * 2. Ödəniş statusunu yoxlamaq
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        transaction_id: transactionId
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/checkout/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          status: this.mapPaymentStatus(result.status),
          transactionId: result.transaction_id,
          amount: result.amount,
          currency: result.currency,
          message: 'Payment status retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to get payment status'
        };
      }
    } catch (error) {
      console.error('Payment status error:', error);
      return {
        success: false,
        error: 'Failed to get payment status'
      };
    }
  }

  /**
   * 3. Kart qeydiyyatı
   */
  async registerCard(request: CardRegistrationRequest): Promise<CardRegistrationResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        card_number: request.cardNumber,
        expiry_month: request.expiryMonth,
        expiry_year: request.expiryYear,
        cvv: request.cvv,
        cardholder_name: request.cardholderName,
        customer_email: request.customerEmail
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/card/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          cardToken: result.card_token,
          message: 'Card registered successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Card registration failed'
        };
      }
    } catch (error) {
      console.error('Card registration error:', error);
      return {
        success: false,
        error: 'Card registration failed'
      };
    }
  }

  /**
   * 4. Saxlanmış kartla ödəniş
   */
  async executePayWithCard(cardToken: string, amount: number, currency: string, orderId: string, description: string): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        card_token: cardToken,
        amount: amount,
        currency: currency,
        order_id: orderId,
        description: description
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/card/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          transactionId: result.transaction_id,
          message: 'Card payment successful'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Card payment failed'
        };
      }
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        error: 'Card payment failed'
      };
    }
  }

  /**
   * 5. Kart qeydiyyatı və ödəniş (bir addımda)
   */
  async registerCardAndPay(request: CardRegistrationRequest & { amount: number; currency: string; orderId: string; description: string }): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        card_number: request.cardNumber,
        expiry_month: request.expiryMonth,
        expiry_year: request.expiryYear,
        cvv: request.cvv,
        cardholder_name: request.cardholderName,
        customer_email: request.customerEmail,
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        description: request.description
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/card/register-and-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          transactionId: result.transaction_id,
          message: 'Card registration and payment successful'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Card registration and payment failed'
        };
      }
    } catch (error) {
      console.error('Card registration and payment error:', error);
      return {
        success: false,
        error: 'Card registration and payment failed'
      };
    }
  }

  /**
   * 6. Refund (ödənişi geri qaytarmaq)
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        transaction_id: request.transactionId,
        amount: request.amount,
        reason: request.reason
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          refundId: result.refund_id,
          message: 'Refund processed successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Refund failed'
        };
      }
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: 'Refund failed'
      };
    }
  }

  /**
   * 7. Split payment (bölünmüş ödəniş)
   */
  async splitPayment(request: SplitPaymentRequest): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        description: request.description,
        recipients: request.recipients,
        success_redirect_url: request.successRedirectUrl,
        error_redirect_url: request.errorRedirectUrl
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/payment/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          paymentUrl: result.checkout_url,
          transactionId: result.transaction_id,
          message: 'Split payment created successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Split payment failed'
        };
      }
    } catch (error) {
      console.error('Split payment error:', error);
      return {
        success: false,
        error: 'Split payment failed'
      };
    }
  }

  /**
   * 8. Pre-authorization (əvvəlcədən avtorizasiya)
   */
  async preAuthPayment(request: PreAuthRequest): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        description: request.description,
        card_token: request.cardToken
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/payment/preauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          transactionId: result.transaction_id,
          message: 'Pre-authorization successful'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Pre-authorization failed'
        };
      }
    } catch (error) {
      console.error('Pre-authorization error:', error);
      return {
        success: false,
        error: 'Pre-authorization failed'
      };
    }
  }

  /**
   * 9. Pre-authorization completion (əvvəlcədən avtorizasiyanı tamamlamaq)
   */
  async completePreAuth(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        transaction_id: transactionId,
        amount: amount
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/payment/preauth/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          transactionId: result.transaction_id,
          message: 'Pre-authorization completed successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Pre-authorization completion failed'
        };
      }
    } catch (error) {
      console.error('Pre-authorization completion error:', error);
      return {
        success: false,
        error: 'Pre-authorization completion failed'
      };
    }
  }

  /**
   * 10. Payment widget URL yaratmaq
   */
  async getPaymentWidget(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        description: request.description,
        success_redirect_url: request.successRedirectUrl,
        error_redirect_url: request.errorRedirectUrl
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/widget/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          paymentUrl: result.widget_url,
          transactionId: result.transaction_id,
          message: 'Payment widget created successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Payment widget creation failed'
        };
      }
    } catch (error) {
      console.error('Payment widget error:', error);
      return {
        success: false,
        error: 'Payment widget creation failed'
      };
    }
  }

  /**
   * 11. Wallet status yoxlamaq
   */
  async getWalletStatus(walletId: string): Promise<any> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        wallet_id: walletId
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/wallet/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          walletId: result.wallet_id,
          balance: result.balance,
          currency: result.currency,
          message: 'Wallet status retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to get wallet status'
        };
      }
    } catch (error) {
      console.error('Wallet status error:', error);
      return {
        success: false,
        error: 'Failed to get wallet status'
      };
    }
  }

  /**
   * 12. Wallet-dən ödəniş
   */
  async payWithWallet(request: WalletPaymentRequest): Promise<PaymentResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        wallet_id: request.walletId,
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        description: request.description
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/wallet/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          transactionId: result.transaction_id,
          message: 'Wallet payment successful'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Wallet payment failed'
        };
      }
    } catch (error) {
      console.error('Wallet payment error:', error);
      return {
        success: false,
        error: 'Wallet payment failed'
      };
    }
  }

  /**
   * 13. Invoice yaratmaq
   */
  async createInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        amount: request.amount,
        currency: request.currency,
        order_id: request.orderId,
        description: request.description,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        due_date: request.dueDate
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/invoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          invoiceId: result.invoice_id,
          invoiceUrl: result.invoice_url,
          message: 'Invoice created successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Invoice creation failed'
        };
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      return {
        success: false,
        error: 'Invoice creation failed'
      };
    }
  }

  /**
   * 14. Invoice update etmək
   */
  async updateInvoice(invoiceId: string, updates: Partial<InvoiceRequest>): Promise<InvoiceResponse> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        invoice_id: invoiceId,
        ...updates
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/invoice/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          invoiceId: result.invoice_id,
          message: 'Invoice updated successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Invoice update failed'
        };
      }
    } catch (error) {
      console.error('Invoice update error:', error);
      return {
        success: false,
        error: 'Invoice update failed'
      };
    }
  }

  /**
   * 15. Invoice SMS göndərmək
   */
  async sendInvoiceSMS(invoiceId: string, phoneNumber: string): Promise<any> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        invoice_id: invoiceId,
        phone_number: phoneNumber
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/invoice/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: 'Invoice SMS sent successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to send invoice SMS'
        };
      }
    } catch (error) {
      console.error('Invoice SMS error:', error);
      return {
        success: false,
        error: 'Failed to send invoice SMS'
      };
    }
  }

  /**
   * 16. Invoice email göndərmək
   */
  async sendInvoiceEmail(invoiceId: string, email: string): Promise<any> {
    try {
      const requestData = {
        public_key: this.config.publicKey,
        invoice_id: invoiceId,
        email: email
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/invoice/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: 'Invoice email sent successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to send invoice email'
        };
      }
    } catch (error) {
      console.error('Invoice email error:', error);
      return {
        success: false,
        error: 'Failed to send invoice email'
      };
    }
  }

  /**
   * 17. Heartbeat - API status yoxlamaq
   */
  async checkHeartbeat(): Promise<any> {
    try {
      const requestData = {
        public_key: this.config.publicKey
      };

      const signature = this.generateSignature(requestData);
      const payload = { ...requestData, signature };

      const response = await fetch(`${this.config.apiUrl}/system/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          status: result.status,
          timestamp: result.timestamp,
          message: 'API is working correctly'
        };
      } else {
        return {
          success: false,
          error: result.message || 'API heartbeat failed'
        };
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
      return {
        success: false,
        error: 'API heartbeat failed'
      };
    }
  }

  /**
   * 18. Bank response mesajını tərcümə etmək
   */
  getBankResponseMessage(responseCode: string): string {
    const messages: { [key: string]: string } = {
      '00': 'Əməliyyat uğurla tamamlandı',
      '01': 'Kartınızla əlaqədar bank problemi',
      '03': 'Ticarət mərkəzi yanlışdır',
      '04': 'Kartınız ələ keçirilmişdir',
      '05': 'Əməliyyat rədd edildi',
      '06': 'Sistem xətası',
      '07': 'Kartınız ələ keçirilmişdir',
      '12': 'Yanlış əməliyyat',
      '13': 'Yanlış məbləğ',
      '14': 'Yanlış kart nömrəsi',
      '15': 'Yanlış bank',
      '19': 'Əməliyyatı təkrarlayın',
      '20': 'Yanlış cavab',
      '21': 'Heç bir işlem edilmir',
      '25': 'Qeyd tapılmadı',
      '30': 'Format xətası',
      '33': 'Kartın müddəti bitib',
      '34': 'Saxtakarlıq şübhəsi',
      '36': 'Kartınız məhdudlaşdırılıb',
      '38': 'PIN daxil etmə limiti bitib',
      '39': 'Kredit hesabı yoxdur',
      '41': 'İtirilmiş kart',
      '43': 'Oğurlanmış kart',
      '51': 'Kifayət qədər vəsait yoxdur',
      '52': 'Çəkkredili hesab yoxdur',
      '53': 'Əmanət hesabı yoxdur',
      '54': 'Kartın müddəti bitib',
      '55': 'Yanlış PIN',
      '56': 'Kart qeydiyatda yoxdur',
      '57': 'Bu əməliyyata icazə verilmir',
      '58': 'Bu terminalda əməliyyata icazə verilmir',
      '59': 'Saxtakarlıq şübhəsi',
      '61': 'Limiti aşır',
      '62': 'Kartınız məhdudlaşdırılıb',
      '63': 'Təhlükəsizlik qaydaları pozulub',
      '65': 'Gündəlik əməliyyat sayı limitini aşır',
      '66': 'Kartınızla əlaqədar bank problemi',
      '67': 'Kartınız ələ keçirilmişdir',
      '68': 'Cavab gecikir',
      '75': 'PIN daxil etmə limiti bitib',
      '76': 'Hesab artıq var',
      '77': 'Hesab yoxdur',
      '78': 'Hesab bağlıdır',
      '79': 'Hesab ləğv edilib',
      '80': 'Tarix yanlışdır',
      '81': 'Şifrələmə xətası',
      '82': 'CVV yanlışdır',
      '83': 'PIN təsdiq edilə bilmir',
      '84': 'PIN sıfırlanmalıdır',
      '85': 'Rədd edilib, PIN təsdiq edilə bilmir',
      '86': 'PIN təsdiq edilə bilmir',
      '87': 'Alış nağd mərkəzində hesab yoxdur',
      '88': 'Kriptoqrafiya xətası',
      '89': 'Doğrulama xətası',
      '90': 'Gün sonu zamanı',
      '91': 'Bank işləmir',
      '92': 'Yönləndirici tapılmadı',
      '93': 'Əməliyyat tamamlana bilmir',
      '94': 'Təkrar ötürmə',
      '95': 'Hesablaşma zamanı deyil',
      '96': 'Sistem xətası',
      '97': 'ATM nağd yoxdur',
      '98': 'Kriptoqrafiya xətası',
      '99': 'Qarışıq səbəblər'
    };

    return messages[responseCode] || `Naməlum xəta kodu: ${responseCode}`;
  }

  /**
   * Helper functions
   */
  private mapPaymentStatus(status: string): 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    switch (status) {
      case 'success':
      case 'completed':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      case 'refunded':
        return 'refunded';
      default:
        return 'pending';
    }
  }

  private generateSignature(data: any): string {
    // Remove empty values and sort keys
    const filteredData = Object.keys(data)
      .filter(key => data[key] !== null && data[key] !== undefined && data[key] !== '')
      .sort()
      .reduce((obj: any, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    // Create query string
    const queryString = Object.keys(filteredData)
      .map(key => `${key}=${filteredData[key]}`)
      .join('&');

    // Append secret key
    const stringToSign = queryString + this.config.privateKey;

    // Generate SHA1 hash and encode to base64
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign, 'utf8')
      .digest('base64');

    return signature;
  }

  /**
   * Webhook signature verification
   */
  verifyWebhookSignature(payload: any, receivedSignature: string): boolean {
    try {
      const generatedSignature = this.generateSignature(payload);
      return generatedSignature === receivedSignature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
const epointService = new EpointService();
export default epointService;
