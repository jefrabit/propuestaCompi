import { useState, useMemo } from "react";

const KEYWORDS = new Set([
  "tienda",
  "config",
  "tema",
  "categoria",
  "producto",
]);

// Mapeo de códigos de token (estilo C++)
const TOKEN_CODE = {
  TIENDA: 0, CONFIG: 1, TEMA: 2, CATEGORIA: 3, PRODUCTO: 4,
  NOMBRE: 5, DESCRIPCION: 6, SEO_TITULO: 7, SEO_TAGS: 8, IMAGEN: 9,
  PRECIO: 10, STOCK: 11, MONEDA: 12, IDIOMA: 13,
  COLORES: 14, TIPOGRAFIA: 15, LAYOUT: 16, PRIMARIO: 17, SECUNDARIO: 18, FONDO: 19, TEXTO: 20,
  TITULOS: 21, CUERPO: 22, ESTRUCTURA: 23, BOTONES: 24, ALINEACION: 25,
  ALLAVE: 26, CLLAVE: 27, IGUAL: 28, DOSPUNTOS: 29, CORCHETE_IZQ: 30, CORCHETE_DER: 31, COMA: 32, NUMERAL: 33,
  CADENA: 34, NUMERO: 35, ID: 36, COLOR_HEX: 37,
  IDMONEDA: 38, IDIDIOMA: 39, TIPODEFUENTE: 40, VALESTRUCTURA: 41, VALESTILOBOTONES: 42, VALALINEACION: 43,
  FIN: 666, ERROR: 999,
};

const RESERVED_ENTRIES = [
  // Palabras clave principales
  { lex: 'tienda', code: TOKEN_CODE.TIENDA },
  { lex: 'config', code: TOKEN_CODE.CONFIG },
  { lex: 'tema', code: TOKEN_CODE.TEMA },
  { lex: 'categoria', code: TOKEN_CODE.CATEGORIA },
  { lex: 'producto', code: TOKEN_CODE.PRODUCTO },
  // Atributos
  { lex: 'nombre', code: TOKEN_CODE.NOMBRE },
  { lex: 'descripcion', code: TOKEN_CODE.DESCRIPCION },
  { lex: 'seo_titulo', code: TOKEN_CODE.SEO_TITULO },
  { lex: 'seo_tags', code: TOKEN_CODE.SEO_TAGS },
  { lex: 'imagen', code: TOKEN_CODE.IMAGEN },
  { lex: 'precio', code: TOKEN_CODE.PRECIO },
  { lex: 'stock', code: TOKEN_CODE.STOCK },
  { lex: 'moneda', code: TOKEN_CODE.MONEDA },
  { lex: 'idioma', code: TOKEN_CODE.IDIOMA },
  // Tema
  { lex: 'colores', code: TOKEN_CODE.COLORES },
  { lex: 'tipografia', code: TOKEN_CODE.TIPOGRAFIA },
  { lex: 'layout', code: TOKEN_CODE.LAYOUT },
  { lex: 'primario', code: TOKEN_CODE.PRIMARIO },
  { lex: 'secundario', code: TOKEN_CODE.SECUNDARIO },
  { lex: 'fondo', code: TOKEN_CODE.FONDO },
  { lex: 'texto', code: TOKEN_CODE.TEXTO },
  { lex: 'titulos', code: TOKEN_CODE.TITULOS },
  { lex: 'cuerpo', code: TOKEN_CODE.CUERPO },
  { lex: 'estructura', code: TOKEN_CODE.ESTRUCTURA },
  { lex: 'botones', code: TOKEN_CODE.BOTONES },
  { lex: 'alineacion', code: TOKEN_CODE.ALINEACION },
  // Símbolos
  { lex: '{', code: TOKEN_CODE.ALLAVE },
  { lex: '}', code: TOKEN_CODE.CLLAVE },
  { lex: '=', code: TOKEN_CODE.IGUAL },
  { lex: ':)', code: TOKEN_CODE.DOSPUNTOS },
  { lex: '[', code: TOKEN_CODE.CORCHETE_IZQ },
  { lex: ']', code: TOKEN_CODE.CORCHETE_DER },
  { lex: ',', code: TOKEN_CODE.COMA },
  { lex: '#', code: TOKEN_CODE.NUMERAL },
  // Valores fijos
  { lex: 'USD', code: TOKEN_CODE.IDMONEDA },
  { lex: 'EUR', code: TOKEN_CODE.IDMONEDA },
  { lex: 'PEN', code: TOKEN_CODE.IDMONEDA },
  { lex: 'es', code: TOKEN_CODE.IDIDIOMA },
  { lex: 'serif', code: TOKEN_CODE.TIPODEFUENTE },
  { lex: 'sans_serif', code: TOKEN_CODE.TIPODEFUENTE },
  { lex: 'grid_dos', code: TOKEN_CODE.VALESTRUCTURA },
  { lex: 'grid_tres', code: TOKEN_CODE.VALESTRUCTURA },
  { lex: 'grid_cuatro', code: TOKEN_CODE.VALESTRUCTURA },
  { lex: 'redondeado', code: TOKEN_CODE.VALESTILOBOTONES },
  { lex: 'cuadrado', code: TOKEN_CODE.VALESTILOBOTONES },
  { lex: 'izquierda', code: TOKEN_CODE.VALALINEACION },
  { lex: 'centro', code: TOKEN_CODE.VALALINEACION },
  { lex: 'derecha', code: TOKEN_CODE.VALALINEACION },
];

