import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ColorVariation {
  name: string;
  hex: string;
  images: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  variations: ColorVariation[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  product_id: string | null;
  name: string;
  phone: string;
  address: string;
  color: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'returned';
  total_price: number;
  created_at: string;
}

export interface OrderWithProduct extends Order {
  product_title?: string;
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
    
    return (data || []) as Product[];
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
};

export const getProductById = async (id: string): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Product not found');
    }
    
    return data as Product;
  } catch (error) {
    console.error('Error in getProductById:', error);
    throw error;
  }
};

export const createProduct = async (
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<Product> => {
  try {
    console.log('Creating product:', productData);
    
    const { data, error } = await supabase
      .from('products')
      .insert([{
        title: productData.title,
        description: productData.description,
        price: productData.price,
        variations: productData.variations,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating product:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned after creating product');
    }
    
    console.log('Product created successfully:', data);
    return data as Product;
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  productData: Partial<Product>
): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned after updating product');
    }
    
    return data as Product;
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting product:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    throw error;
  }
};

// ============================================
// ORDER FUNCTIONS
// ============================================

export const createOrder = async (
  orderData: Omit<Order, 'id' | 'created_at'>
): Promise<Order> => {
  try {
    console.log('Creating order with data:', orderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        product_id: orderData.product_id,
        name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        color: orderData.color,
        status: orderData.status || 'pending',
        total_price: orderData.total_price
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned after creating order');
    }
    
    console.log('Order created successfully:', data);
    return data as Order;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
};

export const getOrders = async (): Promise<OrderWithProduct[]> => {
  try {
    console.log('Fetching orders from database...');
    
    // First, get all orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Supabase error fetching orders:', ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found in database');
      return [];
    }
    
    console.log(`Found ${ordersData.length} orders`);
    
    // Get product titles for each order
    const ordersWithProducts: OrderWithProduct[] = await Promise.all(
      ordersData.map(async (order) => {
        if (order.product_id) {
          const { data: productData } = await supabase
            .from('products')
            .select('title')
            .eq('id', order.product_id)
            .single();
          
          return {
            ...order,
            product_title: productData?.title || 'Unknown Product'
          } as OrderWithProduct;
        }
        
        return {
          ...order,
          product_title: 'Unknown Product'
        } as OrderWithProduct;
      })
    );
    
    console.log('Orders with products:', ordersWithProducts);
    return ordersWithProducts;
  } catch (error) {
    console.error('Error in getOrders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (
  id: string,
  status: Order['status']
): Promise<Order> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating order:', error);
      throw new Error(`Failed to update order: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned after updating order');
    }
    
    return data as Order;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
};

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export const getSalesAnalytics = async () => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_price, created_at, status');
    
    if (error) {
      console.error('Supabase error fetching analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
    
    const totalRevenue = (orders || [])
      .filter(o => o.status !== 'returned')
      .reduce((sum, order) => sum + (order.total_price || 0), 0);
    
    const totalSold = (orders || []).filter(o => o.status === 'delivered').length;
    
    // Group by date for chart
    const salesByDate = (orders || []).reduce((acc: any, order) => {
      if (order.status === 'returned') return acc;
      
      const date = new Date(order.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, count: 0 };
      }
      acc[date].revenue += order.total_price || 0;
      acc[date].count += 1;
      return acc;
    }, {});
    
    const chartData = Object.values(salesByDate).slice(-30);
    
    return {
      totalRevenue,
      totalSold,
      chartData,
    };
  } catch (error) {
    console.error('Error in getSalesAnalytics:', error);
    throw error;
  }
};

// ============================================
// AUTH FUNCTIONS
// ============================================

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// ============================================
// SETTINGS FUNCTIONS
// ============================================

export const getCoverPhotoUrl = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cover_photo_url')
      .single();
    
    if (error) {
      console.log('No cover photo setting found');
      return 'default';
    }
    
    return data?.value || 'default';
  } catch (error) {
    console.log('Error fetching cover photo, using default');
    return 'default';
  }
};

export const updateCoverPhotoUrl = async (url: string) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'cover_photo_url', 
        value: url,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating cover photo:', error);
      throw new Error(`Failed to update cover photo: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateCoverPhotoUrl:', error);
    throw error;
  }
};