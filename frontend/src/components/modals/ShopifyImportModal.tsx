"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, Product } from "@/lib/api";
import { X, ShoppingBag, CheckCircle, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ShopifyImportModalProps {
  product: Product;
  onClose: () => void;
}

export function ShopifyImportModal({ product, onClose }: ShopifyImportModalProps) {
  const [storeUrl, setStoreUrl]   = useState(
    typeof window !== "undefined" ? localStorage.getItem("shopify_store_url") || "" : ""
  );
  const [accessToken, setAccessToken] = useState(
    typeof window !== "undefined" ? localStorage.getItem("shopify_access_token") || "" : ""
  );
  const [testResult, setTestResult] = useState<{ shop_name: string; shop_domain: string } | null>(null);
  const [importResult, setImportResult] = useState<{ shopify_url: string; admin_url: string; title: string } | null>(null);

  const testMutation = useMutation({
    mutationFn: () =>
      api.post("/shopify/test-connection", {
        shopify_store_url: storeUrl.trim(),
        shopify_access_token: accessToken.trim(),
      }).then(r => r.data),
    onSuccess: (data) => {
      setTestResult(data);
      // Save to localStorage for convenience
      localStorage.setItem("shopify_store_url", storeUrl.trim());
      localStorage.setItem("shopify_access_token", accessToken.trim());
      toast.success(`✅ Conectado: ${data.shop_name}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Erro ao conectar com Shopify");
    },
  });

  const importMutation = useMutation({
    mutationFn: () =>
      api.post("/shopify/import-product", {
        product_id: product.id,
        shopify_store_url: storeUrl.trim(),
        shopify_access_token: accessToken.trim(),
      }).then(r => r.data),
    onSuccess: (data) => {
      setImportResult(data);
      toast.success(`🛍️ "${data.title}" importado para o Shopify!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Erro ao importar produto para Shopify");
    },
  });

  const isValid = storeUrl.includes(".myshopify.com") && accessToken.length > 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importar para Shopify</h2>
              <p className="text-xs text-gray-500 truncate max-w-56">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State */}
        {importResult ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Produto Importado!</h3>
            <p className="text-gray-400 text-sm mb-6">
              "{importResult.title}" foi adicionado como rascunho no seu Shopify.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={importResult.admin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Abrir no Shopify Admin <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Instructions */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs text-gray-400 space-y-1">
              <p className="text-blue-400 font-semibold mb-1">Como obter o token de acesso:</p>
              <p>1. No Shopify Admin → Configurações → Apps e canais de vendas</p>
              <p>2. Desenvolver apps → Criar app → Permissões da API Admin</p>
              <p>3. Ativar: <code className="text-blue-400">write_products, read_products</code></p>
              <p>4. Instalar app e copiar o token gerado</p>
            </div>

            {/* Store URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                URL da Loja Shopify
              </label>
              <input
                type="text"
                value={storeUrl}
                onChange={e => setStoreUrl(e.target.value)}
                placeholder="minha-loja.myshopify.com"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Token de Acesso Admin
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Connection test result */}
            {testResult && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="text-xs">
                  <p className="text-green-400 font-semibold">{testResult.shop_name}</p>
                  <p className="text-gray-500">{testResult.shop_domain}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => testMutation.mutate()}
                disabled={!isValid || testMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Testar Conexão
              </button>
              <button
                onClick={() => importMutation.mutate()}
                disabled={!isValid || !testResult || importMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                Importar
              </button>
            </div>

            {!testResult && isValid && (
              <p className="text-xs text-gray-600 text-center">
                Teste a conexão antes de importar
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