const ATTRS = new Set([
  "nombre",
  "descripcion",
  "seo_titulo",
  "seo_tags",
  "imagen",
  "precio",
  "stock",
  "categoria",
  "moneda",
  "idioma",
  "colores",
  "tipografia",
  "layout",
  "primario",
  "secundario",
  "fondo",
  "texto",
  "titulos",
  "cuerpo",
  "estructura",
  "botones",
  "alineacion",
]);

const FIXED_VALUES = new Set([
  "USD",
  "EUR",
  "PEN",
  "es",
  "serif",
  "sans_serif",
  "grid_dos",
  "grid_tres",
  "grid_cuatro",
  "redondeado",
  "cuadrado",
  "izquierda",
  "centro",
  "derecha",
]);

const SYMBOLS = new Set(["{", "}", "=", ":)", "[", "]", ",", "#"]);

function isLetter(ch) {
  return /[A-Za-z_áéíóúÁÉÍÓÚñÑ]/.test(ch);
}

function isDigit(ch) {
  return /[0-9]/.test(ch);
}

function isWhitespace(ch) {
  return /\s/.test(ch);
}

function lex(input) {
  const tokens = [];
  const symbols = [];
  const log = [];
  let i = 0;
  let line = 1;
  let col = 1;

  function pushToken(tok) {
    tokens.push(tok);
    symbols.push({
      Lexema: tok.lexeme,
      Token: tok.type,
      Tipo: tok.subtype || "",
      Valor: tok.value ?? "",
      Estado: "OK",
    });
  }

  while (i < input.length) {
    const ch = input[i];
    if (ch === "\n") {
      line += 1;
      col = 1;
      i += 1;
      continue;
    }
    if (isWhitespace(ch)) {
      col += 1;
      i += 1;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      let value = "";
      let closed = false;
      while (j < input.length) {
        if (input[j] === '"') {
          closed = true;
          break;
        }
        if (input[j] === "\n") {
          line += 1;
          col = 1;
        }
        value += input[j];
        j += 1;
      }
      const lexeme = input.slice(i, closed ? j + 1 : j);
      if (!closed) {
        symbols.push({ Lexema: lexeme, Token: "STRING", Tipo: "", Valor: value, Estado: "ERROR" });
        log.push(`Error léxico: cadena no cerrada en linea ${line}`);
        i = j;
        continue;
      }
      pushToken({ type: "STRING", lexeme, value, line, col });
      col += lexeme.length;
      i = j + 1;
      continue;
    }

    if (ch === "#") {
      if (/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?/.test(input.slice(i))) {
        const m = input.slice(i).match(/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?/);
        const lexeme = m[0];
        pushToken({ type: "HEXCOLOR", lexeme, value: lexeme, line, col });
        i += lexeme.length;
        col += lexeme.length;
        continue;
      } else {
        pushToken({ type: "SYMBOL", subtype: "#", lexeme: "#", value: "#", line, col });
        i += 1;
        col += 1;
        continue;
      }
    }

    if (isDigit(ch)) {
      let j = i;
      while (j < input.length && isDigit(input[j])) j += 1;
      if (j < input.length && input[j] === ".") {
        j += 1;
        while (j < input.length && isDigit(input[j])) j += 1;
      }
      const lexeme = input.slice(i, j);
      pushToken({ type: "NUMBER", lexeme, value: Number(lexeme), line, col });
      col += lexeme.length;
      i = j;
      continue;
    }

    if (isLetter(ch)) {
      let j = i;
      while (
        j < input.length && /[A-Za-z0-9_\-áéíóúÁÉÍÓÚñÑ]/.test(input[j])
      )
        j += 1;
      const lexeme = input.slice(i, j);
      if (KEYWORDS.has(lexeme)) {
        pushToken({ type: "KEYWORD", subtype: lexeme, lexeme, value: lexeme, line, col });
      } else if (ATTRS.has(lexeme)) {
        pushToken({ type: "ATTRIBUTE", subtype: lexeme, lexeme, value: lexeme, line, col });
      } else if (FIXED_VALUES.has(lexeme)) {
        pushToken({ type: "VALUE", subtype: lexeme, lexeme, value: lexeme, line, col });
      } else {
        pushToken({ type: "IDENT", lexeme, value: lexeme, line, col });
      }
      col += lexeme.length;
      i = j;
      continue;
    }

    if (ch === ":" && input[i + 1] === ")") {
      pushToken({ type: "SYMBOL", subtype: ":)", lexeme: ":)", value: ":)", line, col });
      i += 2;
      col += 2;
      continue;
    }

    if (SYMBOLS.has(ch)) {
      pushToken({ type: "SYMBOL", subtype: ch, lexeme: ch, value: ch, line, col });
      i += 1;
      col += 1;
      continue;
    }

    symbols.push({ Lexema: ch, Token: "DESCONOCIDO", Tipo: "", Valor: "", Estado: "ERROR" });
    log.push(`Caracter desconocido '${ch}' en linea ${line}, columna ${col}`);
    i += 1;
    col += 1;
  }

  return { tokens, symbols, log };
}

