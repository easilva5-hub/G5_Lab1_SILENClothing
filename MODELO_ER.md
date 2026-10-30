# Modelo entidad-relación · SILEN Clothing · Lab 3

```mermaid
erDiagram
 USER ||--|| CUSTOMER : tiene
 CUSTOMER ||--o{ ORDER : realiza
 ORDER ||--|{ ORDER_ITEM : contiene
 PRENDA ||--o{ ORDER_ITEM : aparece
 CATEGORIA |o--o{ PRENDA : clasifica
```

| Relación | Cardinalidad | onDelete y justificación |
|---|---|---|
| User–Customer | 1:1, `customer.userId @unique` | `Cascade`: elimina el perfil al eliminar al usuario. |
| Customer–Order | 1:N | `Restrict`: conserva historial y evita borrar clientes con pedidos. |
| Order–OrderItem | 1:N | `Cascade`: elimina líneas si se elimina el pedido. |
| Prenda–OrderItem | 1:N (Order–Prenda es N:M) | `Restrict`: impide eliminar una prenda con historial de compras. |
| Categoria–Prenda | 1:N | `SetNull`: elimina la categoría sin borrar inventario. |

`OrderItem` modela N:M explícita y guarda `quantity` y `unitPrice` como precio histórico. `Role` y `OrderStatus` son enums. `Prenda.precio`, `Order.total` y `OrderItem.unitPrice` usan Decimal(10,2); las fechas usan DateTime. Hay índice compuesto `[status, createdAt]`, clave compuesta `[orderId,prendaId]`, campos `@map` y tablas `@@map` snake_case. El campo de texto `categoria` original se conserva por compatibilidad y `categoriaId` agrega la FK real.

## Taller · Tarjeta B: categorización múltiple

- **Prenda ↔ Categoria: N:M implícita (`PrendaCategorias`)**. Una prenda puede pertenecer a varias categorías y cada categoría puede incluir varias prendas. Prisma genera y administra automáticamente la tabla intermedia; no se especifica `onDelete` en una N:M implícita. Al eliminar una categoría se eliminan los enlaces de la tabla intermedia, no las prendas.
- **Prenda → Categoria (categoría principal): N:1 legado del Lab 3**, mediante `categoriaId` opcional; `onDelete: SetNull` mantiene prendas existentes si se borra la categoría principal. Se conserva para compatibilidad.
- Las relaciones son distintas y están separadas por el nombre `@relation("PrendaCategorias")` de la N:M.

```mermaid
erDiagram
    PRENDA }o--o{ CATEGORIA : "N:M etiquetas (PrendaCategorias)"
    PRENDA }o--o| CATEGORIA : "N:1 principal (SetNull)"
```
