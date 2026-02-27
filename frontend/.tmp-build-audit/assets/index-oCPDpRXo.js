var iv = Object.defineProperty;
var ov = (e, t, s) =>
  t in e ? iv(e, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : (e[t] = s);
var ct = (e, t, s) => ov(e, typeof t != 'symbol' ? t + '' : t, s);
(function () {
  const t = document.createElement('link').relList;
  if (t && t.supports && t.supports('modulepreload')) return;
  for (const i of document.querySelectorAll('link[rel="modulepreload"]')) n(i);
  new MutationObserver((i) => {
    for (const o of i)
      if (o.type === 'childList')
        for (const r of o.addedNodes) r.tagName === 'LINK' && r.rel === 'modulepreload' && n(r);
  }).observe(document, { childList: !0, subtree: !0 });
  function s(i) {
    const o = {};
    return (
      i.integrity && (o.integrity = i.integrity),
      i.referrerPolicy && (o.referrerPolicy = i.referrerPolicy),
      i.crossOrigin === 'use-credentials'
        ? (o.credentials = 'include')
        : i.crossOrigin === 'anonymous'
          ? (o.credentials = 'omit')
          : (o.credentials = 'same-origin'),
      o
    );
  }
  function n(i) {
    if (i.ep) return;
    i.ep = !0;
    const o = s(i);
    fetch(i.href, o);
  }
})();
/**
 * @vue/shared v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ function rd(e) {
  const t = Object.create(null);
  for (const s of e.split(',')) t[s] = 1;
  return (s) => s in t;
}
const Wt = {},
  Bi = [],
  Ws = () => {},
  im = () => !1,
  ja = (e) =>
    e.charCodeAt(0) === 111 &&
    e.charCodeAt(1) === 110 &&
    (e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97),
  ad = (e) => e.startsWith('onUpdate:'),
  Pe = Object.assign,
  ld = (e, t) => {
    const s = e.indexOf(t);
    s > -1 && e.splice(s, 1);
  },
  rv = Object.prototype.hasOwnProperty,
  qt = (e, t) => rv.call(e, t),
  _t = Array.isArray,
  Ui = (e) => cr(e) === '[object Map]',
  Qi = (e) => cr(e) === '[object Set]',
  Sh = (e) => cr(e) === '[object Date]',
  Tt = (e) => typeof e == 'function',
  xe = (e) => typeof e == 'string',
  Gs = (e) => typeof e == 'symbol',
  te = (e) => e !== null && typeof e == 'object',
  om = (e) => (te(e) || Tt(e)) && Tt(e.then) && Tt(e.catch),
  rm = Object.prototype.toString,
  cr = (e) => rm.call(e),
  av = (e) => cr(e).slice(8, -1),
  am = (e) => cr(e) === '[object Object]',
  cd = (e) => xe(e) && e !== 'NaN' && e[0] !== '-' && '' + parseInt(e, 10) === e,
  Oo = rd(
    ',key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted'
  ),
  Va = (e) => {
    const t = Object.create(null);
    return (s) => t[s] || (t[s] = e(s));
  },
  lv = /-\w/g,
  us = Va((e) => e.replace(lv, (t) => t.slice(1).toUpperCase())),
  cv = /\B([A-Z])/g,
  Fn = Va((e) => e.replace(cv, '-$1').toLowerCase()),
  Ha = Va((e) => e.charAt(0).toUpperCase() + e.slice(1)),
  Zl = Va((e) => (e ? `on${Ha(e)}` : '')),
  Qe = (e, t) => !Object.is(e, t),
  ca = (e, ...t) => {
    for (let s = 0; s < e.length; s++) e[s](...t);
  },
  lm = (e, t, s, n = !1) => {
    Object.defineProperty(e, t, { configurable: !0, enumerable: !1, writable: n, value: s });
  },
  za = (e) => {
    const t = parseFloat(e);
    return isNaN(t) ? e : t;
  };
let kh;
const Wa = () =>
  kh ||
  (kh =
    typeof globalThis < 'u'
      ? globalThis
      : typeof self < 'u'
        ? self
        : typeof window < 'u'
          ? window
          : typeof global < 'u'
            ? global
            : {});
function dd(e) {
  if (_t(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++) {
      const n = e[s],
        i = xe(n) ? fv(n) : dd(n);
      if (i) for (const o in i) t[o] = i[o];
    }
    return t;
  } else if (xe(e) || te(e)) return e;
}
const dv = /;(?![^(]*\))/g,
  uv = /:([^]+)/,
  hv = /\/\*[^]*?\*\//g;
function fv(e) {
  const t = {};
  return (
    e
      .replace(hv, '')
      .split(dv)
      .forEach((s) => {
        if (s) {
          const n = s.split(uv);
          n.length > 1 && (t[n[0].trim()] = n[1].trim());
        }
      }),
    t
  );
}
function vs(e) {
  let t = '';
  if (xe(e)) t = e;
  else if (_t(e))
    for (let s = 0; s < e.length; s++) {
      const n = vs(e[s]);
      n && (t += n + ' ');
    }
  else if (te(e)) for (const s in e) e[s] && (t += s + ' ');
  return t.trim();
}
const pv = 'itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly',
  mv = rd(pv);
function cm(e) {
  return !!e || e === '';
}
function gv(e, t) {
  if (e.length !== t.length) return !1;
  let s = !0;
  for (let n = 0; s && n < e.length; n++) s = In(e[n], t[n]);
  return s;
}
function In(e, t) {
  if (e === t) return !0;
  let s = Sh(e),
    n = Sh(t);
  if (s || n) return s && n ? e.getTime() === t.getTime() : !1;
  if (((s = Gs(e)), (n = Gs(t)), s || n)) return e === t;
  if (((s = _t(e)), (n = _t(t)), s || n)) return s && n ? gv(e, t) : !1;
  if (((s = te(e)), (n = te(t)), s || n)) {
    if (!s || !n) return !1;
    const i = Object.keys(e).length,
      o = Object.keys(t).length;
    if (i !== o) return !1;
    for (const r in e) {
      const a = e.hasOwnProperty(r),
        l = t.hasOwnProperty(r);
      if ((a && !l) || (!a && l) || !In(e[r], t[r])) return !1;
    }
  }
  return String(e) === String(t);
}
function ud(e, t) {
  return e.findIndex((s) => In(s, t));
}
const dm = (e) => !!(e && e.__v_isRef === !0),
  I = (e) =>
    xe(e)
      ? e
      : e == null
        ? ''
        : _t(e) || (te(e) && (e.toString === rm || !Tt(e.toString)))
          ? dm(e)
            ? I(e.value)
            : JSON.stringify(e, um, 2)
          : String(e),
  um = (e, t) =>
    dm(t)
      ? um(e, t.value)
      : Ui(t)
        ? {
            [`Map(${t.size})`]: [...t.entries()].reduce(
              (s, [n, i], o) => ((s[Ql(n, o) + ' =>'] = i), s),
              {}
            )
          }
        : Qi(t)
          ? { [`Set(${t.size})`]: [...t.values()].map((s) => Ql(s)) }
          : Gs(t)
            ? Ql(t)
            : te(t) && !_t(t) && !am(t)
              ? String(t)
              : t,
  Ql = (e, t = '') => {
    var s;
    return Gs(e) ? `Symbol(${(s = e.description) != null ? s : t})` : e;
  };
/**
 * @vue/reactivity v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ let Ze;
class bv {
  constructor(t = !1) {
    ((this.detached = t),
      (this._active = !0),
      (this._on = 0),
      (this.effects = []),
      (this.cleanups = []),
      (this._isPaused = !1),
      (this.__v_skip = !0),
      (this.parent = Ze),
      !t && Ze && (this.index = (Ze.scopes || (Ze.scopes = [])).push(this) - 1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, s;
      if (this.scopes) for (t = 0, s = this.scopes.length; t < s; t++) this.scopes[t].pause();
      for (t = 0, s = this.effects.length; t < s; t++) this.effects[t].pause();
    }
  }
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, s;
      if (this.scopes) for (t = 0, s = this.scopes.length; t < s; t++) this.scopes[t].resume();
      for (t = 0, s = this.effects.length; t < s; t++) this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const s = Ze;
      try {
        return ((Ze = this), t());
      } finally {
        Ze = s;
      }
    }
  }
  on() {
    ++this._on === 1 && ((this.prevScope = Ze), (Ze = this));
  }
  off() {
    this._on > 0 && --this._on === 0 && ((Ze = this.prevScope), (this.prevScope = void 0));
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let s, n;
      for (s = 0, n = this.effects.length; s < n; s++) this.effects[s].stop();
      for (this.effects.length = 0, s = 0, n = this.cleanups.length; s < n; s++) this.cleanups[s]();
      if (((this.cleanups.length = 0), this.scopes)) {
        for (s = 0, n = this.scopes.length; s < n; s++) this.scopes[s].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const i = this.parent.scopes.pop();
        i && i !== this && ((this.parent.scopes[this.index] = i), (i.index = this.index));
      }
      this.parent = void 0;
    }
  }
}
function _v() {
  return Ze;
}
let le;
const tc = new WeakSet();
class hm {
  constructor(t) {
    ((this.fn = t),
      (this.deps = void 0),
      (this.depsTail = void 0),
      (this.flags = 5),
      (this.next = void 0),
      (this.cleanup = void 0),
      (this.scheduler = void 0),
      Ze && Ze.active && Ze.effects.push(this));
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && ((this.flags &= -65), tc.has(this) && (tc.delete(this), this.trigger()));
  }
  notify() {
    (this.flags & 2 && !(this.flags & 32)) || this.flags & 8 || pm(this);
  }
  run() {
    if (!(this.flags & 1)) return this.fn();
    ((this.flags |= 2), Ch(this), mm(this));
    const t = le,
      s = Ps;
    ((le = this), (Ps = !0));
    try {
      return this.fn();
    } finally {
      (gm(this), (le = t), (Ps = s), (this.flags &= -3));
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep) pd(t);
      ((this.deps = this.depsTail = void 0),
        Ch(this),
        this.onStop && this.onStop(),
        (this.flags &= -2));
    }
  }
  trigger() {
    this.flags & 64 ? tc.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  runIfDirty() {
    Rc(this) && this.run();
  }
  get dirty() {
    return Rc(this);
  }
}
let fm = 0,
  Eo,
  Ro;
function pm(e, t = !1) {
  if (((e.flags |= 8), t)) {
    ((e.next = Ro), (Ro = e));
    return;
  }
  ((e.next = Eo), (Eo = e));
}
function hd() {
  fm++;
}
function fd() {
  if (--fm > 0) return;
  if (Ro) {
    let t = Ro;
    for (Ro = void 0; t; ) {
      const s = t.next;
      ((t.next = void 0), (t.flags &= -9), (t = s));
    }
  }
  let e;
  for (; Eo; ) {
    let t = Eo;
    for (Eo = void 0; t; ) {
      const s = t.next;
      if (((t.next = void 0), (t.flags &= -9), t.flags & 1))
        try {
          t.trigger();
        } catch (n) {
          e || (e = n);
        }
      t = s;
    }
  }
  if (e) throw e;
}
function mm(e) {
  for (let t = e.deps; t; t = t.nextDep)
    ((t.version = -1), (t.prevActiveLink = t.dep.activeLink), (t.dep.activeLink = t));
}
function gm(e) {
  let t,
    s = e.depsTail,
    n = s;
  for (; n; ) {
    const i = n.prevDep;
    (n.version === -1 ? (n === s && (s = i), pd(n), yv(n)) : (t = n),
      (n.dep.activeLink = n.prevActiveLink),
      (n.prevActiveLink = void 0),
      (n = i));
  }
  ((e.deps = t), (e.depsTail = s));
}
function Rc(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (
      t.dep.version !== t.version ||
      (t.dep.computed && (bm(t.dep.computed) || t.dep.version !== t.version))
    )
      return !0;
  return !!e._dirty;
}
function bm(e) {
  if (
    (e.flags & 4 && !(e.flags & 16)) ||
    ((e.flags &= -17), e.globalVersion === qo) ||
    ((e.globalVersion = qo), !e.isSSR && e.flags & 128 && ((!e.deps && !e._dirty) || !Rc(e)))
  )
    return;
  e.flags |= 2;
  const t = e.dep,
    s = le,
    n = Ps;
  ((le = e), (Ps = !0));
  try {
    mm(e);
    const i = e.fn(e._value);
    (t.version === 0 || Qe(i, e._value)) && ((e.flags |= 128), (e._value = i), t.version++);
  } catch (i) {
    throw (t.version++, i);
  } finally {
    ((le = s), (Ps = n), gm(e), (e.flags &= -3));
  }
}
function pd(e, t = !1) {
  const { dep: s, prevSub: n, nextSub: i } = e;
  if (
    (n && ((n.nextSub = i), (e.prevSub = void 0)),
    i && ((i.prevSub = n), (e.nextSub = void 0)),
    s.subs === e && ((s.subs = n), !n && s.computed))
  ) {
    s.computed.flags &= -5;
    for (let o = s.computed.deps; o; o = o.nextDep) pd(o, !0);
  }
  !t && !--s.sc && s.map && s.map.delete(s.key);
}
function yv(e) {
  const { prevDep: t, nextDep: s } = e;
  (t && ((t.nextDep = s), (e.prevDep = void 0)), s && ((s.prevDep = t), (e.nextDep = void 0)));
}
let Ps = !0;
const _m = [];
function mn() {
  (_m.push(Ps), (Ps = !1));
}
function gn() {
  const e = _m.pop();
  Ps = e === void 0 ? !0 : e;
}
function Ch(e) {
  const { cleanup: t } = e;
  if (((e.cleanup = void 0), t)) {
    const s = le;
    le = void 0;
    try {
      t();
    } finally {
      le = s;
    }
  }
}
let qo = 0;
class vv {
  constructor(t, s) {
    ((this.sub = t),
      (this.dep = s),
      (this.version = s.version),
      (this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0));
  }
}
class Ka {
  constructor(t) {
    ((this.computed = t),
      (this.version = 0),
      (this.activeLink = void 0),
      (this.subs = void 0),
      (this.map = void 0),
      (this.key = void 0),
      (this.sc = 0),
      (this.__v_skip = !0));
  }
  track(t) {
    if (!le || !Ps || le === this.computed) return;
    let s = this.activeLink;
    if (s === void 0 || s.sub !== le)
      ((s = this.activeLink = new vv(le, this)),
        le.deps
          ? ((s.prevDep = le.depsTail), (le.depsTail.nextDep = s), (le.depsTail = s))
          : (le.deps = le.depsTail = s),
        ym(s));
    else if (s.version === -1 && ((s.version = this.version), s.nextDep)) {
      const n = s.nextDep;
      ((n.prevDep = s.prevDep),
        s.prevDep && (s.prevDep.nextDep = n),
        (s.prevDep = le.depsTail),
        (s.nextDep = void 0),
        (le.depsTail.nextDep = s),
        (le.depsTail = s),
        le.deps === s && (le.deps = n));
    }
    return s;
  }
  trigger(t) {
    (this.version++, qo++, this.notify(t));
  }
  notify(t) {
    hd();
    try {
      for (let s = this.subs; s; s = s.prevSub) s.sub.notify() && s.sub.dep.notify();
    } finally {
      fd();
    }
  }
}
function ym(e) {
  if ((e.dep.sc++, e.sub.flags & 4)) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let n = t.deps; n; n = n.nextDep) ym(n);
    }
    const s = e.dep.subs;
    (s !== e && ((e.prevSub = s), s && (s.nextSub = e)), (e.dep.subs = e));
  }
}
const Dc = new WeakMap(),
  di = Symbol(''),
  Mc = Symbol(''),
  Go = Symbol('');
function Ie(e, t, s) {
  if (Ps && le) {
    let n = Dc.get(e);
    n || Dc.set(e, (n = new Map()));
    let i = n.get(s);
    (i || (n.set(s, (i = new Ka())), (i.map = n), (i.key = s)), i.track());
  }
}
function ln(e, t, s, n, i, o) {
  const r = Dc.get(e);
  if (!r) {
    qo++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if ((hd(), t === 'clear')) r.forEach(a);
  else {
    const l = _t(e),
      c = l && cd(s);
    if (l && s === 'length') {
      const h = Number(n);
      r.forEach((f, m) => {
        (m === 'length' || m === Go || (!Gs(m) && m >= h)) && a(f);
      });
    } else
      switch (((s !== void 0 || r.has(void 0)) && a(r.get(s)), c && a(r.get(Go)), t)) {
        case 'add':
          l ? c && a(r.get('length')) : (a(r.get(di)), Ui(e) && a(r.get(Mc)));
          break;
        case 'delete':
          l || (a(r.get(di)), Ui(e) && a(r.get(Mc)));
          break;
        case 'set':
          Ui(e) && a(r.get(di));
          break;
      }
  }
  fd();
}
function Di(e) {
  const t = Bt(e);
  return t === e ? t : (Ie(t, 'iterate', Go), ws(e) ? t : t.map(Os));
}
function qa(e) {
  return (Ie((e = Bt(e)), 'iterate', Go), e);
}
function An(e, t) {
  return bn(e) ? Wi(ui(e) ? Os(t) : t) : Os(t);
}
const xv = {
  __proto__: null,
  [Symbol.iterator]() {
    return ec(this, Symbol.iterator, (e) => An(this, e));
  },
  concat(...e) {
    return Di(this).concat(...e.map((t) => (_t(t) ? Di(t) : t)));
  },
  entries() {
    return ec(this, 'entries', (e) => ((e[1] = An(this, e[1])), e));
  },
  every(e, t) {
    return Qs(this, 'every', e, t, void 0, arguments);
  },
  filter(e, t) {
    return Qs(this, 'filter', e, t, (s) => s.map((n) => An(this, n)), arguments);
  },
  find(e, t) {
    return Qs(this, 'find', e, t, (s) => An(this, s), arguments);
  },
  findIndex(e, t) {
    return Qs(this, 'findIndex', e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Qs(this, 'findLast', e, t, (s) => An(this, s), arguments);
  },
  findLastIndex(e, t) {
    return Qs(this, 'findLastIndex', e, t, void 0, arguments);
  },
  forEach(e, t) {
    return Qs(this, 'forEach', e, t, void 0, arguments);
  },
  includes(...e) {
    return sc(this, 'includes', e);
  },
  indexOf(...e) {
    return sc(this, 'indexOf', e);
  },
  join(e) {
    return Di(this).join(e);
  },
  lastIndexOf(...e) {
    return sc(this, 'lastIndexOf', e);
  },
  map(e, t) {
    return Qs(this, 'map', e, t, void 0, arguments);
  },
  pop() {
    return uo(this, 'pop');
  },
  push(...e) {
    return uo(this, 'push', e);
  },
  reduce(e, ...t) {
    return Th(this, 'reduce', e, t);
  },
  reduceRight(e, ...t) {
    return Th(this, 'reduceRight', e, t);
  },
  shift() {
    return uo(this, 'shift');
  },
  some(e, t) {
    return Qs(this, 'some', e, t, void 0, arguments);
  },
  splice(...e) {
    return uo(this, 'splice', e);
  },
  toReversed() {
    return Di(this).toReversed();
  },
  toSorted(e) {
    return Di(this).toSorted(e);
  },
  toSpliced(...e) {
    return Di(this).toSpliced(...e);
  },
  unshift(...e) {
    return uo(this, 'unshift', e);
  },
  values() {
    return ec(this, 'values', (e) => An(this, e));
  }
};
function ec(e, t, s) {
  const n = qa(e),
    i = n[t]();
  return (
    n !== e &&
      !ws(e) &&
      ((i._next = i.next),
      (i.next = () => {
        const o = i._next();
        return (o.done || (o.value = s(o.value)), o);
      })),
    i
  );
}
const wv = Array.prototype;
function Qs(e, t, s, n, i, o) {
  const r = qa(e),
    a = r !== e && !ws(e),
    l = r[t];
  if (l !== wv[t]) {
    const f = l.apply(e, o);
    return a ? Os(f) : f;
  }
  let c = s;
  r !== e &&
    (a
      ? (c = function (f, m) {
          return s.call(this, An(e, f), m, e);
        })
      : s.length > 2 &&
        (c = function (f, m) {
          return s.call(this, f, m, e);
        }));
  const h = l.call(r, c, n);
  return a && i ? i(h) : h;
}
function Th(e, t, s, n) {
  const i = qa(e);
  let o = s;
  return (
    i !== e &&
      (ws(e)
        ? s.length > 3 &&
          (o = function (r, a, l) {
            return s.call(this, r, a, l, e);
          })
        : (o = function (r, a, l) {
            return s.call(this, r, An(e, a), l, e);
          })),
    i[t](o, ...n)
  );
}
function sc(e, t, s) {
  const n = Bt(e);
  Ie(n, 'iterate', Go);
  const i = n[t](...s);
  return (i === -1 || i === !1) && dr(s[0]) ? ((s[0] = Bt(s[0])), n[t](...s)) : i;
}
function uo(e, t, s = []) {
  (mn(), hd());
  const n = Bt(e)[t].apply(e, s);
  return (fd(), gn(), n);
}
const Sv = rd('__proto__,__v_isRef,__isVue'),
  vm = new Set(
    Object.getOwnPropertyNames(Symbol)
      .filter((e) => e !== 'arguments' && e !== 'caller')
      .map((e) => Symbol[e])
      .filter(Gs)
  );
function kv(e) {
  Gs(e) || (e = String(e));
  const t = Bt(this);
  return (Ie(t, 'has', e), t.hasOwnProperty(e));
}
class xm {
  constructor(t = !1, s = !1) {
    ((this._isReadonly = t), (this._isShallow = s));
  }
  get(t, s, n) {
    if (s === '__v_skip') return t.__v_skip;
    const i = this._isReadonly,
      o = this._isShallow;
    if (s === '__v_isReactive') return !i;
    if (s === '__v_isReadonly') return i;
    if (s === '__v_isShallow') return o;
    if (s === '__v_raw')
      return n === (i ? (o ? Iv : Cm) : o ? km : Sm).get(t) ||
        Object.getPrototypeOf(t) === Object.getPrototypeOf(n)
        ? t
        : void 0;
    const r = _t(t);
    if (!i) {
      let l;
      if (r && (l = xv[s])) return l;
      if (s === 'hasOwnProperty') return kv;
    }
    const a = Reflect.get(t, s, Be(t) ? t : n);
    if ((Gs(s) ? vm.has(s) : Sv(s)) || (i || Ie(t, 'get', s), o)) return a;
    if (Be(a)) {
      const l = r && cd(s) ? a : a.value;
      return i && te(l) ? Lc(l) : l;
    }
    return te(a) ? (i ? Lc(a) : Ga(a)) : a;
  }
}
class wm extends xm {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, s, n, i) {
    let o = t[s];
    const r = _t(t) && cd(s);
    if (!this._isShallow) {
      const c = bn(o);
      if ((!ws(n) && !bn(n) && ((o = Bt(o)), (n = Bt(n))), !r && Be(o) && !Be(n)))
        return (c || (o.value = n), !0);
    }
    const a = r ? Number(s) < t.length : qt(t, s),
      l = Reflect.set(t, s, n, Be(t) ? t : i);
    return (t === Bt(i) && (a ? Qe(n, o) && ln(t, 'set', s, n) : ln(t, 'add', s, n)), l);
  }
  deleteProperty(t, s) {
    const n = qt(t, s);
    t[s];
    const i = Reflect.deleteProperty(t, s);
    return (i && n && ln(t, 'delete', s, void 0), i);
  }
  has(t, s) {
    const n = Reflect.has(t, s);
    return ((!Gs(s) || !vm.has(s)) && Ie(t, 'has', s), n);
  }
  ownKeys(t) {
    return (Ie(t, 'iterate', _t(t) ? 'length' : di), Reflect.ownKeys(t));
  }
}
class Cv extends xm {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, s) {
    return !0;
  }
  deleteProperty(t, s) {
    return !0;
  }
}
const Tv = new wm(),
  Av = new Cv(),
  Pv = new wm(!0);
const Ic = (e) => e,
  Hr = (e) => Reflect.getPrototypeOf(e);
function Ov(e, t, s) {
  return function (...n) {
    const i = this.__v_raw,
      o = Bt(i),
      r = Ui(o),
      a = e === 'entries' || (e === Symbol.iterator && r),
      l = e === 'keys' && r,
      c = i[e](...n),
      h = s ? Ic : t ? Wi : Os;
    return (
      !t && Ie(o, 'iterate', l ? Mc : di),
      Pe(Object.create(c), {
        next() {
          const { value: f, done: m } = c.next();
          return m ? { value: f, done: m } : { value: a ? [h(f[0]), h(f[1])] : h(f), done: m };
        }
      })
    );
  };
}
function zr(e) {
  return function (...t) {
    return e === 'delete' ? !1 : e === 'clear' ? void 0 : this;
  };
}
function Ev(e, t) {
  const s = {
    get(i) {
      const o = this.__v_raw,
        r = Bt(o),
        a = Bt(i);
      e || (Qe(i, a) && Ie(r, 'get', i), Ie(r, 'get', a));
      const { has: l } = Hr(r),
        c = t ? Ic : e ? Wi : Os;
      if (l.call(r, i)) return c(o.get(i));
      if (l.call(r, a)) return c(o.get(a));
      o !== r && o.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return (!e && Ie(Bt(i), 'iterate', di), i.size);
    },
    has(i) {
      const o = this.__v_raw,
        r = Bt(o),
        a = Bt(i);
      return (
        e || (Qe(i, a) && Ie(r, 'has', i), Ie(r, 'has', a)),
        i === a ? o.has(i) : o.has(i) || o.has(a)
      );
    },
    forEach(i, o) {
      const r = this,
        a = r.__v_raw,
        l = Bt(a),
        c = t ? Ic : e ? Wi : Os;
      return (!e && Ie(l, 'iterate', di), a.forEach((h, f) => i.call(o, c(h), c(f), r)));
    }
  };
  return (
    Pe(
      s,
      e
        ? { add: zr('add'), set: zr('set'), delete: zr('delete'), clear: zr('clear') }
        : {
            add(i) {
              !t && !ws(i) && !bn(i) && (i = Bt(i));
              const o = Bt(this);
              return (Hr(o).has.call(o, i) || (o.add(i), ln(o, 'add', i, i)), this);
            },
            set(i, o) {
              !t && !ws(o) && !bn(o) && (o = Bt(o));
              const r = Bt(this),
                { has: a, get: l } = Hr(r);
              let c = a.call(r, i);
              c || ((i = Bt(i)), (c = a.call(r, i)));
              const h = l.call(r, i);
              return (r.set(i, o), c ? Qe(o, h) && ln(r, 'set', i, o) : ln(r, 'add', i, o), this);
            },
            delete(i) {
              const o = Bt(this),
                { has: r, get: a } = Hr(o);
              let l = r.call(o, i);
              (l || ((i = Bt(i)), (l = r.call(o, i))), a && a.call(o, i));
              const c = o.delete(i);
              return (l && ln(o, 'delete', i, void 0), c);
            },
            clear() {
              const i = Bt(this),
                o = i.size !== 0,
                r = i.clear();
              return (o && ln(i, 'clear', void 0, void 0), r);
            }
          }
    ),
    ['keys', 'values', 'entries', Symbol.iterator].forEach((i) => {
      s[i] = Ov(i, e, t);
    }),
    s
  );
}
function md(e, t) {
  const s = Ev(e, t);
  return (n, i, o) =>
    i === '__v_isReactive'
      ? !e
      : i === '__v_isReadonly'
        ? e
        : i === '__v_raw'
          ? n
          : Reflect.get(qt(s, i) && i in n ? s : n, i, o);
}
const Rv = { get: md(!1, !1) },
  Dv = { get: md(!1, !0) },
  Mv = { get: md(!0, !1) };
const Sm = new WeakMap(),
  km = new WeakMap(),
  Cm = new WeakMap(),
  Iv = new WeakMap();
function Lv(e) {
  switch (e) {
    case 'Object':
    case 'Array':
      return 1;
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return 2;
    default:
      return 0;
  }
}
function Nv(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Lv(av(e));
}
function Ga(e) {
  return bn(e) ? e : gd(e, !1, Tv, Rv, Sm);
}
function Tm(e) {
  return gd(e, !1, Pv, Dv, km);
}
function Lc(e) {
  return gd(e, !0, Av, Mv, Cm);
}
function gd(e, t, s, n, i) {
  if (!te(e) || (e.__v_raw && !(t && e.__v_isReactive))) return e;
  const o = Nv(e);
  if (o === 0) return e;
  const r = i.get(e);
  if (r) return r;
  const a = new Proxy(e, o === 2 ? n : s);
  return (i.set(e, a), a);
}
function ui(e) {
  return bn(e) ? ui(e.__v_raw) : !!(e && e.__v_isReactive);
}
function bn(e) {
  return !!(e && e.__v_isReadonly);
}
function ws(e) {
  return !!(e && e.__v_isShallow);
}
function dr(e) {
  return e ? !!e.__v_raw : !1;
}
function Bt(e) {
  const t = e && e.__v_raw;
  return t ? Bt(t) : e;
}
function $v(e) {
  return (!qt(e, '__v_skip') && Object.isExtensible(e) && lm(e, '__v_skip', !0), e);
}
const Os = (e) => (te(e) ? Ga(e) : e),
  Wi = (e) => (te(e) ? Lc(e) : e);
function Be(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function de(e) {
  return Am(e, !1);
}
function bd(e) {
  return Am(e, !0);
}
function Am(e, t) {
  return Be(e) ? e : new Fv(e, t);
}
class Fv {
  constructor(t, s) {
    ((this.dep = new Ka()),
      (this.__v_isRef = !0),
      (this.__v_isShallow = !1),
      (this._rawValue = s ? t : Bt(t)),
      (this._value = s ? t : Os(t)),
      (this.__v_isShallow = s));
  }
  get value() {
    return (this.dep.track(), this._value);
  }
  set value(t) {
    const s = this._rawValue,
      n = this.__v_isShallow || ws(t) || bn(t);
    ((t = n ? t : Bt(t)),
      Qe(t, s) && ((this._rawValue = t), (this._value = n ? t : Os(t)), this.dep.trigger()));
  }
}
function Ot(e) {
  return Be(e) ? e.value : e;
}
const Bv = {
  get: (e, t, s) => (t === '__v_raw' ? e : Ot(Reflect.get(e, t, s))),
  set: (e, t, s, n) => {
    const i = e[t];
    return Be(i) && !Be(s) ? ((i.value = s), !0) : Reflect.set(e, t, s, n);
  }
};
function Pm(e) {
  return ui(e) ? e : new Proxy(e, Bv);
}
class Uv {
  constructor(t) {
    ((this.__v_isRef = !0), (this._value = void 0));
    const s = (this.dep = new Ka()),
      { get: n, set: i } = t(s.track.bind(s), s.trigger.bind(s));
    ((this._get = n), (this._set = i));
  }
  get value() {
    return (this._value = this._get());
  }
  set value(t) {
    this._set(t);
  }
}
function jv(e) {
  return new Uv(e);
}
class Vv {
  constructor(t, s, n) {
    ((this.fn = t),
      (this.setter = s),
      (this._value = void 0),
      (this.dep = new Ka(this)),
      (this.__v_isRef = !0),
      (this.deps = void 0),
      (this.depsTail = void 0),
      (this.flags = 16),
      (this.globalVersion = qo - 1),
      (this.next = void 0),
      (this.effect = this),
      (this.__v_isReadonly = !s),
      (this.isSSR = n));
  }
  notify() {
    if (((this.flags |= 16), !(this.flags & 8) && le !== this)) return (pm(this, !0), !0);
  }
  get value() {
    const t = this.dep.track();
    return (bm(this), t && (t.version = this.dep.version), this._value);
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function Hv(e, t, s = !1) {
  let n, i;
  return (Tt(e) ? (n = e) : ((n = e.get), (i = e.set)), new Vv(n, i, s));
}
const Wr = {},
  xa = new WeakMap();
let ni;
function zv(e, t = !1, s = ni) {
  if (s) {
    let n = xa.get(s);
    (n || xa.set(s, (n = [])), n.push(e));
  }
}
function Wv(e, t, s = Wt) {
  const { immediate: n, deep: i, once: o, scheduler: r, augmentJob: a, call: l } = s,
    c = (E) => (i ? E : ws(E) || i === !1 || i === 0 ? cn(E, 1) : cn(E));
  let h,
    f,
    m,
    g,
    _ = !1,
    y = !1;
  if (
    (Be(e)
      ? ((f = () => e.value), (_ = ws(e)))
      : ui(e)
        ? ((f = () => c(e)), (_ = !0))
        : _t(e)
          ? ((y = !0),
            (_ = e.some((E) => ui(E) || ws(E))),
            (f = () =>
              e.map((E) => {
                if (Be(E)) return E.value;
                if (ui(E)) return c(E);
                if (Tt(E)) return l ? l(E, 2) : E();
              })))
          : Tt(e)
            ? t
              ? (f = l ? () => l(e, 2) : e)
              : (f = () => {
                  if (m) {
                    mn();
                    try {
                      m();
                    } finally {
                      gn();
                    }
                  }
                  const E = ni;
                  ni = h;
                  try {
                    return l ? l(e, 3, [g]) : e(g);
                  } finally {
                    ni = E;
                  }
                })
            : (f = Ws),
    t && i)
  ) {
    const E = f,
      M = i === !0 ? 1 / 0 : i;
    f = () => cn(E(), M);
  }
  const x = _v(),
    w = () => {
      (h.stop(), x && x.active && ld(x.effects, h));
    };
  if (o && t) {
    const E = t;
    t = (...M) => {
      (E(...M), w());
    };
  }
  let C = y ? new Array(e.length).fill(Wr) : Wr;
  const T = (E) => {
    if (!(!(h.flags & 1) || (!h.dirty && !E)))
      if (t) {
        const M = h.run();
        if (i || _ || (y ? M.some((H, $) => Qe(H, C[$])) : Qe(M, C))) {
          m && m();
          const H = ni;
          ni = h;
          try {
            const $ = [M, C === Wr ? void 0 : y && C[0] === Wr ? [] : C, g];
            ((C = M), l ? l(t, 3, $) : t(...$));
          } finally {
            ni = H;
          }
        }
      } else h.run();
  };
  return (
    a && a(T),
    (h = new hm(f)),
    (h.scheduler = r ? () => r(T, !1) : T),
    (g = (E) => zv(E, !1, h)),
    (m = h.onStop =
      () => {
        const E = xa.get(h);
        if (E) {
          if (l) l(E, 4);
          else for (const M of E) M();
          xa.delete(h);
        }
      }),
    t ? (n ? T(!0) : (C = h.run())) : r ? r(T.bind(null, !0), !0) : h.run(),
    (w.pause = h.pause.bind(h)),
    (w.resume = h.resume.bind(h)),
    (w.stop = w),
    w
  );
}
function cn(e, t = 1 / 0, s) {
  if (t <= 0 || !te(e) || e.__v_skip || ((s = s || new Map()), (s.get(e) || 0) >= t)) return e;
  if ((s.set(e, t), t--, Be(e))) cn(e.value, t, s);
  else if (_t(e)) for (let n = 0; n < e.length; n++) cn(e[n], t, s);
  else if (Qi(e) || Ui(e))
    e.forEach((n) => {
      cn(n, t, s);
    });
  else if (am(e)) {
    for (const n in e) cn(e[n], t, s);
    for (const n of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, n) && cn(e[n], t, s);
  }
  return e;
}
/**
 * @vue/runtime-core v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ function ur(e, t, s, n) {
  try {
    return n ? e(...n) : e();
  } catch (i) {
    Xa(i, t, s);
  }
}
function Xs(e, t, s, n) {
  if (Tt(e)) {
    const i = ur(e, t, s, n);
    return (
      i &&
        om(i) &&
        i.catch((o) => {
          Xa(o, t, s);
        }),
      i
    );
  }
  if (_t(e)) {
    const i = [];
    for (let o = 0; o < e.length; o++) i.push(Xs(e[o], t, s, n));
    return i;
  }
}
function Xa(e, t, s, n = !0) {
  const i = t ? t.vnode : null,
    { errorHandler: o, throwUnhandledErrorInProduction: r } = (t && t.appContext.config) || Wt;
  if (t) {
    let a = t.parent;
    const l = t.proxy,
      c = `https://vuejs.org/error-reference/#runtime-${s}`;
    for (; a; ) {
      const h = a.ec;
      if (h) {
        for (let f = 0; f < h.length; f++) if (h[f](e, l, c) === !1) return;
      }
      a = a.parent;
    }
    if (o) {
      (mn(), ur(o, null, 10, [e, l, c]), gn());
      return;
    }
  }
  Kv(e, s, i, n, r);
}
function Kv(e, t, s, n = !0, i = !1) {
  if (i) throw e;
  console.error(e);
}
const qe = [];
let Vs = -1;
const ji = [];
let Pn = null,
  Ni = 0;
const Om = Promise.resolve();
let wa = null;
function Ya(e) {
  const t = wa || Om;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function qv(e) {
  let t = Vs + 1,
    s = qe.length;
  for (; t < s; ) {
    const n = (t + s) >>> 1,
      i = qe[n],
      o = Xo(i);
    o < e || (o === e && i.flags & 2) ? (t = n + 1) : (s = n);
  }
  return t;
}
function _d(e) {
  if (!(e.flags & 1)) {
    const t = Xo(e),
      s = qe[qe.length - 1];
    (!s || (!(e.flags & 2) && t >= Xo(s)) ? qe.push(e) : qe.splice(qv(t), 0, e),
      (e.flags |= 1),
      Em());
  }
}
function Em() {
  wa || (wa = Om.then(Dm));
}
function Gv(e) {
  (_t(e)
    ? ji.push(...e)
    : Pn && e.id === -1
      ? Pn.splice(Ni + 1, 0, e)
      : e.flags & 1 || (ji.push(e), (e.flags |= 1)),
    Em());
}
function Ah(e, t, s = Vs + 1) {
  for (; s < qe.length; s++) {
    const n = qe[s];
    if (n && n.flags & 2) {
      if (e && n.id !== e.uid) continue;
      (qe.splice(s, 1), s--, n.flags & 4 && (n.flags &= -2), n(), n.flags & 4 || (n.flags &= -2));
    }
  }
}
function Rm(e) {
  if (ji.length) {
    const t = [...new Set(ji)].sort((s, n) => Xo(s) - Xo(n));
    if (((ji.length = 0), Pn)) {
      Pn.push(...t);
      return;
    }
    for (Pn = t, Ni = 0; Ni < Pn.length; Ni++) {
      const s = Pn[Ni];
      (s.flags & 4 && (s.flags &= -2), s.flags & 8 || s(), (s.flags &= -2));
    }
    ((Pn = null), (Ni = 0));
  }
}
const Xo = (e) => (e.id == null ? (e.flags & 2 ? -1 : 1 / 0) : e.id);
function Dm(e) {
  try {
    for (Vs = 0; Vs < qe.length; Vs++) {
      const t = qe[Vs];
      t &&
        !(t.flags & 8) &&
        (t.flags & 4 && (t.flags &= -2), ur(t, t.i, t.i ? 15 : 14), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Vs < qe.length; Vs++) {
      const t = qe[Vs];
      t && (t.flags &= -2);
    }
    ((Vs = -1), (qe.length = 0), Rm(), (wa = null), (qe.length || ji.length) && Dm());
  }
}
let cs = null,
  Mm = null;
function Sa(e) {
  const t = cs;
  return ((cs = e), (Mm = (e && e.type.__scopeId) || null), t);
}
function Do(e, t = cs, s) {
  if (!t || e._n) return e;
  const n = (...i) => {
    n._d && Aa(-1);
    const o = Sa(t);
    let r;
    try {
      r = e(...i);
    } finally {
      (Sa(o), n._d && Aa(1));
    }
    return r;
  };
  return ((n._n = !0), (n._c = !0), (n._d = !0), n);
}
function bt(e, t) {
  if (cs === null) return e;
  const s = el(cs),
    n = e.dirs || (e.dirs = []);
  for (let i = 0; i < t.length; i++) {
    let [o, r, a, l = Wt] = t[i];
    o &&
      (Tt(o) && (o = { mounted: o, updated: o }),
      o.deep && cn(r),
      n.push({ dir: o, instance: s, value: r, oldValue: void 0, arg: a, modifiers: l }));
  }
  return e;
}
function Yn(e, t, s, n) {
  const i = e.dirs,
    o = t && t.dirs;
  for (let r = 0; r < i.length; r++) {
    const a = i[r];
    o && (a.oldValue = o[r].value);
    let l = a.dir[n];
    l && (mn(), Xs(l, s, 8, [e.el, a, e, t]), gn());
  }
}
function da(e, t) {
  if (Le) {
    let s = Le.provides;
    const n = Le.parent && Le.parent.provides;
    (n === s && (s = Le.provides = Object.create(n)), (s[e] = t));
  }
}
function pn(e, t, s = !1) {
  const n = og();
  if (n || Vi) {
    let i = Vi
      ? Vi._context.provides
      : n
        ? n.parent == null || n.ce
          ? n.vnode.appContext && n.vnode.appContext.provides
          : n.parent.provides
        : void 0;
    if (i && e in i) return i[e];
    if (arguments.length > 1) return s && Tt(t) ? t.call(n && n.proxy) : t;
  }
}
const Xv = Symbol.for('v-scx'),
  Yv = () => pn(Xv);
function Jv(e, t) {
  return yd(e, null, { flush: 'sync' });
}
function Mo(e, t, s) {
  return yd(e, t, s);
}
function yd(e, t, s = Wt) {
  const { immediate: n, deep: i, flush: o, once: r } = s,
    a = Pe({}, s),
    l = (t && n) || (!t && o !== 'post');
  let c;
  if (Jo) {
    if (o === 'sync') {
      const g = Yv();
      c = g.__watcherHandles || (g.__watcherHandles = []);
    } else if (!l) {
      const g = () => {};
      return ((g.stop = Ws), (g.resume = Ws), (g.pause = Ws), g);
    }
  }
  const h = Le;
  a.call = (g, _, y) => Xs(g, h, _, y);
  let f = !1;
  (o === 'post'
    ? (a.scheduler = (g) => {
        Xe(g, h && h.suspense);
      })
    : o !== 'sync' &&
      ((f = !0),
      (a.scheduler = (g, _) => {
        _ ? g() : _d(g);
      })),
    (a.augmentJob = (g) => {
      (t && (g.flags |= 4), f && ((g.flags |= 2), h && ((g.id = h.uid), (g.i = h))));
    }));
  const m = Wv(e, t, a);
  return (Jo && (c ? c.push(m) : l && m()), m);
}
function Zv(e, t, s) {
  const n = this.proxy,
    i = xe(e) ? (e.includes('.') ? Im(n, e) : () => n[e]) : e.bind(n, n);
  let o;
  Tt(t) ? (o = t) : ((o = t.handler), (s = t));
  const r = fr(this),
    a = yd(i, o.bind(n), s);
  return (r(), a);
}
function Im(e, t) {
  const s = t.split('.');
  return () => {
    let n = e;
    for (let i = 0; i < s.length && n; i++) n = n[s[i]];
    return n;
  };
}
const Qv = Symbol('_vte'),
  t0 = (e) => e.__isTeleport,
  e0 = Symbol('_leaveCb');
function vd(e, t) {
  e.shapeFlag & 6 && e.component
    ? ((e.transition = t), vd(e.component.subTree, t))
    : e.shapeFlag & 128
      ? ((e.ssContent.transition = t.clone(e.ssContent)),
        (e.ssFallback.transition = t.clone(e.ssFallback)))
      : (e.transition = t);
}
function Ja(e, t) {
  return Tt(e) ? Pe({ name: e.name }, t, { setup: e }) : e;
}
function Lm(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + '-', 0, 0];
}
function Ph(e, t) {
  let s;
  return !!((s = Object.getOwnPropertyDescriptor(e, t)) && !s.configurable);
}
const ka = new WeakMap();
function Io(e, t, s, n, i = !1) {
  if (_t(e)) {
    e.forEach((y, x) => Io(y, t && (_t(t) ? t[x] : t), s, n, i));
    return;
  }
  if (Lo(n) && !i) {
    n.shapeFlag & 512 &&
      n.type.__asyncResolved &&
      n.component.subTree.component &&
      Io(e, t, s, n.component.subTree);
    return;
  }
  const o = n.shapeFlag & 4 ? el(n.component) : n.el,
    r = i ? null : o,
    { i: a, r: l } = e,
    c = t && t.r,
    h = a.refs === Wt ? (a.refs = {}) : a.refs,
    f = a.setupState,
    m = Bt(f),
    g = f === Wt ? im : (y) => (Ph(h, y) ? !1 : qt(m, y)),
    _ = (y, x) => !(x && Ph(h, x));
  if (c != null && c !== l) {
    if ((Oh(t), xe(c))) ((h[c] = null), g(c) && (f[c] = null));
    else if (Be(c)) {
      const y = t;
      (_(c, y.k) && (c.value = null), y.k && (h[y.k] = null));
    }
  }
  if (Tt(l)) ur(l, a, 12, [r, h]);
  else {
    const y = xe(l),
      x = Be(l);
    if (y || x) {
      const w = () => {
        if (e.f) {
          const C = y ? (g(l) ? f[l] : h[l]) : _() || !e.k ? l.value : h[e.k];
          if (i) _t(C) && ld(C, o);
          else if (_t(C)) C.includes(o) || C.push(o);
          else if (y) ((h[l] = [o]), g(l) && (f[l] = h[l]));
          else {
            const T = [o];
            (_(l, e.k) && (l.value = T), e.k && (h[e.k] = T));
          }
        } else
          y
            ? ((h[l] = r), g(l) && (f[l] = r))
            : x && (_(l, e.k) && (l.value = r), e.k && (h[e.k] = r));
      };
      if (r) {
        const C = () => {
          (w(), ka.delete(e));
        };
        ((C.id = -1), ka.set(e, C), Xe(C, s));
      } else (Oh(e), w());
    }
  }
}
function Oh(e) {
  const t = ka.get(e);
  t && ((t.flags |= 8), ka.delete(e));
}
Wa().requestIdleCallback;
Wa().cancelIdleCallback;
const Lo = (e) => !!e.type.__asyncLoader,
  Nm = (e) => e.type.__isKeepAlive;
function s0(e, t) {
  $m(e, 'a', t);
}
function n0(e, t) {
  $m(e, 'da', t);
}
function $m(e, t, s = Le) {
  const n =
    e.__wdc ||
    (e.__wdc = () => {
      let i = s;
      for (; i; ) {
        if (i.isDeactivated) return;
        i = i.parent;
      }
      return e();
    });
  if ((Za(t, n, s), s)) {
    let i = s.parent;
    for (; i && i.parent; ) (Nm(i.parent.vnode) && i0(n, t, s, i), (i = i.parent));
  }
}
function i0(e, t, s, n) {
  const i = Za(t, e, n, !0);
  xd(() => {
    ld(n[t], i);
  }, s);
}
function Za(e, t, s = Le, n = !1) {
  if (s) {
    const i = s[e] || (s[e] = []),
      o =
        t.__weh ||
        (t.__weh = (...r) => {
          mn();
          const a = fr(s),
            l = Xs(t, s, e, r);
          return (a(), gn(), l);
        });
    return (n ? i.unshift(o) : i.push(o), o);
  }
}
const yn =
    (e) =>
    (t, s = Le) => {
      (!Jo || e === 'sp') && Za(e, (...n) => t(...n), s);
    },
  o0 = yn('bm'),
  to = yn('m'),
  r0 = yn('bu'),
  a0 = yn('u'),
  l0 = yn('bum'),
  xd = yn('um'),
  c0 = yn('sp'),
  d0 = yn('rtg'),
  u0 = yn('rtc');
function h0(e, t = Le) {
  Za('ec', e, t);
}
const f0 = 'components';
function Ks(e, t) {
  return m0(f0, e, !0, t) || e;
}
const p0 = Symbol.for('v-ndc');
function m0(e, t, s = !0, n = !1) {
  const i = cs || Le;
  if (i) {
    const o = i.type;
    {
      const a = Z0(o, !1);
      if (a && (a === t || a === us(t) || a === Ha(us(t)))) return o;
    }
    const r = Eh(i[e] || o[e], t) || Eh(i.appContext[e], t);
    return !r && n ? o : r;
  }
}
function Eh(e, t) {
  return e && (e[t] || e[us(t)] || e[Ha(us(t))]);
}
function Ce(e, t, s, n) {
  let i;
  const o = s,
    r = _t(e);
  if (r || xe(e)) {
    const a = r && ui(e);
    let l = !1,
      c = !1;
    (a && ((l = !ws(e)), (c = bn(e)), (e = qa(e))), (i = new Array(e.length)));
    for (let h = 0, f = e.length; h < f; h++)
      i[h] = t(l ? (c ? Wi(Os(e[h])) : Os(e[h])) : e[h], h, void 0, o);
  } else if (typeof e == 'number') {
    i = new Array(e);
    for (let a = 0; a < e; a++) i[a] = t(a + 1, a, void 0, o);
  } else if (te(e))
    if (e[Symbol.iterator]) i = Array.from(e, (a, l) => t(a, l, void 0, o));
    else {
      const a = Object.keys(e);
      i = new Array(a.length);
      for (let l = 0, c = a.length; l < c; l++) {
        const h = a[l];
        i[l] = t(e[h], h, l, o);
      }
    }
  else i = [];
  return i;
}
const Nc = (e) => (e ? (rg(e) ? el(e) : Nc(e.parent)) : null),
  No = Pe(Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Nc(e.parent),
    $root: (e) => Nc(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Bm(e),
    $forceUpdate: (e) =>
      e.f ||
      (e.f = () => {
        _d(e.update);
      }),
    $nextTick: (e) => e.n || (e.n = Ya.bind(e.proxy)),
    $watch: (e) => Zv.bind(e)
  }),
  nc = (e, t) => e !== Wt && !e.__isScriptSetup && qt(e, t),
  g0 = {
    get({ _: e }, t) {
      if (t === '__v_skip') return !0;
      const {
        ctx: s,
        setupState: n,
        data: i,
        props: o,
        accessCache: r,
        type: a,
        appContext: l
      } = e;
      if (t[0] !== '$') {
        const m = r[t];
        if (m !== void 0)
          switch (m) {
            case 1:
              return n[t];
            case 2:
              return i[t];
            case 4:
              return s[t];
            case 3:
              return o[t];
          }
        else {
          if (nc(n, t)) return ((r[t] = 1), n[t]);
          if (i !== Wt && qt(i, t)) return ((r[t] = 2), i[t]);
          if (qt(o, t)) return ((r[t] = 3), o[t]);
          if (s !== Wt && qt(s, t)) return ((r[t] = 4), s[t]);
          $c && (r[t] = 0);
        }
      }
      const c = No[t];
      let h, f;
      if (c) return (t === '$attrs' && Ie(e.attrs, 'get', ''), c(e));
      if ((h = a.__cssModules) && (h = h[t])) return h;
      if (s !== Wt && qt(s, t)) return ((r[t] = 4), s[t]);
      if (((f = l.config.globalProperties), qt(f, t))) return f[t];
    },
    set({ _: e }, t, s) {
      const { data: n, setupState: i, ctx: o } = e;
      return nc(i, t)
        ? ((i[t] = s), !0)
        : n !== Wt && qt(n, t)
          ? ((n[t] = s), !0)
          : qt(e.props, t) || (t[0] === '$' && t.slice(1) in e)
            ? !1
            : ((o[t] = s), !0);
    },
    has(
      { _: { data: e, setupState: t, accessCache: s, ctx: n, appContext: i, props: o, type: r } },
      a
    ) {
      let l;
      return !!(
        s[a] ||
        (e !== Wt && a[0] !== '$' && qt(e, a)) ||
        nc(t, a) ||
        qt(o, a) ||
        qt(n, a) ||
        qt(No, a) ||
        qt(i.config.globalProperties, a) ||
        ((l = r.__cssModules) && l[a])
      );
    },
    defineProperty(e, t, s) {
      return (
        s.get != null ? (e._.accessCache[t] = 0) : qt(s, 'value') && this.set(e, t, s.value, null),
        Reflect.defineProperty(e, t, s)
      );
    }
  };
function Ca(e) {
  return _t(e) ? e.reduce((t, s) => ((t[s] = null), t), {}) : e;
}
function _n(e, t) {
  return !e || !t ? e || t : _t(e) && _t(t) ? e.concat(t) : Pe({}, Ca(e), Ca(t));
}
let $c = !0;
function b0(e) {
  const t = Bm(e),
    s = e.proxy,
    n = e.ctx;
  (($c = !1), t.beforeCreate && Rh(t.beforeCreate, e, 'bc'));
  const {
    data: i,
    computed: o,
    methods: r,
    watch: a,
    provide: l,
    inject: c,
    created: h,
    beforeMount: f,
    mounted: m,
    beforeUpdate: g,
    updated: _,
    activated: y,
    deactivated: x,
    beforeDestroy: w,
    beforeUnmount: C,
    destroyed: T,
    unmounted: E,
    render: M,
    renderTracked: H,
    renderTriggered: $,
    errorCaptured: X,
    serverPrefetch: G,
    expose: et,
    inheritAttrs: ot,
    components: Z,
    directives: q,
    filters: dt
  } = t;
  if ((c && _0(c, n, null), r))
    for (const ht in r) {
      const ft = r[ht];
      Tt(ft) && (n[ht] = ft.bind(s));
    }
  if (i) {
    const ht = i.call(s, s);
    te(ht) && (e.data = Ga(ht));
  }
  if ((($c = !0), o))
    for (const ht in o) {
      const ft = o[ht],
        Vt = Tt(ft) ? ft.bind(s, s) : Tt(ft.get) ? ft.get.bind(s, s) : Ws,
        _e = !Tt(ft) && Tt(ft.set) ? ft.set.bind(s) : Ws,
        F = ls({ get: Vt, set: _e });
      Object.defineProperty(n, ht, {
        enumerable: !0,
        configurable: !0,
        get: () => F.value,
        set: (Ut) => (F.value = Ut)
      });
    }
  if (a) for (const ht in a) Fm(a[ht], n, s, ht);
  if (l) {
    const ht = Tt(l) ? l.call(s) : l;
    Reflect.ownKeys(ht).forEach((ft) => {
      da(ft, ht[ft]);
    });
  }
  h && Rh(h, e, 'c');
  function lt(ht, ft) {
    _t(ft) ? ft.forEach((Vt) => ht(Vt.bind(s))) : ft && ht(ft.bind(s));
  }
  if (
    (lt(o0, f),
    lt(to, m),
    lt(r0, g),
    lt(a0, _),
    lt(s0, y),
    lt(n0, x),
    lt(h0, X),
    lt(u0, H),
    lt(d0, $),
    lt(l0, C),
    lt(xd, E),
    lt(c0, G),
    _t(et))
  )
    if (et.length) {
      const ht = e.exposed || (e.exposed = {});
      et.forEach((ft) => {
        Object.defineProperty(ht, ft, {
          get: () => s[ft],
          set: (Vt) => (s[ft] = Vt),
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  (M && e.render === Ws && (e.render = M),
    ot != null && (e.inheritAttrs = ot),
    Z && (e.components = Z),
    q && (e.directives = q),
    G && Lm(e));
}
function _0(e, t, s = Ws) {
  _t(e) && (e = Fc(e));
  for (const n in e) {
    const i = e[n];
    let o;
    (te(i)
      ? 'default' in i
        ? (o = pn(i.from || n, i.default, !0))
        : (o = pn(i.from || n))
      : (o = pn(i)),
      Be(o)
        ? Object.defineProperty(t, n, {
            enumerable: !0,
            configurable: !0,
            get: () => o.value,
            set: (r) => (o.value = r)
          })
        : (t[n] = o));
  }
}
function Rh(e, t, s) {
  Xs(_t(e) ? e.map((n) => n.bind(t.proxy)) : e.bind(t.proxy), t, s);
}
function Fm(e, t, s, n) {
  let i = n.includes('.') ? Im(s, n) : () => s[n];
  if (xe(e)) {
    const o = t[e];
    Tt(o) && Mo(i, o);
  } else if (Tt(e)) Mo(i, e.bind(s));
  else if (te(e))
    if (_t(e)) e.forEach((o) => Fm(o, t, s, n));
    else {
      const o = Tt(e.handler) ? e.handler.bind(s) : t[e.handler];
      Tt(o) && Mo(i, o, e);
    }
}
function Bm(e) {
  const t = e.type,
    { mixins: s, extends: n } = t,
    {
      mixins: i,
      optionsCache: o,
      config: { optionMergeStrategies: r }
    } = e.appContext,
    a = o.get(t);
  let l;
  return (
    a
      ? (l = a)
      : !i.length && !s && !n
        ? (l = t)
        : ((l = {}), i.length && i.forEach((c) => Ta(l, c, r, !0)), Ta(l, t, r)),
    te(t) && o.set(t, l),
    l
  );
}
function Ta(e, t, s, n = !1) {
  const { mixins: i, extends: o } = t;
  (o && Ta(e, o, s, !0), i && i.forEach((r) => Ta(e, r, s, !0)));
  for (const r in t)
    if (!(n && r === 'expose')) {
      const a = y0[r] || (s && s[r]);
      e[r] = a ? a(e[r], t[r]) : t[r];
    }
  return e;
}
const y0 = {
  data: Dh,
  props: Mh,
  emits: Mh,
  methods: wo,
  computed: wo,
  beforeCreate: We,
  created: We,
  beforeMount: We,
  mounted: We,
  beforeUpdate: We,
  updated: We,
  beforeDestroy: We,
  beforeUnmount: We,
  destroyed: We,
  unmounted: We,
  activated: We,
  deactivated: We,
  errorCaptured: We,
  serverPrefetch: We,
  components: wo,
  directives: wo,
  watch: x0,
  provide: Dh,
  inject: v0
};
function Dh(e, t) {
  return t
    ? e
      ? function () {
          return Pe(Tt(e) ? e.call(this, this) : e, Tt(t) ? t.call(this, this) : t);
        }
      : t
    : e;
}
function v0(e, t) {
  return wo(Fc(e), Fc(t));
}
function Fc(e) {
  if (_t(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++) t[e[s]] = e[s];
    return t;
  }
  return e;
}
function We(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function wo(e, t) {
  return e ? Pe(Object.create(null), e, t) : t;
}
function Mh(e, t) {
  return e
    ? _t(e) && _t(t)
      ? [...new Set([...e, ...t])]
      : Pe(Object.create(null), Ca(e), Ca(t ?? {}))
    : t;
}
function x0(e, t) {
  if (!e) return t;
  if (!t) return e;
  const s = Pe(Object.create(null), e);
  for (const n in t) s[n] = We(e[n], t[n]);
  return s;
}
function Um() {
  return {
    app: null,
    config: {
      isNativeTag: im,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache: new WeakMap()
  };
}
let w0 = 0;
function S0(e, t) {
  return function (n, i = null) {
    (Tt(n) || (n = Pe({}, n)), i != null && !te(i) && (i = null));
    const o = Um(),
      r = new WeakSet(),
      a = [];
    let l = !1;
    const c = (o.app = {
      _uid: w0++,
      _component: n,
      _props: i,
      _container: null,
      _context: o,
      _instance: null,
      version: lg,
      get config() {
        return o.config;
      },
      set config(h) {},
      use(h, ...f) {
        return (
          r.has(h) ||
            (h && Tt(h.install) ? (r.add(h), h.install(c, ...f)) : Tt(h) && (r.add(h), h(c, ...f))),
          c
        );
      },
      mixin(h) {
        return (o.mixins.includes(h) || o.mixins.push(h), c);
      },
      component(h, f) {
        return f ? ((o.components[h] = f), c) : o.components[h];
      },
      directive(h, f) {
        return f ? ((o.directives[h] = f), c) : o.directives[h];
      },
      mount(h, f, m) {
        if (!l) {
          const g = c._ceVNode || Rt(n, i);
          return (
            (g.appContext = o),
            m === !0 ? (m = 'svg') : m === !1 && (m = void 0),
            e(g, h, m),
            (l = !0),
            (c._container = h),
            (h.__vue_app__ = c),
            el(g.component)
          );
        }
      },
      onUnmount(h) {
        a.push(h);
      },
      unmount() {
        l && (Xs(a, c._instance, 16), e(null, c._container), delete c._container.__vue_app__);
      },
      provide(h, f) {
        return ((o.provides[h] = f), c);
      },
      runWithContext(h) {
        const f = Vi;
        Vi = c;
        try {
          return h();
        } finally {
          Vi = f;
        }
      }
    });
    return c;
  };
}
let Vi = null;
function hr(e, t, s = Wt) {
  const n = og(),
    i = us(t),
    o = Fn(t),
    r = jm(e, i),
    a = jv((l, c) => {
      let h,
        f = Wt,
        m;
      return (
        Jv(() => {
          const g = e[i];
          Qe(h, g) && ((h = g), c());
        }),
        {
          get() {
            return (l(), s.get ? s.get(h) : h);
          },
          set(g) {
            const _ = s.set ? s.set(g) : g;
            if (!Qe(_, h) && !(f !== Wt && Qe(g, f))) return;
            const y = n.vnode.props;
            ((y &&
              (t in y || i in y || o in y) &&
              (`onUpdate:${t}` in y || `onUpdate:${i}` in y || `onUpdate:${o}` in y)) ||
              ((h = g), c()),
              n.emit(`update:${t}`, _),
              Qe(g, _) && Qe(g, f) && !Qe(_, m) && c(),
              (f = g),
              (m = _));
          }
        }
      );
    });
  return (
    (a[Symbol.iterator] = () => {
      let l = 0;
      return {
        next() {
          return l < 2 ? { value: l++ ? r || Wt : a, done: !1 } : { done: !0 };
        }
      };
    }),
    a
  );
}
const jm = (e, t) =>
  t === 'modelValue' || t === 'model-value'
    ? e.modelModifiers
    : e[`${t}Modifiers`] || e[`${us(t)}Modifiers`] || e[`${Fn(t)}Modifiers`];
function k0(e, t, ...s) {
  if (e.isUnmounted) return;
  const n = e.vnode.props || Wt;
  let i = s;
  const o = t.startsWith('update:'),
    r = o && jm(n, t.slice(7));
  r && (r.trim && (i = s.map((h) => (xe(h) ? h.trim() : h))), r.number && (i = s.map(za)));
  let a,
    l = n[(a = Zl(t))] || n[(a = Zl(us(t)))];
  (!l && o && (l = n[(a = Zl(Fn(t)))]), l && Xs(l, e, 6, i));
  const c = n[a + 'Once'];
  if (c) {
    if (!e.emitted) e.emitted = {};
    else if (e.emitted[a]) return;
    ((e.emitted[a] = !0), Xs(c, e, 6, i));
  }
}
const C0 = new WeakMap();
function Vm(e, t, s = !1) {
  const n = s ? C0 : t.emitsCache,
    i = n.get(e);
  if (i !== void 0) return i;
  const o = e.emits;
  let r = {},
    a = !1;
  if (!Tt(e)) {
    const l = (c) => {
      const h = Vm(c, t, !0);
      h && ((a = !0), Pe(r, h));
    };
    (!s && t.mixins.length && t.mixins.forEach(l),
      e.extends && l(e.extends),
      e.mixins && e.mixins.forEach(l));
  }
  return !o && !a
    ? (te(e) && n.set(e, null), null)
    : (_t(o) ? o.forEach((l) => (r[l] = null)) : Pe(r, o), te(e) && n.set(e, r), r);
}
function Qa(e, t) {
  return !e || !ja(t)
    ? !1
    : ((t = t.slice(2).replace(/Once$/, '')),
      qt(e, t[0].toLowerCase() + t.slice(1)) || qt(e, Fn(t)) || qt(e, t));
}
function Ih(e) {
  const {
      type: t,
      vnode: s,
      proxy: n,
      withProxy: i,
      propsOptions: [o],
      slots: r,
      attrs: a,
      emit: l,
      render: c,
      renderCache: h,
      props: f,
      data: m,
      setupState: g,
      ctx: _,
      inheritAttrs: y
    } = e,
    x = Sa(e);
  let w, C;
  try {
    if (s.shapeFlag & 4) {
      const E = i || n,
        M = E;
      ((w = zs(c.call(M, E, h, f, g, m, _))), (C = a));
    } else {
      const E = t;
      ((w = zs(E.length > 1 ? E(f, { attrs: a, slots: r, emit: l }) : E(f, null))),
        (C = t.props ? a : T0(a)));
    }
  } catch (E) {
    (($o.length = 0), Xa(E, e, 1), (w = Rt(Ln)));
  }
  let T = w;
  if (C && y !== !1) {
    const E = Object.keys(C),
      { shapeFlag: M } = T;
    E.length && M & 7 && (o && E.some(ad) && (C = A0(C, o)), (T = Ki(T, C, !1, !0)));
  }
  return (
    s.dirs && ((T = Ki(T, null, !1, !0)), (T.dirs = T.dirs ? T.dirs.concat(s.dirs) : s.dirs)),
    s.transition && vd(T, s.transition),
    (w = T),
    Sa(x),
    w
  );
}
const T0 = (e) => {
    let t;
    for (const s in e) (s === 'class' || s === 'style' || ja(s)) && ((t || (t = {}))[s] = e[s]);
    return t;
  },
  A0 = (e, t) => {
    const s = {};
    for (const n in e) (!ad(n) || !(n.slice(9) in t)) && (s[n] = e[n]);
    return s;
  };
function P0(e, t, s) {
  const { props: n, children: i, component: o } = e,
    { props: r, children: a, patchFlag: l } = t,
    c = o.emitsOptions;
  if (t.dirs || t.transition) return !0;
  if (s && l >= 0) {
    if (l & 1024) return !0;
    if (l & 16) return n ? Lh(n, r, c) : !!r;
    if (l & 8) {
      const h = t.dynamicProps;
      for (let f = 0; f < h.length; f++) {
        const m = h[f];
        if (Hm(r, n, m) && !Qa(c, m)) return !0;
      }
    }
  } else
    return (i || a) && (!a || !a.$stable) ? !0 : n === r ? !1 : n ? (r ? Lh(n, r, c) : !0) : !!r;
  return !1;
}
function Lh(e, t, s) {
  const n = Object.keys(t);
  if (n.length !== Object.keys(e).length) return !0;
  for (let i = 0; i < n.length; i++) {
    const o = n[i];
    if (Hm(t, e, o) && !Qa(s, o)) return !0;
  }
  return !1;
}
function Hm(e, t, s) {
  const n = e[s],
    i = t[s];
  return s === 'style' && te(n) && te(i) ? !In(n, i) : n !== i;
}
function O0({ vnode: e, parent: t }, s) {
  for (; t; ) {
    const n = t.subTree;
    if ((n.suspense && n.suspense.activeBranch === e && (n.el = e.el), n === e))
      (((e = t.vnode).el = s), (t = t.parent));
    else break;
  }
}
const zm = {},
  Wm = () => Object.create(zm),
  Km = (e) => Object.getPrototypeOf(e) === zm;
function E0(e, t, s, n = !1) {
  const i = {},
    o = Wm();
  ((e.propsDefaults = Object.create(null)), qm(e, t, i, o));
  for (const r in e.propsOptions[0]) r in i || (i[r] = void 0);
  (s ? (e.props = n ? i : Tm(i)) : e.type.props ? (e.props = i) : (e.props = o), (e.attrs = o));
}
function R0(e, t, s, n) {
  const {
      props: i,
      attrs: o,
      vnode: { patchFlag: r }
    } = e,
    a = Bt(i),
    [l] = e.propsOptions;
  let c = !1;
  if ((n || r > 0) && !(r & 16)) {
    if (r & 8) {
      const h = e.vnode.dynamicProps;
      for (let f = 0; f < h.length; f++) {
        let m = h[f];
        if (Qa(e.emitsOptions, m)) continue;
        const g = t[m];
        if (l)
          if (qt(o, m)) g !== o[m] && ((o[m] = g), (c = !0));
          else {
            const _ = us(m);
            i[_] = Bc(l, a, _, g, e, !1);
          }
        else g !== o[m] && ((o[m] = g), (c = !0));
      }
    }
  } else {
    qm(e, t, i, o) && (c = !0);
    let h;
    for (const f in a)
      (!t || (!qt(t, f) && ((h = Fn(f)) === f || !qt(t, h)))) &&
        (l
          ? s && (s[f] !== void 0 || s[h] !== void 0) && (i[f] = Bc(l, a, f, void 0, e, !0))
          : delete i[f]);
    if (o !== a) for (const f in o) (!t || !qt(t, f)) && (delete o[f], (c = !0));
  }
  c && ln(e.attrs, 'set', '');
}
function qm(e, t, s, n) {
  const [i, o] = e.propsOptions;
  let r = !1,
    a;
  if (t)
    for (let l in t) {
      if (Oo(l)) continue;
      const c = t[l];
      let h;
      i && qt(i, (h = us(l)))
        ? !o || !o.includes(h)
          ? (s[h] = c)
          : ((a || (a = {}))[h] = c)
        : Qa(e.emitsOptions, l) || ((!(l in n) || c !== n[l]) && ((n[l] = c), (r = !0)));
    }
  if (o) {
    const l = Bt(s),
      c = a || Wt;
    for (let h = 0; h < o.length; h++) {
      const f = o[h];
      s[f] = Bc(i, l, f, c[f], e, !qt(c, f));
    }
  }
  return r;
}
function Bc(e, t, s, n, i, o) {
  const r = e[s];
  if (r != null) {
    const a = qt(r, 'default');
    if (a && n === void 0) {
      const l = r.default;
      if (r.type !== Function && !r.skipFactory && Tt(l)) {
        const { propsDefaults: c } = i;
        if (s in c) n = c[s];
        else {
          const h = fr(i);
          ((n = c[s] = l.call(null, t)), h());
        }
      } else n = l;
      i.ce && i.ce._setProp(s, n);
    }
    r[0] && (o && !a ? (n = !1) : r[1] && (n === '' || n === Fn(s)) && (n = !0));
  }
  return n;
}
const D0 = new WeakMap();
function Gm(e, t, s = !1) {
  const n = s ? D0 : t.propsCache,
    i = n.get(e);
  if (i) return i;
  const o = e.props,
    r = {},
    a = [];
  let l = !1;
  if (!Tt(e)) {
    const h = (f) => {
      l = !0;
      const [m, g] = Gm(f, t, !0);
      (Pe(r, m), g && a.push(...g));
    };
    (!s && t.mixins.length && t.mixins.forEach(h),
      e.extends && h(e.extends),
      e.mixins && e.mixins.forEach(h));
  }
  if (!o && !l) return (te(e) && n.set(e, Bi), Bi);
  if (_t(o))
    for (let h = 0; h < o.length; h++) {
      const f = us(o[h]);
      Nh(f) && (r[f] = Wt);
    }
  else if (o)
    for (const h in o) {
      const f = us(h);
      if (Nh(f)) {
        const m = o[h],
          g = (r[f] = _t(m) || Tt(m) ? { type: m } : Pe({}, m)),
          _ = g.type;
        let y = !1,
          x = !0;
        if (_t(_))
          for (let w = 0; w < _.length; ++w) {
            const C = _[w],
              T = Tt(C) && C.name;
            if (T === 'Boolean') {
              y = !0;
              break;
            } else T === 'String' && (x = !1);
          }
        else y = Tt(_) && _.name === 'Boolean';
        ((g[0] = y), (g[1] = x), (y || qt(g, 'default')) && a.push(f));
      }
    }
  const c = [r, a];
  return (te(e) && n.set(e, c), c);
}
function Nh(e) {
  return e[0] !== '$' && !Oo(e);
}
const wd = (e) => e === '_' || e === '_ctx' || e === '$stable',
  Sd = (e) => (_t(e) ? e.map(zs) : [zs(e)]),
  M0 = (e, t, s) => {
    if (t._n) return t;
    const n = Do((...i) => Sd(t(...i)), s);
    return ((n._c = !1), n);
  },
  Xm = (e, t, s) => {
    const n = e._ctx;
    for (const i in e) {
      if (wd(i)) continue;
      const o = e[i];
      if (Tt(o)) t[i] = M0(i, o, n);
      else if (o != null) {
        const r = Sd(o);
        t[i] = () => r;
      }
    }
  },
  Ym = (e, t) => {
    const s = Sd(t);
    e.slots.default = () => s;
  },
  Jm = (e, t, s) => {
    for (const n in t) (s || !wd(n)) && (e[n] = t[n]);
  },
  I0 = (e, t, s) => {
    const n = (e.slots = Wm());
    if (e.vnode.shapeFlag & 32) {
      const i = t._;
      i ? (Jm(n, t, s), s && lm(n, '_', i, !0)) : Xm(t, n);
    } else t && Ym(e, t);
  },
  L0 = (e, t, s) => {
    const { vnode: n, slots: i } = e;
    let o = !0,
      r = Wt;
    if (n.shapeFlag & 32) {
      const a = t._;
      (a ? (s && a === 1 ? (o = !1) : Jm(i, t, s)) : ((o = !t.$stable), Xm(t, i)), (r = t));
    } else t && (Ym(e, t), (r = { default: 1 }));
    if (o) for (const a in i) !wd(a) && r[a] == null && delete i[a];
  },
  Xe = U0;
function N0(e) {
  return $0(e);
}
function $0(e, t) {
  const s = Wa();
  s.__VUE__ = !0;
  const {
      insert: n,
      remove: i,
      patchProp: o,
      createElement: r,
      createText: a,
      createComment: l,
      setText: c,
      setElementText: h,
      parentNode: f,
      nextSibling: m,
      setScopeId: g = Ws,
      insertStaticContent: _
    } = e,
    y = (S, k, O, V = null, z = null, j = null, tt = void 0, Q = null, Y = !!k.dynamicChildren) => {
      if (S === k) return;
      (S && !ho(S, k) && ((V = U(S)), Ut(S, z, j, !0), (S = null)),
        k.patchFlag === -2 && ((Y = !1), (k.dynamicChildren = null)));
      const { type: K, ref: gt, shapeFlag: nt } = k;
      switch (K) {
        case tl:
          x(S, k, O, V);
          break;
        case Ln:
          w(S, k, O, V);
          break;
        case ua:
          S == null && C(k, O, V, tt);
          break;
        case ne:
          Z(S, k, O, V, z, j, tt, Q, Y);
          break;
        default:
          nt & 1
            ? M(S, k, O, V, z, j, tt, Q, Y)
            : nt & 6
              ? q(S, k, O, V, z, j, tt, Q, Y)
              : (nt & 64 || nt & 128) && K.process(S, k, O, V, z, j, tt, Q, Y, ut);
      }
      gt != null && z
        ? Io(gt, S && S.ref, j, k || S, !k)
        : gt == null && S && S.ref != null && Io(S.ref, null, j, S, !0);
    },
    x = (S, k, O, V) => {
      if (S == null) n((k.el = a(k.children)), O, V);
      else {
        const z = (k.el = S.el);
        k.children !== S.children && c(z, k.children);
      }
    },
    w = (S, k, O, V) => {
      S == null ? n((k.el = l(k.children || '')), O, V) : (k.el = S.el);
    },
    C = (S, k, O, V) => {
      [S.el, S.anchor] = _(S.children, k, O, V, S.el, S.anchor);
    },
    T = ({ el: S, anchor: k }, O, V) => {
      let z;
      for (; S && S !== k; ) ((z = m(S)), n(S, O, V), (S = z));
      n(k, O, V);
    },
    E = ({ el: S, anchor: k }) => {
      let O;
      for (; S && S !== k; ) ((O = m(S)), i(S), (S = O));
      i(k);
    },
    M = (S, k, O, V, z, j, tt, Q, Y) => {
      if ((k.type === 'svg' ? (tt = 'svg') : k.type === 'math' && (tt = 'mathml'), S == null))
        H(k, O, V, z, j, tt, Q, Y);
      else {
        const K = S.el && S.el._isVueCE ? S.el : null;
        try {
          (K && K._beginPatch(), G(S, k, z, j, tt, Q, Y));
        } finally {
          K && K._endPatch();
        }
      }
    },
    H = (S, k, O, V, z, j, tt, Q) => {
      let Y, K;
      const { props: gt, shapeFlag: nt, transition: pt, dirs: yt } = S;
      if (
        ((Y = S.el = r(S.type, j, gt && gt.is, gt)),
        nt & 8 ? h(Y, S.children) : nt & 16 && X(S.children, Y, null, V, z, ic(S, j), tt, Q),
        yt && Yn(S, null, V, 'created'),
        $(Y, S, S.scopeId, tt, V),
        gt)
      ) {
        for (const Xt in gt) Xt !== 'value' && !Oo(Xt) && o(Y, Xt, null, gt[Xt], j, V);
        ('value' in gt && o(Y, 'value', null, gt.value, j),
          (K = gt.onVnodeBeforeMount) && Fs(K, V, S));
      }
      yt && Yn(S, null, V, 'beforeMount');
      const Ct = F0(z, pt);
      (Ct && pt.beforeEnter(Y),
        n(Y, k, O),
        ((K = gt && gt.onVnodeMounted) || Ct || yt) &&
          Xe(() => {
            (K && Fs(K, V, S), Ct && pt.enter(Y), yt && Yn(S, null, V, 'mounted'));
          }, z));
    },
    $ = (S, k, O, V, z) => {
      if ((O && g(S, O), V)) for (let j = 0; j < V.length; j++) g(S, V[j]);
      if (z) {
        let j = z.subTree;
        if (k === j || (eg(j.type) && (j.ssContent === k || j.ssFallback === k))) {
          const tt = z.vnode;
          $(S, tt, tt.scopeId, tt.slotScopeIds, z.parent);
        }
      }
    },
    X = (S, k, O, V, z, j, tt, Q, Y = 0) => {
      for (let K = Y; K < S.length; K++) {
        const gt = (S[K] = Q ? rn(S[K]) : zs(S[K]));
        y(null, gt, k, O, V, z, j, tt, Q);
      }
    },
    G = (S, k, O, V, z, j, tt) => {
      const Q = (k.el = S.el);
      let { patchFlag: Y, dynamicChildren: K, dirs: gt } = k;
      Y |= S.patchFlag & 16;
      const nt = S.props || Wt,
        pt = k.props || Wt;
      let yt;
      if (
        (O && Jn(O, !1),
        (yt = pt.onVnodeBeforeUpdate) && Fs(yt, O, k, S),
        gt && Yn(k, S, O, 'beforeUpdate'),
        O && Jn(O, !0),
        ((nt.innerHTML && pt.innerHTML == null) || (nt.textContent && pt.textContent == null)) &&
          h(Q, ''),
        K
          ? et(S.dynamicChildren, K, Q, O, V, ic(k, z), j)
          : tt || ft(S, k, Q, null, O, V, ic(k, z), j, !1),
        Y > 0)
      ) {
        if (Y & 16) ot(Q, nt, pt, O, z);
        else if (
          (Y & 2 && nt.class !== pt.class && o(Q, 'class', null, pt.class, z),
          Y & 4 && o(Q, 'style', nt.style, pt.style, z),
          Y & 8)
        ) {
          const Ct = k.dynamicProps;
          for (let Xt = 0; Xt < Ct.length; Xt++) {
            const Ht = Ct[Xt],
              De = nt[Ht],
              ye = pt[Ht];
            (ye !== De || Ht === 'value') && o(Q, Ht, De, ye, z, O);
          }
        }
        Y & 1 && S.children !== k.children && h(Q, k.children);
      } else !tt && K == null && ot(Q, nt, pt, O, z);
      ((yt = pt.onVnodeUpdated) || gt) &&
        Xe(() => {
          (yt && Fs(yt, O, k, S), gt && Yn(k, S, O, 'updated'));
        }, V);
    },
    et = (S, k, O, V, z, j, tt) => {
      for (let Q = 0; Q < k.length; Q++) {
        const Y = S[Q],
          K = k[Q],
          gt = Y.el && (Y.type === ne || !ho(Y, K) || Y.shapeFlag & 198) ? f(Y.el) : O;
        y(Y, K, gt, null, V, z, j, tt, !0);
      }
    },
    ot = (S, k, O, V, z) => {
      if (k !== O) {
        if (k !== Wt) for (const j in k) !Oo(j) && !(j in O) && o(S, j, k[j], null, z, V);
        for (const j in O) {
          if (Oo(j)) continue;
          const tt = O[j],
            Q = k[j];
          tt !== Q && j !== 'value' && o(S, j, Q, tt, z, V);
        }
        'value' in O && o(S, 'value', k.value, O.value, z);
      }
    },
    Z = (S, k, O, V, z, j, tt, Q, Y) => {
      const K = (k.el = S ? S.el : a('')),
        gt = (k.anchor = S ? S.anchor : a(''));
      let { patchFlag: nt, dynamicChildren: pt, slotScopeIds: yt } = k;
      (yt && (Q = Q ? Q.concat(yt) : yt),
        S == null
          ? (n(K, O, V), n(gt, O, V), X(k.children || [], O, gt, z, j, tt, Q, Y))
          : nt > 0 && nt & 64 && pt && S.dynamicChildren && S.dynamicChildren.length === pt.length
            ? (et(S.dynamicChildren, pt, O, z, j, tt, Q),
              (k.key != null || (z && k === z.subTree)) && Zm(S, k, !0))
            : ft(S, k, O, gt, z, j, tt, Q, Y));
    },
    q = (S, k, O, V, z, j, tt, Q, Y) => {
      ((k.slotScopeIds = Q),
        S == null
          ? k.shapeFlag & 512
            ? z.ctx.activate(k, O, V, tt, Y)
            : dt(k, O, V, z, j, tt, Y)
          : At(S, k, Y));
    },
    dt = (S, k, O, V, z, j, tt) => {
      const Q = (S.component = q0(S, V, z));
      if ((Nm(S) && (Q.ctx.renderer = ut), G0(Q, !1, tt), Q.asyncDep)) {
        if ((z && z.registerDep(Q, lt, tt), !S.el)) {
          const Y = (Q.subTree = Rt(Ln));
          (w(null, Y, k, O), (S.placeholder = Y.el));
        }
      } else lt(Q, S, k, O, z, j, tt);
    },
    At = (S, k, O) => {
      const V = (k.component = S.component);
      if (P0(S, k, O))
        if (V.asyncDep && !V.asyncResolved) {
          ht(V, k, O);
          return;
        } else ((V.next = k), V.update());
      else ((k.el = S.el), (V.vnode = k));
    },
    lt = (S, k, O, V, z, j, tt) => {
      const Q = () => {
        if (S.isMounted) {
          let { next: nt, bu: pt, u: yt, parent: Ct, vnode: Xt } = S;
          {
            const Ee = Qm(S);
            if (Ee) {
              (nt && ((nt.el = Xt.el), ht(S, nt, tt)),
                Ee.asyncDep.then(() => {
                  Xe(() => {
                    S.isUnmounted || K();
                  }, z);
                }));
              return;
            }
          }
          let Ht = nt,
            De;
          (Jn(S, !1),
            nt ? ((nt.el = Xt.el), ht(S, nt, tt)) : (nt = Xt),
            pt && ca(pt),
            (De = nt.props && nt.props.onVnodeBeforeUpdate) && Fs(De, Ct, nt, Xt),
            Jn(S, !0));
          const ye = Ih(S),
            Oe = S.subTree;
          ((S.subTree = ye),
            y(Oe, ye, f(Oe.el), U(Oe), S, z, j),
            (nt.el = ye.el),
            Ht === null && O0(S, ye.el),
            yt && Xe(yt, z),
            (De = nt.props && nt.props.onVnodeUpdated) && Xe(() => Fs(De, Ct, nt, Xt), z));
        } else {
          let nt;
          const { el: pt, props: yt } = k,
            { bm: Ct, m: Xt, parent: Ht, root: De, type: ye } = S,
            Oe = Lo(k);
          (Jn(S, !1),
            Ct && ca(Ct),
            !Oe && (nt = yt && yt.onVnodeBeforeMount) && Fs(nt, Ht, k),
            Jn(S, !0));
          {
            De.ce && De.ce._hasShadowRoot() && De.ce._injectChildStyle(ye);
            const Ee = (S.subTree = Ih(S));
            (y(null, Ee, O, V, S, z, j), (k.el = Ee.el));
          }
          if ((Xt && Xe(Xt, z), !Oe && (nt = yt && yt.onVnodeMounted))) {
            const Ee = k;
            Xe(() => Fs(nt, Ht, Ee), z);
          }
          ((k.shapeFlag & 256 || (Ht && Lo(Ht.vnode) && Ht.vnode.shapeFlag & 256)) &&
            S.a &&
            Xe(S.a, z),
            (S.isMounted = !0),
            (k = O = V = null));
        }
      };
      S.scope.on();
      const Y = (S.effect = new hm(Q));
      S.scope.off();
      const K = (S.update = Y.run.bind(Y)),
        gt = (S.job = Y.runIfDirty.bind(Y));
      ((gt.i = S), (gt.id = S.uid), (Y.scheduler = () => _d(gt)), Jn(S, !0), K());
    },
    ht = (S, k, O) => {
      k.component = S;
      const V = S.vnode.props;
      ((S.vnode = k),
        (S.next = null),
        R0(S, k.props, V, O),
        L0(S, k.children, O),
        mn(),
        Ah(S),
        gn());
    },
    ft = (S, k, O, V, z, j, tt, Q, Y = !1) => {
      const K = S && S.children,
        gt = S ? S.shapeFlag : 0,
        nt = k.children,
        { patchFlag: pt, shapeFlag: yt } = k;
      if (pt > 0) {
        if (pt & 128) {
          _e(K, nt, O, V, z, j, tt, Q, Y);
          return;
        } else if (pt & 256) {
          Vt(K, nt, O, V, z, j, tt, Q, Y);
          return;
        }
      }
      yt & 8
        ? (gt & 16 && re(K, z, j), nt !== K && h(O, nt))
        : gt & 16
          ? yt & 16
            ? _e(K, nt, O, V, z, j, tt, Q, Y)
            : re(K, z, j, !0)
          : (gt & 8 && h(O, ''), yt & 16 && X(nt, O, V, z, j, tt, Q, Y));
    },
    Vt = (S, k, O, V, z, j, tt, Q, Y) => {
      ((S = S || Bi), (k = k || Bi));
      const K = S.length,
        gt = k.length,
        nt = Math.min(K, gt);
      let pt;
      for (pt = 0; pt < nt; pt++) {
        const yt = (k[pt] = Y ? rn(k[pt]) : zs(k[pt]));
        y(S[pt], yt, O, null, z, j, tt, Q, Y);
      }
      K > gt ? re(S, z, j, !0, !1, nt) : X(k, O, V, z, j, tt, Q, Y, nt);
    },
    _e = (S, k, O, V, z, j, tt, Q, Y) => {
      let K = 0;
      const gt = k.length;
      let nt = S.length - 1,
        pt = gt - 1;
      for (; K <= nt && K <= pt; ) {
        const yt = S[K],
          Ct = (k[K] = Y ? rn(k[K]) : zs(k[K]));
        if (ho(yt, Ct)) y(yt, Ct, O, null, z, j, tt, Q, Y);
        else break;
        K++;
      }
      for (; K <= nt && K <= pt; ) {
        const yt = S[nt],
          Ct = (k[pt] = Y ? rn(k[pt]) : zs(k[pt]));
        if (ho(yt, Ct)) y(yt, Ct, O, null, z, j, tt, Q, Y);
        else break;
        (nt--, pt--);
      }
      if (K > nt) {
        if (K <= pt) {
          const yt = pt + 1,
            Ct = yt < gt ? k[yt].el : V;
          for (; K <= pt; ) (y(null, (k[K] = Y ? rn(k[K]) : zs(k[K])), O, Ct, z, j, tt, Q, Y), K++);
        }
      } else if (K > pt) for (; K <= nt; ) (Ut(S[K], z, j, !0), K++);
      else {
        const yt = K,
          Ct = K,
          Xt = new Map();
        for (K = Ct; K <= pt; K++) {
          const Re = (k[K] = Y ? rn(k[K]) : zs(k[K]));
          Re.key != null && Xt.set(Re.key, K);
        }
        let Ht,
          De = 0;
        const ye = pt - Ct + 1;
        let Oe = !1,
          Ee = 0;
        const Ms = new Array(ye);
        for (K = 0; K < ye; K++) Ms[K] = 0;
        for (K = yt; K <= nt; K++) {
          const Re = S[K];
          if (De >= ye) {
            Ut(Re, z, j, !0);
            continue;
          }
          let hs;
          if (Re.key != null) hs = Xt.get(Re.key);
          else
            for (Ht = Ct; Ht <= pt; Ht++)
              if (Ms[Ht - Ct] === 0 && ho(Re, k[Ht])) {
                hs = Ht;
                break;
              }
          hs === void 0
            ? Ut(Re, z, j, !0)
            : ((Ms[hs - Ct] = K + 1),
              hs >= Ee ? (Ee = hs) : (Oe = !0),
              y(Re, k[hs], O, null, z, j, tt, Q, Y),
              De++);
        }
        const wr = Oe ? B0(Ms) : Bi;
        for (Ht = wr.length - 1, K = ye - 1; K >= 0; K--) {
          const Re = Ct + K,
            hs = k[Re],
            Sr = k[Re + 1],
            kr = Re + 1 < gt ? Sr.el || tg(Sr) : V;
          Ms[K] === 0
            ? y(null, hs, O, kr, z, j, tt, Q, Y)
            : Oe && (Ht < 0 || K !== wr[Ht] ? F(hs, O, kr, 2) : Ht--);
        }
      }
    },
    F = (S, k, O, V, z = null) => {
      const { el: j, type: tt, transition: Q, children: Y, shapeFlag: K } = S;
      if (K & 6) {
        F(S.component.subTree, k, O, V);
        return;
      }
      if (K & 128) {
        S.suspense.move(k, O, V);
        return;
      }
      if (K & 64) {
        tt.move(S, k, O, ut);
        return;
      }
      if (tt === ne) {
        n(j, k, O);
        for (let nt = 0; nt < Y.length; nt++) F(Y[nt], k, O, V);
        n(S.anchor, k, O);
        return;
      }
      if (tt === ua) {
        T(S, k, O);
        return;
      }
      if (V !== 2 && K & 1 && Q)
        if (V === 0) (Q.beforeEnter(j), n(j, k, O), Xe(() => Q.enter(j), z));
        else {
          const { leave: nt, delayLeave: pt, afterLeave: yt } = Q,
            Ct = () => {
              S.ctx.isUnmounted ? i(j) : n(j, k, O);
            },
            Xt = () => {
              (j._isLeaving && j[e0](!0),
                nt(j, () => {
                  (Ct(), yt && yt());
                }));
            };
          pt ? pt(j, Ct, Xt) : Xt();
        }
      else n(j, k, O);
    },
    Ut = (S, k, O, V = !1, z = !1) => {
      const {
        type: j,
        props: tt,
        ref: Q,
        children: Y,
        dynamicChildren: K,
        shapeFlag: gt,
        patchFlag: nt,
        dirs: pt,
        cacheIndex: yt
      } = S;
      if (
        (nt === -2 && (z = !1),
        Q != null && (mn(), Io(Q, null, O, S, !0), gn()),
        yt != null && (k.renderCache[yt] = void 0),
        gt & 256)
      ) {
        k.ctx.deactivate(S);
        return;
      }
      const Ct = gt & 1 && pt,
        Xt = !Lo(S);
      let Ht;
      if ((Xt && (Ht = tt && tt.onVnodeBeforeUnmount) && Fs(Ht, k, S), gt & 6))
        oe(S.component, O, V);
      else {
        if (gt & 128) {
          S.suspense.unmount(O, V);
          return;
        }
        (Ct && Yn(S, null, k, 'beforeUnmount'),
          gt & 64
            ? S.type.remove(S, k, O, ut, V)
            : K && !K.hasOnce && (j !== ne || (nt > 0 && nt & 64))
              ? re(K, k, O, !1, !0)
              : ((j === ne && nt & 384) || (!z && gt & 16)) && re(Y, k, O),
          V && Se(S));
      }
      ((Xt && (Ht = tt && tt.onVnodeUnmounted)) || Ct) &&
        Xe(() => {
          (Ht && Fs(Ht, k, S), Ct && Yn(S, null, k, 'unmounted'));
        }, O);
    },
    Se = (S) => {
      const { type: k, el: O, anchor: V, transition: z } = S;
      if (k === ne) {
        ue(O, V);
        return;
      }
      if (k === ua) {
        E(S);
        return;
      }
      const j = () => {
        (i(O), z && !z.persisted && z.afterLeave && z.afterLeave());
      };
      if (S.shapeFlag & 1 && z && !z.persisted) {
        const { leave: tt, delayLeave: Q } = z,
          Y = () => tt(O, j);
        Q ? Q(S.el, j, Y) : Y();
      } else j();
    },
    ue = (S, k) => {
      let O;
      for (; S !== k; ) ((O = m(S)), i(S), (S = O));
      i(k);
    },
    oe = (S, k, O) => {
      const { bum: V, scope: z, job: j, subTree: tt, um: Q, m: Y, a: K } = S;
      ($h(Y),
        $h(K),
        V && ca(V),
        z.stop(),
        j && ((j.flags |= 8), Ut(tt, S, k, O)),
        Q && Xe(Q, k),
        Xe(() => {
          S.isUnmounted = !0;
        }, k));
    },
    re = (S, k, O, V = !1, z = !1, j = 0) => {
      for (let tt = j; tt < S.length; tt++) Ut(S[tt], k, O, V, z);
    },
    U = (S) => {
      if (S.shapeFlag & 6) return U(S.component.subTree);
      if (S.shapeFlag & 128) return S.suspense.next();
      const k = m(S.anchor || S.el),
        O = k && k[Qv];
      return O ? m(O) : k;
    };
  let it = !1;
  const B = (S, k, O) => {
      let V;
      (S == null
        ? k._vnode && (Ut(k._vnode, null, null, !0), (V = k._vnode.component))
        : y(k._vnode || null, S, k, null, null, null, O),
        (k._vnode = S),
        it || ((it = !0), Ah(V), Rm(), (it = !1)));
    },
    ut = { p: y, um: Ut, m: F, r: Se, mt: dt, mc: X, pc: ft, pbc: et, n: U, o: e };
  return { render: B, hydrate: void 0, createApp: S0(B) };
}
function ic({ type: e, props: t }, s) {
  return (s === 'svg' && e === 'foreignObject') ||
    (s === 'mathml' && e === 'annotation-xml' && t && t.encoding && t.encoding.includes('html'))
    ? void 0
    : s;
}
function Jn({ effect: e, job: t }, s) {
  s ? ((e.flags |= 32), (t.flags |= 4)) : ((e.flags &= -33), (t.flags &= -5));
}
function F0(e, t) {
  return (!e || (e && !e.pendingBranch)) && t && !t.persisted;
}
function Zm(e, t, s = !1) {
  const n = e.children,
    i = t.children;
  if (_t(n) && _t(i))
    for (let o = 0; o < n.length; o++) {
      const r = n[o];
      let a = i[o];
      (a.shapeFlag & 1 &&
        !a.dynamicChildren &&
        ((a.patchFlag <= 0 || a.patchFlag === 32) && ((a = i[o] = rn(i[o])), (a.el = r.el)),
        !s && a.patchFlag !== -2 && Zm(r, a)),
        a.type === tl && (a.patchFlag === -1 && (a = i[o] = rn(a)), (a.el = r.el)),
        a.type === Ln && !a.el && (a.el = r.el));
    }
}
function B0(e) {
  const t = e.slice(),
    s = [0];
  let n, i, o, r, a;
  const l = e.length;
  for (n = 0; n < l; n++) {
    const c = e[n];
    if (c !== 0) {
      if (((i = s[s.length - 1]), e[i] < c)) {
        ((t[n] = i), s.push(n));
        continue;
      }
      for (o = 0, r = s.length - 1; o < r; )
        ((a = (o + r) >> 1), e[s[a]] < c ? (o = a + 1) : (r = a));
      c < e[s[o]] && (o > 0 && (t[n] = s[o - 1]), (s[o] = n));
    }
  }
  for (o = s.length, r = s[o - 1]; o-- > 0; ) ((s[o] = r), (r = t[r]));
  return s;
}
function Qm(e) {
  const t = e.subTree.component;
  if (t) return t.asyncDep && !t.asyncResolved ? t : Qm(t);
}
function $h(e) {
  if (e) for (let t = 0; t < e.length; t++) e[t].flags |= 8;
}
function tg(e) {
  if (e.placeholder) return e.placeholder;
  const t = e.component;
  return t ? tg(t.subTree) : null;
}
const eg = (e) => e.__isSuspense;
function U0(e, t) {
  t && t.pendingBranch ? (_t(e) ? t.effects.push(...e) : t.effects.push(e)) : Gv(e);
}
const ne = Symbol.for('v-fgt'),
  tl = Symbol.for('v-txt'),
  Ln = Symbol.for('v-cmt'),
  ua = Symbol.for('v-stc'),
  $o = [];
let ds = null;
function R(e = !1) {
  $o.push((ds = e ? null : []));
}
function j0() {
  ($o.pop(), (ds = $o[$o.length - 1] || null));
}
let Yo = 1;
function Aa(e, t = !1) {
  ((Yo += e), e < 0 && ds && t && (ds.hasOnce = !0));
}
function sg(e) {
  return ((e.dynamicChildren = Yo > 0 ? ds || Bi : null), j0(), Yo > 0 && ds && ds.push(e), e);
}
function D(e, t, s, n, i, o) {
  return sg(u(e, t, s, n, i, o, !0));
}
function ng(e, t, s, n, i) {
  return sg(Rt(e, t, s, n, i, !0));
}
function Pa(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function ho(e, t) {
  return e.type === t.type && e.key === t.key;
}
const ig = ({ key: e }) => e ?? null,
  ha = ({ ref: e, ref_key: t, ref_for: s }) => (
    typeof e == 'number' && (e = '' + e),
    e != null ? (xe(e) || Be(e) || Tt(e) ? { i: cs, r: e, k: t, f: !!s } : e) : null
  );
function u(e, t = null, s = null, n = 0, i = null, o = e === ne ? 0 : 1, r = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && ig(t),
    ref: t && ha(t),
    scopeId: Mm,
    slotScopeIds: null,
    children: s,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: o,
    patchFlag: n,
    dynamicProps: i,
    dynamicChildren: null,
    appContext: null,
    ctx: cs
  };
  return (
    a ? (kd(l, s), o & 128 && e.normalize(l)) : s && (l.shapeFlag |= xe(s) ? 8 : 16),
    Yo > 0 && !r && ds && (l.patchFlag > 0 || o & 6) && l.patchFlag !== 32 && ds.push(l),
    l
  );
}
const Rt = V0;
function V0(e, t = null, s = null, n = 0, i = null, o = !1) {
  if (((!e || e === p0) && (e = Ln), Pa(e))) {
    const a = Ki(e, t, !0);
    return (
      s && kd(a, s),
      Yo > 0 && !o && ds && (a.shapeFlag & 6 ? (ds[ds.indexOf(e)] = a) : ds.push(a)),
      (a.patchFlag = -2),
      a
    );
  }
  if ((Q0(e) && (e = e.__vccOpts), t)) {
    t = H0(t);
    let { class: a, style: l } = t;
    (a && !xe(a) && (t.class = vs(a)),
      te(l) && (dr(l) && !_t(l) && (l = Pe({}, l)), (t.style = dd(l))));
  }
  const r = xe(e) ? 1 : eg(e) ? 128 : t0(e) ? 64 : te(e) ? 4 : Tt(e) ? 2 : 0;
  return u(e, t, s, n, i, r, o, !0);
}
function H0(e) {
  return e ? (dr(e) || Km(e) ? Pe({}, e) : e) : null;
}
function Ki(e, t, s = !1, n = !1) {
  const { props: i, ref: o, patchFlag: r, children: a, transition: l } = e,
    c = t ? z0(i || {}, t) : i,
    h = {
      __v_isVNode: !0,
      __v_skip: !0,
      type: e.type,
      props: c,
      key: c && ig(c),
      ref: t && t.ref ? (s && o ? (_t(o) ? o.concat(ha(t)) : [o, ha(t)]) : ha(t)) : o,
      scopeId: e.scopeId,
      slotScopeIds: e.slotScopeIds,
      children: a,
      target: e.target,
      targetStart: e.targetStart,
      targetAnchor: e.targetAnchor,
      staticCount: e.staticCount,
      shapeFlag: e.shapeFlag,
      patchFlag: t && e.type !== ne ? (r === -1 ? 16 : r | 16) : r,
      dynamicProps: e.dynamicProps,
      dynamicChildren: e.dynamicChildren,
      appContext: e.appContext,
      dirs: e.dirs,
      transition: l,
      component: e.component,
      suspense: e.suspense,
      ssContent: e.ssContent && Ki(e.ssContent),
      ssFallback: e.ssFallback && Ki(e.ssFallback),
      placeholder: e.placeholder,
      el: e.el,
      anchor: e.anchor,
      ctx: e.ctx,
      ce: e.ce
    };
  return (l && n && vd(h, l.clone(h)), h);
}
function jt(e = ' ', t = 0) {
  return Rt(tl, null, e, t);
}
function Uc(e, t) {
  const s = Rt(ua, null, e);
  return ((s.staticCount = t), s);
}
function mt(e = '', t = !1) {
  return t ? (R(), ng(Ln, null, e)) : Rt(Ln, null, e);
}
function zs(e) {
  return e == null || typeof e == 'boolean'
    ? Rt(Ln)
    : _t(e)
      ? Rt(ne, null, e.slice())
      : Pa(e)
        ? rn(e)
        : Rt(tl, null, String(e));
}
function rn(e) {
  return (e.el === null && e.patchFlag !== -1) || e.memo ? e : Ki(e);
}
function kd(e, t) {
  let s = 0;
  const { shapeFlag: n } = e;
  if (t == null) t = null;
  else if (_t(t)) s = 16;
  else if (typeof t == 'object')
    if (n & 65) {
      const i = t.default;
      i && (i._c && (i._d = !1), kd(e, i()), i._c && (i._d = !0));
      return;
    } else {
      s = 32;
      const i = t._;
      !i && !Km(t)
        ? (t._ctx = cs)
        : i === 3 && cs && (cs.slots._ === 1 ? (t._ = 1) : ((t._ = 2), (e.patchFlag |= 1024)));
    }
  else
    Tt(t)
      ? ((t = { default: t, _ctx: cs }), (s = 32))
      : ((t = String(t)), n & 64 ? ((s = 16), (t = [jt(t)])) : (s = 8));
  ((e.children = t), (e.shapeFlag |= s));
}
function z0(...e) {
  const t = {};
  for (let s = 0; s < e.length; s++) {
    const n = e[s];
    for (const i in n)
      if (i === 'class') t.class !== n.class && (t.class = vs([t.class, n.class]));
      else if (i === 'style') t.style = dd([t.style, n.style]);
      else if (ja(i)) {
        const o = t[i],
          r = n[i];
        r && o !== r && !(_t(o) && o.includes(r)) && (t[i] = o ? [].concat(o, r) : r);
      } else i !== '' && (t[i] = n[i]);
  }
  return t;
}
function Fs(e, t, s, n = null) {
  Xs(e, t, 7, [s, n]);
}
const W0 = Um();
let K0 = 0;
function q0(e, t, s) {
  const n = e.type,
    i = (t ? t.appContext : e.appContext) || W0,
    o = {
      uid: K0++,
      vnode: e,
      type: n,
      parent: t,
      appContext: i,
      root: null,
      next: null,
      subTree: null,
      effect: null,
      update: null,
      job: null,
      scope: new bv(!0),
      render: null,
      proxy: null,
      exposed: null,
      exposeProxy: null,
      withProxy: null,
      provides: t ? t.provides : Object.create(i.provides),
      ids: t ? t.ids : ['', 0, 0],
      accessCache: null,
      renderCache: [],
      components: null,
      directives: null,
      propsOptions: Gm(n, i),
      emitsOptions: Vm(n, i),
      emit: null,
      emitted: null,
      propsDefaults: Wt,
      inheritAttrs: n.inheritAttrs,
      ctx: Wt,
      data: Wt,
      props: Wt,
      attrs: Wt,
      slots: Wt,
      refs: Wt,
      setupState: Wt,
      setupContext: null,
      suspense: s,
      suspenseId: s ? s.pendingId : 0,
      asyncDep: null,
      asyncResolved: !1,
      isMounted: !1,
      isUnmounted: !1,
      isDeactivated: !1,
      bc: null,
      c: null,
      bm: null,
      m: null,
      bu: null,
      u: null,
      um: null,
      bum: null,
      da: null,
      a: null,
      rtg: null,
      rtc: null,
      ec: null,
      sp: null
    };
  return (
    (o.ctx = { _: o }),
    (o.root = t ? t.root : o),
    (o.emit = k0.bind(null, o)),
    e.ce && e.ce(o),
    o
  );
}
let Le = null;
const og = () => Le || cs;
let Oa, jc;
{
  const e = Wa(),
    t = (s, n) => {
      let i;
      return (
        (i = e[s]) || (i = e[s] = []),
        i.push(n),
        (o) => {
          i.length > 1 ? i.forEach((r) => r(o)) : i[0](o);
        }
      );
    };
  ((Oa = t('__VUE_INSTANCE_SETTERS__', (s) => (Le = s))),
    (jc = t('__VUE_SSR_SETTERS__', (s) => (Jo = s))));
}
const fr = (e) => {
    const t = Le;
    return (
      Oa(e),
      e.scope.on(),
      () => {
        (e.scope.off(), Oa(t));
      }
    );
  },
  Fh = () => {
    (Le && Le.scope.off(), Oa(null));
  };
function rg(e) {
  return e.vnode.shapeFlag & 4;
}
let Jo = !1;
function G0(e, t = !1, s = !1) {
  t && jc(t);
  const { props: n, children: i } = e.vnode,
    o = rg(e);
  (E0(e, n, o, t), I0(e, i, s || t));
  const r = o ? X0(e, t) : void 0;
  return (t && jc(!1), r);
}
function X0(e, t) {
  const s = e.type;
  ((e.accessCache = Object.create(null)), (e.proxy = new Proxy(e.ctx, g0)));
  const { setup: n } = s;
  if (n) {
    mn();
    const i = (e.setupContext = n.length > 1 ? J0(e) : null),
      o = fr(e),
      r = ur(n, e, 0, [e.props, i]),
      a = om(r);
    if ((gn(), o(), (a || e.sp) && !Lo(e) && Lm(e), a)) {
      if ((r.then(Fh, Fh), t))
        return r
          .then((l) => {
            Bh(e, l);
          })
          .catch((l) => {
            Xa(l, e, 0);
          });
      e.asyncDep = r;
    } else Bh(e, r);
  } else ag(e);
}
function Bh(e, t, s) {
  (Tt(t)
    ? e.type.__ssrInlineRender
      ? (e.ssrRender = t)
      : (e.render = t)
    : te(t) && (e.setupState = Pm(t)),
    ag(e));
}
function ag(e, t, s) {
  const n = e.type;
  e.render || (e.render = n.render || Ws);
  {
    const i = fr(e);
    mn();
    try {
      b0(e);
    } finally {
      (gn(), i());
    }
  }
}
const Y0 = {
  get(e, t) {
    return (Ie(e, 'get', ''), e[t]);
  }
};
function J0(e) {
  const t = (s) => {
    e.exposed = s || {};
  };
  return { attrs: new Proxy(e.attrs, Y0), slots: e.slots, emit: e.emit, expose: t };
}
function el(e) {
  return e.exposed
    ? e.exposeProxy ||
        (e.exposeProxy = new Proxy(Pm($v(e.exposed)), {
          get(t, s) {
            if (s in t) return t[s];
            if (s in No) return No[s](e);
          },
          has(t, s) {
            return s in t || s in No;
          }
        }))
    : e.proxy;
}
function Z0(e, t = !0) {
  return Tt(e) ? e.displayName || e.name : e.name || (t && e.__name);
}
function Q0(e) {
  return Tt(e) && '__vccOpts' in e;
}
const ls = (e, t) => Hv(e, t, Jo);
function Zo(e, t, s) {
  try {
    Aa(-1);
    const n = arguments.length;
    return n === 2
      ? te(t) && !_t(t)
        ? Pa(t)
          ? Rt(e, null, [t])
          : Rt(e, t)
        : Rt(e, null, t)
      : (n > 3 ? (s = Array.prototype.slice.call(arguments, 2)) : n === 3 && Pa(s) && (s = [s]),
        Rt(e, t, s));
  } finally {
    Aa(1);
  }
}
const lg = '3.5.28';
/**
 * @vue/runtime-dom v3.5.28
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ let Vc;
const Uh = typeof window < 'u' && window.trustedTypes;
if (Uh)
  try {
    Vc = Uh.createPolicy('vue', { createHTML: (e) => e });
  } catch {}
const cg = Vc ? (e) => Vc.createHTML(e) : (e) => e,
  tx = 'http://www.w3.org/2000/svg',
  ex = 'http://www.w3.org/1998/Math/MathML',
  on = typeof document < 'u' ? document : null,
  jh = on && on.createElement('template'),
  sx = {
    insert: (e, t, s) => {
      t.insertBefore(e, s || null);
    },
    remove: (e) => {
      const t = e.parentNode;
      t && t.removeChild(e);
    },
    createElement: (e, t, s, n) => {
      const i =
        t === 'svg'
          ? on.createElementNS(tx, e)
          : t === 'mathml'
            ? on.createElementNS(ex, e)
            : s
              ? on.createElement(e, { is: s })
              : on.createElement(e);
      return (
        e === 'select' && n && n.multiple != null && i.setAttribute('multiple', n.multiple),
        i
      );
    },
    createText: (e) => on.createTextNode(e),
    createComment: (e) => on.createComment(e),
    setText: (e, t) => {
      e.nodeValue = t;
    },
    setElementText: (e, t) => {
      e.textContent = t;
    },
    parentNode: (e) => e.parentNode,
    nextSibling: (e) => e.nextSibling,
    querySelector: (e) => on.querySelector(e),
    setScopeId(e, t) {
      e.setAttribute(t, '');
    },
    insertStaticContent(e, t, s, n, i, o) {
      const r = s ? s.previousSibling : t.lastChild;
      if (i && (i === o || i.nextSibling))
        for (; t.insertBefore(i.cloneNode(!0), s), !(i === o || !(i = i.nextSibling)); );
      else {
        jh.innerHTML = cg(
          n === 'svg' ? `<svg>${e}</svg>` : n === 'mathml' ? `<math>${e}</math>` : e
        );
        const a = jh.content;
        if (n === 'svg' || n === 'mathml') {
          const l = a.firstChild;
          for (; l.firstChild; ) a.appendChild(l.firstChild);
          a.removeChild(l);
        }
        t.insertBefore(a, s);
      }
      return [r ? r.nextSibling : t.firstChild, s ? s.previousSibling : t.lastChild];
    }
  },
  nx = Symbol('_vtc');
function ix(e, t, s) {
  const n = e[nx];
  (n && (t = (t ? [t, ...n] : [...n]).join(' ')),
    t == null ? e.removeAttribute('class') : s ? e.setAttribute('class', t) : (e.className = t));
}
const Vh = Symbol('_vod'),
  ox = Symbol('_vsh'),
  rx = Symbol(''),
  ax = /(?:^|;)\s*display\s*:/;
function lx(e, t, s) {
  const n = e.style,
    i = xe(s);
  let o = !1;
  if (s && !i) {
    if (t)
      if (xe(t))
        for (const r of t.split(';')) {
          const a = r.slice(0, r.indexOf(':')).trim();
          s[a] == null && fa(n, a, '');
        }
      else for (const r in t) s[r] == null && fa(n, r, '');
    for (const r in s) (r === 'display' && (o = !0), fa(n, r, s[r]));
  } else if (i) {
    if (t !== s) {
      const r = n[rx];
      (r && (s += ';' + r), (n.cssText = s), (o = ax.test(s)));
    }
  } else t && e.removeAttribute('style');
  Vh in e && ((e[Vh] = o ? n.display : ''), e[ox] && (n.display = 'none'));
}
const Hh = /\s*!important$/;
function fa(e, t, s) {
  if (_t(s)) s.forEach((n) => fa(e, t, n));
  else if ((s == null && (s = ''), t.startsWith('--'))) e.setProperty(t, s);
  else {
    const n = cx(e, t);
    Hh.test(s) ? e.setProperty(Fn(n), s.replace(Hh, ''), 'important') : (e[n] = s);
  }
}
const zh = ['Webkit', 'Moz', 'ms'],
  oc = {};
function cx(e, t) {
  const s = oc[t];
  if (s) return s;
  let n = us(t);
  if (n !== 'filter' && n in e) return (oc[t] = n);
  n = Ha(n);
  for (let i = 0; i < zh.length; i++) {
    const o = zh[i] + n;
    if (o in e) return (oc[t] = o);
  }
  return t;
}
const Wh = 'http://www.w3.org/1999/xlink';
function Kh(e, t, s, n, i, o = mv(t)) {
  n && t.startsWith('xlink:')
    ? s == null
      ? e.removeAttributeNS(Wh, t.slice(6, t.length))
      : e.setAttributeNS(Wh, t, s)
    : s == null || (o && !cm(s))
      ? e.removeAttribute(t)
      : e.setAttribute(t, o ? '' : Gs(s) ? String(s) : s);
}
function qh(e, t, s, n, i) {
  if (t === 'innerHTML' || t === 'textContent') {
    s != null && (e[t] = t === 'innerHTML' ? cg(s) : s);
    return;
  }
  const o = e.tagName;
  if (t === 'value' && o !== 'PROGRESS' && !o.includes('-')) {
    const a = o === 'OPTION' ? e.getAttribute('value') || '' : e.value,
      l = s == null ? (e.type === 'checkbox' ? 'on' : '') : String(s);
    ((a !== l || !('_value' in e)) && (e.value = l),
      s == null && e.removeAttribute(t),
      (e._value = s));
    return;
  }
  let r = !1;
  if (s === '' || s == null) {
    const a = typeof e[t];
    a === 'boolean'
      ? (s = cm(s))
      : s == null && a === 'string'
        ? ((s = ''), (r = !0))
        : a === 'number' && ((s = 0), (r = !0));
  }
  try {
    e[t] = s;
  } catch {}
  r && e.removeAttribute(i || t);
}
function dn(e, t, s, n) {
  e.addEventListener(t, s, n);
}
function dx(e, t, s, n) {
  e.removeEventListener(t, s, n);
}
const Gh = Symbol('_vei');
function ux(e, t, s, n, i = null) {
  const o = e[Gh] || (e[Gh] = {}),
    r = o[t];
  if (n && r) r.value = n;
  else {
    const [a, l] = hx(t);
    if (n) {
      const c = (o[t] = mx(n, i));
      dn(e, a, c, l);
    } else r && (dx(e, a, r, l), (o[t] = void 0));
  }
}
const Xh = /(?:Once|Passive|Capture)$/;
function hx(e) {
  let t;
  if (Xh.test(e)) {
    t = {};
    let n;
    for (; (n = e.match(Xh)); )
      ((e = e.slice(0, e.length - n[0].length)), (t[n[0].toLowerCase()] = !0));
  }
  return [e[2] === ':' ? e.slice(3) : Fn(e.slice(2)), t];
}
let rc = 0;
const fx = Promise.resolve(),
  px = () => rc || (fx.then(() => (rc = 0)), (rc = Date.now()));
function mx(e, t) {
  const s = (n) => {
    if (!n._vts) n._vts = Date.now();
    else if (n._vts <= s.attached) return;
    Xs(gx(n, s.value), t, 5, [n]);
  };
  return ((s.value = e), (s.attached = px()), s);
}
function gx(e, t) {
  if (_t(t)) {
    const s = e.stopImmediatePropagation;
    return (
      (e.stopImmediatePropagation = () => {
        (s.call(e), (e._stopped = !0));
      }),
      t.map((n) => (i) => !i._stopped && n && n(i))
    );
  } else return t;
}
const Yh = (e) =>
    e.charCodeAt(0) === 111 &&
    e.charCodeAt(1) === 110 &&
    e.charCodeAt(2) > 96 &&
    e.charCodeAt(2) < 123,
  bx = (e, t, s, n, i, o) => {
    const r = i === 'svg';
    t === 'class'
      ? ix(e, n, r)
      : t === 'style'
        ? lx(e, s, n)
        : ja(t)
          ? ad(t) || ux(e, t, s, n, o)
          : (
                t[0] === '.'
                  ? ((t = t.slice(1)), !0)
                  : t[0] === '^'
                    ? ((t = t.slice(1)), !1)
                    : _x(e, t, n, r)
              )
            ? (qh(e, t, n),
              !e.tagName.includes('-') &&
                (t === 'value' || t === 'checked' || t === 'selected') &&
                Kh(e, t, n, r, o, t !== 'value'))
            : e._isVueCE && (/[A-Z]/.test(t) || !xe(n))
              ? qh(e, us(t), n, o, t)
              : (t === 'true-value'
                  ? (e._trueValue = n)
                  : t === 'false-value' && (e._falseValue = n),
                Kh(e, t, n, r));
  };
function _x(e, t, s, n) {
  if (n) return !!(t === 'innerHTML' || t === 'textContent' || (t in e && Yh(t) && Tt(s)));
  if (
    t === 'spellcheck' ||
    t === 'draggable' ||
    t === 'translate' ||
    t === 'autocorrect' ||
    (t === 'sandbox' && e.tagName === 'IFRAME') ||
    t === 'form' ||
    (t === 'list' && e.tagName === 'INPUT') ||
    (t === 'type' && e.tagName === 'TEXTAREA')
  )
    return !1;
  if (t === 'width' || t === 'height') {
    const i = e.tagName;
    if (i === 'IMG' || i === 'VIDEO' || i === 'CANVAS' || i === 'SOURCE') return !1;
  }
  return Yh(t) && xe(s) ? !1 : t in e;
}
const Nn = (e) => {
  const t = e.props['onUpdate:modelValue'] || !1;
  return _t(t) ? (s) => ca(t, s) : t;
};
function yx(e) {
  e.target.composing = !0;
}
function Jh(e) {
  const t = e.target;
  t.composing && ((t.composing = !1), t.dispatchEvent(new Event('input')));
}
const Ss = Symbol('_assign');
function Zh(e, t, s) {
  return (t && (e = e.trim()), s && (e = za(e)), e);
}
const Et = {
    created(e, { modifiers: { lazy: t, trim: s, number: n } }, i) {
      e[Ss] = Nn(i);
      const o = n || (i.props && i.props.type === 'number');
      (dn(e, t ? 'change' : 'input', (r) => {
        r.target.composing || e[Ss](Zh(e.value, s, o));
      }),
        (s || o) &&
          dn(e, 'change', () => {
            e.value = Zh(e.value, s, o);
          }),
        t || (dn(e, 'compositionstart', yx), dn(e, 'compositionend', Jh), dn(e, 'change', Jh)));
    },
    mounted(e, { value: t }) {
      e.value = t ?? '';
    },
    beforeUpdate(e, { value: t, oldValue: s, modifiers: { lazy: n, trim: i, number: o } }, r) {
      if (((e[Ss] = Nn(r)), e.composing)) return;
      const a = (o || e.type === 'number') && !/^0\d/.test(e.value) ? za(e.value) : e.value,
        l = t ?? '';
      a !== l &&
        ((document.activeElement === e &&
          e.type !== 'range' &&
          ((n && t === s) || (i && e.value.trim() === l))) ||
          (e.value = l));
    }
  },
  dg = {
    deep: !0,
    created(e, t, s) {
      ((e[Ss] = Nn(s)),
        dn(e, 'change', () => {
          const n = e._modelValue,
            i = qi(e),
            o = e.checked,
            r = e[Ss];
          if (_t(n)) {
            const a = ud(n, i),
              l = a !== -1;
            if (o && !l) r(n.concat(i));
            else if (!o && l) {
              const c = [...n];
              (c.splice(a, 1), r(c));
            }
          } else if (Qi(n)) {
            const a = new Set(n);
            (o ? a.add(i) : a.delete(i), r(a));
          } else r(ug(e, o));
        }));
    },
    mounted: Qh,
    beforeUpdate(e, t, s) {
      ((e[Ss] = Nn(s)), Qh(e, t, s));
    }
  };
function Qh(e, { value: t, oldValue: s }, n) {
  e._modelValue = t;
  let i;
  if (_t(t)) i = ud(t, n.props.value) > -1;
  else if (Qi(t)) i = t.has(n.props.value);
  else {
    if (t === s) return;
    i = In(t, ug(e, !0));
  }
  e.checked !== i && (e.checked = i);
}
const vx = {
    created(e, { value: t }, s) {
      ((e.checked = In(t, s.props.value)),
        (e[Ss] = Nn(s)),
        dn(e, 'change', () => {
          e[Ss](qi(e));
        }));
    },
    beforeUpdate(e, { value: t, oldValue: s }, n) {
      ((e[Ss] = Nn(n)), t !== s && (e.checked = In(t, n.props.value)));
    }
  },
  ks = {
    deep: !0,
    created(e, { value: t, modifiers: { number: s } }, n) {
      const i = Qi(t);
      (dn(e, 'change', () => {
        const o = Array.prototype.filter
          .call(e.options, (r) => r.selected)
          .map((r) => (s ? za(qi(r)) : qi(r)));
        (e[Ss](e.multiple ? (i ? new Set(o) : o) : o[0]),
          (e._assigning = !0),
          Ya(() => {
            e._assigning = !1;
          }));
      }),
        (e[Ss] = Nn(n)));
    },
    mounted(e, { value: t }) {
      tf(e, t);
    },
    beforeUpdate(e, t, s) {
      e[Ss] = Nn(s);
    },
    updated(e, { value: t }) {
      e._assigning || tf(e, t);
    }
  };
function tf(e, t) {
  const s = e.multiple,
    n = _t(t);
  if (!(s && !n && !Qi(t))) {
    for (let i = 0, o = e.options.length; i < o; i++) {
      const r = e.options[i],
        a = qi(r);
      if (s)
        if (n) {
          const l = typeof a;
          l === 'string' || l === 'number'
            ? (r.selected = t.some((c) => String(c) === String(a)))
            : (r.selected = ud(t, a) > -1);
        } else r.selected = t.has(a);
      else if (In(qi(r), t)) {
        e.selectedIndex !== i && (e.selectedIndex = i);
        return;
      }
    }
    !s && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function qi(e) {
  return '_value' in e ? e._value : e.value;
}
function ug(e, t) {
  const s = t ? '_trueValue' : '_falseValue';
  return s in e ? e[s] : t;
}
const xx = {
  created(e, t, s) {
    Kr(e, t, s, null, 'created');
  },
  mounted(e, t, s) {
    Kr(e, t, s, null, 'mounted');
  },
  beforeUpdate(e, t, s, n) {
    Kr(e, t, s, n, 'beforeUpdate');
  },
  updated(e, t, s, n) {
    Kr(e, t, s, n, 'updated');
  }
};
function wx(e, t) {
  switch (e) {
    case 'SELECT':
      return ks;
    case 'TEXTAREA':
      return Et;
    default:
      switch (t) {
        case 'checkbox':
          return dg;
        case 'radio':
          return vx;
        default:
          return Et;
      }
  }
}
function Kr(e, t, s, n, i) {
  const r = wx(e.tagName, s.props && s.props.type)[i];
  r && r(e, t, s, n);
}
const Sx = ['ctrl', 'shift', 'alt', 'meta'],
  kx = {
    stop: (e) => e.stopPropagation(),
    prevent: (e) => e.preventDefault(),
    self: (e) => e.target !== e.currentTarget,
    ctrl: (e) => !e.ctrlKey,
    shift: (e) => !e.shiftKey,
    alt: (e) => !e.altKey,
    meta: (e) => !e.metaKey,
    left: (e) => 'button' in e && e.button !== 0,
    middle: (e) => 'button' in e && e.button !== 1,
    right: (e) => 'button' in e && e.button !== 2,
    exact: (e, t) => Sx.some((s) => e[`${s}Key`] && !t.includes(s))
  },
  Es = (e, t) => {
    if (!e) return e;
    const s = e._withMods || (e._withMods = {}),
      n = t.join('.');
    return (
      s[n] ||
      (s[n] = (i, ...o) => {
        for (let r = 0; r < t.length; r++) {
          const a = kx[t[r]];
          if (a && a(i, t)) return;
        }
        return e(i, ...o);
      })
    );
  },
  Cx = Pe({ patchProp: bx }, sx);
let ef;
function Tx() {
  return ef || (ef = N0(Cx));
}
const Ax = (...e) => {
  const t = Tx().createApp(...e),
    { mount: s } = t;
  return (
    (t.mount = (n) => {
      const i = Ox(n);
      if (!i) return;
      const o = t._component;
      (!Tt(o) && !o.render && !o.template && (o.template = i.innerHTML),
        i.nodeType === 1 && (i.textContent = ''));
      const r = s(i, !1, Px(i));
      return (
        i instanceof Element && (i.removeAttribute('v-cloak'), i.setAttribute('data-v-app', '')),
        r
      );
    }),
    t
  );
};
function Px(e) {
  if (e instanceof SVGElement) return 'svg';
  if (typeof MathMLElement == 'function' && e instanceof MathMLElement) return 'mathml';
}
function Ox(e) {
  return xe(e) ? document.querySelector(e) : e;
}
const we = (e, t) => {
    const s = e.__vccOpts || e;
    for (const [n, i] of t) s[n] = i;
    return s;
  },
  Ex = { name: 'App' };
function Rx(e, t, s, n, i, o) {
  const r = Ks('router-view');
  return (R(), ng(r));
}
const Dx = we(Ex, [['render', Rx]]);
/*!
 * vue-router v4.6.4
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */ const $i = typeof document < 'u';
function hg(e) {
  return typeof e == 'object' || 'displayName' in e || 'props' in e || '__vccOpts' in e;
}
function Mx(e) {
  return e.__esModule || e[Symbol.toStringTag] === 'Module' || (e.default && hg(e.default));
}
const Kt = Object.assign;
function ac(e, t) {
  const s = {};
  for (const n in t) {
    const i = t[n];
    s[n] = Rs(i) ? i.map(e) : e(i);
  }
  return s;
}
const Fo = () => {},
  Rs = Array.isArray;
function sf(e, t) {
  const s = {};
  for (const n in e) s[n] = n in t ? t[n] : e[n];
  return s;
}
const fg = /#/g,
  Ix = /&/g,
  Lx = /\//g,
  Nx = /=/g,
  $x = /\?/g,
  pg = /\+/g,
  Fx = /%5B/g,
  Bx = /%5D/g,
  mg = /%5E/g,
  Ux = /%60/g,
  gg = /%7B/g,
  jx = /%7C/g,
  bg = /%7D/g,
  Vx = /%20/g;
function Cd(e) {
  return e == null
    ? ''
    : encodeURI('' + e)
        .replace(jx, '|')
        .replace(Fx, '[')
        .replace(Bx, ']');
}
function Hx(e) {
  return Cd(e).replace(gg, '{').replace(bg, '}').replace(mg, '^');
}
function Hc(e) {
  return Cd(e)
    .replace(pg, '%2B')
    .replace(Vx, '+')
    .replace(fg, '%23')
    .replace(Ix, '%26')
    .replace(Ux, '`')
    .replace(gg, '{')
    .replace(bg, '}')
    .replace(mg, '^');
}
function zx(e) {
  return Hc(e).replace(Nx, '%3D');
}
function Wx(e) {
  return Cd(e).replace(fg, '%23').replace($x, '%3F');
}
function Kx(e) {
  return Wx(e).replace(Lx, '%2F');
}
function Qo(e) {
  if (e == null) return null;
  try {
    return decodeURIComponent('' + e);
  } catch {}
  return '' + e;
}
const qx = /\/$/,
  Gx = (e) => e.replace(qx, '');
function lc(e, t, s = '/') {
  let n,
    i = {},
    o = '',
    r = '';
  const a = t.indexOf('#');
  let l = t.indexOf('?');
  return (
    (l = a >= 0 && l > a ? -1 : l),
    l >= 0 && ((n = t.slice(0, l)), (o = t.slice(l, a > 0 ? a : t.length)), (i = e(o.slice(1)))),
    a >= 0 && ((n = n || t.slice(0, a)), (r = t.slice(a, t.length))),
    (n = Zx(n ?? t, s)),
    { fullPath: n + o + r, path: n, query: i, hash: Qo(r) }
  );
}
function Xx(e, t) {
  const s = t.query ? e(t.query) : '';
  return t.path + (s && '?') + s + (t.hash || '');
}
function nf(e, t) {
  return !t || !e.toLowerCase().startsWith(t.toLowerCase()) ? e : e.slice(t.length) || '/';
}
function Yx(e, t, s) {
  const n = t.matched.length - 1,
    i = s.matched.length - 1;
  return (
    n > -1 &&
    n === i &&
    Gi(t.matched[n], s.matched[i]) &&
    _g(t.params, s.params) &&
    e(t.query) === e(s.query) &&
    t.hash === s.hash
  );
}
function Gi(e, t) {
  return (e.aliasOf || e) === (t.aliasOf || t);
}
function _g(e, t) {
  if (Object.keys(e).length !== Object.keys(t).length) return !1;
  for (var s in e) if (!Jx(e[s], t[s])) return !1;
  return !0;
}
function Jx(e, t) {
  return Rs(e)
    ? of(e, t)
    : Rs(t)
      ? of(t, e)
      : (e == null ? void 0 : e.valueOf()) === (t == null ? void 0 : t.valueOf());
}
function of(e, t) {
  return Rs(t)
    ? e.length === t.length && e.every((s, n) => s === t[n])
    : e.length === 1 && e[0] === t;
}
function Zx(e, t) {
  if (e.startsWith('/')) return e;
  if (!e) return t;
  const s = t.split('/'),
    n = e.split('/'),
    i = n[n.length - 1];
  (i === '..' || i === '.') && n.push('');
  let o = s.length - 1,
    r,
    a;
  for (r = 0; r < n.length; r++)
    if (((a = n[r]), a !== '.'))
      if (a === '..') o > 1 && o--;
      else break;
  return s.slice(0, o).join('/') + '/' + n.slice(r).join('/');
}
const kn = {
  path: '/',
  name: void 0,
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
  redirectedFrom: void 0
};
let zc = (function (e) {
    return ((e.pop = 'pop'), (e.push = 'push'), e);
  })({}),
  cc = (function (e) {
    return ((e.back = 'back'), (e.forward = 'forward'), (e.unknown = ''), e);
  })({});
function Qx(e) {
  if (!e)
    if ($i) {
      const t = document.querySelector('base');
      ((e = (t && t.getAttribute('href')) || '/'), (e = e.replace(/^\w+:\/\/[^\/]+/, '')));
    } else e = '/';
  return (e[0] !== '/' && e[0] !== '#' && (e = '/' + e), Gx(e));
}
const t1 = /^[^#]+#/;
function e1(e, t) {
  return e.replace(t1, '#') + t;
}
function s1(e, t) {
  const s = document.documentElement.getBoundingClientRect(),
    n = e.getBoundingClientRect();
  return {
    behavior: t.behavior,
    left: n.left - s.left - (t.left || 0),
    top: n.top - s.top - (t.top || 0)
  };
}
const sl = () => ({ left: window.scrollX, top: window.scrollY });
function n1(e) {
  let t;
  if ('el' in e) {
    const s = e.el,
      n = typeof s == 'string' && s.startsWith('#'),
      i =
        typeof s == 'string'
          ? n
            ? document.getElementById(s.slice(1))
            : document.querySelector(s)
          : s;
    if (!i) return;
    t = s1(i, e);
  } else t = e;
  'scrollBehavior' in document.documentElement.style
    ? window.scrollTo(t)
    : window.scrollTo(
        t.left != null ? t.left : window.scrollX,
        t.top != null ? t.top : window.scrollY
      );
}
function rf(e, t) {
  return (history.state ? history.state.position - t : -1) + e;
}
const Wc = new Map();
function i1(e, t) {
  Wc.set(e, t);
}
function o1(e) {
  const t = Wc.get(e);
  return (Wc.delete(e), t);
}
function r1(e) {
  return typeof e == 'string' || (e && typeof e == 'object');
}
function yg(e) {
  return typeof e == 'string' || typeof e == 'symbol';
}
let pe = (function (e) {
  return (
    (e[(e.MATCHER_NOT_FOUND = 1)] = 'MATCHER_NOT_FOUND'),
    (e[(e.NAVIGATION_GUARD_REDIRECT = 2)] = 'NAVIGATION_GUARD_REDIRECT'),
    (e[(e.NAVIGATION_ABORTED = 4)] = 'NAVIGATION_ABORTED'),
    (e[(e.NAVIGATION_CANCELLED = 8)] = 'NAVIGATION_CANCELLED'),
    (e[(e.NAVIGATION_DUPLICATED = 16)] = 'NAVIGATION_DUPLICATED'),
    e
  );
})({});
const vg = Symbol('');
(pe.MATCHER_NOT_FOUND + '',
  pe.NAVIGATION_GUARD_REDIRECT + '',
  pe.NAVIGATION_ABORTED + '',
  pe.NAVIGATION_CANCELLED + '',
  pe.NAVIGATION_DUPLICATED + '');
function Xi(e, t) {
  return Kt(new Error(), { type: e, [vg]: !0 }, t);
}
function tn(e, t) {
  return e instanceof Error && vg in e && (t == null || !!(e.type & t));
}
const a1 = ['params', 'query', 'hash'];
function l1(e) {
  if (typeof e == 'string') return e;
  if (e.path != null) return e.path;
  const t = {};
  for (const s of a1) s in e && (t[s] = e[s]);
  return JSON.stringify(t, null, 2);
}
function c1(e) {
  const t = {};
  if (e === '' || e === '?') return t;
  const s = (e[0] === '?' ? e.slice(1) : e).split('&');
  for (let n = 0; n < s.length; ++n) {
    const i = s[n].replace(pg, ' '),
      o = i.indexOf('='),
      r = Qo(o < 0 ? i : i.slice(0, o)),
      a = o < 0 ? null : Qo(i.slice(o + 1));
    if (r in t) {
      let l = t[r];
      (Rs(l) || (l = t[r] = [l]), l.push(a));
    } else t[r] = a;
  }
  return t;
}
function af(e) {
  let t = '';
  for (let s in e) {
    const n = e[s];
    if (((s = zx(s)), n == null)) {
      n !== void 0 && (t += (t.length ? '&' : '') + s);
      continue;
    }
    (Rs(n) ? n.map((i) => i && Hc(i)) : [n && Hc(n)]).forEach((i) => {
      i !== void 0 && ((t += (t.length ? '&' : '') + s), i != null && (t += '=' + i));
    });
  }
  return t;
}
function d1(e) {
  const t = {};
  for (const s in e) {
    const n = e[s];
    n !== void 0 &&
      (t[s] = Rs(n) ? n.map((i) => (i == null ? null : '' + i)) : n == null ? n : '' + n);
  }
  return t;
}
const u1 = Symbol(''),
  lf = Symbol(''),
  Td = Symbol(''),
  xg = Symbol(''),
  Kc = Symbol('');
function fo() {
  let e = [];
  function t(n) {
    return (
      e.push(n),
      () => {
        const i = e.indexOf(n);
        i > -1 && e.splice(i, 1);
      }
    );
  }
  function s() {
    e = [];
  }
  return { add: t, list: () => e.slice(), reset: s };
}
function On(e, t, s, n, i, o = (r) => r()) {
  const r = n && (n.enterCallbacks[i] = n.enterCallbacks[i] || []);
  return () =>
    new Promise((a, l) => {
      const c = (m) => {
          m === !1
            ? l(Xi(pe.NAVIGATION_ABORTED, { from: s, to: t }))
            : m instanceof Error
              ? l(m)
              : r1(m)
                ? l(Xi(pe.NAVIGATION_GUARD_REDIRECT, { from: t, to: m }))
                : (r && n.enterCallbacks[i] === r && typeof m == 'function' && r.push(m), a());
        },
        h = o(() => e.call(n && n.instances[i], t, s, c));
      let f = Promise.resolve(h);
      (e.length < 3 && (f = f.then(c)), f.catch((m) => l(m)));
    });
}
function dc(e, t, s, n, i = (o) => o()) {
  const o = [];
  for (const r of e)
    for (const a in r.components) {
      let l = r.components[a];
      if (!(t !== 'beforeRouteEnter' && !r.instances[a]))
        if (hg(l)) {
          const c = (l.__vccOpts || l)[t];
          c && o.push(On(c, s, n, r, a, i));
        } else {
          let c = l();
          o.push(() =>
            c.then((h) => {
              if (!h) throw new Error(`Couldn't resolve component "${a}" at "${r.path}"`);
              const f = Mx(h) ? h.default : h;
              ((r.mods[a] = h), (r.components[a] = f));
              const m = (f.__vccOpts || f)[t];
              return m && On(m, s, n, r, a, i)();
            })
          );
        }
    }
  return o;
}
function h1(e, t) {
  const s = [],
    n = [],
    i = [],
    o = Math.max(t.matched.length, e.matched.length);
  for (let r = 0; r < o; r++) {
    const a = t.matched[r];
    a && (e.matched.find((c) => Gi(c, a)) ? n.push(a) : s.push(a));
    const l = e.matched[r];
    l && (t.matched.find((c) => Gi(c, l)) || i.push(l));
  }
  return [s, n, i];
}
/*!
 * vue-router v4.6.4
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */ let f1 = () => location.protocol + '//' + location.host;
function wg(e, t) {
  const { pathname: s, search: n, hash: i } = t,
    o = e.indexOf('#');
  if (o > -1) {
    let r = i.includes(e.slice(o)) ? e.slice(o).length : 1,
      a = i.slice(r);
    return (a[0] !== '/' && (a = '/' + a), nf(a, ''));
  }
  return nf(s, e) + n + i;
}
function p1(e, t, s, n) {
  let i = [],
    o = [],
    r = null;
  const a = ({ state: m }) => {
    const g = wg(e, location),
      _ = s.value,
      y = t.value;
    let x = 0;
    if (m) {
      if (((s.value = g), (t.value = m), r && r === _)) {
        r = null;
        return;
      }
      x = y ? m.position - y.position : 0;
    } else n(g);
    i.forEach((w) => {
      w(s.value, _, {
        delta: x,
        type: zc.pop,
        direction: x ? (x > 0 ? cc.forward : cc.back) : cc.unknown
      });
    });
  };
  function l() {
    r = s.value;
  }
  function c(m) {
    i.push(m);
    const g = () => {
      const _ = i.indexOf(m);
      _ > -1 && i.splice(_, 1);
    };
    return (o.push(g), g);
  }
  function h() {
    if (document.visibilityState === 'hidden') {
      const { history: m } = window;
      if (!m.state) return;
      m.replaceState(Kt({}, m.state, { scroll: sl() }), '');
    }
  }
  function f() {
    for (const m of o) m();
    ((o = []),
      window.removeEventListener('popstate', a),
      window.removeEventListener('pagehide', h),
      document.removeEventListener('visibilitychange', h));
  }
  return (
    window.addEventListener('popstate', a),
    window.addEventListener('pagehide', h),
    document.addEventListener('visibilitychange', h),
    { pauseListeners: l, listen: c, destroy: f }
  );
}
function cf(e, t, s, n = !1, i = !1) {
  return {
    back: e,
    current: t,
    forward: s,
    replaced: n,
    position: window.history.length,
    scroll: i ? sl() : null
  };
}
function m1(e) {
  const { history: t, location: s } = window,
    n = { value: wg(e, s) },
    i = { value: t.state };
  i.value ||
    o(
      n.value,
      {
        back: null,
        current: n.value,
        forward: null,
        position: t.length - 1,
        replaced: !0,
        scroll: null
      },
      !0
    );
  function o(l, c, h) {
    const f = e.indexOf('#'),
      m = f > -1 ? (s.host && document.querySelector('base') ? e : e.slice(f)) + l : f1() + e + l;
    try {
      (t[h ? 'replaceState' : 'pushState'](c, '', m), (i.value = c));
    } catch (g) {
      (console.error(g), s[h ? 'replace' : 'assign'](m));
    }
  }
  function r(l, c) {
    (o(
      l,
      Kt({}, t.state, cf(i.value.back, l, i.value.forward, !0), c, { position: i.value.position }),
      !0
    ),
      (n.value = l));
  }
  function a(l, c) {
    const h = Kt({}, i.value, t.state, { forward: l, scroll: sl() });
    (o(h.current, h, !0),
      o(l, Kt({}, cf(n.value, l, null), { position: h.position + 1 }, c), !1),
      (n.value = l));
  }
  return { location: n, state: i, push: a, replace: r };
}
function g1(e) {
  e = Qx(e);
  const t = m1(e),
    s = p1(e, t.state, t.location, t.replace);
  function n(o, r = !0) {
    (r || s.pauseListeners(), history.go(o));
  }
  const i = Kt({ location: '', base: e, go: n, createHref: e1.bind(null, e) }, t, s);
  return (
    Object.defineProperty(i, 'location', { enumerable: !0, get: () => t.location.value }),
    Object.defineProperty(i, 'state', { enumerable: !0, get: () => t.state.value }),
    i
  );
}
let ri = (function (e) {
  return (
    (e[(e.Static = 0)] = 'Static'),
    (e[(e.Param = 1)] = 'Param'),
    (e[(e.Group = 2)] = 'Group'),
    e
  );
})({});
var ke = (function (e) {
  return (
    (e[(e.Static = 0)] = 'Static'),
    (e[(e.Param = 1)] = 'Param'),
    (e[(e.ParamRegExp = 2)] = 'ParamRegExp'),
    (e[(e.ParamRegExpEnd = 3)] = 'ParamRegExpEnd'),
    (e[(e.EscapeNext = 4)] = 'EscapeNext'),
    e
  );
})(ke || {});
const b1 = { type: ri.Static, value: '' },
  _1 = /[a-zA-Z0-9_]/;
function y1(e) {
  if (!e) return [[]];
  if (e === '/') return [[b1]];
  if (!e.startsWith('/')) throw new Error(`Invalid path "${e}"`);
  function t(g) {
    throw new Error(`ERR (${s})/"${c}": ${g}`);
  }
  let s = ke.Static,
    n = s;
  const i = [];
  let o;
  function r() {
    (o && i.push(o), (o = []));
  }
  let a = 0,
    l,
    c = '',
    h = '';
  function f() {
    c &&
      (s === ke.Static
        ? o.push({ type: ri.Static, value: c })
        : s === ke.Param || s === ke.ParamRegExp || s === ke.ParamRegExpEnd
          ? (o.length > 1 &&
              (l === '*' || l === '+') &&
              t(`A repeatable param (${c}) must be alone in its segment. eg: '/:ids+.`),
            o.push({
              type: ri.Param,
              value: c,
              regexp: h,
              repeatable: l === '*' || l === '+',
              optional: l === '*' || l === '?'
            }))
          : t('Invalid state to consume buffer'),
      (c = ''));
  }
  function m() {
    c += l;
  }
  for (; a < e.length; ) {
    if (((l = e[a++]), l === '\\' && s !== ke.ParamRegExp)) {
      ((n = s), (s = ke.EscapeNext));
      continue;
    }
    switch (s) {
      case ke.Static:
        l === '/' ? (c && f(), r()) : l === ':' ? (f(), (s = ke.Param)) : m();
        break;
      case ke.EscapeNext:
        (m(), (s = n));
        break;
      case ke.Param:
        l === '('
          ? (s = ke.ParamRegExp)
          : _1.test(l)
            ? m()
            : (f(), (s = ke.Static), l !== '*' && l !== '?' && l !== '+' && a--);
        break;
      case ke.ParamRegExp:
        l === ')'
          ? h[h.length - 1] == '\\'
            ? (h = h.slice(0, -1) + l)
            : (s = ke.ParamRegExpEnd)
          : (h += l);
        break;
      case ke.ParamRegExpEnd:
        (f(), (s = ke.Static), l !== '*' && l !== '?' && l !== '+' && a--, (h = ''));
        break;
      default:
        t('Unknown state');
        break;
    }
  }
  return (s === ke.ParamRegExp && t(`Unfinished custom RegExp for param "${c}"`), f(), r(), i);
}
const df = '[^/]+?',
  v1 = { sensitive: !1, strict: !1, start: !0, end: !0 };
var Ke = (function (e) {
  return (
    (e[(e._multiplier = 10)] = '_multiplier'),
    (e[(e.Root = 90)] = 'Root'),
    (e[(e.Segment = 40)] = 'Segment'),
    (e[(e.SubSegment = 30)] = 'SubSegment'),
    (e[(e.Static = 40)] = 'Static'),
    (e[(e.Dynamic = 20)] = 'Dynamic'),
    (e[(e.BonusCustomRegExp = 10)] = 'BonusCustomRegExp'),
    (e[(e.BonusWildcard = -50)] = 'BonusWildcard'),
    (e[(e.BonusRepeatable = -20)] = 'BonusRepeatable'),
    (e[(e.BonusOptional = -8)] = 'BonusOptional'),
    (e[(e.BonusStrict = 0.7000000000000001)] = 'BonusStrict'),
    (e[(e.BonusCaseSensitive = 0.25)] = 'BonusCaseSensitive'),
    e
  );
})(Ke || {});
const x1 = /[.+*?^${}()[\]/\\]/g;
function w1(e, t) {
  const s = Kt({}, v1, t),
    n = [];
  let i = s.start ? '^' : '';
  const o = [];
  for (const c of e) {
    const h = c.length ? [] : [Ke.Root];
    s.strict && !c.length && (i += '/');
    for (let f = 0; f < c.length; f++) {
      const m = c[f];
      let g = Ke.Segment + (s.sensitive ? Ke.BonusCaseSensitive : 0);
      if (m.type === ri.Static)
        (f || (i += '/'), (i += m.value.replace(x1, '\\$&')), (g += Ke.Static));
      else if (m.type === ri.Param) {
        const { value: _, repeatable: y, optional: x, regexp: w } = m;
        o.push({ name: _, repeatable: y, optional: x });
        const C = w || df;
        if (C !== df) {
          g += Ke.BonusCustomRegExp;
          try {
            `${C}`;
          } catch (E) {
            throw new Error(`Invalid custom RegExp for param "${_}" (${C}): ` + E.message);
          }
        }
        let T = y ? `((?:${C})(?:/(?:${C}))*)` : `(${C})`;
        (f || (T = x && c.length < 2 ? `(?:/${T})` : '/' + T),
          x && (T += '?'),
          (i += T),
          (g += Ke.Dynamic),
          x && (g += Ke.BonusOptional),
          y && (g += Ke.BonusRepeatable),
          C === '.*' && (g += Ke.BonusWildcard));
      }
      h.push(g);
    }
    n.push(h);
  }
  if (s.strict && s.end) {
    const c = n.length - 1;
    n[c][n[c].length - 1] += Ke.BonusStrict;
  }
  (s.strict || (i += '/?'), s.end ? (i += '$') : s.strict && !i.endsWith('/') && (i += '(?:/|$)'));
  const r = new RegExp(i, s.sensitive ? '' : 'i');
  function a(c) {
    const h = c.match(r),
      f = {};
    if (!h) return null;
    for (let m = 1; m < h.length; m++) {
      const g = h[m] || '',
        _ = o[m - 1];
      f[_.name] = g && _.repeatable ? g.split('/') : g;
    }
    return f;
  }
  function l(c) {
    let h = '',
      f = !1;
    for (const m of e) {
      ((!f || !h.endsWith('/')) && (h += '/'), (f = !1));
      for (const g of m)
        if (g.type === ri.Static) h += g.value;
        else if (g.type === ri.Param) {
          const { value: _, repeatable: y, optional: x } = g,
            w = _ in c ? c[_] : '';
          if (Rs(w) && !y)
            throw new Error(
              `Provided param "${_}" is an array but it is not repeatable (* or + modifiers)`
            );
          const C = Rs(w) ? w.join('/') : w;
          if (!C)
            if (x) m.length < 2 && (h.endsWith('/') ? (h = h.slice(0, -1)) : (f = !0));
            else throw new Error(`Missing required param "${_}"`);
          h += C;
        }
    }
    return h || '/';
  }
  return { re: r, score: n, keys: o, parse: a, stringify: l };
}
function S1(e, t) {
  let s = 0;
  for (; s < e.length && s < t.length; ) {
    const n = t[s] - e[s];
    if (n) return n;
    s++;
  }
  return e.length < t.length
    ? e.length === 1 && e[0] === Ke.Static + Ke.Segment
      ? -1
      : 1
    : e.length > t.length
      ? t.length === 1 && t[0] === Ke.Static + Ke.Segment
        ? 1
        : -1
      : 0;
}
function Sg(e, t) {
  let s = 0;
  const n = e.score,
    i = t.score;
  for (; s < n.length && s < i.length; ) {
    const o = S1(n[s], i[s]);
    if (o) return o;
    s++;
  }
  if (Math.abs(i.length - n.length) === 1) {
    if (uf(n)) return 1;
    if (uf(i)) return -1;
  }
  return i.length - n.length;
}
function uf(e) {
  const t = e[e.length - 1];
  return e.length > 0 && t[t.length - 1] < 0;
}
const k1 = { strict: !1, end: !0, sensitive: !1 };
function C1(e, t, s) {
  const n = w1(y1(e.path), s),
    i = Kt(n, { record: e, parent: t, children: [], alias: [] });
  return (t && !i.record.aliasOf == !t.record.aliasOf && t.children.push(i), i);
}
function T1(e, t) {
  const s = [],
    n = new Map();
  t = sf(k1, t);
  function i(f) {
    return n.get(f);
  }
  function o(f, m, g) {
    const _ = !g,
      y = ff(f);
    y.aliasOf = g && g.record;
    const x = sf(t, f),
      w = [y];
    if ('alias' in f) {
      const E = typeof f.alias == 'string' ? [f.alias] : f.alias;
      for (const M of E)
        w.push(
          ff(
            Kt({}, y, {
              components: g ? g.record.components : y.components,
              path: M,
              aliasOf: g ? g.record : y
            })
          )
        );
    }
    let C, T;
    for (const E of w) {
      const { path: M } = E;
      if (m && M[0] !== '/') {
        const H = m.record.path,
          $ = H[H.length - 1] === '/' ? '' : '/';
        E.path = m.record.path + (M && $ + M);
      }
      if (
        ((C = C1(E, m, x)),
        g
          ? g.alias.push(C)
          : ((T = T || C), T !== C && T.alias.push(C), _ && f.name && !pf(C) && r(f.name)),
        kg(C) && l(C),
        y.children)
      ) {
        const H = y.children;
        for (let $ = 0; $ < H.length; $++) o(H[$], C, g && g.children[$]);
      }
      g = g || C;
    }
    return T
      ? () => {
          r(T);
        }
      : Fo;
  }
  function r(f) {
    if (yg(f)) {
      const m = n.get(f);
      m && (n.delete(f), s.splice(s.indexOf(m), 1), m.children.forEach(r), m.alias.forEach(r));
    } else {
      const m = s.indexOf(f);
      m > -1 &&
        (s.splice(m, 1),
        f.record.name && n.delete(f.record.name),
        f.children.forEach(r),
        f.alias.forEach(r));
    }
  }
  function a() {
    return s;
  }
  function l(f) {
    const m = O1(f, s);
    (s.splice(m, 0, f), f.record.name && !pf(f) && n.set(f.record.name, f));
  }
  function c(f, m) {
    let g,
      _ = {},
      y,
      x;
    if ('name' in f && f.name) {
      if (((g = n.get(f.name)), !g)) throw Xi(pe.MATCHER_NOT_FOUND, { location: f });
      ((x = g.record.name),
        (_ = Kt(
          hf(
            m.params,
            g.keys
              .filter((T) => !T.optional)
              .concat(g.parent ? g.parent.keys.filter((T) => T.optional) : [])
              .map((T) => T.name)
          ),
          f.params &&
            hf(
              f.params,
              g.keys.map((T) => T.name)
            )
        )),
        (y = g.stringify(_)));
    } else if (f.path != null)
      ((y = f.path),
        (g = s.find((T) => T.re.test(y))),
        g && ((_ = g.parse(y)), (x = g.record.name)));
    else {
      if (((g = m.name ? n.get(m.name) : s.find((T) => T.re.test(m.path))), !g))
        throw Xi(pe.MATCHER_NOT_FOUND, { location: f, currentLocation: m });
      ((x = g.record.name), (_ = Kt({}, m.params, f.params)), (y = g.stringify(_)));
    }
    const w = [];
    let C = g;
    for (; C; ) (w.unshift(C.record), (C = C.parent));
    return { name: x, path: y, params: _, matched: w, meta: P1(w) };
  }
  e.forEach((f) => o(f));
  function h() {
    ((s.length = 0), n.clear());
  }
  return {
    addRoute: o,
    resolve: c,
    removeRoute: r,
    clearRoutes: h,
    getRoutes: a,
    getRecordMatcher: i
  };
}
function hf(e, t) {
  const s = {};
  for (const n of t) n in e && (s[n] = e[n]);
  return s;
}
function ff(e) {
  const t = {
    path: e.path,
    redirect: e.redirect,
    name: e.name,
    meta: e.meta || {},
    aliasOf: e.aliasOf,
    beforeEnter: e.beforeEnter,
    props: A1(e),
    children: e.children || [],
    instances: {},
    leaveGuards: new Set(),
    updateGuards: new Set(),
    enterCallbacks: {},
    components: 'components' in e ? e.components || null : e.component && { default: e.component }
  };
  return (Object.defineProperty(t, 'mods', { value: {} }), t);
}
function A1(e) {
  const t = {},
    s = e.props || !1;
  if ('component' in e) t.default = s;
  else for (const n in e.components) t[n] = typeof s == 'object' ? s[n] : s;
  return t;
}
function pf(e) {
  for (; e; ) {
    if (e.record.aliasOf) return !0;
    e = e.parent;
  }
  return !1;
}
function P1(e) {
  return e.reduce((t, s) => Kt(t, s.meta), {});
}
function O1(e, t) {
  let s = 0,
    n = t.length;
  for (; s !== n; ) {
    const o = (s + n) >> 1;
    Sg(e, t[o]) < 0 ? (n = o) : (s = o + 1);
  }
  const i = E1(e);
  return (i && (n = t.lastIndexOf(i, n - 1)), n);
}
function E1(e) {
  let t = e;
  for (; (t = t.parent); ) if (kg(t) && Sg(e, t) === 0) return t;
}
function kg({ record: e }) {
  return !!(e.name || (e.components && Object.keys(e.components).length) || e.redirect);
}
function mf(e) {
  const t = pn(Td),
    s = pn(xg),
    n = ls(() => {
      const l = Ot(e.to);
      return t.resolve(l);
    }),
    i = ls(() => {
      const { matched: l } = n.value,
        { length: c } = l,
        h = l[c - 1],
        f = s.matched;
      if (!h || !f.length) return -1;
      const m = f.findIndex(Gi.bind(null, h));
      if (m > -1) return m;
      const g = gf(l[c - 2]);
      return c > 1 && gf(h) === g && f[f.length - 1].path !== g
        ? f.findIndex(Gi.bind(null, l[c - 2]))
        : m;
    }),
    o = ls(() => i.value > -1 && L1(s.params, n.value.params)),
    r = ls(() => i.value > -1 && i.value === s.matched.length - 1 && _g(s.params, n.value.params));
  function a(l = {}) {
    if (I1(l)) {
      const c = t[Ot(e.replace) ? 'replace' : 'push'](Ot(e.to)).catch(Fo);
      return (
        e.viewTransition &&
          typeof document < 'u' &&
          'startViewTransition' in document &&
          document.startViewTransition(() => c),
        c
      );
    }
    return Promise.resolve();
  }
  return { route: n, href: ls(() => n.value.href), isActive: o, isExactActive: r, navigate: a };
}
function R1(e) {
  return e.length === 1 ? e[0] : e;
}
const D1 = Ja({
    name: 'RouterLink',
    compatConfig: { MODE: 3 },
    props: {
      to: { type: [String, Object], required: !0 },
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      custom: Boolean,
      ariaCurrentValue: { type: String, default: 'page' },
      viewTransition: Boolean
    },
    useLink: mf,
    setup(e, { slots: t }) {
      const s = Ga(mf(e)),
        { options: n } = pn(Td),
        i = ls(() => ({
          [bf(e.activeClass, n.linkActiveClass, 'router-link-active')]: s.isActive,
          [bf(e.exactActiveClass, n.linkExactActiveClass, 'router-link-exact-active')]:
            s.isExactActive
        }));
      return () => {
        const o = t.default && R1(t.default(s));
        return e.custom
          ? o
          : Zo(
              'a',
              {
                'aria-current': s.isExactActive ? e.ariaCurrentValue : null,
                href: s.href,
                onClick: s.navigate,
                class: i.value
              },
              o
            );
      };
    }
  }),
  M1 = D1;
function I1(e) {
  if (
    !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
    !e.defaultPrevented &&
    !(e.button !== void 0 && e.button !== 0)
  ) {
    if (e.currentTarget && e.currentTarget.getAttribute) {
      const t = e.currentTarget.getAttribute('target');
      if (/\b_blank\b/i.test(t)) return;
    }
    return (e.preventDefault && e.preventDefault(), !0);
  }
}
function L1(e, t) {
  for (const s in t) {
    const n = t[s],
      i = e[s];
    if (typeof n == 'string') {
      if (n !== i) return !1;
    } else if (!Rs(i) || i.length !== n.length || n.some((o, r) => o.valueOf() !== i[r].valueOf()))
      return !1;
  }
  return !0;
}
function gf(e) {
  return e ? (e.aliasOf ? e.aliasOf.path : e.path) : '';
}
const bf = (e, t, s) => e ?? t ?? s,
  N1 = Ja({
    name: 'RouterView',
    inheritAttrs: !1,
    props: { name: { type: String, default: 'default' }, route: Object },
    compatConfig: { MODE: 3 },
    setup(e, { attrs: t, slots: s }) {
      const n = pn(Kc),
        i = ls(() => e.route || n.value),
        o = pn(lf, 0),
        r = ls(() => {
          let c = Ot(o);
          const { matched: h } = i.value;
          let f;
          for (; (f = h[c]) && !f.components; ) c++;
          return c;
        }),
        a = ls(() => i.value.matched[r.value]);
      (da(
        lf,
        ls(() => r.value + 1)
      ),
        da(u1, a),
        da(Kc, i));
      const l = de();
      return (
        Mo(
          () => [l.value, a.value, e.name],
          ([c, h, f], [m, g, _]) => {
            (h &&
              ((h.instances[f] = c),
              g &&
                g !== h &&
                c &&
                c === m &&
                (h.leaveGuards.size || (h.leaveGuards = g.leaveGuards),
                h.updateGuards.size || (h.updateGuards = g.updateGuards))),
              c &&
                h &&
                (!g || !Gi(h, g) || !m) &&
                (h.enterCallbacks[f] || []).forEach((y) => y(c)));
          },
          { flush: 'post' }
        ),
        () => {
          const c = i.value,
            h = e.name,
            f = a.value,
            m = f && f.components[h];
          if (!m) return _f(s.default, { Component: m, route: c });
          const g = f.props[h],
            _ = g ? (g === !0 ? c.params : typeof g == 'function' ? g(c) : g) : null,
            x = Zo(
              m,
              Kt({}, _, t, {
                onVnodeUnmounted: (w) => {
                  w.component.isUnmounted && (f.instances[h] = null);
                },
                ref: l
              })
            );
          return _f(s.default, { Component: x, route: c }) || x;
        }
      );
    }
  });
function _f(e, t) {
  if (!e) return null;
  const s = e(t);
  return s.length === 1 ? s[0] : s;
}
const $1 = N1;
function F1(e) {
  const t = T1(e.routes, e),
    s = e.parseQuery || c1,
    n = e.stringifyQuery || af,
    i = e.history,
    o = fo(),
    r = fo(),
    a = fo(),
    l = bd(kn);
  let c = kn;
  $i &&
    e.scrollBehavior &&
    'scrollRestoration' in history &&
    (history.scrollRestoration = 'manual');
  const h = ac.bind(null, (U) => '' + U),
    f = ac.bind(null, Kx),
    m = ac.bind(null, Qo);
  function g(U, it) {
    let B, ut;
    return (yg(U) ? ((B = t.getRecordMatcher(U)), (ut = it)) : (ut = U), t.addRoute(ut, B));
  }
  function _(U) {
    const it = t.getRecordMatcher(U);
    it && t.removeRoute(it);
  }
  function y() {
    return t.getRoutes().map((U) => U.record);
  }
  function x(U) {
    return !!t.getRecordMatcher(U);
  }
  function w(U, it) {
    if (((it = Kt({}, it || l.value)), typeof U == 'string')) {
      const O = lc(s, U, it.path),
        V = t.resolve({ path: O.path }, it),
        z = i.createHref(O.fullPath);
      return Kt(O, V, { params: m(V.params), hash: Qo(O.hash), redirectedFrom: void 0, href: z });
    }
    let B;
    if (U.path != null) B = Kt({}, U, { path: lc(s, U.path, it.path).path });
    else {
      const O = Kt({}, U.params);
      for (const V in O) O[V] == null && delete O[V];
      ((B = Kt({}, U, { params: f(O) })), (it.params = f(it.params)));
    }
    const ut = t.resolve(B, it),
      Nt = U.hash || '';
    ut.params = h(m(ut.params));
    const S = Xx(n, Kt({}, U, { hash: Hx(Nt), path: ut.path })),
      k = i.createHref(S);
    return Kt({ fullPath: S, hash: Nt, query: n === af ? d1(U.query) : U.query || {} }, ut, {
      redirectedFrom: void 0,
      href: k
    });
  }
  function C(U) {
    return typeof U == 'string' ? lc(s, U, l.value.path) : Kt({}, U);
  }
  function T(U, it) {
    if (c !== U) return Xi(pe.NAVIGATION_CANCELLED, { from: it, to: U });
  }
  function E(U) {
    return $(U);
  }
  function M(U) {
    return E(Kt(C(U), { replace: !0 }));
  }
  function H(U, it) {
    const B = U.matched[U.matched.length - 1];
    if (B && B.redirect) {
      const { redirect: ut } = B;
      let Nt = typeof ut == 'function' ? ut(U, it) : ut;
      return (
        typeof Nt == 'string' &&
          ((Nt = Nt.includes('?') || Nt.includes('#') ? (Nt = C(Nt)) : { path: Nt }),
          (Nt.params = {})),
        Kt({ query: U.query, hash: U.hash, params: Nt.path != null ? {} : U.params }, Nt)
      );
    }
  }
  function $(U, it) {
    const B = (c = w(U)),
      ut = l.value,
      Nt = U.state,
      S = U.force,
      k = U.replace === !0,
      O = H(B, ut);
    if (O)
      return $(
        Kt(C(O), { state: typeof O == 'object' ? Kt({}, Nt, O.state) : Nt, force: S, replace: k }),
        it || B
      );
    const V = B;
    V.redirectedFrom = it;
    let z;
    return (
      !S &&
        Yx(n, ut, B) &&
        ((z = Xi(pe.NAVIGATION_DUPLICATED, { to: V, from: ut })), F(ut, ut, !0, !1)),
      (z ? Promise.resolve(z) : et(V, ut))
        .catch((j) => (tn(j) ? (tn(j, pe.NAVIGATION_GUARD_REDIRECT) ? j : _e(j)) : ft(j, V, ut)))
        .then((j) => {
          if (j) {
            if (tn(j, pe.NAVIGATION_GUARD_REDIRECT))
              return $(
                Kt({ replace: k }, C(j.to), {
                  state: typeof j.to == 'object' ? Kt({}, Nt, j.to.state) : Nt,
                  force: S
                }),
                it || V
              );
          } else j = Z(V, ut, !0, k, Nt);
          return (ot(V, ut, j), j);
        })
    );
  }
  function X(U, it) {
    const B = T(U, it);
    return B ? Promise.reject(B) : Promise.resolve();
  }
  function G(U) {
    const it = ue.values().next().value;
    return it && typeof it.runWithContext == 'function' ? it.runWithContext(U) : U();
  }
  function et(U, it) {
    let B;
    const [ut, Nt, S] = h1(U, it);
    B = dc(ut.reverse(), 'beforeRouteLeave', U, it);
    for (const O of ut)
      O.leaveGuards.forEach((V) => {
        B.push(On(V, U, it));
      });
    const k = X.bind(null, U, it);
    return (
      B.push(k),
      re(B)
        .then(() => {
          B = [];
          for (const O of o.list()) B.push(On(O, U, it));
          return (B.push(k), re(B));
        })
        .then(() => {
          B = dc(Nt, 'beforeRouteUpdate', U, it);
          for (const O of Nt)
            O.updateGuards.forEach((V) => {
              B.push(On(V, U, it));
            });
          return (B.push(k), re(B));
        })
        .then(() => {
          B = [];
          for (const O of S)
            if (O.beforeEnter)
              if (Rs(O.beforeEnter)) for (const V of O.beforeEnter) B.push(On(V, U, it));
              else B.push(On(O.beforeEnter, U, it));
          return (B.push(k), re(B));
        })
        .then(
          () => (
            U.matched.forEach((O) => (O.enterCallbacks = {})),
            (B = dc(S, 'beforeRouteEnter', U, it, G)),
            B.push(k),
            re(B)
          )
        )
        .then(() => {
          B = [];
          for (const O of r.list()) B.push(On(O, U, it));
          return (B.push(k), re(B));
        })
        .catch((O) => (tn(O, pe.NAVIGATION_CANCELLED) ? O : Promise.reject(O)))
    );
  }
  function ot(U, it, B) {
    a.list().forEach((ut) => G(() => ut(U, it, B)));
  }
  function Z(U, it, B, ut, Nt) {
    const S = T(U, it);
    if (S) return S;
    const k = it === kn,
      O = $i ? history.state : {};
    (B &&
      (ut || k
        ? i.replace(U.fullPath, Kt({ scroll: k && O && O.scroll }, Nt))
        : i.push(U.fullPath, Nt)),
      (l.value = U),
      F(U, it, B, k),
      _e());
  }
  let q;
  function dt() {
    q ||
      (q = i.listen((U, it, B) => {
        if (!oe.listening) return;
        const ut = w(U),
          Nt = H(ut, oe.currentRoute.value);
        if (Nt) {
          $(Kt(Nt, { replace: !0, force: !0 }), ut).catch(Fo);
          return;
        }
        c = ut;
        const S = l.value;
        ($i && i1(rf(S.fullPath, B.delta), sl()),
          et(ut, S)
            .catch((k) =>
              tn(k, pe.NAVIGATION_ABORTED | pe.NAVIGATION_CANCELLED)
                ? k
                : tn(k, pe.NAVIGATION_GUARD_REDIRECT)
                  ? ($(Kt(C(k.to), { force: !0 }), ut)
                      .then((O) => {
                        tn(O, pe.NAVIGATION_ABORTED | pe.NAVIGATION_DUPLICATED) &&
                          !B.delta &&
                          B.type === zc.pop &&
                          i.go(-1, !1);
                      })
                      .catch(Fo),
                    Promise.reject())
                  : (B.delta && i.go(-B.delta, !1), ft(k, ut, S))
            )
            .then((k) => {
              ((k = k || Z(ut, S, !1)),
                k &&
                  (B.delta && !tn(k, pe.NAVIGATION_CANCELLED)
                    ? i.go(-B.delta, !1)
                    : B.type === zc.pop &&
                      tn(k, pe.NAVIGATION_ABORTED | pe.NAVIGATION_DUPLICATED) &&
                      i.go(-1, !1)),
                ot(ut, S, k));
            })
            .catch(Fo));
      }));
  }
  let At = fo(),
    lt = fo(),
    ht;
  function ft(U, it, B) {
    _e(U);
    const ut = lt.list();
    return (ut.length ? ut.forEach((Nt) => Nt(U, it, B)) : console.error(U), Promise.reject(U));
  }
  function Vt() {
    return ht && l.value !== kn
      ? Promise.resolve()
      : new Promise((U, it) => {
          At.add([U, it]);
        });
  }
  function _e(U) {
    return (
      ht || ((ht = !U), dt(), At.list().forEach(([it, B]) => (U ? B(U) : it())), At.reset()),
      U
    );
  }
  function F(U, it, B, ut) {
    const { scrollBehavior: Nt } = e;
    if (!$i || !Nt) return Promise.resolve();
    const S =
      (!B && o1(rf(U.fullPath, 0))) ||
      ((ut || !B) && history.state && history.state.scroll) ||
      null;
    return Ya()
      .then(() => Nt(U, it, S))
      .then((k) => k && n1(k))
      .catch((k) => ft(k, U, it));
  }
  const Ut = (U) => i.go(U);
  let Se;
  const ue = new Set(),
    oe = {
      currentRoute: l,
      listening: !0,
      addRoute: g,
      removeRoute: _,
      clearRoutes: t.clearRoutes,
      hasRoute: x,
      getRoutes: y,
      resolve: w,
      options: e,
      push: E,
      replace: M,
      go: Ut,
      back: () => Ut(-1),
      forward: () => Ut(1),
      beforeEach: o.add,
      beforeResolve: r.add,
      afterEach: a.add,
      onError: lt.add,
      isReady: Vt,
      install(U) {
        (U.component('RouterLink', M1),
          U.component('RouterView', $1),
          (U.config.globalProperties.$router = oe),
          Object.defineProperty(U.config.globalProperties, '$route', {
            enumerable: !0,
            get: () => Ot(l)
          }),
          $i && !Se && l.value === kn && ((Se = !0), E(i.location).catch((ut) => {})));
        const it = {};
        for (const ut in kn)
          Object.defineProperty(it, ut, { get: () => l.value[ut], enumerable: !0 });
        (U.provide(Td, oe), U.provide(xg, Tm(it)), U.provide(Kc, l));
        const B = U.unmount;
        (ue.add(U),
          (U.unmount = function () {
            (ue.delete(U),
              ue.size < 1 && ((c = kn), q && q(), (q = null), (l.value = kn), (Se = !1), (ht = !1)),
              B());
          }));
      }
    };
  function re(U) {
    return U.reduce((it, B) => it.then(() => G(B)), Promise.resolve());
  }
  return oe;
}
function Cg(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
const { toString: B1 } = Object.prototype,
  { getPrototypeOf: Ad } = Object,
  { iterator: nl, toStringTag: Tg } = Symbol,
  il = ((e) => (t) => {
    const s = B1.call(t);
    return e[s] || (e[s] = s.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  Ds = (e) => ((e = e.toLowerCase()), (t) => il(t) === e),
  ol = (e) => (t) => typeof t === e,
  { isArray: eo } = Array,
  Yi = ol('undefined');
function pr(e) {
  return (
    e !== null &&
    !Yi(e) &&
    e.constructor !== null &&
    !Yi(e.constructor) &&
    es(e.constructor.isBuffer) &&
    e.constructor.isBuffer(e)
  );
}
const Ag = Ds('ArrayBuffer');
function U1(e) {
  let t;
  return (
    typeof ArrayBuffer < 'u' && ArrayBuffer.isView
      ? (t = ArrayBuffer.isView(e))
      : (t = e && e.buffer && Ag(e.buffer)),
    t
  );
}
const j1 = ol('string'),
  es = ol('function'),
  Pg = ol('number'),
  mr = (e) => e !== null && typeof e == 'object',
  V1 = (e) => e === !0 || e === !1,
  pa = (e) => {
    if (il(e) !== 'object') return !1;
    const t = Ad(e);
    return (
      (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) &&
      !(Tg in e) &&
      !(nl in e)
    );
  },
  H1 = (e) => {
    if (!mr(e) || pr(e)) return !1;
    try {
      return Object.keys(e).length === 0 && Object.getPrototypeOf(e) === Object.prototype;
    } catch {
      return !1;
    }
  },
  z1 = Ds('Date'),
  W1 = Ds('File'),
  K1 = Ds('Blob'),
  q1 = Ds('FileList'),
  G1 = (e) => mr(e) && es(e.pipe),
  X1 = (e) => {
    let t;
    return (
      e &&
      ((typeof FormData == 'function' && e instanceof FormData) ||
        (es(e.append) &&
          ((t = il(e)) === 'formdata' ||
            (t === 'object' && es(e.toString) && e.toString() === '[object FormData]'))))
    );
  },
  Y1 = Ds('URLSearchParams'),
  [J1, Z1, Q1, tw] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(Ds),
  ew = (e) => (e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''));
function gr(e, t, { allOwnKeys: s = !1 } = {}) {
  if (e === null || typeof e > 'u') return;
  let n, i;
  if ((typeof e != 'object' && (e = [e]), eo(e)))
    for (n = 0, i = e.length; n < i; n++) t.call(null, e[n], n, e);
  else {
    if (pr(e)) return;
    const o = s ? Object.getOwnPropertyNames(e) : Object.keys(e),
      r = o.length;
    let a;
    for (n = 0; n < r; n++) ((a = o[n]), t.call(null, e[a], a, e));
  }
}
function Og(e, t) {
  if (pr(e)) return null;
  t = t.toLowerCase();
  const s = Object.keys(e);
  let n = s.length,
    i;
  for (; n-- > 0; ) if (((i = s[n]), t === i.toLowerCase())) return i;
  return null;
}
const ai =
    typeof globalThis < 'u'
      ? globalThis
      : typeof self < 'u'
        ? self
        : typeof window < 'u'
          ? window
          : global,
  Eg = (e) => !Yi(e) && e !== ai;
function qc() {
  const { caseless: e, skipUndefined: t } = (Eg(this) && this) || {},
    s = {},
    n = (i, o) => {
      if (o === '__proto__' || o === 'constructor' || o === 'prototype') return;
      const r = (e && Og(s, o)) || o;
      pa(s[r]) && pa(i)
        ? (s[r] = qc(s[r], i))
        : pa(i)
          ? (s[r] = qc({}, i))
          : eo(i)
            ? (s[r] = i.slice())
            : (!t || !Yi(i)) && (s[r] = i);
    };
  for (let i = 0, o = arguments.length; i < o; i++) arguments[i] && gr(arguments[i], n);
  return s;
}
const sw = (e, t, s, { allOwnKeys: n } = {}) => (
    gr(
      t,
      (i, o) => {
        s && es(i)
          ? Object.defineProperty(e, o, {
              value: Cg(i, s),
              writable: !0,
              enumerable: !0,
              configurable: !0
            })
          : Object.defineProperty(e, o, {
              value: i,
              writable: !0,
              enumerable: !0,
              configurable: !0
            });
      },
      { allOwnKeys: n }
    ),
    e
  ),
  nw = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e),
  iw = (e, t, s, n) => {
    ((e.prototype = Object.create(t.prototype, n)),
      Object.defineProperty(e.prototype, 'constructor', {
        value: e,
        writable: !0,
        enumerable: !1,
        configurable: !0
      }),
      Object.defineProperty(e, 'super', { value: t.prototype }),
      s && Object.assign(e.prototype, s));
  },
  ow = (e, t, s, n) => {
    let i, o, r;
    const a = {};
    if (((t = t || {}), e == null)) return t;
    do {
      for (i = Object.getOwnPropertyNames(e), o = i.length; o-- > 0; )
        ((r = i[o]), (!n || n(r, e, t)) && !a[r] && ((t[r] = e[r]), (a[r] = !0)));
      e = s !== !1 && Ad(e);
    } while (e && (!s || s(e, t)) && e !== Object.prototype);
    return t;
  },
  rw = (e, t, s) => {
    ((e = String(e)), (s === void 0 || s > e.length) && (s = e.length), (s -= t.length));
    const n = e.indexOf(t, s);
    return n !== -1 && n === s;
  },
  aw = (e) => {
    if (!e) return null;
    if (eo(e)) return e;
    let t = e.length;
    if (!Pg(t)) return null;
    const s = new Array(t);
    for (; t-- > 0; ) s[t] = e[t];
    return s;
  },
  lw = (
    (e) => (t) =>
      e && t instanceof e
  )(typeof Uint8Array < 'u' && Ad(Uint8Array)),
  cw = (e, t) => {
    const n = (e && e[nl]).call(e);
    let i;
    for (; (i = n.next()) && !i.done; ) {
      const o = i.value;
      t.call(e, o[0], o[1]);
    }
  },
  dw = (e, t) => {
    let s;
    const n = [];
    for (; (s = e.exec(t)) !== null; ) n.push(s);
    return n;
  },
  uw = Ds('HTMLFormElement'),
  hw = (e) =>
    e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (s, n, i) {
      return n.toUpperCase() + i;
    }),
  yf = (
    ({ hasOwnProperty: e }) =>
    (t, s) =>
      e.call(t, s)
  )(Object.prototype),
  fw = Ds('RegExp'),
  Rg = (e, t) => {
    const s = Object.getOwnPropertyDescriptors(e),
      n = {};
    (gr(s, (i, o) => {
      let r;
      (r = t(i, o, e)) !== !1 && (n[o] = r || i);
    }),
      Object.defineProperties(e, n));
  },
  pw = (e) => {
    Rg(e, (t, s) => {
      if (es(e) && ['arguments', 'caller', 'callee'].indexOf(s) !== -1) return !1;
      const n = e[s];
      if (es(n)) {
        if (((t.enumerable = !1), 'writable' in t)) {
          t.writable = !1;
          return;
        }
        t.set ||
          (t.set = () => {
            throw Error("Can not rewrite read-only method '" + s + "'");
          });
      }
    });
  },
  mw = (e, t) => {
    const s = {},
      n = (i) => {
        i.forEach((o) => {
          s[o] = !0;
        });
      };
    return (eo(e) ? n(e) : n(String(e).split(t)), s);
  },
  gw = () => {},
  bw = (e, t) => (e != null && Number.isFinite((e = +e)) ? e : t);
function _w(e) {
  return !!(e && es(e.append) && e[Tg] === 'FormData' && e[nl]);
}
const yw = (e) => {
    const t = new Array(10),
      s = (n, i) => {
        if (mr(n)) {
          if (t.indexOf(n) >= 0) return;
          if (pr(n)) return n;
          if (!('toJSON' in n)) {
            t[i] = n;
            const o = eo(n) ? [] : {};
            return (
              gr(n, (r, a) => {
                const l = s(r, i + 1);
                !Yi(l) && (o[a] = l);
              }),
              (t[i] = void 0),
              o
            );
          }
        }
        return n;
      };
    return s(e, 0);
  },
  vw = Ds('AsyncFunction'),
  xw = (e) => e && (mr(e) || es(e)) && es(e.then) && es(e.catch),
  Dg = ((e, t) =>
    e
      ? setImmediate
      : t
        ? ((s, n) => (
            ai.addEventListener(
              'message',
              ({ source: i, data: o }) => {
                i === ai && o === s && n.length && n.shift()();
              },
              !1
            ),
            (i) => {
              (n.push(i), ai.postMessage(s, '*'));
            }
          ))(`axios@${Math.random()}`, [])
        : (s) => setTimeout(s))(typeof setImmediate == 'function', es(ai.postMessage)),
  ww =
    typeof queueMicrotask < 'u'
      ? queueMicrotask.bind(ai)
      : (typeof process < 'u' && process.nextTick) || Dg,
  Sw = (e) => e != null && es(e[nl]),
  L = {
    isArray: eo,
    isArrayBuffer: Ag,
    isBuffer: pr,
    isFormData: X1,
    isArrayBufferView: U1,
    isString: j1,
    isNumber: Pg,
    isBoolean: V1,
    isObject: mr,
    isPlainObject: pa,
    isEmptyObject: H1,
    isReadableStream: J1,
    isRequest: Z1,
    isResponse: Q1,
    isHeaders: tw,
    isUndefined: Yi,
    isDate: z1,
    isFile: W1,
    isBlob: K1,
    isRegExp: fw,
    isFunction: es,
    isStream: G1,
    isURLSearchParams: Y1,
    isTypedArray: lw,
    isFileList: q1,
    forEach: gr,
    merge: qc,
    extend: sw,
    trim: ew,
    stripBOM: nw,
    inherits: iw,
    toFlatObject: ow,
    kindOf: il,
    kindOfTest: Ds,
    endsWith: rw,
    toArray: aw,
    forEachEntry: cw,
    matchAll: dw,
    isHTMLForm: uw,
    hasOwnProperty: yf,
    hasOwnProp: yf,
    reduceDescriptors: Rg,
    freezeMethods: pw,
    toObjectSet: mw,
    toCamelCase: hw,
    noop: gw,
    toFiniteNumber: bw,
    findKey: Og,
    global: ai,
    isContextDefined: Eg,
    isSpecCompliantForm: _w,
    toJSONObject: yw,
    isAsyncFn: vw,
    isThenable: xw,
    setImmediate: Dg,
    asap: ww,
    isIterable: Sw
  };
let xt = class Mg extends Error {
  static from(t, s, n, i, o, r) {
    const a = new Mg(t.message, s || t.code, n, i, o);
    return ((a.cause = t), (a.name = t.name), r && Object.assign(a, r), a);
  }
  constructor(t, s, n, i, o) {
    (super(t),
      (this.name = 'AxiosError'),
      (this.isAxiosError = !0),
      s && (this.code = s),
      n && (this.config = n),
      i && (this.request = i),
      o && ((this.response = o), (this.status = o.status)));
  }
  toJSON() {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: L.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
};
xt.ERR_BAD_OPTION_VALUE = 'ERR_BAD_OPTION_VALUE';
xt.ERR_BAD_OPTION = 'ERR_BAD_OPTION';
xt.ECONNABORTED = 'ECONNABORTED';
xt.ETIMEDOUT = 'ETIMEDOUT';
xt.ERR_NETWORK = 'ERR_NETWORK';
xt.ERR_FR_TOO_MANY_REDIRECTS = 'ERR_FR_TOO_MANY_REDIRECTS';
xt.ERR_DEPRECATED = 'ERR_DEPRECATED';
xt.ERR_BAD_RESPONSE = 'ERR_BAD_RESPONSE';
xt.ERR_BAD_REQUEST = 'ERR_BAD_REQUEST';
xt.ERR_CANCELED = 'ERR_CANCELED';
xt.ERR_NOT_SUPPORT = 'ERR_NOT_SUPPORT';
xt.ERR_INVALID_URL = 'ERR_INVALID_URL';
const kw = null;
function Gc(e) {
  return L.isPlainObject(e) || L.isArray(e);
}
function Ig(e) {
  return L.endsWith(e, '[]') ? e.slice(0, -2) : e;
}
function vf(e, t, s) {
  return e
    ? e
        .concat(t)
        .map(function (i, o) {
          return ((i = Ig(i)), !s && o ? '[' + i + ']' : i);
        })
        .join(s ? '.' : '')
    : t;
}
function Cw(e) {
  return L.isArray(e) && !e.some(Gc);
}
const Tw = L.toFlatObject(L, {}, null, function (t) {
  return /^is[A-Z]/.test(t);
});
function rl(e, t, s) {
  if (!L.isObject(e)) throw new TypeError('target must be an object');
  ((t = t || new FormData()),
    (s = L.toFlatObject(s, { metaTokens: !0, dots: !1, indexes: !1 }, !1, function (y, x) {
      return !L.isUndefined(x[y]);
    })));
  const n = s.metaTokens,
    i = s.visitor || h,
    o = s.dots,
    r = s.indexes,
    l = (s.Blob || (typeof Blob < 'u' && Blob)) && L.isSpecCompliantForm(t);
  if (!L.isFunction(i)) throw new TypeError('visitor must be a function');
  function c(_) {
    if (_ === null) return '';
    if (L.isDate(_)) return _.toISOString();
    if (L.isBoolean(_)) return _.toString();
    if (!l && L.isBlob(_)) throw new xt('Blob is not supported. Use a Buffer instead.');
    return L.isArrayBuffer(_) || L.isTypedArray(_)
      ? l && typeof Blob == 'function'
        ? new Blob([_])
        : Buffer.from(_)
      : _;
  }
  function h(_, y, x) {
    let w = _;
    if (_ && !x && typeof _ == 'object') {
      if (L.endsWith(y, '{}')) ((y = n ? y : y.slice(0, -2)), (_ = JSON.stringify(_)));
      else if (
        (L.isArray(_) && Cw(_)) ||
        ((L.isFileList(_) || L.endsWith(y, '[]')) && (w = L.toArray(_)))
      )
        return (
          (y = Ig(y)),
          w.forEach(function (T, E) {
            !(L.isUndefined(T) || T === null) &&
              t.append(r === !0 ? vf([y], E, o) : r === null ? y : y + '[]', c(T));
          }),
          !1
        );
    }
    return Gc(_) ? !0 : (t.append(vf(x, y, o), c(_)), !1);
  }
  const f = [],
    m = Object.assign(Tw, { defaultVisitor: h, convertValue: c, isVisitable: Gc });
  function g(_, y) {
    if (!L.isUndefined(_)) {
      if (f.indexOf(_) !== -1) throw Error('Circular reference detected in ' + y.join('.'));
      (f.push(_),
        L.forEach(_, function (w, C) {
          (!(L.isUndefined(w) || w === null) &&
            i.call(t, w, L.isString(C) ? C.trim() : C, y, m)) === !0 && g(w, y ? y.concat(C) : [C]);
        }),
        f.pop());
    }
  }
  if (!L.isObject(e)) throw new TypeError('data must be an object');
  return (g(e), t);
}
function xf(e) {
  const t = { '!': '%21', "'": '%27', '(': '%28', ')': '%29', '~': '%7E', '%20': '+', '%00': '\0' };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (n) {
    return t[n];
  });
}
function Pd(e, t) {
  ((this._pairs = []), e && rl(e, this, t));
}
const Lg = Pd.prototype;
Lg.append = function (t, s) {
  this._pairs.push([t, s]);
};
Lg.toString = function (t) {
  const s = t
    ? function (n) {
        return t.call(this, n, xf);
      }
    : xf;
  return this._pairs
    .map(function (i) {
      return s(i[0]) + '=' + s(i[1]);
    }, '')
    .join('&');
};
function Aw(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+');
}
function Ng(e, t, s) {
  if (!t) return e;
  const n = (s && s.encode) || Aw,
    i = L.isFunction(s) ? { serialize: s } : s,
    o = i && i.serialize;
  let r;
  if (
    (o ? (r = o(t, i)) : (r = L.isURLSearchParams(t) ? t.toString() : new Pd(t, i).toString(n)), r)
  ) {
    const a = e.indexOf('#');
    (a !== -1 && (e = e.slice(0, a)), (e += (e.indexOf('?') === -1 ? '?' : '&') + r));
  }
  return e;
}
class wf {
  constructor() {
    this.handlers = [];
  }
  use(t, s, n) {
    return (
      this.handlers.push({
        fulfilled: t,
        rejected: s,
        synchronous: n ? n.synchronous : !1,
        runWhen: n ? n.runWhen : null
      }),
      this.handlers.length - 1
    );
  }
  eject(t) {
    this.handlers[t] && (this.handlers[t] = null);
  }
  clear() {
    this.handlers && (this.handlers = []);
  }
  forEach(t) {
    L.forEach(this.handlers, function (n) {
      n !== null && t(n);
    });
  }
}
const Od = {
    silentJSONParsing: !0,
    forcedJSONParsing: !0,
    clarifyTimeoutError: !1,
    legacyInterceptorReqResOrdering: !0
  },
  Pw = typeof URLSearchParams < 'u' ? URLSearchParams : Pd,
  Ow = typeof FormData < 'u' ? FormData : null,
  Ew = typeof Blob < 'u' ? Blob : null,
  Rw = {
    isBrowser: !0,
    classes: { URLSearchParams: Pw, FormData: Ow, Blob: Ew },
    protocols: ['http', 'https', 'file', 'blob', 'url', 'data']
  },
  Ed = typeof window < 'u' && typeof document < 'u',
  Xc = (typeof navigator == 'object' && navigator) || void 0,
  Dw = Ed && (!Xc || ['ReactNative', 'NativeScript', 'NS'].indexOf(Xc.product) < 0),
  Mw =
    typeof WorkerGlobalScope < 'u' &&
    self instanceof WorkerGlobalScope &&
    typeof self.importScripts == 'function',
  Iw = (Ed && window.location.href) || 'http://localhost',
  Lw = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        hasBrowserEnv: Ed,
        hasStandardBrowserEnv: Dw,
        hasStandardBrowserWebWorkerEnv: Mw,
        navigator: Xc,
        origin: Iw
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  ),
  Ne = { ...Lw, ...Rw };
function Nw(e, t) {
  return rl(e, new Ne.classes.URLSearchParams(), {
    visitor: function (s, n, i, o) {
      return Ne.isNode && L.isBuffer(s)
        ? (this.append(n, s.toString('base64')), !1)
        : o.defaultVisitor.apply(this, arguments);
    },
    ...t
  });
}
function $w(e) {
  return L.matchAll(/\w+|\[(\w*)]/g, e).map((t) => (t[0] === '[]' ? '' : t[1] || t[0]));
}
function Fw(e) {
  const t = {},
    s = Object.keys(e);
  let n;
  const i = s.length;
  let o;
  for (n = 0; n < i; n++) ((o = s[n]), (t[o] = e[o]));
  return t;
}
function $g(e) {
  function t(s, n, i, o) {
    let r = s[o++];
    if (r === '__proto__') return !0;
    const a = Number.isFinite(+r),
      l = o >= s.length;
    return (
      (r = !r && L.isArray(i) ? i.length : r),
      l
        ? (L.hasOwnProp(i, r) ? (i[r] = [i[r], n]) : (i[r] = n), !a)
        : ((!i[r] || !L.isObject(i[r])) && (i[r] = []),
          t(s, n, i[r], o) && L.isArray(i[r]) && (i[r] = Fw(i[r])),
          !a)
    );
  }
  if (L.isFormData(e) && L.isFunction(e.entries)) {
    const s = {};
    return (
      L.forEachEntry(e, (n, i) => {
        t($w(n), i, s, 0);
      }),
      s
    );
  }
  return null;
}
function Bw(e, t, s) {
  if (L.isString(e))
    try {
      return ((t || JSON.parse)(e), L.trim(e));
    } catch (n) {
      if (n.name !== 'SyntaxError') throw n;
    }
  return (s || JSON.stringify)(e);
}
const br = {
  transitional: Od,
  adapter: ['xhr', 'http', 'fetch'],
  transformRequest: [
    function (t, s) {
      const n = s.getContentType() || '',
        i = n.indexOf('application/json') > -1,
        o = L.isObject(t);
      if ((o && L.isHTMLForm(t) && (t = new FormData(t)), L.isFormData(t)))
        return i ? JSON.stringify($g(t)) : t;
      if (
        L.isArrayBuffer(t) ||
        L.isBuffer(t) ||
        L.isStream(t) ||
        L.isFile(t) ||
        L.isBlob(t) ||
        L.isReadableStream(t)
      )
        return t;
      if (L.isArrayBufferView(t)) return t.buffer;
      if (L.isURLSearchParams(t))
        return (
          s.setContentType('application/x-www-form-urlencoded;charset=utf-8', !1),
          t.toString()
        );
      let a;
      if (o) {
        if (n.indexOf('application/x-www-form-urlencoded') > -1)
          return Nw(t, this.formSerializer).toString();
        if ((a = L.isFileList(t)) || n.indexOf('multipart/form-data') > -1) {
          const l = this.env && this.env.FormData;
          return rl(a ? { 'files[]': t } : t, l && new l(), this.formSerializer);
        }
      }
      return o || i ? (s.setContentType('application/json', !1), Bw(t)) : t;
    }
  ],
  transformResponse: [
    function (t) {
      const s = this.transitional || br.transitional,
        n = s && s.forcedJSONParsing,
        i = this.responseType === 'json';
      if (L.isResponse(t) || L.isReadableStream(t)) return t;
      if (t && L.isString(t) && ((n && !this.responseType) || i)) {
        const r = !(s && s.silentJSONParsing) && i;
        try {
          return JSON.parse(t, this.parseReviver);
        } catch (a) {
          if (r)
            throw a.name === 'SyntaxError'
              ? xt.from(a, xt.ERR_BAD_RESPONSE, this, null, this.response)
              : a;
        }
      }
      return t;
    }
  ],
  timeout: 0,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  maxContentLength: -1,
  maxBodyLength: -1,
  env: { FormData: Ne.classes.FormData, Blob: Ne.classes.Blob },
  validateStatus: function (t) {
    return t >= 200 && t < 300;
  },
  headers: { common: { Accept: 'application/json, text/plain, */*', 'Content-Type': void 0 } }
};
L.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (e) => {
  br.headers[e] = {};
});
const Uw = L.toObjectSet([
    'age',
    'authorization',
    'content-length',
    'content-type',
    'etag',
    'expires',
    'from',
    'host',
    'if-modified-since',
    'if-unmodified-since',
    'last-modified',
    'location',
    'max-forwards',
    'proxy-authorization',
    'referer',
    'retry-after',
    'user-agent'
  ]),
  jw = (e) => {
    const t = {};
    let s, n, i;
    return (
      e &&
        e
          .split(
            `
`
          )
          .forEach(function (r) {
            ((i = r.indexOf(':')),
              (s = r.substring(0, i).trim().toLowerCase()),
              (n = r.substring(i + 1).trim()),
              !(!s || (t[s] && Uw[s])) &&
                (s === 'set-cookie'
                  ? t[s]
                    ? t[s].push(n)
                    : (t[s] = [n])
                  : (t[s] = t[s] ? t[s] + ', ' + n : n)));
          }),
      t
    );
  },
  Sf = Symbol('internals');
function po(e) {
  return e && String(e).trim().toLowerCase();
}
function ma(e) {
  return e === !1 || e == null ? e : L.isArray(e) ? e.map(ma) : String(e);
}
function Vw(e) {
  const t = Object.create(null),
    s = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let n;
  for (; (n = s.exec(e)); ) t[n[1]] = n[2];
  return t;
}
const Hw = (e) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
function uc(e, t, s, n, i) {
  if (L.isFunction(n)) return n.call(this, t, s);
  if ((i && (t = s), !!L.isString(t))) {
    if (L.isString(n)) return t.indexOf(n) !== -1;
    if (L.isRegExp(n)) return n.test(t);
  }
}
function zw(e) {
  return e
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (t, s, n) => s.toUpperCase() + n);
}
function Ww(e, t) {
  const s = L.toCamelCase(' ' + t);
  ['get', 'set', 'has'].forEach((n) => {
    Object.defineProperty(e, n + s, {
      value: function (i, o, r) {
        return this[n].call(this, t, i, o, r);
      },
      configurable: !0
    });
  });
}
let ss = class {
  constructor(t) {
    t && this.set(t);
  }
  set(t, s, n) {
    const i = this;
    function o(a, l, c) {
      const h = po(l);
      if (!h) throw new Error('header name must be a non-empty string');
      const f = L.findKey(i, h);
      (!f || i[f] === void 0 || c === !0 || (c === void 0 && i[f] !== !1)) && (i[f || l] = ma(a));
    }
    const r = (a, l) => L.forEach(a, (c, h) => o(c, h, l));
    if (L.isPlainObject(t) || t instanceof this.constructor) r(t, s);
    else if (L.isString(t) && (t = t.trim()) && !Hw(t)) r(jw(t), s);
    else if (L.isObject(t) && L.isIterable(t)) {
      let a = {},
        l,
        c;
      for (const h of t) {
        if (!L.isArray(h)) throw TypeError('Object iterator must return a key-value pair');
        a[(c = h[0])] = (l = a[c]) ? (L.isArray(l) ? [...l, h[1]] : [l, h[1]]) : h[1];
      }
      r(a, s);
    } else t != null && o(s, t, n);
    return this;
  }
  get(t, s) {
    if (((t = po(t)), t)) {
      const n = L.findKey(this, t);
      if (n) {
        const i = this[n];
        if (!s) return i;
        if (s === !0) return Vw(i);
        if (L.isFunction(s)) return s.call(this, i, n);
        if (L.isRegExp(s)) return s.exec(i);
        throw new TypeError('parser must be boolean|regexp|function');
      }
    }
  }
  has(t, s) {
    if (((t = po(t)), t)) {
      const n = L.findKey(this, t);
      return !!(n && this[n] !== void 0 && (!s || uc(this, this[n], n, s)));
    }
    return !1;
  }
  delete(t, s) {
    const n = this;
    let i = !1;
    function o(r) {
      if (((r = po(r)), r)) {
        const a = L.findKey(n, r);
        a && (!s || uc(n, n[a], a, s)) && (delete n[a], (i = !0));
      }
    }
    return (L.isArray(t) ? t.forEach(o) : o(t), i);
  }
  clear(t) {
    const s = Object.keys(this);
    let n = s.length,
      i = !1;
    for (; n--; ) {
      const o = s[n];
      (!t || uc(this, this[o], o, t, !0)) && (delete this[o], (i = !0));
    }
    return i;
  }
  normalize(t) {
    const s = this,
      n = {};
    return (
      L.forEach(this, (i, o) => {
        const r = L.findKey(n, o);
        if (r) {
          ((s[r] = ma(i)), delete s[o]);
          return;
        }
        const a = t ? zw(o) : String(o).trim();
        (a !== o && delete s[o], (s[a] = ma(i)), (n[a] = !0));
      }),
      this
    );
  }
  concat(...t) {
    return this.constructor.concat(this, ...t);
  }
  toJSON(t) {
    const s = Object.create(null);
    return (
      L.forEach(this, (n, i) => {
        n != null && n !== !1 && (s[i] = t && L.isArray(n) ? n.join(', ') : n);
      }),
      s
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([t, s]) => t + ': ' + s).join(`
`);
  }
  getSetCookie() {
    return this.get('set-cookie') || [];
  }
  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }
  static from(t) {
    return t instanceof this ? t : new this(t);
  }
  static concat(t, ...s) {
    const n = new this(t);
    return (s.forEach((i) => n.set(i)), n);
  }
  static accessor(t) {
    const n = (this[Sf] = this[Sf] = { accessors: {} }).accessors,
      i = this.prototype;
    function o(r) {
      const a = po(r);
      n[a] || (Ww(i, r), (n[a] = !0));
    }
    return (L.isArray(t) ? t.forEach(o) : o(t), this);
  }
};
ss.accessor([
  'Content-Type',
  'Content-Length',
  'Accept',
  'Accept-Encoding',
  'User-Agent',
  'Authorization'
]);
L.reduceDescriptors(ss.prototype, ({ value: e }, t) => {
  let s = t[0].toUpperCase() + t.slice(1);
  return {
    get: () => e,
    set(n) {
      this[s] = n;
    }
  };
});
L.freezeMethods(ss);
function hc(e, t) {
  const s = this || br,
    n = t || s,
    i = ss.from(n.headers);
  let o = n.data;
  return (
    L.forEach(e, function (a) {
      o = a.call(s, o, i.normalize(), t ? t.status : void 0);
    }),
    i.normalize(),
    o
  );
}
function Fg(e) {
  return !!(e && e.__CANCEL__);
}
let _r = class extends xt {
  constructor(t, s, n) {
    (super(t ?? 'canceled', xt.ERR_CANCELED, s, n),
      (this.name = 'CanceledError'),
      (this.__CANCEL__ = !0));
  }
};
function Bg(e, t, s) {
  const n = s.config.validateStatus;
  !s.status || !n || n(s.status)
    ? e(s)
    : t(
        new xt(
          'Request failed with status code ' + s.status,
          [xt.ERR_BAD_REQUEST, xt.ERR_BAD_RESPONSE][Math.floor(s.status / 100) - 4],
          s.config,
          s.request,
          s
        )
      );
}
function Kw(e) {
  const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return (t && t[1]) || '';
}
function qw(e, t) {
  e = e || 10;
  const s = new Array(e),
    n = new Array(e);
  let i = 0,
    o = 0,
    r;
  return (
    (t = t !== void 0 ? t : 1e3),
    function (l) {
      const c = Date.now(),
        h = n[o];
      (r || (r = c), (s[i] = l), (n[i] = c));
      let f = o,
        m = 0;
      for (; f !== i; ) ((m += s[f++]), (f = f % e));
      if (((i = (i + 1) % e), i === o && (o = (o + 1) % e), c - r < t)) return;
      const g = h && c - h;
      return g ? Math.round((m * 1e3) / g) : void 0;
    }
  );
}
function Gw(e, t) {
  let s = 0,
    n = 1e3 / t,
    i,
    o;
  const r = (c, h = Date.now()) => {
    ((s = h), (i = null), o && (clearTimeout(o), (o = null)), e(...c));
  };
  return [
    (...c) => {
      const h = Date.now(),
        f = h - s;
      f >= n
        ? r(c, h)
        : ((i = c),
          o ||
            (o = setTimeout(() => {
              ((o = null), r(i));
            }, n - f)));
    },
    () => i && r(i)
  ];
}
const Ea = (e, t, s = 3) => {
    let n = 0;
    const i = qw(50, 250);
    return Gw((o) => {
      const r = o.loaded,
        a = o.lengthComputable ? o.total : void 0,
        l = r - n,
        c = i(l),
        h = r <= a;
      n = r;
      const f = {
        loaded: r,
        total: a,
        progress: a ? r / a : void 0,
        bytes: l,
        rate: c || void 0,
        estimated: c && a && h ? (a - r) / c : void 0,
        event: o,
        lengthComputable: a != null,
        [t ? 'download' : 'upload']: !0
      };
      e(f);
    }, s);
  },
  kf = (e, t) => {
    const s = e != null;
    return [(n) => t[0]({ lengthComputable: s, total: e, loaded: n }), t[1]];
  },
  Cf =
    (e) =>
    (...t) =>
      L.asap(() => e(...t)),
  Xw = Ne.hasStandardBrowserEnv
    ? ((e, t) => (s) => (
        (s = new URL(s, Ne.origin)),
        e.protocol === s.protocol && e.host === s.host && (t || e.port === s.port)
      ))(new URL(Ne.origin), Ne.navigator && /(msie|trident)/i.test(Ne.navigator.userAgent))
    : () => !0,
  Yw = Ne.hasStandardBrowserEnv
    ? {
        write(e, t, s, n, i, o, r) {
          if (typeof document > 'u') return;
          const a = [`${e}=${encodeURIComponent(t)}`];
          (L.isNumber(s) && a.push(`expires=${new Date(s).toUTCString()}`),
            L.isString(n) && a.push(`path=${n}`),
            L.isString(i) && a.push(`domain=${i}`),
            o === !0 && a.push('secure'),
            L.isString(r) && a.push(`SameSite=${r}`),
            (document.cookie = a.join('; ')));
        },
        read(e) {
          if (typeof document > 'u') return null;
          const t = document.cookie.match(new RegExp('(?:^|; )' + e + '=([^;]*)'));
          return t ? decodeURIComponent(t[1]) : null;
        },
        remove(e) {
          this.write(e, '', Date.now() - 864e5, '/');
        }
      }
    : {
        write() {},
        read() {
          return null;
        },
        remove() {}
      };
function Jw(e) {
  return typeof e != 'string' ? !1 : /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function Zw(e, t) {
  return t ? e.replace(/\/?\/$/, '') + '/' + t.replace(/^\/+/, '') : e;
}
function Ug(e, t, s) {
  let n = !Jw(t);
  return e && (n || s == !1) ? Zw(e, t) : t;
}
const Tf = (e) => (e instanceof ss ? { ...e } : e);
function mi(e, t) {
  t = t || {};
  const s = {};
  function n(c, h, f, m) {
    return L.isPlainObject(c) && L.isPlainObject(h)
      ? L.merge.call({ caseless: m }, c, h)
      : L.isPlainObject(h)
        ? L.merge({}, h)
        : L.isArray(h)
          ? h.slice()
          : h;
  }
  function i(c, h, f, m) {
    if (L.isUndefined(h)) {
      if (!L.isUndefined(c)) return n(void 0, c, f, m);
    } else return n(c, h, f, m);
  }
  function o(c, h) {
    if (!L.isUndefined(h)) return n(void 0, h);
  }
  function r(c, h) {
    if (L.isUndefined(h)) {
      if (!L.isUndefined(c)) return n(void 0, c);
    } else return n(void 0, h);
  }
  function a(c, h, f) {
    if (f in t) return n(c, h);
    if (f in e) return n(void 0, c);
  }
  const l = {
    url: o,
    method: o,
    data: o,
    baseURL: r,
    transformRequest: r,
    transformResponse: r,
    paramsSerializer: r,
    timeout: r,
    timeoutMessage: r,
    withCredentials: r,
    withXSRFToken: r,
    adapter: r,
    responseType: r,
    xsrfCookieName: r,
    xsrfHeaderName: r,
    onUploadProgress: r,
    onDownloadProgress: r,
    decompress: r,
    maxContentLength: r,
    maxBodyLength: r,
    beforeRedirect: r,
    transport: r,
    httpAgent: r,
    httpsAgent: r,
    cancelToken: r,
    socketPath: r,
    responseEncoding: r,
    validateStatus: a,
    headers: (c, h, f) => i(Tf(c), Tf(h), f, !0)
  };
  return (
    L.forEach(Object.keys({ ...e, ...t }), function (h) {
      if (h === '__proto__' || h === 'constructor' || h === 'prototype') return;
      const f = L.hasOwnProp(l, h) ? l[h] : i,
        m = f(e[h], t[h], h);
      (L.isUndefined(m) && f !== a) || (s[h] = m);
    }),
    s
  );
}
const jg = (e) => {
    const t = mi({}, e);
    let {
      data: s,
      withXSRFToken: n,
      xsrfHeaderName: i,
      xsrfCookieName: o,
      headers: r,
      auth: a
    } = t;
    if (
      ((t.headers = r = ss.from(r)),
      (t.url = Ng(Ug(t.baseURL, t.url, t.allowAbsoluteUrls), e.params, e.paramsSerializer)),
      a &&
        r.set(
          'Authorization',
          'Basic ' +
            btoa(
              (a.username || '') +
                ':' +
                (a.password ? unescape(encodeURIComponent(a.password)) : '')
            )
        ),
      L.isFormData(s))
    ) {
      if (Ne.hasStandardBrowserEnv || Ne.hasStandardBrowserWebWorkerEnv) r.setContentType(void 0);
      else if (L.isFunction(s.getHeaders)) {
        const l = s.getHeaders(),
          c = ['content-type', 'content-length'];
        Object.entries(l).forEach(([h, f]) => {
          c.includes(h.toLowerCase()) && r.set(h, f);
        });
      }
    }
    if (
      Ne.hasStandardBrowserEnv &&
      (n && L.isFunction(n) && (n = n(t)), n || (n !== !1 && Xw(t.url)))
    ) {
      const l = i && o && Yw.read(o);
      l && r.set(i, l);
    }
    return t;
  },
  Qw = typeof XMLHttpRequest < 'u',
  tS =
    Qw &&
    function (e) {
      return new Promise(function (s, n) {
        const i = jg(e);
        let o = i.data;
        const r = ss.from(i.headers).normalize();
        let { responseType: a, onUploadProgress: l, onDownloadProgress: c } = i,
          h,
          f,
          m,
          g,
          _;
        function y() {
          (g && g(),
            _ && _(),
            i.cancelToken && i.cancelToken.unsubscribe(h),
            i.signal && i.signal.removeEventListener('abort', h));
        }
        let x = new XMLHttpRequest();
        (x.open(i.method.toUpperCase(), i.url, !0), (x.timeout = i.timeout));
        function w() {
          if (!x) return;
          const T = ss.from('getAllResponseHeaders' in x && x.getAllResponseHeaders()),
            M = {
              data: !a || a === 'text' || a === 'json' ? x.responseText : x.response,
              status: x.status,
              statusText: x.statusText,
              headers: T,
              config: e,
              request: x
            };
          (Bg(
            function ($) {
              (s($), y());
            },
            function ($) {
              (n($), y());
            },
            M
          ),
            (x = null));
        }
        ('onloadend' in x
          ? (x.onloadend = w)
          : (x.onreadystatechange = function () {
              !x ||
                x.readyState !== 4 ||
                (x.status === 0 && !(x.responseURL && x.responseURL.indexOf('file:') === 0)) ||
                setTimeout(w);
            }),
          (x.onabort = function () {
            x && (n(new xt('Request aborted', xt.ECONNABORTED, e, x)), (x = null));
          }),
          (x.onerror = function (E) {
            const M = E && E.message ? E.message : 'Network Error',
              H = new xt(M, xt.ERR_NETWORK, e, x);
            ((H.event = E || null), n(H), (x = null));
          }),
          (x.ontimeout = function () {
            let E = i.timeout ? 'timeout of ' + i.timeout + 'ms exceeded' : 'timeout exceeded';
            const M = i.transitional || Od;
            (i.timeoutErrorMessage && (E = i.timeoutErrorMessage),
              n(new xt(E, M.clarifyTimeoutError ? xt.ETIMEDOUT : xt.ECONNABORTED, e, x)),
              (x = null));
          }),
          o === void 0 && r.setContentType(null),
          'setRequestHeader' in x &&
            L.forEach(r.toJSON(), function (E, M) {
              x.setRequestHeader(M, E);
            }),
          L.isUndefined(i.withCredentials) || (x.withCredentials = !!i.withCredentials),
          a && a !== 'json' && (x.responseType = i.responseType),
          c && (([m, _] = Ea(c, !0)), x.addEventListener('progress', m)),
          l &&
            x.upload &&
            (([f, g] = Ea(l)),
            x.upload.addEventListener('progress', f),
            x.upload.addEventListener('loadend', g)),
          (i.cancelToken || i.signal) &&
            ((h = (T) => {
              x && (n(!T || T.type ? new _r(null, e, x) : T), x.abort(), (x = null));
            }),
            i.cancelToken && i.cancelToken.subscribe(h),
            i.signal && (i.signal.aborted ? h() : i.signal.addEventListener('abort', h))));
        const C = Kw(i.url);
        if (C && Ne.protocols.indexOf(C) === -1) {
          n(new xt('Unsupported protocol ' + C + ':', xt.ERR_BAD_REQUEST, e));
          return;
        }
        x.send(o || null);
      });
    },
  eS = (e, t) => {
    const { length: s } = (e = e ? e.filter(Boolean) : []);
    if (t || s) {
      let n = new AbortController(),
        i;
      const o = function (c) {
        if (!i) {
          ((i = !0), a());
          const h = c instanceof Error ? c : this.reason;
          n.abort(h instanceof xt ? h : new _r(h instanceof Error ? h.message : h));
        }
      };
      let r =
        t &&
        setTimeout(() => {
          ((r = null), o(new xt(`timeout of ${t}ms exceeded`, xt.ETIMEDOUT)));
        }, t);
      const a = () => {
        e &&
          (r && clearTimeout(r),
          (r = null),
          e.forEach((c) => {
            c.unsubscribe ? c.unsubscribe(o) : c.removeEventListener('abort', o);
          }),
          (e = null));
      };
      e.forEach((c) => c.addEventListener('abort', o));
      const { signal: l } = n;
      return ((l.unsubscribe = () => L.asap(a)), l);
    }
  },
  sS = function* (e, t) {
    let s = e.byteLength;
    if (s < t) {
      yield e;
      return;
    }
    let n = 0,
      i;
    for (; n < s; ) ((i = n + t), yield e.slice(n, i), (n = i));
  },
  nS = async function* (e, t) {
    for await (const s of iS(e)) yield* sS(s, t);
  },
  iS = async function* (e) {
    if (e[Symbol.asyncIterator]) {
      yield* e;
      return;
    }
    const t = e.getReader();
    try {
      for (;;) {
        const { done: s, value: n } = await t.read();
        if (s) break;
        yield n;
      }
    } finally {
      await t.cancel();
    }
  },
  Af = (e, t, s, n) => {
    const i = nS(e, t);
    let o = 0,
      r,
      a = (l) => {
        r || ((r = !0), n && n(l));
      };
    return new ReadableStream(
      {
        async pull(l) {
          try {
            const { done: c, value: h } = await i.next();
            if (c) {
              (a(), l.close());
              return;
            }
            let f = h.byteLength;
            if (s) {
              let m = (o += f);
              s(m);
            }
            l.enqueue(new Uint8Array(h));
          } catch (c) {
            throw (a(c), c);
          }
        },
        cancel(l) {
          return (a(l), i.return());
        }
      },
      { highWaterMark: 2 }
    );
  },
  Pf = 64 * 1024,
  { isFunction: qr } = L,
  oS = (({ Request: e, Response: t }) => ({ Request: e, Response: t }))(L.global),
  { ReadableStream: Of, TextEncoder: Ef } = L.global,
  Rf = (e, ...t) => {
    try {
      return !!e(...t);
    } catch {
      return !1;
    }
  },
  rS = (e) => {
    e = L.merge.call({ skipUndefined: !0 }, oS, e);
    const { fetch: t, Request: s, Response: n } = e,
      i = t ? qr(t) : typeof fetch == 'function',
      o = qr(s),
      r = qr(n);
    if (!i) return !1;
    const a = i && qr(Of),
      l =
        i &&
        (typeof Ef == 'function'
          ? (
              (_) => (y) =>
                _.encode(y)
            )(new Ef())
          : async (_) => new Uint8Array(await new s(_).arrayBuffer())),
      c =
        o &&
        a &&
        Rf(() => {
          let _ = !1;
          const y = new s(Ne.origin, {
            body: new Of(),
            method: 'POST',
            get duplex() {
              return ((_ = !0), 'half');
            }
          }).headers.has('Content-Type');
          return _ && !y;
        }),
      h = r && a && Rf(() => L.isReadableStream(new n('').body)),
      f = { stream: h && ((_) => _.body) };
    i &&
      ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach((_) => {
        !f[_] &&
          (f[_] = (y, x) => {
            let w = y && y[_];
            if (w) return w.call(y);
            throw new xt(`Response type '${_}' is not supported`, xt.ERR_NOT_SUPPORT, x);
          });
      });
    const m = async (_) => {
        if (_ == null) return 0;
        if (L.isBlob(_)) return _.size;
        if (L.isSpecCompliantForm(_))
          return (await new s(Ne.origin, { method: 'POST', body: _ }).arrayBuffer()).byteLength;
        if (L.isArrayBufferView(_) || L.isArrayBuffer(_)) return _.byteLength;
        if ((L.isURLSearchParams(_) && (_ = _ + ''), L.isString(_))) return (await l(_)).byteLength;
      },
      g = async (_, y) => {
        const x = L.toFiniteNumber(_.getContentLength());
        return x ?? m(y);
      };
    return async (_) => {
      let {
          url: y,
          method: x,
          data: w,
          signal: C,
          cancelToken: T,
          timeout: E,
          onDownloadProgress: M,
          onUploadProgress: H,
          responseType: $,
          headers: X,
          withCredentials: G = 'same-origin',
          fetchOptions: et
        } = jg(_),
        ot = t || fetch;
      $ = $ ? ($ + '').toLowerCase() : 'text';
      let Z = eS([C, T && T.toAbortSignal()], E),
        q = null;
      const dt =
        Z &&
        Z.unsubscribe &&
        (() => {
          Z.unsubscribe();
        });
      let At;
      try {
        if (H && c && x !== 'get' && x !== 'head' && (At = await g(X, w)) !== 0) {
          let F = new s(y, { method: 'POST', body: w, duplex: 'half' }),
            Ut;
          if (
            (L.isFormData(w) && (Ut = F.headers.get('content-type')) && X.setContentType(Ut),
            F.body)
          ) {
            const [Se, ue] = kf(At, Ea(Cf(H)));
            w = Af(F.body, Pf, Se, ue);
          }
        }
        L.isString(G) || (G = G ? 'include' : 'omit');
        const lt = o && 'credentials' in s.prototype,
          ht = {
            ...et,
            signal: Z,
            method: x.toUpperCase(),
            headers: X.normalize().toJSON(),
            body: w,
            duplex: 'half',
            credentials: lt ? G : void 0
          };
        q = o && new s(y, ht);
        let ft = await (o ? ot(q, et) : ot(y, ht));
        const Vt = h && ($ === 'stream' || $ === 'response');
        if (h && (M || (Vt && dt))) {
          const F = {};
          ['status', 'statusText', 'headers'].forEach((oe) => {
            F[oe] = ft[oe];
          });
          const Ut = L.toFiniteNumber(ft.headers.get('content-length')),
            [Se, ue] = (M && kf(Ut, Ea(Cf(M), !0))) || [];
          ft = new n(
            Af(ft.body, Pf, Se, () => {
              (ue && ue(), dt && dt());
            }),
            F
          );
        }
        $ = $ || 'text';
        let _e = await f[L.findKey(f, $) || 'text'](ft, _);
        return (
          !Vt && dt && dt(),
          await new Promise((F, Ut) => {
            Bg(F, Ut, {
              data: _e,
              headers: ss.from(ft.headers),
              status: ft.status,
              statusText: ft.statusText,
              config: _,
              request: q
            });
          })
        );
      } catch (lt) {
        throw (
          dt && dt(),
          lt && lt.name === 'TypeError' && /Load failed|fetch/i.test(lt.message)
            ? Object.assign(new xt('Network Error', xt.ERR_NETWORK, _, q, lt && lt.response), {
                cause: lt.cause || lt
              })
            : xt.from(lt, lt && lt.code, _, q, lt && lt.response)
        );
      }
    };
  },
  aS = new Map(),
  Vg = (e) => {
    let t = (e && e.env) || {};
    const { fetch: s, Request: n, Response: i } = t,
      o = [n, i, s];
    let r = o.length,
      a = r,
      l,
      c,
      h = aS;
    for (; a--; )
      ((l = o[a]), (c = h.get(l)), c === void 0 && h.set(l, (c = a ? new Map() : rS(t))), (h = c));
    return c;
  };
Vg();
const Rd = { http: kw, xhr: tS, fetch: { get: Vg } };
L.forEach(Rd, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, 'name', { value: t });
    } catch {}
    Object.defineProperty(e, 'adapterName', { value: t });
  }
});
const Df = (e) => `- ${e}`,
  lS = (e) => L.isFunction(e) || e === null || e === !1;
function cS(e, t) {
  e = L.isArray(e) ? e : [e];
  const { length: s } = e;
  let n, i;
  const o = {};
  for (let r = 0; r < s; r++) {
    n = e[r];
    let a;
    if (((i = n), !lS(n) && ((i = Rd[(a = String(n)).toLowerCase()]), i === void 0)))
      throw new xt(`Unknown adapter '${a}'`);
    if (i && (L.isFunction(i) || (i = i.get(t)))) break;
    o[a || '#' + r] = i;
  }
  if (!i) {
    const r = Object.entries(o).map(
      ([l, c]) =>
        `adapter ${l} ` +
        (c === !1 ? 'is not supported by the environment' : 'is not available in the build')
    );
    let a = s
      ? r.length > 1
        ? `since :
` +
          r.map(Df).join(`
`)
        : ' ' + Df(r[0])
      : 'as no adapter specified';
    throw new xt('There is no suitable adapter to dispatch the request ' + a, 'ERR_NOT_SUPPORT');
  }
  return i;
}
const Hg = { getAdapter: cS, adapters: Rd };
function fc(e) {
  if ((e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted))
    throw new _r(null, e);
}
function Mf(e) {
  return (
    fc(e),
    (e.headers = ss.from(e.headers)),
    (e.data = hc.call(e, e.transformRequest)),
    ['post', 'put', 'patch'].indexOf(e.method) !== -1 &&
      e.headers.setContentType('application/x-www-form-urlencoded', !1),
    Hg.getAdapter(
      e.adapter || br.adapter,
      e
    )(e).then(
      function (n) {
        return (
          fc(e),
          (n.data = hc.call(e, e.transformResponse, n)),
          (n.headers = ss.from(n.headers)),
          n
        );
      },
      function (n) {
        return (
          Fg(n) ||
            (fc(e),
            n &&
              n.response &&
              ((n.response.data = hc.call(e, e.transformResponse, n.response)),
              (n.response.headers = ss.from(n.response.headers)))),
          Promise.reject(n)
        );
      }
    )
  );
}
const zg = '1.13.5',
  al = {};
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((e, t) => {
  al[e] = function (n) {
    return typeof n === e || 'a' + (t < 1 ? 'n ' : ' ') + e;
  };
});
const If = {};
al.transitional = function (t, s, n) {
  function i(o, r) {
    return '[Axios v' + zg + "] Transitional option '" + o + "'" + r + (n ? '. ' + n : '');
  }
  return (o, r, a) => {
    if (t === !1)
      throw new xt(i(r, ' has been removed' + (s ? ' in ' + s : '')), xt.ERR_DEPRECATED);
    return (
      s &&
        !If[r] &&
        ((If[r] = !0),
        console.warn(
          i(r, ' has been deprecated since v' + s + ' and will be removed in the near future')
        )),
      t ? t(o, r, a) : !0
    );
  };
};
al.spelling = function (t) {
  return (s, n) => (console.warn(`${n} is likely a misspelling of ${t}`), !0);
};
function dS(e, t, s) {
  if (typeof e != 'object') throw new xt('options must be an object', xt.ERR_BAD_OPTION_VALUE);
  const n = Object.keys(e);
  let i = n.length;
  for (; i-- > 0; ) {
    const o = n[i],
      r = t[o];
    if (r) {
      const a = e[o],
        l = a === void 0 || r(a, o, e);
      if (l !== !0) throw new xt('option ' + o + ' must be ' + l, xt.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (s !== !0) throw new xt('Unknown option ' + o, xt.ERR_BAD_OPTION);
  }
}
const ga = { assertOptions: dS, validators: al },
  _s = ga.validators;
let hi = class {
  constructor(t) {
    ((this.defaults = t || {}), (this.interceptors = { request: new wf(), response: new wf() }));
  }
  async request(t, s) {
    try {
      return await this._request(t, s);
    } catch (n) {
      if (n instanceof Error) {
        let i = {};
        Error.captureStackTrace ? Error.captureStackTrace(i) : (i = new Error());
        const o = i.stack ? i.stack.replace(/^.+\n/, '') : '';
        try {
          n.stack
            ? o &&
              !String(n.stack).endsWith(o.replace(/^.+\n.+\n/, '')) &&
              (n.stack +=
                `
` + o)
            : (n.stack = o);
        } catch {}
      }
      throw n;
    }
  }
  _request(t, s) {
    (typeof t == 'string' ? ((s = s || {}), (s.url = t)) : (s = t || {}),
      (s = mi(this.defaults, s)));
    const { transitional: n, paramsSerializer: i, headers: o } = s;
    (n !== void 0 &&
      ga.assertOptions(
        n,
        {
          silentJSONParsing: _s.transitional(_s.boolean),
          forcedJSONParsing: _s.transitional(_s.boolean),
          clarifyTimeoutError: _s.transitional(_s.boolean),
          legacyInterceptorReqResOrdering: _s.transitional(_s.boolean)
        },
        !1
      ),
      i != null &&
        (L.isFunction(i)
          ? (s.paramsSerializer = { serialize: i })
          : ga.assertOptions(i, { encode: _s.function, serialize: _s.function }, !0)),
      s.allowAbsoluteUrls !== void 0 ||
        (this.defaults.allowAbsoluteUrls !== void 0
          ? (s.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls)
          : (s.allowAbsoluteUrls = !0)),
      ga.assertOptions(
        s,
        { baseUrl: _s.spelling('baseURL'), withXsrfToken: _s.spelling('withXSRFToken') },
        !0
      ),
      (s.method = (s.method || this.defaults.method || 'get').toLowerCase()));
    let r = o && L.merge(o.common, o[s.method]);
    (o &&
      L.forEach(['delete', 'get', 'head', 'post', 'put', 'patch', 'common'], (_) => {
        delete o[_];
      }),
      (s.headers = ss.concat(r, o)));
    const a = [];
    let l = !0;
    this.interceptors.request.forEach(function (y) {
      if (typeof y.runWhen == 'function' && y.runWhen(s) === !1) return;
      l = l && y.synchronous;
      const x = s.transitional || Od;
      x && x.legacyInterceptorReqResOrdering
        ? a.unshift(y.fulfilled, y.rejected)
        : a.push(y.fulfilled, y.rejected);
    });
    const c = [];
    this.interceptors.response.forEach(function (y) {
      c.push(y.fulfilled, y.rejected);
    });
    let h,
      f = 0,
      m;
    if (!l) {
      const _ = [Mf.bind(this), void 0];
      for (_.unshift(...a), _.push(...c), m = _.length, h = Promise.resolve(s); f < m; )
        h = h.then(_[f++], _[f++]);
      return h;
    }
    m = a.length;
    let g = s;
    for (; f < m; ) {
      const _ = a[f++],
        y = a[f++];
      try {
        g = _(g);
      } catch (x) {
        y.call(this, x);
        break;
      }
    }
    try {
      h = Mf.call(this, g);
    } catch (_) {
      return Promise.reject(_);
    }
    for (f = 0, m = c.length; f < m; ) h = h.then(c[f++], c[f++]);
    return h;
  }
  getUri(t) {
    t = mi(this.defaults, t);
    const s = Ug(t.baseURL, t.url, t.allowAbsoluteUrls);
    return Ng(s, t.params, t.paramsSerializer);
  }
};
L.forEach(['delete', 'get', 'head', 'options'], function (t) {
  hi.prototype[t] = function (s, n) {
    return this.request(mi(n || {}, { method: t, url: s, data: (n || {}).data }));
  };
});
L.forEach(['post', 'put', 'patch'], function (t) {
  function s(n) {
    return function (o, r, a) {
      return this.request(
        mi(a || {}, {
          method: t,
          headers: n ? { 'Content-Type': 'multipart/form-data' } : {},
          url: o,
          data: r
        })
      );
    };
  }
  ((hi.prototype[t] = s()), (hi.prototype[t + 'Form'] = s(!0)));
});
let uS = class Wg {
  constructor(t) {
    if (typeof t != 'function') throw new TypeError('executor must be a function.');
    let s;
    this.promise = new Promise(function (o) {
      s = o;
    });
    const n = this;
    (this.promise.then((i) => {
      if (!n._listeners) return;
      let o = n._listeners.length;
      for (; o-- > 0; ) n._listeners[o](i);
      n._listeners = null;
    }),
      (this.promise.then = (i) => {
        let o;
        const r = new Promise((a) => {
          (n.subscribe(a), (o = a));
        }).then(i);
        return (
          (r.cancel = function () {
            n.unsubscribe(o);
          }),
          r
        );
      }),
      t(function (o, r, a) {
        n.reason || ((n.reason = new _r(o, r, a)), s(n.reason));
      }));
  }
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  subscribe(t) {
    if (this.reason) {
      t(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(t) : (this._listeners = [t]);
  }
  unsubscribe(t) {
    if (!this._listeners) return;
    const s = this._listeners.indexOf(t);
    s !== -1 && this._listeners.splice(s, 1);
  }
  toAbortSignal() {
    const t = new AbortController(),
      s = (n) => {
        t.abort(n);
      };
    return (this.subscribe(s), (t.signal.unsubscribe = () => this.unsubscribe(s)), t.signal);
  }
  static source() {
    let t;
    return {
      token: new Wg(function (i) {
        t = i;
      }),
      cancel: t
    };
  }
};
function hS(e) {
  return function (s) {
    return e.apply(null, s);
  };
}
function fS(e) {
  return L.isObject(e) && e.isAxiosError === !0;
}
const Yc = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(Yc).forEach(([e, t]) => {
  Yc[t] = e;
});
function Kg(e) {
  const t = new hi(e),
    s = Cg(hi.prototype.request, t);
  return (
    L.extend(s, hi.prototype, t, { allOwnKeys: !0 }),
    L.extend(s, t, null, { allOwnKeys: !0 }),
    (s.create = function (i) {
      return Kg(mi(e, i));
    }),
    s
  );
}
const be = Kg(br);
be.Axios = hi;
be.CanceledError = _r;
be.CancelToken = uS;
be.isCancel = Fg;
be.VERSION = zg;
be.toFormData = rl;
be.AxiosError = xt;
be.Cancel = be.CanceledError;
be.all = function (t) {
  return Promise.all(t);
};
be.spread = hS;
be.isAxiosError = fS;
be.mergeConfig = mi;
be.AxiosHeaders = ss;
be.formToJSON = (e) => $g(L.isHTMLForm(e) ? new FormData(e) : e);
be.getAdapter = Hg.getAdapter;
be.HttpStatusCode = Yc;
be.default = be;
const {
    Axios: AF,
    AxiosError: PF,
    CanceledError: OF,
    isCancel: EF,
    CancelToken: RF,
    VERSION: DF,
    all: MF,
    Cancel: IF,
    isAxiosError: LF,
    spread: NF,
    toFormData: $F,
    AxiosHeaders: FF,
    HttpStatusCode: BF,
    formToJSON: UF,
    getAdapter: jF,
    mergeConfig: VF
  } = be,
  pS = 'http://localhost:5000/api',
  Lt = be.create({ baseURL: pS, headers: { 'Content-Type': 'application/json' } });
Lt.interceptors.request.use(
  (e) => {
    const t = localStorage.getItem('token');
    return (t && (e.headers.Authorization = `Bearer ${t}`), e);
  },
  (e) => Promise.reject(e)
);
Lt.interceptors.response.use(
  (e) => {
    const t = e.data;
    return (
      t &&
        typeof t == 'object' &&
        Object.prototype.hasOwnProperty.call(t, 'success') &&
        Object.prototype.hasOwnProperty.call(t, 'data') &&
        Object.prototype.hasOwnProperty.call(t, 'error') &&
        (e.data = t.data),
      e
    );
  },
  (e) => {
    var s, n;
    const t = (s = e.response) == null ? void 0 : s.data;
    if (
      t &&
      typeof t == 'object' &&
      Object.prototype.hasOwnProperty.call(t, 'success') &&
      Object.prototype.hasOwnProperty.call(t, 'data') &&
      Object.prototype.hasOwnProperty.call(t, 'error')
    ) {
      const i = ((n = t.error) == null ? void 0 : n.message) || 'Request failed';
      e.response.data = { ...t, message: i };
    }
    return Promise.reject(e);
  }
);
const li = {
    login: (e) => Lt.post('/auth/login', e),
    register: (e) => Lt.post('/auth/register', e),
    getMe: () => Lt.get('/auth/me'),
    updateMe: (e) => Lt.put('/auth/me', e),
    listUsers: () => Lt.get('/auth/users'),
    getUser: (e) => Lt.get(`/auth/users/${e}`),
    updateUser: (e, t) => Lt.put(`/auth/users/${e}`, t),
    deleteUser: (e) => Lt.delete(`/auth/users/${e}`)
  },
  Bo = {
    getAll: () => Lt.get('/procurement'),
    create: (e) => Lt.post('/procurement', e),
    getById: (e) => Lt.get(`/procurement/${e}`),
    update: (e, t) => Lt.put(`/procurement/${e}`, t),
    delete: (e) => Lt.delete(`/procurement/${e}`)
  },
  ll = {
    getAll: () => Lt.get('/sales'),
    create: (e) => Lt.post('/sales', e),
    getAggregation: (e = {}) => Lt.get('/sales/aggregation', { params: e }),
    delete: (e) => Lt.delete(`/sales/${e}`)
  },
  tr = {
    getAll: () => Lt.get('/credit-sales'),
    create: (e) => Lt.post('/credit-sales', e),
    updatePaymentStatus: (e, t) => Lt.put(`/credit-sales/${e}/payment`, t),
    repay: (e, t) => Lt.post(`/credit-sales/${e}/repay`, t),
    delete: (e) => Lt.delete(`/credit-sales/${e}`)
  },
  yr = { get: () => Lt.get('/inventory'), checkStock: (e) => Lt.post('/inventory/check-stock', e) },
  Lf = {
    getAll: (e = {}) => Lt.get('/notifications', { params: e }),
    markAsRead: (e) => Lt.put(`/notifications/${e}/read`)
  },
  So = {
    getAll: () => Lt.get('/trusted-buyers'),
    create: (e) => Lt.post('/trusted-buyers', e),
    update: (e, t) => Lt.put(`/trusted-buyers/${e}`, t),
    delete: (e) => Lt.delete(`/trusted-buyers/${e}`)
  },
  ko = {
    getAll: () => Lt.get('/prices'),
    getById: (e) => Lt.get(`/prices/${e}`),
    create: (e) => Lt.post('/prices', e),
    update: (e, t) => Lt.put(`/prices/${e}`, t),
    delete: (e) => Lt.delete(`/prices/${e}`),
    setPrice: (e) => Lt.post('/prices', e)
  },
  mS = {
    name: 'Login',
    data() {
      return {
        credentials: { username: '', password: '' },
        rememberMe: !1,
        showPassword: !1,
        loading: !1,
        error: ''
      };
    },
    methods: {
      async handleLogin() {
        var e, t;
        ((this.loading = !0), (this.error = ''));
        try {
          const s = await li.login(this.credentials),
            { token: n, ...i } = s.data;
          (localStorage.setItem('token', n),
            localStorage.setItem('user', JSON.stringify(i)),
            i.role === 'director'
              ? this.$router.push('/dashboard/director')
              : i.role === 'manager'
                ? this.$router.push('/dashboard/manager')
                : this.$router.push('/dashboard/sales-agent'));
        } catch (s) {
          this.error =
            ((t = (e = s.response) == null ? void 0 : e.data) == null ? void 0 : t.message) ||
            'Login failed';
        } finally {
          this.loading = !1;
        }
      }
    }
  },
  gS = { class: 'login-container d-flex align-items-center justify-content-center min-vh-100' },
  bS = {
    class: 'card shadow-lg border-0 overflow-hidden',
    style: { 'max-width': '900px', width: '100%' }
  },
  _S = { class: 'row g-0' },
  yS = { class: 'col-md-6 bg-white p-5' },
  vS = { class: 'mb-4' },
  xS = { class: 'input-group' },
  wS = { class: 'mb-4' },
  SS = { class: 'input-group' },
  kS = ['type'],
  CS = { class: 'd-flex justify-content-between align-items-center mb-4' },
  TS = { class: 'form-check' },
  AS = { key: 0, class: 'alert alert-danger py-2 small shadow-sm border-0', role: 'alert' },
  PS = ['disabled'],
  OS = { key: 0, class: 'spinner-border spinner-border-sm me-2' };
function ES(e, t, s, n, i, o) {
  return (
    R(),
    D('div', gS, [
      u('div', bS, [
        u('div', _S, [
          t[13] ||
            (t[13] = Uc(
              '<div class="col-md-6 d-none d-md-flex flex-column text-white p-5 login-sidebar position-relative" data-v-fa31e171><div class="d-flex align-items-center position-absolute top-0 start-0 p-5" data-v-fa31e171><div class="bg-white bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center me-3" style="width:48px;height:48px;" data-v-fa31e171><i class="bi bi-box-seam text-white" style="font-size:1.5rem;" data-v-fa31e171></i></div><h2 class="fw-bold mb-0 h5" data-v-fa31e171>Karibu Groceries</h2></div><div class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center mt-5" data-v-fa31e171><h1 class="display-4 fw-bold mb-3" data-v-fa31e171>Welcome Back!</h1><p class="lead mb-0 text-white-50" data-v-fa31e171>Streamline your wholesale produce distribution with our advanced management system.</p></div><div class="text-center text-white-50 small mt-auto" data-v-fa31e171> © 2026 Karibu Groceries LTD </div></div>',
              1
            )),
          u('div', yS, [
            t[12] ||
              (t[12] = Uc(
                '<div class="d-flex align-items-center justify-content-center mb-4 d-md-none" data-v-fa31e171><div class="bg-success rounded-circle d-inline-flex align-items-center justify-content-center me-2" style="width:40px;height:40px;" data-v-fa31e171><i class="bi bi-box-seam text-white" style="font-size:1.2rem;" data-v-fa31e171></i></div><h3 class="fw-bold text-success h4 mb-0" data-v-fa31e171>Karibu Groceries</h3></div><div class="text-center mb-5" data-v-fa31e171><h3 class="fw-bold text-dark" data-v-fa31e171>Sign In</h3><p class="text-muted" data-v-fa31e171>Access your dashboard</p></div>',
                2
              )),
            u(
              'form',
              {
                onSubmit:
                  t[5] || (t[5] = Es((...r) => o.handleLogin && o.handleLogin(...r), ['prevent']))
              },
              [
                u('div', vS, [
                  t[7] ||
                    (t[7] = u(
                      'label',
                      {
                        for: 'username',
                        class: 'form-label small text-uppercase fw-bold text-muted'
                      },
                      'Username',
                      -1
                    )),
                  u('div', xS, [
                    t[6] ||
                      (t[6] = u(
                        'span',
                        { class: 'input-group-text bg-white border-end-0' },
                        [u('i', { class: 'bi bi-person text-muted' })],
                        -1
                      )),
                    bt(
                      u(
                        'input',
                        {
                          type: 'text',
                          class: 'form-control border-start-0 ps-0',
                          id: 'username',
                          'onUpdate:modelValue':
                            t[0] || (t[0] = (r) => (i.credentials.username = r)),
                          required: '',
                          placeholder: 'Enter your username'
                        },
                        null,
                        512
                      ),
                      [[Et, i.credentials.username]]
                    )
                  ])
                ]),
                u('div', wS, [
                  t[9] ||
                    (t[9] = u(
                      'label',
                      {
                        for: 'password',
                        class: 'form-label small text-uppercase fw-bold text-muted'
                      },
                      'Password',
                      -1
                    )),
                  u('div', SS, [
                    t[8] ||
                      (t[8] = u(
                        'span',
                        { class: 'input-group-text bg-white border-end-0' },
                        [u('i', { class: 'bi bi-lock text-muted' })],
                        -1
                      )),
                    bt(
                      u(
                        'input',
                        {
                          type: i.showPassword ? 'text' : 'password',
                          class: 'form-control border-start-0 border-end-0 ps-0',
                          id: 'password',
                          'onUpdate:modelValue':
                            t[1] || (t[1] = (r) => (i.credentials.password = r)),
                          required: '',
                          placeholder: 'Enter your password'
                        },
                        null,
                        8,
                        kS
                      ),
                      [[xx, i.credentials.password]]
                    ),
                    u(
                      'button',
                      {
                        class: 'btn btn-outline-secondary border-start-0 border-start-0 bg-white',
                        type: 'button',
                        onClick: t[2] || (t[2] = (r) => (i.showPassword = !i.showPassword))
                      },
                      [
                        u(
                          'i',
                          { class: vs(i.showPassword ? 'bi bi-eye-slash' : 'bi bi-eye') },
                          null,
                          2
                        )
                      ]
                    )
                  ])
                ]),
                u('div', CS, [
                  u('div', TS, [
                    bt(
                      u(
                        'input',
                        {
                          class: 'form-check-input',
                          type: 'checkbox',
                          id: 'rememberMe',
                          'onUpdate:modelValue': t[3] || (t[3] = (r) => (i.rememberMe = r))
                        },
                        null,
                        512
                      ),
                      [[dg, i.rememberMe]]
                    ),
                    t[10] ||
                      (t[10] = u(
                        'label',
                        { class: 'form-check-label small text-muted', for: 'rememberMe' },
                        ' Remember me ',
                        -1
                      ))
                  ]),
                  u(
                    'a',
                    {
                      href: '#',
                      class: 'small text-decoration-none fw-bold text-success',
                      onClick: t[4] || (t[4] = Es(() => {}, ['prevent']))
                    },
                    'Forgot Password?'
                  )
                ]),
                i.error
                  ? (R(),
                    D('div', AS, [
                      t[11] ||
                        (t[11] = u('i', { class: 'bi bi-exclamation-circle-fill me-2' }, null, -1)),
                      jt(' ' + I(i.error), 1)
                    ]))
                  : mt('', !0),
                u(
                  'button',
                  {
                    type: 'submit',
                    class: 'btn btn-success w-100 py-2 fw-bold shadow-sm',
                    disabled: i.loading
                  },
                  [
                    i.loading ? (R(), D('span', OS)) : mt('', !0),
                    jt(' ' + I(i.loading ? 'Signing in...' : 'Sign In'), 1)
                  ],
                  8,
                  PS
                )
              ],
              32
            )
          ])
        ])
      ])
    ])
  );
}
const RS = we(mS, [
    ['render', ES],
    ['__scopeId', 'data-v-fa31e171']
  ]),
  DS = {
    name: 'DashboardLayout',
    data() {
      return {
        user: {},
        outOfStockCount: 0,
        stockAlertDismissed: !1,
        stockNotifications: [],
        stockMonitorIntervalId: null,
        mobileSidebarOpen: !1,
        showLogoutModal: !1,
        managerSectionOpen: { operations: !0, records: !1, administration: !1 }
      };
    },
    computed: {
      currentYear() {
        return new Date().getFullYear();
      },
      roleLabel() {
        return (
          { director: 'Director', manager: 'Manager', sales_agent: 'Sales Agent' }[
            this.user.role
          ] || ''
        );
      },
      navItems() {
        const e = [];
        return (
          this.user.role === 'director'
            ? e.push(
                { path: '/dashboard/director', icon: 'bi bi-graph-up', label: 'Dashboard' },
                { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
              )
            : this.user.role === 'manager'
              ? e.push(
                  { path: '/dashboard/manager', icon: 'bi bi-graph-up', label: 'Dashboard' },
                  { path: '/dashboard/inventory', icon: 'bi bi-box', label: 'Inventory' },
                  { path: '/dashboard/procurement', icon: 'bi bi-file-text', label: 'Procurement' },
                  { path: '/dashboard/sales', icon: 'bi bi-cart', label: 'Sales' },
                  {
                    path: '/dashboard/credit-sales',
                    icon: 'bi bi-credit-card',
                    label: 'Credit Sales'
                  },
                  {
                    path: '/dashboard/credit-sales-records',
                    icon: 'bi bi-journal-text',
                    label: 'Credit Sales Records'
                  },
                  {
                    path: '/dashboard/price-management',
                    icon: 'bi bi-tags',
                    label: 'Price Management'
                  },
                  {
                    path: '/dashboard/procurement-records',
                    icon: 'bi bi-card-list',
                    label: 'Procurement Records'
                  },
                  {
                    path: '/dashboard/trusted-buyers',
                    icon: 'bi bi-person-check',
                    label: 'Trusted Buyers'
                  },
                  { path: '/dashboard/users', icon: 'bi bi-people', label: 'Users' },
                  { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
                )
              : this.user.role === 'sales_agent' &&
                e.push(
                  { path: '/dashboard/sales-agent', icon: 'bi bi-graph-up', label: 'Dashboard' },
                  { path: '/dashboard/inventory', icon: 'bi bi-box', label: 'Inventory' },
                  { path: '/dashboard/sales', icon: 'bi bi-cart', label: 'Sales' },
                  {
                    path: '/dashboard/credit-sales',
                    icon: 'bi bi-credit-card',
                    label: 'Credit Sales'
                  },
                  {
                    path: '/dashboard/credit-sales-records',
                    icon: 'bi bi-journal-text',
                    label: 'Credit Sales Records'
                  },
                  { path: '/dashboard/profile', icon: 'bi bi-person-circle', label: 'Profile' }
                ),
          e
        );
      },
      mainNavItems() {
        return this.navItems.filter((e) => e.path);
      },
      managerNavSections() {
        const e = new Map(this.mainNavItems.map((s) => [s.path, s])),
          t = (s) => s.map((n) => e.get(n)).filter(Boolean);
        return [
          {
            key: 'operations',
            label: 'Operations',
            items: t([
              '/dashboard/manager',
              '/dashboard/inventory',
              '/dashboard/procurement',
              '/dashboard/sales',
              '/dashboard/credit-sales'
            ])
          },
          {
            key: 'records',
            label: 'Records',
            items: t(['/dashboard/credit-sales-records', '/dashboard/procurement-records'])
          },
          {
            key: 'administration',
            label: 'Administration',
            items: t([
              '/dashboard/price-management',
              '/dashboard/trusted-buyers',
              '/dashboard/users',
              '/dashboard/profile'
            ])
          }
        ].filter((s) => s.items.length > 0);
      }
    },
    watch: {
      '$route.path'() {
        this.ensureActiveManagerSectionOpen();
      }
    },
    created() {
      ((this.user = JSON.parse(localStorage.getItem('user') || '{}')),
        this.user.role === 'manager' &&
          (this.loadStockAlert(),
          this.loadStockNotifications(),
          this.ensureActiveManagerSectionOpen()));
    },
    mounted() {
      (window.addEventListener('resize', this.handleViewportResize),
        window.addEventListener('user-updated', this.syncUserFromStorage),
        this.user.role === 'manager' && this.startStockMonitor());
    },
    beforeUnmount() {
      (window.removeEventListener('resize', this.handleViewportResize),
        window.removeEventListener('user-updated', this.syncUserFromStorage),
        this.stopStockMonitor());
    },
    methods: {
      syncUserFromStorage() {
        const e = this.user.role;
        ((this.user = JSON.parse(localStorage.getItem('user') || '{}')),
          this.user.role === 'manager' &&
            e !== 'manager' &&
            (this.loadStockAlert(), this.loadStockNotifications(), this.startStockMonitor()),
          this.user.role !== 'manager' &&
            e === 'manager' &&
            (this.stopStockMonitor(), (this.stockNotifications = [])));
      },
      openLogoutModal() {
        this.showLogoutModal = !0;
      },
      closeLogoutModal() {
        this.showLogoutModal = !1;
      },
      confirmLogout() {
        (this.closeMobileSidebar(),
          this.closeLogoutModal(),
          localStorage.removeItem('token'),
          localStorage.removeItem('user'),
          this.$router.push('/'));
      },
      toggleMobileSidebar() {
        this.mobileSidebarOpen = !this.mobileSidebarOpen;
      },
      closeMobileSidebar() {
        this.mobileSidebarOpen = !1;
      },
      handleViewportResize() {
        window.innerWidth >= 768 && this.mobileSidebarOpen && (this.mobileSidebarOpen = !1);
      },
      isManagerSectionOpen(e) {
        return this.managerSectionOpen[e] === !0;
      },
      toggleManagerSection(e) {
        this.managerSectionOpen[e] = !this.isManagerSectionOpen(e);
      },
      ensureActiveManagerSectionOpen() {
        if (this.user.role !== 'manager') return;
        const e = this.managerNavSections.find((t) =>
          t.items.some((s) => this.$route.path === s.path)
        );
        e && (this.managerSectionOpen[e.key] = !0);
      },
      async loadStockAlert() {
        try {
          const t = (await yr.get()).data.outOfStockItems || [];
          this.outOfStockCount = t.length;
        } catch (e) {
          console.error('Failed to load stock alert:', e);
        }
      },
      dismissStockAlert() {
        this.stockAlertDismissed = !0;
      },
      startStockMonitor() {
        (this.stopStockMonitor(),
          (this.stockMonitorIntervalId = window.setInterval(() => {
            (this.loadStockAlert(), this.loadStockNotifications());
          }, 6e4)));
      },
      stopStockMonitor() {
        this.stockMonitorIntervalId &&
          (window.clearInterval(this.stockMonitorIntervalId), (this.stockMonitorIntervalId = null));
      },
      async loadStockNotifications() {
        try {
          const e = await Lf.getAll({ unread: !0 });
          this.stockNotifications = e.data || [];
        } catch (e) {
          console.error('Failed to load stock notifications:', e);
        }
      },
      async markNotificationRead(e) {
        try {
          (await Lf.markAsRead(e),
            (this.stockNotifications = this.stockNotifications.filter((t) => t._id !== e)));
        } catch (t) {
          console.error('Failed to acknowledge notification:', t);
        }
      },
      async markAllNotificationsRead() {
        const e = this.stockNotifications.map((t) => t._id);
        for (let t = 0; t < e.length; t += 1) await this.markNotificationRead(e[t]);
      },
      formatNotificationTime(e) {
        if (!e) return '';
        const t = new Date(e);
        return Number.isNaN(t.getTime())
          ? ''
          : t.toLocaleString('en-UG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
      }
    }
  },
  MS = { class: 'navbar navbar-expand-lg navbar-light bg-white border-bottom app-header' },
  IS = { class: 'container-fluid px-4' },
  LS = { class: 'd-flex align-items-center' },
  NS = { class: 'container-fluid' },
  $S = { class: 'layout' },
  FS = { class: 'sidebar-inner' },
  BS = { class: 'sidebar-brand' },
  US = { class: 'sidebar-brand-icon' },
  jS = ['src'],
  VS = { key: 1, class: 'bi bi-person-badge' },
  HS = { class: 'sidebar-brand-text' },
  zS = { class: 'sidebar-brand-name' },
  WS = { class: 'sidebar-brand-meta' },
  KS = ['onClick'],
  qS = { key: 0, class: 'nav flex-column sidebar-nav' },
  GS = { key: 1, class: 'nav flex-column sidebar-nav' },
  XS = { class: 'sidebar-footer' },
  YS = { class: 'nav flex-column sidebar-nav' },
  JS = { class: 'nav-item' },
  ZS = { class: 'main-content px-md-4 py-4' },
  QS = { class: 'main-content-body' },
  tk = {
    key: 0,
    class: 'alert alert-warning d-flex align-items-start justify-content-between gap-3'
  },
  ek = { class: 'w-100' },
  sk = { class: 'mt-2' },
  nk = { class: 'd-flex align-items-center gap-2' },
  ik = { class: 'text-muted' },
  ok = ['onClick'],
  rk = {
    key: 1,
    class: 'alert alert-danger d-flex align-items-center justify-content-between mt-3'
  },
  ak = { class: 'd-flex align-items-center gap-2' },
  lk = { class: 'dashboard-footer' },
  ck = { class: 'dashboard-footer-inner' },
  dk = { class: 'modal-card' },
  uk = { class: 'modal-header' },
  hk = { class: 'modal-body' },
  fk = { class: 'd-flex justify-content-end gap-2' };
function pk(e, t, s, n, i, o) {
  const r = Ks('router-link'),
    a = Ks('router-view');
  return (
    R(),
    D('div', null, [
      u('nav', MS, [
        u('div', IS, [
          u('div', LS, [
            u(
              'button',
              {
                type: 'button',
                class: 'btn btn-outline-secondary d-md-none me-3 sidebar-toggle-btn',
                onClick:
                  t[0] || (t[0] = (...l) => o.toggleMobileSidebar && o.toggleMobileSidebar(...l))
              },
              [...(t[9] || (t[9] = [u('i', { class: 'bi bi-list' }, null, -1)]))]
            ),
            t[10] ||
              (t[10] = u(
                'div',
                {
                  class:
                    'bg-success rounded-circle d-inline-flex align-items-center justify-content-center me-3',
                  style: { width: '40px', height: '40px' }
                },
                [u('i', { class: 'bi bi-box-seam text-white' })],
                -1
              )),
            t[11] ||
              (t[11] = u(
                'div',
                null,
                [u('span', { class: 'navbar-brand mb-0 h5' }, 'Karibu Groceries LTD')],
                -1
              ))
          ]),
          t[12] || (t[12] = u('div', null, null, -1))
        ])
      ]),
      u('div', NS, [
        u('div', $S, [
          u(
            'nav',
            { class: vs(['sidebar', { 'is-open': i.mobileSidebarOpen }]) },
            [
              u('div', FS, [
                u('div', BS, [
                  u('div', US, [
                    i.user.profileImage
                      ? (R(),
                        D(
                          'img',
                          {
                            key: 0,
                            src: i.user.profileImage,
                            alt: 'User profile image',
                            class: 'sidebar-avatar'
                          },
                          null,
                          8,
                          jS
                        ))
                      : (R(), D('i', VS))
                  ]),
                  u('div', HS, [
                    u('div', zS, I(i.user.name || 'User Session'), 1),
                    u('div', WS, I(o.roleLabel) + I(i.user.branch ? ` - ${i.user.branch}` : ''), 1)
                  ])
                ]),
                t[14] || (t[14] = u('div', { class: 'sidebar-title' }, 'Navigation', -1)),
                i.user.role === 'manager'
                  ? (R(!0),
                    D(
                      ne,
                      { key: 0 },
                      Ce(
                        o.managerNavSections,
                        (l) => (
                          R(),
                          D('div', { key: l.key, class: 'sidebar-group' }, [
                            u(
                              'button',
                              {
                                type: 'button',
                                class: 'sidebar-group-toggle btn btn-link text-start w-100',
                                onClick: (c) => o.toggleManagerSection(l.key)
                              },
                              [
                                u('span', null, I(l.label), 1),
                                u(
                                  'i',
                                  {
                                    class: vs([
                                      'bi',
                                      o.isManagerSectionOpen(l.key)
                                        ? 'bi-chevron-up'
                                        : 'bi-chevron-down'
                                    ])
                                  },
                                  null,
                                  2
                                )
                              ],
                              8,
                              KS
                            ),
                            o.isManagerSectionOpen(l.key)
                              ? (R(),
                                D('ul', qS, [
                                  (R(!0),
                                  D(
                                    ne,
                                    null,
                                    Ce(
                                      l.items,
                                      (c) => (
                                        R(),
                                        D('li', { class: 'nav-item', key: c.path }, [
                                          Rt(
                                            r,
                                            {
                                              to: c.path,
                                              class: 'nav-link sidebar-link',
                                              'active-class': 'active',
                                              onClick: o.closeMobileSidebar
                                            },
                                            {
                                              default: Do(() => [
                                                u('i', { class: vs(c.icon) }, null, 2),
                                                jt(' ' + I(c.label), 1)
                                              ]),
                                              _: 2
                                            },
                                            1032,
                                            ['to', 'onClick']
                                          )
                                        ])
                                      )
                                    ),
                                    128
                                  ))
                                ]))
                              : mt('', !0)
                          ])
                        )
                      ),
                      128
                    ))
                  : (R(),
                    D('ul', GS, [
                      (R(!0),
                      D(
                        ne,
                        null,
                        Ce(
                          o.mainNavItems,
                          (l) => (
                            R(),
                            D('li', { class: 'nav-item', key: l.path }, [
                              Rt(
                                r,
                                {
                                  to: l.path,
                                  class: 'nav-link sidebar-link',
                                  'active-class': 'active',
                                  onClick: o.closeMobileSidebar
                                },
                                {
                                  default: Do(() => [
                                    u('i', { class: vs(l.icon) }, null, 2),
                                    jt(' ' + I(l.label), 1)
                                  ]),
                                  _: 2
                                },
                                1032,
                                ['to', 'onClick']
                              )
                            ])
                          )
                        ),
                        128
                      ))
                    ])),
                u('div', XS, [
                  u('ul', YS, [
                    u('li', JS, [
                      u(
                        'button',
                        {
                          type: 'button',
                          class:
                            'nav-link sidebar-link sidebar-link-danger btn btn-link text-start w-100',
                          onClick:
                            t[1] || (t[1] = (...l) => o.openLogoutModal && o.openLogoutModal(...l))
                        },
                        [
                          ...(t[13] ||
                            (t[13] = [
                              u('i', { class: 'bi bi-box-arrow-right' }, null, -1),
                              jt(' Logout ', -1)
                            ]))
                        ]
                      )
                    ])
                  ])
                ])
              ])
            ],
            2
          ),
          i.mobileSidebarOpen
            ? (R(),
              D('div', {
                key: 0,
                class: 'sidebar-backdrop d-md-none',
                onClick:
                  t[2] || (t[2] = (...l) => o.closeMobileSidebar && o.closeMobileSidebar(...l))
              }))
            : mt('', !0),
          u('main', ZS, [
            u('div', QS, [
              i.user.role === 'manager' && i.stockNotifications.length > 0
                ? (R(),
                  D('div', tk, [
                    u('div', ek, [
                      t[15] || (t[15] = u('strong', null, 'Stock Notifications:', -1)),
                      u('div', sk, [
                        (R(!0),
                        D(
                          ne,
                          null,
                          Ce(
                            i.stockNotifications,
                            (l) => (
                              R(),
                              D(
                                'div',
                                {
                                  key: l._id,
                                  class:
                                    'd-flex flex-wrap align-items-center justify-content-between border-top pt-2 mt-2'
                                },
                                [
                                  u('span', null, I(l.message), 1),
                                  u('div', nk, [
                                    u('small', ik, I(o.formatNotificationTime(l.createdAt)), 1),
                                    u(
                                      'button',
                                      {
                                        type: 'button',
                                        class: 'btn btn-sm btn-outline-secondary',
                                        onClick: (c) => o.markNotificationRead(l._id)
                                      },
                                      ' Acknowledge ',
                                      8,
                                      ok
                                    )
                                  ])
                                ]
                              )
                            )
                          ),
                          128
                        ))
                      ])
                    ]),
                    u(
                      'button',
                      {
                        type: 'button',
                        class: 'btn btn-sm btn-outline-dark',
                        onClick:
                          t[3] ||
                          (t[3] = (...l) =>
                            o.markAllNotificationsRead && o.markAllNotificationsRead(...l))
                      },
                      ' Acknowledge All '
                    )
                  ]))
                : mt('', !0),
              i.user.role === 'manager' && i.outOfStockCount > 0 && !i.stockAlertDismissed
                ? (R(),
                  D('div', rk, [
                    u('div', null, [
                      t[16] || (t[16] = u('strong', null, 'Out of Stock:', -1)),
                      jt(' ' + I(i.outOfStockCount) + ' item(s) need restocking. ', 1)
                    ]),
                    u('div', ak, [
                      Rt(
                        r,
                        { class: 'btn btn-light btn-sm', to: '/dashboard/inventory' },
                        {
                          default: Do(() => [...(t[17] || (t[17] = [jt(' View Inventory ', -1)]))]),
                          _: 1
                        }
                      ),
                      u('button', {
                        type: 'button',
                        class: 'btn-close',
                        onClick:
                          t[4] ||
                          (t[4] = (...l) => o.dismissStockAlert && o.dismissStockAlert(...l))
                      })
                    ])
                  ]))
                : mt('', !0),
              Rt(a)
            ]),
            u('footer', lk, [
              u('div', ck, [
                t[18] || (t[18] = u('span', { class: 'footer-brand' }, 'Karibu Groceries LTD', -1)),
                t[19] || (t[19] = u('span', { class: 'footer-divider' }, '|', -1)),
                t[20] || (t[20] = u('span', null, 'Wholesale Produce Management System', -1)),
                t[21] || (t[21] = u('span', { class: 'footer-divider' }, '|', -1)),
                u('span', null, '© ' + I(o.currentYear), 1)
              ])
            ])
          ])
        ])
      ]),
      i.showLogoutModal
        ? (R(),
          D(
            'div',
            {
              key: 0,
              class: 'modal-mask',
              onClick:
                t[8] ||
                (t[8] = Es((...l) => o.closeLogoutModal && o.closeLogoutModal(...l), ['self']))
            },
            [
              u('div', dk, [
                u('div', uk, [
                  t[22] || (t[22] = u('h5', { class: 'mb-0' }, 'Confirm Logout', -1)),
                  u('button', {
                    type: 'button',
                    class: 'btn-close',
                    onClick:
                      t[5] || (t[5] = (...l) => o.closeLogoutModal && o.closeLogoutModal(...l))
                  })
                ]),
                u('div', hk, [
                  t[23] ||
                    (t[23] = u('p', { class: 'mb-4' }, 'Are you sure you want to logout?', -1)),
                  u('div', fk, [
                    u(
                      'button',
                      {
                        type: 'button',
                        class: 'btn btn-outline-secondary',
                        onClick:
                          t[6] || (t[6] = (...l) => o.closeLogoutModal && o.closeLogoutModal(...l))
                      },
                      ' Cancel '
                    ),
                    u(
                      'button',
                      {
                        type: 'button',
                        class: 'btn btn-danger',
                        onClick: t[7] || (t[7] = (...l) => o.confirmLogout && o.confirmLogout(...l))
                      },
                      ' Logout '
                    )
                  ])
                ])
              ])
            ]
          ))
        : mt('', !0)
    ])
  );
}
const mk = we(DS, [
    ['render', pk],
    ['__scopeId', 'data-v-b66c0c16']
  ]),
  gk = (e) => {
    const t = Number(e);
    return Number.isFinite(t) ? t : 0;
  },
  pc = (e, t, s) => `${(e / t).toFixed(1).replace(/\.0$/, '')}${s}`,
  cl = (e) => {
    const t = gk(e),
      s = Math.abs(t),
      n = t < 0 ? '-' : '';
    return s >= 1e9
      ? `${n}${pc(s, 1e9, 'B')}`
      : s >= 1e6
        ? `${n}${pc(s, 1e6, 'M')}`
        : s >= 1e3
          ? `${n}${pc(s, 1e3, 'k')}`
          : Math.round(t).toLocaleString('en-UG');
  },
  dl = (e, t = 'UGX') => `${t} ${cl(e)}`;
/*!
 * @kurkle/color v0.3.4
 * https://github.com/kurkle/color#readme
 * (c) 2024 Jukka Kurkela
 * Released under the MIT License
 */ function vr(e) {
  return (e + 0.5) | 0;
}
const En = (e, t, s) => Math.max(Math.min(e, s), t);
function Co(e) {
  return En(vr(e * 2.55), 0, 255);
}
function Mn(e) {
  return En(vr(e * 255), 0, 255);
}
function an(e) {
  return En(vr(e / 2.55) / 100, 0, 1);
}
function Nf(e) {
  return En(vr(e * 100), 0, 100);
}
const ys = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15
  },
  Jc = [...'0123456789ABCDEF'],
  bk = (e) => Jc[e & 15],
  _k = (e) => Jc[(e & 240) >> 4] + Jc[e & 15],
  Gr = (e) => (e & 240) >> 4 === (e & 15),
  yk = (e) => Gr(e.r) && Gr(e.g) && Gr(e.b) && Gr(e.a);
function vk(e) {
  var t = e.length,
    s;
  return (
    e[0] === '#' &&
      (t === 4 || t === 5
        ? (s = {
            r: 255 & (ys[e[1]] * 17),
            g: 255 & (ys[e[2]] * 17),
            b: 255 & (ys[e[3]] * 17),
            a: t === 5 ? ys[e[4]] * 17 : 255
          })
        : (t === 7 || t === 9) &&
          (s = {
            r: (ys[e[1]] << 4) | ys[e[2]],
            g: (ys[e[3]] << 4) | ys[e[4]],
            b: (ys[e[5]] << 4) | ys[e[6]],
            a: t === 9 ? (ys[e[7]] << 4) | ys[e[8]] : 255
          })),
    s
  );
}
const xk = (e, t) => (e < 255 ? t(e) : '');
function wk(e) {
  var t = yk(e) ? bk : _k;
  return e ? '#' + t(e.r) + t(e.g) + t(e.b) + xk(e.a, t) : void 0;
}
const Sk =
  /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
function qg(e, t, s) {
  const n = t * Math.min(s, 1 - s),
    i = (o, r = (o + e / 30) % 12) => s - n * Math.max(Math.min(r - 3, 9 - r, 1), -1);
  return [i(0), i(8), i(4)];
}
function kk(e, t, s) {
  const n = (i, o = (i + e / 60) % 6) => s - s * t * Math.max(Math.min(o, 4 - o, 1), 0);
  return [n(5), n(3), n(1)];
}
function Ck(e, t, s) {
  const n = qg(e, 1, 0.5);
  let i;
  for (t + s > 1 && ((i = 1 / (t + s)), (t *= i), (s *= i)), i = 0; i < 3; i++)
    ((n[i] *= 1 - t - s), (n[i] += t));
  return n;
}
function Tk(e, t, s, n, i) {
  return e === i ? (t - s) / n + (t < s ? 6 : 0) : t === i ? (s - e) / n + 2 : (e - t) / n + 4;
}
function Dd(e) {
  const s = e.r / 255,
    n = e.g / 255,
    i = e.b / 255,
    o = Math.max(s, n, i),
    r = Math.min(s, n, i),
    a = (o + r) / 2;
  let l, c, h;
  return (
    o !== r &&
      ((h = o - r),
      (c = a > 0.5 ? h / (2 - o - r) : h / (o + r)),
      (l = Tk(s, n, i, h, o)),
      (l = l * 60 + 0.5)),
    [l | 0, c || 0, a]
  );
}
function Md(e, t, s, n) {
  return (Array.isArray(t) ? e(t[0], t[1], t[2]) : e(t, s, n)).map(Mn);
}
function Id(e, t, s) {
  return Md(qg, e, t, s);
}
function Ak(e, t, s) {
  return Md(Ck, e, t, s);
}
function Pk(e, t, s) {
  return Md(kk, e, t, s);
}
function Gg(e) {
  return ((e % 360) + 360) % 360;
}
function Ok(e) {
  const t = Sk.exec(e);
  let s = 255,
    n;
  if (!t) return;
  t[5] !== n && (s = t[6] ? Co(+t[5]) : Mn(+t[5]));
  const i = Gg(+t[2]),
    o = +t[3] / 100,
    r = +t[4] / 100;
  return (
    t[1] === 'hwb' ? (n = Ak(i, o, r)) : t[1] === 'hsv' ? (n = Pk(i, o, r)) : (n = Id(i, o, r)),
    { r: n[0], g: n[1], b: n[2], a: s }
  );
}
function Ek(e, t) {
  var s = Dd(e);
  ((s[0] = Gg(s[0] + t)), (s = Id(s)), (e.r = s[0]), (e.g = s[1]), (e.b = s[2]));
}
function Rk(e) {
  if (!e) return;
  const t = Dd(e),
    s = t[0],
    n = Nf(t[1]),
    i = Nf(t[2]);
  return e.a < 255 ? `hsla(${s}, ${n}%, ${i}%, ${an(e.a)})` : `hsl(${s}, ${n}%, ${i}%)`;
}
const $f = {
    x: 'dark',
    Z: 'light',
    Y: 're',
    X: 'blu',
    W: 'gr',
    V: 'medium',
    U: 'slate',
    A: 'ee',
    T: 'ol',
    S: 'or',
    B: 'ra',
    C: 'lateg',
    D: 'ights',
    R: 'in',
    Q: 'turquois',
    E: 'hi',
    P: 'ro',
    O: 'al',
    N: 'le',
    M: 'de',
    L: 'yello',
    F: 'en',
    K: 'ch',
    G: 'arks',
    H: 'ea',
    I: 'ightg',
    J: 'wh'
  },
  Ff = {
    OiceXe: 'f0f8ff',
    antiquewEte: 'faebd7',
    aqua: 'ffff',
    aquamarRe: '7fffd4',
    azuY: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '0',
    blanKedOmond: 'ffebcd',
    Xe: 'ff',
    XeviTet: '8a2be2',
    bPwn: 'a52a2a',
    burlywood: 'deb887',
    caMtXe: '5f9ea0',
    KartYuse: '7fff00',
    KocTate: 'd2691e',
    cSO: 'ff7f50',
    cSnflowerXe: '6495ed',
    cSnsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: 'ffff',
    xXe: '8b',
    xcyan: '8b8b',
    xgTMnPd: 'b8860b',
    xWay: 'a9a9a9',
    xgYF: '6400',
    xgYy: 'a9a9a9',
    xkhaki: 'bdb76b',
    xmagFta: '8b008b',
    xTivegYF: '556b2f',
    xSange: 'ff8c00',
    xScEd: '9932cc',
    xYd: '8b0000',
    xsOmon: 'e9967a',
    xsHgYF: '8fbc8f',
    xUXe: '483d8b',
    xUWay: '2f4f4f',
    xUgYy: '2f4f4f',
    xQe: 'ced1',
    xviTet: '9400d3',
    dAppRk: 'ff1493',
    dApskyXe: 'bfff',
    dimWay: '696969',
    dimgYy: '696969',
    dodgerXe: '1e90ff',
    fiYbrick: 'b22222',
    flSOwEte: 'fffaf0',
    foYstWAn: '228b22',
    fuKsia: 'ff00ff',
    gaRsbSo: 'dcdcdc',
    ghostwEte: 'f8f8ff',
    gTd: 'ffd700',
    gTMnPd: 'daa520',
    Way: '808080',
    gYF: '8000',
    gYFLw: 'adff2f',
    gYy: '808080',
    honeyMw: 'f0fff0',
    hotpRk: 'ff69b4',
    RdianYd: 'cd5c5c',
    Rdigo: '4b0082',
    ivSy: 'fffff0',
    khaki: 'f0e68c',
    lavFMr: 'e6e6fa',
    lavFMrXsh: 'fff0f5',
    lawngYF: '7cfc00',
    NmoncEffon: 'fffacd',
    ZXe: 'add8e6',
    ZcSO: 'f08080',
    Zcyan: 'e0ffff',
    ZgTMnPdLw: 'fafad2',
    ZWay: 'd3d3d3',
    ZgYF: '90ee90',
    ZgYy: 'd3d3d3',
    ZpRk: 'ffb6c1',
    ZsOmon: 'ffa07a',
    ZsHgYF: '20b2aa',
    ZskyXe: '87cefa',
    ZUWay: '778899',
    ZUgYy: '778899',
    ZstAlXe: 'b0c4de',
    ZLw: 'ffffe0',
    lime: 'ff00',
    limegYF: '32cd32',
    lRF: 'faf0e6',
    magFta: 'ff00ff',
    maPon: '800000',
    VaquamarRe: '66cdaa',
    VXe: 'cd',
    VScEd: 'ba55d3',
    VpurpN: '9370db',
    VsHgYF: '3cb371',
    VUXe: '7b68ee',
    VsprRggYF: 'fa9a',
    VQe: '48d1cc',
    VviTetYd: 'c71585',
    midnightXe: '191970',
    mRtcYam: 'f5fffa',
    mistyPse: 'ffe4e1',
    moccasR: 'ffe4b5',
    navajowEte: 'ffdead',
    navy: '80',
    Tdlace: 'fdf5e6',
    Tive: '808000',
    TivedBb: '6b8e23',
    Sange: 'ffa500',
    SangeYd: 'ff4500',
    ScEd: 'da70d6',
    pOegTMnPd: 'eee8aa',
    pOegYF: '98fb98',
    pOeQe: 'afeeee',
    pOeviTetYd: 'db7093',
    papayawEp: 'ffefd5',
    pHKpuff: 'ffdab9',
    peru: 'cd853f',
    pRk: 'ffc0cb',
    plum: 'dda0dd',
    powMrXe: 'b0e0e6',
    purpN: '800080',
    YbeccapurpN: '663399',
    Yd: 'ff0000',
    Psybrown: 'bc8f8f',
    PyOXe: '4169e1',
    saddNbPwn: '8b4513',
    sOmon: 'fa8072',
    sandybPwn: 'f4a460',
    sHgYF: '2e8b57',
    sHshell: 'fff5ee',
    siFna: 'a0522d',
    silver: 'c0c0c0',
    skyXe: '87ceeb',
    UXe: '6a5acd',
    UWay: '708090',
    UgYy: '708090',
    snow: 'fffafa',
    sprRggYF: 'ff7f',
    stAlXe: '4682b4',
    tan: 'd2b48c',
    teO: '8080',
    tEstN: 'd8bfd8',
    tomato: 'ff6347',
    Qe: '40e0d0',
    viTet: 'ee82ee',
    JHt: 'f5deb3',
    wEte: 'ffffff',
    wEtesmoke: 'f5f5f5',
    Lw: 'ffff00',
    LwgYF: '9acd32'
  };
function Dk() {
  const e = {},
    t = Object.keys(Ff),
    s = Object.keys($f);
  let n, i, o, r, a;
  for (n = 0; n < t.length; n++) {
    for (r = a = t[n], i = 0; i < s.length; i++) ((o = s[i]), (a = a.replace(o, $f[o])));
    ((o = parseInt(Ff[r], 16)), (e[a] = [(o >> 16) & 255, (o >> 8) & 255, o & 255]));
  }
  return e;
}
let Xr;
function Mk(e) {
  Xr || ((Xr = Dk()), (Xr.transparent = [0, 0, 0, 0]));
  const t = Xr[e.toLowerCase()];
  return t && { r: t[0], g: t[1], b: t[2], a: t.length === 4 ? t[3] : 255 };
}
const Ik =
  /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
function Lk(e) {
  const t = Ik.exec(e);
  let s = 255,
    n,
    i,
    o;
  if (t) {
    if (t[7] !== n) {
      const r = +t[7];
      s = t[8] ? Co(r) : En(r * 255, 0, 255);
    }
    return (
      (n = +t[1]),
      (i = +t[3]),
      (o = +t[5]),
      (n = 255 & (t[2] ? Co(n) : En(n, 0, 255))),
      (i = 255 & (t[4] ? Co(i) : En(i, 0, 255))),
      (o = 255 & (t[6] ? Co(o) : En(o, 0, 255))),
      { r: n, g: i, b: o, a: s }
    );
  }
}
function Nk(e) {
  return (
    e && (e.a < 255 ? `rgba(${e.r}, ${e.g}, ${e.b}, ${an(e.a)})` : `rgb(${e.r}, ${e.g}, ${e.b})`)
  );
}
const mc = (e) => (e <= 0.0031308 ? e * 12.92 : Math.pow(e, 1 / 2.4) * 1.055 - 0.055),
  Mi = (e) => (e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4));
function $k(e, t, s) {
  const n = Mi(an(e.r)),
    i = Mi(an(e.g)),
    o = Mi(an(e.b));
  return {
    r: Mn(mc(n + s * (Mi(an(t.r)) - n))),
    g: Mn(mc(i + s * (Mi(an(t.g)) - i))),
    b: Mn(mc(o + s * (Mi(an(t.b)) - o))),
    a: e.a + s * (t.a - e.a)
  };
}
function Yr(e, t, s) {
  if (e) {
    let n = Dd(e);
    ((n[t] = Math.max(0, Math.min(n[t] + n[t] * s, t === 0 ? 360 : 1))),
      (n = Id(n)),
      (e.r = n[0]),
      (e.g = n[1]),
      (e.b = n[2]));
  }
}
function Xg(e, t) {
  return e && Object.assign(t || {}, e);
}
function Bf(e) {
  var t = { r: 0, g: 0, b: 0, a: 255 };
  return (
    Array.isArray(e)
      ? e.length >= 3 &&
        ((t = { r: e[0], g: e[1], b: e[2], a: 255 }), e.length > 3 && (t.a = Mn(e[3])))
      : ((t = Xg(e, { r: 0, g: 0, b: 0, a: 1 })), (t.a = Mn(t.a))),
    t
  );
}
function Fk(e) {
  return e.charAt(0) === 'r' ? Lk(e) : Ok(e);
}
class er {
  constructor(t) {
    if (t instanceof er) return t;
    const s = typeof t;
    let n;
    (s === 'object' ? (n = Bf(t)) : s === 'string' && (n = vk(t) || Mk(t) || Fk(t)),
      (this._rgb = n),
      (this._valid = !!n));
  }
  get valid() {
    return this._valid;
  }
  get rgb() {
    var t = Xg(this._rgb);
    return (t && (t.a = an(t.a)), t);
  }
  set rgb(t) {
    this._rgb = Bf(t);
  }
  rgbString() {
    return this._valid ? Nk(this._rgb) : void 0;
  }
  hexString() {
    return this._valid ? wk(this._rgb) : void 0;
  }
  hslString() {
    return this._valid ? Rk(this._rgb) : void 0;
  }
  mix(t, s) {
    if (t) {
      const n = this.rgb,
        i = t.rgb;
      let o;
      const r = s === o ? 0.5 : s,
        a = 2 * r - 1,
        l = n.a - i.a,
        c = ((a * l === -1 ? a : (a + l) / (1 + a * l)) + 1) / 2;
      ((o = 1 - c),
        (n.r = 255 & (c * n.r + o * i.r + 0.5)),
        (n.g = 255 & (c * n.g + o * i.g + 0.5)),
        (n.b = 255 & (c * n.b + o * i.b + 0.5)),
        (n.a = r * n.a + (1 - r) * i.a),
        (this.rgb = n));
    }
    return this;
  }
  interpolate(t, s) {
    return (t && (this._rgb = $k(this._rgb, t._rgb, s)), this);
  }
  clone() {
    return new er(this.rgb);
  }
  alpha(t) {
    return ((this._rgb.a = Mn(t)), this);
  }
  clearer(t) {
    const s = this._rgb;
    return ((s.a *= 1 - t), this);
  }
  greyscale() {
    const t = this._rgb,
      s = vr(t.r * 0.3 + t.g * 0.59 + t.b * 0.11);
    return ((t.r = t.g = t.b = s), this);
  }
  opaquer(t) {
    const s = this._rgb;
    return ((s.a *= 1 + t), this);
  }
  negate() {
    const t = this._rgb;
    return ((t.r = 255 - t.r), (t.g = 255 - t.g), (t.b = 255 - t.b), this);
  }
  lighten(t) {
    return (Yr(this._rgb, 2, t), this);
  }
  darken(t) {
    return (Yr(this._rgb, 2, -t), this);
  }
  saturate(t) {
    return (Yr(this._rgb, 1, t), this);
  }
  desaturate(t) {
    return (Yr(this._rgb, 1, -t), this);
  }
  rotate(t) {
    return (Ek(this._rgb, t), this);
  }
}
/*!
 * Chart.js v4.5.1
 * https://www.chartjs.org
 * (c) 2025 Chart.js Contributors
 * Released under the MIT License
 */ function en() {}
const Bk = (() => {
  let e = 0;
  return () => e++;
})();
function Gt(e) {
  return e == null;
}
function ve(e) {
  if (Array.isArray && Array.isArray(e)) return !0;
  const t = Object.prototype.toString.call(e);
  return t.slice(0, 7) === '[object' && t.slice(-6) === 'Array]';
}
function $t(e) {
  return e !== null && Object.prototype.toString.call(e) === '[object Object]';
}
function Ue(e) {
  return (typeof e == 'number' || e instanceof Number) && isFinite(+e);
}
function Bs(e, t) {
  return Ue(e) ? e : t;
}
function Mt(e, t) {
  return typeof e > 'u' ? t : e;
}
const Uk = (e, t) => (typeof e == 'string' && e.endsWith('%') ? parseFloat(e) / 100 : +e / t),
  Yg = (e, t) => (typeof e == 'string' && e.endsWith('%') ? (parseFloat(e) / 100) * t : +e);
function ce(e, t, s) {
  if (e && typeof e.call == 'function') return e.apply(s, t);
}
function Zt(e, t, s, n) {
  let i, o, r;
  if (ve(e)) for (o = e.length, i = 0; i < o; i++) t.call(s, e[i], i);
  else if ($t(e))
    for (r = Object.keys(e), o = r.length, i = 0; i < o; i++) t.call(s, e[r[i]], r[i]);
}
function Ra(e, t) {
  let s, n, i, o;
  if (!e || !t || e.length !== t.length) return !1;
  for (s = 0, n = e.length; s < n; ++s)
    if (((i = e[s]), (o = t[s]), i.datasetIndex !== o.datasetIndex || i.index !== o.index))
      return !1;
  return !0;
}
function Da(e) {
  if (ve(e)) return e.map(Da);
  if ($t(e)) {
    const t = Object.create(null),
      s = Object.keys(e),
      n = s.length;
    let i = 0;
    for (; i < n; ++i) t[s[i]] = Da(e[s[i]]);
    return t;
  }
  return e;
}
function Jg(e) {
  return ['__proto__', 'prototype', 'constructor'].indexOf(e) === -1;
}
function jk(e, t, s, n) {
  if (!Jg(e)) return;
  const i = t[e],
    o = s[e];
  $t(i) && $t(o) ? sr(i, o, n) : (t[e] = Da(o));
}
function sr(e, t, s) {
  const n = ve(t) ? t : [t],
    i = n.length;
  if (!$t(e)) return e;
  s = s || {};
  const o = s.merger || jk;
  let r;
  for (let a = 0; a < i; ++a) {
    if (((r = n[a]), !$t(r))) continue;
    const l = Object.keys(r);
    for (let c = 0, h = l.length; c < h; ++c) o(l[c], e, r, s);
  }
  return e;
}
function Uo(e, t) {
  return sr(e, t, { merger: Vk });
}
function Vk(e, t, s) {
  if (!Jg(e)) return;
  const n = t[e],
    i = s[e];
  $t(n) && $t(i) ? Uo(n, i) : Object.prototype.hasOwnProperty.call(t, e) || (t[e] = Da(i));
}
const Uf = { '': (e) => e, x: (e) => e.x, y: (e) => e.y };
function Hk(e) {
  const t = e.split('.'),
    s = [];
  let n = '';
  for (const i of t)
    ((n += i), n.endsWith('\\') ? (n = n.slice(0, -1) + '.') : (s.push(n), (n = '')));
  return s;
}
function zk(e) {
  const t = Hk(e);
  return (s) => {
    for (const n of t) {
      if (n === '') break;
      s = s && s[n];
    }
    return s;
  };
}
function gi(e, t) {
  return (Uf[t] || (Uf[t] = zk(t)))(e);
}
function Ld(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
const nr = (e) => typeof e < 'u',
  $n = (e) => typeof e == 'function',
  jf = (e, t) => {
    if (e.size !== t.size) return !1;
    for (const s of e) if (!t.has(s)) return !1;
    return !0;
  };
function Wk(e) {
  return e.type === 'mouseup' || e.type === 'click' || e.type === 'contextmenu';
}
const Qt = Math.PI,
  he = 2 * Qt,
  Kk = he + Qt,
  Ma = Number.POSITIVE_INFINITY,
  qk = Qt / 180,
  Te = Qt / 2,
  Zn = Qt / 4,
  Vf = (Qt * 2) / 3,
  Zg = Math.log10,
  qs = Math.sign;
function jo(e, t, s) {
  return Math.abs(e - t) < s;
}
function Hf(e) {
  const t = Math.round(e);
  e = jo(e, t, e / 1e3) ? t : e;
  const s = Math.pow(10, Math.floor(Zg(e))),
    n = e / s;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * s;
}
function Gk(e) {
  const t = [],
    s = Math.sqrt(e);
  let n;
  for (n = 1; n < s; n++) e % n === 0 && (t.push(n), t.push(e / n));
  return (s === (s | 0) && t.push(s), t.sort((i, o) => i - o).pop(), t);
}
function Xk(e) {
  return (
    typeof e == 'symbol' ||
    (typeof e == 'object' &&
      e !== null &&
      !(Symbol.toPrimitive in e || 'toString' in e || 'valueOf' in e))
  );
}
function ir(e) {
  return !Xk(e) && !isNaN(parseFloat(e)) && isFinite(e);
}
function Yk(e, t) {
  const s = Math.round(e);
  return s - t <= e && s + t >= e;
}
function Jk(e, t, s) {
  let n, i, o;
  for (n = 0, i = e.length; n < i; n++)
    ((o = e[n][s]), isNaN(o) || ((t.min = Math.min(t.min, o)), (t.max = Math.max(t.max, o))));
}
function un(e) {
  return e * (Qt / 180);
}
function Zk(e) {
  return e * (180 / Qt);
}
function zf(e) {
  if (!Ue(e)) return;
  let t = 1,
    s = 0;
  for (; Math.round(e * t) / t !== e; ) ((t *= 10), s++);
  return s;
}
function Qg(e, t) {
  const s = t.x - e.x,
    n = t.y - e.y,
    i = Math.sqrt(s * s + n * n);
  let o = Math.atan2(n, s);
  return (o < -0.5 * Qt && (o += he), { angle: o, distance: i });
}
function Zc(e, t) {
  return Math.sqrt(Math.pow(t.x - e.x, 2) + Math.pow(t.y - e.y, 2));
}
function Qk(e, t) {
  return ((e - t + Kk) % he) - Qt;
}
function as(e) {
  return ((e % he) + he) % he;
}
function or(e, t, s, n) {
  const i = as(e),
    o = as(t),
    r = as(s),
    a = as(o - i),
    l = as(r - i),
    c = as(i - o),
    h = as(i - r);
  return i === o || i === r || (n && o === r) || (a > l && c < h);
}
function $e(e, t, s) {
  return Math.max(t, Math.min(s, e));
}
function tC(e) {
  return $e(e, -32768, 32767);
}
function hn(e, t, s, n = 1e-6) {
  return e >= Math.min(t, s) - n && e <= Math.max(t, s) + n;
}
function Nd(e, t, s) {
  s = s || ((r) => e[r] < t);
  let n = e.length - 1,
    i = 0,
    o;
  for (; n - i > 1; ) ((o = (i + n) >> 1), s(o) ? (i = o) : (n = o));
  return { lo: i, hi: n };
}
const ci = (e, t, s, n) =>
    Nd(
      e,
      s,
      n
        ? (i) => {
            const o = e[i][t];
            return o < s || (o === s && e[i + 1][t] === s);
          }
        : (i) => e[i][t] < s
    ),
  eC = (e, t, s) => Nd(e, s, (n) => e[n][t] >= s);
function sC(e, t, s) {
  let n = 0,
    i = e.length;
  for (; n < i && e[n] < t; ) n++;
  for (; i > n && e[i - 1] > s; ) i--;
  return n > 0 || i < e.length ? e.slice(n, i) : e;
}
const tb = ['push', 'pop', 'shift', 'splice', 'unshift'];
function nC(e, t) {
  if (e._chartjs) {
    e._chartjs.listeners.push(t);
    return;
  }
  (Object.defineProperty(e, '_chartjs', {
    configurable: !0,
    enumerable: !1,
    value: { listeners: [t] }
  }),
    tb.forEach((s) => {
      const n = '_onData' + Ld(s),
        i = e[s];
      Object.defineProperty(e, s, {
        configurable: !0,
        enumerable: !1,
        value(...o) {
          const r = i.apply(this, o);
          return (
            e._chartjs.listeners.forEach((a) => {
              typeof a[n] == 'function' && a[n](...o);
            }),
            r
          );
        }
      });
    }));
}
function Wf(e, t) {
  const s = e._chartjs;
  if (!s) return;
  const n = s.listeners,
    i = n.indexOf(t);
  (i !== -1 && n.splice(i, 1),
    !(n.length > 0) &&
      (tb.forEach((o) => {
        delete e[o];
      }),
      delete e._chartjs));
}
function eb(e) {
  const t = new Set(e);
  return t.size === e.length ? e : Array.from(t);
}
const sb = (function () {
  return typeof window > 'u'
    ? function (e) {
        return e();
      }
    : window.requestAnimationFrame;
})();
function nb(e, t) {
  let s = [],
    n = !1;
  return function (...i) {
    ((s = i),
      n ||
        ((n = !0),
        sb.call(window, () => {
          ((n = !1), e.apply(t, s));
        })));
  };
}
function iC(e, t) {
  let s;
  return function (...n) {
    return (t ? (clearTimeout(s), (s = setTimeout(e, t, n))) : e.apply(this, n), t);
  };
}
const $d = (e) => (e === 'start' ? 'left' : e === 'end' ? 'right' : 'center'),
  Me = (e, t, s) => (e === 'start' ? t : e === 'end' ? s : (t + s) / 2),
  oC = (e, t, s, n) => (e === (n ? 'left' : 'right') ? s : e === 'center' ? (t + s) / 2 : t);
function rC(e, t, s) {
  const n = t.length;
  let i = 0,
    o = n;
  if (e._sorted) {
    const { iScale: r, vScale: a, _parsed: l } = e,
      c = e.dataset && e.dataset.options ? e.dataset.options.spanGaps : null,
      h = r.axis,
      { min: f, max: m, minDefined: g, maxDefined: _ } = r.getUserBounds();
    if (g) {
      if (((i = Math.min(ci(l, h, f).lo, s ? n : ci(t, h, r.getPixelForValue(f)).lo)), c)) {
        const y = l
          .slice(0, i + 1)
          .reverse()
          .findIndex((x) => !Gt(x[a.axis]));
        i -= Math.max(0, y);
      }
      i = $e(i, 0, n - 1);
    }
    if (_) {
      let y = Math.max(
        ci(l, r.axis, m, !0).hi + 1,
        s ? 0 : ci(t, h, r.getPixelForValue(m), !0).hi + 1
      );
      if (c) {
        const x = l.slice(y - 1).findIndex((w) => !Gt(w[a.axis]));
        y += Math.max(0, x);
      }
      o = $e(y, i, n) - i;
    } else o = n - i;
  }
  return { start: i, count: o };
}
function aC(e) {
  const { xScale: t, yScale: s, _scaleRanges: n } = e,
    i = { xmin: t.min, xmax: t.max, ymin: s.min, ymax: s.max };
  if (!n) return ((e._scaleRanges = i), !0);
  const o = n.xmin !== t.min || n.xmax !== t.max || n.ymin !== s.min || n.ymax !== s.max;
  return (Object.assign(n, i), o);
}
const Jr = (e) => e === 0 || e === 1,
  Kf = (e, t, s) => -(Math.pow(2, 10 * (e -= 1)) * Math.sin(((e - t) * he) / s)),
  qf = (e, t, s) => Math.pow(2, -10 * e) * Math.sin(((e - t) * he) / s) + 1,
  Vo = {
    linear: (e) => e,
    easeInQuad: (e) => e * e,
    easeOutQuad: (e) => -e * (e - 2),
    easeInOutQuad: (e) => ((e /= 0.5) < 1 ? 0.5 * e * e : -0.5 * (--e * (e - 2) - 1)),
    easeInCubic: (e) => e * e * e,
    easeOutCubic: (e) => (e -= 1) * e * e + 1,
    easeInOutCubic: (e) => ((e /= 0.5) < 1 ? 0.5 * e * e * e : 0.5 * ((e -= 2) * e * e + 2)),
    easeInQuart: (e) => e * e * e * e,
    easeOutQuart: (e) => -((e -= 1) * e * e * e - 1),
    easeInOutQuart: (e) =>
      (e /= 0.5) < 1 ? 0.5 * e * e * e * e : -0.5 * ((e -= 2) * e * e * e - 2),
    easeInQuint: (e) => e * e * e * e * e,
    easeOutQuint: (e) => (e -= 1) * e * e * e * e + 1,
    easeInOutQuint: (e) =>
      (e /= 0.5) < 1 ? 0.5 * e * e * e * e * e : 0.5 * ((e -= 2) * e * e * e * e + 2),
    easeInSine: (e) => -Math.cos(e * Te) + 1,
    easeOutSine: (e) => Math.sin(e * Te),
    easeInOutSine: (e) => -0.5 * (Math.cos(Qt * e) - 1),
    easeInExpo: (e) => (e === 0 ? 0 : Math.pow(2, 10 * (e - 1))),
    easeOutExpo: (e) => (e === 1 ? 1 : -Math.pow(2, -10 * e) + 1),
    easeInOutExpo: (e) =>
      Jr(e)
        ? e
        : e < 0.5
          ? 0.5 * Math.pow(2, 10 * (e * 2 - 1))
          : 0.5 * (-Math.pow(2, -10 * (e * 2 - 1)) + 2),
    easeInCirc: (e) => (e >= 1 ? e : -(Math.sqrt(1 - e * e) - 1)),
    easeOutCirc: (e) => Math.sqrt(1 - (e -= 1) * e),
    easeInOutCirc: (e) =>
      (e /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - e * e) - 1) : 0.5 * (Math.sqrt(1 - (e -= 2) * e) + 1),
    easeInElastic: (e) => (Jr(e) ? e : Kf(e, 0.075, 0.3)),
    easeOutElastic: (e) => (Jr(e) ? e : qf(e, 0.075, 0.3)),
    easeInOutElastic(e) {
      return Jr(e)
        ? e
        : e < 0.5
          ? 0.5 * Kf(e * 2, 0.1125, 0.45)
          : 0.5 + 0.5 * qf(e * 2 - 1, 0.1125, 0.45);
    },
    easeInBack(e) {
      return e * e * ((1.70158 + 1) * e - 1.70158);
    },
    easeOutBack(e) {
      return (e -= 1) * e * ((1.70158 + 1) * e + 1.70158) + 1;
    },
    easeInOutBack(e) {
      let t = 1.70158;
      return (e /= 0.5) < 1
        ? 0.5 * (e * e * (((t *= 1.525) + 1) * e - t))
        : 0.5 * ((e -= 2) * e * (((t *= 1.525) + 1) * e + t) + 2);
    },
    easeInBounce: (e) => 1 - Vo.easeOutBounce(1 - e),
    easeOutBounce(e) {
      return e < 1 / 2.75
        ? 7.5625 * e * e
        : e < 2 / 2.75
          ? 7.5625 * (e -= 1.5 / 2.75) * e + 0.75
          : e < 2.5 / 2.75
            ? 7.5625 * (e -= 2.25 / 2.75) * e + 0.9375
            : 7.5625 * (e -= 2.625 / 2.75) * e + 0.984375;
    },
    easeInOutBounce: (e) =>
      e < 0.5 ? Vo.easeInBounce(e * 2) * 0.5 : Vo.easeOutBounce(e * 2 - 1) * 0.5 + 0.5
  };
function Fd(e) {
  if (e && typeof e == 'object') {
    const t = e.toString();
    return t === '[object CanvasPattern]' || t === '[object CanvasGradient]';
  }
  return !1;
}
function Gf(e) {
  return Fd(e) ? e : new er(e);
}
function gc(e) {
  return Fd(e) ? e : new er(e).saturate(0.5).darken(0.1).hexString();
}
const lC = ['x', 'y', 'borderWidth', 'radius', 'tension'],
  cC = ['color', 'borderColor', 'backgroundColor'];
function dC(e) {
  (e.set('animation', {
    delay: void 0,
    duration: 1e3,
    easing: 'easeOutQuart',
    fn: void 0,
    from: void 0,
    loop: void 0,
    to: void 0,
    type: void 0
  }),
    e.describe('animation', {
      _fallback: !1,
      _indexable: !1,
      _scriptable: (t) => t !== 'onProgress' && t !== 'onComplete' && t !== 'fn'
    }),
    e.set('animations', {
      colors: { type: 'color', properties: cC },
      numbers: { type: 'number', properties: lC }
    }),
    e.describe('animations', { _fallback: 'animation' }),
    e.set('transitions', {
      active: { animation: { duration: 400 } },
      resize: { animation: { duration: 0 } },
      show: {
        animations: { colors: { from: 'transparent' }, visible: { type: 'boolean', duration: 0 } }
      },
      hide: {
        animations: {
          colors: { to: 'transparent' },
          visible: { type: 'boolean', easing: 'linear', fn: (t) => t | 0 }
        }
      }
    }));
}
function uC(e) {
  e.set('layout', { autoPadding: !0, padding: { top: 0, right: 0, bottom: 0, left: 0 } });
}
const Xf = new Map();
function hC(e, t) {
  t = t || {};
  const s = e + JSON.stringify(t);
  let n = Xf.get(s);
  return (n || ((n = new Intl.NumberFormat(e, t)), Xf.set(s, n)), n);
}
function Bd(e, t, s) {
  return hC(t, s).format(e);
}
const fC = {
  values(e) {
    return ve(e) ? e : '' + e;
  },
  numeric(e, t, s) {
    if (e === 0) return '0';
    const n = this.chart.options.locale;
    let i,
      o = e;
    if (s.length > 1) {
      const c = Math.max(Math.abs(s[0].value), Math.abs(s[s.length - 1].value));
      ((c < 1e-4 || c > 1e15) && (i = 'scientific'), (o = pC(e, s)));
    }
    const r = Zg(Math.abs(o)),
      a = isNaN(r) ? 1 : Math.max(Math.min(-1 * Math.floor(r), 20), 0),
      l = { notation: i, minimumFractionDigits: a, maximumFractionDigits: a };
    return (Object.assign(l, this.options.ticks.format), Bd(e, n, l));
  }
};
function pC(e, t) {
  let s = t.length > 3 ? t[2].value - t[1].value : t[1].value - t[0].value;
  return (Math.abs(s) >= 1 && e !== Math.floor(e) && (s = e - Math.floor(e)), s);
}
var ib = { formatters: fC };
function mC(e) {
  (e.set('scale', {
    display: !0,
    offset: !1,
    reverse: !1,
    beginAtZero: !1,
    bounds: 'ticks',
    clip: !0,
    grace: 0,
    grid: {
      display: !0,
      lineWidth: 1,
      drawOnChartArea: !0,
      drawTicks: !0,
      tickLength: 8,
      tickWidth: (t, s) => s.lineWidth,
      tickColor: (t, s) => s.color,
      offset: !1
    },
    border: { display: !0, dash: [], dashOffset: 0, width: 1 },
    title: { display: !1, text: '', padding: { top: 4, bottom: 4 } },
    ticks: {
      minRotation: 0,
      maxRotation: 50,
      mirror: !1,
      textStrokeWidth: 0,
      textStrokeColor: '',
      padding: 3,
      display: !0,
      autoSkip: !0,
      autoSkipPadding: 3,
      labelOffset: 0,
      callback: ib.formatters.values,
      minor: {},
      major: {},
      align: 'center',
      crossAlign: 'near',
      showLabelBackdrop: !1,
      backdropColor: 'rgba(255, 255, 255, 0.75)',
      backdropPadding: 2
    }
  }),
    e.route('scale.ticks', 'color', '', 'color'),
    e.route('scale.grid', 'color', '', 'borderColor'),
    e.route('scale.border', 'color', '', 'borderColor'),
    e.route('scale.title', 'color', '', 'color'),
    e.describe('scale', {
      _fallback: !1,
      _scriptable: (t) =>
        !t.startsWith('before') && !t.startsWith('after') && t !== 'callback' && t !== 'parser',
      _indexable: (t) => t !== 'borderDash' && t !== 'tickBorderDash' && t !== 'dash'
    }),
    e.describe('scales', { _fallback: 'scale' }),
    e.describe('scale.ticks', {
      _scriptable: (t) => t !== 'backdropPadding' && t !== 'callback',
      _indexable: (t) => t !== 'backdropPadding'
    }));
}
const bi = Object.create(null),
  Qc = Object.create(null);
function Ho(e, t) {
  if (!t) return e;
  const s = t.split('.');
  for (let n = 0, i = s.length; n < i; ++n) {
    const o = s[n];
    e = e[o] || (e[o] = Object.create(null));
  }
  return e;
}
function bc(e, t, s) {
  return typeof t == 'string' ? sr(Ho(e, t), s) : sr(Ho(e, ''), t);
}
class gC {
  constructor(t, s) {
    ((this.animation = void 0),
      (this.backgroundColor = 'rgba(0,0,0,0.1)'),
      (this.borderColor = 'rgba(0,0,0,0.1)'),
      (this.color = '#666'),
      (this.datasets = {}),
      (this.devicePixelRatio = (n) => n.chart.platform.getDevicePixelRatio()),
      (this.elements = {}),
      (this.events = ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove']),
      (this.font = {
        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        size: 12,
        style: 'normal',
        lineHeight: 1.2,
        weight: null
      }),
      (this.hover = {}),
      (this.hoverBackgroundColor = (n, i) => gc(i.backgroundColor)),
      (this.hoverBorderColor = (n, i) => gc(i.borderColor)),
      (this.hoverColor = (n, i) => gc(i.color)),
      (this.indexAxis = 'x'),
      (this.interaction = { mode: 'nearest', intersect: !0, includeInvisible: !1 }),
      (this.maintainAspectRatio = !0),
      (this.onHover = null),
      (this.onClick = null),
      (this.parsing = !0),
      (this.plugins = {}),
      (this.responsive = !0),
      (this.scale = void 0),
      (this.scales = {}),
      (this.showLine = !0),
      (this.drawActiveElementsOnTop = !0),
      this.describe(t),
      this.apply(s));
  }
  set(t, s) {
    return bc(this, t, s);
  }
  get(t) {
    return Ho(this, t);
  }
  describe(t, s) {
    return bc(Qc, t, s);
  }
  override(t, s) {
    return bc(bi, t, s);
  }
  route(t, s, n, i) {
    const o = Ho(this, t),
      r = Ho(this, n),
      a = '_' + s;
    Object.defineProperties(o, {
      [a]: { value: o[s], writable: !0 },
      [s]: {
        enumerable: !0,
        get() {
          const l = this[a],
            c = r[i];
          return $t(l) ? Object.assign({}, c, l) : Mt(l, c);
        },
        set(l) {
          this[a] = l;
        }
      }
    });
  }
  apply(t) {
    t.forEach((s) => s(this));
  }
}
var ge = new gC(
  {
    _scriptable: (e) => !e.startsWith('on'),
    _indexable: (e) => e !== 'events',
    hover: { _fallback: 'interaction' },
    interaction: { _scriptable: !1, _indexable: !1 }
  },
  [dC, uC, mC]
);
function bC(e) {
  return !e || Gt(e.size) || Gt(e.family)
    ? null
    : (e.style ? e.style + ' ' : '') + (e.weight ? e.weight + ' ' : '') + e.size + 'px ' + e.family;
}
function Yf(e, t, s, n, i) {
  let o = t[i];
  return (o || ((o = t[i] = e.measureText(i).width), s.push(i)), o > n && (n = o), n);
}
function Qn(e, t, s) {
  const n = e.currentDevicePixelRatio,
    i = s !== 0 ? Math.max(s / 2, 0.5) : 0;
  return Math.round((t - i) * n) / n + i;
}
function Jf(e, t) {
  (!t && !e) ||
    ((t = t || e.getContext('2d')),
    t.save(),
    t.resetTransform(),
    t.clearRect(0, 0, e.width, e.height),
    t.restore());
}
function td(e, t, s, n) {
  ob(e, t, s, n, null);
}
function ob(e, t, s, n, i) {
  let o, r, a, l, c, h, f, m;
  const g = t.pointStyle,
    _ = t.rotation,
    y = t.radius;
  let x = (_ || 0) * qk;
  if (
    g &&
    typeof g == 'object' &&
    ((o = g.toString()), o === '[object HTMLImageElement]' || o === '[object HTMLCanvasElement]')
  ) {
    (e.save(),
      e.translate(s, n),
      e.rotate(x),
      e.drawImage(g, -g.width / 2, -g.height / 2, g.width, g.height),
      e.restore());
    return;
  }
  if (!(isNaN(y) || y <= 0)) {
    switch ((e.beginPath(), g)) {
      default:
        (i ? e.ellipse(s, n, i / 2, y, 0, 0, he) : e.arc(s, n, y, 0, he), e.closePath());
        break;
      case 'triangle':
        ((h = i ? i / 2 : y),
          e.moveTo(s + Math.sin(x) * h, n - Math.cos(x) * y),
          (x += Vf),
          e.lineTo(s + Math.sin(x) * h, n - Math.cos(x) * y),
          (x += Vf),
          e.lineTo(s + Math.sin(x) * h, n - Math.cos(x) * y),
          e.closePath());
        break;
      case 'rectRounded':
        ((c = y * 0.516),
          (l = y - c),
          (r = Math.cos(x + Zn) * l),
          (f = Math.cos(x + Zn) * (i ? i / 2 - c : l)),
          (a = Math.sin(x + Zn) * l),
          (m = Math.sin(x + Zn) * (i ? i / 2 - c : l)),
          e.arc(s - f, n - a, c, x - Qt, x - Te),
          e.arc(s + m, n - r, c, x - Te, x),
          e.arc(s + f, n + a, c, x, x + Te),
          e.arc(s - m, n + r, c, x + Te, x + Qt),
          e.closePath());
        break;
      case 'rect':
        if (!_) {
          ((l = Math.SQRT1_2 * y), (h = i ? i / 2 : l), e.rect(s - h, n - l, 2 * h, 2 * l));
          break;
        }
        x += Zn;
      case 'rectRot':
        ((f = Math.cos(x) * (i ? i / 2 : y)),
          (r = Math.cos(x) * y),
          (a = Math.sin(x) * y),
          (m = Math.sin(x) * (i ? i / 2 : y)),
          e.moveTo(s - f, n - a),
          e.lineTo(s + m, n - r),
          e.lineTo(s + f, n + a),
          e.lineTo(s - m, n + r),
          e.closePath());
        break;
      case 'crossRot':
        x += Zn;
      case 'cross':
        ((f = Math.cos(x) * (i ? i / 2 : y)),
          (r = Math.cos(x) * y),
          (a = Math.sin(x) * y),
          (m = Math.sin(x) * (i ? i / 2 : y)),
          e.moveTo(s - f, n - a),
          e.lineTo(s + f, n + a),
          e.moveTo(s + m, n - r),
          e.lineTo(s - m, n + r));
        break;
      case 'star':
        ((f = Math.cos(x) * (i ? i / 2 : y)),
          (r = Math.cos(x) * y),
          (a = Math.sin(x) * y),
          (m = Math.sin(x) * (i ? i / 2 : y)),
          e.moveTo(s - f, n - a),
          e.lineTo(s + f, n + a),
          e.moveTo(s + m, n - r),
          e.lineTo(s - m, n + r),
          (x += Zn),
          (f = Math.cos(x) * (i ? i / 2 : y)),
          (r = Math.cos(x) * y),
          (a = Math.sin(x) * y),
          (m = Math.sin(x) * (i ? i / 2 : y)),
          e.moveTo(s - f, n - a),
          e.lineTo(s + f, n + a),
          e.moveTo(s + m, n - r),
          e.lineTo(s - m, n + r));
        break;
      case 'line':
        ((r = i ? i / 2 : Math.cos(x) * y),
          (a = Math.sin(x) * y),
          e.moveTo(s - r, n - a),
          e.lineTo(s + r, n + a));
        break;
      case 'dash':
        (e.moveTo(s, n), e.lineTo(s + Math.cos(x) * (i ? i / 2 : y), n + Math.sin(x) * y));
        break;
      case !1:
        e.closePath();
        break;
    }
    (e.fill(), t.borderWidth > 0 && e.stroke());
  }
}
function rr(e, t, s) {
  return (
    (s = s || 0.5),
    !t || (e && e.x > t.left - s && e.x < t.right + s && e.y > t.top - s && e.y < t.bottom + s)
  );
}
function ul(e, t) {
  (e.save(), e.beginPath(), e.rect(t.left, t.top, t.right - t.left, t.bottom - t.top), e.clip());
}
function hl(e) {
  e.restore();
}
function _C(e, t, s, n, i) {
  if (!t) return e.lineTo(s.x, s.y);
  if (i === 'middle') {
    const o = (t.x + s.x) / 2;
    (e.lineTo(o, t.y), e.lineTo(o, s.y));
  } else (i === 'after') != !!n ? e.lineTo(t.x, s.y) : e.lineTo(s.x, t.y);
  e.lineTo(s.x, s.y);
}
function yC(e, t, s, n) {
  if (!t) return e.lineTo(s.x, s.y);
  e.bezierCurveTo(
    n ? t.cp1x : t.cp2x,
    n ? t.cp1y : t.cp2y,
    n ? s.cp2x : s.cp1x,
    n ? s.cp2y : s.cp1y,
    s.x,
    s.y
  );
}
function vC(e, t) {
  (t.translation && e.translate(t.translation[0], t.translation[1]),
    Gt(t.rotation) || e.rotate(t.rotation),
    t.color && (e.fillStyle = t.color),
    t.textAlign && (e.textAlign = t.textAlign),
    t.textBaseline && (e.textBaseline = t.textBaseline));
}
function xC(e, t, s, n, i) {
  if (i.strikethrough || i.underline) {
    const o = e.measureText(n),
      r = t - o.actualBoundingBoxLeft,
      a = t + o.actualBoundingBoxRight,
      l = s - o.actualBoundingBoxAscent,
      c = s + o.actualBoundingBoxDescent,
      h = i.strikethrough ? (l + c) / 2 : c;
    ((e.strokeStyle = e.fillStyle),
      e.beginPath(),
      (e.lineWidth = i.decorationWidth || 2),
      e.moveTo(r, h),
      e.lineTo(a, h),
      e.stroke());
  }
}
function wC(e, t) {
  const s = e.fillStyle;
  ((e.fillStyle = t.color), e.fillRect(t.left, t.top, t.width, t.height), (e.fillStyle = s));
}
function ar(e, t, s, n, i, o = {}) {
  const r = ve(t) ? t : [t],
    a = o.strokeWidth > 0 && o.strokeColor !== '';
  let l, c;
  for (e.save(), e.font = i.string, vC(e, o), l = 0; l < r.length; ++l)
    ((c = r[l]),
      o.backdrop && wC(e, o.backdrop),
      a &&
        (o.strokeColor && (e.strokeStyle = o.strokeColor),
        Gt(o.strokeWidth) || (e.lineWidth = o.strokeWidth),
        e.strokeText(c, s, n, o.maxWidth)),
      e.fillText(c, s, n, o.maxWidth),
      xC(e, s, n, c, o),
      (n += Number(i.lineHeight)));
  e.restore();
}
function Ia(e, t) {
  const { x: s, y: n, w: i, h: o, radius: r } = t;
  (e.arc(s + r.topLeft, n + r.topLeft, r.topLeft, 1.5 * Qt, Qt, !0),
    e.lineTo(s, n + o - r.bottomLeft),
    e.arc(s + r.bottomLeft, n + o - r.bottomLeft, r.bottomLeft, Qt, Te, !0),
    e.lineTo(s + i - r.bottomRight, n + o),
    e.arc(s + i - r.bottomRight, n + o - r.bottomRight, r.bottomRight, Te, 0, !0),
    e.lineTo(s + i, n + r.topRight),
    e.arc(s + i - r.topRight, n + r.topRight, r.topRight, 0, -Te, !0),
    e.lineTo(s + r.topLeft, n));
}
const SC = /^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/,
  kC = /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;
function CC(e, t) {
  const s = ('' + e).match(SC);
  if (!s || s[1] === 'normal') return t * 1.2;
  switch (((e = +s[2]), s[3])) {
    case 'px':
      return e;
    case '%':
      e /= 100;
      break;
  }
  return t * e;
}
const TC = (e) => +e || 0;
function Ud(e, t) {
  const s = {},
    n = $t(t),
    i = n ? Object.keys(t) : t,
    o = $t(e) ? (n ? (r) => Mt(e[r], e[t[r]]) : (r) => e[r]) : () => e;
  for (const r of i) s[r] = TC(o(r));
  return s;
}
function rb(e) {
  return Ud(e, { top: 'y', right: 'x', bottom: 'y', left: 'x' });
}
function Hi(e) {
  return Ud(e, ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']);
}
function Cs(e) {
  const t = rb(e);
  return ((t.width = t.left + t.right), (t.height = t.top + t.bottom), t);
}
function Fe(e, t) {
  ((e = e || {}), (t = t || ge.font));
  let s = Mt(e.size, t.size);
  typeof s == 'string' && (s = parseInt(s, 10));
  let n = Mt(e.style, t.style);
  n &&
    !('' + n).match(kC) &&
    (console.warn('Invalid font style specified: "' + n + '"'), (n = void 0));
  const i = {
    family: Mt(e.family, t.family),
    lineHeight: CC(Mt(e.lineHeight, t.lineHeight), s),
    size: s,
    style: n,
    weight: Mt(e.weight, t.weight),
    string: ''
  };
  return ((i.string = bC(i)), i);
}
function Zr(e, t, s, n) {
  let i, o, r;
  for (i = 0, o = e.length; i < o; ++i) if (((r = e[i]), r !== void 0 && r !== void 0)) return r;
}
function AC(e, t, s) {
  const { min: n, max: i } = e,
    o = Yg(t, (i - n) / 2),
    r = (a, l) => (s && a === 0 ? 0 : a + l);
  return { min: r(n, -Math.abs(o)), max: r(i, o) };
}
function _i(e, t) {
  return Object.assign(Object.create(e), t);
}
function jd(e, t = [''], s, n, i = () => e[0]) {
  const o = s || e;
  typeof n > 'u' && (n = db('_fallback', e));
  const r = {
    [Symbol.toStringTag]: 'Object',
    _cacheable: !0,
    _scopes: e,
    _rootScopes: o,
    _fallback: n,
    _getTarget: i,
    override: (a) => jd([a, ...e], t, o, n)
  };
  return new Proxy(r, {
    deleteProperty(a, l) {
      return (delete a[l], delete a._keys, delete e[0][l], !0);
    },
    get(a, l) {
      return lb(a, l, () => LC(l, t, e, a));
    },
    getOwnPropertyDescriptor(a, l) {
      return Reflect.getOwnPropertyDescriptor(a._scopes[0], l);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(e[0]);
    },
    has(a, l) {
      return Qf(a).includes(l);
    },
    ownKeys(a) {
      return Qf(a);
    },
    set(a, l, c) {
      const h = a._storage || (a._storage = i());
      return ((a[l] = h[l] = c), delete a._keys, !0);
    }
  });
}
function Ji(e, t, s, n) {
  const i = {
    _cacheable: !1,
    _proxy: e,
    _context: t,
    _subProxy: s,
    _stack: new Set(),
    _descriptors: ab(e, n),
    setContext: (o) => Ji(e, o, s, n),
    override: (o) => Ji(e.override(o), t, s, n)
  };
  return new Proxy(i, {
    deleteProperty(o, r) {
      return (delete o[r], delete e[r], !0);
    },
    get(o, r, a) {
      return lb(o, r, () => OC(o, r, a));
    },
    getOwnPropertyDescriptor(o, r) {
      return o._descriptors.allKeys
        ? Reflect.has(e, r)
          ? { enumerable: !0, configurable: !0 }
          : void 0
        : Reflect.getOwnPropertyDescriptor(e, r);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(e);
    },
    has(o, r) {
      return Reflect.has(e, r);
    },
    ownKeys() {
      return Reflect.ownKeys(e);
    },
    set(o, r, a) {
      return ((e[r] = a), delete o[r], !0);
    }
  });
}
function ab(e, t = { scriptable: !0, indexable: !0 }) {
  const { _scriptable: s = t.scriptable, _indexable: n = t.indexable, _allKeys: i = t.allKeys } = e;
  return {
    allKeys: i,
    scriptable: s,
    indexable: n,
    isScriptable: $n(s) ? s : () => s,
    isIndexable: $n(n) ? n : () => n
  };
}
const PC = (e, t) => (e ? e + Ld(t) : t),
  Vd = (e, t) =>
    $t(t) && e !== 'adapters' && (Object.getPrototypeOf(t) === null || t.constructor === Object);
function lb(e, t, s) {
  if (Object.prototype.hasOwnProperty.call(e, t) || t === 'constructor') return e[t];
  const n = s();
  return ((e[t] = n), n);
}
function OC(e, t, s) {
  const { _proxy: n, _context: i, _subProxy: o, _descriptors: r } = e;
  let a = n[t];
  return (
    $n(a) && r.isScriptable(t) && (a = EC(t, a, e, s)),
    ve(a) && a.length && (a = RC(t, a, e, r.isIndexable)),
    Vd(t, a) && (a = Ji(a, i, o && o[t], r)),
    a
  );
}
function EC(e, t, s, n) {
  const { _proxy: i, _context: o, _subProxy: r, _stack: a } = s;
  if (a.has(e)) throw new Error('Recursion detected: ' + Array.from(a).join('->') + '->' + e);
  a.add(e);
  let l = t(o, r || n);
  return (a.delete(e), Vd(e, l) && (l = Hd(i._scopes, i, e, l)), l);
}
function RC(e, t, s, n) {
  const { _proxy: i, _context: o, _subProxy: r, _descriptors: a } = s;
  if (typeof o.index < 'u' && n(e)) return t[o.index % t.length];
  if ($t(t[0])) {
    const l = t,
      c = i._scopes.filter((h) => h !== l);
    t = [];
    for (const h of l) {
      const f = Hd(c, i, e, h);
      t.push(Ji(f, o, r && r[e], a));
    }
  }
  return t;
}
function cb(e, t, s) {
  return $n(e) ? e(t, s) : e;
}
const DC = (e, t) => (e === !0 ? t : typeof e == 'string' ? gi(t, e) : void 0);
function MC(e, t, s, n, i) {
  for (const o of t) {
    const r = DC(s, o);
    if (r) {
      e.add(r);
      const a = cb(r._fallback, s, i);
      if (typeof a < 'u' && a !== s && a !== n) return a;
    } else if (r === !1 && typeof n < 'u' && s !== n) return null;
  }
  return !1;
}
function Hd(e, t, s, n) {
  const i = t._rootScopes,
    o = cb(t._fallback, s, n),
    r = [...e, ...i],
    a = new Set();
  a.add(n);
  let l = Zf(a, r, s, o || s, n);
  return l === null || (typeof o < 'u' && o !== s && ((l = Zf(a, r, o, l, n)), l === null))
    ? !1
    : jd(Array.from(a), [''], i, o, () => IC(t, s, n));
}
function Zf(e, t, s, n, i) {
  for (; s; ) s = MC(e, t, s, n, i);
  return s;
}
function IC(e, t, s) {
  const n = e._getTarget();
  t in n || (n[t] = {});
  const i = n[t];
  return ve(i) && $t(s) ? s : i || {};
}
function LC(e, t, s, n) {
  let i;
  for (const o of t)
    if (((i = db(PC(o, e), s)), typeof i < 'u')) return Vd(e, i) ? Hd(s, n, e, i) : i;
}
function db(e, t) {
  for (const s of t) {
    if (!s) continue;
    const n = s[e];
    if (typeof n < 'u') return n;
  }
}
function Qf(e) {
  let t = e._keys;
  return (t || (t = e._keys = NC(e._scopes)), t);
}
function NC(e) {
  const t = new Set();
  for (const s of e) for (const n of Object.keys(s).filter((i) => !i.startsWith('_'))) t.add(n);
  return Array.from(t);
}
const $C = Number.EPSILON || 1e-14,
  Zi = (e, t) => t < e.length && !e[t].skip && e[t],
  ub = (e) => (e === 'x' ? 'y' : 'x');
function FC(e, t, s, n) {
  const i = e.skip ? t : e,
    o = t,
    r = s.skip ? t : s,
    a = Zc(o, i),
    l = Zc(r, o);
  let c = a / (a + l),
    h = l / (a + l);
  ((c = isNaN(c) ? 0 : c), (h = isNaN(h) ? 0 : h));
  const f = n * c,
    m = n * h;
  return {
    previous: { x: o.x - f * (r.x - i.x), y: o.y - f * (r.y - i.y) },
    next: { x: o.x + m * (r.x - i.x), y: o.y + m * (r.y - i.y) }
  };
}
function BC(e, t, s) {
  const n = e.length;
  let i,
    o,
    r,
    a,
    l,
    c = Zi(e, 0);
  for (let h = 0; h < n - 1; ++h)
    if (((l = c), (c = Zi(e, h + 1)), !(!l || !c))) {
      if (jo(t[h], 0, $C)) {
        s[h] = s[h + 1] = 0;
        continue;
      }
      ((i = s[h] / t[h]),
        (o = s[h + 1] / t[h]),
        (a = Math.pow(i, 2) + Math.pow(o, 2)),
        !(a <= 9) && ((r = 3 / Math.sqrt(a)), (s[h] = i * r * t[h]), (s[h + 1] = o * r * t[h])));
    }
}
function UC(e, t, s = 'x') {
  const n = ub(s),
    i = e.length;
  let o,
    r,
    a,
    l = Zi(e, 0);
  for (let c = 0; c < i; ++c) {
    if (((r = a), (a = l), (l = Zi(e, c + 1)), !a)) continue;
    const h = a[s],
      f = a[n];
    (r && ((o = (h - r[s]) / 3), (a[`cp1${s}`] = h - o), (a[`cp1${n}`] = f - o * t[c])),
      l && ((o = (l[s] - h) / 3), (a[`cp2${s}`] = h + o), (a[`cp2${n}`] = f + o * t[c])));
  }
}
function jC(e, t = 'x') {
  const s = ub(t),
    n = e.length,
    i = Array(n).fill(0),
    o = Array(n);
  let r,
    a,
    l,
    c = Zi(e, 0);
  for (r = 0; r < n; ++r)
    if (((a = l), (l = c), (c = Zi(e, r + 1)), !!l)) {
      if (c) {
        const h = c[t] - l[t];
        i[r] = h !== 0 ? (c[s] - l[s]) / h : 0;
      }
      o[r] = a ? (c ? (qs(i[r - 1]) !== qs(i[r]) ? 0 : (i[r - 1] + i[r]) / 2) : i[r - 1]) : i[r];
    }
  (BC(e, i, o), UC(e, o, t));
}
function Qr(e, t, s) {
  return Math.max(Math.min(e, s), t);
}
function VC(e, t) {
  let s,
    n,
    i,
    o,
    r,
    a = rr(e[0], t);
  for (s = 0, n = e.length; s < n; ++s)
    ((r = o),
      (o = a),
      (a = s < n - 1 && rr(e[s + 1], t)),
      o &&
        ((i = e[s]),
        r && ((i.cp1x = Qr(i.cp1x, t.left, t.right)), (i.cp1y = Qr(i.cp1y, t.top, t.bottom))),
        a && ((i.cp2x = Qr(i.cp2x, t.left, t.right)), (i.cp2y = Qr(i.cp2y, t.top, t.bottom)))));
}
function HC(e, t, s, n, i) {
  let o, r, a, l;
  if ((t.spanGaps && (e = e.filter((c) => !c.skip)), t.cubicInterpolationMode === 'monotone'))
    jC(e, i);
  else {
    let c = n ? e[e.length - 1] : e[0];
    for (o = 0, r = e.length; o < r; ++o)
      ((a = e[o]),
        (l = FC(c, a, e[Math.min(o + 1, r - (n ? 0 : 1)) % r], t.tension)),
        (a.cp1x = l.previous.x),
        (a.cp1y = l.previous.y),
        (a.cp2x = l.next.x),
        (a.cp2y = l.next.y),
        (c = a));
  }
  t.capBezierPoints && VC(e, s);
}
function zd() {
  return typeof window < 'u' && typeof document < 'u';
}
function Wd(e) {
  let t = e.parentNode;
  return (t && t.toString() === '[object ShadowRoot]' && (t = t.host), t);
}
function La(e, t, s) {
  let n;
  return (
    typeof e == 'string'
      ? ((n = parseInt(e, 10)), e.indexOf('%') !== -1 && (n = (n / 100) * t.parentNode[s]))
      : (n = e),
    n
  );
}
const fl = (e) => e.ownerDocument.defaultView.getComputedStyle(e, null);
function zC(e, t) {
  return fl(e).getPropertyValue(t);
}
const WC = ['top', 'right', 'bottom', 'left'];
function fi(e, t, s) {
  const n = {};
  s = s ? '-' + s : '';
  for (let i = 0; i < 4; i++) {
    const o = WC[i];
    n[o] = parseFloat(e[t + '-' + o + s]) || 0;
  }
  return ((n.width = n.left + n.right), (n.height = n.top + n.bottom), n);
}
const KC = (e, t, s) => (e > 0 || t > 0) && (!s || !s.shadowRoot);
function qC(e, t) {
  const s = e.touches,
    n = s && s.length ? s[0] : e,
    { offsetX: i, offsetY: o } = n;
  let r = !1,
    a,
    l;
  if (KC(i, o, e.target)) ((a = i), (l = o));
  else {
    const c = t.getBoundingClientRect();
    ((a = n.clientX - c.left), (l = n.clientY - c.top), (r = !0));
  }
  return { x: a, y: l, box: r };
}
function ii(e, t) {
  if ('native' in e) return e;
  const { canvas: s, currentDevicePixelRatio: n } = t,
    i = fl(s),
    o = i.boxSizing === 'border-box',
    r = fi(i, 'padding'),
    a = fi(i, 'border', 'width'),
    { x: l, y: c, box: h } = qC(e, s),
    f = r.left + (h && a.left),
    m = r.top + (h && a.top);
  let { width: g, height: _ } = t;
  return (
    o && ((g -= r.width + a.width), (_ -= r.height + a.height)),
    { x: Math.round((((l - f) / g) * s.width) / n), y: Math.round((((c - m) / _) * s.height) / n) }
  );
}
function GC(e, t, s) {
  let n, i;
  if (t === void 0 || s === void 0) {
    const o = e && Wd(e);
    if (!o) ((t = e.clientWidth), (s = e.clientHeight));
    else {
      const r = o.getBoundingClientRect(),
        a = fl(o),
        l = fi(a, 'border', 'width'),
        c = fi(a, 'padding');
      ((t = r.width - c.width - l.width),
        (s = r.height - c.height - l.height),
        (n = La(a.maxWidth, o, 'clientWidth')),
        (i = La(a.maxHeight, o, 'clientHeight')));
    }
  }
  return { width: t, height: s, maxWidth: n || Ma, maxHeight: i || Ma };
}
const Rn = (e) => Math.round(e * 10) / 10;
function XC(e, t, s, n) {
  const i = fl(e),
    o = fi(i, 'margin'),
    r = La(i.maxWidth, e, 'clientWidth') || Ma,
    a = La(i.maxHeight, e, 'clientHeight') || Ma,
    l = GC(e, t, s);
  let { width: c, height: h } = l;
  if (i.boxSizing === 'content-box') {
    const m = fi(i, 'border', 'width'),
      g = fi(i, 'padding');
    ((c -= g.width + m.width), (h -= g.height + m.height));
  }
  return (
    (c = Math.max(0, c - o.width)),
    (h = Math.max(0, n ? c / n : h - o.height)),
    (c = Rn(Math.min(c, r, l.maxWidth))),
    (h = Rn(Math.min(h, a, l.maxHeight))),
    c && !h && (h = Rn(c / 2)),
    (t !== void 0 || s !== void 0) &&
      n &&
      l.height &&
      h > l.height &&
      ((h = l.height), (c = Rn(Math.floor(h * n)))),
    { width: c, height: h }
  );
}
function tp(e, t, s) {
  const n = t || 1,
    i = Rn(e.height * n),
    o = Rn(e.width * n);
  ((e.height = Rn(e.height)), (e.width = Rn(e.width)));
  const r = e.canvas;
  return (
    r.style &&
      (s || (!r.style.height && !r.style.width)) &&
      ((r.style.height = `${e.height}px`), (r.style.width = `${e.width}px`)),
    e.currentDevicePixelRatio !== n || r.height !== i || r.width !== o
      ? ((e.currentDevicePixelRatio = n),
        (r.height = i),
        (r.width = o),
        e.ctx.setTransform(n, 0, 0, n, 0, 0),
        !0)
      : !1
  );
}
const YC = (function () {
  let e = !1;
  try {
    const t = {
      get passive() {
        return ((e = !0), !1);
      }
    };
    zd() && (window.addEventListener('test', null, t), window.removeEventListener('test', null, t));
  } catch {}
  return e;
})();
function ep(e, t) {
  const s = zC(e, t),
    n = s && s.match(/^(\d+)(\.\d+)?px$/);
  return n ? +n[1] : void 0;
}
function oi(e, t, s, n) {
  return { x: e.x + s * (t.x - e.x), y: e.y + s * (t.y - e.y) };
}
function JC(e, t, s, n) {
  return {
    x: e.x + s * (t.x - e.x),
    y:
      n === 'middle'
        ? s < 0.5
          ? e.y
          : t.y
        : n === 'after'
          ? s < 1
            ? e.y
            : t.y
          : s > 0
            ? t.y
            : e.y
  };
}
function ZC(e, t, s, n) {
  const i = { x: e.cp2x, y: e.cp2y },
    o = { x: t.cp1x, y: t.cp1y },
    r = oi(e, i, s),
    a = oi(i, o, s),
    l = oi(o, t, s),
    c = oi(r, a, s),
    h = oi(a, l, s);
  return oi(c, h, s);
}
const QC = function (e, t) {
    return {
      x(s) {
        return e + e + t - s;
      },
      setWidth(s) {
        t = s;
      },
      textAlign(s) {
        return s === 'center' ? s : s === 'right' ? 'left' : 'right';
      },
      xPlus(s, n) {
        return s - n;
      },
      leftForLtr(s, n) {
        return s - n;
      }
    };
  },
  tT = function () {
    return {
      x(e) {
        return e;
      },
      setWidth(e) {},
      textAlign(e) {
        return e;
      },
      xPlus(e, t) {
        return e + t;
      },
      leftForLtr(e, t) {
        return e;
      }
    };
  };
function zi(e, t, s) {
  return e ? QC(t, s) : tT();
}
function hb(e, t) {
  let s, n;
  (t === 'ltr' || t === 'rtl') &&
    ((s = e.canvas.style),
    (n = [s.getPropertyValue('direction'), s.getPropertyPriority('direction')]),
    s.setProperty('direction', t, 'important'),
    (e.prevTextDirection = n));
}
function fb(e, t) {
  t !== void 0 && (delete e.prevTextDirection, e.canvas.style.setProperty('direction', t[0], t[1]));
}
function pb(e) {
  return e === 'angle'
    ? { between: or, compare: Qk, normalize: as }
    : { between: hn, compare: (t, s) => t - s, normalize: (t) => t };
}
function sp({ start: e, end: t, count: s, loop: n, style: i }) {
  return { start: e % s, end: t % s, loop: n && (t - e + 1) % s === 0, style: i };
}
function eT(e, t, s) {
  const { property: n, start: i, end: o } = s,
    { between: r, normalize: a } = pb(n),
    l = t.length;
  let { start: c, end: h, loop: f } = e,
    m,
    g;
  if (f) {
    for (c += l, h += l, m = 0, g = l; m < g && r(a(t[c % l][n]), i, o); ++m) (c--, h--);
    ((c %= l), (h %= l));
  }
  return (h < c && (h += l), { start: c, end: h, loop: f, style: e.style });
}
function mb(e, t, s) {
  if (!s) return [e];
  const { property: n, start: i, end: o } = s,
    r = t.length,
    { compare: a, between: l, normalize: c } = pb(n),
    { start: h, end: f, loop: m, style: g } = eT(e, t, s),
    _ = [];
  let y = !1,
    x = null,
    w,
    C,
    T;
  const E = () => l(i, T, w) && a(i, T) !== 0,
    M = () => a(o, w) === 0 || l(o, T, w),
    H = () => y || E(),
    $ = () => !y || M();
  for (let X = h, G = h; X <= f; ++X)
    ((C = t[X % r]),
      !C.skip &&
        ((w = c(C[n])),
        w !== T &&
          ((y = l(w, i, o)),
          x === null && H() && (x = a(w, i) === 0 ? X : G),
          x !== null &&
            $() &&
            (_.push(sp({ start: x, end: X, loop: m, count: r, style: g })), (x = null)),
          (G = X),
          (T = w))));
  return (x !== null && _.push(sp({ start: x, end: f, loop: m, count: r, style: g })), _);
}
function gb(e, t) {
  const s = [],
    n = e.segments;
  for (let i = 0; i < n.length; i++) {
    const o = mb(n[i], e.points, t);
    o.length && s.push(...o);
  }
  return s;
}
function sT(e, t, s, n) {
  let i = 0,
    o = t - 1;
  if (s && !n) for (; i < t && !e[i].skip; ) i++;
  for (; i < t && e[i].skip; ) i++;
  for (i %= t, s && (o += i); o > i && e[o % t].skip; ) o--;
  return ((o %= t), { start: i, end: o });
}
function nT(e, t, s, n) {
  const i = e.length,
    o = [];
  let r = t,
    a = e[t],
    l;
  for (l = t + 1; l <= s; ++l) {
    const c = e[l % i];
    (c.skip || c.stop
      ? a.skip ||
        ((n = !1), o.push({ start: t % i, end: (l - 1) % i, loop: n }), (t = r = c.stop ? l : null))
      : ((r = l), a.skip && (t = l)),
      (a = c));
  }
  return (r !== null && o.push({ start: t % i, end: r % i, loop: n }), o);
}
function iT(e, t) {
  const s = e.points,
    n = e.options.spanGaps,
    i = s.length;
  if (!i) return [];
  const o = !!e._loop,
    { start: r, end: a } = sT(s, i, o, n);
  if (n === !0) return np(e, [{ start: r, end: a, loop: o }], s, t);
  const l = a < r ? a + i : a,
    c = !!e._fullLoop && r === 0 && a === i - 1;
  return np(e, nT(s, r, l, c), s, t);
}
function np(e, t, s, n) {
  return !n || !n.setContext || !s ? t : oT(e, t, s, n);
}
function oT(e, t, s, n) {
  const i = e._chart.getContext(),
    o = ip(e.options),
    {
      _datasetIndex: r,
      options: { spanGaps: a }
    } = e,
    l = s.length,
    c = [];
  let h = o,
    f = t[0].start,
    m = f;
  function g(_, y, x, w) {
    const C = a ? -1 : 1;
    if (_ !== y) {
      for (_ += l; s[_ % l].skip; ) _ -= C;
      for (; s[y % l].skip; ) y += C;
      _ % l !== y % l &&
        (c.push({ start: _ % l, end: y % l, loop: x, style: w }), (h = w), (f = y % l));
    }
  }
  for (const _ of t) {
    f = a ? f : _.start;
    let y = s[f % l],
      x;
    for (m = f + 1; m <= _.end; m++) {
      const w = s[m % l];
      ((x = ip(
        n.setContext(
          _i(i, {
            type: 'segment',
            p0: y,
            p1: w,
            p0DataIndex: (m - 1) % l,
            p1DataIndex: m % l,
            datasetIndex: r
          })
        )
      )),
        rT(x, h) && g(f, m - 1, _.loop, h),
        (y = w),
        (h = x));
    }
    f < m - 1 && g(f, m - 1, _.loop, h);
  }
  return c;
}
function ip(e) {
  return {
    backgroundColor: e.backgroundColor,
    borderCapStyle: e.borderCapStyle,
    borderDash: e.borderDash,
    borderDashOffset: e.borderDashOffset,
    borderJoinStyle: e.borderJoinStyle,
    borderWidth: e.borderWidth,
    borderColor: e.borderColor
  };
}
function rT(e, t) {
  if (!t) return !1;
  const s = [],
    n = function (i, o) {
      return Fd(o) ? (s.includes(o) || s.push(o), s.indexOf(o)) : o;
    };
  return JSON.stringify(e, n) !== JSON.stringify(t, n);
}
function ta(e, t, s) {
  return e.options.clip ? e[s] : t[s];
}
function aT(e, t) {
  const { xScale: s, yScale: n } = e;
  return s && n
    ? {
        left: ta(s, t, 'left'),
        right: ta(s, t, 'right'),
        top: ta(n, t, 'top'),
        bottom: ta(n, t, 'bottom')
      }
    : t;
}
function bb(e, t) {
  const s = t._clip;
  if (s.disabled) return !1;
  const n = aT(t, e.chartArea);
  return {
    left: s.left === !1 ? 0 : n.left - (s.left === !0 ? 0 : s.left),
    right: s.right === !1 ? e.width : n.right + (s.right === !0 ? 0 : s.right),
    top: s.top === !1 ? 0 : n.top - (s.top === !0 ? 0 : s.top),
    bottom: s.bottom === !1 ? e.height : n.bottom + (s.bottom === !0 ? 0 : s.bottom)
  };
}
/*!
 * Chart.js v4.5.1
 * https://www.chartjs.org
 * (c) 2025 Chart.js Contributors
 * Released under the MIT License
 */ class lT {
  constructor() {
    ((this._request = null),
      (this._charts = new Map()),
      (this._running = !1),
      (this._lastDate = void 0));
  }
  _notify(t, s, n, i) {
    const o = s.listeners[i],
      r = s.duration;
    o.forEach((a) =>
      a({ chart: t, initial: s.initial, numSteps: r, currentStep: Math.min(n - s.start, r) })
    );
  }
  _refresh() {
    this._request ||
      ((this._running = !0),
      (this._request = sb.call(window, () => {
        (this._update(), (this._request = null), this._running && this._refresh());
      })));
  }
  _update(t = Date.now()) {
    let s = 0;
    (this._charts.forEach((n, i) => {
      if (!n.running || !n.items.length) return;
      const o = n.items;
      let r = o.length - 1,
        a = !1,
        l;
      for (; r >= 0; --r)
        ((l = o[r]),
          l._active
            ? (l._total > n.duration && (n.duration = l._total), l.tick(t), (a = !0))
            : ((o[r] = o[o.length - 1]), o.pop()));
      (a && (i.draw(), this._notify(i, n, t, 'progress')),
        o.length || ((n.running = !1), this._notify(i, n, t, 'complete'), (n.initial = !1)),
        (s += o.length));
    }),
      (this._lastDate = t),
      s === 0 && (this._running = !1));
  }
  _getAnims(t) {
    const s = this._charts;
    let n = s.get(t);
    return (
      n ||
        ((n = { running: !1, initial: !0, items: [], listeners: { complete: [], progress: [] } }),
        s.set(t, n)),
      n
    );
  }
  listen(t, s, n) {
    this._getAnims(t).listeners[s].push(n);
  }
  add(t, s) {
    !s || !s.length || this._getAnims(t).items.push(...s);
  }
  has(t) {
    return this._getAnims(t).items.length > 0;
  }
  start(t) {
    const s = this._charts.get(t);
    s &&
      ((s.running = !0),
      (s.start = Date.now()),
      (s.duration = s.items.reduce((n, i) => Math.max(n, i._duration), 0)),
      this._refresh());
  }
  running(t) {
    if (!this._running) return !1;
    const s = this._charts.get(t);
    return !(!s || !s.running || !s.items.length);
  }
  stop(t) {
    const s = this._charts.get(t);
    if (!s || !s.items.length) return;
    const n = s.items;
    let i = n.length - 1;
    for (; i >= 0; --i) n[i].cancel();
    ((s.items = []), this._notify(t, s, Date.now(), 'complete'));
  }
  remove(t) {
    return this._charts.delete(t);
  }
}
var sn = new lT();
const op = 'transparent',
  cT = {
    boolean(e, t, s) {
      return s > 0.5 ? t : e;
    },
    color(e, t, s) {
      const n = Gf(e || op),
        i = n.valid && Gf(t || op);
      return i && i.valid ? i.mix(n, s).hexString() : t;
    },
    number(e, t, s) {
      return e + (t - e) * s;
    }
  };
class dT {
  constructor(t, s, n, i) {
    const o = s[n];
    i = Zr([t.to, i, o, t.from]);
    const r = Zr([t.from, o, i]);
    ((this._active = !0),
      (this._fn = t.fn || cT[t.type || typeof r]),
      (this._easing = Vo[t.easing] || Vo.linear),
      (this._start = Math.floor(Date.now() + (t.delay || 0))),
      (this._duration = this._total = Math.floor(t.duration)),
      (this._loop = !!t.loop),
      (this._target = s),
      (this._prop = n),
      (this._from = r),
      (this._to = i),
      (this._promises = void 0));
  }
  active() {
    return this._active;
  }
  update(t, s, n) {
    if (this._active) {
      this._notify(!1);
      const i = this._target[this._prop],
        o = n - this._start,
        r = this._duration - o;
      ((this._start = n),
        (this._duration = Math.floor(Math.max(r, t.duration))),
        (this._total += o),
        (this._loop = !!t.loop),
        (this._to = Zr([t.to, s, i, t.from])),
        (this._from = Zr([t.from, i, s])));
    }
  }
  cancel() {
    this._active && (this.tick(Date.now()), (this._active = !1), this._notify(!1));
  }
  tick(t) {
    const s = t - this._start,
      n = this._duration,
      i = this._prop,
      o = this._from,
      r = this._loop,
      a = this._to;
    let l;
    if (((this._active = o !== a && (r || s < n)), !this._active)) {
      ((this._target[i] = a), this._notify(!0));
      return;
    }
    if (s < 0) {
      this._target[i] = o;
      return;
    }
    ((l = (s / n) % 2),
      (l = r && l > 1 ? 2 - l : l),
      (l = this._easing(Math.min(1, Math.max(0, l)))),
      (this._target[i] = this._fn(o, a, l)));
  }
  wait() {
    const t = this._promises || (this._promises = []);
    return new Promise((s, n) => {
      t.push({ res: s, rej: n });
    });
  }
  _notify(t) {
    const s = t ? 'res' : 'rej',
      n = this._promises || [];
    for (let i = 0; i < n.length; i++) n[i][s]();
  }
}
class _b {
  constructor(t, s) {
    ((this._chart = t), (this._properties = new Map()), this.configure(s));
  }
  configure(t) {
    if (!$t(t)) return;
    const s = Object.keys(ge.animation),
      n = this._properties;
    Object.getOwnPropertyNames(t).forEach((i) => {
      const o = t[i];
      if (!$t(o)) return;
      const r = {};
      for (const a of s) r[a] = o[a];
      ((ve(o.properties) && o.properties) || [i]).forEach((a) => {
        (a === i || !n.has(a)) && n.set(a, r);
      });
    });
  }
  _animateOptions(t, s) {
    const n = s.options,
      i = hT(t, n);
    if (!i) return [];
    const o = this._createAnimations(i, n);
    return (
      n.$shared &&
        uT(t.options.$animations, n).then(
          () => {
            t.options = n;
          },
          () => {}
        ),
      o
    );
  }
  _createAnimations(t, s) {
    const n = this._properties,
      i = [],
      o = t.$animations || (t.$animations = {}),
      r = Object.keys(s),
      a = Date.now();
    let l;
    for (l = r.length - 1; l >= 0; --l) {
      const c = r[l];
      if (c.charAt(0) === '$') continue;
      if (c === 'options') {
        i.push(...this._animateOptions(t, s));
        continue;
      }
      const h = s[c];
      let f = o[c];
      const m = n.get(c);
      if (f)
        if (m && f.active()) {
          f.update(m, h, a);
          continue;
        } else f.cancel();
      if (!m || !m.duration) {
        t[c] = h;
        continue;
      }
      ((o[c] = f = new dT(m, t, c, h)), i.push(f));
    }
    return i;
  }
  update(t, s) {
    if (this._properties.size === 0) {
      Object.assign(t, s);
      return;
    }
    const n = this._createAnimations(t, s);
    if (n.length) return (sn.add(this._chart, n), !0);
  }
}
function uT(e, t) {
  const s = [],
    n = Object.keys(t);
  for (let i = 0; i < n.length; i++) {
    const o = e[n[i]];
    o && o.active() && s.push(o.wait());
  }
  return Promise.all(s);
}
function hT(e, t) {
  if (!t) return;
  let s = e.options;
  if (!s) {
    e.options = t;
    return;
  }
  return (s.$shared && (e.options = s = Object.assign({}, s, { $shared: !1, $animations: {} })), s);
}
function rp(e, t) {
  const s = (e && e.options) || {},
    n = s.reverse,
    i = s.min === void 0 ? t : 0,
    o = s.max === void 0 ? t : 0;
  return { start: n ? o : i, end: n ? i : o };
}
function fT(e, t, s) {
  if (s === !1) return !1;
  const n = rp(e, s),
    i = rp(t, s);
  return { top: i.end, right: n.end, bottom: i.start, left: n.start };
}
function pT(e) {
  let t, s, n, i;
  return (
    $t(e) ? ((t = e.top), (s = e.right), (n = e.bottom), (i = e.left)) : (t = s = n = i = e),
    { top: t, right: s, bottom: n, left: i, disabled: e === !1 }
  );
}
function yb(e, t) {
  const s = [],
    n = e._getSortedDatasetMetas(t);
  let i, o;
  for (i = 0, o = n.length; i < o; ++i) s.push(n[i].index);
  return s;
}
function ap(e, t, s, n = {}) {
  const i = e.keys,
    o = n.mode === 'single';
  let r, a, l, c;
  if (t === null) return;
  let h = !1;
  for (r = 0, a = i.length; r < a; ++r) {
    if (((l = +i[r]), l === s)) {
      if (((h = !0), n.all)) continue;
      break;
    }
    ((c = e.values[l]), Ue(c) && (o || t === 0 || qs(t) === qs(c)) && (t += c));
  }
  return !h && !n.all ? 0 : t;
}
function mT(e, t) {
  const { iScale: s, vScale: n } = t,
    i = s.axis === 'x' ? 'x' : 'y',
    o = n.axis === 'x' ? 'x' : 'y',
    r = Object.keys(e),
    a = new Array(r.length);
  let l, c, h;
  for (l = 0, c = r.length; l < c; ++l) ((h = r[l]), (a[l] = { [i]: h, [o]: e[h] }));
  return a;
}
function _c(e, t) {
  const s = e && e.options.stacked;
  return s || (s === void 0 && t.stack !== void 0);
}
function gT(e, t, s) {
  return `${e.id}.${t.id}.${s.stack || s.type}`;
}
function bT(e) {
  const { min: t, max: s, minDefined: n, maxDefined: i } = e.getUserBounds();
  return { min: n ? t : Number.NEGATIVE_INFINITY, max: i ? s : Number.POSITIVE_INFINITY };
}
function _T(e, t, s) {
  const n = e[t] || (e[t] = {});
  return n[s] || (n[s] = {});
}
function lp(e, t, s, n) {
  for (const i of t.getMatchingVisibleMetas(n).reverse()) {
    const o = e[i.index];
    if ((s && o > 0) || (!s && o < 0)) return i.index;
  }
  return null;
}
function cp(e, t) {
  const { chart: s, _cachedMeta: n } = e,
    i = s._stacks || (s._stacks = {}),
    { iScale: o, vScale: r, index: a } = n,
    l = o.axis,
    c = r.axis,
    h = gT(o, r, n),
    f = t.length;
  let m;
  for (let g = 0; g < f; ++g) {
    const _ = t[g],
      { [l]: y, [c]: x } = _,
      w = _._stacks || (_._stacks = {});
    ((m = w[c] = _T(i, h, y)),
      (m[a] = x),
      (m._top = lp(m, r, !0, n.type)),
      (m._bottom = lp(m, r, !1, n.type)));
    const C = m._visualValues || (m._visualValues = {});
    C[a] = x;
  }
}
function yc(e, t) {
  const s = e.scales;
  return Object.keys(s)
    .filter((n) => s[n].axis === t)
    .shift();
}
function yT(e, t) {
  return _i(e, {
    active: !1,
    dataset: void 0,
    datasetIndex: t,
    index: t,
    mode: 'default',
    type: 'dataset'
  });
}
function vT(e, t, s) {
  return _i(e, {
    active: !1,
    dataIndex: t,
    parsed: void 0,
    raw: void 0,
    element: s,
    index: t,
    mode: 'default',
    type: 'data'
  });
}
function mo(e, t) {
  const s = e.controller.index,
    n = e.vScale && e.vScale.axis;
  if (n) {
    t = t || e._parsed;
    for (const i of t) {
      const o = i._stacks;
      if (!o || o[n] === void 0 || o[n][s] === void 0) return;
      (delete o[n][s],
        o[n]._visualValues !== void 0 &&
          o[n]._visualValues[s] !== void 0 &&
          delete o[n]._visualValues[s]);
    }
  }
}
const vc = (e) => e === 'reset' || e === 'none',
  dp = (e, t) => (t ? e : Object.assign({}, e)),
  xT = (e, t, s) => e && !t.hidden && t._stacked && { keys: yb(s, !0), values: null };
class pi {
  constructor(t, s) {
    ((this.chart = t),
      (this._ctx = t.ctx),
      (this.index = s),
      (this._cachedDataOpts = {}),
      (this._cachedMeta = this.getMeta()),
      (this._type = this._cachedMeta.type),
      (this.options = void 0),
      (this._parsing = !1),
      (this._data = void 0),
      (this._objectData = void 0),
      (this._sharedOptions = void 0),
      (this._drawStart = void 0),
      (this._drawCount = void 0),
      (this.enableOptionSharing = !1),
      (this.supportsDecimation = !1),
      (this.$context = void 0),
      (this._syncList = []),
      (this.datasetElementType = new.target.datasetElementType),
      (this.dataElementType = new.target.dataElementType),
      this.initialize());
  }
  initialize() {
    const t = this._cachedMeta;
    (this.configure(),
      this.linkScales(),
      (t._stacked = _c(t.vScale, t)),
      this.addElements(),
      this.options.fill &&
        !this.chart.isPluginEnabled('filler') &&
        console.warn(
          "Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options"
        ));
  }
  updateIndex(t) {
    (this.index !== t && mo(this._cachedMeta), (this.index = t));
  }
  linkScales() {
    const t = this.chart,
      s = this._cachedMeta,
      n = this.getDataset(),
      i = (f, m, g, _) => (f === 'x' ? m : f === 'r' ? _ : g),
      o = (s.xAxisID = Mt(n.xAxisID, yc(t, 'x'))),
      r = (s.yAxisID = Mt(n.yAxisID, yc(t, 'y'))),
      a = (s.rAxisID = Mt(n.rAxisID, yc(t, 'r'))),
      l = s.indexAxis,
      c = (s.iAxisID = i(l, o, r, a)),
      h = (s.vAxisID = i(l, r, o, a));
    ((s.xScale = this.getScaleForId(o)),
      (s.yScale = this.getScaleForId(r)),
      (s.rScale = this.getScaleForId(a)),
      (s.iScale = this.getScaleForId(c)),
      (s.vScale = this.getScaleForId(h)));
  }
  getDataset() {
    return this.chart.data.datasets[this.index];
  }
  getMeta() {
    return this.chart.getDatasetMeta(this.index);
  }
  getScaleForId(t) {
    return this.chart.scales[t];
  }
  _getOtherScale(t) {
    const s = this._cachedMeta;
    return t === s.iScale ? s.vScale : s.iScale;
  }
  reset() {
    this._update('reset');
  }
  _destroy() {
    const t = this._cachedMeta;
    (this._data && Wf(this._data, this), t._stacked && mo(t));
  }
  _dataCheck() {
    const t = this.getDataset(),
      s = t.data || (t.data = []),
      n = this._data;
    if ($t(s)) {
      const i = this._cachedMeta;
      this._data = mT(s, i);
    } else if (n !== s) {
      if (n) {
        Wf(n, this);
        const i = this._cachedMeta;
        (mo(i), (i._parsed = []));
      }
      (s && Object.isExtensible(s) && nC(s, this), (this._syncList = []), (this._data = s));
    }
  }
  addElements() {
    const t = this._cachedMeta;
    (this._dataCheck(), this.datasetElementType && (t.dataset = new this.datasetElementType()));
  }
  buildOrUpdateElements(t) {
    const s = this._cachedMeta,
      n = this.getDataset();
    let i = !1;
    this._dataCheck();
    const o = s._stacked;
    ((s._stacked = _c(s.vScale, s)),
      s.stack !== n.stack && ((i = !0), mo(s), (s.stack = n.stack)),
      this._resyncElements(t),
      (i || o !== s._stacked) && (cp(this, s._parsed), (s._stacked = _c(s.vScale, s))));
  }
  configure() {
    const t = this.chart.config,
      s = t.datasetScopeKeys(this._type),
      n = t.getOptionScopes(this.getDataset(), s, !0);
    ((this.options = t.createResolver(n, this.getContext())),
      (this._parsing = this.options.parsing),
      (this._cachedDataOpts = {}));
  }
  parse(t, s) {
    const { _cachedMeta: n, _data: i } = this,
      { iScale: o, _stacked: r } = n,
      a = o.axis;
    let l = t === 0 && s === i.length ? !0 : n._sorted,
      c = t > 0 && n._parsed[t - 1],
      h,
      f,
      m;
    if (this._parsing === !1) ((n._parsed = i), (n._sorted = !0), (m = i));
    else {
      ve(i[t])
        ? (m = this.parseArrayData(n, i, t, s))
        : $t(i[t])
          ? (m = this.parseObjectData(n, i, t, s))
          : (m = this.parsePrimitiveData(n, i, t, s));
      const g = () => f[a] === null || (c && f[a] < c[a]);
      for (h = 0; h < s; ++h) ((n._parsed[h + t] = f = m[h]), l && (g() && (l = !1), (c = f)));
      n._sorted = l;
    }
    r && cp(this, m);
  }
  parsePrimitiveData(t, s, n, i) {
    const { iScale: o, vScale: r } = t,
      a = o.axis,
      l = r.axis,
      c = o.getLabels(),
      h = o === r,
      f = new Array(i);
    let m, g, _;
    for (m = 0, g = i; m < g; ++m)
      ((_ = m + n), (f[m] = { [a]: h || o.parse(c[_], _), [l]: r.parse(s[_], _) }));
    return f;
  }
  parseArrayData(t, s, n, i) {
    const { xScale: o, yScale: r } = t,
      a = new Array(i);
    let l, c, h, f;
    for (l = 0, c = i; l < c; ++l)
      ((h = l + n), (f = s[h]), (a[l] = { x: o.parse(f[0], h), y: r.parse(f[1], h) }));
    return a;
  }
  parseObjectData(t, s, n, i) {
    const { xScale: o, yScale: r } = t,
      { xAxisKey: a = 'x', yAxisKey: l = 'y' } = this._parsing,
      c = new Array(i);
    let h, f, m, g;
    for (h = 0, f = i; h < f; ++h)
      ((m = h + n), (g = s[m]), (c[h] = { x: o.parse(gi(g, a), m), y: r.parse(gi(g, l), m) }));
    return c;
  }
  getParsed(t) {
    return this._cachedMeta._parsed[t];
  }
  getDataElement(t) {
    return this._cachedMeta.data[t];
  }
  applyStack(t, s, n) {
    const i = this.chart,
      o = this._cachedMeta,
      r = s[t.axis],
      a = { keys: yb(i, !0), values: s._stacks[t.axis]._visualValues };
    return ap(a, r, o.index, { mode: n });
  }
  updateRangeFromParsed(t, s, n, i) {
    const o = n[s.axis];
    let r = o === null ? NaN : o;
    const a = i && n._stacks[s.axis];
    (i && a && ((i.values = a), (r = ap(i, o, this._cachedMeta.index))),
      (t.min = Math.min(t.min, r)),
      (t.max = Math.max(t.max, r)));
  }
  getMinMax(t, s) {
    const n = this._cachedMeta,
      i = n._parsed,
      o = n._sorted && t === n.iScale,
      r = i.length,
      a = this._getOtherScale(t),
      l = xT(s, n, this.chart),
      c = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
      { min: h, max: f } = bT(a);
    let m, g;
    function _() {
      g = i[m];
      const y = g[a.axis];
      return !Ue(g[t.axis]) || h > y || f < y;
    }
    for (m = 0; m < r && !(!_() && (this.updateRangeFromParsed(c, t, g, l), o)); ++m);
    if (o) {
      for (m = r - 1; m >= 0; --m)
        if (!_()) {
          this.updateRangeFromParsed(c, t, g, l);
          break;
        }
    }
    return c;
  }
  getAllParsedValues(t) {
    const s = this._cachedMeta._parsed,
      n = [];
    let i, o, r;
    for (i = 0, o = s.length; i < o; ++i) ((r = s[i][t.axis]), Ue(r) && n.push(r));
    return n;
  }
  getMaxOverflow() {
    return !1;
  }
  getLabelAndValue(t) {
    const s = this._cachedMeta,
      n = s.iScale,
      i = s.vScale,
      o = this.getParsed(t);
    return {
      label: n ? '' + n.getLabelForValue(o[n.axis]) : '',
      value: i ? '' + i.getLabelForValue(o[i.axis]) : ''
    };
  }
  _update(t) {
    const s = this._cachedMeta;
    (this.update(t || 'default'),
      (s._clip = pT(Mt(this.options.clip, fT(s.xScale, s.yScale, this.getMaxOverflow())))));
  }
  update(t) {}
  draw() {
    const t = this._ctx,
      s = this.chart,
      n = this._cachedMeta,
      i = n.data || [],
      o = s.chartArea,
      r = [],
      a = this._drawStart || 0,
      l = this._drawCount || i.length - a,
      c = this.options.drawActiveElementsOnTop;
    let h;
    for (n.dataset && n.dataset.draw(t, o, a, l), h = a; h < a + l; ++h) {
      const f = i[h];
      f.hidden || (f.active && c ? r.push(f) : f.draw(t, o));
    }
    for (h = 0; h < r.length; ++h) r[h].draw(t, o);
  }
  getStyle(t, s) {
    const n = s ? 'active' : 'default';
    return t === void 0 && this._cachedMeta.dataset
      ? this.resolveDatasetElementOptions(n)
      : this.resolveDataElementOptions(t || 0, n);
  }
  getContext(t, s, n) {
    const i = this.getDataset();
    let o;
    if (t >= 0 && t < this._cachedMeta.data.length) {
      const r = this._cachedMeta.data[t];
      ((o = r.$context || (r.$context = vT(this.getContext(), t, r))),
        (o.parsed = this.getParsed(t)),
        (o.raw = i.data[t]),
        (o.index = o.dataIndex = t));
    } else
      ((o = this.$context || (this.$context = yT(this.chart.getContext(), this.index))),
        (o.dataset = i),
        (o.index = o.datasetIndex = this.index));
    return ((o.active = !!s), (o.mode = n), o);
  }
  resolveDatasetElementOptions(t) {
    return this._resolveElementOptions(this.datasetElementType.id, t);
  }
  resolveDataElementOptions(t, s) {
    return this._resolveElementOptions(this.dataElementType.id, s, t);
  }
  _resolveElementOptions(t, s = 'default', n) {
    const i = s === 'active',
      o = this._cachedDataOpts,
      r = t + '-' + s,
      a = o[r],
      l = this.enableOptionSharing && nr(n);
    if (a) return dp(a, l);
    const c = this.chart.config,
      h = c.datasetElementScopeKeys(this._type, t),
      f = i ? [`${t}Hover`, 'hover', t, ''] : [t, ''],
      m = c.getOptionScopes(this.getDataset(), h),
      g = Object.keys(ge.elements[t]),
      _ = () => this.getContext(n, i, s),
      y = c.resolveNamedOptions(m, g, _, f);
    return (y.$shared && ((y.$shared = l), (o[r] = Object.freeze(dp(y, l)))), y);
  }
  _resolveAnimations(t, s, n) {
    const i = this.chart,
      o = this._cachedDataOpts,
      r = `animation-${s}`,
      a = o[r];
    if (a) return a;
    let l;
    if (i.options.animation !== !1) {
      const h = this.chart.config,
        f = h.datasetAnimationScopeKeys(this._type, s),
        m = h.getOptionScopes(this.getDataset(), f);
      l = h.createResolver(m, this.getContext(t, n, s));
    }
    const c = new _b(i, l && l.animations);
    return (l && l._cacheable && (o[r] = Object.freeze(c)), c);
  }
  getSharedOptions(t) {
    if (t.$shared) return this._sharedOptions || (this._sharedOptions = Object.assign({}, t));
  }
  includeOptions(t, s) {
    return !s || vc(t) || this.chart._animationsDisabled;
  }
  _getSharedOptions(t, s) {
    const n = this.resolveDataElementOptions(t, s),
      i = this._sharedOptions,
      o = this.getSharedOptions(n),
      r = this.includeOptions(s, o) || o !== i;
    return (this.updateSharedOptions(o, s, n), { sharedOptions: o, includeOptions: r });
  }
  updateElement(t, s, n, i) {
    vc(i) ? Object.assign(t, n) : this._resolveAnimations(s, i).update(t, n);
  }
  updateSharedOptions(t, s, n) {
    t && !vc(s) && this._resolveAnimations(void 0, s).update(t, n);
  }
  _setStyle(t, s, n, i) {
    t.active = i;
    const o = this.getStyle(s, i);
    this._resolveAnimations(s, n, i).update(t, { options: (!i && this.getSharedOptions(o)) || o });
  }
  removeHoverStyle(t, s, n) {
    this._setStyle(t, n, 'active', !1);
  }
  setHoverStyle(t, s, n) {
    this._setStyle(t, n, 'active', !0);
  }
  _removeDatasetHoverStyle() {
    const t = this._cachedMeta.dataset;
    t && this._setStyle(t, void 0, 'active', !1);
  }
  _setDatasetHoverStyle() {
    const t = this._cachedMeta.dataset;
    t && this._setStyle(t, void 0, 'active', !0);
  }
  _resyncElements(t) {
    const s = this._data,
      n = this._cachedMeta.data;
    for (const [a, l, c] of this._syncList) this[a](l, c);
    this._syncList = [];
    const i = n.length,
      o = s.length,
      r = Math.min(o, i);
    (r && this.parse(0, r),
      o > i ? this._insertElements(i, o - i, t) : o < i && this._removeElements(o, i - o));
  }
  _insertElements(t, s, n = !0) {
    const i = this._cachedMeta,
      o = i.data,
      r = t + s;
    let a;
    const l = (c) => {
      for (c.length += s, a = c.length - 1; a >= r; a--) c[a] = c[a - s];
    };
    for (l(o), a = t; a < r; ++a) o[a] = new this.dataElementType();
    (this._parsing && l(i._parsed), this.parse(t, s), n && this.updateElements(o, t, s, 'reset'));
  }
  updateElements(t, s, n, i) {}
  _removeElements(t, s) {
    const n = this._cachedMeta;
    if (this._parsing) {
      const i = n._parsed.splice(t, s);
      n._stacked && mo(n, i);
    }
    n.data.splice(t, s);
  }
  _sync(t) {
    if (this._parsing) this._syncList.push(t);
    else {
      const [s, n, i] = t;
      this[s](n, i);
    }
    this.chart._dataChanges.push([this.index, ...t]);
  }
  _onDataPush() {
    const t = arguments.length;
    this._sync(['_insertElements', this.getDataset().data.length - t, t]);
  }
  _onDataPop() {
    this._sync(['_removeElements', this._cachedMeta.data.length - 1, 1]);
  }
  _onDataShift() {
    this._sync(['_removeElements', 0, 1]);
  }
  _onDataSplice(t, s) {
    s && this._sync(['_removeElements', t, s]);
    const n = arguments.length - 2;
    n && this._sync(['_insertElements', t, n]);
  }
  _onDataUnshift() {
    this._sync(['_insertElements', 0, arguments.length]);
  }
}
(ct(pi, 'defaults', {}), ct(pi, 'datasetElementType', null), ct(pi, 'dataElementType', null));
function wT(e, t) {
  if (!e._cache.$bar) {
    const s = e.getMatchingVisibleMetas(t);
    let n = [];
    for (let i = 0, o = s.length; i < o; i++) n = n.concat(s[i].controller.getAllParsedValues(e));
    e._cache.$bar = eb(n.sort((i, o) => i - o));
  }
  return e._cache.$bar;
}
function ST(e) {
  const t = e.iScale,
    s = wT(t, e.type);
  let n = t._length,
    i,
    o,
    r,
    a;
  const l = () => {
    r === 32767 || r === -32768 || (nr(a) && (n = Math.min(n, Math.abs(r - a) || n)), (a = r));
  };
  for (i = 0, o = s.length; i < o; ++i) ((r = t.getPixelForValue(s[i])), l());
  for (a = void 0, i = 0, o = t.ticks.length; i < o; ++i) ((r = t.getPixelForTick(i)), l());
  return n;
}
function kT(e, t, s, n) {
  const i = s.barThickness;
  let o, r;
  return (
    Gt(i) ? ((o = t.min * s.categoryPercentage), (r = s.barPercentage)) : ((o = i * n), (r = 1)),
    { chunk: o / n, ratio: r, start: t.pixels[e] - o / 2 }
  );
}
function CT(e, t, s, n) {
  const i = t.pixels,
    o = i[e];
  let r = e > 0 ? i[e - 1] : null,
    a = e < i.length - 1 ? i[e + 1] : null;
  const l = s.categoryPercentage;
  (r === null && (r = o - (a === null ? t.end - t.start : a - o)), a === null && (a = o + o - r));
  const c = o - ((o - Math.min(r, a)) / 2) * l;
  return { chunk: ((Math.abs(a - r) / 2) * l) / n, ratio: s.barPercentage, start: c };
}
function TT(e, t, s, n) {
  const i = s.parse(e[0], n),
    o = s.parse(e[1], n),
    r = Math.min(i, o),
    a = Math.max(i, o);
  let l = r,
    c = a;
  (Math.abs(r) > Math.abs(a) && ((l = a), (c = r)),
    (t[s.axis] = c),
    (t._custom = { barStart: l, barEnd: c, start: i, end: o, min: r, max: a }));
}
function vb(e, t, s, n) {
  return (ve(e) ? TT(e, t, s, n) : (t[s.axis] = s.parse(e, n)), t);
}
function up(e, t, s, n) {
  const i = e.iScale,
    o = e.vScale,
    r = i.getLabels(),
    a = i === o,
    l = [];
  let c, h, f, m;
  for (c = s, h = s + n; c < h; ++c)
    ((m = t[c]), (f = {}), (f[i.axis] = a || i.parse(r[c], c)), l.push(vb(m, f, o, c)));
  return l;
}
function xc(e) {
  return e && e.barStart !== void 0 && e.barEnd !== void 0;
}
function AT(e, t, s) {
  return e !== 0 ? qs(e) : (t.isHorizontal() ? 1 : -1) * (t.min >= s ? 1 : -1);
}
function PT(e) {
  let t, s, n, i, o;
  return (
    e.horizontal
      ? ((t = e.base > e.x), (s = 'left'), (n = 'right'))
      : ((t = e.base < e.y), (s = 'bottom'), (n = 'top')),
    t ? ((i = 'end'), (o = 'start')) : ((i = 'start'), (o = 'end')),
    { start: s, end: n, reverse: t, top: i, bottom: o }
  );
}
function OT(e, t, s, n) {
  let i = t.borderSkipped;
  const o = {};
  if (!i) {
    e.borderSkipped = o;
    return;
  }
  if (i === !0) {
    e.borderSkipped = { top: !0, right: !0, bottom: !0, left: !0 };
    return;
  }
  const { start: r, end: a, reverse: l, top: c, bottom: h } = PT(e);
  (i === 'middle' &&
    s &&
    ((e.enableBorderRadius = !0),
    (s._top || 0) === n
      ? (i = c)
      : (s._bottom || 0) === n
        ? (i = h)
        : ((o[hp(h, r, a, l)] = !0), (i = c))),
    (o[hp(i, r, a, l)] = !0),
    (e.borderSkipped = o));
}
function hp(e, t, s, n) {
  return (n ? ((e = ET(e, t, s)), (e = fp(e, s, t))) : (e = fp(e, t, s)), e);
}
function ET(e, t, s) {
  return e === t ? s : e === s ? t : e;
}
function fp(e, t, s) {
  return e === 'start' ? t : e === 'end' ? s : e;
}
function RT(e, { inflateAmount: t }, s) {
  e.inflateAmount = t === 'auto' ? (s === 1 ? 0.33 : 0) : t;
}
class ba extends pi {
  parsePrimitiveData(t, s, n, i) {
    return up(t, s, n, i);
  }
  parseArrayData(t, s, n, i) {
    return up(t, s, n, i);
  }
  parseObjectData(t, s, n, i) {
    const { iScale: o, vScale: r } = t,
      { xAxisKey: a = 'x', yAxisKey: l = 'y' } = this._parsing,
      c = o.axis === 'x' ? a : l,
      h = r.axis === 'x' ? a : l,
      f = [];
    let m, g, _, y;
    for (m = n, g = n + i; m < g; ++m)
      ((y = s[m]), (_ = {}), (_[o.axis] = o.parse(gi(y, c), m)), f.push(vb(gi(y, h), _, r, m)));
    return f;
  }
  updateRangeFromParsed(t, s, n, i) {
    super.updateRangeFromParsed(t, s, n, i);
    const o = n._custom;
    o &&
      s === this._cachedMeta.vScale &&
      ((t.min = Math.min(t.min, o.min)), (t.max = Math.max(t.max, o.max)));
  }
  getMaxOverflow() {
    return 0;
  }
  getLabelAndValue(t) {
    const s = this._cachedMeta,
      { iScale: n, vScale: i } = s,
      o = this.getParsed(t),
      r = o._custom,
      a = xc(r) ? '[' + r.start + ', ' + r.end + ']' : '' + i.getLabelForValue(o[i.axis]);
    return { label: '' + n.getLabelForValue(o[n.axis]), value: a };
  }
  initialize() {
    ((this.enableOptionSharing = !0), super.initialize());
    const t = this._cachedMeta;
    t.stack = this.getDataset().stack;
  }
  update(t) {
    const s = this._cachedMeta;
    this.updateElements(s.data, 0, s.data.length, t);
  }
  updateElements(t, s, n, i) {
    const o = i === 'reset',
      {
        index: r,
        _cachedMeta: { vScale: a }
      } = this,
      l = a.getBasePixel(),
      c = a.isHorizontal(),
      h = this._getRuler(),
      { sharedOptions: f, includeOptions: m } = this._getSharedOptions(s, i);
    for (let g = s; g < s + n; g++) {
      const _ = this.getParsed(g),
        y = o || Gt(_[a.axis]) ? { base: l, head: l } : this._calculateBarValuePixels(g),
        x = this._calculateBarIndexPixels(g, h),
        w = (_._stacks || {})[a.axis],
        C = {
          horizontal: c,
          base: y.base,
          enableBorderRadius: !w || xc(_._custom) || r === w._top || r === w._bottom,
          x: c ? y.head : x.center,
          y: c ? x.center : y.head,
          height: c ? x.size : Math.abs(y.size),
          width: c ? Math.abs(y.size) : x.size
        };
      m && (C.options = f || this.resolveDataElementOptions(g, t[g].active ? 'active' : i));
      const T = C.options || t[g].options;
      (OT(C, T, w, r), RT(C, T, h.ratio), this.updateElement(t[g], g, C, i));
    }
  }
  _getStacks(t, s) {
    const { iScale: n } = this._cachedMeta,
      i = n.getMatchingVisibleMetas(this._type).filter((h) => h.controller.options.grouped),
      o = n.options.stacked,
      r = [],
      a = this._cachedMeta.controller.getParsed(s),
      l = a && a[n.axis],
      c = (h) => {
        const f = h._parsed.find((g) => g[n.axis] === l),
          m = f && f[h.vScale.axis];
        if (Gt(m) || isNaN(m)) return !0;
      };
    for (const h of i)
      if (
        !(s !== void 0 && c(h)) &&
        ((o === !1 || r.indexOf(h.stack) === -1 || (o === void 0 && h.stack === void 0)) &&
          r.push(h.stack),
        h.index === t)
      )
        break;
    return (r.length || r.push(void 0), r);
  }
  _getStackCount(t) {
    return this._getStacks(void 0, t).length;
  }
  _getAxisCount() {
    return this._getAxis().length;
  }
  getFirstScaleIdForIndexAxis() {
    const t = this.chart.scales,
      s = this.chart.options.indexAxis;
    return Object.keys(t)
      .filter((n) => t[n].axis === s)
      .shift();
  }
  _getAxis() {
    const t = {},
      s = this.getFirstScaleIdForIndexAxis();
    for (const n of this.chart.data.datasets)
      t[Mt(this.chart.options.indexAxis === 'x' ? n.xAxisID : n.yAxisID, s)] = !0;
    return Object.keys(t);
  }
  _getStackIndex(t, s, n) {
    const i = this._getStacks(t, n),
      o = s !== void 0 ? i.indexOf(s) : -1;
    return o === -1 ? i.length - 1 : o;
  }
  _getRuler() {
    const t = this.options,
      s = this._cachedMeta,
      n = s.iScale,
      i = [];
    let o, r;
    for (o = 0, r = s.data.length; o < r; ++o)
      i.push(n.getPixelForValue(this.getParsed(o)[n.axis], o));
    const a = t.barThickness;
    return {
      min: a || ST(s),
      pixels: i,
      start: n._startPixel,
      end: n._endPixel,
      stackCount: this._getStackCount(),
      scale: n,
      grouped: t.grouped,
      ratio: a ? 1 : t.categoryPercentage * t.barPercentage
    };
  }
  _calculateBarValuePixels(t) {
    const {
        _cachedMeta: { vScale: s, _stacked: n, index: i },
        options: { base: o, minBarLength: r }
      } = this,
      a = o || 0,
      l = this.getParsed(t),
      c = l._custom,
      h = xc(c);
    let f = l[s.axis],
      m = 0,
      g = n ? this.applyStack(s, l, n) : f,
      _,
      y;
    (g !== f && ((m = g - f), (g = f)),
      h &&
        ((f = c.barStart),
        (g = c.barEnd - c.barStart),
        f !== 0 && qs(f) !== qs(c.barEnd) && (m = 0),
        (m += f)));
    const x = !Gt(o) && !h ? o : m;
    let w = s.getPixelForValue(x);
    if (
      (this.chart.getDataVisibility(t) ? (_ = s.getPixelForValue(m + g)) : (_ = w),
      (y = _ - w),
      Math.abs(y) < r)
    ) {
      ((y = AT(y, s, a) * r), f === a && (w -= y / 2));
      const C = s.getPixelForDecimal(0),
        T = s.getPixelForDecimal(1),
        E = Math.min(C, T),
        M = Math.max(C, T);
      ((w = Math.max(Math.min(w, M), E)),
        (_ = w + y),
        n &&
          !h &&
          (l._stacks[s.axis]._visualValues[i] = s.getValueForPixel(_) - s.getValueForPixel(w)));
    }
    if (w === s.getPixelForValue(a)) {
      const C = (qs(y) * s.getLineWidthForValue(a)) / 2;
      ((w += C), (y -= C));
    }
    return { size: y, base: w, head: _, center: _ + y / 2 };
  }
  _calculateBarIndexPixels(t, s) {
    const n = s.scale,
      i = this.options,
      o = i.skipNull,
      r = Mt(i.maxBarThickness, 1 / 0);
    let a, l;
    const c = this._getAxisCount();
    if (s.grouped) {
      const h = o ? this._getStackCount(t) : s.stackCount,
        f = i.barThickness === 'flex' ? CT(t, s, i, h * c) : kT(t, s, i, h * c),
        m =
          this.chart.options.indexAxis === 'x'
            ? this.getDataset().xAxisID
            : this.getDataset().yAxisID,
        g = this._getAxis().indexOf(Mt(m, this.getFirstScaleIdForIndexAxis())),
        _ = this._getStackIndex(this.index, this._cachedMeta.stack, o ? t : void 0) + g;
      ((a = f.start + f.chunk * _ + f.chunk / 2), (l = Math.min(r, f.chunk * f.ratio)));
    } else
      ((a = n.getPixelForValue(this.getParsed(t)[n.axis], t)), (l = Math.min(r, s.min * s.ratio)));
    return { base: a - l / 2, head: a + l / 2, center: a, size: l };
  }
  draw() {
    const t = this._cachedMeta,
      s = t.vScale,
      n = t.data,
      i = n.length;
    let o = 0;
    for (; o < i; ++o) this.getParsed(o)[s.axis] !== null && !n[o].hidden && n[o].draw(this._ctx);
  }
}
(ct(ba, 'id', 'bar'),
  ct(ba, 'defaults', {
    datasetElementType: !1,
    dataElementType: 'bar',
    categoryPercentage: 0.8,
    barPercentage: 0.9,
    grouped: !0,
    animations: { numbers: { type: 'number', properties: ['x', 'y', 'base', 'width', 'height'] } }
  }),
  ct(ba, 'overrides', {
    scales: {
      _index_: { type: 'category', offset: !0, grid: { offset: !0 } },
      _value_: { type: 'linear', beginAtZero: !0 }
    }
  }));
function DT(e, t, s) {
  let n = 1,
    i = 1,
    o = 0,
    r = 0;
  if (t < he) {
    const a = e,
      l = a + t,
      c = Math.cos(a),
      h = Math.sin(a),
      f = Math.cos(l),
      m = Math.sin(l),
      g = (T, E, M) => (or(T, a, l, !0) ? 1 : Math.max(E, E * s, M, M * s)),
      _ = (T, E, M) => (or(T, a, l, !0) ? -1 : Math.min(E, E * s, M, M * s)),
      y = g(0, c, f),
      x = g(Te, h, m),
      w = _(Qt, c, f),
      C = _(Qt + Te, h, m);
    ((n = (y - w) / 2), (i = (x - C) / 2), (o = -(y + w) / 2), (r = -(x + C) / 2));
  }
  return { ratioX: n, ratioY: i, offsetX: o, offsetY: r };
}
class To extends pi {
  constructor(t, s) {
    (super(t, s),
      (this.enableOptionSharing = !0),
      (this.innerRadius = void 0),
      (this.outerRadius = void 0),
      (this.offsetX = void 0),
      (this.offsetY = void 0));
  }
  linkScales() {}
  parse(t, s) {
    const n = this.getDataset().data,
      i = this._cachedMeta;
    if (this._parsing === !1) i._parsed = n;
    else {
      let o = (l) => +n[l];
      if ($t(n[t])) {
        const { key: l = 'value' } = this._parsing;
        o = (c) => +gi(n[c], l);
      }
      let r, a;
      for (r = t, a = t + s; r < a; ++r) i._parsed[r] = o(r);
    }
  }
  _getRotation() {
    return un(this.options.rotation - 90);
  }
  _getCircumference() {
    return un(this.options.circumference);
  }
  _getRotationExtents() {
    let t = he,
      s = -he;
    for (let n = 0; n < this.chart.data.datasets.length; ++n)
      if (this.chart.isDatasetVisible(n) && this.chart.getDatasetMeta(n).type === this._type) {
        const i = this.chart.getDatasetMeta(n).controller,
          o = i._getRotation(),
          r = i._getCircumference();
        ((t = Math.min(t, o)), (s = Math.max(s, o + r)));
      }
    return { rotation: t, circumference: s - t };
  }
  update(t) {
    const s = this.chart,
      { chartArea: n } = s,
      i = this._cachedMeta,
      o = i.data,
      r = this.getMaxBorderWidth() + this.getMaxOffset(o) + this.options.spacing,
      a = Math.max((Math.min(n.width, n.height) - r) / 2, 0),
      l = Math.min(Uk(this.options.cutout, a), 1),
      c = this._getRingWeight(this.index),
      { circumference: h, rotation: f } = this._getRotationExtents(),
      { ratioX: m, ratioY: g, offsetX: _, offsetY: y } = DT(f, h, l),
      x = (n.width - r) / m,
      w = (n.height - r) / g,
      C = Math.max(Math.min(x, w) / 2, 0),
      T = Yg(this.options.radius, C),
      E = Math.max(T * l, 0),
      M = (T - E) / this._getVisibleDatasetWeightTotal();
    ((this.offsetX = _ * T),
      (this.offsetY = y * T),
      (i.total = this.calculateTotal()),
      (this.outerRadius = T - M * this._getRingWeightOffset(this.index)),
      (this.innerRadius = Math.max(this.outerRadius - M * c, 0)),
      this.updateElements(o, 0, o.length, t));
  }
  _circumference(t, s) {
    const n = this.options,
      i = this._cachedMeta,
      o = this._getCircumference();
    return (s && n.animation.animateRotate) ||
      !this.chart.getDataVisibility(t) ||
      i._parsed[t] === null ||
      i.data[t].hidden
      ? 0
      : this.calculateCircumference((i._parsed[t] * o) / he);
  }
  updateElements(t, s, n, i) {
    const o = i === 'reset',
      r = this.chart,
      a = r.chartArea,
      c = r.options.animation,
      h = (a.left + a.right) / 2,
      f = (a.top + a.bottom) / 2,
      m = o && c.animateScale,
      g = m ? 0 : this.innerRadius,
      _ = m ? 0 : this.outerRadius,
      { sharedOptions: y, includeOptions: x } = this._getSharedOptions(s, i);
    let w = this._getRotation(),
      C;
    for (C = 0; C < s; ++C) w += this._circumference(C, o);
    for (C = s; C < s + n; ++C) {
      const T = this._circumference(C, o),
        E = t[C],
        M = {
          x: h + this.offsetX,
          y: f + this.offsetY,
          startAngle: w,
          endAngle: w + T,
          circumference: T,
          outerRadius: _,
          innerRadius: g
        };
      (x && (M.options = y || this.resolveDataElementOptions(C, E.active ? 'active' : i)),
        (w += T),
        this.updateElement(E, C, M, i));
    }
  }
  calculateTotal() {
    const t = this._cachedMeta,
      s = t.data;
    let n = 0,
      i;
    for (i = 0; i < s.length; i++) {
      const o = t._parsed[i];
      o !== null &&
        !isNaN(o) &&
        this.chart.getDataVisibility(i) &&
        !s[i].hidden &&
        (n += Math.abs(o));
    }
    return n;
  }
  calculateCircumference(t) {
    const s = this._cachedMeta.total;
    return s > 0 && !isNaN(t) ? he * (Math.abs(t) / s) : 0;
  }
  getLabelAndValue(t) {
    const s = this._cachedMeta,
      n = this.chart,
      i = n.data.labels || [],
      o = Bd(s._parsed[t], n.options.locale);
    return { label: i[t] || '', value: o };
  }
  getMaxBorderWidth(t) {
    let s = 0;
    const n = this.chart;
    let i, o, r, a, l;
    if (!t) {
      for (i = 0, o = n.data.datasets.length; i < o; ++i)
        if (n.isDatasetVisible(i)) {
          ((r = n.getDatasetMeta(i)), (t = r.data), (a = r.controller));
          break;
        }
    }
    if (!t) return 0;
    for (i = 0, o = t.length; i < o; ++i)
      ((l = a.resolveDataElementOptions(i)),
        l.borderAlign !== 'inner' &&
          (s = Math.max(s, l.borderWidth || 0, l.hoverBorderWidth || 0)));
    return s;
  }
  getMaxOffset(t) {
    let s = 0;
    for (let n = 0, i = t.length; n < i; ++n) {
      const o = this.resolveDataElementOptions(n);
      s = Math.max(s, o.offset || 0, o.hoverOffset || 0);
    }
    return s;
  }
  _getRingWeightOffset(t) {
    let s = 0;
    for (let n = 0; n < t; ++n) this.chart.isDatasetVisible(n) && (s += this._getRingWeight(n));
    return s;
  }
  _getRingWeight(t) {
    return Math.max(Mt(this.chart.data.datasets[t].weight, 1), 0);
  }
  _getVisibleDatasetWeightTotal() {
    return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
  }
}
(ct(To, 'id', 'doughnut'),
  ct(To, 'defaults', {
    datasetElementType: !1,
    dataElementType: 'arc',
    animation: { animateRotate: !0, animateScale: !1 },
    animations: {
      numbers: {
        type: 'number',
        properties: [
          'circumference',
          'endAngle',
          'innerRadius',
          'outerRadius',
          'startAngle',
          'x',
          'y',
          'offset',
          'borderWidth',
          'spacing'
        ]
      }
    },
    cutout: '50%',
    rotation: 0,
    circumference: 360,
    radius: '100%',
    spacing: 0,
    indexAxis: 'r'
  }),
  ct(To, 'descriptors', {
    _scriptable: (t) => t !== 'spacing',
    _indexable: (t) =>
      t !== 'spacing' && !t.startsWith('borderDash') && !t.startsWith('hoverBorderDash')
  }),
  ct(To, 'overrides', {
    aspectRatio: 1,
    plugins: {
      legend: {
        labels: {
          generateLabels(t) {
            const s = t.data,
              {
                labels: {
                  pointStyle: n,
                  textAlign: i,
                  color: o,
                  useBorderRadius: r,
                  borderRadius: a
                }
              } = t.legend.options;
            return s.labels.length && s.datasets.length
              ? s.labels.map((l, c) => {
                  const f = t.getDatasetMeta(0).controller.getStyle(c);
                  return {
                    text: l,
                    fillStyle: f.backgroundColor,
                    fontColor: o,
                    hidden: !t.getDataVisibility(c),
                    lineDash: f.borderDash,
                    lineDashOffset: f.borderDashOffset,
                    lineJoin: f.borderJoinStyle,
                    lineWidth: f.borderWidth,
                    strokeStyle: f.borderColor,
                    textAlign: i,
                    pointStyle: n,
                    borderRadius: r && (a || f.borderRadius),
                    index: c
                  };
                })
              : [];
          }
        },
        onClick(t, s, n) {
          (n.chart.toggleDataVisibility(s.index), n.chart.update());
        }
      }
    }
  }));
class _a extends pi {
  initialize() {
    ((this.enableOptionSharing = !0), (this.supportsDecimation = !0), super.initialize());
  }
  update(t) {
    const s = this._cachedMeta,
      { dataset: n, data: i = [], _dataset: o } = s,
      r = this.chart._animationsDisabled;
    let { start: a, count: l } = rC(s, i, r);
    ((this._drawStart = a),
      (this._drawCount = l),
      aC(s) && ((a = 0), (l = i.length)),
      (n._chart = this.chart),
      (n._datasetIndex = this.index),
      (n._decimated = !!o._decimated),
      (n.points = i));
    const c = this.resolveDatasetElementOptions(t);
    (this.options.showLine || (c.borderWidth = 0),
      (c.segment = this.options.segment),
      this.updateElement(n, void 0, { animated: !r, options: c }, t),
      this.updateElements(i, a, l, t));
  }
  updateElements(t, s, n, i) {
    const o = i === 'reset',
      { iScale: r, vScale: a, _stacked: l, _dataset: c } = this._cachedMeta,
      { sharedOptions: h, includeOptions: f } = this._getSharedOptions(s, i),
      m = r.axis,
      g = a.axis,
      { spanGaps: _, segment: y } = this.options,
      x = ir(_) ? _ : Number.POSITIVE_INFINITY,
      w = this.chart._animationsDisabled || o || i === 'none',
      C = s + n,
      T = t.length;
    let E = s > 0 && this.getParsed(s - 1);
    for (let M = 0; M < T; ++M) {
      const H = t[M],
        $ = w ? H : {};
      if (M < s || M >= C) {
        $.skip = !0;
        continue;
      }
      const X = this.getParsed(M),
        G = Gt(X[g]),
        et = ($[m] = r.getPixelForValue(X[m], M)),
        ot = ($[g] =
          o || G ? a.getBasePixel() : a.getPixelForValue(l ? this.applyStack(a, X, l) : X[g], M));
      (($.skip = isNaN(et) || isNaN(ot) || G),
        ($.stop = M > 0 && Math.abs(X[m] - E[m]) > x),
        y && (($.parsed = X), ($.raw = c.data[M])),
        f && ($.options = h || this.resolveDataElementOptions(M, H.active ? 'active' : i)),
        w || this.updateElement(H, M, $, i),
        (E = X));
    }
  }
  getMaxOverflow() {
    const t = this._cachedMeta,
      s = t.dataset,
      n = (s.options && s.options.borderWidth) || 0,
      i = t.data || [];
    if (!i.length) return n;
    const o = i[0].size(this.resolveDataElementOptions(0)),
      r = i[i.length - 1].size(this.resolveDataElementOptions(i.length - 1));
    return Math.max(n, o, r) / 2;
  }
  draw() {
    const t = this._cachedMeta;
    (t.dataset.updateControlPoints(this.chart.chartArea, t.iScale.axis), super.draw());
  }
}
(ct(_a, 'id', 'line'),
  ct(_a, 'defaults', {
    datasetElementType: 'line',
    dataElementType: 'point',
    showLine: !0,
    spanGaps: !1
  }),
  ct(_a, 'overrides', { scales: { _index_: { type: 'category' }, _value_: { type: 'linear' } } }));
function ti() {
  throw new Error(
    'This method is not implemented: Check that a complete date adapter is provided.'
  );
}
class Kd {
  constructor(t) {
    ct(this, 'options');
    this.options = t || {};
  }
  static override(t) {
    Object.assign(Kd.prototype, t);
  }
  init() {}
  formats() {
    return ti();
  }
  parse() {
    return ti();
  }
  format() {
    return ti();
  }
  add() {
    return ti();
  }
  diff() {
    return ti();
  }
  startOf() {
    return ti();
  }
  endOf() {
    return ti();
  }
}
var MT = { _date: Kd };
function IT(e, t, s, n) {
  const { controller: i, data: o, _sorted: r } = e,
    a = i._cachedMeta.iScale,
    l = e.dataset && e.dataset.options ? e.dataset.options.spanGaps : null;
  if (a && t === a.axis && t !== 'r' && r && o.length) {
    const c = a._reversePixels ? eC : ci;
    if (n) {
      if (i._sharedOptions) {
        const h = o[0],
          f = typeof h.getRange == 'function' && h.getRange(t);
        if (f) {
          const m = c(o, t, s - f),
            g = c(o, t, s + f);
          return { lo: m.lo, hi: g.hi };
        }
      }
    } else {
      const h = c(o, t, s);
      if (l) {
        const { vScale: f } = i._cachedMeta,
          { _parsed: m } = e,
          g = m
            .slice(0, h.lo + 1)
            .reverse()
            .findIndex((y) => !Gt(y[f.axis]));
        h.lo -= Math.max(0, g);
        const _ = m.slice(h.hi).findIndex((y) => !Gt(y[f.axis]));
        h.hi += Math.max(0, _);
      }
      return h;
    }
  }
  return { lo: 0, hi: o.length - 1 };
}
function pl(e, t, s, n, i) {
  const o = e.getSortedVisibleDatasetMetas(),
    r = s[t];
  for (let a = 0, l = o.length; a < l; ++a) {
    const { index: c, data: h } = o[a],
      { lo: f, hi: m } = IT(o[a], t, r, i);
    for (let g = f; g <= m; ++g) {
      const _ = h[g];
      _.skip || n(_, c, g);
    }
  }
}
function LT(e) {
  const t = e.indexOf('x') !== -1,
    s = e.indexOf('y') !== -1;
  return function (n, i) {
    const o = t ? Math.abs(n.x - i.x) : 0,
      r = s ? Math.abs(n.y - i.y) : 0;
    return Math.sqrt(Math.pow(o, 2) + Math.pow(r, 2));
  };
}
function wc(e, t, s, n, i) {
  const o = [];
  return (
    (!i && !e.isPointInArea(t)) ||
      pl(
        e,
        s,
        t,
        function (a, l, c) {
          (!i && !rr(a, e.chartArea, 0)) ||
            (a.inRange(t.x, t.y, n) && o.push({ element: a, datasetIndex: l, index: c }));
        },
        !0
      ),
    o
  );
}
function NT(e, t, s, n) {
  let i = [];
  function o(r, a, l) {
    const { startAngle: c, endAngle: h } = r.getProps(['startAngle', 'endAngle'], n),
      { angle: f } = Qg(r, { x: t.x, y: t.y });
    or(f, c, h) && i.push({ element: r, datasetIndex: a, index: l });
  }
  return (pl(e, s, t, o), i);
}
function $T(e, t, s, n, i, o) {
  let r = [];
  const a = LT(s);
  let l = Number.POSITIVE_INFINITY;
  function c(h, f, m) {
    const g = h.inRange(t.x, t.y, i);
    if (n && !g) return;
    const _ = h.getCenterPoint(i);
    if (!(!!o || e.isPointInArea(_)) && !g) return;
    const x = a(t, _);
    x < l
      ? ((r = [{ element: h, datasetIndex: f, index: m }]), (l = x))
      : x === l && r.push({ element: h, datasetIndex: f, index: m });
  }
  return (pl(e, s, t, c), r);
}
function Sc(e, t, s, n, i, o) {
  return !o && !e.isPointInArea(t) ? [] : s === 'r' && !n ? NT(e, t, s, i) : $T(e, t, s, n, i, o);
}
function pp(e, t, s, n, i) {
  const o = [],
    r = s === 'x' ? 'inXRange' : 'inYRange';
  let a = !1;
  return (
    pl(e, s, t, (l, c, h) => {
      l[r] &&
        l[r](t[s], i) &&
        (o.push({ element: l, datasetIndex: c, index: h }), (a = a || l.inRange(t.x, t.y, i)));
    }),
    n && !a ? [] : o
  );
}
var FT = {
  modes: {
    index(e, t, s, n) {
      const i = ii(t, e),
        o = s.axis || 'x',
        r = s.includeInvisible || !1,
        a = s.intersect ? wc(e, i, o, n, r) : Sc(e, i, o, !1, n, r),
        l = [];
      return a.length
        ? (e.getSortedVisibleDatasetMetas().forEach((c) => {
            const h = a[0].index,
              f = c.data[h];
            f && !f.skip && l.push({ element: f, datasetIndex: c.index, index: h });
          }),
          l)
        : [];
    },
    dataset(e, t, s, n) {
      const i = ii(t, e),
        o = s.axis || 'xy',
        r = s.includeInvisible || !1;
      let a = s.intersect ? wc(e, i, o, n, r) : Sc(e, i, o, !1, n, r);
      if (a.length > 0) {
        const l = a[0].datasetIndex,
          c = e.getDatasetMeta(l).data;
        a = [];
        for (let h = 0; h < c.length; ++h) a.push({ element: c[h], datasetIndex: l, index: h });
      }
      return a;
    },
    point(e, t, s, n) {
      const i = ii(t, e),
        o = s.axis || 'xy',
        r = s.includeInvisible || !1;
      return wc(e, i, o, n, r);
    },
    nearest(e, t, s, n) {
      const i = ii(t, e),
        o = s.axis || 'xy',
        r = s.includeInvisible || !1;
      return Sc(e, i, o, s.intersect, n, r);
    },
    x(e, t, s, n) {
      const i = ii(t, e);
      return pp(e, i, 'x', s.intersect, n);
    },
    y(e, t, s, n) {
      const i = ii(t, e);
      return pp(e, i, 'y', s.intersect, n);
    }
  }
};
const xb = ['left', 'top', 'right', 'bottom'];
function go(e, t) {
  return e.filter((s) => s.pos === t);
}
function mp(e, t) {
  return e.filter((s) => xb.indexOf(s.pos) === -1 && s.box.axis === t);
}
function bo(e, t) {
  return e.sort((s, n) => {
    const i = t ? n : s,
      o = t ? s : n;
    return i.weight === o.weight ? i.index - o.index : i.weight - o.weight;
  });
}
function BT(e) {
  const t = [];
  let s, n, i, o, r, a;
  for (s = 0, n = (e || []).length; s < n; ++s)
    ((i = e[s]),
      ({
        position: o,
        options: { stack: r, stackWeight: a = 1 }
      } = i),
      t.push({
        index: s,
        box: i,
        pos: o,
        horizontal: i.isHorizontal(),
        weight: i.weight,
        stack: r && o + r,
        stackWeight: a
      }));
  return t;
}
function UT(e) {
  const t = {};
  for (const s of e) {
    const { stack: n, pos: i, stackWeight: o } = s;
    if (!n || !xb.includes(i)) continue;
    const r = t[n] || (t[n] = { count: 0, placed: 0, weight: 0, size: 0 });
    (r.count++, (r.weight += o));
  }
  return t;
}
function jT(e, t) {
  const s = UT(e),
    { vBoxMaxWidth: n, hBoxMaxHeight: i } = t;
  let o, r, a;
  for (o = 0, r = e.length; o < r; ++o) {
    a = e[o];
    const { fullSize: l } = a.box,
      c = s[a.stack],
      h = c && a.stackWeight / c.weight;
    a.horizontal
      ? ((a.width = h ? h * n : l && t.availableWidth), (a.height = i))
      : ((a.width = n), (a.height = h ? h * i : l && t.availableHeight));
  }
  return s;
}
function VT(e) {
  const t = BT(e),
    s = bo(
      t.filter((c) => c.box.fullSize),
      !0
    ),
    n = bo(go(t, 'left'), !0),
    i = bo(go(t, 'right')),
    o = bo(go(t, 'top'), !0),
    r = bo(go(t, 'bottom')),
    a = mp(t, 'x'),
    l = mp(t, 'y');
  return {
    fullSize: s,
    leftAndTop: n.concat(o),
    rightAndBottom: i.concat(l).concat(r).concat(a),
    chartArea: go(t, 'chartArea'),
    vertical: n.concat(i).concat(l),
    horizontal: o.concat(r).concat(a)
  };
}
function gp(e, t, s, n) {
  return Math.max(e[s], t[s]) + Math.max(e[n], t[n]);
}
function wb(e, t) {
  ((e.top = Math.max(e.top, t.top)),
    (e.left = Math.max(e.left, t.left)),
    (e.bottom = Math.max(e.bottom, t.bottom)),
    (e.right = Math.max(e.right, t.right)));
}
function HT(e, t, s, n) {
  const { pos: i, box: o } = s,
    r = e.maxPadding;
  if (!$t(i)) {
    s.size && (e[i] -= s.size);
    const f = n[s.stack] || { size: 0, count: 1 };
    ((f.size = Math.max(f.size, s.horizontal ? o.height : o.width)),
      (s.size = f.size / f.count),
      (e[i] += s.size));
  }
  o.getPadding && wb(r, o.getPadding());
  const a = Math.max(0, t.outerWidth - gp(r, e, 'left', 'right')),
    l = Math.max(0, t.outerHeight - gp(r, e, 'top', 'bottom')),
    c = a !== e.w,
    h = l !== e.h;
  return ((e.w = a), (e.h = l), s.horizontal ? { same: c, other: h } : { same: h, other: c });
}
function zT(e) {
  const t = e.maxPadding;
  function s(n) {
    const i = Math.max(t[n] - e[n], 0);
    return ((e[n] += i), i);
  }
  ((e.y += s('top')), (e.x += s('left')), s('right'), s('bottom'));
}
function WT(e, t) {
  const s = t.maxPadding;
  function n(i) {
    const o = { left: 0, top: 0, right: 0, bottom: 0 };
    return (
      i.forEach((r) => {
        o[r] = Math.max(t[r], s[r]);
      }),
      o
    );
  }
  return n(e ? ['left', 'right'] : ['top', 'bottom']);
}
function Ao(e, t, s, n) {
  const i = [];
  let o, r, a, l, c, h;
  for (o = 0, r = e.length, c = 0; o < r; ++o) {
    ((a = e[o]), (l = a.box), l.update(a.width || t.w, a.height || t.h, WT(a.horizontal, t)));
    const { same: f, other: m } = HT(t, s, a, n);
    ((c |= f && i.length), (h = h || m), l.fullSize || i.push(a));
  }
  return (c && Ao(i, t, s, n)) || h;
}
function ea(e, t, s, n, i) {
  ((e.top = s), (e.left = t), (e.right = t + n), (e.bottom = s + i), (e.width = n), (e.height = i));
}
function bp(e, t, s, n) {
  const i = s.padding;
  let { x: o, y: r } = t;
  for (const a of e) {
    const l = a.box,
      c = n[a.stack] || { placed: 0, weight: 1 },
      h = a.stackWeight / c.weight || 1;
    if (a.horizontal) {
      const f = t.w * h,
        m = c.size || l.height;
      (nr(c.start) && (r = c.start),
        l.fullSize
          ? ea(l, i.left, r, s.outerWidth - i.right - i.left, m)
          : ea(l, t.left + c.placed, r, f, m),
        (c.start = r),
        (c.placed += f),
        (r = l.bottom));
    } else {
      const f = t.h * h,
        m = c.size || l.width;
      (nr(c.start) && (o = c.start),
        l.fullSize
          ? ea(l, o, i.top, m, s.outerHeight - i.bottom - i.top)
          : ea(l, o, t.top + c.placed, m, f),
        (c.start = o),
        (c.placed += f),
        (o = l.right));
    }
  }
  ((t.x = o), (t.y = r));
}
var xs = {
  addBox(e, t) {
    (e.boxes || (e.boxes = []),
      (t.fullSize = t.fullSize || !1),
      (t.position = t.position || 'top'),
      (t.weight = t.weight || 0),
      (t._layers =
        t._layers ||
        function () {
          return [
            {
              z: 0,
              draw(s) {
                t.draw(s);
              }
            }
          ];
        }),
      e.boxes.push(t));
  },
  removeBox(e, t) {
    const s = e.boxes ? e.boxes.indexOf(t) : -1;
    s !== -1 && e.boxes.splice(s, 1);
  },
  configure(e, t, s) {
    ((t.fullSize = s.fullSize), (t.position = s.position), (t.weight = s.weight));
  },
  update(e, t, s, n) {
    if (!e) return;
    const i = Cs(e.options.layout.padding),
      o = Math.max(t - i.width, 0),
      r = Math.max(s - i.height, 0),
      a = VT(e.boxes),
      l = a.vertical,
      c = a.horizontal;
    Zt(e.boxes, (y) => {
      typeof y.beforeLayout == 'function' && y.beforeLayout();
    });
    const h =
        l.reduce((y, x) => (x.box.options && x.box.options.display === !1 ? y : y + 1), 0) || 1,
      f = Object.freeze({
        outerWidth: t,
        outerHeight: s,
        padding: i,
        availableWidth: o,
        availableHeight: r,
        vBoxMaxWidth: o / 2 / h,
        hBoxMaxHeight: r / 2
      }),
      m = Object.assign({}, i);
    wb(m, Cs(n));
    const g = Object.assign({ maxPadding: m, w: o, h: r, x: i.left, y: i.top }, i),
      _ = jT(l.concat(c), f);
    (Ao(a.fullSize, g, f, _),
      Ao(l, g, f, _),
      Ao(c, g, f, _) && Ao(l, g, f, _),
      zT(g),
      bp(a.leftAndTop, g, f, _),
      (g.x += g.w),
      (g.y += g.h),
      bp(a.rightAndBottom, g, f, _),
      (e.chartArea = {
        left: g.left,
        top: g.top,
        right: g.left + g.w,
        bottom: g.top + g.h,
        height: g.h,
        width: g.w
      }),
      Zt(a.chartArea, (y) => {
        const x = y.box;
        (Object.assign(x, e.chartArea),
          x.update(g.w, g.h, { left: 0, top: 0, right: 0, bottom: 0 }));
      }));
  }
};
class Sb {
  acquireContext(t, s) {}
  releaseContext(t) {
    return !1;
  }
  addEventListener(t, s, n) {}
  removeEventListener(t, s, n) {}
  getDevicePixelRatio() {
    return 1;
  }
  getMaximumSize(t, s, n, i) {
    return (
      (s = Math.max(0, s || t.width)),
      (n = n || t.height),
      { width: s, height: Math.max(0, i ? Math.floor(s / i) : n) }
    );
  }
  isAttached(t) {
    return !0;
  }
  updateConfig(t) {}
}
class KT extends Sb {
  acquireContext(t) {
    return (t && t.getContext && t.getContext('2d')) || null;
  }
  updateConfig(t) {
    t.options.animation = !1;
  }
}
const ya = '$chartjs',
  qT = {
    touchstart: 'mousedown',
    touchmove: 'mousemove',
    touchend: 'mouseup',
    pointerenter: 'mouseenter',
    pointerdown: 'mousedown',
    pointermove: 'mousemove',
    pointerup: 'mouseup',
    pointerleave: 'mouseout',
    pointerout: 'mouseout'
  },
  _p = (e) => e === null || e === '';
function GT(e, t) {
  const s = e.style,
    n = e.getAttribute('height'),
    i = e.getAttribute('width');
  if (
    ((e[ya] = {
      initial: {
        height: n,
        width: i,
        style: { display: s.display, height: s.height, width: s.width }
      }
    }),
    (s.display = s.display || 'block'),
    (s.boxSizing = s.boxSizing || 'border-box'),
    _p(i))
  ) {
    const o = ep(e, 'width');
    o !== void 0 && (e.width = o);
  }
  if (_p(n))
    if (e.style.height === '') e.height = e.width / (t || 2);
    else {
      const o = ep(e, 'height');
      o !== void 0 && (e.height = o);
    }
  return e;
}
const kb = YC ? { passive: !0 } : !1;
function XT(e, t, s) {
  e && e.addEventListener(t, s, kb);
}
function YT(e, t, s) {
  e && e.canvas && e.canvas.removeEventListener(t, s, kb);
}
function JT(e, t) {
  const s = qT[e.type] || e.type,
    { x: n, y: i } = ii(e, t);
  return { type: s, chart: t, native: e, x: n !== void 0 ? n : null, y: i !== void 0 ? i : null };
}
function Na(e, t) {
  for (const s of e) if (s === t || s.contains(t)) return !0;
}
function ZT(e, t, s) {
  const n = e.canvas,
    i = new MutationObserver((o) => {
      let r = !1;
      for (const a of o) ((r = r || Na(a.addedNodes, n)), (r = r && !Na(a.removedNodes, n)));
      r && s();
    });
  return (i.observe(document, { childList: !0, subtree: !0 }), i);
}
function QT(e, t, s) {
  const n = e.canvas,
    i = new MutationObserver((o) => {
      let r = !1;
      for (const a of o) ((r = r || Na(a.removedNodes, n)), (r = r && !Na(a.addedNodes, n)));
      r && s();
    });
  return (i.observe(document, { childList: !0, subtree: !0 }), i);
}
const lr = new Map();
let yp = 0;
function Cb() {
  const e = window.devicePixelRatio;
  e !== yp &&
    ((yp = e),
    lr.forEach((t, s) => {
      s.currentDevicePixelRatio !== e && t();
    }));
}
function tA(e, t) {
  (lr.size || window.addEventListener('resize', Cb), lr.set(e, t));
}
function eA(e) {
  (lr.delete(e), lr.size || window.removeEventListener('resize', Cb));
}
function sA(e, t, s) {
  const n = e.canvas,
    i = n && Wd(n);
  if (!i) return;
  const o = nb((a, l) => {
      const c = i.clientWidth;
      (s(a, l), c < i.clientWidth && s());
    }, window),
    r = new ResizeObserver((a) => {
      const l = a[0],
        c = l.contentRect.width,
        h = l.contentRect.height;
      (c === 0 && h === 0) || o(c, h);
    });
  return (r.observe(i), tA(e, o), r);
}
function kc(e, t, s) {
  (s && s.disconnect(), t === 'resize' && eA(e));
}
function nA(e, t, s) {
  const n = e.canvas,
    i = nb((o) => {
      e.ctx !== null && s(JT(o, e));
    }, e);
  return (XT(n, t, i), i);
}
class iA extends Sb {
  acquireContext(t, s) {
    const n = t && t.getContext && t.getContext('2d');
    return n && n.canvas === t ? (GT(t, s), n) : null;
  }
  releaseContext(t) {
    const s = t.canvas;
    if (!s[ya]) return !1;
    const n = s[ya].initial;
    ['height', 'width'].forEach((o) => {
      const r = n[o];
      Gt(r) ? s.removeAttribute(o) : s.setAttribute(o, r);
    });
    const i = n.style || {};
    return (
      Object.keys(i).forEach((o) => {
        s.style[o] = i[o];
      }),
      (s.width = s.width),
      delete s[ya],
      !0
    );
  }
  addEventListener(t, s, n) {
    this.removeEventListener(t, s);
    const i = t.$proxies || (t.$proxies = {}),
      r = { attach: ZT, detach: QT, resize: sA }[s] || nA;
    i[s] = r(t, s, n);
  }
  removeEventListener(t, s) {
    const n = t.$proxies || (t.$proxies = {}),
      i = n[s];
    if (!i) return;
    ((({ attach: kc, detach: kc, resize: kc })[s] || YT)(t, s, i), (n[s] = void 0));
  }
  getDevicePixelRatio() {
    return window.devicePixelRatio;
  }
  getMaximumSize(t, s, n, i) {
    return XC(t, s, n, i);
  }
  isAttached(t) {
    const s = t && Wd(t);
    return !!(s && s.isConnected);
  }
}
function oA(e) {
  return !zd() || (typeof OffscreenCanvas < 'u' && e instanceof OffscreenCanvas) ? KT : iA;
}
var la;
let vn =
  ((la = class {
    constructor() {
      ct(this, 'x');
      ct(this, 'y');
      ct(this, 'active', !1);
      ct(this, 'options');
      ct(this, '$animations');
    }
    tooltipPosition(t) {
      const { x: s, y: n } = this.getProps(['x', 'y'], t);
      return { x: s, y: n };
    }
    hasValue() {
      return ir(this.x) && ir(this.y);
    }
    getProps(t, s) {
      const n = this.$animations;
      if (!s || !n) return this;
      const i = {};
      return (
        t.forEach((o) => {
          i[o] = n[o] && n[o].active() ? n[o]._to : this[o];
        }),
        i
      );
    }
  }),
  ct(la, 'defaults', {}),
  ct(la, 'defaultRoutes'),
  la);
function rA(e, t) {
  const s = e.options.ticks,
    n = aA(e),
    i = Math.min(s.maxTicksLimit || n, n),
    o = s.major.enabled ? cA(t) : [],
    r = o.length,
    a = o[0],
    l = o[r - 1],
    c = [];
  if (r > i) return (dA(t, c, o, r / i), c);
  const h = lA(o, t, i);
  if (r > 0) {
    let f, m;
    const g = r > 1 ? Math.round((l - a) / (r - 1)) : null;
    for (sa(t, c, h, Gt(g) ? 0 : a - g, a), f = 0, m = r - 1; f < m; f++)
      sa(t, c, h, o[f], o[f + 1]);
    return (sa(t, c, h, l, Gt(g) ? t.length : l + g), c);
  }
  return (sa(t, c, h), c);
}
function aA(e) {
  const t = e.options.offset,
    s = e._tickSize(),
    n = e._length / s + (t ? 0 : 1),
    i = e._maxLength / s;
  return Math.floor(Math.min(n, i));
}
function lA(e, t, s) {
  const n = uA(e),
    i = t.length / s;
  if (!n) return Math.max(i, 1);
  const o = Gk(n);
  for (let r = 0, a = o.length - 1; r < a; r++) {
    const l = o[r];
    if (l > i) return l;
  }
  return Math.max(i, 1);
}
function cA(e) {
  const t = [];
  let s, n;
  for (s = 0, n = e.length; s < n; s++) e[s].major && t.push(s);
  return t;
}
function dA(e, t, s, n) {
  let i = 0,
    o = s[0],
    r;
  for (n = Math.ceil(n), r = 0; r < e.length; r++) r === o && (t.push(e[r]), i++, (o = s[i * n]));
}
function sa(e, t, s, n, i) {
  const o = Mt(n, 0),
    r = Math.min(Mt(i, e.length), e.length);
  let a = 0,
    l,
    c,
    h;
  for (s = Math.ceil(s), i && ((l = i - n), (s = l / Math.floor(l / s))), h = o; h < 0; )
    (a++, (h = Math.round(o + a * s)));
  for (c = Math.max(o, 0); c < r; c++) c === h && (t.push(e[c]), a++, (h = Math.round(o + a * s)));
}
function uA(e) {
  const t = e.length;
  let s, n;
  if (t < 2) return !1;
  for (n = e[0], s = 1; s < t; ++s) if (e[s] - e[s - 1] !== n) return !1;
  return n;
}
const hA = (e) => (e === 'left' ? 'right' : e === 'right' ? 'left' : e),
  vp = (e, t, s) => (t === 'top' || t === 'left' ? e[t] + s : e[t] - s),
  xp = (e, t) => Math.min(t || e, e);
function wp(e, t) {
  const s = [],
    n = e.length / t,
    i = e.length;
  let o = 0;
  for (; o < i; o += n) s.push(e[Math.floor(o)]);
  return s;
}
function fA(e, t, s) {
  const n = e.ticks.length,
    i = Math.min(t, n - 1),
    o = e._startPixel,
    r = e._endPixel,
    a = 1e-6;
  let l = e.getPixelForTick(i),
    c;
  if (
    !(
      s &&
      (n === 1
        ? (c = Math.max(l - o, r - l))
        : t === 0
          ? (c = (e.getPixelForTick(1) - l) / 2)
          : (c = (l - e.getPixelForTick(i - 1)) / 2),
      (l += i < t ? c : -c),
      l < o - a || l > r + a)
    )
  )
    return l;
}
function pA(e, t) {
  Zt(e, (s) => {
    const n = s.gc,
      i = n.length / 2;
    let o;
    if (i > t) {
      for (o = 0; o < i; ++o) delete s.data[n[o]];
      n.splice(0, i);
    }
  });
}
function _o(e) {
  return e.drawTicks ? e.tickLength : 0;
}
function Sp(e, t) {
  if (!e.display) return 0;
  const s = Fe(e.font, t),
    n = Cs(e.padding);
  return (ve(e.text) ? e.text.length : 1) * s.lineHeight + n.height;
}
function mA(e, t) {
  return _i(e, { scale: t, type: 'scale' });
}
function gA(e, t, s) {
  return _i(e, { tick: s, index: t, type: 'tick' });
}
function bA(e, t, s) {
  let n = $d(e);
  return (((s && t !== 'right') || (!s && t === 'right')) && (n = hA(n)), n);
}
function _A(e, t, s, n) {
  const { top: i, left: o, bottom: r, right: a, chart: l } = e,
    { chartArea: c, scales: h } = l;
  let f = 0,
    m,
    g,
    _;
  const y = r - i,
    x = a - o;
  if (e.isHorizontal()) {
    if (((g = Me(n, o, a)), $t(s))) {
      const w = Object.keys(s)[0],
        C = s[w];
      _ = h[w].getPixelForValue(C) + y - t;
    } else s === 'center' ? (_ = (c.bottom + c.top) / 2 + y - t) : (_ = vp(e, s, t));
    m = a - o;
  } else {
    if ($t(s)) {
      const w = Object.keys(s)[0],
        C = s[w];
      g = h[w].getPixelForValue(C) - x + t;
    } else s === 'center' ? (g = (c.left + c.right) / 2 - x + t) : (g = vp(e, s, t));
    ((_ = Me(n, r, i)), (f = s === 'left' ? -Te : Te));
  }
  return { titleX: g, titleY: _, maxWidth: m, rotation: f };
}
class so extends vn {
  constructor(t) {
    (super(),
      (this.id = t.id),
      (this.type = t.type),
      (this.options = void 0),
      (this.ctx = t.ctx),
      (this.chart = t.chart),
      (this.top = void 0),
      (this.bottom = void 0),
      (this.left = void 0),
      (this.right = void 0),
      (this.width = void 0),
      (this.height = void 0),
      (this._margins = { left: 0, right: 0, top: 0, bottom: 0 }),
      (this.maxWidth = void 0),
      (this.maxHeight = void 0),
      (this.paddingTop = void 0),
      (this.paddingBottom = void 0),
      (this.paddingLeft = void 0),
      (this.paddingRight = void 0),
      (this.axis = void 0),
      (this.labelRotation = void 0),
      (this.min = void 0),
      (this.max = void 0),
      (this._range = void 0),
      (this.ticks = []),
      (this._gridLineItems = null),
      (this._labelItems = null),
      (this._labelSizes = null),
      (this._length = 0),
      (this._maxLength = 0),
      (this._longestTextCache = {}),
      (this._startPixel = void 0),
      (this._endPixel = void 0),
      (this._reversePixels = !1),
      (this._userMax = void 0),
      (this._userMin = void 0),
      (this._suggestedMax = void 0),
      (this._suggestedMin = void 0),
      (this._ticksLength = 0),
      (this._borderValue = 0),
      (this._cache = {}),
      (this._dataLimitsCached = !1),
      (this.$context = void 0));
  }
  init(t) {
    ((this.options = t.setContext(this.getContext())),
      (this.axis = t.axis),
      (this._userMin = this.parse(t.min)),
      (this._userMax = this.parse(t.max)),
      (this._suggestedMin = this.parse(t.suggestedMin)),
      (this._suggestedMax = this.parse(t.suggestedMax)));
  }
  parse(t, s) {
    return t;
  }
  getUserBounds() {
    let { _userMin: t, _userMax: s, _suggestedMin: n, _suggestedMax: i } = this;
    return (
      (t = Bs(t, Number.POSITIVE_INFINITY)),
      (s = Bs(s, Number.NEGATIVE_INFINITY)),
      (n = Bs(n, Number.POSITIVE_INFINITY)),
      (i = Bs(i, Number.NEGATIVE_INFINITY)),
      { min: Bs(t, n), max: Bs(s, i), minDefined: Ue(t), maxDefined: Ue(s) }
    );
  }
  getMinMax(t) {
    let { min: s, max: n, minDefined: i, maxDefined: o } = this.getUserBounds(),
      r;
    if (i && o) return { min: s, max: n };
    const a = this.getMatchingVisibleMetas();
    for (let l = 0, c = a.length; l < c; ++l)
      ((r = a[l].controller.getMinMax(this, t)),
        i || (s = Math.min(s, r.min)),
        o || (n = Math.max(n, r.max)));
    return (
      (s = o && s > n ? n : s),
      (n = i && s > n ? s : n),
      { min: Bs(s, Bs(n, s)), max: Bs(n, Bs(s, n)) }
    );
  }
  getPadding() {
    return {
      left: this.paddingLeft || 0,
      top: this.paddingTop || 0,
      right: this.paddingRight || 0,
      bottom: this.paddingBottom || 0
    };
  }
  getTicks() {
    return this.ticks;
  }
  getLabels() {
    const t = this.chart.data;
    return this.options.labels || (this.isHorizontal() ? t.xLabels : t.yLabels) || t.labels || [];
  }
  getLabelItems(t = this.chart.chartArea) {
    return this._labelItems || (this._labelItems = this._computeLabelItems(t));
  }
  beforeLayout() {
    ((this._cache = {}), (this._dataLimitsCached = !1));
  }
  beforeUpdate() {
    ce(this.options.beforeUpdate, [this]);
  }
  update(t, s, n) {
    const { beginAtZero: i, grace: o, ticks: r } = this.options,
      a = r.sampleSize;
    (this.beforeUpdate(),
      (this.maxWidth = t),
      (this.maxHeight = s),
      (this._margins = n = Object.assign({ left: 0, right: 0, top: 0, bottom: 0 }, n)),
      (this.ticks = null),
      (this._labelSizes = null),
      (this._gridLineItems = null),
      (this._labelItems = null),
      this.beforeSetDimensions(),
      this.setDimensions(),
      this.afterSetDimensions(),
      (this._maxLength = this.isHorizontal()
        ? this.width + n.left + n.right
        : this.height + n.top + n.bottom),
      this._dataLimitsCached ||
        (this.beforeDataLimits(),
        this.determineDataLimits(),
        this.afterDataLimits(),
        (this._range = AC(this, o, i)),
        (this._dataLimitsCached = !0)),
      this.beforeBuildTicks(),
      (this.ticks = this.buildTicks() || []),
      this.afterBuildTicks());
    const l = a < this.ticks.length;
    (this._convertTicksToLabels(l ? wp(this.ticks, a) : this.ticks),
      this.configure(),
      this.beforeCalculateLabelRotation(),
      this.calculateLabelRotation(),
      this.afterCalculateLabelRotation(),
      r.display &&
        (r.autoSkip || r.source === 'auto') &&
        ((this.ticks = rA(this, this.ticks)), (this._labelSizes = null), this.afterAutoSkip()),
      l && this._convertTicksToLabels(this.ticks),
      this.beforeFit(),
      this.fit(),
      this.afterFit(),
      this.afterUpdate());
  }
  configure() {
    let t = this.options.reverse,
      s,
      n;
    (this.isHorizontal()
      ? ((s = this.left), (n = this.right))
      : ((s = this.top), (n = this.bottom), (t = !t)),
      (this._startPixel = s),
      (this._endPixel = n),
      (this._reversePixels = t),
      (this._length = n - s),
      (this._alignToPixels = this.options.alignToPixels));
  }
  afterUpdate() {
    ce(this.options.afterUpdate, [this]);
  }
  beforeSetDimensions() {
    ce(this.options.beforeSetDimensions, [this]);
  }
  setDimensions() {
    (this.isHorizontal()
      ? ((this.width = this.maxWidth), (this.left = 0), (this.right = this.width))
      : ((this.height = this.maxHeight), (this.top = 0), (this.bottom = this.height)),
      (this.paddingLeft = 0),
      (this.paddingTop = 0),
      (this.paddingRight = 0),
      (this.paddingBottom = 0));
  }
  afterSetDimensions() {
    ce(this.options.afterSetDimensions, [this]);
  }
  _callHooks(t) {
    (this.chart.notifyPlugins(t, this.getContext()), ce(this.options[t], [this]));
  }
  beforeDataLimits() {
    this._callHooks('beforeDataLimits');
  }
  determineDataLimits() {}
  afterDataLimits() {
    this._callHooks('afterDataLimits');
  }
  beforeBuildTicks() {
    this._callHooks('beforeBuildTicks');
  }
  buildTicks() {
    return [];
  }
  afterBuildTicks() {
    this._callHooks('afterBuildTicks');
  }
  beforeTickToLabelConversion() {
    ce(this.options.beforeTickToLabelConversion, [this]);
  }
  generateTickLabels(t) {
    const s = this.options.ticks;
    let n, i, o;
    for (n = 0, i = t.length; n < i; n++)
      ((o = t[n]), (o.label = ce(s.callback, [o.value, n, t], this)));
  }
  afterTickToLabelConversion() {
    ce(this.options.afterTickToLabelConversion, [this]);
  }
  beforeCalculateLabelRotation() {
    ce(this.options.beforeCalculateLabelRotation, [this]);
  }
  calculateLabelRotation() {
    const t = this.options,
      s = t.ticks,
      n = xp(this.ticks.length, t.ticks.maxTicksLimit),
      i = s.minRotation || 0,
      o = s.maxRotation;
    let r = i,
      a,
      l,
      c;
    if (!this._isVisible() || !s.display || i >= o || n <= 1 || !this.isHorizontal()) {
      this.labelRotation = i;
      return;
    }
    const h = this._getLabelSizes(),
      f = h.widest.width,
      m = h.highest.height,
      g = $e(this.chart.width - f, 0, this.maxWidth);
    ((a = t.offset ? this.maxWidth / n : g / (n - 1)),
      f + 6 > a &&
        ((a = g / (n - (t.offset ? 0.5 : 1))),
        (l = this.maxHeight - _o(t.grid) - s.padding - Sp(t.title, this.chart.options.font)),
        (c = Math.sqrt(f * f + m * m)),
        (r = Zk(
          Math.min(
            Math.asin($e((h.highest.height + 6) / a, -1, 1)),
            Math.asin($e(l / c, -1, 1)) - Math.asin($e(m / c, -1, 1))
          )
        )),
        (r = Math.max(i, Math.min(o, r)))),
      (this.labelRotation = r));
  }
  afterCalculateLabelRotation() {
    ce(this.options.afterCalculateLabelRotation, [this]);
  }
  afterAutoSkip() {}
  beforeFit() {
    ce(this.options.beforeFit, [this]);
  }
  fit() {
    const t = { width: 0, height: 0 },
      {
        chart: s,
        options: { ticks: n, title: i, grid: o }
      } = this,
      r = this._isVisible(),
      a = this.isHorizontal();
    if (r) {
      const l = Sp(i, s.options.font);
      if (
        (a
          ? ((t.width = this.maxWidth), (t.height = _o(o) + l))
          : ((t.height = this.maxHeight), (t.width = _o(o) + l)),
        n.display && this.ticks.length)
      ) {
        const { first: c, last: h, widest: f, highest: m } = this._getLabelSizes(),
          g = n.padding * 2,
          _ = un(this.labelRotation),
          y = Math.cos(_),
          x = Math.sin(_);
        if (a) {
          const w = n.mirror ? 0 : x * f.width + y * m.height;
          t.height = Math.min(this.maxHeight, t.height + w + g);
        } else {
          const w = n.mirror ? 0 : y * f.width + x * m.height;
          t.width = Math.min(this.maxWidth, t.width + w + g);
        }
        this._calculatePadding(c, h, x, y);
      }
    }
    (this._handleMargins(),
      a
        ? ((this.width = this._length = s.width - this._margins.left - this._margins.right),
          (this.height = t.height))
        : ((this.width = t.width),
          (this.height = this._length = s.height - this._margins.top - this._margins.bottom)));
  }
  _calculatePadding(t, s, n, i) {
    const {
        ticks: { align: o, padding: r },
        position: a
      } = this.options,
      l = this.labelRotation !== 0,
      c = a !== 'top' && this.axis === 'x';
    if (this.isHorizontal()) {
      const h = this.getPixelForTick(0) - this.left,
        f = this.right - this.getPixelForTick(this.ticks.length - 1);
      let m = 0,
        g = 0;
      (l
        ? c
          ? ((m = i * t.width), (g = n * s.height))
          : ((m = n * t.height), (g = i * s.width))
        : o === 'start'
          ? (g = s.width)
          : o === 'end'
            ? (m = t.width)
            : o !== 'inner' && ((m = t.width / 2), (g = s.width / 2)),
        (this.paddingLeft = Math.max(((m - h + r) * this.width) / (this.width - h), 0)),
        (this.paddingRight = Math.max(((g - f + r) * this.width) / (this.width - f), 0)));
    } else {
      let h = s.height / 2,
        f = t.height / 2;
      (o === 'start' ? ((h = 0), (f = t.height)) : o === 'end' && ((h = s.height), (f = 0)),
        (this.paddingTop = h + r),
        (this.paddingBottom = f + r));
    }
  }
  _handleMargins() {
    this._margins &&
      ((this._margins.left = Math.max(this.paddingLeft, this._margins.left)),
      (this._margins.top = Math.max(this.paddingTop, this._margins.top)),
      (this._margins.right = Math.max(this.paddingRight, this._margins.right)),
      (this._margins.bottom = Math.max(this.paddingBottom, this._margins.bottom)));
  }
  afterFit() {
    ce(this.options.afterFit, [this]);
  }
  isHorizontal() {
    const { axis: t, position: s } = this.options;
    return s === 'top' || s === 'bottom' || t === 'x';
  }
  isFullSize() {
    return this.options.fullSize;
  }
  _convertTicksToLabels(t) {
    (this.beforeTickToLabelConversion(), this.generateTickLabels(t));
    let s, n;
    for (s = 0, n = t.length; s < n; s++) Gt(t[s].label) && (t.splice(s, 1), n--, s--);
    this.afterTickToLabelConversion();
  }
  _getLabelSizes() {
    let t = this._labelSizes;
    if (!t) {
      const s = this.options.ticks.sampleSize;
      let n = this.ticks;
      (s < n.length && (n = wp(n, s)),
        (this._labelSizes = t =
          this._computeLabelSizes(n, n.length, this.options.ticks.maxTicksLimit)));
    }
    return t;
  }
  _computeLabelSizes(t, s, n) {
    const { ctx: i, _longestTextCache: o } = this,
      r = [],
      a = [],
      l = Math.floor(s / xp(s, n));
    let c = 0,
      h = 0,
      f,
      m,
      g,
      _,
      y,
      x,
      w,
      C,
      T,
      E,
      M;
    for (f = 0; f < s; f += l) {
      if (
        ((_ = t[f].label),
        (y = this._resolveTickFontOptions(f)),
        (i.font = x = y.string),
        (w = o[x] = o[x] || { data: {}, gc: [] }),
        (C = y.lineHeight),
        (T = E = 0),
        !Gt(_) && !ve(_))
      )
        ((T = Yf(i, w.data, w.gc, T, _)), (E = C));
      else if (ve(_))
        for (m = 0, g = _.length; m < g; ++m)
          ((M = _[m]), !Gt(M) && !ve(M) && ((T = Yf(i, w.data, w.gc, T, M)), (E += C)));
      (r.push(T), a.push(E), (c = Math.max(T, c)), (h = Math.max(E, h)));
    }
    pA(o, s);
    const H = r.indexOf(c),
      $ = a.indexOf(h),
      X = (G) => ({ width: r[G] || 0, height: a[G] || 0 });
    return { first: X(0), last: X(s - 1), widest: X(H), highest: X($), widths: r, heights: a };
  }
  getLabelForValue(t) {
    return t;
  }
  getPixelForValue(t, s) {
    return NaN;
  }
  getValueForPixel(t) {}
  getPixelForTick(t) {
    const s = this.ticks;
    return t < 0 || t > s.length - 1 ? null : this.getPixelForValue(s[t].value);
  }
  getPixelForDecimal(t) {
    this._reversePixels && (t = 1 - t);
    const s = this._startPixel + t * this._length;
    return tC(this._alignToPixels ? Qn(this.chart, s, 0) : s);
  }
  getDecimalForPixel(t) {
    const s = (t - this._startPixel) / this._length;
    return this._reversePixels ? 1 - s : s;
  }
  getBasePixel() {
    return this.getPixelForValue(this.getBaseValue());
  }
  getBaseValue() {
    const { min: t, max: s } = this;
    return t < 0 && s < 0 ? s : t > 0 && s > 0 ? t : 0;
  }
  getContext(t) {
    const s = this.ticks || [];
    if (t >= 0 && t < s.length) {
      const n = s[t];
      return n.$context || (n.$context = gA(this.getContext(), t, n));
    }
    return this.$context || (this.$context = mA(this.chart.getContext(), this));
  }
  _tickSize() {
    const t = this.options.ticks,
      s = un(this.labelRotation),
      n = Math.abs(Math.cos(s)),
      i = Math.abs(Math.sin(s)),
      o = this._getLabelSizes(),
      r = t.autoSkipPadding || 0,
      a = o ? o.widest.width + r : 0,
      l = o ? o.highest.height + r : 0;
    return this.isHorizontal() ? (l * n > a * i ? a / n : l / i) : l * i < a * n ? l / n : a / i;
  }
  _isVisible() {
    const t = this.options.display;
    return t !== 'auto' ? !!t : this.getMatchingVisibleMetas().length > 0;
  }
  _computeGridLineItems(t) {
    const s = this.axis,
      n = this.chart,
      i = this.options,
      { grid: o, position: r, border: a } = i,
      l = o.offset,
      c = this.isHorizontal(),
      f = this.ticks.length + (l ? 1 : 0),
      m = _o(o),
      g = [],
      _ = a.setContext(this.getContext()),
      y = _.display ? _.width : 0,
      x = y / 2,
      w = function (lt) {
        return Qn(n, lt, y);
      };
    let C, T, E, M, H, $, X, G, et, ot, Z, q;
    if (r === 'top')
      ((C = w(this.bottom)),
        ($ = this.bottom - m),
        (G = C - x),
        (ot = w(t.top) + x),
        (q = t.bottom));
    else if (r === 'bottom')
      ((C = w(this.top)), (ot = t.top), (q = w(t.bottom) - x), ($ = C + x), (G = this.top + m));
    else if (r === 'left')
      ((C = w(this.right)), (H = this.right - m), (X = C - x), (et = w(t.left) + x), (Z = t.right));
    else if (r === 'right')
      ((C = w(this.left)), (et = t.left), (Z = w(t.right) - x), (H = C + x), (X = this.left + m));
    else if (s === 'x') {
      if (r === 'center') C = w((t.top + t.bottom) / 2 + 0.5);
      else if ($t(r)) {
        const lt = Object.keys(r)[0],
          ht = r[lt];
        C = w(this.chart.scales[lt].getPixelForValue(ht));
      }
      ((ot = t.top), (q = t.bottom), ($ = C + x), (G = $ + m));
    } else if (s === 'y') {
      if (r === 'center') C = w((t.left + t.right) / 2);
      else if ($t(r)) {
        const lt = Object.keys(r)[0],
          ht = r[lt];
        C = w(this.chart.scales[lt].getPixelForValue(ht));
      }
      ((H = C - x), (X = H - m), (et = t.left), (Z = t.right));
    }
    const dt = Mt(i.ticks.maxTicksLimit, f),
      At = Math.max(1, Math.ceil(f / dt));
    for (T = 0; T < f; T += At) {
      const lt = this.getContext(T),
        ht = o.setContext(lt),
        ft = a.setContext(lt),
        Vt = ht.lineWidth,
        _e = ht.color,
        F = ft.dash || [],
        Ut = ft.dashOffset,
        Se = ht.tickWidth,
        ue = ht.tickColor,
        oe = ht.tickBorderDash || [],
        re = ht.tickBorderDashOffset;
      ((E = fA(this, T, l)),
        E !== void 0 &&
          ((M = Qn(n, E, Vt)),
          c ? (H = X = et = Z = M) : ($ = G = ot = q = M),
          g.push({
            tx1: H,
            ty1: $,
            tx2: X,
            ty2: G,
            x1: et,
            y1: ot,
            x2: Z,
            y2: q,
            width: Vt,
            color: _e,
            borderDash: F,
            borderDashOffset: Ut,
            tickWidth: Se,
            tickColor: ue,
            tickBorderDash: oe,
            tickBorderDashOffset: re
          })));
    }
    return ((this._ticksLength = f), (this._borderValue = C), g);
  }
  _computeLabelItems(t) {
    const s = this.axis,
      n = this.options,
      { position: i, ticks: o } = n,
      r = this.isHorizontal(),
      a = this.ticks,
      { align: l, crossAlign: c, padding: h, mirror: f } = o,
      m = _o(n.grid),
      g = m + h,
      _ = f ? -h : g,
      y = -un(this.labelRotation),
      x = [];
    let w,
      C,
      T,
      E,
      M,
      H,
      $,
      X,
      G,
      et,
      ot,
      Z,
      q = 'middle';
    if (i === 'top') ((H = this.bottom - _), ($ = this._getXAxisLabelAlignment()));
    else if (i === 'bottom') ((H = this.top + _), ($ = this._getXAxisLabelAlignment()));
    else if (i === 'left') {
      const At = this._getYAxisLabelAlignment(m);
      (($ = At.textAlign), (M = At.x));
    } else if (i === 'right') {
      const At = this._getYAxisLabelAlignment(m);
      (($ = At.textAlign), (M = At.x));
    } else if (s === 'x') {
      if (i === 'center') H = (t.top + t.bottom) / 2 + g;
      else if ($t(i)) {
        const At = Object.keys(i)[0],
          lt = i[At];
        H = this.chart.scales[At].getPixelForValue(lt) + g;
      }
      $ = this._getXAxisLabelAlignment();
    } else if (s === 'y') {
      if (i === 'center') M = (t.left + t.right) / 2 - g;
      else if ($t(i)) {
        const At = Object.keys(i)[0],
          lt = i[At];
        M = this.chart.scales[At].getPixelForValue(lt);
      }
      $ = this._getYAxisLabelAlignment(m).textAlign;
    }
    s === 'y' && (l === 'start' ? (q = 'top') : l === 'end' && (q = 'bottom'));
    const dt = this._getLabelSizes();
    for (w = 0, C = a.length; w < C; ++w) {
      ((T = a[w]), (E = T.label));
      const At = o.setContext(this.getContext(w));
      ((X = this.getPixelForTick(w) + o.labelOffset),
        (G = this._resolveTickFontOptions(w)),
        (et = G.lineHeight),
        (ot = ve(E) ? E.length : 1));
      const lt = ot / 2,
        ht = At.color,
        ft = At.textStrokeColor,
        Vt = At.textStrokeWidth;
      let _e = $;
      r
        ? ((M = X),
          $ === 'inner' &&
            (w === C - 1
              ? (_e = this.options.reverse ? 'left' : 'right')
              : w === 0
                ? (_e = this.options.reverse ? 'right' : 'left')
                : (_e = 'center')),
          i === 'top'
            ? c === 'near' || y !== 0
              ? (Z = -ot * et + et / 2)
              : c === 'center'
                ? (Z = -dt.highest.height / 2 - lt * et + et)
                : (Z = -dt.highest.height + et / 2)
            : c === 'near' || y !== 0
              ? (Z = et / 2)
              : c === 'center'
                ? (Z = dt.highest.height / 2 - lt * et)
                : (Z = dt.highest.height - ot * et),
          f && (Z *= -1),
          y !== 0 && !At.showLabelBackdrop && (M += (et / 2) * Math.sin(y)))
        : ((H = X), (Z = ((1 - ot) * et) / 2));
      let F;
      if (At.showLabelBackdrop) {
        const Ut = Cs(At.backdropPadding),
          Se = dt.heights[w],
          ue = dt.widths[w];
        let oe = Z - Ut.top,
          re = 0 - Ut.left;
        switch (q) {
          case 'middle':
            oe -= Se / 2;
            break;
          case 'bottom':
            oe -= Se;
            break;
        }
        switch ($) {
          case 'center':
            re -= ue / 2;
            break;
          case 'right':
            re -= ue;
            break;
          case 'inner':
            w === C - 1 ? (re -= ue) : w > 0 && (re -= ue / 2);
            break;
        }
        F = {
          left: re,
          top: oe,
          width: ue + Ut.width,
          height: Se + Ut.height,
          color: At.backdropColor
        };
      }
      x.push({
        label: E,
        font: G,
        textOffset: Z,
        options: {
          rotation: y,
          color: ht,
          strokeColor: ft,
          strokeWidth: Vt,
          textAlign: _e,
          textBaseline: q,
          translation: [M, H],
          backdrop: F
        }
      });
    }
    return x;
  }
  _getXAxisLabelAlignment() {
    const { position: t, ticks: s } = this.options;
    if (-un(this.labelRotation)) return t === 'top' ? 'left' : 'right';
    let i = 'center';
    return (
      s.align === 'start'
        ? (i = 'left')
        : s.align === 'end'
          ? (i = 'right')
          : s.align === 'inner' && (i = 'inner'),
      i
    );
  }
  _getYAxisLabelAlignment(t) {
    const {
        position: s,
        ticks: { crossAlign: n, mirror: i, padding: o }
      } = this.options,
      r = this._getLabelSizes(),
      a = t + o,
      l = r.widest.width;
    let c, h;
    return (
      s === 'left'
        ? i
          ? ((h = this.right + o),
            n === 'near'
              ? (c = 'left')
              : n === 'center'
                ? ((c = 'center'), (h += l / 2))
                : ((c = 'right'), (h += l)))
          : ((h = this.right - a),
            n === 'near'
              ? (c = 'right')
              : n === 'center'
                ? ((c = 'center'), (h -= l / 2))
                : ((c = 'left'), (h = this.left)))
        : s === 'right'
          ? i
            ? ((h = this.left + o),
              n === 'near'
                ? (c = 'right')
                : n === 'center'
                  ? ((c = 'center'), (h -= l / 2))
                  : ((c = 'left'), (h -= l)))
            : ((h = this.left + a),
              n === 'near'
                ? (c = 'left')
                : n === 'center'
                  ? ((c = 'center'), (h += l / 2))
                  : ((c = 'right'), (h = this.right)))
          : (c = 'right'),
      { textAlign: c, x: h }
    );
  }
  _computeLabelArea() {
    if (this.options.ticks.mirror) return;
    const t = this.chart,
      s = this.options.position;
    if (s === 'left' || s === 'right')
      return { top: 0, left: this.left, bottom: t.height, right: this.right };
    if (s === 'top' || s === 'bottom')
      return { top: this.top, left: 0, bottom: this.bottom, right: t.width };
  }
  drawBackground() {
    const {
      ctx: t,
      options: { backgroundColor: s },
      left: n,
      top: i,
      width: o,
      height: r
    } = this;
    s && (t.save(), (t.fillStyle = s), t.fillRect(n, i, o, r), t.restore());
  }
  getLineWidthForValue(t) {
    const s = this.options.grid;
    if (!this._isVisible() || !s.display) return 0;
    const i = this.ticks.findIndex((o) => o.value === t);
    return i >= 0 ? s.setContext(this.getContext(i)).lineWidth : 0;
  }
  drawGrid(t) {
    const s = this.options.grid,
      n = this.ctx,
      i = this._gridLineItems || (this._gridLineItems = this._computeGridLineItems(t));
    let o, r;
    const a = (l, c, h) => {
      !h.width ||
        !h.color ||
        (n.save(),
        (n.lineWidth = h.width),
        (n.strokeStyle = h.color),
        n.setLineDash(h.borderDash || []),
        (n.lineDashOffset = h.borderDashOffset),
        n.beginPath(),
        n.moveTo(l.x, l.y),
        n.lineTo(c.x, c.y),
        n.stroke(),
        n.restore());
    };
    if (s.display)
      for (o = 0, r = i.length; o < r; ++o) {
        const l = i[o];
        (s.drawOnChartArea && a({ x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }, l),
          s.drawTicks &&
            a(
              { x: l.tx1, y: l.ty1 },
              { x: l.tx2, y: l.ty2 },
              {
                color: l.tickColor,
                width: l.tickWidth,
                borderDash: l.tickBorderDash,
                borderDashOffset: l.tickBorderDashOffset
              }
            ));
      }
  }
  drawBorder() {
    const {
        chart: t,
        ctx: s,
        options: { border: n, grid: i }
      } = this,
      o = n.setContext(this.getContext()),
      r = n.display ? o.width : 0;
    if (!r) return;
    const a = i.setContext(this.getContext(0)).lineWidth,
      l = this._borderValue;
    let c, h, f, m;
    (this.isHorizontal()
      ? ((c = Qn(t, this.left, r) - r / 2), (h = Qn(t, this.right, a) + a / 2), (f = m = l))
      : ((f = Qn(t, this.top, r) - r / 2), (m = Qn(t, this.bottom, a) + a / 2), (c = h = l)),
      s.save(),
      (s.lineWidth = o.width),
      (s.strokeStyle = o.color),
      s.beginPath(),
      s.moveTo(c, f),
      s.lineTo(h, m),
      s.stroke(),
      s.restore());
  }
  drawLabels(t) {
    if (!this.options.ticks.display) return;
    const n = this.ctx,
      i = this._computeLabelArea();
    i && ul(n, i);
    const o = this.getLabelItems(t);
    for (const r of o) {
      const a = r.options,
        l = r.font,
        c = r.label,
        h = r.textOffset;
      ar(n, c, 0, h, l, a);
    }
    i && hl(n);
  }
  drawTitle() {
    const {
      ctx: t,
      options: { position: s, title: n, reverse: i }
    } = this;
    if (!n.display) return;
    const o = Fe(n.font),
      r = Cs(n.padding),
      a = n.align;
    let l = o.lineHeight / 2;
    s === 'bottom' || s === 'center' || $t(s)
      ? ((l += r.bottom), ve(n.text) && (l += o.lineHeight * (n.text.length - 1)))
      : (l += r.top);
    const { titleX: c, titleY: h, maxWidth: f, rotation: m } = _A(this, l, s, a);
    ar(t, n.text, 0, 0, o, {
      color: n.color,
      maxWidth: f,
      rotation: m,
      textAlign: bA(a, s, i),
      textBaseline: 'middle',
      translation: [c, h]
    });
  }
  draw(t) {
    this._isVisible() &&
      (this.drawBackground(),
      this.drawGrid(t),
      this.drawBorder(),
      this.drawTitle(),
      this.drawLabels(t));
  }
  _layers() {
    const t = this.options,
      s = (t.ticks && t.ticks.z) || 0,
      n = Mt(t.grid && t.grid.z, -1),
      i = Mt(t.border && t.border.z, 0);
    return !this._isVisible() || this.draw !== so.prototype.draw
      ? [
          {
            z: s,
            draw: (o) => {
              this.draw(o);
            }
          }
        ]
      : [
          {
            z: n,
            draw: (o) => {
              (this.drawBackground(), this.drawGrid(o), this.drawTitle());
            }
          },
          {
            z: i,
            draw: () => {
              this.drawBorder();
            }
          },
          {
            z: s,
            draw: (o) => {
              this.drawLabels(o);
            }
          }
        ];
  }
  getMatchingVisibleMetas(t) {
    const s = this.chart.getSortedVisibleDatasetMetas(),
      n = this.axis + 'AxisID',
      i = [];
    let o, r;
    for (o = 0, r = s.length; o < r; ++o) {
      const a = s[o];
      a[n] === this.id && (!t || a.type === t) && i.push(a);
    }
    return i;
  }
  _resolveTickFontOptions(t) {
    const s = this.options.ticks.setContext(this.getContext(t));
    return Fe(s.font);
  }
  _maxDigits() {
    const t = this._resolveTickFontOptions(0).lineHeight;
    return (this.isHorizontal() ? this.width : this.height) / t;
  }
}
class na {
  constructor(t, s, n) {
    ((this.type = t), (this.scope = s), (this.override = n), (this.items = Object.create(null)));
  }
  isForType(t) {
    return Object.prototype.isPrototypeOf.call(this.type.prototype, t.prototype);
  }
  register(t) {
    const s = Object.getPrototypeOf(t);
    let n;
    xA(s) && (n = this.register(s));
    const i = this.items,
      o = t.id,
      r = this.scope + '.' + o;
    if (!o) throw new Error('class does not have id: ' + t);
    return (
      o in i || ((i[o] = t), yA(t, r, n), this.override && ge.override(t.id, t.overrides)),
      r
    );
  }
  get(t) {
    return this.items[t];
  }
  unregister(t) {
    const s = this.items,
      n = t.id,
      i = this.scope;
    (n in s && delete s[n], i && n in ge[i] && (delete ge[i][n], this.override && delete bi[n]));
  }
}
function yA(e, t, s) {
  const n = sr(Object.create(null), [s ? ge.get(s) : {}, ge.get(t), e.defaults]);
  (ge.set(t, n),
    e.defaultRoutes && vA(t, e.defaultRoutes),
    e.descriptors && ge.describe(t, e.descriptors));
}
function vA(e, t) {
  Object.keys(t).forEach((s) => {
    const n = s.split('.'),
      i = n.pop(),
      o = [e].concat(n).join('.'),
      r = t[s].split('.'),
      a = r.pop(),
      l = r.join('.');
    ge.route(o, i, l, a);
  });
}
function xA(e) {
  return 'id' in e && 'defaults' in e;
}
class wA {
  constructor() {
    ((this.controllers = new na(pi, 'datasets', !0)),
      (this.elements = new na(vn, 'elements')),
      (this.plugins = new na(Object, 'plugins')),
      (this.scales = new na(so, 'scales')),
      (this._typedRegistries = [this.controllers, this.scales, this.elements]));
  }
  add(...t) {
    this._each('register', t);
  }
  remove(...t) {
    this._each('unregister', t);
  }
  addControllers(...t) {
    this._each('register', t, this.controllers);
  }
  addElements(...t) {
    this._each('register', t, this.elements);
  }
  addPlugins(...t) {
    this._each('register', t, this.plugins);
  }
  addScales(...t) {
    this._each('register', t, this.scales);
  }
  getController(t) {
    return this._get(t, this.controllers, 'controller');
  }
  getElement(t) {
    return this._get(t, this.elements, 'element');
  }
  getPlugin(t) {
    return this._get(t, this.plugins, 'plugin');
  }
  getScale(t) {
    return this._get(t, this.scales, 'scale');
  }
  removeControllers(...t) {
    this._each('unregister', t, this.controllers);
  }
  removeElements(...t) {
    this._each('unregister', t, this.elements);
  }
  removePlugins(...t) {
    this._each('unregister', t, this.plugins);
  }
  removeScales(...t) {
    this._each('unregister', t, this.scales);
  }
  _each(t, s, n) {
    [...s].forEach((i) => {
      const o = n || this._getRegistryForType(i);
      n || o.isForType(i) || (o === this.plugins && i.id)
        ? this._exec(t, o, i)
        : Zt(i, (r) => {
            const a = n || this._getRegistryForType(r);
            this._exec(t, a, r);
          });
    });
  }
  _exec(t, s, n) {
    const i = Ld(t);
    (ce(n['before' + i], [], n), s[t](n), ce(n['after' + i], [], n));
  }
  _getRegistryForType(t) {
    for (let s = 0; s < this._typedRegistries.length; s++) {
      const n = this._typedRegistries[s];
      if (n.isForType(t)) return n;
    }
    return this.plugins;
  }
  _get(t, s, n) {
    const i = s.get(t);
    if (i === void 0) throw new Error('"' + t + '" is not a registered ' + n + '.');
    return i;
  }
}
var Hs = new wA();
class SA {
  constructor() {
    this._init = void 0;
  }
  notify(t, s, n, i) {
    if (
      (s === 'beforeInit' &&
        ((this._init = this._createDescriptors(t, !0)), this._notify(this._init, t, 'install')),
      this._init === void 0)
    )
      return;
    const o = i ? this._descriptors(t).filter(i) : this._descriptors(t),
      r = this._notify(o, t, s, n);
    return (
      s === 'afterDestroy' &&
        (this._notify(o, t, 'stop'),
        this._notify(this._init, t, 'uninstall'),
        (this._init = void 0)),
      r
    );
  }
  _notify(t, s, n, i) {
    i = i || {};
    for (const o of t) {
      const r = o.plugin,
        a = r[n],
        l = [s, i, o.options];
      if (ce(a, l, r) === !1 && i.cancelable) return !1;
    }
    return !0;
  }
  invalidate() {
    Gt(this._cache) || ((this._oldCache = this._cache), (this._cache = void 0));
  }
  _descriptors(t) {
    if (this._cache) return this._cache;
    const s = (this._cache = this._createDescriptors(t));
    return (this._notifyStateChanges(t), s);
  }
  _createDescriptors(t, s) {
    const n = t && t.config,
      i = Mt(n.options && n.options.plugins, {}),
      o = kA(n);
    return i === !1 && !s ? [] : TA(t, o, i, s);
  }
  _notifyStateChanges(t) {
    const s = this._oldCache || [],
      n = this._cache,
      i = (o, r) => o.filter((a) => !r.some((l) => a.plugin.id === l.plugin.id));
    (this._notify(i(s, n), t, 'stop'), this._notify(i(n, s), t, 'start'));
  }
}
function kA(e) {
  const t = {},
    s = [],
    n = Object.keys(Hs.plugins.items);
  for (let o = 0; o < n.length; o++) s.push(Hs.getPlugin(n[o]));
  const i = e.plugins || [];
  for (let o = 0; o < i.length; o++) {
    const r = i[o];
    s.indexOf(r) === -1 && (s.push(r), (t[r.id] = !0));
  }
  return { plugins: s, localIds: t };
}
function CA(e, t) {
  return !t && e === !1 ? null : e === !0 ? {} : e;
}
function TA(e, { plugins: t, localIds: s }, n, i) {
  const o = [],
    r = e.getContext();
  for (const a of t) {
    const l = a.id,
      c = CA(n[l], i);
    c !== null && o.push({ plugin: a, options: AA(e.config, { plugin: a, local: s[l] }, c, r) });
  }
  return o;
}
function AA(e, { plugin: t, local: s }, n, i) {
  const o = e.pluginScopeKeys(t),
    r = e.getOptionScopes(n, o);
  return (
    s && t.defaults && r.push(t.defaults),
    e.createResolver(r, i, [''], { scriptable: !1, indexable: !1, allKeys: !0 })
  );
}
function ed(e, t) {
  const s = ge.datasets[e] || {};
  return ((t.datasets || {})[e] || {}).indexAxis || t.indexAxis || s.indexAxis || 'x';
}
function PA(e, t) {
  let s = e;
  return (e === '_index_' ? (s = t) : e === '_value_' && (s = t === 'x' ? 'y' : 'x'), s);
}
function OA(e, t) {
  return e === t ? '_index_' : '_value_';
}
function kp(e) {
  if (e === 'x' || e === 'y' || e === 'r') return e;
}
function EA(e) {
  if (e === 'top' || e === 'bottom') return 'x';
  if (e === 'left' || e === 'right') return 'y';
}
function sd(e, ...t) {
  if (kp(e)) return e;
  for (const s of t) {
    const n = s.axis || EA(s.position) || (e.length > 1 && kp(e[0].toLowerCase()));
    if (n) return n;
  }
  throw new Error(
    `Cannot determine type of '${e}' axis. Please provide 'axis' or 'position' option.`
  );
}
function Cp(e, t, s) {
  if (s[t + 'AxisID'] === e) return { axis: t };
}
function RA(e, t) {
  if (t.data && t.data.datasets) {
    const s = t.data.datasets.filter((n) => n.xAxisID === e || n.yAxisID === e);
    if (s.length) return Cp(e, 'x', s[0]) || Cp(e, 'y', s[0]);
  }
  return {};
}
function DA(e, t) {
  const s = bi[e.type] || { scales: {} },
    n = t.scales || {},
    i = ed(e.type, t),
    o = Object.create(null);
  return (
    Object.keys(n).forEach((r) => {
      const a = n[r];
      if (!$t(a)) return console.error(`Invalid scale configuration for scale: ${r}`);
      if (a._proxy) return console.warn(`Ignoring resolver passed as options for scale: ${r}`);
      const l = sd(r, a, RA(r, e), ge.scales[a.type]),
        c = OA(l, i),
        h = s.scales || {};
      o[r] = Uo(Object.create(null), [{ axis: l }, a, h[l], h[c]]);
    }),
    e.data.datasets.forEach((r) => {
      const a = r.type || e.type,
        l = r.indexAxis || ed(a, t),
        h = (bi[a] || {}).scales || {};
      Object.keys(h).forEach((f) => {
        const m = PA(f, l),
          g = r[m + 'AxisID'] || m;
        ((o[g] = o[g] || Object.create(null)), Uo(o[g], [{ axis: m }, n[g], h[f]]));
      });
    }),
    Object.keys(o).forEach((r) => {
      const a = o[r];
      Uo(a, [ge.scales[a.type], ge.scale]);
    }),
    o
  );
}
function Tb(e) {
  const t = e.options || (e.options = {});
  ((t.plugins = Mt(t.plugins, {})), (t.scales = DA(e, t)));
}
function Ab(e) {
  return ((e = e || {}), (e.datasets = e.datasets || []), (e.labels = e.labels || []), e);
}
function MA(e) {
  return ((e = e || {}), (e.data = Ab(e.data)), Tb(e), e);
}
const Tp = new Map(),
  Pb = new Set();
function ia(e, t) {
  let s = Tp.get(e);
  return (s || ((s = t()), Tp.set(e, s), Pb.add(s)), s);
}
const yo = (e, t, s) => {
  const n = gi(t, s);
  n !== void 0 && e.add(n);
};
class IA {
  constructor(t) {
    ((this._config = MA(t)), (this._scopeCache = new Map()), (this._resolverCache = new Map()));
  }
  get platform() {
    return this._config.platform;
  }
  get type() {
    return this._config.type;
  }
  set type(t) {
    this._config.type = t;
  }
  get data() {
    return this._config.data;
  }
  set data(t) {
    this._config.data = Ab(t);
  }
  get options() {
    return this._config.options;
  }
  set options(t) {
    this._config.options = t;
  }
  get plugins() {
    return this._config.plugins;
  }
  update() {
    const t = this._config;
    (this.clearCache(), Tb(t));
  }
  clearCache() {
    (this._scopeCache.clear(), this._resolverCache.clear());
  }
  datasetScopeKeys(t) {
    return ia(t, () => [[`datasets.${t}`, '']]);
  }
  datasetAnimationScopeKeys(t, s) {
    return ia(`${t}.transition.${s}`, () => [
      [`datasets.${t}.transitions.${s}`, `transitions.${s}`],
      [`datasets.${t}`, '']
    ]);
  }
  datasetElementScopeKeys(t, s) {
    return ia(`${t}-${s}`, () => [
      [`datasets.${t}.elements.${s}`, `datasets.${t}`, `elements.${s}`, '']
    ]);
  }
  pluginScopeKeys(t) {
    const s = t.id,
      n = this.type;
    return ia(`${n}-plugin-${s}`, () => [[`plugins.${s}`, ...(t.additionalOptionScopes || [])]]);
  }
  _cachedScopes(t, s) {
    const n = this._scopeCache;
    let i = n.get(t);
    return ((!i || s) && ((i = new Map()), n.set(t, i)), i);
  }
  getOptionScopes(t, s, n) {
    const { options: i, type: o } = this,
      r = this._cachedScopes(t, n),
      a = r.get(s);
    if (a) return a;
    const l = new Set();
    s.forEach((h) => {
      (t && (l.add(t), h.forEach((f) => yo(l, t, f))),
        h.forEach((f) => yo(l, i, f)),
        h.forEach((f) => yo(l, bi[o] || {}, f)),
        h.forEach((f) => yo(l, ge, f)),
        h.forEach((f) => yo(l, Qc, f)));
    });
    const c = Array.from(l);
    return (c.length === 0 && c.push(Object.create(null)), Pb.has(s) && r.set(s, c), c);
  }
  chartOptionScopes() {
    const { options: t, type: s } = this;
    return [t, bi[s] || {}, ge.datasets[s] || {}, { type: s }, ge, Qc];
  }
  resolveNamedOptions(t, s, n, i = ['']) {
    const o = { $shared: !0 },
      { resolver: r, subPrefixes: a } = Ap(this._resolverCache, t, i);
    let l = r;
    if (NA(r, s)) {
      ((o.$shared = !1), (n = $n(n) ? n() : n));
      const c = this.createResolver(t, n, a);
      l = Ji(r, n, c);
    }
    for (const c of s) o[c] = l[c];
    return o;
  }
  createResolver(t, s, n = [''], i) {
    const { resolver: o } = Ap(this._resolverCache, t, n);
    return $t(s) ? Ji(o, s, void 0, i) : o;
  }
}
function Ap(e, t, s) {
  let n = e.get(t);
  n || ((n = new Map()), e.set(t, n));
  const i = s.join();
  let o = n.get(i);
  return (
    o ||
      ((o = {
        resolver: jd(t, s),
        subPrefixes: s.filter((a) => !a.toLowerCase().includes('hover'))
      }),
      n.set(i, o)),
    o
  );
}
const LA = (e) => $t(e) && Object.getOwnPropertyNames(e).some((t) => $n(e[t]));
function NA(e, t) {
  const { isScriptable: s, isIndexable: n } = ab(e);
  for (const i of t) {
    const o = s(i),
      r = n(i),
      a = (r || o) && e[i];
    if ((o && ($n(a) || LA(a))) || (r && ve(a))) return !0;
  }
  return !1;
}
var $A = '4.5.1';
const FA = ['top', 'bottom', 'left', 'right', 'chartArea'];
function Pp(e, t) {
  return e === 'top' || e === 'bottom' || (FA.indexOf(e) === -1 && t === 'x');
}
function Op(e, t) {
  return function (s, n) {
    return s[e] === n[e] ? s[t] - n[t] : s[e] - n[e];
  };
}
function Ep(e) {
  const t = e.chart,
    s = t.options.animation;
  (t.notifyPlugins('afterRender'), ce(s && s.onComplete, [e], t));
}
function BA(e) {
  const t = e.chart,
    s = t.options.animation;
  ce(s && s.onProgress, [e], t);
}
function Ob(e) {
  return (
    zd() && typeof e == 'string' ? (e = document.getElementById(e)) : e && e.length && (e = e[0]),
    e && e.canvas && (e = e.canvas),
    e
  );
}
const va = {},
  Rp = (e) => {
    const t = Ob(e);
    return Object.values(va)
      .filter((s) => s.canvas === t)
      .pop();
  };
function UA(e, t, s) {
  const n = Object.keys(e);
  for (const i of n) {
    const o = +i;
    if (o >= t) {
      const r = e[i];
      (delete e[i], (s > 0 || o > t) && (e[o + s] = r));
    }
  }
}
function jA(e, t, s, n) {
  return !s || e.type === 'mouseout' ? null : n ? t : e;
}
var Tn;
let xr =
  ((Tn = class {
    static register(...t) {
      (Hs.add(...t), Dp());
    }
    static unregister(...t) {
      (Hs.remove(...t), Dp());
    }
    constructor(t, s) {
      const n = (this.config = new IA(s)),
        i = Ob(t),
        o = Rp(i);
      if (o)
        throw new Error(
          "Canvas is already in use. Chart with ID '" +
            o.id +
            "' must be destroyed before the canvas with ID '" +
            o.canvas.id +
            "' can be reused."
        );
      const r = n.createResolver(n.chartOptionScopes(), this.getContext());
      ((this.platform = new (n.platform || oA(i))()), this.platform.updateConfig(n));
      const a = this.platform.acquireContext(i, r.aspectRatio),
        l = a && a.canvas,
        c = l && l.height,
        h = l && l.width;
      if (
        ((this.id = Bk()),
        (this.ctx = a),
        (this.canvas = l),
        (this.width = h),
        (this.height = c),
        (this._options = r),
        (this._aspectRatio = this.aspectRatio),
        (this._layers = []),
        (this._metasets = []),
        (this._stacks = void 0),
        (this.boxes = []),
        (this.currentDevicePixelRatio = void 0),
        (this.chartArea = void 0),
        (this._active = []),
        (this._lastEvent = void 0),
        (this._listeners = {}),
        (this._responsiveListeners = void 0),
        (this._sortedMetasets = []),
        (this.scales = {}),
        (this._plugins = new SA()),
        (this.$proxies = {}),
        (this._hiddenIndices = {}),
        (this.attached = !1),
        (this._animationsDisabled = void 0),
        (this.$context = void 0),
        (this._doResize = iC((f) => this.update(f), r.resizeDelay || 0)),
        (this._dataChanges = []),
        (va[this.id] = this),
        !a || !l)
      ) {
        console.error("Failed to create chart: can't acquire context from the given item");
        return;
      }
      (sn.listen(this, 'complete', Ep),
        sn.listen(this, 'progress', BA),
        this._initialize(),
        this.attached && this.update());
    }
    get aspectRatio() {
      const {
        options: { aspectRatio: t, maintainAspectRatio: s },
        width: n,
        height: i,
        _aspectRatio: o
      } = this;
      return Gt(t) ? (s && o ? o : i ? n / i : null) : t;
    }
    get data() {
      return this.config.data;
    }
    set data(t) {
      this.config.data = t;
    }
    get options() {
      return this._options;
    }
    set options(t) {
      this.config.options = t;
    }
    get registry() {
      return Hs;
    }
    _initialize() {
      return (
        this.notifyPlugins('beforeInit'),
        this.options.responsive ? this.resize() : tp(this, this.options.devicePixelRatio),
        this.bindEvents(),
        this.notifyPlugins('afterInit'),
        this
      );
    }
    clear() {
      return (Jf(this.canvas, this.ctx), this);
    }
    stop() {
      return (sn.stop(this), this);
    }
    resize(t, s) {
      sn.running(this) ? (this._resizeBeforeDraw = { width: t, height: s }) : this._resize(t, s);
    }
    _resize(t, s) {
      const n = this.options,
        i = this.canvas,
        o = n.maintainAspectRatio && this.aspectRatio,
        r = this.platform.getMaximumSize(i, t, s, o),
        a = n.devicePixelRatio || this.platform.getDevicePixelRatio(),
        l = this.width ? 'resize' : 'attach';
      ((this.width = r.width),
        (this.height = r.height),
        (this._aspectRatio = this.aspectRatio),
        tp(this, a, !0) &&
          (this.notifyPlugins('resize', { size: r }),
          ce(n.onResize, [this, r], this),
          this.attached && this._doResize(l) && this.render()));
    }
    ensureScalesHaveIDs() {
      const s = this.options.scales || {};
      Zt(s, (n, i) => {
        n.id = i;
      });
    }
    buildOrUpdateScales() {
      const t = this.options,
        s = t.scales,
        n = this.scales,
        i = Object.keys(n).reduce((r, a) => ((r[a] = !1), r), {});
      let o = [];
      (s &&
        (o = o.concat(
          Object.keys(s).map((r) => {
            const a = s[r],
              l = sd(r, a),
              c = l === 'r',
              h = l === 'x';
            return {
              options: a,
              dposition: c ? 'chartArea' : h ? 'bottom' : 'left',
              dtype: c ? 'radialLinear' : h ? 'category' : 'linear'
            };
          })
        )),
        Zt(o, (r) => {
          const a = r.options,
            l = a.id,
            c = sd(l, a),
            h = Mt(a.type, r.dtype);
          ((a.position === void 0 || Pp(a.position, c) !== Pp(r.dposition)) &&
            (a.position = r.dposition),
            (i[l] = !0));
          let f = null;
          if (l in n && n[l].type === h) f = n[l];
          else {
            const m = Hs.getScale(h);
            ((f = new m({ id: l, type: h, ctx: this.ctx, chart: this })), (n[f.id] = f));
          }
          f.init(a, t);
        }),
        Zt(i, (r, a) => {
          r || delete n[a];
        }),
        Zt(n, (r) => {
          (xs.configure(this, r, r.options), xs.addBox(this, r));
        }));
    }
    _updateMetasets() {
      const t = this._metasets,
        s = this.data.datasets.length,
        n = t.length;
      if ((t.sort((i, o) => i.index - o.index), n > s)) {
        for (let i = s; i < n; ++i) this._destroyDatasetMeta(i);
        t.splice(s, n - s);
      }
      this._sortedMetasets = t.slice(0).sort(Op('order', 'index'));
    }
    _removeUnreferencedMetasets() {
      const {
        _metasets: t,
        data: { datasets: s }
      } = this;
      (t.length > s.length && delete this._stacks,
        t.forEach((n, i) => {
          s.filter((o) => o === n._dataset).length === 0 && this._destroyDatasetMeta(i);
        }));
    }
    buildOrUpdateControllers() {
      const t = [],
        s = this.data.datasets;
      let n, i;
      for (this._removeUnreferencedMetasets(), n = 0, i = s.length; n < i; n++) {
        const o = s[n];
        let r = this.getDatasetMeta(n);
        const a = o.type || this.config.type;
        if (
          (r.type && r.type !== a && (this._destroyDatasetMeta(n), (r = this.getDatasetMeta(n))),
          (r.type = a),
          (r.indexAxis = o.indexAxis || ed(a, this.options)),
          (r.order = o.order || 0),
          (r.index = n),
          (r.label = '' + o.label),
          (r.visible = this.isDatasetVisible(n)),
          r.controller)
        )
          (r.controller.updateIndex(n), r.controller.linkScales());
        else {
          const l = Hs.getController(a),
            { datasetElementType: c, dataElementType: h } = ge.datasets[a];
          (Object.assign(l, {
            dataElementType: Hs.getElement(h),
            datasetElementType: c && Hs.getElement(c)
          }),
            (r.controller = new l(this, n)),
            t.push(r.controller));
        }
      }
      return (this._updateMetasets(), t);
    }
    _resetElements() {
      Zt(
        this.data.datasets,
        (t, s) => {
          this.getDatasetMeta(s).controller.reset();
        },
        this
      );
    }
    reset() {
      (this._resetElements(), this.notifyPlugins('reset'));
    }
    update(t) {
      const s = this.config;
      s.update();
      const n = (this._options = s.createResolver(s.chartOptionScopes(), this.getContext())),
        i = (this._animationsDisabled = !n.animation);
      if (
        (this._updateScales(),
        this._checkEventBindings(),
        this._updateHiddenIndices(),
        this._plugins.invalidate(),
        this.notifyPlugins('beforeUpdate', { mode: t, cancelable: !0 }) === !1)
      )
        return;
      const o = this.buildOrUpdateControllers();
      this.notifyPlugins('beforeElementsUpdate');
      let r = 0;
      for (let c = 0, h = this.data.datasets.length; c < h; c++) {
        const { controller: f } = this.getDatasetMeta(c),
          m = !i && o.indexOf(f) === -1;
        (f.buildOrUpdateElements(m), (r = Math.max(+f.getMaxOverflow(), r)));
      }
      ((r = this._minPadding = n.layout.autoPadding ? r : 0),
        this._updateLayout(r),
        i ||
          Zt(o, (c) => {
            c.reset();
          }),
        this._updateDatasets(t),
        this.notifyPlugins('afterUpdate', { mode: t }),
        this._layers.sort(Op('z', '_idx')));
      const { _active: a, _lastEvent: l } = this;
      (l ? this._eventHandler(l, !0) : a.length && this._updateHoverStyles(a, a, !0),
        this.render());
    }
    _updateScales() {
      (Zt(this.scales, (t) => {
        xs.removeBox(this, t);
      }),
        this.ensureScalesHaveIDs(),
        this.buildOrUpdateScales());
    }
    _checkEventBindings() {
      const t = this.options,
        s = new Set(Object.keys(this._listeners)),
        n = new Set(t.events);
      (!jf(s, n) || !!this._responsiveListeners !== t.responsive) &&
        (this.unbindEvents(), this.bindEvents());
    }
    _updateHiddenIndices() {
      const { _hiddenIndices: t } = this,
        s = this._getUniformDataChanges() || [];
      for (const { method: n, start: i, count: o } of s) {
        const r = n === '_removeElements' ? -o : o;
        UA(t, i, r);
      }
    }
    _getUniformDataChanges() {
      const t = this._dataChanges;
      if (!t || !t.length) return;
      this._dataChanges = [];
      const s = this.data.datasets.length,
        n = (o) =>
          new Set(t.filter((r) => r[0] === o).map((r, a) => a + ',' + r.splice(1).join(','))),
        i = n(0);
      for (let o = 1; o < s; o++) if (!jf(i, n(o))) return;
      return Array.from(i)
        .map((o) => o.split(','))
        .map((o) => ({ method: o[1], start: +o[2], count: +o[3] }));
    }
    _updateLayout(t) {
      if (this.notifyPlugins('beforeLayout', { cancelable: !0 }) === !1) return;
      xs.update(this, this.width, this.height, t);
      const s = this.chartArea,
        n = s.width <= 0 || s.height <= 0;
      ((this._layers = []),
        Zt(
          this.boxes,
          (i) => {
            (n && i.position === 'chartArea') ||
              (i.configure && i.configure(), this._layers.push(...i._layers()));
          },
          this
        ),
        this._layers.forEach((i, o) => {
          i._idx = o;
        }),
        this.notifyPlugins('afterLayout'));
    }
    _updateDatasets(t) {
      if (this.notifyPlugins('beforeDatasetsUpdate', { mode: t, cancelable: !0 }) !== !1) {
        for (let s = 0, n = this.data.datasets.length; s < n; ++s)
          this.getDatasetMeta(s).controller.configure();
        for (let s = 0, n = this.data.datasets.length; s < n; ++s)
          this._updateDataset(s, $n(t) ? t({ datasetIndex: s }) : t);
        this.notifyPlugins('afterDatasetsUpdate', { mode: t });
      }
    }
    _updateDataset(t, s) {
      const n = this.getDatasetMeta(t),
        i = { meta: n, index: t, mode: s, cancelable: !0 };
      this.notifyPlugins('beforeDatasetUpdate', i) !== !1 &&
        (n.controller._update(s), (i.cancelable = !1), this.notifyPlugins('afterDatasetUpdate', i));
    }
    render() {
      this.notifyPlugins('beforeRender', { cancelable: !0 }) !== !1 &&
        (sn.has(this)
          ? this.attached && !sn.running(this) && sn.start(this)
          : (this.draw(), Ep({ chart: this })));
    }
    draw() {
      let t;
      if (this._resizeBeforeDraw) {
        const { width: n, height: i } = this._resizeBeforeDraw;
        ((this._resizeBeforeDraw = null), this._resize(n, i));
      }
      if (
        (this.clear(),
        this.width <= 0 ||
          this.height <= 0 ||
          this.notifyPlugins('beforeDraw', { cancelable: !0 }) === !1)
      )
        return;
      const s = this._layers;
      for (t = 0; t < s.length && s[t].z <= 0; ++t) s[t].draw(this.chartArea);
      for (this._drawDatasets(); t < s.length; ++t) s[t].draw(this.chartArea);
      this.notifyPlugins('afterDraw');
    }
    _getSortedDatasetMetas(t) {
      const s = this._sortedMetasets,
        n = [];
      let i, o;
      for (i = 0, o = s.length; i < o; ++i) {
        const r = s[i];
        (!t || r.visible) && n.push(r);
      }
      return n;
    }
    getSortedVisibleDatasetMetas() {
      return this._getSortedDatasetMetas(!0);
    }
    _drawDatasets() {
      if (this.notifyPlugins('beforeDatasetsDraw', { cancelable: !0 }) === !1) return;
      const t = this.getSortedVisibleDatasetMetas();
      for (let s = t.length - 1; s >= 0; --s) this._drawDataset(t[s]);
      this.notifyPlugins('afterDatasetsDraw');
    }
    _drawDataset(t) {
      const s = this.ctx,
        n = { meta: t, index: t.index, cancelable: !0 },
        i = bb(this, t);
      this.notifyPlugins('beforeDatasetDraw', n) !== !1 &&
        (i && ul(s, i),
        t.controller.draw(),
        i && hl(s),
        (n.cancelable = !1),
        this.notifyPlugins('afterDatasetDraw', n));
    }
    isPointInArea(t) {
      return rr(t, this.chartArea, this._minPadding);
    }
    getElementsAtEventForMode(t, s, n, i) {
      const o = FT.modes[s];
      return typeof o == 'function' ? o(this, t, n, i) : [];
    }
    getDatasetMeta(t) {
      const s = this.data.datasets[t],
        n = this._metasets;
      let i = n.filter((o) => o && o._dataset === s).pop();
      return (
        i ||
          ((i = {
            type: null,
            data: [],
            dataset: null,
            controller: null,
            hidden: null,
            xAxisID: null,
            yAxisID: null,
            order: (s && s.order) || 0,
            index: t,
            _dataset: s,
            _parsed: [],
            _sorted: !1
          }),
          n.push(i)),
        i
      );
    }
    getContext() {
      return this.$context || (this.$context = _i(null, { chart: this, type: 'chart' }));
    }
    getVisibleDatasetCount() {
      return this.getSortedVisibleDatasetMetas().length;
    }
    isDatasetVisible(t) {
      const s = this.data.datasets[t];
      if (!s) return !1;
      const n = this.getDatasetMeta(t);
      return typeof n.hidden == 'boolean' ? !n.hidden : !s.hidden;
    }
    setDatasetVisibility(t, s) {
      const n = this.getDatasetMeta(t);
      n.hidden = !s;
    }
    toggleDataVisibility(t) {
      this._hiddenIndices[t] = !this._hiddenIndices[t];
    }
    getDataVisibility(t) {
      return !this._hiddenIndices[t];
    }
    _updateVisibility(t, s, n) {
      const i = n ? 'show' : 'hide',
        o = this.getDatasetMeta(t),
        r = o.controller._resolveAnimations(void 0, i);
      nr(s)
        ? ((o.data[s].hidden = !n), this.update())
        : (this.setDatasetVisibility(t, n),
          r.update(o, { visible: n }),
          this.update((a) => (a.datasetIndex === t ? i : void 0)));
    }
    hide(t, s) {
      this._updateVisibility(t, s, !1);
    }
    show(t, s) {
      this._updateVisibility(t, s, !0);
    }
    _destroyDatasetMeta(t) {
      const s = this._metasets[t];
      (s && s.controller && s.controller._destroy(), delete this._metasets[t]);
    }
    _stop() {
      let t, s;
      for (this.stop(), sn.remove(this), t = 0, s = this.data.datasets.length; t < s; ++t)
        this._destroyDatasetMeta(t);
    }
    destroy() {
      this.notifyPlugins('beforeDestroy');
      const { canvas: t, ctx: s } = this;
      (this._stop(),
        this.config.clearCache(),
        t &&
          (this.unbindEvents(),
          Jf(t, s),
          this.platform.releaseContext(s),
          (this.canvas = null),
          (this.ctx = null)),
        delete va[this.id],
        this.notifyPlugins('afterDestroy'));
    }
    toBase64Image(...t) {
      return this.canvas.toDataURL(...t);
    }
    bindEvents() {
      (this.bindUserEvents(),
        this.options.responsive ? this.bindResponsiveEvents() : (this.attached = !0));
    }
    bindUserEvents() {
      const t = this._listeners,
        s = this.platform,
        n = (o, r) => {
          (s.addEventListener(this, o, r), (t[o] = r));
        },
        i = (o, r, a) => {
          ((o.offsetX = r), (o.offsetY = a), this._eventHandler(o));
        };
      Zt(this.options.events, (o) => n(o, i));
    }
    bindResponsiveEvents() {
      this._responsiveListeners || (this._responsiveListeners = {});
      const t = this._responsiveListeners,
        s = this.platform,
        n = (l, c) => {
          (s.addEventListener(this, l, c), (t[l] = c));
        },
        i = (l, c) => {
          t[l] && (s.removeEventListener(this, l, c), delete t[l]);
        },
        o = (l, c) => {
          this.canvas && this.resize(l, c);
        };
      let r;
      const a = () => {
        (i('attach', a), (this.attached = !0), this.resize(), n('resize', o), n('detach', r));
      };
      ((r = () => {
        ((this.attached = !1), i('resize', o), this._stop(), this._resize(0, 0), n('attach', a));
      }),
        s.isAttached(this.canvas) ? a() : r());
    }
    unbindEvents() {
      (Zt(this._listeners, (t, s) => {
        this.platform.removeEventListener(this, s, t);
      }),
        (this._listeners = {}),
        Zt(this._responsiveListeners, (t, s) => {
          this.platform.removeEventListener(this, s, t);
        }),
        (this._responsiveListeners = void 0));
    }
    updateHoverStyle(t, s, n) {
      const i = n ? 'set' : 'remove';
      let o, r, a, l;
      for (
        s === 'dataset' &&
          ((o = this.getDatasetMeta(t[0].datasetIndex)),
          o.controller['_' + i + 'DatasetHoverStyle']()),
          a = 0,
          l = t.length;
        a < l;
        ++a
      ) {
        r = t[a];
        const c = r && this.getDatasetMeta(r.datasetIndex).controller;
        c && c[i + 'HoverStyle'](r.element, r.datasetIndex, r.index);
      }
    }
    getActiveElements() {
      return this._active || [];
    }
    setActiveElements(t) {
      const s = this._active || [],
        n = t.map(({ datasetIndex: o, index: r }) => {
          const a = this.getDatasetMeta(o);
          if (!a) throw new Error('No dataset found at index ' + o);
          return { datasetIndex: o, element: a.data[r], index: r };
        });
      !Ra(n, s) && ((this._active = n), (this._lastEvent = null), this._updateHoverStyles(n, s));
    }
    notifyPlugins(t, s, n) {
      return this._plugins.notify(this, t, s, n);
    }
    isPluginEnabled(t) {
      return this._plugins._cache.filter((s) => s.plugin.id === t).length === 1;
    }
    _updateHoverStyles(t, s, n) {
      const i = this.options.hover,
        o = (l, c) =>
          l.filter((h) => !c.some((f) => h.datasetIndex === f.datasetIndex && h.index === f.index)),
        r = o(s, t),
        a = n ? t : o(t, s);
      (r.length && this.updateHoverStyle(r, i.mode, !1),
        a.length && i.mode && this.updateHoverStyle(a, i.mode, !0));
    }
    _eventHandler(t, s) {
      const n = { event: t, replay: s, cancelable: !0, inChartArea: this.isPointInArea(t) },
        i = (r) => (r.options.events || this.options.events).includes(t.native.type);
      if (this.notifyPlugins('beforeEvent', n, i) === !1) return;
      const o = this._handleEvent(t, s, n.inChartArea);
      return (
        (n.cancelable = !1),
        this.notifyPlugins('afterEvent', n, i),
        (o || n.changed) && this.render(),
        this
      );
    }
    _handleEvent(t, s, n) {
      const { _active: i = [], options: o } = this,
        r = s,
        a = this._getActiveElements(t, i, n, r),
        l = Wk(t),
        c = jA(t, this._lastEvent, n, l);
      n &&
        ((this._lastEvent = null),
        ce(o.onHover, [t, a, this], this),
        l && ce(o.onClick, [t, a, this], this));
      const h = !Ra(a, i);
      return (
        (h || s) && ((this._active = a), this._updateHoverStyles(a, i, s)),
        (this._lastEvent = c),
        h
      );
    }
    _getActiveElements(t, s, n, i) {
      if (t.type === 'mouseout') return [];
      if (!n) return s;
      const o = this.options.hover;
      return this.getElementsAtEventForMode(t, o.mode, o, i);
    }
  }),
  ct(Tn, 'defaults', ge),
  ct(Tn, 'instances', va),
  ct(Tn, 'overrides', bi),
  ct(Tn, 'registry', Hs),
  ct(Tn, 'version', $A),
  ct(Tn, 'getChart', Rp),
  Tn);
function Dp() {
  return Zt(xr.instances, (e) => e._plugins.invalidate());
}
function VA(e, t, s) {
  const { startAngle: n, x: i, y: o, outerRadius: r, innerRadius: a, options: l } = t,
    { borderWidth: c, borderJoinStyle: h } = l,
    f = Math.min(c / r, as(n - s));
  if ((e.beginPath(), e.arc(i, o, r - c / 2, n + f / 2, s - f / 2), a > 0)) {
    const m = Math.min(c / a, as(n - s));
    e.arc(i, o, a + c / 2, s - m / 2, n + m / 2, !0);
  } else {
    const m = Math.min(c / 2, r * as(n - s));
    if (h === 'round') e.arc(i, o, m, s - Qt / 2, n + Qt / 2, !0);
    else if (h === 'bevel') {
      const g = 2 * m * m,
        _ = -g * Math.cos(s + Qt / 2) + i,
        y = -g * Math.sin(s + Qt / 2) + o,
        x = g * Math.cos(n + Qt / 2) + i,
        w = g * Math.sin(n + Qt / 2) + o;
      (e.lineTo(_, y), e.lineTo(x, w));
    }
  }
  (e.closePath(), e.moveTo(0, 0), e.rect(0, 0, e.canvas.width, e.canvas.height), e.clip('evenodd'));
}
function HA(e, t, s) {
  const { startAngle: n, pixelMargin: i, x: o, y: r, outerRadius: a, innerRadius: l } = t;
  let c = i / a;
  (e.beginPath(),
    e.arc(o, r, a, n - c, s + c),
    l > i ? ((c = i / l), e.arc(o, r, l, s + c, n - c, !0)) : e.arc(o, r, i, s + Te, n - Te),
    e.closePath(),
    e.clip());
}
function zA(e) {
  return Ud(e, ['outerStart', 'outerEnd', 'innerStart', 'innerEnd']);
}
function WA(e, t, s, n) {
  const i = zA(e.options.borderRadius),
    o = (s - t) / 2,
    r = Math.min(o, (n * t) / 2),
    a = (l) => {
      const c = ((s - Math.min(o, l)) * n) / 2;
      return $e(l, 0, Math.min(o, c));
    };
  return {
    outerStart: a(i.outerStart),
    outerEnd: a(i.outerEnd),
    innerStart: $e(i.innerStart, 0, r),
    innerEnd: $e(i.innerEnd, 0, r)
  };
}
function Ii(e, t, s, n) {
  return { x: s + e * Math.cos(t), y: n + e * Math.sin(t) };
}
function $a(e, t, s, n, i, o) {
  const { x: r, y: a, startAngle: l, pixelMargin: c, innerRadius: h } = t,
    f = Math.max(t.outerRadius + n + s - c, 0),
    m = h > 0 ? h + n + s + c : 0;
  let g = 0;
  const _ = i - l;
  if (n) {
    const At = h > 0 ? h - n : 0,
      lt = f > 0 ? f - n : 0,
      ht = (At + lt) / 2,
      ft = ht !== 0 ? (_ * ht) / (ht + n) : _;
    g = (_ - ft) / 2;
  }
  const y = Math.max(0.001, _ * f - s / Qt) / f,
    x = (_ - y) / 2,
    w = l + x + g,
    C = i - x - g,
    { outerStart: T, outerEnd: E, innerStart: M, innerEnd: H } = WA(t, m, f, C - w),
    $ = f - T,
    X = f - E,
    G = w + T / $,
    et = C - E / X,
    ot = m + M,
    Z = m + H,
    q = w + M / ot,
    dt = C - H / Z;
  if ((e.beginPath(), o)) {
    const At = (G + et) / 2;
    if ((e.arc(r, a, f, G, At), e.arc(r, a, f, At, et), E > 0)) {
      const Vt = Ii(X, et, r, a);
      e.arc(Vt.x, Vt.y, E, et, C + Te);
    }
    const lt = Ii(Z, C, r, a);
    if ((e.lineTo(lt.x, lt.y), H > 0)) {
      const Vt = Ii(Z, dt, r, a);
      e.arc(Vt.x, Vt.y, H, C + Te, dt + Math.PI);
    }
    const ht = (C - H / m + (w + M / m)) / 2;
    if ((e.arc(r, a, m, C - H / m, ht, !0), e.arc(r, a, m, ht, w + M / m, !0), M > 0)) {
      const Vt = Ii(ot, q, r, a);
      e.arc(Vt.x, Vt.y, M, q + Math.PI, w - Te);
    }
    const ft = Ii($, w, r, a);
    if ((e.lineTo(ft.x, ft.y), T > 0)) {
      const Vt = Ii($, G, r, a);
      e.arc(Vt.x, Vt.y, T, w - Te, G);
    }
  } else {
    e.moveTo(r, a);
    const At = Math.cos(G) * f + r,
      lt = Math.sin(G) * f + a;
    e.lineTo(At, lt);
    const ht = Math.cos(et) * f + r,
      ft = Math.sin(et) * f + a;
    e.lineTo(ht, ft);
  }
  e.closePath();
}
function KA(e, t, s, n, i) {
  const { fullCircles: o, startAngle: r, circumference: a } = t;
  let l = t.endAngle;
  if (o) {
    $a(e, t, s, n, l, i);
    for (let c = 0; c < o; ++c) e.fill();
    isNaN(a) || (l = r + (a % he || he));
  }
  return ($a(e, t, s, n, l, i), e.fill(), l);
}
function qA(e, t, s, n, i) {
  const { fullCircles: o, startAngle: r, circumference: a, options: l } = t,
    { borderWidth: c, borderJoinStyle: h, borderDash: f, borderDashOffset: m, borderRadius: g } = l,
    _ = l.borderAlign === 'inner';
  if (!c) return;
  (e.setLineDash(f || []),
    (e.lineDashOffset = m),
    _
      ? ((e.lineWidth = c * 2), (e.lineJoin = h || 'round'))
      : ((e.lineWidth = c), (e.lineJoin = h || 'bevel')));
  let y = t.endAngle;
  if (o) {
    $a(e, t, s, n, y, i);
    for (let x = 0; x < o; ++x) e.stroke();
    isNaN(a) || (y = r + (a % he || he));
  }
  (_ && HA(e, t, y),
    l.selfJoin && y - r >= Qt && g === 0 && h !== 'miter' && VA(e, t, y),
    o || ($a(e, t, s, n, y, i), e.stroke()));
}
class Fi extends vn {
  constructor(s) {
    super();
    ct(this, 'circumference');
    ct(this, 'endAngle');
    ct(this, 'fullCircles');
    ct(this, 'innerRadius');
    ct(this, 'outerRadius');
    ct(this, 'pixelMargin');
    ct(this, 'startAngle');
    ((this.options = void 0),
      (this.circumference = void 0),
      (this.startAngle = void 0),
      (this.endAngle = void 0),
      (this.innerRadius = void 0),
      (this.outerRadius = void 0),
      (this.pixelMargin = 0),
      (this.fullCircles = 0),
      s && Object.assign(this, s));
  }
  inRange(s, n, i) {
    const o = this.getProps(['x', 'y'], i),
      { angle: r, distance: a } = Qg(o, { x: s, y: n }),
      {
        startAngle: l,
        endAngle: c,
        innerRadius: h,
        outerRadius: f,
        circumference: m
      } = this.getProps(
        ['startAngle', 'endAngle', 'innerRadius', 'outerRadius', 'circumference'],
        i
      ),
      g = (this.options.spacing + this.options.borderWidth) / 2,
      _ = Mt(m, c - l),
      y = or(r, l, c) && l !== c,
      x = _ >= he || y,
      w = hn(a, h + g, f + g);
    return x && w;
  }
  getCenterPoint(s) {
    const {
        x: n,
        y: i,
        startAngle: o,
        endAngle: r,
        innerRadius: a,
        outerRadius: l
      } = this.getProps(['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'], s),
      { offset: c, spacing: h } = this.options,
      f = (o + r) / 2,
      m = (a + l + h + c) / 2;
    return { x: n + Math.cos(f) * m, y: i + Math.sin(f) * m };
  }
  tooltipPosition(s) {
    return this.getCenterPoint(s);
  }
  draw(s) {
    const { options: n, circumference: i } = this,
      o = (n.offset || 0) / 4,
      r = (n.spacing || 0) / 2,
      a = n.circular;
    if (
      ((this.pixelMargin = n.borderAlign === 'inner' ? 0.33 : 0),
      (this.fullCircles = i > he ? Math.floor(i / he) : 0),
      i === 0 || this.innerRadius < 0 || this.outerRadius < 0)
    )
      return;
    s.save();
    const l = (this.startAngle + this.endAngle) / 2;
    s.translate(Math.cos(l) * o, Math.sin(l) * o);
    const c = 1 - Math.sin(Math.min(Qt, i || 0)),
      h = o * c;
    ((s.fillStyle = n.backgroundColor),
      (s.strokeStyle = n.borderColor),
      KA(s, this, h, r, a),
      qA(s, this, h, r, a),
      s.restore());
  }
}
(ct(Fi, 'id', 'arc'),
  ct(Fi, 'defaults', {
    borderAlign: 'center',
    borderColor: '#fff',
    borderDash: [],
    borderDashOffset: 0,
    borderJoinStyle: void 0,
    borderRadius: 0,
    borderWidth: 2,
    offset: 0,
    spacing: 0,
    angle: void 0,
    circular: !0,
    selfJoin: !1
  }),
  ct(Fi, 'defaultRoutes', { backgroundColor: 'backgroundColor' }),
  ct(Fi, 'descriptors', { _scriptable: !0, _indexable: (s) => s !== 'borderDash' }));
function Eb(e, t, s = t) {
  ((e.lineCap = Mt(s.borderCapStyle, t.borderCapStyle)),
    e.setLineDash(Mt(s.borderDash, t.borderDash)),
    (e.lineDashOffset = Mt(s.borderDashOffset, t.borderDashOffset)),
    (e.lineJoin = Mt(s.borderJoinStyle, t.borderJoinStyle)),
    (e.lineWidth = Mt(s.borderWidth, t.borderWidth)),
    (e.strokeStyle = Mt(s.borderColor, t.borderColor)));
}
function GA(e, t, s) {
  e.lineTo(s.x, s.y);
}
function XA(e) {
  return e.stepped ? _C : e.tension || e.cubicInterpolationMode === 'monotone' ? yC : GA;
}
function Rb(e, t, s = {}) {
  const n = e.length,
    { start: i = 0, end: o = n - 1 } = s,
    { start: r, end: a } = t,
    l = Math.max(i, r),
    c = Math.min(o, a),
    h = (i < r && o < r) || (i > a && o > a);
  return { count: n, start: l, loop: t.loop, ilen: c < l && !h ? n + c - l : c - l };
}
function YA(e, t, s, n) {
  const { points: i, options: o } = t,
    { count: r, start: a, loop: l, ilen: c } = Rb(i, s, n),
    h = XA(o);
  let { move: f = !0, reverse: m } = n || {},
    g,
    _,
    y;
  for (g = 0; g <= c; ++g)
    ((_ = i[(a + (m ? c - g : g)) % r]),
      !_.skip && (f ? (e.moveTo(_.x, _.y), (f = !1)) : h(e, y, _, m, o.stepped), (y = _)));
  return (l && ((_ = i[(a + (m ? c : 0)) % r]), h(e, y, _, m, o.stepped)), !!l);
}
function JA(e, t, s, n) {
  const i = t.points,
    { count: o, start: r, ilen: a } = Rb(i, s, n),
    { move: l = !0, reverse: c } = n || {};
  let h = 0,
    f = 0,
    m,
    g,
    _,
    y,
    x,
    w;
  const C = (E) => (r + (c ? a - E : E)) % o,
    T = () => {
      y !== x && (e.lineTo(h, x), e.lineTo(h, y), e.lineTo(h, w));
    };
  for (l && ((g = i[C(0)]), e.moveTo(g.x, g.y)), m = 0; m <= a; ++m) {
    if (((g = i[C(m)]), g.skip)) continue;
    const E = g.x,
      M = g.y,
      H = E | 0;
    (H === _
      ? (M < y ? (y = M) : M > x && (x = M), (h = (f * h + E) / ++f))
      : (T(), e.lineTo(E, M), (_ = H), (f = 0), (y = x = M)),
      (w = M));
  }
  T();
}
function nd(e) {
  const t = e.options,
    s = t.borderDash && t.borderDash.length;
  return !e._decimated &&
    !e._loop &&
    !t.tension &&
    t.cubicInterpolationMode !== 'monotone' &&
    !t.stepped &&
    !s
    ? JA
    : YA;
}
function ZA(e) {
  return e.stepped ? JC : e.tension || e.cubicInterpolationMode === 'monotone' ? ZC : oi;
}
function QA(e, t, s, n) {
  let i = t._path;
  (i || ((i = t._path = new Path2D()), t.path(i, s, n) && i.closePath()),
    Eb(e, t.options),
    e.stroke(i));
}
function tP(e, t, s, n) {
  const { segments: i, options: o } = t,
    r = nd(t);
  for (const a of i)
    (Eb(e, o, a.style),
      e.beginPath(),
      r(e, t, a, { start: s, end: s + n - 1 }) && e.closePath(),
      e.stroke());
}
const eP = typeof Path2D == 'function';
function sP(e, t, s, n) {
  eP && !t.options.segment ? QA(e, t, s, n) : tP(e, t, s, n);
}
class fn extends vn {
  constructor(t) {
    (super(),
      (this.animated = !0),
      (this.options = void 0),
      (this._chart = void 0),
      (this._loop = void 0),
      (this._fullLoop = void 0),
      (this._path = void 0),
      (this._points = void 0),
      (this._segments = void 0),
      (this._decimated = !1),
      (this._pointsUpdated = !1),
      (this._datasetIndex = void 0),
      t && Object.assign(this, t));
  }
  updateControlPoints(t, s) {
    const n = this.options;
    if (
      (n.tension || n.cubicInterpolationMode === 'monotone') &&
      !n.stepped &&
      !this._pointsUpdated
    ) {
      const i = n.spanGaps ? this._loop : this._fullLoop;
      (HC(this._points, n, t, i, s), (this._pointsUpdated = !0));
    }
  }
  set points(t) {
    ((this._points = t), delete this._segments, delete this._path, (this._pointsUpdated = !1));
  }
  get points() {
    return this._points;
  }
  get segments() {
    return this._segments || (this._segments = iT(this, this.options.segment));
  }
  first() {
    const t = this.segments,
      s = this.points;
    return t.length && s[t[0].start];
  }
  last() {
    const t = this.segments,
      s = this.points,
      n = t.length;
    return n && s[t[n - 1].end];
  }
  interpolate(t, s) {
    const n = this.options,
      i = t[s],
      o = this.points,
      r = gb(this, { property: s, start: i, end: i });
    if (!r.length) return;
    const a = [],
      l = ZA(n);
    let c, h;
    for (c = 0, h = r.length; c < h; ++c) {
      const { start: f, end: m } = r[c],
        g = o[f],
        _ = o[m];
      if (g === _) {
        a.push(g);
        continue;
      }
      const y = Math.abs((i - g[s]) / (_[s] - g[s])),
        x = l(g, _, y, n.stepped);
      ((x[s] = t[s]), a.push(x));
    }
    return a.length === 1 ? a[0] : a;
  }
  pathSegment(t, s, n) {
    return nd(this)(t, this, s, n);
  }
  path(t, s, n) {
    const i = this.segments,
      o = nd(this);
    let r = this._loop;
    ((s = s || 0), (n = n || this.points.length - s));
    for (const a of i) r &= o(t, this, a, { start: s, end: s + n - 1 });
    return !!r;
  }
  draw(t, s, n, i) {
    const o = this.options || {};
    ((this.points || []).length && o.borderWidth && (t.save(), sP(t, this, n, i), t.restore()),
      this.animated && ((this._pointsUpdated = !1), (this._path = void 0)));
  }
}
(ct(fn, 'id', 'line'),
  ct(fn, 'defaults', {
    borderCapStyle: 'butt',
    borderDash: [],
    borderDashOffset: 0,
    borderJoinStyle: 'miter',
    borderWidth: 3,
    capBezierPoints: !0,
    cubicInterpolationMode: 'default',
    fill: !1,
    spanGaps: !1,
    stepped: !1,
    tension: 0
  }),
  ct(fn, 'defaultRoutes', { backgroundColor: 'backgroundColor', borderColor: 'borderColor' }),
  ct(fn, 'descriptors', {
    _scriptable: !0,
    _indexable: (t) => t !== 'borderDash' && t !== 'fill'
  }));
function Mp(e, t, s, n) {
  const i = e.options,
    { [s]: o } = e.getProps([s], n);
  return Math.abs(t - o) < i.radius + i.hitRadius;
}
class zo extends vn {
  constructor(s) {
    super();
    ct(this, 'parsed');
    ct(this, 'skip');
    ct(this, 'stop');
    ((this.options = void 0),
      (this.parsed = void 0),
      (this.skip = void 0),
      (this.stop = void 0),
      s && Object.assign(this, s));
  }
  inRange(s, n, i) {
    const o = this.options,
      { x: r, y: a } = this.getProps(['x', 'y'], i);
    return Math.pow(s - r, 2) + Math.pow(n - a, 2) < Math.pow(o.hitRadius + o.radius, 2);
  }
  inXRange(s, n) {
    return Mp(this, s, 'x', n);
  }
  inYRange(s, n) {
    return Mp(this, s, 'y', n);
  }
  getCenterPoint(s) {
    const { x: n, y: i } = this.getProps(['x', 'y'], s);
    return { x: n, y: i };
  }
  size(s) {
    s = s || this.options || {};
    let n = s.radius || 0;
    n = Math.max(n, (n && s.hoverRadius) || 0);
    const i = (n && s.borderWidth) || 0;
    return (n + i) * 2;
  }
  draw(s, n) {
    const i = this.options;
    this.skip ||
      i.radius < 0.1 ||
      !rr(this, n, this.size(i) / 2) ||
      ((s.strokeStyle = i.borderColor),
      (s.lineWidth = i.borderWidth),
      (s.fillStyle = i.backgroundColor),
      td(s, i, this.x, this.y));
  }
  getRange() {
    const s = this.options || {};
    return s.radius + s.hitRadius;
  }
}
(ct(zo, 'id', 'point'),
  ct(zo, 'defaults', {
    borderWidth: 1,
    hitRadius: 1,
    hoverBorderWidth: 1,
    hoverRadius: 4,
    pointStyle: 'circle',
    radius: 3,
    rotation: 0
  }),
  ct(zo, 'defaultRoutes', { backgroundColor: 'backgroundColor', borderColor: 'borderColor' }));
function Db(e, t) {
  const {
    x: s,
    y: n,
    base: i,
    width: o,
    height: r
  } = e.getProps(['x', 'y', 'base', 'width', 'height'], t);
  let a, l, c, h, f;
  return (
    e.horizontal
      ? ((f = r / 2), (a = Math.min(s, i)), (l = Math.max(s, i)), (c = n - f), (h = n + f))
      : ((f = o / 2), (a = s - f), (l = s + f), (c = Math.min(n, i)), (h = Math.max(n, i))),
    { left: a, top: c, right: l, bottom: h }
  );
}
function Dn(e, t, s, n) {
  return e ? 0 : $e(t, s, n);
}
function nP(e, t, s) {
  const n = e.options.borderWidth,
    i = e.borderSkipped,
    o = rb(n);
  return {
    t: Dn(i.top, o.top, 0, s),
    r: Dn(i.right, o.right, 0, t),
    b: Dn(i.bottom, o.bottom, 0, s),
    l: Dn(i.left, o.left, 0, t)
  };
}
function iP(e, t, s) {
  const { enableBorderRadius: n } = e.getProps(['enableBorderRadius']),
    i = e.options.borderRadius,
    o = Hi(i),
    r = Math.min(t, s),
    a = e.borderSkipped,
    l = n || $t(i);
  return {
    topLeft: Dn(!l || a.top || a.left, o.topLeft, 0, r),
    topRight: Dn(!l || a.top || a.right, o.topRight, 0, r),
    bottomLeft: Dn(!l || a.bottom || a.left, o.bottomLeft, 0, r),
    bottomRight: Dn(!l || a.bottom || a.right, o.bottomRight, 0, r)
  };
}
function oP(e) {
  const t = Db(e),
    s = t.right - t.left,
    n = t.bottom - t.top,
    i = nP(e, s / 2, n / 2),
    o = iP(e, s / 2, n / 2);
  return {
    outer: { x: t.left, y: t.top, w: s, h: n, radius: o },
    inner: {
      x: t.left + i.l,
      y: t.top + i.t,
      w: s - i.l - i.r,
      h: n - i.t - i.b,
      radius: {
        topLeft: Math.max(0, o.topLeft - Math.max(i.t, i.l)),
        topRight: Math.max(0, o.topRight - Math.max(i.t, i.r)),
        bottomLeft: Math.max(0, o.bottomLeft - Math.max(i.b, i.l)),
        bottomRight: Math.max(0, o.bottomRight - Math.max(i.b, i.r))
      }
    }
  };
}
function Cc(e, t, s, n) {
  const i = t === null,
    o = s === null,
    a = e && !(i && o) && Db(e, n);
  return a && (i || hn(t, a.left, a.right)) && (o || hn(s, a.top, a.bottom));
}
function rP(e) {
  return e.topLeft || e.topRight || e.bottomLeft || e.bottomRight;
}
function aP(e, t) {
  e.rect(t.x, t.y, t.w, t.h);
}
function Tc(e, t, s = {}) {
  const n = e.x !== s.x ? -t : 0,
    i = e.y !== s.y ? -t : 0,
    o = (e.x + e.w !== s.x + s.w ? t : 0) - n,
    r = (e.y + e.h !== s.y + s.h ? t : 0) - i;
  return { x: e.x + n, y: e.y + i, w: e.w + o, h: e.h + r, radius: e.radius };
}
class Wo extends vn {
  constructor(t) {
    (super(),
      (this.options = void 0),
      (this.horizontal = void 0),
      (this.base = void 0),
      (this.width = void 0),
      (this.height = void 0),
      (this.inflateAmount = void 0),
      t && Object.assign(this, t));
  }
  draw(t) {
    const {
        inflateAmount: s,
        options: { borderColor: n, backgroundColor: i }
      } = this,
      { inner: o, outer: r } = oP(this),
      a = rP(r.radius) ? Ia : aP;
    (t.save(),
      (r.w !== o.w || r.h !== o.h) &&
        (t.beginPath(),
        a(t, Tc(r, s, o)),
        t.clip(),
        a(t, Tc(o, -s, r)),
        (t.fillStyle = n),
        t.fill('evenodd')),
      t.beginPath(),
      a(t, Tc(o, s)),
      (t.fillStyle = i),
      t.fill(),
      t.restore());
  }
  inRange(t, s, n) {
    return Cc(this, t, s, n);
  }
  inXRange(t, s) {
    return Cc(this, t, null, s);
  }
  inYRange(t, s) {
    return Cc(this, null, t, s);
  }
  getCenterPoint(t) {
    const {
      x: s,
      y: n,
      base: i,
      horizontal: o
    } = this.getProps(['x', 'y', 'base', 'horizontal'], t);
    return { x: o ? (s + i) / 2 : s, y: o ? n : (n + i) / 2 };
  }
  getRange(t) {
    return t === 'x' ? this.width / 2 : this.height / 2;
  }
}
(ct(Wo, 'id', 'bar'),
  ct(Wo, 'defaults', {
    borderSkipped: 'start',
    borderWidth: 0,
    borderRadius: 0,
    inflateAmount: 'auto',
    pointStyle: void 0
  }),
  ct(Wo, 'defaultRoutes', { backgroundColor: 'backgroundColor', borderColor: 'borderColor' }));
function lP(e, t, s) {
  const n = e.segments,
    i = e.points,
    o = t.points,
    r = [];
  for (const a of n) {
    let { start: l, end: c } = a;
    c = ml(l, c, i);
    const h = id(s, i[l], i[c], a.loop);
    if (!t.segments) {
      r.push({ source: a, target: h, start: i[l], end: i[c] });
      continue;
    }
    const f = gb(t, h);
    for (const m of f) {
      const g = id(s, o[m.start], o[m.end], m.loop),
        _ = mb(a, i, g);
      for (const y of _)
        r.push({
          source: y,
          target: m,
          start: { [s]: Ip(h, g, 'start', Math.max) },
          end: { [s]: Ip(h, g, 'end', Math.min) }
        });
    }
  }
  return r;
}
function id(e, t, s, n) {
  if (n) return;
  let i = t[e],
    o = s[e];
  return (e === 'angle' && ((i = as(i)), (o = as(o))), { property: e, start: i, end: o });
}
function cP(e, t) {
  const { x: s = null, y: n = null } = e || {},
    i = t.points,
    o = [];
  return (
    t.segments.forEach(({ start: r, end: a }) => {
      a = ml(r, a, i);
      const l = i[r],
        c = i[a];
      n !== null
        ? (o.push({ x: l.x, y: n }), o.push({ x: c.x, y: n }))
        : s !== null && (o.push({ x: s, y: l.y }), o.push({ x: s, y: c.y }));
    }),
    o
  );
}
function ml(e, t, s) {
  for (; t > e; t--) {
    const n = s[t];
    if (!isNaN(n.x) && !isNaN(n.y)) break;
  }
  return t;
}
function Ip(e, t, s, n) {
  return e && t ? n(e[s], t[s]) : e ? e[s] : t ? t[s] : 0;
}
function Mb(e, t) {
  let s = [],
    n = !1;
  return (
    ve(e) ? ((n = !0), (s = e)) : (s = cP(e, t)),
    s.length ? new fn({ points: s, options: { tension: 0 }, _loop: n, _fullLoop: n }) : null
  );
}
function Lp(e) {
  return e && e.fill !== !1;
}
function dP(e, t, s) {
  let i = e[t].fill;
  const o = [t];
  let r;
  if (!s) return i;
  for (; i !== !1 && o.indexOf(i) === -1; ) {
    if (!Ue(i)) return i;
    if (((r = e[i]), !r)) return !1;
    if (r.visible) return i;
    (o.push(i), (i = r.fill));
  }
  return !1;
}
function uP(e, t, s) {
  const n = mP(e);
  if ($t(n)) return isNaN(n.value) ? !1 : n;
  let i = parseFloat(n);
  return Ue(i) && Math.floor(i) === i
    ? hP(n[0], t, i, s)
    : ['origin', 'start', 'end', 'stack', 'shape'].indexOf(n) >= 0 && n;
}
function hP(e, t, s, n) {
  return ((e === '-' || e === '+') && (s = t + s), s === t || s < 0 || s >= n ? !1 : s);
}
function fP(e, t) {
  let s = null;
  return (
    e === 'start'
      ? (s = t.bottom)
      : e === 'end'
        ? (s = t.top)
        : $t(e)
          ? (s = t.getPixelForValue(e.value))
          : t.getBasePixel && (s = t.getBasePixel()),
    s
  );
}
function pP(e, t, s) {
  let n;
  return (
    e === 'start'
      ? (n = s)
      : e === 'end'
        ? (n = t.options.reverse ? t.min : t.max)
        : $t(e)
          ? (n = e.value)
          : (n = t.getBaseValue()),
    n
  );
}
function mP(e) {
  const t = e.options,
    s = t.fill;
  let n = Mt(s && s.target, s);
  return (
    n === void 0 && (n = !!t.backgroundColor),
    n === !1 || n === null ? !1 : n === !0 ? 'origin' : n
  );
}
function gP(e) {
  const { scale: t, index: s, line: n } = e,
    i = [],
    o = n.segments,
    r = n.points,
    a = bP(t, s);
  a.push(Mb({ x: null, y: t.bottom }, n));
  for (let l = 0; l < o.length; l++) {
    const c = o[l];
    for (let h = c.start; h <= c.end; h++) _P(i, r[h], a);
  }
  return new fn({ points: i, options: {} });
}
function bP(e, t) {
  const s = [],
    n = e.getMatchingVisibleMetas('line');
  for (let i = 0; i < n.length; i++) {
    const o = n[i];
    if (o.index === t) break;
    o.hidden || s.unshift(o.dataset);
  }
  return s;
}
function _P(e, t, s) {
  const n = [];
  for (let i = 0; i < s.length; i++) {
    const o = s[i],
      { first: r, last: a, point: l } = yP(o, t, 'x');
    if (!(!l || (r && a))) {
      if (r) n.unshift(l);
      else if ((e.push(l), !a)) break;
    }
  }
  e.push(...n);
}
function yP(e, t, s) {
  const n = e.interpolate(t, s);
  if (!n) return {};
  const i = n[s],
    o = e.segments,
    r = e.points;
  let a = !1,
    l = !1;
  for (let c = 0; c < o.length; c++) {
    const h = o[c],
      f = r[h.start][s],
      m = r[h.end][s];
    if (hn(i, f, m)) {
      ((a = i === f), (l = i === m));
      break;
    }
  }
  return { first: a, last: l, point: n };
}
class Ib {
  constructor(t) {
    ((this.x = t.x), (this.y = t.y), (this.radius = t.radius));
  }
  pathSegment(t, s, n) {
    const { x: i, y: o, radius: r } = this;
    return ((s = s || { start: 0, end: he }), t.arc(i, o, r, s.end, s.start, !0), !n.bounds);
  }
  interpolate(t) {
    const { x: s, y: n, radius: i } = this,
      o = t.angle;
    return { x: s + Math.cos(o) * i, y: n + Math.sin(o) * i, angle: o };
  }
}
function vP(e) {
  const { chart: t, fill: s, line: n } = e;
  if (Ue(s)) return xP(t, s);
  if (s === 'stack') return gP(e);
  if (s === 'shape') return !0;
  const i = wP(e);
  return i instanceof Ib ? i : Mb(i, n);
}
function xP(e, t) {
  const s = e.getDatasetMeta(t);
  return s && e.isDatasetVisible(t) ? s.dataset : null;
}
function wP(e) {
  return (e.scale || {}).getPointPositionForValue ? kP(e) : SP(e);
}
function SP(e) {
  const { scale: t = {}, fill: s } = e,
    n = fP(s, t);
  if (Ue(n)) {
    const i = t.isHorizontal();
    return { x: i ? n : null, y: i ? null : n };
  }
  return null;
}
function kP(e) {
  const { scale: t, fill: s } = e,
    n = t.options,
    i = t.getLabels().length,
    o = n.reverse ? t.max : t.min,
    r = pP(s, t, o),
    a = [];
  if (n.grid.circular) {
    const l = t.getPointPositionForValue(0, o);
    return new Ib({ x: l.x, y: l.y, radius: t.getDistanceFromCenterForValue(r) });
  }
  for (let l = 0; l < i; ++l) a.push(t.getPointPositionForValue(l, r));
  return a;
}
function Ac(e, t, s) {
  const n = vP(t),
    { chart: i, index: o, line: r, scale: a, axis: l } = t,
    c = r.options,
    h = c.fill,
    f = c.backgroundColor,
    { above: m = f, below: g = f } = h || {},
    _ = i.getDatasetMeta(o),
    y = bb(i, _);
  n &&
    r.points.length &&
    (ul(e, s),
    CP(e, { line: r, target: n, above: m, below: g, area: s, scale: a, axis: l, clip: y }),
    hl(e));
}
function CP(e, t) {
  const { line: s, target: n, above: i, below: o, area: r, scale: a, clip: l } = t,
    c = s._loop ? 'angle' : t.axis;
  e.save();
  let h = o;
  (o !== i &&
    (c === 'x'
      ? (Np(e, n, r.top),
        Pc(e, { line: s, target: n, color: i, scale: a, property: c, clip: l }),
        e.restore(),
        e.save(),
        Np(e, n, r.bottom))
      : c === 'y' &&
        ($p(e, n, r.left),
        Pc(e, { line: s, target: n, color: o, scale: a, property: c, clip: l }),
        e.restore(),
        e.save(),
        $p(e, n, r.right),
        (h = i))),
    Pc(e, { line: s, target: n, color: h, scale: a, property: c, clip: l }),
    e.restore());
}
function Np(e, t, s) {
  const { segments: n, points: i } = t;
  let o = !0,
    r = !1;
  e.beginPath();
  for (const a of n) {
    const { start: l, end: c } = a,
      h = i[l],
      f = i[ml(l, c, i)];
    (o ? (e.moveTo(h.x, h.y), (o = !1)) : (e.lineTo(h.x, s), e.lineTo(h.x, h.y)),
      (r = !!t.pathSegment(e, a, { move: r })),
      r ? e.closePath() : e.lineTo(f.x, s));
  }
  (e.lineTo(t.first().x, s), e.closePath(), e.clip());
}
function $p(e, t, s) {
  const { segments: n, points: i } = t;
  let o = !0,
    r = !1;
  e.beginPath();
  for (const a of n) {
    const { start: l, end: c } = a,
      h = i[l],
      f = i[ml(l, c, i)];
    (o ? (e.moveTo(h.x, h.y), (o = !1)) : (e.lineTo(s, h.y), e.lineTo(h.x, h.y)),
      (r = !!t.pathSegment(e, a, { move: r })),
      r ? e.closePath() : e.lineTo(s, f.y));
  }
  (e.lineTo(s, t.first().y), e.closePath(), e.clip());
}
function Pc(e, t) {
  const { line: s, target: n, property: i, color: o, scale: r, clip: a } = t,
    l = lP(s, n, i);
  for (const { source: c, target: h, start: f, end: m } of l) {
    const { style: { backgroundColor: g = o } = {} } = c,
      _ = n !== !0;
    (e.save(), (e.fillStyle = g), TP(e, r, a, _ && id(i, f, m)), e.beginPath());
    const y = !!s.pathSegment(e, c);
    let x;
    if (_) {
      y ? e.closePath() : Fp(e, n, m, i);
      const w = !!n.pathSegment(e, h, { move: y, reverse: !0 });
      ((x = y && w), x || Fp(e, n, f, i));
    }
    (e.closePath(), e.fill(x ? 'evenodd' : 'nonzero'), e.restore());
  }
}
function TP(e, t, s, n) {
  const i = t.chart.chartArea,
    { property: o, start: r, end: a } = n || {};
  if (o === 'x' || o === 'y') {
    let l, c, h, f;
    (o === 'x'
      ? ((l = r), (c = i.top), (h = a), (f = i.bottom))
      : ((l = i.left), (c = r), (h = i.right), (f = a)),
      e.beginPath(),
      s &&
        ((l = Math.max(l, s.left)),
        (h = Math.min(h, s.right)),
        (c = Math.max(c, s.top)),
        (f = Math.min(f, s.bottom))),
      e.rect(l, c, h - l, f - c),
      e.clip());
  }
}
function Fp(e, t, s, n) {
  const i = t.interpolate(s, n);
  i && e.lineTo(i.x, i.y);
}
var Lb = {
  id: 'filler',
  afterDatasetsUpdate(e, t, s) {
    const n = (e.data.datasets || []).length,
      i = [];
    let o, r, a, l;
    for (r = 0; r < n; ++r)
      ((o = e.getDatasetMeta(r)),
        (a = o.dataset),
        (l = null),
        a &&
          a.options &&
          a instanceof fn &&
          (l = {
            visible: e.isDatasetVisible(r),
            index: r,
            fill: uP(a, r, n),
            chart: e,
            axis: o.controller.options.indexAxis,
            scale: o.vScale,
            line: a
          }),
        (o.$filler = l),
        i.push(l));
    for (r = 0; r < n; ++r)
      ((l = i[r]), !(!l || l.fill === !1) && (l.fill = dP(i, r, s.propagate)));
  },
  beforeDraw(e, t, s) {
    const n = s.drawTime === 'beforeDraw',
      i = e.getSortedVisibleDatasetMetas(),
      o = e.chartArea;
    for (let r = i.length - 1; r >= 0; --r) {
      const a = i[r].$filler;
      a && (a.line.updateControlPoints(o, a.axis), n && a.fill && Ac(e.ctx, a, o));
    }
  },
  beforeDatasetsDraw(e, t, s) {
    if (s.drawTime !== 'beforeDatasetsDraw') return;
    const n = e.getSortedVisibleDatasetMetas();
    for (let i = n.length - 1; i >= 0; --i) {
      const o = n[i].$filler;
      Lp(o) && Ac(e.ctx, o, e.chartArea);
    }
  },
  beforeDatasetDraw(e, t, s) {
    const n = t.meta.$filler;
    !Lp(n) || s.drawTime !== 'beforeDatasetDraw' || Ac(e.ctx, n, e.chartArea);
  },
  defaults: { propagate: !0, drawTime: 'beforeDatasetDraw' }
};
const Bp = (e, t) => {
    let { boxHeight: s = t, boxWidth: n = t } = e;
    return (
      e.usePointStyle && ((s = Math.min(s, t)), (n = e.pointStyleWidth || Math.min(n, t))),
      { boxWidth: n, boxHeight: s, itemHeight: Math.max(t, s) }
    );
  },
  AP = (e, t) =>
    e !== null && t !== null && e.datasetIndex === t.datasetIndex && e.index === t.index;
class Up extends vn {
  constructor(t) {
    (super(),
      (this._added = !1),
      (this.legendHitBoxes = []),
      (this._hoveredItem = null),
      (this.doughnutMode = !1),
      (this.chart = t.chart),
      (this.options = t.options),
      (this.ctx = t.ctx),
      (this.legendItems = void 0),
      (this.columnSizes = void 0),
      (this.lineWidths = void 0),
      (this.maxHeight = void 0),
      (this.maxWidth = void 0),
      (this.top = void 0),
      (this.bottom = void 0),
      (this.left = void 0),
      (this.right = void 0),
      (this.height = void 0),
      (this.width = void 0),
      (this._margins = void 0),
      (this.position = void 0),
      (this.weight = void 0),
      (this.fullSize = void 0));
  }
  update(t, s, n) {
    ((this.maxWidth = t),
      (this.maxHeight = s),
      (this._margins = n),
      this.setDimensions(),
      this.buildLabels(),
      this.fit());
  }
  setDimensions() {
    this.isHorizontal()
      ? ((this.width = this.maxWidth), (this.left = this._margins.left), (this.right = this.width))
      : ((this.height = this.maxHeight),
        (this.top = this._margins.top),
        (this.bottom = this.height));
  }
  buildLabels() {
    const t = this.options.labels || {};
    let s = ce(t.generateLabels, [this.chart], this) || [];
    (t.filter && (s = s.filter((n) => t.filter(n, this.chart.data))),
      t.sort && (s = s.sort((n, i) => t.sort(n, i, this.chart.data))),
      this.options.reverse && s.reverse(),
      (this.legendItems = s));
  }
  fit() {
    const { options: t, ctx: s } = this;
    if (!t.display) {
      this.width = this.height = 0;
      return;
    }
    const n = t.labels,
      i = Fe(n.font),
      o = i.size,
      r = this._computeTitleHeight(),
      { boxWidth: a, itemHeight: l } = Bp(n, o);
    let c, h;
    ((s.font = i.string),
      this.isHorizontal()
        ? ((c = this.maxWidth), (h = this._fitRows(r, o, a, l) + 10))
        : ((h = this.maxHeight), (c = this._fitCols(r, i, a, l) + 10)),
      (this.width = Math.min(c, t.maxWidth || this.maxWidth)),
      (this.height = Math.min(h, t.maxHeight || this.maxHeight)));
  }
  _fitRows(t, s, n, i) {
    const {
        ctx: o,
        maxWidth: r,
        options: {
          labels: { padding: a }
        }
      } = this,
      l = (this.legendHitBoxes = []),
      c = (this.lineWidths = [0]),
      h = i + a;
    let f = t;
    ((o.textAlign = 'left'), (o.textBaseline = 'middle'));
    let m = -1,
      g = -h;
    return (
      this.legendItems.forEach((_, y) => {
        const x = n + s / 2 + o.measureText(_.text).width;
        ((y === 0 || c[c.length - 1] + x + 2 * a > r) &&
          ((f += h), (c[c.length - (y > 0 ? 0 : 1)] = 0), (g += h), m++),
          (l[y] = { left: 0, top: g, row: m, width: x, height: i }),
          (c[c.length - 1] += x + a));
      }),
      f
    );
  }
  _fitCols(t, s, n, i) {
    const {
        ctx: o,
        maxHeight: r,
        options: {
          labels: { padding: a }
        }
      } = this,
      l = (this.legendHitBoxes = []),
      c = (this.columnSizes = []),
      h = r - t;
    let f = a,
      m = 0,
      g = 0,
      _ = 0,
      y = 0;
    return (
      this.legendItems.forEach((x, w) => {
        const { itemWidth: C, itemHeight: T } = PP(n, s, o, x, i);
        (w > 0 &&
          g + T + 2 * a > h &&
          ((f += m + a), c.push({ width: m, height: g }), (_ += m + a), y++, (m = g = 0)),
          (l[w] = { left: _, top: g, col: y, width: C, height: T }),
          (m = Math.max(m, C)),
          (g += T + a));
      }),
      (f += m),
      c.push({ width: m, height: g }),
      f
    );
  }
  adjustHitBoxes() {
    if (!this.options.display) return;
    const t = this._computeTitleHeight(),
      {
        legendHitBoxes: s,
        options: {
          align: n,
          labels: { padding: i },
          rtl: o
        }
      } = this,
      r = zi(o, this.left, this.width);
    if (this.isHorizontal()) {
      let a = 0,
        l = Me(n, this.left + i, this.right - this.lineWidths[a]);
      for (const c of s)
        (a !== c.row && ((a = c.row), (l = Me(n, this.left + i, this.right - this.lineWidths[a]))),
          (c.top += this.top + t + i),
          (c.left = r.leftForLtr(r.x(l), c.width)),
          (l += c.width + i));
    } else {
      let a = 0,
        l = Me(n, this.top + t + i, this.bottom - this.columnSizes[a].height);
      for (const c of s)
        (c.col !== a &&
          ((a = c.col), (l = Me(n, this.top + t + i, this.bottom - this.columnSizes[a].height))),
          (c.top = l),
          (c.left += this.left + i),
          (c.left = r.leftForLtr(r.x(c.left), c.width)),
          (l += c.height + i));
    }
  }
  isHorizontal() {
    return this.options.position === 'top' || this.options.position === 'bottom';
  }
  draw() {
    if (this.options.display) {
      const t = this.ctx;
      (ul(t, this), this._draw(), hl(t));
    }
  }
  _draw() {
    const { options: t, columnSizes: s, lineWidths: n, ctx: i } = this,
      { align: o, labels: r } = t,
      a = ge.color,
      l = zi(t.rtl, this.left, this.width),
      c = Fe(r.font),
      { padding: h } = r,
      f = c.size,
      m = f / 2;
    let g;
    (this.drawTitle(),
      (i.textAlign = l.textAlign('left')),
      (i.textBaseline = 'middle'),
      (i.lineWidth = 0.5),
      (i.font = c.string));
    const { boxWidth: _, boxHeight: y, itemHeight: x } = Bp(r, f),
      w = function (H, $, X) {
        if (isNaN(_) || _ <= 0 || isNaN(y) || y < 0) return;
        i.save();
        const G = Mt(X.lineWidth, 1);
        if (
          ((i.fillStyle = Mt(X.fillStyle, a)),
          (i.lineCap = Mt(X.lineCap, 'butt')),
          (i.lineDashOffset = Mt(X.lineDashOffset, 0)),
          (i.lineJoin = Mt(X.lineJoin, 'miter')),
          (i.lineWidth = G),
          (i.strokeStyle = Mt(X.strokeStyle, a)),
          i.setLineDash(Mt(X.lineDash, [])),
          r.usePointStyle)
        ) {
          const et = {
              radius: (y * Math.SQRT2) / 2,
              pointStyle: X.pointStyle,
              rotation: X.rotation,
              borderWidth: G
            },
            ot = l.xPlus(H, _ / 2),
            Z = $ + m;
          ob(i, et, ot, Z, r.pointStyleWidth && _);
        } else {
          const et = $ + Math.max((f - y) / 2, 0),
            ot = l.leftForLtr(H, _),
            Z = Hi(X.borderRadius);
          (i.beginPath(),
            Object.values(Z).some((q) => q !== 0)
              ? Ia(i, { x: ot, y: et, w: _, h: y, radius: Z })
              : i.rect(ot, et, _, y),
            i.fill(),
            G !== 0 && i.stroke());
        }
        i.restore();
      },
      C = function (H, $, X) {
        ar(i, X.text, H, $ + x / 2, c, {
          strikethrough: X.hidden,
          textAlign: l.textAlign(X.textAlign)
        });
      },
      T = this.isHorizontal(),
      E = this._computeTitleHeight();
    (T
      ? (g = { x: Me(o, this.left + h, this.right - n[0]), y: this.top + h + E, line: 0 })
      : (g = { x: this.left + h, y: Me(o, this.top + E + h, this.bottom - s[0].height), line: 0 }),
      hb(this.ctx, t.textDirection));
    const M = x + h;
    (this.legendItems.forEach((H, $) => {
      ((i.strokeStyle = H.fontColor), (i.fillStyle = H.fontColor));
      const X = i.measureText(H.text).width,
        G = l.textAlign(H.textAlign || (H.textAlign = r.textAlign)),
        et = _ + m + X;
      let ot = g.x,
        Z = g.y;
      (l.setWidth(this.width),
        T
          ? $ > 0 &&
            ot + et + h > this.right &&
            ((Z = g.y += M), g.line++, (ot = g.x = Me(o, this.left + h, this.right - n[g.line])))
          : $ > 0 &&
            Z + M > this.bottom &&
            ((ot = g.x = ot + s[g.line].width + h),
            g.line++,
            (Z = g.y = Me(o, this.top + E + h, this.bottom - s[g.line].height))));
      const q = l.x(ot);
      if (
        (w(q, Z, H), (ot = oC(G, ot + _ + m, T ? ot + et : this.right, t.rtl)), C(l.x(ot), Z, H), T)
      )
        g.x += et + h;
      else if (typeof H.text != 'string') {
        const dt = c.lineHeight;
        g.y += Nb(H, dt) + h;
      } else g.y += M;
    }),
      fb(this.ctx, t.textDirection));
  }
  drawTitle() {
    const t = this.options,
      s = t.title,
      n = Fe(s.font),
      i = Cs(s.padding);
    if (!s.display) return;
    const o = zi(t.rtl, this.left, this.width),
      r = this.ctx,
      a = s.position,
      l = n.size / 2,
      c = i.top + l;
    let h,
      f = this.left,
      m = this.width;
    if (this.isHorizontal())
      ((m = Math.max(...this.lineWidths)),
        (h = this.top + c),
        (f = Me(t.align, f, this.right - m)));
    else {
      const _ = this.columnSizes.reduce((y, x) => Math.max(y, x.height), 0);
      h =
        c + Me(t.align, this.top, this.bottom - _ - t.labels.padding - this._computeTitleHeight());
    }
    const g = Me(a, f, f + m);
    ((r.textAlign = o.textAlign($d(a))),
      (r.textBaseline = 'middle'),
      (r.strokeStyle = s.color),
      (r.fillStyle = s.color),
      (r.font = n.string),
      ar(r, s.text, g, h, n));
  }
  _computeTitleHeight() {
    const t = this.options.title,
      s = Fe(t.font),
      n = Cs(t.padding);
    return t.display ? s.lineHeight + n.height : 0;
  }
  _getLegendItemAt(t, s) {
    let n, i, o;
    if (hn(t, this.left, this.right) && hn(s, this.top, this.bottom)) {
      for (o = this.legendHitBoxes, n = 0; n < o.length; ++n)
        if (((i = o[n]), hn(t, i.left, i.left + i.width) && hn(s, i.top, i.top + i.height)))
          return this.legendItems[n];
    }
    return null;
  }
  handleEvent(t) {
    const s = this.options;
    if (!RP(t.type, s)) return;
    const n = this._getLegendItemAt(t.x, t.y);
    if (t.type === 'mousemove' || t.type === 'mouseout') {
      const i = this._hoveredItem,
        o = AP(i, n);
      (i && !o && ce(s.onLeave, [t, i, this], this),
        (this._hoveredItem = n),
        n && !o && ce(s.onHover, [t, n, this], this));
    } else n && ce(s.onClick, [t, n, this], this);
  }
}
function PP(e, t, s, n, i) {
  const o = OP(n, e, t, s),
    r = EP(i, n, t.lineHeight);
  return { itemWidth: o, itemHeight: r };
}
function OP(e, t, s, n) {
  let i = e.text;
  return (
    i && typeof i != 'string' && (i = i.reduce((o, r) => (o.length > r.length ? o : r))),
    t + s.size / 2 + n.measureText(i).width
  );
}
function EP(e, t, s) {
  let n = e;
  return (typeof t.text != 'string' && (n = Nb(t, s)), n);
}
function Nb(e, t) {
  const s = e.text ? e.text.length : 0;
  return t * s;
}
function RP(e, t) {
  return !!(
    ((e === 'mousemove' || e === 'mouseout') && (t.onHover || t.onLeave)) ||
    (t.onClick && (e === 'click' || e === 'mouseup'))
  );
}
var $b = {
  id: 'legend',
  _element: Up,
  start(e, t, s) {
    const n = (e.legend = new Up({ ctx: e.ctx, options: s, chart: e }));
    (xs.configure(e, n, s), xs.addBox(e, n));
  },
  stop(e) {
    (xs.removeBox(e, e.legend), delete e.legend);
  },
  beforeUpdate(e, t, s) {
    const n = e.legend;
    (xs.configure(e, n, s), (n.options = s));
  },
  afterUpdate(e) {
    const t = e.legend;
    (t.buildLabels(), t.adjustHitBoxes());
  },
  afterEvent(e, t) {
    t.replay || e.legend.handleEvent(t.event);
  },
  defaults: {
    display: !0,
    position: 'top',
    align: 'center',
    fullSize: !0,
    reverse: !1,
    weight: 1e3,
    onClick(e, t, s) {
      const n = t.datasetIndex,
        i = s.chart;
      i.isDatasetVisible(n) ? (i.hide(n), (t.hidden = !0)) : (i.show(n), (t.hidden = !1));
    },
    onHover: null,
    onLeave: null,
    labels: {
      color: (e) => e.chart.options.color,
      boxWidth: 40,
      padding: 10,
      generateLabels(e) {
        const t = e.data.datasets,
          {
            labels: {
              usePointStyle: s,
              pointStyle: n,
              textAlign: i,
              color: o,
              useBorderRadius: r,
              borderRadius: a
            }
          } = e.legend.options;
        return e._getSortedDatasetMetas().map((l) => {
          const c = l.controller.getStyle(s ? 0 : void 0),
            h = Cs(c.borderWidth);
          return {
            text: t[l.index].label,
            fillStyle: c.backgroundColor,
            fontColor: o,
            hidden: !l.visible,
            lineCap: c.borderCapStyle,
            lineDash: c.borderDash,
            lineDashOffset: c.borderDashOffset,
            lineJoin: c.borderJoinStyle,
            lineWidth: (h.width + h.height) / 4,
            strokeStyle: c.borderColor,
            pointStyle: n || c.pointStyle,
            rotation: c.rotation,
            textAlign: i || c.textAlign,
            borderRadius: r && (a || c.borderRadius),
            datasetIndex: l.index
          };
        }, this);
      }
    },
    title: { color: (e) => e.chart.options.color, display: !1, position: 'center', text: '' }
  },
  descriptors: {
    _scriptable: (e) => !e.startsWith('on'),
    labels: { _scriptable: (e) => !['generateLabels', 'filter', 'sort'].includes(e) }
  }
};
class Fb extends vn {
  constructor(t) {
    (super(),
      (this.chart = t.chart),
      (this.options = t.options),
      (this.ctx = t.ctx),
      (this._padding = void 0),
      (this.top = void 0),
      (this.bottom = void 0),
      (this.left = void 0),
      (this.right = void 0),
      (this.width = void 0),
      (this.height = void 0),
      (this.position = void 0),
      (this.weight = void 0),
      (this.fullSize = void 0));
  }
  update(t, s) {
    const n = this.options;
    if (((this.left = 0), (this.top = 0), !n.display)) {
      this.width = this.height = this.right = this.bottom = 0;
      return;
    }
    ((this.width = this.right = t), (this.height = this.bottom = s));
    const i = ve(n.text) ? n.text.length : 1;
    this._padding = Cs(n.padding);
    const o = i * Fe(n.font).lineHeight + this._padding.height;
    this.isHorizontal() ? (this.height = o) : (this.width = o);
  }
  isHorizontal() {
    const t = this.options.position;
    return t === 'top' || t === 'bottom';
  }
  _drawArgs(t) {
    const { top: s, left: n, bottom: i, right: o, options: r } = this,
      a = r.align;
    let l = 0,
      c,
      h,
      f;
    return (
      this.isHorizontal()
        ? ((h = Me(a, n, o)), (f = s + t), (c = o - n))
        : (r.position === 'left'
            ? ((h = n + t), (f = Me(a, i, s)), (l = Qt * -0.5))
            : ((h = o - t), (f = Me(a, s, i)), (l = Qt * 0.5)),
          (c = i - s)),
      { titleX: h, titleY: f, maxWidth: c, rotation: l }
    );
  }
  draw() {
    const t = this.ctx,
      s = this.options;
    if (!s.display) return;
    const n = Fe(s.font),
      o = n.lineHeight / 2 + this._padding.top,
      { titleX: r, titleY: a, maxWidth: l, rotation: c } = this._drawArgs(o);
    ar(t, s.text, 0, 0, n, {
      color: s.color,
      maxWidth: l,
      rotation: c,
      textAlign: $d(s.align),
      textBaseline: 'middle',
      translation: [r, a]
    });
  }
}
function DP(e, t) {
  const s = new Fb({ ctx: e.ctx, options: t, chart: e });
  (xs.configure(e, s, t), xs.addBox(e, s), (e.titleBlock = s));
}
var Bb = {
  id: 'title',
  _element: Fb,
  start(e, t, s) {
    DP(e, s);
  },
  stop(e) {
    const t = e.titleBlock;
    (xs.removeBox(e, t), delete e.titleBlock);
  },
  beforeUpdate(e, t, s) {
    const n = e.titleBlock;
    (xs.configure(e, n, s), (n.options = s));
  },
  defaults: {
    align: 'center',
    display: !1,
    font: { weight: 'bold' },
    fullSize: !0,
    padding: 10,
    position: 'top',
    text: '',
    weight: 2e3
  },
  defaultRoutes: { color: 'color' },
  descriptors: { _scriptable: !0, _indexable: !1 }
};
const Po = {
  average(e) {
    if (!e.length) return !1;
    let t,
      s,
      n = new Set(),
      i = 0,
      o = 0;
    for (t = 0, s = e.length; t < s; ++t) {
      const a = e[t].element;
      if (a && a.hasValue()) {
        const l = a.tooltipPosition();
        (n.add(l.x), (i += l.y), ++o);
      }
    }
    return o === 0 || n.size === 0 ? !1 : { x: [...n].reduce((a, l) => a + l) / n.size, y: i / o };
  },
  nearest(e, t) {
    if (!e.length) return !1;
    let s = t.x,
      n = t.y,
      i = Number.POSITIVE_INFINITY,
      o,
      r,
      a;
    for (o = 0, r = e.length; o < r; ++o) {
      const l = e[o].element;
      if (l && l.hasValue()) {
        const c = l.getCenterPoint(),
          h = Zc(t, c);
        h < i && ((i = h), (a = l));
      }
    }
    if (a) {
      const l = a.tooltipPosition();
      ((s = l.x), (n = l.y));
    }
    return { x: s, y: n };
  }
};
function js(e, t) {
  return (t && (ve(t) ? Array.prototype.push.apply(e, t) : e.push(t)), e);
}
function nn(e) {
  return (typeof e == 'string' || e instanceof String) &&
    e.indexOf(`
`) > -1
    ? e.split(`
`)
    : e;
}
function MP(e, t) {
  const { element: s, datasetIndex: n, index: i } = t,
    o = e.getDatasetMeta(n).controller,
    { label: r, value: a } = o.getLabelAndValue(i);
  return {
    chart: e,
    label: r,
    parsed: o.getParsed(i),
    raw: e.data.datasets[n].data[i],
    formattedValue: a,
    dataset: o.getDataset(),
    dataIndex: i,
    datasetIndex: n,
    element: s
  };
}
function jp(e, t) {
  const s = e.chart.ctx,
    { body: n, footer: i, title: o } = e,
    { boxWidth: r, boxHeight: a } = t,
    l = Fe(t.bodyFont),
    c = Fe(t.titleFont),
    h = Fe(t.footerFont),
    f = o.length,
    m = i.length,
    g = n.length,
    _ = Cs(t.padding);
  let y = _.height,
    x = 0,
    w = n.reduce((E, M) => E + M.before.length + M.lines.length + M.after.length, 0);
  if (
    ((w += e.beforeBody.length + e.afterBody.length),
    f && (y += f * c.lineHeight + (f - 1) * t.titleSpacing + t.titleMarginBottom),
    w)
  ) {
    const E = t.displayColors ? Math.max(a, l.lineHeight) : l.lineHeight;
    y += g * E + (w - g) * l.lineHeight + (w - 1) * t.bodySpacing;
  }
  m && (y += t.footerMarginTop + m * h.lineHeight + (m - 1) * t.footerSpacing);
  let C = 0;
  const T = function (E) {
    x = Math.max(x, s.measureText(E).width + C);
  };
  return (
    s.save(),
    (s.font = c.string),
    Zt(e.title, T),
    (s.font = l.string),
    Zt(e.beforeBody.concat(e.afterBody), T),
    (C = t.displayColors ? r + 2 + t.boxPadding : 0),
    Zt(n, (E) => {
      (Zt(E.before, T), Zt(E.lines, T), Zt(E.after, T));
    }),
    (C = 0),
    (s.font = h.string),
    Zt(e.footer, T),
    s.restore(),
    (x += _.width),
    { width: x, height: y }
  );
}
function IP(e, t) {
  const { y: s, height: n } = t;
  return s < n / 2 ? 'top' : s > e.height - n / 2 ? 'bottom' : 'center';
}
function LP(e, t, s, n) {
  const { x: i, width: o } = n,
    r = s.caretSize + s.caretPadding;
  if ((e === 'left' && i + o + r > t.width) || (e === 'right' && i - o - r < 0)) return !0;
}
function NP(e, t, s, n) {
  const { x: i, width: o } = s,
    {
      width: r,
      chartArea: { left: a, right: l }
    } = e;
  let c = 'center';
  return (
    n === 'center'
      ? (c = i <= (a + l) / 2 ? 'left' : 'right')
      : i <= o / 2
        ? (c = 'left')
        : i >= r - o / 2 && (c = 'right'),
    LP(c, e, t, s) && (c = 'center'),
    c
  );
}
function Vp(e, t, s) {
  const n = s.yAlign || t.yAlign || IP(e, s);
  return { xAlign: s.xAlign || t.xAlign || NP(e, t, s, n), yAlign: n };
}
function $P(e, t) {
  let { x: s, width: n } = e;
  return (t === 'right' ? (s -= n) : t === 'center' && (s -= n / 2), s);
}
function FP(e, t, s) {
  let { y: n, height: i } = e;
  return (t === 'top' ? (n += s) : t === 'bottom' ? (n -= i + s) : (n -= i / 2), n);
}
function Hp(e, t, s, n) {
  const { caretSize: i, caretPadding: o, cornerRadius: r } = e,
    { xAlign: a, yAlign: l } = s,
    c = i + o,
    { topLeft: h, topRight: f, bottomLeft: m, bottomRight: g } = Hi(r);
  let _ = $P(t, a);
  const y = FP(t, l, c);
  return (
    l === 'center'
      ? a === 'left'
        ? (_ += c)
        : a === 'right' && (_ -= c)
      : a === 'left'
        ? (_ -= Math.max(h, m) + i)
        : a === 'right' && (_ += Math.max(f, g) + i),
    { x: $e(_, 0, n.width - t.width), y: $e(y, 0, n.height - t.height) }
  );
}
function oa(e, t, s) {
  const n = Cs(s.padding);
  return t === 'center'
    ? e.x + e.width / 2
    : t === 'right'
      ? e.x + e.width - n.right
      : e.x + n.left;
}
function zp(e) {
  return js([], nn(e));
}
function BP(e, t, s) {
  return _i(e, { tooltip: t, tooltipItems: s, type: 'tooltip' });
}
function Wp(e, t) {
  const s = t && t.dataset && t.dataset.tooltip && t.dataset.tooltip.callbacks;
  return s ? e.override(s) : e;
}
const Ub = {
  beforeTitle: en,
  title(e) {
    if (e.length > 0) {
      const t = e[0],
        s = t.chart.data.labels,
        n = s ? s.length : 0;
      if (this && this.options && this.options.mode === 'dataset') return t.dataset.label || '';
      if (t.label) return t.label;
      if (n > 0 && t.dataIndex < n) return s[t.dataIndex];
    }
    return '';
  },
  afterTitle: en,
  beforeBody: en,
  beforeLabel: en,
  label(e) {
    if (this && this.options && this.options.mode === 'dataset')
      return e.label + ': ' + e.formattedValue || e.formattedValue;
    let t = e.dataset.label || '';
    t && (t += ': ');
    const s = e.formattedValue;
    return (Gt(s) || (t += s), t);
  },
  labelColor(e) {
    const s = e.chart.getDatasetMeta(e.datasetIndex).controller.getStyle(e.dataIndex);
    return {
      borderColor: s.borderColor,
      backgroundColor: s.backgroundColor,
      borderWidth: s.borderWidth,
      borderDash: s.borderDash,
      borderDashOffset: s.borderDashOffset,
      borderRadius: 0
    };
  },
  labelTextColor() {
    return this.options.bodyColor;
  },
  labelPointStyle(e) {
    const s = e.chart.getDatasetMeta(e.datasetIndex).controller.getStyle(e.dataIndex);
    return { pointStyle: s.pointStyle, rotation: s.rotation };
  },
  afterLabel: en,
  afterBody: en,
  beforeFooter: en,
  footer: en,
  afterFooter: en
};
function Ge(e, t, s, n) {
  const i = e[t].call(s, n);
  return typeof i > 'u' ? Ub[t].call(s, n) : i;
}
class od extends vn {
  constructor(t) {
    (super(),
      (this.opacity = 0),
      (this._active = []),
      (this._eventPosition = void 0),
      (this._size = void 0),
      (this._cachedAnimations = void 0),
      (this._tooltipItems = []),
      (this.$animations = void 0),
      (this.$context = void 0),
      (this.chart = t.chart),
      (this.options = t.options),
      (this.dataPoints = void 0),
      (this.title = void 0),
      (this.beforeBody = void 0),
      (this.body = void 0),
      (this.afterBody = void 0),
      (this.footer = void 0),
      (this.xAlign = void 0),
      (this.yAlign = void 0),
      (this.x = void 0),
      (this.y = void 0),
      (this.height = void 0),
      (this.width = void 0),
      (this.caretX = void 0),
      (this.caretY = void 0),
      (this.labelColors = void 0),
      (this.labelPointStyles = void 0),
      (this.labelTextColors = void 0));
  }
  initialize(t) {
    ((this.options = t), (this._cachedAnimations = void 0), (this.$context = void 0));
  }
  _resolveAnimations() {
    const t = this._cachedAnimations;
    if (t) return t;
    const s = this.chart,
      n = this.options.setContext(this.getContext()),
      i = n.enabled && s.options.animation && n.animations,
      o = new _b(this.chart, i);
    return (i._cacheable && (this._cachedAnimations = Object.freeze(o)), o);
  }
  getContext() {
    return this.$context || (this.$context = BP(this.chart.getContext(), this, this._tooltipItems));
  }
  getTitle(t, s) {
    const { callbacks: n } = s,
      i = Ge(n, 'beforeTitle', this, t),
      o = Ge(n, 'title', this, t),
      r = Ge(n, 'afterTitle', this, t);
    let a = [];
    return ((a = js(a, nn(i))), (a = js(a, nn(o))), (a = js(a, nn(r))), a);
  }
  getBeforeBody(t, s) {
    return zp(Ge(s.callbacks, 'beforeBody', this, t));
  }
  getBody(t, s) {
    const { callbacks: n } = s,
      i = [];
    return (
      Zt(t, (o) => {
        const r = { before: [], lines: [], after: [] },
          a = Wp(n, o);
        (js(r.before, nn(Ge(a, 'beforeLabel', this, o))),
          js(r.lines, Ge(a, 'label', this, o)),
          js(r.after, nn(Ge(a, 'afterLabel', this, o))),
          i.push(r));
      }),
      i
    );
  }
  getAfterBody(t, s) {
    return zp(Ge(s.callbacks, 'afterBody', this, t));
  }
  getFooter(t, s) {
    const { callbacks: n } = s,
      i = Ge(n, 'beforeFooter', this, t),
      o = Ge(n, 'footer', this, t),
      r = Ge(n, 'afterFooter', this, t);
    let a = [];
    return ((a = js(a, nn(i))), (a = js(a, nn(o))), (a = js(a, nn(r))), a);
  }
  _createItems(t) {
    const s = this._active,
      n = this.chart.data,
      i = [],
      o = [],
      r = [];
    let a = [],
      l,
      c;
    for (l = 0, c = s.length; l < c; ++l) a.push(MP(this.chart, s[l]));
    return (
      t.filter && (a = a.filter((h, f, m) => t.filter(h, f, m, n))),
      t.itemSort && (a = a.sort((h, f) => t.itemSort(h, f, n))),
      Zt(a, (h) => {
        const f = Wp(t.callbacks, h);
        (i.push(Ge(f, 'labelColor', this, h)),
          o.push(Ge(f, 'labelPointStyle', this, h)),
          r.push(Ge(f, 'labelTextColor', this, h)));
      }),
      (this.labelColors = i),
      (this.labelPointStyles = o),
      (this.labelTextColors = r),
      (this.dataPoints = a),
      a
    );
  }
  update(t, s) {
    const n = this.options.setContext(this.getContext()),
      i = this._active;
    let o,
      r = [];
    if (!i.length) this.opacity !== 0 && (o = { opacity: 0 });
    else {
      const a = Po[n.position].call(this, i, this._eventPosition);
      ((r = this._createItems(n)),
        (this.title = this.getTitle(r, n)),
        (this.beforeBody = this.getBeforeBody(r, n)),
        (this.body = this.getBody(r, n)),
        (this.afterBody = this.getAfterBody(r, n)),
        (this.footer = this.getFooter(r, n)));
      const l = (this._size = jp(this, n)),
        c = Object.assign({}, a, l),
        h = Vp(this.chart, n, c),
        f = Hp(n, c, h, this.chart);
      ((this.xAlign = h.xAlign),
        (this.yAlign = h.yAlign),
        (o = {
          opacity: 1,
          x: f.x,
          y: f.y,
          width: l.width,
          height: l.height,
          caretX: a.x,
          caretY: a.y
        }));
    }
    ((this._tooltipItems = r),
      (this.$context = void 0),
      o && this._resolveAnimations().update(this, o),
      t && n.external && n.external.call(this, { chart: this.chart, tooltip: this, replay: s }));
  }
  drawCaret(t, s, n, i) {
    const o = this.getCaretPosition(t, n, i);
    (s.lineTo(o.x1, o.y1), s.lineTo(o.x2, o.y2), s.lineTo(o.x3, o.y3));
  }
  getCaretPosition(t, s, n) {
    const { xAlign: i, yAlign: o } = this,
      { caretSize: r, cornerRadius: a } = n,
      { topLeft: l, topRight: c, bottomLeft: h, bottomRight: f } = Hi(a),
      { x: m, y: g } = t,
      { width: _, height: y } = s;
    let x, w, C, T, E, M;
    return (
      o === 'center'
        ? ((E = g + y / 2),
          i === 'left'
            ? ((x = m), (w = x - r), (T = E + r), (M = E - r))
            : ((x = m + _), (w = x + r), (T = E - r), (M = E + r)),
          (C = x))
        : (i === 'left'
            ? (w = m + Math.max(l, h) + r)
            : i === 'right'
              ? (w = m + _ - Math.max(c, f) - r)
              : (w = this.caretX),
          o === 'top'
            ? ((T = g), (E = T - r), (x = w - r), (C = w + r))
            : ((T = g + y), (E = T + r), (x = w + r), (C = w - r)),
          (M = T)),
      { x1: x, x2: w, x3: C, y1: T, y2: E, y3: M }
    );
  }
  drawTitle(t, s, n) {
    const i = this.title,
      o = i.length;
    let r, a, l;
    if (o) {
      const c = zi(n.rtl, this.x, this.width);
      for (
        t.x = oa(this, n.titleAlign, n),
          s.textAlign = c.textAlign(n.titleAlign),
          s.textBaseline = 'middle',
          r = Fe(n.titleFont),
          a = n.titleSpacing,
          s.fillStyle = n.titleColor,
          s.font = r.string,
          l = 0;
        l < o;
        ++l
      )
        (s.fillText(i[l], c.x(t.x), t.y + r.lineHeight / 2),
          (t.y += r.lineHeight + a),
          l + 1 === o && (t.y += n.titleMarginBottom - a));
    }
  }
  _drawColorBox(t, s, n, i, o) {
    const r = this.labelColors[n],
      a = this.labelPointStyles[n],
      { boxHeight: l, boxWidth: c } = o,
      h = Fe(o.bodyFont),
      f = oa(this, 'left', o),
      m = i.x(f),
      g = l < h.lineHeight ? (h.lineHeight - l) / 2 : 0,
      _ = s.y + g;
    if (o.usePointStyle) {
      const y = {
          radius: Math.min(c, l) / 2,
          pointStyle: a.pointStyle,
          rotation: a.rotation,
          borderWidth: 1
        },
        x = i.leftForLtr(m, c) + c / 2,
        w = _ + l / 2;
      ((t.strokeStyle = o.multiKeyBackground),
        (t.fillStyle = o.multiKeyBackground),
        td(t, y, x, w),
        (t.strokeStyle = r.borderColor),
        (t.fillStyle = r.backgroundColor),
        td(t, y, x, w));
    } else {
      ((t.lineWidth = $t(r.borderWidth)
        ? Math.max(...Object.values(r.borderWidth))
        : r.borderWidth || 1),
        (t.strokeStyle = r.borderColor),
        t.setLineDash(r.borderDash || []),
        (t.lineDashOffset = r.borderDashOffset || 0));
      const y = i.leftForLtr(m, c),
        x = i.leftForLtr(i.xPlus(m, 1), c - 2),
        w = Hi(r.borderRadius);
      Object.values(w).some((C) => C !== 0)
        ? (t.beginPath(),
          (t.fillStyle = o.multiKeyBackground),
          Ia(t, { x: y, y: _, w: c, h: l, radius: w }),
          t.fill(),
          t.stroke(),
          (t.fillStyle = r.backgroundColor),
          t.beginPath(),
          Ia(t, { x, y: _ + 1, w: c - 2, h: l - 2, radius: w }),
          t.fill())
        : ((t.fillStyle = o.multiKeyBackground),
          t.fillRect(y, _, c, l),
          t.strokeRect(y, _, c, l),
          (t.fillStyle = r.backgroundColor),
          t.fillRect(x, _ + 1, c - 2, l - 2));
    }
    t.fillStyle = this.labelTextColors[n];
  }
  drawBody(t, s, n) {
    const { body: i } = this,
      {
        bodySpacing: o,
        bodyAlign: r,
        displayColors: a,
        boxHeight: l,
        boxWidth: c,
        boxPadding: h
      } = n,
      f = Fe(n.bodyFont);
    let m = f.lineHeight,
      g = 0;
    const _ = zi(n.rtl, this.x, this.width),
      y = function (X) {
        (s.fillText(X, _.x(t.x + g), t.y + m / 2), (t.y += m + o));
      },
      x = _.textAlign(r);
    let w, C, T, E, M, H, $;
    for (
      s.textAlign = r,
        s.textBaseline = 'middle',
        s.font = f.string,
        t.x = oa(this, x, n),
        s.fillStyle = n.bodyColor,
        Zt(this.beforeBody, y),
        g = a && x !== 'right' ? (r === 'center' ? c / 2 + h : c + 2 + h) : 0,
        E = 0,
        H = i.length;
      E < H;
      ++E
    ) {
      for (
        w = i[E],
          C = this.labelTextColors[E],
          s.fillStyle = C,
          Zt(w.before, y),
          T = w.lines,
          a && T.length && (this._drawColorBox(s, t, E, _, n), (m = Math.max(f.lineHeight, l))),
          M = 0,
          $ = T.length;
        M < $;
        ++M
      )
        (y(T[M]), (m = f.lineHeight));
      Zt(w.after, y);
    }
    ((g = 0), (m = f.lineHeight), Zt(this.afterBody, y), (t.y -= o));
  }
  drawFooter(t, s, n) {
    const i = this.footer,
      o = i.length;
    let r, a;
    if (o) {
      const l = zi(n.rtl, this.x, this.width);
      for (
        t.x = oa(this, n.footerAlign, n),
          t.y += n.footerMarginTop,
          s.textAlign = l.textAlign(n.footerAlign),
          s.textBaseline = 'middle',
          r = Fe(n.footerFont),
          s.fillStyle = n.footerColor,
          s.font = r.string,
          a = 0;
        a < o;
        ++a
      )
        (s.fillText(i[a], l.x(t.x), t.y + r.lineHeight / 2),
          (t.y += r.lineHeight + n.footerSpacing));
    }
  }
  drawBackground(t, s, n, i) {
    const { xAlign: o, yAlign: r } = this,
      { x: a, y: l } = t,
      { width: c, height: h } = n,
      { topLeft: f, topRight: m, bottomLeft: g, bottomRight: _ } = Hi(i.cornerRadius);
    ((s.fillStyle = i.backgroundColor),
      (s.strokeStyle = i.borderColor),
      (s.lineWidth = i.borderWidth),
      s.beginPath(),
      s.moveTo(a + f, l),
      r === 'top' && this.drawCaret(t, s, n, i),
      s.lineTo(a + c - m, l),
      s.quadraticCurveTo(a + c, l, a + c, l + m),
      r === 'center' && o === 'right' && this.drawCaret(t, s, n, i),
      s.lineTo(a + c, l + h - _),
      s.quadraticCurveTo(a + c, l + h, a + c - _, l + h),
      r === 'bottom' && this.drawCaret(t, s, n, i),
      s.lineTo(a + g, l + h),
      s.quadraticCurveTo(a, l + h, a, l + h - g),
      r === 'center' && o === 'left' && this.drawCaret(t, s, n, i),
      s.lineTo(a, l + f),
      s.quadraticCurveTo(a, l, a + f, l),
      s.closePath(),
      s.fill(),
      i.borderWidth > 0 && s.stroke());
  }
  _updateAnimationTarget(t) {
    const s = this.chart,
      n = this.$animations,
      i = n && n.x,
      o = n && n.y;
    if (i || o) {
      const r = Po[t.position].call(this, this._active, this._eventPosition);
      if (!r) return;
      const a = (this._size = jp(this, t)),
        l = Object.assign({}, r, this._size),
        c = Vp(s, t, l),
        h = Hp(t, l, c, s);
      (i._to !== h.x || o._to !== h.y) &&
        ((this.xAlign = c.xAlign),
        (this.yAlign = c.yAlign),
        (this.width = a.width),
        (this.height = a.height),
        (this.caretX = r.x),
        (this.caretY = r.y),
        this._resolveAnimations().update(this, h));
    }
  }
  _willRender() {
    return !!this.opacity;
  }
  draw(t) {
    const s = this.options.setContext(this.getContext());
    let n = this.opacity;
    if (!n) return;
    this._updateAnimationTarget(s);
    const i = { width: this.width, height: this.height },
      o = { x: this.x, y: this.y };
    n = Math.abs(n) < 0.001 ? 0 : n;
    const r = Cs(s.padding),
      a =
        this.title.length ||
        this.beforeBody.length ||
        this.body.length ||
        this.afterBody.length ||
        this.footer.length;
    s.enabled &&
      a &&
      (t.save(),
      (t.globalAlpha = n),
      this.drawBackground(o, t, i, s),
      hb(t, s.textDirection),
      (o.y += r.top),
      this.drawTitle(o, t, s),
      this.drawBody(o, t, s),
      this.drawFooter(o, t, s),
      fb(t, s.textDirection),
      t.restore());
  }
  getActiveElements() {
    return this._active || [];
  }
  setActiveElements(t, s) {
    const n = this._active,
      i = t.map(({ datasetIndex: a, index: l }) => {
        const c = this.chart.getDatasetMeta(a);
        if (!c) throw new Error('Cannot find a dataset at index ' + a);
        return { datasetIndex: a, element: c.data[l], index: l };
      }),
      o = !Ra(n, i),
      r = this._positionChanged(i, s);
    (o || r) &&
      ((this._active = i),
      (this._eventPosition = s),
      (this._ignoreReplayEvents = !0),
      this.update(!0));
  }
  handleEvent(t, s, n = !0) {
    if (s && this._ignoreReplayEvents) return !1;
    this._ignoreReplayEvents = !1;
    const i = this.options,
      o = this._active || [],
      r = this._getActiveElements(t, o, s, n),
      a = this._positionChanged(r, t),
      l = s || !Ra(r, o) || a;
    return (
      l &&
        ((this._active = r),
        (i.enabled || i.external) &&
          ((this._eventPosition = { x: t.x, y: t.y }), this.update(!0, s))),
      l
    );
  }
  _getActiveElements(t, s, n, i) {
    const o = this.options;
    if (t.type === 'mouseout') return [];
    if (!i)
      return s.filter(
        (a) =>
          this.chart.data.datasets[a.datasetIndex] &&
          this.chart.getDatasetMeta(a.datasetIndex).controller.getParsed(a.index) !== void 0
      );
    const r = this.chart.getElementsAtEventForMode(t, o.mode, o, n);
    return (o.reverse && r.reverse(), r);
  }
  _positionChanged(t, s) {
    const { caretX: n, caretY: i, options: o } = this,
      r = Po[o.position].call(this, t, s);
    return r !== !1 && (n !== r.x || i !== r.y);
  }
}
ct(od, 'positioners', Po);
var jb = {
  id: 'tooltip',
  _element: od,
  positioners: Po,
  afterInit(e, t, s) {
    s && (e.tooltip = new od({ chart: e, options: s }));
  },
  beforeUpdate(e, t, s) {
    e.tooltip && e.tooltip.initialize(s);
  },
  reset(e, t, s) {
    e.tooltip && e.tooltip.initialize(s);
  },
  afterDraw(e) {
    const t = e.tooltip;
    if (t && t._willRender()) {
      const s = { tooltip: t };
      if (e.notifyPlugins('beforeTooltipDraw', { ...s, cancelable: !0 }) === !1) return;
      (t.draw(e.ctx), e.notifyPlugins('afterTooltipDraw', s));
    }
  },
  afterEvent(e, t) {
    if (e.tooltip) {
      const s = t.replay;
      e.tooltip.handleEvent(t.event, s, t.inChartArea) && (t.changed = !0);
    }
  },
  defaults: {
    enabled: !0,
    external: null,
    position: 'average',
    backgroundColor: 'rgba(0,0,0,0.8)',
    titleColor: '#fff',
    titleFont: { weight: 'bold' },
    titleSpacing: 2,
    titleMarginBottom: 6,
    titleAlign: 'left',
    bodyColor: '#fff',
    bodySpacing: 2,
    bodyFont: {},
    bodyAlign: 'left',
    footerColor: '#fff',
    footerSpacing: 2,
    footerMarginTop: 6,
    footerFont: { weight: 'bold' },
    footerAlign: 'left',
    padding: 6,
    caretPadding: 2,
    caretSize: 5,
    cornerRadius: 6,
    boxHeight: (e, t) => t.bodyFont.size,
    boxWidth: (e, t) => t.bodyFont.size,
    multiKeyBackground: '#fff',
    displayColors: !0,
    boxPadding: 0,
    borderColor: 'rgba(0,0,0,0)',
    borderWidth: 0,
    animation: { duration: 400, easing: 'easeOutQuart' },
    animations: {
      numbers: { type: 'number', properties: ['x', 'y', 'width', 'height', 'caretX', 'caretY'] },
      opacity: { easing: 'linear', duration: 200 }
    },
    callbacks: Ub
  },
  defaultRoutes: { bodyFont: 'font', footerFont: 'font', titleFont: 'font' },
  descriptors: {
    _scriptable: (e) => e !== 'filter' && e !== 'itemSort' && e !== 'external',
    _indexable: !1,
    callbacks: { _scriptable: !1, _indexable: !1 },
    animation: { _fallback: !1 },
    animations: { _fallback: 'animation' }
  },
  additionalOptionScopes: ['interaction']
};
const UP = (e, t, s, n) => (
  typeof t == 'string'
    ? ((s = e.push(t) - 1), n.unshift({ index: s, label: t }))
    : isNaN(t) && (s = null),
  s
);
function jP(e, t, s, n) {
  const i = e.indexOf(t);
  if (i === -1) return UP(e, t, s, n);
  const o = e.lastIndexOf(t);
  return i !== o ? s : i;
}
const VP = (e, t) => (e === null ? null : $e(Math.round(e), 0, t));
function Kp(e) {
  const t = this.getLabels();
  return e >= 0 && e < t.length ? t[e] : e;
}
class Fa extends so {
  constructor(t) {
    (super(t), (this._startValue = void 0), (this._valueRange = 0), (this._addedLabels = []));
  }
  init(t) {
    const s = this._addedLabels;
    if (s.length) {
      const n = this.getLabels();
      for (const { index: i, label: o } of s) n[i] === o && n.splice(i, 1);
      this._addedLabels = [];
    }
    super.init(t);
  }
  parse(t, s) {
    if (Gt(t)) return null;
    const n = this.getLabels();
    return (
      (s = isFinite(s) && n[s] === t ? s : jP(n, t, Mt(s, t), this._addedLabels)),
      VP(s, n.length - 1)
    );
  }
  determineDataLimits() {
    const { minDefined: t, maxDefined: s } = this.getUserBounds();
    let { min: n, max: i } = this.getMinMax(!0);
    (this.options.bounds === 'ticks' && (t || (n = 0), s || (i = this.getLabels().length - 1)),
      (this.min = n),
      (this.max = i));
  }
  buildTicks() {
    const t = this.min,
      s = this.max,
      n = this.options.offset,
      i = [];
    let o = this.getLabels();
    ((o = t === 0 && s === o.length - 1 ? o : o.slice(t, s + 1)),
      (this._valueRange = Math.max(o.length - (n ? 0 : 1), 1)),
      (this._startValue = this.min - (n ? 0.5 : 0)));
    for (let r = t; r <= s; r++) i.push({ value: r });
    return i;
  }
  getLabelForValue(t) {
    return Kp.call(this, t);
  }
  configure() {
    (super.configure(), this.isHorizontal() || (this._reversePixels = !this._reversePixels));
  }
  getPixelForValue(t) {
    return (
      typeof t != 'number' && (t = this.parse(t)),
      t === null ? NaN : this.getPixelForDecimal((t - this._startValue) / this._valueRange)
    );
  }
  getPixelForTick(t) {
    const s = this.ticks;
    return t < 0 || t > s.length - 1 ? null : this.getPixelForValue(s[t].value);
  }
  getValueForPixel(t) {
    return Math.round(this._startValue + this.getDecimalForPixel(t) * this._valueRange);
  }
  getBasePixel() {
    return this.bottom;
  }
}
(ct(Fa, 'id', 'category'), ct(Fa, 'defaults', { ticks: { callback: Kp } }));
function HP(e, t) {
  const s = [],
    {
      bounds: i,
      step: o,
      min: r,
      max: a,
      precision: l,
      count: c,
      maxTicks: h,
      maxDigits: f,
      includeBounds: m
    } = e,
    g = o || 1,
    _ = h - 1,
    { min: y, max: x } = t,
    w = !Gt(r),
    C = !Gt(a),
    T = !Gt(c),
    E = (x - y) / (f + 1);
  let M = Hf((x - y) / _ / g) * g,
    H,
    $,
    X,
    G;
  if (M < 1e-14 && !w && !C) return [{ value: y }, { value: x }];
  ((G = Math.ceil(x / M) - Math.floor(y / M)),
    G > _ && (M = Hf((G * M) / _ / g) * g),
    Gt(l) || ((H = Math.pow(10, l)), (M = Math.ceil(M * H) / H)),
    i === 'ticks' ? (($ = Math.floor(y / M) * M), (X = Math.ceil(x / M) * M)) : (($ = y), (X = x)),
    w && C && o && Yk((a - r) / o, M / 1e3)
      ? ((G = Math.round(Math.min((a - r) / M, h))), (M = (a - r) / G), ($ = r), (X = a))
      : T
        ? (($ = w ? r : $), (X = C ? a : X), (G = c - 1), (M = (X - $) / G))
        : ((G = (X - $) / M),
          jo(G, Math.round(G), M / 1e3) ? (G = Math.round(G)) : (G = Math.ceil(G))));
  const et = Math.max(zf(M), zf($));
  ((H = Math.pow(10, Gt(l) ? et : l)), ($ = Math.round($ * H) / H), (X = Math.round(X * H) / H));
  let ot = 0;
  for (
    w &&
    (m && $ !== r
      ? (s.push({ value: r }),
        $ < r && ot++,
        jo(Math.round(($ + ot * M) * H) / H, r, qp(r, E, e)) && ot++)
      : $ < r && ot++);
    ot < G;
    ++ot
  ) {
    const Z = Math.round(($ + ot * M) * H) / H;
    if (C && Z > a) break;
    s.push({ value: Z });
  }
  return (
    C && m && X !== a
      ? s.length && jo(s[s.length - 1].value, a, qp(a, E, e))
        ? (s[s.length - 1].value = a)
        : s.push({ value: a })
      : (!C || X === a) && s.push({ value: X }),
    s
  );
}
function qp(e, t, { horizontal: s, minRotation: n }) {
  const i = un(n),
    o = (s ? Math.sin(i) : Math.cos(i)) || 0.001,
    r = 0.75 * t * ('' + e).length;
  return Math.min(t / o, r);
}
class zP extends so {
  constructor(t) {
    (super(t),
      (this.start = void 0),
      (this.end = void 0),
      (this._startValue = void 0),
      (this._endValue = void 0),
      (this._valueRange = 0));
  }
  parse(t, s) {
    return Gt(t) || ((typeof t == 'number' || t instanceof Number) && !isFinite(+t)) ? null : +t;
  }
  handleTickRangeOptions() {
    const { beginAtZero: t } = this.options,
      { minDefined: s, maxDefined: n } = this.getUserBounds();
    let { min: i, max: o } = this;
    const r = (l) => (i = s ? i : l),
      a = (l) => (o = n ? o : l);
    if (t) {
      const l = qs(i),
        c = qs(o);
      l < 0 && c < 0 ? a(0) : l > 0 && c > 0 && r(0);
    }
    if (i === o) {
      let l = o === 0 ? 1 : Math.abs(o * 0.05);
      (a(o + l), t || r(i - l));
    }
    ((this.min = i), (this.max = o));
  }
  getTickLimit() {
    const t = this.options.ticks;
    let { maxTicksLimit: s, stepSize: n } = t,
      i;
    return (
      n
        ? ((i = Math.ceil(this.max / n) - Math.floor(this.min / n) + 1),
          i > 1e3 &&
            (console.warn(
              `scales.${this.id}.ticks.stepSize: ${n} would result generating up to ${i} ticks. Limiting to 1000.`
            ),
            (i = 1e3)))
        : ((i = this.computeTickLimit()), (s = s || 11)),
      s && (i = Math.min(s, i)),
      i
    );
  }
  computeTickLimit() {
    return Number.POSITIVE_INFINITY;
  }
  buildTicks() {
    const t = this.options,
      s = t.ticks;
    let n = this.getTickLimit();
    n = Math.max(2, n);
    const i = {
        maxTicks: n,
        bounds: t.bounds,
        min: t.min,
        max: t.max,
        precision: s.precision,
        step: s.stepSize,
        count: s.count,
        maxDigits: this._maxDigits(),
        horizontal: this.isHorizontal(),
        minRotation: s.minRotation || 0,
        includeBounds: s.includeBounds !== !1
      },
      o = this._range || this,
      r = HP(i, o);
    return (
      t.bounds === 'ticks' && Jk(r, this, 'value'),
      t.reverse
        ? (r.reverse(), (this.start = this.max), (this.end = this.min))
        : ((this.start = this.min), (this.end = this.max)),
      r
    );
  }
  configure() {
    const t = this.ticks;
    let s = this.min,
      n = this.max;
    if ((super.configure(), this.options.offset && t.length)) {
      const i = (n - s) / Math.max(t.length - 1, 1) / 2;
      ((s -= i), (n += i));
    }
    ((this._startValue = s), (this._endValue = n), (this._valueRange = n - s));
  }
  getLabelForValue(t) {
    return Bd(t, this.chart.options.locale, this.options.ticks.format);
  }
}
class Ba extends zP {
  determineDataLimits() {
    const { min: t, max: s } = this.getMinMax(!0);
    ((this.min = Ue(t) ? t : 0), (this.max = Ue(s) ? s : 1), this.handleTickRangeOptions());
  }
  computeTickLimit() {
    const t = this.isHorizontal(),
      s = t ? this.width : this.height,
      n = un(this.options.ticks.minRotation),
      i = (t ? Math.sin(n) : Math.cos(n)) || 0.001,
      o = this._resolveTickFontOptions(0);
    return Math.ceil(s / Math.min(40, o.lineHeight / i));
  }
  getPixelForValue(t) {
    return t === null ? NaN : this.getPixelForDecimal((t - this._startValue) / this._valueRange);
  }
  getValueForPixel(t) {
    return this._startValue + this.getDecimalForPixel(t) * this._valueRange;
  }
}
(ct(Ba, 'id', 'linear'), ct(Ba, 'defaults', { ticks: { callback: ib.formatters.numeric } }));
const gl = {
    millisecond: { common: !0, size: 1, steps: 1e3 },
    second: { common: !0, size: 1e3, steps: 60 },
    minute: { common: !0, size: 6e4, steps: 60 },
    hour: { common: !0, size: 36e5, steps: 24 },
    day: { common: !0, size: 864e5, steps: 30 },
    week: { common: !1, size: 6048e5, steps: 4 },
    month: { common: !0, size: 2628e6, steps: 12 },
    quarter: { common: !1, size: 7884e6, steps: 4 },
    year: { common: !0, size: 3154e7 }
  },
  ts = Object.keys(gl);
function Gp(e, t) {
  return e - t;
}
function Xp(e, t) {
  if (Gt(t)) return null;
  const s = e._adapter,
    { parser: n, round: i, isoWeekday: o } = e._parseOpts;
  let r = t;
  return (
    typeof n == 'function' && (r = n(r)),
    Ue(r) || (r = typeof n == 'string' ? s.parse(r, n) : s.parse(r)),
    r === null
      ? null
      : (i &&
          (r = i === 'week' && (ir(o) || o === !0) ? s.startOf(r, 'isoWeek', o) : s.startOf(r, i)),
        +r)
  );
}
function Yp(e, t, s, n) {
  const i = ts.length;
  for (let o = ts.indexOf(e); o < i - 1; ++o) {
    const r = gl[ts[o]],
      a = r.steps ? r.steps : Number.MAX_SAFE_INTEGER;
    if (r.common && Math.ceil((s - t) / (a * r.size)) <= n) return ts[o];
  }
  return ts[i - 1];
}
function WP(e, t, s, n, i) {
  for (let o = ts.length - 1; o >= ts.indexOf(s); o--) {
    const r = ts[o];
    if (gl[r].common && e._adapter.diff(i, n, r) >= t - 1) return r;
  }
  return ts[s ? ts.indexOf(s) : 0];
}
function KP(e) {
  for (let t = ts.indexOf(e) + 1, s = ts.length; t < s; ++t) if (gl[ts[t]].common) return ts[t];
}
function Jp(e, t, s) {
  if (!s) e[t] = !0;
  else if (s.length) {
    const { lo: n, hi: i } = Nd(s, t),
      o = s[n] >= t ? s[n] : s[i];
    e[o] = !0;
  }
}
function qP(e, t, s, n) {
  const i = e._adapter,
    o = +i.startOf(t[0].value, n),
    r = t[t.length - 1].value;
  let a, l;
  for (a = o; a <= r; a = +i.add(a, 1, n)) ((l = s[a]), l >= 0 && (t[l].major = !0));
  return t;
}
function Zp(e, t, s) {
  const n = [],
    i = {},
    o = t.length;
  let r, a;
  for (r = 0; r < o; ++r) ((a = t[r]), (i[a] = r), n.push({ value: a, major: !1 }));
  return o === 0 || !s ? n : qP(e, n, i, s);
}
class Ua extends so {
  constructor(t) {
    (super(t),
      (this._cache = { data: [], labels: [], all: [] }),
      (this._unit = 'day'),
      (this._majorUnit = void 0),
      (this._offsets = {}),
      (this._normalized = !1),
      (this._parseOpts = void 0));
  }
  init(t, s = {}) {
    const n = t.time || (t.time = {}),
      i = (this._adapter = new MT._date(t.adapters.date));
    (i.init(s),
      Uo(n.displayFormats, i.formats()),
      (this._parseOpts = { parser: n.parser, round: n.round, isoWeekday: n.isoWeekday }),
      super.init(t),
      (this._normalized = s.normalized));
  }
  parse(t, s) {
    return t === void 0 ? null : Xp(this, t);
  }
  beforeLayout() {
    (super.beforeLayout(), (this._cache = { data: [], labels: [], all: [] }));
  }
  determineDataLimits() {
    const t = this.options,
      s = this._adapter,
      n = t.time.unit || 'day';
    let { min: i, max: o, minDefined: r, maxDefined: a } = this.getUserBounds();
    function l(c) {
      (!r && !isNaN(c.min) && (i = Math.min(i, c.min)),
        !a && !isNaN(c.max) && (o = Math.max(o, c.max)));
    }
    ((!r || !a) &&
      (l(this._getLabelBounds()),
      (t.bounds !== 'ticks' || t.ticks.source !== 'labels') && l(this.getMinMax(!1))),
      (i = Ue(i) && !isNaN(i) ? i : +s.startOf(Date.now(), n)),
      (o = Ue(o) && !isNaN(o) ? o : +s.endOf(Date.now(), n) + 1),
      (this.min = Math.min(i, o - 1)),
      (this.max = Math.max(i + 1, o)));
  }
  _getLabelBounds() {
    const t = this.getLabelTimestamps();
    let s = Number.POSITIVE_INFINITY,
      n = Number.NEGATIVE_INFINITY;
    return (t.length && ((s = t[0]), (n = t[t.length - 1])), { min: s, max: n });
  }
  buildTicks() {
    const t = this.options,
      s = t.time,
      n = t.ticks,
      i = n.source === 'labels' ? this.getLabelTimestamps() : this._generate();
    t.bounds === 'ticks' &&
      i.length &&
      ((this.min = this._userMin || i[0]), (this.max = this._userMax || i[i.length - 1]));
    const o = this.min,
      r = this.max,
      a = sC(i, o, r);
    return (
      (this._unit =
        s.unit ||
        (n.autoSkip
          ? Yp(s.minUnit, this.min, this.max, this._getLabelCapacity(o))
          : WP(this, a.length, s.minUnit, this.min, this.max))),
      (this._majorUnit = !n.major.enabled || this._unit === 'year' ? void 0 : KP(this._unit)),
      this.initOffsets(i),
      t.reverse && a.reverse(),
      Zp(this, a, this._majorUnit)
    );
  }
  afterAutoSkip() {
    this.options.offsetAfterAutoskip && this.initOffsets(this.ticks.map((t) => +t.value));
  }
  initOffsets(t = []) {
    let s = 0,
      n = 0,
      i,
      o;
    this.options.offset &&
      t.length &&
      ((i = this.getDecimalForValue(t[0])),
      t.length === 1 ? (s = 1 - i) : (s = (this.getDecimalForValue(t[1]) - i) / 2),
      (o = this.getDecimalForValue(t[t.length - 1])),
      t.length === 1 ? (n = o) : (n = (o - this.getDecimalForValue(t[t.length - 2])) / 2));
    const r = t.length < 3 ? 0.5 : 0.25;
    ((s = $e(s, 0, r)),
      (n = $e(n, 0, r)),
      (this._offsets = { start: s, end: n, factor: 1 / (s + 1 + n) }));
  }
  _generate() {
    const t = this._adapter,
      s = this.min,
      n = this.max,
      i = this.options,
      o = i.time,
      r = o.unit || Yp(o.minUnit, s, n, this._getLabelCapacity(s)),
      a = Mt(i.ticks.stepSize, 1),
      l = r === 'week' ? o.isoWeekday : !1,
      c = ir(l) || l === !0,
      h = {};
    let f = s,
      m,
      g;
    if (
      (c && (f = +t.startOf(f, 'isoWeek', l)),
      (f = +t.startOf(f, c ? 'day' : r)),
      t.diff(n, s, r) > 1e5 * a)
    )
      throw new Error(s + ' and ' + n + ' are too far apart with stepSize of ' + a + ' ' + r);
    const _ = i.ticks.source === 'data' && this.getDataTimestamps();
    for (m = f, g = 0; m < n; m = +t.add(m, a, r), g++) Jp(h, m, _);
    return (
      (m === n || i.bounds === 'ticks' || g === 1) && Jp(h, m, _),
      Object.keys(h)
        .sort(Gp)
        .map((y) => +y)
    );
  }
  getLabelForValue(t) {
    const s = this._adapter,
      n = this.options.time;
    return n.tooltipFormat ? s.format(t, n.tooltipFormat) : s.format(t, n.displayFormats.datetime);
  }
  format(t, s) {
    const i = this.options.time.displayFormats,
      o = this._unit,
      r = s || i[o];
    return this._adapter.format(t, r);
  }
  _tickFormatFunction(t, s, n, i) {
    const o = this.options,
      r = o.ticks.callback;
    if (r) return ce(r, [t, s, n], this);
    const a = o.time.displayFormats,
      l = this._unit,
      c = this._majorUnit,
      h = l && a[l],
      f = c && a[c],
      m = n[s],
      g = c && f && m && m.major;
    return this._adapter.format(t, i || (g ? f : h));
  }
  generateTickLabels(t) {
    let s, n, i;
    for (s = 0, n = t.length; s < n; ++s)
      ((i = t[s]), (i.label = this._tickFormatFunction(i.value, s, t)));
  }
  getDecimalForValue(t) {
    return t === null ? NaN : (t - this.min) / (this.max - this.min);
  }
  getPixelForValue(t) {
    const s = this._offsets,
      n = this.getDecimalForValue(t);
    return this.getPixelForDecimal((s.start + n) * s.factor);
  }
  getValueForPixel(t) {
    const s = this._offsets,
      n = this.getDecimalForPixel(t) / s.factor - s.end;
    return this.min + n * (this.max - this.min);
  }
  _getLabelSize(t) {
    const s = this.options.ticks,
      n = this.ctx.measureText(t).width,
      i = un(this.isHorizontal() ? s.maxRotation : s.minRotation),
      o = Math.cos(i),
      r = Math.sin(i),
      a = this._resolveTickFontOptions(0).size;
    return { w: n * o + a * r, h: n * r + a * o };
  }
  _getLabelCapacity(t) {
    const s = this.options.time,
      n = s.displayFormats,
      i = n[s.unit] || n.millisecond,
      o = this._tickFormatFunction(t, 0, Zp(this, [t], this._majorUnit), i),
      r = this._getLabelSize(o),
      a = Math.floor(this.isHorizontal() ? this.width / r.w : this.height / r.h) - 1;
    return a > 0 ? a : 1;
  }
  getDataTimestamps() {
    let t = this._cache.data || [],
      s,
      n;
    if (t.length) return t;
    const i = this.getMatchingVisibleMetas();
    if (this._normalized && i.length)
      return (this._cache.data = i[0].controller.getAllParsedValues(this));
    for (s = 0, n = i.length; s < n; ++s) t = t.concat(i[s].controller.getAllParsedValues(this));
    return (this._cache.data = this.normalize(t));
  }
  getLabelTimestamps() {
    const t = this._cache.labels || [];
    let s, n;
    if (t.length) return t;
    const i = this.getLabels();
    for (s = 0, n = i.length; s < n; ++s) t.push(Xp(this, i[s]));
    return (this._cache.labels = this._normalized ? t : this.normalize(t));
  }
  normalize(t) {
    return eb(t.sort(Gp));
  }
}
(ct(Ua, 'id', 'time'),
  ct(Ua, 'defaults', {
    bounds: 'data',
    adapters: {},
    time: {
      parser: !1,
      unit: !1,
      round: !1,
      isoWeekday: !1,
      minUnit: 'millisecond',
      displayFormats: {}
    },
    ticks: { source: 'auto', callback: !1, major: { enabled: !1 } }
  }));
function ra(e, t, s) {
  let n = 0,
    i = e.length - 1,
    o,
    r,
    a,
    l;
  s
    ? (t >= e[n].pos && t <= e[i].pos && ({ lo: n, hi: i } = ci(e, 'pos', t)),
      ({ pos: o, time: a } = e[n]),
      ({ pos: r, time: l } = e[i]))
    : (t >= e[n].time && t <= e[i].time && ({ lo: n, hi: i } = ci(e, 'time', t)),
      ({ time: o, pos: a } = e[n]),
      ({ time: r, pos: l } = e[i]));
  const c = r - o;
  return c ? a + ((l - a) * (t - o)) / c : a;
}
class Qp extends Ua {
  constructor(t) {
    (super(t), (this._table = []), (this._minPos = void 0), (this._tableRange = void 0));
  }
  initOffsets() {
    const t = this._getTimestampsForTable(),
      s = (this._table = this.buildLookupTable(t));
    ((this._minPos = ra(s, this.min)),
      (this._tableRange = ra(s, this.max) - this._minPos),
      super.initOffsets(t));
  }
  buildLookupTable(t) {
    const { min: s, max: n } = this,
      i = [],
      o = [];
    let r, a, l, c, h;
    for (r = 0, a = t.length; r < a; ++r) ((c = t[r]), c >= s && c <= n && i.push(c));
    if (i.length < 2)
      return [
        { time: s, pos: 0 },
        { time: n, pos: 1 }
      ];
    for (r = 0, a = i.length; r < a; ++r)
      ((h = i[r + 1]),
        (l = i[r - 1]),
        (c = i[r]),
        Math.round((h + l) / 2) !== c && o.push({ time: c, pos: r / (a - 1) }));
    return o;
  }
  _generate() {
    const t = this.min,
      s = this.max;
    let n = super.getDataTimestamps();
    return (
      (!n.includes(t) || !n.length) && n.splice(0, 0, t),
      (!n.includes(s) || n.length === 1) && n.push(s),
      n.sort((i, o) => i - o)
    );
  }
  _getTimestampsForTable() {
    let t = this._cache.all || [];
    if (t.length) return t;
    const s = this.getDataTimestamps(),
      n = this.getLabelTimestamps();
    return (
      s.length && n.length ? (t = this.normalize(s.concat(n))) : (t = s.length ? s : n),
      (t = this._cache.all = t),
      t
    );
  }
  getDecimalForValue(t) {
    return (ra(this._table, t) - this._minPos) / this._tableRange;
  }
  getValueForPixel(t) {
    const s = this._offsets,
      n = this.getDecimalForPixel(t) / s.factor - s.end;
    return ra(this._table, n * this._tableRange + this._minPos, !0);
  }
}
(ct(Qp, 'id', 'timeseries'), ct(Qp, 'defaults', Ua.defaults));
const Vb = {
    data: { type: Object, required: !0 },
    options: { type: Object, default: () => ({}) },
    plugins: { type: Array, default: () => [] },
    datasetIdKey: { type: String, default: 'label' },
    updateMode: { type: String, default: void 0 }
  },
  GP = { ariaLabel: { type: String }, ariaDescribedby: { type: String } },
  XP = {
    type: { type: String, required: !0 },
    destroyDelay: { type: Number, default: 0 },
    ...Vb,
    ...GP
  },
  YP = lg[0] === '2' ? (e, t) => Object.assign(e, { attrs: t }) : (e, t) => Object.assign(e, t);
function Li(e) {
  return dr(e) ? Bt(e) : e;
}
function JP(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : e;
  return dr(t) ? new Proxy(e, {}) : e;
}
function ZP(e, t) {
  const s = e.options;
  s && t && Object.assign(s, t);
}
function Hb(e, t) {
  e.labels = t;
}
function zb(e, t, s) {
  const n = [];
  e.datasets = t.map((i) => {
    const o = e.datasets.find((r) => r[s] === i[s]);
    return !o || !i.data || n.includes(o) ? { ...i } : (n.push(o), Object.assign(o, i), o);
  });
}
function QP(e, t) {
  const s = { labels: [], datasets: [] };
  return (Hb(s, e.labels), zb(s, e.datasets, t), s);
}
const tO = Ja({
  props: XP,
  setup(e, t) {
    let { expose: s, slots: n } = t;
    const i = de(null),
      o = bd(null);
    s({ chart: o });
    const r = () => {
        if (!i.value) return;
        const { type: c, data: h, options: f, plugins: m, datasetIdKey: g } = e,
          _ = QP(h, g),
          y = JP(_, h);
        o.value = new xr(i.value, { type: c, data: y, options: { ...f }, plugins: m });
      },
      a = () => {
        const c = Bt(o.value);
        c &&
          (e.destroyDelay > 0
            ? setTimeout(() => {
                (c.destroy(), (o.value = null));
              }, e.destroyDelay)
            : (c.destroy(), (o.value = null)));
      },
      l = (c) => {
        c.update(e.updateMode);
      };
    return (
      to(r),
      xd(a),
      Mo(
        [() => e.options, () => e.data],
        (c, h) => {
          let [f, m] = c,
            [g, _] = h;
          const y = Bt(o.value);
          if (!y) return;
          let x = !1;
          if (f) {
            const w = Li(f),
              C = Li(g);
            w && w !== C && (ZP(y, w), (x = !0));
          }
          if (m) {
            const w = Li(m.labels),
              C = Li(_.labels),
              T = Li(m.datasets),
              E = Li(_.datasets);
            (w !== C && (Hb(y.config.data, w), (x = !0)),
              T && T !== E && (zb(y.config.data, T, e.datasetIdKey), (x = !0)));
          }
          x &&
            Ya(() => {
              l(y);
            });
        },
        { deep: !0 }
      ),
      () =>
        Zo(
          'canvas',
          { role: 'img', 'aria-label': e.ariaLabel, 'aria-describedby': e.ariaDescribedby, ref: i },
          [Zo('p', {}, [n.default ? n.default() : ''])]
        )
    );
  }
});
function qd(e, t) {
  return (
    xr.register(t),
    Ja({
      props: Vb,
      setup(s, n) {
        let { expose: i } = n;
        const o = bd(null),
          r = (a) => {
            o.value = a == null ? void 0 : a.chart;
          };
        return (i({ chart: o }), () => Zo(tO, YP({ ref: r }, { type: e, ...s })));
      }
    })
  );
}
const Wb = qd('bar', ba),
  Kb = qd('doughnut', To),
  qb = qd('line', _a);
xr.register(Bb, jb, $b, Fi, Wo, fn, zo, Fa, Ba, Lb);
const eO = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ],
  sO = [
    { value: 'all', label: 'All Branches' },
    { value: 'Maganjo', label: 'Maganjo' },
    { value: 'Matugga', label: 'Matugga' }
  ],
  Ye = (e) => Number(e || 0),
  Oc = (e) =>
    new Intl.NumberFormat('en-UG', { notation: 'compact', maximumFractionDigits: 1 }).format(Ye(e)),
  ei = (e) =>
    new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Ye(e)),
  nO = (e) => {
    const t = e == null ? '' : String(e);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  },
  Us = (e) =>
    String(e ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'),
  tm = (e) =>
    String(e || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'all',
  Ec = (e) => ({ grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { callback: e } }),
  iO = {
    name: 'DirectorDashboard',
    components: { Bar: Wb, Doughnut: Kb, LineChart: qb },
    data() {
      return {
        loading: !1,
        filters: { period: 'weekly', branch: 'all' },
        branchTotals: {},
        grandTotal: { cash: 0, credit: 0, totalKg: 0 },
        trendLabels: [],
        trendSeries: [],
        report: { salesCount: 0, creditSalesCount: 0, procurementCount: 0, procurementTotal: 0 },
        procurementTotals: {},
        range: { from: '', to: '' },
        periodOptions: eO,
        branchOptions: sO,
        chartOptions: {
          doughnutCurrency: {
            responsive: !0,
            maintainAspectRatio: !1,
            cutout: '62%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { usePointStyle: !0, boxWidth: 10, padding: 18, font: { weight: 600 } }
              },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `${e.label}: ${ei(e.raw)}`;
                  }
                }
              }
            }
          },
          lineCurrency: {
            responsive: !0,
            maintainAspectRatio: !1,
            interaction: { mode: 'index', intersect: !1 },
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `Sales: ${ei(e.raw)}`;
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: !1 } },
              y: { ...Ec((e) => `UGX ${Oc(e)}`), beginAtZero: !0 }
            }
          },
          groupedBarCurrency: {
            responsive: !0,
            maintainAspectRatio: !1,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { usePointStyle: !0, boxWidth: 10, padding: 16 }
              },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `${e.dataset.label}: ${ei(e.raw)}`;
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: !1 } },
              y: { ...Ec((e) => `UGX ${Oc(e)}`), beginAtZero: !0 }
            }
          },
          horizontalBarKg: {
            responsive: !0,
            maintainAspectRatio: !1,
            indexAxis: 'y',
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `Volume: ${Ye(e.raw).toLocaleString('en-UG')} kg`;
                  }
                }
              }
            },
            scales: {
              y: { grid: { display: !1 } },
              x: { ...Ec((e) => `${Oc(e)} kg`), beginAtZero: !0 }
            }
          }
        }
      };
    },
    computed: {
      totalRevenue() {
        return this.grandTotal.cash + this.grandTotal.credit;
      },
      totalTransactions() {
        return Ye(this.report.salesCount) + Ye(this.report.creditSalesCount);
      },
      procurementTotal() {
        return Ye(this.report.procurementTotal);
      },
      procurementCount() {
        return Ye(this.report.procurementCount);
      },
      selectedPeriodLabel() {
        var e;
        return (
          ((e = this.periodOptions.find((t) => t.value === this.filters.period)) == null
            ? void 0
            : e.label) || 'Weekly'
        );
      },
      selectedBranchLabel() {
        var e;
        return (
          ((e = this.branchOptions.find((t) => t.value === this.filters.branch)) == null
            ? void 0
            : e.label) || 'All Branches'
        );
      },
      formattedRange() {
        if (!this.range.from || !this.range.to) return '-';
        const e = new Date(this.range.from),
          t = new Date(this.range.to);
        if (Number.isNaN(e.getTime()) || Number.isNaN(t.getTime())) return '-';
        const s = { month: 'short', day: 'numeric', year: 'numeric' };
        return `${e.toLocaleDateString('en-UG', s)} - ${t.toLocaleDateString('en-UG', s)}`;
      },
      branchLabels() {
        return Object.keys(this.branchTotals);
      },
      hasRevenueData() {
        return this.totalRevenue > 0;
      },
      hasTrendData() {
        return this.trendSeries.some((e) => e > 0);
      },
      trendChartData() {
        return {
          labels: this.trendLabels,
          datasets: [
            {
              label: 'Total Sales',
              data: this.trendSeries,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              fill: !0,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5
            }
          ]
        };
      },
      revenueCompositionChartData() {
        return {
          labels: ['Cash Sales', 'Credit Sales'],
          datasets: [
            {
              data: [this.grandTotal.cash, this.grandTotal.credit],
              backgroundColor: ['#16a34a', '#f59e0b'],
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 8
            }
          ]
        };
      },
      branchRevenueChartData() {
        return {
          labels: this.branchLabels,
          datasets: [
            {
              label: 'Cash Sales',
              data: this.branchLabels.map((e) => this.branchTotals[e].cash),
              backgroundColor: '#16a34a',
              borderRadius: 8,
              maxBarThickness: 36
            },
            {
              label: 'Credit Sales',
              data: this.branchLabels.map((e) => this.branchTotals[e].credit),
              backgroundColor: '#f59e0b',
              borderRadius: 8,
              maxBarThickness: 36
            }
          ]
        };
      },
      branchVolumeChartData() {
        return {
          labels: this.branchLabels,
          datasets: [
            {
              label: 'Total Kilograms',
              data: this.branchLabels.map((e) => this.branchTotals[e].totalKg),
              backgroundColor: ['#2563eb', '#0f766e', '#7c3aed', '#dc2626'],
              borderRadius: 8,
              barThickness: 20
            }
          ]
        };
      }
    },
    async created() {
      await this.loadData();
    },
    methods: {
      async loadData() {
        var e, t;
        this.loading = !0;
        try {
          const s = await ll.getAggregation({
            period: this.filters.period,
            branch: this.filters.branch
          });
          ((this.branchTotals = s.data.branchTotals || {}),
            (this.procurementTotals = s.data.procurementTotals || {}),
            (this.grandTotal = s.data.grandTotal || { cash: 0, credit: 0, totalKg: 0 }),
            (this.trendLabels = ((e = s.data.trends) == null ? void 0 : e.labels) || []),
            (this.trendSeries = ((t = s.data.trends) == null ? void 0 : t.data) || []),
            (this.report = s.data.report || {
              salesCount: 0,
              creditSalesCount: 0,
              procurementCount: 0,
              procurementTotal: 0
            }),
            (this.range = s.data.range || { from: '', to: '' }));
        } catch (s) {
          ((this.branchTotals = {}),
            (this.procurementTotals = {}),
            (this.grandTotal = { cash: 0, credit: 0, totalKg: 0 }),
            (this.trendLabels = []),
            (this.trendSeries = []),
            (this.report = {
              salesCount: 0,
              creditSalesCount: 0,
              procurementCount: 0,
              procurementTotal: 0
            }),
            (this.range = { from: '', to: '' }),
            console.error('Error loading aggregation:', s));
        } finally {
          this.loading = !1;
        }
      },
      formatCurrency(e) {
        return ei(e);
      },
      formatStatCurrency(e) {
        return dl(e);
      },
      buildFileName(e) {
        const t = tm(this.selectedPeriodLabel),
          s = tm(this.selectedBranchLabel),
          n = new Date().toISOString().slice(0, 10);
        return `director_report_${t}_${s}_${n}.${e}`;
      },
      downloadFile(e, t, s) {
        const n = new Blob([t], { type: s }),
          i = URL.createObjectURL(n),
          o = document.createElement('a');
        ((o.href = i),
          (o.download = e),
          document.body.appendChild(o),
          o.click(),
          document.body.removeChild(o),
          URL.revokeObjectURL(i));
      },
      getReportSummaryRows(e = !1) {
        const t = (n) => (e ? ei(n) : Ye(n)),
          s = (n) => (e ? Ye(n).toLocaleString('en-UG') : Ye(n));
        return [
          ['Report Period', this.selectedPeriodLabel],
          ['Branch Scope', this.selectedBranchLabel],
          ['Range', this.formattedRange],
          ['Transactions', s(this.totalTransactions)],
          ['Total Revenue (UGX)', t(this.totalRevenue)],
          ['Cash Sales (UGX)', t(this.grandTotal.cash)],
          ['Credit Sales (UGX)', t(this.grandTotal.credit)],
          ['Total Procurement (UGX)', t(this.procurementTotal)],
          ['Total Produce Sold (kg)', s(this.grandTotal.totalKg)]
        ];
      },
      getBranchTotalsRows(e = !1) {
        const t = Object.keys(this.procurementTotals || {}).length > 0,
          s = (r) => (e ? ei(r) : Ye(r)),
          n = (r) => (e ? Ye(r).toLocaleString('en-UG') : Ye(r)),
          i = [
            'Branch',
            'Cash Sales (UGX)',
            'Credit Sales (UGX)',
            'Total Revenue (UGX)',
            'Total Weight (kg)'
          ];
        t && i.push('Procurement Cost (UGX)');
        const o = this.branchLabels.map((r) => {
          var h, f;
          const a = this.branchTotals[r] || { cash: 0, credit: 0, totalKg: 0 },
            l =
              ((f = (h = this.procurementTotals) == null ? void 0 : h[r]) == null
                ? void 0
                : f.totalCost) || 0,
            c = [r, s(a.cash), s(a.credit), s(a.cash + a.credit), n(a.totalKg)];
          return (t && c.push(s(l)), c);
        });
        return { headers: i, rows: o };
      },
      getTrendRows(e = !1) {
        const t = (i) => (e ? ei(i) : Ye(i)),
          s = ['Period', 'Total Sales (UGX)'],
          n = this.trendLabels.map((i, o) => [i, t(this.trendSeries[o] || 0)]);
        return { headers: s, rows: n };
      },
      buildCsvContent() {
        const e = [],
          t = (r, a, l) => {
            (e.push([r]),
              a != null && a.length && e.push(a),
              l.forEach((c) => e.push(c)),
              e.push([]));
          },
          s = this.getReportSummaryRows(!1);
        t('Summary', ['Metric', 'Value'], s);
        const n = this.getBranchTotalsRows(!1);
        t('Branch Totals', n.headers, n.rows);
        const i = this.getTrendRows(!1);
        return (
          t('Sales Trend', i.headers, i.rows),
          `\uFEFF${e.map((r) => r.map(nO).join(',')).join(`\r
`)}`
        );
      },
      buildExcelContent() {
        const e = (i, o, r) => {
            const a = Math.max(o.length || 1, ...r.map((h) => h.length || 0), 1),
              l = o.length ? `<tr>${o.map((h) => `<th>${Us(h)}</th>`).join('')}</tr>` : '',
              c = r.map((h) => `<tr>${h.map((f) => `<td>${Us(f)}</td>`).join('')}</tr>`).join('');
            return `
          <table border="1">
            <tr><th colspan="${a}">${Us(i)}</th></tr>
            ${l}
            ${c}
          </table>
          <br />
        `;
          },
          t = this.getReportSummaryRows(!1),
          s = this.getBranchTotalsRows(!1),
          n = this.getTrendRows(!1);
        return `
        <html>
          <head>
            <meta charset="UTF-8" />
          </head>
          <body>
            ${e('Summary', ['Metric', 'Value'], t)}
            ${e('Branch Totals', s.headers, s.rows)}
            ${e('Sales Trend', n.headers, n.rows)}
          </body>
        </html>
      `;
      },
      buildReportHtml() {
        const e = this.getReportSummaryRows(!0),
          t = this.getBranchTotalsRows(!0),
          s = this.getTrendRows(!0),
          n = new Date().toLocaleString('en-UG'),
          i = e.map(([c, h]) => `<tr><th>${Us(c)}</th><td>${Us(h)}</td></tr>`).join(''),
          o = `<tr>${t.headers.map((c) => `<th>${Us(c)}</th>`).join('')}</tr>`,
          r = t.rows.map((c) => `<tr>${c.map((h) => `<td>${Us(h)}</td>`).join('')}</tr>`).join(''),
          a = `<tr>${s.headers.map((c) => `<th>${Us(c)}</th>`).join('')}</tr>`,
          l = s.rows.map((c) => `<tr>${c.map((h) => `<td>${Us(h)}</td>`).join('')}</tr>`).join('');
        return `
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Director Report</title>
            <style>
/* Component styles */
              body { font-family: "Segoe UI", Tahoma, sans-serif; color: #0f172a; margin: 24px; }
              h1 { margin: 0 0 6px; font-size: 22px; }
              h2 { margin: 24px 0 10px; font-size: 16px; color: #1e293b; }
              p { margin: 0 0 16px; color: #64748b; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-align: left; }
              th { background: #f1f5f9; font-weight: 600; }
              .summary th { width: 32%; }
            </style>
          </head>
          <body>
            <h1>Director Report</h1>
            <p>Generated ${Us(n)}</p>

            <h2>Summary</h2>
            <table class="summary">
              <tbody>
                ${i}
              </tbody>
            </table>

            <h2>Branch Totals</h2>
            <table>
              <thead>
                ${o}
              </thead>
              <tbody>
                ${r || '<tr><td colspan="' + t.headers.length + '">No data</td></tr>'}
              </tbody>
            </table>

            <h2>Sales Trend</h2>
            <table>
              <thead>
                ${a}
              </thead>
              <tbody>
                ${l || '<tr><td colspan="' + s.headers.length + '">No data</td></tr>'}
              </tbody>
            </table>
          </body>
        </html>
      `;
      },
      exportCsv() {
        const e = this.buildCsvContent();
        this.downloadFile(this.buildFileName('csv'), e, 'text/csv;charset=utf-8');
      },
      exportExcel() {
        const e = this.buildExcelContent();
        this.downloadFile(this.buildFileName('xls'), e, 'application/vnd.ms-excel');
      },
      exportPdf() {
        const e = this.buildReportHtml(),
          t = window.open('', '_blank');
        if (!t) {
          alert('Please allow pop-ups to export the PDF report.');
          return;
        }
        (t.document.open(),
          t.document.write(e),
          t.document.close(),
          t.focus(),
          (t.onafterprint = () => t.close()),
          setTimeout(() => t.print(), 300));
      },
      formatCompactNumber: cl
    }
  },
  oO = { class: 'd-flex flex-wrap justify-content-between align-items-start gap-3 mb-4' },
  rO = { class: 'text-muted mb-0' },
  aO = { class: 'dashboard-actions' },
  lO = { class: 'dashboard-filters' },
  cO = { class: 'filter-group' },
  dO = ['value'],
  uO = { class: 'filter-group' },
  hO = ['value'],
  fO = {
    class: 'export-actions btn-group btn-group-sm',
    role: 'group',
    'aria-label': 'Export report'
  },
  pO = ['disabled'],
  mO = ['disabled'],
  gO = ['disabled'],
  bO = { class: 'card report-card mb-4' },
  _O = { class: 'card-body py-3' },
  yO = { class: 'report-grid' },
  vO = { class: 'row g-4 mb-4' },
  xO = { class: 'col-md-3' },
  wO = { class: 'card stats-card h-100' },
  SO = { class: 'card-body' },
  kO = { class: 'stats-value' },
  CO = { class: 'col-md-3' },
  TO = { class: 'card stats-card h-100' },
  AO = { class: 'card-body' },
  PO = { class: 'stats-value' },
  OO = { class: 'col-md-3' },
  EO = { class: 'card stats-card h-100' },
  RO = { class: 'card-body' },
  DO = { class: 'stats-value' },
  MO = { class: 'col-md-3' },
  IO = { class: 'card stats-card h-100' },
  LO = { class: 'card-body' },
  NO = { class: 'stats-value' },
  $O = { class: 'text-muted' },
  FO = { class: 'col-md-3' },
  BO = { class: 'card stats-card h-100' },
  UO = { class: 'card-body' },
  jO = { class: 'stats-value' },
  VO = { class: 'text-muted' },
  HO = { class: 'row g-4' },
  zO = { class: 'col-xl-6' },
  WO = { class: 'card chart-card h-100' },
  KO = { class: 'card-header chart-header' },
  qO = { class: 'mb-0' },
  GO = { class: 'card-body' },
  XO = { key: 0, class: 'chart-empty' },
  YO = { key: 1, class: 'chart-panel' },
  JO = { class: 'col-xl-6' },
  ZO = { class: 'card chart-card h-100' },
  QO = { class: 'card-body' },
  tE = { key: 0, class: 'chart-empty' },
  eE = { key: 1, class: 'chart-panel chart-panel-sm' },
  sE = { class: 'col-xl-6' },
  nE = { class: 'card chart-card h-100' },
  iE = { class: 'card-body' },
  oE = { key: 0, class: 'chart-empty' },
  rE = { key: 1, class: 'chart-panel' },
  aE = { class: 'col-xl-6' },
  lE = { class: 'card chart-card h-100' },
  cE = { class: 'card-body' },
  dE = { key: 0, class: 'chart-empty' },
  uE = { key: 1, class: 'chart-panel' },
  hE = { class: 'col-12' },
  fE = { class: 'card chart-card' },
  pE = { class: 'card-body' },
  mE = { key: 0, class: 'chart-empty chart-empty-sm' },
  gE = { key: 1, class: 'table-responsive' },
  bE = { class: 'table table-hover align-middle mb-0' },
  _E = { class: 'fw-semibold' },
  yE = { class: 'text-end' },
  vE = { class: 'text-end' },
  xE = { class: 'text-end fw-semibold' },
  wE = { class: 'text-end' };
function SE(e, t, s, n, i, o) {
  const r = Ks('LineChart'),
    a = Ks('Doughnut'),
    l = Ks('Bar');
  return (
    R(),
    D('div', null, [
      u('div', oO, [
        u('div', null, [
          t[7] || (t[7] = u('h2', { class: 'mb-1' }, 'Director Dashboard', -1)),
          u(
            'p',
            rO,
            'Cross-branch report for ' + I(o.selectedPeriodLabel.toLowerCase()) + ' performance.',
            1
          )
        ]),
        u('div', aO, [
          u('div', lO, [
            u('div', cO, [
              t[8] || (t[8] = u('label', { class: 'form-label mb-1' }, 'Period', -1)),
              bt(
                u(
                  'select',
                  {
                    'onUpdate:modelValue': t[0] || (t[0] = (c) => (i.filters.period = c)),
                    class: 'form-select form-select-sm',
                    onChange: t[1] || (t[1] = (...c) => o.loadData && o.loadData(...c))
                  },
                  [
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        i.periodOptions,
                        (c) => (
                          R(),
                          D('option', { key: c.value, value: c.value }, I(c.label), 9, dO)
                        )
                      ),
                      128
                    ))
                  ],
                  544
                ),
                [[ks, i.filters.period]]
              )
            ]),
            u('div', uO, [
              t[9] || (t[9] = u('label', { class: 'form-label mb-1' }, 'Branch', -1)),
              bt(
                u(
                  'select',
                  {
                    'onUpdate:modelValue': t[2] || (t[2] = (c) => (i.filters.branch = c)),
                    class: 'form-select form-select-sm',
                    onChange: t[3] || (t[3] = (...c) => o.loadData && o.loadData(...c))
                  },
                  [
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        i.branchOptions,
                        (c) => (
                          R(),
                          D('option', { key: c.value, value: c.value }, I(c.label), 9, hO)
                        )
                      ),
                      128
                    ))
                  ],
                  544
                ),
                [[ks, i.filters.branch]]
              )
            ])
          ]),
          u('div', fO, [
            u(
              'button',
              {
                class: 'btn btn-outline-primary',
                type: 'button',
                disabled: i.loading,
                onClick: t[4] || (t[4] = (...c) => o.exportCsv && o.exportCsv(...c))
              },
              ' Export CSV ',
              8,
              pO
            ),
            u(
              'button',
              {
                class: 'btn btn-outline-primary',
                type: 'button',
                disabled: i.loading,
                onClick: t[5] || (t[5] = (...c) => o.exportExcel && o.exportExcel(...c))
              },
              ' Export Excel ',
              8,
              mO
            ),
            u(
              'button',
              {
                class: 'btn btn-outline-primary',
                type: 'button',
                disabled: i.loading,
                onClick: t[6] || (t[6] = (...c) => o.exportPdf && o.exportPdf(...c))
              },
              ' Export PDF ',
              8,
              gO
            )
          ])
        ])
      ]),
      u('div', bO, [
        u('div', _O, [
          u('div', yO, [
            u('div', null, [
              t[10] || (t[10] = u('small', { class: 'text-muted d-block' }, 'Report Period', -1)),
              u('strong', null, I(o.selectedPeriodLabel), 1)
            ]),
            u('div', null, [
              t[11] || (t[11] = u('small', { class: 'text-muted d-block' }, 'Branch Scope', -1)),
              u('strong', null, I(o.selectedBranchLabel), 1)
            ]),
            u('div', null, [
              t[12] || (t[12] = u('small', { class: 'text-muted d-block' }, 'Range', -1)),
              u('strong', null, I(o.formattedRange), 1)
            ]),
            u('div', null, [
              t[13] || (t[13] = u('small', { class: 'text-muted d-block' }, 'Transactions', -1)),
              u('strong', null, I(o.totalTransactions.toLocaleString('en-UG')), 1)
            ])
          ])
        ])
      ]),
      u('div', vO, [
        u('div', xO, [
          u('div', wO, [
            u('div', SO, [
              t[14] || (t[14] = u('h6', { class: 'text-muted' }, 'Total Revenue', -1)),
              u('h3', kO, I(o.formatStatCurrency(o.totalRevenue)), 1),
              t[15] || (t[15] = u('small', { class: 'text-muted' }, 'Cash + credit sales', -1))
            ])
          ])
        ]),
        u('div', CO, [
          u('div', TO, [
            u('div', AO, [
              t[16] || (t[16] = u('h6', { class: 'text-muted' }, 'Cash Sales', -1)),
              u('h3', PO, I(o.formatStatCurrency(i.grandTotal.cash)), 1),
              t[17] || (t[17] = u('small', { class: 'text-muted' }, 'Collected amount', -1))
            ])
          ])
        ]),
        u('div', OO, [
          u('div', EO, [
            u('div', RO, [
              t[18] || (t[18] = u('h6', { class: 'text-muted' }, 'Credit Sales', -1)),
              u('h3', DO, I(o.formatStatCurrency(i.grandTotal.credit)), 1),
              t[19] || (t[19] = u('small', { class: 'text-muted' }, 'Outstanding amount', -1))
            ])
          ])
        ]),
        u('div', MO, [
          u('div', IO, [
            u('div', LO, [
              t[20] || (t[20] = u('h6', { class: 'text-muted' }, 'Total Procurement', -1)),
              u('h3', NO, I(o.formatStatCurrency(o.procurementTotal)), 1),
              u('small', $O, I(o.procurementCount.toLocaleString('en-UG')) + ' record(s)', 1)
            ])
          ])
        ]),
        u('div', FO, [
          u('div', BO, [
            u('div', UO, [
              t[21] || (t[21] = u('h6', { class: 'text-muted' }, 'Total Produce Sold', -1)),
              u('h3', jO, I(o.formatCompactNumber(i.grandTotal.totalKg)) + ' kg', 1),
              u('small', VO, I(o.branchLabels.length) + ' branch(es) in scope', 1)
            ])
          ])
        ])
      ]),
      u('div', HO, [
        u('div', zO, [
          u('div', WO, [
            u('div', KO, [u('h5', qO, 'Sales Trend (' + I(o.selectedPeriodLabel) + ')', 1)]),
            u('div', GO, [
              o.hasTrendData
                ? (R(),
                  D('div', YO, [
                    Rt(
                      r,
                      { data: o.trendChartData, options: i.chartOptions.lineCurrency },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
                : (R(), D('div', XO, 'No sales trend data available'))
            ])
          ])
        ]),
        u('div', JO, [
          u('div', ZO, [
            t[22] ||
              (t[22] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Revenue Composition')],
                -1
              )),
            u('div', QO, [
              o.hasRevenueData
                ? (R(),
                  D('div', eE, [
                    Rt(
                      a,
                      {
                        data: o.revenueCompositionChartData,
                        options: i.chartOptions.doughnutCurrency
                      },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
                : (R(), D('div', tE, 'No revenue data available'))
            ])
          ])
        ]),
        u('div', sE, [
          u('div', nE, [
            t[23] ||
              (t[23] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Branch Revenue Comparison')],
                -1
              )),
            u('div', iE, [
              o.branchLabels.length === 0
                ? (R(), D('div', oE, 'No branch sales recorded yet'))
                : (R(),
                  D('div', rE, [
                    Rt(
                      l,
                      {
                        data: o.branchRevenueChartData,
                        options: i.chartOptions.groupedBarCurrency
                      },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
            ])
          ])
        ]),
        u('div', aE, [
          u('div', lE, [
            t[24] ||
              (t[24] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Branch Volume Sold')],
                -1
              )),
            u('div', cE, [
              o.branchLabels.length === 0
                ? (R(), D('div', dE, 'No branch volume data available'))
                : (R(),
                  D('div', uE, [
                    Rt(
                      l,
                      { data: o.branchVolumeChartData, options: i.chartOptions.horizontalBarKg },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
            ])
          ])
        ]),
        u('div', hE, [
          u('div', fE, [
            t[26] ||
              (t[26] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Branch Totals Summary')],
                -1
              )),
            u('div', pE, [
              o.branchLabels.length === 0
                ? (R(), D('div', mE, 'No branch totals available'))
                : (R(),
                  D('div', gE, [
                    u('table', bE, [
                      t[25] ||
                        (t[25] = u(
                          'thead',
                          null,
                          [
                            u('tr', null, [
                              u('th', null, 'Branch'),
                              u('th', { class: 'text-end' }, 'Cash Sales'),
                              u('th', { class: 'text-end' }, 'Credit Sales'),
                              u('th', { class: 'text-end' }, 'Total Revenue'),
                              u('th', { class: 'text-end' }, 'Total Weight')
                            ])
                          ],
                          -1
                        )),
                      u('tbody', null, [
                        (R(!0),
                        D(
                          ne,
                          null,
                          Ce(
                            o.branchLabels,
                            (c) => (
                              R(),
                              D('tr', { key: c }, [
                                u('td', _E, I(c), 1),
                                u('td', yE, I(o.formatCurrency(i.branchTotals[c].cash)), 1),
                                u('td', vE, I(o.formatCurrency(i.branchTotals[c].credit)), 1),
                                u(
                                  'td',
                                  xE,
                                  I(
                                    o.formatCurrency(
                                      i.branchTotals[c].cash + i.branchTotals[c].credit
                                    )
                                  ),
                                  1
                                ),
                                u(
                                  'td',
                                  wE,
                                  I(i.branchTotals[c].totalKg.toLocaleString('en-UG')) + ' kg',
                                  1
                                )
                              ])
                            )
                          ),
                          128
                        ))
                      ])
                    ])
                  ]))
            ])
          ])
        ])
      ])
    ])
  );
}
const kE = we(iO, [
  ['render', SE],
  ['__scopeId', 'data-v-a647643e']
]);
xr.register(Bb, jb, $b, Fi, Wo, fn, zo, Fa, Ba, Lb);
const CE = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ],
  em = ['#1d4ed8', '#0f766e', '#d97706', '#7c3aed', '#dc2626', '#0891b2'],
  Je = (e) => Number(e || 0),
  vo = (e) =>
    new Intl.NumberFormat('en-UG', { notation: 'compact', maximumFractionDigits: 1 }).format(Je(e)),
  Cn = (e) =>
    new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Je(e)),
  TE = (e) => {
    const t = e == null ? '' : String(e);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  },
  si = (e) =>
    String(e ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'),
  sm = (e) =>
    String(e || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'all',
  aa = (e) => Array.from({ length: e }, (t, s) => em[s % em.length]),
  xo = (e) => ({ grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { callback: e } }),
  AE = {
    name: 'ManagerDashboard',
    components: { Bar: Wb, Doughnut: Kb, LineChart: qb },
    data() {
      return {
        loading: !1,
        user: {},
        filters: { period: 'weekly' },
        periodOptions: CE,
        reportRange: { from: '', to: '' },
        inventory: [],
        salesRecords: [],
        creditSalesRecords: [],
        procurementRecords: [],
        stats: {
          inventoryValue: 0,
          inventoryItems: 0,
          cashSales: 0,
          cashCount: 0,
          creditSales: 0,
          creditCount: 0,
          procurementTotal: 0,
          procurementCount: 0
        },
        lowStockItems: [],
        outOfStockItems: [],
        topProducts: [],
        stockByProduct: [],
        salesOverTime: [],
        creditCollection: { collected: 0, outstanding: 0 },
        agentPerformance: [],
        dealerPerformance: [],
        chartOptions: {
          doughnutCurrency: {
            responsive: !0,
            maintainAspectRatio: !1,
            cutout: '62%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { usePointStyle: !0, boxWidth: 10, padding: 18, font: { weight: 600 } }
              },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `${e.label}: ${Cn(e.raw)}`;
                  }
                }
              }
            }
          },
          lineCurrency: {
            responsive: !0,
            maintainAspectRatio: !1,
            interaction: { mode: 'index', intersect: !1 },
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `Sales: ${Cn(e.raw)}`;
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: !1 } },
              y: { ...xo((e) => `UGX ${vo(e)}`), beginAtZero: !0 }
            }
          },
          barCurrency: {
            responsive: !0,
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `Amount: ${Cn(e.raw)}`;
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: !1 } },
              y: { ...xo((e) => `UGX ${vo(e)}`), beginAtZero: !0 }
            }
          },
          barKg: {
            responsive: !0,
            maintainAspectRatio: !1,
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `Tonnage: ${Je(e.raw).toLocaleString('en-UG')} kg`;
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: !1 } },
              y: { ...xo((e) => `${vo(e)} kg`), beginAtZero: !0 }
            }
          },
          horizontalBarCurrency: {
            responsive: !0,
            maintainAspectRatio: !1,
            indexAxis: 'y',
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `Amount: ${Cn(e.raw)}`;
                  }
                }
              }
            },
            scales: {
              y: { grid: { display: !1 } },
              x: { ...xo((e) => `UGX ${vo(e)}`), beginAtZero: !0 }
            }
          },
          horizontalBarKg: {
            responsive: !0,
            maintainAspectRatio: !1,
            indexAxis: 'y',
            plugins: {
              legend: { display: !1 },
              tooltip: {
                callbacks: {
                  label(e) {
                    return `Stock: ${Je(e.raw).toLocaleString('en-UG')} kg`;
                  }
                }
              }
            },
            scales: {
              y: { grid: { display: !1 } },
              x: { ...xo((e) => `${vo(e)} kg`), beginAtZero: !0 }
            }
          }
        }
      };
    },
    async created() {
      ((this.user = JSON.parse(localStorage.getItem('user') || '{}')), await this.loadData());
    },
    computed: {
      selectedPeriodLabel() {
        var e;
        return (
          ((e = this.periodOptions.find((t) => t.value === this.filters.period)) == null
            ? void 0
            : e.label) || 'Weekly'
        );
      },
      formattedReportRange() {
        if (!this.reportRange.from || !this.reportRange.to) return '-';
        const e = new Date(this.reportRange.from),
          t = new Date(this.reportRange.to);
        if (Number.isNaN(e.getTime()) || Number.isNaN(t.getTime())) return '-';
        const s = { month: 'short', day: 'numeric', year: 'numeric' };
        return `${e.toLocaleDateString('en-UG', s)} - ${t.toLocaleDateString('en-UG', s)}`;
      },
      totalTransactions() {
        return this.stats.cashCount + this.stats.creditCount;
      },
      lowStockAlertMessage() {
        const e = this.lowStockItems
          .map(
            (s) => `${s.produceName} (${Number(s.totalTonnageKg || 0).toLocaleString('en-UG')} kg)`
          )
          .slice(0, 4);
        if (e.length === 0) return '';
        const t =
          this.lowStockItems.length > 4 ? `, and ${this.lowStockItems.length - 4} more` : '';
        return `${e.join(', ')}${t} running low on stock.`;
      },
      hasRevenueSplitData() {
        return this.stats.cashSales + this.stats.creditSales > 0;
      },
      hasCreditCollectionData() {
        return this.creditCollection.collected + this.creditCollection.outstanding > 0;
      },
      hasSalesTrendData() {
        return this.salesOverTime.some((e) => e.amount > 0);
      },
      revenueSplitChartData() {
        return {
          labels: ['Cash Sales', 'Credit Sales'],
          datasets: [
            {
              data: [this.stats.cashSales, this.stats.creditSales],
              backgroundColor: ['#16a34a', '#f59e0b'],
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 8
            }
          ]
        };
      },
      creditCollectionChartData() {
        return {
          labels: ['Collected', 'Outstanding'],
          datasets: [
            {
              data: [this.creditCollection.collected, this.creditCollection.outstanding],
              backgroundColor: ['#0f766e', '#f97316'],
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 8
            }
          ]
        };
      },
      salesOverTimeChartData() {
        return {
          labels: this.salesOverTime.map((e) => e.label),
          datasets: [
            {
              label: 'Total Sales',
              data: this.salesOverTime.map((e) => e.amount),
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              fill: !0,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5
            }
          ]
        };
      },
      agentPerformanceChartData() {
        return {
          labels: this.agentPerformance.map((e) => e.name),
          datasets: [
            {
              label: 'UGX',
              data: this.agentPerformance.map((e) => e.amount),
              backgroundColor: aa(this.agentPerformance.length),
              borderRadius: 8,
              barThickness: 18
            }
          ]
        };
      },
      topProductsChartData() {
        return {
          labels: this.topProducts.map((e) => e.name),
          datasets: [
            {
              label: 'Kilograms Sold',
              data: this.topProducts.map((e) => e.totalKg),
              backgroundColor: aa(this.topProducts.length),
              borderRadius: 8,
              maxBarThickness: 44
            }
          ]
        };
      },
      stockByProductChartData() {
        return {
          labels: this.stockByProduct.map((e) => e.name),
          datasets: [
            {
              label: 'Available Stock',
              data: this.stockByProduct.map((e) => e.totalKg),
              backgroundColor: aa(this.stockByProduct.length),
              borderRadius: 8,
              barThickness: 18
            }
          ]
        };
      },
      dealerPerformanceChartData() {
        return {
          labels: this.dealerPerformance.map((e) => e.name),
          datasets: [
            {
              label: 'UGX',
              data: this.dealerPerformance.map((e) => e.amount),
              backgroundColor: aa(this.dealerPerformance.length),
              borderRadius: 8,
              maxBarThickness: 44
            }
          ]
        };
      }
    },
    methods: {
      async loadData() {
        var e, t;
        this.loading = !0;
        try {
          const [s, n, i, o] = await Promise.all([yr.get(), ll.getAll(), tr.getAll(), Bo.getAll()]);
          ((this.inventory = s.data.inventory || []),
            (this.salesRecords = n.data || []),
            (this.creditSalesRecords = i.data || []),
            (this.procurementRecords = o.data || []),
            (this.stats.inventoryValue =
              ((e = s.data.statistics) == null ? void 0 : e.totalValue) || 0),
            (this.stats.inventoryItems =
              ((t = s.data.statistics) == null ? void 0 : t.totalItems) || 0),
            (this.outOfStockItems = s.data.outOfStockItems || []),
            (this.lowStockItems = this.inventory.filter((r) => r.totalTonnageKg < 500)),
            this.buildDashboardData());
        } catch (s) {
          console.error('Error loading data:', s);
        } finally {
          this.loading = !1;
        }
      },
      buildDashboardData() {
        const e = this.getDateRangeByPeriod(this.filters.period);
        this.reportRange = e;
        const t = this.filterRecordsByDate(this.salesRecords, 'date', e),
          s = this.filterRecordsByDate(this.creditSalesRecords, 'dateOfDispatch', e),
          n = this.filterRecordsByDate(this.procurementRecords, 'dateReceived', e);
        ((this.stats.cashSales = t.reduce((i, o) => i + (o.amountPaidUgx || 0), 0)),
          (this.stats.cashCount = t.length),
          (this.stats.creditSales = s.reduce((i, o) => i + (o.amountDueUgx || 0), 0)),
          (this.stats.creditCount = s.length),
          (this.stats.procurementTotal = n.reduce((i, o) => i + (o.costUgx || 0), 0)),
          (this.stats.procurementCount = n.length),
          this.buildCharts(t, s, n));
      },
      getDateRangeByPeriod(e) {
        const t = new Date();
        if (e === 'yearly')
          return {
            from: new Date(t.getFullYear(), t.getMonth() - 11, 1).toISOString(),
            to: t.toISOString()
          };
        const s = e === 'monthly' ? 30 : 7,
          n = new Date(t);
        return (
          n.setHours(0, 0, 0, 0),
          n.setDate(n.getDate() - (s - 1)),
          { from: n.toISOString(), to: t.toISOString() }
        );
      },
      filterRecordsByDate(e, t, s) {
        const n = new Date(s.from),
          i = new Date(s.to);
        return (e || []).filter((o) => {
          const r = new Date(o == null ? void 0 : o[t]);
          return !Number.isNaN(r.getTime()) && r >= n && r <= i;
        });
      },
      buildTrendBuckets(e) {
        const t = new Date(),
          s = [];
        if (e === 'yearly') {
          for (let o = 11; o >= 0; o -= 1) {
            const r = new Date(t.getFullYear(), t.getMonth() - o, 1),
              a = new Date(t.getFullYear(), t.getMonth() - o + 1, 1);
            s.push({
              start: r,
              end: a,
              label: r.toLocaleDateString('en-UG', { month: 'short', year: '2-digit' }),
              amount: 0
            });
          }
          return s;
        }
        const n = e === 'monthly' ? 30 : 7,
          i = new Date(t);
        i.setHours(0, 0, 0, 0);
        for (let o = n - 1; o >= 0; o -= 1) {
          const r = new Date(i);
          r.setDate(i.getDate() - o);
          const a = new Date(r);
          (a.setDate(r.getDate() + 1),
            s.push({
              start: r,
              end: a,
              label:
                e === 'weekly'
                  ? r.toLocaleDateString('en-UG', { weekday: 'short' })
                  : r.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }),
              amount: 0
            }));
        }
        return s;
      },
      addAmountToBuckets(e, t, s) {
        const n = new Date(t);
        if (!Number.isNaN(n.getTime()))
          for (let i = 0; i < e.length; i += 1) {
            const o = e[i];
            if (n >= o.start && n < o.end) {
              o.amount += Number(s || 0);
              return;
            }
          }
      },
      buildCharts(e, t, s) {
        const n = {};
        (e.forEach((g) => {
          n[g.produceName] = (n[g.produceName] || 0) + (g.tonnageKg || 0);
        }),
          t.forEach((g) => {
            n[g.produceName] = (n[g.produceName] || 0) + (g.tonnageKg || 0);
          }));
        const i = Object.keys(n).map((g) => ({ name: g, totalKg: n[g] }));
        (i.sort((g, _) => _.totalKg - g.totalKg), (this.topProducts = i.slice(0, 5)));
        const o = this.inventory
          .map((g) => ({ name: g.produceName, totalKg: g.totalTonnageKg }))
          .sort((g, _) => _.totalKg - g.totalKg)
          .slice(0, 5);
        this.stockByProduct = o;
        const r = t.reduce((g, _) => g + (_.amountPaidUgx || 0), 0),
          a = t.reduce((g, _) => {
            const y =
              _.balanceUgx !== void 0 && _.balanceUgx !== null
                ? _.balanceUgx
                : Math.max((_.amountDueUgx || 0) - (_.amountPaidUgx || 0), 0);
            return g + y;
          }, 0);
        ((this.creditCollection.collected = r), (this.creditCollection.outstanding = a));
        const l = {};
        (e.forEach((g) => {
          l[g.salesAgentName] = (l[g.salesAgentName] || 0) + (g.amountPaidUgx || 0);
        }),
          t.forEach((g) => {
            l[g.salesAgentName] = (l[g.salesAgentName] || 0) + (g.amountDueUgx || 0);
          }));
        const c = Object.keys(l).map((g) => ({ name: g, amount: l[g] }));
        (c.sort((g, _) => _.amount - g.amount), (this.agentPerformance = c.slice(0, 5)));
        const h = {};
        s.forEach((g) => {
          h[g.dealerName] = (h[g.dealerName] || 0) + (g.costUgx || 0);
        });
        const f = Object.keys(h).map((g) => ({ name: g, amount: h[g] }));
        (f.sort((g, _) => _.amount - g.amount), (this.dealerPerformance = f.slice(0, 5)));
        const m = this.buildTrendBuckets(this.filters.period);
        (e.forEach((g) => {
          this.addAmountToBuckets(m, g.date, g.amountPaidUgx || 0);
        }),
          t.forEach((g) => {
            this.addAmountToBuckets(m, g.dateOfDispatch, g.amountDueUgx || 0);
          }),
          (this.salesOverTime = m.map((g) => ({ label: g.label, amount: g.amount }))));
      },
      buildFileName(e) {
        var i;
        const t = sm(this.selectedPeriodLabel),
          s = sm(((i = this.user) == null ? void 0 : i.branch) || 'branch'),
          n = new Date().toISOString().slice(0, 10);
        return `manager_report_${s}_${t}_${n}.${e}`;
      },
      downloadFile(e, t, s) {
        const n = new Blob([t], { type: s }),
          i = URL.createObjectURL(n),
          o = document.createElement('a');
        ((o.href = i),
          (o.download = e),
          document.body.appendChild(o),
          o.click(),
          document.body.removeChild(o),
          URL.revokeObjectURL(i));
      },
      getSummaryRows(e = !1) {
        var n;
        const t = (i) => (e ? Cn(i) : Je(i)),
          s = (i) => (e ? Je(i).toLocaleString('en-UG') : Je(i));
        return [
          ['Branch', ((n = this.user) == null ? void 0 : n.branch) || '-'],
          ['Report Period', this.selectedPeriodLabel],
          ['Date Range', this.formattedReportRange],
          ['Transactions', s(this.totalTransactions)],
          ['Cash Sales (UGX)', t(this.stats.cashSales)],
          ['Credit Sales (UGX)', t(this.stats.creditSales)],
          ['Total Revenue (UGX)', t(this.stats.cashSales + this.stats.creditSales)],
          ['Procurement Total (UGX)', t(this.stats.procurementTotal)],
          ['Procurement Records', s(this.stats.procurementCount)],
          ['Inventory Value (UGX)', t(this.stats.inventoryValue)],
          ['Inventory Items', s(this.stats.inventoryItems)],
          ['Low Stock Items', s(this.lowStockItems.length)],
          ['Credit Collected (UGX)', t(this.creditCollection.collected)],
          ['Credit Outstanding (UGX)', t(this.creditCollection.outstanding)]
        ];
      },
      getSalesTrendRows(e = !1) {
        const t = (s) => (e ? Cn(s) : Je(s));
        return this.salesOverTime.map((s) => [s.label, t(s.amount)]);
      },
      getTopProductsRows(e = !1) {
        const t = (s) => (e ? Je(s).toLocaleString('en-UG') : Je(s));
        return this.topProducts.map((s) => [s.name, t(s.totalKg)]);
      },
      getStockRows(e = !1) {
        const t = (s) => (e ? Je(s).toLocaleString('en-UG') : Je(s));
        return this.stockByProduct.map((s) => [s.name, t(s.totalKg)]);
      },
      getAgentRows(e = !1) {
        const t = (s) => (e ? Cn(s) : Je(s));
        return this.agentPerformance.map((s) => [s.name, t(s.amount)]);
      },
      getDealerRows(e = !1) {
        const t = (s) => (e ? Cn(s) : Je(s));
        return this.dealerPerformance.map((s) => [s.name, t(s.amount)]);
      },
      buildCsvContent() {
        const e = [],
          t = (n, i, o) => {
            (e.push([n]),
              i != null && i.length && e.push(i),
              o.forEach((r) => e.push(r)),
              e.push([]));
          };
        return (
          t('Summary', ['Metric', 'Value'], this.getSummaryRows(!1)),
          t('Sales Trend', ['Period', 'Total Sales (UGX)'], this.getSalesTrendRows(!1)),
          t('Top Products', ['Product', 'Kilograms Sold'], this.getTopProductsRows(!1)),
          t('Stock By Product', ['Product', 'Available Stock (kg)'], this.getStockRows(!1)),
          t('Sales Agent Performance', ['Sales Agent', 'Amount (UGX)'], this.getAgentRows(!1)),
          t('Dealer Performance', ['Dealer', 'Procurement Cost (UGX)'], this.getDealerRows(!1)),
          `\uFEFF${e.map((n) => n.map(TE).join(',')).join(`\r
`)}`
        );
      },
      buildExcelContent() {
        const e = (t, s, n) => {
          const i = Math.max(s.length || 1, ...n.map((a) => a.length || 0), 1),
            o = s.length ? `<tr>${s.map((a) => `<th>${si(a)}</th>`).join('')}</tr>` : '',
            r = n.map((a) => `<tr>${a.map((l) => `<td>${si(l)}</td>`).join('')}</tr>`).join('');
          return `
          <table border="1">
            <tr><th colspan="${i}">${si(t)}</th></tr>
            ${o}
            ${r}
          </table>
          <br />
        `;
        };
        return `
        <html>
          <head>
            <meta charset="UTF-8" />
          </head>
          <body>
            ${e('Summary', ['Metric', 'Value'], this.getSummaryRows(!1))}
            ${e('Sales Trend', ['Period', 'Total Sales (UGX)'], this.getSalesTrendRows(!1))}
            ${e('Top Products', ['Product', 'Kilograms Sold'], this.getTopProductsRows(!1))}
            ${e('Stock By Product', ['Product', 'Available Stock (kg)'], this.getStockRows(!1))}
            ${e('Sales Agent Performance', ['Sales Agent', 'Amount (UGX)'], this.getAgentRows(!1))}
            ${e('Dealer Performance', ['Dealer', 'Procurement Cost (UGX)'], this.getDealerRows(!1))}
          </body>
        </html>
      `;
      },
      buildReportHtml() {
        const e = this.getSummaryRows(!0),
          t = this.getSalesTrendRows(!0),
          s = this.getTopProductsRows(!0),
          n = this.getStockRows(!0),
          i = this.getAgentRows(!0),
          o = this.getDealerRows(!0),
          r = new Date().toLocaleString('en-UG'),
          a = e.map(([_, y]) => `<tr><th>${si(_)}</th><td>${si(y)}</td></tr>`).join(''),
          l = (_, y) =>
            _.length
              ? _.map((x) => `<tr>${x.map((w) => `<td>${si(w)}</td>`).join('')}</tr>`).join('')
              : `<tr><td colspan="${y}">No data</td></tr>`,
          c = l(t, 2),
          h = l(s, 2),
          f = l(n, 2),
          m = l(i, 2),
          g = l(o, 2);
        return `
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Manager Report</title>
            <style>
/* Component styles */
              body { font-family: "Segoe UI", Tahoma, sans-serif; color: #0f172a; margin: 24px; }
              h1 { margin: 0 0 6px; font-size: 22px; }
              h2 { margin: 24px 0 10px; font-size: 16px; color: #1e293b; }
              p { margin: 0 0 16px; color: #64748b; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-align: left; }
              th { background: #f1f5f9; font-weight: 600; }
              .summary th { width: 32%; }
            </style>
          </head>
          <body>
            <h1>Manager Report</h1>
            <p>Generated ${si(r)}</p>

            <h2>Summary</h2>
            <table class="summary">
              <tbody>
                ${a}
              </tbody>
            </table>

            <h2>Sales Trend</h2>
            <table>
              <thead>
                <tr><th>Period</th><th>Total Sales (UGX)</th></tr>
              </thead>
              <tbody>
                ${c}
              </tbody>
            </table>

            <h2>Top Products</h2>
            <table>
              <thead>
                <tr><th>Product</th><th>Kilograms Sold</th></tr>
              </thead>
              <tbody>
                ${h}
              </tbody>
            </table>

            <h2>Stock By Product</h2>
            <table>
              <thead>
                <tr><th>Product</th><th>Available Stock (kg)</th></tr>
              </thead>
              <tbody>
                ${f}
              </tbody>
            </table>

            <h2>Sales Agent Performance</h2>
            <table>
              <thead>
                <tr><th>Sales Agent</th><th>Amount (UGX)</th></tr>
              </thead>
              <tbody>
                ${m}
              </tbody>
            </table>

            <h2>Dealer Performance</h2>
            <table>
              <thead>
                <tr><th>Dealer</th><th>Procurement Cost (UGX)</th></tr>
              </thead>
              <tbody>
                ${g}
              </tbody>
            </table>
          </body>
        </html>
      `;
      },
      exportCsv() {
        const e = this.buildCsvContent();
        this.downloadFile(this.buildFileName('csv'), e, 'text/csv;charset=utf-8');
      },
      exportExcel() {
        const e = this.buildExcelContent();
        this.downloadFile(this.buildFileName('xls'), e, 'application/vnd.ms-excel');
      },
      exportPdf() {
        const e = this.buildReportHtml(),
          t = window.open('', '_blank');
        if (!t) {
          alert('Please allow pop-ups to export the PDF report.');
          return;
        }
        (t.document.open(),
          t.document.write(e),
          t.document.close(),
          t.focus(),
          (t.onafterprint = () => t.close()),
          setTimeout(() => t.print(), 300));
      },
      formatStatCurrency(e) {
        return dl(e);
      }
    }
  },
  PE = { class: 'd-flex flex-wrap justify-content-between align-items-start gap-3 mb-4' },
  OE = { class: 'page-subtitle mb-0' },
  EE = { class: 'dashboard-actions' },
  RE = { class: 'dashboard-filters' },
  DE = { class: 'filter-group' },
  ME = ['value'],
  IE = {
    class: 'export-actions btn-group btn-group-sm',
    role: 'group',
    'aria-label': 'Export report'
  },
  LE = ['disabled'],
  NE = ['disabled'],
  $E = ['disabled'],
  FE = { class: 'card report-card mb-4' },
  BE = { class: 'card-body py-3' },
  UE = { class: 'report-grid' },
  jE = { key: 0, class: 'alert alert-warning alert-dismissible fade show', role: 'alert' },
  VE = { key: 1, class: 'alert alert-danger alert-dismissible fade show', role: 'alert' },
  HE = { class: 'row g-4 mb-4' },
  zE = { class: 'col-xl-3 col-md-6' },
  WE = { class: 'card stats-card h-100' },
  KE = { class: 'card-body' },
  qE = { class: 'stats-value' },
  GE = { class: 'text-muted' },
  XE = { class: 'col-xl-3 col-md-6' },
  YE = { class: 'card stats-card h-100' },
  JE = { class: 'card-body' },
  ZE = { class: 'stats-value' },
  QE = { class: 'text-muted' },
  tR = { class: 'col-xl-3 col-md-6' },
  eR = { class: 'card stats-card h-100' },
  sR = { class: 'card-body' },
  nR = { class: 'stats-value' },
  iR = { class: 'text-muted' },
  oR = { class: 'col-xl-3 col-md-6' },
  rR = { class: 'card stats-card h-100' },
  aR = { class: 'card-body' },
  lR = { class: 'stats-value' },
  cR = { class: 'text-muted' },
  dR = { class: 'col-xl-3 col-md-6' },
  uR = { class: 'card stats-card h-100' },
  hR = { class: 'card-body' },
  fR = { class: 'stats-value' },
  pR = { class: 'text-muted' },
  mR = { class: 'row g-4' },
  gR = { class: 'col-xl-6' },
  bR = { class: 'card chart-card h-100' },
  _R = { class: 'card-body' },
  yR = { key: 0, class: 'chart-empty' },
  vR = { key: 1, class: 'chart-panel chart-panel-sm' },
  xR = { class: 'col-xl-6' },
  wR = { class: 'card chart-card h-100' },
  SR = { class: 'card-body' },
  kR = { key: 0, class: 'chart-empty' },
  CR = { key: 1, class: 'chart-panel chart-panel-sm' },
  TR = { class: 'col-xl-6' },
  AR = { class: 'card chart-card h-100' },
  PR = { class: 'card-header chart-header' },
  OR = { class: 'mb-0' },
  ER = { class: 'card-body' },
  RR = { key: 0, class: 'chart-empty' },
  DR = { key: 1, class: 'chart-panel' },
  MR = { class: 'col-xl-6' },
  IR = { class: 'card chart-card h-100' },
  LR = { class: 'card-body' },
  NR = { key: 0, class: 'chart-empty' },
  $R = { key: 1, class: 'chart-panel' },
  FR = { class: 'col-xl-6' },
  BR = { class: 'card chart-card h-100' },
  UR = { class: 'card-body' },
  jR = { key: 0, class: 'chart-empty' },
  VR = { key: 1, class: 'chart-panel' },
  HR = { class: 'col-xl-6' },
  zR = { class: 'card chart-card h-100' },
  WR = { class: 'card-body' },
  KR = { key: 0, class: 'chart-empty' },
  qR = { key: 1, class: 'chart-panel' },
  GR = { class: 'col-xl-6' },
  XR = { class: 'card chart-card h-100' },
  YR = { class: 'card-body' },
  JR = { key: 0, class: 'chart-empty' },
  ZR = { key: 1, class: 'chart-panel' };
function QR(e, t, s, n, i, o) {
  const r = Ks('Doughnut'),
    a = Ks('LineChart'),
    l = Ks('Bar');
  return (
    R(),
    D('div', null, [
      u('div', PE, [
        u('div', null, [
          t[5] || (t[5] = u('h2', { class: 'page-title mb-1' }, 'Manager Dashboard', -1)),
          u('p', OE, I(i.user.branch) + ' Overview', 1)
        ]),
        u('div', EE, [
          u('div', RE, [
            u('div', DE, [
              t[6] || (t[6] = u('label', { class: 'form-label mb-1' }, 'Period', -1)),
              bt(
                u(
                  'select',
                  {
                    'onUpdate:modelValue': t[0] || (t[0] = (c) => (i.filters.period = c)),
                    class: 'form-select form-select-sm',
                    onChange:
                      t[1] || (t[1] = (...c) => o.buildDashboardData && o.buildDashboardData(...c))
                  },
                  [
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        i.periodOptions,
                        (c) => (
                          R(),
                          D('option', { key: c.value, value: c.value }, I(c.label), 9, ME)
                        )
                      ),
                      128
                    ))
                  ],
                  544
                ),
                [[ks, i.filters.period]]
              )
            ])
          ]),
          u('div', IE, [
            u(
              'button',
              {
                class: 'btn btn-outline-primary',
                type: 'button',
                disabled: i.loading,
                onClick: t[2] || (t[2] = (...c) => o.exportCsv && o.exportCsv(...c))
              },
              ' Export CSV ',
              8,
              LE
            ),
            u(
              'button',
              {
                class: 'btn btn-outline-primary',
                type: 'button',
                disabled: i.loading,
                onClick: t[3] || (t[3] = (...c) => o.exportExcel && o.exportExcel(...c))
              },
              ' Export Excel ',
              8,
              NE
            ),
            u(
              'button',
              {
                class: 'btn btn-outline-primary',
                type: 'button',
                disabled: i.loading,
                onClick: t[4] || (t[4] = (...c) => o.exportPdf && o.exportPdf(...c))
              },
              ' Export PDF ',
              8,
              $E
            )
          ])
        ])
      ]),
      u('div', FE, [
        u('div', BE, [
          u('div', UE, [
            u('div', null, [
              t[7] || (t[7] = u('small', { class: 'text-muted d-block' }, 'Selected Period', -1)),
              u('strong', null, I(o.selectedPeriodLabel), 1)
            ]),
            u('div', null, [
              t[8] || (t[8] = u('small', { class: 'text-muted d-block' }, 'Date Range', -1)),
              u('strong', null, I(o.formattedReportRange), 1)
            ]),
            u('div', null, [
              t[9] || (t[9] = u('small', { class: 'text-muted d-block' }, 'Sales Records', -1)),
              u('strong', null, I(i.stats.cashCount.toLocaleString('en-UG')), 1)
            ]),
            u('div', null, [
              t[10] || (t[10] = u('small', { class: 'text-muted d-block' }, 'Credit Records', -1)),
              u('strong', null, I(i.stats.creditCount.toLocaleString('en-UG')), 1)
            ])
          ])
        ])
      ]),
      i.lowStockItems.length > 0
        ? (R(),
          D('div', jE, [
            t[11] || (t[11] = u('i', { class: 'bi bi-exclamation-triangle me-2' }, null, -1)),
            t[12] || (t[12] = u('strong', null, 'Low Stock Alert!', -1)),
            jt(' ' + I(o.lowStockAlertMessage) + ' ', 1),
            t[13] ||
              (t[13] = u(
                'button',
                { type: 'button', class: 'btn-close', 'data-bs-dismiss': 'alert' },
                null,
                -1
              ))
          ]))
        : mt('', !0),
      i.outOfStockItems.length > 0
        ? (R(),
          D('div', VE, [
            t[14] || (t[14] = u('i', { class: 'bi bi-x-octagon me-2' }, null, -1)),
            t[15] || (t[15] = u('strong', null, 'Out of Stock!', -1)),
            jt(' ' + I(i.outOfStockItems.length) + ' item(s) are out of stock. ', 1),
            t[16] ||
              (t[16] = u(
                'button',
                { type: 'button', class: 'btn-close', 'data-bs-dismiss': 'alert' },
                null,
                -1
              ))
          ]))
        : mt('', !0),
      u('div', HE, [
        u('div', zE, [
          u('div', WE, [
            u('div', KE, [
              t[17] || (t[17] = u('h6', { class: 'text-muted' }, 'Inventory Value', -1)),
              u('h3', qE, I(o.formatStatCurrency(i.stats.inventoryValue)), 1),
              u('small', GE, I(i.stats.inventoryItems) + ' items', 1)
            ])
          ])
        ]),
        u('div', XE, [
          u('div', YE, [
            u('div', JE, [
              t[18] || (t[18] = u('h6', { class: 'text-muted' }, 'Cash Sales', -1)),
              u('h3', ZE, I(o.formatStatCurrency(i.stats.cashSales)), 1),
              u('small', QE, I(i.stats.cashCount) + ' transactions', 1)
            ])
          ])
        ]),
        u('div', tR, [
          u('div', eR, [
            u('div', sR, [
              t[19] || (t[19] = u('h6', { class: 'text-muted' }, 'Credit Sales', -1)),
              u('h3', nR, I(o.formatStatCurrency(i.stats.creditSales)), 1),
              u('small', iR, I(i.stats.creditCount) + ' pending', 1)
            ])
          ])
        ]),
        u('div', oR, [
          u('div', rR, [
            u('div', aR, [
              t[20] || (t[20] = u('h6', { class: 'text-muted' }, 'Total Procurement Cost', -1)),
              u('h3', lR, I(o.formatStatCurrency(i.stats.procurementTotal)), 1),
              u('small', cR, I(i.stats.procurementCount) + ' record(s)', 1)
            ])
          ])
        ]),
        u('div', dR, [
          u('div', uR, [
            u('div', hR, [
              t[21] || (t[21] = u('h6', { class: 'text-muted' }, 'Total Revenue', -1)),
              u('h3', fR, I(o.formatStatCurrency(i.stats.cashSales + i.stats.creditSales)), 1),
              u('small', pR, I(o.totalTransactions) + ' transaction(s)', 1)
            ])
          ])
        ])
      ]),
      u('div', mR, [
        u('div', gR, [
          u('div', bR, [
            t[22] ||
              (t[22] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Revenue Split')],
                -1
              )),
            u('div', _R, [
              o.hasRevenueSplitData
                ? (R(),
                  D('div', vR, [
                    Rt(
                      r,
                      { data: o.revenueSplitChartData, options: i.chartOptions.doughnutCurrency },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
                : (R(), D('div', yR, 'No sales recorded yet'))
            ])
          ])
        ]),
        u('div', xR, [
          u('div', wR, [
            t[23] ||
              (t[23] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Payments Collected vs Outstanding')],
                -1
              )),
            u('div', SR, [
              o.hasCreditCollectionData
                ? (R(),
                  D('div', CR, [
                    Rt(
                      r,
                      {
                        data: o.creditCollectionChartData,
                        options: i.chartOptions.doughnutCurrency
                      },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
                : (R(), D('div', kR, 'No credit sales recorded yet'))
            ])
          ])
        ]),
        u('div', TR, [
          u('div', AR, [
            u('div', PR, [u('h5', OR, 'Sales Over Time (' + I(o.selectedPeriodLabel) + ')', 1)]),
            u('div', ER, [
              o.hasSalesTrendData
                ? (R(),
                  D('div', DR, [
                    Rt(
                      a,
                      { data: o.salesOverTimeChartData, options: i.chartOptions.lineCurrency },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
                : (R(), D('div', RR, 'No sales recorded yet'))
            ])
          ])
        ]),
        u('div', MR, [
          u('div', IR, [
            t[24] ||
              (t[24] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Sales Agent Performance')],
                -1
              )),
            u('div', LR, [
              i.agentPerformance.length === 0
                ? (R(), D('div', NR, 'No sales recorded yet'))
                : (R(),
                  D('div', $R, [
                    Rt(
                      l,
                      {
                        data: o.agentPerformanceChartData,
                        options: i.chartOptions.horizontalBarCurrency
                      },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
            ])
          ])
        ]),
        u('div', FR, [
          u('div', BR, [
            t[25] ||
              (t[25] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Top Products by Tonnage Sold')],
                -1
              )),
            u('div', UR, [
              i.topProducts.length === 0
                ? (R(), D('div', jR, 'No sales recorded yet'))
                : (R(),
                  D('div', VR, [
                    Rt(
                      l,
                      { data: o.topProductsChartData, options: i.chartOptions.barKg },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
            ])
          ])
        ]),
        u('div', HR, [
          u('div', zR, [
            t[26] ||
              (t[26] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Stock by Product')],
                -1
              )),
            u('div', WR, [
              i.stockByProduct.length === 0
                ? (R(), D('div', KR, 'No inventory available'))
                : (R(),
                  D('div', qR, [
                    Rt(
                      l,
                      { data: o.stockByProductChartData, options: i.chartOptions.horizontalBarKg },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
            ])
          ])
        ]),
        u('div', GR, [
          u('div', XR, [
            t[27] ||
              (t[27] = u(
                'div',
                { class: 'card-header chart-header' },
                [u('h5', { class: 'mb-0' }, 'Top Dealers by Procurement Cost')],
                -1
              )),
            u('div', YR, [
              i.dealerPerformance.length === 0
                ? (R(), D('div', JR, 'No procurement recorded yet'))
                : (R(),
                  D('div', ZR, [
                    Rt(
                      l,
                      { data: o.dealerPerformanceChartData, options: i.chartOptions.barCurrency },
                      null,
                      8,
                      ['data', 'options']
                    )
                  ]))
            ])
          ])
        ])
      ])
    ])
  );
}
const tD = we(AE, [
    ['render', QR],
    ['__scopeId', 'data-v-5c1712f9']
  ]),
  eD = {
    name: 'SalesAgentDashboard',
    data() {
      return {
        user: {},
        todayLabel: '',
        midnightTimeout: null,
        midnightInterval: null,
        stats: { cashSales: 0, cashCount: 0, creditSales: 0, creditCount: 0, totalKg: 0 }
      };
    },
    async created() {
      ((this.user = JSON.parse(localStorage.getItem('user'))),
        this.setTodayLabel(),
        await this.loadData(),
        this.scheduleMidnightRefresh());
    },
    beforeUnmount() {
      (this.midnightTimeout && (clearTimeout(this.midnightTimeout), (this.midnightTimeout = null)),
        this.midnightInterval &&
          (clearInterval(this.midnightInterval), (this.midnightInterval = null)));
    },
    methods: {
      async loadData() {
        try {
          const [e, t] = await Promise.all([ll.getAll(), tr.getAll()]),
            { startOfDay: s, endOfDay: n } = this.getTodayRange(),
            i = e.data.filter((r) => {
              if (r.salesAgentName !== this.user.name) return !1;
              const a = new Date(r.date);
              return a >= s && a < n;
            }),
            o = t.data.filter((r) => {
              if (r.salesAgentName !== this.user.name) return !1;
              const a = new Date(r.dateOfDispatch);
              return a >= s && a < n;
            });
          ((this.stats.cashSales = i.reduce((r, a) => r + a.amountPaidUgx, 0)),
            (this.stats.cashCount = i.length),
            (this.stats.creditSales = o.reduce((r, a) => r + a.amountDueUgx, 0)),
            (this.stats.creditCount = o.length),
            (this.stats.totalKg =
              i.reduce((r, a) => r + a.tonnageKg, 0) + o.reduce((r, a) => r + a.tonnageKg, 0)));
        } catch (e) {
          console.error('Error loading data:', e);
        }
      },
      setTodayLabel() {
        this.todayLabel = new Date().toLocaleDateString('en-UG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      scheduleMidnightRefresh() {
        const e = new Date(),
          s = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1).getTime() - e.getTime();
        this.midnightTimeout = setTimeout(() => {
          (this.setTodayLabel(),
            this.loadData(),
            (this.midnightInterval = setInterval(
              () => {
                (this.setTodayLabel(), this.loadData());
              },
              24 * 60 * 60 * 1e3
            )));
        }, s);
      },
      getTodayRange() {
        const e = new Date(),
          t = new Date(e.getFullYear(), e.getMonth(), e.getDate()),
          s = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1);
        return { startOfDay: t, endOfDay: s };
      },
      formatStatCurrency(e) {
        return dl(e);
      },
      formatCompactNumber: cl
    }
  },
  sD = { class: 'text-muted' },
  nD = { class: 'd-flex align-items-center justify-content-between mb-3' },
  iD = { class: 'badge bg-light text-muted' },
  oD = { key: 0, class: 'alert alert-secondary' },
  rD = { key: 1, class: 'row g-4' },
  aD = { class: 'col-md-4' },
  lD = { class: 'card stats-card' },
  cD = { class: 'card-body text-center' },
  dD = { class: 'stats-value' },
  uD = { class: 'text-muted' },
  hD = { class: 'col-md-4' },
  fD = { class: 'card stats-card' },
  pD = { class: 'card-body text-center' },
  mD = { class: 'stats-value' },
  gD = { class: 'text-muted' },
  bD = { class: 'col-md-4' },
  _D = { class: 'card stats-card' },
  yD = { class: 'card-body text-center' },
  vD = { class: 'stats-value' };
function xD(e, t, s, n, i, o) {
  return (
    R(),
    D('div', null, [
      t[8] || (t[8] = u('h2', { class: 'mb-4' }, 'Sales Agent Dashboard', -1)),
      u('p', sD, I(i.user.name) + ' - ' + I(i.user.branch), 1),
      u('div', nD, [
        t[0] || (t[0] = u('h5', { class: 'mb-0' }, "Today's Sales Summary", -1)),
        u('span', iD, I(i.todayLabel), 1)
      ]),
      i.stats.cashCount === 0 && i.stats.creditCount === 0
        ? (R(), D('div', oD, ' No sales recorded today. '))
        : (R(),
          D('div', rD, [
            u('div', aD, [
              u('div', lD, [
                u('div', cD, [
                  t[1] ||
                    (t[1] = u(
                      'i',
                      { class: 'bi bi-cash-coin text-success', style: { 'font-size': '2rem' } },
                      null,
                      -1
                    )),
                  t[2] || (t[2] = u('h6', { class: 'text-muted mt-2' }, 'Cash Sales Today', -1)),
                  u('h3', dD, I(o.formatStatCurrency(i.stats.cashSales)), 1),
                  u('small', uD, I(i.stats.cashCount) + ' transactions', 1)
                ])
              ])
            ]),
            u('div', hD, [
              u('div', fD, [
                u('div', pD, [
                  t[3] ||
                    (t[3] = u(
                      'i',
                      { class: 'bi bi-credit-card text-warning', style: { 'font-size': '2rem' } },
                      null,
                      -1
                    )),
                  t[4] || (t[4] = u('h6', { class: 'text-muted mt-2' }, 'Credit Sales Today', -1)),
                  u('h3', mD, I(o.formatStatCurrency(i.stats.creditSales)), 1),
                  u('small', gD, I(i.stats.creditCount) + ' transactions', 1)
                ])
              ])
            ]),
            u('div', bD, [
              u('div', _D, [
                u('div', yD, [
                  t[5] ||
                    (t[5] = u(
                      'i',
                      { class: 'bi bi-box text-info', style: { 'font-size': '2rem' } },
                      null,
                      -1
                    )),
                  t[6] || (t[6] = u('h6', { class: 'text-muted mt-2' }, 'Total Produce Today', -1)),
                  u('h3', vD, I(o.formatCompactNumber(i.stats.totalKg)) + ' kg', 1),
                  t[7] || (t[7] = u('small', { class: 'text-muted' }, 'Cash + Credit', -1))
                ])
              ])
            ])
          ]))
    ])
  );
}
const wD = we(eD, [
    ['render', xD],
    ['__scopeId', 'data-v-5871e344']
  ]),
  SD = { key: 0, class: 'alert alert-warning' },
  kD = { key: 1, class: 'alert alert-danger mt-3' },
  CD = { key: 2, class: 'alert alert-success mt-3' },
  bl = {
    __name: 'FormAlerts',
    props: {
      stockWarning: { type: String, default: '' },
      error: { type: String, default: '' },
      success: { type: String, default: '' }
    },
    setup(e) {
      return (t, s) => (
        R(),
        D('div', null, [
          e.stockWarning
            ? (R(),
              D('div', SD, [
                s[0] || (s[0] = u('i', { class: 'bi bi-exclamation-triangle me-2' }, null, -1)),
                jt(I(e.stockWarning), 1)
              ]))
            : mt('', !0),
          e.error ? (R(), D('div', kD, I(e.error), 1)) : mt('', !0),
          e.success ? (R(), D('div', CD, I(e.success), 1)) : mt('', !0)
        ])
      );
    }
  },
  TD = { class: 'procurement-form' },
  AD = { class: 'procurement-section mb-3' },
  PD = { class: 'row g-3' },
  OD = { class: 'col-md-6' },
  ED = { class: 'col-md-6' },
  RD = { class: 'col-md-6' },
  DD = { class: 'col-md-3' },
  MD = { class: 'col-md-3' },
  ID = { class: 'procurement-section mb-3' },
  LD = { class: 'row g-3' },
  ND = { class: 'col-md-4' },
  $D = ['min'],
  FD = { class: 'text-muted' },
  BD = { class: 'col-md-4' },
  UD = { class: 'col-md-4' },
  jD = ['readonly'],
  VD = { key: 0, class: 'text-muted' },
  HD = { class: 'procurement-section' },
  zD = { class: 'row g-3' },
  WD = { class: 'col-md-6' },
  KD = { class: 'col-md-6' },
  qD = { class: 'col-md-6' },
  GD = ['value'],
  XD = {
    __name: 'ProcurementFormFields',
    props: _n(
      {
        user: { type: Object, required: !0 },
        priceLocked: { type: Boolean, required: !0 },
        priceLockHint: { type: String, default: 'Price is controlled in Price Management.' }
      },
      { form: { type: Object, required: !0 }, formModifiers: {} }
    ),
    emits: _n(['type-change'], ['update:form']),
    setup(e) {
      const t = (o) => o.replace(/\s+/g, ' ').trim(),
        s = hr(e, 'form'),
        n = (o) => {
          typeof s.value[o] == 'string' && (s.value[o] = t(s.value[o]));
        },
        i = ls(() => (s.value.sourceType === 'individual' ? 1e3 : 1));
      return (o, r) => (
        R(),
        D('div', TD, [
          u('fieldset', AD, [
            r[21] ||
              (r[21] = u(
                'legend',
                { class: 'section-legend' },
                [u('i', { class: 'bi bi-basket2' }), u('span', null, 'Produce Details')],
                -1
              )),
            u('div', PD, [
              u('div', OD, [
                r[13] || (r[13] = u('label', { class: 'form-label' }, 'Produce Name *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'text',
                      class: 'form-control',
                      'onUpdate:modelValue': r[0] || (r[0] = (a) => (s.value.name = a)),
                      minlength: '2',
                      pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$',
                      placeholder: 'e.g. White Maize',
                      onBlur: r[1] || (r[1] = (a) => n('name')),
                      required: ''
                    },
                    null,
                    544
                  ),
                  [[Et, s.value.name]]
                ),
                r[14] ||
                  (r[14] = u(
                    'small',
                    { class: 'text-muted' },
                    'Letters, numbers and spaces are allowed.',
                    -1
                  ))
              ]),
              u('div', ED, [
                r[16] || (r[16] = u('label', { class: 'form-label' }, 'Produce Type *', -1)),
                bt(
                  u(
                    'select',
                    {
                      class: 'form-select',
                      'onUpdate:modelValue': r[2] || (r[2] = (a) => (s.value.type = a)),
                      onChange: r[3] || (r[3] = (a) => o.$emit('type-change')),
                      required: ''
                    },
                    [
                      ...(r[15] ||
                        (r[15] = [
                          Uc(
                            '<option value="" data-v-87cd441b>Select type</option><option value="Beans" data-v-87cd441b>Beans</option><option value="Grain Maize" data-v-87cd441b>Grain Maize</option><option value="Cow peas" data-v-87cd441b>Cow peas</option><option value="G-nuts" data-v-87cd441b>G-nuts</option><option value="Soybeans" data-v-87cd441b>Soybeans</option>',
                            6
                          )
                        ]))
                    ],
                    544
                  ),
                  [[ks, s.value.type]]
                )
              ]),
              u('div', RD, [
                r[18] || (r[18] = u('label', { class: 'form-label' }, 'Source Type *', -1)),
                bt(
                  u(
                    'select',
                    {
                      class: 'form-select',
                      'onUpdate:modelValue': r[4] || (r[4] = (a) => (s.value.sourceType = a)),
                      required: ''
                    },
                    [
                      ...(r[17] ||
                        (r[17] = [
                          u('option', { value: '' }, 'Select source', -1),
                          u('option', { value: 'individual' }, 'Individual Dealer', -1),
                          u('option', { value: 'company' }, 'Company', -1),
                          u('option', { value: 'own_farm' }, 'Own Farm', -1)
                        ]))
                    ],
                    512
                  ),
                  [[ks, s.value.sourceType]]
                )
              ]),
              u('div', DD, [
                r[19] || (r[19] = u('label', { class: 'form-label' }, 'Date *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'date',
                      class: 'form-control',
                      'onUpdate:modelValue': r[5] || (r[5] = (a) => (s.value.dateReceived = a)),
                      required: ''
                    },
                    null,
                    512
                  ),
                  [[Et, s.value.dateReceived]]
                )
              ]),
              u('div', MD, [
                r[20] || (r[20] = u('label', { class: 'form-label' }, 'Time *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'time',
                      class: 'form-control',
                      'onUpdate:modelValue': r[6] || (r[6] = (a) => (s.value.timeReceived = a)),
                      required: ''
                    },
                    null,
                    512
                  ),
                  [[Et, s.value.timeReceived]]
                )
              ])
            ])
          ]),
          u('fieldset', ID, [
            r[25] ||
              (r[25] = u(
                'legend',
                { class: 'section-legend' },
                [u('i', { class: 'bi bi-cash-coin' }), u('span', null, 'Quantity & Pricing')],
                -1
              )),
            u('div', LD, [
              u('div', ND, [
                r[22] || (r[22] = u('label', { class: 'form-label' }, 'Tonnage (kg) *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'number',
                      class: 'form-control',
                      'onUpdate:modelValue': r[7] || (r[7] = (a) => (s.value.tonnageKg = a)),
                      min: i.value,
                      required: ''
                    },
                    null,
                    8,
                    $D
                  ),
                  [[Et, s.value.tonnageKg, void 0, { number: !0 }]]
                ),
                u(
                  'small',
                  FD,
                  I(
                    s.value.sourceType === 'individual'
                      ? 'Minimum 1000 kg for individual dealers.'
                      : 'Enter quantity in kg.'
                  ),
                  1
                )
              ]),
              u('div', BD, [
                r[23] || (r[23] = u('label', { class: 'form-label' }, 'Cost (UGX) *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'number',
                      class: 'form-control',
                      'onUpdate:modelValue': r[8] || (r[8] = (a) => (s.value.costUgx = a)),
                      min: '10000',
                      required: ''
                    },
                    null,
                    512
                  ),
                  [[Et, s.value.costUgx, void 0, { number: !0 }]]
                )
              ]),
              u('div', UD, [
                r[24] ||
                  (r[24] = u('label', { class: 'form-label' }, 'Selling Price per kg (UGX) *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'number',
                      class: 'form-control',
                      'onUpdate:modelValue': r[9] || (r[9] = (a) => (s.value.sellingPrice = a)),
                      min: '10000',
                      required: '',
                      readonly: e.priceLocked
                    },
                    null,
                    8,
                    jD
                  ),
                  [[Et, s.value.sellingPrice, void 0, { number: !0 }]]
                ),
                e.priceLocked ? (R(), D('small', VD, I(e.priceLockHint), 1)) : mt('', !0)
              ])
            ])
          ]),
          u('fieldset', HD, [
            r[29] ||
              (r[29] = u(
                'legend',
                { class: 'section-legend' },
                [u('i', { class: 'bi bi-person-badge' }), u('span', null, 'Dealer Information')],
                -1
              )),
            u('div', zD, [
              u('div', WD, [
                r[26] || (r[26] = u('label', { class: 'form-label' }, 'Dealer Name *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'text',
                      class: 'form-control',
                      'onUpdate:modelValue': r[10] || (r[10] = (a) => (s.value.dealerName = a)),
                      minlength: '2',
                      pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$',
                      placeholder: 'e.g. Lam Traders',
                      onBlur: r[11] || (r[11] = (a) => n('dealerName')),
                      required: ''
                    },
                    null,
                    544
                  ),
                  [[Et, s.value.dealerName]]
                )
              ]),
              u('div', KD, [
                r[27] || (r[27] = u('label', { class: 'form-label' }, 'Dealer Contact *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'text',
                      class: 'form-control',
                      'onUpdate:modelValue': r[12] || (r[12] = (a) => (s.value.dealerContact = a)),
                      pattern: '^(\\+256|0)[0-9]{9}$',
                      placeholder: '+256700000000 or 0700000000',
                      required: ''
                    },
                    null,
                    512
                  ),
                  [[Et, s.value.dealerContact]]
                )
              ]),
              u('div', qD, [
                r[28] || (r[28] = u('label', { class: 'form-label' }, 'Branch', -1)),
                u(
                  'input',
                  {
                    type: 'text',
                    class: 'form-control branch-display',
                    value: e.user.branch,
                    disabled: ''
                  },
                  null,
                  8,
                  GD
                )
              ])
            ])
          ])
        ])
      );
    }
  },
  Gb = we(XD, [['__scopeId', 'data-v-87cd441b']]),
  _l = () => {
    const e = de(!1),
      t = de(''),
      s = de(''),
      n = () => {
        ((t.value = ''), (s.value = ''));
      };
    return {
      loading: e,
      error: t,
      success: s,
      resetFeedback: n,
      beginSubmit: () => {
        ((e.value = !0), n());
      },
      endSubmit: () => {
        e.value = !1;
      },
      setError: (l) => {
        t.value = l;
      },
      setSuccess: (l) => {
        s.value = l;
      }
    };
  },
  Ko = () => ({
    name: '',
    type: '',
    sourceType: '',
    dateReceived: new Date().toISOString().split('T')[0],
    timeReceived: new Date().toTimeString().slice(0, 5),
    tonnageKg: '',
    costUgx: '',
    sellingPrice: '',
    dealerName: '',
    dealerContact: ''
  }),
  Xb = () => {
    const e = de({}),
      t = de(!1);
    return {
      priceSettings: e,
      priceLocked: t,
      loadPrices: async () => {
        try {
          const o = await ko.getAll(),
            r = {};
          (o.data.forEach((a) => {
            r[a.produceType] = a.priceUgx;
          }),
            (e.value = r));
        } catch (o) {
          console.error('Failed to load prices:', o);
        }
      },
      applyPriceSetting: (o) => {
        const r = e.value[o.type];
        r ? ((o.sellingPrice = r), (t.value = !0)) : (t.value = !1);
      },
      clearPriceLock: () => {
        t.value = !1;
      }
    };
  },
  YD = (e) =>
    e === 'individual'
      ? 'Individual'
      : e === 'company'
        ? 'Company'
        : e === 'own_farm'
          ? 'Own Farm'
          : e || '-',
  JD = (e) => {
    if (!e) return '';
    const t = new Date(e);
    return Number.isNaN(t.getTime()) ? '' : t.toISOString().split('T')[0];
  },
  ZD = { class: 'card' },
  QD = { class: 'card-body' },
  tM = { class: 'mt-4' },
  eM = ['disabled'],
  sM = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  nM = ['disabled'],
  iM = {
    __name: 'Procurement',
    setup(e) {
      const t = de({}),
        s = de(Ko()),
        {
          loading: n,
          error: i,
          success: o,
          beginSubmit: r,
          endSubmit: a,
          setError: l,
          setSuccess: c,
          resetFeedback: h
        } = _l(),
        { priceLocked: f, loadPrices: m, applyPriceSetting: g, clearPriceLock: _ } = Xb(),
        y = () => {
          g(s.value);
        },
        x = () => {
          ((s.value = Ko()), _(), h());
        },
        w = async () => {
          var C, T;
          r();
          try {
            (await Bo.create(s.value),
              c('Procurement recorded successfully!'),
              (s.value = Ko()),
              _());
          } catch (E) {
            l(
              ((T = (C = E.response) == null ? void 0 : C.data) == null ? void 0 : T.message) ||
                'Failed to record procurement'
            );
          } finally {
            a();
          }
        };
      return (
        to(async () => {
          ((t.value = JSON.parse(localStorage.getItem('user') || '{}')), await m());
        }),
        (C, T) => (
          R(),
          D('div', null, [
            T[3] || (T[3] = u('h2', { class: 'page-title mb-4' }, 'Record Procurement', -1)),
            u('div', ZD, [
              T[2] ||
                (T[2] = u(
                  'div',
                  { class: 'card-header' },
                  [u('h5', { class: 'mb-0' }, 'Procurement Details')],
                  -1
                )),
              u('div', QD, [
                u(
                  'form',
                  { onSubmit: Es(w, ['prevent']) },
                  [
                    Rt(
                      Gb,
                      {
                        form: s.value,
                        'onUpdate:form': T[0] || (T[0] = (E) => (s.value = E)),
                        user: t.value,
                        'price-locked': Ot(f),
                        'price-lock-hint': 'Price is controlled in Price Management.',
                        onTypeChange: y
                      },
                      null,
                      8,
                      ['form', 'user', 'price-locked']
                    ),
                    Rt(bl, { error: Ot(i), success: Ot(o) }, null, 8, ['error', 'success']),
                    u('div', tM, [
                      u(
                        'button',
                        { type: 'submit', class: 'btn btn-primary', disabled: Ot(n) },
                        [
                          Ot(n) ? (R(), D('span', sM)) : mt('', !0),
                          T[1] || (T[1] = jt(' Record Procurement ', -1))
                        ],
                        8,
                        eM
                      ),
                      u(
                        'button',
                        {
                          type: 'button',
                          class: 'btn btn-outline-secondary ms-2',
                          onClick: x,
                          disabled: Ot(n)
                        },
                        ' Clear ',
                        8,
                        nM
                      )
                    ])
                  ],
                  32
                )
              ])
            ])
          ])
        )
      );
    }
  },
  oM = { class: 'card procurement-card' },
  rM = { class: 'card-header d-flex justify-content-between align-items-center flex-wrap gap-2' },
  aM = { class: 'd-flex gap-2' },
  lM = ['disabled'],
  cM = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  dM = { class: 'card-body' },
  uM = { key: 0, class: 'text-center py-5 text-muted' },
  hM = { key: 1, class: 'table-responsive' },
  fM = { class: 'table table-hover procurement-table align-middle' },
  pM = { class: 'produce-cell' },
  mM = { class: 'fw-semibold text-dark' },
  gM = { class: 'type-cell' },
  bM = { class: 'badge text-bg-light border' },
  _M = { class: 'received-cell' },
  yM = { class: 'fw-semibold' },
  vM = { class: 'text-muted' },
  xM = { class: 'text-end fw-semibold text-nowrap' },
  wM = { class: 'text-end text-nowrap' },
  SM = { class: 'fw-semibold' },
  kM = { class: 'text-muted' },
  CM = { class: 'fw-semibold' },
  TM = { class: 'text-muted' },
  AM = { class: 'text-end' },
  PM = { class: 'btn-group btn-group-sm action-group', role: 'group', 'aria-label': 'Row actions' },
  OM = ['onClick'],
  EM = ['onClick'],
  RM = {
    __name: 'ProcurementRecordsTable',
    props: { procurements: { type: Array, required: !0 }, loading: { type: Boolean, default: !1 } },
    emits: ['refresh', 'edit', 'delete'],
    setup(e) {
      const t = (o) => {
          if (!o) return '-';
          const r = new Date(o);
          return Number.isNaN(r.getTime()) ? '-' : r.toLocaleDateString();
        },
        s = (o) => {
          if (!o) return '-';
          const r = String(o).trim();
          if (!r) return '-';
          const a = new Date(`1970-01-01T${r}`);
          return Number.isNaN(a.getTime())
            ? r
            : a.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        n = (o) => {
          const r = String(o || '').toLowerCase();
          return r === 'own_farm'
            ? 'source-farm'
            : r === 'company'
              ? 'source-company'
              : 'source-individual';
        },
        i = (o) => (o == null ? '-' : Number(o).toLocaleString());
      return (o, r) => {
        const a = Ks('router-link');
        return (
          R(),
          D('div', oM, [
            u('div', rM, [
              r[3] || (r[3] = u('h5', { class: 'mb-0' }, 'All Procurement', -1)),
              u('div', aM, [
                Rt(
                  a,
                  { to: '/dashboard/procurement', class: 'btn btn-primary btn-sm' },
                  {
                    default: Do(() => [...(r[1] || (r[1] = [jt(' Record Procurement ', -1)]))]),
                    _: 1
                  }
                ),
                u(
                  'button',
                  {
                    class: 'btn btn-outline-primary btn-sm',
                    onClick: r[0] || (r[0] = (l) => o.$emit('refresh')),
                    disabled: e.loading
                  },
                  [
                    e.loading ? (R(), D('span', cM)) : mt('', !0),
                    r[2] || (r[2] = jt(' Refresh ', -1))
                  ],
                  8,
                  lM
                )
              ])
            ]),
            u('div', dM, [
              e.procurements.length === 0
                ? (R(), D('div', uM, ' No procurement records found. '))
                : (R(),
                  D('div', hM, [
                    u('table', fM, [
                      r[6] ||
                        (r[6] = u(
                          'thead',
                          null,
                          [
                            u('tr', null, [
                              u('th', null, 'Produce'),
                              u('th', null, 'Type'),
                              u('th', null, 'Source'),
                              u('th', null, 'Received'),
                              u('th', { class: 'text-end' }, 'Quantity (kg)'),
                              u('th', { class: 'text-end' }, 'Value (UGX)'),
                              u('th', null, 'Dealer'),
                              u('th', { class: 'text-end' }, 'Actions')
                            ])
                          ],
                          -1
                        )),
                      u('tbody', null, [
                        (R(!0),
                        D(
                          ne,
                          null,
                          Ce(e.procurements, (l) => {
                            var c;
                            return (
                              R(),
                              D('tr', { key: l._id }, [
                                u('td', pM, [u('div', mM, I(l.name), 1)]),
                                u('td', gM, [u('span', bM, I(l.type), 1)]),
                                u('td', null, [
                                  u(
                                    'span',
                                    { class: vs(['badge source-badge', n(l.sourceType)]) },
                                    I(Ot(YD)(l.sourceType)),
                                    3
                                  )
                                ]),
                                u('td', _M, [
                                  u('div', yM, I(t(l.dateReceived)), 1),
                                  u('small', vM, I(s(l.timeReceived)), 1)
                                ]),
                                u('td', xM, I(i(l.tonnageKg)), 1),
                                u('td', wM, [
                                  u('div', SM, I(i(l.costUgx)), 1),
                                  u('small', kM, 'Price/kg: ' + I(i(l.sellingPrice)), 1)
                                ]),
                                u('td', null, [
                                  u('div', CM, I(l.dealerName), 1),
                                  u(
                                    'small',
                                    TM,
                                    'Recorded by ' +
                                      I(((c = l.recordedBy) == null ? void 0 : c.name) || '-'),
                                    1
                                  )
                                ]),
                                u('td', AM, [
                                  u('div', PM, [
                                    u(
                                      'button',
                                      {
                                        class: 'btn btn-outline-primary',
                                        title: 'Edit',
                                        'aria-label': 'Edit',
                                        onClick: (h) => o.$emit('edit', l)
                                      },
                                      [
                                        ...(r[4] ||
                                          (r[4] = [
                                            u('i', { class: 'bi bi-pencil-square' }, null, -1)
                                          ]))
                                      ],
                                      8,
                                      OM
                                    ),
                                    u(
                                      'button',
                                      {
                                        class: 'btn btn-outline-danger',
                                        title: 'Delete',
                                        'aria-label': 'Delete',
                                        onClick: (h) => o.$emit('delete', l._id)
                                      },
                                      [
                                        ...(r[5] ||
                                          (r[5] = [u('i', { class: 'bi bi-trash' }, null, -1)]))
                                      ],
                                      8,
                                      EM
                                    )
                                  ])
                                ])
                              ])
                            );
                          }),
                          128
                        ))
                      ])
                    ])
                  ]))
            ])
          ])
        );
      };
    }
  },
  DM = we(RM, [['__scopeId', 'data-v-3b87b463']]),
  MM = { key: 0, class: 'card mb-4' },
  IM = { class: 'card-body' },
  LM = { class: 'mt-4' },
  NM = ['disabled'],
  $M = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  FM = ['disabled'],
  BM = {
    __name: 'ProcurementRecords',
    setup(e) {
      const t = de({}),
        s = de([]),
        n = de(!1),
        i = de(null),
        o = de(Ko()),
        {
          loading: r,
          error: a,
          success: l,
          beginSubmit: c,
          endSubmit: h,
          setError: f,
          setSuccess: m,
          resetFeedback: g
        } = _l(),
        { priceLocked: _, loadPrices: y, applyPriceSetting: x, clearPriceLock: w } = Xb(),
        C = () => {
          x(o.value);
        },
        T = () => {
          ((o.value = Ko()), w());
        },
        E = async () => {
          var G, et;
          n.value = !0;
          try {
            const ot = await Bo.getAll();
            s.value = ot.data;
          } catch (ot) {
            f(
              ((et = (G = ot.response) == null ? void 0 : G.data) == null ? void 0 : et.message) ||
                'Failed to load procurement records'
            );
          } finally {
            n.value = !1;
          }
        },
        M = (G) => {
          ((i.value = G._id),
            (o.value = {
              name: G.name || '',
              type: G.type || '',
              sourceType: G.sourceType || '',
              dateReceived: JD(G.dateReceived),
              timeReceived: G.timeReceived || '',
              tonnageKg: G.tonnageKg || '',
              costUgx: G.costUgx || '',
              dealerName: G.dealerName || '',
              dealerContact: G.dealerContact || '',
              sellingPrice: G.sellingPrice || ''
            }),
            x(o.value),
            g());
        },
        H = () => {
          ((i.value = null), T(), g());
        },
        $ = async () => {
          var G, et;
          if (i.value) {
            c();
            try {
              (await Bo.update(i.value, o.value),
                m('Procurement updated successfully!'),
                (i.value = null),
                T(),
                await E());
            } catch (ot) {
              f(
                ((et = (G = ot.response) == null ? void 0 : G.data) == null
                  ? void 0
                  : et.message) || 'Failed to update procurement'
              );
            } finally {
              h();
            }
          }
        },
        X = async (G) => {
          var et, ot;
          if (confirm('Delete this procurement record?')) {
            g();
            try {
              (await Bo.delete(G),
                m('Procurement record deleted.'),
                i.value === G && H(),
                await E());
            } catch (Z) {
              f(
                ((ot = (et = Z.response) == null ? void 0 : et.data) == null
                  ? void 0
                  : ot.message) || 'Failed to delete procurement'
              );
            }
          }
        };
      return (
        to(async () => {
          ((t.value = JSON.parse(localStorage.getItem('user') || '{}')), await y(), await E());
        }),
        (G, et) => (
          R(),
          D('div', null, [
            et[3] || (et[3] = u('h2', { class: 'page-title mb-4' }, 'Procurement Records', -1)),
            i.value
              ? (R(),
                D('div', MM, [
                  et[2] ||
                    (et[2] = u(
                      'div',
                      { class: 'card-header' },
                      [u('h5', { class: 'mb-0' }, 'Update Procurement')],
                      -1
                    )),
                  u('div', IM, [
                    u(
                      'form',
                      { onSubmit: Es($, ['prevent']) },
                      [
                        Rt(
                          Gb,
                          {
                            form: o.value,
                            'onUpdate:form': et[0] || (et[0] = (ot) => (o.value = ot)),
                            user: t.value,
                            'price-locked': Ot(_),
                            'price-lock-hint': 'Price is controlled in Price Management.',
                            onTypeChange: C
                          },
                          null,
                          8,
                          ['form', 'user', 'price-locked']
                        ),
                        Rt(bl, { error: Ot(a), success: Ot(l) }, null, 8, ['error', 'success']),
                        u('div', LM, [
                          u(
                            'button',
                            { type: 'submit', class: 'btn btn-primary', disabled: Ot(r) },
                            [
                              Ot(r) ? (R(), D('span', $M)) : mt('', !0),
                              et[1] || (et[1] = jt(' Update Procurement ', -1))
                            ],
                            8,
                            NM
                          ),
                          u(
                            'button',
                            {
                              type: 'button',
                              class: 'btn btn-outline-secondary ms-2',
                              disabled: Ot(r),
                              onClick: H
                            },
                            ' Cancel Edit ',
                            8,
                            FM
                          )
                        ])
                      ],
                      32
                    )
                  ])
                ]))
              : mt('', !0),
            Rt(
              DM,
              { procurements: s.value, loading: n.value, onRefresh: E, onEdit: M, onDelete: X },
              null,
              8,
              ['procurements', 'loading']
            )
          ])
        )
      );
    }
  },
  Yb = () => {
    const e = de('');
    return {
      stockWarning: e,
      evaluateStock: (s, n, i, o = '') => {
        const r = Number(i);
        if (!n || !r || Number.isNaN(r)) return ((e.value = ''), { item: null, amount: '' });
        const a = s.find((l) => l.produceName === n && (!o || l.produceType === o));
        return a
          ? ((e.value =
              r > a.totalTonnageKg
                ? `Insufficient stock. Only ${a.totalTonnageKg} kg available.`
                : ''),
            { item: a, amount: a.sellingPrice * r })
          : ((e.value = ''), { item: null, amount: '' });
      }
    };
  },
  UM = { class: 'sales-form' },
  jM = { class: 'sales-section mb-3' },
  VM = { class: 'row g-3' },
  HM = { class: 'col-md-6' },
  zM = ['value'],
  WM = { class: 'col-md-6' },
  KM = { class: 'col-md-6' },
  qM = { class: 'col-md-6' },
  GM = { class: 'sales-section' },
  XM = { class: 'row g-3' },
  YM = { class: 'col-md-6' },
  JM = { class: 'col-md-6' },
  ZM = { class: 'col-md-6' },
  QM = ['value'],
  t2 = { class: 'col-md-6' },
  e2 = ['value'],
  s2 = {
    __name: 'SalesDetailsSection',
    props: _n(
      { inventory: { type: Array, required: !0 }, user: { type: Object, required: !0 } },
      { form: { type: Object, required: !0 }, formModifiers: {} }
    ),
    emits: _n(['produce-change', 'tonnage-input'], ['update:form']),
    setup(e) {
      const t = (i) => i.replace(/\s+/g, ' ').trim(),
        s = hr(e, 'form'),
        n = (i) => {
          typeof s.value[i] == 'string' && (s.value[i] = t(s.value[i]));
        };
      return (i, o) => (
        R(),
        D('div', UM, [
          u('fieldset', jM, [
            o[15] ||
              (o[15] = u(
                'legend',
                { class: 'section-legend' },
                [u('i', { class: 'bi bi-cart-check' }), u('span', null, 'Sale Details')],
                -1
              )),
            u('div', VM, [
              u('div', HM, [
                o[10] || (o[10] = u('label', { class: 'form-label' }, 'Produce Name *', -1)),
                bt(
                  u(
                    'select',
                    {
                      class: 'form-select',
                      'onUpdate:modelValue': o[0] || (o[0] = (r) => (s.value.produceName = r)),
                      onChange: o[1] || (o[1] = (r) => i.$emit('produce-change')),
                      required: ''
                    },
                    [
                      o[9] || (o[9] = u('option', { value: '' }, 'Select produce', -1)),
                      (R(!0),
                      D(
                        ne,
                        null,
                        Ce(
                          e.inventory,
                          (r) => (
                            R(),
                            D(
                              'option',
                              { key: `${r.produceName}-${r.produceType}`, value: r.produceName },
                              I(r.produceName) +
                                ' (' +
                                I(r.produceType) +
                                ') - ' +
                                I(r.totalTonnageKg) +
                                ' kg available ',
                              9,
                              zM
                            )
                          )
                        ),
                        128
                      ))
                    ],
                    544
                  ),
                  [[ks, s.value.produceName]]
                )
              ]),
              u('div', WM, [
                o[11] || (o[11] = u('label', { class: 'form-label' }, 'Tonnage (kg) *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'number',
                      class: 'form-control',
                      'onUpdate:modelValue': o[2] || (o[2] = (r) => (s.value.tonnageKg = r)),
                      onInput: o[3] || (o[3] = (r) => i.$emit('tonnage-input')),
                      min: '1',
                      required: ''
                    },
                    null,
                    544
                  ),
                  [[Et, s.value.tonnageKg]]
                )
              ]),
              u('div', KM, [
                o[12] || (o[12] = u('label', { class: 'form-label' }, 'Amount Paid (UGX) *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'number',
                      class: 'form-control',
                      'onUpdate:modelValue': o[4] || (o[4] = (r) => (s.value.amountPaidUgx = r)),
                      min: '10000',
                      required: '',
                      readonly: ''
                    },
                    null,
                    512
                  ),
                  [[Et, s.value.amountPaidUgx]]
                ),
                o[13] ||
                  (o[13] = u(
                    'small',
                    { class: 'text-muted' },
                    'Price is determined by manager.',
                    -1
                  ))
              ]),
              u('div', qM, [
                o[14] || (o[14] = u('label', { class: 'form-label' }, 'Buyer Name *', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'text',
                      class: 'form-control',
                      'onUpdate:modelValue': o[5] || (o[5] = (r) => (s.value.buyerName = r)),
                      minlength: '2',
                      pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$',
                      onBlur: o[6] || (o[6] = (r) => n('buyerName')),
                      required: ''
                    },
                    null,
                    544
                  ),
                  [[Et, s.value.buyerName]]
                )
              ])
            ])
          ]),
          u('fieldset', GM, [
            o[20] ||
              (o[20] = u(
                'legend',
                { class: 'section-legend' },
                [
                  u('i', { class: 'bi bi-calendar2-week' }),
                  u('span', null, 'Transaction Information')
                ],
                -1
              )),
            u('div', XM, [
              u('div', YM, [
                o[16] || (o[16] = u('label', { class: 'form-label' }, 'Date', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'date',
                      class: 'form-control',
                      'onUpdate:modelValue': o[7] || (o[7] = (r) => (s.value.date = r)),
                      required: ''
                    },
                    null,
                    512
                  ),
                  [[Et, s.value.date]]
                )
              ]),
              u('div', JM, [
                o[17] || (o[17] = u('label', { class: 'form-label' }, 'Time', -1)),
                bt(
                  u(
                    'input',
                    {
                      type: 'time',
                      class: 'form-control',
                      'onUpdate:modelValue': o[8] || (o[8] = (r) => (s.value.time = r)),
                      required: ''
                    },
                    null,
                    512
                  ),
                  [[Et, s.value.time]]
                )
              ]),
              u('div', ZM, [
                o[18] || (o[18] = u('label', { class: 'form-label' }, 'Sales Agent', -1)),
                u(
                  'input',
                  {
                    type: 'text',
                    class: 'form-control branch-display',
                    value: e.user.name,
                    disabled: ''
                  },
                  null,
                  8,
                  QM
                )
              ]),
              u('div', t2, [
                o[19] || (o[19] = u('label', { class: 'form-label' }, 'Branch', -1)),
                u(
                  'input',
                  {
                    type: 'text',
                    class: 'form-control branch-display',
                    value: e.user.branch,
                    disabled: ''
                  },
                  null,
                  8,
                  e2
                )
              ])
            ])
          ])
        ])
      );
    }
  },
  n2 = we(s2, [['__scopeId', 'data-v-f269bac9']]),
  i2 = { class: 'card' },
  o2 = { class: 'card-body' },
  r2 = { class: 'mt-4' },
  a2 = ['disabled'],
  l2 = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  c2 = ['disabled'],
  d2 = { key: 0, class: 'modal-mask' },
  u2 = { class: 'modal-card sale-review-modal' },
  h2 = { class: 'modal-header' },
  f2 = ['disabled'],
  p2 = { class: 'modal-body' },
  m2 = { class: 'sale-summary card border-0 mb-3' },
  g2 = { class: 'card-body py-2 px-3' },
  b2 = { class: 'row g-2' },
  _2 = { class: 'col-md-6' },
  y2 = { class: 'col-md-6' },
  v2 = { class: 'col-md-6' },
  x2 = { class: 'col-md-6' },
  w2 = { class: 'mt-4 d-flex justify-content-end gap-2' },
  S2 = ['disabled'],
  k2 = ['disabled'],
  C2 = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  T2 = {
    __name: 'Sales',
    setup(e) {
      const t = de({}),
        s = de([]),
        n = de(_()),
        i = de(!1),
        {
          loading: o,
          error: r,
          success: a,
          beginSubmit: l,
          endSubmit: c,
          setError: h,
          setSuccess: f
        } = _l(),
        { stockWarning: m, evaluateStock: g } = Yb();
      function _() {
        return {
          produceName: '',
          produceType: '',
          tonnageKg: '',
          amountPaidUgx: '',
          buyerName: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        };
      }
      const y = async () => {
          try {
            const H = await yr.get();
            s.value = H.data.inventory;
          } catch (H) {
            console.error('Error loading inventory:', H);
          }
        },
        x = () => {
          var $;
          let H = g(s.value, n.value.produceName, n.value.tonnageKg, n.value.produceType);
          (!H.item &&
            n.value.produceType &&
            (H = g(s.value, n.value.produceName, n.value.tonnageKg)),
            (n.value.produceType = (($ = H.item) == null ? void 0 : $.produceType) || ''),
            (n.value.amountPaidUgx = H.amount || ''));
        },
        w = () => {
          ((n.value = _()), (m.value = ''));
        },
        C = () => {
          if (m.value) {
            h(m.value);
            return;
          }
          if (!n.value.produceName || !n.value.tonnageKg || !n.value.buyerName) {
            h('Please complete all required sale fields before review.');
            return;
          }
          i.value = !0;
        },
        T = () => {
          o.value || (i.value = !1);
        },
        E = async () => {
          var H, $;
          if (m.value) {
            h(m.value);
            return;
          }
          l();
          try {
            (await ll.create(n.value),
              f('Sale recorded successfully!'),
              (i.value = !1),
              w(),
              await y());
          } catch (X) {
            h(
              (($ = (H = X.response) == null ? void 0 : H.data) == null ? void 0 : $.message) ||
                'Failed to record sale'
            );
          } finally {
            c();
          }
        },
        M = (H) =>
          new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0
          }).format(Number(H || 0));
      return (
        to(async () => {
          ((t.value = JSON.parse(localStorage.getItem('user') || '{}')), await y());
        }),
        (H, $) => (
          R(),
          D('div', null, [
            $[9] || ($[9] = u('h2', { class: 'page-title mb-4' }, 'Record Sale', -1)),
            u('div', i2, [
              $[2] ||
                ($[2] = u(
                  'div',
                  { class: 'card-header' },
                  [u('h5', { class: 'mb-0' }, 'Sale Details')],
                  -1
                )),
              u('div', o2, [
                u(
                  'form',
                  { onSubmit: Es(C, ['prevent']) },
                  [
                    Rt(
                      n2,
                      {
                        form: n.value,
                        'onUpdate:form': $[0] || ($[0] = (X) => (n.value = X)),
                        inventory: s.value,
                        user: t.value,
                        onProduceChange: x,
                        onTonnageInput: x
                      },
                      null,
                      8,
                      ['form', 'inventory', 'user']
                    ),
                    Rt(bl, { 'stock-warning': Ot(m), error: Ot(r), success: Ot(a) }, null, 8, [
                      'stock-warning',
                      'error',
                      'success'
                    ]),
                    u('div', r2, [
                      u(
                        'button',
                        { type: 'submit', class: 'btn btn-primary', disabled: Ot(o) },
                        [
                          Ot(o) ? (R(), D('span', l2)) : mt('', !0),
                          $[1] || ($[1] = jt(' Record Sale ', -1))
                        ],
                        8,
                        a2
                      ),
                      u(
                        'button',
                        {
                          type: 'button',
                          class: 'btn btn-danger ms-2',
                          disabled: Ot(o),
                          onClick: w
                        },
                        ' Clear Form ',
                        8,
                        c2
                      )
                    ])
                  ],
                  32
                )
              ])
            ]),
            i.value
              ? (R(),
                D('div', d2, [
                  u('div', u2, [
                    u('div', h2, [
                      $[3] || ($[3] = u('h5', { class: 'mb-0' }, 'Review Cash Sale', -1)),
                      u(
                        'button',
                        { type: 'button', class: 'btn-close', disabled: Ot(o), onClick: T },
                        null,
                        8,
                        f2
                      )
                    ]),
                    u('div', p2, [
                      u('div', m2, [
                        u('div', g2, [
                          u('div', b2, [
                            u('div', _2, [
                              $[4] ||
                                ($[4] = u(
                                  'small',
                                  { class: 'text-muted d-block' },
                                  'Produce Name',
                                  -1
                                )),
                              u('strong', null, I(n.value.produceName || '-'), 1)
                            ]),
                            u('div', y2, [
                              $[5] ||
                                ($[5] = u(
                                  'small',
                                  { class: 'text-muted d-block' },
                                  'Buyer Name',
                                  -1
                                )),
                              u('strong', null, I(n.value.buyerName || '-'), 1)
                            ]),
                            u('div', v2, [
                              $[6] ||
                                ($[6] = u('small', { class: 'text-muted d-block' }, 'Tonnage', -1)),
                              u(
                                'strong',
                                null,
                                I(Number(n.value.tonnageKg || 0).toLocaleString()) + ' kg',
                                1
                              )
                            ]),
                            u('div', x2, [
                              $[7] ||
                                ($[7] = u(
                                  'small',
                                  { class: 'text-muted d-block' },
                                  'Cash Amount',
                                  -1
                                )),
                              u('strong', null, I(M(n.value.amountPaidUgx)), 1)
                            ])
                          ])
                        ])
                      ]),
                      u('div', w2, [
                        u(
                          'button',
                          {
                            type: 'button',
                            class: 'btn btn-outline-secondary',
                            disabled: Ot(o),
                            onClick: T
                          },
                          ' Back ',
                          8,
                          S2
                        ),
                        u(
                          'button',
                          { type: 'button', class: 'btn btn-primary', disabled: Ot(o), onClick: E },
                          [
                            Ot(o) ? (R(), D('span', C2)) : mt('', !0),
                            $[8] || ($[8] = jt(' Save Cash Sale ', -1))
                          ],
                          8,
                          k2
                        )
                      ])
                    ])
                  ])
                ]))
              : mt('', !0)
          ])
        )
      );
    }
  },
  A2 = we(T2, [['__scopeId', 'data-v-7387621d']]),
  P2 = { class: 'credit-section mb-3' },
  O2 = { class: 'row g-3' },
  E2 = { class: 'col-md-6' },
  R2 = ['value'],
  D2 = { class: 'mt-2' },
  M2 = { key: 0, class: 'text-muted' },
  I2 = { key: 1, class: 'text-muted' },
  L2 = { class: 'col-md-6' },
  N2 = { class: 'col-md-6' },
  $2 = { class: 'col-md-6' },
  F2 = {
    __name: 'CreditBuyerSection',
    props: _n(
      {
        trustedBuyers: { type: Array, required: !0 },
        canManageBuyers: { type: Boolean, required: !0 }
      },
      { form: { type: Object, required: !0 }, formModifiers: {} }
    ),
    emits: _n(['buyer-change'], ['update:form']),
    setup(e) {
      const t = hr(e, 'form');
      return (s, n) => (
        R(),
        D('fieldset', P2, [
          n[10] ||
            (n[10] = u(
              'legend',
              { class: 'section-legend' },
              [u('i', { class: 'bi bi-person-vcard' }), u('span', null, 'Buyer Information')],
              -1
            )),
          u('div', O2, [
            u('div', E2, [
              n[6] || (n[6] = u('label', { class: 'form-label' }, 'Trusted Buyer *', -1)),
              bt(
                u(
                  'select',
                  {
                    class: 'form-select',
                    'onUpdate:modelValue': n[0] || (n[0] = (i) => (t.value.trustedBuyerId = i)),
                    onChange: n[1] || (n[1] = (i) => s.$emit('buyer-change')),
                    required: ''
                  },
                  [
                    n[5] || (n[5] = u('option', { value: '' }, 'Select trusted buyer', -1)),
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        e.trustedBuyers,
                        (i) => (
                          R(),
                          D(
                            'option',
                            { key: i._id, value: i._id },
                            I(i.name) + ' (' + I(i.nationalId) + ') ',
                            9,
                            R2
                          )
                        )
                      ),
                      128
                    ))
                  ],
                  544
                ),
                [[ks, t.value.trustedBuyerId]]
              ),
              u('div', D2, [
                e.canManageBuyers
                  ? (R(), D('small', M2, ' Manage trusted buyers in the Trusted Buyers page. '))
                  : (R(), D('small', I2, 'Trusted buyers are managed by the manager.'))
              ])
            ]),
            u('div', L2, [
              n[7] || (n[7] = u('label', { class: 'form-label' }, 'National ID (NIN)', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'text',
                    class: 'form-control branch-display',
                    'onUpdate:modelValue': n[2] || (n[2] = (i) => (t.value.nationalId = i)),
                    disabled: ''
                  },
                  null,
                  512
                ),
                [[Et, t.value.nationalId]]
              )
            ]),
            u('div', N2, [
              n[8] || (n[8] = u('label', { class: 'form-label' }, 'Location', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'text',
                    class: 'form-control branch-display',
                    'onUpdate:modelValue': n[3] || (n[3] = (i) => (t.value.location = i)),
                    disabled: ''
                  },
                  null,
                  512
                ),
                [[Et, t.value.location]]
              )
            ]),
            u('div', $2, [
              n[9] || (n[9] = u('label', { class: 'form-label' }, 'Contact', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'text',
                    class: 'form-control branch-display',
                    'onUpdate:modelValue': n[4] || (n[4] = (i) => (t.value.contact = i)),
                    disabled: ''
                  },
                  null,
                  512
                ),
                [[Et, t.value.contact]]
              )
            ])
          ])
        ])
      );
    }
  },
  B2 = we(F2, [['__scopeId', 'data-v-dfc70b08']]),
  U2 = { class: 'credit-section mb-3' },
  j2 = { class: 'row g-3' },
  V2 = { class: 'col-md-6' },
  H2 = ['value'],
  z2 = { class: 'col-md-6' },
  W2 = { class: 'col-md-6' },
  K2 = { class: 'col-md-6' },
  q2 = {
    __name: 'CreditProduceSection',
    props: _n(
      { inventory: { type: Array, required: !0 } },
      { form: { type: Object, required: !0 }, formModifiers: {} }
    ),
    emits: _n(['produce-change', 'tonnage-input'], ['update:form']),
    setup(e) {
      const t = hr(e, 'form');
      return (s, n) => (
        R(),
        D('fieldset', U2, [
          n[12] ||
            (n[12] = u(
              'legend',
              { class: 'section-legend' },
              [u('i', { class: 'bi bi-box-seam' }), u('span', null, 'Produce Information')],
              -1
            )),
          u('div', j2, [
            u('div', V2, [
              n[7] || (n[7] = u('label', { class: 'form-label' }, 'Produce Name *', -1)),
              bt(
                u(
                  'select',
                  {
                    class: 'form-select',
                    'onUpdate:modelValue': n[0] || (n[0] = (i) => (t.value.produceName = i)),
                    onChange: n[1] || (n[1] = (i) => s.$emit('produce-change')),
                    required: ''
                  },
                  [
                    n[6] || (n[6] = u('option', { value: '' }, 'Select produce', -1)),
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        e.inventory,
                        (i) => (
                          R(),
                          D(
                            'option',
                            { key: `${i.produceName}-${i.produceType}`, value: i.produceName },
                            I(i.produceName) +
                              ' (' +
                              I(i.produceType) +
                              ') - ' +
                              I(i.totalTonnageKg) +
                              ' kg ',
                            9,
                            H2
                          )
                        )
                      ),
                      128
                    ))
                  ],
                  544
                ),
                [[ks, t.value.produceName]]
              )
            ]),
            u('div', z2, [
              n[8] || (n[8] = u('label', { class: 'form-label' }, 'Produce Type', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'text',
                    class: 'form-control branch-display',
                    'onUpdate:modelValue': n[2] || (n[2] = (i) => (t.value.produceType = i)),
                    disabled: ''
                  },
                  null,
                  512
                ),
                [[Et, t.value.produceType]]
              )
            ]),
            u('div', W2, [
              n[9] || (n[9] = u('label', { class: 'form-label' }, 'Tonnage (kg) *', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'number',
                    class: 'form-control',
                    'onUpdate:modelValue': n[3] || (n[3] = (i) => (t.value.tonnageKg = i)),
                    onInput: n[4] || (n[4] = (i) => s.$emit('tonnage-input')),
                    min: '1',
                    required: ''
                  },
                  null,
                  544
                ),
                [[Et, t.value.tonnageKg]]
              )
            ]),
            u('div', K2, [
              n[10] || (n[10] = u('label', { class: 'form-label' }, 'Amount Due (UGX) *', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'number',
                    class: 'form-control',
                    'onUpdate:modelValue': n[5] || (n[5] = (i) => (t.value.amountDueUgx = i)),
                    min: '10000',
                    required: '',
                    readonly: ''
                  },
                  null,
                  512
                ),
                [[Et, t.value.amountDueUgx]]
              ),
              n[11] ||
                (n[11] = u('small', { class: 'text-muted' }, 'Price is determined by manager.', -1))
            ])
          ])
        ])
      );
    }
  },
  G2 = we(q2, [['__scopeId', 'data-v-f4e82983']]),
  X2 = { class: 'credit-section' },
  Y2 = { class: 'row g-3' },
  J2 = { class: 'col-md-6' },
  Z2 = ['min'],
  Q2 = { class: 'col-md-6' },
  tI = { class: 'col-md-6' },
  eI = ['value'],
  sI = { class: 'col-md-6' },
  nI = ['value'],
  iI = {
    __name: 'CreditDispatchSection',
    props: _n(
      { user: { type: Object, required: !0 } },
      { form: { type: Object, required: !0 }, formModifiers: {} }
    ),
    emits: ['update:form'],
    setup(e) {
      const t = hr(e, 'form'),
        s = new Date().toISOString().split('T')[0];
      return (n, i) => (
        R(),
        D('fieldset', X2, [
          i[6] ||
            (i[6] = u(
              'legend',
              { class: 'section-legend' },
              [u('i', { class: 'bi bi-calendar2-check' }), u('span', null, 'Payment & Dispatch')],
              -1
            )),
          u('div', Y2, [
            u('div', J2, [
              i[2] || (i[2] = u('label', { class: 'form-label' }, 'Due Date *', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'date',
                    class: 'form-control',
                    'onUpdate:modelValue': i[0] || (i[0] = (o) => (t.value.dueDate = o)),
                    min: Ot(s),
                    required: ''
                  },
                  null,
                  8,
                  Z2
                ),
                [[Et, t.value.dueDate]]
              )
            ]),
            u('div', Q2, [
              i[3] || (i[3] = u('label', { class: 'form-label' }, 'Date of Dispatch', -1)),
              bt(
                u(
                  'input',
                  {
                    type: 'date',
                    class: 'form-control',
                    'onUpdate:modelValue': i[1] || (i[1] = (o) => (t.value.dateOfDispatch = o)),
                    required: ''
                  },
                  null,
                  512
                ),
                [[Et, t.value.dateOfDispatch]]
              )
            ]),
            u('div', tI, [
              i[4] || (i[4] = u('label', { class: 'form-label' }, 'Sales Agent', -1)),
              u(
                'input',
                {
                  type: 'text',
                  class: 'form-control branch-display',
                  value: e.user.name,
                  disabled: ''
                },
                null,
                8,
                eI
              )
            ]),
            u('div', sI, [
              i[5] || (i[5] = u('label', { class: 'form-label' }, 'Branch', -1)),
              u(
                'input',
                {
                  type: 'text',
                  class: 'form-control branch-display',
                  value: e.user.branch,
                  disabled: ''
                },
                null,
                8,
                nI
              )
            ])
          ])
        ])
      );
    }
  },
  oI = we(iI, [['__scopeId', 'data-v-82448737']]),
  rI = { class: 'card' },
  aI = { class: 'card-body' },
  lI = { class: 'mt-4' },
  cI = ['disabled'],
  dI = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  uI = ['disabled'],
  hI = { key: 0, class: 'modal-mask' },
  fI = { class: 'modal-card credit-review-modal' },
  pI = { class: 'modal-header' },
  mI = ['disabled'],
  gI = { class: 'modal-body' },
  bI = { class: 'credit-summary card border-0 mb-3' },
  _I = { class: 'card-body py-2 px-3' },
  yI = { class: 'row g-2' },
  vI = { class: 'col-md-4' },
  xI = { class: 'col-md-4' },
  wI = { class: 'col-md-4' },
  SI = { class: 'row g-3' },
  kI = { class: 'col-md-6' },
  CI = ['value'],
  TI = { class: 'col-md-6' },
  AI = ['value'],
  PI = { class: 'col-md-6' },
  OI = { class: 'col-md-6' },
  EI = ['value'],
  RI = { class: 'col-md-6' },
  DI = ['min'],
  MI = { class: 'col-md-6' },
  II = { class: 'mt-4 d-flex justify-content-end gap-2' },
  LI = ['disabled'],
  NI = ['disabled'],
  $I = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  FI = {
    __name: 'CreditSales',
    setup(e) {
      const t = de({}),
        s = de([]),
        n = de([]),
        i = de(w()),
        o = de(!1),
        r = new Date().toISOString().split('T')[0],
        {
          loading: a,
          error: l,
          success: c,
          beginSubmit: h,
          endSubmit: f,
          setError: m,
          setSuccess: g
        } = _l(),
        { stockWarning: _, evaluateStock: y } = Yb(),
        x = ls(() => t.value.role === 'manager');
      function w() {
        return {
          trustedBuyerId: '',
          buyerName: '',
          nationalId: '',
          location: '',
          contact: '',
          produceName: '',
          produceType: '',
          tonnageKg: '',
          amountDueUgx: '',
          dueDate: '',
          dateOfDispatch: new Date().toISOString().split('T')[0]
        };
      }
      const C = async () => {
          try {
            const Z = await yr.get();
            n.value = Z.data.inventory;
          } catch (Z) {
            console.error('Error loading inventory:', Z);
          }
        },
        T = async () => {
          try {
            const Z = await So.getAll();
            s.value = Z.data;
          } catch (Z) {
            console.error('Error loading trusted buyers:', Z);
          }
        },
        E = () => {
          const Z = s.value.find((q) => q._id === i.value.trustedBuyerId);
          if (!Z) {
            ((i.value.buyerName = ''),
              (i.value.nationalId = ''),
              (i.value.location = ''),
              (i.value.contact = ''));
            return;
          }
          ((i.value.buyerName = Z.name),
            (i.value.nationalId = Z.nationalId),
            (i.value.location = Z.location),
            (i.value.contact = Z.contact));
        },
        M = () => {
          if (!i.value.produceName) return;
          const Z = n.value.find((q) => q.produceName === i.value.produceName);
          Z && ((i.value.produceType = Z.produceType), H());
        },
        H = () => {
          const { amount: Z } = y(
            n.value,
            i.value.produceName,
            i.value.tonnageKg,
            i.value.produceType
          );
          i.value.amountDueUgx = Z || '';
        },
        $ = () => {
          ((i.value = w()), (_.value = ''));
        },
        X = () => {
          if (_.value) {
            m(_.value);
            return;
          }
          if (!i.value.trustedBuyerId) {
            m('Please select a trusted buyer');
            return;
          }
          if (!i.value.produceName || !i.value.tonnageKg || !i.value.dueDate) {
            m('Please complete required credit sale fields before review.');
            return;
          }
          const Z = new Date(i.value.dueDate),
            q = new Date();
          if (
            (q.setHours(0, 0, 0, 0), Z.setHours(0, 0, 0, 0), Number.isNaN(Z.getTime()) || Z < q)
          ) {
            m('Due date must be today or a future date.');
            return;
          }
          o.value = !0;
        },
        G = () => {
          a.value || (o.value = !1);
        },
        et = async () => {
          var Z, q;
          if (_.value) {
            m(_.value);
            return;
          }
          if (!i.value.trustedBuyerId) {
            m('Please select a trusted buyer');
            return;
          }
          h();
          try {
            (await tr.create(i.value),
              g('Credit sale recorded successfully!'),
              (o.value = !1),
              $(),
              await C());
          } catch (dt) {
            m(
              ((q = (Z = dt.response) == null ? void 0 : Z.data) == null ? void 0 : q.message) ||
                'Failed to record credit sale'
            );
          } finally {
            f();
          }
        },
        ot = (Z) =>
          new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0
          }).format(Number(Z || 0));
      return (
        to(async () => {
          ((t.value = JSON.parse(localStorage.getItem('user') || '{}')),
            await Promise.all([T(), C()]));
        }),
        (Z, q) => (
          R(),
          D('div', null, [
            q[23] || (q[23] = u('h2', { class: 'page-title mb-4' }, 'Record Credit Sale', -1)),
            u('div', rI, [
              q[9] ||
                (q[9] = u(
                  'div',
                  { class: 'card-header' },
                  [u('h5', { class: 'mb-0' }, 'Credit Sale Details')],
                  -1
                )),
              u('div', aI, [
                u(
                  'form',
                  { onSubmit: Es(X, ['prevent']) },
                  [
                    Rt(
                      B2,
                      {
                        form: i.value,
                        'onUpdate:form': q[0] || (q[0] = (dt) => (i.value = dt)),
                        'trusted-buyers': s.value,
                        'can-manage-buyers': x.value,
                        onBuyerChange: E
                      },
                      null,
                      8,
                      ['form', 'trusted-buyers', 'can-manage-buyers']
                    ),
                    Rt(
                      G2,
                      {
                        form: i.value,
                        'onUpdate:form': q[1] || (q[1] = (dt) => (i.value = dt)),
                        inventory: n.value,
                        onProduceChange: M,
                        onTonnageInput: H
                      },
                      null,
                      8,
                      ['form', 'inventory']
                    ),
                    Rt(
                      oI,
                      {
                        form: i.value,
                        'onUpdate:form': q[2] || (q[2] = (dt) => (i.value = dt)),
                        user: t.value
                      },
                      null,
                      8,
                      ['form', 'user']
                    ),
                    Rt(bl, { 'stock-warning': Ot(_), error: Ot(l), success: Ot(c) }, null, 8, [
                      'stock-warning',
                      'error',
                      'success'
                    ]),
                    u('div', lI, [
                      u(
                        'button',
                        { type: 'submit', class: 'btn btn-primary', disabled: Ot(a) },
                        [
                          Ot(a) ? (R(), D('span', dI)) : mt('', !0),
                          q[8] || (q[8] = jt(' Record Credit Sale ', -1))
                        ],
                        8,
                        cI
                      ),
                      u(
                        'button',
                        {
                          type: 'button',
                          class: 'btn btn-outline-danger ms-2',
                          disabled: Ot(a),
                          onClick: $
                        },
                        ' Reset Form ',
                        8,
                        uI
                      )
                    ])
                  ],
                  32
                )
              ])
            ]),
            o.value
              ? (R(),
                D('div', hI, [
                  u('div', fI, [
                    u('div', pI, [
                      q[10] || (q[10] = u('h5', { class: 'mb-0' }, 'Review Credit Sale', -1)),
                      u(
                        'button',
                        { type: 'button', class: 'btn-close', disabled: Ot(a), onClick: G },
                        null,
                        8,
                        mI
                      )
                    ]),
                    u('div', gI, [
                      u('div', bI, [
                        u('div', _I, [
                          u('div', yI, [
                            u('div', vI, [
                              q[11] ||
                                (q[11] = u(
                                  'small',
                                  { class: 'text-muted d-block' },
                                  'Amount Due',
                                  -1
                                )),
                              u('strong', null, I(ot(i.value.amountDueUgx)), 1)
                            ]),
                            u('div', xI, [
                              q[12] ||
                                (q[12] = u(
                                  'small',
                                  { class: 'text-muted d-block' },
                                  'Tonnage',
                                  -1
                                )),
                              u(
                                'strong',
                                null,
                                I(Number(i.value.tonnageKg || 0).toLocaleString()) + ' kg',
                                1
                              )
                            ]),
                            u('div', wI, [
                              q[13] ||
                                (q[13] = u(
                                  'small',
                                  { class: 'text-muted d-block' },
                                  'Due Date',
                                  -1
                                )),
                              u('strong', null, I(i.value.dueDate || '-'), 1)
                            ])
                          ])
                        ])
                      ]),
                      u('div', SI, [
                        u('div', kI, [
                          q[15] ||
                            (q[15] = u(
                              'label',
                              { class: 'form-label fw-bold' },
                              'Trusted Buyer',
                              -1
                            )),
                          bt(
                            u(
                              'select',
                              {
                                class: 'form-select',
                                'onUpdate:modelValue':
                                  q[3] || (q[3] = (dt) => (i.value.trustedBuyerId = dt)),
                                onChange: E
                              },
                              [
                                q[14] ||
                                  (q[14] = u('option', { value: '' }, 'Select trusted buyer', -1)),
                                (R(!0),
                                D(
                                  ne,
                                  null,
                                  Ce(
                                    s.value,
                                    (dt) => (
                                      R(),
                                      D(
                                        'option',
                                        { key: dt._id, value: dt._id },
                                        I(dt.name) + ' (' + I(dt.nationalId) + ') ',
                                        9,
                                        CI
                                      )
                                    )
                                  ),
                                  128
                                ))
                              ],
                              544
                            ),
                            [[ks, i.value.trustedBuyerId]]
                          )
                        ]),
                        u('div', TI, [
                          q[17] ||
                            (q[17] = u(
                              'label',
                              { class: 'form-label fw-bold' },
                              'Produce Name',
                              -1
                            )),
                          bt(
                            u(
                              'select',
                              {
                                class: 'form-select',
                                'onUpdate:modelValue':
                                  q[4] || (q[4] = (dt) => (i.value.produceName = dt)),
                                onChange: M
                              },
                              [
                                q[16] || (q[16] = u('option', { value: '' }, 'Select produce', -1)),
                                (R(!0),
                                D(
                                  ne,
                                  null,
                                  Ce(
                                    n.value,
                                    (dt) => (
                                      R(),
                                      D(
                                        'option',
                                        {
                                          key: `${dt.produceName}-${dt.produceType}`,
                                          value: dt.produceName
                                        },
                                        I(dt.produceName) +
                                          ' (' +
                                          I(dt.produceType) +
                                          ') - ' +
                                          I(dt.totalTonnageKg) +
                                          ' kg ',
                                        9,
                                        AI
                                      )
                                    )
                                  ),
                                  128
                                ))
                              ],
                              544
                            ),
                            [[ks, i.value.produceName]]
                          )
                        ]),
                        u('div', PI, [
                          q[18] ||
                            (q[18] = u(
                              'label',
                              { class: 'form-label fw-bold' },
                              'Tonnage (kg)',
                              -1
                            )),
                          bt(
                            u(
                              'input',
                              {
                                type: 'number',
                                class: 'form-control',
                                'onUpdate:modelValue':
                                  q[5] || (q[5] = (dt) => (i.value.tonnageKg = dt)),
                                min: '1',
                                onInput: H,
                                required: ''
                              },
                              null,
                              544
                            ),
                            [[Et, i.value.tonnageKg]]
                          )
                        ]),
                        u('div', OI, [
                          q[19] ||
                            (q[19] = u(
                              'label',
                              { class: 'form-label fw-bold' },
                              'Amount Due (UGX)',
                              -1
                            )),
                          u(
                            'input',
                            {
                              type: 'number',
                              class: 'form-control',
                              value: i.value.amountDueUgx,
                              readonly: ''
                            },
                            null,
                            8,
                            EI
                          )
                        ]),
                        u('div', RI, [
                          q[20] ||
                            (q[20] = u('label', { class: 'form-label fw-bold' }, 'Due Date', -1)),
                          bt(
                            u(
                              'input',
                              {
                                type: 'date',
                                class: 'form-control',
                                'onUpdate:modelValue':
                                  q[6] || (q[6] = (dt) => (i.value.dueDate = dt)),
                                min: Ot(r),
                                required: ''
                              },
                              null,
                              8,
                              DI
                            ),
                            [[Et, i.value.dueDate]]
                          )
                        ]),
                        u('div', MI, [
                          q[21] ||
                            (q[21] = u(
                              'label',
                              { class: 'form-label fw-bold' },
                              'Dispatch Date',
                              -1
                            )),
                          bt(
                            u(
                              'input',
                              {
                                type: 'date',
                                class: 'form-control',
                                'onUpdate:modelValue':
                                  q[7] || (q[7] = (dt) => (i.value.dateOfDispatch = dt)),
                                required: ''
                              },
                              null,
                              512
                            ),
                            [[Et, i.value.dateOfDispatch]]
                          )
                        ])
                      ]),
                      u('div', II, [
                        u(
                          'button',
                          {
                            type: 'button',
                            class: 'btn btn-outline-secondary',
                            disabled: Ot(a),
                            onClick: G
                          },
                          ' Back ',
                          8,
                          LI
                        ),
                        u(
                          'button',
                          {
                            type: 'button',
                            class: 'btn btn-primary',
                            disabled: Ot(a),
                            onClick: et
                          },
                          [
                            Ot(a) ? (R(), D('span', $I)) : mt('', !0),
                            q[22] || (q[22] = jt(' Save Credit Sale ', -1))
                          ],
                          8,
                          NI
                        )
                      ])
                    ])
                  ])
                ]))
              : mt('', !0)
          ])
        )
      );
    }
  },
  BI = we(FI, [['__scopeId', 'data-v-a6a02c13']]),
  UI = {
    name: 'CreditSalesRecords',
    data() {
      return {
        user: {},
        creditSales: [],
        loadingList: !1,
        repayId: null,
        repayForm: { amountUgx: '', paidAt: new Date().toISOString().split('T')[0] },
        repayLoading: !1,
        repayError: '',
        repaySuccess: ''
      };
    },
    async created() {
      ((this.user = JSON.parse(localStorage.getItem('user') || '{}')),
        await this.loadCreditSales());
    },
    computed: {
      canRepay() {
        return this.user.role === 'manager';
      },
      selectedCreditSale() {
        return this.creditSales.find((e) => e._id === this.repayId);
      },
      balanceForSelected() {
        return this.selectedCreditSale ? this.getBalance(this.selectedCreditSale) : 0;
      }
    },
    methods: {
      async loadCreditSales() {
        this.loadingList = !0;
        try {
          const e = await tr.getAll();
          this.creditSales = e.data;
        } catch (e) {
          console.error('Error loading credit sales:', e);
        } finally {
          this.loadingList = !1;
        }
      },
      startRepay(e) {
        ((this.repayId = e._id),
          (this.repayForm = { amountUgx: '', paidAt: new Date().toISOString().split('T')[0] }),
          (this.repayError = ''),
          (this.repaySuccess = ''));
      },
      cancelRepay() {
        ((this.repayId = null),
          (this.repayForm = { amountUgx: '', paidAt: new Date().toISOString().split('T')[0] }),
          (this.repayError = ''),
          (this.repaySuccess = ''));
      },
      async handleRepay() {
        var e, t;
        if (this.repayId) {
          ((this.repayLoading = !0), (this.repayError = ''), (this.repaySuccess = ''));
          try {
            (await tr.repay(this.repayId, {
              amountUgx: this.repayForm.amountUgx,
              paidAt: this.repayForm.paidAt
            }),
              (this.repaySuccess = 'Payment recorded successfully!'),
              await this.loadCreditSales());
            const s = this.creditSales.find((n) => n._id === this.repayId);
            ((!s || this.getBalance(s) === 0) && (this.repayId = null),
              (this.repayForm.amountUgx = ''));
          } catch (s) {
            this.repayError =
              ((t = (e = s.response) == null ? void 0 : e.data) == null ? void 0 : t.message) ||
              'Failed to record payment';
          } finally {
            this.repayLoading = !1;
          }
        }
      },
      getBalance(e) {
        return e.balanceUgx !== void 0 && e.balanceUgx !== null
          ? e.balanceUgx
          : Math.max((e.amountDueUgx || 0) - (e.amountPaidUgx || 0), 0);
      },
      formatDate(e) {
        if (!e) return '-';
        const t = new Date(e);
        return Number.isNaN(t.getTime()) ? '-' : t.toLocaleDateString();
      },
      formatCurrency(e) {
        return new Intl.NumberFormat('en-UG', {
          style: 'currency',
          currency: 'UGX',
          minimumFractionDigits: 0
        }).format(e || 0);
      }
    }
  },
  jI = { key: 0, class: 'card mb-4' },
  VI = { class: 'card-body' },
  HI = { class: 'row g-3' },
  zI = { class: 'col-md-6' },
  WI = ['value'],
  KI = { class: 'col-md-6' },
  qI = ['value'],
  GI = { class: 'col-md-6' },
  XI = { class: 'col-md-6' },
  YI = { key: 0, class: 'alert alert-danger mt-3' },
  JI = { key: 1, class: 'alert alert-success mt-3' },
  ZI = { class: 'mt-4' },
  QI = ['disabled'],
  tL = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  eL = { class: 'card' },
  sL = { class: 'card-header d-flex justify-content-between align-items-center' },
  nL = ['disabled'],
  iL = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  oL = { class: 'card-body' },
  rL = { key: 0, class: 'text-center py-5 text-muted' },
  aL = { key: 1, class: 'table-responsive' },
  lL = { class: 'table align-middle' },
  cL = { key: 0, class: 'text-end' },
  dL = { class: 'text-end' },
  uL = { class: 'text-end' },
  hL = { class: 'text-end' },
  fL = { key: 0, class: 'badge bg-success' },
  pL = { key: 1, class: 'badge bg-warning text-dark' },
  mL = { key: 0, class: 'text-end' },
  gL = ['disabled', 'onClick'];
function bL(e, t, s, n, i, o) {
  var r;
  return (
    R(),
    D('div', null, [
      t[20] || (t[20] = u('h2', { class: 'mb-4' }, 'Credit Sales Records', -1)),
      i.repayId
        ? (R(),
          D('div', jI, [
            t[10] ||
              (t[10] = u(
                'div',
                { class: 'card-header' },
                [u('h5', { class: 'mb-0' }, 'Record Repayment')],
                -1
              )),
            u('div', VI, [
              u(
                'form',
                {
                  onSubmit:
                    t[3] || (t[3] = Es((...a) => o.handleRepay && o.handleRepay(...a), ['prevent']))
                },
                [
                  u('div', HI, [
                    u('div', zI, [
                      t[5] || (t[5] = u('label', { class: 'form-label' }, 'Buyer', -1)),
                      u(
                        'input',
                        {
                          type: 'text',
                          class: 'form-control',
                          value: (r = o.selectedCreditSale) == null ? void 0 : r.buyerName,
                          disabled: ''
                        },
                        null,
                        8,
                        WI
                      )
                    ]),
                    u('div', KI, [
                      t[6] || (t[6] = u('label', { class: 'form-label' }, 'Balance (UGX)', -1)),
                      u(
                        'input',
                        {
                          type: 'text',
                          class: 'form-control',
                          value: o.formatCurrency(o.balanceForSelected),
                          disabled: ''
                        },
                        null,
                        8,
                        qI
                      )
                    ]),
                    u('div', GI, [
                      t[7] ||
                        (t[7] = u('label', { class: 'form-label' }, 'Amount Paid (UGX) *', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'number',
                            class: 'form-control',
                            'onUpdate:modelValue':
                              t[0] || (t[0] = (a) => (i.repayForm.amountUgx = a)),
                            min: '1',
                            required: ''
                          },
                          null,
                          512
                        ),
                        [[Et, i.repayForm.amountUgx]]
                      )
                    ]),
                    u('div', XI, [
                      t[8] || (t[8] = u('label', { class: 'form-label' }, 'Payment Date', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'date',
                            class: 'form-control',
                            'onUpdate:modelValue': t[1] || (t[1] = (a) => (i.repayForm.paidAt = a))
                          },
                          null,
                          512
                        ),
                        [[Et, i.repayForm.paidAt]]
                      )
                    ])
                  ]),
                  i.repayError ? (R(), D('div', YI, I(i.repayError), 1)) : mt('', !0),
                  i.repaySuccess ? (R(), D('div', JI, I(i.repaySuccess), 1)) : mt('', !0),
                  u('div', ZI, [
                    u(
                      'button',
                      { type: 'submit', class: 'btn btn-primary', disabled: i.repayLoading },
                      [
                        i.repayLoading ? (R(), D('span', tL)) : mt('', !0),
                        t[9] || (t[9] = jt(' Record Payment ', -1))
                      ],
                      8,
                      QI
                    ),
                    u(
                      'button',
                      {
                        type: 'button',
                        class: 'btn btn-outline-secondary ms-2',
                        onClick: t[2] || (t[2] = (...a) => o.cancelRepay && o.cancelRepay(...a))
                      },
                      ' Cancel '
                    )
                  ])
                ],
                32
              )
            ])
          ]))
        : mt('', !0),
      u('div', eL, [
        u('div', sL, [
          t[12] || (t[12] = u('h5', { class: 'mb-0' }, 'Credit Sales Records', -1)),
          u(
            'button',
            {
              class: 'btn btn-outline-primary btn-sm',
              onClick: t[4] || (t[4] = (...a) => o.loadCreditSales && o.loadCreditSales(...a)),
              disabled: i.loadingList
            },
            [
              i.loadingList ? (R(), D('span', iL)) : mt('', !0),
              t[11] || (t[11] = jt(' Refresh ', -1))
            ],
            8,
            nL
          )
        ]),
        u('div', oL, [
          i.creditSales.length === 0
            ? (R(), D('div', rL, ' No credit sales records found. '))
            : (R(),
              D('div', aL, [
                u('table', lL, [
                  u('thead', null, [
                    u('tr', null, [
                      t[13] || (t[13] = u('th', null, 'Buyer', -1)),
                      t[14] || (t[14] = u('th', null, 'Produce', -1)),
                      t[15] || (t[15] = u('th', { class: 'text-end' }, 'Amount Due', -1)),
                      t[16] || (t[16] = u('th', { class: 'text-end' }, 'Paid', -1)),
                      t[17] || (t[17] = u('th', { class: 'text-end' }, 'Balance', -1)),
                      t[18] || (t[18] = u('th', null, 'Due Date', -1)),
                      t[19] || (t[19] = u('th', null, 'Status', -1)),
                      o.canRepay ? (R(), D('th', cL, 'Actions')) : mt('', !0)
                    ])
                  ]),
                  u('tbody', null, [
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        i.creditSales,
                        (a) => (
                          R(),
                          D('tr', { key: a._id }, [
                            u('td', null, I(a.buyerName), 1),
                            u('td', null, I(a.produceName) + ' (' + I(a.produceType) + ')', 1),
                            u('td', dL, I(o.formatCurrency(a.amountDueUgx)), 1),
                            u('td', uL, I(o.formatCurrency(a.amountPaidUgx || 0)), 1),
                            u('td', hL, I(o.formatCurrency(o.getBalance(a))), 1),
                            u('td', null, I(o.formatDate(a.dueDate)), 1),
                            u('td', null, [
                              o.getBalance(a) === 0
                                ? (R(), D('span', fL, 'Paid'))
                                : (R(), D('span', pL, 'Pending'))
                            ]),
                            o.canRepay
                              ? (R(),
                                D('td', mL, [
                                  u(
                                    'button',
                                    {
                                      class: 'btn btn-sm btn-outline-primary',
                                      disabled: o.getBalance(a) === 0,
                                      onClick: (l) => o.startRepay(a)
                                    },
                                    ' Record Payment ',
                                    8,
                                    gL
                                  )
                                ]))
                              : mt('', !0)
                          ])
                        )
                      ),
                      128
                    ))
                  ])
                ])
              ]))
        ])
      ])
    ])
  );
}
const _L = we(UI, [['render', bL]]),
  yL = {
    name: 'Inventory',
    data() {
      return {
        user: {},
        inventory: [],
        statistics: { totalItems: 0, totalWeight: 0, totalValue: 0, lowStockCount: 0 }
      };
    },
    async created() {
      ((this.user = JSON.parse(localStorage.getItem('user'))), await this.loadInventory());
    },
    computed: {
      lowStockItems() {
        return this.inventory.filter((e) => Number(e.totalTonnageKg || 0) < 500);
      },
      lowStockAlertMessage() {
        const e = this.lowStockItems
          .map(
            (s) => `${s.produceName} (${Number(s.totalTonnageKg || 0).toLocaleString('en-UG')} kg)`
          )
          .slice(0, 4);
        if (e.length === 0) return '';
        const t =
          this.lowStockItems.length > 4 ? `, and ${this.lowStockItems.length - 4} more` : '';
        return `${e.join(', ')}${t} running low on stock.`;
      }
    },
    methods: {
      async loadInventory() {
        try {
          const e = await yr.get();
          ((this.inventory = e.data.inventory), (this.statistics = e.data.statistics));
        } catch (e) {
          console.error('Error loading inventory:', e);
        }
      },
      formatCurrency(e) {
        return new Intl.NumberFormat('en-UG', {
          style: 'currency',
          currency: 'UGX',
          minimumFractionDigits: 0
        }).format(e);
      },
      formatStatCurrency(e) {
        return dl(e);
      },
      formatCompactNumber: cl
    }
  },
  vL = { class: 'text-muted' },
  xL = { key: 0, class: 'alert alert-warning' },
  wL = { class: 'row g-4 mb-4' },
  SL = { class: 'col-md-3' },
  kL = { class: 'card stats-card' },
  CL = { class: 'card-body text-center' },
  TL = { class: 'col-md-3' },
  AL = { class: 'card stats-card' },
  PL = { class: 'card-body text-center' },
  OL = { class: 'stats-value' },
  EL = { class: 'col-md-3' },
  RL = { class: 'card stats-card' },
  DL = { class: 'card-body text-center' },
  ML = { class: 'stats-value' },
  IL = { class: 'col-md-3' },
  LL = { class: 'card stats-card' },
  NL = { class: 'card-body text-center' },
  $L = { class: 'card' },
  FL = { class: 'card-body' },
  BL = { key: 0, class: 'text-center py-5' },
  UL = { key: 1, class: 'table-responsive' },
  jL = { class: 'table table-hover' },
  VL = { class: 'text-end' },
  HL = { class: 'text-end' },
  zL = { class: 'text-center' },
  WL = { key: 0, class: 'badge bg-danger' },
  KL = { key: 1, class: 'badge bg-warning' },
  qL = { key: 2, class: 'badge bg-success' };
function GL(e, t, s, n, i, o) {
  return (
    R(),
    D('div', null, [
      t[13] || (t[13] = u('h2', { class: 'mb-4' }, 'Inventory', -1)),
      u(
        'p',
        vL,
        I(i.user.role === 'director' ? 'All branches' : i.user.branch) + ' inventory overview',
        1
      ),
      o.lowStockItems.length > 0
        ? (R(),
          D('div', xL, [
            t[0] || (t[0] = u('i', { class: 'bi bi-exclamation-triangle me-2' }, null, -1)),
            t[1] || (t[1] = u('strong', null, 'Low Stock Alert!', -1)),
            jt(' ' + I(o.lowStockAlertMessage), 1)
          ]))
        : mt('', !0),
      u('div', wL, [
        u('div', SL, [
          u('div', kL, [
            u('div', CL, [
              t[2] ||
                (t[2] = u(
                  'i',
                  { class: 'bi bi-box text-primary', style: { 'font-size': '2rem' } },
                  null,
                  -1
                )),
              t[3] || (t[3] = u('h6', { class: 'text-muted mt-2' }, 'Total Items', -1)),
              u('h3', null, I(i.statistics.totalItems), 1)
            ])
          ])
        ]),
        u('div', TL, [
          u('div', AL, [
            u('div', PL, [
              t[4] ||
                (t[4] = u(
                  'i',
                  { class: 'bi bi-box-seam text-success', style: { 'font-size': '2rem' } },
                  null,
                  -1
                )),
              t[5] || (t[5] = u('h6', { class: 'text-muted mt-2' }, 'Total Weight', -1)),
              u('h3', OL, I(o.formatCompactNumber(i.statistics.totalWeight)) + ' kg', 1)
            ])
          ])
        ]),
        u('div', EL, [
          u('div', RL, [
            u('div', DL, [
              t[6] ||
                (t[6] = u(
                  'i',
                  { class: 'bi bi-currency-exchange text-info', style: { 'font-size': '2rem' } },
                  null,
                  -1
                )),
              t[7] || (t[7] = u('h6', { class: 'text-muted mt-2' }, 'Total Value', -1)),
              u('h3', ML, I(o.formatStatCurrency(i.statistics.totalValue)), 1)
            ])
          ])
        ]),
        u('div', IL, [
          u('div', LL, [
            u('div', NL, [
              t[8] ||
                (t[8] = u(
                  'i',
                  {
                    class: 'bi bi-exclamation-triangle text-warning',
                    style: { 'font-size': '2rem' }
                  },
                  null,
                  -1
                )),
              t[9] || (t[9] = u('h6', { class: 'text-muted mt-2' }, 'Low Stock', -1)),
              u('h3', null, I(i.statistics.lowStockCount), 1)
            ])
          ])
        ])
      ]),
      u('div', $L, [
        t[12] ||
          (t[12] = u(
            'div',
            { class: 'card-header' },
            [u('h5', { class: 'mb-0' }, 'Inventory Details')],
            -1
          )),
        u('div', FL, [
          i.inventory.length === 0
            ? (R(),
              D('div', BL, [
                ...(t[10] ||
                  (t[10] = [
                    u(
                      'i',
                      { class: 'bi bi-box', style: { 'font-size': '4rem', color: '#ccc' } },
                      null,
                      -1
                    ),
                    u('p', { class: 'text-muted mt-3' }, 'No inventory items', -1)
                  ]))
              ]))
            : (R(),
              D('div', UL, [
                u('table', jL, [
                  t[11] ||
                    (t[11] = u(
                      'thead',
                      { class: 'table-light' },
                      [
                        u('tr', null, [
                          u('th', null, 'Produce Name'),
                          u('th', null, 'Type'),
                          u('th', null, 'Branch'),
                          u('th', { class: 'text-end' }, 'Stock (kg)'),
                          u('th', { class: 'text-end' }, 'Price/kg'),
                          u('th', { class: 'text-end' }, 'Total Value'),
                          u('th', { class: 'text-center' }, 'Status')
                        ])
                      ],
                      -1
                    )),
                  u('tbody', null, [
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        i.inventory,
                        (r, a) => (
                          R(),
                          D('tr', { key: a }, [
                            u('td', null, [u('strong', null, I(r.produceName), 1)]),
                            u('td', null, I(r.produceType), 1),
                            u('td', null, I(r.branch), 1),
                            u(
                              'td',
                              {
                                class: vs([
                                  'text-end fw-bold',
                                  {
                                    'text-danger': r.totalTonnageKg < 500,
                                    'text-success': r.totalTonnageKg >= 500
                                  }
                                ])
                              },
                              I(r.totalTonnageKg.toLocaleString()),
                              3
                            ),
                            u('td', VL, I(o.formatCurrency(r.sellingPrice)), 1),
                            u('td', HL, I(o.formatCurrency(r.totalTonnageKg * r.sellingPrice)), 1),
                            u('td', zL, [
                              r.totalTonnageKg === 0
                                ? (R(), D('span', WL, 'Out of Stock'))
                                : r.totalTonnageKg < 500
                                  ? (R(), D('span', KL, 'Low Stock'))
                                  : (R(), D('span', qL, 'In Stock'))
                            ])
                          ])
                        )
                      ),
                      128
                    ))
                  ])
                ])
              ]))
        ])
      ])
    ])
  );
}
const XL = we(yL, [
    ['render', GL],
    ['__scopeId', 'data-v-b0067bca']
  ]),
  YL = {
    name: 'Users',
    data() {
      return {
        user: {},
        users: [],
        loadingList: !1,
        editingId: null,
        showForm: !1,
        form: { name: '', username: '', password: '', role: '' },
        loading: !1,
        error: '',
        success: ''
      };
    },
    async created() {
      ((this.user = JSON.parse(localStorage.getItem('user') || '{}')), await this.loadUsers());
    },
    methods: {
      async loadUsers() {
        this.loadingList = !0;
        try {
          const e = await li.listUsers();
          this.users = e.data;
        } catch (e) {
          console.error('Failed to load users:', e);
        } finally {
          this.loadingList = !1;
        }
      },
      async handleSubmit() {
        var e, t;
        ((this.loading = !0), (this.error = ''), (this.success = ''));
        try {
          if (this.editingId) {
            const s = { name: this.form.name, username: this.form.username, role: this.form.role };
            (this.form.password && (s.password = this.form.password),
              await li.updateUser(this.editingId, s),
              (this.success = 'User updated successfully!'));
          } else (await li.register(this.form), (this.success = 'User created successfully!'));
          (this.resetForm(), await this.loadUsers());
        } catch (s) {
          this.error =
            ((t = (e = s.response) == null ? void 0 : e.data) == null ? void 0 : t.message) ||
            (this.editingId ? 'Failed to update user' : 'Failed to create user');
        } finally {
          this.loading = !1;
        }
      },
      startEdit(e) {
        ((this.editingId = e._id),
          (this.showForm = !0),
          (this.form = { name: e.name, username: e.username, password: '', role: e.role }),
          (this.error = ''),
          (this.success = ''));
      },
      cancelEdit() {
        this.resetForm();
      },
      async deleteUser(e) {
        var t, s;
        if (confirm(`Delete user ${e.name}?`))
          try {
            (await li.deleteUser(e._id),
              this.editingId === e._id && this.resetForm(),
              await this.loadUsers());
          } catch (n) {
            this.error =
              ((s = (t = n.response) == null ? void 0 : t.data) == null ? void 0 : s.message) ||
              'Failed to delete user';
          }
      },
      resetForm() {
        ((this.editingId = null),
          (this.showForm = !1),
          (this.form = { name: '', username: '', password: '', role: '' }));
      },
      toggleForm() {
        (this.showForm && this.editingId ? this.resetForm() : (this.showForm = !this.showForm),
          (this.error = ''),
          (this.success = ''));
      },
      formatRole(e) {
        return e === 'sales_agent'
          ? 'Sales Agent'
          : e === 'manager'
            ? 'Manager'
            : e === 'director'
              ? 'Director'
              : e;
      }
    }
  },
  JL = { class: 'card' },
  ZL = { class: 'card-header d-flex justify-content-between align-items-center' },
  QL = { class: 'd-flex gap-2' },
  tN = ['disabled'],
  eN = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  sN = { class: 'card-body' },
  nN = { key: 0, class: 'text-center py-5 text-muted' },
  iN = { key: 1, class: 'table-responsive' },
  oN = { class: 'table align-middle' },
  rN = { class: 'text-end' },
  aN = ['onClick'],
  lN = ['onClick'],
  cN = { key: 0, class: 'card mt-4' },
  dN = { class: 'card-header' },
  uN = { class: 'mb-0' },
  hN = { class: 'card-body' },
  fN = { class: 'row g-3' },
  pN = { class: 'col-md-6' },
  mN = { class: 'col-md-6' },
  gN = { class: 'col-md-6' },
  bN = { class: 'col-md-6' },
  _N = ['value'],
  yN = { class: 'col-md-6' },
  vN = { class: 'form-label' },
  xN = ['required'],
  wN = { key: 0, class: 'alert alert-danger mt-3' },
  SN = { key: 1, class: 'alert alert-success mt-3' },
  kN = { class: 'mt-4' },
  CN = ['disabled'],
  TN = { key: 0, class: 'spinner-border spinner-border-sm me-2' };
function AN(e, t, s, n, i, o) {
  return (
    R(),
    D('div', null, [
      t[17] || (t[17] = u('h2', { class: 'mb-4' }, 'User Management', -1)),
      u('div', JL, [
        u('div', ZL, [
          t[9] || (t[9] = u('h5', { class: 'mb-0' }, 'Users', -1)),
          u('div', QL, [
            u(
              'button',
              {
                class: 'btn btn-primary btn-sm',
                onClick: t[0] || (t[0] = (...r) => o.toggleForm && o.toggleForm(...r))
              },
              I(i.showForm ? (i.editingId ? 'Close Edit' : 'Hide Form') : 'New User'),
              1
            ),
            u(
              'button',
              {
                class: 'btn btn-outline-primary btn-sm',
                onClick: t[1] || (t[1] = (...r) => o.loadUsers && o.loadUsers(...r)),
                disabled: i.loadingList
              },
              [
                i.loadingList ? (R(), D('span', eN)) : mt('', !0),
                t[8] || (t[8] = jt(' Refresh ', -1))
              ],
              8,
              tN
            )
          ])
        ]),
        u('div', sN, [
          i.users.length === 0
            ? (R(), D('div', nN, ' No users found for this branch. '))
            : (R(),
              D('div', iN, [
                u('table', oN, [
                  t[10] ||
                    (t[10] = u(
                      'thead',
                      null,
                      [
                        u('tr', null, [
                          u('th', null, 'Name'),
                          u('th', null, 'Username'),
                          u('th', null, 'Role'),
                          u('th', null, 'Branch'),
                          u('th', { class: 'text-end' }, 'Actions')
                        ])
                      ],
                      -1
                    )),
                  u('tbody', null, [
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        i.users,
                        (r) => (
                          R(),
                          D('tr', { key: r._id }, [
                            u('td', null, I(r.name), 1),
                            u('td', null, I(r.username), 1),
                            u('td', null, I(o.formatRole(r.role)), 1),
                            u('td', null, I(r.branch || '-'), 1),
                            u('td', rN, [
                              u(
                                'button',
                                {
                                  class: 'btn btn-sm btn-outline-primary me-2',
                                  onClick: (a) => o.startEdit(r)
                                },
                                ' Edit ',
                                8,
                                aN
                              ),
                              u(
                                'button',
                                {
                                  class: 'btn btn-sm btn-outline-danger',
                                  onClick: (a) => o.deleteUser(r)
                                },
                                ' Delete ',
                                8,
                                lN
                              )
                            ])
                          ])
                        )
                      ),
                      128
                    ))
                  ])
                ])
              ]))
        ])
      ]),
      i.showForm
        ? (R(),
          D('div', cN, [
            u('div', dN, [u('h5', uN, I(i.editingId ? 'Update User' : 'Create New User'), 1)]),
            u('div', hN, [
              u(
                'form',
                {
                  onSubmit:
                    t[7] ||
                    (t[7] = Es((...r) => o.handleSubmit && o.handleSubmit(...r), ['prevent']))
                },
                [
                  u('div', fN, [
                    u('div', pN, [
                      t[11] || (t[11] = u('label', { class: 'form-label' }, 'Full Name *', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'text',
                            class: 'form-control',
                            'onUpdate:modelValue': t[2] || (t[2] = (r) => (i.form.name = r)),
                            minlength: '2',
                            pattern: '^[A-Za-z0-9\\\\s]+$',
                            required: ''
                          },
                          null,
                          512
                        ),
                        [[Et, i.form.name]]
                      )
                    ]),
                    u('div', mN, [
                      t[12] || (t[12] = u('label', { class: 'form-label' }, 'Username *', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'text',
                            class: 'form-control',
                            'onUpdate:modelValue': t[3] || (t[3] = (r) => (i.form.username = r)),
                            required: ''
                          },
                          null,
                          512
                        ),
                        [[Et, i.form.username]]
                      )
                    ]),
                    u('div', gN, [
                      t[14] || (t[14] = u('label', { class: 'form-label' }, 'Role *', -1)),
                      bt(
                        u(
                          'select',
                          {
                            class: 'form-select',
                            'onUpdate:modelValue': t[4] || (t[4] = (r) => (i.form.role = r)),
                            required: ''
                          },
                          [
                            ...(t[13] ||
                              (t[13] = [
                                u('option', { value: '' }, 'Select role', -1),
                                u('option', { value: 'manager' }, 'Manager', -1),
                                u('option', { value: 'sales_agent' }, 'Sales Agent', -1)
                              ]))
                          ],
                          512
                        ),
                        [[ks, i.form.role]]
                      ),
                      t[15] ||
                        (t[15] = u(
                          'small',
                          { class: 'text-muted' },
                          'Users are created for your branch only.',
                          -1
                        ))
                    ]),
                    u('div', bN, [
                      t[16] || (t[16] = u('label', { class: 'form-label' }, 'Branch', -1)),
                      u(
                        'input',
                        { type: 'text', class: 'form-control', value: i.user.branch, disabled: '' },
                        null,
                        8,
                        _N
                      )
                    ]),
                    u('div', yN, [
                      u('label', vN, 'Password ' + I(i.editingId ? '' : '*'), 1),
                      bt(
                        u(
                          'input',
                          {
                            type: 'password',
                            class: 'form-control',
                            'onUpdate:modelValue': t[5] || (t[5] = (r) => (i.form.password = r)),
                            required: !i.editingId,
                            placeholder: 'Leave blank to keep current password'
                          },
                          null,
                          8,
                          xN
                        ),
                        [[Et, i.form.password]]
                      )
                    ])
                  ]),
                  i.error ? (R(), D('div', wN, I(i.error), 1)) : mt('', !0),
                  i.success ? (R(), D('div', SN, I(i.success), 1)) : mt('', !0),
                  u('div', kN, [
                    u(
                      'button',
                      { type: 'submit', class: 'btn btn-primary', disabled: i.loading },
                      [
                        i.loading ? (R(), D('span', TN)) : mt('', !0),
                        jt(' ' + I(i.editingId ? 'Update User' : 'Create User'), 1)
                      ],
                      8,
                      CN
                    ),
                    i.editingId
                      ? (R(),
                        D(
                          'button',
                          {
                            key: 0,
                            type: 'button',
                            class: 'btn btn-outline-secondary ms-2',
                            onClick: t[6] || (t[6] = (...r) => o.cancelEdit && o.cancelEdit(...r))
                          },
                          ' Cancel Edit '
                        ))
                      : mt('', !0)
                  ])
                ],
                32
              )
            ])
          ]))
        : mt('', !0)
    ])
  );
}
const PN = we(YL, [['render', AN]]),
  ON = {
    name: 'TrustedBuyers',
    data() {
      return {
        user: {},
        buyers: [],
        loadingList: !1,
        showForm: !1,
        editingId: null,
        form: { name: '', nationalId: '', location: '', contact: '' },
        loading: !1,
        error: '',
        success: ''
      };
    },
    async created() {
      ((this.user = JSON.parse(localStorage.getItem('user') || '{}')), await this.loadBuyers());
    },
    methods: {
      async loadBuyers() {
        this.loadingList = !0;
        try {
          const e = await So.getAll();
          this.buyers = e.data;
        } catch (e) {
          console.error('Failed to load trusted buyers:', e);
        } finally {
          this.loadingList = !1;
        }
      },
      async handleSubmit() {
        var e, t;
        ((this.loading = !0), (this.error = ''), (this.success = ''));
        try {
          const s = {
            name: this.normalizeText(this.form.name),
            nationalId: this.form.nationalId.toUpperCase(),
            location: this.normalizeText(this.form.location),
            contact: this.form.contact.trim()
          };
          (this.editingId
            ? (await So.update(this.editingId, s),
              (this.success = 'Trusted buyer updated successfully!'))
            : (await So.create(s), (this.success = 'Trusted buyer added successfully!')),
            this.resetForm(),
            await this.loadBuyers());
        } catch (s) {
          this.error =
            ((t = (e = s.response) == null ? void 0 : e.data) == null ? void 0 : t.message) ||
            (this.editingId ? 'Failed to update trusted buyer' : 'Failed to add trusted buyer');
        } finally {
          this.loading = !1;
        }
      },
      startEdit(e) {
        ((this.editingId = e._id),
          (this.showForm = !0),
          (this.form = {
            name: e.name,
            nationalId: e.nationalId,
            location: e.location,
            contact: e.contact
          }),
          (this.error = ''),
          (this.success = ''));
      },
      cancelEdit() {
        this.resetForm();
      },
      async deleteBuyer(e) {
        var t, s;
        if (confirm(`Delete trusted buyer ${e.name}?`))
          try {
            (await So.delete(e._id),
              this.editingId === e._id && this.resetForm(),
              await this.loadBuyers());
          } catch (n) {
            this.error =
              ((s = (t = n.response) == null ? void 0 : t.data) == null ? void 0 : s.message) ||
              'Failed to delete trusted buyer';
          }
      },
      resetForm() {
        ((this.editingId = null),
          (this.showForm = !1),
          (this.form = { name: '', nationalId: '', location: '', contact: '' }));
      },
      toggleForm() {
        (this.showForm && this.editingId ? this.resetForm() : (this.showForm = !this.showForm),
          (this.error = ''),
          (this.success = ''));
      },
      normalizeText(e) {
        return String(e || '')
          .trim()
          .replace(/\s+/g, ' ');
      }
    }
  },
  EN = { class: 'card' },
  RN = { class: 'card-header d-flex justify-content-between align-items-center' },
  DN = { class: 'd-flex gap-2' },
  MN = ['disabled'],
  IN = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  LN = { class: 'card-body' },
  NN = { key: 0, class: 'text-center py-5 text-muted' },
  $N = { key: 1, class: 'table-responsive' },
  FN = { class: 'table align-middle' },
  BN = { class: 'text-end' },
  UN = ['onClick'],
  jN = ['onClick'],
  VN = { key: 0, class: 'card mt-4' },
  HN = { class: 'card-header' },
  zN = { class: 'mb-0' },
  WN = { class: 'card-body' },
  KN = { class: 'row g-3' },
  qN = { class: 'col-md-6' },
  GN = { class: 'col-md-6' },
  XN = ['disabled'],
  YN = { class: 'col-md-6' },
  JN = { class: 'col-md-6' },
  ZN = { class: 'col-md-6' },
  QN = ['value'],
  t$ = { key: 0, class: 'alert alert-danger mt-3' },
  e$ = { key: 1, class: 'alert alert-success mt-3' },
  s$ = { class: 'mt-4' },
  n$ = ['disabled'],
  i$ = { key: 0, class: 'spinner-border spinner-border-sm me-2' };
function o$(e, t, s, n, i, o) {
  return (
    R(),
    D('div', null, [
      t[16] || (t[16] = u('h2', { class: 'mb-4' }, 'Trusted Buyers', -1)),
      u('div', EN, [
        u('div', RN, [
          t[9] || (t[9] = u('h5', { class: 'mb-0' }, 'Trusted Buyers List', -1)),
          u('div', DN, [
            u(
              'button',
              {
                class: 'btn btn-primary btn-sm',
                onClick: t[0] || (t[0] = (...r) => o.toggleForm && o.toggleForm(...r))
              },
              I(i.showForm ? (i.editingId ? 'Close Edit' : 'Hide Form') : 'Add Buyer'),
              1
            ),
            u(
              'button',
              {
                class: 'btn btn-outline-primary btn-sm',
                onClick: t[1] || (t[1] = (...r) => o.loadBuyers && o.loadBuyers(...r)),
                disabled: i.loadingList
              },
              [
                i.loadingList ? (R(), D('span', IN)) : mt('', !0),
                t[8] || (t[8] = jt(' Refresh ', -1))
              ],
              8,
              MN
            )
          ])
        ]),
        u('div', LN, [
          i.buyers.length === 0
            ? (R(), D('div', NN, ' No trusted buyers found for this branch. '))
            : (R(),
              D('div', $N, [
                u('table', FN, [
                  t[10] ||
                    (t[10] = u(
                      'thead',
                      null,
                      [
                        u('tr', null, [
                          u('th', null, 'Name'),
                          u('th', null, 'National ID'),
                          u('th', null, 'Location'),
                          u('th', null, 'Contact'),
                          u('th', null, 'Branch'),
                          u('th', { class: 'text-end' }, 'Actions')
                        ])
                      ],
                      -1
                    )),
                  u('tbody', null, [
                    (R(!0),
                    D(
                      ne,
                      null,
                      Ce(
                        i.buyers,
                        (r) => (
                          R(),
                          D('tr', { key: r._id }, [
                            u('td', null, I(r.name), 1),
                            u('td', null, I(r.nationalId), 1),
                            u('td', null, I(r.location), 1),
                            u('td', null, I(r.contact), 1),
                            u('td', null, I(r.branch), 1),
                            u('td', BN, [
                              u(
                                'button',
                                {
                                  class: 'btn btn-sm btn-outline-primary me-2',
                                  onClick: (a) => o.startEdit(r)
                                },
                                ' Edit ',
                                8,
                                UN
                              ),
                              u(
                                'button',
                                {
                                  class: 'btn btn-sm btn-outline-danger',
                                  onClick: (a) => o.deleteBuyer(r)
                                },
                                ' Delete ',
                                8,
                                jN
                              )
                            ])
                          ])
                        )
                      ),
                      128
                    ))
                  ])
                ])
              ]))
        ])
      ]),
      i.showForm
        ? (R(),
          D('div', VN, [
            u('div', HN, [u('h5', zN, I(i.editingId ? 'Update Buyer' : 'Add Trusted Buyer'), 1)]),
            u('div', WN, [
              u(
                'form',
                {
                  onSubmit:
                    t[7] ||
                    (t[7] = Es((...r) => o.handleSubmit && o.handleSubmit(...r), ['prevent']))
                },
                [
                  u('div', KN, [
                    u('div', qN, [
                      t[11] || (t[11] = u('label', { class: 'form-label' }, 'Buyer Name *', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'text',
                            class: 'form-control',
                            'onUpdate:modelValue': t[2] || (t[2] = (r) => (i.form.name = r)),
                            minlength: '2',
                            pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$',
                            title: 'Use letters/numbers. Spaces between words are allowed.',
                            required: ''
                          },
                          null,
                          512
                        ),
                        [[Et, i.form.name]]
                      )
                    ]),
                    u('div', GN, [
                      t[12] ||
                        (t[12] = u('label', { class: 'form-label' }, 'National ID (NIN) *', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'text',
                            class: 'form-control',
                            'onUpdate:modelValue': t[3] || (t[3] = (r) => (i.form.nationalId = r)),
                            pattern: '[A-Z0-9]{14}',
                            maxlength: '14',
                            placeholder: '14 alphanumeric characters',
                            required: '',
                            disabled: i.editingId
                          },
                          null,
                          8,
                          XN
                        ),
                        [[Et, i.form.nationalId]]
                      )
                    ]),
                    u('div', YN, [
                      t[13] || (t[13] = u('label', { class: 'form-label' }, 'Location *', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'text',
                            class: 'form-control',
                            'onUpdate:modelValue': t[4] || (t[4] = (r) => (i.form.location = r)),
                            minlength: '2',
                            pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$',
                            title: 'Use letters/numbers. Spaces between words are allowed.',
                            required: ''
                          },
                          null,
                          512
                        ),
                        [[Et, i.form.location]]
                      )
                    ]),
                    u('div', JN, [
                      t[14] || (t[14] = u('label', { class: 'form-label' }, 'Contact *', -1)),
                      bt(
                        u(
                          'input',
                          {
                            type: 'text',
                            class: 'form-control',
                            'onUpdate:modelValue': t[5] || (t[5] = (r) => (i.form.contact = r)),
                            pattern: '^(\\\\+256|0)[0-9]{9}$',
                            placeholder: '+256700000000',
                            required: ''
                          },
                          null,
                          512
                        ),
                        [[Et, i.form.contact]]
                      )
                    ]),
                    u('div', ZN, [
                      t[15] || (t[15] = u('label', { class: 'form-label' }, 'Branch', -1)),
                      u(
                        'input',
                        { type: 'text', class: 'form-control', value: i.user.branch, disabled: '' },
                        null,
                        8,
                        QN
                      )
                    ])
                  ]),
                  i.error ? (R(), D('div', t$, I(i.error), 1)) : mt('', !0),
                  i.success ? (R(), D('div', e$, I(i.success), 1)) : mt('', !0),
                  u('div', s$, [
                    u(
                      'button',
                      { type: 'submit', class: 'btn btn-primary', disabled: i.loading },
                      [
                        i.loading ? (R(), D('span', i$)) : mt('', !0),
                        jt(' ' + I(i.editingId ? 'Update Buyer' : 'Add Buyer'), 1)
                      ],
                      8,
                      n$
                    ),
                    i.editingId
                      ? (R(),
                        D(
                          'button',
                          {
                            key: 0,
                            type: 'button',
                            class: 'btn btn-outline-secondary ms-2',
                            onClick: t[6] || (t[6] = (...r) => o.cancelEdit && o.cancelEdit(...r))
                          },
                          ' Cancel Edit '
                        ))
                      : mt('', !0)
                  ])
                ],
                32
              )
            ])
          ]))
        : mt('', !0)
    ])
  );
}
const r$ = we(ON, [['render', o$]]),
  nm = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'],
  a$ = (e) => ({
    _id: null,
    type: e,
    priceUgx: '',
    source: 'unset',
    saving: !1,
    deleting: !1,
    error: '',
    success: ''
  }),
  l$ = {
    name: 'PriceManagement',
    data() {
      return { loading: !1, globalError: '', globalSuccess: '', rows: nm.map(a$) };
    },
    computed: {
      managedCount() {
        return this.rows.filter((e) => e.source === 'managed').length;
      },
      inferredCount() {
        return this.rows.filter((e) => e.source === 'inferred').length;
      },
      unsetCount() {
        return this.rows.filter((e) => e.source === 'unset').length;
      }
    },
    async created() {
      await this.loadPrices();
    },
    methods: {
      statusLabel(e) {
        return e === 'managed' ? 'Managed' : e === 'inferred' ? 'Inferred' : 'Unset';
      },
      statusBadgeClass(e) {
        return e === 'managed'
          ? 'bg-success'
          : e === 'inferred'
            ? 'bg-warning text-dark'
            : 'bg-secondary';
      },
      clearMessages() {
        ((this.globalError = ''), (this.globalSuccess = ''));
      },
      clearRowMessages(e) {
        ((e.error = ''), (e.success = ''));
      },
      async loadPrices() {
        var e, t;
        ((this.loading = !0), this.clearMessages());
        try {
          const s = await ko.getAll(),
            n = {};
          (s.data.forEach((i) => {
            n[i.produceType] = i;
          }),
            (this.rows = nm.map((i) => {
              const o = n[i];
              return {
                _id: (o == null ? void 0 : o._id) || null,
                type: i,
                priceUgx: (o == null ? void 0 : o.priceUgx) ?? '',
                source: (o == null ? void 0 : o.source) || 'unset',
                saving: !1,
                deleting: !1,
                error: '',
                success: ''
              };
            })));
        } catch (s) {
          this.globalError =
            ((t = (e = s.response) == null ? void 0 : e.data) == null ? void 0 : t.message) ||
            'Failed to load prices';
        } finally {
          this.loading = !1;
        }
      },
      validatePrice(e) {
        const t = Number(e.priceUgx);
        return !t || Number.isNaN(t) || t < 1e4
          ? ((e.error = 'Price must be at least 10000 UGX'), null)
          : t;
      },
      async savePrice(e) {
        var s, n;
        (this.clearMessages(), this.clearRowMessages(e));
        const t = this.validatePrice(e);
        if (t !== null) {
          e.saving = !0;
          try {
            const i = !!e._id,
              o = { produceType: e.type, priceUgx: t },
              r = e._id ? await ko.update(e._id, o) : await ko.create(o);
            ((e._id = r.data.setting._id),
              (e.priceUgx = r.data.setting.priceUgx),
              (e.source = 'managed'),
              (e.success = `${i ? 'Updated' : 'Created'} (${r.data.updatedProcurements} records synced)`),
              (this.globalSuccess = `Price ${i ? 'updated' : 'created'} for ${e.type}`));
          } catch (i) {
            e.error =
              ((n = (s = i.response) == null ? void 0 : s.data) == null ? void 0 : n.message) ||
              'Failed to save price';
          } finally {
            e.saving = !1;
          }
        }
      },
      async deletePrice(e) {
        var t, s;
        if ((this.clearMessages(), this.clearRowMessages(e), !e._id)) {
          e.error = 'No managed price to delete';
          return;
        }
        if (confirm(`Delete managed price for ${e.type}?`)) {
          e.deleting = !0;
          try {
            (await ko.delete(e._id),
              await this.loadPrices(),
              (this.globalSuccess = `Deleted managed price for ${e.type}`));
          } catch (n) {
            e.error =
              ((s = (t = n.response) == null ? void 0 : t.data) == null ? void 0 : s.message) ||
              'Failed to delete price';
          } finally {
            e.deleting = !1;
          }
        }
      }
    }
  },
  c$ = { class: 'price-page' },
  d$ = { class: 'price-page-header' },
  u$ = ['disabled'],
  h$ = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  f$ = { key: 1, class: 'bi bi-arrow-clockwise me-2' },
  p$ = { key: 0, class: 'alert alert-danger' },
  m$ = { key: 1, class: 'alert alert-success' },
  g$ = { class: 'summary-grid' },
  b$ = { class: 'summary-card' },
  _$ = { class: 'summary-value' },
  y$ = { class: 'summary-card' },
  v$ = { class: 'summary-value' },
  x$ = { class: 'summary-card' },
  w$ = { class: 'summary-value' },
  S$ = { class: 'card price-card' },
  k$ = { class: 'card-body' },
  C$ = { class: 'table-responsive' },
  T$ = { class: 'table align-middle price-table mb-0' },
  A$ = { class: 'produce-cell' },
  P$ = { class: 'fw-semibold' },
  O$ = { class: 'text-end' },
  E$ = { class: 'price-input-wrap ms-auto' },
  R$ = ['onUpdate:modelValue'],
  D$ = { key: 0, class: 'text-danger d-block mt-1' },
  M$ = { key: 1, class: 'text-success d-block mt-1' },
  I$ = { class: 'text-end' },
  L$ = { class: 'action-wrap' },
  N$ = ['onClick', 'disabled'],
  $$ = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  F$ = ['onClick', 'disabled'],
  B$ = { key: 0, class: 'spinner-border spinner-border-sm me-2' };
function U$(e, t, s, n, i, o) {
  return (
    R(),
    D('div', c$, [
      u('div', d$, [
        t[2] ||
          (t[2] = u(
            'div',
            null,
            [
              u('h2', { class: 'page-title' }, 'Price Management'),
              u(
                'p',
                { class: 'page-subtitle mb-0' },
                'Manage branch-level prices by produce type (create, update, delete).'
              )
            ],
            -1
          )),
        u(
          'button',
          {
            class: 'btn btn-outline-primary refresh-btn',
            onClick: t[0] || (t[0] = (...r) => o.loadPrices && o.loadPrices(...r)),
            disabled: i.loading
          },
          [
            i.loading ? (R(), D('span', h$)) : (R(), D('i', f$)),
            t[1] || (t[1] = jt(' Refresh ', -1))
          ],
          8,
          u$
        )
      ]),
      i.globalError ? (R(), D('div', p$, I(i.globalError), 1)) : mt('', !0),
      i.globalSuccess ? (R(), D('div', m$, I(i.globalSuccess), 1)) : mt('', !0),
      u('div', g$, [
        u('div', b$, [
          t[3] || (t[3] = u('span', { class: 'summary-label' }, 'Managed', -1)),
          u('strong', _$, I(o.managedCount), 1)
        ]),
        u('div', y$, [
          t[4] || (t[4] = u('span', { class: 'summary-label' }, 'Inferred', -1)),
          u('strong', v$, I(o.inferredCount), 1)
        ]),
        u('div', x$, [
          t[5] || (t[5] = u('span', { class: 'summary-label' }, 'Unset', -1)),
          u('strong', w$, I(o.unsetCount), 1)
        ])
      ]),
      u('div', S$, [
        t[10] ||
          (t[10] = u(
            'div',
            { class: 'card-header' },
            [
              u('h5', { class: 'mb-0 d-flex align-items-center gap-2' }, [
                u('i', { class: 'bi bi-tags' }),
                jt(' Prices by Produce Type ')
              ])
            ],
            -1
          )),
        u('div', k$, [
          u('div', C$, [
            u('table', T$, [
              t[9] ||
                (t[9] = u(
                  'thead',
                  null,
                  [
                    u('tr', null, [
                      u('th', null, 'Produce Type'),
                      u('th', null, 'Status'),
                      u('th', { class: 'text-end' }, 'Price per kg'),
                      u('th', { class: 'text-end' }, 'Actions')
                    ])
                  ],
                  -1
                )),
              u('tbody', null, [
                (R(!0),
                D(
                  ne,
                  null,
                  Ce(
                    i.rows,
                    (r) => (
                      R(),
                      D('tr', { key: r.type }, [
                        u('td', null, [
                          u('div', A$, [
                            t[6] || (t[6] = u('span', { class: 'produce-dot' }, null, -1)),
                            u('span', P$, I(r.type), 1)
                          ])
                        ]),
                        u('td', null, [
                          u(
                            'span',
                            { class: vs(['status-pill', `status-${r.source}`]) },
                            I(o.statusLabel(r.source)),
                            3
                          )
                        ]),
                        u('td', O$, [
                          u('div', E$, [
                            t[7] || (t[7] = u('span', { class: 'price-prefix' }, 'UGX', -1)),
                            bt(
                              u(
                                'input',
                                {
                                  type: 'number',
                                  class: 'form-control text-end price-input',
                                  'onUpdate:modelValue': (a) => (r.priceUgx = a),
                                  min: '10000'
                                },
                                null,
                                8,
                                R$
                              ),
                              [[Et, r.priceUgx]]
                            )
                          ]),
                          r.error ? (R(), D('small', D$, I(r.error), 1)) : mt('', !0),
                          r.success ? (R(), D('small', M$, I(r.success), 1)) : mt('', !0)
                        ]),
                        u('td', I$, [
                          u('div', L$, [
                            u(
                              'button',
                              {
                                class: vs(['btn btn-sm', r._id ? 'btn-primary' : 'btn-success']),
                                onClick: (a) => o.savePrice(r),
                                disabled: r.saving || r.deleting
                              },
                              [
                                r.saving ? (R(), D('span', $$)) : mt('', !0),
                                jt(' ' + I(r._id ? 'Update' : 'Create'), 1)
                              ],
                              10,
                              N$
                            ),
                            u(
                              'button',
                              {
                                class: 'btn btn-sm btn-outline-danger',
                                onClick: (a) => o.deletePrice(r),
                                disabled: !r._id || r.saving || r.deleting
                              },
                              [
                                r.deleting ? (R(), D('span', B$)) : mt('', !0),
                                t[8] || (t[8] = jt(' Delete ', -1))
                              ],
                              8,
                              F$
                            )
                          ])
                        ])
                      ])
                    )
                  ),
                  128
                ))
              ])
            ])
          ])
        ])
      ])
    ])
  );
}
const j$ = we(l$, [
    ['render', U$],
    ['__scopeId', 'data-v-3a99980a']
  ]),
  V$ = 1024 * 1024,
  H$ = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  z$ = {
    name: 'Profile',
    data() {
      return {
        loading: !1,
        saving: !1,
        error: '',
        success: '',
        profileImagePreview: '',
        profileImageChanged: !1,
        form: {
          _id: '',
          name: '',
          username: '',
          role: '',
          branch: '',
          password: '',
          confirmPassword: ''
        }
      };
    },
    async created() {
      await this.loadProfile();
    },
    methods: {
      async loadProfile() {
        var e, t;
        ((this.loading = !0), (this.error = ''), (this.success = ''));
        try {
          const s = await li.getMe();
          this.applyUserToForm(s.data);
        } catch (s) {
          this.error =
            ((t = (e = s.response) == null ? void 0 : e.data) == null ? void 0 : t.message) ||
            'Failed to load profile';
        } finally {
          this.loading = !1;
        }
      },
      applyUserToForm(e) {
        ((this.form = {
          _id: e._id || '',
          name: e.name || '',
          username: e.username || '',
          role: e.role || '',
          branch: e.branch || '',
          password: '',
          confirmPassword: ''
        }),
          (this.profileImagePreview = e.profileImage || ''),
          (this.profileImageChanged = !1),
          this.updateSessionUser(e));
      },
      updateSessionUser(e) {
        const t = JSON.parse(localStorage.getItem('user') || '{}'),
          s = {
            ...t,
            _id: e._id ?? t._id,
            name: e.name ?? t.name,
            username: e.username ?? t.username,
            profileImage: e.profileImage ?? t.profileImage ?? '',
            role: e.role ?? t.role,
            branch: e.branch ?? t.branch
          };
        (localStorage.setItem('user', JSON.stringify(s)),
          window.dispatchEvent(new Event('user-updated')));
      },
      handleImageChange(e) {
        var n;
        const t = (n = e.target.files) == null ? void 0 : n[0];
        if (!t) return;
        if (!H$.includes(t.type)) {
          ((this.error = 'Profile image must be PNG, JPG, or WEBP.'), (e.target.value = ''));
          return;
        }
        if (t.size > V$) {
          ((this.error = 'Profile image must be 1 MB or smaller.'), (e.target.value = ''));
          return;
        }
        const s = new FileReader();
        ((s.onload = () => {
          ((this.error = ''),
            (this.profileImagePreview = typeof s.result == 'string' ? s.result : ''),
            (this.profileImageChanged = !0));
        }),
          (s.onerror = () => {
            this.error = 'Failed to process the selected image.';
          }),
          s.readAsDataURL(t),
          (e.target.value = ''));
      },
      removeImage() {
        ((this.error = ''), (this.profileImagePreview = ''), (this.profileImageChanged = !0));
      },
      async handleSave() {
        var e, t;
        if (
          ((this.error = ''), (this.success = ''), this.form.password || this.form.confirmPassword)
        ) {
          if (this.form.password.length < 6) {
            this.error = 'Password must be at least 6 characters.';
            return;
          }
          if (this.form.password !== this.form.confirmPassword) {
            this.error = 'Password confirmation does not match.';
            return;
          }
        }
        this.saving = !0;
        try {
          const s = { name: this.form.name.trim(), username: this.form.username.trim() };
          (this.profileImageChanged && (s.profileImage = this.profileImagePreview),
            this.form.password && (s.password = this.form.password));
          const n = await li.updateMe(s);
          (this.applyUserToForm(n.data), (this.success = 'Profile updated successfully.'));
        } catch (s) {
          this.error =
            ((t = (e = s.response) == null ? void 0 : e.data) == null ? void 0 : t.message) ||
            'Failed to update profile';
        } finally {
          this.saving = !1;
        }
      },
      formatRole(e) {
        return e === 'sales_agent'
          ? 'Sales Agent'
          : e === 'manager'
            ? 'Manager'
            : e === 'director'
              ? 'Director'
              : e || '-';
      }
    }
  },
  W$ = { class: 'profile-page' },
  K$ = { class: 'card profile-card' },
  q$ = { class: 'card-body' },
  G$ = { class: 'profile-image-panel mb-4' },
  X$ = { class: 'profile-image-preview' },
  Y$ = ['src'],
  J$ = { key: 1, class: 'profile-image-placeholder' },
  Z$ = { class: 'd-flex flex-wrap gap-2' },
  Q$ = { class: 'btn btn-outline-primary btn-sm mb-0' },
  tF = ['disabled'],
  eF = ['disabled'],
  sF = { class: 'row g-3' },
  nF = { class: 'col-md-6' },
  iF = { class: 'col-md-6' },
  oF = { class: 'col-md-6' },
  rF = ['value'],
  aF = { class: 'col-md-6' },
  lF = ['value'],
  cF = { class: 'row g-3' },
  dF = { class: 'col-md-6' },
  uF = { class: 'col-md-6' },
  hF = { key: 0, class: 'alert alert-danger mt-4 mb-0' },
  fF = { key: 1, class: 'alert alert-success mt-4 mb-0' },
  pF = { class: 'd-flex flex-wrap gap-2 mt-4' },
  mF = ['disabled'],
  gF = { key: 0, class: 'spinner-border spinner-border-sm me-2' },
  bF = ['disabled'];
function _F(e, t, s, n, i, o) {
  return (
    R(),
    D('div', W$, [
      t[21] ||
        (t[21] = u(
          'div',
          { class: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
          [
            u('div', null, [
              u('h2', { class: 'mb-1' }, 'My Profile'),
              u('p', { class: 'text-muted mb-0' }, 'Update your account details securely.')
            ])
          ],
          -1
        )),
      u('div', K$, [
        t[20] ||
          (t[20] = u(
            'div',
            { class: 'card-header' },
            [u('h5', { class: 'mb-0' }, 'Account Information')],
            -1
          )),
        u('div', q$, [
          u('div', G$, [
            u('div', X$, [
              i.profileImagePreview
                ? (R(),
                  D(
                    'img',
                    { key: 0, src: i.profileImagePreview, alt: 'Profile image' },
                    null,
                    8,
                    Y$
                  ))
                : (R(),
                  D('div', J$, [
                    ...(t[8] || (t[8] = [u('i', { class: 'bi bi-person' }, null, -1)]))
                  ]))
            ]),
            u('div', null, [
              u('div', Z$, [
                u('label', Q$, [
                  u(
                    'input',
                    {
                      type: 'file',
                      class: 'd-none',
                      accept: 'image/png,image/jpeg,image/jpg,image/webp',
                      disabled: i.saving || i.loading,
                      onChange:
                        t[0] || (t[0] = (...r) => o.handleImageChange && o.handleImageChange(...r))
                    },
                    null,
                    40,
                    tF
                  ),
                  t[9] || (t[9] = jt(' Upload Image ', -1))
                ]),
                i.profileImagePreview
                  ? (R(),
                    D(
                      'button',
                      {
                        key: 0,
                        type: 'button',
                        class: 'btn btn-outline-danger btn-sm',
                        disabled: i.saving || i.loading,
                        onClick: t[1] || (t[1] = (...r) => o.removeImage && o.removeImage(...r))
                      },
                      ' Remove ',
                      8,
                      eF
                    ))
                  : mt('', !0)
              ]),
              t[10] ||
                (t[10] = u(
                  'small',
                  { class: 'text-muted d-block mt-2' },
                  'PNG, JPG, or WEBP up to 1 MB.',
                  -1
                ))
            ])
          ]),
          u(
            'form',
            {
              onSubmit:
                t[7] || (t[7] = Es((...r) => o.handleSave && o.handleSave(...r), ['prevent']))
            },
            [
              u('div', sF, [
                u('div', nF, [
                  t[11] ||
                    (t[11] = u('label', { class: 'form-label fw-semibold' }, 'Full Name', -1)),
                  bt(
                    u(
                      'input',
                      {
                        'onUpdate:modelValue': t[2] || (t[2] = (r) => (i.form.name = r)),
                        type: 'text',
                        class: 'form-control',
                        minlength: '2',
                        pattern: '^[A-Za-z0-9\\\\s.]+$',
                        required: ''
                      },
                      null,
                      512
                    ),
                    [[Et, i.form.name]]
                  )
                ]),
                u('div', iF, [
                  t[12] ||
                    (t[12] = u('label', { class: 'form-label fw-semibold' }, 'Username', -1)),
                  bt(
                    u(
                      'input',
                      {
                        'onUpdate:modelValue': t[3] || (t[3] = (r) => (i.form.username = r)),
                        type: 'text',
                        class: 'form-control',
                        minlength: '2',
                        required: ''
                      },
                      null,
                      512
                    ),
                    [[Et, i.form.username]]
                  )
                ]),
                u('div', oF, [
                  t[13] || (t[13] = u('label', { class: 'form-label fw-semibold' }, 'Role', -1)),
                  u(
                    'input',
                    {
                      value: o.formatRole(i.form.role),
                      type: 'text',
                      class: 'form-control',
                      disabled: ''
                    },
                    null,
                    8,
                    rF
                  )
                ]),
                u('div', aF, [
                  t[14] || (t[14] = u('label', { class: 'form-label fw-semibold' }, 'Branch', -1)),
                  u(
                    'input',
                    {
                      value: i.form.branch || '-',
                      type: 'text',
                      class: 'form-control',
                      disabled: ''
                    },
                    null,
                    8,
                    lF
                  )
                ])
              ]),
              t[18] || (t[18] = u('hr', { class: 'my-4' }, null, -1)),
              t[19] || (t[19] = u('h6', { class: 'mb-3' }, 'Change Password', -1)),
              u('div', cF, [
                u('div', dF, [
                  t[15] ||
                    (t[15] = u('label', { class: 'form-label fw-semibold' }, 'New Password', -1)),
                  bt(
                    u(
                      'input',
                      {
                        'onUpdate:modelValue': t[4] || (t[4] = (r) => (i.form.password = r)),
                        type: 'password',
                        class: 'form-control',
                        minlength: '6',
                        placeholder: 'Leave blank to keep current password'
                      },
                      null,
                      512
                    ),
                    [[Et, i.form.password]]
                  )
                ]),
                u('div', uF, [
                  t[16] ||
                    (t[16] = u(
                      'label',
                      { class: 'form-label fw-semibold' },
                      'Confirm New Password',
                      -1
                    )),
                  bt(
                    u(
                      'input',
                      {
                        'onUpdate:modelValue': t[5] || (t[5] = (r) => (i.form.confirmPassword = r)),
                        type: 'password',
                        class: 'form-control',
                        minlength: '6',
                        placeholder: 'Repeat new password'
                      },
                      null,
                      512
                    ),
                    [[Et, i.form.confirmPassword]]
                  )
                ])
              ]),
              i.error ? (R(), D('div', hF, I(i.error), 1)) : mt('', !0),
              i.success ? (R(), D('div', fF, I(i.success), 1)) : mt('', !0),
              u('div', pF, [
                u(
                  'button',
                  { type: 'submit', class: 'btn btn-primary', disabled: i.saving || i.loading },
                  [
                    i.saving ? (R(), D('span', gF)) : mt('', !0),
                    t[17] || (t[17] = jt(' Save Changes ', -1))
                  ],
                  8,
                  mF
                ),
                u(
                  'button',
                  {
                    type: 'button',
                    class: 'btn btn-outline-secondary',
                    disabled: i.saving || i.loading,
                    onClick: t[6] || (t[6] = (...r) => o.loadProfile && o.loadProfile(...r))
                  },
                  ' Reset ',
                  8,
                  bF
                )
              ])
            ],
            32
          )
        ])
      ])
    ])
  );
}
const yF = we(z$, [
    ['render', _F],
    ['__scopeId', 'data-v-cf59b0f8']
  ]),
  vF = [
    { path: '/', name: 'Login', component: RS },
    {
      path: '/dashboard',
      component: mk,
      meta: { requiresAuth: !0 },
      children: [
        { path: 'director', name: 'DirectorDashboard', component: kE, meta: { role: 'director' } },
        { path: 'manager', name: 'ManagerDashboard', component: tD, meta: { role: 'manager' } },
        {
          path: 'sales-agent',
          name: 'SalesAgentDashboard',
          component: wD,
          meta: { role: 'sales_agent' }
        },
        { path: 'procurement', name: 'Procurement', component: iM, meta: { role: 'manager' } },
        {
          path: 'procurement-records',
          name: 'ProcurementRecords',
          component: BM,
          meta: { role: 'manager' }
        },
        {
          path: 'sales',
          name: 'Sales',
          component: A2,
          meta: { roles: ['manager', 'sales_agent'] }
        },
        {
          path: 'credit-sales',
          name: 'CreditSales',
          component: BI,
          meta: { roles: ['manager', 'sales_agent'] }
        },
        {
          path: 'credit-sales-records',
          name: 'CreditSalesRecords',
          component: _L,
          meta: { roles: ['manager', 'sales_agent'] }
        },
        {
          path: 'inventory',
          name: 'Inventory',
          component: XL,
          meta: { roles: ['manager', 'sales_agent'] }
        },
        { path: 'users', name: 'Users', component: PN, meta: { role: 'manager' } },
        { path: 'trusted-buyers', name: 'TrustedBuyers', component: r$, meta: { role: 'manager' } },
        {
          path: 'price-management',
          name: 'PriceManagement',
          component: j$,
          meta: { role: 'manager' }
        },
        { path: 'profile', name: 'Profile', component: yF }
      ]
    }
  ],
  Jb = F1({ history: g1(), routes: vF });
Jb.beforeEach((e, t, s) => {
  const n = localStorage.getItem('token'),
    i = JSON.parse(localStorage.getItem('user') || '{}');
  (e.meta.requiresAuth && !n) ||
  (e.meta.role && i.role !== e.meta.role) ||
  (e.meta.roles && !e.meta.roles.includes(i.role))
    ? s('/')
    : s();
});
var xF =
    typeof globalThis < 'u'
      ? globalThis
      : typeof window < 'u'
        ? window
        : typeof global < 'u'
          ? global
          : typeof self < 'u'
            ? self
            : {},
  wF = { exports: {} };
/*!
 * Bootstrap v5.3.8 (https://getbootstrap.com/)
 * Copyright 2011-2025 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */ (function (e, t) {
  (function (s, n) {
    e.exports = n();
  })(xF, function () {
    const s = new Map(),
      n = {
        set(b, d, p) {
          s.has(b) || s.set(b, new Map());
          const v = s.get(b);
          v.has(d) || v.size === 0
            ? v.set(d, p)
            : console.error(
                `Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(v.keys())[0]}.`
              );
        },
        get: (b, d) => (s.has(b) && s.get(b).get(d)) || null,
        remove(b, d) {
          if (!s.has(b)) return;
          const p = s.get(b);
          (p.delete(d), p.size === 0 && s.delete(b));
        }
      },
      i = 'transitionend',
      o = (b) => (
        b &&
          window.CSS &&
          window.CSS.escape &&
          (b = b.replace(/#([^\s"#']+)/g, (d, p) => `#${CSS.escape(p)}`)),
        b
      ),
      r = (b) =>
        b == null
          ? `${b}`
          : Object.prototype.toString
              .call(b)
              .match(/\s([a-z]+)/i)[1]
              .toLowerCase(),
      a = (b) => {
        b.dispatchEvent(new Event(i));
      },
      l = (b) =>
        !(!b || typeof b != 'object') && (b.jquery !== void 0 && (b = b[0]), b.nodeType !== void 0),
      c = (b) =>
        l(b)
          ? b.jquery
            ? b[0]
            : b
          : typeof b == 'string' && b.length > 0
            ? document.querySelector(o(b))
            : null,
      h = (b) => {
        if (!l(b) || b.getClientRects().length === 0) return !1;
        const d = getComputedStyle(b).getPropertyValue('visibility') === 'visible',
          p = b.closest('details:not([open])');
        if (!p) return d;
        if (p !== b) {
          const v = b.closest('summary');
          if ((v && v.parentNode !== p) || v === null) return !1;
        }
        return d;
      },
      f = (b) =>
        !b ||
        b.nodeType !== Node.ELEMENT_NODE ||
        !!b.classList.contains('disabled') ||
        (b.disabled !== void 0
          ? b.disabled
          : b.hasAttribute('disabled') && b.getAttribute('disabled') !== 'false'),
      m = (b) => {
        if (!document.documentElement.attachShadow) return null;
        if (typeof b.getRootNode == 'function') {
          const d = b.getRootNode();
          return d instanceof ShadowRoot ? d : null;
        }
        return b instanceof ShadowRoot ? b : b.parentNode ? m(b.parentNode) : null;
      },
      g = () => {},
      _ = (b) => {
        b.offsetHeight;
      },
      y = () =>
        window.jQuery && !document.body.hasAttribute('data-bs-no-jquery') ? window.jQuery : null,
      x = [],
      w = () => document.documentElement.dir === 'rtl',
      C = (b) => {
        var d;
        ((d = () => {
          const p = y();
          if (p) {
            const v = b.NAME,
              A = p.fn[v];
            ((p.fn[v] = b.jQueryInterface),
              (p.fn[v].Constructor = b),
              (p.fn[v].noConflict = () => ((p.fn[v] = A), b.jQueryInterface)));
          }
        }),
          document.readyState === 'loading'
            ? (x.length ||
                document.addEventListener('DOMContentLoaded', () => {
                  for (const p of x) p();
                }),
              x.push(d))
            : d());
      },
      T = (b, d = [], p = b) => (typeof b == 'function' ? b.call(...d) : p),
      E = (b, d, p = !0) => {
        if (!p) return void T(b);
        const v =
          ((N) => {
            if (!N) return 0;
            let { transitionDuration: W, transitionDelay: J } = window.getComputedStyle(N);
            const rt = Number.parseFloat(W),
              at = Number.parseFloat(J);
            return rt || at
              ? ((W = W.split(',')[0]),
                (J = J.split(',')[0]),
                1e3 * (Number.parseFloat(W) + Number.parseFloat(J)))
              : 0;
          })(d) + 5;
        let A = !1;
        const P = ({ target: N }) => {
          N === d && ((A = !0), d.removeEventListener(i, P), T(b));
        };
        (d.addEventListener(i, P),
          setTimeout(() => {
            A || a(d);
          }, v));
      },
      M = (b, d, p, v) => {
        const A = b.length;
        let P = b.indexOf(d);
        return P === -1
          ? !p && v
            ? b[A - 1]
            : b[0]
          : ((P += p ? 1 : -1), v && (P = (P + A) % A), b[Math.max(0, Math.min(P, A - 1))]);
      },
      H = /[^.]*(?=\..*)\.|.*/,
      $ = /\..*/,
      X = /::\d+$/,
      G = {};
    let et = 1;
    const ot = { mouseenter: 'mouseover', mouseleave: 'mouseout' },
      Z = new Set([
        'click',
        'dblclick',
        'mouseup',
        'mousedown',
        'contextmenu',
        'mousewheel',
        'DOMMouseScroll',
        'mouseover',
        'mouseout',
        'mousemove',
        'selectstart',
        'selectend',
        'keydown',
        'keypress',
        'keyup',
        'orientationchange',
        'touchstart',
        'touchmove',
        'touchend',
        'touchcancel',
        'pointerdown',
        'pointermove',
        'pointerup',
        'pointerleave',
        'pointercancel',
        'gesturestart',
        'gesturechange',
        'gestureend',
        'focus',
        'blur',
        'change',
        'reset',
        'select',
        'submit',
        'focusin',
        'focusout',
        'load',
        'unload',
        'beforeunload',
        'resize',
        'move',
        'DOMContentLoaded',
        'readystatechange',
        'error',
        'abort',
        'scroll'
      ]);
    function q(b, d) {
      return (d && `${d}::${et++}`) || b.uidEvent || et++;
    }
    function dt(b) {
      const d = q(b);
      return ((b.uidEvent = d), (G[d] = G[d] || {}), G[d]);
    }
    function At(b, d, p = null) {
      return Object.values(b).find((v) => v.callable === d && v.delegationSelector === p);
    }
    function lt(b, d, p) {
      const v = typeof d == 'string',
        A = v ? p : d || p;
      let P = _e(b);
      return (Z.has(P) || (P = b), [v, A, P]);
    }
    function ht(b, d, p, v, A) {
      if (typeof d != 'string' || !b) return;
      let [P, N, W] = lt(d, p, v);
      d in ot &&
        (N = ((St) =>
          function (wt) {
            if (
              !wt.relatedTarget ||
              (wt.relatedTarget !== wt.delegateTarget &&
                !wt.delegateTarget.contains(wt.relatedTarget))
            )
              return St.call(this, wt);
          })(N));
      const J = dt(b),
        rt = J[W] || (J[W] = {}),
        at = At(rt, N, P ? p : null);
      if (at) return void (at.oneOff = at.oneOff && A);
      const st = q(N, d.replace(H, '')),
        Pt = P
          ? (function (vt, St, wt) {
              return function kt(ee) {
                const ae = vt.querySelectorAll(St);
                for (let { target: It } = ee; It && It !== this; It = It.parentNode)
                  for (const zt of ae)
                    if (zt === It)
                      return (
                        Ut(ee, { delegateTarget: It }),
                        kt.oneOff && F.off(vt, ee.type, St, wt),
                        wt.apply(It, [ee])
                      );
              };
            })(b, p, N)
          : (function (vt, St) {
              return function wt(kt) {
                return (
                  Ut(kt, { delegateTarget: vt }),
                  wt.oneOff && F.off(vt, kt.type, St),
                  St.apply(vt, [kt])
                );
              };
            })(b, N);
      ((Pt.delegationSelector = P ? p : null),
        (Pt.callable = N),
        (Pt.oneOff = A),
        (Pt.uidEvent = st),
        (rt[st] = Pt),
        b.addEventListener(W, Pt, P));
    }
    function ft(b, d, p, v, A) {
      const P = At(d[p], v, A);
      P && (b.removeEventListener(p, P, !!A), delete d[p][P.uidEvent]);
    }
    function Vt(b, d, p, v) {
      const A = d[p] || {};
      for (const [P, N] of Object.entries(A))
        P.includes(v) && ft(b, d, p, N.callable, N.delegationSelector);
    }
    function _e(b) {
      return ((b = b.replace($, '')), ot[b] || b);
    }
    const F = {
      on(b, d, p, v) {
        ht(b, d, p, v, !1);
      },
      one(b, d, p, v) {
        ht(b, d, p, v, !0);
      },
      off(b, d, p, v) {
        if (typeof d != 'string' || !b) return;
        const [A, P, N] = lt(d, p, v),
          W = N !== d,
          J = dt(b),
          rt = J[N] || {},
          at = d.startsWith('.');
        if (P === void 0) {
          if (at) for (const st of Object.keys(J)) Vt(b, J, st, d.slice(1));
          for (const [st, Pt] of Object.entries(rt)) {
            const vt = st.replace(X, '');
            (W && !d.includes(vt)) || ft(b, J, N, Pt.callable, Pt.delegationSelector);
          }
        } else {
          if (!Object.keys(rt).length) return;
          ft(b, J, N, P, A ? p : null);
        }
      },
      trigger(b, d, p) {
        if (typeof d != 'string' || !b) return null;
        const v = y();
        let A = null,
          P = !0,
          N = !0,
          W = !1;
        d !== _e(d) &&
          v &&
          ((A = v.Event(d, p)),
          v(b).trigger(A),
          (P = !A.isPropagationStopped()),
          (N = !A.isImmediatePropagationStopped()),
          (W = A.isDefaultPrevented()));
        const J = Ut(new Event(d, { bubbles: P, cancelable: !0 }), p);
        return (
          W && J.preventDefault(),
          N && b.dispatchEvent(J),
          J.defaultPrevented && A && A.preventDefault(),
          J
        );
      }
    };
    function Ut(b, d = {}) {
      for (const [p, v] of Object.entries(d))
        try {
          b[p] = v;
        } catch {
          Object.defineProperty(b, p, { configurable: !0, get: () => v });
        }
      return b;
    }
    function Se(b) {
      if (b === 'true') return !0;
      if (b === 'false') return !1;
      if (b === Number(b).toString()) return Number(b);
      if (b === '' || b === 'null') return null;
      if (typeof b != 'string') return b;
      try {
        return JSON.parse(decodeURIComponent(b));
      } catch {
        return b;
      }
    }
    function ue(b) {
      return b.replace(/[A-Z]/g, (d) => `-${d.toLowerCase()}`);
    }
    const oe = {
      setDataAttribute(b, d, p) {
        b.setAttribute(`data-bs-${ue(d)}`, p);
      },
      removeDataAttribute(b, d) {
        b.removeAttribute(`data-bs-${ue(d)}`);
      },
      getDataAttributes(b) {
        if (!b) return {};
        const d = {},
          p = Object.keys(b.dataset).filter((v) => v.startsWith('bs') && !v.startsWith('bsConfig'));
        for (const v of p) {
          let A = v.replace(/^bs/, '');
          ((A = A.charAt(0).toLowerCase() + A.slice(1)), (d[A] = Se(b.dataset[v])));
        }
        return d;
      },
      getDataAttribute: (b, d) => Se(b.getAttribute(`data-bs-${ue(d)}`))
    };
    class re {
      static get Default() {
        return {};
      }
      static get DefaultType() {
        return {};
      }
      static get NAME() {
        throw new Error('You have to implement the static method "NAME", for each component!');
      }
      _getConfig(d) {
        return (
          (d = this._mergeConfigObj(d)),
          (d = this._configAfterMerge(d)),
          this._typeCheckConfig(d),
          d
        );
      }
      _configAfterMerge(d) {
        return d;
      }
      _mergeConfigObj(d, p) {
        const v = l(p) ? oe.getDataAttribute(p, 'config') : {};
        return {
          ...this.constructor.Default,
          ...(typeof v == 'object' ? v : {}),
          ...(l(p) ? oe.getDataAttributes(p) : {}),
          ...(typeof d == 'object' ? d : {})
        };
      }
      _typeCheckConfig(d, p = this.constructor.DefaultType) {
        for (const [v, A] of Object.entries(p)) {
          const P = d[v],
            N = l(P) ? 'element' : r(P);
          if (!new RegExp(A).test(N))
            throw new TypeError(
              `${this.constructor.NAME.toUpperCase()}: Option "${v}" provided type "${N}" but expected type "${A}".`
            );
        }
      }
    }
    class U extends re {
      constructor(d, p) {
        (super(),
          (d = c(d)) &&
            ((this._element = d),
            (this._config = this._getConfig(p)),
            n.set(this._element, this.constructor.DATA_KEY, this)));
      }
      dispose() {
        (n.remove(this._element, this.constructor.DATA_KEY),
          F.off(this._element, this.constructor.EVENT_KEY));
        for (const d of Object.getOwnPropertyNames(this)) this[d] = null;
      }
      _queueCallback(d, p, v = !0) {
        E(d, p, v);
      }
      _getConfig(d) {
        return (
          (d = this._mergeConfigObj(d, this._element)),
          (d = this._configAfterMerge(d)),
          this._typeCheckConfig(d),
          d
        );
      }
      static getInstance(d) {
        return n.get(c(d), this.DATA_KEY);
      }
      static getOrCreateInstance(d, p = {}) {
        return this.getInstance(d) || new this(d, typeof p == 'object' ? p : null);
      }
      static get VERSION() {
        return '5.3.8';
      }
      static get DATA_KEY() {
        return `bs.${this.NAME}`;
      }
      static get EVENT_KEY() {
        return `.${this.DATA_KEY}`;
      }
      static eventName(d) {
        return `${d}${this.EVENT_KEY}`;
      }
    }
    const it = (b) => {
        let d = b.getAttribute('data-bs-target');
        if (!d || d === '#') {
          let p = b.getAttribute('href');
          if (!p || (!p.includes('#') && !p.startsWith('.'))) return null;
          (p.includes('#') && !p.startsWith('#') && (p = `#${p.split('#')[1]}`),
            (d = p && p !== '#' ? p.trim() : null));
        }
        return d
          ? d
              .split(',')
              .map((p) => o(p))
              .join(',')
          : null;
      },
      B = {
        find: (b, d = document.documentElement) =>
          [].concat(...Element.prototype.querySelectorAll.call(d, b)),
        findOne: (b, d = document.documentElement) => Element.prototype.querySelector.call(d, b),
        children: (b, d) => [].concat(...b.children).filter((p) => p.matches(d)),
        parents(b, d) {
          const p = [];
          let v = b.parentNode.closest(d);
          for (; v; ) (p.push(v), (v = v.parentNode.closest(d)));
          return p;
        },
        prev(b, d) {
          let p = b.previousElementSibling;
          for (; p; ) {
            if (p.matches(d)) return [p];
            p = p.previousElementSibling;
          }
          return [];
        },
        next(b, d) {
          let p = b.nextElementSibling;
          for (; p; ) {
            if (p.matches(d)) return [p];
            p = p.nextElementSibling;
          }
          return [];
        },
        focusableChildren(b) {
          const d = [
            'a',
            'button',
            'input',
            'textarea',
            'select',
            'details',
            '[tabindex]',
            '[contenteditable="true"]'
          ]
            .map((p) => `${p}:not([tabindex^="-"])`)
            .join(',');
          return this.find(d, b).filter((p) => !f(p) && h(p));
        },
        getSelectorFromElement(b) {
          const d = it(b);
          return d && B.findOne(d) ? d : null;
        },
        getElementFromSelector(b) {
          const d = it(b);
          return d ? B.findOne(d) : null;
        },
        getMultipleElementsFromSelector(b) {
          const d = it(b);
          return d ? B.find(d) : [];
        }
      },
      ut = (b, d = 'hide') => {
        const p = `click.dismiss${b.EVENT_KEY}`,
          v = b.NAME;
        F.on(document, p, `[data-bs-dismiss="${v}"]`, function (A) {
          if ((['A', 'AREA'].includes(this.tagName) && A.preventDefault(), f(this))) return;
          const P = B.getElementFromSelector(this) || this.closest(`.${v}`);
          b.getOrCreateInstance(P)[d]();
        });
      },
      Nt = '.bs.alert',
      S = `close${Nt}`,
      k = `closed${Nt}`;
    class O extends U {
      static get NAME() {
        return 'alert';
      }
      close() {
        if (F.trigger(this._element, S).defaultPrevented) return;
        this._element.classList.remove('show');
        const d = this._element.classList.contains('fade');
        this._queueCallback(() => this._destroyElement(), this._element, d);
      }
      _destroyElement() {
        (this._element.remove(), F.trigger(this._element, k), this.dispose());
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = O.getOrCreateInstance(this);
          if (typeof d == 'string') {
            if (p[d] === void 0 || d.startsWith('_') || d === 'constructor')
              throw new TypeError(`No method named "${d}"`);
            p[d](this);
          }
        });
      }
    }
    (ut(O, 'close'), C(O));
    const V = '[data-bs-toggle="button"]';
    class z extends U {
      static get NAME() {
        return 'button';
      }
      toggle() {
        this._element.setAttribute('aria-pressed', this._element.classList.toggle('active'));
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = z.getOrCreateInstance(this);
          d === 'toggle' && p[d]();
        });
      }
    }
    (F.on(document, 'click.bs.button.data-api', V, (b) => {
      b.preventDefault();
      const d = b.target.closest(V);
      z.getOrCreateInstance(d).toggle();
    }),
      C(z));
    const j = '.bs.swipe',
      tt = `touchstart${j}`,
      Q = `touchmove${j}`,
      Y = `touchend${j}`,
      K = `pointerdown${j}`,
      gt = `pointerup${j}`,
      nt = { endCallback: null, leftCallback: null, rightCallback: null },
      pt = {
        endCallback: '(function|null)',
        leftCallback: '(function|null)',
        rightCallback: '(function|null)'
      };
    class yt extends re {
      constructor(d, p) {
        (super(),
          (this._element = d),
          d &&
            yt.isSupported() &&
            ((this._config = this._getConfig(p)),
            (this._deltaX = 0),
            (this._supportPointerEvents = !!window.PointerEvent),
            this._initEvents()));
      }
      static get Default() {
        return nt;
      }
      static get DefaultType() {
        return pt;
      }
      static get NAME() {
        return 'swipe';
      }
      dispose() {
        F.off(this._element, j);
      }
      _start(d) {
        this._supportPointerEvents
          ? this._eventIsPointerPenTouch(d) && (this._deltaX = d.clientX)
          : (this._deltaX = d.touches[0].clientX);
      }
      _end(d) {
        (this._eventIsPointerPenTouch(d) && (this._deltaX = d.clientX - this._deltaX),
          this._handleSwipe(),
          T(this._config.endCallback));
      }
      _move(d) {
        this._deltaX = d.touches && d.touches.length > 1 ? 0 : d.touches[0].clientX - this._deltaX;
      }
      _handleSwipe() {
        const d = Math.abs(this._deltaX);
        if (d <= 40) return;
        const p = d / this._deltaX;
        ((this._deltaX = 0),
          p && T(p > 0 ? this._config.rightCallback : this._config.leftCallback));
      }
      _initEvents() {
        this._supportPointerEvents
          ? (F.on(this._element, K, (d) => this._start(d)),
            F.on(this._element, gt, (d) => this._end(d)),
            this._element.classList.add('pointer-event'))
          : (F.on(this._element, tt, (d) => this._start(d)),
            F.on(this._element, Q, (d) => this._move(d)),
            F.on(this._element, Y, (d) => this._end(d)));
      }
      _eventIsPointerPenTouch(d) {
        return this._supportPointerEvents && (d.pointerType === 'pen' || d.pointerType === 'touch');
      }
      static isSupported() {
        return 'ontouchstart' in document.documentElement || navigator.maxTouchPoints > 0;
      }
    }
    const Ct = '.bs.carousel',
      Xt = '.data-api',
      Ht = 'ArrowLeft',
      De = 'ArrowRight',
      ye = 'next',
      Oe = 'prev',
      Ee = 'left',
      Ms = 'right',
      wr = `slide${Ct}`,
      Re = `slid${Ct}`,
      hs = `keydown${Ct}`,
      Sr = `mouseenter${Ct}`,
      kr = `mouseleave${Ct}`,
      Qb = `dragstart${Ct}`,
      t_ = `load${Ct}${Xt}`,
      e_ = `click${Ct}${Xt}`,
      Gd = 'carousel',
      Cr = 'active',
      Xd = '.active',
      Yd = '.carousel-item',
      s_ = Xd + Yd,
      n_ = { [Ht]: Ms, [De]: Ee },
      i_ = { interval: 5e3, keyboard: !0, pause: 'hover', ride: !1, touch: !0, wrap: !0 },
      o_ = {
        interval: '(number|boolean)',
        keyboard: 'boolean',
        pause: '(string|boolean)',
        ride: '(boolean|string)',
        touch: 'boolean',
        wrap: 'boolean'
      };
    class yi extends U {
      constructor(d, p) {
        (super(d, p),
          (this._interval = null),
          (this._activeElement = null),
          (this._isSliding = !1),
          (this.touchTimeout = null),
          (this._swipeHelper = null),
          (this._indicatorsElement = B.findOne('.carousel-indicators', this._element)),
          this._addEventListeners(),
          this._config.ride === Gd && this.cycle());
      }
      static get Default() {
        return i_;
      }
      static get DefaultType() {
        return o_;
      }
      static get NAME() {
        return 'carousel';
      }
      next() {
        this._slide(ye);
      }
      nextWhenVisible() {
        !document.hidden && h(this._element) && this.next();
      }
      prev() {
        this._slide(Oe);
      }
      pause() {
        (this._isSliding && a(this._element), this._clearInterval());
      }
      cycle() {
        (this._clearInterval(),
          this._updateInterval(),
          (this._interval = setInterval(() => this.nextWhenVisible(), this._config.interval)));
      }
      _maybeEnableCycle() {
        this._config.ride &&
          (this._isSliding ? F.one(this._element, Re, () => this.cycle()) : this.cycle());
      }
      to(d) {
        const p = this._getItems();
        if (d > p.length - 1 || d < 0) return;
        if (this._isSliding) return void F.one(this._element, Re, () => this.to(d));
        const v = this._getItemIndex(this._getActive());
        if (v === d) return;
        const A = d > v ? ye : Oe;
        this._slide(A, p[d]);
      }
      dispose() {
        (this._swipeHelper && this._swipeHelper.dispose(), super.dispose());
      }
      _configAfterMerge(d) {
        return ((d.defaultInterval = d.interval), d);
      }
      _addEventListeners() {
        (this._config.keyboard && F.on(this._element, hs, (d) => this._keydown(d)),
          this._config.pause === 'hover' &&
            (F.on(this._element, Sr, () => this.pause()),
            F.on(this._element, kr, () => this._maybeEnableCycle())),
          this._config.touch && yt.isSupported() && this._addTouchEventListeners());
      }
      _addTouchEventListeners() {
        for (const p of B.find('.carousel-item img', this._element))
          F.on(p, Qb, (v) => v.preventDefault());
        const d = {
          leftCallback: () => this._slide(this._directionToOrder(Ee)),
          rightCallback: () => this._slide(this._directionToOrder(Ms)),
          endCallback: () => {
            this._config.pause === 'hover' &&
              (this.pause(),
              this.touchTimeout && clearTimeout(this.touchTimeout),
              (this.touchTimeout = setTimeout(
                () => this._maybeEnableCycle(),
                500 + this._config.interval
              )));
          }
        };
        this._swipeHelper = new yt(this._element, d);
      }
      _keydown(d) {
        if (/input|textarea/i.test(d.target.tagName)) return;
        const p = n_[d.key];
        p && (d.preventDefault(), this._slide(this._directionToOrder(p)));
      }
      _getItemIndex(d) {
        return this._getItems().indexOf(d);
      }
      _setActiveIndicatorElement(d) {
        if (!this._indicatorsElement) return;
        const p = B.findOne(Xd, this._indicatorsElement);
        (p.classList.remove(Cr), p.removeAttribute('aria-current'));
        const v = B.findOne(`[data-bs-slide-to="${d}"]`, this._indicatorsElement);
        v && (v.classList.add(Cr), v.setAttribute('aria-current', 'true'));
      }
      _updateInterval() {
        const d = this._activeElement || this._getActive();
        if (!d) return;
        const p = Number.parseInt(d.getAttribute('data-bs-interval'), 10);
        this._config.interval = p || this._config.defaultInterval;
      }
      _slide(d, p = null) {
        if (this._isSliding) return;
        const v = this._getActive(),
          A = d === ye,
          P = p || M(this._getItems(), v, A, this._config.wrap);
        if (P === v) return;
        const N = this._getItemIndex(P),
          W = (st) =>
            F.trigger(this._element, st, {
              relatedTarget: P,
              direction: this._orderToDirection(d),
              from: this._getItemIndex(v),
              to: N
            });
        if (W(wr).defaultPrevented || !v || !P) return;
        const J = !!this._interval;
        (this.pause(),
          (this._isSliding = !0),
          this._setActiveIndicatorElement(N),
          (this._activeElement = P));
        const rt = A ? 'carousel-item-start' : 'carousel-item-end',
          at = A ? 'carousel-item-next' : 'carousel-item-prev';
        (P.classList.add(at),
          _(P),
          v.classList.add(rt),
          P.classList.add(rt),
          this._queueCallback(
            () => {
              (P.classList.remove(rt, at),
                P.classList.add(Cr),
                v.classList.remove(Cr, at, rt),
                (this._isSliding = !1),
                W(Re));
            },
            v,
            this._isAnimated()
          ),
          J && this.cycle());
      }
      _isAnimated() {
        return this._element.classList.contains('slide');
      }
      _getActive() {
        return B.findOne(s_, this._element);
      }
      _getItems() {
        return B.find(Yd, this._element);
      }
      _clearInterval() {
        this._interval && (clearInterval(this._interval), (this._interval = null));
      }
      _directionToOrder(d) {
        return w() ? (d === Ee ? Oe : ye) : d === Ee ? ye : Oe;
      }
      _orderToDirection(d) {
        return w() ? (d === Oe ? Ee : Ms) : d === Oe ? Ms : Ee;
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = yi.getOrCreateInstance(this, d);
          if (typeof d != 'number') {
            if (typeof d == 'string') {
              if (p[d] === void 0 || d.startsWith('_') || d === 'constructor')
                throw new TypeError(`No method named "${d}"`);
              p[d]();
            }
          } else p.to(d);
        });
      }
    }
    (F.on(document, e_, '[data-bs-slide], [data-bs-slide-to]', function (b) {
      const d = B.getElementFromSelector(this);
      if (!d || !d.classList.contains(Gd)) return;
      b.preventDefault();
      const p = yi.getOrCreateInstance(d),
        v = this.getAttribute('data-bs-slide-to');
      return v
        ? (p.to(v), void p._maybeEnableCycle())
        : oe.getDataAttribute(this, 'slide') === 'next'
          ? (p.next(), void p._maybeEnableCycle())
          : (p.prev(), void p._maybeEnableCycle());
    }),
      F.on(window, t_, () => {
        const b = B.find('[data-bs-ride="carousel"]');
        for (const d of b) yi.getOrCreateInstance(d);
      }),
      C(yi));
    const no = '.bs.collapse',
      r_ = `show${no}`,
      a_ = `shown${no}`,
      l_ = `hide${no}`,
      c_ = `hidden${no}`,
      d_ = `click${no}.data-api`,
      yl = 'show',
      vi = 'collapse',
      Tr = 'collapsing',
      u_ = `:scope .${vi} .${vi}`,
      vl = '[data-bs-toggle="collapse"]',
      h_ = { parent: null, toggle: !0 },
      f_ = { parent: '(null|element)', toggle: 'boolean' };
    class xi extends U {
      constructor(d, p) {
        (super(d, p), (this._isTransitioning = !1), (this._triggerArray = []));
        const v = B.find(vl);
        for (const A of v) {
          const P = B.getSelectorFromElement(A),
            N = B.find(P).filter((W) => W === this._element);
          P !== null && N.length && this._triggerArray.push(A);
        }
        (this._initializeChildren(),
          this._config.parent ||
            this._addAriaAndCollapsedClass(this._triggerArray, this._isShown()),
          this._config.toggle && this.toggle());
      }
      static get Default() {
        return h_;
      }
      static get DefaultType() {
        return f_;
      }
      static get NAME() {
        return 'collapse';
      }
      toggle() {
        this._isShown() ? this.hide() : this.show();
      }
      show() {
        if (this._isTransitioning || this._isShown()) return;
        let d = [];
        if (
          (this._config.parent &&
            (d = this._getFirstLevelChildren('.collapse.show, .collapse.collapsing')
              .filter((A) => A !== this._element)
              .map((A) => xi.getOrCreateInstance(A, { toggle: !1 }))),
          (d.length && d[0]._isTransitioning) || F.trigger(this._element, r_).defaultPrevented)
        )
          return;
        for (const A of d) A.hide();
        const p = this._getDimension();
        (this._element.classList.remove(vi),
          this._element.classList.add(Tr),
          (this._element.style[p] = 0),
          this._addAriaAndCollapsedClass(this._triggerArray, !0),
          (this._isTransitioning = !0));
        const v = `scroll${p[0].toUpperCase() + p.slice(1)}`;
        (this._queueCallback(
          () => {
            ((this._isTransitioning = !1),
              this._element.classList.remove(Tr),
              this._element.classList.add(vi, yl),
              (this._element.style[p] = ''),
              F.trigger(this._element, a_));
          },
          this._element,
          !0
        ),
          (this._element.style[p] = `${this._element[v]}px`));
      }
      hide() {
        if (
          this._isTransitioning ||
          !this._isShown() ||
          F.trigger(this._element, l_).defaultPrevented
        )
          return;
        const d = this._getDimension();
        ((this._element.style[d] = `${this._element.getBoundingClientRect()[d]}px`),
          _(this._element),
          this._element.classList.add(Tr),
          this._element.classList.remove(vi, yl));
        for (const p of this._triggerArray) {
          const v = B.getElementFromSelector(p);
          v && !this._isShown(v) && this._addAriaAndCollapsedClass([p], !1);
        }
        ((this._isTransitioning = !0),
          (this._element.style[d] = ''),
          this._queueCallback(
            () => {
              ((this._isTransitioning = !1),
                this._element.classList.remove(Tr),
                this._element.classList.add(vi),
                F.trigger(this._element, c_));
            },
            this._element,
            !0
          ));
      }
      _isShown(d = this._element) {
        return d.classList.contains(yl);
      }
      _configAfterMerge(d) {
        return ((d.toggle = !!d.toggle), (d.parent = c(d.parent)), d);
      }
      _getDimension() {
        return this._element.classList.contains('collapse-horizontal') ? 'width' : 'height';
      }
      _initializeChildren() {
        if (!this._config.parent) return;
        const d = this._getFirstLevelChildren(vl);
        for (const p of d) {
          const v = B.getElementFromSelector(p);
          v && this._addAriaAndCollapsedClass([p], this._isShown(v));
        }
      }
      _getFirstLevelChildren(d) {
        const p = B.find(u_, this._config.parent);
        return B.find(d, this._config.parent).filter((v) => !p.includes(v));
      }
      _addAriaAndCollapsedClass(d, p) {
        if (d.length)
          for (const v of d)
            (v.classList.toggle('collapsed', !p), v.setAttribute('aria-expanded', p));
      }
      static jQueryInterface(d) {
        const p = {};
        return (
          typeof d == 'string' && /show|hide/.test(d) && (p.toggle = !1),
          this.each(function () {
            const v = xi.getOrCreateInstance(this, p);
            if (typeof d == 'string') {
              if (v[d] === void 0) throw new TypeError(`No method named "${d}"`);
              v[d]();
            }
          })
        );
      }
    }
    (F.on(document, d_, vl, function (b) {
      (b.target.tagName === 'A' || (b.delegateTarget && b.delegateTarget.tagName === 'A')) &&
        b.preventDefault();
      for (const d of B.getMultipleElementsFromSelector(this))
        xi.getOrCreateInstance(d, { toggle: !1 }).toggle();
    }),
      C(xi));
    var je = 'top',
      ns = 'bottom',
      is = 'right',
      Ve = 'left',
      Ar = 'auto',
      wi = [je, ns, is, Ve],
      Bn = 'start',
      Si = 'end',
      Jd = 'clippingParents',
      xl = 'viewport',
      ki = 'popper',
      Zd = 'reference',
      wl = wi.reduce(function (b, d) {
        return b.concat([d + '-' + Bn, d + '-' + Si]);
      }, []),
      Sl = [].concat(wi, [Ar]).reduce(function (b, d) {
        return b.concat([d, d + '-' + Bn, d + '-' + Si]);
      }, []),
      Qd = 'beforeRead',
      tu = 'read',
      eu = 'afterRead',
      su = 'beforeMain',
      nu = 'main',
      iu = 'afterMain',
      ou = 'beforeWrite',
      ru = 'write',
      au = 'afterWrite',
      lu = [Qd, tu, eu, su, nu, iu, ou, ru, au];
    function Is(b) {
      return b ? (b.nodeName || '').toLowerCase() : null;
    }
    function os(b) {
      if (b == null) return window;
      if (b.toString() !== '[object Window]') {
        var d = b.ownerDocument;
        return (d && d.defaultView) || window;
      }
      return b;
    }
    function Un(b) {
      return b instanceof os(b).Element || b instanceof Element;
    }
    function fs(b) {
      return b instanceof os(b).HTMLElement || b instanceof HTMLElement;
    }
    function kl(b) {
      return typeof ShadowRoot < 'u' && (b instanceof os(b).ShadowRoot || b instanceof ShadowRoot);
    }
    const Cl = {
      name: 'applyStyles',
      enabled: !0,
      phase: 'write',
      fn: function (b) {
        var d = b.state;
        Object.keys(d.elements).forEach(function (p) {
          var v = d.styles[p] || {},
            A = d.attributes[p] || {},
            P = d.elements[p];
          fs(P) &&
            Is(P) &&
            (Object.assign(P.style, v),
            Object.keys(A).forEach(function (N) {
              var W = A[N];
              W === !1 ? P.removeAttribute(N) : P.setAttribute(N, W === !0 ? '' : W);
            }));
        });
      },
      effect: function (b) {
        var d = b.state,
          p = {
            popper: { position: d.options.strategy, left: '0', top: '0', margin: '0' },
            arrow: { position: 'absolute' },
            reference: {}
          };
        return (
          Object.assign(d.elements.popper.style, p.popper),
          (d.styles = p),
          d.elements.arrow && Object.assign(d.elements.arrow.style, p.arrow),
          function () {
            Object.keys(d.elements).forEach(function (v) {
              var A = d.elements[v],
                P = d.attributes[v] || {},
                N = Object.keys(d.styles.hasOwnProperty(v) ? d.styles[v] : p[v]).reduce(function (
                  W,
                  J
                ) {
                  return ((W[J] = ''), W);
                }, {});
              fs(A) &&
                Is(A) &&
                (Object.assign(A.style, N),
                Object.keys(P).forEach(function (W) {
                  A.removeAttribute(W);
                }));
            });
          }
        );
      },
      requires: ['computeStyles']
    };
    function Ls(b) {
      return b.split('-')[0];
    }
    var jn = Math.max,
      Pr = Math.min,
      Ci = Math.round;
    function Tl() {
      var b = navigator.userAgentData;
      return b != null && b.brands && Array.isArray(b.brands)
        ? b.brands
            .map(function (d) {
              return d.brand + '/' + d.version;
            })
            .join(' ')
        : navigator.userAgent;
    }
    function cu() {
      return !/^((?!chrome|android).)*safari/i.test(Tl());
    }
    function Ti(b, d, p) {
      (d === void 0 && (d = !1), p === void 0 && (p = !1));
      var v = b.getBoundingClientRect(),
        A = 1,
        P = 1;
      d &&
        fs(b) &&
        ((A = (b.offsetWidth > 0 && Ci(v.width) / b.offsetWidth) || 1),
        (P = (b.offsetHeight > 0 && Ci(v.height) / b.offsetHeight) || 1));
      var N = (Un(b) ? os(b) : window).visualViewport,
        W = !cu() && p,
        J = (v.left + (W && N ? N.offsetLeft : 0)) / A,
        rt = (v.top + (W && N ? N.offsetTop : 0)) / P,
        at = v.width / A,
        st = v.height / P;
      return {
        width: at,
        height: st,
        top: rt,
        right: J + at,
        bottom: rt + st,
        left: J,
        x: J,
        y: rt
      };
    }
    function Al(b) {
      var d = Ti(b),
        p = b.offsetWidth,
        v = b.offsetHeight;
      return (
        Math.abs(d.width - p) <= 1 && (p = d.width),
        Math.abs(d.height - v) <= 1 && (v = d.height),
        { x: b.offsetLeft, y: b.offsetTop, width: p, height: v }
      );
    }
    function du(b, d) {
      var p = d.getRootNode && d.getRootNode();
      if (b.contains(d)) return !0;
      if (p && kl(p)) {
        var v = d;
        do {
          if (v && b.isSameNode(v)) return !0;
          v = v.parentNode || v.host;
        } while (v);
      }
      return !1;
    }
    function Ys(b) {
      return os(b).getComputedStyle(b);
    }
    function p_(b) {
      return ['table', 'td', 'th'].indexOf(Is(b)) >= 0;
    }
    function xn(b) {
      return ((Un(b) ? b.ownerDocument : b.document) || window.document).documentElement;
    }
    function Or(b) {
      return Is(b) === 'html'
        ? b
        : b.assignedSlot || b.parentNode || (kl(b) ? b.host : null) || xn(b);
    }
    function uu(b) {
      return fs(b) && Ys(b).position !== 'fixed' ? b.offsetParent : null;
    }
    function io(b) {
      for (var d = os(b), p = uu(b); p && p_(p) && Ys(p).position === 'static'; ) p = uu(p);
      return p && (Is(p) === 'html' || (Is(p) === 'body' && Ys(p).position === 'static'))
        ? d
        : p ||
            (function (v) {
              var A = /firefox/i.test(Tl());
              if (/Trident/i.test(Tl()) && fs(v) && Ys(v).position === 'fixed') return null;
              var P = Or(v);
              for (kl(P) && (P = P.host); fs(P) && ['html', 'body'].indexOf(Is(P)) < 0; ) {
                var N = Ys(P);
                if (
                  N.transform !== 'none' ||
                  N.perspective !== 'none' ||
                  N.contain === 'paint' ||
                  ['transform', 'perspective'].indexOf(N.willChange) !== -1 ||
                  (A && N.willChange === 'filter') ||
                  (A && N.filter && N.filter !== 'none')
                )
                  return P;
                P = P.parentNode;
              }
              return null;
            })(b) ||
            d;
    }
    function Pl(b) {
      return ['top', 'bottom'].indexOf(b) >= 0 ? 'x' : 'y';
    }
    function oo(b, d, p) {
      return jn(b, Pr(d, p));
    }
    function hu(b) {
      return Object.assign({}, { top: 0, right: 0, bottom: 0, left: 0 }, b);
    }
    function fu(b, d) {
      return d.reduce(function (p, v) {
        return ((p[v] = b), p);
      }, {});
    }
    const pu = {
      name: 'arrow',
      enabled: !0,
      phase: 'main',
      fn: function (b) {
        var d,
          p = b.state,
          v = b.name,
          A = b.options,
          P = p.elements.arrow,
          N = p.modifiersData.popperOffsets,
          W = Ls(p.placement),
          J = Pl(W),
          rt = [Ve, is].indexOf(W) >= 0 ? 'height' : 'width';
        if (P && N) {
          var at = (function (se, Jt) {
              return hu(
                typeof (se =
                  typeof se == 'function'
                    ? se(Object.assign({}, Jt.rects, { placement: Jt.placement }))
                    : se) != 'number'
                  ? se
                  : fu(se, wi)
              );
            })(A.padding, p),
            st = Al(P),
            Pt = J === 'y' ? je : Ve,
            vt = J === 'y' ? ns : is,
            St = p.rects.reference[rt] + p.rects.reference[J] - N[J] - p.rects.popper[rt],
            wt = N[J] - p.rects.reference[J],
            kt = io(P),
            ee = kt ? (J === 'y' ? kt.clientHeight || 0 : kt.clientWidth || 0) : 0,
            ae = St / 2 - wt / 2,
            It = at[Pt],
            zt = ee - st[rt] - at[vt],
            Dt = ee / 2 - st[rt] / 2 + ae,
            Ft = oo(It, Dt, zt),
            Yt = J;
          p.modifiersData[v] = (((d = {})[Yt] = Ft), (d.centerOffset = Ft - Dt), d);
        }
      },
      effect: function (b) {
        var d = b.state,
          p = b.options.element,
          v = p === void 0 ? '[data-popper-arrow]' : p;
        v != null &&
          (typeof v != 'string' || (v = d.elements.popper.querySelector(v))) &&
          du(d.elements.popper, v) &&
          (d.elements.arrow = v);
      },
      requires: ['popperOffsets'],
      requiresIfExists: ['preventOverflow']
    };
    function Ai(b) {
      return b.split('-')[1];
    }
    var m_ = { top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' };
    function mu(b) {
      var d,
        p = b.popper,
        v = b.popperRect,
        A = b.placement,
        P = b.variation,
        N = b.offsets,
        W = b.position,
        J = b.gpuAcceleration,
        rt = b.adaptive,
        at = b.roundOffsets,
        st = b.isFixed,
        Pt = N.x,
        vt = Pt === void 0 ? 0 : Pt,
        St = N.y,
        wt = St === void 0 ? 0 : St,
        kt = typeof at == 'function' ? at({ x: vt, y: wt }) : { x: vt, y: wt };
      ((vt = kt.x), (wt = kt.y));
      var ee = N.hasOwnProperty('x'),
        ae = N.hasOwnProperty('y'),
        It = Ve,
        zt = je,
        Dt = window;
      if (rt) {
        var Ft = io(p),
          Yt = 'clientHeight',
          se = 'clientWidth';
        (Ft === os(p) &&
          Ys((Ft = xn(p))).position !== 'static' &&
          W === 'absolute' &&
          ((Yt = 'scrollHeight'), (se = 'scrollWidth')),
          (A === je || ((A === Ve || A === is) && P === Si)) &&
            ((zt = ns),
            (wt -=
              (st && Ft === Dt && Dt.visualViewport ? Dt.visualViewport.height : Ft[Yt]) -
              v.height),
            (wt *= J ? 1 : -1)),
          (A !== Ve && ((A !== je && A !== ns) || P !== Si)) ||
            ((It = is),
            (vt -=
              (st && Ft === Dt && Dt.visualViewport ? Dt.visualViewport.width : Ft[se]) - v.width),
            (vt *= J ? 1 : -1)));
      }
      var Jt,
        me = Object.assign({ position: W }, rt && m_),
        rs =
          at === !0
            ? (function (As, He) {
                var ms = As.x,
                  gs = As.y,
                  fe = He.devicePixelRatio || 1;
                return { x: Ci(ms * fe) / fe || 0, y: Ci(gs * fe) / fe || 0 };
              })({ x: vt, y: wt }, os(p))
            : { x: vt, y: wt };
      return (
        (vt = rs.x),
        (wt = rs.y),
        J
          ? Object.assign(
              {},
              me,
              (((Jt = {})[zt] = ae ? '0' : ''),
              (Jt[It] = ee ? '0' : ''),
              (Jt.transform =
                (Dt.devicePixelRatio || 1) <= 1
                  ? 'translate(' + vt + 'px, ' + wt + 'px)'
                  : 'translate3d(' + vt + 'px, ' + wt + 'px, 0)'),
              Jt)
            )
          : Object.assign(
              {},
              me,
              (((d = {})[zt] = ae ? wt + 'px' : ''),
              (d[It] = ee ? vt + 'px' : ''),
              (d.transform = ''),
              d)
            )
      );
    }
    const Ol = {
      name: 'computeStyles',
      enabled: !0,
      phase: 'beforeWrite',
      fn: function (b) {
        var d = b.state,
          p = b.options,
          v = p.gpuAcceleration,
          A = v === void 0 || v,
          P = p.adaptive,
          N = P === void 0 || P,
          W = p.roundOffsets,
          J = W === void 0 || W,
          rt = {
            placement: Ls(d.placement),
            variation: Ai(d.placement),
            popper: d.elements.popper,
            popperRect: d.rects.popper,
            gpuAcceleration: A,
            isFixed: d.options.strategy === 'fixed'
          };
        (d.modifiersData.popperOffsets != null &&
          (d.styles.popper = Object.assign(
            {},
            d.styles.popper,
            mu(
              Object.assign({}, rt, {
                offsets: d.modifiersData.popperOffsets,
                position: d.options.strategy,
                adaptive: N,
                roundOffsets: J
              })
            )
          )),
          d.modifiersData.arrow != null &&
            (d.styles.arrow = Object.assign(
              {},
              d.styles.arrow,
              mu(
                Object.assign({}, rt, {
                  offsets: d.modifiersData.arrow,
                  position: 'absolute',
                  adaptive: !1,
                  roundOffsets: J
                })
              )
            )),
          (d.attributes.popper = Object.assign({}, d.attributes.popper, {
            'data-popper-placement': d.placement
          })));
      },
      data: {}
    };
    var Er = { passive: !0 };
    const El = {
      name: 'eventListeners',
      enabled: !0,
      phase: 'write',
      fn: function () {},
      effect: function (b) {
        var d = b.state,
          p = b.instance,
          v = b.options,
          A = v.scroll,
          P = A === void 0 || A,
          N = v.resize,
          W = N === void 0 || N,
          J = os(d.elements.popper),
          rt = [].concat(d.scrollParents.reference, d.scrollParents.popper);
        return (
          P &&
            rt.forEach(function (at) {
              at.addEventListener('scroll', p.update, Er);
            }),
          W && J.addEventListener('resize', p.update, Er),
          function () {
            (P &&
              rt.forEach(function (at) {
                at.removeEventListener('scroll', p.update, Er);
              }),
              W && J.removeEventListener('resize', p.update, Er));
          }
        );
      },
      data: {}
    };
    var g_ = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' };
    function Rr(b) {
      return b.replace(/left|right|bottom|top/g, function (d) {
        return g_[d];
      });
    }
    var b_ = { start: 'end', end: 'start' };
    function gu(b) {
      return b.replace(/start|end/g, function (d) {
        return b_[d];
      });
    }
    function Rl(b) {
      var d = os(b);
      return { scrollLeft: d.pageXOffset, scrollTop: d.pageYOffset };
    }
    function Dl(b) {
      return Ti(xn(b)).left + Rl(b).scrollLeft;
    }
    function Ml(b) {
      var d = Ys(b),
        p = d.overflow,
        v = d.overflowX,
        A = d.overflowY;
      return /auto|scroll|overlay|hidden/.test(p + A + v);
    }
    function bu(b) {
      return ['html', 'body', '#document'].indexOf(Is(b)) >= 0
        ? b.ownerDocument.body
        : fs(b) && Ml(b)
          ? b
          : bu(Or(b));
    }
    function ro(b, d) {
      var p;
      d === void 0 && (d = []);
      var v = bu(b),
        A = v === ((p = b.ownerDocument) == null ? void 0 : p.body),
        P = os(v),
        N = A ? [P].concat(P.visualViewport || [], Ml(v) ? v : []) : v,
        W = d.concat(N);
      return A ? W : W.concat(ro(Or(N)));
    }
    function Il(b) {
      return Object.assign({}, b, {
        left: b.x,
        top: b.y,
        right: b.x + b.width,
        bottom: b.y + b.height
      });
    }
    function _u(b, d, p) {
      return d === xl
        ? Il(
            (function (v, A) {
              var P = os(v),
                N = xn(v),
                W = P.visualViewport,
                J = N.clientWidth,
                rt = N.clientHeight,
                at = 0,
                st = 0;
              if (W) {
                ((J = W.width), (rt = W.height));
                var Pt = cu();
                (Pt || (!Pt && A === 'fixed')) && ((at = W.offsetLeft), (st = W.offsetTop));
              }
              return { width: J, height: rt, x: at + Dl(v), y: st };
            })(b, p)
          )
        : Un(d)
          ? (function (v, A) {
              var P = Ti(v, !1, A === 'fixed');
              return (
                (P.top = P.top + v.clientTop),
                (P.left = P.left + v.clientLeft),
                (P.bottom = P.top + v.clientHeight),
                (P.right = P.left + v.clientWidth),
                (P.width = v.clientWidth),
                (P.height = v.clientHeight),
                (P.x = P.left),
                (P.y = P.top),
                P
              );
            })(d, p)
          : Il(
              (function (v) {
                var A,
                  P = xn(v),
                  N = Rl(v),
                  W = (A = v.ownerDocument) == null ? void 0 : A.body,
                  J = jn(
                    P.scrollWidth,
                    P.clientWidth,
                    W ? W.scrollWidth : 0,
                    W ? W.clientWidth : 0
                  ),
                  rt = jn(
                    P.scrollHeight,
                    P.clientHeight,
                    W ? W.scrollHeight : 0,
                    W ? W.clientHeight : 0
                  ),
                  at = -N.scrollLeft + Dl(v),
                  st = -N.scrollTop;
                return (
                  Ys(W || P).direction === 'rtl' &&
                    (at += jn(P.clientWidth, W ? W.clientWidth : 0) - J),
                  { width: J, height: rt, x: at, y: st }
                );
              })(xn(b))
            );
    }
    function yu(b) {
      var d,
        p = b.reference,
        v = b.element,
        A = b.placement,
        P = A ? Ls(A) : null,
        N = A ? Ai(A) : null,
        W = p.x + p.width / 2 - v.width / 2,
        J = p.y + p.height / 2 - v.height / 2;
      switch (P) {
        case je:
          d = { x: W, y: p.y - v.height };
          break;
        case ns:
          d = { x: W, y: p.y + p.height };
          break;
        case is:
          d = { x: p.x + p.width, y: J };
          break;
        case Ve:
          d = { x: p.x - v.width, y: J };
          break;
        default:
          d = { x: p.x, y: p.y };
      }
      var rt = P ? Pl(P) : null;
      if (rt != null) {
        var at = rt === 'y' ? 'height' : 'width';
        switch (N) {
          case Bn:
            d[rt] = d[rt] - (p[at] / 2 - v[at] / 2);
            break;
          case Si:
            d[rt] = d[rt] + (p[at] / 2 - v[at] / 2);
        }
      }
      return d;
    }
    function Pi(b, d) {
      d === void 0 && (d = {});
      var p = d,
        v = p.placement,
        A = v === void 0 ? b.placement : v,
        P = p.strategy,
        N = P === void 0 ? b.strategy : P,
        W = p.boundary,
        J = W === void 0 ? Jd : W,
        rt = p.rootBoundary,
        at = rt === void 0 ? xl : rt,
        st = p.elementContext,
        Pt = st === void 0 ? ki : st,
        vt = p.altBoundary,
        St = vt !== void 0 && vt,
        wt = p.padding,
        kt = wt === void 0 ? 0 : wt,
        ee = hu(typeof kt != 'number' ? kt : fu(kt, wi)),
        ae = Pt === ki ? Zd : ki,
        It = b.rects.popper,
        zt = b.elements[St ? ae : Pt],
        Dt = (function (He, ms, gs, fe) {
          var Ns =
              ms === 'clippingParents'
                ? (function (ie) {
                    var ze = ro(Or(ie)),
                      bs =
                        ['absolute', 'fixed'].indexOf(Ys(ie).position) >= 0 && fs(ie) ? io(ie) : ie;
                    return Un(bs)
                      ? ze.filter(function (Sn) {
                          return Un(Sn) && du(Sn, bs) && Is(Sn) !== 'body';
                        })
                      : [];
                  })(He)
                : [].concat(ms),
            $s = [].concat(Ns, [gs]),
            Ri = $s[0],
            Ae = $s.reduce(
              function (ie, ze) {
                var bs = _u(He, ze, fe);
                return (
                  (ie.top = jn(bs.top, ie.top)),
                  (ie.right = Pr(bs.right, ie.right)),
                  (ie.bottom = Pr(bs.bottom, ie.bottom)),
                  (ie.left = jn(bs.left, ie.left)),
                  ie
                );
              },
              _u(He, Ri, fe)
            );
          return (
            (Ae.width = Ae.right - Ae.left),
            (Ae.height = Ae.bottom - Ae.top),
            (Ae.x = Ae.left),
            (Ae.y = Ae.top),
            Ae
          );
        })(Un(zt) ? zt : zt.contextElement || xn(b.elements.popper), J, at, N),
        Ft = Ti(b.elements.reference),
        Yt = yu({ reference: Ft, element: It, placement: A }),
        se = Il(Object.assign({}, It, Yt)),
        Jt = Pt === ki ? se : Ft,
        me = {
          top: Dt.top - Jt.top + ee.top,
          bottom: Jt.bottom - Dt.bottom + ee.bottom,
          left: Dt.left - Jt.left + ee.left,
          right: Jt.right - Dt.right + ee.right
        },
        rs = b.modifiersData.offset;
      if (Pt === ki && rs) {
        var As = rs[A];
        Object.keys(me).forEach(function (He) {
          var ms = [is, ns].indexOf(He) >= 0 ? 1 : -1,
            gs = [je, ns].indexOf(He) >= 0 ? 'y' : 'x';
          me[He] += As[gs] * ms;
        });
      }
      return me;
    }
    function __(b, d) {
      d === void 0 && (d = {});
      var p = d,
        v = p.placement,
        A = p.boundary,
        P = p.rootBoundary,
        N = p.padding,
        W = p.flipVariations,
        J = p.allowedAutoPlacements,
        rt = J === void 0 ? Sl : J,
        at = Ai(v),
        st = at
          ? W
            ? wl
            : wl.filter(function (St) {
                return Ai(St) === at;
              })
          : wi,
        Pt = st.filter(function (St) {
          return rt.indexOf(St) >= 0;
        });
      Pt.length === 0 && (Pt = st);
      var vt = Pt.reduce(function (St, wt) {
        return (
          (St[wt] = Pi(b, { placement: wt, boundary: A, rootBoundary: P, padding: N })[Ls(wt)]),
          St
        );
      }, {});
      return Object.keys(vt).sort(function (St, wt) {
        return vt[St] - vt[wt];
      });
    }
    const vu = {
      name: 'flip',
      enabled: !0,
      phase: 'main',
      fn: function (b) {
        var d = b.state,
          p = b.options,
          v = b.name;
        if (!d.modifiersData[v]._skip) {
          for (
            var A = p.mainAxis,
              P = A === void 0 || A,
              N = p.altAxis,
              W = N === void 0 || N,
              J = p.fallbackPlacements,
              rt = p.padding,
              at = p.boundary,
              st = p.rootBoundary,
              Pt = p.altBoundary,
              vt = p.flipVariations,
              St = vt === void 0 || vt,
              wt = p.allowedAutoPlacements,
              kt = d.options.placement,
              ee = Ls(kt),
              ae =
                J ||
                (ee !== kt && St
                  ? (function (ie) {
                      if (Ls(ie) === Ar) return [];
                      var ze = Rr(ie);
                      return [gu(ie), ze, gu(ze)];
                    })(kt)
                  : [Rr(kt)]),
              It = [kt].concat(ae).reduce(function (ie, ze) {
                return ie.concat(
                  Ls(ze) === Ar
                    ? __(d, {
                        placement: ze,
                        boundary: at,
                        rootBoundary: st,
                        padding: rt,
                        flipVariations: St,
                        allowedAutoPlacements: wt
                      })
                    : ze
                );
              }, []),
              zt = d.rects.reference,
              Dt = d.rects.popper,
              Ft = new Map(),
              Yt = !0,
              se = It[0],
              Jt = 0;
            Jt < It.length;
            Jt++
          ) {
            var me = It[Jt],
              rs = Ls(me),
              As = Ai(me) === Bn,
              He = [je, ns].indexOf(rs) >= 0,
              ms = He ? 'width' : 'height',
              gs = Pi(d, {
                placement: me,
                boundary: at,
                rootBoundary: st,
                altBoundary: Pt,
                padding: rt
              }),
              fe = He ? (As ? is : Ve) : As ? ns : je;
            zt[ms] > Dt[ms] && (fe = Rr(fe));
            var Ns = Rr(fe),
              $s = [];
            if (
              (P && $s.push(gs[rs] <= 0),
              W && $s.push(gs[fe] <= 0, gs[Ns] <= 0),
              $s.every(function (ie) {
                return ie;
              }))
            ) {
              ((se = me), (Yt = !1));
              break;
            }
            Ft.set(me, $s);
          }
          if (Yt)
            for (
              var Ri = function (ie) {
                  var ze = It.find(function (bs) {
                    var Sn = Ft.get(bs);
                    if (Sn)
                      return Sn.slice(0, ie).every(function (Ur) {
                        return Ur;
                      });
                  });
                  if (ze) return ((se = ze), 'break');
                },
                Ae = St ? 3 : 1;
              Ae > 0 && Ri(Ae) !== 'break';
              Ae--
            );
          d.placement !== se &&
            ((d.modifiersData[v]._skip = !0), (d.placement = se), (d.reset = !0));
        }
      },
      requiresIfExists: ['offset'],
      data: { _skip: !1 }
    };
    function xu(b, d, p) {
      return (
        p === void 0 && (p = { x: 0, y: 0 }),
        {
          top: b.top - d.height - p.y,
          right: b.right - d.width + p.x,
          bottom: b.bottom - d.height + p.y,
          left: b.left - d.width - p.x
        }
      );
    }
    function wu(b) {
      return [je, is, ns, Ve].some(function (d) {
        return b[d] >= 0;
      });
    }
    const Su = {
        name: 'hide',
        enabled: !0,
        phase: 'main',
        requiresIfExists: ['preventOverflow'],
        fn: function (b) {
          var d = b.state,
            p = b.name,
            v = d.rects.reference,
            A = d.rects.popper,
            P = d.modifiersData.preventOverflow,
            N = Pi(d, { elementContext: 'reference' }),
            W = Pi(d, { altBoundary: !0 }),
            J = xu(N, v),
            rt = xu(W, A, P),
            at = wu(J),
            st = wu(rt);
          ((d.modifiersData[p] = {
            referenceClippingOffsets: J,
            popperEscapeOffsets: rt,
            isReferenceHidden: at,
            hasPopperEscaped: st
          }),
            (d.attributes.popper = Object.assign({}, d.attributes.popper, {
              'data-popper-reference-hidden': at,
              'data-popper-escaped': st
            })));
        }
      },
      ku = {
        name: 'offset',
        enabled: !0,
        phase: 'main',
        requires: ['popperOffsets'],
        fn: function (b) {
          var d = b.state,
            p = b.options,
            v = b.name,
            A = p.offset,
            P = A === void 0 ? [0, 0] : A,
            N = Sl.reduce(function (at, st) {
              return (
                (at[st] = (function (Pt, vt, St) {
                  var wt = Ls(Pt),
                    kt = [Ve, je].indexOf(wt) >= 0 ? -1 : 1,
                    ee =
                      typeof St == 'function' ? St(Object.assign({}, vt, { placement: Pt })) : St,
                    ae = ee[0],
                    It = ee[1];
                  return (
                    (ae = ae || 0),
                    (It = (It || 0) * kt),
                    [Ve, is].indexOf(wt) >= 0 ? { x: It, y: ae } : { x: ae, y: It }
                  );
                })(st, d.rects, P)),
                at
              );
            }, {}),
            W = N[d.placement],
            J = W.x,
            rt = W.y;
          (d.modifiersData.popperOffsets != null &&
            ((d.modifiersData.popperOffsets.x += J), (d.modifiersData.popperOffsets.y += rt)),
            (d.modifiersData[v] = N));
        }
      },
      Ll = {
        name: 'popperOffsets',
        enabled: !0,
        phase: 'read',
        fn: function (b) {
          var d = b.state,
            p = b.name;
          d.modifiersData[p] = yu({
            reference: d.rects.reference,
            element: d.rects.popper,
            placement: d.placement
          });
        },
        data: {}
      },
      Cu = {
        name: 'preventOverflow',
        enabled: !0,
        phase: 'main',
        fn: function (b) {
          var d = b.state,
            p = b.options,
            v = b.name,
            A = p.mainAxis,
            P = A === void 0 || A,
            N = p.altAxis,
            W = N !== void 0 && N,
            J = p.boundary,
            rt = p.rootBoundary,
            at = p.altBoundary,
            st = p.padding,
            Pt = p.tether,
            vt = Pt === void 0 || Pt,
            St = p.tetherOffset,
            wt = St === void 0 ? 0 : St,
            kt = Pi(d, { boundary: J, rootBoundary: rt, padding: st, altBoundary: at }),
            ee = Ls(d.placement),
            ae = Ai(d.placement),
            It = !ae,
            zt = Pl(ee),
            Dt = zt === 'x' ? 'y' : 'x',
            Ft = d.modifiersData.popperOffsets,
            Yt = d.rects.reference,
            se = d.rects.popper,
            Jt =
              typeof wt == 'function'
                ? wt(Object.assign({}, d.rects, { placement: d.placement }))
                : wt,
            me =
              typeof Jt == 'number'
                ? { mainAxis: Jt, altAxis: Jt }
                : Object.assign({ mainAxis: 0, altAxis: 0 }, Jt),
            rs = d.modifiersData.offset ? d.modifiersData.offset[d.placement] : null,
            As = { x: 0, y: 0 };
          if (Ft) {
            if (P) {
              var He,
                ms = zt === 'y' ? je : Ve,
                gs = zt === 'y' ? ns : is,
                fe = zt === 'y' ? 'height' : 'width',
                Ns = Ft[zt],
                $s = Ns + kt[ms],
                Ri = Ns - kt[gs],
                Ae = vt ? -se[fe] / 2 : 0,
                ie = ae === Bn ? Yt[fe] : se[fe],
                ze = ae === Bn ? -se[fe] : -Yt[fe],
                bs = d.elements.arrow,
                Sn = vt && bs ? Al(bs) : { width: 0, height: 0 },
                Ur = d.modifiersData['arrow#persistent']
                  ? d.modifiersData['arrow#persistent'].padding
                  : { top: 0, right: 0, bottom: 0, left: 0 },
                uh = Ur[ms],
                hh = Ur[gs],
                jr = oo(0, Yt[fe], Sn[fe]),
                Yy = It ? Yt[fe] / 2 - Ae - jr - uh - me.mainAxis : ie - jr - uh - me.mainAxis,
                Jy = It ? -Yt[fe] / 2 + Ae + jr + hh + me.mainAxis : ze + jr + hh + me.mainAxis,
                Xl = d.elements.arrow && io(d.elements.arrow),
                Zy = Xl ? (zt === 'y' ? Xl.clientTop || 0 : Xl.clientLeft || 0) : 0,
                fh = (He = rs == null ? void 0 : rs[zt]) != null ? He : 0,
                Qy = Ns + Jy - fh,
                ph = oo(vt ? Pr($s, Ns + Yy - fh - Zy) : $s, Ns, vt ? jn(Ri, Qy) : Ri);
              ((Ft[zt] = ph), (As[zt] = ph - Ns));
            }
            if (W) {
              var mh,
                tv = zt === 'x' ? je : Ve,
                ev = zt === 'x' ? ns : is,
                Xn = Ft[Dt],
                Vr = Dt === 'y' ? 'height' : 'width',
                gh = Xn + kt[tv],
                bh = Xn - kt[ev],
                Yl = [je, Ve].indexOf(ee) !== -1,
                _h = (mh = rs == null ? void 0 : rs[Dt]) != null ? mh : 0,
                yh = Yl ? gh : Xn - Yt[Vr] - se[Vr] - _h + me.altAxis,
                vh = Yl ? Xn + Yt[Vr] + se[Vr] - _h - me.altAxis : bh,
                xh =
                  vt && Yl
                    ? (function (sv, nv, Jl) {
                        var wh = oo(sv, nv, Jl);
                        return wh > Jl ? Jl : wh;
                      })(yh, Xn, vh)
                    : oo(vt ? yh : gh, Xn, vt ? vh : bh);
              ((Ft[Dt] = xh), (As[Dt] = xh - Xn));
            }
            d.modifiersData[v] = As;
          }
        },
        requiresIfExists: ['offset']
      };
    function y_(b, d, p) {
      p === void 0 && (p = !1);
      var v,
        A,
        P = fs(d),
        N =
          fs(d) &&
          (function (st) {
            var Pt = st.getBoundingClientRect(),
              vt = Ci(Pt.width) / st.offsetWidth || 1,
              St = Ci(Pt.height) / st.offsetHeight || 1;
            return vt !== 1 || St !== 1;
          })(d),
        W = xn(d),
        J = Ti(b, N, p),
        rt = { scrollLeft: 0, scrollTop: 0 },
        at = { x: 0, y: 0 };
      return (
        (P || (!P && !p)) &&
          ((Is(d) !== 'body' || Ml(W)) &&
            (rt =
              (v = d) !== os(v) && fs(v)
                ? { scrollLeft: (A = v).scrollLeft, scrollTop: A.scrollTop }
                : Rl(v)),
          fs(d)
            ? (((at = Ti(d, !0)).x += d.clientLeft), (at.y += d.clientTop))
            : W && (at.x = Dl(W))),
        {
          x: J.left + rt.scrollLeft - at.x,
          y: J.top + rt.scrollTop - at.y,
          width: J.width,
          height: J.height
        }
      );
    }
    function v_(b) {
      var d = new Map(),
        p = new Set(),
        v = [];
      function A(P) {
        (p.add(P.name),
          [].concat(P.requires || [], P.requiresIfExists || []).forEach(function (N) {
            if (!p.has(N)) {
              var W = d.get(N);
              W && A(W);
            }
          }),
          v.push(P));
      }
      return (
        b.forEach(function (P) {
          d.set(P.name, P);
        }),
        b.forEach(function (P) {
          p.has(P.name) || A(P);
        }),
        v
      );
    }
    var Tu = { placement: 'bottom', modifiers: [], strategy: 'absolute' };
    function Au() {
      for (var b = arguments.length, d = new Array(b), p = 0; p < b; p++) d[p] = arguments[p];
      return !d.some(function (v) {
        return !(v && typeof v.getBoundingClientRect == 'function');
      });
    }
    function Dr(b) {
      b === void 0 && (b = {});
      var d = b,
        p = d.defaultModifiers,
        v = p === void 0 ? [] : p,
        A = d.defaultOptions,
        P = A === void 0 ? Tu : A;
      return function (N, W, J) {
        J === void 0 && (J = P);
        var rt,
          at,
          st = {
            placement: 'bottom',
            orderedModifiers: [],
            options: Object.assign({}, Tu, P),
            modifiersData: {},
            elements: { reference: N, popper: W },
            attributes: {},
            styles: {}
          },
          Pt = [],
          vt = !1,
          St = {
            state: st,
            setOptions: function (kt) {
              var ee = typeof kt == 'function' ? kt(st.options) : kt;
              (wt(),
                (st.options = Object.assign({}, P, st.options, ee)),
                (st.scrollParents = {
                  reference: Un(N) ? ro(N) : N.contextElement ? ro(N.contextElement) : [],
                  popper: ro(W)
                }));
              var ae,
                It,
                zt = (function (Dt) {
                  var Ft = v_(Dt);
                  return lu.reduce(function (Yt, se) {
                    return Yt.concat(
                      Ft.filter(function (Jt) {
                        return Jt.phase === se;
                      })
                    );
                  }, []);
                })(
                  ((ae = [].concat(v, st.options.modifiers)),
                  (It = ae.reduce(function (Dt, Ft) {
                    var Yt = Dt[Ft.name];
                    return (
                      (Dt[Ft.name] = Yt
                        ? Object.assign({}, Yt, Ft, {
                            options: Object.assign({}, Yt.options, Ft.options),
                            data: Object.assign({}, Yt.data, Ft.data)
                          })
                        : Ft),
                      Dt
                    );
                  }, {})),
                  Object.keys(It).map(function (Dt) {
                    return It[Dt];
                  }))
                );
              return (
                (st.orderedModifiers = zt.filter(function (Dt) {
                  return Dt.enabled;
                })),
                st.orderedModifiers.forEach(function (Dt) {
                  var Ft = Dt.name,
                    Yt = Dt.options,
                    se = Yt === void 0 ? {} : Yt,
                    Jt = Dt.effect;
                  if (typeof Jt == 'function') {
                    var me = Jt({ state: st, name: Ft, instance: St, options: se });
                    Pt.push(me || function () {});
                  }
                }),
                St.update()
              );
            },
            forceUpdate: function () {
              if (!vt) {
                var kt = st.elements,
                  ee = kt.reference,
                  ae = kt.popper;
                if (Au(ee, ae)) {
                  ((st.rects = {
                    reference: y_(ee, io(ae), st.options.strategy === 'fixed'),
                    popper: Al(ae)
                  }),
                    (st.reset = !1),
                    (st.placement = st.options.placement),
                    st.orderedModifiers.forEach(function (Jt) {
                      return (st.modifiersData[Jt.name] = Object.assign({}, Jt.data));
                    }));
                  for (var It = 0; It < st.orderedModifiers.length; It++)
                    if (st.reset !== !0) {
                      var zt = st.orderedModifiers[It],
                        Dt = zt.fn,
                        Ft = zt.options,
                        Yt = Ft === void 0 ? {} : Ft,
                        se = zt.name;
                      typeof Dt == 'function' &&
                        (st = Dt({ state: st, options: Yt, name: se, instance: St }) || st);
                    } else ((st.reset = !1), (It = -1));
                }
              }
            },
            update:
              ((rt = function () {
                return new Promise(function (kt) {
                  (St.forceUpdate(), kt(st));
                });
              }),
              function () {
                return (
                  at ||
                    (at = new Promise(function (kt) {
                      Promise.resolve().then(function () {
                        ((at = void 0), kt(rt()));
                      });
                    })),
                  at
                );
              }),
            destroy: function () {
              (wt(), (vt = !0));
            }
          };
        if (!Au(N, W)) return St;
        function wt() {
          (Pt.forEach(function (kt) {
            return kt();
          }),
            (Pt = []));
        }
        return (
          St.setOptions(J).then(function (kt) {
            !vt && J.onFirstUpdate && J.onFirstUpdate(kt);
          }),
          St
        );
      };
    }
    var x_ = Dr(),
      w_ = Dr({ defaultModifiers: [El, Ll, Ol, Cl] }),
      Nl = Dr({ defaultModifiers: [El, Ll, Ol, Cl, ku, vu, Cu, pu, Su] });
    const Pu = Object.freeze(
        Object.defineProperty(
          {
            __proto__: null,
            afterMain: iu,
            afterRead: eu,
            afterWrite: au,
            applyStyles: Cl,
            arrow: pu,
            auto: Ar,
            basePlacements: wi,
            beforeMain: su,
            beforeRead: Qd,
            beforeWrite: ou,
            bottom: ns,
            clippingParents: Jd,
            computeStyles: Ol,
            createPopper: Nl,
            createPopperBase: x_,
            createPopperLite: w_,
            detectOverflow: Pi,
            end: Si,
            eventListeners: El,
            flip: vu,
            hide: Su,
            left: Ve,
            main: nu,
            modifierPhases: lu,
            offset: ku,
            placements: Sl,
            popper: ki,
            popperGenerator: Dr,
            popperOffsets: Ll,
            preventOverflow: Cu,
            read: tu,
            reference: Zd,
            right: is,
            start: Bn,
            top: je,
            variationPlacements: wl,
            viewport: xl,
            write: ru
          },
          Symbol.toStringTag,
          { value: 'Module' }
        )
      ),
      Ou = 'dropdown',
      Vn = '.bs.dropdown',
      $l = '.data-api',
      S_ = 'ArrowUp',
      Eu = 'ArrowDown',
      k_ = `hide${Vn}`,
      C_ = `hidden${Vn}`,
      T_ = `show${Vn}`,
      A_ = `shown${Vn}`,
      Ru = `click${Vn}${$l}`,
      Du = `keydown${Vn}${$l}`,
      P_ = `keyup${Vn}${$l}`,
      Oi = 'show',
      Hn = '[data-bs-toggle="dropdown"]:not(.disabled):not(:disabled)',
      O_ = `${Hn}.${Oi}`,
      Mr = '.dropdown-menu',
      E_ = w() ? 'top-end' : 'top-start',
      R_ = w() ? 'top-start' : 'top-end',
      D_ = w() ? 'bottom-end' : 'bottom-start',
      M_ = w() ? 'bottom-start' : 'bottom-end',
      I_ = w() ? 'left-start' : 'right-start',
      L_ = w() ? 'right-start' : 'left-start',
      N_ = {
        autoClose: !0,
        boundary: 'clippingParents',
        display: 'dynamic',
        offset: [0, 2],
        popperConfig: null,
        reference: 'toggle'
      },
      $_ = {
        autoClose: '(boolean|string)',
        boundary: '(string|element)',
        display: 'string',
        offset: '(array|string|function)',
        popperConfig: '(null|object|function)',
        reference: '(string|element|object)'
      };
    class Ts extends U {
      constructor(d, p) {
        (super(d, p),
          (this._popper = null),
          (this._parent = this._element.parentNode),
          (this._menu =
            B.next(this._element, Mr)[0] ||
            B.prev(this._element, Mr)[0] ||
            B.findOne(Mr, this._parent)),
          (this._inNavbar = this._detectNavbar()));
      }
      static get Default() {
        return N_;
      }
      static get DefaultType() {
        return $_;
      }
      static get NAME() {
        return Ou;
      }
      toggle() {
        return this._isShown() ? this.hide() : this.show();
      }
      show() {
        if (f(this._element) || this._isShown()) return;
        const d = { relatedTarget: this._element };
        if (!F.trigger(this._element, T_, d).defaultPrevented) {
          if (
            (this._createPopper(),
            'ontouchstart' in document.documentElement && !this._parent.closest('.navbar-nav'))
          )
            for (const p of [].concat(...document.body.children)) F.on(p, 'mouseover', g);
          (this._element.focus(),
            this._element.setAttribute('aria-expanded', !0),
            this._menu.classList.add(Oi),
            this._element.classList.add(Oi),
            F.trigger(this._element, A_, d));
        }
      }
      hide() {
        if (f(this._element) || !this._isShown()) return;
        const d = { relatedTarget: this._element };
        this._completeHide(d);
      }
      dispose() {
        (this._popper && this._popper.destroy(), super.dispose());
      }
      update() {
        ((this._inNavbar = this._detectNavbar()), this._popper && this._popper.update());
      }
      _completeHide(d) {
        if (!F.trigger(this._element, k_, d).defaultPrevented) {
          if ('ontouchstart' in document.documentElement)
            for (const p of [].concat(...document.body.children)) F.off(p, 'mouseover', g);
          (this._popper && this._popper.destroy(),
            this._menu.classList.remove(Oi),
            this._element.classList.remove(Oi),
            this._element.setAttribute('aria-expanded', 'false'),
            oe.removeDataAttribute(this._menu, 'popper'),
            F.trigger(this._element, C_, d));
        }
      }
      _getConfig(d) {
        if (
          typeof (d = super._getConfig(d)).reference == 'object' &&
          !l(d.reference) &&
          typeof d.reference.getBoundingClientRect != 'function'
        )
          throw new TypeError(
            `${Ou.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`
          );
        return d;
      }
      _createPopper() {
        if (Pu === void 0)
          throw new TypeError(
            "Bootstrap's dropdowns require Popper (https://popper.js.org/docs/v2/)"
          );
        let d = this._element;
        this._config.reference === 'parent'
          ? (d = this._parent)
          : l(this._config.reference)
            ? (d = c(this._config.reference))
            : typeof this._config.reference == 'object' && (d = this._config.reference);
        const p = this._getPopperConfig();
        this._popper = Nl(d, this._menu, p);
      }
      _isShown() {
        return this._menu.classList.contains(Oi);
      }
      _getPlacement() {
        const d = this._parent;
        if (d.classList.contains('dropend')) return I_;
        if (d.classList.contains('dropstart')) return L_;
        if (d.classList.contains('dropup-center')) return 'top';
        if (d.classList.contains('dropdown-center')) return 'bottom';
        const p = getComputedStyle(this._menu).getPropertyValue('--bs-position').trim() === 'end';
        return d.classList.contains('dropup') ? (p ? R_ : E_) : p ? M_ : D_;
      }
      _detectNavbar() {
        return this._element.closest('.navbar') !== null;
      }
      _getOffset() {
        const { offset: d } = this._config;
        return typeof d == 'string'
          ? d.split(',').map((p) => Number.parseInt(p, 10))
          : typeof d == 'function'
            ? (p) => d(p, this._element)
            : d;
      }
      _getPopperConfig() {
        const d = {
          placement: this._getPlacement(),
          modifiers: [
            { name: 'preventOverflow', options: { boundary: this._config.boundary } },
            { name: 'offset', options: { offset: this._getOffset() } }
          ]
        };
        return (
          (this._inNavbar || this._config.display === 'static') &&
            (oe.setDataAttribute(this._menu, 'popper', 'static'),
            (d.modifiers = [{ name: 'applyStyles', enabled: !1 }])),
          { ...d, ...T(this._config.popperConfig, [void 0, d]) }
        );
      }
      _selectMenuItem({ key: d, target: p }) {
        const v = B.find(
          '.dropdown-menu .dropdown-item:not(.disabled):not(:disabled)',
          this._menu
        ).filter((A) => h(A));
        v.length && M(v, p, d === Eu, !v.includes(p)).focus();
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = Ts.getOrCreateInstance(this, d);
          if (typeof d == 'string') {
            if (p[d] === void 0) throw new TypeError(`No method named "${d}"`);
            p[d]();
          }
        });
      }
      static clearMenus(d) {
        if (d.button === 2 || (d.type === 'keyup' && d.key !== 'Tab')) return;
        const p = B.find(O_);
        for (const v of p) {
          const A = Ts.getInstance(v);
          if (!A || A._config.autoClose === !1) continue;
          const P = d.composedPath(),
            N = P.includes(A._menu);
          if (
            P.includes(A._element) ||
            (A._config.autoClose === 'inside' && !N) ||
            (A._config.autoClose === 'outside' && N) ||
            (A._menu.contains(d.target) &&
              ((d.type === 'keyup' && d.key === 'Tab') ||
                /input|select|option|textarea|form/i.test(d.target.tagName)))
          )
            continue;
          const W = { relatedTarget: A._element };
          (d.type === 'click' && (W.clickEvent = d), A._completeHide(W));
        }
      }
      static dataApiKeydownHandler(d) {
        const p = /input|textarea/i.test(d.target.tagName),
          v = d.key === 'Escape',
          A = [S_, Eu].includes(d.key);
        if ((!A && !v) || (p && !v)) return;
        d.preventDefault();
        const P = this.matches(Hn)
            ? this
            : B.prev(this, Hn)[0] ||
              B.next(this, Hn)[0] ||
              B.findOne(Hn, d.delegateTarget.parentNode),
          N = Ts.getOrCreateInstance(P);
        if (A) return (d.stopPropagation(), N.show(), void N._selectMenuItem(d));
        N._isShown() && (d.stopPropagation(), N.hide(), P.focus());
      }
    }
    (F.on(document, Du, Hn, Ts.dataApiKeydownHandler),
      F.on(document, Du, Mr, Ts.dataApiKeydownHandler),
      F.on(document, Ru, Ts.clearMenus),
      F.on(document, P_, Ts.clearMenus),
      F.on(document, Ru, Hn, function (b) {
        (b.preventDefault(), Ts.getOrCreateInstance(this).toggle());
      }),
      C(Ts));
    const Mu = 'backdrop',
      Iu = 'show',
      Lu = `mousedown.bs.${Mu}`,
      F_ = {
        className: 'modal-backdrop',
        clickCallback: null,
        isAnimated: !1,
        isVisible: !0,
        rootElement: 'body'
      },
      B_ = {
        className: 'string',
        clickCallback: '(function|null)',
        isAnimated: 'boolean',
        isVisible: 'boolean',
        rootElement: '(element|string)'
      };
    class Nu extends re {
      constructor(d) {
        (super(),
          (this._config = this._getConfig(d)),
          (this._isAppended = !1),
          (this._element = null));
      }
      static get Default() {
        return F_;
      }
      static get DefaultType() {
        return B_;
      }
      static get NAME() {
        return Mu;
      }
      show(d) {
        if (!this._config.isVisible) return void T(d);
        this._append();
        const p = this._getElement();
        (this._config.isAnimated && _(p),
          p.classList.add(Iu),
          this._emulateAnimation(() => {
            T(d);
          }));
      }
      hide(d) {
        this._config.isVisible
          ? (this._getElement().classList.remove(Iu),
            this._emulateAnimation(() => {
              (this.dispose(), T(d));
            }))
          : T(d);
      }
      dispose() {
        this._isAppended &&
          (F.off(this._element, Lu), this._element.remove(), (this._isAppended = !1));
      }
      _getElement() {
        if (!this._element) {
          const d = document.createElement('div');
          ((d.className = this._config.className),
            this._config.isAnimated && d.classList.add('fade'),
            (this._element = d));
        }
        return this._element;
      }
      _configAfterMerge(d) {
        return ((d.rootElement = c(d.rootElement)), d);
      }
      _append() {
        if (this._isAppended) return;
        const d = this._getElement();
        (this._config.rootElement.append(d),
          F.on(d, Lu, () => {
            T(this._config.clickCallback);
          }),
          (this._isAppended = !0));
      }
      _emulateAnimation(d) {
        E(d, this._getElement(), this._config.isAnimated);
      }
    }
    const Ir = '.bs.focustrap',
      U_ = `focusin${Ir}`,
      j_ = `keydown.tab${Ir}`,
      $u = 'backward',
      V_ = { autofocus: !0, trapElement: null },
      H_ = { autofocus: 'boolean', trapElement: 'element' };
    class Fu extends re {
      constructor(d) {
        (super(),
          (this._config = this._getConfig(d)),
          (this._isActive = !1),
          (this._lastTabNavDirection = null));
      }
      static get Default() {
        return V_;
      }
      static get DefaultType() {
        return H_;
      }
      static get NAME() {
        return 'focustrap';
      }
      activate() {
        this._isActive ||
          (this._config.autofocus && this._config.trapElement.focus(),
          F.off(document, Ir),
          F.on(document, U_, (d) => this._handleFocusin(d)),
          F.on(document, j_, (d) => this._handleKeydown(d)),
          (this._isActive = !0));
      }
      deactivate() {
        this._isActive && ((this._isActive = !1), F.off(document, Ir));
      }
      _handleFocusin(d) {
        const { trapElement: p } = this._config;
        if (d.target === document || d.target === p || p.contains(d.target)) return;
        const v = B.focusableChildren(p);
        v.length === 0
          ? p.focus()
          : this._lastTabNavDirection === $u
            ? v[v.length - 1].focus()
            : v[0].focus();
      }
      _handleKeydown(d) {
        d.key === 'Tab' && (this._lastTabNavDirection = d.shiftKey ? $u : 'forward');
      }
    }
    const Bu = '.fixed-top, .fixed-bottom, .is-fixed, .sticky-top',
      Uu = '.sticky-top',
      Lr = 'padding-right',
      ju = 'margin-right';
    class Fl {
      constructor() {
        this._element = document.body;
      }
      getWidth() {
        const d = document.documentElement.clientWidth;
        return Math.abs(window.innerWidth - d);
      }
      hide() {
        const d = this.getWidth();
        (this._disableOverFlow(),
          this._setElementAttributes(this._element, Lr, (p) => p + d),
          this._setElementAttributes(Bu, Lr, (p) => p + d),
          this._setElementAttributes(Uu, ju, (p) => p - d));
      }
      reset() {
        (this._resetElementAttributes(this._element, 'overflow'),
          this._resetElementAttributes(this._element, Lr),
          this._resetElementAttributes(Bu, Lr),
          this._resetElementAttributes(Uu, ju));
      }
      isOverflowing() {
        return this.getWidth() > 0;
      }
      _disableOverFlow() {
        (this._saveInitialAttribute(this._element, 'overflow'),
          (this._element.style.overflow = 'hidden'));
      }
      _setElementAttributes(d, p, v) {
        const A = this.getWidth();
        this._applyManipulationCallback(d, (P) => {
          if (P !== this._element && window.innerWidth > P.clientWidth + A) return;
          this._saveInitialAttribute(P, p);
          const N = window.getComputedStyle(P).getPropertyValue(p);
          P.style.setProperty(p, `${v(Number.parseFloat(N))}px`);
        });
      }
      _saveInitialAttribute(d, p) {
        const v = d.style.getPropertyValue(p);
        v && oe.setDataAttribute(d, p, v);
      }
      _resetElementAttributes(d, p) {
        this._applyManipulationCallback(d, (v) => {
          const A = oe.getDataAttribute(v, p);
          A !== null
            ? (oe.removeDataAttribute(v, p), v.style.setProperty(p, A))
            : v.style.removeProperty(p);
        });
      }
      _applyManipulationCallback(d, p) {
        if (l(d)) p(d);
        else for (const v of B.find(d, this._element)) p(v);
      }
    }
    const ps = '.bs.modal',
      z_ = `hide${ps}`,
      W_ = `hidePrevented${ps}`,
      Vu = `hidden${ps}`,
      Hu = `show${ps}`,
      K_ = `shown${ps}`,
      q_ = `resize${ps}`,
      G_ = `click.dismiss${ps}`,
      X_ = `mousedown.dismiss${ps}`,
      Y_ = `keydown.dismiss${ps}`,
      J_ = `click${ps}.data-api`,
      zu = 'modal-open',
      Wu = 'show',
      Bl = 'modal-static',
      Z_ = { backdrop: !0, focus: !0, keyboard: !0 },
      Q_ = { backdrop: '(boolean|string)', focus: 'boolean', keyboard: 'boolean' };
    class zn extends U {
      constructor(d, p) {
        (super(d, p),
          (this._dialog = B.findOne('.modal-dialog', this._element)),
          (this._backdrop = this._initializeBackDrop()),
          (this._focustrap = this._initializeFocusTrap()),
          (this._isShown = !1),
          (this._isTransitioning = !1),
          (this._scrollBar = new Fl()),
          this._addEventListeners());
      }
      static get Default() {
        return Z_;
      }
      static get DefaultType() {
        return Q_;
      }
      static get NAME() {
        return 'modal';
      }
      toggle(d) {
        return this._isShown ? this.hide() : this.show(d);
      }
      show(d) {
        this._isShown ||
          this._isTransitioning ||
          F.trigger(this._element, Hu, { relatedTarget: d }).defaultPrevented ||
          ((this._isShown = !0),
          (this._isTransitioning = !0),
          this._scrollBar.hide(),
          document.body.classList.add(zu),
          this._adjustDialog(),
          this._backdrop.show(() => this._showElement(d)));
      }
      hide() {
        this._isShown &&
          !this._isTransitioning &&
          (F.trigger(this._element, z_).defaultPrevented ||
            ((this._isShown = !1),
            (this._isTransitioning = !0),
            this._focustrap.deactivate(),
            this._element.classList.remove(Wu),
            this._queueCallback(() => this._hideModal(), this._element, this._isAnimated())));
      }
      dispose() {
        (F.off(window, ps),
          F.off(this._dialog, ps),
          this._backdrop.dispose(),
          this._focustrap.deactivate(),
          super.dispose());
      }
      handleUpdate() {
        this._adjustDialog();
      }
      _initializeBackDrop() {
        return new Nu({ isVisible: !!this._config.backdrop, isAnimated: this._isAnimated() });
      }
      _initializeFocusTrap() {
        return new Fu({ trapElement: this._element });
      }
      _showElement(d) {
        (document.body.contains(this._element) || document.body.append(this._element),
          (this._element.style.display = 'block'),
          this._element.removeAttribute('aria-hidden'),
          this._element.setAttribute('aria-modal', !0),
          this._element.setAttribute('role', 'dialog'),
          (this._element.scrollTop = 0));
        const p = B.findOne('.modal-body', this._dialog);
        (p && (p.scrollTop = 0),
          _(this._element),
          this._element.classList.add(Wu),
          this._queueCallback(
            () => {
              (this._config.focus && this._focustrap.activate(),
                (this._isTransitioning = !1),
                F.trigger(this._element, K_, { relatedTarget: d }));
            },
            this._dialog,
            this._isAnimated()
          ));
      }
      _addEventListeners() {
        (F.on(this._element, Y_, (d) => {
          d.key === 'Escape' &&
            (this._config.keyboard ? this.hide() : this._triggerBackdropTransition());
        }),
          F.on(window, q_, () => {
            this._isShown && !this._isTransitioning && this._adjustDialog();
          }),
          F.on(this._element, X_, (d) => {
            F.one(this._element, G_, (p) => {
              this._element === d.target &&
                this._element === p.target &&
                (this._config.backdrop !== 'static'
                  ? this._config.backdrop && this.hide()
                  : this._triggerBackdropTransition());
            });
          }));
      }
      _hideModal() {
        ((this._element.style.display = 'none'),
          this._element.setAttribute('aria-hidden', !0),
          this._element.removeAttribute('aria-modal'),
          this._element.removeAttribute('role'),
          (this._isTransitioning = !1),
          this._backdrop.hide(() => {
            (document.body.classList.remove(zu),
              this._resetAdjustments(),
              this._scrollBar.reset(),
              F.trigger(this._element, Vu));
          }));
      }
      _isAnimated() {
        return this._element.classList.contains('fade');
      }
      _triggerBackdropTransition() {
        if (F.trigger(this._element, W_).defaultPrevented) return;
        const d = this._element.scrollHeight > document.documentElement.clientHeight,
          p = this._element.style.overflowY;
        p === 'hidden' ||
          this._element.classList.contains(Bl) ||
          (d || (this._element.style.overflowY = 'hidden'),
          this._element.classList.add(Bl),
          this._queueCallback(() => {
            (this._element.classList.remove(Bl),
              this._queueCallback(() => {
                this._element.style.overflowY = p;
              }, this._dialog));
          }, this._dialog),
          this._element.focus());
      }
      _adjustDialog() {
        const d = this._element.scrollHeight > document.documentElement.clientHeight,
          p = this._scrollBar.getWidth(),
          v = p > 0;
        if (v && !d) {
          const A = w() ? 'paddingLeft' : 'paddingRight';
          this._element.style[A] = `${p}px`;
        }
        if (!v && d) {
          const A = w() ? 'paddingRight' : 'paddingLeft';
          this._element.style[A] = `${p}px`;
        }
      }
      _resetAdjustments() {
        ((this._element.style.paddingLeft = ''), (this._element.style.paddingRight = ''));
      }
      static jQueryInterface(d, p) {
        return this.each(function () {
          const v = zn.getOrCreateInstance(this, d);
          if (typeof d == 'string') {
            if (v[d] === void 0) throw new TypeError(`No method named "${d}"`);
            v[d](p);
          }
        });
      }
    }
    (F.on(document, J_, '[data-bs-toggle="modal"]', function (b) {
      const d = B.getElementFromSelector(this);
      (['A', 'AREA'].includes(this.tagName) && b.preventDefault(),
        F.one(d, Hu, (v) => {
          v.defaultPrevented ||
            F.one(d, Vu, () => {
              h(this) && this.focus();
            });
        }));
      const p = B.findOne('.modal.show');
      (p && zn.getInstance(p).hide(), zn.getOrCreateInstance(d).toggle(this));
    }),
      ut(zn),
      C(zn));
    const Js = '.bs.offcanvas',
      Ku = '.data-api',
      ty = `load${Js}${Ku}`,
      qu = 'show',
      Gu = 'showing',
      Xu = 'hiding',
      Yu = '.offcanvas.show',
      ey = `show${Js}`,
      sy = `shown${Js}`,
      ny = `hide${Js}`,
      Ju = `hidePrevented${Js}`,
      Zu = `hidden${Js}`,
      iy = `resize${Js}`,
      oy = `click${Js}${Ku}`,
      ry = `keydown.dismiss${Js}`,
      ay = { backdrop: !0, keyboard: !0, scroll: !1 },
      ly = { backdrop: '(boolean|string)', keyboard: 'boolean', scroll: 'boolean' };
    class Zs extends U {
      constructor(d, p) {
        (super(d, p),
          (this._isShown = !1),
          (this._backdrop = this._initializeBackDrop()),
          (this._focustrap = this._initializeFocusTrap()),
          this._addEventListeners());
      }
      static get Default() {
        return ay;
      }
      static get DefaultType() {
        return ly;
      }
      static get NAME() {
        return 'offcanvas';
      }
      toggle(d) {
        return this._isShown ? this.hide() : this.show(d);
      }
      show(d) {
        this._isShown ||
          F.trigger(this._element, ey, { relatedTarget: d }).defaultPrevented ||
          ((this._isShown = !0),
          this._backdrop.show(),
          this._config.scroll || new Fl().hide(),
          this._element.setAttribute('aria-modal', !0),
          this._element.setAttribute('role', 'dialog'),
          this._element.classList.add(Gu),
          this._queueCallback(
            () => {
              ((this._config.scroll && !this._config.backdrop) || this._focustrap.activate(),
                this._element.classList.add(qu),
                this._element.classList.remove(Gu),
                F.trigger(this._element, sy, { relatedTarget: d }));
            },
            this._element,
            !0
          ));
      }
      hide() {
        this._isShown &&
          (F.trigger(this._element, ny).defaultPrevented ||
            (this._focustrap.deactivate(),
            this._element.blur(),
            (this._isShown = !1),
            this._element.classList.add(Xu),
            this._backdrop.hide(),
            this._queueCallback(
              () => {
                (this._element.classList.remove(qu, Xu),
                  this._element.removeAttribute('aria-modal'),
                  this._element.removeAttribute('role'),
                  this._config.scroll || new Fl().reset(),
                  F.trigger(this._element, Zu));
              },
              this._element,
              !0
            )));
      }
      dispose() {
        (this._backdrop.dispose(), this._focustrap.deactivate(), super.dispose());
      }
      _initializeBackDrop() {
        const d = !!this._config.backdrop;
        return new Nu({
          className: 'offcanvas-backdrop',
          isVisible: d,
          isAnimated: !0,
          rootElement: this._element.parentNode,
          clickCallback: d
            ? () => {
                this._config.backdrop !== 'static' ? this.hide() : F.trigger(this._element, Ju);
              }
            : null
        });
      }
      _initializeFocusTrap() {
        return new Fu({ trapElement: this._element });
      }
      _addEventListeners() {
        F.on(this._element, ry, (d) => {
          d.key === 'Escape' &&
            (this._config.keyboard ? this.hide() : F.trigger(this._element, Ju));
        });
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = Zs.getOrCreateInstance(this, d);
          if (typeof d == 'string') {
            if (p[d] === void 0 || d.startsWith('_') || d === 'constructor')
              throw new TypeError(`No method named "${d}"`);
            p[d](this);
          }
        });
      }
    }
    (F.on(document, oy, '[data-bs-toggle="offcanvas"]', function (b) {
      const d = B.getElementFromSelector(this);
      if ((['A', 'AREA'].includes(this.tagName) && b.preventDefault(), f(this))) return;
      F.one(d, Zu, () => {
        h(this) && this.focus();
      });
      const p = B.findOne(Yu);
      (p && p !== d && Zs.getInstance(p).hide(), Zs.getOrCreateInstance(d).toggle(this));
    }),
      F.on(window, ty, () => {
        for (const b of B.find(Yu)) Zs.getOrCreateInstance(b).show();
      }),
      F.on(window, iy, () => {
        for (const b of B.find('[aria-modal][class*=show][class*=offcanvas-]'))
          getComputedStyle(b).position !== 'fixed' && Zs.getOrCreateInstance(b).hide();
      }),
      ut(Zs),
      C(Zs));
    const Qu = {
        '*': ['class', 'dir', 'id', 'lang', 'role', /^aria-[\w-]*$/i],
        a: ['target', 'href', 'title', 'rel'],
        area: [],
        b: [],
        br: [],
        col: [],
        code: [],
        dd: [],
        div: [],
        dl: [],
        dt: [],
        em: [],
        hr: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
        i: [],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height'],
        li: [],
        ol: [],
        p: [],
        pre: [],
        s: [],
        small: [],
        span: [],
        sub: [],
        sup: [],
        strong: [],
        u: [],
        ul: []
      },
      cy = new Set([
        'background',
        'cite',
        'href',
        'itemtype',
        'longdesc',
        'poster',
        'src',
        'xlink:href'
      ]),
      dy = /^(?!javascript:)(?:[a-z0-9+.-]+:|[^&:/?#]*(?:[/?#]|$))/i,
      uy = (b, d) => {
        const p = b.nodeName.toLowerCase();
        return d.includes(p)
          ? !cy.has(p) || !!dy.test(b.nodeValue)
          : d.filter((v) => v instanceof RegExp).some((v) => v.test(p));
      },
      hy = {
        allowList: Qu,
        content: {},
        extraClass: '',
        html: !1,
        sanitize: !0,
        sanitizeFn: null,
        template: '<div></div>'
      },
      fy = {
        allowList: 'object',
        content: 'object',
        extraClass: '(string|function)',
        html: 'boolean',
        sanitize: 'boolean',
        sanitizeFn: '(null|function)',
        template: 'string'
      },
      py = { entry: '(string|element|function|null)', selector: '(string|element)' };
    class my extends re {
      constructor(d) {
        (super(), (this._config = this._getConfig(d)));
      }
      static get Default() {
        return hy;
      }
      static get DefaultType() {
        return fy;
      }
      static get NAME() {
        return 'TemplateFactory';
      }
      getContent() {
        return Object.values(this._config.content)
          .map((d) => this._resolvePossibleFunction(d))
          .filter(Boolean);
      }
      hasContent() {
        return this.getContent().length > 0;
      }
      changeContent(d) {
        return (
          this._checkContent(d),
          (this._config.content = { ...this._config.content, ...d }),
          this
        );
      }
      toHtml() {
        const d = document.createElement('div');
        d.innerHTML = this._maybeSanitize(this._config.template);
        for (const [A, P] of Object.entries(this._config.content)) this._setContent(d, P, A);
        const p = d.children[0],
          v = this._resolvePossibleFunction(this._config.extraClass);
        return (v && p.classList.add(...v.split(' ')), p);
      }
      _typeCheckConfig(d) {
        (super._typeCheckConfig(d), this._checkContent(d.content));
      }
      _checkContent(d) {
        for (const [p, v] of Object.entries(d))
          super._typeCheckConfig({ selector: p, entry: v }, py);
      }
      _setContent(d, p, v) {
        const A = B.findOne(v, d);
        A &&
          ((p = this._resolvePossibleFunction(p))
            ? l(p)
              ? this._putElementInTemplate(c(p), A)
              : this._config.html
                ? (A.innerHTML = this._maybeSanitize(p))
                : (A.textContent = p)
            : A.remove());
      }
      _maybeSanitize(d) {
        return this._config.sanitize
          ? (function (p, v, A) {
              if (!p.length) return p;
              if (A && typeof A == 'function') return A(p);
              const P = new window.DOMParser().parseFromString(p, 'text/html'),
                N = [].concat(...P.body.querySelectorAll('*'));
              for (const W of N) {
                const J = W.nodeName.toLowerCase();
                if (!Object.keys(v).includes(J)) {
                  W.remove();
                  continue;
                }
                const rt = [].concat(...W.attributes),
                  at = [].concat(v['*'] || [], v[J] || []);
                for (const st of rt) uy(st, at) || W.removeAttribute(st.nodeName);
              }
              return P.body.innerHTML;
            })(d, this._config.allowList, this._config.sanitizeFn)
          : d;
      }
      _resolvePossibleFunction(d) {
        return T(d, [void 0, this]);
      }
      _putElementInTemplate(d, p) {
        if (this._config.html) return ((p.innerHTML = ''), void p.append(d));
        p.textContent = d.textContent;
      }
    }
    const gy = new Set(['sanitize', 'allowList', 'sanitizeFn']),
      Ul = 'fade',
      Nr = 'show',
      by = '.tooltip-inner',
      th = '.modal',
      eh = 'hide.bs.modal',
      ao = 'hover',
      jl = 'focus',
      Vl = 'click',
      _y = {
        AUTO: 'auto',
        TOP: 'top',
        RIGHT: w() ? 'left' : 'right',
        BOTTOM: 'bottom',
        LEFT: w() ? 'right' : 'left'
      },
      yy = {
        allowList: Qu,
        animation: !0,
        boundary: 'clippingParents',
        container: !1,
        customClass: '',
        delay: 0,
        fallbackPlacements: ['top', 'right', 'bottom', 'left'],
        html: !1,
        offset: [0, 6],
        placement: 'top',
        popperConfig: null,
        sanitize: !0,
        sanitizeFn: null,
        selector: !1,
        template:
          '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
        title: '',
        trigger: 'hover focus'
      },
      vy = {
        allowList: 'object',
        animation: 'boolean',
        boundary: '(string|element)',
        container: '(string|element|boolean)',
        customClass: '(string|function)',
        delay: '(number|object)',
        fallbackPlacements: 'array',
        html: 'boolean',
        offset: '(array|string|function)',
        placement: '(string|function)',
        popperConfig: '(null|object|function)',
        sanitize: 'boolean',
        sanitizeFn: '(null|function)',
        selector: '(string|boolean)',
        template: 'string',
        title: '(string|element|function)',
        trigger: 'string'
      };
    class Wn extends U {
      constructor(d, p) {
        if (Pu === void 0)
          throw new TypeError(
            "Bootstrap's tooltips require Popper (https://popper.js.org/docs/v2/)"
          );
        (super(d, p),
          (this._isEnabled = !0),
          (this._timeout = 0),
          (this._isHovered = null),
          (this._activeTrigger = {}),
          (this._popper = null),
          (this._templateFactory = null),
          (this._newContent = null),
          (this.tip = null),
          this._setListeners(),
          this._config.selector || this._fixTitle());
      }
      static get Default() {
        return yy;
      }
      static get DefaultType() {
        return vy;
      }
      static get NAME() {
        return 'tooltip';
      }
      enable() {
        this._isEnabled = !0;
      }
      disable() {
        this._isEnabled = !1;
      }
      toggleEnabled() {
        this._isEnabled = !this._isEnabled;
      }
      toggle() {
        this._isEnabled && (this._isShown() ? this._leave() : this._enter());
      }
      dispose() {
        (clearTimeout(this._timeout),
          F.off(this._element.closest(th), eh, this._hideModalHandler),
          this._element.getAttribute('data-bs-original-title') &&
            this._element.setAttribute(
              'title',
              this._element.getAttribute('data-bs-original-title')
            ),
          this._disposePopper(),
          super.dispose());
      }
      show() {
        if (this._element.style.display === 'none')
          throw new Error('Please use show on visible elements');
        if (!this._isWithContent() || !this._isEnabled) return;
        const d = F.trigger(this._element, this.constructor.eventName('show')),
          p = (m(this._element) || this._element.ownerDocument.documentElement).contains(
            this._element
          );
        if (d.defaultPrevented || !p) return;
        this._disposePopper();
        const v = this._getTipElement();
        this._element.setAttribute('aria-describedby', v.getAttribute('id'));
        const { container: A } = this._config;
        if (
          (this._element.ownerDocument.documentElement.contains(this.tip) ||
            (A.append(v), F.trigger(this._element, this.constructor.eventName('inserted'))),
          (this._popper = this._createPopper(v)),
          v.classList.add(Nr),
          'ontouchstart' in document.documentElement)
        )
          for (const P of [].concat(...document.body.children)) F.on(P, 'mouseover', g);
        this._queueCallback(
          () => {
            (F.trigger(this._element, this.constructor.eventName('shown')),
              this._isHovered === !1 && this._leave(),
              (this._isHovered = !1));
          },
          this.tip,
          this._isAnimated()
        );
      }
      hide() {
        if (
          this._isShown() &&
          !F.trigger(this._element, this.constructor.eventName('hide')).defaultPrevented
        ) {
          if (
            (this._getTipElement().classList.remove(Nr), 'ontouchstart' in document.documentElement)
          )
            for (const d of [].concat(...document.body.children)) F.off(d, 'mouseover', g);
          ((this._activeTrigger[Vl] = !1),
            (this._activeTrigger[jl] = !1),
            (this._activeTrigger[ao] = !1),
            (this._isHovered = null),
            this._queueCallback(
              () => {
                this._isWithActiveTrigger() ||
                  (this._isHovered || this._disposePopper(),
                  this._element.removeAttribute('aria-describedby'),
                  F.trigger(this._element, this.constructor.eventName('hidden')));
              },
              this.tip,
              this._isAnimated()
            ));
        }
      }
      update() {
        this._popper && this._popper.update();
      }
      _isWithContent() {
        return !!this._getTitle();
      }
      _getTipElement() {
        return (
          this.tip ||
            (this.tip = this._createTipElement(this._newContent || this._getContentForTemplate())),
          this.tip
        );
      }
      _createTipElement(d) {
        const p = this._getTemplateFactory(d).toHtml();
        if (!p) return null;
        (p.classList.remove(Ul, Nr), p.classList.add(`bs-${this.constructor.NAME}-auto`));
        const v = ((A) => {
          do A += Math.floor(1e6 * Math.random());
          while (document.getElementById(A));
          return A;
        })(this.constructor.NAME).toString();
        return (p.setAttribute('id', v), this._isAnimated() && p.classList.add(Ul), p);
      }
      setContent(d) {
        ((this._newContent = d), this._isShown() && (this._disposePopper(), this.show()));
      }
      _getTemplateFactory(d) {
        return (
          this._templateFactory
            ? this._templateFactory.changeContent(d)
            : (this._templateFactory = new my({
                ...this._config,
                content: d,
                extraClass: this._resolvePossibleFunction(this._config.customClass)
              })),
          this._templateFactory
        );
      }
      _getContentForTemplate() {
        return { [by]: this._getTitle() };
      }
      _getTitle() {
        return (
          this._resolvePossibleFunction(this._config.title) ||
          this._element.getAttribute('data-bs-original-title')
        );
      }
      _initializeOnDelegatedTarget(d) {
        return this.constructor.getOrCreateInstance(d.delegateTarget, this._getDelegateConfig());
      }
      _isAnimated() {
        return this._config.animation || (this.tip && this.tip.classList.contains(Ul));
      }
      _isShown() {
        return this.tip && this.tip.classList.contains(Nr);
      }
      _createPopper(d) {
        const p = T(this._config.placement, [this, d, this._element]),
          v = _y[p.toUpperCase()];
        return Nl(this._element, d, this._getPopperConfig(v));
      }
      _getOffset() {
        const { offset: d } = this._config;
        return typeof d == 'string'
          ? d.split(',').map((p) => Number.parseInt(p, 10))
          : typeof d == 'function'
            ? (p) => d(p, this._element)
            : d;
      }
      _resolvePossibleFunction(d) {
        return T(d, [this._element, this._element]);
      }
      _getPopperConfig(d) {
        const p = {
          placement: d,
          modifiers: [
            { name: 'flip', options: { fallbackPlacements: this._config.fallbackPlacements } },
            { name: 'offset', options: { offset: this._getOffset() } },
            { name: 'preventOverflow', options: { boundary: this._config.boundary } },
            { name: 'arrow', options: { element: `.${this.constructor.NAME}-arrow` } },
            {
              name: 'preSetPlacement',
              enabled: !0,
              phase: 'beforeMain',
              fn: (v) => {
                this._getTipElement().setAttribute('data-popper-placement', v.state.placement);
              }
            }
          ]
        };
        return { ...p, ...T(this._config.popperConfig, [void 0, p]) };
      }
      _setListeners() {
        const d = this._config.trigger.split(' ');
        for (const p of d)
          if (p === 'click')
            F.on(this._element, this.constructor.eventName('click'), this._config.selector, (v) => {
              const A = this._initializeOnDelegatedTarget(v);
              ((A._activeTrigger[Vl] = !(A._isShown() && A._activeTrigger[Vl])), A.toggle());
            });
          else if (p !== 'manual') {
            const v =
                p === ao
                  ? this.constructor.eventName('mouseenter')
                  : this.constructor.eventName('focusin'),
              A =
                p === ao
                  ? this.constructor.eventName('mouseleave')
                  : this.constructor.eventName('focusout');
            (F.on(this._element, v, this._config.selector, (P) => {
              const N = this._initializeOnDelegatedTarget(P);
              ((N._activeTrigger[P.type === 'focusin' ? jl : ao] = !0), N._enter());
            }),
              F.on(this._element, A, this._config.selector, (P) => {
                const N = this._initializeOnDelegatedTarget(P);
                ((N._activeTrigger[P.type === 'focusout' ? jl : ao] = N._element.contains(
                  P.relatedTarget
                )),
                  N._leave());
              }));
          }
        ((this._hideModalHandler = () => {
          this._element && this.hide();
        }),
          F.on(this._element.closest(th), eh, this._hideModalHandler));
      }
      _fixTitle() {
        const d = this._element.getAttribute('title');
        d &&
          (this._element.getAttribute('aria-label') ||
            this._element.textContent.trim() ||
            this._element.setAttribute('aria-label', d),
          this._element.setAttribute('data-bs-original-title', d),
          this._element.removeAttribute('title'));
      }
      _enter() {
        this._isShown() || this._isHovered
          ? (this._isHovered = !0)
          : ((this._isHovered = !0),
            this._setTimeout(() => {
              this._isHovered && this.show();
            }, this._config.delay.show));
      }
      _leave() {
        this._isWithActiveTrigger() ||
          ((this._isHovered = !1),
          this._setTimeout(() => {
            this._isHovered || this.hide();
          }, this._config.delay.hide));
      }
      _setTimeout(d, p) {
        (clearTimeout(this._timeout), (this._timeout = setTimeout(d, p)));
      }
      _isWithActiveTrigger() {
        return Object.values(this._activeTrigger).includes(!0);
      }
      _getConfig(d) {
        const p = oe.getDataAttributes(this._element);
        for (const v of Object.keys(p)) gy.has(v) && delete p[v];
        return (
          (d = { ...p, ...(typeof d == 'object' && d ? d : {}) }),
          (d = this._mergeConfigObj(d)),
          (d = this._configAfterMerge(d)),
          this._typeCheckConfig(d),
          d
        );
      }
      _configAfterMerge(d) {
        return (
          (d.container = d.container === !1 ? document.body : c(d.container)),
          typeof d.delay == 'number' && (d.delay = { show: d.delay, hide: d.delay }),
          typeof d.title == 'number' && (d.title = d.title.toString()),
          typeof d.content == 'number' && (d.content = d.content.toString()),
          d
        );
      }
      _getDelegateConfig() {
        const d = {};
        for (const [p, v] of Object.entries(this._config))
          this.constructor.Default[p] !== v && (d[p] = v);
        return ((d.selector = !1), (d.trigger = 'manual'), d);
      }
      _disposePopper() {
        (this._popper && (this._popper.destroy(), (this._popper = null)),
          this.tip && (this.tip.remove(), (this.tip = null)));
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = Wn.getOrCreateInstance(this, d);
          if (typeof d == 'string') {
            if (p[d] === void 0) throw new TypeError(`No method named "${d}"`);
            p[d]();
          }
        });
      }
    }
    C(Wn);
    const xy = '.popover-header',
      wy = '.popover-body',
      Sy = {
        ...Wn.Default,
        content: '',
        offset: [0, 8],
        placement: 'right',
        template:
          '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
        trigger: 'click'
      },
      ky = { ...Wn.DefaultType, content: '(null|string|element|function)' };
    class $r extends Wn {
      static get Default() {
        return Sy;
      }
      static get DefaultType() {
        return ky;
      }
      static get NAME() {
        return 'popover';
      }
      _isWithContent() {
        return this._getTitle() || this._getContent();
      }
      _getContentForTemplate() {
        return { [xy]: this._getTitle(), [wy]: this._getContent() };
      }
      _getContent() {
        return this._resolvePossibleFunction(this._config.content);
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = $r.getOrCreateInstance(this, d);
          if (typeof d == 'string') {
            if (p[d] === void 0) throw new TypeError(`No method named "${d}"`);
            p[d]();
          }
        });
      }
    }
    C($r);
    const Hl = '.bs.scrollspy',
      Cy = `activate${Hl}`,
      sh = `click${Hl}`,
      Ty = `load${Hl}.data-api`,
      Ei = 'active',
      zl = '[href]',
      nh = '.nav-link',
      Ay = `${nh}, .nav-item > ${nh}, .list-group-item`,
      Py = {
        offset: null,
        rootMargin: '0px 0px -25%',
        smoothScroll: !1,
        target: null,
        threshold: [0.1, 0.5, 1]
      },
      Oy = {
        offset: '(number|null)',
        rootMargin: 'string',
        smoothScroll: 'boolean',
        target: 'element',
        threshold: 'array'
      };
    class lo extends U {
      constructor(d, p) {
        (super(d, p),
          (this._targetLinks = new Map()),
          (this._observableSections = new Map()),
          (this._rootElement =
            getComputedStyle(this._element).overflowY === 'visible' ? null : this._element),
          (this._activeTarget = null),
          (this._observer = null),
          (this._previousScrollData = { visibleEntryTop: 0, parentScrollTop: 0 }),
          this.refresh());
      }
      static get Default() {
        return Py;
      }
      static get DefaultType() {
        return Oy;
      }
      static get NAME() {
        return 'scrollspy';
      }
      refresh() {
        (this._initializeTargetsAndObservables(),
          this._maybeEnableSmoothScroll(),
          this._observer ? this._observer.disconnect() : (this._observer = this._getNewObserver()));
        for (const d of this._observableSections.values()) this._observer.observe(d);
      }
      dispose() {
        (this._observer.disconnect(), super.dispose());
      }
      _configAfterMerge(d) {
        return (
          (d.target = c(d.target) || document.body),
          (d.rootMargin = d.offset ? `${d.offset}px 0px -30%` : d.rootMargin),
          typeof d.threshold == 'string' &&
            (d.threshold = d.threshold.split(',').map((p) => Number.parseFloat(p))),
          d
        );
      }
      _maybeEnableSmoothScroll() {
        this._config.smoothScroll &&
          (F.off(this._config.target, sh),
          F.on(this._config.target, sh, zl, (d) => {
            const p = this._observableSections.get(d.target.hash);
            if (p) {
              d.preventDefault();
              const v = this._rootElement || window,
                A = p.offsetTop - this._element.offsetTop;
              if (v.scrollTo) return void v.scrollTo({ top: A, behavior: 'smooth' });
              v.scrollTop = A;
            }
          }));
      }
      _getNewObserver() {
        const d = {
          root: this._rootElement,
          threshold: this._config.threshold,
          rootMargin: this._config.rootMargin
        };
        return new IntersectionObserver((p) => this._observerCallback(p), d);
      }
      _observerCallback(d) {
        const p = (N) => this._targetLinks.get(`#${N.target.id}`),
          v = (N) => {
            ((this._previousScrollData.visibleEntryTop = N.target.offsetTop), this._process(p(N)));
          },
          A = (this._rootElement || document.documentElement).scrollTop,
          P = A >= this._previousScrollData.parentScrollTop;
        this._previousScrollData.parentScrollTop = A;
        for (const N of d) {
          if (!N.isIntersecting) {
            ((this._activeTarget = null), this._clearActiveClass(p(N)));
            continue;
          }
          const W = N.target.offsetTop >= this._previousScrollData.visibleEntryTop;
          if (P && W) {
            if ((v(N), !A)) return;
          } else P || W || v(N);
        }
      }
      _initializeTargetsAndObservables() {
        ((this._targetLinks = new Map()), (this._observableSections = new Map()));
        const d = B.find(zl, this._config.target);
        for (const p of d) {
          if (!p.hash || f(p)) continue;
          const v = B.findOne(decodeURI(p.hash), this._element);
          h(v) &&
            (this._targetLinks.set(decodeURI(p.hash), p), this._observableSections.set(p.hash, v));
        }
      }
      _process(d) {
        this._activeTarget !== d &&
          (this._clearActiveClass(this._config.target),
          (this._activeTarget = d),
          d.classList.add(Ei),
          this._activateParents(d),
          F.trigger(this._element, Cy, { relatedTarget: d }));
      }
      _activateParents(d) {
        if (d.classList.contains('dropdown-item'))
          B.findOne('.dropdown-toggle', d.closest('.dropdown')).classList.add(Ei);
        else
          for (const p of B.parents(d, '.nav, .list-group'))
            for (const v of B.prev(p, Ay)) v.classList.add(Ei);
      }
      _clearActiveClass(d) {
        d.classList.remove(Ei);
        const p = B.find(`${zl}.${Ei}`, d);
        for (const v of p) v.classList.remove(Ei);
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = lo.getOrCreateInstance(this, d);
          if (typeof d == 'string') {
            if (p[d] === void 0 || d.startsWith('_') || d === 'constructor')
              throw new TypeError(`No method named "${d}"`);
            p[d]();
          }
        });
      }
    }
    (F.on(window, Ty, () => {
      for (const b of B.find('[data-bs-spy="scroll"]')) lo.getOrCreateInstance(b);
    }),
      C(lo));
    const Kn = '.bs.tab',
      Ey = `hide${Kn}`,
      Ry = `hidden${Kn}`,
      Dy = `show${Kn}`,
      My = `shown${Kn}`,
      Iy = `click${Kn}`,
      Ly = `keydown${Kn}`,
      Ny = `load${Kn}`,
      $y = 'ArrowLeft',
      ih = 'ArrowRight',
      Fy = 'ArrowUp',
      oh = 'ArrowDown',
      Wl = 'Home',
      rh = 'End',
      qn = 'active',
      ah = 'fade',
      Kl = 'show',
      lh = '.dropdown-toggle',
      ql = `:not(${lh})`,
      ch = '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]',
      Gl = `.nav-link${ql}, .list-group-item${ql}, [role="tab"]${ql}, ${ch}`,
      By = `.${qn}[data-bs-toggle="tab"], .${qn}[data-bs-toggle="pill"], .${qn}[data-bs-toggle="list"]`;
    class Gn extends U {
      constructor(d) {
        (super(d),
          (this._parent = this._element.closest('.list-group, .nav, [role="tablist"]')),
          this._parent &&
            (this._setInitialAttributes(this._parent, this._getChildren()),
            F.on(this._element, Ly, (p) => this._keydown(p))));
      }
      static get NAME() {
        return 'tab';
      }
      show() {
        const d = this._element;
        if (this._elemIsActive(d)) return;
        const p = this._getActiveElem(),
          v = p ? F.trigger(p, Ey, { relatedTarget: d }) : null;
        F.trigger(d, Dy, { relatedTarget: p }).defaultPrevented ||
          (v && v.defaultPrevented) ||
          (this._deactivate(p, d), this._activate(d, p));
      }
      _activate(d, p) {
        d &&
          (d.classList.add(qn),
          this._activate(B.getElementFromSelector(d)),
          this._queueCallback(
            () => {
              d.getAttribute('role') === 'tab'
                ? (d.removeAttribute('tabindex'),
                  d.setAttribute('aria-selected', !0),
                  this._toggleDropDown(d, !0),
                  F.trigger(d, My, { relatedTarget: p }))
                : d.classList.add(Kl);
            },
            d,
            d.classList.contains(ah)
          ));
      }
      _deactivate(d, p) {
        d &&
          (d.classList.remove(qn),
          d.blur(),
          this._deactivate(B.getElementFromSelector(d)),
          this._queueCallback(
            () => {
              d.getAttribute('role') === 'tab'
                ? (d.setAttribute('aria-selected', !1),
                  d.setAttribute('tabindex', '-1'),
                  this._toggleDropDown(d, !1),
                  F.trigger(d, Ry, { relatedTarget: p }))
                : d.classList.remove(Kl);
            },
            d,
            d.classList.contains(ah)
          ));
      }
      _keydown(d) {
        if (![$y, ih, Fy, oh, Wl, rh].includes(d.key)) return;
        (d.stopPropagation(), d.preventDefault());
        const p = this._getChildren().filter((A) => !f(A));
        let v;
        if ([Wl, rh].includes(d.key)) v = p[d.key === Wl ? 0 : p.length - 1];
        else {
          const A = [ih, oh].includes(d.key);
          v = M(p, d.target, A, !0);
        }
        v && (v.focus({ preventScroll: !0 }), Gn.getOrCreateInstance(v).show());
      }
      _getChildren() {
        return B.find(Gl, this._parent);
      }
      _getActiveElem() {
        return this._getChildren().find((d) => this._elemIsActive(d)) || null;
      }
      _setInitialAttributes(d, p) {
        this._setAttributeIfNotExists(d, 'role', 'tablist');
        for (const v of p) this._setInitialAttributesOnChild(v);
      }
      _setInitialAttributesOnChild(d) {
        d = this._getInnerElement(d);
        const p = this._elemIsActive(d),
          v = this._getOuterElement(d);
        (d.setAttribute('aria-selected', p),
          v !== d && this._setAttributeIfNotExists(v, 'role', 'presentation'),
          p || d.setAttribute('tabindex', '-1'),
          this._setAttributeIfNotExists(d, 'role', 'tab'),
          this._setInitialAttributesOnTargetPanel(d));
      }
      _setInitialAttributesOnTargetPanel(d) {
        const p = B.getElementFromSelector(d);
        p &&
          (this._setAttributeIfNotExists(p, 'role', 'tabpanel'),
          d.id && this._setAttributeIfNotExists(p, 'aria-labelledby', `${d.id}`));
      }
      _toggleDropDown(d, p) {
        const v = this._getOuterElement(d);
        if (!v.classList.contains('dropdown')) return;
        const A = (P, N) => {
          const W = B.findOne(P, v);
          W && W.classList.toggle(N, p);
        };
        (A(lh, qn), A('.dropdown-menu', Kl), v.setAttribute('aria-expanded', p));
      }
      _setAttributeIfNotExists(d, p, v) {
        d.hasAttribute(p) || d.setAttribute(p, v);
      }
      _elemIsActive(d) {
        return d.classList.contains(qn);
      }
      _getInnerElement(d) {
        return d.matches(Gl) ? d : B.findOne(Gl, d);
      }
      _getOuterElement(d) {
        return d.closest('.nav-item, .list-group-item') || d;
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = Gn.getOrCreateInstance(this);
          if (typeof d == 'string') {
            if (p[d] === void 0 || d.startsWith('_') || d === 'constructor')
              throw new TypeError(`No method named "${d}"`);
            p[d]();
          }
        });
      }
    }
    (F.on(document, Iy, ch, function (b) {
      (['A', 'AREA'].includes(this.tagName) && b.preventDefault(),
        f(this) || Gn.getOrCreateInstance(this).show());
    }),
      F.on(window, Ny, () => {
        for (const b of B.find(By)) Gn.getOrCreateInstance(b);
      }),
      C(Gn));
    const wn = '.bs.toast',
      Uy = `mouseover${wn}`,
      jy = `mouseout${wn}`,
      Vy = `focusin${wn}`,
      Hy = `focusout${wn}`,
      zy = `hide${wn}`,
      Wy = `hidden${wn}`,
      Ky = `show${wn}`,
      qy = `shown${wn}`,
      dh = 'hide',
      Fr = 'show',
      Br = 'showing',
      Gy = { animation: 'boolean', autohide: 'boolean', delay: 'number' },
      Xy = { animation: !0, autohide: !0, delay: 5e3 };
    class co extends U {
      constructor(d, p) {
        (super(d, p),
          (this._timeout = null),
          (this._hasMouseInteraction = !1),
          (this._hasKeyboardInteraction = !1),
          this._setListeners());
      }
      static get Default() {
        return Xy;
      }
      static get DefaultType() {
        return Gy;
      }
      static get NAME() {
        return 'toast';
      }
      show() {
        F.trigger(this._element, Ky).defaultPrevented ||
          (this._clearTimeout(),
          this._config.animation && this._element.classList.add('fade'),
          this._element.classList.remove(dh),
          _(this._element),
          this._element.classList.add(Fr, Br),
          this._queueCallback(
            () => {
              (this._element.classList.remove(Br),
                F.trigger(this._element, qy),
                this._maybeScheduleHide());
            },
            this._element,
            this._config.animation
          ));
      }
      hide() {
        this.isShown() &&
          (F.trigger(this._element, zy).defaultPrevented ||
            (this._element.classList.add(Br),
            this._queueCallback(
              () => {
                (this._element.classList.add(dh),
                  this._element.classList.remove(Br, Fr),
                  F.trigger(this._element, Wy));
              },
              this._element,
              this._config.animation
            )));
      }
      dispose() {
        (this._clearTimeout(),
          this.isShown() && this._element.classList.remove(Fr),
          super.dispose());
      }
      isShown() {
        return this._element.classList.contains(Fr);
      }
      _maybeScheduleHide() {
        this._config.autohide &&
          (this._hasMouseInteraction ||
            this._hasKeyboardInteraction ||
            (this._timeout = setTimeout(() => {
              this.hide();
            }, this._config.delay)));
      }
      _onInteraction(d, p) {
        switch (d.type) {
          case 'mouseover':
          case 'mouseout':
            this._hasMouseInteraction = p;
            break;
          case 'focusin':
          case 'focusout':
            this._hasKeyboardInteraction = p;
        }
        if (p) return void this._clearTimeout();
        const v = d.relatedTarget;
        this._element === v || this._element.contains(v) || this._maybeScheduleHide();
      }
      _setListeners() {
        (F.on(this._element, Uy, (d) => this._onInteraction(d, !0)),
          F.on(this._element, jy, (d) => this._onInteraction(d, !1)),
          F.on(this._element, Vy, (d) => this._onInteraction(d, !0)),
          F.on(this._element, Hy, (d) => this._onInteraction(d, !1)));
      }
      _clearTimeout() {
        (clearTimeout(this._timeout), (this._timeout = null));
      }
      static jQueryInterface(d) {
        return this.each(function () {
          const p = co.getOrCreateInstance(this, d);
          if (typeof d == 'string') {
            if (p[d] === void 0) throw new TypeError(`No method named "${d}"`);
            p[d](this);
          }
        });
      }
    }
    return (
      ut(co),
      C(co),
      {
        Alert: O,
        Button: z,
        Carousel: yi,
        Collapse: xi,
        Dropdown: Ts,
        Modal: zn,
        Offcanvas: Zs,
        Popover: $r,
        ScrollSpy: lo,
        Tab: Gn,
        Toast: co,
        Tooltip: Wn
      }
    );
  });
})(wF);
const Zb = Ax(Dx);
Zb.use(Jb);
Zb.mount('#app');
