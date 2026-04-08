import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminPageFrame, FormStatusBar, SaveActions, SectionCard } from '../../../../components/admin/AdminScaffold';
import { CheckboxField, FieldGroup, NumberField, SelectField, TextAreaField } from '../../../../components/admin/AdminFields';
import { AdminTabPanel, AdminTabs } from '../../../../components/admin/AdminTabs';
import { LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { TextField } from '../../../../components/ui/TextField';
import { AppRoutes } from '../../../../core/constants/routes';
import { hasDirtyState, serializeDirtyState } from '../../../../core/admin/utils/dirtyState';
import {
  adminService,
  BranchAdminForm,
  BranchClosureFormValue,
  BranchDeliveryZoneFormValue,
  BranchHourFormValue,
  DeliveryZoneFormValue,
} from '../../../../core/services/adminService';
import { PortalContext } from '../../../auth/session/PortalContext';

const statusOptions = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
];

const branchStatusOptions = [
  { value: 'open', label: 'Abierta' },
  { value: 'paused', label: 'Pausada' },
  { value: 'closed', label: 'Cerrada' },
];

const weekdayLabels = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function createTempId() {
  return `temp:${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function createBranchZoneRows(zones: DeliveryZoneFormValue[]): BranchDeliveryZoneFormValue[] {
  return zones.map((zone) => ({
    zone_id: zone.id ?? '',
    zone_name: zone.name,
    assigned: false,
    fee_override: '',
    is_active: true,
  }));
}

function normalizeDateTimeValue(value: string) {
  if (!value) return '';
  const normalized = value.trim().replace(' ', 'T');
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (match) {
    return `${match[1]}T${match[2]}`;
  }
  return normalized;
}

export function BranchEditorPage() {
  const portal = useContext(PortalContext);
  const navigate = useNavigate();
  const params = useParams();
  const merchantId = portal.merchant?.id;
  const branchId = params.branchId;
  const isNew = !branchId;
  const [activeTab, setActiveTab] = useState('overview');
  const [form, setForm] = useState<BranchAdminForm | null>(null);
  const [initialState, setInitialState] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      setError(null);

      if (isNew) {
        const baseForm = adminService.createDefaultBranchForm(merchantId);
        const zonesResult = await adminService.fetchDeliveryZones();
        const deliveryZones = zonesResult.data ?? [];
        const seededForm: BranchAdminForm = {
          ...baseForm,
          delivery_zones: deliveryZones,
          branch_delivery_zones: createBranchZoneRows(deliveryZones),
        };

        if (zonesResult.error) {
          setError(zonesResult.error.message);
        }

        setForm(seededForm);
        setInitialState(serializeDirtyState(seededForm));
        setLoading(false);
        return;
      }

      const result = await adminService.fetchBranchForm(branchId as string);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (result.data) {
        const seededZones =
          result.data.branch_delivery_zones.length > 0
            ? result.data.branch_delivery_zones
            : createBranchZoneRows(result.data.delivery_zones);
        const seededForm: BranchAdminForm = {
          ...result.data,
          branch_delivery_zones: seededZones,
        };
        setForm(seededForm);
        setInitialState(serializeDirtyState(seededForm));
      }
    };

    load();
  }, [branchId, isNew, merchantId]);

  const dirty = useMemo(() => (form ? hasDirtyState(form, initialState) : false), [form, initialState]);

  const updateField = <K extends keyof BranchAdminForm>(key: K, value: BranchAdminForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSuccessMessage(null);
  };

  const updateAddress = (key: keyof BranchAdminForm['address'], value: string) => {
    setForm((current) => (current ? { ...current, address: { ...current.address, [key]: value } } : current));
    setSuccessMessage(null);
  };

  const updateBranchStatus = (key: keyof BranchAdminForm['branch_status'], value: string | boolean) => {
    setForm((current) =>
      current
        ? {
            ...current,
            branch_status: { ...current.branch_status, [key]: value },
          }
        : current
    );
    setSuccessMessage(null);
  };

  const updateHour = (index: number, patch: Partial<BranchHourFormValue>) => {
    setForm((current) => {
      if (!current) return current;
      const hours = current.hours.map((hour, currentIndex) => (currentIndex === index ? { ...hour, ...patch } : hour));
      return { ...current, hours };
    });
    setSuccessMessage(null);
  };

  const addClosure = () => {
    setForm((current) =>
      current
        ? {
            ...current,
            closures: [...current.closures, { starts_at: '', ends_at: '', reason: '' }],
          }
        : current
    );
    setSuccessMessage(null);
  };

  const updateClosure = (index: number, patch: Partial<BranchClosureFormValue>) => {
    setForm((current) => {
      if (!current) return current;
      const closures = current.closures.map((closure, currentIndex) =>
        currentIndex === index ? { ...closure, ...patch } : closure
      );
      return { ...current, closures };
    });
    setSuccessMessage(null);
  };

  const removeClosure = (index: number) => {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        closures: current.closures.filter((_, currentIndex) => currentIndex !== index),
      };
    });
    setSuccessMessage(null);
  };

  const addZone = () => {
    const tempId = createTempId();
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        delivery_zones: [
          ...current.delivery_zones,
          {
            id: tempId,
            name: '',
            polygon_geojson: '',
            base_fee: '0',
            min_order_amount: '0',
            estimated_minutes: '0',
            is_active: true,
          },
        ],
        branch_delivery_zones: [
          ...current.branch_delivery_zones,
          {
            zone_id: tempId,
            zone_name: '',
            assigned: true,
            fee_override: '',
            is_active: true,
          },
        ],
      };
    });
    setSuccessMessage(null);
  };

  const updateZone = (index: number, patch: Partial<DeliveryZoneFormValue>) => {
    setForm((current) => {
      if (!current) return current;
      const target = current.delivery_zones[index];
      if (!target) return current;

      const nextZone = { ...target, ...patch };
      const delivery_zones = current.delivery_zones.map((zone, currentIndex) => (currentIndex === index ? nextZone : zone));
      const branch_delivery_zones = current.branch_delivery_zones.map((relation) =>
        relation.zone_id === target.id
          ? {
              ...relation,
              zone_name: nextZone.name,
            }
          : relation
      );

      return { ...current, delivery_zones, branch_delivery_zones };
    });
    setSuccessMessage(null);
  };

  const removeNewZone = (zoneId: string | undefined) => {
    if (!zoneId || !zoneId.startsWith('temp:')) return;
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        delivery_zones: current.delivery_zones.filter((zone) => zone.id !== zoneId),
        branch_delivery_zones: current.branch_delivery_zones.filter((relation) => relation.zone_id !== zoneId),
      };
    });
    setSuccessMessage(null);
  };

  const updateBranchZone = (zoneId: string, patch: Partial<BranchDeliveryZoneFormValue>) => {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        branch_delivery_zones: current.branch_delivery_zones.map((relation) =>
          relation.zone_id === zoneId ? { ...relation, ...patch } : relation
        ),
      };
    });
    setSuccessMessage(null);
  };

  const toggleBranchZone = (zoneId: string, assigned: boolean) => {
    updateBranchZone(zoneId, {
      assigned,
      is_active: assigned ? true : false,
    });
  };

  const handleSave = async (redirectAfterSave: boolean) => {
    if (!form) return;
    setSaving(true);
    setError(null);
    const result = await adminService.saveBranch(form, portal.sessionUserId);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage('Guardado');
    const nextId = (result.data as any)?.id ?? branchId;
    if (redirectAfterSave && nextId) {
      navigate(`/portal/admin/branches/${nextId}`);
      return;
    }

    if (nextId) {
      const refreshed = await adminService.fetchBranchForm(nextId);
      if (!refreshed.error && refreshed.data) {
        const refreshedForm: BranchAdminForm = {
          ...refreshed.data,
          branch_delivery_zones:
            refreshed.data.branch_delivery_zones.length > 0
              ? refreshed.data.branch_delivery_zones
              : createBranchZoneRows(refreshed.data.delivery_zones),
        };
        setForm(refreshedForm);
        setInitialState(serializeDirtyState(refreshedForm));
      }
    }
    await portal.reloadPortalContext();
  };

  if (!merchantId) {
    return <div>No hay comercio activo para editar sucursales.</div>;
  }

  if (loading || !form) {
    return <LoadingScreen message="Cargando sucursal..." />;
  }

  return (
    <AdminPageFrame
      title={isNew ? 'Nueva sucursal' : form.name}
      description="Editor relacional de sucursal con direccion, estado operativo, horarios, cierres y cobertura de reparto."
      breadcrumbs={[
        { label: 'Admin', to: AppRoutes.portal.admin.root },
        { label: 'Sucursales', to: AppRoutes.portal.admin.branches },
        { label: isNew ? 'Nueva' : form.name || 'Sucursal' },
      ]}
      contextItems={[
        { label: 'Rol', value: portal.staffAssignment?.role || 'sin rol', tone: 'info' },
        { label: 'Comercio', value: portal.merchant?.name || 'sin comercio', tone: 'neutral' },
        { label: 'Sucursal', value: isNew ? 'Nueva' : form.name || 'sin nombre', tone: 'info' },
        { label: 'Modo', value: isNew ? 'Creacion' : 'Edicion', tone: dirty ? 'warning' : 'info' },
        { label: 'Estado', value: dirty ? 'Cambios pendientes' : 'Sin cambios', tone: dirty ? 'warning' : 'success' },
      ]}
      actions={
        <SaveActions
          onSave={() => handleSave(true)}
          onSecondarySave={() => handleSave(false)}
          onCancel={() => navigate(AppRoutes.portal.admin.branches)}
          disabled={!dirty}
          isSaving={saving}
        />
      }
    >
      <AdminTabs
        tabs={[
          { id: 'overview', label: 'Base' },
          { id: 'schedule', label: 'Operacion', badge: String(form.closures.length) },
          { id: 'coverage', label: 'Cobertura', badge: String(form.branch_delivery_zones.filter((item) => item.assigned).length) },
        ]}
        activeTabId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'overview' ? (
        <AdminTabPanel>
          <SectionCard title="Datos base" description="La relacion con el comercio se completa automaticamente desde el contexto.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FieldGroup label="Nombre">
                <TextField value={form.name} onChange={(event) => updateField('name', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Telefono">
                <TextField value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Tiempo promedio de preparacion">
                <NumberField value={form.prep_time_avg_min} onChange={(event) => updateField('prep_time_avg_min', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Estado de sucursal">
                <SelectField value={form.status} onChange={(event) => updateField('status', event.target.value)} options={statusOptions} />
              </FieldGroup>
            </div>
            <CheckboxField
              label="La sucursal acepta pedidos"
              checked={form.accepts_orders}
              onChange={(event) => updateField('accepts_orders', event.target.checked)}
            />
          </SectionCard>

          <SectionCard title="Direccion" description="Esta direccion se guarda en la tabla relacional `addresses` y se enlaza a la sucursal.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FieldGroup label="Linea 1">
                <TextField value={form.address.line1} onChange={(event) => updateAddress('line1', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Linea 2">
                <TextField value={form.address.line2} onChange={(event) => updateAddress('line2', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Referencia">
                <TextField value={form.address.reference} onChange={(event) => updateAddress('reference', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Distrito">
                <TextField value={form.address.district} onChange={(event) => updateAddress('district', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Ciudad">
                <TextField value={form.address.city} onChange={(event) => updateAddress('city', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Region">
                <TextField value={form.address.region} onChange={(event) => updateAddress('region', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Pais">
                <TextField value={form.address.country} onChange={(event) => updateAddress('country', event.target.value)} />
              </FieldGroup>
            </div>
          </SectionCard>

          <SectionCard title="Estado operativo" description="Esta seccion actualiza la tabla `merchant_branch_status`.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FieldGroup label="Estado operativo">
                <SelectField
                  value={form.branch_status.status_code}
                  onChange={(event) => updateBranchStatus('status_code', event.target.value)}
                  options={branchStatusOptions}
                />
              </FieldGroup>
              <FieldGroup label="Motivo de pausa">
                <TextField value={form.branch_status.pause_reason} onChange={(event) => updateBranchStatus('pause_reason', event.target.value)} />
              </FieldGroup>
            </div>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <CheckboxField
                label="Sucursal abierta"
                checked={form.branch_status.is_open}
                onChange={(event) => updateBranchStatus('is_open', event.target.checked)}
              />
              <CheckboxField
                label="Aceptando pedidos"
                checked={form.branch_status.accepting_orders}
                onChange={(event) => updateBranchStatus('accepting_orders', event.target.checked)}
              />
            </div>
          </SectionCard>
        </AdminTabPanel>
      ) : null}

      {activeTab === 'schedule' ? (
        <AdminTabPanel>
          <SectionCard title="Horarios" description="Los 7 dias se muestran en una sola tabla para evitar registros ciegos.">
            <div style={{ display: 'grid', gap: '12px' }}>
              {form.hours.map((hour, index) => (
                <div key={hour.id ?? hour.day_of_week} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                  <strong>{weekdayLabels[hour.day_of_week]}</strong>
                  <TextField value={hour.open_time} onChange={(event) => updateHour(index, { open_time: event.target.value })} />
                  <TextField value={hour.close_time} onChange={(event) => updateHour(index, { close_time: event.target.value })} />
                  <CheckboxField label="Cerrado" checked={hour.is_closed} onChange={(event) => updateHour(index, { is_closed: event.target.checked })} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Cierres especiales"
            description="Se registran sobre `merchant_branch_closures` para mantenimientos, feriados o bloqueos temporales."
          >
            <div style={{ display: 'grid', gap: '12px' }}>
              {form.closures.length === 0 ? <span style={{ color: '#6b7280' }}>No hay cierres especiales registrados.</span> : null}
              {form.closures.map((closure, index) => (
                <div
                  key={closure.id ?? `closure-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto',
                    gap: '12px',
                    alignItems: 'start',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    background: '#f9fafb',
                  }}
                >
                  <FieldGroup label="Inicio">
                    <TextField
                      type="datetime-local"
                      value={normalizeDateTimeValue(closure.starts_at)}
                      onChange={(event) => updateClosure(index, { starts_at: event.target.value })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Fin">
                    <TextField
                      type="datetime-local"
                      value={normalizeDateTimeValue(closure.ends_at)}
                      onChange={(event) => updateClosure(index, { ends_at: event.target.value })}
                    />
                  </FieldGroup>
                  <FieldGroup label="Motivo">
                    <TextField value={closure.reason} onChange={(event) => updateClosure(index, { reason: event.target.value })} />
                  </FieldGroup>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button type="button" onClick={() => removeClosure(index)}>
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px' }}>
              <button type="button" onClick={addClosure}>
                Agregar cierre
              </button>
            </div>
          </SectionCard>
        </AdminTabPanel>
      ) : null}

      {activeTab === 'coverage' ? (
        <AdminTabPanel>
          <SectionCard
            title="Catalogo de zonas"
            description="Estas zonas son compartidas. Cambiar nombre o tarifa base afecta el catalogo usado por otras sucursales."
          >
            <div style={{ display: 'grid', gap: '16px' }}>
              {form.delivery_zones.length === 0 ? <span style={{ color: '#6b7280' }}>Todavia no hay zonas de reparto cargadas.</span> : null}
              {form.delivery_zones.map((zone, index) => (
                <div
                  key={zone.id ?? `zone-${index}`}
                  style={{
                    display: 'grid',
                    gap: '12px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'start' }}>
                    <FieldGroup label="Nombre de zona">
                      <TextField value={zone.name} onChange={(event) => updateZone(index, { name: event.target.value })} />
                    </FieldGroup>
                    <FieldGroup label="Tarifa base">
                      <NumberField value={zone.base_fee} onChange={(event) => updateZone(index, { base_fee: event.target.value })} />
                    </FieldGroup>
                    <FieldGroup label="Pedido minimo">
                      <NumberField value={zone.min_order_amount} onChange={(event) => updateZone(index, { min_order_amount: event.target.value })} />
                    </FieldGroup>
                    <FieldGroup label="Minutos estimados">
                      <NumberField value={zone.estimated_minutes} onChange={(event) => updateZone(index, { estimated_minutes: event.target.value })} />
                    </FieldGroup>
                    <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'flex-end' }}>
                      {zone.id?.startsWith('temp:') ? (
                        <button type="button" onClick={() => removeNewZone(zone.id)}>
                          Quitar nueva zona
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <FieldGroup label="Polygon GeoJSON" hint="Opcional por ahora. Se puede completar cuando el reparto use mapa o geocercas.">
                    <TextAreaField
                      value={zone.polygon_geojson}
                      onChange={(event) => updateZone(index, { polygon_geojson: event.target.value })}
                      placeholder='{"type":"Polygon","coordinates":[...]}'
                    />
                  </FieldGroup>
                  <CheckboxField
                    label="Zona activa en catalogo"
                    checked={zone.is_active}
                    onChange={(event) => updateZone(index, { is_active: event.target.checked })}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px' }}>
              <button type="button" onClick={addZone}>
                Agregar zona
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Cobertura de esta sucursal"
            description="Activa aqui las zonas que atiende esta sucursal y define un sobrecargo si la tarifa cambia para este punto."
          >
            <div style={{ display: 'grid', gap: '12px' }}>
              {form.branch_delivery_zones.map((relation) => (
                <div
                  key={relation.zone_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1fr) minmax(160px, 220px) auto auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '14px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '14px',
                    background: relation.assigned ? '#ffffff' : '#f9fafb',
                  }}
                >
                  <div>
                    <strong>{relation.zone_name || 'Zona nueva sin nombre'}</strong>
                  </div>
                  <FieldGroup label="Tarifa para esta sucursal">
                    <NumberField
                      value={relation.fee_override}
                      disabled={!relation.assigned}
                      onChange={(event) => updateBranchZone(relation.zone_id, { fee_override: event.target.value })}
                    />
                  </FieldGroup>
                  <CheckboxField
                    label="Asignada"
                    checked={relation.assigned}
                    onChange={(event) => toggleBranchZone(relation.zone_id, event.target.checked)}
                  />
                  <CheckboxField
                    label="Activa"
                    checked={relation.is_active}
                    onChange={(event) => updateBranchZone(relation.zone_id, { is_active: event.target.checked })}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </AdminTabPanel>
      ) : null}

      <FormStatusBar dirty={dirty} saving={saving} error={error} successMessage={successMessage} />
    </AdminPageFrame>
  );
}
