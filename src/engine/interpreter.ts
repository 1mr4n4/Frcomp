export type Lang = 'fr' | 'en'
export type InputKeyword = 'Saisir' | 'Lire'
export interface Options { lang: Lang; inputKeyword: InputKeyword }
export interface IO { print(text: string): void; input(): Promise<string> }
export interface Control { aborted: boolean }
type Val = number | string | boolean
type TypeName = 'int' | 'real' | 'str' | 'bool'

export class PseudoError extends Error {}

// Case- and accent-insensitive keyword matching: "Début" == "debut", "ÉCRIRE" == "ecrire".
const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['\u2019\u2018`]/g, '').toLowerCase()

const KW_RAW = {
  fr: {
    algo: ['algorithme'], vars: ['variables', 'variable'], begin: ['debut'], end: ['fin'],
    print: ['afficher', 'ecrire'], if: ['si'], then: ['alors'], else: ['sinon'],
    elseif: ['sinonsi'], endif: ['finsi'],
    while: ['tantque'], do: ['faire'], endwhile: ['fintantque'],
    for: ['pour'], from: ['de'], to: ['a'], step: ['pas'], endfor: ['finpour'],
    switch: ['selon'], cas: ['cas'], default: ['autrement'], endselon: ['finselon'],
    repeat: ['repeter'], until: ['jusqua'],
    and: ['et'], or: ['ou'], not: ['non'], true: ['vrai'], false: ['faux'], mod: ['mod'], div: ['div'],
  },
  en: {
    algo: ['algorithm'], vars: ['variables', 'variable'], begin: ['start'], end: ['end'],
    print: ['print', 'write'], if: ['if'], then: ['then'], else: ['else'],
    elseif: ['elseif', 'elsif', 'elif'], endif: ['endif'],
    while: ['while'], do: ['do'], endwhile: ['endwhile'],
    for: ['for'], from: ['from'], to: ['to'], step: ['step'], endfor: ['endfor'],
    switch: ['switch'], cas: ['case'], default: ['default'], endselon: ['endswitch'],
    repeat: ['repeat'], until: ['until'],
    and: ['and'], or: ['or'], not: ['not'], true: ['true'], false: ['false'], mod: ['mod'], div: ['div'],
  },
}

const foldSet = <T extends Record<string, string[]>>(o: T): T =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.map(fold)])) as T

const KW = { fr: foldSet(KW_RAW.fr), en: foldSet(KW_RAW.en) }
type KwSet = typeof KW.fr

const TYPES: Record<string, TypeName> = {
  entier: 'int', entiers: 'int', reel: 'real', reels: 'real',
  chaine: 'str', chaines: 'str', booleen: 'bool', booleens: 'bool',
  caractere: 'str', caracteres: 'str',
  integer: 'int', integers: 'int', real: 'real', reals: 'real',
  string: 'str', strings: 'str', boolean: 'bool', booleans: 'bool',
  character: 'str', characters: 'str',
}

const PHRASE_LABEL: Record<string, Record<Lang, string>> = {
  finsi: { fr: 'fin si', en: 'endif' },
  fintantque: { fr: 'fin tant que', en: 'endwhile' },
  finpour: { fr: 'fin pour', en: 'endfor' },
  finselon: { fr: 'fin selon', en: 'endswitch' },
  sinonsi: { fr: 'sinon si', en: 'elseif' },
  jusqua: { fr: 'jusqu\u2019à', en: 'until' },
  tantque: { fr: 'tant que', en: 'while' },
}
const phraseLabel = (ph: string, lang: Lang) => PHRASE_LABEL[ph]?.[lang] ?? ph

const BARE_FIN = '@fin'
const FIN_DISAMBIG_FR = ['si', 'pour', 'selon', 'tant', 'sinon', 'cas', 'autrement', 'alors']
const FIN_DISAMBIG_EN = ['if', 'else', 'elseif', 'while', 'for', 'select', 'switch', 'do', 'then', 'case']

