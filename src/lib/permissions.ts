export type AppRole = 'garzon' | 'jefe_local' | 'admin';

export type AppModule =
  | 'dashboard'
  | 'usuarios'
  | 'mesas'
  | 'productos'
  | 'pedidos'
  | 'caja'
  | 'inventario'
  | 'impresion'
  | 'delivery'
  | 'fidelizacion'
  | 'personal'
  | 'pos'
  | 'analisis'
  | 'reportes';

const rolePermissions: Record<AppRole, AppModule[]> = {
  garzon: ['dashboard', 'pedidos', 'mesas', 'impresion'],
  jefe_local: ['dashboard', 'pedidos', 'mesas', 'caja', 'inventario', 'usuarios', 'impresion', 'pos'],
  admin: ['dashboard', 'usuarios', 'mesas', 'productos', 'pedidos', 'caja', 'inventario', 'impresion', 'delivery', 'fidelizacion', 'personal', 'pos', 'analisis', 'reportes'],
};

export const hasModuleAccess = (role: AppRole | null, module: AppModule): boolean => {
  if (!role) return false;
  return rolePermissions[role].includes(module);
};

export const getAccessibleModules = (role: AppRole | null): AppModule[] => {
  if (!role) return [];
  return rolePermissions[role];
};

export const roleDisplayName: Record<AppRole, string> = {
  garzon: 'Garzón',
  jefe_local: 'Jefe de Local',
  admin: 'Administrador',
};
