import { appSettings, eq, type Db } from '@tableria/db';
import { logAdminAction } from '../admin/audit.js';

const SETTINGS_ROW_ID = 'singleton';

export interface MaintenanceStatus {
  enabled: boolean;
  message: string | null;
}

// Cache en memoria (un solo proceso, mismo patrón que el registro de partidas en curso):
// evita una consulta a BD en cada petición/heartbeat solo para leer un flag que cambia
// rara vez. Se refresca al arrancar y en cada `setMaintenanceStatus`.
let cached: MaintenanceStatus | null = null;

async function loadStatus(db: Db): Promise<MaintenanceStatus> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ROW_ID)).limit(1);
  return { enabled: row?.maintenanceMode ?? false, message: row?.maintenanceMessage ?? null };
}

export async function getMaintenanceStatus(db: Db): Promise<MaintenanceStatus> {
  if (!cached) cached = await loadStatus(db);
  return cached;
}

export async function setMaintenanceStatus(
  db: Db,
  params: { adminUserId: string; enabled: boolean; message: string | null },
): Promise<MaintenanceStatus> {
  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ROW_ID, maintenanceMode: params.enabled, maintenanceMessage: params.message })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { maintenanceMode: params.enabled, maintenanceMessage: params.message, updatedAt: new Date() },
    });

  cached = { enabled: params.enabled, message: params.message };

  await logAdminAction(db, {
    adminUserId: params.adminUserId,
    action: 'settings.setMaintenance',
    targetType: 'app_settings',
    targetId: SETTINGS_ROW_ID,
    detail: { enabled: params.enabled, message: params.message },
  });

  return cached;
}
