import React, { createContext, useContext, useState, useEffect } from 'react';
import { contenidoApi } from '@/lib/api';

export interface HomeContent {
  hero: {
    badge: string; title: string; highlightText: string;
    subtitle: string; description: string;
    primaryButtonText: string; secondaryButtonText: string;
  };
  previewCards: {
    matricula: { title: string; subtitle: string };
    profesionales: { title: string; subtitle: string };
    tarifario: { title: string; subtitle: string };
  };
  footer: { description: string; email: string;};
}

export interface DashboardContent {
  welcome: { title: string; subtitle: string };
  cards: {
    estadoMatricula: { title: string; alDia: string; deuda: string };
    proximoVencimiento: { title: string };
    notificaciones: { title: string; emptyMessage: string };
    accesoDirecto: { title: string; directorioText: string; tarifarioText: string };
    tarifario: { title: string; description: string };
  };
}

interface ContentContextType {
  homeContent: HomeContent;
  dashboardContent: DashboardContent;
  updateHomeContent: (content: Partial<HomeContent>) => Promise<boolean>;
  updateDashboardContent: (content: Partial<DashboardContent>) => Promise<boolean>;
  updateHomeHero: (hero: Partial<HomeContent['hero']>) => void;
  updateHomePreviewCards: (cards: Partial<HomeContent['previewCards']>) => void;
  updateHomeFooter: (footer: Partial<HomeContent['footer']>) => void;
  updateDashboardWelcome: (welcome: Partial<DashboardContent['welcome']>) => void;
  updateDashboardCards: (cards: Partial<DashboardContent['cards']>) => void;
}

const defaultHomeContent: HomeContent = {
  hero: {
    badge: 'Sistema de Matrículas Profesionales',
    title: 'Colegio de ',
    highlightText: 'Diseñadores Gráficos',
    subtitle: ' de Misiones',
    description: 'Sistema integral de gestión de matrículas profesionales. Formá parte de nuestra gran comunidad.',
    primaryButtonText: 'Acceder al sistema',
    secondaryButtonText: 'Ver Directorio',
  },
  previewCards: {
    matricula: { title: 'Sistema de Matrículas Profesionales', subtitle: 'Colegio de Diseñadores Gráficos de Misiones' },
    profesionales: { title: 'Profesionales', subtitle: '500+ matriculados' },
    tarifario: { title: 'Acceso al Tarifario para Profesionales', subtitle: 'Valores actualizados' },
  },
  footer: {
    description: 'Representando y regulando la actividad del diseño gráfico en la provincia de Misiones.',
    email: 'contacto@colegiodgmisiones.org',
  },
};

const defaultDashboardContent: DashboardContent = {
  welcome: { title: '¡Bienvenido!', subtitle: 'Este es tu panel de control personalizado.' },
  cards: {
    estadoMatricula: { title: 'Estado de Matrícula', alDia: 'Al día', deuda: 'En deuda' },
    proximoVencimiento: { title: 'Próximo Vencimiento' },
    notificaciones: { title: 'Notificaciones', emptyMessage: 'No tenés notificaciones pendientes' },
    accesoDirecto: { title: 'Acceso Directo', directorioText: 'Ver Directorio', tarifarioText: 'Ver Tarifario' },
    tarifario: { title: 'Tarifario de Referencia', description: 'Valores orientativos para servicios de diseño gráfico profesional.' },
  },
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

// Save content to API (reads token from localStorage)
// FIX: ahora devuelve si tuvo éxito o no, para que el llamador pueda informar al usuario
async function saveToAPI(home: HomeContent, dash: DashboardContent): Promise<boolean> {
  const token = localStorage.getItem('cdg_token');
  if (!token) return false;
  try {
    await contenidoApi.update(token, {
      home_content: home,
      dashboard_content: dash,
    });
    return true;
  } catch (err) {
    console.error('Error saving content:', err);
    return false;
  }
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [homeContent, setHomeContent] = useState<HomeContent>(defaultHomeContent);
  const [dashboardContent, setDashboardContent] = useState<DashboardContent>(defaultDashboardContent);
  const [loaded, setLoaded] = useState(false);

  // Load content from API on mount
  useEffect(() => {
    contenidoApi.get()
      .then((data) => {
        if (data?.home_content && Object.keys(data.home_content).length > 0) {
          setHomeContent({ ...defaultHomeContent, ...data.home_content });
        }
        if (data?.dashboard_content && Object.keys(data.dashboard_content).length > 0) {
          setDashboardContent({ ...defaultDashboardContent, ...data.dashboard_content });
        }
      })
      .catch(() => {
        // API unavailable — fall back to localStorage
        try {
          const h = localStorage.getItem('cdg_home_content');
          const d = localStorage.getItem('cdg_dashboard_content');
          if (h) setHomeContent(JSON.parse(h));
          if (d) setDashboardContent(JSON.parse(d));
        } catch { /* ignore */ }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Persist to localStorage as fallback cache
  useEffect(() => {
    if (loaded) localStorage.setItem('cdg_home_content', JSON.stringify(homeContent));
  }, [homeContent, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem('cdg_dashboard_content', JSON.stringify(dashboardContent));
  }, [dashboardContent, loaded]);

  // FIX: ahora async — devuelve si el guardado en el backend tuvo éxito
  const updateHomeContent = async (content: Partial<HomeContent>): Promise<boolean> => {
    const next = { ...homeContent, ...content };
    setHomeContent(next);
    return saveToAPI(next, dashboardContent);
  };

  const updateDashboardContent = async (content: Partial<DashboardContent>): Promise<boolean> => {
    const next = { ...dashboardContent, ...content };
    setDashboardContent(next);
    return saveToAPI(homeContent, next);
  };

  const updateHomeHero = (hero: Partial<HomeContent['hero']>) => {
    setHomeContent(prev => {
      const next = { ...prev, hero: { ...prev.hero, ...hero } };
      saveToAPI(next, dashboardContent);
      return next;
    });
  };

  const updateHomePreviewCards = (cards: Partial<HomeContent['previewCards']>) => {
    setHomeContent(prev => {
      const next = { ...prev, previewCards: { ...prev.previewCards, ...cards } };
      saveToAPI(next, dashboardContent);
      return next;
    });
  };

  const updateHomeFooter = (footer: Partial<HomeContent['footer']>) => {
    setHomeContent(prev => {
      const next = { ...prev, footer: { ...prev.footer, ...footer } };
      saveToAPI(next, dashboardContent);
      return next;
    });
  };

  const updateDashboardWelcome = (welcome: Partial<DashboardContent['welcome']>) => {
    setDashboardContent(prev => {
      const next = { ...prev, welcome: { ...prev.welcome, ...welcome } };
      saveToAPI(homeContent, next);
      return next;
    });
  };

  const updateDashboardCards = (cards: Partial<DashboardContent['cards']>) => {
    setDashboardContent(prev => {
      const next = { ...prev, cards: { ...prev.cards, ...cards } };
      saveToAPI(homeContent, next);
      return next;
    });
  };

  return (
    <ContentContext.Provider value={{
      homeContent, dashboardContent,
      updateHomeContent, updateDashboardContent,
      updateHomeHero, updateHomePreviewCards, updateHomeFooter,
      updateDashboardWelcome, updateDashboardCards,
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) throw new Error('useContent must be used within a ContentProvider');
  return context;
};