function Parser(tokens, options = {}) {
  const verbose = !!options.verbose;
  let idx = 0;
  let state = 0;
  const log = [];
  const errors = [];
  const model = {
    tiendaId: null,
    config: { nombre: "", descripcion: "", seo_titulo: "", seo_tags: [], moneda: "", idioma: "", imagen: "" },
    tema: { colores: {}, tipografia: {}, layout: {} },
    categorias: {},
    productos: [],
  };

  function dbg(msg) { if (verbose) log.push(msg); }
  function pos(tok) {
    if (!tok) tok = t();
    if (tok && typeof tok.line === 'number' && typeof tok.col === 'number') {
      return `@${tok.line}:${tok.col}`;
    }
    return '@?:?';
  }

  function t() {
    return tokens[idx] || { type: "EOF", lexeme: "<EOF>" };
  }
  function eat(type, subtype) {
    const tok = t();
    if (tok.type !== type) return null;
    if (subtype && tok.subtype !== subtype) return null;
    idx += 1;
    dbg(`eat ${type}${subtype?`(${subtype})`:''}: '${tok.lexeme}'`);
    return tok;
  }
  function expect(type, subtype, err) {
    const tok = eat(type, subtype);
    if (!tok) {
      const got = t();
      const msg = (err || `Se esperaba ${subtype || type} y se obtuvo '${got.lexeme}'`) + ` ${pos(got)}`;
      errors.push(msg);
      dbg(`expect FAIL: ${msg}`);
      return null;
    }
    dbg(`expect OK: ${type}${subtype?`(${subtype})`:''} ${pos(tok)}`);
    return tok;
  }
  function pushState(n) {
    log.push(`q${state} -> q${n}`);
    state = n;
  }

  function expectTerminator() {
    return expect("SYMBOL", ":)", "Se esperaba ':)' al final de la instrucción");
  }

  function parseTienda() {
    dbg('> parseTienda');
    if (!expect("KEYWORD", "tienda", "Se esperaba 'tienda'")) return false;
    // q0 -> q1 (TIENDA)
    pushState(1);
    // nombre opcional de tienda
    const maybeId = eat("IDENT");
    if (maybeId) {
      model.tiendaId = maybeId.lexeme;
      // q1 -> q2 (ID)
      pushState(2);
    }
    if (!expect("SYMBOL", "{", "Se esperaba '{' tras 'tienda'")) return false;
    // q(1|2) -> q3 (ALLAVE)
    pushState(3);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        // q3 -> q100 (CLLAVE fin)
        pushState(100);
        dbg('< parseTienda OK');
        return true;
      }
      if (tok.type === "KEYWORD" && tok.subtype === "config") {
        // q3 -> q4 (CONFIG)
        pushState(4);
        if (!parseConfig()) return false;
        // regreso a cuerpo de tienda q3
        pushState(3);
        continue;
      }
      if (tok.type === "KEYWORD" && tok.subtype === "tema") {
        // q3 -> q10 (TEMA)
        pushState(10);
        if (!parseTema()) return false;
        pushState(3);
        continue;
      }
      if (tok.type === "KEYWORD" && tok.subtype === "categoria") {
        // q3 -> q18 (CATEGORIA)
        pushState(18);
        if (!parseCategoria()) return false;
        pushState(3);
        continue;
      }
      if (tok.type === "KEYWORD" && tok.subtype === "producto") {
        // q3 -> q47 (PRODUCTO)
        pushState(47);
        if (!parseProducto()) return false;
        pushState(3);
        continue;
      }
      const emsg = `Se esperaba un bloque (config|tema|categoria|producto) y se obtuvo '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseTienda FAIL: ${emsg}`);
      return false;
    }
  }

  function parseConfig() {
    dbg('> parseConfig');
    // estamos en q4 (CONFIG) al entrar desde tienda
    if (!expect("KEYWORD", "config", "Se esperaba 'config'")) return false;
    if (!expect("SYMBOL", "{", "Se esperaba '{' en config")) return false;
    // q4 -> q5 (ALLAVE)
    pushState(5);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        // q5 -> q3 (CLLAVE)
        pushState(3);
        dbg('< parseConfig OK');
        return true;
      }
      if (tok.type === "ATTRIBUTE" && ["nombre","descripcion","seo_titulo","moneda","idioma","imagen"].includes(tok.subtype)) {
        idx += 1;
        // q5 -> q6 (ATRIBUTO)
        pushState(6);
        if (!expect("SYMBOL", "=", `Se esperaba '=' tras ${tok.lexeme}`)) return false;
        // q6 -> q7 (IGUAL)
        pushState(7);
        if (tok.subtype === "seo_titulo" || tok.subtype === "nombre" || tok.subtype === "descripcion" || tok.subtype === "imagen") {
          const v = expect("STRING", undefined, `Se esperaba cadena tras ${tok.lexeme}`);
          if (!v) return false;
          model.config[tok.subtype] = v.value;
          // q7 -> q8 (VALOR)
          pushState(8);
          if (!expectTerminator()) return false;
          // q8 -> q9 (:))
          pushState(9);
        } else if (tok.subtype === "moneda" || tok.subtype === "idioma") {
          const v = expect("VALUE", undefined, `Se esperaba valor fijo tras ${tok.lexeme}`);
          if (!v) return false;
          model.config[tok.subtype] = v.lexeme;
          pushState(8);
          if (!expectTerminator()) return false;
          pushState(9);
        } else {
          return false;
        }
        continue;
      }
      if (tok.type === "ATTRIBUTE" && tok.subtype === "seo_tags") {
        idx += 1;
        if (!expect("SYMBOL", "=", "Se esperaba '=' tras seo_tags")) return false;
        if (!expect("SYMBOL", "[", "Se esperaba '[' en seo_tags")) return false;
        pushState(13);
        const tags = [];
        let s = eat("STRING");
        if (s) {
          tags.push(s.value);
          while (eat("SYMBOL", ",")) {
            const nx = expect("STRING", undefined, "Se esperaba cadena en seo_tags");
            if (!nx) return false;
            tags.push(nx.value);
          }
        }
        if (!expect("SYMBOL", "]", "Se esperaba ']' al cerrar seo_tags")) return false;
        model.config.seo_tags = tags;
        if (!expectTerminator()) return false;
        pushState(11);
        continue;
      }
      const emsg = `Propiedad no válida en config: '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseConfig FAIL: ${emsg}`);
      return false;
    }
  }

  function parseTema() {
    dbg('> parseTema');
    // venimos desde q10 (TEMA)
    if (!expect("KEYWORD", "tema", "Se esperaba 'tema'")) return false;
    if (!expect("SYMBOL", "{", "Se esperaba '{' en tema")) return false;
    // q10 -> q11
    pushState(11);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        // q11 -> q3
        pushState(3);
        dbg('< parseTema OK');
        return true;
      }
      if (tok.type === "ATTRIBUTE" && tok.subtype === "colores") {
        if (!parseColores()) return false;
        pushState(11);
        continue;
      }
      if (tok.type === "ATTRIBUTE" && tok.subtype === "tipografia") {
        if (!parseTipografia()) return false;
        pushState(11);
        continue;
      }
      if (tok.type === "ATTRIBUTE" && tok.subtype === "layout") {
        if (!parseLayout()) return false;
        pushState(11);
        continue;
      }
      const emsg = `Se esperaba sub-bloque de tema (colores|tipografia|layout) y se obtuvo '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseTema FAIL: ${emsg}`);
      return false;
    }
  }

  function parseColores() {
    dbg('> parseColores');
    // q11 -> q12 (sub-bloque)
    pushState(12);
    if (!expect("ATTRIBUTE", "colores", "Se esperaba 'colores'")) return false;
    if (!expect("SYMBOL", "{", "Se esperaba '{' en colores")) return false;
    // q12 -> q13
    pushState(13);
    const need = new Set(["primario","secundario","fondo","texto"]);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        if (need.size > 0) {
          errors.push(`Faltan colores: ${Array.from(need).join(", ")}`);
          return false;
        }
        // q13 -> q11
        pushState(11);
        dbg('< parseColores OK');
        return true;
      }
      if (tok.type === "ATTRIBUTE" && need.has(tok.subtype)) {
        const a = tok.subtype;
        idx += 1;
        // q13 -> q14 (ATR)
        pushState(14);
        if (!expect("SYMBOL", "=", `Se esperaba '=' tras ${a}`)) return false;
        // q14 -> q15 (IGUAL)
        pushState(15);
        const v = expect("HEXCOLOR", undefined, `Se esperaba color hex tras ${a}`);
        if (!v) return false;
        model.tema.colores[a] = v.lexeme;
        // q15 -> q16 (VALOR)
        pushState(16);
        if (!expectTerminator()) return false;
        // q16 -> q17 (:))
        pushState(17);
        need.delete(a);
        continue;
      }
      const emsg = `Propiedad no válida en colores: '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseColores FAIL: ${emsg}`);
      return false;
    }
  }

  function parseTipografia() {
    dbg('> parseTipografia');
    // q11 -> q12 (sub-bloque)
    pushState(12);
    if (!expect("ATTRIBUTE", "tipografia", "Se esperaba 'tipografia'")) return false;
    if (!expect("SYMBOL", "{", "Se esperaba '{' en tipografia")) return false;
    // q12 -> q13
    pushState(13);
    const need = new Set(["titulos","cuerpo"]);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        if (need.size > 0) {
          errors.push(`Faltan tipografias: ${Array.from(need).join(", ")}`);
          return false;
        }
        // q13 -> q11
        pushState(11);
        dbg('< parseTipografia OK');
        return true;
      }
      if (tok.type === "ATTRIBUTE" && need.has(tok.subtype)) {
        const a = tok.subtype;
        idx += 1;
        // q13 -> q14
        pushState(14);
        if (!expect("SYMBOL", "=", `Se esperaba '=' tras ${a}`)) return false;
        // q14 -> q15
        pushState(15);
        const v = expect("VALUE", undefined, `Se esperaba valor fijo tras ${a}`);
        if (!v) return false;
        if (!(v.lexeme === "serif" || v.lexeme === "sans_serif")) {
          errors.push(`Valor inválido para ${a}`);
          return false;
        }
        model.tema.tipografia[a] = v.lexeme;
        // q15 -> q16
        pushState(16);
        if (!expectTerminator()) return false;
        // q16 -> q17
        pushState(17);
        need.delete(a);
        continue;
      }
      const emsg = `Propiedad no válida en tipografia: '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseTipografia FAIL: ${emsg}`);
      return false;
    }
  }

  function parseLayout() {
    dbg('> parseLayout');
    // q11 -> q12 (sub-bloque)
    pushState(12);
    if (!expect("ATTRIBUTE", "layout", "Se esperaba 'layout'")) return false;
    if (!expect("SYMBOL", "{", "Se esperaba '{' en layout")) return false;
    // q12 -> q13
    pushState(13);
    const allow = new Set(["estructura","botones","alineacion"]);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        // q13 -> q11
        pushState(11);
        dbg('< parseLayout OK');
        return true;
      }
      if (tok.type === "ATTRIBUTE" && allow.has(tok.subtype)) {
        const a = tok.subtype;
        idx += 1;
        // q13 -> q14
        pushState(14);
        if (!expect("SYMBOL", "=", `Se esperaba '=' tras ${a}`)) return false;
        // q14 -> q15
        pushState(15);
        const v = expect("VALUE", undefined, `Se esperaba valor fijo tras ${a}`);
        if (!v) return false;
        model.tema.layout[a] = v.lexeme;
        // q15 -> q16
        pushState(16);
        if (!expectTerminator()) return false;
        // q16 -> q17
        pushState(17);
        continue;
      }
      const emsg = `Propiedad no válida en layout: '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseLayout FAIL: ${emsg}`);
      return false;
    }
  }

  function parseCategoria() {
    dbg('> parseCategoria');
    // estamos en q18 tras ver 'categoria' en tienda
    if (!expect("KEYWORD", "categoria", "Se esperaba 'categoria'")) return false;
    // id opcional/después de keyword
    const catIdTok = eat("IDENT");
    // q18 -> q19 (ID)
    const catId = catIdTok ? (pushState(19), catIdTok.lexeme) : `categoria_${Object.keys(model.categorias).length+1}`;
    const current = model.categorias[catId] || { id: catId, nombre: "", descripcion: "", seo_titulo: "", seo_tags: [] };
    if (!expect("SYMBOL", "{", "Se esperaba '{' en categoria")) return false;
    // q19 -> q20 (ALLAVE)
    pushState(20);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        // q20 -> q3
        pushState(3);
        dbg('< parseCategoria OK');
        model.categorias[catId] = current;
        return true;
      }
      if (tok.type === "ATTRIBUTE" && (tok.subtype === "nombre" || tok.subtype === "descripcion")) {
        const a = tok.subtype;
        idx += 1;
        // q20 -> q21
        pushState(21);
        if (!expect("SYMBOL", "=", `Se esperaba '=' tras ${a}`)) return false;
        // q21 -> q40
        pushState(40);
        const v = expect("STRING", undefined, `Se esperaba cadena tras ${a}`);
        if (!v) return false;
        current[a] = v.value;
        // q40 -> q41
        pushState(41);
        if (!expectTerminator()) return false;
        // q41 -> q43
        pushState(43);
        continue;
      }
      if (tok.type === "ATTRIBUTE" && tok.subtype === "seo_titulo") {
        idx += 1;
        pushState(21);
        if (!expect("SYMBOL", "=", "Se esperaba '=' tras seo_titulo")) return false;
        pushState(40);
        const v = expect("STRING", undefined, "Se esperaba cadena en seo_titulo");
        if (!v) return false;
        current.seo_titulo = v.value;
        pushState(41);
        if (!expectTerminator()) return false;
        pushState(43);
        continue;
      }
      if (tok.type === "ATTRIBUTE" && tok.subtype === "seo_tags") {
        idx += 1;
        pushState(21);
        if (!expect("SYMBOL", "=", "Se esperaba '=' tras seo_tags")) return false;
        pushState(40);
        if (!expect("SYMBOL", "[", "Se esperaba '[' en seo_tags")) return false;
        // q40 -> q42 (array)
        pushState(42);
        const tags = [];
        let s = eat("STRING");
        if (s) {
          tags.push(s.value);
          // estamos en q44 dentro del array
          pushState(44);
          while (eat("SYMBOL", ",")) {
            const nx = expect("STRING", undefined, "Se esperaba cadena en seo_tags");
            if (!nx) return false;
            tags.push(nx.value);
          }
        }
        current.seo_tags = tags;
        if (!expect("SYMBOL", "]", "Se esperaba ']' al cerrar seo_tags")) return false;
        // q42/44 -> q46
        pushState(46);
        if (!expectTerminator()) return false;
        // q46 -> q43
        pushState(43);
        continue;
      }
      if (tok.type === "KEYWORD" && tok.subtype === "producto") {
        if (!parseProducto()) return false;
        pushState(20);
        continue;
      }
      const emsg = `Elemento no válido en categoria: '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseCategoria FAIL: ${emsg}`);
      return false;
    }
    model.categorias[catId] = current;
  }

  function parseProducto() {
    dbg('> parseProducto');
    // estamos en q47 tras ver 'producto'
    if (!expect("KEYWORD", "producto", "Se esperaba 'producto'")) return false;
    // id opcional
    const prodIdTok = eat("IDENT");
    const prod = { id: prodIdTok ? (pushState(48), prodIdTok.lexeme) : `producto_${model.productos.length+1}` };
    if (!expect("SYMBOL", "{", "Se esperaba '{' en producto")) return false;
    // q(47/48) -> q49
    pushState(49);
    const allow = new Set(["nombre","descripcion","precio","stock","imagen","moneda","idioma","categoria","seo_titulo","seo_tags"]);
    while (true) {
      const tok = t();
      if (tok.type === "SYMBOL" && tok.lexeme === "}") {
        idx += 1;
        // q49 -> q3
        pushState(3);
        dbg('< parseProducto OK');
        model.productos.push(prod);
        return true;
      }
      // Aceptar 'categoria' como KEYWORD para compatibilidad
      if ((tok.type === "ATTRIBUTE" && allow.has(tok.subtype)) || (tok.type === "KEYWORD" && tok.subtype === "categoria")) {
        const a = tok.type === "KEYWORD" ? "categoria" : tok.subtype;
        idx += 1;
        // q49 -> q50
        pushState(50);
        if (!expect("SYMBOL", "=", `Se esperaba '=' tras ${a}`)) return false;
        // q50 -> q51
        pushState(51);
        if (a === "precio" || a === "stock") {
          const v = expect("NUMBER", undefined, `Se esperaba número en ${a}`);
          if (!v) return false;
          prod[a] = Number(v.lexeme);
          // q51 -> q52 (VALOR)
          pushState(52);
          if (!expectTerminator()) return false;
          // q52 -> q54 (:))
          pushState(54);
        } else if (a === "moneda" || a === "idioma") {
          const v = expect("VALUE", undefined, `Se esperaba valor fijo en ${a}`);
          if (!v) return false;
          prod[a] = v.lexeme;
          pushState(52);
          if (!expectTerminator()) return false;
          pushState(54);
        } else if (a === "imagen" || a === "nombre" || a === "descripcion" || a === "seo_titulo") {
          const v = expect("STRING", undefined, `Se esperaba cadena en ${a}`);
          if (!v) return false;
          prod[a] = v.value;
          pushState(52);
          if (!expectTerminator()) return false;
          pushState(54);
        } else if (a === "categoria") {
          const v = expect("IDENT", undefined, "Se esperaba identificador de categoria");
          if (!v) return false;
          prod.categoria = v.lexeme;
          pushState(52);
          if (!expectTerminator()) return false;
          pushState(54);
        } else if (a === "seo_tags") {
          if (!expect("SYMBOL", "[", "Se esperaba '[' en seo_tags")) return false;
          // q51 -> q53 (array)
          pushState(53);
          const tags = [];
          let s = eat("STRING");
          if (s) {
            tags.push(s.value);
            // q53 -> q55 (primer item)
            pushState(55);
            while (eat("SYMBOL", ",")) {
              const nx = expect("STRING", undefined, "Se esperaba cadena en seo_tags");
              if (!nx) return false;
              tags.push(nx.value);
            }
          }
          if (!expect("SYMBOL", "]", "Se esperaba ']' al cerrar seo_tags")) return false;
          // q53/55 -> q57
          pushState(57);
          prod.seo_tags = tags;
          if (!expectTerminator()) return false;
          // q57 -> q54
          pushState(54);
        }
        continue;
      }
      const emsg = `Propiedad no válida en producto: '${tok.lexeme}' ${pos(tok)}`;
      errors.push(emsg);
      dbg(`< parseProducto FAIL: ${emsg}`);
      return false;
    }
    model.productos.push(prod);
  }

  const ok = parseTienda() && state === 100 && errors.length === 0;
  return { ok, log, errors, model };
}