// ---------- Tokenizer ----------
interface Tok { t: 'num' | 'str' | 'id' | 'op' | 'nl' | 'eof'; v: string; line: number }

function tokenize(src: string, lang: Lang): Tok[] {
  const out: Tok[] = []
  let i = 0, line = 1
  const fail = (fr: string, en: string) =>
    new PseudoError(`${lang === 'fr' ? 'Ligne' : 'Line'} ${line}: ${lang === 'fr' ? fr : en}`)
  while (i < src.length) {
    const c = src[i]
    if (c === '\n') { out.push({ t: 'nl', v: '\n', line }); line++; i++; continue }
    if (/\s/.test(c)) { i++; continue }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
    if (/[0-9]/.test(c)) {
      let j = i, sep = false
      while (j < src.length) {
        const d = src[j]
        if (/[0-9]/.test(d)) { j++; continue }
        if ((d === '.' || d === ',') && !sep && /[0-9]/.test(src[j + 1] ?? '')) { sep = true; j++; continue }
        break
      }
      out.push({ t: 'num', v: src.slice(i, j), line }); i = j; continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < src.length && src[j] !== c && src[j] !== '\n') j++
      if (src[j] !== c) throw fail('Chaîne non terminée', 'Unterminated string')
      out.push({ t: 'str', v: src.slice(i + 1, j), line }); i = j + 1; continue
    }
    if (/[\p{L}_]/u.test(c)) {
      let j = i
      while (j < src.length) {
        if (/[\p{L}\p{N}_]/u.test(src[j])) { j++; continue }
        if ((src[j] === "'" || src[j] === '\u2019') && /[\p{L}]/u.test(src[j + 1] ?? '')) { j++; continue }
        break
      }
      out.push({ t: 'id', v: src.slice(i, j), line }); i = j; continue
    }
    const two = src.slice(i, i + 2)
    if (['<-', '<=', '>=', '<>', '!='].includes(two)) {
      out.push({ t: 'op', v: two === '!=' ? '<>' : two, line }); i += 2; continue
    }
    if (c === '←') { out.push({ t: 'op', v: '<-', line }); i++; continue }
    if ('+-*/()<>=,:'.includes(c)) { out.push({ t: 'op', v: c, line }); i++; continue }
    throw fail(`Caractère inattendu « ${c} »`, `Unexpected character '${c}'`)
  }
  out.push({ t: 'eof', v: '', line })
  return out
}

// ---------- AST ----------
type Expr =
  | { k: 'lit'; v: Val }
  | { k: 'var'; n: string; line: number }
  | { k: 'bin'; op: string; l: Expr; r: Expr; line: number }
  | { k: 'un'; op: 'not' | 'neg'; e: Expr; line: number }
type Branch = { c: Expr; a: Stmt[]; line: number }
type Stmt =
  | { k: 'print'; args: Expr[] }
  | { k: 'input'; ns: string[]; line: number }
  | { k: 'set'; n: string; e: Expr; line: number }
  | { k: 'if'; branches: Branch[]; b: Stmt[]; line: number }
  | { k: 'while'; c: Expr; body: Stmt[]; line: number }
  | { k: 'for'; n: string; from: Expr; to: Expr; step?: Expr; body: Stmt[]; line: number }
  | { k: 'switch'; e: Expr; cases: { vs: Expr[]; body: Stmt[] }[]; def: Stmt[]; line: number }
  | { k: 'repeat'; body: Stmt[]; c: Expr; line: number }
interface Program { decls: Map<string, TypeName>; body: Stmt[] }

// ---------- Parser ----------
class Parser {
  private p = 0
  constructor(private t: Tok[], private kw: KwSet, private inputKw: string[], private lang: Lang) {}

