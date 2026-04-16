import {
  Shield,
  Users,
  MessageCircle,
  Baby,
  Heart,
  ChevronRight,
  Church,
  Smartphone,
  Check,
  ArrowRight,
  BarChart3,
  Bell,
  Search,
  Star,
} from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-lg-cloud">
      {/* ================================================================
          NAVIGATION
          ================================================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[var(--lg-border-light)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/ligare-brasao.png"
              alt="Ligare"
              width={110}
              height={50}
              className="h-[50px] w-auto"
            />
            <span
              className="text-2xl font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Ligare
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-lg-text-secondary hover:text-lg-primary transition-colors">
              Recursos
            </a>
            <a href="#modules" className="text-sm font-medium text-lg-text-secondary hover:text-lg-primary transition-colors">
              Módulos
            </a>
            <a href="#pricing" className="text-sm font-medium text-lg-text-secondary hover:text-lg-primary transition-colors">
              Planos
            </a>
            <a href="#contact" className="text-sm font-medium text-lg-text-secondary hover:text-lg-primary transition-colors">
              Contato
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Entrar
            </a>
            <a href="/register" className="btn btn-primary btn-sm">
              Começar grátis
            </a>
          </div>
        </div>
      </nav>

      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
            style={{ background: "var(--lg-primary)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-[0.03]"
            style={{ background: "var(--lg-care)" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center stagger-children">
            <div className="badge badge-primary mb-6 mx-auto">
              <Star className="w-3 h-3" />
              Plataforma de Cuidado Conectado
            </div>
            <h1
              className="text-4xl md:text-6xl font-extrabold text-lg-midnight tracking-tight leading-[1.1]"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Sua igreja cuidando{" "}
              <span className="text-lg-primary">melhor</span> das
              pessoas
            </h1>
            <p className="mt-6 text-lg md:text-xl text-lg-text-secondary leading-relaxed max-w-2xl mx-auto">
              Kids Check-in seguro. Follow-up inteligente. WhatsApp da igreja
              centralizado. Tudo que sua liderança precisa para acompanhar cada
              vida com mais cuidado.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="btn btn-primary btn-lg">
                Comece gratuitamente
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#modules" className="btn btn-ghost btn-lg">
                Conhecer módulos
              </a>
            </div>
            <p className="mt-4 text-sm text-lg-text-muted">
              Sem cartão de crédito • Setup em 5 minutos • Suporte incluso
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="card p-2 md:p-3 shadow-xl">
              <div className="bg-lg-midnight rounded-xl p-6 md:p-8 min-h-[320px] md:min-h-[420px] flex items-center justify-center relative overflow-hidden">
                {/* Mock Dashboard UI */}
                <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {[
                    { icon: Baby, label: "Kids Check-in", value: "23 crianças", color: "var(--lg-care)" },
                    { icon: Users, label: "Membros Ativos", value: "347 pessoas", color: "var(--lg-primary)" },
                    { icon: MessageCircle, label: "Follow-ups", value: "12 pendentes", color: "#F59E0B" },
                    { icon: BarChart3, label: "Gestão Financeira", value: "R$ 4.2k hoje", color: "var(--lg-care)" },
                    { icon: Bell, label: "Notificações", value: "5 novas", color: "var(--lg-primary)" },
                    { icon: Search, label: "Células", value: "18 ativas", color: "#8B5CF6" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all"
                    >
                      <item.icon className="w-5 h-5 mb-2" style={{ color: item.color }} />
                      <p className="text-white/50 text-xs font-medium">{item.label}</p>
                      <p className="text-white text-sm font-bold mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURES / PILLARS
          ================================================================ */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Os pilares que transformam a gestão da sua igreja
            </h2>
            <p className="mt-4 text-lg-text-secondary text-lg">
              Cada módulo foi desenhado para resolver uma dor real da liderança
              ministerial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children">
            {/* Pillar 1: Kids */}
            <div className="card p-8 hover:shadow-lg transition-all group">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{ background: "rgba(24, 179, 126, 0.1)" }}
              >
                <Shield className="w-7 h-7 text-lg-care" />
              </div>
              <h3
                className="text-xl font-bold text-lg-midnight mb-3"
                style={{ fontFamily: "var(--lg-font-heading)" }}
              >
                Kids Check-in
              </h3>
              <p className="text-lg-text-secondary leading-relaxed mb-4">
                Check-in e check-out das crianças com segurança, vínculo com
                responsável e botão de emergência direto pelo WhatsApp da igreja.
              </p>
              <ul className="space-y-2">
                {["Check-in por QR Code", "Vínculo criança-responsável", "Botão Chamar Responsável", "Histórico por culto"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-lg-text-secondary">
                    <Check className="w-4 h-4 text-lg-care shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pillar 2: Follow-up */}
            <div className="card p-8 hover:shadow-lg transition-all group">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{ background: "rgba(31, 111, 235, 0.1)" }}
              >
                <Heart className="w-7 h-7 text-lg-primary" />
              </div>
              <h3
                className="text-xl font-bold text-lg-midnight mb-3"
                style={{ fontFamily: "var(--lg-font-heading)" }}
              >
                Follow-up Pastoral
              </h3>
              <p className="text-lg-text-secondary leading-relaxed mb-4">
                Fluxos automáticos para visitantes, novos membros e quem está
                faltando. A liderança nunca perde ninguém de vista.
              </p>
              <ul className="space-y-2">
                {["Visitantes e novos membros", "Detecção de ausência", "Ações por botões estruturados", "Status de acompanhamento"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-lg-text-secondary">
                    <Check className="w-4 h-4 text-lg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pillar 3: WhatsApp */}
            <div className="card p-8 hover:shadow-lg transition-all group">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{ background: "rgba(15, 23, 42, 0.08)" }}
              >
                <MessageCircle className="w-7 h-7 text-lg-midnight" />
              </div>
              <h3
                className="text-xl font-bold text-lg-midnight mb-3"
                style={{ fontFamily: "var(--lg-font-heading)" }}
              >
                WhatsApp Centralizado
              </h3>
              <p className="text-lg-text-secondary leading-relaxed mb-4">
                Toda comunicação pelo número oficial da igreja. Governança,
                histórico e proteção para líderes e membros.
              </p>
              <ul className="space-y-2">
                {["Canal único oficial", "Inbox centralizado", "Líder sem número exposto", "Templates pré-aprovados"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-lg-text-secondary">
                    <Check className="w-4 h-4 text-lg-midnight shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Pillar 4: Financeiro */}
            <div className="card p-8 hover:shadow-lg transition-all group">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{ background: "rgba(245, 158, 11, 0.1)" }}
              >
                <BarChart3 className="w-7 h-7 text-[#F59E0B]" />
              </div>
              <h3
                className="text-xl font-bold text-lg-midnight mb-3"
                style={{ fontFamily: "var(--lg-font-heading)" }}
              >
                Gestão Financeira
              </h3>
              <p className="text-lg-text-secondary leading-relaxed mb-4">
                Transparência total com fluxo de caixa, controle fiscal, relatórios
                mensais e capacidade de lançar receitas de cultos ou avulsas com
                dupla validação (Dízimos e Ofertas).
              </p>
              <ul className="space-y-2">
                {["Lançamentos de Culto ou Avulsos", "Verificação Dupla (Tesoureiro)", "Dashboard de Transparência", "Upload Seguro de Comprovantes"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-lg-text-secondary">
                    <Check className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          MODULES SECTION
          ================================================================ */}
      <section id="modules" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Tudo o que sua igreja precisa em um só lugar
            </h2>
            <p className="mt-4 text-lg-text-secondary text-lg">
              Módulos integrados que simplificam a operação e fortalecem o cuidado.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {[
              { icon: Church, title: "Hub Público", desc: "Link único da sua igreja para cadastros, doações e acolhimento." },
              { icon: Users, title: "Gestão de Membros", desc: "Cadastro, líderes vinculados, status de atividade e histórico." },
              { icon: Baby, title: "Módulo Kids", desc: "Check-in seguro, salas, turmas e o botão de emergência." },
              { icon: Heart, title: "Células", desc: "Mapeie, organize e conecte grupos caseiros facilmente." },
              { icon: BarChart3, title: "Presença Híbrida", desc: "Motor inteligente que combina QR, Kids e validação do líder." },
              { icon: Bell, title: "Notificações", desc: "Push, mural de avisos e lembretes de eventos integrados." },
              { icon: Smartphone, title: "App White Label", desc: "Personalize cores e logo. Sua igreja, sua marca." },
              { icon: Star, title: "Contribuições", desc: "Histórico pessoal de dízimos e ofertas para cada membro." },
            ].map((mod, i) => (
              <div
                key={i}
                className="card p-6 hover:shadow-md transition-all group cursor-default"
              >
                <mod.icon
                  className="w-6 h-6 text-lg-primary mb-3 transition-transform group-hover:scale-110"
                />
                <h3
                  className="font-bold text-lg-midnight mb-1"
                  style={{ fontFamily: "var(--lg-font-heading)" }}
                >
                  {mod.title}
                </h3>
                <p className="text-sm text-lg-text-secondary leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING
          ================================================================ */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Planos que acompanham o crescimento da sua igreja
            </h2>
            <p className="mt-4 text-lg-text-secondary text-lg">
              Comece gratuitamente e evolua conforme a necessidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {/* Free */}
            <div className="card p-6 border-[var(--lg-border)]">
              <p className="text-sm font-semibold text-lg-text-muted uppercase tracking-wider">Free</p>
              <p className="mt-3 text-3xl font-extrabold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>R$ 0</p>
              <p className="text-sm text-lg-text-muted mt-1">Para experimentar</p>
              <hr className="my-5 border-[var(--lg-border-light)]" />
              <ul className="space-y-3 mb-6">
                {["Até 100 membros", "3 células", "50 check-ins Kids/mês", "Hub público", "Mural de avisos"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-lg-text-secondary">
                    <Check className="w-4 h-4 text-lg-care shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="btn btn-ghost w-full">Começar grátis</a>
            </div>

            {/* Start */}
            <div className="card p-6 border-[var(--lg-border)]">
              <p className="text-sm font-semibold text-lg-primary uppercase tracking-wider">Start</p>
              <p className="mt-3 text-3xl font-extrabold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>R$ 97<span className="text-base font-medium text-lg-text-muted">/mês</span></p>
              <p className="text-sm text-lg-text-muted mt-1">Igrejas pequenas</p>
              <hr className="my-5 border-[var(--lg-border-light)]" />
              <ul className="space-y-3 mb-6">
                {["Até 300 membros", "10 células", "Check-ins ilimitados", "WhatsApp centralizado", "Follow-up básico", "White Label (cores + logo)"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-lg-text-secondary">
                    <Check className="w-4 h-4 text-lg-care shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="btn btn-secondary w-full">Escolher Start</a>
            </div>

            {/* Growth — Highlighted */}
            <div className="card p-6 border-2 border-[var(--lg-primary)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="badge badge-primary text-xs">Mais Popular</span>
              </div>
              <p className="text-sm font-semibold text-lg-primary uppercase tracking-wider">Growth</p>
              <p className="mt-3 text-3xl font-extrabold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>R$ 197<span className="text-base font-medium text-lg-text-muted">/mês</span></p>
              <p className="text-sm text-lg-text-muted mt-1">Igrejas em expansão</p>
              <hr className="my-5 border-[var(--lg-border-light)]" />
              <ul className="space-y-3 mb-6">
                {["Até 1.000 membros", "30 células", "Tudo do Start", "IA roteadora no WhatsApp", "Follow-up avançado", "Relatórios de presença", "Painel do líder completo"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-lg-text-secondary">
                    <Check className="w-4 h-4 text-lg-care shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a href="/register" className="btn btn-primary w-full">Escolher Growth</a>
            </div>

            {/* Pro */}
            <div className="card p-6 bg-lg-midnight border-[var(--lg-midnight)]">
              <p className="text-sm font-semibold text-lg-care uppercase tracking-wider">Pro / Enterprise</p>
              <p className="mt-3 text-3xl font-extrabold text-white" style={{ fontFamily: "var(--lg-font-heading)" }}>Sob consulta</p>
              <p className="text-sm text-white/50 mt-1">Mega-igrejas e multisites</p>
              <hr className="my-5 border-white/10" />
              <ul className="space-y-3 mb-6">
                {["Membros ilimitados", "Células ilimitadas", "Tudo do Growth", "Multiunidade", "WA instância exclusiva", "App nativo dedicado", "Onboarding premium"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-lg-care shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a href="#contact" className="btn btn-success w-full">Falar com vendas</a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA SECTION
          ================================================================ */}
      <section id="contact" className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="card p-10 md:p-16 text-center bg-lg-midnight border-none relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full opacity-10"
              style={{ background: "var(--lg-primary)" }}
            />
            <div
              className="absolute -bottom-10 -left-10 w-[200px] h-[200px] rounded-full opacity-10"
              style={{ background: "var(--lg-care)" }}
            />
            <div className="relative">
              <h2
                className="text-3xl md:text-4xl font-bold text-white leading-tight"
                style={{ fontFamily: "var(--lg-font-heading)" }}
              >
                Pronto para cuidar melhor da sua igreja?
              </h2>
              <p className="mt-4 text-white/60 text-lg max-w-xl mx-auto">
                Configure a Ligare em minutos e comece a transformar a forma como
                sua liderança acompanha cada pessoa.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/register" className="btn btn-success btn-lg">
                  Começar agora — é grátis
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="py-12 border-t border-[var(--lg-border-light)] bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/brand/ligare-brasao.png"
                  alt="Ligare"
                  width={99}
                  height={45}
                  className="h-[45px] w-auto"
                />
                <span className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                  Ligare
                </span>
              </div>
              <p className="text-sm text-lg-text-muted leading-relaxed">
                Cuidado conectado para igrejas. Tecnologia, acolhimento e simplicidade.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg-midnight mb-3 text-sm">Produto</h4>
              <ul className="space-y-2 text-sm text-lg-text-secondary">
                <li><a href="#features" className="hover:text-lg-primary transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-lg-primary transition-colors">Planos</a></li>
                <li><a href="#modules" className="hover:text-lg-primary transition-colors">Módulos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg-midnight mb-3 text-sm">Suporte</h4>
              <ul className="space-y-2 text-sm text-lg-text-secondary">
                <li><a href="#" className="hover:text-lg-primary transition-colors">Central de ajuda</a></li>
                <li><a href="#contact" className="hover:text-lg-primary transition-colors">Fale conosco</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg-midnight mb-3 text-sm">Jurídico</h4>
              <ul className="space-y-2 text-sm text-lg-text-secondary">
                <li><a href="#" className="hover:text-lg-primary transition-colors">Termos de uso</a></li>
                <li><a href="#" className="hover:text-lg-primary transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-[var(--lg-border-light)] text-center">
            <p className="text-sm text-lg-text-muted">
              © {new Date().getFullYear()} Ligare. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
