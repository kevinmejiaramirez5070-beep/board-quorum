# BOARD QUORUM
## 02 – AJUSTE FINAL | GESTIÓN DE NUEVOS CLIENTES – ADMIN MASTER

**Destino:** Andrés – Implementación Board Quorum  
**Fecha:** 8 de septiembre de 2026  
**Tipo:** Ajuste funcional final y puntual  
**Usuario autorizado:** Admin Master – Javier Castilla Robles

---

# 1. OBJETIVO

Mejorar la pantalla:

```text
Admin Master
→ Organizaciones
→ Nueva Organización
```

para que funcione como una ficha básica de creación/onboarding de nuevos clientes dentro de Board Quorum.

> **Esta funcionalidad debe ser exclusiva del Admin Master.**

No debe estar disponible para administradores operativos de clientes como ASOCOLCI.

---

# 2. COMPORTAMIENTO ACTUAL

Actualmente la pantalla de **Nueva Organización** permite diligenciar:

```text
Nombre de la Organización
Subdominio
Logo
Color Primario
Color Secundario
Nombre del Cliente Piloto
Email del Cliente Piloto
Contraseña del Cliente Piloto
```

La base funcional ya existe y debe conservarse.

La solicitud es ampliar ligeramente esta ficha para que la creación de un cliente nuevo quede mejor identificada y organizada.

---

# 3. USUARIO AUTORIZADO

Esta funcionalidad debe permanecer restringida a:

```text
Javier Castilla Robles
Rol: ADMIN MASTER
```

El Admin Master puede:

```text
ver todas las organizaciones
crear nuevas organizaciones
editar organizaciones
entrar a cualquier cliente
crear/configurar el administrador inicial
```

Los usuarios operativos de una organización:

```text
asocoldmin1
asocoldmin2
Adm2revisorasocolci
```

no deben:

```text
crear nuevas organizaciones
ver otros clientes
administrar el onboarding global
```

---

# 4. DATOS BÁSICOS DE LA ORGANIZACIÓN

Al crear una nueva organización, permitir diligenciar como mínimo:

```text
NIT / Identificación
Razón Social
Nombre corto / Nombre visible en Board Quorum
Naturaleza jurídica
Tipo de organización
Ciudad
País
Subdominio
Estado
```

## Naturaleza jurídica

Lista básica sugerida:

```text
Sociedad comercial / con ánimo de lucro
Entidad sin ánimo de lucro – ESAL
Entidad pública
Propiedad horizontal
Otra
```

## Tipo de organización

Lista básica sugerida:

```text
Asociación de Padres de Familia
Asociación
Fundación
Corporación
Cooperativa
Fondo de Empleados
Propiedad Horizontal / Copropiedad
Gremio / Federación
Institución Educativa
Empresa / Sociedad Comercial
Entidad Pública
Otra
```

Si se selecciona:

```text
Otra
```

habilitar un campo:

```text
Especifique: ______________________
```

---

# 5. ÓRGANOS O REUNIONES QUE REQUIERE GESTIONAR

Incluir un bloque informativo con selección múltiple mediante checkbox.

Título sugerido:

> **Órganos o reuniones que requiere gestionar en Board Quorum**

Opciones iniciales:

```text
☐ Junta Directiva
☐ Asamblea General
☐ Asamblea General de Delegados
☐ Asamblea de Accionistas
☐ Consejo de Administración
☐ Consejo Directivo
☐ Junta de Vigilancia
☐ Comité
☐ Otro
```

Si selecciona:

```text
Otro
```

habilitar:

```text
Especifique: ______________________
```

## Importante

En esta solicitud estos checkbox son **información de onboarding**.

No se solicita que por sí solos:

```text
creen módulos
parametricen reglas
generen configuraciones automáticas
```

Su objetivo inicial es dejar registrada la necesidad funcional/comercial del cliente.

---

# 6. IDENTIDAD VISUAL

Conservar los campos actuales:

```text
Logo
Color Primario
Color Secundario
Subdominio
```

