"use client";
import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, BarChart3, Shield, Zap, Users, Package, FileText, CreditCard, Truck, Cloud, ArrowRight, Menu, X, Globe, Cpu, Layers, TrendingUp } from 'lucide-react';

export default function KodiraLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Package, title: "Gestión de Inventario", desc: "Control total de stock en tiempo real" },
    { icon: FileText, title: "Facturación Electrónica", desc: "Cumple con todas las normativas fiscales" },
    { icon: CreditCard, title: "Pagos Integrados", desc: "Acepta todos los métodos de pago" },
    { icon: Truck, title: "Logística Inteligente", desc: "Optimiza rutas y entregas automáticamente" }
  ];

  const industries = [
    { name: "Restaurantes", icon: "🍴", color: "from-orange-400 to-red-500" },
    { name: "Gimnasios", icon: "💪", color: "from-purple-400 to-pink-500" },
    { name: "E-commerce", icon: "🛒", color: "from-blue-400 to-cyan-500" },
    { name: "Logística", icon: "🚚", color: "from-green-400 to-teal-500" }
  ];

  const benefits = [
    { icon: BarChart3, title: "Análisis en Tiempo Real", desc: "Dashboards inteligentes con IA para decisiones informadas" },
    { icon: Shield, title: "Seguridad Enterprise", desc: "Certificaciones ISO y encriptación de grado bancario" },
    { icon: Zap, title: "Implementación Rápida", desc: "Tu negocio digitalizado en menos de 7 días" },
    { icon: Users, title: "Soporte 24/7", desc: "Equipo experto siempre disponible para tu empresa" }
  ];

  return (
    <>
    
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-3 transition-transform hover:rotate-6">
                  <span className="text-white font-bold text-xl">K</span>
                </div>
                <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-xl -z-10 transform -rotate-3"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">kodira.io</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">Características</a>
              <a href="#industries" className="text-gray-600 hover:text-indigo-600 transition-colors">Industrias</a>
              <a href="#odoo" className="text-gray-600 hover:text-indigo-600 transition-colors">Powered by Odoo</a>
              <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                Solicitar Demo
              </button>
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 md:hidden">
          <div className="flex flex-col items-center space-y-6 p-6">
            <a href="#features" className="text-xl text-gray-600 hover:text-indigo-600">Características</a>
            <a href="#industries" className="text-xl text-gray-600 hover:text-indigo-600">Industrias</a>
            <a href="#odoo" className="text-xl text-gray-600 hover:text-indigo-600">Powered by Odoo</a>
            <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg">
              Solicitar Demo
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full">
                <Cloud className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-indigo-600 font-medium">100% Cloud Native con Google Apps</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                La plataforma empresarial
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> todo-en-uno</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Automatiza y escala tu negocio con aplicaciones inteligentes potenciadas por Odoo. 
                Desde la producción hasta la entrega, todo integrado en una sola plataforma.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span className="font-semibold">Comenzar Ahora</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 border-2 border-gray-200 rounded-xl hover:border-indigo-600 transition-colors flex items-center justify-center space-x-2">
                  <span className="font-semibold">Ver Demo</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl transition-all duration-500 ${
                        activeFeature === index
                          ? 'bg-gradient-to-br from-indigo-50 to-purple-50 scale-105 shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <feature.icon className={`w-8 h-8 mb-3 ${
                        activeFeature === index ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Características que impulsan tu
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> crecimiento</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada módulo está diseñado para integrarse perfectamente y escalar con tu negocio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Soluciones para cada
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> industria</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Apps especializadas que entienden las necesidades únicas de tu sector
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industries.map((industry, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl">
                  <div className={`h-64 bg-gradient-to-br ${industry.color} p-8 flex flex-col items-center justify-center text-white transform transition-transform duration-300 group-hover:scale-110`}>
                    <div className="text-6xl mb-4 animate-bounce">{industry.icon}</div>
                    <h3 className="text-2xl font-bold">{industry.name}</h3>
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      Ver Solución
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Odoo Section */}
      <section id="odoo" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-indigo-600 font-medium">Powered by Odoo</span>
              </div>
              
              <h2 className="text-4xl font-bold">
                Construido sobre la base sólida de
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Odoo ERP</span>
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Aprovechamos la potencia y flexibilidad de Odoo para crear soluciones 
                personalizadas que se adaptan perfectamente a tu negocio. Más de 7 millones 
                de usuarios confían en Odoo en todo el mundo.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Open Source</h4>
                    <p className="text-sm text-gray-600">Sin vendor lock-in, total libertad</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Modular</h4>
                    <p className="text-sm text-gray-600">Paga solo por lo que necesitas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Escalable</h4>
                    <p className="text-sm text-gray-600">Crece sin límites técnicos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Integrado</h4>
                    <p className="text-sm text-gray-600">Todo conectado nativamente</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Stack Tecnológico</h3>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Cpu className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium">Odoo 16 Enterprise</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Core</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Google Workspace</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Integrated</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">PostgreSQL + Redis</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Database</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Python + JavaScript</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Backend</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Transforma tu negocio hoy mismo
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Únete a miles de empresas que ya digitalizaron sus operaciones con kodira.io
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              Solicitar Demo Personalizada
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-200">
              Hablar con Ventas
            </button>
          </div>
          <p className="text-sm text-indigo-200 mt-6">
            Sin tarjeta de crédito • Implementación en 7 días • Soporte 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">K</span>
              </div>
              <span className="text-xl font-bold text-white">kodira.io</span>
            </div>
            <p className="text-sm">
              © 2024 kodira.io. Powered by Odoo. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}