  private err(line: number, fr: string, en: string) {
    return new PseudoError(`${this.lang === 'fr' ? 'Ligne' : 'Line'} ${line}: ${this.lang === 'fr' ? fr : en}`)
  }
  private get cur() { return this.t[this.p] }

  // Number of tokens matched by a keyword phrase ("finsi" matches FinSi and "fin si").
  private countPhrase(ph: string): number {
    if (this.cur.t !== 'id') return 0
    let acc = '', j = this.p
    while (acc.length < ph.length) {
      const tok = this.t[j]
      if (!tok || tok.t !== 'id') return 0
      acc += fold(tok.v); j++
      if (!ph.startsWith(acc)) return 0
      if (acc.length < ph.length && this.t[j]?.t === 'nl') return 0
    }
    return acc === ph ? j - this.p : 0
  }
  private is(list: string[]) { return list.some(ph => this.countPhrase(ph) > 0) }
  private isOp(v: string) { return this.cur.t === 'op' && this.cur.v === v }
  private eatOp(v: string) { if (this.isOp(v)) { this.p++; return true } return false }
  private eat(list: string[]) {
    for (const ph of list) {
      const n = this.countPhrase(ph)
      if (n) { this.p += n; return true }
    }
    return false
  }
  private expectOp(v: string) {
    if (!this.eatOp(v)) throw this.err(this.cur.line, `« ${v} » attendu`, `Expected '${v}'`)
  }
  private expect(list: string[]) {
    if (!this.eat(list)) throw this.err(this.cur.line, `« ${phraseLabel(list[0], this.lang)} » attendu`, `Expected '${phraseLabel(list[0], this.lang)}'`)
  }
  private label(ph: string) { return phraseLabel(ph, this.lang) }
  private realLabel(terms: string[]) {
    const ph = [...terms].reverse().find(x => x !== BARE_FIN) ?? this.kw.end[0]
    return this.label(ph)
  }
  private atBareFin(): boolean {
    const closers = this.lang === 'fr' ? ['fin'] : ['end']
    const disamb = this.lang === 'fr' ? FIN_DISAMBIG_FR : FIN_DISAMBIG_EN
    for (const ph of closers) {
      if (this.countPhrase(ph) !== 1) continue
      const next = this.t[this.p + 1]
      if (next && next.t === 'id' && disamb.includes(fold(next.v))) continue
      return true
    }
    return false
  }
  private atTerm(terms: string[]): boolean {
    for (const ph of terms) {
      if (ph === BARE_FIN) { if (this.atBareFin()) return true; continue }
      if (this.countPhrase(ph) > 0) return true
    }
    return false
  }
  private expectTerm(terms: string[]) {
    for (const ph of terms) {
      if (ph === BARE_FIN) { if (this.atBareFin()) { this.p++; return } continue }
      const n = this.countPhrase(ph)
      if (n) { this.p += n; return }
    }
    const lb = this.realLabel(terms)
    throw this.err(this.cur.line, `« ${lb} » attendu`, `Expected '${lb}'`)
  }
  private ident() {
    const c = this.cur
    if (c.t !== 'id') throw this.err(c.line, 'Identifiant attendu', 'Identifier expected')
    this.p++
    return c.v.toLowerCase()
  }
  private skipNl() { while (this.cur.t === 'nl') this.p++ }
  private endStmt() {
    if (this.cur.t !== 'nl' && this.cur.t !== 'eof')
      throw this.err(this.cur.line, `Élément inattendu « ${this.cur.v} »`, `Unexpected '${this.cur.v}'`)
  }
  private looksLikeDecl(): boolean {
    let j = this.p
    if (this.t[j]?.t !== 'id') return false
    for (;;) {
      if (this.t[j]?.t !== 'id') return false
      j++
      if (this.t[j]?.t === 'op' && this.t[j].v === ',') { j++; continue }
      break
    }
    return this.t[j]?.t === 'op' && this.t[j].v === ':'
  }

