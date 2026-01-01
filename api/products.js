import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // GET: Fetch all products
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    // Map DB columns (snake_case) to Frontend (camelCase)
    const mapped = data.map(p => ({
      ...p,
      image: p.image_url,
      salesTrend: p.sales_trend
    }));
    
    return res.status(200).json(mapped);
  }

  // POST: Add new product
  if (req.method === 'POST') {
    const { name, category, stock, price, image, description, salesTrend } = req.body;
    
    const payload = {
      product_code: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name, 
      category, 
      stock, 
      price, 
      image_url: image, 
      description, 
      sales_trend: salesTrend
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    
    // Map back
    const result = {
      ...data[0],
      image: data[0].image_url,
      salesTrend: data[0].sales_trend
    };
    
    return res.status(200).json(result);
  }

  // PUT: Update product
  if (req.method === 'PUT') {
    const { id, name, category, stock, price, image, description, salesTrend } = req.body;
    
    const payload = {
      name, 
      category, 
      stock, 
      price, 
      image_url: image, 
      description, 
      sales_trend: salesTrend,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    
    const result = {
      ...data[0],
      image: data[0].image_url,
      salesTrend: data[0].sales_trend
    };

    return res.status(200).json(result);
  }

  // DELETE: Delete product
  if (req.method === 'DELETE') {
    const { id } = req.query;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Product deleted' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
