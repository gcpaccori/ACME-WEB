import { Link, Outlet, useLocation } from 'react-router-dom';
import { AppRoutes } from '../../core/constants/routes';
import headerLogo from '../../images/logo/logo-acme.jpeg';
import footerLogo from '../../images/logo/logo-acme.png';
import { usePublicStore } from '../../modules/public/store/PublicStoreContext';

function isActive(pathname: string, route: string) {
  return pathname === route;
}

export function PublicLayout() {
  const location = useLocation();
  const publicStore = usePublicStore();

  return (
    <div className="page-shell" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Poppins:wght@400;500;600;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .acme-nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: .9rem;
          font-weight: 700;
          color: #5b4b78;
          text-decoration: none;
          padding: 9px 14px;
          border-radius: 999px;
          transition: background .18s, color .18s, border-color .18s;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .acme-nav-link:hover,
        .acme-nav-link.active {
          background: #f0e8ff;
          color: #4d148c !important;
          border-color: rgba(77, 20, 140, .12);
        }

        .acme-nav-portal {
          background: #ff6200 !important;
          color: #ffffff !important;
          border-color: rgba(255, 98, 0, .2) !important;
        }

        .acme-nav-portal:hover {
          background: #ff8533 !important;
        }

        .acme-footer-top {
          background: linear-gradient(180deg, #ff8a1d 0%, #ff6b14 100%);
          color: #fff;
          padding: 56px 80px 48px;
        }

        .acme-footer-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr 1fr;
          gap: 56px;
          align-items: start;
        }

        .acme-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .acme-footer-logo {
          display: inline-flex;
          align-items: center;
        }

        .acme-footer-text {
          max-width: 360px;
          font-size: .96rem;
          line-height: 1.7;
          color: rgba(255,255,255,.92);
          margin: 0;
        }

        .acme-footer-social-title,
        .acme-footer-col-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 1.05rem;
          margin: 0 0 16px;
          color: #fff;
        }

        .acme-footer-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .acme-footer-social {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #fff;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.18);
          transition: transform .18s ease, background .18s ease;
          font-weight: 800;
          font-size: 1rem;
        }

        .acme-footer-social:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,.22);
        }

        .acme-footer-links {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .acme-footer-link {
          display: inline-flex;
          width: fit-content;
          color: rgba(255,255,255,.95);
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          padding: 8px 0;
          transition: opacity .18s ease, transform .18s ease;
        }

        .acme-footer-link:hover {
          opacity: .82;
          transform: translateX(3px);
        }

        .acme-footer-bottom {
          background: #070b34;
          color: rgba(255,255,255,.92);
          padding: 18px 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }

        .acme-powered-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fff;
          padding: 10px 18px;
          border-radius: 999px;
          font-weight: 800;
          font-size: .92rem;
          background: linear-gradient(135deg, #4d148c 0%, #6f2dbd 100%);
          box-shadow: 0 8px 24px rgba(77,20,140,.35);
          border: 1px solid rgba(255,255,255,.08);
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
        }

        .acme-powered-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(77,20,140,.45);
          opacity: .97;
        }

        @media (max-width: 1180px) {
          .public-header-shell {
            height: auto !important;
            padding: 12px 18px !important;
            gap: 12px;
            flex-wrap: wrap;
          }

          .public-header-nav {
            order: 3;
            width: 100%;
            flex-wrap: wrap;
          }

          .public-header-actions {
            margin-left: auto;
          }
        }

        @media (max-width: 980px) {
          .acme-footer-top {
            padding: 44px 28px 38px;
          }

          .acme-footer-bottom {
            padding: 16px 28px;
          }

          .acme-footer-grid {
            grid-template-columns: 1fr;
            gap: 34px;
          }
        }

        @media (max-width: 640px) {
          .public-header-shell {
            margin: 0 12px !important;
            max-width: calc(100vw - 24px) !important;
          }

          .public-header-nav,
          .public-header-actions {
            display: flex;
            width: 100%;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .acme-powered-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <header
        className="public-header-shell"
        style={{
          position: 'sticky',
          top: '12px',
          zIndex: 100,
          background: '#ffffff',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid var(--acme-border)',
          padding: '0 22px',
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--acme-shadow-md)',
          margin: '0 24px',
          maxWidth: 'calc(100vw - 48px)',
          gap: '14px',
        }}
      >
        <Link to={AppRoutes.public.home} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <img src={headerLogo} alt="ACME Logo" style={{ height: '42px' }} />
        </Link>

        <nav className="public-header-nav" style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0, flex: 1 }}>
          <Link to={AppRoutes.public.home} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.home) ? ' active' : ''}`}>
            Inicio
          </Link>
          <Link to={AppRoutes.public.howItWorks} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.howItWorks) ? ' active' : ''}`}>
            Como funciona
          </Link>
          <Link to={AppRoutes.public.marketplace} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.marketplace) ? ' active' : ''}`}>
            Pide ahora
          </Link>
          <Link to={AppRoutes.public.businesses} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.businesses) ? ' active' : ''}`}>
            Para negocios
          </Link>
          <Link to={AppRoutes.public.hazteDriver} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.hazteDriver) ? ' active' : ''}`}>
            HAZTE DRIVER
          </Link>
          <Link to={AppRoutes.public.contact} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.contact) ? ' active' : ''}`}>
            Contacto
          </Link>
        </nav>

        <div className="public-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <Link to={AppRoutes.public.cart} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.cart) ? ' active' : ''}`}>
            Carrito{publicStore.cartCount > 0 ? ` (${publicStore.cartCount})` : ''}
          </Link>
          <Link to={AppRoutes.public.account} className={`acme-nav-link${isActive(location.pathname, AppRoutes.public.account) ? ' active' : ''}`}>
            {publicStore.sessionUser ? 'Mi cuenta' : 'Ingresar'}
          </Link>
          <Link to={AppRoutes.public.portalLogin} className="acme-nav-link acme-nav-portal">
            Portal
          </Link>
        </div>
      </header>

      <main style={{ marginTop: '-78px' }}>
        <Outlet />
      </main>

      <footer>
        <div className="acme-footer-top">
          <div className="acme-footer-grid">
            <div className="acme-footer-brand">
              <Link to={AppRoutes.public.home} className="acme-footer-logo">
                <img src={footerLogo} alt="ACME Footer Logo" style={{ height: '50px' }} />
              </Link>
              <p className="acme-footer-text">
                Soluciones de delivery y gestion para negocios que quieren vender mas,
                operar mejor y ofrecer una experiencia moderna a sus clientes.
              </p>
              <div>
                <h4 className="acme-footer-social-title">Siguenos en redes</h4>
                <div className="acme-footer-socials">
                  <a href="#" className="acme-footer-social" aria-label="Facebook">f</a>
                  <a href="#" className="acme-footer-social" aria-label="Instagram">ig</a>
                  <a href="#" className="acme-footer-social" aria-label="WhatsApp">wa</a>
                  <a href="#" className="acme-footer-social" aria-label="TikTok">tt</a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="acme-footer-col-title">Explora</h4>
              <div className="acme-footer-links">
                <Link to={AppRoutes.public.home} className="acme-footer-link">Inicio</Link>
                <Link to={AppRoutes.public.howItWorks} className="acme-footer-link">Como funciona</Link>
                <Link to={AppRoutes.public.marketplace} className="acme-footer-link">Pide ahora</Link>
                <Link to={AppRoutes.public.businesses} className="acme-footer-link">Para negocios</Link>
              </div>
            </div>

            <div>
              <h4 className="acme-footer-col-title">Accesos</h4>
              <div className="acme-footer-links">
                <Link to={AppRoutes.public.hazteDriver} className="acme-footer-link">HAZTE DRIVER</Link>
                <Link to={AppRoutes.public.contact} className="acme-footer-link">Contacto</Link>
                <Link to={AppRoutes.public.cart} className="acme-footer-link">Carrito</Link>
                <Link to={AppRoutes.public.account} className="acme-footer-link">Mi cuenta</Link>
                <Link to={AppRoutes.public.portalLogin} className="acme-footer-link">Portal</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="acme-footer-bottom">
          <span>© Copyright 2026 Acme Pedidos. Todos los derechos reservados.</span>
          <a
            href="https://accuracynexus.wuaze.com"
            target="_blank"
            rel="noopener noreferrer"
            className="acme-powered-btn"
          >
            Powered by Accuracy Nexus
          </a>
        </div>
      </footer>
    </div>
  );
}
