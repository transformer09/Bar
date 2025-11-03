import { EventEmitter } from 'events';
import { eventSystem, EventData } from '../../events/eventSystem';
import { rolePermissionService } from '../../services/rolePermissionService';

export interface ReceiptTemplate {
  id: string;
  name: string;
  business_type: 'restaurant' | 'bar' | 'lodge' | 'all';
  template_type: 'invoice' | 'receipt' | 'proforma' | 'credit_note';
  header: ReceiptSection;
  body: ReceiptSection;
  footer: ReceiptSection;
  styling: ReceiptStyling;
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReceiptSection {
  content: string;
  variables: string[];
  alignment: 'left' | 'center' | 'right' | 'justify';
  font_size: number;
  font_weight: 'normal' | 'bold' | 'light';
  margin_top: number;
  margin_bottom: number;
}

export interface ReceiptStyling {
  paper_width: number; // mm
  paper_height: number; // mm (0 for continuous)
  font_family: string;
  font_size_base: number;
  line_height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  logo_url?: string;
  watermark?: string;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  template_id: string;
  order_id?: string;
  reservation_id?: string;
  payment_id?: string;
  business_type: 'restaurant' | 'bar' | 'lodge';
  receipt_type: 'invoice' | 'receipt' | 'proforma' | 'credit_note';
  customer_name?: string;
  customer_details?: {
    phone?: string;
    email?: string;
    address?: string;
    tax_number?: string;
  };
  items: ReceiptItem[];
  summary: ReceiptSummary;
  payments: ReceiptPayment[];
  totals: ReceiptTotals;
  generated_by: string;
  generated_at: Date;
  printed_at?: Date;
  emailed_to?: string;
  status: 'draft' | 'generated' | 'sent' | 'printed' | 'cancelled';
  notes?: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  tax_rate?: number;
  discount?: number;
}

export interface ReceiptSummary {
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  rounding: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
}

export interface ReceiptPayment {
  id: string;
  payment_method: 'cash' | 'card' | 'mobile' | 'transfer' | 'room_charge';
  amount: number;
  transaction_id?: string;
  card_last_four?: string;
  processed_by: string;
  processed_at: Date;
}

export interface ReceiptTotals {
  items_count: number;
  total_quantity: number;
  average_item_price: number;
  total_tax: number;
  total_service_charge: number;
  grand_total: number;
}

export interface ReceiptConfig {
  auto_print: boolean;
  auto_email: boolean;
  default_template: {
    restaurant: string;
    bar: string;
    lodge: string;
  };
  numbering: {
    prefix: {
      restaurant: string;
      bar: string;
      lodge: string;
      invoice: string;
    };
    counter_length: number;
    reset_frequency: 'daily' | 'monthly' | 'yearly' | 'never';
  };
  printing: {
    printer_name?: string;
    paper_size: string;
    copies: number;
    auto_cut: boolean;
  };
  email: {
    from_address: string;
    from_name: string;
    subject_template: string;
    body_template: string;
    include_pdf: boolean;
  };
}

export class ReceiptService {
  private eventEmitter: EventEmitter;
  private templates: Map<string, ReceiptTemplate> = new Map();
  private receipts: Map<string, Receipt> = new Map();
  private config: ReceiptConfig;
  private counters: Map<string, number> = new Map();

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.config = this.loadConfig();
    this.initializeEventHandlers();
    this.loadDefaultTemplates();
    this.initializeCounters();
  }

  private loadConfig(): ReceiptConfig {
    return {
      auto_print: false,
      auto_email: false,
      default_template: {
        restaurant: 'template_restaurant_default',
        bar: 'template_bar_default',
        lodge: 'template_lodge_default'
      },
      numbering: {
        prefix: {
          restaurant: 'RES',
          bar: 'BAR',
          lodge: 'LDG',
          invoice: 'INV'
        },
        counter_length: 6,
        reset_frequency: 'daily'
      },
      printing: {
        paper_size: '80mm',
        copies: 1,
        auto_cut: true
      },
      email: {
        from_address: 'receipts@restaurant.com',
        from_name: 'Restaurant POS',
        subject_template: 'Receipt {{receipt_number}} from {{business_name}}',
        body_template: 'Thank you for your business. Please find your receipt attached.',
        include_pdf: true
      }
    };
  }