  parseProgram(): Program {
    const k = this.kw
    const decls = new Map<string, TypeName>()
    this.skipNl()
    if (this.is(k.algo)) { while (this.cur.t !== 'nl' && this.cur.t !== 'eof') this.p++ }
    this.skipNl()
    if (this.eat(k.vars)) this.skipNl()
    while (!this.is(k.begin)) {
      if (this.cur.t === 'eof') throw this.err(this.cur.line, `« ${k.begin[0]} » manquant`, `Missing '${k.begin[0]}'`)
      if (!this.looksLikeDecl())
        throw this.err(this.cur.line, `« ${k.begin[0]} » manquant`, `Missing '${k.begin[0]}'`)
      for (;;) {
        const names = [this.ident()]
        while (this.eatOp(',')) names.push(this.ident())
        this.expectOp(':')
        const tn = this.ident()
        const type = TYPES[fold(tn)]
        if (!type)
          throw this.err(
            this.cur.line,
            `Type inconnu « ${tn} » (entier, reel, chaine, booleen, caractere)`,
            `Unknown type '${tn}' (integer, real, string, boolean, character)`,
          )
        names.forEach(n => decls.set(n, type))
        if (!this.eatOp(',')) break
      }
      this.skipNl()
    }
    this.expect(k.begin)
    const body = this.block([k.end[0]], true)
    if (this.cur.t !== 'eof') this.expect(k.end)
    this.skipNl()
    if (this.cur.t !== 'eof')
      throw this.err(this.cur.line, `Élément inattendu « ${this.cur.v} »`, `Unexpected '${this.cur.v}'`)
    return { decls, body }
  }

  private block(terms: string[], allowEof = false): Stmt[] {
    const out: Stmt[] = []
    for (;;) {
      this.skipNl()
      if (this.cur.t === 'eof') {
        if (allowEof) return out
        throw this.err(this.cur.line, `« ${this.realLabel(terms)} » manquant`, `Missing '${this.realLabel(terms)}'`)
      }
      if (this.atTerm(terms)) return out
      out.push(this.stmt())
    }
  }

