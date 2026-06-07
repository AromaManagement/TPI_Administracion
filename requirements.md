### Especificación de Sistema.

### Requerimientos:

Fuimos contratados por el conocido restaurante de Mendoza, “Aromas de Viña” ubicado en el centro de la capital mendocina. El dueño de restaurante desea realizar un cambio tecnológico en la administración del mismo, junto con la atención al cliente. El software debe poder permitir registrar la carta que se ofrece con sus productos (descripción, foto, precio, ofertas, productos nuevos, etc), además de poder realizar envió de sus productos a domicilio. También desea incorporar tecnología en el servicio al cliente de su local permitiendo una atención más ágil y dinámica. Teniendo en cuenta dichas especificaciones solicita que realicemos una propuesta tecnológica de valor.

#### Propuesta:
1) Software de Administración:
    El software para administración, será de tipo web, programado en capas con acceso a una base de datos donde se almacenarán los datos referidos a las reglas de negocio. El sistema contará con usuarios y perfiles para mozos, cocineros y administrativos.
    
    - Personal Administrativo: tendrá las opciones de: ABM de Usuarios, AMB de Carta del restaurante, la carta se divide en categorías (Entradas, Plato Principal, Postre y Bebidas) donde se deberá se colocará la descripción del producto junto con una imagen y el precio correspondiente. Además, el personal administrativo es el encargado de dar de alta las mesas que posee el local para luego los mozos indicar si se encuentra con comensales y vincular la mesa con los pedidos que realizan los clientes al momento de almorzar o cenar. El personal administrativo se encargará de realizar el control horario del personal por lo que realizará el ABM de horarios que cada empleado debe cumplir y en caso de ausencia (enfermedad o licencia) deberá indicarlo en el sistema. El sotck del restaurante también será administrado por el sistema informático donde se incluirán productos individuales (Ej.: Botella Gaseosa Cola 1L) o productos conformados por otros productos (Ej.: Milanesa con papa fritas) donde el stock es por los productos que componen el producto general. La cobranza de los productos consumidos se registra en el sistema donde el mismo emitirá una factura admitiendo distinto medios de pago (Efectivo, Transferencia, etc) y aplicaciones de pago (Ej.: Mercado Pago.).
    En el caso de los pedidos por delivery el personal administrativo accederá a la lista de pedido, este tipo de pedidos cuando son solicitado directamente ya son asignados a la cocina, luego quedan a la espera de ser entregados al delivery, siendo el personal admirativo el encargado de realizar los cambios de estado. Los pedidos se identifican con los datos del cliente y permiten ver la zona de don es el pedido para organizar la logística de entrega.
    
    - Personal de Cocina: Tendrá acceso a los platos solicitados por los clientes, donde se deberá indicar el plato que cada cocinero se hace responsable. El plato tendrá estados (EN_COCINA, SIN_ASIGNAR, ASIGNADO, ENTREGADO) además de indicar el tiempo desde que lo solicita el cliente hasta que es entregado, mostrando alarmas en caso que pase un cierto tiempo entre estado y estado.
    
    - Personal Mozo/a: Tendrá acceso a las mesas dadas de alta e indicar si la mesa se encuentra libre u ocupada, además de asignar de la carta los productos que se consumirán y registrar la propina entregada al momento de retirarse los comensales.



La estructura de la base de datos está data en el archivo /TPI_Backend/prisma/schema.prisma se debería de trabajar en base a eso. 