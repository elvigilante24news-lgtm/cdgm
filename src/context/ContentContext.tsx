import { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";

export interface HomeContent {
  hero: {
    badge: string;
    title: string;
    highlightText: string;
    subtitle: string;
    description: string;
    primaryButtonText: string;
    secondaryButtonText: string;
  };
  previewCards: {
    matricula: { title: string; subtitle: string };
    profesionales: { title: string; subtitle: string };
    tarifario: { title: string; subtitle: string };
  };
  footer: {
    description: string;
    email: string;
    direccion: string;
  };
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
  updateHomeContent: (content: Partial<HomeContent>) => void;
  updateDashboardContent: (content: Partial<DashboardContent>) => void;
  updateHomeHero: (hero: Partial<HomeContent["hero"]>) => void;
  updateHomePreviewCards: (
    cards: Partial<HomeContent["previewCards"]>
  ) => void;
  updateHomeFooter: (footer: Partial<HomeContent["footer"]>) => void;
  updateDashboardWelcome: (
    welcome: Partial<DashboardContent["welcome"]>
  ) => void;
  updateDashboardCards: (
    cards: Partial<DashboardContent["cards"]>
  ) => void;
}

const defaultHomeContent: HomeContent = {
  hero: {
    badge: "Sistema de Matriculas Profesionales",
    title: "Colegio de ",
    highlightText: "Disenadores Graficos",
    subtitle: " de Misiones",
    description:
      "Sistema integral de gestion de matriculas profesionales. Forma parte de nuestra gran comunidad.",
    primaryButtonText: "Acceder al sistema",
    secondaryButtonText: "Ver Directorio",
  },
  previewCards: {
    matricula: {
      title: "Sistema de Matriculas Profesionales ",
      subtitle: "Colegio de Disenadores Graficos de Misiones",
    },
    profesionales: { title: "Profesionales", subtitle: "500+ matriculados" },
    tarifario: {
      title: "Acceso al Tarifario para Profesionales",
      subtitle: "Valores actualizados",
    },
  },
  footer: {
    description:
      "Representando y regulando la actividad del diseno grafico en la provincia de Misiones.",
    email: "contacto@colegiodgmisiones.org",
    direccion: "Posadas, Misiones, Argentina",
  },
};

const defaultDashboardContent: DashboardContent = {
  welcome: {
    title: "Bienvenido!",
    subtitle: "Este es tu panel de control personalizado.",
  },
  cards: {
    estadoMatricula: {
      title: "Estado de Matricula",
      alDia: "Al dia",
      deuda: "En deuda",
    },
    proximoVencimiento: { title: "Proximo Vencimiento" },
    notificaciones: {
      title: "Notificaciones",
      emptyMessage: "No tenes notificaciones pendientes",
    },
    accesoDirecto: {
      title: "Acceso Directo",
      directorioText: "Ver Directorio",
      tarifarioText: "Ver Tarifario",
    },
    tarifario: {
      title: "Tarifario de Referencia",
      description:
        "Valores orientativos para servicios de diseno grafico profesional.",
    },
  },
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [homeContent, setHomeContent] =
    useState<HomeContent>(defaultHomeContent);
  const [dashboardContent, setDashboardContent] = useState<DashboardContent>(
    defaultDashboardContent
  );

  const { data: homeContentData } = trpc.content.byPage.useQuery({
    page: "home",
  });
  const { data: dashboardContentData } = trpc.content.byPage.useQuery({
    page: "dashboard",
  });

  const batchSetMutation = trpc.content.batchSet.useMutation();

  // Transform API data to frontend format
  useEffect(() => {
    if (homeContentData) {
      const hero = homeContentData.hero || {};
      const previewCards = homeContentData.previewCards || {};
      const footer = homeContentData.footer || {};

      setHomeContent({
        hero: {
          badge: hero.badge || defaultHomeContent.hero.badge,
          title: hero.title || defaultHomeContent.hero.title,
          highlightText:
            hero.highlightText || defaultHomeContent.hero.highlightText,
          subtitle: hero.subtitle || defaultHomeContent.hero.subtitle,
          description:
            hero.description || defaultHomeContent.hero.description,
          primaryButtonText:
            hero.primaryButtonText ||
            defaultHomeContent.hero.primaryButtonText,
          secondaryButtonText:
            hero.secondaryButtonText ||
            defaultHomeContent.hero.secondaryButtonText,
        },
        previewCards: {
          matricula: {
            title:
              previewCards.matriculaTitle ||
              defaultHomeContent.previewCards.matricula.title,
            subtitle:
              previewCards.matriculaSubtitle ||
              defaultHomeContent.previewCards.matricula.subtitle,
          },
          profesionales: {
            title:
              previewCards.profesionalesTitle ||
              defaultHomeContent.previewCards.profesionales.title,
            subtitle:
              previewCards.profesionalesSubtitle ||
              defaultHomeContent.previewCards.profesionales.subtitle,
          },
          tarifario: {
            title:
              previewCards.tarifarioTitle ||
              defaultHomeContent.previewCards.tarifario.title,
            subtitle:
              previewCards.tarifarioSubtitle ||
              defaultHomeContent.previewCards.tarifario.subtitle,
          },
        },
        footer: {
          description:
            footer.description || defaultHomeContent.footer.description,
          email: footer.email || defaultHomeContent.footer.email,
          direccion: footer.direccion || defaultHomeContent.footer.direccion,
        },
      });
    }
  }, [homeContentData]);

  useEffect(() => {
    if (dashboardContentData) {
      const welcome = dashboardContentData.welcome || {};
      const cards = dashboardContentData.cards || {};

      setDashboardContent({
        welcome: {
          title: welcome.title || defaultDashboardContent.welcome.title,
          subtitle:
            welcome.subtitle || defaultDashboardContent.welcome.subtitle,
        },
        cards: {
          estadoMatricula: {
            title:
              cards.estadoMatriculaTitle ||
              defaultDashboardContent.cards.estadoMatricula.title,
            alDia:
              cards.estadoMatriculaAlDia ||
              defaultDashboardContent.cards.estadoMatricula.alDia,
            deuda:
              cards.estadoMatriculaDeuda ||
              defaultDashboardContent.cards.estadoMatricula.deuda,
          },
          proximoVencimiento: {
            title:
              cards.proximoVencimientoTitle ||
              defaultDashboardContent.cards.proximoVencimiento.title,
          },
          notificaciones: {
            title:
              cards.notificacionesTitle ||
              defaultDashboardContent.cards.notificaciones.title,
            emptyMessage:
              cards.notificacionesEmpty ||
              defaultDashboardContent.cards.notificaciones.emptyMessage,
          },
          accesoDirecto: {
            title:
              cards.accesoDirectoTitle ||
              defaultDashboardContent.cards.accesoDirecto.title,
            directorioText:
              cards.accesoDirectoDirectorio ||
              defaultDashboardContent.cards.accesoDirecto.directorioText,
            tarifarioText:
              cards.accesoDirectoTarifario ||
              defaultDashboardContent.cards.accesoDirecto.tarifarioText,
          },
          tarifario: {
            title:
              cards.tarifarioTitle ||
              defaultDashboardContent.cards.tarifario.title,
            description:
              cards.tarifarioDescription ||
              defaultDashboardContent.cards.tarifario.description,
          },
        },
      });
    }
  }, [dashboardContentData]);

  const updateHomeContent = (content: Partial<HomeContent>) =>
    setHomeContent((prev) => ({ ...prev, ...content }));

  const updateDashboardContent = (content: Partial<DashboardContent>) =>
    setDashboardContent((prev) => ({ ...prev, ...content }));

  const updateHomeHero = (hero: Partial<HomeContent["hero"]>) => {
    setHomeContent((prev) => {
      const updated = { ...prev, hero: { ...prev.hero, ...hero } };
      // Sync to API
      const values: Record<string, string> = {};
      if (hero.badge !== undefined) values.badge = hero.badge;
      if (hero.title !== undefined) values.title = hero.title;
      if (hero.highlightText !== undefined)
        values.highlightText = hero.highlightText;
      if (hero.subtitle !== undefined) values.subtitle = hero.subtitle;
      if (hero.description !== undefined) values.description = hero.description;
      if (hero.primaryButtonText !== undefined)
        values.primaryButtonText = hero.primaryButtonText;
      if (hero.secondaryButtonText !== undefined)
        values.secondaryButtonText = hero.secondaryButtonText;
      if (Object.keys(values).length > 0) {
        batchSetMutation.mutate({ page: "home", section: "hero", values });
      }
      return updated;
    });
  };

  const updateHomePreviewCards = (
    cards: Partial<HomeContent["previewCards"]>
  ) => {
    setHomeContent((prev) => {
      const updated = {
        ...prev,
        previewCards: { ...prev.previewCards, ...cards },
      };
      // Sync to API
      const values: Record<string, string> = {};
      if (cards.matricula) {
        values.matriculaTitle = cards.matricula.title;
        values.matriculaSubtitle = cards.matricula.subtitle;
      }
      if (cards.profesionales) {
        values.profesionalesTitle = cards.profesionales.title;
        values.profesionalesSubtitle = cards.profesionales.subtitle;
      }
      if (cards.tarifario) {
        values.tarifarioTitle = cards.tarifario.title;
        values.tarifarioSubtitle = cards.tarifario.subtitle;
      }
      if (Object.keys(values).length > 0) {
        batchSetMutation.mutate({
          page: "home",
          section: "previewCards",
          values,
        });
      }
      return updated;
    });
  };

  const updateHomeFooter = (footer: Partial<HomeContent["footer"]>) => {
    setHomeContent((prev) => {
      const updated = { ...prev, footer: { ...prev.footer, ...footer } };
      const values: Record<string, string> = {};
      if (footer.description !== undefined) values.description = footer.description;
      if (footer.email !== undefined) values.email = footer.email;
      if (footer.direccion !== undefined) values.direccion = footer.direccion;
      if (Object.keys(values).length > 0) {
        batchSetMutation.mutate({ page: "home", section: "footer", values });
      }
      return updated;
    });
  };

  const updateDashboardWelcome = (
    welcome: Partial<DashboardContent["welcome"]>
  ) => {
    setDashboardContent((prev) => {
      const updated = { ...prev, welcome: { ...prev.welcome, ...welcome } };
      const values: Record<string, string> = {};
      if (welcome.title !== undefined) values.title = welcome.title;
      if (welcome.subtitle !== undefined) values.subtitle = welcome.subtitle;
      if (Object.keys(values).length > 0) {
        batchSetMutation.mutate({
          page: "dashboard",
          section: "welcome",
          values,
        });
      }
      return updated;
    });
  };

  const updateDashboardCards = (cards: Partial<DashboardContent["cards"]>) => {
    setDashboardContent((prev) => {
      const updated = { ...prev, cards: { ...prev.cards, ...cards } };
      const values: Record<string, string> = {};
      if (cards.estadoMatricula) {
        values.estadoMatriculaTitle = cards.estadoMatricula.title;
        values.estadoMatriculaAlDia = cards.estadoMatricula.alDia;
        values.estadoMatriculaDeuda = cards.estadoMatricula.deuda;
      }
      if (cards.proximoVencimiento) {
        values.proximoVencimientoTitle = cards.proximoVencimiento.title;
      }
      if (cards.notificaciones) {
        values.notificacionesTitle = cards.notificaciones.title;
        values.notificacionesEmpty = cards.notificaciones.emptyMessage;
      }
      if (cards.accesoDirecto) {
        values.accesoDirectoTitle = cards.accesoDirecto.title;
        values.accesoDirectoDirectorio = cards.accesoDirecto.directorioText;
        values.accesoDirectoTarifario = cards.accesoDirecto.tarifarioText;
      }
      if (cards.tarifario) {
        values.tarifarioTitle = cards.tarifario.title;
        values.tarifarioDescription = cards.tarifario.description;
      }
      if (Object.keys(values).length > 0) {
        batchSetMutation.mutate({
          page: "dashboard",
          section: "cards",
          values,
        });
      }
      return updated;
    });
  };

  return (
    <ContentContext.Provider
      value={{
        homeContent,
        dashboardContent,
        updateHomeContent,
        updateDashboardContent,
        updateHomeHero,
        updateHomePreviewCards,
        updateHomeFooter,
        updateDashboardWelcome,
        updateDashboardCards,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
};
