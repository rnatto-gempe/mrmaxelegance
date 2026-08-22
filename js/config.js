/**
 * Configurações da Página de Bio / Linktree - MR MAX ELEGANCE
 * 
 * Contatos e URLs Oficiais Configurados:
 * - WhatsApp: (43) 99607-0804
 * - Instagram: @mrmaxelegance
 * - Site Oficial: www.mrmaxelegance.com.br
 */
const BRAND_CONFIG = {
  // Informações Principais do Perfil e Home
  profile: {
    name: "Mr. Max Elegance",
    handle: "@mrmaxelegance",
    avatar: "assets/avatar.png",
    homeUrl: "https://www.mrmaxelegance.com.br",
    bio: "Projetos personalizados, modelos exclusivos e acabamento premium em impressão 3D de alta precisão.",
    isVerified: true,
    location: "Brasil"
  },

  // Todos os Links Oficiais das Redes Sociais e Canais
  links: [
    {
      id: "instagram",
      title: "Instagram Oficial",
      subtitle: "Peças exclusivas, bastidores e novidades diárias",
      url: "https://instagram.com/mrmaxelegance",
      icon: "instagram",
      badge: "Destaque",
      featured: true
    },
    {
      id: "shopee",
      title: "Loja Oficial na Shopee",
      subtitle: "Compre online com frete grátis e cupons exclusivos",
      url: "https://shopee.com.br/mrmaxelegance",
      icon: "shopee",
      badge: "Frete Grátis",
      featured: true
    },
    {
      id: "whatsapp",
      title: "Atendimento & Orçamentos no WhatsApp",
      subtitle: "Fale diretamente com nossa equipe e envie seu projeto",
      url: "https://wa.me/5543996070804?text=Ol%C3%A1%21%20Gostaria%20de%20fazer%20um%20or%C3%A7amento%20com%20o%20MR%20MAX%20ELEGANCE.",
      icon: "whatsapp",
      badge: "(43) 99607-0804",
      featured: false
    },
    {
      id: "youtube",
      title: "Canal no YouTube",
      subtitle: "Vídeos completos, projetos em 3D e reviews",
      url: "https://youtube.com/@mrmaxelegance",
      icon: "youtube",
      badge: "Vídeos",
      featured: false
    },
    {
      id: "tiktok",
      title: "TikTok Oficial",
      subtitle: "Dicas rápidas, time-lapses de impressão e bastidores",
      url: "https://tiktok.com/@mrmaxelegance",
      icon: "tiktok",
      badge: "Em Alta",
      featured: false
    },
    {
      id: "website",
      title: "Site & Catálogo Oficial",
      subtitle: "Conheça nosso portfólio completo e faça seu pedido",
      url: "https://www.mrmaxelegance.com.br",
      icon: "globe",
      badge: "Site Oficial",
      featured: false
    }
  ],

  // Ícones Rápidos no Rodapé
  socials: [
    { name: "Instagram", url: "https://instagram.com/mrmaxelegance", icon: "instagram" },
    { name: "Shopee", url: "https://shopee.com.br/mrmaxelegance", icon: "shopee" },
    { name: "WhatsApp", url: "https://wa.me/5543996070804", icon: "whatsapp" },
    { name: "YouTube", url: "https://youtube.com/@mrmaxelegance", icon: "youtube" },
    { name: "TikTok", url: "https://tiktok.com/@mrmaxelegance", icon: "tiktok" },
    { name: "Site Oficial", url: "https://www.mrmaxelegance.com.br", icon: "globe" }
  ],

  // Dados para o Cartão de Contato (vCard)
  vCard: {
    fullName: "MR MAX ELEGANCE",
    organization: "MR MAX ELEGANCE",
    title: "Impressão 3D & Projetos Personalizados",
    phone: "+55 43 99607-0804",
    email: "contato@mrmaxelegance.com.br",
    url: "https://www.mrmaxelegance.com.br",
    note: "Impressões que transformam, qualidade que encanta."
  },

  // Configurações de Compartilhamento
  share: {
    title: "MR MAX ELEGANCE | Links Oficiais",
    text: "MR MAX ELEGANCE - Impressões que transformam, qualidade que encanta:",
    url: "https://www.mrmaxelegance.com.br/links.html"
  },

  // =========================================================================
  // 📊 CONFIGURAÇÕES DE ANALYTICS (POSTHOG & OUTROS)
  // =========================================================================
  analytics: {
    posthog: {
      apiKey: "", // Cole sua chave "phc_..." do PostHog quando desejar
      apiHost: "https://us.i.posthog.com",
      enableSessionRecording: true
    },
    enableInternalDashboard: true,
    dashboardPassword: "",
    googleAnalyticsId: "",
    metaPixelId: "",
    webhookUrl: ""
  }
};
