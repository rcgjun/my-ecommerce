import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  colors: string[];
  image_url: string;
  created_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  name: string;
  phone: string;
  address: string;
  color: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'returned';
  total_price: number;
  created_at: string;
  products?: Product;
}

// Helper functions
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Product[];
};

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Product;
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  
  if (error) throw error;
  return data as Order;
};

export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (
        title,
        image_url
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Order[];
};

export const updateOrderStatus = async (id: string, status: Order['status']) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Order;
};

export const createProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();
  
  if (error) throw error;
  return data as Product;
};

export const updateProduct = async (id: string, productData: Partial<Product>) => {
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Product;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Auth helpers
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

// Analytics helpers
export const getSalesAnalytics = async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_price, created_at, status');
  
  if (error) throw error;
  
  const totalRevenue = orders
    ?.filter(o => o.status !== 'returned')
    .reduce((sum, order) => sum + order.total_price, 0) || 0;
  
  const totalSold = orders?.filter(o => o.status === 'delivered').length || 0;
  
  // Group by date for chart
  const salesByDate = orders?.reduce((acc: any, order) => {
    if (order.status === 'returned') return acc;
    
    const date = new Date(order.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, count: 0 };
    }
    acc[date].revenue += order.total_price;
    acc[date].count += 1;
    return acc;
  }, {});
  
  const chartData = Object.values(salesByDate || {}).slice(-30); // Last 30 days
  
  return {
    totalRevenue,
    totalSold,
    chartData,
  };
};