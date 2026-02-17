import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TranslationProvider } from './hooks/useTranslation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSiteSettings } from './hooks/useSiteSettings';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/admin/LoginPage';
import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import ProductCategories from './components/ProductCategories';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import AdminToolbar from './components/AdminToolbar';
import QuickMenu from './components/QuickMenu';
import CategoryPage from './pages/CategoryPage';
import ContactPage from './pages/ContactPage';
import QuotePage from './pages/QuotePage';
import AboutPage from './pages/AboutPage';
import NewsPage from './pages/NewsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductsPage from './pages/ProductsPage';
import VariantDetailPage from './pages/VariantDetailPage';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ColorManagement from './pages/admin/ColorManagement';
import BrandingManagement from './pages/admin/BrandingManagement';
import AboutManagement from './pages/admin/AboutManagement';
import SliderManagement from './pages/admin/SliderManagement';
import NewsManagement from './pages/admin/NewsManagement';
import ContactMessagesManagement from './pages/admin/ContactMessagesManagement';
import QuoteRequestsManagement from './pages/admin/QuoteRequestsManagement';
import ContactInfoManagement from './pages/admin/ContactInfoManagement';
import DocumentManagement from './pages/admin/DocumentManagement';
import FooterManagement from './pages/admin/FooterManagement';
import LegalPagesManagement from './pages/admin/LegalPagesManagement';
import SMTPManagement from './pages/admin/SMTPManagement';
import MediaManagement from './pages/admin/MediaManagement';
import ProductManagement from './pages/admin/ProductManagement';
import ProductForm from './pages/admin/ProductForm';
import AttributeManagement from './pages/admin/AttributeManagement';
import FilterManagement from './pages/admin/FilterManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import CategoryForm from './pages/admin/CategoryForm';
import NewsletterManagement from './pages/admin/NewsletterManagement';
import AnalyticsManagement from './pages/admin/AnalyticsManagement';
import GeneralSettings from './pages/admin/GeneralSettings';
import HomepageVideoManagement from './pages/admin/HomepageVideoManagement';
import HomepageAboutManagement from './pages/admin/HomepageAboutManagement';
import PagesManagement from './pages/admin/PagesManagement';
import BulkProductImport from './pages/admin/BulkProductImport';
import ProjectManagement from './pages/admin/ProjectManagement';
import ProjectsPage from './pages/ProjectsPage';
import TranslationManagement from './pages/admin/TranslationManagement';
import PopupManagement from './pages/admin/PopupManagement';
import PopupAnnouncement from './components/PopupAnnouncement';
import CookieConsent from './components/CookieConsent';
import LegalPage from './pages/LegalPage';
import { Wrench } from 'lucide-react';

function MaintenancePage({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-white/80" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Bakim Modu</h1>
          <p className="text-white/60 leading-relaxed">
            {message || 'Site bakimda. Kisa sure sonra tekrar hizmetinizdeyiz.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isMaintenanceMode = settings.maintenance_mode === true && !user && !isAdminRoute;

  if (isMaintenanceMode) {
    return <MaintenancePage message={settings.maintenance_message} />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Toaster position="top-right" />
      <PopupAnnouncement />
      <CookieConsent />
      <AdminToolbar />
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />

        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="colors" element={<ColorManagement />} />
          <Route path="branding" element={<BrandingManagement />} />
          <Route path="about" element={<AboutManagement />} />
          <Route path="sliders" element={<SliderManagement />} />
          <Route path="news" element={<NewsManagement />} />
          <Route path="contact-messages" element={<ContactMessagesManagement />} />
          <Route path="quote-requests" element={<QuoteRequestsManagement />} />
          <Route path="contact-info" element={<ContactInfoManagement />} />
          <Route path="documents" element={<DocumentManagement />} />
          <Route path="footer" element={<FooterManagement />} />
          <Route path="legal" element={<LegalPagesManagement />} />
          <Route path="smtp" element={<SMTPManagement />} />
          <Route path="media" element={<MediaManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="products/bulk-import" element={<BulkProductImport />} />
          <Route path="attributes" element={<AttributeManagement />} />
          <Route path="filters" element={<FilterManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="categories/new" element={<CategoryForm />} />
          <Route path="categories/edit/:id" element={<CategoryForm />} />
          <Route path="newsletter" element={<NewsletterManagement />} />
          <Route path="analytics" element={<AnalyticsManagement />} />
          <Route path="settings" element={<GeneralSettings />} />
          <Route path="homepage-video" element={<HomepageVideoManagement />} />
          <Route path="homepage-about" element={<HomepageAboutManagement />} />
          <Route path="pages" element={<PagesManagement />} />
          <Route path="projects" element={<ProjectManagement />} />
          <Route path="translations" element={<TranslationManagement />} />
          <Route path="popups" element={<PopupManagement />} />
        </Route>

        <Route path="/" element={<><Header /><HeroSlider /><ProductCategories /><AboutSection /><Footer /><QuickMenu /></>} />
        <Route path="/urunler" element={<><Header /><ProductsPage /><Footer /><QuickMenu /></>} />
        <Route path="/kategori/:categorySlug" element={<><Header /><CategoryPage /><Footer /><QuickMenu /></>} />
        <Route path="/urun/:productSlug" element={<><Header /><ProductDetailPage /><Footer /><QuickMenu /></>} />
        <Route path="/urun/variant/:variantCode" element={<><Header /><VariantDetailPage /><Footer /><QuickMenu /></>} />
        <Route path="/iletisim" element={<><Header /><ContactPage /><Footer /><QuickMenu /></>} />
        <Route path="/teklif" element={<><Header /><QuotePage /><Footer /><QuickMenu /></>} />
        <Route path="/hakkimizda" element={<><Header /><AboutPage /><Footer /><QuickMenu /></>} />
        <Route path="/haberler" element={<><Header /><NewsPage /><Footer /><QuickMenu /></>} />
        <Route path="/referanslar" element={<><Header /><ProjectsPage /><Footer /><QuickMenu /></>} />
        <Route path="/gizlilik-politikasi" element={<><Header /><LegalPage /><Footer /><QuickMenu /></>} />
        <Route path="/kullanim-sartlari" element={<><Header /><LegalPage /><Footer /><QuickMenu /></>} />
        <Route path="/kvkk" element={<><Header /><LegalPage /><Footer /><QuickMenu /></>} />
        <Route path="/cerez-politikasi" element={<><Header /><LegalPage /><Footer /><QuickMenu /></>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <Router>
          <AppContent />
        </Router>
      </TranslationProvider>
    </AuthProvider>
  );
}

export default App;
