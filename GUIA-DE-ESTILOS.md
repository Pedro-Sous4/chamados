# Guia de Estilos — Sistema de Chamados Laghetto

> Referência visual para todas as telas do sistema. Toda nova página ou componente deve seguir estas definições.

---

## Paleta de Cores

| Nome         | Hex       | Uso principal                                             |
|--------------|-----------|-----------------------------------------------------------|
| Marrom Escuro| `#925616` | Header, títulos de seção, labels de campo, cor primária  |
| Dourado      | `#B6741A` | Subtítulos, badges de tipo, foco de input, botão secundário |
| Creme        | `#F5ECCB` | Bordas de card/input, cabeçalho de tabela, fundo de badge |
| Fundo        | `#F9FAFB` | Background geral das páginas                              |
| Fundo Quente | `#FDF8F0` | Cabeçalho de tabela (`thead`), hover de linha, card-header |
| Fundo Linha  | `#FDF0E0` | Separador entre linhas de tabela (`border-bottom`)        |
| Texto        | `#3b2008` | Texto principal do conteúdo                               |
| Branco       | `#ffffff` | Fundo de cards e inputs                                   |

---

## Header (todas as páginas internas)

```css
header {
  background: #925616;
  color: #fff;
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(146,86,22,.25);
}

header h1 { font-size: 1.2rem; font-weight: 700; letter-spacing: .5px; }
```

- Links no header: `color: #F5ECCB; font-weight: 600`
- Botão Sair no header: `border: 1px solid rgba(245,236,203,.4); color: #F5ECCB`

---

## Cards

```css
.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #F5ECCB;
  box-shadow: 0 1px 6px rgba(146,86,22,.08);
  overflow: hidden;
}
```

### Card com cabeçalho interno

```css
.card-header {
  padding: 20px 24px 14px;
  border-bottom: 2px solid #F5ECCB;
  background: #FDF8F0;
}

.card-header h2 { color: #925616; font-weight: 700; }
.card-header .subtitle { color: #B6741A; opacity: .8; font-size: .8rem; }
```

---

## Tabelas

```css
thead th {
  background: #FDF8F0;
  color: #925616;
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  border-bottom: 2px solid #F5ECCB;
}

tbody tr { border-bottom: 1px solid #FDF0E0; }
tbody tr:hover { background: #FDF8F0; }
tbody td { color: #3b2008; }
```

---

## Inputs e Selects

```css
input, select, textarea {
  border: 1.5px solid #F5ECCB;
  border-radius: 7px;
  color: #3b2008;
  background: #fff;
  font-size: .9rem;
  padding: 9–12px 12–14px;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}

input:focus, select:focus, textarea:focus {
  border-color: #B6741A;
  box-shadow: 0 0 0 3px rgba(182,116,26,.14);
}

input::placeholder { color: #c9a882; }
```

### Labels de campo

```css
label {
  font-size: .75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5–.8px;
  color: #925616;
}
```

---

## Botões

### Primário (ação principal)

```css
.btn-primary {
  background: linear-gradient(135deg, #B6741A, #925616);
  color: #fff;
  border: none;
  border-radius: 7–10px;
  font-weight: 700;
  box-shadow: 0 2–4px 10–18px rgba(146,86,22,.28);
  transition: opacity .15–.2s;
}
.btn-primary:hover { opacity: .88; }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
```

### Secundário / Cancelar

```css
.btn-secondary {
  background: transparent;
  border: 1.5px solid #F5ECCB;
  color: #925616;
  font-weight: 600;
  border-radius: 7px;
}
.btn-secondary:hover { background: #FDF8F0; }
```

### Deletar / Ação destrutiva

```css
.btn-delete {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  border-radius: 6px;
}
.btn-delete:hover { background: #fecaca; }
```

---

## Badges de Status (chamados)

| Status           | Background  | Texto      |
|------------------|-------------|------------|
| Aberto           | `#fef3c7`   | `#92400e`  |
| Em atendimento   | `#dbeafe`   | `#1e40af`  |
| Concluído        | `#d1fae5`   | `#065f46`  |
| Cancelado        | `#fee2e2`   | `#991b1b`  |

```css
.badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 99px;
  font-size: .75rem;
  font-weight: 600;
}
```

### Badge de Tipo

```css
.badge-tipo {
  background: #F5ECCB;
  color: #925616;
  border-radius: 99px;
  padding: 3px 9px;
  font-size: .75rem;
  font-weight: 600;
}
```

---

## Alertas / Mensagens de Retorno

```css
/* Sucesso */
background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7;

/* Erro */
background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;
```

---

## Toolbar / Barra de Filtros

```css
.toolbar {
  background: #fff;
  border-bottom: 2px solid #F5ECCB;
  padding: 14px 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
```

---

## Divider ornamental

```css
.divider {
  width: 48px;
  height: 2px;
  background: linear-gradient(to right, transparent, #B6741A, transparent);
  margin: 0 auto;
}
```

---

## Animações recomendadas

```css
/* Entrada de painel lateral */
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Entrada de card/modal */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Tela de Login (referência)

- **Layout:** dois painéis lado a lado — foto à esquerda (`flex: 1`), formulário à direita (`max-width: 460px`)
- **Painel de login:** `background: #F9FAFB`, `border-left: 1px solid #F5ECCB`
- **Logo:** fundo `#925616`, borda `#B6741A`, sombra dupla com `rgba(182,116,26,.12)`
- **Título:** `#925616` / Subtítulo: `#B6741A`
- **Mobile:** foto como background com overlay `rgba(249,250,251,.88)`

---

## Fontes

```css
font-family: system-ui, -apple-system, sans-serif;
```

Não utilizar fontes externas (Google Fonts, etc.) sem aprovação.

---

## Regras gerais

1. Nunca usar `#1a1a2e`, `#4f46e5` ou outras cores roxas/azuis — fora do padrão Laghetto.
2. Bordas de foco sempre em `#B6741A` com `box-shadow: 0 0 0 3px rgba(182,116,26,.14)`.
3. Novos botões primários sempre com gradiente `#B6741A → #925616`.
4. Cards sempre com `border: 1px solid #F5ECCB` + `box-shadow` quente.
5. Textos de conteúdo em `#3b2008`; nunca usar preto puro `#000`.
