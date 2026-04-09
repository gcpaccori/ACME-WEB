import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageFrame, SectionCard, StatusPill } from '../../../../components/admin/AdminScaffold';
import { AdminDataTable } from '../../../../components/admin/AdminDataTable';
import { adminModules, getEntityRootsByModule } from '../../../../core/admin/registry/moduleRegistry';
import { PortalContext } from '../../../auth/session/PortalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Mock data for charts
const orderData = [
  { name: 'Lun', orders: 120 },
  { name: 'Mar', orders: 150 },
  { name: 'Mié', orders: 180 },
  { name: 'Jue', orders: 200 },
  { name: 'Vie', orders: 250 },
  { name: 'Sáb', orders: 300 },
  { name: 'Dom', orders: 280 },
];

const customerData = [
  { name: 'Ene', customers: 50 },
  { name: 'Feb', customers: 70 },
  { name: 'Mar', customers: 90 },
  { name: 'Abr', customers: 110 },
  { name: 'May', customers: 130 },
];

const statusData = [
  { name: 'Pendiente', value: 40, color: 'var(--acme-orange)' },
  { name: 'En proceso', value: 30, color: 'rgba(77, 20, 140, 0.75)' },
  { name: 'Completado', value: 30, color: 'rgba(255, 98, 0, 0.55)' },
];

export function AdminDashboardPage() {
  const portal = useContext(PortalContext);

  return (
    <AdminPageFrame
      title="Modo admin"
      description="Panel base para operar el negocio con vistas compuestas, contexto visible y crecimiento dirigido por registry."
      breadcrumbs={[
        { label: 'Admin' },
        { label: 'Resumen' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Sucursal', value: portal.currentBranch?.name || 'sin sucursal', tone: 'neutral' },
        { label: 'Modo', value: 'Consulta', tone: 'success' },
        { label: 'Estado', value: 'Sin cambios', tone: 'success' },
      ]}
    >
      <SectionCard title="Indicadores clave" description="Métricas principales del negocio con gráficos.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.92)', border: '1px solid var(--acme-border)', boxShadow: 'var(--acme-shadow-sm)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>Pedidos por día</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="var(--acme-purple)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.92)', border: '1px solid var(--acme-border)', boxShadow: 'var(--acme-shadow-sm)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>Nuevos clientes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="customers" stroke="var(--acme-orange)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.92)', border: '1px solid var(--acme-border)', boxShadow: 'var(--acme-shadow-sm)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>Estado de pedidos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Modulos del admin" description="El shell ya se alimenta de un registry central. Los modulos deshabilitados marcan las siguientes fases del plan.">
        <AdminDataTable
          rows={adminModules}
          getRowId={(module) => module.id}
          columns={[
            {
              id: 'module',
              header: 'Modulo',
              render: (module) => (
                <div style={{ display: 'grid', gap: '6px' }}>
                  <strong>{module.label}</strong>
                  <span style={{ color: '#6b7280' }}>{module.description}</span>
                </div>
              ),
            },
            {
              id: 'roots',
              header: 'Entidades raiz',
              render: (module) => (
                <div style={{ color: '#374151' }}>
                  {getEntityRootsByModule(module.id).map((entity) => entity.singularLabel).join(', ') || 'Sin definir'}
                </div>
              ),
            },
            {
              id: 'status',
              header: 'Estado',
              render: (module) => (
                <StatusPill label={module.enabled ? 'Disponible' : 'Planificado'} tone={module.enabled ? 'success' : 'warning'} />
              ),
            },
            {
              id: 'action',
              header: 'Accion',
              align: 'right',
              width: '180px',
              render: (module) =>
                module.enabled && module.route ? (
                  <Link to={module.route} style={{ color: '#2563eb', fontWeight: 700 }}>
                    Abrir modulo
                  </Link>
                ) : (
                  <span style={{ color: '#9ca3af' }}>Pendiente</span>
                ),
            },
          ]}
        />
      </SectionCard>
    </AdminPageFrame>
  );
}
