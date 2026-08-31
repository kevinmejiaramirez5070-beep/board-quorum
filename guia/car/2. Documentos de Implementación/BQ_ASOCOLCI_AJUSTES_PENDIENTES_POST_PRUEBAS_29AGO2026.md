# BOARD QUORUM – ASOCOLCI
## AJUSTES PENDIENTES POSTERIORES A PRUEBAS FINALES
### Asamblea General de Delegados + Usuarios operativos

**Destino:** Andrés – Implementación Board Quorum  
**Fecha de consolidación:** 29 de agosto de 2026  
**Objetivo:** consolidar en un solo documento únicamente los ajustes pendientes identificados en las pruebas finales.  
**Principio:** no modificar comportamientos que ya están funcionando correctamente.

---

# 1. ESTADO GENERAL

La lógica principal de quórum y votación de Asamblea ha mejorado y, en las últimas pruebas, los siguientes comportamientos ya funcionan correctamente:

- Universo funcional de Asamblea: **85**.
- Quórum inicial: **44**.
- Momento Siguiente: **17**.
- Con 16 representaciones computables: **SIN QUÓRUM**.
- Con 17 representaciones computables: **QUÓRUM ALCANZADO**.
- Suplente con Principal presente: registra asistencia, pero **no aumenta quórum**.
- Suplente sin Principal asociado en el Maestro: **sí puede actuar como representación válida**.
- Principal presente: puede votar.
- Suplente con Principal presente: no puede votar.
- Suplente que actúa válidamente: puede votar.
- Delegado que no registra asistencia: no puede votar.
- Máximo un voto efectivo por representación.

Por tanto, este documento **no solicita rehacer la lógica anterior**.  
Solicita corregir inconsistencias de universo, mensajes, etiquetas, reportes y configuración de usuarios.

---

# 2. AJUSTE 01 – UNIVERSO ÚNICO DE ASAMBLEA: 85, NO 90

## Evidencia observada

En una prueba con 16 representaciones computables, una pantalla administrativa mostró:

```text
16 / 90 cursos representados
```

Sin embargo, en la misma reunión Board Quorum mostró y reportó correctamente:

```text
Total principales = 85
Elegibles = 85
Quórum inicial = 44
Momento Siguiente = 17
```

## Regla requerida

Para Asamblea General:

```text
U = 85
```

Ese mismo universo debe utilizarse y mostrarse en:

```text
resumen
detalle
pantalla administrativa
proyección
Momento Siguiente
PDF
estado de quórum
```

## Criterio de aceptación

```text
Q / 85
```

Nunca debe aparecer:

```text
Q / 90
```

mientras el Maestro vigente tenga 85 posiciones principales habilitadas.

---

# 3. AJUSTE 02 – DIFERENCIAR ASISTENTES DE REPRESENTACIONES COMPUTABLES

## Problema

En reportes de asistencia/quórum se utilizan textos como:

```text
Presentes: 17
Votos computables: 17
```

aunque en el mismo reporte existan, por ejemplo:

```text
18 personas presentes
17 representaciones computables
```

## Regla requerida

Board Quorum debe distinguir explícitamente:

```text
ASISTENTES REGISTRADOS
≠
REPRESENTACIONES COMPUTABLES PARA QUÓRUM
```

## Texto sugerido

### Resumen

```text
Asistentes registrados: 18
Representaciones computables para quórum: 17
Universo habilitado: 85
Mínimo vigente: 17
Resultado: QUÓRUM ALCANZADO
```

### Detalle

Cambiar:

```text
Votos computables
```

por:

```text
Representaciones computables
```

En la fase de asistencia/quórum todavía no estamos contabilizando votos.

---

# 4. AJUSTE 03 – CAMBIAR “CARGO” POR “CURSO” EN ASAMBLEA

En los reportes de Asamblea aparecen valores como:

```text
CUARTO F
TRANSICIÓN E
PREJARDÍN A
```

bajo una columna llamada:

```text
Cargo
```

Estos valores son cursos, no cargos.

## Ajuste

En Asamblea utilizar:

```text
Curso
```

Cuando sea necesario, mostrar separadamente:

```text
Rol: Principal / Suplente
Curso: CUARTO F
```

---

# 5. AJUSTE 04 – SUPLENTE: DISTINGUIR “PRINCIPAL AUSENTE” DE “CURSO SIN PRINCIPAL”

## Caso probado

```text
SANCHEZ GONZALEZ NANCY PILAR
Curso: CUARTO F
Rol de origen: SUPLENTE
Principal asociado en Maestro: NO EXISTE
```

Board Quorum resolvió correctamente el efecto funcional:

```text
Suplente actúa
→ cuenta para quórum
→ puede votar
```

Sin embargo, en la pantalla pública mostró un mensaje similar a:

```text
El Delegado Principal del curso CUARTO F no se encuentra presente...
```

## Problema