  private stmt(): Stmt {
    const k = this.kw, line = this.cur.line
    if (this.is(k.print)) {
      this.p++
      const args: Expr[] = []
      if (this.eatOp('(')) {
        if (!this.eatOp(')')) {
          do { args.push(this.expr()) } while (this.eatOp(','))
          this.expectOp(')')
        }
      } else {
        do { args.push(this.expr()) } while (this.eatOp(','))
      }
      this.endStmt()
      return { k: 'print', args }
    }
    if (this.is(this.inputKw)) {
      this.p++
      const paren = this.eatOp('(')
      const ns = [this.ident()]
      while (this.eatOp(',')) ns.push(this.ident())
      if (paren) this.expectOp(')')
      this.endStmt()
      return { k: 'input', ns, line }
    }
    if (this.eat(k.if)) {
      const terms = [...k.elseif, ...k.else, ...k.endif, BARE_FIN]
      const branches: Branch[] = []
      let c = this.expr(); this.eat(k.then)
      branches.push({ c, a: this.block(terms), line })
      while (this.eat(k.elseif)) {
        c = this.expr(); this.eat(k.then)
        branches.push({ c, a: this.block(terms), line })
      }
      let b: Stmt[] = []
      if (this.eat(k.else)) b = this.block([...k.elseif, ...k.endif, BARE_FIN])
      this.expectTerm([...k.endif, BARE_FIN])
      return { k: 'if', branches, b, line }
    }
    if (this.eat(k.while)) {
      const c = this.expr(); this.eat(k.do)
      const terms = [...k.endwhile, BARE_FIN]
      const body = this.block(terms)
      this.expectTerm(terms)
      return { k: 'while', c, body, line }
    }
    if (this.eat(k.for)) {
      const n = this.ident()
      if (!this.eatOp('<-') && !this.eatOp('=')) this.eat(k.from)
      const from = this.expr()
      this.expect(k.to)
      const to = this.expr()
      let step: Expr | undefined
      if (this.eat(k.step)) step = this.expr()
      this.eat(k.do)
      const terms = [...k.endfor, BARE_FIN]
      const body = this.block(terms)
      this.expectTerm(terms)
      return { k: 'for', n, from, to, step, body, line }
    }
    if (this.eat(k.switch)) {
      const e = this.expr()
      this.eat(k.do)
      const cases: { vs: Expr[]; body: Stmt[] }[] = []
      let def: Stmt[] = []
      const bodyTerms = [...k.cas, ...k.default, ...k.endselon, BARE_FIN]
      for (;;) {
        this.skipNl()
        if (this.is(k.cas)) {
          this.p++
          const vs = [this.expr()]
          while (this.eatOp(',')) vs.push(this.expr())
          if (!this.eatOp(':')) this.eat(k.then)
          this.skipNl()
          cases.push({ vs, body: this.block(bodyTerms) })
        } else if (this.is(k.default)) {
          this.p++
          this.skipNl()
          def = this.block([...k.endselon, BARE_FIN])
        } else break
      }
      this.expectTerm([...k.endselon, BARE_FIN])
      return { k: 'switch', e, cases, def, line }
    }
    if (this.is(k.repeat)) {
      this.p++
      this.skipNl()
      const body = this.block([...k.until])
      this.expectTerm([...k.until])
      const c = this.expr()
      this.endStmt()
      return { k: 'repeat', body, c, line }
    }
    if (this.cur.t === 'id' && ['fin', 'end'].includes(fold(this.cur.v)))
      throw this.err(
        this.cur.line,
        'Structure non terminée (« fin si », « fin tant que », « fin pour » manquant)',
        'Unclosed structure (missing endif/endwhile/endfor)',
      )
    const n = this.ident()
    if (!this.eatOp('<-') && !this.eatOp('='))
      throw this.err(this.cur.line, `« <- » attendu`, `Expected '<-'`)
    const from = this.expr()
    if (this.eat(k.to)) {
      const to = this.expr()
      let step: Expr | undefined
      if (this.eat(k.step)) step = this.expr()
      this.eat(k.do)
      const terms = [...k.endfor, BARE_FIN]
      const body = this.block(terms)
      this.expectTerm(terms)
      return { k: 'for', n, from, to, step, body, line }
    }
    this.endStmt()
    return { k: 'set', n, e: from, line }
  }

  // ----- expressions (precedence: or < and < not < comparison < + - < * / div mod < unary -)
  private expr(): Expr { return this.or() }
  private or(): Expr {
    let l = this.and()
    while (this.is(this.kw.or)) { const line = this.cur.line; this.p++; l = { k: 'bin', op: 'or', l, r: this.and(), line } }
    return l
  }
  private and(): Expr {
    let l = this.not()
    while (this.is(this.kw.and)) { const line = this.cur.line; this.p++; l = { k: 'bin', op: 'and', l, r: this.not(), line } }
    return l
  }
  private not(): Expr {
    if (this.is(this.kw.not)) { const line = this.cur.line; this.p++; return { k: 'un', op: 'not', e: this.not(), line } }
    return this.cmp()
  }
  private cmp(): Expr {
    let l = this.add()
    while (this.cur.t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(this.cur.v)) {
      const { v: op, line } = this.cur; this.p++
      l = { k: 'bin', op, l, r: this.add(), line }
    }
    return l
  }
  private add(): Expr {
    let l = this.mul()
    while (this.isOp('+') || this.isOp('-')) {
      const { v: op, line } = this.cur; this.p++
      l = { k: 'bin', op, l, r: this.mul(), line }
    }
    return l
  }
  private mul(): Expr {
    let l = this.unary()
    for (;;) {
      const line = this.cur.line
      let op = ''
      if (this.isOp('*') || this.isOp('/')) op = this.cur.v
      else if (this.is(this.kw.mod)) op = 'mod'
      else if (this.is(this.kw.div)) op = 'div'
      else return l
      this.p++
      l = { k: 'bin', op, l, r: this.unary(), line }
    }
  }
  private unary(): Expr {
    if (this.isOp('-')) { const line = this.cur.line; this.p++; return { k: 'un', op: 'neg', e: this.unary(), line } }
    return this.primary()
  }
  private primary(): Expr {
    const c = this.cur
    if (c.t === 'num') { this.p++; return { k: 'lit', v: parseFloat(c.v.replace(',', '.')) } }
    if (c.t === 'str') { this.p++; return { k: 'lit', v: c.v } }
    if (this.eat(this.kw.true)) return { k: 'lit', v: true }
    if (this.eat(this.kw.false)) return { k: 'lit', v: false }
    if (c.t === 'id') { this.p++; return { k: 'var', n: c.v.toLowerCase(), line: c.line } }
    if (this.eatOp('(')) { const e = this.expr(); this.expectOp(')'); return e }
    throw this.err(c.line, 'Expression attendue', 'Expression expected')
  }
}

