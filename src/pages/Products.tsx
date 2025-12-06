import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { mockProducts } from "@/lib/mockData";

const Products = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    price: 0,
    image: "",
    description: ""
  });

  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));

    const savedProducts = localStorage.getItem("products");
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(mockProducts);
      localStorage.setItem("products", JSON.stringify(mockProducts));
    }

    const params = new URLSearchParams(location.search);
    const addName = params.get("add");
    if (addName) {
      setFormData((prev) => ({ ...prev, name: addName }));
      setIsOpen(true);
    }
  }, [navigate, location.search]);

  const generateDescription = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Masukkan nama dan kategori produk terlebih dahulu");
      return;
    }

    setGenerating(true);
    
    // Mock AI Description Generator
    setTimeout(() => {
      const descriptions = [
        `${formData.name} adalah produk ${formData.category.toLowerCase()} berkualitas tinggi yang sempurna untuk konsumsi sehari-hari. Dikemas dengan bahan premium dan standar kualitas terjamin.`,
        `Nikmati kesegaran ${formData.name} dari kategori ${formData.category}. Produk ini sangat populer dan menjadi pilihan favorit pelanggan kami.`,
        `${formData.name} hadir dengan kualitas terbaik di kelasnya. Sebagai bagian dari kategori ${formData.category}, produk ini memberikan nilai maksimal untuk kebutuhan Anda.`
      ];
      
      const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
      setFormData(prev => ({ ...prev, description: randomDescription }));
      setGenerating(false);
      toast.success("Deskripsi AI berhasil dibuat!");
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      const updated = products.map(p => 
        p.id === editingProduct.id ? { ...formData, id: editingProduct.id } : p
      );
      setProducts(updated);
      localStorage.setItem("products", JSON.stringify(updated));
      toast.success("Produk berhasil diupdate!");
    } else {
      const newProduct = {
        ...formData,
        id: Date.now().toString(),
        salesTrend: "+0%"
      };
      const updated = [...products, newProduct];
      setProducts(updated);
      localStorage.setItem("products", JSON.stringify(updated));
      toast.success("Produk berhasil ditambahkan!");
    }
    
    resetForm();
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      stock: product.stock,
      price: product.price,
      image: product.image,
      description: product.description || ""
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    toast.success("Produk berhasil dihapus!");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      stock: 0,
      price: 0,
      image: "",
      description: ""
    });
    setEditingProduct(null);
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Kelola Produk</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary" onClick={() => resetForm()}>
                ➕ Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({...formData, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Minuman">Minuman</SelectItem>
                        <SelectItem value="Makanan">Makanan</SelectItem>
                        <SelectItem value="Snack">Snack</SelectItem>
                        <SelectItem value="Cokelat">Cokelat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="stock">Stok</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Harga (Rp)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="image">URL Gambar</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="description">Deskripsi Produk</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={generating}
                      className="text-xs"
                    >
                      {generating ? "🤖 Generating..." : "🤖 Generate dengan AI"}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Deskripsi akan dibuat otomatis oleh AI..."
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-primary flex-1">
                    {editingProduct ? "Update Produk" : "Simpan Produk"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(product)}
                  className="h-8 w-8 p-0"
                >
                  ✏️
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(product.id)}
                  className="h-8 w-8 p-0"
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Products;
