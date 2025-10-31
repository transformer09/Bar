import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

interface ReceiptData {
  order_number: string;
  table_number?: string;
  guest_number?: number;
  waiter_name: string;
  cashier_name?: string;
  order_time: string;
  payment_method?: string;
  subtotal: number;
  tax_amount: number;
  service_charge?: number;
  discount_amount?: number;
  total_amount: number;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    notes?: string;
  }>;
  special_notes?: string;
}

export const receiptService = {
  async generateInvoiceReceipt(orderId: string, userId: string) {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, users(first_name, last_name)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*, bar_recipes(name)')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Get invoice template
      const { data: template, error: templateError } = await supabase
        .from('receipt_templates')
        .select('*')
        .eq('type', 'invoice')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (templateError) console.log('Using default invoice template');

      // Build receipt data
      const receiptData: ReceiptData = {
        order_number: order.order_number,
        table_number: order.table_number,
        guest_number: order.guest_number,
        waiter_name: `${order.users?.first_name} ${order.users?.last_name}`,
        order_time: order.created_at,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        items: orderItems?.map((item: any) => ({
          name: item.bar_recipes?.name || item.custom_item_name || 'Item',
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          notes: item.item_notes,
        })) || [],
      };

      // Generate receipt content
      const receiptContent = this.formatReceiptContent(receiptData, template, 'invoice');

      // Generate unique receipt number
      const receiptNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Store receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('generated_receipts')
        .insert([
          {
            order_id: orderId,
            receipt_template_id: template?.id || uuidv4(),
            receipt_type: 'invoice',
            receipt_number: receiptNumber,
            receipt_content: receiptContent,
            generated_by: userId,
          },
        ])
        .select()
        .single();

      if (receiptError) throw receiptError;

      return receipt;
    } catch (error) {
      throw new Error(`Invoice generation failed: ${error}`);
    }
  },

  async generateFinalReceipt(orderId: string, userId: string) {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, users(first_name, last_name)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*, bar_recipes(name)')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*, payment_methods(name), users(first_name, last_name)')
        .eq('order_id', orderId)
        .eq('payment_status', 'completed');

      if (paymentsError) throw paymentsError;

      // Get final receipt template
      const { data: template, error: templateError } = await supabase
        .from('receipt_templates')
        .select('*')
        .eq('type', 'final_receipt')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (templateError) console.log('Using default final receipt template');

      // Build receipt data
      const receiptData: ReceiptData = {
        order_number: order.order_number,
        table_number: order.table_number,
        guest_number: order.guest_number,
        waiter_name: `${order.users?.first_name} ${order.users?.last_name}`,
        payment_method: payments?.[0]?.payment_methods?.name,
        cashier_name: payments?.[0]?.users
          ? `${payments[0].users.first_name} ${payments[0].users.last_name}`
          : undefined,
        order_time: order.created_at,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        items: orderItems?.map((item: any) => ({
          name: item.bar_recipes?.name || item.custom_item_name || 'Item',
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          notes: item.item_notes,
        })) || [],
      };

      // Generate receipt content
      const receiptContent = this.formatReceiptContent(receiptData, template, 'final_receipt');

      // Generate unique receipt number
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Store receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('generated_receipts')
        .insert([
          {
            order_id: orderId,
            receipt_template_id: template?.id || uuidv4(),
            receipt_type: 'final_receipt',
            receipt_number: receiptNumber,
            receipt_content: receiptContent,
            generated_by: userId,
          },
        ])
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Update order status to completed
      await supabase.from('orders').update({ order_status: 'completed' }).eq('id', orderId);

      return receipt;
    } catch (error) {
      throw new Error(`Final receipt generation failed: ${error}`);
    }
  },

  formatReceiptContent(
    data: ReceiptData,
    template: any,
    receiptType: 'invoice' | 'final_receipt'
  ): string {
    const width = template?.paper_width || 80;
    const separator = '='.repeat(width);
    const dashes = '-'.repeat(width);

    let content = '';

    // Header
    if (template?.header_content) {
      content += `${template.header_content}\n\n`;
    } else {
      content += `${'RESTAURANT RECEIPT'.padStart((width + 15) / 2)}\n`;
    }

    content += separator + '\n\n';

    // Receipt type
    content += `RECEIPT TYPE: ${receiptType === 'invoice' ? 'INVOICE' : 'FINAL RECEIPT'}\n`;
    content += `Receipt #: ${data.order_number}\n`;

    // Waiter and table info
    if (template?.show_waiter_name && data.waiter_name) {
      content += `Waiter: ${data.waiter_name}\n`;
    }
    if (template?.show_table_number && data.table_number) {
      content += `Table: ${data.table_number}\n`;
    }
    if (template?.show_guest_count && data.guest_number) {
      content += `Guests: ${data.guest_number}\n`;
    }

    // Date and time
    const orderDate = new Date(data.order_time).toLocaleString();
    if (template?.show_order_time) {
      content += `Time: ${orderDate}\n`;
    }

    content += '\n' + dashes + '\n';
    content += 'ITEMS\n';
    content += dashes + '\n';

    // Items
    data.items.forEach((item) => {
      const qty = item.quantity.toString().padStart(3);
      const price = `$${item.unit_price.toFixed(2)}`.padStart(10);
      const total = `$${item.line_total.toFixed(2)}`.padStart(10);
      const itemName = item.name.substring(0, width - 25);

      content += `${qty} x ${itemName.padEnd(width - 26)} ${total}\n`;

      if (item.notes && template?.show_item_notes) {
        content += `   NOTE: ${item.notes}\n`;
      }
    });

    // Special notes
    if (data.special_notes) {
      content += `\nSpecial Notes: ${data.special_notes}\n`;
    }

    content += '\n' + dashes + '\n';

    // Totals
    if (template?.show_discount && data.discount_amount && data.discount_amount > 0) {
      content += `Subtotal:        $${data.subtotal.toFixed(2)}\n`;
      content += `Discount:       -$${data.discount_amount.toFixed(2)}\n`;
    } else {
      content += `Subtotal:        $${data.subtotal.toFixed(2)}\n`;
    }

    if (template?.show_tax) {
      content += `Tax:             $${data.tax_amount.toFixed(2)}\n`;
    }

    if (template?.show_service_charge && data.service_charge && data.service_charge > 0) {
      content += `Service Charge:  $${data.service_charge.toFixed(2)}\n`;
    }

    content += separator + '\n';
    content += `TOTAL:           $${data.total_amount.toFixed(2)}\n`;
    content += separator + '\n';

    // Payment info
    if (receiptType === 'final_receipt' && template?.show_payment_method) {
      if (data.payment_method) {
        content += `\nPayment Method: ${data.payment_method}\n`;
      }
      if (template?.show_cashier_name && data.cashier_name) {
        content += `Cashier: ${data.cashier_name}\n`;
      }
    }

    content += '\n';

    // Footer
    if (template?.footer_content) {
      content += `${template.footer_content}\n`;
    } else {
      content += 'Thank you for your visit!\n';
      content += 'Please visit us again soon!\n';
    }

    content += '\n';

    return content;
  },
};
