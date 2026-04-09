import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { AppRoutes } from '../../core/constants/routes';
import headerLogo from '../../images/logo/logo-acme.jpeg';
import footerLogo from '../../images/logo/logo-acme.png';

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="page-shell" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Poppins:wght@400;500;600;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .acme-nav-link {
          font-size: .88rem;
          font-weight: 600;
          color: #5b4b78;
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 8px;
          transition: background .18s, color .18s;
        }

        .acme-nav-link:hover {
          background: #f0e8ff;
          color: #4d148c !important;
        }

        .acme-nav-link.active {
          background: #f0e8ff;
          color: #4d148c !important;
        }

        .acme-nav-portal {
          background: #ff6200 !important;
          color: #ffffff !important;
          border-radius: 20px !important;
          padding: 8px 18px !important;
          font-weight: 700 !important;
          transition: background .18s !important;
        }

        .acme-nav-portal:hover {
          background: #ff8533 !important;
        }

        /* FOOTER */
        .acme-footer {
          margin-top: 0;
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
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .acme-footer-logo-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 1.6rem;
          color: #fff;
          letter-spacing: -.4px;
        }

        .acme-footer-text {
          max-width: 340px;
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
          backdrop-filter: blur(4px);
          transition: transform .18s ease, background .18s ease, border-color .18s ease;
          font-weight: 800;
          font-size: 1rem;
        }

        .acme-footer-social:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,.22);
          border-color: rgba(255,255,255,.35);
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
          font-size: 1.02rem;
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

        .acme-footer-copy {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          font-size: .95rem;
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
          .acme-footer-logo-title {
            font-size: 1.35rem;
          }

          .acme-footer-link {
            font-size: .98rem;
          }

          .acme-footer-copy {
            font-size: .88rem;
          }

          .acme-powered-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#ffffff',
          borderBottom: '2px solid #ede8f7',
          padding: '0 40px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 16px rgba(77,20,140,.07)',
        }}
      >
        {/* Logo */}
        <Link
          to={AppRoutes.public.home}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
        >
          <img src={headerLogo} alt="ACME Logo" style={{ height: '40px' }} />
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Link
            to={AppRoutes.public.home}
            className={`acme-nav-link${location.pathname === AppRoutes.public.home ? ' active' : ''}`}
          >
            Inicio
          </Link>
          <Link
            to={AppRoutes.public.howItWorks}
            className={`acme-nav-link${location.pathname === AppRoutes.public.howItWorks ? ' active' : ''}`}
          >
            Cómo funciona
          </Link>
          <Link
            to={AppRoutes.public.businesses}
            className={`acme-nav-link${location.pathname === AppRoutes.public.businesses ? ' active' : ''}`}
          >
            Para negocios
          </Link>
          <Link
            to={AppRoutes.public.downloads}
            className={`acme-nav-link${location.pathname === AppRoutes.public.downloads ? ' active' : ''}`}
          >
            Descargar
          </Link>
          <Link
            to={AppRoutes.public.contact}
            className={`acme-nav-link${location.pathname === AppRoutes.public.contact ? ' active' : ''}`}
          >
            Contacto
          </Link>
          <Link to={AppRoutes.public.portalLogin} className="acme-nav-link acme-nav-portal">
            Portal
          </Link>
        </nav>
      </header>

      {/* ── MAIN ── */}
      <main>
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="acme-footer">
        <div className="acme-footer-top">
          <div className="acme-footer-grid">
            {/* Columna 1 */}
            <div className="acme-footer-brand">
              <Link to={AppRoutes.public.home} className="acme-footer-logo">
                <img src={footerLogo} alt="ACME Footer Logo" style={{ height: '50px' }} />
              </Link>

              <p className="acme-footer-text">
                Soluciones de delivery y gestión para negocios que quieren vender más,
                operar mejor y ofrecer una experiencia moderna a sus clientes.
              </p>

              <div>
                <h4 className="acme-footer-social-title">Síguenos en las redes</h4>
                <div className="acme-footer-socials">
                  <a href="#" className="acme-footer-social" aria-label="Facebook">f</a>
                  <a href="#" className="acme-footer-social" aria-label="Instagram">ig</a>
                  <a href="#" className="acme-footer-social" aria-label="WhatsApp">wa</a>
                  <a href="#" className="acme-footer-social" aria-label="TikTok">tt</a>
                </div>
              </div>
            </div>

            {/* Columna 2 */}
            <div>
              <h4 className="acme-footer-col-title">Explora</h4>
              <div className="acme-footer-links">
                <Link to={AppRoutes.public.home} className="acme-footer-link">
                  Inicio
                </Link>
                <Link to={AppRoutes.public.howItWorks} className="acme-footer-link">
                  Cómo funciona
                </Link>
                <Link to={AppRoutes.public.businesses} className="acme-footer-link">
                  Para negocios
                </Link>
              </div>
            </div>

            {/* Columna 3 */}
            <div>
              <h4 className="acme-footer-col-title">Accesos</h4>
              <div className="acme-footer-links">
                <Link to={AppRoutes.public.downloads} className="acme-footer-link">
                  Descargar
                </Link>
                <Link to={AppRoutes.public.contact} className="acme-footer-link">
                  Contacto
                </Link>
                <Link to={AppRoutes.public.portalLogin} className="acme-footer-link">
                  Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="acme-footer-bottom">
          <div className="acme-footer-copy">
            <span>© Copyright 2026 Acme Pedidos. Todos los derechos reservados.</span>
          </div>

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