export default function Analizador() {
  const [texto, setTexto] = useState(`tienda OmniMarket {\n\n config {\n nombre = "OmniMarket":)\n moneda = USD:)\n idioma = es:)\n }\n\n tema {\n colores {\n primario = #ff0000:)\n secundario = #007bff:)\n fondo = #f0f0f0:)\n texto = #1a1a1a:)\n }\n\n tipografia {\n titulos = serif:)\n cuerpo = sans_serif:)\n }\n\n layout {\n estructura = grid_cuatro:)\n botones = redondeado:)\n alineacion = centro:)\n }\n }\n\n categoria electronica-hogar {\n nombre = "Electronica & Hogar":)\n descripcion = "Productos de tecnologia y hogar":)\n seo_titulo = "Productos de tecnologia y hogar con IVA":)\n seo_tags = ["tecnologia", "hogar", "electronica"]:)\n }\n\n producto laptop-gaming-x {\n nombre = "Laptop Gaming X":)\n descripcion = "Potente laptop con tarjeta grafica ...":)\n categoria = electronica-hogar:)\n imagen = "laptop-gaming.jpg":)\n precio = 1599.99:)\n stock = 10:)\n seo_titulo = "Laptop de alto rendimiento":)\n seo_tags = ["laptop", "gaming", "pc", "oferta"]:)\n }\n \n producto laptop-gaming-y {\n nombre = "Laptop Gaming y":)\n descripcion = "Potente laptop sin cpu  ...":)\n categoria = electronica-hogar:)\n imagen = "laptop-gaming5.jpg":)\n precio = 1599.95:)\n stock = 1:)\n seo_titulo = "Laptop de alto rendimiento":)\n seo_tags = ["laptop", "gaming", "pc", "oferta"]:)\n }\n}`);
  const [lexLog, setLexLog] = useState([]);
  const [tabla, setTabla] = useState([]);
  const [parseLog, setParseLog] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [ok, setOk] = useState(false);
  const [pages, setPages] = useState([]);
  const [verbose, setVerbose] = useState(false);
  const [lastTokens, setLastTokens] = useState([]);

  const resumen = useMemo(() => {
    const tipos = tabla.reduce((acc, r) => {
      acc[r.Token] = (acc[r.Token] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(tipos)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
  }, [tabla]);

  // Tabla de símbolos estilo C++ para la vista (reservadas + IDs únicos)
  const tablaCStyle = useMemo(() => {
    const rows = [];
    RESERVED_ENTRIES.forEach(e => {
      rows.push({
        Tipo: 'pclave',
        Lexema: e.lex,
        Token: String(e.code),
        Valor: '-',
        Estado: '-',
      });
    });
    const ids = Array.from(new Set(lastTokens.filter(t => t.type === 'IDENT').map(t => t.lexeme)));
    ids.forEach(id => {
      rows.push({
        Tipo: 'identificador',
        Lexema: id,
        Token: String(TOKEN_CODE.ID),
        Valor: 'NULL',
        Estado: 'NULL',
      });
    });
    return rows;
  }, [lastTokens]);


  function analizar() {
    const { tokens, symbols, log } = lex(texto);
    setLexLog(log);
    setTabla(symbols);
    setLastTokens(tokens);
    const { ok, log: plog, errors } = Parser(tokens, { verbose });
    setParseLog(plog);
    setParseErrors(errors);
    setOk(ok);
  }

  function compilePages() {
    const { tokens, symbols, log } = lex(texto);
    // Mostrar también resultados del análisis léxico
    setLexLog(log);
    setTabla(symbols);
    setLastTokens(tokens);
    const res = Parser(tokens, { verbose });
    setParseLog(res.log);
    setParseErrors(res.errors);
    setOk(res.ok);
    if (!res.ok) {
      setPages([]);
      return;
    }
    const m = res.model;
    const css = `:root{--prim:${m.tema.colores.primario||'#222'};--sec:${m.tema.colores.secundario||'#555'};--bg:${m.tema.colores.fondo||'#fff'};--tx:${m.tema.colores.texto||'#111'}}
      *{box-sizing:border-box}
      body{margin:0;font-family:${m.tema.tipografia.cuerpo||'system-ui'},sans-serif;background:var(--bg);color:var(--tx)}
      header{background:linear-gradient(180deg, var(--prim), #00000022);color:#fff;padding:16px}
      a{color:var(--sec);text-decoration:none}
      a:hover{text-decoration:underline}
      .container{max-width:1040px;margin:0 auto;padding:20px}
      .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
      .card{border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#ffffffcc;backdrop-filter:saturate(1.5) blur(2px)}
      .badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#f1f5f9;color:#0f172a;font-size:12px}`;
    const head = (title) => `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title><style>${css}</style></head><body>`;
    const foot = `</body></html>`;

    const catList = Object.values(m.categorias);
    const prodList = m.productos;

    const index = `${head(m.config.seo_titulo || m.config.nombre || 'Tienda')}
    <header><h1>${m.config.nombre || 'Tienda'}</h1></header>
    <div class="container">
      <h2>Categorías</h2>
      <ul>
        ${catList.map(c=>`<li><a href="categoria-${c.id}.html">${c.nombre || c.id}</a></li>`).join('')}
      </ul>
      <h2>Productos</h2>
      ${prodList.map(p=>`<div class="card"><h3><a href="producto-${p.id}.html">${p.nombre||p.id}</a></h3><p>${p.descripcion||''}</p><small>${p.moneda||m.config.moneda||''} ${p.precio??''}</small></div>`).join('')}
    </div>
    ${foot}`;

    const catPages = catList.map(c=>({
      name: `categoria-${c.id}.html`,
      content: `${head(c.seo_titulo || c.nombre)}<header><h1>${c.nombre||c.id}</h1></header><div class="container"><p>${c.descripcion||''}</p><p>Tags: ${(c.seo_tags||[]).join(', ')}</p>${prodList.filter(p=>p.categoria===c.id).map(p=>`<div class="card"><h3><a href="../producto-${p.id}.html">${p.nombre||p.id}</a></h3><p>${p.descripcion||''}</p></div>`).join('')}</div>${foot}`
    }));

    const prodPages = prodList.map(p=>({
      name: `producto-${p.id}.html`,
      content: `${head(p.seo_titulo || p.nombre)}<header><h1>${p.nombre||p.id}</h1></header><div class="container"><p>${p.descripcion||''}</p>${p.imagen?`<img src="${p.imagen}" alt="${p.nombre}" style="max-width:100%"/>`:''}<p>Precio: ${p.moneda||m.config.moneda||''} ${p.precio??''}</p><p>Stock: ${p.stock??''}</p><p>Categoría: ${p.categoria||''}</p><p>Tags: ${(p.seo_tags||[]).join(', ')}</p></div>${foot}`
    }));

    const files = [ { name: 'index.html', content: index }, ...catPages, ...prodPages ];
    setPages(files);
  }

  function download(name, content) {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }


  return (
    <div className="app-container">
      <h1>Analizador de Tiendas</h1>
      <div className="subtle">Pega tu programa y ejecuta el análisis.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={18}
          spellCheck={false}
          className="code-input"
        />
        <div className="actions">
          <button onClick={analizar} className="btn">Analizar</button>
          <button onClick={compilePages} className="btn">Compilar a páginas</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <input type="checkbox" checked={verbose} onChange={(e)=>setVerbose(e.target.checked)} />
            Log detallado
          </label>
        </div>
      </div>

      <h2>Log Léxico</h2>
      <div className="panel" style={{ whiteSpace: "pre-wrap" }}>
        {lexLog.length === 0 ? "Sin errores léxicos" : lexLog.join("\n")}
      </div>

      <h2>Tabla de Símbolos {resumen ? `(${resumen})` : ""}</h2>
      <div className="table-wrap panel">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Lexema</th>
              <th>Token (código)</th>
              <th>Valor</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {tablaCStyle.map((r, idx) => (
              <tr key={idx}>
                <td>{r.Tipo}</td>
                <td>{r.Lexema}</td>
                <td>{r.Token}</td>
                <td>{String(r.Valor)}</td>
                <td>{r.Estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Log Sintáctico</h2>
      <div className="panel" style={{ whiteSpace: "pre-wrap" }}>
        {parseLog.length === 0 ? "Sin transiciones aún" : parseLog.join("\n")}
      </div>

      <h2>Resultado</h2>
      {parseErrors.length > 0 ? (
        <div className="msg err">
          {parseErrors.map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
        </div>
      ) : ok ? (
        <div className="msg ok">Análisis finalizado correctamente (estado 100).</div>
      ) : (
        <div className="panel">Ejecuta el análisis para ver resultados.</div>
      )}

      {pages.length > 0 && (
        <div>
          <h2>Páginas generadas</h2>
          <ul className="panel">
            {pages.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                <button onClick={() => download(f.name, f.content)} className="btn">Descargar</button>
                {f.name}
              </li>
            ))}
          </ul>
          <h3>Vista previa de index.html</h3>
          <iframe title="preview" className="preview" srcDoc={pages.find(p=>p.name==='index.html')?.content}></iframe>
        </div>
      )}

    </div>
  );
}