Ese mensaje es impreciso.

En CUARTO F no existe un Principal asociado en el Maestro.

## Regla requerida

Board Quorum debe diferenciar:

### Escenario A

```text
Principal existe en Maestro
Principal ausente
Suplente presente
```

Mensaje:

```text
El Delegado Principal no se encuentra presente.
El Suplente ejerce actualmente la representación del curso.
```

### Escenario B

```text
Principal NO existe en Maestro
Suplente presente
```

Mensaje:

```text
El curso no tiene Delegado Principal asociado en el Maestro.
El Suplente ejerce la representación válida del curso.
```

## Importante

El cálculo actual de CUARTO F **sí debe conservarse**.

El ajuste solicitado es de causal y trazabilidad.

---

# 6. AJUSTE 05 – PROYECCIÓN DE QUÓRUM EN MOMENTO SIGUIENTE

Cuando Momento Siguiente está activo, la pantalla de proyección debe explicar por qué el mínimo vigente es 17.

Evitar textos como:

```text
18 votan quórum
17 votos
Total presentes: 18 / 85
```

El quórum no se “vota”.

## Propuesta

```text
MOMENTO SIGUIENTE ACTIVO

Universo de Delegados habilitados: 85
Quórum inicial requerido: 44
Mínimo vigente en Momento Siguiente: 17
Representaciones computables actuales: 18
Resultado: QUÓRUM ALCANZADO
```

Si se desea mostrar asistentes:

```text
Asistentes registrados: 24
```

como cifra independiente.

---

# 7. AJUSTE 06 – CONSISTENCIA HORARIA EN VISTAS PÚBLICAS

Durante diferentes pruebas se observaron vistas públicas con horas distintas a la hora configurada en administración/reporte.

Ejemplo observado:

```text
Hora configurada / administrativa: 1:50 p. m.
Vista pública: 8:50
```

## Requerimiento

La misma hora de reunión debe mostrarse consistentemente en:

```text
administración
registro público de asistencia
votación
proyección
PDF
trazabilidad
```

## Nota

No se presume la causa técnica.

Se solicita corregir la inconsistencia observada.

---

# 8. AJUSTE 07 – REPORTE DE VOTACIÓN DE ASAMBLEA: ELIMINAR REFERENCIA A JUNTA DE VIGILANCIA

En reportes de votación de Asamblea aparece:

```text
[OK] La Junta de Vigilancia emitió un único voto institucional.
```

## Ajuste

Eliminar esa validación del reporte de Asamblea General.

No debe aparecer como control estándar de una votación de Asamblea.

---

# 9. AJUSTE 08 – “VOTOS DUPLICADOS POR CARGO”

En reportes de Asamblea aparece:

```text
No se registraron votos duplicados por cargo.
```

## Ajuste

Cambiar por:

```text
No se registraron votos duplicados por curso o representación.
```

La unidad funcional de decisión en Asamblea es la representación válida del curso.

---

# 10. AJUSTE 09 – TIPO DE VOTACIÓN Y RESULTADO DE APROBACIONES ORDINARIAS

## Caso observado

Votación:

```text
Aprobación del Orden del Día
```

Board Quorum la reportó como:

```text
Tipo de votación: Selección múltiple
```

y concluyó:

```text
La opción A FAVOR obtiene 20 votos, siendo la más votada.
```

## Problema

Para una decisión del tipo:

```text
¿Se aprueba el Orden del Día?
```

la plataforma debe tratarla como decisión ordinaria de aprobación, no como selección entre opciones competitivas.

## Regla requerida

Opciones:

```text
A FAVOR
EN CONTRA
ABSTENCIÓN
```

La conclusión debe indicar:

```text
APROBADA
```

o:

```text
NO APROBADA
```

según la mayoría requerida.

---

# 11. AJUSTE 10 – SEPARAR QUÓRUM, HABILITADOS Y MAYORÍA REQUERIDA

Estas tres cifras son diferentes.

## Fórmulas

### Universo

```text
U = 85
```

### Momento Siguiente

```text
Q_MS = CEIL(U × 0,20)
Q_MS = CEIL(85 × 0,20)
Q_MS = 17
```

### Votantes habilitados

```text
V = representaciones computables presentes habilitadas para votar
```

### Mayoría simple

```text
M = FLOOR(V / 2) + 1
```

## Ejemplo con 24 habilitados

```text
V = 24
M = FLOOR(24 / 2) + 1
M = 13
```

Por tanto:

```text
Quórum mínimo vigente = 17
Votantes habilitados presentes = 24
Mayoría requerida = 13 votos a favor
```

## Ejemplo con 18 habilitados

```text
V = 18
M = FLOOR(18 / 2) + 1
M = 10
```

## Criterio de aceptación

Board Quorum debe mostrar separadamente:

```text
Quórum mínimo vigente
Votantes habilitados presentes
Mayoría requerida
Votos a favor
Resultado
```

