"use client";

import React, { useState } from "react";
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowDownUp,
  MapPin,
  FileCheck,
  ShieldCheck,
  X,
  CheckCircle2,
  Package,
  Receipt,
  Search,
  Filter,
  Truck,
  AlertCircle,
  Tag,
  Info,
  Pencil,
  Edit3,
} from "lucide-react";
import { MoneyDisplay } from "@/components/shared/money-display";
import { formatINR, formatDate, rupeesToPaise } from "@/lib/format";

interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  hsnCode?: string;
  gstRate: number;
  costPricePaise: number;
  sellingPricePaise: number;
  availableStock: number;
  reorderLevel: number;
  status: "ACTIVE" | "INACTIVE";
}

interface StockMovementRecord {
  id: string;
  date: string;
  type: "PURCHASE" | "OPENING" | "RETURN" | "WASTAGE" | "ADJUSTMENT";
  productSku: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCostPaise: number;
  totalCostPaise: number;
  supplierName?: string;
  invoiceRef?: string;
  batchNumber?: string;
  status: "APPROVED" | "PENDING";
  notes?: string;
  createdAt: string;
}

// Initial Vedro Product Catalog (3 Core Product Lines: Ghee, Mustard Oil, Jaggery)
const INITIAL_VEDRO_PRODUCTS: ProductRecord[] = [
  // 1. Ghee (250ml, 500ml, 1 Litre) -> Dairy & Clarified Butter (HSN 0405, 12% GST)
  {
    id: "prod-ghee-250",
    sku: "VED-GHEE-250ML",
    name: "Pure A2 Desi Cow Bilona Ghee 250ml",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "04059020",
    gstRate: 12,
    costPricePaise: 28000, // ₹280.00
    sellingPricePaise: 39900, // ₹399.00
    availableStock: 0,
    reorderLevel: 25,
    status: "ACTIVE",
  },
  {
    id: "prod-ghee-500",
    sku: "VED-GHEE-500ML",
    name: "Pure A2 Desi Cow Bilona Ghee 500ml",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "04059020",
    gstRate: 12,
    costPricePaise: 55000, // ₹550.00
    sellingPricePaise: 74900, // ₹749.00
    availableStock: 0,
    reorderLevel: 30,
    status: "ACTIVE",
  },
  {
    id: "prod-ghee-1l",
    sku: "VED-GHEE-1LTR",
    name: "Pure A2 Desi Cow Bilona Ghee 1 Litre",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "04059020",
    gstRate: 12,
    costPricePaise: 105000, // ₹1,050.00
    sellingPricePaise: 144900, // ₹1,449.00
    availableStock: 0,
    reorderLevel: 20,
    status: "ACTIVE",
  },

  // 2. Mustard Oil (300ml, 500ml, 1 Ltr, 2 Ltr, 5 Ltr) -> Edible Oils & Fats (HSN 1514, 5% GST)
  {
    id: "prod-oil-300",
    sku: "VED-OIL-300ML",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 300ml",
    category: "Edible Oils & Fats",
    unit: "BOTTLE",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 6000, // ₹60.00
    sellingPricePaise: 8900, // ₹89.00
    availableStock: 0,
    reorderLevel: 50,
    status: "ACTIVE",
  },
  {
    id: "prod-oil-500",
    sku: "VED-OIL-500ML",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 500ml",
    category: "Edible Oils & Fats",
    unit: "BOTTLE",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 9500, // ₹95.00
    sellingPricePaise: 13900, // ₹139.00
    availableStock: 0,
    reorderLevel: 50,
    status: "ACTIVE",
  },
  {
    id: "prod-oil-1l",
    sku: "VED-OIL-1LTR",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 1 Litre",
    category: "Edible Oils & Fats",
    unit: "BOTTLE",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 17500, // ₹175.00
    sellingPricePaise: 24900, // ₹249.00
    availableStock: 0,
    reorderLevel: 40,
    status: "ACTIVE",
  },
  {
    id: "prod-oil-2l",
    sku: "VED-OIL-2LTR",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 2 Litre",
    category: "Edible Oils & Fats",
    unit: "CAN",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 34000, // ₹340.00
    sellingPricePaise: 47900, // ₹479.00
    availableStock: 0,
    reorderLevel: 25,
    status: "ACTIVE",
  },
  {
    id: "prod-oil-5l",
    sku: "VED-OIL-5LTR",
    name: "Cold-Pressed Kachi Ghani Mustard Oil 5 Litre",
    category: "Edible Oils & Fats",
    unit: "TIN",
    hsnCode: "15149100",
    gstRate: 5,
    costPricePaise: 82000, // ₹820.00
    sellingPricePaise: 114900, // ₹1,149.00
    availableStock: 0,
    reorderLevel: 20,
    status: "ACTIVE",
  },

  // 3. Jaggery (500gm, 1 Kg) -> Natural Sweeteners & Jaggery (HSN 1701, 5% GST)
  {
    id: "prod-jag-500",
    sku: "VED-JAG-500GM",
    name: "Natural Chemical-Free Organic Jaggery 500g",
    category: "Natural Sweeteners & Jaggery",
    unit: "POUCH",
    hsnCode: "17011490",
    gstRate: 5,
    costPricePaise: 4500, // ₹45.00
    sellingPricePaise: 6900, // ₹69.00
    availableStock: 0,
    reorderLevel: 50,
    status: "ACTIVE",
  },
  {
    id: "prod-jag-1k",
    sku: "VED-JAG-1KG",
    name: "Natural Chemical-Free Organic Jaggery 1kg",
    category: "Natural Sweeteners & Jaggery",
    unit: "POUCH",
    hsnCode: "17011490",
    gstRate: 5,
    costPricePaise: 8000, // ₹80.00
    sellingPricePaise: 12500, // ₹125.00
    availableStock: 0,
    reorderLevel: 40,
    status: "ACTIVE",
  },
];

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "movements" | "locations">("catalog");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedDrawerProduct, setSelectedDrawerProduct] = useState<ProductRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [products, setProducts] = useState<ProductRecord[]>(INITIAL_VEDRO_PRODUCTS);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);

  // Add Product Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "04059020",
    gstRate: "12",
    costRupees: "",
    sellingRupees: "",
    reorderLevel: "30",
    initialStock: "0",
    notes: "",
  });

  // Stock Movement / Inward Form state
  const [movementForm, setMovementForm] = useState({
    date: "2026-04-15",
    type: "PURCHASE",
    productSku: INITIAL_VEDRO_PRODUCTS[0]?.sku || "",
    quantity: "",
    unitCostRupees: (INITIAL_VEDRO_PRODUCTS[0]?.costPricePaise / 100).toString() || "",
    supplierName: "",
    invoiceRef: "",
    batchNumber: "",
    notes: "",
  });

  const [formError, setFormError] = useState("");
  const [movementFormError, setMovementFormError] = useState("");

  // Edit Product SKU Form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    sku: "",
    name: "",
    category: "Dairy & Clarified Butter",
    unit: "JAR",
    hsnCode: "",
    gstRate: "12",
    costRupees: "",
    sellingRupees: "",
    reorderLevel: "30",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });
  const [editFormError, setEditFormError] = useState("");

  const handleOpenEditModal = (p: ProductRecord) => {
    setEditingProduct(p);
    setEditFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      unit: p.unit,
      hsnCode: p.hsnCode || "",
      gstRate: p.gstRate.toString(),
      costRupees: (p.costPricePaise / 100).toString(),
      sellingRupees: (p.sellingPricePaise / 100).toString(),
      reorderLevel: p.reorderLevel.toString(),
      status: p.status,
    });
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError("");

    if (!editingProduct) return;

    const cost = parseFloat(editFormData.costRupees);
    const selling = parseFloat(editFormData.sellingRupees);
    const reorder = parseInt(editFormData.reorderLevel) || 25;
    const gst = parseFloat(editFormData.gstRate) || 5;

    if (!editFormData.sku.trim()) {
      setEditFormError("Please enter a SKU code.");
      return;
    }

    if (!editFormData.name.trim()) {
      setEditFormError("Please enter the product name.");
      return;
    }

    if (isNaN(cost) || cost < 0) {
      setEditFormError("Please enter a valid cost price.");
      return;
    }

    if (isNaN(selling) || selling <= 0) {
      setEditFormError("Please enter a valid selling price greater than ₹0.");
      return;
    }

    // Check duplicate SKU if changed
    const normalizedNewSku = editFormData.sku.trim().toUpperCase();
    if (
      normalizedNewSku !== editingProduct.sku &&
      products.some((p) => p.sku.toUpperCase() === normalizedNewSku)
    ) {
      setEditFormError(`Product with SKU "${normalizedNewSku}" already exists.`);
      return;
    }

    const updatedProduct: ProductRecord = {
      ...editingProduct,
      sku: normalizedNewSku,
      name: editFormData.name.trim(),
      category: editFormData.category,
      unit: editFormData.unit,
      hsnCode: editFormData.hsnCode.trim() || undefined,
      gstRate: gst,
      costPricePaise: rupeesToPaise(cost),
      sellingPricePaise: rupeesToPaise(selling),
      reorderLevel: reorder,
      status: editFormData.status,
    };

    setProducts((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
    );

    if (selectedDrawerProduct && selectedDrawerProduct.id === editingProduct.id) {
      setSelectedDrawerProduct(updatedProduct);
    }

    setIsEditModalOpen(false);
    setSuccessMessage(`Product SKU "${updatedProduct.sku}" updated successfully!`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const totalInventoryValuePaise = products.reduce(
    (acc, p) => acc + p.availableStock * p.costPricePaise,
    0
  );

  const filteredProducts =
    categoryFilter === "ALL"
      ? products
      : products.filter((p) => p.category === categoryFilter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cost = parseFloat(formData.costRupees);
    const selling = parseFloat(formData.sellingRupees);
    const reorder = parseInt(formData.reorderLevel) || 30;
    const initialQty = parseInt(formData.initialStock) || 0;
    const gst = parseFloat(formData.gstRate) || 5;

    if (!formData.sku.trim()) {
      setFormError("Please enter a SKU code (e.g. VED-GHEE-250ML).");
      return;
    }

    if (!formData.name.trim()) {
      setFormError("Please enter the product name.");
      return;
    }

    if (isNaN(cost) || cost < 0) {
      setFormError("Please enter a valid cost price.");
      return;
    }

    if (isNaN(selling) || selling <= 0) {
      setFormError("Please enter a valid selling price greater than ₹0.");
      return;
    }

    // Check duplicate SKU
    if (products.some((p) => p.sku.toLowerCase() === formData.sku.trim().toLowerCase())) {
      setFormError(`Product with SKU "${formData.sku.trim()}" already exists.`);
      return;
    }

    const newProduct: ProductRecord = {
      id: `prod-${Date.now()}`,
      sku: formData.sku.trim().toUpperCase(),
      name: formData.name.trim(),
      category: formData.category,
      unit: formData.unit,
      hsnCode: formData.hsnCode.trim() || undefined,
      gstRate: gst,
      costPricePaise: rupeesToPaise(cost),
      sellingPricePaise: rupeesToPaise(selling),
      availableStock: Math.max(0, initialQty),
      reorderLevel: reorder,
      status: "ACTIVE",
    };

    setProducts([newProduct, ...products]);
    setIsModalOpen(false);
    setSuccessMessage(`Product SKU "${newProduct.sku}" added successfully!`);

    // If initial stock was provided, also record an OPENING movement
    if (initialQty > 0) {
      const openingMovement: StockMovementRecord = {
        id: `mov-${Date.now()}`,
        date: "2026-04-01",
        type: "OPENING",
        productSku: newProduct.sku,
        productName: newProduct.name,
        quantity: initialQty,
        unit: newProduct.unit,
        unitCostPaise: newProduct.costPricePaise,
        totalCostPaise: initialQty * newProduct.costPricePaise,
        status: "APPROVED",
        notes: "Approved Opening Stock Migration for FY 2026–27",
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [openingMovement, ...prev]);
    }

    setFormData({
      sku: "",
      name: "",
      category: "Dairy & Clarified Butter",
      unit: "JAR",
      hsnCode: "04059020",
      gstRate: "12",
      costRupees: "",
      sellingRupees: "",
      reorderLevel: "30",
      initialStock: "0",
      notes: "",
    });

    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // Handle Log Stock Movement / Inward
  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMovementFormError("");

    const targetProduct = products.find(
      (p) => p.sku.toUpperCase() === movementForm.productSku.toUpperCase()
    );

    if (!targetProduct) {
      setMovementFormError("Please select a registered product SKU.");
      return;
    }

    const qty = parseInt(movementForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setMovementFormError("Please enter a valid positive quantity.");
      return;
    }

    const unitCost = movementForm.unitCostRupees
      ? parseFloat(movementForm.unitCostRupees)
      : targetProduct.costPricePaise / 100;

    const unitCostPaise = rupeesToPaise(unitCost);
    const totalCostPaise = qty * unitCostPaise;

    const newMovement: StockMovementRecord = {
      id: `mov-${Date.now()}`,
      date: movementForm.date,
      type: movementForm.type as any,
      productSku: targetProduct.sku,
      productName: targetProduct.name,
      quantity: qty,
      unit: targetProduct.unit,
      unitCostPaise,
      totalCostPaise,
      supplierName: movementForm.supplierName.trim() || undefined,
      invoiceRef: movementForm.invoiceRef.trim() || undefined,
      batchNumber: movementForm.batchNumber.trim() || undefined,
      status: "APPROVED",
      notes: movementForm.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Update Product Stock Count
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku !== targetProduct.sku) return p;
        let delta = 0;
        if (["PURCHASE", "OPENING", "RETURN"].includes(movementForm.type)) {
          delta = qty;
        } else if (movementForm.type === "WASTAGE") {
          delta = -qty;
        } else {
          delta = qty;
        }
        return { ...p, availableStock: Math.max(0, p.availableStock + delta) };
      })
    );

    setMovements([newMovement, ...movements]);
    setIsMovementModalOpen(false);
    setActiveTab("movements");
    setSuccessMessage(
      `Stock Inward (${movementForm.type}) of ${qty} ${targetProduct.unit} for ${targetProduct.sku} recorded! (Remember to book the supplier bill in Finance).`
    );

    setMovementForm({
      date: "2026-04-15",
      type: "PURCHASE",
      productSku: products[0]?.sku || "",
      quantity: "",
      unitCostRupees: (products[0]?.costPricePaise / 100).toString() || "",
      supplierName: "",
      invoiceRef: "",
      batchNumber: "",
      notes: "",
    });

    setTimeout(() => setSuccessMessage(""), 6000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#493020] uppercase tracking-wider">
              Inventory & Costing
            </span>
            <span className="text-[#77736A] text-xs">•</span>
            <span className="text-xs text-[#77736A]">
              3 Core Product Lines • 10 Active SKUs
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#493020]">
            Products & Inventory Catalog
          </h2>
          <p className="text-xs text-[#77736A] mt-0.5">
            Manage Ghee, Cold-Pressed Mustard Oil, and Organic Jaggery SKUs with approved unit costs, HSN classification, and warehouse stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (products.length === 0) {
                setFormError("Please add at least one Product SKU before recording stock movements.");
                setIsModalOpen(true);
                return;
              }
              setMovementForm((prev) => ({
                ...prev,
                productSku: products[0].sku,
                unitCostRupees: (products[0].costPricePaise / 100).toString(),
              }));
              setIsMovementModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] rounded-xl transition-colors border border-[#E8E2D5] shadow-xs"
          >
            <Truck className="w-3.5 h-3.5 text-[#493020]" />
            <span>+ Log Stock Inward / Purchase</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl transition-all shadow-xs active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Product SKU</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-[#EAF4EE] border border-[#BCDDCB] text-[#28764A] text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#28764A] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Official FMCG Product Category & GST Tax Classification Guide */}
      <div className="bg-[#FCFAF3] border border-[#E8E2D5] rounded-2xl p-4 text-xs shadow-xs">
        <div className="flex items-center gap-2 font-bold text-[#493020] text-xs uppercase tracking-wider mb-2">
          <Info className="w-4 h-4 text-[#E4BF22]" />
          <span>Official Product Classification & GST Tax Mapping</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          {/* Card 1: Ghee */}
          <div className="bg-white p-3 rounded-xl border border-[#E8E2D5]">
            <div className="flex items-center justify-between">
              <strong className="text-[#493020] font-bold">1. Pure Desi Cow Ghee</strong>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#FCF4E8] text-[#A96B13] border border-[#F3DBB6]">
                GST 12%
              </span>
            </div>
            <div className="text-[#77736A] mt-1 space-y-0.5">
              <div><strong>Category:</strong> Dairy & Clarified Butter</div>
              <div><strong>HSN Code:</strong> <span className="font-mono text-[#493020]">04059020</span></div>
              <div><strong>Pack Sizes:</strong> 250ml, 500ml, 1 Litre</div>
            </div>
          </div>

          {/* Card 2: Mustard Oil */}
          <div className="bg-white p-3 rounded-xl border border-[#E8E2D5]">
            <div className="flex items-center justify-between">
              <strong className="text-[#493020] font-bold">2. Mustard Oil (Kachi Ghani)</strong>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#EAF4EE] text-[#28764A] border border-[#BCDDCB]">
                GST 5%
              </span>
            </div>
            <div className="text-[#77736A] mt-1 space-y-0.5">
              <div><strong>Category:</strong> Edible Oils & Fats</div>
              <div><strong>HSN Code:</strong> <span className="font-mono text-[#493020]">15149100</span></div>
              <div><strong>Pack Sizes:</strong> 300ml, 500ml, 1L, 2L, 5L</div>
            </div>
          </div>

          {/* Card 3: Jaggery */}
          <div className="bg-white p-3 rounded-xl border border-[#E8E2D5]">
            <div className="flex items-center justify-between">
              <strong className="text-[#493020] font-bold">3. Organic Jaggery (Gur)</strong>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#EAF4EE] text-[#28764A] border border-[#BCDDCB]">
                GST 5%
              </span>
            </div>
            <div className="text-[#77736A] mt-1 space-y-0.5">
              <div><strong>Category:</strong> Natural Sweeteners & Jaggery</div>
              <div><strong>HSN Code:</strong> <span className="font-mono text-[#493020]">17011490</span></div>
              <div><strong>Pack Sizes:</strong> 500gm, 1 Kg</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div className="flex border-b border-[#E8E2D5] gap-6 text-xs">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "catalog"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Product Catalog ({products.length} SKUs)
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "movements"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Stock Movements & Inward ({movements.length})
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${
            activeTab === "locations"
              ? "border-[#E4BF22] text-[#493020] font-bold"
              : "border-transparent text-[#77736A] hover:text-[#29271F]"
          }`}
        >
          Storage Facilities (1)
        </button>
      </div>

      {/* Tab 1: Product Catalog */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#77736A] mr-1">Filter Line:</span>
            {[
              { id: "ALL", label: `All Products (${products.length})` },
              {
                id: "Dairy & Clarified Butter",
                label: `Ghee (${products.filter((p) => p.category === "Dairy & Clarified Butter").length})`,
              },
              {
                id: "Edible Oils & Fats",
                label: `Mustard Oil (${products.filter((p) => p.category === "Edible Oils & Fats").length})`,
              },
              {
                id: "Natural Sweeteners & Jaggery",
                label: `Jaggery (${products.filter((p) => p.category === "Natural Sweeteners & Jaggery").length})`,
              },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setCategoryFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === btn.id
                    ? "bg-[#493020] text-white shadow-xs font-bold"
                    : "bg-white text-[#77736A] hover:bg-[#F2EBD8] border border-[#E8E2D5]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#E8E2D5] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FCFAF3] border-b border-[#E8E2D5] flex items-center justify-between text-xs font-bold text-[#77736A]">
              <span>Active SKUs ({filteredProducts.length})</span>
              <div className="flex items-center gap-3">
                <span>Total Catalog Inventory Valuation:</span>
                <span className="text-[#493020] font-mono tabular-nums text-sm">
                  <MoneyDisplay paise={totalInventoryValuePaise} />
                </span>
              </div>
            </div>

            {/* Mobile SKU Card View (< md) */}
            <div className="md:hidden divide-y divide-[#E8E2D5]">
              {filteredProducts.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#493020] bg-[#FCFAF3] px-2 py-0.5 rounded border border-[#E8E2D5]">
                        {p.sku}
                      </span>
                      <h4 className="font-bold text-sm text-[#29271F] mt-1.5">{p.name}</h4>
                      <span className="text-[10px] text-[#77736A]">{p.category} • Pack: {p.unit}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                        p.gstRate === 12
                          ? "bg-[#FCF4E8] text-[#A96B13]"
                          : "bg-[#EAF4EE] text-[#28764A]"
                      }`}
                    >
                      {p.gstRate}% GST
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#FCFAF3] p-2.5 rounded-xl text-center border border-[#E8E2D5]/70">
                    <div>
                      <div className="text-[10px] text-[#77736A] font-medium">Cost Price</div>
                      <div className="font-mono text-xs font-semibold text-[#77736A]">
                        {formatINR(p.costPricePaise, false)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#77736A] font-medium">Selling Price</div>
                      <div className="font-mono text-xs font-bold text-[#493020]">
                        {formatINR(p.sellingPricePaise, false)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#77736A] font-medium">On-Hand Stock</div>
                      <div
                        className={`font-mono text-xs font-bold ${
                          p.availableStock <= p.reorderLevel
                            ? "text-[#B83C32]"
                            : "text-[#28764A]"
                        }`}
                      >
                        {p.availableStock} {p.unit}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-[#77736A]">
                      HSN: {p.hsnCode || "—"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] border border-[#E8E2D5] transition-colors"
                      >
                        <Pencil className="w-3 h-3 text-[#493020]" />
                        <span>Edit SKU</span>
                      </button>
                      <button
                        onClick={() => setSelectedDrawerProduct(p)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#77736A] hover:text-[#493020] bg-[#FCFAF3] border border-[#E8E2D5]"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">SKU Code</th>
                    <th className="px-5 py-3">Product Title & Pack Size</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">HSN Code</th>
                    <th className="px-5 py-3">GST Slab</th>
                    <th className="px-5 py-3 text-right">Cost Price (₹)</th>
                    <th className="px-5 py-3 text-right">Selling Price (₹)</th>
                    <th className="px-5 py-3 text-right">On-Hand Stock</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FCFAF3]/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#493020]">
                        {p.sku}
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-[#77736A] font-normal">Pack: {p.unit}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F2EBD8] text-[#493020] border border-[#E8E2D5]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#493020] font-mono text-[11px] font-semibold">
                        {p.hsnCode || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            p.gstRate === 12
                              ? "bg-[#FCF4E8] text-[#A96B13]"
                              : "bg-[#EAF4EE] text-[#28764A]"
                          }`}
                        >
                          {p.gstRate}% GST
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-medium tabular-nums text-[#77736A]">
                        <MoneyDisplay paise={p.costPricePaise} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-[#493020] tabular-nums">
                        <MoneyDisplay paise={p.sellingPricePaise} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            p.availableStock <= p.reorderLevel
                              ? "text-[#B83C32] font-bold"
                              : "text-[#28764A]"
                          }
                        >
                          {p.availableStock} {p.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#493020] bg-[#F2EBD8] hover:bg-[#E8DFC7] border border-[#E8E2D5] transition-colors"
                            title="Edit SKU Details & Pricing"
                          >
                            <Pencil className="w-3 h-3 text-[#493020]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setSelectedDrawerProduct(p)}
                            className="text-[11px] font-bold text-[#77736A] hover:text-[#493020] hover:underline"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movements & Inward Receipts */}
      {activeTab === "movements" && (
        <div className="space-y-4">
          <div className="bg-[#FCFAF3] border border-[#E8E2D5] rounded-2xl p-3.5 flex items-start gap-3 text-xs text-[#29271F]">
            <AlertCircle className="w-4 h-4 text-[#493020] mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <strong>Stock & Inventory Inward:</strong> When raw materials (mustard seeds, dairy, sugarcane) or packaged products (bottles, jars, pouches) arrive from vendors or co-packers, log the physical stock receipt here. This keeps inventory counts, reorder alerts, and warehouse valuation strictly up-to-date.
            </div>
          </div>

          {movements.length === 0 ? (
            <div className="bg-white border border-[#E8E2D5] rounded-2xl p-12 text-center text-[#77736A] shadow-xs">
              <ArrowDownUp className="w-10 h-10 mx-auto mb-2.5 text-[#77736A]/40" />
              <h4 className="font-bold text-[#29271F] text-sm">No Stock Movements Logged</h4>
              <p className="text-xs text-[#77736A] max-w-sm mx-auto mt-1 leading-relaxed">
                Stock is calculated strictly from approved movement records: supplier purchases, opening balances, customer returns, and wastage.
              </p>
              <button
                onClick={() => {
                  setMovementForm((prev) => ({
                    ...prev,
                    productSku: products[0].sku,
                    unitCostRupees: (products[0].costPricePaise / 100).toString(),
                  }));
                  setIsMovementModalOpen(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl transition-all shadow-xs"
              >
                + Log Stock Inward / Purchase
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E2D5] rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCFAF3] border-b border-[#E8E2D5] text-[10px] font-bold text-[#77736A] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Movement Date</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Product SKU & Title</th>
                      <th className="px-5 py-3 text-right">Quantity</th>
                      <th className="px-5 py-3 text-right">Unit Cost (₹)</th>
                      <th className="px-5 py-3 text-right">Total Value (₹)</th>
                      <th className="px-5 py-3">Supplier / Invoice Ref</th>
                      <th className="px-5 py-3">Batch / Lot</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5] text-[#29271F]">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-[#FCFAF3]/80 transition-colors">
                        <td className="px-5 py-3 font-mono text-[#77736A]">
                          {formatDate(m.date)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              m.type === "PURCHASE"
                                ? "bg-[#EAF4EE] text-[#28764A] border-[#BCDDCB]"
                                : m.type === "OPENING"
                                ? "bg-[#FDF8E2] text-[#493020] border-[#E4BF22]/40"
                                : m.type === "WASTAGE"
                                ? "bg-[#FBECEB] text-[#B83C32] border-[#F4C4C0]"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-mono font-bold text-[#493020]">{m.productSku}</div>
                          <div className="text-[11px] text-[#77736A]">{m.productName}</div>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              m.type === "WASTAGE" ? "text-[#B83C32]" : "text-[#28764A]"
                            }
                          >
                            {m.type === "WASTAGE" ? `-${m.quantity}` : `+${m.quantity}`} {m.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums">
                          <MoneyDisplay paise={m.unitCostPaise} />
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold tabular-nums">
                          <MoneyDisplay paise={m.totalCostPaise} />
                        </td>
                        <td className="px-5 py-3 text-[#77736A]">
                          <div>{m.supplierName || "—"}</div>
                          {m.invoiceRef && (
                            <div className="text-[10px] font-mono">Ref: {m.invoiceRef}</div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono text-[#77736A] text-[11px]">
                          {m.batchNumber || "—"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F2EBD8] text-[#493020]">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Locations */}
      {activeTab === "locations" && (
        <div className="bg-white border border-[#E8E2D5] rounded-2xl p-5 shadow-xs max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2EBD8] text-[#493020] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#493020]">Main Central Warehouse</h4>
              <p className="text-[11px] text-[#77736A]">Primary Storage & Dispatch • Active</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8E2D5] flex items-center justify-between text-xs">
            <span className="text-[#77736A]">Registered Active SKUs:</span>
            <span className="font-mono font-bold text-[#493020]">{products.length} SKUs</span>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#493020] leading-tight">
                  Add New Product SKU
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Catalog entry with HSN code, pricing, and reorder alerts
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError("");
                }}
                className="text-[#77736A] hover:text-[#29271F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VED-GHEE-250ML"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Product Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let hsn = "04059020";
                      let gst = "12";
                      if (cat === "Edible Oils & Fats") {
                        hsn = "15149100";
                        gst = "5";
                      } else if (cat === "Natural Sweeteners & Jaggery") {
                        hsn = "17011490";
                        gst = "5";
                      }
                      setFormData({ ...formData, category: cat, hsnCode: hsn, gstRate: gst });
                    }}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="Dairy & Clarified Butter">Dairy & Clarified Butter (Ghee)</option>
                    <option value="Edible Oils & Fats">Edible Oils & Fats (Mustard Oil)</option>
                    <option value="Natural Sweeteners & Jaggery">Natural Sweeteners & Jaggery</option>
                    <option value="Raw Materials / Seeds">Raw Materials & Bulk Seeds</option>
                    <option value="Packaging Supplies">Packaging Bottles & Boxes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#77736A] font-semibold mb-1">
                  Product Title & Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure A2 Desi Cow Bilona Ghee 250ml"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="JAR">JAR (Glass Jar)</option>
                    <option value="BOTTLE">BOTTLE</option>
                    <option value="CAN">CAN (Canister)</option>
                    <option value="TIN">TIN</option>
                    <option value="POUCH">POUCH</option>
                    <option value="KG">KG</option>
                    <option value="LTR">LTR</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    placeholder="04059020"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="0">0% (Nil)</option>
                    <option value="5">5% (Edible Oil & Jaggery)</option>
                    <option value="12">12% (Ghee & Dairy)</option>
                    <option value="18">18% (Snacks/Overheads)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D5]">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Approved Unit Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="280.00"
                    value={formData.costRupees}
                    onChange={(e) => setFormData({ ...formData, costRupees: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Retail Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="399.00"
                    value={formData.sellingRupees}
                    onChange={(e) => setFormData({ ...formData, sellingRupees: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#77736A] hover:text-[#29271F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl shadow-xs transition-colors"
                >
                  Register SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product SKU Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#493020] bg-[#F2EBD8] px-2 py-0.5 rounded uppercase">
                    Modify Catalog Record
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#493020] mt-1">
                  Edit SKU: {editingProduct.sku}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditFormError("");
                }}
                className="text-[#77736A] hover:text-[#29271F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Product Category *
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let hsn = editFormData.hsnCode;
                      let gst = editFormData.gstRate;
                      if (cat === "Dairy & Clarified Butter") {
                        hsn = "04059020";
                        gst = "12";
                      } else if (cat === "Edible Oils & Fats") {
                        hsn = "15149100";
                        gst = "5";
                      } else if (cat === "Natural Sweeteners & Jaggery") {
                        hsn = "17011490";
                        gst = "5";
                      }
                      setEditFormData({ ...editFormData, category: cat, hsnCode: hsn, gstRate: gst });
                    }}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="Dairy & Clarified Butter">Dairy & Clarified Butter (Ghee)</option>
                    <option value="Edible Oils & Fats">Edible Oils & Fats (Mustard Oil)</option>
                    <option value="Natural Sweeteners & Jaggery">Natural Sweeteners & Jaggery</option>
                    <option value="Raw Materials / Seeds">Raw Materials & Bulk Seeds</option>
                    <option value="Packaging Supplies">Packaging Bottles & Boxes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#77736A] font-semibold mb-1">
                  Product Title & Description *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="JAR">JAR (Glass Jar)</option>
                    <option value="BOTTLE">BOTTLE</option>
                    <option value="CAN">CAN (Canister)</option>
                    <option value="TIN">TIN</option>
                    <option value="POUCH">POUCH</option>
                    <option value="KG">KG</option>
                    <option value="LTR">LTR</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={editFormData.hsnCode}
                    onChange={(e) => setEditFormData({ ...editFormData, hsnCode: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={editFormData.gstRate}
                    onChange={(e) => setEditFormData({ ...editFormData, gstRate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="0">0% (Nil)</option>
                    <option value="5">5% (Edible Oil & Jaggery)</option>
                    <option value="12">12% (Ghee & Dairy)</option>
                    <option value="18">18% (Snacks/Overheads)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D5]">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Approved Unit Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.costRupees}
                    onChange={(e) => setEditFormData({ ...editFormData, costRupees: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Retail Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.sellingRupees}
                    onChange={(e) => setEditFormData({ ...editFormData, sellingRupees: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.reorderLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="ACTIVE">ACTIVE (Available for Sales)</option>
                    <option value="INACTIVE">INACTIVE (Discontinued / Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-between">
                <span className="text-[11px] text-[#77736A]">
                  Changes reflect immediately across orders and pricing
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditFormError("");
                    }}
                    className="px-4 py-2 font-semibold text-[#77736A] hover:text-[#29271F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl shadow-xs transition-colors"
                  >
                    Save SKU Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Stock Inward / Purchase Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#493020]/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E8E2D5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
              <div>
                <h3 className="text-sm font-bold text-[#493020] leading-tight">
                  Log Stock Movement / Purchase Inward
                </h3>
                <p className="text-[11px] text-[#77736A]">
                  Receives physical goods into inventory & updates stock counts
                </p>
              </div>
              <button
                onClick={() => {
                  setIsMovementModalOpen(false);
                  setMovementFormError("");
                }}
                className="text-[#77736A] hover:text-[#29271F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {movementFormError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{movementFormError}</span>
              </div>
            )}

            <form onSubmit={handleMovementSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Movement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={movementForm.date}
                    onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Movement Type *
                  </label>
                  <select
                    value={movementForm.type}
                    onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  >
                    <option value="PURCHASE">PURCHASE (Supplier Delivery Inward)</option>
                    <option value="OPENING">OPENING (Initial Verified Count)</option>
                    <option value="RETURN">RETURN (Customer Restocked)</option>
                    <option value="WASTAGE">WASTAGE / SPOILAGE (Damaged)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (Audit Reconciliation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#77736A] font-semibold mb-1">
                  Product / SKU *
                </label>
                <select
                  required
                  value={movementForm.productSku}
                  onChange={(e) => {
                    const sel = products.find((p) => p.sku === e.target.value);
                    setMovementForm({
                      ...movementForm,
                      productSku: e.target.value,
                      unitCostRupees: sel ? (sel.costPricePaise / 100).toString() : "",
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} — {p.name} (Current Stock: {p.availableStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Quantity Inward *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Unit Purchase Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="280.00"
                    value={movementForm.unitCostRupees}
                    onChange={(e) => setMovementForm({ ...movementForm, unitCostRupees: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono font-bold bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy Farms Collective"
                    value={movementForm.supplierName}
                    onChange={(e) => setMovementForm({ ...movementForm, supplierName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Invoice / Challan #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DC-2026-891"
                    value={movementForm.invoiceRef}
                    onChange={(e) => setMovementForm({ ...movementForm, invoiceRef: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Batch / Lot # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BATCH-GHEE-01"
                    value={movementForm.batchNumber}
                    onChange={(e) => setMovementForm({ ...movementForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
                <div>
                  <label className="block text-[#77736A] font-semibold mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received fresh batch in perfect seal"
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E4BF22]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FCFAF3] rounded-xl border border-[#E8E2D5] flex items-center justify-between text-xs">
                <span className="text-[#77736A]">Total Inward Stock Valuation:</span>
                <span className="font-mono font-bold text-[#493020] text-sm">
                  ₹
                  {(
                    (parseInt(movementForm.quantity) || 0) *
                    (parseFloat(movementForm.unitCostRupees) || 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#77736A] hover:text-[#29271F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl shadow-xs transition-colors"
                >
                  Record Stock Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Slide-Over Detail Drawer */}
      {selectedDrawerProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#493020]/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#E8E2D5] p-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
                <div>
                  <span className="text-[10px] font-bold text-[#E4BF22] uppercase tracking-wider bg-[#493020] px-2 py-0.5 rounded">
                    SKU Details
                  </span>
                  <h3 className="text-base font-bold text-[#493020] mt-1.5">
                    {selectedDrawerProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerProduct(null)}
                  className="p-1 rounded-md text-[#77736A] hover:text-[#29271F]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#77736A] block uppercase font-bold tracking-wider mb-1">
                    SKU Code
                  </span>
                  <div className="text-xl font-bold font-mono text-[#493020]">
                    {selectedDrawerProduct.sku}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Category
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {selectedDrawerProduct.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      HSN / Tax Slab
                    </span>
                    <span className="font-semibold text-[#29271F]">
                      {selectedDrawerProduct.hsnCode || "—"} ({selectedDrawerProduct.gstRate}% GST)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Approved Cost Price
                    </span>
                    <span className="font-mono font-bold text-[#29271F]">
                      {formatINR(selectedDrawerProduct.costPricePaise)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Retail Selling Price
                    </span>
                    <span className="font-mono font-bold text-[#493020]">
                      {formatINR(selectedDrawerProduct.sellingPricePaise)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8E2D5]">
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      On-Hand Stock
                    </span>
                    <span className="font-mono text-base font-bold text-[#29271F]">
                      {selectedDrawerProduct.availableStock} {selectedDrawerProduct.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                      Total Stock Value
                    </span>
                    <span className="font-mono text-base font-bold text-[#493020]">
                      {formatINR(selectedDrawerProduct.availableStock * selectedDrawerProduct.costPricePaise)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D5]">
                  <span className="text-[10px] text-[#77736A] block uppercase font-bold">
                    Reorder Alert Level
                  </span>
                  <div className="font-mono text-[#77736A] mt-0.5">
                    Triggers notification when stock falls below {selectedDrawerProduct.reorderLevel} {selectedDrawerProduct.unit}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D5] flex items-center gap-2.5">
              <button
                onClick={() => {
                  handleOpenEditModal(selectedDrawerProduct);
                  setSelectedDrawerProduct(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit SKU Details</span>
              </button>
              <button
                onClick={() => setSelectedDrawerProduct(null)}
                className="py-2 px-4 text-xs font-semibold text-[#77736A] hover:text-[#29271F] bg-[#FCFAF3] hover:bg-[#F2EBD8] rounded-xl transition-colors border border-[#E8E2D5]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
