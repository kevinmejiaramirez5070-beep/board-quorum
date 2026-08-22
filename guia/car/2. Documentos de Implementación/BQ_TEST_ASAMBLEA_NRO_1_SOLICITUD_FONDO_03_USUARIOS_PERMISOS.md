# BOARD QUORUM – ASAMBLEA GENERAL DE DELEGADOS ASOCOLCI

## SOLICITUD QUIRÚRGICA / CAMBIO DE FONDO N.º 03
### Usuarios y permisos de Board Quorum / Asamblea

**Destino:** Andrés – Implementación Board Quorum  
**Tipo:** Definición funcional de usuarios y permisos  
**Prueba asociada:** TEST ASAMBLEA NRO. 1

---

## 1. OBJETIVO

Definir un esquema simple, controlado y trazable de usuarios operativos para Board Quorum / Asamblea.

Esta definición se refiere únicamente a las **cuentas que administran y operan Board Quorum durante la Asamblea**.

No debe confundirse con los roles propios de la reunión, como Delegado Principal, Delegado Suplente, Presidente, Secretario o Comité Verificador.

La estructura esperada es de **máximo cuatro usuarios operativos**.

Cada cuenta debe ser individual e identificable para garantizar trazabilidad.

---

## 2. ESTRUCTURA DE USUARIOS

| N.º | Perfil | Usuario | Alcance |
|---:|---|---|---|
| **1** | Administrador Maestro | `admin@boardquorum.com` | Acceso total a Board Quorum |
| **2** | Administración / Operación 1 | Nohora Páez – `asocoldmin1` | Operación amplia de Asamblea |
| **3** | Administración / Operación 2 | Usuario por definir | Mismos permisos operativos que Nohora |
| **4** | Revisoría Fiscal | Usuario por definir | Mismos permisos operativos de Administración |

No debe crearse un número mayor de usuarios salvo que aparezca posteriormente una necesidad funcional real.

---

## 3. USUARIO 1 — ADMINISTRADOR MAESTRO

Ya existe actualmente:

```text
admin@boardquorum.com
```

Este usuario se utiliza para administración general de la plataforma y tiene acceso total.

Debe reutilizarse para Asamblea.

Su función es diferente de la operación ordinaria de la reunión.

Puede administrar, conforme a las funcionalidades globales existentes de Board Quorum:

```text
Organizaciones
Productos
Usuarios
Reuniones
Configuraciones
Información general
Demás funcionalidades propias del administrador maestro
```

### Regla

No se requiere crear un segundo Administrador Maestro específico para Asamblea.

---

## 4. USUARIO 2 — ADMINISTRACIÓN / OPERACIÓN 1

Usuario ya existente:

```text
Nohora Páez
Usuario Board Quorum: asocoldmin1
```

Debe reutilizarse también para Asamblea.

Dentro de Asamblea debe tener permisos amplios de administración y operación.

Puede:

```text
Ingresar Delegados
Editar Delegados
Gestionar afiliados si alguna funcionalidad de Asamblea lo requiere
Apoyar registro de participantes
Apoyar ingreso a la Asamblea
Consultar asistencia
Consultar quórum
Consultar Principales y Suplentes
Crear votaciones
Operar las funcionalidades normales de la reunión
Consultar resultados
Consultar / generar reportes
```

---

## 5. USUARIO 3 — ADMINISTRACIÓN / OPERACIÓN 2

Debe existir un segundo usuario individual de apoyo.

Tendrá **los mismos permisos operativos que Nohora dentro de Asamblea**.

Puede:

```text
Ingresar y editar Delegados
Apoyar registro e ingreso
Consultar asistencia y quórum
Consultar Principales y Suplentes
Crear votaciones
Operar las funcionalidades normales de Asamblea
Consultar resultados y reportes
```

### Regla

No debe compartir credenciales con otro usuario.

La finalidad es permitir apoyo simultáneo durante la Asamblea sin perder trazabilidad individual.

---

## 6. USUARIO 4 — REVISORÍA FISCAL

Debe existir un usuario individual para Revisoría Fiscal.

En cuanto a operación de Asamblea tendrá los **mismos permisos operativos de los usuarios de Administración**.

Puede:

```text
Gestionar Delegados
Apoyar registro e ingreso
Consultar asistencia
Consultar quórum
Consultar Principales y Suplentes
Crear votaciones
Operar funciones normales de Asamblea
Consultar resultados y reportes
```

---

## 7. REGLA PARA “APLICAR MOMENTO SIGUIENTE”

La acción:

```text
APLICAR MOMENTO SIGUIENTE
```

debe estar disponible para los usuarios autorizados de operación de Asamblea.

Por tanto, pueden ejecutar materialmente el botón:

```text
Administrador Maestro
Administración / Operación 1
Administración / Operación 2
Revisoría Fiscal
```

### Regla funcional