// ---------- Runner ----------
class Runner {
  private env = new Map<string, Val>()
  private steps = 0
  constructor(private prog: Program, private io: IO, private ctl: Control, private lang: Lang) {
    prog.decls.forEach((t, n) => this.env.set(n, t === 'str' ? '' : t === 'bool' ? false : 0))
  }

  private err(line: number, fr: string, en: string) {
    return new PseudoError(`${this.lang === 'fr' ? 'Ligne' : 'Line'} ${line}: ${this.lang === 'fr' ? fr : en}`)
  }
  private fmt(v: Val): string {
    if (typeof v === 'boolean') return this.lang === 'fr' ? (v ? 'Vrai' : 'Faux') : (v ? 'True' : 'False')
    return String(v)
  }
  private num(v: Val, line: number): number {
    if (typeof v !== 'number') throw this.err(line, 'Un nombre est attendu', 'A number is expected')
    return v
  }
  private bool(v: Val, line: number): boolean {
    if (typeof v !== 'boolean') throw this.err(line, 'Un booléen est attendu', 'A boolean is expected')
    return v
  }

  private ev(e: Expr): Val {
    switch (e.k) {
      case 'lit': return e.v
      case 'var': {
        if (!this.env.has(e.n)) throw this.err(e.line, `Variable non déclarée « ${e.n} »`, `Undeclared variable '${e.n}'`)
        return this.env.get(e.n)!
      }
      case 'un': {
        const v = this.ev(e.e)
        return e.op === 'not' ? !this.bool(v, e.line) : -this.num(v, e.line)
      }
      case 'bin': {
        if (e.op === 'and') return this.bool(this.ev(e.l), e.line) && this.bool(this.ev(e.r), e.line)
        if (e.op === 'or') return this.bool(this.ev(e.l), e.line) || this.bool(this.ev(e.r), e.line)
        const l = this.ev(e.l), r = this.ev(e.r)
        if (e.op === '=') return l === r
        if (e.op === '<>') return l !== r
        if (e.op === '+' && (typeof l === 'string' || typeof r === 'string')) return this.fmt(l) + this.fmt(r)
        if (['<', '>', '<=', '>='].includes(e.op)) {
          if (typeof l !== typeof r) throw this.err(e.line, 'Comparaison de types différents', 'Comparing different types')
          const a = l as number, b = r as number
          return e.op === '<' ? a < b : e.op === '>' ? a > b : e.op === '<=' ? a <= b : a >= b
        }
        const a = this.num(l, e.line), b = this.num(r, e.line)
        switch (e.op) {
          case '+': return a + b
          case '-': return a - b
          case '*': return a * b
          case '/': if (b === 0) throw this.err(e.line, 'Division par zéro', 'Division by zero'); return a / b
          case 'div': if (b === 0) throw this.err(e.line, 'Division par zéro', 'Division by zero'); return Math.trunc(a / b)
          case 'mod': if (b === 0) throw this.err(e.line, 'Division par zéro', 'Division by zero'); return a % b
        }
        throw this.err(e.line, 'Opérateur inconnu', 'Unknown operator')
      }
    }
  }

