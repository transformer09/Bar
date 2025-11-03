import { supabase } from './supabase';

export interface POSSaleData {
  transaction_id: string;
  bartender_id?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total_price: number;
  payment_method: string;
}

export const posService = {
  async processSale(saleData: POSSaleData): Promise<any> {
    try {
      // Check for duplicate transaction
      const { data: existingSale } = await supabase
        .from('bar_sales')
        .select('*')
        .eq('pos_transaction_id', saleData.transaction_id)
        .single();

      if (existingSale) {
        throw new Error('Sale already processed');
      }

      // Get default bartender if not provided
      let bartenderId = saleData.bartender_id;
      if (!bartenderId) {
        const { data: bartenders } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'bartender')
          .limit(1)
          .single();

        bartenderId = bartenders?.id;
      }

      if (!bartenderId) {
        throw new Error('No bartender found');
      }

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from('bar_sales')
        .insert([
          {
            sale_type: 'pos_api',
            bartender_id: bartenderId,
            quantity: saleData.items.reduce((sum, i) => sum + i.quantity, 0),
            unit_price: saleData.total_price,
            total_price: saleData.total_price,
            payment_method: saleData.payment_method,
            pos_transaction_id: saleData.transaction_id,
            custom_item_name: `POS Sale: ${saleData.items.map((i) => i.name).join(', ')}`,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      return sale;
    } catch (error) {
      throw new Error(`POS service error: ${error}`);
    }
  },
};
