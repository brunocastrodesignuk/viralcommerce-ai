/**
 * ViralCommerce AI — API client
 * Typed axios wrapper for all backend endpoints.
 */
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Auth token injection — reads from Zustand persist store (key: "viralcommerce-auth")
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("viralcommerce-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        const token: string | undefined = parsed?.state?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore JSON parse errors
    }
  }
  return config;
});

// ─── Types ────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  tags: string[];
  viral_score: number;
  competition_score: number;
  demand_score: number;
  estimated_price_min: number;
  estimated_price_max: number;
  image_urls: string[];
  status: "pending" | "active" | "archived";
  first_detected_at: string;
  updated_at: string;
}

export interface ProductListing {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_url: string;
  cost_price: number;
  shipping_cost: number;
  shipping_days_min: number;
  shipping_days_max: number;
  moq: number;
  sale_price_suggested: number;
  profit_margin_pct: number;
  roi_pct: number;
  in_stock: boolean;
}

export interface Video {
  id: string;
  platform: string;
  url: string;
  title?: string;
  caption?: string;
  hashtags: string[];
  views: number;
  likes: number;
  shares: number;
  comments: number;
  viral_score: number;
  author_handle?: string;
  thumbnail_url?: string;
  published_at: string;
}

export interface Campaign {
  id: string;
  product_id: string;
  name: string;
  network: "meta" | "google" | "tiktok_ads";
  status: "draft" | "running" | "paused" | "completed" | "killed";
  daily_budget: number;
  total_spend: number;
  total_revenue: number;
  roas: number;
  created_at: string;
}

export interface MarketingAssets {
  headline?: string;
  description?: string;
  hook?: string;
  tiktok_script?: string;
  caption?: string;
  landing_page?: string;
}

export interface AnalyticsOverview {
  viral_products_24h: number;
  videos_crawled_today: number;
  top_platform: string;
  total_revenue?: number;
  total_ad_spend?: number;
  avg_roas?: number;
  viral_products_count?: number;
  total_videos_tracked?: number;
  total_conversions?: number;
  avg_ctr?: number;
  active_platforms?: number;
}

export interface Supplier {
  id: string;
  platform: string;
  external_id?: string;
  name: string;
  rating?: number;
  ships_to?: string[];
  is_verified?: boolean;
  store_url?: string;
  listings?: ProductListing[];
}

export interface CrawlerJob {
  id: string;
  platform: string;
  job_type: string;
  target?: string;
  status: "pending" | "running" | "completed" | "failed";
  videos_found?: number;
  error_msg?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface CrawlerStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_videos_found: number;
}

// ─── Products ─────────────────────────────────────────────────

export const productsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    min_viral_score?: number;
    sort_by?: string;
  }) => api.get<{ total: number; items: Product[] }>("/products/", { params }),

  trending: (hours = 24, limit = 10) =>
    api.get<Product[]>("/products/trending", { params: { hours, limit } }),

  get: (id: string) => api.get<Product>(`/products/${id}`),

  getAnalysis: (id: string) => api.get(`/products/${id}/analysis`),

  crawlTikTokShop: (limit = 20) =>
    api.post(`/products/crawl/tiktok-shop`, null, { params: { limit }, timeout: 30000 }),

  getSuppliers: (id: string) => api.get<ProductListing[]>(`/products/${id}/suppliers`),

  findSuppliers: (id: string) =>
    api.post(`/products/${id}/find-suppliers`),

  generateMarketing: (id: string, types: string[]) =>
    api.post<MarketingAssets>(`/products/${id}/generate-marketing`, null, {
      params: { asset_types: types },
    }),

  viralHistory: (id: string, days = 7) =>
    api.get(`/products/${id}/viral-history`, { params: { days } }),
};

// ─── Videos ───────────────────────────────────────────────────

export const videosApi = {
  list: (params?: { platform?: string; min_viral_score?: number; page?: number; limit?: number }) =>
    api.get<Video[]>("/videos/", { params }),

  viral: (limit = 20, platform?: string) =>
    api.get<Video[]>("/videos/viral", { params: { limit, platform } }),

  get: (id: string) => api.get<Video>(`/videos/${id}`),
};

// ─── Campaigns ────────────────────────────────────────────────

export const campaignsApi = {
  list: (status?: string) => api.get<Campaign[]>("/campaigns/", { params: { status } }),
  get: (id: string) => api.get<Campaign>(`/campaigns/${id}`),
  create: (data: Partial<Campaign>) => api.post<Campaign>("/campaigns/", data),
  launch: (id: string) => api.post(`/campaigns/${id}/launch`),
  optimize: (id: string) => api.post(`/campaigns/${id}/optimize`),
  pause: (id: string) => api.post(`/campaigns/${id}/pause`),
  performance: (id: string) => api.get(`/campaigns/${id}/performance`),
};

// ─── Analytics ────────────────────────────────────────────────

export const analyticsApi = {
  getOverview: () =>
    api.get<AnalyticsOverview>("/analytics/overview").then((r) => r.data),
  getPlatformStats: (hours = 24) =>
    api.get("/analytics/platform-stats", { params: { hours } }).then((r) => r.data),
  getViralTimeline: (hours = 168) =>
    api.get("/analytics/viral-timeline", { params: { hours } }).then((r) => r.data),
  getCategoryBreakdown: (hours = 24) =>
    api.get("/analytics/category-breakdown", { params: { hours } }).then((r) => r.data),
  getAdPerformance: () =>
    api.get("/analytics/ad-performance").then((r) => r.data),
  // Legacy aliases (used by dashboard)
  overview: () => api.get<AnalyticsOverview>("/analytics/overview"),
  platformStats: (hours = 24) => api.get("/analytics/platform-stats", { params: { hours } }),
  viralTimeline: (hours = 24) => api.get("/analytics/viral-timeline", { params: { hours } }),
  categoryBreakdown: (hours = 24) =>
    api.get("/analytics/category-breakdown", { params: { hours } }),
};

// ─── Trends ───────────────────────────────────────────────────

export const trendsApi = {
  topHashtags: (limit = 20) => api.get("/trends/hashtags/top", { params: { limit } }),
  hashtagVelocity: (hours = 24) =>
    api.get("/trends/hashtag-velocity", { params: { hours } }),
};

// ─── Suppliers ────────────────────────────────────────────────

export const suppliersApi = {
  list: (params?: { platform?: string; min_rating?: number }) =>
    api.get<Supplier[]>("/suppliers/", { params }).then((r) => r.data),
  get: (id: string) => api.get<Supplier>(`/suppliers/${id}`).then((r) => r.data),
  liveSearch: (q: string, platforms?: string) =>
    api.get("/suppliers/search/live", { params: { q, platforms } }).then((r) => r.data),
};

// ─── Crawler ──────────────────────────────────────────────────

export const crawlerApi = {
  getStats: () => api.get<CrawlerStats>("/crawler/stats").then((r) => r.data),
  getJobs: (limit = 50) =>
    api.get<CrawlerJob[]>("/crawler/jobs", { params: { limit } }).then((r) => r.data),
  startJob: (params: { platform: string; job_type?: string; target?: string }) =>
    api.post("/crawler/jobs/start", null, { params }).then((r) => r.data),
  scanHashtags: () => api.post("/crawler/hashtag-scan").then((r) => r.data),
  // Legacy
  stats: () => api.get("/crawler/stats"),
  jobs: () => api.get("/crawler/jobs"),
};