  private async tick() {
    if (this.ctl.aborted) throw new PseudoError('aborted')
    if (++this.steps % 2000 === 0) await new Promise(r => setTimeout(r, 0)) // keep the UI responsive
  }

  private coerce(raw: string, n: string, line: number): Val {
    const t = this.prog.decls.get(n)
    const s = raw.trim()
    if (t === 'int') {
      if (!/^-?\d+$/.test(s)) throw this.err(line, `« ${raw} » n'est pas un entier`, `'${raw}' is not an integer`)
      return parseInt(s, 10)
    }
    if (t === 'real') {
      const v = Number(s.replace(',', '.'))
      if (s === '' || isNaN(v)) throw this.err(line, `« ${raw} » n'est pas un réel`, `'${raw}' is not a real number`)
      return v
    }
    if (t === 'bool') return /^(vrai|true|1)$/i.test(s)
    if (t === 'str') return raw
    return s !== '' && !isNaN(Number(s.replace(',', '.'))) ? Number(s.replace(',', '.')) : raw // undeclared: auto-detect
  }

  async exec(stmts: Stmt[]): Promise<void> {
    for (const s of stmts) {
      await this.tick()
      switch (s.k) {
        case 'print': this.io.print(s.args.map(a => this.fmt(this.ev(a))).join('')); break
        case 'input':
          for (const n of s.ns) this.env.set(n, this.coerce(await this.io.input(), n, s.line))
          break
        case 'set': this.env.set(s.n, this.ev(s.e)); break
        case 'if': {
          let done = false
          for (const br of s.branches) {
            if (!done && this.bool(this.ev(br.c), br.line)) { await this.exec(br.a); done = true }
          }
          if (!done) await this.exec(s.b)
          break
        }
        case 'while': while (this.bool(this.ev(s.c), s.line)) { await this.exec(s.body); await this.tick() } break
        case 'for': {
          const a = this.num(this.ev(s.from), s.line), b = this.num(this.ev(s.to), s.line)
          const st = s.step ? this.num(this.ev(s.step), s.line) : a <= b ? 1 : -1
          if (st === 0) throw this.err(s.line, 'Pas nul dans la boucle Pour', 'Zero step in For loop')
          if (st > 0) {
            for (let i = a; i <= b; i += st) { this.env.set(s.n, i); await this.exec(s.body); await this.tick() }
          } else {
            for (let i = a; i >= b; i += st) { this.env.set(s.n, i); await this.exec(s.body); await this.tick() }
          }
          break
        }
        case 'switch': {
          const v = this.ev(s.e)
          let done = false
          for (const cs of s.cases) {
            if (cs.vs.some(x => this.ev(x) === v)) { await this.exec(cs.body); done = true; break }
          }
          if (!done) await this.exec(s.def)
          break
        }
        case 'repeat': {
          do { await this.exec(s.body); await this.tick() } while (!this.bool(this.ev(s.c), s.line))
          break
        }
      }
    }
  }
  run() { return this.exec(this.prog.body) }
}

// ---------- Public API ----------
export async function runProgram(source: string, opts: Options, io: IO, ctl: Control): Promise<void> {
  const { lang } = opts
  const inputKw = [...new Set(
    lang === 'fr'
      ? [fold(opts.inputKeyword), 'saisir', 'lire']
      : [fold(opts.inputKeyword), 'input', 'read'],
  )]
  const prog = new Parser(tokenize(source, lang), KW[lang], inputKw, lang).parseProgram()
  await new Runner(prog, io, ctl, lang).run()
}