Estos datos permiten personalizar la experiencia del cliente dentro de Board Quorum.

---

# 7. CONTACTO PRINCIPAL

Agregar un bloque básico:

```text
Nombre del contacto principal
Cargo
Correo electrónico
Teléfono
```

Este contacto puede coincidir o no con el administrador inicial.

---

# 8. ADMINISTRADOR INICIAL

Cambiar la denominación actual:

```text
Datos del Cliente Piloto
```

por una expresión general:

```text
Administrador inicial de la organización
```

Campos:

```text
Nombre completo
Correo electrónico
Contraseña inicial
```

Si Board Quorum utiliza posteriormente un login independiente del correo, puede incorporarse también:

```text
Usuario / Login
```

---

# 9. ESTRUCTURA PROPUESTA DEL FORMULARIO

La pantalla podría quedar organizada en cinco bloques:

```text
1. DATOS DE LA ORGANIZACIÓN
2. IDENTIDAD VISUAL
3. ÓRGANOS / REUNIONES REQUERIDOS
4. CONTACTO PRINCIPAL
5. ADMINISTRADOR INICIAL
```

Luego:

```text
CREAR ORGANIZACIÓN
```

---

# 10. COMPORTAMIENTO ESPERADO

Flujo:

```text
ADMIN MASTER
        ↓
Organizaciones
        ↓
Nueva Organización
        ↓
Diligencia ficha básica
        ↓
Diligencia necesidades / órganos
        ↓
Diligencia administrador inicial
        ↓
Crear
        ↓
Nueva organización disponible
```

Después de la creación:

```text
Admin Master
→ puede seguir viendo todas las organizaciones

Administrador del nuevo cliente
→ debe ingresar únicamente a su organización
```

---

# 11. SEGREGACIÓN

La creación de una nueva organización no debe afectar la separación entre clientes.

Criterio esperado:

```text
Cliente A
≠
Cliente B
```

Usuarios de un cliente no deben poder:

```text
ver
seleccionar
consultar
editar
```

otras organizaciones.

El Admin Master sí mantiene acceso global.

---

# 12. CRITERIOS DE ACEPTACIÓN

- [ ] Solo Admin Master puede crear nuevas organizaciones.
- [ ] El formulario conserva Nombre, Subdominio, Logo y colores.
- [ ] Se incorpora NIT / Identificación.
- [ ] Se incorpora Razón Social.
- [ ] Se incorpora Nombre corto / visible.
- [ ] Se incorpora Naturaleza jurídica.
- [ ] Se incorpora Tipo de organización.
- [ ] Se incorpora Ciudad y País.
- [ ] Se incorpora bloque de órganos/reuniones requeridos con checkbox.
- [ ] Los checkbox quedan inicialmente como información de onboarding.
- [ ] Se incorpora Contacto Principal.
- [ ] “Datos del Cliente Piloto” cambia a “Administrador inicial de la organización”.
- [ ] Se mantiene creación de usuario administrador inicial.
- [ ] El nuevo cliente queda segregado de los demás.
- [ ] El Admin Master conserva acceso global.
- [ ] Los administradores operativos de clientes no pueden crear organizaciones.

---

# 13. RESULTADO ESPERADO

La pantalla debe permitir que el Admin Master cree una organización con una ficha mínima suficientemente útil para identificar:

```text
quién es el cliente
qué tipo de organización es
qué órganos/reuniones requiere
quién es su contacto
quién será su administrador inicial
cómo se verá dentro de Board Quorum
```

sin convertir el onboarding en un formulario pesado.

---

# CONCLUSIÓN

> **La solicitud consiste en mejorar la pantalla actual de “Nueva Organización” para que el Admin Master pueda crear nuevos clientes con una ficha básica, ordenada y útil. La funcionalidad debe seguir siendo exclusiva del Admin Master y no implica todavía automatizar configuraciones según el tipo de organización o los órganos seleccionados.**

---

**Fin de la solicitud**