  private initializeEventHandlers(): void {
    // Listen to order completions for automatic receipt generation
    this.eventEmitter.on('order_completed', (data) => {
      this.generateReceiptFromOrder(data);
    });

    // Listen to payment confirmations
    this.eventEmitter.on('payment_confirmed', (data) => {
      this.updateReceiptPayment(data);
    });

    // Listen to reservation confirmations for lodge invoices
    this.eventEmitter.on('reservation_confirmed', (data) => {
      this.generateInvoiceFromReservation(data);
    });
  }

  private loadDefaultTemplates(): void {
    // Restaurant Invoice Template
    const restaurantInvoiceTemplate: ReceiptTemplate = {
      id: 'template_restaurant_default',
      name: 'Restaurant Invoice Default',
      business_type: 'restaurant',
      template_type: 'invoice',
      header: {
        content: `{{business_name}}
{{business_address}}
{{business_phone}} | {{business_email}}
TAX: {{business_tax_number}}
----------------------------------------
INVOICE
Date: {{date}}
Invoice #: {{receipt_number}}
Staff: {{staff_name}}
Table: {{table_number}}
Customer: {{customer_name}}`,
        variables: ['business_name', 'business_address', 'business_phone', 'business_email', 'business_tax_number', 'date', 'receipt_number', 'staff_name', 'table_number', 'customer_name'],
        alignment: 'center',
        font_size: 12,
        font_weight: 'bold',
        margin_top: 0,
        margin_bottom: 10
      },
      body: {
        content: `{{#each items}}
{{name}} {{quantity}}x @ {{unit_price}}
{{description}}
{{/each}}
----------------------------------------`,
        variables: ['items'],
        alignment: 'left',
        font_size: 10,
        font_weight: 'normal',
        margin_top: 5,
        margin_bottom: 5
      },
      footer: {
        content: `Subtotal: {{subtotal}}
Tax ({{tax_rate}}%): {{tax_amount}}
Service Charge: {{service_charge}}
Discount: {{discount_amount}}
----------------------------------------
TOTAL: {{total_amount}}
{{#each payments}}
{{payment_method}}: {{amount}}
{{/each}}
Balance: {{balance_amount}}
----------------------------------------
Thank you for dining with us!
{{business_website}}`,
        variables: ['subtotal', 'tax_rate', 'tax_amount', 'service_charge', 'discount_amount', 'total_amount', 'payments', 'balance_amount', 'business_website'],
        alignment: 'left',
        font_size: 10,
        font_weight: 'bold',
        margin_top: 10,
        margin_bottom: 0
      },
      styling: {
        paper_width: 80,
        paper_height: 0,
        font_family: 'monospace',
        font_size_base: 10,
        line_height: 1.2,
        margins: { top: 5, right: 5, bottom: 5, left: 5 },
        colors: { primary: '#000000', secondary: '#666666', text: '#000000', accent: '#ff6b6b' }
      },
      is_default: true,
      is_active: true,
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Bar Receipt Template
    const barReceiptTemplate: ReceiptTemplate = {
      id: 'template_bar_default',
      name: 'Bar Receipt Default',
      business_type: 'bar',
      template_type: 'receipt',
      header: {
        content: `🍸 {{business_name}} 🍸
{{business_address}}
----------------------------------------
RECEIPT #{{receipt_number}}
{{date}} {{time}}
Bartender: {{staff_name}}`,
        variables: ['business_name', 'business_address', 'receipt_number', 'date', 'time', 'staff_name'],
        alignment: 'center',
        font_size: 12,
        font_weight: 'bold',
        margin_top: 0,
        margin_bottom: 10
      },
      body: {
        content: `{{#each items}}
{{quantity}}x {{name}}.............{{total_price}}
{{/each}}`,
        variables: ['items'],
        alignment: 'left',
        font_size: 10,
        font_weight: 'normal',
        margin_top: 5,
        margin_bottom: 5
      },
      footer: {
        content: `----------------------------------------
Subtotal: {{subtotal}}
Tax: {{tax_amount}}
TOTAL: {{total_amount}}
Paid: {{payment_method}}
Change: {{change_amount}}
----------------------------------------
🍻 Cheers! See you again! 🍻`,
        variables: ['subtotal', 'tax_amount', 'total_amount', 'payment_method', 'change_amount'],
        alignment: 'left',
        font_size: 10,
        font_weight: 'bold',
        margin_top: 10,
        margin_bottom: 0
      },
      styling: {
        paper_width: 58,
        paper_height: 0,
        font_family: 'monospace',
        font_size_base: 9,
        line_height: 1.1,
        margins: { top: 3, right: 3, bottom: 3, left: 3 },
        colors: { primary: '#000000', secondary: '#666666', text: '#000000', accent: '#4ecdc4' }
      },
      is_default: true,
      is_active: true,
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Lodge Invoice Template
    const lodgeInvoiceTemplate: ReceiptTemplate = {
      id: 'template_lodge_default',
      name: 'Lodge Invoice Default',
      business_type: 'lodge',
      template_type: 'invoice',
      header: {
        content: `🏨 {{business_name}} 🏨
{{business_address}}
{{business_phone}} | {{business_email}}
========================================
HOTEL INVOICE
Invoice #: {{receipt_number}}
Date: {{date}}
Guest: {{guest_name}}
Room: {{room_number}}
Check-in: {{check_in_date}}
Check-out: {{check_out_date}}
Nights: {{number_of_nights}}`,
        variables: ['business_name', 'business_address', 'business_phone', 'business_email', 'receipt_number', 'date', 'guest_name', 'room_number', 'check_in_date', 'check_out_date', 'number_of_nights'],
        alignment: 'center',
        font_size: 11,
        font_weight: 'bold',
        margin_top: 0,
        margin_bottom: 10
      },
      body: {
        content: `ROOM CHARGES:
{{room_type}} - {{number_of_nights}} nights @ {{room_rate}}/night
{{#each additional_items}}
{{name}} {{quantity}}x @ {{unit_price}}
{{/each}}
----------------------------------------`,
        variables: ['room_type', 'number_of_nights', 'room_rate', 'additional_items'],
        alignment: 'left',
        font_size: 10,
        font_weight: 'normal',
        margin_top: 5,
        margin_bottom: 5
      },
      footer: {
        content: `Room Charges: {{room_charges}}
Additional Services: {{additional_charges}}
Tax: {{tax_amount}}
Service Charge: {{service_charge}}
--------------------------------========
TOTAL: {{total_amount}}
Payment: {{payment_method}}
========================================
We hope you enjoyed your stay!
{{business_website}}`,
        variables: ['room_charges', 'additional_charges', 'tax_amount', 'service_charge', 'total_amount', 'payment_method', 'business_website'],
        alignment: 'left',
        font_size: 10,
        font_weight: 'bold',
        margin_top: 10,
        margin_bottom: 0
      },
      styling: {
        paper_width: 80,
        paper_height: 0,
        font_family: 'monospace',
        font_size_base: 10,
        line_height: 1.2,
        margins: { top: 5, right: 5, bottom: 5, left: 5 },
        colors: { primary: '#000000', secondary: '#666666', text: '#000000', accent: '#f7b731' }
      },
      is_default: true,
      is_active: true,
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };

    this.templates.set(restaurantInvoiceTemplate.id, restaurantInvoiceTemplate);
    this.templates.set(barReceiptTemplate.id, barReceiptTemplate);
    this.templates.set(lodgeInvoiceTemplate.id, lodgeInvoiceTemplate);
  }

  private initializeCounters(): void {
    // Initialize receipt counters
    this.counters.set('restaurant', 1);
    this.counters.set('bar', 1);
    this.counters.set('lodge', 1);
    this.counters.set('invoice', 1);
  }

  // Generate receipt number
  private generateReceiptNumber(businessType: 'restaurant' | 'bar' | 'lodge', receiptType: 'invoice' | 'receipt' = 'receipt'): string {
    const counterKey = receiptType === 'invoice' ? 'invoice' : businessType;
    const currentCounter = this.counters.get(counterKey) || 1;
    const prefix = this.config.numbering.prefix[receiptType === 'invoice' ? 'invoice' : businessType];
    const paddedCounter = currentCounter.toString().padStart(this.config.numbering.counter_length, '0');

    // Increment counter
    this.counters.set(counterKey, currentCounter + 1);

    return `${prefix}${paddedCounter}`;
  }

  // Create receipt from order
  generateReceiptFromOrder(orderData: {
    order_id: string;
    order_number: string;
    business_type: 'restaurant' | 'bar' | 'lodge';
    customer_name?: string;
    table_id?: string;
    room_id?: string;
    items: Array<{
      product_name: string;
      description?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      category?: string;
    }>;
    subtotal: number;
    tax: number;
    service_charge: number;
    discount: number;
    total_amount: number;
    payment_status: string;
    staff_name: string;
    staff_id: string;
  }): Receipt | null {
    const templateId = this.config.default_template[orderData.business_type];
    const template = this.templates.get(templateId);

    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }

    const receipt: Receipt = {
      id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receipt_number: this.generateReceiptNumber(orderData.business_type, 'receipt'),
      template_id: templateId,
      order_id: orderData.order_id,
      business_type: orderData.business_type,
      receipt_type: 'receipt',
      customer_name: orderData.customer_name,
      items: orderData.items.map(item => ({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        category: item.category
      })),
      summary: {
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax,
        service_charge: orderData.service_charge,
        discount_amount: orderData.discount,
        rounding: 0,
        total_amount: orderData.total_amount,
        paid_amount: orderData.payment_status === 'paid' ? orderData.total_amount : 0,
        balance_amount: orderData.payment_status === 'paid' ? 0 : orderData.total_amount
      },
      payments: [],
      totals: {
        items_count: orderData.items.length,
        total_quantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        average_item_price: orderData.total_amount / orderData.items.length,
        total_tax: orderData.tax,
        total_service_charge: orderData.service_charge,
        grand_total: orderData.total_amount
      },
      generated_by: orderData.staff_id,
      generated_at: new Date(),
      status: 'generated',
      notes: `Order: ${orderData.order_number}`
    };

    this.receipts.set(receipt.id, receipt);

    // Emit receipt generated event
    eventSystem.emit('receipt_generated', {
      receipt_id: receipt.id,
      receipt_number: receipt.receipt_number,
      order_id: orderData.order_id,
      business_type: orderData.business_type,
      total_amount: receipt.total_amount,
      staff_id: orderData.staff_id
    }, 'receipt_service');

    // Auto-print if configured
    if (this.config.auto_print) {
      this.printReceipt(receipt.id);
    }

    // Auto-email if configured and customer email is available
    if (this.config.auto_email && orderData.customer_name) {
      // This would require customer email information
    }

    return receipt;
  }

  // Generate invoice from reservation
  generateInvoiceFromReservation(reservationData: {
    reservation_id: string;
    guest_name: string;
    room_number: string;
    room_type: string;
    check_in_date: Date;
    check_out_date: Date;
    room_rate: number;
    additional_charges?: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }): Receipt | null {
    const templateId = this.config.default_template.lodge;
    const template = this.templates.get(templateId);

    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }

    const numberOfNights = Math.ceil((reservationData.check_out_date.getTime() - reservationData.check_in_date.getTime()) / (1000 * 60 * 60 * 24));
    const roomCharges = numberOfNights * reservationData.room_rate;
    const additionalCharges = reservationData.additional_charges?.reduce((sum, item) => sum + item.total_price, 0) || 0;
    const subtotal = roomCharges + additionalCharges;
    const taxAmount = subtotal * 0.12; // 12% tax for lodge
    const serviceCharge = subtotal * 0.05; // 5% service charge
    const totalAmount = subtotal + taxAmount + serviceCharge;

    const items = [
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${reservationData.room_type} - Room Charge`,
        description: `${numberOfNights} nights @ ${reservationData.room_rate}/night`,
        quantity: numberOfNights,
        unit_price: reservationData.room_rate,
        total_price: roomCharges,
        category: 'room'
      },
      ...(reservationData.additional_charges?.map(item => ({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        description: '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        category: 'service'
      })) || [])
    ];

    const receipt: Receipt = {
      id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receipt_number: this.generateReceiptNumber('lodge', 'invoice'),
      template_id: templateId,
      reservation_id: reservationData.reservation_id,
      business_type: 'lodge',
      receipt_type: 'invoice',
      customer_name: reservationData.guest_name,
      items,
      summary: {
        subtotal,
        tax_amount: taxAmount,
        service_charge: serviceCharge,
        discount_amount: 0,
        rounding: 0,
        total_amount: totalAmount,
        paid_amount: 0,
        balance_amount: totalAmount
      },
      payments: [],
      totals: {
        items_count: items.length,
        total_quantity: numberOfNights + (reservationData.additional_charges?.reduce((sum, item) => sum + item.quantity, 0) || 0),
        average_item_price: totalAmount / items.length,
        total_tax: taxAmount,
        total_service_charge: serviceCharge,
        grand_total: totalAmount
      },
      generated_by: 'system',
      generated_at: new Date(),
      status: 'generated',
      notes: `Reservation: ${reservationData.reservation_id}`
    };

    this.receipts.set(receipt.id, receipt);

    // Emit invoice generated event
    eventSystem.emit('invoice_generated', {
      receipt_id: receipt.id,
      receipt_number: receipt.receipt_number,
      reservation_id: reservationData.reservation_id,
      guest_name: reservationData.guest_name,
      room_number: reservationData.room_number,
      total_amount: totalAmount
    }, 'receipt_service');

    return receipt;
  }

  // Update receipt with payment information
  updateReceiptPayment(paymentData: {
    receipt_id?: string;
    order_id?: string;
    payment_method: 'cash' | 'card' | 'mobile' | 'transfer' | 'room_charge';
    amount: number;
    transaction_id?: string;
    card_last_four?: string;
    processed_by: string;
  }): boolean {
    let receipt: Receipt | undefined;

    if (paymentData.receipt_id) {
      receipt = this.receipts.get(paymentData.receipt_id);
    } else if (paymentData.order_id) {
      receipt = Array.from(this.receipts.values()).find(r => r.order_id === paymentData.order_id);
    }

    if (!receipt) return false;

    const payment: ReceiptPayment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payment_method: paymentData.payment_method,
      amount: paymentData.amount,
      transaction_id: paymentData.transaction_id,
      card_last_four: paymentData.card_last_four,
      processed_by: paymentData.processed_by,
      processed_at: new Date()
    };

    receipt.payments.push(payment);
    receipt.summary.paid_amount += paymentData.amount;
    receipt.summary.balance_amount = receipt.summary.total_amount - receipt.summary.paid_amount;

    if (receipt.summary.balance_amount <= 0) {
      receipt.status = 'printed'; // Mark as completed
    }

    // Emit payment updated event
    eventSystem.emit('receipt_payment_updated', {
      receipt_id: receipt.id,
      payment_id: payment.id,
      payment_method: paymentData.payment_method,
      amount: paymentData.amount,
      balance_amount: receipt.summary.balance_amount
    }, 'receipt_service');

    return true;
  }

  // Print receipt
  printReceipt(receiptId: string): boolean {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) return false;

    const template = this.templates.get(receipt.template_id);
    if (!template) return false;

    // Generate formatted receipt content
    const content = this.generateReceiptContent(receipt, template);

    // Here you would integrate with actual printer hardware
    console.log('Printing receipt:', receipt.receipt_number);
    console.log('Content:', content);

    receipt.printed_at = new Date();
    receipt.status = 'printed';

    // Emit receipt printed event
    eventSystem.emit('receipt_printed', {
      receipt_id: receiptId,
      receipt_number: receipt.receipt_number,
      printer_name: this.config.printing.printer_name
    }, 'receipt_service');

    return true;
  }

  // Generate receipt content from template
  private generateReceiptContent(receipt: Receipt, template: ReceiptTemplate): string {
    // This would implement template rendering with variable substitution
    // For now, return a simple formatted version
    const variables = {
      business_name: 'My Restaurant & Bar',
      business_address: '123 Main St, City',
      business_phone: '+1-555-0123',
      business_email: 'info@restaurant.com',
      receipt_number: receipt.receipt_number,
      date: receipt.generated_at.toLocaleDateString(),
      time: receipt.generated_at.toLocaleTimeString(),
      staff_name: receipt.generated_by,
      customer_name: receipt.customer_name || 'Guest',
      items: receipt.items,
      subtotal: receipt.summary.subtotal.toFixed(2),
      tax_amount: receipt.summary.tax_amount.toFixed(2),
      service_charge: receipt.summary.service_charge.toFixed(2),
      total_amount: receipt.summary.total_amount.toFixed(2),
      payments: receipt.payments
    };

    let content = '';

    // Header
    content += template.header.content + '\n';
    content += '-'.repeat(template.styling.paper_width / 2) + '\n';

    // Items
    receipt.items.forEach(item => {
      content += `${item.quantity}x ${item.name.padEnd(20)} ${item.total_price.toFixed(2).padStart(8)}\n`;
    });

    content += '-'.repeat(template.styling.paper_width / 2) + '\n';

    // Totals
    content += `Subtotal: ${receipt.summary.subtotal.toFixed(2)}\n`;
    content += `Tax: ${receipt.summary.tax_amount.toFixed(2)}\n`;
    content += `Service: ${receipt.summary.service_charge.toFixed(2)}\n`;
    content += `Total: ${receipt.summary.total_amount.toFixed(2)}\n`;

    if (receipt.payments.length > 0) {
      receipt.payments.forEach(payment => {
        content += `${payment.payment_method}: ${payment.amount.toFixed(2)}\n`;
      });
    }

    // Footer
    content += template.footer.content + '\n';

    return content;
  }

  // Email receipt
  emailReceipt(receiptId: string, emailAddress: string): boolean {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) return false;

    // Generate PDF or formatted content
    const template = this.templates.get(receipt.template_id);
    if (!template) return false;

    const content = this.generateReceiptContent(receipt, template);

    // Here you would integrate with email service
    console.log(`Emailing receipt ${receipt.receipt_number} to ${emailAddress}`);

    receipt.emailed_to = emailAddress;
    receipt.status = 'sent';

    // Emit receipt emailed event
    eventSystem.emit('receipt_emailed', {
      receipt_id: receiptId,
      receipt_number: receipt.receipt_number,
      email_address: emailAddress
    }, 'receipt_service');

    return true;
  }

  // Get receipt by ID
  getReceipt(receiptId: string): Receipt | null {
    return this.receipts.get(receiptId) || null;
  }

  // Get receipts by order
  getReceiptsByOrder(orderId: string): Receipt[] {
    return Array.from(this.receipts.values()).filter(receipt => receipt.order_id === orderId);
  }

  // Get receipts by date range
  getReceiptsByDateRange(startDate: Date, endDate: Date, businessType?: 'restaurant' | 'bar' | 'lodge'): Receipt[] {
    let receipts = Array.from(this.receipts.values()).filter(receipt =>
      receipt.generated_at >= startDate && receipt.generated_at <= endDate
    );

    if (businessType) {
      receipts = receipts.filter(receipt => receipt.business_type === businessType);
    }

    return receipts;
  }

  // Create custom template
  createTemplate(templateData: Partial<ReceiptTemplate>, createdBy: string): ReceiptTemplate {
    const template: ReceiptTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateData.name || 'Custom Template',
      business_type: templateData.business_type || 'all',
      template_type: templateData.template_type || 'receipt',
      header: templateData.header || {
        content: '{{business_name}}\n{{receipt_number}}',
        variables: ['business_name', 'receipt_number'],
        alignment: 'center',
        font_size: 12,
        font_weight: 'bold',
        margin_top: 0,
        margin_bottom: 10
      },
      body: templateData.body || {
        content: '{{#each items}}{{name}} {{quantity}}x {{unit_price}}{{/each}}',
        variables: ['items'],
        alignment: 'left',
        font_size: 10,
        font_weight: 'normal',
        margin_top: 5,
        margin_bottom: 5
      },
      footer: templateData.footer || {
        content: 'Total: {{total_amount}}\nThank you!',
        variables: ['total_amount'],
        alignment: 'center',
        font_size: 10,
        font_weight: 'normal',
        margin_top: 10,
        margin_bottom: 0
      },
      styling: templateData.styling || {
        paper_width: 80,
        paper_height: 0,
        font_family: 'monospace',
        font_size_base: 10,
        line_height: 1.2,
        margins: { top: 5, right: 5, bottom: 5, left: 5 },
        colors: { primary: '#000000', secondary: '#666666', text: '#000000', accent: '#007bff' }
      },
      is_default: false,
      is_active: true,
      created_by: createdBy,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.templates.set(template.id, template);

    // Emit template created event
    eventSystem.emit('receipt_template_created', {
      template_id: template.id,
      template_name: template.name,
      business_type: template.business_type,
      created_by: createdBy
    }, 'receipt_service');

    return template;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ReceiptConfig>): void {
    this.config = { ...this.config, ...newConfig };

    eventSystem.emit('receipt_config_updated', {
      updated_config: newConfig
    }, 'receipt_service');
  }

  // Get current configuration
  getConfig(): ReceiptConfig {
    return { ...this.config };
  }

  // Event emitter methods
  on(eventType: string, callback: (data: any) => void): void {
    this.eventEmitter.on(eventType, callback);
  }

  emit(eventType: string, data: any): void {
    this.eventEmitter.emit(eventType, data);
  }
}

// Singleton instance
const receiptService = new ReceiptService();
export default receiptService;