El número 17 de Momento Siguiente no debe utilizarse como mayoría requerida para aprobar una proposición.

---

# 12. AJUSTE 11 – RESULTADO DECISORIO DEL REPORTE

Ejemplo esperado:

```text
Votantes habilitados: 24
Mayoría simple requerida: 13
Votos a favor: 20
Votos en contra: 0
Abstenciones: 0

RESULTADO: APROBADA
20 votos a favor sobre 13 requeridos.
```

Evitar concluir únicamente:

```text
“A FAVOR fue la opción más votada”
```

cuando el asunto corresponde a una aprobación ordinaria.

---

# 13. CONFIGURACIÓN DE USUARIOS – RESTRICCIÓN POR ORGANIZACIÓN

## 13.1 asocoldmin1

**Usuario operativo:** Nohora Idali Páez Menjura  
**Login:** `asocoldmin1`  
**Organización permitida:** únicamente ASOCOLCI

Debe poder ingresar a:

```text
Asamblea General de Delegados
Junta Directiva
```

No debe visualizar ni ingresar a otras organizaciones/clientes.

### Asamblea

Conservar las funciones operativas actualmente habilitadas.

### Junta Directiva

Debe poder:

```text
consultar miembros
editar nombres/datos de miembros
retirar/inactivar miembros
crear reuniones
registrar/administrar asistencia
crear/administrar votaciones
generar reportes
```

---

## 13.2 asocoldmin2

**Login:** `asocoldmin2`

Mismas condiciones funcionales que `asocoldmin1`.

```text
1 usuario
→ únicamente ASOCOLCI
→ Asamblea General + Junta Directiva
```

---

## 13.3 Adm2revisorasocolci

**Login:** `Adm2revisorasocolci`

Debe ingresar únicamente a:

```text
ASOCOLCI
```

y tener acceso tanto a:

```text
Asamblea General
Junta Directiva
```

Debe conservar las funcionalidades actualmente definidas en Board Quorum para el perfil operativo de Revisoría Fiscal.

## Importante

Los permisos de plataforma no modifican los derechos estatutarios del participante.

El perfil de Revisoría puede operar las funciones autorizadas de Board Quorum, pero su rol en la reunión mantiene las reglas propias de Revisoría Fiscal.

---

## 13.4 ADMIN MASTER

**Login:** `admin@boardquorum.com`

Debe conservar exactamente su alcance actual:

```text
todos los clientes / organizaciones
todas las funcionalidades
administración global
```

No aplicar restricción por organización.

---

# 14. SEGURIDAD DE CREDENCIALES

Las contraseñas no deben incorporarse en este documento ni en reportes funcionales.

Las credenciales deben manejarse por separado.

---

# 15. CRITERIOS FINALES DE ACEPTACIÓN

Antes de cerrar los ajustes, validar:

- [ ] Asamblea muestra siempre universo 85.
- [ ] No vuelve a aparecer 90 como denominador de Asamblea.
- [ ] Asistentes y representaciones computables se muestran como cifras diferentes.
- [ ] “Votos computables” no se utiliza en un reporte de asistencia/quórum.
- [ ] En Asamblea se utiliza “Curso”, no “Cargo”, cuando corresponda.
- [ ] Suplente con Principal ausente recibe causal correcta.
- [ ] Suplente de curso sin Principal recibe causal correcta.
- [ ] Proyección de Momento Siguiente muestra 85 / 44 / 17 de forma clara.
- [ ] Las horas coinciden entre administración, público y reportes.
- [ ] Reporte de Asamblea no contiene control de voto institucional de Junta de Vigilancia.
- [ ] Reporte usa “curso o representación”, no “cargo”, para duplicidad.
- [ ] Aprobaciones ordinarias no se reportan como selección múltiple.
- [ ] Quórum, habilitados y mayoría se muestran separadamente.
- [ ] El resultado de una aprobación indica APROBADA / NO APROBADA y su base numérica.
- [ ] `asocoldmin1` ve únicamente ASOCOLCI y opera Asamblea + Junta Directiva.
- [ ] `asocoldmin2` ve únicamente ASOCOLCI y opera Asamblea + Junta Directiva.
- [ ] `Adm2revisorasocolci` ve únicamente ASOCOLCI y conserva su perfil operativo de Revisoría.
- [ ] Admin Master conserva acceso global.
- [ ] Las contraseñas no aparecen en documentación funcional.

---

# 16. CONCLUSIÓN

La lógica principal de quórum y votación ya presenta un comportamiento sustancialmente correcto en las últimas pruebas.

Los ajustes pendientes se concentran principalmente en:

```text
consistencia del universo
claridad de etiquetas
causales correctas
trazabilidad
reportes de Asamblea
cálculo/explicación de mayorías
configuración de usuarios
```

La solicitud es ajustar estos puntos **sin alterar las funcionalidades que ya pasaron las pruebas**.
