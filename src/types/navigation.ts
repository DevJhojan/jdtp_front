export type RootTabParamList = {
  Resumen: undefined;
  Cuentas: undefined;
  Movimientos: undefined;
  Transferencias: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Configuracion: undefined;
  NuevaCuenta: { accountId?: number };
  NuevoMovimiento: { transactionId?: number };
  NuevaTransferencia: undefined;
};