> **La decisión o indicación de aplicar el Momento Siguiente corresponde a Revisoría Fiscal. La ejecución material del botón dentro de Board Quorum puede ser realizada por cualquiera de los usuarios autorizados de operación de Asamblea.**

Esto permite que, durante la sesión, Revisoría Fiscal indique que corresponde aplicar el Momento Siguiente y cualquiera de los usuarios habilitados pueda ejecutar inmediatamente la acción.

La grabación y transcripción de la sesión constituyen evidencia complementaria de la indicación realizada por Revisoría Fiscal.

Board Quorum debe registrar quién ejecutó materialmente la acción.

---

## 8. CONFIRMACIÓN ANTES DE APLICAR MOMENTO SIGUIENTE

Para reducir errores operativos, al ejecutar el botón debe existir una confirmación explícita equivalente a:

```text
¿Confirma aplicar Momento Siguiente conforme a la indicación de Revisoría Fiscal?

[Confirmar]   [Cancelar]
```

La solución visual exacta puede ser definida técnicamente.

La necesidad funcional es evitar activaciones accidentales y dejar evidencia de una acción consciente del usuario.

---

## 9. MATRIZ RESUMIDA DE PERMISOS

| Función | Admin Master | Admin 1 | Admin 2 | Revisoría Fiscal |
|---|:---:|:---:|:---:|:---:|
| Administrar Board Quorum globalmente | Sí | No | No | No |
| Ingresar / editar Delegados | Sí | Sí | Sí | Sí |
| Gestionar afiliados si aplica | Sí | Sí | Sí | Sí |
| Registro / ingreso de participantes | Sí | Sí | Sí | Sí |
| Consultar asistencia | Sí | Sí | Sí | Sí |
| Consultar quórum | Sí | Sí | Sí | Sí |
| Consultar Principales / Suplentes | Sí | Sí | Sí | Sí |
| Crear votaciones | Sí | Sí | Sí | Sí |
| Operar Asamblea | Sí | Sí | Sí | Sí |
| Consultar resultados / reportes | Sí | Sí | Sí | Sí |
| Ejecutar “Aplicar Momento Siguiente” | Sí | Sí | Sí | Sí |

### Nota crítica

Que todos puedan ejecutar materialmente el botón **no cambia la regla funcional de que su aplicación debe responder a la indicación de Revisoría Fiscal**.

---

## 10. TRAZABILIDAD INDIVIDUAL

Cada usuario debe ser nominativo e individual.

Board Quorum debe permitir reconstruir como mínimo:

```text
Usuario
Acción realizada
Fecha y hora
Asamblea / reunión
```

Ejemplos:

```text
Usuario: asocoldmin1
Acción: creó la votación “Aprobación del Orden del Día”
Fecha y hora: [...]
Reunión: [...]
```

o:

```text
Usuario: [usuario]
Acción: Aplicar Momento Siguiente
Fecha y hora: [...]
Reunión: [...]
```

No deben utilizarse cuentas compartidas entre varias personas.

---

## 11. CRITERIOS DE ACEPTACIÓN

La solicitud se considera resuelta cuando:

- [ ] Existe un máximo de cuatro usuarios operativos definidos para Asamblea.
- [ ] Se reutiliza el Administrador Maestro existente.
- [ ] Se reutiliza el usuario `asocoldmin1` para Nohora.
- [ ] Existe un segundo usuario de Administración con los mismos permisos de Nohora.
- [ ] Existe un usuario individual para Revisoría Fiscal.
- [ ] Los tres usuarios operativos de Asamblea pueden crear votaciones.
- [ ] Los cuatro usuarios definidos pueden ejecutar materialmente “Aplicar Momento Siguiente”.
- [ ] La acción “Aplicar Momento Siguiente” exige confirmación previa.
- [ ] Board Quorum registra quién ejecutó cada acción relevante.
- [ ] Las cuentas son individuales y no compartidas.
- [ ] La estructura de permisos puede probarse de forma separada por usuario.
- [ ] La implementación reutiliza y adapta usuarios/permisos existentes antes de construir nuevos mecanismos.

---

## CONCLUSIÓN FUNCIONAL

> **Board Quorum / Asamblea debe operar con un máximo de cuatro usuarios nominativos: un Administrador Maestro, dos usuarios de Administración / Operación y un usuario de Revisoría Fiscal. Los tres perfiles operativos de Asamblea deben poder gestionar Delegados, apoyar registro e ingreso, consultar quórum, crear votaciones, operar la reunión y consultar resultados. La acción “Aplicar Momento Siguiente” puede ser ejecutada materialmente por cualquiera de los cuatro usuarios autorizados, pero debe responder a la indicación de Revisoría Fiscal y quedar trazada con usuario, fecha y hora.**

---

**Fin – Solicitud Quirúrgica / Cambio de Fondo N.º 03**
