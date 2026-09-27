import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  ArrowRightLeft, 
  Wrench, 
  Printer, 
  Check, 
  AlertTriangle, 
  Search, 
  ArrowDownCircle, 
  ArrowUpCircle,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { translations } from '../utils';
import { Product, Warehouse, StockAdjustment, StockTransfer } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface InventoryViewProps {
  lang: 'en' | 'ar';
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  currency: string;
}

export default function InventoryView({
  lang,
  products,
  setProducts,
  warehouses,
  setWarehouses,
  currency
}: InventoryViewProps) {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, action: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteProduct = (id: string) => {
    triggerConfirm(
      lang === 'en' ? "Confirm Product Deletion" : "تأكيد حذف المنتج",
      lang === 'en' ? "Are you sure you want to delete this product?" : "هل أنت متأكد من حذف هذا المنتج؟",
      () => {
        setProducts(products.filter(p => p.id !== id));
      }
    );
  };

  const [activeTab, setActiveTab] = useState<'registry' | 'adjust' | 'transfer' | 'add-product' | 'add-warehouse'>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Add Product Form State
  const [newSku, setNewSku] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameAr, setNewNameAr] = useState(''); // Optional!
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('Pcs');
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [newSellingPrice, setNewSellingPrice] = useState(0);
  const [newVatPercentage, setNewVatPercentage] = useState(15);
  const [newMinStock, setNewMinStock] = useState(5);
  const [newMaxStock, setNewMaxStock] = useState(100);
  const [newWhStocks, setNewWhStocks] = useState<{ [warehouseId: string]: number }>({});

  // Add Warehouse Form State
  const [newWhId, setNewWhId] = useState('');
  const [newWhNameEn, setNewWhNameEn] = useState('');
  const [newWhNameAr, setNewWhNameAr] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');

  // Barcode Simulator modal state
  const [selectedBarcodeProd, setSelectedBarcodeProd] = useState<Product | null>(null);

  // Stock Adjustment Form State
  const [adjProductId, setAdjProductId] = useState('');
  const [adjWarehouseId, setAdjWarehouseId] = useState(warehouses[0]?.id || '');
  const [adjType, setAdjType] = useState<'Addition' | 'Reduction'>('Addition');
  const [adjQty, setAdjQty] = useState(1);
  const [adjReason, setAdjReason] = useState('');

  // Stock Transfer Form State
  const [trProductId, setTrProductId] = useState('');
  const [trFromWarehouseId, setTrFromWarehouseId] = useState(warehouses[0]?.id || '');
  const [trToWarehouseId, setTrToWarehouseId] = useState(warehouses[1]?.id || '');
  const [trQty, setTrQty] = useState(1);

  // 1. Categories list
  const categories = Array.from(new Set(products.map(p => p.category)));

  // 2. Filtered products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.nameAr.includes(searchQuery) ||
                        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.barcode.includes(searchQuery);
    const matchCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  // 3. Process Stock Adjustment
  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!adjProductId) {
      alert(lang === 'en' ? "Please select a product" : "يرجى تحديد المنتج");
      return;
    }

    const prod = products.find(p => p.id === adjProductId)!;
    const currentWhStock = prod.warehouseStock[adjWarehouseId] || 0;

    if (adjType === 'Reduction' && currentWhStock < adjQty) {
      alert(lang === 'en' 
        ? `Insufficient stock in selected warehouse! Available: ${currentWhStock}` 
        : `الكمية المتوفرة في هذا المستودع غير كافية للتخفيض! المتاح: ${currentWhStock}`);
      return;
    }

    const qtyChange = adjType === 'Addition' ? adjQty : -adjQty;

    const updatedProducts = products.map(p => {
      if (p.id === prod.id) {
        return {
          ...p,
          stockLevel: Math.max(0, p.stockLevel + qtyChange),
          warehouseStock: {
            ...p.warehouseStock,
            [adjWarehouseId]: Math.max(0, currentWhStock + qtyChange)
          }
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    alert(lang === 'en' ? "Stock adjusted successfully!" : "تمت تسوية كميات المخزون بنجاح!");
    
    // Reset Form
    setAdjProductId('');
    setAdjQty(1);
    setAdjReason('');
    setActiveTab('registry');
  };

  // 4. Process Stock Transfer
  const handlePostTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trProductId) {
      alert(lang === 'en' ? "Please select a product" : "يرجى تحديد المنتج");
      return;
    }

    if (trFromWarehouseId === trToWarehouseId) {
      alert(lang === 'en' 
        ? "Source and Destination warehouses must be different!" 
        : "المستودع المصدر والمستودع المستهدف يجب أن يكونا مختلفين!");
      return;
    }

    const prod = products.find(p => p.id === trProductId)!;
    const fromWhStock = prod.warehouseStock[trFromWarehouseId] || 0;

    if (fromWhStock < trQty) {
      alert(lang === 'en' 
        ? `Insufficient stock in source warehouse! Available: ${fromWhStock}` 
        : `كمية المخزون في المستودع المصدر غير كافية! المتاح: ${fromWhStock}`);
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.id === prod.id) {
        const toWhStock = p.warehouseStock[trToWarehouseId] || 0;
        return {
          ...p,
          warehouseStock: {
            ...p.warehouseStock,
            [trFromWarehouseId]: Math.max(0, fromWhStock - trQty),
            [trToWarehouseId]: toWhStock + trQty
          }
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    alert(lang === 'en' ? "Stock transferred successfully!" : "تم التحويل المخزني بنجاح!");

    // Reset Form
    setTrProductId('');
    setTrQty(1);
    setActiveTab('registry');
  };

  // Create Product handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameEn) {
      alert(lang === 'en' ? "Please provide an English name for the product." : "يرجى تقديم اسم إنجليزي للمنتج.");
      return;
    }

    const skuVal = newSku.trim() || `SKU-GEN-${Math.floor(1000 + Math.random() * 9000)}`;
    const barcodeVal = newBarcode.trim() || `628${Math.floor(100000000 + Math.random() * 900000000)}`;

    const totalInitialStock = Object.entries(newWhStocks).reduce((sum, [whId, qty]) => sum + (Number(qty) || 0), 0);

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sku: skuVal,
      barcode: barcodeVal,
      nameEn: newNameEn.trim(),
      nameAr: newNameAr.trim() || "", // Optional, can be empty string!
      brand: newBrand.trim() || "Generic",
      category: newCategory.trim() || "General",
      unit: newUnit,
      costPrice: Number(newCostPrice) || 0,
      sellingPrice: Number(newSellingPrice) || 0,
      vatPercentage: Number(newVatPercentage) || 0,
      minStock: Number(newMinStock) || 0,
      maxStock: Number(newMaxStock) || 0,
      stockLevel: totalInitialStock,
      warehouseStock: { ...newWhStocks }
    };

    setProducts(prev => [newProd, ...prev]);
    alert(lang === 'en' ? "Product added successfully!" : "تمت إضافة المنتج بنجاح!");

    // Reset Form
    setNewSku('');
    setNewBarcode('');
    setNewNameEn('');
    setNewNameAr('');
    setNewBrand('');
    setNewCategory('');
    setNewUnit('Pcs');
    setNewCostPrice(0);
    setNewSellingPrice(0);
    setNewVatPercentage(15);
    setNewMinStock(5);
    setNewMaxStock(100);
    setNewWhStocks({});
    setActiveTab('registry');
  };

  // Create Warehouse handler
  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhNameEn) {
      alert(lang === 'en' ? "Please provide an English name for the warehouse." : "يرجى تقديم اسم إنجليزي للمستودع.");
      return;
    }

    const whIdVal = newWhId.trim().toLowerCase().replace(/\s+/g, '-') || `wh-${Date.now()}`;

    // Verify uniqueness
    if (warehouses.some(w => w.id === whIdVal)) {
      alert(lang === 'en' ? "Warehouse with this ID/Code already exists!" : "مستودع بهذا الكود/المعرف موجود بالفعل!");
      return;
    }

    const newWh: Warehouse = {
      id: whIdVal,
      nameEn: newWhNameEn.trim(),
      nameAr: newWhNameAr.trim() || newWhNameEn.trim(),
      location: newWhLocation.trim() || "Riyadh, KSA"
    };

    setWarehouses(prev => [...prev, newWh]);
    alert(lang === 'en' ? "Warehouse registered successfully!" : "تم تسجيل المستودع بنجاح!");

    // Reset Form
    setNewWhId('');
    setNewWhNameEn('');
    setNewWhNameAr('');
    setNewWhLocation('');
    setActiveTab('registry');
  };

  return (
    <div className="space-y-6" id="inventory-module-container">
      {/* Tab Control */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'registry' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {lang === 'en' ? "Stock Registry" : "سجل كميات الأصناف"}
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'adjust' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            {lang === 'en' ? "Adjustment" : "تسوية مخزنية"}
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'transfer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {lang === 'en' ? "Transfer" : "تحويل مخزني"}
          </button>
          <button
            onClick={() => setActiveTab('add-product')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'add-product' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'en' ? "Add Product" : "إضافة صنف جديد"}
          </button>
          <button
            onClick={() => setActiveTab('add-warehouse')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'add-warehouse' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'en' ? "Add Warehouse" : "إضافة مستودع / فرع"}
          </button>
        </div>

        <span className="text-xs text-slate-500 font-bold font-mono">
          {warehouses.length} {lang === 'en' ? "Active Warehouses" : "مستودعات نشطة"}
        </span>
      </div>

      {/* Tab 1: Stock Registry */}
      {activeTab === 'registry' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-base">{lang === 'en' ? "Warehouse Stock Levels" : "أرصدة مخزون المستودعات"}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Consolidated physical count and location distributions" : "أرصدة المخزون الفعلية مفصلة حسب الفروع والمستودعات"}
              </p>
            </div>

            {/* Filter and Search controls */}
            <div className="flex gap-2 self-start md:self-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-100 text-xs p-2 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{lang === 'en' ? "All Categories" : "كل الفئات"}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="relative">
                <Search className={`absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`py-2 ${isRtl ? 'pr-9 pl-4 text-right' : 'pl-9 pr-4'} text-xs bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden`}
                />
              </div>
            </div>
          </div>

          {/* Grid Layout of Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(prod => {
              const isLowStock = prod.stockLevel <= prod.minStock;
              return (
                <div 
                  key={prod.id} 
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isLowStock 
                      ? 'border-amber-200 bg-amber-500/5 hover:bg-amber-500/10 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold">
                        {prod.sku}
                      </span>
                      {isLowStock && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100/55 px-2 py-0.5 rounded font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {lang === 'en' ? "Low Stock" : "مخزون منخفض"}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">
                        {lang === 'en' ? prod.nameEn : prod.nameAr}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {prod.brand} • {prod.category}
                      </p>
                    </div>

                    {/* Warehouse Distribution Bar */}
                    <div className="bg-slate-100/65 rounded-xl p-3 space-y-2 text-[10px]">
                      <span className="font-bold text-slate-500 uppercase block tracking-wider">
                        {lang === 'en' ? "Location Distribution:" : "توزيع الكميات حسب المخزن:"}
                      </span>
                      <div className="space-y-1">
                        {warehouses.map(w => {
                          const stockInWh = prod.warehouseStock[w.id] || 0;
                          return (
                            <div key={w.id} className="flex justify-between text-slate-700">
                              <span className="truncate max-w-[120px]">{lang === 'en' ? w.nameEn : w.nameAr}</span>
                              <span className="font-mono font-bold">{stockInWh} {prod.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{lang === 'en' ? "Selling Price" : "سعر البيع"}</span>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {prod.sellingPrice.toFixed(2)} {currency} <span className="text-[8px] text-slate-400">({prod.vatPercentage}% VAT)</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBarcodeProd(prod)}
                        className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-center cursor-pointer"
                        title={lang === 'en' ? "Print Barcode Label" : "طباعة ملصق الباركود"}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 hover:text-rose-700 transition-colors flex items-center justify-center cursor-pointer"
                        title={lang === 'en' ? "Delete Product" : "حذف المنتج"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="px-3 py-1 bg-slate-950 text-white rounded-xl text-center flex flex-col justify-center min-w-[70px]">
                        <span className="text-xs font-extrabold font-mono">{prod.stockLevel}</span>
                        <span className="text-[8px] opacity-70 uppercase">{prod.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Stock Adjustment Form */}
      {activeTab === 'adjust' && (
        <form onSubmit={handlePostAdjustment} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Wrench className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{lang === 'en' ? "Post Stock Adjustment Note" : "تسجيل مستند تسوية المخزون"}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Adjust inventories directly following annual audits or damages" : "تسوية رصيد الصنف بالزيادة أو النقصان بناءً على عجز أو تلف أو جرد"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Target Product" : "الصنف المستهدف"}</label>
              <select
                value={adjProductId}
                onChange={(e) => setAdjProductId(e.target.value)}
                required
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              >
                <option value="">-- {lang === 'en' ? "Select Product" : "اختر المنتج"} --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {lang === 'en' ? p.nameEn : p.nameAr} ({p.stockLevel} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Select Warehouse" : "تحديد المستودع"}</label>
              <select
                value={adjWarehouseId}
                onChange={(e) => setAdjWarehouseId(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {lang === 'en' ? w.nameEn : w.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Adjustment Action" : "نوع الإجراء"}</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as any)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              >
                <option value="Addition">📈 Stock Addition (زيادة جردية)</option>
                <option value="Reduction">📉 Stock Reduction (عجز / إهلاك)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Quantity to Adjust" : "الكمية لتعديلها"}</label>
              <input
                type="number"
                min="1"
                value={adjQty}
                onChange={(e) => setAdjQty(Number(e.target.value))}
                required
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Reason / Reference Memo" : "السبب ومستند التوثيق"}</label>
              <input
                type="text"
                placeholder="e.g. Broken packaging or Audit variance"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                required
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 text-xs pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {lang === 'en' ? "Apply Adjustment" : "تطبيق التسوية جردياً"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Stock Transfer Form */}
      {activeTab === 'transfer' && (
        <form onSubmit={handlePostTransfer} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{lang === 'en' ? "Post Inter-Warehouse Stock Transfer" : "طلب تحويل بضاعة مخزني داخلي"}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Safely move assets between warehouses without affecting sales records" : "نقل بضاعة بأمان تام بين المستودعات والفروع دون التأثير على حسابات الأرباح"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Target Product" : "الصنف المراد نقله"}</label>
              <select
                value={trProductId}
                onChange={(e) => setTrProductId(e.target.value)}
                required
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              >
                <option value="">-- {lang === 'en' ? "Select Product" : "اختر المنتج"} --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {lang === 'en' ? p.nameEn : p.nameAr} ({p.stockLevel} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Source Warehouse (From)" : "مستودع الشحن (المصدر)"}</label>
              <select
                value={trFromWarehouseId}
                onChange={(e) => setTrFromWarehouseId(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {lang === 'en' ? w.nameEn : w.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Destination Warehouse (To)" : "مستودع الاستلام (الهدف)"}</label>
              <select
                value={trToWarehouseId}
                onChange={(e) => setTrToWarehouseId(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {lang === 'en' ? w.nameEn : w.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Quantity to Transfer" : "الكمية للتحويل"}</label>
              <input
                type="number"
                min="1"
                value={trQty}
                onChange={(e) => setTrQty(Number(e.target.value))}
                required
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Internal Shipping reference" : "رقم مرجع الشحنة"}</label>
              <input
                type="text"
                placeholder="e.g. TR-EXIT-18-TO-SAFA"
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 text-xs pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {lang === 'en' ? "Authorize Transfer" : "اعتماد وترحيل الشحنة"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Add Product Form */}
      {activeTab === 'add-product' && (
        <form onSubmit={handleCreateProduct} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Package className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{lang === 'en' ? "Add New Inventory Product" : "إضافة صنف مخزني جديد"}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Register a new product with custom SKUs, pricing and opening warehouse stocks" : "تسجيل بطاقة مادة جديدة مع تحديد الأسعار والرموز وأرصدة أول المدة"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                {lang === 'en' ? "Product Name (English)" : "اسم المنتج (إنجليزي)"} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. iPhone 15 Pro Max"
                value={newNameEn}
                onChange={(e) => setNewNameEn(e.target.value)}
                required
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                {lang === 'en' ? "Product Name (Arabic - Optional)" : "اسم المنتج (عربي - اختياري)"}
              </label>
              <input
                type="text"
                placeholder="مثال: آيفون 15 برو ماكس"
                value={newNameAr}
                onChange={(e) => setNewNameAr(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "SKU (Leave empty to auto-generate)" : "كود SKU (اتركه فارغاً للتوليد التلقائي)"}</label>
              <input
                type="text"
                placeholder="e.g. APP-IPH15-PRO"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Barcode (Leave empty to auto-generate)" : "الباركود (اتركه فارغاً للتوليد التلقائي)"}</label>
              <input
                type="text"
                placeholder="e.g. 628123456789"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Brand" : "الماركة / الشركة"}</label>
              <input
                type="text"
                placeholder="e.g. Apple"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Category" : "الفئة"}</label>
              <input
                type="text"
                placeholder="e.g. Electronics"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Unit of Measure" : "وحدة القياس"}</label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="Pcs">Pcs (حبة)</option>
                <option value="Box">Box (صندوق)</option>
                <option value="Kg">Kg (كيلو جرام)</option>
                <option value="Meter">Meter (متر)</option>
                <option value="Pack">Pack (عبوة)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Cost Price (Excl. VAT)" : "سعر التكلفة (بدون الضريبة)"}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(Number(e.target.value))}
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Selling Price (Excl. VAT)" : "سعر البيع (بدون الضريبة)"}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "VAT Rate" : "نسبة الضريبة"}</label>
              <select
                value={newVatPercentage}
                onChange={(e) => setNewVatPercentage(Number(e.target.value))}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="15">15% Standard (الأساسية)</option>
                <option value="0">0% Zero-Rated (صفرية)</option>
                <option value="0">Exempt (معفاة)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Minimum Warning Stock Level" : "الحد الأدنى لتنبيه المخزون"}</label>
              <input
                type="number"
                min="0"
                value={newMinStock}
                onChange={(e) => setNewMinStock(Number(e.target.value))}
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">{lang === 'en' ? "Maximum Stock Capacity" : "الحد الأقصى للسعة المخزنية"}</label>
              <input
                type="number"
                min="0"
                value={newMaxStock}
                onChange={(e) => setNewMaxStock(Number(e.target.value))}
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Initial Opening Stocks per Warehouse */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {lang === 'en' ? "Opening Inventory Stock Levels (Initial quantities per Warehouse):" : "أرصدة أول المدة الافتتاحية للمستودعات (الكميات في كل فرع):"}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {warehouses.map(w => (
                <div key={w.id}>
                  <label className="block text-slate-600 font-medium mb-1 truncate">
                    {lang === 'en' ? w.nameEn : w.nameAr}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newWhStocks[w.id] || ''}
                    onChange={(e) => setNewWhStocks({ ...newWhStocks, [w.id]: Number(e.target.value) || 0 })}
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 text-xs pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {lang === 'en' ? "Add Product Card" : "حفظ بطاقة الصنف"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Add Warehouse Form */}
      {activeTab === 'add-warehouse' && (
        <form onSubmit={handleCreateWarehouse} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Plus className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{lang === 'en' ? "Add New Warehouse / Branch Location" : "إضافة مستودع / فرع جديد"}</h3>
              <p className="text-[10px] text-slate-400">
                {lang === 'en' ? "Register a new storage facility or physical point of sale to manage inventory allocation" : "تسجيل منشأة تخزين أو فرع بيع جديد لتوزيع مخزون المنشأة داخلياً"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                {lang === 'en' ? "Warehouse Name (English)" : "اسم المستودع (إنجليزي)"} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dammam Central Warehouse"
                value={newWhNameEn}
                onChange={(e) => setNewWhNameEn(e.target.value)}
                required
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                {lang === 'en' ? "Warehouse Name (Arabic - Optional)" : "اسم المستودع (عربي - اختياري)"}
              </label>
              <input
                type="text"
                placeholder="مثال: مستودع الدمام المركزي"
                value={newWhNameAr}
                onChange={(e) => setNewWhNameAr(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                {lang === 'en' ? "Warehouse Code / ID (e.g. dammam-wh)" : "كود/معرف المستودع (مثال: dammam-wh)"}
              </label>
              <input
                type="text"
                placeholder="Leave empty to auto-generate"
                value={newWhId}
                onChange={(e) => setNewWhId(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl font-mono focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                {lang === 'en' ? "Physical Address / Location" : "العنوان / الموقع الجغرافي"}
              </label>
              <input
                type="text"
                placeholder="e.g. King Fahd Road, Al Khalidiya, Dammam"
                value={newWhLocation}
                onChange={(e) => setNewWhLocation(e.target.value)}
                className="w-full bg-slate-100 p-2 border-none rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 text-xs pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('registry')}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              {lang === 'en' ? "Register Warehouse" : "تسجيل المستودع"}
            </button>
          </div>
        </form>
      )}

      {/* BARCODE PRINT SIMULATOR MODAL */}
      <AnimatePresence>
        {selectedBarcodeProd && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full shadow-2xl space-y-4 text-xs text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Printer className="w-4 h-4" />
                  <h3 className="font-extrabold text-xs uppercase">{lang === 'en' ? "Retail Barcode Tag" : "ملصق الباركود التجاري"}</h3>
                </div>
                <button 
                  onClick={() => setSelectedBarcodeProd(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Barcode Label Area */}
              <div id="barcode-label" className="border border-slate-300 p-4 rounded-lg bg-white text-center space-y-3 font-sans mx-auto max-w-[240px]">
                {/* Store Tag */}
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">
                  {lang === 'en' ? "Al-Riyadah Tech Store" : "مخزن شركة الريادة"}
                </span>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-[10px] leading-tight">
                    {selectedBarcodeProd.nameEn}
                  </h4>
                  <h4 className="font-semibold text-slate-700 text-[9px] leading-tight">
                    {selectedBarcodeProd.nameAr}
                  </h4>
                </div>

                {/* SKU & Price */}
                <div className="flex justify-between items-center px-2 text-[9px] font-mono font-bold text-slate-500">
                  <span>SKU: {selectedBarcodeProd.sku}</span>
                  <span className="text-slate-900">{selectedBarcodeProd.sellingPrice.toFixed(2)} SAR</span>
                </div>

                {/* SVG Barcode Representation */}
                <div className="flex flex-col items-center justify-center space-y-1 py-1">
                  <svg className="w-full h-12" viewBox="0 0 100 40" preserveAspectRatio="none">
                    {/* Simulated bar patterns */}
                    <rect x="5" y="0" width="2" height="40" fill="black" />
                    <rect x="8" y="0" width="1" height="40" fill="black" />
                    <rect x="11" y="0" width="3" height="40" fill="black" />
                    <rect x="16" y="0" width="1" height="40" fill="black" />
                    <rect x="19" y="0" width="2" height="40" fill="black" />
                    <rect x="23" y="0" width="4" height="40" fill="black" />
                    <rect x="29" y="0" width="1" height="40" fill="black" />
                    <rect x="32" y="0" width="2" height="40" fill="black" />
                    <rect x="36" y="0" width="3" height="40" fill="black" />
                    <rect x="41" y="0" width="1" height="40" fill="black" />
                    <rect x="44" y="0" width="2" height="40" fill="black" />
                    <rect x="48" y="0" width="4" height="40" fill="black" />
                    <rect x="54" y="0" width="1" height="40" fill="black" />
                    <rect x="57" y="0" width="2" height="40" fill="black" />
                    <rect x="61" y="0" width="3" height="40" fill="black" />
                    <rect x="66" y="0" width="1" height="40" fill="black" />
                    <rect x="69" y="0" width="2" height="40" fill="black" />
                    <rect x="73" y="0" width="4" height="40" fill="black" />
                    <rect x="79" y="0" width="1" height="40" fill="black" />
                    <rect x="82" y="0" width="2" height="40" fill="black" />
                    <rect x="86" y="0" width="3" height="40" fill="black" />
                    <rect x="91" y="0" width="1" height="40" fill="black" />
                    <rect x="94" y="0" width="2" height="40" fill="black" />
                  </svg>
                  <span className="font-mono text-[9px] tracking-[4px] block">{selectedBarcodeProd.barcode}</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setSelectedBarcodeProd(null)}
                  className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  {lang === 'en' ? "Close" : "إغلاق"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1 hover:bg-blue-700 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t.print}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        lang={lang}
      />
    </div>
  );
}
